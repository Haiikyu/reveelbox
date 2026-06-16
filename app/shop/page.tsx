'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useAuthModal } from '@/app/components/AuthModalProvider'
import { useTheme } from '@/app/components/ThemeProvider'
import { createClient } from '@/utils/supabase/client'
import { useQuickNotifications } from '@/app/components/ui'
import { useSound } from '@/app/hooks/useSound'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pin,
  Image as ImageIcon,
  Frame,
  Palette,
  Sparkles,
  Check,
  Lock,
  Eye,
  RotateCcw,
  ShoppingCart,
  Flame,
  ArrowUpDown,
  Clock,
  Star,
  Plus,
  X,
  Layers,
  Gem,
  Package,
  Trash2
} from 'lucide-react'

const COIN_IMG = 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png'
import { useReevs } from '@/app/hooks/useReevs'

// --- XP Helpers ---
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 }, { level: 2, xp: 100 }, { level: 10, xp: 1500 },
  { level: 20, xp: 7500 }, { level: 30, xp: 20000 }, { level: 40, xp: 50000 },
  { level: 50, xp: 150000 }, { level: 60, xp: 350000 }, { level: 70, xp: 1000000 },
  { level: 80, xp: 2500000 }, { level: 90, xp: 7500000 }, { level: 100, xp: 20000000 },
]

function getCurrentLevelExp(totalExp: number, level: number): number {
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (level >= LEVEL_THRESHOLDS[i].level && level < LEVEL_THRESHOLDS[i + 1].level) {
      const l = LEVEL_THRESHOLDS[i], u = LEVEL_THRESHOLDS[i + 1]
      const ratio = (level - l.level) / (u.level - l.level)
      return totalExp - Math.floor(l.xp + ratio * (u.xp - l.xp))
    }
  }
  return 0
}

function getExpToNextLevel(totalExp: number, level: number): number {
  if (level >= 100) return 0
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (level >= LEVEL_THRESHOLDS[i].level && level < LEVEL_THRESHOLDS[i + 1].level) {
      const l = LEVEL_THRESHOLDS[i], u = LEVEL_THRESHOLDS[i + 1]
      const range = u.level - l.level, xpRange = u.xp - l.xp
      const cur = Math.floor(l.xp + ((level - l.level) / range) * xpRange)
      const next = Math.floor(l.xp + ((level + 1 - l.level) / range) * xpRange)
      return next - cur
    }
  }
  return 100
}

function getAvatarFrameClasses(frame: string = 'default'): string {
  const frames: Record<string, string> = {
    default: 'border-2 border-gray-400/50',
    indigo: 'border-2 border-indigo-500 shadow-lg shadow-indigo-500/50',
    gold: 'border-2 border-yellow-500 shadow-lg shadow-yellow-500/50',
    diamond: 'border-2 border-blue-500 shadow-lg shadow-blue-500/50',
    ruby: 'border-2 border-red-500 shadow-lg shadow-red-500/50',
    rainbow: 'border-2 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-0.5',
    cosmic: 'border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 p-0.5',
    neon: 'border-2 border-cyan-500 shadow-2xl shadow-cyan-500/80',
    legendary: 'border-2 border-transparent bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-0.5',
    mythic: 'border-2 border-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5'
  }
  return frames[frame] || frames.default
}

function isNewItem(created_at?: string): boolean {
  if (!created_at) return false
  const diff = Date.now() - new Date(created_at).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
}

// --- Module-level cache (survit aux remontages du composant lors de la navigation) ---
interface ShopDataCache {
  userId: string
  pins: ShopItem[]
  banners: ShopItem[]
  frames: ShopItem[]
  nameColors: ShopColorItem[]
  backgrounds: ShopBackgroundItem[]
}
let _shopCache: ShopDataCache | null = null

// --- Types ---
interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  reevs_price?: number | null
  svg_code: string | null
  image_url: string | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  is_owned?: boolean
  is_equipped?: boolean
  slot_number?: number | null
  created_at?: string
}

interface ShopColorItem {
  id: string
  name: string
  description: string
  price: number
  reevs_price?: number | null
  color_value: string
  is_gradient: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  is_owned?: boolean
  is_equipped?: boolean
  created_at?: string
}

interface ShopBackgroundItem {
  id: string
  name: string
  description: string
  price: number
  reevs_price?: number | null
  image_url: string | null
  css_value: string | null
  svg_code: string | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  is_owned?: boolean
  is_equipped?: boolean
  created_at?: string
}

type TabType = 'pins' | 'banners' | 'frames' | 'colors' | 'backgrounds' | 'inventory'
type SortType = 'price_asc' | 'rarity' | 'newest'

const RARITY_ORDER: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 }

