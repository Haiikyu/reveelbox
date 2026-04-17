'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { DropsFeed } from '@/app/components/DropsFeed'
import PlayerHoverCard from '@/app/components/PlayerHoverCard'

// ─── Assets ───────────────────────────────────────────────────────────────────
const COIN = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png'
const GAGNANT = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/gagnant.png'
const MEDAL_IMGS = [
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/medaille.png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/medaille%20(1).png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/medaille%20(2).png',
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface CaseItem { id: string; name: string; image_url: string | null; market_value: number; rarity: string }
interface FloatCase {
  id: string; name: string; image_url: string | null; price_virtual: number; rarity: string | null; items: CaseItem[]
  left: number; top: number; size: number
  floatDur: number; floatDelay: number; rotAmp: number; z: number
  itemDir: 'right' | 'left' | 'left-down' | 'up' | 'down' | 'center'
  maxItems?: number
}
interface Box { id: string; name: string; price_virtual: number; image_url: string | null; rarity: string | null }
interface LeaderPlayer { id: string; username: string; avatar_url: string | null; total_exp: number | null; level: number | null }

// ─── Rarity ───────────────────────────────────────────────────────────────────
const RARITY: Record<string, { hex: string; rgb: string; label: string }> = {
  common:    { hex: '#94a3b8', rgb: '148,163,184', label: 'Commun' },
  uncommon:  { hex: '#10b981', rgb: '16,185,129',  label: 'Peu Commun' },
  rare:      { hex: '#3b82f6', rgb: '59,130,246',  label: 'Rare' },
  epic:      { hex: '#a855f7', rgb: '168,85,247',  label: 'Épique' },
  legendary: { hex: '#f59e0b', rgb: '245,158,11',  label: 'Légendaire' },
}
const R = (k?: string | null) => RARITY[k?.toLowerCase() ?? 'common'] ?? RARITY.common

// ─── Case slots ───────────────────────────────────────────────────────────────
const SLOTS: Array<{ left: number; top: number; size: number; floatDur: number; floatDelay: number; rotAmp: number; z: number; itemDir: FloatCase['itemDir'] }> = [
  { left: 11, top: 79, size: 110, floatDur: 7.2, floatDelay: 0,   rotAmp: 8,  z: 3, itemDir: 'down'      },
  { left: 27, top: 77, size: 95,  floatDur: 9.1, floatDelay: 1.5, rotAmp: 10, z: 2, itemDir: 'right'     },
  { left: 28, top: 40, size: 88,  floatDur: 6.8, floatDelay: 2.8, rotAmp: 6,  z: 2, itemDir: 'right'     },
  { left: 69, top: 52, size: 108, floatDur: 8.5, floatDelay: 0.8, rotAmp: 7,  z: 3, itemDir: 'left-down' },
  { left: 81, top: 79, size: 100, floatDur: 10,  floatDelay: 1.9, rotAmp: 9,  z: 3, itemDir: 'left'      },
  { left: 93, top: 75, size: 85,  floatDur: 7.5, floatDelay: 3.4, rotAmp: 11, z: 2, itemDir: 'up'        },
]

// ─── Audio ────────────────────────────────────────────────────────────────────
class SFX {
  private ctx: AudioContext | null = null; muted = false
  private get ac() {
    if (this.muted) return null
    if (!this.ctx) try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { this.muted = true; return null }
    if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx
  }
  hover() { const c = this.ac; if (!c) return; const [o, g] = [c.createOscillator(), c.createGain()]; o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.setValueAtTime(900, c.currentTime); o.frequency.exponentialRampToValueAtTime(1500, c.currentTime + 0.06); g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.14); o.start(); o.stop(c.currentTime + 0.16) }
  click() { const c = this.ac; if (!c) return; const [o1, g1] = [c.createOscillator(), c.createGain()]; o1.connect(g1); g1.connect(c.destination); o1.type = 'sine'; o1.frequency.setValueAtTime(190, c.currentTime); o1.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.14); g1.gain.setValueAtTime(0.2, c.currentTime); g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18); o1.start(); o1.stop(c.currentTime + 0.22) }
  emerge(idx: number) { const c = this.ac; if (!c) return; const t = c.currentTime + idx * 0.045; const [o, f, g] = [c.createOscillator(), c.createBiquadFilter(), c.createGain()]; o.connect(f); f.connect(g); g.connect(c.destination); f.type = 'bandpass'; f.frequency.value = 500 + idx * 140; o.type = 'sawtooth'; o.frequency.setValueAtTime(300 + idx * 85, t); o.frequency.exponentialRampToValueAtTime(650 + idx * 85, t + 0.08); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.start(t); o.stop(t + 0.15) }
}
const audio = typeof window !== 'undefined' ? new SFX() : null

