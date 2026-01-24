'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X, Loader2, Shield, MessageCircle } from 'lucide-react'
import PlayerHoverCard from '@/app/components/PlayerHoverCard'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  username: string
  avatar_url: string | null
  level: number
  is_admin: boolean
  pins: Array<{ svg_code: string }> | null
  banner_svg: string | null
  frame_svg: string | null
}

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Charger les messages
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages_with_cosmetics')
        .select('*')
        .limit(50)

      if (error) throw error
      setMessages((data || []).reverse())
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  // Realtime
  useEffect(() => {
    if (!isOpen) return

    loadMessages()

    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const { data } = await supabase
          .from('chat_messages_with_cosmetics')
          .select('*')
          .eq('id', payload.new.id)
          .single()

        if (data) setMessages(prev => [...prev, data])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isOpen])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    try {
      await supabase.from('chat_messages').insert({ user_id: user.id, message: newMessage.trim() })
      setNewMessage('')
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 lg:hidden"
            style={{ zIndex: 9998 }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full lg:w-[400px] bg-gray-900 shadow-2xl flex flex-col"
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
              <div>
                <h2 className="text-xl font-black text-white">💬 Chat Global</h2>
                <p className="text-xs text-gray-400">Discutez avec la communauté</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#4578be]" />
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
                      <div className="relative rounded-xl overflow-hidden">
                        {/* Bannière TRÈS VISIBLE */}
                        {msg.banner_svg && (
                          <div className="absolute inset-0 opacity-75" dangerouslySetInnerHTML={{ __html: msg.banner_svg }} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/80 to-gray-800/70" />

                        {/* Contenu */}
                        <div className="relative flex gap-3 p-3">
                          {/* Colonne gauche : Avatar + Niveau */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            {/* Avatar avec cadre - Wrapped with PlayerHoverCard */}
                            <PlayerHoverCard userId={msg.user_id}>
                              <div className="relative cursor-help">
                                <div className={`h-10 w-10 rounded-lg overflow-hidden ${msg.frame_svg ? '' : 'border-2 border-gray-600'}`}>
                                  {msg.avatar_url ? (
                                    <img src={msg.avatar_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-sm font-bold">
                                      {msg.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                                {msg.frame_svg && (
                                  <div className="absolute pointer-events-none" style={{ top: '-2px', left: '-2px', width: '44px', height: '44px' }} dangerouslySetInnerHTML={{ __html: msg.frame_svg }} />
                                )}
                              </div>
                            </PlayerHoverCard>

                            {/* Niveau sous l'avatar */}
                            <span className="text-[9px] bg-[#4578be]/30 text-[#4578be] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                              Niv.{msg.level || 1}
                            </span>
                          </div>

                          {/* Colonne droite : Pseudo + Pins + Message */}
                          <div className="flex-1 min-w-0">
                            {/* Ligne 1 : Pseudo + Badges + Time */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {/* Pseudo */}
                              <span className={`font-bold text-sm ${msg.is_admin ? 'text-red-400' : 'text-white'}`}>
                                {msg.username || 'Anonyme'}
                              </span>
                              
                              {/* Badge admin */}
                              {msg.is_admin && <Shield className="h-3 w-3 text-red-400" />}
                              
                              {/* Timestamp - N'affiche RIEN si < 1 minute */}
                              {(() => {
                                const messageDate = new Date(msg.created_at)
                                const now = new Date()
                                const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000)
                                
                                if (diffInSeconds < 60) {
                                  return null // N'affiche RIEN
                                }
                                
                                return (
                                  <span className="text-[10px] text-gray-500 ml-auto">
                                    {formatDistanceToNow(messageDate, { addSuffix: true, locale: fr })}
                                  </span>
                                )
                              })()}
                            </div>
                            
                            {/* Ligne 2 : PINS entre pseudo et message */}
                            {(msg.pins || []).length > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                {(msg.pins || []).slice(0, 4).map((pin, i) => (
                                  <div 
                                    key={i}
                                    className="bg-gray-900/70 rounded border border-gray-700"
                                    style={{ 
                                      width: '22px',
                                      height: '22px',
                                      padding: '2px',
                                      overflow: 'hidden',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <div 
                                      style={{
                                        width: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transform: 'scale(0.9)',
                                        transformOrigin: 'center'
                                      }}
                                      dangerouslySetInnerHTML={{ __html: pin.svg_code }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Ligne 3 : Message */}
                            <p className="text-gray-200 text-sm break-words leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="bg-gray-800 p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    !user 
                      ? "Connectez-vous" 
                      : (profile?.level || 1) < 2 
                        ? "🔒 Niveau 2 requis"
                        : "Message..."
                  }
                  disabled={!user || sending || (profile?.level || 1) < 2}
                  className="flex-1 bg-gray-700/50 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:border-[#4578be] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={200}
                />
                <button 
                  type="submit" 
                  disabled={!user || !newMessage.trim() || sending || (profile?.level || 1) < 2} 
                  className="bg-[#4578be] text-white px-4 py-2 rounded-lg hover:bg-[#5989d8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-gray-500">{newMessage.length}/200</p>
                {user && (profile?.level || 1) < 2 && (
                  <p className="text-[10px] text-yellow-500">⚠️ Atteignez le niveau 2 pour discuter</p>
                )}
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-all z-30 hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}