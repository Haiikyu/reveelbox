'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import React from 'react'
import { 
  Users, 
  Gift, 
  Copy, 
  Share2, 
  TrendingUp,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Trophy,
  Sparkles,
  BarChart3,
  Zap,
  ExternalLink,
  Loader,
  Calendar,
  Target,
  Award
} from 'lucide-react'

interface AffiliateData {
  id: string
  user_id: string
  code: string
  commission_rate: number
  total_earnings: number
  referrals_count: number
  clicks_count: number
  conversions_count: number
  created_at: string
}

interface ReferralData {
  id: string
  referred_user_id: string
  commission_earned: number
  created_at: string
  profiles?: {
    username?: string
  }
}

export default function AffiliationPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null)
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(true)
  const [copyLoading, setCopyLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const showNotification = (type: string, message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 4000)
  }

  // Protection de route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      return // Géré dans le rendu
    }
  }, [authLoading, isAuthenticated])

  // Générer un code affilié unique
  const generateAffiliateCode = (userId: string, username?: string) => {
    if (username && username.length >= 3) {
      return `${username.slice(0, 3).toUpperCase()}${userId.slice(-5).toUpperCase()}`
    }
    return `REV${userId.slice(-5).toUpperCase()}`
  }

  // Créer ou récupérer les données d'affiliation
  const createOrGetAffiliateData = async (userId: string, username?: string) => {
    try {
      setCreateLoading(true)
      const supabase = createClient()
      
      // Vérifier si l'utilisateur a déjà des données d'affiliation
      const { data: existingAffiliate, error: checkError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking affiliate:', checkError)
        // Si la table n'existe pas, créer avec des données mockées
        return createMockAffiliateData(userId, username)
      }

      if (existingAffiliate) {
        return existingAffiliate
      }

      // Créer de nouvelles données d'affiliation
      const affiliateCode = generateAffiliateCode(userId, username)
      
      const { data: newAffiliate, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: userId,
          code: affiliateCode,
          commission_rate: 0.05, // 5% par défaut
          total_earnings: 0,
          referrals_count: 0,
          clicks_count: 0,
          conversions_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating affiliate:', error)
        return createMockAffiliateData(userId, username)
      }
      
      return newAffiliate

    } catch (error) {
      console.error('Erreur création affiliation:', error)
      return createMockAffiliateData(userId, username)
    } finally {
      setCreateLoading(false)
    }
  }

  // Créer des données mockées si la DB n'est pas configurée
  const createMockAffiliateData = (userId: string, username?: string): AffiliateData => {
    const code = generateAffiliateCode(userId, username)
    return {
      id: `mock-${userId}`,
      user_id: userId,
      code,
      commission_rate: 0.05,
      total_earnings: 22.50,
      referrals_count: 3,
      clicks_count: 45,
      conversions_count: 3,
      created_at: new Date().toISOString()
    }
  }

  // Charger les parrainages de l'utilisateur
  const loadReferrals = async (userId: string) => {
    try {
      const supabase = createClient()
      
      // Première approche : requête simple sans jointure
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false })

      if (referralsError) {
        console.error('Error loading referrals:', referralsError)
        return createMockReferrals()
      }

      if (!referralsData || referralsData.length === 0) {
        return createMockReferrals()
      }

      // Récupérer les profils séparément
      const userIds = referralsData.map(ref => ref.referred_user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      // Combiner les données
      const enrichedReferrals = referralsData.map(referral => ({
        ...referral,
        profiles: profilesData?.find(profile => profile.id === referral.referred_user_id) || { username: 'Utilisateur anonyme' }
      }))

      return enrichedReferrals
    } catch (error) {
      console.error('Erreur chargement parrainages:', error)
      return createMockReferrals()
    }
  }

  // Créer des parrainages mockés pour la démo
  const createMockReferrals = (): ReferralData[] => {
    return [
      {
        id: 'mock-1',
        referred_user_id: 'mock-user-1',
        commission_earned: 7.50,
        created_at: new Date(Date.now() - 86400000).toISOString(), // Hier
        profiles: { username: 'GamerPro2024' }
      },
      {
        id: 'mock-2',
        referred_user_id: 'mock-user-2', 
        commission_earned: 10.00,
        created_at: new Date(Date.now() - 172800000).toISOString(), // Avant-hier
        profiles: { username: 'LootHunter' }
      },
      {
        id: 'mock-3',
        referred_user_id: 'mock-user-3',
        commission_earned: 5.00,
        created_at: new Date(Date.now() - 259200000).toISOString(), // Il y a 3 jours
        profiles: { username: 'BoxCollector' }
      }
    ]
  }

  // Charger toutes les données
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadAffiliateData()
    }
  }, [authLoading, isAuthenticated, user])

