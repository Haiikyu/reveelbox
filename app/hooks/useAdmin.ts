import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/database';

// Types basés sur votre vraie structure de base de données
export type LootBox = Database['public']['Tables']['loot_boxes']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  // Extensions pour compatibilité
  coins_balance?: number;
  level?: number;
};
export type BoxItem = Database['public']['Tables']['loot_box_items']['Row'] & {
  items?: Item | null;
};
export type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  profiles?: { username?: string | null; email?: string | null } | null;
};

export type BoxForm = {
  name: string;
  description: string;
  image_url: string;
  banner_url?: string;
  price_virtual: string;
  is_active: boolean;
  is_daily_free: boolean;
  is_featured: boolean;
  required_level: string;
};

export type ItemForm = {
  name: string;
  description: string;
  image_url: string;
  market_value: string;
  rarity: string;
};

export type BoxItemForm = {
  item_id: string;
  probability: string;
  display_order: string;
};

export type Toast = {
  message: string;
  type: 'success' | 'error' | 'info';
};

// Supabase client avec les vraies clés
const supabase = createClient<Database>(
  'https://pkweofbyzygbbkervpbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrd2VvZmJ5enlnYmJrZXJ2cGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjQ1NTEsImV4cCI6MjA2ODM0MDU1MX0.ZiNODQ7cHX5QJmlvneEtu24LYmTUmtL3mxrT9qEbTI8'
);

