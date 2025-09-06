'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Coins, 
  Search,
  Grid3X3,
  List,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Filter
} from 'lucide-react'
import { useAuth } from '../components/AuthProvider'
import { createClient } from '@/utils/supabase/client'

// Types simplifiés
interface InventoryItem {
  id: string
  user_id: string
  item_id: string
  quantity: number
  obtained_at: string
  items?: {
    id: string
    name: string
    description?: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    image_url?: string
    market_value: number
  }
}

interface NotificationState {
  type: 'success' | 'error'
  message: string
}

export default function InventoryPage() {
  const { user, profile, loading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState<NotificationState>({ type: 'success', message: '' })
  const [sellLoading, setSellLoading] = useState(false)

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
      
      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          items (
            id,
            name,
            description,
            rarity,
            image_url,
            market_value
          )
        `)
        .eq('user_id', user.id)
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false })

      if (error) {
        console.error('Erreur chargement:', error)
        showNotification('error', 'Erreur lors du chargement de l\'inventaire')
        return
      }

      setInventory(data || [])
      
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('error', 'Une erreur est survenue')
    } finally {
      setInventoryLoading(false)
    }
  }

  // Fonction de vente simplifiée - utilise directement le market_value comme prix de vente
const handleSellItem = async (itemId: string) => {
  try {
    setSellLoading(true)
    
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    // Utiliser la nouvelle fonction RPC corrigée
    const { data, error } = await supabase.rpc('sell_inventory_item_fixed', {
      p_inventory_item_id: itemId
    })

    if (error) {
      console.error('Erreur Supabase:', error)
      throw error
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Vente échouée')
    }

    // Actualiser les données
    await refreshProfile()
    await loadInventory()
    
    // Retirer de la sélection
    setSelectedItems(prev => prev.filter(id => id !== itemId))
    
    // Notification de succès
    showNotification('success', `Vendu: ${data.item_name} pour ${data.coins_earned.toLocaleString()} coins!`)
    
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
    
    // Utiliser la nouvelle fonction RPC corrigée
    const { data, error } = await supabase.rpc('sell_multiple_items_fixed', {
      p_inventory_item_ids: selectedItems
    })

    if (error) {
      console.error('Erreur Supabase:', error)
      throw error
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Vente multiple échouée')
    }

    // Actualiser les données
    await refreshProfile()
    await loadInventory()
    
    setSelectedItems([])
    
    // Notification de succès
    showNotification('success', `Vendus: ${data.items_sold} objets pour ${data.total_coins_earned.toLocaleString()} coins!`)
    
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
  const filteredInventory = inventory.filter(item => {
    if (searchQuery && !item.items?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    if (filterRarity !== 'all' && item.items?.rarity !== filterRarity) {
      return false
    }
    
    return true
  })

  // Calcul statistiques
  const stats = {
    total: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + ((item.items?.market_value || 0) * (item.quantity || 1)), 0),
    selectedValue: selectedItems.reduce((sum, itemId) => {
      const item = inventory.find(i => i.id === itemId)
      return sum + ((item?.items?.market_value || 0) * (item?.quantity || 1))
    }, 0)
  }

  // Fonctions utilitaires
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-600 to-gray-600',
      rare: 'from-blue-600 to-blue-600',
      epic: 'from-purple-600 to-purple-600',
      legendary: 'from-yellow-500 to-yellow-600'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20">
      
      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'error' 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-green-50 border border-green-200 text-green-700'
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                  Mon Inventaire
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {stats.total} objets • {stats.totalValue.toLocaleString()} coins 
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Barre de sélection */}
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                {selectedItems.length} objet(s) sélectionné(s)
              </span>
              <span className="text-blue-700 dark:text-blue-300">
                Valeur: {stats.selectedValue.toLocaleString()} coins
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedItems([])}
                className="px-4 py-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
              >
                Désélectionner
              </button>
              <button
                onClick={handleSellSelected}
                disabled={sellLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
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

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className=" rounded-lg shadow-sm p-4 dark:border-gray-700 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher un objet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value as any)}
                  className="appearance-none px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les raretés</option>
                  <option value="common">Commun</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Épique</option>
                  <option value="legendary">Légendaire</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={() => setSelectedItems(filteredInventory.map(item => item.id))}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Tout sélectionner
              </button>
            </div>
          </div>
        </motion.div>

        {/* Contenu inventaire */}
        {inventoryLoading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600 dark:text-gray-400">Chargement de votre inventaire...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {inventory.length === 0 ? 'Inventaire vide' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {inventory.length === 0 
                ? 'Commencez à ouvrir des boîtes pour remplir votre inventaire !'
                : 'Essayez de modifier vos filtres pour voir plus d\'objets.'
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }
          >
            {filteredInventory.map((item, index) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                index={index}
                isSelected={selectedItems.includes(item.id)}
                onSelect={() => toggleItemSelection(item.id)}
                onSell={() => handleSellItem(item.id)}
                sellLoading={sellLoading}
                getRarityColor={getRarityColor}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Composant Item Card simplifié
interface InventoryItemCardProps {
  item: InventoryItem
  index: number
  isSelected: boolean
  onSelect: () => void
  onSell: () => void
  sellLoading: boolean
  getRarityColor: (rarity: string) => string
  viewMode: 'grid' | 'list'
}

function InventoryItemCard({ 
  item, 
  index, 
  isSelected, 
  onSelect, 
  onSell, 
  sellLoading, 
  getRarityColor,
  viewMode
}: InventoryItemCardProps) {
  const sellPrice = item.items?.market_value || 0
  const totalPrice = sellPrice * (item.quantity || 1)

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 flex items-center gap-4 transition-all ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
          {item.items?.image_url ? (
            <img 
              src={item.items.image_url} 
              alt={item.items.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {item.items?.name || 'Objet inconnu'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white`}>
              {item.items?.rarity?.toUpperCase() || 'COMMON'}
            </span>
            {item.quantity > 1 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">x{item.quantity}</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-blue-600 font-bold">
            <Coins className="h-4 w-4" />
            {totalPrice.toLocaleString()}
          </div>
          <button
            onClick={onSell}
            disabled={sellLoading}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Vendre
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={` p-4  ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        
        <span className={`px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${getRarityColor(item.items?.rarity || 'common')} text-white`}>
          {item.items?.rarity?.toUpperCase() || 'COMMON'}
        </span>
      </div>

      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mb-3 relative">
        {item.items?.image_url ? (
          <img 
            src={item.items.image_url} 
            alt={item.items.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="h-12 w-12 text-gray-400" />
        )}
        
        {item.quantity > 1 && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            x{item.quantity}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
        {item.items?.name || 'Objet inconnu'}
      </h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-blue-600 font-bold">
          <Coins className="h-4 w-4" />
          <span>{totalPrice.toLocaleString()}</span>
        </div>
        
        <button
          onClick={onSell}
          disabled={sellLoading}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {sellLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-white border-t-transparent rounded-full"
            />
          ) : (
            <DollarSign className="h-3 w-3" />
          )}
          Vendre
        </button>
      </div>
    </motion.div>
  )
}