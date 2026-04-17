'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Play, Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Wheel } from '@/app/components/Wheel/WheelNew'
import type { FreedropItem } from '@/lib/services/freedrop'
import Link from 'next/link'

const rarityColors: Record<string, string> = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b',
}

interface BoxInfo {
  id: string
  name: string
  image_url: string | null
  price_virtual: number
}

interface WonItem {
  id: string
  name: string
  rarity: string
  market_value: number
  image_url: string | null
}

export default function BoxReplayPage() {
  const params = useParams()
  const router = useRouter()
  // inventoryId can be a single UUID or comma-separated UUIDs for multi-open
  const inventoryIdParam = params.inventoryId as string
  const inventoryIds = inventoryIdParam ? inventoryIdParam.split(',').map(s => s.trim()).filter(Boolean) : []
  const isMulti = inventoryIds.length > 1
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [boxItems, setBoxItems] = useState<FreedropItem[]>([])
  const [winningItems, setWinningItems] = useState<WonItem[]>([])
  const [boxInfo, setBoxInfo] = useState<BoxInfo | null>(null)
  const [openDate, setOpenDate] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  // Track which wheels have finished (multi-open)
  const finishedRef = useRef(0)
  const [allFinished, setAllFinished] = useState(false)

  useEffect(() => {
    if (!inventoryIds.length) return
    const load = async () => {
      setLoading(true)

      // Fetch all inventory entries
      const { data: invItems } = await supabase
        .from('user_inventory')
        .select('id, obtained_at, box_id, items(id, name, rarity, market_value, image_url), loot_boxes:box_id(id, name, price_virtual, image_url)')
        .in('id', inventoryIds)
        .order('obtained_at', { ascending: true })

      if (!invItems || invItems.length === 0) { setLoading(false); return }

      const firstEntry = invItems[0] as any
      const box = firstEntry.loot_boxes as BoxInfo | null
      setBoxInfo(box)
      setOpenDate(
        new Date(firstEntry.obtained_at).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      )

      const won = invItems
        .filter((inv: any) => inv.items)
        .map((inv: any) => ({
          id: inv.items.id,
          name: inv.items.name,
          rarity: inv.items.rarity || 'common',
          market_value: inv.items.market_value || 0,
          image_url: inv.items.image_url,
        }))
      setWinningItems(won)

      // Fetch box pool for wheel
      if (firstEntry.box_id) {
        const { data: lbItems } = await supabase
          .from('loot_box_items')
          .select('probability, items(id, name, rarity, market_value, image_url)')
          .eq('loot_box_id', firstEntry.box_id)

        const converted: FreedropItem[] = (lbItems || [])
          .filter((r: any) => r.items)
          .map((r: any) => ({
            id: r.items.id,
            name: r.items.name,
            image_url: r.items.image_url || '',
            market_value: r.items.market_value || 0,
            rarity: r.items.rarity || 'common',
            probability: r.probability || 1,
          }))
        setBoxItems(converted)
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryIdParam])

  const startReplay = useCallback(() => {
    finishedRef.current = 0
    setAllFinished(false)
    setHasPlayed(true)
    setIsSpinning(true)
  }, [])

  // Auto-start après chargement
  useEffect(() => {
    if (!loading && winningItems.length > 0 && boxItems.length > 0 && !hasPlayed) {
      const t = setTimeout(startReplay, 900)
      return () => clearTimeout(t)
    }
  }, [loading, winningItems.length, boxItems.length, hasPlayed, startReplay])

  const handleWheelFinish = useCallback(() => {
    finishedRef.current += 1
    if (finishedRef.current >= winningItems.length) {
      setIsSpinning(false)
      setAllFinished(true)
    }
  }, [winningItems.length])

  const resetReplay = () => {
    setIsSpinning(false)
    setAllFinished(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1220' }}>
        <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!winningItems.length || !boxItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1220' }}>
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Ouverture introuvable</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-[#3b82f6] hover:underline">Retour</button>
        </div>
      </div>
    )
  }

  const primaryWinner = winningItems[0]
  const primaryColor = rarityColors[primaryWinner?.rarity?.toLowerCase() || 'common'] || rarityColors.common

  return (
    <div className="min-h-screen -mt-[80px] pt-[80px]" style={{ background: '#0C1220' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-10"
      >
        <div className="flex items-start gap-5 sm:gap-8">

          {/* Box image */}
          <div className="relative shrink-0">
            {boxInfo?.image_url && (
              <>
                <div
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ backgroundColor: primaryColor, opacity: 0.15, transform: 'scale(1.5)' }}
                />
                <motion.img
                  src={boxInfo.image_url}
                  alt={boxInfo.name}
                  className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 8px 24px rgba(59,130,246,0.25))' }}
                />
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => router.back()}
                    className="text-gray-600 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    {isMulti ? `Replay x${winningItems.length}` : 'Replay'}
                  </span>
                  <span className="text-xs text-gray-600 hidden sm:inline">{openDate}</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 truncate">
                  {boxInfo?.name || 'Box'}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-gray-600">
                    {boxItems.length} items dans la box
                  </span>
                  {boxInfo && (
                    <Link
                      href={`/boxes/${boxInfo.id}`}
                      className="text-[10px] sm:text-xs text-gray-600 hover:text-[#3b82f6] transition-colors"
                    >
                      Voir la box →
                    </Link>
                  )}
                </div>
              </div>

              {boxInfo?.price_virtual && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-lg sm:text-xl lg:text-2xl font-black text-white">
                    {boxInfo.price_virtual.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-600">coins</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* WHEEL(S) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative w-full mt-2 sm:mt-4"
      >
        {isMulti ? (
          <div className="flex flex-col gap-1">
            {winningItems.map((won, index) => {
              const asFD: FreedropItem = {
                id: won.id,
                name: won.name,
                image_url: won.image_url || '',
                market_value: won.market_value,
                rarity: won.rarity,
                probability: 1,
              }
              const wheelHeight = winningItems.length <= 2 ? 180 : 120
              return (
                <div key={`wheel-${index}`} className="relative">
                  <div
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 text-[9px] font-bold uppercase"
                    style={{ letterSpacing: '0.15em', color: 'rgba(255,255,255,0.08)' }}
                  >
                    #{index + 1}
                  </div>
                  <Wheel
                    items={boxItems}
                    winningItem={asFD}
                    fastMode={false}
                    onFinish={handleWheelFinish}
                    isSpinning={isSpinning}
                    height={wheelHeight}
                  />
                  {index < winningItems.length - 1 && (
                    <div
                      className="w-full h-px"
                      style={{ background: 'linear-gradient(90deg, transparent 15%, rgba(255,255,255,0.04) 50%, transparent 85%)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <Wheel
            items={boxItems}
            winningItem={{
              id: primaryWinner.id,
              name: primaryWinner.name,
              image_url: primaryWinner.image_url || '',
              market_value: primaryWinner.market_value,
              rarity: primaryWinner.rarity,
              probability: 1,
            }}
            fastMode={false}
            onFinish={handleWheelFinish}
            isSpinning={isSpinning}
            height={280}
          />
        )}
      </motion.div>

      {/* CONTROLS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full flex items-center justify-center gap-3 py-4 px-4"
      >
        {!isSpinning && !hasPlayed && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={startReplay}
            className="flex items-center gap-2.5 px-8 py-3 rounded-xl font-semibold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            }}
          >
            <Play className="w-4 h-4" />
            Rejouer l&apos;ouverture{isMulti ? ` x${winningItems.length}` : ''}
          </motion.button>
        )}
        {!isSpinning && hasPlayed && (
          <button
            onClick={() => { resetReplay(); setTimeout(startReplay, 50) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <RotateCcw className="w-4 h-4" />
            Rejouer
          </button>
        )}
      </motion.div>

      {/* WINNER REVEAL(S) */}
      <AnimatePresence>
        {allFinished && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="pb-16 px-4"
          >
            {isMulti ? (
              /* Multi-open result grid */
              <div className="max-w-2xl mx-auto">
                <p className="text-xs text-gray-600 uppercase tracking-widest text-center mb-6">
                  {winningItems.length} objets obtenus
                </p>
                <div className={`grid gap-3 ${winningItems.length <= 2 ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-5'}`}>
                  {winningItems.map((won, idx) => {
                    const c = rarityColors[won.rarity?.toLowerCase() || 'common'] || rarityColors.common
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex flex-col items-center p-3 rounded-xl"
                        style={{ background: `${c}0d`, border: `1px solid ${c}20` }}
                      >
                        {won.image_url && (
                          <img src={won.image_url} alt={won.name} className="w-14 h-14 object-contain mb-2" />
                        )}
                        <p className="text-[10px] font-semibold text-white text-center truncate w-full">{won.name}</p>
                        <p className="text-[10px] font-bold mt-1" style={{ color: c }}>
                          {(won.market_value || 0).toFixed(2)}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
                <p className="text-center text-sm font-black text-white mt-6">
                  Total:{' '}
                  <span style={{ color: primaryColor }}>
                    {winningItems.reduce((s, i) => s + (i.market_value || 0), 0).toFixed(2)} coins
                  </span>
                </p>
              </div>
            ) : (
              /* Single item result */
              <div
                className="max-w-sm mx-auto rounded-2xl p-8 text-center"
                style={{
                  background: `${primaryColor}08`,
                  border: `1px solid ${primaryColor}30`,
                  boxShadow: `0 8px 32px ${primaryColor}20`,
                }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">Objet obtenu</p>
                <div
                  className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${primaryColor}25` }}
                >
                  {primaryWinner.image_url ? (
                    <img src={primaryWinner.image_url} alt={primaryWinner.name} className="max-w-full max-h-full object-contain p-3" />
                  ) : (
                    <Package className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{primaryWinner.name}</h2>
                <p className="text-sm font-semibold capitalize mb-4" style={{ color: primaryColor }}>
                  {primaryWinner.rarity}
                </p>
                <p className="text-3xl font-black" style={{ color: primaryColor }}>
                  {(primaryWinner.market_value || 0).toFixed(2)}
                  <span className="text-lg font-medium text-gray-500 ml-2">coins</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
