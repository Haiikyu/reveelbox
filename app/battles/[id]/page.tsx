'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Bot, Eye, Play, Trophy, Zap, ChevronDown, Sparkles, Crown
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

// ========================================================================================
// TYPES
// ========================================================================================

interface BattleItem {
  id: string
  name: string
  image_url: string | null
  market_value: number
  rarity: string
  probability: number
}

interface BattleParticipant {
  id: string
  user_id: string | null
  is_bot: boolean
  bot_name: string | null
  bot_avatar_url: string | null
  position: number
  team: number
  total_value: number
  is_ready: boolean
  is_winner: boolean
  final_rank: number | null
  items_won: BattleItem[]
  joined_at: string
  username?: string | null
  avatar_url?: string | null
  level?: number
}

interface BattleBox {
  id: string
  loot_box_id: string
  quantity: number
  order_position: number
  cost_per_box: number
  loot_boxes: {
    id: string
    name: string
    image_url: string | null
    price_virtual: number
  } | null
}

interface Battle {
  id: string
  name: string
  description: string | null
  mode: 'classic' | 'crazy' | 'shared' | 'fast' | 'jackpot' | 'terminal' | 'clutch'
  max_players: number
  entry_cost: number
  total_prize: number
  status: 'waiting' | 'countdown' | 'active' | 'finished' | 'cancelled' | 'expired'
  is_private: boolean
  total_boxes: number
  current_box: number
  started_at: string | null
  finished_at: string | null
  countdown_starts_at: string | null
  creator_id: string
  participants: BattleParticipant[]
  battle_boxes: BattleBox[]
}

// ========================================================================================
// CONSTANTS
// ========================================================================================

const RARITY_COLORS = {
  common: { gradient: 'from-gray-600 to-gray-800', glow: 'rgba(156, 163, 175, 0.5)' },
  rare: { gradient: 'from-blue-600 to-blue-800', glow: 'rgba(37, 99, 235, 0.8)' },
  epic: { gradient: 'from-purple-600 to-purple-800', glow: 'rgba(147, 51, 234, 0.8)' },
  legendary: { gradient: 'from-yellow-600 to-yellow-800', glow: 'rgba(234, 179, 8, 0.9)' }
}

const MODE_LABELS = {
  classic: 'Classic',
  crazy: 'Crazy',
  shared: 'Shared',
  fast: 'Fast',
  jackpot: 'Jackpot',
  terminal: 'Terminal',
  clutch: 'Clutch'
}

// ========================================================================================
// ANIMATED BACKGROUND COMPONENT
// ========================================================================================

