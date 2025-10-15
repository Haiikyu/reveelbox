'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ParticlesBackground from '@/app/components/affiliate/ParticlesBackground'
import {
  User, Settings, Trophy, Calendar, Gift, Coins, Star, Crown,
  TrendingUp, Target, Sword, Eye, Edit3, Save, X, Mail, Phone,
  MapPin, Camera, Shield, Bell, Lock, Loader2, BarChart3, Award,
  Flame, Users, Package, Clock, Copy, Zap, Heart, ShoppingBag,
  Sparkles, CheckCircle, AlertCircle, Upload, Download, Globe,
  Link as LinkIcon, Instagram, Twitter, Twitch, Youtube,
  Palette, Image, Type, Hash, Activity, Calendar as CalendarIcon,
  DollarSign, TrendingDown, Percent, LineChart, PieChart,
  ArrowUpRight, ArrowDownRight, Box, Swords, GamepadIcon,
  ChevronRight, Home, History, Sliders, LogOut, Menu
} from 'lucide-react'

interface UserStats {
  totalBoxesOpened: number
  totalCoinsSpent: number
  totalCoinsEarned: number
  totalValue: number
  totalItemsSold: number
  totalRevenue: number
  battlesWon: number
  battlesLost: number
  battlesPlayed: number
  battleWinRate: number
  totalBattleWinnings: number
  totalBattleLosses: number
  longestWinStreak: number
  currentWinStreak: number
  currentStreak: number
  longestStreak: number
  level: number
  totalExp: number
  currentLevelXP: number
  nextLevelXP: number
  inventoryCount: number
  uniqueItemsCount: number
  mostExpensiveItem: any
  favoriteRarity: string
  favoriteBox: string
  mostOpenedBox: string
  luckiestBox: string
  joinDate: string | null
  lastActivity: string | null
  totalPlayTime: number
  globalRank: number
  countryRank: number
  levelRank: number
}

interface ProfileCustomization {
  theme_color: string
  banner_url: string
  badge_style: string
  show_stats: boolean
  show_inventory: boolean
  show_achievements: boolean
  profile_privacy: 'public' | 'friends' | 'private'
  avatar_frame: string
  profile_title: string
  custom_badge: string
  banner_overlay: string
  profile_effect: string
  color_theme: string
  // Nouvelles options Steam-like
  background_wallpaper?: string
  showcase_type?: 'items' | 'achievements' | 'stats' | 'recent_activity' | 'none'
  profile_layout?: 'classic' | 'modern' | 'compact'
  animation_style?: 'subtle' | 'dynamic' | 'none'
  featured_badge?: string
  showcase_items?: string[]
  background_pattern?: 'dots' | 'grid' | 'waves' | 'none'
  card_style?: 'glass' | 'solid' | 'gradient'
}

