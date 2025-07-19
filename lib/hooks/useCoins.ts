// lib/hooks/useCoins.ts
import { useAuth } from '@/app/components/AuthProvider'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase'

export default function useCoins() {
  const { user } = useAuth()

  /** SWR : re-fetch automatique dès qu’on appelle mutate */
  const { data, error, mutate } = useSWR(
    user ? ['coins', user.id] : null,
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('virtual_currency')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return data.virtual_currency as number
    },
    { revalidateOnFocus: false }
  )

  return {
    coins: data ?? 0,
    isLoading: !error && data === undefined,
    refreshCoins: () => mutate(),     // tu appelleras ça après un achat
  }
}
