// ========================================
// app/components/Wheel/FreedropWheel.tsx - NOUVELLE ROULETTE FREEDROP
// ========================================

'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { FreedropItem } from '@/lib/services/freedrop'

interface FreedropWheelProps {
  items: FreedropItem[]
  winningItem: FreedropItem | null
  fastMode?: boolean
  onFinish: () => void
  isSpinning?: boolean
}

interface WheelItemProps {
  item: FreedropItem
  index: number
  isWinning: boolean
  rarityColors: Record<string, string>
  isSpinning: boolean
  isCenterItem: boolean
}

const WHEEL_CONFIG = {
  ITEM_WIDTH: 180,
  ITEM_HEIGHT: 200,
  TOTAL_ITEMS: 60,
  WINNING_POSITION: 40,
} as const

export function FreedropWheel({ 
  items, 
  winningItem, 
  fastMode = false, 
  onFinish,
  isSpinning = false
}: FreedropWheelProps) {
  const [wheelSequence, setWheelSequence] = useState<FreedropItem[]>([])
  const [isReady, setIsReady] = useState(false)
  const [centerItemIndex, setCenterItemIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  const rarityColors = useMemo(() => ({
    common: '#10b981',
    uncommon: '#3b82f6',
    rare: '#8b5cf6',
    epic: '#d946ef',
    legendary: '#f59e0b'
  }), [])

  const createDisplayPool = useCallback((baseItems: FreedropItem[]) => {
    const displayPool: FreedropItem[] = []
    
    baseItems.forEach(item => {
      let weight = Math.max(1, Math.round(item.probability * 1.5))
      
      if (item.rarity === 'legendary') {
        weight = weight * 8
      } else if (item.rarity === 'epic') {
        weight = weight * 4
      } else if (item.rarity === 'rare') {
        weight = weight * 2
      }
      
      for (let i = 0; i < weight; i++) {
        displayPool.push(item)
      }
    })
    
    return displayPool
  }, [])

  const shuffleArray = useCallback((array: any[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const generateNewSequence = useCallback((baseItems: FreedropItem[], targetItem?: FreedropItem) => {
    if (!baseItems.length) return []

    const displayPool = createDisplayPool(baseItems)
    const timestamp = Date.now() + Math.random() * 1000
    const sequence: FreedropItem[] = []
    const tripleShuffled = shuffleArray(shuffleArray(shuffleArray(displayPool)))
    
    for (let i = 0; i < WHEEL_CONFIG.TOTAL_ITEMS; i++) {
      const randomIndex = Math.floor(Math.random() * tripleShuffled.length)
      sequence.push({
        ...tripleShuffled[randomIndex],
        id: `wheel-${timestamp}-${i}-${tripleShuffled[randomIndex].id}`
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

  const calculateCenterItem = useCallback((currentPosition: number) => {
    if (!containerRef.current) return -1
    
    const containerWidth = containerRef.current.offsetWidth
    const centerOffset = containerWidth / 2
    const adjustedPosition = currentPosition + centerOffset
    const itemIndex = Math.round(adjustedPosition / WHEEL_CONFIG.ITEM_WIDTH)
    
    return Math.max(0, Math.min(itemIndex, wheelSequence.length - 1))
  }, [wheelSequence.length])

  // ✅ ANIMATION PARFAITEMENT FLUIDE - RALENTISSEMENT PROGRESSIF CONTINU
  const animateWheel = useCallback((targetPosition: number, duration: number) => {
    if (!wheelRef.current || isAnimatingRef.current) return

    isAnimatingRef.current = true
    const startTime = performance.now()
    const startPosition = 0
    const distance = targetPosition

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 🎯 UNE SEULE COURBE FLUIDE - easeOutQuint
      // Commence vite, ralentit progressivement, arrêt très doux
      const easeProgress = 1 - Math.pow(1 - progress, 5)
      
      const currentPosition = startPosition + (distance * easeProgress)

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateX(-${currentPosition}px)`

        if (isSpinning) {
          const centerIndex = calculateCenterItem(currentPosition)
          setCenterItemIndex(centerIndex)
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        isAnimatingRef.current = false
        setCenterItemIndex(-1)

        // Reste en position finale sur l'objet gagnant
        setTimeout(() => {
          onFinish()
        }, 500)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [onFinish, isSpinning, calculateCenterItem])

  useEffect(() => {
    if (items.length > 0 && !isReady) {
      const sequence = generateNewSequence(items)
      setWheelSequence(sequence)
      setIsReady(true)
      console.log('🎲 Séquence initiale générée:', sequence.length, 'items')
    }
  }, [items, generateNewSequence, isReady])

  useEffect(() => {
    if (!isSpinning || !winningItem || !isReady) return

    console.log('🎰 NOUVEAU SPIN - Génération nouvelle séquence avec item:', winningItem.name)

    setCenterItemIndex(-1)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    isAnimatingRef.current = false

    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
      wheelRef.current.style.transition = 'none'
    }

    const newSequence = generateNewSequence(items, winningItem)
    console.log('🔄 Nouvelle séquence générée avec', newSequence.length, 'items différents')

    setWheelSequence(newSequence)

    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transform = 'translateX(0px)'
      }

      setTimeout(() => {
        const finalPosition = calculateFinalPosition()
        const duration = fastMode ? 3000 : 7000 // ✅ 7 SECONDES pour Try Free
        console.log('🎯 Position finale calculée:', finalPosition)
        animateWheel(finalPosition, duration)
      }, 200)
    }, 100)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      isAnimatingRef.current = false
    }
  }, [isSpinning, winningItem, isReady, items, generateNewSequence, calculateFinalPosition, animateWheel, fastMode])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (!isReady || wheelSequence.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-300">Préparation de la roue...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-hidden overflow-y-visible"
      style={{ height: 650, paddingTop: 80, paddingBottom: 80 }}
    >
      {/* ✨ TRAIT INDICATEUR VERTICAL - CENTRÉ */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none z-30 flex items-center justify-center">
        {/* Trait vertical lumineux */}
        <div 
          className="w-1 h-full bg-gradient-to-b from-transparent via-yellow-400 to-transparent rounded-full"
          style={{ 
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)',
            filter: 'blur(0.5px)'
          }} 
        />
        
        {/* Ligne centrale plus épaisse pour plus de visibilité */}
        <div 
          className="absolute w-1.5 h-32 bg-yellow-400 rounded-full"
          style={{ 
            boxShadow: '0 0 25px rgba(251, 191, 36, 1), 0 0 50px rgba(251, 191, 36, 0.6)',
          }} 
        />
      </div>

      {/* Container principal - TOUJOURS VISIBLE */}
      <div className="relative h-full will-change-transform">
        <motion.div 
          key={`wheel-${isSpinning ? 'spinning' : 'static'}`}
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
              isWinning={index === WHEEL_CONFIG.WINNING_POSITION && winningItem?.id === item.id.split('-')[3]}
              rarityColors={rarityColors}
              isSpinning={isSpinning}
              isCenterItem={isSpinning && index === centerItemIndex}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

const WheelItem = ({ item, index, isWinning, rarityColors, isSpinning, isCenterItem }: WheelItemProps) => {
  const glowColor = rarityColors[item.rarity.toLowerCase()] || rarityColors.common
  const shouldShowHover = item.rarity === 'legendary' || item.rarity === 'epic' || item.rarity === 'rare' || isCenterItem
  
  return (
    <motion.div 
      className="flex-shrink-0 flex items-center justify-center p-6 group overflow-visible"
      style={{ 
        width: WHEEL_CONFIG.ITEM_WIDTH, 
        height: WHEEL_CONFIG.ITEM_HEIGHT,
        position: 'relative'
      }}
      whileHover={!isSpinning ? { 
        scale: 1.1,
        y: -5,
        transition: { duration: 0.2 }
      } : {}}
    >
      <div className="relative w-full h-full overflow-visible" style={{ isolation: 'auto' }}>
        
        <motion.div 
          className="absolute inset-3 rounded-xl blur-xl"
          style={{ 
            backgroundColor: glowColor,
            zIndex: -1
          }}
          animate={{
            opacity: shouldShowHover || isWinning ? 0.25 : 0.1,
            scale: shouldShowHover || isWinning ? 1.1 : 1.0
          }}
          transition={{ duration: 0.3 }}
        />
        
        <motion.img
          src={item.image_url || 'https://via.placeholder.com/160x160/F3F4F6/9CA3AF?text=?'}
          alt={item.name}
          className="relative w-full h-full object-contain transition-all duration-300 z-10 p-6"
          style={{
            filter: isWinning && !isSpinning 
              ? `drop-shadow(0 15px 30px ${glowColor}80) brightness(1.4)` 
              : shouldShowHover || isCenterItem
              ? `drop-shadow(0 10px 20px ${glowColor}60) brightness(1.25)`
              : `drop-shadow(0 5px 15px ${glowColor}40) brightness(1.1)`
          }}
          animate={{
            scale: isWinning && !isSpinning 
              ? 1.2 
              : (isCenterItem && isSpinning) 
              ? 1.3
              : shouldShowHover 
              ? 1.1 
              : 1.5
          }}
          transition={{ duration: 0.3 }}
          draggable={false}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://via.placeholder.com/160x160/F3F4F6/9CA3AF?text=?'
          }}
        />
        
        <motion.div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full transition-all duration-300"
          style={{ backgroundColor: glowColor }}
          animate={{
            boxShadow: shouldShowHover || isWinning || isCenterItem
              ? `0 0 20px ${glowColor}` 
              : `0 0 10px ${glowColor}70`,
            scale: (shouldShowHover || isWinning || isCenterItem) ? 1 : 1.2,
            opacity: 1
          }}
          transition={{ duration: 0.3 }}
        />

        {isWinning && !isSpinning && (
          <motion.div
            className="absolute inset-4 border-3 rounded-xl"
            style={{ borderColor: glowColor }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

export default FreedropWheel