// app/battles/[id]/page.tsx
'use client'

import { use } from 'react' // Ajout de l'import use
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { Roulette } from '@/app/components/battle/Roulette'
import { PlayerPanel } from '@/app/components/battle/PlayerPanel'
import { AddBotButton } from '@/app/components/battle/AddBotButton'
import { EndSummaryModal } from '@/app/components/battle/EndSummaryModal'
import { BattleHeader } from '@/app/components/battle/BattleHeader'

// === PALETTE ===
const colors = {
  bgPrimary: '#13151F',
  surface: '#1C1F2B',
  accent: '#4C5BF9',
  highlight: '#FFC64C',
  success: '#28FF6A',
  error: '#FF4C4C',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF'
} as const

// === REALTIME EVENTS ===
const REALTIME_EVENTS = {
  PLAYER_JOINED: 'player_joined',
  BOT_ADDED: 'bot_added',
  BATTLE_STARTED: 'battle_started',
  BOX_OPENED: 'box_opened',
  BATTLE_ENDED: 'battle_ended'
} as const

// === TYPES ===
const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  battleId: z.string(),
  username: z.string(),
  avatar: z.string(),
  team: z.enum(['A', 'B']).nullable(),
  bot: z.boolean(),
  totalValue: z.number(),
  loots: z.array(z.object({
    boxIndex: z.number(),
    items: z.array(z.object({
      id: z.string(),
      name: z.string(),
      image: z.string(),
      value: z.number(),
      rarity: z.string()
    }))
  }))
})

const BattleSchema = z.object({
  id: z.string(),
  mode: z.enum(['1v1', '2v2', '1v1v1']),
  status: z.enum(['waiting', 'in_progress', 'completed']),
  creatorId: z.string(),
  boxes: z.array(z.string()),
  players: z.array(PlayerSchema),
  winners: z.array(z.string()).nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable()
})

type Battle = z.infer<typeof BattleSchema>
type Player = z.infer<typeof PlayerSchema>

// === BATTLE STORE ===
interface BattleStore {
  battle: Battle | null
  setBattle: (battle: Battle) => void
  updatePlayer: (playerId: string, data: Partial<Player>) => void
  addPlayer: (player: Player) => void
  setStatus: (status: Battle['status']) => void
  setWinners: (winners: string[]) => void
}

const useBattleStore = (): [BattleStore, (fn: (store: BattleStore) => void) => void] => {
  const [store, setStore] = useState<BattleStore>({
    battle: null,
    setBattle: (battle) => setStore(prev => {
      // Ne pas mettre à jour si c'est la même battle
      if (prev.battle?.id === battle.id) return prev
      return { ...prev, battle }
    }),
    updatePlayer: (playerId, data) => setStore(prev => ({
      ...prev,
      battle: prev.battle ? {
        ...prev.battle,
        players: prev.battle.players.map(p => 
          p.id === playerId ? { ...p, ...data } : p
        )
      } : null
    })),
    addPlayer: (player) => setStore(prev => ({
      ...prev,
      battle: prev.battle ? {
        ...prev.battle,
        players: [...prev.battle.players, player]
      } : null
    })),
    setStatus: (status) => setStore(prev => ({
      ...prev,
      battle: prev.battle ? { ...prev.battle, status } : null
    })),
    setWinners: (winners) => setStore(prev => ({
      ...prev,
      battle: prev.battle ? { ...prev.battle, winners } : null
    }))
  })

  const updateStore = useCallback((fn: (store: BattleStore) => void) => {
    setStore(prev => {
      const newStore = { ...prev }
      fn(newStore)
      return newStore
    })
  }, [])

  return [store, updateStore]
}

// === REALTIME HOOK ===
const useBattleChannel = (battleId: string, store: BattleStore, updateStore: (fn: (store: BattleStore) => void) => void) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!battleId) return

    const battleChannel = supabase.channel(`battle:${battleId}`)
      .on('broadcast', { event: REALTIME_EVENTS.PLAYER_JOINED }, ({ payload }) => {
        updateStore(store => store.addPlayer(payload.player))
      })
      .on('broadcast', { event: REALTIME_EVENTS.BOT_ADDED }, ({ payload }) => {
        updateStore(store => store.addPlayer(payload.bot))
      })
      .on('broadcast', { event: REALTIME_EVENTS.BATTLE_STARTED }, () => {
        updateStore(store => {
          store.setStatus('in_progress')
          if (store.battle) {
            store.setBattle({ ...store.battle, startedAt: new Date().toISOString() })
          }
        })
      })
      .on('broadcast', { event: REALTIME_EVENTS.BOX_OPENED }, ({ payload }) => {
        updateStore(store => {
          const player = store.battle?.players.find(p => p.id === payload.playerId)
          if (player) {
            const newLoots = [...player.loots, { boxIndex: payload.boxIndex, items: payload.loot }]
            const totalValue = newLoots.reduce((sum, loot) => 
              sum + loot.items.reduce((itemSum, item) => itemSum + item.value, 0), 0
            )
            store.updatePlayer(payload.playerId, { loots: newLoots, totalValue })
          }
        })
      })
      .on('broadcast', { event: REALTIME_EVENTS.BATTLE_ENDED }, ({ payload }) => {
        updateStore(store => {
          store.setStatus('completed')
          store.setWinners(payload.winners)
          if (store.battle) {
            store.setBattle({ ...store.battle, endedAt: new Date().toISOString() })
          }
        })
        queryClient.invalidateQueries({ queryKey: ['battle', battleId] })
      })
      .subscribe()

    setChannel(battleChannel)

    return () => {
      battleChannel.unsubscribe()
    }
  }, [battleId, supabase, updateStore, queryClient])

  return channel
}

