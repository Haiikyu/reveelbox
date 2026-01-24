'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import PlayerHoverCard, { getAvatarFrameClasses } from '@/app/components/PlayerHoverCard'
import {
  Users, Eye, Bot, Crown, Zap, Target, Star, Trophy,
  RefreshCw, Shield, Plus, ChevronDown, Check, LayoutGrid, LayoutList, TrendingUp
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

// Participant Avatar Component using PlayerHoverCard
function ParticipantAvatar({
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
      className={`w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl overflow-hidden hover:scale-110 transition-transform ${
        !participant.is_bot ? 'cursor-help ' + getAvatarFrameClasses(participant.avatar_frame || 'default') : 'cursor-default'
      }`}
      style={participant.is_bot ? {
        boxShadow: resolvedTheme === 'dark'
          ? '0 8px 16px rgba(0, 0, 0, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.1)'
          : '0 8px 16px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(0, 0, 0, 0.05)'
      } : undefined}
    >
      {participant.is_bot ? (
        <div className="w-full h-full flex items-center justify-center bg-accent rounded-lg">
          <Bot className="w-7 h-7 text-white" />
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
}

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
        return
      }

      const battlesWithData = await Promise.all(
        battlesData.map(async (battle) => {
          // Fetch creator's banner
          let creatorBanner = null
          if (battle.created_by) {
            const { data: bannerData, error: bannerError } = await supabase
              .from('user_banners')
              .select(`
                banner_id,
                shop_banners (
                  svg_code
                )
              `)
              .eq('user_id', battle.created_by)
              .eq('is_equipped', true)
              .single()

            if (bannerData) {
              const shopBanners = bannerData.shop_banners as unknown as { svg_code: string } | null
              if (shopBanners && !Array.isArray(shopBanners) && shopBanners.svg_code) {
                creatorBanner = shopBanners.svg_code
              }
            }
          }

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
                  .select('username, avatar_url, theme, level, consecutive_days, total_exp, virtual_currency')
                  .eq('id', participant.user_id)
                  .single()

                // Récupérer la bannière du participant
                let bannerSvg = null
                const { data: bannerData } = await supabase
                  .from('user_banners')
                  .select('banner_id, shop_banners(svg_code)')
                  .eq('user_id', participant.user_id)
                  .eq('is_equipped', true)
                  .single()

                if (bannerData) {
                  const shopBanners = bannerData.shop_banners as unknown as { svg_code: string } | null
                  if (shopBanners && !Array.isArray(shopBanners) && shopBanners.svg_code) {
                    bannerSvg = shopBanners.svg_code
                  }
                }

                // Récupérer les pins équipés
                const { data: pinsData } = await supabase
                  .from('user_pins')
                  .select('pin_id, shop_pins(svg_code)')
                  .eq('user_id', participant.user_id)
                  .eq('is_equipped', true)
                  .limit(4)

                const pins = (pinsData || [])
                  .filter((item): item is typeof item & { shop_pins: { svg_code: any } } =>
                    item.shop_pins !== null && !Array.isArray(item.shop_pins)
                  )
                  .map(item => ({ svg_code: item.shop_pins.svg_code }))

                return {
                  ...participant,
                  username: profile?.username,
                  avatar_url: profile?.avatar_url,
                  avatar_frame: (profile?.theme as any)?.avatar_frame || 'default',
                  level: profile?.level,
                  consecutive_days: profile?.consecutive_days,
                  total_exp: profile?.total_exp,
                  virtual_currency: profile?.virtual_currency,
                  banner_svg: bannerSvg,
                  pins: pins
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
            battle_boxes,
            creator_banner: creatorBanner
          }
        })
      )

      setBattles(battlesWithData)

      // Calculate live stats
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
    <div className="min-h-screen bg-primary pt-20">

      <div className="w-full max-w-full mx-auto px-5 mb-7">
        <div className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-primary">
                Batailles de Caisses
              </h1>
            </div>

            {/* Live Stats - Flottants */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  boxShadow: resolvedTheme === 'dark'
                    ? '0 12px 24px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 12px 24px rgba(234, 179, 8, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-default"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.95)',
                  boxShadow: resolvedTheme === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
              >
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-secondary font-medium">Battles actives</span>
                  <span className="text-xl font-bold text-primary">{liveStats.activeBattles}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  boxShadow: resolvedTheme === 'dark'
                    ? '0 12px 24px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 12px 24px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-default"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.95)',
                  boxShadow: resolvedTheme === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
              >
                <Users className="w-5 h-5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-secondary font-medium">Joueurs</span>
                  <span className="text-xl font-bold text-primary">{liveStats.totalPlayers}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  boxShadow: resolvedTheme === 'dark'
                    ? '0 12px 24px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 12px 24px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-default"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.95)',
                  boxShadow: resolvedTheme === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
              >
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-secondary font-medium">Valeur totale</span>
                  <span className="text-xl font-bold text-success">{Math.floor(liveStats.totalValue).toLocaleString()}</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{
              background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.8)'
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
                <LayoutList className="w-5 h-5" />
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
                <LayoutGrid className="w-5 h-5" />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/battles/create'}
              className="px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 text-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: resolvedTheme === 'dark'
                  ? '0 12px 28px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                  : '0 12px 28px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <Plus className="w-5 h-5" />
              <span>Créer Battle</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowReadyOnly(!showReadyOnly)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: showReadyOnly
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                color: showReadyOnly ? 'white' : resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
                boxShadow: showReadyOnly
                  ? '0 8px 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : resolvedTheme === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              {showReadyOnly ? 'Prêt à rejoindre' : 'Toutes'}
            </motion.button>

            <CustomDropdown
              value={sortBy}
              onChange={(value) => setSortBy(value as any)}
              options={sortOptions}
            />

            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadBattles}
              disabled={loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                boxShadow: resolvedTheme === 'dark'
                  ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
                opacity: loading ? 0.5 : 1
              }}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium text-secondary">
            Players
          </span>
          {[2, 3, 4, 5, 6].map((count) => (
            <motion.button
              key={count}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPlayerFilter(playerFilter === count ? null : count)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: playerFilter === count
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                  : resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                color: playerFilter === count ? 'white' : resolvedTheme === 'dark' ? '#d1d5db' : '#374151',
                boxShadow: playerFilter === count
                  ? '0 8px 16px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  : resolvedTheme === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              {count}
            </motion.button>
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
          <div className={viewMode === 'compact' ? 'grid grid-cols-2 gap-4 pb-8' : 'space-y-4 pb-8'}>
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
          <div className={viewMode === 'compact' ? 'grid grid-cols-2 gap-6 pb-8 overflow-visible' : 'space-y-6 pb-8 overflow-visible'}>
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

function MinimalBattleCard({ battle, index, viewMode = 'extended' }: {
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
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: viewMode === 'extended' ? -6 : -3 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onClick={() => window.location.href = `/battles/${battle.id}`}
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

      <div className="relative z-10 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">

          <div className="flex md:flex-col items-center gap-2 md:gap-3">
            {/* MODE ICON - Sans conteneur */}
            <ModeIcon
              className={`w-10 h-10 md:w-12 md:h-12 ${modeConfig.color} ${modeConfig.darkColor}`}
              style={{
                filter: `drop-shadow(0 4px 12px ${modeConfig.hexColor}60)`
              }}
            />

            {/* MODE BADGE - Avec effet néon */}
            <div
              className="relative px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
              style={{
                background: 'transparent',
                color: modeConfig.hexColor,
                border: `2px solid ${modeConfig.hexColor}`,
                boxShadow: `0 0 20px ${modeConfig.hexColor}80, inset 0 0 20px ${modeConfig.hexColor}20`,
                textShadow: `0 0 10px ${modeConfig.hexColor}`,
              }}
            >
              {modeConfig.label}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-[120px] md:min-w-[140px]">
            <div className="flex items-center gap-2">
              {/* COIN ICON - Flottant sans conteneur */}
              <img
                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                alt="Coins"
                className="w-5 h-5 md:w-6 md:h-6 object-contain"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(234, 179, 8, 0.4))'
                }}
              />
              <span className="text-xl md:text-2xl font-bold text-success">
                {Math.floor(totalPrice)}
              </span>
            </div>
            <div className="text-xs text-secondary font-medium">
              {battle.total_boxes} boxes à ouvrir
            </div>
          </div>

          <div
            className="hidden md:block w-px h-16 rounded-full"
            style={{
              background: resolvedTheme === 'dark'
                ? 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
                : 'linear-gradient(to bottom, transparent, rgba(100, 116, 139, 0.2), transparent)'
            }}
          />

          {/* Avatar zone with creator banner background */}
          <div className="relative px-1 md:px-2 py-3 rounded-lg w-full md:w-auto overflow-visible">
            {/* Creator banner background at 50% opacity */}
            {battle.creator_banner && (
              <div
                className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
                style={{
                  opacity: 0.5,
                  zIndex: 0
                }}
                dangerouslySetInnerHTML={{ __html: battle.creator_banner }}
              />
            )}

            {/* Avatars (relative to show above banner) - padding added to prevent border clipping */}
            <div className="relative flex items-center gap-2 md:gap-3 px-1 py-1 overflow-visible" style={{ zIndex: 1 }}>
              {battle.participants.map((p) => (
                <ParticipantAvatar
                  key={p.id}
                  participant={p}
                  resolvedTheme={resolvedTheme}
                />
              ))}

              {Array.from({ length: emptySlots }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center hover:scale-110 transition-all border-2 border-dashed"
                  style={{
                    background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                    boxShadow: resolvedTheme === 'dark'
                      ? 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(148, 163, 184, 0.2)'
                      : 'inset 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(100, 116, 139, 0.2)',
                    borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                  }}
                >
                  <span className="text-xl md:text-2xl font-light text-muted">+</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="hidden md:block w-px h-16 rounded-full"
            style={{
              background: resolvedTheme === 'dark'
                ? 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
                : 'linear-gradient(to bottom, transparent, rgba(100, 116, 139, 0.2), transparent)'
            }}
          />

          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide select-none w-full md:w-auto"
            onMouseDown={handleDragStart}
            onMouseLeave={handleDragEnd}
            onMouseUp={handleDragEnd}
            onMouseMove={handleDragMove}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div className="flex items-center gap-2 md:gap-3 pb-2">
              {expandedBoxes.map((box, idx) => {
                const isOpened = idx < (battle.current_box || 0)
                return (
                  <div
                    key={box.uniqueKey}
                    className="relative group/box flex-shrink-0"
                  >
                    <img
                      src={box.box_image || '/mystery-box.png'}
                      alt={box.box_name}
                      className={`w-16 h-16 md:w-20 md:h-20 object-contain transition-all pointer-events-none ${
                        isOpened ? 'opacity-30 grayscale' : 'opacity-100 group-hover/box:scale-110'
                      }`}
                      style={{
                        filter: isOpened ? undefined : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/mystery-box.png'
                      }}
                      draggable={false}
                    />
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
              const url = battle.participant_count < battle.max_players
                ? `/battles/${battle.id}`
                : `/battles/${battle.id}?spectate=true`
              window.location.href = url
            }}
            className="px-4 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-white min-w-[100px] md:min-w-[120px] w-full md:w-auto mt-3 md:mt-0"
            style={{
              background: battle.participant_count < battle.max_players
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: battle.participant_count < battle.max_players
                ? resolvedTheme === 'dark'
                  ? '0 12px 28px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                  : '0 12px 28px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
                : resolvedTheme === 'dark'
                  ? '0 12px 28px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                  : '0 12px 28px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
            }}
            aria-label={battle.participant_count < battle.max_players ? 'Rejoindre la bataille' : 'Regarder la bataille'}
          >
            <div className="flex flex-row md:flex-col items-center justify-center gap-2">
              {battle.participant_count < battle.max_players ? (
                <>
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Rejoindre</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Regarder</span>
                </>
              )}
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}