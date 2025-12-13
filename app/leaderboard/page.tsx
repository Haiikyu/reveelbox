'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Crown, TrendingUp, User, Medal } from 'lucide-react'

interface LeaderboardPlayer {
  id: string
  username: string
  avatar_url: string | null
  total_coins_spent: number
  level: number
  rank: number
}

export default function LeaderboardPage() {
  const { user, profile } = useAuth()
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      // Récupérer tous les joueurs triés par total_coins_spent
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, total_coins_spent, level')
        .order('total_coins_spent', { ascending: false, nullsFirst: false })
        .limit(100)

      if (error) throw error

      // Ajouter le rang à chaque joueur
      const playersWithRank = (data || []).map((player, index) => ({
        ...player,
        rank: index + 1,
        total_coins_spent: player.total_coins_spent || 0
      }))

      setPlayers(playersWithRank)

      // Trouver le rang de l'utilisateur actuel
      if (user) {
        const currentUserRank = playersWithRank.find(p => p.id === user.id)?.rank
        setUserRank(currentUserRank || null)
      }
    } catch (error) {
      console.error('Erreur chargement leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-3xl">🥇</span>
    if (rank === 2) return <span className="text-3xl">🥈</span>
    if (rank === 3) return <span className="text-3xl">🥉</span>
    return <span className="text-xl font-black text-gray-400">#{rank}</span>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-orange-500'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-orange-700 to-orange-900'
    return 'from-gray-700 to-gray-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <Crown className="h-12 w-12 text-yellow-500" />
            <h1 className="text-5xl font-black text-white">Leaderboard</h1>
          </motion.div>
          <p className="text-gray-400 text-lg">Classement des meilleurs joueurs par coins dépensés</p>
          
          {/* Rang de l'utilisateur */}
          {user && userRank && (
            <div className="mt-6 inline-flex items-center gap-3 bg-[#4578be]/20 px-6 py-3 rounded-xl border border-[#4578be]/30">
              <span className="text-gray-300 font-semibold">Votre position :</span>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span className="text-2xl font-black text-[#4578be]">#{userRank}</span>
              </div>
            </div>
          )}
        </div>

        {/* Liste des joueurs */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4578be] mx-auto"></div>
            </div>
          ) : (
            players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`relative rounded-xl overflow-hidden ${
                  player.id === user?.id 
                    ? 'ring-2 ring-[#4578be] bg-[#4578be]/10' 
                    : 'bg-gray-800/50'
                } hover:bg-gray-800/70 transition-all`}
              >
                {/* Gradient de rang pour top 3 */}
                {player.rank <= 3 && (
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r ${getRankColor(player.rank)} opacity-10`}
                  />
                )}
                
                <div className="relative px-6 py-4 flex items-center gap-6">
                  {/* Rang */}
                  <div className="flex-shrink-0 w-16 flex justify-center">
                    {getRankIcon(player.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div 
                      className="h-14 w-14 rounded-xl overflow-hidden border-2 border-gray-700"
                      style={player.rank <= 3 ? {
                        borderColor: player.rank === 1 ? '#fbbf24' : player.rank === 2 ? '#d1d5db' : '#ea580c'
                      } : {}}
                    >
                      {player.avatar_url ? (
                        <img 
                          src={player.avatar_url} 
                          alt={player.username} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center">
                          <User className="h-7 w-7 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pseudo + Niveau */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-lg truncate">
                      {player.username}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Niveau {player.level}
                    </p>
                  </div>

                  {/* Total coins dépensés */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <img
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="w-6 h-6"
                        />
                        <span className="text-xl font-black text-[#4578be]">
                          {player.total_coins_spent.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Total dépensé</p>
                    </div>
                    
                    {/* Badge "C'est vous" */}
                    {player.id === user?.id && (
                      <div className="ml-2 px-3 py-1 bg-[#4578be] rounded-full">
                        <span className="text-xs font-bold text-white">Vous</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Message si vide */}
          {!loading && players.length === 0 && (
            <div className="text-center py-12">
              <Medal className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl font-bold text-gray-500">Aucun joueur dans le classement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}