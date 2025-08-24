'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Settings, MoreVertical, Users, Trophy, Coins } from 'lucide-react';

interface AdminControlsProps {
  isAdmin: boolean;
  onStartGiveaway: () => Promise<void>;
  hasActiveGiveaway: boolean;
  onlineUsers?: number;
}

const AdminControls: React.FC<AdminControlsProps> = ({
  isAdmin,
  onStartGiveaway,
  hasActiveGiveaway,
  onlineUsers = 0
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isAdmin) return null;

  const handleStartGiveaway = async () => {
    setIsStarting(true);
    try {
      await onStartGiveaway();
    } catch (error) {
      console.error('Erreur lors du lancement du giveaway:', error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bouton principal Giveaway */}
      <motion.button
        onClick={handleStartGiveaway}
        disabled={hasActiveGiveaway || isStarting}
        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-green-500/25"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isStarting ? (
          <>
            <motion.div
              className="w-3 h-3 border border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Lancement...
          </>
        ) : (
          <>
            <Play className="w-3 h-3" />
            {hasActiveGiveaway ? 'Giveaway Actif' : 'Giveaway'}
          </>
        )}
      </motion.button>

      {/* Bouton avancé */}
      <div className="relative">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-300" />
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            className="absolute right-0 top-full mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-50 min-w-[200px]"
          >
            <div className="p-2 space-y-1">
              {/* Statistiques rapides */}
              <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3" />
                  <span>{onlineUsers} utilisateurs en ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-3 h-3" />
                  <span>Statut: {hasActiveGiveaway ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>

              {/* Actions avancées */}
              <button className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 rounded transition-colors">
                <Settings className="w-3 h-3 inline mr-2" />
                Paramètres Giveaway
              </button>
              
              <button className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 rounded transition-colors">
                <Coins className="w-3 h-3 inline mr-2" />
                Historique des Gains
              </button>
              
              <hr className="border-white/10 my-1" />
              
              <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors">
                <span className="text-xs">🚫</span>
                <span className="ml-2">Arrêter le Giveaway</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminControls;