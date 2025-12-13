// app/components/landing/LiveWinnerTicker.tsx - Ticker de Gagnants en Direct

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WinnerNotification {
  id: string
  username: string
  item: string
  boxName: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  timestamp: number
}

const RARITY_COLORS = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#9333EA',
  legendary: '#FFD700'
}

// Mock data - en production, connecter à Supabase Realtime
const MOCK_WINS: Omit<WinnerNotification, 'id' | 'timestamp'>[] = [
  { username: 'Alex', item: 'iPhone 15 Pro', boxName: 'Legendary Box', rarity: 'legendary' },
  { username: 'Marie', item: 'AirPods Pro', boxName: 'Premium Box', rarity: 'epic' },
  { username: 'Thomas', item: 'PlayStation 5', boxName: 'Elite Box', rarity: 'legendary' },
  { username: 'Sophie', item: 'Montre Connectée', boxName: 'Mystery Box', rarity: 'rare' },
  { username: 'Lucas', item: 'Casque Gaming', boxName: 'Starter Box', rarity: 'rare' },
  { username: 'Emma', item: 'Nintendo Switch', boxName: 'Premium Box', rarity: 'epic' },
  { username: 'Hugo', item: 'iPad Air', boxName: 'Deluxe Box', rarity: 'legendary' },
  { username: 'Lea', item: 'Écouteurs Bose', boxName: 'Champion Box', rarity: 'epic' }
]

export default function LiveWinnerTicker() {
  const [currentWins, setCurrentWins] = useState<WinnerNotification[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Simuler des gains en temps réel (remplacer par Supabase Realtime en prod)
    const interval = setInterval(() => {
      const randomWin = MOCK_WINS[Math.floor(Math.random() * MOCK_WINS.length)]
      const newWin: WinnerNotification = {
        ...randomWin,
        id: `win-${Date.now()}-${Math.random()}`,
        timestamp: Date.now()
      }

      setCurrentWins(prev => {
        const updated = [newWin, ...prev].slice(0, 5) // Garder les 5 derniers
        return updated
      })
    }, 8000) // Nouveau gain toutes les 8 secondes

    // Premier gain immédiat
    const firstWin: WinnerNotification = {
      ...MOCK_WINS[0],
      id: `win-initial`,
      timestamp: Date.now()
    }
    setCurrentWins([firstWin])

    return () => clearInterval(interval)
  }, [])

  // Formater le temps relatif
  const getRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `il y a ${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `il y a ${minutes}min`
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
    >
      {/* Conteneur du ticker */}
      <div className="relative h-20 overflow-hidden bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        {/* Animated gradient line top */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent)'
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scaleX: [0.5, 1, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Défilement horizontal des notifications */}
        <div className="relative h-full flex items-center">
          <motion.div
            className="flex items-center gap-4 px-6"
            animate={{
              x: ['0%', '-50%']
            }}
            transition={{
              x: {
                duration: 30,
                repeat: Infinity,
                ease: 'linear'
              }
            }}
          >
            {/* Répéter 2x pour effet de boucle */}
            {[...currentWins, ...currentWins].map((win, index) => (
              <motion.div
                key={`${win.id}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-md rounded-xl border border-white/10 shadow-lg whitespace-nowrap pointer-events-auto cursor-pointer hover:bg-gray-700/90 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {/* Icon trophy avec couleur de rareté */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${RARITY_COLORS[win.rarity]}20`,
                    border: `2px solid ${RARITY_COLORS[win.rarity]}40`
                  }}
                >
                  <Trophy
                    className="w-5 h-5"
                    style={{ color: RARITY_COLORS[win.rarity] }}
                  />
                </div>

                {/* Info */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{win.username}</span>
                  <span className="text-gray-400 text-sm">a gagné</span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: RARITY_COLORS[win.rarity] }}
                  >
                    {win.item}
                  </span>
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-white/10" />

                {/* Box name + time */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{win.boxName}</span>
                  <span>•</span>
                  <span>{getRelativeTime(win.timestamp)}</span>
                </div>

                {/* Rarity badge */}
                <div
                  className="px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${RARITY_COLORS[win.rarity]}20`,
                    color: RARITY_COLORS[win.rarity]
                  }}
                >
                  {win.rarity}
                </div>

                {/* Particles effect */}
                {win.rarity === 'legendary' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                          backgroundColor: RARITY_COLORS.legendary,
                          left: `${20 + i * 15}%`,
                          top: '50%'
                        }}
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bouton toggle visibility */}
        <motion.button
          onClick={() => setIsVisible(!isVisible)}
          className="absolute top-2 right-2 pointer-events-auto w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-white text-xs">✕</span>
        </motion.button>

        {/* Gradient overlays sur les côtés */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  )
}