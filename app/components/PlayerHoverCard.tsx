'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { Flame, Plus } from 'lucide-react'
import { getUsernameStyle } from '@/utils/usernameStyle'
import { sanitizeSvg } from '@/utils/sanitizeSvg'
import { useAuth } from '@/app/components/AuthProvider'

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
  pins: Array<{ content: string }>
  name_color_value: string | null
  name_color_is_gradient: boolean | null
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
function HoverCardContent({ profile, buyingStreak, isOwnProfile }: { 
  profile: PlayerProfile
  buyingStreak: boolean
  isOwnProfile: boolean
}) {
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
        {/* Bannière (SVG ou image) en arrière-plan */}
        {profile.banner_svg && (
          profile.banner_svg.startsWith('<') ? (
            <div
              className="absolute inset-0"
              style={{ opacity: 0.6 }}
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(profile.banner_svg) }}
            />
          ) : (
            <img
              src={profile.banner_svg}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.6 }}
            />
          )
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

        {/* Contenu */}
        <div className="relative h-full p-4 flex flex-col">
          {/* Avatar + Pins + Username */}
          <div className="flex gap-3 mb-3">
            {/* Avatar */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <div
                className={`w-full h-full rounded-xl overflow-hidden ${getAvatarFrameClasses(profile.avatar_frame || 'default')}`}
                style={{ boxShadow: '0 0 30px rgba(69, 120, 190, 0.6)' }}
              >
                <img
                  src={profile.avatar_url || '/default-avatar.png'}
                  alt={profile.username || 'Player'}
                  className="w-full h-full object-cover scale-110"
                />
              </div>
            </div>

            {/* Right column: Pins + Username */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* Pins */}
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const pin = profile.pins?.[idx]
                  return pin ? (
                    <div
                      key={idx}
                      className="w-9 h-9 rounded-md bg-black/40 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center p-1"
                    >
                      {pin.content.startsWith('<') ? (
                        <div className="[&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sanitizeSvg(pin.content) }} />
                      ) : (
                        <img src={pin.content} alt={`Pin ${idx + 1}`} className="w-full h-full object-contain" />
                      )}
                    </div>
                  ) : (
                    <div
                      key={`empty-${idx}`}
                      className="w-9 h-9 rounded-md bg-black/20 backdrop-blur-sm border border-dashed border-gray-600/30 flex items-center justify-center"
                      style={{ boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.15)' }}
                    >
                      <Plus className="w-3 h-3 text-white/15" />
                    </div>
                  )
                })}
              </div>
              {/* Username + flamme */}
              <div className="flex items-center gap-1.5">
                <h3
                  className="text-xl font-black text-white drop-shadow-lg leading-tight"
                  style={getUsernameStyle(profile.name_color_value, profile.name_color_is_gradient)}
                >
                  {(profile.username || 'Player').slice(0, 12)}
                </h3>
                <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex-shrink-0">
                  <Flame className="h-3 w-3 text-orange-400" />
                  <span className="text-[10px] text-orange-300 font-bold">{profile.consecutive_days || 0}</span>
                </div>
              </div>
            </div>
          </div>

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
  const { user, streakLostDays } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const [buyingStreak, setBuyingStreak] = useState(false)
  const [showStreakModal, setShowStreakModal] = useState(false)
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
        .select('banner_id, shop_banners(svg_code, image_url)')
        .eq('user_id', userId)
        .eq('is_equipped', true)
        .single()

      if (bannerData) {
        const shopBanners = bannerData.shop_banners as unknown as { svg_code: string | null; image_url: string | null } | null
        if (shopBanners && !Array.isArray(shopBanners)) {
          bannerSvg = shopBanners.image_url || shopBanners.svg_code
        }
      }

      // Fetch pins (ordered by slot_number)
      const { data: pinsData } = await supabase
        .from('user_pins')
        .select('pin_id, slot_number, shop_pins(svg_code, image_url)')
        .eq('user_id', userId)
        .eq('is_equipped', true)
        .order('slot_number', { ascending: true })
        .limit(4)

      const pins = (pinsData || [])
        .filter((item): item is typeof item & { shop_pins: { svg_code: string | null; image_url: string | null } } =>
          item.shop_pins !== null && !Array.isArray(item.shop_pins)
        )
        .map(item => ({ content: item.shop_pins.image_url || item.shop_pins.svg_code || '' }))

      // Fetch name color
      let nameColorValue: string | null = null
      let nameColorIsGradient: boolean | null = null
      const { data: colorData } = await supabase
        .from('user_name_colors')
        .select('color_id, shop_name_colors(color_value, is_gradient)')
        .eq('user_id', userId)
        .eq('is_equipped', true)
        .single()

      if (colorData) {
        const sc = colorData.shop_name_colors as unknown as { color_value: string; is_gradient: boolean } | null
        if (sc && !Array.isArray(sc)) {
          nameColorValue = sc.color_value
          nameColorIsGradient = sc.is_gradient
        }
      }

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
        pins,
        name_color_value: nameColorValue,
        name_color_is_gradient: nameColorIsGradient
      }

      // Mettre en cache
      profileCache.set(userId, { data: fullProfile, timestamp: Date.now() })
      setProfile(fullProfile)

      // Si c'est mon propre profil → update streak
      if (user?.id === userId) {
        const { data: streakData } = await supabase.rpc('update_streak', { p_user_id: userId })
        if (streakData?.action === 'incremented') {
          setProfile(p => p ? { ...p, consecutive_days: streakData.streak } : p)
        }
        // Invalider le cache pour forcer rechargement
        profileCache.delete(userId)
      }
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
          pins: preloadedData.pins || [],
          name_color_value: preloadedData.name_color_value || null,
          name_color_is_gradient: preloadedData.name_color_is_gradient || null
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

  // TEMPS RÉEL : Écouter les changements de cosmétiques pour cet utilisateur
  useEffect(() => {
    if (!userId || isBot) return

    const channel = supabase.channel(`player-cosmetics-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_pins',
        filter: `user_id=eq.${userId}`
      }, () => {
        console.log(`🎨 Pins changed for user ${userId} - invalidating cache`)
        profileCache.delete(userId)
        if (isHovered) fetchProfile()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_banners',
        filter: `user_id=eq.${userId}`
      }, () => {
        console.log(`🎨 Banners changed for user ${userId} - invalidating cache`)
        profileCache.delete(userId)
        if (isHovered) fetchProfile()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_frames',
        filter: `user_id=eq.${userId}`
      }, () => {
        console.log(`🎨 Frames changed for user ${userId} - invalidating cache`)
        profileCache.delete(userId)
        if (isHovered) fetchProfile()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_name_colors',
        filter: `user_id=eq.${userId}`
      }, () => {
        console.log(`🎨 Name colors changed for user ${userId} - invalidating cache`)
        profileCache.delete(userId)
        if (isHovered) fetchProfile()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, isBot, isHovered, fetchProfile])

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
            <HoverCardContent profile={profile} buyingStreak={buyingStreak} isOwnProfile={user?.id === profile.id} />
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
      {/* Modal streak perdu — inline */}
      {mounted && user?.id === userId && createPortal(
        <AnimatePresence>
          {showStreakModal && (
            <>
              <motion.div
                key="streak-backdrop"
                style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)'}}
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              />
              <motion.div
                key="streak-modal"
                style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              >
                <motion.div
                  initial={{scale:0.85,y:30}} animate={{scale:1,y:0}} exit={{scale:0.85,y:30}}
                  transition={{type:'spring',stiffness:300,damping:25}}
                  style={{width:'100%',maxWidth:380,background:'rgba(8,11,28,0.98)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:20,boxShadow:'0 0 60px rgba(245,158,11,0.12),0 24px 64px rgba(0,0,0,0.6)',overflow:'hidden'}}
                >
                  <div style={{height:2,background:'linear-gradient(90deg,transparent,#f97316 40%,#f59e0b 60%,transparent)'}}/>
                  <div style={{padding:'28px 28px 24px'}}>
                    <div style={{textAlign:'center',marginBottom:16}}>
                      <motion.div animate={{scale:[1,1.1,1]}} transition={{duration:1.5,repeat:Infinity}} style={{fontSize:52,lineHeight:1}}>💔</motion.div>
                    </div>
                    <h2 style={{textAlign:'center',fontSize:20,fontWeight:900,color:'#fff',marginBottom:6}}>Ta série s'est arrêtée</h2>
                    <p style={{textAlign:'center',fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:24,lineHeight:1.5}}>
                      Tu n'étais pas connecté pendant <strong style={{color:'#f97316'}}>{streakLostDays} jour{streakLostDays>1?'s':''}</strong>. Ta série est revenue à <strong style={{color:'#fff'}}>1 🔥</strong>.
                    </p>
                    {/* Avant / Après */}
                    <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600,marginBottom:2}}>Actuel</div>
                        <div style={{fontSize:22,fontWeight:900,color:'#f97316'}}>1 🔥</div>
                      </div>
                      <div style={{fontSize:18,color:'rgba(255,255,255,0.15)'}}>→</div>
                      <div style={{textAlign:'center'}}>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600,marginBottom:2}}>Après rachat</div>
                        <div style={{fontSize:22,fontWeight:900,color:'#22c55e'}}>{1+streakLostDays} 🔥</div>
                      </div>
                    </div>
                    {/* Coût */}
                    <div style={{background:(profile?.virtual_currency||0)>=streakLostDays?'rgba(245,158,11,0.08)':'rgba(239,68,68,0.08)',border:`1px solid ${(profile?.virtual_currency||0)>=streakLostDays?'rgba(245,158,11,0.2)':'rgba(239,68,68,0.2)'}`,borderRadius:10,padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                      <span style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{streakLostDays} jour{streakLostDays>1?'s':''} × 1 🪙</span>
                      <span style={{fontSize:15,fontWeight:900,color:(profile?.virtual_currency||0)>=streakLostDays?'#fbbf24':'#ef4444'}}>
                        {streakLostDays} 🪙 {(profile?.virtual_currency||0)<streakLostDays&&<span style={{fontSize:10}}>(solde insuffisant)</span>}
                      </span>
                    </div>
                    {/* Boutons */}
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>setShowStreakModal(false)} style={{flex:1,padding:'12px 0',borderRadius:10,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.45)',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                        Ignorer
                      </button>
                      <motion.button
                        whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                        disabled={buyingStreak||(profile?.virtual_currency||0)<streakLostDays}
                        onClick={async()=>{
                          if(!user?.id||buyingStreak) return
                          setBuyingStreak(true)
                          const {data} = await supabase.rpc('buy_streak_days',{p_user_id:user.id,p_days:streakLostDays})
                          if(data?.success){
                            setProfile(p=>p?{...p,consecutive_days:data.new_streak,virtual_currency:p.virtual_currency-data.cost}:p)
                            setShowStreakModal(false)
                            profileCache.delete(userId)
                          }
                          setBuyingStreak(false)
                        }}
                        style={{flex:2,padding:'12px 0',borderRadius:10,background:(profile?.virtual_currency||0)>=streakLostDays?'linear-gradient(135deg,#f97316,#f59e0b)':'rgba(255,255,255,0.06)',border:'none',color:(profile?.virtual_currency||0)>=streakLostDays?'#fff':'rgba(255,255,255,0.25)',fontSize:13,fontWeight:900,cursor:(profile?.virtual_currency||0)>=streakLostDays?'pointer':'not-allowed',boxShadow:(profile?.virtual_currency||0)>=streakLostDays?'0 4px 20px rgba(249,115,22,0.35)':'none'}}
                      >
                        {buyingStreak?'...':`🔥 Récupérer pour ${streakLostDays} 🪙`}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

// Export du helper pour réutilisation
export { getAvatarFrameClasses }