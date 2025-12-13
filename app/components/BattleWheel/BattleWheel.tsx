// app/components/BattleWheel/BattleWheel.tsx
'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

interface Item {
  id: string
  name: string
  image_url: string
  market_value: number
  rarity: string
}

interface BattleWheelProps {
  lootBoxId?: string // ID de la box pour charger les items
  winningItem: Item | null
  onFinish: () => void
  isSpinning?: boolean
  playerSide: 'left' | 'right' // Pour distinguer les deux joueurs
}

const WHEEL_CONFIG = {
  ITEM_WIDTH: 120,
  ITEM_HEIGHT: 140,
  TOTAL_ITEMS: 50,
  WINNING_POSITION: 35,
} as const

const RARITY_COLORS = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b',
  mythic: '#ef4444'
}

export function BattleWheel({
  lootBoxId,
  winningItem,
  onFinish,
  isSpinning = false,
  playerSide
}: BattleWheelProps) {
  const [items, setItems] = useState<Item[]>([])
  const [wheelSequence, setWheelSequence] = useState<Item[]>([])
  const [isReady, setIsReady] = useState(false)
  const [showOnlyWinner, setShowOnlyWinner] = useState(false)
  const [loading, setLoading] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  // Charger les items de la box
  useEffect(() => {
    if (!lootBoxId) return

    const loadItems = async () => {
      try {
        const { data, error } = await supabase
          .from('loot_box_items')
          .select(`
            probability,
            items (
              id,
              name,
              image_url,
              market_value,
              rarity
            )
          `)
          .eq('loot_box_id', lootBoxId)

        if (error) throw error

        const itemsList = data
          .filter((item: any) => item.items)
          .map((item: any) => ({
            ...item.items,
            probability: item.probability
          }))

        setItems(itemsList)
        setLoading(false)
      } catch (error) {
        console.error('Error loading items:', error)
        setLoading(false)
      }
    }

    loadItems()
  }, [lootBoxId])

  // Shuffle array
  const shuffleArray = useCallback((array: any[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  // Créer un pool d'items avec boost visuel
  const createDisplayPool = useCallback((baseItems: Item[]) => {
    const displayPool: Item[] = []

    baseItems.forEach(item => {
      let weight = Math.max(1, Math.round((item as any).probability || 1))

      if (item.rarity === 'legendary') weight = weight * 4
      else if (item.rarity === 'epic') weight = weight * 3
      else if (item.rarity === 'rare') weight = weight * 2

      for (let i = 0; i < weight; i++) {
        displayPool.push(item)
      }
    })

    return displayPool
  }, [])

  // Générer une nouvelle séquence
  const generateNewSequence = useCallback((baseItems: Item[], targetItem?: Item) => {
    if (!baseItems.length) return []

    const displayPool = createDisplayPool(baseItems)
    const timestamp = Date.now() + Math.random() * 1000
    const sequence: Item[] = []

    const shuffled = shuffleArray(shuffleArray(displayPool))

    for (let i = 0; i < WHEEL_CONFIG.TOTAL_ITEMS; i++) {
      const randomIndex = Math.floor(Math.random() * shuffled.length)
      sequence.push({
        ...shuffled[randomIndex],
        id: `wheel-${timestamp}-${i}-${shuffled[randomIndex].id}`
      })
    }

    if (targetItem) {
      sequence[WHEEL_CONFIG.WINNING_POSITION] = {
        ...targetItem,
        id: `winning-${timestamp}-${WHEEL_CONFIG.WINNING_POSITION}-${targetItem.id}`
      }
    }

    return sequence
  }, [createDisplayPool, shuffleArray])

  const calculateFinalPosition = useCallback(() => {
    if (!containerRef.current) return 0

    const containerWidth = containerRef.current.offsetWidth
    const centerOffset = containerWidth / 2
    const winningItemPosition = WHEEL_CONFIG.WINNING_POSITION * WHEEL_CONFIG.ITEM_WIDTH

    return winningItemPosition - centerOffset + (WHEEL_CONFIG.ITEM_WIDTH / 2)
  }, [])

  // Animation de la roue
  const animateWheel = useCallback((targetPosition: number, duration: number) => {
    if (!wheelRef.current || isAnimatingRef.current) return

    isAnimatingRef.current = true
    const startTime = performance.now()
    const startPosition = 0
    const distance = targetPosition

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing personnalisé
      let easeProgress
      if (progress < 0.15) {
        easeProgress = Math.pow(progress / 0.15, 3) * 0.02
      } else if (progress < 0.85) {
        const adjustedProgress = (progress - 0.15) / 0.7
        easeProgress = 0.02 + Math.pow(adjustedProgress, 2) * 0.93
      } else {
        const adjustedProgress = (progress - 0.85) / 0.15
        easeProgress = 0.95 + (1 - Math.pow(1 - adjustedProgress, 4)) * 0.05
      }

      const currentPosition = startPosition + (distance * easeProgress)

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateX(-${currentPosition}px)`
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        isAnimatingRef.current = false

        setTimeout(() => {
          setShowOnlyWinner(true)
          setTimeout(() => {
            onFinish()
          }, 100)
        }, 800)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [onFinish])

  // Initialisation
  useEffect(() => {
    if (items.length > 0 && !isReady) {
      const sequence = generateNewSequence(items)
      setWheelSequence(sequence)
      setIsReady(true)
    }
  }, [items, generateNewSequence, isReady])

  // Démarrer l'animation quand on reçoit un item gagnant
  useEffect(() => {
    if (!isSpinning || !winningItem || !isReady) return

    setShowOnlyWinner(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    isAnimatingRef.current = false

    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
      wheelRef.current.style.transition = 'none'
    }

    const newSequence = generateNewSequence(items, winningItem)
    setWheelSequence(newSequence)

    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transform = 'translateX(0px)'
      }

      setTimeout(() => {
        const finalPosition = calculateFinalPosition()
        const duration = 3500 // 3.5 secondes
        animateWheel(finalPosition, duration)
      }, 100)
    }, 50)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      isAnimatingRef.current = false
    }
  }, [isSpinning, winningItem, isReady, items, generateNewSequence, calculateFinalPosition, animateWheel])

  // Reset
  useEffect(() => {
    if (!isSpinning && wheelRef.current && !showOnlyWinner) {
      wheelRef.current.style.transform = 'translateX(0px)'
    }
  }, [isSpinning, showOnlyWinner])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (loading || !isReady || wheelSequence.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center rounded-xl bg-gray-900/30 backdrop-blur-sm border border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white/60 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  const glowColor = playerSide === 'left' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'
  const borderColor = playerSide === 'left' ? 'border-blue-500/50' : 'border-red-500/50'

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl bg-gray-900/30 backdrop-blur-sm border ${borderColor}`}
      style={{ height: 180 }}
    >
      {/* Indicateur central */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full z-10"
        style={{
          background: playerSide === 'left'
            ? 'linear-gradient(to bottom, transparent, rgb(59, 130, 246), transparent)'
            : 'linear-gradient(to bottom, transparent, rgb(239, 68, 68), transparent)',
          boxShadow: `0 0 20px ${glowColor}`
        }}
      />

      {/* Container de la roue */}
      <div className="relative h-full will-change-transform">
        <AnimatePresence mode="wait">
          {showOnlyWinner && winningItem ? (
            <motion.div
              key="winner-display"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center h-full"
            >
              <WinnerDisplay
                item={winningItem}
                playerSide={playerSide}
              />
            </motion.div>
          ) : (
            <motion.div
              key="wheel"
              ref={wheelRef}
              className="flex items-center h-full"
              style={{
                transform: 'translateX(0px)',
                willChange: 'transform',
                backfaceVisibility: 'hidden'
              }}
            >
              {wheelSequence.map((item, index) => (
                <WheelItem
                  key={item.id}
                  item={item}
                  index={index}
                  isWinning={index === WHEEL_CONFIG.WINNING_POSITION}
                  isSpinning={isSpinning}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Affichage du gagnant
const WinnerDisplay = ({ item, playerSide }: { item: Item; playerSide: 'left' | 'right' }) => {
  const glowColor = RARITY_COLORS[item.rarity.toLowerCase() as keyof typeof RARITY_COLORS] || RARITY_COLORS.common

  return (
    <motion.div
      className="flex flex-col items-center gap-2 py-2"
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            backgroundColor: glowColor,
            transform: 'scale(1.5)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <img
          src={item.image_url}
          alt={item.name}
          className="relative w-24 h-24 object-contain"
          style={{
            filter: `drop-shadow(0 10px 30px ${glowColor}) brightness(1.2)`
          }}
        />
      </div>
    </motion.div>
  )
}

// Item de la roue
const WheelItem = ({
  item,
  index,
  isWinning,
  isSpinning
}: {
  item: Item
  index: number
  isWinning: boolean
  isSpinning: boolean
}) => {
  const glowColor = RARITY_COLORS[item.rarity.toLowerCase() as keyof typeof RARITY_COLORS] || RARITY_COLORS.common

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center p-2"
      style={{
        width: WHEEL_CONFIG.ITEM_WIDTH,
        height: WHEEL_CONFIG.ITEM_HEIGHT,
      }}
    >
      <div className="relative w-full h-full">
        <motion.div
          className="absolute inset-2 rounded-lg blur-lg"
          style={{
            backgroundColor: glowColor,
            opacity: 0.15
          }}
        />

        <img
          src={item.image_url}
          alt={item.name}
          className="relative w-full h-full object-contain p-3"
          style={{
            filter: `drop-shadow(0 4px 12px ${glowColor}60) brightness(1.1)`
          }}
          draggable={false}
          loading="lazy"
        />

        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{
            backgroundColor: glowColor,
            boxShadow: `0 0 8px ${glowColor}`
          }}
        />
      </div>
    </div>
  )
}

export default BattleWheel
