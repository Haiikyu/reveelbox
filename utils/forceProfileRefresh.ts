// utils/forceProfileRefresh.ts - Utilitaire pour forcer le refresh du profil
import { createClient } from '@/utils/supabase/client'

export async function forceProfileRefresh(userId: string) {
  const supabase = createClient()
  
  try {
    // 1. Déclencher une mise à jour de updated_at pour invalider le cache
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId)
    
    // 2. Récupérer le profil mis à jour
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Erreur refresh profil:', error)
      return null
    }
    
    console.log('Profil rafraîchi:', profile)
    return profile
    
  } catch (error) {
    console.error('Erreur force refresh:', error)
    return null
  }
}

// Ajouter cette fonction temporaire dans votre AuthProvider ou sur une page pour diagnostiquer
export async function debugUserProfile(userId: string) {
  const supabase = createClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('=== DEBUG PROFIL UTILISATEUR ===')
    console.log('User ID:', userId)
    console.log('Profil complet:', profile)
    console.log('Niveau actuel:', profile?.level)
    console.log('Total XP:', profile?.total_exp)
    console.log('Virtual Currency:', profile?.virtual_currency)
    console.log('Updated At:', profile?.updated_at)
    
    if (error) {
      console.error('Erreur lors de la récupération:', error)
    }
    
    return profile
    
  } catch (error) {
    console.error('Erreur debug profil:', error)
    return null
  }
}