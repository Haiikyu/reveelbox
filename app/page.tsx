'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, Sparkles, Trophy, Coins, ArrowRight, CheckCircle, Truck, Shield } from 'lucide-react'
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
      setFeaturedBoxes(data.slice(0, 3))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent" />
        
        <div className="relative text-center space-y-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Découvrez des objets
              <span className="block text-green-600">
                réels uniques
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ouvrez des boîtes mystères et recevez des produits authentiques 
              livrés directement chez vous
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <Link 
              href="/boxes"
              className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Package className="w-5 h-5" />
              <span>Explorer les Boîtes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link 
              href="/signup"
              className="inline-flex items-center space-x-2 bg-white border-2 border-gray-200 hover:border-green-500 text-gray-700 font-medium px-8 py-4 rounded-full transition-all duration-300"
            >
              <span>100 coins offerts</span>
              <Sparkles className="w-5 h-5 text-green-500" />
            </Link>
          </motion.div>
        </div>

        {/* Floating elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-20 h-20 bg-green-500/10 rounded-full"
              initial={{ 
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: 0
              }}
              animate={{ 
                scale: [0, 1, 1, 0],
                opacity: [0, 0.5, 0.5, 0]
              }}
              transition={{ 
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Livraison gratuite</h3>
            <p className="text-gray-600 text-sm mt-2">Sur toutes les commandes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Paiement sécurisé</h3>
            <p className="text-gray-600 text-sm mt-2">Transactions 100% sûres</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Produits authentiques</h3>
            <p className="text-gray-600 text-sm mt-2">Garantie d'authenticité</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20 -mx-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-gray-600">Un processus simple en 3 étapes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 shadow-soft"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Choisissez votre boîte</h3>
              <p className="text-gray-600">
                Explorez notre collection de boîtes mystères thématiques
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-soft"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ouvrez et découvrez</h3>
              <p className="text-gray-600">
                Vivez l'excitation de découvrir votre objet surprise
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-soft"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Recevez chez vous</h3>
              <p className="text-gray-600">
                Livraison gratuite de vos objets directement à domicile
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Boxes */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Boîtes populaires</h2>
          <p className="text-gray-600">Découvrez nos meilleures sélections</p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredBoxes.map((box, index) => (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <LootBoxCard box={box} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link 
            href="/boxes"
            className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <span>Voir toutes les boîtes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-50 rounded-3xl p-12 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Prêt à commencer l'aventure ?
        </h2>
        <p className="text-gray-600 mb-8">
          Inscrivez-vous maintenant et recevez 100 coins gratuits !
        </p>
        <Link 
          href="/signup"
          className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <span>Créer mon compte</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  )
}