// ─── Float item (néons réduits) ───────────────────────────────────────────────
function FloatItem({ item, idx, total, active, caseSize, dir }: {
  item: CaseItem; idx: number; total: number; active: boolean; caseSize: number; dir: FloatCase['itemDir']
}) {
  const r = R(item.rarity)
  const d = caseSize * 0.85
  const positions = [
    { x: -d, y: -d }, { x: d, y: -d },
    { x: -d, y: d  }, { x: d, y: d  },
    { x: 0,  y: d * 1.1 },
  ]
  const { x, y } = positions[idx % positions.length]
  const imgSize = item.market_value > 400 ? 100 : item.market_value > 200 ? 90 : item.market_value > 80 ? 80 : 70
  const floatOffset = -4 - (idx % 3) * 2

  useEffect(() => { if (active) audio?.emerge(idx) }, [active, idx])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={item.id}
          initial={{ x: 0, y: caseSize * 0.15, scale: 0.05, opacity: 0 }}
          animate={{ x, y, scale: 1, opacity: 1, rotate: 0 }}
          exit={{ x: x * 0.3, y: y * 0.3, scale: 0, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
          transition={{ type: 'spring', stiffness: 180, damping: 16, delay: idx * 0.06 }}
          style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -imgSize / 2, marginLeft: -imgSize / 2, zIndex: 60, pointerEvents: 'none', paddingBottom: 28 }}
        >
          <motion.div animate={{ y: [0, floatOffset, 0] }} transition={{ duration: 2.2 + idx * 0.3, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.22 }}>
            {/* Outer glow — réduit */}
            <div style={{
              position: 'absolute',
              top: -(imgSize * 0.4), left: -(imgSize * 0.4),
              width: imgSize * 1.8, height: imgSize * 1.8,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${r.rgb},0.14) 0%, rgba(${r.rgb},0.05) 40%, transparent 70%)`,
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }} />
            <div style={{ width: imgSize, height: imgSize, position: 'relative' }}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: `drop-shadow(0 0 4px rgba(${r.rgb},0.3)) brightness(1.03)` }}
                  onError={e => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, rgba(${r.rgb},0.7) 0%, rgba(${r.rgb},0.2) 60%, transparent 100%)`, filter: `drop-shadow(0 0 10px ${r.hex})` }} />
              )}
            </div>
            {/* Value badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.06 + 0.3 }}
              style={{
                position: 'absolute', top: imgSize + 6, left: '50%', transform: 'translateX(-50%)',
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '4px 8px 4px 7px', borderRadius: 999,
                background: `rgba(${r.rgb},0.18)`, border: `1.5px solid rgba(${r.rgb},0.5)`,
                whiteSpace: 'nowrap', boxShadow: `0 2px 10px rgba(${r.rgb},0.25)`, overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: r.hex, textShadow: `0 0 6px rgba(${r.rgb},0.7)`, lineHeight: 1 }}>
                {item.market_value.toLocaleString()}
              </span>
              <img src={COIN} alt="coin" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: '50%', flexShrink: 0, display: 'block' }}
                onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Float case card (néons réduits) ─────────────────────────────────────────
function FloatCaseCard({ fc }: { fc: FloatCase }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [gone, setGone] = useState(false)
  const r = R(fc.rarity)
  const items = fc.items.sort((a, b) => b.market_value - a.market_value).slice(0, Math.min(fc.maxItems ?? 5, fc.items.length))

  const onEnter = useCallback(() => { setHovered(true); audio?.hover() }, [])
  const onLeave = useCallback(() => { setHovered(false) }, [])
  const onClick = useCallback(() => {
    if (gone) return; setGone(true); audio?.click()
    setTimeout(() => router.push(`/boxes/${fc.id}`), 200)
  }, [fc.id, router, gone])

  return (
    <motion.div
      style={{ position: 'absolute', left: `${fc.left}%`, top: `${fc.top}%`, zIndex: hovered ? 80 : fc.z }}
      animate={{ y: [0, -(10 * fc.size / 110), 0], rotate: [-fc.rotAmp / 2, fc.rotAmp / 2, -fc.rotAmp / 2] }}
      transition={{
        y: { duration: fc.floatDur, delay: fc.floatDelay, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: fc.floatDur * 1.4, delay: fc.floatDelay, repeat: Infinity, ease: 'easeInOut' },
      }}
      onHoverStart={onEnter} onHoverEnd={onLeave} onClick={onClick}
      className="cursor-pointer select-none"
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
        {items.map((item, i) => (
          <FloatItem key={item.id} item={item} idx={i} total={items.length} active={hovered} caseSize={fc.size} dir={fc.itemDir} />
        ))}
      </div>
      <motion.div
        animate={{ scale: hovered ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ width: fc.size, height: fc.size, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Outer ambient glow — réduit */}
        <motion.div
          animate={{ opacity: hovered ? 0.5 : 0.1, scale: hovered ? 1.3 : 1 }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'absolute', top: -(fc.size * 0.45), left: -(fc.size * 0.45),
            width: fc.size * 2.9, height: fc.size * 2.9, borderRadius: '50%', pointerEvents: 'none',
            background: `radial-gradient(circle, rgba(${r.rgb},0.55) 0%, rgba(${r.rgb},0.18) 32%, transparent 65%)`,
            filter: 'blur(22px)',
          }}
        />
        {/* Mid glow — réduit */}
        <motion.div
          animate={{ opacity: hovered ? 0.45 : 0.07 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute', top: -12, left: -12, width: fc.size + 24, height: fc.size + 24,
            borderRadius: '50%', pointerEvents: 'none',
            background: `radial-gradient(circle, rgba(${r.rgb},0.4) 0%, transparent 60%)`,
            filter: 'blur(8px)',
          }}
        />
        {fc.image_url ? (
          <img src={fc.image_url} alt={fc.name} style={{
            width: fc.size, height: fc.size, objectFit: 'contain', display: 'block',
            filter: hovered
              ? `drop-shadow(0 0 20px rgba(${r.rgb},0.85)) drop-shadow(0 0 8px ${r.hex}) brightness(1.12)`
              : `drop-shadow(0 0 7px rgba(${r.rgb},0.3)) brightness(1)`,
            transition: 'filter 0.3s',
          }} onError={e => ((e.target as HTMLImageElement).style.opacity = '0')} />
        ) : (
          <div style={{ width: fc.size, height: fc.size, borderRadius: '50%', background: `radial-gradient(circle,rgba(${r.rgb},0.8),rgba(${r.rgb},0.2))`, filter: `drop-shadow(0 0 18px ${r.hex})` }} />
        )}
        {/* Price badge */}
        <div style={{
          marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
          fontSize: 11, fontWeight: 900, color: r.hex, whiteSpace: 'nowrap',
          backdropFilter: 'blur(10px)', boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}>
          {fc.price_virtual.toLocaleString()}
          <img src={COIN} alt="coin" style={{ width: 15, height: 15, objectFit: 'contain', borderRadius: '50%', flexShrink: 0 }} onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── AtmoBG v2 (sans quadrillage) ────────────────────────────────────────────
function AtmoBGV2() {
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf: number, t = 0

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    const orbs = [
      { x: 0.18, y: 0.22, r: 0.38, color: [69, 120, 190],   speed: 0.00018, ox: 0.06, oy: 0.05 },
      { x: 0.78, y: 0.18, r: 0.32, color: [139, 92, 246],   speed: 0.00024, ox: 0.05, oy: 0.07 },
      { x: 0.55, y: 0.72, r: 0.30, color: [20, 184, 166],   speed: 0.00020, ox: 0.07, oy: 0.04 },
      { x: 0.88, y: 0.65, r: 0.26, color: [245, 158, 11],   speed: 0.00016, ox: 0.04, oy: 0.06 },
      { x: 0.30, y: 0.80, r: 0.22, color: [99, 102, 241],   speed: 0.00022, ox: 0.05, oy: 0.03 },
    ]

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Orbs
      orbs.forEach((o, i) => {
        const px = (o.x + Math.sin(t * o.speed * 1000 + i * 1.3) * o.ox) * W
        const py = (o.y + Math.cos(t * o.speed * 800 + i * 0.9) * o.oy) * H
        const rr = o.r * Math.min(W, H)
        const [rv, g, b] = o.color
        const grd = ctx.createRadialGradient(px, py, 0, px, py, rr)
        grd.addColorStop(0,   `rgba(${rv},${g},${b},0.13)`)
        grd.addColorStop(0.4, `rgba(${rv},${g},${b},0.07)`)
        grd.addColorStop(1,   `rgba(${rv},${g},${b},0)`)
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
      })

      // Noise grain — subtile
      for (let i = 0; i < 30; i++) {
        const gx = Math.random() * W
        const gy = Math.random() * H
        ctx.fillStyle = `rgba(200,220,255,${Math.random() * 0.018})`
        ctx.fillRect(gx, gy, 1, 1)
      }

      // Top beam (Vercel-style)
      const beam = ctx.createRadialGradient(W * 0.5, -H * 0.05, 0, W * 0.5, -H * 0.05, W * 0.55)
      beam.addColorStop(0,   'rgba(90,140,255,0.18)')
      beam.addColorStop(0.5, 'rgba(90,140,255,0.06)')
      beam.addColorStop(1,   'rgba(90,140,255,0)')
      ctx.fillStyle = beam
      ctx.fillRect(0, 0, W, H)

      // Vignette
      const vig = ctx.createRadialGradient(W * .5, H * .5, 0, W * .5, H * .5, Math.max(W, H) * .75)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.32)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      t += 0.016
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(135deg, #06091a 0%, #0a0e1a 40%, #080b18 70%, #06091f 100%)' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
    </>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return
      started.current = true
      let c = 0; const step = to / 55
      const timer = setInterval(() => { c += step; if (c >= to) { setN(to); clearInterval(timer) } else setN(Math.floor(c)) }, 1800 / 55)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  const fmt = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
  return <span ref={ref}>{fmt(n)}{suffix}</span>
}

// ─── Section 1 : Featured Boxes ───────────────────────────────────────────────
function FeaturedBoxes({ boxes }: { boxes: Box[] }) {
  if (!boxes.length) return null
  return (
    <section className="py-24 px-6 md:px-10" style={{ background: 'linear-gradient(180deg, #06091a 0%, #080c1c 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="mb-14"
        >
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(69,120,190,0.1)', color: '#4578be', border: '1px solid rgba(69,120,190,0.25)' }}>
            ✦ Nos Boxes
          </div>
          <h2 className="text-4xl md:text-6xl font-black leading-tight" style={{ color: '#fff' }}>
            Des objets réels.<br />
            <span style={{ background: 'linear-gradient(90deg,#4578be,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Des boxes uniques.
            </span>
          </h2>
          <p className="mt-4 text-base max-w-xl" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Chaque box contient des objets de vraie valeur — vêtements, gaming, high-tech, cartes cadeaux.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {boxes.map((box, i) => {
            const r = R(box.rarity)
            return (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative cursor-pointer"
              >
                <Link href={`/boxes/${box.id}`}>
                  {/* Glow derrière la card */}
                  <motion.div
                    className="absolute -inset-px rounded-2xl blur-xl pointer-events-none transition-opacity duration-300"
                    style={{ background: `rgba(${r.rgb},0.35)`, opacity: 0 }}
                    whileHover={{ opacity: 0.5 }}
                  />
                  <div className="relative rounded-2xl overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid rgba(${r.rgb},0.2)`,
                      backdropFilter: 'blur(10px)',
                      transition: 'border-color 0.25s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `rgba(${r.rgb},0.6)`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = `rgba(${r.rgb},0.2)`)}
                  >
                    {/* Accent top */}
                    <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,${r.hex},transparent)` }} />
                    {/* Image */}
                    <div className="relative h-52 flex items-center justify-center overflow-hidden p-6"
                      style={{ background: `linear-gradient(135deg,rgba(${r.rgb},0.06),transparent)` }}>
                      {box.image_url ? (
                        <motion.img src={box.image_url} alt={box.name}
                          className="h-40 w-40 object-contain"
                          style={{ filter: `drop-shadow(0 0 8px rgba(${r.rgb},0.5))`, transition: 'filter 0.3s' }}
                          whileHover={{ scale: 1.08 }}
                          onError={e => ((e.target as HTMLImageElement).style.opacity = '0')}
                        />
                      ) : (
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle,rgba(${r.rgb},0.8),rgba(${r.rgb},0.2))`, filter: `drop-shadow(0 0 12px ${r.hex})` }} />
                      )}
                      {/* Rarity badge */}
                      <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: `rgba(${r.rgb},0.12)`, color: r.hex, border: `1px solid rgba(${r.rgb},0.3)` }}>
                        {r.label}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="px-4 pb-4">
                      <p className="font-bold text-sm mb-3 truncate text-white">{box.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <img src={COIN} alt="coin" className="w-5 h-5 object-contain rounded-full" />
                          <span className="text-xl font-black" style={{ color: r.hex }}>{box.price_virtual.toLocaleString()}</span>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#4578be,#2d5aa0)' }}>
                          Ouvrir
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/boxes">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
            >
              Explorer toutes les boxes →
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Section 2 : Game Modes ───────────────────────────────────────────────────
const GAMES = [
  { name: 'Crash',    href: '/games/crash',    desc: 'Cashout avant le crash',       gradient: 'linear-gradient(135deg,#ef4444,#f97316)',  icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(64).png', available: true  },
  { name: 'Mines',    href: '/games/mines',    desc: 'Évite les mines, multiplie',   gradient: 'linear-gradient(135deg,#a855f7,#ec4899)',  icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(63).png', available: true  },
  { name: 'Upgrade',  href: '/games/upgrade',  desc: 'Améliore ton item gagnant',    gradient: 'linear-gradient(135deg,#4578be,#6598de)',  icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(61).png', available: true  },
  { name: 'Coinflip', href: '/games/coinflip', desc: 'Double ou rien en un flip',    gradient: 'linear-gradient(135deg,#3b82f6,#14b8a6)',  icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(65).png', available: true  },
  { name: 'Battles',  href: '/battles',        desc: 'Affronte d\'autres joueurs',   gradient: 'linear-gradient(135deg,#f59e0b,#f97316)',  icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(66).png', available: true  },
]

function GameModesSection() {
  const router = useRouter()
  return (
    <section className="py-24 px-6 md:px-10" style={{ background: 'linear-gradient(180deg,#080c1c 0%,#060919 100%)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.25)' }}>
              🎮 Modes de Jeu
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Jouez. Gagnez.<br />
              <span style={{ background: 'linear-gradient(90deg,#a855f7,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Récoltez.
              </span>
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            5 façons de multiplier tes gains sur ReveelBox
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {GAMES.map((g, i) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -8, scale: 1.03 }}
              onClick={() => g.available && router.push(g.href)}
              className="relative rounded-2xl overflow-hidden cursor-pointer group"
              style={{ opacity: g.available ? 1 : 0.5 }}
            >
              {/* Gradient bg overlay au hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: g.gradient, mixBlendMode: 'overlay' }} />
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
                {/* Image */}
                <div className="relative aspect-square overflow-hidden rounded-t-2xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <img src={g.icon} alt={g.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  {/* Gradient bas */}
                  <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: 'linear-gradient(transparent,rgba(0,0,0,0.6))' }} />
                </div>
                {/* Content */}
                <div className="px-3 py-3">
                  <p className="font-black text-sm text-white mb-0.5">{g.name}</p>
                  <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.desc}</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-1.5 rounded-lg text-[11px] font-bold text-white"
                    style={{ background: g.gradient, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  >
                    {g.available ? 'Jouer →' : 'Bientôt'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 3 : Comment ça marche ───────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Recharge tes coins',
    desc: 'Choisis un montant, paye en sécurité via Stripe. Tes coins sont disponibles immédiatement.',
    icon: '💳',
    accent: '#4578be',
    rgb: '69,120,190',
    href: '/buy-coins',
    cta: 'Recharger',
  },
  {
    num: '02',
    title: 'Ouvre ta box',
    desc: 'Sélectionne une box, active la roue. Chaque ouverture est provably fair et vérifiable.',
    icon: '📦',
    accent: '#a855f7',
    rgb: '168,85,247',
    href: '/boxes',
    cta: 'Voir les boxes',
  },
  {
    num: '03',
    title: 'Reçois ton objet',
    desc: 'Ton gain est expédié à ton adresse, ou tu peux le revendre contre des coins sur la plateforme.',
    icon: '🚀',
    accent: '#10b981',
    rgb: '16,185,129',
    href: '/inventory',
    cta: 'Mon inventaire',
  },
]

function HowItWorksSection() {
  return (
    <section className="py-24 px-6 md:px-10" style={{ background: 'linear-gradient(180deg,#060919 0%,#0a0d1a 100%)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
            ⚡ Simple & Rapide
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white">Comment ça marche ?</h2>
          <p className="mt-3 text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
            De la recharge à la livraison, tout est transparent et sécurisé.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecteur horizontal (desktop) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px"
            style={{ background: 'linear-gradient(90deg,rgba(69,120,190,0.4),rgba(168,85,247,0.4),rgba(16,185,129,0.4))' }} />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative"
            >
              <div className="rounded-2xl p-7 h-full"
                style={{
                  background: `linear-gradient(135deg,rgba(${s.rgb},0.07),rgba(${s.rgb},0.02))`,
                  border: `1px solid rgba(${s.rgb},0.2)`,
                }}>
                {/* Numéro */}
                <div className="text-6xl font-black mb-5 leading-none"
                  style={{ background: `linear-gradient(135deg,rgba(${s.rgb},0.7),rgba(${s.rgb},0.25))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.num}
                </div>
                {/* Icône */}
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="text-lg font-black text-white mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
                <Link href={s.href}>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: `rgba(${s.rgb},0.2)`, border: `1px solid rgba(${s.rgb},0.35)`, color: s.accent }}
                  >
                    {s.cta} →
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section 4 : Leaderboard + Stats ─────────────────────────────────────────
const MEDAL_COLOR = ['#f59e0b', '#94a3b8', '#cd7c3a']
const MEDAL_GLOW  = ['rgba(245,158,11,0.4)', 'rgba(148,163,184,0.3)', 'rgba(205,124,58,0.3)']
const BAR_H = [64, 48, 36]

function LeaderboardSection({ counts }: { counts: { opens: number; members: number } }) {
  const [players, setPlayers] = useState<LeaderPlayer[]>([])

  useEffect(() => {
    const sb = createClient()
    sb.from('profiles')
      .select('id, username, avatar_url, total_exp, level')
      .not('username', 'is', null)
      .order('total_exp', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setPlayers(data as LeaderPlayer[]) })
  }, [])

  const podium = players.length === 3 ? [players[1], players[0], players[2]] : players

  return (
    <section className="py-24 px-6 md:px-10" style={{ background: 'linear-gradient(180deg,#0a0d1a 0%,#07091a 100%)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Leaderboard */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>
              <img src={GAGNANT} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
              Leaderboard
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-10">
              Les Meilleurs<br />
              <span style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Joueurs
              </span>
            </h2>

            {players.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.2)' }}>Chargement du podium…</div>
            ) : (
              <div className="flex items-end justify-center gap-4" style={{ height: 220 }}>
                {podium.map((p, podiumIdx) => {
                  const rankIdx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2
                  const barH = BAR_H[rankIdx]
                  return (
                    <div key={p.username} className="flex flex-col items-center flex-1">
                      <PlayerHoverCard userId={p.id} isBot={false}>
                        <div className="relative mb-3 cursor-pointer">
                          <div style={{
                            width: rankIdx === 0 ? 52 : 44, height: rankIdx === 0 ? 52 : 44,
                            borderRadius: '50%', overflow: 'hidden',
                            border: `2px solid ${MEDAL_COLOR[rankIdx]}`,
                            boxShadow: `0 0 16px ${MEDAL_GLOW[rankIdx]}, 0 0 4px ${MEDAL_COLOR[rankIdx]}60`,
                          }}>
                            {p.avatar_url
                              ? <img src={p.avatar_url} alt={p.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', background: 'rgba(69,120,190,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 800 }}>{p.username?.[0]?.toUpperCase()}</div>
                            }
                          </div>
                        </div>
                      </PlayerHoverCard>
                      <span className="text-xs font-bold text-white mb-2 text-center max-w-[70px] truncate block">{p.username}</span>
                      <img src={MEDAL_IMGS[rankIdx]} alt="" style={{ width: 32, height: 32, objectFit: 'contain', marginBottom: 4 }} />
                      <div style={{
                        width: '100%', height: barH, borderRadius: '8px 8px 0 0',
                        background: `linear-gradient(180deg,${MEDAL_COLOR[rankIdx]}28,${MEDAL_COLOR[rankIdx]}0c)`,
                        border: `1px solid ${MEDAL_COLOR[rankIdx]}44`, borderBottom: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span className="text-[9px] font-black" style={{ color: MEDAL_COLOR[rankIdx] }}>
                          {(p.total_exp ?? 0).toLocaleString('fr-FR')} XP
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/leaderboard">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                  Voir le classement complet →
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="space-y-4 pt-4">
            {[
              { label: 'Cases Ouvertes',     value: counts.opens,   suffix: '',  accent: '#4578be', rgb: '69,120,190',  icon: '📦' },
              { label: 'Membres Actifs',     value: counts.members, suffix: '',  accent: '#a855f7', rgb: '168,85,247',  icon: '👥' },
              { label: 'Récompenses (€)',    value: 2_340_000,      suffix: '€', accent: '#10b981', rgb: '16,185,129',  icon: '💰' },
              { label: 'Satisfaction',       value: 99,             suffix: '%', accent: '#f59e0b', rgb: '245,158,11',  icon: '⭐' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 p-5 rounded-2xl"
                style={{ background: `linear-gradient(135deg,rgba(${s.rgb},0.07),rgba(${s.rgb},0.02))`, border: `1px solid rgba(${s.rgb},0.18)` }}
              >
                <div className="text-2xl w-10 text-center flex-shrink-0">{s.icon}</div>
                <div className="flex-1">
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                  <p className="text-2xl font-black" style={{ color: s.accent }}>
                    <Counter to={s.value} suffix={s.suffix} />
                  </p>
                </div>
                {/* Barre de progression décorative */}
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }} whileInView={{ width: '100%' }}
                    viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1, duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg,${s.accent},transparent)` }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Section 5 : CTA Dual ─────────────────────────────────────────────────────
function CTASection({ user }: { user: any }) {
  return (
    <section className="py-24 px-6 md:px-10" style={{ background: 'linear-gradient(180deg,#07091a 0%,#06091a 100%)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Prêt à Commencer ?</h2>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.35)' }}>Rejoins des milliers de joueurs qui gagnent chaque jour.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Affiliate */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0 }}
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(69,120,190,0.12),rgba(69,120,190,0.04))', border: '1px solid rgba(69,120,190,0.25)' }}
          >
            {/* Glow décoratif */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle,rgba(69,120,190,0.25),transparent 70%)' }} />
            <div className="relative">
              <div className="text-5xl mb-5">🤝</div>
              <h3 className="text-2xl font-black text-white mb-2">Invite & Gagne</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Partage ton code affilié et touche jusqu&apos;à <strong style={{ color: '#4578be' }}>10% de commission</strong> sur chaque dépôt de tes filleuls.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[{ l: 'Affiliés Actifs', v: '1 240' }, { l: 'Commissions Totales', v: '€84K' }].map(s => (
                  <div key={s.l} className="p-3 rounded-xl text-center"
                    style={{ background: 'rgba(69,120,190,0.08)', border: '1px solid rgba(69,120,190,0.15)' }}>
                    <div className="text-xl font-black" style={{ color: '#4578be' }}>{s.v}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <Link href="/affiliates">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#4578be,#2d5aa0)', boxShadow: '0 8px 24px rgba(69,120,190,0.35)' }}>
                  Rejoindre le programme →
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Free Drop */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.25),transparent 70%)' }} />
            <div className="relative">
              <motion.div
                className="text-5xl mb-5 inline-block"
                animate={{ rotate: [0, 14, -14, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}>
                🎁
              </motion.div>
              <h3 className="text-2xl font-black text-white mb-2">3 Boxes Gratuites / Jour</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Chaque jour de connexion, des <strong style={{ color: '#10b981' }}>boxes gratuites</strong> t&apos;attendent. Plus ton niveau est élevé, meilleures elles sont.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  { level: 'Niv. 1',  box: 'Starter Box',    active: true  },
                  { level: 'Niv. 5',  box: 'Intermédiaire',  active: false },
                  { level: 'Niv. 10', box: 'Premium Box',    active: false },
                ].map((t, i) => (
                  <div key={t.box} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: `rgba(16,185,129,${0.05 + i * 0.02})`, border: '1px solid rgba(16,185,129,0.12)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-semibold text-white">{t.level}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
                    <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.box}</span>
                  </div>
                ))}
              </div>
              <Link href="/freedrop">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
                  Réclamer mes free drops →
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer mini ──────────────────────────────────────────────────────────────
function MiniFooter() {
  return (
    <div className="py-8 px-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        © 2025 ReveelBox — Tous droits réservés · <Link href="/contact" className="hover:text-white/40 transition-colors">Contact</Link>
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PageV2() {
  const { user } = useAuth()
  const [cases, setCases] = useState<FloatCase[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [counts, setCounts] = useState({ opens: 0, members: 0 })

  useEffect(() => {
    const sb = createClient()

    // Float cases (hero)
    sb.from('loot_boxes')
      .select(`id, name, image_url, price_virtual, rarity, loot_box_items ( probability, display_order, items ( id, name, image_url, market_value, rarity ) )`)
      .eq('is_active', true)
      .neq('is_daily_free', true)
      .gt('price_virtual', 0)
      .order('price_virtual', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data?.length) {
          setCases(data.slice(0, SLOTS.length).map((b: any, i) => ({
            id: b.id, name: b.name, image_url: b.image_url,
            price_virtual: b.price_virtual, rarity: b.rarity,
            items: (b.loot_box_items ?? [])
              .filter((li: any) => li?.items?.id)
              .map((li: any) => ({ id: li.items.id, name: li.items.name, image_url: li.items.image_url, market_value: li.items.market_value, rarity: li.items.rarity }))
              .sort((a: CaseItem, b: CaseItem) => b.market_value - a.market_value),
            ...SLOTS[i],
          })))
        }
      })

    // Featured boxes
    sb.from('loot_boxes')
      .select('id,name,price_virtual,image_url,rarity')
      .eq('is_active', true)
      .order('price_virtual', { ascending: false })
      .limit(4)
      .then(({ data }) => { if (data?.length) setBoxes(data) })

    // Counts
    Promise.all([
      sb.from('transactions').select('id', { count: 'exact', head: true }).eq('type', 'box_opening'),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([opens, users]) => setCounts({ opens: opens.count ?? 0, members: users.count ?? 0 }))
  }, [])

  return (
    <div
      style={{
        height: '100dvh',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        background: '#06091a',
      }}
    >
      {/* ── SNAP 1 : Hero 100vh ── */}
      <section
        style={{
          height: '100dvh',
          scrollSnapAlign: 'start',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AtmoBGV2 />

        {/* Floating cases */}
        {cases.map(fc => <FloatCaseCard key={fc.id} fc={fc} />)}

        {/* ── Center copy ── */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 780, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(69,120,190,0.1)', color: '#4578be', border: '1px solid rgba(69,120,190,0.25)' }}
          >
            ✦ Objets Réels Garantis
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontSize: 'clamp(46px,8vw,88px)', fontWeight: 900,
              lineHeight: 0.93, letterSpacing: '-0.03em', color: '#fff', marginBottom: 22,
            }}
          >
            Ouvrez des Boxes<br />
            <span style={{ background: 'linear-gradient(90deg,#4578be 0%,#a855f7 55%,#ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Exceptionnelles
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{ fontSize: 'clamp(14px,1.6vw,18px)', color: 'rgba(255,255,255,0.45)', marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}
          >
            Découvrez des objets réels d&apos;exception. Chaque ouverture est provably fair et vérifiable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3 items-center justify-center"
          >
            <Link href="/boxes">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-7 py-3.5 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#4578be,#2d5aa0)', boxShadow: '0 8px 28px rgba(69,120,190,0.45)' }}
              >
                Ouvrir une Box →
              </motion.button>
            </Link>
            <Link href={user ? '/profile' : '#'}>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Comment ça marche
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* ── Drops Feed — bas, pleine largeur ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            background: 'linear-gradient(180deg,transparent,rgba(6,9,26,0.92) 35%)',
            paddingTop: 48,
            paddingBottom: 24,
          }}
        >
          <DropsFeed className="px-0" />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
            Défiler
          </span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 1L8 8L15 1" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </section>

      {/* ── SNAP 2 : Reste de la page (scroll normal) ── */}
      <div style={{ scrollSnapAlign: 'start', background: '#06091a' }}>
        <FeaturedBoxes boxes={boxes} />
        <GameModesSection />
        <HowItWorksSection />
        <LeaderboardSection counts={counts} />
        <CTASection user={user} />
        <MiniFooter />
      </div>
    </div>
  )
}
