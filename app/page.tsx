'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, Sparkles, Trophy, Coins, ArrowRight } from 'lucide-react'
import { getLootBoxes } from '@/lib/supabase'
import LootBoxCard from './components/LootBoxCard'

export default function HomePage() {
  const [featuredBoxes, setFeaturedBoxes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedBoxes()
  }, [])

  const loadFeaturedBoxes = async () => {
    const { data, error } = await getLootBoxes()
    if (data) {
      setFeaturedBoxes(data.slice(0, 3)) // Afficher les 3 premières
    }
    setLoading(false)
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl" />
        
        <div className="relative text-center py-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              Bienvenue au
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                LootBox Paradise
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Découvrez des trésors cachés, collectionnez des objets rares et légendaires
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href="/boxes"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Package className="w-5 h-5" />
              <span>Explorer les Boîtes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link 
              href="/signup"
              className="inline-flex items-center space-x-2 bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl hover:bg-gray-700 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5" />
              <span>Commencer Gratuitement</span>
            </Link>
          </motion.div>
        </div>

        {/* Animation de particules flottantes */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-30"
              initial={{ 
                x: Math.random() * 100 + '%',
                y: window.innerHeight + 50
              }}
              animate={{ 
                y: -50,
                x: Math.random() * window.innerWidth
              }}
              transition={{ 
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
        >
          <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Objets Rares</h3>
          <p className="text-gray-400">
            Collectionnez des objets uniques allant du commun au légendaire
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
        >
          <Coins className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Économie Virtuelle</h3>
          <p className="text-gray-400">
            Gagnez et dépensez des coins virtuels, échangez sur le marché
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
        >
          <Sparkles className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Animations Épiques</h3>
          <p className="text-gray-400">
            Vivez l'excitation avec nos animations d'ouverture spectaculaires
          </p>
        </motion.div>
      </section>

      {/* Featured Boxes */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Boîtes Populaires</h2>
          <p className="text-gray-400">Découvrez nos meilleures loot boxes</p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredBoxes.map((box, index) => (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <LootBoxCard box={box} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link 
            href="/boxes"
            className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>Voir toutes les boîtes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}