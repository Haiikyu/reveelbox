'use client'

import { useState } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Crown, Check, Sparkles, Loader2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function BattlePassShopItem() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [hasPass, setHasPass] = useState(false)
  const supabase = createClient()

  const purchaseBattlePass = async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      // Créer la session Stripe
      const response = await fetch('/api/create-battlepass-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const { sessionId } = await response.json()

      // Rediriger vers Stripe Checkout
      const stripe = await stripePromise
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Erreur achat Battle Pass:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/50 overflow-hidden"
      style={{
        boxShadow: '0 0 40px rgba(234, 179, 8, 0.4)'
      }}
    >
      {/* Badge "EXCLUSIF" */}
      <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
        EXCLUSIF
      </div>

      {/* Particules animées */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            animate={{
              x: [Math.random() * 400, Math.random() * 400],
              y: [Math.random() * 300, Math.random() * 300],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-xl">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              BATTLE PASS
            </h3>
            <p className="text-gray-400 text-sm">Saison 1 - 30 jours</p>
          </div>
        </div>

        {/* Prix */}
        <div className="bg-black/30 rounded-xl p-4 mb-4">
          <p className="text-gray-400 text-sm mb-1">Prix</p>
          <p className="text-4xl font-black text-white">21.99€</p>
          <p className="text-yellow-400 text-xs mt-1">Paiement unique • Argent réel</p>
        </div>

        {/* Avantages */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-white">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">30 récompenses exclusives</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">Pseudo en dégradé OR (Jour 1)</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">Cadres & bannières rares</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">Pins légendaires</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">Cases mystère spéciales</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">Jusqu'à 10,000 coins gratuits</span>
          </div>
        </div>

        {/* Bouton d'achat */}
        <button
          onClick={purchaseBattlePass}
          disabled={loading || !user}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Redirection...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Acheter maintenant
            </>
          )}
        </button>

        {!user && (
          <p className="text-center text-gray-400 text-xs mt-2">
            Connectez-vous pour acheter le Battle Pass
          </p>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <p className="text-yellow-400 text-xs">
            ⚡ Nouvelle récompense chaque jour pendant 30 jours !
          </p>
        </div>
      </div>
    </motion.div>
  )
}