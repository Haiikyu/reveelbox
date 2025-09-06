// types/opening.ts
import { Tables } from '@/app/types/database'

// Type de base pour un item de loot
export type LootItem = Tables<'items'> & {
  probability?: number // Ajouté depuis loot_box_items pour l'affichage
  quantity?: number    // Pour gérer les quantités multiples
}

// Type pour une loot box avec ses items
export type LootBoxWithItems = Tables<'loot_boxes'> & {
  items: Array<LootItem & { probability: number }>
}

// Props du composant Wheel
export type WheelProps = {
  items: LootItem[]
  winningItem: LootItem
  duration?: number
  fastMode?: boolean
  onFinish: (item: LootItem) => void
}

// Props du composant LootList
export type LootListProps = {
  items: Array<LootItem & { probability: number }>
  className?: string
}

// Props des boutons d'ouverture
export type OpeningButtonsProps = {
  boxPrice: number
  userCoins: number
  isLoading?: boolean
  onOpenBox: () => void
  onTryFree: () => void
  onToggleFastMode: () => void
  fastMode: boolean
  disabled?: boolean
}

// Types pour les raretés
export type RarityType = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// Configuration des couleurs par rareté
export const RARITY_COLORS: Record<RarityType, { glow: string; border: string; bg: string; text: string }> = {
  common: {
    glow: 'drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]',
    border: 'border-green-400',
    bg: 'bg-green-500/10',
    text: 'text-green-400'
  },
  uncommon: {
    glow: 'drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]',
    border: 'border-blue-400',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400'
  },
  rare: {
    glow: 'drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]',
    border: 'border-purple-400',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400'
  },
  epic: {
    glow: 'drop-shadow-[0_0_6px_rgba(217,70,239,0.4)]',
    border: 'border-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    text: 'text-fuchsia-400'
  },
  legendary: {
    glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    border: 'border-yellow-400',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400'
  }
}