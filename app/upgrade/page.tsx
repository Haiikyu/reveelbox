'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import UpgradeModal from '@/app/components/UpgradeModal'
import {
  TrendingUp, Package, Sparkles, Trophy, Zap, Target, Star,
  Loader2, ChevronRight, Filter, Search, Grid3x3, List
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

export default function UpgradePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-900 pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading your items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-900 pt-32 pb-16">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500/20 rounded-full blur-3xl"
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
              <motion.div
                animate={{
                  rotate: 360
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full opacity-20 blur-xl"
              />
              <div className="relative p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl shadow-purple-500/50">
                <TrendingUp className="w-16 h-16 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-black text-white mb-4 flex items-center justify-center gap-4"
          >
            UPGRADE CENTER
            <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 mb-8"
          >
            Select an item and multiply its value with calculated risks
          </motion.p>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-4"
          >
            <div className="text-center">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {filteredInventory.length}
              </p>
              <p className="text-xs text-gray-500">Available Items</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                100x
              </p>
              <p className="text-xs text-gray-500">Max Multiplier</p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-green-400">
                5-95%
              </p>
              <p className="text-xs text-gray-500">Success Range</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {rarity}
                </motion.button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
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
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'space-y-3'
            }
          >
            {filteredInventory.map((item, index) => {
              if (!item.items) return null
              const config = getRarityConfig(item.items.rarity)

              return viewMode === 'grid' ? (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => handleUpgradeClick(item)}
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-2xl"
                  style={{ boxShadow: `0 10px 40px ${config.glow.replace('shadow-', 'rgba(')}` }}
                >
                  {/* Rarity border */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-20 transition-opacity`} />

                  {/* Image container */}
                  <div className="aspect-square p-6 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                    {item.items.image_url ? (
                      <img
                        src={item.items.image_url}
                        alt={item.items.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-gray-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 border-t border-white/10">
                    <h3 className="font-bold text-white mb-1 truncate">{item.items.name}</h3>
                    <p className={`text-xs capitalize mb-3 ${config.text}`}>{item.items.rarity}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="w-4 h-4"
                        />
                        <span className="font-bold text-indigo-400">{item.items.market_value}</span>
                      </div>

                      <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-8">
                    <div className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      UPGRADE
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ x: 4 }}
                  onClick={() => handleUpgradeClick(item)}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-xl flex items-center gap-4"
                >
                  <div className={`w-20 h-20 bg-gradient-to-br ${config.gradient} p-0.5 rounded-xl ${config.glow}`}>
                    <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
                      {item.items.image_url ? (
                        <img src={item.items.image_url} alt={item.items.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Package className="w-10 h-10 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{item.items.name}</h3>
                    <p className={`text-sm capitalize ${config.text}`}>{item.items.rarity}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                        alt="Coins"
                        className="w-5 h-5"
                      />
                      <span className="text-xl font-black text-indigo-400">{item.items.market_value}</span>
                    </div>
                    <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold inline-flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Upgrade
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl"
          >
            <Package className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-white mb-3">
              {searchTerm || rarityFilter !== 'all' ? 'No items found' : 'Your inventory is empty'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {searchTerm || rarityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Open loot boxes to get items that you can upgrade for massive multipliers'
              }
            </p>
            {!searchTerm && rarityFilter === 'all' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/boxes')}
                className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all"
              >
                Open Loot Boxes
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
