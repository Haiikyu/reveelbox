// app/boxes/page.js
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getLootBoxes } from '@/lib/supabase'
import LootBoxCard from '../components/LootBoxCard'
import { Package, Sparkles } from 'lucide-react'

export default function BoxesPage() {
  const [boxes, setBoxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadBoxes()
  }, [])

  const loadBoxes = async () => {
    const { data, error } = await getLootBoxes()
    if (data) {
      setBoxes(data)
    }
    setLoading(false)
  }

  const filteredBoxes = boxes.filter(box => {
    if (filter === 'all') return true
    if (filter === 'affordable') return box.price_virtual <= 500
    if (filter === 'premium') return box.price_virtual > 500
    return true
  })

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
            <span>Catalogue des Loot Boxes</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Choisissez votre boîte et tentez votre chance pour obtenir des objets rares !
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex justify-center space-x-4"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('affordable')}
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              filter === 'affordable'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Abordables (≤500 coins)
          </button>
          <button
            onClick={() => setFilter('premium')}
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              filter === 'premium'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Premium (>500 coins)
          </button>
        </motion.div>
      </div>

      {/* Boxes Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredBoxes.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Aucune boîte trouvée dans cette catégorie</p>
        </div>
      ) : (
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {filteredBoxes.map((box, index) => (
            <motion.div
              key={box.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <LootBoxCard box={box} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/20 mt-12"
      >
        <h3 className="text-lg font-semibold text-white mb-2">
          💡 Astuce: Économisez vos coins !
        </h3>
        <p className="text-gray-300">
          Plus vous ouvrez de boîtes, plus vous gagnez de points de fidélité. 
          Échangez-les contre des coins gratuits dans votre profil !
        </p>
      </motion.div>
    </div>
  )
}