const loadAffiliateData = async () => {
  try {
    if (!user) throw new Error('Utilisateur non authentifié')

    setLoading(true)

    const username = profile?.username      // string | undefined

    // ✅ deuxième argument = string | undefined
    const affiliate = await createOrGetAffiliateData(user.id, username)
    setAffiliateData(affiliate)

    const referralsData = await loadReferrals(user.id)
    setReferrals(referralsData)

  } catch (error) {
    console.error('Erreur chargement données :', error)
    showNotification('error', 'Erreur lors du chargement des données')
  } finally {
    setLoading(false)
  }
}

  // Copier le lien d'affiliation
  const copyAffiliateLink = async () => {
    if (!affiliateData) return
    
    setCopyLoading(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.vercel.app'
      const link = `${baseUrl}/signup?ref=${affiliateData.code}`
      
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(link)
      } else {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea')
        textArea.value = link
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      // Incrémenter le compteur de clics (si la DB est disponible)
      if (affiliateData.id !== `mock-${user?.id}`) {
        try {
          const supabase = createClient()
          await supabase
            .from('affiliates')
            .update({ clicks_count: (affiliateData.clicks_count || 0) + 1 })
            .eq('id', affiliateData.id)
        } catch (error) {
          console.log('DB update failed, continuing with mock data')
        }
      }
      
      showNotification('success', 'Lien d\'affiliation copié dans le presse-papier !')
    } catch (error) {
      console.error('Copy error:', error)
      showNotification('error', 'Erreur lors de la copie du lien')
    } finally {
      setCopyLoading(false)
    }
  }

  // Partager sur les réseaux sociaux
  const shareOnSocial = (platform: string) => {
    if (!affiliateData) return
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.vercel.app'
    const link = `${baseUrl}/signup?ref=${affiliateData.code}`
    const text = "Découvre ReveelBox, l'expérience d'unboxing la plus excitante ! 🎁✨ Ouvre des caisses et gagne des objets réels !"
    
    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}&hashtags=ReveelBox,Unboxing,Gaming`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  // Calculer le niveau actuel
  const getCurrentTier = (referralsCount: number) => {
    if (referralsCount >= 51) return 2 // Or
    if (referralsCount >= 11) return 1 // Argent
    return 0 // Bronze
  }

  const tiers = [
    {
      name: "Bronze",
      icon: Trophy,
      color: "from-orange-400 to-orange-600",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      requirement: "0-10 parrainages",
      commission: "5%",
      bonus: "10 coins",
      features: ["Commission sur chaque achat", "Bonus de bienvenue", "Accès aux statistiques"]
    },
    {
      name: "Argent",
      icon: Star,
      color: "from-gray-400 to-gray-600",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      requirement: "11-50 parrainages",
      commission: "7%",
      bonus: "25 coins",
      features: ["Commission améliorée", "Bonus augmenté", "Support prioritaire", "Badges exclusifs"]
    },
    {
      name: "Or",
      icon: Sparkles,
      color: "from-yellow-400 to-yellow-600",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      requirement: "51+ parrainages",
      commission: "10%",
      bonus: "50 coins",
      features: ["Commission maximale", "Bonus premium", "Accès VIP", "Produits exclusifs", "Manager dédié"],
      popular: true
    }
  ]

  const benefits = [
    {
      icon: DollarSign,
      title: "Commissions attractives",
      description: "Gagnez jusqu'à 10% sur chaque achat de vos filleuls"
    },
    {
      icon: Gift,
      title: "Bonus de parrainage",
      description: "Recevez des coins gratuits pour chaque nouveau membre"
    },
    {
      icon: TrendingUp,
      title: "Revenus passifs",
      description: "Gagnez de l'argent même pendant que vous dormez"
    },
    {
      icon: BarChart3,
      title: "Suivi en temps réel",
      description: "Dashboard complet pour suivre vos performances"
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Obtenez votre lien",
      description: "Copiez votre lien d'affiliation unique ci-dessous"
    },
    {
      number: "02", 
      title: "Partagez",
      description: "Diffusez votre lien sur vos réseaux sociaux favoris"
    },
    {
      number: "03",
      title: "Gagnez",
      description: "Recevez vos commissions à chaque achat de vos filleuls"
    }
  ]

const clicks      = affiliateData?.clicks_count      ?? 0   // number
const conversions = affiliateData?.conversions_count ?? 0   // number

const conversionRate = clicks > 0
  ? ((conversions / clicks) * 100).toFixed(1)  // ex. "12.3"
  : '0.0'

  // Loading state - Protégé par l'auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos données d'affiliation...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connexion requise
          </h2>
          <p className="text-gray-600 mb-8">
            Vous devez être connecté pour accéder au programme d'affiliation
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-200"
          >
            Se connecter
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    )
  }

  const currentTierIndex = getCurrentTier(affiliateData?.referrals_count || 0)

  return (
    <div className="min-h-screen bg-white pt-20">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-green-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Programme d'Affiliation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Rejoignez notre programme et gagnez de l'argent en partageant ReveelBox avec vos amis !
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {affiliateData?.referrals_count || 0}
                </div>
                <div className="text-sm text-gray-600">Parrainages</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {affiliateData?.total_earnings?.toFixed(2) || '0.00'}€
                </div>
                <div className="text-sm text-gray-600">Gains</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {affiliateData?.clicks_count || 0}
                </div>
                <div className="text-sm text-gray-600">Clics</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {conversionRate}%
                </div>
                <div className="text-sm text-gray-600">Conversion</div>
              </div>
            </div>

            {/* Current Tier Badge */}
            {affiliateData && (
              <div className="mt-6">
                <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border">
                  <div className={`h-8 w-8 bg-gradient-to-br ${tiers[currentTierIndex].color} rounded-lg flex items-center justify-center`}>
                    {React.createElement(tiers[currentTierIndex].icon, { className: "h-4 w-4 text-white" })}
                  </div>
                  <span className="font-semibold text-gray-900">
                    Niveau {tiers[currentTierIndex].name}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({tiers[currentTierIndex].commission} commission)
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Affiliate Link Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Votre lien d'affiliation
            </h2>
            
            {affiliateData && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Votre code : <span className="font-mono text-green-600">{affiliateData.code}</span>
                      </label>
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg p-3">
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.vercel.app'}/signup?ref=${affiliateData.code}`}
                          className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={copyAffiliateLink}
                          disabled={copyLoading}
                          className="ml-3 bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {copyLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
							) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Share */}
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-4">Partager sur les réseaux</h3>
                  <div className="flex justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareOnSocial('twitter')}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-colors"
                      title="Partager sur Twitter"
                    >
                      <Share2 className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareOnSocial('facebook')}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors"
                      title="Partager sur Facebook"
                    >
                      <Share2 className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareOnSocial('whatsapp')}
                      className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-colors"
                      title="Partager sur WhatsApp"
                    >
                      <Share2 className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => shareOnSocial('telegram')}
                      className="bg-blue-400 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors"
                      title="Partager sur Telegram"
                    >
                      <Share2 className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Referrals List */}
      {referrals.length > 0 && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Vos parrainages récents
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Award className="h-4 w-4" />
                  <span>{referrals.length} parrainage{referrals.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {referrals.slice(0, 5).map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {referral.profiles?.username || 'Utilisateur anonyme'}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(referral.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        +{referral.commission_earned?.toFixed(2) || '0.00'}€
                      </div>
                      <div className="text-sm text-gray-600">Commission</div>
                    </div>
                  </div>
                ))}
              </div>

              {referrals.length > 5 && (
                <div className="mt-6 text-center">
                  <Link
                    href="/profile"
                    className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-2 hover:underline transition-colors"
                  >
                    Voir tous les parrainages ({referrals.length})
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Référrals Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {referrals.length}
                    </div>
                    <div className="text-sm text-gray-600">Total parrainages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {referrals.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0).toFixed(2)}€
                    </div>
                    <div className="text-sm text-gray-600">Total commissions</div>
                  </div>
                  <div className="text-center col-span-2 md:col-span-1">
                    <div className="text-2xl font-bold text-blue-600">
                      {referrals.length > 0 ? (referrals.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0) / referrals.length).toFixed(2) : '0.00'}€
                    </div>
                    <div className="text-sm text-gray-600">Commission moyenne</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Tiers Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Niveaux d'Affiliation
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Plus vous parrainez, plus vos récompenses augmentent
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => {
              const Icon = tier.icon
              const isCurrentTier = index === currentTierIndex
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className={`relative bg-white rounded-2xl shadow-lg p-8 border-2 ${
                    isCurrentTier ? 'border-green-300 ring-2 ring-green-100' : tier.borderColor
                  } ${isCurrentTier ? 'transform scale-105' : ''}`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Votre niveau
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className={`inline-flex h-16 w-16 bg-gradient-to-br ${tier.color} rounded-2xl items-center justify-center mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 text-sm">{tier.requirement}</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {tier.commission}
                      </div>
                      <div className="text-gray-600">de commission</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xl font-semibold text-green-600 mb-1">
                        {tier.bonus}
                      </div>
                      <div className="text-gray-600 text-sm">par parrainage</div>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi devenir affilié ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez tous les avantages de notre programme d'affiliation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <Icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trois étapes simples pour commencer à gagner
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-xl">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-green-300 to-gray-300 transform -translate-y-1/2"></div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Progress to Next Tier */}
      {affiliateData && currentTierIndex < tiers.length - 1 && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center"
            >
              <div className="flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Progression vers le niveau supérieur
                </h2>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className={`h-6 w-6 bg-gradient-to-br ${tiers[currentTierIndex].color} rounded-lg flex items-center justify-center`}>
                      {React.createElement(tiers[currentTierIndex].icon, { className: "h-3 w-3 text-white" })}
                    </div>
                    Niveau {tiers[currentTierIndex].name}
                  </span>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className={`h-6 w-6 bg-gradient-to-br ${tiers[currentTierIndex + 1].color} rounded-lg flex items-center justify-center`}>
                      {React.createElement(tiers[currentTierIndex + 1].icon, { className: "h-3 w-3 text-white" })}
                    </div>
                    Niveau {tiers[currentTierIndex + 1].name}
                  </span>
                </div>
                
                {(() => {
                  const current = affiliateData.referrals_count
                  const nextTierRequirement = currentTierIndex === 0 ? 11 : 51
                  const progress = Math.min((current / nextTierRequirement) * 100, 100)
                  const remaining = Math.max(nextTierRequirement - current, 0)
                  
                  return (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-1000 relative overflow-hidden"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-600 mb-2">
                          {current} / {nextTierRequirement} parrainages
                        </div>
                        <p className="text-gray-700">
                          {remaining > 0 ? (
                            <>
                              Plus que <span className="font-bold text-green-600">{remaining} parrainage{remaining > 1 ? 's' : ''}</span> pour débloquer le niveau {tiers[currentTierIndex + 1].name} !
                            </>
                          ) : (
                            "Félicitations ! Vous avez atteint le niveau maximum !"
                          )}
                        </p>
                      </div>
                      
                      {remaining > 0 && (
                        <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
                          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="text-xl font-bold text-green-600">
                              {tiers[currentTierIndex + 1].commission}
                            </div>
                            <div className="text-sm text-gray-600">Commission future</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="text-xl font-bold text-green-600">
                              {tiers[currentTierIndex + 1].bonus}
                            </div>
                            <div className="text-sm text-gray-600">Bonus futur</div>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
              
              {/* Call to Action */}
              <div className="mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyAffiliateLink}
                  disabled={copyLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full text-sm font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {copyLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Partager mon lien maintenant
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Tips Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Conseils pour maximiser vos gains
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stratégies éprouvées pour augmenter vos commissions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Partagez authentiquement",
                description: "Partagez votre expérience personnelle avec ReveelBox pour convaincre vos amis",
                tip: "Montrez vos gains et unboxings !"
              },
              {
                icon: BarChart3,
                title: "Utilisez les réseaux sociaux",
                description: "Postez régulièrement sur Instagram, TikTok et Twitter avec votre lien",
                tip: "Utilisez les hashtags populaires"
              },
              {
                icon: Target,
                title: "Ciblez les gamers",
                description: "Les amateurs de jeux et de collections sont votre audience idéale",
                tip: "Rejoignez des communautés gaming"
              }
            ].map((tip, index) => {
              const Icon = tip.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{tip.description}</p>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-green-800 text-xs font-medium">💡 Astuce</div>
                    <div className="text-green-700 text-sm">{tip.tip}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Témoignages d'affiliés
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez ce que nos affiliés pensent du programme ReveelBox
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex M.",
                tier: "Or",
                earnings: "1,250€",
                referrals: 68,
                quote: "J'ai commencé par partager avec mes amis gamers. Maintenant c'est devenu un vrai revenu complémentaire !",
                avatar: "🎮"
              },
              {
                name: "Sarah K.",
                tier: "Argent", 
                earnings: "450€",
                referrals: 25,
                quote: "Mes followers Instagram adorent découvrir de nouveaux produits. ReveelBox est parfait pour ça !",
                avatar: "📸"
              },
              {
                name: "Tom R.",
                tier: "Bronze",
                earnings: "89€",
                referrals: 8,
                quote: "Même en tant que débutant, j'ai déjà gagné mes premiers euros. Le système est vraiment bien fait !",
                avatar: "🚀"
              }
            ].map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                    {story.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{story.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        story.tier === 'Or' ? 'bg-yellow-100 text-yellow-800' :
                        story.tier === 'Argent' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        Niveau {story.tier}
                      </span>
                    </div>
                  </div>
                </div>

                <blockquote className="text-gray-700 mb-4 italic">
                  "{story.quote}"
                </blockquote>

                <div className="flex justify-between text-sm">
                  <div>
                    <div className="font-semibold text-green-600">{story.earnings}</div>
                    <div className="text-gray-600">Gains totaux</div>
                  </div>
                  <div>
                    <div className="font-semibold text-blue-600">{story.referrals}</div>
                    <div className="text-gray-600">Parrainages</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
            <p className="text-gray-600">
              Tout ce que vous devez savoir sur notre programme d'affiliation
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                question: "Comment sont calculées les commissions ?",
                answer: "Vous recevez un pourcentage sur chaque achat réalisé par vos filleuls : 5% en Bronze, 7% en Argent, et 10% en Or. Plus un bonus fixe par parrainage selon votre niveau."
              },
              {
                question: "Quand suis-je payé ?",
                answer: "Les paiements sont effectués mensuellement dès que vous atteignez 50€ de gains. Vous pouvez choisir entre virement bancaire, PayPal ou crédit sur votre compte ReveelBox."
              },
              {
                question: "Y a-t-il une limite au nombre de parrainages ?",
                answer: "Absolument aucune ! Plus vous parrainez, plus vous gagnez. Le système est conçu pour récompenser les affiliés les plus actifs avec de meilleurs taux de commission."
              },
              {
                question: "Comment suivre mes performances ?",
                answer: "Votre dashboard d'affiliation vous donne accès à toutes vos statistiques en temps réel : clics, conversions, gains, évolution de votre niveau, etc."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
              >
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  {faq.question}
                </h3>
                <p className="text-gray-600 ml-11">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-500 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à commencer votre aventure ?
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Rejoignez des centaines d'affiliés qui gagnent déjà de l'argent avec ReveelBox. 
              Commencez dès aujourd'hui et transformez votre passion en revenus !
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyAffiliateLink}
                disabled={copyLoading}
                className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 min-w-[250px]"
              >
                {copyLoading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                Copier mon lien d'affiliation
              </motion.button>
              
              <Link
                href="/profile"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2 border-2 border-white/20 min-w-[250px]"
              >
                <BarChart3 className="h-5 w-5" />
                Voir mes statistiques
              </Link>
            </div>

            {/* Quick Stats Footer */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-green-100 text-sm">Affiliés actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">€50K+</div>
                <div className="text-green-100 text-sm">Commissions versées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10%</div>
                <div className="text-green-100 text-sm">Commission max</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24h</div>
                <div className="text-green-100 text-sm">Support réactif</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'aide ?
            </h2>
            <p className="text-gray-600 mb-6">
              Notre équipe est là pour vous accompagner dans votre réussite
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <ExternalLink className="h-5 w-5" />
                Contacter le support
              </Link>
              
              <a
                href="mailto:affiliation@reveelbox.fr"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 px-6 py-3 rounded-full font-semibold transition-colors"
              >
                <Share2 className="h-5 w-5" />
                affiliation@reveelbox.fr
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}