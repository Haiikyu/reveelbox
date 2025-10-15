'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from './AuthProvider'
import {
  X, TrendingUp, Sparkles, Trophy, AlertCircle, Loader2, Zap, Target, ArrowRight
} from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  item?: {
    id: string
    item_id: string
    name: string
    image_url?: string
    rarity: string
    market_value: number
  } | null
  onSuccess?: () => void
}

const MULTIPLIERS = [
  { value: 2, color: 'from-green-500 to-teal-600', shadow: 'shadow-green-500/50', label: 'Safe', chance: '~25%' },
  { value: 5, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/50', label: 'Low', chance: '~10%' },
  { value: 10, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/50', label: 'Medium', chance: '~5%' },
  { value: 20, color: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/50', label: 'High', chance: '~2.5%' },
  { value: 50, color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/50', label: 'Extreme', chance: '~1%' },
  { value: 100, color: 'from-fuchsia-500 to-pink-600', shadow: 'shadow-fuchsia-500/50', label: 'Insane', chance: '~0.5%' },
]

export default function UpgradeModal({ isOpen, onClose, item, onSuccess }: UpgradeModalProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [selectedMultiplier, setSelectedMultiplier] = useState(2)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [wonValue, setWonValue] = useState(0)
  const [rotation, setRotation] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) {
      setShowResult(false)
      setIsUpgrading(false)
      setRotation(0)
      setSelectedMultiplier(2)
    }
  }, [isOpen])

  const getRarityConfig = (rarity: string) => {
    const configs: Record<string, { gradient: string; glow: string }> = {
      common: { gradient: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/40' },
      rare: { gradient: 'from-blue-400 to-blue-600', glow: 'shadow-blue-500/50' },
      epic: { gradient: 'from-purple-400 to-purple-600', glow: 'shadow-purple-500/50' },
      legendary: { gradient: 'from-amber-400 via-orange-500 to-red-500', glow: 'shadow-amber-500/60' },
      mythic: { gradient: 'from-cyan-400 via-pink-500 to-purple-600', glow: 'shadow-pink-500/60' },
    }
    return configs[rarity?.toLowerCase()] || configs.common
  }

  const calculateSuccessRate = (multiplier: number, itemValue: number) => {
    const baseRate = 50 / multiplier
    const valueBonus = Math.min(itemValue / 100, 10)
    return Math.max(5, Math.min(95, baseRate + valueBonus))
  }

  const handleUpgrade = async () => {
    if (!item || !user || isUpgrading) return

    setIsUpgrading(true)
    setShowResult(false)

    try {
      const successRate = calculateSuccessRate(selectedMultiplier, item.market_value)

      // Animation 3D
      const rotationInterval = setInterval(() => {
        setRotation(prev => prev + 25)
      }, 40)

      await new Promise(resolve => setTimeout(resolve, 3000))
      clearInterval(rotationInterval)

      const success = Math.random() * 100 < successRate
      const newValue = success ? item.market_value * selectedMultiplier : 0

      await supabase.from('upgrade_attempts').insert({
        user_id: user.id,
        item_id: item.item_id,
        item_value: item.market_value,
        target_multiplier: selectedMultiplier,
        success: success,
        won_value: newValue
      })

      if (success) {
        await supabase
          .from('profiles')
          .update({
            virtual_currency: (profile?.virtual_currency || 0) + newValue
          })
          .eq('id', user.id)
        await refreshProfile()
      }

      await supabase.from('user_inventory').delete().eq('id', item.id)

      setUpgradeSuccess(success)
      setWonValue(newValue)
      setShowResult(true)

      if (onSuccess) onSuccess()

    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsUpgrading(false)
      setRotation(0)
    }
  }

  if (!isOpen || !item) return null

  const config = getRarityConfig(item.rarity)
  const successRate = calculateSuccessRate(selectedMultiplier, item.market_value)
  const potentialWin = item.market_value * selectedMultiplier
  const selectedMult = MULTIPLIERS.find(m => m.value === selectedMultiplier) || MULTIPLIERS[0]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4"
        onClick={() => !isUpgrading && !showResult && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl"
        >
          {/* Glow effect */}
          <div className={`absolute -inset-1 bg-gradient-to-r ${selectedMult.color} rounded-3xl blur-2xl opacity-20`} />

          <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5" />

            {/* Close button */}
            <button
              onClick={onClose}
              disabled={isUpgrading}
              className="absolute top-4 right-4 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50 group"
            >
              <X className="w-5 h-5 text-white/60 group-hover:text-white/90 transition-colors" />
            </button>

            <div className="relative z-10 p-8">
              {!showResult ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-3">
                      <div className={`p-3 bg-gradient-to-br ${selectedMult.color} rounded-2xl ${selectedMult.shadow} shadow-xl`}>
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-3xl font-black text-white">Upgrade Item</h2>
                    </div>
                    <p className="text-white/50 text-sm">Risk it for the multiplier</p>
                  </div>

                  {/* 3D Item Display */}
                  <div className="mb-8">
                    <div className="relative perspective-1000 mx-auto max-w-xs">
                      <motion.div
                        animate={{
                          rotateY: isUpgrading ? rotation : 0,
                          scale: isUpgrading ? [1, 1.08, 1] : 1
                        }}
                        transition={{
                          rotateY: { duration: 0.04, ease: 'linear' },
                          scale: { duration: 0.6, repeat: isUpgrading ? Infinity : 0 }
                        }}
                        className={`relative w-full aspect-square bg-gradient-to-br ${config.gradient} p-0.5 rounded-3xl ${config.glow} shadow-2xl`}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div className="w-full h-full bg-slate-950 rounded-[23px] flex items-center justify-center p-8">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="max-w-full max-h-full object-contain"
                              style={{ filter: isUpgrading ? 'blur(1px) brightness(1.3)' : 'none' }}
                            />
                          ) : (
                            <div className="w-20 h-20 bg-white/5 rounded-2xl" />
                          )}
                        </div>

                        {/* Particles */}
                        {isUpgrading && (
                          <>
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-1.5 h-1.5 bg-white rounded-full"
                                initial={{ x: '50%', y: '50%', opacity: 0 }}
                                animate={{
                                  x: `${50 + Math.cos((i * Math.PI * 2) / 8) * 180}%`,
                                  y: `${50 + Math.sin((i * Math.PI * 2) / 8) * 180}%`,
                                  opacity: [0, 1, 0]
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: i * 0.08,
                                  ease: 'easeOut'
                                }}
                              />
                            ))}
                          </>
                        )}
                      </motion.div>

                      {/* Item info */}
                      <div className="text-center mt-5">
                        <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
                          <img
                            src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                            alt="Coins"
                            className="w-4 h-4"
                          />
                          <span className="text-lg font-black" style={{ color: 'var(--hybrid-accent-primary)' }}>{item.market_value.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multiplier selector */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-white/60 uppercase tracking-wider">Multiplier</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                          x{selectedMultiplier}
                        </span>
                        <span className="text-xs text-white/40">{selectedMult.chance}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {MULTIPLIERS.map((mult) => (
                        <motion.button
                          key={mult.value}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedMultiplier(mult.value)}
                          disabled={isUpgrading}
                          className="relative group"
                        >
                          <div className={`absolute -inset-0.5 bg-gradient-to-r ${mult.color} rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity`} />
                          <div
                            className={`relative py-3 px-2 rounded-xl font-bold transition-all ${
                              selectedMultiplier === mult.value
                                ? `bg-gradient-to-br ${mult.color} text-white ${mult.shadow} shadow-lg`
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            <div className="text-lg font-black">x{mult.value}</div>
                            <div className="text-[9px] opacity-70 uppercase">{mult.label}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border" style={{
                      backgroundImage: `linear-gradient(to bottom right, rgba(var(--hybrid-accent-primary-rgb), 0.1), rgba(var(--hybrid-accent-secondary-rgb), 0.1))`,
                      borderColor: 'rgba(var(--hybrid-accent-primary-rgb), 0.2)'
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4" style={{ color: 'var(--hybrid-accent-primary)' }} />
                        <span className="text-xs font-bold text-white/60 uppercase">Success Rate</span>
                      </div>
                      <div className="text-2xl font-black mb-2" style={{ color: 'var(--hybrid-accent-primary)' }}>{successRate.toFixed(1)}%</div>
                      <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${successRate}%` }}
                          className="h-full"
                          style={{ background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))` }}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white/60 uppercase">Potential Win</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <img
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="w-5 h-5"
                        />
                        <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                          {potentialWin.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upgrade button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="relative w-full py-4 rounded-2xl font-black text-lg overflow-hidden group disabled:opacity-50"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${selectedMult.color}`} />
                    <motion.div
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />

                    <div className="relative flex items-center justify-center gap-3 text-white">
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>UPGRADING...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          <span>UPGRADE NOW</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </div>
                  </motion.button>
                </>
              ) : (
                /* Result */
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  {upgradeSuccess ? (
                    <>
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                        className="mb-6"
                      >
                        <div className="inline-block p-8 rounded-full shadow-2xl" style={{
                          background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                          boxShadow: `0 25px 50px -12px rgba(var(--hybrid-accent-primary-rgb), 0.5)`
                        }}>
                          <Trophy className="w-16 h-16 text-white" />
                        </div>
                      </motion.div>

                      <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-black text-white mb-3"
                      >
                        SUCCESS!
                      </motion.h3>

                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/60 mb-8"
                      >
                        You won the upgrade
                      </motion.p>

                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                        className="inline-flex items-center gap-3 backdrop-blur-xl border rounded-2xl px-10 py-5"
                        style={{
                          backgroundColor: 'rgba(var(--hybrid-accent-primary-rgb), 0.1)',
                          borderColor: 'rgba(var(--hybrid-accent-primary-rgb), 0.3)'
                        }}
                      >
                        <img
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="w-10 h-10"
                        />
                        <span className="text-5xl font-black" style={{ color: 'var(--hybrid-accent-primary)' }}>
                          +{wonValue.toLocaleString()}
                        </span>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                        className="mb-6"
                      >
                        <div className="inline-block p-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-2xl shadow-red-500/50">
                          <AlertCircle className="w-16 h-16 text-white" />
                        </div>
                      </motion.div>

                      <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-black text-white mb-3"
                      >
                        FAILED
                      </motion.h3>

                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/60 mb-2"
                      >
                        Your item has been lost
                      </motion.p>

                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/40 text-sm"
                      >
                        Better luck next time
                      </motion.p>
                    </>
                  )}

                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="mt-8 px-12 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                  >
                    Close
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
