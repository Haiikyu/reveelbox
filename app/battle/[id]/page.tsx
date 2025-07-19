'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sword, 
  Users, 
  MessageSquare,
  Send,
  Play,
  Pause,
  Clock,
  Trophy,
  Crown,
  Star,
  Gift,
  Coins,
  Eye,
  ArrowLeft,
  Settings,
  Volume2,
  VolumeX,
  Copy,
  Share2,
  User,
  Users2,
  Zap,
  Target,
  Flame,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Plus
} from 'lucide-react'

export default function BattleRoomPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [battle, setBattle] = useState(null)
  const [players, setPlayers] = useState([])
  const [spectators, setSpectators] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [gameState, setGameState] = useState('waiting') // waiting, countdown, opening, results, finished
  const [timeLeft, setTimeLeft] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [openingResults, setOpeningResults] = useState([])
  const [battleResults, setBattleResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ type: '', message: '' })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isSpectator, setIsSpectator] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const battleId = params.id
  const supabase = createClientComponentClient()
  const chatEndRef = useRef(null)

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 4000)
  }

  // Initialize and load battle data
  useEffect(() => {
    const initializeBattle = async () => {
      try {
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

        // Load battle data
        await loadBattleData()
        
        // Setup real-time subscriptions
        setupRealtimeSubscriptions()
        
      } catch (error) {
        console.error('Error initializing battle:', error)
        showNotification('error', 'Erreur lors du chargement de la battle')
      } finally {
        setLoading(false)
      }
    }

    initializeBattle()
  }, [battleId, supabase, router])

  const loadBattleData = async () => {
    // Mock battle data (replace with real Supabase call)
    const mockBattle = {
      id: battleId,
      mode: '1v1',
      status: 'waiting',
      price: 300,
      total_value: 600,
      box_ids: [
        { id: '1', name: 'Sneaker Box', quantity: 2, price: 150 }
      ],
      creator_id: 'user1',
      max_players: 2,
      is_private: false,
      created_at: new Date().toISOString(),
      time_limit: 300
    }
    setBattle(mockBattle)

    // Mock players data
    const mockPlayers = [
      {
        id: 'user1',
        user_id: 'user1', 
        username: 'BattleMaster',
        avatar: null,
        level: 25,
        is_ready: true,
        total_value: 0,
        items_won: [],
        is_winner: null
      },
      {
        id: 'user2',
        user_id: 'user2',
        username: 'ChallengerPro', 
        avatar: null,
        level: 18,
        is_ready: false,
        total_value: 0,
        items_won: [],
        is_winner: null
      }
    ]
    setPlayers(mockPlayers)

    // Check if current user is spectator
    const userInBattle = mockPlayers.find(p => p.user_id === user?.id)
    setIsSpectator(!userInBattle)

    // Mock chat messages
    setChatMessages([
      {
        id: '1',
        user_id: 'user1',
        username: 'BattleMaster',
        message: 'Prêt pour cette battle !',
        timestamp: new Date().toISOString()
      },
      {
        id: '2', 
        user_id: 'system',
        username: 'System',
        message: 'Battle créée. En attente des joueurs...',
        timestamp: new Date().toISOString(),
        isSystem: true
      }
    ])

    setTimeLeft(300) // 5 minutes
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to battle updates
    const battleChannel = supabase
      .channel(`battle:${battleId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'battles',
          filter: `id=eq.${battleId}`
        },
        (payload) => {
          console.log('Battle update:', payload)
          // Update battle state
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'battle_players',
          filter: `battle_id=eq.${battleId}`
        },
        (payload) => {
          console.log('Players update:', payload)
          // Update players
        }
      )
      .on('broadcast', 
        { event: 'chat_message' },
        (payload) => {
          setChatMessages(prev => [...prev, payload.payload])
          scrollToBottom()
        }
      )
      .on('broadcast',
        { event: 'game_state' },
        (payload) => {
          setGameState(payload.payload.state)
          if (payload.payload.countdown) {
            setCountdown(payload.payload.countdown)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(battleChannel)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && gameState === 'waiting') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, gameState])

  // Game countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && gameState === 'countdown') {
      startBattleOpening()
    }
  }, [countdown, gameState])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      user_id: user.id,
      username: profile?.username || user.email.split('@')[0],
      message: currentMessage,
      timestamp: new Date().toISOString()
    }

    // Send via realtime
    await supabase
      .channel(`battle:${battleId}`)
      .send({
        type: 'broadcast',
        event: 'chat_message',
        payload: message
      })

    setCurrentMessage('')
  }

  const toggleReady = async () => {
    if (isSpectator) return

    const currentPlayer = players.find(p => p.user_id === user.id)
    if (!currentPlayer) return

    const newReadyState = !currentPlayer.is_ready
    
    // Update local state
    setPlayers(prev => prev.map(p => 
      p.user_id === user.id ? { ...p, is_ready: newReadyState } : p
    ))

    // Broadcast ready state
    await supabase
      .channel(`battle:${battleId}`)
      .send({
        type: 'broadcast',
        event: 'player_ready',
        payload: { user_id: user.id, is_ready: newReadyState }
      })

    // Check if all players are ready
    const allReady = players.every(p => p.user_id === user.id ? newReadyState : p.is_ready)
    if (allReady && players.length === battle?.max_players) {
      startCountdown()
    }
  }

  const startCountdown = async () => {
    setGameState('countdown')
    setCountdown(3)
    
    await supabase
      .channel(`battle:${battleId}`)
      .send({
        type: 'broadcast',
        event: 'game_state',
        payload: { state: 'countdown', countdown: 3 }
      })
  }

  const startBattleOpening = async () => {
    setGameState('opening')
    
    // Simulate box opening with random results
    const simulateOpening = () => {
      const results = players.map(player => {
        const items = []
        let totalValue = 0

        battle.box_ids.forEach(boxConfig => {
          for (let i = 0; i < boxConfig.quantity; i++) {
            // Simulate random item with value
            const baseValue = boxConfig.price
            const variance = Math.random() * 0.8 + 0.6 // 60% to 140% of base value
            const itemValue = Math.round(baseValue * variance)
            
            items.push({
              id: `${boxConfig.id}_${i}`,
              name: `Item ${i + 1}`,
              value: itemValue,
              rarity: itemValue > baseValue * 1.2 ? 'rare' : 'common',
              image: '/api/placeholder/100/100'
            })
            totalValue += itemValue
          }
        })

        return {
          player_id: player.user_id,
          username: player.username,
          items,
          total_value: totalValue
        }
      })

      setOpeningResults(results)
      
      // Determine winner
      const winner = results.reduce((prev, current) => 
        prev.total_value > current.total_value ? prev : current
      )

      setBattleResults({
        winner_id: winner.player_id,
        results: results,
        total_prize: battle.total_value
      })

      // Update game state after animation
      setTimeout(() => {
        setGameState('results')
      }, 3000)
    }

    setTimeout(simulateOpening, 1000)
  }

  const joinBattle = async () => {
    if (players.length >= battle.max_players) {
      showNotification('error', 'Battle complète')
      return
    }

    if (profile.virtual_currency < battle.price) {
      showNotification('error', 'Coins insuffisants')
      return
    }

    // Add player to battle
    const newPlayer = {
      id: user.id,
      user_id: user.id,
      username: profile?.username || user.email.split('@')[0],
      avatar: null,
      level: profile?.level || 1,
      is_ready: false,
      total_value: 0,
      items_won: [],
      is_winner: null
    }

    setPlayers(prev => [...prev, newPlayer])
    setIsSpectator(false)
    showNotification('success', 'Vous avez rejoint la battle !')
  }

  const leaveBattle = async () => {
    if (gameState !== 'waiting') {
      showNotification('error', 'Impossible de quitter une battle en cours')
      return
    }

    setPlayers(prev => prev.filter(p => p.user_id !== user.id))
    setIsSpectator(true)
    showNotification('success', 'Vous avez quitté la battle')
  }

  const copyBattleLink = () => {
    navigator.clipboard.writeText(window.location.href)
    showNotification('success', 'Lien copié !')
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPlayerById = (playerId) => {
    return players.find(p => p.user_id === playerId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la battle...</p>
        </div>
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Sword className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Battle introuvable</h2>
          <p className="text-gray-600 mb-6">Cette battle n'existe pas ou a été supprimée</p>
          <Link
            href="/battle"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour aux battles
          </Link>
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

      {/* Countdown Overlay */}
      <AnimatePresence>
        {gameState === 'countdown' && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-8xl font-bold text-white mb-4"
              >
                {countdown}
              </motion.div>
              <p className="text-white text-xl">La battle commence...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/battle"
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Battles
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  {battle.mode === '1v1' ? <User className="h-4 w-4 text-white" /> : <Users2 className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Battle {battle.mode}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>ID: {battleId.slice(-8)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(timeLeft)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {spectators.length} spectateurs
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>

              {/* Share Button */}
              <button
                onClick={copyBattleLink}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </button>

              {/* Battle Prize */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 px-4 py-2 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">{battle.total_value} coins</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Battle Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Players Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-500" />
                  Joueurs ({players.length}/{battle.max_players})
                </h2>
                
                {gameState === 'waiting' && !isSpectator && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleReady}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      players.find(p => p.user_id === user.id)?.is_ready
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {players.find(p => p.user_id === user.id)?.is_ready ? 'Prêt !' : 'Se mettre prêt'}
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: battle.max_players }).map((_, index) => {
                  const player = players[index]
                  
                  if (!player) {
                    return (
                      <div key={`empty-${index}`} className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                        <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4">En attente d'un joueur...</p>
                        {isSpectator && players.length < battle.max_players && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={joinBattle}
                            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                          >
                            Rejoindre
                          </motion.button>
                        )}
                      </div>
                    )
                  }

                  const playerResult = openingResults.find(r => r.player_id === player.user_id)
                  const isWinner = battleResults?.winner_id === player.user_id

                  return (
                    <motion.div
                      key={player.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        isWinner 
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                          : player.is_ready 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {player.username.charAt(0)}
                            </span>
                          </div>
                          {isWinner && (
                            <div className="absolute -top-2 -right-2 h-6 w-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Crown className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {player.is_ready && gameState === 'waiting' && (
                            <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{player.username}</h3>
                            {player.user_id === user?.id && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Vous</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">Niveau {player.level}</p>
                          {playerResult && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1 text-lg font-bold">
                                <Coins className="h-5 w-5 text-yellow-500" />
                                <span className={isWinner ? 'text-yellow-600' : 'text-gray-700'}>
                                  {playerResult.total_value}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {player.user_id === user?.id && !isSpectator && gameState === 'waiting' && (
                          <button
                            onClick={leaveBattle}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Quitter
                          </button>
                        )}
                      </div>

                      {/* Items Won */}
                      {playerResult && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 text-sm">Items obtenus :</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {playerResult.items.map((item, itemIndex) => (
                              <motion.div
                                key={itemIndex}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: itemIndex * 0.1 }}
                                className={`p-2 rounded-lg border text-center ${
                                  item.rarity === 'rare' 
                                    ? 'border-blue-300 bg-blue-50' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-1"></div>
                                <div className="text-xs font-medium text-gray-900">{item.value}</div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Battle Animation/Results */}
            {gameState === 'opening' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-8 text-white text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border-4 border-white/30 border-t-white rounded-full mx-auto mb-6"
                />
                <h2 className="text-3xl font-bold mb-2">Ouverture en cours...</h2>
                <p className="text-red-100">Les boîtes s'ouvrent simultanément</p>
              </motion.div>
            )}

            {/* Battle Results */}
            {gameState === 'results' && battleResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="text-center mb-6">
                  <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {getPlayerById(battleResults.winner_id)?.username} remporte la battle !
                  </h2>
                  <p className="text-gray-600">
                    Gain total : <span className="font-bold text-yellow-600">{battleResults.total_prize} coins</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {battleResults.results.map((result, index) => (
                    <div
                      key={result.player_id}
                      className={`p-4 rounded-xl border-2 ${
                        result.player_id === battleResults.winner_id
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {result.username.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{result.username}</h3>
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{result.total_value} coins</span>
                          </div>
                        </div>
                        {result.player_id === battleResults.winner_id && (
                          <Crown className="h-6 w-6 text-yellow-500 ml-auto" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-1">
                        {result.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-bold ${
                              item.rarity === 'rare' 
                                ? 'border-blue-400 bg-blue-100 text-blue-700'
                                : 'border-gray-300 bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-center gap-4">
                  <Link
                    href="/battle"
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Retour aux battles
                  </Link>
                  <Link
                    href="/battle/create"
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="h-5 w-5" />
                    Nouvelle battle
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Boxes to Open */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Gift className="h-5 w-5 text-red-500" />
                Boîtes à ouvrir
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {battle.box_ids.map((boxConfig, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4">
                    <div className="w-full h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-3 flex items-center justify-center">
                      <Gift className="h-12 w-12 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{boxConfig.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{boxConfig.price} coins</span>
                      </div>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        x{boxConfig.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chat */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-96 flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-red-500" />
                  Chat de la battle
                </h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`${
                      message.isSystem 
                        ? 'text-center'
                        : message.user_id === user?.id 
                        ? 'text-right' 
                        : 'text-left'
                    }`}
                  >
                    {message.isSystem ? (
                      <p className="text-gray-500 text-xs italic">{message.message}</p>
                    ) : (
                      <div className={`inline-block max-w-xs ${
                        message.user_id === user?.id
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg px-3 py-2`}>
                        <p className="text-xs font-medium mb-1">{message.username}</p>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              {!isSpectator && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Tapez votre message..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* Battle Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Informations
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode</span>
                  <span className="font-medium">{battle.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix d'entrée</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{battle.price}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix total</span>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-yellow-600">{battle.total_value}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut</span>
                  <span className={`font-medium ${
                    gameState === 'waiting' ? 'text-yellow-600' :
                    gameState === 'countdown' ? 'text-orange-600' :
                    gameState === 'opening' ? 'text-blue-600' :
                    gameState === 'results' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {gameState === 'waiting' ? 'En attente' :
                     gameState === 'countdown' ? 'Démarrage' :
                     gameState === 'opening' ? 'En cours' :
                     gameState === 'results' ? 'Terminée' : 'Inconnue'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Créateur</span>
                  <span className="font-medium">
                    {players.find(p => p.user_id === battle.creator_id)?.username || 'Inconnu'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visibilité</span>
                  <span className="font-medium">
                    {battle.is_private ? 'Privée' : 'Publique'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-500" />
                Actions rapides
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={copyBattleLink}
                  className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copier le lien
                </button>
                
                <Link
                  href="/battle/create"
                  className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Créer une battle
                </Link>
                
                <Link
                  href="/battle"
                  className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Sword className="h-4 w-4" />
                  Autres battles
                </Link>

                {gameState === 'results' && (
                  <Link
                    href="/inventory"
                    className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm"
                  >
                    <Gift className="h-4 w-4" />
                    Voir l'inventaire
                  </Link>
                )}
              </div>
            </div>

            {/* Battle Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Le saviez-vous ?
              </h3>
              <ul className="space-y-2 text-blue-700 text-sm">
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  La valeur des items est calculée en temps réel
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Tous les joueurs ouvrent simultanément
                </li>
                <li className="flex items-start gap-2">
                  <Flame className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Le gagnant remporte TOUS les gains
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}