'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseReevs {
  balance: number | null
  loading: boolean
  /** Achète un item du shop avec des Reevs. Retourne { success, message, new_balance? } */
  buyWithReevs: (itemId: string, itemType: 'frame' | 'banner' | 'pin' | 'name_color' | 'background') => Promise<{ success: boolean; message: string; new_balance?: number }>
}

const supabase = createClient()

export function useReevs(userId: string | null | undefined): UseReevs {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Chargement initial
    supabase
      .from('profiles')
      .select('reevs_balance')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setBalance(data?.reevs_balance ?? 0)
        setLoading(false)
      })

    // Temps réel : écoute les UPDATE sur profiles
    const channel = supabase
      .channel(`reevs-balance-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload: RealtimePostgresChangesPayload<{ reevs_balance?: number }>) => {
          const newBalance = (payload.new as { reevs_balance?: number })?.reevs_balance
          if (typeof newBalance === 'number') setBalance(newBalance)
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [userId])

  const buyWithReevs = useCallback(async (
    itemId: string,
    itemType: 'frame' | 'banner' | 'pin' | 'name_color' | 'background'
  ) => {
    if (!userId) return { success: false, message: 'Non connecté' }

    const { data, error } = await supabase.rpc('buy_with_reevs', {
      p_user_id:   userId,
      p_item_id:   itemId,
      p_item_type: itemType,
    })

    if (error) return { success: false, message: error.message }

    const result = data as { success: boolean; message: string; new_balance?: number }
    if (result.success && typeof result.new_balance === 'number') {
      setBalance(result.new_balance)
    }
    return result
  }, [userId])

  return { balance, loading, buyWithReevs }
}
