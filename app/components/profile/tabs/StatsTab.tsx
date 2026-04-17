'use client'

import { motion } from 'framer-motion'
import { Box, Swords, TrendingUp, Wallet } from 'lucide-react'
import type { UserStats } from '@/app/types/profile'

interface StatsTabProps {
  stats: UserStats
  isOwnProfile: boolean
}

interface StatCardProps {
  label: string
  value: string | number
  accent?: boolean
  highlight?: string
  delay?: number
}

function StatRow({ label, value, accent = false, highlight, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-baseline justify-between py-3"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
    >
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: highlight || (accent ? '#4578be' : '#ffffff') }}
      >
        {value}
      </span>
    </motion.div>
  )
}

interface SectionCardProps {
  title: string
  icon: React.ElementType
  color: string
  children: React.ReactNode
  delay?: number
}

function SectionCard({ title, icon: Icon, color, children, delay = 0 }: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'rgba(8,13,26,0.80)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Accent glow top-left */}
      <div
        className="absolute top-0 left-0 w-32 h-32 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at 0% 0%, ${color}12, transparent 70%)` }}
      />
      {/* Top border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, ${color}50, transparent 60%)` }}
      />

      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h3 className="text-xs uppercase tracking-[0.18em] font-semibold" style={{ color }}>
          {title}
        </h3>
      </div>

      <div>{children}</div>
    </motion.section>
  )
}

export default function StatsTab({ stats, isOwnProfile }: StatsTabProps) {
  let idx = 0
  const d = () => (idx++) * 0.025

  const netBalance = stats.totalCoinsEarned - stats.totalCoinsSpent
  const netColor = netBalance >= 0 ? '#10b981' : '#ef4444'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Boxes & Objets */}
      <SectionCard title="Boxes & Objets" icon={Box} color="#4578be" delay={0}>
        <StatRow label="Boxes ouvertes"        value={stats.totalBoxesOpened}    delay={d()} />
        <StatRow label="Objets en inventaire"  value={stats.inventoryCount}       delay={d()} />
        <StatRow label="Objets uniques"        value={stats.uniqueItemsCount}     delay={d()} />
        {stats.favoriteRarity && (
          <StatRow label="Rareté préférée" value={stats.favoriteRarity} delay={d()} />
        )}
        {stats.mostOpenedBox && (
          <StatRow label="Box préférée" value={stats.mostOpenedBox} delay={d()} />
        )}
        {stats.luckiestBox && (
          <StatRow label="Box la plus chanceuse" value={stats.luckiestBox} delay={d()} />
        )}
      </SectionCard>

      {/* Battles */}
      <SectionCard title="Battles" icon={Swords} color="#a855f7" delay={0.05}>
        <StatRow label="Battles jouées"  value={stats.battlesPlayed}               delay={d()} />
        <StatRow label="Victoires"       value={stats.battlesWon}  highlight="#10b981" delay={d()} />
        <StatRow label="Défaites"        value={stats.battlesLost} highlight="#ef4444" delay={d()} />
        <StatRow label="Win rate"        value={`${stats.battleWinRate.toFixed(1)}%`} accent delay={d()} />
        <StatRow label="Streak actuel"   value={stats.currentWinStreak}            delay={d()} />
        <StatRow label="Record streak"   value={stats.longestWinStreak}            delay={d()} />
      </SectionCard>

      {/* Progression */}
      <SectionCard title="Progression" icon={TrendingUp} color="#10b981" delay={0.1}>
        <StatRow label="Rang global"         value={`#${stats.globalRank}`} accent delay={d()} />
        <StatRow label="Streak connexion"    value={`${stats.currentStreak} jours`} delay={d()} />
        <StatRow label="Record connexion"    value={`${stats.longestStreak} jours`} delay={d()} />
      </SectionCard>

      {/* Finances — own profile only */}
      {isOwnProfile && (
        <SectionCard title="Finances" icon={Wallet} color="#f59e0b" delay={0.15}>
          <StatRow label="Coins dépensés"   value={stats.totalCoinsSpent.toFixed(2)}    delay={d()} />
          <StatRow label="Coins gagnés"     value={stats.totalCoinsEarned.toFixed(2)}   delay={d()} />
          <StatRow label="Valeur inventaire" value={stats.totalValue.toFixed(2)} accent  delay={d()} />
          <StatRow label="Objets vendus"    value={stats.totalItemsSold}                delay={d()} />
          <StatRow label="Revenus ventes"   value={stats.totalRevenue.toFixed(2)}       delay={d()} />
          <StatRow
            label="Bilan net"
            value={`${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}`}
            highlight={netColor}
            delay={d()}
          />
        </SectionCard>
      )}
    </div>
  )
}
