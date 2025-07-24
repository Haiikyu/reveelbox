// lib/boxOpening.ts - Fonctions pour l'ouverture de boîtes

export async function openLootBox(supabase, userId, lootBoxId) {
  try {
    console.log('🎁 Opening loot box:', { userId, lootBoxId })

    // 1. Vérifier que l'utilisateur a assez de coins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('virtual_currency')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

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

    // 3. Vérifier les fonds
    if (profile.virtual_currency < lootBox.price_virtual) {
      throw new Error('Coins insuffisants')
    }

    // 4. Calculer l'objet gagné selon les probabilités
    const wonItem = calculateWonItem(lootBox.loot_box_items)
    if (!wonItem) throw new Error('Erreur lors du calcul des probabilités')

    // 5. Transaction atomique : déduire les coins, ajouter l'objet, enregistrer la transaction
    const { error: transactionError } = await supabase.rpc('process_box_opening', {
      p_user_id: userId,
      p_loot_box_id: lootBoxId,
      p_item_id: wonItem.items.id,
      p_cost: lootBox.price_virtual
    })

    if (transactionError) throw transactionError

    return {
      success: true,
      item: wonItem.items,
      coinsSpent: lootBox.price_virtual,
      newBalance: profile.virtual_currency - lootBox.price_virtual
    }

  } catch (error) {
    console.error('❌ Error opening loot box:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function calculateWonItem(lootBoxItems) {
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
  return items.find(item => random <= item.cumulativeProbability)
}
