// app/boxes/page.tsx — Cohérence visuelle avec /boxes/[id]
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ArrowRight, Filter, X, Package, Flame,
  ChevronDown, TrendingUp, Users, Zap, Trophy, SlidersHorizontal
} from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'
import { useTheme } from '@/app/components/ThemeProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { DropsFeed } from '@/app/components/DropsFeed'

// ─── Palette warmth identique à /boxes/[id] ──────────────────────────────
const WARM = {
  gold:    '#C9A87C',
  goldDim: '#A08060',
  text1:   '#E8E0D5',
  text2:   '#C0B8AD',
  text3:   '#969087',
  text4:   '#6D675F',
  bg:      '#0C1220',
  card:    'rgba(201,168,124,0.05)',
  cardBorder: 'rgba(201,168,124,0.08)',
  sep:     'rgba(255,240,220,0.05)',
}
const COIN_LOGO = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png'

// ─── Types ─────────────────────────────────────────────────────────────────

interface LootBox {
  id: string; name: string; description: string
  price_virtual: number; price_real: number; image_url: string
  is_active: boolean; rarity?: string; limited?: boolean
  popular?: boolean; new?: boolean; items_count?: number
  risk_level?: number; average_return?: number; times_opened?: number
}
interface GlobalStats { totalOpenings: number; todayValue: number; todayPlayers: number; todayBestDrop: number }

// ─── Helpers ───────────────────────────────────────────────────────────────

