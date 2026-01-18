'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Crown, ArrowRight, Sparkles, Lock } from 'lucide-react'
import Link from 'next/link'

interface BattlePassPreview {
  current_day: number
  has_pass: boolean
  season_name: string
  next_reward: {
    day: number
    type: string
    value: any
  } | null
}

export default function BattlePassWidget() {
  const { user } = useAuth()
  const [preview, setPreview] = useState<BattlePassPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPreview()
  }, [user])

  const loadPreview = async () => {
    try {
      const { data: season } = await supabase
        .from('battle_pass_seasons')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!season) {
        setLoading(false)
        return
      }

      let hasPass = false
      let currentDay = 0

      if (user) {
        const { data: userPass } = await supabase
          .from('user_battle_passes')
          .select('current_day')
          .eq('user_id', user.id)
          .eq('season_id', season.id)
          .eq('is_active', true)
          .single()

        if (userPass) {
          hasPass = true
          currentDay = userPass.current_day
        }
      }

      // Charger la prochaine récompense
      const { data: nextReward } = await supabase
        .from('battle_pass_rewards')
        .select('*')
        .eq('season_id', season.id)
        .gt('day', currentDay)
        .order('day')
        .limit(1)
        .single()

      setPreview({
        current_day: currentDay,
        has_pass: hasPass,
        season_name: season.name,
        next_reward: nextReward ? {
          day: nextReward.day,
          type: nextReward.reward_type,
          value: nextReward.reward_value
        } : null
      })
    } catch (error) {
      console.error('Erreur preview Battle Pass:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !preview) {
    return null
  }

  return (
    <Link href="/battlepass">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-yellow-500/50 overflow-hidden cursor-pointer group"
        style={{
          boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)'
        }}
      >
        {/* Particules animées */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-0 bottom-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                BATTLE PASS
              </h3>
            </div>
            {!preview.has_pass && (
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                21.99€
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">
                {preview.has_pass ? `Jour ${preview.current_day}/30` : 'Débloquez 30 récompenses'}
              </span>
              <span className="text-gray-400 text-xs">
                {preview.season_name}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-600"
                initial={{ width: 0 }}
                animate={{ width: `${(preview.current_day / 30) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          {/* Next Reward */}
          {preview.next_reward && (
            <div className="bg-black/30 rounded-xl p-3 mb-4">
              <p className="text-gray-400 text-xs mb-1">
                {preview.has_pass ? 'Prochaine récompense' : 'Débloque avec le pass'}
              </p>
              <div className="flex items-center gap-2">
                {!preview.has_pass && <Lock className="h-4 w-4 text-gray-500" />}
                <p className="text-white font-medium text-sm">
                  Jour {preview.next_reward.day} : {' '}
                  {preview.next_reward.type === 'coins' && `${preview.next_reward.value.amount} Coins`}
                  {preview.next_reward.type === 'gold_username' && 'Pseudo Or'}
                  {preview.next_reward.type === 'frame' && 'Cadre Exclusif'}
                  {preview.next_reward.type === 'banner' && 'Bannière'}
                  {preview.next_reward.type === 'pin' && 'Pin Rare'}
                  {preview.next_reward.type === 'special_box' && 'Case Spéciale'}
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-500/50 transition-all group-hover:scale-105">
            {preview.has_pass ? 'Voir mes récompenses' : 'Acheter le Pass'}
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Floating Icons */}
          <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <Sparkles className="h-12 w-12 text-yellow-400" />
          </div>
        </div>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
      </motion.div>
    </Link>
  )
}