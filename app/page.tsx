'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { useAuthModal } from '@/app/components/AuthModalProvider'
import HeroSection from '@/app/components/hero/HeroSection'

// ─── Platform coin asset ──────────────────────────────────────────────────────
const COIN =
  'https://media.discordapp.net/attachments/369204403401392139/1413939657237987358/ChatGPT_Image_6_sept._2025_19_31_10.png?ex=68bdc16c&is=68bc6fec&hm=806ceed4add069224321faea8e476ab163a04f096c62876342e4b8e753eea74b&=&format=webp&quality=lossless&width=1126&height=1126'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Box {
  id: string; name: string; price_virtual: number
  image_url: string | null; rarity: string | null
}
interface Drop {
  id: string; username: string; avatar_url: string | null
  item_name: string; item_image: string | null
  item_value: number; item_rarity: string; opened_at: string
}

// ─── Rarity ───────────────────────────────────────────────────────────────────
const RARITY: Record<string, { hex: string; rgb: string; label: string }> = {
  common:    { hex:'#9ca3af', rgb:'156,163,175', label:'Commun'     },
  uncommon:  { hex:'#10b981', rgb:'16,185,129',  label:'Peu commun' },
  rare:      { hex:'#3b82f6', rgb:'59,130,246',  label:'Rare'       },
  epic:      { hex:'#a855f7', rgb:'168,85,247',  label:'Épique'     },
  legendary: { hex:'#f59e0b', rgb:'245,158,11',  label:'Légendaire' },
}
const R = (k?: string | null) => RARITY[k?.toLowerCase() ?? 'common'] ?? RARITY.common

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
      const t = setInterval(() => { c += step; if (c >= to) { setN(to); clearInterval(t) } else setN(Math.floor(c)) }, 1800 / 55)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  const fmt = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
  return <span ref={ref}>{fmt(n)}{suffix}</span>
}

