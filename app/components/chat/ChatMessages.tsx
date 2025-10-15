import React, { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types
interface User {
  id: string;
  email?: string;
}

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

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  currentUser: User | null;
  error?: string | null;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  loading, 
  currentUser, 
  error 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chargement des messages...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌</div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            Erreur de chargement
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <div className="text-4xl mb-2">💬</div>
          <p>Aucun message pour le moment</p>
          <p className="text-sm">Soyez le premier à dire quelque chose !</p>
        </div>
      ) : (
        messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            isOwn={message.user_id === currentUser?.id}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwn }) => {
  const getMessageTypeStyle = (type: string | null) => {
    switch (type) {
      case 'giveaway_announcement':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-400';
      case 'giveaway_results':
        return 'bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-l-4 border-green-400';
      case 'system_message':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-400';
      default:
        return isOwn
          ? 'bg-blue-500 text-white ml-auto'
          : 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const isSystemMessage = ['giveaway_announcement', 'giveaway_results', 'system_message'].includes(
    message.message_type || ''
  );

  const profile = message.profiles;
  const displayName = profile?.username || 'Utilisateur';
  const userLevel = profile?.level || 1;

  return (
    <div className={`flex ${isOwn && !isSystemMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words
        ${getMessageTypeStyle(message.message_type)}
        ${isSystemMessage ? 'w-full' : ''}
      `}>
        {!isOwn && !isSystemMessage && (
          <div className="flex items-center space-x-2 mb-1">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold">
                {displayName[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {displayName}
              </span>
              {userLevel > 1 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                  Niv. {userLevel}
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className={`
          whitespace-pre-wrap text-sm
          ${isSystemMessage ? 'text-center font-medium' : ''}
          ${isOwn && !isSystemMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}
        `}>
          {message.content}
        </div>
        
        <div className={`
          text-xs mt-1 opacity-70
          ${isSystemMessage ? 'text-center' : ''}
          ${isOwn && !isSystemMessage ? 'text-right text-white/70' : 'text-gray-500 dark:text-gray-400'}
        `}>
          {formatDistanceToNow(new Date(message.created_at), { 
            addSuffix: true, 
            locale: fr 
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;