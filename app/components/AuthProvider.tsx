'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

// ✅ INTERFACE PROFILE UNIQUE ET COMPLETE
export interface Profile {
  id: string
  username?: string
  email?: string
  bio?: string
  location?: string
  phone?: string
  birth_date?: string
  avatar_url?: string
  privacy_profile?: 'public' | 'private'
  notifications_email?: boolean
  notifications_push?: boolean
  virtual_currency?: number
  loyalty_points?: number
  total_exp?: number
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  
  const supabase = createClient()

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      setProfileLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erreur profil:', error)
        
        // Créer le profil s'il n'existe pas
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              virtual_currency: 1000,
              loyalty_points: 0,
              total_exp: 0
            })
            .select()
            .single()

          if (createError) {
            console.error('Erreur création profil:', createError)
            return null
          }
          
          return newProfile as Profile
        }
        
        return null
      }

      return data as Profile
    } catch (error) {
      console.error('Erreur fetch profil:', error)
      return null
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    
    const profileData = await fetchProfile(user.id)
    if (profileData) {
      setProfile(profileData)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      
      await refreshProfile()
    } catch (error) {
      console.error('Erreur update profil:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      throw error
    }
  }

  useEffect(() => {
    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur session:', error)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Erreur init session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!user && !!session

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        refreshProfile,
        updateProfile,
        signOut,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}