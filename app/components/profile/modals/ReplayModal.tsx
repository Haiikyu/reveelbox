'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, FastForward, X, User, Trophy } from 'lucide-react'
import { fetchBattleReplayData } from '@/app/hooks/useReplayHistory'
import { RARITY_COLORS, RARITY_GLOW } from '@/app/types/profile'
import Modal from '@/app/components/ui/Modal'

interface ReplayModalProps {
  isOpen: boolean
  onClose: () => void
  battleId: string | null
}

interface Participant {
  user_id: string
  is_winner: boolean
  total_value: number
  profiles: { username: string; avatar_url: string | null; level: number }
}

interface Opening {
  id: string
  user_id: string
  box_instance: number
  items: { name: string; market_value: number; rarity: string; image_url: string | null }
}

export default function ReplayModal({ isOpen, onClose, battleId }: ReplayModalProps) {
  const [loading, setLoading] = useState(true)
  const [battle, setBattle] = useState<any>(null)
  const [openings, setOpenings] = useState<Opening[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [scores, setScores] = useState<Record<string, number>>({})
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen || !battleId) return
    setLoading(true)
    setCurrentStep(-1)
    setPlaying(false)
    setScores({})

    fetchBattleReplayData(battleId).then(({ battle: b, openings: o, participants: p }) => {
      setBattle(b)
      setOpenings(o as unknown as Opening[])
      setParticipants(p as unknown as Participant[])
      setLoading(false)
    })
  }, [isOpen, battleId])

  const totalSteps = openings.length

  const advanceStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1
      if (next >= totalSteps) {
        setPlaying(false)
        return totalSteps - 1
      }
      // Update scores
      const opening = openings[next]
      if (opening) {
        setScores(s => ({
          ...s,
          [opening.user_id]: (s[opening.user_id] || 0) + (opening.items?.market_value || 0),
        }))
      }
      return next
    })
  }, [openings, totalSteps])

  useEffect(() => {
    if (playing && currentStep < totalSteps - 1) {
      const ms = 1500 / speed
      timerRef.current = setTimeout(advanceStep, ms)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [playing, currentStep, speed, advanceStep, totalSteps])

  const handlePlayPause = () => {
    if (currentStep >= totalSteps - 1) {
      // Reset
      setCurrentStep(-1)
      setScores({})
      setPlaying(true)
      setTimeout(advanceStep, 500)
    } else {
      setPlaying(!playing)
      if (!playing && currentStep === -1) {
        setTimeout(advanceStep, 200)
      }
    }
  }

  const currentOpening = currentStep >= 0 ? openings[currentStep] : null
  const isFinished = currentStep >= totalSteps - 1 && !playing

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Replay de Battle">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Participants scores */}
          <div className="grid grid-cols-2 gap-4">
            {participants.map(p => {
              const score = scores[p.user_id] || 0
              const isWinner = isFinished && p.is_winner
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                    isWinner ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    {p.profiles?.avatar_url ? (
                      <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-400 inline mr-1" />}
                      {p.profiles?.username || 'Joueur'}
                    </p>
                    <p className="text-xs text-white/40">Nv. {p.profiles?.level}</p>
                  </div>
                  <p className="text-lg font-black text-emerald-400">{score.toFixed(2)}</p>
                </div>
              )
            })}
          </div>

          {/* Current item reveal */}
          <div className="min-h-[160px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentOpening ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="text-center"
                >
                  <div className={`w-24 h-24 mx-auto rounded-xl bg-gradient-to-br ${RARITY_COLORS[currentOpening.items?.rarity || 'common']} p-0.5 shadow-lg ${RARITY_GLOW[currentOpening.items?.rarity || 'common']}`}>
                    <div className="w-full h-full rounded-[10px] bg-slate-900 overflow-hidden flex items-center justify-center">
                      {currentOpening.items?.image_url ? (
                        <img src={currentOpening.items.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-white/30">{currentOpening.items?.name}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white mt-3">{currentOpening.items?.name}</p>
                  <p className={`text-xs font-medium capitalize bg-gradient-to-r ${RARITY_COLORS[currentOpening.items?.rarity || 'common']} bg-clip-text text-transparent`}>
                    {currentOpening.items?.rarity}
                  </p>
                  <p className="text-sm font-bold text-emerald-400 mt-1">
                    {(currentOpening.items?.market_value || 0).toFixed(2)} coins
                  </p>
                  <p className="text-[10px] text-white/30 mt-1">
                    {participants.find(p => p.user_id === currentOpening.user_id)?.profiles?.username}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-white/30"
                >
                  {isFinished ? (
                    <div>
                      <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-white">Battle terminée !</p>
                    </div>
                  ) : (
                    <p className="text-sm">Appuyez sur Play pour commencer</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              animate={{ width: `${totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex gap-1">
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    speed === s ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-white/40'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <span className="text-xs text-white/30">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}
