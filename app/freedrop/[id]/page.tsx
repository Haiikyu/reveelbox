// app/freedrop/[id]/page.tsx - POUR 1911x840 STRICT
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

import FreedropWheel from '@/app/components/Wheel/FreedropWheel'
import { WinningResult } from '@/app/components/WinningResult/WinningResult'
import { FreedropButtons } from '@/app/components/FreedropButtons/FreedropButtons'

import { freedropService } from '@/lib/services/freedrop'
import type { FreedropBox, FreedropItem, ClaimStatus } from '@/lib/services/freedrop'

const LoadingState = ({ message }: { message?: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
      <p className="text-white text-lg">{message || 'Chargement...'}</p>
    </div>
  </div>
)

type PageState = 'loading' | 'access_denied' | 'already_claimed' | 'ready' | 'error'

export default function FreedropOpeningPage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const params = useParams()

  const [allBoxes, setAllBoxes] = useState<FreedropBox[]>([])
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0)
  const [box, setBox] = useState<FreedropBox | null>(null)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [isSpinning, setIsSpinning] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [winningItem, setWinningItem] = useState<FreedropItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<FreedropItem | null>(null) // Modal item
  const [fastMode, setFastMode] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)

  const boxId = params?.id as string

  // Format probability intelligemment
  const formatProbability = (prob: number) => {
    if (prob >= 0.01) {
      return prob.toFixed(2) // 0.01% ou plus → 2 décimales
    } else if (prob >= 0.001) {
      return prob.toFixed(3) // 0.001% à 0.009% → 3 décimales
    } else if (prob >= 0.0001) {
      return prob.toFixed(4) // 0.0001% à 0.0009% → 4 décimales
    } else {
      return prob.toFixed(5) // Très petit → 5 décimales
    }
  }

  // Mémoriser les boxes précédente et suivante pour éviter re-renders
  const prevBoxIndex = currentBoxIndex === 0 ? allBoxes.length - 1 : currentBoxIndex - 1
  const nextBoxIndex = currentBoxIndex === allBoxes.length - 1 ? 0 : currentBoxIndex + 1
  
  const prevBox = allBoxes[prevBoxIndex]
  const nextBox = allBoxes[nextBoxIndex]

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const loadAllBoxes = async () => {
      if (!user?.id) return

      try {
        const supabase = createClient()
        const { data: boxesData, error } = await supabase
          .from('loot_boxes')
          .select(`
            id, name, description, image_url, required_level,
            loot_box_items!inner (
              probability, display_order,
              items (id, name, image_url, market_value, rarity, description, category)
            )
          `)
          .eq('is_daily_free', true)
          .eq('is_active', true)
          .order('required_level', { ascending: true })

        if (error || !boxesData) return

        const mappedBoxes: FreedropBox[] = boxesData.map((boxData: any) => ({
          id: boxData.id,
          name: boxData.name,
          description: boxData.description || '',
          image_url: boxData.image_url || '',
          required_level: boxData.required_level || 1,
          can_access: false,
          already_claimed: false,
          can_claim: false,
          items: (boxData.loot_box_items || [])
            .filter((item: any) => item?.items)
            .map((item: any) => ({
              id: item.items.id,
              name: item.items.name,
              image_url: item.items.image_url || '',
              market_value: item.items.market_value || 0,
              rarity: item.items.rarity || 'common',
              probability: item.probability || 0,
              description: item.items.description,
              category: item.items.category
            }))
        }))

        setAllBoxes(mappedBoxes)
        const currentIndex = mappedBoxes.findIndex(b => b.id === boxId)
        if (currentIndex !== -1) {
          setCurrentBoxIndex(currentIndex)
          setBox(mappedBoxes[currentIndex])
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }

    if (user?.id) loadAllBoxes()
  }, [user?.id, boxId])

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id || !box) return

      try {
        setPageState('loading')
        const status = await freedropService.checkClaimStatus(user.id, box.id)
        setClaimStatus(status)

        if (!status) {
          setPageState('error')
        } else if (!status.can_claim && status.already_claimed) {
          setPageState('already_claimed')
        } else if (!status.can_claim && !status.has_level) {
          setPageState('access_denied')
        } else {
          setPageState('ready')
        }
      } catch (err) {
        setPageState('error')
      }
    }

    // SEULEMENT au premier chargement
    if (!authLoading && isAuthenticated && user?.id && box && pageState === 'loading') {
      checkAccess()
    }
  }, [authLoading, isAuthenticated, user?.id, box?.id])

  const handlePreviousBox = async () => {
    if (isSpinning || isTransitioning) return
    setIsTransitioning(true)
    const newIndex = currentBoxIndex === 0 ? allBoxes.length - 1 : currentBoxIndex - 1
    setCurrentBoxIndex(newIndex)
    setBox(allBoxes[newIndex])
    
    // Mettre à jour claimStatus en arrière-plan APRÈS la transition
    setTimeout(async () => {
      setIsTransitioning(false)
      if (user?.id && allBoxes[newIndex]) {
        try {
          const status = await freedropService.checkClaimStatus(user.id, allBoxes[newIndex].id)
          setClaimStatus(status)
        } catch (err) {
          console.error('Erreur claim status:', err)
        }
      }
    }, 400) // Réduit à 400ms
  }

  const handleNextBox = async () => {
    if (isSpinning || isTransitioning) return
    setIsTransitioning(true)
    const newIndex = currentBoxIndex === allBoxes.length - 1 ? 0 : currentBoxIndex + 1
    setCurrentBoxIndex(newIndex)
    setBox(allBoxes[newIndex])
    
    // Mettre à jour claimStatus en arrière-plan APRÈS la transition
    setTimeout(async () => {
      setIsTransitioning(false)
      if (user?.id && allBoxes[newIndex]) {
        try {
          const status = await freedropService.checkClaimStatus(user.id, allBoxes[newIndex].id)
          setClaimStatus(status)
        } catch (err) {
          console.error('Erreur claim status:', err)
        }
      }
    }, 400) // Réduit à 400ms
  }

  const handleSecureClaim = async () => {
    if (!user?.id || !box || isSpinning || !winningItem) return
    try {
      setIsSpinning(true)
      const result = await freedropService.claimFreedrop(user.id, box.id, winningItem.id)
      if (result.success) {
        setTimeout(() => {
          setIsSpinning(false)
          setShowResult(true)
        }, fastMode ? 2000 : 5000)
        await refreshProfile()
      } else {
        setError(result.error || 'Erreur')
        setIsSpinning(false)
      }
    } catch (err) {
      setIsSpinning(false)
    }
  }

  const handleTryFree = async () => {
    if (!box || isSpinning) return
    setIsSpinning(true)
    const randomItem = box.items[Math.floor(Math.random() * box.items.length)]
    setWinningItem(randomItem)
    setTimeout(() => setIsSpinning(false), fastMode ? 2000 : 5000)
  }

  const handleSellItem = async () => {
    setShowResult(false)
    setSuccess('Item vendu!')
  }

  const handleUpgradeItem = async () => {
    setShowResult(false)
    router.push('/inventory')
  }

  const sortedItems = box ? [...box.items].sort((a, b) => b.market_value - a.market_value) : []

  if (authLoading || pageState === 'loading') {
    return <LoadingState message="Chargement..." />
  }

  if (pageState === 'access_denied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-3xl font-bold text-white mb-4">Niveau insuffisant</h2>
          <p className="text-gray-400 mb-6">Niveau {box?.required_level} requis</p>
          <button onClick={() => router.push('/freedrop')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">Retour</button>
        </div>
      </div>
    )
  }

  if (pageState === 'already_claimed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-white mb-4">Déjà réclamée</h2>
          <p className="text-gray-400 mb-6">Revenez demain!</p>
          <button onClick={() => router.push('/freedrop')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">Retour</button>
        </div>
      </div>
    )
  }

  if (pageState === 'error' || !box) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-4">Erreur</h2>
          <button onClick={() => router.push('/freedrop')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold">Retour</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '840px', width: '1911px' }} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden mx-auto mt-16">
      <div className="h-full pt-12 px-3 pb-2">
        <div className="h-full flex gap-3">
          
          {/* GAUCHE 220PX - IN THIS CASE STYLE LOUIS VUITTON */}
          <div style={{ width: '220px', minWidth: '220px', maxWidth: '220px' }} className="bg-gradient-to-br from-[#1a1d2e] to-[#161929] rounded-3xl p-4 flex flex-col">
            <h2 className="text-base font-black text-white mb-3 flex-shrink-0 tracking-wide text-center">IN THIS CASE</h2>
            
            <div className="flex-1 overflow-y-auto overflow-x-visible custom-scrollbar">
              <div className="flex flex-col gap-3 p-1">
                {sortedItems.slice(0, 8).map((item, index) => {
                  const rarityColors = {
                    common: {
                      border: 'border-gray-400',
                      shadow: '0 0 10px rgba(156,163,175,0.3)',
                      hoverShadow: '0 0 15px rgba(156,163,175,0.5)',
                      badgeGradient: 'from-gray-500 to-gray-600'
                    },
                    uncommon: {
                      border: 'border-green-400',
                      shadow: '0 0 10px rgba(34,197,94,0.4)',
                      hoverShadow: '0 0 15px rgba(34,197,94,0.6)',
                      badgeGradient: 'from-green-500 to-green-600'
                    },
                    rare: {
                      border: 'border-blue-400',
                      shadow: '0 0 10px rgba(59,130,246,0.4)',
                      hoverShadow: '0 0 15px rgba(59,130,246,0.6)',
                      badgeGradient: 'from-blue-500 to-blue-600'
                    },
                    epic: {
                      border: 'border-purple-400',
                      shadow: '0 0 10px rgba(168,85,247,0.4)',
                      hoverShadow: '0 0 15px rgba(168,85,247,0.6)',
                      badgeGradient: 'from-purple-500 to-purple-600'
                    },
                    legendary: {
                      border: 'border-yellow-400',
                      shadow: '0 0 12px rgba(251,191,36,0.5)',
                      hoverShadow: '0 0 18px rgba(251,191,36,0.7)',
                      badgeGradient: 'from-yellow-400 to-orange-500'
                    }
                  }
                  const colors = rarityColors[item.rarity as keyof typeof rarityColors] || rarityColors.common

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      onClick={() => setSelectedItem(item)}
                      className={`relative bg-gradient-to-br from-[#0d0f1a] via-[#1a1d2e] to-[#0d0f1a] rounded-2xl p-3 flex items-center gap-3 cursor-pointer border-2 ${colors.border} transition-all duration-300`}
                      style={{ 
                        height: '85px',
                        boxShadow: colors.shadow
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = colors.hoverShadow
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = colors.shadow
                      }}
                    >
                      {/* Image à GAUCHE - PLUS GRANDE */}
                      <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                        <img 
                          src={item.image_url || '/placeholder.png'} 
                          alt={item.name} 
                          className="w-full h-full object-contain drop-shadow-2xl"
                        />
                      </div>
                      
                      {/* Infos au CENTRE/DROITE */}
                      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                        {/* Nom de l'item */}
                        <p className="text-white text-[11px] font-bold leading-tight truncate">
                          {item.name}
                        </p>
                        
                        {/* Badge probabilité avec formatage intelligent */}
                        <div className={`bg-gradient-to-r ${colors.badgeGradient} text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg self-start`}>
                          {formatProbability(item.probability)}%
                        </div>
                        
                        {/* Prix avec icône coins */}
                        <div className="flex items-center gap-1.5">
                          <img 
                            src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                            alt="coins"
                            className="w-4 h-4 object-contain drop-shadow-lg"
                          />
                          <div className="text-blue-400 text-[11px] font-black drop-shadow-lg">
                            {item.market_value}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* CENTRE - SUPERPOSITION CAROUSEL + ROULETTE */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            
            {/* Titre avec EFFET WOW */}
            <div className="text-center mb-3 flex-shrink-0 relative z-30">
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={box.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl font-black text-white tracking-tight relative"
                >
                  <span className="relative z-10 drop-shadow-2xl">{box.name}</span>
                  {/* GLOW TRIPLE COUCHE */}
                  <motion.div 
                    className="absolute inset-0 blur-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 opacity-40"
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3],
                      scale: [0.95, 1.05, 0.95]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* CONTAINER SUPERPOSÉ */}
            <div className="flex-1 relative">
              
              {/* ROULETTE EN ARRIÈRE-PLAN (z-10) */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
                <div className="w-full h-full pt-32">
                  <FreedropWheel
                    items={box.items}
                    winningItem={winningItem}
                    fastMode={fastMode}
                    onFinish={() => {}}
                    isSpinning={isSpinning}
                  />
                </div>
              </div>

              {/* CAROUSEL AU PREMIER PLAN (z-20) */}
              <div className="absolute inset-0 flex flex-col" style={{ zIndex: 20 }}>
                <div className="relative flex-shrink-0" style={{ height: '340px' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    
                    {/* Flèche gauche - COLLÉE */}
                    <motion.button 
                      onClick={handlePreviousBox}
                      disabled={isTransitioning || isSpinning}
                      whileTap={!isTransitioning && !isSpinning ? { scale: 0.9 } : {}}
                      className={`absolute left-28 z-30 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-full p-4 transition-all border-2 border-purple-500/30 backdrop-blur-sm
                        ${isTransitioning || isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600/40 hover:to-purple-700/40 hover:scale-110 hover:border-purple-400/60'}`}
                      style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}
                    >
                      <ChevronLeft className="w-7 h-7 text-white drop-shadow-lg" />
                    </motion.button>

                    {/* CONTAINER 3 BOXES */}
                    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                      
                      {/* BOX GAUCHE */}
                      {prevBox && (
                        <motion.div
                          key={`left-${prevBox.id}`}
                          initial={{ x: -400, scale: 0.7, opacity: 0, filter: 'blur(15px)' }}
                          animate={{ x: -240, scale: 0.8, opacity: 0.5, filter: 'blur(12px)' }}
                          exit={{ x: 400, scale: 1, opacity: 1, filter: 'blur(0px)' }}
                          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute z-0 pointer-events-none"
                          style={{ willChange: 'transform, opacity, filter' }}
                        >
                          <div className="relative">
                            <img 
                              src={prevBox.image_url || '/placeholder.png'}
                              alt="Previous"
                              style={{ width: '260px', height: '260px', filter: 'brightness(0.4)' }}
                              className="object-contain"
                            />
                            <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full" style={{ transform: 'scale(1.5)' }} />
                          </div>
                        </motion.div>
                      )}

                      {/* BOX CENTRE - EFFET WOW */}
                      <motion.div
                        key={`center-${box.id}`}
                        initial={{ x: 240, scale: 0.8, opacity: 0.5, filter: 'blur(12px)' }}
                        animate={{ x: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ x: -240, scale: 0.8, opacity: 0.5, filter: 'blur(12px)' }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute z-20"
                        style={{ willChange: 'transform, opacity, filter' }}
                      >
                        <div className="relative">
                          <img 
                            src={box.image_url || '/placeholder.png'} 
                            alt={box.name}
                            style={{ width: '320px', height: '320px' }}
                            className="object-contain drop-shadow-2xl relative z-10"
                          />
                          {/* GLOW COLORÉ ÉTENDU */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-pink-500/30 blur-[60px] rounded-full"
                            style={{ transform: 'scale(1.8)' }}
                            animate={{ 
                              scale: [1.6, 2, 1.6],
                              opacity: [0.3, 0.5, 0.3]
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* BOX DROITE */}
                      {nextBox && (
                        <motion.div
                          key={`right-${nextBox.id}`}
                          initial={{ x: -400, scale: 1, opacity: 1, filter: 'blur(0px)' }}
                          animate={{ x: 240, scale: 0.8, opacity: 0.5, filter: 'blur(12px)' }}
                          exit={{ x: 400, scale: 0.7, opacity: 0, filter: 'blur(15px)' }}
                          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute z-10 pointer-events-none"
                          style={{ willChange: 'transform, opacity, filter' }}
                        >
                          <div className="relative">
                            <img 
                              src={nextBox.image_url || '/placeholder.png'}
                              alt="Next"
                              style={{ width: '260px', height: '260px', filter: 'brightness(0.4)' }}
                              className="object-contain"
                            />
                            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" style={{ transform: 'scale(1.5)' }} />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Flèche droite - COLLÉE */}
                    <motion.button 
                      onClick={handleNextBox}
                      disabled={isTransitioning || isSpinning}
                      whileTap={!isTransitioning && !isSpinning ? { scale: 0.9 } : {}}
                      className={`absolute right-28 z-30 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-full p-4 transition-all border-2 border-purple-500/30 backdrop-blur-sm
                        ${isTransitioning || isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600/40 hover:to-purple-700/40 hover:scale-110 hover:border-purple-400/60'}`}
                      style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)' }}
                    >
                      <ChevronRight className="w-7 h-7 text-white drop-shadow-lg" />
                    </motion.button>
                  </div>
                </div>

                {/* BOUTONS EN BAS */}
                <div className="flex-1 flex items-end justify-center pb-4">
                  <FreedropButtons
                    canClaim={claimStatus?.can_claim || false}
                    alreadyClaimed={claimStatus?.already_claimed || false}
                    requiredLevel={box.required_level}
                    userLevel={profile?.level || 1}
                    onClaimBox={handleSecureClaim}
                    onTryFree={handleTryFree}
                    onToggleFastMode={() => setFastMode(!fastMode)}
                    fastMode={fastMode}
                    isLoading={isSpinning}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DROITE - VIDE (preview dans carousel) */}
          <div style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
          </div>
        </div>
      </div>

      {/* MODAL ITEM DETAIL */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-br from-[#0d0f1a] via-[#1a1d2e] to-[#0d0f1a] rounded-3xl p-8 max-w-md w-full border-2"
              style={{
                borderColor: (() => {
                  const colors = {
                    common: '#9ca3af',
                    uncommon: '#4ade80',
                    rare: '#3b82f6',
                    epic: '#a855f7',
                    legendary: '#fbbf24'
                  }
                  return colors[selectedItem.rarity as keyof typeof colors] || colors.common
                })(),
                boxShadow: (() => {
                  const shadows = {
                    common: '0 0 30px rgba(156,163,175,0.5)',
                    uncommon: '0 0 30px rgba(34,197,94,0.6)',
                    rare: '0 0 30px rgba(59,130,246,0.6)',
                    epic: '0 0 40px rgba(168,85,247,0.7)',
                    legendary: '0 0 50px rgba(251,191,36,0.8)'
                  }
                  return shadows[selectedItem.rarity as keyof typeof shadows] || shadows.common
                })()
              }}
            >
              {/* Bouton fermer */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image GRANDE avec glow animé */}
              <div className="relative mb-6">
                <motion.div
                  className="w-48 h-48 mx-auto flex items-center justify-center relative"
                  animate={{ 
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img 
                    src={selectedItem.image_url || '/placeholder.png'} 
                    alt={selectedItem.name} 
                    className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                  />
                  {/* Glow coloré derrière */}
                  <motion.div 
                    className="absolute inset-0 blur-3xl rounded-full"
                    style={{
                      background: (() => {
                        const gradients = {
                          common: 'radial-gradient(circle, rgba(156,163,175,0.4) 0%, transparent 70%)',
                          uncommon: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)',
                          rare: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)',
                          epic: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)',
                          legendary: 'radial-gradient(circle, rgba(251,191,36,0.7) 0%, transparent 70%)'
                        }
                        return gradients[selectedItem.rarity as keyof typeof gradients] || gradients.common
                      })()
                    }}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>

              {/* Nom */}
              <h2 className="text-2xl font-black text-white text-center mb-4 leading-tight">
                {selectedItem.name}
              </h2>

              {/* Rareté */}
              <div className="flex justify-center mb-4">
                <div 
                  className="px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider text-white shadow-lg"
                  style={{
                    background: (() => {
                      const gradients = {
                        common: 'linear-gradient(135deg, #6b7280, #9ca3af)',
                        uncommon: 'linear-gradient(135deg, #10b981, #22c55e)',
                        rare: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                        epic: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                        legendary: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                      }
                      return gradients[selectedItem.rarity as keyof typeof gradients] || gradients.common
                    })()
                  }}
                >
                  {selectedItem.rarity}
                </div>
              </div>

              {/* Infos en grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {/* Probabilité */}
                <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-white/10">
                  <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Probability</p>
                  <p className="text-white text-xl font-black">{formatProbability(selectedItem.probability)}%</p>
                </div>

                {/* Valeur */}
                <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-white/10">
                  <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Value</p>
                  <div className="flex items-center justify-center gap-2">
                    <img 
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                      alt="coins"
                      className="w-5 h-5 object-contain"
                    />
                    <p className="text-blue-400 text-xl font-black">{selectedItem.market_value}</p>
                  </div>
                </div>
              </div>

              {/* Message motivant */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center"
              >
                <p className="text-purple-400 text-sm font-bold">
                  🎯 Open the box to win this item!
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {winningItem && (
        <WinningResult
          item={winningItem}
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          onSell={handleSellItem}
          onUpgrade={handleUpgradeItem}
        />
      )}

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-xl z-50 text-sm">
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 right-6 bg-red-500 text-white px-4 py-2 rounded-xl z-50 text-sm">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { 
          width: 6px; 
        }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: rgba(0, 0, 0, 0.4); 
          border-radius: 10px; 
          box-shadow: inset 0 0 5px rgba(168, 85, 247, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: linear-gradient(180deg, rgba(168, 85, 247, 0.8), rgba(139, 92, 246, 0.8)); 
          border-radius: 10px;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(180deg, rgba(168, 85, 247, 1), rgba(139, 92, 246, 1)); 
          box-shadow: 0 0 20px rgba(168, 85, 247, 1);
        }
      `}</style>
    </div>
  )
}