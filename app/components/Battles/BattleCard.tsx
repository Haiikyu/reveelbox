// app/components/Battles/BattleCard.tsx - Carte pour afficher une battle dans la liste
'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Users, Eye, Crown, Zap, Timer, Trophy, Star, Sword, 
  Lock, Bot, User, Play, Clock, Coins 
} from 'lucide-react'

// Types pour les battles
interface BattleParticipant {
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

interface BattleBox {
  id: string
  loot_box_id: string
  quantity: number
  cost_per_box: number
  loot_boxes: {
    id: string
    name: string
    image_url: string | null
    price_virtual: number
  } | null
}

interface Battle {
  id: string
  name: string
  mode: 'classic' | 'crazy' | 'shared' | 'fast' | 'jackpot' | 'terminal' | 'clutch'
  max_players: number
  entry_cost: number
  total_prize: number
  status: 'waiting' | 'countdown' | 'active' | 'finished' | 'cancelled' | 'expired'
  is_private: boolean
  total_boxes: number
  current_box: number
  expires_at: string | null
  created_at: string | null
  creator_id: string | null
  participants: BattleParticipant[]
  battle_boxes: BattleBox[]
}

interface BattleCardProps {
  battle: Battle
  currentUserId?: string
  onJoin: (battleId: string, needsPassword: boolean) => Promise<void>
  onSpectate: (battleId: string) => void
  index?: number
  className?: string
}

// Configuration des modes avec icônes et couleurs
const MODE_CONFIGS = {
  classic: { icon: Crown, color: '#3B82F6', name: 'Classic', description: 'Plus haute valeur gagne' },
  crazy: { icon: Zap, color: '#8B5CF6', name: 'Crazy', description: 'Plus basse valeur gagne' },
  shared: { icon: Users, color: '#10B981', name: 'Shared', description: 'Partage équitable' },
  fast: { icon: Timer, color: '#F59E0B', name: 'Fast', description: 'Animations rapides' },
  jackpot: { icon: Trophy, color: '#F97316', name: 'Jackpot', description: 'Sélection pondérée' },
  terminal: { icon: Star, color: '#EF4444', name: 'Terminal', description: 'Dernière box compte' },
  clutch: { icon: Sword, color: '#EC4899', name: 'Clutch', description: 'Plus gros item gagne' }
} as const

export function BattleCard({ 
  battle, 
  currentUserId, 
  onJoin, 
  onSpectate, 
  index = 0,
  className = '' 
}: BattleCardProps) {
  const [joining, setJoining] = useState(false)
  const router = useRouter()

  // Configuration du mode
  const modeConfig = MODE_CONFIGS[battle.mode] || MODE_CONFIGS.classic
  const ModeIcon = modeConfig.icon

  // Stats calculées
  const participantCount = battle.participants.length
  const canJoin = battle.status === 'waiting' && participantCount < battle.max_players
  const isCreator = battle.creator_id === currentUserId
  const isParticipant = battle.participants.some(p => p.user_id === currentUserId)
  const slotsRemaining = battle.max_players - participantCount
  
  // Calcul du temps restant
  const timeRemaining = useMemo(() => {
    if (!battle.expires_at) return null
    
    const now = new Date()
    const expires = new Date(battle.expires_at)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expiré'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}min`
    return `${minutes}min`
  }, [battle.expires_at])

  // Fonction pour rejoindre
  const handleJoin = useCallback(async () => {
    if (joining || !canJoin) return

    try {
      setJoining(true)
      await onJoin(battle.id, battle.is_private)
    } catch (error) {
      console.error('Erreur rejoindre battle:', error)
    } finally {
      setJoining(false)
    }
  }, [joining, canJoin, onJoin, battle.id, battle.is_private])

  // Fonction pour spectater
  const handleSpectate = useCallback(() => {
    onSpectate(battle.id)
  }, [onSpectate, battle.id])

  // Entrer dans la battle si participant
  const handleEnterBattle = useCallback(() => {
    router.push(`/battles/${battle.id}`)
  }, [router, battle.id])

  // Statut display
  const getStatusDisplay = () => {
    switch (battle.status) {
      case 'waiting':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full border border-yellow-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        )
      case 'countdown':
        return (
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full border border-orange-500/30 flex items-center gap-1">
            <Timer className="w-3 h-3" />
            Démarrage...
          </span>
        )
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            En cours
          </span>
        )
      case 'finished':
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-sm rounded-full border border-gray-500/30">
            Terminée
          </span>
        )
      default:
        return null
    }
  }

  // Bouton d'action principal
  const getActionButton = () => {
    // Si on est participant et que la battle est active/waiting
    if (isParticipant && (battle.status === 'waiting' || battle.status === 'active' || battle.status === 'countdown')) {
      return (
        <button
          onClick={handleEnterBattle}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg font-bold text-sm hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 text-white"
        >
          <div className="flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            ENTRER DANS LA BATTLE
          </div>
        </button>
      )
    }

    // Si on peut rejoindre
    if (canJoin && !isCreator) {
      return (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg font-bold text-sm hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        >
          {joining ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              CONNEXION...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              REJOINDRE ({battle.entry_cost}€)
            </div>
          )}
        </button>
      )
    }

    // Sinon, bouton spectateur
    return (
      <button
        onClick={handleSpectate}
        className="w-full px-4 py-3 bg-slate-700 rounded-lg font-bold text-sm hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 text-white"
      >
        <Eye className="w-4 h-4" />
        REGARDER
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all group ${className}`}
    >
      <div className="p-6">
        <div className="flex gap-6">
          
          {/* Section mode et icône */}
          <div className="flex flex-col items-center min-w-[100px]">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-3 border-2 group-hover:scale-105 transition-transform"
              style={{ 
                backgroundColor: `${modeConfig.color}15`, 
                borderColor: `${modeConfig.color}40`
              }}
            >
              <ModeIcon 
                className="w-8 h-8" 
                style={{ color: modeConfig.color }} 
              />
            </div>
            
            <div className="text-center">
              <div 
                className="text-sm font-bold mb-1"
                style={{ color: modeConfig.color }}
              >
                {modeConfig.name}
              </div>
              <div className="text-xs text-gray-400">
                {battle.entry_cost}€
              </div>
            </div>
          </div>

          <div className="w-px bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors"></div>

          {/* Informations principales */}
          <div className="flex-1">
            
            {/* Header avec nom et badges */}
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                {battle.name}
              </h3>
              
              {getStatusDisplay()}

              {battle.is_private && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Privé
                </span>
              )}

              {isCreator && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                  Créateur
                </span>
              )}

              {isParticipant && !isCreator && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  Participant
                </span>
              )}
            </div>

            {/* Stats de la battle */}
            <div className="grid grid-cols-4 gap-4 text-sm text-gray-400 mb-4">
              <div>
                <span className="text-white font-medium">{participantCount}</span>/{battle.max_players} joueurs
              </div>
              <div>
                <span className="text-white font-medium">{battle.total_boxes}</span> boxes
              </div>
              <div>
                Prize: <span className="text-yellow-400 font-medium">{battle.total_prize.toFixed(2)}€</span>
              </div>
              {timeRemaining && battle.status === 'waiting' && (
                <div>
                  Expire: <span className="text-red-400 font-medium">{timeRemaining}</span>
                </div>
              )}
            </div>

            {/* Barre de progression des joueurs */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Joueurs</span>
                <span>{participantCount}/{battle.max_players}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${(participantCount / battle.max_players) * 100}%` }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: [-100, 100] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Aperçu des participants */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-400">Participants:</span>
              <div className="flex -space-x-2">
                {battle.participants.slice(0, 6).map((participant, idx) => (
                  <div key={participant.id} className="relative group/avatar">
                    <img
                      src={
                        participant.is_bot 
                          ? participant.bot_avatar_url || '/bot-avatar.png'
                          : participant.profiles?.avatar_url || '/default-avatar.png'
                      }
                      alt={
                        participant.is_bot 
                          ? participant.bot_name || 'Bot'
                          : participant.profiles?.username || 'Joueur'
                      }
                      className="w-8 h-8 rounded-full border-2 border-slate-800 group-hover/avatar:border-blue-500 transition-colors"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = participant.is_bot ? '/bot-avatar.png' : '/default-avatar.png'
                      }}
                    />
                    {participant.is_bot && (
                      <Bot className="absolute -bottom-1 -right-1 w-3 h-3 text-purple-400" />
                    )}
                    {participant.user_id === currentUserId && (
                      <User className="absolute -bottom-1 -right-1 w-3 h-3 text-blue-400" />
                    )}
                  </div>
                ))}
                {slotsRemaining > 0 && (
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                    <span className="text-xs text-gray-500">+{slotsRemaining}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu des loot boxes */}
            {battle.battle_boxes.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Loot Boxes:</div>
                <div className="flex gap-2">
                  {battle.battle_boxes.slice(0, 4).map((box, idx) => (
                    <div key={box.id} className="relative group/box">
                      <img
                        src={box.loot_boxes?.image_url || '/mystery-box.png'}
                        alt={box.loot_boxes?.name || 'Mystery Box'}
                        className="w-10 h-10 object-contain rounded border border-slate-600 group-hover/box:border-blue-500 transition-colors"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/mystery-box.png'
                        }}
                      />
                      {box.quantity > 1 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {box.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                  {battle.battle_boxes.length > 4 && (
                    <div className="w-10 h-10 border border-dashed border-gray-500 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{battle.battle_boxes.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors"></div>

          {/* Section action */}
          <div className="min-w-[180px] text-center">
            
            {/* Prix total */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Total Prize</div>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                {battle.total_prize.toFixed(2)}€
              </div>
            </div>

            {/* Description du mode */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Mode</div>
              <div className="text-xs text-gray-300 leading-tight">
                {modeConfig.description}
              </div>
            </div>

            {/* Bouton d'action */}
            {getActionButton()}

            {/* Infos supplémentaires selon le statut */}
            {battle.status === 'waiting' && slotsRemaining > 0 && (
              <div className="mt-3 text-xs text-gray-400">
                {slotsRemaining} slot{slotsRemaining > 1 ? 's' : ''} libre{slotsRemaining > 1 ? 's' : ''}
              </div>
            )}

            {battle.status === 'active' && (
              <div className="mt-3 text-xs text-green-400">
                Round {battle.current_box || 1} / {battle.total_boxes}
              </div>
            )}

            {battle.status === 'finished' && (
              <div className="mt-3 text-xs text-gray-400">
                Battle terminée
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre de progression en bas pour les battles actives */}
      {battle.status === 'active' && (
        <div className="px-6 pb-4">
          <div className="w-full bg-slate-700/50 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${((battle.current_box || 1) / battle.total_boxes) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default BattleCard