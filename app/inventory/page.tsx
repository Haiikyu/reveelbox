'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Coins, 
  Filter, 
  TrendingUp, 
  AlertCircle, 
  Search,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  Eye,
  Gift,
  Star,
  Crown,
  Heart,
  Share2,
  Download,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Plus,
  DollarSign,
  Trash2,
  ShoppingCart,
  Settings,
  Moon,
  Sun,
  Palette,
  BarChart3,
  Zap,
  Trophy
} from 'lucide-react'
import { useAuth } from '../components/AuthProvider'
import { useTheme } from '../components/ThemeProvider'
import { createClient } from '@/utils/supabase/client'

// Types TypeScript
interface InventoryItem {
  id: string
  user_id: string
  item_id: string
  quantity: number
  obtained_at: string
  obtained_from?: string
  is_sold?: boolean
  items?: {
    id: string
    name: string
    description?: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    image_url?: string
    market_value: number
    category?: string
  }
}

interface NotificationState {
  type: 'success' | 'error'
  message: string
}

interface Stats {
  total: number
  totalValue: number
  totalSellValue: number
  byRarity: Record<string, number>
  uniqueItems: number
  selectedValue: number
}

export default function InventoryPage() {
  const { user, profile, loading, isAuthenticated, refreshProfile } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'recent' | 'rarity' | 'value' | 'name'>('recent')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [notification, setNotification] = useState<NotificationState>({ type: 'success', message: '' })
  const [sellLoading, setSellLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const isDark = resolvedTheme === 'dark'

  // Fonction notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: 'success', message: '' }), 4000)
  }

  // Protection de route
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // Chargement inventaire
  useEffect(() => {
    if (isAuthenticated && user) {
      loadInventory()
    }
  }, [isAuthenticated, user])

  const loadInventory = async () => {
    if (!user?.id) return
    
    try {
      setInventoryLoading(true)
      
      let data: InventoryItem[] = []
      let error = null

      try {
        const { data: joinedData, error: joinError } = await supabase
          .from('user_inventory')
          .select(`
            *,
            items (
              id,
              name,
              description,
              rarity,
              image_url,
              market_value,
              category
            )
          `)
          .eq('user_id', user.id)
          .eq('is_sold', false)
          .order('obtained_at', { ascending: false })

        if (joinError) {
          console.warn('Erreur jointure, fallback:', joinError)
          
          const { data: simpleData, error: simpleError } = await supabase
            .from('user_inventory')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_sold', false)
            .order('obtained_at', { ascending: false })

          if (simpleError) throw simpleError
          data = simpleData || []
        } else {
          data = joinedData || []
        }

      } catch (fetchError) {
        console.error('Erreur chargement:', fetchError)
        showNotification('error', 'Erreur lors du chargement de l\'inventaire')
        data = []
      }

      setInventory(data)
      
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('error', 'Une erreur est survenue')
    } finally {
      setInventoryLoading(false)
    }
  }

  // Fonctions de vente
  const handleSellItem = async (itemId: string) => {
    try {
      console.log('Début vente item:', itemId)
      setSellLoading(true)
      
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }
      
      const { data, error } = await supabase.rpc('sell_inventory_item_simple', {
        p_inventory_item_id: itemId
      })

      console.log('Réponse Supabase:', { data, error })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      if (!data || !data.success) {
        throw new Error('Vente échouée')
      }

      console.log('Vente réussie:', data)

      await refreshProfile()
      await loadInventory()
      
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      
      showNotification('success', `Vendu: ${data.item_name} pour ${data.coins_earned} coins!`)
      
    } catch (error) {
      console.error('Erreur vente:', error)
      
      let errorMessage = 'Erreur lors de la vente'
      if (error instanceof Error && error.message) {
        errorMessage = error.message
      }
      
      showNotification('error', errorMessage)
    } finally {
      setSellLoading(false)
    }
  }

  const handleSellSelected = async () => {
    if (selectedItems.length === 0) return
    
    try {
      setSellLoading(true)
      
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }
      
      const { data, error } = await supabase.rpc('sell_multiple_items_simple', {
        p_inventory_item_ids: selectedItems
      })

      if (error) {
        throw error
      }

      if (!data || !data.success) {
        throw new Error('Vente multiple échouée')
      }

      await refreshProfile()
      await loadInventory()
      
      setSelectedItems([])
      
      showNotification('success', `Vendus: ${data.items_sold} objets pour ${data.total_coins_earned} coins!`)
      
    } catch (error) {
      console.error('Erreur vente multiple:', error)
      
      let errorMessage = 'Erreur lors de la vente multiple'
      if (error instanceof Error && error.message) {
        errorMessage = error.message
      }
      
      showNotification('error', errorMessage)
    } finally {
      setSellLoading(false)
    }
  }

  // Filtrage et tri
  const filteredAndSortedInventory = inventory
    .filter(item => {
      if (searchQuery && !item.items?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      if (filterRarity !== 'all' && item.items?.rarity !== filterRarity) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'recent':
          comparison = new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime()
          break
        case 'rarity':
          const rarityOrder = { 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 }
          comparison = (rarityOrder[b.items?.rarity || 'common'] || 0) - (rarityOrder[a.items?.rarity || 'common'] || 0)
          break
        case 'value':
          comparison = (b.items?.market_value || 0) - (a.items?.market_value || 0)
          break
        case 'name':
          comparison = (a.items?.name || '').localeCompare(b.items?.name || '')
          break
        default:
          break
      }
      
      return sortOrder === 'asc' ? -comparison : comparison
    })

  // Calcul statistiques
  const stats: Stats = {
    total: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + ((item.items?.market_value || 0) * (item.quantity || 1)), 0),
    totalSellValue: inventory.reduce((sum, item) => {
      const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)
      return sum + (sellPrice * (item.quantity || 1))
    }, 0),
    byRarity: ['common', 'rare', 'epic', 'legendary'].reduce((acc, rarity) => {
      acc[rarity] = inventory.filter(item => item.items?.rarity === rarity).length
      return acc
    }, {} as Record<string, number>),
    uniqueItems: [...new Set(inventory.map(item => item.item_id))].length,
    selectedValue: selectedItems.reduce((sum, itemId) => {
      const item = inventory.find(i => i.id === itemId)
      if (!item) return sum
      const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)
      return sum + (sellPrice * (item.quantity || 1))
    }, 0)
  }

  // Fonctions utilitaires
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityGlow = (rarity: string) => {
    const glows = {
      common: 'shadow-gray-200',
      rare: 'shadow-blue-200',
      epic: 'shadow-purple-200',
      legendary: 'shadow-yellow-200'
    }
    return glows[rarity as keyof typeof glows] || glows.common
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  const exportInventory = () => {
    const csvContent = [
      'Nom,Rareté,Valeur Marché,Prix de Vente,Quantité,Date d\'obtention',
      ...inventory.map(item => {
        const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)
        return [
          item.items?.name || 'Inconnu',
          item.items?.rarity || 'common',
          item.items?.market_value || 0,
          sellPrice,
          item.quantity || 1,
          formatDate(item.obtained_at)
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    showNotification('success', 'Inventaire exporté !')
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAllItems = () => {
    setSelectedItems(filteredAndSortedInventory.map(item => item.id))
  }

  const deselectAllItems = () => {
    setSelectedItems([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-[rgb(var(--text-secondary))] font-medium">Chargement de votre inventaire...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] pt-20">
      
      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
              notification.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' 
                : 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg transition-colors hover:bg-[rgb(var(--surface-elevated))]"
              >
                <ArrowLeft className="h-5 w-5 text-[rgb(var(--text-secondary))]" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-3">
                  <div className="relative">
                    <ShoppingCart className="h-8 w-8 text-primary-500" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
                  </div>
                  Mon Inventaire
                </h1>
                <p className="text-[rgb(var(--text-secondary))] mt-1 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {stats.total} objets
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    {stats.totalValue.toLocaleString()} coins
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {stats.totalSellValue.toLocaleString()} de vente
                  </span>
                </p>
              </div>
            </div>
            
            {/* Settings Panel Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg transition-colors hover:bg-[rgb(var(--surface-elevated))]"
              >
                <Settings className="h-5 w-5 text-[rgb(var(--text-secondary))]" />
              </button>
              
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="p-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg transition-colors hover:bg-[rgb(var(--surface-elevated))]"
              >
                {isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-600" />}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-[rgb(var(--surface-elevated))] border border-[rgb(var(--border))] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Paramètres d'affichage
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                      Thème
                    </label>
                    <div className="flex gap-2">
                      {(['light', 'dark', 'system'] as const).map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => setTheme(themeOption)}
                          className={`flex-1 p-2 rounded-lg border transition-colors text-sm font-medium ${
                            theme === themeOption
                              ? 'bg-primary-500 text-white border-primary-500'
                              : 'bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-elevated))]'
                          }`}
                        >
                          {themeOption === 'light' && 'Clair'}
                          {themeOption === 'dark' && 'Sombre'}
                          {themeOption === 'system' && 'Système'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                      Vue d'affichage
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex-1 p-2 rounded-lg border transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-elevated))]'
                        }`}
                      >
                        <Grid3X3 className="h-4 w-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 p-2 rounded-lg border transition-colors ${
                          viewMode === 'list'
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-elevated))]'
                        }`}
                      >
                        <List className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                      Actions rapides
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={exportInventory}
                        className="flex-1 p-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-elevated))] transition-colors"
                      >
                        <Download className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {[
            { 
              icon: Package, 
              value: stats.total, 
              label: 'Objets', 
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
              border: 'border-blue-200 dark:border-blue-800'
            },
            { 
              icon: Star, 
              value: stats.uniqueItems, 
              label: 'Uniques', 
              color: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-50 dark:bg-purple-900/20',
              border: 'border-purple-200 dark:border-purple-800'
            },
            { 
              icon: Coins, 
              value: stats.totalValue.toLocaleString(), 
              label: 'Valeur', 
              color: 'text-yellow-600 dark:text-yellow-400',
              bg: 'bg-yellow-50 dark:bg-yellow-900/20',
              border: 'border-yellow-200 dark:border-yellow-800'
            },
            { 
              icon: DollarSign, 
              value: stats.totalSellValue.toLocaleString(), 
              label: 'Prix vente', 
              color: 'text-green-600 dark:text-green-400',
              bg: 'bg-green-50 dark:bg-green-900/20',
              border: 'border-green-200 dark:border-green-800'
            },
            { 
              icon: TrendingUp, 
              value: '70%', 
              label: 'Ratio vente', 
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
              border: 'border-emerald-200 dark:border-emerald-800'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`${stat.bg} ${stat.border} rounded-xl p-4 border text-center relative overflow-hidden group hover:shadow-lg transition-all duration-300`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2 relative z-10`} />
              <div className="text-2xl font-bold text-[rgb(var(--text-primary))] relative z-10">{stat.value}</div>
              <div className="text-sm text-[rgb(var(--text-secondary))] relative z-10">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Selection Bar Enhanced */}
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6 flex items-center justify-between backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{selectedItems.length}</span>
                </div>
                <span className="font-bold text-primary-900 dark:text-primary-100">
                  objet(s) sélectionné(s)
                </span>
              </div>
              <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300">
                <Zap className="h-5 w-5" />
                <span className="font-bold text-lg">{stats.selectedValue.toLocaleString()} coins</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={deselectAllItems}
                className="px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-lg transition-colors"
              >
                Désélectionner
              </button>
              <button
                onClick={handleSellSelected}
                disabled={sellLoading}
                className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {sellLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                Vendre la sélection
              </button>
            </div>
          </motion.div>
        )}

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[rgb(var(--surface-elevated))] rounded-xl shadow-lg p-6 border border-[rgb(var(--border))] mb-8 backdrop-blur-sm"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Enhanced Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--text-secondary))] h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un objet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder:text-[rgb(var(--text-secondary))]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Rarity Filter */}
              <div className="relative">
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value as any)}
                  className="appearance-none px-4 py-3 pr-8 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                >
                  <option value="all">Toutes les raretés</option>
                  <option value="common">Commun</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Épique</option>
                  <option value="legendary">Légendaire</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-secondary))] pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none px-4 py-3 pr-8 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                >
                  <option value="recent">Plus récent</option>
                  <option value="rarity">Rareté</option>
                  <option value="value">Valeur</option>
                  <option value="name">Nom</option>
                </select>
                <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-secondary))] pointer-events-none" />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] rounded-lg hover:bg-[rgb(var(--surface-elevated))] transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-5 w-5 text-[rgb(var(--text-secondary))]" /> : <SortDesc className="h-5 w-5 text-[rgb(var(--text-secondary))]" />}
              </button>
            </div>

            {/* Enhanced Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-colors border ${
                  viewMode === 'grid' 
                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg' 
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-elevated))]'
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-colors border ${
                  viewMode === 'list' 
                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg' 
                    : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-elevated))]'
                }`}
              >
                <List className="h-5 w-5" />
              </button>

              <button
                onClick={selectAllItems}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-lg"
                title="Tout sélectionner"
              >
                Tout
              </button>
            </div>
          </div>
        </motion.div>

        {/* Inventory Content */}
        {filteredAndSortedInventory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-[rgb(var(--text-secondary))]" />
            </div>
            <h3 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-4">
              {inventory.length === 0 ? 'Inventaire vide' : 'Aucun résultat'}
            </h3>
            <p className="text-[rgb(var(--text-secondary))] mb-8 max-w-md mx-auto">
              {inventory.length === 0 
                ? 'Commencez à ouvrir des boîtes pour remplir votre inventaire !'
                : 'Essayez de modifier vos filtres pour voir plus d\'objets.'
              }
            </p>
            {inventory.length === 0 && (
              <button
                onClick={() => router.push('/boxes')}
                className="bg-primary-500 text-white px-8 py-3 rounded-xl hover:bg-primary-600 transition-colors font-semibold shadow-lg"
              >
                <Gift className="h-5 w-5 mr-2 inline" />
                Ouvrir une boîte
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedInventory.map((item, index) => (
                  <InventoryItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={() => toggleItemSelection(item.id)}
                    onClick={() => handleItemClick(item)}
                    onSell={() => handleSellItem(item.id)}
                    sellLoading={sellLoading}
                    getRarityColor={getRarityColor}
                    getRarityGlow={getRarityGlow}
                    formatDate={formatDate}
                    isDark={isDark}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[rgb(var(--surface-elevated))] rounded-xl shadow-lg border border-[rgb(var(--border))] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))]">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === filteredAndSortedInventory.length && filteredAndSortedInventory.length > 0}
                            onChange={(e) => e.target.checked ? selectAllItems() : deselectAllItems()}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text-primary))]">Objet</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text-primary))]">Rareté</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text-primary))]">Valeur</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text-primary))]">Prix vente</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text-primary))]">Quantité</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text-primary))]">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[rgb(var(--text-primary))]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgb(var(--border))]">
                      {filteredAndSortedInventory.map((item, index) => (
                        <InventoryItemRow
                          key={item.id}
                          item={item}
                          index={index}
                          isSelected={selectedItems.includes(item.id)}
                          onSelect={() => toggleItemSelection(item.id)}
                          onClick={() => handleItemClick(item)}
                          onSell={() => handleSellItem(item.id)}
                          sellLoading={sellLoading}
                          getRarityColor={getRarityColor}
                          formatDate={formatDate}
                          isDark={isDark}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Enhanced Rarity Breakdown */}
        {inventory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-[rgb(var(--surface-elevated))] rounded-xl shadow-lg p-6 border border-[rgb(var(--border))]"
          >
            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Répartition par rareté
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity, index) => {
                const count = stats.byRarity[rarity] || 0
                const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0
                const rarityConfig = {
                  common: { label: 'Commun', color: 'gray', icon: Package },
                  rare: { label: 'Rare', color: 'blue', icon: Star },
                  epic: { label: 'Épique', color: 'purple', icon: Crown },
                  legendary: { label: 'Légendaire', color: 'yellow', icon: Trophy }
                }
                
                const config = rarityConfig[rarity]
                const Icon = config.icon
                
                return (
                  <motion.div 
                    key={rarity} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`bg-${config.color}-50 dark:bg-${config.color}-900/20 border-2 border-${config.color}-200 dark:border-${config.color}-800 rounded-xl p-4 relative overflow-hidden group hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-center relative z-10">
                      <Icon className={`h-6 w-6 text-${config.color}-600 dark:text-${config.color}-400 mx-auto mb-2`} />
                      <div className={`text-2xl font-bold bg-gradient-to-r ${getRarityColor(rarity)} bg-clip-text text-transparent`}>
                        {count}
                      </div>
                      <div className="text-sm font-medium text-[rgb(var(--text-primary))] mb-1">{config.label}</div>
                      <div className="text-xs text-[rgb(var(--text-secondary))]">{percentage}%</div>
                      
                      {/* Progress Bar */}
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                          className={`bg-${config.color}-500 h-1.5 rounded-full`}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false)
          setSelectedItem(null)
        }}
        onSell={handleSellItem}
        sellLoading={sellLoading}
        getRarityColor={getRarityColor}
        getRarityGlow={getRarityGlow}
        formatDate={formatDate}
        isDark={isDark}
      />
    </div>
  )
}

// Enhanced Components

// Composant Card pour la vue grille
interface InventoryItemCardProps {
  item: InventoryItem
  index: number
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
  onSell: () => void
  sellLoading: boolean
  getRarityColor: (rarity: string) => string
  getRarityGlow: (rarity: string) => string
  formatDate: (dateString: string) => string
  isDark: boolean
}

function InventoryItemCard({ 
  item, 
  index, 
  isSelected, 
  onSelect, 
  onClick, 
  onSell, 
  sellLoading, 
  getRarityColor, 
  getRarityGlow, 
  formatDate,
  isDark
}: InventoryItemCardProps) {
  const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-[rgb(var(--surface-elevated))] rounded-xl shadow-lg border-2 p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
        isSelected ? 'ring-2 ring-primary-500 border-primary-300 shadow-primary/20' : 'border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))]'
      }`}
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(item.items?.rarity || 'common')} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      {/* Selection checkbox and rarity badge */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="relative">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 accent-primary-500"
          />
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 bg-primary-500 rounded flex items-center justify-center"
            >
              <CheckCircle className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white shadow-lg ${getRarityGlow(item.items?.rarity || 'common')}`}
        >
          {item.items?.rarity?.toUpperCase() || 'COMMON'}
        </motion.div>
      </div>

      {/* Item Image */}
      <div className="relative mb-4">
        <div className="aspect-square bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl flex items-center justify-center overflow-hidden group-hover:border-[rgb(var(--border-hover))] transition-colors">
          {item.items?.image_url ? (
            <img 
              src={item.items.image_url} 
              alt={item.items.name}
              className="max-h-48 w-auto mx-auto object-contain transition-transform group-hover:scale-105"
            />
          ) : (
            <Package className="h-16 w-16 text-[rgb(var(--text-secondary))]" />
          )}
        </div>
        
        {item.quantity > 1 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
          >
            x{item.quantity}
          </motion.div>
        )}
      </div>

      {/* Item Info */}
      <div className="space-y-3 relative z-10">
        <h3 className="font-bold text-[rgb(var(--text-primary))] text-lg line-clamp-2 group-hover:text-primary-600 transition-colors">
          {item.items?.name || 'Objet inconnu'}
        </h3>
        
        <p className="text-[rgb(var(--text-secondary))] text-sm line-clamp-2">
          {item.items?.description || 'Aucune description disponible'}
        </p>

        {/* Enhanced Pricing */}
        <div className="space-y-2 p-3 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[rgb(var(--text-secondary))]">
              <Coins className="h-4 w-4" />
              <span className="text-sm line-through">{item.items?.market_value || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-primary-600 font-bold">
              <DollarSign className="h-4 w-4" />
              <span className="text-lg">{sellPrice}</span>
            </div>
          </div>
          
          <div className="text-xs text-[rgb(var(--text-secondary))] flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(item.obtained_at)}
          </div>
        </div>

        {/* Enhanced Sell Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation()
            onSell()
          }}
          disabled={sellLoading}
          className="w-full mt-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {sellLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <DollarSign className="h-4 w-4" />
          )}
          Vendre pour {sellPrice} coins
        </motion.button>
      </div>
    </motion.div>
  )
}

// Composant Row pour la vue liste
interface InventoryItemRowProps {
  item: InventoryItem
  index: number
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
  onSell: () => void
  sellLoading: boolean
  getRarityColor: (rarity: string) => string
  formatDate: (dateString: string) => string
  isDark: boolean
}

function InventoryItemRow({ 
  item, 
  index, 
  isSelected, 
  onSelect, 
  onClick, 
  onSell, 
  sellLoading, 
  getRarityColor, 
  formatDate,
  isDark
}: InventoryItemRowProps) {
  const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`hover:bg-[rgb(var(--surface))] cursor-pointer transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
      onClick={onClick}
    >
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
        />
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg flex items-center justify-center overflow-hidden">
            {item.items?.image_url ? (
              <img 
                src={item.items.image_url} 
                alt={item.items.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-[rgb(var(--text-secondary))]" />
            )}
          </div>
          <div>
            <div className="font-medium text-[rgb(var(--text-primary))]">{item.items?.name || 'Objet inconnu'}</div>
            <div className="text-sm text-[rgb(var(--text-secondary))] line-clamp-1">{item.items?.description}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white`}>
          {item.items?.rarity?.toUpperCase() || 'COMMON'}
        </span>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-[rgb(var(--text-secondary))] font-medium">
          <Coins className="h-4 w-4" />
          {item.items?.market_value || 0}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-primary-600 font-bold">
          <DollarSign className="h-4 w-4" />
          {sellPrice}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <span className="font-medium text-[rgb(var(--text-primary))]">{item.quantity || 1}</span>
      </td>
      
      <td className="px-6 py-4 text-sm text-[rgb(var(--text-secondary))]">
        {formatDate(item.obtained_at)}
      </td>
      
      <td className="px-6 py-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSell()
          }}
          disabled={sellLoading}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
        >
          {sellLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"
            />
          ) : (
            <DollarSign className="h-4 w-4" />
          )}
          Vendre
        </button>
      </td>
    </motion.tr>
  )
}

// Enhanced Modal
interface ItemDetailModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSell: (itemId: string) => void
  sellLoading: boolean
  getRarityColor: (rarity: string) => string
  getRarityGlow: (rarity: string) => string
  formatDate: (dateString: string) => string
  isDark: boolean
}

function ItemDetailModal({ 
  item, 
  isOpen, 
  onClose, 
  onSell, 
  sellLoading, 
  getRarityColor, 
  getRarityGlow,
  formatDate,
  isDark
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null

  const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)
  const totalSellPrice = sellPrice * (item.quantity || 1)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[rgb(var(--surface-elevated))] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[rgb(var(--border))] relative"
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(item.items?.rarity || 'common')} opacity-5 rounded-2xl`} />
          
          <div className="p-8 relative z-10">
            
            {/* Enhanced Header */}
            <div className="flex justify-between items-start mb-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white shadow-lg ${getRarityGlow(item.items?.rarity || 'common')}`}
              >
                {item.items?.rarity?.toUpperCase() || 'COMMON'}
              </motion.div>
              
              <button
                onClick={onClose}
                className="text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] p-2 rounded-lg hover:bg-[rgb(var(--surface))] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Enhanced Content */}
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Enhanced Image */}
              <div className="space-y-4">
                <div className="aspect-square bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl flex items-center justify-center overflow-hidden relative group">
                  {item.items?.image_url ? (
                    <img 
                      src={item.items.image_url} 
                      alt={item.items.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Package className="h-24 w-24 text-[rgb(var(--text-secondary))]" />
                  )}
                  
                  {/* Rarity glow overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(item.items?.rarity || 'common')} opacity-10 group-hover:opacity-20 transition-opacity rounded-2xl`} />
                </div>
                
                {item.quantity > 1 && (
                  <div className="text-center">
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-block bg-primary-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg"
                    >
                      Quantité: {item.quantity}
                    </motion.span>
                  </div>
                )}
              </div>

              {/* Enhanced Details */}
              <div className="space-y-6">
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-[rgb(var(--text-primary))] mb-2"
                  >
                    {item.items?.name || 'Objet inconnu'}
                  </motion.h2>
                  <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
                    {item.items?.description || 'Aucune description disponible'}
                  </p>
                </div>

                {/* Enhanced Pricing Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-200 dark:bg-yellow-800 rounded-full -mr-8 -mt-8 opacity-20" />
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 mb-1 relative z-10">
                      <Coins className="h-5 w-5" />
                      <span className="font-medium">Valeur marché</span>
                    </div>
                    <div className="text-2xl font-bold text-[rgb(var(--text-primary))] relative z-10">
                      {item.items?.market_value || 0}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-200 dark:bg-green-800 rounded-full -mr-8 -mt-8 opacity-20" />
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-1 relative z-10">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">Prix de vente</span>
                    </div>
                    <div className="text-2xl font-bold text-[rgb(var(--text-primary))] relative z-10">
                      {sellPrice}
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full -mr-10 -mt-10 opacity-20" />
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1 relative z-10">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Obtenu le</span>
                  </div>
                  <div className="text-sm font-bold text-[rgb(var(--text-primary))] relative z-10">
                    {formatDate(item.obtained_at)}
                  </div>
                  {item.obtained_from && (
                    <div className="text-xs text-[rgb(var(--text-secondary))] mt-1 relative z-10">
                      Via: {item.obtained_from}
                    </div>
                  )}
                </motion.div>

                {/* Enhanced Actions */}
                <div className="space-y-3">
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSell(item.id)
                      onClose()
                    }}
                    disabled={sellLoading}
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg text-lg"
                  >
                    {sellLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <DollarSign className="h-5 w-5" />
                    )}
                    Vendre pour {totalSellPrice} coins
                  </motion.button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="px-6 py-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] rounded-xl hover:bg-[rgb(var(--surface-elevated))] transition-colors flex items-center justify-center gap-2 text-[rgb(var(--text-primary))]"
                    >
                      <Share2 className="h-5 w-5" />
                      Partager
                    </motion.button>
                    
                    <motion.button 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="px-6 py-3 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] rounded-xl hover:bg-[rgb(var(--surface-elevated))] transition-colors flex items-center justify-center gap-2 text-[rgb(var(--text-primary))]"
                    >
                      <Heart className="h-5 w-5" />
                      Favoris
                    </motion.button>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200 dark:bg-orange-800 rounded-full -mr-8 -mt-8 opacity-20" />
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-sm relative z-10">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        Prix de vente: 70% de la valeur marché ({((sellPrice / (item.items?.market_value || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}