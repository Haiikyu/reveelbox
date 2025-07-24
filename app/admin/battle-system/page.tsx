'use client'

import { useAuth } from '../../components/AuthProvider' // ✅ NOUVEAU STANDARD
import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client' // ✅ NOUVEAU STANDARD
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Database, Play, RotateCcw, CheckCircle, AlertCircle, 
  Loader2, Settings, BarChart3, Box, Users, Sword,
  Zap, Trophy, Gift, Target, Sparkles, RefreshCw, Plus
} from 'lucide-react'

// Types
interface SystemStatus {
  hasBoxes: boolean
  hasItems: boolean
  hasRelations: boolean
  isReady: boolean
}

interface SystemStats {
  lootBoxes: number
  items: number
  relations: number
  battles: number
}

interface TestResult {
  item_id: string
  item_name: string
  item_rarity: string
  quantity: number
  unit_value: number
  total_value: number
}

interface Notification {
  type: 'success' | 'error' | 'info'
  message: string
}

// ✅ CLASSE CORRIGÉE AVEC NOUVEAU STANDARD
class BattleSystemInitializer {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase // ✅ Utilise le client passé en paramètre
  }

  async checkSystemStatus(): Promise<SystemStatus> {
    try {
      const [boxResult, itemResult, relationResult] = await Promise.all([
        this.supabase
          .from('loot_boxes')
          .select('id')
          .eq('is_active', true)
          .limit(1),
        this.supabase
          .from('items')
          .select('id')
          .limit(1),
        this.supabase
          .from('loot_box_items')
          .select('id')
          .limit(1)
      ])

      return {
        hasBoxes: !boxResult.error && boxResult.data && boxResult.data.length > 0,
        hasItems: !itemResult.error && itemResult.data && itemResult.data.length > 0,
        hasRelations: !relationResult.error && relationResult.data && relationResult.data.length > 0,
        isReady: !boxResult.error && !itemResult.error && !relationResult.error && 
                 boxResult.data && boxResult.data.length > 0 && 
                 itemResult.data && itemResult.data.length > 0 && 
                 relationResult.data && relationResult.data.length > 0
      }
    } catch (error) {
      console.error('Erreur vérification système:', error)
      return { hasBoxes: false, hasItems: false, hasRelations: false, isReady: false }
    }
  }

  async getSystemStats(): Promise<SystemStats> {
    try {
      const [boxResult, itemResult, relationResult, battleResult] = await Promise.all([
        this.supabase.from('loot_boxes').select('id', { count: 'exact' }).eq('is_active', true),
        this.supabase.from('items').select('id', { count: 'exact' }),
        this.supabase.from('loot_box_items').select('id', { count: 'exact' }),
        this.supabase.from('battles').select('id', { count: 'exact' })
      ])

      return {
        lootBoxes: boxResult.count || 0,
        items: itemResult.count || 0,
        relations: relationResult.count || 0,
        battles: battleResult.count || 0
      }
    } catch (error) {
      console.error('Erreur récupération stats:', error)
      return { lootBoxes: 0, items: 0, relations: 0, battles: 0 }
    }
  }

  async testBoxOpening(boxName: string = 'STARTER SNEAKER BOX', quantity: number = 1): Promise<TestResult[]> {
    try {
      const { data: box } = await this.supabase
        .from('loot_boxes')
        .select('id')
        .eq('name', boxName)
        .single()

      if (!box) {
        throw new Error(`Box ${boxName} non trouvée`)
      }

      const { data: result, error } = await this.supabase
        .rpc('simulate_loot_box_opening', {
          p_loot_box_id: box.id,
          p_quantity: quantity
        })

      if (error) throw error
      return result || []
    } catch (error) {
      console.error('Erreur test ouverture:', error)
      throw error
    }
  }

  async initializeTestData(): Promise<void> {
    try {
      // Créer des items de test s'ils n'existent pas
      const { data: existingItems } = await this.supabase
        .from('items')
        .select('id')
        .limit(1)

      if (!existingItems || existingItems.length === 0) {
        const testItems = [
          {
            name: 'Air Jordan 1 Chicago',
            description: 'Le graal absolu des sneakers',
            rarity: 'legendary',
            market_value: 25000,
            image_url: 'https://images.stockx.com/images/Air-Jordan-1-Retro-Chicago-2015-Product.jpg'
          },
          {
            name: 'Nike Dunk Low Panda',
            description: 'Coloris iconique noir et blanc',
            rarity: 'rare',
            market_value: 250,
            image_url: 'https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg'
          },
          {
            name: 'Yeezy Boost 350 V2',
            description: 'Design futuriste de Kanye',
            rarity: 'epic',
            market_value: 300,
            image_url: 'https://images.stockx.com/images/adidas-Yeezy-Boost-350-V2-Core-Black-White-Product.jpg'
          }
        ]

        await this.supabase.from('items').insert(testItems)
      }

      // Créer des loot boxes de test
      const { data: existingBoxes } = await this.supabase
        .from('loot_boxes')
        .select('id')
        .limit(1)

      if (!existingBoxes || existingBoxes.length === 0) {
        const testBoxes = [
          {
            name: 'STARTER SNEAKER BOX',
            description: 'Parfait pour débuter',
            price_virtual: 100,
            price_real: 4.99,
            rarity: 'common',
            is_active: true,
            image_url: 'https://i.imgur.com/8YwZmtP.png'
          }
        ]

        await this.supabase.from('loot_boxes').insert(testBoxes)
      }
    } catch (error) {
      console.error('Erreur initialisation données:', error)
      throw error
    }
  }
}

