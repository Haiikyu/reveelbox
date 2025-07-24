// app/buy-coins/success/page.tsx - Version corrigée avec standard ReveelBox

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Coins, Gift, Star, Trophy, Sparkles, ArrowRight, Home, Package, Crown, Zap, Heart, Users, TrendingUp } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { CurrencyDisplay } from '../../components/ui/CurrencyDisplay'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Interfaces
interface PurchaseDetails {
  packageName: string
  coinsReceived: number
  bonusCoins: number
  totalPaid: string
  transactionId: string
  timestamp: string
}

interface UserProfile {
  id: string
  virtual_currency: number
  loyalty_points: number
  total_exp: number
}

function SuccessPageContent() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [confettiActive, setConfettiActive] = useState(false)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Générer des confettis
  const generateConfetti = () => {
    const newParticles = []
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316']
    
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
    setParticles(newParticles)
    setConfettiActive(true)
    
    setTimeout(() => {
      setParticles([])
      setConfettiActive(false)
    }, 5000)
  }

  // Charger les données de l'achat
  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Récupérer l'utilisateur actuel
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !currentUser) {
          console.error('Erreur auth:', userError)
          router.push('/login')
          return
        }
        
        setUser(currentUser)

        // Récupérer les paramètres de l'URL
        const sessionId = searchParams.get('session_id')
        const packageName = searchParams.get('package_name') || 'Package Premium'
        const coins = searchParams.get('coins') || '500'
        const bonus = searchParams.get('bonus') || '50'
        const amount = searchParams.get('amount') || '14.99'

        // Simuler les détails d'achat (en production, récupérer depuis Stripe)
        setPurchaseDetails({
          packageName: packageName,
          coinsReceived: parseInt(coins) - parseInt(bonus),
          bonusCoins: parseInt(bonus),
          totalPaid: amount + '€',
          transactionId: sessionId || `TXN_${Date.now()}`,
          timestamp: new Date().toLocaleString('fr-FR')
        })

        // Charger le profil utilisateur mis à jour
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, virtual_currency, loyalty_points, total_exp')
          .eq('id', currentUser.id)
          .single()

        if (profileData) {
          setUserProfile(profileData)
        }

        setLoading(false)
        
        // Lancer les confettis après 500ms
        setTimeout(() => {
          generateConfetti()
        }, 500)

      } catch (error) {
        console.error('Erreur:', error)
        setLoading(false)
      }
    }

    fetchPurchaseData()
  }, [router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 flex items-center justify-center">
        <LoadingState size="lg" text="🎉 Finalisation de votre achat..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 relative overflow-hidden">
      
      {/* Confettis animés */}
      <AnimatePresence>
        {confettiActive && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full pointer-events-none z-10"
            style={{ 
              backgroundColor: particle.color,
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            initial={{ 
              scale: 0,
              opacity: 1,
              rotate: 0
            }}
            animate={{ 
              scale: [0, 1, 0.5, 0],
              opacity: [1, 1, 0.5, 0],
              rotate: 360,
              y: [0, -100, 200],
              x: [0, Math.random() * 100 - 50]
            }}
            transition={{ 
              duration: 4,
              ease: "easeOut",
              times: [0, 0.2, 0.8, 1]
            }}
          />
        ))}
      </AnimatePresence>

      {/* Particules de fond permanentes */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-300/30 rounded-full"
            style={{
              top: `${15 + (i * 10)}%`,
              left: `${10 + (i % 4) * 25}%`
            }}
            animate={{
              y: [-5, 5, -5],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 3 + (i * 0.2),
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-20">
        
        {/* Hero Success Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          
          {/* Icône de succès animée */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2, 
              type: "spring", 
              stiffness: 200,
              damping: 10
            }}
            className="relative inline-block mb-8"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-200/50 relative">
              <CheckCircle className="w-16 h-16 text-white" />
              
              {/* Anneaux de succès */}
              <motion.div
                className="absolute inset-0 border-4 border-green-300 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 border-2 border-green-200 rounded-full"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-black text-gray-900 mb-6"
          >
            🎉 Achat <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Réussi</span> !
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Vos coins ont été ajoutés à votre compte. 
            <strong> Prêt à découvrir des trésors exceptionnels ?</strong>
          </motion.p>

          {/* Stats de succès */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-8 text-sm text-gray-600"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Paiement confirmé</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Coins crédités</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">Bonus inclus</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Section principale - Détails de l'achat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Détails de la transaction */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 bg-white shadow-xl border-0 relative overflow-hidden">
              
              {/* Gradient de fond */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">Récapitulatif de l'achat</h2>
                    <p className="text-gray-600">Détails de votre transaction</p>
                  </div>
                </div>

                {purchaseDetails && (
                  <div className="space-y-6">
                    
                    {/* Package acheté */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{purchaseDetails.packageName}</h3>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 font-bold">
                          ✅ ACHETÉ
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Coins className="w-5 h-5 text-primary-600" />
                            <span className="text-2xl font-black text-primary-600">
                              {purchaseDetails.coinsReceived}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-semibold">Coins principaux</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <Gift className="w-5 h-5 text-purple-600" />
                            <span className="text-2xl font-black text-purple-600">
                              +{purchaseDetails.bonusCoins}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-semibold">Bonus offert</p>
                        </div>
                      </div>
                    </div>

                    {/* Détails transaction */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-semibold">Total payé</span>
                        <span className="text-xl font-black text-gray-900">{purchaseDetails.totalPaid}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-semibold">ID Transaction</span>
                        <span className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          {purchaseDetails.transactionId.slice(0, 16)}...
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-600 font-semibold">Date & Heure</span>
                        <span className="text-gray-700 font-semibold">{purchaseDetails.timestamp}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Nouveau solde et stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white shadow-xl relative overflow-hidden">
              
              {/* Particules de fond */}
              <div className="absolute inset-0">
                {[...Array(8)].map((_, i) => (
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Votre Nouveau Solde</h2>
                    <p className="text-gray-300">Prêt pour l'aventure !</p>
                  </div>
                </div>

                {userProfile && (
                  <div className="space-y-6">
                    
                    {/* Solde principal */}
                    <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring", stiffness: 150 }}
                        className="flex items-center justify-center gap-2 mb-2"
                      >
                        <Coins className="w-8 h-8 text-primary-400" />
                        <span className="text-4xl md:text-5xl font-black text-white">
                          {userProfile.virtual_currency.toLocaleString()}
                        </span>
                      </motion.div>
                      <p className="text-primary-200 font-semibold">Coins disponibles</p>
                    </div>

                    {/* Stats utilisateur */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-black">{userProfile.loyalty_points}</span>
                        </div>
                        <p className="text-gray-300 text-sm font-semibold">Points fidélité</p>
                      </div>
                      
                      <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          <span className="text-2xl font-black">{Math.floor((userProfile.total_exp || 0) / 100) + 1}</span>
                        </div>
                        <p className="text-gray-300 text-sm font-semibold">Niveau</p>
                      </div>
                    </div>

                    {/* Achievements débloques */}
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold text-yellow-200">Nouveau Achievement !</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        🏆 <strong>Investisseur</strong> - Premier achat de coins réalisé
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Actions principales */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          
          {/* Ouvrir des boîtes */}
          <motion.div whileHover={{ scale: 1.02, y: -5 }}>
            <Card className="p-6 text-center bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push('/boxes')}>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Package className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2">Ouvrir des Boîtes</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Utilisez vos coins pour découvrir des sneakers exclusives
              </p>
              
              <Button fullWidth className="group-hover:shadow-lg transition-shadow">
                <ArrowRight size={16} className="mr-2" />
                Commencer
              </Button>
            </Card>
          </motion.div>

          {/* Voir l'inventaire */}
          <motion.div whileHover={{ scale: 1.02, y: -5 }}>
            <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push('/inventory')}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Gift className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2">Mon Inventaire</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Consultez votre collection de sneakers gagnées
              </p>
              
              <Button variant="outline" fullWidth className="group-hover:shadow-lg transition-shadow border-purple-300 hover:border-purple-400">
                <Star size={16} className="mr-2" />
                Voir
              </Button>
            </Card>
          </motion.div>

          {/* Profil */}
          <motion.div whileHover={{ scale: 1.02, y: -5 }}>
            <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push('/profile')}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2">Mon Profil</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Gérez vos paramètres et statistiques
              </p>
              
              <Button variant="outline" fullWidth className="group-hover:shadow-lg transition-shadow border-green-300 hover:border-green-400">
                <Heart size={16} className="mr-2" />
                Profil
              </Button>
            </Card>
          </motion.div>
        </motion.div>

        {/* Section recommandations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="p-8 text-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
            
            {/* Effet de shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.3, type: "spring", stiffness: 150 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mb-6 shadow-2xl"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Prêt pour la <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Chasse aux Trésors</span> ?
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Vos coins vous attendent ! Découvrez des sneakers légendaires et construisez la collection de vos rêves.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg"
                    onClick={() => router.push('/boxes')}
                    className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 px-8 py-4 text-lg font-black shadow-2xl shadow-primary-500/30"
                  >
                    <Package size={24} className="mr-3" />
                    🎯 Ouvrir des Boîtes
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => router.push('/')}
                    className="px-8 py-4 text-lg font-black bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  >
                    <Home size={24} className="mr-3" />
                    🏠 Accueil
                  </Button>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="mt-8 flex items-center justify-center gap-8 text-gray-300"
              >
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-bold">Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold">Livraison instantanée</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="font-bold">Support 24/7</span>
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Footer de remerciement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
          className="text-center mt-12 pt-8 border-t border-gray-200"
        >
          <p className="text-gray-600 text-lg mb-4">
            <strong>Merci</strong> de faire confiance à ReveelBox ! 🙏
          </p>
          <p className="text-gray-500 text-sm">
            Une question ? Notre équipe est là pour vous : 
            <a href="mailto:support@reveelbox.com" className="text-primary-600 font-semibold hover:underline ml-1">
              support@reveelbox.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

// Composant principal avec Suspense
export default function BuyCoinsSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 flex items-center justify-center">
        <LoadingState size="lg" text="🎉 Chargement..." />
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}