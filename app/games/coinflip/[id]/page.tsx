'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Trophy } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

interface BattlePageProps {
  params: Promise<{ id: string }>
}

const Confetti = () => {
  return (
    <>
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: Math.random() * 360,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720,
            opacity: 0
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: "linear"
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
    </>
  )
}

export default function CoinflipBattlePage({ params }: BattlePageProps) {
  const { id } = use(params)
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [battle, setBattle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [animating, setAnimating] = useState(false)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    loadBattle()

    const channel = supabase
      .channel(`coinflip-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'coinflip_battles',
        filter: `id=eq.${id}`
      }, () => {
        loadBattle()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const loadBattle = async () => {
    try {
      const { data, error } = await supabase
        .from('coinflip_battles')
        .select(`
          *,
          creator:creator_id (
            username,
            avatar_url,
            email
          ),
          joiner:joiner_id (
            username,
            avatar_url,
            email
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setBattle(data)

      if (data.status === 'finished') {
        setResult({
          winning_side: data.winning_side,
          winner_id: data.winner_id,
          is_winner: data.winner_id === user?.id,
          prize: data.bet_amount * 2
        })
        setShowResult(true)
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user || !profile) return
    setPlaying(true)
    setAnimating(true)

    try {
      const { data, error } = await supabase.rpc('join_coinflip_battle', {
        p_battle_id: id
      })

      if (error) throw error

      await new Promise(resolve => setTimeout(resolve, 6000))

      setResult(data)
      setAnimating(false)
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowResult(true)
      await refreshProfile()
      await loadBattle()
    } catch (err: any) {
      alert(err.message || 'Erreur')
      setAnimating(false)
    } finally {
      setPlaying(false)
    }
  }

  const handlePlayVsBot = async () => {
    if (!user) return
    setPlaying(true)
    setAnimating(true)

    try {
      const { data, error } = await supabase.rpc('play_coinflip_vs_bot', {
        p_battle_id: id
      })

      if (error) throw error

      await new Promise(resolve => setTimeout(resolve, 6000))

      setResult(data)
      setAnimating(false)
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowResult(true)
      await refreshProfile()
      await loadBattle()
    } catch (err: any) {
      alert(err.message || 'Erreur')
      setAnimating(false)
    } finally {
      setPlaying(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Annuler cette battle ?')) return

    try {
      await supabase.rpc('cancel_coinflip_battle', { p_battle_id: id })
      await refreshProfile()
      router.push('/games/coinflip')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getAvatarDisplay = (player: any, isBot = false) => {
    if (isBot) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <span className="text-6xl">🤖</span>
        </div>
      )
    }

    if (player?.avatar_url) {
      return <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
    }

    const initial = player?.username?.[0]?.toUpperCase() || player?.email?.[0]?.toUpperCase() || 'U'
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white font-black text-6xl">
        {initial}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#0f0a1f] to-[#0a0118] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
        />
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#0f0a1f] to-[#0a0118] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white text-2xl font-bold">Battle introuvable</p>
          <Link href="/games/coinflip" className="text-purple-400 hover:text-purple-300 font-semibold">
            Retour aux battles
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = user?.id === battle.creator_id
  const canJoin = !isCreator && battle.status === 'waiting'
  const canPlayVsBot = isCreator && battle.status === 'waiting'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#0f0a1f] to-[#0a0118] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      {/* Floating Coins Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.img
            key={i}
            src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
            alt="coin"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -50,
              rotate: Math.random() * 360,
              opacity: 0.3,
              scale: 0.3 + Math.random() * 0.4
            }}
            animate={{
              y: window.innerHeight + 50,
              rotate: Math.random() * 720,
              x: Math.random() * window.innerWidth
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear"
            }}
            className="absolute w-12 h-12"
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/games/coinflip" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Retour</span>
          </Link>

          {profile && (
            <div className="flex items-center gap-4">
              <div className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                    alt="coin"
                    className="h-5 w-5"
                  />
                  <span className="text-xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text">
                    {profile.virtual_currency?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/50 ring-offset-2 ring-offset-black/50">
                {getAvatarDisplay(profile)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className={`inline-block px-6 py-3 rounded-full font-bold text-sm backdrop-blur-xl ${
              battle.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              battle.status === 'finished' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
              {battle.status === 'waiting' && '⏳ En attente'}
              {battle.status === 'finished' && '✅ Terminée'}
              {battle.status === 'cancelled' && '❌ Annulée'}
            </div>
          </motion.div>

          {/* Players & Bet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-8 items-center"
          >
            {/* Player 1 */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mx-auto w-36 h-36"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 blur-xl opacity-50"></div>
                <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-purple-500 shadow-2xl">
                  {getAvatarDisplay(battle.creator)}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-500 text-white text-xs font-black shadow-lg">
                  PILE
                </div>
              </motion.div>
              <div>
                <p className="text-2xl font-black text-white">{battle.creator?.username || 'Joueur 1'}</p>
                <p className="text-sm text-gray-400">Créateur</p>
              </div>
            </div>

            {/* Center - Bet Amount */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="relative mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 backdrop-blur-xl flex items-center justify-center"
              >
                <img 
                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                  alt="coin"
                  className="absolute w-16 h-16 animate-pulse"
                />
              </motion.div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Mise totale</p>
                <p className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text">
                  {battle.bet_amount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Player 2 / Bot / Waiting */}
            <div className="text-center space-y-4">
              {battle.joiner_id || battle.is_bot_game ? (
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative mx-auto w-36 h-36"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-red-500 blur-xl opacity-50"></div>
                  <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-orange-500 shadow-2xl">
                    {getAvatarDisplay(battle.joiner, battle.is_bot_game)}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange-500 text-white text-xs font-black shadow-lg">
                    FACE
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mx-auto w-36 h-36 rounded-full bg-white/5 border-4 border-dashed border-white/20 flex items-center justify-center backdrop-blur-xl"
                >
                  <span className="text-5xl text-gray-600">?</span>
                </motion.div>
              )}
              <div>
                <p className="text-2xl font-black text-white">
                  {battle.is_bot_game ? 'Bot' : battle.joiner?.username || 'En attente...'}
                </p>
                <p className="text-sm text-gray-400">
                  {battle.is_bot_game ? 'Intelligence Artificielle' : battle.joiner_id ? 'Adversaire' : 'Attente d\'un joueur'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Coin Flip Animation */}
          <AnimatePresence>
            {animating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-3xl"></div>
                <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-16 flex flex-col items-center justify-center min-h-[500px]">
                  {/* Coin */}
                  <div className="relative w-80 h-80 mb-12" style={{ perspective: '1000px' }}>
                    <motion.div
                      animate={{ rotateY: [0, 3600] }}
                      transition={{
                        duration: 6,
                        ease: "easeInOut"
                      }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="w-full h-full relative"
                    >
                      {/* Heads Side */}
                      <div
                        style={{ backfaceVisibility: "hidden" }}
                        className="absolute inset-0 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
                      >
                        <img 
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="coin"
                          className="w-64 h-64"
                        />
                      </div>

                      {/* Tails Side */}
                      <div
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)"
                        }}
                        className="absolute inset-0 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
                      >
                        <img 
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                          alt="coin"
                          className="w-64 h-64"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Spinning Text */}
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-center space-y-3"
                  >
                    <p className="text-4xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                      La pièce tourne...
                    </p>
                    <p className="text-gray-400">Bonne chance !</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Screen */}
          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                {result.is_winner && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <Confetti />
                  </div>
                )}

                <div className={`relative rounded-3xl border-4 p-16 backdrop-blur-2xl ${
                  result.is_winner 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500 shadow-2xl shadow-green-500/50' 
                    : 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500 shadow-2xl shadow-red-500/50'
                }`}>
                  <div className="text-center space-y-8">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                      className="relative mx-auto w-32 h-32"
                    >
                      {result.is_winner ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-2xl animate-pulse"></div>
                          <Trophy className="relative w-full h-full text-yellow-400 drop-shadow-2xl" />
                        </>
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border-4 border-red-500 flex items-center justify-center backdrop-blur-xl">
                          <span className="text-7xl">😢</span>
                        </div>
                      )}
                    </motion.div>

                    {/* Title */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h2 className={`text-7xl font-black mb-4 ${
                        result.is_winner 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text' 
                          : 'bg-gradient-to-r from-red-400 to-pink-400 text-transparent bg-clip-text'
                      }`}>
                        {result.is_winner ? 'VICTOIRE !' : 'DÉFAITE'}
                      </h2>
                      <p className="text-2xl text-white font-semibold">
                        Résultat: <span className="font-black">{result.winning_side === 'heads' ? 'PILE' : 'FACE'}</span>
                      </p>
                    </motion.div>

                    {/* Prize */}
                    {result.is_winner && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", bounce: 0.3 }}
                        className="inline-block"
                      >
                        <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500 rounded-2xl p-8 backdrop-blur-xl">
                          <p className="text-gray-300 mb-3">Vous avez gagné</p>
                          <div className="flex items-center justify-center gap-3">
                            <Sparkles className="w-10 h-10 text-yellow-400" />
                            <p className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text">
                              +{result.prize.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex gap-4 justify-center pt-6"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/games/coinflip')}
                        className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl transition-all backdrop-blur-xl border border-white/20"
                      >
                        Retour
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/games/coinflip/create')}
                        className="relative px-10 py-4 rounded-xl font-bold text-lg text-white overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 transition-transform group-hover:scale-105"></div>
                        <span className="relative z-10">Rejouer</span>
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {!showResult && !animating && battle.status === 'waiting' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-6 max-w-3xl mx-auto"
            >
              {canJoin && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoin}
                  disabled={playing}
                  className="relative py-8 rounded-2xl font-black text-2xl text-white overflow-hidden disabled:opacity-50 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                  <span className="relative z-10">REJOINDRE</span>
                </motion.button>
              )}

              {canPlayVsBot && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlayVsBot}
                    disabled={playing}
                    className="relative py-8 rounded-2xl font-black text-2xl text-white overflow-hidden disabled:opacity-50 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>
                    <span className="relative z-10">JOUER VS BOT</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="col-span-2 py-5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-lg rounded-xl transition-all backdrop-blur-xl border border-white/10"
                  >
                    Annuler la battle
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}