function rarityColor(r: string) {
  return ({ common: '#10b981', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' } as Record<string,string>)[r] || '#10b981'
}
function calcRarity(p: number) { return p >= 400 ? 'legendary' : p >= 250 ? 'epic' : p >= 150 ? 'rare' : 'common' }
function calcRisk(p: number)   { return p >= 400 ? 85 : p >= 250 ? 70 : p >= 150 ? 50 : 30 }

// ─── Separator ─────────────────────────────────────────────────────────────

function WarmSeparator() {
  return (
    <div className="w-full my-8 sm:my-10 h-px" style={{
      background: `linear-gradient(90deg, transparent 5%, ${WARM.sep.replace('0.05','0.07')} 50%, transparent 95%)`
    }} />
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BoxesPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const router = useRouter()
  const supabase = createClient()
  const filterRef = useRef<HTMLDivElement>(null)

  const [boxes, setBoxes]               = useState<LootBox[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchQuery, setSearchQuery]   = useState('')
  const [sortBy, setSortBy]             = useState<'popular'|'price_asc'|'price_desc'|'risk'>('popular')
  const [showFilters, setShowFilters]   = useState(false)
  const [selectedRarity, setSelRarity] = useState('all')
  const [riskFilter, setRiskFilter]     = useState<'all'|'low'|'medium'|'high'>('all')
  const [priceRange, setPriceRange]     = useState<[number,number]>([0, 1000])
  const [globalStats, setGlobalStats]   = useState<GlobalStats | null>(null)

  // Light mode keeps a clean white-ish bg; dark mode matches /boxes/[id]
  const pageBg = isDark ? WARM.bg : '#f8f7f5'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    if (!showFilters) return
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showFilters])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [boxesRes, countRes] = await Promise.all([
        supabase.from('loot_boxes').select(`
          id, name, description, price_virtual, price_real, image_url, is_active, times_opened,
          loot_box_items!inner ( id )
        `).eq('is_active', true).neq('is_daily_free', true).order('price_virtual', { ascending: false }),
        supabase.from('user_inventory').select('id', { count: 'exact', head: true }).not('box_id', 'is', null)
      ])

      if (boxesRes.error) throw boxesRes.error
      if (!boxesRes.data?.length) { setBoxes([]); setLoading(false); return }

      const mapped: LootBox[] = boxesRes.data.map((b: any) => ({
        id: b.id, name: b.name, description: b.description || '',
        price_virtual: b.price_virtual, price_real: b.price_real || 0,
        image_url: b.image_url || '', is_active: b.is_active,
        items_count: b.loot_box_items?.length || 0,
        rarity: calcRarity(b.price_virtual),
        risk_level: calcRisk(b.price_virtual),
        limited: b.price_virtual >= 350,
        popular: [320, 220, 150].includes(b.price_virtual),
        new: b.name.toLowerCase().includes('new') || b.name.toLowerCase().includes('fresh'),
        times_opened: b.times_opened || 0,
      }))
      setBoxes(mapped)

      const prices = mapped.map(x => x.price_virtual)
      setPriceRange([Math.min(...prices), Math.max(...prices)])

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const { data: drops } = await supabase
        .from('user_inventory').select('id, user_id, items!inner(market_value)')
        .gte('obtained_at', today.toISOString()).not('box_id', 'is', null).limit(500)

      let todayValue = 0, todayBestDrop = 0
      const uids = new Set<string>()
      drops?.forEach((d: any) => {
        const v = d.items?.market_value || 0
        todayValue += v; if (v > todayBestDrop) todayBestDrop = v; uids.add(d.user_id)
      })
      setGlobalStats({ totalOpenings: countRes.count ?? 0, todayValue: Math.round(todayValue), todayPlayers: uids.size, todayBestDrop: Math.round(todayBestDrop) })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    let f = boxes.filter(b => {
      const q = searchQuery.toLowerCase()
      return (b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
        && (selectedRarity === 'all' || b.rarity === selectedRarity)
        && b.price_virtual >= priceRange[0] && b.price_virtual <= priceRange[1]
        && (riskFilter === 'all'
          || (riskFilter === 'low'    && (b.risk_level||0) < 40)
          || (riskFilter === 'medium' && (b.risk_level||0) >= 40 && (b.risk_level||0) < 70)
          || (riskFilter === 'high'   && (b.risk_level||0) >= 70))
        && b.is_active
    })
    switch (sortBy) {
      case 'price_asc':  return f.sort((a,b) => a.price_virtual - b.price_virtual)
      case 'price_desc': return f.sort((a,b) => b.price_virtual - a.price_virtual)
      case 'risk':       return f.sort((a,b) => (b.risk_level||0) - (a.risk_level||0))
      default:           return f.sort((a,b) => {
        if (a.popular !== b.popular) return a.popular ? -1 : 1
        if (a.new !== b.new) return a.new ? -1 : 1
        if (a.limited !== b.limited) return a.limited ? -1 : 1
        return b.price_virtual - a.price_virtual
      })
    }
  }, [boxes, searchQuery, selectedRarity, priceRange, riskFilter, sortBy])

  const activeFilters = (selectedRarity !== 'all' ? 1 : 0) + (riskFilter !== 'all' ? 1 : 0)

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-2 mx-auto mb-3"
            style={{
              borderColor: isDark ? WARM.cardBorder : 'rgba(0,0,0,0.08)',
              borderTopColor: isDark ? WARM.gold : 'rgba(0,0,0,0.3)',
            }} />
          <p className="text-xs" style={{ color: isDark ? WARM.text4 : 'rgba(0,0,0,0.3)' }}>
            Chargement des boîtes…
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // ── Text / border helpers (dark/light) ───────────────────────────────────
  const T1  = isDark ? WARM.text1 : 'rgba(0,0,0,0.88)'
  const T2  = isDark ? WARM.text2 : 'rgba(0,0,0,0.6)'
  const T3  = isDark ? WARM.text3 : 'rgba(0,0,0,0.38)'
  const T4  = isDark ? WARM.text4 : 'rgba(0,0,0,0.22)'
  const cardBg     = isDark ? WARM.card        : 'rgba(255,255,255,0.9)'
  const cardBorder = isDark ? WARM.cardBorder  : 'rgba(0,0,0,0.07)'
  const inputBg    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)'
  const inputBd    = isDark ? WARM.cardBorder  : 'rgba(0,0,0,0.09)'

  return (
    <div className="min-h-screen -mt-[80px] pt-[80px] pb-24 lg:pb-12 relative overflow-hidden"
      style={{ background: pageBg }}>

      {/* ── Background décor ──────────────────────────────────────────── */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          {/* Dot grid only — pas de halo visible */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.018,
            backgroundImage: 'radial-gradient(rgba(201,168,124,0.9) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>
      )}

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ── Live Drops feed ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          className="w-full px-6 sm:px-10 lg:px-16 pt-8 pb-4">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: T3 }}>
              Live Drops
            </span>
            <div className="relative flex items-center">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            </div>
          </div>
          <DropsFeed className="" />
        </motion.div>

        <WarmSeparator />

        {/* ── Hero Header ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="px-6 sm:px-10 lg:px-16 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ color: isDark ? WARM.gold + 'bb' : 'rgba(0,0,0,0.35)' }}>
                ReveelBox
              </p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: T1 }}>
                Loot Boxes
              </h1>
            </div>

            {/* Global stats pills */}
            {globalStats && (
              <div className="flex flex-wrap items-center gap-2.5">
                {[
                  { icon: Zap,        label: 'Ouvertures',  value: globalStats.totalOpenings.toLocaleString('fr-FR'),        color: '#60a5fa' },
                  { icon: TrendingUp, label: "Aujourd'hui", value: `${globalStats.todayValue.toLocaleString('fr-FR')}`,        isCoin: true, color: '#10b981' },
                  { icon: Users,      label: 'Joueurs',     value: globalStats.todayPlayers.toString(),                        color: '#818cf8' },
                  { icon: Trophy,     label: 'Best drop',   value: `${globalStats.todayBestDrop.toLocaleString('fr-FR')}`,    isCoin: true, color: '#60a5fa' },
                ].map(({ icon: Icon, label, value, color, isCoin }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
                    style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18` }}>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-medium leading-none mb-0.5" style={{ color: T3 }}>{label}</div>
                      <div className="flex items-center gap-1">
                        {isCoin && <img src={COIN_LOGO} alt="" className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span className="text-sm font-black leading-none" style={{ color }}>{value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <WarmSeparator />

        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="px-6 sm:px-10 lg:px-16 mb-10 flex flex-wrap items-center gap-2.5">

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: T4 }} />
            <input type="text" placeholder="Rechercher une box…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl text-sm focus:outline-none"
              style={{ background: inputBg, border: `1px solid ${inputBd}`, color: T1 }} />
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-0.5 p-1 rounded-2xl"
            style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${cardBorder}` }}>
            {([
              { v: 'popular',   l: 'Populaires' },
              { v: 'price_asc', l: 'Prix ↑' },
              { v: 'price_desc',l: 'Prix ↓' },
            ] as const).map(o => {
              const active = sortBy === o.v
              return (
                <button key={o.v} onClick={() => setSortBy(o.v)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active
                      ? isDark ? `linear-gradient(135deg,${WARM.gold}22,${WARM.goldDim}15)` : '#fff'
                      : 'transparent',
                    color: active ? (isDark ? WARM.gold : '#92400e') : T3,
                    border: active
                      ? isDark ? `1px solid ${WARM.gold}35` : '1px solid rgba(0,0,0,0.08)'
                      : '1px solid transparent',
                    boxShadow: active && !isDark ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {o.l}
                </button>
              )
            })}
          </div>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
              style={{
                background: showFilters || activeFilters > 0
                  ? isDark ? `${WARM.gold}14` : 'rgba(217,119,6,0.06)'
                  : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)',
                border: showFilters || activeFilters > 0
                  ? isDark ? `1px solid ${WARM.gold}35` : '1px solid rgba(217,119,6,0.2)'
                  : `1px solid ${inputBd}`,
                color: showFilters || activeFilters > 0 ? (isDark ? WARM.gold : '#92400e') : T3,
              }}>
              <SlidersHorizontal size={13} />
              Filtres
              {activeFilters > 0 && (
                <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: isDark ? WARM.gold : '#d97706' }}>
                  {activeFilters}
                </span>
              )}
              <ChevronDown size={11}
                style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-40 p-5 rounded-2xl w-72"
                  style={{
                    background: isDark ? 'rgba(10,15,24,0.98)' : '#fff',
                    border: isDark ? `1px solid ${WARM.cardBorder}` : '1px solid rgba(0,0,0,0.1)',
                    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.14)',
                    backdropFilter: 'blur(24px)',
                  }}>

                  {/* Rarity */}
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: T4 }}>Rareté</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {[
                      { v:'all',       l:'Toutes',      c: isDark ? WARM.text2 : '#64748b' },
                      { v:'common',    l:'Commune',     c:'#10b981' },
                      { v:'rare',      l:'Rare',        c:'#3b82f6' },
                      { v:'epic',      l:'Épique',      c:'#8b5cf6' },
                      { v:'legendary', l:'Légendaire',  c:'#f59e0b' },
                    ].map(r => {
                      const a = selectedRarity === r.v
                      return (
                        <button key={r.v} onClick={() => setSelRarity(r.v)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                          style={{
                            background: a ? `${r.c}1a` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            color: a ? r.c : T3,
                            border: a ? `1px solid ${r.c}40` : '1px solid transparent',
                          }}>
                          {r.l}
                        </button>
                      )
                    })}
                  </div>

                  <div className="h-px mb-4" style={{ background: isDark ? WARM.sep : 'rgba(0,0,0,0.06)' }} />

                  {/* Risk */}
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: T4 }}>Risque</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {[
                      { v:'all',    l:'Tous',   c: isDark ? WARM.text2 : '#64748b' },
                      { v:'low',    l:'Faible', c:'#10b981' },
                      { v:'medium', l:'Moyen',  c:'#f59e0b' },
                      { v:'high',   l:'Élevé',  c:'#ef4444' },
                    ].map(r => {
                      const a = riskFilter === r.v
                      return (
                        <button key={r.v} onClick={() => setRiskFilter(r.v as typeof riskFilter)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                          style={{
                            background: a ? `${r.c}1a` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            color: a ? r.c : T3,
                            border: a ? `1px solid ${r.c}40` : '1px solid transparent',
                          }}>
                          {r.l}
                        </button>
                      )
                    })}
                  </div>

                  <div className="h-px mb-4" style={{ background: isDark ? WARM.sep : 'rgba(0,0,0,0.06)' }} />

                  {/* Price range */}
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: T4 }}>
                    Prix : {priceRange[0]} – {priceRange[1]} coins
                  </p>
                  <div className="space-y-2.5 mb-4">
                    {(['Min','Max'] as const).map((lbl, i) => (
                      <div key={lbl} className="flex items-center gap-2.5">
                        <span className="text-[10px] w-5 flex-shrink-0" style={{ color: T4 }}>{lbl}</span>
                        <input type="range" min={0} max={1000}
                          value={priceRange[i]}
                          onChange={e => setPriceRange(i === 0 ? [+e.target.value, priceRange[1]] : [priceRange[0], +e.target.value])}
                          className="flex-1 h-1 appearance-none cursor-pointer rounded-full"
                          style={{ accentColor: isDark ? WARM.gold : '#d97706' }} />
                      </div>
                    ))}
                  </div>

                  {(selectedRarity !== 'all' || riskFilter !== 'all' || searchQuery) && (
                    <>
                      <div className="h-px mb-3" style={{ background: isDark ? WARM.sep : 'rgba(0,0,0,0.06)' }} />
                      <button onClick={() => { setSelRarity('all'); setRiskFilter('all'); setPriceRange([0,1000]); setSearchQuery('') }}
                        className="flex items-center gap-1.5 text-[11px] font-medium hover:opacity-70 transition-opacity"
                        style={{ color: T3 }}>
                        <X size={10} /> Réinitialiser
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Count */}
          <span className="ml-auto text-xs" style={{ color: T4 }}>
            {filtered.length} boîte{filtered.length !== 1 ? 's' : ''}
          </span>
        </motion.div>

        {/* ── Grid ──────────────────────────────────────────────────── */}
        <div className="px-6 sm:px-10 lg:px-16 pb-10">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                style={{ background: isDark ? WARM.card : 'rgba(0,0,0,0.04)', border: `1px solid ${cardBorder}` }}>
                <Package size={32} style={{ color: T4 }} />
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: T2 }}>
                {boxes.length === 0 ? 'Aucune boîte disponible' : 'Aucun résultat'}
              </h3>
              <p className="text-sm mb-6" style={{ color: T3 }}>
                {boxes.length === 0 ? 'Les boîtes seront bientôt disponibles.' : 'Essayez d\'autres filtres.'}
              </p>
              {boxes.length > 0 && filtered.length === 0 && (
                <button onClick={() => { setSelRarity('all'); setRiskFilter('all'); setPriceRange([0,1000]); setSearchQuery('') }}
                  className="text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: isDark ? WARM.gold : '#d97706' }}>
                  Réinitialiser les filtres
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-7 lg:gap-8">
              {filtered.map((box, idx) => (
                <BoxCard key={box.id} box={box} index={idx}
                  canAfford={profile ? profile.virtual_currency >= box.price_virtual : false}
                  hasUser={!!user}
                  onBoxClick={id => router.push(`/boxes/${id}`)}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Box Card ──────────────────────────────────────────────────────────────

function BoxCard({
  box, index, canAfford, hasUser, onBoxClick, isDark
}: {
  box: LootBox; index: number; canAfford: boolean; hasUser: boolean
  onBoxClick: (id: string) => void; isDark: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const glow  = rarityColor(box.rarity || 'common')
  const isHot = (box.times_opened || 0) >= 50

  const T1 = isDark ? WARM.text1 : 'rgba(0,0,0,0.88)'
  const T3 = isDark ? WARM.text3 : 'rgba(0,0,0,0.38)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.035, 0.55), ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="cursor-pointer group relative"
      onClick={() => onBoxClick(box.id)}
    >
      {/* Rarity stripe */}
      <div className="h-[2px] rounded-full mb-5"
        style={{ background: `linear-gradient(90deg, transparent, ${glow}cc 35%, ${glow}cc 65%, transparent)` }} />

      {/* Badges */}
      <div className="absolute top-4 right-0 z-20 flex flex-col items-end gap-1">
        {box.limited && (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase text-white"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', boxShadow: '0 2px 8px rgba(139,92,246,0.35)' }}>
            Limited
          </span>
        )}
        {isHot && (
          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase text-white"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 2px 8px rgba(239,68,68,0.35)' }}>
            <Flame size={8} />Hot
          </span>
        )}
      </div>

      {/* Image — floating naturel */}
      <div className="flex items-center justify-center pb-4" style={{ height: '10.5rem' }}>
        <motion.img
          src={box.image_url}
          alt={box.name}
          className="w-full object-contain h-full"
          animate={{
            filter: hovered
              ? `drop-shadow(0 12px 28px ${glow}60) brightness(1.08)`
              : `drop-shadow(0 4px 14px ${glow}28) brightness(1)`,
            scale: hovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.28 }}
          onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiMxMjFhMmUiLz48L3N2Zz4=' }}
        />
      </div>

      {/* Name */}
      <h3 className="text-[13px] font-bold truncate mb-2 leading-tight" style={{ color: T1 }}>
        {box.name}
      </h3>

      {/* Rarity + Price row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: glow }} />
          <span className="text-[9px] font-bold uppercase tracking-wide truncate" style={{ color: glow }}>
            {box.rarity ? box.rarity.charAt(0).toUpperCase() + box.rarity.slice(1) : 'Common'}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <img src={COIN_LOGO} alt="coins" className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[13px] font-black" style={{ color: T1 }}>
            {box.price_virtual.toLocaleString('fr-FR')}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