// ─── Featured case card ───────────────────────────────────────────────────────
function CaseCard({ box, i }: { box: Box; i: number }) {
  const [hover, setHover] = useState(false)
  const r = R(box.rarity)
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.09, duration: 0.5 }}
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative cursor-pointer"
    >
      <Link href={`/boxes/${box.id}`}>
        <motion.div
          className="absolute -inset-1 rounded-2xl blur-xl"
          style={{ background: `rgba(${r.rgb},0.5)` }}
          animate={{ opacity: hover ? 0.38 : 0.07 }}
        />
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgb(var(--surface-elevated))',
            border: `1.5px solid ${hover ? r.hex : 'rgb(var(--border))'}`,
            transition: 'border-color 0.25s',
          }}>
          {/* Rarity accent */}
          <div className="h-0.5" style={{ background: `linear-gradient(90deg,transparent,${r.hex},transparent)` }} />

          {/* Image zone */}
          <div className="relative h-44 flex items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg,rgba(${r.rgb},0.08),rgba(0,0,0,0.04))` }}>
            {box.image_url ? (
              <motion.img src={box.image_url} alt={box.name}
                className="h-36 w-36 object-contain"
                style={{
                  filter: hover
                    ? `drop-shadow(0 0 18px rgba(${r.rgb},0.9)) brightness(1.12)`
                    : `drop-shadow(0 0 6px rgba(${r.rgb},0.4))`,
                  transition: 'filter 0.3s',
                }}
                animate={{ scale: hover ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
              />
            ) : (
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle,rgba(${r.rgb},0.8),rgba(${r.rgb},0.2))`,
                filter: `drop-shadow(0 0 12px ${r.hex})`,
              }} />
            )}
            <div className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: `rgba(${r.rgb},0.12)`, color: r.hex, border: `1px solid rgba(${r.rgb},0.35)` }}>
              {r.label}
            </div>
            <AnimatePresence>
              {hover && (
                <motion.div
                  initial={{ x: '-110%', opacity: 0 }} animate={{ x: '210%', opacity: 0.4 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)' }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-bold text-sm mb-3 truncate" style={{ color: 'rgb(var(--text-primary))' }}>{box.name}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <img src={COIN} alt="coin" className="w-5 h-5 object-contain rounded-full" />
                <span className="text-xl font-black" style={{ color: r.hex }}>{box.price_virtual.toLocaleString()}</span>
              </div>
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#4578be,#2d5aa0)' }}>
                Ouvrir
              </motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Live drop row ────────────────────────────────────────────────────────────
function DropRow({ drop, i }: { drop: Drop; i: number }) {
  const r = R(drop.item_rarity)
  const ago = (() => {
    const m = Math.floor((Date.now() - new Date(drop.opened_at).getTime()) / 60000)
    if (m < 1) return 'à l\'instant'; if (m < 60) return `il y a ${m}m`; return `il y a ${Math.floor(m / 60)}h`
  })()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
      transition={{ delay: i * 0.06, duration: 0.4 }}
      className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: `rgba(${r.rgb},0.07)`, borderColor: `rgba(${r.rgb},0.3)` }}
    >
      {/* Item image — no container border, just glow */}
      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
        {drop.item_image ? (
          <img src={drop.item_image} alt={drop.item_name}
            className="w-9 h-9 object-contain"
            style={{ filter: `drop-shadow(0 0 6px rgba(${r.rgb},0.8))` }}
            onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `radial-gradient(circle,rgba(${r.rgb},0.7),rgba(${r.rgb},0.2))`,
          }} />
        )}
      </div>

      {/* User + item */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold truncate" style={{ color: r.hex }}>{drop.username}</div>
        <div className="text-xs truncate" style={{ color: 'rgb(var(--text-secondary))' }}>{drop.item_name}</div>
      </div>

      {/* Value */}
      <div className="text-right flex-shrink-0">
        <div className="font-black text-sm" style={{ color: r.hex }}>+€{drop.item_value}</div>
        <div className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{ago}</div>
      </div>

      {drop.item_rarity === 'legendary' && (
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>👑</motion.span>
      )}
    </motion.div>
  )
}

// ─── Game mode card ───────────────────────────────────────────────────────────
const MODES = [
  { title: 'Ouverture de Cases', desc: 'Révèle des objets rares en un clic.',                href: '/boxes',    icon: '📦', accent: '#4578be' },
  { title: 'PvP Battles',        desc: 'Affronte d\'autres joueurs en live.',                href: '/battles',  icon: '⚔️', accent: '#f59e0b' },
  { title: 'Free Drops',         desc: 'Récompenses gratuites chaque jour.',                 href: '/freedrop', icon: '🎁', accent: '#22c55e' },
  { title: 'Boutique',           desc: 'Échange tes gains contre de vrais objets.',          href: '/shop',     icon: '🛍️', accent: '#a855f7' },
]

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, profile } = useAuth()
  const { openLoginModal } = useAuthModal()
  const [boxes, setBoxes]   = useState<Box[]>([])
  const [drops, setDrops]   = useState<Drop[]>([])
  const [counts, setCounts] = useState({ opens: 0, members: 0 })
  const [dropCursor, setDropCursor] = useState(0)

  // ── Real data only ──────────────────────────────────────────────────────────
  useEffect(() => {
    const sb = createClient()

    // Featured boxes (active, sorted by price)
    sb.from('loot_boxes')
      .select('id,name,price_virtual,image_url,rarity')
      .eq('is_active', true)
      .order('price_virtual', { ascending: false })
      .limit(4)
      .then(({ data }) => { if (data?.length) setBoxes(data) })

    // Real drops: transactions joined with items + profiles
    sb.from('transactions')
      .select(`
        id, created_at, type,
        items ( id, name, image_url, market_value, rarity ),
        profiles ( username, avatar_url )
      `)
      .eq('type', 'box_opening')
      .not('items', 'is', null)
      .not('profiles', 'is', null)
      .order('created_at', { ascending: false })
      .limit(18)
      .then(({ data }) => {
        if (!data?.length) return
        setDrops(
          data
            .filter((t: any) => t.items?.id && t.profiles?.username)
            .map((t: any) => ({
              id: t.id,
              username: t.profiles.username,
              avatar_url: t.profiles.avatar_url ?? null,
              item_name: t.items.name,
              item_image: t.items.image_url,
              item_value: t.items.market_value,
              item_rarity: t.items.rarity,
              opened_at: t.created_at,
            }))
        )
      })

    // Platform counts
    Promise.all([
      sb.from('transactions').select('id', { count: 'exact', head: true }).eq('type', 'box_opening'),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([opens, users]) =>
      setCounts({ opens: opens.count ?? 0, members: users.count ?? 0 })
    )
  }, [])

  // Rotate live drops every 3.2s
  useEffect(() => {
    if (drops.length < 2) return
    const t = setInterval(() => setDropCursor(c => (c + 1) % Math.max(1, drops.length - 4)), 3200)
    return () => clearInterval(t)
  }, [drops.length])

  const visibleDrops = drops.slice(dropCursor, dropCursor + 5)
  const legendaryDrops = drops.filter(d => d.item_rarity === 'legendary').slice(0, 3)

  return (
    <div className="overflow-x-hidden" style={{ background: 'rgb(var(--background))' }}>

      {/* ── HERO ── */}
      <HeroSection />

      {/* ── STATS BAR ── */}
      <section className="py-10 border-y"
        style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--surface))' }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { v: counts.opens,   l: 'Cases Ouvertes',    s: '' },
            { v: counts.members, l: 'Membres',            s: '' },
            { v: 2_340_000,      l: 'Récompenses (€)',   s: '€' },
            { v: 99,             l: 'Satisfaction',       s: '%' },
          ].map((s, i) => (
            <motion.div key={s.l}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black mb-1" style={{ color: '#4578be' }}>
                <Counter to={s.v} suffix={s.s} />
              </div>
              <div className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURED CASES ── */}
      {boxes.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-2 rounded-full"
                style={{ background: 'rgba(69,120,190,0.09)', color: '#4578be', border: '1px solid rgba(69,120,190,0.22)' }}>
                ✦ Cases en Vedette
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
                Choisir sa Case
              </h2>
              <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgb(var(--text-secondary))' }}>
                Des objets de haute valeur t'attendent dans chaque case.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {boxes.map((b, i) => <CaseCard key={b.id} box={b} i={i} />)}
            </div>
            <div className="text-center mt-10">
              <Link href="/boxes">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-2xl font-bold"
                  style={{
                    background: 'rgb(var(--surface-elevated))',
                    border: '1px solid rgb(var(--border))',
                    color: 'rgb(var(--text-primary))',
                  }}>
                  Voir toutes les cases →
                </motion.button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── LIVE DROPS + GAME MODES ── */}
      <section className="py-24 px-6" style={{ background: 'rgb(var(--surface))' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">

          {/* Live drops */}
          <div>
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} className="mb-8">
              <div className="flex items-center gap-2.5 mb-2">
                <motion.div className="w-2.5 h-2.5 rounded-full bg-red-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.95, repeat: Infinity }} />
                <span className="text-xs font-black uppercase tracking-widest text-red-500">Live</span>
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>Derniers Gains</h2>
              <p className="mt-1 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                {drops.length > 0 ? `${drops.length} gains chargés · mise à jour en temps réel` : 'Chargement…'}
              </p>
            </motion.div>
            <div className="space-y-2.5 min-h-[280px]">
              <AnimatePresence mode="popLayout">
                {visibleDrops.map((d, i) => <DropRow key={`${d.id}-${dropCursor}`} drop={d} i={i} />)}
              </AnimatePresence>
            </div>
          </div>

          {/* Game modes */}
          <div>
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} className="mb-8">
              <h2 className="text-3xl font-black" style={{ color: 'rgb(var(--text-primary))' }}>Modes de Jeu</h2>
              <p className="mt-1 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Une expérience complète à chaque session.</p>
            </motion.div>
            <div className="grid grid-cols-2 gap-4">
              {MODES.map((m, i) => (
                <motion.div key={m.title}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, scale: 1.02 }}>
                  <Link href={m.href}>
                    <div className="p-5 rounded-2xl border h-full cursor-pointer transition-all duration-200"
                      style={{ background: 'rgb(var(--surface-elevated))', borderColor: 'rgb(var(--border))' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.borderColor = m.accent
                        el.style.boxShadow = `0 8px 32px ${m.accent}22`
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.borderColor = 'rgb(var(--border))'
                        el.style.boxShadow = 'none'
                      }}>
                      <div className="text-3xl mb-3">{m.icon}</div>
                      <div className="font-bold text-sm mb-1" style={{ color: 'rgb(var(--text-primary))' }}>{m.title}</div>
                      <div className="text-xs leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{m.desc}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LEGENDARY HALL OF FAME (only shown if real legendary drops exist) ── */}
      {legendaryDrops.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-2 rounded-full"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.22)' }}>
                👑 Hall of Fame
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
                Drops Légendaires
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {legendaryDrops.map((d, i) => {
                const r = R('legendary')
                return (
                  <motion.div key={d.id}
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                    whileHover={{ y: -6 }}
                    className="relative rounded-2xl p-6 overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg,rgba(${r.rgb},0.07),rgba(239,68,68,0.04))`,
                      border: `1px solid rgba(${r.rgb},0.3)`,
                    }}>
                    <div className="flex items-center gap-3 mb-5">
                      {/* Item image — bare, no container */}
                      {d.item_image ? (
                        <img src={d.item_image} alt={d.item_name}
                          className="w-14 h-14 object-contain flex-shrink-0"
                          style={{ filter: `drop-shadow(0 0 12px rgba(${r.rgb},0.9)) drop-shadow(0 0 4px ${r.hex})` }}
                          onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                          background: `radial-gradient(circle,rgba(${r.rgb},0.8),rgba(${r.rgb},0.2))`,
                          filter: `drop-shadow(0 0 8px ${r.hex})`,
                        }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-black truncate" style={{ color: 'rgb(var(--text-primary))' }}>{d.username}</div>
                        <div className="text-xs truncate" style={{ color: r.hex }}>{d.item_name}</div>
                      </div>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>👑</motion.span>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black mb-2" style={{ color: r.hex }}>+€{d.item_value}</div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: `rgba(${r.rgb},0.12)`, color: r.hex }}>LÉGENDAIRE</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── AFFILIATE + FREE DROPS ── */}
      <section className="py-24 px-6" style={{ background: 'rgb(var(--surface))' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Affiliate */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8"
            style={{ background: 'linear-gradient(135deg,rgba(69,120,190,0.08),rgba(69,120,190,0.03))', border: '1px solid rgba(69,120,190,0.22)' }}>
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-2xl font-black mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Programme Affilié</h3>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
              Invite tes amis et gagne <strong style={{ color: '#4578be' }}>10% de commission</strong> sur chaque ouverture.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[{ l: 'Affiliés Actifs', v: '1 240' }, { l: 'Commissions', v: '€84K' }].map(s => (
                <div key={s.l} className="p-4 rounded-xl text-center"
                  style={{ background: 'rgba(69,120,190,0.08)', border: '1px solid rgba(69,120,190,0.15)' }}>
                  <div className="text-2xl font-black" style={{ color: '#4578be' }}>{s.v}</div>
                  <div className="text-xs mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <Link href="/affiliate">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#4578be,#2d5aa0)' }}>
                Rejoindre le Programme →
              </motion.button>
            </Link>
          </motion.div>

          {/* Free Drops */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8"
            style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03))', border: '1px solid rgba(34,197,94,0.22)' }}>
            <motion.div className="text-5xl mb-4 inline-block"
              animate={{ rotate: [0, 14, -14, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
              🎁
            </motion.div>
            <h3 className="text-2xl font-black mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Free Drops Quotidiens</h3>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
              Chaque jour, <strong style={{ color: '#22c55e' }}>des cases gratuites</strong> t'attendent.
            </p>
            <div className="space-y-3 mb-6">
              {['Niveau 1 — Case Starter', 'Niveau 5 — Case Intermédiaire', 'Niveau 10 — Case Premium'].map((t, i) => (
                <div key={t} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `rgba(34,197,94,${0.05 + i * 0.025})`, border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{t}</span>
                </div>
              ))}
            </div>
            <Link href="/freedrop">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                Réclamer mes Free Drops →
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── PROFILE SHOWCASE ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-2 rounded-full"
              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.22)' }}>
              ✦ Profil Personnalisé
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ color: 'rgb(var(--text-primary))' }}>
              Ton Profil,<br />Ton Style.
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
              Personnalise ton avatar, débloque des cadres exclusifs, collecte des pins rares.
            </p>
            {[
              { icon: '🖼️', title: 'Cadres de Profil',  desc: 'Débloque des cadres animés selon ton niveau' },
              { icon: '📌', title: 'Pins Exclusifs',    desc: 'Gagne des pins rares lors des ouvertures' },
              { icon: '🏆', title: 'Statistiques Live', desc: 'Suis tes gains, ton niveau et ta progression' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-4 mb-5">
                <div className="text-2xl mt-0.5">{f.icon}</div>
                <div>
                  <div className="font-bold text-sm mb-0.5" style={{ color: 'rgb(var(--text-primary))' }}>{f.title}</div>
                  <div className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{f.desc}</div>
                </div>
              </div>
            ))}
            {user ? (
              <Link href="/profile" className="inline-block mt-6">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 rounded-2xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                  Mon Profil →
                </motion.button>
              </Link>
            ) : (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => openLoginModal()}
                className="inline-block mt-6 px-8 py-4 rounded-2xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                Créer un Compte →
              </motion.button>
            )}
          </motion.div>

          {/* Profile card — using real profile data if logged in */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} className="flex justify-center">
            <motion.div
              animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-72 rounded-3xl overflow-hidden"
              style={{
                background: 'rgb(var(--surface-elevated))',
                border: '1px solid rgba(168,85,247,0.3)',
                boxShadow: '0 32px 80px rgba(168,85,247,0.2)',
              }}>
              {/* Banner */}
              <div className="h-24 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#4578be,#a855f7,#f59e0b)' }}>
                <div className="absolute inset-0 opacity-[0.18]"
                  style={{ backgroundImage: 'radial-gradient(circle at 25% 50%,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
              </div>
              {/* Avatar + name */}
              <div className="px-6 -mt-8 mb-4 flex items-end gap-3">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar"
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                    style={{ border: '3px solid rgb(var(--surface-elevated))', boxShadow: '0 4px 16px rgba(168,85,247,0.3)' }}
                  />
                ) : (
                  <motion.div whileHover={{ scale: 1.08, rotate: 4 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg,#4578be,#a855f7)',
                      border: '3px solid rgb(var(--surface-elevated))',
                    }}>
                    {profile?.username?.[0]?.toUpperCase() ?? 'R'}
                  </motion.div>
                )}
                <div className="pb-1">
                  <div className="font-black text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                    {profile?.username ?? 'ReveelPlayer'}
                  </div>
                  <div className="text-xs" style={{ color: '#a855f7' }}>
                    ⭐ Niveau {profile?.level ?? 1}
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div className="px-6 pb-6 space-y-2.5">
                {[
                  { label: 'Coins',    value: profile?.virtual_currency?.toLocaleString() ?? '—', color: '#4578be', coin: true },
                  { label: 'Niveau',   value: String(profile?.level ?? '—'),                       color: '#a855f7', coin: false },
                  { label: 'XP Total', value: String(profile?.total_exp ?? '—'),                   color: '#f59e0b', coin: false },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))' }}>
                    <div className="flex items-center gap-2">
                      {s.coin && <img src={COIN} alt="coin" className="w-4 h-4 object-contain rounded-full" />}
                      <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>{s.label}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6 relative overflow-hidden"
        style={{ background: 'rgb(var(--surface))' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 65% 65% at 50% 50%,rgba(69,120,190,0.1) 0%,transparent 65%)' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.88 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}>
            <motion.div
              animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="text-6xl mb-6 inline-block">
              🎯
            </motion.div>
            <h2 className="text-5xl md:text-6xl font-black mb-6" style={{ color: 'rgb(var(--text-primary))' }}>
              Prêt à Gagner ?
            </h2>
            <p className="text-xl mb-10" style={{ color: 'rgb(var(--text-secondary))' }}>
              Rejoins des milliers de joueurs et ouvre ta première case dès maintenant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={user ? '/boxes' : '/signup'}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 22px 55px rgba(69,120,190,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="px-12 py-5 rounded-2xl font-black text-xl text-white"
                  style={{ background: 'linear-gradient(135deg,#4578be,#2d5aa0)' }}>
                  {user ? '📦 Ouvrir une Case' : '🚀 S\'inscrire Gratuitement'}
                </motion.button>
              </Link>
              {!user && (
                <motion.button
                  onClick={() => openLoginModal()}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="px-12 py-5 rounded-2xl font-bold text-lg"
                  style={{
                    background: 'rgb(var(--surface-elevated))',
                    border: '1px solid rgb(var(--border))',
                    color: 'rgb(var(--text-primary))',
                  }}>
                  Se Connecter
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}