function BattleRoom({ battle, userId }: { battle: Battle; userId: string }) {
  const [openingBox, setOpeningBox] = useState<{ [playerId: string]: boolean }>({})
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0)
  const queryClient = useQueryClient()
  
  const isCreator = battle.creatorId === userId
  const requiredPlayers = battle.mode === '1v1' ? 2 : battle.mode === '2v2' ? 4 : 3
  const hasEmptySlots = battle.players.length < requiredPlayers
  
  // Open box mutation
  const openBoxMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const res = await fetch(`/api/battles/${battle.id}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxIndex: currentBoxIndex })
      })
      if (!res.ok) throw new Error('Failed to open box')
      return res.json()
    }
  })
  
  // End battle mutation
  const endBattleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/battles/${battle.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to end battle')
      return res.json()
    }
  })
  
  const handleOpenBox = async () => {
    if (battle.status !== 'in_progress') return
    
    // All players open simultaneously
    const openPromises = battle.players.map(async (player) => {
      setOpeningBox(prev => ({ ...prev, [player.id]: true }))
      
      try {
        const result = await openBoxMutation.mutateAsync(player.id)
        // Result will be broadcast via realtime
      } catch (error) {
        console.error(`Failed to open box for ${player.username}:`, error)
      } finally {
        setTimeout(() => {
          setOpeningBox(prev => ({ ...prev, [player.id]: false }))
        }, 2500)
      }
    })
    
    await Promise.all(openPromises)
    
    // Check if all boxes opened
    if (currentBoxIndex + 1 >= battle.boxes.length) {
      setTimeout(() => {
        endBattleMutation.mutate()
      }, 1000)
    } else {
      setCurrentBoxIndex(prev => prev + 1)
    }
  }
  
  // Get player positions based on mode
  const getPlayerLayout = () => {
    if (battle.mode === '1v1') {
      return {
        left: battle.players[0],
        right: battle.players[1]
      }
    } else if (battle.mode === '2v2') {
      const teamA = battle.players.filter(p => p.team === 'A')
      const teamB = battle.players.filter(p => p.team === 'B')
      return { teamA, teamB }
    } else {
      return { players: battle.players }
    }
  }
  
  const layout = getPlayerLayout()
  
  return (
    <>
      <BattleHeader
        mode={battle.mode}
        status={battle.status}
        currentBox={currentBoxIndex}
        totalBoxes={battle.boxes.length}
        startedAt={battle.startedAt}
      />
      
      <div className="flex-1 p-6">
        {/* Waiting room */}
        {battle.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="text-2xl font-bold text-white mb-4">
              Waiting for players...
            </div>
            <div className="text-lg text-gray-400 mb-8">
              {battle.players.length} / {requiredPlayers} players joined
            </div>
            
            {/* Player slots */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {Array.from({ length: requiredPlayers }).map((_, index) => {
                const player = battle.players[index]
                
                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="w-48 h-24 rounded-lg border-2 border-dashed flex items-center justify-center"
                    style={{ 
                      borderColor: player ? '#4C5BF9' : '#374151',
                      backgroundColor: player ? '#1C1F2B' : 'transparent'
                    }}
                  >
                    {player ? (
                      <div className="flex items-center gap-3">
                        <img 
                          src={player.avatar} 
                          alt={player.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-semibold text-white">
                            {player.username}
                          </div>
                          {player.bot && (
                            <div className="text-xs text-gray-400">BOT</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        Empty Slot
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
            
{isCreator && hasEmptySlots && (
  <AddBotButton battleId={battle.id} />
)}
          </motion.div>
        )}
        
        {/* Battle in progress */}
        {battle.status === 'in_progress' && (
          <div className="h-full flex flex-col">
            {/* Battle arena based on mode */}
            {battle.mode === '1v1' && layout.left && layout.right && (
              <div className="flex-1 grid grid-cols-3 gap-6">
                <PlayerPanel 
                  player={layout.left} 
                  position="left"
                  isWinner={battle.winners?.includes(layout.left.id)}
                />
                
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-bold text-gray-600 mb-8"
                  >
                    VS
                  </motion.div>
                  
                  {!openingBox[layout.left.id] && !openingBox[layout.right.id] && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenBox}
                      className="px-8 py-4 rounded-lg font-bold text-white text-xl"
                      style={{ backgroundColor: '#4C5BF9' }}
                    >
                      Open Box #{currentBoxIndex + 1}
                    </motion.button>
                  )}
                </div>
                
                <PlayerPanel 
                  player={layout.right} 
                  position="right"
                  isWinner={battle.winners?.includes(layout.right.id)}
                />
              </div>
            )}
            
            {battle.mode === '2v2' && layout.teamA && layout.teamB && (
              <div className="flex-1 grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="text-center text-xl font-bold" style={{ color: '#4C5BF9' }}>
                    Team A
                  </div>
                  {layout.teamA.map(player => (
                    <PlayerPanel 
                      key={player.id}
                      player={player} 
                      position="left"
                      isWinner={battle.winners?.includes(player.id)}
                    />
                  ))}
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-bold text-gray-600 mb-8"
                  >
                    VS
                  </motion.div>
                  
                  {!Object.values(openingBox).some(v => v) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenBox}
                      className="px-8 py-4 rounded-lg font-bold text-white text-xl"
                      style={{ backgroundColor: '#4C5BF9' }}
                    >
                      Open Box #{currentBoxIndex + 1}
                    </motion.button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="text-center text-xl font-bold" style={{ color: '#FFC64C' }}>
                    Team B
                  </div>
                  {layout.teamB.map(player => (
                    <PlayerPanel 
                      key={player.id}
                      player={player} 
                      position="right"
                      isWinner={battle.winners?.includes(player.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {battle.mode === '1v1v1' && layout.players && (
              <div className="flex-1 flex flex-col items-center">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {layout.players.map((player, index) => (
                    <PlayerPanel 
                      key={player.id}
                      player={player} 
                      position="center"
                      isWinner={battle.winners?.includes(player.id)}
                    />
                  ))}
                </div>
                
                {!Object.values(openingBox).some(v => v) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenBox}
                    className="px-8 py-4 rounded-lg font-bold text-white text-xl"
                    style={{ backgroundColor: '#4C5BF9' }}
                  >
                    Open Box #{currentBoxIndex + 1}
                  </motion.button>
                )}
              </div>
            )}
            
            {/* Roulette animations */}
            <AnimatePresence>
              {battle.players.map(player => openingBox[player.id] && (
                <motion.div
                  key={`roulette-${player.id}`}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
                >
                  <div className="bg-black/90 p-4 rounded-lg">
                    <div className="text-white text-center mb-2">
                      {player.username} is opening...
                    </div>
                    <Roulette
                      items={player.loots[currentBoxIndex]?.items || []}
                      onFinish={() => {}}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* End Summary Modal */}
      <EndSummaryModal
        isOpen={battle.status === 'completed'}
        players={battle.players}
        winners={battle.winners || []}
        battleId={battle.id}
        mode={battle.mode}
        boxes={battle.boxes}
      />
    </>
  )
}

// === MAIN COMPONENT ===
export default function BattleRoomPage({ 
  params 
}: { 
  params: Promise<{ id: string }> // params est maintenant une Promise
}) {
  const resolvedParams = use(params) // Résoudre la Promise avec use()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [store, updateStore] = useBattleStore()
  const battleId = resolvedParams.id //
  

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch initial battle data
  const { data: initialBattle, isLoading: battleLoading } = useQuery({
    queryKey: ['battle', battleId],
    queryFn: async () => {
      const res = await fetch(`/api/battles/${battleId}`)
      if (!res.ok) throw new Error('Failed to fetch battle')
      const data = await res.json()
      return BattleSchema.parse(data)
    },
    enabled: !!user && !!battleId,
    refetchInterval: 5000 // Fallback polling
  })

  // Initialize store with battle data
useEffect(() => {
  if (initialBattle && (!store.battle || store.battle.id !== initialBattle.id)) {
    store.setBattle(initialBattle)
  }
}, [initialBattle, store.battle?.id]) //

  // Setup realtime subscription
  const channel = useBattleChannel(battleId, store, updateStore)

  // Check if battle should auto-start
  useEffect(() => {
    if (!store.battle) return
    
    const { mode, players, status } = store.battle
    const requiredPlayers = mode === '1v1' ? 2 : mode === '2v2' ? 4 : 3
    
    if (status === 'waiting' && players.length === requiredPlayers) {
      // Auto-start battle
      fetch(`/api/battles/${battleId}/start`, { method: 'POST' })
    }
  }, [store.battle, battleId])

  if (authLoading || battleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bgPrimary }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.accent }}></div>
      </div>
    )
  }

  if (!user || !store.battle) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.bgPrimary }}>
      {store.battle && user && (
        <BattleRoom battle={store.battle} userId={user.id} />
      )}
    </div>
  )
}