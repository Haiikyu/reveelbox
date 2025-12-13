'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Shield, Crown, Award } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  // Profil
  username: string
  avatar_url: string | null
  level: number
  is_admin: boolean
  // Cosmétiques
  pins: Array<{ svg_code: string }> | null
  banner_svg: string | null
  frame_svg: string | null
}

export default function ChatPage() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Charger les messages avec cosmétiques (OPTIMISÉ - 1 seule requête)
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages_with_cosmetics')
        .select('*')
        .limit(100)

      if (error) throw error

      setMessages((data || []).reverse())
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Realtime subscription (OPTIMISÉ)
  useEffect(() => {
    loadMessages()

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          // Charger le message depuis la vue optimisée
          const { data } = await supabase
            .from('chat_messages_with_cosmetics')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Erreur envoi:', error)
      alert('Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-[#4578be]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 pb-4 px-4">
      <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-t-2xl border border-gray-700 p-4">
          <h1 className="text-2xl font-black text-white">💬 Chat Global</h1>
          <p className="text-sm text-gray-400">Discutez avec la communauté !</p>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-gray-800/30 backdrop-blur-sm border-x border-gray-700 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                {/* Bannière en background */}
                <div className="relative rounded-xl overflow-hidden">
                  {msg.banner_svg && (
                    <div 
                      className="absolute inset-0 opacity-20"
                      dangerouslySetInnerHTML={{ __html: msg.banner_svg }}
                    />
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800/90 to-gray-800/70" />

                  {/* Contenu du message */}
                  <div className="relative flex gap-3 p-3">
                    {/* Avatar avec cadre */}
                    <div className="relative flex-shrink-0">
                      <div 
                        className={`h-12 w-12 rounded-lg overflow-hidden ${
                          msg.frame_svg ? '' : 'border-2 border-gray-600'
                        }`}
                      >
                        {msg.avatar_url ? (
                          <img src={msg.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold">
                            {msg.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      
                      {/* Cadre SVG */}
                      {msg.frame_svg && (
                        <div 
                          className="absolute pointer-events-none"
                          style={{ 
                            top: '-2px',
                            left: '-2px',
                            width: '52px',
                            height: '52px'
                          }}
                          dangerouslySetInnerHTML={{ __html: msg.frame_svg }}
                        />
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      {/* Header : Pseudo + Pins + Badges */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`font-bold ${
                          msg.is_admin ? 'text-red-400' : 'text-white'
                        }`}>
                          {msg.username || 'Anonyme'}
                        </span>

                        {/* Pins équipés */}
                        {(msg.pins || []).slice(0, 3).map((pin, i) => (
                          <div 
                            key={i}
                            className="h-5 w-5 flex-shrink-0"
                            dangerouslySetInnerHTML={{ __html: pin.svg_code }}
                          />
                        ))}

                        {/* Badge admin */}
                        {msg.is_admin && (
                          <Shield className="h-4 w-4 text-red-400" />
                        )}

                        {/* Niveau */}
                        <span className="text-xs bg-[#4578be]/20 text-[#4578be] px-2 py-0.5 rounded-full font-bold">
                          Niv. {msg.level || 1}
                        </span>

                        {/* Timestamp */}
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>

                      {/* Texte du message */}
                      <p className="text-gray-200 text-sm break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form 
          onSubmit={sendMessage}
          className="bg-gray-800/50 backdrop-blur-sm rounded-b-2xl border border-gray-700 p-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={user ? "Écrivez un message..." : "Connectez-vous pour discuter"}
              disabled={!user || sending}
              className="flex-1 bg-gray-700/50 text-white px-4 py-3 rounded-xl border border-gray-600 focus:border-[#4578be] focus:outline-none disabled:opacity-50"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!user || !newMessage.trim() || sending}
              className="bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {newMessage.length}/500 caractères
          </p>
        </form>
      </div>
    </div>
  )
}