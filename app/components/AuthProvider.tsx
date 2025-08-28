'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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
  role: string  // ← ADD THIS LINE
  is_admin: boolean  // ← ADD THIS LINE TOO
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
  
  // Refs pour éviter les boucles infinies
  const supabaseRef = useRef(createClient())
  const initializingRef = useRef(false)
  const profileCacheRef = useRef<{ userId: string, profile: Profile } | null>(null)

  // ✅ SOLUTION 1: Fonction de chargement du profil avec cache
  const loadProfile = useCallback(async (userId: string, forceRefresh = false) => {
    // Utiliser le cache si disponible et pas de refresh forcé
    if (!forceRefresh && profileCacheRef.current?.userId === userId) {
      setProfile(profileCacheRef.current.profile)
      return
    }

    setProfileLoading(true)
    try {
      const { data, error } = await supabaseRef.current
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Erreur chargement profil:', error)
        setProfile(null)
        profileCacheRef.current = null
      } else if (data) {
        setProfile(data)
        profileCacheRef.current = { userId, profile: data }
      }
    } catch (error) {
      console.error('Erreur loadProfile:', error)
      setProfile(null)
      profileCacheRef.current = null
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // ✅ SOLUTION 2: Initialisation robuste avec protection contre les boucles
  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return
    initializingRef.current = true

    try {
      // 1. Récupérer la session courante
      const { data: { session: currentSession }, error: sessionError } = await supabaseRef.current.auth.getSession()
      
      if (sessionError) {
        console.error('Erreur récupération session:', sessionError)
        setUser(null)
        setSession(null)
        setProfile(null)
        profileCacheRef.current = null
        return
      }

      // 2. Mettre à jour l'état
      if (currentSession?.user) {
        setUser(currentSession.user)
        setSession(currentSession)
        
        // 3. Charger le profil seulement si nécessaire
        if (!profileCacheRef.current || profileCacheRef.current.userId !== currentSession.user.id) {
          await loadProfile(currentSession.user.id)
        }
      } else {
        setUser(null)
        setSession(null)
        setProfile(null)
        profileCacheRef.current = null
      }
    } catch (error) {
      console.error('Erreur initialisation auth:', error)
      setUser(null)
      setSession(null)
      setProfile(null)
      profileCacheRef.current = null
    } finally {
      setLoading(false)
      initializingRef.current = false
    }
  }, [loadProfile])

  // ✅ SOLUTION 3: Effet d'initialisation avec cleanup
  useEffect(() => {
    initializeAuth()

    // ✅ SOLUTION 4: Listener d'authentification avec debounce
    let timeoutId: NodeJS.Timeout | null = null
    
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, newSession) => {
        // Debounce pour éviter les appels multiples
        if (timeoutId) clearTimeout(timeoutId)
        
        timeoutId = setTimeout(async () => {
          console.log('🔐 Auth state change:', event, newSession?.user?.id)
          
          if (event === 'SIGNED_OUT' || !newSession?.user) {
            setUser(null)
            setSession(null)
            setProfile(null)
            profileCacheRef.current = null
            setLoading(false)
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(newSession.user)
            setSession(newSession)
            
            // Charger le profil seulement si c'est un nouvel utilisateur
            if (!profileCacheRef.current || profileCacheRef.current.userId !== newSession.user.id) {
              await loadProfile(newSession.user.id)
            }
            setLoading(false)
          }
        }, 100) // Debounce de 100ms
      }
    )

    // ✅ SOLUTION 5: Cleanup proper
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      initializingRef.current = false
    }
  }, [initializeAuth, loadProfile])

  // ✅ SOLUTION 6: Refresh profile avec gestion d'erreurs
  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.id, true) // Force refresh
  }, [user, loadProfile])

  // ✅ SOLUTION 7: Update profile optimiste avec rollback
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user || !profile) return

    // Mise à jour optimiste
    const previousProfile = profile
    const updatedProfile = { ...profile, ...updates }
    setProfile(updatedProfile)
    profileCacheRef.current = { userId: user.id, profile: updatedProfile }

    try {
      const { error } = await supabaseRef.current
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        // Rollback en cas d'erreur
        setProfile(previousProfile)
        profileCacheRef.current = { userId: user.id, profile: previousProfile }
        throw error
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error)
      throw error
    }
  }, [user, profile])

  // ✅ SOLUTION 8: SignOut avec cleanup complet
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabaseRef.current.auth.signOut()
      
      if (error) {
        console.error('Erreur déconnexion:', error)
      }
      
      // Cleanup immédiat
      setUser(null)
      setSession(null)
      setProfile(null)
      profileCacheRef.current = null
      
      // Clear localStorage si nécessaire
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('redirectAfterLogin')
        localStorage.removeItem('redirectAfterSignup')
      }
    } catch (error) {
      console.error('Erreur signOut:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ SOLUTION 9: Valeur du contexte mémorisée
  const contextValue = useCallback(() => ({
    user,
    session,
    profile,
    loading,
    profileLoading,
    refreshProfile,
    updateProfile,
    signOut,
    isAuthenticated: !!user && !!session
  }), [user, session, profile, loading, profileLoading, refreshProfile, updateProfile, signOut])

  return (
    <AuthContext.Provider value={contextValue()}>
      {children}
    </AuthContext.Provider>
  )
}

// ✅ SOLUTION 10: Hook useAuth avec vérification
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ✅ SOLUTION 11: Hook de vérification de session
export function useAuthCheck() {
  const { user, loading } = useAuth()
  const [isValidating, setIsValidating] = useState(false)
  const supabase = createClient()

  const validateSession = useCallback(async () => {
    if (loading || !user) return true

    setIsValidating(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.log('Session invalide, déconnexion...')
        await supabase.auth.signOut()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Erreur validation session:', error)
      return false
    } finally {
      setIsValidating(false)
    }
  }, [user, loading, supabase])

  return { validateSession, isValidating }
}