'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  ShoppingCart
} from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showNavbar, setShowNavbar] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  // Navigation items
  const navItems = [
    { href: '/boxes', label: 'Unboxing', icon: Package },
    { href: '/battle', label: 'Battles', icon: Sword },
    { href: '/affiliates', label: 'Affiliés', icon: Users },
    { href: '/contact', label: 'Contact', icon: Mail },
    { href: '/freedrop', label: 'Free Drop', icon: Gift, highlight: true }
  ]

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show/hide navbar based on scroll direction avec seuil plus intelligent
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setShowNavbar(false)
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setShowNavbar(true)
      }
      
      // Add background when scrolled avec transition progressive
      setIsScrolled(currentScrollY > 20)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Auth state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push('/')
  }

  const isActive = (href) => pathname === href

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
              ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-lg' 
              : 'bg-transparent'
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
                  <div className="h-9 w-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 tracking-tight">REVEELBOX</span>
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
                      className="relative"
                    >
                      <Link
                        href={item.href}
                        className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                          item.highlight
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl'
                            : active
                            ? 'text-green-700 bg-green-100 relative z-10'
                            : 'text-gray-700 hover:text-green-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* User Section */}
              <div className="flex items-center space-x-5">
                {user ? (
                  <>
                    {/* Coins Display */}
                    {profile && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full border border-gray-200"
                      >
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {profile.virtual_currency?.toLocaleString() || 0}
                        </span>
                      </motion.div>
                    )}

                    {/* Cart Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative p-2.5 text-gray-700 hover:text-green-600 transition-colors hover:bg-gray-50 rounded-full"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        0
                      </span>
                    </motion.button>

                    {/* User Menu */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="h-9 w-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </motion.button>

                      {/* User Dropdown */}
                      <AnimatePresence>
                        {userMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft-lg border border-gray-100 py-2"
                          >
                            <div className="px-4 py-2 border-b border-gray-100">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.email}
                              </p>
                            </div>
                            
                            <Link
                              href="/profile"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User className="h-4 w-4" />
                              Profil
                            </Link>
                            
                            <Link
                              href="/settings"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings className="h-4 w-4" />
                              Paramètres
                            </Link>
                            
                            <button
                              onClick={handleSignOut}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
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
                  /* Auth Buttons */
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors px-3 py-2"
                    >
                      Connexion
                    </Link>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/signup"
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200"
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
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors ${
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
                    
                    {/* Mobile Coins Display */}
                    {user && profile && (
                      <div className="flex items-center gap-3 px-4 py-3 mx-2 bg-gray-50 rounded-lg">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {profile.virtual_currency?.toLocaleString() || 0} coins
                        </span>
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