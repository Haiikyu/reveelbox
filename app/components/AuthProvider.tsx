'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient, resetSupabaseInstance } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { calculateLevel } from '@/lib/xp-system'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

// ─── Sons ────────────────────────────────────────────────────────
const playLevelUp = () => {
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
  const notes = [392, 523, 659, 784, 880, 1047]
  notes.forEach((freq, i) => {
    note(freq, i * 0.07, 0.065, 0.14 + i * 0.01)
    note(freq, i * 0.07, 0.35 + i * 0.05, 0.05)
  })
}

const playPopOff = () => {
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
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
  o.type = 'sine'; o.frequency.value = 880
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(0.2, now + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.035)
  o.connect(g); g.connect(master); g.connect(reverb)
  o.start(now); o.stop(now + 0.1)
}

const playConfirmSelect = () => {
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
  note(523,  0,    0.06, 0.15)
  note(784,  0.05, 0.06, 0.17)
  note(1047, 0.10, 0.07, 0.20)
  note(1047, 0.10, 0.5,  0.09)
}

// ─── Notification level-up simple ────────────────────────────────
function LevelUpNotification({ level, onDone }: { level: number; onDone: () => void }) {
  useEffect(() => {
    playLevelUp()
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ x: -120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
        minWidth: 280, maxWidth: 340, borderRadius: 12,
        background: 'linear-gradient(135deg, #0d2318 0%, #0a1f14 100%)',
        border: '1px solid rgba(34, 197, 94, 0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 24px rgba(34,197,94,0.12)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
        }}>🏆</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Niveau {level} atteint !</div>
          <div style={{ color: 'rgba(148,163,184,0.85)', fontSize: 12, marginTop: 2 }}>Félicitations</div>
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(34, 197, 94, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: 3.5, ease: 'linear' }}
        style={{ height: 3, background: 'linear-gradient(90deg, #16a34a, #22c55e)', transformOrigin: 'left' }}
      />
    </motion.div>
  )
}

// ─── Notification freedrop débloquée ─────────────────────────────
interface FreedropBox { id: string; name: string; image_url: string; required_level: number }

function FreedropUnlockedNotification({ box, onDone }: { box: FreedropBox; onDone: () => void }) {
  const router = useRouter()

  useEffect(() => {
    playLevelUp()
  }, [])

  const handleOpen = () => {
    playConfirmSelect()
    router.push(`/freedrop/${box.id}`)
    onDone()
  }

  const handleLater = () => {
    playPopOff()
    onDone()
  }

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
        width: 420, borderRadius: 16,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Ligne déco top */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, transparent, #8b5cf6, #a78bfa, #8b5cf6, transparent)'
      }} />

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Image caisse — côté gauche */}
        <div style={{
          width: 110, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))',
          borderRight: '1px solid rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 8px', position: 'relative', overflow: 'hidden'
        }}>
          {/* Glow derrière l'image */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at center, rgba(139,92,246,0.25) 0%, transparent 70%)'
          }} />
          <motion.img
            src={box.image_url || '/placeholder.png'}
            alt={box.name}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 80, height: 80, objectFit: 'contain', position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 0 12px rgba(139,92,246,0.5))'
            }}
          />
        </div>

        {/* Contenu — côté droit */}
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Badge niveau */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              padding: '2px 8px', borderRadius: 20,
              background: 'rgba(139,92,246,0.25)',
              border: '1px solid rgba(139,92,246,0.4)',
              color: '#a78bfa'
            }}>NIVEAU {box.required_level}</span>
            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>DÉBLOQUÉ</span>
          </div>

          {/* Titre */}
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              Caisse débloquée !
            </div>
            <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: 13, marginTop: 3 }}>
              {box.name}
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleOpen}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                color: '#fff', fontWeight: 700, fontSize: 12,
                boxShadow: '0 4px 12px rgba(124,58,237,0.4)'
              }}
            >
              Ouvrir maintenant
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleLater}
              style={{
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(148,163,184,0.9)', fontWeight: 600, fontSize: 12
              }}
            >
              Plus tard
            </motion.button>
          </div>
        </div>
      </div>

      {/* Barre progression */}
      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: 15, ease: 'linear' }}
        style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', transformOrigin: 'left' }}
      />
    </motion.div>
  )
}

