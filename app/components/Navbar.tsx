'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Gift, Package, Sword, Users, User, LogOut, X,
  ShoppingCart, Sparkles, Plus, ChevronDown, ChevronRight,
  Monitor, Sun, Moon, Shield, TrendingUp, Gamepad2,
  Menu, Zap, Crown, Star, Flame, ArrowRight, ChevronUp, Mail, CreditCard, Globe, Gem,
  Bell, Swords, Check, Trophy
} from 'lucide-react'
import { useReevs } from '@/app/hooks/useReevs'
import { sanitizeSvg } from '@/utils/sanitizeSvg'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'
import { useLanguage, LANGUAGES, type Locale } from './LanguageProvider'
import { useAuthModal } from './AuthModalProvider'
import { getUsernameStyle } from '@/utils/usernameStyle'
import { useNotifications } from '@/app/hooks/useNotifications'

interface InventoryItem {
  id: string
  quantity: number
  obtained_at: string
  items: {
    id: string
    name: string
    image_url: string
    rarity: string
    market_value: number
  } | null
}

const UpgradeModal = dynamic(() => import('@/app/components/UpgradeModal'), {
  ssr: false,
  loading: () => null
})

const CartModal = dynamic(() => import('@/app/components/CartModal'), {
  ssr: false,
  loading: () => null
})

const PaymentModal = dynamic(() => import('@/app/components/PaymentModal'), {
  ssr: false,
  loading: () => null
})

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = "" }) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}


// ─── Sons inventaire open/close ──────────────────────────────────
const playInventoryOpen = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const note = (freq: number, delay: number, dur: number, gain: number) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, now + delay); g.gain.linearRampToValueAtTime(gain, now + delay + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur); o.connect(g); g.connect(master); g.connect(reverb); o.start(now + delay); o.stop(now + delay + dur + 0.05) }
  note(523, 0, 0.12, 0.18); note(1047, 0.10, 0.14, 0.20); note(2093, 0.18, 0.08, 0.08)
}
const playInventoryClose = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const note = (freq: number, delay: number, dur: number, gain: number) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, now + delay); g.gain.linearRampToValueAtTime(gain, now + delay + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur); o.connect(g); g.connect(master); g.connect(reverb); o.start(now + delay); o.stop(now + delay + dur + 0.05) }
  note(1047, 0, 0.10, 0.18); note(2093, 0, 0.06, 0.06); note(523, 0.08, 0.12, 0.16)
}
// ─── Sons profil open/close ───────────────────────────────────────
const playProfileOpen = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const note = (freq: number, delay: number, dur: number, gain: number) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, now + delay); g.gain.linearRampToValueAtTime(gain, now + delay + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur); o.connect(g); g.connect(master); g.connect(reverb); o.start(now + delay); o.stop(now + delay + dur + 0.05) }
  note(523, 0, 0.12, 0.18); note(1047, 0.10, 0.14, 0.20); note(2093, 0.18, 0.08, 0.08)
}
const playProfileClose = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const note = (freq: number, delay: number, dur: number, gain: number) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, now + delay); g.gain.linearRampToValueAtTime(gain, now + delay + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur); o.connect(g); g.connect(master); g.connect(reverb); o.start(now + delay); o.stop(now + delay + dur + 0.05) }
  note(1047, 0, 0.10, 0.18); note(2093, 0, 0.06, 0.06); note(523, 0.08, 0.12, 0.16)
}
// ─── Sons payment open/close ──────────────────────────────────────
const playPaymentOpen = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const note = (freq: number, delay: number, dur: number, gain: number) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, now + delay); g.gain.linearRampToValueAtTime(gain, now + delay + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur); o.connect(g); g.connect(master); g.connect(reverb); o.start(now + delay); o.stop(now + delay + dur + 0.05) }
  note(523, 0, 0.12, 0.18); note(1047, 0.10, 0.14, 0.20); note(2093, 0.18, 0.08, 0.08)
}
const playPaymentClose = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.0), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = reverbBuf.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.8) }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.75; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.28; reverb.connect(wet); wet.connect(master)
  const note = (freq: number, delay: number, dur: number, gain: number) => { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, now + delay); g.gain.linearRampToValueAtTime(gain, now + delay + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur); o.connect(g); g.connect(master); g.connect(reverb); o.start(now + delay); o.stop(now + delay + dur + 0.05) }
  note(1047, 0, 0.10, 0.18); note(2093, 0, 0.06, 0.06); note(523, 0.08, 0.12, 0.16)
}

// ─── Son notification reçue ──────────────────────────────────────
const playNotificationSound = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const master = audioCtx.createGain(); master.gain.value = 0.6; master.connect(audioCtx.destination)
  const note = (freq: number, delay: number, dur: number, gain: number) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0, now + delay); g.gain.linearRampToValueAtTime(gain, now + delay + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur)
    o.connect(g); g.connect(master); o.start(now + delay); o.stop(now + delay + dur + 0.05)
  }
  note(880, 0, 0.1, 0.3); note(1320, 0.08, 0.12, 0.35); note(1760, 0.18, 0.2, 0.2)
}

// ─── Son balance ajoutée ─────────────────────────────────────────
const playBalanceAdd = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const now = audioCtx.currentTime
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.4), audioCtx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = reverbBuf.getChannelData(ch)
    for (let i = 0; i < d.length; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5)
  }
  const reverb = audioCtx.createConvolver(); reverb.buffer = reverbBuf
  const master = audioCtx.createGain(); master.gain.value = 0.8; master.connect(audioCtx.destination)
  const wet = audioCtx.createGain(); wet.gain.value = 0.4
  reverb.connect(wet); wet.connect(master)
  const note = (freq: number, delay: number, dur: number, gain: number) => {
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0, now + delay)
    g.gain.linearRampToValueAtTime(gain, now + delay + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur)
    o.connect(g); g.connect(master); g.connect(reverb)
    o.start(now + delay); o.stop(now + delay + dur + 0.05)
  }
  note(1047, 0,    0.055, 0.22); note(1047, 0,    0.35, 0.07)
  note(1320, 0.05, 0.055, 0.24); note(1320, 0.05, 0.38, 0.08)
  note(1568, 0.10, 0.065, 0.28); note(1568, 0.10, 0.55, 0.11)
}

