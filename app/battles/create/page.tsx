'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, X, Search, Heart, Crown, Zap, Shield, Users,
  Target, Star, AlertCircle, Swords, Save, BookOpen, Trash2, Bot,
  Sparkles, ChevronDown, Settings2, Lock, Unlock, History, Gem,
  Link, Copy, Check
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'

// ─────────────────────────────────────────────────────────────────────────────
// SONS
// ─────────────────────────────────────────────────────────────────────────────

// OPEN — activation / sélection
const playInventoryOpen = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const size = Math.floor(audioCtx.sampleRate * 0.2)
  const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate)
  const d = buf.getChannelData(0); for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1)
  const src = audioCtx.createBufferSource(); src.buffer = buf
  const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 3
  filt.frequency.setValueAtTime(300, now); filt.frequency.exponentialRampToValueAtTime(3000, now + 0.2)
  const g = audioCtx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.35, now + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
  src.connect(filt); filt.connect(g); g.connect(master); g.connect(reverb); src.start(now); src.stop(now + 0.25)
}

// CLOSE — désactivation / déselection
const playInventoryClose = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const size = Math.floor(audioCtx.sampleRate * 0.16)
  const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate)
  const d = buf.getChannelData(0); for (let i = 0; i < size; i++) d[i] = (Math.random() * 2 - 1)
  const src = audioCtx.createBufferSource(); src.buffer = buf
  const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 3
  filt.frequency.setValueAtTime(3000, now); filt.frequency.exponentialRampToValueAtTime(300, now + 0.16)
  const g = audioCtx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.35, now + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
  src.connect(filt); filt.connect(g); g.connect(master); g.connect(reverb); src.start(now); src.stop(now + 0.2)
}

// C5 — actions importantes (créer bataille, retour)
const playC5 = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.2), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.8; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.5; reverb.connect(wet); wet.connect(master)
  const mkOsc = (dest: AudioNode, freq: number, start: number, dur: number, gain: number) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'
    o.frequency.setValueAtTime(freq, start); g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(gain, start + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g); g.connect(dest as any); o.start(start); o.stop(start + dur + 0.05)
  }
  mkOsc(master, 880, now, 0.07, 0.18); mkOsc(master, 1320, now + 0.04, 0.07, 0.15)
  mkOsc(reverb, 880, now, 0.5, 0.08); mkOsc(reverb, 1320, now + 0.04, 0.4, 0.06)
}

// FILTER TICK — filtres, tris, toggles légers
const playFilterTick = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const master = audioCtx.createGain(); master.gain.value = 0.55; master.connect(audioCtx.destination)
  const mkTone = (freq: number, start: number, dur: number, gain: number) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'triangle'
    o.frequency.setValueAtTime(freq, start); g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(gain, start + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g); g.connect(master); o.start(start); o.stop(start + dur + 0.01)
  }
  mkTone(1800, now, 0.06, 0.22); mkTone(2400, now, 0.05, 0.12); mkTone(1200, now + 0.03, 0.04, 0.08)
}

// BOX ADD — ajouter une case au panier (son cristallin montant)
const playBoxAdd = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 0.8), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.5) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.7; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.4; reverb.connect(wet); wet.connect(master)
  // Arpège montant 3 notes — son "collecte" satisfaisant
  const notes = [523, 659, 784] // Do, Mi, Sol
  notes.forEach((freq, i) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.setValueAtTime(freq, now + i * 0.07)
    g.gain.setValueAtTime(0, now + i * 0.07); g.gain.linearRampToValueAtTime(0.25, now + i * 0.07 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.18)
    o.connect(g); g.connect(master); g.connect(reverb); o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.2)
    // Harmonique douce
    const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain()
    o2.type = 'triangle'; o2.frequency.setValueAtTime(freq * 2, now + i * 0.07)
    g2.gain.setValueAtTime(0, now + i * 0.07); g2.gain.linearRampToValueAtTime(0.07, now + i * 0.07 + 0.008); g2.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.1)
    o2.connect(g2); g2.connect(master); o2.start(now + i * 0.07); o2.stop(now + i * 0.07 + 0.12)
  })
}

// BOX REMOVE — retirer une case (son descendant)
const playBoxRemove = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const master = audioCtx.createGain(); master.gain.value = 0.55; master.connect(audioCtx.destination)
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
  o.type = 'sine'; o.frequency.setValueAtTime(440, now); o.frequency.exponentialRampToValueAtTime(220, now + 0.12)
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.2, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
  o.connect(g); g.connect(master); o.start(now); o.stop(now + 0.16)
}

const supabase = createClient()
const COIN_LOGO = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png'

interface LootBox {
  id: string
  name: string
  image_url: string
  price_virtual: string
  price_reevs?: string | null
  currency_type?: string
  is_daily_free: boolean
  quantity?: number
}
interface User {
  id: string
  email?: string
  username?: string
  virtual_currency: number
  reevs?: number
  level?: number
}
interface BattleTemplate {
  id: string
  name: string
  modes: string[]
  teamConfig: string
  boxes: { id: string; quantity: number; name: string; price_virtual: string; image_url: string }[]
  createdAt: number
}
interface BattleHistoryEntry {
  id: string
  mode: string
  modifiers: string[]
  teamConfig: string
  totalValue: number
  totalBoxes: number
  isReevs: boolean
  boxes: { id: string; quantity: number; name: string; price_virtual: string; image_url: string }[]
  createdAt: number
}

const GAME_MODES = [
  { id: 'classic',  name: 'Classic',  icon: Crown,  isModifier: false },
  { id: 'crazy',    name: 'Crazy',    icon: Zap,    isModifier: false },
  { id: 'shared',   name: 'Shared',   icon: Users,  isModifier: false },
  { id: 'terminal', name: 'Terminal', icon: Star,   isModifier: false },
  { id: 'clutch',   name: 'Clutch',   icon: Shield, isModifier: false },
  { id: 'fast',     name: 'Fast',     icon: Zap,    isModifier: true  },
  { id: 'jackpot',  name: 'Jackpot',  icon: Target, isModifier: true  },
]

const MODE_CONFIG: Record<string, { color: string; gradient: string; description: string; label: string }> = {
  classic:  { color: '#3b82f6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.13), rgba(37,99,235,0.06))',  description: 'La plus grande valeur totale remporte la victoire. Chaque item ouvert compte.', label: 'VALEUR MAX' },
  crazy:    { color: '#a855f7', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.13), rgba(126,34,206,0.06))', description: "L'inverse du Classic — la plus petite valeur totale gagne la partie.",           label: 'VALEUR MIN' },
  shared:   { color: '#10b981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.13), rgba(4,120,87,0.06))',   description: 'Mode coopératif : les gains sont équitablement partagés entre tous.',          label: 'COOPÉRATIF' },
  terminal: { color: '#ef4444', gradient: 'linear-gradient(135deg, rgba(239,68,68,0.13), rgba(185,28,28,0.06))',   description: 'Seule la dernière case compte. Le meilleur item de la finale remporte tout.',   label: 'DERNIÈRE CASE' },
  clutch:   { color: '#ec4899', gradient: 'linear-gradient(135deg, rgba(236,72,153,0.13), rgba(157,23,77,0.06))',  description: "L'item individuel le plus cher de toute la partie détermine le vainqueur.",      label: 'BEST ITEM' },
  fast:     { color: '#f97316', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.13), rgba(194,65,12,0.06))',  description: "Accélère l'ouverture des cases pour des parties rapides et intenses.",          label: 'MODIFICATEUR' },
  jackpot:  { color: '#eab308', gradient: 'linear-gradient(135deg, rgba(234,179,8,0.13), rgba(161,98,7,0.06))',    description: 'Tes chances de gagner sont proportionnelles à la valeur de tes items.',          label: 'MODIFICATEUR' },
}

const MAX_BOXES = 100

