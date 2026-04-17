// app/boxes/[id]/page.tsx - Design épuré noir profond + Provably Fair
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useTheme } from '@/app/components/ThemeProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { Package, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  createProvablyFairSession,
  selectItemByProbability,
  type ProvablyFairState
} from '@/lib/provablyFair'

import { Wheel } from '@/app/components/Wheel/WheelNew'
import { UnifiedWinModal } from '@/app/components/UnifiedWinModal'
import { LootList } from '@/app/components/LootList/LootList'
import { DropsFeed } from '@/app/components/DropsFeed'
import { ReplayButton } from '@/app/components/ReplayButton'
import { FavoriteButton } from '@/app/components/FavoriteButton'
import { ItemPreviewModal } from '@/app/components/ItemPreviewModal'
import { ProvablyFairModal } from '@/app/components/ProvablyFairModal'

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

// Couleurs de rareté
const rarityColors: Record<string, string> = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b'
}

const LEGENDARY_LOGO_URL = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/ChatGPT_Image_6_sept._2025_19_31_10.png'
const MYSTERY_LEGENDARY_ITEM: LootItem = { id: 'mystery-legendary', name: 'LEGENDARY', image_url: LEGENDARY_LOGO_URL, market_value: 0, rarity: 'legendary', probability: 0 }

// Composant roue autonome avec gestion légendaire intégrée
function LegendaryWheelWrapper({ items, winningItem, fastMode, onFinish, isSpinning, height, spinKey }: {
  items: LootItem[]
  winningItem: LootItem | null
  fastMode: boolean
  onFinish: () => void
  isSpinning: boolean
  height: number
  spinKey: number
}) {
  const [phase, setPhase] = useState<'idle' | 'flash' | 'spin2'>('idle')
  const hasFinishedRef = useRef(false)
  const lastWinRef = useRef<LootItem | null>(null)
  const isLeg = winningItem?.rarity?.toLowerCase() === 'legendary'

  // Stocker le dernier item gagnant pour l'afficher après le spin
  if ((isSpinning || phase === 'spin2') && winningItem) lastWinRef.current = winningItem

  useEffect(() => {
    setPhase('idle')
    hasFinishedRef.current = false
    lastWinRef.current = null
  }, [spinKey])

  const playThunder = () => {
    try {
      const ctx = new AudioContext()
      const crack = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
      const cd = crack.getChannelData(0)
      for (let i = 0; i < cd.length; i++) cd[i] = (Math.random()*2-1) * Math.pow(1 - i/cd.length, 0.1)
      const cs = ctx.createBufferSource(); cs.buffer = crack
      const cg = ctx.createGain(); cg.gain.setValueAtTime(1.5, ctx.currentTime); cg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.15)
      const cf = ctx.createBiquadFilter(); cf.type='highpass'; cf.frequency.value=1000
      cs.connect(cf); cf.connect(cg); cg.connect(ctx.destination); cs.start()
      const thunder = ctx.createBuffer(1, ctx.sampleRate*3, ctx.sampleRate)
      const td = thunder.getChannelData(0)
      for (let i = 0; i < td.length; i++) td[i] = (Math.random()*2-1) * Math.pow(1-i/td.length, 0.4)
      const ts = ctx.createBufferSource(); ts.buffer = thunder
      const tg = ctx.createGain(); tg.gain.setValueAtTime(0, ctx.currentTime+0.05); tg.gain.linearRampToValueAtTime(1.2, ctx.currentTime+0.2); tg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+3)
      const tf = ctx.createBiquadFilter(); tf.type='lowpass'; tf.frequency.value=300
      ts.connect(tf); tf.connect(tg); tg.connect(ctx.destination); ts.start(ctx.currentTime+0.05)
    } catch {}
  }

  // TOUJOURS substituer les items legendary par MYSTERY (avant ET pendant le spin)
  const wheelItems = phase === 'spin2'
    ? items.filter(i => i.rarity.toLowerCase() === 'legendary')
    : items.map(i => i.rarity.toLowerCase() === 'legendary' ? { ...MYSTERY_LEGENDARY_ITEM, probability: i.probability } : i)

  const wheelWinning = hasFinishedRef.current
    ? lastWinRef.current
    : phase === 'spin2'
      ? winningItem
      : (isLeg ? MYSTERY_LEGENDARY_ITEM : (isSpinning ? winningItem : lastWinRef.current))
  const wheelSpinning = hasFinishedRef.current
    ? false
    : phase === 'flash'
      ? false
      : phase === 'spin2'
        ? true
        : isSpinning

  const handleDone = () => {
    if (hasFinishedRef.current) return // guard double-call
    if (phase === 'spin2') {
      setPhase('idle')
      hasFinishedRef.current = true
      onFinish()
      return
    }
    if (isLeg && phase === 'idle') {
      setPhase('flash')
      playThunder()
      setTimeout(() => setPhase('spin2'), 2500)
      return
    }
    hasFinishedRef.current = true
    onFinish()
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {phase === 'flash' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden z-50"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.8, 0] }}
              transition={{ duration: 0.5, times: [0, 0.1, 0.3, 1] }}
              style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(245,158,11,0.4) 40%, transparent 70%)' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400"
              initial={{ width: 0, height: 0, opacity: 1 }} animate={{ width: '150%', height: '500%', opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              style={{ boxShadow: '0 0 30px #f59e0b' }}
            />
            <motion.div className="relative text-center z-10"
              animate={{ x: [0, -6, 6, -4, 4, -2, 2, 0] }} transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.img src={LEGENDARY_LOGO_URL} alt="Legendary" className="w-16 h-16 object-contain mx-auto mb-2"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                style={{ filter: 'drop-shadow(0 0 20px #f59e0b)' }}
              />
              <motion.h2 initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 250 }}
                className="text-2xl font-black uppercase"
                style={{ color: '#f59e0b', textShadow: '0 0 15px #f59e0b, 0 0 30px #f59e0b', letterSpacing: '0.2em' }}
              >Legendary</motion.h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Wheel
        key={`wheel-${spinKey}`}
        items={wheelItems}
        winningItem={wheelWinning}
        fastMode={fastMode}
        onFinish={handleDone}
        isSpinning={wheelSpinning}
        height={height}
      />
    </div>
  )
}

