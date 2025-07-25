'use client'

import { useAuth } from '../../components/AuthProvider'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Sword, Users, Lock, Globe, Settings, Check,
  Trophy, Gift, Coins, AlertCircle, CheckCircle,
  Loader2, Sparkles, X
} from 'lucide-react'

// ✅ TYPES TYPESCRIPT CORRIGES
interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  price_real: number
  image_url: string
  category: string
  rarity: string
  is_active: boolean
}

interface SelectedBox {
  box: LootBox
  quantity: number
}

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
}

interface BattleConfig {
  mode: '1v1' | '2v2' | 'group'
  isPrivate: boolean
  password?: string
  selectedBoxes: SelectedBox[]
}

export default function CreateBattlePage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [notification, setNotification] = useState<Notification>({ type: 'info', message: '' })
  
  const [battleConfig, setBattleConfig] = useState<BattleConfig>({
    mode: '1v1',
    isPrivate: false,
    selectedBoxes: []
  })

  const supabase = createClient()
  const router = useRouter()

  // ✅ FONCTION NOTIFICATION TYPEE
  const showNotification = (type: Notification['type'], message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: 'info', message: '' }), 4000)
  }

  // Protection de route standard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!authLoading && isAuthenticated) {
      loadData()
    }
  }, [authLoading, isAuthenticated, router])

  const loadData = async () => {
    try {
      setLoading(true)

      // Charger les loot boxes actives (non gratuites)
      const { data: boxes, error } = await supabase
        .from('loot_boxes')
        .select('*')
        .eq('is_active', true)
        .neq('is_daily_free', true)
        .order('price_virtual', { ascending: true })

      if (error) {
        console.warn('Erreur chargement loot boxes:', error)
        
        // Fallback avec données de test si erreur
        const fallbackBoxes: LootBox[] = [
          {
            id: 'demo-starter',
            name: 'STARTER ESSENTIALS',
            description: 'Parfait pour commencer sa collection',
            price_virtual: 120,
            price_real: 4.99,
            image_url: 'https://i.imgur.com/8YwZmtP.png',
            category: 'sneaker',
            rarity: 'common',
            is_active: true
          },
          {
            id: 'demo-daily',
            name: 'DAILY MYSTERIES',
            description: 'Surprises quotidiennes et bonus...',
            price_virtual: 150,
            price_real: 6.99,
            image_url: 'https://i.imgur.com/8YwZmtP.png',
            category: 'sneaker',
            rarity: 'rare',
            is_active: true
          }
        ]
        
        setLootBoxes(fallbackBoxes)
        showNotification('error', 'Données de test utilisées - Vérifiez votre configuration')
      } else {
        setLootBoxes(boxes || [])
        if (boxes && boxes.length > 0) {
          showNotification('success', `${boxes.length} loot boxes chargées`)
        }
      }

    } catch (error) {
      console.error('Erreur chargement:', error)
      showNotification('error', 'Erreur lors du chargement')
      
      // Fallback d'urgence
      const emergencyBoxes: LootBox[] = [
        {
          id: 'emergency-box',
          name: 'Caisse Aventurier',
          description: 'Pour les explorateurs expérimentés',
          price_virtual: 100,
          price_real: 4.99,
          image_url: 'https://i.imgur.com/8YwZmtP.png',
          category: 'sneaker',
          rarity: 'common',
          is_active: true
        }
      ]
      setLootBoxes(emergencyBoxes)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FONCTIONS UTILITAIRES TYPEES
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500'
      case 'epic': return 'from-purple-400 to-pink-500'
      case 'rare': return 'from-blue-400 to-cyan-500'
      default: return 'from-green-400 to-emerald-500'
    }
  }

  const getRarityBadge = (rarity: string): { color: string; text: string } => {
    switch (rarity) {
      case 'legendary': return { color: 'bg-gradient-to-r from-yellow-500 to-orange-500', text: 'MYTHIC' }
      case 'epic': return { color: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'EPIC' }
      case 'rare': return { color: 'bg-gradient-to-r from-blue-500 to-cyan-500', text: 'RARE' }
      default: return { color: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'COMMON' }
    }
  }

  const toggleBoxSelection = (box: LootBox) => {
    setBattleConfig(prev => {
      const existingIndex = prev.selectedBoxes.findIndex(sb => sb.box.id === box.id)
      
      if (existingIndex >= 0) {
        const current = prev.selectedBoxes[existingIndex]
        const updated = [...prev.selectedBoxes]
        
        if (current.quantity >= 5) {
          showNotification('info', 'Maximum 5 boxes du même type')
          return prev
        }
        
        updated[existingIndex] = { ...current, quantity: current.quantity + 1 }
        return { ...prev, selectedBoxes: updated }
      } else {
        return {
          ...prev,
          selectedBoxes: [...prev.selectedBoxes, { box, quantity: 1 }]
        }
      }
    })
  }

  const removeBoxSelection = (boxId: string) => {
    setBattleConfig(prev => ({
      ...prev,
      selectedBoxes: prev.selectedBoxes.filter(sb => sb.box.id !== boxId)
    }))
  }

  const getTotalCost = (): number => {
    return battleConfig.selectedBoxes.reduce((total, sb) => 
      total + (sb.box.price_virtual * sb.quantity), 0
    )
  }

  const getMaxPlayers = (): number => {
    switch (battleConfig.mode) {
      case '1v1': return 2
      case '2v2': return 4
      case 'group': return 6
      default: return 2
    }
  }

  // ✅ FONCTION canAfford CORRIGEE AVEC VERIFICATION DE TYPE
  const canAfford = (): boolean => {
    const totalCost = getTotalCost()
    // Vérification explicite que profile existe et que virtual_currency n'est pas undefined
    if (!profile || typeof profile.virtual_currency !== 'number') {
      return false
    }
    return profile.virtual_currency >= totalCost
  }

  const createBattle = async () => {
    if (battleConfig.selectedBoxes.length === 0) {
      showNotification('error', 'Sélectionnez au moins une loot box')
      return
    }

    if (!canAfford()) {
      showNotification('error', 'Solde insuffisant')
      return
    }

    if (!user) {
      showNotification('error', 'Utilisateur non connecté')
      return
    }

    setCreating(true)
    try {
      const totalCost = getTotalCost()
      const maxPlayers = getMaxPlayers()
      const entryCost = Math.floor(totalCost / maxPlayers)

      console.log('🚀 Création de la battle...', {
        mode: battleConfig.mode,
        maxPlayers,
        entryCost,
        totalCost,
        isPrivate: battleConfig.isPrivate
      })

      // Créer manuellement la battle
      const { data: manualBattle, error: battleError } = await supabase
        .from('battles')
        .insert({
          creator_id: user.id,
          mode: battleConfig.mode,
          max_players: maxPlayers,
          entry_cost: entryCost,
          total_prize: totalCost,
          is_private: battleConfig.isPrivate,
          password: battleConfig.password || null,
          status: 'waiting'
        })
        .select()
        .single()

      if (battleError) {
        console.error('❌ Erreur création battle:', battleError)
        throw new Error(`Erreur création battle: ${battleError.message}`)
      }

      const battleId = manualBattle.id
      console.log('✅ Battle créée:', battleId)

      // Ajouter les boxes si besoin
      if (battleConfig.selectedBoxes.length > 0) {
        const battleBoxes = battleConfig.selectedBoxes.flatMap(sb => 
          Array(sb.quantity).fill(null).map((_, index) => ({
            battle_id: battleId,
            loot_box_id: sb.box.id,
            order_position: index
          }))
        )

        const { error: boxesError } = await supabase
          .from('battle_boxes')
          .insert(battleBoxes)

        if (boxesError) {
          console.warn('⚠️ Erreur ajout boxes:', boxesError.message)
        } else {
          console.log('✅ Boxes ajoutées')
        }
      }

      // Ajouter le participant
      const { error: participantError } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: battleId,
          user_id: user.id,
          is_ready: false
        })

      if (participantError) {
        console.warn('⚠️ Erreur ajout participant:', participantError.message)
      } else {
        console.log('✅ Participant ajouté')
      }

      // ✅ DEDUCTION COINS CORRIGEE AVEC VERIFICATION DE TYPE
      if (profile && profile.virtual_currency !== undefined) {
        const currentCurrency = profile.virtual_currency ?? 0
        const newCurrency = currentCurrency - entryCost
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            virtual_currency: Math.max(0, newCurrency) // S'assurer que ça ne devient pas négatif
          })
          .eq('id', user.id)

        if (updateError) {
          console.warn('⚠️ Erreur mise à jour coins:', updateError.message)
        } else {
          console.log('✅ Coins déduits')
        }
      }

      showNotification('success', 'Battle créée avec succès !')
      
      // Redirection vers la battle room
      setTimeout(() => {
        router.push(`/battle/${battleId}`)
      }, 1500)

    } catch (error: any) {
      console.error('💥 Erreur création battle:', error)
      showNotification('error', error.message || 'Erreur lors de la création de la battle')
    } finally {
      setCreating(false)
    }
  }

  // ✅ FONCTION POUR AFFICHER LA CURRENCY DE MANIERE SURE
  const getDisplayCurrency = (): number => {
    return profile?.virtual_currency ?? 0
  }

  // Loading state standard
  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Loader2 className="h-12 w-12 text-red-500 mx-auto" />
          </motion.div>
          <p className="text-gray-400 text-lg">
            {authLoading ? 'Vérification authentification...' : 'Chargement des loot boxes...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header avec retour */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/battle')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour aux battles</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                Créer une Battle
              </h1>
              <p className="text-gray-400 mt-1">
                Configurez votre battle et défiez d'autres joueurs
              </p>
            </div>
          </div>
          
          {profile && (
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-lg">{getDisplayCurrency().toLocaleString()}</span>
                <span className="text-gray-400">coins</span>
              </div>
            </div>
          )}
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification.message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                notification.type === 'success' ? 'bg-green-900/50 border border-green-500' :
                notification.type === 'error' ? 'bg-red-900/50 border border-red-500' :
                'bg-blue-900/50 border border-blue-500'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-400" />
              )}
              <span>{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 text-white">Configuration</h2>
              
              {/* Mode de jeu */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Mode de bataille
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mode: '1v1' as const, icon: Users, label: '1v1' },
                    { mode: '2v2' as const, icon: Users, label: '2v2' },
                    { mode: 'group' as const, icon: Users, label: 'Groupe' }
                  ].map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setBattleConfig(prev => ({ ...prev, mode }))}
                      className={`p-3 rounded-lg border transition-all ${
                        battleConfig.mode === mode
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibilité */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Visibilité
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBattleConfig(prev => ({ ...prev, isPrivate: false }))}
                    className={`p-3 rounded-lg border transition-all ${
                      !battleConfig.isPrivate
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Globe className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Publique</span>
                  </button>
                  <button
                    onClick={() => setBattleConfig(prev => ({ ...prev, isPrivate: true }))}
                    className={`p-3 rounded-lg border transition-all ${
                      battleConfig.isPrivate
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Lock className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Privée</span>
                  </button>
                </div>
              </div>

              {/* Mot de passe si privé */}
              {battleConfig.isPrivate && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mot de passe (optionnel)
                  </label>
                  <input
                    type="password"
                    value={battleConfig.password || ''}
                    onChange={(e) => setBattleConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Laissez vide pour pas de mot de passe"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* Résumé */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                <h3 className="font-semibold text-white mb-3">Résumé</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode:</span>
                    <span className="text-white font-medium">{battleConfig.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joueurs max:</span>
                    <span className="text-white font-medium">{getMaxPlayers()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Boxes sélectionnées:</span>
                    <span className="text-white font-medium">{battleConfig.selectedBoxes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coût total:</span>
                    <span className="text-yellow-500 font-bold">{getTotalCost().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coût par joueur:</span>
                    <span className="text-yellow-500 font-bold">
                      {battleConfig.selectedBoxes.length > 0 ? Math.floor(getTotalCost() / getMaxPlayers()).toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box sélectionnées */}
              {battleConfig.selectedBoxes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white mb-3">Boxes sélectionnées</h3>
                  <div className="space-y-2">
                    {battleConfig.selectedBoxes.map((selectedBox) => (
                      <div
                        key={selectedBox.box.id}
                        className="flex items-center justify-between bg-gray-900/30 rounded-lg p-3 border border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedBox.box.image_url}
                            alt={selectedBox.box.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-white text-sm">
                              {selectedBox.box.name}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {selectedBox.quantity}x {selectedBox.box.price_virtual} coins
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBoxSelection(selectedBox.box.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sélection des Loot Boxes */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6 text-white">
                Sélectionnez vos Loot Boxes
                <span className="text-sm font-normal text-gray-400 ml-2">
                  (Cliquez pour ajouter, max 5 de chaque)
                </span>
              </h2>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lootBoxes.map((box) => {
                  const badge = getRarityBadge(box.rarity)
                  const selectedBox = battleConfig.selectedBoxes.find(sb => sb.box.id === box.id)
                  const isSelected = !!selectedBox
                  
                  return (
                    <motion.div
                      key={box.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative cursor-pointer bg-gray-900/50 rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected 
                          ? 'border-red-500 ring-2 ring-red-500/30' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => toggleBoxSelection(box)}
                    >
                      {/* Badge de rareté */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold text-white z-10 ${badge.color}`}>
                        {badge.text}
                      </div>

                      {/* Compteur de sélection */}
                      {isSelected && selectedBox && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10">
                          {selectedBox.quantity}
                        </div>
                      )}

                      {/* Image */}
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={box.image_url}
                          alt={box.name}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${getRarityColor(box.rarity)} opacity-20`} />
                      </div>

                      {/* Contenu */}
                      <div className="p-4">
                        <h3 className="font-bold text-white mb-1 truncate">
                          {box.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {box.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold text-yellow-500">
                              {box.price_virtual.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm">
                            {box.price_real}€
                          </div>
                        </div>
                      </div>

                      {/* Overlay de sélection */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500 rounded-xl flex items-center justify-center">
                          <div className="bg-red-600 rounded-full p-2">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {lootBoxes.length === 0 && (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Aucune loot box disponible
                  </h3>
                  <p className="text-gray-500">
                    Les loot boxes se chargent ou aucune n'est active actuellement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de création */}
        <div className="mt-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createBattle}
            disabled={creating || battleConfig.selectedBoxes.length === 0 || !canAfford()}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-3 ${
              creating || battleConfig.selectedBoxes.length === 0 || !canAfford()
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {creating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <Sword className="w-6 h-6" />
                <span>Créer la Battle</span>
                <Sparkles className="w-6 w-6" />
              </>
            )}
          </motion.button>
        </div>

        {/* Messages d'aide */}
        <div className="mt-4 text-center">
          {battleConfig.selectedBoxes.length === 0 && (
            <p className="text-gray-400 text-sm">
              Sélectionnez au moins une loot box pour créer une battle
            </p>
          )}
          {battleConfig.selectedBoxes.length > 0 && !canAfford() && (
            <p className="text-red-400 text-sm">
              Solde insuffisant pour créer cette battle
            </p>
          )}
          {battleConfig.selectedBoxes.length > 0 && canAfford() && (
            <p className="text-green-400 text-sm">
              Prêt à créer votre battle !
            </p>
          )}
        </div>
      </div>
    </div>
  )
}