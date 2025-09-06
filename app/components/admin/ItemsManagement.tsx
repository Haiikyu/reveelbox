import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Image, Edit2, Trash2, Package } from 'lucide-react';
import { Card, Button } from './ui';
import { Item } from './types';

interface ItemsManagementProps {
  items: Item[];
  loading: boolean;
  searchQuery: string;
  onCreateItem: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  onExport: () => void;
  formatPrice: (price: number | null | undefined) => string;
}

const getRarityColor = (rarity: string | null) => {
  const colors = {
    common: 'bg-gray-100 text-gray-700 border-gray-200',
    rare: 'bg-blue-100 text-blue-700 border-blue-200',
    epic: 'bg-purple-100 text-purple-700 border-purple-200',
    legendary: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };
  return colors[(rarity || 'common') as keyof typeof colors] || colors.common;
};

export const ItemsManagementSimple = ({ 
  items, 
  loading, 
  searchQuery, 
  onCreateItem, 
  onEditItem, 
  onDeleteItem, 
  onExport,
  formatPrice
}: ItemsManagementProps) => {
  const filteredItems = items.filter(item => 
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = items.reduce((sum, item) => sum + (item.market_value || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Simple */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Items</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {items.length} items • {formatPrice(totalValue)}€ total
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={Download} onClick={onExport}>
            Export
          </Button>
          <Button icon={Plus} onClick={onCreateItem}>
            Nouvel Item
          </Button>
        </div>
      </div>

      {/* Grid Simple */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <Image size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Aucun item
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Créez votre premier item
          </p>
          <Button onClick={onCreateItem} icon={Plus}>
            Créer un item
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              {/* Image sans overlay */}
              <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                <img 
                  src={item.image_url || '/placeholder.jpg'} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMmMxLjEgMCAyIC45IDIgMnMtLjkgMi0yIDItMi0uOS0yLTIgLjktMiAyLTJ6bTkgN2gtNmw1LjUtNmMuMy0uMy4yLS44LS4xLTEuMWwtLjQtLjRjLS4zLS4zLS44LS4yLTEuMS4xbC02IDYuNUg3bC02LTYuNWMtLjMtLjMtLjgtLjQtMS4xLS4xbC0uNC40Yy0uMy4zLS40LjguMS4xTDUgOUgxYy0uNiAwLTEgLjQtMSAxdjJjMCAuNi40IDEgMSAxaDR2OGMwIDEuMSA5IDEuMSA5IDB2LThoNGMuNiAwIDEtLjQgMS0xdi0yYzAtLjYtLjQtMS0xLTF6Ii8+PC9zdmc+';
                  }}
                />
                
                {/* Badge rareté */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </span>
                </div>
              </div>

              {/* Info avec boutons en dessous */}
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate mb-1">
                  {item.name}
                </h3>
                <p className="text-green-600 font-bold mb-3">
                  {formatPrice(item.market_value || 0)}€
                </p>
                
                {/* Boutons sous l'item */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onEditItem(item)}
                    className="flex-1 text-xs"
                  >
                    <Edit2 size={14} />
                    
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDeleteItem(item.id)}
                    className="flex-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                    
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};