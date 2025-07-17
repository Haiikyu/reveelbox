// app/profile/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '../components/AuthProvider'
import { updateProfile, supabase } from '@/lib/supabase'
import { User, Mail, Coins, Trophy, Edit2, Save, X, Gift, Sparkles } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (profile) {
      setUsername(profile.username || '')
    }
  }, [user, profile, router])

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Le nom d\'utilisateur ne peut pas être vide')
      return
    }

    setError('')
    setSaving(true)

    const { data, error } = await updateProfile(user.id, { username })
    
    if (error) {
      setError('Erreur lors de la mise à jour du profil')
    } else {
      await refreshProfile()
      setEditing(false)
    }
    
    setSaving(false)
  }

  const handleClaimBonus = async (bonusType) => {
    setClaiming(true)
    
    const { data, error } = await supabase.rpc('claim_loyalty_bonus', {
      p_user_id: user.id,
      p_bonus_type: bonusType
    })
    
    if (data?.success) {
      await refreshProfile()
    } else {
      setError(data?.error || 'Erreur lors de la réclamation du bonus')
    }
    
    setClaiming(false)
  }

  const loyaltyRewards = [
    {
      type: 'small',
      points: 100,
      coins: 50,
      icon: '🥉',
      color: 'from-orange-600 to-orange-400'
    },
    {
      type: 'medium',
      points: 500,
      coins: 300,
      icon: '🥈',
      color: 'from-gray-500 to-gray-300'
    },
    {
      type: 'large',
      points: 1000,
      coins: 700,
      icon: '🥇',
      color: 'from-yellow-600 to-yellow-400'
    }
  ]

  if (!profile) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20"
      >
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <User className="w-8 h-8 text-purple-500" />
            <span>Mon Profil</span>
          </h1>
          
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-gray-400 text-sm">Nom d'utilisateur</label>
            {editing ? (
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Choisissez un nom"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setUsername(profile.username || '')
                    setError('')
                  }}
                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <p className="text-white text-lg mt-1">{profile.username || 'Non défini'}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-400 text-sm flex items-center space-x-1">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </label>
            <p className="text-white text-lg mt-1">{user.email}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Solde</p>
                  <p className="text-2xl font-bold text-yellow-500 flex items-center space-x-1">
                    <Coins className="w-6 h-6" />
                    <span>{profile.virtual_currency}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Points de fidélité</p>
                  <p className="text-2xl font-bold text-purple-500 flex items-center space-x-1">
                    <Trophy className="w-6 h-6" />
                    <span>{profile.loyalty_points}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loyalty Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Gift className="w-6 h-6 text-purple-500" />
          <span>Récompenses de fidélité</span>
        </h2>

        <p className="text-gray-400 mb-6">
          Échangez vos points de fidélité contre des coins gratuits !
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          {loyaltyRewards.map((reward, index) => {
            const canClaim = profile.loyalty_points >= reward.points
            
            return (
              <motion.div
                key={reward.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                className={`relative bg-gray-700/50 rounded-xl p-6 border ${
                  canClaim ? 'border-purple-500' : 'border-gray-600'
                } transition-all duration-300`}
              >
                <div className="text-center space-y-4">
                  <div className="text-4xl">{reward.icon}</div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Coût</p>
                    <p className="text-lg font-bold text-purple-400">
                      {reward.points} points
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Récompense</p>
                    <p className="text-xl font-bold text-yellow-500 flex items-center justify-center space-x-1">
                      <Coins className="w-5 h-5" />
                      <span>{reward.coins}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleClaimBonus(reward.type)}
                    disabled={!canClaim || claiming}
                    className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 ${
                      canClaim
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/25'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {claiming ? 'Réclamation...' : canClaim ? 'Réclamer' : 'Points insuffisants'}
                  </button>
                </div>

                {canClaim && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-purple-600/10 rounded-xl border border-purple-500/20">
          <p className="text-sm text-purple-300">
            💡 Astuce: Gagnez des points en ouvrant des loot boxes ! 
            Plus l'objet est rare, plus vous gagnez de points.
          </p>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Informations du compte</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Membre depuis</span>
            <span className="text-white">
              {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ID utilisateur</span>
            <span className="text-white font-mono text-xs">{user.id}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}