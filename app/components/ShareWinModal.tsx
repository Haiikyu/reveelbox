// ShareWinModal.tsx - Modal pour partager un gros win dans le chat global
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, Sparkles } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import { createClient } from '@/utils/supabase/client'

interface ShareWinModalProps {
  isOpen: boolean
  onClose: () => void
  itemName: string
  boxName: string
  itemValue: number
  itemRarity: string
  itemImage: string
  userId: string
  username: string
}

const rarityColors = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b'
}

export function ShareWinModal({
  isOpen,
  onClose,
  itemName,
  boxName,
  itemValue,
  itemRarity,
  itemImage,
  userId,
  username
}: ShareWinModalProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [isSharing, setIsSharing] = useState(false)
  const supabase = createClient()

  const glowColor = rarityColors[itemRarity.toLowerCase() as keyof typeof rarityColors] || rarityColors.legendary

  const handleShare = async () => {
    setIsSharing(true)

    try {
      // Poster le message dans le chat global
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          message: `🎉 Je viens de gagner **${itemName}** (${itemValue.toLocaleString()} coins) dans la **${boxName}** !`,
          message_type: 'win_share'
        })

      if (error) {
        console.error('Erreur partage:', error)
      }

      // Fermer le modal après partage
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Erreur critique:', error)
    } finally {
      setIsSharing(false)
    }
  }

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
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(12px)'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl overflow-hidden relative"
              style={{
                background: isDark
                  ? 'linear-gradient(180deg, rgba(17, 26, 46, 0.98) 0%, rgba(12, 18, 32, 0.99) 100%)'
                  : 'linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 250, 252, 0.99) 100%)',
                border: `1px solid ${isDark ? 'rgba(255,240,220,0.10)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: isDark
                  ? `0 32px 64px -16px rgba(0,0,0,0.6), 0 0 120px ${glowColor}30`
                  : '0 32px 64px -16px rgba(0,0,0,0.2)'
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                disabled={isSharing}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: isDark ? 'rgba(255,240,220,0.07)' : 'rgba(0,0,0,0.05)',
                  color: isDark ? '#C0B8AD' : 'black'
                }}
              >
                <X size={20} />
              </button>

              {/* Header avec effet de particules */}
              <div
                className="relative h-56 overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, ${glowColor}25 0%, transparent 100%)`
                }}
              >
                {/* Glow effect animé */}
                <motion.div
                  className="absolute inset-0 opacity-40"
                  animate={{
                    background: [
                      `radial-gradient(circle at 30% 50%, ${glowColor}, transparent 60%)`,
                      `radial-gradient(circle at 70% 50%, ${glowColor}, transparent 60%)`,
                      `radial-gradient(circle at 30% 50%, ${glowColor}, transparent 60%)`
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Particules flottantes */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                      }}
                      animate={{
                        y: [0, -30, 0],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: 'easeInOut'
                      }}
                    >
                      <Sparkles size={16} style={{ color: glowColor }} />
                    </motion.div>
                  ))}
                </div>

                {/* Item image */}
                <div className="relative h-full flex items-center justify-center">
                  <motion.img
                    src={itemImage || 'https://via.placeholder.com/200'}
                    alt={itemName}
                    className="h-48 object-contain"
                    animate={{
                      y: [0, -15, 0],
                      rotateY: [0, 360]
                    }}
                    transition={{
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                      rotateY: { duration: 4, repeat: Infinity, ease: "linear" }
                    }}
                    style={{
                      filter: `drop-shadow(0 25px 50px ${glowColor}80)`
                    }}
                  />
                </div>

                {/* Rarity badge */}
                <motion.div
                  className="absolute top-4 left-4 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
                  animate={{
                    boxShadow: [
                      `0 4px 12px ${glowColor}40`,
                      `0 8px 24px ${glowColor}60`,
                      `0 4px 12px ${glowColor}40`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background: glowColor,
                    color: 'white'
                  }}
                >
                  <Sparkles size={14} />
                  {itemRarity.toUpperCase()}
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div className="text-center">
                  <motion.h2
                    className="text-3xl font-black mb-3"
                    style={{ color: isDark ? '#F5F0E8' : '#111827' }}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🎉 Félicitations !
                  </motion.h2>
                  <p className="text-lg mb-4" style={{ color: isDark ? '#C0B8AD' : '#4B5563' }}>
                    Vous venez de gagner un item <strong style={{ color: glowColor }}>{itemRarity}</strong> !
                  </p>
                  <div
                    className="inline-block px-6 py-3 rounded-2xl mb-4"
                    style={{
                      background: isDark ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${glowColor}40`
                    }}
                  >
                    <div className="text-2xl font-black mb-1" style={{ color: isDark ? '#F5F0E8' : '#111827' }}>
                      {itemName}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <img
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                        alt="coins"
                        className="w-6 h-6"
                      />
                      <span className="text-xl font-black" style={{ color: glowColor }}>
                        {itemValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div
                  className="p-4 rounded-2xl text-center"
                  style={{
                    background: isDark ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.03)'
                  }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: isDark ? '#C0B8AD' : '#4B5563' }}>
                    Voulez-vous partager cette victoire exceptionnelle avec la communauté dans le <strong>chat global</strong> ?
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isSharing}
                    className="flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-105"
                    style={{
                      background: isDark ? 'rgba(201,168,124,0.10)' : 'rgba(0,0,0,0.05)',
                      color: isDark ? '#F5F0E8' : 'black',
                      border: `1px solid ${isDark ? 'rgba(201,168,124,0.14)' : 'rgba(0,0,0,0.1)'}`
                    }}
                  >
                    Non merci
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex-1 py-3 rounded-2xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${glowColor}, ${glowColor}dd)`,
                      color: 'white',
                      boxShadow: `0 4px 12px ${glowColor}40`
                    }}
                  >
                    {isSharing ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <span>Partage...</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        <span>Partager mon win !</span>
                      </>
                    )}
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

export default ShareWinModal
