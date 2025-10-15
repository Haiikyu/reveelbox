// app/hooks/useBattleSubscription.ts - VERSION CORRIGÉE COMPLÈTE
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface BattleSubscriptionOptions {
  battleId: string
  onBattleUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onParticipantUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onBattleStart?: (battle: any) => void
  onPlayerJoin?: (participant: any) => void
  onPlayerLeave?: (participantId: string) => void
  onError?: (error: Error) => void
}

interface BattleSubscriptionReturn {
  isConnected: boolean
  connectionError: string | null
  reconnect: () => void
  cleanup: () => void
}

export function useBattleSubscription({
  battleId,
  onBattleUpdate,
  onParticipantUpdate,
  onBattleStart,
  onPlayerJoin,
  onPlayerLeave,
  onError
}: BattleSubscriptionOptions): BattleSubscriptionReturn {
  
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const channelRef = useRef<any>(null)
  const supabase = createClient()

  // Callbacks stables avec useCallback mais sans dépendances externes
  const handleBattleUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('[BattleSubscription] Battle update:', payload)
    
    // Traitement spécifique selon le type d'événement
    if (payload.eventType === 'UPDATE') {
      // Battle mise à jour (status, current_box, etc.)
      if (payload.new.status === 'active' && payload.old.status === 'waiting') {
        onBattleStart?.(payload.new)
      }
      onBattleUpdate?.(payload)
    }
  }, [])

  const handleParticipantUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('[BattleSubscription] Participant update:', payload)
    
    if (payload.eventType === 'INSERT') {
      // Nouveau participant
      onPlayerJoin?.(payload.new)
      onParticipantUpdate?.(payload)
    } else if (payload.eventType === 'DELETE') {
      // Participant parti
      onPlayerLeave?.(payload.old.id)
      onParticipantUpdate?.(payload)
    } else if (payload.eventType === 'UPDATE') {
      // Participant mis à jour (ready status, etc.)
      onParticipantUpdate?.(payload)
    }
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error('[BattleSubscription] Error:', error)
    setConnectionError(error.message)
    onError?.(error)
  }, [])

  // Fonction de nettoyage
  const cleanup = useCallback(() => {
    console.log('[BattleSubscription] Cleaning up subscription')
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    setIsConnected(false)
    setConnectionError(null)
  }, [])

  // Fonction de reconnexion
  const reconnect = useCallback(() => {
    console.log('[BattleSubscription] Manual reconnection triggered')
    setConnectionError(null)
    setIsConnected(false)
    cleanup()
    // Le useEffect se déclenchera à nouveau avec battleId
  }, [cleanup])

  // Effet principal avec dépendances stables
  useEffect(() => {
    if (!battleId) return

    // Cleanup précédent s'il existe
    cleanup()

    console.log(`[BattleSubscription] Setting up subscription for battle: ${battleId}`)

    const battleChannel = supabase
      .channel(`battle-room-${battleId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: battleId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${battleId}`
        },
        handleBattleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battleId}`
        },
        handleParticipantUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_openings',
          filter: `battle_id=eq.${battleId}`
        },
        (payload) => {
          console.log('[BattleSubscription] Battle opening:', payload)
          // Peut être utilisé pour synchroniser les ouvertures de box
          onBattleUpdate?.(payload)
        }
      )
      .subscribe((status, err) => {
        console.log('[BattleSubscription] Status:', status, err)
        
        switch (status) {
          case 'SUBSCRIBED':
            setIsConnected(true)
            setConnectionError(null)
            console.log(`[BattleSubscription] Successfully subscribed to battle ${battleId}`)
            break
          case 'CLOSED':
            setIsConnected(false)
            console.log(`[BattleSubscription] Connection closed for battle ${battleId}`)
            break
          case 'CHANNEL_ERROR':
            setIsConnected(false)
            if (err) {
              const errorMessage = err.message || 'Channel connection error'
              console.error('[BattleSubscription] Channel Error:', errorMessage)
              setConnectionError(errorMessage)
              handleError(new Error(errorMessage))
            }
            break
          case 'TIMED_OUT':
            setIsConnected(false)
            setConnectionError('Connection timed out')
            console.warn('[BattleSubscription] Connection timed out')
            break
        }
      })

    channelRef.current = battleChannel

    // Cleanup au démontage
    return cleanup
  }, [battleId, handleBattleUpdate, handleParticipantUpdate, handleError, cleanup])

  return {
    isConnected,
    connectionError,
    reconnect,
    cleanup
  }
}

// Hook simplifié pour la liste des battles avec archivage automatique
export function useBattleListSubscription(
  onBattleUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void,
  onBattleFinished?: (battleId: string) => void
): BattleSubscriptionReturn {
  
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const channelRef = useRef<any>(null)
  const supabase = createClient()
  const finishedBattles = useRef<Set<string>>(new Set())

  // Callback stable pour les mises à jour
  const handleUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('[BattleListSubscription] Update:', payload)
    
    // Gestion de l'archivage automatique des battles finies
    if (payload.table === 'battles' && payload.eventType === 'UPDATE') {
      if (payload.new.status === 'finished' && !finishedBattles.current.has(payload.new.id)) {
        finishedBattles.current.add(payload.new.id)
        console.log(`[BattleListSubscription] Battle ${payload.new.id} finished, scheduling removal`)
        
        // Notifier la fin de battle
        onBattleFinished?.(payload.new.id)
        
        // Programmer la suppression de la liste après 30 secondes
        setTimeout(() => {
          console.log(`[BattleListSubscription] Removing finished battle ${payload.new.id} from list`)
          onBattleUpdate?.({
            ...payload,
            eventType: 'DELETE',
            old: payload.new,
            new: null
          } as any)
        }, 30000) // 30 secondes de délai
      }
    }
    
    onBattleUpdate?.(payload)
  }, [onBattleUpdate, onBattleFinished])

  const cleanup = useCallback(() => {
    console.log('[BattleListSubscription] Cleaning up battle list subscription')
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    setIsConnected(false)
    finishedBattles.current.clear()
  }, [])

  const reconnect = useCallback(() => {
    console.log('[BattleListSubscription] Manual reconnection triggered')
    setConnectionError(null)
    setIsConnected(false)
    cleanup()
  }, [cleanup])

  useEffect(() => {
    // Cleanup précédent
    cleanup()

    console.log('[BattleListSubscription] Setting up battle list subscription')

    const channel = supabase
      .channel('battle-list-global', {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battles'
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants'
        },
        handleUpdate
      )
      .subscribe((status, err) => {
        console.log('[BattleListSubscription] Status:', status, err)
        
        switch (status) {
          case 'SUBSCRIBED':
            setIsConnected(true)
            setConnectionError(null)
            break
          case 'CLOSED':
          case 'CHANNEL_ERROR':
            setIsConnected(false)
            if (err) {
              const errorMessage = err.message || 'Connection error'
              setConnectionError(errorMessage)
            }
            break
        }
      })

    channelRef.current = channel

    return cleanup
  }, [handleUpdate, cleanup])

  return {
    isConnected,
    connectionError,
    reconnect,
    cleanup
  }
}

// Hook spécifique pour les notifications de battle
export function useBattleNotifications(battleId?: string) {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: Date
  }>>([])

  const addNotification = useCallback((
    type: 'info' | 'success' | 'warning' | 'error',
    title: string,
    message: string
  ) => {
    const notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, notification].slice(-5)) // Garder seulement les 5 dernières
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }, [])

  // Subscription aux événements de battle pour notifications
  useBattleSubscription({
    battleId: battleId || '',
    onBattleUpdate: useCallback((payload: RealtimePostgresChangesPayload<any>) => {
      if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old.status) {
        switch (payload.new.status) {
          case 'countdown':
            addNotification('info', 'Battle Starting', 'Get ready! The battle is about to begin.')
            break
          case 'active':
            addNotification('success', 'Battle Started', 'The battle has begun! Good luck!')
            break
          case 'finished':
            addNotification('success', 'Battle Finished', 'The battle has ended. Check your rewards!')
            break
        }
      }
    }, [addNotification]),
    onPlayerJoin: useCallback((participant: any) => {
      const playerName = participant.is_bot ? participant.bot_name : 'A player'
      addNotification('info', 'Player Joined', `${playerName} joined the battle`)
    }, [addNotification]),
    onPlayerLeave: useCallback((participantId: string) => {
      addNotification('warning', 'Player Left', 'A player left the battle')
    }, [addNotification])
  })

  return {
    notifications,
    addNotification,
    clearNotifications: useCallback(() => setNotifications([]), [])
  }
}

export default useBattleSubscription