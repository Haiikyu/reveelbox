'use client'

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Plus, Search, RefreshCw, Package, 
  BarChart3, Image, Users, CreditCard, DatabaseIcon
} from 'lucide-react';

// Composants refactorisés
import { ThemeProvider, ThemeToggle } from '@/app/components/admin/ThemeProvider';
import { Button, Toast, Card } from '@/app/components/admin/ui/index';
import { Dashboard } from '@/app/components/admin/Dashboard';
import { BoxesManagement } from '@/app/components/admin/BoxesManagement';
import { ItemsManagementSimple } from '@/app/components/admin/ItemsManagement';
import { UsersManagement, TransactionsManagement } from '@/app/components/admin/UsersTransactions';
import { AdvancedStats } from '@/app/components/admin/AdvancedStats';
import { BoxModal, ItemModal, ManageItemsModal } from '@/app/components/admin/Modals';
import { useAdmin } from '@/app/hooks/useAdmin';
import { 
  BoxForm, ItemForm, BoxItemForm, Errors, 
  LootBox, Item 
} from '@/app/components/admin/types';

// Hook de gestion des modaux
const useModals = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>('');
  const [selectedBox, setSelectedBox] = useState<LootBox | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states avec bannière
  const [boxForm, setBoxForm] = useState<BoxForm>({
    name: '',
    description: '',
    image_url: '',
    banner_url: '', // NOUVEAU CHAMP
    price_virtual: '100.00',
    is_active: true,
    is_daily_free: false,
    is_featured: false,
    required_level: '1'
  });

  const [itemForm, setItemForm] = useState<ItemForm>({
    name: '',
    description: '',
    image_url: '',
    market_value: '10.00',
    rarity: 'common'
  });

  const [boxItemForm, setBoxItemForm] = useState<BoxItemForm>({
    item_id: '',
    probability: '',
    display_order: '1'
  });

  const openModal = (type: string, data?: LootBox | Item | null) => {
    setModalType(type);
    setShowModal(true);
    setErrors({});
    
    if (data) {
      if (type === 'editBox') {
        const boxData = data as LootBox;
        setSelectedBox(boxData);
        setBoxForm({
          name: boxData.name,
          description: boxData.description || '',
          image_url: boxData.image_url || '',
          banner_url: boxData.banner_url || '', // NOUVEAU
          price_virtual: (boxData.price_virtual || 100).toString(),
          is_active: boxData.is_active ?? true,
          is_daily_free: boxData.is_daily_free ?? false,
          is_featured: boxData.is_featured ?? false,
          required_level: (boxData.required_level || 1).toString()
        });
      } else if (type === 'editItem') {
        const itemData = data as Item;
        setSelectedItem(itemData);
        setItemForm({
          name: itemData.name,
          description: itemData.description || '',
          image_url: itemData.image_url || '',
          market_value: (itemData.market_value || 10).toString(),
          rarity: itemData.rarity
        });
      } else if (type === 'manageItems') {
        const boxData = data as LootBox;
        setSelectedBox(boxData);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBox(null);
    setSelectedItem(null);
    setErrors({});
    setBoxForm({
      name: '',
      description: '',
      image_url: '',
      banner_url: '', // NOUVEAU
      price_virtual: '100.00',
      is_active: true,
      is_daily_free: false,
      is_featured: false,
      required_level: '1'
    });
    setItemForm({
      name: '',
      description: '',
      image_url: '',
      market_value: '10.00',
      rarity: 'common'
    });
    setBoxItemForm({
      item_id: '',
      probability: '',
      display_order: '1'
    });
  };

  return {
    showModal,
    modalType,
    selectedBox,
    selectedItem,
    errors,
    setErrors,
    submitting,
    setSubmitting,
    boxForm,
    setBoxForm,
    itemForm,
    setItemForm,
    boxItemForm,
    setBoxItemForm,
    openModal,
    closeModal
  };
};

// Composant principal de l'admin
const AdvancedAdminPanel = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Hook admin pour la logique métier
  const adminHook = useAdmin();
  
  // Hook modaux pour la gestion UI
  const modalHook = useModals();

  // Navigation tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'boxes', label: 'Loot Boxes', icon: Package },
    { id: 'items', label: 'Items', icon: Image },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'system', label: 'Système', icon: DatabaseIcon }
  ];

  // Handlers avec validation
  const handleCreateBox = async () => {
    if (modalHook.submitting) return;
    
    const validationErrors: Errors = {};
    if (!modalHook.boxForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!modalHook.boxForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!modalHook.boxForm.price_virtual || parseFloat(modalHook.boxForm.price_virtual) < 0) {
      validationErrors.price_virtual = 'Le prix doit être positif';
    }
    if (modalHook.boxForm.is_daily_free && (!modalHook.boxForm.required_level || parseInt(modalHook.boxForm.required_level) < 1)) {
      validationErrors.required_level = 'Le niveau requis doit être supérieur à 0';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      modalHook.setErrors(validationErrors);
      return;
    }
    
    modalHook.setSubmitting(true);
    const result = await adminHook.createBox(modalHook.boxForm);
    modalHook.setSubmitting(false);
    
    if (result.success) {
      modalHook.closeModal();
    } else {
      modalHook.setErrors({ general: result.error?.message || 'Erreur lors de la création' });
    }
  };

  const handleUpdateBox = async () => {
    if (!modalHook.selectedBox || modalHook.submitting) return;
    
    const validationErrors: Errors = {};
    if (!modalHook.boxForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!modalHook.boxForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!modalHook.boxForm.price_virtual || parseFloat(modalHook.boxForm.price_virtual) < 0) {
      validationErrors.price_virtual = 'Le prix doit être positif';
    }
    if (modalHook.boxForm.is_daily_free && (!modalHook.boxForm.required_level || parseInt(modalHook.boxForm.required_level) < 1)) {
      validationErrors.required_level = 'Le niveau requis doit être supérieur à 0';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      modalHook.setErrors(validationErrors);
      return;
    }
    
    modalHook.setSubmitting(true);
    const result = await adminHook.updateBox(modalHook.selectedBox.id, modalHook.boxForm);
    modalHook.setSubmitting(false);
    
    if (result.success) {
      modalHook.closeModal();
    } else {
      modalHook.setErrors({ general: result.error?.message || 'Erreur lors de la mise à jour' });
    }
  };

  const handleCreateItem = async () => {
    if (modalHook.submitting) return;
    
    const validationErrors: Errors = {};
    if (!modalHook.itemForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!modalHook.itemForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!modalHook.itemForm.market_value || parseFloat(modalHook.itemForm.market_value) < 0) {
      validationErrors.market_value = 'La valeur doit être positive';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      modalHook.setErrors(validationErrors);
      return;
    }
    
    modalHook.setSubmitting(true);
    const result = await adminHook.createItem(modalHook.itemForm);
    modalHook.setSubmitting(false);
    
    if (result.success) {
      modalHook.closeModal();
    } else {
      modalHook.setErrors({ general: result.error?.message || 'Erreur lors de la création' });
    }
  };

  const handleUpdateItem = async () => {
    if (!modalHook.selectedItem || modalHook.submitting) return;
    
    const validationErrors: Errors = {};
    if (!modalHook.itemForm.name.trim()) validationErrors.name = 'Le nom est requis';
    if (!modalHook.itemForm.image_url.trim()) validationErrors.image_url = 'L\'image est requise';
    if (!modalHook.itemForm.market_value || parseFloat(modalHook.itemForm.market_value) < 0) {
      validationErrors.market_value = 'La valeur doit être positive';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      modalHook.setErrors(validationErrors);
      return;
    }
    
    modalHook.setSubmitting(true);
    const result = await adminHook.updateItem(modalHook.selectedItem.id, modalHook.itemForm);
    modalHook.setSubmitting(false);
    
    if (result.success) {
      modalHook.closeModal();
    } else {
      modalHook.setErrors({ general: result.error?.message || 'Erreur lors de la mise à jour' });
    }
  };

  const handleAddItemToBox = async () => {
    if (!modalHook.selectedBox || modalHook.submitting) return;
    
    const validationErrors: Errors = {};
    if (!modalHook.boxItemForm.item_id) validationErrors.item_id = 'Sélectionnez un item';
    const probability = parseFloat(modalHook.boxItemForm.probability);
    if (!modalHook.boxItemForm.probability || probability <= 0 || probability > 100) {
      validationErrors.probability = 'Le pourcentage doit être entre 0.000001 et 100';
    }
    
    // Vérifier le total des probabilités
    const currentTotal = adminHook.getTotalDropRate(modalHook.selectedBox.id);
    if (currentTotal + probability > 100) {
      validationErrors.probability = `Le total dépasserait 100% (actuellement ${currentTotal.toFixed(6)}%)`;
    }
    

// Vérifier les doublons
const existingItem = adminHook.boxItems.find(
  bi => bi.loot_box_id === modalHook.selectedBox!.id &&
        bi.item_id === modalHook.boxItemForm.item_id
);
if (existingItem) {
  modalHook.setErrors({ item_id: 'Cet item est déjà dans la box' });
  return;
}

modalHook.setSubmitting(true);
const result = await adminHook.addItemToBox(modalHook.selectedBox.id, modalHook.boxItemForm);
modalHook.setSubmitting(false);

if (result.success) {
  modalHook.setBoxItemForm({ item_id: '', probability: '', display_order: '1' });
  modalHook.setErrors({});
} else {
  modalHook.setErrors({ general: result.error?.message || 'Erreur lors de l\'ajout' });
}
};
  const handleRefresh = async () => {
    setRefreshing(true);
    await adminHook.loadData();
    setRefreshing(false);
    adminHook.showToast('Données actualisées');
  };

  // Fonction améliorée pour afficher les boxes triées par prix décroissant
  const getSortedBoxes = () => {
    return [...adminHook.boxes].sort((a, b) => (b.price_virtual || 0) - (a.price_virtual || 0));
  };

  // Fonction pour calculer le nombre d'ouvertures par box
  const getBoxOpeningCount = (boxId: string) => {
    return adminHook.transactions.filter(t => 
      t.type === 'box_opening' && t.loot_box_id === boxId
    ).length;
  };

  // Filtrer les transactions réelles uniquement (pas de coins virtuels)
  const getRealMoneyTransactions = () => {
    return adminHook.transactions.filter(t => 
      (t.type === 'purchase' || t.type === 'purchase_box') && 
      t.amount && 
      t.amount > 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 pt-20">
      {/* Toast Notifications */}
      <AnimatePresence>
        {adminHook.toast && (
          <Toast 
            message={adminHook.toast.message} 
            type={adminHook.toast.type} 
            onClose={() => adminHook.setToast(null)} 
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-72 shrink-0">
            <div className="sticky top-8">
              {/* Header dans la sidebar */}
              <div className="mb-8">
                <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      ReveelBox Admin
                    </h1>
                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                      v3.0 Pro
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Actions */}
              <div className="mb-6 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh} 
                    loading={refreshing} 
                    icon={RefreshCw}
                    className="flex-1"
                  >
                    Actualiser
                  </Button>
                  <ThemeToggle />
                  <Button 
                    variant="primary" 
                    size="sm" 
                    icon={Plus} 
                    onClick={() => modalHook.openModal('createBox')}
                  >
                    Nouveau
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <Card className="p-2 overflow-hidden">
                <nav className="space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 relative
                          ${activeTab === tab.id 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-[1.02]' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                          }
                        `}
                      >
                        <Icon size={20} />
                        {tab.label}
                        {activeTab === tab.id && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl -z-10"
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <Dashboard
                  stats={adminHook.stats}
                  onCreateBox={() => modalHook.openModal('createBox')}
                  onCreateItem={() => modalHook.openModal('createItem')}
                  onExport={(type) => adminHook.exportData(type)}
                  onNavigateToSystem={() => setActiveTab('system')}
                />
              )}

              {/* Advanced Stats Tab */}
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      Statistiques Avancées
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      Analyse approfondie des performances de votre plateforme
                    </p>
                  </div>
                  <AdvancedStats
                    users={adminHook.users}
                    transactions={getRealMoneyTransactions()}
                    boxes={adminHook.boxes}
                    items={adminHook.items}
                    formatPrice={adminHook.formatPrice}
                    formatDate={adminHook.formatDate}
                  />
                </motion.div>
              )}

              {/* Boxes Tab */}
              {activeTab === 'boxes' && (
                <BoxesManagement
                  boxes={getSortedBoxes()}
                  loading={adminHook.loading}
                  searchQuery={searchQuery}
                  stats={adminHook.stats}
                  onCreateBox={() => modalHook.openModal('createBox')}
                  onEditBox={(box) => modalHook.openModal('editBox', box)}
                  onDeleteBox={adminHook.deleteBox}
                  onManageItems={(box) => modalHook.openModal('manageItems', box)}
                  onExport={() => adminHook.exportData('boxes')}
                  getBoxItems={adminHook.getBoxItems}
                  getBoxOpeningCount={getBoxOpeningCount}
                />
              )}

              {/* Items Tab */}
              {activeTab === 'items' && (
                <ItemsManagementSimple
                  items={adminHook.items}
                  loading={adminHook.loading}
                  searchQuery={searchQuery}
                  onCreateItem={() => modalHook.openModal('createItem')}
                  onEditItem={(item) => modalHook.openModal('editItem', item)}
                  onDeleteItem={adminHook.deleteItem}
                  onExport={() => adminHook.exportData('items')}
                  formatPrice={adminHook.formatPrice}
                />
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <UsersManagement
                  users={adminHook.users}
                  loading={adminHook.loading}
                  searchQuery={searchQuery}
                  onExport={() => adminHook.exportData('users')}
                  formatDate={adminHook.formatDate}
                />
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <TransactionsManagement
                  transactions={getRealMoneyTransactions()}
                  loading={adminHook.loading}
                  onExport={() => adminHook.exportData('transactions')}
                  formatDate={adminHook.formatDate}
                  formatPrice={adminHook.formatPrice}
                />
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      Administration Système
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      Outils et paramètres système avancés
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* System Status */}
                    <Card className="p-8 hover:shadow-xl transition-shadow">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <DatabaseIcon size={24} className="text-green-600" />
                        </div>
                        État du Système
                      </h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">Base de données</span>
                          <span className="flex items-center gap-3 text-green-600 dark:text-green-400 font-semibold">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                            Opérationnelle
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">API Supabase</span>
                          <span className="flex items-center gap-3 text-green-600 dark:text-green-400 font-semibold">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                            Connectée
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">Environnement</span>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                            Production
                          </span>
                        </div>
                      </div>
                    </Card>

                    {/* Export Tools */}
                    <Card className="p-8 hover:shadow-xl transition-shadow">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Package size={24} className="text-blue-600" />
                        </div>
                        Outils d'Export
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={() => void adminHook.exportData('boxes')}
                          className="h-16 flex-col gap-2"
                        >
                          <Package size={20} />
                          Boxes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={() => void adminHook.exportData('items')}
                          className="h-16 flex-col gap-2"
                        >
                          <Image size={20} />
                          Items
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={() => void adminHook.exportData('users')}
                          className="h-16 flex-col gap-2"
                        >
                          <Users size={20} />
                          Users
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                         onClick={() => void adminHook.exportData('transactions')}
                          className="h-16 flex-col gap-2"
                        >
                          <CreditCard size={20} />
                          Transactions
                        </Button>
                      </div>
                    </Card>

                    {/* Performance Metrics */}
                    <Card className="p-8 lg:col-span-2 hover:shadow-xl transition-shadow">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <BarChart3 size={24} className="text-purple-600" />
                        </div>
                        Métriques de Performance
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            {adminHook.stats.boxes || 0}
                          </div>
                          <div className="text-sm font-medium text-green-700 dark:text-green-300">Total Boxes</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {adminHook.stats.items || 0}
                          </div>
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Items</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            {adminHook.stats.users || 0}
                          </div>
                          <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Utilisateurs</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800">
                          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                            {getRealMoneyTransactions().length || 0}
                          </div>
                          <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Transactions €</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

{/* Modals */}
<BoxModal
  isOpen={modalHook.showModal && (modalHook.modalType === 'createBox' || modalHook.modalType === 'editBox')}
  isEdit={modalHook.modalType === 'editBox'}
  boxForm={modalHook.boxForm}
  errors={modalHook.errors}
  submitting={modalHook.submitting}
  onClose={modalHook.closeModal}
  onSubmit={modalHook.modalType === 'editBox' ? handleUpdateBox : handleCreateBox}
  onFormChange={(updates) => modalHook.setBoxForm(prev => ({ ...prev, ...updates }))}
/>

<ItemModal
  isOpen={modalHook.showModal && (modalHook.modalType === 'createItem' || modalHook.modalType === 'editItem')}
  isEdit={modalHook.modalType === 'editItem'}
  itemForm={modalHook.itemForm}
  errors={modalHook.errors}
  submitting={modalHook.submitting}
  onClose={modalHook.closeModal}
  onSubmit={modalHook.modalType === 'editItem' ? handleUpdateItem : handleCreateItem}
  onFormChange={(updates) => modalHook.setItemForm(prev => ({ ...prev, ...updates }))}
/>

<ManageItemsModal
  isOpen={modalHook.showModal && modalHook.modalType === 'manageItems'}
  selectedBox={modalHook.selectedBox}
  boxItemForm={modalHook.boxItemForm}
  errors={modalHook.errors}
  submitting={modalHook.submitting}
  items={adminHook.items}
  boxItems={adminHook.boxItems}
  onClose={modalHook.closeModal}
  onFormChange={(updates) => modalHook.setBoxItemForm(prev => ({ ...prev, ...updates }))}
  onAddItem={handleAddItemToBox}
  onUpdateItemOrder={async (boxId: string, newOrder: any[]) => {
    await adminHook.updateItemOrder(boxId, newOrder);
  }}
  onDeleteBoxItem={async (boxItemId: string) => {
    await adminHook.deleteBoxItem(boxItemId);
  }}
  onUpdateProbability={async (boxItemId: string, newProbability: number) => {
    await adminHook.updateBoxItemProbability(boxItemId, newProbability);
  }}
  getBoxItems={adminHook.getBoxItems}
  getTotalDropRate={adminHook.getTotalDropRate}
/>
    </div>
  );
};

// Root component with theme provider
const App = () => {
  return (
    <ThemeProvider>
      <AdvancedAdminPanel />
    </ThemeProvider>
  );
};

export default App;