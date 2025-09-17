'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
      setEmail('')
    } catch (error) {
      console.error('Erreur newsletter:', error)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <footer className="relative bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-emerald-900/20 overflow-hidden">
      {/* Motifs de fond décoratifs */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-500 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-500 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-500 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-18 h-18 bg-pink-500 rounded-full blur-xl animate-pulse delay-3000"></div>
      </div>

      <div className="relative">
        {/* Section principale du footer */}
        <div className="max-w-7xl mx-auto px-6 py-16">
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
                    Reveel<span className="text-emerald-500">Box</span>
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

              {/* Newsletter */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Restez dans la boucle
                </h4>
                <form onSubmit={handleNewsletterSubmit} className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    disabled={isSubscribing}
                  />
                  <button 
                    type="submit"
                    disabled={isSubscribing || !email}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-r-2xl transition-all duration-200 font-medium flex items-center gap-2 shadow-lg disabled:cursor-not-allowed"
                  >
                    {isSubscribing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </form>
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
                  <Package className="w-4 h-4 text-emerald-500" />
                  Produits
                </h5>
                <ul className="space-y-3">
                  {productLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <li key={link.name}>
                        <a 
                          href={link.href}
                          className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 text-sm group"
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
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  Support
                </h5>
                <ul className="space-y-3">
                  {supportLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <li key={link.name}>
                        <a 
                          href={link.href}
                          className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2 text-sm group"
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
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Légal
                </h5>
                <ul className="space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.name}>
                      <a 
                        href={link.href}
                        className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm flex items-center gap-2 group"
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
                    <Shield className="w-3 h-3 text-emerald-500" />
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
        </div>

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
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Tous systèmes opérationnels</span>
                </div>
                <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                <span>Version 2.1.0</span>
                <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                <a 
                  href="/status" 
                  className="hover:text-emerald-500 transition-colors flex items-center gap-1"
                >
                  Status
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
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