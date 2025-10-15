import React, { useState, useRef } from 'react'
import { useAuth } from '@/app/components/AuthProvider'

interface Message {
  id: string;
  user_id: string;
  content: string;
  message_type: string | null;
  created_at: string;
  profiles?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    level: number | null;
  };
}

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<Message>;
  disabled?: boolean;
  loading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  loading = false 
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { user, isAuthenticated, refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending || disabled || loading) return;

    if (!isAuthenticated || !user) {
      alert('Vous devez être connecté pour envoyer un message');
      return;
    }

    try {
      setSending(true);
      await onSendMessage(trimmedMessage);
      setMessage('');
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      if (error.message.includes('Session expirée') || error.message.includes('Non authentifié')) {
        alert('Session expirée. Actualisation de la page...');
        window.location.reload();
      } else {
        alert('Erreur: ' + (error?.message || 'Erreur inconnue'));
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (disabled) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
        <div className="text-center text-red-600 dark:text-red-400 text-sm">
          Vous êtes banni du chat
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
        <div className="text-center text-yellow-800 dark:text-yellow-200 text-sm">
          Connectez-vous pour participer au chat
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            maxLength={1000}
            disabled={sending || loading}
          />
          
          <div className="absolute bottom-1 right-2 text-xs text-gray-400">
            {message.length}/1000
          </div>
        </div>
        
        <button
          type="submit"
          disabled={sending || loading || !message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
        >
          {sending || loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
      
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
      </div>
    </form>
  );
};

export default ChatInput;