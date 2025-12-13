'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from './AuthProvider'
import {
  X, TrendingUp, Sparkles, Trophy, AlertCircle, Loader2, Zap, Target, ArrowRight, Minus, Plus, Package
} from 'lucide-react'
import UpgradeAnimation from './UpgradeAnimation'

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

interface WonReward {
  item?: {
    id: string
    name: string
    image_url: string
    market_value: number
    rarity: string
  }
  coins: number
  totalValue: number
}

export default function UpgradeModal({ isOpen, onClose, item, onSuccess }: UpgradeModalProps) {
  const { user, profile, refreshProfile } = useAuth()
  const [selectedMultiplier, setSelectedMultiplier] = useState(2)
  const [customMultiplier, setCustomMultiplier] = useState('')
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [animationResult, setAnimationResult] = useState<boolean | null>(null)
  const [wonReward, setWonReward] = useState<WonReward | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) {
      setShowResult(false)
      setShowAnimation(false)
      setIsUpgrading(false)
      setSelectedMultiplier(2)
      setCustomMultiplier('')
      setWonReward(null)
      setError(null)
      setInputFocused(false)
    }
  }, [isOpen])

  // Fonction pour trouver un objet du site dont la valeur est ≤ targetValue
  const findSuitableItem = async (targetValue: number) => {
    try {
      const { data: availableItems, error } = await supabase
        .from('items')
        .select('*')
        .lte('market_value', targetValue)
        .order('market_value', { ascending: false })
        .limit(10)

      if (error || !availableItems || availableItems.length === 0) {
        return null
      }

      // Sélectionner aléatoirement parmi les meilleurs items
      const randomIndex = Math.floor(Math.random() * Math.min(3, availableItems.length))
      return availableItems[randomIndex]
    } catch (error) {
      console.error('Error finding suitable item:', error)
      return null
    }
  }

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

  // Formule proportionnelle: Taux de réussite = 90 / multiplicateur
  // x1.5 = 60%, x2 = 45%, x3 = 30%, x10 = 9%, x100 = 0.9%
  const calculateSuccessRate = (multiplier: number) => {
    return Math.max(0.5, Math.min(95, 90 / multiplier))
  }

  const handleMultiplierChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 1.5 && num <= 100) {
      setCustomMultiplier(value)
      setSelectedMultiplier(num)
    } else if (value === '') {
      setCustomMultiplier('')
    }
  }

  const quickMultipliers = [1.5, 2, 3, 5, 10, 20, 50, 100]

  const handleUpgrade = async () => {
    if (!item || !user || isUpgrading) return

    setIsUpgrading(true)
    setShowResult(false)
    setShowAnimation(true)
    setError(null)

    let success = false

    try {
      console.log('🎯 Starting upgrade for item:', item.name)
      const successRate = calculateSuccessRate(selectedMultiplier)
      const targetValue = item.market_value * selectedMultiplier

      // L'animation dure 3 secondes
      await new Promise(resolve => setTimeout(resolve, 3000))

      success = Math.random() * 100 < successRate
      console.log('🎲 Upgrade result:', success ? 'SUCCESS' : 'FAIL', `(${successRate.toFixed(1)}% chance)`)

      // Supprimer l'objet de l'inventaire AVANT d'ajouter les rewards
      console.log('🗑️ Deleting item from inventory...')
      const { error: deleteError } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', item.id)

      if (deleteError) {
        console.error('❌ Delete error:', deleteError)
        throw new Error(`Erreur lors de la suppression de l'item: ${deleteError.message}`)
      }
      console.log('✅ Item deleted successfully')

      if (success) {
        // Trouver un objet du site dont la valeur ≤ targetValue
        console.log('🔍 Finding suitable item with max value:', targetValue)
        const wonItem = await findSuitableItem(targetValue)

        let coinsToGive = 0

        if (wonItem) {
          console.log('🎁 Found item:', wonItem.name, 'value:', wonItem.market_value)
          // Calculer la différence en coins
          coinsToGive = Math.floor(targetValue - wonItem.market_value)

          // Ajouter l'objet gagné à l'inventaire
          console.log('📦 Adding won item to inventory...')
          const { error: inventoryError } = await supabase.from('user_inventory').insert({
            user_id: user.id,
            item_id: wonItem.id,
            quantity: 1
          })

          if (inventoryError) {
            console.error('❌ Inventory insert error:', inventoryError)
            throw new Error(`Erreur lors de l'ajout de l'item: ${inventoryError.message}`)
          }
          console.log('✅ Item added to inventory')

          setWonReward({
            item: wonItem,
            coins: coinsToGive,
            totalValue: targetValue
          })
        } else {
          console.log('💰 No item found, giving all value as coins')
          // Si aucun objet trouvé, donner toute la valeur en coins
          coinsToGive = Math.floor(targetValue)
          setWonReward({
            coins: coinsToGive,
            totalValue: targetValue
          })
        }

        // Ajouter les coins
        if (coinsToGive > 0) {
          console.log('💵 Adding', coinsToGive, 'coins to profile...')
          const newBalance = (profile?.virtual_currency || 0) + coinsToGive
          const { error: coinsError } = await supabase
            .from('profiles')
            .update({
              virtual_currency: newBalance
            })
            .eq('id', user.id)

          if (coinsError) {
            console.error('❌ Coins update error:', coinsError)
            throw new Error(`Erreur lors de l'ajout des coins: ${coinsError.message}`)
          }
          console.log('✅ Coins added successfully. New balance:', newBalance)
        }

        // Refresh profile pour mettre à jour le solde
        console.log('🔄 Refreshing profile...')
        await refreshProfile()
        console.log('✅ Profile refreshed')
      }

      // Enregistrer la tentative d'upgrade (optionnel - peut être désactivé si la table n'existe pas)
      try {
        console.log('📝 Recording upgrade attempt...')
        const { error: attemptError } = await supabase.from('upgrade_attempts').insert({
          user_id: user.id,
          item_id: item.item_id,
          item_value: item.market_value,
          target_multiplier: selectedMultiplier,
          success: success,
          won_value: success ? targetValue : 0
        })

        if (attemptError) {
          console.warn('⚠️ Could not record upgrade attempt:', attemptError.message)
          // Ne pas bloquer l'upgrade si l'enregistrement échoue
        } else {
          console.log('✅ Upgrade attempt recorded')
        }
      } catch (attemptRecordError) {
        console.warn('⚠️ Upgrade attempt recording failed:', attemptRecordError)
        // Continue sans bloquer
      }

      setUpgradeSuccess(success)
      setShowAnimation(false)
      setShowResult(true)

      console.log('✅ Upgrade completed successfully!')

      // Ne pas appeler onSuccess ici - on le fera quand l'utilisateur clique sur "Fermer"
      // pour qu'il puisse voir le résultat d'abord

    } catch (error: any) {
      console.error('❌ Upgrade error:', error)
      const errorMessage = error?.message || 'Une erreur est survenue lors de l\'upgrade.'
      setError(errorMessage)
      setShowAnimation(false)
      setShowResult(false)

      // En cas d'erreur, on doit quand même rafraîchir l'inventaire
      // car l'item a déjà été supprimé
      if (onSuccess) onSuccess()
    } finally {
      setIsUpgrading(false)
    }
  }

  if (!isOpen || !item) return null

  const config = getRarityConfig(item.rarity)
  const successRate = calculateSuccessRate(selectedMultiplier)
  const potentialWin = item.market_value * selectedMultiplier

  return (
    <>
      {/* Animation overlay */}

      <AnimatePresence>
        {isOpen && !showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[55] flex items-center justify-center p-2"
            onClick={() => !isUpgrading && !showResult && onClose()}
          >
            <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md mx-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          {/* Glow effect */}

          <div className="relative backdrop-blur-xl rounded-3xl overflow-hidden scrollbar-hide  bg-white/98 dark:bg-gray-700/98"
            style={{ border: '1px solid rgba(69, 120, 190, 0.2)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(69, 120, 190, 0.1)' }}
          >
            {/* Ligne de glow animée en haut */}
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-3xl z-20">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(69, 120, 190, 0.6) 20%, rgba(69, 120, 190, 0.9) 50%, rgba(69, 120, 190, 0.6) 80%, transparent 100%)',
                  filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.6))'
                }}
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 2
                }}
              />
            </div>
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              background: 'linear-gradient(to bottom right, #4578be, transparent, #5989d8)'
            }} />

            {/* Close button */}
            <motion.button
              onClick={onClose}
              disabled={isUpgrading && !showResult}
              aria-label="Fermer le modal"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 z-20 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/30 dark:hover:bg-white/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white/90 transition-colors" />
            </motion.button>

            <div className="relative z-10 p-2 md:p-3">
              {!showResult ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-2">
                    <div className="inline-flex items-center gap-2 mb-2 flex-wrap justify-center">
                      <div className="p-3 rounded-2xl shadow-xl"
                        style={{
                          background: 'linear-gradient(135deg, #4578be, #5989d8)'
                        }}
                      >
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <h2 id="upgrade-modal-title" className="text-base font-bold text-gray-900 dark:text-white">Upgrade Item</h2>
                    </div>
                    <p className="text-gray-600 dark:text-white/50 text-xs md:text-sm px-4">Tentez votre chance pour multiplier la valeur</p>
                  </div>

                  {/* 3D Item Display OU Roulette */}
                  <div className="mb-2">
                    <AnimatePresence mode="wait">
                      {!showAnimation ? (
                        <motion.div
                          key="item-display"
                          initial={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                          className="relative perspective-1000 mx-auto max-w-[150px]"
                        >
                          <motion.div
                            className={`relative w-full aspect-square bg-gradient-to-br ${config.gradient} p-0.5 rounded-3xl ${config.glow} shadow-2xl`}
                          >
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-700/50 rounded-[23px] flex items-center justify-center p-2">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700/30 rounded-2xl" />
                              )}
                            </div>
                          </motion.div>

                          {/* Item info */}
                          <div className="text-center mt-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{item.name}</h3>
                            <div className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700/30 backdrop-blur-sm border border-gray-300 dark:border-white/10 rounded-full px-4 py-1.5">
                              <img
                                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                                alt="Coins"
                                className="w-3.5 h-3.5"
                              />
                              <span className="text-base font-black" style={{ color: '#4578be' }}>{item.market_value.toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="roulette"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <UpgradeAnimation
                            item={item}
                            multiplier={selectedMultiplier}
                            successRate={successRate}
                            onComplete={(result) => {
                              // L'animation est terminée
                            }}
                            isAnimating={showAnimation}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Multiplier selector */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-600 dark:text-white/60 uppercase tracking-wider">Multiplicateur</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900 dark:text-white">
                          x{selectedMultiplier.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-white/40">{successRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Custom multiplier input */}
                    <motion.div
                      className="mb-2 p-2 rounded-xl border-2 transition-all"
                      animate={{
                        borderColor: inputFocused ? 'var(--hybrid-accent-primary)' : 'rgba(69, 120, 190, 0.3)',
                        backgroundColor: inputFocused ? 'rgba(69, 120, 190, 0.08)' : 'rgba(69, 120, 190, 0.05)'
                      }}
                    >
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" style={{ color: '#4578be' }} />
                        Multiplicateur personnalisé (1.5x - 100x)
                      </label>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const newVal = Math.max(1.5, selectedMultiplier - 0.5)
                            setSelectedMultiplier(newVal)
                            setCustomMultiplier(newVal.toString())
                          }}
                          disabled={selectedMultiplier <= 1.5 || isUpgrading}
                          className="p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                          style={{
                            boxShadow: selectedMultiplier > 1.5 ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <Minus className="w-3.5 h-3.5 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                        </motion.button>
                        <input
                          type="number"
                          min="1.5"
                          max="100"
                          step="0.1"
                          value={customMultiplier}
                          onChange={(e) => handleMultiplierChange(e.target.value)}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          disabled={isUpgrading}
                          placeholder="2.5"
                          className="flex-1 px-4 py-3 bg-white dark:bg-gray-700/70 border-2 rounded-xl text-gray-900 dark:text-white font-bold text-center focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            borderColor: inputFocused ? 'var(--hybrid-accent-primary)' : 'rgba(69, 120, 190, 0.2)',
                            boxShadow: inputFocused ? '0 0 0 3px rgba(69, 120, 190, 0.1)' : 'none'
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const newVal = Math.min(100, selectedMultiplier + 0.5)
                            setSelectedMultiplier(newVal)
                            setCustomMultiplier(newVal.toString())
                          }}
                          disabled={selectedMultiplier >= 100 || isUpgrading}
                          className="p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                          style={{
                            boxShadow: selectedMultiplier < 100 ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* Quick multipliers */}
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
                      {quickMultipliers.map((mult) => {
                        const rate = calculateSuccessRate(mult)
                        return (
                          <motion.button
                            key={mult}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setSelectedMultiplier(mult)
                              setCustomMultiplier(mult.toString())
                            }}
                            disabled={isUpgrading}
                            className="relative group"
                          >
                            <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 blur transition-opacity"
                              style={{
                                background: 'linear-gradient(135deg, #4578be, #5989d8)'
                              }}
                            />
                            <div
                              className={`relative py-3 px-2 rounded-xl font-bold transition-all ${
                                selectedMultiplier === mult
                                  ? 'text-white shadow-lg'
                                  : 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10'
                              }`}
                              style={selectedMultiplier === mult ? {
                                background: 'linear-gradient(135deg, #4578be, #5989d8)'
                              } : {}}
                            >
                              <div className="text-base font-black">x{mult}</div>
                              <div className="text-[9px] opacity-70">{rate.toFixed(1)}%</div>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="mb-2 p-2 rounded-xl border-2 border-red-500/30 bg-red-500/10 flex items-start gap-2"
                      >
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
                        </div>
                        <button
                          onClick={() => setError(null)}
                          className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div className="bg-gradient-to-br backdrop-blur-sm rounded-2xl p-2 border" style={{
                      backgroundImage: `linear-gradient(to bottom right, rgba(69, 120, 190, 0.1), rgba(89, 137, 216, 0.1))`,
                      borderColor: 'rgba(69, 120, 190, 0.2)'
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3.5 h-3.5" style={{ color: '#4578be' }} />
                        <span className="text-xs font-bold text-gray-600 dark:text-white/60 uppercase">Taux de réussite</span>
                      </div>
                      <div className="text-base font-black mb-2" style={{ color: '#4578be' }}>{successRate.toFixed(1)}%</div>
                      <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-700/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${successRate}%` }}
                          className="h-full"
                          style={{ background: 'linear-gradient(90deg, #4578be, #5989d8)' }}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br backdrop-blur-sm rounded-2xl p-2 border" style={{
                      backgroundImage: `linear-gradient(to bottom right, rgba(69, 120, 190, 0.1), rgba(89, 137, 216, 0.1))`,
                      borderColor: 'rgba(69, 120, 190, 0.2)'
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: '#4578be' }} />
                        <span className="text-xs font-bold text-gray-600 dark:text-white/60 uppercase">Gain potentiel</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <img
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="w-5 h-5"
                        />
                        <span className="text-base font-black" style={{ color: '#4578be' }}>
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
                    className="relative w-full py-2 rounded-2xl font-black text-base overflow-hidden group disabled:opacity-50"
                  >
                    <div className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(135deg, #4578be, #5989d8)'
                      }}
                    />
                    <motion.div
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />

                    <div className="relative flex items-center justify-center gap-2 text-white">
                      {isUpgrading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>UPGRADING...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          <span>UPGRADE MAINTENANT</span>
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
                  className="text-center py-2"
                >
                  {upgradeSuccess ? (
                    <>
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                        className="mb-2"
                      >
                        <div className="inline-block p-2 rounded-full shadow-2xl" style={{
                          background: 'linear-gradient(135deg, #4578be, #5989d8)',
                          boxShadow: `0 25px 50px -12px rgba(69, 120, 190, 0.5)`
                        }}>
                          <Trophy className="w-12 h-12 text-white" />
                        </div>
                      </motion.div>

                      <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-black text-gray-900 dark:text-white mb-2"
                      >
                        RÉUSSI !
                      </motion.h3>

                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600 dark:text-white/60 mb-2"
                      >
                        Vous avez remporté l'upgrade x{selectedMultiplier.toFixed(1)}
                      </motion.p>

                      {/* Rewards display */}
                      <div className="space-y-1 mb-2">
                        {wonReward?.item && (
                          <motion.div
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                            className="backdrop-blur-xl border-2 rounded-2xl p-2 mx-auto max-w-md"
                            style={{
                              backgroundColor: 'rgba(69, 120, 190, 0.1)',
                              borderColor: 'rgba(69, 120, 190, 0.3)'
                            }}
                          >
                            <div className="flex items-center gap-4 mb-2">
                              <Package className="w-5 h-5" style={{ color: '#4578be' }} />
                              <span className="text-sm font-bold text-gray-600 dark:text-white/60 uppercase">Objet gagné</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <img
                                src={wonReward.item.image_url}
                                alt={wonReward.item.name}
                                className="w-20 h-20 object-contain rounded-xl bg-white/10 p-2"
                              />
                              <div className="flex-1 text-left">
                                <p className="text-base font-black text-gray-900 dark:text-white">{wonReward.item.name}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <img
                                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                                    alt="Coins"
                                    className="w-3.5 h-3.5"
                                  />
                                  <span className="text-sm font-bold" style={{ color: '#4578be' }}>
                                    {wonReward.item.market_value.toLocaleString()} coins
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {wonReward && wonReward.coins > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: wonReward.item ? 0.5 : 0.4, type: 'spring', damping: 12 }}
                            className="backdrop-blur-xl border-2 rounded-2xl p-2 mx-auto max-w-md"
                            style={{
                              backgroundColor: 'rgba(69, 120, 190, 0.1)',
                              borderColor: 'rgba(69, 120, 190, 0.3)'
                            }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" style={{ color: '#4578be' }} />
                                <span className="text-sm font-bold text-gray-600 dark:text-white/60 uppercase">
                                  {wonReward.item ? 'Bonus coins' : 'Coins gagnés'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <img
                                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                                  alt="Coins"
                                  className="w-5 h-5"
                                />
                                <span className="text-xl font-black" style={{ color: '#4578be' }}>
                                  +{wonReward.coins.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="pt-4"
                        >
                          <p className="text-xs text-gray-500 dark:text-white/40">
                            Valeur totale : {wonReward?.totalValue.toLocaleString()} coins
                          </p>
                        </motion.div>
                      </div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                        className="mb-2"
                      >
                        <div className="inline-block p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-2xl shadow-red-500/50">
                          <AlertCircle className="w-12 h-12 text-white" />
                        </div>
                      </motion.div>

                      <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-black text-gray-900 dark:text-white mb-2"
                      >
                        ÉCHEC
                      </motion.h3>

                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600 dark:text-white/60 mb-2"
                      >
                        Votre item a été perdu
                      </motion.p>

                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-500 dark:text-white/40 text-sm"
                      >
                        Bonne chance la prochaine fois
                      </motion.p>
                    </>
                  )}

                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Appeler onSuccess pour rafraîchir l'inventaire/panier
                      if (onSuccess) onSuccess()
                      // Fermer le modal
                      onClose()
                    }}
                    className="mt-2 px-8 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/40 dark:hover:bg-white/20 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
                  >
                    Fermer
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}