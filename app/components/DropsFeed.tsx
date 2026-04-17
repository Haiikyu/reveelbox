// DropsFeed.tsx - Feed horizontal en une seule ligne (mode box-specific ou global)
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import { sanitizeSvg } from '@/utils/sanitizeSvg'

interface DropItem {
  id: string
  user_id: string
  username: string
  avatar_url: string | null
  item_name: string
  item_image: string
  item_value: number
  item_rarity: string
  opened_at: string
  box_name?: string
  box_image_url?: string
}

interface DropsFeedProps {
  boxId?: string
  boxImageUrl?: string
  className?: string
}

const rarityColors: Record<string, string> = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b'
}

export function DropsFeed({ boxId, boxImageUrl, className = '' }: DropsFeedProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const isGlobal = !boxId
  const [activeTab, setActiveTab] = useState<'best' | 'recent'>('best')
  const [drops, setDrops] = useState<DropItem[]>([])
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState<Map<string, string>>(new Map())
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab

  // Fetch un drop individuel par son ID et l'ajouter au state
  const fetchAndAddDrop = useCallback(async (newId: string) => {
    try {
      const selectFields = isGlobal
        ? `id, user_id, obtained_at, box_id,
           items!inner (id, name, image_url, market_value, rarity),
           profiles!inner (username, avatar_url),
           loot_boxes!inner (name, image_url)`
        : `id, user_id, obtained_at,
           items!inner (id, name, image_url, market_value, rarity),
           profiles!inner (username, avatar_url)`

      const { data, error } = await supabase
        .from('user_inventory')
        .select(selectFields)
        .eq('id', newId)
        .single()

      if (error || !data) return

      const item: any = data
      const newDrop: DropItem = {
        id: item.id,
        user_id: item.user_id,
        username: item.profiles?.username || 'Anonymous',
        avatar_url: item.profiles?.avatar_url || null,
        item_name: item.items?.name || 'Unknown Item',
        item_image: item.items?.image_url || '',
        item_value: item.items?.market_value || 0,
        item_rarity: item.items?.rarity || 'common',
        opened_at: item.obtained_at,
        box_name: item.loot_boxes?.name || undefined,
        box_image_url: item.loot_boxes?.image_url || undefined,
      }

      setDrops(prev => {
        // Eviter les doublons
        if (prev.some(d => d.id === newDrop.id)) return prev

        const updated = [newDrop, ...prev]

        // Re-trier selon le tab actif
        updated.sort((a, b) => {
          if (activeTabRef.current === 'best') {
            return b.item_value - a.item_value
          }
          return new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
        })

        return updated.slice(0, 30)
      })

      // Scroll to start pour montrer le nouveau drop en mode recent
      if (activeTabRef.current === 'recent' && scrollRef.current) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
      }
    } catch {
      // Silent
    }
  }, [isGlobal, supabase])

  // Initial load
  useEffect(() => {
    loadDrops()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxId, activeTab])

  // Realtime subscription (independant du tab pour ne pas re-subscribe)
  useEffect(() => {
    const channelName = isGlobal ? 'global_drops' : `box_drops_${boxId}`

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_inventory',
        ...(boxId ? { filter: `box_id=eq.${boxId}` } : {})
      }, (payload) => {
        // Fetch le nouveau drop et l'ajouter visuellement
        if (payload.new?.id) {
          fetchAndAddDrop(payload.new.id as string)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxId, fetchAndAddDrop])

  const loadDrops = async () => {
    setLoading(true)
    try {
      // Build query based on mode
      const selectFields = isGlobal
        ? `
          id,
          user_id,
          obtained_at,
          box_id,
          items!inner (
            id,
            name,
            image_url,
            market_value,
            rarity
          ),
          profiles!inner (
            username,
            avatar_url
          ),
          loot_boxes!inner (
            name,
            image_url
          )
        `
        : `
          id,
          user_id,
          obtained_at,
          items!inner (
            id,
            name,
            image_url,
            market_value,
            rarity
          ),
          profiles!inner (
            username,
            avatar_url
          )
        `

      let query = supabase
        .from('user_inventory')
        .select(selectFields)
        .not('box_id', 'is', null)
        .order('obtained_at', { ascending: false })
        .limit(50)

      if (boxId) {
        query = query.eq('box_id', boxId)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedDrops: DropItem[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        username: item.profiles?.username || 'Anonymous',
        avatar_url: item.profiles?.avatar_url || null,
        item_name: item.items?.name || 'Unknown Item',
        item_image: item.items?.image_url || '',
        item_value: item.items?.market_value || 0,
        item_rarity: item.items?.rarity || 'common',
        opened_at: item.obtained_at,
        box_name: item.loot_boxes?.name || undefined,
        box_image_url: item.loot_boxes?.image_url || undefined,
      }))

      const sortedDrops = formattedDrops.sort((a, b) => {
        if (activeTab === 'best') {
          return b.item_value - a.item_value
        } else {
          return new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
        }
      }).slice(0, 30)

      setDrops(sortedDrops)

      // Fetch bannieres equipees des joueurs uniques
      const uniqueUserIds = [...new Set(formattedDrops.map(d => d.user_id))]
      if (uniqueUserIds.length > 0) {
        try {
          const { data: bannerData } = await supabase
            .from('user_banners')
            .select('user_id, banner_id, shop_banners(svg_code, image_url)')
            .in('user_id', uniqueUserIds)
            .eq('is_equipped', true)

          if (bannerData && bannerData.length > 0) {
            const bannerMap = new Map<string, string>()
            bannerData.forEach((b: any) => {
              const url = b.shop_banners?.image_url || b.shop_banners?.svg_code
              if (url) bannerMap.set(b.user_id, url)
            })
            setBanners(bannerMap)
          }
        } catch {
          // Silent - banners are optional
        }
      }
    } catch (error) {
      console.error('Error loading drops:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      {/* Tabs */}
      <div className="flex items-center justify-center gap-6 mb-5">
        {(['best', 'recent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative pb-2 transition-all"
            style={{
              color: activeTab === tab
                ? isDark ? '#F5F0E8' : 'rgba(0, 0, 0, 0.9)'
                : isDark ? '#969087' : 'rgba(0, 0, 0, 0.3)'
            }}
          >
            <span className="text-xs font-medium uppercase tracking-[0.2em]">
              {tab === 'best' ? 'Best Drops' : 'Recent Drops'}
            </span>
            {activeTab === tab && (
              <motion.div
                layoutId={isGlobal ? 'globalDropTab' : 'dropTab'}
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: isDark ? 'rgba(255,240,220,0.15)' : 'rgba(0,0,0,0.15)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Ligne horizontale scrollable */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs uppercase tracking-[0.15em]" style={{
            color: isDark ? '#6D675F' : 'rgba(0, 0, 0, 0.2)'
          }}>
            Aucun drop pour le moment
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{
            background: isDark
              ? 'linear-gradient(to right, #0C1220, transparent)'
              : 'linear-gradient(to right, #fafafa, transparent)'
          }} />
          <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{
            background: isDark
              ? 'linear-gradient(to left, #0C1220, transparent)'
              : 'linear-gradient(to left, #fafafa, transparent)'
          }} />

          <div
            ref={scrollRef}
            className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <AnimatePresence mode="popLayout">
              {drops.map((drop, index) => {
                const glowColor = rarityColors[drop.item_rarity.toLowerCase()] || rarityColors.common
                const isHovered = hoveredId === drop.id
                const bannerUrl = banners.get(drop.user_id)
                // En mode global, utiliser l'image de la box source depuis le join
                const flipImageUrl = boxImageUrl || drop.box_image_url

                return (
                  <motion.div
                    key={drop.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.015 }}
                    className="flex-shrink-0 relative rounded-lg overflow-hidden cursor-pointer"
                    style={{
                      width: 'clamp(80px, 7vw, 105px)',
                      height: 'clamp(100px, 9vw, 130px)',
                      background: isDark ? 'rgba(255,240,220,0.03)' : 'rgba(0, 0, 0, 0.02)',
                      perspective: '600px',
                    }}
                    onMouseEnter={() => setHoveredId(drop.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Banniere en fond au hover */}
                    {isHovered && bannerUrl && (
                      bannerUrl.startsWith('<') ? (
                        <div
                          className="absolute inset-0 z-0 transition-opacity duration-300 [&>svg]:w-full [&>svg]:h-full"
                          style={{ opacity: 0.3, filter: 'blur(2px)' }}
                          dangerouslySetInnerHTML={{ __html: sanitizeSvg(bannerUrl) }}
                        />
                      ) : (
                        <div
                          className="absolute inset-0 z-0 transition-opacity duration-300"
                          style={{
                            backgroundImage: `url(${bannerUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 0.35,
                            filter: 'blur(2px)',
                          }}
                        />
                      )
                    )}

                    <div className="relative w-full h-full flex flex-col items-center justify-center p-1.5 z-10">
                      {/* Avatar en haut a gauche au hover */}
                      <div
                        className="absolute top-1 left-1 transition-all duration-300"
                        style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'scale(1)' : 'scale(0.5)' }}
                      >
                        {drop.avatar_url ? (
                          <img
                            src={drop.avatar_url}
                            alt={drop.username}
                            className="w-5 h-5 rounded-full object-cover"
                            style={{ border: `1.5px solid ${glowColor}60` }}
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold"
                            style={{
                              background: `${glowColor}20`,
                              border: `1.5px solid ${glowColor}60`,
                              color: glowColor
                            }}
                          >
                            {drop.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Image avec flip au hover (montre l'image de la box) */}
                      <div
                        className="relative mb-1.5 transition-transform duration-300"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isHovered && flipImageUrl ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                      >
                        {/* Face avant : item */}
                        <img
                          src={drop.item_image || 'https://via.placeholder.com/60'}
                          alt={drop.item_name}
                          className="object-contain"
                          style={{
                            width: 'clamp(42px, 5vw, 60px)',
                            height: 'clamp(42px, 5vw, 60px)',
                            backfaceVisibility: 'hidden',
                          }}
                        />
                        {/* Face arriere : image de la box */}
                        {flipImageUrl && (
                          <img
                            src={flipImageUrl}
                            alt="Box"
                            className="absolute inset-0 object-contain"
                            style={{
                              width: 'clamp(42px, 5vw, 60px)',
                              height: 'clamp(42px, 5vw, 60px)',
                              backfaceVisibility: 'hidden',
                              transform: 'rotateY(180deg)',
                            }}
                          />
                        )}
                      </div>

                      {/* Value + coin */}
                      <div className="flex items-center gap-0.5">
                        <img
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png"
                          alt="coin"
                          style={{ width: 10, height: 10, objectFit: 'contain', borderRadius: '50%' }}
                        />
                        <span className="text-[9px] font-semibold" style={{
                          color: isDark ? '#C0B8AD' : 'rgba(0, 0, 0, 0.5)'
                        }}>
                          {drop.item_value >= 1000 ? `${(drop.item_value / 1000).toFixed(1)}k` : drop.item_value.toFixed(0)}
                        </span>
                      </div>

                      {/* Username ou nom de box au hover */}
                      <div
                        className="absolute bottom-0.5 left-0 right-0 text-center transition-opacity duration-200"
                        style={{ opacity: isHovered ? 1 : 0 }}
                      >
                        <span className="text-[7px] font-medium truncate block px-0.5" style={{
                          color: isDark ? '#C0B8AD' : 'rgba(0, 0, 0, 0.45)'
                        }}>
                          {drop.username}
                        </span>
                      </div>

                      {/* Label nom de box en mode global (toujours visible) */}
                      {isGlobal && drop.box_name && !isHovered && (
                        <div className="absolute bottom-0.5 left-0 right-0 text-center">
                          <span className="text-[7px] font-medium truncate block px-0.5" style={{
                            color: isDark ? '#6D675F' : 'rgba(0, 0, 0, 0.2)'
                          }}>
                            {drop.box_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

export default DropsFeed