// app/components/Battles/BattleLootList.tsx - Affichage des gains par joueur
'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { Crown, Trophy, Star, Users, TrendingUp, Coins } from 'lucide-react'

// Types pour les battles
interface BattleOpeningResult {
  id: string
  participant_id: string
  item_id: string
  item_value: number
  item_rarity: string
  box_instance: number
  opened_at: string
  // Relations
  items: {
    id: string
    name: string
    image_url: string | null
    market_value: number
    rarity: string
  }
  battle_participants: {
    id: string
    user_id: string | null
    is_bot: boolean
    bot_name: string | null
    bot_avatar_url: string | null
    position: number
    profiles?: {
      username: string | null
      avatar_url: string | null
    } | null
  }
}

interface BattleLootListProps {
  battleId: string
  currentRound: number
  totalRounds: number
  showOnlyCurrentRound?: boolean
  className?: string
}

interface PlayerStats {
  participantId: string
  playerName: string
  playerAvatar: string
  isBot: boolean
  position: number
  totalValue: number
  itemCount: number
  items: BattleOpeningResult[]
  isWinner: boolean
  rank: number
}

export function BattleLootList({ 
  battleId, 
  currentRound, 
  totalRounds, 
  showOnlyCurrentRound = false,
  className = '' 
}: BattleLootListProps) {
  const [openings, setOpenings] = useState<BattleOpeningResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'current'>('all')
  
  const supabase = createClient()

  // Charger les ouvertures depuis la DB
  const loadBattleOpenings = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('battle_openings')
        .select(`
          id,
          participant_id,
          item_id,
          item_value,
          item_rarity,
          box_instance,
          opened_at,
          items!inner (
            id,
            name,
            image_url,
            market_value,
            rarity
          ),
          battle_participants!inner (
            id,
            user_id,
            is_bot,
            bot_name,
            bot_avatar_url,
            position,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .eq('battle_id', battleId)
        .order('opened_at', { ascending: true })

      if (fetchError) {
        console.error('Erreur chargement ouvertures:', fetchError)
        setError('Impossible de charger les résultats')
        return
      }

      // Transform data to handle arrays from joins
      const transformedData = (data || []).map((opening: any) => ({
        ...opening,
        items: Array.isArray(opening.items) ? opening.items[0] : opening.items,
        battle_participants: Array.isArray(opening.battle_participants)
          ? opening.battle_participants[0]
          : opening.battle_participants
      }))

      setOpenings(transformedData)
      console.log('Ouvertures chargées:', transformedData.length)

    } catch (err) {
      console.error('Erreur critique:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [battleId, supabase])

  // Calculer les stats par joueur
  const playerStats = useMemo((): PlayerStats[] => {
    const statsMap = new Map<string, PlayerStats>()

    // Filtrer par round si nécessaire
    const filteredOpenings = showOnlyCurrentRound || viewMode === 'current' 
      ? openings.filter(opening => opening.box_instance === currentRound)
      : openings

    filteredOpenings.forEach(opening => {
      const participantId = opening.participant_id
      const participant = opening.battle_participants

      if (!statsMap.has(participantId)) {
        statsMap.set(participantId, {
          participantId,
          playerName: participant.is_bot 
            ? participant.bot_name || 'Bot'
            : participant.profiles?.username || 'Joueur',
          playerAvatar: participant.is_bot
            ? participant.bot_avatar_url || '/bot-avatar.png'
            : participant.profiles?.avatar_url || '/default-avatar.png',
          isBot: participant.is_bot,
          position: participant.position,
          totalValue: 0,
          itemCount: 0,
          items: [],
          isWinner: false,
          rank: 0
        })
      }

      const stats = statsMap.get(participantId)!
      stats.totalValue += opening.item_value
      stats.itemCount += 1
      stats.items.push(opening)
    })

    // Convertir en array et calculer les rangs
    const statsArray = Array.from(statsMap.values())
    statsArray.sort((a, b) => b.totalValue - a.totalValue)
    
    // Assigner les rangs
    statsArray.forEach((stats, index) => {
      stats.rank = index + 1
      stats.isWinner = index === 0 && stats.totalValue > 0
    })

    return statsArray.sort((a, b) => a.position - b.position)
  }, [openings, currentRound, showOnlyCurrentRound, viewMode])

  // Fonction pour obtenir la couleur de rareté
  const getRarityColor = useCallback((rarity: string) => {
    const colors = {
      common: '#10b981',
      uncommon: '#3b82f6',
      rare: '#8b5cf6',
      epic: '#d946ef',
      legendary: '#f59e0b'
    }
    return colors[rarity.toLowerCase() as keyof typeof colors] || colors.common
  }, [])

  // Chargement initial et souscription temps réel
  useEffect(() => {
    loadBattleOpenings()

    // Souscription pour les nouvelles ouvertures
    const channel = supabase
      .channel(`battle-openings-${battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_openings',
          filter: `battle_id=eq.${battleId}`
        },
        () => {
          // Recharger quand une nouvelle ouverture arrive
          loadBattleOpenings()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [battleId, loadBattleOpenings, supabase])

  if (loading) {
    return (
      <div className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-300">Chargement des résultats...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="text-center text-red-400">
          <div className="font-bold mb-1">Erreur</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden ${className}`}>
      
      {/* Header avec contrôles */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Résultats de la Battle
          </h3>
          
          <div className="flex items-center gap-3">
            {/* Toggle vue */}
            <div className="flex bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tous les rounds
              </button>
              <button
                onClick={() => setViewMode('current')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'current' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Round {currentRound}
              </button>
            </div>
            
            {/* Info rounds */}
            <div className="text-sm text-gray-400">
              Round {currentRound} / {totalRounds}
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        {playerStats.length > 0 && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">
                {playerStats.reduce((sum, p) => sum + p.totalValue, 0).toFixed(2)}€
              </div>
              <div className="text-xs text-gray-400">Valeur totale</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">
                {playerStats.reduce((sum, p) => sum + p.itemCount, 0)}
              </div>
              <div className="text-xs text-gray-400">Items ouverts</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">
                {playerStats.find(p => p.isWinner)?.playerName || 'En cours'}
              </div>
              <div className="text-xs text-gray-400">Leader actuel</div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des joueurs */}
      <div className="p-6">
        {playerStats.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="font-medium mb-1">Aucun résultat</div>
            <div className="text-sm">Les ouvertures apparaîtront ici</div>
          </div>
        ) : (
          <div className="space-y-4">
            {playerStats.map((player, index) => (
              <PlayerResultCard
                key={player.participantId}
                player={player}
                index={index}
                getRarityColor={getRarityColor}
                viewMode={viewMode}
                currentRound={currentRound}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant pour afficher les résultats d'un joueur
interface PlayerResultCardProps {
  player: PlayerStats
  index: number
  getRarityColor: (rarity: string) => string
  viewMode: 'all' | 'current'
  currentRound: number
}

function PlayerResultCard({ 
  player, 
  index, 
  getRarityColor, 
  viewMode,
  currentRound 
}: PlayerResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Items à afficher selon le mode
  const displayItems = useMemo(() => {
    if (viewMode === 'current') {
      return player.items.filter(item => item.box_instance === currentRound)
    }
    return player.items
  }, [player.items, viewMode, currentRound])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />
      case 2: return <Star className="w-5 h-5 text-gray-400" />
      case 3: return <Star className="w-5 h-5 text-orange-600" />
      default: return <div className="w-5 h-5 flex items-center justify-center text-gray-500 font-bold text-sm">#{rank}</div>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'border-yellow-400/50 bg-yellow-400/10'
      case 2: return 'border-gray-400/50 bg-gray-400/10'
      case 3: return 'border-orange-600/50 bg-orange-600/10'
      default: return 'border-slate-600/50 bg-slate-700/30'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`border rounded-lg transition-all duration-300 ${getRankColor(player.rank)} ${
        isExpanded ? 'ring-2 ring-blue-500/30' : ''
      }`}
    >
      {/* Header du joueur */}
      <div 
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          
          {/* Rang */}
          <div className="flex-shrink-0">
            {getRankIcon(player.rank)}
          </div>

          {/* Avatar et info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img
                src={player.playerAvatar}
                alt={player.playerName}
                className="w-10 h-10 rounded-full border-2 border-slate-600"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = player.isBot ? '/bot-avatar.png' : '/default-avatar.png'
                }}
              />
              {player.isBot && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{player.playerName}</span>
                {player.isBot && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                    Bot
                  </span>
                )}
                {player.rank === 1 && player.totalValue > 0 && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                    Leader
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                Position #{player.position}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-right">
            <div>
              <div className="text-lg font-bold text-white">
                {player.totalValue.toFixed(2)}€
              </div>
              <div className="text-xs text-gray-400">
                {displayItems.length} item{displayItems.length > 1 ? 's' : ''}
              </div>
            </div>

            {/* Indicateur expansion */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400"
            >
              ▼
            </motion.div>
          </div>
        </div>
      </div>

      {/* Items détaillés */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-600/50 overflow-hidden"
          >
            <div className="p-4">
              {displayItems.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <div className="text-sm">Aucun item pour cette vue</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {displayItems.map((item, itemIndex) => (
                    <motion.div
                      key={`${item.id}-${itemIndex}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: itemIndex * 0.05 }}
                      className="bg-slate-800/50 border border-slate-600/50 rounded-lg p-3 text-center hover:border-slate-500/50 transition-colors"
                    >
                      {/* Image */}
                      <div className="relative mb-2">
                        <img
                          src={item.items.image_url || '/placeholder-item.png'}
                          alt={item.items.name}
                          className="w-full h-16 object-contain"
                          style={{
                            filter: `drop-shadow(0 4px 8px ${getRarityColor(item.item_rarity)}40)`
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-item.png'
                          }}
                        />
                        
                        {/* Badge round */}
                        {viewMode === 'all' && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {item.box_instance}
                          </div>
                        )}
                      </div>

                      {/* Nom */}
                      <div className="text-xs font-medium text-white mb-1 truncate" title={item.items.name}>
                        {item.items.name}
                      </div>

                      {/* Valeur */}
                      <div className="flex items-center justify-center gap-1">
                        <Coins 
                          className="w-3 h-3" 
                          style={{ color: getRarityColor(item.item_rarity) }}
                        />
                        <span 
                          className="text-sm font-bold"
                          style={{ color: getRarityColor(item.item_rarity) }}
                        >
                          {item.item_value.toFixed(2)}€
                        </span>
                      </div>

                      {/* Rareté */}
                      <div 
                        className="text-xs mt-1 px-1 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${getRarityColor(item.item_rarity)}20`,
                          color: getRarityColor(item.item_rarity)
                        }}
                      >
                        {item.item_rarity}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default BattleLootList