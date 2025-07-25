// lib/boxOpening.ts - Fonctions pour l'ouverture de boîtes

import { SupabaseClient } from '@supabase/supabase-js'

// Types pour la sécurité TypeScript
interface Profile {
  virtual_currency: number
}

interface Item {
  id: string
  name: string
  rarity: string
  image_url: string
  market_value: number
  description?: string
}

interface LootBoxItem {
  probability: number
  items: Item
  cumulativeProbability?: number
}

// Type pour les données brutes de Supabase
interface SupabaseLootBox {
  id: string
  name: string
  price_virtual: number
  is_active: boolean
  loot_box_items: LootBoxItemData[]
}

// Type pour les items dans la structure Supabase
interface LootBoxItemData {
  probability: number
  items: {
    id: string
    name: string
    rarity: string
    image_url: string
    market_value: number
    description?: string
  }
  cumulativeProbability?: number
}

interface OpeningResult {
  success: boolean
  item?: Item
  coinsSpent?: number
  newBalance?: number
  error?: string
}

export async function openLootBox(
  supabase: SupabaseClient, 
  userId: string, 
  lootBoxId: string
): Promise<OpeningResult> {
  try {
    console.log('🎁 Opening loot box:', { userId, lootBoxId })

    // 1. Vérifier que l'utilisateur a assez de coins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('virtual_currency')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError
    if (!profile) throw new Error('Profil utilisateur non trouvé')

    const userProfile = profile as Profile

    // 2. Récupérer la boîte et son prix
    const { data: lootBox, error: boxError } = await supabase
      .from('loot_boxes')
      .select(`
        *,
        loot_box_items (
          probability,
          items (
            id,
            name,
            rarity,
            image_url,
            market_value,
            description
          )
        )
      `)
      .eq('id', lootBoxId)
      .eq('is_active', true)
      .single()

    if (boxError) throw boxError
    if (!lootBox) throw new Error('Boîte non trouvée ou inactive')

    // ✅ CORRECTION - Casting direct avec la vraie structure Supabase
    const lootBoxData = lootBox as any

    // 3. Vérifier les fonds
    if (userProfile.virtual_currency < lootBoxData.price_virtual) {
      throw new Error('Coins insuffisants')
    }

    // 4. Calculer l'objet gagné selon les probabilités
    const wonItem = calculateWonItem(lootBoxData.loot_box_items)
    if (!wonItem) throw new Error('Erreur lors du calcul des probabilités')

    // 5. Transaction atomique : déduire les coins, ajouter l'objet, enregistrer la transaction
    const { error: transactionError } = await supabase.rpc('process_box_opening', {
      p_user_id: userId,
      p_loot_box_id: lootBoxId,
      p_item_id: wonItem.items.id,
      p_cost: lootBoxData.price_virtual
    })

    if (transactionError) throw transactionError

    return {
      success: true,
      item: wonItem.items,
      coinsSpent: lootBoxData.price_virtual,
      newBalance: userProfile.virtual_currency - lootBoxData.price_virtual
    }

  } catch (error) {
    console.error('❌ Error opening loot box:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

function calculateWonItem(lootBoxItems: any[]): any {
  if (!lootBoxItems || lootBoxItems.length === 0) return null
  
  // Créer un tableau avec les probabilités cumulées
  let cumulativeProbability = 0
  const items = lootBoxItems.map(item => {
    cumulativeProbability += item.probability
    return {
      ...item,
      cumulativeProbability
    }
  })

  // Générer un nombre aléatoire entre 0 et 100
  const random = Math.random() * 100
  
  // Trouver l'objet correspondant
  return items.find(item => random <= (item.cumulativeProbability || 0))
}

// Fonction de simulation pour les tests (sans déduire les coins)
export async function simulateLootBoxOpening(
  supabase: SupabaseClient, 
  lootBoxId: string
): Promise<Item | null> {
  try {
    // Récupérer la boîte et ses items
    const { data: lootBox, error: boxError } = await supabase
      .from('loot_boxes')
      .select(`
        loot_box_items (
          probability,
          items (
            id,
            name,
            rarity,
            image_url,
            market_value,
            description
          )
        )
      `)
      .eq('id', lootBoxId)
      .single()

    if (boxError || !lootBox) return null

    // ✅ CORRECTION - Casting direct avec la vraie structure
    const lootBoxData = lootBox as any
    const wonItem = calculateWonItem(lootBoxData.loot_box_items)
    
    return wonItem?.items || null
  } catch (error) {
    console.error('❌ Error simulating loot box:', error)
    return null
  }
}

// Fonction pour calculer la valeur attendue d'une boîte
export function calculateExpectedValue(lootBoxItems: any[]): number {
  if (!lootBoxItems || lootBoxItems.length === 0) return 0
  
  return lootBoxItems.reduce((total, item) => {
    return total + ((item.items?.market_value || 0) * (item.probability / 100))
  }, 0)
}

// Fonction pour obtenir la distribution des raretés
export function getRarityDistribution(lootBoxItems: any[]): Record<string, number> {
  const distribution: Record<string, number> = {}
  
  if (!lootBoxItems || lootBoxItems.length === 0) return distribution
  
  lootBoxItems.forEach(item => {
    const rarity = item.items?.rarity || 'unknown'
    distribution[rarity] = (distribution[rarity] || 0) + item.probability
  })
  
  return distribution
}