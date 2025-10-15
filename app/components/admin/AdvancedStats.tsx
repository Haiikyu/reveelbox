import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, DollarSign, Package, 
  Activity, Calendar, Clock, Target,
  Eye, Zap, Award, BarChart3
} from 'lucide-react';
import { Card, StatsCard } from './ui';
import { Profile, Transaction, LootBox, Item } from './types';

interface AdvancedStatsProps {
  users: Profile[];
  transactions: Transaction[];
  boxes: LootBox[];
  items: Item[];
  formatPrice: (price: number | null | undefined) => string;
  formatDate: (date: string) => string;
}

export const AdvancedStats = ({
  users,
  transactions,
  boxes,
  items,
  formatPrice,
  formatDate
}: AdvancedStatsProps) => {
  // Calculs des statistiques avancées
  const totalBoxesOpened = transactions.filter(t => t.type === 'box_opening').length;
  
  const totalCoinsInCirculation = users.reduce(
    (sum, user) => sum + (user.virtual_currency || 0),
    0
  );
  
  const activeUsersLast24h = users.filter(user => {
    if (!user.updated_at) return false;
    const lastActive = new Date(user.updated_at);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return lastActive > yesterday;
  }).length;
  
  const totalRevenue = transactions
    .filter(t => t.type === 'purchase' && t.stripe_payment_id)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  
  const averageBoxValue = boxes.length > 0 
    ? boxes.reduce((sum, box) => sum + (box.price_virtual || 0), 0) / boxes.length 
    : 0;
  
  const topSpenders = users
    .sort((a, b) => (b.coins_balance || 0) - (a.coins_balance || 0))
    .slice(0, 5);
  
  const recentActivity = transactions
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 10);
    
  // Statistiques par période
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayTransactions = transactions.filter(t => {
    if (!t.created_at) return false;
    const transactionDate = new Date(t.created_at);
    return transactionDate.toDateString() === today.toDateString();
  });
  
  const conversionRate = users.length > 0 
    ? (transactions.filter(t => t.type === 'purchase').length / users.length) * 100 
    : 0;

  return (
    <div className="space-y-8">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Boxes Ouvertes (Total)"
          value={totalBoxesOpened.toLocaleString()}
          change={12.5}
          icon={Package}
          color="green"
        />
        
        <StatsCard
          title="Utilisateurs Connectés (24h)"
          value={activeUsersLast24h.toString()}
          change={8.3}
          icon={Users}
          color="blue"
        />
        
        <StatsCard
          title="Coins en Circulation"
          value={totalCoinsInCirculation.toLocaleString()}
          change={15.7}
          icon={DollarSign}
          color="purple"
        />
        
        <StatsCard
          title="Revenus Total"
          value={`${formatPrice(totalRevenue)}€`}
          change={23.1}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activité Aujourd'hui
            </h3>
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Transactions</span>
              <span className="font-semibold">{todayTransactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenus</span>
              <span className="font-semibold text-green-600">
                {formatPrice(todayTransactions
                  .filter(t => t.type === 'purchase')
                  .reduce((sum, t) => sum + (t.amount || 0), 0)
                )}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Boxes ouvertes</span>
              <span className="font-semibold">
                {todayTransactions.filter(t => t.type === 'box_opening').length}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Métriques Business
            </h3>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Taux de conversion</span>
              <span className="font-semibold">{conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valeur box moyenne</span>
              <span className="font-semibold">{averageBoxValue.toFixed(0)} coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items disponibles</span>
              <span className="font-semibold">{items.length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance
            </h3>
            <Target className="h-5 w-5 text-purple-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Boxes actives</span>
              <span className="font-semibold">
                {boxes.filter(b => b.is_active).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Boxes featured</span>
              <span className="font-semibold">
                {boxes.filter(b => b.is_featured).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">FreeDrop boxes</span>
              <span className="font-semibold">
                {boxes.filter(b => b.is_daily_free).length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Spenders et Activité Récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Spenders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Utilisateurs (Coins)
            </h3>
            <Award className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="space-y-4">
            {topSpenders.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                    ${index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300'}
                  `}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.username || 'Utilisateur anonyme'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Niveau {user.level || 1}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {(user.coins_balance || 0).toLocaleString()} coins
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.loyalty_points || 0} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activité Récente */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activité Récente
            </h3>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {recentActivity.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-2 h-2 rounded-full
                    ${transaction.type === 'purchase' ? 'bg-green-500' :
                      transaction.type === 'box_opening' ? 'bg-blue-500' :
                      transaction.type === 'loyalty_exchange' ? 'bg-purple-500' :
                      'bg-gray-500'}
                  `}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {(transaction as any).profiles?.username || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.type} • {transaction.created_at && formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatPrice(transaction.amount || 0)}€
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Graphique de tendance (simplifié) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Évolution des Revenus (7 derniers jours)
        </h3>
        <div className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dayTransactions = transactions.filter(t => {
              if (!t.created_at) return false;
              const tDate = new Date(t.created_at);
              return tDate.toDateString() === date.toDateString();
            });
            
            const dayRevenue = dayTransactions
              .filter(t => t.type === 'purchase')
              .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            const maxRevenue = 1000; // Pour la représentation visuelle
            const percentage = Math.max((dayRevenue / maxRevenue) * 100, 5);
            
            return (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-gray-600">
                  {date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="bg-gradient-to-r from-green-500 to-teal-600 h-3 rounded-full"
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm font-medium text-gray-900">
                  {formatPrice(dayRevenue)}€
                </div>
              </div>
            );
          }).reverse()}
        </div>
      </Card>
    </div>
  );
};