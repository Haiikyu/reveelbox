'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { Flame } from 'lucide-react'

const supabase = createClient()

// Cache pour éviter les appels API répétés
const profileCache = new Map<string, { data: PlayerProfile; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute

interface PlayerProfile {
  id: string
  username: string | null
  avatar_url: string | null
  avatar_frame: string | null
  level: number
  total_exp: number
  consecutive_days: number
  virtual_currency: number
  banner_svg: string | null
  pins: Array<{ svg_code: string }>
}

// Seuils XP par niveau (identique à AuthProvider)
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

// Calcul de l'XP actuel dans le niveau (identique à AuthProvider)
function getCurrentLevelExp(totalExp: number, level: number): number {
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (level >= LEVEL_THRESHOLDS[i].level && level < LEVEL_THRESHOLDS[i + 1].level) {
      const lowerThreshold = LEVEL_THRESHOLDS[i]
      const upperThreshold = LEVEL_THRESHOLDS[i + 1]

      const levelInRange = level - lowerThreshold.level
      const levelRangeSize = upperThreshold.level - lowerThreshold.level
      const xpRange = upperThreshold.xp - lowerThreshold.xp

      const xpProgress = (levelInRange / levelRangeSize) * xpRange
      const currentLevelMinXP = Math.floor(lowerThreshold.xp + xpProgress)

      return totalExp - currentLevelMinXP
    }
  }
  return 0
}

// Calcul de l'XP requis pour le niveau suivant (identique à AuthProvider)
function getExpToNextLevel(totalExp: number, level: number): number {
  if (level >= 100) return 0

  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (level >= LEVEL_THRESHOLDS[i].level && level < LEVEL_THRESHOLDS[i + 1].level) {
      const lowerThreshold = LEVEL_THRESHOLDS[i]
      const upperThreshold = LEVEL_THRESHOLDS[i + 1]

      const levelInRange = level - lowerThreshold.level
      const levelRangeSize = upperThreshold.level - lowerThreshold.level
      const xpRange = upperThreshold.xp - lowerThreshold.xp
      const xpProgress = (levelInRange / levelRangeSize) * xpRange
      const currentLevelMinXP = Math.floor(lowerThreshold.xp + xpProgress)

      const nextLevelInRange = level + 1 - lowerThreshold.level
      const nextXpProgress = (nextLevelInRange / levelRangeSize) * xpRange
      const nextLevelMinXP = Math.floor(lowerThreshold.xp + nextXpProgress)

      return nextLevelMinXP - currentLevelMinXP
    }
  }
  return 100
}

interface PlayerHoverCardProps {
  userId: string
  isBot?: boolean
  children: React.ReactNode
  // Données pré-chargées optionnelles (pour éviter un fetch si déjà disponibles)
  preloadedData?: Partial<PlayerProfile>
}

// Helper pour les styles de cadre d'avatar
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

