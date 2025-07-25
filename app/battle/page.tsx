'use client';

import { useAuth } from '../components/AuthProvider';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Sword, Users, Plus, Search, Clock, Trophy, Zap, Eye, 
  Crown, User, Users2, Coins, ArrowRight, Play,
  Target, AlertCircle, CheckCircle, Timer, Gift, 
  Lock, Settings, Gamepad2, Loader2, Sparkles
} from 'lucide-react';

// Types
interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

interface Profile {
  id: string;
  username?: string;
  virtual_currency?: number;
  loyalty_points?: number;
}

interface LootBox {
  id: string;
  name: string;
  image_url?: string;
  price_virtual: number;
  rarity?: string;
  category?: string;
}

interface BattleParticipant {
  user_id: string;
  team?: number;
  is_ready: boolean;
  total_value?: number;
  user?: User;
}

interface BattleBox {
  quantity: number;
  order_position: number;
  loot_box?: LootBox;
}

interface Battle {
  id: string;
  mode: '1v1' | '2v2' | 'group';
  status: 'waiting' | 'countdown' | 'opening' | 'finished';
  max_players: number;
  entry_cost: number;
  total_prize: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
  expires_at: string;
  creator?: User;
  participants: BattleParticipant[];
  battle_boxes?: BattleBox[];
}

interface BattleFilters {
  mode: 'all' | '1v1' | '2v2' | 'group';
  status: 'all' | 'waiting' | 'countdown' | 'opening' | 'finished';
  priceRange: 'all' | 'low' | 'medium' | 'high';
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export default function BattlesListingPage() {
  const { user: authUser, profile: authProfile, loading: authLoading, isAuthenticated } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BattleFilters>({
    mode: 'all',
    status: 'waiting',
    priceRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<Notification>({ type: 'success', message: '' });
  
  const supabase = createClient();
  const router = useRouter();

  const showNotification = (type: Notification['type'], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: 'success', message: '' }), 4000);
  };

  // ✅ FONCTION UTILITAIRE POUR OBTENIR LA CURRENCY DE MANIERE SURE
  const getUserCurrency = (): number => {
    if (!authProfile || typeof authProfile.virtual_currency !== 'number') {
      return 0;
    }
    return authProfile.virtual_currency;
  };

  // ✅ FONCTION POUR VERIFIER SI L'UTILISATEUR PEUT SE PERMETTRE UNE BATTLE
  const canAffordBattle = (entryCost: number): boolean => {
    return getUserCurrency() >= entryCost;
  };

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Chargement des données
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadBattles();
      
      // Actualiser les battles toutes les 30 secondes
      const interval = setInterval(() => {
        loadBattles();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [authLoading, isAuthenticated]);

  // Temps réel
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const channel = supabase
        .channel('battles_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'battles'
          },
          () => {
            loadBattles();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, isAuthenticated, supabase]);

