'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, X, Search, Heart, Crown, Zap, Shield, Users,
  Target, Star, AlertCircle
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

// Type definitions
interface LootBox {
  id: string
  name: string
  image_url: string
  price_virtual: string
  is_daily_free: boolean
  quantity?: number
}

interface User {
  id: string
  email?: string
  username?: string
  virtual_currency: string
  level?: number
}

const GAME_MODES = [
  { id: 'classic', name: 'Classic', icon: Crown },
  { id: 'crazy', name: 'Crazy', icon: Zap },
  { id: 'shared', name: 'Shared', icon: Users },
  { id: 'fast', name: 'Fast', icon: Star, isModifier: true },
  { id: 'jackpot', name: 'Jackpot', icon: Target, isModifier: true },
  { id: 'terminal', name: 'Terminal', icon: Star },
  { id: 'clutch', name: 'Clutch', icon: Shield }
]

const MODE_DESCRIPTIONS: { [key: string]: { title: string; description: string } } = {
  classic: {
    title: 'Mode Classic',
    description: 'Le joueur ou l\'équipe ayant accumulé la plus grande valeur totale remporte la victoire. Chaque item ouvert compte dans le score final.'
  },
  crazy: {
    title: 'Mode Crazy',
    description: 'L\'inverse du mode Classic ! Le joueur ou l\'équipe avec la plus petite valeur totale gagne. Faites attention à ne pas gagner d\'items trop chers.'
  },
  shared: {
    title: 'Mode Shared',
    description: 'Tous les joueurs collaborent ensemble. À la fin de la partie, les gains sont équitablement partagés entre tous les participants.'
  },
  fast: {
    title: 'Modificateur Fast',
    description: 'Accélère considérablement l\'ouverture des cases. Parfait pour des parties rapides et intenses !'
  },
  jackpot: {
    title: 'Modificateur Jackpot',
    description: 'La victoire se joue à la roulette ! Vos chances de gagner sont proportionnelles à la valeur de vos items. Plus vous gagnez de valeur, plus vous avez de chances de remporter le jackpot final.'
  },
  terminal: {
    title: 'Mode Terminal',
    description: 'Seule la dernière case compte ! Le joueur ou l\'équipe qui obtient l\'item le plus cher dans la toute dernière case remporte l\'intégralité des gains.'
  },
  clutch: {
    title: 'Mode Clutch',
    description: 'Le joueur ou l\'équipe ayant obtenu l\'item individuel le plus cher durant toute la partie remporte la victoire, peu importe la valeur totale.'
  }
}

const MAX_BOXES = 100

function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <img 
      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
      alt="Coins" 
      className="inline-block ml-1"
      style={{ 
        width: `${30}px`, 
        height: `${30}px`,
        verticalAlign: 'middle'
      }}
    />
  )
}

