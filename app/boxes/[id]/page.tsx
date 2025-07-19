'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Coins, Heart, Eye, Gift, Play, Trophy, Zap, Sparkles, Crown } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { CurrencyDisplay } from '../../components/ui/CurrencyDisplay'
import { Modal } from '../../components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
  animation_url?: string
  created_at: string
  loot_box_items?: Array<{
    items: LootBoxItem
  }>
}

interface BoxPageParams {
  params: {
    id: string
  }
}

export default function BoxPage({ params }: BoxPageParams) {
  const [box, setBox] = useState<LootBox | null>(null)
  const [items, setItems] = useState<LootBoxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userCoins, setUserCoins] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // États roulette
  const [isSpinning, setIsSpinning] = useState(false)
  const [wonItem, setWonItem] = useState<LootBoxItem | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [wheelItems, setWheelItems] = useState<LootBoxItem[]>([])
  const [centralItemIndex, setCentralItemIndex] = useState(-1)
  const [spinSpeed, setSpinSpeed] = useState(0)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([])
  
  // États modals
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [openMode, setOpenMode] = useState<'single' | 'demo'>('single')

  const wheelRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()

  // Fonction pour afficher les messages
  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(''), 3000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  // Sons (simulation)
  const playSound = useCallback((type: 'spin' | 'win' | 'tick') => {
    console.log(`🔊 Son: ${type}`)
  }, [])

  // Charger la boîte et ses items depuis Supabase
  useEffect(() => {
    const fetchBoxAndItems = async () => {
      try {
        // Récupérer l'utilisateur actuel
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        // Charger la boîte
        const { data: boxData, error: boxError } = await supabase
          .from('loot_boxes')
          .select(`
            *,
            loot_box_items (
              items (*)
            )
          `)
          .eq('id', params.id)
          .eq('is_active', true)
          .single()



        setBox(boxData)

        // Extraire les items
        if (boxData.loot_box_items) {
          const itemsList = boxData.loot_box_items.map((lbi: any) => lbi.items)
          setItems(itemsList)
          createWheelItems(itemsList)
        }

        // Charger les coins de l'utilisateur
        if (currentUser) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('virtual_currency')
            .eq('id', currentUser.id)
            .single()

          if (profileData) {
            setUserCoins(profileData.virtual_currency)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Erreur:', error)
        showMessage('Erreur lors du chargement', 'error')
        setLoading(false)
      }
    }

    fetchBoxAndItems()
  }, [params.id, router])

  // Créer les items de la roue
  const createWheelItems = (baseItems: LootBoxItem[]) => {
    const wheelArray: LootBoxItem[] = []
    
    for (let i = 0; i < 60; i++) {
      const randomItem = selectRandomItemByProbability(baseItems)
      wheelArray.push({
        ...randomItem,
        id: `wheel-${i}-${randomItem.id}-${Date.now()}`
      })
    }
    
    setWheelItems(wheelArray)
    setCentralItemIndex(-1)
    
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

  // Calculer l'item au centre
  const updateCentralItem = useCallback((currentPosition: number) => {
    if (!containerRef.current || wheelItems.length === 0) return

    const containerWidth = containerRef.current.offsetWidth
    const containerCenter = containerWidth / 2
    const itemWidth = 240
    
    const visibleOffset = Math.abs(currentPosition)
    const centerItemIndex = Math.round(visibleOffset / itemWidth)
    
    if (centerItemIndex >= 0 && centerItemIndex < wheelItems.length) {
      setCentralItemIndex(centerItemIndex)
    }
  }, [wheelItems])

  // Animation fluide
  const animateWheel = (duration: number, distance: number, finalItem: LootBoxItem) => {
    if (!wheelRef.current) return

    const start = performance.now()
    const startPosition = 0
    playSound('spin')

    const animate = (currentTime: number) => {
      const elapsed = currentTime - start
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing plus fluide sans rebond ni secousse
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const currentPosition = startPosition - (distance * easeOut)
      
      const speed = Math.abs(distance * (1 - progress) / duration) * 1000
      setSpinSpeed(speed)
      
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateX(${currentPosition}px)`
        updateCentralItem(currentPosition)
      }
      
      if (Math.floor(elapsed / 100) !== Math.floor((elapsed - 16) / 100) && progress < 0.9) {
        playSound('tick')
      }
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setSpinSpeed(0)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  // Générer des particules
  const generateParticles = () => {
    const newParticles = []
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      })
    }
    setParticles(newParticles)
    
    setTimeout(() => setParticles([]), 3000)
  }

  // Fonction pour acheter et ouvrir la boîte
  const purchaseAndOpenBox = async () => {
    if (!user || !box) {
      showMessage('Vous devez être connecté', 'error')
      router.push('/login')
      return
    }

    try {
      // Appeler la fonction RPC pour acheter la boîte
      const { data, error } = await supabase
        .rpc('purchase_loot_box', {
          p_user_id: user.id,
          p_loot_box_id: box.id
        })

      if (error) {
        if (error.message.includes('Insufficient')) {
          showMessage('Coins insuffisants', 'error')
        } else {
          showMessage('Erreur lors de l\'achat', 'error')
        }
        return
      }

      // Mettre à jour les coins localement
      setUserCoins(prev => prev - box.price_virtual)
      
      // Lancer l'animation
      performSpin()

    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Une erreur est survenue', 'error')
    }
  }

  // Lancer l'animation de spin
  const performSpin = async () => {
    const winningItem = selectRandomItemByProbability(items)

    const baseDistance = 3500
    const rarityMultiplier = {
      common: 1,
      rare: 1.2,
      epic: 1.5,
      legendary: 2
    }[winningItem.rarity]
    
    const finalDistance = baseDistance + (Math.random() * 1500 * rarityMultiplier)
    const baseDuration = 4000
    const finalDuration = baseDuration + (rarityMultiplier - 1) * 1000

    animateWheel(finalDuration, finalDistance, winningItem)

    setTimeout(async () => {
      setWonItem(winningItem)
      setIsSpinning(false)
      playSound('win')
      
      if (['epic', 'legendary'].includes(winningItem.rarity)) {
        generateParticles()
      }

      // Enregistrer l'ouverture dans Supabase
      if (openMode === 'single' && user && box) {
        try {
          const { error } = await supabase.rpc('open_loot_box', {
            p_user_id: user.id,
            p_loot_box_id: box.id
          })

          if (error) {
            console.error('Erreur lors de l\'enregistrement:', error)
          } else {
            // Rafraîchir le profil pour les points de fidélité
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('loyalty_points')
              .eq('id', user.id)
              .single()

            if (updatedProfile) {
              showMessage('+10 points de fidélité !', 'success')
            }
          }
        } catch (error) {
          console.error('Erreur:', error)
        }
      }
      
      setTimeout(() => {
        setShowResult(true)
      }, 800)
      
    }, finalDuration + 300)
  }

  // Fonction de spin
  const spinWheel = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setShowResult(false)
    setWonItem(null)
    setCentralItemIndex(-1)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (openMode === 'single') {
      if (!user) {
        showMessage('Connectez-vous pour jouer', 'error')
        setIsSpinning(false)
        return
      }
      
      if (userCoins < box!.price_virtual) {
        showMessage('Coins insuffisants', 'error')
        setIsSpinning(false)
        return
      }
      
      purchaseAndOpenBox()
    } else {
      // Mode démo
      performSpin()
    }
  }

  // Reset
  const resetWheel = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translateX(0px)'
    }
    
    setIsSpinning(false)
    setSpinSpeed(0)
    setCentralItemIndex(-1)
    setParticles([])
    createWheelItems(items)
  }

  // Ajouter aux favoris
  const toggleFavorite = async () => {
    if (!user || !box) {
      showMessage('Connectez-vous pour ajouter aux favoris', 'error')
      return
    }

    // Implémenter la logique des favoris si nécessaire
    showMessage('Ajouté aux favoris !', 'success')
  }

  // Styles selon rareté
  const getRarityStyles = (rarity: string) => {
    const styles = {
      common: {
        bg: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-150',
        border: 'border-gray-400',
        text: 'text-gray-800',
        badge: 'bg-gray-500',
        glow: 'shadow-lg shadow-gray-300/50',
        particle: '#9ca3af'
      },
      rare: {
        bg: 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-150',
        border: 'border-blue-400',
        text: 'text-blue-800',
        badge: 'bg-blue-500',
        glow: 'shadow-lg shadow-blue-400/50',
        particle: '#3b82f6'
      },
      epic: {
        bg: 'bg-gradient-to-br from-purple-50 via-purple-100 to-purple-150',
        border: 'border-purple-400',
        text: 'text-purple-800',
        badge: 'bg-purple-500',
        glow: 'shadow-lg shadow-purple-400/50',
        particle: '#8b5cf6'
      },
      legendary: {
        bg: 'bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-150',
        border: 'border-yellow-400',
        text: 'text-yellow-800',
        badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
        glow: 'shadow-lg shadow-yellow-400/60',
        particle: '#f59e0b'
      }
    }
    return styles[rarity as keyof typeof styles] || styles.common
  }

  // Stats de la boîte depuis la DB
  const boxStats = {
    timesOpened: box?.loot_box_items ? 
      box.loot_box_items.reduce((acc: number, item: any) => acc + (item.times_obtained || 0), 0) : 0
  }

  if (loading || !box) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingState size="lg" text="Préparation de l'expérience..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      
      {/* Messages de notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {error}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {success}
        </div>
      )}
      
      {/* Particules de fond */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-primary-400 rounded-full pointer-events-none z-0"
          initial={{ 
            x: `${particle.x}%`, 
            y: `${particle.y}%`,
            scale: 0,
            opacity: 1
          }}
          animate={{ 
            y: `${particle.y + 100}%`,
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            rotate: 360
          }}
          transition={{ duration: 3, ease: "easeOut" }}
        />
      ))}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/boxes')}
            className="hover:bg-gray-100/80"
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour aux boîtes
          </Button>
        </div>
      </div>

      {/* Container principal unifié */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          
          {/* Section 1: Info box */}
          <div className="p-8 pb-0">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              
              {/* Image */}
              <motion.div 
                className="relative flex-shrink-0"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <img 
                    src={box.image_url}
                    alt={box.name}
                    className="w-80 h-auto object-contain drop-shadow-2xl"
                  />
                  
                  {/* Particules flottantes */}
                  <div className="absolute -inset-4">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-primary-300 rounded-full opacity-60"
                        style={{
                          top: `${20 + i * 20}%`,
                          left: `${10 + (i % 2) * 80}%`
                        }}
                        animate={{
                          y: [-5, 5, -5],
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.5
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 shadow-lg">
                  <Sparkles size={14} className="mr-1" />
                  POPULAIRE
                </Badge>
              </motion.div>

              {/* Infos */}
              <div className="flex-1 space-y-6">
                <div>
                  <motion.h1 
                    className="text-4xl font-bold text-gray-900 mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {box.name}
                  </motion.h1>
                  <motion.p 
                    className="text-lg text-gray-600 leading-relaxed"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {box.description}
                  </motion.p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { 
                      value: userCoins, 
                      label: 'Vos coins', 
                      icon: <Coins size={20} />,
                      format: 'currency'
                    },
                    { 
                      value: box.price_virtual, 
                      label: 'Prix', 
                      icon: <Star size={20} /> 
                    },
                    { 
                      value: boxStats.timesOpened, 
                      label: 'Ouvertures', 
                      icon: <Trophy size={20} />,
                      format: 'number'
                    },
                    { 
                      value: items.length, 
                      label: 'Items', 
                      icon: <Gift size={20} /> 
                    }
                  ].map((stat, index) => (
                    <motion.div 
                      key={index}
                      className="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex items-center justify-center text-primary-500 mb-2">
                        {stat.icon}
                      </div>
                      
                      {stat.format === 'currency' ? (
                        <CurrencyDisplay amount={stat.value} type="coins" size="lg" />
                      ) : (
                        <div className="text-2xl font-bold text-gray-900">
                          {stat.format === 'number' ? stat.value.toLocaleString() : stat.value}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 font-medium mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Contrôles */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Zap size={16} />
                      Mode :
                    </span>
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setOpenMode('single')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                          openMode === 'single'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        REAL SPIN
                      </button>
                      <button
                        onClick={() => setOpenMode('demo')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                          openMode === 'demo'
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        DEMO
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={toggleFavorite}
                    >
                      <Heart size={16} />
                      Favoris
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowItemsModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Eye size={16} />
                      Voir les items
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={resetWheel}
                      className="flex items-center gap-2"
                      disabled={isSpinning}
                    >
                      🔄 Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Séparateur */}
          <div className="px-8 py-6">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Section 2: Roulette */}
          <div className="px-8 pb-8">
            <div className="text-center mb-6">
              <motion.h2 
                className="text-2xl font-bold text-gray-900 mb-2"
                animate={{ 
                  opacity: isSpinning ? 0.7 : 1,
                }}
              >
                Tentez votre chance
              </motion.h2>
              <p className="text-gray-600">
                {isSpinning 
                  ? `Rotation en cours...` 
                  : "Cliquez sur le bouton pour lancer la roulette"
                }
              </p>
            </div>

            {/* Container roulette */}
            <div 
              ref={containerRef}
              className="relative h-72 overflow-hidden bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl border border-gray-200 mb-6"
            >
              
              {/* Gradients de fade */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-15 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-15 pointer-events-none"></div>

              {/* Items de la roulette */}
              <div 
                ref={wheelRef}
                className="flex absolute h-full items-center"
                style={{
                  transform: 'translateX(0px)',
                  willChange: 'transform'
                }}
              >
                {wheelItems.map((item, index) => {
                  const rarityStyles = getRarityStyles(item.rarity)
                  const isCentral = index === centralItemIndex
                  
                  return (
                    <motion.div
                      key={item.id}
                      className={`
                        flex-shrink-0 w-56 h-56 mx-2 rounded-2xl border-2 
                        flex flex-col items-center justify-center p-4 relative
                        transition-all duration-300
                        ${rarityStyles.bg} ${rarityStyles.border}
                        ${isCentral ? `scale-105 z-10 ${rarityStyles.glow}` : 'opacity-90'}
                      `}
                    >
                      
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className={`${rarityStyles.badge} text-white px-2 py-1 text-xs font-bold`}>
                          {item.rarity.toUpperCase()}
                        </Badge>
                      </div>

                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-28 h-28 object-contain mb-2"
                      />

                      <h3 className={`text-sm font-bold text-center ${rarityStyles.text} leading-tight`}>
                        {item.name}
                      </h3>
                      
                      <div className="flex items-center gap-1 mt-2 bg-white/80 rounded-lg px-2 py-1">
                        <Coins size={12} className="text-primary-500" />
                        <span className="font-bold text-xs text-gray-900">{item.market_value}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Bouton de lancement */}
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  onClick={spinWheel}
                  disabled={isSpinning || (openMode === 'single' && userCoins < box.price_virtual)}
                  className={`
                    px-12 py-4 text-lg font-bold
                    ${isSpinning 
                      ? 'bg-gray-400' 
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
                    }
                  `}
                >
                  <motion.div 
                    className="flex items-center gap-2"
                    animate={isSpinning ? { opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 1, repeat: isSpinning ? Infinity : 0 }}
                  >
                    {isSpinning ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        EN COURS...
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        {openMode === 'demo' ? 'ESSAI GRATUIT' : `JOUER (${box.price_virtual} coins)`}
                      </>
                    )}
                  </motion.div>
                </Button>
              </motion.div>
              
              {userCoins < box.price_virtual && openMode === 'single' && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm font-medium mt-3"
                >
                  Coins insuffisants ({box.price_virtual - userCoins} coins manquants)
                </motion.p>
              )}
            </div>
          </div>

          {/* Section 3: Résultat */}
          <AnimatePresence>
            {showResult && wonItem && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="px-8 pb-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                <div className="px-8 pb-8">
                  <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-8 border border-primary-100">
                    
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 200, 
                          delay: 0.2 
                        }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mb-4 shadow-lg"
                      >
                        <Trophy className="w-10 h-10 text-white" />
                      </motion.div>
                      
                      <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold text-gray-900 mb-2"
                      >
                        Félicitations !
                      </motion.h2>
                      
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-gray-600"
                      >
                        Vous avez remporté un objet {wonItem.rarity === 'legendary' ? 'LÉGENDAIRE' : wonItem.rarity.toUpperCase()}
                      </motion.p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 150, 
                          delay: 0.5 
                        }}
                        className="relative"
                      >
                        <div className={`
                          w-64 h-64 rounded-2xl p-6 border-2 shadow-xl relative overflow-hidden
                          ${getRarityStyles(wonItem.rarity).bg}
                          ${getRarityStyles(wonItem.rarity).border}
                        `}>
                          <img 
                            src={wonItem.image_url} 
                            alt={wonItem.name}
                            className="w-full h-full object-contain relative z-10"
                          />
                          
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0"
                            animate={{ opacity: [0, 1, 0], x: ['-100%', '100%'] }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity, 
                              repeatDelay: 2 
                            }}
                          />
                        </div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.7 }}
                          className="absolute -top-3 -right-3"
                        >
                          <Badge 
                            className={`${getRarityStyles(wonItem.rarity).badge} text-white px-4 py-2 text-sm font-bold shadow-lg transform rotate-3`}
                          >
                            {wonItem.rarity === 'legendary' && <Crown size={14} className="mr-1" />}
                            {wonItem.rarity.toUpperCase()}
                          </Badge>
                        </motion.div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex-1 text-center lg:text-left space-y-4"
                      >
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {wonItem.name}
                          </h3>
                          
                          <p className="text-gray-600 leading-relaxed">
                            {wonItem.description}
                          </p>
                        </div>
                        
                        <div className="bg-white rounded-xl p-4 border border-gray-200 inline-block">
                          <div className="flex items-center gap-3">
                            <Coins className="text-primary-500" size={24} />
                            <div>
                              <span className="text-2xl font-bold text-gray-900">
                                {wonItem.market_value}
                              </span>
                              <span className="text-sm text-gray-600 ml-2">coins</span>
                            </div>
                          </div>
                        </div>

                        {wonItem.rarity === 'legendary' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800"
                          >
                            🏆 Incroyable ! Vous aviez seulement {wonItem.probability}% de chance !
                          </motion.div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
                          <Button 
                            onClick={() => {
                              router.push('/inventory')
                            }}
                            className="flex items-center gap-2"
                          >
                            <Gift size={18} />
                            Voir l'inventaire
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowResult(false)
                              resetWheel()
                            }}
                            className="flex items-center gap-2"
                          >
                            <Sparkles size={18} />
                            Rejouer
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal des items */}
      <Modal 
        isOpen={showItemsModal} 
        onClose={() => setShowItemsModal(false)}
        title="Contenu de la boîte"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const rarityStyles = getRarityStyles(item.rarity)
            
            return (
              <motion.div 
                key={item.id} 
                className={`p-5 rounded-xl border ${rarityStyles.bg} ${rarityStyles.border} hover:shadow-lg transition-shadow`}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={`${rarityStyles.badge} text-white text-xs px-2 py-1`}>
                        {item.rarity}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-xs">
                        <Star size={12} className="text-yellow-500" />
                        <span className="font-semibold">{item.probability}%</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Coins size={12} className="text-primary-500" />
                        <span className="font-bold text-sm">{item.market_value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-600">
            Les probabilités affichées déterminent vos chances d'obtenir chaque item
          </p>
        </div>
      </Modal>
    </div>
  )
}