// ─── Notification chat débloqué (niveau 2) ────────────────────────
function ChatUnlockedNotification({ onDone }: { onDone: () => void }) {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(onDone, 15000)
    return () => clearTimeout(t)
  }, [onDone])

  const handleOpen = () => {
    playConfirmSelect()
    onDone()
    // Le chat est en bas à droite, pas besoin de redirect
  }

  const handleLater = () => {
    playPopOff()
    onDone()
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        width: 380, borderRadius: 16,
        background: 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #0f172a 100%)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Ligne déco top */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent)'
      }} />

      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Icône chat — côté droit */}
        <div style={{
          width: 100, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1))',
          borderRight: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 8px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at center, rgba(59,130,246,0.25) 0%, transparent 70%)'
          }} />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            {/* Icône chat SVG */}
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="rgba(59,130,246,0.15)"/>
              <path d="M14 18C14 15.8 15.8 14 18 14H38C40.2 14 42 15.8 42 18V32C42 34.2 40.2 36 38 36H30L22 42V36H18C15.8 36 14 34.2 14 32V18Z"
                fill="#3b82f6" opacity="0.9"/>
              <circle cx="22" cy="25" r="2.5" fill="white"/>
              <circle cx="28" cy="25" r="2.5" fill="white"/>
              <circle cx="34" cy="25" r="2.5" fill="white"/>
            </svg>
          </motion.div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              padding: '2px 8px', borderRadius: 20,
              background: 'rgba(59,130,246,0.25)',
              border: '1px solid rgba(59,130,246,0.4)',
              color: '#60a5fa'
            }}>NIVEAU 2</span>
            <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>DÉBLOQUÉ</span>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              Chat communautaire !
            </div>
            <div style={{ color: '#93c5fd', fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>
              Bonne discussion avec les autres joueurs 💬
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleOpen}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                color: '#fff', fontWeight: 700, fontSize: 12,
                boxShadow: '0 4px 12px rgba(29,78,216,0.4)'
              }}
            >
              Ouvrir le chat
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleLater}
              style={{
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(148,163,184,0.9)', fontWeight: 600, fontSize: 12
              }}
            >
              Plus tard
            </motion.button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: 15, ease: 'linear' }}
        style={{ height: 3, background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', transformOrigin: 'left' }}
      />
    </motion.div>
  )
}

interface Profile {
  id: string
  username?: string
  virtual_currency: number
  loyalty_points: number
  total_exp: number
  bio?: string
  location?: string
  phone?: string
  birth_date?: string
  avatar_url?: string
  privacy_profile: string
  notifications_email: boolean
  notifications_push: boolean
  role: string
  is_admin: boolean
  created_at: string
  updated_at: string
  level?: number
  current_level_exp?: number
  current_level_xp?: number
  exp_to_next?: number
  next_level_xp?: number
  progress_percentage?: number
  coins_balance?: number
  theme?: any
  consecutive_days?: number
  longest_streak?: number
  last_activity?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
  streakLostDays: number
  clearStreakLost: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [streakLostDays, setStreakLostDays] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [levelUpNotif, setLevelUpNotif] = useState<number | null>(null)
  const [freedropNotif, setFreedropNotif] = useState<FreedropBox | null>(null)
  const [chatNotif, setChatNotif] = useState(false)
  const lastNotifiedLevelRef = useRef<number>(
    typeof window !== 'undefined'
      ? parseInt(localStorage.getItem('reveelbox_last_notified_level') || '0', 10)
      : 0
  )
  
  const supabaseRef = useRef(createClient())
  const initializingRef = useRef(false)
  const profileCacheRef = useRef<{ userId: string, profile: Profile } | null>(null)

  const enrichProfileWithXP = (profileData: any): Profile => {
    if (!profileData) return profileData
    
    const totalExp = profileData.total_exp || 0
    const level = calculateLevel(totalExp)
    
    // Calculer l'XP actuel dans le niveau courant avec le nouveau système
    const currentLevelXP = getCurrentLevelExp(totalExp)
    const expToNext = getExpToNextLevel(totalExp)
    const progressPercentage = expToNext > 0 ? Math.round((currentLevelXP / expToNext) * 100) : 100
    
    return {
      ...profileData,
      level,
      current_level_exp: currentLevelXP,
      exp_to_next: expToNext,
      progress_percentage: progressPercentage
    }
  }