  const loadBattles = async () => {
    try {
      setLoading(true);
      
      // Requête avec fallback
      let battlesData: any[] = [];
      
      // Essayer d'abord la requête avec jointures
      const { data: joinedData, error: joinError } = await supabase
        .from('battles')
        .select(`
          *,
          creator:profiles!created_by(id, username),
          battle_participants(
            user_id,
            is_ready,
            team,
            total_value,
            user:profiles!user_id(id, username)
          )
        `)
        .neq('status', 'finished')
        .order('created_at', { ascending: false })
        .limit(20);

      if (joinError) {
        console.warn('Erreur requête avec jointures:', joinError);
        
        // Fallback: requête simple puis jointures manuelles
        const { data: simpleBattles, error: simpleError } = await supabase
          .from('battles')
          .select('*')
          .neq('status', 'finished')
          .order('created_at', { ascending: false })
          .limit(20);

        if (simpleError) {
          console.error('Erreur requête simple:', simpleError);
          setBattles([]);
          return;
        }

        if (!simpleBattles || simpleBattles.length === 0) {
          setBattles([]);
          return;
        }

        // Charger manuellement les données associées
        const battlesWithData = await Promise.all(
          simpleBattles.map(async (battle) => {
            // Charger le créateur
            const { data: creator } = await supabase
              .from('profiles')
              .select('id, username')
              .eq('id', battle.created_by)
              .single();

            // Charger les participants
            const { data: participants } = await supabase
              .from('battle_participants')
              .select('user_id, is_ready, team, total_value')
              .eq('battle_id', battle.id);

            // Charger les profils des participants
            const participantsWithUsers = await Promise.all(
              (participants || []).map(async (participant) => {
                const { data: user } = await supabase
                  .from('profiles')
                  .select('id, username')
                  .eq('id', participant.user_id)
                  .single();

                return {
                  ...participant,
                  user
                };
              })
            );

            return {
              ...battle,
              creator,
              participants: participantsWithUsers,
              expires_at: battle.expires_at || new Date(new Date(battle.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
            };
          })
        );

        battlesData = battlesWithData;
      } else {
        // Transformer les données de la requête avec jointures
        battlesData = (joinedData || []).map(battle => ({
          ...battle,
          participants: battle.battle_participants || [],
          expires_at: battle.expires_at || new Date(new Date(battle.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
        }));
      }

      setBattles(battlesData);

    } catch (error) {
      console.error('Erreur chargement battles:', error);
      setBattles([]);
      showNotification('error', 'Erreur lors du chargement des battles');
    } finally {
      setLoading(false);
    }
  };

  const joinBattle = async (battleId: string) => {
    if (!authUser || !authProfile) {
      showNotification('error', 'Vous devez être connecté');
      return;
    }

    const battle = battles.find(b => b.id === battleId);
    if (!battle) return;

    if (!canAffordBattle(battle.entry_cost)) {
      showNotification('error', 'Coins insuffisants pour rejoindre cette battle');
      return;
    }

    try {
      // Vérifier si l'utilisateur n'est pas déjà dans la battle
      const isAlreadyInBattle = battle.participants.some(p => p.user_id === authUser.id);
      if (isAlreadyInBattle) {
        router.push(`/battle/${battleId}`);
        return;
      }

      // Utiliser la fonction RPC pour rejoindre (avec fallback)
      let success = false;
      
      // Essayer d'abord join_battle
      const { error: joinError } = await supabase.rpc('join_battle', {
        p_battle_id: battleId
      });

      if (joinError) {
        console.warn('Erreur join_battle, essai join_simple_battle:', joinError);
        
        // Fallback vers join_simple_battle
        const { error: simpleJoinError } = await supabase.rpc('join_simple_battle', {
          p_battle_id: battleId
        });

        if (simpleJoinError) {
          throw simpleJoinError;
        }
        success = true;
      } else {
        success = true;
      }

      if (success) {
        showNotification('success', 'Battle rejointe avec succès !');
        router.push(`/battle/${battleId}`);
      }

    } catch (error: any) {
      console.error('Erreur rejoindre battle:', error);
      showNotification('error', error.message || 'Erreur lors de la jonction à la battle');
    }
  };
  
  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <div className="pt-24 pb-8">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Loader2 className="h-12 w-12 text-green-500 mx-auto" />
              </motion.div>
              <p className="text-gray-600 text-lg">
                {authLoading ? 'Vérification authentification...' : 'Chargement des battles...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtrage des battles
  const filteredBattles = battles.filter(battle => {
    if (filters.mode !== 'all' && battle.mode !== filters.mode) return false;
    if (filters.status !== 'all' && battle.status !== filters.status) return false;
    
    if (filters.priceRange !== 'all') {
      const price = battle.entry_cost;
      if (filters.priceRange === 'low' && price > 100) return false;
      if (filters.priceRange === 'medium' && (price < 100 || price > 300)) return false;
      if (filters.priceRange === 'high' && price < 300) return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!battle.creator?.username?.toLowerCase().includes(searchLower)) return false;
    }

    return true;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expiré';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}min`;
  };

  const getStatusDisplay = (status: Battle['status']) => {
    const configs = {
      waiting: { label: 'En attente', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Clock },
      countdown: { label: 'Démarrage', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: Timer },
      opening: { label: 'En cours', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', icon: Play },
      finished: { label: 'Terminée', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30', icon: Trophy }
    };
    return configs[status] || configs.waiting;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Notification */}
          <AnimatePresence>
            {notification.message && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${
                  notification.type === 'error' 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}
              >
                {notification.type === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Hero */}
          <section className="py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-20 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Sword className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl" />
                </div>
              </div>
              
              <div>
                <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent">
                  PvP Battles
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Affrontez d'autres joueurs dans des duels épiques ! Ouvrez simultanément vos loot boxes et 
                  remportez <span className="text-green-600 font-semibold">TOUT</span> si vous obtenez la plus grosse valeur.
                </p>
              </div>

              {/* Stats rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-8">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-600">{battles.filter(b => b.status === 'waiting').length}</div>
                  <div className="text-xs text-gray-600">En attente</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-600">{battles.filter(b => b.status === 'opening').length}</div>
                  <div className="text-xs text-gray-600">En cours</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-600">{battles.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="text-2xl font-bold text-yellow-600">{getUserCurrency().toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Vos coins</div>
                </div>
              </div>

              {/* Actions principales */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <motion.button
                  onClick={() => router.push('/battle/create')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Créer une Battle
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const availableBattle = battles.find(b => 
                      b.status === 'waiting' && 
                      b.participants.length < b.max_players &&
                      canAffordBattle(b.entry_cost) &&
                      !b.participants.some(p => p.user_id === authUser?.id)
                    );
                    
                    if (availableBattle) {
                      joinBattle(availableBattle.id);
                    } else {
                      showNotification('error', 'Aucune battle disponible pour un match rapide');
                    }
                  }}
                  className="px-8 py-4 border-2 border-green-500 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Match Rapide
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </section>

          {/* Filtres et recherche */}
          <section className="mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Rechercher par créateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <select
                    value={filters.mode}
                    onChange={(e) => setFilters(prev => ({ ...prev, mode: e.target.value as any }))}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                  >
                    <option value="all">Tous modes</option>
                    <option value="1v1">1v1</option>
                    <option value="2v2">2v2</option>
                    <option value="group">Battle Royale</option>
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="waiting">En attente</option>
                    <option value="opening">En cours</option>
                    <option value="finished">Terminées</option>
                  </select>

                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value as any }))}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                  >
                    <option value="all">Tous prix</option>
                    <option value="low">0-100 coins</option>
                    <option value="medium">100-300 coins</option>
                    <option value="high">300+ coins</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Liste des battles */}
          <section className="space-y-4">
            <AnimatePresence>
              {filteredBattles.map((battle, index) => {
                const statusConfig = getStatusDisplay(battle.status);
                const StatusIcon = statusConfig.icon;
                const canJoin = battle.status === 'waiting' && 
                              battle.participants.length < battle.max_players &&
                              canAffordBattle(battle.entry_cost) &&
                              !battle.participants.some(p => p.user_id === authUser?.id);
                
                return (
                  <motion.div
                    key={battle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-2xl hover:border-green-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full">
                            {battle.mode === '1v1' ? (
                              <User className="h-4 w-4 text-green-600" />
                            ) : battle.mode === '2v2' ? (
                              <Users2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Users className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm font-medium text-green-600">
                              {battle.mode === 'group' ? 'BATTLE ROYALE' : battle.mode.toUpperCase()}
                            </span>
                          </div>

                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border}`}>
                            <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                            <span className={`text-sm font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {battle.is_private && (
                            <div className="flex items-center gap-1 text-purple-600">
                              <Lock className="h-4 w-4" />
                              <span className="text-sm">Privée</span>
                            </div>
                          )}
                        </div>

                        {battle.status === 'waiting' && battle.expires_at && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Expire dans</div>
                            <div className="text-lg font-bold text-orange-600">
                              {formatTime(battle.expires_at)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-lg">
                                {battle.creator?.username?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            {battle.creator?.id === authUser?.id && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-lg">
                              {battle.creator?.username || 'Joueur anonyme'}
                            </div>
                            <div className="text-sm text-gray-500">Créateur de la battle</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Prix d&apos;entrée</div>
                          <div className="flex items-center justify-center gap-1">
                            <Coins className="h-5 w-5 text-yellow-600" />
                            <span className="font-bold text-gray-900 text-lg">{battle.entry_cost}</span>
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Prize Pool</div>
                          <div className="flex items-center justify-center gap-1">
                            <Trophy className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-green-600 text-lg">{battle.total_prize}</span>
                          </div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Joueurs</div>
                          <div className="font-bold text-gray-900 text-lg">
                            {battle.participants.length}/{battle.max_players}
                          </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Spectateurs</div>
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="h-5 w-5 text-purple-600" />
                            <span className="font-bold text-gray-900 text-lg">{Math.floor(Math.random() * 50) + 5}</span>
                          </div>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="mb-6">
                        <div className="text-sm text-gray-600 mb-3 font-medium">Participants :</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Array.from({ length: battle.max_players }).map((_, slotIndex) => {
                            const participant = battle.participants[slotIndex];
                            
                            if (!participant) {
                              return (
                                <div key={slotIndex} className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-xl">
                                  <div className="h-10 w-10 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div className="text-sm text-gray-500">En attente...</div>
                                </div>
                              );
                            }

                            return (
                              <div key={slotIndex} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="relative">
                                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white text-sm font-bold">
                                      {participant.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                  {participant.is_ready && battle.status === 'waiting' && (
                                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white" />
                                  )}
                                  {participant.user_id === authUser?.id && (
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white">●</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {participant.user?.username || 'Joueur'}
                                    {participant.user_id === authUser?.id && (
                                      <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Vous</span>
                                    )}
                                  </div>
                                  {battle.mode === '2v2' && (
                                    <div className="text-xs text-gray-500">
                                      Équipe {participant.team}
                                    </div>
                                  )}
                                  {participant.is_ready && battle.status === 'waiting' && (
                                    <div className="text-xs text-green-600 font-medium">Prêt</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        {battle.status === 'waiting' && canJoin && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => joinBattle(battle.id)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Sword className="h-5 w-5" />
                            Rejoindre ({battle.entry_cost} coins)
                          </motion.button>
                        )}
                        
                        {battle.status !== 'waiting' && (
                          <button
                            onClick={() => router.push(`/battle/${battle.id}`)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <Play className="h-5 w-5" />
                            {battle.status === 'finished' ? 'Voir résultats' : 'Regarder battle'}
                          </button>
                        )}
                        
                        {battle.status === 'waiting' && !canJoin && battle.participants.some(p => p.user_id === authUser?.id) && (
                          <button
                            onClick={() => router.push(`/battle/${battle.id}`)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <Target className="h-5 w-5" />
                            Rejoindre la battle room
                          </button>
                        )}
                        
                        {battle.status === 'waiting' && !canJoin && !battle.participants.some(p => p.user_id === authUser?.id) && !canAffordBattle(battle.entry_cost) && (
                          <button
                            disabled
                            className="flex-1 bg-gray-300 text-gray-500 px-6 py-4 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Coins className="h-5 w-5" />
                            Coins insuffisants
                          </button>
                        )}
                        
                        <button
                          onClick={() => router.push(`/battle/${battle.id}`)}
                          className="px-6 py-4 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="h-5 w-5" />
                          Détails
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* No results */}
            {filteredBattles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12">
                  <div className="relative inline-block mb-6">
                    <Gamepad2 className="h-20 w-20 text-green-500 mx-auto" />
                    <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucune battle trouvée</h3>
                  <p className="text-gray-600 mb-8">
                    {battles.length === 0 
                      ? "Aucune battle active pour le moment. Soyez le premier à créer une battle !"
                      : "Modifiez vos filtres ou créez une nouvelle battle pour commencer !"
                    }
                  </p>
                  <motion.button
                    onClick={() => router.push('/battle/create')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                    Créer une Battle
                  </motion.button>
                </div>
              </motion.div>
            )}
          </section>

          {/* Section d'inspiration */}
          <section className="mt-16">
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-200 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-green-500" />
                  Prêt pour l&apos;action ?
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Rejoignez des milliers de joueurs dans des battles épiques ! Ouvrez vos loot boxes, 
                  collectionnez des objets rares et devenez le champion ultime.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <motion.button
                  onClick={() => {
                    const waitingBattle = battles.find(b => 
                      b.status === 'waiting' && 
                      b.participants.length < b.max_players &&
                      canAffordBattle(b.entry_cost) &&
                      !b.participants.some(p => p.user_id === authUser?.id)
                    );
                    
                    if (waitingBattle) {
                      joinBattle(waitingBattle.id);
                    } else {
                      showNotification('error', 'Aucune battle disponible pour un match rapide');
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <Zap className="h-5 w-5" />
                  Match Rapide
                </motion.button>
                
                <motion.button
                  onClick={() => router.push('/battle/create')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <Settings className="h-5 w-5" />
                  Battle Personnalisée
                </motion.button>
              </div>

              {/* Conseils et astuces */}
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-white border border-green-200 rounded-xl">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Récompenses Epic</h4>
                  <p className="text-sm text-gray-600">
                    Le gagnant remporte TOUS les objets de la battle
                  </p>
                </div>
                <div className="p-4 bg-white border border-blue-200 rounded-xl">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Modes Variés</h4>
                  <p className="text-sm text-gray-600">
                    1v1, 2v2 ou Battle Royale selon vos préférences
                  </p>
                </div>
                <div className="p-4 bg-white border border-purple-200 rounded-xl">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">100% Fair Play</h4>
                  <p className="text-sm text-gray-600">
                    Algorithme certifié équitable pour tous les joueurs
                  </p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg p-3 inline-block">
                  💡 <span className="font-medium">Astuce :</span> Plus votre mise est élevée, plus les récompenses sont importantes !
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}