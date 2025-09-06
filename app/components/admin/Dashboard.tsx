import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Image, Users, Plus, Download, Settings 
} from 'lucide-react';
import { Card, Button, StatsCard } from './ui';

interface DashboardProps {
  stats: Record<string, number>;
  onCreateBox: () => void;
  onCreateItem: () => void;
  onExport: (type: string) => void;
  onNavigateToSystem: () => void;
}

export const Dashboard = ({ 
  stats, 
  onCreateBox, 
  onCreateItem, 
  onExport, 
  onNavigateToSystem 
}: DashboardProps) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Vue d'ensemble en temps réel de votre plateforme ReveelBox
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Loot Boxes"
          value={stats.boxes || 0}
          change={12.5}
          icon={Package}
          color="green"
        />
        <StatsCard
          title="Items Disponibles"
          value={stats.items || 0}
          change={8.2}
          icon={Image}
          color="blue"
        />
        <StatsCard
          title="Utilisateurs"
          value={stats.users || 0}
          change={15.3}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions Rapides
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="flex-col h-20 gap-2" 
            onClick={onCreateBox}
          >
            <Plus size={20} />
            Nouvelle Box
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-20 gap-2" 
            onClick={onCreateItem}
          >
            <Image size={20} />
            Nouvel Item
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-20 gap-2" 
            onClick={() => onExport('boxes')}
          >
            <Download size={20} />
            Export
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-20 gap-2" 
            onClick={onNavigateToSystem}
          >
            <Settings size={20} />
            Système
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};