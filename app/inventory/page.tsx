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
  ShoppingCart
} from 'lucide-react'
import { useAuth } from '../components/AuthProvider'
import { createClient } from '@/utils/supabase/client'

// ✅ TYPES TYPESCRIPT CORRIGES
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

  // ✅ FONCTION NOTIFICATION TYPEE
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: 'success', message: '' }), 4000)
  }

  // Protection de route selon le standard
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // Chargement de l'inventaire
  useEffect(() => {
    if (isAuthenticated && user) {
      loadInventory()
    }
  }, [isAuthenticated, user])

  const loadInventory = async () => {
    if (!user?.id) return
    
    try {
      setInventoryLoading(true)
      
      // Gestion des requêtes avec fallback selon le standard
      let data: InventoryItem[] = []
      let error = null

      try {
        // Essayer d'abord requête avec jointures
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
          
          // Fallback : requête simple
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

  // ✅ FONCTIONS DE VENTE TYPEES
  const handleSellItem = async (itemId: string) => {
    try {
      console.log('🔄 Début vente item:', itemId)
      setSellLoading(true)
      
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }
      
      // Utiliser la fonction simple
      const { data, error } = await supabase.rpc('sell_inventory_item_simple', {
        p_inventory_item_id: itemId
      })

      console.log('📊 Réponse Supabase:', { data, error })

      if (error) {
        console.error('❌ Erreur Supabase:', error)
        throw error
      }

      if (!data || !data.success) {
        throw new Error('Vente échouée')
      }

      console.log('✅ Vente réussie:', data)

      // Actualiser les données
      await refreshProfile()
      await loadInventory()
      
      // Retirer de la sélection
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      
      // Notification de succès
      showNotification('success', `Vendu: ${data.item_name} pour ${data.coins_earned} coins!`)
      
    } catch (error) {
      console.error('❌ Erreur vente:', error)
      
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
      
      // Utiliser la fonction simple
      const { data, error } = await supabase.rpc('sell_multiple_items_simple', {
        p_inventory_item_ids: selectedItems
      })

      if (error) {
        throw error
      }

      if (!data || !data.success) {
        throw new Error('Vente multiple échouée')
      }

      // Actualiser les données
      await refreshProfile()
      await loadInventory()
      
      // Reset selection
      setSelectedItems([])
      
      // Notification
      showNotification('success', `Vendus: ${data.items_sold} objets pour ${data.total_coins_earned} coins!`)
      
    } catch (error) {
      console.error('❌ Erreur vente multiple:', error)
      
      let errorMessage = 'Erreur lors de la vente multiple'
      if (error instanceof Error && error.message) {
        errorMessage = error.message
      }
      
      showNotification('error', errorMessage)
    } finally {
      setSellLoading(false)
    }
  }

  // ✅ FILTRAGE ET TRI TYPES
  const filteredAndSortedInventory = inventory
    .filter(item => {
      // Filtre par recherche
      if (searchQuery && !item.items?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Filtre par rareté
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

  // ✅ CALCUL STATISTIQUES TYPE
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

  // ✅ FONCTIONS UTILITAIRES TYPEES
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityBg = (rarity: string) => {
    const colors = {
      common: 'bg-gray-50 border-gray-200',
      rare: 'bg-blue-50 border-blue-200',
      epic: 'bg-purple-50 border-purple-200',
      legendary: 'bg-yellow-50 border-yellow-200'
    }
    return colors[rarity as keyof typeof colors] || colors.common
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
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Chargement de votre inventaire...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      
      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
              notification.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
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
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                Mon Inventaire
              </h1>
              <p className="text-gray-600 mt-1">
                {stats.total} objets • Valeur: {stats.totalValue.toLocaleString()} coins • Vente: {stats.totalSellValue.toLocaleString()} coins
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Objets</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <Star className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.uniqueItems}</div>
            <div className="text-sm text-gray-600">Uniques</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <Coins className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Valeur</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalSellValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Prix vente</div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">70%</div>
            <div className="text-sm text-gray-600">Ratio vente</div>
          </div>
        </motion.div>

        {/* Selection Bar */}
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="font-bold text-blue-900">
                {selectedItems.length} objet(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2 text-blue-700">
                <DollarSign className="h-5 w-5" />
                <span className="font-bold text-lg">{stats.selectedValue.toLocaleString()} coins</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={deselectAllItems}
                className="px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Désélectionner
              </button>
              <button
                onClick={handleSellSelected}
                disabled={sellLoading}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-bold disabled:opacity-50 flex items-center gap-2"
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

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un objet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Rarity Filter */}
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Toutes les raretés</option>
                <option value="common">Commun</option>
                <option value="rare">Rare</option>
                <option value="epic">Épique</option>
                <option value="legendary">Légendaire</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="recent">Plus récent</option>
                <option value="rarity">Rareté</option>
                <option value="value">Valeur</option>
                <option value="name">Nom</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
              </button>
            </div>

            {/* View Mode and Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-green-500 text-white' : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-green-500 text-white' : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <List className="h-5 w-5" />
              </button>

              <button
                onClick={selectAllItems}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                title="Tout sélectionner"
              >
                Tout
              </button>

              <button
                onClick={exportInventory}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Exporter l'inventaire"
              >
                <Download className="h-5 w-5" />
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
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {inventory.length === 0 ? 'Inventaire vide' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {inventory.length === 0 
                ? 'Commencez à ouvrir des boîtes pour remplir votre inventaire !'
                : 'Essayez de modifier vos filtres pour voir plus d\'objets.'
              }
            </p>
            {inventory.length === 0 && (
              <button
                onClick={() => router.push('/boxes')}
                className="bg-green-500 text-white px-8 py-3 rounded-xl hover:bg-green-600 transition-colors font-semibold"
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
                    getRarityBg={getRarityBg}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === filteredAndSortedInventory.length && filteredAndSortedInventory.length > 0}
                            onChange={(e) => e.target.checked ? selectAllItems() : deselectAllItems()}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Objet</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rareté</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valeur</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Prix vente</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantité</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
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
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Rarity Breakdown */}
        {inventory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Répartition par rareté
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['common', 'rare', 'epic', 'legendary'].map(rarity => {
                const count = stats.byRarity[rarity] || 0
                const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0
                
                return (
                  <div key={rarity} className={`p-4 rounded-xl border-2 ${getRarityBg(rarity)}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold bg-gradient-to-r ${getRarityColor(rarity)} bg-clip-text text-transparent`}>
                        {count}
                      </div>
                      <div className="text-sm font-medium text-gray-700 capitalize mb-1">{rarity}</div>
                      <div className="text-xs text-gray-600">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Item Detail Modal */}
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
        getRarityBg={getRarityBg}
        formatDate={formatDate}
      />
    </div>
  )
}

// ✅ COMPOSANTS TYPES

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
  getRarityBg: (rarity: string) => string
  formatDate: (dateString: string) => string
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
  getRarityBg, 
  formatDate 
}: InventoryItemCardProps) {
  const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg border-2 p-6 cursor-pointer transition-all duration-300 ${
        getRarityBg(item.items?.rarity || 'common')
      } ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}
      onClick={onClick}
    >
      {/* Selection checkbox and status */}
      <div className="flex justify-between items-start mb-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
        />
        
        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white`}>
          {item.items?.rarity?.toUpperCase() || 'COMMON'}
        </div>
      </div>

      {/* Item Image */}
      <div className="relative mb-4">
        <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
          {item.items?.image_url ? (
            <img 
              src={item.items.image_url} 
              alt={item.items.name}
              className="max-h-48 w-auto mx-auto object-contain"
            />
          ) : (
            <Package className="h-16 w-16 text-gray-400" />
          )}
        </div>
        
        {item.quantity > 1 && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            x{item.quantity}
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 text-lg line-clamp-2">
          {item.items?.name || 'Objet inconnu'}
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-2">
          {item.items?.description || 'Aucune description disponible'}
        </p>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-yellow-600">
              <Coins className="h-4 w-4" />
              <span className="text-sm line-through text-gray-500">{item.items?.market_value || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <DollarSign className="h-4 w-4" />
              <span className="font-bold">{sellPrice}</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Obtenu le {formatDate(item.obtained_at)}
          </div>
        </div>

        {/* Sell Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSell()
          }}
          disabled={sellLoading}
          className="w-full mt-3 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
        </button>
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
  formatDate 
}: InventoryItemRowProps) {
  const sellPrice = Math.floor((item.items?.market_value || 0) * 0.7)

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
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
          className="w-4 h-4 text-blue-600 rounded"
        />
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {item.items?.image_url ? (
              <img 
                src={item.items.image_url} 
                alt={item.items.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{item.items?.name || 'Objet inconnu'}</div>
            <div className="text-sm text-gray-600 line-clamp-1">{item.items?.description}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white`}>
          {item.items?.rarity?.toUpperCase() || 'COMMON'}
        </span>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-yellow-600 font-medium">
          <Coins className="h-4 w-4" />
          {item.items?.market_value || 0}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-green-600 font-bold">
          <DollarSign className="h-4 w-4" />
          {sellPrice}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <span className="font-medium">{item.quantity || 1}</span>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-600">
        {formatDate(item.obtained_at)}
      </td>
      
      <td className="px-6 py-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSell()
          }}
          disabled={sellLoading}
          className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
        >
          {sellLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"
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

// Modal de détail d'un objet
interface ItemDetailModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSell: (itemId: string) => void
  sellLoading: boolean
  getRarityColor: (rarity: string) => string
  getRarityBg: (rarity: string) => string
  formatDate: (dateString: string) => string
}

function ItemDetailModal({ 
  item, 
  isOpen, 
  onClose, 
  onSell, 
  sellLoading, 
  getRarityColor, 
  getRarityBg, 
  formatDate 
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
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 ${getRarityBg(item.items?.rarity || 'common')}`}
        >
          <div className="p-8">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className={`px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white`}>
                {item.items?.rarity?.toUpperCase() || 'COMMON'}
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Image */}
              <div className="space-y-4">
                <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                  {item.items?.image_url ? (
                    <img 
                      src={item.items.image_url} 
                      alt={item.items.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-24 w-24 text-gray-400" />
                  )}
                </div>
                
                {item.quantity > 1 && (
                  <div className="text-center">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold">
                      Quantité: {item.quantity}
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {item.items?.name || 'Objet inconnu'}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {item.items?.description || 'Aucune description disponible'}
                  </p>
                </div>

                {/* Pricing Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-600 mb-1">
                      <Coins className="h-5 w-5" />
                      <span className="font-medium">Valeur marché</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {item.items?.market_value || 0}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">Prix de vente</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {sellPrice}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">Obtenu le</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {formatDate(item.obtained_at)}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      onSell(item.id)
                      onClose()
                    }}
                    disabled={sellLoading}
                    className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Partager
                    </button>
                    
                    <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <Heart className="h-5 w-5" />
                      Favoris
                    </button>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-orange-700 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">
                        Prix de vente: 70% de la valeur marché ({((sellPrice / (item.items?.market_value || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}