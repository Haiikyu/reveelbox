'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { AuthContextType } from '@/app/types/auth'

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useUser()
  const [profile, setProfile] = useState<any>(null)

  const refreshProfile = async () => {
    if (!user) return
    const newProfile = await getProfile(user.id)
    setProfile(newProfile)
  }

  useEffect(() => {
    if (user) {
      refreshProfile()
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
