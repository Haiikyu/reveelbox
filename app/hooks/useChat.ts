// Fichier: hooks/useChat.ts
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';

import type {
  ChatMessage,
  ChatUser,
  ChatState,
  UseChatReturn,
  SendMessageRequest,
  TranslateMessageRequest
} from '@/types/chat';
import type { Database } from '@/types/database';

interface UseChatOptions {
  userId: string;
  initialMessages?: ChatMessage[];
  pageSize?: number;
  autoConnect?: boolean;
}

interface UseChatState extends ChatState {
  hasNextPage: boolean;
  currentPage: number;
}

export const useChat = (options: UseChatOptions): UseChatReturn => {
  const { userId, initialMessages = [], pageSize = 50, autoConnect = true } = options;
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  
  const [state, setState] = useState<UseChatState>({
    messages: initialMessages,
    users: new Map<string, ChatUser>(),
    activeGiveaways: [],
    activePolls: [],
    pinnedMessage: null,
    isLoading: false,
    error: null,
    lastMessageId: null,
    hasNextPage: true,
    currentPage: 0
  });

  const [loading, setLoading] = useState({
    sendingMessage: false,
    loadingMessages: false,
    translating: null as string | null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction utilitaire pour gérer les erreurs
  const handleError = useCallback((error: unknown, action: string) => {
    console.error(`Erreur ${action}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
    
    setState(prev => ({ ...prev, error: errorMessage }));
    
    toast({
      title: 'Erreur',
      description: errorMessage,
      variant: 'destructive'
    });
  }, [toast]);

  // Charger les messages avec pagination
  const loadMessages = useCallback(async (page = 0, append = false) => {
    if (!autoConnect) return;

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(prev => ({ ...prev, loadingMessages: true }));

    try {
      const offset = page * pageSize;
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          content,
          message_type,
          is_bot,
          created_at,
          pinned,
          pinned_at,
          pinned_by,
          translated_text,
          reply_to,
          metadata
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)
        .abortSignal(abortControllerRef.current.signal);

      if (messagesError) throw messagesError;

      // Charger les profils des utilisateurs
      const userIds = messagesData
        ?.filter(msg => msg.user_id && !msg.is_bot)
        .map(msg => msg.user_id as string) || [];
      
      let usersMap = new Map<string, ChatUser>();
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            avatar_url,
            total_exp,
            virtual_currency,
            theme,
            grade,
            is_admin,
            is_banned,
            banned_until
          `)
          .in('id', [...new Set(userIds)])
          .abortSignal(abortControllerRef.current.signal);

        if (profilesError) {
          console.warn('Erreur chargement profils:', profilesError);
        } else {
          profiles?.forEach(profile => {
            const level = Math.floor((profile.total_exp || 0) / 100) + 1;
            usersMap.set(profile.id, {
              id: profile.id,
              username: profile.username || 'Utilisateur',
              avatar_url: profile.avatar_url,
              level,
              virtual_currency: profile.virtual_currency || 0,
              theme: profile.theme || {
                primary: '#3B82F6',
                secondary: '#1E40AF',
                accent: '#F59E0B'
              },
              grade: profile.grade,
              is_admin: profile.is_admin || false,
              is_banned: profile.is_banned || false,
              banned_until: profile.banned_until
            });
          });
        }
      }

      const processedMessages = messagesData?.reverse() || [];
      const pinnedMsg = processedMessages.find(msg => msg.pinned);

      setState(prev => ({
        ...prev,
        messages: append ? [...prev.messages, ...processedMessages] : processedMessages,
        users: new Map([...prev.users, ...usersMap]),
        pinnedMessage: pinnedMsg || prev.pinnedMessage,
        lastMessageId: processedMessages[processedMessages.length - 1]?.id || prev.lastMessageId,
        hasNextPage: messagesData?.length === pageSize,
        currentPage: page,
        isLoading: false,
        error: null
      }));

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      handleError(error, 'chargement des messages');
    } finally {
      setLoading(prev => ({ ...prev, loadingMessages: false }));
    }
  }, [supabase, pageSize, autoConnect, handleError]);

  // Charger plus de messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!state.hasNextPage || loading.loadingMessages) return;
    await loadMessages(state.currentPage + 1, true);
  }, [state.hasNextPage, state.currentPage, loading.loadingMessages, loadMessages]);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string, messageType: ChatMessage['message_type'] = 'text') => {
    if (!content.trim() || loading.sendingMessage) return;

    setLoading(prev => ({ ...prev, sendingMessage: true }));

    try {
      const messageData: SendMessageRequest = {
        content: content.trim(),
        message_type: messageType
      };

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du message');
      }

      const { data: newMessage } = await response.json();

      // Ajouter le message à la liste locale
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessageId: newMessage.id
      }));

    } catch (error) {
      handleError(error, 'envoi du message');
    } finally {
      setLoading(prev => ({ ...prev, sendingMessage: false }));
    }
  }, [loading.sendingMessage, handleError]);

  // Épingler/désépingler un message
  const pinMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/pin`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'épinglage');
      }

      const { data: updatedMessage } = await response.json();

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, ...updatedMessage } : msg
        ),
        pinnedMessage: updatedMessage.pinned ? updatedMessage : null
      }));

    } catch (error) {
      handleError(error, 'épinglage du message');
    }
  }, [handleError]);

  const unpinMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/unpin`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du désépinglage');
      }

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, pinned: false, pinned_at: null, pinned_by: null } : msg
        ),
        pinnedMessage: null
      }));

    } catch (error) {
      handleError(error, 'désépinglage du message');
    }
  }, [handleError]);

  // Traduire un message
  const translateMessage = useCallback(async (messageId: string, targetLang: string) => {
    setLoading(prev => ({ ...prev, translating: messageId }));

    try {
      const requestData: TranslateMessageRequest = {
        message_id: messageId,
        target_language: targetLang
      };

      const response = await fetch('/api/chat/messages/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la traduction');
      }

      const { data: translation } = await response.json();

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                translated_text: {
                  ...msg.translated_text,
                  [targetLang]: translation.text
                }
              }
            : msg
        )
      }));

    } catch (error) {
      handleError(error, 'traduction du message');
    } finally {
      setLoading(prev => ({ ...prev, translating: null }));
    }
  }, [handleError]);

  // Réagir à un message
  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await fetch('/api/chat/messages/react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message_id: messageId, emoji })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de réaction');
      }

      // Les réactions seront mises à jour via WebSocket ou rechargement
      
    } catch (error) {
      handleError(error, 'ajout de réaction');
    }
  }, [handleError]);

  // Répondre à un message
  const replyToMessage = useCallback(async (messageId: string, content: string) => {
    if (!content.trim()) return;

    try {
      const messageData: SendMessageRequest = {
        content: content.trim(),
        message_type: 'text',
        reply_to: messageId
      };

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réponse');
      }

      const { data: newMessage } = await response.json();

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessageId: newMessage.id
      }));

    } catch (error) {
      handleError(error, 'réponse au message');
    }
  }, [handleError]);

  // Supprimer un message (admin)
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId),
        pinnedMessage: prev.pinnedMessage?.id === messageId ? null : prev.pinnedMessage
      }));

    } catch (error) {
      handleError(error, 'suppression du message');
    }
  }, [handleError]);

  // Ajouter un message (pour WebSocket)
  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      lastMessageId: message.id
    }));
  }, []);

  // Ajouter un utilisateur (pour WebSocket)
  const addUser = useCallback((user: ChatUser) => {
    setState(prev => ({
      ...prev,
      users: new Map(prev.users.set(user.id, user))
    }));
  }, []);

  // Supprimer un utilisateur (pour WebSocket)
  const removeUser = useCallback((userId: string) => {
    setState(prev => {
      const newUsers = new Map(prev.users);
      newUsers.delete(userId);
      return { ...prev, users: newUsers };
    });
  }, []);

  // Mettre à jour l'épinglage d'un message (pour WebSocket)
  const updateMessagePin = useCallback((messageId: string, pinned: boolean) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, pinned } : msg
      ),
      pinnedMessage: pinned 
        ? prev.messages.find(msg => msg.id === messageId) || null
        : null
    }));
  }, []);

  // Charger les messages initiaux
  useEffect(() => {
    if (autoConnect && state.messages.length === 0) {
      loadMessages(0, false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoConnect, loadMessages]);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    state: {
      messages: state.messages,
      users: state.users,
      activeGiveaways: state.activeGiveaways,
      activePolls: state.activePolls,
      pinnedMessage: state.pinnedMessage,
      isLoading: state.isLoading,
      error: state.error,
      lastMessageId: state.lastMessageId
    },
    actions: {
      sendMessage,
      loadMoreMessages,
      pinMessage,
      unpinMessage,
      translateMessage,
      reactToMessage,
      replyToMessage,
      deleteMessage,
      // Actions pour WebSocket
      addMessage,
      addUser,
      removeUser,
      updateMessagePin
    },
    loading
  };
};