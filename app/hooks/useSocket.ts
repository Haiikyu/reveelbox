// Fichier: hooks/useSocket.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import type {
  SocketMessage,
  SocketMessageType,
  UseSocketReturn
} from '@/types/chat';
import type { Database } from '@/types/database';

interface UseSocketOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useSocket = (
  userId: string,
  options: UseSocketOptions = {}
): UseSocketReturn => {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const supabase = createClientComponentClient<Database>();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);

  const subscribersRef = useRef<Map<SocketMessageType, Set<(payload: unknown) => void>>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Fonction pour nettoyer les timeouts
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connecter aux WebSockets Supabase
  const connect = useCallback(async () => {
    if (!userId || channelRef.current) return;

    setConnectionState('connecting');
    clearReconnectTimeout();

    try {
      // Canal pour les messages de chat
      const chatChannel = supabase
        .channel(`chat:${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'new_message',
            payload: payload.new,
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          // Notifier les subscribers
          const subscribers = subscribersRef.current.get('new_message');
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.new));
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: 'pinned=eq.true'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'message_pinned',
            payload: { messageId: payload.new.id },
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('message_pinned');
          if (subscribers) {
            subscribers.forEach(callback => callback({ messageId: payload.new.id }));
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_giveaways'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'giveaway_created',
            payload: payload.new,
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('giveaway_created');
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.new));
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_giveaway_entries'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'giveaway_entry',
            payload: payload.new,
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('giveaway_entry');
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.new));
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_donations'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'donation_sent',
            payload: payload.new,
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('donation_sent');
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.new));
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_polls'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'poll_created',
            payload: payload.new,
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('poll_created');
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.new));
          }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_poll_votes'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'poll_vote',
            payload: payload.new,
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('poll_vote');
          if (subscribers) {
            subscribers.forEach(callback => callback(payload.new));
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'is_banned=eq.true'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'user_banned',
            payload: { userId: payload.new.id },
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('user_banned');
          if (subscribers) {
            subscribers.forEach(callback => callback({ userId: payload.new.id }));
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'theme=not.is.null'
        }, (payload) => {
          const message: SocketMessage = {
            type: 'theme_updated',
            payload: { userId: payload.new.id, theme: payload.new.theme },
            timestamp: new Date().toISOString()
          };
          setLastMessage(message);

          const subscribers = subscribersRef.current.get('theme_updated');
          if (subscribers) {
            subscribers.forEach(callback => callback({ 
              userId: payload.new.id, 
              theme: payload.new.theme 
            }));
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionState('connected');
            reconnectAttemptsRef.current = 0;
            console.log('✅ Socket connecté au chat');
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            setConnectionState('error');
            console.error('❌ Erreur socket chat');
            scheduleReconnect();
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false);
            setConnectionState('disconnected');
            console.warn('⏰ Socket timeout');
            scheduleReconnect();
          } else if (status === 'CLOSED') {
            setIsConnected(false);
            setConnectionState('disconnected');
            console.log('🔌 Socket fermé');
          }
        });

      channelRef.current = chatChannel;

    } catch (error) {
      console.error('Erreur connexion socket:', error);
      setConnectionState('error');
      scheduleReconnect();
    }
  }, [userId, supabase, clearReconnectTimeout]);

  // Programmer une reconnexion
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('🚫 Nombre maximum de tentatives de reconnexion atteint');
      setConnectionState('error');
      return;
    }

    clearReconnectTimeout();
    
    const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current); // Backoff exponentiel
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      console.log(`🔄 Tentative de reconnexion ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
      connect();
    }, delay);
  }, [maxReconnectAttempts, reconnectInterval, clearReconnectTimeout, connect]);

  // Déconnecter
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [supabase, clearReconnectTimeout]);

  // S'abonner à un type de message
  const subscribe = useCallback((type: SocketMessageType, callback: (payload: unknown) => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    
    const subscribers = subscribersRef.current.get(type)!;
    subscribers.add(callback);

    // Retourner une fonction de désabonnement
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        subscribersRef.current.delete(type);
      }
    };
  }, []);

  // Se désabonner d'un type de message
  const unsubscribe = useCallback((type: SocketMessageType) => {
    subscribersRef.current.delete(type);
  }, []);

  // Émettre un message (pour usage futur)
  const emit = useCallback((type: SocketMessageType, payload: unknown) => {
    if (!isConnected || !channelRef.current) {
      console.warn('Socket non connecté, impossible d\'émettre:', type);
      return;
    }

    // Pour l'instant, on utilise les APIs REST
    // Dans une implémentation WebSocket complète, on émettrait ici
    console.log('Émission message:', type, payload);
  }, [isConnected]);

  // Gestion des événements de visibilité
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page cachée, on peut réduire l'activité
        console.log('🌙 Page cachée');
      } else {
        // Page visible, reconnecter si nécessaire
        console.log('☀️ Page visible');
        if (!isConnected && autoConnect) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, autoConnect, connect]);

  // Connexion automatique au montage
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  // Nettoyage à la destruction
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
      disconnect();
    };
  }, [clearReconnectTimeout, disconnect]);

  return {
    isConnected,
    lastMessage,
    connectionState,
    subscribe,
    unsubscribe,
    emit
  };
};