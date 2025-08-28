'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'
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
  AlertCircle,
  Sun,
  Moon,
  Search,
  Filter,
  BarChart3,
  Gem,
  Trophy,
  ChevronDown,
  Users,
  Newspaper
} from 'lucide-react'

// Types TypeScript
interface DailyBox {
  id: string
  name: string
  description: string
  required_level?: number
  image_url?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  max_value: number
  loot_box_items: Array<{
    probability: number
    items: {
      id: string
      name: string
      description?: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      image_url?: string
      market_value: number
      category?: string
    }
  }>
}

interface OpenedItem {
  id: string
  name: string
  description?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image_url?: string
  market_value: number
  xpGained: number
}

interface NotificationState {
  type: 'success' | 'error' | 'info' | ''
  message: string
}

interface UserStats {
  totalClaimed: number
  bestStreak: number
  currentStreak: number
  totalValue: number
  rareItems: number
}

// Variantes d'animation
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.08
    }
  }
}

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    rotateY: -5 
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export default function FreedropPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [dailyBoxes, setDailyBoxes] = useState<DailyBox[]>([])
  const [claimedToday, setClaimedToday] = useState<string[]>([])
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [selectedBox, setSelectedBox] = useState<DailyBox | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [openedItem, setOpenedItem] = useState<OpenedItem | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [streak, setStreak] = useState(0)
  const [notification, setNotification] = useState<NotificationState>({ type: '', message: '' })
  const [userStats, setUserStats] = useState<UserStats>({
    totalClaimed: 0,
    bestStreak: 0,
    currentStreak: 0,
    totalValue: 0,
    rareItems: 0
  })
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRarity, setSelectedRarity] = useState('all')
  const [showStats, setShowStats] = useState(false)

  // Mode sombre
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Fonction notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
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
      
      // Timer
      const timer = setInterval(updateTimeUntilReset, 1000)
      return () => clearInterval(timer)
    }
  }, [authLoading, isAuthenticated, user])

  const loadFreedropData = async () => {
    try {
      setLoading(true)
      
      await Promise.all([
        loadDailyBoxes(),
        checkTodayClaims(),
        loadStreak(),
        loadUserStats()
      ])
      
    } catch (error) {
      console.error('Error loading freedrop data:', error)
      showNotification('error', 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const loadDailyBoxes = async () => {
    const supabase = createClient()
    
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
      .eq('is_daily_free', true)
      .order('required_level', { ascending: true })

    if (error) {
      console.error('Error loading daily boxes:', error)
      const testBoxes = generateTestDailyBoxes()
      setDailyBoxes(testBoxes)
      showNotification('info', 'Mode démo - Données de test affichées')
      return
    }

    if (data && data.length > 0) {
      setDailyBoxes(data)
    } else {
      const testBoxes = generateTestDailyBoxes()
      setDailyBoxes(testBoxes)
      showNotification('info', 'Mode démo activé')
    }
  }

  const generateTestDailyBoxes = (): DailyBox[] => {
    return [
      {
        id: 'daily-1',
        name: 'Caisse Novice',
        description: 'Votre première aventure quotidienne',
        required_level: 1,
        image_url: 'https://via.placeholder.com/300x300/10b981/FFFFFF?text=NOVICE',
        rarity: 'common',
        max_value: 75,
        loot_box_items: [
          {
            probability: 65,
            items: { 
              id: '1', 
              name: 'Porte-clés Starter', 
              rarity: 'common', 
              market_value: 15, 
              image_url: 'https://via.placeholder.com/200x200/10b981/FFFFFF?text=Basic' 
            }
          },
          {
            probability: 30,
            items: { 
              id: '2', 
              name: 'Badge Apprenti', 
              rarity: 'rare', 
              market_value: 35, 
              image_url: 'https://via.placeholder.com/200x200/3b82f6/FFFFFF?text=Apprenti' 
            }
          },
          {
            probability: 5,
            items: { 
              id: '3', 
              name: 'Médaille Bronze', 
              rarity: 'epic', 
              market_value: 65, 
              image_url: 'https://via.placeholder.com/200x200/8b5cf6/FFFFFF?text=Bronze' 
            }
          }
        ]
      },
      {
        id: 'daily-2',
        name: 'Caisse Explorateur',
        description: 'Pour les aventuriers confirmés',
        required_level: 5,
        image_url: 'https://via.placeholder.com/300x300/3b82f6/FFFFFF?text=EXPLORER',
        rarity: 'rare',
        max_value: 150,
        loot_box_items: [
          {
            probability: 55,
            items: { 
              id: '4', 
              name: 'Gadget Tech', 
              rarity: 'rare', 
              market_value: 45, 
              image_url: 'https://via.placeholder.com/200x200/3b82f6/FFFFFF?text=Tech' 
            }
          },
          {
            probability: 35,
            items: { 
              id: '5', 
              name: 'Objet Vintage', 
              rarity: 'epic', 
              market_value: 95, 
              image_url: 'https://via.placeholder.com/200x200/8b5cf6/FFFFFF?text=Vintage' 
            }
          },
          {
            probability: 10,
            items: { 
              id: '6', 
              name: 'Gemme Rare', 
              rarity: 'legendary', 
              market_value: 140, 
              image_url: 'https://via.placeholder.com/200x200/f59e0b/FFFFFF?text=Gemme' 
            }
          }
        ]
      },
      {
        id: 'daily-3',
        name: 'Caisse Expert',
        description: 'Réservée aux maîtres expérimentés',
        required_level: 10,
        image_url: 'https://via.placeholder.com/300x300/8b5cf6/FFFFFF?text=EXPERT',
        rarity: 'epic',
        max_value: 250,
        loot_box_items: [
          {
            probability: 45,
            items: { 
              id: '7', 
              name: 'Artefact Premium', 
              rarity: 'epic', 
              market_value: 120, 
              image_url: 'https://via.placeholder.com/200x200/8b5cf6/FFFFFF?text=Premium' 
            }
          },
          {
            probability: 40,
            items: { 
              id: '8', 
              name: 'Cristal Énergétique', 
              rarity: 'legendary', 
              market_value: 200, 
              image_url: 'https://via.placeholder.com/200x200/f59e0b/FFFFFF?text=Cristal' 
            }
          },
          {
            probability: 15,
            items: { 
              id: '9', 
              name: 'Relique Ancienne', 
              rarity: 'legendary', 
              market_value: 240, 
              image_url: 'https://via.placeholder.com/200x200/f59e0b/FFFFFF?text=Relique' 
            }
          }
        ]
      },
      {
        id: 'daily-4',
        name: 'Caisse Légendaire',
        description: 'Le summum de l\'excellence quotidienne',
        required_level: 20,
        image_url: 'https://via.placeholder.com/300x300/f59e0b/FFFFFF?text=LEGEND',
        rarity: 'legendary',
        max_value: 500,
        loot_box_items: [
          {
            probability: 30,
            items: { 
              id: '10', 
              name: 'Trésor Mythique', 
              rarity: 'legendary', 
              market_value: 350, 
              image_url: 'https://via.placeholder.com/200x200/f59e0b/FFFFFF?text=Mythique' 
            }
          },
          {
            probability: 40,
            items: { 
              id: '11', 
              name: 'Artefact Divin', 
              rarity: 'legendary', 
              market_value: 420, 
              image_url: 'https://via.placeholder.com/200x200/f59e0b/FFFFFF?text=Divin' 
            }
          },
          {
            probability: 30,
            items: { 
              id: '12', 
              name: 'Essence Cosmique', 
              rarity: 'legendary', 
              market_value: 480, 
              image_url: 'https://via.placeholder.com/200x200/f59e0b/FFFFFF?text=Cosmos' 
            }
          }
        ]
      }
    ]
  }

  const checkTodayClaims = async () => {
    if (!user?.id) return
    
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    
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
    if (!user?.id) return
    
    const supabase = createClient()
    
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

  const loadUserStats = async () => {
    if (!user?.id) return
    
    const supabase = createClient()
    
    // Charger les stats utilisateur
    const { data, error } = await supabase
      .from('daily_claims')
      .select(`
        *,
        items (market_value, rarity)
      `)
      .eq('user_id', user.id)

    if (!error && data) {
      const totalClaimed = data.length
      const totalValue = data.reduce((sum, claim) => sum + (claim.items?.market_value || 0), 0)
      const rareItems = data.filter(claim => 
        ['epic', 'legendary'].includes(claim.items?.rarity || '')
      ).length

      setUserStats(prev => ({
        ...prev,
        totalClaimed,
        totalValue,
        rareItems,
        currentStreak: streak
      }))
    }
  }

  const calculateStreak = (claims: Array<{ claimed_at: string }>) => {
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
      } else if (i > 0) {
        break
      }
    }
    
    return streak
  }

  const calculateUserLevel = (exp: number) => {
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

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#10b981',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityGradient = (rarity: string) => {
    const gradients = {
      common: 'from-green-400 to-green-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600'
    }
    return gradients[rarity as keyof typeof gradients] || gradients.common
  }

  const claimDailyBox = async (box: DailyBox) => {
    if (isOpening || !user?.id) return
    
    try {
      setIsOpening(true)
      setSelectedBox(box)
      
      // Animation d'ouverture
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const obtainedItem = calculateRandomItem(box.loot_box_items)
      const supabase = createClient()

      // Enregistrer en base
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

      // XP
      const xpGained = Math.floor(obtainedItem.market_value / 8) + 10
      const { error: xpError } = await supabase
        .from('profiles')
        .update({ 
          total_exp: (profile?.total_exp || 0) + xpGained 
        })
        .eq('id', user.id)

      if (xpError) {
        console.error('Error updating XP:', xpError)
      }

      // Transaction
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

      const openedItemWithXP: OpenedItem = { ...obtainedItem, xpGained }
      setOpenedItem(openedItemWithXP)
      setShowResult(true)
      
      setClaimedToday(prev => [...prev, box.id])
      showNotification('success', `Vous avez obtenu ${obtainedItem.name} !`)
      
    } catch (error) {
      console.error('Error claiming daily box:', error)
      showNotification('error', 'Erreur lors de la réclamation')
    } finally {
      setIsOpening(false)
    }
  }

  const calculateRandomItem = (lootBoxItems: DailyBox['loot_box_items']) => {
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const lootItem of lootBoxItems) {
      cumulative += lootItem.probability
      if (random <= cumulative) {
        return lootItem.items
      }
    }
    
    return lootBoxItems[0]?.items
  }

  const userLevel = calculateUserLevel(profile?.total_exp || 0)

  // Filtres
  const rarityFilters = [
    { value: 'all', label: 'Toutes', count: dailyBoxes.length },
    { value: 'legendary', label: 'Légendaires', count: dailyBoxes.filter(b => b.rarity === 'legendary').length },
    { value: 'epic', label: 'Épiques', count: dailyBoxes.filter(b => b.rarity === 'epic').length },
    { value: 'rare', label: 'Rares', count: dailyBoxes.filter(b => b.rarity === 'rare').length },
    { value: 'common', label: 'Communes', count: dailyBoxes.filter(b => b.rarity === 'common').length }
  ]

  const filteredBoxes = dailyBoxes.filter(box => {
    const matchesSearch = box.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRarity = selectedRarity === 'all' || box.rarity === selectedRarity
    return matchesSearch && matchesRarity
  })

  if (authLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Chargement des caisses quotidiennes...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      
      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm ${
              notification.type === 'error' 
                ? 'bg-red-50/90 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' 
                : notification.type === 'info'
                ? 'bg-blue-50/90 dark:bg-blue-900/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                : 'bg-green-50/90 dark:bg-green-900/90 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="h-6 w-6" />
            ) : notification.type === 'info' ? (
              <Info className="h-6 w-6" />
            ) : (
              <CheckCircle className="h-6 w-6" />
            )}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header moderne */}
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Navigation & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-3 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-300"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Stats</span>
              </button>
              
              <button
                onClick={toggleDarkMode}
                className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-600" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Titre principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-6xl font-black text-gray-900 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              Freedrop
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
              Vos récompenses quotidiennes gratuites • Niveau {userLevel}
            </p>
          </motion.div>

          {/* Statistiques principales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <StatCard
              icon={Timer}
              title="Prochaine reset"
              value={timeUntilReset}
              subtitle="Nouvelles caisses"
              color="blue"
            />
            
            <StatCard
              icon={Flame}
              title="Série actuelle"
              value={`${streak} jours`}
              subtitle={streak > 0 ? 'Continue ta série !' : 'Commence aujourd\'hui'}
              color="orange"
            />
            
            <StatCard
              icon={Star}
              title={`Niveau ${userLevel}`}
              value={`${((profile?.total_exp || 0) % 100)}%`}
              subtitle={`${profile?.total_exp || 0} / ${userLevel * 100} XP`}
              color="purple"
              isProgress
            />
            
            <StatCard
              icon={Trophy}
              title="Caisses réclamées"
              value={`${claimedToday.length}/${dailyBoxes.length}`}
              subtitle="Aujourd'hui"
              color="green"
            />
          </motion.div>

          {/* Stats détaillées (extensible) */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    Statistiques détaillées
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.totalClaimed}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total réclamé</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{userStats.totalValue}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{userStats.rareItems}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Objets rares+</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{userStats.bestStreak}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Meilleure série</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barre de recherche et filtres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
              
              {/* Recherche */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher une caisse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-lg transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Filtres de rareté */}
              <div className="flex gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                {rarityFilters.map((filter) => (
                  <motion.button
                    key={filter.value}
                    onClick={() => setSelectedRarity(filter.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      selectedRarity === filter.value
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {filter.label} {filter.count > 0 && `(${filter.count})`}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Guide d'utilisation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 mb-8 backdrop-blur-sm"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2 text-lg">Guide Freedrop</h3>
                <div className="grid md:grid-cols-2 gap-4 text-blue-800 dark:text-blue-200">
                  <div>
                    <p className="mb-2">• Une caisse gratuite par jour selon votre niveau</p>
                    <p className="mb-2">• Plus votre niveau est élevé, plus les récompenses sont précieuses</p>
                  </div>
                  <div>
                    <p className="mb-2">• Maintenez votre série quotidienne pour des bonus</p>
                    <p>• Les caisses se réinitialisent chaque jour à minuit</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grid des caisses quotidiennes */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        
        {filteredBoxes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">🎁</div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Aucune caisse trouvée</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">Modifiez vos critères de recherche</p>
            <button 
              onClick={() => { 
                setSearchQuery(''); 
                setSelectedRarity('all'); 
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-200"
            >
              Voir toutes les caisses
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filteredBoxes.map((box, index) => {
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
                  userLevel={userLevel}
                  onClaim={() => claimDailyBox(box)}
                  getRarityColor={getRarityColor}
                  getRarityGradient={getRarityGradient}
                />
              )
            })}
          </motion.div>
        )}

        {/* Système de récompenses de série */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50 dark:border-gray-700/50"
        >
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            Récompenses de Série
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { days: 3, reward: '+15% XP', bonus: 'Boost d\'expérience', color: 'blue', icon: Zap },
              { days: 7, reward: 'Caisse Bonus', bonus: 'Caisse supplémentaire', color: 'green', icon: Gift },
              { days: 14, reward: '+30% XP', bonus: 'Super boost XP', color: 'purple', icon: Star },
              { days: 30, reward: 'Caisse Mythique', bonus: 'Récompense légendaire', color: 'yellow', icon: Crown }
            ].map((reward, index) => (
              <StreakRewardCard
                key={index}
                reward={reward}
                currentStreak={streak}
                index={index}
              />
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Série actuelle: <span className="font-bold text-2xl text-orange-600">{streak} jours</span>
            </p>
            <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Section communautaire */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-12 grid md:grid-cols-2 gap-8"
        >
          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-green-200/50 dark:border-green-800/50">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-7 w-7 text-green-600" />
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">Communauté Active</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Joueurs connectés</span>
                <span className="font-bold text-green-600">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Caisses ouvertes aujourd'hui</span>
                <span className="font-bold text-blue-600">8,932</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Objets légendaires trouvés</span>
                <span className="font-bold text-yellow-600">156</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="h-7 w-7 text-purple-600" />
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">Dernières Nouveautés</h4>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Nouveau: Caisses Saisonnières</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Il y a 2 heures</p>
              </div>
              <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Event: Double XP Weekend</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Il y a 1 jour</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <OpeningModal
        isOpen={isOpening}
        box={selectedBox}
        getRarityColor={getRarityColor}
        getRarityGradient={getRarityGradient}
      />

      <ResultModal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        item={openedItem}
        getRarityColor={getRarityColor}
        getRarityGradient={getRarityGradient}
      />
    </div>
  )
}

// Composants auxiliaires

interface StatCardProps {
  icon: React.ComponentType<any>
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'orange' | 'purple' | 'green'
  isProgress?: boolean
}

function StatCard({ icon: Icon, title, value, subtitle, color, isProgress }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    orange: 'from-orange-500 to-orange-600 text-orange-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    green: 'from-green-500 to-green-600 text-green-600'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]} bg-opacity-10`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].split(' ')[2]}`} />
        </div>
      </div>
      
      <div className={`text-sm font-semibold ${colorClasses[color].split(' ')[2]} mb-2`}>
        {title}
      </div>
      
      {isProgress ? (
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div 
              className={`h-2 rounded-full bg-gradient-to-r ${colorClasses[color].substring(0, colorClasses[color].lastIndexOf(' '))}`}
              initial={{ width: 0 }}
              animate={{ width: value }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      ) : (
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
          {value}
        </div>
      )}
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {subtitle}
      </div>
    </motion.div>
  )
}

interface DailyBoxCardProps {
  box: DailyBox
  index: number
  isUnlocked: boolean
  isClaimed: boolean
  canClaim: boolean
  userLevel: number
  onClaim: () => void
  getRarityColor: (rarity: string) => string
  getRarityGradient: (rarity: string) => string
}

function DailyBoxCard({ 
  box, 
  index, 
  isUnlocked, 
  isClaimed, 
  canClaim, 
  userLevel,
  onClaim, 
  getRarityColor,
  getRarityGradient
}: DailyBoxCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const glowColor = getRarityColor(box.rarity)

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ 
        y: canClaim ? -8 : -4,
        rotateY: canClaim ? 5 : 2,
        scale: canClaim ? 1.02 : 1.01
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer relative"
      style={{ perspective: '1000px' }}
      onClick={canClaim ? onClaim : undefined}
    >
      <motion.div className="relative">
        
        {/* Status Badge */}
        <div className="absolute -top-2 -right-2 z-20">
          {isClaimed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-500 text-white rounded-full p-2 shadow-lg"
            >
              <CheckCircle className="h-5 w-5" />
            </motion.div>
          ) : !isUnlocked ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gray-400 text-white rounded-full p-2 shadow-lg"
            >
              <Lock className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-yellow-500 text-white rounded-full p-2 shadow-lg animate-pulse"
            >
              <Gift className="h-5 w-5" />
            </motion.div>
          )}
        </div>

        {/* Badges spéciaux */}
        <div className="absolute -top-2 -left-2 z-20 flex flex-col gap-1">
          {box.required_level && box.required_level > 15 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
            >
              VIP
            </motion.div>
          )}
        </div>

        {/* Ombre dynamique */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/10 dark:bg-black/30 rounded-full blur-lg"
          animate={{
            scale: isHovered && canClaim ? 1.5 : 1,
            opacity: isHovered && canClaim ? 0.4 : 0.2
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Glow effect pour les caisses disponibles */}
        {canClaim && (
          <motion.div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${getRarityGradient(box.rarity)} opacity-20`}
            animate={{
              opacity: isHovered ? 0.3 : 0.15,
              scale: isHovered ? 1.02 : 1
            }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Contenu principal */}
        <motion.div
          className={`relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 shadow-lg hover:shadow-xl ${
            canClaim 
              ? `border-[${glowColor}]/50 hover:border-[${glowColor}]`
              : isUnlocked
              ? 'border-gray-200 dark:border-gray-700'
              : 'border-gray-300 dark:border-gray-600 opacity-60'
          }`}
          animate={{
            y: isHovered && canClaim ? -4 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          
          {/* Image de la caisse */}
          <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
            {box.image_url ? (
              <motion.img 
                src={box.image_url} 
                alt={box.name} 
                className="w-full h-full object-cover"
                animate={{
                  filter: isHovered && canClaim 
                    ? `drop-shadow(0 10px 20px ${glowColor}40) brightness(1.1)`
                    : 'brightness(1)'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIke glowColor}"/+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJvw65lPC90ZXh0Pgo8L3N2Zz4K`
                }}
              />
            ) : (
              <Package className="h-12 w-12 text-gray-400" />
            )}
          </div>

          {/* Informations */}
          <div className="text-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 truncate">
              {box.name}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {box.description}
            </p>

            {/* Niveau requis */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Niveau {box.required_level || 1}
              </span>
            </div>

            {/* Badge de rareté */}
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityGradient(box.rarity)} mb-3`}>
              {box.rarity?.toUpperCase() || 'COMMON'}
            </div>

            {/* Valeur maximale */}
            <div className="flex items-center justify-center gap-1 text-yellow-600 mb-4">
              <Gem className="h-4 w-4" />
              <span className="text-sm font-medium">Jusqu'à {box.max_value} coins</span>
            </div>

            {/* Status et action */}
            {isClaimed ? (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Réclamée aujourd'hui
              </div>
            ) : !isUnlocked ? (
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Niveau {box.required_level || 1} requis
              </div>
            ) : (
              <motion.div
                animate={{
                  scale: isHovered ? 1.05 : 1,
                  boxShadow: isHovered ? `0 8px 25px ${glowColor}40` : '0 0 0 transparent'
                }}
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all duration-200"
              >
                <Gift className="h-4 w-4" />
                Réclamer maintenant
              </motion.div>
            )}
          </div>

          {/* Indicateur de rareté */}
          <motion.div
            className="absolute top-3 left-3 w-3 h-3 rounded-full"
            style={{ backgroundColor: glowColor }}
            animate={{
              scale: isHovered && canClaim ? [1, 1.2, 1] : 1,
              opacity: isHovered && canClaim ? [0.8, 1, 0.8] : 0.8
            }}
            transition={{ 
              duration: isHovered ? 1.5 : 0.3,
              repeat: isHovered && canClaim ? Infinity : 0 
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

interface StreakRewardCardProps {
  reward: {
    days: number
    reward: string
    bonus: string
    color: string
    icon: React.ComponentType<any>
  }
  currentStreak: number
  index: number
}

function StreakRewardCard({ reward, currentStreak, index }: StreakRewardCardProps) {
  const isUnlocked = currentStreak >= reward.days
  const Icon = reward.icon

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 bg-blue-50 border-blue-200 text-blue-600',
    green: 'from-green-500 to-green-600 bg-green-50 border-green-200 text-green-600',
    purple: 'from-purple-500 to-purple-600 bg-purple-50 border-purple-200 text-purple-600',
    yellow: 'from-yellow-500 to-yellow-600 bg-yellow-50 border-yellow-200 text-yellow-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      className={`relative p-6 rounded-xl border-2 text-center transition-all duration-300 ${
        isUnlocked
          ? `${colorClasses[reward.color as keyof typeof colorClasses].split(' ').slice(2).join(' ')} border-opacity-50 shadow-lg`
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Badge de statut */}
      {isUnlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + 0.1 * index }}
          className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5"
        >
          <CheckCircle className="h-4 w-4" />
        </motion.div>
      )}

      {/* Icône */}
      <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
        isUnlocked 
          ? `bg-gradient-to-r ${colorClasses[reward.color as keyof typeof colorClasses].split(' ').slice(0,2).join(' ')}`
          : 'bg-gray-200 dark:bg-gray-700'
      }`}>
        <Icon className={`h-6 w-6 ${
          isUnlocked 
            ? 'text-white'
            : 'text-gray-400'
        }`} />
      </div>

      {/* Contenu */}
      <div className={`text-2xl font-bold mb-2 ${
        isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'
      }`}>
        {reward.days}j
      </div>
      
      <div className={`text-sm font-bold mb-1 ${
        isUnlocked 
          ? colorClasses[reward.color as keyof typeof colorClasses].split(' ')[5]
          : 'text-gray-500'
      }`}>
        {reward.reward}
      </div>
      
      <div className={`text-xs ${
        isUnlocked 
          ? 'text-gray-600 dark:text-gray-300'
          : 'text-gray-400'
      }`}>
        {reward.bonus}
      </div>

      {/* Barre de progression vers cette récompense */}
      <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isUnlocked 
              ? `bg-gradient-to-r ${colorClasses[reward.color as keyof typeof colorClasses].split(' ').slice(0,2).join(' ')}`
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
          initial={{ width: 0 }}
          animate={{ 
            width: `${Math.min((currentStreak / reward.days) * 100, 100)}%` 
          }}
          transition={{ duration: 1, delay: 0.5 + 0.1 * index }}
        />
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        {currentStreak}/{reward.days}
      </div>
    </motion.div>
  )
}

// Modal d'animation d'ouverture
interface OpeningModalProps {
  isOpen: boolean
  box: DailyBox | null
  getRarityColor: (rarity: string) => string
  getRarityGradient: (rarity: string) => string
}

function OpeningModal({ isOpen, box, getRarityColor, getRarityGradient }: OpeningModalProps) {
  if (!isOpen || !box) return null

  const glowColor = getRarityColor(box.rarity)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="text-center relative"
        >
          {/* Particules d'arrière-plan */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
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
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  scale: [0, Math.random() * 2 + 0.5, 0]
                }}
                transition={{ 
                  duration: 3,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: glowColor }}
              />
            ))}
          </div>

          {/* Animation de la caisse */}
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.3, 1],
              filter: [
                `drop-shadow(0 0 20px ${glowColor}80)`,
                `drop-shadow(0 0 40px ${glowColor})`,
                `drop-shadow(0 0 20px ${glowColor}80)`
              ]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`w-40 h-40 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${getRarityGradient(box.rarity)} flex items-center justify-center shadow-2xl relative overflow-hidden`}
          >
            {/* Effet de brillance */}
            <motion.div
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
            />
            
            {box.image_url ? (
              <img src={box.image_url} alt={box.name} className="w-24 h-24 object-contain relative z-10" />
            ) : (
              <Package className="h-20 w-20 text-white relative z-10" />
            )}
          </motion.div>

          {/* Texte d'animation */}
          <motion.div
            animate={{ 
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity 
            }}
            className="text-white"
          >
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Ouverture magique...
            </h3>
            <div className="flex items-center justify-center gap-2 text-xl text-gray-300">
              <Sparkles className="h-6 w-6" />
              <span>Calcul des probabilités</span>
              <Sparkles className="h-6 w-6" />
            </div>
          </motion.div>

          {/* Barre de progression */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3 }}
            className="w-64 mx-auto mt-8 bg-gray-800 rounded-full h-2 overflow-hidden"
          >
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${getRarityGradient(box.rarity)}`}
              animate={{ 
                boxShadow: [
                  `0 0 10px ${glowColor}80`,
                  `0 0 20px ${glowColor}`,
                  `0 0 10px ${glowColor}80`
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Modal de résultat
interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  item: OpenedItem | null
  getRarityColor: (rarity: string) => string
  getRarityGradient: (rarity: string) => string
}

function ResultModal({ isOpen, onClose, item, getRarityColor, getRarityGradient }: ResultModalProps) {
  if (!isOpen || !item) return null

  const glowColor = getRarityColor(item.rarity)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.7, opacity: 0, y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center relative overflow-hidden"
          style={{ 
            boxShadow: `0 25px 50px ${glowColor}40, 0 0 0 1px ${glowColor}20` 
          }}
        >
          {/* Animation de confettis */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {[...Array(60)].map((_, i) => (
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
                  rotate: Math.random() * 720 - 360
                }}
                transition={{ 
                  duration: Math.random() * 2 + 2,
                  delay: Math.random() * 0.8
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: [glowColor, '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>

          {/* Badge de succès */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative z-10 mb-6"
          >
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-gradient-to-r ${getRarityGradient(item.rarity)} shadow-xl`}>
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Incroyable !
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Vous avez obtenu :</p>
          </motion.div>

          {/* Affichage de l'objet */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="relative z-10 mb-8"
          >
            {/* Image de l'objet avec effet de glow */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 30px ${glowColor}60`,
                    `0 0 60px ${glowColor}80`,
                    `0 0 30px ${glowColor}60`
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full h-full rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-16 w-16 text-gray-400" />
                )}
              </motion.div>
            </div>

            {/* Badge de rareté avec animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              className={`inline-block px-6 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getRarityGradient(item.rarity)} mb-4 shadow-lg`}
            >
              ★ {item.rarity?.toUpperCase() || 'COMMON'} ★
            </motion.div>

            {/* Nom de l'objet */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {item.name}
            </h3>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                  <Gem className="h-5 w-5" />
                  <span className="font-medium">Valeur</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.market_value}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-medium">XP Bonus</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  +{item.xpGained}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="relative z-10 space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r ${getRarityGradient(item.rarity)} shadow-xl hover:shadow-2xl transition-all duration-300`}
              style={{
                boxShadow: `0 10px 30px ${glowColor}40`
              }}
            >
              Fantastique !
            </motion.button>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                <Package className="h-4 w-4" />
                Inventaire
              </button>
              <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                Partager
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}