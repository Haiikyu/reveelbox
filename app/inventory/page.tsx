// app/inventory/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getUserInventory, createMarketListing } from '@/lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { Package, Coins, Filter, TrendingUp, AlertCircle } from 'lucide-react'

export default function InventoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [listingPrice, setListingPrice] = useState('')
  const [listing, setListing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadInventory()
  }, [user, router])

  const loadInventory = async () => {
    const { data, error } = await getUserInventory(user.id)
    if (data) {
      setInventory(data)
    }
    setLoading(false)
  }

  const handleCreateListing = async () => {
    if (!selectedItem || !listingPrice) return
    
    setError('')
    setListing(true)
    
    const price = parseInt(listingPrice)
    if (isNaN(price) || price <= 0) {
      setError('Prix invalide')
      setListing(false)
      return
    }

    const { data, error } = await createMarketListing(selectedItem.id, price)
    
    if (error) {
      setError('Erreur lors de la mise en vente')
    } else {
      await loadInventory()
      setSelectedItem(null)
      setListingPrice('')
    }
    
    setListing(false)
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'from-gray-600 to-gray-400',
      uncommon: 'from-green-600 to-green-400',
      rare: 'from-blue-600 to-blue-400',
      epic: 'from-purple-600 to-purple-400',
      legendary: 'from-yellow-600 to-yellow-400'
    }
    return colors[rarity] || colors.common
  }

  const getRarityBorder = (rarity) => {
    const borders = {
      common: 'border-gray-500',
      uncommon: 'border-green-500',
      rare: 'border-blue-500',
      epic: 'border-purple-500',
      legendary: 'border-yellow-500'
    }
    return borders[rarity] || borders.common
  }

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true
    return item.items.rarity === filter
  })

  const groupedInventory = filteredInventory.reduce((acc, item) => {
    const key = item.item_id
    if (!acc[key]) {
      acc[key] = {
        ...item.items,
        count: 0,
        inventoryItems: []
      }
    }
    acc[key].count += item.quantity || 1
    acc[key].inventoryItems.push(item)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white flex items-center justify-center space-x-3">
            <Package className="w-10 h-10 text-purple-500" />
            <span>Mon Inventaire</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Gérez vos objets et mettez-les en vente sur le marché
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex justify-center space-x-2 flex-wrap gap-2"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tous
          </button>
          {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((rarity) => (
            <button
              key={rarity}
              onClick={() => setFilter(rarity)}
              className={`px-4 py-2 rounded-full text-sm transition-all duration-300 capitalize ${
                filter === rarity
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {rarity}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Inventory Grid */}
      {Object.keys(groupedInventory).length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Votre inventaire est vide</p>
          <p className="text-gray-500 text-sm mt-2">Achetez des loot boxes pour commencer votre collection !</p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {Object.values(groupedInventory).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border-2 ${getRarityBorder(item.rarity)} cursor-pointer transition-all duration-300 hover:shadow-xl`}
              onClick={() => setSelectedItem(item.inventoryItems[0])}
            >
              <div className="space-y-3">
                {/* Rarity Badge */}
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-bold bg-gradient-to-r ${getRarityColor(item.rarity)} bg-clip-text text-transparent uppercase`}>
                    {item.rarity}
                  </span>
                  {item.count > 1 && (
                    <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-1 rounded-full">
                      x{item.count}
                    </span>
                  )}
                </div>

                {/* Item Icon */}
                <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${getRarityColor(item.rarity)} rounded-lg flex items-center justify-center`}>
                  <Package className="w-10 h-10 text-white" />
                </div>

                {/* Item Name */}
                <h3 className="font-semibold text-white text-sm text-center line-clamp-2">
                  {item.name}
                </h3>

                {/* Market Value */}
                <div className="flex items-center justify-center space-x-1 text-yellow-500">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-semibold">{item.market_value}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Sell Modal */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedItem(null)
            setListingPrice('')
            setError('')
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Mettre en vente</h2>
            
            <div className="space-y-4">
              <div className={`bg-gray-700/50 rounded-xl p-4 border ${getRarityBorder(selectedItem.items.rarity)}`}>
                <h3 className="font-semibold text-white">{selectedItem.items.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{selectedItem.items.description}</p>
                <div className="flex items-center space-x-1 text-yellow-500 mt-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm">Valeur estimée: {selectedItem.items.market_value}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="text-gray-300 text-sm font-medium">Prix de vente (coins)</label>
                <div className="relative mt-1">
                  <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="0"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedItem(null)
                    setListingPrice('')
                    setError('')
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateListing}
                  disabled={listing || !listingPrice}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>{listing ? 'Mise en vente...' : 'Mettre en vente'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-3 gap-4 mt-8"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-gray-400 text-sm">Total d'objets</h3>
          <p className="text-2xl font-bold text-white mt-1">{inventory.length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-gray-400 text-sm">Objets uniques</h3>
          <p className="text-2xl font-bold text-white mt-1">{Object.keys(groupedInventory).length}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-gray-400 text-sm">Valeur totale</h3>
          <p className="text-2xl font-bold text-yellow-500 mt-1 flex items-center">
            <Coins className="w-5 h-5 mr-1" />
            {inventory.reduce((sum, item) => sum + (item.items.market_value || 0), 0)}
          </p>
        </div>
      </motion.div>
    </div>
  )