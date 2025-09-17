// Fichier: app/components/chat/ChatContainer.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, MessageSquare, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Import des composants de chat
import HeaderBar from './HeaderBar';
import PinnedBar from './PinnedBar';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import AdminPanelModal from './AdminPanelModal';
import UserProfilePopover from './UserProfilePopover';
import ThemeEditorModal from './ThemeEditorModal';

// Import des hooks
import { useChat } from '@/hooks/useChat';
import { useSocket } from '@/hooks/useSocket';
import { useAdminPanel } from '@/hooks/useAdminPanel';

// Import des types
import type {
  ChatUser,
  ChatMessage,
  ChatContainerProps,
  UserTheme,
  CreateGiveawayParams,
  CreatePollParams,
  CreateDonationParams
} from '@/types/chat';
import type { Database } from '@/types/database';

interface ChatContainerState {
  isOpen: boolean;
  isMinimized: boolean;
  showAdminPanel: boolean;
  selectedUser: ChatUser | null;
  userPopoverPosition: { x: number; y: number } | null;
  showThemeEditor: boolean;
  themeEditorTarget: string | null;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  initialMessages = [],
  userId,
  userProfile
}) => {
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  
  // State local du composant
  const [state, setState] = useState<ChatContainerState>({
    isOpen: false,
    isMinimized: false,
    showAdminPanel: false,
    selectedUser: null,
    userPopoverPosition: null,
    showThemeEditor: false,
    themeEditorTarget: null
  });

  // Refs pour la gestion du focus et scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks personnalisés
  const {
    state: chatState,
    actions: chatActions,
    loading: chatLoading
  } = useChat({
    userId,
    initialMessages
  });

  const {
    isConnected,
    connectionState,
    subscribe,
    emit
  } = useSocket(userId);

  const {
    state: adminState,
    actions: adminActions,
    loading: adminLoading
  } = useAdminPanel(userId);

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Gestion des événements WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers = [
      subscribe('new_message', (message: ChatMessage) => {
        chatActions.addMessage(message);
        scrollToBottom();
      }),
      
      subscribe('message_pinned', (data: { messageId: string }) => {
        chatActions.updateMessagePin(data.messageId, true);
      }),
      
      subscribe('giveaway_created', (giveaway) => {
        toast({
          title: "🎉 Nouveau Giveaway !",
          description: `${giveaway.title} - ${giveaway.amount} coins`,
          duration: 5000
        });
      }),
      
      subscribe('user_joined', (user: ChatUser) => {
        chatActions.addUser(user);
      }),
      
      subscribe('user_left', (userId: string) => {
        chatActions.removeUser(userId);
      })
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [isConnected, subscribe, chatActions, toast, scrollToBottom]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (state.showAdminPanel) {
          setState(prev => ({ ...prev, showAdminPanel: false }));
        } else if (state.isOpen) {
          setState(prev => ({ ...prev, isOpen: false }));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.showAdminPanel, state.isOpen]);

  // Gestion du swipe down sur mobile
  useEffect(() => {
    if (!containerRef.current) return;

    let startY = 0;
    let currentY = 0;
    let isScrolling = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 100 && !isScrolling) {
        isScrolling = true;
        setState(prev => ({ ...prev, isOpen: false }));
      }
    };

    const handleTouchEnd = () => {
      isScrolling = false;
    };

    const container = containerRef.current;
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Actions du chat
  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await chatActions.sendMessage(content);
      scrollToBottom();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  }, [chatActions, toast, scrollToBottom]);

  const handlePinMessage = useCallback(async (messageId: string) => {
    if (!userProfile.is_admin) {
      toast({
        title: "Accès refusé",
        description: "Seuls les admins peuvent épingler des messages",
        variant: "destructive"
      });
      return;
    }

    try {
      await chatActions.pinMessage(messageId);
      toast({
        title: "Message épinglé",
        description: "Le message a été épinglé avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'épingler le message",
        variant: "destructive"
      });
    }
  }, [userProfile.is_admin, chatActions, toast]);

  const handleTranslateMessage = useCallback(async (messageId: string, targetLang: string) => {
    try {
      await chatActions.translateMessage(messageId, targetLang);
    } catch (error) {
      toast({
        title: "Erreur de traduction",
        description: "Impossible de traduire le message",
        variant: "destructive"
      });
    }
  }, [chatActions, toast]);

  const handleDonateCoins = useCallback(async (params: CreateDonationParams) => {
    try {
      const response = await fetch('/api/chat/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Erreur lors du don');
      }

      toast({
        title: "Don envoyé !",
        description: `${params.amount} coins envoyés avec succès`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le don",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Actions admin
  const handleCreateGiveaway = useCallback(async (params: CreateGiveawayParams) => {
    try {
      await adminActions.createGiveaway(params);
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
  }, [adminActions, toast]);

  const handleCreatePoll = useCallback(async (params: CreatePollParams) => {
    try {
      await adminActions.createPoll(params);
      toast({
        title: "Sondage créé !",
        description: params.title
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le sondage",
        variant: "destructive"
      });
    }
  }, [adminActions, toast]);

  const handleUserClick = useCallback((user: ChatUser, position: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      selectedUser: user,
      userPopoverPosition: position
    }));
  }, []);

  const handleBanUser = useCallback(async (userId: string, reason: string, duration: number) => {
    try {
      await adminActions.banUser(userId, reason, duration);
      toast({
        title: "Utilisateur banni",
        description: `Durée: ${duration} heures`
      });
      setState(prev => ({ ...prev, selectedUser: null, userPopoverPosition: null }));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de bannir l'utilisateur",
        variant: "destructive"
      });
    }
  }, [adminActions, toast]);

  const handleSetGrade = useCallback(async (userId: string, grade: string) => {
    try {
      await adminActions.setUserGrade(userId, grade);
      toast({
        title: "Grade mis à jour",
        description: `Nouveau grade: ${grade}`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le grade",
        variant: "destructive"
      });
    }
  }, [adminActions, toast]);

  const handleUpdateTheme = useCallback(async (userId: string, theme: UserTheme) => {
    try {
      await adminActions.updateUserTheme(userId, theme);
      toast({
        title: "Thème mis à jour",
        description: "Le thème personnalisé a été appliqué"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le thème",
        variant: "destructive"
      });
    }
  }, [adminActions, toast]);

  // Rendu conditionnel si le chat n'est pas ouvert
  if (!state.isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setState(prev => ({ ...prev, isOpen: true }))}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
          aria-label="Ouvrir le chat"
        >
          <MessageSquare className="w-6 h-6" />
          {chatState.messages.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {chatState.messages.length > 99 ? '99+' : chatState.messages.length}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Chat Container */}
      <div
        ref={containerRef}
        className={cn(
          "fixed bottom-0 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-lg shadow-2xl transition-all duration-300",
          state.isMinimized ? "h-12" : "h-96 md:h-[500px]",
          "w-80 md:w-96"
        )}
      >
        {/* Header */}
        <HeaderBar
          isMinimized={state.isMinimized}
          onMinimize={() => setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))}
          onClose={() => setState(prev => ({ ...prev, isOpen: false }))}
          onOpenAdmin={() => setState(prev => ({ ...prev, showAdminPanel: true }))}
          isAdmin={userProfile.is_admin}
          connectionState={connectionState}
          userCount={chatState.users.size}
        />

        {!state.isMinimized && (
          <>
            {/* Pinned Message Bar */}
            {chatState.pinnedMessage && (
              <PinnedBar
                message={chatState.pinnedMessage}
                onUnpin={userProfile.is_admin ? () => chatActions.unpinMessage(chatState.pinnedMessage!.id) : undefined}
              />
            )}

            {/* Messages Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <MessageList
                messages={chatState.messages}
                users={chatState.users}
                currentUserId={userId}
                isAdmin={userProfile.is_admin}
                onUserClick={handleUserClick}
                onPin={handlePinMessage}
                onTranslate={handleTranslateMessage}
                onReact={chatActions.reactToMessage}
                onReply={chatActions.replyToMessage}
                onLoadMore={chatActions.loadMoreMessages}
                isLoading={chatLoading.loadingMessages}
              />
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              onDonate={(toUserId: string, amount: number, message?: string) => 
                handleDonateCoins({ to_user_id: toUserId, amount, message })
              }
              isLoading={chatLoading.sendingMessage}
              currentUser={userProfile}
            />
          </>
        )}

        {/* Connection Status Indicator */}
        {connectionState !== 'connected' && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white text-xs text-center py-1">
            {connectionState === 'connecting' && 'Connexion...'}
            {connectionState === 'disconnected' && 'Déconnecté - Tentative de reconnexion...'}
            {connectionState === 'error' && 'Erreur de connexion'}
          </div>
        )}
      </div>

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={state.showAdminPanel}
        onClose={() => setState(prev => ({ ...prev, showAdminPanel: false }))}
        userId={userId}
        onCreateGiveaway={handleCreateGiveaway}
        onCreatePoll={handleCreatePoll}
        onBanUser={handleBanUser}
        onSetGrade={handleSetGrade}
        onUpdateTheme={handleUpdateTheme}
        isLoading={adminLoading}
      />

      {/* User Profile Popover */}
      {state.selectedUser && state.userPopoverPosition && (
        <UserProfilePopover
          user={state.selectedUser}
          isOpen={true}
          onClose={() => setState(prev => ({ ...prev, selectedUser: null, userPopoverPosition: null }))}
          position={state.userPopoverPosition}
          currentUserId={userId}
          isCurrentUserAdmin={userProfile.is_admin}
          onDonate={(toUserId: string) => {
            setState(prev => ({ ...prev, selectedUser: null, userPopoverPosition: null }));
            // Ouvrir modal de don ou autre logique
          }}
          onSetGrade={handleSetGrade}
          onBan={handleBanUser}
          onEditTheme={(userId: string) => {
            setState(prev => ({
              ...prev,
              showThemeEditor: true,
              themeEditorTarget: userId,
              selectedUser: null,
              userPopoverPosition: null
            }));
          }}
        />
      )}

      {/* Theme Editor Modal */}
      <ThemeEditorModal
        isOpen={state.showThemeEditor}
        onClose={() => setState(prev => ({ ...prev, showThemeEditor: false, themeEditorTarget: null }))}
        userId={userId}
        targetUserId={state.themeEditorTarget || ''}
        currentTheme={state.selectedUser?.theme || userProfile.theme}
        onSave={handleUpdateTheme}
      />
    </>
  );
};

export default ChatContainer;