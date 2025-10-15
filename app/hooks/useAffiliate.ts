// hooks/useAffiliate.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'

// Types TypeScript stricts
interface AffiliateProfile {
  id: string
  user_id: string
  affiliate_code: string
  custom_share_message?: string
  total_earnings: number
  pending_earnings: number
  claimed_earnings: number
  referrals_count: number
  clicks_count: number
  conversions_count: number
  tier_level: number
  tier_name: string
  commission_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ReferralData {
  id: string
  referrer_user_id: string
  referred_user_id: string
  affiliate_code: string
  commission_earned: number
  deposit_amount: number
  conversion_date: string | null
  status: 'pending' | 'converted' | 'cancelled'
  created_at: string
  profiles?: {
    username?: string
    avatar_url?: string
  }
}

interface AffiliateStats {
  total_clicks: number
  total_referrals: number
  total_earnings: number
  pending_earnings: number
  conversion_rate: number
  clicks_last_30_days: number
  referrals_last_30_days: number
  earnings_last_30_days: number
}

interface UseAffiliateReturn {
  // État
  profile: AffiliateProfile | null
  referrals: ReferralData[]
  stats: AffiliateStats | null
  loading: boolean
  error: string | null
  
  // Actions
  createProfile: (username?: string) => Promise<void>
  updateCode: (newCode: string) => Promise<boolean>
  updateMessage: (newMessage: string) => Promise<boolean>
  claimEarnings: (amount: number) => Promise<boolean>
  trackClick: (ipAddress?: string, userAgent?: string, referrerUrl?: string) => Promise<void>
  refreshData: () => Promise<void>
  
