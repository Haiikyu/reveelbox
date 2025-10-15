// lib/services/freedrop.ts - Service pour gérer les freedrops
import { createClient } from '@/utils/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface FreedropItem {
  id: string
  name: string
  image_url: string
  market_value: number
  rarity: string
  probability: number
  description?: string
  category?: string
}

export interface FreedropBox {
  id: string
  name: string
  description: string
  image_url: string
  required_level: number
  can_access: boolean
  already_claimed: boolean
  can_claim: boolean
  items: FreedropItem[]
}

export interface UserFreedropStatus {
  user_level: number
  today: string
  boxes: FreedropBox[]
}

export interface ClaimResult {
  success: boolean
  claim_id?: string
  inventory_id?: string
  item_value?: number
  xp_gained?: number
  new_level?: number
  message?: string
  error?: string
  error_code?: string
}

export interface ClaimStatus {
  success: boolean
  can_claim: boolean
  has_level: boolean
  already_claimed: boolean
  user_level: number
  required_level: number
  today: string
  error?: string
  error_code?: string
}

class FreedropService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Récupère le statut des freedrops pour un utilisateur
   */
  async getUserFreedropStatus(userId: string): Promise<UserFreedropStatus | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_freedrop_status', {
        p_user_id: userId
      })

      if (error) {
        console.error('Erreur récupération statut freedrop:', error)
        return null
      }

      if (!data?.success) {
        console.error('Échec récupération statut:', data?.error)
        return null
      }

      return {
        user_level: data.user_level,
        today: data.today,
        boxes: data.boxes || []
      }
    } catch (error) {
      console.error('Erreur critique getUserFreedropStatus:', error)
      return null
    }
  }

  /**
   * Vérifie le statut de claim pour une box spécifique
   */
  async checkClaimStatus(userId: string, boxId: string): Promise<ClaimStatus | null> {
    try {
      const { data, error } = await this.supabase.rpc('check_daily_claim_status', {
        p_user_id: userId,
        p_box_id: boxId
      })

      if (error) {
        console.error('Erreur vérification claim status:', error)
        return null
      }

      return data as ClaimStatus
    } catch (error) {
      console.error('Erreur critique checkClaimStatus:', error)
      return null
    }
  }

  /**
   * Récupère une box freedrop avec ses items
   */
  async getFreedropBox(boxId: string): Promise<FreedropBox | null> {
    try {
      const { data, error } = await this.supabase
        .from('loot_boxes')
        .select(`
          id,
          name,
          description,
          image_url,
          required_level,
          loot_box_items!inner (
            probability,
            display_order,
            items (
              id,
              name,
              image_url,
              market_value,
              rarity,
              description,
              category
            )
          )
        `)
        .eq('id', boxId)
        .eq('is_daily_free', true)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.error('Erreur récupération box:', error)
        return null
      }

      // Validation des données avec gestion des types nulles
      if (!data.loot_box_items || !Array.isArray(data.loot_box_items)) {
        console.error('Données box invalides:', data)
        return null
      }

      // Traiter les items avec validation stricte
      const items: FreedropItem[] = data.loot_box_items
        .filter((item: any) => 
          item && 
          item.items && 
          typeof item.items.id === 'string' &&
          typeof item.items.name === 'string' &&
          typeof item.items.market_value === 'number' &&
          typeof item.items.rarity === 'string' &&
          typeof item.probability === 'number'
        )
        .sort((a: any, b: any) => {
          // CORRECTION: Gestion sûre des valeurs nulles
          if (a.display_order !== null && b.display_order !== null) {
            return a.display_order - b.display_order
          }
          return (b.items?.market_value || 0) - (a.items?.market_value || 0)
        })
        .map((item: any) => ({
          id: item.items.id,
          name: item.items.name,
          image_url: item.items.image_url || '',
          market_value: item.items.market_value,
          rarity: item.items.rarity,
          probability: item.probability,
          description: item.items.description || undefined,
          category: item.items.category || undefined
        }))

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        image_url: data.image_url || '',
        required_level: data.required_level || 1,
        can_access: false, // À déterminer avec checkClaimStatus
        already_claimed: false, // À déterminer avec checkClaimStatus
        can_claim: false, // À déterminer avec checkClaimStatus
        items
      }
    } catch (error) {
      console.error('Erreur critique getFreedropBox:', error)
      return null
    }
  }

  /**
   * Récupère une box avec son statut pour un utilisateur
   */
  async getFreedropBoxWithStatus(userId: string, boxId: string): Promise<FreedropBox | null> {
    try {
      const [box, status] = await Promise.all([
        this.getFreedropBox(boxId),
        this.checkClaimStatus(userId, boxId)
      ])

      if (!box || !status) {
        return null
      }

      return {
        ...box,
        can_access: status.has_level,
        already_claimed: status.already_claimed,
        can_claim: status.can_claim,
        required_level: status.required_level
      }
    } catch (error) {
      console.error('Erreur critique getFreedropBoxWithStatus:', error)
      return null
    }
  }

  /**
   * Réclame une freedrop
   */
  async claimFreedrop(userId: string, boxId: string, itemId: string): Promise<ClaimResult> {
    try {
      // Vérifier si déjà réclamé aujourd'hui (utilise claimed_date au lieu de created_at)
      const today = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
      const { data: existingClaim } = await this.supabase
        .from('daily_box_claims')
        .select('id')
        .eq('user_id', userId)
        .eq('daily_box_id', boxId)
        .eq('claimed_date', today)
        .maybeSingle()

      if (existingClaim) {
        return {
          success: false,
          error: 'Vous avez déjà réclamé cette freedrop aujourd\'hui',
          error_code: 'ALREADY_CLAIMED'
        }
      }

      // Vérifier si l'item existe dans user_inventory
      const { data: existingInventory } = await this.supabase
        .from('user_inventory')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle()

      if (existingInventory) {
        // Incrémenter la quantité si l'item existe déjà
        const { error: updateError } = await this.supabase
          .from('user_inventory')
          .update({ quantity: existingInventory.quantity + 1 })
          .eq('id', existingInventory.id)

        if (updateError) {
          console.error('Erreur mise à jour inventaire:', updateError)
          return {
            success: false,
            error: 'Erreur lors de la mise à jour de l\'inventaire',
            error_code: 'INVENTORY_ERROR'
          }
        }
      } else {
        // Ajouter l'item à l'inventaire
        const { error: inventoryError } = await this.supabase
          .from('user_inventory')
          .insert({
            user_id: userId,
            item_id: itemId,
            quantity: 1
          })

        if (inventoryError) {
          console.error('Erreur ajout inventaire:', inventoryError)
          return {
            success: false,
            error: 'Erreur lors de l\'ajout à l\'inventaire',
            error_code: 'INVENTORY_ERROR'
          }
        }
      }

      // Enregistrer la réclamation avec la date du jour
      const { error: claimError } = await this.supabase
        .from('daily_box_claims')
        .insert({
          user_id: userId,
          daily_box_id: boxId,
          item_id: itemId,
          claimed_date: today
        })

      if (claimError) {
        console.error('Erreur enregistrement claim:', claimError)
        return {
          success: false,
          error: 'Erreur lors de l\'enregistrement de la réclamation',
          error_code: 'CLAIM_ERROR'
        }
      }

      // Mettre à jour les statistiques utilisateur (XP et level)
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('current_exp, level')
        .eq('id', userId)
        .single()

      if (profile) {
        const xpGain = 10 // XP gagné par freedrop
        const newExp = (profile.current_exp || 0) + xpGain
        const newLevel = Math.floor(newExp / 100) + 1

        await this.supabase
          .from('profiles')
          .update({
            current_exp: newExp % 100,
            level: Math.max(profile.level || 1, newLevel)
          })
          .eq('id', userId)
      }

      return {
        success: true,
        xp_gained: 10
      }
    } catch (error) {
      console.error('Erreur critique claimFreedrop:', error)
      return {
        success: false,
        error: 'Erreur inattendue lors de la réclamation',
        error_code: 'UNEXPECTED_ERROR'
      }
    }
  }

  /**
   * Initialise le profil d'un utilisateur si nécessaire
   */
  async initializeUserProfile(userId: string, email?: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('initialize_user_profile', {
        p_user_id: userId,
        p_email: email
      })

      if (error) {
        console.error('Erreur initialisation profil:', error)
        return false
      }

      return data?.success || false
    } catch (error) {
      console.error('Erreur critique initializeUserProfile:', error)
      return false
    }
  }

  /**
   * Sélectionne un item aléatoire selon les probabilités
   */
  selectRandomItem(items: FreedropItem[]): FreedropItem {
    if (!items.length) {
      throw new Error('Aucun item disponible')
    }

    const totalProbability = items.reduce((sum, item) => sum + item.probability, 0)
    
    if (totalProbability <= 0) {
      return items[0]
    }

    let random = Math.random() * totalProbability
    
    for (const item of items) {
      random -= item.probability
      if (random <= 0) {
        return item
      }
    }
    
    return items[items.length - 1]
  }

  /**
   * Calcule le temps restant jusqu'au reset (minuit)
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
   * Obtient la couleur associée à une rareté
   */
  getRarityColor(rarity: string): string {
    const colors = {
      common: '#10b981',
      uncommon: '#3b82f6',
      rare: '#8b5cf6',
      epic: '#d946ef',
      legendary: '#f59e0b'
    }
    return colors[rarity.toLowerCase() as keyof typeof colors] || colors.common
  }

  /**
   * Obtient la configuration de rareté
   */
  getRarityConfig(rarity: string) {
    const configs = {
      common: { 
        name: 'Common', 
        color: '#10b981',
        gradient: 'from-green-400 to-green-500',
        bgClass: 'bg-green-50 border-green-200'
      },
      uncommon: { 
        name: 'Uncommon', 
        color: '#3b82f6',
        gradient: 'from-blue-400 to-blue-500',
        bgClass: 'bg-blue-50 border-blue-200'
      },
      rare: { 
        name: 'Rare', 
        color: '#8b5cf6',
        gradient: 'from-purple-400 to-purple-500',
        bgClass: 'bg-purple-50 border-purple-200'
      },
      epic: { 
        name: 'Epic', 
        color: '#d946ef',
        gradient: 'from-pink-400 to-purple-500',
        bgClass: 'bg-pink-50 border-pink-200'
      },
      legendary: { 
        name: 'Legendary', 
        color: '#f59e0b',
        gradient: 'from-yellow-400 to-orange-500',
        bgClass: 'bg-yellow-50 border-yellow-200'
      }
    }
    
    return configs[rarity.toLowerCase() as keyof typeof configs] || configs.common
  }
}

// Export d'une instance singleton
export const freedropService = new FreedropService()

// Export de la classe pour tests ou instances multiples
export { FreedropService }