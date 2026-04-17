'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BattleInvitationNotification {
  id: string
  type: 'battle_invitation'
  battle_id: string
  invitation_id: string
  from_user_id: string
  from_username: string | null
  from_avatar: string | null
  message: string | null
  created_at: string
  read: boolean
  isNew?: boolean
}

export interface BattleFinishedNotification {
  id: string
  type: 'battle_finished'
  battle_id: string
  battle_name: string
  created_at: string
  read: boolean
  isNew?: boolean
}

export interface FriendRequestNotification {
  id: string
  type: 'friend_request'
  friendship_id: string
  from_user_id: string
  from_username: string | null
  from_avatar: string | null
  created_at: string
  read: boolean
  isNew?: boolean
}

export interface FriendAcceptedNotification {
  id: string
  type: 'friend_accepted'
  friendship_id: string
  from_user_id: string
  from_username: string | null
  from_avatar: string | null
  created_at: string
  read: boolean
  isNew?: boolean
}

export type AppNotification =
  | BattleInvitationNotification
  | BattleFinishedNotification
  | FriendRequestNotification
  | FriendAcceptedNotification

// ─── localStorage + CustomEvent helpers (battle watch) ───────────────────────
const LS_PREFIX = 'rb_watching_battle_'
const WATCH_EVENT = 'rb_battle_registered'

export function registerWatchedBattle(battleId: string, battleName: string) {
  try {
    localStorage.setItem(LS_PREFIX + battleId, JSON.stringify({ battleId, battleName }))
    window.dispatchEvent(new CustomEvent(WATCH_EVENT, { detail: { battleId, battleName } }))
  } catch {}
}

export function unregisterWatchedBattle(battleId: string) {
  try {
    localStorage.removeItem(LS_PREFIX + battleId)
  } catch {}
}

function getWatchedBattles(): Array<{ battleId: string; battleName: string }> {
  try {
    const entries: Array<{ battleId: string; battleName: string }> = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(LS_PREFIX)) {
        const val = localStorage.getItem(key)
        if (val) entries.push(JSON.parse(val))
      }
    }
    return entries
  } catch {
    return []
  }
}
// ─────────────────────────────────────────────────────────────────────────────

/** Convertit une ligne DB → AppNotification */
function rowToNotification(row: any): AppNotification | null {
  const p = row.payload ?? {}
  switch (row.type) {
    case 'friend_request':
      return {
        id: row.id,
        type: 'friend_request',
        friendship_id: p.friendship_id,
        from_user_id: p.from_user_id,
        from_username: p.from_username ?? null,
        from_avatar: p.from_avatar ?? null,
        created_at: row.created_at,
        read: row.read,
      }
    case 'friend_accepted':
      return {
        id: row.id,
        type: 'friend_accepted',
        friendship_id: p.friendship_id,
        from_user_id: p.from_user_id,
        from_username: p.from_username ?? null,
        from_avatar: p.from_avatar ?? null,
        created_at: row.created_at,
        read: row.read,
      }
    case 'battle_invitation':
      return {
        id: row.id,
        type: 'battle_invitation',
        invitation_id: p.invitation_id,
        battle_id: p.battle_id,
        from_user_id: p.from_user_id,
        from_username: p.from_username ?? null,
        from_avatar: p.from_avatar ?? null,
        message: p.message ?? null,
        created_at: row.created_at,
        read: row.read,
      }
    case 'battle_finished':
      return {
        id: row.id,
        type: 'battle_finished',
        battle_id: p.battle_id,
        battle_name: p.battle_name,
        created_at: row.created_at,
        read: row.read,
      }
    default:
      return null
  }
}

interface UseNotificationsReturn {
  notifications: AppNotification[]
  unreadCount: number
  newToasts: AppNotification[]
  dismissToast: (id: string) => void
  markAllRead: () => void
  markRead: (id: string) => void
  clearAll: () => void
  acceptInvitation: (invitationId: string, battleId: string) => Promise<void>
  declineInvitation: (invitationId: string) => Promise<void>
  acceptFriendRequest: (notificationId: string, friendshipId: string) => Promise<void>
  declineFriendRequest: (notificationId: string, friendshipId: string) => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [newToasts, setNewToasts] = useState<AppNotification[]>([])
  const initialLoadDone = useRef(false)

  // ─── Fetch initial depuis la DB ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!data) return

