'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, User, Search, Check, X, Ban, ShieldOff } from 'lucide-react'
import Link from 'next/link'
import type { FriendWithProfile } from '@/app/types/profile'

interface FriendsTabProps {
  friends: FriendWithProfile[]
  pendingReceived: FriendWithProfile[]
  pendingSent: FriendWithProfile[]
  blocked: FriendWithProfile[]
  loading: boolean
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onRemove: (id: string) => void
  onBlock: (id: string) => void
  onUnblock: (id: string) => void
  onOpenAddFriend: () => void
}

function FriendRow({ friend, actions }: {
  friend: FriendWithProfile
  actions?: React.ReactNode
}) {
  return (
    <div
      className="flex items-center gap-4 py-3 group"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
    >
      <Link href={`/profile/${encodeURIComponent(friend.profile.username || '')}`} className="flex-shrink-0">
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-[#4578be] to-[#5989d8]">
          {friend.profile.avatar_url ? (
            <img src={friend.profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${encodeURIComponent(friend.profile.username || '')}`}>
          <span className="text-sm text-white font-medium hover:text-[#4578be] transition-colors truncate block">
            {friend.profile.username || 'Utilisateur'}
          </span>
        </Link>
        <span className="text-[10px] text-gray-600">Nv. {friend.profile.level}</span>
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  )
}

export default function FriendsTab({
  friends, pendingReceived, pendingSent, blocked, loading, onAccept, onReject, onRemove, onBlock, onUnblock, onOpenAddFriend,
}: FriendsTabProps) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? friends.filter(f => f.profile.username?.toLowerCase().includes(search.toLowerCase()))
    : friends

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-400 font-medium">
          {friends.length} ami{friends.length !== 1 ? 's' : ''}
        </h2>
        <button
          onClick={onOpenAddFriend}
          className="flex items-center gap-2 text-sm text-[#4578be] hover:text-[#5989d8] font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-6 pr-0 py-2 bg-transparent border-b border-white/[0.04] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/10 transition-colors"
        />
      </div>

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <section>
          <h3 className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold mb-4">
            Demandes reçues
          </h3>
          {pendingReceived.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <FriendRow
                friend={f}
                actions={
                  <>
                    <button onClick={() => onAccept(f.id)} className="p-1.5 text-emerald-400/70 hover:text-emerald-400 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => onReject(f.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                }
              />
            </motion.div>
          ))}
        </section>
      )}

      {/* Pending sent */}
      {pendingSent.length > 0 && (
        <section>
          <h3 className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold mb-4">
            Envoyées
          </h3>
          {pendingSent.map(f => (
            <FriendRow
              key={f.id}
              friend={f}
              actions={
                <button onClick={() => onReject(f.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              }
            />
          ))}
        </section>
      )}

      {/* Friends list */}
      <section>
        {filtered.length > 0 ? (
          filtered.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <FriendRow
                friend={f}
                actions={
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onRemove(f.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors" title="Supprimer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onBlock(f.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors" title="Bloquer">
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
              />
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-gray-600 py-8">{search ? 'Aucun résultat' : 'Aucun ami pour le moment'}</p>
        )}
      </section>

      {/* Blocked users */}
      {blocked.length > 0 && (
        <section>
          <h3 className="text-xs text-gray-500 uppercase tracking-[0.2em] font-semibold mb-4">
            Bloqués ({blocked.length})
          </h3>
          {blocked.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <FriendRow
                friend={f}
                actions={
                  <button
                    onClick={() => onUnblock(f.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-medium border border-red-500/20 transition-colors"
                    title="Débloquer"
                  >
                    <ShieldOff className="w-3 h-3" />
                    Débloquer
                  </button>
                }
              />
            </motion.div>
          ))}
        </section>
      )}
    </div>
  )
}
