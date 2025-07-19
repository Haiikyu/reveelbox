'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Sword, 
  Users, 
  User,
  Users2,
  Plus,
  Minus,
  ArrowLeft,
  Coins,
  Gift,
  Settings,
  Eye,
  EyeOff,
  Clock,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Crown,
  Shield,
  Flame,
  Trophy
} from 'lucide-react'

export default function CreateBattlePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [lootBoxes, setLootBoxes] = useState([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ type: '', message: '' })
  
  const [battleConfig, setBattleConfig] = useState({
    mode: '1v1', // '1v1' | '2v2'
    selectedBoxes: [],
    pricePerPlayer: 100,
    isPrivate: false,
    password: '',
    autoStart: true,
    timeLimit: 300, // 5 minutes
    maxSpectators: 50
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 5000)
  }

  // Auth and data loading
  useEffect(() => {
    const initializePage = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)

      // Load available loot boxes
      const { data: boxes } = await supabase
        .from('loot_boxes')
        .select('*')
        .eq('is_active', true)
        .order('price_virtual')

      if (boxes) {
        setLootBoxes(boxes)
      } else {
        // Fallback data if no boxes in DB
        setLootBoxes([
          {
            id: '1',
            name: 'Sneaker Box',
            description: 'Premium sneakers collection',
            price_virtual: 150,
            price_real: 6.99,
            image_url: '/api/placeholder/300/200',
            rarity: 'rare'
          },
          {
            id: '2',
            name: 'Tech Box',
            description: 'Latest gadgets & electronics',
            price_virtual: 200,
            price_real: 9.99,
            image_url: '/api/placeholder/300/200',
            rarity: 'epic'
          },
          {
            id: '3',
            name: 'Fashion Box',
            description: 'Trendy accessories & style',
            price_virtual: 120,
            price_real: 5.99,
            image_url: '/api/placeholder/300/200',
            rarity: 'common'
          },
          {
            id: '4',
            name: 'Luxury Box',
            description: 'Exclusive premium items',
            price_virtual: 500,
            price_real: 24.99,
            image_url: '/api/placeholder/300/200',
            rarity: 'legendary'
          }
        ])
      }
    }

    initializePage()
  }, [supabase, router])

  const handleBoxSelection = (box) => {
    setBattleConfig(prev => {
      const isSelected = prev.selectedBoxes.find(b => b.id === box.id)
      
      if (isSelected) {
        // Remove box
        return {
          ...prev,
          selectedBoxes: prev.selectedBoxes.filter(b => b.id !== box.id)
        }
      } else {
        // Add box (max 5 boxes per battle)
        if (prev.selectedBoxes.length >= 5) {
          showNotification('error', 'Maximum 5 boîtes par battle')
          return prev
        }
        return {
          ...prev,
          selectedBoxes: [...prev.selectedBoxes, { ...box, quantity: 1 }]
        }
      }
    })
  }

  const updateBoxQuantity = (boxId, change) => {
    setBattleConfig(prev => ({
      ...prev,
      selectedBoxes: prev.selectedBoxes.map(box => {
        if (box.id === boxId) {
          const newQuantity = Math.max(1, Math.min(3, box.quantity + change))
          return { ...box, quantity: newQuantity }
        }
        return box
      })
    }))
  }

  const calculateTotalCost = () => {
    const boxesCost = battleConfig.selectedBoxes.reduce((total, box) => 
      total + (box.price_virtual * box.quantity), 0
    )
    return boxesCost
  }

  const calculateTotalValue = () => {
    const totalBoxValue = battleConfig.selectedBoxes.reduce((total, box) => 
      total + (box.price_virtual * box.quantity), 0
    )
    const maxPlayers = battleConfig.mode === '1v1' ? 2 : 4
    return totalBoxValue * maxPlayers
  }

  const validateBattle = () => {
    if (battleConfig.selectedBoxes.length === 0) {
      showNotification('error', 'Sélectionnez au moins une boîte')
      return false
    }

    if (!profile || profile.virtual_currency < calculateTotalCost()) {
      showNotification('error', 'Coins insuffisants pour créer cette battle')
      return false
    }

    if (battleConfig.isPrivate && !battleConfig.password) {
      showNotification('error', 'Mot de passe requis pour les battles privées')
      return false
    }

    return true
  }

  const createBattle = async () => {
    if (!validateBattle()) return

    setLoading(true)

    try {
      const maxPlayers = battleConfig.mode === '1v1' ? 2 : 4
      const totalCost = calculateTotalCost()

      // Create battle in database
      const { data: battle, error } = await supabase
        .from('battles')
        .insert({
          mode: battleConfig.mode,
          status: 'waiting',
          price: totalCost,
          total_value: calculateTotalValue(),
          box_ids: battleConfig.selectedBoxes.map(box => ({ 
            id: box.id, 
            quantity: box.quantity 
          })),
          creator_id: user.id,
          max_players: maxPlayers,
          is_private: battleConfig.isPrivate,
          password: battleConfig.isPrivate ? battleConfig.password : null,
          time_limit: battleConfig.timeLimit,
          max_spectators: battleConfig.maxSpectators,
          auto_start: battleConfig.autoStart
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as first player
      await supabase
        .from('battle_players')
        .insert({
          battle_id: battle.id,
          user_id: user.id,
          joined_at: new Date().toISOString()
        })

      // Deduct coins from creator
      await supabase
        .from('profiles')
        .update({ 
          virtual_currency: profile.virtual_currency - totalCost 
        })
        .eq('id', user.id)

      showNotification('success', 'Battle créée avec succès !')
      
      // Redirect to battle room
      setTimeout(() => {
        router.push(`/battle/${battle.id}`)
      }, 1500)

    } catch (error) {
      console.error('Error creating battle:', error)
      showNotification('error', 'Erreur lors de la création de la battle')
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityTextColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-700'
      case 'rare': return 'text-blue-700'
      case 'epic': return 'text-purple-700'
      case 'legendary': return 'text-yellow-700'
      default: return 'text-gray-700'
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Notification */}
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
            notification.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </motion.div>
      )}

      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/battle"
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Retour aux battles
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Sword className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Créer une Battle</h1>
                  <p className="text-gray-600 text-sm">Configurez votre duel et défiez les autres joueurs</p>
                </div>
              </div>
            </div>

            {/* User coins */}
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-gray-900">
                {profile.virtual_currency?.toLocaleString() || 0}
              </span>
              <span className="text-gray-600 text-sm">coins</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-red-500" />
                Mode de jeu
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setBattleConfig(prev => ({ ...prev, mode: '1v1' }))}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    battleConfig.mode === '1v1'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <User className={`h-8 w-8 mx-auto mb-3 ${
                    battleConfig.mode === '1v1' ? 'text-red-500' : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">1 vs 1</div>
                    <div className="text-sm text-gray-600">Duel classique</div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setBattleConfig(prev => ({ ...prev, mode: '2v2' }))}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    battleConfig.mode === '2v2'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <Users2 className={`h-8 w-8 mx-auto mb-3 ${
                    battleConfig.mode === '2v2' ? 'text-red-500' : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">2 vs 2</div>
                    <div className="text-sm text-gray-600">Combat d'équipe</div>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Box Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5 text-red-500" />
                Sélection des boîtes
                <span className="text-sm font-normal text-gray-600">
                  ({battleConfig.selectedBoxes.length}/5)
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {lootBoxes.map((box) => {
                  const isSelected = battleConfig.selectedBoxes.find(b => b.id === box.id)
                  
                  return (
                    <motion.div
                      key={box.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBoxSelection(box)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? `border-red-500 ${getRarityColor(box.rarity)}`
                          : `${getRarityColor(box.rarity)} hover:border-red-300`
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                          <Gift className="h-8 w-8 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{box.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{box.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <span className="font-semibold text-gray-900">{box.price_virtual}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRarityTextColor(box.rarity)} bg-current bg-opacity-10`}>
                              {box.rarity}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Selected Boxes with Quantities */}
              {battleConfig.selectedBoxes.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Boîtes sélectionnées</h3>
                  <div className="space-y-3">
                    {battleConfig.selectedBoxes.map((box) => (
                      <div key={box.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                            <Gift className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{box.name}</div>
                            <div className="text-sm text-gray-600">
                              {box.price_virtual} coins × {box.quantity} = {box.price_virtual * box.quantity} coins
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateBoxQuantity(box.id, -1)}
                            disabled={box.quantity <= 1}
                            className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{box.quantity}</span>
                          <button
                            onClick={() => updateBoxQuantity(box.id, 1)}
                            disabled={box.quantity >= 3}
                            className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Advanced Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-red-500" />
                Paramètres avancés
              </h2>

              <div className="space-y-6">
                {/* Private Battle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {battleConfig.isPrivate ? (
                      <EyeOff className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-600" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">Battle privée</div>
                      <div className="text-sm text-gray-600">Accessible uniquement avec un mot de passe</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setBattleConfig(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      battleConfig.isPrivate ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        battleConfig.isPrivate ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Password Field */}
                {battleConfig.isPrivate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <input
                      type="text"
                      value={battleConfig.password}
                      onChange={(e) => setBattleConfig(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Entrez un mot de passe"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    />
                  </div>
                )}

                {/* Time Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temps d'attente maximum (minutes)
                  </label>
                  <select
                    value={battleConfig.timeLimit}
                    onChange={(e) => setBattleConfig(prev => ({ ...prev, timeLimit: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  >
                    <option value={180}>3 minutes</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                    <option value={900}>15 minutes</option>
                  </select>
                </div>

                {/* Auto Start */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Démarrage automatique</div>
                      <div className="text-sm text-gray-600">Lance la battle dès que tous les joueurs sont prêts</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setBattleConfig(prev => ({ ...prev, autoStart: !prev.autoStart }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      battleConfig.autoStart ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        battleConfig.autoStart ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Summary & Create */}
          <div className="space-y-6">
            {/* Battle Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 sticky top-24"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Résumé de la battle
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Mode</span>
                  <span className="font-semibold text-gray-900">{battleConfig.mode}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Boîtes</span>
                  <span className="font-semibold text-gray-900">{battleConfig.selectedBoxes.length}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Prix d'entrée</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-gray-900">{calculateTotalCost()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Valeur totale</span>
                  <div className="flex items-center gap-1">
                    <Gift className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600">{calculateTotalValue()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Visibilité</span>
                  <span className="font-semibold text-gray-900">
                    {battleConfig.isPrivate ? 'Privée' : 'Publique'}
                  </span>
                </div>
              </div>

              {/* Warning */}
              {calculateTotalCost() > (profile?.virtual_currency || 0) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Coins insuffisants</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    Vous avez besoin de {calculateTotalCost() - (profile?.virtual_currency || 0)} coins supplémentaires
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-blue-700 text-sm">
                    <p className="font-medium mb-1">Comment ça marche ?</p>
                    <p>Chaque joueur ouvre les mêmes boîtes simultanément. Celui qui obtient la plus grosse valeur remporte toutes les récompenses !</p>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <motion.button
                whileHover={{ scale: battleConfig.selectedBoxes.length > 0 ? 1.02 : 1 }}
                whileTap={{ scale: battleConfig.selectedBoxes.length > 0 ? 0.98 : 1 }}
                onClick={createBattle}
                disabled={loading || battleConfig.selectedBoxes.length === 0 || calculateTotalCost() > (profile?.virtual_currency || 0)}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  loading || battleConfig.selectedBoxes.length === 0 || calculateTotalCost() > (profile?.virtual_currency || 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Sword className="h-5 w-5" />
                    Créer la Battle
                  </>
                )}
              </motion.button>

              {/* Additional Actions */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link
                  href="/battle"
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Annuler
                </Link>
                
                <button
                  onClick={() => {
                    setBattleConfig({
                      mode: '1v1',
                      selectedBoxes: [],
                      pricePerPlayer: 100,
                      isPrivate: false,
                      password: '',
                      autoStart: true,
                      timeLimit: 300,
                      maxSpectators: 50
                    })
                    showNotification('success', 'Configuration réinitialisée')
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </motion.div>

            {/* Battle Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6"
            >
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Conseils pour gagner
              </h3>
              <ul className="space-y-2 text-yellow-700 text-sm">
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Choisissez des boîtes avec une grande variance de valeurs
                </li>
                <li className="flex items-start gap-2">
                  <Flame className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Les battles 1v1 sont plus prévisibles que les 2v2
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Surveillez vos coins - ne misez que ce que vous pouvez perdre
                </li>
              </ul>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-red-500" />
                Vos statistiques
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-gray-900">12</div>
                  <div className="text-xs text-gray-600">Battles jouées</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="text-xl font-bold text-green-600">8</div>
                  <div className="text-xs text-gray-600">Victoires</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <div className="text-xl font-bold text-blue-600">67%</div>
                  <div className="text-xs text-gray-600">Taux de réussite</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-xl">
                  <div className="text-xl font-bold text-yellow-600">1,247</div>
                  <div className="text-xs text-gray-600">Gains totaux</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}