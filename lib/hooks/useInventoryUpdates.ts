// hooks/useInventoryUpdates.ts - Hook pour gérer les mises à jour d'inventaire en temps réel

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface InventoryUpdate {
  type: 'inventory' | 'profile' | 'transaction'
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: any
}

export function useInventoryUpdates(userId: string | null) {
  const [triggerUpdate, setTriggerUpdate] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<InventoryUpdate | null>(null)
  const supabase = createClient()

  const handleUpdate = useCallback((update: InventoryUpdate) => {
    console.log('🔄 Real-time update received:', update)
    setLastUpdate(update)
    setTriggerUpdate(prev => prev + 1)
  }, [])

  useEffect(() => {
    if (!userId) return

    console.log('📡 Setting up real-time subscriptions for user:', userId)

    // Canal pour les changements d'inventaire
    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_inventory',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          handleUpdate({
            type: 'inventory',
            action: payload.eventType as any,
            payload: payload.new || payload.old
          })
        }
      )
      .subscribe()

    // Canal pour les changements de profil (coins, XP, etc.)
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          handleUpdate({
            type: 'profile',
            action: 'UPDATE',
            payload: payload.new
          })
        }
      )
      .subscribe()

    // Canal pour les nouvelles transactions
    const transactionChannel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          handleUpdate({
            type: 'transaction',
            action: 'INSERT',
            payload: payload.new
          })
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions')
      supabase.removeChannel(inventoryChannel)
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(transactionChannel)
    }
  }, [userId, supabase, handleUpdate])

  return { 
    triggerUpdate, 
    lastUpdate,
    isConnected: !!userId 
  }
}

// Hook pour les notifications en temps réel
export function useRealTimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'info' | 'warning'
    title: string
    message: string
    timestamp: Date
  }>>([])

  const { lastUpdate } = useInventoryUpdates(userId)

  useEffect(() => {
    if (!lastUpdate) return

    let notification = null

    switch (lastUpdate.type) {
      case 'inventory':
        if (lastUpdate.action === 'INSERT') {
          notification = {
            id: Date.now().toString(),
            type: 'success' as const,
            title: '🎁 Nouvel objet !',
            message: 'Un nouvel objet a été ajouté à votre inventaire',
            timestamp: new Date()
          }
        }
        break

      case 'profile':
        const payload = lastUpdate.payload
        if (payload.virtual_currency !== undefined) {
          notification = {
            id: Date.now().toString(),
            type: 'info' as const,
            title: '💰 Coins mis à jour',
            message: `Nouveau solde : ${payload.virtual_currency} coins`,
            timestamp: new Date()
          }
        }
        break

      case 'transaction':
        const transactionPayload = lastUpdate.payload
        if (transactionPayload.type === 'open_box') {
          notification = {
            id: Date.now().toString(),
            type: 'success' as const,
            title: '🎰 Boîte ouverte !',
            message: `Vous avez dépensé ${transactionPayload.virtual_amount} coins`,
            timestamp: new Date()
          }
        }
        break
    }

    if (notification) {
      setNotifications(prev => [notification!, ...prev.slice(0, 4)]) // Garder max 5 notifications
      
      // Auto-supprimer après 5 secondes
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification!.id))
      }, 5000)
    }
  }, [lastUpdate])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return {
    notifications,
    removeNotification
  }
}


