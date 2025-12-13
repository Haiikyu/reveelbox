import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase-chat'
import type { Message, Profile, TypingUser, Room, ChatState } from '@/app/components/chat/v2/types'

const MESSAGES_PER_PAGE = 50
const TYPING_TIMEOUT = 3000

export const useChatV2 = (roomId?: string) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    users: [],
    typingUsers: [],
    activeRoom: null,
    loading: true,
    error: null,
    hasMore: true,
    page: 1
  })

  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isLoadingRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  // Charger le room ID par défaut
  const getDefaultRoomId = useCallback(async (): Promise<string | null> => {
    try {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('id, name, description, is_active, created_at')
        .eq('name', 'Global')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)

      if (error || !rooms || rooms.length === 0) {
        console.error('Erreur récupération room:', error)
        return null
      }

      setState(prev => ({ ...prev, activeRoom: rooms[0] }))
      return rooms[0].id
    } catch (error) {
      console.error('Erreur getDefaultRoomId:', error)
      return null
    }
  }, [])

  // Charger les messages avec pagination
  const loadMessages = useCallback(async (page = 1, append = false): Promise<void> => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const activeRoomId = roomId || await getDefaultRoomId()
      if (!activeRoomId) {
        throw new Error('No active room found')
      }

      const offset = (page - 1) * MESSAGES_PER_PAGE

      // Charger les messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages_new')
        .select('id, user_id, content, message_type, created_at, updated_at, deleted_at, reply_to_id')
        .eq('room_id', activeRoomId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + MESSAGES_PER_PAGE - 1)

      if (messagesError) throw messagesError

      if (!messages || messages.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          hasMore: false,
          messages: append ? prev.messages : []
        }))
        isLoadingRef.current = false
        return
      }

      // Récupérer les profils des utilisateurs
      const userIds = [...new Set(messages.map(msg => msg.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, is_admin, is_banned, total_exp')
        .in('id', userIds)

      const profilesMap = new Map<string, Profile>()
      profiles?.forEach(profile => profilesMap.set(profile.id, profile))

      // Enrichir les messages
      const enrichedMessages: Message[] = messages.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || {
          id: msg.user_id,
          username: 'Utilisateur',
          level: 1
        }
      })).reverse()

      setState(prev => ({
        ...prev,
        messages: append ? [...prev.messages, ...enrichedMessages] : enrichedMessages,
        loading: false,
        hasMore: messages.length === MESSAGES_PER_PAGE,
        page
      }))

    } catch (error: any) {
      console.error('Erreur loadMessages:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur de chargement'
      }))
    } finally {
      isLoadingRef.current = false
    }
  }, [roomId, getDefaultRoomId])

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, replyToId?: string): Promise<void> => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Non authentifié')
      }

      const trimmedContent = content.trim()
      if (!trimmedContent) return

      const activeRoomId = roomId || state.activeRoom?.id
      if (!activeRoomId) {
        throw new Error('No active room')
      }

      // Message optimiste
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const optimisticMessage: Message = {
        id: tempId,
        user_id: user.id,
        content: trimmedContent,
        message_type: 'user_message',
        created_at: new Date().toISOString(),
        isPending: true,
        tempId,
        reply_to_id: replyToId
      }

      // Ajouter le message optimiste
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage]
      }))

      // Envoyer le vrai message
      const { error: insertError } = await supabase
        .from('chat_messages_new')
        .insert({
          room_id: activeRoomId,
          user_id: user.id,
          content: trimmedContent,
          message_type: 'user_message',
          reply_to_id: replyToId
        })

      if (insertError) {
        // Marquer comme échoué
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.tempId === tempId
              ? { ...msg, isPending: false, isFailed: true }
              : msg
          )
        }))
        throw insertError
      }

      // Le message réel arrivera via subscription, retirer l'optimiste
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          messages: prev.messages.filter(msg => msg.tempId !== tempId)
        }))
      }, 1000)

    } catch (error: any) {
      console.error('Erreur sendMessage:', error)
      throw error
    }
  }, [roomId, state.activeRoom?.id])

  // Ajouter une réaction
  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        })

      if (error) throw error
    } catch (error: any) {
      console.error('Erreur addReaction:', error)
    }
  }, [])

  // Retirer une réaction
  const removeReaction = useCallback(async (messageId: string, emoji: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)

      if (error) throw error
    } catch (error: any) {
      console.error('Erreur removeReaction:', error)
    }
  }, [])

  // Indicateur de frappe
  const setTyping = useCallback(async (isTyping: boolean): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      if (isTyping) {
        // Broadcast typing event
        const channel = supabase.channel(`room:${state.activeRoom?.id}`)
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: user.id }
        })

        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false)
        }, TYPING_TIMEOUT)
      }
    } catch (error) {
      console.error('Erreur setTyping:', error)
    }
  }, [state.activeRoom?.id])

  // Charger plus de messages (pagination infinie)
  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (!state.hasMore || state.loading) return
    await loadMessages(state.page + 1, true)
  }, [state.hasMore, state.loading, state.page, loadMessages])

  // Supprimer un message (soft delete)
  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('chat_messages_new')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('user_id', user.id)

      if (error) throw error

      // Optimistic update
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId)
      }))
    } catch (error: any) {
      console.error('Erreur deleteMessage:', error)
    }
  }, [])

  // Éditer un message
  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const trimmed = newContent.trim()
      if (!trimmed) return

      const { error } = await supabase
        .from('chat_messages_new')
        .update({
          content: trimmed,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user.id)

      if (error) throw error

      // Optimistic update
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: trimmed, updated_at: new Date().toISOString() }
            : msg
        )
      }))
    } catch (error: any) {
      console.error('Erreur editMessage:', error)
    }
  }, [])

  // Charger les utilisateurs en ligne
  const loadOnlineUsers = useCallback(async (): Promise<void> => {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, is_admin')
        .not('username', 'is', null)
        .limit(50)

      if (users) {
        setState(prev => ({ ...prev, users }))
      }
    } catch (error) {
      console.error('Erreur loadOnlineUsers:', error)
    }
  }, [])

  // Initialisation
  useEffect(() => {
    loadMessages()
    loadOnlineUsers()
  }, [loadMessages, loadOnlineUsers])

  // Subscription en temps réel
  useEffect(() => {
    const activeRoomId = state.activeRoom?.id
    if (!activeRoomId) return

    const channel = supabase
      .channel(`chat:${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages_new',
          filter: `room_id=eq.${activeRoomId}`
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Ne pas ajouter nos propres messages optimistes déjà présents
          setState(prev => {
            const exists = prev.messages.some(msg =>
              msg.id === newMessage.id ||
              (msg.tempId && msg.user_id === newMessage.user_id && msg.content === newMessage.content)
            )
            if (exists) return prev

            return {
              ...prev,
              messages: [...prev.messages, newMessage]
            }
          })

          // Charger le profil si nécessaire
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, level, is_admin, is_banned')
            .eq('id', newMessage.user_id)
            .single()

          if (profile) {
            setState(prev => ({
              ...prev,
              messages: prev.messages.map(msg =>
                msg.id === newMessage.id
                  ? { ...msg, profiles: profile }
                  : msg
              )
            }))
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { user_id } = payload

        setState(prev => {
          const existingTyping = prev.typingUsers.find(u => u.user_id === user_id)
          if (existingTyping) {
            return {
              ...prev,
              typingUsers: prev.typingUsers.map(u =>
                u.user_id === user_id
                  ? { ...u, timestamp: Date.now() }
                  : u
              )
            }
          }

          const user = prev.users.find(u => u.id === user_id)
          return {
            ...prev,
            typingUsers: [
              ...prev.typingUsers,
              {
                user_id,
                username: user?.username || 'Utilisateur',
                timestamp: Date.now()
              }
            ]
          }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.activeRoom?.id])

  // Nettoyer les indicateurs de frappe expirés
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setState(prev => ({
        ...prev,
        typingUsers: prev.typingUsers.filter(
          u => now - u.timestamp < TYPING_TIMEOUT
        )
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    ...state,
    sendMessage,
    loadMessages,
    addReaction,
    removeReaction,
    setTyping,
    deleteMessage,
    editMessage,
    loadMoreMessages,
    loadOnlineUsers,
    refetch: () => loadMessages(1, false)
  }
}
