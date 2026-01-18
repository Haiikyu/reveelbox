'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Gift, Package, Sword, Users, User, LogOut, X,
  ShoppingCart, Sparkles, Plus, ChevronDown, ChevronRight,
  Monitor, Sun, Moon, Shield, TrendingUp, Gamepad2,
  Menu, Zap, Crown, Star, Flame, ArrowRight, ChevronUp, Mail, CreditCard
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'
import LoginModal from './LoginModal'
import SignupModal from './SignupModal'

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

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = "" }) => {
  const [isNavbarHidden, setIsNavbarHidden] = React.useState(false)

  React.useEffect(() => {
    const savedState = localStorage.getItem('navbarHidden')
    setIsNavbarHidden(savedState === 'true')

    const handleToggle = () => {
      const newState = localStorage.getItem('navbarHidden') === 'true'
      setIsNavbarHidden(newState)
    }

    window.addEventListener('navbarToggle', handleToggle)
    return () => window.removeEventListener('navbarToggle', handleToggle)
  }, [])

  return (
    <motion.div
      className={className}
      animate={{
        paddingTop: isNavbarHidden ? '0px' : '64px'
      }}
      transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 25 }}
    >
      {children}
    </motion.div>
  )
}

export default function ReveelBoxNavbar() {
  const { user, profile, signOut, isAuthenticated, loading, refreshProfile } = useAuth()
  const [userPins, setUserPins] = useState<Array<{id: string, svg_code: string}>>([])
  const [avatarFrame, setAvatarFrame] = useState<string | null>(null)
  const [bannerSvg, setBannerSvg] = useState<string | null>(null)
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const supabase = createClient()

  // Charger les pins équipés + cadre + bannière + rang
  useEffect(() => {
    if (user) {
      loadEquippedPins()
      loadAvatarFrame()
      loadBanner()
      loadLeaderboardRank()
    }
  }, [user, profile])

  const loadEquippedPins = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_pins')
        .select(`
          pin_id,
          shop_pins (
            id,
            svg_code
          )
        `)
        .eq('user_id', user.id)
        .eq('is_equipped', true)
        .limit(5)
      
      if (error) throw error
      
      const pins = (data || [])
        .filter((item): item is typeof item & { shop_pins: { id: any; svg_code: any } } =>
          item.shop_pins !== null && !Array.isArray(item.shop_pins)
        )
        .map(item => ({
          id: item.shop_pins.id,
          svg_code: item.shop_pins.svg_code
        }))
      
      setUserPins(pins)
    } catch (error) {
      console.error('Erreur chargement pins:', error)
    }
  }

  const loadAvatarFrame = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_frames')
        .select(`
          frame_id,
          shop_frames (
            svg_code
          )
        `)
        .eq('user_id', user.id)
        .eq('is_equipped', true)
        .single()
      
      if (error) {
        setAvatarFrame(null)
        return
      }

      const shopFrames = data?.shop_frames as unknown as { svg_code: string } | null | undefined
      if (shopFrames && !Array.isArray(shopFrames) && shopFrames.svg_code) {
        setAvatarFrame(shopFrames.svg_code)
      }
    } catch (error) {
      setAvatarFrame(null)
    }
  }

  const loadBanner = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_banners')
        .select(`
          banner_id,
          shop_banners (
            svg_code
          )
        `)
        .eq('user_id', user.id)
        .eq('is_equipped', true)
        .single()
      
      if (error) {
        setBannerSvg(null)
        return
      }

      const shopBanners = data?.shop_banners as unknown as { svg_code: string } | null | undefined
      if (shopBanners && !Array.isArray(shopBanners) && shopBanners.svg_code) {
        setBannerSvg(shopBanners.svg_code)
      }
    } catch (error) {
      setBannerSvg(null)
    }
  }

  const loadLeaderboardRank = async () => {
    if (!user || !profile) return
    
    try {
      // Calculer le rang en temps réel en comptant combien de joueurs ont plus de coins dépensés
      const userCoins = (profile as any).total_coins_spent || 0

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('total_coins_spent', userCoins)
      
      if (error) throw error
      
      // Rang = nombre de joueurs avec plus de coins + 1
      setLeaderboardRank(count !== null ? count + 1 : null)
    } catch (error) {
      console.error('Erreur chargement rang:', error)
      setLeaderboardRank(null)
    }
  }
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

  useEffect(() => {
    const savedState = localStorage.getItem('navbarHidden')
    if (savedState !== null) {
      setNavbarHidden(savedState === 'true')
    }
  }, [])

  const toggleNavbar = () => {
    const newState = !navbarHidden
    setNavbarHidden(newState)
    localStorage.setItem('navbarHidden', String(newState))
    window.dispatchEvent(new Event('navbarToggle'))
  }

  const router = useRouter()
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const gamesMenuRef = useRef<HTMLDivElement>(null)

  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@reveelbox.com'

  const navItems = [
    { href: '/boxes', label: 'Unboxing', icon: Package },
    { href: '/battles', label: 'Battles', icon: Sword },
    { href: '/games', label: 'Games', icon: Gamepad2, hasDropdown: true },
    { href: '/affiliates', label: 'Affiliés', icon: Users },
    { href: '/freedrop', label: 'Free Drop', icon: Gift },
    { href: '/shop', label: 'Shop', icon: ShoppingCart, gradient: 'from-purple-500 to-pink-500' },
    { href: '/leaderboard', label: 'Leaderboard', icon: Crown, gradient: 'from-yellow-500 to-orange-500' },
  ]

  const gamesDropdownItems = [
    { href: '/games/crash', label: 'Crash', icon: TrendingUp, gradient: 'from-red-500 to-orange-500' },
    { href: '/games/mines', label: 'Mines', icon: Flame, gradient: 'from-purple-500 to-pink-500' },
    { href: '/games/roulette', label: 'Roulette', icon: Crown, gradient: 'from-yellow-500 to-amber-500', comingSoon: true },
    { href: '/games/coinflip', label: 'Coinflip', icon: Zap, gradient: 'from-[#4578be] to-cyan-500' },
    { href: '/upgrade', label: 'Upgrade', icon: Sparkles, gradient: 'from-[#4578be] to-[#5989d8]' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCartItems([])
      return
    }

    let isSubscribed = true

    const loadCartItems = async () => {
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

        if (!error && inventory && isSubscribed) {
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

    const channel = supabase
      .channel(`inventory-changes-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${user.id}`
      }, () => {
        if (isSubscribed) {
          loadCartItems()
        }
      })
      .subscribe()

    return () => {
      isSubscribed = false
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, user?.id])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  if (loading) return null

  return (
    <>
      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: navbarHidden ? -64 : 0
        }}
        transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 25 }}
        className="fixed top-0 left-0 right-0 z-[60] h-16"
      >
        <div className="w-full h-full flex justify-center items-center px-[10%]">
          <div className="flex items-center justify-between h-full w-full px-4 rounded-3xl shadow-xl gap-3 relative" style={{
            background: isScrolled
              ? `linear-gradient(180deg, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.3) 0%, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.25) 100%)`
              : `linear-gradient(180deg, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.4) 0%, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.35) 100%)`,
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 24px rgba(69, 120, 190, 0.1)'
          }}>
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl overflow-hidden">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, rgba(69, 120, 190, 0.6) 20%, rgba(69, 120, 190, 0.9) 50%, rgba(69, 120, 190, 0.6) 80%, transparent 100%)`,
                  filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.6))'
                }}
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 2
                }}
              />
            </div>

            <div className="flex items-center gap-3 lg:gap-4 relative z-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800/80 dark:hover:to-gray-800/60 transition-all duration-300 hover:shadow-lg"
                style={{
                  border: '1px solid rgba(229, 231, 235, 0.4)'
                }}
              >
                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </motion.button>

              <Link href="/" className="group flex items-center ml-[20%]">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4578be]/20 via-blue-500/10 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/Design%20sans%20titre%20(49).png"
                    alt="ReveelBox"
                    className="relative h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  />
                </motion.div>
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-4 relative z-10">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href === '/games' && pathname.startsWith('/games'))

                if (item.hasDropdown) {
                  return (
                    <div key={item.href} className="relative flex items-center gap-4">
                      <div className="flex items-center" ref={gamesMenuRef}>
                        <Link
                          href={item.href}
                          className={`relative px-3 py-1.5 text-base font-semibold rounded-xl flex items-center gap-2 transition-all duration-300 group ${
                            isActive
                              ? 'text-[#4578be] bg-gradient-to-br from-[#4578be]/10 to-blue-500/5 shadow-lg shadow-[#4578be]/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 hover:shadow-md'
                          }`}
                          style={isActive ? {
                            border: '1px solid rgba(69, 120, 190, 0.2)',
                            boxShadow: '0 0 16px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          } : {}}
                        >
                          <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]' : 'group-hover:scale-110'}`} />
                          <span className="relative">
                            {item.label}
                          </span>
                        </Link>
                        <button
                          onClick={() => setGamesMenuOpen(!gamesMenuOpen)}
                          className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30 rounded-lg"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-all duration-300 ${gamesMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {gamesMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute top-full mt-2 left-0 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/80 rounded-2xl overflow-hidden"
                            style={{
                              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 32px rgba(69, 120, 190, 0.1)'
                            }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" 
                              style={{
                                filter: 'drop-shadow(0 0 4px rgba(69, 120, 190, 0.6))'
                              }}
                            />
                            
                            <div className="p-2">
                              {gamesDropdownItems.map((game, index) => {
                                const GameIcon = game.icon
                                return (
                                  <motion.button
                                    key={game.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => !game.comingSoon && (router.push(game.href), setGamesMenuOpen(false))}
                                    disabled={game.comingSoon}
                                    whileHover={!game.comingSoon ? { x: 4, scale: 1.02 } : {}}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                                      game.comingSoon
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/70 dark:hover:to-gray-800/50 hover:shadow-lg'
                                    }`}
                                  >
                                    <div className={`w-9 h-9 bg-gradient-to-br ${game.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                                      style={{
                                        boxShadow: !game.comingSoon ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 16px rgba(69, 120, 190, 0.1)' : undefined
                                      }}
                                    >
                                      <GameIcon className="h-4.5 w-4.5 text-white drop-shadow-md" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{game.label}</span>
                                        {game.comingSoon && (
                                          <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20 text-orange-600 dark:text-orange-400 text-[10px] rounded-md font-bold shadow-sm">BIENTÔT</span>
                                        )}
                                      </div>
                                    </div>
                                    {!game.comingSoon && (
                                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#4578be] transition-colors duration-300" />
                                    )}
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {index < navItems.length - 1 && (
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 ml-4"></div>
                      )}
                    </div>
                  )
                }

                return (
                  <React.Fragment key={item.href}>
                    <Link
                      href={item.href}
                      className={`relative px-3 py-1.5 text-base font-semibold rounded-xl flex items-center gap-2 transition-all duration-300 group ${
                      isActive
                        ? 'text-[#4578be] bg-gradient-to-br from-[#4578be]/10 to-blue-500/5 shadow-lg shadow-[#4578be]/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 hover:shadow-md'
                    }`}
                    style={isActive ? {
                      border: '1px solid rgba(69, 120, 190, 0.2)',
                      boxShadow: '0 0 16px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    } : {}}
                  >
                    <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]' : 'group-hover:scale-110'}`} />
                    <span className="relative">
                      {item.label}
                    </span>
                  </Link>
                  {index < navItems.length - 1 && (
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
                  )}
                </React.Fragment>
                )
              })}
            </div>

            <div className="flex items-center gap-2 relative z-10">
              {isAuthenticated ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-gray-50/90 to-gray-100/70 dark:from-gray-800/70 dark:to-gray-800/50 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-lg relative z-[70]"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <motion.img
                      animate={{ rotate: [0, 12, -12, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                      alt="Coins"
                      className="h-7 w-7"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.4))'
                      }}
                    />
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {profile?.virtual_currency?.toLocaleString() || '0'}
                    </span>
                    <motion.button
                      ref={paymentButtonRef}
                      whileHover={{ scale: 1.15, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setCartOpen(false)
                        setPaymentModalOpen(true)
                      }}
                      className="p-1.5 rounded-full bg-gradient-to-br from-[#4578be] to-[#5989d8] shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{
                        boxShadow: '0 4px 12px rgba(69, 120, 190, 0.4), 0 0 16px rgba(69, 120, 190, 0.2)'
                      }}
                    >
                      <Plus className="h-3 w-3 text-white drop-shadow-md" />
                    </motion.button>
                  </motion.div>

                  <motion.button
                    ref={cartButtonRef}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setPaymentModalOpen(false)
                      setCartOpen(true)
                    }}
                    className="relative p-2 bg-gradient-to-br from-gray-50/90 to-gray-100/70 dark:from-gray-800/70 dark:to-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-[#4578be]/40 transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    {cartItems.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-[#4578be] to-[#5989d8] rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          boxShadow: '0 2px 8px rgba(69, 120, 190, 0.5), 0 0 12px rgba(69, 120, 190, 0.3)'
                        }}
                      >
                        <span className="text-xs font-bold text-white drop-shadow-md">{cartItems.length}</span>
                      </motion.div>
                    )}
                  </motion.button>

                  <div className="relative" ref={userMenuRef}>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="relative h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{
                        border: '3px solid #4578be',
                        boxShadow: '0 0 16px rgba(69, 120, 190, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center">
                          <User className="h-6 w-6 text-white drop-shadow-md" />
                        </div>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 w-[350px] rounded-2xl overflow-hidden shadow-2xl border border-gray-700"
                          style={{
                            height: '420px',
                            background: '#1a1f2e'
                          }}
                        >
                          {/* ZONE HAUTE (80%) - Bannière + Avatar + Stats */}
                          <div 
                            className="relative h-[80%] overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, #2a3f5f 0%, #1a2332 50%, #0f1419 100%)'
                            }}
                          >
                            {/* Bannière SVG en arrière-plan avec opacity */}
                            {bannerSvg && (
                              <div 
                                className="absolute inset-0"
                                style={{ opacity: 0.6 }}
                                dangerouslySetInnerHTML={{ __html: bannerSvg }}
                              />
                            )}
                            
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                            
                            {/* Contenu */}
                            <div className="relative h-full p-6 flex flex-col">
                              
                              {/* Ligne 1 : Avatar + Badges + Stats */}
                              <div className="flex gap-4 mb-4">
                                {/* Avatar avec cadre */}
                                <div className="relative h-20 w-20 flex-shrink-0">
                                  {/* Avatar */}
                                  <div 
                                    className={`h-20 w-20 rounded-xl overflow-hidden shadow-2xl ${
                                      avatarFrame ? '' : 'border-4 border-[#4578be]'
                                    }`}
                                    style={{ boxShadow: '0 0 30px rgba(69, 120, 190, 0.6)' }}
                                  >
                                    {profile?.avatar_url ? (
                                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center">
                                        <User className="h-10 w-10 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Cadre SVG équipé par-dessus */}
                                  {avatarFrame && (
                                    <div 
                                      className="absolute pointer-events-none"
                                      style={{ 
                                        top: '-4px',
                                        left: '-4px',
                                        width: '88px',
                                        height: '88px'
                                      }}
                                      dangerouslySetInnerHTML={{ __html: avatarFrame }}
                                    />
                                  )}
                                </div>

                                {/* Colonne droite : Badges + Flamme/Smiley */}
                                <div className="flex-1 flex flex-col justify-between">
                                  {/* Badges (ligne du haut) */}
                                  <div className="flex items-center gap-2">
                                    {/* Afficher les pins équipés (MAX 4) */}
                                    {userPins.slice(0, 4).map((pin) => (
                                      <div 
                                        key={pin.id}
                                        className="h-11 w-11 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center p-1"
                                        dangerouslySetInnerHTML={{ __html: pin.svg_code }}
                                      />
                                    ))}
                                    
                                    {/* Remplir avec des slots vides */}
                                    {Array.from({ length: Math.max(0, 4 - userPins.length) }).map((_, i) => (
                                      <div 
                                        key={`empty-${i}`}
                                        className="h-11 w-11 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center"
                                      >
                                        <span className="text-xl opacity-30">?</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Flamme + Smiley + Trophée */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg min-w-[60px] justify-center">
                                      <Flame className="h-4 w-4 text-orange-400" />
                                      <span className="font-bold text-white text-sm">{profile?.consecutive_days || 0}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg min-w-[60px] justify-center">
                                      <span className="text-sm">😊</span>
                                      <span className="font-bold text-white text-sm">{(profile as any)?.recommendations_count || 0}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg min-w-[60px] justify-center">
                                      <span className="text-sm">🏆</span>
                                      <span className="font-bold text-white text-sm">{leaderboardRank || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Ligne 2 : Pseudo */}
                              <h3 className="text-2xl font-black text-white mb-2 drop-shadow-lg">
                                {profile?.username || 'Utilisateur'}
                              </h3>

                              {/* Ligne 3 : Barre XP avec niveau (juste sous le pseudo) */}
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm text-gray-300 font-semibold whitespace-nowrap">
                                  Niveau {profile?.level || 1}
                                </span>
                                <div className="flex-1">
                                  <div className="h-2.5 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#4578be] to-[#5989d8]"
                                      style={{ width: `${profile?.progress_percentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Ligne 4 : Total coins dépensés */}
                              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                                <img
                                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                                  alt="Coins"
                                  className="w-4 h-4"
                                />
                                <span className="text-xs text-gray-300">
                                  <span className="font-black text-[#4578be]">{((profile as any)?.total_coins_spent || 0).toLocaleString()}</span> coins joués
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ZONE BASSE (20%) - Menu compact */}
                          <div 
                            className="h-[20%] px-3 py-2"
                            style={{
                              background: '#0f1419',
                              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <div className="flex items-center justify-around h-full">
                              
                              <button
                                onClick={() => { router.push('/profile'); setUserMenuOpen(false) }}
                                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium">Profil</span>
                              </button>

                              <button
                                onClick={() => { router.push('/inventory'); setUserMenuOpen(false) }}
                                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                <Package className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium">Inventaire</span>
                              </button>

                              <button
                                onClick={() => { router.push('/contact'); setUserMenuOpen(false) }}
                                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                <Mail className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium">Contact</span>
                              </button>

                              <button
                                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                {resolvedTheme === 'dark' ? (
                                  <Moon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                ) : (
                                  <Sun className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-xs font-medium">Thème</span>
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => { router.push('/admin'); setUserMenuOpen(false) }}
                                  className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors group"
                                >
                                  <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                  <span className="text-xs font-medium">Admin</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 transition-all duration-300 hover:shadow-md"
                    >
                      Connexion
                    </button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => setIsSignupModalOpen(true)}
                      className="relative px-4 py-1.5 text-white rounded-xl text-sm font-bold shadow-lg bg-gradient-to-br from-[#4578be] to-[#5989d8] hover:shadow-xl transition-all duration-300 overflow-hidden group"
                      style={{
                        boxShadow: '0 4px 16px rgba(69, 120, 190, 0.4), 0 0 24px rgba(69, 120, 190, 0.15)'
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                      />
                      <span className="relative drop-shadow-md">S'inscrire</span>
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.nav>

      <motion.button
        onClick={toggleNavbar}
        animate={{ 
          top: navbarHidden ? 0 : 64,
          opacity: navbarHidden ? 0.75 : 0.75
        }}
        whileHover={{ opacity: 0.95 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 25 }}
        className="fixed left-1/2 -translate-x-1/2 p-1.5 backdrop-blur-md border border-t-0 rounded-b-2xl shadow-md z-[70] bg-white/30 dark:bg-gray-900/30 border-gray-300/30 dark:border-gray-700/30"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <motion.div
          animate={{ rotate: navbarHidden ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 25 }}
        >
          <ChevronUp className="h-3 w-3 text-[#4578be] opacity-70" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-800/80 z-50 lg:hidden overflow-y-auto"
              style={{
                boxShadow: '0 0 80px rgba(0, 0, 0, 0.3), 0 0 40px rgba(69, 120, 190, 0.1)'
              }}
            >
              <div className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between mb-8"
                >
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/Design%20sans%20titre%20(49).png"
                    alt="ReveelBox"
                    className="h-9 w-auto object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.3))'
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800/80 dark:hover:to-gray-800/60 rounded-xl transition-all duration-300 hover:shadow-lg"
                  >
                    <X className="h-5 w-5 text-gray-900 dark:text-white" />
                  </motion.button>
                </motion.div>

                {isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#4578be]/10 via-blue-500/5 to-transparent border border-[#4578be]/30 shadow-lg backdrop-blur-sm"
                    style={{
                      boxShadow: '0 8px 24px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.img
                          animate={{ rotate: [0, 12, -12, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="h-9 w-9"
                          style={{
                            filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.5))'
                          }}
                        />
                        <span className="font-bold text-gray-900 dark:text-white text-base drop-shadow-sm">{profile?.virtual_currency?.toLocaleString() || '0'}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setPaymentModalOpen(true); setMobileMenuOpen(false) }}
                        className="px-4 py-1.5 text-white rounded-lg text-sm font-bold bg-gradient-to-br from-[#4578be] to-[#5989d8] shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{
                          boxShadow: '0 4px 12px rgba(69, 120, 190, 0.4), 0 0 16px rgba(69, 120, 190, 0.2)'
                        }}
                      >
                        Recharger
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href === '/games' && pathname.startsWith('/games'))

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                            isActive
                              ? 'text-[#4578be] bg-gradient-to-br from-[#4578be]/15 to-blue-500/5 border border-[#4578be]/30 shadow-lg shadow-[#4578be]/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 hover:shadow-md'
                          }`}
                        >
                          <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]' : 'group-hover:scale-110'}`} />
                          <span className="font-semibold text-sm">{item.label}</span>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems.map(item => ({
          id: item.id,
          item_id: item.items?.id || '',
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
            const itemsToSell = cartItems.filter(item => selectedCartItems.includes(item.id))
            const totalValue = itemsToSell.reduce((sum, item) => {
              return sum + (item.items?.market_value || 0) * item.quantity
            }, 0)

            const { error: sellError } = await supabase
              .from('user_inventory')
              .update({ is_sold: true })
              .in('id', selectedCartItems)

            if (sellError) throw sellError

            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                virtual_currency: (profile?.virtual_currency || 0) + totalValue
              })
              .eq('id', user?.id)

            if (updateError) throw updateError

            await refreshProfile()

            setCartItems(prevItems => prevItems.filter(item => !selectedCartItems.includes(item.id)))

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

      {/* Modals Login/Signup */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false)
          setIsSignupModalOpen(true)
        }}
      />

      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false)
          setIsLoginModalOpen(true)
        }}
      />
    </>
  )
}