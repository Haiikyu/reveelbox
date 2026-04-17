'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Play, Pause, RotateCcw, Trophy, User,
  Swords, ExternalLink, Shield, ChevronDown, ChevronUp, Bot,
} from 'lucide-react'
import { fetchBattleReplayData } from '@/app/hooks/useReplayHistory'
import Link from 'next/link'

const RARITY_COLORS: Record<string, string> = {
  common:    '#10b981',
  uncommon:  '#3b82f6',
  rare:      '#8b5cf6',
  epic:      '#d946ef',
  legendary: '#f59e0b',
}

const RARITY_GLOW: Record<string, string> = {
  common:    'rgba(16,185,129,0.2)',
  uncommon:  'rgba(59,130,246,0.2)',
  rare:      'rgba(139,92,246,0.2)',
  epic:      'rgba(217,70,239,0.2)',
  legendary: 'rgba(245,158,11,0.28)',
}

type PlaySpeed = 1 | 2 | 4

interface Opening {
  id: string
  user_id: string
  box_instance: number
  items: {
    name: string
    market_value: number
    rarity: string
    image_url: string | null
  } | null
}

interface Participant {
  user_id: string
  is_winner: boolean | null
  total_value: number | null
  is_bot: boolean | null
  profiles: { username: string | null; avatar_url: string | null; level: number } | null
}

