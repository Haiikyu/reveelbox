'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { 
  Crown, Lock, Check, Sparkles, Gift, Coins, 
  Frame as FrameIcon, Image as ImageIcon, Award, Zap, Star
} from 'lucide-react'
import Link from 'next/link'

interface BattlePassReward {
  day: number
  reward_type: string
  reward_value: any
  is_claimed: boolean
  is_available: boolean
  is_locked: boolean
}

interface BattlePassData {
  season_name: string
  current_day: number
  rewards: BattlePassReward[]
  has_pass: boolean
  expires_at?: string
}

export default function BattlePassPage() {
  const { user } = useAuth()
  const [battlePassData, setBattlePassData] = useState<BattlePassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadBattlePass()
  }, [user])

  const loadBattlePass = async () => {
    try {
      // Charger la saison active
      const { data: season, error: seasonError } = await supabase
        .from('battle_pass_seasons')
        .select('*')
        .eq('is_active', true)
        .single()

      if (seasonError) throw seasonError

      // Charger les récompenses
      const { data: rewards, error: rewardsError } = await supabase
        .from('battle_pass_rewards')
        .select('*')
        .eq('season_id', season.id)
        .order('day')

      if (rewardsError) throw rewardsError

      // Vérifier si l'utilisateur a le pass
      let hasPass = false
      let currentDay = 0
      let expiresAt = ''

      if (user) {
        const { data: userPass, error: passError } = await supabase
          .from('user_battle_passes')
          .select('*')
          .eq('user_id', user.id)
          .eq('season_id', season.id)
          .eq('is_active', true)
          .single()

        if (!passError && userPass) {
          hasPass = true
          currentDay = userPass.current_day
          expiresAt = userPass.expires_at
        }

        // Charger les claims si l'utilisateur a le pass
        const { data: claims } = await supabase
          .from('user_battle_pass_claims')
          .select('day')
          .eq('user_id', user.id)
          .eq('season_id', season.id)

        const claimedDays = new Set(claims?.map(c => c.day) || [])

        setBattlePassData({
          season_name: season.name,
          current_day: currentDay,
          has_pass: hasPass,
          expires_at: expiresAt,
          rewards: rewards.map(r => ({
            day: r.day,
            reward_type: r.reward_type,
            reward_value: r.reward_value,
            is_claimed: claimedDays.has(r.day),
            is_available: hasPass && r.day <= currentDay,
            is_locked: !hasPass || r.day > currentDay
          }))
        })
      } else {
        setBattlePassData({
          season_name: season.name,
          current_day: 0,
          has_pass: false,
          rewards: rewards.map(r => ({
            day: r.day,
            reward_type: r.reward_type,
            reward_value: r.reward_value,
            is_claimed: false,
            is_available: false,
            is_locked: true
          }))
        })
      }
    } catch (error) {
      console.error('Erreur chargement Battle Pass:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimReward = async (day: number) => {
    if (!user || !battlePassData?.has_pass || claiming) return

    setClaiming(true)
    try {
      const { data: season } = await supabase
        .from('battle_pass_seasons')
        .select('id')
        .eq('is_active', true)
        .single()

      if (!season) return

      const { error } = await supabase
        .from('user_battle_pass_claims')
        .insert({
          user_id: user.id,
          season_id: season.id,
          day
        })

      if (!error) {
        loadBattlePass()
      }
    } catch (error) {
      console.error('Erreur claim:', error)
    } finally {
      setClaiming(false)
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Coins className="h-6 w-6" />
      case 'frame': return <FrameIcon className="h-6 w-6" />
      case 'banner': return <ImageIcon className="h-6 w-6" />
      case 'pin': return <Award className="h-6 w-6" />
      case 'gold_username': return <Star className="h-6 w-6 text-yellow-400" />
      case 'special_box': return <Gift className="h-6 w-6" />
      default: return <Sparkles className="h-6 w-6" />
    }
  }

  const getRewardColor = (type: string, is_claimed: boolean, is_available: boolean) => {
    if (is_claimed) return 'from-green-500 to-emerald-600'
    if (is_available) {
      switch (type) {
        case 'gold_username': return 'from-yellow-500 to-orange-600'
        case 'special_box': return 'from-purple-500 to-pink-600'
        default: return 'from-[#4578be] to-[#5989d8]'
      }
    }
    return 'from-gray-700 to-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a2332] to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement du Battle Pass...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a2332] to-gray-900 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2">
            BATTLE PASS
          </h1>
          <p className="text-gray-400 text-lg">{battlePassData?.season_name}</p>
        </div>

        {/* Info Bar */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Progression</p>
              <p className="text-2xl font-bold text-white">
                Jour {battlePassData?.current_day || 0} / 30
              </p>
            </div>

            {!battlePassData?.has_pass ? (
              <Link href="/shop">
                <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Acheter le Pass - 21.99€
                </button>
              </Link>
            ) : (
              <div className="text-right">
                <p className="text-green-400 font-bold mb-1">✓ Pass Actif</p>
                <p className="text-gray-400 text-sm">
                  Expire le {new Date(battlePassData.expires_at!).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#4578be] to-[#5989d8]"
              initial={{ width: 0 }}
              animate={{ width: `${((battlePassData?.current_day || 0) / 30) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Fresque Horizontale (30 récompenses) */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <div className="flex gap-4 px-4 pb-4 min-w-max">
            {battlePassData?.rewards.map((reward, index) => (
              <motion.div
                key={reward.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="relative"
              >
                {/* Case récompense */}
                <div
                  className={`relative w-32 h-40 rounded-xl border-2 overflow-hidden ${
                    reward.is_claimed
                      ? 'border-green-500'
                      : reward.is_available
                      ? 'border-[#4578be] shadow-lg shadow-[#4578be]/30'
                      : 'border-gray-700'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRewardColor(reward.reward_type, reward.is_claimed, reward.is_available)}`} />
                  
                  {/* Jour */}
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-white text-xs font-bold">
                    Jour {reward.day}
                  </div>

                  {/* État */}
                  {reward.is_claimed && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {reward.is_locked && (
                    <div className="absolute top-2 right-2 bg-gray-700 rounded-full p-1">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  )}

                  {/* Icône récompense */}
                  <div className="relative h-full flex flex-col items-center justify-center gap-2 p-4">
                    <div className={`${reward.is_locked ? 'opacity-40' : ''}`}>
                      {getRewardIcon(reward.reward_type)}
                    </div>
                    <p className="text-white text-xs text-center font-medium">
                      {reward.reward_type === 'coins' && `${reward.reward_value.amount} Coins`}
                      {reward.reward_type === 'gold_username' && 'Pseudo Or'}
                      {reward.reward_type === 'frame' && 'Cadre'}
                      {reward.reward_type === 'banner' && 'Bannière'}
                      {reward.reward_type === 'pin' && 'Pin'}
                      {reward.reward_type === 'special_box' && 'Case Spéciale'}
                    </p>

                    {/* Bouton Claim */}
                    {reward.is_available && !reward.is_claimed && (
                      <button
                        onClick={() => claimReward(reward.day)}
                        disabled={claiming}
                        className="absolute bottom-2 left-2 right-2 bg-white text-gray-900 px-3 py-1 rounded text-xs font-bold hover:bg-gray-200 transition-all"
                      >
                        Récupérer
                      </button>
                    )}
                  </div>
                </div>

                {/* Ligne de connexion */}
                {index < 29 && (
                  <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-700" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}