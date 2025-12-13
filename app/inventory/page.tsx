'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  Package,
  Coins,
  Search,
  ArrowLeft,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Filter,
  ShoppingCart,
  Sparkles,
  X,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import ParticlesBackground from '@/app/components/affiliate/ParticlesBackground'

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

// Variantes d'animation optimisées
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.05
    }
  }
}

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export default function InventoryPage() {
  const { user, profile, loading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState<NotificationState>({ type: 'success', message: '' })
  const [sellLoading, setSellLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'value_asc' | 'value_desc' | 'rarity'>('recent')
  const isLoadingInventory = useRef(false)

  // Protection de route
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // Notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: 'success', message: '' }), 4000)
  }

  // Chargement inventaire
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadInventory()
    }
  }, [isAuthenticated, user?.id])

  const loadInventory = async () => {
    if (!user?.id || isLoadingInventory.current) return

    isLoadingInventory.current = true

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
      isLoadingInventory.current = false
    }
  }

  // Vente d'un objet unique
  const handleSellItem = async (itemId: string) => {
    try {
      setSellLoading(true)
      
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

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

      await refreshProfile()
      await loadInventory()
      
      setSelectedItems(prev => prev.filter(id => id !== itemId))
      
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

  // Vente de la sélection
  const handleSellSelected = async () => {
    if (selectedItems.length === 0) return
    
    try {
      setSellLoading(true)
      
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }
      
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

      await refreshProfile()
      await loadInventory()
      
      setSelectedItems([])
      
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
  const filteredAndSortedInventory = useMemo(() => {
    let filtered = inventory.filter(item => {
      const matchesSearch = item.items?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.items?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRarity = filterRarity === 'all' || item.items?.rarity === filterRarity
      
      return matchesSearch && matchesRarity
    })

    switch (sortBy) {
      case 'value_asc':
        return filtered.sort((a, b) => (a.items?.market_value || 0) - (b.items?.market_value || 0))
      case 'value_desc':
        return filtered.sort((a, b) => (b.items?.market_value || 0) - (a.items?.market_value || 0))
      case 'rarity':
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
        return filtered.sort((a, b) => {
          const aRarity = rarityOrder[a.items?.rarity || 'common']
          const bRarity = rarityOrder[b.items?.rarity || 'common']
          return bRarity - aRarity
        })
      case 'recent':
      default:
        return filtered.sort((a, b) => new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime())
    }
  }, [inventory, searchQuery, filterRarity, sortBy])

  // Statistiques
  const stats = useMemo(() => {
    if (filteredAndSortedInventory.length === 0) return null
    
    const totalValue = inventory.reduce((sum, item) => sum + ((item.items?.market_value || 0) * (item.quantity || 1)), 0)
    const selectedValue = selectedItems.reduce((sum, itemId) => {
      const item = inventory.find(i => i.id === itemId)
      return sum + ((item?.items?.market_value || 0) * (item?.quantity || 1))
    }, 0)
    
    const rarityDistribution = inventory.reduce((acc, item) => {
      const rarity = item.items?.rarity || 'common'
      acc[rarity] = (acc[rarity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: inventory.length,
      filtered: filteredAndSortedInventory.length,
      totalValue,
      selectedValue,
      avgValue: totalValue / inventory.length,
      rarityDistribution
    }
  }, [inventory, filteredAndSortedInventory, selectedItems])

  // Couleurs de rareté
  const getRarityGlow = (rarity: string) => {
    const glows = {
      common: '#10b981',
      rare: '#3b82f6', 
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }
    return glows[rarity as keyof typeof glows] || glows.common
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  if (loading || inventoryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">Chargement de votre inventaire...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 relative">
      {/* Particles Background */}
      <ParticlesBackground />

      {/* Notifications */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg z-50 ${
              notification.type === 'error' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="pt-40 pb-4">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <button
              onClick={() => router.back()}
              className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-4xl font-light text-gray-900 dark:text-white flex items-center gap-3">
                <ShoppingCart className="h-10 w-10 text-blue-500" />
                Mon Inventaire
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {stats ? `${stats.total} objets • ${stats.totalValue.toLocaleString()} coins` : 'Chargement...'}
              </p>
            </div>
          </motion.div>

          {/* Barre de sélection */}
          <AnimatePresence>
            {selectedItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedItems.length} objet{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300">
                      Valeur: {stats?.selectedValue.toLocaleString()} coins
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedItems([])}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barre de recherche et filtres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="recent">Récents</option>
                <option value="value_desc">Prix décroissant</option>
                <option value="value_asc">Prix croissant</option>
                <option value="rarity">Rareté</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg border transition-all flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' 
                    : 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Filter size={16} />
                <span className="text-sm font-medium">Filtres</span>
                {filterRarity !== 'all' && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </motion.button>

              <button
                onClick={() => setSelectedItems(filteredAndSortedInventory.map(item => item.id))}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Tout sélectionner
              </button>
            </div>
          </motion.div>

          {/* Panneau de filtres */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Rareté
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'common', 'rare', 'epic', 'legendary'].map((rarity) => (
                          <button
                            key={rarity}
                            onClick={() => setFilterRarity(rarity as any)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              filterRarity === rarity
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {rarity === 'all' ? 'Toutes' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setFilterRarity('all')
                          setSearchQuery('')
                        }}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Statistiques */}
          {stats && stats.filtered > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-8"
            >
              <span>{stats.filtered} objet{stats.filtered > 1 ? 's' : ''}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>Valeur moyenne: {Math.round(stats.avgValue).toLocaleString()} coins</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>Valeur totale: {stats.totalValue.toLocaleString()} coins</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Grid des objets */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {filteredAndSortedInventory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6 opacity-20">📦</div>
            <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-4">
              {inventory.length === 0 ? 'Inventaire vide' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {inventory.length === 0 
                ? 'Commencez à ouvrir des boîtes pour remplir votre inventaire !'
                : 'Essayez de modifier vos critères de recherche.'
              }
            </p>
            {filteredAndSortedInventory.length === 0 && inventory.length > 0 && (
              <button 
                onClick={() => { 
                  setSearchQuery(''); 
                  setFilterRarity('all');
                  setShowFilters(false);
                }}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                Réinitialiser tous les filtres
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12"
          >
            {filteredAndSortedInventory.map((item, index) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                index={index}
                isSelected={selectedItems.includes(item.id)}
                onSelect={() => toggleItemSelection(item.id)}
                onSell={() => handleSellItem(item.id)}
                sellLoading={sellLoading}
                getRarityGlow={getRarityGlow}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Composant Item Card avec style identique aux boxes
interface InventoryItemCardProps {
  item: InventoryItem
  index: number
  isSelected: boolean
  onSelect: () => void
  onSell: () => void
  sellLoading: boolean
  getRarityGlow: (rarity: string) => string
}

function InventoryItemCard({ 
  item, 
  index, 
  isSelected, 
  onSelect, 
  onSell, 
  sellLoading, 
  getRarityGlow
}: InventoryItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const sellPrice = item.items?.market_value || 0
  const totalPrice = sellPrice * (item.quantity || 1)
  const glowColor = getRarityGlow(item.items?.rarity || 'common')

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{
        y: -20,
        rotateY: 15,
        rotateX: -5,
        scale: 1.05
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onSelect}
      className={`group cursor-pointer transition-all ${
        isSelected ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 rounded-2xl' : ''
      }`}
      style={{ perspective: '1000px' }}
    >
      <motion.div className="relative"
        animate={{
          scale: isSelected ? 1.02 : 1
        }}
        transition={{ duration: 0.2 }}
      >
        
        {/* Selection overlay */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-2xl pointer-events-none z-10"
          />
        )}

        {/* Checkbox de sélection */}
        <div className="absolute -top-2 -left-2 z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            {isSelected && <CheckCircle size={16} />}
          </motion.button>
        </div>

        {/* Badge de quantité */}
        {item.quantity && item.quantity > 1 && (
          <div className="absolute top-2 left-2 z-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
            >
              x{item.quantity}
            </motion.div>
          </div>
        )}

        {/* Ombre dynamique */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black/10 dark:bg-black/20 rounded-full blur-lg transition-colors"
          animate={{
            scale: isHovered ? 1.5 : 1,
            opacity: isHovered ? 0.3 : 0.1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Image de l'objet */}
        <div className="relative mb-4">
          <motion.img
            src={item.items?.image_url}
            alt={item.items?.name}
            className="w-full h-48 object-contain drop-shadow-2xl"
            animate={{
              filter: isHovered 
                ? `drop-shadow(0 25px 50px ${glowColor}40) brightness(1.1)`
                : 'drop-shadow(0 10px 25px rgba(0,0,0,0.15)) brightness(1)'
            }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPk9iamV0PC90ZXh0Pgo8L3N2Zz4K'
            }}
          />
        </div>

        {/* Informations */}
        <motion.div
          className="text-center"
          animate={{
            y: isHovered ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2  transition-colors">
            {item.items?.name || 'Objet inconnu'}
          </h3>
          
          <p className="">
            {item.items?.description || ''}
          </p>

          {/* Date d'obtention */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Obtenu le {new Date(item.obtained_at).toLocaleDateString('fr-FR')}
          </div>

          {/* Prix de vente */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coins size={18} style={{ color: glowColor }} />
            <span className="text-xl font-black text-gray-900 dark:text-white transition-colors">
              {totalPrice.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">coins</span>
          </div>

          {/* Actions au hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect()
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {isSelected ? 'Sélectionné' : 'Sélectionner'}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSell()
                }}
                disabled={sellLoading}
                className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {sellLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3 border border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <DollarSign size={14} />
                    Vendre
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>


      </motion.div>
    </motion.div>
  )
}