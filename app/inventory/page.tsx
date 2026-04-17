'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/app/components/ThemeProvider'
import {
  Package, Search, X, ChevronDown, ArrowRight,
  Filter, CheckCircle, DollarSign, AlertCircle, Sparkles,
  SlidersHorizontal, TrendingUp, Gem, Zap
} from 'lucide-react'
import { useAuth } from '../components/AuthProvider'
import { createClient } from '@/utils/supabase/client'

// ── OPEN ─────────────────────────────────────────────────────────────────────
const playInventoryOpen = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = reverbBuf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8)
  }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const size = Math.floor(audioCtx.sampleRate * 0.2)
  const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate)
  const d = buf.getChannelData(0); for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1)
  const src = audioCtx.createBufferSource(); src.buffer = buf
  const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 3
  filt.frequency.setValueAtTime(300, now); filt.frequency.exponentialRampToValueAtTime(3000, now + 0.2)
  const g = audioCtx.createGain()
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.35, now + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
  src.connect(filt); filt.connect(g); g.connect(master); g.connect(reverb)
  src.start(now); src.stop(now + 0.25)
}

// ── CLOSE ────────────────────────────────────────────────────────────────────
const playInventoryClose = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = reverbBuf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8)
  }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const size = Math.floor(audioCtx.sampleRate * 0.16)
  const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate)
  const d = buf.getChannelData(0); for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1)
  const src = audioCtx.createBufferSource(); src.buffer = buf
  const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 3
  filt.frequency.setValueAtTime(3000, now); filt.frequency.exponentialRampToValueAtTime(300, now + 0.16)
  const g = audioCtx.createGain()
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.35, now + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
  src.connect(filt); filt.connect(g); g.connect(master); g.connect(reverb)
  src.start(now); src.stop(now + 0.2)
}

// ── C5 (navigation / actions) ─────────────────────────────────────────────────
const playC5 = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.2), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = reverbBuf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2)
  }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.8; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.5; reverb.connect(wet); wet.connect(master)
  const mkOsc = (dest: AudioNode, freq: number, start: number, dur: number, gain: number) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(gain, start + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g); g.connect(dest as any); o.start(start); o.stop(start + dur + 0.05)
  }
  mkOsc(master, 880, now, 0.07, 0.18); mkOsc(master, 1320, now + 0.04, 0.07, 0.15)
  mkOsc(reverb, 880, now, 0.5, 0.08); mkOsc(reverb, 1320, now + 0.04, 0.4, 0.06)
}

// ── FILTER TICK (tri / filtre) ────────────────────────────────────────────────
const playFilterTick = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const master = audioCtx.createGain(); master.gain.value = 0.55; master.connect(audioCtx.destination)
  // Petit "clic" métallique court — deux partiels proches qui créent un battement
  const mkTone = (freq: number, start: number, dur: number, gain: number) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
    o.type = 'triangle'; o.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(gain, start + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g); g.connect(master); o.start(start); o.stop(start + dur + 0.01)
  }
  mkTone(1800, now,        0.06, 0.22)
  mkTone(2400, now,        0.05, 0.12)
  mkTone(1200, now + 0.03, 0.04, 0.08)
  // Légère résonance métallique
  const filt = audioCtx.createBiquadFilter(); filt.type = 'peaking'
  filt.frequency.value = 2000; filt.Q.value = 8; filt.gain.value = 6
}

const COIN_LOGO = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png'

// ─── Types ─────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string
  user_id: string
  item_id: string
  quantity: number
  obtained_at: string
  items?: {
    id: string
    name: string
    description?: string
    rarity: string
    image_url?: string
    market_value: number
  }
}

interface Toast { id: string; type: 'success' | 'error'; title: string; message?: string }

// ─── Rarity config ─────────────────────────────────────────────────────────

const RARITY: Record<string, { color: string; label: string; bg: string }> = {
  common:    { color: '#22d3a5', label: 'Commune',   bg: 'rgba(34,211,165,0.12)'  },
  rare:      { color: '#60a5fa', label: 'Rare',      bg: 'rgba(96,165,250,0.12)'  },
  epic:      { color: '#a78bfa', label: 'Épique',    bg: 'rgba(167,139,250,0.12)' },
  legendary: { color: '#fbbf24', label: 'Légendaire',bg: 'rgba(251,191,36,0.12)'  },
  mythic:    { color: '#f472b6', label: 'Mythique',  bg: 'rgba(244,114,182,0.12)' },
}
const getRarity = (r?: string) => RARITY[r || ''] || RARITY.common

