'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Gift, Package, Sword, Users, User, LogOut, X,
  ShoppingCart, Sparkles, Plus, ChevronDown,
  Monitor, Sun, Moon, Shield, TrendingUp, Gamepad2,
  Menu, Zap, Crown, Star, Flame, ArrowRight, ChevronUp, Mail, CreditCard
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'

// Types
interface InventoryItem {
  id: string
  quantity: number
  obtained_at: string
  items: {
    id: string
    name: string
    image_url: string
    rarity: string
    market_value: number
  } | null
}

const UpgradeModal = dynamic(() => import('@/app/components/UpgradeModal'), {
  ssr: false,
  loading: () => null
})

const CartModal = dynamic(() => import('@/app/components/CartModal'), {
  ssr: false,
  loading: () => null
})

const PaymentModal = dynamic(() => import('@/app/components/PaymentModal'), {
  ssr: false,
  loading: () => null
})

// Wrapper pour l'espacement avec gestion automatique de la navbar
interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = "" }) => {
  const [isNavbarHidden, setIsNavbarHidden] = React.useState(false)

  React.useEffect(() => {
    // Lire l'état initial
    const savedState = localStorage.getItem('navbarHidden')
    setIsNavbarHidden(savedState === 'true')

    // Écouter les changements
    const handleToggle = () => {
      const newState = localStorage.getItem('navbarHidden') === 'true'
      setIsNavbarHidden(newState)
    }

    window.addEventListener('navbarToggle', handleToggle)
    return () => window.removeEventListener('navbarToggle', handleToggle)
  }, [])

  return (
    <div
      className={`transition-all duration-300 ${className}`}
      style={{ paddingTop: isNavbarHidden ? '0px' : '96px' }}
    >
      {children}
    </div>
  )
}

