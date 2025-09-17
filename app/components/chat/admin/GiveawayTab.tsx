// Fichier: app/components/chat/admin/GiveawayTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trophy, Users, Clock, DollarSign, Play, Square, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/use-toast';

import GiveawayModal from '../modals/GiveawayModal';

import type {
  ChatGiveaway,
  GiveawayEntry,
  CreateGiveawayParams
} from '@/types/chat';

interface GiveawayTabProps {
  userId: string;
  onCreateGiveaway: (params: CreateGiveawayParams) => Promise<void>;
  isCreating: boolean;
  isSelectingWinners: boolean;
}

interface GiveawayTabState {
  giveaways: ChatGiveaway[];
  selectedGiveaway: ChatGiveaway | null;
  showCreateModal: boolean;
  isLoading: boolean;
  entries: Map<string, GiveawayEntry[]>;
}

const GiveawayTab: React.FC<GiveawayTabProps> = ({
  userId,
  onCreateGiveaway,
  isCreating,
  isSelectingWinners
}) => {
  const { toast } = useToast();
  const [state, setState] = useState<GiveawayTabState>({
    giveaways: [],
    selectedGiveaway: null,
    showCreateModal: false,
    isLoading: true,
    entries: new Map()
  });

  // Charger les giveaways
  const loadGiveaways = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('/api/admin/giveaways');
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      setState(prev => ({ ...prev, giveaways: data.giveaways }));
      
      // Charger les participations pour chaque giveaway
      const entriesMap = new Map();
      await Promise.all(
        data.giveaways.map(async (giveaway: ChatGiveaway) => {
          const entriesResponse = await fetch(`/api/admin/giveaways/${giveaway.id}/entries`);
          if (entriesResponse.ok) {
            const entriesData = await entriesResponse.json();
            entriesMap.set(giveaway.id, entriesData.entries);
          }
        })
      );
      
      setState(prev => ({ ...prev, entries: entriesMap }));
    } catch (error) {
      console.error('Erreur chargement giveaways:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les giveaways",
        variant: "destructive"
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  useEffect(() => {
    loadGiveaways();
  }, [loadGiveaways]);

  // Actions sur les giveaways
  const handleCreateGiveaway = useCallback(async (params: CreateGiveawayParams) => {
    try {
      await onCreateGiveaway(params);
      setState(prev => ({ ...prev, showCreateModal: false }));
      await loadGiveaways();
      
      toast({
        title: "Giveaway créé !",
        description: `${params.title} - ${params.amount} coins`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le giveaway",
        variant: "destructive"
      });
    }
  }, [onCreateGiveaway, loadGiveaways, toast]);

  const handleSelectWinners = useCallback(async (giveawayId: string) => {
    try {
      const response = await fetch(`/api/admin/giveaways/${giveawayId}/select-winners`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Erreur sélection gagnants');
      
      const data = await response.json();
      await loadGiveaways();
      
      toast({
        title: "Gagnants sélectionnés !",
        description: `${data.winners.length} gagnant(s) sélectionné(s)`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner les gagnants",
        variant: "destructive"
      });
    }
  }, [loadGiveaways, toast]);

  const handleCancelGiveaway = useCallback(async (giveawayId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce giveaway ?')) return;
    
    try {
      const response = await fetch(`/api/admin/giveaways/${giveawayId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur annulation');
      
      await loadGiveaways();
      toast({
        title: "Giveaway annulé",
        description: "Le giveaway a été annulé avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le giveaway",
        variant: "destructive"
      });
    }
  }, [loadGiveaways, toast]);

  // Rendu des giveaways
  const renderGiveawayCard = (giveaway: ChatGiveaway) => {
    const entries = state.entries.get(giveaway.id) || [];
    const participantCount = entries.length;
    const isActive = giveaway.status === 'active' && new Date(giveaway.ends_at) > new Date();
    const isExpired = new Date(giveaway.ends_at) <= new Date();
    const canSelectWinners = giveaway.status === 'active' && isExpired && participantCount > 0;

    return (
      <Card key={giveaway.id} className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                {giveaway.title}
              </h3>
              <Badge 
                variant={isActive ? 'default' : giveaway.status === 'completed' ? 'secondary' : 'destructive'}
              >
                {isActive ? 'Actif' : giveaway.status === 'completed' ? 'Terminé' : 'Annulé'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>{giveaway.amount} coins</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{participantCount} participants</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>{giveaway.winners_count} gagnant(s)</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {isExpired ? 'Expiré' : formatDistanceToNow(new Date(giveaway.ends_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
            </div>
            
            {giveaway.max_participants && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Participants</span>
                  <span>{participantCount}/{giveaway.max_participants}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (participantCount / giveaway.max_participants) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          {canSelectWinners && (
            <Button
              size="sm"
              onClick={() => handleSelectWinners(giveaway.id)}
              disabled={isSelectingWinners}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-3 h-3 mr-1" />
              Sélectionner gagnants
            </Button>
          )}
          
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelGiveaway(giveaway.id)}
            >
              <Square className="w-3 h-3 mr-1" />
              Arrêter
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCancelGiveaway(giveaway.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    );
  };

  if (state.isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Chargement des giveaways..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header avec bouton de création */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Gestion des Giveaways
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Créez et gérez les giveaways de coins pour la communauté
          </p>
        </div>
        
        <Button
          onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}
          disabled={isCreating}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Giveaway
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {state.giveaways.filter(g => g.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Giveaways actifs</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {state.giveaways.filter(g => g.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Terminés</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {Array.from(state.entries.values()).reduce((sum, entries) => sum + entries.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Participants total</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {state.giveaways.reduce((sum, g) => sum + (g.status === 'completed' ? g.amount * g.winners_count : 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Coins distribués</div>
        </Card>
      </div>

      {/* Liste des giveaways */}
      {state.giveaways.length === 0 ? (
        <EmptyState
          title="Aucun giveaway"
          description="Créez votre premier giveaway pour engager la communauté !"
          icon="🎉"
          action={
            <Button
              onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un giveaway
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {state.giveaways
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(renderGiveawayCard)
          }
        </div>
      )}

      {/* Modal de création de giveaway */}
      <GiveawayModal
        isOpen={state.showCreateModal}
        onClose={() => setState(prev => ({ ...prev, showCreateModal: false }))}
        onSubmit={handleCreateGiveaway}
        isLoading={isCreating}
      />
    </div>
  );
};

export default GiveawayTab;