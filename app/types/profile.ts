// Types centralisés pour le système de profil

export type ProfileTab = 'overview' | 'stats' | 'history' | 'friends' | 'achievements' | 'customize' | 'settings'

export type HistoryFilter = 'all' | 'box_opening' | 'battle' | 'upgrade' | 'mines' | 'crash'

export interface ProfileCustomization {
  theme_color: string
  banner_url: string
  badge_style: string
  show_stats: boolean
  show_inventory: boolean
  show_achievements: boolean
  show_history: boolean
  show_friends: boolean
  show_level: boolean
  show_showcase: boolean
  profile_privacy: 'public' | 'friends' | 'private'
  avatar_frame: string
  profile_title: string
  custom_badge: string
  banner_overlay: string
  profile_effect: string
  color_theme: string
  background_wallpaper?: string
  showcase_type?: 'items' | 'achievements' | 'stats' | 'recent_activity' | 'none'
  profile_layout?: 'classic' | 'modern' | 'compact'
  animation_style?: 'subtle' | 'dynamic' | 'none'
  featured_badge?: string
  showcase_items?: string[]
  background_pattern?: 'dots' | 'grid' | 'waves' | 'none'
  card_style?: 'glass' | 'solid' | 'gradient'
  social_links?: SocialLinks
}

export interface SocialLinks {
  website: string
  twitter: string
  instagram: string
  twitch: string
  youtube: string
  discord: string
}

export interface UserStats {
  totalBoxesOpened: number
  totalCoinsSpent: number
  totalCoinsEarned: number
  totalValue: number
  totalItemsSold: number
  totalRevenue: number
  battlesWon: number
  battlesLost: number
  battlesPlayed: number
  battleWinRate: number
  totalBattleWinnings: number
  totalBattleLosses: number
  longestWinStreak: number
  currentWinStreak: number
  currentStreak: number
  longestStreak: number
  level: number
  totalExp: number
  currentLevelXP: number
  nextLevelXP: number
  inventoryCount: number
  uniqueItemsCount: number
  mostExpensiveItem: any
  favoriteRarity: string
  favoriteBox: string
  mostOpenedBox: string
  luckiestBox: string
  joinDate: string | null
  lastActivity: string | null
  globalRank: number
  levelRank: number
}

export interface FriendWithProfile {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  created_at: string | null
  updated_at: string | null
  profile: {
    id: string
    username: string | null
    avatar_url: string | null
    level: number
    total_exp: number
    last_activity: string | null
  }
}

export interface ActivityEntry {
  id: string
  type: HistoryFilter
  title: string
  description: string
  value?: number
  rarity?: string
  image_url?: string
  created_at: string
  metadata?: Record<string, any>
}

export interface EquippedCosmetics {
  nameColor: { value: string | null; isGradient: boolean } | null
  avatarFrame: string | null
  bannerSvg: string | null
  pins: Array<{ id: string; name: string; svg: string }>
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'boxes' | 'battles' | 'social' | 'collection' | 'streak' | 'spending'
  progress: number
  target: number
  unlocked: boolean
  unlockedAt?: string
}

export const DEFAULT_CUSTOMIZATION: ProfileCustomization = {
  theme_color: '#6366f1',
  banner_url: '',
  badge_style: 'modern',
  show_stats: true,
  show_inventory: true,
  show_achievements: true,
  show_history: true,
  show_friends: true,
  show_level: true,
  show_showcase: true,
  profile_privacy: 'public',
  avatar_frame: 'default',
  profile_title: '',
  custom_badge: '',
  banner_overlay: 'gradient',
  profile_effect: 'none',
  color_theme: 'indigo',
  showcase_type: 'items',
  profile_layout: 'modern',
  animation_style: 'subtle',
  background_pattern: 'none',
  card_style: 'glass',
  social_links: {
    website: '',
    twitter: '',
    instagram: '',
    twitch: '',
    youtube: '',
    discord: '',
  },
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  website: '',
  twitter: '',
  instagram: '',
  twitch: '',
  youtube: '',
  discord: '',
}

export const AVATAR_FRAMES: Record<string, { label: string; classes: string }> = {
  default: { label: 'Par défaut', classes: 'border-4 border-gray-300 dark:border-gray-600' },
  indigo: { label: 'Indigo', classes: 'border-4 border-indigo-500 shadow-lg shadow-indigo-500/50' },
  gold: { label: 'Or', classes: 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse' },
  diamond: { label: 'Diamant', classes: 'border-4 border-blue-500 shadow-lg shadow-blue-500/50' },
  ruby: { label: 'Rubis', classes: 'border-4 border-red-500 shadow-lg shadow-red-500/50' },
  rainbow: { label: 'Arc-en-ciel', classes: 'border-4 border-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 p-1' },
  cosmic: { label: 'Cosmique', classes: 'border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 p-1 animate-pulse' },
  neon: { label: 'Néon', classes: 'border-4 border-cyan-500 shadow-2xl shadow-cyan-500/80 animate-pulse' },
  legendary: { label: 'Légendaire', classes: 'border-4 border-transparent bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-1' },
  mythic: { label: 'Mythique', classes: 'border-4 border-transparent bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 animate-pulse' },
}

export const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-orange-600',
  mythic: 'from-red-500 to-pink-600',
}

export const RARITY_GLOW: Record<string, string> = {
  common: 'shadow-gray-500/20',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-yellow-500/40',
  mythic: 'shadow-red-500/50',
}
