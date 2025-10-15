// Importer le même client que l'AuthProvider
import { createClient } from '@/utils/supabase/client'

// Créer une instance partagée
export const supabase = createClient()

// Types
interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  message_type: string | null;
  created_at: string;
  profiles?: Profile;
}

// API Chat avec client unifié
export const chatAPI = {
  async getMessages(): Promise<Message[]> {
    try {
      const { data: messages, error } = await supabase
        .from('chat_messages_new')
        .select('id, user_id, content, message_type, created_at')
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) throw error;
      if (!messages) return [];

      const userIds = [...new Set(messages.map(msg => msg.user_id))];
      if (userIds.length === 0) return messages.reverse();

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level')
        .in('id', userIds);

      const profilesMap = new Map();
      (profiles || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      return messages.map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || {
          id: msg.user_id,
          username: 'Utilisateur',
          avatar_url: null,
          level: 1
        }
      })).reverse();
    } catch (error) {
      console.error('Erreur getMessages:', error);
      return [];
    }
  },

  async sendMessage(content: string): Promise<Message> {
    // Utiliser le même client que AuthProvider
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Session expirée - Veuillez vous reconnecter');
    }

    const { data, error } = await supabase
      .from('chat_messages_new')
      .insert({
        user_id: user.id,
        content: content.trim(),
        message_type: 'user_message'
      })
      .select('id, user_id, content, message_type, created_at')
      .single();

    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level')
      .eq('id', user.id)
      .single();

    return {
      ...data,
      profiles: profile || {
        id: user.id,
        username: 'Utilisateur',
        avatar_url: null,
        level: 1
      }
    };
  }
};

export async function callEdgeFunction(functionName: string, endpoint: string, payload: any) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Non authentifié');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur Edge Function:', error);
    throw error;
  }
}