// NAVBAR PREMIUM - FULL WIDTH
export default function ReveelBoxNavbar() {
  const { user, profile, signOut, isAuthenticated, loading, refreshProfile } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false)
  const [cartItems, setCartItems] = useState<InventoryItem[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [navbarHidden, setNavbarHidden] = useState(false)
  const [selectedCartItems, setSelectedCartItems] = useState<string[]>([])

  const cartButtonRef = useRef(null)
  const paymentButtonRef = useRef(null)

  // Charger l'état de la navbar depuis localStorage au montage
  useEffect(() => {
    const savedState = localStorage.getItem('navbarHidden')
    if (savedState !== null) {
      setNavbarHidden(savedState === 'true')
    }
  }, [])

  // Sauvegarder l'état dans localStorage quand il change
  const toggleNavbar = () => {
    const newState = !navbarHidden
    setNavbarHidden(newState)
    localStorage.setItem('navbarHidden', String(newState))
    window.dispatchEvent(new Event('navbarToggle'))
  }

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const gamesMenuRef = useRef<HTMLDivElement>(null)

  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@reveelbox.com'

  const navItems = [
    { href: '/boxes', label: 'Unboxing', icon: Package },
    { href: '/battles', label: 'Battles', icon: Sword },
    { href: '/games', label: 'Games', icon: Gamepad2, hasDropdown: true },
    { href: '/affiliates', label: 'Affiliés', icon: Users },
    { href: '/freedrop', label: 'Free Drop', icon: Gift },
  ]

  const gamesDropdownItems = [
    { href: '/games/crash', label: 'Crash', icon: TrendingUp, gradient: 'from-red-500 to-orange-500' },
    { href: '/games/roulette', label: 'Roulette', icon: Crown, gradient: 'from-yellow-500 to-amber-500', comingSoon: true },
    { href: '/games/coinflip', label: 'Coinflip', icon: Zap, gradient: 'from-blue-500 to-cyan-500', comingSoon: true },
  ]

  // Gestion scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (gamesMenuRef.current && !gamesMenuRef.current.contains(e.target as Node)) {
        setGamesMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Chargement inventaire
  useEffect(() => {
    const loadCartItems = async () => {
      if (!isAuthenticated || !user) {
        setCartItems([])
        return
      }

      try {
        const { data: inventory, error } = await supabase
          .from('user_inventory')
          .select(`
            id,
            quantity,
            obtained_at,
            items (
              id,
              name,
              image_url,
              rarity,
              market_value
            )
          `)
          .eq('user_id', user.id)
          .eq('is_sold', false)
          .order('obtained_at', { ascending: false })
          .limit(15)

        if (!error && inventory) {
          setCartItems(inventory.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            obtained_at: item.obtained_at,
            items: item.items || null
          })))
        }
      } catch (error) {
        console.error('Erreur:', error)
      }
    }

    loadCartItems()

    if (!isAuthenticated || !user) {
      return
    }

    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadCartItems()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, user, supabase])

  if (loading) return null

  return (
    <>
      {/* NAVBAR MODERNE & ÉLÉGANTE */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: navbarHidden ? -100 : 0,
          opacity: navbarHidden ? 0 : 1
        }}
        transition={{ duration: 0.15, type: "spring", stiffness: 500, damping: 30 }}
        style={{
          background: isScrolled
            ? 'var(--hybrid-bg-elevated)'
            : `rgba(${resolvedTheme === 'dark' ? '10, 10, 11' : '253, 252, 250'}, 0.6)`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: isScrolled ? '1px solid var(--hybrid-border-default)' : 'none',
          boxShadow: isScrolled ? 'var(--hybrid-shadow-lg)' : 'none'
        }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      >
        {/* Barre lumineuse supérieure animée hybrid */}
        <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`,
              opacity: 0.6
            }}
            animate={{
              x: ['-200%', '200%'],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2
            }}
          />
          <div className="absolute inset-0" style={{
            background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary), var(--hybrid-accent-primary))`,
            opacity: 0.1
          }} />
        </div>

        {/* Dégradé de fond élégant hybrid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary), var(--hybrid-accent-primary))`,
          opacity: 0.02
        }} />

        <div className="w-full px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LOGO SECTION - Design Premium */}
            <div className="flex items-center gap-8">
              {/* Burger Menu Mobile élégant */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden relative p-2.5 rounded-xl transition-all group overflow-hidden"
                style={{
                  '--hover-bg': 'var(--hybrid-accent-primary)',
                  '--hover-color': 'var(--hybrid-accent-primary)'
                } as React.CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                  background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                  opacity: 0.1
                }} />
                <Menu className="relative h-5 w-5 text-gray-600 dark:text-gray-400 transition-colors duration-300" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hybrid-accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = ''} />
              </motion.button>

              {/* Logo Premium avec animations */}
              <Link href="/" className="group flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  {/* Effet de halo rotatif (plus subtil) - utilise les couleurs hybrid */}
                  <motion.div
                    className="absolute -inset-2 rounded-2xl blur-xl opacity-0 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary), var(--hybrid-accent-primary))`,
                      opacity: 0.2
                    }}
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />

                  <motion.img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/04aa1ec8-45f4-4ddf-83d9-14b50138c5b9-removebg-preview%20(1).png"
                    alt="ReveelBox"
                    className="relative h-12 w-12 object-contain transition-all duration-300 group-hover:brightness-110"
                  />
                </motion.div>

                <div className="hidden sm:block">
                  <motion.div
                    className="relative"
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <span className="text-xl font-black tracking-tight" style={{
                      background: `linear-gradient(90deg, var(--hybrid-text-primary), var(--hybrid-accent-primary), var(--hybrid-text-primary))`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      REVEELBOX
                    </span>
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-[2px]"
                      style={{
                        background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`
                      }}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </div>
              </Link>
            </div>

            {/* NAVIGATION DESKTOP - Design Élégant avec Animations */}
            <div className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href === '/games' && pathname.startsWith('/games'))

                if (item.hasDropdown) {
                  return (
                    <div key={item.href} className="relative" ref={gamesMenuRef}>
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setGamesMenuOpen(!gamesMenuOpen)}
                        className={`relative px-5 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl flex items-center gap-2.5 group overflow-hidden ${
                          isActive
                            ? 'dark:text-white'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                        style={isActive ? { color: 'var(--hybrid-accent-primary)' } : {}}
                      >
                        {/* Background animé au hover */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`,
                            opacity: 0.1
                          }}
                          animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />

                        {/* Indicateur actif */}
                        {isActive && (
                          <motion.div
                            layoutId="navbar-active-indicator"
                            className="absolute inset-0 rounded-xl shadow-lg"
                            style={{
                              background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`,
                              opacity: 0.2,
                              borderColor: 'var(--hybrid-accent-primary)',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}

                        <Icon className="relative h-4.5 w-4.5 group-hover:scale-110 transition-transform duration-300" />
                        <span className="relative">{item.label}</span>
                        <ChevronDown className={`relative h-4 w-4 transition-all duration-300 ${gamesMenuOpen ? 'rotate-180' : ''}`} style={gamesMenuOpen ? { color: 'var(--hybrid-accent-primary)' } : {}} />

                        {/* Effet de lueur au survol */}
                        <motion.div
                          className="absolute -bottom-1 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`
                          }}
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.button>

                      <AnimatePresence>
                        {gamesMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute top-full mt-3 left-0 w-72 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-2 border-gray-200/80 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden"
                            style={{ borderColor: 'var(--hybrid-border-default)' }}
                          >
                            {/* Barre décorative */}
                            <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`, opacity: 0.6 }} />

                            <div className="p-3">
                              {gamesDropdownItems.map((game, index) => {
                                const GameIcon = game.icon
                                return (
                                  <motion.button
                                    key={game.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.06, type: "spring", stiffness: 200 }}
                                    onClick={() => !game.comingSoon && (router.push(game.href), setGamesMenuOpen(false))}
                                    disabled={game.comingSoon}
                                    whileHover={!game.comingSoon ? { x: 4, transition: { duration: 0.2 } } : {}}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${
                                      game.comingSoon
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                                    style={!game.comingSoon ? {
                                      '--hover-bg': 'rgba(var(--hybrid-accent-primary-rgb), 0.1)'
                                    } as React.CSSProperties : {}}
                                  >
                                    <motion.div
                                      whileHover={!game.comingSoon ? { rotate: 5, scale: 1.1 } : {}}
                                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                      className={`w-12 h-12 bg-gradient-to-br ${game.gradient} rounded-xl flex items-center justify-center shadow-lg`}
                                    >
                                      <GameIcon className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm transition-colors" onMouseEnter={(e) => !game.comingSoon && (e.currentTarget.style.color = 'var(--hybrid-accent-primary)')} onMouseLeave={(e) => e.currentTarget.style.color = ''}>{game.label}</span>
                                        {game.comingSoon && (
                                          <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500 dark:text-orange-400 text-[10px] rounded-full font-bold border border-orange-500/30">BIENTÔT</span>
                                        )}
                                      </div>
                                    </div>
                                    {!game.comingSoon && (
                                      <ArrowRight className="h-4 w-4 text-gray-400 transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hybrid-accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = ''} />
                                    )}
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }

                return (
                  <motion.button
                    key={item.href}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(item.href)}
                    className={`relative px-5 py-2.5 text-sm font-bold transition-all duration-300 rounded-xl flex items-center gap-2.5 group overflow-hidden ${
                      isActive
                        ? 'dark:text-white'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                    style={isActive ? { color: 'var(--hybrid-accent-primary)' } : {}}
                  >
                    {/* Background animé au hover */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100"
                      style={{
                        background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`,
                        opacity: 0.1
                      }}
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />

                    {/* Indicateur actif */}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-indicator"
                        className="absolute inset-0 rounded-xl shadow-lg"
                        style={{
                          background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`,
                          opacity: 0.2,
                          borderColor: 'var(--hybrid-accent-primary)',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    <Icon className="relative h-4.5 w-4.5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative">{item.label}</span>

                    {/* Effet de lueur au survol */}
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100"
                      style={{
                        background: `linear-gradient(90deg, transparent, var(--hybrid-accent-primary), transparent)`
                      }}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                )
              })}
            </div>

            {/* ACTIONS DROITE - Design Premium */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {/* Balance Premium avec effets */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-gray-100/80 via-gray-50/80 to-gray-100/80 dark:from-slate-900/60 dark:via-slate-800/60 dark:to-slate-900/60 backdrop-blur-xl rounded-full border border-gray-300/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/50 dark:shadow-black/20 group"
                  >
                    <motion.img
                      animate={{
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                      alt="Coins"
                      className="h-6 w-6"
                    />
                    <span className="font-black text-gray-900 dark:text-white text-base">{profile?.virtual_currency?.toLocaleString() || '0'}</span>
                    <motion.button
                      ref={paymentButtonRef}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setCartOpen(false)
                        setPaymentModalOpen(true)
                      }}
                      className="p-2 rounded-full transition-all shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                        boxShadow: `0 4px 12px rgba(var(--hybrid-accent-primary), 0.3)`
                      }}
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </motion.button>
                  </motion.div>

                  {/* Panier avec animations */}
                  <motion.button
                    ref={cartButtonRef}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setPaymentModalOpen(false)
                      setCartOpen(true)
                    }}
                    className="relative p-3 bg-gradient-to-br from-gray-100/80 to-gray-50/80 dark:from-slate-900/60 dark:to-slate-800/60 backdrop-blur-xl rounded-xl border border-gray-300/50 dark:border-gray-700/50 hover:border-gray-600/50 transition-all shadow-lg shadow-gray-200/50 dark:shadow-black/20 group"
                  >
                    <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    {cartItems.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                          boxShadow: `0 4px 12px rgba(var(--hybrid-accent-primary), 0.5)`
                        }}
                      >
                        <span className="text-xs font-black text-white">{cartItems.length}</span>
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Avatar Menu Premium */}
                  <div className="relative" ref={userMenuRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="relative h-11 w-11 rounded-full p-[2px] shadow-xl hover:shadow-2xl transition-all duration-500 group"
                      style={{
                        background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                      }}
                    >
                      {/* Halo rotatif au hover */}
                      <motion.div
                        className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-60 blur-lg"
                        style={{
                          background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                        }}
                        animate={{
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />

                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="relative h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="relative h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </motion.button>

                    {/* Dropdown Menu minimaliste et élégant */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute top-full right-0 mt-2 w-60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden"
                        >
                          {/* Header minimaliste */}
                          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 p-0.5">
                                {profile?.avatar_url ? (
                                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  <div className="h-full w-full rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500">
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{profile?.username || 'Utilisateur'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Niveau {profile?.level || 1}</p>
                              </div>
                            </div>
                          </div>

                          {/* Menu items épuré */}
                          <div className="p-2">
                            <button
                              onClick={() => { router.push('/profile'); setUserMenuOpen(false) }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-lg transition-all text-sm font-medium hybrid-menu-item"
                            >
                              <User className="h-4 w-4" />
                              <span>Profil</span>
                            </button>

                            <button
                              onClick={() => { router.push('/inventory'); setUserMenuOpen(false) }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-lg transition-all text-sm font-medium hybrid-menu-item"
                            >
                              <Package className="h-4 w-4" />
                              <span>Inventaire</span>
                            </button>

                            <button
                              onClick={() => { router.push('/contact'); setUserMenuOpen(false) }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-lg transition-all text-sm font-medium hybrid-menu-item"
                            >
                              <Mail className="h-4 w-4" />
                              <span>Contact</span>
                            </button>

                            {/* Theme toggle compact */}
                            <div className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-500/5 dark:hover:bg-gray-500/10 rounded-lg transition-all mt-1">
                              <div className="flex items-center gap-3">
                                <Monitor className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Thème</span>
                              </div>
                              <button
                                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                                className="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full p-0.5 transition-colors"
                              >
                                <motion.div
                                  className="h-5 w-5 rounded-full flex items-center justify-center shadow-md"
                                  style={{
                                    background: resolvedTheme === 'dark'
                                      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                                      : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                                  }}
                                  animate={{ x: resolvedTheme === 'dark' ? 20 : 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                >
                                  {resolvedTheme === 'dark' ? (
                                    <Moon className="h-3 w-3 text-white" />
                                  ) : (
                                    <Sun className="h-3 w-3 text-white" />
                                  )}
                                </motion.div>
                              </button>
                            </div>

                            {isAdmin && (
                              <>
                                <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
                                <button
                                  onClick={() => { router.push('/admin'); setUserMenuOpen(false) }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all text-sm font-medium"
                                >
                                  <Shield className="h-4 w-4" />
                                  <span>Admin</span>
                                </button>
                              </>
                            )}

                            <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />

                            <button
                              onClick={() => { signOut(); setUserMenuOpen(false) }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm font-medium"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Déconnexion</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/login"
                      className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all rounded-xl hover:bg-gradient-to-r hover:from-slate-800/30 hover:to-slate-700/30"
                    >
                      Connexion
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/signup"
                      className="relative px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-xl transition-all overflow-hidden group"
                      style={{
                        background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                      }}
                    >
                      {/* Effet de brillance animé */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ['-200%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                          repeatDelay: 1
                        }}
                      />
                      <span className="relative">S'inscrire</span>
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barre inférieure élégante (plus subtile) */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500/30 to-transparent"
            animate={{
              x: ['100%', '-100%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent" />
        </div>

      </motion.nav>

      {/* Toggle Arrow - Toujours visible même quand la navbar est masquée */}
      <motion.button
        onClick={toggleNavbar}
        className="fixed left-1/2 p-1.5 backdrop-blur-xl border border-t-0 rounded-b-lg transition-all shadow-lg group z-50"
        style={{
          background: 'var(--hybrid-bg-elevated)',
          borderColor: 'var(--hybrid-border-default)',
          transform: 'translateX(-50%)'
        }}
        animate={{
          top: navbarHidden ? '0px' : '79px'
        }}
        transition={{ duration: 0.15, type: "spring", stiffness: 500, damping: 30 }}
      >
        <motion.div
          animate={{ rotate: navbarHidden ? 180 : 0 }}
          transition={{ duration: 0.15, type: "spring", stiffness: 500, damping: 30 }}
        >
          <ChevronUp
            className="h-3 w-3 transition-colors"
            style={{ color: 'var(--hybrid-accent-primary)' }}
          />
        </motion.div>
      </motion.button>

      {/* MENU MOBILE */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-r-2 border-gray-200/80 dark:border-gray-700/50 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="flex items-center justify-between mb-8"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                      className="h-12 w-12 rounded-2xl border-2 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                        opacity: 0.2,
                        borderColor: 'var(--hybrid-accent-primary)'
                      }}
                    >
                      <img
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/04aa1ec8-45f4-4ddf-83d9-14b50138c5b9-removebg-preview%20(1).png"
                        alt="ReveelBox"
                        className="h-8 w-8 object-contain"
                      />
                    </motion.div>
                    <span className="text-xl font-black text-gray-900 dark:text-white">REVEELBOX</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                  >
                    <X className="h-6 w-6 text-gray-900 dark:text-white" />
                  </motion.button>
                </motion.div>

                {/* Balance mobile */}
                {isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mb-6 p-4 rounded-2xl border-2"
                    style={{
                      background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                      opacity: 0.1,
                      borderColor: 'var(--hybrid-accent-primary)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.img
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="h-6 w-6"
                        />
                        <span className="font-black text-gray-900 dark:text-white text-lg">{profile?.virtual_currency?.toLocaleString() || '0'}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setPaymentModalOpen(true); setMobileMenuOpen(false) }}
                        className="px-4 py-2 text-white rounded-xl text-sm font-bold shadow-lg hybrid-btn-primary-gradient"
                      >
                        Recharger
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="space-y-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <motion.button
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                        onClick={() => { router.push(item.href); setMobileMenuOpen(false) }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                          isActive
                            ? 'text-gray-900 dark:text-white border-2'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                        style={isActive ? {
                          background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
                          opacity: 0.2,
                          borderColor: 'var(--hybrid-accent-primary)'
                        } : {}}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="font-bold text-lg">{item.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems.map(item => ({
          id: item.id,
          name: item.items?.name || 'Unknown',
          image_url: item.items?.image_url || '',
          market_value: item.items?.market_value || 0,
          rarity: item.items?.rarity || 'common',
          quantity: item.quantity
        }))}
        selectedItems={selectedCartItems}
        onSelectItem={(id) => {
          setSelectedCartItems(prev =>
            prev.includes(id)
              ? prev.filter(itemId => itemId !== id)
              : [...prev, id]
          )
        }}
        onSelectAll={() => {
          setSelectedCartItems(
            selectedCartItems.length === cartItems.length
              ? []
              : cartItems.map(item => item.id)
          )
        }}
        onSellSelected={async () => {
          try {
            // Calculer la valeur totale des items sélectionnés
            const itemsToSell = cartItems.filter(item => selectedCartItems.includes(item.id))
            const totalValue = itemsToSell.reduce((sum, item) => {
              return sum + (item.items?.market_value || 0) * item.quantity
            }, 0)

            // Marquer les items comme vendus
            const { error: sellError } = await supabase
              .from('user_inventory')
              .update({ is_sold: true })
              .in('id', selectedCartItems)

            if (sellError) throw sellError

            // Créditer les coins au profil de l'utilisateur
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                virtual_currency: (profile?.virtual_currency || 0) + totalValue
              })
              .eq('id', user?.id)

            if (updateError) throw updateError

            // Rafraîchir le profil sans recharger la page
            await refreshProfile()

            // Retirer les items vendus du panier
            setCartItems(prevItems => prevItems.filter(item => !selectedCartItems.includes(item.id)))

            // Nettoyer la sélection et fermer le modal
            setSelectedCartItems([])
            setCartOpen(false)
          } catch (err) {
            console.error('Error selling items:', err)
          }
        }}
        onUpgrade={() => {
          setCartOpen(false)
          router.push('/upgrade')
        }}
        buttonRef={cartButtonRef}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        buttonRef={paymentButtonRef}
      />
    </>
  )
}
