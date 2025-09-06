'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { calculateLevel } from '@/lib/xp-system' // Import du système centralisé

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
  role: string
  is_admin: boolean
  created_at: string
  updated_at: string
  // Propriétés calculées avec le système XP centralisé
  level?: number
  current_level_exp?: number
  exp_to_next?: number
  progress_percentage?: number
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

  // Fonction utilitaire pour enrichir le profil avec les données XP calculées
  const enrichProfileWithXP = (profileData: any): Profile => {
    if (!profileData) return profileData
    
    const totalExp = profileData.total_exp || 0
    const level = calculateLevel(totalExp)
    const currentLevelExp = totalExp % 100
    const expToNext = 100 - currentLevelExp
    const progressPercentage = Math.round((currentLevelExp / 100) * 100)
    
    return {
      ...profileData,
      level,
      current_level_exp: currentLevelExp,
      exp_to_next: expToNext,
      progress_percentage: progressPercentage
    }
  }

  // Fonction de chargement du profil avec cache et XP enrichie
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
        // Enrichir le profil avec les calculs XP centralisés
        const enrichedProfile = enrichProfileWithXP(data)
        setProfile(enrichedProfile)
        profileCacheRef.current = { userId, profile: enrichedProfile }
      }
    } catch (error) {
      console.error('Erreur loadProfile:', error)
      setProfile(null)
      profileCacheRef.current = null
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // Initialisation robuste avec protection contre les boucles
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

  // Effet d'initialisation avec cleanup
  useEffect(() => {
    initializeAuth()

    // Listener d'authentification avec debounce
    let timeoutId: NodeJS.Timeout | null = null
    
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, newSession) => {
        // Debounce pour éviter les appels multiples
        if (timeoutId) clearTimeout(timeoutId)
        
        timeoutId = setTimeout(async () => {
          console.log('🔍 Auth state change:', event, newSession?.user?.id)
          
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

    // Cleanup proper
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      initializingRef.current = false
    }
  }, [initializeAuth, loadProfile])

  // Refresh profile avec gestion d'erreurs et recalcul XP
  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.id, true) // Force refresh avec recalcul XP
  }, [user, loadProfile])

  // Update profile optimiste avec rollback et recalcul XP
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user || !profile) return

    // Si on met à jour l'XP, recalculer les propriétés dérivées
    const updatedData = updates.total_exp !== undefined 
      ? enrichProfileWithXP({ ...profile, ...updates })
      : { ...profile, ...updates }

    // Mise à jour optimiste
    const previousProfile = profile
    setProfile(updatedData)
    profileCacheRef.current = { userId: user.id, profile: updatedData }

    try {
      // Ne sauvegarder que les champs de base (pas les calculés)
      const { level, current_level_exp, exp_to_next, progress_percentage, ...dbUpdates } = updates
      
      const { error } = await supabaseRef.current
        .from('profiles')
        .update(dbUpdates)
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

  // SignOut avec cleanup complet
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

  // Valeur du contexte mémorisée
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

// Hook useAuth avec vérification
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook de vérification de session
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