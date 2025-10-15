// app/components/Battles/BattleWheel.tsx - Roue spécialisée pour les battles
'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'

// Types spécifiques aux battles
interface BattleItem {
  id: string
  name: string
  image_url: string | null
  market_value: number
  rarity: string
  probability: number
}

interface BattleWheelProps {
  battleId: string
  participantId: string
  lootBoxId: string
  isSpinning: boolean
  onSpinComplete: (item: BattleItem) => void
  fastMode?: boolean
  disabled?: boolean
}

interface WheelItemProps {
  item: BattleItem
  index: number
  isWinning: boolean
  rarityColors: Record<string, string>
  isSpinning: boolean
  isCenterItem: boolean
}

// Configuration pour les battles
const BATTLE_WHEEL_CONFIG = {
  ITEM_WIDTH: 160,
  ITEM_HEIGHT: 180,
  TOTAL_ITEMS: 50,
  WINNING_POSITION: 35,
} as const

export function BattleWheel({ 
  battleId,
  participantId,
  lootBoxId,
  isSpinning,
  onSpinComplete,
  fastMode = false,
  disabled = false
}: BattleWheelProps) {
  const [wheelSequence, setWheelSequence] = useState<BattleItem[]>([])
  const [isReady, setIsReady] = useState(false)
  const [winningItem, setWinningItem] = useState<BattleItem | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [centerItemIndex, setCenterItemIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
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

  // Charger les items de la loot box depuis la DB
  const loadBattleItems = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data, error: fetchError } = await supabase
        .from('loot_box_items')
        .select(`
          probability,
          min_quantity,
          max_quantity,
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

      if (fetchError) {
        console.error('Erreur chargement items:', fetchError)
        setError('Impossible de charger les items')
        return
      }

      if (!data || data.length === 0) {
        setError('Aucun item trouvé pour cette box')
        return
      }

      // Transformer en format BattleItem
      const battleItems: BattleItem[] = data.map((item: any) => ({
        id: item.items.id,
        name: item.items.name,
        image_url: item.items.image_url,
        market_value: item.items.market_value,
        rarity: item.items.rarity,
        probability: item.probability
      }))

      console.log('Items chargés:', battleItems.length)
      return battleItems

    } catch (err) {
      console.error('Erreur critique:', err)
      setError('Erreur lors du chargement')
      return []
    } finally {
      setLoading(false)
    }
  }, [lootBoxId, supabase])

  // Générer la séquence de roue avec boost d'affichage
  const generateBattleSequence = useCallback((baseItems: BattleItem[], targetItem?: BattleItem) => {
    if (!baseItems.length) return []

    // Pool d'affichage avec boost visuel des items rares
    const displayPool: BattleItem[] = []
    
    baseItems.forEach(item => {
      let weight = Math.max(1, Math.round(item.probability * 2))
      
      // Boost pour l'affichage (pas le calcul réel)
      if (item.rarity === 'legendary') weight *= 6
      else if (item.rarity === 'epic') weight *= 3
      else if (item.rarity === 'rare') weight *= 2
      
      for (let i = 0; i < weight; i++) {
        displayPool.push(item)
      }
    })

    // Mélanger et générer la séquence
    const shuffled = [...displayPool].sort(() => Math.random() - 0.5)
    const sequence: BattleItem[] = []
    const timestamp = Date.now()
    
    for (let i = 0; i < BATTLE_WHEEL_CONFIG.TOTAL_ITEMS; i++) {
      const randomIndex = Math.floor(Math.random() * shuffled.length)
      sequence.push({
        ...shuffled[randomIndex],
        id: `battle-${timestamp}-${i}-${shuffled[randomIndex].id}`
      })
    }

    // Placer l'item gagnant à la position exacte
    if (targetItem) {
      sequence[BATTLE_WHEEL_CONFIG.WINNING_POSITION] = {
        ...targetItem,
        id: `winning-${timestamp}-${targetItem.id}`
      }
    }

    return sequence
  }, [])

  // Simuler l'ouverture via RPC
  const simulateOpening = useCallback(async (): Promise<BattleItem | null> => {
    try {
      const { data, error } = await supabase.rpc('simulate_battle_box_opening', {
        p_loot_box_id: lootBoxId,
        p_battle_id: battleId,
        p_participant_id: participantId
      })

      if (error) {
        console.error('Erreur simulation:', error)
        return null
      }

      if (data?.success && data?.item) {
        return {
          id: data.item.id,
          name: data.item.name,
          image_url: data.item.image_url,
          market_value: data.item.value,
          rarity: data.item.rarity,
          probability: 0 // Non pertinent pour le résultat
        }
      }

      return null
    } catch (err) {
      console.error('Erreur critique simulation:', err)
      return null
    }
  }, [lootBoxId, battleId, participantId, supabase])

  // Animation de la roue
  const animateWheel = useCallback((targetPosition: number, duration: number) => {
    if (!wheelRef.current || isAnimatingRef.current) return

    isAnimatingRef.current = true
    const startTime = performance.now()
    const startPosition = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Courbe d'easing pour décélération naturelle
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
      
      const currentPosition = startPosition + (targetPosition * easeProgress)
      
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateX(-${currentPosition}px)`
        
        // Calculer l'item au centre
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
        
        // Montrer le résultat après un délai
        setTimeout(() => {
          setShowResult(true)
          if (winningItem) {
            onSpinComplete(winningItem)
          }
        }, 1000)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [isSpinning, wheelSequence.length, winningItem, onSpinComplete])

  // Calculer la position finale
  const calculateFinalPosition = useCallback(() => {
    if (!containerRef.current) return 0
    const containerWidth = containerRef.current.offsetWidth
    const centerOffset = containerWidth / 2
    const winningItemPosition = BATTLE_WHEEL_CONFIG.WINNING_POSITION * BATTLE_WHEEL_CONFIG.ITEM_WIDTH
    return winningItemPosition - centerOffset + (BATTLE_WHEEL_CONFIG.ITEM_WIDTH / 2)
  }, [])

  // Initialisation
  useEffect(() => {
    const initializeWheel = async () => {
      const items = await loadBattleItems()
      if (items && items.length > 0) {
        const sequence = generateBattleSequence(items)
        setWheelSequence(sequence)
        setIsReady(true)
      }
    }

    initializeWheel()
  }, [loadBattleItems, generateBattleSequence])

  // Démarrer l'animation quand isSpinning devient true
  useEffect(() => {
    if (!isSpinning || !isReady || !wheelSequence.length) return

    const startSpin = async () => {
      setShowResult(false)
      
      // Simuler l'ouverture pour obtenir l'item gagnant
      const winner = await simulateOpening()
      if (!winner) {
        console.error('Impossible de simuler l\'ouverture')
        return
      }

      setWinningItem(winner)
      
      // Regénérer la séquence avec l'item gagnant
      const baseItems = await loadBattleItems()
      if (baseItems) {
        const newSequence = generateBattleSequence(baseItems, winner)
        setWheelSequence(newSequence)
        
        // Démarrer l'animation après un délai
        setTimeout(() => {
          const finalPosition = calculateFinalPosition()
          const duration = fastMode ? 2500 : 4000
          animateWheel(finalPosition, duration)
        }, 200)
      }
    }

    startSpin()
  }, [isSpinning, isReady, simulateOpening, loadBattleItems, generateBattleSequence, calculateFinalPosition, animateWheel, fastMode])

  // Reset
  useEffect(() => {
    if (!isSpinning && wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
      setShowResult(false)
    }
  }, [isSpinning])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Chargement de la roue...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-red-500/10 border border-red-500/30 rounded-lg">
        <div className="text-center text-red-400">
          <div className="font-bold mb-1">Erreur</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!isReady || wheelSequence.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-slate-800/50 rounded-lg">
        <div className="text-center text-gray-400">
          <div className="font-bold mb-1">Roue non prête</div>
          <div className="text-sm">Préparation en cours...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: BATTLE_WHEEL_CONFIG.ITEM_HEIGHT + 40 }}
    >
      {/* Gradients de fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-20"></div>
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-20"></div>
      
      {/* Indicateur central */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-16 bg-yellow-400 rounded-full z-30 shadow-lg"></div>
      
      {/* Container de la roue */}
      <div className="relative h-full">
        <AnimatePresence mode="wait">
          {showResult && winningItem ? (
            <motion.div
              key="battle-result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center h-full"
            >
              <BattleWinnerDisplay 
                item={winningItem} 
                rarityColors={rarityColors}
              />
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
                  isWinning={index === BATTLE_WHEEL_CONFIG.WINNING_POSITION && winningItem?.id === item.id.split('-')[1]}
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

// Affichage du gagnant
const BattleWinnerDisplay = ({ item, rarityColors }: {
  item: BattleItem
  rarityColors: Record<string, string>
}) => {
  const glowColor = rarityColors[item.rarity.toLowerCase()] || rarityColors.common
  
  return (
    <motion.div 
      className="flex flex-col items-center gap-4 p-8" 
      animate={{ 
        y: [0, -8, 0], 
        scale: [1, 1.02, 1]
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-40" 
          style={{ 
            backgroundColor: glowColor,
            transform: 'scale(1.5)'
          }}
        />
        
        <motion.img
          src={item.image_url || '/placeholder-item.png'}
          alt={item.name}
          className="relative w-32 h-32 object-contain" 
          style={{
            filter: `drop-shadow(0 15px 40px ${glowColor}60) brightness(1.2)` 
          }}
          animate={{
            rotateY: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-item.png'
          }}
        />
      </div>
      
      <div className="text-center">
        <motion.h3 
          className="text-xl font-bold text-white mb-2" 
          style={{ color: glowColor }}
        >
          {item.name}
        </motion.h3>
        
        <motion.div 
          className="flex items-center gap-2 justify-center" 
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl font-bold text-white"> 
            {item.market_value.toFixed(2)}€
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Item de la roue
const BattleWheelItem = ({ item, index, isWinning, rarityColors, isSpinning, isCenterItem }: WheelItemProps) => {
  const glowColor = rarityColors[item.rarity.toLowerCase()] || rarityColors.common
  const shouldHighlight = item.rarity === 'legendary' || item.rarity === 'epic' || isCenterItem
  
  return (
    <motion.div 
      className="flex-shrink-0 flex items-center justify-center p-4"
      style={{ 
        width: BATTLE_WHEEL_CONFIG.ITEM_WIDTH, 
        height: BATTLE_WHEEL_CONFIG.ITEM_HEIGHT
      }}
    >
      <div className="relative w-full h-full">
        
        {/* Halo de rareté */}
        <motion.div 
          className="absolute inset-2 rounded-lg blur-lg"
          style={{ 
            backgroundColor: glowColor,
            zIndex: -1
          }}
          animate={{
            opacity: shouldHighlight || isWinning ? 0.3 : 0.1,
            scale: shouldHighlight || isWinning ? 1.1 : 1.0
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
              : shouldHighlight
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
            boxShadow: shouldHighlight || isWinning 
              ? `0 0 15px ${glowColor}` 
              : `0 0 8px ${glowColor}70`,
            scale: (shouldHighlight || isWinning) ? 1.4 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}

export default BattleWheel