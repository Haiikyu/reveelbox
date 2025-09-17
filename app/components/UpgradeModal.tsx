import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles,
  ChevronRight,
  Zap,
  Trophy,
  Info,
  Percent,
  Calculator,
  Shield,
  Flame,
  Diamond,
  AlertCircle
} from 'lucide-react'

interface UpgradeItem {
  id: string
  item_id: string
  name: string
  image_url?: string
  rarity: string
  market_value: number
  quantity?: number
}

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  item: UpgradeItem | null
  onSuccess: (newValue: number) => void
  userId: string
}

// Configuration des multiplicateurs prédéfinis
const PRESET_MULTIPLIERS = [
  { value: 1.5, chance: 60, label: 'Safe', color: 'from-green-400 to-green-500' },
  { value: 2, chance: 45, label: 'Classic', color: 'from-blue-400 to-blue-500' },
  { value: 5, chance: 18, label: 'Risky', color: 'from-purple-400 to-purple-500' },
  { value: 10, chance: 9, label: 'Extreme', color: 'from-pink-400 to-pink-500' },
]

export default function UpgradeModal({ isOpen, onClose, item, onSuccess, userId }: UpgradeModalProps) {
  const [customMultiplier, setCustomMultiplier] = useState('')
  const [selectedMultiplier, setSelectedMultiplier] = useState(2)
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [finalValue, setFinalValue] = useState(0)
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setSelectedMultiplier(2)
      setCustomMultiplier('')
      setIsCustomMode(false)
      setIsUpgrading(false)
      setShowResult(false)
      setUpgradeSuccess(false)
      setAnimationPhase(0)
    }
  }, [isOpen])

  const calculateChance = (multiplier: number) => {
    if (multiplier <= 1.5) return 60
    if (multiplier <= 2) return 45
    if (multiplier <= 3) return 30
    if (multiplier <= 5) return 18
    if (multiplier <= 10) return 9
    if (multiplier <= 50) return 2
    if (multiplier <= 100) return 1
    if (multiplier <= 500) return 0.2
    return 0.1
  }

  const currentChance = calculateChance(selectedMultiplier)

  const handleCustomMultiplierChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 1.1 && num <= 1000) {
      setCustomMultiplier(value)
      setSelectedMultiplier(num)
    } else if (value === '') {
      setCustomMultiplier('')
      setSelectedMultiplier(2)
    }
  }

  const handleUpgrade = async () => {
    if (!item || isUpgrading) return

    setIsUpgrading(true)
    setShowResult(false)
    setAnimationPhase(1)
    
    const phases = [
      { duration: 1000, phase: 1 },
      { duration: 1500, phase: 2 },
      { duration: 1500, phase: 3 },
      { duration: 500, phase: 4 },
    ]

    let totalTime = 0
    phases.forEach(({ duration, phase }) => {
      setTimeout(() => setAnimationPhase(phase), totalTime)
      totalTime += duration
    })

    setTimeout(async () => {
      const random = Math.random() * 100
      const success = random <= currentChance

      if (success) {
        const newValue = Math.floor(item.market_value * selectedMultiplier)
        setFinalValue(newValue)
        setUpgradeSuccess(true)
        
        try {
          const response = await fetch('/api/upgrade-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inventory_id: item.id,
              multiplier: selectedMultiplier,
              new_value: newValue,
              user_id: userId
            })
          })
          
          if (response.ok) {
            onSuccess(newValue)
          }
        } catch (error) {
          console.error('Upgrade error:', error)
        }
      } else {
        setUpgradeSuccess(false)
        setFinalValue(0)
        
        try {
          await fetch('/api/upgrade-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inventory_id: item.id,
              multiplier: selectedMultiplier,
              new_value: 0,
              user_id: userId,
              failed: true
            })
          })
        } catch (error) {
          console.error('Failed upgrade error:', error)
        }
      }

      setAnimationPhase(0)
      setShowResult(true)
      setIsUpgrading(false)
    }, totalTime)
  }

  const getRarityInfo = (rarity: string) => {
    const rarityMap = {
      common: { label: 'Common', bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400' },
      uncommon: { label: 'Uncommon', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
      rare: { label: 'Rare', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
      epic: { label: 'Epic', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
      legendary: { label: 'Legendary', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' }
    }
    return rarityMap[rarity?.toLowerCase()] || rarityMap.common
  }

  if (!isOpen || !item) return null

  const rarityInfo = getRarityInfo(item.rarity)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-800/50"
          style={{
            background: 'linear-gradient(135deg, #1a1f2e 0%, #151922 100%)'
          }}
        >
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-gray-800/50">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
            
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Item Upgrade</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showResult ? (
              <>
                {/* Item Display */}
                <div className="mb-6">
                  <div className={`${rarityInfo.bg} ${rarityInfo.border} border rounded-xl p-4`}>
                    <div className="flex items-center gap-4">
                      {/* Item Image */}
                      <motion.div
                        animate={{
                          scale: animationPhase === 2 ? [1, 1.05, 1] : 1,
                          rotate: animationPhase === 3 ? [0, 5, -5, 0] : 0,
                        }}
                        transition={{
                          scale: { duration: 0.5, repeat: animationPhase === 2 ? Infinity : 0 },
                          rotate: { duration: 0.3, repeat: animationPhase === 3 ? Infinity : 0 }
                        }}
                        className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#0f1318] border border-gray-700/50"
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-gray-600" />
                          </div>
                        )}
                        {isUpgrading && (
                          <motion.div
                            className="absolute inset-0 bg-purple-500/20"
                            animate={{ opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                      
                      {/* Item Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${rarityInfo.bg} ${rarityInfo.text}`}>
                          {rarityInfo.label}
                        </span>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <img 
                              src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                              alt="Coins" 
                              className="h-4 w-4" 
                            />
                            <span className="text-white font-semibold">{item.market_value.toLocaleString()}</span>
                          </div>
                          {!isUpgrading && (
                            <>
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                              <div className="flex items-center gap-1">
                                <img 
                                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                                  alt="Coins" 
                                  className="h-4 w-4" 
                                />
                                <span className="text-purple-400 font-bold">
                                  {Math.floor(item.market_value * selectedMultiplier).toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {isUpgrading && (
                      <div className="mt-4">
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 4.5, ease: 'linear' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multiplier Selection */}
                {!isUpgrading && (
                  <>
                    {/* Mode Toggle */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => setIsCustomMode(false)}
                        className={`py-2.5 rounded-lg font-medium transition-all ${
                          !isCustomMode 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-[#0f1318] text-gray-400 hover:text-white'
                        }`}
                      >
                        Preset
                      </button>
                      <button
                        onClick={() => setIsCustomMode(true)}
                        className={`py-2.5 rounded-lg font-medium transition-all ${
                          isCustomMode 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-[#0f1318] text-gray-400 hover:text-white'
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {!isCustomMode ? (
                      /* Preset Multipliers */
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {PRESET_MULTIPLIERS.map((mult) => (
                          <button
                            key={mult.value}
                            onClick={() => setSelectedMultiplier(mult.value)}
                            className={`p-3 rounded-lg border transition-all ${
                              selectedMultiplier === mult.value
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-gray-700 bg-[#0f1318] hover:border-gray-600'
                            }`}
                          >
                            <div className={`text-lg font-bold bg-gradient-to-r ${mult.color} bg-clip-text text-transparent`}>
                              x{mult.value}
                            </div>
                            <div className="text-xs text-gray-400">{mult.chance}%</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Custom Multiplier */
                      <div className="mb-4">
                        <div className="bg-[#0f1318] rounded-lg p-4 border border-gray-700">
                          <label className="block text-sm text-gray-400 mb-2">
                            Custom Multiplier (1.1 - 1000)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={customMultiplier}
                              onChange={(e) => handleCustomMultiplierChange(e.target.value)}
                              placeholder="Ex: 23.65"
                              step="0.01"
                              min="1.1"
                              max="1000"
                              className="flex-1 px-3 py-2 bg-[#1a1f2e] text-white rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const random = (Math.random() * 50 + 1.5).toFixed(2)
                                handleCustomMultiplierChange(random)
                              }}
                              className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                            >
                              Random
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats Display */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-[#0f1318] rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{currentChance.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Success</div>
                      </div>
                      <div className="bg-[#0f1318] rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-400">x{selectedMultiplier}</div>
                        <div className="text-xs text-gray-500">Multiplier</div>
                      </div>
                      <div className="bg-[#0f1318] rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-orange-400">
                          {Math.floor(item.market_value * selectedMultiplier).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Potential</div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                        <div className="text-sm text-red-400">
                          <span className="font-semibold">High Risk Operation:</span> Failure will result in permanent loss of this item
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleUpgrade}
                        disabled={!selectedMultiplier || selectedMultiplier < 1.1}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Upgrade (x{selectedMultiplier}) • {currentChance.toFixed(1)}%
                      </button>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-[#0f1318] text-gray-400 rounded-lg font-medium hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {/* Upgrading Animation */}
                {isUpgrading && (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block mb-4"
                    >
                      <Sparkles className="h-12 w-12 text-purple-400" />
                    </motion.div>
                    <p className="text-lg font-semibold text-white mb-2">
                      Processing Upgrade...
                    </p>
                    <p className="text-sm text-gray-400">
                      Multiplier x{selectedMultiplier} • Chance: {currentChance.toFixed(1)}%
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Result Display */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                {upgradeSuccess ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="inline-block mb-4"
                    >
                      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Trophy className="h-10 w-10 text-green-400" />
                      </div>
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Upgrade Successful!
                    </h3>
                    
                    <p className="text-gray-400 mb-4">
                      Your item has been upgraded x{selectedMultiplier}
                    </p>
                    
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <span className="text-gray-400">New Value:</span>
                      <div className="flex items-center gap-1">
                        <img 
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                          alt="Coins" 
                          className="h-5 w-5" 
                        />
                        <span className="text-xl font-bold text-green-400">
                          {finalValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={onClose}
                        className="px-8 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
                      >
                        Collect
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="inline-block mb-4"
                    >
                      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                        <X className="h-10 w-10 text-red-400" />
                      </div>
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Upgrade Failed
                    </h3>
                    
                    <p className="text-gray-400 mb-2">
                      The upgrade was unsuccessful
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      You had {currentChance.toFixed(2)}% chance of success
                    </p>
                    
                    <button
                      onClick={onClose}
                      className="px-8 py-3 bg-[#0f1318] text-gray-400 rounded-lg font-medium hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}