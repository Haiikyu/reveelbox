'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InventoryCleanerPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState<string>('')

  const loadStats = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('id, item_id, obtained_at, obtained_from')
        .eq('user_id', user.id)
        .eq('is_sold', false)

      if (error) throw error

      const totalItems = data?.length || 0
      const uniqueItems = new Set(
        data?.map(item => `${item.item_id}-${item.obtained_at}-${item.obtained_from}`)
      ).size

      setStats({
        totalItems,
        uniqueItems,
        duplicates: totalItems - uniqueItems
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const cleanDuplicates = async () => {
    if (!user?.id) return

    setLoading(true)
    setError('')
    setResult('')
    setProgress('')

    try {
      let totalDeleted = 0
      let batchCount = 0
      let deleted = 0

      // Boucle : supprimer 50 doublons à la fois jusqu'à ce qu'il n'y en ait plus
      do {
        batchCount++
        setProgress(`🔄 Batch ${batchCount} en cours...`)

        const { data, error } = await supabase.rpc('delete_duplicates_batch', {
          p_user_id: user.id,
          p_limit: 50
        })

        if (error) throw error

        deleted = data || 0
        totalDeleted += deleted

        setProgress(`✅ Batch ${batchCount} : ${deleted} doublons supprimés (total: ${totalDeleted})`)

        // Petit délai pour ne pas saturer
        if (deleted > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } while (deleted > 0)

      setResult(`✅ Nettoyage terminé !\n${totalDeleted} doublons supprimés\n${batchCount} batchs traités`)
      setProgress('')
      await loadStats()
    } catch (err: any) {
      setError(`Erreur : ${err.message}`)
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  const clearAllInventory = async () => {
    if (!user?.id) return

    const confirmed = confirm('⚠️ ATTENTION : Cette action va supprimer TOUS tes items ! Es-tu sûr ?')
    if (!confirmed) return

    setLoading(true)
    setError('')
    setResult('')
    setProgress('')

    try {
      let totalDeleted = 0
      let batchCount = 0
      let deleted = 0

      // Boucle : supprimer 50 items à la fois jusqu'à ce qu'il n'y en ait plus
      do {
        batchCount++
        setProgress(`🔄 Batch ${batchCount} en cours...`)

        const { data, error } = await supabase.rpc('delete_inventory_batch', {
          p_user_id: user.id,
          p_limit: 50
        })

        if (error) throw error

        deleted = data || 0
        totalDeleted += deleted

        setProgress(`✅ Batch ${batchCount} : ${deleted} items supprimés (total: ${totalDeleted})`)

        // Petit délai pour ne pas saturer
        if (deleted > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } while (deleted > 0)

      setResult(`✅ Inventaire vidé !\n${totalDeleted} items supprimés\n${batchCount} batchs traités`)
      setProgress('')
      await loadStats()
    } catch (err: any) {
      setError(`Erreur : ${err.message}`)
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10"
        >
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Trash2 className="text-red-500" />
            Nettoyage d'inventaire
          </h1>

          {/* Statistiques */}
          <div className="mb-6">
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {loading ? 'Chargement...' : 'Charger les statistiques'}
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Total items</div>
                <div className="text-white text-2xl font-bold">{stats.totalItems}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Items uniques</div>
                <div className="text-green-500 text-2xl font-bold">{stats.uniqueItems}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-white/60 text-sm mb-1">Doublons</div>
                <div className="text-red-500 text-2xl font-bold">{stats.duplicates}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4 mb-6">
            <button
              onClick={cleanDuplicates}
              disabled={loading || !stats || stats.duplicates === 0}
              className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex flex-col items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Nettoyage en cours...
                  </div>
                  <div className="text-xs text-white/70">
                    Traitement par batch, cela peut prendre quelques secondes...
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Supprimer les doublons ({stats?.duplicates || 0})
                </>
              )}
            </button>

            <button
              onClick={clearAllInventory}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex flex-col items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Suppression en cours...
                  </div>
                  <div className="text-xs text-white/70">
                    Traitement par batch, cela peut prendre quelques secondes...
                  </div>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Vider tout l'inventaire
                </>
              )}
            </button>
          </div>

          {/* Progression */}
          {progress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-4"
            >
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                <p className="text-blue-400 text-sm">{progress}</p>
              </div>
            </motion.div>
          )}

          {/* Résultats */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <pre className="text-green-400 text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">ℹ️ Information</h3>
            <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
              <li>Les doublons sont des items identiques obtenus au même moment</li>
              <li>Le nettoyage garde seulement 1 exemplaire de chaque</li>
              <li>Traitement par batch de 100 items pour éviter les timeouts</li>
              <li>Cette action est irréversible</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