// Utility functions
const formatPrice = (price: number | null | undefined): string => {
  if (!price) return '0,00';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const useAdmin = () => {
  // State management
  const [boxes, setBoxes] = useState<LootBox[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  
  // Utility functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleError = (error: any, context: string = '') => {
    console.error(`Error ${context}:`, error);
    const message = error.message || 'Une erreur est survenue';
    showToast(message, 'error');
  };

  // Load all data from Supabase avec gestion d'erreur améliorée
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Chargement des données admin...');

      // Load boxes avec tri par prix décroissant
      const { data: boxesData, error: boxesError } = await supabase
        .from('loot_boxes')
        .select('*')
        .order('price_virtual', { ascending: false })
        .order('created_at', { ascending: false });

      if (boxesError) {
        console.error('Erreur boxes:', boxesError);
        showToast('Impossible de charger les boxes', 'error');
      } else {
        console.log('Boxes chargées:', boxesData?.length || 0);
        setBoxes(boxesData || []);
      }

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('market_value', { ascending: false })
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Erreur items:', itemsError);
        showToast('Impossible de charger les items', 'error');
      } else {
        console.log('Items chargés:', itemsData?.length || 0);
        setItems(itemsData || []);
      }

      // Load box items with item details et tri par display_order
      const { data: boxItemsData, error: boxItemsError } = await supabase
        .from('loot_box_items')
        .select(`
          *,
          items(*)
        `)
        .order('display_order', { ascending: true });

      if (boxItemsError) {
        console.error('Erreur box items:', boxItemsError);
      } else {
        const safeBoxItems = (boxItemsData || []).map(item => ({
          ...item,
          items: item.items || null
        }));
        console.log('Box items chargés:', safeBoxItems.length);
        setBoxItems(safeBoxItems);
      }

      // Load users (profiles) avec les VRAIES colonnes de votre DB
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          email,
          virtual_currency,
          total_exp,
          loyalty_points,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (usersError) {
        console.error('Erreur users:', usersError);
        showToast('Impossible de charger les utilisateurs', 'error');
      } else {
        // Mapper les données avec les vraies colonnes - CORRIGÉ
        const mappedUsers: Profile[] = (usersData || []).map((user: any) => {
          // Calculer le niveau depuis total_exp (100 XP = 1 niveau)
          const level = Math.floor((user?.total_exp || 0) / 100) + 1;
          
          return {
            ...user,
            coins_balance: user?.virtual_currency || 0, // Mapping pour compatibilité
            level: level,
            loyalty_points: user?.loyalty_points || 0,
            username: user?.username || 'Utilisateur',
            email: user?.email || null
          } as Profile;
        });
        console.log('Users chargés:', mappedUsers.length);
        setUsers(mappedUsers);
      }

      // Load transactions - SEULEMENT les transactions en euros
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles!user_id(username, email)
        `)
        .not('amount', 'is', null)
        .gt('amount', 0)
        .in('type', ['purchase', 'purchase_box', 'refund'])
        .order('created_at', { ascending: false })
        .limit(200);

      if (transactionsError) {
        console.error('Erreur transactions:', transactionsError);
        showToast('Impossible de charger les transactions', 'error');
      } else {
        const safeTransactions = (transactionsData || []).map(transaction => ({
          ...transaction,
          profiles: transaction.profiles || null
        }));
        console.log('Transactions chargées:', safeTransactions.length);
        setTransactions(safeTransactions);
      }

      // Calculate stats avec données réelles et debug
      const realStats = {
        boxes: boxesData?.length || 0,
        items: itemsData?.length || 0,
        users: usersData?.length || 0,
        transactions: transactionsData?.length || 0,
        activeBoxes: boxesData?.filter(b => b.is_active === true).length || 0,
        featuredBoxes: boxesData?.filter(b => b.is_featured === true).length || 0,
        totalRevenue: transactionsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        totalCoins: usersData?.reduce((sum, u) => sum + (u.virtual_currency || 0), 0) || 0
      };
      
      console.log('Statistiques calculées:', realStats);
      setStats(realStats);

    } catch (error) {
      console.error('Erreur générale lors du chargement:', error);
      handleError(error, 'loading data');
    }
    setLoading(false);
  };

  // CRUD Operations avec gestion d'erreur améliorée
  const createBox = async (boxForm: BoxForm): Promise<{ success: boolean; data?: LootBox; error?: { message: string } }> => {
    try {
      // Préparer les données à insérer
      const boxData = {
        name: boxForm.name.trim(),
        description: boxForm.description?.trim() || null,
        image_url: boxForm.image_url.trim(),
        banner_url: boxForm.banner_url?.trim() || null,
        price_virtual: parseInt(boxForm.price_virtual) || 100,
        is_active: boxForm.is_active,
        is_daily_free: boxForm.is_daily_free,
        is_featured: boxForm.is_featured,
        required_level: boxForm.is_daily_free ? parseInt(boxForm.required_level) || 1 : null,
      };

      // Insertion dans Supabase
      const { data, error } = await supabase
        .from('loot_boxes')
        .insert([boxData])
        .select()
        .single();

      if (error) throw error;

      // Actualiser les données et afficher un toast
      await loadData();
      showToast('Box créée avec succès');

      return { success: true, data };
    } catch (err: any) {
      handleError(err, 'creating box');
      // Toujours retourner un objet error avec message
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  // FONCTION UPDATEBOX MANQUANTE - AJOUTÉE ICI
  const updateBox = async (
    boxId: string,
    boxForm: BoxForm
  ): Promise<{ success: boolean; data?: LootBox; error?: { message: string } }> => {
    try {
      // Préparer les données à mettre à jour
      const boxData = {
        name: boxForm.name.trim(),
        description: boxForm.description?.trim() || null,
        image_url: boxForm.image_url.trim(),
        banner_url: boxForm.banner_url?.trim() || null,
        price_virtual: parseInt(boxForm.price_virtual) || 100,
        is_active: boxForm.is_active,
        is_daily_free: boxForm.is_daily_free,
        is_featured: boxForm.is_featured,
        required_level: boxForm.is_daily_free ? parseInt(boxForm.required_level) || 1 : null,
        updated_at: new Date().toISOString()
      };

      // Mise à jour dans Supabase
      const { data, error } = await supabase
        .from('loot_boxes')
        .update(boxData)
        .eq('id', boxId)
        .select()
        .single();

      if (error) throw error;

      // Actualiser les données et afficher un toast
      await loadData();
      showToast('Box mise à jour avec succès');

      return { success: true, data };
    } catch (err: any) {
      handleError(err, 'updating box');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const deleteBox = async (boxId: string): Promise<{ success: boolean; error?: { message: string } }> => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette box ?')) return { success: false };

    try {
      const { error } = await supabase
        .from('loot_boxes')
        .delete()
        .eq('id', boxId);

      if (error) throw error;

      await loadData();
      showToast('Box supprimée avec succès');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'deleting box');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const createItem = async (itemForm: ItemForm): Promise<{ success: boolean; error?: { message: string } }> => {
    try {
      const itemData = {
        name: itemForm.name.trim(),
        description: itemForm.description?.trim() || null,
        image_url: itemForm.image_url.trim(),
        market_value: parseFloat(itemForm.market_value) || 10,
        rarity: itemForm.rarity
      };

      const { error } = await supabase
        .from('items')
        .insert([itemData]);

      if (error) throw error;

      await loadData();
      showToast('Item créé avec succès');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'creating item');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const updateItem = async (
    itemId: string,
    itemForm: ItemForm
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    try {
      const itemData = {
        name: itemForm.name.trim(),
        description: itemForm.description?.trim() || null,
        image_url: itemForm.image_url.trim(),
        market_value: parseFloat(itemForm.market_value) || 10,
        rarity: itemForm.rarity
      };

      const { error } = await supabase
        .from('items')
        .update(itemData)
        .eq('id', itemId);

      if (error) throw error;

      await loadData();
      showToast('Item mis à jour avec succès');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'updating item');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const deleteItem = async (itemId: string): Promise<{ success: boolean; error?: { message: string } }> => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) {
      return { success: false };
    }

    try {
      // Vérifier si l'item est utilisé dans loot_box_items
      const { data: boxItemsUsingThis, error: checkError } = await supabase
        .from('loot_box_items')
        .select('id, loot_box_id')
        .eq('item_id', itemId);

      if (checkError) throw checkError;

      if (boxItemsUsingThis && boxItemsUsingThis.length > 0) {
        const { error: deleteBoxItemsError } = await supabase
          .from('loot_box_items')
          .delete()
          .eq('item_id', itemId);

        if (deleteBoxItemsError) throw deleteBoxItemsError;
      }

      // Vérifier et supprimer les références dans user_inventory
      const { data: inventoryItems, error: inventoryCheckError } = await supabase
        .from('user_inventory')
        .select('id')
        .eq('item_id', itemId);

      if (!inventoryCheckError && inventoryItems && inventoryItems.length > 0) {
        const { error: deleteInventoryError } = await supabase
          .from('user_inventory')
          .delete()
          .eq('item_id', itemId);

        if (deleteInventoryError) {
          console.warn('Suppression partielle : erreur inventaire', deleteInventoryError);
          // On continue quand même, pas bloquant
        }
      }

      // Supprimer l'item lui-même
      const { error: deleteItemError } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (deleteItemError) throw deleteItemError;

      await loadData();
      showToast('Item supprimé avec succès (ainsi que ses références)');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'deleting item');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const addItemToBox = async (
    boxId: string,
    boxItemForm: BoxItemForm
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    try {
      const probability = parseFloat(boxItemForm.probability);
      const display_order = parseInt(boxItemForm.display_order) || 1;

      const boxItemData = {
        loot_box_id: boxId,
        item_id: boxItemForm.item_id,
        probability,
        display_order
      };

      const { error } = await supabase
        .from('loot_box_items')
        .insert([boxItemData]);

      if (error) throw error;

      await loadData();
      showToast('Item ajouté à la box');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'adding item to box');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const updateBoxItemProbability = async (
    boxItemId: string,
    newProbability: number
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    try {
      const { error } = await supabase
        .from('loot_box_items')
        .update({ probability: newProbability })
        .eq('id', boxItemId);

      if (error) throw error;

      await loadData();
      showToast('Probabilité mise à jour');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'updating probability');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const deleteBoxItem = async (
    boxItemId: string
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cet item de la box ?')) {
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('loot_box_items')
        .delete()
        .eq('id', boxItemId);

      if (error) throw error;

      await loadData();
      showToast('Item retiré de la box');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'deleting box item');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const updateItemOrder = async (
    boxId: string,
    newOrder: BoxItem[]
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    try {
      // Mettre à jour l'ordre des items (batch)
      const updates = newOrder.map((item, index) =>
        supabase
          .from('loot_box_items')
          .update({ display_order: index + 1 })
          .eq('id', item.id)
      );

      // Exécuter toutes les mises à jour
      const results = await Promise.allSettled(updates);

      // Vérifier si certaines requêtes ont échoué
      const errors = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      if (errors.length > 0) {
        console.error('Erreurs dans updateItemOrder:', errors);
        throw new Error(errors[0].reason?.message || "Erreur lors de la mise à jour de l'ordre");
      }

      // Recharger les données pour refléter les changements
      await loadData();
      showToast('Ordre des items mis à jour');
      return { success: true };
    } catch (err: any) {
      handleError(err, 'updating item order');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  const exportData = async (
    type: string
  ): Promise<{ success: boolean; error?: { message: string } }> => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'boxes':
          data = boxes.map(box => ({
            ...box,
            items_count: getBoxItems(box.id).length,
            opening_count: getBoxOpeningCount(box.id),
            total_drop_rate: getTotalDropRate(box.id)
          }));
          filename = 'loot_boxes.json';
          break;
        case 'items':
          data = items.map(item => ({
            ...item,
            used_in_boxes: boxItems.filter(bi => bi.item_id === item.id).length
          }));
          filename = 'items.json';
          break;
        case 'users':
          data = users.map(user => ({
            id: user.id,
            username: user.username,
            coins_balance: user.coins_balance,
            level: user.level,
            loyalty_points: user.loyalty_points,
            created_at: user.created_at,
            updated_at: user.updated_at
          }));
          filename = 'users.json';
          break;
        case 'transactions':
          data = transactions.map(transaction => ({
            ...transaction,
            username: transaction.profiles?.username
          }));
          filename = 'transactions.json';
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Export ${type} terminé`);
      return { success: true };
    } catch (err: any) {
      handleError(err, 'exporting data');
      return { success: false, error: { message: err?.message || 'Erreur inconnue' } };
    }
  };

  // Utility functions
  const getBoxItems = (boxId: string): BoxItem[] => {
    return boxItems
      .filter(bi => bi.loot_box_id === boxId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  const getTotalDropRate = (boxId: string): number => {
    return boxItems
      .filter(bi => bi.loot_box_id === boxId)
      .reduce((total, bi) => total + (parseFloat(bi.probability?.toString() || '0') || 0), 0);
  };

  // Nouvelle fonction pour compter les ouvertures par box
  const getBoxOpeningCount = (boxId: string): number => {
    return transactions.filter(t => 
      (t.type === 'box_opening' || t.type === 'purchase_box') && 
      t.loot_box_id === boxId
    ).length;
  };

  // Load data on hook initialization
  useEffect(() => {
    loadData();
  }, []);

  return {
    // Data
    boxes,
    items,
    boxItems,
    users,
    transactions,
    loading,
    stats,
    toast,
    setToast,

    // Functions
    loadData,
    createBox,
    updateBox, // ← FONCTION AJOUTÉE
    deleteBox,
    createItem,
    updateItem,
    deleteItem,
    addItemToBox,
    updateBoxItemProbability,
    deleteBoxItem,
    updateItemOrder,
    exportData,
    getBoxItems,
    getTotalDropRate,
    getBoxOpeningCount,
    showToast,
    handleError,
    
    // Utilities
    formatPrice,
    formatDate
  };
};