// ============================================
// useChat.ts - Version Corrigée
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-chat'

interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  level?: number;
  is_admin?: boolean;
  is_banned?: boolean;
  total_exp?: number;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  message_type: string | null;
  created_at: string;
  profiles?: Profile;
}

const chatAPI = {
  async getDefaultRoomId(): Promise<string | null> {
    try {
      // Récupérer la première room Global active (gère le problème des doublons)
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', 'Global')
        .eq('is_active', true)
        .order('created_at', { ascending: true }) // Prendre la plus ancienne
        .limit(1);

      if (error) {
        console.error('Erreur récupération room:', error);
        return null;
      }

      if (!rooms || rooms.length === 0) {
        console.warn('Aucune room Global trouvée');
        return null;
      }

      return rooms[0].id;
    } catch (error) {
      console.error('Erreur getDefaultRoomId:', error);
      return null;
    }
  },

  async getMessages(): Promise<{ success: boolean; data?: Message[]; error?: string }> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages_new')
        .select('id, user_id, content, message_type, created_at')
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) {
        console.error('Erreur Supabase getMessages:', error);
        return { success: false, error: error.message };
      }

      if (!messages || messages.length === 0) {
        return { success: true, data: [] };
      }

      // Récupérer les profils séparément
      const userIds = [...new Set(messages.map(msg => msg.user_id).filter(Boolean))];
      
      if (userIds.length === 0) {
        return { 
          success: true, 
          data: messages.reverse().map(msg => ({
            ...msg,
            profiles: {
              id: msg.user_id,
              username: 'Utilisateur',
              avatar_url: undefined,
              level: 1
            }
          }))
        };
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, is_admin, is_banned, total_exp')
        .in('id', userIds);

      const profilesMap = new Map<string, Profile>();
      (profiles || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      const messagesWithProfiles = messages.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || {
          id: msg.user_id,
          username: 'Utilisateur',
          avatar_url: undefined,
          level: 1
        }
      })).reverse();

      return { success: true, data: messagesWithProfiles };

    } catch (error: any) {
      console.error('Erreur chatAPI.getMessages:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  },

  async sendMessage(content: string): Promise<{ success: boolean; data?: Message; error?: string }> {
    try {
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Session expirée - Veuillez vous reconnecter' };
      }

      // Valider le contenu
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return { success: false, error: 'Le message ne peut pas être vide' };
      }

      if (trimmedContent.length > 1000) {
        return { success: false, error: 'Message trop long (max 1000 caractères)' };
      }

      // Récupérer la room par défaut (corrigé pour gérer les doublons)
      const defaultRoomId = await this.getDefaultRoomId();
      if (!defaultRoomId) {
        return { success: false, error: 'Room de chat non trouvée' };
      }

      // Insérer le message
      const { data: messageData, error: insertError } = await supabase
        .from('chat_messages_new')
        .insert({
          room_id: defaultRoomId,
          user_id: user.id,
          content: trimmedContent,
          message_type: 'user_message'
        })
        .select('id, user_id, content, message_type, created_at')
        .single();

      if (insertError) {
        console.error('Erreur insertion message:', insertError);
        return { success: false, error: `Erreur envoi: ${insertError.message}` };
      }

      // Récupérer le profil de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, is_admin, is_banned, total_exp')
        .eq('id', user.id)
        .single();

      const messageWithProfile: Message = {
        ...messageData,
        profiles: profile || {
          id: user.id,
          username: 'Utilisateur',
          avatar_url: undefined,
          level: 1
        }
      };

      return { success: true, data: messageWithProfile };

    } catch (error: any) {
      console.error('Erreur chatAPI.sendMessage:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await chatAPI.getMessages();
      
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        setError(result.error || 'Erreur inconnue');
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Erreur fetchMessages:', err);
      setError(err?.message || 'Erreur inconnue');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = async (content: string): Promise<Message> => {
    try {
      const result = await chatAPI.sendMessage(content);
      
      if (result.success && result.data) {
        setMessages(prev => [...prev, result.data!]);
        return result.data;
      } else {
        const errorMessage = result.error || 'Erreur envoi message';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur envoi message';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const subscription = supabase
      .channel('chat_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages_new'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
    clearError
  };
};
