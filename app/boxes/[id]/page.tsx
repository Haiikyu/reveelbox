// app/boxes/[id]/page.tsx - Version corrigée complète
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticlesBackground from '@/app/components/affiliate/ParticlesBackground'

// Import des composants optimisés
import { BoxPresentation } from '@/app/components/BoxPresentation/BoxPresentation'
import { Wheel } from '@/app/components/Wheel/Wheel'
import { WinningResult } from '@/app/components/WinningResult/WinningResult'
import { OpeningButtons } from '@/app/components/OpeningButtons/OpeningButtons'
import { LootList } from '@/app/components/LootList/LootList'

interface LootItem {
  id: string
  name: string
  image_url: string
  market_value: number
  rarity: string
  probability: number
}

interface LootBox {
  id: string
  name: string
  description?: string
  image_url: string
  price_virtual: number
  items: LootItem[]
}

export default function BoxOpeningPage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  // États optimisés
  const [box, setBox] = useState<LootBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningItem, setWinningItem] = useState<LootItem | null>(null)
  const [fastMode, setFastMode] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isFreeWin, setIsFreeWin] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const boxId = params?.id as string

  // Mémorisation des messages pour éviter les re-renders
  const showMessage = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(''), 5000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(''), 3000)
    }
  }, [])

  // Protection de route optimisée
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Chargement optimisé avec cache et timeout CORRIGÉ
  useEffect(() => {
    if (!isAuthenticated || !boxId) return

    let isCancelled = false
    let timeoutId: NodeJS.Timeout

    const loadBoxData = async () => {
      try {
        setLoading(true)
        setError('')

        // Timeout pour éviter les blocages - SANS abortSignal
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            isCancelled = true
            showMessage('Timeout: Chargement trop long', 'error')
            setLoading(false)
          }
        }, 10000)

        const { data: boxData, error: boxError } = await supabase
          .from('loot_boxes')
          .select(`
            id,
            name,
            description,
            image_url,
            price_virtual,
            loot_box_items!inner (
              probability,
              display_order,
              items!inner (
                id,
                name,
                image_url,
                market_value,
                rarity
              )
            )
          `)
          .eq('id', boxId)
          .eq('is_active', true)
          .neq('is_daily_free', true)
          .single()

        // Nettoyer le timeout si la requête réussit
        clearTimeout(timeoutId)

        if (isCancelled) return

        if (boxError) {
          console.error('Erreur chargement boîte:', boxError)
          if (boxError.code === 'PGRST116') {
            showMessage('Cette boîte n\'existe pas ou n\'est plus disponible', 'error')
          } else {
            showMessage('Erreur lors du chargement de la boîte', 'error')
          }
          setTimeout(() => router.push('/boxes'), 2000)
          return
        }

        if (!boxData?.loot_box_items?.length) {
          showMessage('Cette boîte ne contient aucun objet', 'error')
          setTimeout(() => router.push('/boxes'), 2000)
          return
        }

        // Traitement optimisé des items - TYPE SAFE
        const processedItems = boxData.loot_box_items
          .filter((item: any) => item?.items?.id) // Filtrer les éléments valides
          .sort((a: any, b: any) => {
            // Tri par display_order ou par valeur
            if (a.display_order !== null && b.display_order !== null) {
              return a.display_order - b.display_order
            }
            const aValue = a.items?.market_value || 0
            const bValue = b.items?.market_value || 0
            return bValue - aValue
          })
          .map((item: any) => ({
            id: item.items.id,
            name: item.items.name,
            image_url: item.items.image_url || '',
            market_value: item.items.market_value,
            rarity: item.items.rarity,
            probability: item.probability
          })) as LootItem[]

        setBox({
          id: boxData.id,
          name: boxData.name,
          description: boxData.description || '',
          image_url: boxData.image_url || '',
          price_virtual: boxData.price_virtual,
          items: processedItems
        })

        showMessage('Boîte chargée avec succès', 'success')

      } catch (error: any) {
        if (isCancelled) return
        
        console.error('Erreur critique:', error)
        showMessage('Erreur inattendue lors du chargement', 'error')
        setTimeout(() => router.push('/boxes'), 2000)
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadBoxData()

    return () => {
      isCancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isAuthenticated, boxId, supabase, router, showMessage])

  // Sélection d'item optimisée avec mémorisation
  const selectRandomItem = useCallback((items: LootItem[]): LootItem => {
    const totalProbability = items.reduce((sum, item) => sum + item.probability, 0)
    let random = Math.random() * totalProbability
    
    for (const item of items) {
      random -= item.probability
      if (random <= 0) {
        return item
      }
    }
    
    return items[0]
  }, [])

  // Ouverture de boîte optimisée
  const handleOpenBox = useCallback(async () => {
    if (!box || !profile || !user?.id || isSpinning) return

    const currentBalance = profile.virtual_currency || 0
    if (currentBalance < box.price_virtual) {
      showMessage(`Il vous manque ${box.price_virtual - currentBalance} coins`, 'error')
      return
    }

    // Pré-sélection de l'item pour une animation fluide
    const selectedItem = selectRandomItem(box.items)
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)
    setIsFreeWin(false)
    setError('')

    try {
      const { data, error } = await supabase.rpc('process_box_opening', {
        p_user_id: user.id,
        p_loot_box_id: box.id,
        p_item_id: selectedItem.id,
        p_cost: box.price_virtual
      })

      if (error) {
        console.error('Erreur RPC:', error)
        showMessage(`Erreur: ${error.message}`, 'error')
        setIsSpinning(false)
        setWinningItem(null)
        return
      }

      if (data && !data.success) {
        showMessage(`Erreur: ${data.error}`, 'error')
        setIsSpinning(false)
        setWinningItem(null)
        return
      }

      showMessage(`Vous avez gagné ${selectedItem.name}!`, 'success')
      
      // Refresh différé pour ne pas bloquer l'animation
      setTimeout(async () => {
        try {
          await refreshProfile?.()
        } catch (error) {
          console.error('Erreur refresh:', error)
        }
      }, 3000)

    } catch (error) {
      console.error('Erreur critique:', error)
      showMessage('Erreur inattendue lors de l\'ouverture', 'error')
      setIsSpinning(false)
      setWinningItem(null)
    }
  }, [box, profile, user?.id, isSpinning, selectRandomItem, supabase, showMessage, refreshProfile])

  // Essai gratuit optimisé
  const handleTryFree = useCallback(() => {
    if (!box || isSpinning) return

    const selectedItem = selectRandomItem(box.items)
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)
    setIsFreeWin(true)
  }, [box, isSpinning, selectRandomItem])

  // Toggle fast mode mémorisé
  const handleToggleFastMode = useCallback(() => {
    setFastMode(prev => !prev)
  }, [])

  // Fin d'animation optimisée
  const handleAnimationFinish = useCallback(() => {
    setIsSpinning(false)
    setShowResult(true)
  }, [])

  // Vente d'item optimisée
  const handleSellItem = useCallback(async (item: LootItem) => {
    if (!user || !profile) return

    try {
      // 1. Supprimer l'item de l'inventaire s'il y est (il a été ajouté par process_box_opening)
      const { error: deleteError } = await supabase
        .from('user_inventory')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', item.id)
        .order('obtained_at', { ascending: false })
        .limit(1)

      if (deleteError) {
        console.error('Erreur suppression inventaire:', deleteError)
      }

      // 2. Créditer les coins de vente
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          virtual_currency: (profile.virtual_currency || 0) + item.market_value
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // 3. Rafraîchir le profil
      await refreshProfile()

      showMessage(`${item.name} vendu pour ${item.market_value} coins`, 'success')

      // 4. NE PAS fermer le résultat - garder l'affichage de l'item gagné
      // L'utilisateur peut fermer manuellement ou ouvrir une autre boîte
    } catch (error) {
      console.error('Erreur lors de la vente:', error)
      showMessage('Erreur lors de la vente', 'error')
    }
  }, [user, profile, supabase, refreshProfile, showMessage])

  // Mémorisation des propriétés pour éviter les re-renders
  const canAfford = useMemo(() => {
    return profile ? profile.virtual_currency >= (box?.price_virtual || 0) : false
  }, [profile?.virtual_currency, box?.price_virtual])

  if (authLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <LoadingState text="Chargement de la boîte..." />
      </div>
    )
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Boîte introuvable</h2>
          <p>Cette boîte n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    )
  }

return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 transition-colors duration-300 relative">
    <ParticlesBackground />

    <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* Présentation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16" // Espace normal
      >
        <BoxPresentation
          boxName={box.name}
          boxImage={box.image_url}
          boxDescription={box.description}
          boxPrice={box.price_virtual}
          isFreedrp={false}
        />
      </motion.div>

      {/* Roue */}
      <div className="mb-24 overflow-hidden">
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
            isFree={isFreeWin}
          />
        )}
      </AnimatePresence>

      {/* Boutons d'action */}
      <div className="mb-16">
        <OpeningButtons
          boxPrice={box.price_virtual}
          userCoins={profile?.virtual_currency || 0}
          onOpenBox={handleOpenBox}
          onTryFree={handleTryFree}
          onToggleFastMode={handleToggleFastMode}
          fastMode={fastMode}
          isLoading={isSpinning}
          disabled={isSpinning}
        />
      </div>

      {/* Liste des objets */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Contenu de la boîte
        </h2>
        <LootList items={box.items} />
      </div>
    </div>
  </div>
)
}