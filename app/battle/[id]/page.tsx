'use client'

import { useAuth } from '../../components/AuthProvider'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Sword, Users, Lock, Globe, Settings, Check,
  Trophy, Gift, Coins, AlertCircle, CheckCircle,
  Loader2, Sparkles, X
} from 'lucide-react'

// ✅ TYPES TYPESCRIPT CORRIGES
interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  price_real: number
  image_url: string
  category: string
  rarity: string
  is_active: boolean
}

interface Profile {
  id: string
  username?: string
  virtual_currency?: number  // ✅ Optionnel
  loyalty_points?: number    // ✅ Optionnel
}

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
}

export default function BoxOpeningPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const [box, setBox] = useState<LootBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [notification, setNotification] = useState<Notification>({ type: 'info', message: '' })
  
  const supabase = createClient()
  const router = useRouter()

  // ✅ FONCTION UTILITAIRE POUR OBTENIR LA CURRENCY DE MANIERE SURE
  const getUserCurrency = (): number => {
    if (!profile || typeof profile.virtual_currency !== 'number') {
      return 0
    }
    return profile.virtual_currency
  }

  // ✅ FONCTION POUR VERIFIER SI L'UTILISATEUR PEUT SE PERMETTRE UNE BOX
  const canAffordBox = (boxPrice: number): boolean => {
    return getUserCurrency() >= boxPrice
  }

  // ✅ FONCTION NOTIFICATION TYPEE
  const showNotification = (type: Notification['type'], message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: 'info', message: '' }), 4000)
  }

  // Protection de route standard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!authLoading && isAuthenticated) {
      loadBox()
    }
  }, [authLoading, isAuthenticated, router])

  const loadBox = async () => {
    try {
      setLoading(true)

      // Récupérer l'ID de la box depuis l'URL
      const url = window.location.pathname
      const boxId = url.split('/').pop()

      if (!boxId) {
        showNotification('error', 'ID de boîte invalide')
        router.push('/boxes')
        return
      }

      // Charger la boîte depuis Supabase
      const { data: boxData, error } = await supabase
        .from('loot_boxes')
        .select('*')
        .eq('id', boxId)
        .single()

      if (error) {
        console.warn('Erreur chargement boîte:', error)
        
        // Fallback avec données de test si erreur
        const fallbackBox: LootBox = {
          id: boxId,
          name: 'BLINDSHOT SNEAKERS',
          description: 'Une sélection exclusive des sneakers les plus recherchées du marché.',
          price_virtual: 150,
          price_real: 6.84,
          image_url: 'https://i.imgur.com/8YwZmtP.png',
          category: 'sneaker',
          rarity: 'common',
          is_active: true
        }
        
        setBox(fallbackBox)
        showNotification('error', 'Données de test utilisées - Vérifiez votre configuration')
      } else {
        setBox(boxData)
        if (boxData) {
          showNotification('success', `Boîte "${boxData.name}" chargée`)
        }
      }

    } catch (error) {
      console.error('Erreur chargement boîte:', error)
      showNotification('error', 'Erreur lors du chargement')
      
      // Fallback d'urgence
      const emergencyBox: LootBox = {
        id: 'emergency-box',
        name: 'Caisse Mystère',
        description: 'Une caisse pleine de surprises !',
        price_virtual: 100,
        price_real: 4.99,
        image_url: 'https://i.imgur.com/8YwZmtP.png',
        category: 'mystery',
        rarity: 'common',
        is_active: true
      }
      setBox(emergencyBox)
    } finally {
      setLoading(false)
    }
  }

  const openBox = async () => {
    if (!box || !user) {
      showNotification('error', 'Erreur: boîte ou utilisateur introuvable')
      return
    }

    // ✅ VERIFICATION CORRIGEE AVEC GESTION DES UNDEFINED
    if (!canAffordBox(box.price_virtual)) {
      showNotification('error', 'Coins insuffisants')
      return
    }

    setOpening(true)
    try {
      console.log('🚀 Ouverture de la boîte...', {
        boxId: box.id,
        userId: user.id,
        price: box.price_virtual,
        userCurrency: getUserCurrency()
      })

      // Simulation d'ouverture de boîte
      setTimeout(() => {
        // Items possibles avec probabilités
        const possibleItems = [
          { name: 'Air Jordan 1 Chicago', value: 500, rarity: 'legendary', probability: 5 },
          { name: 'Nike Dunk Low Panda', value: 250, rarity: 'rare', probability: 15 },
          { name: 'Yeezy Boost 350 V2', value: 300, rarity: 'epic', probability: 20 },
          { name: 'New Balance 550', value: 120, rarity: 'common', probability: 35 },
          { name: 'Nike SB Dunk High', value: 280, rarity: 'epic', probability: 15 },
          { name: 'Air Force 1 Triple White', value: 90, rarity: 'common', probability: 10 }
        ]

        // Sélection aléatoire basée sur les probabilités
        const random = Math.random() * 100
        let cumulative = 0
        let selectedItem = possibleItems[0]

        for (const item of possibleItems) {
          cumulative += item.probability
          if (random <= cumulative) {
            selectedItem = item
            break
          }
        }

        console.log('🎁 Item gagné:', selectedItem)
        
        // Déduire les coins (simulation)
        const newCurrency = Math.max(0, getUserCurrency() - box.price_virtual)
        
        showNotification('success', `Vous avez gagné: ${selectedItem.name} (${selectedItem.value} coins)!`)
        
        // Redirection vers l'inventaire après un délai
        setTimeout(() => {
          router.push('/inventory')
        }, 3000)
        
        setOpening(false)
      }, 3000) // Animation de 3 secondes

    } catch (error: any) {
      console.error('💥 Erreur ouverture boîte:', error)
      showNotification('error', error.message || 'Erreur lors de l\'ouverture de la boîte')
      setOpening(false)
    }
  }

  // ✅ FONCTIONS UTILITAIRES TYPEES
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500'
      case 'epic': return 'from-purple-400 to-pink-500'
      case 'rare': return 'from-blue-400 to-cyan-500'
      default: return 'from-green-400 to-emerald-500'
    }
  }

  const getRarityBadge = (rarity: string): { color: string; text: string } => {
    switch (rarity) {
      case 'legendary': return { color: 'bg-gradient-to-r from-yellow-500 to-orange-500', text: 'MYTHIC' }
      case 'epic': return { color: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'EPIC' }
      case 'rare': return { color: 'bg-gradient-to-r from-blue-500 to-cyan-500', text: 'RARE' }
      default: return { color: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'COMMON' }
    }
  }

  // Loading state standard
  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Loader2 className="h-12 w-12 text-green-500 mx-auto" />
          </motion.div>
          <p className="text-gray-600 text-lg">
            {authLoading ? 'Vérification authentification...' : 'Chargement de la boîte...'}
          </p>
        </div>
      </div>
    )
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Boîte introuvable</h2>
          <p className="text-gray-600 mb-6">Cette boîte n'existe pas ou n'est plus disponible.</p>
          <button
            onClick={() => router.push('/boxes')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Retour aux boîtes
          </button>
        </div>
      </div>
    )
  }

  const badge = getRarityBadge(box.rarity)
  const userCurrency = getUserCurrency()

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Notification */}
          <AnimatePresence>
            {notification.message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
                  notification.type === 'error' 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                {notification.type === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header avec retour */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/boxes')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Ouverture de Boîte
                </h1>
                <p className="text-gray-600 mt-1">
                  Découvrez ce que contient cette boîte mystère
                </p>
              </div>
            </div>
            
            {profile && (
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-lg">{userCurrency.toLocaleString()}</span>
                  <span className="text-gray-600">coins</span>
                </div>
              </div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Image et animation de la boîte */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative bg-gradient-to-br ${getRarityColor(box.rarity)} p-8 rounded-2xl overflow-hidden`}
              >
                {/* Badge de rareté */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white z-10 ${badge.color}`}>
                  {badge.text}
                </div>

                {/* Animation d'ouverture */}
                <AnimatePresence>
                  {opening && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-20"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ 
                            rotate: 360,
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ 
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="mb-4"
                        >
                          <Gift className="h-20 w-20 text-white mx-auto" />
                        </motion.div>
                        <div className="text-white font-bold text-xl mb-2">
                          Ouverture en cours...
                        </div>
                        <div className="text-white/80">
                          Découvrez votre récompense !
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Image de la boîte */}
                <div className="relative h-96 flex items-center justify-center">
                  <motion.img
                    src={box.image_url}
                    alt={box.name}
                    className="max-w-full max-h-full object-contain"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://i.imgur.com/8YwZmtP.png'
                    }}
                  />
                </div>

                {/* Effets de particules */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/30 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [-20, -40, -20],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Informations et actions */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {box.name}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {box.description}
                </p>
              </motion.div>

              {/* Prix et statistiques */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Prix en coins</div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <span className="text-2xl font-bold text-gray-900">
                      {box.price_virtual.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Prix réel</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {box.price_real}€
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Probabilités (simulées) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 border border-gray-200 rounded-xl p-6"
              >
                <h3 className="font-bold text-gray-900 mb-4">Probabilités de drop</h3>
                <div className="space-y-3">
                  {[
                    { rarity: 'Légendaire', probability: '5%', color: 'bg-yellow-500' },
                    { rarity: 'Épique', probability: '35%', color: 'bg-purple-500' },
                    { rarity: 'Rare', probability: '35%', color: 'bg-blue-500' },
                    { rarity: 'Commun', probability: '25%', color: 'bg-gray-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${item.color}`} />
                        <span className="text-gray-700">{item.rarity}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.probability}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Bouton d'ouverture */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-4"
              >
                <motion.button
                  onClick={openBox}
                  disabled={opening || !canAffordBox(box.price_virtual)}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                    opening || !canAffordBox(box.price_virtual)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                  whileHover={!opening && canAffordBox(box.price_virtual) ? { scale: 1.02 } : {}}
                  whileTap={!opening && canAffordBox(box.price_virtual) ? { scale: 0.98 } : {}}
                >
                  {opening ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Ouverture en cours...</span>
                    </>
                  ) : !canAffordBox(box.price_virtual) ? (
                    <>
                      <AlertCircle className="w-6 h-6" />
                      <span>Coins insuffisants</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-6 h-6" />
                      <span>Ouvrir la boîte ({box.price_virtual} coins)</span>
                      <Sparkles className="w-6 h-6" />
                    </>
                  )}
                </motion.button>

                {/* Message d'aide */}
                <div className="mt-4 text-center">
                  {!canAffordBox(box.price_virtual) ? (
                    <p className="text-red-600 text-sm">
                      Il vous manque {(box.price_virtual - userCurrency).toLocaleString()} coins pour ouvrir cette boîte
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Votre solde après ouverture : {(userCurrency - box.price_virtual).toLocaleString()} coins
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}