function CoinIcon({ size = 16 }: { size?: number }) {
  return <img src={COIN_LOGO} alt="Coins" style={{ width: `${size}px`, height: `${size}px`, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />
}

function ErrorNotification({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-6 right-6 z-[100] text-white px-5 py-4 rounded-2xl shadow-2xl max-w-sm"
      style={{ background: 'rgba(239,68,68,0.95)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1"><div className="font-bold mb-0.5">Limite atteinte</div><div className="text-sm opacity-90">{message}</div></div>
        <button onClick={() => { playInventoryClose(); onClose() }} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
    </motion.div>
  )
}

export default function BattleCreateConnected() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const T = {
    pageBg: isDark ? '#0C1220' : '#f1f5f9',
    pageText: isDark ? '#e2e8f0' : '#0f172a',
    textSub: isDark ? 'rgba(148,163,184,0.55)' : 'rgba(71,85,105,0.65)',
    textFaint: isDark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.5)',
    panelBg: isDark ? 'rgba(18,28,48,0.22)' : 'rgba(255,255,255,0.9)',
    panelBorder: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(148,163,184,0.18)',
    panelBorderLight: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(148,163,184,0.12)',
    cardBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.75)',
    cardBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(148,163,184,0.15)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
    inputBorder: isDark ? 'rgba(59,130,246,0.14)' : 'rgba(148,163,184,0.25)',
    inputText: isDark ? '#e2e8f0' : '#0f172a',
    bottomBarBg: isDark ? 'rgba(8,12,24,0.92)' : 'rgba(248,250,252,0.97)',
    divider: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(148,163,184,0.15)',
    balanceBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.9)',
    balanceBorder: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.2)',
    dotOpacity: isDark ? 0.015 : 0.055,
    modalBg: isDark ? 'rgba(14,22,38,0.98)' : 'rgba(248,250,252,0.98)',
    modalHeaderBg: isDark ? 'rgba(18,28,48,0.6)' : 'rgba(241,245,249,0.8)',
    filterBg: (active: boolean) => isDark
      ? (active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)')
      : (active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.8)'),
    filterBorder: (active: boolean) => isDark
      ? (active ? 'rgba(59,130,246,0.38)' : 'rgba(255,255,255,0.06)')
      : (active ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.2)'),
    filterColor: (active: boolean) => isDark
      ? (active ? '#60a5fa' : '#475569')
      : (active ? '#3b82f6' : '#64748b'),
    boxBg: (selected: boolean) => isDark
      ? (selected ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.03)')
      : (selected ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.85)'),
    boxBorder: (selected: boolean) => isDark
      ? (selected ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)')
      : (selected ? 'rgba(59,130,246,0.25)' : 'rgba(148,163,184,0.18)'),
    skeletonBg: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    budgetTrack: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    budgetDisabledBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    disabledColor: isDark ? '#374151' : '#94a3b8',
  }

  // Core state
  const [user, setUser] = useState<User | null>(null)
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModes, setSelectedModes] = useState<string[]>(['classic'])
  const [teamConfig, setTeamConfig] = useState('1v1')
  const [selectedBoxes, setSelectedBoxes] = useState<LootBox[]>([])
  const [showCatalog, setShowCatalog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('price-low')
  const [favorites, setFavorites] = useState(new Set<string>())
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errorNotification, setErrorNotification] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'config' | 'boxes'>('config')
  const [isPrivate, setIsPrivate] = useState(false)
  const [catalogTab, setCatalogTab] = useState<'coins' | 'reevs'>('coins')
  const [battleHistory, setBattleHistory] = useState<BattleHistoryEntry[]>([])
  const [createdBattleId, setCreatedBattleId] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Drag & Drop
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const touchDragRef = useRef<{ id: string } | null>(null)

  // Templates (max 5 slots)
  const [templates, setTemplates] = useState<(BattleTemplate | null)[]>([null, null, null, null, null])
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null)
  const [editingSlotName, setEditingSlotName] = useState('')

  // Quick-fill
  const [showQuickFill, setShowQuickFill] = useState(false)
  const [quickFillCoins, setQuickFillCoins] = useState(500)
  const [quickFillStrategy, setQuickFillStrategy] = useState<'cheap' | 'balanced' | 'premium'>('balanced')
  const quickFillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    const saved = localStorage.getItem('battle-template-slots')
    if (saved) { try { setTemplates(JSON.parse(saved)) } catch {} }
    const hist = localStorage.getItem('battle-history')
    if (hist) { try { setBattleHistory(JSON.parse(hist)) } catch {} }
  }, [])

  // Close quick-fill on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickFillRef.current && !quickFillRef.current.contains(e.target as Node)) setShowQuickFill(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadData = async () => {
    try {
      const { data: { user: cu } } = await supabase.auth.getUser()
      if (cu) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', cu.id).single()
        setUser(p)
      }
      const { data: boxes } = await supabase.from('loot_boxes').select('*').eq('is_daily_free', false).order('price_virtual', { ascending: true })
      setLootBoxes(boxes || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const totalBoxes = useMemo(() => selectedBoxes.reduce((s, b) => s + (b.quantity || 0), 0), [selectedBoxes])
  const totalValue = useMemo(() => selectedBoxes.reduce((s, b) => s + parseFloat(b.price_virtual) * (b.quantity || 0), 0), [selectedBoxes])
  const maxPlayers = useMemo(() => {
    if (selectedModes.includes('shared')) return parseInt(teamConfig) || 2
    const m = teamConfig.match(/\d+/g)
    return m ? m.reduce((s, n) => s + parseInt(n), 0) : 2
  }, [selectedModes, teamConfig])
  const teamOptions = useMemo(() => selectedModes.includes('shared') ? ['2', '3', '4', '5', '6'] : ['1v1', '2v2', '3v3', '1v1v1', '1v1v1v1', '1v1v1v1v1', '1v1v1v1v1v1'], [selectedModes])

  const toggleMode = useCallback((modeId: string) => {
    const mode = GAME_MODES.find(m => m.id === modeId)
    setSelectedModes(prev => {
      let next = [...prev]
      if (mode?.isModifier) {
        if (modeId === 'jackpot' && (prev.includes('shared') || prev.includes('clutch') || prev.includes('terminal'))) return prev
        if ((modeId === 'clutch' || modeId === 'terminal') && prev.includes('jackpot')) return prev
        next = prev.includes(modeId) ? next.filter(m => m !== modeId) : [...next, modeId]
      } else {
        next = next.filter(m => !['classic', 'crazy', 'shared', 'terminal', 'clutch'].includes(m))
        next.push(modeId)
        if (['shared', 'clutch', 'terminal'].includes(modeId)) next = next.filter(m => m !== 'jackpot')
        setTeamConfig(modeId === 'shared' ? '2' : '1v1')
      }
      if (!next.some(m => ['classic', 'crazy', 'shared', 'terminal', 'clutch'].includes(m))) next.push('classic')
      return next
    })
  }, [])

  const selectedCurrencyType = useMemo(() => {
    if (selectedBoxes.length === 0) return 'coins'
    const firstBox = selectedBoxes[0]
    return (firstBox.price_reevs && parseFloat(firstBox.price_reevs) > 0) ? 'reevs' : 'coins'
  }, [selectedBoxes])

  const isReevsBattle = selectedCurrencyType === 'reevs'

  const canCreate = selectedBoxes.length > 0 && !!user && (
    isReevsBattle ? totalValue <= (user.reevs || 0) : totalValue <= (user.virtual_currency || 0)
  )

  const addBox = useCallback((box: LootBox) => {
    if (totalBoxes >= MAX_BOXES) { setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`); return }
    const boxIsReevs = !!(box.price_reevs && parseFloat(box.price_reevs) > 0)
    if (selectedBoxes.length > 0) {
      const currentIsReevs = (selectedBoxes[0].price_reevs && parseFloat(selectedBoxes[0].price_reevs) > 0)
      if (!!boxIsReevs !== !!currentIsReevs) {
        setErrorNotification('Impossible de mélanger des cases coins et des cases Reevs !')
        return
      }
    }
    setSelectedBoxes(prev => {
      const ex = prev.find(b => b.id === box.id)
      return ex ? prev.map(b => b.id === box.id ? { ...b, quantity: (b.quantity || 0) + 1 } : b) : [...prev, { ...box, quantity: 1 }]
    })
  }, [totalBoxes, selectedBoxes])

  const removeBox = useCallback((boxId: string) => setSelectedBoxes(prev => prev.filter(b => b.id !== boxId)), [])

  const updateQuantity = useCallback((boxId: string, delta: number) => {
    if (delta > 0 && totalBoxes >= MAX_BOXES) { setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`); return }
    setSelectedBoxes(prev => prev.map(b => b.id === boxId ? { ...b, quantity: Math.max(0, (b.quantity || 0) + delta) } : b).filter(b => (b.quantity || 0) > 0))
  }, [totalBoxes])

  const setBoxQuantity = useCallback((boxId: string, qty: number) => {
    if (qty < 1) { removeBox(boxId); return }
    const tw = selectedBoxes.filter(b => b.id !== boxId).reduce((s, b) => s + (b.quantity || 0), 0)
    if (tw + qty > MAX_BOXES) { setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`); return }
    setSelectedBoxes(prev => prev.map(b => b.id === boxId ? { ...b, quantity: qty } : b))
  }, [selectedBoxes, removeBox])

  const toggleFavorite = useCallback((boxId: string) => {
    setFavorites(prev => { const n = new Set(prev); n.has(boxId) ? n.delete(boxId) : n.add(boxId); return n })
  }, [])

  const filteredBoxes = useMemo(() => {
    let f = lootBoxes.filter(b => {
      const isReevs = !!(b.price_reevs && parseFloat(b.price_reevs) > 0)
      return catalogTab === 'reevs' ? isReevs : !isReevs
    }).filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
    if (showOnlyFavorites) f = f.filter(b => favorites.has(b.id))
    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number)
      f = f.filter(b => {
        const price = catalogTab === 'reevs' ? parseFloat(b.price_reevs || '0') : parseFloat(b.price_virtual)
        return price >= min && price <= max
      })
    }
    return f.sort((a, b) => {
      const pa = catalogTab === 'reevs' ? parseFloat(a.price_reevs || '0') : parseFloat(a.price_virtual)
      const pb = catalogTab === 'reevs' ? parseFloat(b.price_reevs || '0') : parseFloat(b.price_virtual)
      return sortBy === 'price-low' ? pa - pb : pb - pa
    })
  }, [lootBoxes, searchTerm, priceFilter, sortBy, showOnlyFavorites, favorites, catalogTab])

  // ── Drag & Drop (mouse) ──
  const handleDragStart = (id: string) => setDraggedId(id)
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (id !== draggedId) setDragOverId(id) }
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return }
    const from = selectedBoxes.findIndex(b => b.id === draggedId)
    const to = selectedBoxes.findIndex(b => b.id === targetId)
    const next = [...selectedBoxes]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setSelectedBoxes(next)
    setDraggedId(null)
    setDragOverId(null)
  }

  // ── Drag & Drop (touch) ──
  const handleTouchStart = useCallback((id: string) => {
    touchDragRef.current = { id }
    setDraggedId(id)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchDragRef.current) return
    e.preventDefault()
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const card = el?.closest('[data-box-id]')
    const targetId = card?.getAttribute('data-box-id')
    if (targetId && targetId !== touchDragRef.current.id) setDragOverId(targetId)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchDragRef.current) return
    const srcId = touchDragRef.current.id
    setDragOverId(prev => {
      if (prev && prev !== srcId) {
        setSelectedBoxes(boxes => {
          const from = boxes.findIndex(b => b.id === srcId)
          const to = boxes.findIndex(b => b.id === prev)
          if (from === -1 || to === -1) return boxes
          const next = [...boxes]
          const [item] = next.splice(from, 1)
          next.splice(to, 0, item)
          return next
        })
      }
      return null
    })
    touchDragRef.current = null
    setDraggedId(null)
  }, [])

  // ── Templates (slot-based, max 5) ──
  const saveToSlot = (slotIndex: number) => {
    if (selectedBoxes.length === 0) return
    const t: BattleTemplate = {
      id: Date.now().toString(),
      name: `${activeBaseMode.charAt(0).toUpperCase() + activeBaseMode.slice(1)} · ${teamConfig}`,
      modes: selectedModes, teamConfig,
      boxes: selectedBoxes.map(b => ({ id: b.id, quantity: b.quantity || 1, name: b.name, price_virtual: b.price_virtual, image_url: b.image_url })),
      createdAt: Date.now()
    }
    const next = [...templates]
    next[slotIndex] = t
    setTemplates(next)
    localStorage.setItem('battle-template-slots', JSON.stringify(next))
  }
  const loadTemplate = (t: BattleTemplate) => {
    setSelectedModes(t.modes); setTeamConfig(t.teamConfig)
    const valid = t.boxes.filter(tb => lootBoxes.find(lb => lb.id === tb.id))
      .map(tb => { const lb = lootBoxes.find(lb => lb.id === tb.id)!; return { ...lb, quantity: tb.quantity } })
    setSelectedBoxes(valid)
  }
  const renameSlot = (slotIndex: number, newName: string) => {
    if (!newName.trim()) return
    const next = [...templates]
    const t = next[slotIndex]
    if (t) { next[slotIndex] = { ...t, name: newName.trim() }; setTemplates(next); localStorage.setItem('battle-template-slots', JSON.stringify(next)) }
    setEditingSlotIndex(null)
  }
  const deleteSlot = (slotIndex: number) => {
    const next = [...templates]
    next[slotIndex] = null
    setTemplates(next)
    localStorage.setItem('battle-template-slots', JSON.stringify(next))
  }

  // ── Quick-fill ──
  const handleQuickFill = () => {
    if (!lootBoxes.length) return
    const budget = quickFillCoins
    let pool = lootBoxes.filter(b => parseFloat(b.price_virtual) <= budget)
    if (!pool.length) return

    const result: LootBox[] = []
    let remaining = budget
    let count = 0

    if (quickFillStrategy === 'cheap') {
      pool.sort((a, b) => parseFloat(a.price_virtual) - parseFloat(b.price_virtual))
      for (const box of pool) {
        if (count >= MAX_BOXES) break
        const price = parseFloat(box.price_virtual)
        const maxQty = Math.min(Math.floor(remaining / price), MAX_BOXES - count, 15)
        if (maxQty > 0) { result.push({ ...box, quantity: maxQty }); remaining -= price * maxQty; count += maxQty }
      }
    } else if (quickFillStrategy === 'premium') {
      pool.sort((a, b) => parseFloat(b.price_virtual) - parseFloat(a.price_virtual))
      for (const box of pool) {
        if (count >= MAX_BOXES || remaining <= 0) break
        const price = parseFloat(box.price_virtual)
        if (price <= remaining) { result.push({ ...box, quantity: 1 }); remaining -= price; count++ }
      }
    } else {
      // Balanced: interleave cheap and expensive
      const sorted = [...pool].sort((a, b) => parseFloat(a.price_virtual) - parseFloat(b.price_virtual))
      const thirds = Math.ceil(sorted.length / 3)
      const tiers = [sorted.slice(0, thirds), sorted.slice(thirds, thirds * 2), sorted.slice(thirds * 2)]
      let tierIdx = 0
      const tiersUsed = [0, 0, 0]
      while (count < MAX_BOXES && remaining > 0) {
        const tier = tiers[tierIdx % 3]
        const idx = tiersUsed[tierIdx % 3]
        if (idx >= tier.length) { tierIdx++; if (tierIdx >= tiers.length * 3) break; continue }
        const box = tier[idx]
        const price = parseFloat(box.price_virtual)
        if (price <= remaining) {
          const existing = result.find(r => r.id === box.id)
          if (existing && (existing.quantity || 0) < 10) { existing.quantity = (existing.quantity || 0) + 1 }
          else if (!existing) result.push({ ...box, quantity: 1 })
          remaining -= price; count++
        }
        tiersUsed[tierIdx % 3]++; tierIdx++
      }
    }

    setSelectedBoxes(result)
    setShowQuickFill(false)
  }

  // ── Create battle ──
  const createBattle = async (withBots = false) => {
    if (!canCreate || creating) return
    if (totalBoxes > MAX_BOXES) { setErrorNotification(`Maximum ${MAX_BOXES} boxes par battle !`); return }
    setCreating(true)
    try {
      const entryCost = Math.floor(totalValue)
      const battleBoxesData = selectedBoxes.map((box, i) => ({ loot_box_id: box.id, quantity: box.quantity || 1, order_position: i + 1, cost_per_box: Math.floor(parseFloat(box.price_virtual)) }))
      const baseMode = selectedModes.find(m => ['classic', 'crazy', 'shared', 'terminal', 'clutch'].includes(m)) || 'classic'
      const modeNames = selectedModes.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')
      const { data: battle, error: bErr } = await supabase.from('battles').insert({ name: `Battle ${modeNames}`, mode: baseMode, max_players: maxPlayers, entry_cost: entryCost, total_prize: entryCost * maxPlayers, status: 'waiting', creator_id: user!.id, total_boxes: totalBoxes, has_bots: withBots, bots_count: withBots ? maxPlayers - 1 : 0, player_distribution: teamConfig, is_private: isPrivate }).select().single()
      if (bErr) throw bErr
      const { error: boxErr } = await supabase.from('battle_boxes').insert(battleBoxesData.map(b => ({ ...b, battle_id: battle.id })))
      if (boxErr) throw boxErr
      const { error: pErr } = await supabase.from('battle_participants').insert({ battle_id: battle.id, user_id: user!.id, position: 1, team: (teamConfig === '2v2' || teamConfig === '3v3') ? 1 : null, is_ready: true, has_paid: true })
      if (pErr) throw pErr
      if (withBots) {
        const isTeam = teamConfig === '2v2' || teamConfig === '3v3'
        const bots = Array.from({ length: maxPlayers - 1 }, (_, i) => { const pos = i + 2; return { battle_id: battle.id, is_bot: true, bot_name: `Bot ${i + 1}`, position: pos, team: isTeam ? (pos <= Math.ceil(maxPlayers / 2) ? 1 : 2) : null, is_ready: true, has_paid: true } })
        const { error: botErr } = await supabase.from('battle_participants').insert(bots)
        if (botErr) throw botErr
      }
      const { error: upErr } = await supabase.from('profiles').update({ virtual_currency: (user!.virtual_currency || 0) - totalValue }).eq('id', user!.id)
      if (upErr) throw upErr
      await supabase.from('transactions').insert({ user_id: user!.id, type: 'battle_entry', virtual_amount: -entryCost, battle_id: battle.id, description: `Battle entry: ${battle.name}` })
      const histEntry: BattleHistoryEntry = {
        id: battle.id,
        mode: baseMode,
        modifiers: selectedModes.filter(m => ['fast', 'jackpot'].includes(m)),
        teamConfig,
        totalValue: entryCost,
        totalBoxes,
        isReevs: isReevsBattle,
        boxes: selectedBoxes.map(b => ({ id: b.id, quantity: b.quantity || 1, name: b.name, price_virtual: b.price_virtual, image_url: b.image_url })),
        createdAt: Date.now()
      }
      const updatedHistory = [histEntry, ...battleHistory].slice(0, 3)
      localStorage.setItem('battle-history', JSON.stringify(updatedHistory))
      if (isPrivate) {
        setCreatedBattleId(battle.id)
      } else {
        window.location.href = `/battles/${battle.id}`
      }
    } catch (err) { console.error(err); alert('Failed to create battle. Please try again.') } finally { setCreating(false) }
  }

  const activeBaseMode = selectedModes.find(m => ['classic', 'crazy', 'shared', 'terminal', 'clutch'].includes(m)) || 'classic'
  const activeModeColor = MODE_CONFIG[activeBaseMode]?.color || '#3b82f6'
  const overBudget = !!user && (
    isReevsBattle ? totalValue > (user.reevs || 0) : totalValue > (user.virtual_currency || 0)
  )
  const activeModifiers = selectedModes.filter(m => ['fast', 'jackpot'].includes(m))
  const budgetPct = user ? Math.min(100, (totalValue / Math.max(1, user.virtual_currency || 0)) * 100) : 0
  const budgetBarColor = overBudget ? '#ef4444' : budgetPct > 75 ? '#f97316' : budgetPct > 40 ? '#eab308' : '#10b981'
  const ActiveModeIcon = GAME_MODES.find(m => m.id === activeBaseMode)?.icon || Crown

  if (loading) {
    return (
      <div className="relative flex flex-col overflow-hidden" style={{ background: T.pageBg, color: T.pageText, height: '100vh' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(59,130,246,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: T.dotOpacity }} />
        <div className="relative flex flex-1 min-h-0">
          {/* Left skeleton */}
          <div className="hidden md:flex flex-col border-r flex-shrink-0 md:w-[300px] lg:w-[440px] px-6 py-6 gap-3"
            style={{ borderColor: T.panelBorder, background: T.panelBg }}>
            <div className="h-5 w-28 rounded-lg" style={{ background: T.skeletonBg, animation: 'pulse 1.5s ease-in-out infinite' }} />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl" style={{ height: '62px', background: T.skeletonBg, animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
            ))}
            <div className="mt-2 pt-3 border-t" style={{ borderColor: T.panelBorderLight }}>
              <div className="h-3 w-20 rounded mb-3" style={{ background: T.skeletonBg, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div className="flex gap-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex-1 h-10 rounded-xl" style={{ background: T.skeletonBg, animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
                ))}
              </div>
            </div>
            <div className="mt-auto pt-4 border-t" style={{ borderColor: T.panelBorderLight }}>
              <div className="h-3 w-24 rounded mb-3" style={{ background: T.skeletonBg, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-1 h-16 rounded-2xl" style={{ background: T.skeletonBg, animation: `pulse 1.5s ease-in-out ${i * 0.12}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
          {/* Right skeleton */}
          <div className="flex-1 p-6 md:p-8">
            <div className="h-14 rounded-2xl mb-6" style={{ background: T.skeletonBg, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-full rounded-2xl" style={{ height: '7rem', background: T.skeletonBg, animation: `pulse 1.5s ease-in-out ${i * 0.06}s infinite` }} />
                  <div className="h-3 w-16 rounded" style={{ background: T.skeletonBg, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div className="h-3 w-10 rounded" style={{ background: T.skeletonBg, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Bottom bar skeleton */}
        <div className="h-[68px] border-t flex-shrink-0" style={{ borderColor: T.panelBorder, background: T.bottomBarBg }} />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col overflow-hidden" style={{ background: T.pageBg, color: T.pageText, height: '100vh' }}>
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(59,130,246,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: T.dotOpacity }} />
      {/* Ambient glow */}
      <motion.div className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(ellipse 55% 65% at 12% 75%, ${activeModeColor}09 0%, transparent 65%)` }}
        transition={{ duration: 1.2 }} />

      {/* ── MOBILE TAB BAR ── */}
      <div className="relative flex md:hidden flex-shrink-0 z-10 border-b" style={{ borderColor: T.panelBorder, background: T.bottomBarBg, backdropFilter: 'blur(12px)' }}>
        <button onClick={() => { playFilterTick(); setMobileTab('config') }}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all"
          style={{ color: mobileTab === 'config' ? activeModeColor : '#475569', borderBottom: `2px solid ${mobileTab === 'config' ? activeModeColor : 'transparent'}` }}>
          <Settings2 className="w-3.5 h-3.5" />
          Configuration
        </button>
        <button onClick={() => { playFilterTick(); setMobileTab('boxes') }}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all relative"
          style={{ color: mobileTab === 'boxes' ? activeModeColor : '#475569', borderBottom: `2px solid ${mobileTab === 'boxes' ? activeModeColor : 'transparent'}` }}>
          <Swords className="w-3.5 h-3.5" />
          Mes cases
          <AnimatePresence>
            {totalBoxes > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute top-1.5 right-6 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                style={{ background: activeModeColor }}>
                {totalBoxes > 99 ? '99+' : totalBoxes}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="relative flex flex-1 min-h-0">

        {/* ══════ LEFT PANEL ══════ */}
        <div className={`${mobileTab === 'config' ? 'flex' : 'hidden'} md:flex flex-col border-r flex-shrink-0 w-full md:w-[300px] lg:w-[440px]`}
          style={{ borderColor: T.panelBorder, background: T.panelBg, overflowY: 'auto', scrollbarWidth: 'none' }}>
          <style>{`.left-panel::-webkit-scrollbar { display: none; }`}</style>

          {/* Header */}
          <div className="px-4 md:px-7 pt-5 md:pt-7 pb-4 md:pb-5 flex items-center justify-between flex-shrink-0 border-b" style={{ borderColor: T.panelBorderLight }}>
            <div className="flex items-center gap-4">
              <motion.button onClick={() => { playC5(); window.history.back() }} whileHover={{ x: -3 }} className="flex items-center gap-2 transition-colors" style={{ color: T.textSub }}>
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Retour</span>
              </motion.button>
              <div className="w-px h-5" style={{ background: T.divider }} />
              <div>
                <div className="text-[10px] font-bold tracking-[0.24em] uppercase" style={{ color: activeModeColor, transition: 'color 0.5s ease' }}>ReveelBox</div>
                <h1 className="text-lg font-black tracking-tight">Créer une Battle</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle battle privée */}
              <motion.button onClick={() => { isPrivate ? playInventoryClose() : playInventoryOpen(); setIsPrivate(!isPrivate) }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all"
                style={{ background: isPrivate ? 'rgba(168,85,247,0.12)' : T.inputBg, border: `1px solid ${isPrivate ? 'rgba(168,85,247,0.38)' : T.cardBorder}` }}>
                {isPrivate
                  ? <Lock className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
                  : <Unlock className="w-3.5 h-3.5" style={{ color: T.filterColor(false) }} />}
                <span className="text-[11px] font-bold hidden lg:inline" style={{ color: isPrivate ? '#a855f7' : T.filterColor(false) }}>
                  {isPrivate ? 'Privée' : 'Public'}
                </span>
              </motion.button>
              {/* Balance */}
              {user && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: T.balanceBg, border: `1px solid ${T.balanceBorder}` }}>
                  <CoinIcon size={14} />
                  <span className="text-sm font-bold">{Math.floor(user.virtual_currency || 0).toLocaleString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── MODES ── */}
          <div className="flex-1 flex flex-col px-4 md:px-7 pt-4 md:pt-5 border-b min-h-0" style={{ borderColor: T.panelBorderLight }}>
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <div className="w-0.5 h-4 rounded-full transition-all duration-500" style={{ background: activeModeColor }} />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: T.textSub }}>Mode de jeu</span>
            </div>
            <div className="flex flex-col gap-2">
              {GAME_MODES.filter(m => !m.isModifier).map((mode) => {
                const cfg = MODE_CONFIG[mode.id]; const isActive = selectedModes.includes(mode.id); const Icon = mode.icon
                return (
                  <motion.button key={mode.id} onClick={() => { isActive ? playInventoryClose() : playInventoryOpen(); toggleMode(mode.id) }}
                    whileHover={{ x: 4 }} whileTap={{ scale: 0.99 }}
                    className="relative flex items-center gap-4 px-3.5 py-3.5 rounded-2xl text-left overflow-hidden transition-all"
                    style={{ background: isActive ? cfg.gradient : T.cardBg, border: `1px solid ${isActive ? cfg.color + '35' : T.cardBorder}`, boxShadow: isActive ? `0 0 28px ${cfg.color}16, inset 0 0 28px ${cfg.color}05` : 'none' }}>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-9 rounded-r-full" style={{ background: cfg.color }} />}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isActive ? `${cfg.color}22` : T.inputBg, border: `1px solid ${isActive ? cfg.color + '35' : T.cardBorder}` }}>
                      <Icon className="w-4 h-4" style={{ color: isActive ? cfg.color : T.filterColor(false) }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm" style={{ color: isActive ? '#f1f5f9' : T.filterColor(false) }}>{mode.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: isActive ? `${cfg.color}22` : T.inputBg, color: isActive ? cfg.color : T.filterColor(false), border: `1px solid ${isActive ? cfg.color + '25' : T.cardBorder}` }}>{cfg.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: isActive ? '#94a3b8' : T.disabledColor }}>{cfg.description}</p>
                    </div>
                    {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color, boxShadow: `0 0 7px ${cfg.color}` }} />}
                  </motion.button>
                )
              })}
            </div>
            {/* Modifiers */}
            <div className="flex-shrink-0 mt-3 pt-3.5 pb-4 md:pb-5 border-t" style={{ borderColor: T.panelBorderLight }}>
              <div className="text-[9px] font-bold tracking-[0.24em] uppercase mb-2.5" style={{ color: T.textFaint }}>Modificateurs</div>
              <div className="flex gap-2">
                {GAME_MODES.filter(m => m.isModifier).map((mode) => {
                  const cfg = MODE_CONFIG[mode.id]; const isActive = selectedModes.includes(mode.id)
                  const disabled = mode.id === 'jackpot' && (selectedModes.includes('shared') || selectedModes.includes('clutch') || selectedModes.includes('terminal'))
                  const Icon = mode.icon
                  return (
                    <motion.button key={mode.id} onClick={() => { if (!disabled) { isActive ? playInventoryClose() : playInventoryOpen(); toggleMode(mode.id) } }}
                      whileHover={!disabled ? { scale: 1.04 } : {}} whileTap={!disabled ? { scale: 0.97 } : {}}
                      disabled={disabled}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 transition-all"
                      style={{ background: isActive ? `${cfg.color}18` : T.cardBg, border: `1px solid ${isActive ? cfg.color + '40' : T.cardBorder}`, opacity: disabled ? 0.25 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: isActive ? cfg.color : T.filterColor(false) }} />
                      <span className="text-xs font-bold" style={{ color: isActive ? cfg.color : T.filterColor(false) }}>{mode.name}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: cfg.color }} />}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── TEAM CONFIG ── */}
          <div className="flex-shrink-0 px-4 md:px-7 py-4 md:py-5" style={{ borderColor: `${activeModeColor}10` }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-0.5 h-4 rounded-full transition-all duration-500" style={{ background: activeModeColor }} />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: T.textSub }}>Configuration</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {teamOptions.map(option => {
                const isSelected = teamConfig === option
                const isShared = selectedModes.includes('shared')
                const BASE_COLORS = ['#3b82f6', '#ef4444', '#a855f7', '#10b981']
                const TEAM_PALETTE = [activeModeColor, ...BASE_COLORS.filter(c => c !== activeModeColor).slice(0, 3)]
                const teams = isShared ? [parseInt(option)] : option.split('v').map(Number)
                const playerColors: string[] = []
                teams.forEach((size, teamIdx) => {
                  for (let j = 0; j < size; j++) {
                    playerColors.push(TEAM_PALETTE[teamIdx] ?? '#94a3b8')
                  }
                })
                return (
                  <motion.button key={option} onClick={() => { playInventoryOpen(); setTeamConfig(option) }} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 px-5 py-3.5 rounded-2xl transition-all"
                    style={{ background: isSelected ? `${activeModeColor}24` : T.cardBg, border: `1px solid ${isSelected ? `${activeModeColor}66` : T.cardBorder}`, boxShadow: isSelected ? `0 0 20px ${activeModeColor}30` : 'none', transition: 'all 0.35s ease' }}>
                    <div className="flex flex-wrap gap-1 justify-center" style={{ maxWidth: '60px' }}>
                      {playerColors.map((color, i) => <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: isSelected ? color : 'rgba(255,255,255,0.12)' }} />)}
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: isSelected ? activeModeColor : '#475569' }}>{option}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

        </div>

        {/* ══════ RIGHT PANEL ══════ */}
        <div className={`${mobileTab === 'boxes' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 overflow-hidden`}>

          {/* ── TEMPLATES SLOTS + QUICK-FILL BAR ── */}
          <div className="flex-shrink-0 px-4 md:px-7 py-3 md:py-4 border-b" style={{ borderColor: T.panelBorder, background: isDark ? 'rgba(12,18,32,0.55)' : 'rgba(241,245,249,0.85)' }}>
            <div className="flex items-center gap-4">
              {/* Label */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5" style={{ color: T.textFaint }} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: T.textFaint }}>Templates</span>
              </div>

              {/* 5 template slots */}
              <div className="flex items-center gap-2 flex-1">
                {templates.map((t, i) => {
                  const slotMode = t ? (t.modes.find(m => ['classic','crazy','shared','terminal','clutch'].includes(m)) || 'classic') : null
                  const slotColor = slotMode ? MODE_CONFIG[slotMode].color : '#3b82f6'
                  return t ? (
                  // Filled slot
                  <div key={t.id} className="relative group flex-1" style={{ minWidth: 0, maxWidth: '160px' }}>
                    {/* Delete — outside the card so it's not clipped */}
                    <button onClick={e => { e.stopPropagation(); playBoxRemove(); deleteSlot(i) }}
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
                      style={{ background: 'rgba(239,68,68,0.9)', border: '1.5px solid rgba(12,18,32,0.8)' }}>
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2 }}
                    className="relative flex flex-col justify-between px-3 py-2 rounded-xl transition-all overflow-hidden w-full"
                    style={{ background: `${slotColor}12`, border: `1px solid ${slotColor}35`, height: '64px', cursor: editingSlotIndex === i ? 'default' : 'pointer' }}
                    onClick={() => { if (editingSlotIndex !== i) { playInventoryOpen(); loadTemplate(t) } }}>
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: slotColor, opacity: 0.7 }} />
                    {/* Name — editable on click */}
                    {editingSlotIndex === i ? (
                      <input autoFocus value={editingSlotName}
                        onChange={e => setEditingSlotName(e.target.value)}
                        onBlur={() => renameSlot(i, editingSlotName)}
                        onKeyDown={e => { if (e.key === 'Enter') renameSlot(i, editingSlotName); if (e.key === 'Escape') setEditingSlotIndex(null) }}
                        onClick={e => e.stopPropagation()}
                        className="text-xs font-bold bg-transparent focus:outline-none w-full border-b"
                        style={{ color: '#e2e8f0', borderColor: `${slotColor}50` }} />
                    ) : (
                      <div className="flex items-center gap-1 group/name"
                        onClick={e => { e.stopPropagation(); playFilterTick(); setEditingSlotIndex(i); setEditingSlotName(t.name) }}>
                        <span className="text-xs font-bold truncate" style={{ color: '#e2e8f0' }}>{t.name}</span>
                        <span className="opacity-0 group-hover/name:opacity-100 transition-opacity flex-shrink-0" style={{ color: `${slotColor}` }}>
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor"><path d="M8.5 1.5a1.5 1.5 0 0 1 2.12 2.12L9.5 4.75 7.25 2.5 8.5 1.5zM6.5 3.25 1 8.75V11h2.25L8.75 5.5 6.5 3.25z"/></svg>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold capitalize" style={{ background: `${slotColor}22`, color: slotColor }}>
                        {slotMode}
                      </span>
                      <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.45)' }}>{t.boxes.reduce((s, b) => s + b.quantity, 0)} cases</span>
                    </div>
                  </motion.div>
                  </div>
                ) : (
                  // Empty slot
                  <motion.button key={`empty-${i}`}
                    whileHover={selectedBoxes.length > 0 ? { y: -2, borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.05)' } : {}}
                    whileTap={selectedBoxes.length > 0 ? { scale: 0.97 } : {}}
                    onClick={() => { playBoxAdd(); saveToSlot(i) }}
                    disabled={selectedBoxes.length === 0}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl flex-1 transition-all"
                    style={{ background: T.cardBg, border: `1px dashed ${T.cardBorder}`, height: '64px', maxWidth: '160px', cursor: selectedBoxes.length > 0 ? 'pointer' : 'default' }}>
                    <Save className="w-3.5 h-3.5" style={{ color: selectedBoxes.length > 0 ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.18)' }} />
                    <span className="text-[9px] font-bold" style={{ color: selectedBoxes.length > 0 ? 'rgba(148,163,184,0.45)' : 'rgba(148,163,184,0.18)' }}>Sauvegarder</span>
                  </motion.button>
                )
              })}
              </div>

              {/* History — à droite des templates */}
              <AnimatePresence>
                {battleHistory.length > 0 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-px h-10" style={{ background: T.divider }} />
                    <History className="w-3 h-3 flex-shrink-0" style={{ color: T.textFaint }} />
                    {battleHistory.map((entry, idx) => {
                      const ec = MODE_CONFIG[entry.mode]?.color || '#3b82f6'
                      const EIcon = GAME_MODES.find(gm => gm.id === entry.mode)?.icon || Crown
                      return (
                        <div key={entry.id + idx} className="relative group/hist" style={{ flexShrink: 0 }}>
                          <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              const valid = entry.boxes.filter(tb => lootBoxes.find(lb => lb.id === tb.id))
                                .map(tb => { const lb = lootBoxes.find(lb => lb.id === tb.id)!; return { ...lb, quantity: tb.quantity } })
                              setSelectedBoxes(valid)
                              setSelectedModes([entry.mode, ...entry.modifiers])
                              setTeamConfig(entry.teamConfig)
                            }}
                            className="relative flex flex-col justify-between px-3 py-2.5 rounded-xl overflow-hidden transition-all"
                            style={{ background: `${ec}10`, border: `1px solid ${ec}30`, height: '80px', width: '112px', cursor: 'pointer' }}>
                            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: ec, opacity: 0.7 }} />
                            {/* Mode + config */}
                            <div className="flex items-center gap-1.5">
                              <EIcon className="w-3 h-3 flex-shrink-0" style={{ color: ec }} />
                              <span className="text-[11px] font-black truncate capitalize" style={{ color: '#e2e8f0' }}>{entry.mode}</span>
                              <span className="text-[10px] font-bold ml-auto flex-shrink-0" style={{ color: `${ec}bb` }}>{entry.teamConfig}</span>
                            </div>
                            {/* Cases */}
                            <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
                              {entry.totalBoxes} case{entry.totalBoxes > 1 ? 's' : ''}
                            </span>
                            {/* Date · Heure */}
                            <span className="text-[9px]" style={{ color: T.textFaint }}>
                              {new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              {' · '}
                              {new Date(entry.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </motion.button>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-px h-10 flex-shrink-0" style={{ background: T.divider }} />

              {/* Quick-fill */}
              <div className="relative flex-shrink-0" ref={quickFillRef}>
                <motion.button onClick={() => { playFilterTick(); setShowQuickFill(v => !v) }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: showQuickFill ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)', border: `1px solid ${showQuickFill ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.22)'}`, color: '#818cf8' }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick-fill
                  <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: showQuickFill ? 'rotate(180deg)' : 'none' }} />
                </motion.button>

                {/* Quick-fill popover */}
                <AnimatePresence>
                  {showQuickFill && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="absolute top-full mt-2 right-0 z-30 p-5 rounded-2xl shadow-2xl"
                      style={{ width: '280px', background: T.modalBg, border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(16px)' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4" style={{ color: '#818cf8' }} />
                        <span className="font-black text-sm">Quick-fill</span>
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] uppercase tracking-wide font-bold mb-2 block" style={{ color: 'rgba(148,163,184,0.5)' }}>Budget cible (coins)</label>
                        <div className="flex items-center gap-2 mb-2">
                          <CoinIcon size={14} />
                          <input type="number" value={quickFillCoins} onChange={e => setQuickFillCoins(parseInt(e.target.value) || 0)} min={1}
                            className="flex-1 px-3 py-2 rounded-xl text-sm font-bold focus:outline-none"
                            style={{ background: T.inputBg, border: '1px solid rgba(99,102,241,0.2)', color: T.inputText }} />
                        </div>
                        <div className="flex gap-1.5">
                          {[250, 500, 1000, 2500].map(v => (
                            <button key={v} onClick={() => { playFilterTick(); setQuickFillCoins(v) }} className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                              style={{ background: quickFillCoins === v ? 'rgba(99,102,241,0.2)' : T.inputBg, border: `1px solid ${quickFillCoins === v ? 'rgba(99,102,241,0.35)' : T.cardBorder}`, color: quickFillCoins === v ? '#818cf8' : T.filterColor(false) }}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-5">
                        <label className="text-[10px] uppercase tracking-wide font-bold mb-2 block" style={{ color: 'rgba(148,163,184,0.5)' }}>Stratégie</label>
                        <div className="flex flex-col gap-1.5">
                          {([
                            { key: 'cheap',    label: 'Économique', desc: 'Max de cases, prix bas',    color: '#10b981' },
                            { key: 'balanced', label: 'Équilibré',  desc: 'Mix de prix variés',        color: '#3b82f6' },
                            { key: 'premium',  label: 'Premium',    desc: 'Cases les plus chères',     color: '#a855f7' },
                          ] as const).map(s => (
                            <button key={s.key} onClick={() => { playFilterTick(); setQuickFillStrategy(s.key) }}
                              className="flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                              style={{ background: quickFillStrategy === s.key ? `${s.color}14` : T.cardBg, border: `1px solid ${quickFillStrategy === s.key ? s.color + '35' : T.cardBorder}` }}>
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: quickFillStrategy === s.key ? s.color : T.disabledColor }} />
                              <div>
                                <div className="text-xs font-bold" style={{ color: quickFillStrategy === s.key ? '#f1f5f9' : '#64748b' }}>{s.label}</div>
                                <div className="text-[9px]" style={{ color: 'rgba(148,163,184,0.4)' }}>{s.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <motion.button onClick={() => { playBoxAdd(); handleQuickFill() }} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: '1px solid rgba(99,102,241,0.4)', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        Remplir automatiquement
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── SELECTED BOXES GRID (floating, draggable) ── */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-32" style={{ scrollbarWidth: 'none' }}>
            {selectedBoxes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '120px' }}>
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px dashed rgba(59,130,246,0.18)' }}>
                  <Swords className="w-8 h-8" style={{ color: 'rgba(59,130,246,0.3)' }} />
                </div>
                <p className="text-base font-bold mb-1" style={{ color: 'rgba(148,163,184,0.3)' }}>Aucune case sélectionnée</p>
                <p className="text-sm" style={{ color: 'rgba(148,163,184,0.2)' }}>Clique sur + pour ajouter des cases à ta battle</p>
              </div>
            )}

            <div className="grid gap-4 md:gap-6 lg:gap-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>

              {/* "+" Add card — floating style */}
              <motion.button onClick={() => { playInventoryOpen(); setShowCatalog(true) }} whileHover={{ y: -6, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center cursor-pointer group">
                <div className="w-full flex items-center justify-center mb-2 md:mb-3" style={{ height: '7rem' }}>
                  <motion.div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.08)', border: `2px dashed rgba(59,130,246,0.25)` }}
                    whileHover={{ background: `${activeModeColor}18`, borderColor: activeModeColor + '50', boxShadow: `0 12px 32px ${activeModeColor}25` }}>
                    <Plus className="w-9 h-9" style={{ color: 'rgba(59,130,246,0.5)' }} />
                  </motion.div>
                </div>
                <span className="text-sm font-bold" style={{ color: 'rgba(148,163,184,0.45)' }}>Ajouter</span>
                <span className="text-[10px] mt-0.5" style={{ color: 'rgba(148,163,184,0.25)' }}>Ouvrir le catalogue</span>
              </motion.button>

              {/* Floating selected box cards */}
              <AnimatePresence mode="popLayout">
                {selectedBoxes.map((box) => (
                  <motion.div key={box.id} layout
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                    draggable
                    data-box-id={box.id}
                    onDragStart={() => handleDragStart(box.id)}
                    onDragOver={e => handleDragOver(e, box.id)}
                    onDrop={() => handleDrop(box.id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                    onTouchStart={() => handleTouchStart(box.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    whileHover={{ y: -6 }}
                    className="flex flex-col items-center group relative"
                    style={{ opacity: draggedId === box.id ? 0.35 : 1, cursor: 'grab', outline: dragOverId === box.id ? `2px dashed ${activeModeColor}70` : 'none', outlineOffset: '8px', borderRadius: '16px', transition: 'opacity 0.2s, outline 0.15s', touchAction: 'none' }}>

                    {/* Quantity badge */}
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                      style={{ background: activeModeColor, boxShadow: `0 0 14px ${activeModeColor}60`, transition: 'background 0.5s ease' }}>
                      {box.quantity}
                    </motion.div>

                    {/* Remove button */}
                    <button onClick={() => { playBoxRemove(); removeBox(box.id) }}
                      className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'rgba(239,68,68,0.9)', border: '2px solid rgba(12,18,32,0.8)' }}>
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>

                    {/* Floating image */}
                    <div className="flex items-center justify-center w-full mb-2 md:mb-3" style={{ height: '7rem' }}>
                      <img src={box.image_url} alt={box.name} className="max-h-full max-w-[90%] object-contain"
                        style={{ filter: `drop-shadow(0 8px 18px ${activeModeColor}30) drop-shadow(0 3px 8px rgba(0,0,0,0.4))`, transition: 'filter 0.3s ease' }} />
                    </div>

                    {/* Name */}
                    <div className="text-[12px] font-bold text-center truncate w-full px-1 mb-1.5" style={{ color: 'rgba(226,232,240,0.85)' }}>
                      {box.name}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-1 mb-2.5">
                      <CoinIcon size={11} />
                      <span className="text-[11px] font-bold" style={{ color: 'rgba(148,163,184,0.6)' }}>{parseFloat(box.price_virtual).toFixed(0)}</span>
                    </div>

                    {/* Quantity controls — compact pill */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl" style={{ background: T.inputBg, border: `1px solid ${T.cardBorder}` }}>
                      <button onClick={() => { playBoxRemove(); updateQuantity(box.id, -1) }} className="w-6 h-6 rounded-lg flex items-center justify-center text-sm hover:bg-white/10 transition-colors" style={{ color: 'rgba(148,163,184,0.7)' }}>−</button>
                      <input type="number" min="1" max={MAX_BOXES} value={box.quantity || 1}
                        onChange={e => setBoxQuantity(box.id, parseInt(e.target.value) || 1)}
                        className="w-8 text-center bg-transparent text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ color: T.inputText }} />
                      <button onClick={() => { playBoxAdd(); updateQuantity(box.id, 1) }} className="w-6 h-6 rounded-lg flex items-center justify-center text-sm hover:bg-white/10 transition-colors" style={{ color: 'rgba(148,163,184,0.7)' }}>+</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ BOTTOM ACTION BAR ══════ */}
      <div className="fixed bottom-0 z-40 left-0 md:left-[300px] lg:left-[440px] right-0"
        style={{ background: T.bottomBarBg, borderTop: `1px solid ${T.panelBorder}`, backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3 md:gap-5 px-4 md:px-6 py-3">

          {/* ── Info section (left) ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Mode · Modificateurs · Config · Cases */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: `${activeModeColor}18`, border: `1px solid ${activeModeColor}30` }}>
                <ActiveModeIcon className="w-3 h-3" style={{ color: activeModeColor }} />
                <span className="text-[11px] font-black capitalize" style={{ color: activeModeColor }}>{activeBaseMode}</span>
                <span className="text-[11px] font-bold" style={{ color: `${activeModeColor}99` }}>· {teamConfig}</span>
              </div>
              {activeModifiers.map(m => {
                const mCfg = MODE_CONFIG[m]
                const MIcon = GAME_MODES.find(gm => gm.id === m)?.icon
                return (
                  <span key={m} className="inline-flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: `${mCfg.color}15`, border: `1px solid ${mCfg.color}30` }}>
                    {MIcon && <MIcon className="w-2.5 h-2.5" style={{ color: mCfg.color }} />}
                    <span className="text-[10px] font-bold capitalize" style={{ color: mCfg.color }}>{m}</span>
                  </span>
                )
              })}
              {totalBoxes > 0 && (
                <span className="text-[11px] font-bold flex-shrink-0" style={{ color: 'rgba(148,163,184,0.45)' }}>
                  · {totalBoxes} case{totalBoxes > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {/* Budget bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold" style={{ color: overBudget ? '#f87171' : budgetBarColor }}>
                  {overBudget && <AlertCircle className="w-3 h-3 inline mr-1" />}
                  {totalValue > 0 ? `${Math.floor(totalValue).toLocaleString('fr-FR')} coins` : '0 coins'}
                </span>
                <span className="text-[10px]" style={{ color: T.textFaint }}>
                  {user ? `${Math.floor(user.virtual_currency || 0).toLocaleString('fr-FR')} dispo` : '—'}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.budgetTrack }}>
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${budgetPct}%`, backgroundColor: budgetBarColor }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ minWidth: totalValue > 0 ? '4px' : '0px' }} />
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="w-px h-10 flex-shrink-0" style={{ background: T.divider }} />

          {/* ── Buttons ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* CRÉER */}
            <motion.button onClick={() => { playC5(); createBattle(false) }} disabled={!canCreate || creating}
              whileHover={canCreate && !creating ? { y: -2, boxShadow: `0 8px 28px ${activeModeColor}45` } : {}}
              whileTap={canCreate && !creating ? { scale: 0.97 } : {}}
              className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-black text-sm transition-all"
              style={{ background: canCreate && !creating ? `linear-gradient(135deg, ${activeModeColor}, ${activeModeColor}cc)` : T.budgetDisabledBg, color: canCreate && !creating ? '#fff' : T.disabledColor, cursor: canCreate && !creating ? 'pointer' : 'not-allowed', border: `1px solid ${canCreate && !creating ? activeModeColor + '55' : T.cardBorder}`, boxShadow: canCreate && !creating ? `0 4px 20px ${activeModeColor}25` : 'none', transition: 'all 0.3s ease' }}>
              {creating
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                : <><Swords className="w-3.5 h-3.5" /><span className="hidden sm:inline">CRÉER</span></>}
            </motion.button>
            {/* VS BOTS */}
            <motion.button onClick={() => { playC5(); createBattle(true) }} disabled={!canCreate || creating}
              whileHover={canCreate && !creating ? { y: -2 } : {}} whileTap={canCreate && !creating ? { scale: 0.97 } : {}}
              className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: canCreate && !creating ? 'rgba(16,185,129,0.12)' : T.cardBg, color: canCreate && !creating ? '#10b981' : T.disabledColor, cursor: canCreate && !creating ? 'pointer' : 'not-allowed', border: `1px solid ${canCreate && !creating ? 'rgba(16,185,129,0.3)' : T.cardBorder}` }}>
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{creating ? '...' : 'VS BOTS'}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ══════ SHARE MODAL (bataille privée créée) ══════ */}
      <AnimatePresence>
        {createdBattleId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              className="w-full flex flex-col rounded-3xl overflow-hidden"
              style={{
                maxWidth: '480px',
                background: isDark ? 'rgba(14,22,38,0.98)' : 'rgba(248,250,252,0.98)',
                border: `1px solid ${isDark ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.3)'}`,
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.1)',
              }}
            >
              {/* Header */}
              <div
                className="px-8 py-6 text-center"
                style={{
                  borderBottom: `1px solid ${isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.15)'}`,
                  background: isDark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.04)',
                }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <Lock className="w-7 h-7" style={{ color: '#a855f7' }} />
                </div>
                <h2 className="text-xl font-black mb-1" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>
                  Battle privée créée !
                </h2>
                <p className="text-sm" style={{ color: isDark ? 'rgba(148,163,184,0.6)' : 'rgba(71,85,105,0.7)' }}>
                  Seules les personnes avec ce lien peuvent rejoindre
                </p>
              </div>

              {/* Link area */}
              <div className="px-8 py-6 flex flex-col gap-4">
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isDark ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.25)'}`,
                  }}
                >
                  <Link className="w-4 h-4 flex-shrink-0" style={{ color: '#a855f7' }} />
                  <span
                    className="flex-1 text-sm font-mono truncate"
                    style={{ color: isDark ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.9)' }}
                  >
                    {typeof window !== 'undefined' ? `${window.location.origin}/battles/${createdBattleId}` : ''}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={async () => {
                      if (typeof window !== 'undefined') {
                        await navigator.clipboard.writeText(`${window.location.origin}/battles/${createdBattleId}`)
                        setCopiedLink(true)
                        setTimeout(() => setCopiedLink(false), 2000)
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all"
                    style={{
                      background: copiedLink ? 'rgba(16,185,129,0.15)' : 'rgba(168,85,247,0.15)',
                      border: `1px solid ${copiedLink ? 'rgba(16,185,129,0.3)' : 'rgba(168,85,247,0.3)'}`,
                      color: copiedLink ? '#10b981' : '#a855f7',
                    }}
                  >
                    {copiedLink
                      ? <><Check className="w-3.5 h-3.5" />Copié !</>
                      : <><Copy className="w-3.5 h-3.5" />Copier</>
                    }
                  </motion.button>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { window.location.href = `/battles/${createdBattleId}` }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                      boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
                    }}
                  >
                    <Swords className="w-4 h-4" />
                    Rejoindre ma battle
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ CATALOG MODAL ══════ */}
      <AnimatePresence>
        {showCatalog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
            onClick={() => { playInventoryClose(); setShowCatalog(false) }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 24 }}
              onClick={e => e.stopPropagation()}
              className="w-full flex flex-col rounded-3xl overflow-hidden"
              style={{ maxWidth: '1000px', maxHeight: '82vh', background: T.modalBg, border: `1px solid ${T.inputBorder}`, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

              {/* Modal header */}
              <div className="px-8 py-6 border-b flex-shrink-0" style={{ borderColor: T.balanceBorder, background: T.modalHeaderBg }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1" style={{ color: '#3b82f6' }}>Catalogue</div>
                    <h2 className="text-xl font-black">{filteredBoxes.length} cases disponibles</h2>
                  </div>
                  <button onClick={() => { playInventoryClose(); setShowCatalog(false) }} className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10" style={{ border: `1px solid ${T.cardBorder}`, color: T.textSub }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Currency tabs */}
                <div className="flex gap-2 mb-4">
                  {([
                    { key: 'coins', label: 'Coins', icon: null, color: '#3b82f6' },
                    { key: 'reevs', label: 'Reevs', icon: Gem, color: '#a855f7' },
                  ] as const).map(tab => {
                    const isDisabled = selectedBoxes.length > 0 && selectedCurrencyType !== tab.key
                    const isActive = catalogTab === tab.key
                    const TabIcon = tab.icon
                    return (
                      <button key={tab.key}
                        onClick={() => { if (!isDisabled) { playFilterTick(); setCatalogTab(tab.key) } }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: isActive ? `${tab.color}20` : T.inputBg,
                          border: `1px solid ${isActive ? tab.color + '50' : T.cardBorder}`,
                          color: isActive ? tab.color : isDisabled ? '#2d3748' : '#64748b',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.4 : 1
                        }}>
                        {tab.key === 'coins' ? <CoinIcon size={14} /> : TabIcon ? <TabIcon className="w-3.5 h-3.5" /> : null}
                        {tab.label}
                        {isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1" style={{ background: `${tab.color}25`, color: tab.color }}>{filteredBoxes.length}</span>}
                      </button>
                    )
                  })}
                  {selectedBoxes.length > 0 && (
                    <span className="ml-auto self-center text-[10px] px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
                      style={{ background: selectedCurrencyType === 'reevs' ? 'rgba(168,85,247,0.1)' : 'rgba(59,130,246,0.1)', color: selectedCurrencyType === 'reevs' ? '#a855f7' : '#60a5fa', border: `1px solid ${selectedCurrencyType === 'reevs' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                      {selectedCurrencyType === 'reevs' ? <Gem className="w-3 h-3" /> : <CoinIcon size={11} />}
                      Battle {selectedCurrencyType}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: T.textFaint }} />
                    <input type="text" placeholder="Rechercher une case..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.inputText }} />
                  </div>
                  <div className="flex gap-1.5">
                    {[{ value: 'all', label: 'Tout' }, { value: '0-50', label: '≤50' }, { value: '50-100', label: '50–100' }, { value: '100-200', label: '100–200' }, { value: '200-999999', label: '200+' }].map(f => (
                      <button key={f.value} onClick={() => { playFilterTick(); setPriceFilter(f.value) }} className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: T.filterBg(priceFilter === f.value), border: `1px solid ${T.filterBorder(priceFilter === f.value)}`, color: T.filterColor(priceFilter === f.value) }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {[{ value: 'price-low', label: '↑ Prix' }, { value: 'price-high', label: '↓ Prix' }].map(s => (
                      <button key={s.value} onClick={() => { playFilterTick(); setSortBy(s.value) }} className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: T.filterBg(sortBy === s.value), border: `1px solid ${T.filterBorder(sortBy === s.value)}`, color: T.filterColor(sortBy === s.value) }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { playFilterTick(); setShowOnlyFavorites(v => !v) }} className="p-2 rounded-xl transition-all"
                    style={{ background: showOnlyFavorites ? 'rgba(239,68,68,0.12)' : T.cardBg, border: `1px solid ${showOnlyFavorites ? 'rgba(239,68,68,0.28)' : T.cardBorder}` }}>
                    <Heart className="w-4 h-4" style={{ color: showOnlyFavorites ? '#f87171' : '#475569', fill: showOnlyFavorites ? '#f87171' : 'none' }} />
                  </button>
                  <span className="text-xs ml-auto" style={{ color: T.textFaint }}>{filteredBoxes.length} résultats</span>
                </div>
              </div>

              {/* Box grid */}
              <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'none' }}>
                {filteredBoxes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Search className="w-8 h-8 mb-3" style={{ color: 'rgba(148,163,184,0.18)' }} />
                    <p className="text-sm" style={{ color: 'rgba(148,163,184,0.3)' }}>Aucune case trouvée</p>
                  </div>
                ) : (
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}>
                    {filteredBoxes.map((box) => {
                      const addedQty = selectedBoxes.find(b => b.id === box.id)?.quantity || 0
                      const isFavorite = favorites.has(box.id)
                      return (
                        <motion.div key={box.id} whileHover={{ y: -5 }}
                          className="relative flex flex-col rounded-2xl p-4 group"
                          style={{ background: T.boxBg(addedQty > 0), border: `1px solid ${T.boxBorder(addedQty > 0)}` }}>
                          <button onClick={() => { playFilterTick(); toggleFavorite(box.id) }} className="absolute top-2.5 right-2.5 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.4)' }}>
                            <Heart className="w-3.5 h-3.5" style={{ color: isFavorite ? '#f87171' : '#64748b', fill: isFavorite ? '#f87171' : 'none' }} />
                          </button>
                          {addedQty > 0 && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                              style={{ background: '#3b82f6', boxShadow: '0 0 14px rgba(59,130,246,0.55)' }}>
                              {addedQty}
                            </motion.div>
                          )}
                          <div className="flex items-center justify-center mb-3" style={{ height: '5.5rem' }}>
                            <img src={box.image_url} alt={box.name} className="max-h-full max-w-full object-contain"
                              style={{ filter: addedQty > 0 ? 'drop-shadow(0 4px 14px rgba(59,130,246,0.38))' : 'none', transition: 'filter 0.3s' }} />
                          </div>
                          <div className="text-xs font-semibold text-center truncate mb-1" style={{ color: 'rgba(226,232,240,0.82)' }}>{box.name}</div>
                          <div className="flex items-center justify-center gap-1 mb-3">
                            <CoinIcon size={11} />
                            <span className="text-xs font-bold" style={{ color: 'rgba(148,163,184,0.65)' }}>{parseFloat(box.price_virtual).toFixed(0)}</span>
                          </div>
                          {addedQty > 0 ? (
                            <div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)' }}>
                              <button onClick={() => { playBoxRemove(); updateQuantity(box.id, -1) }} className="w-6 h-6 rounded flex items-center justify-center text-sm hover:bg-white/10 transition-colors" style={{ color: 'rgba(148,163,184,0.6)' }}>−</button>
                              <input type="number" min="1" max={MAX_BOXES} value={addedQty} onChange={e => setBoxQuantity(box.id, parseInt(e.target.value) || 1)} className="w-8 text-center bg-transparent text-xs font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{ color: T.inputText }} />
                              <button onClick={() => { playBoxAdd(); updateQuantity(box.id, 1) }} className="w-6 h-6 rounded flex items-center justify-center text-sm hover:bg-white/10 transition-colors" style={{ color: 'rgba(148,163,184,0.6)' }}>+</button>
                            </div>
                          ) : (
                            <motion.button onClick={() => { playBoxAdd(); addBox(box) }} whileTap={{ scale: 0.95 }}
                              className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', color: '#60a5fa' }}
                              whileHover={{ background: 'rgba(59,130,246,0.22)' }}>
                              <Plus className="w-3.5 h-3.5" /> Ajouter
                            </motion.button>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-8 py-5 border-t flex items-center justify-between flex-shrink-0" style={{ borderColor: T.balanceBorder, background: isDark ? 'rgba(12,18,32,0.7)' : 'rgba(241,245,249,0.9)' }}>
                <div className="flex items-center gap-4 text-sm">
                  <span style={{ color: totalBoxes > MAX_BOXES ? '#ef4444' : 'rgba(148,163,184,0.6)' }}>{totalBoxes} / {MAX_BOXES} cases</span>
                  <span style={{ color: 'rgba(148,163,184,0.3)' }}>·</span>
                  <div className="flex items-center gap-1.5" style={{ color: 'rgba(226,232,240,0.8)' }}>
                    <CoinIcon size={13} />
                    <span className="font-bold">{totalValue.toFixed(0)}</span>
                  </div>
                </div>
                <motion.button onClick={() => { playInventoryClose(); setShowCatalog(false) }} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                  className="px-8 py-2.5 rounded-2xl font-black text-sm"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: '1px solid rgba(59,130,246,0.5)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
                  Confirmer la sélection
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorNotification && <ErrorNotification message={errorNotification} onClose={() => setErrorNotification(null)} />}
      </AnimatePresence>
    </div>
  )
}