'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface MutualFriend {
  id: string
  username: string | null
  avatar_url: string | null
}

export function useMutualFriends(myUserId: string | undefined, targetUserId: string | undefined) {
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!myUserId || !targetUserId || myUserId === targetUserId) return

    const supabase = createClient()
    setLoading(true)

    async function fetch() {
      const [{ data: myFs }, { data: targetFs }] = await Promise.all([
        supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${myUserId},addressee_id.eq.${myUserId}`),
        supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`),
      ])

      if (!myFs?.length || !targetFs?.length) {
        setMutualFriends([])
        setLoading(false)
        return
      }

      const myFriendIds = new Set(
        myFs.map(f => (f.requester_id === myUserId ? f.addressee_id : f.requester_id))
      )
      const targetFriendIds = new Set(
        targetFs.map(f => (f.requester_id === targetUserId ? f.addressee_id : f.requester_id))
      )

      const mutualIds = [...myFriendIds].filter(id => targetFriendIds.has(id))
      if (!mutualIds.length) {
        setMutualFriends([])
        setLoading(false)
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', mutualIds)

      setMutualFriends(profiles || [])
      setLoading(false)
    }

    fetch().catch(() => setLoading(false))
  }, [myUserId, targetUserId])

  return { mutualFriends, loading }
}
