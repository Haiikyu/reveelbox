// app/boxes/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getLootBox, purchaseLootBox, openLootBox } from '@/lib/supabase'
import { useAuth } from '@/app/components/AuthProvider'
import { Package, Coins, Sparkles, AlertCircle, Trophy } from 'lucide-react'

export default function BoxDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()
  
  const [box, setBox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [opening, setOpening] = useState(false)
  const [obtainedItem, setObtainedItem] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadBoxDetails()
  }, [id])

  const loadBoxDetails = async () => {
    const { data, error } = await getLootBox(id)
    if (data) {
      setBox(data)
    }
    setLoading(false)
  }

  const handlePurchase = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setError('')
    setPurchasing(true)

    const { data, error } = await purchaseLootBox(user.id, box.id)
    
    if (error || !data.success) {
      setError(error?.message || data?.error || 'Erreur lors de l\'achat')
      setPurchasing(false)
    } else {
      await refreshProfile()
      setPurchasing(false)
      // Ouvrir automatiquement la boîte après l'achat
      handleOpen()
    }
  }

  const handleOpen = async () => {
    setOpening(true)
    setObtainedItem(null)

    // Simuler l'animation d'ouverture
    setTimeout(async () => {
      const { data, error } = await openLootBox(user.id, box.id)
      
      if (data?.success && data.item) {
        setObtainedItem(data.item)
        await refreshProfile()
      } else {
        setError('Erreur lors de l\'ouverture de la boîte')
        setOpening(false)
      }
    }, 3000)
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

  const getRarityGlow = (rarity) => {
    const glows = {
      common: 'shadow-gray-400/50',
      uncommon: 'shadow-green-400/50',
      rare: 'shadow-blue-400/50',
      epic: 'shadow-purple-400/50',
      legendary: 'shadow-yellow-400/50'
    }
    return glows[rarity] || glows.common
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!box) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Boîte non trouvée</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Box Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20"
      >
        <div className="grid md:grid-cols-2 gap-8">
          {/* Box Image/Animation */}
          <div className="flex justify-center items-center">
            <motion.div
              animate={opening ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 3, repeat: opening ? Infinity : 0 }}
              className={`w-48 h-48 bg-gradient-to-br ${
                box.name.includes('Bronze') ? 'from-orange-600 to-orange-400' :
                box.name.includes('Silver') ? 'from-gray-500 to-gray-300' :
                'from-yellow-600 to-yellow-400'
              } rounded-3xl flex items-center justify-center shadow-2xl`}
            >
              <Package className="w-24 h-24 text-white" />
            </motion.div>
          </div>

          {/* Box Info */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">{box.name}</h1>
            <p className="text-gray-400">{box.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500 font-semibold text-xl">{box.price_virtual} coins</span>
              </div>
              
              {box.price_real && (
                <div className="text-green-400 font-semibold">
                  ou ${box.price_real} USD
                </div>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center space-x-2 text-red-400"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {user ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-400">
                  Votre solde: <span className="text-yellow-500 font-semibold">{profile?.virtual_currency || 0} coins</span>
                </div>
                
                <button
                  onClick={handlePurchase}
                  disabled={purchasing || opening || (profile?.virtual_currency || 0) < box.price_virtual}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing ? 'Achat en cours...' : 
                   opening ? 'Ouverture...' :
                   (profile?.virtual_currency || 0) < box.price_virtual ? 'Solde insuffisant' :
                   'Acheter et ouvrir'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300"
              >
                Se connecter pour acheter
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Possible Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <span>Objets possibles</span>
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {box.loot_box_items?.map((item) => (
            <motion.div
              key={item.items.id}
              whileHover={{ scale: 1.05 }}
              className={`bg-gray-700/50 rounded-xl p-4 border border-gray-600 hover:border-purple-500/50 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium bg-gradient-to-r ${getRarityColor(item.items.rarity)} bg-clip-text text-transparent`}>
                  {item.items.rarity.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">{item.drop_rate}%</span>
              </div>
              <h3 className="font-semibold text-white">{item.items.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{item.items.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Opening Animation Overlay */}
      <AnimatePresence>
        {opening && !obtainedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full opacity-20 blur-xl absolute inset-0" />
              <Package className="w-32 h-32 text-white relative z-10" />
            </motion.div>
            <p className="absolute bottom-20 text-white text-xl">Ouverture en cours...</p>
          </motion.div>
        )}

        {/* Item Obtained Overlay */}
        {obtainedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => {
              setObtainedItem(null)
              setOpening(false)
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="text-center space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`w-40 h-40 bg-gradient-to-br ${getRarityColor(obtainedItem.rarity)} rounded-3xl mx-auto flex items-center justify-center shadow-2xl ${getRarityGlow(obtainedItem.rarity)}`}
              >
                <Trophy className="w-20 h-20 text-white" />
              </motion.div>
              
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  {obtainedItem.name}
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`text-lg font-semibold bg-gradient-to-r ${getRarityColor(obtainedItem.rarity)} bg-clip-text text-transparent`}
                >
                  {obtainedItem.rarity.toUpperCase()}
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-400 mt-4"
                >
                  {obtainedItem.description}
                </motion.p>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => {
                  setObtainedItem(null)
                  setOpening(false)
                  router.push('/inventory')
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300"
              >
                Voir dans l'inventaire
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}