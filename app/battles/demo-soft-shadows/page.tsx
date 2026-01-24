'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/app/components/ThemeProvider'
import {
  Users, Eye, Bot, Crown, Zap, Target, Star, Trophy, Shield,
  RefreshCw, Plus, ArrowLeft, ChevronDown, Check
} from 'lucide-react'

// Mock battles data
const mockBattles = [
  {
    id: '1',
    name: 'Epic Battle',
    mode: 'classic',
    max_players: 4,
    entry_cost: 350,
    total_boxes: 10,
    current_box: 0,
    status: 'waiting',
    participants: [
      { id: '1', is_bot: false, username: 'Player1', avatar_url: 'https://i.pravatar.cc/150?img=1' },
      { id: '2', is_bot: false, username: 'Player2', avatar_url: 'https://i.pravatar.cc/150?img=2' },
    ],
    battle_boxes: [
      { loot_box_id: '1', box_image: 'https://placehold.co/100x100/667eea/white?text=Box1', box_name: 'Box 1', quantity: 3, price_virtual: 35 },
      { loot_box_id: '2', box_image: 'https://placehold.co/100x100/f093fb/white?text=Box2', box_name: 'Box 2', quantity: 2, price_virtual: 62 },
      { loot_box_id: '3', box_image: 'https://placehold.co/100x100/4facfe/white?text=Box3', box_name: 'Box 3', quantity: 1, price_virtual: 158 },
    ]
  },
  {
    id: '2',
    name: 'Crazy Mode',
    mode: 'crazy',
    max_players: 2,
    entry_cost: 150,
    total_boxes: 5,
    current_box: 0,
    status: 'waiting',
    participants: [
      { id: '3', is_bot: false, username: 'Player3', avatar_url: 'https://i.pravatar.cc/150?img=3' },
    ],
    battle_boxes: [
      { loot_box_id: '4', box_image: 'https://placehold.co/100x100/667eea/white?text=Box', box_name: 'Box', quantity: 2, price_virtual: 50 },
      { loot_box_id: '5', box_image: 'https://placehold.co/100x100/f093fb/white?text=Box', box_name: 'Box', quantity: 3, price_virtual: 33.33 },
    ]
  },
  {
    id: '3',
    name: 'Fast & Furious',
    mode: 'fast',
    max_players: 6,
    entry_cost: 800,
    total_boxes: 15,
    current_box: 0,
    status: 'waiting',
    participants: [
      { id: '4', is_bot: false, username: 'Player4', avatar_url: 'https://i.pravatar.cc/150?img=4' },
      { id: '5', is_bot: false, username: 'Player5', avatar_url: 'https://i.pravatar.cc/150?img=5' },
      { id: '6', is_bot: false, username: 'Player6', avatar_url: 'https://i.pravatar.cc/150?img=6' },
      { id: '7', is_bot: false, username: 'Player7', avatar_url: 'https://i.pravatar.cc/150?img=7' },
    ],
    battle_boxes: [
      { loot_box_id: '6', box_image: 'https://placehold.co/100x100/667eea/white?text=Box', box_name: 'Box', quantity: 5, price_virtual: 100 },
      { loot_box_id: '7', box_image: 'https://placehold.co/100x100/f093fb/white?text=Box', box_name: 'Box', quantity: 10, price_virtual: 30 },
    ]
  },
]

const MODE_CONFIGS = {
  classic: { icon: Crown, label: 'Classic', color: 'text-blue-500', darkColor: 'dark:text-blue-400', hexColor: '#3b82f6' },
  crazy: { icon: Zap, label: 'Crazy', color: 'text-purple-500', darkColor: 'dark:text-purple-400', hexColor: '#a855f7' },
  shared: { icon: Users, label: 'Shared', color: 'text-green-500', darkColor: 'dark:text-green-400', hexColor: '#22c55e' },
  fast: { icon: Trophy, label: 'Fast', color: 'text-orange-500', darkColor: 'dark:text-orange-400', hexColor: '#f97316' },
  jackpot: { icon: Target, label: 'Jackpot', color: 'text-yellow-500', darkColor: 'dark:text-yellow-400', hexColor: '#eab308' },
  terminal: { icon: Star, label: 'Terminal', color: 'text-red-500', darkColor: 'dark:text-red-400', hexColor: '#ef4444' },
  clutch: { icon: Shield, label: 'Clutch', color: 'text-pink-500', darkColor: 'dark:text-pink-400', hexColor: '#ec4899' }
}

