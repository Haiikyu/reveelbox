'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gift, 
  Star,
  Clock,
  Zap,
  Crown,
  Award,
  Calendar,
  TrendingUp,
  Coins,
  Trophy,
  Target,
  Flame,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users,
  Eye,
  Download,
  Play
} from 'lucide-react'

export default function FreeDropPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [playerLevel, setPlayerLevel] = useState(1)
  const [playerExp, setPlayerExp] = useState(0)
  const [expToNext, setExpToNext] = useState(1000)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [lastClaimDate, setLastClaimDate] = useState(null)
  const [canClaim, setCanClaim] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [openingAnimation, setOpeningAnimation] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 5000)
  }

  // XP thresholds for each level
  const getExpForLevel = (level) => {
    return level * 1000 + (level - 1) * 500 // Level 1: 1000, Level 2: 2500, Level 3: 4500, etc.
  }

  // Calculate level from total XP
  const calculateLevelFromExp = (totalExp) => {
    let level = 1
    let currentExp = totalExp
    
    while (currentExp >= getExpForLevel(level)) {
      currentExp -= getExpForLevel(level)
      level++
    }
    
    return {
      level: level,
      currentExp: currentExp,
      expToNext: getExpForLevel(level) - currentExp
    }
  }

  // Free drop rewards by level
  const freeDropRewards = [
    { 
      level: 1, 
      name: 'Starter Pack', 
      description: 'Pack de démarrage pour nouveaux joueurs',
      coins: 50,
      items: ['Accessoire basique'],
      rarity: 'common',
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300'
    },
    { 
      level: 10, 
      name: 'Bronze Reward', 
      description: 'Première récompense de progression',
      coins: 100,
      items: ['Skin Bronze', '2x Boost XP'],
      rarity: 'uncommon',
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300'
    },
    { 
      level: 20, 
      name: 'Silver Treasure', 
      description: 'Trésor argenté pour les joueurs réguliers',
      coins: 200,
      items: ['Skin Argent', 'Boîte mystère', '5x Boost XP'],
      rarity: 'rare',
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-400'
    },
    { 
      level: 30, 
      name: 'Gold Package', 
      description: 'Package doré pour les vétérans',
      coins: 350,
      items: ['Skin Doré', '2x Boîte mystère', 'Badge exclusif'],
      rarity: 'epic',
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300'
    },
    { 
      level: 40, 
      name: 'Platinum Elite', 
      description: 'Récompense d\'élite platine',
      coins: 500,
      items: ['Skin Platine', '3x Boîte mystère', 'Titre "Elite"'],
      rarity: 'epic',
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-300'
    },
    { 
      level: 50, 
      name: 'Diamond Prestige', 
      description: 'Prestige diamant pour les maîtres',
      coins: 750,
      items: ['Skin Diamant', '5x Boîte mystère', 'Emote exclusif'],
      rarity: 'legendary',
      color: 'from-cyan-400 to-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-300'
    },
    { 
      level: 60, 
      name: 'Mythic Champion', 
      description: 'Récompense ultime des champions',
      coins: 1000,
      items: ['Skin Mythique', '10x Boîte mystère', 'Couronne de Champion'],
      rarity: 'mythic',
      color: 'from-purple-400 to-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      borderColor: 'border-purple-400'
    }
  ]

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }
        
        setUser(user)
        
        // Load profile with XP and level data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, total_exp, last_freedrop_claim')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setProfile(profile)
          
          // Calculate level from total XP (default to 0 if null)
          const totalExp = profile.total_exp || 0
          const levelData = calculateLevelFromExp(totalExp)
          
          setPlayerLevel(levelData.level)
          setPlayerExp(levelData.currentExp)
          setExpToNext(levelData.expToNext)
          
          // Check if can claim (once per day)
          const lastClaim = profile.last_freedrop_claim
          const today = new Date().toDateString()
          const lastClaimDate = lastClaim ? new Date(lastClaim).toDateString() : null
          
          setLastClaimDate(lastClaimDate)
          setCanClaim(lastClaimDate !== today)
        }
        
      } catch (error) {
        console.error('Error loading free drop page:', error)
        showNotification('error', 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [supabase, router])

  const getAvailableReward = () => {
    // Find the highest level reward the player can claim
    const availableRewards = freeDropRewards.filter(reward => playerLevel >= reward.level)
    return availableRewards[availableRewards.length - 1] || freeDropRewards[0]
  }

  const claimFreeReward = async () => {
    if (!canClaim) {
      showNotification('error', 'Vous avez déjà réclamé votre récompense aujourd\'hui')
      return
    }

    setClaiming(true)
    setOpeningAnimation(true)

    try {
      const reward = getAvailableReward()
      setSelectedReward(reward)

      // Simulate opening animation
      setTimeout(async () => {
        // Update profile with coins and last claim date
        const { error } = await supabase
          .from('profiles')
          .update({
            virtual_currency: (profile.virtual_currency || 0) + reward.coins,
            last_freedrop_claim: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) throw error

        // Update local state
        setProfile(prev => ({
          ...prev,
          virtual_currency: (prev.virtual_currency || 0) + reward.coins
        }))
        
        setCanClaim(false)
        setLastClaimDate(new Date().toDateString())
        setOpeningAnimation(false)
        
        showNotification('success', `Vous avez reçu ${reward.coins} coins !`)
      }, 3000)

    } catch (error) {
      console.error('Error claiming reward:', error)
      showNotification('error', 'Erreur lors de la réclamation')
      setOpeningAnimation(false)
    } finally {
      setClaiming(false)
    }
  }

  const getTimeUntilNextClaim = () => {
    if (canClaim) return 'Disponible maintenant !'
    
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  const getLevelProgress = () => {
    const totalExpForCurrentLevel = getExpForLevel(playerLevel)
    const progress = (playerExp / totalExpForCurrentLevel) * 100
    return Math.min(progress, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion requise</h2>
          <p className="text-gray-600 mb-6">Connectez-vous pour accéder aux récompenses gratuites</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  const currentReward = getAvailableReward()

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Notification */}
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

      {/* Opening Animation Overlay */}
      <AnimatePresence>
        {openingAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${currentReward?.color} mx-auto mb-6 flex items-center justify-center`}
              >
                <Gift className="h-16 w-16 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Ouverture en cours...</h2>
              <p className="text-gray-300">Votre récompense gratuite vous attend !</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Gift className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Free Drop Quotidien
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Réclamez votre récompense gratuite chaque jour ! Plus votre niveau est élevé, meilleures sont les récompenses.
            </p>

            {/* Level & XP Display */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Niveau {playerLevel}</h3>
                    <p className="text-gray-600 text-sm">{playerExp} / {getExpForLevel(playerLevel)} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{expToNext}</p>
                  <p className="text-gray-600 text-sm">XP au niveau suivant</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getLevelProgress()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                />
              </div>
              <p className="text-center text-gray-600 text-sm">
                Progression du niveau ({getLevelProgress().toFixed(1)}%)
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Current Reward */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Votre récompense d'aujourd'hui
            </h2>
            <p className="text-gray-600">
              {canClaim ? 'Prête à être réclamée !' : `Prochaine récompense dans ${getTimeUntilNextClaim()}`}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`relative ${currentReward.bgColor} rounded-3xl p-8 border-2 ${currentReward.borderColor} shadow-xl overflow-hidden`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full" />
            </div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`inline-flex w-24 h-24 bg-gradient-to-br ${currentReward.color} rounded-2xl items-center justify-center mb-4 shadow-lg`}
                >
                  <Gift className="h-12 w-12 text-white" />
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentReward.name}</h3>
                <p className="text-gray-600 mb-4">{currentReward.description}</p>
                
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Coins className="h-6 w-6 text-yellow-500" />
                    <span className="text-xl font-bold text-gray-900">{currentReward.coins} coins</span>
                  </div>
                  <div className="h-6 w-px bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6 text-purple-500" />
                    <span className="text-lg font-semibold text-gray-700">{currentReward.items.length} items</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3">Récompenses incluses :</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {currentReward.items.map((item, index) => (
                      <span
                        key={index}
                        className="bg-white/80 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Claim Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: canClaim ? 1.05 : 1 }}
                  whileTap={{ scale: canClaim ? 0.95 : 1 }}
                  onClick={claimFreeReward}
                  disabled={!canClaim || claiming}
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    canClaim && !claiming
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {claiming ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Réclamation en cours...
                    </>
                  ) : canClaim ? (
                    <>
                      <Download className="h-6 w-6" />
                      Réclamer maintenant !
                    </>
                  ) : (
                    <>
                      <Clock className="h-6 w-6" />
                      Déjà réclamé aujourd'hui
                    </>
                  )}
                </motion.button>

                {!canClaim && (
                  <p className="mt-4 text-gray-600 text-sm">
                    Revenez demain pour votre prochaine récompense gratuite !
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rewards Progression */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Progression des récompenses
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Montez en niveau pour débloquer des récompenses encore plus généreuses ! 
              Gagnez de l'XP en ouvrant des boîtes (1 coin dépensé = 1 XP gagné).
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {freeDropRewards.map((reward, index) => {
              const isUnlocked = playerLevel >= reward.level
              const isCurrent = reward.level === currentReward.level
              
              return (
                <motion.div
                  key={reward.level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                    isCurrent
                      ? `${reward.borderColor} ${reward.bgColor} ring-4 ring-green-200`
                      : isUnlocked
                      ? `${reward.borderColor} ${reward.bgColor} hover:shadow-lg`
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Current Badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ACTUEL
                    </div>
                  )}

                  <div className="text-center">
                    <div className={`inline-flex w-16 h-16 rounded-xl items-center justify-center mb-4 ${
                      isUnlocked 
                        ? `bg-gradient-to-br ${reward.color}` 
                        : 'bg-gray-300'
                    }`}>
                      {isUnlocked ? (
                        <Gift className="h-8 w-8 text-white" />
                      ) : (
                        <Lock className="h-8 w-8 text-gray-500" />
                      )}
                    </div>
                    
                    <h3 className={`font-bold mb-2 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      Niveau {reward.level}
                    </h3>
                    <h4 className={`text-sm font-medium mb-2 ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                      {reward.name}
                    </h4>
                    
                    <div className={`flex items-center justify-center gap-1 mb-3 ${isUnlocked ? 'text-yellow-600' : 'text-gray-400'}`}>
                      <Coins className="h-4 w-4" />
                      <span className="font-semibold">{reward.coins}</span>
                    </div>
                    
                    <div className="space-y-1">
                      {reward.items.slice(0, 2).map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`text-xs px-2 py-1 rounded-full ${
                            isUnlocked 
                              ? 'bg-white/80 text-gray-700' 
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                      {reward.items.length > 2 && (
                        <div className={`text-xs ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                          +{reward.items.length - 2} autres...
                        </div>
                      )}
                    </div>

                    {!isUnlocked && (
                      <div className="mt-4 text-xs text-gray-500">
                        <Lock className="h-3 w-3 inline mr-1" />
                        Niveau {reward.level} requis
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to Level Up */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Comment gagner de l'XP ?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Ouvrez des boîtes</h3>
                <p className="text-gray-600 text-sm">
                  Chaque coin dépensé vous rapporte 1 XP
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Participez aux battles</h3>
                <p className="text-gray-600 text-sm">
                  Les battles rapportent de l'XP bonus
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Connexion quotidienne</h3>
                <p className="text-gray-600 text-sm">
                  Bonus XP pour les connexions régulières
                </p>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Calcul de l'XP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Dépense en coins</span>
                  </div>
                  <p className="text-green-700 text-sm">1 coin dépensé = 1 XP gagné</p>
                  <p className="text-green-600 text-xs mt-1">Exemple : 150 coins → 150 XP</p>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Bonus activités</span>
                  </div>
                  <p className="text-blue-700 text-sm">Battles, défis, événements</p>
                  <p className="text-blue-600 text-xs mt-1">Bonus multiplicateurs selon l'activité</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vos statistiques Free Drop
            </h2>
            <p className="text-gray-600">
              Suivez votre progression et vos récompenses
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 text-center">
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-green-700 mb-1">7</div>
              <div className="text-green-600 text-sm">Jours consécutifs</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 text-center">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-blue-700 mb-1">23</div>
              <div className="text-blue-600 text-sm">Récompenses réclamées</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6 text-center">
              <div className="h-12 w-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-yellow-700 mb-1">2,150</div>
              <div className="text-yellow-600 text-sm">Coins obtenus gratuitement</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 text-center">
              <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-purple-700 mb-1">{playerLevel}</div>
              <div className="text-purple-600 text-sm">Niveau actuel</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-green-500 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à monter de niveau ?
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Ouvrez des boîtes, participez aux battles et réclamez vos récompenses quotidiennes pour progresser !
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/boxes')}
                className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
              >
                <Gift className="h-5 w-5" />
                Ouvrir des boîtes
                <ArrowRight className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/battle')}
                className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-600 transition-all duration-200 inline-flex items-center gap-2"
              >
                <Target className="h-5 w-5" />
                Rejoindre une battle
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">À quelle heure se renouvellent les récompenses ?</h3>
              <p className="text-gray-600">Les récompenses quotidiennes se renouvellent chaque jour à minuit (UTC+1).</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Que se passe-t-il si je rate une journée ?</h3>
              <p className="text-gray-600">Rien de grave ! Vous pouvez reprendre le lendemain. Il n'y a pas de pénalité pour les jours manqués.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Comment calculer mon XP total ?</h3>
              <p className="text-gray-600">Votre XP total correspond au montant total de coins que vous avez dépensé sur la plateforme (1 coin = 1 XP).</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Y a-t-il une limite de niveau ?</h3>
              <p className="text-gray-600">Actuellement, le niveau maximum avec des récompenses spéciales est 60. De nouveaux paliers seront ajoutés régulièrement !</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}