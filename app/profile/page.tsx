'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ProfileSettings from './ProfileSettings'
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
  ShoppingBag
} from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [notification, setNotification] = useState({ type: '', message: '' })
  
  const [formData, setFormData] = useState({
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

  const [stats, setStats] = useState({
    totalBoxesOpened: 0,
    totalCoinsSpent: 0,
    totalValue: 0,
    battlesWon: 0,
    battlesPlayed: 0,
    currentStreak: 0,
    favoriteBox: 'Aucune',
    joinDate: null,
    level: 1,
    totalExp: 0,
    achievements: []
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [userInventory, setUserInventory] = useState([])
  const [userTransactions, setUserTransactions] = useState([])
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 5000)
  }

  useEffect(() => {
    initializeProfile()
  }, [])

  // Auto-refresh et Realtime
  useEffect(() => {
    if (!user) return

    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      if (!loading) {
        loadUserStats(user.id)
      }
    }, 30000)

    // Écouter les changements via Realtime
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Profile updated via realtime:', payload)
          setProfile(payload.new)
          loadUserStats(user.id)
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [user, loading])

  const initializeProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth error:', userError)
        showNotification('error', 'Erreur d\'authentification')
        return
      }
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      await loadUserData(user.id)
      
      // Forcer un refresh des stats après le chargement initial
      setTimeout(() => {
        loadUserStats(user.id)
      }, 1000)
      
    } catch (error) {
      console.error('Error loading profile:', error)
      showNotification('error', 'Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async (userId) => {
    try {
      // Load profile data with better error handling
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Profile not found, creating one...')
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            username: `user_${userId.slice(0, 8)}`,
            virtual_currency: 100,
            loyalty_points: 0,
            total_exp: 0,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (createError) {
          console.error('Error creating profile:', createError)
          throw createError
        }
        
        setProfile(newProfile)
        setFormData({
          username: newProfile.username || '',
          email: user?.email || '',
          bio: newProfile.bio || '',
          location: newProfile.location || '',
          phone: newProfile.phone || '',
          birth_date: newProfile.birth_date || '',
          privacy_profile: newProfile.privacy_profile || 'public',
          notifications_email: newProfile.notifications_email ?? true,
          notifications_push: newProfile.notifications_push ?? true
        })
      } else if (profileError) {
        throw profileError
      } else if (profile) {
        setProfile(profile)
        setFormData({
          username: profile.username || '',
          email: user?.email || '',
          bio: profile.bio || '',
          location: profile.location || '',
          phone: profile.phone || '',
          birth_date: profile.birth_date || '',
          privacy_profile: profile.privacy_profile || 'public',
          notifications_email: profile.notifications_email ?? true,
          notifications_push: profile.notifications_push ?? true
        })
      }

      // Load statistics from real data
      await loadUserStats(userId)
      await loadUserActivity(userId)
      await loadUserInventory(userId)
      
    } catch (error) {
      console.error('Error loading user data:', error)
      showNotification('error', 'Erreur lors du chargement des données')
    }
  }

  const loadUserStats = async (userId) => {
    try {
      // Get transactions statistics
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)

      if (transError && transError.code !== 'PGRST116') {
        console.error('Transactions error:', transError)
      }

      // Get inventory count
      const { data: inventory, error: invError } = await supabase
        .from('user_inventory')
        .select('*, items(*)')
        .eq('user_id', userId)

      if (invError && invError.code !== 'PGRST116') {
        console.error('Inventory error:', invError)
      }

      // Get battles statistics
      const { data: battles, error: battleError } = await supabase
        .from('battle_players')
        .select('*, battles(*)')
        .eq('user_id', userId)

      if (battleError && battleError.code !== 'PGRST116') {
        console.error('Battles error:', battleError)
      }

      // Calculate statistics
      let totalBoxesOpened = 0
      let totalCoinsSpent = 0
      let totalValue = 0

      if (transactions && transactions.length > 0) {
        totalBoxesOpened = transactions.filter(t => t.type === 'open_box').length
        totalCoinsSpent = transactions
          .filter(t => t.virtual_amount > 0)
          .reduce((sum, t) => sum + (t.virtual_amount || 0), 0)
      }

      if (inventory && inventory.length > 0) {
        totalValue = inventory.reduce((sum, item) => {
          return sum + ((item.items?.market_value || 0) * (item.quantity || 1))
        }, 0)
      }

      let battlesPlayed = 0
      let battlesWon = 0
      if (battles && battles.length > 0) {
        battlesPlayed = battles.length
        battlesWon = battles.filter(b => b.battles?.winner_id === userId).length
      }

      // Calculate level from total XP
      const totalExp = profile?.total_exp || totalCoinsSpent || 0
      const level = Math.floor(totalExp / 1000) + 1

      // Find favorite box
      let favoriteBox = 'Aucune'
      if (transactions && transactions.length > 0) {
        const boxCounts = {}
        transactions
          .filter(t => t.type === 'open_box' && t.loot_box_id)
          .forEach(t => {
            boxCounts[t.loot_box_id] = (boxCounts[t.loot_box_id] || 0) + 1
          })
        
        if (Object.keys(boxCounts).length > 0) {
          const mostUsedBoxId = Object.keys(boxCounts).reduce((a, b) => 
            boxCounts[a] > boxCounts[b] ? a : b
          )
          
          // Get box name
          const { data: boxData } = await supabase
            .from('loot_boxes')
            .select('name')
            .eq('id', mostUsedBoxId)
            .single()
          
          if (boxData) favoriteBox = boxData.name
        }
      }

      // Generate achievements based on real data
      const achievements = generateAchievements({
        totalBoxesOpened,
        totalCoinsSpent,
        battlesWon,
        battlesPlayed,
        inventoryCount: inventory?.length || 0,
        joinDate: profile?.created_at
      })

      setStats({
        totalBoxesOpened,
        totalCoinsSpent,
        totalValue,
        battlesWon,
        battlesPlayed,
        currentStreak: calculateStreak(transactions),
        favoriteBox,
        joinDate: profile?.created_at || user.created_at,
        level,
        totalExp,
        achievements
      })

    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadUserActivity = async (userId) => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          loot_boxes(name),
          items(name, rarity)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error && error.code !== 'PGRST116') {
        console.error('Activity error:', error)
        return
      }

      const activity = transactions?.map(transaction => {
        let title, description, icon, color

        switch (transaction.type) {
          case 'purchase_currency':
            title = 'Coins achetés'
            description = `+${transaction.virtual_amount} coins`
            icon = Coins
            color = 'text-yellow-600'
            break
          case 'purchase_box':
            title = 'Boîte achetée'
            description = `${transaction.loot_boxes?.name || 'Boîte'} - ${transaction.virtual_amount} coins`
            icon = ShoppingBag
            color = 'text-blue-600'
            break
          case 'open_box':
            title = 'Boîte ouverte'
            description = `${transaction.items?.name || 'Objet'} obtenu`
            icon = Gift
            color = 'text-green-600'
            break
          case 'battle_win':
            title = 'Battle gagnée'
            description = `+${transaction.virtual_amount || 0} coins de récompense`
            icon = Trophy
            color = 'text-purple-600'
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
      }) || []

      setRecentActivity(activity)

    } catch (error) {
      console.error('Error loading activity:', error)
    }
  }

  const loadUserInventory = async (userId) => {
    try {
      const { data: inventory, error } = await supabase
        .from('user_inventory')
        .select('*, items(*)')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false })

      if (error && error.code !== 'PGRST116') {
        console.error('Inventory load error:', error)
        return
      }

      setUserInventory(inventory || [])

    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  const generateAchievements = (stats) => {
    const achievements = [
      {
        id: 1,
        name: 'Premier pas',
        description: 'Première boîte ouverte',
        icon: Gift,
        unlocked: stats.totalBoxesOpened >= 1
      },
      {
        id: 2,
        name: 'Collectionneur',
        description: '10 boîtes ouvertes',
        icon: Package,
        unlocked: stats.totalBoxesOpened >= 10
      },
      {
        id: 3,
        name: 'Accro',
        description: '50 boîtes ouvertes',
        icon: Zap,
        unlocked: stats.totalBoxesOpened >= 50
      },
      {
        id: 4,
        name: 'Investisseur',
        description: '1000 coins dépensés',
        icon: Coins,
        unlocked: stats.totalCoinsSpent >= 1000
      },
      {
        id: 5,
        name: 'Guerrier',
        description: 'Première victoire en battle',
        icon: Sword,
        unlocked: stats.battlesWon >= 1
      },
      {
        id: 6,
        name: 'Champion',
        description: '10 victoires en battle',
        icon: Crown,
        unlocked: stats.battlesWon >= 10
      },
      {
        id: 7,
        name: 'Vétéran',
        description: 'Membre depuis 30 jours',
        icon: Calendar,
        unlocked: stats.joinDate ? 
          (Date.now() - new Date(stats.joinDate).getTime()) > 30 * 24 * 60 * 60 * 1000 : false
      },
      {
        id: 8,
        name: 'Millionnaire',
        description: 'Inventaire valant 1000+ coins',
        icon: Star,
        unlocked: stats.totalValue >= 1000
      }
    ]

    return achievements
  }

  const calculateStreak = (transactions) => {
    if (!transactions || transactions.length === 0) return 0

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayTransactions = transactions.filter(t => {
      const transDate = new Date(t.created_at)
      return transDate.toDateString() === today.toDateString()
    })

    const yesterdayTransactions = transactions.filter(t => {
      const transDate = new Date(t.created_at)
      return transDate.toDateString() === yesterday.toDateString()
    })

    if (todayTransactions.length > 0) {
      return yesterdayTransactions.length > 0 ? 2 : 1
    }

    return 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      showNotification('error', 'L\'image ne doit pas dépasser 5MB')
      return
    }

    setUploadingAvatar(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Supprimer l'ancien avatar s'il existe
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage
          .from('avatars')
          .remove([oldPath])
      }

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Mettre à jour l'état local immédiatement
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      
      showNotification('success', 'Photo de profil mise à jour !')
      
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
      // Validation
      if (!formData.username?.trim()) {
        showNotification('error', 'Le nom d\'utilisateur est requis')
        return
      }

      if (formData.username.length < 3) {
        showNotification('error', 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
        return
      }

      // Check if username is already taken (if changed)
      if (formData.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', user.id)
          .single()

        if (existingUser) {
          showNotification('error', 'Ce nom d\'utilisateur est déjà pris')
          return
        }
      }

      // Update profile
      const { data, error } = await supabase
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
        .eq('id', user.id)
        .select()

      if (error) throw error

      // Update local state
      setProfile(prev => ({ 
        ...prev, 
        ...data[0]
      }))
      
      setEditMode(false)
      showNotification('success', 'Profil mis à jour avec succès !')
      
      // Auto-refresh des stats après sauvegarde
      setTimeout(() => {
        loadUserStats(user.id)
      }, 500)
      
    } catch (error) {
      console.error('Error saving profile:', error)
      showNotification('error', `Erreur détaillée: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const refreshData = async () => {
    if (user) {
      setLoading(true)
      await loadUserData(user.id)
      setLoading(false)
      showNotification('success', 'Données mises à jour !')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'activity', label: 'Activité', icon: Clock },
    { id: 'achievements', label: 'Succès', icon: Trophy },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ]

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateWinRate = () => {
    return stats.battlesPlayed > 0 ? ((stats.battlesWon / stats.battlesPlayed) * 100).toFixed(1) : 0
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
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
                  className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                  title="Actualiser les données"
                >
                  <ArrowRight className="h-4 w-4" />
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
                          style={{ width: `${((stats.totalExp % 1000) / 1000) * 100}%` }}
                        />
                      </div>
                      <div className="text-center text-gray-600 text-sm mt-2">
                        {1000 - (stats.totalExp % 1000)} XP pour le niveau suivant
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-gray-700">
                        <strong>Astuce :</strong> Gagnez de l'XP en ouvrant des boîtes et en participant à des battles !
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
                        {userInventory.slice(0, 8).map((item) => (
                          <div key={item.id} className="relative bg-gray-50 rounded-xl p-3">
                            <div className="aspect-square bg-white rounded-lg mb-2 flex items-center justify-center">
                              {item.items?.image_url ? (
                                <img 
                                  src={item.items.image_url} 
                                  alt={item.items.name}
                                  className="w-full h-full object-cover rounded-lg"
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
                          style={{ width: `${calculateWinRate()}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Progression niveau</span>
                        <span className="font-bold text-green-600">{((stats.totalExp % 1000) / 1000 * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(stats.totalExp % 1000) / 1000 * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{stats.battlesPlayed}</div>
                        <div className="text-gray-600 text-sm">Battles jouées</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{userInventory.length}</div>
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
                        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
                        
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