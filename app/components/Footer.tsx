'use client'

import React, { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { 
  Gift, Heart, ArrowRight, 
  Package, Gamepad2, Users, Shield,
  Mail, MessageCircle, Phone, HelpCircle,
  Instagram, Twitter, Youtube, Facebook,
  Sparkles, Zap, Crown, Star, Globe,
  ChevronRight, ExternalLink
} from 'lucide-react'

// Types basés sur la database ReveelBox
interface FooterLink {
  name: string
  href: string
  icon?: React.ComponentType<any>
  external?: boolean
}

interface SocialLink {
  name: string
  href: string
  icon: React.ComponentType<any>
  color: string
  hoverColor: string
}

const ReveelBoxFooter = () => {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const footerRef = useRef(null)
  const inView = useInView(footerRef, { once: true, margin: '-100px' })

  // Liens de navigation basés sur la structure ReveelBox
  const productLinks: FooterLink[] = [
    { name: 'Unboxing', href: '/boxes', icon: Package },
    { name: 'Battles', href: '/battles', icon: Shield },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Free Drop', href: '/freedrop', icon: Gift },
    { name: 'Affiliés', href: '/affiliates', icon: Users }
  ]

  const supportLinks: FooterLink[] = [
    { name: 'Centre d\'aide', href: '/help', icon: HelpCircle },
    { name: 'Contact', href: '/contact', icon: Mail },
    { name: 'Support Live', href: '/support', icon: MessageCircle },
    { name: 'FAQ', href: '/faq', icon: Phone },
    { name: 'Status', href: '/status', icon: Globe }
  ]

  const legalLinks: FooterLink[] = [
    { name: 'Conditions générales', href: '/terms' },
    { name: 'Politique de confidentialité', href: '/privacy' },
    { name: 'Mentions légales', href: '/legal' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'Règlement des jeux', href: '/game-rules' }
  ]

  const socialLinks: SocialLink[] = [
    { 
      name: 'Instagram', 
      href: 'https://instagram.com/reveelbox',
      icon: Instagram,
      color: 'from-pink-500 to-purple-600',
      hoverColor: 'hover:from-pink-600 hover:to-purple-700'
    },
    { 
      name: 'Twitter', 
      href: 'https://twitter.com/reveelbox',
      icon: Twitter,
      color: 'from-blue-400 to-blue-600',
      hoverColor: 'hover:from-blue-500 hover:to-blue-700'
    },
    { 
      name: 'YouTube', 
      href: 'https://youtube.com/reveelbox',
      icon: Youtube,
      color: 'from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700'
    },
    { 
      name: 'Facebook', 
      href: 'https://facebook.com/reveelbox',
      icon: Facebook,
      color: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:from-blue-700 hover:to-indigo-700'
    }
  ]

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubscribing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Newsletter subscription:', email)
      setIsSubscribed(true)
      setTimeout(() => {
        setEmail('')
        setIsSubscribed(false)
      }, 3000)
    } catch (error) {
      console.error('Erreur newsletter:', error)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <footer ref={footerRef} className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
      {/* Motifs de fond décoratifs améliorés */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute top-32 right-20 w-24 h-24 bg-purple-500 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-36 h-36 bg-blue-500 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      <div className="relative">
        {/* Section principale du footer */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-6 py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Colonne principale avec logo et description */}
            <div className="lg:col-span-5 space-y-6">
              {/* Logo et nom */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/04aa1ec8-45f4-4ddf-83d9-14b50138c5b9-removebg-preview%20(1).png" 
                    alt="ReveelBox" 
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Reveel<span style={{ color: 'var(--hybrid-accent-primary)' }}>Box</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium -mt-1">
                    Unbox the future
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                L'expérience d'unboxing révolutionnaire qui transforme chaque ouverture en moment magique. 
                Découvrez des produits premium, participez à des battles épiques et vivez l'adrénaline 
                du gaming avec notre communauté passionnée.
              </p>

              {/* Newsletter améliorée */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <motion.div
                    animate={{
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <Zap className="w-4 h-4" style={{ color: 'var(--hybrid-accent-primary)' }} />
                  </motion.div>
                  Restez dans la boucle
                </h4>

                {isSubscribed ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-2xl text-center"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360]
                      }}
                      transition={{ duration: 0.6 }}
                      className="w-12 h-12 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                    <p className="font-bold text-green-700 dark:text-green-400">
                      Merci ! Vous êtes inscrit(e)
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-2xl focus:outline-none focus:ring-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      style={{
                        '--tw-ring-color': 'var(--hybrid-accent-primary)'
                      } as React.CSSProperties}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--hybrid-accent-primary)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = ''}
                      disabled={isSubscribing}
                    />
                    <motion.button
                      type="submit"
                      disabled={isSubscribing || !email}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-white px-6 py-3 rounded-r-2xl transition-all duration-200 font-medium flex items-center gap-2 shadow-lg disabled:cursor-not-allowed hybrid-btn-primary-gradient disabled:from-gray-400 disabled:to-gray-500"
                    >
                      {isSubscribing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </motion.button>
                  </form>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Recevez les dernières nouveautés et offres exclusives
                </p>
              </div>
            </div>

            {/* Colonnes de liens */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Produits */}
              <div className="space-y-4">
                <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4" style={{ color: 'var(--hybrid-accent-primary)' }} />
                  Produits
                </h5>
                <ul className="space-y-3">
                  {productLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-2 text-sm group"
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hybrid-accent-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                          {link.name}
                          {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" style={{ color: 'var(--hybrid-accent-primary)' }} />
                  Support
                </h5>
                <ul className="space-y-3">
                  {supportLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-2 text-sm group"
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hybrid-accent-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                          {link.name}
                          {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                        </a>
                      </li>
                    )
                  })}
                </ul>

                {/* Réseaux sociaux */}
                <div className="pt-4">
                  <h6 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                    Suivez-nous
                  </h6>
                  <div className="flex gap-3">
                    {socialLinks.map((social) => {
                      const Icon = social.icon
                      return (
                        <motion.a
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-10 h-10 bg-gradient-to-r ${social.color} ${social.hoverColor} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200`}
                          title={`Suivez-nous sur ${social.name}`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </motion.a>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Légal & Communauté */}
              <div className="space-y-4">
                <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" style={{ color: 'var(--hybrid-accent-primary)' }} />
                  Légal
                </h5>
                <ul className="space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-gray-600 dark:text-gray-400 transition-colors text-sm flex items-center gap-2 group"
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hybrid-accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = ''}
                      >
                        {link.name}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Badges de confiance */}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Shield className="w-3 h-3" style={{ color: 'var(--hybrid-accent-primary)' }} />
                    Paiements 100% sécurisés
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Crown className="w-3 h-3 text-yellow-500" />
                    Certifié Premium
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Star className="w-3 h-3 text-blue-500" />
                    Service client 24/7
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section du bas */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
                © 2025 ReveelBox. Tous droits réservés. 
                <span className="hidden sm:inline"> • Made with </span>
                <Heart className="w-3 h-3 text-red-500 inline mx-1" />
                <span className="hidden sm:inline"> in France</span>
              </div>
              
              <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--hybrid-accent-primary)' }}></div>
                  <span>Tous systèmes opérationnels</span>
                </div>
                <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                <span>Version 2.1.0</span>
                <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                <a
                  href="/status"
                  className="transition-colors flex items-center gap-1"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hybrid-accent-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                >
                  Status
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--hybrid-accent-primary)' }}></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default ReveelBoxFooter