// Modal résultat multi-items
function MultiWinResult({
  items,
  isOpen,
  onClose,
  isDark
}: {
  items: LootItem[]
  isOpen: boolean
  onClose: () => void
  isDark: boolean
}) {
  if (!isOpen || items.length === 0) return null

  const totalValue = items.reduce((sum, item) => sum + item.market_value, 0)
  const bestItem = items.reduce((best, item) =>
    item.market_value > best.market_value ? item : best
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3
            className="text-xs font-medium uppercase mb-2"
            style={{ letterSpacing: '0.2em', color: isDark ? '#969087' : 'rgba(0,0,0,0.4)' }}
          >
            {items.length} items obtenus
          </h3>
          <div className="flex items-center justify-center gap-2">
            <img
              src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
              alt="coin"
              className="w-5 h-5"
            />
            <span className="text-2xl font-black" style={{ color: '#f59e0b' }}>
              {totalValue.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: isDark ? '#6D675F' : 'rgba(0,0,0,0.3)' }}>total</span>
          </div>
        </div>

        <div className={`grid gap-3 mb-8 ${items.length <= 2 ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-5'}`}>
          {items.map((item, index) => {
            const glow = rarityColors[item.rarity.toLowerCase()] || rarityColors.common
            const isBest = item.id === bestItem.id && items.length > 1

            return (
              <motion.div
                key={`result-${index}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col items-center p-3 rounded-xl"
                style={{
                  background: isDark ? 'rgba(201,168,124,0.06)' : 'rgba(0,0,0,0.03)',
                  border: isBest ? `1px solid ${glow}40` : '1px solid transparent'
                }}
              >
                {isBest && (
                  <div className="absolute -inset-1 rounded-xl blur-md -z-10"
                    style={{ backgroundColor: glow, opacity: 0.1 }} />
                )}
                <img
                  src={item.image_url || 'https://via.placeholder.com/80'}
                  alt={item.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain mb-2"
                  style={{ filter: `drop-shadow(0 2px 8px ${glow}20)` }}
                />
                <div className="text-[10px] font-semibold text-center truncate w-full"
                  style={{ color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.7)' }}>
                  {item.name}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: glow }} />
                  <span className="text-[10px] font-bold" style={{ color: glow }}>
                    {item.market_value.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white"
            style={{
              background: isDark ? 'linear-gradient(135deg, #C9A87C, #A08060)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: isDark ? '0 4px 20px rgba(201,168,124,0.25)' : '0 4px 20px rgba(59,130,246,0.25)'
            }}
          >
            Continuer
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Séparateur gradient fin
function GradientSeparator() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <div className="w-full my-8 sm:my-10 h-px" style={{
      background: isDark
        ? 'linear-gradient(90deg, transparent 5%, rgba(255,240,220,0.06) 50%, transparent 95%)'
        : 'linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.06) 50%, transparent 95%)'
    }} />
  )
}

export default function BoxOpeningPage() {
  const { user, profile, loading: authLoading, isAuthenticated, refreshProfile } = useAuth()
  const { resolvedTheme } = useTheme()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const isDark = resolvedTheme === 'dark'

  const [box, setBox] = useState<LootBox | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winningItem, setWinningItem] = useState<LootItem | null>(null)
  const [fastMode, setFastMode] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isFreeWin, setIsFreeWin] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastOpeningItem, setLastOpeningItem] = useState<LootItem | null>(null)
  const [multiOpenCount, setMultiOpenCount] = useState<number>(1)
  const [selectedCount, setSelectedCount] = useState<number>(1)
  const [multiWinningItems, setMultiWinningItems] = useState<LootItem[]>([])
  const [spinKey, setSpinKey] = useState(0)
  const finishedCountRef = useRef(0)
  const [previewItem, setPreviewItem] = useState<LootItem | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Provably Fair
  const [pfState, setPfState] = useState<ProvablyFairState | null>(null)
  const [showPfVerifier, setShowPfVerifier] = useState(false)
  const [lastPfData, setLastPfData] = useState<{
    serverSeedHash: string; serverSeed: string; clientSeed: string; nonce: number; roll: number; hash: string
  } | null>(null)

  const realWinningItemRef = useRef<LootItem | null>(null)

  const boxId = params?.id as string
  const pageBg = isDark ? '#0C1220' : '#fafafa'

  // Init provably fair session
  useEffect(() => {
    if (isAuthenticated && !pfState) {
      const session = createProvablyFairSession()
      setPfState({ ...session, history: [] })
    }
  }, [isAuthenticated, pfState])

  const showMessage = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(''), 5000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(''), 3000)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !boxId) return

    let isCancelled = false
    let timeoutId: NodeJS.Timeout

    const loadBoxData = async () => {
      try {
        setLoading(true)
        setError('')

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
            id, name, description, image_url, price_virtual,
            loot_box_items!inner (
              probability, display_order,
              items!inner ( id, name, image_url, market_value, rarity )
            )
          `)
          .eq('id', boxId)
          .eq('is_active', true)
          .neq('is_daily_free', true)
          .single()

        clearTimeout(timeoutId)
        if (isCancelled) return

        if (boxError) {
          showMessage(
            boxError.code === 'PGRST116'
              ? 'Cette boîte n\'existe pas ou n\'est plus disponible'
              : 'Erreur lors du chargement de la boîte',
            'error'
          )
          setTimeout(() => router.push('/boxes'), 2000)
          return
        }

        if (!boxData?.loot_box_items?.length) {
          showMessage('Cette boîte ne contient aucun objet', 'error')
          setTimeout(() => router.push('/boxes'), 2000)
          return
        }

        const processedItems = boxData.loot_box_items
          .filter((item: any) => item?.items?.id)
          .sort((a: any, b: any) => {
            if (a.display_order !== null && b.display_order !== null) {
              return a.display_order - b.display_order
            }
            return (b.items?.market_value || 0) - (a.items?.market_value || 0)
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
      } catch {
        if (isCancelled) return
        showMessage('Erreur inattendue lors du chargement', 'error')
        setTimeout(() => router.push('/boxes'), 2000)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadBoxData()
    return () => {
      isCancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isAuthenticated, boxId, supabase, router, showMessage])

  // Sélection provably fair d'un item
  const selectItemProvablyFair = useCallback((items: LootItem[], nonce: number): {
    item: LootItem; roll: number; hash: string
  } | null => {
    if (!pfState) return null
    return selectItemByProbability(items, pfState.serverSeed, pfState.clientSeed, nonce)
  }, [pfState])

  // Fallback si pas de PF state
  const selectRandomItem = useCallback((items: LootItem[]): LootItem => {
    const totalProbability = items.reduce((sum, item) => sum + item.probability, 0)
    let random = Math.random() * totalProbability
    for (const item of items) {
      random -= item.probability
      if (random <= 0) return item
    }
    return items[0]
  }, [])

  const handleItemPreview = useCallback((item: LootItem) => {
    setPreviewItem(item)
    setShowPreview(true)
  }, [])

  const handleReplay = useCallback(() => {
    if (!lastOpeningItem || isSpinning) return
    setMultiOpenCount(1)
    setMultiWinningItems([])
    finishedCountRef.current = 0
    setWinningItem(lastOpeningItem)
    setIsSpinning(true)
    setShowResult(false)
    setIsFreeWin(true)
  }, [lastOpeningItem, isSpinning])

  const handleMultiOpen = useCallback(async (count?: number) => {
    const openCount = count ?? selectedCount
    if (!box || !profile || !user?.id || isSpinning) return

    const totalCost = box.price_virtual * openCount
    const currentBalance = profile.virtual_currency || 0

    if (currentBalance < totalCost) {
      showMessage(`Vous avez besoin de ${(totalCost - currentBalance).toLocaleString()} coins supplémentaires`, 'error')
      return
    }

    const currentNonce = pfState?.nonce ?? 0
    const selectedItems: LootItem[] = []

    for (let i = 0; i < openCount; i++) {
      const pfResult = selectItemProvablyFair(box.items, currentNonce + i)
      if (pfResult) {
        selectedItems.push(pfResult.item)
        if (i === 0 && pfState) {
          setLastPfData({
            serverSeedHash: pfState.serverSeedHash,
            serverSeed: pfState.serverSeed,
            clientSeed: pfState.clientSeed,
            nonce: currentNonce + i,
            roll: pfResult.roll,
            hash: pfResult.hash
          })
        }
      } else {
        selectedItems.push(selectRandomItem(box.items))
      }
    }

    if (pfState) {
      setPfState(prev => prev ? { ...prev, nonce: prev.nonce + openCount } : prev)
    }

    setMultiOpenCount(openCount)
    setMultiWinningItems(selectedItems)
    realWinningItemRef.current = selectedItems[0]
    setWinningItem(selectedItems[0])
    setLastOpeningItem(selectedItems[0])
    finishedCountRef.current = 0
    setSpinKey(prev => prev + 1)
    window.dispatchEvent(new CustomEvent('box-spin-start'))
    setIsSpinning(true)
    setShowResult(false)
    setIsFreeWin(false)
    setError('')

    try {
      for (const selectedItem of selectedItems) {
        const { data, error } = await supabase.rpc('process_box_opening', {
          p_user_id: user.id,
          p_loot_box_id: box.id,
          p_item_id: selectedItem.id,
          p_cost: box.price_virtual
        })

        if (error) {
          showMessage(`Erreur: ${error.message}`, 'error')
          setIsSpinning(false)
          setWinningItem(null)
          setMultiWinningItems([])
          return
        }

        if (data && !data.success) {
          showMessage(`Erreur: ${data.error}`, 'error')
          setIsSpinning(false)
          setWinningItem(null)
          setMultiWinningItems([])
          return
        }
      }

      try { await refreshProfile?.() } catch {}
    } catch {
      showMessage('Erreur inattendue lors de l\'ouverture', 'error')
      setIsSpinning(false)
      setWinningItem(null)
      setMultiWinningItems([])
    }
  }, [box, profile, user?.id, isSpinning, pfState, selectedCount, selectItemProvablyFair, selectRandomItem, supabase, showMessage, refreshProfile])

  const handleTryFree = useCallback(() => {
    if (!box || isSpinning) return

    // Utiliser PF même pour les essais gratuits
    const currentNonce = pfState?.nonce ?? 0
    const pfResult = selectItemProvablyFair(box.items, currentNonce)
    const selectedItem = pfResult ? pfResult.item : selectRandomItem(box.items)

    if (pfState) {
      setPfState(prev => prev ? { ...prev, nonce: prev.nonce + 1 } : prev)
    }

    setMultiOpenCount(1)
    setMultiWinningItems([])
    finishedCountRef.current = 0
    realWinningItemRef.current = selectedItem
    setWinningItem(selectedItem)
    setIsSpinning(true)
    setShowResult(false)
    setIsFreeWin(true)
  }, [box, isSpinning, pfState, selectItemProvablyFair, selectRandomItem])

  const handleToggleFastMode = useCallback(() => setFastMode(prev => !prev), [])

  const handleWheelFinish = useCallback(() => {
    finishedCountRef.current += 1
    if (finishedCountRef.current >= selectedCount) {
      setIsSpinning(false)
      setShowResult(true)
      window.dispatchEvent(new CustomEvent('inventory-updated'))
    }
  }, [selectedCount])

  const handleSellItem = useCallback(async (item: LootItem) => {
    if (!user || !profile) return
    try {
      await supabase
        .from('user_inventory')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', item.id)
        .order('obtained_at', { ascending: false })
        .limit(1)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ virtual_currency: (profile.virtual_currency || 0) + item.market_value })
        .eq('id', user.id)

      if (updateError) throw updateError
      await refreshProfile()
    } catch {
      showMessage('Erreur lors de la vente', 'error')
    }
  }, [user, profile, supabase, refreshProfile, showMessage])

  const handleNewPfSession = useCallback(() => {
    const session = createProvablyFairSession()
    setPfState({ ...session, history: [] })
    setLastPfData(null)
  }, [])

  // --- RENDERS ---

  if (authLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
        <LoadingState text="Chargement..." />
      </div>
    )
  }

  if (!box) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
        <div className="text-center" style={{ color: isDark ? '#969087' : 'rgba(0,0,0,0.3)' }}>
          <Package className="w-12 h-12 mx-auto mb-4" style={{ color: isDark ? '#969087' : undefined }} />
          <p className="text-sm uppercase tracking-[0.15em] font-medium">Boîte introuvable</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen -mt-[80px] pt-[80px]"
      style={{
        background: isDark
          ? `radial-gradient(ellipse at 50% 0%, rgba(201,168,124,0.03) 0%, ${pageBg} 60%)`
          : pageBg,
        backgroundColor: pageBg,
        ['--wheel-bg' as string]: pageBg
      }}
    >
      {/* Messages d'erreur/succès */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium"
            style={{
              background: 'rgba(239,68,68,0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.2)',
              backdropFilter: 'blur(12px)'
            }}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium"
            style={{
              background: 'rgba(16,185,129,0.15)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.2)',
              backdropFilter: 'blur(12px)'
            }}
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZONE UNIQUE - tout est positionnable librement ici */}
      <div className="relative w-full" style={{ minHeight: '520px' }}>

        {/* ROULETTE - fixée en haut */}
        <div className="absolute left-[10%] right-[10%] rounded-2xl overflow-hidden" style={{ top: '68px', border: '1px solid #4578be40', boxShadow: '0 0 8px #4578be30' }}>
        {(() => {
          const rw = (i: number, h: number) => (
            <LegendaryWheelWrapper
              key={`${spinKey}-${i}`}
              items={box.items}
              winningItem={isSpinning ? (multiWinningItems[i] ?? (i === 0 ? winningItem : null)) : null}
              fastMode={fastMode}
              onFinish={handleWheelFinish}
              isSpinning={isSpinning}
              height={h}
              spinKey={spinKey}
            />
          )
          const sep = <div className="w-full h-px" style={{ background: 'rgba(69,120,190,0.15)' }} />
          if (selectedCount === 1) return rw(0, 280)
          if (selectedCount === 2) return <div className="flex flex-col">{rw(0,150)}{sep}{rw(1,150)}</div>
          if (selectedCount === 3) return (
            <div className="flex flex-col">
              <div className="flex" style={{ borderBottom: '1px solid rgba(69,120,190,0.2)' }}>
                <div className="flex-1 overflow-hidden" style={{ borderRight: '1px solid rgba(69,120,190,0.2)' }}>{rw(0,140)}</div>
                <div className="flex-1 overflow-hidden">{rw(1,140)}</div>
              </div>
              <div className="overflow-hidden">{rw(2,170)}</div>
            </div>
          )
          if (selectedCount === 4) return (
            <div className="flex flex-col">
              <div className="flex" style={{ borderBottom: '1px solid rgba(69,120,190,0.2)' }}>
                <div className="flex-1 overflow-hidden" style={{ borderRight: '1px solid rgba(69,120,190,0.2)' }}>{rw(0,150)}</div>
                <div className="flex-1 overflow-hidden">{rw(1,150)}</div>
              </div>
              <div className="flex">
                <div className="flex-1 overflow-hidden" style={{ borderRight: '1px solid rgba(69,120,190,0.2)' }}>{rw(2,150)}</div>
                <div className="flex-1 overflow-hidden">{rw(3,150)}</div>
              </div>
            </div>
          )
        })()}
        </div>

        {/* IMAGE BOX - positionnée librement, déborde sur la roulette */}
        <img
          src={box.image_url || ''}
          alt={box.name}
          className="absolute object-contain"
          style={{
            width: '176px',
            height: '176px',
            bottom: '-24px',
            left: '238px',
            filter: 'drop-shadow(0 4px 16px rgba(69,120,190,0.5))',
            zIndex: 10
          }}
        />

        {/* NOM - collé à droite de la box, aligné en haut */}
        <div className="absolute" style={{ left: '428px', bottom: '54px' }}>
          <span className="text-2xl font-black" style={{ color: isDark ? '#F5F0E8' : 'rgba(0,0,0,0.9)', letterSpacing: '-0.02em' }}>
            {box.name}
          </span>
          {/* Trait séparateur */}
          <div style={{ width: 'fit-content', marginTop: '6px', marginBottom: '6px' }}>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #4578be, #4578be60)', borderRadius: '99px', width: '80px' }} />
          </div>
          {/* Prix */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black" style={{ color: '#4578be' }}>{box.price_virtual.toLocaleString()}</span>
            <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="coins" className="w-5 h-5" />
          </div>
        </div>

        {/* BARRE DE CONTROLES - fixée en bas */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 flex-wrap px-4">

          {/* Sélecteur */}
          <div className="flex items-center gap-1 rounded-xl px-1" style={{ height: '40px', background: 'rgba(69,120,190,0.08)', border: '1px solid rgba(69,120,190,0.2)' }}>
            {[1, 2, 3, 4].map(n => (
              <motion.button key={n} onClick={() => !isSpinning && setSelectedCount(n)} whileTap={!isSpinning ? { scale: 0.92 } : {}} disabled={isSpinning}
                className="w-9 h-8 rounded-lg text-sm font-bold transition-all"
                style={{ background: selectedCount === n ? '#4578be' : 'transparent', color: selectedCount === n ? 'white' : 'rgba(69,120,190,0.7)', boxShadow: selectedCount === n ? '0 0 12px rgba(69,120,190,0.4)' : 'none' }}
              >{n}</motion.button>
            ))}
          </div>

          {/* Open */}
          <motion.button whileHover={!isSpinning ? { scale: 1.02 } : {}} whileTap={!isSpinning ? { scale: 0.97 } : {}}
            onClick={() => handleMultiOpen()} disabled={isSpinning}
            className="flex items-center gap-2 px-5 rounded-xl text-sm font-bold text-white"
            style={{ height: '40px', background: isSpinning ? 'rgba(69,120,190,0.3)' : 'linear-gradient(135deg, #4578be, #2d5a9e)', boxShadow: isSpinning ? 'none' : '0 0 20px rgba(69,120,190,0.35)', opacity: isSpinning ? 0.6 : 1 }}
          >
            <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="coins" className="w-4 h-4" />
            Open {selectedCount > 1 ? `×${selectedCount}` : ''} · {(box.price_virtual * selectedCount).toLocaleString()}
          </motion.button>

          {/* Essai */}
          <motion.button whileHover={!isSpinning ? { scale: 1.02 } : {}} whileTap={!isSpinning ? { scale: 0.97 } : {}}
            onClick={handleTryFree} disabled={isSpinning}
            className="px-4 rounded-xl text-sm font-semibold"
            style={{ height: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
          >Essai</motion.button>

          {/* Fast mode */}
          <button onClick={handleToggleFastMode} className="flex items-center justify-center rounded-xl"
            style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <img src={fastMode ? 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/avance-rapide%20(1).png' : 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/avance-rapide.png'} alt="Fast mode" className="w-6 h-6 object-contain" />
          </button>

          <ReplayButton onClick={handleReplay} disabled={isSpinning} hasLastOpening={!!lastOpeningItem} />

          {/* PF */}
          <button onClick={() => setShowPfVerifier(true)}>
            <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/bouclier.png" alt="Provably Fair" className="w-8 h-8 object-contain" />
          </button>

        </div>
      </div>

      <GradientSeparator />

      {/* DROPS FEED - démonté pendant le spin pour éviter le spoil */}
      {!isSpinning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full px-4 sm:px-6 lg:px-12 pb-4"
        >
          <DropsFeed boxId={box.id} boxImageUrl={box.image_url} />
        </motion.div>
      )}

      <GradientSeparator />

      {/* CONTENU DE LA BOÎTE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="w-full px-4 sm:px-6 lg:px-12 pb-16"
      >
        <h2
          className="text-xs font-medium uppercase mb-6 sm:mb-8"
          style={{
            letterSpacing: '0.2em',
            color: isDark ? '#6D675F' : 'rgba(0, 0, 0, 0.25)'
          }}
        >
          Contenu de la boîte
        </h2>

        <LootList items={box.items} onItemClick={handleItemPreview} />
      </motion.div>

      {/* MODALS - Provably Fair uniquement */}

      <ProvablyFairModal
        isOpen={showPfVerifier}
        onClose={() => setShowPfVerifier(false)}
        data={lastPfData || undefined}
      />
    </div>
  )
}