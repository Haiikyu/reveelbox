// =====================================================
// 🎯 FICHIER 2/4 - PAGE LISTE DES BATTLES
// =====================================================
// 
// 📍 EMPLACEMENT EXACT:
// app/games/coinflip/page.tsx
//
// 📝 INSTRUCTIONS:
// 1. Crée le dossier: app/games/coinflip/
// 2. Crée le fichier: page.tsx dans ce dossier
// 3. COPIE-COLLE tout le contenu de ce fichier
// 4. Sauvegarde (Ctrl+S)
// 
// =====================================================

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import {
  Coins, Users, Bot, Trophy, Clock, Plus, Search,
  Filter, TrendingUp, Flame, Zap, Crown, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface Battle {
  id: string
  creator_id: string
  bet_amount: number
  status: string
  creator_side: string
  created_at: string
  is_bot_game: boolean
  profiles?: {
    username?: string
    avatar_url?: string
  }
}

export default function CoinflipPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [battles, setBattles] = useState<Battle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [searchAmount, setSearchAmount] = useState('')

  // Charger les battles
  useEffect(() => {
    loadBattles()
    
    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('coinflip-battles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coinflip_battles',
        filter: 'status=eq.waiting'
      }, () => {
        loadBattles()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadBattles = async () => {
    try {
      const { data, error } = await supabase
        .from('coinflip_battles')
        .select(`
          *,
          profiles:creator_id (
            username,
            avatar_url
          )
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setBattles(data)
      }
    } catch (err) {
      console.error('Erreur chargement battles:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les battles
  const filteredBattles = battles.filter(battle => {
    if (searchAmount && !battle.bet_amount.toString().includes(searchAmount)) {
      return false
    }

    if (filter === 'low' && battle.bet_amount >= 100) return false
    if (filter === 'medium' && (battle.bet_amount < 100 || battle.bet_amount >= 500)) return false
    if (filter === 'high' && battle.bet_amount < 500) return false

    return true
  })

  const FilterButton = ({ value, label, icon: Icon }: any) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setFilter(value)}
      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
        filter === value
          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Coins className="h-16 w-16 text-cyan-400" />
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 text-transparent bg-clip-text">
                COINFLIP
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Pile ou face ? Doublez vos coins ou perdez tout !
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/games/coinflip/create"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 transition-all flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  CRÉER UNE BATTLE
                </Link>
              </motion.div>

              {profile && (
                <div className="px-6 py-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                      alt="Coins"
                      className="h-6 w-6"
                    />
                    <span className="text-2xl font-black text-white">
                      {profile.virtual_currency?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par montant..."
              value={searchAmount}
              onChange={(e) => setSearchAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <FilterButton value="all" label="Toutes" icon={Flame} />
            <FilterButton value="low" label="< 100" icon={Zap} />
            <FilterButton value="medium" label="100-500" icon={TrendingUp} />
            <FilterButton value="high" label="> 500" icon={Crown} />
          </div>
        </div>
      </div>

      {/* Liste des battles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredBattles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Coins className="h-24 w-24 text-gray-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Aucune battle disponible</h3>
            <p className="text-gray-400 mb-8">Soyez le premier à créer une battle !</p>
            <Link
              href="/games/coinflip/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              <Plus className="h-5 w-5" />
              Créer une battle
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredBattles.map((battle, index) => (
                <BattleCard key={battle.id} battle={battle} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant carte de battle
function BattleCard({ battle, index }: { battle: Battle; index: number }) {
  const router = useRouter()
  const { user } = useAuth()

  const isOwnBattle = user?.id === battle.creator_id

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-50 blur transition-all duration-500" />

      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-lg">
              {battle.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold text-white">
                {battle.profiles?.username || 'Anonyme'}
              </p>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(battle.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {isOwnBattle && (
            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg">
              VOTRE BATTLE
            </div>
          )}
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Mise</p>
              <div className="flex items-center gap-2">
                <img
                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                  alt="Coins"
                  className="h-6 w-6"
                />
                <span className="text-2xl font-black text-white">
                  {battle.bet_amount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Gain potentiel</p>
              <div className="flex items-center gap-2 justify-end">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-xl font-black text-yellow-500">
                  {(battle.bet_amount * 2).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className={`flex-1 px-3 py-2 rounded-lg border-2 ${
            battle.creator_side === 'heads'
              ? 'border-blue-500 bg-blue-500/20'
              : 'border-white/10 bg-white/5'
          }`}>
            <p className="text-xs text-gray-400 text-center">Créateur</p>
            <p className="text-sm font-bold text-white text-center">
              {battle.creator_side === 'heads' ? '👤 PILE' : '🤖 FACE'}
            </p>
          </div>
          <Zap className="h-5 w-5 text-yellow-500" />
          <div className={`flex-1 px-3 py-2 rounded-lg border-2 ${
            battle.creator_side === 'tails'
              ? 'border-cyan-500 bg-cyan-500/20'
              : 'border-white/10 bg-white/5'
          }`}>
            <p className="text-xs text-gray-400 text-center">Adversaire</p>
            <p className="text-sm font-bold text-white text-center">
              {battle.creator_side === 'tails' ? '👤 PILE' : '🤖 FACE'}
            </p>
          </div>
        </div>

        {!isOwnBattle && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/games/coinflip/${battle.id}`)}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 transition-all flex items-center justify-center gap-2"
          >
            <Users className="h-5 w-5" />
            REJOINDRE
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        )}

        {isOwnBattle && (
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/games/coinflip/${battle.id}`)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-xl shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 transition-all flex items-center justify-center gap-2"
            >
              <Bot className="h-5 w-5" />
              JOUER VS BOT
            </motion.button>
            <p className="text-xs text-gray-500 text-center">
              En attente d'un adversaire ou jouez contre un bot
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}