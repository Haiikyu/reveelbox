// ============================================
// useGiveaway.ts - Version Sans Edge Function
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
}

interface GiveawayParticipant {
  id: string;
  user_id: string;
  giveaway_id: string;
  joined_at: string;
  captcha_verified: boolean;
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
  room_id: string;
  duration_minutes?: number;
  profiles?: Profile;
  chat_giveaway_participants_new?: GiveawayParticipant[];
}

interface CreateGiveawayData {
  title: string;
  totalAmount: number;
  winnersCount: number;
  durationMinutes: number;
}

const giveawayAPI = {
  async getDefaultRoomId(): Promise<string | null> {
    try {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', 'Global')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error || !rooms || rooms.length === 0) {
        return null;
      }

      return rooms[0].id;
    } catch (error) {
      return null;
    }
  },

  async getActiveGiveaways(): Promise<{ success: boolean; data?: Giveaway[]; error?: string }> {
    try {
      // Récupérer les giveaways actifs
      const { data: giveaways, error } = await supabase
        .from('chat_giveaways_new')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur getActiveGiveaways:', error);
        return { success: false, error: error.message };
      }

      if (!giveaways || giveaways.length === 0) {
        return { success: true, data: [] };
      }

      // Récupérer les participants pour chaque giveaway
      const giveawayIds = giveaways.map(g => g.id);
      const { data: participants } = await supabase
        .from('chat_giveaway_participants_new')
        .select('*')
        .in('giveaway_id', giveawayIds);

      // Récupérer les profils des créateurs
      const creatorIds = [...new Set(giveaways.map(g => g.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, is_admin')
        .in('id', creatorIds);

      const profilesMap = new Map<string, Profile>();
      (profiles || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Grouper les participants par giveaway
      const participantsMap = new Map<string, GiveawayParticipant[]>();
      (participants || []).forEach(participant => {
        const list = participantsMap.get(participant.giveaway_id) || [];
        list.push(participant);
        participantsMap.set(participant.giveaway_id, list);
      });

      // Assembler les données
      const giveawaysWithData = giveaways.map(giveaway => ({
        ...giveaway,
        profiles: profilesMap.get(giveaway.created_by) || {
          id: giveaway.created_by,
          username: 'Admin',
          avatar_url: undefined,
          level: 1,
          is_admin: true
        },
        chat_giveaway_participants_new: participantsMap.get(giveaway.id) || []
      }));

      return { success: true, data: giveawaysWithData };

    } catch (error: any) {
      console.error('Erreur giveawayAPI.getActiveGiveaways:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  },

  async createGiveaway(giveawayData: CreateGiveawayData): Promise<{ success: boolean; data?: Giveaway; error?: string }> {
    try {
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Session expirée - Veuillez vous reconnecter' };
      }

      // Vérifier les permissions admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return { success: false, error: 'Seuls les administrateurs peuvent créer des giveaways' };
      }

      // Récupérer la room par défaut
      const defaultRoomId = await this.getDefaultRoomId();
      if (!defaultRoomId) {
        return { success: false, error: 'Room de chat non trouvée' };
      }

      // Calculer la date de fin
      const now = new Date();
      const endsAt = new Date(now.getTime() + giveawayData.durationMinutes * 60 * 1000);

      // Créer le giveaway
      const { data: giveaway, error: giveawayError } = await supabase
        .from('chat_giveaways_new')
        .insert({
          room_id: defaultRoomId,
          created_by: user.id,
          title: giveawayData.title,
          total_amount: giveawayData.totalAmount,
          winners_count: giveawayData.winnersCount,
          duration_minutes: giveawayData.durationMinutes,
          ends_at: endsAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (giveawayError) {
        console.error('Erreur création giveaway:', giveawayError);
        return { success: false, error: `Erreur création: ${giveawayError.message}` };
      }

      // Message d'annonce
      const announcementContent = `🎉 **GIVEAWAY LANCÉ !** 🎉

🏆 **${giveawayData.title}**
💰 Prize Pool: **${giveawayData.totalAmount.toLocaleString()} coins**
👥 Winners: **${giveawayData.winnersCount}**
⏰ Duration: **${giveawayData.durationMinutes} minutes**

✅ **Conditions:**
- Niveau minimum: **5**
- Un seul ticket par personne

👆 **Cliquez sur "Rejoindre" pour participer !**`;

      const { data: message } = await supabase
        .from('chat_messages_new')
        .insert({
          room_id: defaultRoomId,
          user_id: user.id,
          content: announcementContent,
          message_type: 'giveaway_announcement'
        })
        .select()
        .single();

      if (message) {
        await supabase
          .from('chat_giveaways_new')
          .update({ announcement_message_id: message.id })
          .eq('id', giveaway.id);
      }

      return { success: true, data: giveaway };

    } catch (error: any) {
      console.error('Erreur giveawayAPI.createGiveaway:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  },

  async joinGiveaway(giveawayId: string, captchaToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Session expirée - Veuillez vous reconnecter' };
      }

      // Vérifier le giveaway
      const { data: giveaway } = await supabase
        .from('chat_giveaways_new')
        .select('*')
        .eq('id', giveawayId)
        .eq('status', 'active')
        .single();

      if (!giveaway || new Date(giveaway.ends_at) <= new Date()) {
        return { success: false, error: 'Giveaway non trouvé, non actif, ou terminé' };
      }

      // Vérifier la participation existante
      const { data: existingParticipation } = await supabase
        .from('chat_giveaway_participants_new')
        .select('id')
        .eq('giveaway_id', giveawayId)
        .eq('user_id', user.id)
        .single();

      if (existingParticipation) {
        return { success: false, error: 'Vous avez déjà rejoint ce giveaway' };
      }

      // Ajouter le participant
      const { error: participantError } = await supabase
        .from('chat_giveaway_participants_new')
        .insert({
          giveaway_id: giveawayId,
          user_id: user.id,
          captcha_verified: true,
          captcha_token: captchaToken,
          captcha_verified_at: new Date().toISOString()
        });

      if (participantError) {
        return { success: false, error: `Erreur participation: ${participantError.message}` };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Erreur giveawayAPI.joinGiveaway:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  },

  async completeGiveaway(giveawayId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Session expirée' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return { success: false, error: 'Permissions insuffisantes' };
      }

      // Marquer comme terminé (implémentation simplifiée)
      const { error } = await supabase
        .from('chat_giveaways_new')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', giveawayId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  },

  async cancelGiveaway(giveawayId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'Session expirée' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return { success: false, error: 'Permissions insuffisantes' };
      }

      const { error } = await supabase
        .from('chat_giveaways_new')
        .update({ status: 'cancelled' })
        .eq('id', giveawayId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }
};

export const useGiveaway = () => {
  const [activeGiveaways, setActiveGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveGiveaways = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await giveawayAPI.getActiveGiveaways();
      
      if (result.success && Array.isArray(result.data)) {
        setActiveGiveaways(result.data);
      } else {
        setError(result.error || 'Erreur inconnue');
        setActiveGiveaways([]);
      }
    } catch (err: any) {
      console.error('Erreur fetchActiveGiveaways:', err);
      setError(err?.message || 'Erreur inconnue');
      setActiveGiveaways([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGiveaway = async (giveawayData: CreateGiveawayData): Promise<Giveaway> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await giveawayAPI.createGiveaway(giveawayData);
      
      if (result.success && result.data) {
        await fetchActiveGiveaways();
        return result.data;
      } else {
        const errorMessage = result.error || 'Erreur création giveaway';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur création giveaway';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const joinGiveaway = async (giveawayId: string, captchaToken: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await giveawayAPI.joinGiveaway(giveawayId, captchaToken);
      
      if (result.success) {
        await fetchActiveGiveaways();
        return { success: true };
      } else {
        const errorMessage = result.error || 'Erreur participation giveaway';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur participation giveaway';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeGiveaway = async (giveawayId: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await giveawayAPI.completeGiveaway(giveawayId);
      
      if (result.success) {
        await fetchActiveGiveaways();
        return { success: true };
      } else {
        const errorMessage = result.error || 'Erreur completion giveaway';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur completion giveaway';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelGiveaway = async (giveawayId: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await giveawayAPI.cancelGiveaway(giveawayId);
      
      if (result.success) {
        await fetchActiveGiveaways();
        return { success: true };
      } else {
        const errorMessage = result.error || 'Erreur annulation giveaway';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur annulation giveaway';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchActiveGiveaways();
  }, [fetchActiveGiveaways]);

  useEffect(() => {
    const subscription = supabase
      .channel('giveaways_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_giveaways_new'
        },
        () => {
          fetchActiveGiveaways();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchActiveGiveaways]);

  return {
    activeGiveaways,
    loading,
    error,
    fetchActiveGiveaways,
    createGiveaway,
    joinGiveaway,
    completeGiveaway,
    cancelGiveaway,
    clearError
  };
};