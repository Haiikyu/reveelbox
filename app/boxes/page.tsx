// app/boxes/page.tsx - Version corrigée TypeScript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Search, Coins, ArrowRight } from 'lucide-react'
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
  const [selectedRarity, setSelectedRarity] = useState('all')
  
  const router = useRouter()
  const supabase = createClient()

  // Calculer la rareté selon le prix
  const calculateRarityFromPrice = (price: number): string => {
    if (price >= 400) return 'legendary'
    if (price >= 250) return 'epic'
    if (price >= 150) return 'rare'
    return 'common'
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

  // Charger les données depuis Supabase avec fallback
  useEffect(() => {
    const fetchBoxes = async () => {
      if (!isAuthenticated) return

      try {
        setLoading(true)
        setError('')
        
        console.log('Fetching loot boxes from Supabase...')

        // Charger toutes les boîtes actives depuis Supabase avec comptage des items
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
          .neq('is_daily_free', true) // Exclure les freedrop
          .order('price_virtual', { ascending: false })

        console.log('Supabase query result:', { boxesData, boxesError })

        if (boxesError) {
          console.error('Erreur lors du chargement des boîtes:', boxesError)
          throw boxesError
        }

        if (!boxesData || boxesData.length === 0) {
          console.log('Aucune boîte trouvée en base')
          showMessage('Aucune boîte disponible pour le moment', 'error')
          setBoxes([])
          setLoading(false)
          return
        }

        // Mapper les données et calculer les propriétés
        const mappedBoxes: LootBox[] = boxesData.map((box: any) => {
          const itemsCount = box.loot_box_items?.length || 0
          const rarity = calculateRarityFromPrice(box.price_virtual)
          
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
            limited: box.price_virtual >= 350,
            popular: [320, 220, 150].includes(box.price_virtual),
            new: box.name.toLowerCase().includes('new') || box.name.toLowerCase().includes('fresh')
          }
        })
        
        console.log('Processed boxes:', mappedBoxes)
        setBoxes(mappedBoxes)
        showMessage(`${mappedBoxes.length} boîtes chargées avec succès`, 'success')

      } catch (error) {
        console.error('Erreur critique:', error)
        showMessage('Erreur lors du chargement des boîtes', 'error')
        setBoxes([]) // S'assurer que la liste est vide en cas d'erreur
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchBoxes()
    }
  }, [authLoading, isAuthenticated, supabase])

  // Filtres de rareté
  const rarityFilters = [
    { value: 'all', label: 'Toutes', count: boxes.length },
    { value: 'legendary', label: 'Légendaires', count: boxes.filter(b => b.rarity === 'legendary').length },
    { value: 'epic', label: 'Épiques', count: boxes.filter(b => b.rarity === 'epic').length },
    { value: 'rare', label: 'Rares', count: boxes.filter(b => b.rarity === 'rare').length },
    { value: 'common', label: 'Communes', count: boxes.filter(b => b.rarity === 'common').length }
  ]

  // Filtrer les boîtes
  const filteredBoxes = boxes.filter(box => {
    const matchesSearch = box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         box.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRarity = selectedRarity === 'all' || box.rarity === selectedRarity
    return matchesSearch && matchesRarity && box.is_active
  })

  // Naviguer vers l'ouverture au clic sur la boîte
  const handleBoxClick = (boxId: string) => {
    console.log('Navigating to box:', boxId)
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center transition-colors duration-300">
        <LoadingState size="lg" text="Chargement des boîtes..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      
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
      
      {/* Header épuré */}
      <div className="pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          
          {/* Titre */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl font-black text-gray-900 dark:text-white mb-4 transition-colors"
          >
            Unboxing
          </motion.h1>
          
          {/* Solde utilisateur */}
          {user && profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg mb-8 border border-gray-200/50 dark:border-gray-700/50 transition-colors"
            >
              <Coins size={24} className="text-green-600" />
              <span className="text-2xl font-black text-gray-900 dark:text-white transition-colors">
                {profile.virtual_currency || 0}
              </span>
              <span className="text-gray-600 dark:text-gray-400 font-medium transition-colors">coins</span>
            </motion.div>
          )}

          {/* Recherche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Rechercher une boîte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </motion.div>

          {/* Filtres de rareté */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="flex gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-colors">
              {rarityFilters.map((filter) => (
                <motion.button
                  key={filter.value}
                  onClick={() => setSelectedRarity(filter.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 relative
                    ${selectedRarity === filter.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      ({filter.count})
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grid des boîtes */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        
        {filteredBoxes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">📦</div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
              {boxes.length === 0 ? 'Aucune boîte disponible' : 'Aucune boîte trouvée'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 transition-colors">
              {boxes.length === 0 
                ? 'Les boîtes seront bientôt disponibles. Revenez plus tard !'
                : 'Modifiez vos critères de recherche pour voir plus de boîtes'
              }
            </p>
            {filteredBoxes.length === 0 && boxes.length > 0 && (
              <Button 
                onClick={() => { 
                  setSearchQuery(''); 
                  setSelectedRarity('all'); 
                }}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-4 text-lg font-bold"
              >
                Voir toutes les boîtes
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12"
          >
            {filteredBoxes.map((box, index) => (
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

        {/* CTA pour acheter des coins */}
        {user && boxes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center mt-20"
          >
            <div className="inline-flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-colors">
              <span className="text-xl text-gray-600 dark:text-gray-400 transition-colors">Besoin de plus de coins ?</span>
              <Button 
                onClick={() => router.push('/buy-coins')}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 font-bold"
              >
                <Coins size={20} className="mr-2" />
                Recharger
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Composant FloatingBoxCard
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
            {!user ? 'Connexion requise' : !canAfford ? 'Coins insuffisants' : 'Disponible'}
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

        {/* Indicateur de rareté animé */}
        <motion.div
          className="absolute top-2 left-2 w-3 h-3 rounded-full"
          style={{ backgroundColor: glowColor }}
          animate={{
            scale: isHovered ? [1, 1.3, 1] : 1,
            opacity: isHovered ? [0.7, 1, 0.7] : 0.7
          }}
          transition={{ 
            duration: isHovered ? 1 : 0.3,
            repeat: isHovered ? Infinity : 0 
          }}
        />

        {/* Effet de particules pour les boîtes rares - CORRIGÉ */}
        {(box.rarity === 'legendary' || box.rarity === 'epic') && isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * (Math.PI / 180)
              const distance = 20
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  style={{ 
                    backgroundColor: glowColor,
                    left: '50%',
                    top: '50%'
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0, 
                    scale: 0 
                  }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              )
            })}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}