// ─── Balance animée — compteur fluide + badge +XX ────────────────
function AnimatedBalance({
  value,
  className,
  style,
}: {
  value: number
  prevValue: number
  className?: string
  style?: React.CSSProperties
}) {
  const [displayed, setDisplayed] = useState(value)
  const [delta, setDelta] = useState(0)
  const [badgeVisible, setBadgeVisible] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(value)
  const isFirstRef = useRef(true)

  useEffect(() => {
    // Premier chargement — afficher direct sans animation
    if (isFirstRef.current) {
      isFirstRef.current = false
      fromRef.current = value
      setDisplayed(value)
      return
    }

    const from = fromRef.current
    const to = value
    if (from === to) return

    const change = to - from
    setDelta(change)
    fromRef.current = to

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    if (change > 0) {
      setBadgeVisible(true)
      setTimeout(() => setBadgeVisible(false), 3500)
    }

    const duration = change > 0 ? 3000 : 400
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = change > 0
        ? 1 - Math.pow(1 - progress, 4)   // ease-out quart pour montée
        : progress                          // linéaire pour baisse
      setDisplayed(parseFloat((from + change * eased).toFixed(2)))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <span className={className} style={{ ...style, fontVariantNumeric: 'tabular-nums' }}>
        {value % 1 !== 0
          ? displayed.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : Math.round(displayed).toLocaleString('fr-FR')
        }
      </span>
      <AnimatePresence>
        {badgeVisible && delta > 0 && (
          <motion.span
            initial={{ opacity: 0, y: -4, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: 3,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.9))',
              borderRadius: 999,
              padding: '2px 6px',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: 'white',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(16,185,129,0.5)',
              pointerEvents: 'none',
              zIndex: 99,
              lineHeight: 1.4,
            }}
          >
            +{delta.toLocaleString('fr-FR')}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export default function ReveelBoxNavbar() {
  const { user, profile, signOut, isAuthenticated, loading, refreshProfile } = useAuth()
  const [userPins, setUserPins] = useState<Array<{id: string, content: string}>>([])
  const [avatarFrame, setAvatarFrame] = useState<string | null>(null)
  const [bannerSvg, setBannerSvg] = useState<string | null>(null)
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null)
  const [nameColorValue, setNameColorValue] = useState<string | null>(null)
  const [nameColorIsGradient, setNameColorIsGradient] = useState<boolean | null>(null)
  const { openLoginModal, openSignupModal } = useAuthModal()
  const [balanceAnimation, setBalanceAnimation] = useState<'up' | 'down' | null>(null)
  const supabase = createClient()

  // Balance directement depuis le profil (mis à jour via AuthProvider realtime + refreshProfile)
  const displayBalance = profile?.virtual_currency ?? 0
  const prevBalanceRef = useRef<number>(displayBalance)

  // Solde Reevs (monnaie bonus)
  const { balance: reevBalance } = useReevs(user?.id)
  const displayReevs = reevBalance ?? 0

  // Animation quand la balance change
  const profileLoadedRef = useRef(false)
  useEffect(() => {
    if (displayBalance === 0) return
    if (!profileLoadedRef.current) {
      profileLoadedRef.current = true
      prevBalanceRef.current = displayBalance
      return
    }
    const prev = prevBalanceRef.current
    if (prev !== displayBalance) {
      const change = displayBalance - prev
      setBalanceAnimation(change > 0 ? 'up' : 'down')
      if (change > 0) playBalanceAdd()
      const timer = setTimeout(() => setBalanceAnimation(null), 1000)
      prevBalanceRef.current = displayBalance
      return () => clearTimeout(timer)
    }
  }, [displayBalance])

  // Ref pour éviter les chargements multiples
  const hasLoadedRef = useRef(false)

  // Fonction optimisée qui charge tout en parallèle
  const loadAllUserData = useCallback(async () => {
    if (!user) return

    try {
      // Exécuter toutes les requêtes EN PARALLÈLE au lieu de séquentiellement
      const [pinsResult, frameResult, bannerResult, rankResult, colorResult] = await Promise.all([
        // 1. Pins équipés (ordered by slot)
        supabase
          .from('user_pins')
          .select('pin_id, slot_number, shop_pins (id, svg_code, image_url)')
          .eq('user_id', user.id)
          .eq('is_equipped', true)
          .order('slot_number', { ascending: true })
          .limit(4),

        // 2. Cadre équipé
        supabase
          .from('user_frames')
          .select('frame_id, shop_frames (svg_code, image_url)')
          .eq('user_id', user.id)
          .eq('is_equipped', true)
          .maybeSingle(),

        // 3. Bannière équipée
        supabase
          .from('user_banners')
          .select('banner_id, shop_banners (svg_code, image_url)')
          .eq('user_id', user.id)
          .eq('is_equipped', true)
          .maybeSingle(),

        // 4. Rang leaderboard
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_coins_spent', (profile as any)?.total_coins_spent || 0),

        // 5. Couleur de pseudo équipée
        supabase
          .from('user_name_colors')
          .select('color_id, shop_name_colors (color_value, is_gradient)')
          .eq('user_id', user.id)
          .eq('is_equipped', true)
          .maybeSingle()
      ])

      // Traiter les pins
      if (!pinsResult.error && pinsResult.data) {
        const pins = pinsResult.data
          .filter((item): item is typeof item & { shop_pins: { id: any; svg_code: any; image_url: any } } =>
            item.shop_pins !== null && !Array.isArray(item.shop_pins)
          )
          .map(item => ({
            id: item.shop_pins.id,
            content: item.shop_pins.image_url || item.shop_pins.svg_code || ''
          }))
        setUserPins(pins)
      }

      // Traiter le cadre
      if (!frameResult.error && frameResult.data) {
        const shopFrames = frameResult.data.shop_frames as any
        if (shopFrames?.image_url || shopFrames?.svg_code) {
          setAvatarFrame(shopFrames.image_url || shopFrames.svg_code)
        }
      }

      // Traiter la bannière
      if (!bannerResult.error && bannerResult.data) {
        const shopBanners = bannerResult.data.shop_banners as any
        if (shopBanners?.image_url || shopBanners?.svg_code) {
          setBannerSvg(shopBanners.image_url || shopBanners.svg_code)
        }
      }

      // Traiter le rang
      if (!rankResult.error && rankResult.count !== null) {
        setLeaderboardRank(rankResult.count + 1)
      }

      // Traiter la couleur de pseudo
      if (!colorResult.error && colorResult.data) {
        const shopColors = colorResult.data.shop_name_colors as any
        if (shopColors?.color_value) {
          setNameColorValue(shopColors.color_value)
          setNameColorIsGradient(shopColors.is_gradient || false)
        }
      } else {
        setNameColorValue(null)
        setNameColorIsGradient(null)
      }

    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error)
    }
  }, [user])

  // Charger toutes les données utilisateur en UNE SEULE fois (optimisé avec Promise.all)
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadAllUserData()
    }
    // Reset si l'utilisateur change
    if (!user) {
      hasLoadedRef.current = false
      setUserPins([])
      setAvatarFrame(null)
      setBannerSvg(null)
      setLeaderboardRank(null)
      setNameColorValue(null)
      setNameColorIsGradient(null)
    }
  }, [user?.id, loadAllUserData])

  // TEMPS RÉEL : Écouter les changements de cosmétiques équipés
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel(`user-cosmetics-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_pins',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('🎨 Pins changed - reloading')
        loadAllUserData()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_banners',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('🎨 Banners changed - reloading')
        loadAllUserData()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_frames',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('🎨 Frames changed - reloading')
        loadAllUserData()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_name_colors',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('🎨 Name colors changed - reloading')
        loadAllUserData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, loadAllUserData])

  const { theme, setTheme, resolvedTheme } = useTheme()
  const { locale, setLocale, t } = useLanguage()
  const { notifications, unreadCount, newToasts, dismissToast, markAllRead, markRead, clearAll, acceptInvitation, declineInvitation, acceptFriendRequest, declineFriendRequest } = useNotifications()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [notifPanelOpen, setNotifPanelOpen] = useState(false)
  const notifSectionRef = useRef<HTMLDivElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const [cartItems, setCartItems] = useState<InventoryItem[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [navbarHidden, setNavbarHidden] = useState(false)
  const [selectedCartItems, setSelectedCartItems] = useState<string[]>([])

  const cartButtonRef = useRef(null)
  const paymentButtonRef = useRef(null)

  useEffect(() => {
    const savedState = localStorage.getItem('navbarHidden')
    if (savedState !== null) {
      setNavbarHidden(savedState === 'true')
    }
  }, [])

  const toggleNavbar = () => {
    const newState = !navbarHidden
    setNavbarHidden(newState)
    localStorage.setItem('navbarHidden', String(newState))
    window.dispatchEvent(new Event('navbarToggle'))
    // Ajuster le scroll pour compenser la hauteur de la navbar (64px)
    const navHeight = 64
    if (newState) {
      // Navbar cachée → remonter la page pour combler le vide
      window.scrollBy({ top: navHeight, behavior: 'smooth' })
    } else {
      // Navbar affichée → redescendre la page pour revenir à l'état d'avant
      window.scrollBy({ top: -navHeight, behavior: 'smooth' })
    }
  }

  const router = useRouter()
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const gamesMenuRef = useRef<HTMLDivElement>(null)

  const isAdmin = (profile as any)?.is_admin === true

  // Mémoiser les items de menu (constants - ne changent jamais)
  const navItems = useMemo(() => [
    { href: '/boxes', label: 'Unboxing', icon: Package },
    { href: '/battles', label: 'Battles', icon: Sword },
    { href: '/games', label: 'Games', icon: Gamepad2, hasDropdown: true },
    { href: '/affiliates', label: 'Affiliés', icon: Users },
    { href: '/freedrop', label: 'Free Drop', icon: Gift },
    { href: '/shop', label: 'Shop', icon: ShoppingCart, gradient: 'from-purple-500 to-pink-500' },
    { href: '/leaderboard', label: 'Leaderboard', icon: Crown, gradient: 'from-yellow-500 to-orange-500' },
  ], [])

  const gamesDropdownItems = useMemo(() => [
    { href: '/games/crash', label: 'Crash', icon: TrendingUp, gradient: 'from-red-500 to-orange-500' },
    { href: '/games/mines', label: 'Mines', icon: Flame, gradient: 'from-purple-500 to-pink-500' },
    { href: '/games/roulette', label: 'Roulette', icon: Crown, gradient: 'from-yellow-500 to-amber-500', comingSoon: true },
    { href: '/games/coinflip', label: 'Coinflip', icon: Zap, gradient: 'from-[#4578be] to-cyan-500' },
    { href: '/upgrade', label: 'Upgrade', icon: Sparkles, gradient: 'from-[#4578be] to-[#5989d8]' },
  ], [])

  // Détecter prefers-reduced-motion pour désactiver les animations
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Son quand nouvelle notification arrive
  const prevToastCountRef = useRef(0)
  useEffect(() => {
    if (newToasts.length > prevToastCountRef.current) {
      try { playNotificationSound() } catch {}
    }
    prevToastCountRef.current = newToasts.length
  }, [newToasts.length])

  // Scroll handler avec throttle pour optimiser les performances
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fonction pour charger les items du panier (extraite pour réutilisation)
  const loadCartItems = useCallback(async () => {
    if (!user) return

    try {
      const { data: inventory, error } = await supabase
        .from('user_inventory')
        .select(`
          id,
          quantity,
          obtained_at,
          items (
            id,
            name,
            image_url,
            rarity,
            market_value
          )
        `)
        .eq('user_id', user.id)
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false })
        .limit(30)

      if (!error && inventory) {
        setCartItems(inventory.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          obtained_at: item.obtained_at,
          items: item.items || null
        })))
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }, [user, supabase])


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
        setLangMenuOpen(false)
      }
      if (gamesMenuRef.current && !gamesMenuRef.current.contains(e.target as Node)) {
        setGamesMenuOpen(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Ref pour bloquer la mise à jour du panier pendant une animation de roulette (anti-spoil)
  const suppressCartRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCartItems([])
      return
    }

    loadCartItems()

    const channel = supabase
      .channel(`inventory-changes-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Ignorer si une animation de roulette est en cours
        if (!suppressCartRef.current) loadCartItems()
      })
      .subscribe()

    // Bloquer les mises à jour pendant le spin (déclenché par la page boxes)
    const handleSpinStart = () => { suppressCartRef.current = true }
    // Débloquer et recharger une fois l'animation terminée
    const handleInventoryUpdated = () => {
      suppressCartRef.current = false
      loadCartItems()
    }

    window.addEventListener('box-spin-start', handleSpinStart)
    window.addEventListener('inventory-updated', handleInventoryUpdated)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('box-spin-start', handleSpinStart)
      window.removeEventListener('inventory-updated', handleInventoryUpdated)
    }
  }, [isAuthenticated, user?.id, loadCartItems])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const playC5 = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.2), audioCtx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = reverbBuf.getChannelData(ch);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2);
    }
    const reverb = audioCtx.createConvolver();
    reverb.buffer = reverbBuf;
    const master = audioCtx.createGain();
    master.gain.value = 0.8;
    master.connect(audioCtx.destination);
    const wet = audioCtx.createGain();
    wet.gain.value = 0.5;
    reverb.connect(wet);
    wet.connect(master);
    const mkOsc = (dest: AudioNode, freq: number, start: number, dur: number, gain: number) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g); g.connect(dest as any);
      o.start(start); o.stop(start + dur + 0.05);
    };
    mkOsc(master, 880,  now,        0.07, 0.18);
    mkOsc(master, 1320, now + 0.04, 0.07, 0.15);
    mkOsc(reverb, 880,  now,        0.5,  0.08);
    mkOsc(reverb, 1320, now + 0.04, 0.4,  0.06);
  }

  if (loading) return null

  return (
    <>
      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: navbarHidden ? -64 : 0
        }}
        transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 25 }}
        className="fixed top-0 left-0 right-0 z-[60] h-16"
      >
        <div className="w-full h-full flex justify-center items-center px-[10%]">
          <div className="flex items-center justify-between h-full w-full px-4 rounded-3xl shadow-xl gap-3 relative" style={{
            background: isScrolled
              ? `linear-gradient(180deg, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.3) 0%, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.25) 100%)`
              : `linear-gradient(180deg, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.4) 0%, rgba(${resolvedTheme === 'dark' ? '17, 24, 39' : '255, 255, 255'}, 0.35) 100%)`,
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 24px rgba(69, 120, 190, 0.1)'
          }}>
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl overflow-hidden">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, rgba(69, 120, 190, 0.6) 20%, rgba(69, 120, 190, 0.9) 50%, rgba(69, 120, 190, 0.6) 80%, transparent 100%)`,
                  filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.6))'
                }}
                animate={prefersReducedMotion ? {} : {
                  x: ['-200%', '200%'],
                }}
                transition={prefersReducedMotion ? {} : {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 2
                }}
              />
            </div>

            <div className="flex items-center gap-3 lg:gap-4 relative z-10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800/80 dark:hover:to-gray-800/60 transition-all duration-300 hover:shadow-lg"
                style={{
                  border: '1px solid rgba(229, 231, 235, 0.4)'
                }}
              >
                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </motion.button>

              <Link href="/" onClick={playC5} className="group flex items-center ml-[20%]">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4578be]/20 via-blue-500/10 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/Design%20sans%20titre%20(49).png"
                    alt="ReveelBox"
                    className="relative h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  />
                </motion.div>
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-4 relative z-10">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href === '/games' && pathname.startsWith('/games'))

                if (item.hasDropdown) {
                  return (
                    <div key={item.href} className="relative flex items-center gap-4">
                      <div className="flex items-center" ref={gamesMenuRef}>
                        <Link
                          href={item.href}
                          onClick={playC5}
                          className={`relative px-3 py-1.5 text-base font-semibold rounded-xl flex items-center gap-2 transition-all duration-300 group ${
                            isActive
                              ? 'text-[#4578be] bg-gradient-to-br from-[#4578be]/10 to-blue-500/5 shadow-lg shadow-[#4578be]/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 hover:shadow-md'
                          }`}
                          style={isActive ? {
                            border: '1px solid rgba(69, 120, 190, 0.2)',
                            boxShadow: '0 0 16px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          } : {}}
                        >
                          <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]' : 'group-hover:scale-110'}`} />
                          <span className="relative whitespace-nowrap">{item.label}
                          </span>
                        </Link>
                        <button
                          onClick={() => setGamesMenuOpen(!gamesMenuOpen)}
                          className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/30 rounded-lg"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-all duration-300 ${gamesMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <AnimatePresence>
                        {gamesMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                            className="absolute top-full mt-2 left-0 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/80 rounded-2xl overflow-hidden"
                            style={{
                              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 32px rgba(69, 120, 190, 0.1)'
                            }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" 
                              style={{
                                filter: 'drop-shadow(0 0 4px rgba(69, 120, 190, 0.6))'
                              }}
                            />
                            
                            <div className="p-2">
                              {gamesDropdownItems.map((game, index) => {
                                const GameIcon = game.icon
                                return (
                                  <motion.button
                                    key={game.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => !game.comingSoon && (router.push(game.href), setGamesMenuOpen(false))}
                                    disabled={game.comingSoon}
                                    whileHover={!game.comingSoon ? { x: 4, scale: 1.02 } : {}}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                                      game.comingSoon
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/70 dark:hover:to-gray-800/50 hover:shadow-lg'
                                    }`}
                                  >
                                    <div className={`w-9 h-9 bg-gradient-to-br ${game.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                                      style={{
                                        boxShadow: !game.comingSoon ? '0 4px 12px rgba(0, 0, 0, 0.2), 0 0 16px rgba(69, 120, 190, 0.1)' : undefined
                                      }}
                                    >
                                      <GameIcon className="h-4.5 w-4.5 text-white drop-shadow-md" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{game.label}</span>
                                        {game.comingSoon && (
                                          <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20 text-orange-600 dark:text-orange-400 text-[10px] rounded-md font-bold shadow-sm">BIENTÔT</span>
                                        )}
                                      </div>
                                    </div>
                                    {!game.comingSoon && (
                                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#4578be] transition-colors duration-300" />
                                    )}
                                  </motion.button>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {index < navItems.length - 1 && (
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 ml-4"></div>
                      )}
                    </div>
                  )
                }

                return (
                  <React.Fragment key={item.href}>
                    <Link
                      href={item.href}
                      onClick={playC5}
                      className={`relative px-3 py-1.5 text-base font-semibold rounded-xl flex items-center gap-2 transition-all duration-300 group ${
                      isActive
                        ? 'text-[#4578be] bg-gradient-to-br from-[#4578be]/10 to-blue-500/5 shadow-lg shadow-[#4578be]/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 hover:shadow-md'
                    }`}
                    style={isActive ? {
                      border: '1px solid rgba(69, 120, 190, 0.2)',
                      boxShadow: '0 0 16px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    } : {}}
                  >
                    <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_4px_rgba(59,130,246,0.6)]' : 'group-hover:scale-110'}`} />
                    <span className="relative whitespace-nowrap">{item.label}
                    </span>
                  </Link>
                  {index < navItems.length - 1 && (
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
                  )}
                </React.Fragment>
                )
              })}
            </div>

            <div className="flex items-center gap-2 relative z-10">
              {isAuthenticated ? (
                <>
                  {/* Reevs balance chip */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/10 backdrop-blur-xl rounded-full border border-emerald-500/25 shadow-sm relative z-[70]"
                    title="Solde Reevs (monnaie bonus)"
                  >
                    <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/diamant.png" style={{width:'1rem',height:'1rem',objectFit:'contain'}} />
                    <span className="font-bold text-xs text-emerald-400 tabular-nums">
                      {displayReevs.toLocaleString()}
                    </span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-gradient-to-br from-gray-50/90 to-gray-100/70 dark:from-gray-800/70 dark:to-gray-800/50 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-lg relative z-[70]"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <motion.img
                      animate={prefersReducedMotion ? {} : { rotate: [0, 12, -12, 0] }}
                      transition={prefersReducedMotion ? {} : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                      alt="Coins"
                      className="h-6 w-6 ml-1"
                      loading="lazy"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.4))'
                      }}
                    />
                    <AnimatedBalance
                      value={displayBalance}
                      prevValue={0}
                      className="font-bold text-sm"
                      style={{ color: !balanceAnimation ? (resolvedTheme === 'dark' ? 'white' : '#111827') : balanceAnimation === 'up' ? '#10b981' : '#ef4444' }}
                    />
                    <motion.button
                      ref={paymentButtonRef}
                      whileHover={{ scale: 1.15, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setCartOpen(false)
                        setPaymentModalOpen(true)
                        playPaymentOpen()
                      }}
                      className="p-1 mr-1 rounded-full bg-gradient-to-br from-[#4578be] to-[#5989d8] shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{
                        boxShadow: '0 4px 12px rgba(69, 120, 190, 0.4), 0 0 16px rgba(69, 120, 190, 0.2)'
                      }}
                    >
                      <Plus className="h-3 w-3 text-white drop-shadow-md" />
                    </motion.button>
                  </motion.div>

                  <motion.button
                    ref={cartButtonRef}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setPaymentModalOpen(false)
                      setCartOpen(true)
                      playInventoryOpen()
                    }}
                    className="relative p-2 bg-gradient-to-br from-gray-50/90 to-gray-100/70 dark:from-gray-800/70 dark:to-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-[#4578be]/40 transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    {cartItems.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-[#4578be] to-[#5989d8] rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          boxShadow: '0 2px 8px rgba(69, 120, 190, 0.5), 0 0 12px rgba(69, 120, 190, 0.3)'
                        }}
                      >
                        <span className="text-xs font-bold text-white drop-shadow-md">{cartItems.length}</span>
                      </motion.div>
                    )}
                  </motion.button>

                  <div className="relative" ref={userMenuRef}>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { userMenuOpen ? playProfileClose() : playProfileOpen(); if (!userMenuOpen) markAllRead(); setUserMenuOpen(!userMenuOpen) }}
                      className="relative h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{
                        border: '3px solid #4578be',
                        boxShadow: '0 0 16px rgba(69, 120, 190, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      {unreadCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg px-1 z-10"
                          style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.6)' }}
                        >
                          <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        </motion.div>
                      )}
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center">
                          <User className="h-6 w-6 text-white drop-shadow-md" />
                        </div>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 w-[350px] rounded-2xl overflow-hidden shadow-2xl border border-gray-700"
                          style={{
                            maxHeight: '580px',
                            background: '#1a1f2e'
                          }}
                        >
                          {/* ZONE HAUTE - Bannière + Avatar + Stats */}
                          <div
                            className="relative overflow-hidden"
                            style={{ height: '270px', background: 'linear-gradient(135deg, #2a3f5f 0%, #1a2332 50%, #0f1419 100%)' }}
                          >
                            {/* Bannière (SVG ou image) en arrière-plan avec opacity */}
                            {bannerSvg && (
                              bannerSvg.startsWith('<') ? (
                                <div
                                  className="absolute inset-0"
                                  style={{ opacity: 0.6 }}
                                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(bannerSvg) }}
                                />
                              ) : (
                                <img
                                  src={bannerSvg}
                                  alt="Banner"
                                  className="absolute inset-0 w-full h-full object-cover"
                                  style={{ opacity: 0.6 }}
                                />
                              )
                            )}
                            
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                            
                            {/* Contenu */}
                            <div className="relative h-full p-6 flex flex-col">
                              
                              {/* Ligne 1 : Avatar + Badges + Stats */}
                              <div className="flex gap-4 mb-4">
                                {/* Avatar avec cadre */}
                                <div className="relative h-20 w-20 flex-shrink-0">
                                  {/* Avatar */}
                                  <div 
                                    className={`h-20 w-20 rounded-xl overflow-hidden shadow-2xl ${
                                      avatarFrame ? '' : 'border-4 border-[#4578be]'
                                    }`}
                                    style={{ boxShadow: '0 0 30px rgba(69, 120, 190, 0.6)' }}
                                  >
                                    {profile?.avatar_url ? (
                                      <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center">
                                        <User className="h-10 w-10 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Cadre (SVG ou image) équipé par-dessus */}
                                  {avatarFrame && (
                                    avatarFrame.startsWith('<') ? (
                                      <div
                                        className="absolute pointer-events-none"
                                        style={{
                                          top: '-4px',
                                          left: '-4px',
                                          width: '88px',
                                          height: '88px'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: sanitizeSvg(avatarFrame) }}
                                      />
                                    ) : (
                                      <img
                                        src={avatarFrame}
                                        alt="Frame"
                                        className="absolute pointer-events-none"
                                        style={{
                                          top: '-4px',
                                          left: '-4px',
                                          width: '88px',
                                          height: '88px',
                                          objectFit: 'contain'
                                        }}
                                      />
                                    )
                                  )}
                                </div>

                                {/* Colonne droite : Badges + Flamme/Smiley */}
                                <div className="flex-1 flex flex-col justify-between">
                                  {/* Badges (ligne du haut) */}
                                  <div className="flex items-center gap-2">
                                    {/* Afficher les pins équipés (MAX 4) */}
                                    {userPins.slice(0, 4).map((pin) => (
                                      <div
                                        key={pin.id}
                                        className="h-11 w-11 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center p-1"
                                      >
                                        {pin.content.startsWith('<') ? (
                                          <div className="[&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sanitizeSvg(pin.content) }} />
                                        ) : (
                                          <img src={pin.content} alt="Pin" className="w-full h-full object-contain" />
                                        )}
                                      </div>
                                    ))}

                                    {/* Remplir avec des slots vides */}
                                    {Array.from({ length: Math.max(0, 4 - userPins.length) }).map((_, i) => (
                                      <div
                                        key={`empty-${i}`}
                                        className="h-11 w-11 rounded-lg bg-black/20 backdrop-blur-sm border border-dashed border-gray-600/30 flex items-center justify-center"
                                        style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15)' }}
                                      >
                                        <Plus className="w-4 h-4 text-white/15" />
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Flamme + Smiley + Trophée */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg min-w-[60px] justify-center">
                                      <Flame className="h-4 w-4 text-orange-400" />
                                      <span className="font-bold text-white text-sm">{profile?.consecutive_days || 0}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg min-w-[60px] justify-center">
                                      <span className="text-sm">😊</span>
                                      <span className="font-bold text-white text-sm">{(profile as any)?.recommendations_count || 0}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg min-w-[60px] justify-center">
                                      <span className="text-sm">🏆</span>
                                      <span className="font-bold text-white text-sm">{leaderboardRank || '-'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Ligne 2 : Pseudo */}
                              <h3
                                className="text-2xl font-black text-white mb-2 drop-shadow-lg"
                                style={getUsernameStyle(nameColorValue, nameColorIsGradient)}
                              >
                                {profile?.username || 'Utilisateur'}
                              </h3>

                              {/* Ligne 3 : Barre XP avec niveau (juste sous le pseudo) */}
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm text-gray-300 font-semibold whitespace-nowrap">
                                  Niveau {profile?.level || 1}
                                </span>
                                <div className="flex-1">
                                  <div className="h-2.5 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#4578be] to-[#5989d8]"
                                      style={{ width: `${profile?.progress_percentage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Ligne 4 : Total coins dépensés */}
                              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit">
                                <img
                                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                                  alt="Coins"
                                  className="w-4 h-4"
                                />
                                <span className="text-xs text-gray-300">
                                  <span className="font-black text-[#4578be]">{((profile as any)?.total_coins_spent || 0).toLocaleString()}</span> coins joués
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ZONE NOTIFICATIONS */}
                          <div ref={notifSectionRef} style={{ background: '#111827', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', maxHeight: '240px', overflowY: 'auto' }}>
                            <div className="px-4 py-2 flex items-center justify-between sticky top-0" style={{ background: '#111827', zIndex: 1 }}>
                              <div className="flex items-center gap-2">
                                <Bell className="w-3.5 h-3.5 text-[#4578be]" />
                                <span className="text-[11px] font-semibold text-gray-300">Notifications</span>
                                {unreadCount > 0 && (
                                  <span className="px-1.5 py-0.5 bg-red-500 rounded-full text-[9px] font-bold text-white">{unreadCount}</span>
                                )}
                              </div>
                              {notifications.length > 0 && (
                                <div className="flex items-center gap-2">
                                  {unreadCount > 0 && (
                                    <button
                                      onClick={() => markAllRead()}
                                      className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                      Tout lu
                                    </button>
                                  )}
                                  <button
                                    onClick={() => clearAll()}
                                    className="text-[10px] text-gray-600 hover:text-red-400 transition-colors"
                                  >
                                    Effacer
                                  </button>
                                </div>
                              )}
                            </div>
                            {notifications.length === 0 ? (
                              <div className="px-4 pb-3 flex items-center gap-2 text-gray-500">
                                <Bell className="w-3.5 h-3.5 opacity-40" />
                                <span className="text-[11px]">Aucune notification</span>
                              </div>
                            ) : (
                              notifications.map(notif => (
                                <div
                                  key={notif.id}
                                  className="px-4 py-2.5 border-t border-white/[0.04] cursor-pointer hover:bg-white/[0.02] transition-colors"
                                  onClick={() => !notif.read && markRead(notif.id)}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                      {(notif.type === 'battle_invitation' || notif.type === 'friend_request' || notif.type === 'friend_accepted') && notif.from_avatar ? (
                                        <img src={notif.from_avatar} alt="" className="w-full h-full object-cover" />
                                      ) : notif.type === 'battle_finished' ? (
                                        <Trophy className="w-3.5 h-3.5 text-white" />
                                      ) : notif.type === 'friend_request' || notif.type === 'friend_accepted' ? (
                                        <Users className="w-3.5 h-3.5 text-white" />
                                      ) : (
                                        <Swords className="w-3.5 h-3.5 text-white" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {notif.type === 'battle_invitation' && (
                                        <>
                                          <p className="text-[11px] text-gray-200 leading-snug">
                                            <span className="font-semibold text-white">{notif.from_username ?? 'Joueur'}</span>
                                            {' '}vous invite à une battle
                                          </p>
                                          <div className="flex items-center gap-1.5 mt-1.5">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setUserMenuOpen(false); acceptInvitation(notif.id, notif.battle_id) }}
                                              className="px-2.5 py-0.5 bg-[#4578be]/20 hover:bg-[#4578be]/40 border border-[#4578be]/40 rounded-md text-[10px] font-semibold text-[#7aadff] transition-colors"
                                            >
                                              Rejoindre
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); declineInvitation(notif.id) }}
                                              className="px-2.5 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] font-medium text-gray-400 transition-colors"
                                            >
                                              Refuser
                                            </button>
                                          </div>
                                        </>
                                      )}
                                      {notif.type === 'battle_finished' && (
                                        <>
                                          <p className="text-[11px] text-gray-200 leading-snug">
                                            La battle <span className="font-semibold text-white">{notif.battle_name}</span> est terminée
                                          </p>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setUserMenuOpen(false); router.push(`/battles/${notif.battle_id}`); markRead(notif.id) }}
                                            className="mt-1.5 px-2.5 py-0.5 bg-[#4578be]/20 hover:bg-[#4578be]/40 border border-[#4578be]/40 rounded-md text-[10px] font-semibold text-[#7aadff] transition-colors"
                                          >
                                            Voir les résultats
                                          </button>
                                        </>
                                      )}
                                      {notif.type === 'friend_request' && (
                                        <p className="text-[11px] text-gray-200 leading-snug">
                                          <span className="font-semibold text-white">{notif.from_username ?? 'Joueur'}</span>
                                          {' '}vous a envoyé une demande d&apos;ami
                                        </p>
                                      )}
                                      {notif.type === 'friend_accepted' && (
                                        <p className="text-[11px] text-gray-200 leading-snug">
                                          <span className="font-semibold text-white">{notif.from_username ?? 'Joueur'}</span>
                                          {' '}a accepté votre demande d&apos;ami
                                        </p>
                                      )}
                                      <p className="text-[10px] text-gray-600 mt-0.5">
                                        {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-[#4578be] flex-shrink-0 mt-1" />}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* ZONE BASSE - Menu compact */}
                          <div
                            className="px-3 py-2"
                            style={{
                              background: '#0f1419',
                              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                              height: '84px'
                            }}
                          >
                            <div className="flex items-center justify-around h-full">

                              <button
                                onClick={() => { router.push('/profile'); setUserMenuOpen(false) }}
                                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-medium">{t('nav.profile')}</span>
                              </button>

                              <button
                                onClick={() => { router.push('/inventory'); setUserMenuOpen(false) }}
                                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                <Package className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-medium">{t('nav.inventory')}</span>
                              </button>

                              <button
                                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                                className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                {resolvedTheme === 'dark' ? (
                                  <Moon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                ) : (
                                  <Sun className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="text-[10px] font-medium">{t('nav.theme')}</span>
                              </button>

                              {/* Notification bell - opens side panel */}
                              <button
                                onClick={() => { setNotifPanelOpen(true); setUserMenuOpen(false) }}
                                className="relative flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors group"
                              >
                                <div className="relative">
                                  <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                  {unreadCount > 0 && (
                                    <div className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center px-0.5">
                                      <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-medium">Notifs</span>
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => { router.push('/admin'); setUserMenuOpen(false) }}
                                  className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors group"
                                >
                                  <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-medium">{t('nav.admin')}</span>
                                </button>
                              )}

                              {/* Logout button */}
                              <button
                                onClick={() => { signOut(); setUserMenuOpen(false) }}
                                className="flex flex-col items-center gap-1 text-red-400 hover:text-red-300 transition-colors group"
                              >
                                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-medium">{t('nav.logout')}</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={() => openLoginModal()}
                      className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 transition-all duration-300 hover:shadow-md"
                    >
                      Connexion
                    </button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => openSignupModal()}
                      className="relative px-4 py-1.5 text-white rounded-xl text-sm font-bold shadow-lg bg-gradient-to-br from-[#4578be] to-[#5989d8] hover:shadow-xl transition-all duration-300 overflow-hidden group"
                      style={{
                        boxShadow: '0 4px 16px rgba(69, 120, 190, 0.4), 0 0 24px rgba(69, 120, 190, 0.15)'
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                      />
                      <span className="relative drop-shadow-md">S'inscrire</span>
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

      </motion.nav>

      <motion.button
        onClick={toggleNavbar}
        animate={{ 
          top: navbarHidden ? 0 : 64,
          opacity: navbarHidden ? 0.75 : 0.75
        }}
        whileHover={{ opacity: 0.95 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 25 }}
        className="fixed left-1/2 -translate-x-1/2 p-1.5 backdrop-blur-md border border-t-0 rounded-b-2xl shadow-md z-[70] bg-white/30 dark:bg-gray-900/30 border-gray-300/30 dark:border-gray-700/30"
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <motion.div
          animate={{ rotate: navbarHidden ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 260, damping: 25 }}
        >
          <ChevronUp className="h-3 w-3 text-[#4578be] opacity-70" />
        </motion.div>
      </motion.button>

      {/* ─── Panneau notifications latéral ─────────────────────────────── */}
      <AnimatePresence>
        {notifPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[85]"
              onClick={() => setNotifPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 32, stiffness: 280 }}
              className="fixed right-4 w-[360px] max-w-[calc(100vw-2rem)] z-[90] rounded-2xl overflow-hidden"
              style={{
                top: '72px',
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(69,120,190,0.1)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-[#4578be]" />
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500 rounded-full text-[9px] font-bold text-white">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={() => markAllRead()} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                      Tout lu
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={() => clearAll()} className="text-[10px] text-gray-600 hover:text-red-400 transition-colors">
                      Effacer
                    </button>
                  )}
                  <button onClick={() => setNotifPanelOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Liste avec hauteur limitée à ~1.5 notifs + fondu */}
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-600">
                  <Bell className="w-8 h-8 opacity-20" />
                  <p className="text-xs">Aucune notification</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="overflow-y-auto divide-y divide-white/[0.04]" style={{ maxHeight: '196px' }}>
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3.5 transition-colors cursor-pointer ${!notif.read ? 'bg-white/[0.025]' : ''} hover:bg-white/[0.04]`}
                        onClick={() => !notif.read && markRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar / icône */}
                          <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #4578be, #5989d8)' }}>
                            {(notif.type === 'battle_invitation' || notif.type === 'friend_request' || notif.type === 'friend_accepted') && notif.from_avatar ? (
                              <img src={notif.from_avatar} alt="" className="w-full h-full object-cover" />
                            ) : notif.type === 'battle_finished' ? (
                              <Trophy className="w-3.5 h-3.5 text-white" />
                            ) : notif.type === 'friend_request' || notif.type === 'friend_accepted' ? (
                              <Users className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Swords className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            {notif.type === 'battle_invitation' && (
                              <>
                                <p className="text-xs text-gray-200 leading-snug">
                                  <span className="font-semibold text-white">{notif.from_username ?? 'Joueur'}</span>
                                  {' '}vous invite à une battle
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setNotifPanelOpen(false); acceptInvitation(notif.id, notif.battle_id) }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
                                    style={{ background: 'linear-gradient(135deg, #4578be, #5989d8)' }}
                                  >
                                    Rejoindre
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); declineInvitation(notif.id) }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                                  >
                                    Refuser
                                  </button>
                                </div>
                              </>
                            )}
                            {notif.type === 'battle_finished' && (
                              <>
                                <p className="text-xs text-gray-200 leading-snug">
                                  La battle <span className="font-semibold text-white">{notif.battle_name}</span> est terminée
                                </p>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setNotifPanelOpen(false); router.push(`/battles/${notif.battle_id}`); markRead(notif.id) }}
                                  className="mt-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#7aadff] border border-[#4578be]/40 hover:border-[#4578be]/70 transition-colors"
                                >
                                  Voir les résultats
                                </button>
                              </>
                            )}
                            {notif.type === 'friend_request' && (
                              <>
                                <p className="text-xs text-gray-200 leading-snug">
                                  <span className="font-semibold text-white">{notif.from_username ?? 'Joueur'}</span>
                                  {' '}vous a envoyé une demande d&apos;ami
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); acceptFriendRequest(notif.id, notif.friendship_id) }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white transition-all hover:brightness-110"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                  >
                                    Accepter
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); declineFriendRequest(notif.id, notif.friendship_id) }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                                  >
                                    Refuser
                                  </button>
                                </div>
                              </>
                            )}
                            {notif.type === 'friend_accepted' && (
                              <p className="text-xs text-gray-200 leading-snug">
                                <span className="font-semibold text-white">{notif.from_username ?? 'Joueur'}</span>
                                {' '}a accepté votre demande d&apos;ami
                              </p>
                            )}
                            <p className="text-[10px] text-gray-600 mt-1">
                              {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {/* Point non-lu */}
                          {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-[#4578be] flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Fondu bas pour indiquer le scroll */}
                  {notifications.length > 1 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-14 pointer-events-none"
                      style={{ background: 'linear-gradient(to bottom, transparent, #111827)' }}
                    />
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-r border-gray-200/60 dark:border-gray-800/80 z-50 lg:hidden overflow-y-auto"
              style={{
                boxShadow: '0 0 80px rgba(0, 0, 0, 0.3), 0 0 40px rgba(69, 120, 190, 0.1)'
              }}
            >
              <div className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between mb-8"
                >
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/Design%20sans%20titre%20(49).png"
                    alt="ReveelBox"
                    className="h-9 w-auto object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.3))'
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800/80 dark:hover:to-gray-800/60 rounded-xl transition-all duration-300 hover:shadow-lg"
                  >
                    <X className="h-5 w-5 text-gray-900 dark:text-white" />
                  </motion.button>
                </motion.div>

                {isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#4578be]/10 via-blue-500/5 to-transparent border border-[#4578be]/30 shadow-lg backdrop-blur-sm"
                    style={{
                      boxShadow: '0 8px 24px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.img
                          animate={prefersReducedMotion ? {} : { rotate: [0, 12, -12, 0] }}
                          transition={prefersReducedMotion ? {} : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="Coins"
                          className="h-9 w-9"
                          loading="lazy"
                          style={{
                            filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.5))'
                          }}
                        />
                        <AnimatedBalance
                          value={displayBalance}
                          prevValue={0}
                          className="font-bold text-base drop-shadow-sm"
                          style={{ color: !balanceAnimation ? (resolvedTheme === 'dark' ? 'white' : '#111827') : balanceAnimation === 'up' ? '#10b981' : '#ef4444' }}
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setPaymentModalOpen(true); setMobileMenuOpen(false) }}
                        className="px-4 py-1.5 text-white rounded-lg text-sm font-bold bg-gradient-to-br from-[#4578be] to-[#5989d8] shadow-lg hover:shadow-xl transition-all duration-300"
                        style={{
                          boxShadow: '0 4px 12px rgba(69, 120, 190, 0.4), 0 0 16px rgba(69, 120, 190, 0.2)'
                        }}
                      >
                        Recharger
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/[0.07]">
                      <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/full%20site/diamant.png" style={{width:'1rem',height:'1rem',objectFit:'contain'}} />
                      <span className="text-sm font-bold text-emerald-400 tabular-nums">{displayReevs.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">Reevs</span>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href === '/games' && pathname.startsWith('/games'))

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => { playC5(); setMobileMenuOpen(false) }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                            isActive
                              ? 'text-[#4578be] bg-gradient-to-br from-[#4578be]/15 to-blue-500/5 border border-[#4578be]/30 shadow-lg shadow-[#4578be]/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-gray-100/80 hover:to-gray-50 dark:hover:from-gray-800/60 dark:hover:to-gray-800/40 hover:shadow-md'
                          }`}
                        >
                          <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]' : 'group-hover:scale-110'}`} />
                          <span className="font-semibold text-sm">{item.label}</span>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast notifications (battle invitations) ── */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {newToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="pointer-events-auto w-80 rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: '#1a1f2e', border: '1px solid rgba(69,120,190,0.35)', boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(69,120,190,0.2)' }}
            >
              <div className="h-[3px] bg-gradient-to-r from-[#4578be] via-[#7aadff] to-[#4578be]" />
              <div className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                  {(toast.type === 'battle_invitation' || toast.type === 'friend_request' || toast.type === 'friend_accepted') && toast.from_avatar ? (
                    <img src={toast.from_avatar} alt="" className="w-full h-full object-cover" />
                  ) : toast.type === 'battle_finished' ? (
                    <Trophy className="w-5 h-5 text-white" />
                  ) : toast.type === 'friend_request' || toast.type === 'friend_accepted' ? (
                    <Users className="w-5 h-5 text-white" />
                  ) : (
                    <Swords className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {toast.type === 'battle_finished' && (
                    <>
                      <p className="text-xs font-semibold text-[#7aadff] mb-0.5">Battle terminée</p>
                      <p className="text-sm text-gray-200 leading-snug">
                        <span className="font-bold text-white">{toast.battle_name}</span>
                        {' '}est terminée !
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => { router.push(`/battles/${toast.battle_id}`); dismissToast(toast.id) }}
                          className="px-4 py-1.5 bg-gradient-to-br from-[#4578be] to-[#5989d8] rounded-xl text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all"
                          style={{ boxShadow: '0 4px 12px rgba(69,120,190,0.4)' }}
                        >
                          Voir les résultats
                        </button>
                        <button
                          onClick={() => dismissToast(toast.id)}
                          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-400 transition-all"
                        >
                          Ignorer
                        </button>
                      </div>
                    </>
                  )}
                  {toast.type === 'battle_invitation' && (
                    <>
                      <p className="text-xs font-semibold text-[#7aadff] mb-0.5">Invitation Battle</p>
                      <p className="text-sm text-gray-200 leading-snug">
                        <span className="font-bold text-white">{toast.from_username ?? 'Joueur'}</span>
                        {' '}vous invite à rejoindre une battle !
                      </p>
                      {toast.message && (
                        <p className="text-[11px] text-gray-400 mt-1 truncate">&quot;{toast.message}&quot;</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => acceptInvitation(toast.id, toast.battle_id)}
                          className="px-4 py-1.5 bg-gradient-to-br from-[#4578be] to-[#5989d8] rounded-xl text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all"
                          style={{ boxShadow: '0 4px 12px rgba(69,120,190,0.4)' }}
                        >
                          Rejoindre
                        </button>
                        <button
                          onClick={() => dismissToast(toast.id)}
                          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-400 transition-all"
                        >
                          Ignorer
                        </button>
                      </div>
                    </>
                  )}
                  {toast.type === 'friend_request' && (
                    <>
                      <p className="text-xs font-semibold text-emerald-400 mb-0.5">Demande d&apos;ami</p>
                      <p className="text-sm text-gray-200 leading-snug">
                        <span className="font-bold text-white">{toast.from_username ?? 'Joueur'}</span>
                        {' '}vous a envoyé une demande d&apos;ami
                      </p>
                      <button
                        onClick={() => dismissToast(toast.id)}
                        className="mt-3 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-400 transition-all"
                      >
                        OK
                      </button>
                    </>
                  )}
                  {toast.type === 'friend_accepted' && (
                    <>
                      <p className="text-xs font-semibold text-emerald-400 mb-0.5">Ami accepté !</p>
                      <p className="text-sm text-gray-200 leading-snug">
                        <span className="font-bold text-white">{toast.from_username ?? 'Joueur'}</span>
                        {' '}a accepté votre demande d&apos;ami
                      </p>
                      <button
                        onClick={() => dismissToast(toast.id)}
                        className="mt-3 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-400 transition-all"
                      >
                        Super !
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <CartModal
        isOpen={cartOpen}
        onClose={() => { playInventoryClose(); setCartOpen(false) }}
        items={cartItems.map(item => ({
          id: item.id,
          item_id: item.items?.id || '',
          name: item.items?.name || 'Unknown',
          image_url: item.items?.image_url || '',
          market_value: item.items?.market_value || 0,
          rarity: item.items?.rarity || 'common',
          quantity: item.quantity
        }))}
        selectedItems={selectedCartItems}
        onSelectItem={(id) => {
          setSelectedCartItems(prev =>
            prev.includes(id)
              ? prev.filter(itemId => itemId !== id)
              : [...prev, id]
          )
        }}
        onSelectAll={() => {
          setSelectedCartItems(
            selectedCartItems.length === cartItems.length
              ? []
              : cartItems.map(item => item.id)
          )
        }}
        onSellSelected={async () => {
          try {
            // Use the RPC to prevent double-selling — it checks is_sold atomically
            const { data, error: sellError } = await supabase.rpc('sell_multiple_items_fixed', {
              p_inventory_item_ids: selectedCartItems
            })

            if (sellError) throw sellError
            if (!data || !data.success) throw new Error(data?.error || 'Vente échouée')

            await refreshProfile()
            setCartItems(prevItems => prevItems.filter(item => !selectedCartItems.includes(item.id)))
            setSelectedCartItems([])
          } catch (err) {
            console.error('Error selling items:', err)
          }
        }}
        onUpgrade={() => {
          setCartOpen(false)
          router.push('/upgrade')
        }}
        buttonRef={cartButtonRef}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => { playPaymentClose(); setPaymentModalOpen(false) }}
        buttonRef={paymentButtonRef}
      />

    </>
  )
}