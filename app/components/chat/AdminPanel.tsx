import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AdminPanelProps {
  onCreateGiveaway: (data: any) => Promise<void>
  onCompleteGiveaway: (giveawayId: string) => Promise<void>
  onCancelGiveaway: (giveawayId: string) => Promise<void>
  activeGiveaways: any[]
}

const AdminPanel = ({
  onCreateGiveaway,
  onCompleteGiveaway,
  onCancelGiveaway,
  activeGiveaways
}: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('create') // 'create', 'manage'
  
  return (
    <div className="h-full flex flex-col">
      {/* Onglets Admin */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          ➕ Créer
        </button>
        
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'manage'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          ⚙️ Gérer ({activeGiveaways.length})
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'create' && (
          <CreateGiveawayForm onCreateGiveaway={onCreateGiveaway} />
        )}
        
        {activeTab === 'manage' && (
          <ManageGiveaways
            activeGiveaways={activeGiveaways}
            onCompleteGiveaway={onCompleteGiveaway}
            onCancelGiveaway={onCancelGiveaway}
          />
        )}
      </div>
    </div>
  )
}

interface CreateGiveawayFormProps {
  onCreateGiveaway: (data: any) => Promise<void>
}

const CreateGiveawayForm = ({ onCreateGiveaway }: CreateGiveawayFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    totalAmount: '',
    winnersCount: '1',
    durationMinutes: '30'
  })
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Veuillez saisir un titre')
      return
    }

    const totalAmount = parseInt(formData.totalAmount)
    const winnersCount = parseInt(formData.winnersCount)
    const durationMinutes = parseInt(formData.durationMinutes)

    if (totalAmount < 1 || totalAmount > 1000000) {
      alert('Le montant doit être entre 1 et 1,000,000 coins')
      return
    }

    if (winnersCount < 1 || winnersCount > 100) {
      alert('Le nombre de gagnants doit être entre 1 et 100')
      return
    }

    if (durationMinutes < 1 || durationMinutes > 1440) {
      alert('La durée doit être entre 1 minute et 24 heures')
      return
    }

    try {
      setCreating(true)
      await onCreateGiveaway({
        title: formData.title.trim(),
        totalAmount,
        winnersCount,
        durationMinutes
      })

      // Reset form
      setFormData({
        title: '',
        totalAmount: '',
        winnersCount: '1',
        durationMinutes: '30'
      })

      alert('✅ Giveaway créé avec succès !')
    } catch (error: any) {
      alert('❌ Erreur: ' + (error?.message || 'Erreur inconnue'))
    } finally {
      setCreating(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Calcul de la distribution des prix en temps réel
  const calculatePreview = () => {
    const total = parseInt(formData.totalAmount) || 0
    const winners = parseInt(formData.winnersCount) || 1
    
    if (total <= 0 || winners <= 0) return []

    const prizes = []
    let remaining = total

    if (winners >= 1) {
      const firstPrize = Math.floor(total * 0.4)
      prizes.push(firstPrize)
      remaining -= firstPrize
    }

    if (winners >= 2) {
      const secondPrize = Math.floor(total * 0.25)
      prizes.push(secondPrize)
      remaining -= secondPrize
    }

    if (winners >= 3) {
      const thirdPrize = Math.floor(total * 0.15)
      prizes.push(thirdPrize)
      remaining -= thirdPrize
    }

    const remainingWinners = winners - prizes.length
    if (remainingWinners > 0) {
      const equalPrize = Math.floor(remaining / remainingWinners)
      for (let i = 0; i < remainingWinners; i++) {
        prizes.push(equalPrize)
      }
    }

    return prizes
  }

  const prizePreview = calculatePreview()

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🎯 Créer un Giveaway
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lancez un giveaway pour votre communauté
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📝 Titre du Giveaway
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="ex: Giveaway de fin de semaine"
            maxLength={200}
            className="
              w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-purple-500 focus:border-transparent
            "
            required
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.title.length}/200 caractères
          </div>
        </div>

        {/* Montant total */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            💰 Montant Total (coins)
          </label>
          <input
            type="number"
            value={formData.totalAmount}
            onChange={(e) => handleChange('totalAmount', e.target.value)}
            placeholder="1000"
            min="1"
            max="1000000"
            className="
              w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-purple-500 focus:border-transparent
            "
            required
          />
        </div>

        {/* Nombre de gagnants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            👥 Nombre de Gagnants
          </label>
          <select
            value={formData.winnersCount}
            onChange={(e) => handleChange('winnersCount', e.target.value)}
            className="
              w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-purple-500 focus:border-transparent
            "
          >
            {[1,2,3,4,5,10,15,20,25,50].map(num => (
              <option key={num} value={num}>{num} gagnant{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {/* Durée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ⏰ Durée (minutes)
          </label>
          <select
            value={formData.durationMinutes}
            onChange={(e) => handleChange('durationMinutes', e.target.value)}
            className="
              w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:ring-2 focus:ring-purple-500 focus:border-transparent
            "
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 heure</option>
            <option value="120">2 heures</option>
            <option value="240">4 heures</option>
            <option value="480">8 heures</option>
            <option value="1440">24 heures</option>
          </select>
        </div>

        {/* Aperçu de la distribution */}
        {prizePreview.length > 0 && formData.totalAmount && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-600 rounded-md p-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              🎁 Aperçu de la Distribution:
            </h4>
            <div className="space-y-1 text-sm">
              {prizePreview.map((prize, index) => {
                const position = index + 1
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🎆'
                return (
                  <div key={index} className="flex justify-between">
                    <span>{medal} {position}er prix:</span>
                    <span className="font-semibold">{prize.toLocaleString()} coins</span>
                  </div>
                )
              })}
              <div className="border-t pt-1 mt-2 flex justify-between font-semibold">
                <span>💰 Total distribué:</span>
                <span>{prizePreview.reduce((sum, p) => sum + p, 0).toLocaleString()} coins</span>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de création */}
        <button
          type="submit"
          disabled={creating || !formData.title.trim() || !formData.totalAmount}
          className="
            w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
            text-white font-semibold py-3 px-4 rounded-md transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            transform hover:scale-[1.02] active:scale-[0.98]
          "
        >
          {creating ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Création en cours...</span>
            </span>
          ) : (
            '🚀 Lancer le Giveaway'
          )}
        </button>
      </form>
    </div>
  )
}

