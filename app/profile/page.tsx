'use client'

import { useState, useCallback, useEffect } from 'react'
import { sanitizeSvg } from '@/utils/sanitizeSvg'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'
import { useAuthModal } from '@/app/components/AuthModalProvider'
import { createClient } from '@/utils/supabase/client'
import { useProfileData } from '@/app/hooks/useProfileData'
import { useProfileStats } from '@/app/hooks/useProfileStats'
import { useProfileCosmetics } from '@/app/hooks/useProfileCosmetics'
import { useFriends } from '@/app/hooks/useFriends'
import { useReplayHistory } from '@/app/hooks/useReplayHistory'
import { useAchievements } from '@/app/hooks/useAchievements'
import ProfileHero from '@/app/components/profile/ProfileHero'
import ProfileNav from '@/app/components/profile/ProfileNav'
import OverviewTab from '@/app/components/profile/tabs/OverviewTab'
import StatsTab from '@/app/components/profile/tabs/StatsTab'
import HistoryTab from '@/app/components/profile/tabs/HistoryTab'
import FriendsTab from '@/app/components/profile/tabs/FriendsTab'
import SettingsTab from '@/app/components/profile/tabs/SettingsTab'
import AddFriendModal from '@/app/components/profile/modals/AddFriendModal'
import ReplayModal from '@/app/components/profile/modals/ReplayModal'
import DeleteAccountModal from '@/app/components/profile/modals/DeleteAccountModal'
import type { ProfileTab } from '@/app/types/profile'

export default function ProfilePage() {
  const { user, profile: authProfile, loading: authLoading, isAuthenticated } = useAuth()
  const { openLoginModal } = useAuthModal()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [replayBattleId, setReplayBattleId] = useState<string | null>(null)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [profileViews, setProfileViews] = useState<number>(0)
  const supabase = createClient()

  const { profile, loading: profileLoading } = useProfileData()
  const { stats, recentItems } = useProfileStats(profile?.id, authProfile)
  const { cosmetics } = useProfileCosmetics(profile?.id)
  const { friends, pendingReceived, pendingSent, blocked, loading: friendsLoading, sendRequest, acceptRequest, rejectRequest, blockUser, removeFriend } = useFriends()
  const { entries, loading: historyLoading, hasMore, filter, setFilter, loadMore } = useReplayHistory(profile?.id)
  const { achievements, unlockedCount, totalCount } = useAchievements(stats)

  // Compteur de visites mensuel (propriétaire seulement)
  useEffect(() => {
    if (!user?.id) return
    const fetchViews = async () => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { count } = await supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .gte('viewed_at', since.toISOString())
      setProfileViews(count ?? 0)
    }
    fetchViews()
  }, [user?.id])

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b1120' }}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    )
  }

  if (!isAuthenticated) { openLoginModal(); return null }
  if (!profile) return null

  const hasCustomBackground = !!cosmetics.backgroundContent

  return (
    <>
      {/* Custom background layer */}
      {cosmetics.backgroundContent && (
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
      )}

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
        isOwnProfile={true}
        hasCustomBackground={hasCustomBackground}
        globalRank={stats.globalRank > 0 ? stats.globalRank : undefined}
        profileViews={profileViews}
      />

      <ProfileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOwnProfile={true}
        pendingFriendsCount={pendingReceived.length}
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
              <OverviewTab stats={stats} recentItems={recentItems} achievements={achievements} memberSince={profile.created_at} isOwnProfile={true} />
            )}
            {activeTab === 'stats' && <StatsTab stats={stats} isOwnProfile={true} />}
            {activeTab === 'history' && (
              <HistoryTab entries={entries} loading={historyLoading} hasMore={hasMore} filter={filter} onFilterChange={setFilter} onLoadMore={loadMore} onReplay={id => setReplayBattleId(id)} isOwnProfile={true} />
            )}
            {activeTab === 'friends' && (
              <FriendsTab friends={friends} pendingReceived={pendingReceived} pendingSent={pendingSent} blocked={blocked} loading={friendsLoading} onAccept={acceptRequest} onReject={rejectRequest} onRemove={removeFriend} onBlock={blockUser} onUnblock={removeFriend} onOpenAddFriend={() => setAddFriendOpen(true)} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                profile={{
                  username: profile.username,
                  bio: profile.bio,
                  location: profile.location,
                  birth_date: profile.birth_date,
                  phone: profile.phone,
                  privacy_profile: profile.privacy_profile,
                  notifications_email: profile.notifications_email,
                  notifications_push: profile.notifications_push,
                  id_rev: profile.id_rev,
                  custom_slug: profile.custom_slug,
                }}
                onDeleteAccount={() => setDeleteAccountOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AddFriendModal isOpen={addFriendOpen} onClose={() => setAddFriendOpen(false)} onSendRequest={sendRequest} />
      <ReplayModal isOpen={!!replayBattleId} onClose={() => setReplayBattleId(null)} battleId={replayBattleId} />
      <DeleteAccountModal isOpen={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />
    </>
  )
}