export default function BattleSystemAdmin() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth() // ✅ NOUVEAU STANDARD
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const [notification, setNotification] = useState<Notification>({ type: 'info', message: '' })

  const supabase = createClient() // ✅ NOUVEAU CLIENT
  const router = useRouter()
  const initializer = new BattleSystemInitializer(supabase) // ✅ Passer le client

  const showNotification = (type: Notification['type'], message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification({ type: 'info', message: '' }), 5000)
  }

  // ✅ PROTECTION DE ROUTE STANDARD
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
      await checkSystem()
    } catch (error) {
      console.error('Erreur chargement:', error)
      showNotification('error', 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const checkSystem = async () => {
    try {
      const status = await initializer.checkSystemStatus()
      setSystemStatus(status)

      const systemStats = await initializer.getSystemStats()
      setStats(systemStats)
    } catch (error) {
      console.error('Erreur vérification système:', error)
      showNotification('error', 'Erreur lors de la vérification')
    }
  }

  const initializeSystem = async () => {
    setInitializing(true)
    try {
      showNotification('info', 'Initialisation en cours...')
      
      await initializer.initializeTestData()
      await checkSystem()
      
      showNotification('success', 'Système initialisé avec succès !')
    } catch (error) {
      console.error('Erreur initialisation:', error)
      showNotification('error', 'Erreur lors de l\'initialisation')
    } finally {
      setInitializing(false)
    }
  }

  const testBoxOpening = async () => {
    setTesting(true)
    try {
      const results = await initializer.testBoxOpening('STARTER SNEAKER BOX', 3)
      setTestResults(results)
      showNotification('success', 'Test d\'ouverture réussi !')
    } catch (error) {
      console.error('Erreur test:', error)
      showNotification('error', 'Erreur lors du test d\'ouverture')
    } finally {
      setTesting(false)
    }
  }

  // ✅ LOADING STATE STANDARD
  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">
            {authLoading ? 'Vérification authentification...' : 'Chargement du panel admin...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      {/* Notification */}
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
            notification.type === 'error' 
              ? 'bg-red-900/80 border-red-700/50 text-red-100' 
              : notification.type === 'info'
              ? 'bg-blue-900/80 border-blue-700/50 text-blue-100'
              : 'bg-green-900/80 border-green-700/50 text-green-100'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : notification.type === 'info' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Database className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Battle System Admin</h1>
          <p className="text-gray-400">Gestion et administration du système de battles ReveelBox</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${
              systemStatus?.isReady 
                ? 'bg-green-900/20 border-green-700/30' 
                : 'bg-red-900/20 border-red-700/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {systemStatus?.isReady ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-400" />
              )}
              <span className="font-semibold">Système</span>
            </div>
            <p className={`text-sm ${systemStatus?.isReady ? 'text-green-300' : 'text-red-300'}`}>
              {systemStatus?.isReady ? 'Opérationnel' : 'Non initialisé'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl border bg-blue-900/20 border-blue-700/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Box className="h-6 w-6 text-blue-400" />
              <span className="font-semibold">Loot Boxes</span>
            </div>
            <p className="text-2xl font-bold text-blue-300">{stats?.lootBoxes || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border bg-purple-900/20 border-purple-700/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Gift className="h-6 w-6 text-purple-400" />
              <span className="font-semibold">Items</span>
            </div>
            <p className="text-2xl font-bold text-purple-300">{stats?.items || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl border bg-yellow-900/20 border-yellow-700/30"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sword className="h-6 w-6 text-yellow-400" />
              <span className="font-semibold">Battles</span>
            </div>
            <p className="text-2xl font-bold text-yellow-300">{stats?.battles || 0}</p>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Initialisation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-red-500" />
              Initialisation du Système
            </h2>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                {systemStatus?.isReady 
                  ? 'Le système est opérationnel. Vous pouvez réinitialiser si nécessaire.'
                  : 'Le système n\'est pas initialisé. Cliquez pour créer les données de base.'
                }
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Loot Boxes:</span>
                  <span className={systemStatus?.hasBoxes ? 'text-green-400' : 'text-red-400'}>
                    {systemStatus?.hasBoxes ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Items:</span>
                  <span className={systemStatus?.hasItems ? 'text-green-400' : 'text-red-400'}>
                    {systemStatus?.hasItems ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Relations:</span>
                  <span className={systemStatus?.hasRelations ? 'text-green-400' : 'text-red-400'}>
                    {systemStatus?.hasRelations ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={initializeSystem}
                  disabled={initializing}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${
                    initializing
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg'
                  }`}
                >
                  {initializing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {initializing ? 'Initialisation...' : 'Initialiser'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={checkSystem}
                  className="px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Tests */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Tests et Validation
            </h2>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                Testez l'ouverture des loot boxes pour vérifier le bon fonctionnement du système.
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={testBoxOpening}
                disabled={testing || !systemStatus?.isReady}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${
                  testing || !systemStatus?.isReady
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                }`}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                {testing ? 'Test en cours...' : 'Tester Ouverture'}
              </motion.button>

              {testResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl"
                >
                  <h3 className="font-semibold text-green-400 mb-2">Résultats du test :</h3>
                  <div className="space-y-2 text-sm">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-300">{result.item_name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.item_rarity === 'legendary' ? 'bg-yellow-600 text-white' :
                            result.item_rarity === 'epic' ? 'bg-purple-600 text-white' :
                            result.item_rarity === 'rare' ? 'bg-blue-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {result.item_rarity}
                          </span>
                          <span className="text-yellow-400 font-medium">{result.total_value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Statistiques détaillées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            Statistiques Détaillées
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{stats?.lootBoxes || 0}</div>
              <div className="text-sm text-gray-400">Loot Boxes Actives</div>
              <div className="text-xs text-gray-500 mt-1">Prêtes pour les battles</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{stats?.items || 0}</div>
              <div className="text-sm text-gray-400">Items Disponibles</div>
              <div className="text-xs text-gray-500 mt-1">Dans le système</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats?.relations || 0}</div>
              <div className="text-sm text-gray-400">Relations Configurées</div>
              <div className="text-xs text-gray-500 mt-1">Probabilités définies</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{stats?.battles || 0}</div>
              <div className="text-sm text-gray-400">Battles Créées</div>
              <div className="text-xs text-gray-500 mt-1">Historique total</div>
            </div>
          </div>
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          <a
            href="/battle"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Sword className="h-4 w-4" />
            Voir les Battles
          </a>
          
          <a
            href="/battle/create"
            className="flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer une Battle
          </a>
          
          <a
            href="/boxes"
            className="flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Gift className="h-4 w-4" />
            Voir les Loot Boxes
          </a>
        </motion.div>

        {/* Warning pour la démo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-xl text-center"
        >
          <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Mode Démo</span>
          </div>
          <p className="text-yellow-200 text-sm">
            Cette interface admin est en mode démo. Pour une utilisation en production, 
            ajoutez des vérifications de permissions appropriées.
          </p>
        </motion.div>
      </div>
    </div>
  )
}