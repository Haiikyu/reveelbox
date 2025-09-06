// lib/xp-system.ts - Système d'expérience centralisé pour ReveelBox

/**
 * SYSTÈME D'EXPÉRIENCE REVEELBOX
 * 
 * Formule unifiée :
 * - Niveau = Math.floor(totalExp / 100) + 1
 * - XP par niveau = 100 (constant)
 * - XP courant dans le niveau = totalExp % 100
 * - XP restant pour niveau suivant = 100 - (totalExp % 100)
 * 
 * Exemples :
 * - 0 XP = Niveau 1 (0/100)
 * - 99 XP = Niveau 1 (99/100) 
 * - 100 XP = Niveau 2 (0/100)
 * - 250 XP = Niveau 3 (50/100)
 * - 2000 XP = Niveau 21 (0/100)
 */

export interface UserLevel {
  level: number
  totalExp: number
  currentLevelExp: number
  expToNextLevel: number
  progressPercentage: number
}

export interface ExpGainSource {
  type: 'box_open' | 'daily_claim' | 'battle_win' | 'purchase' | 'achievement' | 'streak_bonus'
  baseAmount: number
  multiplier?: number
  description: string
}

/**
 * Calcule le niveau d'un utilisateur basé sur son XP total
 */
export function calculateLevel(totalExp: number): number {
  if (totalExp < 0) return 1
  return Math.floor(totalExp / 100) + 1
}

/**
 * Calcule l'XP actuel dans le niveau courant (0-99)
 */
export function getCurrentLevelExp(totalExp: number): number {
  if (totalExp < 0) return 0
  return totalExp % 100
}

/**
 * Calcule l'XP nécessaire pour atteindre le niveau suivant
 */
export function getExpToNextLevel(totalExp: number): number {
  const currentLevelExp = getCurrentLevelExp(totalExp)
  return 100 - currentLevelExp
}

/**
 * Calcule le pourcentage de progression dans le niveau actuel (0-100%)
 */
export function getLevelProgressPercentage(totalExp: number): number {
  const currentLevelExp = getCurrentLevelExp(totalExp)
  return Math.round((currentLevelExp / 100) * 100)
}

/**
 * Calcule l'XP total nécessaire pour atteindre un niveau donné
 */
export function getExpRequiredForLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0
  return (targetLevel - 1) * 100
}

/**
 * Retourne toutes les informations de niveau d'un utilisateur
 */
export function getUserLevelInfo(totalExp: number): UserLevel {
  const level = calculateLevel(totalExp)
  const currentLevelExp = getCurrentLevelExp(totalExp)
  const expToNextLevel = getExpToNextLevel(totalExp)
  const progressPercentage = getLevelProgressPercentage(totalExp)

  return {
    level,
    totalExp,
    currentLevelExp,
    expToNextLevel,
    progressPercentage
  }
}

/**
 * Calcule le gain d'XP selon la source
 */
export function calculateExpGain(source: ExpGainSource): number {
  const { baseAmount, multiplier = 1 } = source
  return Math.floor(baseAmount * multiplier)
}

/**
 * Sources d'XP prédéfinies dans ReveelBox
 */
export const EXP_SOURCES: Record<string, ExpGainSource> = {
  // Ouverture de boîtes
  COMMON_BOX: {
    type: 'box_open',
    baseAmount: 10,
    description: 'Ouverture boîte commune'
  },
  RARE_BOX: {
    type: 'box_open',
    baseAmount: 15,
    description: 'Ouverture boîte rare'
  },
  EPIC_BOX: {
    type: 'box_open',
    baseAmount: 25,
    description: 'Ouverture boîte épique'
  },
  LEGENDARY_BOX: {
    type: 'box_open',
    baseAmount: 50,
    description: 'Ouverture boîte légendaire'
  },
  
  // Réclamations quotidiennes
  DAILY_CLAIM: {
    type: 'daily_claim',
    baseAmount: 20,
    description: 'Réclamation caisse quotidienne'
  },
  DAILY_STREAK_BONUS: {
    type: 'streak_bonus',
    baseAmount: 5, // Par jour de streak
    description: 'Bonus série quotidienne'
  },
  
  // Battles
  BATTLE_WIN: {
    type: 'battle_win',
    baseAmount: 30,
    description: 'Victoire en battle'
  },
  BATTLE_LOSS: {
    type: 'battle_win',
    baseAmount: 5,
    description: 'Défaite en battle (participation)'
  },
  
  // Achats
  COINS_PURCHASE: {
    type: 'purchase',
    baseAmount: 1, // Par 10 coins achetés
    description: 'Achat de coins virtuels'
  },
  
  // Achievements
  FIRST_BOX: {
    type: 'achievement',
    baseAmount: 50,
    description: 'Première boîte ouverte'
  },
  COLLECTOR: {
    type: 'achievement',
    baseAmount: 100,
    description: '100 objets collectés'
  },
  VETERAN: {
    type: 'achievement',
    baseAmount: 200,
    description: '365 jours d\'activité'
  }
}

