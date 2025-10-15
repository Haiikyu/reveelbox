'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Bot, Eye, Play, Trophy, Zap, ChevronDown
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

// Types
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

const RARITY_COLORS = {
  common: 'from-gray-600 to-gray-800',
  rare: 'from-blue-600 to-blue-800',
  epic: 'from-purple-600 to-purple-800',
  legendary: 'from-yellow-600 to-yellow-800'
}

// Roulette Component (intégrée dans PlayerCard)
function PlayerRouletteWheel({ 
  items, 
  winningItem,
  isSpinning,
  participantId
}: { 
  items: BattleItem[]
  winningItem: BattleItem | null
  isSpinning: boolean
  participantId: string
}) {
  const [spinPosition, setSpinPosition] = useState(0)
  
  // Créer un tableau d'items répété pour l'effet de scroll infini
  const repeatedItems = useMemo(() => {
    const repeated = []
    for (let i = 0; i < 10; i++) {
      repeated.push(...items)
    }
    return repeated
  }, [items])

  useEffect(() => {
    if (!isSpinning || !winningItem) return

    // Trouver l'index de l'item gagnant dans le tableau répété
    const middleIndex = Math.floor(repeatedItems.length / 2)
    const winningIndex = repeatedItems.findIndex((item, idx) => 
      idx > middleIndex && item.id === winningItem.id
    )

    if (winningIndex === -1) return

    // Calculer la position finale (centrer l'item gagnant)
    const itemWidth = 120 // largeur d'un item (plus petit)
    const containerWidth = 400 // largeur du conteneur visible
    const finalPosition = -(winningIndex * itemWidth - containerWidth / 2 + itemWidth / 2)

    // Animation de défilement
    setSpinPosition(0)
    
    const spinDuration = 4000 // 4 secondes
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / spinDuration, 1)
      
      // Easing function pour ralentir progressivement
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentPosition = finalPosition * easeOut
      setSpinPosition(currentPosition)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [isSpinning, winningItem, repeatedItems])

  if (!isSpinning) return null

  return (
    <div className="w-full mb-4">
      <div className="relative w-full h-48 overflow-hidden bg-surface rounded-xl border-2 border-purple-500/50">
        {/* Flèche indicatrice */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <ChevronDown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" strokeWidth={4} />
        </div>

        {/* Items défilants */}
        <div
          className="flex items-center h-full py-6"
          style={{
            transform: `translateX(${spinPosition}px)`,
            transition: 'none'
          }}
        >
          {repeatedItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-[120px] px-1.5"
            >
              <div className={`
                bg-gradient-to-br ${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common}
                rounded-lg p-3 border-2 border-purple-500/30
              `}>
                <div className="aspect-square mb-1.5 flex items-center justify-center">
                  <img
                    src={item.image_url || '/placeholder-item.png'}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-white text-[10px] font-medium text-center truncate">
                  {item.name}
                </div>
                <div className="text-green-400 font-bold text-center text-xs">
                  ${item.market_value.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overlay gradient pour effet de profondeur */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface to-transparent" />
        </div>

        {/* Ligne centrale */}
        <div className="absolute inset-y-0 left-1/2 w-1 bg-yellow-400/50 -translate-x-1/2 z-10" />
      </div>
    </div>
  )
}

// Player Card Component
function PlayerCard({ 
  participant, 
  position, 
  isCurrentUser,
  currentRound,
  rouletteItems,
  winningItem,
  isSpinning
}: { 
  participant: BattleParticipant
  position: 'left' | 'right' | 'center'
  isCurrentUser: boolean
  currentRound: number
  rouletteItems: BattleItem[]
  winningItem: BattleItem | null
  isSpinning: boolean
}) {
  const isLeft = position === 'left'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col items-center"
    >
      {/* Player Header */}
      <div className={`
        relative bg-surface-elevated
        backdrop-blur-xl border-2 rounded-2xl p-6 mb-4 w-full
        ${isCurrentUser ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border'}
      `}>
        {/* Position Badge */}
        <div className={`
          absolute -top-3 ${isLeft ? '-left-3' : '-right-3'}
          w-12 h-12 rounded-full flex items-center justify-center
          font-black text-xl text-white shadow-lg
          ${participant.position === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-gray-600 to-gray-800'}
        `}>
          #{participant.position}
        </div>

        {/* Team Badge */}
        <div className={`
          absolute -top-3 ${isLeft ? '-right-3' : '-left-3'}
          px-3 py-1 rounded-full text-xs font-bold text-white
          ${participant.team === 1 ? 'bg-blue-500' : 'bg-red-500'}
        `}>
          {participant.team === 1 ? 'BLUE' : 'RED'}
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className={`
              w-20 h-20 rounded-full overflow-hidden border-4
              ${isCurrentUser ? 'border-blue-500' : 'border'}
              shadow-lg
            `}>
              {participant.is_bot ? (
                <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-white" />
                </div>
              ) : (
                <img
                  src={participant.avatar_url || '/default-avatar.png'}
                  alt={participant.username || 'Player'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <div className="text-primary font-bold text-lg mb-1 flex items-center gap-2">
              {participant.is_bot ? participant.bot_name : participant.username}
              {isCurrentUser && (
                <span className="text-xs px-2 py-0.5 bg-blue-500 rounded-full">Vous</span>
              )}
            </div>
            <div className="text-muted text-sm mb-2">
              {participant.is_bot ? 'Bot Player' : 'Human Player'}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-black text-green-400">
                ${participant.total_value.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Roulette */}
      {rouletteItems.length > 0 && (
        <PlayerRouletteWheel
          items={rouletteItems}
          winningItem={winningItem}
          isSpinning={isSpinning}
          participantId={participant.id}
        />
      )}

      {/* Items Won Grid */}
      <div className="w-full grid grid-cols-2 gap-3">
        {participant.items_won.map((item, idx) => (
          <motion.div
            key={`${item.id}-${idx}`}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`
              relative bg-gradient-to-br ${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common}
              rounded-xl p-4 border-2 border-purple-500/30 
              hover:scale-105 transition-transform cursor-pointer
              shadow-lg
            `}
          >
            {/* Item Image */}
            <div className="aspect-square mb-3 flex items-center justify-center">
              <img 
                src={item.image_url || '/placeholder-item.png'} 
                alt={item.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Item Name */}
            <div className="text-white text-xs font-medium text-center mb-2 truncate">
              {item.name}
            </div>

            {/* Item Value */}
            <div className="text-center">
              <div className="text-green-400 font-black text-lg">
                ${item.market_value.toFixed(2)}
              </div>
            </div>

            {/* Rarity Badge */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {idx + 1}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Empty Slots */}
        {Array.from({ length: Math.max(0, currentRound - participant.items_won.length) }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="aspect-square surface border-2 border-dashed rounded-xl flex items-center justify-center"
          >
            <span className="text-4xl text-muted">?</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Main Component
export default function BattleRoomPage(): JSX.Element {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  // Refs
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)
  const autoStartRef = useRef(false)
  const battleStartedRef = useRef(false)

  // States
  const [user, setUser] = useState<any>(null)
  const [battle, setBattle] = useState<Battle | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [addingBot, setAddingBot] = useState<boolean>(false)
  
  const [isSpectator, setIsSpectator] = useState<boolean>(false)
  const [currentRound, setCurrentRound] = useState<number>(1)
  const [battleStarted, setBattleStarted] = useState<boolean>(false)
  const [globalCountdown, setGlobalCountdown] = useState<number>(0)
  const [fastMode, setFastMode] = useState<boolean>(false)
  const [isOpening, setIsOpening] = useState<boolean>(false)
  
  // Roulette states
  const [showRoulette, setShowRoulette] = useState<boolean>(false)
  const [rouletteItems, setRouletteItems] = useState<BattleItem[]>([])
  const [winningItems, setWinningItems] = useState<Map<string, BattleItem>>(new Map())
  const [isSpinning, setIsSpinning] = useState<boolean>(false)
  
  const battleId = params?.id as string
  const isSpectatorMode = searchParams?.get('spectate') === 'true'

  // Participant actuel
  const myParticipant = useMemo((): BattleParticipant | null => {
    if (!battle || !user) return null
    return battle.participants.find(p => p.user_id === user.id) || null
  }, [battle, user])

  // Vérification spectateur
  useEffect(() => {
    setIsSpectator(isSpectatorMode || !myParticipant)
  }, [isSpectatorMode, myParticipant])

  // LOAD BATTLE
  const loadBattle = useCallback(async (): Promise<void> => {
    if (loadingRef.current || !mountedRef.current || !battleId) return

    try {
      loadingRef.current = true
      setLoading(true)
      setError('')

      // 1. Load battle
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single()

      if (battleError || !battleData) {
        if (!mountedRef.current) return
        setError('Battle introuvable')
        return
      }

      // 2. Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('battle_participants')
        .select('*')
        .eq('battle_id', battleId)
        .order('position')

      if (participantsError) {
        console.error('Error loading participants:', participantsError)
        if (!mountedRef.current) return
        setError('Erreur lors du chargement des participants')
        return
      }

      // 3. Load profiles
      const allParticipants: BattleParticipant[] = []
      
      if (participantsData) {
        for (const participant of participantsData) {
          if (!mountedRef.current) return
          
          if (!participant.is_bot && participant.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url, level')
              .eq('id', participant.user_id)
              .single()
            
            allParticipants.push({ 
              ...participant, 
              username: profile?.username || null,
              avatar_url: profile?.avatar_url || null,
              level: profile?.level || 1
            })
          } else {
            allParticipants.push({ 
              ...participant,
              username: participant.bot_name,
              avatar_url: participant.bot_avatar_url,
              level: 1
            })
          }
        }
      }

      // 4. Load boxes
      const { data: rawBoxesData } = await supabase
        .from('battle_boxes')
        .select(`
          id, loot_box_id, quantity, order_position, cost_per_box,
          loot_boxes (id, name, image_url, price_virtual)
        `)
        .eq('battle_id', battleId)
        .order('order_position')

      const boxesData: BattleBox[] = (rawBoxesData || []).map((box: any) => ({
        ...box,
        loot_boxes: Array.isArray(box.loot_boxes) ? (box.loot_boxes[0] || null) : box.loot_boxes
      }))

      if (!mountedRef.current) return

      const completeBattle: Battle = {
        ...battleData,
        participants: allParticipants.sort((a, b) => a.position - b.position),
        battle_boxes: boxesData
      }

      setBattle(completeBattle)
      setCurrentRound(Math.max(1, completeBattle.current_box || 1))

    } catch (err) {
      console.error('Unexpected error loading battle:', err)
      if (!mountedRef.current) return
      setError('Erreur inattendue lors du chargement')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      loadingRef.current = false
    }
  }, [battleId])

  // Load items for current box
  const loadBoxItems = useCallback(async (boxId: string): Promise<BattleItem[]> => {
    const { data, error } = await supabase
      .from('loot_box_items')
      .select(`
        item_id,
        probability,
        items (
          id,
          name,
          image_url,
          market_value,
          rarity
        )
      `)
      .eq('loot_box_id', boxId)

    if (error || !data) {
      console.error('Error loading box items:', error)
      return []
    }

    return data.map((lbi: any) => ({
      id: lbi.items.id,
      name: lbi.items.name,
      image_url: lbi.items.image_url,
      market_value: lbi.items.market_value,
      rarity: lbi.items.rarity,
      probability: lbi.probability
    }))
  }, [])

  // OPEN BOX HANDLER avec Roulette
  const handleOpenBox = useCallback(async () => {
    if (!battle || isOpening) return
    
    setIsOpening(true)
    
    try {
      const currentBoxId = battle.battle_boxes[currentRound - 1]?.loot_box_id
      if (!currentBoxId) return

      // Charger les items de la box
      const items = await loadBoxItems(currentBoxId)
      setRouletteItems(items)
      
      // Afficher la roulette
      setShowRoulette(true)
      
      // Simuler l'ouverture pour tous les participants
      const newWinningItems = new Map<string, BattleItem>()
      
      for (const participant of battle.participants) {
        const { data, error } = await supabase.rpc('simulate_battle_box_opening', {
          p_loot_box_id: currentBoxId,
          p_battle_id: battle.id,
          p_participant_id: participant.id
        })

        if (data?.success && data?.item) {
          const winningItem: BattleItem = {
            id: data.item.id,
            name: data.item.name,
            image_url: data.item.image_url,
            market_value: data.item.value,
            rarity: data.item.rarity,
            probability: 0
          }
          
          newWinningItems.set(participant.id, winningItem)
        }
      }
      
      setWinningItems(newWinningItems)
      setIsSpinning(true)

    } catch (err) {
      console.error('Error opening box:', err)
      setIsOpening(false)
      setShowRoulette(false)
    }
  }, [battle, currentRound, isOpening, loadBoxItems])

  // Callback when roulette finishes
  const handleSpinComplete = useCallback(async () => {
    // Attendre que toutes les roulettes finissent (4 secondes)
    setTimeout(async () => {
      setIsSpinning(false)
      
      // Mettre à jour les participants avec leurs items gagnés
      setBattle(prev => {
        if (!prev) return prev
        return {
          ...prev,
          participants: prev.participants.map(p => {
            const wonItem = winningItems.get(p.id)
            if (wonItem) {
              return {
                ...p,
                items_won: [...p.items_won, wonItem],
                total_value: p.total_value + wonItem.market_value
              }
            }
            return p
          })
        }
      })

      // Cacher la roulette
      setShowRoulette(false)
      setIsOpening(false)

      // Passer au round suivant
      const nextRound = currentRound + 1
      setCurrentRound(nextRound)

      // Update current_box in database
      if (battle) {
        await supabase
          .from('battles')
          .update({ current_box: nextRound })
          .eq('id', battle.id)

        // Check if battle is finished
        if (currentRound >= battle.total_boxes) {
          console.log('Battle terminée !')

          // Determine winner(s)
          const winner = battle.participants.reduce((prev, current) => {
            const prevValue = prev.total_value + (winningItems.get(prev.id)?.market_value || 0)
            const currentValue = current.total_value + (winningItems.get(current.id)?.market_value || 0)
            return prevValue > currentValue ? prev : current
          })

          // Update battle status to finished
          await supabase
            .from('battles')
            .update({
              status: 'finished',
              finished_at: new Date().toISOString(),
              winner_user_id: winner.user_id,
              winning_value: winner.total_value + (winningItems.get(winner.id)?.market_value || 0)
            })
            .eq('id', battle.id)

          // Update winner participant
          await supabase
            .from('battle_participants')
            .update({
              is_winner: true,
              final_rank: 1
            })
            .eq('id', winner.id)
        }
      }
    }, 4500) // Attendre la fin de l'animation (4s) + 0.5s
  }, [battle, currentRound, winningItems])

  // ADD BOT
  const handleAddBot = useCallback(async (): Promise<void> => {
    if (!battle || addingBot) return

    try {
      setAddingBot(true)
      
      const { data, error } = await supabase.rpc('add_bot_to_battle_simple', {
        p_battle_id: battle.id
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error)

      console.log(`Bot ajouté: ${data.bot_name}`)
      await loadBattle()

    } catch (err) {
      console.error('Error adding bot:', err)
    } finally {
      setAddingBot(false)
    }
  }, [battle, addingBot, loadBattle])

  // START BATTLE
  const handleStartBattle = useCallback(async (): Promise<void> => {
    if (!battle || autoStartRef.current || battleStartedRef.current) return

    try {
      autoStartRef.current = true
      battleStartedRef.current = true

      const { error } = await supabase
        .from('battles')
        .update({ 
          status: 'active', 
          started_at: new Date().toISOString(),
          current_box: 1
        })
        .eq('id', battle.id)

      if (error) throw error

      let countdown = 3
      setGlobalCountdown(countdown)

      const countdownInterval = setInterval(() => {
        countdown--
        setGlobalCountdown(countdown)
        
        if (countdown <= 0) {
          clearInterval(countdownInterval)
          setBattleStarted(true)
          setBattle(prev => prev ? { ...prev, status: 'active' } : null)
        }
      }, 1000)

    } catch (err) {
      console.error('Error starting battle:', err)
      autoStartRef.current = false
      battleStartedRef.current = false
    }
  }, [battle])

  // Auto-start when battle becomes active
  useEffect(() => {
    if (!battle || battle.status !== 'active' || isOpening || showRoulette || currentRound > battle.total_boxes) return
    
    // Auto-open boxes
    const timer = setTimeout(() => {
      handleOpenBox()
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [battle?.status, currentRound, isOpening, showRoulette, handleOpenBox])

  // Callback automatique après l'animation
  useEffect(() => {
    if (isSpinning && showRoulette) {
      const timer = setTimeout(() => {
        handleSpinComplete()
      }, 100) // Démarrer immédiatement après le début du spin
      
      return () => clearTimeout(timer)
    }
  }, [isSpinning, showRoulette, handleSpinComplete])

  // Auto-start
  useEffect(() => {
    if (!battle || battle.status !== 'waiting' || autoStartRef.current || battleStartedRef.current) return
    
    const currentPlayers = battle.participants.length
    if (currentPlayers === battle.max_players) {
      const timer = setTimeout(() => {
        handleStartBattle()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [battle, handleStartBattle])

  // Real-time subscriptions
  useEffect(() => {
    if (!battleId) return

    const battleChannel = supabase
      .channel(`battle-${battleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${battleId}`
        },
        (payload) => {
          console.log('Battle updated:', payload)
          if (payload.eventType === 'UPDATE' && payload.new) {
            setBattle(prev => prev ? { ...prev, ...payload.new as any } : prev)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battleId}`
        },
        (payload) => {
          console.log('Participant updated:', payload)
          loadBattle()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(battleChannel)
    }
  }, [battleId, loadBattle])

  // Init
  useEffect(() => {
    mountedRef.current = true

    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setUser(profile)
    }

    if (!battleId) {
      setError('ID de battle manquant')
      setLoading(false)
      return
    }

    loadUser().then(() => {
      loadBattle()
    })

    return () => {
      mountedRef.current = false
    }
  }, [battleId, loadBattle, router])

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <div className="text-primary text-xl">Chargement...</div>
        </div>
      </div>
    )
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-primary">
          <h2 className="text-2xl font-bold mb-4 text-red-400">{error || 'Battle introuvable'}</h2>
          <button
            onClick={() => router.push('/battles')}
            className="btn-primary"
          >
            Retour aux Battles
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-primary">

      {/* Header */}
      <div className="bg-surface backdrop-blur-sm border-b border border-default sticky top-0 z-30 pt-16">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            <button
              onClick={() => router.push('/battles')}
              className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {battle.name}
              </div>
              <div className="text-sm text-muted">
                {battle.mode.toUpperCase()} • BOX {currentRound} OF {battle.total_boxes}
              </div>
              <div className="text-lg font-bold text-yellow-400 mt-1">
                ${battle.total_prize.toFixed(2)} PRIZE POOL
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSpectator && (
                <div className="flex items-center gap-1 text-sm text-muted">
                  <Eye className="w-4 h-4" />
                  <span>Spectateur</span>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fastMode}
                  onChange={(e) => setFastMode(e.target.checked)}
                  className="rounded"
                />
                <Zap className="w-4 h-4" />
                Fast
              </label>
            </div>
          </div>

          {/* Bot Manager */}
          {user && !isSpectator && myParticipant && battle.creator_id === user.id && battle.status === 'waiting' && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted">
                {battle.max_players - battle.participants.length} slots libres
              </span>
              <button
                onClick={handleAddBot}
                disabled={addingBot}
                className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-400 hover:bg-purple-500/30 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Bot className="w-3 h-3" />
                {addingBot ? 'Ajout...' : 'Ajouter Bot'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Battle Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
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
          <div className="text-center py-12">
            <div className="surface rounded-xl p-8 max-w-md mx-auto">
              <div className="text-yellow-400 font-bold text-xl mb-4">
                En attente de joueurs...
              </div>
              <div className="text-muted mb-4">
                {battle.participants.length}/{battle.max_players} joueurs
              </div>
              <div className="text-muted text-sm">
                Encore {battle.max_players - battle.participants.length} joueur(s) nécessaire(s) pour démarrer
              </div>
            </div>
          </div>
        )}

        {/* Countdown */}
        {globalCountdown > 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-9xl font-black text-primary"
            >
              {globalCountdown}
            </motion.div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface backdrop-blur-xl border-t border p-4 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-muted text-sm">
            Status: <span className={`font-bold ${
              battle.status === 'waiting' ? 'text-yellow-400' :
              battle.status === 'active' ? 'text-green-400' :
              battle.status === 'finished' ? 'text-blue-400' : 'text-muted'
            }`}>
              {battle.status === 'waiting' ? 'EN ATTENTE' :
               battle.status === 'active' ? 'EN COURS' :
               battle.status === 'finished' ? 'TERMINÉE' : battle.status}
            </span>
          </div>
          <div className="text-muted text-sm">
            Mode: <span className="text-primary font-bold">{battle.mode.toUpperCase()}</span>
          </div>
          <div className="text-muted text-sm">
            Players: <span className="text-primary font-bold">{battle.participants.length}/{battle.max_players}</span>
          </div>
        </div>
      </div>
    </div>
  )
}