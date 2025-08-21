'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gift, 
  Package, 
  Sword, 
  Users, 
  Mail, 
  User, 
  LogOut, 
  Settings,
  Coins,
  Menu,
  X,
  ShoppingCart,
  Star,
  Crown,
  Eye,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react'
import { useAuth } from './AuthProvider'

// Types pour les éléments de navigation et inventaire
interface NavItem {
  href: string
  label: string
  icon: any
  highlight?: boolean
}

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

export default function Navbar() {
  const { user, profile, refreshProfile, signOut, isAuthenticated, loading } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showNavbar, setShowNavbar] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<InventoryItem[]>([])
  const [cartLoading, setCartLoading] = useState(false)
  
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const cartRef = useRef<HTMLDivElement | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
const isAdmin = user?.email === 'admin@reveelbox.com';

  const navItems: NavItem[] = [
    { href: '/boxes', label: 'Mystery Boxes', icon: Package },
    { href: '/battle', label: 'Battles', icon: Sword },
    { href: '/affiliates', label: 'Affiliés', icon: Users },
    { href: '/contact', label: 'Contact', icon: Mail },
    { href: '/freedrop', label: 'Free Drop', icon: Gift, highlight: true }
  ]

  // Click‑outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false)
      }
      if (cartRef.current && !cartRef.current.contains(target)) {
        setCartOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load cart items
  useEffect(() => {
    const loadCartItems = async () => {
      if (!isAuthenticated || !user) {
        setCartItems([])
        return
      }

      try {
        setCartLoading(true)
        
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
          .limit(10)

        if (error) {
          console.error('Erreur chargement inventaire:', error.message)
          return
        }

        setCartItems((inventory as any[])?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          obtained_at: item.obtained_at,
          items: item.items || null
        })) || [])
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setCartLoading(false)
      }
    }

    loadCartItems()

    // Real-time subscription pour l'inventaire
    if (isAuthenticated && user) {
      const channel = supabase
        .channel('inventory-changes')  
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_inventory',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadCartItems()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [isAuthenticated, user, supabase])

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setShowNavbar(false)
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setShowNavbar(true)
      }
      
      setIsScrolled(currentScrollY > 20)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleSignOut = async () => {
    await signOut()
    setUserMenuOpen(false)
  }

  const handleUserMenuToggle = () => {
    if (cartOpen) setCartOpen(false)
    setUserMenuOpen(!userMenuOpen)
  }

  const handleCartToggle = () => {
    if (userMenuOpen) setUserMenuOpen(false)
    setCartOpen(!cartOpen)
  }

  const handleBuyCoinsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUserMenuOpen(false)
    router.push('/buy-coins')
  }

  const isActive = (href: string) => pathname === href

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="h-3 w-3 text-yellow-600" />
      case 'epic': return <Sparkles className="h-3 w-3 text-purple-600" />
      case 'rare': return <Star className="h-3 w-3 text-blue-600" />
      default: return null
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}j`
  }

  // Don't render navbar during loading
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm h-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">REVEELBOX</span>
            </div>
            
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <AnimatePresence>
      {showNavbar && (
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
            isScrolled 
              ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/70 shadow-lg' 
              : 'bg-white/90 backdrop-blur-sm'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18">
              
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/" className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-black text-gray-900 tracking-tight">REVEELBOX</span>
                </Link>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <motion.div
                      key={item.href}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={item.href}
                        className={`relative px-5 py-3 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                          item.highlight
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl'
                            : active
                            ? 'text-green-700 bg-green-100'
                            : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-4">
                
                {isAuthenticated ? (
                  <>
                    {/* Cart/Inventory */}
                    <div className="relative" ref={cartRef}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCartToggle}
                        className="relative p-3 text-gray-700 hover:text-green-600 transition-colors hover:bg-gray-50 rounded-full border border-gray-200 bg-white shadow-sm"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        {cartItems.length > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                          >
                            {cartItems.length}
                          </motion.span>
                        )}
                      </motion.button>

                      {/* Cart Dropdown */}
                      <AnimatePresence>
                        {cartOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                          >
                            <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-black text-xl text-gray-900">Mon Inventaire</h3>
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                  {cartItems.length}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm">
                                Objets disponibles à la vente
                              </p>
                            </div>
                            
                            {cartLoading ? (
                              <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-gray-600 text-sm">Chargement...</p>
                              </div>
                            ) : cartItems.length > 0 ? (
                              <>
                                <div className="max-h-80 overflow-y-auto">
                                  {cartItems.slice(0, 6).map((item, index) => (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                                    >
                                      <div className={`relative w-14 h-14 rounded-xl border-2 ${getRarityColor(item.items?.rarity || 'common')} shadow-sm flex items-center justify-center overflow-hidden`}>
                                        {item.items?.image_url ? (
                                          <img 
                                            src={item.items.image_url} 
                                            alt={item.items.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Package className="h-6 w-6 text-gray-400" />
                                        )}
                                        
                                        <div className="absolute -top-1 -right-1">
                                          {getRarityIcon(item.items?.rarity || 'common')}
                                        </div>

                                        {item.quantity > 1 && (
                                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                            x{item.quantity}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm truncate">
                                          {item.items?.name || 'Objet inconnu'}
                                        </h4>
                                        <p className="text-xs text-gray-600 capitalize mb-1">
                                          {item.items?.rarity || 'common'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1">
                                            <Coins className="h-3 w-3 text-yellow-500" />
                                            <span className="text-xs font-bold text-gray-700">
                                              {item.items?.market_value || 0}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span className="text-xs">
                                              {formatTimeAgo(item.obtained_at)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                  
                                  {cartItems.length > 6 && (
                                    <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                                      +{cartItems.length - 6} autres objets...
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
                                  <div className="grid grid-cols-2 gap-3">
                                    <button 
                                      onClick={() => {
                                        setCartOpen(false)
                                        router.push('/inventory')
                                      }}
                                      className="bg-blue-500 text-white py-2.5 rounded-xl hover:bg-blue-600 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                      <Eye className="h-4 w-4" />
                                      Inventaire
                                    </button>
                                    
                                    <button 
                                      onClick={() => {
                                        setCartOpen(false)
                                        router.push('/boxes')
                                      }}
                                      className="border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Ouvrir
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Inventaire vide</h4>
                                <p className="text-gray-600 text-sm mb-4">
                                  Ouvrez des boîtes pour obtenir des objets !
                                </p>
                                <button 
                                  onClick={() => {
                                    setCartOpen(false)
                                    router.push('/boxes')
                                  }}
                                  className="bg-green-500 text-white px-6 py-2.5 rounded-xl hover:bg-green-600 transition-colors text-sm font-bold flex items-center gap-2 mx-auto"
                                >
                                  <Gift className="h-4 w-4" />
                                  Découvrir les boîtes
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* User Menu */}
                    <div className="relative" ref={userMenuRef}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUserMenuToggle}
                        className="flex items-center gap-3 p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
                      >
                        <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt="Avatar" 
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>
                        
                        <div className="hidden md:block text-left">
                          <div className="text-sm font-bold text-gray-900 truncate max-w-24">
                            {profile?.username || 'User'}
                          </div>
                          {profile?.virtual_currency !== undefined && (
                            <div className="flex items-center gap-1">
                              <Coins className="h-3 w-3 text-yellow-600" />
                              <span className="text-xs text-gray-600">{profile.virtual_currency}</span>
                              <span
                                onClick={handleBuyCoinsClick}
                                className="ml-1 p-0.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors cursor-pointer"
                                title="Acheter des coins"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.button>

                      {/* User Dropdown */}
                      <AnimatePresence>
                        {userMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden"
                          >
                            <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {profile?.username || user?.email || 'Utilisateur'}
                              </p>
                              {profile?.virtual_currency !== undefined && (
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center gap-1">
                                    <Coins className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                      {profile.virtual_currency} coins
                                    </span>
                                  </div>
                                  <button
                                    onClick={handleBuyCoinsClick}
                                    className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition-colors text-xs font-bold flex items-center gap-1"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Recharger
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <Link
                              href="/profile"
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              Mon Profil
                            </Link>
                            
                            <Link
                              href="/inventory"
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Package className="h-4 w-4" />
                              Inventaire
                              {cartItems.length > 0 && (
                                <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  {cartItems.length}
                                </span>
                              )}
                            </Link>
                            
                            <Link
                              href="/settings"
                              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings className="h-4 w-4" />
                              Paramètres
                            </Link>
                            
                            <hr className="my-1 border-gray-100" />
                            
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                            >
                              <LogOut className="h-4 w-4" />
                              Déconnexion
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-sm font-bold text-gray-700 hover:text-green-600 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Connexion
                    </Link>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/signup"
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-lg transition-all duration-200 shadow-md"
                      >
                        S'inscrire
                      </Link>
                    </motion.div>
                  </div>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-3 text-gray-700 hover:text-green-600 transition-colors hover:bg-gray-50 rounded-full"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg"
                >
                  <div className="py-4 space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl mx-2 transition-colors ${
                            item.highlight
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                              : active
                              ? 'bg-green-50 text-green-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      )
                    })}
					
					{isAdmin && (
  <Link 
    href="/admin" 
    className="flex items-center gap-2 text-gray-700 hover:text-green-600"
  >
    <Settings size={20} />
    Admin
  </Link>
)}
                    
                    {isAuthenticated && profile && (
                      <div className="mx-2 mt-2 space-y-2">
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Coins className="h-5 w-5 text-yellow-600" />
                            <span className="text-lg font-black text-gray-900">
                              {profile.virtual_currency?.toLocaleString() || 0} coins
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false)
                              router.push('/buy-coins')
                            }}
                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors text-sm font-bold flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Recharger
                          </button>
                        </div>

                        {cartItems.length > 0 && (
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false)
                              router.push('/inventory')
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ShoppingCart className="h-5 w-5" />
                              <span className="font-bold">Mon Inventaire</span>
                            </div>
                            <span className="bg-green-500 text-white text-sm px-2 py-1 rounded-full font-bold">
                              {cartItems.length}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}