// app/buy-coins/success/page.js
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Coins, ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshProfile } = useAuth()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Rafraîchir le profil pour obtenir le nouveau solde
    refreshProfile()

    // Redirection automatique après 5 secondes
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/boxes')
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [refreshProfile, router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 max-w-md"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <div className="w-24 h-24 bg-green-500/20 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          {/* Animated coins */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -top-4 -right-4"
          >
            <div className="bg-yellow-500/20 rounded-full p-2">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
          </motion.div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold text-white">Paiement réussi !</h1>
          <p className="text-gray-400">
            Vos coins ont été ajoutés à votre compte avec succès.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-3"
        >
          <Link
            href="/boxes"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300"
          >
            <span>Ouvrir des boîtes</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-sm text-gray-400">
            Redirection automatique dans {countdown} secondes...
          </p>
        </motion.div>

        {/* Celebration particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{ 
                x: "50%",
                y: "50%",
                scale: 0
              }}
              animate={{ 
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}