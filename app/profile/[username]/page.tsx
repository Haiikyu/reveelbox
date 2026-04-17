'use client'

import { useState, useEffect } from 'react'
import { sanitizeSvg } from '@/utils/sanitizeSvg'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useProfileData } from '@/app/hooks/useProfileData'
import { useProfileStats } from '@/app/hooks/useProfileStats'
import { useProfileCosmetics } from '@/app/hooks/useProfileCosmetics'
import { useFriends } from '@/app/hooks/useFriends'
import { useMutualFriends } from '@/app/hooks/useMutualFriends'
import { useReplayHistory } from '@/app/hooks/useReplayHistory'
import { useAchievements } from '@/app/hooks/useAchievements'
import ProfileHero from '@/app/components/profile/ProfileHero'
import ProfileNav from '@/app/components/profile/ProfileNav'
import OverviewTab from '@/app/components/profile/tabs/OverviewTab'
import StatsTab from '@/app/components/profile/tabs/StatsTab'
import HistoryTab from '@/app/components/profile/tabs/HistoryTab'
import ReplayModal from '@/app/components/profile/modals/ReplayModal'
import type { ProfileTab } from '@/app/types/profile'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [replayBattleId, setReplayBattleId] = useState<string | null>(null)
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null)

  const { user } = useAuth()
  const { profile, customization, isOwnProfile, canView, loading, error } = useProfileData(username)
  const { stats, recentItems } = useProfileStats(canView ? profile?.id : null, profile)
  const { cosmetics } = useProfileCosmetics(profile?.id)
  const { sendRequest, getFriendshipStatus, cancelRequestByUserId, acceptByUserId, declineByUserId, unblockByUserId } = useFriends()
  const { mutualFriends } = useMutualFriends(user?.id, profile?.id)
  const { entries, loading: historyLoading, hasMore, filter, setFilter, loadMore } = useReplayHistory(canView ? profile?.id : null)
  const { achievements } = useAchievements(stats)

  // Détection battle active
  useEffect(() => {
    if (!profile?.id) return
    const profileId = profile.id
    const supabase = createClient()

    async function checkActiveBattle() {
      const { data } = await supabase
        .from('battle_participants')
        .select('battle_id, battles!inner(id, status)')
        .eq('user_id', profileId)
        .eq('is_bot', false)
        .limit(10)

      const activeBattle = data?.find(p => {
        const battle = (p as any).battles
        return battle && ['waiting', 'countdown', 'active'].includes(battle.status)
      })
      if (activeBattle?.battle_id) setActiveBattleId(activeBattle.battle_id)
    }

    checkActiveBattle()
  }, [profile?.id])

  // Redirect to own profile via useEffect to avoid "Cannot update Router while rendering"
  const [redirecting, setRedirecting] = useState(false)
  useEffect(() => {
    if (isOwnProfile && !loading) {
      setRedirecting(true)
      router.push('/profile')
    }
  }, [isOwnProfile, loading, router])

  if (redirecting || (isOwnProfile && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1120' }}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1120' }}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1120' }}>
        <div className="text-center">
          <p className="text-lg font-semibold text-white mb-1">Profil introuvable</p>
          <p className="text-sm text-gray-600">{error || 'Ce profil n\'existe pas'}</p>
        </div>
      </div>
    )
  }

  const friendshipStatus = profile.id ? getFriendshipStatus(profile.id) : 'none' as const
  const hasCustomBackground = !!cosmetics.backgroundContent

  const backgroundLayer = cosmetics.backgroundContent ? (
    <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none', opacity: 0.4 }}>
      {cosmetics.backgroundType === 'image' ? (
        <img src={cosmetics.backgroundContent} alt="" className="w-full h-full object-cover" />
      ) : cosmetics.backgroundType === 'svg' ? (
        <div
          className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(cosmetics.backgroundContent) }}
        />
      ) : (
        <div className="w-full h-full" style={{ background: cosmetics.backgroundContent }} />
      )}
    </div>
  ) : null

  if (!canView) {
    return (
      <>
        {backgroundLayer}
        <ProfileHero
          username={profile.username}
          avatarUrl={profile.avatar_url}
          level={profile.level}
          totalExp={profile.total_exp}
          streak={profile.consecutive_days}
          bio={profile.bio}
          location={profile.location}
          cosmetics={cosmetics}
          isOwnProfile={false}
          hasCustomBackground={hasCustomBackground}
          friendshipStatus={friendshipStatus}
          onAddFriend={() => profile.id && sendRequest(profile.id)}
          onCancelRequest={() => profile.id && cancelRequestByUserId(profile.id)}
          onAcceptRequest={() => profile.id && acceptByUserId(profile.id)}
          onDeclineRequest={() => profile.id && declineByUserId(profile.id)}
          onUnblock={() => profile.id && unblockByUserId(profile.id)}
          mutualFriends={mutualFriends}
          activeBattleId={activeBattleId}
        />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Lock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {customization.profile_privacy === 'friends' ? 'Réservé aux amis' : 'Profil privé'}
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {backgroundLayer}
      <ProfileHero
        username={profile.username}
        avatarUrl={profile.avatar_url}
        level={stats.level || profile.level}
        totalExp={stats.totalExp || profile.total_exp}
        streak={profile.consecutive_days}
        totalCoinsPlayed={stats.totalCoinsSpent}
        bio={profile.bio}
        location={profile.location}
        cosmetics={cosmetics}
        isOwnProfile={false}
        hasCustomBackground={hasCustomBackground}
        friendshipStatus={friendshipStatus}
        onAddFriend={() => profile.id && sendRequest(profile.id)}
        onCancelRequest={() => profile.id && cancelRequestByUserId(profile.id)}
        onAcceptRequest={() => profile.id && acceptByUserId(profile.id)}
        onDeclineRequest={() => profile.id && declineByUserId(profile.id)}
        onUnblock={() => profile.id && unblockByUserId(profile.id)}
        mutualFriends={mutualFriends}
        activeBattleId={activeBattleId}
      />

      <ProfileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOwnProfile={false}
      />

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-12 pb-24 lg:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab stats={stats} recentItems={recentItems} achievements={achievements} memberSince={profile.created_at} isOwnProfile={false} />
            )}
            {activeTab === 'stats' && <StatsTab stats={stats} isOwnProfile={false} />}
            {activeTab === 'history' && (
              <HistoryTab entries={entries} loading={historyLoading} hasMore={hasMore} filter={filter} onFilterChange={setFilter} onLoadMore={loadMore} onReplay={id => setReplayBattleId(id)} isOwnProfile={false} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ReplayModal isOpen={!!replayBattleId} onClose={() => setReplayBattleId(null)} battleId={replayBattleId} />
    </>
  )
}
