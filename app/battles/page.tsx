'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import PlayerHoverCard, { getAvatarFrameClasses } from '@/app/components/PlayerHoverCard'
import {
  Users, Eye, Bot, Crown, Zap, Target, Star, Trophy,
  RefreshCw, Shield, Plus, ChevronDown, Check, LayoutGrid, LayoutList, TrendingUp, X
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
    <div ref={dropdownRef} className="relative">
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
            className="absolute top-full mt-2 left-0 right-0 rounded-xl overflow-hidden z-50"
            style={{
              background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(248, 250, 252, 0.98)',
              boxShadow: resolvedTheme === 'dark'
                ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                : '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(20px)'
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{
          background: resolvedTheme === 'dark'
            ? 'rgba(30, 41, 59, 0.98)'
            : 'rgba(255, 255, 255, 0.98)',
          border: resolvedTheme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          boxShadow: resolvedTheme === 'dark'
            ? '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 24px 48px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="relative px-5 py-4 border-b" style={{
          borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'
        }}>
          <div className="flex items-center gap-4">
            <div
              className="relative w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{
                background: resolvedTheme === 'dark'
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(59, 130, 246, 0.08)',
                border: resolvedTheme === 'dark'
                  ? '1px solid rgba(59, 130, 246, 0.2)'
                  : '1px solid rgba(59, 130, 246, 0.15)'
              }}
            >
              <img
                src={boxImage || '/mystery-box.png'}
                alt={boxName}
                className="w-10 h-10 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-primary truncate">{boxName}</h3>
              <p className="text-xs text-secondary">{items.length} items disponibles</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
              }}
            >
              <X className="w-4 h-4 text-secondary" />
            </motion.button>
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
                            >
                              {item.probability < 1 ? item.probability.toFixed(2) : item.probability.toFixed(1)}%
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
      className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl overflow-hidden hover:scale-105 md:hover:scale-110 transition-transform ${
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
          <Bot className="w-5 h-5 md:w-7 md:h-7 text-white" />
        </div>
      ) : (
        <div className="w-full h-full rounded-lg overflow-hidden">
          <img
            src={participant.avatar_url || '/default-avatar.png'}
            alt={participant.username || 'Player'}
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

  // Live stats
  const [liveStats, setLiveStats] = useState({
    activeBattles: 0,
    totalPlayers: 0,
    totalValue: 0
  })

  const loadBattles = useCallback(async () => {
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
        setLiveStats({ activeBattles: 0, totalPlayers: 0, totalValue: 0 })
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

      // Calculer les stats live
      const totalPlayers = battlesWithData.reduce((sum, b) => sum + b.participant_count, 0)
      const totalValue = battlesWithData.reduce((sum, b) => sum + b.entry_cost, 0)
      setLiveStats({
        activeBattles: battlesWithData.length,
        totalPlayers,
        totalValue
      })

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

  const sortOptions = [
    { value: 'date-desc', label: 'Plus récent' },
    { value: 'date-asc', label: 'Plus ancien' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'price-asc', label: 'Prix croissant' }
  ]

  useEffect(() => {
    loadBattles()
  }, [loadBattles])

  return (
    <div className="min-h-screen bg-primary pt-20 pb-24 lg:pb-8">

      <div className="w-full max-w-full mx-auto px-4 lg:px-5 mb-7">
        {/* Header - Title + Live Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-primary">
              Batailles de Caisses
            </h1>
          </div>

          {/* Live Stats - Professional compact design */}
          <div className="hidden lg:flex items-center gap-1 p-1.5 rounded-2xl" style={{
            background: resolvedTheme === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
            border: resolvedTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: resolvedTheme === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            {/* Battles actives */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-default"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.08)'
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.1))',
                border: '1px solid rgba(234, 179, 8, 0.3)'
              }}>
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">Actives</span>
                <span className="text-lg font-black text-primary leading-none">{liveStats.activeBattles}</span>
              </div>
            </motion.div>

            <div className="w-px h-8 bg-border" />

            {/* Joueurs */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-default"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)'
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">Joueurs</span>
                <span className="text-lg font-black text-primary leading-none">{liveStats.totalPlayers}</span>
              </div>
            </motion.div>

            <div className="w-px h-8 bg-border" />

            {/* Valeur totale */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-default"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)'
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <img
                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                  alt="Coins"
                  className="w-4 h-4"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold">En jeu</span>
                <span className="text-lg font-black text-emerald-500 leading-none">{Math.floor(liveStats.totalValue).toLocaleString()}</span>
              </div>
            </motion.div>
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

                  <div className={`relative w-7 lg:w-9 h-4 lg:h-5 rounded-full transition-all ${
                    isActive ? 'bg-success' : 'bg-muted'
                  }`}>
                    <motion.div
                      animate={{ x: isActive ? 12 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-0.5 w-3 h-3 lg:w-4 lg:h-4 rounded-full shadow-md ${
                        isActive ? 'bg-white' : 'bg-muted-dark'
                      }`}
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

      <div className="w-full max-w-full mx-auto px-4 lg:px-6">
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

    </div>
  )
}

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
      transition={{ delay: index * 0.05 }}
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
        transition={{ duration: 0.3 }}
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

      <div className="relative z-10 p-3 md:p-6">
        {/* Layout Desktop - Horizontal */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-center gap-2 w-28 flex-shrink-0">
            <ModeIcon
              className={`w-12 h-12 ${modeConfig.color} ${modeConfig.darkColor}`}
              style={{ filter: `drop-shadow(0 4px 12px ${modeConfig.hexColor}60)` }}
            />
            <div
              className="relative px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase text-center w-full flex items-center justify-center"
              style={{
                color: modeConfig.hexColor,
                border: `2px solid ${modeConfig.hexColor}`,
                boxShadow: `0 0 20px ${modeConfig.hexColor}80, inset 0 0 20px ${modeConfig.hexColor}20`,
                textShadow: `0 0 10px ${modeConfig.hexColor}`,
              }}
            >
              {modeConfig.label}
            </div>
            {/* Battle Format Badge */}
            <div
              className="px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                color: resolvedTheme === 'dark' ? '#93c5fd' : '#3b82f6',
                border: resolvedTheme === 'dark' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              {getBattleFormat(battle.participants, battle.max_players).format}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px]">
            <div className="flex items-center gap-2">
              <img
                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                alt="Coins"
                className="w-8 h-8 object-contain"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(234, 179, 8, 0.4))' }}
              />
              <span className="text-2xl font-bold text-success">{Math.floor(totalPrice)}</span>
            </div>
            <div className="text-xs text-secondary font-medium">{battle.total_boxes} boxes à ouvrir</div>
          </div>

          <div className="w-px h-16 rounded-full" style={{
            background: resolvedTheme === 'dark'
              ? 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
              : 'linear-gradient(to bottom, transparent, rgba(100, 116, 139, 0.2), transparent)'
          }} />

          <div className="relative px-2 py-3 rounded-lg overflow-visible">
            {battle.creator_banner && (
              <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden opacity-50" dangerouslySetInnerHTML={{ __html: battle.creator_banner }} />
            )}
            <div className="relative flex items-center gap-3 px-1 py-1 overflow-visible" style={{ zIndex: 1 }}>
              {battle.participants.map((p) => (
                <ParticipantAvatar key={p.id} participant={p} resolvedTheme={resolvedTheme} />
              ))}
              {Array.from({ length: emptySlots }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-dashed"
                  style={{
                    background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                    borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                  }}
                >
                  <span className="text-2xl font-light text-muted">+</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-px h-16 rounded-full" style={{
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
            <div className="flex items-center gap-3 pb-2">
              {expandedBoxes.map((box, idx) => (
                <div
                  key={box.uniqueKey}
                  className="relative group/box flex-shrink-0 cursor-pointer"
                  onClick={(e) => handleBoxClick(e, box)}
                >
                  <img
                    src={box.box_image || '/mystery-box.png'}
                    alt={box.box_name}
                    className={`w-20 h-20 object-contain transition-all pointer-events-none ${
                      idx < (battle.current_box || 0) ? 'opacity-30 grayscale' : 'opacity-100 group-hover/box:scale-110'
                    }`}
                    style={{ filter: idx < (battle.current_box || 0) ? undefined : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = battle.participant_count < battle.max_players ? `/battles/${battle.id}` : `/battles/${battle.id}?spectate=true`
            }}
            className="px-6 py-4 rounded-xl font-bold text-white min-w-[120px]"
            style={{
              background: battle.participant_count < battle.max_players ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: battle.participant_count < battle.max_players
                ? '0 12px 28px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 12px 28px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              {battle.participant_count < battle.max_players ? (
                <><Users className="w-5 h-5" /><span>Rejoindre</span></>
              ) : (
                <><Eye className="w-5 h-5" /><span>Regarder</span></>
              )}
            </div>
          </motion.button>
        </div>

        {/* Layout Mobile - Compact */}
        <div className="md:hidden">
          {/* Ligne 1: Mode + Format + Prix */}
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
              {/* Battle Format Badge Mobile */}
              <div
                className="px-2 py-0.5 rounded text-[9px] font-bold"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                  color: resolvedTheme === 'dark' ? '#93c5fd' : '#3b82f6',
                }}
              >
                {getBattleFormat(battle.participants, battle.max_players).format}
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
                    className="w-10 h-10 rounded-lg flex items-center justify-center border border-dashed"
                    style={{
                      background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                      borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                    }}
                  >
                    <span className="text-lg font-light text-muted">+</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Boxes - scrollable */}
            <div ref={mobileScrollRef} className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1.5">
                {expandedBoxes.map((box, idx) => (
                  <div
                    key={box.uniqueKey}
                    className="flex-shrink-0 cursor-pointer"
                    onClick={(e) => handleBoxClick(e, box)}
                  >
                    <img
                      src={box.box_image || '/mystery-box.png'}
                      alt={box.box_name}
                      className={`w-12 h-12 object-contain ${idx < (battle.current_box || 0) ? 'opacity-30 grayscale' : ''}`}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                      draggable={false}
                    />
                  </div>
                ))}
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