  // Fonctions helpers pour le nouveau système XP avec paliers
  const getCurrentLevelExp = (totalExp: number): number => {
    const LEVEL_THRESHOLDS = [
      { level: 1, xp: 0 },
      { level: 2, xp: 100 },
      { level: 10, xp: 1500 },
      { level: 20, xp: 7500 },
      { level: 30, xp: 20000 },
      { level: 40, xp: 50000 },
      { level: 50, xp: 150000 },
      { level: 60, xp: 350000 },
      { level: 70, xp: 1000000 },
      { level: 80, xp: 2500000 },
      { level: 90, xp: 7500000 },
      { level: 100, xp: 20000000 },
    ]
    
    const currentLevel = calculateLevel(totalExp)
    
    // Trouver l'XP minimum pour ce niveau
    for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
      if (currentLevel >= LEVEL_THRESHOLDS[i].level && currentLevel < LEVEL_THRESHOLDS[i + 1].level) {
        const lowerThreshold = LEVEL_THRESHOLDS[i]
        const upperThreshold = LEVEL_THRESHOLDS[i + 1]
        
        const levelInRange = currentLevel - lowerThreshold.level
        const levelRangeSize = upperThreshold.level - lowerThreshold.level
        const xpRange = upperThreshold.xp - lowerThreshold.xp
        
        const xpProgress = (levelInRange / levelRangeSize) * xpRange
        const currentLevelMinXP = Math.floor(lowerThreshold.xp + xpProgress)
        
        return totalExp - currentLevelMinXP
      }
    }
    
