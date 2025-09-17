'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProfileSettings from './ProfileSettings'
import UpgradeHistoryTab from '@/app/components/UpgradeHistoryTab'
import { 
  User, 
  Settings,
  Trophy,
  Calendar,
  Gift,
  Coins,
  Star,
  Crown,
  TrendingUp,
  Target,
  Sword,
  Eye,
  Edit3,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Bell,
  Lock,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Award,
  Flame,
  Users,
  Package,
  Clock,
  ArrowRight,
  Copy,
  Zap,
  Heart,
  ShoppingBag,
  Sparkles,
  RefreshCw
} from 'lucide-react'

// ✅ INTERFACES TYPESCRIPT CORRIGÉES
interface NotificationState {
  type: 'success' | 'error' | ''
  message: string
}

interface FormData {
  username: string
  email: string
  bio: string
  location: string
  phone: string
  birth_date: string
  privacy_profile: 'public' | 'private'
  notifications_email: boolean
  notifications_push: boolean
}

interface UserStats {
  totalBoxesOpened: number
  totalCoinsSpent: number
  totalCoinsEarned: number
  totalValue: number
  battlesWon: number
  battlesPlayed: number
  battleWinRate: number
  currentStreak: number
  favoriteBox: string
  joinDate: string | null
  level: number
  totalExp: number
  currentLevelXP: number
  nextLevelXP: number
  achievements: Achievement[]
  inventoryCount: number
  uniqueItemsCount: number
  lastActivity: string | null
}

interface Achievement {
  id: number
  name: string
  description: string
  icon: any
  unlocked: boolean
  category: string
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: any
  color: string
}

interface Transaction {
  id: string
  type: string
  virtual_amount?: number
  created_at: string
  user_id: string
}

interface InventoryItem {
  id: string
  quantity: number
  obtained_at: string
  items?: {
    name: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    image_url?: string
    market_value: number
  }
}

