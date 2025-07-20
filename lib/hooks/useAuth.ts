// Hook useAuth.ts - À créer dans /hooks/useAuth.ts
'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: any
  profile: any
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshProfile = async () => {
    if (!user) return
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileData) {
      setProfile(profileData)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  useEffect(() => {
    // Récupérer l'utilisateur initial
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await refreshProfile()
      }
      
      setLoading(false)
    }

    getInitialUser()

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await refreshProfile()
          
          // Gérer la redirection après login
          if (event === 'SIGNED_IN') {
            const redirectPath = localStorage.getItem('redirectAfterLogin')
            if (redirectPath && redirectPath !== '/login' && redirectPath !== '/signup') {
              localStorage.removeItem('redirectAfterLogin')
              router.push(redirectPath)
            } else {
              // Redirection par défaut seulement si pas de redirection sauvegardée
              router.push('/boxes')
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Composant pour les pages Login/Signup - À utiliser dans tes pages login et signup
export function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Si l'utilisateur est déjà connecté, rediriger vers la page demandée
      const redirectPath = localStorage.getItem('redirectAfterLogin')
      if (redirectPath && redirectPath !== '/login' && redirectPath !== '/signup') {
        localStorage.removeItem('redirectAfterLogin')
        router.push(redirectPath)
      } else {
        router.push('/boxes')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // L'utilisateur sera redirigé
  }

  return <>{children}</>
}

// Fonction utilitaire pour sauvegarder la redirection
export const saveRedirectPath = (path: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('redirectAfterLogin', path)
  }
}

// Fonction utilitaire pour effacer la redirection
export const clearRedirectPath = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('redirectAfterLogin')
  }
}