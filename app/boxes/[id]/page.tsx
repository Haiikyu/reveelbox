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
      {/* Animation intermédiaire légendaire — entre roulette 1 et roulette 2 */}
      <AnimatePresence>
        {phase === 'flash' && (() => {
          // Valeurs fixes pour éviter Math.random() dans le rendu
          const RAYS = [
            { left: 8,  w: 3,  angle: -8, delay: 0.20 },
            { left: 18, w: 9,  angle: -5, delay: 0.10 },
            { left: 27, w: 4,  angle: -3, delay: 0.35 },
            { left: 36, w: 13, angle: -1, delay: 0.05 },
            { left: 45, w: 5,  angle:  1, delay: 0.25 },
            { left: 54, w: 10, angle:  3, delay: 0.15 },
            { left: 63, w: 4,  angle:  5, delay: 0.30 },
            { left: 72, w: 8,  angle:  7, delay: 0.08 },
            { left: 81, w: 3,  angle:  9, delay: 0.40 },
            { left: 90, w: 7,  angle: 11, delay: 0.18 },
          ]
          const PARTICLES = [
            { x: 12, bot: 14, s: 3, d: 0.30, dur: 2.0, rise: 110 },
            { x: 23, bot: 10, s: 2, d: 0.55, dur: 1.7, rise: 90  },
            { x: 35, bot: 18, s: 3, d: 0.20, dur: 2.2, rise: 130 },
            { x: 48, bot: 12, s: 4, d: 0.40, dur: 1.9, rise: 105 },
            { x: 60, bot: 16, s: 2, d: 0.65, dur: 1.6, rise: 85  },
            { x: 71, bot: 10, s: 3, d: 0.35, dur: 2.1, rise: 120 },
            { x: 83, bot: 14, s: 2, d: 0.50, dur: 1.8, rise: 95  },
            { x: 20, bot: 22, s: 2, d: 0.70, dur: 1.5, rise: 80  },
            { x: 55, bot: 20, s: 3, d: 0.45, dur: 2.0, rise: 115 },
            { x: 78, bot: 18, s: 2, d: 0.60, dur: 1.7, rise: 100 },
          ]
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden z-50"
              style={{ background: 'rgba(0,0,0,0.96)' }}
            >
              {/* Gradient ambiant doré persistant */}
              <motion.div className="absolute inset-0"
                initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                transition={{ duration: 1.2 }}
                style={{ background: 'radial-gradient(ellipse at 50% 65%, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.04) 50%, transparent 70%)' }}
              />

              {/* Rayons d'or du bas vers le haut */}
              {RAYS.map((r, i) => (
                <motion.div key={i}
                  style={{
                    position: 'absolute', bottom: '-2%', left: `${r.left}%`,
                    width: `${r.w}px`, height: '115%',
                    background: 'linear-gradient(to top, transparent 0%, rgba(245,158,11,0.55) 25%, rgba(255,210,0,0.3) 60%, transparent 100%)',
                    transformOrigin: 'bottom center',
                    rotate: `${r.angle}deg`,
                    borderRadius: '40%',
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: [0, 1, 1, 0.6], opacity: [0, 1, 0.8, 0] }}
                  transition={{ duration: 2.1, delay: r.delay, ease: [0.15, 0, 0.75, 1] }}
                />
              ))}

              {/* Flash burst central */}
              <motion.div className="absolute inset-0"
                initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.45, times: [0, 0.08, 1] }}
                style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.65) 0%, rgba(245,158,11,0.25) 35%, transparent 60%)' }}
              />

              {/* Anneau qui s'expanse */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: '220%', height: '650%', opacity: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut', delay: 0.08 }}
                style={{ border: '2px solid rgba(245,158,11,0.9)', boxShadow: '0 0 40px #f59e0b80' }}
              />

              {/* Particules dorées montantes */}
              {PARTICLES.map((p, i) => (
                <motion.div key={i}
                  style={{
                    position: 'absolute', bottom: `${p.bot}%`, left: `${p.x}%`,
                    width: `${p.s}px`, height: `${p.s}px`, borderRadius: '50%',
                    background: '#f59e0b', boxShadow: `0 0 ${p.s * 2}px #f59e0b`,
                  }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -p.rise, opacity: [0, 1, 0] }}
                  transition={{ duration: p.dur, delay: p.d, ease: 'easeOut' }}
                />
              ))}

              {/* Contenu central */}
              <motion.div className="relative text-center z-10"
                animate={{ x: [0, -5, 5, -3, 3, 0] }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                {/* Halo derrière le coin */}
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: '280px', height: '280px', top: '50%', left: '50%', transform: 'translate(-50%, -55%)', background: 'radial-gradient(ellipse, rgba(245,158,11,0.28) 0%, transparent 68%)' }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.28, duration: 0.8 }}
                />

                {/* Coin légendaire — 2× plus grand */}
                <motion.img
                  src={LEGENDARY_LOGO_URL} alt="Legendary"
                  className="object-contain mx-auto"
                  style={{
                    width: '144px', height: '144px',  // était 64px
                    filter: 'drop-shadow(0 0 28px #f59e0b) drop-shadow(0 0 55px rgba(245,158,11,0.5))',
                    marginBottom: '16px',
                  }}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.28, type: 'spring', stiffness: 180, damping: 14 }}
                />

                {/* LEGENDARY */}
                <motion.h2
                  initial={{ scale: 0.2, opacity: 0, y: 18 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 180 }}
                  style={{
                    color: '#f59e0b',
                    textShadow: '0 0 18px #f59e0b, 0 0 40px #f59e0b, 0 0 80px rgba(245,158,11,0.4)',
                    letterSpacing: '0.28em',
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >LEGENDARY</motion.h2>

                {/* Ligne décorative sous le texte */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 0.65 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                  style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)', margin: '10px auto 0', width: '220px' }}
                />
              </motion.div>
            </motion.div>
          )
        })()}
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

