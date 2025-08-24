'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Users, Gift, CheckCircle } from 'lucide-react';

interface GiveawayMessageProps {
  message: {
    id: string;
    username: string;
    message: string;
    timestamp: number;
    type: 'giveaway_announcement' | 'giveaway_join' | 'giveaway_results';
  };
  activeGiveaway?: {
    id: string;
    timeLeft: number;
  } | null;
  hasParticipated: boolean;
  onParticipate: () => void;
  currentUser?: {
    id: string;
    level: number;
  } | null;
}

const GiveawayMessage: React.FC<GiveawayMessageProps> = ({
  message: msg,
  activeGiveaway,
  hasParticipated,
  onParticipate,
  currentUser
}) => {
  const formatGiveawayTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  switch (msg.type) {
    case 'giveaway_announcement':
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-400/50 rounded-xl p-4 my-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="font-bold text-yellow-400 text-lg">GIVEAWAY ACTIF</span>
          </div>
          <div className="whitespace-pre-line text-white mb-3">{msg.message}</div>
          
          {activeGiveaway && (
            <motion.div 
              className="bg-black/30 rounded-lg p-3"
              animate={{ 
                boxShadow: [
                  '0 0 0 rgba(34, 197, 94, 0)', 
                  '0 0 20px rgba(34, 197, 94, 0.5)', 
                  '0 0 0 rgba(34, 197, 94, 0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">Temps restant:</span>
                  <span className="font-bold text-white">
                    {formatGiveawayTime(activeGiveaway.timeLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Actif</span>
                </div>
              </div>
              
              <button
                onClick={onParticipate}
                disabled={hasParticipated || !currentUser || currentUser.level < 2}
                className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all"
              >
                {hasParticipated ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Déjà Participé
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="w-4 h-4" />
                    Participer au Giveaway
                  </div>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      );

    case 'giveaway_join':
      return (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-green-500/10 border border-green-400/30 rounded-lg p-2 my-1"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">{msg.message}</span>
          </div>
        </motion.div>
      );

    case 'giveaway_results':
      return (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-400/50 rounded-xl p-4 my-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="font-bold text-yellow-400 text-lg">RÉSULTATS</span>
          </div>
          <div className="whitespace-pre-line text-white">{msg.message}</div>
        </motion.div>
      );

    default:
      return null;
  }
};

export default GiveawayMessage;