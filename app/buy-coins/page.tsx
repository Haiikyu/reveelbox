// app/buy-coins/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '../components/AuthProvider'
import { Coins, CreditCard, CheckCircle, Sparkles } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function BuyCoinsPage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [loading, setLoading] = useState(false)

  const coinPackages = [
    {
      id: 1,
      name: 'Starter Pack',
      coins: 500,
      price: 4.99,
      bonus: 0,
      popular: false,
      color: 'from-gray-600 to-gray-400'
    },
    {
      id: 2,
      name: 'Value Pack',
      coins: 1200,
      price: 9.99,
      bonus: 200,
      popular: true,
      color: 'from-purple-600 to-pink-600'
    },
    {
      id: 3,
      name: 'Premium Pack',
      coins: 2500,
      price: 19.99,
      bonus: 500,
      popular: false,
      color: 'from-yellow-600 to-orange-600'
    },
    {
      id: 4,
      name: 'Ultimate Pack',
      coins: 5500,
      price: 39.99,
      bonus: 1500,
      popular: false,
      color: 'from-purple-600 to-blue-600'
    }
  ]

  const handlePurchase = async (pack) => {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    setSelectedPackage(pack)

    try {
      // Créer une session de paiement côté serveur
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          packageId: pack.id,
          coins: pack.coins + pack.bonus,
          price: pack.price,
        }),
      })

      const session = await response.json()

      // Rediriger vers Stripe Checkout
      const stripe = await stripePromise
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      })

      if (error) {
        console.error('Erreur Stripe:', error)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
      setSelectedPackage(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white flex items-center justify-center space-x-3">
            <Coins className="w-10 h-10 text-yellow-500" />
            <span>Acheter des Coins</span>
          </h1>
          <p className="text-gray-400 mt-2">
            Rechargez votre compte pour ouvrir plus de loot boxes !
          </p>
        </motion.div>
      </div>

      {/* Packages Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {coinPackages.map((pack, index) => (
          <motion.div
            key={pack.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            className={`relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 ${
              pack.popular ? 'border-purple-500' : 'border-gray-700'
            } hover:border-purple-500 transition-all duration-300 cursor-pointer`}
            onClick={() => handlePurchase(pack)}
          >
            {/* Popular Badge */}
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  POPULAIRE
                </span>
              </div>
            )}

            <div className="space-y-4">
              {/* Coin Icon */}
              <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${pack.color} rounded-2xl flex items-center justify-center transform ${
                loading && selectedPackage?.id === pack.id ? 'animate-spin' : ''
              }`}>
                <Coins className="w-10 h-10 text-white" />
              </div>

              {/* Package Name */}
              <h3 className="text-xl font-bold text-white text-center">{pack.name}</h3>

              {/* Coins Amount */}
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">
                  {pack.coins.toLocaleString()}
                </p>
                {pack.bonus > 0 && (
                  <p className="text-sm text-green-400 mt-1">
                    +{pack.bonus} coins bonus!
                  </p>
                )}
                <p className="text-gray-400 text-sm mt-1">coins</p>
              </div>

              {/* Price */}
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  ${pack.price}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ${(pack.price / (pack.coins + pack.bonus) * 1000).toFixed(2)} / 1000 coins
                </p>
              </div>

              {/* Purchase Button */}
              <button
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                  pack.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/25'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading && selectedPackage?.id === pack.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Traitement...
                  </span>
                ) : (
                  'Acheter'
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/20"
      >
        <div className="flex items-start space-x-4">
          <CreditCard className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Paiement 100% Sécurisé
            </h3>
            <p className="text-gray-300 text-sm">
              Vos paiements sont traités de manière sécurisée via Stripe. 
              Nous ne stockons jamais vos informations de carte bancaire.
              Les coins sont ajoutés instantanément à votre compte après le paiement.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Loyalty Points Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
      >
        <div className="flex items-start space-x-4">
          <Sparkles className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Programme de Fidélité
            </h3>
            <p className="text-gray-300 text-sm">
              Gagnez des points de fidélité à chaque ouverture de loot box ! 
              Échangez vos points contre des coins gratuits dans votre profil.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-yellow-400 font-semibold">100 points</p>
                <p className="text-gray-400 text-sm">= 50 coins</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-yellow-400 font-semibold">500 points</p>
                <p className="text-gray-400 text-sm">= 300 coins</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-yellow-400 font-semibold">1000 points</p>
                <p className="text-gray-400 text-sm">= 700 coins</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}