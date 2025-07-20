'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile } from '@/lib/supabase.js'

const AuthContext = createContext<any>({})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    // Écouter les changements d'authentification SANS REDIRECTIONS
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth change:', event, session?.user?.email)
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      // AUCUNE REDIRECTION AUTOMATIQUE - Laissons les pages gérer ça
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await getProfile(userId)
      if (data) {
        setProfile(data)
      } else {
        // Profil par défaut si non trouvé
        setProfile({
          id: userId,
          virtual_currency: 100,
          loyalty_points: 0,
          total_exp: 0
        })
      }
    } catch (error) {
      console.error('Erreur profil:', error)
      setProfile({
        id: userId,
        virtual_currency: 100,
        loyalty_points: 0,
        total_exp: 0
      })
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    refreshProfile,
    signOut: () => supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}