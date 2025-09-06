// components/Wheel/wheel.utils.ts
import { LootItem, RarityType } from '../../types/opening'

/**
 * Calcule la position finale de la roue pour s'arrêter exactement sur l'item gagnant
 */
export function calculateWheelOffset(
  items: LootItem[],
  winningItem: LootItem,
  containerWidth: number,
  itemWidth: number = 120,
  turns: number = 5
): number {
  const winningIndex = items.findIndex(item => item.id === winningItem.id)
  
  if (winningIndex === -1) {
    console.warn('Item gagnant introuvable dans la liste des items')
    return 0
  }

  const centerPosition = containerWidth / 2
  const winningItemPosition = winningIndex * itemWidth + (itemWidth / 2)
  
  // Distance totale avec plusieurs tours complets
  const totalDistance = turns * items.length * itemWidth
  
  // Offset final pour centrer l'item gagnant
  return totalDistance + (centerPosition - winningItemPosition)
}

/**
 * Génère une séquence d'items répétés pour créer l'illusion de continuité
 */
export function generateWheelSequence(items: LootItem[], repetitions: number = 10): LootItem[] {
  const sequence: LootItem[] = []
  
  for (let i = 0; i < repetitions; i++) {
    sequence.push(...items)
  }
  
  return sequence
}

/**
 * Détermine si un item doit être mis en évidence (effet gagnant)
 */
export function shouldHighlightItem(
  item: LootItem,
  winningItem: LootItem,
  repeatIndex: number,
  targetRepeatIndex: number = 5
): boolean {
  return item.id === winningItem.id && repeatIndex === targetRepeatIndex
}

/**
 * Calcule la durée d'animation en fonction du mode
 */
export function getAnimationDuration(baseDuration: number, fastMode: boolean): number {
  return fastMode ? baseDuration / 3 : baseDuration
}

/**
 * Retourne les propriétés de style pour une rareté donnée
 */
export function getRarityStyles(rarity: string) {
  const rarityMap: Record<string, RarityType> = {
    'common': 'common',
    'uncommon': 'uncommon', 
    'rare': 'rare',
    'epic': 'epic',
    'legendary': 'legendary'
  }
  
  const rarityKey = rarityMap[rarity.toLowerCase()] || 'common'
  
  return {
    glow: {
      common: 'drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]',
      uncommon: 'drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]',
      rare: 'drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]',
      epic: 'drop-shadow-[0_0_6px_rgba(217,70,239,0.4)]',
      legendary: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
    }[rarityKey],
    
    border: {
      common: 'border-green-400',
      uncommon: 'border-blue-400',
      rare: 'border-purple-400',
      epic: 'border-fuchsia-400',
      legendary: 'border-yellow-400'
    }[rarityKey],
    
    bg: {
      common: 'bg-green-500/10',
      uncommon: 'bg-blue-500/10',
      rare: 'bg-purple-500/10',
      epic: 'bg-fuchsia-500/10',
      legendary: 'bg-yellow-500/10'
    }[rarityKey],
    
    text: {
      common: 'text-green-400',
      uncommon: 'text-blue-400',
      rare: 'text-purple-400',
      epic: 'text-fuchsia-400',
      legendary: 'text-yellow-400'
    }[rarityKey]
  }
}

/**
 * Génère les paramètres de timing pour l'animation de la roue
 */
export function getWheelTimingParams(fastMode: boolean) {
  return {
    duration: fastMode ? 1500 : 4000,
    turns: fastMode ? 3 : 5,
    easing: [0.25, 0.46, 0.45, 0.94] as const, // cubic-bezier pour décélération naturelle
    initialDelay: 300
  }
}

/**
 * Valide que tous les items ont les propriétés requises pour la roue
 */
export function validateWheelItems(items: LootItem[]): boolean {
  if (!items.length) {
    console.error('Aucun item fourni pour la roue')
    return false
  }

  const requiredProps = ['id', 'name', 'rarity', 'image_url']
  
  for (const item of items) {
    for (const prop of requiredProps) {
      if (!(prop in item)) {
        console.error(`Propriété manquante "${prop}" pour l'item:`, item)
        return false
      }
    }
  }

  return true
}

/**
 * Trouve l'item gagnant dans la liste ou retourne le premier par défaut
 */
export function findWinningItem(items: LootItem[], winningItemId?: string): LootItem {
  if (!winningItemId) {
    return items[0]
  }

  const winningItem = items.find(item => item.id === winningItemId)
  
  if (!winningItem) {
    console.warn(`Item gagnant avec ID ${winningItemId} introuvable, utilisation du premier item`)
    return items[0]
  }

  return winningItem
}