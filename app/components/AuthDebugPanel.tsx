'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'

// ⚠️ COMPOSANT TEMPORAIRE - À supprimer en production
export function AuthDebugPanel() {
  const { user, session, profile, loading, profileLoading, isAuthenticated } = useAuth()
  const [show, setShow] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const supabase = createClient()

  // Vérification périodique de la session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSessionInfo({
        hasSession: !!currentSession,
        expiresAt: currentSession?.expires_at,
        refreshToken: !!currentSession?.refresh_token,
        accessToken: !!currentSession?.access_token
      })
    }

    checkSession()
    const interval = setInterval(checkSession, 5000) // Check toutes les 5 secondes

    return () => clearInterval(interval)
  }, [supabase])

  // Masquer en production
  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShow(!show)}
        className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-mono shadow-lg hover:bg-red-600 transition-colors"
      >
        🐛 Debug Auth
      </button>
      
      {show && (
        <div className="absolute bottom-12 right-0 bg-black text-white p-4 rounded-lg text-xs font-mono w-80 max-h-96 overflow-y-auto shadow-2xl border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-yellow-400 font-bold">Auth Debug</h3>
            <button 
              onClick={() => setShow(false)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
              <span>Loading: {loading.toString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${profileLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
              <span>Profile Loading: {profileLoading.toString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>Authenticated: {isAuthenticated.toString()}</span>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <div>User ID: {user?.id ? user.id.slice(0, 8) + '...' : 'None'}</div>
              <div>User Email: {user?.email || 'None'}</div>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <div>Session Valid: {sessionInfo?.hasSession ? '✅' : '❌'}</div>
              <div>Access Token: {sessionInfo?.accessToken ? '✅' : '❌'}</div>
              <div>Refresh Token: {sessionInfo?.refreshToken ? '✅' : '❌'}</div>
              {sessionInfo?.expiresAt && (
                <div>Expires: {new Date(sessionInfo.expiresAt * 1000).toLocaleTimeString()}</div>
              )}
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <div>Profile: {profile ? '✅' : '❌'}</div>
              {profile && (
                <>
                  <div>Username: {profile.username || 'None'}</div>
                  <div>Coins: {profile.virtual_currency}</div>
                </>
              )}
            </div>
            
            <div className="border-t border-gray-600 pt-2 space-y-1">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 px-2 py-1 rounded text-xs mr-2 hover:bg-blue-700"
              >
                Reload
              </button>
              <button 
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
              >
                Clear & Reload
              </button>
              <div className="mt-2">
                <div className="text-gray-400 text-[10px]">
                  Last Check: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}