// Custom Dropdown Component
function CustomDropdown({ value, onChange, options }: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
        className="px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2 min-w-[160px] justify-between"
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
            className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50"
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

export default function BattlesSoftShadowsDemo() {
  const { resolvedTheme } = useTheme()
  const [sortBy, setSortBy] = useState('date-desc')
  const [playerFilter, setPlayerFilter] = useState<number | null>(null)
  const [showReadyOnly, setShowReadyOnly] = useState(false)
  const [hiddenModes, setHiddenModes] = useState<Set<string>>(new Set())

  const topBattles = useMemo(() => {
    return [...mockBattles]
      .sort((a, b) => b.entry_cost - a.entry_cost)
      .slice(0, 5)
      .map((battle, i) => ({
        name: battle.name,
        power: Math.floor(battle.entry_cost),
        rank: i + 1,
        mode: battle.mode
      }))
  }, [])

  const sortOptions = [
    { value: 'date-desc', label: 'Plus récent' },
    { value: 'date-asc', label: 'Plus ancien' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'price-asc', label: 'Prix croissant' }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: resolvedTheme === 'dark'
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #312e81 50%, #1e293b 75%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 25%, #ddd6fe 50%, #e0e7ff 75%, #f8fafc 100%)'
    }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Subtle Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: resolvedTheme === 'dark'
            ? 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)'
            : 'radial-gradient(circle at 2px 2px, rgba(0, 0, 0, 0.1) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-20 left-10 w-[600px] h-[600px] rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: resolvedTheme === 'dark'
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: resolvedTheme === 'dark'
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%)',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full blur-3xl"
          animate={{
            x: [-200, -150, -200],
            y: [-200, -150, -200],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: resolvedTheme === 'dark'
              ? 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(147, 197, 253, 0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 pt-32 pb-6"
        style={{
          background: resolvedTheme === 'dark'
            ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.85) 100%)'
            : 'linear-gradient(to bottom, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.85) 100%)',
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
        }}
      >
        <div className="w-full max-w-full mx-auto px-6">

          {/* Back Button */}
          <div className="mb-6">
            <motion.button
              onClick={() => window.location.href = '/battles'}
              whileHover={{ scale: 1.02, x: -4 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium text-secondary hover:text-primary transition-colors"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.8)',
                boxShadow: resolvedTheme === 'dark'
                  ? '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  : '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour aux battles</span>
            </motion.button>
          </div>

          {/* Title + Create Button Row */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <h1 className="text-5xl font-black mb-2 relative inline-block">
                <span
                  className="relative z-10"
                  style={{
                    background: resolvedTheme === 'dark'
                      ? 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)'
                      : 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: resolvedTheme === 'dark' ? '0 0 40px rgba(168, 85, 247, 0.3)' : 'none'
                  }}
                >
                  CASE BATTLE
                </span>
                <motion.div
                  className="absolute -inset-2 rounded-2xl opacity-20 blur-xl"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
                  }}
                />
              </h1>
              <p className="text-sm text-secondary flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-green-500"
                />
                Démo Soft Shadows - Design Visionnaire
              </p>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/battles/create'}
              className="px-8 py-4 rounded-2xl font-bold text-white flex items-center gap-3 text-lg"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: resolvedTheme === 'dark'
                  ? '0 12px 28px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                  : '0 12px 28px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <Plus className="w-6 h-6" />
              <span>Créer Battle</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="w-full max-w-full mx-auto px-6 pt-6 pb-4 relative z-30">
        <div className="flex items-center justify-between gap-4">
          {/* Mode Filters - Left */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(MODE_CONFIGS).map(([mode, config]) => {
              const Icon = config.icon
              const isActive = !hiddenModes.has(mode)

              return (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const newSet = new Set(hiddenModes)
                    if (newSet.has(mode)) {
                      newSet.delete(mode)
                    } else {
                      newSet.add(mode)
                    }
                    setHiddenModes(newSet)
                  }}
                  className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                    boxShadow: resolvedTheme === 'dark'
                      ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                  }}
                >
                  <Icon className={`w-4 h-4 ${config.color} ${config.darkColor}`} />
                  <span className="text-primary">{config.label}</span>

                  <div className={`relative w-9 h-5 rounded-full transition-all ${isActive ? 'bg-success' : 'bg-muted'}`}>
                    <motion.div
                      animate={{ x: isActive ? 16 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-0.5 w-4 h-4 rounded-full shadow-md ${isActive ? 'bg-white' : 'bg-muted-dark'}`}
                    />
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Action Filters - Right */}
          <div className="flex items-center gap-3">
            {/* Player Count Filters */}
            <div className="flex items-center gap-2">
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

            {/* Ready Toggle */}
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

            {/* Sort Dropdown */}
            <CustomDropdown
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.98 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                boxShadow: resolvedTheme === 'dark'
                  ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                color: resolvedTheme === 'dark' ? '#d1d5db' : '#374151'
              }}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Battle Cards */}
      <div className="w-full max-w-full mx-auto px-6 pt-4">
        <div className="space-y-4 pb-8">
          {mockBattles.map((battle, index) => (
            <BattleCard key={battle.id} battle={battle} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Battle Card Component (unchanged from actual page)
function BattleCard({ battle, index }: { battle: any; index: number }) {
  const { resolvedTheme } = useTheme()
  const modeConfig = MODE_CONFIGS[battle.mode as keyof typeof MODE_CONFIGS] || MODE_CONFIGS.classic
  const ModeIcon = modeConfig.icon
  const emptySlots = battle.max_players - battle.participants.length

  const totalPrice = battle.battle_boxes.reduce((sum: number, box: any) => {
    return sum + (box.price_virtual * box.quantity)
  }, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{
        y: -6,
        boxShadow: resolvedTheme === 'dark'
          ? '0 32px 64px -12px rgba(0, 0, 0, 0.6)'
          : '0 32px 64px -12px rgba(0, 0, 0, 0.25)'
      }}
      onClick={() => window.location.href = `/battles/${battle.id}?spectate=true`}
      className="relative rounded-[28px] overflow-hidden cursor-pointer"
      style={{
        background: resolvedTheme === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.95)',
        boxShadow: resolvedTheme === 'dark'
          ? '0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)'
          : '0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: resolvedTheme === 'dark'
            ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)'
        }}
      />

      <div className="relative z-10 p-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative flex items-center justify-center w-16 h-16 rounded-xl"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
                boxShadow: resolvedTheme === 'dark'
                  ? '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                  : '0 8px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
              }}
            >
              <ModeIcon className={`w-8 h-8 ${modeConfig.color} ${modeConfig.darkColor}`} />
            </div>

            <div
              className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                background: resolvedTheme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                color: modeConfig.hexColor,
                boxShadow: `0 4px 12px ${modeConfig.hexColor}50, inset 0 1px 0 ${
                  resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'
                }, 0 0 0 1px ${modeConfig.hexColor}60`
              }}
            >
              {modeConfig.label}
            </div>
          </div>

          <div className="flex flex-col gap-1 min-w-[140px]">
            <div className="text-sm font-semibold text-secondary tracking-wide">
              {modeConfig.label.toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-lg"
                style={{
                  background: resolvedTheme === 'dark'
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))'
                    : 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))',
                  boxShadow: resolvedTheme === 'dark' ? 'inset 0 2px 4px rgba(0, 0, 0, 0.2)' : 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                <img
                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                  alt="Coins"
                  className="w-5 h-5 object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-success">{Math.floor(totalPrice)}</span>
            </div>
            <div className="text-xs text-secondary font-medium">{battle.total_boxes} boxes à ouvrir</div>
          </div>

          <div
            className="w-px h-16 rounded-full"
            style={{
              background: resolvedTheme === 'dark'
                ? 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
                : 'linear-gradient(to bottom, transparent, rgba(100, 116, 139, 0.2), transparent)'
            }}
          />

          <div className="flex items-center gap-2">
            {battle.participants.map((p: any) => (
              <div
                key={p.id}
                className="w-14 h-14 rounded-xl overflow-hidden hover:scale-110 transition-transform"
                style={{
                  boxShadow: resolvedTheme === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.4), 0 0 0 3px rgba(255, 255, 255, 0.1)'
                    : '0 8px 16px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                {p.is_bot ? (
                  <div className="w-full h-full flex items-center justify-center bg-accent">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                ) : (
                  <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                )}
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-14 h-14 rounded-xl flex items-center justify-center hover:scale-110 transition-all border-2 border-dashed"
                style={{
                  background: resolvedTheme === 'dark' ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                  boxShadow: resolvedTheme === 'dark'
                    ? 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(148, 163, 184, 0.2)'
                    : 'inset 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(100, 116, 139, 0.2)',
                  borderColor: resolvedTheme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)'
                }}
              >
                <span className="text-2xl font-light text-muted">+</span>
              </div>
            ))}
          </div>

          <div
            className="w-px h-16 rounded-full"
            style={{
              background: resolvedTheme === 'dark'
                ? 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
                : 'linear-gradient(to bottom, transparent, rgba(100, 116, 139, 0.2), transparent)'
            }}
          />

          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 pb-2">
              {battle.battle_boxes.map((box: any) => (
                <div key={box.loot_box_id} className="relative group/box flex-shrink-0">
                  <img
                    src={box.box_image}
                    alt={box.box_name}
                    className="w-24 h-24 object-contain group-hover/box:scale-110 transition-transform"
                    style={{
                      filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))'
                    }}
                  />
                  {box.quantity > 1 && (
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                        boxShadow: resolvedTheme === 'dark'
                          ? '0 4px 12px rgba(168, 85, 247, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                          : '0 4px 12px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {box.quantity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = `/battles/${battle.id}?spectate=true`
            }}
            className="px-6 py-4 rounded-xl font-bold text-white min-w-[120px]"
            style={{
              background:
                battle.participants.length < battle.max_players
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow:
                battle.participants.length < battle.max_players
                  ? resolvedTheme === 'dark'
                    ? '0 12px 28px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                    : '0 12px 28px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
                  : resolvedTheme === 'dark'
                  ? '0 12px 28px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                  : '0 12px 28px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex flex-col items-center gap-2">
              {battle.participants.length < battle.max_players ? (
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
