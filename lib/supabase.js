// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables Supabase manquantes')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fonctions utilitaires pour l'authentification
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Fonctions pour les profils
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

// Fonctions pour les loot boxes
export const getLootBoxes = async () => {
  const { data, error } = await supabase
    .from('loot_boxes')
    .select('*')
    .eq('is_active', true)
    .order('price_virtual', { ascending: true })
  
  return { data, error }
}

export const getLootBox = async (id) => {
  const { data, error } = await supabase
    .from('loot_boxes')
    .select(`
      *,
      loot_box_items (
        drop_rate,
        items (*)
      )
    `)
    .eq('id', id)
    .single()
  
  return { data, error }
}

// Fonction pour acheter une loot box
export const purchaseLootBox = async (userId, lootBoxId) => {
  // Cette fonction sera appelée depuis une Edge Function pour plus de sécurité
  const { data, error } = await supabase.rpc('purchase_loot_box', {
    p_user_id: userId,
    p_loot_box_id: lootBoxId
  })
  
  return { data, error }
}

// Fonction pour ouvrir une loot box
export const openLootBox = async (userId, lootBoxId) => {
  // Cette fonction sera appelée depuis une Edge Function pour plus de sécurité
  const { data, error } = await supabase.rpc('open_loot_box', {
    p_user_id: userId,
    p_loot_box_id: lootBoxId
  })
  
  return { data, error }
}

// Fonctions pour l'inventaire
export const getUserInventory = async (userId) => {
  const { data, error } = await supabase
    .from('user_inventory')
    .select(`
      *,
      items (*)
    `)
    .eq('user_id', userId)
    .eq('is_on_market', false)
    .order('obtained_at', { ascending: false })
  
  return { data, error }
}

// Fonctions pour les transactions
export const getUserTransactions = async (userId) => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      loot_boxes (*),
      items (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  
  return { data, error }
}

// Fonction pour ajouter de la monnaie virtuelle
export const addVirtualCurrency = async (userId, amount) => {
  const { data: profile } = await getProfile(userId)
  
  if (!profile) {
    return { error: 'Profil non trouvé' }
  }
  
  const newAmount = profile.virtual_currency + amount
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ virtual_currency: newAmount })
    .eq('id', userId)
    .select()
    .single()
  
  // Créer une transaction
  if (!error) {
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'purchase_currency',
        virtual_amount: amount
      })
  }
  
  return { data, error }
}

// Fonctions pour le marché
export const getMarketListings = async () => {
  const { data, error } = await supabase
    .from('market_listings')
    .select(`
      *,
      user_inventory (
        items (*)
      ),
      profiles (username)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const createMarketListing = async (inventoryItemId, price) => {
  const { data, error } = await supabase
    .from('market_listings')
    .insert({
      inventory_item_id: inventoryItemId,
      price
    })
    .select()
    .single()
  
  if (!error) {
    // Marquer l'objet comme étant sur le marché
    await supabase
      .from('user_inventory')
      .update({ is_on_market: true })
      .eq('id', inventoryItemId)
  }
  
  return { data, error }
}