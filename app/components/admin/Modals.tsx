import React from 'react';
import { Save } from 'lucide-react';
import { Modal, Button, Input, Card } from './ui';
import { DragDropItemList } from './DragDropItemList';
import { BoxForm, ItemForm, BoxItemForm, Errors, LootBox, Item, BoxItem } from './types';

// Box Modal (Create/Edit) - AVEC BANNIÈRE
interface BoxModalProps {
  isOpen: boolean;
  isEdit: boolean;
  boxForm: BoxForm;
  errors: Errors;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (updates: Partial<BoxForm>) => void;
}

export const BoxModal = ({
  isOpen,
  isEdit,
  boxForm,
  errors,
  submitting,
  onClose,
  onSubmit,
  onFormChange
}: BoxModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={isEdit ? 'Modifier la Box' : 'Nouvelle Box'}
    size="lg"
  >
    <div className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nom de la box *"
          value={boxForm.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder="Ex: Tech Mystery Box"
          error={errors.name}
        />

        <Input
          label="Prix en coins *"
          type="number"
          step="0.01"
          min="0"
          value={boxForm.price_virtual}
          onChange={(e) => onFormChange({ price_virtual: e.target.value })}
          placeholder="100.50"
          error={errors.price_virtual}
        />
      </div>

      <Input
        label="Description"
        value={boxForm.description}
        onChange={(e) => onFormChange({ description: e.target.value })}
        placeholder="Description de la box..."
      />

      <Input
        label="URL de l'image de la box *"
        value={boxForm.image_url}
        onChange={(e) => onFormChange({ image_url: e.target.value })}
        placeholder="https://exemple.com/box-image.jpg"
        error={errors.image_url}
      />

      {/* NOUVELLE SECTION BANNIÈRE */}
      <Input
        label="URL de la bannière d'arrière-plan"
        value={boxForm.banner_url || ''}
        onChange={(e) => onFormChange({ banner_url: e.target.value })}
        placeholder="https://exemple.com/banner-background.jpg"
        error={errors.banner_url}
      />
      <div className="text-xs text-gray-500 dark:text-gray-400 -mt-4">
        Image d'arrière-plan qui s'affichera derrière la présentation de la box (optionnel)
      </div>

      <div className="grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={boxForm.is_active}
            onChange={(e) => onFormChange({ is_active: e.target.checked })}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={boxForm.is_featured}
            onChange={(e) => onFormChange({ is_featured: e.target.checked })}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={boxForm.is_daily_free}
            onChange={(e) => onFormChange({ is_daily_free: e.target.checked })}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FreeDrop</span>
        </label>
      </div>

      {/* Required Level pour FreeDrop */}
      {boxForm.is_daily_free && (
        <Input
          label="Niveau requis pour FreeDrop *"
          type="number"
          min="1"
          max="100"
          value={boxForm.required_level}
          onChange={(e) => onFormChange({ required_level: e.target.value })}
          placeholder="1"
          error={errors.required_level}
        />
      )}

      <div className="flex gap-4 pt-6">
        <Button 
          variant="primary" 
          icon={Save} 
          onClick={onSubmit}
          loading={submitting}
          className="flex-1"
        >
          {isEdit ? 'Mettre à jour' : 'Créer la Box'}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
      </div>
    </div>
  </Modal>
);

// Item Modal (Create/Edit) - INCHANGÉ
interface ItemModalProps {
  isOpen: boolean;
  isEdit: boolean;
  itemForm: ItemForm;
  errors: Errors;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (updates: Partial<ItemForm>) => void;
}

export const ItemModal = ({
  isOpen,
  isEdit,
  itemForm,
  errors,
  submitting,
  onClose,
  onSubmit,
  onFormChange
}: ItemModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={isEdit ? 'Modifier l\'Item' : 'Nouvel Item'}
  >
    <div className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      <Input
        label="Nom de l'item *"
        value={itemForm.name}
        onChange={(e) => onFormChange({ name: e.target.value })}
        placeholder="Ex: Casque Gaming RGB"
        error={errors.name}
      />

      <Input
        label="Description"
        value={itemForm.description}
        onChange={(e) => onFormChange({ description: e.target.value })}
        placeholder="Description de l'item..."
      />

      <Input
        label="URL de l'image *"
        value={itemForm.image_url}
        onChange={(e) => onFormChange({ image_url: e.target.value })}
        placeholder="https://exemple.com/image.jpg"
        error={errors.image_url}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valeur marché (€) *"
          type="number"
          step="0.01"
          min="0"
          value={itemForm.market_value}
          onChange={(e) => onFormChange({ market_value: e.target.value })}
          placeholder="10.99"
          error={errors.market_value}
        />

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Rareté *
          </label>
          <select
            value={itemForm.rarity}
            onChange={(e) => onFormChange({ rarity: e.target.value })}
            className="w-full px-3 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-200"
          >
            <option value="common">Commun</option>
            <option value="rare">Rare</option>
            <option value="epic">Épique</option>
            <option value="legendary">Légendaire</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <Button 
          variant="primary" 
          icon={Save} 
          onClick={onSubmit} 
          loading={submitting}
          className="flex-1"
        >
          {isEdit ? 'Mettre à jour' : 'Créer l\'Item'}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
      </div>
    </div>
  </Modal>
);

// Manage Items Modal - INCHANGÉ
interface ManageItemsModalProps {
  isOpen: boolean;
  selectedBox: LootBox | null;
  boxItemForm: BoxItemForm;
  errors: Errors;
  submitting: boolean;
  items: Item[];
  boxItems: BoxItem[];
  onClose: () => void;
  onFormChange: (updates: Partial<BoxItemForm>) => void;
  onAddItem: () => void;
  onUpdateItemOrder: (boxId: string, newOrder: BoxItem[]) => void;
  onDeleteBoxItem: (itemId: string) => void;
  onUpdateProbability: (itemId: string, probability: number) => Promise<void>;
  getBoxItems: (boxId: string) => BoxItem[];
  getTotalDropRate: (boxId: string) => number;
}

export const ManageItemsModal = ({
  isOpen,
  selectedBox,
  boxItemForm,
  errors,
  submitting,
  items,
  boxItems,
  onClose,
  onFormChange,
  onAddItem,
  onUpdateItemOrder,
  onDeleteBoxItem,
  onUpdateProbability,
  getBoxItems,
  getTotalDropRate
}: ManageItemsModalProps) => {
  if (!selectedBox) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gérer les items - ${selectedBox.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {getBoxItems(selectedBox.id).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Items</div>
          </Card>
          <Card className="p-4 text-center">
            <div className={`text-2xl font-bold mb-1 ${
              Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {getTotalDropRate(selectedBox.id).toFixed(6)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Drop Rate Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              €{(getBoxItems(selectedBox.id).reduce((sum, bi) => {
                const item = items.find(i => i.id === bi.item_id);
                return sum + (item ? (item.market_value || 0) * (bi.probability || 0) / 100 : 0);
              }, 0)).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valeur Moyenne</div>
          </Card>
          <Card className="p-4 text-center">
            <div className={`text-2xl font-bold mb-1 ${
              Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.abs(getTotalDropRate(selectedBox.id) - 100) < 0.01 ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Configuration</div>
          </Card>
        </div>

        {/* Add Item Form */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ajouter un item</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select 
              value={boxItemForm.item_id}
              onChange={(e) => onFormChange({ item_id: e.target.value })}
              className={`px-3 py-2 bg-white dark:bg-gray-700 border rounded-xl text-sm col-span-2 ${
                errors.item_id ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Sélectionner un item</option>
              {items
                .filter(item => !boxItems.some(bi => bi.loot_box_id === selectedBox.id && bi.item_id === item.id))
                .map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.rarity})
                </option>
              ))}
            </select>
            
            <Input
              type="number"
              placeholder="Probabilité (%)"
              step="0.000001"
              min="0"
              max="100"
              value={boxItemForm.probability}
              onChange={(e) => onFormChange({ probability: e.target.value })}
              className="text-sm"
              error={errors.probability}
            />
            
            <Input
              type="number"
              placeholder="Ordre"
              min="1"
              value={boxItemForm.display_order}
              onChange={(e) => onFormChange({ display_order: e.target.value || '1' })}
              className="text-sm"
            />
            
            <Button onClick={onAddItem} loading={submitting} className="h-full">
              Ajouter
            </Button>
          </div>
          {(errors.item_id || errors.probability) && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.item_id || errors.probability}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Support jusqu'à 6 décimales pour les probabilités ultra-précises (ex: 0.000001%)
          </div>
        </Card>

        {/* Items List with Drag & Drop */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            Items dans cette box (Glisser-déposer pour réorganiser)
          </h3>
          {getBoxItems(selectedBox.id).length === 0 ? (
            <Card className="p-12 text-center">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun item dans cette box
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Commencez par ajouter des items avec leurs probabilités
              </p>
            </Card>
          ) : (
            <DragDropItemList
              items={getBoxItems(selectedBox.id)}
              onReorder={(newOrder) => onUpdateItemOrder(selectedBox.id, newOrder)}
              onDelete={onDeleteBoxItem}
              onUpdateProbability={onUpdateProbability}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};