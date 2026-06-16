// app/freedrop/page.tsx - Refonte visuelle alignée sur /boxes
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useTheme } from '@/app/components/ThemeProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Lock, Timer, ArrowRight, AlertTriangle, Package, CheckCircle } from 'lucide-react'
import { LoadingState } from '../components/ui/LoadingState'
import { DropsFeed } from '@/app/components/DropsFeed'
import { getUserLevelInfo } from '@/lib/xp-system'
import type { DailyBox, UserStats } from '@/types/freedrop'

function GradientSeparator({ isDark }: { isDark?: boolean }) {
  return (
    <div className="w-full my-8 sm:my-10 h-px" style={{
      background: isDark
        ? 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.04) 50%, transparent 95%)'
        : 'linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.06) 50%, transparent 95%)'
    }} />
  )
}

export default function FreedropPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [boxes, setBoxes] = useState<DailyBox[]>([])
  const [todayClaims, setTodayClaims] = useState<any[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeToMidnight, setTimeToMidnight] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const pageBg = isDark ? '#0C1220' : '#fafafa'

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(''), 5000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  // Timer jusqu'à minuit
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)

      const diff = midnight.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeToMidnight(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])


  // Validation sécurisée des données
  const validateLootBoxItem = (item: any): boolean => {
    return item &&
           typeof item.probability === 'number' &&
           item.items &&
           typeof item.items.id === 'string' &&
           typeof item.items.name === 'string' &&
           typeof item.items.market_value === 'number' &&
           typeof item.items.rarity === 'string'
  }

  // Transformation sécurisée des données
  const transformSupabaseBox = (data: any): DailyBox | null => {
    try {
      if (!data || typeof data.id !== 'string' || typeof data.name !== 'string') {
        return null
      }

      const validItems = (data.loot_box_items || [])
        .filter(validateLootBoxItem)
        .map((item: any) => ({
          probability: item.probability,
          display_order: item.display_order,
          items: {
            id: item.items.id,
            name: item.items.name,
            description: item.items.description || undefined,
            rarity: item.items.rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
            image_url: item.items.image_url || undefined,
            market_value: item.items.market_value,
            category: item.items.category || undefined
          }
        }))

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        required_level: data.required_level || 1,
        image_url: data.image_url || '',
        rarity: calculateBoxRarity(data.required_level || 1),
        max_value: 100,
        loot_box_items: validItems
      }
    } catch (err) {
      console.error('Erreur transformation box:', err)
      return null
    }
  }

  // Charger les données avec timeout et fallback
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError('')

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )

        const dataPromise = (async () => {
          const { data: boxesData, error: boxesError } = await supabase
            .from('loot_boxes')
            .select(`
              id,
              name,
              description,
              required_level,
              image_url,
              loot_box_items (
                probability,
                display_order,
                items (
                  id,
                  name,
                  rarity,
                  image_url,
                  market_value,
                  description,
                  category
                )
              )
            `)
            .eq('is_daily_free', true)
            .eq('is_active', true)
            .order('required_level', { ascending: true })

          if (boxesError) {
            console.warn('Erreur DB:', boxesError)
            return { boxes: [], claims: [], stats: null }
          }

          const mappedBoxes: DailyBox[] = (boxesData || [])
            .map(transformSupabaseBox)
            .filter((box): box is DailyBox => box !== null)

          const today = new Date().toISOString().split('T')[0]
          const { data: claimsData } = await supabase
            .from('daily_box_claims')
            .select('daily_box_id, claimed_date')
            .eq('user_id', user.id)
            .eq('claimed_date', today)

          // Utiliser le vrai système XP pour calculer la progression
          const totalExp = profile?.total_exp || 0
          const levelInfo = getUserLevelInfo(totalExp)

          const stats: UserStats = {
            level: levelInfo.level,
            current_exp: levelInfo.currentLevelExp,
            exp_to_next: levelInfo.expToNextLevel || 1,
            current_streak: 0,
            longest_streak: 0,
            total_daily_claims: claimsData?.length || 0
          }

          return {
            boxes: mappedBoxes,
            claims: claimsData || [],
            stats
          }
        })()

        const result = await Promise.race([dataPromise, timeoutPromise])

        setBoxes(result.boxes)
        setTodayClaims(result.claims)
        setUserStats(result.stats)

      } catch (err) {
        console.error('Erreur ou timeout:', err)
        showMessage('Chargement des freedrops indisponible pour le moment', 'error')

        const fallbackInfo = getUserLevelInfo(profile?.total_exp || 0)
        setUserStats({
          level: fallbackInfo.level,
          current_exp: fallbackInfo.currentLevelExp,
          exp_to_next: fallbackInfo.expToNextLevel || 1,
          current_streak: 0,
          longest_streak: 0,
          total_daily_claims: 0
        })
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && isAuthenticated && user?.id) {
      fetchData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.id, profile])

  const calculateBoxRarity = (requiredLevel: number): 'common' | 'rare' | 'epic' | 'legendary' => {
    if (requiredLevel >= 50) return 'legendary'
    if (requiredLevel >= 20) return 'epic'
    if (requiredLevel >= 10) return 'rare'
    return 'common'
  }

  const canOpenBox = (box: DailyBox): boolean => {
    if (!userStats) return false
    const hasLevel = userStats.level >= box.required_level
    const alreadyClaimed = todayClaims.some(claim => claim.daily_box_id === box.id)
    return hasLevel && !alreadyClaimed
  }

  const isBoxClaimed = (box: DailyBox): boolean => {
    return todayClaims.some(claim => claim.daily_box_id === box.id)
  }

  const getRarityGlow = (rarity: string): string => {
    const glows: Record<string, string> = {
      common: '#10b981',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }
    return glows[rarity] || glows.common
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: pageBg }}>
        <LoadingState size="lg" text="Chargement des freedrops..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const claimedCount = todayClaims.length
  const availableCount = boxes.filter(b => canOpenBox(b)).length

  return (
    <div className="min-h-screen -mt-[80px] pt-[80px] pb-24 lg:pb-8 transition-colors duration-300 relative overflow-hidden" style={{ background: pageBg }}>
      {/* CSS Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{
          background: isDark
            ? 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(59,130,246,0.05) 0%, transparent 60%), radial-gradient(ellipse 100% 60% at 80% 50%, rgba(168,85,247,0.03) 0%, transparent 50%), radial-gradient(ellipse 80% 50% at 20% 80%, rgba(16,185,129,0.02) 0%, transparent 50%)'
            : 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(59,130,246,0.03) 0%, transparent 50%)'
        }} />
        <div className="absolute inset-0" style={{
          background: isDark
            ? 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.2) 100%)'
            : 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 50%, rgba(0,0,0,0.03) 100%)'
        }} />
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium"
            style={{
              background: 'rgba(239,68,68,0.15)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(12px)'
            }}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-xs font-medium"
            style={{
              background: 'rgba(16,185,129,0.15)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.2)', backdropFilter: 'blur(12px)'
            }}
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full">
        {/* === FREEDROP DROPS FEED === */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full px-4 sm:px-6 lg:px-12 pt-6 pb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-medium uppercase" style={{
                letterSpacing: '0.2em',
                color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
              }}>
                Freedrop Drops
              </h2>
              <div className="relative flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              </div>
            </div>

            {/* Timer badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            }}>
              <Timer size={13} style={{
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
              }} />
              <span className="text-[10px] font-medium hidden sm:inline" style={{
                color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
              }}>
                Reset
              </span>
              <span className="text-xs font-bold tabular-nums" style={{
                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
              }}>
                {timeToMidnight}
              </span>
            </div>
          </div>
          <DropsFeed className="" />
        </motion.div>

        <GradientSeparator isDark={isDark} />

        {/* === STATS ROW === */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full px-4 sm:px-6 lg:px-12 pb-2"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {[
                { label: 'NIVEAU', value: userStats.level.toString() },
                { label: 'EXPERIENCE', value: `${userStats.current_exp.toLocaleString()} / ${userStats.exp_to_next.toLocaleString()} XP` },
                { label: 'DISPONIBLES', value: availableCount.toString() },
                { label: 'OUVERTES AUJOURD\'HUI', value: claimedCount.toString() },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-[10px] font-medium uppercase mb-1" style={{
                    letterSpacing: '0.2em',
                    color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                  }}>
                    {stat.label}
                  </div>
                  <div className="text-sm sm:text-base font-bold" style={{
                    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <GradientSeparator isDark={isDark} />

        {/* === CONTENT === */}
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="pb-8">
            {error && boxes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{
                  color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
                }} />
                <h3 className="text-lg font-bold mb-3" style={{
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                }}>
                  Chargement indisponible
                </h3>
                <p className="text-sm mb-6" style={{
                  color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
                }}>
                  Les freedrops seront bientot disponibles. Revenez plus tard.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{ color: '#3b82f6' }}
                >
                  Reessayer
                </button>
              </motion.div>
            ) : boxes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Package className="h-12 w-12 mx-auto mb-4" style={{
                  color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
                }} />
                <h3 className="text-lg font-bold mb-3" style={{
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                }}>
                  Freedrops en preparation
                </h3>
                <p className="text-sm mb-6" style={{
                  color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
                }}>
                  Les administrateurs n&apos;ont pas encore configure de freedrops quotidiennes.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 sm:gap-10 lg:gap-14">
                {boxes.map((box, index) => (
                  <FreedropBoxCard
                    key={box.id}
                    box={box}
                    index={index}
                    userStats={userStats}
                    canOpen={canOpenBox(box)}
                    isClaimed={isBoxClaimed(box)}
                    getRarityGlow={getRarityGlow}
                    isDark={isDark}
                    router={router}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// === FREEDROP BOX CARD ===

interface FreedropBoxCardProps {
  box: DailyBox
  index: number
  userStats: UserStats | null
  canOpen: boolean
  isClaimed: boolean
  getRarityGlow: (rarity: string) => string
  isDark: boolean
  router: any
}

function FreedropBoxCard({ box, index, userStats, canOpen, isClaimed, getRarityGlow, isDark, router }: FreedropBoxCardProps) {
  const glowColor = getRarityGlow(box.rarity)
  const isLocked = !userStats || userStats.level < box.required_level
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.6), ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={canOpen ? { y: -8, scale: 1.03 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group ${canOpen ? 'cursor-pointer' : isLocked ? 'cursor-not-allowed' : ''}`}
      onClick={() => canOpen && router.push(`/freedrop/${box.id}`)}
    >
      <div className="relative">
        {/* Badges */}
        <div className="absolute -top-1.5 -right-1.5 z-20 flex flex-col gap-1">
          {/* Level badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + index * 0.03 }}
            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase text-white"
            style={{
              background: isLocked
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : isClaimed
                ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                : `linear-gradient(135deg, ${glowColor}, ${glowColor}dd)`,
              boxShadow: isLocked
                ? '0 2px 8px rgba(239,68,68,0.3)'
                : isClaimed
                ? '0 2px 8px rgba(107,114,128,0.3)'
                : `0 2px 8px ${glowColor}40`,
              letterSpacing: '0.05em',
            }}
          >
            LVL {box.required_level}
          </motion.div>

          {/* Claimed badge */}
          {isClaimed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35 + index * 0.03 }}
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
                letterSpacing: '0.05em',
              }}
            >
              <CheckCircle size={8} />
              Claimed
            </motion.div>
          )}
        </div>

        {/* Glow on hover */}
        <motion.div
          className="absolute -inset-2 rounded-2xl blur-xl -z-10"
          animate={{ opacity: isHovered && canOpen ? 0.15 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ backgroundColor: glowColor }}
        />

        {/* Box image */}
        <div className="relative mb-3">
          <motion.img
            src={box.image_url}
            alt={box.name}
            className="w-full h-36 sm:h-44 object-contain"
            animate={{
              filter: isHovered && canOpen
                ? `drop-shadow(0 15px 30px ${glowColor}30) brightness(1.08)`
                : isClaimed || isLocked
                ? 'drop-shadow(0 5px 15px rgba(0,0,0,0.1)) brightness(0.7) grayscale(0.4)'
                : 'drop-shadow(0 5px 15px rgba(0,0,0,0.1)) brightness(1)'
            }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPg=='
            }}
          />

          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(4px)',
              }}>
                <Lock size={18} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center px-1">
          <h3 className="text-sm sm:text-base font-bold truncate mb-1" style={{
            color: isClaimed || isLocked
              ? isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
              : isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)'
          }}>
            {box.name}
          </h3>

          {/* FREE label + rarity */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Gift size={12} style={{
                color: canOpen ? glowColor : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
              }} />
              <span className="text-[10px] font-bold uppercase" style={{
                letterSpacing: '0.1em',
                color: canOpen ? glowColor : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
              }}>
                FREE
              </span>
            </div>
            <span className="text-[10px]" style={{
              color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }}>·</span>
            <span className="text-[10px] font-medium capitalize" style={{
              color: canOpen ? glowColor : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
            }}>
              {box.rarity}
            </span>
          </div>

          {/* Hover action */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase" style={{
              letterSpacing: '0.1em',
              ...(canOpen ? {
                background: `${glowColor}15`,
                color: glowColor,
                border: `1px solid ${glowColor}25`,
              } : isLocked ? {
                background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.12)',
              } : {
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
              }),
            }}>
              {canOpen ? (
                <>
                  <ArrowRight size={10} />
                  Ouvrir
                </>
              ) : isLocked ? (
                <>
                  <Lock size={9} />
                  Niveau {box.required_level} requis
                </>
              ) : (
                <>
                  <CheckCircle size={9} />
                  Deja reclamee
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
