// lib/battle-system-init.js - VERSION CORRIGÉE AVEC NOUVEAU STANDARD

import { createClient } from '@/utils/supabase/client' // ✅ NOUVEAU STANDARD

export class BattleSystemInitializer {
  constructor() {
    this.supabase = createClient() // ✅ UTILISE LE NOUVEAU CLIENT
  }

  // Vérifier si le système est initialisé
  async checkSystemStatus() {
    try {
      const { data: boxes, error: boxError } = await this.supabase
        .from('loot_boxes')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      const { data: items, error: itemError } = await this.supabase
        .from('items')
        .select('id')
        .limit(1)

      const { data: relations, error: relError } = await this.supabase
        .from('loot_box_items')
        .select('id')
        .limit(1)

      return {
        hasBoxes: !boxError && boxes && boxes.length > 0,
        hasItems: !itemError && items && items.length > 0,
        hasRelations: !relError && relations && relations.length > 0,
        isReady: !boxError && !itemError && !relError && 
                 boxes && boxes.length > 0 && 
                 items && items.length > 0 && 
                 relations && relations.length > 0
      }
    } catch (error) {
      console.error('Erreur vérification système:', error)
      return { hasBoxes: false, hasItems: false, hasRelations: false, isReady: false }
    }
  }

  // Initialiser les données de test
  async initializeTestData() {
    try {
      console.log('🚀 Initialisation du système de battles...')

      // 1. Créer les items de test
      console.log('📦 Création des items...')
      const { data: itemsData, error: itemsError } = await this.supabase
        .from('items')
        .upsert([
          // Items Common (Tier 1)
          {
            name: 'Air Force 1 White',
            description: 'Baskets classiques blanches',
            rarity: 'common',
            market_value: 90,
            image_url: 'https://images.stockx.com/images/Nike-Air-Force-1-Low-White-07-Product.jpg'
          },
          {
            name: 'Nike Dunk Low Black',
            description: 'Sneakers urbaines noires',
            rarity: 'common',
            market_value: 100,
            image_url: 'https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg'
          },
          {
            name: 'Adidas Stan Smith',
            description: 'Tennis vintage green',
            rarity: 'common',
            market_value: 80,
            image_url: 'https://images.stockx.com/images/Adidas-Stan-Smith-White-Green-Product.jpg'
          },
          {
            name: 'Vans Old Skool',
            description: 'Skate shoes iconiques',
            rarity: 'common',
            market_value: 75,
            image_url: 'https://images.stockx.com/images/Vans-Old-Skool-Black-White-Product.jpg'
          },

          // Items Rare (Tier 2)
          {
            name: 'Jordan 1 Mid Chicago',
            description: 'Coloris Chicago mythique',
            rarity: 'rare',
            market_value: 200,
            image_url: 'https://images.stockx.com/images/Air-Jordan-1-Mid-Chicago-Toe-Product.jpg'
          },
          {
            name: 'Nike Dunk High Syracuse',
            description: 'Edition université orange',
            rarity: 'rare',
            market_value: 250,
            image_url: 'https://images.stockx.com/images/Nike-Dunk-High-Syracuse-Product.jpg'
          },
          {
            name: 'Yeezy 350 V2 Cream',
            description: 'Kanye West design cream',
            rarity: 'rare',
            market_value: 400,
            image_url: 'https://images.stockx.com/images/adidas-Yeezy-Boost-350-V2-Cream-White-Product.jpg'
          },

          // Items Epic (Tier 3)
          {
            name: 'Off-White x Nike Blazer',
            description: 'Virgil Abloh collaboration',
            rarity: 'epic',
            market_value: 900,
            image_url: 'https://images.stockx.com/images/Nike-Blazer-Mid-Off-White-All-Hallows-Eve-Product.jpg'
          },
          {
            name: 'Travis Scott Jordan 1 Low',
            description: 'Artist collaboration brown',
            rarity: 'epic',
            market_value: 1400,
            image_url: 'https://images.stockx.com/images/Air-Jordan-1-Low-Travis-Scott-Product.jpg'
          },

          // Items Legendary (Tier 4)
          {
            name: 'Jordan 1 Chicago 1985',
            description: 'Vintage original release',
            rarity: 'legendary',
            market_value: 6000,
            image_url: 'https://images.stockx.com/images/Air-Jordan-1-Retro-Chicago-1985-Product.jpg'
          }
        ], { 
          onConflict: 'name',
          ignoreDuplicates: true 
        })
        .select()

      if (itemsError) {
        console.error('Erreur création items:', itemsError)
        throw itemsError
      }

      console.log(`✅ ${itemsData?.length || 0} items créés`)

      // 2. Créer les loot boxes
      console.log('🎁 Création des loot boxes...')
      const { data: boxesData, error: boxesError } = await this.supabase
        .from('loot_boxes')
        .upsert([
          {
            name: 'STARTER SNEAKER BOX',
            description: 'Parfait pour débuter votre collection de sneakers.',
            price_virtual: 100,
            price_real: 4.99,
            rarity: 'common',
            category: 'sneakers',
            is_active: true,
            image_url: 'https://i.imgur.com/starter-box.png'
          },
          {
            name: 'STREET CULTURE BOX',
            description: 'Sneakers urbaines et tendances pour les passionnés de streetwear.',
            price_virtual: 200,
            price_real: 9.99,
            rarity: 'rare',
            category: 'streetwear',
            is_active: true,
            image_url: 'https://i.imgur.com/street-box.png'
          },
          {
            name: 'HYPE BEAST BOX',
            description: 'Les collaborations les plus recherchées et limitées du marché.',
            price_virtual: 500,
            price_real: 24.99,
            rarity: 'epic',
            category: 'collaborations',
            is_active: true,
            image_url: 'https://i.imgur.com/hype-box.png'
          }
        ], { 
          onConflict: 'name',
          ignoreDuplicates: true 
        })
        .select()

      if (boxesError) {
        console.error('Erreur création boxes:', boxesError)
        throw boxesError
      }

      console.log(`✅ ${boxesData?.length || 0} loot boxes créées`)

      console.log('🎉 Système de battles initialisé avec succès !')
      return true

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error)
      throw error
    }
  }

  // Fonction principale d'initialisation
  async initialize() {
    try {
      console.log('🔍 Vérification du système...')
      const status = await this.checkSystemStatus()
      
      if (status.isReady) {
        console.log('✅ Système déjà initialisé !')
        return true
      }

      console.log('⚠️ Système non initialisé, création des données...')
      console.log('Status:', status)

      await this.initializeTestData()
      return true
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error)
      return false
    }
  }
}

// Export pour utilisation
export default BattleSystemInitializer