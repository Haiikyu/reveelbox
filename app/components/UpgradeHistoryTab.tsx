// app/components/UpgradeHistoryTab.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  ChevronRight,
  Loader2
} from 'lucide-react'

interface UpgradeHistory {
  id: string
  item_name: string
  original_value: number
  multiplier: number
  target_value: number
  success: boolean
  final_value: number
  created_at: string
}

interface UpgradeStats {
  total_attempts: number
  successful_upgrades: number
  failed_upgrades: number
  success_rate: number
  total_value_gained: number
  total_value_lost: number
  best_upgrade?: {
    item_name: string
    multiplier: number
    value_gained: number
    date: string
  }
  recent_upgrades?: Array<{
    item_name: string
    multiplier: number
    success: boolean
    value_change: number
    date: string
  }>
}

interface UpgradeHistoryTabProps {
  userId: string
}

export default function UpgradeHistoryTab({ userId }: UpgradeHistoryTabProps) {
  const [history, setHistory] = useState<UpgradeHistory[]>([])
  const [stats, setStats] = useState<UpgradeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'success' | 'failed'>('all')

  useEffect(() => {
    if (userId) {
      loadUpgradeData()
    }
  }, [userId])

  const loadUpgradeData = async () => {
    try {
      setLoading(true)
      
      // Appel API pour récupérer l'historique et les stats
      const [historyRes, statsRes] = await Promise.all([
        fetch(`/api/upgrade-history?user_id=${userId}`),
        fetch(`/api/upgrade-stats?user_id=${userId}`)
      ])

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setHistory(historyData || [])
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData || {
          total_attempts: 0,
          successful_upgrades: 0,
          failed_upgrades: 0,
          success_rate: 0,
          total_value_gained: 0,
          total_value_lost: 0
        })
      }
    } catch (error) {
      console.error('Error loading upgrade data:', error)
      setHistory([])
      setStats({
        total_attempts: 0,
        successful_upgrades: 0,
        failed_upgrades: 0,
        success_rate: 0,
        total_value_gained: 0,
        total_value_lost: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 100) return 'from-yellow-400 to-orange-500'
    if (multiplier >= 10) return 'from-red-400 to-red-600'
    if (multiplier >= 5) return 'from-orange-400 to-orange-600'
    if (multiplier >= 3) return 'from-purple-400 to-purple-600'
    if (multiplier >= 2) return 'from-blue-400 to-blue-600'
    return 'from-green-400 to-green-600'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return 'Il y a moins d\'une heure'
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredHistory = history.filter(item => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'success') return item.success
    if (activeFilter === 'failed') return !item.success
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des upgrades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vue d'ensemble */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Vue d'ensemble des upgrades
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_attempts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tentatives</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.success_rate || 0}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Taux de réussite</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.successful_upgrades}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Réussites</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.failed_upgrades}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">Échecs</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Valeur gagnée</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-bold text-green-600 dark:text-green-400">
                    +{(stats.total_value_gained || 0).toLocaleString()} coins
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Valeur perdue</span>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-bold text-red-600 dark:text-red-400">
                    -{(stats.total_value_lost || 0).toLocaleString()} coins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meilleur upgrade */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Meilleur upgrade
            </h3>
            
            {stats.best_upgrade ? (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {stats.best_upgrade.item_name}
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Multiplicateur</span>
                    <span className={`font-bold text-lg bg-gradient-to-r ${getMultiplierColor(stats.best_upgrade.multiplier)} bg-clip-text text-transparent`}>
                      x{stats.best_upgrade.multiplier}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gain</span>
                    <div className="flex items-center gap-1">
                      <img 
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                        alt="Coins" 
                        className="h-4 w-4" 
                      />
                      <span className="font-bold text-green-600 dark:text-green-400">
                        +{stats.best_upgrade.value_gained.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pt-2">
                    <Clock className="h-3 w-3" />
                    {formatDate(stats.best_upgrade.date)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun upgrade réussi pour le moment</p>
                <p className="text-sm mt-2">Tentez votre chance pour apparaître ici !</p>
              </div>
            )}

            {/* Upgrades récents rapides */}
            {stats.recent_upgrades && stats.recent_upgrades.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Dernières tentatives
                </h4>
                <div className="space-y-1">
                  {stats.recent_upgrades.slice(0, 3).map((upgrade, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        {upgrade.success ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                          {upgrade.item_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">x{upgrade.multiplier}</span>
                        <span className={`text-xs font-bold ${
                          upgrade.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {upgrade.success ? '+' : ''}{upgrade.value_change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historique détaillé */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Historique complet
            </h3>
            
            {/* Filtres */}
            <div className="flex gap-2">
              {(['all', 'success', 'failed'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeFilter === filter
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter === 'all' && 'Tous'}
                  {filter === 'success' && 'Réussis'}
                  {filter === 'failed' && 'Échoués'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredHistory.length > 0 ? (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    item.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  }`}
                >
                  {/* Icône de statut */}
                  <div className={`p-3 rounded-xl ${
                    item.success
                      ? 'bg-green-100 dark:bg-green-800'
                      : 'bg-red-100 dark:bg-red-800'
                  }`}>
                    {item.success ? (
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>

                  {/* Détails */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.item_name}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>Valeur initiale: {item.original_value} coins</span>
                      <ChevronRight className="h-4 w-4" />
                      <span className={`font-bold bg-gradient-to-r ${getMultiplierColor(item.multiplier)} bg-clip-text text-transparent`}>
                        x{item.multiplier}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                      <span className={`font-bold ${
                        item.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {item.success ? item.final_value + ' coins' : 'Perdu'}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun upgrade {activeFilter !== 'all' && (activeFilter === 'success' ? 'réussi' : 'échoué')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tentez d'upgrader vos objets pour multiplier leur valeur !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}