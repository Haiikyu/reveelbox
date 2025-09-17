// Fichier: app/components/chat/AdminPanelModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Gift, BarChart3, Users, Shield, FileText, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

import GiveawayTab from './admin/GiveawayTab';
import PollTab from './admin/PollTab';
import UsersTab from './admin/UsersTab';
import ModerationTab from './admin/ModerationTab';
import LogsTab from './admin/LogsTab';

import type {
  AdminTab,
  CreateGiveawayParams,
  CreatePollParams,
  UserTheme
} from '@/types/chat';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreateGiveaway: (params: CreateGiveawayParams) => Promise<void>;
  onCreatePoll: (params: CreatePollParams) => Promise<void>;
  onBanUser: (userId: string, reason: string, duration: number) => Promise<void>;
  onSetGrade: (userId: string, grade: string) => Promise<void>;
  onUpdateTheme: (userId: string, theme: UserTheme) => Promise<void>;
  isLoading: {
    creatingGiveaway: boolean;
    selectingWinners: boolean;
    creatingPoll: boolean;
    updatingUser: boolean;
  };
}

interface AdminPanelState {
  activeTab: AdminTab;
  stats: {
    activeUsers: number;
    totalMessages: number;
    activeGiveaways: number;
    activePolls: number;
  } | null;
}

const ADMIN_TABS: Array<{
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}> = [
  { id: 'giveaways', label: 'Giveaways', icon: Gift },
  { id: 'polls', label: 'Sondages', icon: BarChart3 },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'moderation', label: 'Modération', icon: Shield },
  { id: 'logs', label: 'Logs', icon: FileText }
];

const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  userId,
  onCreateGiveaway,
  onCreatePoll,
  onBanUser,
  onSetGrade,
  onUpdateTheme,
  isLoading
}) => {
  const [state, setState] = useState<AdminPanelState>({
    activeTab: 'giveaways',
    stats: null
  });

  // Charger les statistiques au montage
  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/chat-stats');
      if (response.ok) {
        const stats = await response.json();
        setState(prev => ({ ...prev, stats }));
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleTabChange = (tab: AdminTab) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'giveaways':
        return (
          <GiveawayTab
            userId={userId}
            onCreateGiveaway={onCreateGiveaway}
            isCreating={isLoading.creatingGiveaway}
            isSelectingWinners={isLoading.selectingWinners}
          />
        );
      
      case 'polls':
        return (
          <PollTab
            userId={userId}
            onCreatePoll={onCreatePoll}
            isCreating={isLoading.creatingPoll}
          />
        );
      
      case 'users':
        return (
          <UsersTab
            userId={userId}
            onSetGrade={onSetGrade}
            onUpdateTheme={onUpdateTheme}
            isUpdating={isLoading.updatingUser}
          />
        );
      
      case 'moderation':
        return (
          <ModerationTab
            userId={userId}
            onBanUser={onBanUser}
            isUpdating={isLoading.updatingUser}
          />
        );
      
      case 'logs':
        return (
          <LogsTab userId={userId} />
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-4xl w-full max-h-[90vh]"
      showCloseButton={false}
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Header avec stats */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Panel Administrateur
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestion complète du chat ReveelBox
              </p>
            </div>
          </div>

          {/* Stats rapides */}
          {state.stats && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {state.stats.activeUsers}
                </div>
                <div className="text-xs text-gray-500">Utilisateurs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {state.stats.totalMessages}
                </div>
                <div className="text-xs text-gray-500">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {state.stats.activeGiveaways}
                </div>
                <div className="text-xs text-gray-500">Giveaways</div>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = state.activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                  isActive
                    ? "text-blue-600 bg-white dark:bg-gray-900 border-b-2 border-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Contenu de l'onglet actif */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
};

export default AdminPanelModal;