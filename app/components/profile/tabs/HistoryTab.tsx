'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, Box, Swords, Play, Shield, ChevronDown, ChevronUp,
  Trophy, TrendingDown, Package, Clock, Coins
} from 'lucide-react'
import { useState } from 'react'
import type { HistoryFilter, ActivityEntry } from '@/app/types/profile'

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'all',         label: 'Tout' },
  { id: 'box_opening', label: 'Boxes' },
  { id: 'battle',      label: 'Battles' },
]

const RARITY_COLORS: Record<string, string> = {
  common:    '#9ca3af',
  rare:      '#3b82f6',
  epic:      '#a855f7',
  legendary: '#f59e0b',
  mythic:    '#ef4444',
}

const RARITY_GLOW: Record<string, string> = {
  common:    'rgba(156,163,175,0.15)',
  rare:      'rgba(59,130,246,0.2)',
  epic:      'rgba(168,85,247,0.22)',
  legendary: 'rgba(245,158,11,0.25)',
  mythic:    'rgba(239,68,68,0.28)',
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ProvablyFairSection({ metadata }: { metadata: Record<string, any> }) {
  const [open, setOpen] = useState(false)
  const hasSeeds = metadata.server_seed || metadata.combined_hash
  if (!hasSeeds) return null

  return (
    <div className="mt-2 border-t border-white/[0.04] pt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] text-[#4578be]/60 hover:text-[#4578be] transition-colors"
      >
        <Shield className="w-3 h-3" />
        Provably Fair
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1 text-[10px] font-mono text-gray-500 bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
              {[
                ['Server Seed', metadata.server_seed],
                ['Client Seed', metadata.client_seed],
                ['Nonce',       metadata.nonce?.toString()],
                ['Hash',        metadata.combined_hash],
              ].filter(([, v]) => v != null && v !== '').map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="text-gray-600 whitespace-nowrap flex-shrink-0">{label}:</span>
                  <span className="truncate text-gray-500">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Vignette miniature pour un item de box */
function ItemThumbnail({ imageUrl, rarity, size = 44 }: { imageUrl?: string; rarity?: string; size?: number }) {
  const color = RARITY_COLORS[rarity || 'common'] || '#9ca3af'
  const glow  = RARITY_GLOW[rarity || 'common']  || 'transparent'

  return (
    <div
      className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
      style={{
        width: size, height: size,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 12px ${glow}`,
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" loading="lazy" className="w-full h-full object-contain p-0.5" />
      ) : (
        <Package className="w-5 h-5" style={{ color }} />
      )}
    </div>
  )
}

/** Badge de rareté */
function RarityBadge({ rarity }: { rarity: string }) {
  const color = RARITY_COLORS[rarity] || '#9ca3af'
  const labels: Record<string, string> = {
    common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire', mythic: 'Mythique',
  }
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={{ color, background: color + '18', border: `1px solid ${color}25` }}
    >
      {labels[rarity] || rarity}
    </span>
  )
}

/** Formatte une date en "14 jan. à 18:32" */
function formatDate(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface HistoryTabProps {
  entries: ActivityEntry[]
  loading: boolean
  hasMore: boolean
  filter: HistoryFilter
  onFilterChange: (f: HistoryFilter) => void
  onLoadMore: () => void
  onReplay?: (battleId: string) => void
  isOwnProfile: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function HistoryTab({
  entries, loading, hasMore, filter, onFilterChange, onLoadMore, onReplay, isOwnProfile,
}: HistoryTabProps) {
  const router = useRouter()

  // ── Summary stats (calculées depuis les entries chargées) ─────────────────
  const summary = useMemo(() => {
    const boxes   = entries.filter(e => e.type === 'box_opening')
    const battles = entries.filter(e => e.type === 'battle')
    const wins    = battles.filter(e => e.metadata?.is_winner)
    const totalVal = entries.reduce((s, e) => s + (e.value ?? 0), 0)
    return { boxes: boxes.length, battles: battles.length, wins: wins.length, totalVal }
  }, [entries])

  return (
    <div>
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filter === f.id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={filter === f.id ? {
              background: 'rgba(69,120,190,0.15)',
              border: '1px solid rgba(69,120,190,0.3)',
              color: '#4578be',
            } : {
              background: 'transparent',
              border: '1px solid transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Summary stats ───────────────────────────────────────────────── */}
      {!loading && entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Boxes ouvertes',  value: summary.boxes.toString(),                    color: '#4578be', Icon: Box     },
            { label: 'Battles jouées',  value: summary.battles.toString(),                  color: '#a855f7', Icon: Swords  },
            { label: 'Victoires',       value: `${summary.wins}/${summary.battles}`,         color: '#10b981', Icon: Trophy  },
            {
              label: 'Solde net',
              value: `${summary.totalVal >= 0 ? '+' : ''}${summary.totalVal.toFixed(0)}`,
              color: summary.totalVal >= 0 ? '#10b981' : '#ef4444',
              Icon: Coins,
            },
          ].map(({ label, value, color, Icon }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <p className="text-base font-black text-white">{value}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Entry list ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {entries.map((entry, i) => {
          const isBattle   = entry.type === 'battle'
          const isWin      = isBattle && entry.metadata?.is_winner
          const isLoss     = isBattle && !entry.metadata?.is_winner
          const isMultiBox = entry.id.startsWith('multibox_') && entry.metadata?.multi_ids
          const isSingleBox = entry.id.startsWith('box_') && entry.metadata?.box_id
          const hasBoxReplay    = !isBattle && (isMultiBox || isSingleBox)
          const hasBattleReplay = isBattle && entry.metadata?.battle_id
          const { date, time } = formatDate(entry.created_at)

          // Couleurs selon type/résultat
          const accentColor = isBattle
            ? (isWin ? '#10b981' : '#ef4444')
            : '#4578be'
          const accentGlow = isBattle
            ? (isWin ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)')
            : 'rgba(69,120,190,0.08)'
          const TypeIcon = isBattle ? Swords : Box

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.3 }}
            >
              <div
                className="rounded-xl p-3 sm:p-4 flex items-start gap-3 transition-colors hover:bg-white/[0.015]"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isBattle ? (isWin ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)') : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                {/* Type icon */}
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: accentGlow, border: `1px solid ${accentColor}20` }}
                >
                  <TypeIcon className="w-4 h-4" style={{ color: accentColor }} />
                </div>

                {/* Item thumbnail (boxes seulement) */}
                {!isBattle && (
                  <ItemThumbnail imageUrl={entry.image_url} rarity={entry.rarity} size={40} />
                )}

                {/* Win/loss indicator for battles */}
                {isBattle && (
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ background: isWin ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)' }}
                  >
                    {isWin
                      ? <Trophy className="w-5 h-5 text-emerald-400" />
                      : <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-white truncate">{entry.title}</span>
                    {entry.rarity && <RarityBadge rarity={entry.rarity} />}
                    {isMultiBox && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
                      >
                        x{entry.metadata!.count}
                      </span>
                    )}
                    {isBattle && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: isWin ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)',
                          color: isWin ? '#10b981' : '#ef4444',
                          border: `1px solid ${isWin ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
                        }}
                      >
                        {isWin ? 'Victoire' : 'Défaite'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 truncate mb-1.5">{entry.description}</p>

                  {/* Date + time */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{date}</span>
                    <span className="opacity-50">·</span>
                    <span>{time}</span>
                  </div>

                  {/* Provably Fair (battles) */}
                  {entry.metadata && isBattle && (
                    <ProvablyFairSection metadata={entry.metadata} />
                  )}
                </div>

                {/* Right column: value + replay */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2 ml-2">
                  {isOwnProfile && entry.value !== undefined && entry.value !== 0 && (
                    <span
                      className="text-sm font-black tabular-nums"
                      style={{ color: entry.value > 0 ? '#10b981' : '#ef4444' }}
                    >
                      {entry.value > 0 ? '+' : ''}{entry.value.toFixed(2)}
                    </span>
                  )}

                  {/* Replay buttons */}
                  {hasBattleReplay && (
                    <button
                      onClick={() => router.push(`/replay/battle/${entry.metadata!.battle_id}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        color: '#a855f7',
                        background: 'rgba(168,85,247,0.06)',
                        border: '1px solid rgba(168,85,247,0.15)',
                      }}
                    >
                      <Play className="w-3 h-3" />
                      <span className="hidden sm:inline">Replay</span>
                    </button>
                  )}
                  {hasBoxReplay && (
                    <button
                      onClick={() => {
                        if (isMultiBox) {
                          router.push(`/replay/box/${entry.metadata!.multi_ids}`)
                        } else {
                          const inventoryId = entry.id.replace('box_', '')
                          router.push(`/replay/box/${inventoryId}`)
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        color: '#4578be',
                        background: 'rgba(69,120,190,0.06)',
                        border: '1px solid rgba(69,120,190,0.15)',
                      }}
                    >
                      <Play className="w-3 h-3" />
                      <span className="hidden sm:inline">Replay</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-16">
          <Clock className="w-10 h-10 mx-auto mb-4 text-gray-700" />
          <p className="text-gray-600 text-sm">Aucune activité enregistrée</p>
        </div>
      )}

      {/* ── Load more ───────────────────────────────────────────────────── */}
      {!loading && hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={onLoadMore}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Voir plus
          </button>
        </div>
      )}
    </div>
  )
}
