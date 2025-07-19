'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Coins, Heart, Eye, Gift, Play, Trophy, Zap, Sparkles, Crown } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { CurrencyDisplay } from '../../components/ui/CurrencyDisplay'
import { Modal } from '../../components/ui/Modal'

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
  total_items: number
  most_valuable_item: string
  times_opened: number
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
  const [userCoins, setUserCoins] = useState(1250)
  
  // États roulette améliorés
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

  // Sons (simulation)
  const playSound = useCallback((type: 'spin' | 'win' | 'tick') => {
    // Simulation de sons - remplace par de vrais sons plus tard
    console.log(`🔊 Son: ${type}`)
  }, [])

  // Données de test
  useEffect(() => {
    setTimeout(() => {
      setBox({
        id: params.id,
        name: 'BLINDSHOT',
        description: 'Une sélection exclusive des sneakers les plus recherchées du marché. Chaque ouverture garantit une surprise !',
        price_virtual: 150,
        price_real: 6.84,
        image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
        is_active: true,
        total_items: 6,
        most_valuable_item: 'Air Jordan 1 Chicago',
        times_opened: 1247
      })

      const boxItems = [
        {
          id: '1',
          name: 'Air Jordan 1 Chicago',
          rarity: 'legendary' as const,
          probability: 5,
          image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
          market_value: 500,
          description: 'Le graal absolu des sneakers'
        },
        {
          id: '2',
          name: 'Nike Dunk Low Panda',
          rarity: 'rare' as const,
          probability: 15,
          image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
          market_value: 250,
          description: 'Coloris iconique noir et blanc'
        },
        {
          id: '3',
          name: 'Yeezy Boost 350 V2',
          rarity: 'epic' as const,
          probability: 20,
          image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
          market_value: 300,
          description: 'Design futuriste de Kanye'
        },
        {
          id: '4',
          name: 'New Balance 550',
          rarity: 'common' as const,
          probability: 35,
          image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
          market_value: 120,
          description: 'Style vintage premium'
        },
        {
          id: '5',
          name: 'Nike SB Dunk High',
          rarity: 'epic' as const,
          probability: 15,
          image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
          market_value: 280,
          description: 'Culture skateboard authentique'
        },
        {
          id: '6',
          name: 'Air Force 1 Triple White',
          rarity: 'common' as const,
          probability: 10,
          image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
          market_value: 90,
          description: 'Le classique intemporel'
        }
      ]

      setItems(boxItems)
      createWheelItems(boxItems)
      setLoading(false)
    }, 1000)
  }, [params.id])

  // Créer les items avec distribution intelligente
  const createWheelItems = (baseItems: LootBoxItem[]) => {
    const wheelArray: LootBoxItem[] = []
    
    // Créer 60 items avec distribution réaliste
    for (let i = 0; i < 60; i++) {
      const randomItem = selectRandomItemByProbability(baseItems)
      wheelArray.push({
        ...randomItem,
        id: `wheel-${i}-${randomItem.id}-${Date.now()}`
      })
    }
    
    setWheelItems(wheelArray)
    setCentralItemIndex(-1)
    
    // Reset position
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

  // Calculer l'item au centre pendant l'animation
  const updateCentralItem = useCallback((currentPosition: number) => {
    if (!containerRef.current || wheelItems.length === 0) return

    const containerWidth = containerRef.current.offsetWidth
    const containerCenter = containerWidth / 2
    const itemWidth = 240 // 224px + margin
    
    // Calculer quel item est au centre
    const visibleOffset = Math.abs(currentPosition)
    const centerItemIndex = Math.round(visibleOffset / itemWidth)
    
    if (centerItemIndex >= 0 && centerItemIndex < wheelItems.length) {
      setCentralItemIndex(centerItemIndex)
    }
  }, [wheelItems])

  // Animation améliorée avec easing et son
  const animateWheel = (duration: number, distance: number, finalItem: LootBoxItem) => {
    if (!wheelRef.current) return

    const start = performance.now()
    const startPosition = 0
    playSound('spin')

    const animate = (currentTime: number) => {
      const elapsed = currentTime - start
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing sophistiqué (ease-out avec bounce)
      const easeOut = progress < 0.8 
        ? 1 - Math.pow(1 - progress / 0.8, 3)
        : 1 - 0.1 * Math.sin((progress - 0.8) * 50)
      
      const currentPosition = startPosition - (distance * easeOut)
      
      // Vitesse pour les effets
      const speed = Math.abs(distance * (1 - progress) / duration) * 1000
      setSpinSpeed(speed)
      
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateX(${currentPosition}px)`
        updateCentralItem(currentPosition)
      }
      
      // Son de tick périodique
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

  // Générer des particules de célébration
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
    
    // Nettoyer après 3 secondes
    setTimeout(() => setParticles([]), 3000)
  }

  // Fonction de spin spectaculaire
  const spinWheel = () => {
    if (isSpinning || (openMode === 'single' && userCoins < box!.price_virtual)) return

    setIsSpinning(true)
    setShowResult(false)
    setWonItem(null)
    setCentralItemIndex(-1)

    // Annuler animation précédente
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Déterminer l'item gagnant
    const winningItem = selectRandomItemByProbability(items)

    // Distance variable selon la rareté (plus rare = plus de suspense)
    const baseDistance = 3500
    const rarityMultiplier = {
      common: 1,
      rare: 1.2,
      epic: 1.5,
      legendary: 2
    }[winningItem.rarity]
    
    const finalDistance = baseDistance + (Math.random() * 1500 * rarityMultiplier)
    
    // Duration variable selon rareté
    const baseDuration = 4000
    const finalDuration = baseDuration + (rarityMultiplier - 1) * 1000

    // Lancer l'animation
    animateWheel(finalDuration, finalDistance, winningItem)

    // Fin de l'animation
    setTimeout(() => {
      setWonItem(winningItem)
      setIsSpinning(false)
      playSound('win')
      
      // Particules si rare+
      if (['epic', 'legendary'].includes(winningItem.rarity)) {
        generateParticles()
      }
      
      setTimeout(() => {
        setShowResult(true)
      }, 800)
      
      if (openMode === 'single') {
        setUserCoins(prev => prev - box!.price_virtual)
      }
    }, finalDuration + 300)
  }

  // Reset amélioré
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

  // Styles améliorés selon rareté
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

  if (loading || !box) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingState size="lg" text="Préparation de l'expérience..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      
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

      {/* Header amélioré */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="hover:bg-gray-100/80"
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour aux boîtes
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Hero Section améliorée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden mb-8"
        >
          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              
              {/* Image avec effets */}
              <motion.div 
                className="relative flex-shrink-0"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <img 
                    src={box.image_url}
                    alt={box.name}
                    className="w-80 h-auto object-contain drop-shadow-2xl"
                  />
                  
                  {/* Effet de lueur */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-transparent to-primary-500/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Particules autour de la boîte */}
                  <div className="absolute -inset-4">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-primary-400 rounded-full"
                        style={{
                          top: `${20 + i * 15}%`,
                          left: `${10 + (i % 2) * 80}%`
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 shadow-lg">
                  🔥 HOT
                </Badge>
              </motion.div>

              {/* Infos enrichies */}
              <div className="flex-1 space-y-6">
                <div>
                  <motion.h1 
                    className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3"
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

                {/* Stats animées */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { 
                      value: userCoins, 
                      label: 'Vos coins', 
                      color: 'primary', 
                      icon: <Coins size={20} />,
                      format: 'currency'
                    },
                    { 
                      value: box.price_virtual, 
                      label: 'Prix', 
                      color: 'blue', 
                      icon: <Star size={20} /> 
                    },
                    { 
                      value: box.times_opened, 
                      label: 'Ouvertures', 
                      color: 'purple', 
                      icon: <Play size={20} />,
                      format: 'number'
                    },
                    { 
                      value: box.total_items, 
                      label: 'Items', 
                      color: 'orange', 
                      icon: <Gift size={20} /> 
                    }
                  ].map((stat, index) => (
                    <motion.div 
                      key={index}
                      className={`text-center p-4 bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 rounded-xl border border-${stat.color}-200 hover:scale-105 transition-transform cursor-pointer`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ y: -2 }}
                    >
                      <div className={`flex items-center justify-center text-${stat.color}-600 mb-2`}>
                        {stat.icon}
                      </div>
                      
                      {stat.format === 'currency' ? (
                        <CurrencyDisplay amount={stat.value} type="coins" size="lg" />
                      ) : (
                        <div className={`text-2xl font-bold text-${stat.color}-700`}>
                          {stat.format === 'number' ? stat.value.toLocaleString() : stat.value}
                        </div>
                      )}
                      <p className={`text-sm text-${stat.color}-600 font-medium mt-1`}>{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Contrôles améliorés */}
                <div className="space-y-4">
                  {/* Mode sélecteur premium */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Zap size={16} />
                      Mode de jeu :
                    </span>
                    <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                      <button
                        onClick={() => setOpenMode('single')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                          openMode === 'single'
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Crown size={14} />
                        REAL SPIN
                      </button>
                      <button
                        onClick={() => setOpenMode('demo')}
                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                          openMode === 'demo'
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Play size={14} />
                        DEMO
                      </button>
                    </div>
                  </div>

                  {/* Boutons d'action stylés */}
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors">
                      <Heart size={16} />
                      Ajouter aux favoris
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowItemsModal(true)}
                      className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      <Eye size={16} />
                      Voir tous les items
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={resetWheel}
                      className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                      disabled={isSpinning}
                    >
                      🔄 Reset roulette
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Roulette Spectaculaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden mb-8"
        >
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.h2 
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3"
                animate={{ 
                  scale: isSpinning ? [1, 1.05, 1] : 1,
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: isSpinning ? Infinity : 0 
                }}
              >
                <Sparkles className={isSpinning ? "text-primary-500 animate-spin" : "text-primary-500"} />
                Roulette des Trésors
                <Sparkles className={isSpinning ? "text-primary-500 animate-spin" : "text-primary-500"} />
              </motion.h2>
              <p className="text-gray-600 text-lg">
                {isSpinning 
                  ? `⚡ Vitesse: ${Math.round(spinSpeed)} km/h` 
                  : "Prêt pour l'aventure ? Lancez la roulette !"
                }
              </p>
            </div>

            {/* Container roulette avec effets */}
            <div 
              ref={containerRef}
              className="relative h-80 overflow-hidden bg-gradient-to-r from-gray-100 via-white to-gray-100 rounded-2xl border-2 border-gray-300 mb-8 shadow-inner"
            >
              
              {/* Indicateurs de zone de victoire */}
              <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-70 z-20"></div>
              <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-70 z-20"></div>
              
              {/* Ligne centrale */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full z-20 shadow-lg"></div>
              
              {/* Gradients de fade améliorés */}
              <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-white via-white/90 to-transparent z-15 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-white via-white/90 to-transparent z-15 pointer-events-none"></div>

              {/* Items magiques */}
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
                        flex-shrink-0 w-60 h-64 mx-3 rounded-2xl border-3 
                        flex flex-col items-center justify-center p-4 relative
                        transition-all duration-300 cursor-pointer
                        ${rarityStyles.bg} ${rarityStyles.border}
                        ${isCentral ? `scale-110 z-10 ${rarityStyles.glow}` : 'hover:scale-105'}
                        ${isSpinning && index % 5 === 0 ? 'animate-pulse' : ''}
                      `}
                      animate={isCentral ? {
                        scale: [1.1, 1.15, 1.1],
                        rotateY: [0, 5, -5, 0]
                      } : {}}
                      transition={{ duration: 0.5, repeat: isCentral ? Infinity : 0 }}
                    >
                      
                      {/* Effet de brillance pour item central */}
                      {isCentral && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-2xl"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      )}

                      {/* Badge premium */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className={`${rarityStyles.badge} text-white px-3 py-1 text-xs font-bold shadow-lg border border-white/30`}>
                          {item.rarity === 'legendary' && <Crown size={10} className="mr-1" />}
                          {item.rarity.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Image avec effets */}
                      <motion.img
                        src={item.image_url}
                        alt={item.name}
                        className="w-32 h-32 object-contain mb-3 drop-shadow-lg"
                        animate={isCentral ? {
                          rotateY: [0, 15, -15, 0],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 2, repeat: isCentral ? Infinity : 0 }}
                      />

                      {/* Nom stylé */}
                      <h3 className={`text-sm font-bold text-center ${rarityStyles.text} mb-2 leading-tight`}>
                        {item.name}
                      </h3>
                      
                      {/* Valeur premium */}
                      <motion.div 
                        className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1 shadow-md border border-white/50"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Coins size={14} className="text-primary-500" />
                        <span className="font-bold text-sm text-gray-900">{item.market_value}</span>
                      </motion.div>

                      {/* Particules pour items rares */}
                      {(item.rarity === 'legendary' || item.rarity === 'epic') && isCentral && (
                        <div className="absolute inset-0 pointer-events-none">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                              style={{
                                top: `${30 + i * 20}%`,
                                left: `${20 + i * 30}%`
                              }}
                              animate={{
                                scale: [0, 1, 0],
                                opacity: [0, 1, 0],
                                y: [-10, -30, -50]
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.3
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Bouton de lancement épique */}
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={spinWheel}
                  disabled={isSpinning || (openMode === 'single' && userCoins < box.price_virtual)}
                  className={`
                    px-16 py-6 text-xl font-bold relative overflow-hidden
                    ${isSpinning 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 animate-pulse shadow-2xl shadow-orange-500/50' 
                      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 shadow-xl shadow-primary-500/40'
                    }
                    border-2 border-white/20 backdrop-blur-sm
                  `}
                >
                  {isSpinning && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                  
                  <motion.div 
                    className="flex items-center gap-3"
                    animate={isSpinning ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3, repeat: isSpinning ? Infinity : 0 }}
                  >
                    {isSpinning ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap size={28} />
                        </motion.div>
                        SPINNING...
                      </>
                    ) : (
                      <>
                        <Sparkles size={28} />
                        {openMode === 'demo' ? 'ESSAI GRATUIT' : 'LANCER LA ROULETTE'}
                        <Sparkles size={28} />
                      </>
                    )}
                  </motion.div>
                </Button>
              </motion.div>
              
              {/* Infos sous le bouton */}
              <div className="mt-6 space-y-2">
                <div className="text-sm text-gray-600 flex items-center justify-center gap-4">
                  <span>Items: {wheelItems.length}</span>
                  <span>•</span>
                  <span>Status: {isSpinning ? '🎰 En cours' : '✅ Prêt'}</span>
                  {spinSpeed > 0 && (
                    <>
                      <span>•</span>
                      <span>Vitesse: {Math.round(spinSpeed)} km/h</span>
                    </>
                  )}
                </div>
                
                {userCoins < box.price_virtual && openMode === 'single' && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm font-medium bg-red-50 rounded-lg px-4 py-2 border border-red-200"
                  >
                    ⚠️ Coins insuffisants ({box.price_virtual - userCoins} coins manquants)
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Résultat Spectaculaire */}
        <AnimatePresence>
          {showResult && wonItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                duration: 0.6
              }}
            >
              <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-3xl shadow-2xl border-2 border-primary-200 overflow-hidden relative">
                
                {/* Confettis de fond */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getRarityStyles(wonItem.rarity).particle,
                        left: `${10 + i * 8}%`,
                        top: `${20 + (i % 3) * 30}%`
                      }}
                      animate={{
                        y: [0, -100, -200],
                        rotate: [0, 180, 360],
                        scale: [1, 0.5, 0],
                        opacity: [1, 0.8, 0]
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                    />
                  ))}
                </div>

                <div className="p-8 relative z-10">
                  
                  {/* Header célébration */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 200, 
                        delay: 0.2 
                      }}
                      className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full mb-6 shadow-2xl border-4 border-white"
                    >
                      <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
                    </motion.div>
                    
                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-4xl font-bold text-gray-900 mb-3"
                    >
                      🎉 INCROYABLE ! 🎉
                    </motion.h2>
                    
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xl text-gray-600"
                    >
                      Vous avez remporté un {wonItem.rarity === 'legendary' ? 'LÉGENDAIRE' : wonItem.rarity.toUpperCase()} !
                    </motion.p>
                  </div>

                  {/* Item gagné premium */}
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    
                    {/* Image spectaculaire */}
                    <motion.div
                      initial={{ rotate: -15, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 150, 
                        delay: 0.6 
                      }}
                      className="relative"
                    >
                      <div className={`
                        w-72 h-72 rounded-3xl p-8 border-4 shadow-2xl relative overflow-hidden
                        ${getRarityStyles(wonItem.rarity).bg}
                        ${getRarityStyles(wonItem.rarity).border}
                        ${getRarityStyles(wonItem.rarity).glow}
                      `}>
                        <img 
                          src={wonItem.image_url} 
                          alt={wonItem.name}
                          className="w-full h-full object-contain relative z-10"
                        />
                        
                        {/* Effet de brillance animée */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatDelay: 1 
                          }}
                        />

                        {/* Particules spéciales pour légendaire */}
                        {wonItem.rarity === 'legendary' && (
                          <div className="absolute inset-0">
                            {[...Array(8)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                style={{
                                  top: `${20 + (i % 4) * 20}%`,
                                  left: `${15 + (i % 2) * 70}%`
                                }}
                                animate={{
                                  scale: [0, 1, 0],
                                  opacity: [0, 1, 0],
                                  rotate: [0, 180, 360]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: i * 0.2
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Informations détaillées */}
                    <motion.div 
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex-1 text-center lg:text-left space-y-6"
                    >
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">
                          {wonItem.name}
                        </h3>
                        
                        <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                          <Badge 
                            className={`${getRarityStyles(wonItem.rarity).badge} text-white px-4 py-2 text-sm font-bold shadow-lg`}
                          >
                            {wonItem.rarity === 'legendary' && <Crown size={14} className="mr-1" />}
                            ⭐ {wonItem.rarity.toUpperCase()}
                          </Badge>
                          
                          {wonItem.rarity === 'legendary' && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs">
                              ULTRA RARE
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-lg text-gray-600 leading-relaxed mb-6">
                          {wonItem.description}
                        </p>
                      </div>
                      
                      {/* Valeur avec effet */}
                      <motion.div 
                        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <Coins className="text-primary-500" size={32} />
                            <span className="text-4xl font-bold text-primary-600">
                              {wonItem.market_value}
                            </span>
                          </div>
                          <p className="text-gray-600 font-medium">Valeur de votre trésor</p>
                          
                          {/* Bonus pour rareté élevée */}
                          {wonItem.rarity === 'legendary' && (
                            <div className="mt-3 text-yellow-600 font-bold text-sm">
                              🏆 JACKPOT ! Vous avez eu seulement 5% de chance !
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Boutons d'action premium */}
                      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Button 
                          size="lg"
                          onClick={() => setShowResult(false)}
                          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg"
                        >
                          <Gift size={20} />
                          Voir dans l'inventaire
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => {
                            setShowResult(false)
                            resetWheel()
                          }}
                          className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50 flex items-center gap-2"
                        >
                          <Sparkles size={20} />
                          Retenter ma chance
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal améliorée */}
      <Modal 
        isOpen={showItemsModal} 
        onClose={() => setShowItemsModal(false)}
        title="🎁 Trésors de cette boîte mystère"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => {
            const rarityStyles = getRarityStyles(item.rarity)
            
            return (
              <motion.div 
                key={item.id} 
                className={`p-6 rounded-2xl border-2 ${rarityStyles.bg} ${rarityStyles.border} ${rarityStyles.glow} relative overflow-hidden`}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Effet de brillance au hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />

                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-20 h-20 object-contain drop-shadow-lg"
                    />
                    <Badge className={`absolute -top-2 -right-2 ${rarityStyles.badge} text-white px-2 py-1 text-xs border border-white/50`}>
                      {item.rarity === 'legendary' && <Crown size={8} className="mr-1" />}
                      {item.rarity}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-yellow-500" />
                        <span className="text-sm font-bold text-gray-700">{item.probability}%</span>
                        <span className="text-xs text-gray-500">chance</span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-white/80 rounded-lg px-2 py-1">
                        <Coins size={14} className="text-primary-500" />
                        <span className="font-bold text-primary-600">{item.market_value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Section info améliorée */}
        <motion.div 
          className="mt-8 p-6 bg-gradient-to-r from-primary-50 via-blue-50 to-purple-50 rounded-2xl border border-primary-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
              <Sparkles size={20} className="text-primary-500" />
              Comment ça marche ?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Chaque ouverture vous garantit un item selon les probabilités affichées. 
              Plus la rareté est élevée, plus l'item est précieux et rare à obtenir !
            </p>
            <div className="mt-4 text-xs text-gray-500">
              🍀 Bonne chance et que la fortune vous sourie !
            </div>
          </div>
        </motion.div>
      </Modal>
    </div>
  )
}