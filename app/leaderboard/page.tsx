'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useTheme } from '@/app/components/ThemeProvider'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, User, Medal, Trophy, Flame, TrendingUp,
  Zap, Star, Search, RefreshCw, X, Award
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Category = 'xp' | 'level' | 'streak' | 'loyalty'

interface RawPlayer {
  id: string
  username: string | null
  avatar_url: string | null
  total_exp: number | null
  level: number | null
  longest_streak: number | null
  loyalty_points: number | null
  grade: string | null
}

interface LeaderboardPlayer extends RawPlayer {
  rank: number
  value: number
}

interface CategoryConfig {
  label: string
  shortLabel: string
  color: string
  gradient: string
  glow: string
  Icon: React.ComponentType<{ className?: string }>
  getValue: (p: RawPlayer) => number
  format: (v: number) => string
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: Record<Category, CategoryConfig> = {
  xp: {
    label: 'Expérience',
    shortLabel: 'XP',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    glow: 'rgba(59,130,246,0.35)',
    Icon: Zap,
    getValue: p => p.total_exp ?? 0,
    format: v => v >= 1000 ? `${(v / 1000).toFixed(1)}K XP` : `${v} XP`,
  },
  level: {
    label: 'Niveau',
    shortLabel: 'Niv.',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    glow: 'rgba(168,85,247,0.35)',
    Icon: Award,
    getValue: p => p.level ?? 0,
    format: v => `Niv. ${v}`,
  },
  streak: {
    label: 'Streak Record',
    shortLabel: 'Streak',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    glow: 'rgba(239,68,68,0.35)',
    Icon: Flame,
    getValue: p => p.longest_streak ?? 0,
    format: v => `${v} j`,
  },
  loyalty: {
    label: 'Points Loyauté',
    shortLabel: 'Loyauté',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glow: 'rgba(245,158,11,0.35)',
    Icon: Star,
    getValue: p => p.loyalty_points ?? 0,
    format: v => v.toLocaleString('fr-FR'),
  },
}

const RANK_ICONS = [Crown, Medal, Trophy] as const
const RANK_STYLES = [
  { color: '#f59e0b', glow: 'rgba(245,158,11,0.45)', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { color: '#94a3b8', glow: 'rgba(148,163,184,0.35)', bg: 'linear-gradient(135deg, #94a3b8, #64748b)' },
  { color: '#d97706', glow: 'rgba(217,119,6,0.35)',  bg: 'linear-gradient(135deg, #d97706, #b45309)' },
]

const GRADE_STYLES: Record<string, { label: string; color: string }> = {
  bronze:   { label: 'Bronze',   color: '#cd7c2f' },
  silver:   { label: 'Argent',   color: '#9ca3af' },
  gold:     { label: 'Or',       color: '#f59e0b' },
  platinum: { label: 'Platine',  color: '#67e8f9' },
  diamond:  { label: 'Diamant',  color: '#a78bfa' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function PlayerAvatar({ url, name, size }: { url: string | null; name: string | null; size: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt={name ?? ''} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div
          className="h-full w-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          <User className="text-white" style={{ width: size * 0.44, height: size * 0.44 }} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const [rawPlayers, setRawPlayers] = useState<RawPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [category, setCategory] = useState<Category>('xp')
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const isDark = resolvedTheme === 'dark'
  const cat = CATEGORIES[category]

  const cardStyle = {
    background: isDark ? 'rgba(18,28,48,0.95)' : 'rgba(255,255,255,0.95)',
    border: `1px solid ${isDark ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.18)'}`,
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadPlayers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, total_exp, level, longest_streak, loyalty_points, grade')
        .not('username', 'is', null)
        .limit(200)
      if (error) throw error
      setRawPlayers(data ?? [])
    } catch (err) {
      console.error('Erreur leaderboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadPlayers() }, [])

  // ── Derived data ──────────────────────────────────────────────────────────
  const allRanked: LeaderboardPlayer[] = useMemo(() => {
    return [...rawPlayers]
      .sort((a, b) => cat.getValue(b) - cat.getValue(a))
      .map((p, i) => ({ ...p, rank: i + 1, value: cat.getValue(p) }))
  }, [rawPlayers, category])

  const filtered: LeaderboardPlayer[] = useMemo(() => {
    if (!search.trim()) return allRanked
    const q = search.toLowerCase()
    return allRanked.filter(p => p.username?.toLowerCase().includes(q))
  }, [allRanked, search])

  const top3 = allRanked.slice(0, 3)
  const listPlayers = search ? filtered : allRanked.slice(3)
  const currentUser = allRanked.find(p => p.id === user?.id)
  const maxValue = allRanked[0]?.value || 1

  const avg10 = allRanked.length
    ? Math.round(allRanked.slice(0, 10).reduce((s, p) => s + p.value, 0) / Math.min(10, allRanked.length))
    : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen -mt-[80px] pt-[100px] pb-24 lg:pb-8 transition-colors relative overflow-hidden"
      style={{ background: isDark ? '#0C1220' : '#f1f5f9' }}>

      {/* ── Background ──────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {isDark && (
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.015,
            backgroundImage: 'radial-gradient(rgba(59,130,246,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
        )}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-1.5"
                style={{ color: isDark ? 'rgba(59,130,246,0.7)' : 'rgba(59,130,246,0.8)' }}>
                ReveelBox
              </p>
              <div className="flex items-center gap-3">
                <motion.div
                  key={category}
                  initial={{ rotate: -12, scale: 0.85 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.gradient, boxShadow: `0 4px 16px ${cat.glow}` }}
                >
                  <Crown className="h-5 w-5 text-white" />
                </motion.div>
                <h1 className="text-4xl sm:text-5xl font-black"
                  style={{ color: isDark ? '#e2e8f0' : 'rgba(0,0,0,0.88)' }}>
                  Classement
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                Top 200 · {cat.label}
              </p>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                Live
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Category tabs ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 justify-center flex-wrap mb-6"
        >
          {(Object.entries(CATEGORIES) as [Category, CategoryConfig][]).map(([key, cfg]) => {
            const Icon = cfg.Icon
            const active = category === key
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active ? cfg.gradient : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)'),
                  border: `1px solid ${active ? cfg.color + '50' : (isDark ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.2)')}`,
                  color: active ? 'white' : (isDark ? '#94a3b8' : '#64748b'),
                  boxShadow: active ? `0 4px 18px ${cfg.glow}` : 'none',
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cfg.label}</span>
                <span className="sm:hidden">{cfg.shortLabel}</span>
              </button>
            )
          })}
        </motion.div>

        {/* ── Global stats ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!loading && allRanked.length > 0 && (
            <motion.div
              key={category + '-stats'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.08 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              {[
                { label: 'Joueurs classés', value: allRanked.length.toString(), Icon: User },
                { label: 'Record absolu',   value: cat.format(maxValue),        Icon: Crown },
                { label: 'Moyenne top 10',  value: cat.format(avg10),           Icon: TrendingUp },
              ].map(({ label, value, Icon }, i) => (
                <div key={i} className="rounded-2xl p-3 sm:p-4 text-center" style={cardStyle}>
                  <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: cat.color }} />
                  <p className="text-sm sm:text-xl font-black text-gray-900 dark:text-white truncate">{value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Your rank banner ────────────────────────────────────────────── */}
        <AnimatePresence>
          {user && currentUser && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(30,41,59,0.95))'
                  : 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(255,255,255,0.98))',
                border: '1px solid rgba(59,130,246,0.25)',
              }}
            >
              <PlayerAvatar url={currentUser.avatar_url} name={currentUser.username} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Votre position — {cat.label}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex-shrink-0">
                    #{currentUser.rank}
                  </span>
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((currentUser.value / maxValue) * 100, 100)}%` }}
                      transition={{ duration: 1.1, ease: 'easeOut', delay: 0.35 }}
                      className="h-full rounded-full"
                      style={{ background: cat.gradient }}
                    />
                  </div>
                  <span className="text-sm font-black flex-shrink-0" style={{ color: cat.color }}>
                    {cat.format(currentUser.value)}
                  </span>
                </div>
              </div>
              {currentUser.rank > 1 && (
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Écart avec #1</p>
                  <p className="text-sm font-black" style={{ color: cat.color }}>
                    +{cat.format(maxValue - currentUser.value)}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search + Refresh ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="flex gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un joueur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.25)'}`,
                color: isDark ? '#f1f5f9' : '#0f172a',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => loadPlayers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.25)'}`,
              color: isDark ? '#94a3b8' : '#64748b',
            }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </motion.div>

        {/* ── Podium Top 3 ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!loading && !search && top3.length >= 3 && (
            <motion.div
              key={category + '-podium'}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-3 gap-3 sm:gap-5 mb-8"
            >
              {/* Order: 2nd, 1st, 3rd */}
              {([top3[1], top3[0], top3[2]] as LeaderboardPlayer[]).map((player, idx) => {
                const rankIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2   // 0-based for arrays
                const rank1Based = rankIdx + 1
                const rs = RANK_STYLES[rankIdx]
                const RankIcon = RANK_ICONS[rankIdx]
                const isCenter = idx === 1
                const pct = (player.value / maxValue) * 100

                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 36 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.08, type: 'spring', stiffness: 200, damping: 24 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`rounded-[28px] p-4 sm:p-5 text-center relative overflow-hidden ${isCenter ? '' : 'mt-6 sm:mt-8'}`}
                    style={{
                      background: isDark
                        ? 'linear-gradient(160deg, rgba(30,41,59,0.98), rgba(15,23,42,0.92))'
                        : 'linear-gradient(160deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
                      border: `1px solid ${rs.color}35`,
                      boxShadow: isCenter
                        ? `0 20px 70px ${rs.glow}, 0 4px 20px rgba(0,0,0,0.22)`
                        : `0 6px 30px rgba(0,0,0,${isDark ? '0.3' : '0.07'})`,
                    }}
                  >
                    {/* Rank color splash background */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: `radial-gradient(ellipse 110% 55% at 50% 0%, ${rs.color}12, transparent 65%)`
                    }} />
                    {/* Floating crown for #1 */}
                    {isCenter && (
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                        className="absolute -top-5 left-1/2 -translate-x-1/2"
                      >
                        <Crown
                          className="h-7 w-7"
                          style={{ color: rs.color, filter: `drop-shadow(0 2px 8px ${rs.color})` }}
                        />
                      </motion.div>
                    )}

                    {/* Rank badge */}
                    <div
                      className="mx-auto mb-3 w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ background: rs.bg, boxShadow: `0 4px 14px ${rs.glow}` }}
                    >
                      <RankIcon className="h-5 w-5" />
                    </div>

                    {/* Avatar */}
                    <div
                      className="mx-auto mb-3 rounded-2xl overflow-hidden"
                      style={{
                        width: isCenter ? 80 : 60,
                        height: isCenter ? 80 : 60,
                        border: `2.5px solid ${rs.color}50`,
                        boxShadow: isCenter ? `0 0 28px ${rs.glow}` : 'none',
                      }}
                    >
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.username ?? ''} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                          <User className="text-white" style={{ width: isCenter ? 36 : 28, height: isCenter ? 36 : 28 }} />
                        </div>
                      )}
                    </div>

                    <h3 className={`font-black text-gray-900 dark:text-white truncate mb-0.5 ${isCenter ? 'text-base sm:text-lg' : 'text-sm'}`}>
                      {player.username}
                    </h3>
                    <p className="text-[11px] text-gray-400 mb-2.5">Niv. {player.level ?? 0}</p>

                    <div className="font-black" style={{ color: cat.color, fontSize: isCenter ? '1.1rem' : '0.875rem' }}>
                      {cat.format(player.value)}
                    </div>

                    {/* Progress vs #1 */}
                    {rank1Based !== 1 && (
                      <div
                        className="mt-2.5 h-1 rounded-full overflow-hidden"
                        style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                      >
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.gradient }} />
                      </div>
                    )}

                    {/* "Vous" tag */}
                    {player.id === user?.id && (
                      <div
                        className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                      >
                        Vous
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Player list ─────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          {loading ? (
            <div className="text-center py-20">
              <div
                className="animate-spin rounded-full h-10 w-10 border-[3px] mx-auto mb-4"
                style={{ borderColor: cat.color, borderTopColor: 'transparent' }}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement du classement…</p>
            </div>
          ) : listPlayers.length === 0 ? (
            <div className="text-center py-16 rounded-[28px]" style={cardStyle}>
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-bold text-gray-500 dark:text-gray-400">
                {search
                  ? `Aucun résultat pour « ${search} »`
                  : 'Aucun joueur classé pour le moment'}
              </p>
            </div>
          ) : (
            listPlayers.map((player, index) => {
              const isYou = player.id === user?.id
              const isTop10 = player.rank <= 10
              const pct = Math.min((player.value / maxValue) * 100, 100)
              const gradeInfo = player.grade ? GRADE_STYLES[player.grade] : null

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: search ? 0 : Math.min(0.25 + index * 0.012, 0.8), duration: 0.35 }}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className="rounded-2xl px-4 sm:px-5 py-3.5 flex items-center gap-3 sm:gap-4"
                  style={{
                    background: isYou
                      ? (isDark
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.13), rgba(30,41,59,0.96))'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.07), rgba(255,255,255,0.98))')
                      : cardStyle.background,
                    border: `1px solid ${
                      isYou ? 'rgba(59,130,246,0.3)'
                      : isTop10 ? cat.color + '22'
                      : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(148,163,184,0.18)')
                    }`,
                  }}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    {isTop10 ? (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                        style={{ background: cat.gradient, boxShadow: `0 2px 10px ${cat.glow}` }}
                      >
                        #{player.rank}
                      </div>
                    ) : (
                      <span className="text-sm font-black text-gray-400 dark:text-gray-500">
                        #{player.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 h-11 w-11 rounded-xl overflow-hidden"
                    style={{
                      border: `1px solid ${
                        isTop10 ? cat.color + '30'
                        : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(148,163,184,0.2)')
                      }`,
                    }}
                  >
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.username ?? ''} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name + progress bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                        {player.username}
                      </span>
                      {gradeInfo && (
                        <span
                          className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0"
                          style={{ color: gradeInfo.color, background: gradeInfo.color + '18' }}
                        >
                          {gradeInfo.label}
                        </span>
                      )}
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: isTop10
                            ? cat.gradient
                            : (isDark ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.4)'),
                        }}
                      />
                    </div>
                  </div>

                  {/* Level badge */}
                  <div
                    className="flex-shrink-0 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                  >
                    <Zap className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Niv.{player.level ?? 0}</span>
                  </div>

                  {/* Value */}
                  <span
                    className="flex-shrink-0 text-sm sm:text-base font-black"
                    style={{ color: isTop10 ? cat.color : (isDark ? '#94a3b8' : '#475569') }}
                  >
                    {cat.format(player.value)}
                  </span>

                  {/* "Vous" badge */}
                  {isYou && (
                    <div
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                    >
                      Vous
                    </div>
                  )}
                </motion.div>
              )
            })
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {!loading && listPlayers.length > 0 && !search && (
          <div className="text-center mt-8 pb-2">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Top 200 joueurs · Classement recalculé à chaque rechargement
            </p>
            <p className="text-[11px] mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.2)' }}>
              Participez à l&apos;aventure — ouvrez des boxes pour monter dans le classement
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
