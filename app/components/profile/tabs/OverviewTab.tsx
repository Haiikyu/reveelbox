'use client'

import { motion } from 'framer-motion'
import { Box, Swords, Target, Package, Flame, Crown, Calendar, Lock, TrendingUp } from 'lucide-react'
import { RARITY_COLORS } from '@/app/types/profile'
import type { UserStats } from '@/app/types/profile'
import type { Achievement } from '@/app/types/profile'

interface OverviewTabProps {
  stats: UserStats
  recentItems: any[]
  achievements: Achievement[]
  memberSince: string | null
  isOwnProfile: boolean
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
})

const RARITY_GLOW_COLORS: Record<string, string> = {
  common:    'rgba(156,163,175,0.15)',
  rare:      'rgba(59,130,246,0.2)',
  epic:      'rgba(168,85,247,0.2)',
  legendary: 'rgba(245,158,11,0.25)',
  mythic:    'rgba(239,68,68,0.25)',
}

const RARITY_BORDER: Record<string, string> = {
  common:    'rgba(156,163,175,0.15)',
  rare:      'rgba(59,130,246,0.25)',
  epic:      'rgba(168,85,247,0.25)',
  legendary: 'rgba(245,158,11,0.3)',
  mythic:    'rgba(239,68,68,0.35)',
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  boxes:      { label: 'Boxes',      color: '#4578be', bg: 'rgba(69,120,190,0.08)' },
  battles:    { label: 'Battles',    color: '#a855f7', bg: 'rgba(168,85,247,0.08)' },
  streak:     { label: 'Connexion',  color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
  collection: { label: 'Collection', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  social:     { label: 'Social',     color: '#ec4899', bg: 'rgba(236,72,153,0.08)' },
  spending:   { label: 'Dépenses',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
}

const CATEGORY_ORDER = ['boxes', 'battles', 'streak', 'collection', 'social', 'spending']

export default function OverviewTab({ stats, recentItems, achievements, memberSince, isOwnProfile }: OverviewTabProps) {
  const joinDate = memberSince ? new Date(memberSince) : null

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    config: CATEGORY_CONFIG[cat] || { label: cat, color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
    items: achievements.filter(a => a.category === cat),
  })).filter(g => g.items.length > 0)

  const unlockedCount = achievements.filter(a => a.unlocked).length

  const KEY_STATS = [
    { value: stats.totalBoxesOpened, label: 'Boxes ouvertes', icon: Box,     color: '#4578be', glow: 'rgba(69,120,190,0.15)' },
    { value: stats.battlesPlayed,    label: 'Battles jouées', icon: Swords,  color: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
    { value: `${stats.battleWinRate.toFixed(0)}%`, label: 'Win rate', icon: Target, color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
    { value: stats.inventoryCount,   label: 'Objets',         icon: Package, color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  ]

  return (
    <div className="space-y-14">

      {/* ── Key numbers — Cards glassmorphism ───────────── */}
      <motion.section {...fade(0)}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {KEY_STATS.map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                {...fade(i * 0.06)}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative rounded-2xl p-5 overflow-hidden"
                style={{
                  background: 'rgba(8,13,26,0.80)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {/* Color accent bottom bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl"
                  style={{ background: `linear-gradient(90deg, ${item.color}80, ${item.color}30)` }}
                />
                {/* Subtle glow */}
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at 20% 80%, ${item.glow}, transparent 60%)` }}
                />

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${item.color}18` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  </div>
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium leading-tight">{item.label}</span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  {item.value}
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* ── Showcase — Recent items ────────────────────── */}
      {recentItems.length > 0 && (
        <motion.section {...fade(0.18)}>
          <h2 className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold mb-5">
            Derniers objets
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {recentItems.slice(0, 5).map((item: any) => {
              const rarity = item.items?.rarity || 'common'
              const glowColor = RARITY_GLOW_COLORS[rarity] || RARITY_GLOW_COLORS.common
              const borderColor = RARITY_BORDER[rarity] || RARITY_BORDER.common
              const rarityColor = rarity === 'common' ? '#6b7280' : rarity === 'rare' ? '#3b82f6' : rarity === 'epic' ? '#a855f7' : rarity === 'legendary' ? '#f59e0b' : '#ef4444'
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group relative"
                >
                  <div
                    className="rounded-xl overflow-hidden flex items-center justify-center"
                    style={{
                      background: 'rgba(10,14,28,0.7)',
                      border: `1px solid ${borderColor}`,
                      boxShadow: `0 4px 16px ${glowColor}`,
                      height: '120px',
                    }}
                  >
                    {item.items?.image_url ? (
                      <img
                        src={item.items.image_url}
                        alt={item.items.name || ''}
                        className="max-w-full max-h-full w-auto h-auto object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        style={{ maxHeight: '112px' }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${RARITY_COLORS[rarity]} opacity-20`} />
                    )}
                    {/* Rarity bottom glow line */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl"
                      style={{ background: `linear-gradient(90deg, ${rarityColor}80, transparent)` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 truncate font-medium">{item.items?.name}</p>
                  <p
                    className="text-[10px] capitalize font-semibold"
                    style={{ color: rarityColor }}
                  >
                    {rarity}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      )}

      {/* ── Performance strip ─────────────────────────── */}
      {stats.battlesPlayed > 0 && (
        <motion.section {...fade(0.28)}>
          <h2 className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold mb-5">
            Performance battles
          </h2>
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(8,13,26,0.80)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center gap-8 sm:gap-12 mb-5">
              <div>
                <p className="text-3xl font-black text-emerald-400">{stats.battlesWon}</p>
                <p className="text-xs text-gray-500 mt-1">Victoires</p>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.battleWinRate}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  />
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">{stats.battleWinRate.toFixed(1)}% win rate</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-red-400/70">{stats.battlesLost}</p>
                <p className="text-xs text-gray-500 mt-1">Défaites</p>
              </div>
            </div>
            <div
              className="flex items-center gap-6 pt-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-white font-bold">{stats.currentWinStreak}</span>
                <span className="text-xs text-gray-500">streak actuel</span>
              </div>
              <div className="h-3 w-px bg-white/[0.06]" />
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-400/80" />
                <span className="text-sm text-white font-bold">{stats.longestWinStreak}</span>
                <span className="text-xs text-gray-500">record</span>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Best item ─────────────────────────────────── */}
      {stats.mostExpensiveItem?.items && (
        <motion.section {...fade(0.33)}>
          <h2 className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold mb-5">
            Meilleur objet
          </h2>
          {(() => {
            const rarity = stats.mostExpensiveItem.items.rarity || 'common'
            const glowColor = RARITY_GLOW_COLORS[rarity] || RARITY_GLOW_COLORS.common
            const borderColor = RARITY_BORDER[rarity] || RARITY_BORDER.common
            return (
              <div
                className="inline-flex items-center gap-5 rounded-2xl p-4 pr-6"
                style={{
                  background: 'rgba(8,13,26,0.80)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${borderColor}`,
                  boxShadow: `0 4px 24px ${glowColor}`,
                }}
              >
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {stats.mostExpensiveItem.items.image_url ? (
                    <img src={stats.mostExpensiveItem.items.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white/10" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{stats.mostExpensiveItem.items.name}</p>
                  <p
                    className="text-xs capitalize font-semibold mt-0.5"
                    style={{ color: rarity === 'common' ? '#6b7280' : rarity === 'rare' ? '#3b82f6' : rarity === 'epic' ? '#a855f7' : rarity === 'legendary' ? '#f59e0b' : '#ef4444' }}
                  >
                    {rarity}
                  </p>
                  <p className="text-sm font-black text-[#4578be] mt-2">
                    {(stats.mostExpensiveItem.items.market_value || 0).toFixed(2)} coins
                  </p>
                </div>
              </div>
            )
          })()}
        </motion.section>
      )}

      {/* ── Achievements — Full grid ──────────────────── */}
      <motion.section {...fade(0.38)}>
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-[11px] text-gray-500 uppercase tracking-[0.2em] font-semibold">
            Succès
          </h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-16 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4578be] to-[#5989d8]"
                style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">
              <span className="text-white font-bold">{unlockedCount}</span>
              <span className="mx-1 text-gray-700">/</span>
              {achievements.length}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1.5 h-4 rounded-full"
                  style={{ background: group.config.color }}
                />
                <h3 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: group.config.color }}>
                  {group.config.label}
                </h3>
                <span className="text-[10px] text-gray-700 ml-auto">
                  {group.items.filter(a => a.unlocked).length}/{group.items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {group.items.map((a, idx) => {
                  const pct = Math.min((a.progress / a.target) * 100, 100)
                  const color = group.config.color
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: a.unlocked ? 0.92 : 1, y: 8 }}
                      animate={a.unlocked ? {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        boxShadow: [`0 0 0px transparent`, `0 0 18px ${color}40`, `0 0 0px transparent`],
                      } : { opacity: 1, y: 0 }}
                      transition={a.unlocked ? {
                        opacity: { type: 'spring', stiffness: 200, damping: 18, delay: idx * 0.04 },
                        scale: { type: 'spring', stiffness: 200, damping: 18, delay: idx * 0.04 },
                        y: { type: 'spring', stiffness: 200, damping: 18, delay: idx * 0.04 },
                        boxShadow: { repeat: Infinity, duration: 3, delay: idx * 0.2, ease: 'easeInOut' },
                      } : { delay: idx * 0.04, duration: 0.35 }}
                      whileHover={{ y: -2 }}
                      className="relative rounded-xl p-4 overflow-hidden"
                      style={{
                        background: a.unlocked ? group.config.bg : 'rgba(255,255,255,0.015)',
                        border: `1px solid ${a.unlocked ? `${color}20` : 'rgba(255,255,255,0.04)'}`,
                      }}
                    >
                      {/* Shine sweep pour les succès débloqués */}
                      {a.unlocked && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                          }}
                          animate={{ x: ['-150%', '250%'] }}
                          transition={{ repeat: Infinity, repeatDelay: 5, duration: 1.2, ease: 'easeInOut', delay: idx * 0.3 }}
                        />
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl flex-shrink-0 ${a.unlocked ? '' : 'grayscale opacity-30'}`}>
                          {a.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${a.unlocked ? 'text-white' : 'text-gray-600'}`}>
                              {a.name}
                            </p>
                            {!a.unlocked && <Lock className="w-3 h-3 text-gray-700 flex-shrink-0" />}
                          </div>
                          <p className={`text-[11px] mt-0.5 ${a.unlocked ? 'text-gray-400' : 'text-gray-700'}`}>
                            {a.description}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-gray-700 tabular-nums">
                            {a.progress} / {a.target}
                          </span>
                          <span
                            className="text-[10px] font-bold tabular-nums"
                            style={{ color: a.unlocked ? group.config.color : '#4b5563' }}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + idx * 0.02 }}
                            className="h-full rounded-full"
                            style={{
                              background: a.unlocked
                                ? `linear-gradient(90deg, ${group.config.color}cc, ${group.config.color}80)`
                                : 'rgba(75,85,99,0.4)',
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Member since ──────────────────────────────── */}
      {joinDate && (
        <motion.section {...fade(0.45)}>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">
              Membre depuis {joinDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </motion.section>
      )}
    </div>
  )
}