// ── Reveal inline après la roulette (single open) ──────────────────────────
function SingleWinReveal({
  item,
  onOpenAgain,
  isDark,
  profile,
}: {
  item: LootItem
  onOpenAgain: () => void
  isDark: boolean
  profile?: Record<string, any> | null
}) {
  const router = useRouter()
  const glow = rarityColors[item.rarity?.toLowerCase()] || rarityColors.common
  const COIN_LOGO = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png'
  const innerBg = isDark ? 'rgba(6,9,18,0.97)' : 'rgba(248,248,252,0.97)'
  const rarityLabel = item.rarity ? item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1) : 'Common'
  const dropPct = Math.min(item.probability, 100)

  // ── Niveau — champs enrichis par AuthProvider (lib/xp-system.ts) ─────────
  const level = profile?.level ?? 1
  const currentLevelExp = profile?.current_level_exp ?? 0
  const expToNext = profile?.exp_to_next ?? 100
  const barPct = profile?.progress_percentage ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      style={{
        position: 'absolute',
        left: '10%', right: '10%',
        top: '68px', height: '280px',
        borderRadius: '20px',
        zIndex: 30,
      }}
    >
      {/* ── BORDER STATIQUE 30% ── */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '20px',
        border: `1px solid ${glow}4d`, zIndex: 0, pointerEvents: 'none',
      }} />

      {/* ── SNAKE BORDER ── */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', overflow: 'hidden', zIndex: 1 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%',
            background: `conic-gradient(from 0deg,
              ${glow}00 0%, ${glow}00 74%, ${glow}30 78%,
              ${glow}99 84%, ${glow}ff 89%, ${glow}ff 92%,
              ${glow}66 95%, ${glow}00 98%, ${glow}00 100%)`,
          }}
        />
        <div style={{ position: 'absolute', inset: '2px', borderRadius: '18px', background: innerBg }} />
      </div>

      {/* ── 3 COUCHES DE LUMIÈRE GLASSMORPHISM ── */}
      <div style={{ position: 'absolute', inset: '2px', borderRadius: '18px', overflow: 'hidden', zIndex: 2, pointerEvents: 'none' }}>
        {/* Background glow — ambiance rarity */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 28% 55%, ${glow}1a 0%, transparent 58%)`,
        }} />
        {/* Middle glow — profondeur */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 72% 80%, ${glow}0e 0%, transparent 52%)`,
        }} />
        {/* Front glow — reflet verre haut */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
        }} />
      </div>

      {/* ── PARTICULES ── */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${7 + i * 10}%`,
            bottom: `${10 + (i % 3) * 8}px`,
            width: i % 3 === 0 ? '4px' : i % 3 === 1 ? '3px' : '2px',
            height: i % 3 === 0 ? '4px' : i % 3 === 1 ? '3px' : '2px',
            borderRadius: '50%',
            background: glow,
            boxShadow: `0 0 6px ${glow}, 0 0 12px ${glow}80`,
            zIndex: 3, pointerEvents: 'none',
          }}
          animate={{ y: [0, -(50 + i * 18), -(105 + i * 14)], opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.2 + i * 0.32, delay: i * 0.38, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}

      {/* ── CONTENU ── */}
      <div style={{
        position: 'absolute', inset: '2px',
        display: 'flex', borderRadius: '18px', overflow: 'hidden', zIndex: 4,
      }}>

        {/* ── LEFT — Item Showcase ── */}
        <div style={{
          width: '48%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', gap: '6px',
        }}>
          {/* Halo pulsant derrière l'image */}
          <motion.div
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.88, 1.08, 0.88] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '200px', height: '200px', borderRadius: '50%',
              background: `radial-gradient(circle, ${glow}22 0%, ${glow}08 55%, transparent 75%)`,
              filter: 'blur(14px)', pointerEvents: 'none',
            }}
          />

          {/* Image — star absolue, perspective 3D */}
          <motion.div
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ perspective: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.img
              src={item.image_url}
              alt={item.name}
              style={{
                maxWidth: '205px', maxHeight: '195px',
                objectFit: 'contain',
                filter: `drop-shadow(0 14px 38px ${glow}70)`,
                display: 'block',
              }}
              initial={{ scale: 0.22, opacity: 0, rotateY: -25 }}
              animate={{
                scale: 1, opacity: 1,
                rotateY: [0, 5, 0, -5, 0],
                rotate: [0, 1.2, 0, -1.2, 0],
              }}
              transition={{
                scale: { type: 'spring', stiffness: 190, damping: 16, delay: 0.08 },
                opacity: { duration: 0.2, delay: 0.08 },
                rotateY: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                rotate: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
              }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </motion.div>

          {/* Ombre au sol */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            style={{
              width: '150px', height: '18px',
              background: `radial-gradient(ellipse, ${glow}52 0%, transparent 72%)`,
              filter: 'blur(8px)', flexShrink: 0,
            }}
          />
        </div>

        {/* ── SEPARATEUR ── */}
        <div style={{
          width: '1px',
          background: `linear-gradient(180deg, transparent, ${glow}30 30%, ${glow}30 70%, transparent)`,
          margin: '20px 0',
        }} />

        {/* ── RIGHT — Luxury Information Card ── */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px',
          padding: '16px 20px',
        }}>

          {/* TOP ROW : Rarity + XP niveau (haut-droite) */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14, type: 'spring', stiffness: 300, damping: 24 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
          >
            {/* Rarity badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '999px',
              background: `${glow}18`, border: `1px solid ${glow}42`,
              backdropFilter: 'blur(8px)', flexShrink: 0,
            }}>
              <motion.div
                animate={{ boxShadow: [`0 0 4px ${glow}`, `0 0 14px ${glow}`, `0 0 4px ${glow}`] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: '7px', height: '7px', borderRadius: '50%', background: glow }}
              />
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: glow }}>
                {rarityLabel}
              </span>
            </div>

            {/* XP / Niveau */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em', color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}>
                  Niveau {level}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)' }}>
                  {currentLevelExp} / {currentLevelExp + expToNext} XP
                </span>
              </div>
              <div style={{ height: '3px', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                  style={{
                    height: '100%', borderRadius: '99px',
                    background: `linear-gradient(90deg, ${glow}88, ${glow})`,
                    boxShadow: `0 0 6px ${glow}`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Nom de l'item */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.21, type: 'spring', stiffness: 280, damping: 24 }}
            style={{
              fontSize: '13.5px', fontWeight: 700, lineHeight: 1.3,
              color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}
          >
            {item.name}
          </motion.div>

          {/* VALUE — hero number animé */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28, type: 'spring', stiffness: 280, damping: 24 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1, color: glow, letterSpacing: '-0.02em' }}>
              <CountUp target={item.market_value} duration={1500} />
            </span>
            <img src={COIN_LOGO} alt="coins" style={{ width: '26px', height: '26px', flexShrink: 0 }} />
          </motion.div>

          {/* Drop Chance — barre visuelle */}
          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.34 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)' }}>
                Drop Chance
              </span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: glow }}>
                {item.probability.toFixed(2)}%
              </span>
            </div>
            <div style={{ height: '3px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(dropPct, 1.5)}%` }}
                transition={{ delay: 0.52, duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  height: '100%', borderRadius: '99px',
                  background: `linear-gradient(90deg, ${glow}88, ${glow})`,
                  boxShadow: `0 0 8px ${glow}`,
                }}
              />
            </div>
          </motion.div>

          {/* ── BOUTONS PREMIUM ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, type: 'spring', stiffness: 300, damping: 26 }}
            style={{ display: 'flex', gap: '6px', marginTop: '2px' }}
          >
            {/* Open Again — dominant, plus large */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(69,120,190,0.62)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onOpenAgain()}
              style={{
                flex: 1.5, padding: '9px 0', borderRadius: '11px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 800, color: 'white', letterSpacing: '0.02em',
                background: 'linear-gradient(135deg, #5489cc 0%, #3465a8 100%)',
                boxShadow: '0 0 20px rgba(69,120,190,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              Open Again
            </motion.button>

            {/* Upgrade — énergétique */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(139,92,246,0.58)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => router.push('/upgrade')}
              style={{
                flex: 1, padding: '9px 0', borderRadius: '11px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 800, color: 'white',
                background: 'linear-gradient(135deg, #9366f6 0%, #6d28d9 100%)',
                boxShadow: '0 0 16px rgba(139,92,246,0.32), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              Upgrade
            </motion.button>

            {/* Inventory — sobre premium */}
            <motion.button
              whileHover={{ scale: 1.05, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => router.push('/inventory')}
              style={{
                flex: 1, padding: '9px 0', borderRadius: '11px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700,
                color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.58)',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              }}
            >
              Inventory
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ── CountUp animé ────────────────────────────────────────────────────────────
function CountUp({ target, decimals = 0, duration = 2000, suffix = '' }: {
  target: number
  decimals?: number
  duration?: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    startTime.current = null
    const animate = (now: number) => {
      if (!startTime.current) startTime.current = now
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, decimals, duration])

  return <>{display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
}

// ── Tiers de rareté ──────────────────────────────────────────────────────────
const RARITY_TIERS = [
  { key: 'legendary', label: 'MYTHIC',    cardMin: 210, imgSize: 115 },
  { key: 'epic',      label: 'LEGENDARY', cardMin: 178, imgSize: 95  },
  { key: 'rare',      label: 'EPIC',      cardMin: 155, imgSize: 80  },
  { key: 'uncommon',  label: 'RARE',      cardMin: 140, imgSize: 68  },
  { key: 'common',    label: 'COMMON',    cardMin: 128, imgSize: 60  },
] as const

// ── Carte de luxe individuelle ────────────────────────────────────────────────
function LuxuryCard({ item, imgSize, isDark, onItemClick, delay }: {
  item: LootItem; imgSize: number; isDark: boolean
  onItemClick: (item: LootItem) => void; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const [shimmerKey, setShimmerKey] = useState(-1)
  const glow = rarityColors[item.rarity?.toLowerCase()] || rarityColors.common
  const COIN_LOGO = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png'
  const pct = item.probability < 1 ? item.probability * 100 : item.probability

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, scale: 1.03 }}
      onHoverStart={() => { setHovered(true); setShimmerKey(k => k + 1) }}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onItemClick(item)}
      style={{
        cursor: 'pointer', borderRadius: '18px',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(158deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.018) 100%)'
          : 'linear-gradient(158deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.62) 100%)',
        border: `1px solid ${hovered ? glow + '65' : glow + '28'}`,
        backdropFilter: 'blur(18px)',
        boxShadow: hovered
          ? `0 0 0 1px ${glow}22, 0 20px 50px ${glow}30, 0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)`
          : `0 0 0 1px ${glow}08, 0 4px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      {/* Barre rarity en haut */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, transparent 5%, ${glow} 40%, ${glow} 60%, transparent 95%)`,
        boxShadow: hovered ? `0 0 18px ${glow}` : `0 0 8px ${glow}88`,
        transition: 'box-shadow 0.25s ease',
      }} />

      {/* Shimmer holographique au hover */}
      <AnimatePresence>
        {shimmerKey >= 0 && (
          <motion.div
            key={shimmerKey}
            initial={{ x: '-130%', opacity: 1 }}
            animate={{ x: '300%', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '38%',
              background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.05) 65%, transparent 82%)',
              pointerEvents: 'none', zIndex: 10,
              transform: 'skewX(-14deg)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Ambient glow intérieur */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 15%, ${glow}${hovered ? '20' : '0d'} 0%, transparent 68%)`,
        transition: 'background 0.3s ease',
      }} />

      {/* Zone image */}
      <div style={{
        padding: '18px 14px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: `${imgSize + 38}px`, position: 'relative',
      }}>
        <motion.img
          src={item.image_url} alt={item.name}
          animate={{ scale: hovered ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{
            maxWidth: `${imgSize}px`, maxHeight: `${imgSize}px`, objectFit: 'contain',
            filter: `drop-shadow(0 6px ${hovered ? 22 : 12}px ${glow}${hovered ? '75' : '50'})`,
            position: 'relative', zIndex: 1,
          }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {/* Ombre au sol */}
        <div style={{
          position: 'absolute', bottom: '8px', left: '50%',
          transform: `translateX(-50%) scaleX(${hovered ? 1.35 : 1})`,
          width: `${imgSize * 0.65}px`, height: '10px',
          background: `radial-gradient(ellipse, ${glow}${hovered ? '52' : '32'} 0%, transparent 75%)`,
          filter: 'blur(5px)', transition: 'transform 0.3s ease, background 0.3s ease',
        }} />
      </div>

      {/* Zone info */}
      <div style={{
        padding: '10px 14px 14px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderTop: `1px solid ${glow}${hovered ? '28' : '15'}`,
        background: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.04)',
        flex: 1, transition: 'border-color 0.25s ease', gap: '8px',
      }}>
        <span style={{
          fontSize: '11.5px', fontWeight: 700, lineHeight: 1.35, textAlign: 'center',
          color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: glow }}>
              <CountUp target={item.market_value} duration={1800} />
            </span>
            <img src={COIN_LOGO} alt="" style={{ width: '14px', height: '14px' }} />
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: glow, opacity: 0.72 }}>
            <CountUp target={item.probability} decimals={2} duration={2000} suffix="%" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Luxury Showcase ───────────────────────────────────────────────────────────
function LuxuryShowcase({ items, onItemClick, isDark }: {
  items: LootItem[]; onItemClick: (item: LootItem) => void; isDark: boolean
}) {
  let cumDelay = 0
  const tiers = RARITY_TIERS.map(tier => {
    const tierItems = items.filter(i => i.rarity?.toLowerCase() === tier.key)
    const startDelay = cumDelay
    cumDelay += tierItems.length * 0.045
    return { ...tier, tierItems, startDelay }
  }).filter(t => t.tierItems.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '44px' }}>
      {tiers.map(({ key, label, cardMin, imgSize, tierItems, startDelay }) => {
        const glow = rarityColors[key] || rarityColors.common
        return (
          <div key={key}>
            {/* Séparateur de tier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${glow}45)` }} />
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '9px',
                padding: '6px 18px', borderRadius: '999px',
                background: `${glow}14`, border: `1px solid ${glow}38`,
              }}>
                <motion.div
                  animate={{ boxShadow: [`0 0 4px ${glow}`, `0 0 16px ${glow}`, `0 0 4px ${glow}`] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: '7px', height: '7px', borderRadius: '50%', background: glow }}
                />
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: glow }}>
                  {label}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)' }}>
                  {tierItems.length} item{tierItems.length > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${glow}45, transparent)` }} />
            </div>

            {/* Grille adaptive */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${cardMin}px, 1fr))`,
              gap: '14px',
            }}>
              {tierItems.map((item, i) => (
                <LuxuryCard
                  key={item.id} item={item} imgSize={imgSize}
                  isDark={isDark} onItemClick={onItemClick}
                  delay={startDelay + i * 0.045}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
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
      <div className="relative w-full" style={{ minHeight: '370px' }}>

        {/* ROULETTE - fixée en haut */}
        <div
          className="absolute left-[10%] right-[10%]"
          style={{
            top: '68px',
            ...(selectedCount === 1 ? {
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #4578be40',
              boxShadow: '0 0 8px #4578be30',
            } : {})
          }}
        >
        {(() => {
          const rw = (i: number) => (
            <LegendaryWheelWrapper
              key={`${spinKey}-${i}`}
              items={box.items}
              winningItem={isSpinning ? (multiWinningItems[i] ?? (i === 0 ? winningItem : null)) : null}
              fastMode={fastMode}
              onFinish={handleWheelFinish}
              isSpinning={isSpinning}
              height={280}
              spinKey={spinKey}
            />
          )
          const cell = (i: number) => (
            <div key={i} className="flex-1 overflow-hidden" style={{
              borderRadius: '16px',
              border: '1px solid #4578be40',
              boxShadow: '0 0 8px #4578be30',
            }}>
              {rw(i)}
            </div>
          )
          if (selectedCount === 1) return rw(0)
          if (selectedCount === 2) return (
            <div className="flex" style={{ height: '280px', gap: '12px' }}>
              {cell(0)}{cell(1)}
            </div>
          )
          if (selectedCount === 3) return (
            <div className="flex" style={{ height: '280px', gap: '12px' }}>
              {cell(0)}{cell(1)}{cell(2)}
            </div>
          )
          if (selectedCount === 4) return (
            <div className="flex" style={{ height: '280px', gap: '12px' }}>
              {cell(0)}{cell(1)}{cell(2)}{cell(3)}
            </div>
          )
        })()}
        </div>

        {/* SINGLE WIN REVEAL */}
        <AnimatePresence>
          {showResult && selectedCount === 1 && winningItem && (
            <SingleWinReveal
              item={winningItem}
              onOpenAgain={handleMultiOpen}
              isDark={isDark}
              profile={profile}
            />
          )}
        </AnimatePresence>

        {/* SHOWCASE MOVED BELOW ZONE DIV */}
      </div>

      {/* ── FLOATING PRODUCT ELEMENTS — aucun container, aucun fond ── */}
      <div className="w-full" style={{ padding: '14px 10% 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '56px' }}>

          {/* CAISSE — point focal, flottante dans l'espace */}
          <div style={{ position: 'relative', flexShrink: 0, width: '152px' }}>
            {/* Halo volumétrique — fond de page, pas un conteneur */}
            <motion.div
              animate={{ opacity: [0.15, 0.42, 0.15], scale: [0.75, 1.12, 0.75] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: '-44px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(69,120,190,0.22) 0%, transparent 68%)',
                filter: 'blur(28px)', pointerEvents: 'none',
              }}
            />
            {/* Reflet au sol */}
            <div style={{
              position: 'absolute', bottom: '-16px', left: '50%', transform: 'translateX(-50%)',
              width: '100px', height: '16px',
              background: 'radial-gradient(ellipse, rgba(69,120,190,0.28) 0%, transparent 72%)',
              filter: 'blur(8px)', pointerEvents: 'none',
            }} />
            <motion.img
              src={box.image_url || ''} alt={box.name}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '152px', height: '152px', objectFit: 'contain',
                position: 'relative', zIndex: 1,
                filter: 'drop-shadow(0 20px 40px rgba(69,120,190,0.48))',
              }}
            />
          </div>

          {/* COLONNE 2 — Texte produit : Mystery Case / Nom / Prix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flexShrink: 0 }}>
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              marginBottom: '8px', display: 'block',
            }}>
              Mystery Case
            </span>
            <span style={{
              fontSize: '28px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em',
              color: isDark ? '#EDE8E0' : 'rgba(0,0,0,0.92)',
              marginBottom: '12px', display: 'block',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px',
            }}>
              {box.name}
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="" style={{ width: '14px', height: '14px', opacity: 0.7 }} />
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#4578be', letterSpacing: '-0.01em' }}>
                {box.price_virtual.toLocaleString()}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)', marginLeft: '2px' }}>
                per open
              </span>
            </div>
          </div>

          {/* COLONNE 3 — Contrôles : Qty / Open / Secondary */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
                marginRight: '6px',
              }}>
                Qty
              </span>
              {[1, 2, 3, 4].map(n => (
                <motion.button
                  key={n}
                  onClick={() => !isSpinning && setSelectedCount(n)}
                  disabled={isSpinning}
                  whileTap={!isSpinning ? { scale: 0.88 } : {}}
                  style={{
                    width: '34px', height: '34px', borderRadius: '9px',
                    fontSize: '14px', fontWeight: 800, border: 'none',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    background: selectedCount === n
                      ? isDark ? 'rgba(69,120,190,0.18)' : 'rgba(69,120,190,0.1)'
                      : 'transparent',
                    color: selectedCount === n
                      ? '#4d8fd4'
                      : isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                >
                  {n}
                </motion.button>
              ))}
            </div>

            {/* OPEN CASE — CTA premium, physique */}
            <div style={{ display: 'flex', gap: '2px', maxWidth: '360px', marginBottom: '14px' }}>
              <motion.button
                whileHover={!isSpinning ? {
                  y: -2,
                  boxShadow: '0 0 44px rgba(69,120,190,0.55), 0 5px 0 rgba(16,38,90,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
                } : {}}
                whileTap={!isSpinning ? {
                  y: 3,
                  boxShadow: '0 0 18px rgba(69,120,190,0.25), 0 1px 0 rgba(16,38,90,0.5)',
                } : {}}
                onClick={() => handleMultiOpen()}
                disabled={isSpinning}
                style={{
                  flex: 1, height: '52px', borderRadius: '13px 4px 4px 13px', border: 'none',
                  cursor: isSpinning ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                  fontSize: '14px', fontWeight: 800, color: 'white', letterSpacing: '0.01em',
                  background: isSpinning
                    ? 'rgba(69,120,190,0.14)'
                    : 'linear-gradient(160deg, #5e97db 0%, #3d70be 45%, #2d5aa0 100%)',
                  boxShadow: isSpinning
                    ? 'none'
                    : '0 0 26px rgba(69,120,190,0.42), 0 3px 0 rgba(16,38,90,0.52), inset 0 1px 0 rgba(255,255,255,0.2)',
                  opacity: isSpinning ? 0.32 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="" style={{ width: '16px', height: '16px', opacity: 0.85 }} />
                Open Case · {(box.price_virtual * selectedCount).toLocaleString()}
              </motion.button>

              {/* Fast — option discrète greffée au CTA */}
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ y: 3 }}
                onClick={handleToggleFastMode}
                style={{
                  width: '50px', height: '52px', borderRadius: '4px 13px 13px 4px', border: 'none',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: fastMode ? 'rgba(139,92,246,0.18)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderLeft: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                  boxShadow: fastMode ? '0 0 18px rgba(139,92,246,0.35), 0 0 6px rgba(103,183,255,0.25), 0 3px 0 rgba(70,45,0,0.3)' : '0 3px 0 rgba(0,0,0,0.12)',
                  outline: fastMode ? '1px solid rgba(139,92,246,0.3)' : 'none',
                }}
              >
                <img
                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/tonnerre.png"
                  alt="Fast"
                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                />
              </motion.button>
            </div>

            {/* Actions secondaires — texte pur, quasi-invisible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <motion.button
                onClick={handleTryFree} disabled={isSpinning}
                whileHover={!isSpinning ? { opacity: 1 } : {}}
                style={{ background: 'none', border: 'none', padding: 0, cursor: isSpinning ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', opacity: 0.8 }}
              >
                Try Demo
              </motion.button>
              <span style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', fontSize: '12px' }}>·</span>
              <ReplayButton onClick={handleReplay} disabled={isSpinning} hasLastOpening={!!lastOpeningItem} />
              <span style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', fontSize: '12px' }}>·</span>
              <motion.button
                onClick={() => setShowPfVerifier(true)}
                whileHover={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(16,185,129,0.55)', opacity: 0.88 }}
              >
                <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/bouclier.png" alt="" style={{ width: '11px', height: '11px', objectFit: 'contain' }} />
                Provably Fair
              </motion.button>
            </div>
          </div>
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

        <LuxuryShowcase items={box.items} onItemClick={handleItemPreview} isDark={isDark} />
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