// app/hooks/useRealtimeBalance.ts - Balance et inventaire en temps réel (OPTIMISÉ)
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  refreshBalance: () => Promise<void>
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
  const channelRef = useRef<any>(null)
  const previousBalanceRef = useRef<number | null>(null)
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)

  // Charger la balance et l'inventaire EN PARALLÈLE (optimisé)
  const refreshBalance = useCallback(async () => {
    if (!userId || isLoadingRef.current) return

    isLoadingRef.current = true

    try {
      // Exécuter les 2 requêtes EN PARALLÈLE au lieu de séquentiellement
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

      if (profileResult.data) {
        setBalance(profileResult.data.virtual_currency)
        previousBalanceRef.current = profileResult.data.virtual_currency
      }

      setInventoryCount(inventoryResult.count || 0)
    } catch (error) {
      // Ignore les erreurs silencieusement (AbortError, etc.)
      if (error instanceof Error && error.name !== 'AbortError') {
        console.warn('Error refreshing balance:', error.message)
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [userId])

  // Stocker les callbacks dans des refs pour éviter les re-renders
  const onBalanceChangeRef = useRef(onBalanceChange)
  const onInventoryChangeRef = useRef(onInventoryChange)

  useEffect(() => {
    onBalanceChangeRef.current = onBalanceChange
    onInventoryChangeRef.current = onInventoryChange
  }, [onBalanceChange, onInventoryChange])

  useEffect(() => {
    if (!userId) return

    // Charger les données initiales (une seule fois)
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      refreshBalance()
    }

    // S'abonner aux changements - CONSOLIDÉ en 2 handlers au lieu de 4
    const channel = supabase
      .channel(`user-data-${userId}`)
      // Handler 1: Balance (profiles UPDATE)
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
            const previousBalance = previousBalanceRef.current || 0
            const change = newBalance - previousBalance

            setBalance(newBalance)
            previousBalanceRef.current = newBalance

            if (change !== 0) {
              onBalanceChangeRef.current?.(newBalance, change)
            }
          }
        }
      )
      // Handler 2: Inventaire (tous les événements consolidés)
      .on(
        'postgres_changes',
        {
          event: '*', // Écoute INSERT, UPDATE, DELETE en UN SEUL handler
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
            // Si l'item est vendu, on décrémente
            if (payload.new?.is_sold === true && payload.old?.is_sold === false) {
              setInventoryCount(prev => Math.max(0, prev - 1))
              onInventoryChangeRef.current?.('remove', payload.new)
            }
          }
        }
      )
      .subscribe((status, err) => {
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Realtime subscription error:', err)
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [userId, refreshBalance])

  return {
    balance,
    inventoryCount,
    isConnected,
    refreshBalance
  }
}

export default useRealtimeBalance
