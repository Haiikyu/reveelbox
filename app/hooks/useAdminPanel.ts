// Fichier: hooks/useAdminPanel.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

import type {
  AdminPanelState,
  UseAdminPanelReturn,
  CreateGiveawayParams,
  CreatePollParams,
  UserTheme,
  ChatGiveaway,
  ChatPoll,
  ChatUser,
  AdminLog
} from '@/types/chat';

interface UseAdminPanelOptions {
  autoLoad?: boolean;
}

export const useAdminPanel = (
  userId: string,
  options: UseAdminPanelOptions = {}
): UseAdminPanelReturn => {
  const { autoLoad = true } = options;
  const { toast } = useToast();

  const [state, setState] = useState<AdminPanelState>({
    isOpen: false,
    activeTab: 'giveaways',
    giveaways: [],
    polls: [],
    users: [],
    logs: [],
    isLoading: false
  });

  const [loading, setLoading] = useState({
    creatingGiveaway: false,
    selectingWinners: false,
    creatingPoll: false,
    updatingUser: false
  });

  // Fonction utilitaire pour gérer les erreurs
  const handleError = useCallback((error: unknown, action: string) => {
    console.error(`Erreur ${action}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
    
    toast({
      title: 'Erreur',
      description: errorMessage,
      variant: 'destructive'
    });
  }, [toast]);

  // Charger les données admin
  const loadAdminData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Charger les giveaways
      const giveawaysResponse = await fetch('/api/admin/giveaways');
      if (giveawaysResponse.ok) {
        const giveawaysData = await giveawaysResponse.json();
        setState(prev => ({ ...prev, giveaways: giveawaysData.data.giveaways }));
      }

      // Charger les sondages
      const pollsResponse = await fetch('/api/admin/polls');
      if (pollsResponse.ok) {
        const pollsData = await pollsResponse.json();
        setState(prev => ({ ...prev, polls: pollsData.data.polls }));
      }

      // Charger les utilisateurs
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setState(prev => ({ ...prev, users: usersData.data.users }));
      }

    } catch (error) {
      handleError(error, 'chargement des données admin');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [handleError]);

  // Actions de giveaway
  const createGiveaway = useCallback(async (params: CreateGiveawayParams) => {
    setLoading(prev => ({ ...prev, creatingGiveaway: true }));

    try {
      const response = await fetch('/api/admin/giveaways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du giveaway');
      }

      const { data } = await response.json();
      
      // Recharger les giveaways
      await loadAdminData();

      toast({
        title: 'Giveaway créé !',
        description: `${params.title} - ${params.amount} coins`
      });

      return data.giveaway_id;

    } catch (error) {
      handleError(error, 'création du giveaway');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, creatingGiveaway: false }));
    }
  }, [loadAdminData, handleError, toast]);

  const selectGiveawayWinners = useCallback(async (giveawayId: string) => {
    setLoading(prev => ({ ...prev, selectingWinners: true }));

    try {
      const response = await fetch(`/api/admin/giveaways/${giveawayId}/select-winners`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sélection des gagnants');
      }

      const { data } = await response.json();
      
      // Recharger les giveaways
      await loadAdminData();

      toast({
        title: 'Gagnants sélectionnés !',
        description: `${data.winners.length} gagnant(s) sélectionné(s)`
      });

      return data.winners;

    } catch (error) {
      handleError(error, 'sélection des gagnants');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, selectingWinners: false }));
    }
  }, [loadAdminData, handleError, toast]);

  const cancelGiveaway = useCallback(async (giveawayId: string) => {
    try {
      const response = await fetch(`/api/admin/giveaways/${giveawayId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation');
      }

      // Recharger les giveaways
      await loadAdminData();

      toast({
        title: 'Giveaway annulé',
        description: 'Le giveaway a été annulé avec succès'
      });

    } catch (error) {
      handleError(error, 'annulation du giveaway');
      throw error;
    }
  }, [loadAdminData, handleError, toast]);

  // Actions de sondage
  const createPoll = useCallback(async (params: CreatePollParams) => {
    setLoading(prev => ({ ...prev, creatingPoll: true }));

    try {
      const response = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du sondage');
      }

      const { data } = await response.json();
      
      // Recharger les sondages
      await loadAdminData();

      toast({
        title: 'Sondage créé !',
        description: params.title
      });

      return data.poll_id;

    } catch (error) {
      handleError(error, 'création du sondage');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, creatingPoll: false }));
    }
  }, [loadAdminData, handleError, toast]);

  const closePoll = useCallback(async (pollId: string) => {
    try {
      const response = await fetch(`/api/admin/polls/${pollId}/close`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la fermeture du sondage');
      }

      // Recharger les sondages
      await loadAdminData();

      toast({
        title: 'Sondage fermé',
        description: 'Le sondage a été fermé avec succès'
      });

    } catch (error) {
      handleError(error, 'fermeture du sondage');
      throw error;
    }
  }, [loadAdminData, handleError, toast]);

  // Actions utilisateur
  const banUser = useCallback(async (userId: string, reason: string, hours: number) => {
    setLoading(prev => ({ ...prev, updatingUser: true }));

    try {
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          reason,
          duration_hours: hours
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du bannissement');
      }

      // Recharger les utilisateurs
      await loadAdminData();

      toast({
        title: 'Utilisateur banni',
        description: `Durée: ${hours} heures`
      });

    } catch (error) {
      handleError(error, 'bannissement de l\'utilisateur');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, updatingUser: false }));
    }
  }, [loadAdminData, handleError, toast]);

  const unbanUser = useCallback(async (userId: string) => {
    setLoading(prev => ({ ...prev, updatingUser: true }));

    try {
      const response = await fetch('/api/admin/users/unban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du débannissement');
      }

      // Recharger les utilisateurs
      await loadAdminData();

      toast({
        title: 'Utilisateur débanni',
        description: 'L\'utilisateur peut à nouveau accéder au chat'
      });

    } catch (error) {
      handleError(error, 'débannissement de l\'utilisateur');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, updatingUser: false }));
    }
  }, [loadAdminData, handleError, toast]);

  const setUserGrade = useCallback(async (userId: string, grade: string) => {
    setLoading(prev => ({ ...prev, updatingUser: true }));

    try {
      const response = await fetch('/api/admin/users/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          grade
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du grade');
      }

      // Recharger les utilisateurs
      await loadAdminData();

      toast({
        title: 'Grade mis à jour',
        description: `Nouveau grade: ${grade}`
      });

    } catch (error) {
      handleError(error, 'mise à jour du grade');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, updatingUser: false }));
    }
  }, [loadAdminData, handleError, toast]);

  const updateUserTheme = useCallback(async (userId: string, theme: UserTheme) => {
    setLoading(prev => ({ ...prev, updatingUser: true }));

    try {
      const response = await fetch('/api/admin/users/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          theme
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du thème');
      }

      // Recharger les utilisateurs
      await loadAdminData();

      toast({
        title: 'Thème mis à jour',
        description: 'Le thème personnalisé a été appliqué'
      });

    } catch (error) {
      handleError(error, 'mise à jour du thème');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, updatingUser: false }));
    }
  }, [loadAdminData, handleError, toast]);

  // Charger les logs d'audit
  const loadAdminLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/logs');
      if (response.ok) {
        const { data } = await response.json();
        setState(prev => ({ ...prev, logs: data.logs }));
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    if (autoLoad) {
      loadAdminData();
    }
  }, [autoLoad, loadAdminData]);

  return {
    state,
    actions: {
      createGiveaway,
      selectGiveawayWinners,
      cancelGiveaway,
      createPoll,
      closePoll,
      banUser,
      unbanUser,
      setUserGrade,
      updateUserTheme,
      loadAdminLogs
    },
    loading
  };
};