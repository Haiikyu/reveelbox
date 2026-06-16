'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useAuthModal } from '@/app/components/AuthModalProvider'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'
import {
  Users, ArrowRight, Trophy,
  Zap, Target, Award, Flame,
  TrendingUp, Star, Loader, Copy, Check, Share2,
  Crown, Medal, Gem
} from 'lucide-react'

import AffiliateOverview from '@/app/components/affiliate/AffiliateOverview'
import AffiliateReferrals from '@/app/components/affiliate/AffiliateReferrals'
import AffiliateAnalytics from '@/app/components/affiliate/AffiliateAnalytics'
import AffiliateSettings from '@/app/components/affiliate/AffiliateSettings'
import SocialIcon from '@/app/components/affiliate/SocialIcon'
import type { AffiliateProfile, ReferralData, AffiliateTier } from '@/app/components/affiliate/types'

export default function AffiliatePage(): JSX.Element | null {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const { openLoginModal } = useAuthModal()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [affiliateProfile, setAffiliateProfile] = useState<AffiliateProfile | null>(null)
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [copyLoading, setCopyLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  const darkBg = isDark ? { background: '#0C1220' } : { background: '#f8f7f5' }

  const sectionStyle = {
    background: isDark ? 'rgba(18,28,48,0.95)' : '#ffffff',
    border: isDark ? '1px solid rgba(59,130,246,0.1)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
  }

  const affiliateTiers: AffiliateTier[] = [
    { level: 1, name: "Rookie", commission: 0.01, color: "from-slate-400 to-slate-600", hexColor: "#64748b", icon: Users, requirement: 0, bonus: 5 },
    { level: 2, name: "Explorer", commission: 0.02, color: "from-blue-400 to-blue-600", hexColor: "#3b82f6", icon: Target, requirement: 5, bonus: 10 },
    { level: 3, name: "Adventurer", commission: 0.03, color: "from-blue-500 to-blue-700", hexColor: "#2563eb", icon: Zap, requirement: 15, bonus: 15 },
    { level: 4, name: "Hunter", commission: 0.04, color: "from-sky-400 to-sky-600", hexColor: "#0ea5e9", icon: Award, requirement: 30, bonus: 20 },
    { level: 5, name: "Elite", commission: 0.05, color: "from-indigo-400 to-indigo-600", hexColor: "#6366f1", icon: Medal, requirement: 50, bonus: 25 },
    { level: 6, name: "Master", commission: 0.06, color: "from-violet-400 to-violet-600", hexColor: "#8b5cf6", icon: Crown, requirement: 75, bonus: 30 },
    { level: 7, name: "Champion", commission: 0.07, color: "from-purple-400 to-purple-600", hexColor: "#a855f7", icon: Trophy, requirement: 100, bonus: 40 },
    { level: 8, name: "Legend", commission: 0.08, color: "from-fuchsia-400 to-fuchsia-600", hexColor: "#d946ef", icon: Star, requirement: 150, bonus: 50 },
    { level: 9, name: "Mythic", commission: 0.09, color: "from-pink-400 to-pink-600", hexColor: "#ec4899", icon: Flame, requirement: 200, bonus: 75 },
    { level: 10, name: "Divine", commission: 0.10, color: "from-rose-400 to-rose-600", hexColor: "#f43f5e", icon: Gem, requirement: 300, bonus: 100 }
  ]

  const showNotification = (type: string, message: string): void => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 4000)
  }

  const generateDefaultCode = (username?: string): string => {
    if (username && username.length >= 3) {
      return `${username.slice(0, 4).toUpperCase()}${Date.now().toString().slice(-4)}`
    }
    return `USER${Date.now().toString().slice(-6)}`
  }

  const createAffiliateProfile = async (userId: string, username?: string): Promise<AffiliateProfile> => {
    const supabase = createClient()
    const defaultCode = generateDefaultCode(username)
    const { data, error } = await supabase
      .from('affiliate_profiles')
      .insert({
        user_id: userId, affiliate_code: defaultCode,
        custom_share_message: `D\u00e9couvre ReveelBox avec mon code ${defaultCode} !`,
        total_earnings: 0, pending_earnings: 0, claimed_earnings: 0,
        referrals_count: 0, clicks_count: 0, conversions_count: 0,
        tier_level: 1, tier_name: affiliateTiers[0].name,
        commission_rate: affiliateTiers[0].commission, is_active: true
      })
      .select().single()
    if (error) throw error
    return data
  }

  const loadAffiliateProfile = async (userId: string): Promise<void> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('affiliate_profiles').select('*').eq('user_id', userId).maybeSingle()
      if (error && error.code !== 'PGRST116') console.error('Erreur chargement profil:', error)
      if (!data) {
        setAffiliateProfile(await createAffiliateProfile(userId, profile?.username))
      } else {
        setAffiliateProfile(data)
      }
    } catch (error) { console.error('Erreur chargement profil:', error) }
  }

  const loadReferrals = async (userId: string): Promise<void> => {
    try {
      const supabase = createClient()
      const { data: referralsData, error } = await supabase
        .from('affiliate_referrals').select('*').eq('referrer_user_id', userId).order('created_at', { ascending: false }).limit(200)
      if (error) { setReferrals([]); return }
      if (referralsData && referralsData.length > 0) {
        const userIds = [...new Set(referralsData.map(ref => ref.referred_user_id).filter(Boolean))]
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
          const profilesMap = new Map()
          profilesData?.forEach(p => profilesMap.set(p.id, p))
          setReferrals(referralsData.map(ref => ({ ...ref, profiles: profilesMap.get(ref.referred_user_id) || null })))
        } else { setReferrals(referralsData) }
      } else { setReferrals([]) }
    } catch { setReferrals([]) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      (async () => {
        try {
          setLoading(true)
          await loadAffiliateProfile(user.id)
          await loadReferrals(user.id)
        } catch { showNotification('error', 'Erreur lors du chargement') }
        finally { setLoading(false) }
      })()
    }
  }, [authLoading, isAuthenticated, user])

  // Close share dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareDropdownOpen(false)
      }
    }
    if (shareDropdownOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [shareDropdownOpen])

  const checkCodeAvailability = async (code: string): Promise<boolean> => {
    const supabase = createClient()
    const { data } = await supabase.from('affiliate_profiles').select('affiliate_code').eq('affiliate_code', code.toUpperCase()).maybeSingle()
    return !data
  }

  const updateAffiliateCode = async (newCode: string): Promise<void> => {
    if (!affiliateProfile || !user) return
    try {
      if (!(await checkCodeAvailability(newCode))) { showNotification('error', 'Ce code est d\u00e9j\u00e0 utilis\u00e9'); return }
      const supabase = createClient()
      const { error } = await supabase.from('affiliate_profiles').update({ affiliate_code: newCode.toUpperCase(), updated_at: new Date().toISOString() }).eq('user_id', user.id)
      if (error) throw error
      setAffiliateProfile(prev => prev ? { ...prev, affiliate_code: newCode.toUpperCase(), updated_at: new Date().toISOString() } : null)
      showNotification('success', 'Code mis \u00e0 jour !')
    } catch { showNotification('error', 'Erreur lors de la mise \u00e0 jour') }
  }

  const updateCustomMessage = async (newMessage: string): Promise<void> => {
    if (!affiliateProfile || !user) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('affiliate_profiles').update({ custom_share_message: newMessage, updated_at: new Date().toISOString() }).eq('user_id', user.id)
      if (error) throw error
      setAffiliateProfile(prev => prev ? { ...prev, custom_share_message: newMessage, updated_at: new Date().toISOString() } : null)
      showNotification('success', 'Message mis \u00e0 jour !')
    } catch { showNotification('error', 'Erreur lors de la mise \u00e0 jour') }
  }

  const claimEarnings = async (amount: number): Promise<void> => {
    if (!affiliateProfile || !user) return
    try {
      setClaimLoading(true)
      if (amount < 50) { showNotification('error', 'Montant minimum: 50\u20ac'); return }
      if (amount > affiliateProfile.pending_earnings) { showNotification('error', 'Montant insuffisant'); return }
      const supabase = createClient()
      const { error: payoutError } = await supabase.from('affiliate_payouts').insert({ user_id: user.id, amount, method: 'bank_transfer', status: 'pending' })
      if (payoutError) throw payoutError
      const { data, error } = await supabase.from('affiliate_profiles').update({
        pending_earnings: affiliateProfile.pending_earnings - amount,
        claimed_earnings: affiliateProfile.claimed_earnings + amount,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id).select().single()
      if (error) throw error
      setAffiliateProfile(data)
      showNotification('success', `Retrait de ${amount}\u20ac envoy\u00e9 !`)
    } catch { showNotification('error', 'Erreur lors de la r\u00e9clamation') }
    finally { setClaimLoading(false) }
  }

  const copyAffiliateLink = async (): Promise<void> => {
    if (!affiliateProfile) return
    setCopyLoading(true)
    try {
      const link = `${window.location.origin}/r/${affiliateProfile.affiliate_code}`
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      showNotification('success', 'Lien copi\u00e9 !')
    } catch { showNotification('error', 'Erreur lors de la copie') }
    finally { setCopyLoading(false) }
  }

  const shareOnSocial = (platform: string): void => {
    if (!affiliateProfile) return
    const link = `${window.location.origin}/r/${affiliateProfile.affiliate_code}`
    const message = affiliateProfile.custom_share_message || `D\u00e9couvre ReveelBox avec mon code ${affiliateProfile.affiliate_code} !`
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(message)}`,
    }
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=400')
    setShareDropdownOpen(false)
  }

  const conversionRate = affiliateProfile?.clicks_count && affiliateProfile.clicks_count > 0
    ? ((affiliateProfile.conversions_count / affiliateProfile.clicks_count) * 100).toFixed(1)
    : '0.0'

  // === RENDERS ===

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={darkBg}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Users className="h-12 w-12 mx-auto mb-6" style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />
          <h2 className="text-2xl font-bold mb-3" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
            Connexion requise
          </h2>
          <p className="text-sm mb-8" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
            Acc\u00e9dez \u00e0 votre espace affili\u00e9
          </p>
          <button onClick={() => openLoginModal()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            Se connecter <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    )
  }

  if (!affiliateProfile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={darkBg}>
        <Loader className="h-6 w-6 animate-spin" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
      </div>
    )
  }

  const currentTier = affiliateTiers.find(tier => tier.level === affiliateProfile.tier_level) || affiliateTiers[0]
  const nextTier = affiliateTiers.find(tier => tier.level === (currentTier.level + 1))
  const affiliateLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.com'}/r/${affiliateProfile.affiliate_code}`

  return (
    <div className="min-h-screen lg:h-[calc(100vh-80px)] lg:overflow-hidden -mt-[80px] pt-[80px] relative flex flex-col" style={darkBg}>

      {/* Dot grid */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.015,
            backgroundImage: 'radial-gradient(rgba(59,130,246,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        </div>
      )}

      {/* Notification */}
      <AnimatePresence>
        {notification.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium"
            style={{
              background: notification.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: notification.type === 'error' ? '#ef4444' : '#10b981',
              border: `1px solid ${notification.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
              backdropFilter: 'blur(12px)'
            }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col flex-1 lg:min-h-0">

        {/* === HEADER === */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-4 sm:px-6 lg:px-8 xl:px-12 pt-4 pb-3 flex-shrink-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left: Title + Badge */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTier.hexColor, boxShadow: `0 0 8px ${currentTier.hexColor}40` }} />
                <span className="text-[10px] font-semibold uppercase" style={{ letterSpacing: '0.12em', color: currentTier.hexColor }}>
                  {currentTier.name} &middot; {(currentTier.commission * 100)}% commission
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: isDark ? '#e2e8f0' : 'rgba(0,0,0,0.9)' }}>
                Affili&eacute;s
              </h1>
            </div>

            {/* Right: Affiliate link + Share */}
            <div className="flex items-center gap-2 sm:mt-0">
              <div className="flex items-center gap-2 p-1 rounded-xl flex-1 sm:flex-initial" style={sectionStyle}>
                <div className="px-3 py-1.5 text-xs font-mono truncate max-w-[180px] sm:max-w-[260px]" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
                  {affiliateLink}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyAffiliateLink}
                  disabled={copyLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all disabled:opacity-50 flex-shrink-0"
                  style={{ background: linkCopied ? '#10b981' : 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                  {linkCopied ? 'Copi\u00e9' : 'Copier'}
                </motion.button>
              </div>

              {/* Share Dropdown */}
              <div className="relative" ref={shareRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShareDropdownOpen(!shareDropdownOpen)}
                  className="p-2.5 rounded-xl transition-all"
                  style={{ ...sectionStyle, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
                >
                  <Share2 size={16} />
                </motion.button>
                <AnimatePresence>
                  {shareDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 p-2 rounded-xl z-50 min-w-[160px]"
                      style={{
                        background: isDark ? '#1a2332' : '#ffffff',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.12)',
                      }}
                    >
                      {[
                        { name: 'Twitter', platform: 'twitter' },
                        { name: 'Facebook', platform: 'facebook' },
                        { name: 'WhatsApp', platform: 'whatsapp' },
                        { name: 'Telegram', platform: 'telegram' },
                        { name: 'LinkedIn', platform: 'linkedin' },
                        { name: 'Reddit', platform: 'reddit' }
                      ].map((social) => (
                        <button
                          key={social.platform}
                          onClick={() => shareOnSocial(social.platform)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <SocialIcon platform={social.platform} className="w-4 h-4" />
                          {social.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* === MAIN LAYOUT === */}
        <div className="flex-1 lg:min-h-0 flex flex-col lg:flex-row gap-3 px-4 sm:px-6 lg:px-8 xl:px-12 pb-4">

          {/* LEFT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col gap-3 lg:flex-1 lg:min-h-0"
          >
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 flex-shrink-0">
              {[
                { label: 'Parrainages', value: (affiliateProfile.referrals_count || 0).toString(), color: currentTier.hexColor, icon: Users, sub: 'r\u00e9f\u00e9r\u00e9s' },
                { label: 'En attente', value: `${affiliateProfile.pending_earnings?.toFixed(0) || '0'}\u20ac`, color: '#10b981', icon: TrendingUp, sub: '\u00e0 r\u00e9cup\u00e9rer' },
                { label: 'Clics', value: (affiliateProfile.clicks_count || 0).toString(), color: '#3b82f6', icon: Zap, sub: 'sur votre lien' },
                { label: 'Conversion', value: `${conversionRate}%`, color: '#8b5cf6', icon: Target, sub: 'taux de conv.' },
                { label: 'Total gagn\u00e9', value: `${affiliateProfile.total_earnings?.toFixed(0) || '0'}\u20ac`, color: '#f59e0b', icon: Trophy, sub: 'commissions' },
              ].map((stat, i) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + i * 0.04 }}
                    className="p-3 rounded-2xl relative overflow-hidden"
                    style={sectionStyle}
                  >
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: `radial-gradient(ellipse 80% 60% at 100% 100%, ${stat.color}08, transparent)`
                    }} />
                    <div className="relative">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}18` }}>
                          <Icon size={12} style={{ color: stat.color }} />
                        </div>
                        <span className="text-[9px] font-medium uppercase hidden sm:block" style={{ letterSpacing: '0.08em', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                          {stat.label}
                        </span>
                      </div>
                      <div className="text-lg font-black mb-0.5" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-[9px]" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>{stat.sub}</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Referrals - fills remaining height */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="lg:flex-1 lg:min-h-0"
            >
              <AffiliateReferrals referrals={referrals} />
            </motion.div>

            {/* Tier Roadmap */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex-shrink-0 p-4 sm:p-5"
              style={sectionStyle}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[10px] font-medium uppercase" style={{ letterSpacing: '0.1em', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>
                    Roadmap Niveaux
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl flex-shrink-0" style={{
                  background: `${currentTier.hexColor}15`,
                  border: `1px solid ${currentTier.hexColor}30`,
                }}>
                  <TrendingUp size={10} style={{ color: currentTier.hexColor }} />
                  <span className="text-[10px] font-bold" style={{ color: currentTier.hexColor }}>Niv. {currentTier.level}/10</span>
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                <div className="flex gap-1.5 min-w-max">
                  {affiliateTiers.map((tier, index) => {
                    const isCurrent = tier.level === affiliateProfile.tier_level
                    const isUnlocked = tier.level <= affiliateProfile.tier_level
                    const isLast = index === affiliateTiers.length - 1
                    return (
                      <div key={tier.level} className="flex items-center">
                        <motion.div
                          className="relative flex flex-col items-center w-[72px] flex-shrink-0 rounded-xl py-2 px-1"
                          style={isCurrent ? { background: `${tier.hexColor}12`, border: `1px solid ${tier.hexColor}30` } : { background: 'transparent', border: '1px solid transparent' }}
                          animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          {isCurrent && (
                            <motion.div
                              className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                              style={{ background: tier.hexColor, boxShadow: `0 0 8px ${tier.hexColor}` }}
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          <div
                            className="h-7 w-7 rounded-xl flex items-center justify-center mb-1.5 transition-all"
                            style={isCurrent ? {
                              background: `linear-gradient(135deg, ${tier.hexColor}, ${tier.hexColor}cc)`,
                              boxShadow: `0 4px 16px ${tier.hexColor}40`,
                            } : isUnlocked ? {
                              background: `linear-gradient(135deg, ${tier.hexColor}bb, ${tier.hexColor}88)`,
                            } : {
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            }}
                          >
                            {React.createElement(tier.icon, {
                              className: 'h-3.5 w-3.5',
                              style: isCurrent || isUnlocked ? { color: '#fff' } : { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }
                            })}
                          </div>
                          <span className="text-[9px] font-bold mb-0.5 text-center" style={{
                            color: isCurrent ? tier.hexColor : isUnlocked ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
                          }}>{tier.name}</span>
                          <span className="text-xs font-black" style={{
                            color: isCurrent || isUnlocked ? tier.hexColor : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')
                          }}>{(tier.commission * 100)}%</span>
                          <span className="text-[8px] mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>
                            {tier.requirement === 0 ? 'D\u00e9part' : `${tier.requirement}`}
                          </span>
                        </motion.div>
                        {!isLast && (
                          <div className="w-3 h-[2px] mx-0.5 flex-shrink-0" style={{
                            background: isUnlocked && affiliateTiers[index + 1] && affiliateTiers[index + 1].level <= affiliateProfile.tier_level
                              ? `linear-gradient(90deg, ${tier.hexColor}, ${affiliateTiers[index + 1].hexColor})`
                              : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-3 lg:overflow-y-auto"
          >
            <AffiliateOverview
              affiliateProfile={affiliateProfile}
              currentTier={currentTier}
              nextTier={nextTier}
              onClaimEarnings={claimEarnings}
              claimLoading={claimLoading}
            />
            <AffiliateAnalytics affiliateProfile={affiliateProfile} />
            <AffiliateSettings
              affiliateProfile={affiliateProfile}
              onUpdateCode={updateAffiliateCode}
              onUpdateMessage={updateCustomMessage}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
