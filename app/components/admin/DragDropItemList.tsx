import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  GripVertical, Edit2, Trash2, Percent, CheckCircle2, X, 
  Package, TrendingUp, Sparkles 
} from 'lucide-react';
import { Button } from './ui';
import { BoxItem } from './types';

interface DragDropItemListProps {
  items: BoxItem[];
  onReorder: (newOrder: BoxItem[]) => void;
  onEdit?: (item: BoxItem) => void;
  onDelete: (itemId: string) => void;
  onUpdateProbability: (itemId: string, probability: number) => Promise<void>;
}

const formatPrice = (price: number | null | undefined): string => {
  if (!price) return '0,00';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const getRarityConfig = (rarity: string | null) => {
  const configs = {
    common: {
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-200 dark:border-gray-600',
      bgGradient: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700',
      icon: Package
    },
    rare: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-700',
      bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      icon: TrendingUp
    },
    epic: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      borderColor: 'border-purple-200 dark:border-purple-700',
      bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      icon: Sparkles
    },
    legendary: {
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      borderColor: 'border-yellow-300 dark:border-yellow-600',
      bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
      icon: Sparkles
    }
  };
  return configs[(rarity || 'common') as keyof typeof configs] || configs.common;
};

export const DragDropItemList = ({ 
  items, 
  onReorder, 
  onEdit, 
  onDelete, 
  onUpdateProbability 
}: DragDropItemListProps) => {
  const [draggedItems, setDraggedItems] = useState<BoxItem[]>([]);
  const [editingProbability, setEditingProbability] = useState<string | null>(null);
  const [tempProbability, setTempProbability] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    // Trier les items par display_order au chargement initial
    const sortedItems = [...items].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    setDraggedItems(sortedItems);
  }, [items]);

  const handleReorder = (newOrder: BoxItem[]) => {
    // Mettre à jour immédiatement l'état local
    setDraggedItems(newOrder);
    
    // Débouncer l'appel API pour éviter trop de requêtes
    setTimeout(() => {
      onReorder(newOrder);
    }, 500);
  };

  const startEditProbability = (item: BoxItem) => {
    setEditingProbability(item.id);
    setTempProbability(item.probability?.toString() || '0');
  };

  const saveProbability = async (itemId: string) => {
    const newProbability = parseFloat(tempProbability);
    if (newProbability > 0 && newProbability <= 100) {
      try {
        await onUpdateProbability(itemId, newProbability);
        setEditingProbability(null);
        setTempProbability('');
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la probabilité:', error);
      }
    }
  };

  const cancelEditProbability = () => {
    setEditingProbability(null);
    setTempProbability('');
  };

  if (draggedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Aucun item dans cette box
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <GripVertical size={20} className="text-gray-400" />
          Items configurés ({draggedItems.length})
        </h4>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Glisser-déposer pour réorganiser
        </div>
      </div>

      <Reorder.Group 
        axis="y" 
        values={draggedItems} 
        onReorder={handleReorder}
        className="space-y-3"
      >
        {draggedItems.map((item, index) => {
          const rarityConfig = getRarityConfig(item.items?.rarity ?? null);
          const RarityIcon = rarityConfig.icon;

          return (
            <Reorder.Item 
              key={item.id} 
              value={item}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              className="cursor-grab active:cursor-grabbing"
            >
              <motion.div
                layout
                whileHover={{ scale: isDragging ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  bg-gradient-to-r ${rarityConfig.bgGradient} 
                  border-2 ${rarityConfig.borderColor} 
                  rounded-2xl p-6 transition-all duration-300 
                  hover:shadow-lg group relative overflow-hidden
                  ${isDragging ? 'shadow-2xl rotate-2' : ''}
                `}
              >
                {/* Effet de brillance pour les items légendaires */}
                {item.items?.rarity === 'legendary' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse"></div>
                )}

                <div className="flex items-center gap-6 relative z-10">
                  {/* Handle de drag & numéro d'ordre */}
                  <div className="flex items-center gap-3 text-gray-400">
                    <GripVertical size={20} className="cursor-grab group-hover:text-gray-600 transition-colors" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold bg-white dark:bg-gray-700 px-3 py-1 rounded-full border shadow-sm min-w-[3rem] text-center">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  
                  {/* Image de l'item */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white dark:bg-gray-700 shrink-0 shadow-lg border-2 border-white dark:border-gray-600">
                    <img 
                      src={item.items?.image_url || '/placeholder-item.jpg'} 
                      alt={item.items?.name || 'Item'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkl0ZW08L3RleHQ+Cjwvc3ZnPgo=';
                      }}
                    />
                  </div>
                  
                  {/* Informations de l'item */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {item.items?.name || 'Item inconnu'}
                      </h4>
                      <span className={`px-3 py-1 text-xs rounded-full font-bold capitalize border ${rarityConfig.color}`}>
                        <RarityIcon size={12} className="inline mr-1" />
                        {item.items?.rarity || 'common'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      {/* Probabilité éditable */}
                      <div className="flex items-center gap-2">
                        <Percent size={14} className="text-gray-400" />
                        {editingProbability === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={tempProbability}
                              onChange={(e) => setTempProbability(e.target.value)}
                              className="w-28 px-3 py-1 text-sm border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-500"
                              step="0.000001"
                              min="0"
                              max="100"
                              placeholder="0.000000"
                              autoFocus
                            />
                            <Button 
                              size="xs" 
                              variant="primary"
                              onClick={() => saveProbability(item.id)}
                              className="px-2"
                            >
                              <CheckCircle2 size={14} />
                            </Button>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              onClick={cancelEditProbability}
                              className="px-2"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startEditProbability(item)}
                            className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg font-bold transition-colors border border-blue-200 dark:border-blue-700"
                          >
                            {parseFloat(item.probability?.toString() || '0').toFixed(6)}%
                          </button>
                        )}
                      </div>

                      {/* Valeur marché */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Valeur:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatPrice(item.items?.market_value || 0)}€
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onEdit && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(item)}
                        className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onDelete(item.id)}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Barre de progression pour la probabilité */}
                <div className="mt-4 relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(parseFloat(item.probability?.toString() || '0'), 100)}%` }}
                      className={`h-2 rounded-full ${
                        item.items?.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        item.items?.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                        item.items?.rarity === 'rare' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                        'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="absolute right-0 top-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Drop Rate
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* Résumé des probabilités */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Total des probabilités:
          </span>
          <span className={`font-bold text-lg ${
            Math.abs(draggedItems.reduce((sum, item) => sum + parseFloat(item.probability?.toString() || '0'), 0) - 100) < 0.01
              ? 'text-green-600 dark:text-green-400'
              : 'text-orange-600 dark:text-orange-400'
          }`}>
            {draggedItems.reduce((sum, item) => sum + parseFloat(item.probability?.toString() || '0'), 0).toFixed(6)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              Math.abs(draggedItems.reduce((sum, item) => sum + parseFloat(item.probability?.toString() || '0'), 0) - 100) < 0.01
                ? 'bg-gradient-to-r from-green-400 to-green-600'
                : 'bg-gradient-to-r from-orange-400 to-red-500'
            }`}
            style={{ 
              width: `${Math.min(draggedItems.reduce((sum, item) => sum + parseFloat(item.probability?.toString() || '0'), 0), 100)}%` 
            }}
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {Math.abs(draggedItems.reduce((sum, item) => sum + parseFloat(item.probability?.toString() || '0'), 0) - 100) < 0.01
            ? '✅ Configuration parfaite - 100% de chances de drop'
            : '⚠️ Ajustez les probabilités pour atteindre 100%'
          }
        </div>
      </div>
    </div>
  );
};