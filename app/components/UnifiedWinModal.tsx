// UnifiedWinModal.tsx - Modal unifié pour résultats + partage
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, TrendingUp, BarChart3 } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import { createClient } from '@/utils/supabase/client'

interface UnifiedWinModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    name: string
    image_url: string
    market_value: number
    rarity: string
    probability: number
  }
  boxName: string
  isFree?: boolean
  canShare?: boolean
  onSell?: (item: any) => void
  userId?: string
  username?: string
}

const rarityColors: Record<string, string> = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b'
}

const rarityLabels: Record<string, string> = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire'
}

export function UnifiedWinModal({
  isOpen,
  onClose,
  item,
  boxName,
  isFree = false,
  canShare = false,
  onSell,
  userId,
  username
}: UnifiedWinModalProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [isSelling, setIsSelling] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const supabase = createClient()

  const glowColor = rarityColors[item.rarity.toLowerCase()] || rarityColors.common
  const rarityLabel = rarityLabels[item.rarity.toLowerCase()] || item.rarity

  const handleSell = async () => {
    if (!onSell || isFree) return
    setIsSelling(true)
    await onSell(item)
    setIsSelling(false)
    onClose()
  }

  const handleShare = async () => {
    if (!canShare || !userId || shared) return
    setIsSharing(true)

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          message: `🎉 Je viens de gagner **${item.name}** (${item.market_value.toLocaleString()} coins) dans la **${boxName}** !`,
          message_type: 'win_share'
        })

      if (!error) {
        setShared(true)
        setTimeout(() => onClose(), 1500)
      }
    } catch (error) {
      console.error('Erreur partage:', error)
    } finally {
      setIsSharing(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card */}
          <div
            className="relative rounded-2xl p-6 sm:p-8"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(17,26,46,0.95) 0%, rgba(12,18,32,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.99) 100%)',
              border: `1px solid ${isDark ? 'rgba(255,240,220,0.08)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: `0 20px 60px ${glowColor}15`
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isDark ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#969087' : 'rgba(0,0,0,0.4)'
              }}
            >
              <X size={16} />
            </button>

            {/* Title */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium uppercase mb-3"
                style={{
                  background: `${glowColor}15`,
                  color: glowColor,
                  letterSpacing: '0.1em'
                }}
              >
                {rarityLabel}
              </motion.div>
              <h2
                className="text-xl sm:text-2xl font-bold"
                style={{ color: isDark ? '#F5F0E8' : 'rgba(0,0,0,0.9)' }}
              >
                {item.name}
              </h2>
            </div>

            {/* Image avec glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="relative mb-6 flex items-center justify-center"
              style={{ minHeight: 160 }}
            >
              <div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ background: glowColor, opacity: 0.15, transform: 'scale(0.6)' }}
              />
              <img
                src={item.image_url || 'https://via.placeholder.com/160'}
                alt={item.name}
                className="relative w-32 h-32 sm:w-40 sm:h-40 object-contain"
                style={{ filter: `drop-shadow(0 8px 24px ${glowColor}30)` }}
              />
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div
                className="p-3 rounded-xl"
                style={{
                  background: isDark ? 'rgba(255,240,220,0.03)' : 'rgba(0,0,0,0.02)'
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} style={{ color: glowColor }} />
                  <span
                    className="text-[10px] uppercase font-medium"
                    style={{
                      color: isDark ? '#969087' : 'rgba(0,0,0,0.4)',
                      letterSpacing: '0.1em'
                    }}
                  >
                    Valeur
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                    alt="coin"
                    className="w-4 h-4"
                  />
                  <span className="text-lg font-black" style={{ color: glowColor }}>
                    {item.market_value.toLocaleString()}
                  </span>
                </div>
              </div>

              <div
                className="p-3 rounded-xl"
                style={{
                  background: isDark ? 'rgba(255,240,220,0.03)' : 'rgba(0,0,0,0.02)'
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 size={12} style={{ color: isDark ? '#969087' : 'rgba(0,0,0,0.4)' }} />
                  <span
                    className="text-[10px] uppercase font-medium"
                    style={{
                      color: isDark ? '#969087' : 'rgba(0,0,0,0.4)',
                      letterSpacing: '0.1em'
                    }}
                  >
                    Chance
                  </span>
                </div>
                <span
                  className="text-lg font-black"
                  style={{ color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.7)' }}
                >
                  {item.probability.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!isFree && onSell && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSell}
                  disabled={isSelling}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: isDark ? 'rgba(201,168,124,0.10)' : 'rgba(0,0,0,0.05)',
                    border: isDark ? '1px solid rgba(201,168,124,0.14)' : 'none',
                    color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.7)'
                  }}
                >
                  {isSelling ? 'Vente...' : 'Vendre'}
                </motion.button>
              )}

              {canShare && !shared && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${glowColor}, ${glowColor}dd)`,
                    boxShadow: `0 4px 16px ${glowColor}30`
                  }}
                >
                  <Share2 size={15} />
                  {isSharing ? 'Partage...' : 'Partager'}
                </motion.button>
              )}

              {(isFree || !canShare || shared) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: isDark ? 'linear-gradient(135deg, #C9A87C, #A08060)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    boxShadow: isDark ? '0 4px 16px rgba(201,168,124,0.3)' : '0 4px 16px rgba(59,130,246,0.3)'
                  }}
                >
                  {shared ? 'Partagé ✓' : 'Continuer'}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default UnifiedWinModal