interface ManageGiveawaysProps {
  activeGiveaways: any[]
  onCompleteGiveaway: (giveawayId: string) => Promise<void>
  onCancelGiveaway: (giveawayId: string) => Promise<void>
}

const ManageGiveaways = ({ activeGiveaways, onCompleteGiveaway, onCancelGiveaway }: ManageGiveawaysProps) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleComplete = async (giveawayId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer ce giveaway maintenant ?')) {
      return
    }

    try {
      setActionLoading(`complete-${giveawayId}`)
      await onCompleteGiveaway(giveawayId)
      alert('✅ Giveaway terminé avec succès !')
    } catch (error: any) {
      alert('❌ Erreur: ' + (error?.message || 'Erreur inconnue'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (giveawayId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce giveaway ?')) {
      return
    }

    try {
      setActionLoading(`cancel-${giveawayId}`)
      await onCancelGiveaway(giveawayId)
      alert('✅ Giveaway annulé avec succès !')
    } catch (error: any) {
      alert('❌ Erreur: ' + (error?.message || 'Erreur inconnue'))
    } finally {
      setActionLoading(null)
    }
  }

  if (activeGiveaways.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">⚙️</div>
        <h3 className="text-lg font-semibold mb-2">Aucun giveaway à gérer</h3>
        <p className="text-sm">
          Les giveaways actifs apparaîtront ici pour que vous puissiez les gérer.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          ⚙️ Gestion des Giveaways ({activeGiveaways.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Terminez ou annulez les giveaways actifs
        </p>
      </div>

      {activeGiveaways.map((giveaway) => (
        <div
          key={giveaway.id}
          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800"
        >
          {/* Info du giveaway */}
          <div className="mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              🏆 {giveaway.title}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>💰 {giveaway.total_amount.toLocaleString()} coins</div>
              <div>👥 {giveaway.winners_count} gagnant{giveaway.winners_count > 1 ? 's' : ''}</div>
              <div>
                ⏰ Se termine {formatDistanceToNow(new Date(giveaway.ends_at), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </div>
              <div>📊 {giveaway.chat_giveaway_participants_new?.length || 0} participants</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleComplete(giveaway.id)}
              disabled={actionLoading === `complete-${giveaway.id}`}
              className="
                flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              "
            >
              {actionLoading === `complete-${giveaway.id}` ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Tirage...</span>
                </span>
              ) : (
                '🎯 Terminer maintenant'
              )}
            </button>

            <button
              onClick={() => handleCancel(giveaway.id)}
              disabled={actionLoading === `cancel-${giveaway.id}`}
              className="
                flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-3 rounded
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors
              "
            >
              {actionLoading === `cancel-${giveaway.id}` ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Annulation...</span>
                </span>
              ) : (
                '❌ Annuler'
              )}
            </button>

            <button
              onClick={() => {
                const participants = giveaway.chat_giveaway_participants_new?.length || 0
                const timeLeft = Math.max(0, new Date(giveaway.ends_at).getTime() - new Date().getTime())
                const minutes = Math.floor(timeLeft / 60000)
                const seconds = Math.floor((timeLeft % 60000) / 1000)
                
                alert(`📊 Statistiques détaillées:
                
🏆 Titre: ${giveaway.title}
💰 Prize Pool: ${giveaway.total_amount.toLocaleString()} coins
👥 Participants actuels: ${participants}
🎯 Gagnants prévus: ${giveaway.winners_count}
⏰ Temps restant: ${minutes}m ${seconds}s
📈 Taux de participation: ${participants > 0 ? Math.round(giveaway.winners_count / participants * 100) : 0}%
📅 Créé le: ${new Date(giveaway.created_at).toLocaleString('fr-FR')}`)
              }}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="Statistiques détaillées"
            >
              📊
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AdminPanel