export default function ShopPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { openLoginModal } = useAuthModal()
  const { resolvedTheme } = useTheme()
  const { success, error: showError } = useQuickNotifications()
  const { playSound } = useSound()
  const supabase = createClient()
  const { balance: reevBalance, buyWithReevs } = useReevs(user?.id)
  const displayReevs = reevBalance ?? 0

  const [pins, setPins] = useState<ShopItem[]>([])
  const [banners, setBanners] = useState<ShopItem[]>([])
  const [frames, setFrames] = useState<ShopItem[]>([])
  const [nameColors, setNameColors] = useState<ShopColorItem[]>([])
  const [backgrounds, setBackgrounds] = useState<ShopBackgroundItem[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('pins')
  const [sortBy, setSortBy] = useState<SortType>('price_asc')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [equipping, setEquipping] = useState<string | null>(null)
  const [hoveredColorId, setHoveredColorId] = useState<string | null>(null)
  const [hoveredBannerId, setHoveredBannerId] = useState<string | null>(null)
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null)
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null)
  const [hoveredBackgroundId, setHoveredBackgroundId] = useState<string | null>(null)

  const [slotPickerPin, setSlotPickerPin] = useState<ShopItem | null>(null)

  // Sélections de preview par catégorie (indépendantes, persistent quand on change d'onglet)
  const [previewSelections, setPreviewSelections] = useState<Partial<Record<TabType, string>>>({})

  const isDark = resolvedTheme === 'dark'

  const cardStyle = useMemo(() => ({
    background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(248,250,252,0.95)',
    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(148,163,184,0.2)',
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)'
  }), [isDark])

  // --- Items sélectionnés par catégorie (pour le preview) ---
  const selectedItem = useMemo(() => {
    const id = previewSelections['banners'] ?? previewSelections['frames'] ?? previewSelections['pins'] ?? null
    if (!id) return null
    if (previewSelections['banners']) return banners.find(i => i.id === id) || null
    if (previewSelections['frames']) return frames.find(i => i.id === id) || null
    if (previewSelections['pins']) return pins.find(i => i.id === id) || null
    return null
  }, [previewSelections, banners, frames, pins])

  const selectedBannerItem = useMemo(() => {
    const id = previewSelections['banners']
    return id ? banners.find(i => i.id === id) || null : null
  }, [previewSelections, banners])

  const selectedFrameItem = useMemo(() => {
    const id = previewSelections['frames']
    return id ? frames.find(i => i.id === id) || null : null
  }, [previewSelections, frames])

  const selectedBackground = useMemo(() => {
    const id = previewSelections['backgrounds']
    return id ? backgrounds.find(b => b.id === id) || null : null
  }, [previewSelections, backgrounds])

  const selectedColor = useMemo(() => {
    const id = previewSelections['colors']
    return id ? nameColors.find(c => c.id === id) || null : null
  }, [previewSelections, nameColors])

  // --- Data loading ---
  const loadPins = useCallback(async () => {
    const { data: shopPins } = await supabase.from('shop_pins').select('*').order('price').limit(200)
    const userPins = user ? (await supabase.from('user_pins').select('pin_id, is_equipped, slot_number').eq('user_id', user.id)).data : null
    const result = (shopPins || []).map(pin => ({
      ...pin,
      is_owned: !!userPins?.find(up => up.pin_id === pin.id),
      is_equipped: userPins?.find(up => up.pin_id === pin.id)?.is_equipped || false,
      slot_number: userPins?.find(up => up.pin_id === pin.id)?.slot_number ?? null,
    }))
    setPins(result)
    if (user && _shopCache?.userId === user.id) _shopCache.pins = result
  }, [user, supabase])

  const loadBanners = useCallback(async () => {
    const { data: shopBanners } = await supabase.from('shop_banners').select('*').order('price').limit(200)
    const userBanners = user ? (await supabase.from('user_banners').select('banner_id, is_equipped').eq('user_id', user.id)).data : null
    const result = (shopBanners || []).map(banner => ({
      ...banner,
      is_owned: !!userBanners?.find(ub => ub.banner_id === banner.id),
      is_equipped: userBanners?.find(ub => ub.banner_id === banner.id)?.is_equipped || false
    }))
    setBanners(result)
    if (user && _shopCache?.userId === user.id) _shopCache.banners = result
  }, [user, supabase])

  const loadFrames = useCallback(async () => {
    const { data: shopFrames } = await supabase.from('shop_frames').select('*').order('price').limit(200)
    const userFrames = user ? (await supabase.from('user_frames').select('frame_id, is_equipped').eq('user_id', user.id)).data : null
    const result = (shopFrames || []).map(frame => ({
      ...frame,
      is_owned: !!userFrames?.find(uf => uf.frame_id === frame.id),
      is_equipped: userFrames?.find(uf => uf.frame_id === frame.id)?.is_equipped || false
    }))
    setFrames(result)
    if (user && _shopCache?.userId === user.id) _shopCache.frames = result
  }, [user, supabase])

  const loadNameColors = useCallback(async () => {
    const { data: shopColors } = await supabase.from('shop_name_colors').select('*').order('price').limit(200)
    const userColors = user ? (await supabase.from('user_name_colors').select('color_id, is_equipped').eq('user_id', user.id)).data : null
    const result = (shopColors || []).map(color => ({
      ...color,
      is_owned: !!userColors?.find(uc => uc.color_id === color.id),
      is_equipped: userColors?.find(uc => uc.color_id === color.id)?.is_equipped || false
    }))
    setNameColors(result)
    if (user && _shopCache?.userId === user.id) _shopCache.nameColors = result
  }, [user, supabase])

  const loadBackgrounds = useCallback(async () => {
    const { data: shopBgs } = await supabase.from('shop_backgrounds').select('*').order('price').limit(200)
    const userBgs = user ? (await supabase.from('user_backgrounds').select('background_id, is_equipped').eq('user_id', user.id)).data : null
    const result = (shopBgs || []).map(bg => ({
      ...bg,
      is_owned: !!userBgs?.find(ub => ub.background_id === bg.id),
      is_equipped: userBgs?.find(ub => ub.background_id === bg.id)?.is_equipped || false
    }))
    setBackgrounds(result)
    if (user && _shopCache?.userId === user.id) _shopCache.backgrounds = result
  }, [user, supabase])

  useEffect(() => {
    // Si user connecté et cache valide, initialiser depuis le cache sans spinner
    if (user && _shopCache?.userId === user.id) {
      setPins(_shopCache.pins)
      setBanners(_shopCache.banners)
      setFrames(_shopCache.frames)
      setNameColors(_shopCache.nameColors)
      setBackgrounds(_shopCache.backgrounds)
      setLoading(false)
      Promise.all([loadPins(), loadBanners(), loadFrames(), loadNameColors(), loadBackgrounds()])
        .catch(err => console.error('Erreur refresh:', err))
      return
    }

    if (user) {
      _shopCache = { userId: user.id, pins: [], banners: [], frames: [], nameColors: [], backgrounds: [] }
    }
    setLoading(true)
    Promise.all([loadPins(), loadBanners(), loadFrames(), loadNameColors(), loadBackgrounds()])
      .catch(err => console.error('Erreur chargement:', err))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // TEMPS RÉEL : Recharger automatiquement quand les cosmétiques changent
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel(`shop-cosmetics-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_pins',
        filter: `user_id=eq.${user.id}`
      }, () => { loadPins() })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_banners',
        filter: `user_id=eq.${user.id}`
      }, () => { loadBanners() })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_frames',
        filter: `user_id=eq.${user.id}`
      }, () => { loadFrames() })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_name_colors',
        filter: `user_id=eq.${user.id}`
      }, () => { loadNameColors() })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_backgrounds',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadBackgrounds()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, loadPins, loadBanners, loadFrames, loadNameColors, loadBackgrounds])

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#f59e0b', label: 'Légendaire', glow: 'rgba(245,158,11,0.3)', border: 'rgba(245,158,11,0.45)' }
      case 'epic': return { bg: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: '#a855f7', label: 'Épique', glow: 'rgba(168,85,247,0.3)', border: 'rgba(168,85,247,0.45)' }
      case 'rare': return { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#3b82f6', label: 'Rare', glow: 'rgba(59,130,246,0.25)', border: 'rgba(59,130,246,0.4)' }
      default: return { bg: 'linear-gradient(135deg, #6b7280, #4b5563)', color: '#6b7280', label: 'Commun', glow: 'rgba(0,0,0,0)', border: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.15)' }
    }
  }

  // --- Purchase ---
  const purchase = useCallback(async (item: ShopItem | ShopColorItem | ShopBackgroundItem, type: TabType) => {
    if (!user) { openLoginModal(); return }
    if (!profile || profile.virtual_currency < item.price) {
      showError('Solde insuffisant', 'Vous n\'avez pas assez de coins')
      return
    }
    setPurchasing(item.id)
    try {
      const rpcName = type === 'pins' ? 'buy_pin' : type === 'banners' ? 'buy_banner' : type === 'frames' ? 'buy_frame' : type === 'backgrounds' ? 'buy_background' : 'buy_name_color'
      const paramName = type === 'pins' ? 'p_pin_id' : type === 'banners' ? 'p_banner_id' : type === 'frames' ? 'p_frame_id' : type === 'backgrounds' ? 'p_background_id' : 'p_color_id'
      const { error } = await supabase.rpc(rpcName, { p_user_id: user.id, [paramName]: item.id })
      if (error) throw error
      playSound('reveal')
      success('Achat reussi !', `${item.name} ajoute a votre collection`)
      await refreshProfile()
      if (type === 'pins') await loadPins()
      else if (type === 'banners') await loadBanners()
      else if (type === 'frames') await loadFrames()
      else if (type === 'backgrounds') await loadBackgrounds()
      else await loadNameColors()
    } catch (err: unknown) {
      showError('Erreur', err instanceof Error ? err.message : 'Erreur lors de l\'achat')
    } finally {
      setPurchasing(null)
    }
  }, [user, profile, supabase, refreshProfile, loadPins, loadBanners, loadFrames, loadNameColors, loadBackgrounds, success, showError, playSound])

  // --- Purchase with Reevs ---
  const purchaseWithReevs = useCallback(async (item: ShopItem | ShopColorItem | ShopBackgroundItem, type: TabType) => {
    if (!user) { openLoginModal(); return }
    const itemTypeMap: Partial<Record<TabType, 'frame' | 'banner' | 'pin' | 'name_color' | 'background'>> = {
      frames: 'frame', banners: 'banner', pins: 'pin', colors: 'name_color', backgrounds: 'background'
    }
    if (!itemTypeMap[type]) return
    setPurchasing(item.id)
    try {
      const result = await buyWithReevs(item.id, itemTypeMap[type]!)
      if (!result.success) {
        showError('Échec', result.message)
        return
      }
      playSound('reveal')
      success('Achat Reevs réussi !', `${item.name} ajouté à votre collection`)
      if (type === 'pins') await loadPins()
      else if (type === 'banners') await loadBanners()
      else if (type === 'frames') await loadFrames()
      else if (type === 'backgrounds') await loadBackgrounds()
      else await loadNameColors()
    } catch (err: unknown) {
      showError('Erreur', err instanceof Error ? err.message : 'Erreur lors de l\'achat')
    } finally {
      setPurchasing(null)
    }
  }, [user, buyWithReevs, loadPins, loadBanners, loadFrames, loadNameColors, loadBackgrounds, success, showError, playSound])

  // --- Equip (SVG items) ---
  const equip = useCallback(async (item: ShopItem, type: Exclude<TabType, 'colors'>) => {
    if (!user) { openLoginModal(); return }

    // For pins: if equipping, open slot picker; if unequipping, proceed directly
    if (type === 'pins') {
      if (!item.is_equipped) {
        setSlotPickerPin(item)
        return
      }
      // Unequip pin
      setEquipping(item.id)
      const prevItems = [...pins]
      setPins(prev => prev.map(i => ({ ...i, is_equipped: i.id === item.id ? false : i.is_equipped, slot_number: i.id === item.id ? null : i.slot_number })))
      try {
        const { error } = await supabase.rpc('equip_pin', { p_user_id: user.id, p_pin_id: item.id, p_equip: false, p_slot: item.slot_number ?? 1 })
        if (error) throw error
        playSound('snap')
        await refreshProfile()
      } catch (err: unknown) {
        setPins(prevItems)
        showError('Erreur', err instanceof Error ? err.message : (err as {message?: string})?.message || 'Impossible de déséquiper')
      } finally {
        setEquipping(null)
      }
      return
    }

    // Pour bannières/cadres : ne PAS permettre le déséquipement (seulement remplacer)
    if (item.is_equipped) {
      // Déjà équipé, ne rien faire
      showError('Deja equipe', 'Cet item est deja equipe')
      return
    }

    // Équiper le nouvel item (déséquipe automatiquement l'ancien)
    setEquipping(item.id)

    const setter = type === 'banners' ? setBanners : setFrames
    const prevItems = type === 'banners' ? [...banners] : [...frames]
    setter(prev => prev.map(i => ({ ...i, is_equipped: i.id === item.id })))

    try {
      const rpcName = type === 'banners' ? 'equip_banner' : 'equip_frame'
      const paramName = type === 'banners' ? 'p_banner_id' : 'p_frame_id'
      const { error } = await supabase.rpc(rpcName, { p_user_id: user.id, [paramName]: item.id, p_equip: true })
      if (error) throw error
      playSound('snap')
      await refreshProfile()
    } catch (err: unknown) {
      setter(prevItems as ShopItem[])
      showError('Erreur', err instanceof Error ? err.message : 'Impossible d\'equiper cet objet')
    } finally {
      setEquipping(null)
    }
  }, [user, supabase, refreshProfile, banners, frames, showError, playSound])

  // --- Equip pin in specific slot ---
  const equipPinInSlot = useCallback(async (item: ShopItem, slot: number) => {
    if (!user) { openLoginModal(); return }
    setEquipping(item.id)
    setSlotPickerPin(null)

    const prevItems = [...pins]
    // Optimistic update: équipe ce pin sur ce slot, déséquipe tout autre pin sur ce slot
    setPins(prev => prev.map(p => ({
      ...p,
      is_equipped: p.id === item.id ? true : (p.slot_number === slot ? false : p.is_equipped),
      slot_number: p.id === item.id ? slot : (p.slot_number === slot ? null : p.slot_number),
    })))

    try {
      const { error } = await supabase.rpc('equip_pin', { p_user_id: user.id, p_pin_id: item.id, p_equip: true, p_slot: slot })
      if (error) throw error
      playSound('snap')
      await refreshProfile()
      await loadPins()
    } catch (err: unknown) {
      setPins(prevItems)
      showError('Erreur', err instanceof Error ? err.message : 'Impossible d\'equiper ce pin')
    } finally {
      setEquipping(null)
    }
  }, [user, supabase, refreshProfile, loadPins, pins, showError, playSound])

  // --- Equip color ---
  const equipColor = useCallback(async (color: ShopColorItem) => {
    if (!user) { openLoginModal(); return }

    // Pour les couleurs : ne PAS permettre le déséquipement (seulement remplacer)
    if (color.is_equipped) {
      showError('Deja equipe', 'Cette couleur est deja equipee')
      return
    }

    setEquipping(color.id)

    const prevColors = [...nameColors]
    setNameColors(prev => prev.map(c => ({ ...c, is_equipped: c.id === color.id })))

    try {
      const { error } = await supabase.rpc('equip_name_color', { p_user_id: user.id, p_color_id: color.id, p_equip: true })
      if (error) throw error
      playSound('snap')
      await refreshProfile()
    } catch (err: unknown) {
      setNameColors(prevColors)
      showError('Erreur', err instanceof Error ? err.message : 'Impossible d\'equiper cette couleur')
    } finally {
      setEquipping(null)
    }
  }, [user, supabase, refreshProfile, nameColors, showError, playSound])

  // --- Equip background ---
  const equipBackground = useCallback(async (bg: ShopBackgroundItem) => {
    if (!user) { openLoginModal(); return }
    if (bg.is_equipped) {
      showError('Deja equipe', 'Ce fond est deja equipe')
      return
    }
    setEquipping(bg.id)
    const prevBgs = [...backgrounds]
    setBackgrounds(prev => prev.map(b => ({ ...b, is_equipped: b.id === bg.id ? true : false })))
    try {
      const { error } = await supabase.rpc('equip_background', { p_user_id: user.id, p_background_id: bg.id, p_equip: true })
      if (error) throw error
      playSound('snap')
      await refreshProfile()
    } catch (err: unknown) {
      setBackgrounds(prevBgs)
      showError('Erreur', err instanceof Error ? err.message : 'Impossible d\'equiper ce fond')
    } finally {
      setEquipping(null)
    }
  }, [user, supabase, refreshProfile, backgrounds, showError, playSound])

  // --- États équipés dérivés des arrays (pas de state séparé → pas de désync entre catégories) ---
  const equippedBanner = useMemo(() => {
    const b = banners.find(i => i.is_equipped)
    return b ? (b.image_url || b.svg_code) : null
  }, [banners])

  const equippedFrame = useMemo(() => {
    const f = frames.find(i => i.is_equipped)
    return f ? (f.image_url || f.svg_code) : null
  }, [frames])

  const equippedBackground = useMemo(() => backgrounds.find(b => b.is_equipped) || null, [backgrounds])

  const equippedNameColor = useMemo(() => nameColors.find(c => c.is_equipped) || null, [nameColors])

  const equippedPins = useMemo(() =>
    pins
      .filter(p => p.is_equipped)
      .map(p => ({ svg_code: p.image_url || p.svg_code || '', slot_number: p.slot_number ?? null }))
      .sort((a, b) => (a.slot_number ?? 99) - (b.slot_number ?? 99))
  , [pins])

  // --- Unequip individual item ---
  const unequipItem = useCallback(async (type: Exclude<TabType, 'inventory'>, id: string) => {
    if (!user) { openLoginModal(); return }
    setEquipping(id)
    const prevPins = [...pins], prevBanners = [...banners], prevFrames = [...frames]
    const prevColors = [...nameColors], prevBgs = [...backgrounds]
    try {
      if (type === 'pins') {
        const pin = pins.find(p => p.id === id)
        setPins(prev => prev.map(p => p.id === id ? { ...p, is_equipped: false, slot_number: null } : p))
        const { error } = await supabase.rpc('equip_pin', { p_user_id: user.id, p_pin_id: id, p_equip: false, p_slot: pin?.slot_number ?? 1 })
        if (error) throw error
      } else if (type === 'banners') {
        setBanners(prev => prev.map(b => b.id === id ? { ...b, is_equipped: false } : b))
        const { error } = await supabase.rpc('equip_banner', { p_user_id: user.id, p_banner_id: id, p_equip: false })
        if (error) throw error
      } else if (type === 'frames') {
        setFrames(prev => prev.map(f => f.id === id ? { ...f, is_equipped: false } : f))
        const { error } = await supabase.rpc('equip_frame', { p_user_id: user.id, p_frame_id: id, p_equip: false })
        if (error) throw error
      } else if (type === 'colors') {
        setNameColors(prev => prev.map(c => c.id === id ? { ...c, is_equipped: false } : c))
        const { error } = await supabase.rpc('equip_name_color', { p_user_id: user.id, p_color_id: id, p_equip: false })
        if (error) throw error
      } else if (type === 'backgrounds') {
        setBackgrounds(prev => prev.map(b => b.id === id ? { ...b, is_equipped: false } : b))
        const { error } = await supabase.rpc('equip_background', { p_user_id: user.id, p_background_id: id, p_equip: false })
        if (error) throw error
      }
      playSound('snap')
      await refreshProfile()
    } catch (err: unknown) {
      setPins(prevPins); setBanners(prevBanners); setFrames(prevFrames)
      setNameColors(prevColors); setBackgrounds(prevBgs)
      showError('Erreur', err instanceof Error ? err.message : 'Impossible de déséquiper')
    } finally {
      setEquipping(null)
    }
  }, [user, supabase, refreshProfile, pins, banners, frames, nameColors, backgrounds, showError, playSound])

  // --- Unequip everything ---
  const unequipAll = useCallback(async () => {
    if (!user) { openLoginModal(); return }
    const calls: (() => Promise<unknown>)[] = []
    if (equippedBanner) {
      const b = banners.find(x => x.is_equipped)
      if (b) calls.push(async () => { await supabase.rpc('equip_banner', { p_user_id: user.id, p_banner_id: b.id, p_equip: false }) })
    }
    if (equippedFrame) {
      const f = frames.find(x => x.is_equipped)
      if (f) calls.push(async () => { await supabase.rpc('equip_frame', { p_user_id: user.id, p_frame_id: f.id, p_equip: false }) })
    }
    equippedPins.forEach(p => {
      const pin = pins.find(x => x.is_equipped && (x.image_url || x.svg_code) === p.svg_code)
      if (pin) calls.push(async () => { await supabase.rpc('equip_pin', { p_user_id: user.id, p_pin_id: pin.id, p_equip: false, p_slot: pin.slot_number ?? 1 }) })
    })
    if (equippedNameColor) calls.push(async () => { await supabase.rpc('equip_name_color', { p_user_id: user.id, p_color_id: equippedNameColor.id, p_equip: false }) })
    if (equippedBackground) calls.push(async () => { await supabase.rpc('equip_background', { p_user_id: user.id, p_background_id: equippedBackground.id, p_equip: false }) })

    // Optimistic
    setPins(prev => prev.map(p => ({ ...p, is_equipped: false, slot_number: null })))
    setBanners(prev => prev.map(b => ({ ...b, is_equipped: false })))
    setFrames(prev => prev.map(f => ({ ...f, is_equipped: false })))
    setNameColors(prev => prev.map(c => ({ ...c, is_equipped: false })))
    setBackgrounds(prev => prev.map(b => ({ ...b, is_equipped: false })))

    try {
      await Promise.all(calls.map(fn => fn()))
      playSound('snap')
      success('Tout déséquipé', 'Votre profil est vierge')
      await refreshProfile()
    } catch {
      // reload to get real state
      await Promise.all([loadPins(), loadBanners(), loadFrames(), loadNameColors(), loadBackgrounds()])
    }
  }, [user, supabase, refreshProfile, banners, frames, pins, nameColors, backgrounds, equippedBanner, equippedFrame, equippedPins, equippedNameColor, equippedBackground, playSound, success, loadPins, loadBanners, loadFrames, loadNameColors, loadBackgrounds])

  // --- Sorting ---
  const sortItems = useCallback(<T extends { price: number; rarity: string; created_at?: string }>(items: T[]): T[] => {
    const sorted = [...items]
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price - b.price)
      case 'rarity':
        return sorted.sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0))
      case 'newest':
        return sorted.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0
          const db = b.created_at ? new Date(b.created_at).getTime() : 0
          return db - da
        })
      default:
        return sorted
    }
  }, [sortBy])

  const currentItems = useMemo(() => {
    if (activeTab === 'colors') return sortItems(nameColors)
    if (activeTab === 'backgrounds') return sortItems(backgrounds)
    const list = activeTab === 'pins' ? pins : activeTab === 'banners' ? banners : frames
    return sortItems(list)
  }, [activeTab, pins, banners, frames, nameColors, backgrounds, sortItems])

  // --- Preview logic (survolé > sélectionné > équipé) ---
  // Chaque catégorie est indépendante grâce à previewSelections map

  const previewBanner = useMemo(() => {
    if (hoveredBannerId) return banners.find(b => b.id === hoveredBannerId)?.image_url || banners.find(b => b.id === hoveredBannerId)?.svg_code || null
    if (selectedBannerItem) return selectedBannerItem.image_url || selectedBannerItem.svg_code
    return equippedBanner
  }, [hoveredBannerId, banners, selectedBannerItem, equippedBanner])

  const previewFrameSvg = useMemo(() => {
    if (hoveredFrameId) return frames.find(f => f.id === hoveredFrameId)?.image_url || frames.find(f => f.id === hoveredFrameId)?.svg_code || null
    if (selectedFrameItem) return selectedFrameItem.image_url || selectedFrameItem.svg_code
    return equippedFrame
  }, [hoveredFrameId, frames, selectedFrameItem, equippedFrame])

  // Helper : SVG inline ou URL image
  const isSvg = (s: string) => s.trim().startsWith('<')

  // Build a 4-slot pin array for display (slot 1-4)
  const previewPinSlots = useMemo(() => {
    const slots: (string | null)[] = [null, null, null, null]
    equippedPins.forEach(p => {
      if (p.slot_number && p.slot_number >= 1 && p.slot_number <= 4) {
        slots[p.slot_number - 1] = p.svg_code
      }
    })
    const previewPinId = hoveredPinId || previewSelections['pins'] || null
    if (previewPinId) {
      const previewPin = pins.find(p => p.id === previewPinId)
      if (previewPin) {
        const content = previewPin.image_url || previewPin.svg_code || ''
        if (content) {
          const firstEmpty = slots.findIndex(s => s === null)
          if (firstEmpty !== -1) slots[firstEmpty] = content
          else slots[0] = content
        }
      }
    }
    return slots
  }, [equippedPins, hoveredPinId, previewSelections, pins])

  // Background preview: hovered > selected > equipped
  const previewBackground = useMemo(() => {
    if (hoveredBackgroundId) return backgrounds.find(b => b.id === hoveredBackgroundId) || null
    if (selectedBackground) return selectedBackground
    return equippedBackground
  }, [hoveredBackgroundId, backgrounds, selectedBackground, equippedBackground])

  // Color preview: hovered > selected > equipped
  const previewNameColor = useMemo(() => {
    if (hoveredColorId) return nameColors.find(c => c.id === hoveredColorId) || null
    if (selectedColor) return selectedColor
    return equippedNameColor
  }, [hoveredColorId, nameColors, selectedColor, equippedNameColor])

  const usernameStyle = useMemo((): React.CSSProperties => {
    if (!previewNameColor) return {}
    if (previewNameColor.is_gradient) {
      return { backgroundImage: previewNameColor.color_value, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
    }
    return { color: previewNameColor.color_value }
  }, [previewNameColor])

  // Nom des items survolés/sélectionnés pour le hint
  const hoveredItemName = useMemo(() => {
    if (hoveredPinId) return pins.find(p => p.id === hoveredPinId)?.name
    if (hoveredBannerId) return banners.find(b => b.id === hoveredBannerId)?.name
    if (hoveredFrameId) return frames.find(f => f.id === hoveredFrameId)?.name
    if (hoveredColorId) return nameColors.find(c => c.id === hoveredColorId)?.name
    if (hoveredBackgroundId) return backgrounds.find(b => b.id === hoveredBackgroundId)?.name
    return null
  }, [hoveredPinId, hoveredBannerId, hoveredFrameId, hoveredColorId, hoveredBackgroundId, pins, banners, frames, nameColors, backgrounds])

  // Items sélectionnés (cliqués) dans toutes les catégories
  const clickedItemNames = useMemo(() => {
    const names: string[] = []
    if (previewSelections['pins']) { const n = pins.find(p => p.id === previewSelections['pins'])?.name; if (n) names.push(n) }
    if (previewSelections['banners']) { const n = banners.find(b => b.id === previewSelections['banners'])?.name; if (n) names.push(n) }
    if (previewSelections['frames']) { const n = frames.find(f => f.id === previewSelections['frames'])?.name; if (n) names.push(n) }
    if (previewSelections['colors']) { const n = nameColors.find(c => c.id === previewSelections['colors'])?.name; if (n) names.push(n) }
    if (previewSelections['backgrounds']) { const n = backgrounds.find(b => b.id === previewSelections['backgrounds'])?.name; if (n) names.push(n) }
    return names
  }, [previewSelections, pins, banners, frames, nameColors, backgrounds])

  const hasAnyPreviewSelection = Object.keys(previewSelections).some(k => previewSelections[k as TabType])

  // Toggle par catégorie : cliquer deux fois déselectionne
  const handleSelect = useCallback((id: string) => {
    setPreviewSelections(prev => ({
      ...prev,
      [activeTab]: prev[activeTab] === id ? undefined : id
    }))
  }, [activeTab])

  const handleReset = useCallback(() => {
    setPreviewSelections({})
  }, [])

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    playSound('tick')
  }, [playSound])

  const filterCategories = [
    { id: 'pins' as TabType, label: 'Pins', icon: Pin },
    { id: 'banners' as TabType, label: 'Bannières', icon: ImageIcon },
    { id: 'frames' as TabType, label: 'Cadres', icon: Frame },
    { id: 'colors' as TabType, label: 'Couleurs', icon: Palette },
    { id: 'backgrounds' as TabType, label: 'Fonds', icon: Layers },
    { id: 'inventory' as TabType, label: 'Équipés', icon: Package },
  ]

  const sortOptions: { id: SortType; label: string; icon: typeof ArrowUpDown }[] = [
    { id: 'price_asc', label: 'Prix', icon: ArrowUpDown },
    { id: 'rarity', label: 'Rarete', icon: Star },
    { id: 'newest', label: 'Nouveautes', icon: Clock },
  ]

  const getCategoryHeader = () => {
    if (activeTab === 'inventory') {
      const total = [equippedBanner, equippedFrame, equippedBackground, equippedNameColor].filter(Boolean).length + equippedPins.length
      return { title: 'Équipés', desc: 'Vos cosmétiques actuellement équipés', count: `${total}` }
    }
    const allItems = activeTab === 'colors' ? nameColors : activeTab === 'backgrounds' ? backgrounds : activeTab === 'pins' ? pins : activeTab === 'banners' ? banners : frames
    const owned = allItems.filter(i => i.is_owned).length
    switch (activeTab) {
      case 'pins': return { title: 'Pins', desc: 'Décorez votre profil avec des pins uniques', count: `${owned}/${allItems.length}` }
      case 'banners': return { title: 'Bannières', desc: 'Changez l\'arrière-plan de votre profil', count: `${owned}/${allItems.length}` }
      case 'frames': return { title: 'Cadres', desc: 'Encadrez votre avatar avec style', count: `${owned}/${allItems.length}` }
      case 'colors': return { title: 'Couleurs de pseudo', desc: 'Démarquez-vous avec une couleur unique', count: `${owned}/${allItems.length}` }
      case 'backgrounds': return { title: 'Fonds de profil', desc: 'Personnalisez l\'arrière-plan de votre page profil', count: `${owned}/${allItems.length}` }
    }
  }

  const header = getCategoryHeader()
  const totalExp = Number(profile?.total_exp) || 0
  const level = Number(profile?.level) || 1
  const currentXp = getCurrentLevelExp(totalExp, level)
  const xpToNext = getExpToNextLevel(totalExp, level)
  const progressPct = xpToNext > 0 ? Math.min(100, Math.round((currentXp / xpToNext) * 100)) : 100

  if (loading) {
    return (
      <div className="min-h-screen -mt-[80px] pt-[100px] bg-slate-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen -mt-[80px] pt-[100px] pb-24 lg:pb-8 relative overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #060b14 0%, #0c1220 20%, #151f2e 40%, #1a3049 60%, #151f2e 80%, #060b14 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 33%, #ddd6fe 66%, #f8fafc 100%)'
      }}
    >
      {/* Background preview layer */}
      {previewBackground && (
        <div className="absolute inset-0 transition-opacity duration-500 pointer-events-none z-0" style={{ opacity: 0.35 }}>
          {previewBackground.svg_code && isSvg(previewBackground.svg_code)
            ? <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: previewBackground.svg_code }} />
            : previewBackground.image_url
              ? <img src={previewBackground.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
              : previewBackground.css_value
                ? <div className="absolute inset-0" style={{ background: previewBackground.css_value }} />
                : null
          }
        </div>
      )}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 lg:px-6">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: isDark ? 'rgba(148,163,184,0.9)' : '#64748b', letterSpacing: '0.02em' }}>
              Personnalisez votre profil avec des cosmétiques uniques
            </p>
            <h1 className="text-4xl lg:text-5xl font-black" style={{
              background: isDark ? 'linear-gradient(135deg, #fff 0%, #3b82f6 50%, #60a5fa 100%)' : 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Shop
            </h1>
          </div>
          {/* Stats bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {([
              { label: 'Coins', value: (profile?.virtual_currency || 0).toLocaleString(), color: '#4578be' },
              { label: 'Reevs', value: displayReevs.toLocaleString(), color: '#10b981' },
              { label: 'Possédés', value: String([...pins, ...banners, ...frames, ...nameColors, ...backgrounds].filter(i => i.is_owned).length), color: '#a855f7' },
            ] as { label: string; value: string; color: string }[]).map(stat => (
              <div key={stat.label} className="px-4 py-2 rounded-2xl flex items-center gap-2" style={cardStyle}>
                <span className="text-xs font-medium" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{stat.label}</span>
                <span className="font-black text-sm" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TABS + SORT */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {filterCategories.map((cat, index) => {
              const Icon = cat.icon
              const isActive = activeTab === cat.id
              const catItems = cat.id === 'inventory' ? [] : cat.id === 'colors' ? nameColors : cat.id === 'backgrounds' ? backgrounds : cat.id === 'pins' ? pins : cat.id === 'banners' ? banners : frames
              const ownedCount = cat.id === 'inventory'
                ? [equippedBanner, equippedFrame, equippedBackground, equippedNameColor].filter(Boolean).length + equippedPins.length
                : catItems.filter(i => i.is_owned).length
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => handleTabChange(cat.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 whitespace-nowrap"
                  style={isActive
                    ? { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(59,130,246,0.4)', border: '1px solid rgba(255,255,255,0.2)' }
                    : { background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.8)', color: isDark ? '#94a3b8' : '#64748b', border: isDark ? '1px solid rgba(148,163,184,0.1)' : '1px solid rgba(148,163,184,0.2)', backdropFilter: 'blur(12px)' }
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                  {ownedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(59,130,246,0.15)', color: isActive ? '#fff' : '#3b82f6' }}
                    >
                      {ownedCount}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
          <div className="flex gap-2">
            {sortOptions.map((opt, index) => {
              const isActive = sortBy === opt.id
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  style={isActive
                    ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))', color: '#3b82f6', border: '2px solid rgba(59,130,246,0.45)', boxShadow: '0 4px 16px rgba(59,130,246,0.15)' }
                    : { background: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(248,250,252,0.6)', color: isDark ? '#64748b' : '#94a3b8', border: '1px solid ' + (isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.15)'), backdropFilter: 'blur(8px)' }
                  }
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* PROFILE PREVIEW HORIZONTALE */}
        <div className="relative w-full rounded-[22px] overflow-hidden mb-8" style={{ height: 185, ...cardStyle }}>
          {!user && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(168,85,247,0.25)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}>
              <Eye className="w-3 h-3" />
              Mode démo — connectez-vous pour sauvegarder
            </div>
          )}
          {/* Banner BG */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e2d4a 0%, #0f1a2e 100%)' }}>
            {previewBanner && (isSvg(previewBanner)
              ? <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: previewBanner }} />
              : <img src={previewBanner} className="absolute inset-0 w-full h-full object-cover" alt="" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

          {/* Contenu */}
          <div className="absolute inset-0 flex items-center px-8 gap-7">

            {/* Avatar + cadre */}
            <div className="flex-shrink-0 relative rounded-xl overflow-hidden" style={{ width: 82, height: 82 }}>
              <img src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest'} className="w-full h-full object-cover" alt="" />
              {previewFrameSvg && (
                isSvg(previewFrameSvg)
                  ? <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full pointer-events-none" dangerouslySetInnerHTML={{ __html: previewFrameSvg }} />
                  : <img src={previewFrameSvg} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" />
              )}
            </div>

            {/* Infos centrales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-black text-xl text-white truncate" style={usernameStyle}>{profile?.username || 'Visiteur'}</h3>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.3)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}
                >
                  Niv. {level}
                </span>
              </div>
              <div style={{ maxWidth: 260 }} className="mb-3">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <span>{currentXp.toLocaleString()} XP</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
                </div>
              </div>
              {/* Pins slots */}
              <div className="flex gap-2">
                {previewPinSlots.map((content, i) => (
                  <div key={i} className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {content ? (
                      isSvg(content)
                        ? <div className="w-7 h-7 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: content }} />
                        : <img src={content} className="w-7 h-7 object-contain" alt="" />
                    ) : (
                      <Pin className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Droite : stats + hint */}
            <div className="flex-shrink-0 text-right space-y-4">
              <div className="flex gap-5 justify-end">
                <div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="font-black text-white text-lg">{profile?.consecutive_days || 0}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>jours</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Gem className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-emerald-400 text-lg">{displayReevs.toLocaleString()}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Reevs</span>
                </div>
              </div>
              <div className="space-y-2">
                {hoveredItemName ? (
                  <div>
                    <div className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Aperçu</div>
                    <div className="text-sm font-bold text-white">{hoveredItemName}</div>
                  </div>
                ) : clickedItemNames.length > 0 ? (
                  <div>
                    <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Sélectionnés</div>
                    <div className="flex flex-wrap gap-1">
                      {clickedItemNames.map(name => (
                        <span key={name} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.25)', color: '#93c5fd' }}>{name}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] max-w-[150px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Cliquez sur des items pour composer votre look
                  </div>
                )}
                {hasAnyPreviewSelection && (
                  <button onClick={handleReset} className="flex items-center gap-1 text-[10px] font-semibold transition-opacity hover:opacity-100 opacity-60" style={{ color: '#f87171' }}>
                    <RotateCcw className="w-2.5 h-2.5" />Tout effacer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS + (plus de sidebar) */}
        <div>

            {/* Category header */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">{header.title}</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.2))', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                  >
                    {header.count} Possédés
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{header.desc}</p>
              </div>
            </motion.div>

            {/* Items Grid */}
            {activeTab === 'inventory' ? (
              /* ===== INVENTAIRE : items équipés ===== */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                    {[equippedBanner, equippedFrame, equippedBackground, equippedNameColor].filter(Boolean).length + equippedPins.length === 0
                      ? 'Aucun cosmétique équipé pour le moment'
                      : `${[equippedBanner, equippedFrame, equippedBackground, equippedNameColor].filter(Boolean).length + equippedPins.length} cosmétique(s) actuellement équipé(s)`
                    }
                  </p>
                  <button
                    onClick={unequipAll}
                    disabled={[equippedBanner, equippedFrame, equippedBackground, equippedNameColor].filter(Boolean).length + equippedPins.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.28)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Tout déséquiper
                  </button>
                </div>

                {[equippedBanner, equippedFrame, equippedBackground, equippedNameColor].filter(Boolean).length + equippedPins.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="w-14 h-14 mx-auto mb-3" style={{ color: isDark ? '#334155' : '#cbd5e1' }} />
                    <p className="font-semibold" style={{ color: isDark ? '#475569' : '#94a3b8' }}>Aucun cosmétique équipé</p>
                    <p className="text-sm mt-1" style={{ color: isDark ? '#334155' : '#cbd5e1' }}>Parcourez les catégories pour équiper des items sur votre profil</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                    {/* Bannière équipée */}
                    {(() => {
                      const item = banners.find(b => b.is_equipped)
                      if (!item) return null
                      return (
                        <motion.div key="eq-banner" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-2xl overflow-hidden" style={cardStyle}>
                          <div className="relative h-[130px]">
                            {item.svg_code
                              ? <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                              : item.image_url
                                ? <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                                : <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                            }
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: 'rgba(59,130,246,0.85)' }}>Bannière</div>
                            <div className="absolute bottom-2 left-3 text-white text-xs font-bold drop-shadow">{item.name}</div>
                          </div>
                          <div className="px-3 py-2.5 flex items-center justify-between">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Équipée</span>
                            <button onClick={() => unequipItem('banners', item.id)} disabled={equipping === item.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.28)' }}>
                              {equipping === item.id ? <span className="animate-spin w-2.5 h-2.5 border border-current border-t-transparent rounded-full" /> : <><X className="w-3 h-3" />Retirer</>}
                            </button>
                          </div>
                        </motion.div>
                      )
                    })()}

                    {/* Cadre équipé */}
                    {(() => {
                      const item = frames.find(f => f.is_equipped)
                      if (!item) return null
                      return (
                        <motion.div key="eq-frame" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-2xl p-4 flex flex-col gap-3" style={cardStyle}>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 relative" style={{ width: 64, height: 64 }}>
                              <img src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} className="w-full h-full object-cover rounded-lg" alt="" />
                              {(item.svg_code || item.image_url) && (
                                (item.svg_code && isSvg(item.svg_code))
                                  ? <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full pointer-events-none" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                                  : <img src={item.image_url || item.svg_code || ''} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" />
                              )}
                            </div>
                            <div>
                              <div className="text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 w-fit text-white" style={{ background: 'rgba(168,85,247,0.85)' }}>Cadre</div>
                              <div className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</div>
                              <div className="text-xs mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{item.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Équipé</span>
                            <button onClick={() => unequipItem('frames', item.id)} disabled={equipping === item.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.28)' }}>
                              {equipping === item.id ? <span className="animate-spin w-2.5 h-2.5 border border-current border-t-transparent rounded-full" /> : <><X className="w-3 h-3" />Retirer</>}
                            </button>
                          </div>
                        </motion.div>
                      )
                    })()}

                    {/* Fond équipé */}
                    {(() => {
                      const item = backgrounds.find(b => b.is_equipped)
                      if (!item) return null
                      return (
                        <motion.div key="eq-bg" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-2xl overflow-hidden" style={cardStyle}>
                          <div className="relative h-[130px]">
                            {item.svg_code && isSvg(item.svg_code)
                              ? <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                              : item.image_url
                                ? <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                                : item.css_value
                                  ? <div className="absolute inset-0" style={{ background: item.css_value }} />
                                  : <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                            }
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: 'rgba(14,165,233,0.85)' }}>Fond</div>
                            <div className="absolute bottom-2 left-3 text-white text-xs font-bold drop-shadow">{item.name}</div>
                          </div>
                          <div className="px-3 py-2.5 flex items-center justify-between">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Équipé</span>
                            <button onClick={() => unequipItem('backgrounds', item.id)} disabled={equipping === item.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.28)' }}>
                              {equipping === item.id ? <span className="animate-spin w-2.5 h-2.5 border border-current border-t-transparent rounded-full" /> : <><X className="w-3 h-3" />Retirer</>}
                            </button>
                          </div>
                        </motion.div>
                      )
                    })()}

                    {/* Couleur équipée */}
                    {(() => {
                      const item = nameColors.find(c => c.is_equipped)
                      if (!item) return null
                      return (
                        <motion.div key="eq-color" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-2xl p-4 flex flex-col gap-3" style={cardStyle}>
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                              style={{ background: item.color_value, border: `1px solid ${getRarityStyle(item.rarity).border}` }}>
                              {item.is_gradient && <span className="text-white font-black text-xl drop-shadow">Abc</span>}
                            </div>
                            <div>
                              <div className="text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 w-fit text-white" style={{ background: 'rgba(234,179,8,0.85)' }}>Couleur</div>
                              <div className="font-bold text-sm" style={{ background: item.is_gradient ? item.color_value : undefined, WebkitBackgroundClip: item.is_gradient ? 'text' : undefined, WebkitTextFillColor: item.is_gradient ? 'transparent' : undefined, color: item.is_gradient ? undefined : item.color_value }}>
                                {profile?.username || 'Votre pseudo'}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{item.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Équipée</span>
                            <button onClick={() => unequipItem('colors', item.id)} disabled={equipping === item.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.28)' }}>
                              {equipping === item.id ? <span className="animate-spin w-2.5 h-2.5 border border-current border-t-transparent rounded-full" /> : <><X className="w-3 h-3" />Retirer</>}
                            </button>
                          </div>
                        </motion.div>
                      )
                    })()}

                    {/* Pins équipés */}
                    {pins.filter(p => p.is_equipped).sort((a, b) => (a.slot_number ?? 99) - (b.slot_number ?? 99)).map(item => (
                      <motion.div key={`eq-pin-${item.id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl p-4 flex flex-col gap-3" style={cardStyle}>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                            style={{ background: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(241,245,249,0.9)', border: `1px solid ${getRarityStyle(item.rarity).border}` }}>
                            {item.svg_code
                              ? <div className="w-10 h-10 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                              : item.image_url
                                ? <img src={item.image_url} alt={item.name} className="w-10 h-10 object-contain" />
                                : <Pin className="w-8 h-8 text-gray-400" />
                            }
                          </div>
                          <div>
                            <div className="text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 w-fit text-white" style={{ background: 'rgba(99,102,241,0.85)' }}>
                              Pin · Slot {item.slot_number ?? '?'}
                            </div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{item.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>Équipé</span>
                          <button onClick={() => unequipItem('pins', item.id)} disabled={equipping === item.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.28)' }}>
                            {equipping === item.id ? <span className="animate-spin w-2.5 h-2.5 border border-current border-t-transparent rounded-full" /> : <><X className="w-3 h-3" />Retirer</>}
                          </button>
                        </div>
                      </motion.div>
                    ))}

                  </div>
                )}
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400">Aucun item disponible</p>
              </div>
            ) : activeTab === 'pins' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                <AnimatePresence mode="popLayout">
                  {(currentItems as ShopItem[]).map((item, index) => {
                    const rarity = getRarityStyle(item.rarity)
                    const isSelected = previewSelections['pins'] === item.id
                    const isNotable = item.rarity !== 'common'
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.04, y: -3 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        onClick={() => handleSelect(item.id)}
                        onMouseEnter={() => setHoveredPinId(item.id)}
                        onMouseLeave={() => setHoveredPinId(null)}
                        className="cursor-pointer group relative p-5 rounded-2xl"
                        style={{
                          background: isSelected ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(37,99,235,0.12))' : isDark ? 'rgba(15,23,42,0.7)' : 'rgba(248,250,252,0.9)',
                          border: isSelected ? '2px solid #3b82f6' : `1px solid ${rarity.border}`,
                          boxShadow: isNotable && !isSelected ? `0 0 20px ${rarity.glow}, 0 4px 12px rgba(0,0,0,0.08)` : '0 4px 12px rgba(0,0,0,0.06)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: rarity.bg }}>
                          {rarity.label}
                        </div>
                        {item.is_equipped && (
                          <div className="absolute top-2 left-2 z-20 rounded-full p-1" style={{ background: 'rgba(59,130,246,0.9)' }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {!item.is_equipped && isNewItem(item.created_at) && (
                          <div className="absolute top-2 left-2 z-20 rounded-full p-1" style={{ background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.5)' }}>
                            <Sparkles className="w-3 h-3 text-green-400" />
                          </div>
                        )}
                        <div className="w-full aspect-square mb-3 flex items-center justify-center">
                          {item.svg_code ? (
                            <div className="[&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                          ) : item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <Pin className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</div>
                          <div className="mt-1 text-[10px] font-semibold">
                            {item.is_owned
                              ? item.is_equipped ? <span className="text-blue-400">Équipé</span> : <span className="text-green-500">Possédé</span>
                              : <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{item.price.toLocaleString()} coins</span>
                            }
                          </div>
                        </div>
                        <div className="mt-3">
                          {item.is_owned ? (
                            <button onClick={(e) => { e.stopPropagation(); equip(item, 'pins'); }} disabled={equipping === item.id}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                              style={item.is_equipped
                                ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }
                                : { background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)', boxShadow: '0 2px 8px rgba(34,197,94,0.15)' }
                              }
                            >
                              {equipping === item.id ? <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" /> : item.is_equipped ? <><X className="w-3 h-3" />Retirer</> : <><Check className="w-3 h-3" />Équiper</>}
                            </button>
                          ) : item.reevs_price != null && item.reevs_price > 0 ? (
                            <button onClick={(e) => { e.stopPropagation(); purchaseWithReevs(item, 'pins'); }} disabled={purchasing === item.id || displayReevs < item.reevs_price}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                              style={displayReevs < item.reevs_price
                                ? { background: 'rgba(107,114,128,0.08)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)', cursor: 'not-allowed' }
                                : { background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }
                              }
                            >
                              {purchasing === item.id ? <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" /> : displayReevs < item.reevs_price ? <><Lock className="w-3 h-3" />{item.reevs_price} Reevs</> : <><Gem className="w-3 h-3" />{item.reevs_price} Reevs</>}
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); purchase(item, 'pins'); }} disabled={purchasing === item.id}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
                            >
                              {purchasing === item.id ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" /> : <><ShoppingCart className="w-3 h-3" />{item.price.toLocaleString()} coins</>}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ) : activeTab === 'banners' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {(currentItems as ShopItem[]).map((item, index) => {
                    const rarity = getRarityStyle(item.rarity)
                    const isSelected = previewSelections['banners'] === item.id
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        onClick={() => handleSelect(item.id)}
                        onMouseEnter={() => setHoveredBannerId(item.id)}
                        onMouseLeave={() => setHoveredBannerId(null)}
                        className="cursor-pointer group relative rounded-2xl overflow-hidden"
                        style={{
                          border: isSelected ? '2px solid #3b82f6' : `1px solid ${rarity.border}`,
                          boxShadow: isSelected ? '0 8px 30px rgba(59,130,246,0.3)' : `0 4px 20px ${rarity.glow}`,
                        }}
                      >
                        <div className="relative w-full h-[200px]">
                          {item.svg_code ? (
                            <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                          ) : item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-gray-500" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                          {/* Rarity badge */}
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white backdrop-blur-sm"
                            style={{ background: rarity.bg, boxShadow: `0 2px 8px ${rarity.glow}` }}>
                            {rarity.label}
                          </div>
                          {/* Equipped badge */}
                          {item.is_equipped && (
                            <div className="absolute top-3 left-3 rounded-full p-1.5 backdrop-blur-md" style={{ background: 'rgba(59,130,246,0.9)' }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          {/* Bottom: name + price/action */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                            <div className="font-bold text-white text-sm drop-shadow">{item.name}</div>
                            <div className="flex items-center gap-2">
                              {item.is_owned ? (
                                <button onClick={(e) => { e.stopPropagation(); if (!item.is_equipped) equip(item, 'banners') }} disabled={equipping === item.id || item.is_equipped}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold backdrop-blur-sm transition-all active:scale-95"
                                  style={item.is_equipped
                                    ? { background: 'rgba(59,130,246,0.5)', color: '#fff', cursor: 'default' }
                                    : { background: 'rgba(34,197,94,0.6)', color: '#fff' }}>
                                  {equipping === item.id ? <span className="animate-spin w-2.5 h-2.5 border border-white border-t-transparent rounded-full" /> : item.is_equipped ? 'Équipé' : 'Équiper'}
                                </button>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); item.reevs_price && item.reevs_price > 0 ? purchaseWithReevs(item, 'banners') : purchase(item, 'banners') }} disabled={purchasing === item.id}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold backdrop-blur-sm transition-all active:scale-95"
                                  style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                                  {purchasing === item.id
                                    ? <span className="animate-spin w-2.5 h-2.5 border border-white border-t-transparent rounded-full" />
                                    : item.reevs_price && item.reevs_price > 0
                                      ? <><Gem className="w-3 h-3 text-emerald-400" /><span>{item.reevs_price}</span></>
                                      : <><img src={COIN_IMG} className="w-3.5 h-3.5" alt="" /><span>{item.price.toLocaleString()}</span></>
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ) : activeTab === 'frames' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence mode="popLayout">
                  {(currentItems as ShopItem[]).map((item, index) => {
                    const rarity = getRarityStyle(item.rarity)
                    const isSelected = previewSelections['frames'] === item.id
                    const isNotable = item.rarity !== 'common'
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.04, y: -3 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        onClick={() => handleSelect(item.id)}
                        onMouseEnter={() => setHoveredFrameId(item.id)}
                        onMouseLeave={() => setHoveredFrameId(null)}
                        className="cursor-pointer group relative p-5 rounded-2xl"
                        style={{
                          background: isSelected ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))' : isDark ? 'rgba(15,23,42,0.7)' : 'rgba(248,250,252,0.9)',
                          border: isSelected ? '2px solid #3b82f6' : `1px solid ${rarity.border}`,
                          boxShadow: isNotable && !isSelected ? `0 0 20px ${rarity.glow}` : '0 4px 12px rgba(0,0,0,0.06)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: rarity.bg }}>
                          {rarity.label}
                        </div>
                        {item.is_equipped && (
                          <div className="absolute top-2 left-2 z-20 rounded-full p-1" style={{ background: 'rgba(59,130,246,0.9)' }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="w-full aspect-square flex items-center justify-center p-4 mb-3">
                          {item.svg_code ? (
                            <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                          ) : item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <Frame className="w-16 h-16 text-gray-400" />
                          )}
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-sm text-gray-900 dark:text-white truncate mb-1">{item.name}</div>
                          <div className="text-[10px] font-semibold">
                            {item.is_owned
                              ? item.is_equipped ? <span className="text-blue-400">Équipé</span> : <span className="text-green-500">Possédé</span>
                              : <span style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{item.price.toLocaleString()} coins</span>
                            }
                          </div>
                        </div>
                        <div className="mt-3">
                          {item.is_owned ? (
                            <button onClick={(e) => { e.stopPropagation(); equip(item, 'frames'); }} disabled={equipping === item.id}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                              style={item.is_equipped
                                ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }
                                : { background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)', boxShadow: '0 2px 8px rgba(34,197,94,0.15)' }
                              }
                            >
                              {equipping === item.id ? <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" /> : item.is_equipped ? <><X className="w-3 h-3" />Retirer</> : <><Check className="w-3 h-3" />Équiper</>}
                            </button>
                          ) : item.reevs_price != null && item.reevs_price > 0 ? (
                            <button onClick={(e) => { e.stopPropagation(); purchaseWithReevs(item, 'frames'); }} disabled={purchasing === item.id || displayReevs < item.reevs_price}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                              style={displayReevs < item.reevs_price
                                ? { background: 'rgba(107,114,128,0.08)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)', cursor: 'not-allowed' }
                                : { background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }
                              }
                            >
                              {purchasing === item.id ? <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" /> : displayReevs < item.reevs_price ? <><Lock className="w-3 h-3" />{item.reevs_price} Reevs</> : <><Gem className="w-3 h-3" />{item.reevs_price} Reevs</>}
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); purchase(item, 'frames'); }} disabled={purchasing === item.id}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
                            >
                              {purchasing === item.id ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" /> : <><ShoppingCart className="w-3 h-3" />{item.price.toLocaleString()} coins</>}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ) : activeTab === 'colors' ? (
              <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                <AnimatePresence mode="popLayout">
                  {(currentItems as ShopColorItem[]).map((color, index) => {
                    const rarity = getRarityStyle(color.rarity)
                    const isSelected = previewSelections['colors'] === color.id
                    return (
                      <motion.div
                        key={color.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        onClick={() => handleSelect(color.id)}
                        onMouseEnter={() => setHoveredColorId(color.id)}
                        onMouseLeave={() => setHoveredColorId(null)}
                        className="cursor-pointer group relative"
                      >
                        {isNewItem(color.created_at) && (
                          <div className="absolute -top-2 -right-2 z-20 text-white px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 3px 10px rgba(16,185,129,0.4)' }}
                          >
                            NEW
                          </div>
                        )}
                        <div className="aspect-square rounded-2xl flex items-center justify-center overflow-hidden relative"
                          style={{
                            background: color.color_value,
                            boxShadow: isSelected ? `0 0 0 3px #3b82f6, 0 4px 20px ${rarity.glow}` : `0 4px 15px ${rarity.glow}`,
                            border: isSelected ? '2px solid #3b82f6' : `1px solid ${rarity.border}`,
                          }}
                        >
                          {color.is_gradient && <span className="text-white font-black text-2xl drop-shadow-lg select-none">Abc</span>}
                          {color.is_equipped && (
                            <div className="absolute top-1.5 right-1.5 rounded-full p-0.5" style={{ background: 'rgba(59,130,246,0.9)' }}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {color.is_owned && !color.is_equipped && (
                            <div className="absolute top-1.5 right-1.5 rounded-full p-0.5" style={{ background: 'rgba(34,197,94,0.3)', border: '1px solid rgba(34,197,94,0.6)' }}>
                              <Check className="w-3 h-3 text-green-400" />
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <div className="font-semibold text-xs text-gray-900 dark:text-white truncate">{color.name}</div>
                          <div className="mt-0.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: rarity.bg }}>{rarity.label}</span>
                          </div>
                          {!color.is_owned && (
                            <div className="text-[10px] font-semibold mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                              {color.price.toLocaleString()} coins
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ) : (
              /* Backgrounds */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {(currentItems as ShopBackgroundItem[]).map((bg, index) => {
                    const rarity = getRarityStyle(bg.rarity)
                    const isSelected = previewSelections['backgrounds'] === bg.id
                    return (
                      <motion.div
                        key={bg.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        onClick={() => handleSelect(bg.id)}
                        onMouseEnter={() => setHoveredBackgroundId(bg.id)}
                        onMouseLeave={() => setHoveredBackgroundId(null)}
                        className="cursor-pointer group relative rounded-2xl overflow-hidden"
                        style={{
                          border: isSelected ? '2px solid #3b82f6' : `1px solid ${rarity.border}`,
                          boxShadow: isSelected ? '0 8px 30px rgba(59,130,246,0.3)' : `0 4px 20px ${rarity.glow}`,
                        }}
                      >
                        <div className="relative w-full h-[180px]">
                          {bg.svg_code ? (
                            <div className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full overflow-hidden" dangerouslySetInnerHTML={{ __html: bg.svg_code }} />
                          ) : bg.image_url ? (
                            <img src={bg.image_url} alt={bg.name} className="absolute inset-0 w-full h-full object-cover" />
                          ) : bg.css_value ? (
                            <div className="absolute inset-0" style={{ background: bg.css_value }} />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                              <Layers className="w-16 h-16 text-gray-500" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white backdrop-blur-sm"
                            style={{ background: rarity.bg, boxShadow: `0 2px 8px ${rarity.glow}` }}>
                            {rarity.label}
                          </div>
                          {bg.is_equipped && (
                            <div className="absolute top-3 left-3 rounded-full p-1.5 backdrop-blur-md" style={{ background: 'rgba(59,130,246,0.9)' }}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                            <div className="font-bold text-white text-sm drop-shadow">{bg.name}</div>
                            <div className="flex items-center gap-2">
                              {bg.is_owned ? (
                                <button onClick={(e) => { e.stopPropagation(); if (!bg.is_equipped) equipBackground(bg) }} disabled={equipping === bg.id || bg.is_equipped}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold backdrop-blur-sm transition-all active:scale-95"
                                  style={bg.is_equipped
                                    ? { background: 'rgba(59,130,246,0.5)', color: '#fff', cursor: 'default' }
                                    : { background: 'rgba(34,197,94,0.6)', color: '#fff' }}>
                                  {equipping === bg.id ? <span className="animate-spin w-2.5 h-2.5 border border-white border-t-transparent rounded-full" /> : bg.is_equipped ? 'Équipé' : 'Équiper'}
                                </button>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); bg.reevs_price && bg.reevs_price > 0 ? purchaseWithReevs(bg, 'backgrounds') : purchase(bg, 'backgrounds') }} disabled={purchasing === bg.id}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold backdrop-blur-sm transition-all active:scale-95"
                                  style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
                                  {purchasing === bg.id
                                    ? <span className="animate-spin w-2.5 h-2.5 border border-white border-t-transparent rounded-full" />
                                    : bg.reevs_price && bg.reevs_price > 0
                                      ? <><Gem className="w-3 h-3 text-emerald-400" /><span>{bg.reevs_price}</span></>
                                      : <><img src={COIN_IMG} className="w-3.5 h-3.5" alt="" /><span>{bg.price.toLocaleString()}</span></>
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
        </div>

      </div>

      {/* Pin Slot Picker Modal */}
      <AnimatePresence>
        {slotPickerPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSlotPickerPin(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-2xl w-full max-w-md"
              style={cardStyle}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choisir un slot</h3>
                <button onClick={() => setSlotPickerPin(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[1, 2, 3, 4].map(slot => {
                  const currentPin = equippedPins.find(p => p.slot_number === slot)
                  const pinContent = currentPin?.svg_code || ''
                  return (
                    <button
                      key={slot}
                      onClick={() => { if (slotPickerPin) equipPinInSlot(slotPickerPin, slot) }}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-500/10 transition-all flex items-center justify-center overflow-hidden"
                    >
                      {currentPin && pinContent ? (
                        isSvg(pinContent)
                          ? <div className="w-full h-full p-2 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: pinContent }} />
                          : <img src={pinContent} className="w-full h-full object-contain p-1.5" alt="" />
                      ) : (
                        <Plus className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2">
                  {(slotPickerPin.svg_code || slotPickerPin.image_url) && (
                    isSvg(slotPickerPin.svg_code || '')
                      ? <div className="[&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: slotPickerPin.svg_code || '' }} />
                      : <img src={slotPickerPin.image_url || slotPickerPin.svg_code || ''} className="w-full h-full object-contain" alt="" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{slotPickerPin.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cliquez sur un slot pour équiper</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
