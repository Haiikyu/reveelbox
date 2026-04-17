'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import type { ProfileCustomization } from '@/app/types/profile'
import { DEFAULT_CUSTOMIZATION } from '@/app/types/profile'

interface ProfileData {
  id: string
  username: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  phone: string | null
  birth_date: string | null
  level: number
  total_exp: number
  consecutive_days: number
  longest_streak: number
  created_at: string
  last_activity: string | null
  privacy_profile: string
  theme: Record<string, unknown> | null
  virtual_currency: number
  notifications_email: boolean
  notifications_push: boolean
  id_rev: string | null
  custom_slug: string | null
}

interface UseProfileDataReturn {
  profile: ProfileData | null
  customization: ProfileCustomization
  isOwnProfile: boolean
  canView: boolean
  isFriend: boolean
  loading: boolean
  error: string | null
}

export function useProfileData(targetUsername?: string): UseProfileDataReturn {
  const { user, profile: authProfile } = useAuth()
  const supabase = createClient()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFriend, setIsFriend] = useState(false)

  const isOwnProfile = !targetUsername || (
    authProfile?.username?.toLowerCase() === targetUsername.toLowerCase()
    || (authProfile as any)?.id_rev === targetUsername
    || (authProfile as any)?.custom_slug?.toLowerCase() === targetUsername.toLowerCase()
  )

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        if (isOwnProfile && authProfile) {
          // Own profile - use auth profile data
          setProfileData({
            id: authProfile.id,
            username: authProfile.username || null,
            avatar_url: authProfile.avatar_url || null,
            bio: authProfile.bio || null,
            location: authProfile.location || null,
            phone: authProfile.phone || null,
            birth_date: authProfile.birth_date || null,
            level: authProfile.level || 1,
            total_exp: authProfile.total_exp || 0,
            consecutive_days: authProfile.consecutive_days || 0,
            longest_streak: authProfile.longest_streak || 0,
            created_at: authProfile.created_at,
            last_activity: authProfile.last_activity || null,
            privacy_profile: authProfile.privacy_profile || 'public',
            theme: authProfile.theme || {},
            virtual_currency: authProfile.virtual_currency || 0,
            notifications_email: authProfile.notifications_email ?? true,
            notifications_push: authProfile.notifications_push ?? true,
            id_rev: (authProfile as any).id_rev || null,
            custom_slug: (authProfile as any).custom_slug || null,
          })
          setLoading(false)
          return
        }

        // Public profile - fetch by username
        if (!targetUsername) {
          setError('Profil non trouvé')
          setLoading(false)
          return
        }

        const selectFields = 'id, username, avatar_url, bio, location, phone, birth_date, level, total_exp, consecutive_days, longest_streak, created_at, last_activity, privacy_profile, theme, virtual_currency, notifications_email, notifications_push, id_rev, custom_slug'

        let data: any = null
        let fetchError: any = null

        // Strategy 1: if starts with RV-, lookup by id_rev
        if (targetUsername.startsWith('RV-')) {
          const res = await supabase.from('profiles').select(selectFields).eq('id_rev', targetUsername).maybeSingle()
          data = res.data
          fetchError = res.error
        }

        // Strategy 2: try custom_slug (exact match)
        if (!data && !fetchError) {
          const res = await supabase.from('profiles').select(selectFields).ilike('custom_slug', targetUsername).maybeSingle()
          data = res.data
          fetchError = res.error
        }

        // Strategy 3: try username (case-insensitive, also handles URL-decoded names)
        if (!data && !fetchError) {
          const decodedUsername = decodeURIComponent(targetUsername)
          const res = await supabase.from('profiles').select(selectFields).ilike('username', decodedUsername).maybeSingle()
          data = res.data
          fetchError = res.error
        }

        if (fetchError || !data) {
          setError('Profil non trouvé')
          setLoading(false)
          return
        }

        setProfileData(data as ProfileData)

        // Check friendship status if logged in
        if (user && data.id !== user.id) {
          const { data: friendship } = await supabase
            .from('friendships')
            .select('status')
            .or(`and(requester_id.eq.${user.id},addressee_id.eq.${data.id}),and(requester_id.eq.${data.id},addressee_id.eq.${user.id})`)
            .eq('status', 'accepted')
            .maybeSingle()

          setIsFriend(!!friendship)
        }
      } catch {
        setError('Erreur lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUsername, authProfile, user])

  // Parse customization from theme
  const theme = profileData?.theme
  const customization: ProfileCustomization = theme
    ? {
        ...DEFAULT_CUSTOMIZATION,
        theme_color: (theme.theme_color as string) || DEFAULT_CUSTOMIZATION.theme_color,
        banner_url: (theme.banner_url as string) || DEFAULT_CUSTOMIZATION.banner_url,
        badge_style: (theme.badge_style as string) || DEFAULT_CUSTOMIZATION.badge_style,
        show_stats: theme.show_stats !== false,
        show_inventory: theme.show_inventory !== false,
        show_achievements: theme.show_achievements !== false,
        show_history: theme.show_history !== false,
        show_friends: theme.show_friends !== false,
        show_level: theme.show_level !== false,
        show_showcase: theme.show_showcase !== false,
        profile_privacy: (profileData?.privacy_profile as 'public' | 'friends' | 'private') || DEFAULT_CUSTOMIZATION.profile_privacy,
        avatar_frame: (theme.avatar_frame as string) || DEFAULT_CUSTOMIZATION.avatar_frame,
        profile_title: (theme.profile_title as string) || DEFAULT_CUSTOMIZATION.profile_title,
        custom_badge: (theme.custom_badge as string) || DEFAULT_CUSTOMIZATION.custom_badge,
        banner_overlay: (theme.banner_overlay as string) || DEFAULT_CUSTOMIZATION.banner_overlay,
        profile_effect: (theme.profile_effect as string) || DEFAULT_CUSTOMIZATION.profile_effect,
        color_theme: (theme.color_theme as string) || DEFAULT_CUSTOMIZATION.color_theme,
        background_wallpaper: (theme.background_wallpaper as string) || DEFAULT_CUSTOMIZATION.background_wallpaper,
        showcase_type: (theme.showcase_type as ProfileCustomization['showcase_type']) || DEFAULT_CUSTOMIZATION.showcase_type,
        profile_layout: (theme.profile_layout as ProfileCustomization['profile_layout']) || DEFAULT_CUSTOMIZATION.profile_layout,
        animation_style: (theme.animation_style as ProfileCustomization['animation_style']) || DEFAULT_CUSTOMIZATION.animation_style,
        background_pattern: (theme.background_pattern as ProfileCustomization['background_pattern']) || DEFAULT_CUSTOMIZATION.background_pattern,
        card_style: (theme.card_style as ProfileCustomization['card_style']) || DEFAULT_CUSTOMIZATION.card_style,
        social_links: (theme.social_links as ProfileCustomization['social_links']) || DEFAULT_CUSTOMIZATION.social_links,
      }
    : { ...DEFAULT_CUSTOMIZATION }

  // Determine visibility
  const canView = isOwnProfile
    || customization.profile_privacy === 'public'
    || (customization.profile_privacy === 'friends' && isFriend)

  return { profile: profileData, customization, isOwnProfile, canView, isFriend, loading, error }
}
