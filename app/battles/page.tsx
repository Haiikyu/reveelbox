'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import {
  Users, Eye, Bot, User, Crown, Zap, Target, Star, Trophy,
  RefreshCw, Shield, Plus, Coins
} from 'lucide-react'

const supabase = createClient()

interface BattleParticipant {
  id: string
  battle_id: string
  user_id: string | null
  is_bot: boolean
  bot_name: string | null
  bot_avatar_url: string | null
  position: number
  team: number
  total_value: number
  username?: string | null
  avatar_url?: string | null
}

interface BattleBox {
  battle_id: string
  loot_box_id: string
  quantity: number
  order_position: number
  cost_per_box: number
  box_name: string
  box_image: string
  price_virtual: number
}

interface Battle {
  id: string
  name: string
  mode: string
  max_players: number
  entry_cost: number
  total_prize: number
  status: string
  is_private: boolean
  total_boxes: number
  current_box: number
  created_at: string
  expires_at: string | null
  participant_count: number
  participants: BattleParticipant[]
  battle_boxes: BattleBox[]
}

const MODE_CONFIGS = {
  classic: { icon: Crown, label: 'Classic', color: 'text-blue-500', darkColor: 'dark:text-blue-400' },
  crazy: { icon: Zap, label: 'Crazy', color: 'text-purple-500', darkColor: 'dark:text-purple-400' },
  shared: { icon: Users, label: 'Shared', color: 'text-green-500', darkColor: 'dark:text-green-400' },
  fast: { icon: Trophy, label: 'Fast', color: 'text-orange-500', darkColor: 'dark:text-orange-400' },
  jackpot: { icon: Target, label: 'Jackpot', color: 'text-yellow-500', darkColor: 'dark:text-yellow-400' },
  terminal: { icon: Star, label: 'Terminal', color: 'text-red-500', darkColor: 'dark:text-red-400' },
  clutch: { icon: Shield, label: 'Clutch', color: 'text-pink-500', darkColor: 'dark:text-pink-400' }
}

const getHexagonPoints = (x: number, y: number, size: number) => {
  const round = (n: number) => Math.round(n * 100) / 100
  const angles = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3]
  return angles.map(angle => ({
    x: round(x + size * Math.cos(angle)),
    y: round(y + size * Math.sin(angle))
  }))
}

function HexagonGrid({ mouseX, mouseY, theme, isJoinable, buttonType = 'default', size = 12 }: {
  mouseX: number
  mouseY: number
  theme: 'light' | 'dark'
  isJoinable: boolean
  buttonType?: 'default' | 'create'
  size?: number
}) {
  const hexSize = size
  const hexHeight = hexSize * 1.732050808
  const cols = Math.ceil(200 / (hexSize * 1.5))
  const rows = Math.ceil(80 / hexHeight)

  const hexagons = useMemo(() => {
    const round = (n: number) => Math.round(n * 100) / 100
    const result = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = round(col * hexSize * 1.5)
        const y = round(row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0))
        const points = getHexagonPoints(x, y, hexSize)
        result.push({ x, y, points, key: `${row}-${col}` })
      }
    }
    return result
  }, [cols, rows, hexSize, hexHeight])

  const hexagonsWithScale = useMemo(() => {
    const round = (n: number) => Math.round(n * 100) / 100
    return hexagons.map(hex => {
      const dx = mouseX - hex.x
      const dy = mouseY - hex.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = 40
      const scale = round(distance < maxDistance
        ? 1 - (maxDistance - distance) / maxDistance * 0.3
        : 1)
      return { ...hex, scale }
    })
  }, [hexagons, mouseX, mouseY])

  const strokeColor = 'rgba(255, 255, 255, 0.25)'
  const fillColor = 'rgba(255, 255, 255, 0.05)'

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {hexagonsWithScale.map(hex => {
        const round = (n: number) => Math.round(n * 100) / 100
        return (
          <polygon
            key={hex.key}
            points={hex.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="0.3"
            style={{
              transform: `scale(${round(hex.scale)})`,
              transformOrigin: `${round(hex.x)}px ${round(hex.y)}px`,
              transition: 'transform 0.2s ease-out'
            }}
          />
        )
      })}
    </svg>
  )
}

function getPowerLevel(entryCost: number) {
  if (entryCost < 100) return { level: 'WEAK', color: '#22c55e' }
  if (entryCost < 300) return { level: 'MEDIUM', color: '#3b82f6' }
  if (entryCost < 500) return { level: 'STRONG', color: '#a855f7' }
  if (entryCost < 800) return { level: 'EXTREME', color: '#f97316' }
  return { level: 'LEGENDARY', color: '#eab308' }
}

