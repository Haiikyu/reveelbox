// app/components/BattleStats/BattleStats.tsx
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Users, Clock, 
  Coins, Crown, Target, Zap
} from 'lucide-react'

interface BattleStatsProps {
  participants: Array<{
    id: string
    user_id: string | null
    is_bot: boolean
    bot_name: string | null
    total_value: number
    profiles?: {
      username: string | null
      avatar_url: string | null
    }
  }>
  mode: string
  totalPrize: number
  currentRound: number
  totalRounds: number
  className?: string
}

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | 'neutral'
}

export function BattleStats({ 
  participants, 
  mode, 
  totalPrize, 
  currentRound, 
  totalRounds,
  className = '' 
}: BattleStatsProps): JSX.Element {
  
  // Calculs des statistiques
  const stats = useMemo((): StatCard[] => {
    const totalValue = participants.reduce((sum, p) => sum + p.total_value, 0)
    const leader = participants.reduce((max, p) => p.total_value > max.total_value ? p : max)
    const avgValue = participants.length > 0 ? totalValue / participants.length : 0
    const progress = (currentRound / totalRounds) * 100

    return [
      {
        label: 'Total Prize',
        value: `€${totalPrize.toFixed(2)}`,
        icon: Coins,
        color: '#F59E0B',
        trend: 'up'
      },
      {
        label: 'Progress',
        value: `${currentRound}/${totalRounds}`,
        icon: Target,
        color: '#3B82F6',
        trend: progress > 50 ? 'up' : 'neutral'
      },
      {
        label: 'Leader Value',
        value: `€${leader.total_value.toFixed(2)}`,
        icon: Crown,
        color: '#EF4444',
        trend: leader.total_value > avgValue ? 'up' : 'down'
      },
      {
        label: 'Avg Value',
        value: `€${avgValue.toFixed(2)}`,
        icon: TrendingUp,
        color: '#10B981',
        trend: 'neutral'
      },
      {
        label: 'Players',
        value: participants.length,
        icon: Users,
        color: '#8B5CF6',
        trend: 'neutral'
      },
      {
        label: 'Mode',
        value: mode.toUpperCase(),
        icon: Zap,
        color: '#EC4899',
        trend: 'neutral'
      }
    ]
  }, [participants, totalPrize, currentRound, totalRounds, mode])

  const getModeColor = (mode: string): string => {
    const colors = {
      classic: '#3B82F6',
      crazy: '#8B5CF6',
      shared: '#10B981',
      fast: '#F59E0B',
      jackpot: '#F97316',
      terminal: '#EF4444',
      clutch: '#EC4899'
    } as const
    return colors[mode.toLowerCase() as keyof typeof colors] || '#6B7280'
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-400" />
      case 'down': return <TrendingDown className="w-3 h-3 text-red-400" />
      default: return null
    }
  }

  return (
    <div className={`bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getModeColor(mode) }}
          />
          Battle Statistics
        </h3>
        
        <div className="text-sm text-slate-400">
          Round {currentRound} of {totalRounds}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-900/50 border border-slate-600/30 rounded-lg p-4 hover:border-slate-500/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon 
                  className="w-4 h-4" 
                  style={{ color: stat.color }}
                />
              </div>
              {getTrendIcon(stat.trend)}
            </div>
            
            <div className="text-xl font-bold text-white mb-1">
              {stat.value}
            </div>
            
            <div className="text-xs text-slate-400">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Battle Progress</span>
          <span className="text-sm font-bold text-white">
            {Math.round((currentRound / totalRounds) * 100)}%
          </span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentRound / totalRounds) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: [-100, 200] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Leaderboard Mini */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3">Current Ranking</h4>
        <div className="space-y-2">
          {participants
            .sort((a, b) => b.total_value - a.total_value)
            .slice(0, 3)
            .map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 p-2 bg-slate-900/30 rounded-lg"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  'bg-orange-600 text-white'
                }`}>
                  {index + 1}
                </div>
                
                <img
                  src={
                    participant.is_bot 
                      ? '/bot-avatar.png'
                      : participant.profiles?.avatar_url || '/default-avatar.png'
                  }
                  alt=""
                  className="w-6 h-6 rounded-full border border-slate-600"
                />
                
                <div className="flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {participant.is_bot ? participant.bot_name : participant.profiles?.username || 'Player'}
                  </div>
                </div>
                
                <div className="text-sm font-bold text-green-400">
                  €{participant.total_value.toFixed(2)}
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Mode Description */}
      <div className="mt-6 p-3 bg-slate-900/50 border border-slate-600/30 rounded-lg">
        <div className="text-xs text-slate-400 mb-1">Game Mode</div>
        <div className="text-sm text-white font-medium mb-2">
          {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
        </div>
        <div className="text-xs text-slate-300">
          {getModeDescription(mode)}
        </div>
      </div>
    </div>
  )
}

// Descriptions des modes de jeu
function getModeDescription(mode: string): string {
  const descriptions = {
    classic: 'Highest total value wins the entire prize pool',
    crazy: 'Lowest total value wins - reverse psychology battle!',
    shared: 'All players share the prize pool equally',
    fast: 'Same rules as classic but with accelerated animations',
    jackpot: 'Random weighted selection - higher value = better odds',
    terminal: 'Only the last box round counts for victory',
    clutch: 'Single highest value item wins everything'
  } as const
  
  return descriptions[mode.toLowerCase() as keyof typeof descriptions] || 'Special battle mode'
}

export default BattleStats