'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gift, 
  Clock, 
  Star, 
  Zap, 
  Crown, 
  Sparkles,
  CheckCircle,
  Lock,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Package,
  Coins,
  ArrowLeft,
  RefreshCw,
  Timer,
  Flame,
  Info,
  AlertCircle
} from 'lucide-react'

export default function FreedropPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [dailyBoxes, setDailyBoxes] = useState([])
  const [claimedToday, setClaimedToday] = useState([])
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [selectedBox, setSelectedBox] = useState(null)
  const [isOpening, setIsOpening] = useState(false)
  const [openedItem, setOpenedItem] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [streak, setStreak] = useState(0)
  const [notification, setNotification] = useState({ type: '', message: '' })

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 4000)
  }

  // Protection de route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadFreedropData()
      
      // Mettre à jour le timer chaque seconde
      const timer = setInterval(updateTimeUntilReset, 1000)
      return () => clearInterval(timer)
    }
  }, [authLoading, isAuthenticated, user])

  const loadFreedropData = async () => {
    try {
      setLoading(true)
      
      // Charger les caisses quotidiennes
      await loadDailyBoxes()
      
      // Vérifier les réclamations d'aujourd'hui
      await checkTodayClaims()
      
      // Charger le streak
      await loadStreak()
      
    } catch (error) {
      console.error('Error loading freedrop data:', error)
      showNotification('error', 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }
	
  const loadDailyBoxes = async () => {
    const supabase = createClient()
    
    // Charger toutes les caisses disponibles pour le freedrop
    const { data, error } = await supabase
      .from('loot_boxes')
      .select(`
        *,
        loot_box_items (
          probability,
          items (
            id,
            name,
            description,
            rarity,
            image_url,
            market_value,
            category
          )
        )
      `)
      .eq('is_active', true)
      .eq('is_daily_free', true) // Nouvelle colonne pour identifier les caisses daily
      .order('required_level', { ascending: true })

    if (error) {
      console.error('Error loading daily boxes:', error)
      
      // Données de test si pas de caisses en DB
      const testBoxes = generateTestDailyBoxes()
      setDailyBoxes(testBoxes)
      return
    }

    // Si pas de caisses daily en DB, générer des données de test
    if (!data || data.length === 0) {
      const testBoxes = generateTestDailyBoxes()
      setDailyBoxes(testBoxes)
    } else {
      setDailyBoxes(data)
    }
  }

  const generateTestDailyBoxes = () => {
    const userLevel = calculateUserLevel(profile?.total_exp || 0)
    
    return [
      {
        id: 'daily-1',
        name: 'Caisse Débutant',
        description: 'Votre première caisse quotidienne gratuite',
        required_level: 1,
        image_url: 'https://i.imgur.com/daily1.png',
        rarity: 'common',
        max_value: 50,
        loot_box_items: [
          {
            probability: 70,
            items: { id: '1', name: 'Porte-clés Basic', rarity: 'common', market_value: 5, image_url: 'https://via.placeholder.com/200x200/9CA3AF/FFFFFF?text=Basic' }
          },
          {
            probability: 25,
            items: { id: '2', name: 'Sticker Cool', rarity: 'rare', market_value: 15, image_url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Rare' }
          },
          {
            probability: 5,
            items: { id: '3', name: 'Badge Collector', rarity: 'epic', market_value: 35, image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Epic' }
          }
        ]
      },
      {
        id: 'daily-2',
        name: 'Caisse Aventurier',
        description: 'Pour les explorateurs expérimentés',
        required_level: 5,
        image_url: 'https://i.imgur.com/daily2.png',
        rarity: 'rare',
        max_value: 100,
        loot_box_items: [
          {
            probability: 60,
            items: { id: '4', name: 'Gadget Vintage', rarity: 'common', market_value: 20, image_url: 'https://via.placeholder.com/200x200/9CA3AF/FFFFFF?text=Vintage' }
          },
          {
            probability: 30,
            items: { id: '5', name: 'Objet de Collection', rarity: 'rare', market_value: 45, image_url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Collection' }
          },
          {
            probability: 10,
            items: { id: '6', name: 'Pièce Rare', rarity: 'epic', market_value: 80, image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Rare+Coin' }
          }
        ]
      },
      {
        id: 'daily-3',
        name: 'Caisse Expert',
        description: 'Réservée aux maîtres du jeu',
        required_level: 10,
        image_url: 'https://i.imgur.com/daily3.png',
        rarity: 'epic',
        max_value: 200,
        loot_box_items: [
          {
            probability: 50,
            items: { id: '7', name: 'Accessoire Premium', rarity: 'rare', market_value: 50, image_url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Premium' }
          },
          {
            probability: 35,
            items: { id: '8', name: 'Objet Exclusif', rarity: 'epic', market_value: 120, image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Exclusif' }
          },
          {
            probability: 15,
            items: { id: '9', name: 'Trésor Légendaire', rarity: 'legendary', market_value: 180, image_url: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=Trésor' }
          }
        ]
      },
      {
        id: 'daily-4',
        name: 'Caisse Maître',
        description: 'Le summum de la récompense quotidienne',
        required_level: 20,
        image_url: 'https://i.imgur.com/daily4.png',
        rarity: 'legendary',
        max_value: 350,
        loot_box_items: [
          {
            probability: 40,
            items: { id: '10', name: 'Objet de Maître', rarity: 'epic', market_value: 100, image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Maître' }
          },
          {
            probability: 40,
            items: { id: '11', name: 'Relique Antique', rarity: 'legendary', market_value: 250, image_url: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=Relique' }
          },
          {
            probability: 20,
            items: { id: '12', name: 'Artefact Mythique', rarity: 'legendary', market_value: 300, image_url: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=Mythique' }
          }
        ]
      }
    ]
  }

  const checkTodayClaims = async () => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Vérifier les réclamations d'aujourd'hui
    const { data, error } = await supabase
      .from('daily_claims')
      .select('daily_box_id, claimed_at')
      .eq('user_id', user.id)
      .gte('claimed_at', `${today}T00:00:00.000Z`)
      .lt('claimed_at', `${today}T23:59:59.999Z`)

    if (!error && data) {
      setClaimedToday(data.map(claim => claim.daily_box_id))
    }
  }

  const loadStreak = async () => {
    const supabase = createClient()
    
    // Calculer le streak basé sur les réclamations récentes
    const { data, error } = await supabase
      .from('daily_claims')
      .select('claimed_at')
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false })
      .limit(30)

    if (!error && data) {
      const currentStreak = calculateStreak(data)
      setStreak(currentStreak)
    }
  }

  const calculateStreak = (claims) => {
    if (!claims || claims.length === 0) return 0
    
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      
      const hasClaimOnDate = claims.some(claim => {
        const claimDate = new Date(claim.claimed_at)
        claimDate.setHours(0, 0, 0, 0)
        return claimDate.getTime() === checkDate.getTime()
      })
      
      if (hasClaimOnDate) {
        streak++
      } else if (i > 0) { // Ne pas casser le streak si pas de claim aujourd'hui
        break
      }
    }
    
    return streak
  }

  const calculateUserLevel = (exp) => {
    return Math.floor(exp / 100) + 1
  }

  const updateTimeUntilReset = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600'
    }
    return colors[rarity] || colors.common
  }

  const getRarityBg = (rarity) => {
    const colors = {
      common: 'bg-gray-50 border-gray-200',
      rare: 'bg-blue-50 border-blue-200',
      epic: 'bg-purple-50 border-purple-200',
      legendary: 'bg-yellow-50 border-yellow-200'
    }
    return colors[rarity] || colors.common
  }

  const claimDailyBox = async (box) => {
    if (isOpening) return
    
    try {
      setIsOpening(true)
      setSelectedBox(box)
      
      // Simuler l'ouverture
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Calculer l'objet obtenu selon les probabilités
      const obtainedItem = calculateRandomItem(box.loot_box_items)
      
      const supabase = createClient()

      // Enregistrer la réclamation
      const { error: claimError } = await supabase
        .from('daily_claims')
        .insert({
          user_id: user.id,
          daily_box_id: box.id,
          item_id: obtainedItem.id,
          claimed_at: new Date().toISOString()
        })

      if (claimError) {
        console.error('Error recording claim:', claimError)
      }

      // Ajouter à l'inventaire
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: user.id,
          item_id: obtainedItem.id,
          quantity: 1,
          obtained_at: new Date().toISOString(),
          obtained_from: 'daily_free'
        })

      if (inventoryError) {
        console.error('Error adding to inventory:', inventoryError)
      }

      // Ajouter de l'XP
      const xpGained = Math.floor(obtainedItem.market_value / 10) + 5
      const { error: xpError } = await supabase
        .from('profiles')
        .update({ 
          total_exp: (profile?.total_exp || 0) + xpGained 
        })
        .eq('id', user.id)

      if (xpError) {
        console.error('Error updating XP:', xpError)
      }

      // Enregistrer la transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'daily_free_claim',
          item_id: obtainedItem.id,
          virtual_amount: 0,
          description: `Réclamation quotidienne: ${box.name}`
        })

      if (transactionError) {
        console.error('Error recording transaction:', transactionError)
      }

      setOpenedItem({ ...obtainedItem, xpGained })
      setShowResult(true)
      
      // Mettre à jour les réclamations d'aujourd'hui
      setClaimedToday(prev => [...prev, box.id])
      
      showNotification('success', `Vous avez obtenu ${obtainedItem.name} !`)
      
    } catch (error) {
      console.error('Error claiming daily box:', error)
      showNotification('error', 'Erreur lors de la réclamation')
    } finally {
      setIsOpening(false)
    }
  }

  const calculateRandomItem = (lootBoxItems) => {
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const lootItem of lootBoxItems) {
      cumulative += lootItem.probability
      if (random <= cumulative) {
        return lootItem.items
      }
    }
    
    // Fallback au premier item
    return lootBoxItems[0]?.items
  }

  const userLevel = calculateUserLevel(profile?.total_exp || 0)

  // Loading state - Protégé par l'auth
  if (authLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Chargement des caisses quotidiennes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      
      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
              notification.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Gift className="h-10 w-10 text-green-600" />
                Caisses Quotidiennes
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Réclamez vos récompenses quotidiennes gratuites • Niveau {userLevel}
              </p>
            </div>
          </div>

          {/* Stats Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Timer */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Timer className="h-5 w-5" />
                    <span className="font-semibold">Prochaine réinitialisation</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 font-mono">{timeUntilReset}</div>
                  <div className="text-sm text-gray-600 mt-1">Nouvelles caisses disponibles</div>
                </div>
                <Clock className="h-12 w-12 text-blue-300" />
              </div>
            </div>

            {/* Streak */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Flame className="h-5 w-5" />
                    <span className="font-semibold">Série actuelle</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{streak} jours</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {streak > 0 ? 'Continue ta série !' : 'Commence ta série aujourd\'hui'}
                  </div>
                </div>
                <Award className="h-12 w-12 text-orange-300" />
              </div>
            </div>

            {/* Level Progress */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Star className="h-5 w-5" />
                    <span className="font-semibold">Niveau {userLevel}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {profile?.total_exp || 0} / {userLevel * 100} XP
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((profile?.total_exp || 0) % 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <Crown className="h-12 w-12 text-purple-300" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Comment ça marche ?</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Réclamez une caisse gratuite par jour selon votre niveau</li>
                <li>• Plus votre niveau est élevé, plus les récompenses sont intéressantes</li>
                <li>• Maintenez votre série quotidienne pour débloquer des bonus</li>
                <li>• Les caisses se réinitialisent chaque jour à minuit</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Daily Boxes Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {dailyBoxes.map((box, index) => {
            const isUnlocked = userLevel >= (box.required_level || 1)
            const isClaimed = claimedToday.includes(box.id)
            const canClaim = isUnlocked && !isClaimed

            return (
              <DailyBoxCard
                key={box.id}
                box={box}
                index={index}
                isUnlocked={isUnlocked}
                isClaimed={isClaimed}
                canClaim={canClaim}
                onClaim={() => claimDailyBox(box)}
                getRarityColor={getRarityColor}
                getRarityBg={getRarityBg}
              />
            )
          })}
        </motion.div>

        {/* Streak Rewards Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-yellow-600" />
            Bonus de Série
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { days: 3, bonus: '+10% XP', color: 'blue' },
              { days: 7, bonus: '+1 Caisse Bonus', color: 'green' },
              { days: 14, bonus: '+25% XP', color: 'purple' },
              { days: 30, bonus: 'Caisse Légendaire', color: 'yellow' }
            ].map((reward, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border-2 text-center ${
                  streak >= reward.days
                    ? `bg-${reward.color}-50 border-${reward.color}-200`
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`text-2xl font-bold ${
                  streak >= reward.days ? `text-${reward.color}-600` : 'text-gray-400'
                }`}>
                  {reward.days}j
                </div>
                <div className={`text-sm font-medium ${
                  streak >= reward.days ? `text-${reward.color}-700` : 'text-gray-500'
                }`}>
                  {reward.bonus}
                </div>
                {streak >= reward.days && (
                  <CheckCircle className={`h-5 w-5 text-${reward.color}-600 mx-auto mt-2`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Opening Animation Modal */}
      <OpeningModal
        isOpen={isOpening}
        box={selectedBox}
        getRarityColor={getRarityColor}
      />

      {/* Result Modal */}
      <ResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        item={openedItem}
        getRarityColor={getRarityColor}
        getRarityBg={getRarityBg}
      />
    </div>
  )
}

// Composant de carte de caisse quotidienne
function DailyBoxCard({ box, index, isUnlocked, isClaimed, canClaim, onClaim, getRarityColor, getRarityBg }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative bg-white rounded-2xl shadow-lg border-3 p-6 transition-all duration-300 ${
        canClaim 
          ? `${getRarityBg(box.rarity)} hover:scale-105 cursor-pointer` 
          : isUnlocked
          ? 'bg-gray-50 border-gray-200'
          : 'bg-gray-100 border-gray-300 opacity-60'
      }`}
      onClick={canClaim ? onClaim : undefined}
    >
      {/* Status Badge */}
      <div className="absolute -top-3 -right-3">
        {isClaimed ? (
          <div className="bg-green-500 text-white rounded-full p-2">
            <CheckCircle className="h-5 w-5" />
          </div>
        ) : !isUnlocked ? (
          <div className="bg-gray-400 text-white rounded-full p-2">
            <Lock className="h-5 w-5" />
          </div>
        ) : (
          <div className="bg-yellow-500 text-white rounded-full p-2 animate-pulse">
            <Gift className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Rarity Glow */}
      {canClaim && (
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${getRarityColor(box.rarity)} opacity-20 animate-pulse`} />
      )}

      {/* Content */}
      <div className="relative z-10 text-center">
        
        {/* Box Image */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
          {box.image_url ? (
            <img src={box.image_url} alt={box.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-10 w-10 text-gray-400" />
          )}
        </div>

        {/* Info */}
        <h3 className="font-bold text-gray-900 text-lg mb-2">
          {box.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {box.description}
        </p>

        {/* Requirements */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">
            Niveau {box.required_level || 1} requis
          </span>
        </div>

        {/* Rarity Badge */}
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityColor(box.rarity)} mb-4`}>
          {box.rarity?.toUpperCase() || 'COMMON'}
        </div>

        {/* Max Value */}
        <div className="flex items-center justify-center gap-1 text-yellow-600 mb-4">
          <Coins className="h-4 w-4" />
          <span className="text-sm font-medium">Jusqu'à {box.max_value} coins</span>
        </div>

        {/* Action Button */}
        {isClaimed ? (
          <div className="bg-green-100 text-green-700 py-2 px-4 rounded-lg text-sm font-medium">
            ✓ Réclamée aujourd'hui
          </div>
        ) : !isUnlocked ? (
          <div className="bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium">
            🔒 Niveau {box.required_level || 1} requis
          </div>
        ) : (
          <button className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-semibold text-sm">
            🎁 Réclamer
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Modal d'animation d'ouverture
function OpeningModal({ isOpen, box, getRarityColor }) {
  if (!isOpen || !box) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="text-center"
        >
          {/* Box Animation */}
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`w-32 h-32 mx-auto mb-8 rounded-2xl bg-gradient-to-br ${getRarityColor(box.rarity)} flex items-center justify-center shadow-2xl`}
          >
            <Package className="h-16 w-16 text-white" />
          </motion.div>

          {/* Loading Text */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white"
          >
            <h3 className="text-2xl font-bold mb-2">Ouverture en cours...</h3>
            <p className="text-gray-300">🎲 Calcul des probabilités</p>
          </motion.div>

          {/* Sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0,
                  x: "50%",
                  y: "50%",
                  scale: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  delay: Math.random() * 2,
                  repeat: Infinity
                }}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Modal de résultat
function ResultModal({ isOpen, onClose, item, getRarityColor, getRarityBg }) {
  if (!isOpen || !item) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-4 ${getRarityBg(item.rarity)}`}
        >
          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0,
                  y: -20,
                  x: `${Math.random() * 100}%`,
                  rotate: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  y: "120%",
                  rotate: 360
                }}
                transition={{ 
                  duration: 3,
                  delay: Math.random() * 0.5
                }}
                className={`absolute w-3 h-3 ${
                  Math.random() > 0.5 ? 'bg-yellow-400' : 'bg-green-400'
                } rounded-full`}
              />
            ))}
          </div>

          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative z-10 mb-6"
          >
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Félicitations ! 🎉
            </h2>
            <p className="text-gray-600">Vous avez obtenu :</p>
          </motion.div>

          {/* Item Display */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative z-10 mb-6"
          >
            {/* Item Image */}
            <div className="w-24 h-24 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-12 w-12 text-gray-400" />
              )}
            </div>

            {/* Rarity Badge */}
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getRarityColor(item.rarity)} mb-3`}>
              {item.rarity?.toUpperCase() || 'COMMON'}
            </div>

            {/* Item Name */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {item.name}
            </h3>

            {/* Value & XP */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm font-medium">Valeur</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {item.market_value}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">XP</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  +{item.xpGained}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative z-10 space-y-3"
          >
            <button
              onClick={onClose}
              className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-semibold"
            >
              Continuer
            </button>
            
            <div className="flex gap-3">
              <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                📦 Voir inventaire
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                📤 Partager
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}