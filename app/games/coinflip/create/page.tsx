'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500]

export default function CreateCoinflipPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [betAmount, setBetAmount] = useState(100)
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!profile) {
      setError('Vous devez être connecté')
      return
    }

    if (betAmount < 20) {
      setError('Mise minimum : 20 coins')
      return
    }

    if (betAmount > profile.virtual_currency) {
      setError('Solde insuffisant')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase
        .rpc('create_coinflip_battle', {
          p_bet_amount: betAmount,
          p_creator_side: selectedSide
        })

      if (rpcError) throw rpcError

      router.push(`/games/coinflip/${data}`)
    } catch (err: any) {
      console.error('Erreur création battle:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getAvatarDisplay = () => {
    if (profile?.avatar_url) {
      return (
        <img 
          src={profile.avatar_url} 
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      )
    }
    const initial = profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white font-black text-5xl">
        {initial}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#0f0a1f] to-[#0a0118] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
      </div>

      {/* Floating Coins Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.img
            key={i}
            src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
            alt="coin"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: -50,
              rotate: Math.random() * 360,
              opacity: 0.3,
              scale: 0.3 + Math.random() * 0.4
            }}
            animate={{
              y: (typeof window !== 'undefined' ? window.innerHeight : 1080) + 50,
              rotate: Math.random() * 720,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920)
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
                {getAvatarDisplay()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Title */}
          <div className="text-center space-y-3">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text"
            >
              COINFLIP
            </motion.h1>
            <p className="text-gray-400 text-lg">Choisis ton côté et tente ta chance</p>
          </div>

          {/* Bet Amount */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <label className="block text-gray-300 font-semibold text-lg">Montant de la mise</label>
            
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AMOUNTS.map((amount, idx) => (
                <motion.button
                  key={amount}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBetAmount(amount)}
                  className={`h-16 rounded-xl font-bold text-lg transition-all relative overflow-hidden ${
                    betAmount === amount
                      ? 'bg-gradient-to-br from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span className="relative z-10">{amount}</span>
                  {betAmount === amount && (
                    <motion.div
                      layoutId="activePreset"
                      className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-600"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
              className="w-full px-6 py-5 bg-black/40 border-2 border-purple-500/30 rounded-2xl text-white text-3xl font-bold focus:outline-none focus:border-purple-500 transition-all backdrop-blur-xl"
              placeholder="Montant personnalisé"
            />
          </motion.div>

          {/* Side Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <label className="block text-gray-300 font-semibold text-lg text-center">Choisis ton côté</label>

            <div className="grid grid-cols-2 gap-6">
              {/* HEADS */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide('heads')}
                className="relative group"
              >
                <div className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${
                  selectedSide === 'heads'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-2xl shadow-purple-500/50'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}>
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedSide === 'heads' ? 'user' : 'bot'}
                        initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                        transition={{ duration: 0.3 }}
                        className="w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-purple-500/50 shadow-2xl"
                      >
                        {selectedSide === 'heads' ? (
                          getAvatarDisplay()
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <span className="text-6xl">🤖</span>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">PILE</p>
                      <p className="text-sm text-gray-400">Heads</p>
                    </div>
                  </div>

                  {selectedSide === 'heads' && (
                    <motion.div
                      layoutId="selectedBorder"
                      className="absolute inset-0 rounded-3xl border-2 border-purple-500 pointer-events-none"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>

                {selectedSide === 'heads' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>

              {/* TAILS */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSide('tails')}
                className="relative group"
              >
                <div className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${
                  selectedSide === 'tails'
                    ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-2xl shadow-orange-500/50'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}>
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedSide === 'tails' ? 'user' : 'bot'}
                        initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                        transition={{ duration: 0.3 }}
                        className="w-28 h-28 mx-auto rounded-full overflow-hidden ring-4 ring-orange-500/50 shadow-2xl"
                      >
                        {selectedSide === 'tails' ? (
                          getAvatarDisplay()
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <span className="text-6xl">🤖</span>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">FACE</p>
                      <p className="text-sm text-gray-400">Tails</p>
                    </div>
                  </div>

                  {selectedSide === 'tails' && (
                    <motion.div
                      layoutId="selectedBorder"
                      className="absolute inset-0 rounded-3xl border-2 border-orange-500 pointer-events-none"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>

                {selectedSide === 'tails' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mise</span>
                <span className="text-2xl font-black text-white">{betAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Gain potentiel</span>
                <span className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">
                  {(betAmount * 2).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="text-gray-400">Chances</span>
                <span className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text">
                  50%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-xl"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-red-400 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={loading || betAmount < 20 || betAmount > (profile?.virtual_currency || 0)}
            className="relative w-full py-6 rounded-2xl font-black text-2xl text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Création...
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6" />
                  LANCER LA PARTIE
                </>
              )}
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}