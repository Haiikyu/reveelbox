// app/hooks/useRealtimeBalance.ts - Balance et inventaire en temps réel via Supabase Realtime
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseRealtimeBalanceOptions {
  userId: string | null
  onBalanceChange?: (newBalance: number, change: number) => void
  onInventoryChange?: (action: 'add' | 'remove', item: any) => void
}

interface UseRealtimeBalanceReturn {
  balance: number | null
  inventoryCount: number
  isConnected: boolean
}

// Singleton pour le client Supabase
const supabase = createClient()

export function useRealtimeBalance({
  userId,
  onBalanceChange,
  onInventoryChange
}: UseRealtimeBalanceOptions): UseRealtimeBalanceReturn {
  const [balance, setBalance] = useState<number | null>(null)
  const [inventoryCount, setInventoryCount] = useState<number>(0)
  const [isConnected, setIsConnected] = useState(false)
  const previousBalanceRef = useRef<number | null>(null)

  // Stocker les callbacks dans des refs pour éviter les re-renders
  const onBalanceChangeRef = useRef(onBalanceChange)
  const onInventoryChangeRef = useRef(onInventoryChange)

  useEffect(() => {
    onBalanceChangeRef.current = onBalanceChange
    onInventoryChangeRef.current = onInventoryChange
  }, [onBalanceChange, onInventoryChange])

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    // Charger les données initiales en parallèle
    const loadInitialData = async () => {
      const [profileResult, inventoryResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('virtual_currency')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_inventory')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_sold', false)
      ])

      if (cancelled) return

      if (profileResult.data) {
        setBalance(profileResult.data.virtual_currency)
        previousBalanceRef.current = profileResult.data.virtual_currency
      }

      setInventoryCount(inventoryResult.count || 0)
    }

    loadInitialData()

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`user-balance-${userId}`)
      // Balance (profiles UPDATE)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newBalance = payload.new?.virtual_currency
          if (typeof newBalance === 'number') {
            const previousBalance = previousBalanceRef.current ?? 0
            const change = newBalance - previousBalance

            setBalance(newBalance)
            previousBalanceRef.current = newBalance

            if (change !== 0) {
              onBalanceChangeRef.current?.(newBalance, change)
            }
          }
        }
      )
      // Inventaire (tous les événements)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_inventory',
          filter: `user_id=eq.${userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const eventType = payload.eventType

          if (eventType === 'INSERT') {
            setInventoryCount(prev => prev + 1)
            onInventoryChangeRef.current?.('add', payload.new)
          } else if (eventType === 'DELETE') {
            setInventoryCount(prev => Math.max(0, prev - 1))
            onInventoryChangeRef.current?.('remove', payload.old)
          } else if (eventType === 'UPDATE') {
            if (payload.new?.is_sold === true && payload.old?.is_sold === false) {
              setInventoryCount(prev => Math.max(0, prev - 1))
              onInventoryChangeRef.current?.('remove', payload.new)
            }
          }
        }
      )
      .subscribe((status, err) => {
        setIsConnected(status === 'SUBSCRIBED')
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && err) {
          console.error('Realtime subscription error:', err)
        }
      })

    return () => {
      cancelled = true
      channel.unsubscribe()
    }
  }, [userId])

  return {
    balance,
    inventoryCount,
    isConnected
  }
}

export default useRealtimeBalance
