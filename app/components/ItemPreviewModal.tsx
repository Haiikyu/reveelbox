// ItemPreviewModal.tsx - Modal de preview détaillée des items
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, Users, Clock, Star } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import type { FreedropItem } from '@/lib/services/freedrop'

interface ItemPreviewModalProps {
  item: FreedropItem | null
  isOpen: boolean
  onClose: () => void
}

const rarityColors = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b'
}

export function ItemPreviewModal({ item, isOpen, onClose }: ItemPreviewModalProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (!item) return null

  const glowColor = rarityColors[item.rarity.toLowerCase() as keyof typeof rarityColors] || rarityColors.common

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-3xl overflow-hidden relative"
              style={{
                background: resolvedTheme === 'dark'
                  ? 'linear-gradient(180deg, rgba(17, 26, 46, 0.98) 0%, rgba(12, 18, 32, 0.99) 100%)'
                  : 'linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 250, 252, 0.99) 100%)',
                border: `1px solid ${resolvedTheme === 'dark' ? 'rgba(255,240,220,0.10)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: resolvedTheme === 'dark'
                  ? `0 32px 64px -16px rgba(0,0,0,0.6), 0 0 100px ${glowColor}20`
                  : '0 32px 64px -16px rgba(0,0,0,0.2)'
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(255,240,220,0.07)' : 'rgba(0,0,0,0.05)',
                  color: resolvedTheme === 'dark' ? '#C0B8AD' : 'black'
                }}
              >
                <X size={20} />
              </button>

              {/* Header avec gradient */}
              <div
                className="relative h-48 overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, ${glowColor}20 0%, transparent 100%)`
                }}
              >
                {/* Glow effect */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`
                  }}
                />

                {/* Item image */}
                <div className="relative h-full flex items-center justify-center">
                  <motion.img
                    src={item.image_url || 'https://via.placeholder.com/200'}
                    alt={item.name}
                    className="h-40 object-contain"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      filter: `drop-shadow(0 20px 40px ${glowColor}60)`
                    }}
                  />
                </div>

                {/* Rarity badge */}
                <div
                  className="absolute top-4 left-4 px-4 py-2 rounded-full font-bold text-sm"
                  style={{
                    background: glowColor,
                    color: 'white',
                    boxShadow: `0 4px 12px ${glowColor}40`
                  }}
                >
                  {item.rarity.toUpperCase()}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-3xl font-black mb-2" style={{ color: isDark ? '#F5F0E8' : '#111827' }}>
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                      alt="coins"
                      className="w-8 h-8"
                    />
                    <span className="text-4xl font-black" style={{ color: glowColor }}>
                      {item.market_value.toLocaleString()}
                    </span>
                    <span className="text-lg" style={{ color: isDark ? '#969087' : '#6B7280' }}>coins</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.03)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-yellow-500" />
                      <span className="text-xs" style={{ color: isDark ? '#969087' : '#6B7280' }}>Rareté</span>
                    </div>
                    <div className="text-lg font-bold" style={{ color: isDark ? '#F5F0E8' : '#111827' }}>
                      {item.rarity}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.03)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-blue-500" />
                      <span className="text-xs" style={{ color: isDark ? '#969087' : '#6B7280' }}>Chance</span>
                    </div>
                    <div className="text-lg font-bold" style={{ color: isDark ? '#F5F0E8' : '#111827' }}>
                      {item.probability.toFixed(2)}%
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.03)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-green-500" />
                      <span className="text-xs" style={{ color: isDark ? '#969087' : '#6B7280' }}>Gagnants</span>
                    </div>
                    <div className="text-lg font-bold" style={{ color: isDark ? '#F5F0E8' : '#111827' }}>
                      {Math.floor(Math.random() * 1000)}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: resolvedTheme === 'dark' ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.03)'
                  }}
                >
                  <div className="text-sm leading-relaxed" style={{ color: isDark ? '#C0B8AD' : '#4B5563' }}>
                    Cet item fait partie de la catégorie <strong>{item.rarity}</strong> avec une probabilité de <strong>{item.probability.toFixed(2)}%</strong> d'être obtenu. Sa valeur marchande est de <strong>{item.market_value.toLocaleString()} coins</strong>.
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${glowColor}, ${glowColor}dd)`,
                      color: 'white',
                      boxShadow: `0 4px 12px ${glowColor}40`
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ItemPreviewModal
