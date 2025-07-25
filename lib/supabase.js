// lib/supabase.js - TEMPORAIRE pour compatibilité
import { createClient } from '@/utils/supabase/client'

export const supabase = createClient()

// Re-export des fonctions pour compatibilité
export { createClient }
