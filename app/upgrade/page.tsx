// app/upgrade/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { 
  TrendingUp, 
  Package, 
  Search,
  Filter,
  Sparkles,
  Info,
  ChevronRight,
  BarChart3,
  Trophy,
  Zap,
  AlertCircle,
  SortAsc,
  Grid3x3,
  List,
  Loader2,
  TrendingDown,
  DollarSign
} from 'lucide-react'

// Import dynamique du modal
const UpgradeModal = dynamic(() => import('@/app/components/UpgradeModal'), {
  ssr: false
})

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
  const [sortBy, setSortBy] = useState<'value' | 'rarity' | 'name' | 'date'>('value')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [stats, setStats] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated && user) {
      loadInventory()
      loadUpgradeStats()
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
      setInventory(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUpgradeStats = async () => {
    try {
      const response = await fetch(`/api/upgrade-stats?user_id=${user!.id}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Filtrage et tri
  const processedInventory = inventory
    .filter(item => {
      if (!item.items) return false
      
      const matchesSearch = item.items.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRarity = rarityFilter === 'all' || item.items.rarity === rarityFilter
      
      return matchesSearch && matchesRarity
    })
    .sort((a, b) => {
      if (!a.items || !b.items) return 0
      
      switch (sortBy) {
        case 'value':
          return b.items.market_value - a.items.market_value
        case 'rarity':
          const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
          return (rarityOrder[b.items.rarity] || 0) - (rarityOrder[a.items.rarity] || 0)
        case 'name':
          return a.items.name.localeCompare(b.items.name)
        case 'date':
          return new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime()
        default:
          return 0
      }
    })

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-500 to-gray-700',
      rare: 'from-blue-500 to-blue-700',
      epic: 'from-purple-500 to-purple-700',
      legendary: 'from-yellow-500 via-orange-500 to-red-500'
    }
    return colors[rarity?.toLowerCase()] || colors.common
  }

  const getRarityBg = (rarity: string) => {
    const colors = {
      common: 'bg-gray-900/50',
      rare: 'bg-blue-900/50',
      epic: 'bg-purple-900/50',
      legendary: 'bg-gradient-to-br from-yellow-900/50 to-red-900/50'
    }
    return colors[rarity?.toLowerCase()] || colors.common
  }

  const handleUpgradeClick = (item: InventoryItem) => {
    if (!item.items) return
    
    setSelectedItem({
      id: item.id,
      item_id: item.items.id,
      name: item.items.name,
      image_url: item.items.image_url,
      rarity: item.items.rarity,
      market_value: item.items.market_value,
      quantity: item.quantity
    })
    setUpgradeModalOpen(true)
  }

  const totalValue = processedInventory.reduce((sum, item) => 
    sum + (item.items?.market_value || 0), 0
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/10 to-black pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Upgrade Center
                </h1>
                <p className="text-gray-400 mt-1">
                  Multiply your items value with calculated risks
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            {stats && (
              <div className="flex gap-4">
                <div className="text-center px-6 py-3 bg-gray-900/50 rounded-xl border border-gray-800">
                  <p className="text-2xl font-bold text-green-400">{stats.success_rate || 0}%</p>
                  <p className="text-xs text-gray-500">Success Rate</p>
                </div>
                <div className="text-center px-6 py-3 bg-gray-900/50 rounded-xl border border-gray-800">
                  <p className="text-2xl font-bold text-purple-400">{stats.total_attempts || 0}</p>
                  <p className="text-xs text-gray-500">Total Attempts</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-5 border border-purple-800/50">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <h3 className="font-bold text-white">High Rewards</h3>
              </div>
              <p className="text-sm text-gray-300">
                Multiply your items up to x1000 with custom multipliers
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-5 border border-blue-800/50">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-6 w-6 text-blue-400" />
                <h3 className="font-bold text-white">Instant Process</h3>
              </div>
              <p className="text-sm text-gray-300">
                Advanced animation system with real-time results
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-2xl p-5 border border-red-800/50">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <h3 className="font-bold text-white">High Risk</h3>
              </div>
              <p className="text-sm text-gray-300">
                Failed upgrades result in permanent item loss
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filtres et contrôles */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-800">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Filtres de rareté */}
            <div className="flex gap-2">
              {['all', 'common', 'rare', 'epic', 'legendary'].map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setRarityFilter(rarity)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    rarityFilter === rarity
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {rarity === 'all' ? 'All' : rarity}
                </button>
              ))}
            </div>
            
            {/* Tri et vue */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none"
              >
                <option value="value">Sort by Value</option>
                <option value="rarity">Sort by Rarity</option>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
              </select>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-3 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 transition-all"
              >
                {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid3x3 className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          {/* Stats bar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-400">
                <span className="font-bold text-white">{processedInventory.length}</span> items
              </span>
              <span className="text-gray-400">
                Total value: <span className="font-bold text-emerald-400">{totalValue.toLocaleString()} coins</span>
              </span>
            </div>
          </div>
        </div>

        {/* Inventaire */}
        {processedInventory.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {processedInventory.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`${getRarityBg(item.items?.rarity || '')} backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer group border border-gray-800 hover:border-purple-600 transition-all`}
                  onClick={() => handleUpgradeClick(item)}
                >
                  <div className={`relative h-48 bg-gradient-to-br ${getRarityColor(item.items?.rarity || '')} p-0.5`}>
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      {item.items?.image_url ? (
                        <img 
                          src={item.items.image_url} 
                          alt={item.items.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all">
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <div className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-bold">
                          <TrendingUp className="h-4 w-4" />
                          Upgrade
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-white truncate mb-1">
                      {item.items?.name}
                    </h3>
                    <p className="text-xs text-gray-400 capitalize mb-3">
                      {item.items?.rarity}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <img 
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                          alt="Coins" 
                          className="h-4 w-4" 
                        />
                        <span className="font-bold text-emerald-400">
                          {item.items?.market_value || 0}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {processedInventory.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 5 }}
                  className={`${getRarityBg(item.items?.rarity || '')} backdrop-blur-sm rounded-xl p-4 cursor-pointer group border border-gray-800 hover:border-purple-600 transition-all`}
                  onClick={() => handleUpgradeClick(item)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`relative w-20 h-20 rounded-xl bg-gradient-to-br ${getRarityColor(item.items?.rarity || '')} p-0.5`}>
                      <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                        {item.items?.image_url ? (
                          <img 
                            src={item.items.image_url} 
                            alt={item.items.name}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-gray-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">
                        {item.items?.name}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">
                        {item.items?.rarity} Item
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <img 
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                          alt="Coins" 
                          className="h-5 w-5" 
                        />
                        <span className="text-xl font-bold text-emerald-400">
                          {item.items?.market_value || 0}
                        </span>
                      </div>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold group-hover:bg-purple-500 transition-all">
                        Upgrade
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-16 text-center border border-gray-800">
            <Package className="h-20 w-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">
              {searchTerm || rarityFilter !== 'all' ? 'No items found' : 'Empty Inventory'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {searchTerm || rarityFilter !== 'all' 
                ? 'Try adjusting your filters to find items'
                : 'Open loot boxes to get items that you can upgrade for massive multipliers'
              }
            </p>
            {!searchTerm && rarityFilter === 'all' && (
              <button
                onClick={() => router.push('/boxes')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
              >
                Open Loot Boxes
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal d'upgrade */}
      {upgradeModalOpen && selectedItem && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => {
            setUpgradeModalOpen(false)
            setSelectedItem(null)
            loadInventory()
            loadUpgradeStats()
          }}
          item={selectedItem}
          userId={user?.id || ''}
          onSuccess={(newValue) => {
            loadInventory()
            loadUpgradeStats()
          }}
        />
      )}
    </div>
  )
}