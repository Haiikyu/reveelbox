// ========================================
// app/components/Wheel/Wheel.tsx - Container overflow dynamique
// ========================================

'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// ✅ IMPORT CORRIGÉ
import type { FreedropItem } from '@/lib/services/freedrop'

interface WheelProps {
  items: FreedropItem[]
  winningItem: FreedropItem | null
  fastMode?: boolean
  onFinish: () => void
  isSpinning?: boolean
}

interface WinnerDisplayProps {
  item: FreedropItem
  rarityColors: Record<string, string>
}

interface WheelItemProps {
  item: FreedropItem
  index: number
  isWinning: boolean
  rarityColors: Record<string, string>
  isSpinning: boolean
  isCenterItem: boolean
}

// Configuration finale optimisée
const WHEEL_CONFIG = {
  ITEM_WIDTH: 180,
  ITEM_HEIGHT: 200,
  TOTAL_ITEMS: 60,
  WINNING_POSITION: 40,
} as const

export function Wheel({ 
  items, 
  winningItem, 
  fastMode = false, 
  onFinish,
  isSpinning = false
}: WheelProps) {
  const [wheelSequence, setWheelSequence] = useState<FreedropItem[]>([])
  const [isReady, setIsReady] = useState(false)
  const [showOnlyWinner, setShowOnlyWinner] = useState(false)
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

  // CORRECTION 1: Fonction de boost des légendaires pour l'affichage
  const createDisplayPool = useCallback((baseItems: FreedropItem[]) => {
    const displayPool: FreedropItem[] = []
    
    baseItems.forEach(item => {
      // Poids de base selon la probabilité
      let weight = Math.max(1, Math.round(item.probability * 1.5))
      
      // BOOST pour l'affichage visuel (pas le calcul de gain)
      if (item.rarity === 'legendary') {
        weight = weight * 8 // 8x plus de légendaires dans l'affichage
      } else if (item.rarity === 'epic') {
        weight = weight * 4 // 4x plus d'épiques
      } else if (item.rarity === 'rare') {
        weight = weight * 2 // 2x plus de rares
      }
      
      for (let i = 0; i < weight; i++) {
        displayPool.push(item)
      }
    })
    
    return displayPool
  }, [])

  // CORRECTION 2: Fonction de shuffle vraiment aléatoire
  const shuffleArray = useCallback((array: any[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  // CORRECTION 3: Génération NOUVELLE à chaque fois
  const generateNewSequence = useCallback((baseItems: FreedropItem[], targetItem?: FreedropItem) => {
    if (!baseItems.length) return []

    // Créer un pool d'affichage avec boost visuel des légendaires
    const displayPool = createDisplayPool(baseItems)
    
    // Nouvelle séquence avec timestamp unique
    const timestamp = Date.now() + Math.random() * 1000
    const sequence: FreedropItem[] = []
    
    // Triple shuffle pour maximum de randomisation
    const tripleShuffled = shuffleArray(shuffleArray(shuffleArray(displayPool)))
    
    // Générer la séquence avec vraie randomisation
    for (let i = 0; i < WHEEL_CONFIG.TOTAL_ITEMS; i++) {
      const randomIndex = Math.floor(Math.random() * tripleShuffled.length)
      sequence.push({
        ...tripleShuffled[randomIndex],
        id: `wheel-${timestamp}-${i}-${tripleShuffled[randomIndex].id}`
      })
    }

    // Forcer l'item gagnant à la position exacte seulement si fourni
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

  // ✅ ANIMATION OPTIMISÉE
  const animateWheel = useCallback((targetPosition: number, duration: number) => {
    if (!wheelRef.current || isAnimatingRef.current) return

    isAnimatingRef.current = true
    const startTime = performance.now()
    const startPosition = 0
    const distance = targetPosition

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      let easeProgress
      if (progress < 0.15) {
        easeProgress = Math.pow(progress / 0.15, 3) * 0.02
      } else if (progress < 0.8) {
        const adjustedProgress = (progress - 0.15) / 0.65
        easeProgress = 0.02 + Math.pow(adjustedProgress, 2) * 0.93
      } else {
        const adjustedProgress = (progress - 0.8) / 0.2
        easeProgress = 0.95 + (1 - Math.pow(1 - adjustedProgress, 4)) * 0.05
      }

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

        // Afficher le winner après l'animation
        setTimeout(() => {
          setShowOnlyWinner(true)
          setTimeout(() => {
            onFinish()
          }, 100)
        }, 1500)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [onFinish, isSpinning, calculateCenterItem])

  // CORRECTION 4: Initialisation première fois seulement
  useEffect(() => {
    if (items.length > 0 && !isReady) {
      const sequence = generateNewSequence(items)
      setWheelSequence(sequence)
      setIsReady(true)
      console.log('🎲 Séquence initiale générée:', sequence.length, 'items')
    }
  }, [items, generateNewSequence, isReady])

  // CORRECTION 5: NOUVELLE SÉQUENCE à chaque spin
  useEffect(() => {
    if (!isSpinning || !winningItem || !isReady) return

    console.log('🎰 NOUVEAU SPIN - Génération nouvelle séquence avec item:', winningItem.name)

    setShowOnlyWinner(false)
    setCenterItemIndex(-1)

    // Arrêt complet de toute animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    isAnimatingRef.current = false

    // Reset position immédiat
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
      wheelRef.current.style.transition = 'none'
    }

    // CORRECTION 6: GÉNÉRER UNE NOUVELLE SÉQUENCE COMPLÈTE
    const newSequence = generateNewSequence(items, winningItem)
    console.log('🔄 Nouvelle séquence générée avec', newSequence.length, 'items différents')

    // Appliquer la nouvelle séquence
    setWheelSequence(newSequence)

    setTimeout(() => {
      if (wheelRef.current) {
        wheelRef.current.style.transform = 'translateX(0px)'
      }

      setTimeout(() => {
        const finalPosition = calculateFinalPosition()
        const duration = fastMode ? 3000 : 5000
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

  // ✅ RESET STANDARD
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
      // ✅ Overflow-x hidden, overflow-y visible pour le halo
      className="relative w-full overflow-x-hidden overflow-y-visible"
      style={{ height: 650, paddingTop: 80, paddingBottom: 80 }} // Hauteur augmentée avec padding pour le halo
    >

      
      {/* Container principal */}
      <div className="relative h-full will-change-transform">
        <AnimatePresence mode="wait">
          {showOnlyWinner && winningItem ? (
            <motion.div
              key="winner-display"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 0.92 }}
              className="flex items-center justify-center h-full"
            >
              <WinnerDisplay 
                item={winningItem} 
                rarityColors={rarityColors}
              />
            </motion.div>
          ) : (
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
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ✅ WINNER DISPLAY AVEC HALO PLUS GRAND POUR DÉBORDEMENT
const WinnerDisplay = ({ item, rarityColors }: WinnerDisplayProps) => {
  const glowColor = rarityColors[item.rarity.toLowerCase()] || rarityColors.common
  
  return (
    <motion.div
      className="flex flex-col items-center gap-4 py-8 px-8"
      animate={{
        y: [0, -12, 0],
        scale: [1, 1.03, 1]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="relative">
        {/* Halo complet visible */}
        <motion.div
          className="absolute inset-0 rounded-full blur-3xl opacity-30"
          style={{
            backgroundColor: glowColor,
            transform: 'scale(1.8)',
            transformOrigin: 'center'
          }}
          animate={{
            scale: [1.8, 2, 1.8],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Image principale */}
        <motion.img
          src={item.image_url || 'https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=?'}
          alt={item.name}
          className="relative w-64 h-64 object-contain"
          style={{
            filter: `drop-shadow(0 20px 60px ${glowColor}80) brightness(1.2)`
          }}
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=?'
          }}
        />
      </div>
      
<div className="text-center">
  <motion.h3 
    className="text-2xl font-bold text-gray-900 dark:text-white mb-4" 
    style={{ color: glowColor }}
  >
    {item.name}
  </motion.h3>
  
  <motion.div 
    className="flex items-center gap-4 justify-center" 
    animate={{ opacity: [0.9, 1, 0.9] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    <img 
      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"   // 🔹 ton lien ou chemin d'image ici
      alt="coin"
      className="w-10 h-10 object-contain"  // 🔹 taille et comportement de l'image
    />
    <span className="text-3xl font-bold text-gray-900 dark:text-white"> 
      {item.market_value.toLocaleString()}
    </span>
  </motion.div>
</div>
    </motion.div>
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
        
        {/* Halo de rareté */}
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
        

        
        {/* Image */}
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
        
        {/* Indicateur de rareté en bas */}
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

        {/* Effet pulsation pour l'item gagnant */}
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

export default Wheel