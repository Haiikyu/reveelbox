// app/hooks/useBattleSubscription.ts - Subscriptions temps réel pour les battles
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js'

interface BattleSubscriptionOptions {
  battleId: string
  onBattleUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onParticipantUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onBattleStart?: (battle: any) => void
  onRoundChange?: (currentBox: number, battle: any) => void
  onBattleFinish?: (battle: any) => void
  onPlayerJoin?: (participant: any) => void
  onPlayerLeave?: (participantId: string) => void
  onError?: (error: Error) => void
}

interface BattleSubscriptionReturn {
  isConnected: boolean
  connectionError: string | null
  reconnect: () => void
}

// Hook pour une battle spécifique
export function useBattleSubscription({
  battleId,
  onBattleUpdate,
  onParticipantUpdate,
  onBattleStart,
  onRoundChange,
  onBattleFinish,
  onPlayerJoin,
  onPlayerLeave,
  onError
}: BattleSubscriptionOptions): BattleSubscriptionReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const lastCurrentBoxRef = useRef<number>(-1)

  // Stocker les callbacks dans des refs
  const callbacksRef = useRef({
    onBattleUpdate,
    onParticipantUpdate,
    onBattleStart,
    onRoundChange,
    onBattleFinish,
    onPlayerJoin,
    onPlayerLeave,
    onError
  })

  useEffect(() => {
    callbacksRef.current = {
      onBattleUpdate,
      onParticipantUpdate,
      onBattleStart,
      onRoundChange,
      onBattleFinish,
      onPlayerJoin,
      onPlayerLeave,
      onError
    }
  })

  const reconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    setIsConnected(false)
    setConnectionError(null)
  }, [])

  useEffect(() => {
    if (!battleId) return

    const supabase = supabaseRef.current
    const channelName = `battle-${battleId}-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battles', filter: `id=eq.${battleId}` },
        (payload) => {
          console.log('🎮 Battle update:', payload)
          if (payload.eventType === 'UPDATE') {
            const newBattle = payload.new
            const oldBattle = payload.old

            // Detect battle start (waiting -> countdown or active)
            if (newBattle.status === 'countdown' && oldBattle?.status === 'waiting') {
              console.log('🚀 Battle starting (countdown)')
              callbacksRef.current.onBattleStart?.(newBattle)
            }
            if (newBattle.status === 'active' && oldBattle?.status === 'countdown') {
              console.log('🎯 Battle now active')
              callbacksRef.current.onBattleStart?.(newBattle)
            }

            // Detect round change (current_box changed)
            if (newBattle.current_box !== undefined &&
                newBattle.current_box !== lastCurrentBoxRef.current &&
                newBattle.current_box > 0) {
              console.log(`📦 Round changed: ${lastCurrentBoxRef.current} -> ${newBattle.current_box}`)
              lastCurrentBoxRef.current = newBattle.current_box
              callbacksRef.current.onRoundChange?.(newBattle.current_box, newBattle)
            }

            // Detect battle finish
            if (newBattle.status === 'finished' && oldBattle?.status !== 'finished') {
              console.log('🏆 Battle finished')
              callbacksRef.current.onBattleFinish?.(newBattle)
            }

            callbacksRef.current.onBattleUpdate?.(payload)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_participants', filter: `battle_id=eq.${battleId}` },
        (payload) => {
          console.log('👥 Participant update:', payload)
          if (payload.eventType === 'INSERT') {
            callbacksRef.current.onPlayerJoin?.(payload.new)
          } else if (payload.eventType === 'DELETE') {
            callbacksRef.current.onPlayerLeave?.(payload.old?.id)
          }
          callbacksRef.current.onParticipantUpdate?.(payload)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_openings', filter: `battle_id=eq.${battleId}` },
        (payload) => {
          console.log('📦 Battle opening:', payload)
          callbacksRef.current.onBattleUpdate?.(payload)
        }
      )
      .subscribe((status, err) => {
        console.log(`🔌 Battle ${battleId} subscription:`, status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          setConnectionError(err?.message || 'Erreur de connexion')
          callbacksRef.current.onError?.(new Error(err?.message || 'Erreur de connexion'))
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    return () => {
      console.log(`🔌 Unsubscribing from battle ${battleId}`)
      channel.unsubscribe()
    }
  }, [battleId])

  return { isConnected, connectionError, reconnect }
}

// Hook simplifié pour la liste des battles (page principale)
export function useBattleListSubscription(
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void,
  onBattleFinished?: (battleId: string) => void
): BattleSubscriptionReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  const finishedBattlesRef = useRef<Set<string>>(new Set())

  // Stocker les callbacks dans des refs pour éviter les re-renders
  const onUpdateRef = useRef(onUpdate)
  const onBattleFinishedRef = useRef(onBattleFinished)

  useEffect(() => {
    onUpdateRef.current = onUpdate
    onBattleFinishedRef.current = onBattleFinished
  })

  const reconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    setIsConnected(false)
    setConnectionError(null)
    finishedBattlesRef.current.clear()
  }, [])

  useEffect(() => {
    const supabase = supabaseRef.current
    const channelName = `battles-list-${Date.now()}`

    console.log('🎯 Création de la subscription battles-list')

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battles' },
        (payload) => {
          console.log('📢 Battle list update:', payload.eventType, payload)

          // Gestion des battles terminées
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'finished') {
            if (!finishedBattlesRef.current.has(payload.new.id)) {
              finishedBattlesRef.current.add(payload.new.id)
              onBattleFinishedRef.current?.(payload.new.id)
            }
          }

          onUpdateRef.current?.(payload)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_participants' },
        (payload) => {
          console.log('👥 Participants list update:', payload.eventType, payload)
          onUpdateRef.current?.(payload)
        }
      )
      .subscribe((status, err) => {
        console.log('🔌 Battles list subscription:', status, err)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
          console.log('✅ Connecté au temps réel des battles')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          setConnectionError(err?.message || 'Erreur de connexion')
          if (err) console.error('❌ Erreur connexion temps réel:', err)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('🔌 Déconnexion du temps réel battles-list')
      channel.unsubscribe()
    }
  }, [])

  return { isConnected, connectionError, reconnect }
}

export default useBattleSubscription
