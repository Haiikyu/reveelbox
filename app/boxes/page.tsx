// app/boxes/page.tsx - Version Minimaliste avec Filtres Avancés
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Search, Coins, ArrowRight, Filter, TrendingUp, TrendingDown, Sparkles, AlertTriangle, X, ChevronDown } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/LoadingState'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// Interface pour les types
interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  price_real: number
  image_url: string
  is_active: boolean
  rarity?: string
  limited?: boolean
  popular?: boolean
  new?: boolean
  items_count?: number
  risk_level?: number
  average_return?: number
}

// Variantes d'animation optimisées avec types corrects
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    rotateY: -10 
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export default function BoxesPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const [boxes, setBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'risk'>('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRarity, setSelectedRarity] = useState('all')
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  
  const router = useRouter()
  const supabase = createClient()

  // Calculer la rareté selon le prix
  const calculateRarityFromPrice = (price: number): string => {
    if (price >= 400) return 'legendary'
    if (price >= 250) return 'epic'
    if (price >= 150) return 'rare'
    return 'common'
  }

  // Calculer le niveau de risque
  const calculateRiskLevel = (price: number): number => {
    if (price >= 400) return 85
    if (price >= 250) return 70
    if (price >= 150) return 50
    return 30
  }

  // Calculer le retour moyen estimé
  const calculateAverageReturn = (price: number): number => {
    const baseReturn = price * 0.9
    const variance = price * 0.4
    return Math.round(baseReturn + (Math.random() * variance - variance/2))
  }

  // Fonction pour afficher les messages
  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(''), 5000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  // Protection de route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Charger les données depuis Supabase
  useEffect(() => {
    const fetchBoxes = async () => {
      if (!isAuthenticated) return

      try {
        setLoading(true)
        setError('')

        const { data: boxesData, error: boxesError } = await supabase
          .from('loot_boxes')
          .select(`
            id,
            name,
            description,
            price_virtual,
            price_real,
            image_url,
            is_active,
            banner_url,
            loot_box_items!inner (
              id
            )
          `)
          .eq('is_active', true)
          .neq('is_daily_free', true)
          .order('price_virtual', { ascending: false })

        if (boxesError) {
          console.error('Erreur lors du chargement des boîtes:', boxesError)
          throw boxesError
        }

        if (!boxesData || boxesData.length === 0) {
          setBoxes([])
          setLoading(false)
          return
        }

        const mappedBoxes: LootBox[] = boxesData.map((box: any) => {
          const itemsCount = box.loot_box_items?.length || 0
          const rarity = calculateRarityFromPrice(box.price_virtual)
          const riskLevel = calculateRiskLevel(box.price_virtual)
          const averageReturn = calculateAverageReturn(box.price_virtual)
          
          return {
            id: box.id,
            name: box.name,
            description: box.description || '',
            price_virtual: box.price_virtual,
            price_real: box.price_real || 0,
            image_url: box.image_url || '',
            is_active: box.is_active,
            items_count: itemsCount,
            rarity,
            risk_level: riskLevel,
            average_return: averageReturn,
            limited: box.price_virtual >= 350,
            popular: [320, 220, 150].includes(box.price_virtual),
            new: box.name.toLowerCase().includes('new') || box.name.toLowerCase().includes('fresh')
          }
        })
        
        setBoxes(mappedBoxes)
        
        if (mappedBoxes.length > 0) {
          const prices = mappedBoxes.map(b => b.price_virtual)
          setPriceRange([Math.min(...prices), Math.max(...prices)])
        }

      } catch (error) {
        console.error('Erreur critique:', error)
        showMessage('Erreur lors du chargement des boîtes', 'error')
        setBoxes([])
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchBoxes()
    }
  }, [authLoading, isAuthenticated, supabase])

  // Filtrer et trier les boîtes
  const filteredAndSortedBoxes = useMemo(() => {
    let filtered = boxes.filter(box => {
      const matchesSearch = box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           box.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRarity = selectedRarity === 'all' || box.rarity === selectedRarity
      
      const matchesPrice = box.price_virtual >= priceRange[0] && box.price_virtual <= priceRange[1]
      
      const matchesRisk = riskFilter === 'all' || 
        (riskFilter === 'low' && (box.risk_level || 0) < 40) ||
        (riskFilter === 'medium' && (box.risk_level || 0) >= 40 && (box.risk_level || 0) < 70) ||
        (riskFilter === 'high' && (box.risk_level || 0) >= 70)
      
      return matchesSearch && matchesRarity && matchesPrice && matchesRisk && box.is_active
    })

    switch (sortBy) {
      case 'price_asc':
        return filtered.sort((a, b) => a.price_virtual - b.price_virtual)
      case 'price_desc':
        return filtered.sort((a, b) => b.price_virtual - a.price_virtual)
      case 'risk':
        return filtered.sort((a, b) => (b.risk_level || 0) - (a.risk_level || 0))
      case 'popular':
      default:
        return filtered.sort((a, b) => {
          if (a.popular !== b.popular) return a.popular ? -1 : 1
          if (a.new !== b.new) return a.new ? -1 : 1
          if (a.limited !== b.limited) return a.limited ? -1 : 1
          return b.price_virtual - a.price_virtual
        })
    }
  }, [boxes, searchQuery, selectedRarity, priceRange, riskFilter, sortBy])

  // Statistiques
  const stats = useMemo(() => {
    if (filteredAndSortedBoxes.length === 0) return null
    
    const prices = filteredAndSortedBoxes.map(b => b.price_virtual)
    const risks = filteredAndSortedBoxes.map(b => b.risk_level || 0)
    
    return {
      count: filteredAndSortedBoxes.length,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      avgRisk: Math.round(risks.reduce((a, b) => a + b, 0) / risks.length)
    }
  }, [filteredAndSortedBoxes])

  // Naviguer vers l'ouverture
  const handleBoxClick = (boxId: string) => {
    router.push(`/boxes/${boxId}`)
  }

  // Couleurs de rareté
  const getRarityGlow = (rarity: string) => {
    const glows = {
      common: '#10b981',
      rare: '#3b82f6', 
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }
    return glows[rarity as keyof typeof glows] || glows.common
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingState size="lg" text="Chargement des boîtes..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      
      {/* Messages de notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header Minimaliste */}
      <div className="pt-40 pb-4">
        <div className="max-w-7xl mx-auto px-6">
          

          {/* Barre de recherche et filtres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="popular">Populaires</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="risk">Niveau de risque</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg border transition-all flex items-center gap-2 ${
                  showFilters 
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' 
                    : 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Filter size={16} />
                <span className="text-sm font-medium">Filtres</span>
                {(selectedRarity !== 'all' || riskFilter !== 'all') && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Panneau de filtres avancés */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Filtre par rareté */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Rareté
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'common', 'rare', 'epic', 'legendary'].map((rarity) => (
                          <button
                            key={rarity}
                            onClick={() => setSelectedRarity(rarity)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              selectedRarity === rarity
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {rarity === 'all' ? 'Toutes' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtre par niveau de risque */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Niveau de risque
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: 'Tous' },
                          { value: 'low', label: 'Faible' },
                          { value: 'medium', label: 'Moyen' },
                          { value: 'high', label: 'Élevé' }
                        ].map((risk) => (
                          <button
                            key={risk.value}
                            onClick={() => setRiskFilter(risk.value as any)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              riskFilter === risk.value
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {risk.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gamme de prix */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Prix: {priceRange[0]} - {priceRange[1]} coins
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={1000}
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                          className="flex-1"
                        />
                        <input
                          type="range"
                          min={0}
                          max={1000}
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedRarity('all')
                        setRiskFilter('all')
                        setPriceRange([0, 1000])
                        setSearchQuery('')
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Statistiques */}
          {stats && filteredAndSortedBoxes.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-8"
            >
              <span>{stats.count} boîte{stats.count > 1 ? 's' : ''}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>Prix moyen: {stats.avgPrice} coins</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>Risque moyen: {stats.avgRisk}%</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Grid des boîtes */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {filteredAndSortedBoxes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6 opacity-20">📦</div>
            <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-4">
              {boxes.length === 0 ? 'Aucune boîte disponible' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {boxes.length === 0 
                ? 'Les boîtes seront bientôt disponibles.'
                : 'Essayez de modifier vos critères de recherche.'
              }
            </p>
            {filteredAndSortedBoxes.length === 0 && boxes.length > 0 && (
              <button 
                onClick={() => { 
                  setSearchQuery(''); 
                  setSelectedRarity('all');
                  setRiskFilter('all');
                  setPriceRange([0, 1000]);
                  setShowFilters(false);
                }}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                Réinitialiser tous les filtres
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12"
          >
            {filteredAndSortedBoxes.map((box, index) => (
              <FloatingBoxCard
                key={box.id}
                box={box}
                index={index}
                user={user}
                profile={profile}
                onBoxClick={handleBoxClick}
                getRarityGlow={getRarityGlow}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Composant FloatingBoxCard (INCHANGÉ)
interface FloatingBoxCardProps {
  box: LootBox
  index: number
  user: any
  profile: any
  onBoxClick: (boxId: string) => void
  getRarityGlow: (rarity: string) => string
}

function FloatingBoxCard({ 
  box, 
  index,
  user, 
  profile, 
  onBoxClick, 
  getRarityGlow
}: FloatingBoxCardProps) {
  const canAfford = profile ? profile.virtual_currency >= box.price_virtual : false
  const glowColor = getRarityGlow(box.rarity || 'common')
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ 
        y: -20,
        rotateY: 15,
        rotateX: -5,
        scale: 1.05
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => onBoxClick(box.id)}
    >
      <motion.div className="relative">
        
        {/* Badges flottants */}
        <div className="absolute -top-2 -right-2 z-20 flex flex-col gap-1">
          {box.limited && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            >
              LIMITED
            </motion.div>
          )}
          {box.new && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            >
              NEW
            </motion.div>
          )}
          {box.popular && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            >
              HOT
            </motion.div>
          )}
        </div>

        {/* Ombre dynamique */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black/10 dark:bg-black/20 rounded-full blur-lg transition-colors"
          animate={{
            scale: isHovered ? 1.5 : 1,
            opacity: isHovered ? 0.3 : 0.1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Image de la boîte */}
        <div className="relative mb-4">
          <motion.img
            src={box.image_url}
            alt={box.name}
            className="w-full h-48 object-contain drop-shadow-2xl"
            animate={{
              filter: isHovered 
                ? `drop-shadow(0 25px 50px ${glowColor}40) brightness(1.1)`
                : 'drop-shadow(0 10px 25px rgba(0,0,0,0.15)) brightness(1)'
            }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJvw65lPC90ZXh0Pgo8L3N2Zz4K'
            }}
          />
        </div>

        {/* Informations */}
        <motion.div
          className="text-center"
          animate={{
            y: isHovered ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 truncate transition-colors">
            {box.name}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 transition-colors">
            {box.description}
          </p>

          {/* Statistiques discrètes */}
          {box.items_count && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {box.items_count} objets disponibles
            </div>
          )}

          {/* Prix */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coins size={18} style={{ color: glowColor }} />
            <span className="text-xl font-black text-gray-900 dark:text-white transition-colors">
              {box.price_virtual.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">coins</span>
          </div>

          {/* Indicateur de disponibilité */}
          <div className={`text-sm font-bold mb-3 ${
            canAfford && user ? 'text-green-600' : 'text-red-500'
          }`}>
            {!user ? 'Connexion requise' : !canAfford ? 'Coins insuffisants' : ''}
          </div>

          {/* Action au hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="text-center"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              canAfford && user 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              <ArrowRight size={14} />
              {canAfford && user ? 'Cliquez pour ouvrir' : 'Non disponible'}
            </div>
          </motion.div>
        </motion.div>

      </motion.div>
    </motion.div>
  )
}