'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  ExternalLink,
  ArrowRight,
  Coins,
  UserPlus,
  Trophy,
  Target,
  Zap,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react'

export default function AffiliationPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [affiliateCode, setAffiliateCode] = useState('')
  const [affiliateStats, setAffiliateStats] = useState({
    referrals: 0,
    earnings: 0,
    clicks: 0,
    conversions: 0
  })
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  
  const supabase = createClientComponentClient()

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 4000)
  }

  // Check auth and load affiliate data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Load profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
        
        // Generate or load affiliate code
        const code = profile?.affiliate_code || user.id.slice(-8).toUpperCase()
        setAffiliateCode(code)
        
        // Load affiliate stats (simulate for now)
        setAffiliateStats({
          referrals: 12,
          earnings: 156.50,
          clicks: 84,
          conversions: 14.3
        })
      }
    }
    
    getUser()
  }, [supabase])

  const copyAffiliateLink = () => {
    const link = `https://reveelbox.fr/signup?ref=${affiliateCode}`
    navigator.clipboard.writeText(link)
    showNotification('success', 'Lien d\'affiliation copié !')
  }

  const shareOnSocial = (platform) => {
    const link = `https://reveelbox.fr/signup?ref=${affiliateCode}`
    const text = "Découvre ReveelBox, l'expérience d'unboxing la plus excitante ! 🎁"
    
    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
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

  if (!user) {
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
                <div className="text-2xl font-bold text-green-600">{affiliateStats.referrals}</div>
                <div className="text-sm text-gray-600">Parrainages</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{affiliateStats.earnings}€</div>
                <div className="text-sm text-gray-600">Gains</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{affiliateStats.clicks}</div>
                <div className="text-sm text-gray-600">Clics</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{affiliateStats.conversions}%</div>
                <div className="text-sm text-gray-600">Conversion</div>
              </div>
            </div>
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
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre code : <span className="font-mono text-green-600">{affiliateCode}</span>
                  </label>
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg p-3">
                    <input
                      type="text"
                      readOnly
                      value={`https://reveelbox.fr/signup?ref=${affiliateCode}`}
                      className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyAffiliateLink}
                      className="ml-3 bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"
                    >
                      <Copy className="h-4 w-4" />
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
                >
                  <Share2 className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareOnSocial('facebook')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => shareOnSocial('whatsapp')}
                  className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className={`relative bg-white rounded-2xl shadow-lg p-8 border-2 ${
                    tier.popular ? 'border-green-300' : tier.borderColor
                  } ${tier.popular ? 'transform scale-105' : ''}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Populaire
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

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-500 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Rejoignez des centaines d'affiliés qui gagnent déjà de l'argent avec ReveelBox
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyAffiliateLink}
              className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2"
            >
              <Copy className="h-5 w-5" />
              Copier mon lien d'affiliation
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}