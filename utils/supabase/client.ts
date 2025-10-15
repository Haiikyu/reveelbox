import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Instance singleton du client Supabase pour éviter les instances multiples
let supabaseInstance: SupabaseClient<any> | null = null

export function createClient(): SupabaseClient<any> {
  // Si une instance existe déjà, la retourner directement
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Créer une nouvelle instance seulement si elle n'existe pas
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<any>

  // Log pour debug (à retirer en production)
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Supabase client instance créée (singleton)')
  }

  return supabaseInstance
}

// Fonction pour réinitialiser l'instance (utile pour la déconnexion)
export function resetSupabaseInstance() {
  supabaseInstance = null
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Supabase instance réinitialisée')
  }
}