interface Tab {
  id: string
  label: string
  icon: any
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [notification, setNotification] = useState<NotificationState>({ type: '', message: '' })
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    birth_date: '',
    privacy_profile: 'public',
    notifications_email: true,
    notifications_push: true
  })

  const [stats, setStats] = useState<UserStats>({
    totalBoxesOpened: 0,
    totalCoinsSpent: 0,
    totalCoinsEarned: 0,
    totalValue: 0,
    battlesWon: 0,
    battlesPlayed: 0,
    battleWinRate: 0,
    currentStreak: 0,
    favoriteBox: 'Aucune',
    joinDate: null,
    level: 1,
    totalExp: 0,
    currentLevelXP: 0,
    nextLevelXP: 1000,
    achievements: [],
    inventoryCount: 0,
    uniqueItemsCount: 0,
    lastActivity: null
  })

  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([])
  
  const router = useRouter()

  // ✅ FONCTION NOTIFICATION CORRIGÉE
  const showNotification = (type: 'success' | 'error', message: string) => {
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
      initializeProfile()
    }
  }, [authLoading, isAuthenticated, user])

  const initializeProfile = async () => {
    try {
      if (!user) return

      console.log('🔄 Initializing profile for user:', user.id)

      // Initialiser formData avec les données du profil
      setFormData({
        username: profile?.username ?? '',
        email: user?.email ?? '',
        bio: profile?.bio ?? '',
        location: profile?.location ?? '',
        phone: profile?.phone ?? '',
        birth_date: profile?.birth_date ?? '',
        privacy_profile: (profile?.privacy_profile as 'public' | 'private') ?? 'public',
        notifications_email: profile?.notifications_email ?? true,
        notifications_push: profile?.notifications_push ?? true
      })

      await loadUserStats(user.id)
      await loadUserActivity(user.id)
      await loadUserInventory(user.id)
      
    } catch (error) {
      console.error('Error loading profile:', error)
      showNotification('error', 'Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      console.log('📊 Loading user stats for:', userId)
      const supabase = createClient()
      
      // 1. Récupérer les transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (transError && transError.code !== 'PGRST116') {
        console.error('Transactions error:', transError)
      }

      // 2. Récupérer l'inventaire
      const { data: inventory, error: invError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false })

      if (invError && invError.code !== 'PGRST116') {
        console.error('Inventory error:', invError)
      }

      // 3. Calculs basés sur les données disponibles
      let totalBoxesOpened = 0
      let totalCoinsSpent = 0
      let totalCoinsEarned = 0
      let totalValue = 0

      if (transactions && transactions.length > 0) {
        totalBoxesOpened = transactions.filter(t => 
          t.type === 'open_box' || t.type === 'purchase_box'
        ).length
        
        totalCoinsSpent = transactions
          .filter(t => ['purchase_box', 'purchase_currency'].includes(t.type))
          .reduce((sum, t) => sum + Math.abs(t.virtual_amount || 0), 0)
        
        totalCoinsEarned = transactions
          .filter(t => ['battle_win', 'daily_reward', 'referral_bonus'].includes(t.type))
          .reduce((sum, t) => sum + (t.virtual_amount || 0), 0)
      }

      if (inventory && inventory.length > 0) {
        totalValue = inventory.length * 500
      }

      // 4. Statistiques de battles
      let battlesPlayed = 0
      let battlesWon = 0
      let battleWinRate = 0

      // 5. Calcul niveau et XP
      const baseXP = Math.floor(totalCoinsSpent / 10)
      const bonusXP = (totalBoxesOpened * 25)
      const totalExp = baseXP + bonusXP
      const level = Math.floor(totalExp / 100) + 1
      const currentLevelXP = totalExp % 100
      const nextLevelXP = 100 - currentLevelXP

      // 6. Boîte favorite
      let favoriteBox = 'Aucune'
      if (totalBoxesOpened > 0) {
        favoriteBox = `Boîtes ouvertes (${totalBoxesOpened}x)`
      }

      // 7. Streak
      const currentStreak = calculateStreakFromTransactions(transactions || [])

      // ✅ 8. CORRECTION JOINDATE
      const joinDate = profile?.created_at ?? user?.created_at ?? null

      // 9. Achievements
      const achievements = generateAchievements({
        totalBoxesOpened,
        totalCoinsSpent,
        totalCoinsEarned,
        battlesWon,
        battlesPlayed,
        inventoryCount: inventory?.length || 0,
        totalValue,
        level,
        joinDate,
        currentStreak
      })

      // 10. Mettre à jour les stats
      const newStats: UserStats = {
        totalBoxesOpened,
        totalCoinsSpent,
        totalCoinsEarned,
        totalValue,
        battlesWon,
        battlesPlayed,
        battleWinRate,
        currentStreak,
        favoriteBox,
        joinDate,
        level,
        totalExp,
        currentLevelXP,
        nextLevelXP,
        achievements,
        inventoryCount: inventory?.length || 0,
        uniqueItemsCount: inventory?.length || 0,
        lastActivity: transactions?.[0]?.created_at ?? null
      }

      console.log('📊 Updated stats:', newStats)
      setStats(newStats)
      
      setRecentActivity(formatActivityData(transactions?.slice(0, 20) || []))

      return newStats

    } catch (error) {
      console.error('Error loading stats:', error)
      showNotification('error', 'Erreur lors du chargement des statistiques')
      return null
    }
  }

  const calculateStreakFromTransactions = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streak = 0
    let currentDate = new Date(today)
    
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const hasActivity = transactions.some(t => {
        const transDate = new Date(t.created_at)
        return transDate >= dayStart && transDate <= dayEnd
      })
      
      if (hasActivity) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        if (i === 0) {
          currentDate.setDate(currentDate.getDate() - 1)
          continue
        }
        break
      }
    }
    
    return streak
  }

  const generateAchievements = (stats: {
    totalBoxesOpened: number
    totalCoinsSpent: number
    totalCoinsEarned: number
    battlesWon: number
    battlesPlayed: number
    inventoryCount: number
    totalValue: number
    level: number
    joinDate?: string | null
    currentStreak: number
  }): Achievement[] => {
    const achievements: Achievement[] = [
      {
        id: 1,
        name: 'Premier pas',
        description: 'Première boîte ouverte',
        icon: Gift,
        unlocked: stats.totalBoxesOpened >= 1,
        category: 'boxes'
      },
      {
        id: 2,
        name: 'Collectionneur',
        description: '5 boîtes ouvertes',
        icon: Package,
        unlocked: stats.totalBoxesOpened >= 5,
        category: 'boxes'
      },
      {
        id: 3,
        name: 'Expert',
        description: '10 boîtes ouvertes',
        icon: Crown,
        unlocked: stats.totalBoxesOpened >= 10,
        category: 'boxes'
      },
      {
        id: 4,
        name: 'Investisseur',
        description: '500 coins dépensés',
        icon: Coins,
        unlocked: stats.totalCoinsSpent >= 500,
        category: 'economy'
      },
      {
        id: 5,
        name: 'Gros investisseur',
        description: '1000 coins dépensés',
        icon: Coins,
        unlocked: stats.totalCoinsSpent >= 1000,
        category: 'economy'
      },
      {
        id: 6,
        name: 'Régulier',
        description: '3 jours de suite actif',
        icon: Flame,
        unlocked: stats.currentStreak >= 3,
        category: 'activity'
      },
      {
        id: 7,
        name: 'Assidu',
        description: '7 jours de suite actif',
        icon: Flame,
        unlocked: stats.currentStreak >= 7,
        category: 'activity'
      },
      {
        id: 8,
        name: 'Niveau 5',
        description: 'Atteindre le niveau 5',
        icon: TrendingUp,
        unlocked: stats.level >= 5,
        category: 'progression'
      },
      {
        id: 9,
        name: 'Niveau 10',
        description: 'Atteindre le niveau 10',
        icon: Star,
        unlocked: stats.level >= 10,
        category: 'progression'
      },
      {
        id: 10,
        name: 'Collectionneur de valeur',
        description: 'Inventaire de 2000+ coins',
        icon: Trophy,
        unlocked: stats.totalValue >= 2000,
        category: 'collection'
      }
    ]

    return achievements
  }

  const formatActivityData = (transactions: Transaction[]): Activity[] => {
    if (!transactions) return []
    
    return transactions.map(transaction => {
      let title: string, description: string, icon: any, color: string

      switch (transaction.type) {
        case 'purchase_currency':
          title = 'Coins achetés'
          description = `+${transaction.virtual_amount || 0} coins`
          icon = Coins
          color = 'text-yellow-600'
          break
          
        case 'purchase_box':
          title = 'Boîte achetée'
          description = `Boîte achetée pour ${transaction.virtual_amount || 0} coins`
          icon = ShoppingBag
          color = 'text-blue-600'
          break
          
        case 'open_box':
          title = 'Boîte ouverte'
          description = 'Objet obtenu dans une boîte'
          icon = Gift
          color = 'text-green-600'
          break
          
        case 'battle_win':
          title = 'Battle gagnée'
          description = `+${transaction.virtual_amount || 0} coins de récompense`
          icon = Trophy
          color = 'text-purple-600'
          break
          
        case 'daily_reward':
          title = 'Récompense quotidienne'
          description = `+${transaction.virtual_amount || 0} coins`
          icon = Calendar
          color = 'text-orange-600'
          break
          
        default:
          title = 'Transaction'
          description = transaction.type
          icon = Star
          color = 'text-gray-600'
      }

      return {
        id: transaction.id,
        type: transaction.type,
        title,
        description,
        timestamp: transaction.created_at,
        icon,
        color
      }
    })
  }

  const loadUserActivity = async (userId: string) => {
    try {
      const supabase = createClient()
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error && error.code !== 'PGRST116') {
        console.error('Activity error:', error)
        setRecentActivity([])
        return
      }

      const activity = formatActivityData(transactions || [])
      setRecentActivity(activity)

    } catch (error) {
      console.error('Error loading activity:', error)
      setRecentActivity([])
    }
  }

  const loadUserInventory = async (userId: string) => {
    try {
      const supabase = createClient()
      
      const { data: inventory, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false })

      if (error && error.code !== 'PGRST116') {
        console.error('Inventory load error:', error)
        setUserInventory([])
        return
      }

      const mockInventory = (inventory || []).map((item, index) => ({
        ...item,
        items: {
          name: `Objet ${index + 1}`,
          rarity: (['common', 'rare', 'epic', 'legendary'] as const)[index % 4],
          image_url: undefined,
          market_value: 100 + (index * 50)
        }
      }))

      setUserInventory(mockInventory)

    } catch (error) {
      console.error('Error loading inventory:', error)
      setUserInventory([])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // ✅ FONCTION UPLOAD AVATAR CORRIGÉE
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'L\'image ne doit pas dépasser 5MB')
      return
    }

    setUploadingAvatar(true)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      await refreshProfile()
      showNotification('success', 'Photo de profil mise à jour !')
      
      event.target.value = ''
      
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showNotification('error', 'Erreur lors de l\'upload de l\'image')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    
    try {
      if (!formData.username?.trim()) {
        showNotification('error', 'Le nom d\'utilisateur est requis')
        return
      }

      if (formData.username.length < 3) {
        showNotification('error', 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
        return
      }

      const supabase = createClient()

      if (formData.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', user?.id)
          .single()

        if (existingUser) {
          showNotification('error', 'Ce nom d\'utilisateur est déjà pris')
          return
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username.trim(),
          bio: formData.bio?.trim() || null,
          location: formData.location?.trim() || null,
          phone: formData.phone?.trim() || null,
          birth_date: formData.birth_date || null,
          privacy_profile: formData.privacy_profile,
          notifications_email: formData.notifications_email,
          notifications_push: formData.notifications_push,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error

      await refreshProfile()
      setEditMode(false)
      showNotification('success', 'Profil mis à jour avec succès !')
      
    } catch (error) {
      console.error('Error saving profile:', error)
      if (error instanceof Error) {
        showNotification('error', `Erreur: ${error.message}`)
      } else {
        showNotification('error', 'Erreur lors de la sauvegarde')
      }
    } finally {
      setSaving(false)
    }
  }

  const refreshData = async () => {
    if (!user) return
    
    setRefreshing(true)
    try {
      await loadUserStats(user.id)
      await loadUserActivity(user.id)
      await loadUserInventory(user.id)
      await refreshProfile()
      showNotification('success', 'Données mises à jour !')
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour')
    } finally {
      setRefreshing(false)
    }
  }

  const tabs: Tab[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'activity', label: 'Activité', icon: Clock },
	{ id: 'upgrades', label: 'Upgrades', icon: TrendingUp }, // NOUVEAU
    { id: 'achievements', label: 'Succès', icon: Trophy },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ]

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  const calculateWinRate = () => {
    return stats.battlesPlayed > 0 ? ((stats.battlesWon / stats.battlesPlayed) * 100).toFixed(1) : '0'
  }

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="h-24 w-24 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {(profile?.username || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <label className="absolute -bottom-2 -right-2 h-8 w-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-gray-600" />
                )}
              </label>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.username || 'Nouvel utilisateur'}
                </h1>
                <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <Crown className="h-4 w-4" />
                  Niveau {stats.level}
                </div>
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                  title="Actualiser les données"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                {profile?.bio || 'Aucune bio renseignée. Ajoutez une description dans les paramètres !'}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {profile?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Membre depuis {formatDate(stats.joinDate)}
                </div>
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  {stats.currentStreak} jours de streak
                </div>
                {profile?.virtual_currency !== undefined && (
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {profile.virtual_currency} coins
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-green-600">{stats.totalBoxesOpened}</div>
                <div className="text-xs text-gray-600">Boîtes</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-blue-600">{stats.battlesWon}</div>
                <div className="text-xs text-gray-600">Victoires</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-purple-600">{calculateWinRate()}%</div>
                <div className="text-xs text-gray-600">Winrate</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-lg border border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques principales</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-700">{stats.totalBoxesOpened}</div>
                        <div className="text-green-600 text-sm">Boîtes ouvertes</div>
                      </div>
                      
                      <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <Coins className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-yellow-700">{stats.totalCoinsSpent.toLocaleString()}</div>
                        <div className="text-yellow-600 text-sm">Coins dépensés</div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700">{stats.battlesWon}/{stats.battlesPlayed}</div>
                        <div className="text-blue-600 text-sm">Battles</div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-purple-700">{stats.totalValue.toLocaleString()}</div>
                        <div className="text-purple-600 text-sm">Valeur inventaire</div>
                      </div>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Progression</h2>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Niveau {stats.level}</span>
                        <span className="text-gray-600 text-sm">{stats.totalExp} XP</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${(stats.currentLevelXP / 100) * 100}%` }}
                        />
                      </div>
                      <div className="text-center text-gray-600 text-sm mt-2">
                        {stats.nextLevelXP} XP pour le niveau suivant
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-gray-700">
                        <strong>Astuce :</strong> Gagnez de l'XP en ouvrant des boîtes et en participant à des activités !
                      </p>
                    </div>
                  </div>

                  {/* Recent Inventory */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Derniers objets obtenus</h2>
                      <button 
                        onClick={() => router.push('/inventory')}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Voir tout →
                      </button>
                    </div>
                    
                    {userInventory.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {userInventory.slice(0, 8).map((item, index) => (
                          <div key={item.id || index} className="relative bg-gray-50 rounded-xl p-3">
                            <div className="aspect-square bg-white rounded-lg mb-2 flex items-center justify-center">
                              {item.items?.image_url ? (
                                <img 
                                  src={item.items.image_url} 
                                  alt={item.items.name}
                                  className="max-h-40 w-auto mx-auto object-contain"
                                />
                              ) : (
                                <Package className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {item.items?.name || 'Objet inconnu'}
                            </h4>
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(item.items?.rarity)}`}>
                                {item.items?.rarity || 'common'}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  x{item.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Aucun objet dans votre inventaire</p>
                        <button 
                          onClick={() => router.push('/boxes')}
                          className="mt-2 text-green-600 hover:text-green-700 font-medium"
                        >
                          Ouvrir votre première boîte →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={() => router.push('/boxes')}
                        className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
                      >
                        <Gift className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">Ouvrir une boîte</span>
                      </button>
                      
                      <button 
                        onClick={() => router.push('/battle')}
                        className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                      >
                        <Sword className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-700 font-medium">Rejoindre une battle</span>
                      </button>
                      
                      <button 
                        onClick={() => router.push('/buy-coins')}
                        className="w-full flex items-center gap-3 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl border border-yellow-200 transition-colors"
                      >
                        <Coins className="h-5 w-5 text-yellow-600" />
                        <span className="text-yellow-700 font-medium">Acheter des coins</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Activité récente</h3>
                      <button 
                        onClick={() => setActiveTab('activity')}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Voir tout →
                      </button>
                    </div>
                    
                    {recentActivity.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {recentActivity.slice(0, 5).map((activity) => {
                          const Icon = activity.icon
                          return (
                            <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                              <div className={`p-2 rounded-lg bg-gray-50 ${activity.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {activity.title}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                  {activity.description}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatDateTime(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">Aucune activité récente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Stats */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Performance</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Taux de victoire (Battles)</span>
                        <span className="font-bold text-purple-600">{calculateWinRate()}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${Math.min(parseFloat(calculateWinRate()), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Progression niveau</span>
                        <span className="font-bold text-green-600">{((stats.currentLevelXP / 100) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(stats.currentLevelXP / 100) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{stats.battlesPlayed}</div>
                        <div className="text-gray-600 text-sm">Battles jouées</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{stats.inventoryCount}</div>
                        <div className="text-gray-600 text-sm">Objets uniques</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques détaillées</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Boîte favorite</span>
                      <span className="font-medium text-gray-900">{stats.favoriteBox}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Streak actuel</span>
                      <span className="font-medium text-orange-600">{stats.currentStreak} jours</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Total coins dépensés</span>
                      <span className="font-medium text-yellow-600">{stats.totalCoinsSpent.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Valeur inventaire</span>
                      <span className="font-medium text-green-600">{stats.totalValue.toLocaleString()} coins</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Niveau actuel</span>
                      <span className="font-medium text-purple-600">Niveau {stats.level}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Membre depuis</span>
                      <span className="font-medium text-blue-600">{formatDate(stats.joinDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Inventory Breakdown */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 lg:col-span-2">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Répartition de l'inventaire</h2>
                  
                  {userInventory.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['common', 'rare', 'epic', 'legendary'].map(rarity => {
                        const items = userInventory.filter(item => item.items?.rarity === rarity)
                        const count = items.length
                        const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0)
                        
                        return (
                          <div key={rarity} className={`text-center p-4 rounded-xl border ${getRarityColor(rarity)}`}>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm capitalize">{rarity}</div>
                            <div className="text-xs opacity-75">({totalQuantity} total)</div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucun objet pour afficher les statistiques</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Historique d'activité</h2>
                  <p className="text-gray-600 mt-1">Toutes vos actions récentes sur ReveelBox</p>
                </div>
                
                <div className="p-6">
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => {
                        const Icon = activity.icon
                        return (
                          <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl border border-gray-100">
                            <div className={`p-3 rounded-xl bg-gray-50 ${activity.color}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{activity.title}</h3>
                              <p className="text-gray-600 text-sm">{activity.description}</p>
                              <p className="text-gray-400 text-xs mt-1">{formatDateTime(activity.timestamp)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune activité</h3>
                      <p className="text-gray-600">Commencez à ouvrir des boîtes pour voir votre activité ici !</p>
                      <button 
                        onClick={() => router.push('/boxes')}
                        className="mt-4 bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600 transition-colors"
                      >
                        Ouvrir une boîte
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Succès & Achievements</h2>
                  <p className="text-gray-600 mt-1">
                    {stats.achievements.filter(a => a.unlocked).length} / {stats.achievements.length} succès débloqués
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.achievements.map((achievement) => {
                      const Icon = achievement.icon
                      return (
                        <div 
                          key={achievement.id} 
                          className={`p-4 rounded-xl border transition-all ${
                            achievement.unlocked 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${
                              achievement.unlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            {achievement.unlocked && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          
                          <h3 className={`font-medium mb-1 ${
                            achievement.unlocked ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {achievement.name}
                          </h3>
                          
                          <p className={`text-sm ${
                            achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {achievement.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
			
			// Ajoutez le contenu de l'onglet dans le switch des tabs (après achievements)
{activeTab === 'upgrades' && (
  <UpgradeHistoryTab userId={user?.id} />
)}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <ProfileSettings 
                user={user}
                profile={profile}
                formData={formData}
                setFormData={setFormData}
                editMode={editMode}
                setEditMode={setEditMode}
                showNotification={showNotification}
                onSave={saveProfile}
                saving={saving}
                handleAvatarUpload={handleAvatarUpload}
                uploadingAvatar={uploadingAvatar}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}