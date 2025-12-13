// lib/xp-system.ts - Système d'expérience centralisé pour ReveelBox

/**
 * SYSTÈME D'EXPÉRIENCE REVEELBOX V2
 * 
 * Formule basée sur l'argent dépensé :
 * - 1€ dépensé = 5 XP
 * - Progression NON LINÉAIRE avec paliers définis
 * 
 * Paliers de niveau :
 * - Niveau 2 = 100 XP (20€)
 * - Niveau 10 = 1,500 XP (300€)
 * - Niveau 20 = 7,500 XP (1,500€)
 * - Niveau 30 = 20,000 XP (4,000€)
 * - Niveau 40 = 50,000 XP (10,000€)
 * - Niveau 50 = 150,000 XP (30,000€)
 * - Niveau 60 = 350,000 XP (70,000€)
 * - Niveau 70 = 1,000,000 XP (200,000€)
 * - Niveau 80 = 2,500,000 XP (500,000€)
 * - Niveau 90 = 7,500,000 XP (1,500,000€)
 * - Niveau 100 = 20,000,000 XP (4,000,000€)
 * 
 * Interpolation linéaire entre les paliers pour les niveaux intermédiaires
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
 * TABLE DES PALIERS DE NIVEAU
 */
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 10, xp: 1500 },
  { level: 20, xp: 7500 },
  { level: 30, xp: 20000 },
  { level: 40, xp: 50000 },
  { level: 50, xp: 150000 },
  { level: 60, xp: 350000 },
  { level: 70, xp: 1000000 },
  { level: 80, xp: 2500000 },
  { level: 90, xp: 7500000 },
  { level: 100, xp: 20000000 },
]

/**
 * Calcule le niveau d'un utilisateur basé sur son XP total
 * Utilise l'interpolation linéaire entre les paliers
 */
export function calculateLevel(totalExp: number): number {
  if (totalExp < 0) return 1
  
  // Trouver les deux paliers qui encadrent l'XP
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (totalExp >= LEVEL_THRESHOLDS[i].xp && totalExp < LEVEL_THRESHOLDS[i + 1].xp) {
      const lowerThreshold = LEVEL_THRESHOLDS[i]
      const upperThreshold = LEVEL_THRESHOLDS[i + 1]
      
      // Interpolation linéaire
      const xpInRange = totalExp - lowerThreshold.xp
      const xpRangeSize = upperThreshold.xp - lowerThreshold.xp
      const levelRange = upperThreshold.level - lowerThreshold.level
      
      const levelProgress = (xpInRange / xpRangeSize) * levelRange
      return lowerThreshold.level + Math.floor(levelProgress)
    }
  }
  
  // Si au-delà du niveau 100
  if (totalExp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp) {
    return 100
  }
  
  return 1
}

/**
 * Calcule l'XP nécessaire pour un niveau donné
 */
function getXPForLevel(level: number): number {
  if (level <= 1) return 0
  if (level >= 100) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp
  
  // Trouver les paliers qui encadrent le niveau
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (level >= LEVEL_THRESHOLDS[i].level && level < LEVEL_THRESHOLDS[i + 1].level) {
      const lowerThreshold = LEVEL_THRESHOLDS[i]
      const upperThreshold = LEVEL_THRESHOLDS[i + 1]
      
      // Interpolation linéaire inverse
      const levelInRange = level - lowerThreshold.level
      const levelRangeSize = upperThreshold.level - lowerThreshold.level
      const xpRange = upperThreshold.xp - lowerThreshold.xp
      
      const xpProgress = (levelInRange / levelRangeSize) * xpRange
      return Math.floor(lowerThreshold.xp + xpProgress)
    }
  }
  
  return 0
}

/**
 * Calcule l'XP actuel dans le niveau courant
 */
export function getCurrentLevelExp(totalExp: number): number {
  if (totalExp < 0) return 0
  
  const currentLevel = calculateLevel(totalExp)
  const currentLevelXP = getXPForLevel(currentLevel)
  
  return totalExp - currentLevelXP
}

/**
 * Calcule l'XP nécessaire pour atteindre le niveau suivant
 */
export function getExpToNextLevel(totalExp: number): number {
  const currentLevel = calculateLevel(totalExp)
  if (currentLevel >= 100) return 0
  
  const currentLevelXP = getXPForLevel(currentLevel)
  const nextLevelXP = getXPForLevel(currentLevel + 1)
  
  return nextLevelXP - currentLevelXP
}

/**
 * Calcule le pourcentage de progression dans le niveau actuel (0-100%)
 */
export function getLevelProgressPercentage(totalExp: number): number {
  const currentLevel = calculateLevel(totalExp)
  if (currentLevel >= 100) return 100
  
  const currentLevelExp = getCurrentLevelExp(totalExp)
  const expToNextLevel = getExpToNextLevel(totalExp)
  
  if (expToNextLevel === 0) return 100
  
  return Math.min(100, Math.round((currentLevelExp / expToNextLevel) * 100))
}

/**
 * Calcule l'XP total nécessaire pour atteindre un niveau donné
 */
export function getExpRequiredForLevel(targetLevel: number): number {
  return getXPForLevel(targetLevel)
}

/**
 * CONVERSION COINS → XP
 * 10€ = 17,50 coins = 50 XP
 * 1 coin = 2,857 XP (arrondi à 2.86)
 */
export const COINS_TO_XP_RATIO = 50 / 17.5 // ≈ 2.857

/**
 * Calcule l'XP gagné à partir des coins dépensés
 * À utiliser à CHAQUE déduction de la balance
 */
export function calculateExpFromCoinsSpent(coinsAmount: number): number {
  if (coinsAmount <= 0) return 0
  return Math.floor(coinsAmount * COINS_TO_XP_RATIO)
}

/**
 * Calcule combien de coins nécessaires pour gagner X XP
 */
export function calculateCoinsForExp(expAmount: number): number {
  if (expAmount <= 0) return 0
  return Math.ceil(expAmount / COINS_TO_XP_RATIO)
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