function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Positions fixes pour éviter l'erreur de hydration
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: (i * 5.2) % 100, // Distribution équilibrée
      top: (i * 7.3) % 100,
      duration: 3 + (i % 4),
      delay: (i % 5) * 0.4
    }))
  }, [])

  if (!mounted) {
    return <div className="fixed inset-0 -z-10 bg-slate-950" />
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient animé principal */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Brouillard flottant */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`fog-${i}`}
          className="absolute rounded-full blur-3xl"
          style={{
            width: '600px',
            height: '600px',
            background: i === 0 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
              : i === 1
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            x: [
              `${-200 + i * 100}px`,
              `${200 + i * 150}px`,
              `${-200 + i * 100}px`,
            ],
            y: [
              `${-100 + i * 80}px`,
              `${150 - i * 50}px`,
              `${-100 + i * 80}px`,
            ],
          }}
          transition={{
            duration: 25 + i * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Particules flottantes */}
      {particles.map((particle) => (
        <motion.div
          key={`particle-${particle.id}`}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// ========================================================================================
// INTEGRATED COUNTDOWN COMPONENT
// ========================================================================================

function IntegratedCountdown({ countdown }: { countdown: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 0.8,
          ease: "easeOut"
        }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-blue-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
        />
        
        {/* Number */}
        <div className="relative text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(59,130,246,1)]">
          {countdown}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ========================================================================================
// IMPROVED ROULETTE WHEEL COMPONENT
// ========================================================================================

function ImprovedRouletteWheel({ 
  items, 
  winningItem,
  isSpinning,
  participantId,
  onSpinComplete
}: { 
  items: BattleItem[]
  winningItem: BattleItem | null
  isSpinning: boolean
  participantId: string
  onSpinComplete?: () => void
}) {
  const [spinPosition, setSpinPosition] = useState(0)
  const [showWinEffect, setShowWinEffect] = useState(false)
  
  // Créer un tableau d'items répété pour l'effet de scroll infini
  const repeatedItems = useMemo(() => {
    const repeated = []
    for (let i = 0; i < 15; i++) {
      repeated.push(...items)
    }
    return repeated
  }, [items])

  useEffect(() => {
    if (!isSpinning || !winningItem) return

    setShowWinEffect(false)
    
    // Trouver l'index de l'item gagnant dans le tableau répété (milieu)
    const middleIndex = Math.floor(repeatedItems.length / 2)
    const winningIndex = repeatedItems.findIndex((item, idx) => 
      idx > middleIndex && item.id === winningItem.id
    )

    if (winningIndex === -1) return

    // Calculer la position finale (centrer l'item gagnant)
    const itemWidth = 140
    const containerWidth = 600
    const finalPosition = -(winningIndex * itemWidth - containerWidth / 2 + itemWidth / 2)

    // Reset position
    setSpinPosition(0)
    
    const spinDuration = 5000 // 5 secondes
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / spinDuration, 1)
      
      // Easing function pour ralentir progressivement
      const easeOut = 1 - Math.pow(1 - progress, 4)
      
      const currentPosition = finalPosition * easeOut
      setSpinPosition(currentPosition)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Animation terminée - afficher l'effet wow
        setShowWinEffect(true)
        if (onSpinComplete) {
          setTimeout(onSpinComplete, 100)
        }
      }
    }
    
    requestAnimationFrame(animate)
  }, [isSpinning, winningItem, repeatedItems, onSpinComplete])

  if (!isSpinning) return null

  return (
    <div className="w-full mb-6 relative">
      <div className="relative w-full h-60 overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-800/90 rounded-2xl border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
        
        {/* Flèche indicatrice supérieure */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <ChevronDown 
              className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,1)]" 
              strokeWidth={4} 
            />
          </motion.div>
        </div>

        {/* Items défilants */}
        <div
          className="flex items-center h-full py-8"
          style={{
            transform: `translateX(${spinPosition}px)`,
            transition: 'none'
          }}
        >
          {repeatedItems.map((item, index) => {
            const isWinningItem = winningItem && item.id === winningItem.id && index === Math.floor(repeatedItems.length / 2) + repeatedItems.slice(Math.floor(repeatedItems.length / 2)).findIndex(i => i.id === winningItem.id)
            const rarity = item.rarity as keyof typeof RARITY_COLORS
            
            return (
              <motion.div
                key={`${item.id}-${index}`}
                className="flex-shrink-0 w-[140px] px-2"
                animate={showWinEffect && isWinningItem ? {
                  scale: [1, 1.15, 1.1],
                } : {}}
                transition={{
                  duration: 0.5,
                  ease: "easeOut"
                }}
              >
                <div className={`
                  bg-gradient-to-br ${RARITY_COLORS[rarity]?.gradient || RARITY_COLORS.common.gradient}
                  rounded-xl p-4 border-2 
                  ${showWinEffect && isWinningItem 
                    ? 'border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.8)]' 
                    : 'border-blue-500/30'
                  }
                  transition-all duration-300
                `}>
                  <div className="aspect-square mb-2 flex items-center justify-center bg-black/20 rounded-lg p-2">
                    <img
                      src={item.image_url || '/placeholder-item.png'}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-white text-xs font-medium text-center truncate px-1">
                    {item.name}
                  </div>
                  <div className="text-green-400 font-bold text-center text-sm mt-1">
                    ${item.market_value.toFixed(2)}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Overlay gradient pour effet de profondeur */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-900 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-800 to-transparent" />
        </div>

        {/* Ligne centrale */}
        <div className="absolute inset-y-0 left-1/2 w-1 bg-yellow-400/70 -translate-x-1/2 z-10 shadow-[0_0_15px_rgba(250,204,21,0.8)]" />

        {/* Effet de particules lors du win */}
        <AnimatePresence>
          {showWinEffect && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`particle-win-${i}`}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i / 12) * Math.PI * 2) * 100,
                    y: Math.sin((i / 12) * Math.PI * 2) * 100,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    ease: "easeOut"
                  }}
                />
              ))}
              
              {/* Flash lumineux */}
              <motion.div
                className="absolute inset-0 bg-gradient-radial from-yellow-400/40 via-transparent to-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 1 }}
              />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ========================================================================================
