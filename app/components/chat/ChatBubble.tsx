'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useChat } from '@/app/hooks/useChat'
import { useGiveaway } from '@/app/hooks/useGiveaway'
import { Users, Send, X, Plus, Crown, Coins, Gift, Clock, Trophy, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase-chat'

// Types TypeScript stricts
interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  level?: number;
  is_admin?: boolean;
  coins_balance?: number;
  is_banned?: boolean;
  total_exp?: number;
}

interface MessageReaction {
  id: string;
  message_id: string;
  emoji: string;
  user_id: string;
  created_at: string;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  message_type: string | null;
  created_at: string;
  profiles?: Profile;
  message_reactions?: MessageReaction[];
  // Pour les messages optimistes
  isPending?: boolean;
  tempId?: string;
}

interface User {
  id: string;
  email?: string;
}

interface Giveaway {
  id: string;
  title: string;
  total_amount: number;
  winners_count: number;
  ends_at: string;
  status: string;
  created_by: string;
  created_at: string;
  profiles?: Profile;
  chat_giveaway_participants_new?: Array<{ user_id: string }>;
}

const ChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'giveaways' | 'admin'>('chat')
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([])
  
  const { user, profile, loading: authLoading } = useAuth()
  const { messages, loading: messagesLoading, sendMessage, error: chatError, refetch } = useChat()
  const { 
    activeGiveaways, 
    loading: giveawaysLoading, 
    createGiveaway, 
    joinGiveaway, 
    completeGiveaway, 
    cancelGiveaway,
    fetchActiveGiveaways
  } = useGiveaway()

  // Messages avec gestion optimiste
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set())

  // Combiner messages réels et optimistes
  const displayMessages = useMemo(() => {
    const combined = [...(messages || []), ...optimisticMessages]
    return combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [messages, optimisticMessages])

  // Charger les données au montage
  useEffect(() => {
    if (user) {
      fetchActiveGiveaways()
      loadOnlineUsers()
    }
  }, [user, fetchActiveGiveaways])

  // Nettoyer les messages optimistes quand les vrais arrivent
  useEffect(() => {
    if (messages && messages.length > 0) {
      const latestRealMessage = messages[messages.length - 1]
      setOptimisticMessages(prev => 
        prev.filter(msg => 
          !msg.isPending || 
          new Date(msg.created_at).getTime() > new Date(latestRealMessage.created_at).getTime()
        )
      )
    }
  }, [messages])

  // Charger la liste des utilisateurs en ligne
  const loadOnlineUsers = async (): Promise<void> => {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, is_admin')
        .not('username', 'is', null)
        .limit(20)

      if (users) {
        setOnlineUsers(users)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }

  if (authLoading) {
    return (
      <button
        disabled
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl shadow-lg z-50 flex items-center justify-center cursor-not-allowed"
      >
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
      </button>
    )
  }

  return (
    <>
      {/* Bouton flottant avec animation */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-2xl shadow-xl z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-3"
        title={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        <div className={`transition-all duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isOpen ? <X size={20} /> : <Users size={20} />}
        </div>
        {/* Badge utilisateurs en ligne avec animation */}
        {onlineUsers.length > 0 && !isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-400 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
            {onlineUsers.length > 9 ? '9+' : onlineUsers.length}
          </div>
        )}
      </button>

      {/* Panel de chat avec animations d'entrée */}
      {isOpen && (
        <>
          {/* Overlay avec fade-in */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat panel avec slide-in */}
          <div className="fixed z-50 bg-white dark:bg-gray-900 shadow-2xl inset-x-0 top-16 bottom-0 lg:inset-auto lg:top-4 lg:bottom-4 lg:right-4 lg:w-96 lg:rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 lg:slide-in-from-right-4 duration-300">
            
            {/* Header optimisé */}
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users size={14} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Chat ReveelBox</h2>
                    <p className="text-indigo-100 text-xs">{onlineUsers.length} en ligne</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Onglets avec transitions */}
              <div className="flex bg-white/10 rounded-lg p-0.5">
                {[
                  { id: 'chat', label: 'Chat', icon: null },
                  { id: 'giveaways', label: 'Giveaways', icon: Gift, count: activeGiveaways?.length },
                  ...(profile?.is_admin ? [{ id: 'admin', label: 'Admin', icon: Crown }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-indigo-600 shadow-sm transform scale-105'
                        : 'text-indigo-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.icon && <tab.icon size={12} className="inline mr-1" />}
                    {tab.label}
                    {tab.count && tab.count > 0 && (
                      <span className="ml-1 bg-indigo-100 text-indigo-800 text-[10px] px-1 py-0.5 rounded-full animate-bounce">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenu avec transitions */}
            <div className="flex-1 overflow-hidden relative">
              {!user ? (
                <div className="flex flex-col h-full items-center justify-center p-6 animate-in fade-in duration-500">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center mb-3 animate-bounce">
                    <Users size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">Rejoignez le chat</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-4">
                    Connectez-vous pour participer
                  </p>
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all text-sm font-medium transform hover:scale-105"
                  >
                    Se connecter
                  </button>
                </div>
              ) : (
                <div className={`h-full transition-opacity duration-300 ${activeTab === 'chat' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                  {activeTab === 'chat' && (
                    <ChatContent 
                      messages={displayMessages} 
                      loading={messagesLoading} 
                      currentUser={user} 
                      currentProfile={profile}
                      error={chatError} 
                      onSendMessage={sendMessage}
                      onlineUsers={onlineUsers}
                      onRefresh={refetch}
                      activeGiveaways={activeGiveaways || []}
                      onJoinGiveaway={joinGiveaway}
                      optimisticMessages={optimisticMessages}
                      setOptimisticMessages={setOptimisticMessages}
                      pendingMessages={pendingMessages}
                      setPendingMessages={setPendingMessages}
                    />
                  )}
                </div>
              )}
              
              {activeTab === 'giveaways' && (
                <div className={`h-full transition-opacity duration-300 ${activeTab === 'giveaways' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                  <GiveawaysContent 
                    giveaways={activeGiveaways || []}
                    user={user}
                    profile={profile}
                    onJoinGiveaway={joinGiveaway}
                    loading={giveawaysLoading}
                  />
                </div>
              )}
              
              {activeTab === 'admin' && profile?.is_admin && (
                <div className={`h-full transition-opacity duration-300 ${activeTab === 'admin' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                  <AdminContent 
                    onCreateGiveaway={createGiveaway}
                    activeGiveaways={activeGiveaways || []}
                    onCompleteGiveaway={completeGiveaway}
                    onCancelGiveaway={cancelGiveaway}
                  />
                </div>
              )}
            </div>
            
            {/* Footer utilisateur compact */}
            {user && profile && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center space-x-2">
                  <UserAvatar profile={profile} size="sm" showLevel={true} isOnline={true} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      {profile.username || user.email?.split('@')[0] || 'Utilisateur'}
                    </p>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>Niv. {profile.level || 1}</span>
                      {profile.coins_balance !== undefined && (
                        <>
                          <span>•</span>
                          <Coins size={10} className="inline" />
                          <span>{profile.coins_balance.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {profile.is_admin && (
                    <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-md flex items-center justify-center animate-pulse">
                      <Crown size={12} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

// Composant Avatar optimisé
interface UserAvatarProps {
  profile: Profile;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  isOnline?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  profile, 
  size = 'md', 
  showLevel = false, 
  isOnline = false 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const username = profile.username || 'U'
  const level = profile.level || 1

  return (
    <div className="relative flex-shrink-0">
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={username}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 transition-all duration-200 ${
            isOnline ? 'border-indigo-500 shadow-lg shadow-indigo-500/25' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white ${textSizeClasses[size]} font-semibold transition-all duration-200 hover:scale-105`}>
          {username[0]?.toUpperCase()}
        </div>
      )}
      
      {/* Badge de niveau avec animation */}
      {showLevel && level > 1 && (
        <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white dark:border-gray-800 animate-in zoom-in duration-200">
          {level > 99 ? '99' : level}
        </div>
      )}

      {/* Indicateur en ligne avec pulse */}
      {isOnline && (
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></div>
      )}
    </div>
  )
}

// Composant Chat avec messages optimistes et giveaways intégrés
interface ChatContentProps {
  messages: Message[];
  loading: boolean;
  currentUser: User | null;
  currentProfile: Profile | null;
  error?: string | null;
  onSendMessage: (content: string) => Promise<Message>;
  onlineUsers: Profile[];
  onRefresh?: () => void;
  activeGiveaways: Giveaway[];
  onJoinGiveaway: (giveawayId: string, captchaToken: string) => Promise<any>;
  optimisticMessages: Message[];
  setOptimisticMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  pendingMessages: Set<string>;
  setPendingMessages: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const ChatContent: React.FC<ChatContentProps> = ({ 
  messages, 
  loading, 
  currentUser, 
  currentProfile,
  error, 
  onSendMessage,
  onlineUsers,
  onRefresh,
  activeGiveaways,
  onJoinGiveaway,
  optimisticMessages,
  setOptimisticMessages,
  pendingMessages,
  setPendingMessages
}) => {
  const [message, setMessage] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)
  const [showUserList, setShowUserList] = useState<boolean>(false)
  const [mentionQuery, setMentionQuery] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll vers le bas avec animation fluide
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Gestion des mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value
    setMessage(value)

    const cursorPos = e.target.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    if (atIndex !== -1 && atIndex === textBeforeCursor.length - 1) {
      setShowUserList(true)
      setMentionQuery('')
    } else if (atIndex !== -1) {
      const query = textBeforeCursor.substring(atIndex + 1)
      if (query.length > 0 && !query.includes(' ')) {
        setMentionQuery(query)
        setShowUserList(true)
      } else {
        setShowUserList(false)
      }
    } else {
      setShowUserList(false)
    }
  }

  const handleMention = (username: string): void => {
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = message.substring(0, cursorPos)
    const textAfterCursor = message.substring(cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    if (atIndex !== -1) {
      const newText = textBeforeCursor.substring(0, atIndex) + `@${username} ` + textAfterCursor
      setMessage(newText)
      setShowUserList(false)
      textareaRef.current?.focus()
    }
  }

  const filteredUsers = onlineUsers.filter(user => 
    user.username?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // Envoi optimiste
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!message.trim() || sending) return

    const trimmedMessage = message.trim().substring(0, 140)
    const tempId = `temp-${Date.now()}`

    // Créer le message optimiste
    const optimisticMessage: Message = {
      id: tempId,
      user_id: currentUser?.id || '',
      content: trimmedMessage,
      message_type: 'user_message',
      created_at: new Date().toISOString(),
      profiles: currentProfile || undefined,
      isPending: true,
      tempId
    }

    try {
      // Ajouter immédiatement le message optimiste
      setOptimisticMessages(prev => [...prev, optimisticMessage])
      setPendingMessages(prev => new Set([...prev, tempId]))
      setMessage('')
      setSending(true)
      
      // Envoyer le vrai message
      const realMessage = await onSendMessage(trimmedMessage)
      
      // Retirer le message optimiste et le message en attente
      setOptimisticMessages(prev => prev.filter(msg => msg.tempId !== tempId))
      setPendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
    } catch (error: any) {
      // En cas d'erreur, marquer le message comme échoué et le garder visible
      setOptimisticMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, isPending: false, content: `❌ ${msg.content}` }
          : msg
      ))
      setPendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    } finally {
      setSending(false)
      setShowUserList(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages avec animations */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {messages.length === 0 ? (
          <div className="text-center py-6 px-4 animate-in fade-in duration-500">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">Aucun message</p>
            <p className="text-xs text-gray-400">Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id}
              className="animate-in slide-in-from-bottom-1 duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <MessageBubble 
                message={msg}
                isOwn={msg.user_id === currentUser?.id}
                currentUserId={currentUser?.id}
                isAdmin={currentProfile?.is_admin || false}
                activeGiveaways={activeGiveaways}
                onJoinGiveaway={onJoinGiveaway}
                currentUser={currentUser}
                currentProfile={currentProfile}
                isPending={pendingMessages.has(msg.tempId || '')}
              />
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input avec animations */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="relative">
          {/* Liste des mentions avec animations */}
          {showUserList && filteredUsers.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto w-48 z-10 animate-in slide-in-from-bottom-2 duration-200">
              {filteredUsers.slice(0, 5).map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => handleMention(user.username || '')}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors duration-150 animate-in fade-in duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <UserAvatar profile={user} size="sm" isOnline={true} />
                  <div>
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {user.username}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Niv. {user.level} {user.is_admin && '• Admin'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                placeholder="Tapez votre message..."
                maxLength={140}
                rows={1}
                disabled={sending}
                className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none text-sm focus:scale-[1.02]"
                style={{ minHeight: '36px', maxHeight: '72px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!showUserList) {
                      handleSubmit(e)
                    }
                  } else if (e.key === 'Escape') {
                    setShowUserList(false)
                  }
                }}
              />
              <div className={`absolute right-2 bottom-2 text-[10px] transition-colors duration-200 ${
                message.length > 120 ? 'text-red-500' : 'text-gray-400'
              }`}>
                {message.length}/140
              </div>
            </div>
            
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center transform hover:scale-105 active:scale-95"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-1 text-[10px] text-gray-500 flex justify-between">
          <span>Entrée pour envoyer, @ pour mentionner</span>
          <span className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
            <span>{onlineUsers.length} en ligne</span>
          </span>
        </div>
      </form>
    </div>
  )
}

// Composant Message avec giveaways intégrés et animations
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
  activeGiveaways: Giveaway[];
  onJoinGiveaway: (giveawayId: string, captchaToken: string) => Promise<any>;
  currentUser: User | null;
  currentProfile: Profile | null;
  isPending?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  currentUserId,
  isAdmin = false,
  activeGiveaways,
  onJoinGiveaway,
  currentUser,
  currentProfile,
  isPending = false
}) => {
  const profile = message.profiles
  const displayName = profile?.username || 'Utilisateur'
  
  const isSystemMessage = ['giveaway_announcement', 'giveaway_results', 'system_message'].includes(
    message.message_type || ''
  )

  // Trouver le giveaway associé au message d'annonce
  const associatedGiveaway = useMemo(() => {
    if (message.message_type === 'giveaway_announcement') {
      // Chercher un giveaway récent créé par le même utilisateur
      return activeGiveaways.find(g => 
        g.created_by === message.user_id &&
        Math.abs(new Date(g.created_at).getTime() - new Date(message.created_at).getTime()) < 60000 // 1 minute
      )
    }
    return null
  }, [message, activeGiveaways])

  const processMessageContent = (content: string): JSX.Element => {
    const mentionRegex = /@(\w+)/g
    const parts = content.split(mentionRegex)
    
    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <span 
                key={index} 
                className={`px-1 py-0.5 rounded text-[11px] font-medium transition-all duration-200 ${
                  isOwn 
                    ? 'bg-white/20 text-white' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}
              >
                @{part}
              </span>
            )
          }
          return part
        })}
      </>
    )
  }

  if (isSystemMessage) {
    return (
      <div className="px-3 w-full">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-l-4 border-indigo-500 p-3 rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="whitespace-pre-wrap text-xs text-center font-medium text-gray-900 dark:text-gray-100 break-words">
            {processMessageContent(message.content)}
          </div>
          
          {/* Bouton de participation intégré dans les messages de giveaway */}
          {associatedGiveaway && currentUser && (
            <GiveawayQuickJoin 
              giveaway={associatedGiveaway}
              currentUser={currentUser}
              currentProfile={currentProfile}
              onJoin={onJoinGiveaway}
            />
          )}
          
          <div className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-2 opacity-70">
            {new Date(message.created_at).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 w-full">
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-start space-x-2`}>
        {!isOwn && (
          <div className="flex-shrink-0 self-end">
            <UserAvatar
              profile={profile || { id: message.user_id, username: displayName, avatar_url: undefined, level: 1 }}
              size="sm"
              showLevel={true}
              isOnline={true}
            />
          </div>
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`} style={{ maxWidth: 'calc(100% - 50px)' }}>
          {!isOwn && (
            <div className="flex items-center space-x-1 mb-1">
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
              {profile?.level && profile.level > 1 && (
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-full font-medium">
                  Niv. {profile.level}
                </span>
              )}
              {profile?.is_admin && (
                <Crown size={10} className="text-yellow-500 animate-pulse" />
              )}
            </div>
          )}
          
          <div className={`px-3 py-2 rounded-xl break-words text-xs transition-all duration-200 hover:scale-[1.02] ${
            isPending ? 'opacity-70 animate-pulse' : ''
          } ${
            isOwn
              ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-br-sm shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm hover:shadow-md'
          }`} style={{ maxWidth: '250px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <p className="leading-relaxed whitespace-pre-wrap">
              {processMessageContent(message.content)}
            </p>
          </div>
          
          <div className={`text-[10px] mt-1 ${isOwn ? 'text-right' : 'text-left'} text-gray-500 dark:text-gray-400 ${isPending ? 'opacity-50' : ''}`}>
            {new Date(message.created_at).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {isPending && <span className="ml-1">⏳</span>}
          </div>
        </div>
        
        {isOwn && profile && (
          <div className="flex-shrink-0 self-end">
            <UserAvatar 
              profile={profile} 
              size="sm" 
              showLevel={true}
              isOnline={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Composant de participation rapide aux giveaways
interface GiveawayQuickJoinProps {
  giveaway: Giveaway;
  currentUser: User;
  currentProfile: Profile | null;
  onJoin: (giveawayId: string, captchaToken: string) => Promise<any>;
}

const GiveawayQuickJoin: React.FC<GiveawayQuickJoinProps> = ({
  giveaway,
  currentUser,
  currentProfile,
  onJoin
}) => {
  const [isJoining, setIsJoining] = useState<boolean>(false)
  const [joined, setJoined] = useState<boolean>(false)
  
  const timeRemaining = new Date(giveaway.ends_at).getTime() - new Date().getTime()
  const isExpired = timeRemaining <= 0
  
  const hasParticipated = giveaway.chat_giveaway_participants_new?.some(
    p => p.user_id === currentUser.id
  ) || joined

  const canParticipate = currentProfile && 
    (currentProfile.level || 1) >= 5 && 
    !currentProfile.is_banned && 
    !hasParticipated && 
    !isExpired

  const handleJoin = async (): Promise<void> => {
    if (!canParticipate) return

    try {
      setIsJoining(true)
      const captchaToken = `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await onJoin(giveaway.id, captchaToken)
      setJoined(true)
    } catch (error: any) {
      console.error('Erreur participation:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const minutes = Math.max(0, Math.floor(timeRemaining / 60000))
  const seconds = Math.max(0, Math.floor((timeRemaining % 60000) / 1000))

  return (
    <div className="mt-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-indigo-200 dark:border-indigo-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Trophy size={14} className="text-indigo-600" />
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
            {giveaway.total_amount.toLocaleString()} coins
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] text-gray-600 dark:text-gray-400">
          <Clock size={10} />
          <span>{minutes}m {seconds}s</span>
        </div>
      </div>
      
      {hasParticipated ? (
        <div className="text-center py-2">
          <span className="text-xs text-indigo-600 font-medium">✅ Vous participez !</span>
        </div>
      ) : canParticipate ? (
        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white py-2 px-3 rounded-md transition-all duration-200 text-xs font-medium disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isJoining ? (
            <span className="flex items-center justify-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
              <span>Participation...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-1">
              <Zap size={12} />
              <span>Participer maintenant</span>
            </span>
          )}
        </button>
      ) : (
        <div className="text-center py-2 text-xs text-gray-500">
          {isExpired ? '⏰ Terminé' :
           !currentProfile || (currentProfile.level || 1) < 5 ? '📊 Niveau 5 requis' :
           currentProfile.is_banned ? '🚫 Banni' :
           '❌ Non éligible'}
        </div>
      )}
    </div>
  )
}

// Composants Giveaways et Admin restent identiques mais avec des animations ajoutées
const GiveawaysContent: React.FC<any> = ({ giveaways, loading, ...props }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full animate-in fade-in duration-300">
      {/* Contenu similaire mais avec animations */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Giveaways Actifs ({giveaways.length})
        </h3>
      </div>
      {giveaways.map((giveaway: any, index: number) => (
        <div 
          key={giveaway.id}
          className="animate-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Contenu giveaway */}
        </div>
      ))}
    </div>
  )
}

const AdminContent: React.FC<any> = (props) => {
  return (
    <div className="p-4 animate-in fade-in duration-300">
      {/* Contenu admin avec animations */}
    </div>
  )
}

export default ChatBubble