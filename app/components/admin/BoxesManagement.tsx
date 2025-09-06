{/* Boxes Grid - 4 colonnes */}import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Download, Package, Edit2, Trash2, 
  TrendingUp, Eye, Users, Activity
} from 'lucide-react';
import { Card, Button } from './ui';
import { LootBox, BoxItem } from './types';

interface BoxesManagementProps {
  boxes: LootBox[];
  loading: boolean;
  searchQuery: string;
  stats: { activeBoxes?: number; featuredBoxes?: number };
  onCreateBox: () => void;
  onEditBox: (box: LootBox) => void;
  onDeleteBox: (boxId: string) => void;
  onManageItems: (box: LootBox) => void;
  onExport: () => void;
  getBoxItems: (boxId: string) => BoxItem[];
  getBoxOpeningCount?: (boxId: string) => number;
}

export const BoxesManagement = ({ 
  boxes, 
  loading, 
  searchQuery, 
  stats,
  onCreateBox, 
  onEditBox, 
  onDeleteBox, 
  onManageItems, 
  onExport,
  getBoxItems,
  getBoxOpeningCount = () => 0
}: BoxesManagementProps) => {
  const filteredBoxes = boxes.filter(box => 
    !searchQuery || box.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      key="boxes"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestion des Loot Boxes
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {boxes.length} box(es) • {stats.activeBoxes || 0} active(s) • {stats.featuredBoxes || 0} featured
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" icon={Download} onClick={onExport} size="lg">
            Export
          </Button>
          <Button icon={Plus} onClick={onCreateBox} size="lg">
            Nouvelle Box
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Boxes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{boxes.length}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Boxes Actives</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeBoxes || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Featured</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.featuredBoxes || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Ouvertures</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {boxes.reduce((total, box) => total + getBoxOpeningCount(box.id), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Boxes Grid - 4 colonnes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card>
          ))}
        </div>
      ) : boxes.length === 0 ? (
        <Card className="p-16 text-center">
          <Package size={64} className="mx-auto mb-6 text-gray-400" />
          <h3 className="text-2xl font-medium text-gray-900 dark:text-white mb-3">
            Aucune box créée
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Commencez par créer votre première loot box
          </p>
          <Button onClick={onCreateBox} icon={Plus} size="lg">
            Créer une box
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredBoxes.map((box, index) => {
            const openingCount = getBoxOpeningCount(box.id);
            const itemsCount = getBoxItems(box.id).length;
            
            return (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl group transition-all duration-500 transform hover:scale-[1.02] border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                    <img 
                      src={box.image_url || '/placeholder-box.jpg'} 
                      alt={box.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJveCBlPC90ZXh0Pgo8L3N2Zz4K';
                      }}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {box.is_active && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 shadow-sm">
                          Actif
                        </span>
                      )}
                      {box.is_featured && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                          Featured
                        </span>
                      )}
                      {box.is_daily_free && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                          FreeDrop
                        </span>
                      )}
                    </div>

                    {/* Prix overlay */}
                    <div className="absolute bottom-4 left-4">
                      <div className="px-4 py-2 bg-black/80 backdrop-blur-sm rounded-full text-white font-bold text-lg">
                        {box.price_virtual} coins
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {box.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {box.description || 'Aucune description'}
                    </p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                          <Package size={16} />
                          <span className="font-semibold text-lg">{itemsCount}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Items</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                          <Eye size={16} />
                          <span className="font-semibold text-lg">{openingCount}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ouvertures</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onManageItems(box)}
                      >
                        Gérer Items
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        icon={Edit2}
                        onClick={() => onEditBox(box)}
                        className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        icon={Trash2}
                        onClick={() => onDeleteBox(box.id)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};