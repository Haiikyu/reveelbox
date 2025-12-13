'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient, resetSupabaseInstance } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { calculateLevel } from '@/lib/xp-system'

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
  level?: number
  current_level_exp?: number
  current_level_xp?: number
  exp_to_next?: number
  next_level_xp?: number
  progress_percentage?: number
  coins_balance?: number
  theme?: any
  consecutive_days?: number
  longest_streak?: number
  last_activity?: string
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
  
  const supabaseRef = useRef(createClient())
  const initializingRef = useRef(false)
  const profileCacheRef = useRef<{ userId: string, profile: Profile } | null>(null)

  const enrichProfileWithXP = (profileData: any): Profile => {
    if (!profileData) return profileData
    
    const totalExp = profileData.total_exp || 0
    const level = calculateLevel(totalExp)
    
    // Calculer l'XP actuel dans le niveau courant avec le nouveau système
    const currentLevelXP = getCurrentLevelExp(totalExp)
    const expToNext = getExpToNextLevel(totalExp)
    const progressPercentage = expToNext > 0 ? Math.round((currentLevelXP / expToNext) * 100) : 100
    
    return {
      ...profileData,
      level,
      current_level_exp: currentLevelXP,
      exp_to_next: expToNext,
      progress_percentage: progressPercentage
    }
  }

  // Fonctions helpers pour le nouveau système XP avec paliers
  const getCurrentLevelExp = (totalExp: number): number => {
    const LEVEL_THRESHOLDS = [
      { level: 1, xp: 0 },
      { level: 2, xp: 100 },
      { level: 10, xp: 1500 },
      { level: 20, xp: 7500 },
      { level: 30, xp: 20000 },
      { level: 40, xp: 50000 },
      { level: 50, xp: 150000 },
      { level: 60, xp: 350000 },
      { level: 70, xp: 1000000 },
      { level: 80, xp: 2500000 },
      { level: 90, xp: 7500000 },
      { level: 100, xp: 20000000 },
    ]
    
    const currentLevel = calculateLevel(totalExp)
    
    // Trouver l'XP minimum pour ce niveau
    for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
      if (currentLevel >= LEVEL_THRESHOLDS[i].level && currentLevel < LEVEL_THRESHOLDS[i + 1].level) {
        const lowerThreshold = LEVEL_THRESHOLDS[i]
        const upperThreshold = LEVEL_THRESHOLDS[i + 1]
        
        const levelInRange = currentLevel - lowerThreshold.level
        const levelRangeSize = upperThreshold.level - lowerThreshold.level
        const xpRange = upperThreshold.xp - lowerThreshold.xp
        
        const xpProgress = (levelInRange / levelRangeSize) * xpRange
        const currentLevelMinXP = Math.floor(lowerThreshold.xp + xpProgress)
        
        return totalExp - currentLevelMinXP
      }
    }
    
    return 0
  }
  
  const getExpToNextLevel = (totalExp: number): number => {
    const LEVEL_THRESHOLDS = [
      { level: 1, xp: 0 },
      { level: 2, xp: 100 },
      { level: 10, xp: 1500 },
      { level: 20, xp: 7500 },
      { level: 30, xp: 20000 },
      { level: 40, xp: 50000 },
      { level: 50, xp: 150000 },
      { level: 60, xp: 350000 },
      { level: 70, xp: 1000000 },
      { level: 80, xp: 2500000 },
      { level: 90, xp: 7500000 },
      { level: 100, xp: 20000000 },
    ]
    
    const currentLevel = calculateLevel(totalExp)
    if (currentLevel >= 100) return 0
    
    // Trouver l'XP pour le niveau suivant
    for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
      if (currentLevel >= LEVEL_THRESHOLDS[i].level && currentLevel < LEVEL_THRESHOLDS[i + 1].level) {
        const lowerThreshold = LEVEL_THRESHOLDS[i]
        const upperThreshold = LEVEL_THRESHOLDS[i + 1]
        
        // XP min pour niveau actuel
        const levelInRange = currentLevel - lowerThreshold.level
        const levelRangeSize = upperThreshold.level - lowerThreshold.level
        const xpRange = upperThreshold.xp - lowerThreshold.xp
        const xpProgress = (levelInRange / levelRangeSize) * xpRange
        const currentLevelMinXP = Math.floor(lowerThreshold.xp + xpProgress)
        
        // XP min pour niveau suivant
        const nextLevelInRange = currentLevel + 1 - lowerThreshold.level
        const nextXpProgress = (nextLevelInRange / levelRangeSize) * xpRange
        const nextLevelMinXP = Math.floor(lowerThreshold.xp + nextXpProgress)
        
        return nextLevelMinXP - currentLevelMinXP
      }
    }
    
    return 0
  }

  const loadProfile = useCallback(async (userId: string, forceRefresh = false) => {
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

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return
    initializingRef.current = true

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabaseRef.current.auth.getSession()
      
      if (sessionError) {
        console.error('Erreur récupération session:', sessionError)
        setUser(null)
        setSession(null)
        setProfile(null)
        profileCacheRef.current = null
        return
      }

      if (currentSession?.user) {
        setUser(currentSession.user)
        setSession(currentSession)
        
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

  useEffect(() => {
    initializeAuth()

    let timeoutId: NodeJS.Timeout | null = null

    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
      async (event, newSession) => {
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

            if (!profileCacheRef.current || profileCacheRef.current.userId !== newSession.user.id) {
              await loadProfile(newSession.user.id)
            }
            setLoading(false)
          }
        }, 100)
      }
    )

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
      initializingRef.current = false
    }
  }, [initializeAuth, loadProfile])

  // Real-time subscription pour les changements de profil
  useEffect(() => {
    if (!user?.id) return

    const channel = supabaseRef.current
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          console.log('💰 Balance update detected:', payload.new)
          
          const oldBalance = payload.old?.virtual_currency || 0
          const newBalance = payload.new?.virtual_currency || 0
          
          // Si la balance a BAISSÉ = dépense de coins
          if (newBalance < oldBalance) {
            const coinsSpent = oldBalance - newBalance
            console.log('🎯 Coins dépensés:', coinsSpent)
            
            // Calculer l'XP gagné (1 coin = 2.857 XP, car 10€ = 17.5 coins = 50 XP)
            const COINS_TO_XP = 50 / 17.5 // 2.857
            const xpGained = Math.floor(coinsSpent * COINS_TO_XP)
            
            if (xpGained > 0) {
              console.log('⭐ XP gagné:', xpGained)
              
              // Calculer le nouveau total XP et niveau
              const oldTotalXP = payload.old?.total_exp || 0
              const newTotalXP = oldTotalXP + xpGained
              const newLevel = calculateLevel(newTotalXP)
              
              console.log('📈 Niveau:', payload.old?.level, '→', newLevel)
              
              // Mettre à jour en base de données
              try {
                const { error } = await supabaseRef.current
                  .from('profiles')
                  .update({
                    total_exp: newTotalXP,
                    level: newLevel
                  })
                  .eq('id', user.id)
                
                if (error) {
                  console.error('❌ Erreur mise à jour XP:', error)
                } else {
                  console.log('✅ XP et niveau mis à jour en base!')
                }
              } catch (error) {
                console.error('❌ Erreur update XP:', error)
              }
            }
          }
          
          // Enrichir le profil avec les calculs XP et mettre à jour l'état
          const enrichedProfile = enrichProfileWithXP(payload.new)
          setProfile(enrichedProfile)
          profileCacheRef.current = { userId: user.id, profile: enrichedProfile }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user?.id])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.id, true)
  }, [user, loadProfile])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user || !profile) return

    const updatedData = updates.total_exp !== undefined 
      ? enrichProfileWithXP({ ...profile, ...updates })
      : { ...profile, ...updates }

    const previousProfile = profile
    setProfile(updatedData)
    profileCacheRef.current = { userId: user.id, profile: updatedData }

    try {
      const { level, current_level_exp, exp_to_next, progress_percentage, ...dbUpdates } = updates
      
      const { error } = await supabaseRef.current
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)

      if (error) {
        setProfile(previousProfile)
        profileCacheRef.current = { userId: user.id, profile: previousProfile }
        throw error
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error)
      throw error
    }
  }, [user, profile])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabaseRef.current.auth.signOut()

      if (error) {
        console.error('Erreur déconnexion:', error)
      }

      setUser(null)
      setSession(null)
      setProfile(null)
      profileCacheRef.current = null

      // Réinitialiser l'instance Supabase singleton
      resetSupabaseInstance()

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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

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