    return 0
  }
  
  const getExpToNextLevel = (totalExp: number): number => {
    const LEVEL_THRESHOLDS = [
      { level: 1, xp: 0 },
      { level: 2, xp: 100 },
      { level: 10, xp: 1500 },
      { level: 20, xp: 7500 },
      { level: 30, xp: 20000 },
      { level: 40, xp: 50000 },
      { level: 50, xp: 150000 },
      { level: 60, xp: 350000 },
      { level: 70, xp: 1000000 },
      { level: 80, xp: 2500000 },
      { level: 90, xp: 7500000 },
      { level: 100, xp: 20000000 },
    ]
    
    const currentLevel = calculateLevel(totalExp)
    if (currentLevel >= 100) return 0
    
    // Trouver l'XP pour le niveau suivant
    for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
      if (currentLevel >= LEVEL_THRESHOLDS[i].level && currentLevel < LEVEL_THRESHOLDS[i + 1].level) {
        const lowerThreshold = LEVEL_THRESHOLDS[i]
        const upperThreshold = LEVEL_THRESHOLDS[i + 1]
        
        // XP min pour niveau actuel
        const levelInRange = currentLevel - lowerThreshold.level
        const levelRangeSize = upperThreshold.level - lowerThreshold.level
        const xpRange = upperThreshold.xp - lowerThreshold.xp
        const xpProgress = (levelInRange / levelRangeSize) * xpRange
        const currentLevelMinXP = Math.floor(lowerThreshold.xp + xpProgress)
        
        // XP min pour niveau suivant
        const nextLevelInRange = currentLevel + 1 - lowerThreshold.level
        const nextXpProgress = (nextLevelInRange / levelRangeSize) * xpRange
        const nextLevelMinXP = Math.floor(lowerThreshold.xp + nextXpProgress)
        
        return nextLevelMinXP - currentLevelMinXP
      }
    }
    
    return 0
  }

  const loadProfile = useCallback(async (userId: string, forceRefresh = false) => {
    if (!forceRefresh && profileCacheRef.current?.userId === userId) {
      setProfile(profileCacheRef.current.profile)
      return
    }

    setProfileLoading(true)
    try {
      const { data, error } = await supabaseRef.current
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erreur chargement profil:', error)
        setProfile(null)
        profileCacheRef.current = null
      } else if (data) {
        const enrichedProfile = enrichProfileWithXP(data)
        setProfile(enrichedProfile)
        profileCacheRef.current = { userId, profile: enrichedProfile }
      }
    } catch (error) {
      console.error('Erreur loadProfile:', error)
      setProfile(null)
      profileCacheRef.current = null
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return
    initializingRef.current = true

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabaseRef.current.auth.getSession()
      
      if (sessionError) {
        console.error('Erreur récupération session:', sessionError)
        setUser(null)
        setSession(null)
        setProfile(null)
        profileCacheRef.current = null
        return
      }

      if (currentSession?.user) {
        setUser(currentSession.user)
        setSession(currentSession)
        
        if (!profileCacheRef.current || profileCacheRef.current.userId !== currentSession.user.id) {
          await loadProfile(currentSession.user.id)
        }
      } else {
        setUser(null)
        setSession(null)
        setProfile(null)
        profileCacheRef.current = null
      }
    } catch (error) {
      console.error('Erreur initialisation auth:', error)
      setUser(null)
      setSession(null)
      setProfile(null)
      profileCacheRef.current = null
    } finally {
      setLoading(false)
      initializingRef.current = false
    }
  }, [loadProfile])

  useEffect(() => {
    initializeAuth()

    let timeoutId: NodeJS.Timeout | null = null

    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, newSession) => {
        if (timeoutId) clearTimeout(timeoutId)

        timeoutId = setTimeout(async () => {
          console.log('🔍 Auth state change:', event, newSession?.user?.id)

          if (event === 'SIGNED_OUT' || !newSession?.user) {
            setUser(null)
            setSession(null)
            setProfile(null)
            profileCacheRef.current = null
            setLoading(false)
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(newSession.user)
            setSession(newSession)

            if (!profileCacheRef.current || profileCacheRef.current.userId !== newSession.user.id) {
              await loadProfile(newSession.user.id)
            }

            // Mise à jour de la flamme quotidienne (système Snapchat)
            if (event === 'SIGNED_IN') {
              supabaseRef.current.rpc('update_streak', { p_user_id: newSession.user.id })
                .then(({ data }) => {
                  if (data?.action === 'incremented') {
                    console.log('🔥 Streak +1 :', data.streak)
                  } else if (data?.action === 'reset') {
                    console.log('💔 Streak reset, jours perdus :', data.days_lost)
                  }
                })
            }

            setLoading(false)
          }
        }, 100)
      }
    )

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      initializingRef.current = false
    }
  }, [initializeAuth, loadProfile])

  // Real-time subscription pour les changements de profil
  useEffect(() => {
    if (!user?.id) return

    const channel = supabaseRef.current
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          console.log('💰 Balance update detected:', payload.new)
          
          const oldBalance = payload.old?.virtual_currency || 0
          const newBalance = payload.new?.virtual_currency || 0
          
          // Si la balance a BAISSÉ = dépense de coins
          if (newBalance < oldBalance) {
            const coinsSpent = oldBalance - newBalance
            console.log('🎯 Coins dépensés:', coinsSpent)
            
            // Calculer l'XP gagné (1 coin = 2.857 XP, car 10€ = 17.5 coins = 50 XP)
            const COINS_TO_XP = 50 / 17.5 // 2.857
            const xpGained = Math.floor(coinsSpent * COINS_TO_XP)
            
            if (xpGained > 0) {
              console.log('⭐ XP gagné:', xpGained)
              
              // Calculer le nouveau total XP et niveau
              const oldTotalXP = payload.old?.total_exp || 0
              const newTotalXP = oldTotalXP + xpGained
              const newLevel = calculateLevel(newTotalXP)
              
              console.log('📈 Niveau:', payload.old?.level, '→', newLevel)
              
              // Mettre à jour en base de données
              try {
                const { error } = await supabaseRef.current
                  .from('profiles')
                  .update({
                    total_exp: newTotalXP,
                    level: newLevel
                  })
                  .eq('id', user.id)
                
                if (error) {
                  console.error('❌ Erreur mise à jour XP:', error)
                } else {
                  console.log('✅ XP et niveau mis à jour en base!')
                }
              } catch (error) {
                console.error('❌ Erreur update XP:', error)
              }
            }
          }
          
          // Enrichir le profil avec les calculs XP et mettre à jour l'état
          const enrichedProfile = enrichProfileWithXP(payload.new)
          setProfile(enrichedProfile)
          profileCacheRef.current = { userId: user.id, profile: enrichedProfile }

          // Détecter le level-up en comparant directement les total_exp
          const oldLevel = calculateLevel(payload.old?.total_exp || 0)
          const newLevel = calculateLevel(payload.new?.total_exp || 0)

          // Ne notifier qu'une seule fois par niveau
          if (newLevel > oldLevel && newLevel > lastNotifiedLevelRef.current) {
            lastNotifiedLevelRef.current = newLevel
            localStorage.setItem('reveelbox_last_notified_level', String(newLevel))

            // Vérifier si une caisse freedrop est débloquée à ce niveau
            try {
              const { data: freedropBox } = await supabaseRef.current
                .from('loot_boxes')
                .select('id, name, image_url, required_level')
                .eq('required_level', newLevel)
                .limit(1)
                .single()

              if (freedropBox) {
                // Niveau avec freedrop → seulement la notif caisse (pas level-up)
                setFreedropNotif(freedropBox)
                // Niveau 2 → aussi la notif chat (après la caisse)
                if (newLevel === 2) {
                  setTimeout(() => setChatNotif(true), 100)
                }
              } else {
                // Niveau sans freedrop → notif level-up simple
                setLevelUpNotif(newLevel)
              }
            } catch {
              // En cas d'erreur DB → notif level-up simple par défaut
              setLevelUpNotif(newLevel)
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id])

  const clearStreakLost = useCallback(() => setStreakLostDays(0), [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.id, true)
  }, [user, loadProfile])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user || !profile) return

    const updatedData = updates.total_exp !== undefined 
      ? enrichProfileWithXP({ ...profile, ...updates })
      : { ...profile, ...updates }

    const previousProfile = profile
    setProfile(updatedData)
    profileCacheRef.current = { userId: user.id, profile: updatedData }

    try {
      const { level, current_level_exp, exp_to_next, progress_percentage, ...dbUpdates } = updates
      
      const { error } = await supabaseRef.current
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)

      if (error) {
        setProfile(previousProfile)
        profileCacheRef.current = { userId: user.id, profile: previousProfile }
        throw error
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error)
      throw error
    }
  }, [user, profile])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabaseRef.current.auth.signOut()

      if (error) {
        console.error('Erreur déconnexion:', error)
      }

      setUser(null)
      setSession(null)
      setProfile(null)
      profileCacheRef.current = null

      // Réinitialiser l'instance Supabase singleton
      resetSupabaseInstance()

      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('redirectAfterLogin')
        localStorage.removeItem('redirectAfterSignup')
        localStorage.removeItem('reveelbox_last_notified_level')
        lastNotifiedLevelRef.current = 0
      }
    } catch (error) {
      console.error('Erreur signOut:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const contextValue = useCallback(() => ({
    user,
    session,
    profile,
    loading,
    profileLoading,
    refreshProfile,
    streakLostDays,
    clearStreakLost,
    updateProfile,
    signOut,
    isAuthenticated: !!user && !!session
  }), [user, session, profile, loading, profileLoading, refreshProfile, updateProfile, signOut, streakLostDays, clearStreakLost])

  return (
    <AuthContext.Provider value={contextValue()}>
      {children}
      <AnimatePresence>
        {levelUpNotif !== null && (
          <LevelUpNotification
            key={levelUpNotif}
            level={levelUpNotif}
            onDone={() => setLevelUpNotif(null)}
          />
        )}
        {freedropNotif !== null && (
          <FreedropUnlockedNotification
            key={freedropNotif.id}
            box={freedropNotif}
            onDone={() => setFreedropNotif(null)}
          />
        )}
        {chatNotif && (
          <ChatUnlockedNotification
            key="chat-unlocked"
            onDone={() => setChatNotif(false)}
          />
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthCheck() {
  const { user, loading } = useAuth()
  const [isValidating, setIsValidating] = useState(false)
  const supabase = createClient()

  const validateSession = useCallback(async () => {
    if (loading || !user) return true

    setIsValidating(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.log('Session invalide, déconnexion...')
        await supabase.auth.signOut()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Erreur validation session:', error)
      return false
    } finally {
      setIsValidating(false)
    }
  }, [user, loading, supabase])

  return { validateSession, isValidating }
}