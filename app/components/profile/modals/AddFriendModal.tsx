'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, User, Loader2, Check, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import Modal from '@/app/components/ui/Modal'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onSendRequest: (userId: string) => Promise<boolean>
}

interface SearchResult {
  id: string
  username: string
  avatar_url: string | null
  level: number
  friendshipStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'
}

export default function AddFriendModal({ isOpen, onClose, onSendRequest }: AddFriendModalProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setSentTo(new Set())
    }
  }, [isOpen])

  const handleSearch = async () => {
    if (!query.trim() || query.length < 2 || !user) return
    setLoading(true)
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, level')
        .ilike('username', `%${query}%`)
        .neq('id', user.id)
        .limit(10)

      if (!profiles?.length) {
        setResults([])
        setLoading(false)
        return
      }

      // Check existing friendships for all results
      const userIds = profiles.map(p => p.id)
      const { data: friendships } = await supabase
        .from('friendships')
        .select('id, requester_id, addressee_id, status')
        .or(
          userIds.map(uid =>
            `and(requester_id.eq.${user.id},addressee_id.eq.${uid}),and(requester_id.eq.${uid},addressee_id.eq.${user.id})`
          ).join(',')
        )

      const friendshipMap = new Map<string, string>()
      friendships?.forEach(f => {
        const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
        if (f.status === 'accepted') friendshipMap.set(otherId, 'accepted')
        else if (f.status === 'blocked') friendshipMap.set(otherId, 'blocked')
        else if (f.status === 'pending' && f.requester_id === user.id) friendshipMap.set(otherId, 'pending_sent')
        else if (f.status === 'pending' && f.addressee_id === user.id) friendshipMap.set(otherId, 'pending_received')
      })

      setResults(profiles.map(p => ({
        ...p,
        friendshipStatus: (friendshipMap.get(p.id) as SearchResult['friendshipStatus']) || 'none',
      })))
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (userId: string) => {
    const ok = await onSendRequest(userId)
    if (ok) setSentTo(prev => new Set(prev).add(userId))
  }

  const getActionButton = (r: SearchResult) => {
    if (sentTo.has(r.id) || r.friendshipStatus === 'pending_sent') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5 rounded-lg bg-white/[0.04]">
          <Clock className="w-3.5 h-3.5" />
          En attente
        </span>
      )
    }
    if (r.friendshipStatus === 'accepted') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10">
          <Check className="w-3.5 h-3.5" />
          Amis
        </span>
      )
    }
    if (r.friendshipStatus === 'blocked') return null
    return (
      <button
        onClick={() => handleSend(r.id)}
        className="p-2 rounded-lg bg-[#4578be]/20 text-[#4578be] hover:bg-[#4578be]/30 transition"
      >
        <UserPlus className="w-4 h-4" />
      </button>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un ami" size="sm">
      <div className="space-y-4">
        {/* Search input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher par pseudo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#4578be]/50"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || query.length < 2}
            className="px-4 py-2.5 rounded-xl bg-[#4578be] hover:bg-[#5989d8] text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chercher'}
          </button>
        </div>

        {/* Results — no visible scrollbar */}
        <div className="space-y-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
          {results.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center flex-shrink-0">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{r.username}</p>
                <p className="text-[10px] text-white/30">Niveau {r.level}</p>
              </div>
              {getActionButton(r)}
            </div>
          ))}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-center text-white/30 py-6 text-sm">Aucun résultat</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
