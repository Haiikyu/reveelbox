import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Download, CreditCard, User, Calendar, 
  TrendingUp, TrendingDown, DollarSign, Activity,
  Mail, Shield, Award, MapPin, Clock, Euro
} from 'lucide-react';
import { Card, Button } from './ui';
import { Profile, Transaction } from './types';

// Users Management Component
interface UsersManagementProps {
  users: Profile[];
  loading: boolean;
  searchQuery: string;
  onExport: () => void;
  formatDate: (date: string) => string;
}

export const UsersManagement = ({ 
  users, 
  loading, 
  searchQuery, 
  onExport,
  formatDate
}: UsersManagementProps) => {
  const filteredUsers = users.filter(user => 
    !searchQuery || 
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculs des statistiques réelles
  const totalCoinsInCirculation = users.reduce((sum, user) => sum + (user.coins_balance || 0), 0);
  const averageCoinsPerUser = users.length > 0 ? Math.round(totalCoinsInCirculation / users.length) : 0;
  const averageLevel = users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.level || 1), 0) / users.length) : 1;
  
  const activeUsersLast7Days = users.filter(user => {
    if (!user.updated_at) return false;
    const lastActive = new Date(user.updated_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastActive > weekAgo;
  }).length;

  const highValueUsers = users.filter(u => (u.coins_balance || 0) > 1000).length;
  const newUsersThisMonth = users.filter(user => {
    if (!user.created_at) return false;
    const created = new Date(user.created_at);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return created > monthAgo;
  }).length;

  return (
    <motion.div
      key="users"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Gestion des Utilisateurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {users.length} utilisateur(s) inscrit(s) • {activeUsersLast7Days} actifs cette semaine
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" icon={Download} onClick={onExport} size="lg">
            Export
          </Button>
        </div>
      </div>

      {/* Users Stats améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Utilisateurs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                +{newUsersThisMonth} ce mois
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs (7 jours)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeUsersLast7Days}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {users.length > 0 ? Math.round((activeUsersLast7Days / users.length) * 100) : 0}% du total
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coins Moyens</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {averageCoinsPerUser.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalCoinsInCirculation.toLocaleString()} total
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VIP Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{highValueUsers}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Niveau {averageLevel} moyen
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-16 text-center">
          <Users size={64} className="mx-auto mb-6 text-gray-400" />
          <h3 className="text-2xl font-medium text-gray-900 dark:text-white mb-3">
            Aucun utilisateur
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Les utilisateurs apparaîtront ici une fois inscrits
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      {(user.level || 1) > 5 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Award className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {user.username || 'Utilisateur anonyme'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {user.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                        )}
                        {user.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Inscrit le {formatDate(user.created_at)}
                          </span>
                        )}
                      </div>
                      {user.updated_at && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-400">
                            Dernière activité: {formatDate(user.updated_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {(user.coins_balance || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Coins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {user.level || 1}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Niveau</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {user.loyalty_points || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Points</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Transactions Management Component
interface TransactionsManagementProps {
  transactions: Transaction[];
  loading: boolean;
  onExport: () => void;
  formatDate: (date: string) => string;
  formatPrice: (price: number | null | undefined) => string;
}

export const TransactionsManagement = ({ 
  transactions, 
  loading, 
  onExport,
  formatDate,
  formatPrice
}: TransactionsManagementProps) => {
  const getTransactionTypeColor = (type: string | null) => {
    switch (type) {
      case 'purchase': 
      case 'purchase_box':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'box_opening': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'loyalty_exchange': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'refund': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionIcon = (type: string | null) => {
    switch (type) {
      case 'purchase':
      case 'purchase_box':
        return Euro;
      case 'box_opening': return Activity;
      case 'loyalty_exchange': return Award;
      case 'refund': return TrendingDown;
      default: return DollarSign;
    }
  };

  const getTransactionLabel = (type: string | null) => {
    switch (type) {
      case 'purchase': return 'Achat Coins';
      case 'purchase_box': return 'Achat Box';
      case 'box_opening': return 'Ouverture';
      case 'loyalty_exchange': return 'Échange Points';
      case 'refund': return 'Remboursement';
      default: return type || 'Inconnu';
    }
  };

  // Calculs des statistiques réelles pour transactions en euros uniquement
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const averageTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;
  const todayTransactions = transactions.filter(t => {
    if (!t.created_at) return false;
    const transactionDate = new Date(t.created_at);
    const today = new Date();
    return transactionDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const purchaseTransactions = transactions.filter(t => t.type === 'purchase' || t.type === 'purchase_box');
  const completedTransactions = transactions.filter(t => !!t.stripe_payment_id);

  return (
    <motion.div
      key="transactions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Transactions en Euros
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {transactions.length} transaction(s) monétaire(s) • {formatPrice(totalRevenue)}€ de revenus
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" icon={Download} onClick={onExport} size="lg">
            Export
          </Button>
        </div>
      </div>

      {/* Transaction Stats améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chiffre d'Affaires</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(totalRevenue)}€</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                +{formatPrice(todayRevenue)}€ aujourd'hui
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {todayTransactions.length} aujourd'hui
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Panier Moyen</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(averageTransaction)}€
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                {completedTransactions.length} complétées
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux Conversion</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {completedTransactions.length > 0 
                  ? Math.round((completedTransactions.length / transactions.length) * 100) 
                  : 0}%
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                {purchaseTransactions.length} achats
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-20"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <Card className="p-16 text-center">
          <Euro size={64} className="mx-auto mb-6 text-gray-400" />
          <h3 className="text-2xl font-medium text-gray-900 dark:text-white mb-3">
            Aucune transaction en euros
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Les transactions monétaires apparaîtront ici
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction, index) => {
            const Icon = getTransactionIcon(transaction.type);
            
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="p-6 hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {(transaction as any).profiles?.username || 'Utilisateur inconnu'}
                          </h3>
                          <span className={`px-3 py-1 text-xs rounded-full font-semibold border ${getTransactionTypeColor(transaction.type)}`}>
                            {getTransactionLabel(transaction.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                          {transaction.created_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(transaction.created_at)}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            transaction.stripe_payment_id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.stripe_payment_id ? 'Complétée' : 'Inconnue'}
                          </span>
                          {transaction.stripe_payment_id && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                              {transaction.stripe_payment_id.substring(0, 12)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        transaction.type === 'refund' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {transaction.type === 'refund' ? '-' : '+'}
                        {formatPrice(Math.abs(transaction.amount || 0))}€
                      </p>
                      {transaction.virtual_amount && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.virtual_amount} coins
                        </p>
                      )}
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