'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Coins, CreditCard, Shield, Zap, Star, Crown, Sparkles, Gift, TrendingUp, Users, Check, X, Flame, Heart } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { CurrencyDisplay } from '../components/ui/CurrencyDisplay'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../components/AuthProvider'
import { useRouter } from 'next/navigation'

// Interfaces
interface CoinPackage {
  id: string
  name: string
  coins: number
  price: number
  originalPrice?: number
  popular?: boolean
  bestValue?: boolean
  bonus?: number
  features: string[]
  icon: string
  gradient: string
  sparkles?: boolean
}

export default function BuyCoinsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  const router = useRouter()

  // Afficher une notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Packages de coins ultra-attractifs
  const coinPackages: CoinPackage[] = [
    {
      id: 'starter',
      name: 'STARTER PACK',
      coins: 150,
      price: 4.99,
      icon: '🎯',
      gradient: 'from-green-400 to-emerald-600',
      features: [
        'Parfait pour commencer',
        '1-2 boîtes mystères',
        'Accès aux boîtes communes'
      ]
    },
    {
      id: 'popular',
      name: 'POWER PACK',
      coins: 500,
      price: 14.99,
      originalPrice: 19.99,
      popular: true,
      bonus: 50,
      icon: '⚡',
      gradient: 'from-blue-400 to-cyan-600',
      features: [
        '🎁 +50 coins bonus',
        '3-4 boîtes mystères',
        'Accès boîtes rares',
        'Support prioritaire'
      ]
    },
    {
      id: 'premium',
      name: 'PREMIUM PACK',
      coins: 1200,
      price: 34.99,
      originalPrice: 44.99,
      bonus: 200,
      icon: '💎',
      gradient: 'from-purple-400 to-pink-600',
      features: [
        '🔥 +200 coins bonus',
        '8-10 boîtes mystères',
        'Accès boîtes épiques',
        'Notifications exclusives',
        '10% de réduction future'
      ]
    },
    {
      id: 'ultimate',
      name: 'ULTIMATE PACK',
      coins: 3000,
      price: 79.99,
      originalPrice: 99.99,
      bestValue: true,
      bonus: 500,
      sparkles: true,
      icon: '👑',
      gradient: 'from-yellow-400 to-orange-600',
      features: [
        '✨ +500 coins MEGA bonus',
        '20+ boîtes mystères',
        'Accès boîtes légendaires',
        'Support VIP 24/7',
        '15% de réduction permanente',
        'Accès early aux nouveautés'
      ]
    }
  ]

  // Simple loading au démarrage
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Gérer l'achat de coins
  const handlePurchase = async (packageData: CoinPackage) => {
    // Si pas connecté, afficher prompt de connexion
    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    try {
      setProcessing(true)
      setSelectedPackage(packageData.id)

      // Créer une session Stripe Checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          package_id: packageData.id,
          coins: packageData.coins + (packageData.bonus || 0),
          price: packageData.price,
          package_name: packageData.name
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de paiement non reçue')
      }

    } catch (error) {
      console.error('Erreur lors de l\'achat:', error)
      showNotification('Erreur lors du paiement', 'error')
      setProcessing(false)
      setSelectedPackage(null)
    }
  }

  // Calculer les économies
  const calculateSavings = (price: number, originalPrice?: number) => {
    if (!originalPrice) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  // Rediriger vers login en sauvegardant l'intention
  const redirectToLogin = () => {
    localStorage.setItem('redirectAfterLogin', '/buy-coins')
    router.push('/login')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 flex items-center justify-center">
        <LoadingState size="lg" text="💰 Chargement de la boutique..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 relative overflow-hidden">
      
      {/* Particules de fond */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-300/20 rounded-full"
            style={{
              top: `${10 + (i * 8)}%`,
              left: `${5 + (i % 5) * 20}%`
            }}
            animate={{
              y: [-8, 8, -8],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 4 + (i * 0.3),
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold backdrop-blur-sm ${
              notification.type === 'error' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 border border-red-400/50' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 border border-green-400/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? '⚠️' : '✅'}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Header avec navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/boxes')}
            className="hover:bg-gray-100/80 font-semibold"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour aux boîtes
          </Button>
          
          {user && profile ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-gray-200/50"
            >
              <div className="text-right">
                <p className="text-sm text-gray-600 font-medium">Solde actuel</p>
                <CurrencyDisplay 
                  amount={profile.virtual_currency || 100} 
                  type="coins" 
                  size="lg" 
                  showIcon={true}
                  className="font-black"
                />
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Niveau</p>
                <p className="text-lg font-black text-primary-600">
                  {Math.floor((profile.total_exp || 0) / 100) + 1}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-3"
            >
              <p className="text-sm text-blue-800 font-semibold">
                👤 Connectez-vous pour voir votre solde
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mb-8 shadow-2xl shadow-primary-200/50"
          >
            <Coins className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Rechargez vos{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700">
              Coins
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8"
          >
            Choisissez votre pack et débloquez des <strong>sneakers légendaires</strong>. 
            Plus vous investissez, plus vous économisez avec nos <strong>bonus exclusifs</strong> !
          </motion.p>

          {/* Stats de confiance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 text-sm text-gray-600"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Paiement 100% sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">+50K clients satisfaits</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Note 4.9/5</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Packages de coins */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {coinPackages.map((pkg, index) => {
            const savings = calculateSavings(pkg.price, pkg.originalPrice)
            const isHovered = hoveredPackage === pkg.id
            const isProcessing = processing && selectedPackage === pkg.id
            
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index }}
                whileHover={{ y: -10, scale: 1.02 }}
                onHoverStart={() => setHoveredPackage(pkg.id)}
                onHoverEnd={() => setHoveredPackage(null)}
                className="relative group"
              >
                <Card className={`
                  relative overflow-hidden transition-all duration-300 cursor-pointer
                  ${pkg.popular ? 'ring-2 ring-blue-400 shadow-xl shadow-blue-100/50' : ''}
                  ${pkg.bestValue ? 'ring-2 ring-yellow-400 shadow-xl shadow-yellow-100/50' : ''}
                  ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
                  hover:shadow-2xl
                `}>
                  
                  {/* Badges top */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
                    {pkg.popular && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                        🔥 POPULAIRE
                      </Badge>
                    )}
                    
                    {pkg.bestValue && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                        👑 MEILLEURE VALEUR
                      </Badge>
                    )}
                    
                    {savings > 0 && (
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-xs font-bold shadow-lg ml-auto">
                        -{savings}%
                      </Badge>
                    )}
                  </div>

                  {/* Effet sparkles pour l'ultimate */}
                  {pkg.sparkles && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                          style={{
                            top: `${20 + i * 15}%`,
                            left: `${15 + (i % 3) * 25}%`
                          }}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Header avec gradient */}
                  <div className={`p-6 text-center text-white bg-gradient-to-br ${pkg.gradient} relative`}>
                    
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                      animate={isHovered ? {
                        x: ['-100%', '100%']
                      } : {}}
                      transition={{
                        duration: 1.5,
                        repeat: isHovered ? Infinity : 0,
                        ease: "linear"
                      }}
                    />
                    
                    <div className="relative z-10">
                      <div className="text-4xl mb-3">{pkg.icon}</div>
                      <h3 className="text-xl font-black mb-2 tracking-wide">
                        {pkg.name}
                      </h3>
                      
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Coins className="w-6 h-6" />
                        <span className="text-3xl font-black">
                          {pkg.coins.toLocaleString()}
                        </span>
                        {pkg.bonus && (
                          <span className="text-lg">
                            +{pkg.bonus}
                          </span>
                        )}
                      </div>
                      
                      {pkg.bonus && (
                        <Badge className="bg-white/20 text-white px-3 py-1 text-xs font-bold mb-2">
                          +{pkg.bonus} coins bonus !
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6">
                    
                    {/* Prix */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {pkg.originalPrice && (
                          <span className="text-lg text-gray-400 line-through font-semibold">
                            {pkg.originalPrice}€
                          </span>
                        )}
                        <span className="text-3xl font-black text-gray-900">
                          {pkg.price}€
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 font-semibold">
                        {(pkg.price / (pkg.coins + (pkg.bonus || 0)) * 100).toFixed(2)}€ par 100 coins
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {pkg.features.map((feature, featureIndex) => (
                        <motion.div
                          key={featureIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + featureIndex * 0.1 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Bouton d'achat */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        fullWidth
                        disabled={isProcessing}
                        onClick={() => handlePurchase(pkg)}
                        className={`
                          py-4 font-black text-lg transition-all duration-300 relative overflow-hidden
                          ${pkg.bestValue 
                            ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 shadow-xl shadow-yellow-200/50' 
                            : pkg.popular
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-xl shadow-blue-200/50'
                            : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
                          }
                        `}
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Traitement...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <CreditCard size={20} />
                            Acheter maintenant
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Section avantages */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <Card className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
            
            {/* Particules de fond */}
            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.8, 0.2]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: Math.random() * 3
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black mb-4">
                  Pourquoi choisir nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Coins</span> ?
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Maximisez vos chances avec nos avantages exclusifs
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Shield className="w-8 h-8" />,
                    title: 'Paiement Sécurisé',
                    description: 'Chiffrement SSL et protection Stripe. Vos données sont en sécurité.',
                    gradient: 'from-green-400 to-emerald-500'
                  },
                  {
                    icon: <Zap className="w-8 h-8" />,
                    title: 'Livraison Instantanée',
                    description: 'Coins crédités immédiatement après paiement. Pas d\'attente !',
                    gradient: 'from-yellow-400 to-orange-500'
                  },
                  {
                    icon: <Gift className="w-8 h-8" />,
                    title: 'Bonus Exclusifs',
                    description: 'Plus vous achetez, plus vous économisez avec nos méga-bonus.',
                    gradient: 'from-purple-400 to-pink-500'
                  }
                ].map((advantage, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="text-center group cursor-pointer"
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${advantage.gradient} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      {advantage.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary-400 transition-colors">
                      {advantage.title}
                    </h3>
                    
                    <p className="text-gray-400 leading-relaxed">
                      {advantage.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <h2 className="text-3xl font-black text-gray-900 mb-6">
              Questions Fréquentes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {[
                {
                  question: "Les coins expirent-ils ?",
                  answer: "Non, vos coins n'expirent jamais. Utilisez-les quand vous voulez !"
                },
                {
                  question: "Puis-je rembourser mes coins ?",
                  answer: "Les coins ne sont pas remboursables une fois achetés, mais ils ne perdent jamais leur valeur."
                },
                {
                  question: "Comment fonctionne le bonus ?",
                  answer: "Le bonus est automatiquement ajouté lors de l'achat. Plus vous achetez, plus le bonus est important !"
                },
                {
                  question: "Le paiement est-il sécurisé ?",
                  answer: "Oui, nous utilisons Stripe avec chiffrement SSL. Vos données bancaires sont protégées."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  <h4 className="font-bold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-8 pt-6 border-t border-gray-200"
            >
              <p className="text-gray-600 text-sm">
                Une question ? Contactez notre support 24/7 : 
                <a href="mailto:support@reveelbox.com" className="text-primary-600 font-semibold hover:underline ml-1">
                  support@reveelbox.com
                </a>
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>

      {/* Modal de prompt de connexion */}
      <Modal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)}
        title="Connexion requise"
        size="md"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Connexion Nécessaire
          </h3>
          
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour acheter des coins. 
            Connectez-vous ou créez un compte pour continuer.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowLoginPrompt(false)}
            >
              Annuler
            </Button>
            <Button
              fullWidth
              onClick={redirectToLogin}
            >
              Se connecter
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Nouveau ? <span className="text-primary-600 font-semibold">Créez un compte</span> et recevez 100 coins gratuits !
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmation */}
      <Modal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)}
        title="Confirmer l'achat"
        size="md"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Confirmer votre achat
          </h3>
          
          <p className="text-gray-600 mb-6">
            Vous allez être redirigé vers notre plateforme de paiement sécurisé Stripe.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowConfirmModal(false)}
            >
              Annuler
            </Button>
            <Button
              fullWidth
              onClick={() => {
                setShowConfirmModal(false)
                // Logique de paiement ici
              }}
            >
              Continuer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}