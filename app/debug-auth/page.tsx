// app/debug-auth/page.tsx - PAGE DE DEBUG TEMPORAIRE

'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { user, session, profile, loading, isAuthenticated } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Test direct Supabase
        const { data: { session: directSession }, error } = await supabase.auth.getSession()
        
        setDebugInfo({
          contextUser: !!user,
          contextUserId: user?.id,
          contextSession: !!session,
          contextProfile: !!profile,
          contextLoading: loading,
          contextAuthenticated: isAuthenticated,
          directSession: !!directSession,
          directUserId: directSession?.user?.id,
          directError: error?.message,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }

    checkAuth()
    
    // Répéter toutes les 5 secondes
    const interval = setInterval(checkAuth, 5000)
    return () => clearInterval(interval)
  }, [user, session, profile, loading, isAuthenticated])

  const testOperations = {
    async testProfileFetch() {
      if (!user) return alert('Pas d\'utilisateur')
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        alert('✅ Profile fetch réussi')
        console.log('Profile data:', data)
      } catch (error) {
        alert('❌ Profile fetch échoué: ' + error.message)
        console.error(error)
      }
    },

    async testLootBoxFetch() {
      try {
        const { data, error } = await supabase
          .from('loot_boxes')
          .select('*')
          .limit(5)
        
        if (error) throw error
        alert(`✅ Loot boxes fetch réussi: ${data.length} boxes`)
        console.log('Loot boxes:', data)
      } catch (error) {
        alert('❌ Loot boxes fetch échoué: ' + error.message)
        console.error(error)
      }
    },

    async testSessionRefresh() {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) throw error
        alert('✅ Session refresh réussi')
        console.log('Refreshed session:', data)
      } catch (error) {
        alert('❌ Session refresh échoué: ' + error.message)
        console.error(error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center text-red-600">
            🔍 Debug Authentification ReveelBox
          </h1>

          {/* État en temps réel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-blue-800 mb-4">📊 État AuthProvider</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>User:</span>
                  <span className={debugInfo.contextUser ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {debugInfo.contextUser ? '✅ Présent' : '❌ Absent'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="text-xs font-mono">{debugInfo.contextUserId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Session:</span>
                  <span className={debugInfo.contextSession ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {debugInfo.contextSession ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profile:</span>
                  <span className={debugInfo.contextProfile ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {debugInfo.contextProfile ? '✅ Chargé' : '❌ Non chargé'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span className={debugInfo.contextLoading ? 'text-yellow-600' : 'text-green-600'}>
                    {debugInfo.contextLoading ? '⏳ En cours' : '✅ Terminé'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <span className={debugInfo.contextAuthenticated ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {debugInfo.contextAuthenticated ? '✅ OUI' : '❌ NON'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-green-800 mb-4">🔧 Test Direct Supabase</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Session Directe:</span>
                  <span className={debugInfo.directSession ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {debugInfo.directSession ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>User ID Direct:</span>
                  <span className="text-xs font-mono">{debugInfo.directUserId || 'N/A'}</span>
                </div>
                {debugInfo.directError && (
                  <div className="text-red-600 text-xs">
                    Erreur: {debugInfo.directError}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Dernière vérification: {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Informations détaillées */}
          {profile && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-bold text-yellow-800 mb-4">👤 Détails Profil</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Username:</span>
                  <div className="text-gray-600">{profile.username || 'Non défini'}</div>
                </div>
                <div>
                  <span className="font-medium">Coins:</span>
                  <div className="text-green-600 font-bold">{profile.virtual_currency}</div>
                </div>
                <div>
                  <span className="font-medium">Level:</span>
                  <div className="text-blue-600 font-bold">{Math.floor((profile.total_exp || 0) / 100) + 1}</div>
                </div>
                <div>
                  <span className="font-medium">XP:</span>
                  <div className="text-purple-600">{profile.total_exp || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tests manuels */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🧪 Tests Manuels</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={testOperations.testProfileFetch}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Test Profile Fetch
              </button>
              <button 
                onClick={testOperations.testLootBoxFetch}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Test Loot Boxes
              </button>
              <button 
                onClick={testOperations.testSessionRefresh}
                className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Session
              </button>
            </div>
          </div>

          {/* Diagnostic */}
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <h3 className="font-bold text-red-800 mb-2">🚨 Diagnostic</h3>
            <div className="text-sm text-red-700">
              {!debugInfo.contextUser && !debugInfo.directSession && (
                <p>❌ <strong>Problème majeur:</strong> Aucune session détectée nulle part</p>
              )}
              {debugInfo.contextUser && !debugInfo.contextProfile && (
                <p>⚠️ <strong>Problème mineur:</strong> User présent mais profil non chargé</p>
              )}
              {debugInfo.contextUser !== debugInfo.directSession && (
                <p>⚠️ <strong>Incohérence:</strong> AuthProvider et Supabase direct ne correspondent pas</p>
              )}
              {debugInfo.contextUser && debugInfo.directSession && debugInfo.contextProfile && (
                <p>✅ <strong>Tout va bien:</strong> Authentification cohérente</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">📋 Comment utiliser</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Vérifiez que tous les indicateurs sont verts</li>
              <li>2. Testez les opérations manuelles</li>
              <li>3. Naviguez entre les pages et revenez ici</li>
              <li>4. Surveillez les changements d'état en temps réel</li>
              <li>5. Si problème persistant, copiez ces infos pour debug</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}