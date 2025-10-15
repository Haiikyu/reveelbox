'use client'

import { motion } from 'framer-motion'

interface LeaderboardEntry {
  rank: number
  username: string
  avatar?: string
  power: number
}

interface BattleLeaderboardProps {
  entries?: LeaderboardEntry[]
}

export default function BattleLeaderboard({ entries }: BattleLeaderboardProps) {
  // Mock data si aucune entrée n'est fournie
  const defaultEntries: LeaderboardEntry[] = [
    { rank: 1, username: 'MegaBattle', power: 142, avatar: '👑' },
    { rank: 2, username: 'UltraWar', power: 98, avatar: '🔥' },
    { rank: 3, username: 'ProFight', power: 73, avatar: '⚔️' },
    { rank: 4, username: 'EpicDuel', power: 51, avatar: '🎯' },
    { rank: 5, username: 'QuickBat', power: 28, avatar: '⚡' },
    { rank: 6, username: 'FastWin', power: 19, avatar: '🏆' },
    { rank: 7, username: 'CrazyBox', power: 12, avatar: '🎲' },
  ]

  const leaderboardEntries = entries || defaultEntries

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          shadow: 'shadow-amber-500/20',
          glow: 'rgba(251, 191, 36, 0.3)',
        }
      case 2:
        return {
          bg: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
          shadow: 'shadow-gray-400/20',
          glow: 'rgba(209, 213, 219, 0.3)',
        }
      case 3:
        return {
          bg: 'linear-gradient(135deg, #fca5a5, #dc2626)',
          shadow: 'shadow-red-400/20',
          glow: 'rgba(252, 165, 165, 0.3)',
        }
      default:
        return {
          bg: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
          shadow: 'shadow-slate-300/20',
          glow: 'rgba(226, 232, 240, 0.2)',
        }
    }
  }

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200/60">
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <span>Top Battles</span>
        </h3>
      </div>

      {/* Leaderboard entries */}
      <div className="space-y-2.5">
        {leaderboardEntries.map((entry, index) => {
          const colors = getRankColor(entry.rank)

          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="relative group"
            >
              <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-200/60 transition-all duration-200 ${colors.shadow} hover:shadow-lg`}>
                {/* Rank badge */}
                <div
                  className="relative w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-gray-900 flex-shrink-0"
                  style={{
                    background: colors.bg,
                    boxShadow: `0 2px 8px ${colors.glow}`,
                  }}
                >
                  {entry.rank}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg shadow-sm border border-gray-200/50">
                  {entry.avatar || '👤'}
                </div>

                {/* User info (visible on hover) */}
                <div className="flex-1 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-xs font-semibold text-gray-700 truncate leading-tight">
                    {entry.username}
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 leading-tight">
                    {entry.power} PWR
                  </div>
                </div>

                {/* Hover glow effect */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${colors.glow}, transparent 70%)`,
                  }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
