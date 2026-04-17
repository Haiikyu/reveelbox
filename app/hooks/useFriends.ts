'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import type { FriendWithProfile } from '@/app/types/profile'

interface UseFriendsReturn {
  friends: FriendWithProfile[]
  pendingReceived: FriendWithProfile[]
  pendingSent: FriendWithProfile[]
  blocked: FriendWithProfile[]
  loading: boolean
  sendRequest: (targetUserId: string) => Promise<boolean>
  acceptRequest: (friendshipId: string) => Promise<boolean>
  rejectRequest: (friendshipId: string) => Promise<boolean>
  blockUser: (friendshipId: string) => Promise<boolean>
  removeFriend: (friendshipId: string) => Promise<boolean>
  getFriendshipStatus: (targetUserId: string) => 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'
  // Actions par userId (cherche la relation en DB — fiables même si les arrays ne sont pas chargés)
  cancelRequestByUserId: (targetUserId: string) => Promise<boolean>
  acceptByUserId: (targetUserId: string) => Promise<boolean>
  declineByUserId: (targetUserId: string) => Promise<boolean>
  unblockByUserId: (targetUserId: string) => Promise<boolean>
  refetch: () => void
}

export function useFriends(): UseFriendsReturn {
  const { user } = useAuth()
  const supabase = createClient()
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [pendingReceived, setPendingReceived] = useState<FriendWithProfile[]>([])
  const [pendingSent, setPendingSent] = useState<FriendWithProfile[]>([])
  const [blocked, setBlocked] = useState<FriendWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFriends = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      // Fetch all friendships involving the current user
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (!friendships?.length) {
        setFriends([])
        setPendingReceived([])
        setPendingSent([])
        setBlocked([])
        setLoading(false)
        return
      }

      // Get all unique user IDs (the "other" user in each friendship)
      const otherUserIds = friendships.map(f =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      // Fetch profiles for all friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level, total_exp, last_activity')
        .in('id', otherUserIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Map friendships to FriendWithProfile
      const mapped: FriendWithProfile[] = friendships.map(f => {
        const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
        const profile = profileMap.get(otherId)
        return {
          id: f.id,
          requester_id: f.requester_id,
          addressee_id: f.addressee_id,
          status: f.status,
          created_at: f.created_at,
          updated_at: f.updated_at,
          profile: profile || { id: otherId, username: null, avatar_url: null, level: 1, total_exp: 0, last_activity: null },
        }
      })

      setFriends(mapped.filter(f => f.status === 'accepted'))
      setPendingReceived(mapped.filter(f => f.status === 'pending' && f.addressee_id === user.id))
      setPendingSent(mapped.filter(f => f.status === 'pending' && f.requester_id === user.id))
      setBlocked(mapped.filter(f => f.status === 'blocked'))
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchFriends() }, [fetchFriends])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`friendships_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
        filter: `requester_id=eq.${user.id}`,
      }, () => fetchFriends())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
        filter: `addressee_id=eq.${user.id}`,
      }, () => fetchFriends())
      .subscribe()

    return () => { channel.unsubscribe(); supabase.removeChannel(channel) }
  }, [user, fetchFriends])

  const sendRequest = useCallback(async (targetUserId: string) => {
    if (!user) return false
    // Check if a friendship already exists (pending, accepted, or blocked)
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle()
    if (existing) return false
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: targetUserId,
      status: 'pending',
    })
    if (error) { console.error('Error sending friend request:', error); return false }
    await fetchFriends()
    return true
  }, [user, fetchFriends])

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    if (error) { console.error('Error accepting request:', error); return false }
    await fetchFriends()
    return true
  }, [fetchFriends])

  const rejectRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
    if (error) { console.error('Error rejecting request:', error); return false }
    await fetchFriends()
    return true
  }, [fetchFriends])

  const blockUser = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'blocked', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    if (error) { console.error('Error blocking user:', error); return false }
    await fetchFriends()
    return true
  }, [fetchFriends])

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
    if (error) { console.error('Error removing friend:', error); return false }
    await fetchFriends()
    return true
  }, [fetchFriends])

  // ─── Helpers qui cherchent la relation en DB — indépendants du chargement des arrays ───
  const lookupFriendshipId = useCallback(async (targetUserId: string): Promise<string | null> => {
    if (!user) return null
    const { data, error } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle()
    if (error) console.error('lookupFriendshipId error:', error)
    return data?.id ?? null
  }, [user])

  const cancelRequestByUserId = useCallback(async (targetUserId: string) => {
    const id = await lookupFriendshipId(targetUserId)
    if (!id) { console.error('cancelRequest: friendship not found for', targetUserId); return false }
    return rejectRequest(id)
  }, [lookupFriendshipId, rejectRequest])

  const acceptByUserId = useCallback(async (targetUserId: string) => {
    const id = await lookupFriendshipId(targetUserId)
    if (!id) { console.error('acceptByUserId: friendship not found for', targetUserId); return false }
    return acceptRequest(id)
  }, [lookupFriendshipId, acceptRequest])

  const declineByUserId = useCallback(async (targetUserId: string) => {
    const id = await lookupFriendshipId(targetUserId)
    if (!id) { console.error('declineByUserId: friendship not found for', targetUserId); return false }
    return rejectRequest(id)
  }, [lookupFriendshipId, rejectRequest])

  const unblockByUserId = useCallback(async (targetUserId: string) => {
    const id = await lookupFriendshipId(targetUserId)
    if (!id) { console.error('unblockByUserId: friendship not found for', targetUserId); return false }
    return removeFriend(id)
  }, [lookupFriendshipId, removeFriend])
  // ─────────────────────────────────────────────────────────────────────────────────────────

  const getFriendshipStatus = useCallback((targetUserId: string) => {
    if (friends.some(f => f.profile.id === targetUserId)) return 'accepted' as const
    if (pendingSent.some(f => f.profile.id === targetUserId)) return 'pending_sent' as const
    if (pendingReceived.some(f => f.profile.id === targetUserId)) return 'pending_received' as const
    if (blocked.some(f => f.profile.id === targetUserId)) return 'blocked' as const
    return 'none' as const
  }, [friends, pendingSent, pendingReceived, blocked])

  return {
    friends,
    pendingReceived,
    pendingSent,
    blocked,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    blockUser,
    removeFriend,
    getFriendshipStatus,
    cancelRequestByUserId,
    acceptByUserId,
    declineByUserId,
    unblockByUserId,
    refetch: fetchFriends,
  }
}
