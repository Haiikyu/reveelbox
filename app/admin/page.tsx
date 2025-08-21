'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Package, Image, Percent, Save, X, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/components/AuthProvider';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// Types TypeScript basés sur votre schéma Supabase
interface LootBox {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  price_real?: number;
  price_virtual?: number;
  is_active: boolean;
  created_at: string;
  items_count?: number;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  value: number;
  rarity: string;
  created_at: string;
}

interface LootBoxItem {
  id: string;
  loot_box_id: string;
  item_id: string;
  drop_rate: number; // Pourcentage de chance
  items?: Item; // Jointure avec la table items
}

// Composants UI réutilisables
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, loading, className = '' }) => {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} ${sizes[size]} 
        rounded-lg font-medium transition-colors duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2 ${className}
      `}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, error, min, max }) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className={`
        w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500
        ${error ? 'border-red-300' : 'border-gray-300'}
      `}
    />
    {error && (
      <p className="text-red-600 text-sm flex items-center gap-1">
        <AlertCircle size={16} />
        {error}
      </p>
    )}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <Button variant="secondary" size="sm" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Composant principal de la page admin
const AdminPage = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // États principaux
  const [activeTab, setActiveTab] = useState('boxes');
  const [boxes, setBoxes] = useState<LootBox[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [boxItems, setBoxItems] = useState<LootBoxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // États pour les modals
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showBoxItemsModal, setShowBoxItemsModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<LootBox | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // États pour les formulaires
  const [boxForm, setBoxForm] = useState({
    name: '',
    description: '',
    image_url: '',
    price_virtual: 100,
    is_active: true
  });
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    image_url: '',
    value: 10,
    rarity: 'common'
  });
  const [boxItemForm, setBoxItemForm] = useState({
    item_id: '',
    drop_rate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Protection d'accès - seuls les admins peuvent accéder
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Vérifier si l'utilisateur est admin (ajustez selon votre logique)
    if (user && user.email !== 'admin@reveelbox.com') {
      console.warn('Accès admin refusé');
      router.push('/');
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Chargement des données
  useEffect(() => {
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadBoxes(),
        loadItems(),
        loadBoxItems()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions de chargement des données
  const loadBoxes = async () => {
    const { data, error } = await supabase
      .from('loot_boxes')
      .select(`
        id,
        name,
        description,
        image_url,
        price_virtual,
        price_real,
        is_active,
        created_at,
        loot_box_items(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement boxes:', error);
      return;
    }

    // Ajouter le count des items
    const boxesWithCount = data.map(box => ({
      ...box,
      items_count: box.loot_box_items?.[0]?.count || 0
    }));

    setBoxes(boxesWithCount);
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement items:', error);
      return;
    }

    setItems(data || []);
  };

  const loadBoxItems = async () => {
    const { data, error } = await supabase
      .from('loot_box_items')
      .select(`
        id,
        loot_box_id,
        item_id,
        drop_rate,
        items (
          id,
          name,
          image_url,
          value,
          rarity
        )
      `);

    if (error) {
      console.error('Erreur chargement box items:', error);
      return;
    }

    setBoxItems(data || []);
  };

  // Fonctions de validation
  const validateBoxForm = () => {
    const newErrors: Record<string, string> = {};
    if (!boxForm.name.trim()) newErrors.name = 'Le nom est requis';
    if (!boxForm.image_url.trim()) newErrors.image_url = 'L\'image est requise';
    if (!boxForm.price_virtual || boxForm.price_virtual <= 0) newErrors.price_virtual = 'Le prix doit être supérieur à 0';
    return newErrors;
  };
  
  const validateItemForm = () => {
    const newErrors: Record<string, string> = {};
    if (!itemForm.name.trim()) newErrors.name = 'Le nom est requis';
    if (!itemForm.image_url.trim()) newErrors.image_url = 'L\'image est requise';
    if (!itemForm.value || itemForm.value <= 0) newErrors.value = 'La valeur doit être supérieure à 0';
    return newErrors;
  };
  
  const validateBoxItemForm = () => {
    const newErrors: Record<string, string> = {};
    if (!boxItemForm.item_id) newErrors.item_id = 'Sélectionnez un item';
    const dropRate = parseFloat(boxItemForm.drop_rate);
    if (!boxItemForm.drop_rate || dropRate <= 0 || dropRate > 100) {
      newErrors.drop_rate = 'Le pourcentage doit être entre 0.01 et 100';
    }
    return newErrors;
  };
  
  // Fonctions CRUD pour les boxes
  const handleCreateBox = async () => {
    const validationErrors = validateBoxForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('loot_boxes')
        .insert([boxForm])
        .select()
        .single();

      if (error) {
        console.error('Erreur création box:', error);
        setErrors({ general: 'Erreur lors de la création de la box' });
        return;
      }

      await loadBoxes(); // Recharger la liste
      setBoxForm({ name: '', description: '', image_url: '', price_virtual: 100, is_active: true });
      setShowBoxModal(false);
      setErrors({});
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ general: 'Erreur lors de la création' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditBox = (box: LootBox) => {
    setSelectedBox(box);
    setBoxForm({
      name: box.name,
      description: box.description || '',
      image_url: box.image_url,
      price_virtual: box.price_virtual || 100,
      is_active: box.is_active
    });
    setShowBoxModal(true);
  };
  
  const handleUpdateBox = async () => {
    if (!selectedBox) return;
    
    const validationErrors = validateBoxForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('loot_boxes')
        .update(boxForm)
        .eq('id', selectedBox.id);

      if (error) {
        console.error('Erreur mise à jour box:', error);
        setErrors({ general: 'Erreur lors de la mise à jour' });
        return;
      }

      await loadBoxes();
      setSelectedBox(null);
      setBoxForm({ name: '', description: '', image_url: '', price_virtual: 100, is_active: true });
      setShowBoxModal(false);
      setErrors({});
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ general: 'Erreur lors de la mise à jour' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteBox = async (boxId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette box ? Tous les items associés seront également supprimés.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('loot_boxes')
        .delete()
        .eq('id', boxId);

      if (error) {
        console.error('Erreur suppression box:', error);
        return;
      }

      await loadData(); // Recharger toutes les données
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  // Fonctions CRUD pour les items
  const handleCreateItem = async () => {
    const validationErrors = validateItemForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('items')
        .insert([itemForm]);

      if (error) {
        console.error('Erreur création item:', error);
        setErrors({ general: 'Erreur lors de la création de l\'item' });
        return;
      }

      await loadItems();
      setItemForm({ name: '', description: '', image_url: '', value: 10, rarity: 'common' });
      setShowItemModal(false);
      setErrors({});
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ general: 'Erreur lors de la création' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      image_url: item.image_url,
      value: item.value,
      rarity: item.rarity
    });
    setShowItemModal(true);
  };
  
  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    
    const validationErrors = validateItemForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('items')
        .update(itemForm)
        .eq('id', selectedItem.id);

      if (error) {
        console.error('Erreur mise à jour item:', error);
        setErrors({ general: 'Erreur lors de la mise à jour' });
        return;
      }

      await loadItems();
      setSelectedItem(null);
      setItemForm({ name: '', description: '', image_url: '', value: 10, rarity: 'common' });
      setShowItemModal(false);
      setErrors({});
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ general: 'Erreur lors de la mise à jour' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet item ? Il sera retiré de toutes les boxes.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Erreur suppression item:', error);
        return;
      }

      await loadData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  // Fonctions pour gérer les items d'une box
  const getBoxItems = (boxId: string) => {
    return boxItems.filter(bi => bi.loot_box_id === boxId);
  };
  
  const getTotalDropRate = (boxId: string) => {
    return boxItems
      .filter(bi => bi.loot_box_id === boxId)
      .reduce((total, bi) => total + bi.drop_rate, 0);
  };
  
  const handleAddBoxItem = async () => {
    if (!selectedBox) return;
    
    const validationErrors = validateBoxItemForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const currentTotal = getTotalDropRate(selectedBox.id);
    const newDropRate = parseFloat(boxItemForm.drop_rate);
    
    if (currentTotal + newDropRate > 100) {
      setErrors({ drop_rate: `Le total des pourcentages dépasserait 100% (actuellement ${currentTotal.toFixed(2)}%)` });
      return;
    }
    
    // Vérifier si l'item n'est pas déjà dans la box
    const existingItem = boxItems.find(bi => 
      bi.loot_box_id === selectedBox.id && bi.item_id === boxItemForm.item_id
    );
    
    if (existingItem) {
      setErrors({ item_id: 'Cet item est déjà dans la box' });
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('loot_box_items')
        .insert([{
          loot_box_id: selectedBox.id,
          item_id: boxItemForm.item_id,
          drop_rate: newDropRate
        }]);

      if (error) {
        console.error('Erreur ajout box item:', error);
        setErrors({ general: 'Erreur lors de l\'ajout de l\'item' });
        return;
      }

      await loadData();
      setBoxItemForm({ item_id: '', drop_rate: '' });
      setErrors({});
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ general: 'Erreur lors de l\'ajout' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteBoxItem = async (boxItemId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cet item de la box ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('loot_box_items')
        .delete()
        .eq('id', boxItemId);

      if (error) {
        console.error('Erreur suppression box item:', error);
        return;
      }

      await loadData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // États de chargement
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de l'administration...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirection gérée par useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Administration ReveelBox</h1>
          <p className="mt-2 text-gray-600">Gérez vos loot boxes et leurs contenus</p>
        </div>
      </div>

      {/* Layout avec sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 shrink-0"
          >
            <Card className="p-4">
              <nav className="space-y-2">
                {[
                  { id: 'boxes', label: 'Gestion des Boxes', icon: Package },
                  { id: 'items', label: 'Catalogue d\'Items', icon: Image },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                        ${activeTab === tab.id 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </motion.div>

          {/* Contenu principal */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Section Boxes */}
              {activeTab === 'boxes' && (
                <motion.div
                  key="boxes"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Header avec bouton d'ajout */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900">Gestion des Loot Boxes</h2>
                    <Button onClick={() => setShowBoxModal(true)}>
                      <Plus size={20} />
                      Nouvelle Box
                    </Button>
                  </div>

                  {/* Liste des boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boxes.map((box, index) => (
                      <motion.div
                        key={box.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-video bg-gray-100 relative overflow-hidden">
                            <img 
                              src={box.image_url} 
                              alt={box.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">{box.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                box.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {box.is_active ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{box.description}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>{box.items_count} items</span>
                              <span>{box.price_virtual} coins</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedBox(box);
                                  setShowBoxItemsModal(true);
                                }}
                                className="flex-1"
                              >
                                <Package size={16} />
                                Gérer Items
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => handleEditBox(box)}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDeleteBox(box.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Section Items */}
              {activeTab === 'items' && (
                <motion.div
                  key="items"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Header avec bouton d'ajout */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900">Catalogue d'Items</h2>
                    <Button onClick={() => setShowItemModal(true)}>
                      <Plus size={20} />
                      Nouvel Item
                    </Button>
                  </div>

                  {/* Liste des items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gray-100 relative overflow-hidden">
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-gray-900 mb-1 truncate">{item.name}</h3>
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                              <span>{item.value}€</span>
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                                item.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                                item.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.rarity}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => handleEditItem(item)}
                                className="flex-1"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                className="flex-1"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal Création/Edition Box */}
      <Modal
        isOpen={showBoxModal}
        onClose={() => {
          setShowBoxModal(false);
          setSelectedBox(null);
          setBoxForm({ name: '', description: '', image_url: '', price_virtual: 100, is_active: true });
          setErrors({});
        }}
        title={selectedBox ? 'Modifier la Box' : 'Nouvelle Box'}
      >
        <div className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}
          
          <Input
            label="Nom de la box *"
            value={boxForm.name}
            onChange={(e) => setBoxForm({...boxForm, name: e.target.value})}
            placeholder="Ex: Tech Mystery Box"
            error={errors.name}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={boxForm.description}
              onChange={(e) => setBoxForm({...boxForm, description: e.target.value})}
              placeholder="Description de la box..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <Input
            label="URL de l'image *"
            value={boxForm.image_url}
            onChange={(e) => setBoxForm({...boxForm, image_url: e.target.value})}
            placeholder="https://exemple.com/image.jpg"
            error={errors.image_url}
          />
          
          <Input
            label="Prix en coins virtuels *"
            type="number"
            min="1"
            value={boxForm.price_virtual}
            onChange={(e) => setBoxForm({...boxForm, price_virtual: parseInt(e.target.value)})}
            placeholder="100"
            error={errors.price_virtual}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Statut</label>
            <select
              value={boxForm.is_active.toString()}
              onChange={(e) => setBoxForm({...boxForm, is_active: e.target.value === 'true'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>
          
          {boxForm.image_url && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Aperçu :</label>
              <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={boxForm.image_url} 
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM4IDEyIDQgOCA4IDRTMTYgMCAxMiA0IDggOCAxMiAxMloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={selectedBox ? handleUpdateBox : handleCreateBox}
              loading={submitting}
              className="flex-1"
            >
              <Save size={16} />
              {selectedBox ? 'Mettre à jour' : 'Créer la Box'}
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                setShowBoxModal(false);
                setSelectedBox(null);
                setBoxForm({ name: '', description: '', image_url: '', price_virtual: 100, is_active: true });
                setErrors({});
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Création/Edition Item */}
      <Modal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setSelectedItem(null);
          setItemForm({ name: '', description: '', image_url: '', value: 10, rarity: 'common' });
          setErrors({});
        }}
        title={selectedItem ? 'Modifier l\'Item' : 'Nouvel Item'}
      >
        <div className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}
          
          <Input
            label="Nom de l'item *"
            value={itemForm.name}
            onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
            placeholder="Ex: Casque Gaming RGB"
            error={errors.name}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={itemForm.description}
              onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
              placeholder="Description de l'item..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <Input
            label="URL de l'image *"
            value={itemForm.image_url}
            onChange={(e) => setItemForm({...itemForm, image_url: e.target.value})}
            placeholder="https://exemple.com/image.jpg"
            error={errors.image_url}
          />
          
          <Input
            label="Valeur en euros *"
            type="number"
            min="0.01"
            step="0.01"
            value={itemForm.value}
            onChange={(e) => setItemForm({...itemForm, value: parseFloat(e.target.value)})}
            placeholder="10.99"
            error={errors.value}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Rareté *</label>
            <select
              value={itemForm.rarity}
              onChange={(e) => setItemForm({...itemForm, rarity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="common">Commun</option>
              <option value="rare">Rare</option>
              <option value="epic">Épique</option>
              <option value="legendary">Légendaire</option>
            </select>
          </div>
          
          {itemForm.image_url && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Aperçu :</label>
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={itemForm.image_url} 
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM4IDEyIDQgOCA4IDRTMTYgMCAxMiA0IDggOCAxMiAxMloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={selectedItem ? handleUpdateItem : handleCreateItem}
              loading={submitting}
              className="flex-1"
            >
              <Save size={16} />
              {selectedItem ? 'Mettre à jour' : 'Créer l\'Item'}
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                setShowItemModal(false);
                setSelectedItem(null);
                setItemForm({ name: '', description: '', image_url: '', value: 10, rarity: 'common' });
                setErrors({});
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Gestion des Items d'une Box */}
      <Modal
        isOpen={showBoxItemsModal}
        onClose={() => {
          setShowBoxItemsModal(false);
          setSelectedBox(null);
          setBoxItemForm({ item_id: '', drop_rate: '' });
          setErrors({});
        }}
        title={selectedBox ? `Gérer les items - ${selectedBox.name}` : ''}
      >
        {selectedBox && (
          <div className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}
            
            {/* Statistiques */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Total des pourcentages :</span>
                <span className={`font-semibold ${
                  Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {getTotalDropRate(selectedBox.id).toFixed(2)}%
                </span>
              </div>
              {Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={16} />
                  <span className="text-sm">Configuration complète ✓</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle size={16} />
                  <span className="text-sm">
                    {getTotalDropRate(selectedBox.id) < 100 
                      ? `Il manque ${(100 - getTotalDropRate(selectedBox.id)).toFixed(2)}% pour compléter la box`
                      : `Dépassement de ${(getTotalDropRate(selectedBox.id) - 100).toFixed(2)}%`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Formulaire d'ajout */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Ajouter un item</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Item *</label>
                  <select
                    value={boxItemForm.item_id}
                    onChange={(e) => setBoxItemForm({...boxItemForm, item_id: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors.item_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionnez un item</option>
                    {items
                      .filter(item => !boxItems.some(bi => bi.loot_box_id === selectedBox.id && bi.item_id === item.id))
                      .map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))
                    }
                  </select>
                  {errors.item_id && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.item_id}
                    </p>
                  )}
                </div>
                
                <Input
                  label="Pourcentage de chance *"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={boxItemForm.drop_rate}
                  onChange={(e) => setBoxItemForm({...boxItemForm, drop_rate: e.target.value})}
                  placeholder="Ex: 25.5"
                  error={errors.drop_rate}
                />
                
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddBoxItem}
                    loading={submitting}
                    disabled={getTotalDropRate(selectedBox.id) >= 100}
                    className="w-full"
                  >
                    <Plus size={16} />
                    Ajouter
                  </Button>
                </div>
              </div>
            </Card>

            {/* Liste des items de la box */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Items dans cette box</h3>
              {getBoxItems(selectedBox.id).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Aucun item dans cette box</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getBoxItems(selectedBox.id).map((boxItem, index) => (
                    <motion.div
                      key={boxItem.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            <img 
                              src={boxItem.items?.image_url} 
                              alt={boxItem.items?.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM4IDEyIDQgOCA4IDRTMTYgMCAxMiA0IDggOCAxMiAxMloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{boxItem.items?.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1">
                                <Percent size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-600">{boxItem.drop_rate}%</span>
                              </div>
                              <span className="text-sm text-gray-600">{boxItem.items?.value}€</span>
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                boxItem.items?.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                                boxItem.items?.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                                boxItem.items?.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {boxItem.items?.rarity}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDeleteBoxItem(boxItem.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminPage;