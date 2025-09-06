# implement-minimal-elegant-system.ps1
Write-Host "🎨 Implémentation du système minimaliste et élégant..." -ForegroundColor Green

# 1. Créer la structure des dossiers
Write-Host "`n📁 Création de la structure..." -ForegroundColor Yellow

$componentDirs = @(
    "app/components/BoxPresentation",
    "app/components/OpeningButtons", 
    "app/components/FreedropButtons",
    "app/components/Wheel",
    "app/components/WinningResult",
    "lib/hooks",
    "lib/security"
)

foreach ($dir in $componentDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# 2. Hook de sécurité pour les freedrops
Write-Host "`n🔒 Création du système de sécurité freedrop..." -ForegroundColor Yellow

$securityHook = @'
// lib/hooks/useFreedropSecurity.ts - Hook de sécurité pour freedrops
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface SecurityCheck {
  canClaim: boolean
  alreadyClaimed: boolean
  hasRequiredLevel: boolean
  timeToReset: string
  reason?: string
}

export function useFreedropSecurity(
  userId: string | undefined,
  boxId: string,
  requiredLevel: number,
  userLevel: number
) {
  const [security, setSecurity] = useState<SecurityCheck>({
    canClaim: false,
    alreadyClaimed: false,
    hasRequiredLevel: false,
    timeToReset: ''
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkSecurity = async () => {
      if (!userId || !boxId) {
        setLoading(false)
        return
      }

      try {
        // 1. Vérifier le niveau requis
        const hasRequiredLevel = userLevel >= requiredLevel

        // 2. Vérifier les réclamations d'aujourd'hui
        const today = new Date().toISOString().split('T')[0]
        const { data: claims, error } = await supabase
          .from('daily_claims')
          .select('claimed_at')
          .eq('user_id', userId)
          .eq('daily_box_id', boxId)
          .gte('claimed_at', `${today}T00:00:00.000Z`)
          .lt('claimed_at', `${today}T23:59:59.999Z`)

        if (error) {
          console.error('Erreur vérification sécurité:', error)
          setSecurity({
            canClaim: false,
            alreadyClaimed: false,
            hasRequiredLevel,
            timeToReset: '',
            reason: 'Security check failed'
          })
          return
        }

        const alreadyClaimed = (claims?.length || 0) > 0

        // 3. Calculer le temps jusqu'au reset
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        
        const diff = tomorrow.getTime() - now.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const timeToReset = `${hours}h ${minutes}m`

        // 4. Déterminer si peut réclamer
        const canClaim = hasRequiredLevel && !alreadyClaimed

        setSecurity({
          canClaim,
          alreadyClaimed,
          hasRequiredLevel,
          timeToReset,
          reason: !hasRequiredLevel ? 'Level too low' : alreadyClaimed ? 'Already claimed today' : undefined
        })

      } catch (error) {
        console.error('Erreur sécurité freedrop:', error)
        setSecurity({
          canClaim: false,
          alreadyClaimed: false,
          hasRequiredLevel: false,
          timeToReset: '',
          reason: 'Security error'
        })
      } finally {
        setLoading(false)
      }
    }

    checkSecurity()
    
    // Re-vérifier toutes les minutes
    const interval = setInterval(checkSecurity, 60000)
    return () => clearInterval(interval)
    
  }, [userId, boxId, requiredLevel, userLevel, supabase])

  return { security, loading }
}
'@

Set-Content "lib/hooks/useFreedropSecurity.ts" $securityHook

# 3. Utilitaire de réclamation sécurisée
Write-Host "`n🔒 Création du système de réclamation sécurisée..." -ForegroundColor Yellow

$secureClaimSystem = @'
// lib/security/secureClaim.ts - Système de réclamation sécurisé
import { createClient } from '@/utils/supabase/client'

interface ClaimResult {
  success: boolean
  item?: any
  error?: string
  reason?: string
}

export async function secureClaimFreedrop(
  userId: string,
  boxId: string,
  selectedItemId: string,
  requiredLevel: number,
  userLevel: number
): Promise<ClaimResult> {
  const supabase = createClient()

  try {
    // 1. Vérifications de sécurité côté client
    if (userLevel < requiredLevel) {
      return {
        success: false,
        error: 'Insufficient level',
        reason: `Required level ${requiredLevel}, current ${userLevel}`
      }
    }

    // 2. Vérifier qu'il n'y a pas déjà une réclamation aujourd'hui
    const today = new Date().toISOString().split('T')[0]
    const { data: existingClaims, error: claimError } = await supabase
      .from('daily_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('daily_box_id', boxId)
      .gte('claimed_at', `${today}T00:00:00.000Z`)
      .lt('claimed_at', `${today}T23:59:59.999Z`)

    if (claimError) {
      return {
        success: false,
        error: 'Database error',
        reason: claimError.message
      }
    }

    if (existingClaims && existingClaims.length > 0) {
      return {
        success: false,
        error: 'Already claimed today',
        reason: 'You can only claim once per day'
      }
    }

    // 3. Appeler la fonction RPC sécurisée
    const { data, error } = await supabase.rpc('claim_daily_box', {
      p_box_id: boxId,
      p_item_id: selectedItemId,
      p_user_id: userId
    })

    if (error) {
      return {
        success: false,
        error: 'Claim failed',
        reason: error.message
      }
    }

    // 4. Vérifier que l'item a bien été ajouté à l'inventaire
    const { data: inventoryCheck, error: invError } = await supabase
      .from('user_inventory')
      .select('id, items(*)')
      .eq('user_id', userId)
      .eq('item_id', selectedItemId)
      .eq('is_daily_reward', true)
      .order('obtained_at', { ascending: false })
      .limit(1)

    if (invError || !inventoryCheck || inventoryCheck.length === 0) {
      return {
        success: false,
        error: 'Item not found in inventory',
        reason: 'The claim may have failed silently'
      }
    }

    return {
      success: true,
      item: inventoryCheck[0].items
    }

  } catch (error) {
    console.error('Erreur réclamation sécurisée:', error)
    return {
      success: false,
      error: 'Unexpected error',
      reason: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export function validateFreedropAccess(
  userLevel: number,
  requiredLevel: number,
  lastClaimDate?: string
): { canAccess: boolean; reason?: string } {
  // Vérifier le niveau
  if (userLevel < requiredLevel) {
    return {
      canAccess: false,
      reason: `Level ${requiredLevel} required (current: ${userLevel})`
    }
  }

  // Vérifier la réclamation quotidienne
  if (lastClaimDate) {
    const today = new Date().toISOString().split('T')[0]
    const claimDate = new Date(lastClaimDate).toISOString().split('T')[0]
    
    if (claimDate === today) {
      return {
        canAccess: false,
        reason: 'Already claimed today'
      }
    }
  }

  return { canAccess: true }
}
'@

Set-Content "lib/security/secureClaim.ts" $secureClaimSystem

# 4. Page d'ouverture freedrop mise à jour avec sécurité
Write-Host "`n📄 Mise à jour de la page d'ouverture freedrop..." -ForegroundColor Yellow

$secureFreedropOpening = @'
// app/freedrop/[id]/page.tsx - Version sécurisée avec composants minimalistes
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, AlertCircle } from 'lucide-react'

// Import des composants minimalistes
import { BoxPresentation } from '@/app/components/BoxPresentation/BoxPresentation'
import { Wheel } from '@/app/components/Wheel/Wheel'
import { WinningResult } from '@/app/components/WinningResult/WinningResult'
import { FreedropButtons } from '@/app/components/FreedropButtons/FreedropButtons'
import { LootList } from '@/app/components/LootList/LootList'
import { useFreedropSecurity } from '@/lib/hooks/useFreedropSecurity'
import { secureClaimFreedrop } from '@/lib/security/secureClaim'
import { selectRandomItem } from '@/lib/utils/lootbox-utils'

interface LootItem {
  id: string
  name: string
  image_url: string
  market_value: number
  rarity: string
  probability: number
}

interface FreedropBox {
  id: string
  name: string
  description: string
  image_url: string
  required_level: number
  banner_url?: string
  items: LootItem[]
}

export default function FreedropOpeningPage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [box, setBox] = useState<FreedropBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningItem, setWinningItem] = useState<LootItem | null>(null)
  const [fastMode, setFastMode] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [error, setError] = useState('')

  const boxId = params?.id as string
  
  // Hook de sécurité
  const { security, loading: securityLoading } = useFreedropSecurity(
    user?.id,
    boxId,
    box?.required_level || 1,
    profile?.level || 1
  )

  // Protection de route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Charger la box
  useEffect(() => {
    if (!isAuthenticated || !boxId) return

    const loadBoxData = async () => {
      try {
        setLoading(true)
        setError('')

        const { data: boxData, error: boxError } = await supabase
          .from('loot_boxes')
          .select(`
            id,
            name,
            description,
            image_url,
            required_level,
            banner_url,
            loot_box_items!inner (
              probability,
              display_order,
              items (
                id,
                name,
                image_url,
                market_value,
                rarity
              )
            )
          `)
          .eq('id', boxId)
          .eq('is_daily_free', true)
          .eq('is_active', true)
          .single()

        if (boxError || !boxData) {
          setError('Cette freedrop n\'existe pas ou n\'est plus disponible')
          return
        }

        // Trier les items par display_order puis par valeur
        const sortedItems = boxData.loot_box_items
          .sort((a, b) => {
            if (a.display_order !== null && b.display_order !== null) {
              return a.display_order - b.display_order
            }
            return b.items.market_value - a.items.market_value
          })
          .map(item => ({
            ...item.items,
            probability: item.probability
          }))

        setBox({
          id: boxData.id,
          name: boxData.name,
          description: boxData.description || '',
          image_url: boxData.image_url || '',
          required_level: boxData.required_level || 1,
          banner_url: boxData.banner_url,
          items: sortedItems
        })

      } catch (error) {
        console.error('Erreur chargement box:', error)
        setError('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    loadBoxData()
  }, [isAuthenticated, boxId, supabase])

  // Réclamation sécurisée
  const handleSecureClaim = async () => {
    if (!box || !security.canClaim || isSpinning) return

    const selectedItem = selectRandomItem(box.items)
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)

    try {
      const result = await secureClaimFreedrop(
        user!.id,
        box.id,
        selectedItem.id,
        box.required_level,
        profile?.level || 1
      )

      if (!result.success) {
        console.error('Réclamation échouée:', result.error, result.reason)
        setError(result.reason || result.error || 'Réclamation échouée')
        setIsSpinning(false)
        return
      }

      // Rafraîchir le profil après succès
      setTimeout(() => {
        refreshProfile?.()
      }, 3000)

    } catch (error) {
      console.error('Erreur réclamation:', error)
      setError('Une erreur inattendue s\'est produite')
      setIsSpinning(false)
    }
  }

  // Essai gratuit
  const handleTryFree = () => {
    if (!box || isSpinning) return
    const selectedItem = selectRandomItem(box.items)
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)
  }

  const handleAnimationFinish = () => {
    setIsSpinning(false)
    setShowResult(true)
  }

  const handleSellItem = (item: LootItem) => {
    // TODO: Implémenter la vente d'item
    console.log('Vendre item:', item)
    setShowResult(false)
  }

  const handleUpgradeItem = (item: LootItem) => {
    // TODO: Implémenter l'upgrade (plus tard)
    console.log('Upgrade item (bientôt disponible):', item)
  }

  if (authLoading || loading || securityLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/freedrop')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
          >
            Retour aux freedrops
          </button>
        </div>
      </div>
    )
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">Freedrop introuvable</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">
        
        {/* Présentation avec bannière */}
        <BoxPresentation
          boxName={box.name}
          boxImage={box.image_url}
          boxDescription={box.description}
          requiredLevel={box.required_level}
          userLevel={profile?.level || 1}
          bannerUrl={box.banner_url}
          isFreedrp={true}
        />

        {/* Roue minimaliste */}
        <div className="flex justify-center">
          <Wheel
            items={box.items}
            winningItem={winningItem}
            fastMode={fastMode}
            onFinish={handleAnimationFinish}
            isSpinning={isSpinning}
          />
        </div>

        {/* Boutons sécurisés */}
        <div className="flex justify-center">
          <FreedropButtons
            canClaim={security.canClaim}
            alreadyClaimed={security.alreadyClaimed}
            requiredLevel={box.required_level}
            userLevel={profile?.level || 1}
            onClaimBox={handleSecureClaim}
            onTryFree={handleTryFree}
            onToggleFastMode={() => setFastMode(!fastMode)}
            fastMode={fastMode}
            isLoading={isSpinning}
          />
        </div>

        {/* Liste des objets */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Possible Rewards
          </h2>
          <LootList items={box.items} />
        </div>
      </div>

      {/* Pop-up de résultat */}
      <WinningResult
        item={winningItem!}
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        onSell={handleSellItem}
        onUpgrade={handleUpgradeItem}
      />
    </div>
  )
}
'@

Set-Content "app/freedrop/[id]/page.tsx" $secureFreedropOpening

# 5. Page d'ouverture boxes normale mise à jour
Write-Host "`n📄 Mise à jour de la page d'ouverture boxes..." -ForegroundColor Yellow

$modernBoxOpening = @'
// app/boxes/[id]/page.tsx - Version minimaliste mise à jour
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import des composants minimalistes
import { BoxPresentation } from '@/app/components/BoxPresentation/BoxPresentation'
import { Wheel } from '@/app/components/Wheel/Wheel'
import { WinningResult } from '@/app/components/WinningResult/WinningResult'
import { OpeningButtons } from '@/app/components/OpeningButtons/OpeningButtons'
import { LootList } from '@/app/components/LootList/LootList'
import { selectRandomItem } from '@/lib/utils/lootbox-utils'

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
  banner_url?: string
  items: LootItem[]
}

export default function BoxOpeningPage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [box, setBox] = useState<LootBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningItem, setWinningItem] = useState<LootItem | null>(null)
  const [fastMode, setFastMode] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const boxId = params?.id as string

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Charger la boîte
  useEffect(() => {
    if (!isAuthenticated || !boxId) return

    const loadBoxData = async () => {
      try {
        setLoading(true)

        const { data: boxData, error: boxError } = await supabase
          .from('loot_boxes')
          .select(`
            id,
            name,
            description,
            image_url,
            price_virtual,
            banner_url,
            loot_box_items!inner (
              probability,
              display_order,
              items (
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

        if (boxError || !boxData) {
          router.push('/boxes')
          return
        }

        const sortedItems = boxData.loot_box_items
          .sort((a, b) => {
            if (a.display_order !== null && b.display_order !== null) {
              return a.display_order - b.display_order
            }
            return b.items.market_value - a.items.market_value
          })
          .map(item => ({
            ...item.items,
            probability: item.probability
          }))

        setBox({
          id: boxData.id,
          name: boxData.name,
          description: boxData.description || '',
          image_url: boxData.image_url || '',
          price_virtual: boxData.price_virtual,
          banner_url: boxData.banner_url,
          items: sortedItems
        })

      } catch (error) {
        console.error('Erreur chargement boîte:', error)
        router.push('/boxes')
      } finally {
        setLoading(false)
      }
    }

    loadBoxData()
  }, [isAuthenticated, boxId, supabase, router])

  // Ouvrir la boîte (mode payant)
  const handleOpenBox = async () => {
    if (!box || !profile || isSpinning || profile.virtual_currency < box.price_virtual) return

    const selectedItem = selectRandomItem(box.items)
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)

    try {
      await supabase.rpc('open_loot_box', {
        p_user_id: user?.id,
        p_loot_box_id: box.id
      })
      
      setTimeout(() => refreshProfile?.(), 3000)
    } catch (error) {
      console.error('Erreur ouverture:', error)
    }
  }

  const handleTryFree = () => {
    if (!box || isSpinning) return
    const selectedItem = selectRandomItem(box.items)
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)
  }

  const handleAnimationFinish = () => {
    setIsSpinning(false)
    setShowResult(true)
  }

  const handleSellItem = (item: LootItem) => {
    console.log('Vendre item:', item)
    setShowResult(false)
  }

  if (authLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Box not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">
        
        {/* Présentation avec bannière */}
        <BoxPresentation
          boxName={box.name}
          boxImage={box.image_url}
          boxDescription={box.description}
          boxPrice={box.price_virtual}
          bannerUrl={box.banner_url}
        />

        {/* Roue minimaliste */}
        <div className="flex justify-center">
          <Wheel
            items={box.items}
            winningItem={winningItem}
            fastMode={fastMode}
            onFinish={handleAnimationFinish}
            isSpinning={isSpinning}
          />
        </div>

        {/* Boutons minimalistes */}
        <div className="flex justify-center">
          <OpeningButtons
            boxPrice={box.price_virtual}
            userCoins={profile?.virtual_currency || 0}
            onOpenBox={handleOpenBox}
            onTryFree={handleTryFree}
            onToggleFastMode={() => setFastMode(!fastMode)}
            fastMode={fastMode}
            isLoading={isSpinning}
          />
        </div>

        {/* Liste des objets */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Possible Rewards
          </h2>
          <LootList items={box.items} />
        </div>
      </div>

      {/* Pop-up de résultat */}
      <WinningResult
        item={winningItem!}
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        onSell={handleSellItem}
        onUpgrade={() => console.log('Upgrade bientôt disponible')}
      />
    </div>
  )
}
'@

Set-Content "app/boxes/[id]/page.tsx" $modernBoxOpening

Write-Host "`n✅ Système minimaliste et élégant implémenté!" -ForegroundColor Green
Write-Host "`n🎨 Fonctionnalités:" -ForegroundColor Cyan
Write-Host "✅ Composants minimalistes et épurés" -ForegroundColor White
Write-Host "✅ Sécurité freedrop: 1 fois/jour + niveau requis" -ForegroundColor White
Write-Host "✅ Animation rapide: 2.5s normal, 1.5s fast mode" -ForegroundColor White
Write-Host "✅ Pop-up élégant avec options Sell/Upgrade" -ForegroundColor White
Write-Host "✅ BoxPresentation avec support bannière" -ForegroundColor White
Write-Host "✅ Prix épuré et minimaliste" -ForegroundColor White
Write-Host "✅ Objets ajoutés à l'inventaire après ouverture" -ForegroundColor White
Write-Host "✅ Ordre respecté: display_order > valeur décroissante" -ForegroundColor White

Write-Host "`n🚀 Pour appliquer:" -ForegroundColor Yellow
Write-Host ".\implement-minimal-elegant-system.ps1" -ForegroundColor White
Write-Host "npm run build" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White