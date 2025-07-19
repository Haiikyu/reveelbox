'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Sword, 
  Users, 
  Plus, 
  Search, 
  Filter,
  Clock,
  Trophy,
  Zap,
  Eye,
  Star,
  Crown,
  User,
  Users2,
  Coins,
  ArrowRight,
  Play,
  Shield,
  Target,
  Flame,
  AlertCircle,
  CheckCircle,
  Timer,
  Gift
} from 'lucide-react'

export default function BattlesPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [battles, setBattles] = useState([])
  const [filters, setFilters] = useState({
    mode: 'all', // all, 1v1, 2v2
    status: 'all', // all, waiting, ongoing, finished
    priceRange: 'all' // all, low, medium, high
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [notification, setNotification] = useState({ type: '', message: '' })
  
  const supabase = createClientComponentClient()

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: '', message: '' }), 4000)
  }

  // Auth check
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
    }
    getUser()
  }, [supabase])

  // Load battles (simulate data)
  useEffect(() => {
    const mockBattles = [
      {
        id: '1',
        mode: '1v1',
        status: 'waiting',
        price: 150,
        totalValue: 320,
        boxes: ['Sneaker Box', 'Tech Box'],
        boxCount: 2,
        players: [
          { id: '1', username: 'SneakerKing', avatar: null, level: 12 }
        ],
        maxPlayers: 2,
        timeLeft: 180,
        isPrivate: false,
        creator: 'SneakerKing'
      },
      {
        id: '2',
        mode: '2v2',
        status: 'ongoing',
        price: 300,
        totalValue: 850,
        boxes: ['Luxury Box', 'Fashion Box', 'Tech Box'],
        boxCount: 3,
        players: [
          { id: '1', username: 'TeamAlpha1', avatar: null, level: 25 },
          { id: '2', username: 'TeamAlpha2', avatar: null, level: 18 },
          { id: '3', username: 'BetaWarrior', avatar: null, level: 22 },
          { id: '4', username: 'GammaGamer', avatar: null, level: 15 }
        ],
        maxPlayers: 4,
        timeLeft: 45,
        isPrivate: false,
        creator: 'TeamAlpha1'
      },
      {
        id: '3',
        mode: '1v1',
        status: 'waiting',
        price: 75,
        totalValue: 180,
        boxes: ['Fashion Box'],
        boxCount: 1,
        players: [
          { id: '1', username: 'StyleMaster', avatar: null, level: 8 }
        ],
        maxPlayers: 2,
        timeLeft: 300,
        isPrivate: false,
        creator: 'StyleMaster'
      },
      {
        id: '4',
        mode: '1v1',
        status: 'finished',
        price: 200,
        totalValue: 445,
        boxes: ['Sneaker Box', 'Luxury Box'],
        boxCount: 2,
        players: [
          { id: '1', username: 'Champion99', avatar: null, level: 30, winner: true },
          { id: '2', username: 'Challenger', avatar: null, level: 24, winner: false }
        ],
        maxPlayers: 2,
        timeLeft: 0,
        isPrivate: false,
        creator: 'Champion99',
        winnerValue: 445,
        loserValue: 380
      }
    ]
    setBattles(mockBattles)
  }, [])

  const joinBattle = (battleId) => {
    if (!user) {
      showNotification('error', 'Vous devez être connecté pour rejoindre une battle')
      return
    }
    
    if (!profile || profile.virtual_currency < 150) {
      showNotification('error', 'Coins insuffisants pour rejoindre cette battle')
      return
    }
    
    // Simulate joining
    showNotification('success', 'Battle rejointe avec succès !')
    // Redirect to battle room
    // router.push(`/battle/${battleId}`)
  }

  const filteredBattles = battles.filter(battle => {
    // Mode filter
    if (filters.mode !== 'all' && battle.mode !== filters.mode) return false
    
    // Status filter
    if (filters.status !== 'all' && battle.status !== filters.status) return false
    
    // Price range filter
    if (filters.priceRange !== 'all') {
      if (filters.priceRange === 'low' && battle.price > 100) return false
      if (filters.priceRange === 'medium' && (battle.price < 100 || battle.price > 300)) return false
      if (filters.priceRange === 'high' && battle.price < 300) return false
    }
    
    // Search filter
    if (searchTerm && !battle.creator.toLowerCase().includes(searchTerm.toLowerCase())) return false
    
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100'
      case 'ongoing': return 'text-green-600 bg-green-100'
      case 'finished': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return Clock
      case 'ongoing': return Play
      case 'finished': return Trophy
      default: return Clock
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-orange-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sword className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Battles PvP
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Affrontez d'autres joueurs dans des duels épiques ! Ouvrez des boîtes et remportez tout si vous obtenez la plus grosse valeur.
            </p>
            
            {/* Create Battle Button */}
            <Link
              href="/battle/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-200 group"
            >
              <Plus className="h-5 w-5" />
              Créer une Battle
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher par créateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Mode Filter */}
              <select
                value={filters.mode}
                onChange={(e) => setFilters(prev => ({ ...prev, mode: e.target.value }))}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
              >
                <option value="all">Tous les modes</option>
                <option value="1v1">1v1</option>
                <option value="2v2">2v2</option>
              </select>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="waiting">En attente</option>
                <option value="ongoing">En cours</option>
                <option value="finished">Terminées</option>
              </select>

              {/* Price Range Filter */}
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
              >
                <option value="all">Tous les prix</option>
                <option value="low">0-100 coins</option>
                <option value="medium">100-300 coins</option>
                <option value="high">300+ coins</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{battles.filter(b => b.status === 'waiting').length}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{battles.filter(b => b.status === 'ongoing').length}</div>
              <div className="text-sm text-gray-600">En cours</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{battles.length}</div>
              <div className="text-sm text-gray-600">Total battles</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">1,247</div>
              <div className="text-sm text-gray-600">Joueurs actifs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Battles List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6">
            {filteredBattles.map((battle) => {
              const StatusIcon = getStatusIcon(battle.status)
              const isJoinable = battle.status === 'waiting' && battle.players.length < battle.maxPlayers
              const canJoin = user && profile && profile.virtual_currency >= battle.price
              
              return (
                <motion.div
                  key={battle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Battle Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          {/* Mode Badge */}
                          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                            {battle.mode === '1v1' ? <User className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}
                            {battle.mode}
                          </div>
                          
                          {/* Status Badge */}
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(battle.status)}`}>
                            <StatusIcon className="h-4 w-4" />
                            {battle.status === 'waiting' ? 'En attente' : 
                             battle.status === 'ongoing' ? 'En cours' : 'Terminée'}
                          </div>

                          {/* Time Left */}
                          {battle.status !== 'finished' && (
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <Timer className="h-4 w-4" />
                              {formatTime(battle.timeLeft)}
                            </div>
                          )}
                        </div>

                        {/* Battle Details */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-600">Prix d'entrée</div>
                            <div className="flex items-center gap-1 font-semibold text-gray-900">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              {battle.price}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Valeur totale</div>
                            <div className="flex items-center gap-1 font-semibold text-green-600">
                              <Gift className="h-4 w-4" />
                              {battle.totalValue}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Boîtes</div>
                            <div className="font-semibold text-gray-900">
                              {battle.boxCount} boîte{battle.boxCount > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Joueurs</div>
                            <div className="font-semibold text-gray-900">
                              {battle.players.length}/{battle.maxPlayers}
                            </div>
                          </div>
                        </div>

                        {/* Boxes */}
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">Boîtes à ouvrir :</div>
                          <div className="flex flex-wrap gap-2">
                            {battle.boxes.map((box, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                {box}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Players & Actions */}
                      <div className="lg:w-80">
                        {/* Players */}
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-3">Joueurs</div>
                          <div className="space-y-2">
                            {battle.players.map((player, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    {player.username.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{player.username}</span>
                                    {player.winner !== undefined && (
                                      player.winner ? 
                                        <Crown className="h-4 w-4 text-yellow-500" /> :
                                        <Shield className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">Niveau {player.level}</div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Empty slots */}
                            {Array.from({ length: battle.maxPlayers - battle.players.length }).map((_, index) => (
                              <div key={`empty-${index}`} className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-xl">
                                <div className="h-8 w-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                                  <Plus className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="text-gray-500 text-sm">En attente d'un joueur...</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          {battle.status === 'finished' ? (
                            <Link
                              href={`/battle/${battle.id}`}
                              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              Voir les résultats
                            </Link>
                          ) : battle.status === 'ongoing' ? (
                            <Link
                              href={`/battle/${battle.id}`}
                              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 transition-colors"
                            >
                              <Play className="h-4 w-4" />
                              Regarder la battle
                            </Link>
                          ) : isJoinable ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => joinBattle(battle.id)}
                              disabled={!canJoin}
                              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${
                                canJoin 
                                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Sword className="h-4 w-4" />
                              {canJoin ? 'Rejoindre la battle' : 'Coins insuffisants'}
                            </motion.button>
                          ) : (
                            <div className="w-full text-center py-3 px-4 bg-gray-100 text-gray-500 rounded-xl">
                              Battle complète
                            </div>
                          )}
                          
                          <Link
                            href={`/battle/${battle.id}`}
                            className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            Voir les détails
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* No results */}
          {filteredBattles.length === 0 && (
            <div className="text-center py-12">
              <Sword className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune battle trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                Modifiez vos filtres ou créez une nouvelle battle
              </p>
              <Link
                href="/battle/create"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                Créer une Battle
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}