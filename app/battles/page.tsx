'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import PlayerHoverCard, { getAvatarFrameClasses } from '@/app/components/PlayerHoverCard'
// ParticlesBackground removed - using pure CSS background for better performance
import Footer from '@/app/components/Footer'
import {
  Users, Eye, Bot, Crown, Zap, Target, Star, Trophy,
  RefreshCw, Shield, Plus, ChevronDown, Check, LayoutGrid, LayoutList, X,
  Package, Swords, Play
} from 'lucide-react'
import { useBattleListSubscription } from '@/app/hooks/useBattleSubscription'

// Animated Counter Component - smooth count-up effect
function AnimatedCounter({ value, duration = 2, decimals = 0, prefix = '', suffix = '' }: {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
}) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals)
    }
    return Math.floor(latest).toLocaleString()
  })
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: [0.16, 1, 0.3, 1]
    })

    const unsubscribe = rounded.on('change', (v) => {
      setDisplayValue(v)
    })

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, duration, count, rounded])

  return <span className="tabular-nums">{prefix}{displayValue}{suffix}</span>
}

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
  avatar_frame?: string | null
  level?: number | null
  consecutive_days?: number | null
  total_exp?: number | null
  virtual_currency?: number | null
  banner_svg?: string | null
  pins?: Array<{ svg_code: string }> | null
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
  created_by?: string | null
  participant_count: number
  participants: BattleParticipant[]
  battle_boxes: BattleBox[]
  creator_banner?: string | null
}

// Custom Dropdown Component
function CustomDropdown({ value, onChange, options }: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={dropdownRef} className="relative z-[60]">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 min-w-[160px] justify-between"
        style={{
          background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)',
          boxShadow: resolvedTheme === 'dark'
            ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
          color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151'
        }}
      >
        <span>{selectedOption?.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 rounded-xl overflow-hidden z-[100]"
            style={{
              background: resolvedTheme === 'dark' ? '#1e293b' : '#f8fafc',
              boxShadow: resolvedTheme === 'dark'
                ? '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                : '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)'
            }}
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ x: 4 }}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-sm font-medium flex items-center justify-between transition-colors"
                style={{
                  background: value === option.value
                    ? resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
                    : 'transparent',
                  color: value === option.value
                    ? '#3b82f6'
                    : resolvedTheme === 'dark' ? '#d1d5db' : '#374151'
                }}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" />}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MODE_CONFIGS = {
  classic: { icon: Crown, label: 'Classic', color: 'text-blue-500', darkColor: 'dark:text-blue-400', hexColor: '#3b82f6' },
  crazy: { icon: Zap, label: 'Crazy', color: 'text-purple-500', darkColor: 'dark:text-purple-400', hexColor: '#a855f7' },
  shared: { icon: Users, label: 'Shared', color: 'text-green-500', darkColor: 'dark:text-green-400', hexColor: '#22c55e' },
  fast: { icon: Trophy, label: 'Fast', color: 'text-orange-500', darkColor: 'dark:text-orange-400', hexColor: '#f97316' },
  jackpot: { icon: Target, label: 'Jackpot', color: 'text-yellow-500', darkColor: 'dark:text-yellow-400', hexColor: '#eab308' },
  terminal: { icon: Star, label: 'Terminal', color: 'text-red-500', darkColor: 'dark:text-red-400', hexColor: '#ef4444' },
  clutch: { icon: Shield, label: 'Clutch', color: 'text-pink-500', darkColor: 'dark:text-pink-400', hexColor: '#ec4899' }
}

// Helper function to determine battle format (1v1, 2v2, etc.)
function getBattleFormat(participants: BattleParticipant[], maxPlayers: number): { format: string; isTeamBattle: boolean; teamsCount: number } {
  // Check if participants have team info
  const teams = new Set(participants.map(p => p.team))
  const uniqueTeams = Array.from(teams).filter(t => t !== undefined && t !== null)

  // If teams are properly assigned (more than 1 unique team value)
  if (uniqueTeams.length > 1) {
    const teamCounts: Record<number, number> = {}
    participants.forEach(p => {
      if (p.team !== undefined && p.team !== null) {
        teamCounts[p.team] = (teamCounts[p.team] || 0) + 1
      }
    })

    const teamSizes = Object.values(teamCounts)
    const avgTeamSize = Math.round(maxPlayers / uniqueTeams.length)

    if (avgTeamSize > 1) {
      // Team battle: 2v2, 3v3, etc.
      return {
        format: `${avgTeamSize}v${avgTeamSize}`,
        isTeamBattle: true,
        teamsCount: uniqueTeams.length
      }
    }
  }

  // Free-for-all: 1v1, 1v1v1, 1v1v1v1, etc.
  const ffaFormat = Array(maxPlayers).fill('1').join('v')
  return {
    format: ffaFormat,
    isTeamBattle: false,
    teamsCount: maxPlayers
  }
}

// Box Preview Modal - shows items contained in a box
interface BoxPreviewItem {
  item_id: string
  item_name: string
  item_image_url: string
  item_rarity: string
  probability: number
}

