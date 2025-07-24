'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  username?: string
  virtual_currency: number
  loyalty_points: number
  total_exp: number
  bio?: string
  location?: string
  phone?: string
  birth_date?: string
  avatar_url?: string
  privacy_profile: string
  notifications_email: boolean
  notifications_push: boolean
  created_at: string
  updated_at: string
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

  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true)
      console.log('🔍 Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Erreur profil:', error)
        
        // Si le profil n'existe pas, le créer
        if (error.code === 'PGRST116') {
          console.log('📝 Création du profil utilisateur...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              virtual_currency: 1000, // Coins de départ
              loyalty_points: 0,
              total_exp: 0,
              privacy_profile: 'public',
              notifications_email: true,
              notifications_push: true
            })
            .select()
            .single()

          if (createError) {
            console.error('❌ Erreur création profil:', createError)
            return null
          }
          
          console.log('✅ Profil créé avec succès')
          return newProfile
        }
        
        return null
      }

      console.log('✅ Profil récupéré:', data.username || 'sans username')
      return data
    } catch (error) {
      console.error('💥 Erreur fetch profil:', error)
      return null
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user) {
      console.log('⚠️ Pas d\'utilisateur pour refresh profile')
      return
    }
    
    console.log('🔄 Refreshing profile...')
    const profileData = await fetchProfile(user.id)
    if (profileData) {
      setProfile(profileData)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      console.error('❌ Pas d\'utilisateur pour update')
      return
    }

    try {
      console.log('📝 Updating profile:', updates)
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      
      await refreshProfile()
      console.log('✅ Profil mis à jour')
    } catch (error) {
      console.error('❌ Erreur update profil:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('👋 Déconnexion...')
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
      setProfile(null)
      
      console.log('✅ Déconnexion réussie')
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error)
      throw error
    }
  }

  useEffect(() => {
    console.log('🚀 Initialisation AuthProvider...')
    
    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        console.log('🔍 Récupération session initiale...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erreur session:', error)
          setLoading(false)
          return
        }

        console.log('📊 Session récupérée:', session ? 'ACTIVE' : 'INACTIVE')
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('👤 Utilisateur trouvé, chargement profil...')
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          console.log('👻 Aucun utilisateur connecté')
        }
      } catch (error) {
        console.error('💥 Erreur init session:', error)
      } finally {
        setLoading(false)
        console.log('✅ Initialisation terminée')
      }
    }

    getInitialSession()

    // Écouter les changements d'auth
    console.log('👂 Mise en place du listener auth...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event, session?.user?.id ? 'avec user' : 'sans user')
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('👤 Nouveau user, chargement profil...')
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          console.log('👻 User supprimé, nettoyage profil')
          setProfile(null)
        }

        if (event === 'SIGNED_OUT') {
          console.log('🚪 Événement de déconnexion')
        }
      }
    )

    return () => {
      console.log('🧹 Nettoyage subscription auth')
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!user && !!session

  // Debug logging
  useEffect(() => {
    console.log('📊 Auth State:', {
      hasUser: !!user,
      hasSession: !!session,
      hasProfile: !!profile,
      loading,
      isAuthenticated
    })
  }, [user, session, profile, loading, isAuthenticated])

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