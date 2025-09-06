// types/freedrop.ts - Types centralisés et améliorés
export interface LootItem {
  id: string
  name: string
  image_url: string
  market_value: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  probability: number
  description?: string
  category?: string
}

// ✅ AJOUT DU TYPE MANQUANT
export interface DailyBox {
  id: string
  name: string
  description: string
  required_level: number
  image_url: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  max_value: number
  loot_box_items: Array<{
    probability: number
    display_order?: number | null
    items: {
      id: string
      name: string
      description?: string
      rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
      image_url?: string
      market_value: number
      category?: string
    }
  }>
}

export interface FreedropBox {
  id: string
  name: string
  description: string
  image_url: string
  required_level: number
  items: LootItem[]
}

export interface LootBox {
  id: string
  name: string
  description?: string
  image_url: string
  price_virtual: number
  items: LootItem[]
}

export interface DailyClaim {
  daily_box_id: string
  claimed_at: string
}

// ✅ AJOUT DU TYPE MANQUANT
export interface UserStats {
  level: number
  current_exp: number
  exp_to_next: number
  current_streak: number
  longest_streak: number
  total_daily_claims: number
}

// Props pour les composants
export interface BoxPresentationProps {
  boxName: string
  boxImage: string
  boxDescription?: string
  boxPrice?: number
  requiredLevel?: number
  userLevel?: number
  isFreedrp?: boolean
  className?: string
}

export interface WheelProps {
  items: LootItem[]
  winningItem: LootItem | null
  duration?: number
  fastMode?: boolean
  onFinish: () => void
  isSpinning?: boolean
}

export interface LootListProps {
  items: LootItem[]
  className?: string
}

export interface WinningResultProps {
  item: LootItem
  className?: string
}

export interface OpeningButtonsProps {
  boxPrice: number
  userCoins: number
  onOpenBox: () => void
  onTryFree: () => void
  onToggleFastMode: () => void
  fastMode: boolean
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export interface FreedropButtonsProps {
  canClaim: boolean
  alreadyClaimed: boolean
  onClaimBox: () => void
  onTryFree: () => void
  onToggleFastMode: () => void
  fastMode: boolean
  isLoading?: boolean
  className?: string
}

// Utilitaires de raretés
export const RARITY_COLORS = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b'
} as const

export type RarityType = keyof typeof RARITY_COLORS

export const getRarityGlow = (rarity: string): string => {
  return RARITY_COLORS[rarity as RarityType] || RARITY_COLORS.common
}

// ✅ AJOUT DES TYPES SUPABASE MANQUANTS
export interface SupabaseItem {
  id: string
  name: string
  image_url: string | null
  market_value: number
  rarity: string
  description?: string | null
  category?: string | null
}

export interface SupabaseLootBoxItem {
  probability: number
  display_order: number | null
  items: SupabaseItem
}