function ErrorNotification({ message, onClose }: { message: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-6 right-6 z-[100] bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-red-600 max-w-md"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-lg mb-1">Limite atteinte !</div>
          <div className="text-sm text-red-100">{message}</div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-red-600 rounded-lg p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

function HexagonGrid({ mouseX, mouseY, isActive, fullWidth = false, width: customWidth }: {
  mouseX: number
  mouseY: number
  isActive: boolean
  fullWidth?: boolean
  width?: number
}) {
  const hexSize = 12
  const hexHeight = hexSize * Math.sqrt(3)
  const width = customWidth || (fullWidth ? 1200 : 200)
  const height = fullWidth ? 100 : 80
  const cols = Math.ceil(width / (hexSize * 1.5))
  const rows = Math.ceil(height / hexHeight)
  
  const hexagons = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexSize * 1.5
      const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0)
      
      const dx = mouseX - x
      const dy = mouseY - y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const maxDistance = 40
      const scale = distance < maxDistance 
        ? 1 - (maxDistance - distance) / maxDistance * 0.3
        : 1
      
      hexagons.push({ x, y, scale, key: `${row}-${col}` })
    }
  }
  
  const strokeColor = 'rgba(255, 255, 255, 0.25)'
  const fillColor = 'rgba(255, 255, 255, 0.05)'
  
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {hexagons.map(hex => {
        const round = (n: number) => Math.round(n * 100) / 100
        return (
          <polygon
            key={hex.key}
            points={`
              ${round(hex.x + hexSize * Math.cos(0))},${round(hex.y + hexSize * Math.sin(0))}
              ${round(hex.x + hexSize * Math.cos(Math.PI / 3))},${round(hex.y + hexSize * Math.sin(Math.PI / 3))}
              ${round(hex.x + hexSize * Math.cos(2 * Math.PI / 3))},${round(hex.y + hexSize * Math.sin(2 * Math.PI / 3))}
              ${round(hex.x + hexSize * Math.cos(Math.PI))},${round(hex.y + hexSize * Math.sin(Math.PI))}
              ${round(hex.x + hexSize * Math.cos(4 * Math.PI / 3))},${round(hex.y + hexSize * Math.sin(4 * Math.PI / 3))}
              ${round(hex.x + hexSize * Math.cos(5 * Math.PI / 3))},${round(hex.y + hexSize * Math.sin(5 * Math.PI / 3))}
            `}
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

function DecorativeHexagons() {
  // Générer les hexagones une seule fois
  const hexagons = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      initialX: 100 + Math.random() * 20,
      y: Math.random() * 100,
      size: 25 + Math.random() * 90,
      opacity: 0.06 + Math.random() * 0.12,
      duration: 20 + Math.random() * 40,
      delay: Math.random() * 10
    }))
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden">
      {hexagons.map((hex) => (
        <motion.div
          key={hex.id}
          className="absolute pointer-events-none"
          style={{
            top: `${hex.y}vh`,
            left: `${hex.initialX}vw`,
            width: `${hex.size}px`,
            height: `${hex.size}px`,
          }}
          animate={{ x: [`0vw`, `-${hex.initialX + 20}vw`] }}
          transition={{
            x: {
              duration: hex.duration,
              repeat: Infinity,
              ease: "linear",
              delay: hex.delay
            }
          }}
        >
          <svg 
            width={hex.size} 
            height={hex.size * 1.155} 
            viewBox={`0 0 ${hex.size} ${hex.size * 1.155}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: hex.opacity }}
          >
            <defs>
              <linearGradient id={`silverGlass-${hex.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(226, 232, 240, 0.4)', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: 'rgba(203, 213, 225, 0.25)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(148, 163, 184, 0.15)', stopOpacity: 1 }} />
              </linearGradient>
              
              <filter id={`glassEffect-${hex.id}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"/>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <polygon
              points={`
                ${hex.size/2},0
                ${hex.size},${hex.size * 0.289}
                ${hex.size},${hex.size * 0.866}
                ${hex.size/2},${hex.size * 1.155}
                0,${hex.size * 0.866}
                0,${hex.size * 0.289}
              `}
              fill={`url(#silverGlass-${hex.id})`}
              stroke="rgba(226, 232, 240, 0.3)"
              strokeWidth="1.5"
              filter={`url(#glassEffect-${hex.id})`}
            />
            
            <polygon
              points={`
                ${hex.size/2},${hex.size * 0.1}
                ${hex.size * 0.85},${hex.size * 0.35}
                ${hex.size * 0.7},${hex.size * 0.5}
                ${hex.size/2},${hex.size * 0.3}
              `}
              fill="rgba(255, 255, 255, 0.25)"
              filter={`url(#glassEffect-${hex.id})`}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

export default function BattleCreateConnected() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModes, setSelectedModes] = useState<string[]>(['classic'])
  const [teamConfig, setTeamConfig] = useState('1v1')
  const [selectedBoxes, setSelectedBoxes] = useState<LootBox[]>([])
  const [showCatalog, setShowCatalog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('price-low')
  const [favorites, setFavorites] = useState(new Set())
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [creating, setCreating] = useState(false)
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null)
  const [hoveredSort, setHoveredSort] = useState<string | null>(null)
  const [hoveredFavorite, setHoveredFavorite] = useState(false)
  const [errorNotification, setErrorNotification] = useState<string | null>(null)
  const [showLeaderboardInfo, setShowLeaderboardInfo] = useState(false)
  const [selectedModeInfo, setSelectedModeInfo] = useState<string | null>(null)
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)

  const [filterButtonMouse, setFilterButtonMouse] = useState<{[key: string]: {x: number, y: number}}>({})
  const [sortButtonMouse, setSortButtonMouse] = useState<{[key: string]: {x: number, y: number}}>({})
  const [favoriteButtonMouse, setFavoriteButtonMouse] = useState({ x: 0, y: 0 })
  const [footerMouse, setFooterMouse] = useState({ x: 0, y: 0 })
  const [footerHover, setFooterHover] = useState(false)
  const [doneButtonMouse, setDoneButtonMouse] = useState({ x: 0, y: 0 })
  const [doneButtonHover, setDoneButtonHover] = useState(false)

  // Générer les hexagones une seule fois au montage
  const backgroundHexagons = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${50 + Math.random() * 100}px`,
      height: `${50 + Math.random() * 100}px`,
      xMove: Math.random() * 200 - 100,
      yMove: Math.random() * 200 - 100,
      duration: 10 + Math.random() * 10,
    }))
  }, [])

  const handleFilterButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>, value: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setFilterButtonMouse(prev => ({...prev, [value]: {x, y}}))
  }

  const handleSortButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>, value: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setSortButtonMouse(prev => ({...prev, [value]: {x, y}}))
  }

  const handleFavoriteButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setFavoriteButtonMouse({ x, y })
  }

  const handleFooterMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setFooterMouse({ x, y })
  }

  const handleDoneButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDoneButtonMouse({ x, y })
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        setUser(profile)
      }

      const { data: boxes } = await supabase
        .from('loot_boxes')
        .select('*')
        .eq('is_daily_free', false)
        .order('price_virtual', { ascending: true })

      setLootBoxes(boxes || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalBoxes = useMemo(() => {
    return selectedBoxes.reduce((sum, box) => sum + (box.quantity || 0), 0)
  }, [selectedBoxes])

  const totalValue = useMemo(() => {
    return selectedBoxes.reduce((sum, box) => sum + (parseFloat(box.price_virtual) * (box.quantity || 0)), 0)
  }, [selectedBoxes])

  const maxPlayers = useMemo(() => {
    if (selectedModes.includes('shared')) {
      // Pour shared, teamConfig est directement le nombre de joueurs (2, 3, 4, 5 ou 6)
      return parseInt(teamConfig) || 2
    }
    const match = teamConfig.match(/\d+/g)
    return match ? match.reduce((sum, n) => sum + parseInt(n), 0) : 2
  }, [selectedModes, teamConfig])

  const teamOptions = useMemo(() => {
    if (selectedModes.includes('shared')) {
      // Pour shared, simple sélecteur du nombre de joueurs (2 à 6)
      return ['2', '3', '4', '5', '6']
    }
    return ['1v1', '2v2', '3v3', '1v1v1', '1v1v1v1']
  }, [selectedModes])

  const toggleMode = useCallback((modeId: string) => {
    const mode = GAME_MODES.find(m => m.id === modeId)
    
    setSelectedModes(prev => {
      let newModes = [...prev]
      
      if (mode?.isModifier) {
        // Jackpot ne peut pas être combiné avec shared, clutch ou terminal
        if (modeId === 'jackpot' && (prev.includes('shared') || prev.includes('clutch') || prev.includes('terminal'))) {
          return prev
        }
        
        // Clutch et Terminal ne peuvent pas être combinés avec jackpot
        if ((modeId === 'clutch' || modeId === 'terminal') && prev.includes('jackpot')) {
          return prev
        }
        
        if (prev.includes(modeId)) {
          newModes = newModes.filter(m => m !== modeId)
        } else {
          newModes.push(modeId)
        }
      } else {
        const baseModes = ['classic', 'crazy', 'shared', 'terminal', 'clutch']
        newModes = newModes.filter(m => !baseModes.includes(m))
        newModes.push(modeId)
        
        // Si on active shared, clutch ou terminal, on retire jackpot
        if (modeId === 'shared' || modeId === 'clutch' || modeId === 'terminal') {
          newModes = newModes.filter(m => m !== 'jackpot')
        }
        
        if (modeId === 'shared') {
          setTeamConfig('2')  // Commence à 2 joueurs pour shared
        } else {
          setTeamConfig('1v1')
        }
      }
      
      const hasBaseMode = newModes.some(m => 
        ['classic', 'crazy', 'shared', 'terminal', 'clutch'].includes(m)
      )
      if (!hasBaseMode) {
        newModes.push('classic')
      }
      
      return newModes
    })
  }, [])

  const canCreate = selectedBoxes.length > 0 && user && totalValue <= parseFloat(user?.virtual_currency || '0')

  const addBox = useCallback((box: LootBox) => {
    const existing = selectedBoxes.find(b => b.id === box.id)
    const currentTotal = totalBoxes
    
    if (currentTotal >= MAX_BOXES) {
      setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`)
      return
    }
    
    if (existing) {
      setSelectedBoxes(prev => prev.map(b =>
        b.id === box.id ? { ...b, quantity: (b.quantity || 0) + 1 } : b
      ))
    } else {
      setSelectedBoxes(prev => [...prev, { ...box, quantity: 1 }])
    }
  }, [selectedBoxes, totalBoxes])

  const removeBox = useCallback((boxId: string) => {
    setSelectedBoxes(prev => prev.filter(box => box.id !== boxId))
  }, [])

  const updateQuantity = useCallback((boxId: string, delta: number) => {
    const currentTotal = totalBoxes
    
    if (delta > 0 && currentTotal >= MAX_BOXES) {
      setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`)
      return
    }
    
    setSelectedBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        const newQty = (box.quantity || 0) + delta
        return newQty > 0 ? { ...box, quantity: newQty } : box
      }
      return box
    }).filter(box => (box.quantity || 0) > 0))
  }, [totalBoxes])

  const setBoxQuantity = useCallback((boxId: string, newQty: number) => {
    if (newQty < 1) {
      removeBox(boxId)
      return
    }
    
    const totalWithoutBox = selectedBoxes
      .filter(b => b.id !== boxId)
      .reduce((sum, box) => sum + (box.quantity || 0), 0)
    
    if (totalWithoutBox + newQty > MAX_BOXES) {
      setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`)
      return
    }
    
    setSelectedBoxes(prev => prev.map(box => 
      box.id === boxId ? { ...box, quantity: newQty } : box
    ))
  }, [selectedBoxes, removeBox])

  const toggleFavorite = useCallback((boxId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(boxId)) {
        newFavorites.delete(boxId)
      } else {
        newFavorites.add(boxId)
      }
      return newFavorites
    })
  }, [])

  const filteredBoxes = useMemo(() => {
    let filtered = lootBoxes.filter(box => 
      box.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (showOnlyFavorites) {
      filtered = filtered.filter(box => favorites.has(box.id))
    }

    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number)
      filtered = filtered.filter(box => {
        const price = parseFloat(box.price_virtual)
        return price >= min && price <= max
      })
    }

    return filtered.sort((a, b) => {
      const priceA = parseFloat(a.price_virtual)
      const priceB = parseFloat(b.price_virtual)
      if (sortBy === 'price-low') return priceA - priceB
      if (sortBy === 'price-high') return priceB - priceA
      return 0
    })
  }, [lootBoxes, searchTerm, priceFilter, sortBy, showOnlyFavorites, favorites])

  const createBattle = async (withBots = false) => {
    if (!canCreate || creating) return
    
    if (totalBoxes > MAX_BOXES) {
      setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`)
      return
    }
    
    setCreating(true)
    try {
      const entryCost = Math.floor(totalValue)
      const battleBoxesData = selectedBoxes.map((box, index) => ({
        loot_box_id: box.id,
        quantity: box.quantity || 1,
        order_position: index + 1,
        cost_per_box: Math.floor(parseFloat(box.price_virtual))
      }))

      const baseMode = selectedModes.find(m => 
        ['classic', 'crazy', 'shared', 'terminal', 'clutch'].includes(m)
      ) || 'classic'
      
      const modeNames = selectedModes.map(m => 
        m.charAt(0).toUpperCase() + m.slice(1)
      ).join(' + ')

      const { data: battle, error: battleError } = await supabase
        .from('battles')
        .insert({
          name: `Battle ${modeNames}`,
          mode: baseMode,
          max_players: maxPlayers,
          entry_cost: entryCost,
          total_prize: entryCost * maxPlayers,
          status: 'waiting',
          creator_id: user.id,
          total_boxes: totalBoxes,
          has_bots: withBots,
          bots_count: withBots ? maxPlayers - 1 : 0,
          player_distribution: teamConfig
        })
        .select()
        .single()

      if (battleError) throw battleError

      const boxesWithBattleId = battleBoxesData.map(box => ({
        ...box,
        battle_id: battle.id
      }))

      const { error: boxesError } = await supabase
        .from('battle_boxes')
        .insert(boxesWithBattleId)

      if (boxesError) throw boxesError

      const { error: participantError } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: battle.id,
          user_id: user.id,
          position: 1,
          team: (teamConfig === '2v2' || teamConfig === '3v3') ? 1 : null,  // Team A = 1 pour modes équipe
          is_ready: true,
          has_paid: true
        })

      if (participantError) throw participantError

      if (withBots) {
        const isTeamMode = teamConfig === '2v2' || teamConfig === '3v3'
        const botParticipants = Array.from({ length: maxPlayers - 1 }, (_, i) => {
          const position = i + 2
          // Pour les modes équipe : assigner team 1 ou 2 selon la position
          // Position 1-2 → team 1, Position 3-4 → team 2 (pour 2v2)
          // Position 1-3 → team 1, Position 4-6 → team 2 (pour 3v3)
          const team = isTeamMode 
            ? (position <= Math.ceil(maxPlayers / 2) ? 1 : 2)
            : null
          
          return {
            battle_id: battle.id,
            is_bot: true,
            bot_name: `Bot ${i + 1}`,
            position: position,
            team: team,
            is_ready: true,
            has_paid: true
          }
        })

        const { error: botsError } = await supabase
          .from('battle_participants')
          .insert(botParticipants)

        if (botsError) throw botsError
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          virtual_currency: (parseFloat(user.virtual_currency) - totalValue).toString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'battle_entry',
          virtual_amount: -entryCost,
          battle_id: battle.id,
          description: `Battle entry: ${battle.name}`
        })

      window.location.href = `/battles/${battle.id}`
      
    } catch (error) {
      console.error('Error creating battle:', error)
      alert('Failed to create battle. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 text-white pt-20 relative overflow-hidden">
      <DecorativeHexagons />
      <div className="fixed inset-0 bg-gradient-radial from-transparent via-blue-400/5 to-transparent pointer-events-none" />
      
      {/* Animation hexagones en arrière-plan */}
      <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        {backgroundHexagons.map((hex) => (
          <motion.div
            key={hex.id}
            className="absolute"
            style={{
              left: hex.left,
              top: hex.top,
              width: hex.width,
              height: hex.height,
            }}
            animate={{
              x: [0, hex.xMove],
              y: [0, hex.yMove],
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: hex.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon
                points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
              />
            </svg>
          </motion.div>
        ))}
      </div>

      <div className="border-b border-white/10 bg-white/5 backdrop-blur-md px-3 sm:px-4 md:px-6 py-2 sm:py-3 relative z-10">
        <div className="max-w-[1800px] mx-auto ml-0 sm:ml-20 md:ml-40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Create Case Battle</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-[10px] sm:text-xs">
                <span className="text-blue-200">Total Boxes:</span>
                <span className={`ml-1.5 font-bold ${totalBoxes > MAX_BOXES ? 'text-red-400' : 'text-white'}`}>
                  {totalBoxes} / {MAX_BOXES}
                </span>
              </div>
              <div className="text-[10px] sm:text-xs flex items-center">
                <span className="text-blue-200">Total Value:</span>
                <span className="ml-1.5 text-white font-bold flex items-center">
                  {totalValue.toFixed(2)}
                  <CoinIcon size={14} />
                </span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-white/20"></div>
              
              <button 
                onClick={() => createBattle(false)}
                disabled={!canCreate || creating || totalBoxes > MAX_BOXES}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  canCreate && !creating && totalBoxes <= MAX_BOXES
                    ? 'bg-white/20 hover:bg-white/30 text-white shadow-lg backdrop-blur-sm border border-white/30'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                }`}
              >
                {creating ? 'CREATING...' : (
                  <>
                    CREATE - {totalValue.toFixed(2)}
                    <CoinIcon size={12} />
                  </>
                )}
              </button>
              
              <button 
                onClick={() => createBattle(true)}
                disabled={!canCreate || creating || totalBoxes > MAX_BOXES}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                  canCreate && !creating && totalBoxes <= MAX_BOXES
                    ? 'bg-gradient-to-r from-green-500/80 to-green-600/80 hover:from-green-600/90 hover:to-green-700/90 text-white shadow-lg backdrop-blur-sm border border-white/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                }`}
              >
                {creating ? 'CREATING...' : (
                  <>
                    VS BOTS - {totalValue.toFixed(2)}
                    <CoinIcon size={12} />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex flex-wrap items-center gap-2 ml-2 sm:ml-4 md:ml-8">
              {GAME_MODES.map(mode => {
                const Icon = mode.icon
                const isActive = selectedModes.includes(mode.id)
                const isDisabled = (mode.id === 'jackpot' && (selectedModes.includes('shared') || selectedModes.includes('clutch') || selectedModes.includes('terminal'))) ||
                                   ((mode.id === 'clutch' || mode.id === 'terminal') && selectedModes.includes('jackpot'))
                
                return (
                  <button
                    key={mode.id}
                    onClick={() => toggleMode(mode.id)}
                    onMouseEnter={() => setHoveredMode(mode.id)}
                    onMouseLeave={() => setHoveredMode(null)}
                    disabled={isDisabled}
                    className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs group ${
                      isDisabled 
                        ? 'opacity-30 cursor-not-allowed'
                        : isActive
                        ? 'bg-white/20 border border-white/40'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${
                      mode.id === 'classic' ? 'text-blue-300' :
                      mode.id === 'crazy' ? 'text-purple-300' :
                      mode.id === 'shared' ? 'text-green-300' :
                      mode.id === 'fast' ? 'text-orange-300' :
                      mode.id === 'jackpot' ? 'text-yellow-300' :
                      mode.id === 'terminal' ? 'text-red-300' :
                      'text-pink-300'
                    }`} />
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                      {mode.name}
                    </span>
                    
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 bg-green-400 rounded-full"
                      />
                    )}

                    {mode.isModifier && (
                      <span className="text-[9px] px-1 py-0.5 bg-blue-500/80 text-white rounded font-bold">
                        MOD
                      </span>
                    )}

                    {hoveredMode === mode.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedModeInfo(selectedModeInfo === mode.id ? null : mode.id)
                        }}
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-white/70 hover:text-white transition-colors cursor-pointer z-10"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              {selectedModes.includes('shared') ? (
                // Pour SHARED : simple sélecteur de joueurs
                <>
                  <span className="text-[10px] text-blue-200 font-medium">PLAYERS</span>
                  {teamOptions.map(option => {
                    const isSelected = teamConfig === option
                    const displayText = `${option} joueurs`
                    
                    return (
                      <button
                        key={option}
                        onClick={() => setTeamConfig(option)}
                        className={`relative px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                          isSelected
                            ? 'bg-white/25 text-white border-2 border-white/40 shadow-lg scale-105'
                            : 'bg-white/10 text-white/70 border-2 border-white/20 hover:bg-white/15 hover:border-white/30'
                        }`}
                      >
                        <div className={`absolute inset-0 rounded-lg transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0'
                        }`} style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)'
                        }} />
                        
                        <span className="relative z-10">{displayText}</span>
                        
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-blue-600"
                          />
                        )}
                      </button>
                    )
                  })}
                </>
              ) : (
                // Pour les AUTRES modes : séparer PLAYER et ÉQUIPE
                <>
                  {/* Section PLAYER */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-blue-200 font-medium">PLAYER</span>
                    {['1v1', '1v1v1', '1v1v1v1'].map(option => {
                      const isSelected = teamConfig === option
                      return (
                        <button
                          key={option}
                          onClick={() => setTeamConfig(option)}
                          className={`relative px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            isSelected
                              ? 'bg-white/25 text-white border-2 border-white/40 shadow-lg scale-105'
                              : 'bg-white/10 text-white/70 border-2 border-white/20 hover:bg-white/15 hover:border-white/30'
                          }`}
                        >
                          <div className={`absolute inset-0 rounded-lg transition-opacity ${
                            isSelected ? 'opacity-100' : 'opacity-0'
                          }`} style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)'
                          }} />
                          
                          <span className="relative z-10">{option}</span>
                          
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-blue-600"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Section ÉQUIPE */}
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-[10px] text-blue-200 font-medium">ÉQUIPE</span>
                    {['2v2', '3v3'].map(option => {
                      const isSelected = teamConfig === option
                      return (
                        <button
                          key={option}
                          onClick={() => setTeamConfig(option)}
                          className={`relative px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            isSelected
                              ? 'bg-white/25 text-white border-2 border-white/40 shadow-lg scale-105'
                              : 'bg-white/10 text-white/70 border-2 border-white/20 hover:bg-white/15 hover:border-white/30'
                          }`}
                        >
                          <div className={`absolute inset-0 rounded-lg transition-opacity ${
                            isSelected ? 'opacity-100' : 'opacity-0'
                          }`} style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)'
                          }} />
                          
                          <span className="relative z-10">{option}</span>
                          
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-blue-600"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENEUR EXPLICATIF DES MODES */}
      <AnimatePresence>
        {selectedModeInfo && (() => {
          const mode = GAME_MODES.find(m => m.id === selectedModeInfo)
          const modeInfo = MODE_DESCRIPTIONS[selectedModeInfo]
          if (!mode || !modeInfo) return null
          
          const Icon = mode.icon
          const colorClasses = {
            classic: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-400/30', icon: 'bg-blue-500/30', iconColor: 'text-blue-300' },
            crazy: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-400/30', icon: 'bg-purple-500/30', iconColor: 'text-purple-300' },
            shared: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-400/30', icon: 'bg-green-500/30', iconColor: 'text-green-300' },
            fast: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-400/30', icon: 'bg-orange-500/30', iconColor: 'text-orange-300' },
            jackpot: { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-400/30', icon: 'bg-yellow-500/30', iconColor: 'text-yellow-300' },
            terminal: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-400/30', icon: 'bg-red-500/30', iconColor: 'text-red-300' },
            clutch: { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-400/30', icon: 'bg-pink-500/30', iconColor: 'text-pink-300' }
          }
          const colors = colorClasses[selectedModeInfo as keyof typeof colorClasses]
          
          return (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 relative z-10">
                <div className={`bg-gradient-to-r ${colors.bg} rounded-xl p-4 border ${colors.border} backdrop-blur-sm`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full ${colors.icon} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white mb-1">{modeInfo.title}</h3>
                      <p className="text-xs text-white/80">
                        {modeInfo.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedModeInfo(null)}
                      className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>


      <div className="ml-0 sm:ml-16 md:ml-24 lg:ml-36 max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          <button
            onClick={() => setShowCatalog(true)}
            className="aspect-square bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-blue-300 rounded-xl flex flex-col items-center justify-center transition-all group"
          >
            <Plus className="w-8 h-8 text-white/40 group-hover:text-blue-300 mb-2" />
            <span className="text-[10px] sm:text-xs text-white/40 group-hover:text-blue-300 font-bold">Add Box</span>
          </button>

          {selectedBoxes.map((box) => (
            <div key={box.id} className="aspect-square bg-white/5 rounded-xl p-2 sm:p-3 flex flex-col relative group border border-white/10 hover:border-blue-300 transition-colors">
              <button
                onClick={() => removeBox(box.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              <img src={box.image_url} alt={box.name} className="w-full h-20 object-contain mb-2" />
              
              <div className="mt-auto">
                <div className="text-[10px] sm:text-xs text-white font-medium mb-1 text-center truncate">{box.name}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-white font-bold text-xs sm:text-sm flex items-center">
                    {parseFloat(box.price_virtual).toFixed(2)}
                    <CoinIcon size={14} />
                  </span>
                </div>
                
                <div className="flex items-center justify-between bg-white/10 rounded px-2 py-1">
                  <button
                    onClick={() => updateQuantity(box.id, -1)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded text-white"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={MAX_BOXES}
                    value={box.quantity || 1}
                    onChange={(e) => setBoxQuantity(box.id, parseInt(e.target.value) || 1)}
                    className="w-12 text-center bg-transparent text-white font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQuantity(box.id, 1)}
                    className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showCatalog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCatalog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(17, 24, 39, 0.95) 50%, rgba(30, 58, 138, 0.95) 100%)'
              }}
            >
              <div className="p-3 sm:p-4 md:p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{lootBoxes.length} Cases Available</h2>
                  <button onClick={() => setShowCatalog(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 sm:w-6 h-5 sm:h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                    <input
                      type="text"
                      placeholder="Search case..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                    <div className="space-y-2 flex-1">
                      <span className="text-xs text-blue-200 font-medium text-center block">PRICE RANGE</span>
                      <div className="flex gap-2">
                        {[
                          { value: 'all', label: 'All' },
                          { value: '0-50', label: '0-50' },
                          { value: '50-100', label: '50-100' },
                          { value: '100-200', label: '100-200' },
                          { value: '200-999999', label: '200+' }
                        ].map(filter => {
                          const isActive = priceFilter === filter.value
                          const isHovered = hoveredFilter === filter.value

                          return (
                            <motion.button
                              key={filter.value}
                              onClick={() => setPriceFilter(filter.value)}
                              onMouseMove={(e) => handleFilterButtonMouseMove(e, filter.value)}
                              onMouseEnter={() => setHoveredFilter(filter.value)}
                              onMouseLeave={() => setHoveredFilter(null)}
                              whileHover={{ scale: 0.95 }}
                              whileTap={{ scale: 0.9 }}
                              className="relative flex-1 px-4 py-3 rounded-lg font-bold text-sm transition-all overflow-hidden text-white border flex items-center justify-center gap-1 h-[46px]"
                              style={{
                                background: isActive ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.9))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8))',
                                borderColor: isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              <HexagonGrid
                                mouseX={isHovered ? filterButtonMouse[filter.value]?.x || -100 : -100}
                                mouseY={isHovered ? filterButtonMouse[filter.value]?.y || -100 : -100}
                                isActive={isActive}
                              />
                              <span className="relative z-10 flex items-center gap-1 whitespace-nowrap">
                                {filter.label}
                                {filter.value !== 'all' && <CoinIcon size={12} />}
                              </span>
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                />
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="hidden sm:block h-16 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent self-center mt-6"></div>

                    <div className="space-y-2 flex-shrink-0">
                      <span className="text-xs text-blue-200 font-medium text-center block">FAVORITES</span>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                          onMouseMove={handleFavoriteButtonMouseMove}
                          onMouseEnter={() => setHoveredFavorite(true)}
                          onMouseLeave={() => setHoveredFavorite(false)}
                          whileHover={{ scale: 0.95 }}
                          whileTap={{ scale: 0.9 }}
                          className="relative px-5 py-3 rounded-lg font-bold text-sm transition-all overflow-hidden text-white border flex items-center justify-center gap-2"
                          style={{
                            background: showOnlyFavorites ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8))',
                            borderColor: showOnlyFavorites ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          <HexagonGrid
                            mouseX={hoveredFavorite ? favoriteButtonMouse.x : -100}
                            mouseY={hoveredFavorite ? favoriteButtonMouse.y : -100}
                            isActive={showOnlyFavorites}
                            width={200}
                          />
                          <Heart className={`relative z-10 w-5 h-5 ${showOnlyFavorites ? 'fill-white' : ''}`} />
                          {showOnlyFavorites && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    <div className="hidden sm:block h-16 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent self-center mt-6"></div>

                    <div className="space-y-2 flex-shrink-0">
                      <span className="text-xs text-blue-200 font-medium text-center block">SORT BY</span>
                      <div className="flex gap-2">
                        {[
                          { value: 'price-low', label: 'Low → High', icon: '↑' },
                          { value: 'price-high', label: 'High → Low', icon: '↓' }
                        ].map(sort => {
                          const isActive = sortBy === sort.value
                          const isHovered = hoveredSort === sort.value

                          return (
                            <motion.button
                              key={sort.value}
                              onClick={() => setSortBy(sort.value)}
                              onMouseMove={(e) => handleSortButtonMouseMove(e, sort.value)}
                              onMouseEnter={() => setHoveredSort(sort.value)}
                              onMouseLeave={() => setHoveredSort(null)}
                              whileHover={{ scale: 0.95 }}
                              whileTap={{ scale: 0.9 }}
                              className="relative flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all flex-1 overflow-hidden text-white border"
                              style={{
                                background: isActive ? 'linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.9))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8))',
                                borderColor: isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)'
                              }}
                            >
                              <HexagonGrid
                                mouseX={isHovered ? sortButtonMouse[sort.value]?.x || -100 : -100}
                                mouseY={isHovered ? sortButtonMouse[sort.value]?.y || -100 : -100}
                                isActive={isActive}
                                width={300}
                              />
                              <span className="relative z-10 text-lg sm:text-xl">{sort.icon}</span>
                              <span className="relative z-10 text-xs sm:text-sm">{sort.label}</span>
                              {isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                />
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 400px)' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                  {filteredBoxes.map((box) => {
                    const addedQty = selectedBoxes.find(b => b.id === box.id)?.quantity || 0
                    const isFavorite = favorites.has(box.id)

                    return (
                      <div key={box.id} className="bg-white/5 rounded-lg p-2 sm:p-3 md:p-4 hover:bg-white/10 transition-all relative group border border-white/10 hover:border-blue-300">
                        <button onClick={() => toggleFavorite(box.id)} className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded transition-colors z-10">
                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400 text-red-400' : 'text-white/40'}`} />
                        </button>

                        <img src={box.image_url} alt={box.name} className="w-full h-24 object-contain mb-3" />
                        <div className="text-[10px] sm:text-xs text-white font-medium mb-1 sm:mb-2 text-center truncate">{box.name}</div>
                        <div className="flex items-center justify-center gap-1 mb-3">
                          <span className="text-white font-bold flex items-center">
                            {parseFloat(box.price_virtual).toFixed(2)}
                            <CoinIcon size={14} />
                          </span>
                        </div>

                        {addedQty > 0 ? (
                          <div className="flex items-center justify-between bg-white/10 rounded px-2 py-1.5">
                            <button onClick={() => updateQuantity(box.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded text-white">−</button>
                            <input
                              type="number"
                              min="1"
                              max={MAX_BOXES}
                              value={addedQty}
                              onChange={(e) => setBoxQuantity(box.id, parseInt(e.target.value) || 1)}
                              className="w-10 text-center bg-transparent text-white font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => updateQuantity(box.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded text-white">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addBox(box)} className="w-full py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded text-sm">
                            ADD
                          </button>
                        )}

                        {addedQty > 0 && (
                          <div className="absolute -top-2 -left-2 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                            {addedQty}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div 
                className="p-6 relative overflow-hidden"
                onMouseMove={handleFooterMouseMove}
                onMouseEnter={() => setFooterHover(true)}
                onMouseLeave={() => setFooterHover(false)}
                style={{ background: 'linear-gradient(to bottom, rgba(30, 58, 138, 0.6) 0%, rgba(51, 65, 85, 0.5) 40%, rgba(71, 85, 105, 0.4) 100%)' }}
              >
                <HexagonGrid
                  mouseX={footerHover ? footerMouse.x : -100}
                  mouseY={footerHover ? footerMouse.y : -100}
                  isActive={false}
                  fullWidth={true}
                />
                
                <div className="flex flex-col sm:flex-row items-center justify-between relative z-10 gap-3 sm:gap-0">
                  <div className="text-xs sm:text-sm flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className={`font-bold ${totalBoxes > MAX_BOXES ? 'text-red-400' : 'text-blue-300'}`}>
                      {totalBoxes} / {MAX_BOXES} BOXES ADDED
                    </span>
                    <span className="text-white/40">|</span>
                    <span className="text-white font-bold">TOTAL VALUE</span>
                    <span className="text-white font-bold flex items-center">
                      {totalValue.toFixed(2)}
                      <CoinIcon size={16} />
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCatalog(false)}
                    onMouseMove={handleDoneButtonMouseMove}
                    onMouseEnter={() => setDoneButtonHover(true)}
                    onMouseLeave={() => setDoneButtonHover(false)}
                    className="relative px-8 py-3 rounded-lg font-bold transition-all overflow-hidden text-white border"
                    style={{
                      background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.9))',
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <HexagonGrid
                      mouseX={doneButtonHover ? doneButtonMouse.x : -100}
                      mouseY={doneButtonHover ? doneButtonMouse.y : -100}
                      isActive={true}
                    />
                    <span className="relative z-10">DONE</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorNotification && (
          <ErrorNotification message={errorNotification} onClose={() => setErrorNotification(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}