    const mapped = data.map(rowToNotification).filter(Boolean) as AppNotification[]
    setNotifications(mapped)
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchNotifications().then(() => { initialLoadDone.current = true })
  }, [fetchNotifications, user])

  // ─── Realtime : nouvelles notifications ───────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (!initialLoadDone.current) return
        const notif = rowToNotification(payload.new)
        if (!notif) return
        const notifWithNew = { ...notif, isNew: true }
        setNotifications(prev => [notifWithNew, ...prev])
        setNewToasts(prev => [...prev, notifWithNew])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = rowToNotification(payload.new)
        if (!updated) return
        setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n))
      })
      .subscribe()

    return () => { channel.unsubscribe(); supabase.removeChannel(channel) }
  }, [user])

  // ─── Realtime : surveillance des battles quittées ────────────────────────
  const watchChannelsRef = useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map())

  const subscribeToWatchedBattle = useCallback((battleId: string, battleName: string) => {
    if (!user || watchChannelsRef.current.has(battleId)) return

    const ch = supabase
      .channel(`watch_battle_${battleId}_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`,
      }, async (payload) => {
        const updated = payload.new as any
        if (updated.status !== 'finished') return

        watchChannelsRef.current.get(battleId)?.unsubscribe()
        watchChannelsRef.current.delete(battleId)
        unregisterWatchedBattle(battleId)

        if (typeof window !== 'undefined' && window.location.pathname.includes(battleId)) return

        // Insérer la notif battle_finished en DB
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'battle_finished',
          payload: { battle_id: battleId, battle_name: battleName },
        })
      })
      .subscribe()

    watchChannelsRef.current.set(battleId, ch)
  }, [user])

  useEffect(() => {
    if (!user) return

    getWatchedBattles().forEach(({ battleId, battleName }) => {
      subscribeToWatchedBattle(battleId, battleName)
    })

    const handler = (e: Event) => {
      const { battleId, battleName } = (e as CustomEvent).detail
      subscribeToWatchedBattle(battleId, battleName)
    }
    window.addEventListener(WATCH_EVENT, handler)

    return () => {
      window.removeEventListener(WATCH_EVENT, handler)
      watchChannelsRef.current.forEach(ch => { ch.unsubscribe() })
      watchChannelsRef.current.clear()
    }
  }, [user, subscribeToWatchedBattle])
  // ─────────────────────────────────────────────────────────────────────────

  const dismissToast = useCallback((id: string) => {
    setNewToasts(prev => prev.filter(n => n.id !== id))
  }, [])

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }, [user])

  const clearAll = useCallback(async () => {
    if (!user) return
    setNotifications([])
    await supabase.from('notifications').delete().eq('user_id', user.id)
  }, [user])

  const acceptInvitation = useCallback(async (notificationId: string, battleId: string) => {
    // Trouver l'invitation_id depuis la notif
    const notif = notifications.find(n => n.id === notificationId)
    const invitationId = notif?.type === 'battle_invitation' ? notif.invitation_id : notificationId

    const { error } = await supabase
      .from('battle_invitations')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', invitationId)
    if (error) console.error('acceptInvitation error:', error)

    await markRead(notificationId)
    setNewToasts(prev => prev.filter(n => n.id !== notificationId))
    router.push(`/battles/${battleId}`)
  }, [notifications, markRead, router])

  const declineInvitation = useCallback(async (notificationId: string) => {
    const notif = notifications.find(n => n.id === notificationId)
    const invitationId = notif?.type === 'battle_invitation' ? notif.invitation_id : notificationId

    const { error } = await supabase
      .from('battle_invitations')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', invitationId)
    if (error) console.error('declineInvitation error:', error)

    await markRead(notificationId)
    setNewToasts(prev => prev.filter(n => n.id !== notificationId))
  }, [notifications, markRead])

  const acceptFriendRequest = useCallback(async (notificationId: string, friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    if (error) console.error('acceptFriendRequest error:', error)

    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  }, [supabase])

  const declineFriendRequest = useCallback(async (notificationId: string, friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
    if (error) console.error('declineFriendRequest error:', error)

    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    await supabase.from('notifications').delete().eq('id', notificationId)
  }, [supabase])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    newToasts,
    dismissToast,
    markAllRead,
    markRead,
    clearAll,
    acceptInvitation,
    declineInvitation,
    acceptFriendRequest,
    declineFriendRequest,
  }
}