/**
 * Calcule l'XP de streak quotidien
 */
export function calculateStreakBonus(currentStreak: number): number {
  const baseBonus = EXP_SOURCES.DAILY_STREAK_BONUS.baseAmount
  
  // Bonus progressif selon la longueur du streak
  if (currentStreak >= 30) return baseBonus * 3  // 15 XP après 30 jours
  if (currentStreak >= 7) return baseBonus * 2   // 10 XP après 7 jours
  return baseBonus // 5 XP de base
}

/**
 * Calcule l'XP gagné pour l'ouverture d'une boîte selon sa rareté
 */
export function calculateBoxExpGain(boxRarity: string, itemValue?: number): number {
  const baseExp = (() => {
    switch (boxRarity.toLowerCase()) {
      case 'legendary': return EXP_SOURCES.LEGENDARY_BOX.baseAmount
      case 'epic': return EXP_SOURCES.EPIC_BOX.baseAmount
      case 'rare': return EXP_SOURCES.RARE_BOX.baseAmount
      default: return EXP_SOURCES.COMMON_BOX.baseAmount
    }
  })()
  
  // Bonus basé sur la valeur de l'objet obtenu (optionnel)
  const valueBonus = itemValue ? Math.floor(itemValue / 10) : 0
  
  return baseExp + valueBonus
}

/**
 * Calcule l'XP pour un achat de coins
 */
export function calculatePurchaseExp(coinsAmount: number): number {
  return Math.floor(coinsAmount / 10) * EXP_SOURCES.COINS_PURCHASE.baseAmount
}

/**
 * Vérifie si un utilisateur a assez d'XP pour un niveau donné
 */
export function hasReachedLevel(totalExp: number, targetLevel: number): boolean {
  return calculateLevel(totalExp) >= targetLevel
}

/**
 * Retourne les paliers de niveau pour les freedrops (2, 10, 20, 30, 50...)
 */
export function getFreedropLevels(): number[] {
  return [2, 10, 20, 30, 50, 75, 100]
}

/**
 * Vérifie si un niveau débloque une nouvelle freedrop
 */
export function isFreedropLevel(level: number): boolean {
  return getFreedropLevels().includes(level)
}

/**
 * Calcule le prochain niveau de freedrop pour un utilisateur
 */
export function getNextFreedropLevel(currentLevel: number): number | null {
  const freedropLevels = getFreedropLevels()
  const nextLevel = freedropLevels.find(level => level > currentLevel)
  return nextLevel || null
}

/**
 * Formats d'affichage
 */
export function formatExpDisplay(totalExp: number): string {
  return `${totalExp.toLocaleString()} XP`
}

export function formatLevelDisplay(level: number): string {
  return `Niveau ${level}`
}

export function formatProgressDisplay(currentExp: number): string {
  return `${currentExp}/100 XP`
}

/**
 * Classe utilitaire pour gérer l'XP d'un utilisateur
 */
export class UserExpManager {
  private totalExp: number
  
  constructor(initialExp: number = 0) {
    this.totalExp = Math.max(0, initialExp)
  }
  
  get level(): number {
    return calculateLevel(this.totalExp)
  }
  
  get currentLevelExp(): number {
    return getCurrentLevelExp(this.totalExp)
  }
  
  get expToNext(): number {
    return getExpToNextLevel(this.totalExp)
  }
  
  get progressPercentage(): number {
    return getLevelProgressPercentage(this.totalExp)
  }
  
  get info(): UserLevel {
    return getUserLevelInfo(this.totalExp)
  }
  
  addExp(amount: number): { 
    expGained: number
    levelBefore: number
    levelAfter: number
    leveledUp: boolean 
  } {
    const levelBefore = this.level
    const expGained = Math.max(0, amount)
    
    this.totalExp += expGained
    
    const levelAfter = this.level
    const leveledUp = levelAfter > levelBefore
    
    return {
      expGained,
      levelBefore,
      levelAfter,
      leveledUp
    }
  }
  
  canAccessFreedrop(requiredLevel: number): boolean {
    return this.level >= requiredLevel
  }
  
  getNextFreedrop(): number | null {
    return getNextFreedropLevel(this.level)
  }
}

/**
 * Helper pour les composants React - Hook personnalisé
 */
export function useUserLevel(totalExp: number) {
  const levelInfo = getUserLevelInfo(totalExp)
  const manager = new UserExpManager(totalExp)
  
  return {
    ...levelInfo,
    manager,
    canAccessFreedrop: (requiredLevel: number) => manager.canAccessFreedrop(requiredLevel),
    nextFreedropLevel: manager.getNextFreedrop(),
    formatters: {
      exp: () => formatExpDisplay(totalExp),
      level: () => formatLevelDisplay(levelInfo.level),
      progress: () => formatProgressDisplay(levelInfo.currentLevelExp)
    }
  }
}