'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'
import {
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Trophy,
  BarChart3,
  Zap,
  Loader,
  Target,
  Award,
  LineChart,
  Settings,
  Crown,
  Medal,
  Gem,
  Flame,
  Wallet,
  TrendingUp,
  MousePointerClick,
  Star
} from 'lucide-react'

// Import des composants modulaires
import AffiliateOverview from '@/app/components/affiliate/AffiliateOverview'
import AffiliateReferrals from '@/app/components/affiliate/AffiliateReferrals'
import AffiliateAnalytics from '@/app/components/affiliate/AffiliateAnalytics'
import AffiliateSettings from '@/app/components/affiliate/AffiliateSettings'
import ParticlesBackground from '@/app/components/affiliate/ParticlesBackground'
import type { AffiliateProfile, ReferralData, AffiliateTier } from '@/app/components/affiliate/types'

export default function AffiliatePage(): JSX.Element | null {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()

  // États principaux
  const [affiliateProfile, setAffiliateProfile] = useState<AffiliateProfile | null>(null)
  const [referrals, setReferrals] = useState<ReferralData[]>([])

  // États UI
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [copyLoading, setCopyLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'analytics' | 'settings'>('overview')
  const [claimLoading, setClaimLoading] = useState(false)

  // Configuration des niveaux d'affiliation
  const affiliateTiers: AffiliateTier[] = [
    { level: 1, name: "Rookie", commission: 0.01, color: "from-gray-400 to-gray-600", icon: Users, requirement: 0, bonus: 5 },
    { level: 2, name: "Explorer", commission: 0.02, color: "from-green-400 to-green-600", icon: Target, requirement: 5, bonus: 10 },
    { level: 3, name: "Adventurer", commission: 0.03, color: "from-blue-400 to-blue-600", icon: Zap, requirement: 15, bonus: 15 },
    { level: 4, name: "Hunter", commission: 0.04, color: "from-purple-400 to-purple-600", icon: Award, requirement: 30, bonus: 20 },
    { level: 5, name: "Elite", commission: 0.05, color: "from-indigo-400 to-indigo-600", icon: Medal, requirement: 50, bonus: 25 },
    { level: 6, name: "Master", commission: 0.06, color: "from-pink-400 to-pink-600", icon: Crown, requirement: 75, bonus: 30 },
    { level: 7, name: "Champion", commission: 0.07, color: "from-red-400 to-red-600", icon: Trophy, requirement: 100, bonus: 40 },
    { level: 8, name: "Legend", commission: 0.08, color: "from-yellow-400 to-yellow-600", icon: Star, requirement: 150, bonus: 50 },
    { level: 9, name: "Mythic", commission: 0.09, color: "from-orange-400 to-orange-600", icon: Flame, requirement: 200, bonus: 75 },
    { level: 10, name: "Divine", commission: 0.10, color: "from-purple-500 via-pink-500 to-red-500", icon: Gem, requirement: 300, bonus: 100 }
  ]

  const showNotification = (type: string, message: string): void => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 4000)
  }

  // Générer un code par défaut basé sur le username
  const generateDefaultCode = (username?: string): string => {
    if (username && username.length >= 3) {
      const timestamp = Date.now().toString().slice(-4)
      return `${username.slice(0, 4).toUpperCase()}${timestamp}`
    }
    return `USER${Date.now().toString().slice(-6)}`
  }

  // Créer un profil d'affilié
  const createAffiliateProfile = async (userId: string, username?: string): Promise<AffiliateProfile> => {
    try {
      const supabase = createClient()
      const defaultCode = generateDefaultCode(username)

      const { data, error } = await supabase
        .from('affiliate_profiles')
        .insert({
          user_id: userId,
          affiliate_code: defaultCode,
          custom_share_message: `Découvre ReveelBox avec mon code ${defaultCode} ! La meilleure plateforme d'unboxing avec des objets réels !`,
          total_earnings: 0,
          pending_earnings: 0,
          claimed_earnings: 0,
          referrals_count: 0,
          clicks_count: 0,
          conversions_count: 0,
          tier_level: 1,
          tier_name: affiliateTiers[0].name,
          commission_rate: affiliateTiers[0].commission,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur création profil:', error)
      throw error
    }
  }

  // Charger le profil d'affilié
  const loadAffiliateProfile = async (userId: string): Promise<void> => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement profil:', error)
      }

      if (!data) {
        const newProfile = await createAffiliateProfile(userId, profile?.username)
        setAffiliateProfile(newProfile)
      } else {
        setAffiliateProfile(data)
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error)
    }
  }

  // Charger les parrainages
  const loadReferrals = async (userId: string): Promise<void> => {
    try {
      const supabase = createClient()

      // Fetch referrals without join (workaround for missing foreign key)
      const { data: referralsData, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false })

      if (referralsError) {
        console.error('Erreur chargement parrainages:', referralsError)
        setReferrals([])
        return
      }

      // Fetch profiles separately
      if (referralsData && referralsData.length > 0) {
        const userIds = [...new Set(referralsData.map(ref => ref.referred_user_id).filter(Boolean))]

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds)

          // Join in memory
          const profilesMap = new Map()
          if (profilesData) {
            profilesData.forEach(p => profilesMap.set(p.id, p))
          }

          const referralsWithProfiles = referralsData.map(ref => ({
            ...ref,
            profiles: profilesMap.get(ref.referred_user_id) || null
          }))

          setReferrals(referralsWithProfiles)
        } else {
          setReferrals(referralsData)
        }
      } else {
        setReferrals([])
      }
    } catch (error) {
      console.error('Erreur chargement parrainages:', error)
      setReferrals([])
    }
  }

  // Charger toutes les données
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadAllData()
    }
  }, [authLoading, isAuthenticated, user])

  const loadAllData = async (): Promise<void> => {
    try {
      setLoading(true)
      if (!user) throw new Error('Utilisateur non authentifié')

      await loadAffiliateProfile(user.id)
      await loadReferrals(user.id)
    } catch (error) {
      console.error('Erreur chargement données:', error)
      showNotification('error', 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  // Vérifier la disponibilité d'un code
  const checkCodeAvailability = async (code: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select('affiliate_code')
        .eq('affiliate_code', code.toUpperCase())
        .maybeSingle()

      if (error) {
        console.error('Erreur vérification code:', error)
        return false
      }

      return !data
    } catch (error) {
      console.error('Erreur vérification code:', error)
      return false
    }
  }

  // Mettre à jour le code d'affiliation
  const updateAffiliateCode = async (newCode: string): Promise<void> => {
    if (!affiliateProfile || !user) return

    try {
      const isAvailable = await checkCodeAvailability(newCode)
      if (!isAvailable) {
        showNotification('error', 'Ce code est déjà utilisé')
        return
      }

      const supabase = createClient()
      const { error } = await supabase
        .from('affiliate_profiles')
        .update({
          affiliate_code: newCode.toUpperCase(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setAffiliateProfile(prev => prev ? {
        ...prev,
        affiliate_code: newCode.toUpperCase(),
        updated_at: new Date().toISOString()
      } : null)

      showNotification('success', 'Code d\'affiliation mis à jour !')
    } catch (error) {
      console.error('Erreur mise à jour code:', error)
      showNotification('error', 'Erreur lors de la mise à jour du code')
    }
  }

  // Mettre à jour le message personnalisé
  const updateCustomMessage = async (newMessage: string): Promise<void> => {
    if (!affiliateProfile || !user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('affiliate_profiles')
        .update({
          custom_share_message: newMessage,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setAffiliateProfile(prev => prev ? {
        ...prev,
        custom_share_message: newMessage,
        updated_at: new Date().toISOString()
      } : null)

      showNotification('success', 'Message personnalisé mis à jour !')
    } catch (error) {
      console.error('Erreur mise à jour message:', error)
      showNotification('error', 'Erreur lors de la mise à jour du message')
    }
  }

  // Réclamer les gains
  const claimEarnings = async (amount: number): Promise<void> => {
    if (!affiliateProfile || !user) return

    try {
      setClaimLoading(true)

      if (amount < 50) {
        showNotification('error', 'Montant minimum: 50€')
        return
      }

      if (amount > affiliateProfile.pending_earnings) {
        showNotification('error', 'Montant insuffisant')
        return
      }

      const supabase = createClient()

      // Créer une demande de paiement
      const { error: payoutError } = await supabase
        .from('affiliate_payouts')
        .insert({
          user_id: user.id,
          amount: amount,
          method: 'bank_transfer',
          status: 'pending'
        })

      if (payoutError) throw payoutError

      // Mettre à jour le profil
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .update({
          pending_earnings: affiliateProfile.pending_earnings - amount,
          claimed_earnings: affiliateProfile.claimed_earnings + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setAffiliateProfile(data)
      showNotification('success', `Demande de retrait de ${amount}€ envoyée !`)
    } catch (error) {
      console.error('Erreur réclamation gains:', error)
      showNotification('error', 'Erreur lors de la réclamation')
    } finally {
      setClaimLoading(false)
    }
  }

  // Copier le lien d'affiliation
  const copyAffiliateLink = async (): Promise<void> => {
    if (!affiliateProfile) return

    setCopyLoading(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.vercel.app'
      const link = `${baseUrl}/r/${affiliateProfile.affiliate_code}`

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = link
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
        } catch (err) {
          console.error('Fallback copy failed:', err)
        }
        document.body.removeChild(textArea)
      }

      showNotification('success', 'Lien d\'affiliation copié !')
    } catch (error) {
      console.error('Copy error:', error)
      showNotification('error', 'Erreur lors de la copie du lien')
    } finally {
      setCopyLoading(false)
    }
  }

  // Partager sur les réseaux sociaux
  const shareOnSocial = (platform: string): void => {
    if (!affiliateProfile) return

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.vercel.app'
    const link = `${baseUrl}/r/${affiliateProfile.affiliate_code}`
    const message = affiliateProfile.custom_share_message || `Découvre ReveelBox avec mon code ${affiliateProfile.affiliate_code} !`

    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}&hashtags=ReveelBox,Unboxing,Gaming`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(message)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + link)}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
        break
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(message)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  // Calculer les métriques
  const conversionRate = affiliateProfile?.clicks_count && affiliateProfile.clicks_count > 0
    ? ((affiliateProfile.conversions_count / affiliateProfile.clicks_count) * 100).toFixed(1)
    : '0.0'

  // Auth check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 pt-20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="h-20 w-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Connexion requise
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Vous devez être connecté pour accéder à votre espace affilié
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Se connecter
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!affiliateProfile) {
    return null
  }

  const currentTier = affiliateTiers.find(tier => tier.level === affiliateProfile.tier_level) || affiliateTiers[0]
  const nextTier = affiliateTiers.find(tier => tier.level === (currentTier.level + 1))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 relative">
      {/* Particles Background */}
      <ParticlesBackground />

      {/* Notifications */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`fixed top-24 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
              notification.type === 'error'
                ? 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                : 'hybrid-badge-success'
            }`}
            style={notification.type !== 'error' ? {
              backgroundColor: 'var(--hybrid-success-bg)',
              borderColor: 'var(--hybrid-success-border)',
              color: 'var(--hybrid-success)'
            } : {}}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="h-6 w-6" />
            ) : (
              <CheckCircle className="h-6 w-6" />
            )}
            <span className="text-sm font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Simple */}
      <div className="relative pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Title & Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br ${currentTier.color} rounded-2xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 shadow-2xl`}
            >
              {React.createElement(currentTier.icon, { className: "h-8 w-8 sm:h-10 sm:w-10 text-white" })}
            </motion.div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">
                Programme Affilié
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Niveau {currentTier.name}
                </span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={`px-4 py-1.5 bg-gradient-to-r ${currentTier.color} border text-white rounded-full font-black text-sm shadow-xl`}
                  style={{ borderColor: 'var(--hybrid-accent-primary)', opacity: 0.3 }}
                >
                  {(currentTier.commission * 100)}% de commission
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Users, value: affiliateProfile.referrals_count || 0, label: "Parrainages" },
              { icon: Wallet, value: `${affiliateProfile.pending_earnings?.toFixed(0) || '0'}€`, label: "En attente" },
              { icon: MousePointerClick, value: affiliateProfile.clicks_count || 0, label: "Clics totaux" },
              { icon: TrendingUp, value: `${conversionRate}%`, label: "Conversion" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-center group hover:shadow-xl transition-all shadow-lg"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform" style={{
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                }}>
                  {React.createElement(stat.icon, { className: "h-5 w-5 text-white" })}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide">{[
            { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { key: 'referrals', label: 'Parrainages', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: LineChart },
            { key: 'settings', label: 'Paramètres', icon: Settings }
          ].map((tab, idx) => {
            const isActive = activeTab === tab.key
            return (
              <motion.button
                key={tab.key}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`relative flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl transition-all font-bold text-sm whitespace-nowrap ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-800'
                }`}
                style={isActive ? {
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                } : {}}
              >
                {React.createElement(tab.icon, { className: `h-4 w-4 sm:h-5 sm:w-5 transition-transform ${isActive ? 'scale-110' : ''}` })}
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AffiliateOverview
                affiliateProfile={affiliateProfile}
                currentTier={currentTier}
                nextTier={nextTier}
                onClaimEarnings={claimEarnings}
                onCopyLink={copyAffiliateLink}
                onShareSocial={shareOnSocial}
                claimLoading={claimLoading}
                copyLoading={copyLoading}
              />
            </motion.div>
          )}

          {activeTab === 'referrals' && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AffiliateReferrals referrals={referrals} />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AffiliateAnalytics affiliateProfile={affiliateProfile} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AffiliateSettings
                affiliateProfile={affiliateProfile}
                onUpdateCode={updateAffiliateCode}
                onUpdateMessage={updateCustomMessage}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