// Composant de contenu de la carte
function HoverCardContent({ profile }: { profile: PlayerProfile }) {
  // Calculer le pourcentage de progression XP avec le système de paliers
  const totalExp = Number(profile.total_exp) || 0
  const level = Number(profile.level) || 1
  const currentXp = getCurrentLevelExp(totalExp, level)
  const xpToNext = getExpToNextLevel(totalExp, level)
  const progressPercentage = xpToNext > 0
    ? Math.min(100, Math.round((currentXp / xpToNext) * 100))
    : 100

  return (
    <div
      className="w-[320px] rounded-xl overflow-hidden"
      style={{
        background: '#1a1c23',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Zone haute avec bannière */}
      <div
        className="relative overflow-hidden"
        style={{
          height: '180px',
          background: 'linear-gradient(135deg, #2a3f5f 0%, #1a2332 50%, #0f1419 100%)'
        }}
      >
        {/* Bannière SVG en arrière-plan */}
        {profile.banner_svg && (
          <div
            className="absolute inset-0"
            style={{ opacity: 0.6 }}
            dangerouslySetInnerHTML={{ __html: profile.banner_svg }}
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

        {/* Contenu */}
        <div className="relative h-full p-4 flex flex-col">
          {/* Avatar + Pins */}
          <div className="flex gap-3 mb-3">
            {/* Avatar avec cadre */}
            <div
              className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden ${getAvatarFrameClasses(profile.avatar_frame || 'default')}`}
              style={{ boxShadow: '0 0 30px rgba(69, 120, 190, 0.6)' }}
            >
              <img
                src={profile.avatar_url || '/default-avatar.png'}
                alt={profile.username || 'Player'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Pins */}
            <div className="flex-1 flex items-start">
              <div className="flex gap-1.5">
                {profile.pins && profile.pins.length > 0 ? (
                  profile.pins.slice(0, 4).map((pin, idx) => (
                    <div
                      key={idx}
                      className="w-9 h-9 rounded-md bg-black/40 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center p-1"
                      dangerouslySetInnerHTML={{ __html: pin.svg_code }}
                    />
                  ))
                ) : (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-9 h-9 rounded-md bg-black/40 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center"
                    >
                      <span className="text-lg opacity-30">?</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Username */}
          <h3 className="text-xl font-black text-white mb-2 drop-shadow-lg">
            {profile.username || 'Player'}
          </h3>

          {/* Niveau + XP */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-300 font-semibold whitespace-nowrap">
              Niveau {profile.level || 1}
            </span>
            <div className="flex-1">
              <div className="h-2 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#4578be] to-[#5989d8]"
                />
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {progressPercentage}%
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs text-white font-bold">{profile.consecutive_days || 0}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md">
              <img
                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                alt="Coins"
                className="w-3.5 h-3.5"
              />
              <span className="text-xs text-[#4578be] font-black">
                {(profile.virtual_currency || 0).toLocaleString()}
              </span>
              <span className="text-xs text-gray-300">coins joués</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlayerHoverCard({
  userId,
  isBot = false,
  children,
  preloadedData
}: PlayerHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Fetch profile data avec cache
  const fetchProfile = useCallback(async () => {
    if (isBot || !userId) return

    // Vérifier le cache
    const cached = profileCache.get(userId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProfile(cached.data)
      return
    }

    setLoading(true)
    try {
      // Fetch profil principal
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, theme, level, total_exp, consecutive_days, virtual_currency')
        .eq('id', userId)
        .single()

      if (!profileData) {
        setLoading(false)
        return
      }

      // Fetch bannière
      let bannerSvg = null
      const { data: bannerData } = await supabase
        .from('user_banners')
        .select('banner_id, shop_banners(svg_code)')
        .eq('user_id', userId)
        .eq('is_equipped', true)
        .single()

      if (bannerData) {
        const shopBanners = bannerData.shop_banners as unknown as { svg_code: string } | null
        if (shopBanners && !Array.isArray(shopBanners) && shopBanners.svg_code) {
          bannerSvg = shopBanners.svg_code
        }
      }

      // Fetch pins
      const { data: pinsData } = await supabase
        .from('user_pins')
        .select('pin_id, shop_pins(svg_code)')
        .eq('user_id', userId)
        .eq('is_equipped', true)
        .limit(4)

      const pins = (pinsData || [])
        .filter((item): item is typeof item & { shop_pins: { svg_code: string } } =>
          item.shop_pins !== null && !Array.isArray(item.shop_pins)
        )
        .map(item => ({ svg_code: item.shop_pins.svg_code }))

      const fullProfile: PlayerProfile = {
        id: profileData.id,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        avatar_frame: (profileData.theme as any)?.avatar_frame || 'default',
        level: profileData.level || 1,
        total_exp: profileData.total_exp || 0,
        consecutive_days: profileData.consecutive_days || 0,
        virtual_currency: profileData.virtual_currency || 0,
        banner_svg: bannerSvg,
        pins
      }

      // Mettre en cache
      profileCache.set(userId, { data: fullProfile, timestamp: Date.now() })
      setProfile(fullProfile)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, isBot])

  // Calculer la position du tooltip (position: fixed = coordonnées viewport, pas de scrollY)
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const tooltipWidth = 320
    const tooltipHeight = 200
    const gap = 12

    // Position horizontale : centré par rapport à l'élément
    let left = rect.left + rect.width / 2 - tooltipWidth / 2

    // Ajuster si déborde à gauche
    if (left < 10) {
      left = 10
    }
    // Ajuster si déborde à droite
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10
    }

    // Position verticale : au-dessus par défaut (PAS de window.scrollY avec position: fixed)
    let top = rect.top - tooltipHeight - gap

    // Si pas assez d'espace en haut, afficher en dessous
    if (rect.top - tooltipHeight - gap < 10) {
      top = rect.bottom + gap
    }

    setPosition({ top, left })
  }, [])

  // Gestion du hover avec debounce
  const handleMouseEnter = useCallback(() => {
    if (isBot) return

    // Debounce de 150ms avant d'afficher
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true)
      updatePosition()

      // Utiliser les données pré-chargées si disponibles
      if (preloadedData) {
        setProfile({
          id: userId,
          username: preloadedData.username || null,
          avatar_url: preloadedData.avatar_url || null,
          avatar_frame: preloadedData.avatar_frame || 'default',
          level: preloadedData.level || 1,
          total_exp: preloadedData.total_exp || 0,
          consecutive_days: preloadedData.consecutive_days || 0,
          virtual_currency: preloadedData.virtual_currency || 0,
          banner_svg: preloadedData.banner_svg || null,
          pins: preloadedData.pins || []
        })
      } else {
        fetchProfile()
      }
    }, 150)
  }, [isBot, updatePosition, fetchProfile, preloadedData, userId])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(false)
  }, [])

  // Mettre à jour la position au scroll/resize
  useEffect(() => {
    if (!isHovered) return

    const handleUpdate = () => updatePosition()
    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [isHovered, updatePosition])

  // Si c'est un bot, ne pas ajouter la fonctionnalité de hover
  if (isBot) {
    return <>{children}</>
  }

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
        style={{ zIndex: isHovered ? 9999 : 'auto' }}
      >
        {children}
      </div>

      {/* Portal pour le tooltip */}
      {mounted && isHovered && profile && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed pointer-events-none"
            style={{
              top: position.top,
              left: position.left,
              zIndex: 99999
            }}
          >
            <HoverCardContent profile={profile} />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Loading state */}
      {mounted && isHovered && loading && !profile && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed pointer-events-none"
          style={{
            top: position.top,
            left: position.left,
            zIndex: 99999
          }}
        >
          <div
            className="w-[320px] h-[180px] rounded-xl flex items-center justify-center"
            style={{
              background: '#1a1c23',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        </motion.div>,
        document.body
      )}
    </>
  )
}

// Export du helper pour réutilisation
export { getAvatarFrameClasses }
