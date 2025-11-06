'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import UpgradeModal from '@/app/components/UpgradeModal'
import ParticlesBackground from '@/app/components/affiliate/ParticlesBackground'
import {
  TrendingUp, Package, Sparkles, Trophy, Zap, Target, Star,
  Loader2, ChevronRight, Filter, Search, Grid3x3, List, Info
} from 'lucide-react'

interface InventoryItem {
  id: string
  quantity: number
  obtained_at: string
  items: {
    id: string
    name: string
    image_url?: string
    rarity: string
    market_value: number
  } | null
}

interface SelectedItem {
  id: string
  item_id: string
  name: string
  image_url?: string
  rarity: string
  market_value: number
}

export default function UpgradePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated && user) {
      loadInventory()
    }
  }, [authLoading, isAuthenticated, user])

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          id,
          quantity,
          obtained_at,
          items (
            id,
            name,
            image_url,
            rarity,
            market_value
          )
        `)
        .eq('user_id', user!.id)
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false })

      if (error) throw error
      setInventory((data as any) || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityConfig = (rarity: string) => {
    const configs: Record<string, { gradient: string; glow: string; text: string }> = {
      common: { gradient: 'from-gray-400 to-gray-600', glow: 'shadow-gray-500/30', text: 'text-gray-400' },
      rare: { gradient: 'from-blue-400 to-blue-600', glow: 'shadow-blue-500/40', text: 'text-blue-400' },
      epic: { gradient: 'from-purple-400 to-purple-600', glow: 'shadow-purple-500/40', text: 'text-purple-400' },
      legendary: { gradient: 'from-yellow-400 via-orange-500 to-red-500', glow: 'shadow-yellow-500/50', text: 'text-yellow-400' },
      mythic: { gradient: 'from-cyan-400 via-pink-500 to-purple-600', glow: 'shadow-pink-500/50', text: 'text-pink-400' },
    }
    return configs[rarity?.toLowerCase()] || configs.common
  }

  const filteredInventory = inventory.filter(item => {
    if (!item.items) return false
    const matchesSearch = item.items.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRarity = rarityFilter === 'all' || item.items.rarity === rarityFilter
    return matchesSearch && matchesRarity
  }).sort((a, b) => (b.items?.market_value || 0) - (a.items?.market_value || 0))

  // Calculer les statistiques
  const stats = {
    totalItems: filteredInventory.length,
    totalValue: filteredInventory.reduce((sum, item) => sum + (item.items?.market_value || 0), 0),
    avgValue: filteredInventory.length > 0
      ? filteredInventory.reduce((sum, item) => sum + (item.items?.market_value || 0), 0) / filteredInventory.length
      : 0,
    highestValue: filteredInventory.length > 0
      ? Math.max(...filteredInventory.map(item => item.items?.market_value || 0))
      : 0,
    rarityCount: filteredInventory.reduce((acc, item) => {
      const rarity = item.items?.rarity || 'common'
      acc[rarity] = (acc[rarity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const handleUpgradeClick = (item: InventoryItem) => {
    if (!item.items) return
    setSelectedItem({
      id: item.id,
      item_id: item.items.id,
      name: item.items.name,
      image_url: item.items.image_url,
      rarity: item.items.rarity,
      market_value: item.items.market_value
    })
    setUpgradeModalOpen(true)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" style={{ color: 'var(--hybrid-accent-primary)' }} />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Chargement de vos items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-16 transition-colors duration-300 relative overflow-hidden bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background avec ParticlesBackground */}
      <ParticlesBackground />

      {/* Gradient accent subtil pour thème clair */}
      <div className="fixed inset-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-300" style={{ zIndex: 1 }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at top left, rgba(var(--hybrid-accent-primary-rgb), 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(var(--hybrid-accent-secondary-rgb), 0.08) 0%, transparent 50%)
          `
        }} />
      </div>

      {/* Floating orbs animés */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-20"
            style={{
              width: `${200 + i * 50}px`,
              height: `${200 + i * 50}px`,
              background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
              left: `${i * 20}%`,
              top: `${i * 15}%`,
            }}
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -80, 60, 0],
              scale: [1, 1.2, 0.8, 1],
              opacity: [0.1, 0.3, 0.15, 0.1]
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 2
            }}
          />
        ))}
      </div>

      {/* Grid pattern animé */}
      <div className="fixed inset-0 pointer-events-none opacity-5 dark:opacity-10" style={{ zIndex: 1 }}>
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(var(--hybrid-accent-primary-rgb), 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--hybrid-accent-primary-rgb), 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '50px 50px']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center justify-center mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              {/* Orbiting particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos((i * Math.PI * 2) / 8) * 120],
                    y: [0, Math.sin((i * Math.PI * 2) / 8) * 120],
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut'
                  }}
                />
              ))}

              {/* Rotating glow ring 1 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-10 rounded-full opacity-25 blur-3xl"
                style={{
                  background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                }}
              />

              {/* Rotating glow ring 2 - opposite direction */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-8 rounded-full opacity-20 blur-2xl"
                style={{
                  background: `linear-gradient(45deg, var(--hybrid-accent-secondary), var(--hybrid-accent-primary))`
                }}
              />

              {/* Pulsing inner glow */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl blur-xl"
                style={{
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                }}
              />

              {/* Main icon container */}
              <motion.div
                animate={{
                  y: [-6, 6, -6],
                  rotateY: [0, 5, 0, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative p-8 rounded-3xl shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                  boxShadow: `0 25px 60px -12px rgba(var(--hybrid-accent-primary-rgb), 0.5)`
                }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 8, -8, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <TrendingUp className="w-20 h-20 text-white" strokeWidth={2.5} />
                </motion.div>

                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-3xl"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                />

                {/* Corner sparkles */}
                {[0, 1, 2, 3].map((corner) => (
                  <motion.div
                    key={corner}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{
                      top: corner < 2 ? '10%' : 'auto',
                      bottom: corner >= 2 ? '10%' : 'auto',
                      left: corner % 2 === 0 ? '10%' : 'auto',
                      right: corner % 2 === 1 ? '10%' : 'auto',
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: corner * 0.5
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-4 relative inline-block"
          >
            {/* Glow effect derrière le texte */}
            <motion.div
              className="absolute inset-0 blur-2xl opacity-30"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
              }}
            />

            <span className="relative z-10 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
              UPGRADE CENTER
            </span>

            {/* Animated sparkles around title - plus nombreuses */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${5 + i * 8}%`,
                  top: i % 2 === 0 ? '-15px' : 'auto',
                  bottom: i % 2 === 0 ? 'auto' : '-15px',
                }}
                animate={{
                  y: i % 2 === 0 ? [-8, 8, -8] : [8, -8, 8],
                  opacity: [0.2, 1, 0.2],
                  scale: [0.6, 1.4, 0.6],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 2 + i * 0.15,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--hybrid-accent-primary)' }} />
              </motion.div>
            ))}

            {/* Étoiles qui brillent */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute"
                style={{
                  left: `${10 + i * 12}%`,
                  top: i % 3 === 0 ? '-20px' : i % 3 === 1 ? '50%' : 'auto',
                  bottom: i % 3 === 2 ? '-20px' : 'auto',
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: 'easeInOut'
                }}
              >
                <Star className="w-4 h-4" style={{ color: 'var(--hybrid-accent-secondary)' }} />
              </motion.div>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-400 mb-8"
          >
            Sélectionnez un item et multipliez sa valeur avec des risques calculés
          </motion.p>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="inline-flex items-start gap-3 backdrop-blur-xl border-2 rounded-2xl px-6 py-4 mb-8 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--hybrid-bg-elevated)',
              borderColor: 'var(--hybrid-border-default)'
            }}
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 opacity-5" style={{
              background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
            }} />

            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 relative z-10" style={{ color: 'var(--hybrid-accent-primary)' }} />
            <div className="text-left relative z-10">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Système de multiplicateurs proportionnel
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Plus le multiplicateur est élevé, plus le risque est important. Le taux de réussite est calculé proportionnellement.
              </p>
            </div>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative inline-flex items-center gap-8 backdrop-blur-xl border-2 rounded-2xl px-8 py-5 overflow-hidden shadow-lg"
            style={{
              backgroundColor: 'var(--hybrid-bg-elevated)',
              borderColor: 'var(--hybrid-border-default)'
            }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            />

            <div className="relative text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--hybrid-accent-primary)' }} />
              </motion.div>
              <p className="text-2xl font-black" style={{ color: 'var(--hybrid-accent-primary)' }}>
                {filteredInventory.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Items disponibles</p>
            </div>

            <div className="h-12 w-px bg-gray-200 dark:bg-gray-800 relative" />

            <div className="relative text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--hybrid-accent-primary)' }} />
              </motion.div>
              <p className="text-2xl font-black" style={{ color: 'var(--hybrid-accent-primary)' }}>
                1.5x - 100x
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Multiplicateurs</p>
            </div>

            <div className="h-12 w-px bg-gray-200 dark:bg-gray-800 relative" />

            <div className="relative text-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <Target className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--hybrid-accent-primary)' }} />
              </motion.div>
              <p className="text-2xl font-black" style={{ color: 'var(--hybrid-accent-primary)' }}>
                Calculé
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Taux de réussite</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Detailed Statistics */}
        {filteredInventory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            {/* Total Value */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="backdrop-blur-xl border-2 rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
              style={{
                backgroundColor: 'var(--hybrid-bg-elevated)',
                borderColor: 'var(--hybrid-border-default)'
              }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl -z-10 transition-all duration-500"
              />

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Particules flottantes */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-2xl"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Package className="w-6 h-6 text-blue-500" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                  />
                </div>
                <motion.p
                  className="text-3xl font-black text-gray-900 dark:text-white mb-1"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stats.totalValue.toLocaleString()}
                </motion.p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Valeur totale (coins)</p>
              </div>
            </motion.div>

            {/* Average Value */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="backdrop-blur-xl border-2 rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
              style={{
                backgroundColor: 'var(--hybrid-bg-elevated)',
                borderColor: 'var(--hybrid-border-default)'
              }}
            >
              <motion.div
                className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl -z-10 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div
                className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-2xl"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <motion.div whileHover={{ rotate: 360, scale: 1.2 }} transition={{ duration: 0.5 }}>
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.3 }}
                    className="w-2 h-2 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"
                  />
                </div>
                <motion.p
                  className="text-3xl font-black text-gray-900 dark:text-white mb-1"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                >
                  {Math.round(stats.avgValue).toLocaleString()}
                </motion.p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Valeur moyenne</p>
              </div>
            </motion.div>

            {/* Highest Value */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.03, y: -8 }}
              className="backdrop-blur-xl border-2 rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
              style={{
                backgroundColor: 'var(--hybrid-bg-elevated)',
                borderColor: 'var(--hybrid-border-default)'
              }}
            >
              <motion.div
                className="absolute -inset-1 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl -z-10 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div
                className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/10 blur-2xl"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                  >
                    <Star className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.6 }}
                    className="w-2 h-2 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"
                  />
                </div>
                <motion.p
                  className="text-3xl font-black text-gray-900 dark:text-white mb-1"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                >
                  {stats.highestValue.toLocaleString()}
                </motion.p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Item le plus cher</p>
              </div>
            </motion.div>

            {/* Rarity Distribution */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="backdrop-blur-xl border-2 rounded-2xl p-5 relative overflow-hidden group"
              style={{
                backgroundColor: 'var(--hybrid-bg-elevated)',
                borderColor: 'var(--hybrid-border-default)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Trophy className="w-4 h-4 text-green-500" />
                  </motion.div>
                </div>
                <div className="flex gap-1 mb-2">
                  {Object.entries(stats.rarityCount).map(([rarity, count]) => {
                    const config = getRarityConfig(rarity)
                    return (
                      <motion.div
                        key={rarity}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className={`flex-1 h-8 rounded-t bg-gradient-to-t ${config.gradient} relative group/bar`}
                        style={{
                          height: `${Math.max(8, (count / stats.totalItems) * 40)}px`,
                          minHeight: '8px'
                        }}
                        title={`${rarity}: ${count}`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {rarity}: {count}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Distribution des raretés</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 backdrop-blur-xl border rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--hybrid-bg-elevated)',
            borderColor: 'var(--hybrid-border-default)'
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un item..."
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none transition-all"
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--hybrid-accent-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = ''}
              />
            </div>

            {/* Rarity filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'common', 'rare', 'epic', 'legendary', 'mythic'].map((rarity) => (
                <motion.button
                  key={rarity}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRarityFilter(rarity)}
                  className={`px-4 py-2 rounded-xl font-bold capitalize transition-all ${
                    rarityFilter === rarity
                      ? 'text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                  style={rarityFilter === rarity ? {
                    background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                    boxShadow: `0 4px 12px rgba(var(--hybrid-accent-primary-rgb), 0.3)`
                  } : {}}
                >
                  {rarity === 'all' ? 'Tous' : rarity}
                </motion.button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={viewMode === 'grid' ? {
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                } : {}}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'list' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={viewMode === 'list' ? {
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                } : {}}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Items grid */}
        {filteredInventory.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12'
              : 'space-y-3'
            }
          >
            {filteredInventory.map((item, index) => {
              if (!item.items) return null
              const config = getRarityConfig(item.items.rarity)

              return viewMode === 'grid' ? (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.01,
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.02
                  }}
                  onClick={() => handleUpgradeClick(item)}
                  className="group cursor-pointer"
                >
                  {/* Card simple et épurée */}
                  <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 group-hover:border-gray-300 dark:group-hover:border-gray-700 group-hover:shadow-xl">
                    {/* Subtle gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                    {/* Image container */}
                    <div className="relative aspect-square p-6 flex items-center justify-center">
                      <motion.img
                        src={item.items.image_url || ''}
                        alt={item.items.name}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPk9iamV0PC90ZXh0Pgo8L3N2Zz4K'
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                      {/* Rarity badge */}
                      <div className="flex items-center justify-center mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${config.text} bg-opacity-10`}
                          style={{ backgroundColor: `${config.gradient.split(' ')[1]}20` }}>
                          {item.items.rarity}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 text-center line-clamp-2 min-h-[2.5rem]">
                        {item.items.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <img
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="w-5 h-5 object-contain"
                        />
                        <span className="text-lg font-black text-gray-900 dark:text-white">
                          {item.items.market_value.toLocaleString()}
                        </span>
                      </div>

                      {/* Upgrade button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpgradeClick(item)
                        }}
                        className="w-full text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          UPGRADE
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ x: 8, scale: 1.02 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleUpgradeClick(item)}
                  className="group relative backdrop-blur-xl border-2 rounded-2xl p-6 cursor-pointer transition-all flex items-center gap-6 overflow-hidden shadow-lg hover:shadow-2xl"
                  style={{
                    backgroundColor: 'var(--hybrid-bg-elevated)',
                    borderColor: 'var(--hybrid-border-default)'
                  }}
                >
                  {/* Glow effect au hover */}
                  <motion.div
                    className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl -z-10 transition-all duration-500`}
                  />

                  {/* Animated background on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 0.6 }}
                  />

                  {/* Badge de rareté */}
                  <div className="absolute top-4 right-4 z-10">
                    <motion.div
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase backdrop-blur-sm border border-white/20`}
                      style={{
                        background: `linear-gradient(135deg, ${config.gradient.replace('from-', '').replace('to-', '').split(' ')[0]}, ${config.gradient.split(' ').pop()})`,
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <span className="text-white drop-shadow-lg">{item.items.rarity}</span>
                    </motion.div>
                  </div>

                  {/* Image avec bordure gradient */}
                  <div className={`relative w-24 h-24 bg-gradient-to-br ${config.gradient} p-1 rounded-2xl ${config.glow} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden">
                      {item.items.image_url ? (
                        <motion.img
                          src={item.items.image_url}
                          alt={item.items.name}
                          className="max-w-full max-h-full object-contain"
                          whileHover={{ scale: 1.15 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <Package className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="flex-1 relative z-10 min-w-0">
                    <h3 className="font-black text-gray-900 dark:text-white text-xl mb-2 truncate">
                      {item.items.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <motion.img
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                        alt="Coins"
                        className="w-6 h-6 object-contain"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                      <span className="text-2xl font-black bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                        {item.items.market_value.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Bouton upgrade - toujours visible en liste */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpgradeClick(item)
                      }}
                      className="relative text-white px-8 py-3 rounded-xl font-black text-base inline-flex items-center gap-2 overflow-hidden shadow-xl group/btn"
                      style={{
                        background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                        boxShadow: `0 8px 24px rgba(var(--hybrid-accent-primary-rgb), 0.3)`
                      }}
                    >
                      {/* Button shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                      />

                      {/* Glow particles */}
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"
                        animate={{
                          scale: [0, 3, 0],
                          opacity: [0, 0.8, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                      />

                      <TrendingUp className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">UPGRADE</span>
                      <Sparkles className="w-4 h-4 relative z-10" />
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 backdrop-blur-xl border-2 rounded-3xl shadow-xl relative overflow-hidden"
            style={{
              backgroundColor: 'var(--hybrid-bg-elevated)',
              borderColor: 'var(--hybrid-border-default)'
            }}
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 opacity-5" style={{
              background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
            }} />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            </motion.div>

            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 relative z-10">
              {searchTerm || rarityFilter !== 'all' ? 'Aucun item trouvé' : 'Votre inventaire est vide'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto relative z-10">
              {searchTerm || rarityFilter !== 'all'
                ? 'Essayez d\'ajuster vos filtres'
                : 'Ouvrez des loot boxes pour obtenir des items que vous pourrez améliorer'
              }
            </p>
            {!searchTerm && rarityFilter === 'all' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/boxes')}
                className="relative px-10 py-4 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                }}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                />
                <span className="relative z-10">Ouvrir des Loot Boxes</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => {
          setUpgradeModalOpen(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
        onSuccess={() => {
          loadInventory()
        }}
      />
    </div>
  )
}
