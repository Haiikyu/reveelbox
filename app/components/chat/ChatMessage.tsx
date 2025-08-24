'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    username: string;
    message: string;
    timestamp: number;
    type: string;
    level: number;
    isVip: boolean;
    isBot: boolean;
    userId: string;
  };
  currentUserId?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message: msg, currentUserId }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelColor = (level: number) => {
    if (level >= 30) return 'text-purple-400';
    if (level >= 20) return 'text-blue-400';
    if (level >= 10) return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-3 rounded-lg transition-all duration-200 hover:bg-white/5 ${
        msg.userId === currentUserId ? 'bg-green-500/10 border-l-4 border-green-400' : 'bg-white/5'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs mb-1">
            {!msg.isBot && (
              <span className={`font-semibold ${getLevelColor(msg.level)}`}>
                Lv{msg.level}
              </span>
            )}
            <span className={`font-semibold ${
              msg.isBot ? 'text-blue-400' :
              msg.isVip ? 'text-green-400' : 'text-gray-300'
            }`}>
              {msg.username}
              {msg.isVip && <Crown className="w-3 h-3 inline ml-1 text-green-400" />}
              {msg.isBot && (
                <>
                  <Bot className="w-3 h-3 inline ml-1 text-blue-400" />
                  <span className="text-xs text-blue-300 ml-1">BOT</span>
                </>
              )}
            </span>
            <span className="text-gray-500">{formatTime(msg.timestamp)}</span>
          </div>
          <div className="text-sm text-gray-200 whitespace-pre-wrap">{msg.message}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;