// WON ITEM DISPLAY COMPONENT
// ========================================================================================

function WonItemDisplay({ item }: { item: BattleItem | null }) {
  if (!item) return null

  const rarity = item.rarity as keyof typeof RARITY_COLORS

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      className="mt-4"
    >
      <div className={`
        relative bg-gradient-to-br ${RARITY_COLORS[rarity]?.gradient || RARITY_COLORS.common.gradient}
        rounded-xl p-4 border-2 border-yellow-400/50
        shadow-[0_0_30px_${RARITY_COLORS[rarity]?.glow || RARITY_COLORS.common.glow}]
      `}>
        {/* Badge "WON" */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 10
          }}
          className="absolute -top-3 -right-3 bg-yellow-400 text-slate-900 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          WON
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-black/30 rounded-lg flex items-center justify-center p-2">
            <img
              src={item.image_url || '/placeholder-item.png'}
              alt={item.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-sm mb-1">
              {item.name}
            </div>
            <div className="text-green-400 font-black text-xl">
              ${item.market_value.toFixed(2)}
            </div>
            <div className="text-xs text-white/60 capitalize">
              {item.rarity}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ========================================================================================
// PLAYER CARD COMPONENT
// ========================================================================================

function PlayerCard({ 
  participant, 
  position, 
  isCurrentUser,
  currentRound,
  rouletteItems,
  winningItem,
  isSpinning,
  onSpinComplete
}: { 
  participant: BattleParticipant
  position: 'left' | 'right' | 'center'
  isCurrentUser: boolean
  currentRound: number
  rouletteItems: BattleItem[]
  winningItem: BattleItem | null
  isSpinning: boolean
  onSpinComplete?: () => void
}) {
  const displayName = participant.is_bot 
    ? participant.bot_name 
    : participant.username || 'Player'
  
  const avatarUrl = participant.is_bot 
    ? participant.bot_avatar_url 
    : participant.avatar_url

  const totalValue = participant.items_won.reduce((sum, item) => sum + item.market_value, 0)
  
  const cardColor = participant.team === 0 
    ? 'from-blue-600/20 to-blue-800/20 border-blue-500/50' 
    : 'from-red-600/20 to-red-800/20 border-red-500/50'

  const teamLabel = participant.team === 0 ? 'BLUE' : 'RED'
  const teamColor = participant.team === 0 ? 'text-blue-400' : 'text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 20
      }}
      className={`
        relative bg-gradient-to-br ${cardColor}
        backdrop-blur-sm rounded-2xl border-2 p-6
        shadow-[0_0_50px_rgba(59,130,246,0.2)]
      `}
    >
      {/* Header avec Avatar et Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className={`
            w-20 h-20 rounded-full overflow-hidden border-4 
            ${participant.team === 0 ? 'border-blue-500' : 'border-red-500'}
            shadow-lg
          `}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName || ''} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                {participant.is_bot ? (
                  <Bot className="w-10 h-10 text-purple-400" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    {displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Badge position */}
          <div className={`
            absolute -bottom-2 left-1/2 -translate-x-1/2
            w-8 h-8 rounded-full flex items-center justify-center
            font-black text-sm
            ${participant.team === 0 
              ? 'bg-blue-500 text-white' 
              : 'bg-red-500 text-white'
            }
            border-2 border-white shadow-lg
          `}>
            #{participant.position + 1}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-lg font-bold text-white truncate">
              {displayName}
            </div>
            {participant.is_bot && (
              <div className="px-2 py-0.5 bg-purple-500/30 border border-purple-500/50 rounded text-purple-400 text-xs font-bold">
                BOT
              </div>
            )}
            {isCurrentUser && (
              <div className="px-2 py-0.5 bg-green-500/30 border border-green-500/50 rounded text-green-400 text-xs font-bold">
                YOU
              </div>
            )}
          </div>
          
          <div className={`text-sm font-bold ${teamColor}`}>
            TEAM {teamLabel}
          </div>
          
          {participant.level && (
            <div className="text-xs text-white/60">
              Level {participant.level}
            </div>
          )}
        </div>

        {/* Total Value */}
        <div className="text-right">
          <div className="text-xs text-white/60 mb-1">TOTAL VALUE</div>
          <div className="text-2xl font-black text-green-400">
            ${totalValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Roulette Zone */}
      {rouletteItems.length > 0 && (
        <ImprovedRouletteWheel
          items={rouletteItems}
          winningItem={winningItem}
          isSpinning={isSpinning}
          participantId={participant.id}
          onSpinComplete={onSpinComplete}
        />
      )}

      {/* Won Item Display */}
      {winningItem && !isSpinning && (
        <WonItemDisplay item={winningItem} />
      )}

      {/* Items Won List */}
      {participant.items_won.length > 0 && !isSpinning && (
        <div className="mt-6">
          <div className="text-xs text-white/60 mb-3 font-medium">
            ITEMS WON ({participant.items_won.length})
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
            {participant.items_won.map((item, idx) => {
              const rarity = item.rarity as keyof typeof RARITY_COLORS
              return (
                <div 
                  key={`${item.id}-${idx}`}
                  className={`
                    bg-gradient-to-br ${RARITY_COLORS[rarity]?.gradient || RARITY_COLORS.common.gradient}
                    rounded-lg p-2 border border-white/10
                  `}
                >
                  <div className="aspect-square mb-1 flex items-center justify-center bg-black/20 rounded">
                    <img
                      src={item.image_url || '/placeholder-item.png'}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="text-[10px] text-white/80 text-center truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-green-400 font-bold text-center">
                    ${item.market_value.toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ========================================================================================
// MAIN BATTLE PAGE COMPONENT
// ========================================================================================

export default function BattlePage() {
  const params = useParams()
  const router = useRouter()
  const battleId = params?.id as string

  // State
  const [battle, setBattle] = useState<Battle | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState(1)
  const [isSpinning, setIsSpinning] = useState(false)
  const [showRoulette, setShowRoulette] = useState(false)
  const [rouletteItems, setRouletteItems] = useState<BattleItem[]>([])
  const [winningItems, setWinningItems] = useState<Map<string, BattleItem>>(new Map())
  const [globalCountdown, setGlobalCountdown] = useState(0)
  const [fastMode, setFastMode] = useState(false)
  const [addingBot, setAddingBot] = useState(false)
  const [integratedCountdown, setIntegratedCountdown] = useState<number | null>(null)

  const myParticipant = useMemo(() => {
    if (!battle || !user) return null
    return battle.participants.find(p => p.user_id === user.id) || null
  }, [battle, user])

  const isSpectator = !myParticipant && battle?.status !== 'waiting'

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: userData } } = await supabase.auth.getUser()
      setUser(userData)
    }
    fetchUser()
  }, [])

  // Fetch battle
  const fetchBattle = useCallback(async () => {
    if (!battleId) {
      console.log('No battleId provided')
      return
    }

    try {
      console.log('Fetching battle:', battleId)
      
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          participants:battle_participants(
            *,
            profiles:user_id(username, avatar_url, level)
          ),
          battle_boxes(
            *,
            loot_boxes(id, name, image_url, price_virtual)
          )
        `)
        .eq('id', battleId)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (data) {
        console.log('Battle data fetched:', data)
        const processedData = {
          ...data,
          participants: data.participants.map((p: any) => ({
            ...p,
            username: p.profiles?.username,
            avatar_url: p.profiles?.avatar_url,
            level: p.profiles?.level,
            items_won: p.items_won || []
          })).sort((a: any, b: any) => a.position - b.position)
        }
        setBattle(processedData)
        setCurrentRound(data.current_box || 1)
      } else {
        console.log('No battle data returned')
      }
    } catch (error) {
      console.error('Error fetching battle:', error)
    } finally {
      setLoading(false)
    }
  }, [battleId])

  useEffect(() => {
    fetchBattle()
  }, [fetchBattle])

  // Realtime subscription
  useEffect(() => {
    if (!battleId) return

    const channel = supabase
      .channel(`battle:${battleId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'battles',
          filter: `id=eq.${battleId}`
        }, 
        () => fetchBattle()
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battleId}`
        },
        () => fetchBattle()
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_openings',
          filter: `battle_id=eq.${battleId}`
        },
        () => fetchBattle()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [battleId, fetchBattle])

  // Handle countdown
  useEffect(() => {
    if (!battle) return

    if (battle.status === 'countdown' && battle.countdown_starts_at) {
      const countdownEnd = new Date(battle.countdown_starts_at).getTime() + 3000
      
      const interval = setInterval(() => {
        const now = Date.now()
        const remaining = Math.ceil((countdownEnd - now) / 1000)
        
        if (remaining > 0) {
          setIntegratedCountdown(remaining)
        } else {
          setIntegratedCountdown(null)
          clearInterval(interval)
        }
      }, 100)

      return () => clearInterval(interval)
    } else {
      setIntegratedCountdown(null)
    }
  }, [battle])

  // Simulate box opening (when battle becomes active)
  useEffect(() => {
    if (!battle || battle.status !== 'active' || isSpinning) return

    const simulateOpening = async () => {
      try {
        // Get all items for the current box
        const currentBox = battle.battle_boxes.find(b => b.order_position === currentRound)
        if (!currentBox?.loot_boxes?.id) return

        const { data: boxItems, error } = await supabase
          .from('loot_box_items')
          .select(`
            items(id, name, image_url, market_value, rarity),
            probability
          `)
          .eq('loot_box_id', currentBox.loot_boxes.id)

        if (error || !boxItems) return

        const items: BattleItem[] = boxItems.map((bi: any) => ({
          ...bi.items,
          probability: bi.probability
        }))

        setRouletteItems(items)
        setShowRoulette(true)
        setIsSpinning(true)

        // Simulate opening for each participant
        const newWinningItems = new Map<string, BattleItem>()
        
        for (const participant of battle.participants) {
          const { data: opening } = await supabase.rpc('simulate_battle_box_opening', {
            p_battle_id: battle.id,
            p_loot_box_id: currentBox.loot_boxes.id,
            p_participant_id: participant.id
          })

          if (opening?.won_item) {
            newWinningItems.set(participant.id, opening.won_item)
          }
        }

        setWinningItems(newWinningItems)

        // Stop spinning after animation
        setTimeout(() => {
          setIsSpinning(false)
          fetchBattle()
        }, fastMode ? 3000 : 6000)

      } catch (error) {
        console.error('Error simulating opening:', error)
      }
    }

    simulateOpening()
  }, [battle?.status, currentRound, fastMode])

  // Add bot
  const handleAddBot = async () => {
    if (!battle || !user) return
    
    setAddingBot(true)
    try {
      const { error } = await supabase.rpc('add_bot_to_battle', {
        p_battle_id: battle.id
      })
      
      if (error) throw error
      await fetchBattle()
    } catch (error) {
      console.error('Error adding bot:', error)
    } finally {
      setAddingBot(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 text-center">
          <div className="text-white text-2xl font-bold mb-4">Battle not found</div>
          <button
            onClick={() => router.push('/battle')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Battles
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <AnimatedBackground />

      {/* Header */}
      <div className="relative z-10 backdrop-blur-xl bg-slate-900/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/battle')}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-3 mb-2">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </motion.div>
                <h1 className="text-3xl font-black text-white">
                  {battle.name}
                </h1>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 font-bold">
                  {MODE_LABELS[battle.mode].toUpperCase()}
                </div>
                <span className="text-white/60">•</span>
                <div className="text-white/80">
                  BOX <span className="font-bold text-white">{currentRound}</span> OF <span className="font-bold text-white">{battle.total_boxes}</span>
                </div>
                <span className="text-white/60">•</span>
                <div className="text-yellow-400 font-black text-lg">
                  ${battle.total_prize.toFixed(2)} PRIZE POOL
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isSpectator && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 text-sm">
                  <Eye className="w-4 h-4" />
                  Spectator
                </div>
              )}

              <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={fastMode}
                  onChange={(e) => setFastMode(e.target.checked)}
                  className="rounded"
                />
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Fast</span>
              </label>
            </div>
          </div>

          {/* Bot Manager */}
          {user && !isSpectator && myParticipant && battle.creator_id === user.id && battle.status === 'waiting' && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="text-sm text-white/60">
                {battle.max_players - battle.participants.length} slots available
              </span>
              <button
                onClick={handleAddBot}
                disabled={addingBot}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Bot className="w-4 h-4" />
                {addingBot ? 'Adding...' : 'Add Bot'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Integrated Countdown */}
        <AnimatePresence>
          {integratedCountdown !== null && integratedCountdown > 0 && (
            <div className="relative mb-8">
              <IntegratedCountdown countdown={integratedCountdown} />
            </div>
          )}
        </AnimatePresence>

        {battle.participants.length >= 2 && battle.participants.length === 2 ? (
          /* 1v1 Layout */
          <div className="grid grid-cols-2 gap-8">
            <PlayerCard 
              participant={battle.participants[0]} 
              position="left"
              isCurrentUser={user ? battle.participants[0].user_id === user.id : false}
              currentRound={currentRound}
              rouletteItems={showRoulette ? rouletteItems : []}
              winningItem={winningItems.get(battle.participants[0].id) || null}
              isSpinning={isSpinning}
            />
            
            <PlayerCard 
              participant={battle.participants[1]} 
              position="right"
              isCurrentUser={user ? battle.participants[1].user_id === user.id : false}
              currentRound={currentRound}
              rouletteItems={showRoulette ? rouletteItems : []}
              winningItem={winningItems.get(battle.participants[1].id) || null}
              isSpinning={isSpinning}
            />
          </div>
        ) : battle.participants.length === 3 ? (
          /* 1v1v1 Layout */
          <div>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <PlayerCard 
                participant={battle.participants[0]} 
                position="left"
                isCurrentUser={user ? battle.participants[0].user_id === user.id : false}
                currentRound={currentRound}
                rouletteItems={showRoulette ? rouletteItems : []}
                winningItem={winningItems.get(battle.participants[0].id) || null}
                isSpinning={isSpinning}
              />
              <PlayerCard 
                participant={battle.participants[1]} 
                position="right"
                isCurrentUser={user ? battle.participants[1].user_id === user.id : false}
                currentRound={currentRound}
                rouletteItems={showRoulette ? rouletteItems : []}
                winningItem={winningItems.get(battle.participants[1].id) || null}
                isSpinning={isSpinning}
              />
            </div>
            <div className="flex justify-center">
              <div className="w-1/2">
                <PlayerCard 
                  participant={battle.participants[2]} 
                  position="center"
                  isCurrentUser={user ? battle.participants[2].user_id === user.id : false}
                  currentRound={currentRound}
                  rouletteItems={showRoulette ? rouletteItems : []}
                  winningItem={winningItems.get(battle.participants[2].id) || null}
                  isSpinning={isSpinning}
                />
              </div>
            </div>
          </div>
        ) : battle.participants.length === 4 ? (
          /* 2v2 Layout */
          <div>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <PlayerCard 
                participant={battle.participants[0]} 
                position="left"
                isCurrentUser={user ? battle.participants[0].user_id === user.id : false}
                currentRound={currentRound}
                rouletteItems={showRoulette ? rouletteItems : []}
                winningItem={winningItems.get(battle.participants[0].id) || null}
                isSpinning={isSpinning}
              />
              <PlayerCard 
                participant={battle.participants[1]} 
                position="right"
                isCurrentUser={user ? battle.participants[1].user_id === user.id : false}
                currentRound={currentRound}
                rouletteItems={showRoulette ? rouletteItems : []}
                winningItem={winningItems.get(battle.participants[1].id) || null}
                isSpinning={isSpinning}
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <PlayerCard 
                participant={battle.participants[2]} 
                position="left"
                isCurrentUser={user ? battle.participants[2].user_id === user.id : false}
                currentRound={currentRound}
                rouletteItems={showRoulette ? rouletteItems : []}
                winningItem={winningItems.get(battle.participants[2].id) || null}
                isSpinning={isSpinning}
              />
              <PlayerCard 
                participant={battle.participants[3]} 
                position="right"
                isCurrentUser={user ? battle.participants[3].user_id === user.id : false}
                currentRound={currentRound}
                rouletteItems={showRoulette ? rouletteItems : []}
                winningItem={winningItems.get(battle.participants[3].id) || null}
                isSpinning={isSpinning}
              />
            </div>
          </div>
        ) : (
          /* Waiting for players */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-12 max-w-2xl mx-auto border-2 border-blue-500/50">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mb-6"
              >
                <Users className="w-20 h-20 text-blue-400 mx-auto" />
              </motion.div>
              
              <div className="text-yellow-400 font-black text-3xl mb-4">
                Waiting for Players...
              </div>
              
              <div className="text-white/80 text-lg mb-3">
                {battle.participants.length}/{battle.max_players} Players Joined
              </div>
              
              <div className="text-white/60">
                {battle.max_players - battle.participants.length} more player{battle.max_players - battle.participants.length !== 1 ? 's' : ''} needed to start
              </div>

              {/* Progress Bar */}
              <div className="mt-6 bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(battle.participants.length / battle.max_players) * 100}%` 
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Status Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60">Status:</span>
            <span className={`font-bold ${
              battle.status === 'waiting' ? 'text-yellow-400' :
              battle.status === 'countdown' ? 'text-orange-400' :
              battle.status === 'active' ? 'text-green-400' :
              battle.status === 'finished' ? 'text-blue-400' : 'text-white/60'
            }`}>
              {battle.status === 'waiting' ? 'WAITING' :
               battle.status === 'countdown' ? 'STARTING' :
               battle.status === 'active' ? 'ACTIVE' :
               battle.status === 'finished' ? 'FINISHED' : battle.status.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60">Mode:</span>
            <span className="text-blue-400 font-bold">{MODE_LABELS[battle.mode].toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/60">Players:</span>
            <span className="text-white font-bold">{battle.participants.length}/{battle.max_players}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}