export default function BattlesPage() {
  const { resolvedTheme } = useTheme()
  const [battles, setBattles] = useState<Battle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc'>('date-desc')
  const [hiddenModes, setHiddenModes] = useState<Set<string>>(new Set())
  const [playerFilter, setPlayerFilter] = useState<number | null>(null)
  const [showReadyOnly, setShowReadyOnly] = useState(false)
  
  const [createButtonMouse, setCreateButtonMouse] = useState({ x: 0, y: 0 })
  const [createButtonHover, setCreateButtonHover] = useState(false)

  const handleCreateButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCreateButtonMouse({ x, y })
  }

  const [playerButtonMouse, setPlayerButtonMouse] = useState<{[key: number]: {x: number, y: number}}>({})
  const [playerButtonHover, setPlayerButtonHover] = useState<{[key: number]: boolean}>({})

  const handlePlayerButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>, count: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPlayerButtonMouse(prev => ({...prev, [count]: {x, y}}))
  }

  const loadBattles = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data: battlesData, error: battlesError } = await supabase
        .from('battles')
        .select(`
          id, name, mode, max_players, entry_cost, total_prize, 
          status, is_private, total_boxes, current_box, 
          created_at, expires_at
        `)
        .in('status', ['waiting', 'countdown', 'active'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (battlesError) throw battlesError

      if (!battlesData || battlesData.length === 0) {
        setBattles([])
        return
      }

      const battlesWithData = await Promise.all(
        battlesData.map(async (battle) => {
          const { data: participantsData } = await supabase
            .from('battle_participants')
            .select(`
              id, battle_id, user_id, is_bot, bot_name, bot_avatar_url, 
              position, team, total_value
            `)
            .eq('battle_id', battle.id)
            .order('position')

          const participants = await Promise.all(
            (participantsData || []).map(async (participant) => {
              if (!participant.is_bot && participant.user_id) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('username, avatar_url')
                  .eq('id', participant.user_id)
                  .single()

                return {
                  ...participant,
                  username: profile?.username,
                  avatar_url: profile?.avatar_url
                }
              }
              return participant
            })
          )

          const { data: boxesData } = await supabase
            .from('battle_boxes')
            .select(`
              battle_id, loot_box_id, quantity, order_position, cost_per_box,
              loot_boxes (name, image_url, price_virtual)
            `)
            .eq('battle_id', battle.id)
            .order('order_position')

          const battle_boxes = (boxesData || []).map((box: any) => {
            const lootBox = Array.isArray(box.loot_boxes) ? box.loot_boxes[0] : box.loot_boxes
            return {
              ...box,
              box_name: lootBox?.name || '',
              box_image: lootBox?.image_url || '',
              price_virtual: parseFloat(lootBox?.price_virtual || '0')
            }
          })

          return {
            ...battle,
            participant_count: participants.length,
            participants,
            battle_boxes
          }
        })
      )

      setBattles(battlesWithData)

    } catch (err) {
      console.error('Erreur chargement battles:', err)
      setError('Impossible de charger les battles')
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredAndSortedBattles = useMemo(() => {
    let filtered = battles.filter(battle => !hiddenModes.has(battle.mode))

    if (showReadyOnly) {
      filtered = filtered.filter(battle => 
        battle.status === 'waiting' && battle.participant_count < battle.max_players
      )
    }

    if (playerFilter !== null) {
      filtered = filtered.filter(battle => battle.max_players === playerFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'price-desc':
          return b.entry_cost - a.entry_cost
        case 'price-asc':
          return a.entry_cost - b.entry_cost
        default:
          return 0
      }
    })

    return filtered
  }, [battles, sortBy, hiddenModes, playerFilter, showReadyOnly])

  const toggleModeVisibility = (mode: string) => {
    setHiddenModes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(mode)) {
        newSet.delete(mode)
      } else {
        newSet.add(mode)
      }
      return newSet
    })
  }

  const topBattles = useMemo(() => {
    return [...battles]
      .sort((a, b) => b.entry_cost - a.entry_cost)
      .slice(0, 5)
      .map(battle => {
        const power = getPowerLevel(battle.entry_cost)
        return {
          name: battle.name || `Battle ${battle.mode}`,
          power: Math.floor(battle.entry_cost / 10),
          level: power.level,
          color: power.color
        }
      })
  }, [battles])

  useEffect(() => {
    loadBattles()
  }, [loadBattles])

  return (
    <div className="min-h-screen bg-primary pt-28">

      <div className="w-full max-w-full mx-auto px-5 mb-7">
        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-primary">
                Batailles de Caisses
              </h1>
            </div>

            {/* LEADERBOARD TOP BATTLES */}
            <motion.div
              className="card-glass relative p-4 rounded-xl border-2 border-primary/20 overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xl">🏆</div>
                <div>
                  <h3 className="text-xs font-bold text-white">TOP BATTLES</h3>
                  <p className="text-[9px] text-white/60">Legendary creators</p>
                </div>
              </div>

              <div className="flex gap-2">
                {topBattles.slice(0, 3).map((battle, i) => (
                  <motion.div
                    key={i}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/10 border border-white/20"
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                      style={{
                        background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                    i === 1 ? 'linear-gradient(135deg, #d1d5db, #9ca3af)' :
                                    'linear-gradient(135deg, #fca5a5, #dc2626)',
                        color: '#000'
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="text-[10px] font-bold text-white truncate w-16 text-center">
                      {battle.name.slice(0, 8)}
                    </div>
                    <div className="text-xs font-black" style={{ color: battle.color }}>
                      {battle.power}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/battles/create'}
              onMouseMove={handleCreateButtonMouseMove}
              onMouseEnter={() => setCreateButtonHover(true)}
              onMouseLeave={() => setCreateButtonHover(false)}
              className="btn-primary relative px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 overflow-hidden"
            >
              <HexagonGrid 
                mouseX={createButtonHover ? createButtonMouse.x : -100}
                mouseY={createButtonHover ? createButtonMouse.y : -100}
                theme={resolvedTheme}
                isJoinable={true}
                buttonType="create"
              />
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Créer Battle</span>
            </button>

            <button
              onClick={() => setShowReadyOnly(!showReadyOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showReadyOnly
                  ? 'btn-success'
                  : 'btn-secondary'
              }`}
            >
              {showReadyOnly ? 'Prêt à rejoindre' : 'Toutes'}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field px-4 py-2 rounded-lg text-sm font-medium transition-all border focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="date-desc">Plus récent</option>
              <option value="date-asc">Plus ancien</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="price-asc">Prix croissant</option>
            </select>

            <button
              onClick={loadBattles}
              disabled={loading}
              className="p-2 rounded-lg transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-secondary">
            Players
          </span>
          {[2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              onClick={() => setPlayerFilter(playerFilter === count ? null : count)}
              onMouseMove={(e) => handlePlayerButtonMouseMove(e, count)}
              onMouseEnter={() => setPlayerButtonHover(prev => ({...prev, [count]: true}))}
              onMouseLeave={() => setPlayerButtonHover(prev => ({...prev, [count]: false}))}
              className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all overflow-hidden"
              style={{
                background: playerFilter === count
                  ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.9))'
                  : resolvedTheme === 'dark'
                  ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.6), rgba(31, 41, 55, 0.6))'
                  : 'linear-gradient(135deg, rgba(229, 231, 235, 0.8), rgba(209, 213, 219, 0.8))',
                backdropFilter: 'blur(12px)',
                border: playerFilter === count
                  ? '1px solid rgba(255, 255, 255, 0.3)'
                  : resolvedTheme === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: playerFilter === count
                  ? '0 4px 16px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : resolvedTheme === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                color: playerFilter === count ? 'white' : resolvedTheme === 'dark' ? '#d1d5db' : '#374151'
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                  background: playerButtonHover[count]
                    ? `radial-gradient(circle at ${playerButtonMouse[count]?.x || 50}px ${playerButtonMouse[count]?.y || 50}px, rgba(255, 255, 255, 0.3), transparent 60%)`
                    : 'transparent',
                  opacity: playerButtonHover[count] ? 1 : 0
                }}
              />
              
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
                  opacity: 0.5
                }}
              />
              
              <span className="relative z-10">{count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {Object.entries(MODE_CONFIGS).map(([mode, config]) => {
            const Icon = config.icon
            const isActive = !hiddenModes.has(mode)
            
            return (
              <button
                key={mode}
                onClick={() => toggleModeVisibility(mode)}
                className="relative flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 card-glass"
              >
                <Icon className={`w-4 h-4 ${config.color} ${config.darkColor}`} />
                <span className="text-primary">
                  {config.label}
                </span>
                
                <div className={`relative w-9 h-5 rounded-full transition-all ${
                  isActive ? 'bg-success' : 'bg-muted'
                }`}>
                  <motion.div
                    animate={{ x: isActive ? 16 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 w-4 h-4 rounded-full shadow-md ${
                      isActive ? 'bg-white' : 'bg-muted-dark'
                    }`}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full max-w-full mx-auto px-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-accent" />
              <span className="text-secondary">
                Chargement des battles...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-error p-4 rounded-lg border">
            <div className="font-medium">Erreur</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4 pb-8">
            {filteredAndSortedBattles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-secondary">
                  <Trophy className="w-8 h-8 text-muted" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-primary">
                  Aucune battle disponible
                </h3>
                <p className="text-secondary">
                  Soyez le premier à créer une battle !
                </p>
              </div>
            ) : (
              filteredAndSortedBattles.map((battle, index) => (
                <MinimalBattleCard
                  key={battle.id}
                  battle={battle}
                  index={index}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MinimalBattleCard({ battle, index }: {
  battle: Battle
  index: number
}) {
  const modeConfig = MODE_CONFIGS[battle.mode as keyof typeof MODE_CONFIGS] || MODE_CONFIGS.classic
  const ModeIcon = modeConfig.icon
  const emptySlots = battle.max_players - battle.participants.length
  const powerLevel = getPowerLevel(battle.entry_cost)
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePosition({ x, y })
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onClick={() => window.location.href = `/battles/${battle.id}?spectate=true`}
      className="card-hover relative rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border-2 border-primary/30"
    >
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ['0% 0%', '200% 200%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%)',
          backgroundSize: '200% 200%'
        }}
      />

      <div className="relative z-10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-xl card-glass"
            >
              <ModeIcon className={`w-8 h-8 ${modeConfig.color} ${modeConfig.darkColor}`} />
            </div>
            
            {/* POWER LEVEL */}
            <motion.div
              className="px-3 py-1 rounded-full text-[10px] font-black border"
              animate={{
                boxShadow: [
                  `0 0 10px ${powerLevel.color}40`,
                  `0 0 20px ${powerLevel.color}60`,
                  `0 0 10px ${powerLevel.color}40`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: `${powerLevel.color}20`,
                borderColor: `${powerLevel.color}50`,
                color: powerLevel.color
              }}
            >
              {powerLevel.level}
            </motion.div>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px]">
            <div className="text-sm font-medium text-secondary">
              {modeConfig.label}
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-warning" />
              <span className="text-2xl font-bold text-success">
                {Math.floor(battle.entry_cost * 100)}
              </span>
            </div>
            <div className="text-xs text-secondary">
              {battle.total_boxes} boxes à ouvrir
            </div>
          </div>

          <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

          <div className="flex items-center gap-2">
            {battle.participants.map((p) => (
              <div key={p.id} className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden shadow-md hover:scale-110 transition-transform border-2 border-primary/40">
                  {p.is_bot ? (
                    <div className="w-full h-full flex items-center justify-center bg-accent">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                  ) : (
                    <img 
                      src={p.avatar_url || '/default-avatar.png'} 
                      alt={p.username || 'Player'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/default-avatar.png'
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
            
            {Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-14 h-14 rounded-full border-2 border-dashed border-primary/30 bg-secondary flex items-center justify-center transition-all hover:scale-105"
              >
                <span className="text-2xl font-light text-muted">
                  +
                </span>
              </div>
            ))}
          </div>

          <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

          <div className="flex items-center gap-2 flex-1">
            {battle.battle_boxes.map((box, idx) => {
              const isOpened = idx < (battle.current_box || 0)
              return (
                <div key={box.loot_box_id} className="relative group/box">
                  <img 
                    src={box.box_image || '/mystery-box.png'} 
                    alt={box.box_name} 
                    className={`w-24 h-24 object-contain transition-all ${
                      isOpened ? 'opacity-30 grayscale' : 'opacity-100 group-hover/box:scale-110'
                    }`}
                    style={{
                      filter: isOpened ? undefined : 'drop-shadow(0 2px 8px rgba(148, 163, 184, 0.4))'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/mystery-box.png'
                    }}
                  />
                  {box.quantity > 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-surface">
                      {box.quantity}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <motion.button
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = `/battles/${battle.id}?spectate=true`
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`relative px-6 py-4 rounded-xl font-bold text-sm min-w-[120px] overflow-hidden text-white transition-all ${
              battle.participant_count < battle.max_players ? 'btn-success' : 'btn-primary'
            }`}
          >
            <HexagonGrid
              mouseX={isHovering ? mousePosition.x : -100}
              mouseY={isHovering ? mousePosition.y : -100}
              theme={'dark'}
              isJoinable={battle.participant_count < battle.max_players}
              buttonType="default"
            />
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              {battle.participant_count < battle.max_players ? (
                <>
                  <Users className="w-5 h-5" />
                  <span>Rejoindre</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Regarder</span>
                </>
              )}
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}