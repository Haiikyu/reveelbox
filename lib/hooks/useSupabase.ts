'use client'

import { createClient } from '@/utils/supabase/client'

export function useSupabase() {
  const supabase = createClient()
  return { supabase }
}