// ─── Toast system ──────────────────────────────────────────────────────────

function ToastZone({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed top-[76px] right-4 z-[80] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 72, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 72, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="pointer-events-auto flex items-start gap-3 pl-3 pr-4 py-3 rounded-2xl max-w-[300px]"
            style={{
              background: t.type === 'success'
                ? 'linear-gradient(135deg,rgba(16,185,129,0.14),rgba(6,182,212,0.08))'
                : 'linear-gradient(135deg,rgba(239,68,68,0.14),rgba(220,38,38,0.08))',
              border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
              backdropFilter: 'blur(24px)',
              boxShadow: t.type === 'success'
                ? '0 8px 32px rgba(16,185,129,0.12)'
                : '0 8px 32px rgba(239,68,68,0.12)',
            }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: t.type === 'success' ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)' }}>
              {t.type === 'success'
                ? <Sparkles size={13} style={{ color: '#10b981' }} />
                : <AlertCircle size={13} style={{ color: '#ef4444' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-snug"
                style={{ color: t.type === 'success' ? '#10b981' : '#ef4444' }}>{t.title}</p>
              {t.message && (
                <p className="text-[11px] mt-0.5 leading-snug opacity-75"
                  style={{ color: t.type === 'success' ? '#10b981' : '#ef4444' }}>{t.message}</p>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} className="opacity-40 hover:opacity-90 transition-opacity mt-0.5 flex-shrink-0"
              style={{ color: t.type === 'success' ? '#10b981' : '#ef4444' }}>
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { user, loading, isAuthenticated, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [inventory, setInventory]         = useState<InventoryItem[]>([])
  const [inventoryLoading, setIL]         = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filterRarity, setFilterRarity]   = useState('all')
  const [searchQuery, setSearchQuery]     = useState('')
  const [sortBy, setSortBy]               = useState<'recent'|'value_desc'|'value_asc'|'rarity'>('recent')
  const [toasts, setToasts]               = useState<Toast[]>([])
  const [sellLoading, setSellLoading]     = useState(false)
  const [sellingId, setSellingId]         = useState<string | null>(null)
  const [showFilters, setShowFilters]     = useState(false)
  const filterRef                         = useRef<HTMLDivElement>(null)
  const isLoading                         = useRef(false)

  const toast = useCallback((type: 'success'|'error', title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { id, type, title, message }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500)
  }, [])

  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user?.id) loadInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  // Real-time sync: item sold from navbar cart
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    const ch = supabase
      .channel(`inv-sync-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_inventory', filter: `user_id=eq.${user.id}` }, p => {
        if (p.new?.is_sold === true) {
          const id = p.new.id as string
          setInventory(prev => prev.filter(i => i.id !== id))
          setSelectedItems(prev => prev.filter(x => x !== id))
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_inventory', filter: `user_id=eq.${user.id}` }, () => {
        loadInventory()
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  useEffect(() => {
    if (!showFilters) return
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilters(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showFilters])

  const loadInventory = async () => {
    if (!user?.id || isLoading.current) return
    isLoading.current = true
    try {
      setIL(true)
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*, items(id,name,description,rarity,image_url,market_value)')
        .eq('user_id', user.id)
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false })
      if (error) { toast('error', 'Erreur', 'Impossible de charger l\'inventaire'); return }
      setInventory(data || [])
    } catch { toast('error', 'Erreur', 'Une erreur est survenue') }
    finally { setIL(false); isLoading.current = false }
  }

  const handleSellItem = async (itemId: string) => {
    if (sellLoading) return
    try {
      setSellLoading(true); setSellingId(itemId)
      const { data, error } = await supabase.rpc('sell_inventory_item_fixed', { p_inventory_item_id: itemId })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Vente échouée')
      await new Promise(r => setTimeout(r, 280))
      setInventory(p => p.filter(i => i.id !== itemId))
      setSelectedItems(p => p.filter(x => x !== itemId))
      await refreshProfile()
      toast('success', 'Objet vendu !', `${data.item_name} · +${data.coins_earned.toLocaleString()} coins`)
    } catch (err) {
      toast('error', 'Vente échouée', err instanceof Error ? err.message : 'Erreur inconnue')
    } finally { setSellLoading(false); setSellingId(null) }
  }

  const handleSellSelected = async () => {
    if (!selectedItems.length || sellLoading) return
    try {
      setSellLoading(true)
      const { data, error } = await supabase.rpc('sell_multiple_items_fixed', { p_inventory_item_ids: selectedItems })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Vente échouée')
      const sold = [...selectedItems]
      setInventory(p => p.filter(i => !sold.includes(i.id)))
      setSelectedItems([])
      await refreshProfile()
      toast('success', `${data.items_sold} objets vendus`, `+${data.total_coins_earned.toLocaleString()} coins`)
    } catch (err) {
      toast('error', 'Vente échouée', err instanceof Error ? err.message : 'Erreur inconnue')
    } finally { setSellLoading(false) }
  }

  const items = useMemo(() => {
    let f = inventory.filter(i => {
      const name = i.items?.name?.toLowerCase() || ''
      const desc = i.items?.description?.toLowerCase() || ''
      const q = searchQuery.toLowerCase()
      return (name.includes(q) || desc.includes(q)) && (filterRarity === 'all' || i.items?.rarity === filterRarity)
    })
    const rarityOrder: Record<string, number> = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 }
    switch (sortBy) {
      case 'value_desc': return f.sort((a, b) => (b.items?.market_value || 0) - (a.items?.market_value || 0))
      case 'value_asc':  return f.sort((a, b) => (a.items?.market_value || 0) - (b.items?.market_value || 0))
      case 'rarity':     return f.sort((a, b) => (rarityOrder[b.items?.rarity || ''] || 0) - (rarityOrder[a.items?.rarity || ''] || 0))
      default:           return f.sort((a, b) => new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime())
    }
  }, [inventory, searchQuery, filterRarity, sortBy])

  const stats = useMemo(() => {
    const totalValue = inventory.reduce((s, i) => s + (i.items?.market_value || 0) * (i.quantity || 1), 0)
    const selValue   = selectedItems.reduce((s, id) => {
      const i = inventory.find(x => x.id === id)
      return s + (i?.items?.market_value || 0) * (i?.quantity || 1)
    }, 0)
    const best = inventory.reduce((b, i) => Math.max(b, (i.items?.market_value || 0) * (i.quantity || 1)), 0)
    return { total: inventory.length, totalValue, selValue, selCount: selectedItems.length, best }
  }, [inventory, selectedItems])

  const toggleSel = (id: string) => {
    const isSelected = selectedItems.includes(id)
    if (isSelected) { playInventoryClose() } else { playInventoryOpen() }
    selectAllSoundFiredRef.current = false
    setSelectedItems(p => isSelected ? p.filter(x => x !== id) : [...p, id])
  }
  const isAllSel = items.length > 0 && selectedItems.length === items.length
  const selectAllSoundFiredRef = useRef(false)

  if (loading || inventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg,#070c18 0%,#0c1527 100%)' }}>
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-2 mx-auto mb-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'rgba(255,255,255,0.3)' }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Chargement…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const bgStyle = isDark
    ? { background: '#0C1220' }
    : { background: '#f1f5f9' }

  return (
    <div className="min-h-screen -mt-[80px] pt-[80px]" style={bgStyle}>

      {/* ── Background décor ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {isDark && (
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.015,
            backgroundImage: 'radial-gradient(rgba(59,130,246,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        )}
      </div>

      <ToastZone toasts={toasts} dismiss={dismissToast} />

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="px-6 sm:px-10 lg:px-16 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            {/* Left */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ color: isDark ? 'rgba(59,130,246,0.7)' : 'rgba(59,130,246,0.8)' }}>
                Ma Collection
              </p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight"
                style={{ color: isDark ? '#fff' : '#0f172a' }}>
                Inventaire
              </h1>
            </div>

            {/* Stats inline pills */}
            <div className="flex flex-wrap items-center gap-3">
              {[
                { icon: Package, label: 'Items', value: stats.total, color: '#60a5fa' },
                { icon: TrendingUp, label: 'Valeur', value: stats.totalValue, color: '#22d3a5', isCoin: true },
                { icon: Gem, label: 'Meilleur', value: stats.best, color: '#fbbf24', isCoin: true },
              ].map(({ icon: Icon, label, value, color, isCoin }) => (
                <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
                    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)',
                  }}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}>
                      {label}
                    </div>
                    <div className="flex items-center gap-1">
                      {isCoin && <img src={COIN_LOGO} alt="" className="w-3.5 h-3.5" />}
                      <span className="text-sm font-black" style={{ color }}>
                        {value.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div className="mx-6 sm:mx-10 lg:mx-16 h-px mb-8" style={{
          background: isDark
            ? 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06) 30%,rgba(255,255,255,0.06) 70%,transparent)'
            : 'linear-gradient(90deg,transparent,rgba(0,0,0,0.07) 30%,rgba(0,0,0,0.07) 70%,transparent)',
        }} />

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="px-6 sm:px-10 lg:px-16 mb-8 flex flex-wrap items-center gap-2.5">

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }} />
            <input type="text" placeholder="Rechercher un objet…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl text-sm focus:outline-none"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
              }} />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-0.5 p-1 rounded-2xl"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
            }}>
            {([
              { v: 'recent',     l: 'Récents' },
              { v: 'value_desc', l: 'Prix ↓'  },
              { v: 'value_asc',  l: 'Prix ↑'  },
              { v: 'rarity',     l: 'Rareté'  },
            ] as const).map(o => {
              const active = sortBy === o.v
              return (
                <button key={o.v} onClick={() => { playFilterTick(); setSortBy(o.v) }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? isDark ? 'rgba(255,255,255,0.1)' : '#fff' : 'transparent',
                    color: active ? isDark ? '#fff' : '#0f172a' : isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
                    boxShadow: active && !isDark ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {o.l}
                </button>
              )
            })}
          </div>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button onClick={() => { playFilterTick(); setShowFilters(v => !v) }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
              style={{
                background: showFilters || filterRarity !== 'all'
                  ? 'rgba(59,130,246,0.12)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                border: showFilters || filterRarity !== 'all'
                  ? '1px solid rgba(59,130,246,0.25)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                color: showFilters || filterRarity !== 'all' ? '#60a5fa' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              }}>
              <SlidersHorizontal size={13} />
              Filtres
              {filterRarity !== 'all' && (
                <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                  style={{ background: '#3b82f6' }}>1</span>
              )}
              <ChevronDown size={11} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-40 p-4 rounded-2xl w-64"
                  style={{
                    background: isDark ? 'rgba(8,14,26,0.98)' : '#fff',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.14)',
                    backdropFilter: 'blur(24px)',
                  }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>Rareté</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { v: 'all',       l: 'Toutes',     c: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' },
                      { v: 'common',    l: 'Commune',    c: '#22d3a5' },
                      { v: 'rare',      l: 'Rare',       c: '#60a5fa' },
                      { v: 'epic',      l: 'Épique',     c: '#a78bfa' },
                      { v: 'legendary', l: 'Légendaire', c: '#fbbf24' },
                      { v: 'mythic',    l: 'Mythique',   c: '#f472b6' },
                    ].map(r => {
                      const active = filterRarity === r.v
                      return (
                        <button key={r.v} onClick={() => { playFilterTick(); setFilterRarity(r.v) }}
                          className="py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all text-center"
                          style={{
                            background: active ? `${r.c}1a` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            color: active ? r.c : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
                            border: active ? `1px solid ${r.c}40` : '1px solid transparent',
                          }}>
                          {r.l}
                        </button>
                      )
                    })}
                  </div>
                  {(filterRarity !== 'all' || searchQuery) && (
                    <>
                      <div className="h-px my-3" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                      <button onClick={() => { playFilterTick(); setFilterRarity('all'); setSearchQuery('') }}
                        className="flex items-center gap-1.5 text-[11px] font-medium hover:opacity-70 transition-opacity"
                        style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}>
                        <X size={10} /> Réinitialiser
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Select all */}
          <button
            onClick={() => {
              if (isAllSel) {
                playInventoryClose()
                selectAllSoundFiredRef.current = false
                setSelectedItems([])
              } else {
                if (!selectAllSoundFiredRef.current) {
                  playInventoryOpen()
                  selectAllSoundFiredRef.current = true
                }
                setSelectedItems(items.map(i => i.id))
              }
            }}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all"
            style={{
              background: selectedItems.length > 0 ? 'rgba(59,130,246,0.1)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              border: selectedItems.length > 0 ? '1px solid rgba(59,130,246,0.22)' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              color: selectedItems.length > 0 ? '#60a5fa' : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
            }}>
            {isAllSel ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>

          {/* Result count */}
          <span className="ml-auto text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }}>
            {items.length} résultat{items.length !== 1 ? 's' : ''}
          </span>
        </motion.div>

        {/* ── Grid ─────────────────────────────────────────────────── */}
        <div className="px-6 sm:px-10 lg:px-16 pb-32">
          {items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-28">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                <Package size={32} style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                {inventory.length === 0 ? 'Inventaire vide' : 'Aucun résultat'}
              </h3>
              <p className="text-sm mb-6" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>
                {inventory.length === 0 ? 'Ouvrez des boxes pour remplir votre inventaire.' : 'Essayez d\'autres filtres.'}
              </p>
              {inventory.length === 0 ? (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { playC5(); router.push('/boxes') }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
                  Ouvrir des boxes <ArrowRight size={14} />
                </motion.button>
              ) : (
                <button onClick={() => { playFilterTick(); setFilterRarity('all'); setSearchQuery('') }}
                  className="text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: '#60a5fa' }}>
                  Réinitialiser les filtres
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5">
              {items.map((item, idx) => (
                <ItemCard key={item.id} item={item} index={idx}
                  isSelected={selectedItems.includes(item.id)}
                  isSelling={sellingId === item.id}
                  onSelect={() => toggleSel(item.id)}
                  onSell={() => handleSellItem(item.id)}
                  sellLoading={sellLoading}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating sell bar ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 56, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 56, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-1.5 p-1.5 rounded-[20px]"
              style={{
                background: isDark ? 'rgba(6,12,22,0.96)' : 'rgba(255,255,255,0.97)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                boxShadow: isDark
                  ? '0 24px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset'
                  : '0 24px 72px rgba(0,0,0,0.18)',
                backdropFilter: 'blur(32px)',
              }}>

              {/* Badge + info */}
              <div className="flex items-center gap-3 pl-3 pr-4 py-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  {stats.selCount}
                </div>
                <div>
                  <div className="text-[10px] font-medium mb-0.5"
                    style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                    Sélectionnés
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img src={COIN_LOGO} alt="" className="w-3.5 h-3.5" />
                    <span className="text-sm font-black"
                      style={{ color: isDark ? '#fff' : '#0f172a' }}>
                      {stats.selValue.toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-9 flex-shrink-0"
                style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />

              {/* Annuler */}
              <button onClick={() => { playInventoryClose(); selectAllSoundFiredRef.current = false; setSelectedItems([]) }}
                className="px-4 py-3 rounded-[14px] text-xs font-semibold transition-all hover:opacity-70"
                style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                Annuler
              </button>

              {/* Vendre */}
              <motion.button onClick={handleSellSelected} disabled={sellLoading}
                whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 px-5 py-3 rounded-[14px] text-xs font-black text-white disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                }}>
                {sellLoading
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                  : <><DollarSign size={13} /> Vendre{stats.selCount > 1 ? ` (${stats.selCount})` : ''}</>
                }
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Item Card ──────────────────────────────────────────────────────────────

function ItemCard({
  item, index, isSelected, isSelling, onSelect, onSell, sellLoading, isDark
}: {
  item: InventoryItem; index: number; isSelected: boolean; isSelling: boolean
  onSelect: () => void; onSell: () => void; sellLoading: boolean; isDark: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const r = getRarity(item.items?.rarity)
  const price = (item.items?.market_value || 0) * (item.quantity || 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: isSelling ? 0 : 1,
        y: isSelling ? -24 : 0,
        scale: isSelling ? 0.88 : 1,
      }}
      transition={isSelling
        ? { duration: 0.3 }
        : { duration: 0.38, delay: Math.min(index * 0.022, 0.45), ease: [0.23, 1, 0.32, 1] }
      }
      whileHover={{ y: -5 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="cursor-pointer group"
      onClick={onSelect}
    >
      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          background: isDark
            ? isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)'
            : isSelected ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.85)',
          border: `1px solid ${
            isSelected ? 'rgba(59,130,246,0.4)'
            : hovered ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')
            : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
          }`,
          boxShadow: isSelected
            ? `0 0 0 2px rgba(59,130,246,0.2)`
            : hovered
              ? isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.1)'
              : isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 1px 6px rgba(0,0,0,0.04)',
        }}>

        {/* Rarity top accent */}
        <div className="h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${r.color}bb 35%, ${r.color}bb 65%, transparent)` }} />

        {/* Image area */}
        <div className="relative px-3 pt-5 pb-2">
          {/* Sell flash animation */}
          <AnimatePresence>
            {isSelling && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }}
                transition={{ duration: 0.35, times: [0, 0.3, 1] }}
                className="absolute inset-0 z-20 flex items-center justify-center rounded-xl"
                style={{ background: `${r.color}25` }}>
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1.4, opacity: [0, 1, 0] }}
                  transition={{ duration: 0.35 }}>
                  <Sparkles size={22} style={{ color: r.color }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Checkbox */}
          <motion.div
            animate={{ opacity: isSelected || hovered ? 1 : 0, scale: isSelected ? 1 : hovered ? 0.9 : 0.7 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
            style={isSelected ? {
              background: '#3b82f6',
              boxShadow: '0 2px 10px rgba(59,130,246,0.5)',
            } : {
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
            }}>
            {isSelected && <CheckCircle size={11} className="text-white" />}
          </motion.div>

          {/* Qty badge */}
          {item.quantity > 1 && (
            <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md text-[9px] font-black"
              style={{
                background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)',
                color: 'rgba(255,255,255,0.9)',
              }}>
              ×{item.quantity}
            </div>
          )}

          {/* Image */}
          <motion.img
            src={item.items?.image_url}
            alt={item.items?.name}
            className="w-full object-contain"
            style={{ height: '7.5rem' }}
            animate={{
              filter: hovered
                ? `drop-shadow(0 8px 20px ${r.color}55) brightness(1.05)`
                : `drop-shadow(0 3px 8px rgba(0,0,0,0.25)) brightness(1)`,
              scale: hovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.25 }}
            onError={e => {
              const t = e.target as HTMLImageElement
              t.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDE2MCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxNjAiIGZpbGw9IiMxZTI5M2IiLz48L3N2Zz4='
            }}
          />
        </div>

        {/* Divider */}
        <div className="mx-3 h-px" style={{
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        }} />

        {/* Info */}
        <div className="px-3 pt-2.5 pb-3">
          {/* Rarity label */}
          <div className="inline-flex items-center gap-1 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: r.color }}>
              {r.label}
            </span>
          </div>

          {/* Name */}
          <h3 className="text-[12px] font-bold truncate mb-2 leading-tight"
            style={{ color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)' }}>
            {item.items?.name || 'Objet inconnu'}
          </h3>

          {/* Price + sell */}
          <div className="flex items-center justify-between gap-1">
            {/* Price with coin logo */}
            <div className="flex items-center gap-1.5">
              <img src={COIN_LOGO} alt="coins" className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-black" style={{ color: isDark ? '#fff' : '#0f172a' }}>
                {price.toLocaleString('fr-FR')}
              </span>
            </div>

            {/* Sell CTA */}
            <motion.button
              onClick={e => { e.stopPropagation(); onSell() }}
              disabled={sellLoading}
              animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 4 }}
              transition={{ duration: 0.15 }}
              whileTap={{ scale: 0.92 }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold disabled:opacity-30 flex-shrink-0"
              style={{
                background: `${r.color}18`,
                color: r.color,
                border: `1px solid ${r.color}30`,
              }}>
              <DollarSign size={9} />
              Vendre
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}