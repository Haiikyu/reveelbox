'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function TestAuth() {
  const { user, profile, loading, isAuthenticated, refreshProfile } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [testLoading, setTestLoading] = useState(false)
  const supabase = createClient()

  const runTests = async () => {
    setTestLoading(true)
    const results = []

    try {
      // Test 1: Connexion à la DB
      const { data: dbTest, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (dbError) {
        results.push('❌ DB Connection: ' + dbError.message)
      } else {
        results.push('✅ DB Connection: OK')
      }

      // Test 2: Session utilisateur
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        results.push('❌ Session: ' + sessionError.message)
      } else if (session) {
        results.push('✅ Session: Active (' + session.user.email + ')')
      } else {
        results.push('ℹ️ Session: Aucune session active')
      }

      // Test 3: Profil utilisateur
      if (user) {
        const { data: profileTest, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          results.push('❌ Profile: ' + profileError.message)
        } else {
          results.push('✅ Profile: Chargé (' + (profileTest.username || 'sans username') + ')')
        }
      }

      // Test 4: Coins
      if (profile) {
        results.push('✅ Coins: ' + profile.virtual_currency + ' disponibles')
      }

    } catch (error) {
      results.push('❌ Test général: ' + error.message)
    }

    setTestResult(results.join('\n'))
    setTestLoading(false)
  }

  const testCoinsUpdate = async () => {
    if (!user) return

    try {
      setTestLoading(true)
      
      // Ajouter 100 coins de test
      const { data, error } = await supabase.rpc('add_virtual_currency', {
        user_id: user.id,
        amount: 100
      })

      if (error) {
        setTestResult('❌ Test coins: ' + error.message)
      } else {
        setTestResult('✅ Test coins: +100 coins ajoutés')
        await refreshProfile()
      }
    } catch (error) {
      setTestResult('❌ Test coins: ' + error.message)
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du test...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🧪 Test Système Auth Moderne
          </h1>

          {/* État actuel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🔐 État Authentication
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Statut:</span>
                  <span className={`font-bold ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                    {isAuthenticated ? '✅ Connecté' : '❌ Déconnecté'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">User ID:</span>
                  <span className="text-sm text-gray-600 font-mono">
                    {user?.id?.slice(0, 8) || 'N/A'}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Email:</span>
                  <span className="text-sm text-gray-600">
                    {user?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Username:</span>
                  <span className="text-sm text-gray-600">
                    {profile?.username || 'Non défini'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                💰 Profil & Coins
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Coins:</span>
                  <span className="font-bold text-yellow-600">
                    {profile?.virtual_currency?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Niveau:</span>
                  <span className="font-bold text-blue-600">
                    {Math.floor((profile?.total_exp || 0) / 100) + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">XP:</span>
                  <span className="text-sm text-gray-600">
                    {profile?.total_exp || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Points fidélité:</span>
                  <span className="text-sm text-gray-600">
                    {profile?.loyalty_points || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons de test */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={runTests}
                disabled={testLoading}
                className="bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '🔍'
                )}
                Test Complet
              </button>

              <button
                onClick={testCoinsUpdate}
                disabled={testLoading || !isAuthenticated}
                className="bg-green-500 text-white py-3 px-6 rounded-xl hover:bg-green-600 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                💰 Test +100 Coins
              </button>

              <button
                onClick={refreshProfile}
                disabled={testLoading || !isAuthenticated}
                className="bg-purple-500 text-white py-3 px-6 rounded-xl hover:bg-purple-600 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                🔄 Refresh Profil
              </button>
            </div>

            {/* Résultats des tests */}
            {testResult && (
              <div className="bg-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm">
                <h3 className="text-white font-bold mb-3">📋 Résultats des Tests :</h3>
                <pre className="whitespace-pre-wrap">{testResult}</pre>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="font-bold text-blue-900 mb-3">📝 Instructions de Test :</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>1. Cliquez sur "Test Complet" pour vérifier toutes les connexions</li>
              <li>2. Si connecté, testez l'ajout de coins</li>
              <li>3. Vérifiez que les données se mettent à jour automatiquement</li>
              <li>4. Ouvrez la console (F12) pour voir les logs détaillés</li>
              <li>5. Naviguez entre les pages pour tester la persistance de session</li>
            </ul>
          </div>

          {/* Liens de navigation */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <a 
              href="/"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              🏠 Accueil
            </a>
            <a 
              href="/profile"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              👤 Profil
            </a>
            <a 
              href="/boxes"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              📦 Boxes
            </a>
            {isAuthenticated && (
              <a 
                href="/inventory"
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                🎒 Inventaire
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}