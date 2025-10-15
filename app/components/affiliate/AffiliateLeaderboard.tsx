// components/affiliate/AffiliateLeaderboard.tsx - Classement des affiliés
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, TrendingUp, Users, Crown } from 'lucide-react'

interface LeaderboardEntry {
  user_id: string
  username: string
  affiliate_code: string
  tier_name: string
  tier_level: number
  referrals_count: number
  total_earnings: number
  badges_count: number
  ranking: number
}

export default function AffiliateLeaderboard(): JSX.Element {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all')

  // Charger le classement
  const loadLeaderboard = async (): Promise<void> => {
    try {
      setLoading(true)
      // Simuler des données de classement
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          user_id: '1',
          username: 'AffiliateKing',
          affiliate_code: 'KING2024',
          tier_name: 'Divine',
          tier_level: 10,
          referrals_count: 456,
          total_earnings: 2847.50,
          badges_count: 12,
          ranking: 1
        },
        {
          user_id: '2',
          username: 'ProRecruiter',
          affiliate_code: 'PROREC',
          tier_name: 'Mythic',
          tier_level: 9,
          referrals_count: 298,
          total_earnings: 1965.25,
          badges_count: 10,
          ranking: 2
        },
        {
          user_id: '3',
          username: 'ShareMaster',
          affiliate_code: 'SHARE99',
          tier_name: 'Legend',
          tier_level: 8,
          referrals_count: 189,
          total_earnings: 1245.75,
          badges_count: 8,
          ranking: 3
        },
        {
          user_id: '4',
          username: 'GrowthHacker',
          affiliate_code: 'GROWTH',
          tier_name: 'Champion',
          tier_level: 7,
          referrals_count: 156,
          total_earnings: 987.25,
          badges_count: 7,
          ranking: 4
        },
        {
          user_id: '5',
          username: 'NetworkPro',
          affiliate_code: 'NETWORK',
          tier_name: 'Master',
          tier_level: 6,
          referrals_count: 89,
          total_earnings: 567.50,
          badges_count: 6,
          ranking: 5
        }
      ]
      
      setLeaderboard(mockLeaderboard)
    } catch (error) {
      console.error('Erreur chargement classement:', error)
    } finally {
      setLoading(false)
    }
  }

  // Obtenir l'icône du rang
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-white">{rank}</div>
    }
  }

  // Couleur du tier
  const getTierColor = (tierLevel: number): string => {
    if (tierLevel >= 9) return 'from-purple-400 to-pink-500'
    if (tierLevel >= 7) return 'from-yellow-400 to-orange-500'
    if (tierLevel >= 5) return 'from-blue-400 to-purple-500'
    if (tierLevel >= 3) return 'from-green-400 to-blue-500'
    return 'from-gray-400 to-gray-500'
  }

  useEffect(() => {
    loadLeaderboard()
  }, [timeframe])

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Classement des Affiliés
            </h2>
          </div>
        </div>

        {/* Filtres de période */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'Tout temps' },
            { key: 'month', label: 'Ce mois' },
            { key: 'week', label: 'Cette semaine' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setTimeframe(filter.key as typeof timeframe)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                timeframe === filter.key
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Chargement du classement...
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                  entry.ranking === 1
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                    : entry.ranking === 2
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                    : entry.ranking === 3
                    ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Rang */}
                <div className="flex-shrink-0">
                  {getRankIcon(entry.ranking)}
                </div>

                {/* Avatar et Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`h-10 w-10 bg-gradient-to-br ${getTierColor(entry.tier_level)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {entry.username}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.tier_name} • {entry.affiliate_code}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {entry.referrals_count}
                      </div>
                      <div className="text-xs text-gray-600">Parrainages</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {entry.total_earnings.toFixed(0)}€
                      </div>
                      <div className="text-xs text-gray-600">Gains</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {entry.badges_count}
                      </div>
                      <div className="text-xs text-gray-600">Badges</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Classement mis à jour toutes les heures
          </p>
          <button className="text-green-600 hover:text-green-700 text-sm font-medium mt-2">
            Voir le classement complet
          </button>
        </div>
      </div>
    </div>
  )
}