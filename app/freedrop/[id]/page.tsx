// app/freedrop/[id]/page.tsx - Version corrigée avec imports corrects
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter, useParams } from 'next/navigation'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Award, Clock, Timer, AlertCircle } from 'lucide-react'
import ParticlesBackground from '@/app/components/affiliate/ParticlesBackground'

// Import des composants
import { BoxPresentation } from '@/app/components/BoxPresentation/BoxPresentation'
import { Wheel } from '@/app/components/Wheel/Wheel'
import { WinningResult } from '@/app/components/WinningResult/WinningResult'
import { FreedropButtons } from '@/app/components/FreedropButtons/FreedropButtons'
import { LootList } from '@/app/components/LootList/LootList'

// Import du service freedrop
import { freedropService } from '@/lib/services/freedrop'
import type { FreedropBox, FreedropItem, ClaimStatus } from '@/lib/services/freedrop'

type PageState = 'loading' | 'access_denied' | 'already_claimed' | 'ready' | 'error'

export default function FreedropOpeningPage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const params = useParams()

  // États principaux
  const [box, setBox] = useState<FreedropBox | null>(null)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningItem, setWinningItem] = useState<FreedropItem | null>(null)
  const [fastMode, setFastMode] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)
  const [timeToReset, setTimeToReset] = useState('')

  const boxId = params?.id as string

  // Messages optimisés
  const showMessage = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(''), 5000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(''), 3000)
    }
  }, [])

  // Timer jusqu'à minuit
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeToReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])

  // Protection de route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Initialisation du profil utilisateur si nécessaire
  useEffect(() => {
    const initializeProfile = async () => {
      if (!user?.id || !user?.email) return

      try {
        await freedropService.initializeUserProfile(user.id, user.email)
        await refreshProfile?.()
      } catch (error) {
        console.error('Erreur critique initialisation:', error)
      }
    }

    if (isAuthenticated && user) {
      initializeProfile()
    }
  }, [isAuthenticated, user, refreshProfile])

  // Chargement unifié avec le service freedrop
  useEffect(() => {
    if (!isAuthenticated || !boxId || !user?.id) return

    let isCancelled = false

    const loadAndCheckAccess = async () => {
      try {
        setPageState('loading')
        setError('')

        console.log('🔍 Chargement freedrop:', { boxId, userId: user.id })

        // 1. Charger la box avec le service
        const boxWithStatus = await freedropService.getFreedropBoxWithStatus(user.id, boxId)

        if (isCancelled) return

        if (!boxWithStatus) {
          console.error('❌ Box non trouvée')
          setPageState('error')
          showMessage('Cette freedrop n\'existe pas ou n\'est plus disponible', 'error')
          setTimeout(() => router.push('/freedrop'), 2000)
          return
        }

        console.log('✅ Box chargée:', boxWithStatus)

        // 2. Vérifier le statut de claim
        const status = await freedropService.checkClaimStatus(user.id, boxId)

        if (isCancelled) return

        if (!status || !status.success) {
          console.error('❌ Erreur vérification statut:', status)
          setPageState('error')
          showMessage('Erreur lors de la vérification du statut', 'error')
          return
        }

        console.log('✅ Statut claim:', status)

        const claimStatusData: ClaimStatus = {
          success: status.success,
          can_claim: status.can_claim,
          has_level: status.has_level,
          already_claimed: status.already_claimed,
          user_level: status.user_level,
          required_level: status.required_level,
          today: status.today
        }

        setClaimStatus(claimStatusData)

        // 3. Déterminer l'état de la page selon le statut
        if (!claimStatusData.has_level) {
          setPageState('access_denied')
          return
        }

        if (claimStatusData.already_claimed) {
          setPageState('already_claimed')
        } else {
          setPageState('ready')
        }

        // 4. Configurer la box
        setBox(boxWithStatus)

        console.log('✅ Freedrop configurée:', {
          boxName: boxWithStatus.name,
          itemsCount: boxWithStatus.items.length,
          canClaim: claimStatusData.can_claim,
          pageState: claimStatusData.already_claimed ? 'already_claimed' : 'ready'
        })

        showMessage('Freedrop chargée avec succès', 'success')

      } catch (error: any) {
        if (isCancelled) return
        
        console.error('❌ Erreur critique:', error)
        setPageState('error')
        showMessage('Erreur inattendue lors du chargement', 'error')
        setTimeout(() => router.push('/freedrop'), 2000)
      }
    }

    loadAndCheckAccess()

    return () => {
      isCancelled = true
    }
  }, [isAuthenticated, boxId, user?.id, router, showMessage])

  // Claim avec le service freedrop
  const handleClaimBox = useCallback(async () => {
    if (!box || !user?.id || isSpinning || !claimStatus?.can_claim) {
      console.log('❌ Conditions non remplies pour claim:', {
        hasBox: !!box,
        hasUser: !!user?.id,
        isSpinning,
        canClaim: claimStatus?.can_claim
      })
      return
    }

    const selectedItem = freedropService.selectRandomItem(box.items)
    console.log('🎰 Item sélectionné:', selectedItem)
    
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)
    setError('')

    try {
      console.log('📡 Envoi claim via le service...')
      const result = await freedropService.claimFreedrop(user.id, box.id, selectedItem.id)

      console.log('📨 Réponse claim:', result)

      if (!result.success) {
        const errorMsg = result.error || 'Erreur inconnue'
        console.error('❌ Erreur claim:', result)
        
        // Gestion spécifique des erreurs métier
        if (result.error_code === 'ALREADY_CLAIMED') {
          showMessage('Vous avez déjà réclamé cette freedrop aujourd\'hui', 'error')
          setPageState('already_claimed')
          setClaimStatus(prev => prev ? { ...prev, already_claimed: true, can_claim: false } : null)
        } else if (result.error_code === 'INSUFFICIENT_LEVEL') {
          showMessage('Niveau insuffisant pour cette freedrop', 'error')
          setPageState('access_denied')
        } else if (result.error_code === 'INVALID_ITEM') {
          showMessage('Item invalide pour cette box', 'error')
        } else {
          showMessage(`Erreur: ${errorMsg}`, 'error')
        }
        
        setIsSpinning(false)
        setWinningItem(null)
        return
      }

      // SUCCESS ! Traitement de la réclamation réussie
      console.log('✅ Claim réussi:', result)
      
      showMessage(`Vous avez gagné ${selectedItem.name} gratuitement! (+${result.xp_gained || 5} XP)`, 'success')
      
      // Marquer comme réclamé
      setPageState('already_claimed')
      setClaimStatus(prev => prev ? { ...prev, already_claimed: true, can_claim: false } : null)
      
      // Refresh différé du profil pour mise à jour XP/niveau
      setTimeout(async () => {
        try {
          await refreshProfile?.()
          console.log('🔄 Profil rafraîchi')
        } catch (error) {
          console.error('Erreur refresh profil:', error)
        }
      }, 3000)

    } catch (error) {
      console.error('❌ Erreur critique claim:', error)
      showMessage('Erreur inattendue lors de la réclamation', 'error')
      setIsSpinning(false)
      setWinningItem(null)
    }
  }, [box, user?.id, isSpinning, claimStatus, showMessage, refreshProfile])

  // Essai gratuit
  const handleTryFree = useCallback(() => {
    if (!box || isSpinning) return

    console.log('🎲 Essai gratuit')
    const selectedItem = freedropService.selectRandomItem(box.items)
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)
  }, [box, isSpinning])

  const handleToggleFastMode = useCallback(() => {
    setFastMode(prev => !prev)
    console.log('⚡ Fast mode:', !fastMode)
  }, [fastMode])

  const handleAnimationFinish = useCallback(() => {
    console.log('🎯 Animation terminée')
    setIsSpinning(false)
    setShowResult(true)
  }, [])

  const handleSellItem = useCallback((item: FreedropItem) => {
    showMessage(`${item.name} vendu pour ${item.market_value} coins`, 'success')
  }, [showMessage])

  // États de chargement et d'erreur
  if (authLoading || pageState === 'loading') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingState text="Chargement de la freedrop..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Page d'accès refusé (niveau insuffisant)
  if (pageState === 'access_denied') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Award className="w-20 h-20 mx-auto mb-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Niveau insuffisant
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
            Vous devez être niveau <strong>{claimStatus?.required_level || 'X'}</strong> pour accéder à cette freedrop.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Votre niveau actuel: <strong>{claimStatus?.user_level || 1}</strong>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/freedrop')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
            >
              Retour aux freedrops
            </button>
            <button 
              onClick={() => router.push('/boxes')}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Ouvrir des boxes pour gagner de l'XP
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Page d'erreur
  if (pageState === 'error' || !box) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400 max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Freedrop introuvable</h2>
          <p className="mb-6">Cette box quotidienne n'existe pas ou n'est plus disponible.</p>
          <button 
            onClick={() => router.push('/freedrop')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            Retour aux freedrops
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20 transition-colors duration-300 relative overflow-hidden">
      {/* Particles Background */}
      <ParticlesBackground />

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Timer et statut en haut */}
        {pageState === 'already_claimed' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-6 py-3 rounded-xl border border-blue-200 dark:border-blue-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Déjà réclamée aujourd'hui</span>
              <span className="text-sm">•</span>
              <Timer className="w-4 h-4" />
              <span className="font-mono text-sm">{timeToReset}</span>
            </div>
          </motion.div>
        )}

        {/* Présentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <BoxPresentation
            boxName={box.name}
            boxImage={box.image_url}
            boxDescription={box.description}
            requiredLevel={box.required_level}
            userLevel={claimStatus?.user_level || 1}
            isFreedrp={true}
          />
        </motion.div>

        {/* Roue */}
        <div className="mb-12">
          <Wheel
            items={box.items}
            winningItem={winningItem}
            fastMode={fastMode}
            onFinish={handleAnimationFinish}
            isSpinning={isSpinning}
          />
        </div>

        {/* Résultat */}
        <AnimatePresence>
          {showResult && winningItem && (
            <WinningResult 
              item={winningItem}
              isOpen={showResult}
              onClose={() => setShowResult(false)}
              onSell={handleSellItem}
            />
          )}
        </AnimatePresence>

        {/* Boutons */}
        <div className="mb-12">
          <FreedropButtons
            canClaim={claimStatus?.can_claim || false}
            alreadyClaimed={claimStatus?.already_claimed || false}
            requiredLevel={box.required_level}
            userLevel={claimStatus?.user_level || 1}
            onClaimBox={handleClaimBox}
            onTryFree={handleTryFree}
            onToggleFastMode={handleToggleFastMode}
            fastMode={fastMode}
            isLoading={isSpinning}
          />
        </div>

        {/* Liste des objets */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Contenu de la box
          </h2>
          <LootList items={box.items} />
        </div>
      </div>
    </div>
  )
}