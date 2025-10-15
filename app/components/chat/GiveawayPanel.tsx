import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Profile {
  id: string;
  username?: string;
  level?: number;
  is_banned?: boolean;
}

interface User {
  id: string;
  email?: string;
}

interface Giveaway {
  id: string;
  title: string;
  total_amount: number;
  winners_count: number;
  ends_at: string;
  profiles?: Profile;
  chat_giveaway_participants_new?: Array<{ user_id: string }>;
}

interface GiveawayPanelProps {
  giveaways: Giveaway[];
  user: User | null;
  profile: Profile | null;
  onJoinGiveaway: (giveawayId: string, captchaToken: string) => Promise<any>;
}

const GiveawayPanel: React.FC<GiveawayPanelProps> = ({ giveaways, user, profile, onJoinGiveaway }) => {
  const [joiningGiveaway, setJoiningGiveaway] = useState<string | null>(null)

  const handleJoinGiveaway = async (giveawayId: string): Promise<void> => {
    // Vérification du niveau
    if (!profile || (profile.level || 0) < 5) {
      alert('Vous devez être niveau 5 minimum pour participer aux giveaways')
      return
    }

    if (profile.is_banned) {
      alert('Vous ne pouvez pas participer aux giveaways car vous êtes banni')
      return
    }

    // Simulation du captcha (à remplacer par un vrai captcha)
    const captchaToken = await new Promise<string>((resolve) => {
      const token = `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setTimeout(() => resolve(token), 1000) // Simulation d'une vérification
    })

    try {
      setJoiningGiveaway(giveawayId)
      const result = await onJoinGiveaway(giveawayId, captchaToken)
      alert('✅ Participation confirmée ! Bonne chance !')
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message)
    } finally {
      setJoiningGiveaway(null)
    }
  }

  if (giveaways.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">🎁</div>
        <h3 className="text-lg font-semibold mb-2">Aucun giveaway actif</h3>
        <p className="text-sm">
          Les giveaways apparaîtront ici quand les admins en lanceront.
          Restez connecté !
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🎉 Giveaways Actifs ({giveaways.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Niveau minimum requis: 5
        </p>
      </div>

      {giveaways.map((giveaway) => (
        <GiveawayCard
          key={giveaway.id}
          giveaway={giveaway}
          user={user}
          profile={profile}
          onJoin={handleJoinGiveaway}
          isJoining={joiningGiveaway === giveaway.id}
        />
      ))}
    </div>
  )
}

interface GiveawayCardProps {
  giveaway: Giveaway;
  user: User | null;
  profile: Profile | null;
  onJoin: (giveawayId: string) => Promise<void>;
  isJoining: boolean;
}

const GiveawayCard: React.FC<GiveawayCardProps> = ({ giveaway, user, profile, onJoin, isJoining }) => {
  const timeRemaining = new Date(giveaway.ends_at).getTime() - new Date().getTime()
  const isExpired = timeRemaining <= 0

  // Vérifier si l'utilisateur a déjà participé
  const hasParticipated = giveaway.chat_giveaway_participants_new?.some(
    p => p.user_id === user?.id
  )

  const participantsCount = giveaway.chat_giveaway_participants_new?.length || 0

  const canParticipate = profile &&
    (profile.level || 0) >= 5 &&
    !profile.is_banned &&
    !hasParticipated &&
    !isExpired

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            🏆 {giveaway.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Par {giveaway.profiles?.username || 'Admin'}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            💰 {giveaway.total_amount.toLocaleString()} coins
          </div>
          <div className="text-xs text-gray-500">
            {giveaway.winners_count} gagnant{giveaway.winners_count > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Infos */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">⏰ Se termine:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {isExpired ? (
              <span className="text-red-600">Terminé</span>
            ) : (
              formatDistanceToNow(new Date(giveaway.ends_at), { 
                addSuffix: true, 
                locale: fr 
              })
            )}
          </div>
        </div>
        
        <div>
          <span className="text-gray-600 dark:text-gray-400">👥 Participants:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {participantsCount}
          </div>
        </div>
      </div>

      {/* État de participation */}
      {hasParticipated && (
        <div className="mb-3 p-2 bg-green-100 dark:bg-green-800/20 border border-green-300 dark:border-green-600 rounded text-center">
          <span className="text-green-800 dark:text-green-200 text-sm font-medium">
            ✅ Vous participez déjà !
          </span>
        </div>
      )}

      {/* Bouton de participation */}
      <div className="flex space-x-2">
        {canParticipate ? (
          <button
            onClick={() => onJoin(giveaway.id)}
            disabled={isJoining}
            className="
              flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
              text-white font-semibold py-2 px-4 rounded-md transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              transform hover:scale-[1.02] active:scale-[0.98]
            "
          >
            {isJoining ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Vérification...</span>
              </span>
            ) : (
              '🎯 Rejoindre le Giveaway'
            )}
          </button>
        ) : (
          <div className="flex-1 text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-sm">
            {isExpired ? '⏰ Terminé' :
             hasParticipated ? '✅ Déjà inscrit' :
             !profile || (profile.level || 0) < 5 ? '📊 Niveau 5 requis' :
             profile.is_banned ? '❌ Banni' :
             '❌ Non éligible'}
          </div>
        )}
        
        <button
          onClick={() => {
            const timeLeft = Math.max(0, new Date(giveaway.ends_at).getTime() - new Date().getTime())
            const minutes = Math.floor(timeLeft / 60000)
            const seconds = Math.floor((timeLeft % 60000) / 1000)
            alert(`⏰ Temps restant: ${minutes}m ${seconds}s\n👥 Participants: ${participantsCount}\n🎯 Vos chances: ${participantsCount > 0 ? Math.round(giveaway.winners_count / participantsCount * 100) : 100}%`)
          }}
          className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          title="Informations détaillées"
        >
          ℹ️
        </button>
      </div>
    </div>
  )
}

export default GiveawayPanel