export default function BattleReplayPage() {
  const params = useParams()
  const router = useRouter()
  const battleId = params.battleId as string

  const [loading, setLoading] = useState(true)
  const [battle, setBattle] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [rounds, setRounds] = useState<Map<number, Opening[]>>(new Map())
  const [sortedRoundKeys, setSortedRoundKeys] = useState<number[]>([])
  const [currentRound, setCurrentRound] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlaySpeed>(1)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [showPF, setShowPF] = useState(false)
  const [autoStartCountdown, setAutoStartCountdown] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!battleId) return
    fetchBattleReplayData(battleId).then(({ battle: b, openings: o, participants: p }) => {
      setBattle(b)
      setParticipants(p as unknown as Participant[])

      const roundMap = new Map<number, Opening[]>()
      ;(o as unknown as Opening[]).forEach(op => {
        const r = op.box_instance ?? 0
        if (!roundMap.has(r)) roundMap.set(r, [])
        roundMap.get(r)!.push(op)
      })
      const keys = Array.from(roundMap.keys()).sort((a, b) => a - b)
      setRounds(roundMap)
      setSortedRoundKeys(keys)
      setLoading(false)

      // Auto-start countdown si des données existent
      if (keys.length > 0) {
        setAutoStartCountdown(3)
      }
    })
  }, [battleId])

  // Countdown auto-start
  useEffect(() => {
    if (autoStartCountdown === null) return
    if (autoStartCountdown <= 0) {
      setAutoStartCountdown(null)
      setPlaying(true)
      setTimeout(() => advanceRound(), 200)
      return
    }
    countdownRef.current = setTimeout(() => {
      setAutoStartCountdown(prev => (prev !== null ? prev - 1 : null))
    }, 1000)
    return () => { if (countdownRef.current) clearTimeout(countdownRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartCountdown])

  const totalRounds = sortedRoundKeys.length
  const isFinished = totalRounds > 0 && currentRound >= totalRounds - 1 && !playing
  const hasNoData = !loading && battle && totalRounds === 0

  const advanceRound = useCallback(() => {
    setCurrentRound(prev => {
      const next = prev + 1
      if (next >= totalRounds) {
        setPlaying(false)
        return totalRounds - 1
      }
      const key = sortedRoundKeys[next]
      const roundOpenings = rounds.get(key) || []
      roundOpenings.forEach(op => {
        setScores(s => ({
          ...s,
          [op.user_id]: (s[op.user_id] || 0) + (op.items?.market_value || 0),
        }))
      })
      return next
    })
  }, [rounds, sortedRoundKeys, totalRounds])

  useEffect(() => {
    if (playing && currentRound < totalRounds - 1) {
      const ms = 1800 / speed
      timerRef.current = setTimeout(advanceRound, ms)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, currentRound, speed, advanceRound, totalRounds])

  const handlePlayPause = () => {
    // Annuler le countdown si actif
    if (autoStartCountdown !== null) {
      if (countdownRef.current) clearTimeout(countdownRef.current)
      setAutoStartCountdown(null)
    }

    if (isFinished || currentRound === totalRounds - 1) {
      setCurrentRound(-1)
      setScores({})
      setPlaying(true)
      setTimeout(advanceRound, 300)
    } else if (!playing && currentRound === -1) {
      setPlaying(true)
      setTimeout(advanceRound, 200)
    } else {
      setPlaying(!playing)
    }
  }

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearTimeout(countdownRef.current)
    setAutoStartCountdown(null)
    setCurrentRound(-1)
    setScores({})
    setPlaying(false)
  }

  const getItemForParticipant = (userId: string): Opening | null => {
    if (currentRound < 0) return null
    const key = sortedRoundKeys[currentRound]
    if (key === undefined) return null
    return rounds.get(key)?.find(op => op.user_id === userId) ?? null
  }

  const gridClass =
    participants.length <= 2 ? 'grid-cols-2' :
    participants.length === 3 ? 'grid-cols-3' :
    'grid-cols-4'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080d1a' }}>
        <div className="w-8 h-8 border-2 border-[#a855f7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080d1a' }}>
        <div className="text-center">
          <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Battle introuvable</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-[#a855f7] hover:underline">Retour</button>
        </div>
      </div>
    )
  }

  const battleDate = battle.created_at
    ? new Date(battle.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const winner = participants.find(p => p.is_winner)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080d1a' }}>

      {/* ── HEADER STICKY ───────────────────────────────────────────────────── */}
      <div
        className="border-b sticky top-0 z-20"
        style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(8,13,26,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0"
              style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}
            >
              Replay
            </span>
            <span className="text-sm text-gray-300 truncate font-medium">{battle.name || 'Battle'}</span>
            <span className="text-xs text-gray-600 hidden sm:inline shrink-0">· {battleDate}</span>
          </div>
          <Link
            href={`/battles/${battleId}`}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#a855f7] transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voir la battle</span>
          </Link>
        </div>

        {/* Barre de progression */}
        <div className="h-[2px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <motion.div
            animate={{ width: `${totalRounds > 0 ? ((currentRound + 1) / totalRounds) * 100 : 0}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #a855f7, #6366f1)' }}
          />
        </div>
      </div>

      {/* ── NO DATA STATE ───────────────────────────────────────────────────── */}
      {hasNoData ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}
            >
              <Swords className="w-9 h-9 text-gray-700" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Données de replay indisponibles</h3>
            <p className="text-sm text-gray-500 mb-6">
              Les données détaillées de cette battle ne sont pas enregistrées.
            </p>
            <Link
              href={`/battles/${battleId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              <ExternalLink className="w-4 h-4" />
              Voir la battle
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── PLAYER COLUMNS ──────────────────────────────────────────────── */}
          <div
            className={`grid ${gridClass} flex-1`}
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', minHeight: 'calc(100vh - 240px)' }}
          >
            {participants.map((participant, idx) => {
              const currentItem = getItemForParticipant(participant.user_id)
              const score = scores[participant.user_id] || 0
              const isWinner = isFinished && !!participant.is_winner
              const itemRarity = currentItem?.items?.rarity?.toLowerCase() || 'common'
              const itemColor = RARITY_COLORS[itemRarity] || RARITY_COLORS.common
              const itemGlow = RARITY_GLOW[itemRarity] || RARITY_GLOW.common

              return (
                <div
                  key={participant.user_id}
                  className="flex flex-col relative transition-all duration-700"
                  style={{
                    borderRight: idx < participants.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isWinner
                      ? 'rgba(245,158,11,0.03)'
                      : currentRound >= 0
                      ? `${itemColor}04`
                      : 'transparent',
                  }}
                >
                  {/* Player header */}
                  <div
                    className="flex flex-col items-center pt-6 pb-4 px-2 sm:px-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Avatar */}
                    <div className="relative mb-2">
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-500"
                        style={{
                          background: 'linear-gradient(135deg, #4578be, #a855f7)',
                          border: isWinner
                            ? '2px solid rgba(245,158,11,0.6)'
                            : currentRound >= 0
                            ? `2px solid ${itemColor}40`
                            : '2px solid rgba(255,255,255,0.06)',
                          boxShadow: isWinner
                            ? '0 0 20px rgba(245,158,11,0.25)'
                            : currentRound >= 0 && currentItem
                            ? `0 0 16px ${itemGlow}`
                            : 'none',
                        }}
                      >
                        {participant.profiles?.avatar_url ? (
                          <img src={participant.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          participant.is_bot
                            ? <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
                            : <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        )}
                      </div>
                      {isWinner && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center"
                        >
                          <Trophy className="w-3 h-3 text-black" />
                        </motion.div>
                      )}
                      {participant.is_bot && (
                        <div className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded text-[8px] font-bold bg-gray-800 text-gray-500 border border-gray-700">
                          BOT
                        </div>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-white truncate text-center max-w-full px-1">
                      {participant.profiles?.username || (participant.is_bot ? 'Bot' : 'Joueur')}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {participant.profiles?.level ? `Nv. ${participant.profiles.level}` : ''}
                    </p>

                    {/* Score */}
                    <motion.p
                      animate={{ scale: currentItem ? [1, 1.15, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-base sm:text-lg font-black mt-2 tabular-nums"
                      style={{ color: isWinner ? '#f59e0b' : '#10b981' }}
                    >
                      {score.toFixed(2)}
                    </motion.p>
                    <p className="text-[10px] text-gray-600">coins</p>
                  </div>

                  {/* Zone item */}
                  <div className="flex-1 flex flex-col items-center justify-start p-3 gap-2">
                    <AnimatePresence mode="wait">
                      {currentRound === -1 ? (
                        /* État initial : "Prêt" */
                        <motion.div
                          key="ready"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-3 py-4"
                        >
                          <motion.div
                            animate={{ opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}
                          >
                            <Swords className="w-5 h-5 text-[#a855f7]/40" />
                          </motion.div>
                          {autoStartCountdown !== null && (
                            <motion.span
                              key={autoStartCountdown}
                              initial={{ scale: 1.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-2xl font-black"
                              style={{ color: '#a855f7' }}
                            >
                              {autoStartCountdown}
                            </motion.span>
                          )}
                        </motion.div>
                      ) : currentItem?.items ? (
                        /* Item révélé */
                        <motion.div
                          key={`${participant.user_id}-${currentRound}`}
                          initial={{ opacity: 0, scale: 0.55, y: 16 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          className="flex flex-col items-center gap-2 w-full"
                        >
                          {/* Carte item */}
                          <div
                            className="w-full rounded-2xl flex items-center justify-center"
                            style={{
                              height: 100,
                              background: `${itemColor}0c`,
                              border: `1px solid ${itemColor}22`,
                              boxShadow: `0 0 24px ${itemGlow}`,
                            }}
                          >
                            {currentItem.items.image_url ? (
                              <img
                                src={currentItem.items.image_url}
                                alt={currentItem.items.name}
                                className="max-w-full max-h-full object-contain p-2"
                                style={{ maxHeight: 88 }}
                              />
                            ) : (
                              <Swords className="w-7 h-7" style={{ color: itemColor, opacity: 0.4 }} />
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs font-bold text-white text-center line-clamp-2 leading-tight">
                            {currentItem.items.name}
                          </p>
                          <p className="text-[10px] font-semibold capitalize" style={{ color: itemColor }}>
                            {currentItem.items.rarity}
                          </p>
                          <p className="text-sm font-black tabular-nums" style={{ color: itemColor }}>
                            {(currentItem.items.market_value || 0).toFixed(2)}
                            <span className="text-[10px] text-gray-600 ml-1 font-normal">coins</span>
                          </p>
                        </motion.div>
                      ) : (
                        /* Pas d'item pour ce round */
                        <motion.div
                          key={`empty-${currentRound}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full h-[100px] rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Historique des 3 derniers rounds */}
                    {currentRound > 0 && (
                      <div className="w-full flex flex-col gap-1 mt-1">
                        {sortedRoundKeys
                          .slice(0, currentRound)
                          .reverse()
                          .slice(0, 3)
                          .map(rKey => {
                            const pastOp = rounds.get(rKey)?.find(op => op.user_id === participant.user_id)
                            if (!pastOp?.items) return null
                            const c = RARITY_COLORS[pastOp.items.rarity?.toLowerCase() || 'common'] || RARITY_COLORS.common
                            return (
                              <div
                                key={rKey}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}
                              >
                                {pastOp.items.image_url && (
                                  <img src={pastOp.items.image_url} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                                )}
                                <p className="text-[10px] text-gray-600 truncate flex-1">{pastOp.items.name}</p>
                                <p className="text-[10px] font-bold flex-shrink-0 tabular-nums" style={{ color: c }}>
                                  {(pastOp.items.market_value || 0).toFixed(0)}
                                </p>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── CONTROLS ────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-4 py-5 px-4">
            {currentRound >= 0 && (
              <button
                onClick={handleReset}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                title="Recommencer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Play / Pause */}
            <button
              onClick={handlePlayPause}
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
              }}
            >
              {autoStartCountdown !== null ? (
                <motion.span
                  key={autoStartCountdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-xl font-black"
                >
                  {autoStartCountdown}
                </motion.span>
              ) : playing ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            {/* Vitesse */}
            <div className="flex gap-1.5">
              {([1, 2, 4] as PlaySpeed[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: speed === s ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${speed === s ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.06)'}`,
                    color: speed === s ? '#a855f7' : '#6b7280',
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Compteur round */}
            <span className="text-xs text-gray-600 ml-1 tabular-nums">
              <span className="text-white font-bold">{Math.max(0, currentRound + 1)}</span>
              /{totalRounds}
            </span>
          </div>

          {/* ── WINNER BANNER ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {isFinished && winner && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="mx-4 mb-4 rounded-2xl p-6 text-center"
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  boxShadow: '0 0 40px rgba(245,158,11,0.1)',
                }}
              >
                <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">Vainqueur</p>
                <p className="text-2xl font-black text-white">
                  {winner.profiles?.username || (winner.is_bot ? 'Bot' : 'Joueur')}
                </p>
                <p className="text-sm text-amber-400 font-bold mt-1">
                  {(scores[winner.user_id] || 0).toFixed(2)} coins
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── PROVABLY FAIR ───────────────────────────────────────────────────── */}
      {(battle?.server_seed || battle?.combined_hash) && (
        <div className="px-4 pb-8">
          <button
            onClick={() => setShowPF(!showPF)}
            className="flex items-center gap-2 text-xs text-[#4578be]/70 hover:text-[#4578be] transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Provably Fair
            {showPF ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <AnimatePresence>
            {showPF && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-3 text-[11px] font-mono space-y-1.5 rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {battle.server_seed && (
                    <div className="flex gap-3">
                      <span className="text-gray-600 whitespace-nowrap">Server Seed:</span>
                      <span className="truncate text-gray-400">{battle.server_seed}</span>
                    </div>
                  )}
                  {battle.combined_hash && (
                    <div className="flex gap-3">
                      <span className="text-gray-600 whitespace-nowrap">Hash:</span>
                      <span className="truncate text-gray-400">{battle.combined_hash}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
