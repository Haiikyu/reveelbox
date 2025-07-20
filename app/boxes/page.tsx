'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Search, Filter, Star, Package, Coins, ShoppingCart, Zap, Crown, Sparkles, TrendingUp, Users, Clock, Eye, Heart, Play, Gift, Flame } from 'lucide-react'
import { PageLayout } from '../components/layouts/PageLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'
import { CurrencyDisplay } from '../components/ui/CurrencyDisplay'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Interface pour les types
interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  price_real: number
  image_url: string
  is_active: boolean
  created_at?: string
  animation_url?: string
  times_opened?: number
  featured?: boolean
  hot?: boolean
  new?: boolean
}

interface UserProfile {
  id: string
  virtual_currency: number
  loyalty_points: number
  total_exp: number
}

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('popular')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [hoveredBox, setHoveredBox] = useState<string | null>(null)
  
  const router = useRouter()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Afficher une notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Charger les données depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Récupérer l'utilisateur actuel
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError && userError.message !== 'The user is not authenticated') {
          console.error('Erreur auth:', userError)
        }
        
        setUser(currentUser)

        // Charger le profil utilisateur si connecté
        if (currentUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, virtual_currency, loyalty_points, total_exp')
            .eq('id', currentUser.id)
            .single()

          if (profileError) {
            console.error('Erreur profil:', profileError)
            // Créer un profil par défaut si inexistant
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert([{
                id: currentUser.id,
                virtual_currency: 100,
                loyalty_points: 0,
                total_exp: 0
              }])
              .select()
              .single()
            
            if (newProfile) {
              setUserProfile(newProfile)
            }
          } else {
            setUserProfile(profileData)
          }
        }

        // Charger les boîtes avec statistiques
        const { data: boxesData, error: boxesError } = await supabase
          .from('loot_boxes')
          .select(`
            *,
            loot_box_items (
              items (*)
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (boxesError) {
          console.error('Erreur boîtes:', boxesError)
        }

        // Si pas de boîtes en DB, utiliser les données de test ultra-attractives
        if (!boxesData || boxesData.length === 0) {
          console.log('Aucune boîte en DB, utilisation données de test premium')
          
          const testBoxes: LootBox[] = [
            {
              id: '1',
              name: 'LEGENDARY HYPE',
              description: 'Les collaborations les plus exclusives. Off-White x Nike, Travis Scott, Fragment Design. Seulement 2% de chance de drop légendaire.',
              price_virtual: 450,
              price_real: 149.99,
              image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
              is_active: true,
              times_opened: 892,
              featured: true,
              hot: true,
              new: false
            },
            {
              id: '2', 
              name: 'CHICAGO DREAMS',
              description: 'Air Jordan 1 Chicago, Bred, Royal Blue. La collection ultime des OG colorways qui ont défini une génération.',
              price_virtual: 350,
              price_real: 99.99,
              image_url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600',
              is_active: true,
              times_opened: 1547,
              featured: true,
              hot: false,
              new: false
            },
            {
              id: '3',
              name: 'YEEZY VAULT',
              description: 'Boost 350 V2, 700, 500. Toutes les Yeezy iconiques de Kanye West. Design futuriste et confort révolutionnaire.',
              price_virtual: 280,
              price_real: 79.99,
              image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600',
              is_active: true,
              times_opened: 2341,
              featured: false,
              hot: true,
              new: false
            },
            {
              id: '4',
              name: 'RETRO FIRE',
              description: 'Air Max 90, 95, 97. Les classiques qui ne vieillissent jamais. Pure nostalgie et style intemporel.',
              price_virtual: 180,
              price_real: 59.99,
              image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
              is_active: true,
              times_opened: 3124,
              featured: false,
              hot: false,
              new: false
            },
            {
              id: '5',
              name: 'DUNK MANIA',
              description: 'Nike SB Dunk Low & High. Panda, Chicago, Kentucky. La culture skate rencontre la haute couture.',
              price_virtual: 220,
              price_real: 69.99,
              image_url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600',
              is_active: true,
              times_opened: 1876,
              featured: false,
              hot: false,
              new: true
            },
            {
              id: '6',
              name: 'STARTER GOLD',
              description: 'Air Force 1, Stan Smith, Chuck Taylor. Les essentiels de toute collection. Qualité garantie, style assuré.',
              price_virtual: 120,
              price_real: 39.99,
              image_url: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600',
              is_active: true,
              times_opened: 5421,
              featured: false,
              hot: false,
              new: false
            }
          ]
          
          setBoxes(testBoxes)
        } else {
          // Enrichir les vraies données avec des stats
          const enrichedBoxes = boxesData.map(box => ({
            ...box,
            times_opened: Math.floor(Math.random() * 5000) + 500,
            featured: Math.random() > 0.7,
            hot: Math.random() > 0.8,
            new: Math.random() > 0.9
          }))
          setBoxes(enrichedBoxes)
        }

        setLoading(false)
      } catch (error) {
        console.error('Erreur générale:', error)
        showNotification('Erreur lors du chargement', 'error')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Déterminer la rareté en fonction du prix
  const getRarity = (price_virtual: number) => {
    if (price_virtual >= 400) return 'legendary'
    if (price_virtual >= 250) return 'epic'
    if (price_virtual >= 150) return 'rare'
    return 'common'
  }

  // Trier les boîtes
  const sortBoxes = (boxes: LootBox[]) => {
    switch (selectedSort) {
      case 'price_low':
        return [...boxes].sort((a, b) => a.price_virtual - b.price_virtual)
      case 'price_high':
        return [...boxes].sort((a, b) => b.price_virtual - a.price_virtual)
      case 'popular':
        return [...boxes].sort((a, b) => (b.times_opened || 0) - (a.times_opened || 0))
      case 'newest':
        return [...boxes].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      case 'hot':
        return [...boxes].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0))
      default:
        return boxes
    }
  }

  // Catégories avec design amélioré
  const categories = [
    { 
      value: 'all', 
      label: 'Toutes', 
      count: boxes.length, 
      icon: <Package size={18} />,
      gradient: 'from-gray-500 to-gray-700'
    },
    { 
      value: 'legendary', 
      label: 'Légendaires', 
      count: boxes.filter(b => getRarity(b.price_virtual) === 'legendary').length, 
      icon: <Crown size={18} />,
      gradient: 'from-yellow-400 to-orange-500'
    },
    { 
      value: 'epic', 
      label: 'Épiques', 
      count: boxes.filter(b => getRarity(b.price_virtual) === 'epic').length, 
      icon: <Sparkles size={18} />,
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      value: 'rare', 
      label: 'Rares', 
      count: boxes.filter(b => getRarity(b.price_virtual) === 'rare').length, 
      icon: <Star size={18} />,
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      value: 'common', 
      label: 'Communes', 
      count: boxes.filter(b => getRarity(b.price_virtual) === 'common').length, 
      icon: <Zap size={18} />,
      gradient: 'from-green-500 to-emerald-500'
    }
  ]

  // Options de tri
  const sortOptions = [
    { value: 'popular', label: '🔥 Plus populaires', icon: <TrendingUp size={16} /> },
    { value: 'hot', label: '⚡ Tendances', icon: <Flame size={16} /> },
    { value: 'newest', label: '✨ Nouveautés', icon: <Clock size={16} /> },
    { value: 'price_low', label: '💰 Prix ↗', icon: <Coins size={16} /> },
    { value: 'price_high', label: '💎 Prix ↘', icon: <Coins size={16} /> }
  ]

  // Filtrer et trier les boîtes
  const filteredAndSortedBoxes = sortBoxes(
    boxes.filter(box => {
      const matchesSearch = box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           box.description.toLowerCase().includes(searchQuery.toLowerCase())
      const boxRarity = getRarity(box.price_virtual)
      const matchesCategory = selectedCategory === 'all' || boxRarity === selectedCategory
      return matchesSearch && matchesCategory && box.is_active
    })
  )

  // Naviguer vers l'ouverture de boîte
  const handleOpenBox = (boxId: string) => {
    if (!user) {
      showNotification('🔐 Connectez-vous pour ouvrir des boîtes', 'error')
      router.push('/login')
      return
    }
    
    router.push(`/boxes/${boxId}`)
  }

  // Naviguer vers la boutique
  const handleBuyCoins = () => {
    if (!user) {
      router.push('/login')
    } else {
      router.push('/buy-coins')
    }
  }

  // Styles selon rareté - Version ultra premium
  const getRarityStyles = (rarity: string) => {
    const styles = {
      common: {
        gradient: 'from-emerald-400 via-green-500 to-teal-600',
        bg: 'bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-teal-50/80',
        border: 'border-green-200/60',
        badge: 'bg-gradient-to-r from-green-500 to-emerald-600',
        glow: 'hover:shadow-2xl hover:shadow-green-400/25',
        particle: '#10b981',
        shimmer: 'bg-gradient-to-r from-transparent via-green-200/40 to-transparent'
      },
      rare: {
        gradient: 'from-blue-400 via-cyan-500 to-blue-600',
        bg: 'bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-blue-50/80',
        border: 'border-blue-200/60',
        badge: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        glow: 'hover:shadow-2xl hover:shadow-blue-400/25',
        particle: '#3b82f6',
        shimmer: 'bg-gradient-to-r from-transparent via-blue-200/40 to-transparent'
      },
      epic: {
        gradient: 'from-purple-400 via-pink-500 to-purple-600',
        bg: 'bg-gradient-to-br from-purple-50/80 via-pink-50/60 to-purple-50/80',
        border: 'border-purple-200/60',
        badge: 'bg-gradient-to-r from-purple-500 to-pink-600',
        glow: 'hover:shadow-2xl hover:shadow-purple-400/25',
        particle: '#8b5cf6',
        shimmer: 'bg-gradient-to-r from-transparent via-purple-200/40 to-transparent'
      },
      legendary: {
        gradient: 'from-yellow-400 via-orange-500 to-red-500',
        bg: 'bg-gradient-to-br from-yellow-50/90 via-orange-50/70 to-red-50/90',
        border: 'border-yellow-300/70',
        badge: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500',
        glow: 'hover:shadow-2xl hover:shadow-yellow-400/30',
        particle: '#f59e0b',
        shimmer: 'bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent'
      }
    }
    return styles[rarity as keyof typeof styles] || styles.common
  }

  const getBadgeVariant = (rarity: string) => {
    const variants = {
      common: 'success' as const,
      rare: 'primary' as const,
      epic: 'primary' as const,
      legendary: 'warning' as const
    }
    return variants[rarity as keyof typeof variants] || 'success'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <LoadingState size="lg" text="✨ Préparation de l'expérience magique..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 relative overflow-hidden">
      
      {/* Particules de fond animées */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-300/30 rounded-full"
            style={{
              top: `${15 + (i * 12)}%`,
              left: `${10 + (i % 4) * 25}%`
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 4 + (i * 0.5),
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </div>
      
      {/* Notification premium */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-white font-medium backdrop-blur-sm ${
              notification.type === 'error' 
                ? 'bg-gradient-to-r from-red-500 to-red-600 border border-red-400/50' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 border border-green-400/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? '⚠️' : '✅'}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Header épique */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mb-8 shadow-2xl shadow-primary-200/50"
          >
            <Gift className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight">
            Nos Boîtes{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700">
              Mystères
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Découvrez des <strong>sneakers exclusives</strong> dans nos boîtes surprise. 
            Chaque ouverture révèle des <strong>trésors uniques</strong> et des <strong>pièces rares</strong>.
          </motion.p>
        </motion.div>

        {/* Hero Stats - Version ultra premium */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mb-16"
        >
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            
            {/* Effet de lumière */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full animate-pulse" 
                 style={{
                   animation: 'shimmer 3s infinite'
                 }}>
            </div>
            
            {/* Particules de fond */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.8, 0.2]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  {
                    value: boxes.length,
                    label: 'Boîtes Exclusives',
                    icon: <Package className="w-8 h-8" />,
                    gradient: 'from-blue-400 to-cyan-500',
                    format: 'number'
                  },
                  {
                    value: boxes.reduce((acc, box) => acc + (box.times_opened || 0), 0),
                    label: 'Ouvertures Totales',
                    icon: <TrendingUp className="w-8 h-8" />,
                    gradient: 'from-green-400 to-emerald-500',
                    format: 'number'
                  },
                  {
                    value: userProfile?.virtual_currency || 0,
                    label: user ? 'Vos Coins' : 'Rejoignez-nous',
                    icon: <Coins className="w-8 h-8" />,
                    gradient: 'from-yellow-400 to-orange-500',
                    format: 'currency'
                  },
                  {
                    value: 97,
                    label: 'Satisfaction',
                    icon: <Star className="w-8 h-8" />,
                    gradient: 'from-pink-400 to-rose-500',
                    format: 'percent'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="text-center group cursor-pointer"
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      {stat.icon}
                    </div>
                    
                    <div className="text-3xl md:text-4xl font-black mb-2 group-hover:scale-110 transition-transform">
                      {stat.format === 'currency' ? (
                        <CurrencyDisplay amount={stat.value} type="coins" size="lg" className="text-white" />
                      ) : stat.format === 'percent' ? (
                        `${stat.value}%`
                      ) : (
                        stat.value.toLocaleString()
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm font-semibold tracking-wide">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtres ultra-design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-gray-200/50">
            <div className="space-y-8">
              
              {/* Recherche premium */}
              <div className="relative max-w-lg mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher votre boîte de rêve..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-300 outline-none bg-white/90 backdrop-blur-sm shadow-inner"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Catégories premium */}
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category) => (
                  <motion.button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      group relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm
                      ${selectedCategory === category.value
                        ? `bg-gradient-to-r ${category.gradient} text-white shadow-xl`
                        : 'bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border-2 border-gray-200/50 hover:border-gray-300/50'
                      }
                    `}
                  >
                    <div className={`
                      transition-transform duration-300 group-hover:scale-110
                      ${selectedCategory === category.value ? 'text-white' : 'text-gray-600'}
                    `}>
                      {category.icon}
                    </div>
                    
                    <span className="tracking-wide">{category.label}</span>
                    
                    <Badge 
                      className={`
                        ${selectedCategory === category.value 
                          ? "bg-white/20 text-white border-white/30" 
                          : "bg-gray-100 text-gray-600 border-gray-300/50"
                        }
                        font-bold px-3 py-1
                      `}
                    >
                      {category.count}
                    </Badge>
                    
                    {/* Effet de shimmer sur hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${category.gradient} opacity-10`}></div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Tri élégant */}
              <div className="flex items-center justify-center gap-4">
                <span className="text-gray-700 font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Trier par:
                </span>
                
                <div className="flex gap-2">
                  {sortOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => setSelectedSort(option.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                        ${selectedSort === option.value
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Résultats */}
        {filteredAndSortedBoxes.length === 0 ? (
          <EmptyState
            icon={<Package size={64} className="text-gray-400" />}
            title="Aucune boîte trouvée"
            description="Explorez d'autres catégories pour découvrir nos trésors cachés."
            action={
              <Button 
                onClick={() => { 
                  setSearchQuery(''); 
                  setSelectedCategory('all'); 
                  setSelectedSort('popular') 
                }}
                className="mt-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                size="lg"
              >
                ✨ Découvrir toutes les boîtes
              </Button>
            }
          />
        ) : (
          <>
            {/* Section Featured - Ultra premium */}
            {filteredAndSortedBoxes.some(box => box.featured) && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-20"
              >
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-yellow-200/50 mb-6"
                  >
                    <Crown className="w-8 h-8" />
                    <span className="text-2xl font-black tracking-wide">COLLECTION EXCLUSIVE</span>
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                  
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Nos boîtes les plus <strong>convoitées</strong> avec les drops les plus <strong>exceptionnels</strong>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredAndSortedBoxes
                    .filter(box => box.featured)
                    .slice(0, 2)
                    .map((box, index) => (
                      <FeaturedBoxCard 
                        key={`featured-${box.id}`}
                        box={box}
                        index={index}
                        userProfile={userProfile}
                        user={user}
                        onOpenBox={handleOpenBox}
                        getRarity={getRarity}
                        getRarityStyles={getRarityStyles}
                        getBadgeVariant={getBadgeVariant}
                        setHoveredBox={setHoveredBox}
                        hoveredBox={hoveredBox}
                      />
                    ))}
                </div>
              </motion.div>
            )}

            {/* Section principale - Design premium */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-gray-900">
                  {selectedCategory === 'all' ? '🎯 Toutes nos Boîtes' : `✨ Boîtes ${categories.find(c => c.value === selectedCategory)?.label}`}
                </h2>
                <div className="text-gray-600 font-semibold">
                  {filteredAndSortedBoxes.length} boîte{filteredAndSortedBoxes.length > 1 ? 's' : ''} disponible{filteredAndSortedBoxes.length > 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedBoxes.map((box, index) => (
                  <PremiumBoxCard 
                    key={box.id}
                    box={box}
                    index={index}
                    userProfile={userProfile}
                    user={user}
                    onOpenBox={handleOpenBox}
                    getRarity={getRarity}
                    getRarityStyles={getRarityStyles}
                    getBadgeVariant={getBadgeVariant}
                    setHoveredBox={setHoveredBox}
                    hoveredBox={hoveredBox}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* CTA Ultra premium */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-12 text-white text-center shadow-2xl">
            
            {/* Effet de particules */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: Math.random() * 3
                  }}
                />
              ))}
            </div>

            {/* Gradient overlay animé */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-transparent to-primary-500/20"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 150 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mb-8 shadow-2xl"
              >
                <Coins className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                {user ? '💰 Boostez votre Collection' : '🚀 Rejoignez l\'Aventure'}
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                {user 
                  ? 'Rechargez vos coins et débloquez des <strong>sneakers légendaires</strong>. Chaque ouverture vous rapproche de vos <strong>grails</strong> !'
                  : 'Rejoignez des milliers de <strong>collectionneurs passionnés</strong> et découvrez des <strong>sneakers exclusives</strong> dans nos boîtes mystères.'
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg"
                    onClick={handleBuyCoins}
                    className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 px-12 py-6 text-xl font-black shadow-2xl shadow-primary-500/30 border-0"
                  >
                    <Coins size={24} className="mr-3" />
                    {user ? '💎 Acheter des Coins' : '✨ Commencer Maintenant'}
                  </Button>
                </motion.div>
                
                {!user && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => router.push('/login')}
                      className="px-12 py-6 text-xl font-black bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <Users size={24} className="mr-3" />
                      🔐 Se Connecter
                    </Button>
                  </motion.div>
                )}
              </div>
              
              {userProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-8 flex items-center justify-center gap-8 text-gray-300"
                >
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold">{userProfile.loyalty_points} points fidélité</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                    <Zap className="w-5 h-5 text-primary-400" />
                    <span className="font-bold">Niveau {Math.floor(userProfile.total_exp / 100) + 1}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Composant Featured Box Card - Design ultra premium
interface FeaturedBoxCardProps {
  box: LootBox
  index: number
  userProfile: UserProfile | null
  user: any
  onOpenBox: (boxId: string) => void
  getRarity: (price: number) => string
  getRarityStyles: (rarity: string) => any
  getBadgeVariant: (rarity: string) => any
  setHoveredBox: (id: string | null) => void
  hoveredBox: string | null
}

function FeaturedBoxCard({ 
  box, 
  index, 
  userProfile, 
  user, 
  onOpenBox, 
  getRarity, 
  getRarityStyles, 
  getBadgeVariant,
  setHoveredBox,
  hoveredBox
}: FeaturedBoxCardProps) {
  const router = useRouter()
  const boxRarity = getRarity(box.price_virtual)
  const rarityStyles = getRarityStyles(boxRarity)
  const canAfford = userProfile ? userProfile.virtual_currency >= box.price_virtual : false
  const isHovered = hoveredBox === box.id
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 * index }}
      whileHover={{ y: -10, scale: 1.02 }}
      onHoverStart={() => setHoveredBox(box.id)}
      onHoverEnd={() => setHoveredBox(null)}
      className="group cursor-pointer"
    >
      <div className={`
        relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-500
        ${rarityStyles.glow}
        ${isHovered ? 'shadow-3xl' : ''}
      `}>
        
        {/* Image avec overlay complexe */}
        <div className="relative h-80 overflow-hidden">
          <img
            src={box.image_url}
            alt={box.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Overlay gradient selon rareté */}
          <div className={`
            absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-40 transition-opacity duration-500
            ${rarityStyles.gradient}
          `} />
          
          {/* Shimmer effect */}
          <motion.div
            className={`absolute inset-0 ${rarityStyles.shimmer} opacity-0 group-hover:opacity-100`}
            animate={isHovered ? {
              x: ['-100%', '100%']
            } : {}}
            transition={{
              duration: 1.5,
              repeat: isHovered ? Infinity : 0,
              ease: "linear"
            }}
          />
          
          {/* Badges flottants */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-sm font-black shadow-xl">
                <Crown size={16} className="mr-2" />
                EXCLUSIVE
              </Badge>
              
              {box.hot && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                  🔥 HOT
                </Badge>
              )}
            </div>
            
            <Badge variant={getBadgeVariant(boxRarity)} className="font-black text-sm px-4 py-2 shadow-xl">
              {boxRarity.toUpperCase()}
            </Badge>
          </div>
          
          {/* Stats en bas */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                  <Users size={16} className="text-white" />
                  <span className="text-white font-bold text-sm">
                    {(box.times_opened || 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                  <TrendingUp size={16} className="text-green-400" />
                  <span className="text-green-400 font-bold text-sm">
                    {boxRarity === 'legendary' ? '+25%' : '+15%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className={`p-8 ${rarityStyles.bg} border-t-4 ${rarityStyles.border}`}>
          <div className="mb-6">
            <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
              {box.name}
            </h3>
            <p className="text-gray-600 leading-relaxed line-clamp-2">
              {box.description}
            </p>
          </div>

          {/* Prix premium */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
                <Coins size={24} className="text-primary-600" />
                <span className="text-3xl font-black text-primary-600">
                  {box.price_virtual}
                </span>
              </div>
              <div className="text-gray-500 font-semibold">
                ou {box.price_real}€
              </div>
            </div>
            
            {user ? (
              canAfford ? (
                <Badge variant="success" className="px-4 py-2 text-sm font-bold shadow-lg">
                  <Sparkles size={16} className="mr-1" />
                  Disponible
                </Badge>
              ) : (
                <Badge variant="error" className="px-4 py-2 text-sm font-bold">
                  Insuffisant
                </Badge>
              )
            ) : (
              <Badge variant="gray" className="px-4 py-2 text-sm font-bold">
                Connexion requise
              </Badge>
            )}
          </div>

          {/* Actions premium */}
          <div className="space-y-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                fullWidth
                disabled={!user || !canAfford}
                onClick={() => onOpenBox(box.id)}
                className={`
                  py-4 text-lg font-black shadow-xl transition-all duration-300
                  ${canAfford && user 
                    ? 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 hover:shadow-2xl hover:shadow-primary-500/30' 
                    : ''
                  }
                `}
              >
                <Play size={20} className="mr-2" />
                🎯 OUVRIR MAINTENANT
              </Button>
            </motion.div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push(`/boxes/${box.id}`)}
                className="py-3 font-bold bg-white/80 backdrop-blur-sm hover:bg-white border-2 hover:border-primary-300"
              >
                <Eye size={18} className="mr-2" />
                Détails
              </Button>
              
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  // Logique favoris
                }}
                className="px-4 py-3 bg-white/80 backdrop-blur-sm hover:bg-white border-2 hover:border-red-300"
              >
                <Heart size={18} className="text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Composant Premium Box Card
interface PremiumBoxCardProps {
  box: LootBox
  index: number
  userProfile: UserProfile | null
  user: any
  onOpenBox: (boxId: string) => void
  getRarity: (price: number) => string
  getRarityStyles: (rarity: string) => any
  getBadgeVariant: (rarity: string) => any
  setHoveredBox: (id: string | null) => void
  hoveredBox: string | null
}

function PremiumBoxCard({ 
  box, 
  index, 
  userProfile, 
  user, 
  onOpenBox, 
  getRarity, 
  getRarityStyles, 
  getBadgeVariant,
  setHoveredBox,
  hoveredBox
}: PremiumBoxCardProps) {
  const router = useRouter()
  const boxRarity = getRarity(box.price_virtual)
  const rarityStyles = getRarityStyles(boxRarity)
  const canAfford = userProfile ? userProfile.virtual_currency >= box.price_virtual : false
  const isHovered = hoveredBox === box.id
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      whileHover={{ y: -5, scale: 1.02 }}
      onHoverStart={() => setHoveredBox(box.id)}
      onHoverEnd={() => setHoveredBox(null)}
      className="group cursor-pointer"
    >
      <div className={`
        relative overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 border-2 border-gray-100
        ${rarityStyles.glow}
        ${isHovered ? 'shadow-2xl border-primary-200' : ''}
      `}>
        
        {/* Badges top */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
          <div className="flex flex-col gap-1">
            {box.new && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                ✨ NEW
              </Badge>
            )}
            {box.hot && (
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                🔥 HOT
              </Badge>
            )}
          </div>
          
          <Badge variant={getBadgeVariant(boxRarity)} className="font-bold text-xs px-3 py-1 shadow-lg">
            {boxRarity.toUpperCase()}
          </Badge>
        </div>

        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={box.image_url}
            alt={box.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          <div className={`
            absolute inset-0 bg-gradient-to-t opacity-20 group-hover:opacity-30 transition-opacity
            ${rarityStyles.gradient}
          `} />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Stats bottom */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                  <Users size={12} className="text-white" />
                  <span className="text-white text-xs font-bold">
                    {(box.times_opened || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                <TrendingUp size={12} className="text-green-400" />
                <span className="text-green-400 text-xs font-bold">
                  {boxRarity === 'legendary' ? '+20%' : '+10%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Titre et description */}
          <div className="mb-4">
            <h3 className="text-lg font-black text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">
              {box.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
              {box.description}
            </p>
          </div>

          {/* Prix */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-primary-50 rounded-xl px-3 py-2">
                <Coins size={18} className="text-primary-600" />
                <span className="text-xl font-black text-primary-600">
                  {box.price_virtual}
                </span>
              </div>
              <div className="text-gray-400 text-sm font-semibold">
                ou {box.price_real}€
              </div>
            </div>
            
            {user ? (
              canAfford ? (
                <Badge variant="success" size="sm" className="flex items-center gap-1 font-bold">
                  <Sparkles size={12} />
                  OK
                </Badge>
              ) : (
                <Badge variant="error" size="sm" className="font-bold">
                  Insuffisant
                </Badge>
              )
            ) : (
              <Badge variant="gray" size="sm" className="font-bold">
                Connexion
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              fullWidth
              disabled={!user || !canAfford}
              onClick={() => onOpenBox(box.id)}
              className={`
                py-3 font-bold transition-all duration-300
                ${canAfford && user 
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 hover:shadow-lg' 
                  : ''
                }
              `}
            >
              <ShoppingCart size={16} className="mr-2" />
              Ouvrir
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => router.push(`/boxes/${box.id}`)}
                className="font-semibold"
              >
                <Eye size={14} className="mr-1" />
                Détails
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className="px-3"
              >
                <Heart size={14} />
              </Button>
            </div>
          </div>

          {/* Barre de popularité */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-semibold">Popularité</span>
              <span className="text-xs text-gray-500 font-bold">
                {Math.min(Math.round((box.times_opened || 0) / 100), 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full bg-gradient-to-r ${rarityStyles.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((box.times_opened || 0) / 50, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Styles CSS additionnels pour les animations
const additionalStyles = `
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(200%) skewX(-12deg); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.shadow-3xl {
  box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
}
`