function BoxPreviewModal({ lootBoxId, boxName, boxImage, onClose }: {
  lootBoxId: string
  boxName: string
  boxImage: string
  onClose: () => void
}) {
  const { resolvedTheme } = useTheme()
  const [items, setItems] = useState<BoxPreviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_loot_box_items_with_probabilities', {
        p_loot_box_id: lootBoxId
      })
      if (!error && data) {
        setItems(data as BoxPreviewItem[])
      }
      setLoading(false)
    }
    fetchItems()
  }, [lootBoxId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#9ca3af',
      uncommon: '#22c55e',
      rare: '#3b82f6',
      epic: '#a855f7',
      legendary: '#f59e0b',
      mythic: '#ef4444'
    }
    return colors[rarity?.toLowerCase()] || colors.common
  }

  const getRarityLabel = (rarity: string) => {
    const labels: Record<string, string> = {
      common: 'Commun',
      uncommon: 'Peu commun',
      rare: 'Rare',
      epic: 'Épique',
      legendary: 'Légendaire',
      mythic: 'Mythique'
    }
    return labels[rarity?.toLowerCase()] || rarity
  }

  // Group items by rarity
  const groupedItems = useMemo(() => {
    const groups: Record<string, BoxPreviewItem[]> = {}
    const order = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
    items.forEach(item => {
      const rarity = item.item_rarity?.toLowerCase() || 'common'
      if (!groups[rarity]) groups[rarity] = []
      groups[rarity].push(item)
    })
    return order.filter(r => groups[r]).map(r => ({ rarity: r, items: groups[r] }))
  }, [items])

  // Get top 3 rarest items for burst effect
  const burstItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
      return rarityOrder.indexOf(a.item_rarity?.toLowerCase() || 'common') -
             rarityOrder.indexOf(b.item_rarity?.toLowerCase() || 'common')
    })
    return sorted.slice(0, 3)
  }, [items])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="relative w-full max-w-2xl rounded-3xl overflow-visible"
        style={{
          background: resolvedTheme === 'dark'
            ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 250, 252, 0.99) 100%)',
          border: resolvedTheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: resolvedTheme === 'dark'
            ? '0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), 0 0 100px rgba(59, 130, 246, 0.1)'
            : '0 32px 64px -16px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3D Box Hero Section with bursting items */}
        <div className="relative h-64 overflow-visible flex items-center justify-center"
          style={{
            background: resolvedTheme === 'dark'
              ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)'
          }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-56 h-56 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)`,
                filter: 'blur(30px)'
              }}
            />
          </div>

          {/* Main box image - BIGGER */}
          <motion.div
            initial={{ y: 20, rotateX: 15 }}
            animate={{ y: 0, rotateX: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative z-10"
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          >
            <motion.img
              src={boxImage || '/mystery-box.png'}
              alt={boxName}
              className="w-48 h-48 object-contain"
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))',
                transform: 'translateZ(20px)'
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
            />
          </motion.div>

          {/* Bursting items - NO BORDERS, positioned around the box */}
          {!loading && burstItems.map((item, idx) => {
            const positions = [
              { x: -110, y: -15, rotate: -12, delay: 0 },
              { x: 110, y: -5, rotate: 12, delay: 0.1 },
              { x: 0, y: -85, rotate: 3, delay: 0.2 }
            ]
            const pos = positions[idx]
            const rarityColor = getRarityColor(item.item_rarity)

            return (
              <motion.div
                key={item.item_id}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: pos.x,
                  y: pos.y,
                  rotate: pos.rotate
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: 0.3 + pos.delay
                }}
                className="absolute z-20 w-16 h-16 rounded-xl flex items-center justify-center"
                style={{
                  background: resolvedTheme === 'dark'
                    ? `linear-gradient(135deg, ${rarityColor}25, ${rarityColor}15)`
                    : `linear-gradient(135deg, ${rarityColor}20, ${rarityColor}10)`,
                  boxShadow: `0 12px 32px ${rarityColor}40, 0 0 30px ${rarityColor}20`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-32px',
                  marginTop: '-32px'
                }}
              >
                <img
                  src={item.item_image_url || '/mystery-box.png'}
                  alt={item.item_name}
                  loading="lazy"
                  className="w-11 h-11 object-contain"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                />
              </motion.div>
            )
          })}

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <X className="w-5 h-5 text-secondary" />
          </motion.button>
        </div>

        {/* Header with title */}
        <div className="px-6 py-4 border-b" style={{
          borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-primary">{boxName}</h3>
              <p className="text-sm text-secondary">{items.length} items disponibles</p>
            </div>
            <div className="flex items-center gap-2">
              {burstItems.slice(0, 3).map((item, idx) => (
                <div
                  key={`badge-${item.item_id}`}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: getRarityColor(item.item_rarity),
                    boxShadow: `0 0 6px ${getRarityColor(item.item_rarity)}`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{
                      background: resolvedTheme === 'dark' ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)'
                    }} />
                    <div className="h-3 w-16 rounded" style={{
                      background: resolvedTheme === 'dark' ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)'
                    }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{
                        background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)'
                      }}>
                        <div className="w-11 h-11 rounded-lg" style={{
                          background: resolvedTheme === 'dark' ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)'
                        }} />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 rounded w-full" style={{
                            background: resolvedTheme === 'dark' ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)'
                          }} />
                          <div className="h-2 rounded w-1/3" style={{
                            background: resolvedTheme === 'dark' ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                background: resolvedTheme === 'dark' ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.5)'
              }}>
                <Eye className="w-8 h-8 text-muted" />
              </div>
              <p className="text-secondary">Aucun item trouvé</p>
            </div>
          ) : (
            groupedItems.map(({ rarity, items: rarityItems }) => {
              const rarityColor = getRarityColor(rarity)
              return (
                <div key={rarity}>
                  {/* Rarity header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: rarityColor, boxShadow: `0 0 8px ${rarityColor}` }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: rarityColor }}>
                      {getRarityLabel(rarity)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${rarityColor}40, transparent)` }} />
                    <span className="text-xs text-secondary">{rarityItems.length}</span>
                  </div>

                  {/* Items grid - 2 columns */}
                  <div className="grid grid-cols-2 gap-2">
                    {rarityItems.map((item, idx) => (
                      <motion.div
                        key={item.item_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="group flex items-center gap-2.5 p-2.5 rounded-xl transition-all hover:scale-[1.02]"
                        style={{
                          background: resolvedTheme === 'dark'
                            ? 'rgba(30, 41, 59, 0.5)'
                            : 'rgba(248, 250, 252, 0.8)',
                          border: resolvedTheme === 'dark'
                            ? `1px solid rgba(255, 255, 255, 0.06)`
                            : `1px solid rgba(0, 0, 0, 0.04)`
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105"
                          style={{
                            background: resolvedTheme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                            border: `2px solid ${rarityColor}30`
                          }}
                        >
                          <img
                            src={item.item_image_url || '/mystery-box.png'}
                            alt={item.item_name}
                            loading="lazy"
                            className="w-8 h-8 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-primary truncate leading-tight">{item.item_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: rarityColor }} />
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: rarityColor }}
                              title={`${item.probability}%`}
                            >
                              {item.probability >= 1
                                ? `${item.probability.toFixed(1)}%`
                                : item.probability >= 0.01
                                  ? `${item.probability.toFixed(2)}%`
                                  : item.probability >= 0.0001
                                    ? `${item.probability.toFixed(4)}%`
                                    : `<0.0001%`}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Participant Avatar Component using PlayerHoverCard (memoized)
const ParticipantAvatar = React.memo(function ParticipantAvatar({
  participant,
  resolvedTheme
}: {
  participant: BattleParticipant
  resolvedTheme: string | undefined
}) {
  // Préparer les données pré-chargées pour éviter un fetch inutile
  // Convertir null en undefined pour la compatibilité des types
  const preloadedData = participant.is_bot ? undefined : {
    username: participant.username ?? undefined,
    avatar_url: participant.avatar_url ?? undefined,
    avatar_frame: participant.avatar_frame ?? undefined,
    level: participant.level ?? undefined,
    total_exp: participant.total_exp ?? undefined,
    consecutive_days: participant.consecutive_days ?? undefined,
    virtual_currency: participant.virtual_currency ?? undefined,
    banner_svg: participant.banner_svg ?? undefined,
    pins: participant.pins ?? undefined
  }

  const avatarContent = (
    <div
      className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden hover:scale-105 md:hover:scale-110 transition-transform duration-100 ${
        !participant.is_bot ? getAvatarFrameClasses(participant.avatar_frame || 'default') : ''
      }`}
      style={participant.is_bot ? {
        boxShadow: resolvedTheme === 'dark'
          ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(0, 0, 0, 0.05)'
      } : undefined}
    >
      {participant.is_bot ? (
        <div className="w-full h-full flex items-center justify-center bg-accent rounded-lg">
          <Bot className="w-4 h-4 md:w-6 md:h-6 text-white" />
        </div>
      ) : (
        <div className="w-full h-full rounded-lg overflow-hidden">
          <img
            src={participant.avatar_url || '/default-avatar.png'}
            alt={participant.username || 'Player'}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/default-avatar.png'
            }}
          />
        </div>
      )}
    </div>
  )

  // Si c'est un bot, pas de hover card
  if (participant.is_bot) {
    return (
      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {avatarContent}
      </div>
    )
  }

  // Pour les joueurs, utiliser le PlayerHoverCard
  return (
    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <PlayerHoverCard
        userId={participant.user_id || ''}
        isBot={participant.is_bot}
        preloadedData={preloadedData}
      >
        {avatarContent}
      </PlayerHoverCard>
    </div>
  )
})

// Skeleton Loader Component
function BattleCardSkeleton({ index }: { index: number }) {
  const { resolvedTheme } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-[28px] overflow-hidden"
      style={{
        background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)',
        boxShadow: resolvedTheme === 'dark'
          ? '0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)'
          : '0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Mode Icon Skeleton */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-xl animate-pulse"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
              }}
            />
            <div
              className="w-16 h-6 rounded-full animate-pulse"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
              }}
            />
          </div>

          {/* Price Skeleton */}
          <div className="flex flex-col gap-2 min-w-[140px]">
            <div
              className="w-20 h-4 rounded animate-pulse"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
              }}
            />
            <div
              className="w-24 h-8 rounded animate-pulse"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
              }}
            />
          </div>

          <div className="w-px h-16 rounded-full" style={{
            background: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)'
          }} />

          {/* Players Skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-xl animate-pulse"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
                }}
              />
            ))}
          </div>

          <div className="w-px h-16 rounded-full" style={{
            background: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)'
          }} />

          {/* Boxes Skeleton */}
          <div className="flex-1 flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-24 h-24 rounded animate-pulse"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
                }}
              />
            ))}
          </div>

          {/* Button Skeleton */}
          <div
            className="w-[120px] h-20 rounded-xl animate-pulse"
            style={{
              background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
            }}
          />
        </div>
      </div>
    </motion.div>
  )
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
  const [viewMode, setViewMode] = useState<'extended' | 'compact'>('extended')

  // Ref pour éviter les appels multiples
  const isLoadingRef = useRef(false)
  const hasInitialLoadRef = useRef(false)

  // Live stats - only the 3 requested metrics
  const [liveStats, setLiveStats] = useState({
    boxesOpenedTotal: 0,      // Total cumulé des caisses ouvertes en battles
    battlesCreatedTotal: 0,   // Nombre total de battles générées depuis le début
    coinsDistributed24h: 0    // Somme totale gagnée par les joueurs sur les dernières 24h
  })
  const [statsLoaded, setStatsLoaded] = useState(false)

  // Ref pour accéder à loadBattles sans le mettre dans les dépendances
  const loadBattlesRef = useRef<() => Promise<void>>()

  // Realtime subscription for battle updates (boxes opening, new participants, etc.)
  const { isConnected: realtimeConnected } = useBattleListSubscription(
    useCallback((payload: any) => {
      const data = payload.new || payload.old
      if (!data) return

      // Détecter le type par les propriétés du payload
      const isBattle = 'max_players' in data || 'total_boxes' in data || 'entry_cost' in data
      const isParticipant = 'battle_id' in data && 'position' in data

      console.log('🔄 Realtime update:', { isBattle, isParticipant, eventType: payload.eventType, data })

      // Battle updated (status, current_box, etc.)
      if (isBattle) {
        if (payload.eventType === 'UPDATE') {
          setBattles(prev => prev.map(battle =>
            battle.id === payload.new.id
              ? {
                  ...battle,
                  status: payload.new.status,
                  current_box: payload.new.current_box,
                  total_prize: payload.new.total_prize
                }
              : battle
          ))
          // Incrémenter le compteur de boxes si une box a été ouverte
          if (payload.new.current_box > (payload.old?.current_box || 0)) {
            setLiveStats(prev => ({
              ...prev,
              boxesOpenedTotal: prev.boxesOpenedTotal + 1
            }))
          }
        } else if (payload.eventType === 'INSERT') {
          // Nouvelle battle créée - charger uniquement cette battle
          console.log('✨ Nouvelle battle détectée:', payload.new.id)

          // Charger la battle complète et l'ajouter en douceur
          loadSingleBattleRef.current?.(payload.new.id).then(newBattle => {
            if (newBattle) {
              setBattles(prev => {
                // Éviter les doublons
                if (prev.some(b => b.id === newBattle.id)) return prev
                // Ajouter en haut de la liste
                return [newBattle, ...prev]
              })
              console.log('✅ Nouvelle battle ajoutée en douceur')
            }
          })

          setLiveStats(prev => ({
            ...prev,
            battlesCreatedTotal: prev.battlesCreatedTotal + 1
          }))
        } else if (payload.eventType === 'DELETE') {
          setBattles(prev => prev.filter(b => b.id !== payload.old?.id))
        }
      }

      // Participant joined/left
      if (isParticipant) {
        if (payload.eventType === 'INSERT') {
          console.log('👤 Nouveau participant:', payload.new)
          setBattles(prev => prev.map(battle => {
            if (battle.id === payload.new.battle_id) {
              return {
                ...battle,
                participant_count: battle.participant_count + 1,
                participants: [...battle.participants, payload.new]
              }
            }
            return battle
          }))
        } else if (payload.eventType === 'DELETE') {
          setBattles(prev => prev.map(battle => {
            if (battle.id === payload.old?.battle_id) {
              return {
                ...battle,
                participant_count: Math.max(0, battle.participant_count - 1),
                participants: battle.participants.filter(p => p.id !== payload.old?.id)
              }
            }
            return battle
          }))
        }
      }
    }, []),
    useCallback((battleId: string) => {
      // Battle finished - remove after delay (7 secondes pour laisser le temps de voir le résultat)
      console.log('🏁 Battle terminée:', battleId)
      setTimeout(() => {
        setBattles(prev => prev.filter(b => b.id !== battleId))
      }, 7000)
    }, [])
  )

  // Charger une seule battle (pour les nouvelles battles en temps réel)
  const loadSingleBattle = useCallback(async (battleId: string) => {
    try {
      // 1. Fetch la battle
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .select(`
          id, name, mode, max_players, entry_cost, total_prize,
          status, is_private, total_boxes, current_box,
          created_at, expires_at, created_by
        `)
        .eq('id', battleId)
        .single()

      if (battleError || !battleData) return null

      // 2. Fetch les participants
      const { data: participants } = await supabase
        .from('battle_participants')
        .select('id, battle_id, user_id, is_bot, bot_name, bot_avatar_url, position, team, total_value')
        .eq('battle_id', battleId)
        .order('position')

      // 3. Fetch les profils des participants
      const userIds = (participants || []).filter(p => !p.is_bot && p.user_id).map(p => p.user_id as string)
      if (battleData.created_by) userIds.push(battleData.created_by)

      const profilesMap = new Map<string, any>()
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, theme, level')
          .in('id', [...new Set(userIds)])
        profiles?.forEach(p => profilesMap.set(p.id, p))
      }

      // 4. Fetch les boxes
      const { data: boxes } = await supabase
        .from('battle_boxes')
        .select('battle_id, loot_box_id, quantity, order_position, cost_per_box, loot_boxes(name, image_url, price_virtual)')
        .eq('battle_id', battleId)
        .order('order_position')

      // 5. Assembler la battle
      const enrichedParticipants = (participants || []).map(p => {
        if (!p.is_bot && p.user_id) {
          const profile = profilesMap.get(p.user_id)
          return {
            ...p,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            avatar_frame: (profile?.theme as any)?.avatar_frame || 'default',
            level: profile?.level
          }
        }
        return p
      })

      const formattedBoxes = (boxes || []).map((box: any) => {
        const lootBox = Array.isArray(box.loot_boxes) ? box.loot_boxes[0] : box.loot_boxes
        return {
          battle_id: box.battle_id,
          loot_box_id: box.loot_box_id,
          quantity: box.quantity,
          order_position: box.order_position,
          cost_per_box: box.cost_per_box,
          box_name: lootBox?.name || '',
          box_image: lootBox?.image_url || '',
          price_virtual: parseFloat(lootBox?.price_virtual || '0')
        }
      })

      return {
        ...battleData,
        participant_count: enrichedParticipants.length,
        participants: enrichedParticipants,
        battle_boxes: formattedBoxes,
        creator_banner: null
      } as Battle
    } catch (err) {
      console.error('Error loading single battle:', err)
      return null
    }
  }, [])

  // Ref pour loadSingleBattle
  const loadSingleBattleRef = useRef<(id: string) => Promise<Battle | null>>()
  loadSingleBattleRef.current = loadSingleBattle

  const loadBattles = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (isLoadingRef.current) return
    isLoadingRef.current = true

    try {
      setLoading(true)
      setError('')

      // 1. Fetch toutes les battles
      const { data: battlesData, error: battlesError } = await supabase
        .from('battles')
        .select(`
          id, name, mode, max_players, entry_cost, total_prize,
          status, is_private, total_boxes, current_box,
          created_at, expires_at, created_by
        `)
        .in('status', ['waiting', 'countdown', 'active'])
        .order('created_at', { ascending: false })

      if (battlesError) throw battlesError

      if (!battlesData || battlesData.length === 0) {
        setBattles([])
        setLiveStats({
          boxesOpenedTotal: 0,
          battlesCreatedTotal: 0,
          coinsDistributed24h: 0
        })
        setStatsLoaded(true)
        return
      }

      const battleIds = battlesData.map(b => b.id)
      const creatorIds = battlesData.map(b => b.created_by).filter(Boolean) as string[]

      // 2. Fetch TOUS les participants en une seule requête
      const { data: allParticipants } = await supabase
        .from('battle_participants')
        .select('id, battle_id, user_id, is_bot, bot_name, bot_avatar_url, position, team, total_value')
        .in('battle_id', battleIds)
        .order('position')

      // 3. Collecter tous les user_ids (participants non-bot + créateurs)
      const participantUserIds = (allParticipants || [])
        .filter(p => !p.is_bot && p.user_id)
        .map(p => p.user_id as string)
      const allUserIds = [...new Set([...participantUserIds, ...creatorIds])]

      // 4. Fetch TOUS les profils en une seule requête
      const profilesMap = new Map<string, any>()
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, theme, level, consecutive_days, total_exp, virtual_currency')
          .in('id', allUserIds)

        profiles?.forEach(p => profilesMap.set(p.id, p))
      }

      // 5. Fetch TOUTES les bannières équipées en une seule requête
      const bannersMap = new Map<string, string>()
      if (allUserIds.length > 0) {
        const { data: banners } = await supabase
          .from('user_banners')
          .select('user_id, shop_banners(svg_code)')
          .in('user_id', allUserIds)
          .eq('is_equipped', true)

        banners?.forEach(b => {
          const shopBanners = b.shop_banners as unknown as { svg_code: string } | null
          if (shopBanners && !Array.isArray(shopBanners) && shopBanners.svg_code) {
            bannersMap.set(b.user_id, shopBanners.svg_code)
          }
        })
      }

      // 6. Fetch TOUS les pins équipés en une seule requête
      const pinsMap = new Map<string, Array<{ svg_code: string }>>()
      if (participantUserIds.length > 0) {
        const { data: pins } = await supabase
          .from('user_pins')
          .select('user_id, shop_pins(svg_code)')
          .in('user_id', participantUserIds)
          .eq('is_equipped', true)

        pins?.forEach(pin => {
          const shopPins = pin.shop_pins as unknown as { svg_code: string } | null
          if (shopPins && !Array.isArray(shopPins) && shopPins.svg_code) {
            const existing = pinsMap.get(pin.user_id) || []
            if (existing.length < 4) {
              existing.push({ svg_code: shopPins.svg_code })
              pinsMap.set(pin.user_id, existing)
            }
          }
        })
      }

      // 7. Fetch TOUTES les battle_boxes en une seule requête
      const { data: allBoxes } = await supabase
        .from('battle_boxes')
        .select('battle_id, loot_box_id, quantity, order_position, cost_per_box, loot_boxes(name, image_url, price_virtual)')
        .in('battle_id', battleIds)
        .order('order_position')

      // 8. Grouper les boxes par battle_id
      const boxesByBattle = new Map<string, BattleBox[]>()
      allBoxes?.forEach((box: any) => {
        const lootBox = Array.isArray(box.loot_boxes) ? box.loot_boxes[0] : box.loot_boxes
        const formattedBox: BattleBox = {
          battle_id: box.battle_id,
          loot_box_id: box.loot_box_id,
          quantity: box.quantity,
          order_position: box.order_position,
          cost_per_box: box.cost_per_box,
          box_name: lootBox?.name || '',
          box_image: lootBox?.image_url || '',
          price_virtual: parseFloat(lootBox?.price_virtual || '0')
        }
        const existing = boxesByBattle.get(box.battle_id) || []
        existing.push(formattedBox)
        boxesByBattle.set(box.battle_id, existing)
      })

      // 9. Grouper les participants par battle_id et enrichir avec les données
      const participantsByBattle = new Map<string, BattleParticipant[]>()
      allParticipants?.forEach(p => {
        let enrichedParticipant: BattleParticipant = { ...p }

        if (!p.is_bot && p.user_id) {
          const profile = profilesMap.get(p.user_id)
          enrichedParticipant = {
            ...p,
            username: profile?.username,
            avatar_url: profile?.avatar_url,
            avatar_frame: (profile?.theme as any)?.avatar_frame || 'default',
            level: profile?.level,
            consecutive_days: profile?.consecutive_days,
            total_exp: profile?.total_exp,
            virtual_currency: profile?.virtual_currency,
            banner_svg: bannersMap.get(p.user_id) || null,
            pins: pinsMap.get(p.user_id) || null
          }
        }

        const existing = participantsByBattle.get(p.battle_id) || []
        existing.push(enrichedParticipant)
        participantsByBattle.set(p.battle_id, existing)
      })

      // 10. Assembler les battles finales
      const battlesWithData: Battle[] = battlesData.map(battle => ({
        ...battle,
        participant_count: participantsByBattle.get(battle.id)?.length || 0,
        participants: participantsByBattle.get(battle.id) || [],
        battle_boxes: boxesByBattle.get(battle.id) || [],
        creator_banner: battle.created_by ? bannersMap.get(battle.created_by) || null : null
      }))

      setBattles(battlesWithData)

      // Fetch the 3 requested live stats in parallel
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const [boxesResult, battlesResult, coinsResult] = await Promise.all([
        // Boxes ouvertes: Total cumulé (ALL TIME)
        supabase
          .from('battle_openings')
          .select('id', { count: 'exact', head: true }),
        // Battles créées: Total depuis le début (ALL TIME)
        supabase
          .from('battles')
          .select('id', { count: 'exact', head: true }),
        // Coins distribués: Somme des dernières 24h (status = 'finished', utilise updated_at)
        supabase
          .from('battles')
          .select('total_prize')
          .eq('status', 'finished')
          .gte('updated_at', oneDayAgo)
      ])

      const boxesOpenedTotal = boxesResult.count || 0
      const battlesCreatedTotal = battlesResult.count || 0
      const coinsDistributed24h = coinsResult.data?.reduce((sum, b) => sum + (b.total_prize || 0), 0) || 0

      setLiveStats({
        boxesOpenedTotal,
        battlesCreatedTotal,
        coinsDistributed24h
      })
      setStatsLoaded(true)

    } catch (err: any) {
      // Ignorer les erreurs AbortError (causées par navigation rapide ou démontage du composant)
      if (err?.message?.includes('AbortError') || err?.name === 'AbortError') {
        return
      }
      console.error('Erreur chargement battles:', err)
      setError('Impossible de charger les battles')
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [])

  // Stocker la référence à loadBattles pour l'utiliser dans les callbacks
  loadBattlesRef.current = loadBattles

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

  const sortOptions = [
    { value: 'date-desc', label: 'Plus récent' },
    { value: 'date-asc', label: 'Plus ancien' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'price-asc', label: 'Prix croissant' }
  ]

  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true
      loadBattles()
    }
  }, [loadBattles])

 return (
  <div className="min-h-screen -mt-[80px] pt-[100px] pb-24 lg:pb-8 bg-gray-50 dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
      {/* Immersive background - Pure CSS, no GPU shaders */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Base gradient - dark blue to purple tint */}
        <div
          className="absolute inset-0"
          style={{
            background: resolvedTheme === 'dark'
              ? 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 80% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%), radial-gradient(ellipse 80% 50% at 20% 80%, rgba(59, 130, 246, 0.04) 0%, transparent 50%)'
              : 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(99, 102, 241, 0.04) 0%, transparent 50%)'
          }}
        />
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />
        {/* Grid pattern - battle arena feel */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Vignette effect */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.15) 100%)'
          }}
        />
      </div>

      <div className="relative z-[50] w-full max-w-full mx-auto px-4 lg:px-5 mb-7">
        {/* Header - Title + Live Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary">
              Batailles de Caisses
            </h1>
          </div>

          {/* Live Stats - Glass Pills Style (V3 + V7 mix) - Enlarged */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Live indicator pill */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              <span className="text-xs font-semibold text-red-500 uppercase">Live</span>
            </div>

            {/* Boxes ouvertes pill */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.06)',
                border: '1px solid rgba(168, 85, 247, 0.15)'
              }}>
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-base font-bold text-purple-400 tabular-nums">
                {statsLoaded ? <AnimatedCounter value={liveStats.boxesOpenedTotal} duration={2} /> : '—'}
              </span>
            </div>

            {/* Battles créées pill */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(234, 179, 8, 0.06)',
                border: '1px solid rgba(234, 179, 8, 0.15)'
              }}>
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="text-base font-bold text-amber-400 tabular-nums">
                {statsLoaded ? <AnimatedCounter value={liveStats.battlesCreatedTotal} duration={1.5} /> : '—'}
              </span>
            </div>

            {/* Coins distribués pill avec jauge circulaire */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
              {/* Circular gauge avec icône coins */}
              <div className="relative w-9 h-9">
                <svg className="w-9 h-9 -rotate-90">
                  <circle cx="18" cy="18" r="14" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="2.5" fill="none" />
                  <motion.circle
                    cx="18" cy="18" r="14"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 88' }}
                    animate={{ strokeDasharray: '66 88' }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/ChatGPT_Image_6_sept._2025_19_31_10.png"
                    alt="Coins"
                    className="w-4.5 h-4.5"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-emerald-400 tabular-nums leading-none">
                  {statsLoaded ? <AnimatedCounter value={Math.floor(liveStats.coinsDistributed24h)} duration={2.5} /> : '—'}
                </span>
                <span className="text-[9px] text-emerald-500/60 uppercase">24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Mobile */}
        <div className="flex lg:hidden items-center gap-2 w-full mb-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowReadyOnly(!showReadyOnly)}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: showReadyOnly
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
              color: showReadyOnly ? 'white' : resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
              boxShadow: showReadyOnly
                ? '0 8px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : resolvedTheme === 'dark'
                  ? '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
            }}
          >
            {showReadyOnly ? 'Dispo' : 'Tout'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={loadBattles}
            disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
              boxShadow: resolvedTheme === 'dark'
                ? '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                : '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
              opacity: loading ? 0.5 : 1
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>

          <div className="flex-1" />

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/battles/create'}
            className="px-4 py-2 rounded-xl font-bold text-white flex items-center gap-1.5 text-xs"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Créer</span>
          </motion.button>
        </div>

        {/* Filtre joueurs - Scrollable sur mobile */}
        <div className="flex items-center gap-2 lg:gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-xs lg:text-sm font-medium text-secondary whitespace-nowrap">
            Players
          </span>
          {[2, 3, 4, 5, 6].map((count) => (
            <motion.button
              key={count}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPlayerFilter(playerFilter === count ? null : count)}
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center text-xs lg:text-sm font-bold transition-all flex-shrink-0"
              style={{
                background: playerFilter === count
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                color: playerFilter === count ? 'white' : resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
                boxShadow: playerFilter === count
                  ? '0 8px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : resolvedTheme === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    : '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              {count}
            </motion.button>
          ))}
        </div>

        {/* Row: Filtres de mode (left) + Controls (right) */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Filtres de mode - Scrollable */}
          <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {Object.entries(MODE_CONFIGS).map(([mode, config]) => {
              const Icon = config.icon
              const isActive = !hiddenModes.has(mode)

              return (
                <button
                  key={mode}
                  onClick={() => toggleModeVisibility(mode)}
                  className="relative flex items-center gap-1.5 lg:gap-2.5 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all hover:scale-105 card-glass flex-shrink-0"
                >
                  <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${config.color} ${config.darkColor}`} />
                  <span className="text-primary whitespace-nowrap">
                    {config.label}
                  </span>

                  <div className={`relative w-9 lg:w-11 h-5 lg:h-6 rounded-full transition-all ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                    style={{
                      boxShadow: isActive
                        ? '0 0 8px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                        : 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <motion.div
                      animate={{ x: isActive ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-[3px] lg:top-1 w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full shadow-lg"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, #ffffff, #f0f0f0)'
                          : 'linear-gradient(135deg, #94a3b8, #64748b)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Controls Desktop - Right side */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{
              background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)',
              border: resolvedTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('extended')}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: viewMode === 'extended'
                    ? resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                  color: viewMode === 'extended' ? '#3b82f6' : resolvedTheme === 'dark' ? '#94a3b8' : '#64748b'
                }}
              >
                <LayoutList className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('compact')}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: viewMode === 'compact'
                    ? resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                    : 'transparent',
                  color: viewMode === 'compact' ? '#3b82f6' : resolvedTheme === 'dark' ? '#94a3b8' : '#64748b'
                }}
              >
                <LayoutGrid className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Bouton Créer Battle */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/battles/create'}
              className="px-4 py-2 rounded-xl font-bold text-white flex items-center gap-2 text-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Créer Battle</span>
            </motion.button>

            {/* Filtre Ready */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowReadyOnly(!showReadyOnly)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: showReadyOnly
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)',
                color: showReadyOnly ? 'white' : resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
                border: showReadyOnly ? 'none' : resolvedTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: showReadyOnly ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              {showReadyOnly ? 'Prêt à rejoindre' : 'Toutes'}
            </motion.button>

            {/* Dropdown tri */}
            <CustomDropdown
              value={sortBy}
              onChange={(value) => setSortBy(value as any)}
              options={sortOptions}
            />

            {/* Bouton Refresh */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadBattles}
              disabled={loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)',
                border: resolvedTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
                color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
                opacity: loading ? 0.5 : 1
              }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="relative z-[10] w-full max-w-full mx-auto px-4 lg:px-6">
        {loading && (
          <div className={viewMode === 'compact' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8' : 'space-y-4 pb-8'}>
            {[1, 2, 3].map((i) => (
              <BattleCardSkeleton key={i} index={i - 1} />
            ))}
          </div>
        )}

        {error && (
          <div className="alert-error p-4 rounded-lg border">
            <div className="font-medium">Erreur</div>
            <div className="text-sm mt-1">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <div className={viewMode === 'compact' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pb-8 overflow-visible' : 'space-y-4 lg:space-y-6 pb-8 overflow-visible'}>
            {filteredAndSortedBattles.length === 0 ? (
              <div className="text-center py-12 col-span-2">
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
                  viewMode={viewMode}
                />
              ))
            )}

          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />

    </div>
  )
}

// Component for displaying participants with VS indicators based on battle mode
const ParticipantsWithVS = React.memo(function ParticipantsWithVS({
  participants,
  emptySlots,
  mode,
  maxPlayers,
  creatorBanner,
  resolvedTheme
}: {
  participants: BattleParticipant[]
  emptySlots: number
  mode: string
  maxPlayers: number
  creatorBanner?: string | null
  resolvedTheme: string | undefined
}) {
  const modeConfig = MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS] || MODE_CONFIGS.classic
  const ModeIcon = modeConfig.icon
  const battleFormat = getBattleFormat(participants, maxPlayers)

  // Create array of all slots (participants + empty)
  const allSlots = [
    ...participants,
    ...Array.from({ length: emptySlots }).map((_, idx) => ({
      id: `empty-${idx}`,
      isEmpty: true
    }))
  ]

  // For team battles, properly distribute players and empty slots across teams
  const renderTeamBattle = () => {
    // Determine number of teams (2 for 2v2/4 players, etc.)
    const numTeams = 2 // Team battles are always 2 teams
    const playersPerTeam = Math.floor(maxPlayers / numTeams)

    // Group existing participants by team
    const teams: Record<number, BattleParticipant[]> = { 0: [], 1: [] }
    participants.forEach(p => {
      const team = p.team ?? 0
      if (teams[team]) teams[team].push(p)
    })

    // Calculate empty slots per team
    const team0Empty = playersPerTeam - teams[0].length
    const team1Empty = playersPerTeam - teams[1].length

    return (
      <div className="relative px-2 py-2 rounded-lg overflow-visible">
        {creatorBanner && (
          <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden opacity-40" dangerouslySetInnerHTML={{ __html: creatorBanner }} />
        )}
        <div className="relative flex items-center gap-2 overflow-visible" style={{ zIndex: 1 }}>
          {/* Team 0 */}
          <div className="flex items-center gap-1.5">
            {teams[0].map(p => (
              <ParticipantAvatar key={p.id} participant={p} resolvedTheme={resolvedTheme} />
            ))}
            {Array.from({ length: team0Empty }).map((_, idx) => (
              <div
                key={`empty-t0-${idx}`}
                className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-dashed"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                  borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                }}
              >
                <span className="text-base font-light text-muted">+</span>
              </div>
            ))}
          </div>

          {/* VS indicator between teams */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
            style={{
              background: resolvedTheme === 'dark'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.2)'
            }}
          >
            <Swords className="w-3.5 h-3.5 text-red-500" />
          </motion.div>

          {/* Team 1 */}
          <div className="flex items-center gap-1.5">
            {teams[1].map(p => (
              <ParticipantAvatar key={p.id} participant={p} resolvedTheme={resolvedTheme} />
            ))}
            {Array.from({ length: team1Empty }).map((_, idx) => (
              <div
                key={`empty-t1-${idx}`}
                className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-dashed"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                  borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                }}
              >
                <span className="text-base font-light text-muted">+</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // For shared mode, show mode icon between players
  const renderSharedMode = () => (
    <div className="relative px-2 py-2 rounded-lg overflow-visible">
      {creatorBanner && (
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden opacity-40" dangerouslySetInnerHTML={{ __html: creatorBanner }} />
      )}
      <div className="relative flex items-center gap-1.5 overflow-visible" style={{ zIndex: 1 }}>
        {allSlots.map((slot, idx) => (
          <React.Fragment key={'isEmpty' in slot ? slot.id : slot.id}>
            {'isEmpty' in slot ? (
              <div
                className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-dashed"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                  borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                }}
              >
                <span className="text-base font-light text-muted">+</span>
              </div>
            ) : (
              <ParticipantAvatar participant={slot as BattleParticipant} resolvedTheme={resolvedTheme} />
            )}
            {/* Mode icon between players for shared mode */}
            {idx < allSlots.length - 1 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${modeConfig.hexColor}25, ${modeConfig.hexColor}10)`,
                  border: `1px solid ${modeConfig.hexColor}40`
                }}
              >
                <ModeIcon className="w-3.5 h-3.5" style={{ color: modeConfig.hexColor }} />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  // For FFA (free-for-all), show swords between each player
  const renderFFAMode = () => (
    <div className="relative px-2 py-2 rounded-lg overflow-visible">
      {creatorBanner && (
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden opacity-40" dangerouslySetInnerHTML={{ __html: creatorBanner }} />
      )}
      <div className="relative flex items-center gap-1.5 overflow-visible" style={{ zIndex: 1 }}>
        {allSlots.map((slot, idx) => (
          <React.Fragment key={'isEmpty' in slot ? slot.id : slot.id}>
            {'isEmpty' in slot ? (
              <div
                className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-dashed"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                  borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                }}
              >
                <span className="text-base font-light text-muted">+</span>
              </div>
            ) : (
              <ParticipantAvatar participant={slot as BattleParticipant} resolvedTheme={resolvedTheme} />
            )}
            {/* Swords between players for FFA */}
            {idx < allSlots.length - 1 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                style={{
                  background: resolvedTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06))',
                  border: '1px solid rgba(239, 68, 68, 0.25)'
                }}
              >
                <Swords className="w-3.5 h-3.5 text-red-400" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  // Decide which render mode to use
  if (mode.toLowerCase() === 'shared') {
    return renderSharedMode()
  } else if (battleFormat.isTeamBattle) {
    return renderTeamBattle()
  } else {
    return renderFFAMode()
  }
})

const MinimalBattleCard = React.memo(function MinimalBattleCard({ battle, index, viewMode = 'extended' }: {
  battle: Battle
  index: number
  viewMode?: 'extended' | 'compact'
}) {
  const { resolvedTheme } = useTheme()
  const modeConfig = MODE_CONFIGS[battle.mode as keyof typeof MODE_CONFIGS] || MODE_CONFIGS.classic
  const ModeIcon = modeConfig.icon
  const emptySlots = battle.max_players - battle.participants.length

  // Calculate total price from all boxes
  const totalPrice = battle.battle_boxes.reduce((sum, box) => {
    return sum + (box.price_virtual * box.quantity)
  }, 0)

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)

  // Drag vs click detection
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const hasDraggedRef = useRef(false)

  // Box preview modal
  const [previewBox, setPreviewBox] = useState<{ lootBoxId: string; boxName: string; boxImage: string } | null>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  // Card-level drag detection to prevent click after drag (mouse + touch)
  const handleCardMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
  }

  const handleCardMouseUp = (e: React.MouseEvent) => {
    if (dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x)
      const dy = Math.abs(e.clientY - dragStartRef.current.y)
      if (dx > 5 || dy > 5) {
        hasDraggedRef.current = true
      }
    }
  }

  const handleCardTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartRef.current = { x: touch.clientX, y: touch.clientY }
    hasDraggedRef.current = false
  }

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0]
    if (dragStartRef.current) {
      const dx = Math.abs(touch.clientX - dragStartRef.current.x)
      const dy = Math.abs(touch.clientY - dragStartRef.current.y)
      if (dx > 8 || dy > 8) {
        hasDraggedRef.current = true
      }
    }
  }

  const handleCardClick = () => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    window.location.href = `/battles/${battle.id}`
  }

  // Drag to scroll handlers
  const handleDragStart = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 2
    scrollRef.current.scrollLeft = scrollLeft - walk
  }

  // Handle box click to open preview modal
  const handleBoxClick = (e: React.MouseEvent, box: BattleBox) => {
    e.stopPropagation()
    e.preventDefault()
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    setPreviewBox({ lootBoxId: box.loot_box_id, boxName: box.box_name, boxImage: box.box_image })
  }

  // Generate expanded boxes array (each box repeated by its quantity)
  const expandedBoxes = useMemo(() => {
    const result: Array<typeof battle.battle_boxes[0] & { uniqueKey: string }> = []
    battle.battle_boxes.forEach((box, boxIndex) => {
      for (let i = 0; i < box.quantity; i++) {
        result.push({
          ...box,
          uniqueKey: `${box.loot_box_id}-${boxIndex}-${i}`
        })
      }
    })
    return result
  }, [battle.battle_boxes])

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'tween', duration: 0.3 }}
      whileHover={{ y: viewMode === 'extended' ? -6 : -3 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleCardMouseDown}
      onMouseUp={handleCardMouseUp}
      onTouchStart={handleCardTouchStart}
      onTouchEnd={handleCardTouchEnd}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          window.location.href = `/battles/${battle.id}`
        }
      }}
      role="article"
      tabIndex={0}
      aria-label={`Battle ${modeConfig.label} - ${battle.participant_count}/${battle.max_players} joueurs - ${Math.floor(totalPrice)} coins`}
      className="relative rounded-[28px] md:rounded-[28px] rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 overflow-visible"
      style={{
        background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)',
        boxShadow: resolvedTheme === 'dark'
          ? '0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)'
          : '0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Gradient glow effect on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: isHovering ? 0.15 : 0,
        }}
        transition={{ duration: 0.08 }}
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${modeConfig.hexColor}40, transparent 40%)`,
        }}
      />

      {/* Subtle top highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: resolvedTheme === 'dark'
            ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)'
        }}
      />

      <div className="relative z-10 p-3 md:p-4">
        {/* Layout Desktop - Horizontal (compact) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col items-center gap-1.5 w-20 flex-shrink-0">
            <ModeIcon
              className={`w-10 h-10 ${modeConfig.color} ${modeConfig.darkColor}`}
              style={{ filter: `drop-shadow(0 4px 10px ${modeConfig.hexColor}50)` }}
            />
            <div
              className="relative px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-center w-full flex items-center justify-center"
              style={{
                color: modeConfig.hexColor,
                border: `1.5px solid ${modeConfig.hexColor}`,
                boxShadow: `0 0 12px ${modeConfig.hexColor}60`,
                textShadow: `0 0 8px ${modeConfig.hexColor}`,
              }}
            >
              {modeConfig.label}
            </div>
          </div>

          <div className="flex flex-col gap-0.5 min-w-[110px]">
            <div className="flex items-center gap-1.5">
              <img
                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                alt="Coins"
                className="w-7 h-7 object-contain"
                style={{ filter: 'drop-shadow(0 3px 6px rgba(234, 179, 8, 0.4))' }}
              />
              <span className="text-xl font-bold text-success">{Math.floor(totalPrice)}</span>
            </div>
            <div className="text-[10px] text-secondary font-medium">{battle.total_boxes} boxes</div>
          </div>

          <div className="w-px h-12 rounded-full" style={{
            background: resolvedTheme === 'dark'
              ? 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
              : 'linear-gradient(to bottom, transparent, rgba(100, 116, 139, 0.2), transparent)'
          }} />

          {/* Participant avatars with VS logic */}
          <ParticipantsWithVS
            participants={battle.participants}
            emptySlots={emptySlots}
            mode={battle.mode}
            maxPlayers={battle.max_players}
            creatorBanner={battle.creator_banner}
            resolvedTheme={resolvedTheme}
          />

          <div className="w-px h-12 rounded-full" style={{
            background: resolvedTheme === 'dark'
              ? 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
              : 'linear-gradient(to bottom, transparent, rgba(100, 116, 139, 0.2), transparent)'
          }} />

          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide select-none"
            onMouseDown={handleDragStart}
            onMouseLeave={handleDragEnd}
            onMouseUp={handleDragEnd}
            onMouseMove={handleDragMove}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="flex items-center gap-2 py-2 px-1">
              {expandedBoxes.map((box, idx) => {
                // current_box est 1-indexed: round 1 = current_box = 1
                // Donc box index 0 correspond à round 1, index 1 à round 2, etc.
                const currentBoxIndex = (battle.current_box || 1) - 1
                // Si la battle est terminée, TOUTES les boxes sont ouvertes
                const isOpened = battle.status === 'finished' || idx < currentBoxIndex
                const isCurrentlyOpening = idx === currentBoxIndex && battle.status === 'active'
                return (
                  <div
                    key={box.uniqueKey}
                    className="relative group/box flex-shrink-0 cursor-pointer"
                    onClick={(e) => handleBoxClick(e, box)}
                  >
                    {/* Flèche animée sur la box en cours d'ouverture */}
                    {isCurrentlyOpening && (
                      <motion.div
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: [-8, -4, -8], opacity: 1 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-4 left-0 right-0 flex justify-center z-10"
                      >
                        <Play className="w-5 h-5 text-emerald-400 fill-emerald-400 rotate-90" />
                      </motion.div>
                    )}
                    <img
                      src={box.box_image || '/mystery-box.png'}
                      alt={box.box_name}
                      loading="lazy"
                      className={`w-24 h-24 object-contain transition-all duration-300 pointer-events-none ${
                        isOpened ? 'opacity-30 grayscale scale-90' : isCurrentlyOpening ? 'opacity-100 scale-105' : 'opacity-100 group-hover/box:scale-110'
                      }`}
                      style={{
                        filter: isOpened ? undefined : isCurrentlyOpening
                          ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))'
                          : undefined
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                      draggable={false}
                    />
                    {/* Indicateur visuel sur box ouverte */}
                    {isOpened && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-6 h-6 text-emerald-500/60" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = battle.participant_count < battle.max_players ? `/battles/${battle.id}` : `/battles/${battle.id}?spectate=true`
            }}
            className="px-5 py-3 rounded-xl font-bold text-white min-w-[100px]"
            style={{
              background: battle.participant_count < battle.max_players ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: battle.participant_count < battle.max_players
                ? '0 8px 20px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 8px 20px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              {battle.participant_count < battle.max_players ? (
                <><Users className="w-4 h-4" /><span className="text-sm">Rejoindre</span></>
              ) : (
                <><Eye className="w-4 h-4" /><span className="text-sm">Regarder</span></>
              )}
            </div>
          </motion.button>
        </div>

        {/* Layout Mobile - Compact */}
        <div className="md:hidden">
          {/* Ligne 1: Mode + Prix */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ModeIcon
                className={`w-5 h-5 flex-shrink-0 ${modeConfig.color} ${modeConfig.darkColor}`}
                style={{ filter: `drop-shadow(0 2px 6px ${modeConfig.hexColor}60)` }}
              />
              <div
                className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
                style={{
                  color: modeConfig.hexColor,
                  border: `1.5px solid ${modeConfig.hexColor}`,
                  boxShadow: `0 0 12px ${modeConfig.hexColor}60`,
                  textShadow: `0 0 8px ${modeConfig.hexColor}`,
                }}
              >
                {modeConfig.label}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <img
                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                alt="Coins"
                className="w-5 h-5 object-contain"
              />
              <span className="text-lg font-bold text-success">{Math.floor(totalPrice)}</span>
              <span className="text-[10px] text-secondary">• {battle.total_boxes} boxes</span>
            </div>
          </div>

          {/* Ligne 2: Avatars + Boxes côte à côte */}
          <div className="flex items-center gap-2 mb-2">
            {/* Avatars */}
            <div className="relative rounded-lg overflow-visible flex-shrink-0">
              {battle.creator_banner && (
                <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden opacity-40" dangerouslySetInnerHTML={{ __html: battle.creator_banner }} />
              )}
              <div className="relative flex items-center gap-1.5 p-1" style={{ zIndex: 1 }}>
                {battle.participants.map((p) => (
                  <ParticipantAvatar key={p.id} participant={p} resolvedTheme={resolvedTheme} />
                ))}
                {Array.from({ length: emptySlots }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center border border-dashed"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                      borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                    }}
                  >
                    <span className="text-base font-light text-muted">+</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Boxes - scrollable */}
            <div ref={mobileScrollRef} className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1.5 py-2 px-1">
                {expandedBoxes.map((box, idx) => {
                  // current_box est 1-indexed: round 1 = current_box = 1
                  const currentBoxIndex = (battle.current_box || 1) - 1
                  // Si la battle est terminée, TOUTES les boxes sont ouvertes
                  const isOpened = battle.status === 'finished' || idx < currentBoxIndex
                  const isCurrentlyOpening = idx === currentBoxIndex && battle.status === 'active'
                  return (
                    <div
                      key={box.uniqueKey}
                      className="relative flex-shrink-0 cursor-pointer"
                      onClick={(e) => handleBoxClick(e, box)}
                    >
                      {isCurrentlyOpening && (
                        <motion.div
                          animate={{ y: [-4, 0, -4] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="absolute -top-3 left-0 right-0 flex justify-center z-10"
                        >
                          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 rotate-90" />
                        </motion.div>
                      )}
                      <img
                        src={box.box_image || '/mystery-box.png'}
                        alt={box.box_name}
                        loading="lazy"
                        className={`w-[72px] h-[72px] object-contain transition-all duration-300 ${
                          isOpened ? 'opacity-30 grayscale scale-90' : isCurrentlyOpening ? 'scale-105' : ''
                        }`}
                        style={{
                          filter: isOpened ? undefined : isCurrentlyOpening
                            ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))'
                            : undefined
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                        draggable={false}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Ligne 3: Bouton */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = battle.participant_count < battle.max_players ? `/battles/${battle.id}` : `/battles/${battle.id}?spectate=true`
            }}
            className="w-full py-2.5 rounded-lg font-bold text-white text-sm"
            style={{
              background: battle.participant_count < battle.max_players ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: battle.participant_count < battle.max_players
                ? '0 8px 20px rgba(16, 185, 129, 0.35)'
                : '0 8px 20px rgba(59, 130, 246, 0.35)'
            }}
          >
            <div className="flex items-center justify-center gap-2">
              {battle.participant_count < battle.max_players ? (
                <><Users className="w-4 h-4" /><span>Rejoindre</span></>
              ) : (
                <><Eye className="w-4 h-4" /><span>Regarder</span>
                </>
              )}
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>

    {/* Box Preview Modal */}
    <AnimatePresence>
      {previewBox && (
        <BoxPreviewModal
          lootBoxId={previewBox.lootBoxId}
          boxName={previewBox.boxName}
          boxImage={previewBox.boxImage}
          onClose={() => setPreviewBox(null)}
        />
      )}
    </AnimatePresence>
    </>
  )
})