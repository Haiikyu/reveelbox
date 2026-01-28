// app/components/BattleStats/BattleStats.tsx
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Users,
  Crown, Target, Zap, Swords, Award
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
  gradient: string
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
        label: 'Prix Total',
        value: `${totalPrize.toLocaleString()}`,
        icon: Award,
        color: '#F59E0B',
        gradient: 'from-amber-500/20 to-orange-500/10',
        trend: 'up'
      },
      {
        label: 'Progression',
        value: `${currentRound}/${totalRounds}`,
        icon: Target,
        color: '#3B82F6',
        gradient: 'from-blue-500/20 to-cyan-500/10',
        trend: progress > 50 ? 'up' : 'neutral'
      },
      {
        label: 'Leader',
        value: `${leader.total_value.toLocaleString()}`,
        icon: Crown,
        color: '#EF4444',
        gradient: 'from-red-500/20 to-rose-500/10',
        trend: leader.total_value > avgValue ? 'up' : 'down'
      },
      {
        label: 'Moyenne',
        value: `${Math.round(avgValue).toLocaleString()}`,
        icon: TrendingUp,
        color: '#10B981',
        gradient: 'from-emerald-500/20 to-green-500/10',
        trend: 'neutral'
      },
      {
        label: 'Joueurs',
        value: participants.length,
        icon: Users,
        color: '#8B5CF6',
        gradient: 'from-violet-500/20 to-purple-500/10',
        trend: 'neutral'
      },
      {
        label: 'Mode',
        value: getModeLabel(mode),
        icon: Zap,
        color: getModeColor(mode),
        gradient: `from-[${getModeColor(mode)}]/20 to-transparent`,
        trend: 'neutral'
      }
    ]
  }, [participants, totalPrize, currentRound, totalRounds, mode])

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
      case 'down': return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
      default: return null
    }
  }

  const progressPercent = Math.round((currentRound / totalRounds) * 100)

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Gradient accent */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${getModeColor(mode)}30, ${getModeColor(mode)}10)`,
                border: `1px solid ${getModeColor(mode)}40`
              }}
            >
              <Swords className="w-5 h-5" style={{ color: getModeColor(mode) }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Statistiques</h3>
              <p className="text-xs text-slate-400">Round {currentRound} sur {totalRounds}</p>
            </div>
          </div>

          <div
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: `${getModeColor(mode)}20`,
              color: getModeColor(mode),
              border: `1px solid ${getModeColor(mode)}30`
            }}
          >
            {getModeLabel(mode)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 font-medium">Progression</span>
          <span className="text-xs font-bold text-white">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: `linear-gradient(90deg, ${getModeColor(mode)}, ${getModeColor(mode)}cc)`
            }}
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

      {/* Stats Grid */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        {stats.slice(0, 4).map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-xl transition-all hover:scale-[1.02]"
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `${stat.color}15`,
                  border: `1px solid ${stat.color}25`
                }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              {getTrendIcon(stat.trend)}
            </div>

            <div className="text-lg font-bold text-white mb-0.5">
              {stat.value}
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="px-4 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white">Classement</h4>
        </div>
        <div className="space-y-2">
          {participants
            .sort((a, b) => b.total_value - a.total_value)
            .slice(0, 3)
            .map((participant, index) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:scale-[1.01]"
                style={{
                  background: index === 0
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))'
                    : 'rgba(30, 41, 59, 0.4)',
                  border: index === 0
                    ? '1px solid rgba(251, 191, 36, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.03)'
                }}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black' :
                  index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                  'bg-gradient-to-br from-orange-600 to-orange-700 text-white'
                }`}>
                  {index + 1}
                </div>

                <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600/50">
                  <img
                    src={
                      participant.is_bot
                        ? '/bot-avatar.png'
                        : participant.profiles?.avatar_url || '/default-avatar.png'
                    }
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {participant.is_bot ? participant.bot_name : participant.profiles?.username || 'Joueur'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                    alt="Coins"
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-emerald-400">
                    {participant.total_value.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Mode Description */}
      <div className="mx-4 mb-4 p-3 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${getModeColor(mode)}10, transparent)`,
          border: `1px solid ${getModeColor(mode)}20`
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: getModeColor(mode) }} />
          <span className="text-xs font-bold" style={{ color: getModeColor(mode) }}>
            {getModeLabel(mode)}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {getModeDescription(mode)}
        </p>
      </div>
    </div>
  )
}

function getModeColor(mode: string): string {
  const colors = {
    classic: '#3B82F6',
    crazy: '#8B5CF6',
    shared: '#10B981',
    fast: '#F97316',
    jackpot: '#F59E0B',
    terminal: '#EF4444',
    clutch: '#EC4899'
  } as const
  return colors[mode.toLowerCase() as keyof typeof colors] || '#6B7280'
}

function getModeLabel(mode: string): string {
  const labels = {
    classic: 'Classic',
    crazy: 'Crazy',
    shared: 'Shared',
    fast: 'Fast',
    jackpot: 'Jackpot',
    terminal: 'Terminal',
    clutch: 'Clutch'
  } as const
  return labels[mode.toLowerCase() as keyof typeof labels] || mode
}

function getModeDescription(mode: string): string {
  const descriptions = {
    classic: 'La valeur totale la plus haute remporte la cagnotte',
    crazy: 'La valeur totale la plus basse gagne - inversez la logique !',
    shared: 'Tous les joueurs partagent la cagnotte',
    fast: 'Memes regles que classic avec des animations accelerees',
    jackpot: 'Selection aleatoire ponderee - plus de valeur = meilleures chances',
    terminal: 'Seul le dernier round compte pour la victoire',
    clutch: 'L\'item avec la plus haute valeur remporte tout'
  } as const

  return descriptions[mode.toLowerCase() as keyof typeof descriptions] || 'Mode de battle special'
}

export default BattleStats
