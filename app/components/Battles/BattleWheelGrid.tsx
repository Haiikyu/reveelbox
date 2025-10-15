// app/components/Battles/BattleWheelGrid.tsx - Roue battle adaptée de votre système boxes
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

// Réutiliser vos types existants adaptés pour battle
interface BattleItem {
  id: string
  name: string
  image_url: string | null
  market_value: number
  rarity: string
  probability: number
}

interface BattleWheelGridProps {
  battleId: string
  participantId: string
  lootBoxId: string
  boxInstance: number // Quel round/box
  isSpinning: boolean
  winningItem: BattleItem | null
  fastMode?: boolean
  onFinish: (item: BattleItem) => void
  participant: {
    id: string
    user_id: string | null
    is_bot: boolean
    bot_name: string | null
    bot_avatar_url: string | null
    position: number
    profiles?: {
      username: string | null
      avatar_url: string | null
    } | null
  }
  isCurrentUser: boolean
  className?: string
}

// Configuration identique à votre Wheel.tsx
const BATTLE_WHEEL_CONFIG = {
  ITEM_WIDTH: 180,
  ITEM_HEIGHT: 200,
  TOTAL_ITEMS: 60,
  WINNING_POSITION: 40,
} as const

export function BattleWheelGrid({ 
  battleId,
  participantId,
  lootBoxId,
  boxInstance,
  isSpinning,
  winningItem,
  fastMode = false,
  onFinish,
  participant,
  isCurrentUser,
  className = ''
}: BattleWheelGridProps) {
  const [wheelSequence, setWheelSequence] = useState<BattleItem[]>([])
  const [isReady, setIsReady] = useState(false)
  const [showOnlyWinner, setShowOnlyWinner] = useState(false)
  const [centerItemIndex, setCenterItemIndex] = useState(-1)
  const [shouldShowOverflow, setShouldShowOverflow] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)
  const supabase = createClient()

  const rarityColors = useMemo(() => ({
    common: '#10b981',
    uncommon: '#3b82f6',
    rare: '#8b5cf6',
    epic: '#d946ef',
    legendary: '#f59e0b'
  }), [])

  // Charger les items de la loot box (comme votre système existant)
  const loadBattleItems = useCallback(async (): Promise<BattleItem[]> => {
    try {
      const { data, error } = await supabase
        .from('loot_box_items')
        .select(`
          probability,
          items!inner (
            id,
            name,
            image_url,
            market_value,
            rarity
          )
        `)
        .eq('loot_box_id', lootBoxId)
        .order('probability', { ascending: false })

      if (error || !data) {
        console.error('Erreur chargement items:', error)
        return []
      }

      return data.map((item: any) => ({
        id: item.items.id,
        name: item.items.name,
        image_url: item.items.image_url,
        market_value: item.items.market_value,
        rarity: item.items.rarity,
        probability: item.probability
      }))
    } catch (err) {
      console.error('Erreur critique:', err)
      return []
    }
  }, [lootBoxId, supabase])

  // Fonction identique à votre Wheel.tsx pour créer le pool d'affichage
  const createDisplayPool = useCallback((baseItems: BattleItem[]) => {
    const displayPool: BattleItem[] = []
    
    baseItems.forEach(item => {
      let weight = Math.max(1, Math.round(item.probability * 1.5))
      
      // Boost pour affichage (comme votre système)
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

  // Shuffle identique à votre système
  const shuffleArray = useCallback((array: any[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  // Génération de séquence identique à votre Wheel.tsx
  const generateNewSequence = useCallback((baseItems: BattleItem[], targetItem?: BattleItem) => {
    if (!baseItems.length) return []

    const displayPool = createDisplayPool(baseItems)
    const timestamp = Date.now() + Math.random() * 1000
    const sequence: BattleItem[] = []
    
    const tripleShuffled = shuffleArray(shuffleArray(shuffleArray(displayPool)))
    
    for (let i = 0; i < BATTLE_WHEEL_CONFIG.TOTAL_ITEMS; i++) {
      const randomIndex = Math.floor(Math.random() * tripleShuffled.length)
      sequence.push({
        ...tripleShuffled[randomIndex],
        id: `battle-wheel-${timestamp}-${i}-${tripleShuffled[randomIndex].id}`
      })
    }

    if (targetItem) {
      sequence[BATTLE_WHEEL_CONFIG.WINNING_POSITION] = {
        ...targetItem,
        id: `winning-${timestamp}-${BATTLE_WHEEL_CONFIG.WINNING_POSITION}-${targetItem.id}`
      }
    }

    return sequence
  }, [createDisplayPool, shuffleArray])

  // Calcul position finale identique
  const calculateFinalPosition = useCallback(() => {
    if (!containerRef.current) return 0
    const containerWidth = containerRef.current.offsetWidth
    const centerOffset = containerWidth / 2
    const winningItemPosition = BATTLE_WHEEL_CONFIG.WINNING_POSITION * BATTLE_WHEEL_CONFIG.ITEM_WIDTH
    return winningItemPosition - centerOffset + (BATTLE_WHEEL_CONFIG.ITEM_WIDTH / 2)
  }, [])

  // Animation identique à votre Wheel.tsx
  const animateWheel = useCallback((targetPosition: number, duration: number) => {
    if (!wheelRef.current || isAnimatingRef.current) return

    isAnimatingRef.current = true
    const startTime = performance.now()
    const startPosition = 0
    const distance = targetPosition

    setShouldShowOverflow(false)

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
          const containerWidth = containerRef.current?.offsetWidth || 0
          const centerOffset = containerWidth / 2
          const adjustedPosition = currentPosition + centerOffset
          const itemIndex = Math.round(adjustedPosition / BATTLE_WHEEL_CONFIG.ITEM_WIDTH)
          setCenterItemIndex(Math.max(0, Math.min(itemIndex, wheelSequence.length - 1)))
        }
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        isAnimatingRef.current = false
        setCenterItemIndex(-1)
        
        setTimeout(() => {
          setShowOnlyWinner(true)
          setTimeout(() => {
            setShouldShowOverflow(true)
            if (winningItem) {
              onFinish(winningItem)
            }
          }, 100)
        }, 1500)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [isSpinning, wheelSequence.length, winningItem, onFinish])

  // Initialisation
  useEffect(() => {
    const initWheel = async () => {
      setLoading(true)
      const items = await loadBattleItems()
      if (items.length > 0) {
        const sequence = generateNewSequence(items)
        setWheelSequence(sequence)
        setIsReady(true)
      }
      setLoading(false)
    }

    initWheel()
  }, [loadBattleItems, generateNewSequence])

  // Démarrage animation (logique identique à votre Wheel.tsx)
  useEffect(() => {
    if (!isSpinning || !winningItem || !isReady) return

    console.log(`🎰 BATTLE SPIN - Participant: ${participant.is_bot ? participant.bot_name : 'User'} - Item: ${winningItem.name}`)

    setShowOnlyWinner(false)
    setShouldShowOverflow(false)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    isAnimatingRef.current = false

    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
      wheelRef.current.style.transition = 'none'
    }

    const regenerateWithWinner = async () => {
      const baseItems = await loadBattleItems()
      const newSequence = generateNewSequence(baseItems, winningItem)
      setWheelSequence(newSequence)
      
      setTimeout(() => {
        if (wheelRef.current) {
          wheelRef.current.style.transform = 'translateX(0px)'
        }
        
        setTimeout(() => {
          const finalPosition = calculateFinalPosition()
          const duration = fastMode ? 3000 : 5000
          animateWheel(finalPosition, duration)
        }, 200)
      }, 100)
    }

    regenerateWithWinner()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      isAnimatingRef.current = false
    }
  }, [isSpinning, winningItem, isReady, participant, fastMode, loadBattleItems, generateNewSequence, calculateFinalPosition, animateWheel])

  // Reset
  useEffect(() => {
    if (!isSpinning && wheelRef.current && !showOnlyWinner) {
      wheelRef.current.style.transform = 'translateX(0px)'
      setShouldShowOverflow(false)
    }
  }, [isSpinning, showOnlyWinner])

  if (loading) {
    return (
      <div className={`w-full h-64 flex flex-col ${className}`}>
        {/* Header joueur */}
        <div className="bg-slate-800/90 p-3 border-b border-slate-700/50 flex items-center gap-3 flex-shrink-0">
          <img
            src={
              participant.is_bot 
                ? participant.bot_avatar_url || '/bot-avatar.png'
                : participant.profiles?.avatar_url || '/default-avatar.png'
            }
            alt=""
            className={`w-8 h-8 rounded-full border-2 ${
              isCurrentUser ? 'border-blue-400' : 'border-slate-600'
            }`}
          />
          <div className="text-sm font-bold text-white truncate">
            {participant.is_bot ? participant.bot_name : participant.profiles?.username || 'Joueur'}
          </div>
          {isCurrentUser && <div className="text-xs text-blue-400">Vous</div>}
        </div>

        {/* Zone de chargement */}
        <div className="flex-1 flex items-center justify-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-300 text-sm">Chargement...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!isReady || wheelSequence.length === 0) {
    return (
      <div className={`w-full h-64 flex flex-col ${className}`}>
        {/* Header joueur */}
        <div className="bg-slate-800/90 p-3 border-b border-slate-700/50 flex items-center gap-3 flex-shrink-0">
          <img
            src={
              participant.is_bot 
                ? participant.bot_avatar_url || '/bot-avatar.png'
                : participant.profiles?.avatar_url || '/default-avatar.png'
            }
            alt=""
            className={`w-8 h-8 rounded-full border-2 ${
              isCurrentUser ? 'border-blue-400' : 'border-slate-600'
            }`}
          />
          <div className="text-sm font-bold text-white truncate">
            {participant.is_bot ? participant.bot_name : participant.profiles?.username || 'Joueur'}
          </div>
          {isCurrentUser && <div className="text-xs text-blue-400">Vous</div>}
        </div>

        {/* Zone d'attente */}
        <div className="flex-1 flex items-center justify-center bg-slate-800/50 text-gray-400">
          En attente...
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 border-2 ${
      isCurrentUser ? 'border-blue-500/50' : 'border-slate-700/50'
    } overflow-hidden ${className}`}>
      
      {/* Header du joueur */}
      <div className="bg-slate-800/90 p-3 border-b border-slate-700/50 flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <img
            src={
              participant.is_bot 
                ? participant.bot_avatar_url || '/bot-avatar.png'
                : participant.profiles?.avatar_url || '/default-avatar.png'
            }
            alt=""
            className={`w-8 h-8 rounded-full border-2 ${
              isCurrentUser ? 'border-blue-400' : 'border-slate-600'
            }`}
          />
          {participant.is_bot && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
          )}
          {isCurrentUser && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-bold text-white truncate">
            {participant.is_bot ? participant.bot_name : participant.profiles?.username || 'Joueur'}
          </div>
          {isCurrentUser && <div className="text-xs text-blue-400">Vous</div>}
        </div>
      </div>

      {/* Zone de la roue */}
      <div 
        ref={containerRef}
        className={`flex-1 relative ${shouldShowOverflow ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{ height: 200 }}
      >
        {/* Gradients de fade - seulement quand overflow hidden */}
        {!shouldShowOverflow && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-800 to-transparent z-20"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-800 to-transparent z-20"></div>
          </>
        )}
        
        {/* Container principal */}
        <div className="relative h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {showOnlyWinner && winningItem ? (
              <motion.div
                key="battle-winner"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-40"
                    style={{
                      backgroundColor: rarityColors[winningItem.rarity.toLowerCase() as keyof typeof rarityColors] || rarityColors.common,
                      transform: 'scale(1.5)'
                    }}
                  />
                  
                  <motion.img
                    src={winningItem.image_url || '/placeholder-item.png'}
                    alt={winningItem.name}
                    className="relative w-16 h-16 object-contain mx-auto mb-2" 
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-item.png'
                    }}
                  />
                </div>
                
                <div className="text-white font-bold text-sm mb-1">
                  {winningItem.name}
                </div>
                <div className="text-green-400 font-bold">
                  +{winningItem.market_value.toFixed(2)}€
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="battle-wheel"
                ref={wheelRef}
                className="flex items-center h-full"
                style={{
                  transform: 'translateX(0px)',
                  willChange: 'transform'
                }}
              >
                {wheelSequence.map((item, index) => (
                  <BattleWheelItem
                    key={item.id}
                    item={item}
                    index={index}
                    isWinning={index === BATTLE_WHEEL_CONFIG.WINNING_POSITION && winningItem?.id === item.id.split('-')[3]}
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
    </div>
  )
}

// Composant Item identique à votre système
const BattleWheelItem = ({ item, index, isWinning, rarityColors, isSpinning, isCenterItem }: {
  item: BattleItem
  index: number
  isWinning: boolean
  rarityColors: Record<string, string>
  isSpinning: boolean
  isCenterItem: boolean
}) => {
  const glowColor = rarityColors[item.rarity.toLowerCase()] || rarityColors.common
  const shouldShowHover = item.rarity === 'legendary' || item.rarity === 'epic' || item.rarity === 'rare' || isCenterItem
  
  return (
    <motion.div 
      className="flex-shrink-0 flex items-center justify-center p-3 group overflow-visible"
      style={{ 
        width: BATTLE_WHEEL_CONFIG.ITEM_WIDTH, 
        height: BATTLE_WHEEL_CONFIG.ITEM_HEIGHT,
        position: 'relative'
      }}
    >
      <div className="relative w-full h-full overflow-visible">
        
        {/* Halo de rareté */}
        <motion.div 
          className="absolute inset-2 rounded-lg blur-lg"
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
          src={item.image_url || '/placeholder-item.png'}
          alt={item.name}
          className="relative w-full h-full object-contain p-4"
          style={{
            filter: isWinning && !isSpinning 
              ? `drop-shadow(0 10px 20px ${glowColor}80) brightness(1.3)` 
              : shouldShowHover || isCenterItem
              ? `drop-shadow(0 8px 16px ${glowColor}60) brightness(1.2)`
              : `drop-shadow(0 4px 12px ${glowColor}40) brightness(1.1)`
          }}
          animate={{
            scale: isWinning && !isSpinning 
              ? 1.15 
              : (isCenterItem && isSpinning) 
              ? 1.1
              : 1
          }}
          transition={{ duration: 0.3 }}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-item.png'
          }}
        />
        
        {/* Indicateur de rareté */}
        <motion.div 
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: glowColor }}
          animate={{
            boxShadow: shouldShowHover || isWinning || isCenterItem
              ? `0 0 15px ${glowColor}` 
              : `0 0 8px ${glowColor}70`,
            scale: (shouldShowHover || isWinning || isCenterItem) ? 1.4 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}

export default BattleWheelGrid