'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Coins, Gift, Play, Trophy } from 'lucide-react'
import { useAuth } from '../../components/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { use } from 'react' // Import pour Next.js 15

// Interfaces
interface LootBoxItem {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  probability: number
  image_url: string
  market_value: number
  description?: string
}

interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  price_real: number
  image_url: string
  is_active: boolean
  times_opened?: number
  created_at: string
  loot_box_items?: Array<{
    probability: number
    items: LootBoxItem
  }>
}

// Types pour Next.js 15
interface PageProps {
  params: Promise<{ id: string }>
}

export default function BoxOpeningPage({ params }: PageProps) {
  // Unwrap params using React.use() for Next.js 15
  const resolvedParams = use(params)
  const { id } = resolvedParams

  const { user, profile, loading, isAuthenticated, refreshProfile } = useAuth()
  const [box, setBox] = useState<LootBox | null>(null)
  const [items, setItems] = useState<LootBoxItem[]>([])
  const [boxLoading, setBoxLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // États roulette
  const [isSpinning, setIsSpinning] = useState(false)
  const [wonItem, setWonItem] = useState<LootBoxItem | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [wheelItems, setWheelItems] = useState<LootBoxItem[]>([])
  const [finalPosition, setFinalPosition] = useState(0)
  
  // États mode
  const [openMode, setOpenMode] = useState<'single' | 'demo'>('single')

  const wheelRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Protection de route selon le standard
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // Messages de notification
  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(''), 4000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(''), 4000)
    }
  }

  // Charger la boîte depuis Supabase
  useEffect(() => {
    if (!isAuthenticated || !user || !id) return

    const fetchBoxAndItems = async () => {
      try {
        setBoxLoading(true)

        // Gestion des requêtes avec fallback selon le standard
        let boxData = null
        let itemsList = []

        try {
          // Essayer d'abord requête avec jointures
          const { data: joinedData, error: joinError } = await supabase
            .from('loot_boxes')
            .select(`
              *,
              loot_box_items (
                probability,
                items (
                  id,
                  name,
                  description,
                  rarity,
                  image_url,
                  market_value
                )
              )
            `)
            .eq('id', id)
            .eq('is_active', true)
            .single()

          if (joinError) {
            console.warn('Erreur jointure, fallback:', joinError)
            
            // Fallback : requête simple
            const { data: simpleData, error: simpleError } = await supabase
              .from('loot_boxes')
              .select('*')
              .eq('id', id)
              .eq('is_active', true)
              .single()

            if (simpleError) throw simpleError
            boxData = simpleData
            
            // Charger les items séparément si fallback
            if (boxData) {
              const { data: boxItems } = await supabase
                .from('loot_box_items')
                .select(`
                  probability,
                  items (*)
                `)
                .eq('loot_box_id', boxData.id)

              if (boxItems && boxItems.length > 0) {
                itemsList = boxItems.map((lbi: any) => ({
                  ...lbi.items,
                  probability: lbi.probability
                }))
              }
            }
          } else {
            boxData = joinedData
            if (boxData?.loot_box_items && boxData.loot_box_items.length > 0) {
              itemsList = boxData.loot_box_items.map((lbi: any) => ({
                ...lbi.items,
                probability: lbi.probability
              }))
            }
          }

        } catch (fetchError) {
          console.error('Erreur chargement box:', fetchError)
          showMessage('Boîte introuvable', 'error')
          router.push('/boxes')
          return
        }

        if (!boxData) {
          showMessage('Boîte introuvable', 'error')
          router.push('/boxes')
          return
        }

        setBox(boxData)

        if (itemsList.length > 0) {
          setItems(itemsList)
          createWheelItems(itemsList)
        } else {
          showMessage('Aucun item trouvé pour cette boîte', 'error')
          router.push('/boxes')
          return
        }

      } catch (error) {
        console.error('Erreur:', error)
        showMessage('Erreur lors du chargement', 'error')
      } finally {
        setBoxLoading(false)
      }
    }

    fetchBoxAndItems()
  }, [id, isAuthenticated, user, router, supabase])

  // Créer les items pour la roulette (50 items basés sur probabilités)
  const createWheelItems = (baseItems: LootBoxItem[]) => {
    const wheelArray: LootBoxItem[] = []
    
    for (let i = 0; i < 50; i++) {
      const randomItem = selectRandomItemByProbability(baseItems)
      wheelArray.push({
        ...randomItem,
        id: `wheel-${i}-${randomItem.id}`
      })
    }
    
    setWheelItems(wheelArray)
    setFinalPosition(0)
    
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
    }
  }

  // Sélection selon probabilités
  const selectRandomItemByProbability = (baseItems: LootBoxItem[]): LootBoxItem => {
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const item of baseItems) {
      cumulative += item.probability
      if (random <= cumulative) {
        return item
      }
    }
    
    return baseItems[baseItems.length - 1]
  }

  // Fonction d'ouverture simplifiée selon les standards
  const openLootBox = async (): Promise<LootBoxItem> => {
    if (!user || !box) throw new Error('Utilisateur non connecté')

    try {
      // Vérifier le solde
      if (profile && profile.virtual_currency < box.price_virtual) {
        throw new Error('Coins insuffisants')
      }

      // Sélectionner un item gagnant
      const wonItem = selectRandomItemByProbability(items)

      // Déduire les coins
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          virtual_currency: (profile?.virtual_currency || 0) - box.price_virtual 
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Ajouter à l'inventaire
      const { error: inventoryError } = await supabase
        .from('user_inventory')
        .insert({
          user_id: user.id,
          item_id: wonItem.id,
          quantity: 1,
          obtained_at: new Date().toISOString()
        })

      if (inventoryError) throw inventoryError

      // Enregistrer la transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'open_box',
          virtual_amount: box.price_virtual,
          loot_box_id: box.id,
          item_id: wonItem.id,
          created_at: new Date().toISOString()
        })

      if (transactionError) throw transactionError

      // Rafraîchir le profil selon les standards
      if (refreshProfile) {
        await refreshProfile()
      }

      return wonItem
    } catch (error) {
      console.error('Error opening box:', error)
      throw error
    }
  }

  // Animation fluide de la roulette
  const animateWheel = (duration: number, distance: number, winningItem: LootBoxItem) => {
    if (!wheelRef.current) return

    const start = performance.now()
    const startPosition = 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - start
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing plus fluide
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const currentPosition = startPosition - (distance * easeOut)
      
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateX(${currentPosition}px)`
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setFinalPosition(currentPosition)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  // Lancer l'animation de spin
  const performSpin = async () => {
    let winningItem: LootBoxItem

    if (openMode === 'single') {
      try {
        winningItem = await openLootBox()
      } catch (error: any) {
        showMessage(error.message || 'Erreur lors de l\'ouverture', 'error')
        setIsSpinning(false)
        return
      }
    } else {
      winningItem = selectRandomItemByProbability(items)
    }

    // Calculer la distance pour centrer l'item gagnant
    const itemWidth = 200 // Largeur d'un item
    const winningIndex = Math.floor(Math.random() * 10) + 20 // Position aléatoire au centre
    const finalDistance = winningIndex * itemWidth
    const duration = 3500

    // Remplacer l'item à la position gagnante
    const newWheelItems = [...wheelItems]
    newWheelItems[winningIndex] = {
      ...winningItem,
      id: `winning-${winningIndex}-${winningItem.id}`
    }
    setWheelItems(newWheelItems)

    animateWheel(duration, finalDistance, winningItem)

    setTimeout(() => {
      setWonItem(winningItem)
      setIsSpinning(false)
      
      setTimeout(() => {
        setShowResult(true)
      }, 500)
      
    }, duration + 500)
  }

  // Fonction de spin principale
  const spinWheel = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setShowResult(false)
    setWonItem(null)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (openMode === 'single') {
      if (!user) {
        showMessage('Connectez-vous pour jouer', 'error')
        setIsSpinning(false)
        return
      }
      
      if (!profile || profile.virtual_currency < box!.price_virtual) {
        showMessage('Coins insuffisants', 'error')
        setIsSpinning(false)
        return
      }
    }
    
    performSpin()
  }

  // Reset de la roulette
  const resetWheel = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
    }
    
    setIsSpinning(false)
    setShowResult(false)
    setWonItem(null)
    setFinalPosition(0)
    createWheelItems(items)
  }

  // Styles selon rareté
  const getRarityStyles = (rarity: string) => {
    const styles = {
      common: {
        gradient: 'from-gray-400 to-gray-600',
        glow: '#9ca3af',
        border: 'border-gray-300',
        bg: 'bg-gray-50'
      },
      rare: {
        gradient: 'from-blue-400 to-blue-600',
        glow: '#3b82f6',
        border: 'border-blue-300',
        bg: 'bg-blue-50'
      },
      epic: {
        gradient: 'from-purple-400 to-purple-600',
        glow: '#8b5cf6',
        border: 'border-purple-300',
        bg: 'bg-purple-50'
      },
      legendary: {
        gradient: 'from-yellow-400 to-orange-500',
        glow: '#f59e0b',
        border: 'border-yellow-300',
        bg: 'bg-yellow-50'
      }
    }
    return styles[rarity as keyof typeof styles] || styles.common
  }

  if (loading || !box) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-white text-xl font-bold">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 relative">
      
      {/* Messages de notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 font-medium"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 font-medium"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header avec bouton retour */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 z-10"
      >
        <button
          onClick={() => router.push('/boxes')}
          className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Retour</span>
        </button>
      </motion.div>

      {/* Contenu principal */}
      <div className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* En-tête de la boîte */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              className="relative inline-block mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <img 
                src={box.image_url}
                alt={box.name}
                className="w-48 h-48 object-contain drop-shadow-xl"
              />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-white mb-4">
              {box.name}
            </h1>
            
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              {box.description}
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">
                  {profile?.virtual_currency || 0}
                </div>
                <div className="text-white/70 text-sm">Vos coins</div>
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">
                  {box.price_virtual}
                </div>
                <div className="text-white/70 text-sm">Prix</div>
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {items.length}
                </div>
                <div className="text-white/70 text-sm">Objets</div>
              </div>
            </div>

            {/* Sélecteur de mode */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex gap-1">
                <button
                  onClick={() => setOpenMode('single')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    openMode === 'single'
                      ? 'bg-green-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Mode Réel
                </button>
                <button
                  onClick={() => setOpenMode('demo')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    openMode === 'demo'
                      ? 'bg-blue-500 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Mode Démo
                </button>
              </div>
            </div>
          </motion.div>

          {/* GRANDE ROULETTE - Section principale */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Roulette
              </h2>
              <p className="text-gray-300">
                {isSpinning ? "En cours..." : "Lancez pour découvrir votre gain"}
              </p>
            </div>

            {/* Container roulette ÉLARGI */}
            <div className="relative mb-8 bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
              
              {/* Indicateur central élégant */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-1 h-48 bg-gradient-to-b from-yellow-400 to-orange-500 shadow-2xl rounded-full"></div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-yellow-400 rounded-full shadow-xl border-2 border-white">
                  <div className="absolute inset-1 bg-white rounded-full opacity-40"></div>
                </div>
              </div>
              
              {/* Container de la roulette AGRANDI */}
              <div className="relative h-64 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/20">
                
                {/* Gradients de fade subtils */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-10"></div>

                {/* Items de la roulette AGRANDIS */}
                <div 
                  ref={wheelRef}
                  className="flex absolute h-full items-center transition-transform ease-out"
                  style={{
                    transform: 'translateX(0px)',
                    paddingLeft: '50%',
                    willChange: 'transform'
                  }}
                >
                  {wheelItems.map((item, index) => {
                    const rarityStyles = getRarityStyles(item.rarity)
                    
                    return (
                      <motion.div
                        key={item.id}
                        className="flex-shrink-0 w-48 h-56 mx-3"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`
                          w-full h-full rounded-2xl border-3 p-4 flex flex-col items-center justify-between
                          bg-white/10 backdrop-blur-md ${rarityStyles.border}
                          hover:bg-white/20 transition-all duration-300
                        `}>
                          
                          {/* Badge de rareté */}
                          <div className={`px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r ${rarityStyles.gradient} text-white shadow-lg`}>
                            {item.rarity === 'legendary' ? 'LEGENDARY' :
                             item.rarity === 'epic' ? 'EPIC' :
                             item.rarity === 'rare' ? 'RARE' : 'COMMON'}
                          </div>

                          {/* Image */}
                          <div className="flex-1 flex items-center justify-center p-2">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-28 h-28 object-contain filter drop-shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/api/placeholder/150/150'
                              }}
                            />
                          </div>
                          
                          {/* Nom de l'item */}
                          <div className="text-white text-sm font-bold text-center px-2 leading-tight">
                            {item.name}
                          </div>
                          
                          {/* Valeur */}
                          <div className="flex items-center gap-1 text-yellow-400 bg-black/30 px-2 py-1 rounded-lg">
                            <Coins size={14} />
                            <span className="font-bold text-sm">{item.market_value}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bouton de lancement */}
            <div className="text-center">
              <motion.button
                onClick={spinWheel}
                disabled={isSpinning || (openMode === 'single' && (!profile || profile.virtual_currency < box.price_virtual))}
                className={`px-16 py-5 text-2xl font-bold rounded-2xl shadow-2xl transition-all duration-300 ${
                  isSpinning 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : openMode === 'single'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-green-500/30'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-blue-500/30'
                } ${(!profile || profile.virtual_currency < box.price_virtual) && openMode === 'single' ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={!isSpinning ? { scale: 1.05 } : {}}
                whileTap={!isSpinning ? { scale: 0.95 } : {}}
              >
                <div className="flex items-center gap-4">
                  {isSpinning ? (
                    <>
                      <motion.div 
                        className="w-7 h-7 border-3 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      En cours...
                    </>
                  ) : (
                    <>
                      <Play size={28} />
                      {openMode === 'demo' ? 'Essai gratuit' : `Lancer (${box.price_virtual} coins)`}
                    </>
                  )}
                </div>
              </motion.button>
              
              {/* Message d'erreur pour coins insuffisants */}
              {(!profile || profile.virtual_currency < box.price_virtual) && openMode === 'single' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-red-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-md"
                >
                  <p className="text-red-300 font-bold text-lg">
                    Coins insuffisants
                    {profile && (
                      <span className="ml-3 bg-red-500/30 px-3 py-1 rounded-full text-sm">
                        {box.price_virtual - profile.virtual_currency} coins manquants
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => router.push('/buy-coins')}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-xl transition-colors"
                  >
                    Recharger
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Aperçu des objets - Section secondaire */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-xl font-bold text-white text-center mb-6">
              Objets disponibles
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((item, index) => {
                const rarityStyles = getRarityStyles(item.rarity)
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`bg-white/10 backdrop-blur-md rounded-xl p-3 border-2 ${rarityStyles.border} relative overflow-hidden`}
                  >
                    <div className={`absolute -top-1 -right-1 bg-gradient-to-r ${rarityStyles.gradient} text-white px-2 py-0.5 rounded-lg text-xs font-bold`}>
                      {item.rarity === 'legendary' ? 'LEG' :
                       item.rarity === 'epic' ? 'EPI' :
                       item.rarity === 'rare' ? 'RAR' : 'COM'}
                    </div>

                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-16 object-contain mb-2"
                    />
                    
                    <h4 className="text-white font-medium text-xs text-center mb-1 line-clamp-2">
                      {item.name}
                    </h4>
                    
                    <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs">
                      <Coins size={10} />
                      <span className="font-bold">{item.market_value}</span>
                    </div>
                    
                    <div className="text-center text-white/60 text-xs mt-1">
                      {item.probability}%
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal de résultat */}
      <AnimatePresence>
        {showResult && wonItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className={`max-w-md w-full rounded-2xl p-8 border-2 ${getRarityStyles(wonItem.rarity).border} bg-slate-900/90 backdrop-blur-md relative`}
            >
              
              <button
                onClick={() => setShowResult(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-xl"
              >
                ✕
              </button>
              
              <div className="text-center">
                
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Félicitations !
                  </h2>
                  <p className="text-gray-300">
                    Vous avez gagné un objet{' '}
                    <span className={`font-bold bg-gradient-to-r ${getRarityStyles(wonItem.rarity).gradient} bg-clip-text text-transparent`}>
                      {wonItem.rarity.toUpperCase()}
                    </span>
                  </p>
                </div>

                <div className={`p-6 rounded-xl border-2 ${getRarityStyles(wonItem.rarity).border} bg-white/5 mb-6`}>
                  <img 
                    src={wonItem.image_url} 
                    alt={wonItem.name}
                    className="w-32 h-32 object-contain mx-auto mb-4"
                  />
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    {wonItem.name}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-2 bg-black/40 rounded-lg p-2">
                    <Coins className="text-yellow-400" size={20} />
                    <span className="text-white font-bold text-lg">
                      {wonItem.market_value}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => router.push('/inventory')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    Voir l'inventaire
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowResult(false)
                      resetWheel()
                    }}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-bold transition-colors"
                  >
                    Rejouer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}