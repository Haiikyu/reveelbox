// ==============================================
// HOOKS UTILITAIRES POUR SUPABASE & AUTH
// ==============================================
// Créer ces fichiers dans /lib/hooks/

// /lib/hooks/useSupabase.ts
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useMemo } from 'react'

export function useSupabase() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  return supabase
}

// /lib/hooks/useCoins.ts
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useSupabase } from './useSupabase'

export function useCoins() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const supabase = useSupabase()

  const addCoins = async (amount: number) => {
    if (!user) throw new Error('Utilisateur non connecté')
    
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('add_virtual_currency', {
        user_id: user.id,
        amount: amount
      })

      if (error) throw error

      await refreshProfile()
      return data
    } catch (error) {
      console.error('Erreur ajout coins:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const spendCoins = async (amount: number) => {
    if (!user) throw new Error('Utilisateur non connecté')
    if (!profile || profile.virtual_currency < amount) {
      throw new Error('Coins insuffisants')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('spend_virtual_currency', {
        user_id: user.id,
        amount: amount
      })

      if (error) throw error

      await refreshProfile()
      return data
    } catch (error) {
      console.error('Erreur dépense coins:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    coins: profile?.virtual_currency || 0,
    loading,
    addCoins,
    spendCoins,
    refreshCoins: refreshProfile
  }
}

// /lib/hooks/useProfile.ts
'use client'

import { useState } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { useSupabase } from './useSupabase'

export function useProfile() {
  const { user, profile, updateProfile: authUpdateProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const supabase = useSupabase()

  const updateProfile = async (updates: any) => {
    if (!user) throw new Error('Utilisateur non connecté')
    
    setLoading(true)
    try {
      await authUpdateProfile(updates)
    } catch (error) {
      console.error('Erreur update profil:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Utilisateur non connecté')
    
    setLoading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await updateProfile({ avatar_url: publicUrl })
      
      return publicUrl
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    refreshProfile
  }
}

// ==============================================
// FONCTIONS UTILITAIRES POUR LES PAGES
// ==============================================
// Créer dans /lib/utils/

// /lib/utils/database.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabaseClient = createClientComponentClient()

// Fonction pour récupérer les loot boxes
export async function getLootBoxes() {
  const { data, error } = await supabaseClient
    .from('loot_boxes')
    .select(`
      *,
      loot_box_items (
        probability,
        items (*)
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur getLootBoxes:', error)
    return []
  }

  return data || []
}

// Fonction pour récupérer une loot box spécifique
export async function getLootBox(id: string) {
  const { data, error } = await supabaseClient
    .from('loot_boxes')
    .select(`
      *,
      loot_box_items (
        probability,
        items (*)
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Erreur getLootBox:', error)
    return null
  }

  return data
}

// Fonction pour récupérer l'inventaire utilisateur
export async function getUserInventory(userId: string) {
  const { data, error } = await supabaseClient
    .from('user_inventory')
    .select(`
      *,
      items (*)
    `)
    .eq('user_id', userId)
    .eq('is_sold', false)
    .order('obtained_at', { ascending: false })

  if (error) {
    console.error('Erreur getUserInventory:', error)
    return []
  }

  return data || []
}

// ==============================================
// UTILITAIRES POUR LES TESTS
// ==============================================
// /lib/utils/auth-test.ts

export const testAuthFlow = {
  // Test de connexion
  async testLogin(email: string, password: string) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      console.log('✅ Test login réussi:', data.user?.email)
      return data
    } catch (error) {
      console.error('❌ Test login échoué:', error)
      throw error
    }
  },

  // Test de récupération de profil
  async testProfileFetch(userId: string) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      console.log('✅ Test profil réussi:', data.username || 'sans username')
      return data
    } catch (error) {
      console.error('❌ Test profil échoué:', error)
      throw error
    }
  },

  // Test de mise à jour de coins
  async testCoinsUpdate(userId: string, amount: number) {
    try {
      const { data, error } = await supabaseClient.rpc('add_virtual_currency', {
        user_id: userId,
        amount: amount
      })
      
      if (error) throw error
      
      console.log('✅ Test coins réussi:', data)
      return data
    } catch (error) {
      console.error('❌ Test coins échoué:', error)
      throw error
    }
  }
}

// ==============================================
// PAGE DE TEST (OPTIONNELLE)
// ==============================================
// Créer /app/test-auth/page.tsx pour tester le système

/*
'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { useCoins } from '@/lib/hooks/useCoins'
import { useProfile } from '@/lib/hooks/useProfile'
import { testAuthFlow } from '@/lib/utils/auth-test'

export default function TestAuthPage() {
  const { user, profile, loading, isAuthenticated } = useAuth()
  const { coins, addCoins, spendCoins } = useCoins()
  const { updateProfile } = useProfile()

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Test Système Auth</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">État Authentication</h2>
          <div className="space-y-2">
            <p><strong>Connecté:</strong> {isAuthenticated ? '✅' : '❌'}</p>
            <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Username:</strong> {profile?.username || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Coins & Profile</h2>
          <div className="space-y-2">
            <p><strong>Coins:</strong> {coins}</p>
            <p><strong>Niveau:</strong> {Math.floor((profile?.total_exp || 0) / 100) + 1}</p>
            <p><strong>XP:</strong> {profile?.total_exp || 0}</p>
          </div>
          
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => addCoins(100)}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              +100 Coins
            </button>
            <button 
              onClick={() => updateProfile({ username: 'TestUser' + Date.now() })}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Changer Username
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-2">🔍 Tests Manuels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => testAuthFlow.testProfileFetch(user?.id)}
            className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600"
          >
            Test Profil
          </button>
          <button 
            onClick={() => testAuthFlow.testCoinsUpdate(user?.id, 50)}
            className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600"
          >
            Test Coins
          </button>
          <button 
            onClick={() => console.log('Auth State:', { user, profile, isAuthenticated })}
            className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600"
          >
            Log State
          </button>
        </div>
      </div>
    </div>
  )
}
*/