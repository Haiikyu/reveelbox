// Fichier: app/components/chat/MessageList.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';
import { ChevronUp, Loader2 } from 'lucide-react';

import MessageItem from './MessageItem';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';

import type {
  ChatMessage,
  ChatUser,
  MessageItemProps
} from '@/types/chat';

interface MessageListProps {
  messages: ChatMessage[];
  users: Map<string, ChatUser>;
  currentUserId: string;
  isAdmin: boolean;
  onUserClick: (user: ChatUser, position: { x: number; y: number }) => void;
  onPin: (messageId: string) => Promise<void>;
  onTranslate: (messageId: string, targetLang: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  onReply: (messageId: string) => void;
  onLoadMore: () => Promise<void>;
  isLoading: boolean;
}

interface MessageListState {
  showScrollToBottom: boolean;
  isNearBottom: boolean;
  autoScroll: boolean;
}

const ITEM_HEIGHT = 80; // Hauteur approximative d'un message
const SCROLL_THRESHOLD = 100; // Distance du bas pour afficher le bouton scroll
const LOAD_MORE_THRESHOLD = 5; // Nombre de messages avant le début pour charger plus

const MessageList: React.FC<MessageListProps> = ({
  messages,
  users,
  currentUserId,
  isAdmin,
  onUserClick,
  onPin,
  onTranslate,
  onReact,
  onReply,
  onLoadMore,
  isLoading
}) => {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MessageListState>({
    showScrollToBottom: false,
    isNearBottom: true,
    autoScroll: true
  });

  // Scroll vers le bas
  const scrollToBottom = useCallback(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
      setState(prev => ({ 
        ...prev, 
        showScrollToBottom: false, 
        isNearBottom: true,
        autoScroll: true
      }));
    }
  }, [messages.length]);

  // Auto-scroll quand de nouveaux messages arrivent
  useEffect(() => {
    if (state.autoScroll && state.isNearBottom) {
      scrollToBottom();
    }
  }, [messages.length, state.autoScroll, state.isNearBottom, scrollToBottom]);

  // Gestion du scroll
  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }: any) => {
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < SCROLL_THRESHOLD;
    const showScrollButton = !isNearBottom && messages.length > 10;

    setState(prev => ({
      ...prev,
      showScrollToBottom: showScrollButton,
      isNearBottom,
      autoScroll: isNearBottom
    }));

    // Charger plus de messages si on est proche du début
    if (scrollTop < LOAD_MORE_THRESHOLD * ITEM_HEIGHT && !isLoading) {
      onLoadMore();
    }
  }, [messages.length, isLoading, onLoadMore]);

  // Fonction de rendu d'un élément de la liste
  const renderMessage = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const user = message.user_id ? users.get(message.user_id) : null;
    
    const handleDonate = (toUserId: string) => {
      const targetUser = users.get(toUserId);
      if (targetUser) {
        // Logique pour ouvrir modal de don ou autre
        console.log('Donate to:', targetUser);
      }
    };

    const messageProps: Omit<MessageItemProps, 'style'> = {
      message,
      user,
      currentUserId,
      isAdmin,
      onPin,
      onTranslate,
      onDonate: handleDonate,
      onReact,
      onReply,
      onUserClick
    };

    return (
      <div style={style}>
        <MessageItem {...messageProps} />
      </div>
    );
  }, [messages, users, currentUserId, isAdmin, onPin, onTranslate, onReact, onReply, onUserClick]);

  // Messages groupés pour optimiser le rendu
  const processedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      
      // Vérifier si c'est le même utilisateur que le message précédent
      const isSameUserAsPrevious = prevMessage?.user_id === message.user_id && 
        prevMessage && new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 300000; // 5 minutes
      
      return {
        ...message,
        isGrouped: isSameUserAsPrevious,
        isLastInGroup: nextMessage?.user_id !== message.user_id
      };
    });
  }, [messages]);

  // État de chargement
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <LoadingState message="Chargement des messages..." />
      </div>
    );
  }

  // État vide
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          title="Aucun message"
          description="Soyez le premier à envoyer un message dans ce chat !"
          icon="💬"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative">
      {/* Indicateur de chargement en haut */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 dark:bg-gray-900/90 p-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement de plus de messages...
          </div>
        </div>
      )}

      {/* Liste virtualisée des messages */}
      <List
        ref={listRef}
        height={containerRef.current?.clientHeight || 300}
        itemCount={processedMessages.length}
        itemSize={ITEM_HEIGHT}
        onScroll={handleScroll}
        className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {renderMessage}
      </List>

      {/* Bouton scroll vers le bas */}
      {state.showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4 z-20",
            "bg-blue-600 hover:bg-blue-700 text-white",
            "p-2 rounded-full shadow-lg",
            "transition-all duration-200 hover:scale-105",
            "animate-in slide-in-from-bottom-4"
          )}
          aria-label="Aller au bas du chat"
        >
          <ChevronUp className="w-4 h-4 rotate-180" />
          {/* Badge avec nombre de nouveaux messages */}
          {messages.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {Math.min(99, messages.length)}
            </div>
          )}
        </button>
      )}

      {/* Indicateur de connexion */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <div className="flex justify-center pb-2">
          <div className={cn(
            "text-xs px-2 py-1 rounded-full transition-all duration-200",
            "bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400",
            "border border-gray-200 dark:border-gray-700"
          )}>
            {messages.length} message{messages.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageList;