// lib/freedrop.ts - Fonctions utilitaires pour le système de freedrop

import { createClient } from '@/utils/supabase/client'

export interface DailyBox {
  id: string
  name: string
  description: string
  required_level: number
  image_url?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  max_reward_value: number
  loot_box_items: Array<{
    probability: number
    items: {
      id: string
      name: string
      description?: string
      rarity: string
      image_url?: string
      market_value: number
      category?: string
    }
  }>
}

export interface DailyClaim {
  id: string
  user_id: string
  daily_box_id: string
  item_id: string
  claimed_at: string
  streak_day?: number
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_claim_date: string
  streak_rewards_claimed: string[]
}

export interface StreakReward {
  id: string
  required_days: number
  reward_type: 'xp_bonus' | 'extra_box' | 'coins' | 'special_item'
  reward_value: number
  description: string
  is_active: boolean
}

export class FreedropService {
  private supabase = createClient()

  /**
   * Récupère toutes les caisses quotidiennes disponibles
   */
  async getDailyBoxes(): Promise<DailyBox[]> {
    try {
      const { data, error } = await this.supabase
        .from('loot_boxes')
        .select(`
          id,
          name,
          description,
          required_level,
          image_url,
          max_reward_value,
          loot_box_items (
            probability,
            items (
              id,
              name,
              description,
              rarity,
              image_url,
              market_value,
              category
            )
          )
        `)
        .eq('is_daily_free', true)
        .eq('is_active', true)
        .order('required_level', { ascending: true })

      if (error) {
        console.error('Error fetching daily boxes:', error)
        return this.getTestDailyBoxes()
      }

      if (!data || data.length === 0) {
        return this.getTestDailyBoxes()
      }

      // ✅ CORRECTION TypeScript - Mapping sécurisé avec assertion de type
      return data.map((box: any): DailyBox => ({
        id: box.id,
        name: box.name,
        description: box.description,
        required_level: box.required_level,
        image_url: box.image_url,
        max_reward_value: box.max_reward_value,
        rarity: this.calculateBoxRarity(box.required_level),
        loot_box_items: box.loot_box_items || []
      }))
    } catch (error) {
      console.error('Error in getDailyBoxes:', error)
      return this.getTestDailyBoxes()
    }
  }

  /**
   * Vérifie les réclamations d'aujourd'hui pour un utilisateur
   */
  async getTodayClaims(userId: string): Promise<string[]> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('daily_claims')
        .select('daily_box_id')
        .eq('user_id', userId)
        .gte('claimed_at', `${today}T00:00:00.000Z`)
        .lt('claimed_at', `${today}T23:59:59.999Z`)

      if (error) {
        console.error('Error fetching today claims:', error)
        return []
      }

      return data?.map(claim => claim.daily_box_id) || []
    } catch (error) {
      console.error('Error in getTodayClaims:', error)
      return []
    }
  }

  /**
   * Récupère le streak actuel d'un utilisateur
   */
  async getUserStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('user_streaks')
        .select('current_streak, last_claim_date')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return 0
      }

      // Vérifier si le streak est toujours valide
      const lastClaim = new Date(data.last_claim_date)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      // Reset streak si pas de claim hier ou aujourd'hui
      if (lastClaim < yesterday) {
        return 0
      }

      return data.current_streak || 0
    } catch (error) {
      console.error('Error in getUserStreak:', error)
      return 0
    }
  }

  /**
   * Calcule le niveau d'un utilisateur basé sur son XP
   */
  calculateUserLevel(exp: number): number {
    return Math.floor(exp / 100) + 1
  }

  /**
   * Détermine si un utilisateur peut réclamer une caisse
   */
  canClaimBox(userLevel: number, requiredLevel: number, alreadyClaimed: boolean): boolean {
    return userLevel >= requiredLevel && !alreadyClaimed
  }

  /**
   * Traite la réclamation d'une caisse quotidienne
   */
  async claimDailyBox(userId: string, box: DailyBox): Promise<{
    success: boolean
    item?: any
    xpGained?: number
    error?: string
  }> {
    try {
      // Calculer l'item obtenu selon les probabilités
      const obtainedItem = this.calculateRandomItem(box.loot_box_items)
      if (!obtainedItem) {
        return { success: false, error: 'Aucun item disponible dans cette caisse' }
      }

      // Utiliser la fonction RPC pour traiter la réclamation
      const { data, error } = await this.supabase.rpc('claim_daily_box', {
        p_user_id: userId,
        p_box_id: box.id,
        p_item_id: obtainedItem.id
      })

      if (error) {
        console.error('Error claiming daily box:', error)
        return { success: false, error: error.message }
      }

      return {
        success: true,
        item: {
          ...obtainedItem,
          xpGained: data?.xp_gained || 10
        },
        xpGained: data?.xp_gained || 10
      }
    } catch (error) {
      console.error('Error in claimDailyBox:', error)
      return { success: false, error: 'Une erreur est survenue lors de la réclamation' }
    }
  }

  /**
   * Calcule un item aléatoire selon les probabilités
   */
  private calculateRandomItem(lootBoxItems: DailyBox['loot_box_items']): any {
    if (!lootBoxItems || lootBoxItems.length === 0) return null

    const random = Math.random() * 100
    let cumulative = 0
    
    for (const lootItem of lootBoxItems) {
      cumulative += lootItem.probability
      if (random <= cumulative) {
        return lootItem.items
      }
    }
    
    // Fallback au premier item
    return lootBoxItems[0]?.items
  }

  /**
   * Calcule la rareté d'une caisse selon le niveau requis
   */
  private calculateBoxRarity(requiredLevel: number): 'common' | 'rare' | 'epic' | 'legendary' {
    if (requiredLevel >= 20) return 'legendary'
    if (requiredLevel >= 10) return 'epic'
    if (requiredLevel >= 5) return 'rare'
    return 'common'
  }

  /**
   * Génère des données de test si pas de caisses en DB
   */
  private getTestDailyBoxes(): DailyBox[] {
    return [
      {
        id: 'daily-1',
        name: 'Caisse Débutant',
        description: 'Votre première caisse quotidienne gratuite',
        required_level: 1,
        image_url: '/images/daily-box-1.png',
        rarity: 'common',
        max_reward_value: 50,
        loot_box_items: [
          {
            probability: 70,
            items: { 
              id: '1', 
              name: 'Porte-clés Basic', 
              description: 'Un porte-clés simple mais utile',
              rarity: 'common', 
              market_value: 5, 
              image_url: 'https://via.placeholder.com/200x200/9CA3AF/FFFFFF?text=Basic',
              category: 'daily_reward'
            }
          },
          {
            probability: 25,
            items: { 
              id: '2', 
              name: 'Sticker Cool', 
              description: 'Un autocollant tendance',
              rarity: 'rare', 
              market_value: 15, 
              image_url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Rare',
              category: 'daily_reward'
            }
          },
          {
            probability: 5,
            items: { 
              id: '3', 
              name: 'Badge Collector', 
              description: 'Badge de collection limité',
              rarity: 'epic', 
              market_value: 35, 
              image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Epic',
              category: 'daily_reward'
            }
          }
        ]
      },
      {
        id: 'daily-2',
        name: 'Caisse Aventurier',
        description: 'Pour les explorateurs expérimentés',
        required_level: 5,
        image_url: '/images/daily-box-2.png',
        rarity: 'rare',
        max_reward_value: 100,
        loot_box_items: [
          {
            probability: 60,
            items: { 
              id: '4', 
              name: 'Gadget Vintage', 
              description: 'Un objet vintage authentique',
              rarity: 'common', 
              market_value: 20, 
              image_url: 'https://via.placeholder.com/200x200/9CA3AF/FFFFFF?text=Vintage',
              category: 'daily_reward'
            }
          },
          {
            probability: 30,
            items: { 
              id: '5', 
              name: 'Objet de Collection', 
              description: 'Pièce de collection recherchée',
              rarity: 'rare', 
              market_value: 45, 
              image_url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Collection',
              category: 'daily_reward'
            }
          },
          {
            probability: 10,
            items: { 
              id: '6', 
              name: 'Pièce Rare', 
              description: 'Monnaie de collection',
              rarity: 'epic', 
              market_value: 80, 
              image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Rare+Coin',
              category: 'daily_reward'
            }
          }
        ]
      },
      {
        id: 'daily-3',
        name: 'Caisse Expert',
        description: 'Réservée aux maîtres du jeu',
        required_level: 10,
        image_url: '/images/daily-box-3.png',
        rarity: 'epic',
        max_reward_value: 200,
        loot_box_items: [
          {
            probability: 50,
            items: { 
              id: '7', 
              name: 'Accessoire Premium', 
              description: 'Accessoire haut de gamme',
              rarity: 'rare', 
              market_value: 50, 
              image_url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Premium',
              category: 'daily_reward'
            }
          },
          {
            probability: 35,
            items: { 
              id: '8', 
              name: 'Objet Exclusif', 
              description: 'Objet en édition limitée',
              rarity: 'epic', 
              market_value: 120, 
              image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Exclusif',
              category: 'daily_reward'
            }
          },
          {
            probability: 15,
            items: { 
              id: '9', 
              name: 'Trésor Légendaire', 
              description: 'Artefact légendaire',
              rarity: 'legendary', 
              market_value: 180, 
              image_url: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=Trésor',
              category: 'daily_reward'
            }
          }
        ]
      },
      {
        id: 'daily-4',
        name: 'Caisse Maître',
        description: 'Le summum de la récompense quotidienne',
        required_level: 20,
        image_url: '/images/daily-box-4.png',
        rarity: 'legendary',
        max_reward_value: 350,
        loot_box_items: [
          {
            probability: 40,
            items: { 
              id: '10', 
              name: 'Objet de Maître', 
              description: 'Réservé aux véritables maîtres',
              rarity: 'epic', 
              market_value: 100, 
              image_url: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=Maître',
              category: 'daily_reward'
            }
          },
          {
            probability: 40,
            items: { 
              id: '11', 
              name: 'Relique Antique', 
              description: 'Relique d\'une époque révolue',
              rarity: 'legendary', 
              market_value: 250, 
              image_url: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=Relique',
              category: 'daily_reward'
            }
          },
          {
            probability: 20,
            items: { 
              id: '12', 
              name: 'Artefact Mythique', 
              description: 'L\'objet le plus rare du jeu',
              rarity: 'legendary', 
              market_value: 300, 
              image_url: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=Mythique',
              category: 'daily_reward'
            }
          }
        ]
      }
    ]
  }

  /**
   * Récupère les récompenses de streak disponibles
   */
  async getStreakRewards(): Promise<StreakReward[]> {
    try {
      const { data, error } = await this.supabase
        .from('streak_rewards')
        .select('*')
        .eq('is_active', true)
        .order('required_days', { ascending: true })

      if (error) {
        console.error('Error fetching streak rewards:', error)
        return this.getDefaultStreakRewards()
      }

      return data || this.getDefaultStreakRewards()
    } catch (error) {
      console.error('Error in getStreakRewards:', error)
      return this.getDefaultStreakRewards()
    }
  }

  /**
   * Récompenses de streak par défaut
   */
  private getDefaultStreakRewards(): StreakReward[] {
    return [
      {
        id: '1',
        required_days: 3,
        reward_type: 'xp_bonus',
        reward_value: 10,
        description: 'Bonus +10% XP pendant 24h',
        is_active: true
      },
      {
        id: '2',
        required_days: 7,
        reward_type: 'extra_box',
        reward_value: 1,
        description: 'Caisse bonus supplémentaire',
        is_active: true
      },
      {
        id: '3',
        required_days: 14,
        reward_type: 'xp_bonus',
        reward_value: 25,
        description: 'Bonus +25% XP pendant 24h',
        is_active: true
      },
      {
        id: '4',
        required_days: 30,
        reward_type: 'special_item',
        reward_value: 1,
        description: 'Caisse légendaire exclusive',
        is_active: true
      }
    ]
  }

  /**
   * Calcule le temps jusqu'à la prochaine réinitialisation
   */
  getTimeUntilReset(): string {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  /**
   * Couleurs CSS pour les raretés
   */
  getRarityColors() {
    return {
      common: {
        gradient: 'from-gray-400 to-gray-600',
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-600'
      },
      rare: {
        gradient: 'from-blue-400 to-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-600'
      },
      epic: {
        gradient: 'from-purple-400 to-purple-600',
        bg: 'bg-purple-50 border-purple-200',
        text: 'text-purple-600'
      },
      legendary: {
        gradient: 'from-yellow-400 to-yellow-600',
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-600'
      }
    }
  }
}

// Instance singleton
export const freedropService = new FreedropService()

// Hooks React personnalisés
export function useFreedrop() {
  return freedropService
}

// Utilitaires de formatage
export const formatters = {
  date: (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },
  
  timeRemaining: (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },
  
  level: (exp: number) => {
    return Math.floor(exp / 100) + 1
  },
  
  xpProgress: (exp: number) => {
    return exp % 100
  }
}