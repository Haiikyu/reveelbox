// app/history/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getUserTransactions } from '@/lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { History, Package, Coins, CreditCard, TrendingUp, Calendar } from 'lucide-react'

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadTransactions()
  }, [user, router])

  const loadTransactions = async () => {
    const { data, error } = await getUserTransactions(user.id)
    if (data) {
      setTransactions(data)
    }
    setLoading(false)
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase_currency':
        return <CreditCard className="w-5 h-5" />
      case 'purchase_box':
        return <Coins className="w-5 h-5" />
      case 'open_box':
        return <Package className="w-5 h-5" />
      case 'market_sale':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <History className="w-5 h-5" />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'purchase_currency':
        return 'text-green-500 bg-green-500/20'
      case 'purchase_box':
        return 'text-yellow-500 bg-yellow-500/20'
      case 'open_box':
        return 'text-purple-500 bg-purple-500/20'
      case 'market_sale':
        return 'text-blue-500 bg-blue-500/20'
      default:
        return 'text-gray-500 bg-gray-500/20'
    }
  }

  const getTransactionLabel = (transaction) => {
    switch (transaction.type) {
      case 'purchase_currency':
        return `Achat de ${transaction.virtual_amount} coins`
      case 'purchase_box':
        return `Achat de ${transaction.loot_boxes?.name || 'loot box'}`
      case 'open_box':
        return `Ouverture de ${transaction.loot_boxes?.name || 'loot box'}`
      case 'market_sale':
        return `Vente de ${transaction.items?.name || 'objet'}`
      default:
        return 'Transaction'
    }
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400'
    }
    return colors[rarity] || colors.common
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    return transaction.type === filter
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60))
        return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
      }
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return `il y a ${diffDays} jours`
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    }
  }

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
            <History className="w-10 h-10 text-purple-500" />
            <span>Historique</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Consultez toutes vos transactions et activités
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
            Toutes
          </button>
          <button
            onClick={() => setFilter('purchase_currency')}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              filter === 'purchase_currency'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Achats coins
          </button>
          <button
            onClick={() => setFilter('open_box')}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              filter === 'open_box'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Ouvertures
          </button>
          <button
            onClick={() => setFilter('market_sale')}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
              filter === 'market_sale'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Ventes
          </button>
        </motion.div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Aucune transaction trouvée</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden"
        >
          <div className="divide-y divide-gray-700">
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="p-4 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>

                    {/* Details */}
                    <div>
                      <p className="text-white font-medium">
                        {getTransactionLabel(transaction)}
                      </p>
                      
                      {/* Item obtained info */}
                      {transaction.type === 'open_box' && transaction.items && (
                        <p className={`text-sm ${getRarityColor(transaction.items.rarity)} mt-1`}>
                          Obtenu: {transaction.items.name} ({transaction.items.rarity})
                        </p>
                      )}
                      
                      <p className="text-gray-400 text-sm flex items-center space-x-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    {transaction.amount && (
                      <p className="text-green-400 font-semibold">
                        ${transaction.amount}
                      </p>
                    )}
                    {transaction.virtual_amount && (
                      <p className="text-yellow-500 font-semibold flex items-center justify-end space-x-1">
                        <Coins className="w-4 h-4" />
                        <span>{transaction.virtual_amount}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-4 gap-4"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-gray-400 text-sm">Total dépensé</h3>
          <p className="text-2xl font-bold text-green-400 mt-1">
            ${transactions
              .filter(t => t.type === 'purchase_currency')
              .reduce((sum, t) => sum + (t.amount || 0), 0)
              .toFixed(2)}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-gray-400 text-sm">Boîtes ouvertes</h3>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {transactions.filter(t => t.type === 'open_box').length}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-gray-400 text-sm">Objets vendus</h3>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {transactions.filter(t => t.type === 'market_sale').length}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-gray-400 text-sm">Coins achetés</h3>
          <p className="text-2xl font-bold text-yellow-500 mt-1 flex items-center">
            <Coins className="w-5 h-5 mr-1" />
            {transactions
              .filter(t => t.type === 'purchase_currency')
              .reduce((sum, t) => sum + (t.virtual_amount || 0), 0)}
          </p>
        </div>
      </motion.div>
    </div>
  )
}