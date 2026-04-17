'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Gift, Heart, ArrowRight,
  Package, Gamepad2, Users, Shield,
  Mail, MessageCircle, Phone, HelpCircle,
  Instagram, Twitter, Youtube, Facebook,
  Zap, Crown, Star, Globe,
  ChevronRight
} from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import Link from 'next/link'

const DARK = {
  text1:   '#e2e8f0',
  text2:   '#94a3b8',
  text3:   '#64748b',
  bg:      '#080d18',
  card:    'rgba(59,130,246,0.06)',
  cardBorder: 'rgba(59,130,246,0.1)',
  sep:     'rgba(59,130,246,0.08)',
  blue:    '#3b82f6',
  blueDim: '#2563eb',
  indigo:  '#6366f1',
}

interface FooterLink {
  name: string
  href: string
  icon?: React.ComponentType<any>
}

const ReveelBoxFooter = () => {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { resolvedTheme } = useTheme()

  const productLinks: FooterLink[] = [
    { name: 'Unboxing', href: '/boxes', icon: Package },
    { name: 'Battles', href: '/battles', icon: Shield },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Free Drop', href: '/freedrop', icon: Gift },
    { name: 'Affilies', href: '/affiliates', icon: Users }
  ]

  const supportLinks: FooterLink[] = [
    { name: "Centre d'aide", href: '/help', icon: HelpCircle },
    { name: 'Contact', href: '/contact', icon: Mail },
    { name: 'Support Live', href: '/support', icon: MessageCircle },
    { name: 'FAQ', href: '/faq', icon: Phone },
    { name: 'Status', href: '/status', icon: Globe }
  ]

  const legalLinks: FooterLink[] = [
    { name: 'Conditions generales', href: '/terms' },
    { name: 'Politique de confidentialite', href: '/privacy' },
    { name: 'Mentions legales', href: '/legal' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'Reglement des jeux', href: '/game-rules' }
  ]

  const socialLinks = [
    { name: 'Instagram', href: 'https://instagram.com/reveelbox', icon: Instagram, hex: '#E1306C' },
    { name: 'Twitter', href: 'https://twitter.com/reveelbox', icon: Twitter, hex: '#1DA1F2' },
    { name: 'YouTube', href: 'https://youtube.com/reveelbox', icon: Youtube, hex: '#FF0000' },
    { name: 'Facebook', href: 'https://facebook.com/reveelbox', icon: Facebook, hex: '#1877F2' }
  ]

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubscribing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
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

  const isDark = resolvedTheme === 'dark'
  const T1 = isDark ? DARK.text1 : 'rgba(0,0,0,0.85)'
  const T2 = isDark ? DARK.text2 : 'rgba(0,0,0,0.6)'
  const T3 = isDark ? DARK.text3 : 'rgba(0,0,0,0.38)'
  const accentColor = isDark ? DARK.blue : '#2563eb'

  return (
    <footer className="relative overflow-hidden" style={{
      background: isDark
        ? DARK.bg
        : 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)'
    }}>
      {/* Separator line top */}
      <div className="h-px w-full" style={{
        background: isDark
          ? `linear-gradient(90deg, transparent, ${DARK.blue}50, ${DARK.indigo}30, transparent)`
          : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.25), rgba(99,102,241,0.2), transparent)'
      }} />

      {/* Background ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isDark && (
          <>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
              background: `radial-gradient(ellipse 80% 60% at 20% 110%, ${DARK.blue}08 0%, transparent 60%)`,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%',
              background: `radial-gradient(ellipse 80% 60% at 80% 110%, ${DARK.indigo}06 0%, transparent 60%)`,
            }} />
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.012,
              backgroundImage: `radial-gradient(${DARK.blue} 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }} />
          </>
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Logo + description + newsletter */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <img
                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/04aa1ec8-45f4-4ddf-83d9-14b50138c5b9-removebg-preview%20(1).png"
                alt="ReveelBox"
                className="w-12 h-12 object-contain"
              />
              <div>
                <div className="text-xl font-black tracking-tight" style={{ color: T1 }}>
                  Reveel<span style={{ color: accentColor }}>Box</span>
                </div>
                <div className="text-xs font-medium -mt-0.5" style={{ color: T3 }}>
                  Unbox the future
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed max-w-md" style={{ color: T2 }}>
              L&apos;experience d&apos;unboxing revolutionnaire qui transforme chaque ouverture en moment magique.
              Decouvrez des produits premium, participez a des battles epiques et vivez l&apos;adrenaline
              du gaming avec notre communaute passionnee.
            </p>

            {/* Newsletter */}
            <div className="space-y-2">
              <h4 className="font-bold flex items-center gap-2 text-sm" style={{ color: T1 }}>
                <Zap className="w-4 h-4" style={{ color: accentColor }} />
                Restez dans la boucle
              </h4>

              {isSubscribed ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3 rounded-2xl text-center"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)'
                  }}
                >
                  <p className="font-bold text-green-500 text-sm">
                    Merci ! Vous etes inscrit(e)
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    className="flex-1 px-4 py-2.5 rounded-l-xl focus:outline-none text-sm placeholder-gray-500"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                      border: isDark ? `1px solid ${DARK.cardBorder}` : '1px solid rgba(148,163,184,0.2)',
                      color: T1,
                    }}
                    disabled={isSubscribing}
                  />
                  <button
                    type="submit"
                    disabled={isSubscribing || !email}
                    className="text-white px-5 py-2.5 rounded-r-xl transition-all disabled:opacity-50 flex items-center"
                    style={{
                      background: isDark
                        ? `linear-gradient(135deg, ${DARK.blue}, ${DARK.blueDim})`
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      boxShadow: isDark ? `0 3px 12px ${DARK.blue}40` : '0 3px 12px rgba(59,130,246,0.3)',
                    }}
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </form>
              )}
              <p className="text-[11px]" style={{ color: T3 }}>
                Recevez les dernieres nouveautes et offres exclusives
              </p>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Produits */}
            <div className="space-y-3">
              <h5 className="font-bold flex items-center gap-2 text-sm" style={{ color: T1 }}>
                <Package className="w-4 h-4" style={{ color: accentColor }} />
                Produits
              </h5>
              <ul className="space-y-2">
                {productLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-sm transition-all hover:opacity-80"
                        style={{ color: T3 }}
                        onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                        onMouseLeave={e => (e.currentTarget.style.color = T3)}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {link.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <h5 className="font-bold flex items-center gap-2 text-sm" style={{ color: T1 }}>
                <MessageCircle className="w-4 h-4" style={{ color: accentColor }} />
                Support
              </h5>
              <ul className="space-y-2">
                {supportLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-2 text-sm transition-all"
                        style={{ color: T3 }}
                        onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                        onMouseLeave={e => (e.currentTarget.style.color = T3)}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        {link.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Social */}
              <div className="pt-3">
                <h6 className="font-semibold mb-2 text-xs" style={{ color: T2 }}>Suivez-nous</h6>
                <div className="flex gap-2">
                  {socialLinks.map((social) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          background: isDark ? DARK.card : 'rgba(0,0,0,0.04)',
                          border: isDark ? `1px solid ${DARK.cardBorder}` : '1px solid rgba(148,163,184,0.15)'
                        }}
                        title={social.name}
                      >
                        <Icon className="w-4 h-4" style={{ color: social.hex }} />
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h5 className="font-bold flex items-center gap-2 text-sm" style={{ color: T1 }}>
                <Shield className="w-4 h-4" style={{ color: accentColor }} />
                Legal
              </h5>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm flex items-center gap-1 group transition-all"
                      style={{ color: T3 }}
                      onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                      onMouseLeave={e => (e.currentTarget.style.color = T3)}
                    >
                      {link.name}
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs" style={{ color: T3 }}>
                  <Shield className="w-3 h-3" style={{ color: accentColor }} />
                  Paiements 100% securises
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T3 }}>
                  <Crown className="w-3 h-3" style={{ color: accentColor }} />
                  Certifie Premium
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: T3 }}>
                  <Star className="w-3 h-3" style={{ color: accentColor }} />
                  Service client 24/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="h-px w-full" style={{
        background: isDark ? DARK.sep : 'rgba(0,0,0,0.06)'
      }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-center sm:text-left" style={{ color: T3 }}>
            &copy; 2025 ReveelBox. Tous droits reserves.
            <span className="hidden sm:inline"> &bull; Made with </span>
            <Heart className="w-3 h-3 text-red-500 inline mx-1" />
            <span className="hidden sm:inline"> in France</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]" style={{ color: T3 }}>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span>Systemes operationnels</span>
            </div>
            <div className="h-3 w-px" style={{ background: isDark ? DARK.cardBorder : 'rgba(0,0,0,0.1)' }}></div>
            <span>v2.3.0</span>
            <div className="h-3 w-px" style={{ background: isDark ? DARK.cardBorder : 'rgba(0,0,0,0.1)' }}></div>
            <Link href="/status" className="flex items-center gap-1 transition-opacity hover:opacity-70">
              Status
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default ReveelBoxFooter