interface SocialLinks {
  website: string
  twitter: string
  instagram: string
  twitch: string
  youtube: string
  discord: string
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history' | 'settings' | 'achievements' | 'customize'>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    totalBoxesOpened: 0,
    totalCoinsSpent: 0,
    totalCoinsEarned: 0,
    totalValue: 0,
    totalItemsSold: 0,
    totalRevenue: 0,
    battlesWon: 0,
    battlesLost: 0,
    battlesPlayed: 0,
    battleWinRate: 0,
    totalBattleWinnings: 0,
    totalBattleLosses: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    totalExp: 0,
    currentLevelXP: 0,
    nextLevelXP: 100,
    inventoryCount: 0,
    uniqueItemsCount: 0,
    mostExpensiveItem: null,
    favoriteRarity: '',
    favoriteBox: '',
    mostOpenedBox: '',
    luckiestBox: '',
    joinDate: null,
    lastActivity: null,
    totalPlayTime: 0,
    globalRank: 0,
    countryRank: 0,
    levelRank: 0
  })

  const [formData, setFormData] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    location: '',
    birth_date: '',
    phone: '',
    website: ''
  })

  const [customization, setCustomization] = useState<ProfileCustomization>({
    theme_color: '#10b981',
    banner_url: '',
    badge_style: 'modern',
    show_stats: true,
    show_inventory: true,
    show_achievements: true,
    profile_privacy: 'public',
    avatar_frame: 'default',
    profile_title: '',
    custom_badge: '',
    banner_overlay: 'gradient',
    profile_effect: 'none',
    color_theme: 'indigo',
    // Nouvelles options Steam-like
    background_wallpaper: '',
    showcase_type: 'items',
    profile_layout: 'modern',
    animation_style: 'subtle',
    featured_badge: '',
    showcase_items: [],
    background_pattern: 'dots',
    card_style: 'glass'
  })

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    website: '',
    twitter: '',
    instagram: '',
    twitch: '',
    youtube: '',
    discord: ''
  })

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [battleHistory, setBattleHistory] = useState<any[]>([])
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user && profile) {
      loadUserStats()
      loadRecentActivity()
      loadBattleHistory()
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        location: profile.location || '',
        birth_date: profile.birth_date || '',
        phone: profile.phone || '',
        website: ''
      })

      if (profile.theme) {
        const themeData = profile.theme as any
        setCustomization({
          theme_color: themeData.theme_color || '#10b981',
          banner_url: themeData.banner_url || '',
          badge_style: themeData.badge_style || 'modern',
          show_stats: themeData.show_stats !== false,
          show_inventory: themeData.show_inventory !== false,
          show_achievements: themeData.show_achievements !== false,
          profile_privacy: (profile.privacy_profile as 'public' | 'friends' | 'private') || 'public',
          avatar_frame: themeData.avatar_frame || 'default',
          profile_title: themeData.profile_title || '',
          custom_badge: themeData.custom_badge || '',
          banner_overlay: themeData.banner_overlay || 'gradient',
          profile_effect: themeData.profile_effect || 'none',
          color_theme: themeData.color_theme || 'indigo'
        })

        // Load social links from theme
        if (themeData.social_links) {
          setSocialLinks(themeData.social_links)
        }
      }
    }
  }, [user, profile])

  const loadUserStats = async () => {
    try {
      setLoading(true)

      const { data: inventory } = await supabase
        .from('user_inventory')
        .select('*, items(*)')
        .eq('user_id', user?.id)

      const activeInventory = inventory?.filter(item => !item.is_sold) || []
      const soldItems = inventory?.filter(item => item.is_sold) || []

      const { data: battles } = await supabase
        .from('battle_participants')
        .select('*, battles(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, transaction_type')
        .eq('user_id', user?.id)

      const totalBoxesOpened = inventory?.length || 0
      const totalValue = activeInventory.reduce((sum, item) => sum + (item.items?.market_value || 0) * item.quantity, 0)
      const totalItemsSold = soldItems.length
      const totalRevenue = soldItems.reduce((sum, item) => sum + (item.items?.market_value || 0) * item.quantity, 0)

      const totalCoinsSpent = transactions
        ?.filter(t => t.transaction_type === 'purchase' || t.transaction_type === 'box_opening' || t.transaction_type === 'battle_entry')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0
      const totalCoinsEarned = transactions
        ?.filter(t => t.transaction_type === 'battle_win' || t.transaction_type === 'item_sale' || t.transaction_type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0) || 0

      const battlesPlayed = battles?.length || 0
      const battlesWon = battles?.filter(b => b.is_winner)?.length || 0
      const battlesLost = battlesPlayed - battlesWon
      const battleWinRate = battlesPlayed > 0 ? (battlesWon / battlesPlayed) * 100 : 0

      const totalBattleWinnings = battles
        ?.filter(b => b.is_winner)
        .reduce((sum, b) => sum + (b.battles?.entry_cost || 0), 0) || 0
      const totalBattleLosses = battles
        ?.filter(b => !b.is_winner)
        .reduce((sum, b) => sum + (b.battles?.entry_cost || 0), 0) || 0

      let currentWinStreak = 0
      let longestWinStreak = 0
      let tempStreak = 0

      battles?.forEach((battle, index) => {
        if (battle.is_winner) {
          tempStreak++
          if (index === 0) currentWinStreak = tempStreak
          longestWinStreak = Math.max(longestWinStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      })

      const mostExpensiveItem = activeInventory.reduce((max, item) =>
        (item.items?.market_value || 0) > (max?.items?.market_value || 0) ? item : max
      , activeInventory[0])

      const rarityCount: any = {}
      activeInventory.forEach(item => {
        const rarity = item.items?.rarity || 'common'
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1
      })
      const favoriteRarity = Object.entries(rarityCount).length > 0
        ? Object.entries(rarityCount).reduce((a: any, b: any) => a[1] > b[1] ? a : b)[0] as string
        : ''

      const boxCount: any = {}
      inventory?.forEach(item => {
        if (item.box_id) {
          boxCount[item.box_id] = (boxCount[item.box_id] || 0) + 1
        }
      })
      const mostOpenedBoxId = Object.entries(boxCount).length > 0
        ? Object.entries(boxCount).reduce((a: any, b: any) => a[1] > b[1] ? a : b)[0]
        : null

      let mostOpenedBox = ''
      let favoriteBox = ''
      let luckiestBox = ''

      if (mostOpenedBoxId) {
        const { data: boxData } = await supabase
          .from('loot_boxes')
          .select('name')
          .eq('id', mostOpenedBoxId)
          .single()

        if (boxData) {
          mostOpenedBox = boxData.name
          favoriteBox = boxData.name
        }
      }

      const boxValues: any = {}
      inventory?.forEach(item => {
        if (item.box_id) {
          if (!boxValues[item.box_id]) {
            boxValues[item.box_id] = { total: 0, count: 0, name: '' }
          }
          boxValues[item.box_id].total += item.items?.market_value || 0
          boxValues[item.box_id].count += 1
        }
      })

      let maxAvgValue = 0
      let luckiestBoxId = null
      Object.entries(boxValues).forEach(([boxId, data]: any) => {
        const avgValue = data.total / data.count
        if (avgValue > maxAvgValue) {
          maxAvgValue = avgValue
          luckiestBoxId = boxId
        }
      })

      if (luckiestBoxId) {
        const { data: luckyBoxData } = await supabase
          .from('loot_boxes')
          .select('name')
          .eq('id', luckiestBoxId)
          .single()

        if (luckyBoxData) {
          luckiestBox = luckyBoxData.name
        }
      }

      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, level, total_exp')
        .order('total_exp', { ascending: false })

      const globalRank = (allProfiles?.findIndex(p => p.id === user?.id) || 0) + 1
      const levelRank = (allProfiles?.filter(p => p.level >= (profile?.level || 1)).length || 0)

      setStats({
        totalBoxesOpened,
        totalCoinsSpent,
        totalCoinsEarned,
        totalValue,
        totalItemsSold,
        totalRevenue,
        battlesWon,
        battlesLost,
        battlesPlayed,
        battleWinRate,
        totalBattleWinnings,
        totalBattleLosses,
        longestWinStreak,
        currentWinStreak,
        currentStreak: profile?.consecutive_days || 0,
        longestStreak: profile?.longest_streak || 0,
        level: profile?.level || 1,
        totalExp: profile?.total_exp || 0,
        currentLevelXP: profile?.current_level_xp || 0,
        nextLevelXP: profile?.next_level_xp || 100,
        inventoryCount: activeInventory.length,
        uniqueItemsCount: new Set(activeInventory.map(i => i.items?.id)).size,
        mostExpensiveItem,
        favoriteRarity,
        favoriteBox,
        mostOpenedBox,
        luckiestBox,
        joinDate: profile?.created_at || null,
        lastActivity: profile?.last_activity || null,
        totalPlayTime: 0,
        globalRank,
        countryRank: 0,
        levelRank
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('user_inventory')
        .select('*, items(*)')
        .eq('user_id', user?.id)
        .order('obtained_at', { ascending: false })
        .limit(5)

      setRecentActivity(data || [])
    } catch (error) {
      console.error('Error loading activity:', error)
    }
  }

  const loadBattleHistory = async () => {
    try {
      const { data } = await supabase
        .from('battle_participants')
        .select('*, battles(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setBattleHistory(data || [])
    } catch (error) {
      console.error('Error loading battle history:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          location: formData.location,
          birth_date: formData.birth_date,
          phone: formData.phone
        })
        .eq('id', user?.id)

      if (error) throw error

      setNotification({ type: 'success', message: 'Profil mis à jour avec succès !' })
      setEditing(false)
      await refreshProfile()
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    } catch (error) {
      setNotification({ type: 'error', message: 'Erreur lors de la mise à jour' })
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploadingBanner(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/banner-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      setCustomization({ ...customization, banner_url: data.publicUrl })
      setNotification({ type: 'success', message: 'Bannière uploadée !' })
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    } catch (error: any) {
      setNotification({ type: 'error', message: 'Erreur lors de l\'upload' })
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploadingAvatar(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id)

      await refreshProfile()
      setNotification({ type: 'success', message: 'Avatar mis à jour !' })
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    } catch (error: any) {
      setNotification({ type: 'error', message: 'Erreur lors de l\'upload' })
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveCustomization = async () => {
    try {
      const themeData = {
        theme_color: customization.theme_color,
        banner_url: customization.banner_url || '',
        badge_style: customization.badge_style,
        show_stats: customization.show_stats,
        show_inventory: customization.show_inventory,
        show_achievements: customization.show_achievements,
        avatar_frame: customization.avatar_frame,
        profile_title: customization.profile_title || '',
        custom_badge: customization.custom_badge || '',
        banner_overlay: customization.banner_overlay,
        profile_effect: customization.profile_effect,
        color_theme: customization.color_theme,
        // Nouvelles propriétés Steam-like
        background_wallpaper: customization.background_wallpaper || '',
        showcase_type: customization.showcase_type || 'items',
        profile_layout: customization.profile_layout || 'modern',
        animation_style: customization.animation_style || 'subtle',
        featured_badge: customization.featured_badge || '',
        showcase_items: customization.showcase_items || [],
        background_pattern: customization.background_pattern || 'dots',
        card_style: customization.card_style || 'glass',
        social_links: socialLinks
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          theme: themeData,
          privacy_profile: customization.profile_privacy
        })
        .eq('id', user?.id)

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      setNotification({ type: 'success', message: 'Personnalisation enregistrée !' })
      await refreshProfile()
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    } catch (error: any) {
      console.error('Erreur complète:', error)
      setNotification({ type: 'error', message: error?.message || 'Erreur lors de la sauvegarde' })
      setTimeout(() => setNotification({ type: '', message: '' }), 3000)
    }
  }

  const calculateProgress = () => {
    return ((stats.currentLevelXP / stats.nextLevelXP) * 100).toFixed(0)
  }

  const getRarityColor = (rarity: string) => {
    const colors: any = {
      common: 'from-gray-500 to-gray-600',
      rare: 'from-blue-500 to-blue-600',
      epic: 'from-purple-500 to-purple-600',
      legendary: 'from-yellow-500 to-orange-600',
      mythic: 'from-red-500 to-pink-600'
    }
    return colors[rarity] || colors.common
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 pt-20 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'achievements', label: 'Succès', icon: Trophy },
    { id: 'customize', label: 'Personnalisation', icon: Palette },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ]

  const getAvatarFrameStyle = () => {
    const frames: any = {
      default: 'border-4 border-gray-300 dark:border-gray-600',
      indigo: 'border-4 border-indigo-500 shadow-lg shadow-indigo-500/50',
      gold: 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse',
      diamond: 'border-4 border-blue-500 shadow-lg shadow-blue-500/50',
      ruby: 'border-4 border-red-500 shadow-lg shadow-red-500/50',
      rainbow: 'border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-1 animate-spin-slow',
      cosmic: 'border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 p-1 animate-pulse',
      neon: 'border-4 border-cyan-500 shadow-2xl shadow-cyan-500/80 animate-pulse',
      legendary: 'border-4 border-transparent bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-1',
      mythic: 'border-4 border-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 animate-pulse'
    }
    return frames[customization.avatar_frame] || frames.default
  }

  const getBannerOverlayStyle = () => {
    const overlays: any = {
      gradient: 'bg-gradient-to-t from-black/60 to-transparent',
      solid: 'bg-black/40',
      none: '',
      colorful: `bg-gradient-to-br from-${customization.theme_color.replace('#', '')}/30 to-transparent`
    }
    return overlays[customization.banner_overlay] || overlays.gradient
  }

  const getCardStyle = () => {
    const cardStyles: any = {
      glass: 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-2 border-indigo-500/20 dark:border-indigo-500/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/10',
      solid: 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl',
      gradient: 'bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-2 border-indigo-500/20 dark:border-indigo-500/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/10'
    }
    return cardStyles[customization.card_style || 'solid'] || cardStyles.solid
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 relative">
      <ParticlesBackground />

      {/* Custom Background Wallpaper */}
      {customization.background_wallpaper && (
        <div
          className="fixed inset-0 z-0 opacity-10 dark:opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${customization.background_wallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}

      {/* Background Pattern */}
      {customization.background_pattern && customization.background_pattern !== 'none' && (
        <div
          className="fixed inset-0 z-0 opacity-5 dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              customization.background_pattern === 'dots' ? 'radial-gradient(circle, #666 1px, transparent 1px)' :
              customization.background_pattern === 'grid' ? 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)' :
              customization.background_pattern === 'waves' ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, #666 10px, #666 11px)' :
              'none',
            backgroundSize: '20px 20px'
          }}
        />
      )}

      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-6 py-4 rounded-2xl shadow-2xl border-2 ${
              notification.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
            }`}
          >
            {notification.type === 'error' ? <AlertCircle className="h-6 w-6" /> : <CheckCircle className="h-6 w-6" />}
            <span className="font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Banner - Enhanced */}
      <div className="pt-16 relative z-10">
        {/* Compact Banner - Steam/Discord Style */}
        <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 overflow-hidden group">
          {/* Banner Image with Parallax */}
          {customization.banner_url ? (
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", type: "spring", stiffness: 100 }}
              src={customization.banner_url}
              alt="Profile Banner"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 group-hover:scale-110 transition-transform duration-700"
            />
          )}

          {/* Banner Overlay - Enhanced */}
          <div className={`absolute inset-0 ${getBannerOverlayStyle()}`} />

          {/* Profile Header Content */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                {/* Avatar with Level Badge - Enhanced */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.2
                  }}
                  whileHover={{ scale: 1.05 }}
                  className="relative flex-shrink-0"
                >
                  <div className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-xl sm:rounded-2xl overflow-hidden ${getAvatarFrameStyle()} bg-gray-900 shadow-2xl`}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                        <User className="h-14 w-14 sm:h-16 sm:w-16 text-white" />
                      </div>
                    )}
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl border-2 sm:border-4 border-gray-900 dark:border-gray-950"
                  >
                    <span className="text-white font-black text-base sm:text-lg md:text-xl">{stats.level}</span>
                  </motion.div>
                </motion.div>

                {/* User Info - Enhanced */}
                <div className="flex-1 pb-2 min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                    >
                      {profile?.username}
                    </motion.h1>
                    {customization.custom_badge && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
                        whileHover={{ scale: 1.1 }}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r ${
                          customization.custom_badge === 'vip' ? 'from-yellow-500 to-orange-500' :
                          customization.custom_badge === 'premium' ? 'from-purple-500 to-pink-500' :
                          customization.custom_badge === 'elite' ? 'from-indigo-500 to-green-600' :
                          customization.custom_badge === 'legend' ? 'from-orange-500 via-red-500 to-pink-600' :
                          customization.custom_badge === 'founder' ? 'from-indigo-500 to-purple-600' :
                          customization.custom_badge === 'verified' ? 'from-blue-500 to-blue-600' :
                          customization.custom_badge === 'staff' ? 'from-red-500 to-red-600' :
                          'from-blue-500 to-cyan-500'
                        } text-white font-bold text-sm sm:text-base uppercase shadow-xl`}
                      >
                        {customization.custom_badge}
                      </motion.div>
                    )}
                  </div>

                  {customization.profile_title && (
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.5 }}
                      className="text-base sm:text-lg font-semibold text-white/95 mb-2 drop-shadow-lg"
                    >
                      {customization.profile_title}
                    </motion.p>
                  )}

                  {/* Quick Stats & Social Links Row - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.6 }}
                    className="flex items-center gap-2 sm:gap-4 flex-wrap"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 text-white/95 flex-wrap">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.7 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-md rounded-lg shadow-lg border border-white/10"
                      >
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                        <span className="font-bold text-xs sm:text-sm">#{stats.globalRank}</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.75 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-md rounded-lg shadow-lg border border-white/10"
                      >
                        <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400" />
                        <span className="font-bold text-xs sm:text-sm">{stats.currentStreak}j</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-md rounded-lg shadow-lg border border-white/10"
                      >
                        <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                        <span className="font-bold text-xs sm:text-sm">{(profile?.virtual_currency || 0).toLocaleString()}</span>
                      </motion.div>
                    </div>

                    {/* Social Links */}
                    {(profile?.theme as any)?.social_links && (
                      <div className="flex items-center gap-2">
                        {(profile?.theme as any)?.social_links?.twitter && (
                          <a
                            href={`https://twitter.com/${(profile?.theme as any)?.social_links?.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg hover:bg-blue-500 transition-colors"
                          >
                            <Twitter className="h-4 w-4 text-white" />
                          </a>
                        )}
                        {(profile?.theme as any)?.social_links?.twitch && (
                          <a
                            href={`https://twitch.tv/${(profile?.theme as any)?.social_links?.twitch}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg hover:bg-purple-500 transition-colors"
                          >
                            <Twitch className="h-4 w-4 text-white" />
                          </a>
                        )}
                        {(profile?.theme as any)?.social_links?.youtube && (
                          <a
                            href={(profile?.theme as any)?.social_links?.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg hover:bg-red-500 transition-colors"
                          >
                            <Youtube className="h-4 w-4 text-white" />
                          </a>
                        )}
                        {(profile?.theme as any)?.social_links?.website && (
                          <a
                            href={(profile?.theme as any)?.social_links?.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg hover:bg-indigo-500 transition-colors"
                          >
                            <Globe className="h-4 w-4 text-white" />
                          </a>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Enhanced */}
        <div className="border-b-2 border-indigo-500/20 dark:border-indigo-500/10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl sticky top-16 z-40 shadow-2xl shadow-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <nav className="flex gap-2 overflow-x-auto scrollbar-hide">
              {sidebarItems.map((item, idx) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.08,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    whileHover={{ y: -2 }}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`relative flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 md:px-7 py-3 sm:py-4 font-bold transition-all border-b-2 whitespace-nowrap group ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-xs sm:text-sm md:text-base hidden sm:inline">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-t-xl"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* LEFT SIDEBAR - Steam/Discord Style */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Level Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={getCardStyle()}
                  >
                    <div className="relative">
                      {/* Circular Level Progress */}
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="url(#gradient)"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 56}`}
                              strokeDashoffset={`${2 * Math.PI * 56 * (1 - parseFloat(calculateProgress()) / 100)}`}
                              className="transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="50%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Crown className="h-8 w-8 text-yellow-500 mb-1" />
                            <span className="text-3xl font-black text-gray-900 dark:text-white">{stats.level}</span>
                          </div>
                        </div>
                      </div>

                      {/* XP Progress */}
                      <div className="text-center mb-4">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          {stats.currentLevelXP} / {stats.nextLevelXP} XP
                        </p>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateProgress()}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {100 - parseFloat(calculateProgress())}% jusqu'au niveau {stats.level + 1}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick Stats Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={getCardStyle()}
                  >
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
                      Statistiques
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Boxes Ouverts', value: stats.totalBoxesOpened, icon: Box, color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Battles Joués', value: stats.battlesPlayed, icon: Swords, color: 'text-purple-600 dark:text-purple-400' },
                        { label: 'Win Rate', value: `${stats.battleWinRate.toFixed(1)}%`, icon: Trophy, color: 'text-yellow-600 dark:text-yellow-400' },
                        { label: 'Items Possédés', value: stats.inventoryCount, icon: Package, color: 'text-indigo-600 dark:text-indigo-400' },
                      ].map((stat, idx) => {
                        const Icon = stat.icon
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.08 }}
                            whileHover={{ x: 4 }}
                            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-all group border border-transparent hover:border-indigo-500/20"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${stat.color} group-hover:scale-110 transition-transform`} />
                              <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">{stat.label}</span>
                            </div>
                            <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white group-hover:scale-110 transition-transform">{stat.value}</span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Badges Card */}
                  {customization.custom_badge && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={getCardStyle()}
                    >
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Badges
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${
                          customization.custom_badge === 'vip' ? 'from-yellow-500 to-orange-500' :
                          customization.custom_badge === 'premium' ? 'from-purple-500 to-pink-500' :
                          customization.custom_badge === 'elite' ? 'from-indigo-500 to-green-600' :
                          customization.custom_badge === 'legend' ? 'from-orange-500 via-red-500 to-pink-600' :
                          customization.custom_badge === 'founder' ? 'from-indigo-500 to-purple-600' :
                          customization.custom_badge === 'verified' ? 'from-blue-500 to-blue-600' :
                          customization.custom_badge === 'staff' ? 'from-red-500 to-red-600' :
                          'from-blue-500 to-cyan-500'
                        } text-white font-bold text-sm uppercase shadow-lg`}>
                          {customization.custom_badge}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Member Since */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={getCardStyle()}
                  >
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-500">Membre depuis</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {stats.joinDate ? new Date(stats.joinDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : 'Récemment'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* RIGHT MAIN CONTENT - Steam/Discord Style */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Customizable Showcase Section */}
                  {customization.showcase_type && customization.showcase_type !== 'none' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className={getCardStyle()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                          <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-500" />
                          {customization.showcase_type === 'items' && 'Items en Vitrine'}
                          {customization.showcase_type === 'achievements' && 'Succès'}
                          {customization.showcase_type === 'stats' && 'Statistiques Détaillées'}
                          {customization.showcase_type === 'recent_activity' && 'Activité Récente'}
                        </h2>
                      </div>

                      {/* Items Showcase */}
                      {customization.showcase_type === 'items' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                          {recentActivity.slice(0, 8).map((activity, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{
                                delay: idx * 0.08,
                                type: "spring",
                                stiffness: 300,
                                damping: 25
                              }}
                              whileHover={{ y: -8, scale: 1.05 }}
                              className="relative group cursor-pointer"
                            >
                              <div className="aspect-square rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-4 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all shadow-lg hover:shadow-2xl">
                                <img
                                  src={activity.items?.image_url}
                                  alt={activity.items?.name}
                                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className={`absolute -top-2 -right-2 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-r ${getRarityColor(activity.items?.rarity)} flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-bold text-xs">{activity.items?.rarity?.charAt(0).toUpperCase()}</span>
                              </div>
                              <p className="mt-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-white text-center truncate">{activity.items?.name}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Stats Showcase */}
                      {customization.showcase_type === 'stats' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                          {[
                            { label: 'Total Boxes', value: stats.totalBoxesOpened, icon: Box, gradient: 'from-blue-500 to-cyan-500' },
                            { label: 'Victoires', value: stats.battlesWon, icon: Trophy, gradient: 'from-yellow-500 to-orange-500' },
                            { label: 'Win Streak', value: stats.longestWinStreak, icon: Flame, gradient: 'from-orange-500 to-red-500' },
                            { label: 'Items Uniques', value: stats.uniqueItemsCount, icon: Star, gradient: 'from-purple-500 to-pink-500' },
                            { label: 'Coins Gagnés', value: stats.totalCoinsEarned.toLocaleString(), icon: Coins, gradient: 'from-yellow-500 to-yellow-600' },
                            { label: 'Battles Joués', value: stats.battlesPlayed, icon: Swords, gradient: 'from-indigo-500 to-green-600' },
                          ].map((stat, idx) => {
                            const Icon = stat.icon
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: idx * 0.08,
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 25
                                }}
                                whileHover={{ y: -4, scale: 1.05 }}
                                className="relative p-5 sm:p-6 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden group hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-all border border-transparent hover:border-indigo-500/20"
                              >
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                                </div>
                                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                                <div className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">{stat.label}</div>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}

                      {/* Recent Activity Showcase */}
                      {customization.showcase_type === 'recent_activity' && (
                        <div className="space-y-3">
                          {recentActivity.slice(0, 8).map((activity, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                            >
                              <img
                                src={activity.items?.image_url}
                                alt={activity.items?.name}
                                className="w-16 h-16 object-contain rounded-lg bg-white dark:bg-gray-700 group-hover:scale-110 transition-transform"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 dark:text-white truncate">{activity.items?.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Obtenu le {new Date(activity.obtained_at).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                              <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${getRarityColor(activity.items?.rarity)} text-white font-bold text-sm capitalize shadow-lg`}>
                                {activity.items?.rarity}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Achievements Showcase - Placeholder */}
                      {customization.showcase_type === 'achievements' && (
                        <div className="text-center py-12">
                          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-semibold">Système de succès à venir</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Performance Overview */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={getCardStyle()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <LineChart className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-indigo-500" />
                        Performance
                      </h2>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          <span>Battles Gagnés vs Perdus</span>
                          <span>{stats.battlesWon} / {stats.battlesLost}</span>
                        </div>
                        <div className="flex h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-500 to-green-600" style={{ width: `${stats.battleWinRate}%` }} />
                          <div className="bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${100 - stats.battleWinRate}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.currentWinStreak}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Série actuelle</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{stats.longestWinStreak}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Meilleure série</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.uniqueItemsCount}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1">Items uniques</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Most Expensive Item & Battle History */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Most Expensive Item */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={getCardStyle()}
                    >
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                        Item le Plus Cher
                      </h3>
                      {stats.mostExpensiveItem ? (
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center p-3">
                              <img
                                src={stats.mostExpensiveItem.items?.image_url}
                                alt={stats.mostExpensiveItem.items?.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-lg bg-gradient-to-r ${getRarityColor(stats.mostExpensiveItem.items?.rarity)} text-white font-bold text-xs capitalize shadow-lg`}>
                              {stats.mostExpensiveItem.items?.rarity}
                            </div>
                          </div>
                          <div className="font-bold text-gray-900 dark:text-white mb-2">{stats.mostExpensiveItem.items?.name}</div>
                          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">
                            {stats.mostExpensiveItem.items?.market_value?.toLocaleString()} coins
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun item</p>
                      )}
                    </motion.div>

                    {/* Battle History */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={getCardStyle()}
                    >
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Swords className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                        Dernières Battles
                      </h3>
                      <div className="space-y-2">
                        {battleHistory.slice(0, 5).map((battle, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${battle.is_winner ? 'bg-indigo-500' : 'bg-red-500'}`}>
                              {battle.is_winner ? (
                                <Trophy className="h-4 w-4 text-white" />
                              ) : (
                                <X className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                {battle.is_winner ? 'Victoire' : 'Défaite'}
                              </div>
                            </div>
                            <div className={`font-bold text-xs ${battle.is_winner ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                              {battle.is_winner ? '+' : '-'}{battle.battles?.entry_cost?.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-8"
                >
                  Statistiques Détaillées
                </motion.h1>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {/* Boxes & Items */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                    className={getCardStyle()}
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Box className="h-6 w-6 text-blue-500" />
                      Boxes & Items
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Boxes ouverts', value: stats.totalBoxesOpened },
                        { label: 'Items possédés', value: stats.inventoryCount },
                        { label: 'Items uniques', value: stats.uniqueItemsCount },
                        { label: 'Items vendus', value: stats.totalItemsSold },
                        { label: 'Valeur totale', value: `${stats.totalValue.toLocaleString()} coins` },
                        { label: 'Box préférée', value: stats.favoriteBox || 'N/A' },
                        { label: 'Box chanceuse', value: stats.luckiestBox || 'N/A' }
                      ].map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">{stat.label}</span>
                          <span className="font-black text-gray-900 dark:text-white">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Battles */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                    className={getCardStyle()}
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Swords className="h-6 w-6 text-purple-500" />
                      Battles
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Parties jouées', value: stats.battlesPlayed },
                        { label: 'Victoires', value: stats.battlesWon, color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Défaites', value: stats.battlesLost, color: 'text-red-600 dark:text-red-400' },
                        { label: 'Win Rate', value: `${stats.battleWinRate.toFixed(1)}%`, color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Série actuelle', value: `${stats.currentWinStreak} victoires` },
                        { label: 'Meilleure série', value: `${stats.longestWinStreak} victoires` },
                        { label: 'Gains', value: `${stats.totalBattleWinnings.toLocaleString()} coins`, color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Pertes', value: `${stats.totalBattleLosses.toLocaleString()} coins`, color: 'text-red-600 dark:text-red-400' }
                      ].map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">{stat.label}</span>
                          <span className={`font-black ${stat.color || 'text-gray-900 dark:text-white'}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Finances */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                    className={getCardStyle()}
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <DollarSign className="h-6 w-6 text-yellow-500" />
                      Finances
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Coins dépensés', value: `${stats.totalCoinsSpent.toLocaleString()} coins`, color: 'text-red-600 dark:text-red-400' },
                        { label: 'Coins gagnés', value: `${stats.totalCoinsEarned.toLocaleString()} coins`, color: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Bilan', value: `${(stats.totalCoinsEarned - stats.totalCoinsSpent).toLocaleString()} coins`, color: stats.totalCoinsEarned >= stats.totalCoinsSpent ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400' },
                        { label: 'Balance actuelle', value: `${(profile?.virtual_currency || 0).toLocaleString()} coins`, color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Revenus ventes', value: `${stats.totalRevenue.toLocaleString()} coins` },
                        { label: 'Valeur inventaire', value: `${stats.totalValue.toLocaleString()} coins` }
                      ].map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">{stat.label}</span>
                          <span className={`font-black ${stat.color || 'text-gray-900 dark:text-white'}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Progression */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                    className={getCardStyle()}
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-indigo-500" />
                      Progression
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Niveau actuel', value: stats.level },
                        { label: 'XP total', value: stats.totalExp.toLocaleString() },
                        { label: 'XP niveau actuel', value: `${stats.currentLevelXP} / ${stats.nextLevelXP}` },
                        { label: 'Progression', value: `${calculateProgress()}%` },
                        { label: 'Rang global', value: `#${stats.globalRank}`, color: 'text-yellow-600 dark:text-yellow-400' },
                        { label: 'Rang par niveau', value: `Top ${stats.levelRank}`, color: 'text-blue-600 dark:text-blue-400' }
                      ].map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">{stat.label}</span>
                          <span className={`font-black ${stat.color || 'text-gray-900 dark:text-white'}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Activity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                    className={getCardStyle()}
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Flame className="h-6 w-6 text-orange-500" />
                      Activité
                    </h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Série actuelle', value: `${stats.currentStreak} jours` },
                        { label: 'Meilleure série', value: `${stats.longestStreak} jours` },
                        { label: 'Dernière activité', value: stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'N/A' },
                        { label: 'Membre depuis', value: stats.joinDate ? new Date(stats.joinDate).toLocaleDateString() : 'N/A' }
                      ].map((stat, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                          <span className="text-gray-600 dark:text-gray-400 font-semibold">{stat.label}</span>
                          <span className="font-black text-gray-900 dark:text-white">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Favorite Rarity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -4, scale: 1.05, transition: { duration: 0.2 } }}
                    className={`${getCardStyle()} flex flex-col items-center justify-center`}
                  >
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-purple-500" />
                      Rareté Favorite
                    </h2>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                      className={`inline-flex px-8 py-4 rounded-2xl bg-gradient-to-r ${getRarityColor(stats.favoriteRarity)} text-white font-black text-2xl sm:text-3xl capitalize shadow-2xl`}
                    >
                      {stats.favoriteRarity || 'Aucune'}
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-8">Historique</h1>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Items History */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Package className="h-6 w-6 text-blue-500" />
                      Items Récents
                    </h2>
                    <div className="space-y-4">
                      {recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all">
                          <img
                            src={activity.items?.image_url}
                            alt={activity.items?.name}
                            className="w-16 h-16 object-contain rounded-lg bg-white dark:bg-gray-700 shadow"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate">{activity.items?.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(activity.obtained_at).toLocaleString()}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getRarityColor(activity.items?.rarity)} text-white font-semibold text-sm capitalize shadow`}>
                            {activity.items?.rarity}
                          </div>
                          <div className="text-right">
                            <div className="font-black text-indigo-600 dark:text-indigo-400">
                              {activity.items?.market_value?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">coins</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Battle History */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Swords className="h-6 w-6 text-purple-500" />
                      Battles Récentes
                    </h2>
                    <div className="space-y-4">
                      {battleHistory.map((battle, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${battle.is_winner ? 'bg-gradient-to-br from-indigo-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                            {battle.is_winner ? (
                              <Trophy className="h-7 w-7 text-white" />
                            ) : (
                              <X className="h-7 w-7 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {battle.is_winner ? 'Victoire' : 'Défaite'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(battle.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${battle.battles?.battle_type === '1v1' ? 'text-blue-600' : battle.battles?.battle_type === '2v2' ? 'text-purple-600' : 'text-orange-600'}`}>
                              {battle.battles?.battle_type?.toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Mise: {battle.battles?.entry_cost?.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-black ${battle.is_winner ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                              {battle.is_winner ? '+' : '-'}{battle.battles?.entry_cost?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">coins</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white">Succès</h1>
                  <div className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                    <span className="text-white font-black text-lg">
                      {[
                        { unlocked: stats.totalBoxesOpened > 0 },
                        { unlocked: stats.totalBoxesOpened >= 10 },
                        { unlocked: stats.totalBoxesOpened >= 100 },
                        { unlocked: stats.battlesWon > 0 },
                        { unlocked: stats.battlesWon >= 25 },
                        { unlocked: stats.battlesWon >= 100 },
                        { unlocked: stats.inventoryCount >= 25 },
                        { unlocked: stats.inventoryCount >= 100 },
                        { unlocked: stats.currentStreak >= 7 },
                        { unlocked: stats.currentStreak >= 30 },
                        { unlocked: stats.level >= 25 },
                        { unlocked: stats.level >= 50 }
                      ].filter(a => a.unlocked).length} / 12 Débloqués
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[
                    { name: 'Premier Pas', desc: 'Ouvrir votre première box', icon: Gift, unlocked: stats.totalBoxesOpened > 0, progress: Math.min(stats.totalBoxesOpened, 1), max: 1 },
                    { name: 'Novice', desc: 'Ouvrir 10 boxes', icon: Box, unlocked: stats.totalBoxesOpened >= 10, progress: stats.totalBoxesOpened, max: 10 },
                    { name: 'Vétéran', desc: 'Ouvrir 100 boxes', icon: Package, unlocked: stats.totalBoxesOpened >= 100, progress: stats.totalBoxesOpened, max: 100 },
                    { name: 'Combattant', desc: 'Gagner votre première battle', icon: Sword, unlocked: stats.battlesWon > 0, progress: Math.min(stats.battlesWon, 1), max: 1 },
                    { name: 'Guerrier', desc: 'Gagner 25 battles', icon: Swords, unlocked: stats.battlesWon >= 25, progress: stats.battlesWon, max: 25 },
                    { name: 'Champion', desc: 'Gagner 100 battles', icon: Trophy, unlocked: stats.battlesWon >= 100, progress: stats.battlesWon, max: 100 },
                    { name: 'Collectionneur', desc: 'Posséder 25 items', icon: Package, unlocked: stats.inventoryCount >= 25, progress: stats.inventoryCount, max: 25 },
                    { name: 'Magnat', desc: 'Posséder 100 items', icon: ShoppingBag, unlocked: stats.inventoryCount >= 100, progress: stats.inventoryCount, max: 100 },
                    { name: 'Assidu', desc: 'Série de 7 jours', icon: Flame, unlocked: stats.currentStreak >= 7, progress: stats.currentStreak, max: 7 },
                    { name: 'Dévoué', desc: 'Série de 30 jours', icon: CalendarIcon, unlocked: stats.currentStreak >= 30, progress: stats.currentStreak, max: 30 },
                    { name: 'Maître', desc: 'Atteindre le niveau 25', icon: Crown, unlocked: stats.level >= 25, progress: stats.level, max: 25 },
                    { name: 'Légende', desc: 'Atteindre le niveau 50', icon: Sparkles, unlocked: stats.level >= 50, progress: stats.level, max: 50 }
                  ].map((achievement, index) => {
                    const Icon = achievement.icon
                    const progressPercent = Math.min((achievement.progress / achievement.max) * 100, 100)
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                          achievement.unlocked
                            ? 'bg-gradient-to-br from-indigo-50 to-green-50 dark:from-indigo-950/30 dark:to-green-950/30 border-indigo-500/50 shadow-lg'
                            : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 opacity-75'
                        }`}
                      >
                        {achievement.unlocked && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="h-6 w-6 text-indigo-500" />
                          </div>
                        )}
                        <div className={`w-16 h-16 rounded-2xl ${achievement.unlocked ? 'bg-gradient-to-br from-indigo-500 to-green-600 shadow-lg' : 'bg-gray-400'} flex items-center justify-center mb-4`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{achievement.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{achievement.desc}</p>
                        {!achievement.unlocked && (
                          <div>
                            <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              <span>Progression</span>
                              <span>{Math.min(achievement.progress, achievement.max)} / {achievement.max}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-green-600 transition-all"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* CUSTOMIZE TAB */}
            {activeTab === 'customize' && (
              <motion.div
                key="customize"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-8">Personnalisation</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Theme Colors */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Palette className="h-6 w-6 text-purple-500" />
                      Thème
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Couleur du thème</label>
                        <div className="grid grid-cols-6 gap-3">
                          {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                            <button
                              key={color}
                              onClick={() => setCustomization({ ...customization, theme_color: color })}
                              className={`w-full aspect-square rounded-2xl transition-all hover:scale-110 ${
                                customization.theme_color === color ? 'ring-4 ring-offset-4 ring-gray-400 dark:ring-gray-600 scale-110' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Visibilité du profil</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'public', label: 'Public', icon: Globe },
                            { value: 'friends', label: 'Amis', icon: Users },
                            { value: 'private', label: 'Privé', icon: Lock }
                          ].map(option => {
                            const Icon = option.icon
                            return (
                              <button
                                key={option.value}
                                onClick={() => setCustomization({ ...customization, profile_privacy: option.value as any })}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                  customization.profile_privacy === option.value
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                              >
                                <Icon className="h-6 w-6" />
                                <span className="text-sm font-semibold">{option.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          { key: 'show_stats', label: 'Afficher les statistiques publiquement' },
                          { key: 'show_inventory', label: 'Afficher l\'inventaire publiquement' },
                          { key: 'show_achievements', label: 'Afficher les succès publiquement' }
                        ].map(option => (
                          <label key={option.key} className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all">
                            <input
                              type="checkbox"
                              checked={customization[option.key as keyof ProfileCustomization] as boolean}
                              onChange={(e) => setCustomization({ ...customization, [option.key]: e.target.checked })}
                              className="w-6 h-6 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Color Themes & Effects */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-pink-500" />
                      Thèmes & Effets
                    </h2>

                    <div className="space-y-6">
                      {/* Preset Color Themes */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Thèmes de couleurs</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'indigo', label: 'Émeraude', colors: ['from-indigo-400', 'to-green-600'] },
                            { value: 'ocean', label: 'Océan', colors: ['from-blue-400', 'to-cyan-600'] },
                            { value: 'sunset', label: 'Coucher de soleil', colors: ['from-orange-400', 'to-pink-600'] },
                            { value: 'royal', label: 'Royal', colors: ['from-purple-400', 'to-indigo-600'] },
                            { value: 'fire', label: 'Feu', colors: ['from-red-400', 'to-orange-600'] },
                            { value: 'forest', label: 'Forêt', colors: ['from-green-400', 'to-violet-700'] }
                          ].map(theme => (
                            <button
                              key={theme.value}
                              onClick={() => setCustomization({ ...customization, color_theme: theme.value })}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                customization.color_theme === theme.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className={`w-full h-12 rounded-lg bg-gradient-to-r ${theme.colors[0]} ${theme.colors[1]} mb-2`} />
                              <span className="text-sm font-semibold block text-center">{theme.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Profile Effects */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Effets visuels</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'none', label: 'Aucun', icon: X },
                            { value: 'particles', label: 'Particules', icon: Sparkles },
                            { value: 'glow', label: 'Lueur', icon: Zap },
                            { value: 'animated', label: 'Animé', icon: Activity }
                          ].map(effect => {
                            const Icon = effect.icon
                            return (
                              <button
                                key={effect.value}
                                onClick={() => setCustomization({ ...customization, profile_effect: effect.value })}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                  customization.profile_effect === effect.value
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                              >
                                <Icon className="h-6 w-6" />
                                <span className="text-sm font-semibold">{effect.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profile Customization */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <User className="h-6 w-6 text-indigo-500" />
                      Personnalisation du Profil
                    </h2>

                    <div className="space-y-6">
                      {/* Profile Title */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Titre du profil
                        </label>
                        <input
                          type="text"
                          value={customization.profile_title}
                          onChange={(e) => setCustomization({ ...customization, profile_title: e.target.value })}
                          placeholder="Ex: Maître des Boxes, Chasseur de Légendes..."
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>

                      {/* Avatar Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Avatar</label>
                        <div className="flex items-center gap-4">
                          <div className={`relative w-24 h-24 rounded-2xl overflow-hidden ${getAvatarFrameStyle()}`}>
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                                <User className="h-12 w-12 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 cursor-pointer transition-all ${uploadingAvatar ? 'opacity-50' : ''}`}
                            >
                              {uploadingAvatar ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Upload className="h-5 w-5" />
                              )}
                              <span className="text-sm font-semibold">
                                {uploadingAvatar ? 'Upload en cours...' : 'Changer d\'avatar'}
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Avatar Frame */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Cadre d'avatar</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'default', label: 'Défaut', gradient: 'from-gray-400 to-gray-500' },
                            { value: 'indigo', label: 'Émeraude', gradient: 'from-indigo-400 to-violet-600' },
                            { value: 'gold', label: 'Or', gradient: 'from-yellow-400 to-yellow-600' },
                            { value: 'diamond', label: 'Diamant', gradient: 'from-blue-400 to-blue-600' },
                            { value: 'ruby', label: 'Rubis', gradient: 'from-red-400 to-red-600' },
                            { value: 'rainbow', label: 'Arc-en-ciel', gradient: 'from-red-500 via-yellow-500 to-purple-500' },
                            { value: 'cosmic', label: 'Cosmique', gradient: 'from-purple-500 via-pink-500 to-purple-500' },
                            { value: 'neon', label: 'Néon', gradient: 'from-cyan-400 to-cyan-600' },
                            { value: 'legendary', label: 'Légendaire', gradient: 'from-orange-500 via-red-500 to-pink-500' }
                          ].map(frame => (
                            <button
                              key={frame.value}
                              onClick={() => setCustomization({ ...customization, avatar_frame: frame.value })}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                customization.avatar_frame === frame.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className={`w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br ${frame.gradient} shadow-lg`} />
                              <span className="text-xs font-semibold">{frame.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Badge */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Badge personnalisé</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: '', label: 'Aucun', gradient: 'from-gray-400 to-gray-500' },
                            { value: 'vip', label: 'VIP', gradient: 'from-yellow-500 to-orange-500' },
                            { value: 'premium', label: 'Premium', gradient: 'from-purple-500 to-pink-500' },
                            { value: 'pro', label: 'Pro', gradient: 'from-blue-500 to-cyan-500' },
                            { value: 'elite', label: 'Elite', gradient: 'from-indigo-500 to-green-600' },
                            { value: 'legend', label: 'Legend', gradient: 'from-orange-500 via-red-500 to-pink-600' },
                            { value: 'founder', label: 'Founder', gradient: 'from-indigo-500 to-purple-600' },
                            { value: 'verified', label: 'Vérifié', gradient: 'from-blue-500 to-blue-600' },
                            { value: 'staff', label: 'Staff', gradient: 'from-red-500 to-red-600' }
                          ].map(badge => (
                            <button
                              key={badge.value}
                              onClick={() => setCustomization({ ...customization, custom_badge: badge.value })}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                customization.custom_badge === badge.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${badge.gradient} text-white font-bold text-xs uppercase mb-2`}>
                                {badge.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner & Overlay Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Banner */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Image className="h-6 w-6 text-pink-500" />
                      Bannière
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Upload de bannière
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                          id="banner-upload"
                        />
                        <label
                          htmlFor="banner-upload"
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 cursor-pointer transition-all w-full justify-center ${uploadingBanner ? 'opacity-50' : ''}`}
                        >
                          {uploadingBanner ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                          <span className="text-sm font-semibold">
                            {uploadingBanner ? 'Upload en cours...' : 'Uploader une image (recommandé: 1920x300px)'}
                          </span>
                        </label>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">ou</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          URL de la bannière
                        </label>
                        <input
                          type="url"
                          value={customization.banner_url}
                          onChange={(e) => setCustomization({ ...customization, banner_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Overlay de bannière</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'gradient', label: 'Dégradé' },
                            { value: 'solid', label: 'Solide' },
                            { value: 'colorful', label: 'Coloré' },
                            { value: 'none', label: 'Aucun' }
                          ].map(overlay => (
                            <button
                              key={overlay.value}
                              onClick={() => setCustomization({ ...customization, banner_overlay: overlay.value })}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                customization.banner_overlay === overlay.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <span className="text-sm font-semibold">{overlay.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preview */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Aperçu</label>
                        <div className="relative h-32 rounded-xl overflow-hidden">
                          {customization.banner_url ? (
                            <img src={customization.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500" />
                          )}
                          <div className={`absolute inset-0 ${getBannerOverlayStyle()}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <LinkIcon className="h-6 w-6 text-blue-500" />
                      Réseaux Sociaux
                    </h2>
                    <div className="space-y-4">
                      {[
                        { key: 'website', label: 'Site web', icon: Globe, placeholder: 'https://...' },
                        { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: '@username' },
                        { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
                        { key: 'twitch', label: 'Twitch', icon: Twitch, placeholder: 'username' },
                        { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'Channel URL' },
                        { key: 'discord', label: 'Discord', icon: Users, placeholder: 'username#0000' }
                      ].map(social => {
                        const Icon = social.icon
                        return (
                          <div key={social.key}>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {social.label}
                            </label>
                            <input
                              type="text"
                              value={socialLinks[social.key as keyof SocialLinks]}
                              onChange={(e) => setSocialLinks({ ...socialLinks, [social.key]: e.target.value })}
                              placeholder={social.placeholder}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Nouvelles options Steam-like */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Layout & Showcase */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Sliders className="h-6 w-6 text-blue-500" />
                      Mise en page & Vitrine
                    </h2>

                    <div className="space-y-6">
                      {/* Profile Layout */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Style de profil</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'classic', label: 'Classique', icon: '📋' },
                            { value: 'modern', label: 'Moderne', icon: '✨' },
                            { value: 'compact', label: 'Compact', icon: '📦' }
                          ].map(layout => (
                            <button
                              key={layout.value}
                              onClick={() => setCustomization({ ...customization, profile_layout: layout.value as any })}
                              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                customization.profile_layout === layout.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <span className="text-2xl">{layout.icon}</span>
                              <span className="text-sm font-semibold">{layout.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Showcase Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Section mise en avant</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'items', label: 'Items Favoris', icon: Package },
                            { value: 'achievements', label: 'Succès', icon: Trophy },
                            { value: 'stats', label: 'Statistiques', icon: BarChart3 },
                            { value: 'recent_activity', label: 'Activité Récente', icon: Activity },
                            { value: 'none', label: 'Aucun', icon: X }
                          ].map(showcase => {
                            const Icon = showcase.icon
                            return (
                              <button
                                key={showcase.value}
                                onClick={() => setCustomization({ ...customization, showcase_type: showcase.value as any })}
                                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                                  customization.showcase_type === showcase.value
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="text-sm font-semibold">{showcase.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Animation Style */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Style d'animation</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'subtle', label: 'Subtile', icon: '🌊' },
                            { value: 'dynamic', label: 'Dynamique', icon: '⚡' },
                            { value: 'none', label: 'Aucune', icon: '🚫' }
                          ].map(anim => (
                            <button
                              key={anim.value}
                              onClick={() => setCustomization({ ...customization, animation_style: anim.value as any })}
                              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                customization.animation_style === anim.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <span className="text-2xl">{anim.icon}</span>
                              <span className="text-sm font-semibold">{anim.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Background & Style */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Image className="h-6 w-6 text-indigo-500" />
                      Fond & Style
                    </h2>

                    <div className="space-y-6">
                      {/* Background Pattern */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Motif d'arrière-plan</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'dots', label: 'Points', pattern: 'radial-gradient(circle, #666 1px, transparent 1px)' },
                            { value: 'grid', label: 'Grille', pattern: 'linear-gradient(#666 1px, transparent 1px), linear-gradient(90deg, #666 1px, transparent 1px)' },
                            { value: 'waves', label: 'Vagues', pattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #666 10px, #666 11px)' },
                            { value: 'none', label: 'Aucun', pattern: 'none' }
                          ].map(pattern => (
                            <button
                              key={pattern.value}
                              onClick={() => setCustomization({ ...customization, background_pattern: pattern.value as any })}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                customization.background_pattern === pattern.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <div
                                className="w-full h-12 rounded-lg mb-2 bg-gray-200 dark:bg-gray-700"
                                style={{ backgroundImage: pattern.pattern, backgroundSize: pattern.value === 'grid' ? '20px 20px' : '20px 20px', opacity: 0.5 }}
                              />
                              <span className="text-sm font-semibold block text-center">{pattern.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Card Style */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Style des cartes</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'glass', label: 'Verre', icon: '🔮' },
                            { value: 'solid', label: 'Solide', icon: '🎯' },
                            { value: 'gradient', label: 'Dégradé', icon: '🌈' }
                          ].map(card => (
                            <button
                              key={card.value}
                              onClick={() => setCustomization({ ...customization, card_style: card.value as any })}
                              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                customization.card_style === card.value
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <span className="text-2xl">{card.icon}</span>
                              <span className="text-sm font-semibold">{card.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Background Wallpaper Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Fond d'écran personnalisé
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file && user) {
                              setUploadingBanner(true)
                              try {
                                const fileExt = file.name.split('.').pop()
                                const fileName = `${user.id}/wallpaper-${Date.now()}.${fileExt}`
                                const { error: uploadError } = await supabase.storage
                                  .from('profile-images')
                                  .upload(fileName, file)

                                if (uploadError) throw uploadError

                                const { data: { publicUrl } } = supabase.storage
                                  .from('profile-images')
                                  .getPublicUrl(fileName)

                                setCustomization({ ...customization, background_wallpaper: publicUrl })
                                setNotification({ type: 'success', message: 'Fond d\'écran uploadé !' })
                                setTimeout(() => setNotification({ type: '', message: '' }), 3000)
                              } catch (error) {
                                setNotification({ type: 'error', message: 'Erreur lors de l\'upload' })
                                setTimeout(() => setNotification({ type: '', message: '' }), 3000)
                              } finally {
                                setUploadingBanner(false)
                              }
                            }
                          }}
                          className="hidden"
                          id="wallpaper-upload"
                        />
                        <label
                          htmlFor="wallpaper-upload"
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500 cursor-pointer transition-all ${uploadingBanner ? 'opacity-50' : ''}`}
                        >
                          {uploadingBanner ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                          <span className="text-sm font-semibold">
                            {customization.background_wallpaper ? 'Changer le fond' : 'Upload fond d\'écran'}
                          </span>
                        </label>
                        {customization.background_wallpaper && (
                          <div className="mt-2 relative">
                            <img
                              src={customization.background_wallpaper}
                              alt="Wallpaper preview"
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setCustomization({ ...customization, background_wallpaper: '' })}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveCustomization}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-2xl flex items-center gap-2"
                  >
                    <Save className="h-6 w-6" />
                    Enregistrer la Personnalisation
                  </button>
                </div>
              </motion.div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="space-y-6"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8">Paramètres du Compte</h1>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border-2 border-indigo-500/20 dark:border-indigo-500/10 shadow-2xl shadow-black/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 transition-all"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Nom d'utilisateur</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </motion.div>
                    <motion.div
                      className="md:col-span-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                        rows={4}
                        placeholder="Parlez-nous de vous..."
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">Localisation</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Paris, France"
                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </motion.div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date de naissance</label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Site web</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-2xl flex items-center gap-2"
                  >
                    <Save className="h-6 w-6" />
                    Enregistrer les Modifications
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