  // Utilitaires
  generateAffiliateLink: () => string
  getShareMessage: () => string
  getCurrentTier: () => { level: number; name: string; commission: number; color: string }
  canClaim: () => boolean
  getMinClaimAmount: () => number
}

export const useAffiliate = (): UseAffiliateReturn => {
  const { user } = useAuth()
  
  // États
  const [profile, setProfile] = useState<AffiliateProfile | null>(null)
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Configuration des tiers
  const tiers = [
    { level: 1, name: "Rookie", commission: 0.01, color: "from-gray-400 to-gray-600" },
    { level: 2, name: "Explorer", commission: 0.02, color: "from-green-400 to-green-600" },
    { level: 3, name: "Adventurer", commission: 0.03, color: "from-blue-400 to-blue-600" },
    { level: 4, name: "Hunter", commission: 0.04, color: "from-purple-400 to-purple-600" },
    { level: 5, name: "Elite", commission: 0.05, color: "from-indigo-400 to-indigo-600" },
    { level: 6, name: "Master", commission: 0.06, color: "from-pink-400 to-pink-600" },
    { level: 7, name: "Champion", commission: 0.07, color: "from-red-400 to-red-600" },
    { level: 8, name: "Legend", commission: 0.08, color: "from-yellow-400 to-yellow-600" },
    { level: 9, name: "Mythic", commission: 0.09, color: "from-orange-400 to-orange-600" },
    { level: 10, name: "Divine", commission: 0.10, color: "from-purple-500 via-pink-500 to-red-500" }
  ]

  // Générer un code par défaut
  const generateDefaultCode = useCallback((username?: string): string => {
    if (username && username.length >= 3) {
      const timestamp = Date.now().toString().slice(-4)
      return `${username.slice(0, 4).toUpperCase()}${timestamp}`
    }
    return `USER${Date.now().toString().slice(-6)}`
  }, [])

  // Créer un profil d'affilié
  const createProfile = useCallback(async (username?: string): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté')
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const defaultCode = generateDefaultCode(username)
      
      // Vérifier que le code est unique
      let finalCode = defaultCode
      let codeExists = true
      let attempts = 0
      
      while (codeExists && attempts < 10) {
        const { data } = await supabase
          .from('affiliate_profiles')
          .select('affiliate_code')
          .eq('affiliate_code', finalCode)
          .maybeSingle()
        
        if (!data) {
          codeExists = false
        } else {
          attempts++
          finalCode = generateDefaultCode(username) + attempts
        }
      }
      
      if (codeExists) {
        throw new Error('Impossible de générer un code unique')
      }
      
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .insert({
          user_id: user.id,
          affiliate_code: finalCode,
          custom_share_message: `Découvre ReveelBox avec mon code ${finalCode} ! La meilleure plateforme d'unboxing avec des objets réels !`,
          total_earnings: 0,
          pending_earnings: 0,
          claimed_earnings: 0,
          referrals_count: 0,
          clicks_count: 0,
          conversions_count: 0,
          tier_level: 1,
          tier_name: 'Rookie',
          commission_rate: 0.01,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, generateDefaultCode])

  // Charger le profil d'affilié
  const loadProfile = useCallback(async (): Promise<void> => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
      }
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Charger les parrainages
  const loadReferrals = useCallback(async (): Promise<void> => {
    if (!user) return
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('affiliate_referrals')
        .select(`
          *,
          profiles:referred_user_id(username, avatar_url)
        `)
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReferrals(data || [])
      
    } catch (err: any) {
      console.error('Erreur chargement parrainages:', err)
    }
  }, [user])

  // Calculer les statistiques
  const calculateStats = useCallback((): void => {
    if (!profile || !referrals) return

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentReferrals = referrals.filter(r => new Date(r.created_at) >= thirtyDaysAgo)
    const recentEarnings = recentReferrals.reduce((sum, r) => sum + r.commission_earned, 0)

    const conversionRate = profile.clicks_count > 0 
      ? (profile.conversions_count / profile.clicks_count) * 100 
      : 0

    setStats({
      total_clicks: profile.clicks_count,
      total_referrals: profile.referrals_count,
      total_earnings: profile.total_earnings,
      pending_earnings: profile.pending_earnings,
      conversion_rate: conversionRate,
      clicks_last_30_days: 0,
      referrals_last_30_days: recentReferrals.length,
      earnings_last_30_days: recentEarnings
    })
  }, [profile, referrals])

  // Mettre à jour le code d'affiliation
  const updateCode = useCallback(async (newCode: string): Promise<boolean> => {
    if (!user || !profile) return false
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Vérifier disponibilité
      const { data: existing } = await supabase
        .from('affiliate_profiles')
        .select('affiliate_code')
        .eq('affiliate_code', newCode.toUpperCase())
        .neq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        setError('Ce code est déjà utilisé')
        return false
      }

      // Mettre à jour
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .update({ 
          affiliate_code: newCode.toUpperCase(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      return true
      
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  // Mettre à jour le message personnalisé
  const updateMessage = useCallback(async (newMessage: string): Promise<boolean> => {
    if (!user) return false
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .update({ 
          custom_share_message: newMessage,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
      return true
      
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Réclamer les gains
  const claimEarnings = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || !profile) return false
    
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Vérifier que le montant est disponible
      if (amount > profile.pending_earnings) {
        setError('Montant insuffisant')
        return false
      }
      
      if (amount < getMinClaimAmount()) {
        setError(`Montant minimum: ${getMinClaimAmount()}€`)
        return false
      }
      
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
      
      // Mettre à jour les gains
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .update({
          pending_earnings: profile.pending_earnings - amount,
          claimed_earnings: profile.claimed_earnings + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      setProfile(data)
      return true
      
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, profile])

  // Enregistrer un clic
  const trackClick = useCallback(async (
    ipAddress?: string, 
    userAgent?: string, 
    referrerUrl?: string
  ): Promise<void> => {
    if (!profile) return
    
    try {
      const supabase = createClient()
      await supabase
        .from('affiliate_clicks')
        .insert({
          affiliate_code: profile.affiliate_code,
          ip_address: ipAddress || '127.0.0.1',
          user_agent: userAgent || navigator.userAgent,
          referrer_url: referrerUrl || window.location.href,
          clicked_at: new Date().toISOString(),
          converted: false
        })
    } catch (err) {
      console.error('Erreur enregistrement clic:', err)
    }
  }, [profile])

  // Rafraîchir toutes les données
  const refreshData = useCallback(async (): Promise<void> => {
    await loadProfile()
    await loadReferrals()
  }, [loadProfile, loadReferrals])

  // Générer le lien d'affiliation
  const generateAffiliateLink = useCallback((): string => {
    if (!profile) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.vercel.app'
    return `${baseUrl}/r/${profile.affiliate_code}`
  }, [profile])

  // Obtenir le message de partage
  const getShareMessage = useCallback((): string => {
    if (!profile) return ''
    return profile.custom_share_message || `Découvre ReveelBox avec mon code ${profile.affiliate_code} !`
  }, [profile])

  // Obtenir le tier actuel
  const getCurrentTier = useCallback(() => {
    const tierLevel = profile?.tier_level || 1
    return tiers.find(t => t.level === tierLevel) || tiers[0]
  }, [profile, tiers])

  // Vérifier si on peut réclamer
  const canClaim = useCallback((): boolean => {
    return (profile?.pending_earnings || 0) >= getMinClaimAmount()
  }, [profile])

  // Montant minimum pour réclamer
  const getMinClaimAmount = useCallback((): number => {
    return 50 // 50€ minimum
  }, [])

  // Charger les données au montage
  useEffect(() => {
    if (user) {
      loadProfile()
      loadReferrals()
    }
  }, [user, loadProfile, loadReferrals])

  // Recalculer les stats quand les données changent
  useEffect(() => {
    calculateStats()
  }, [calculateStats])

  return {
    // État
    profile,
    referrals,
    stats,
    loading,
    error,
    
    // Actions
    createProfile,
    updateCode,
    updateMessage,
    claimEarnings,
    trackClick,
    refreshData,
    
    // Utilitaires
    generateAffiliateLink,
    getShareMessage,
    getCurrentTier,
    canClaim,
    getMinClaimAmount
  }
}

// Utilitaires d'affiliation
export class AffiliateUtils {
  // Valider un code d'affiliation
  static validateAffiliateCode(code: string): { valid: boolean; error?: string } {
    if (!code) {
      return { valid: false, error: 'Le code est requis' }
    }
    
    if (code.length < 3) {
      return { valid: false, error: 'Le code doit contenir au moins 3 caractères' }
    }
    
    if (code.length > 12) {
      return { valid: false, error: 'Le code ne peut pas dépasser 12 caractères' }
    }
    
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      return { valid: false, error: 'Le code ne peut contenir que des lettres, chiffres, - et _' }
    }
    
    return { valid: true }
  }

  // Calculer la commission pour un dépôt
  static calculateCommission(depositAmount: number, commissionRate: number): number {
    return Math.round(depositAmount * commissionRate * 100) / 100
  }

  // Formater un montant en euros
  static formatEuros(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  // Générer des liens de partage pour les réseaux sociaux
  static generateSocialShareUrls(affiliateLink: string, message: string): Record<string, string> {
    const encodedLink = encodeURIComponent(affiliateLink)
    const encodedMessage = encodeURIComponent(message)
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}&hashtags=ReveelBox,Unboxing,Gaming`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
      whatsapp: `https://wa.me/?text=${encodedMessage} ${encodedLink}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      reddit: `https://reddit.com/submit?url=${encodedLink}&title=${encodedMessage}`
    }
  }
}