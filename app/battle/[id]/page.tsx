'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Users, Crown, Sword, Trophy, Timer, Eye, 
  MessageSquare, Send, Coins, Gift, Volume2, VolumeX,
  Share2, Settings, Target, Play,
  CheckCircle, AlertCircle, Loader2, Sparkles, Star
} from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';

// Types
interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

interface Profile {
  id: string;
  username?: string;
  virtual_currency: number;
  total_exp: number;
}

interface Item {
  id: string;
  name: string;
  rarity: string;
  market_value: number;
  image_url?: string;
  category?: string;
}

interface BattleBox {
  id: string;
  name: string;
  image_url?: string;
  price_virtual: number;
}

interface BattleParticipant {
  user_id: string;
  battle_id: string;
  team?: number;
  is_ready: boolean;
  total_value?: number;
  joined_at: string;
  user?: User;
  items?: OpenedItem[];
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
  finished_at?: string;
  winner_id?: string;
  current_box: number;
  total_boxes: number;
  creator?: User;
  participants: BattleParticipant[];
  battle_boxes?: BattleBox[];
}

interface OpenedItem {
  id: string;
  name: string;
  value: number;
  rarity: string;
  quantity: number;
  image_url?: string;
  category?: string;
  order?: number;
}

interface OpeningResult {
  items: OpenedItem[];
  totalValue: number;
  participant: BattleParticipant;
}

interface ChatMessage {
  id: string | number;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

export default function EpicBattleRoomPage() {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'opening' | 'results'>('waiting');
  const [countdown, setCountdown] = useState(0);
  const [openingResults, setOpeningResults] = useState<Record<string, OpeningResult>>({});
  const [winnerResults, setWinnerResults] = useState<OpeningResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [notification, setNotification] = useState<Notification>({ type: 'success', message: '' });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentBox, setCurrentBox] = useState(0);
  const [currentlyOpeningBox, setCurrentlyOpeningBox] = useState(0);
  const [revealedItems, setRevealedItems] = useState<Record<string, OpenedItem[]>>({});
  const [battleLoading, setBattleLoading] = useState(true);

  const params = useParams();
  const battleId = params?.id as string;
  const supabase = createClient();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const showNotification = (type: Notification['type'], message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: 'success', message: '' }), 4000);
  };

  // Protection de route selon le standard
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // 🔧 FONCTION CORRIGÉE POUR CHARGER LA BATTLE ROOM
  const loadBattleRoom = async (battleId: string) => {
    try {
      setBattleLoading(true);
      
      // Gestion des requêtes avec fallback selon le standard
      let battleData = null;
      let error = null;

      try {
        // Essayer d'abord requête avec jointures
        const { data: battle, error: battleError } = await supabase
          .from('battles')
          .select('*')
          .eq('id', battleId)
          .single();

        if (battleError || !battle) {
          throw new Error('Battle introuvable');
        }

        // Charger le créateur
        const { data: creator } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', battle.created_by)
          .single();

        // Charger les participants avec leurs profils
        const { data: participants } = await supabase
          .from('battle_participants')
          .select('*')
          .eq('battle_id', battleId);

        const participantsWithUsers = await Promise.all(
          (participants || []).map(async (participant) => {
            const { data: user } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', participant.user_id)
              .single();

            return {
              ...participant,
              user
            };
          })
        );

        // Charger les boxes de la battle
        const { data: battleBoxes } = await supabase
          .from('battle_boxes')
          .select(`
            *,
            loot_boxes(id, name, image_url, price_virtual)
          `)
          .eq('battle_id', battleId);

        battleData = {
          ...battle,
          creator,
          participants: participantsWithUsers,
          battle_boxes: battleBoxes
        };

        setBattle(battleData);
        setParticipants(participantsWithUsers);
        setCurrentBox(battle.current_box || 0);
        
        // Vérifier si l'utilisateur actuel participe
        const userParticipant = participantsWithUsers.find(p => p.user_id === user?.id);
        if (userParticipant) {
          setIsReady(userParticipant.is_ready);
        }

        // Définir l'état du jeu selon le statut de la battle
        switch (battle.status) {
          case 'waiting':
            setGameState('waiting');
            break;
          case 'countdown':
            setGameState('countdown');
            setCountdown(3);
            break;
          case 'opening':
            setGameState('opening');
            setCurrentlyOpeningBox(battle.current_box || 1);
            break;
          case 'finished':
            setGameState('results');
            await loadBattleResults();
            break;
        }

      } catch (fetchError) {
        console.error('Erreur chargement battle room:', fetchError);
        showNotification('error', 'Battle introuvable ou erreur de chargement');
        router.push('/battle');
      }

    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', 'Battle introuvable ou erreur de chargement');
      router.push('/battle');
    } finally {
      setBattleLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    if (!battleId) {
      router.push('/battle');
      return;
    }

    if (isAuthenticated && user) {
      loadBattleRoom(battleId);
    }
  }, [battleId, isAuthenticated, user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!battle || !user) return;

    const channel = supabase
      .channel(`battle-${battle.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battle.id}`
        },
        (payload) => {
          console.log('Participant update:', payload);
          loadParticipants();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${battle.id}`
        },
        (payload) => {
          console.log('Battle update:', payload);
          const newBattle = payload.new as Battle;
          setBattle(prev => prev ? { ...prev, ...newBattle } : null);
          
          if (newBattle.status === 'countdown') {
            setGameState('countdown');
            setCountdown(3);
          } else if (newBattle.status === 'opening') {
            setGameState('opening');
            setCurrentBox(newBattle.current_box || 0);
            setCurrentlyOpeningBox(newBattle.current_box || 1);
          } else if (newBattle.status === 'finished') {
            setGameState('results');
            loadBattleResults();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_messages',
          filter: `battle_id=eq.${battle.id}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          setChatMessages(prev => [...prev, {
            id: newMessage.id,
            user_id: newMessage.user_id,
            username: newMessage.username,
            message: newMessage.message,
            timestamp: newMessage.created_at
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battle?.id, user?.id, supabase]);

  const loadParticipants = async () => {
    if (!battle) return;

    try {
      const { data: participants, error } = await supabase
        .from('battle_participants')
        .select('*')
        .eq('battle_id', battle.id);

      if (error) {
        console.error('Erreur chargement participants:', error);
        return;
      }

      if (participants) {
        const participantsWithUsers = await Promise.all(
          participants.map(async (participant) => {
            const { data: user } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', participant.user_id)
              .single();

            return {
              ...participant,
              user
            };
          })
        );

        setParticipants(participantsWithUsers);
        
        // Mettre à jour l'état ready de l'utilisateur actuel
        const userParticipant = participantsWithUsers.find(p => p.user_id === user?.id);
        if (userParticipant) {
          setIsReady(userParticipant.is_ready);
        }
      }
    } catch (error) {
      console.error('Erreur chargement participants:', error);
    }
  };

  const loadBattleResults = async () => {
    if (!battle) return;

    try {
      const { data, error } = await supabase
        .from('battle_openings')
        .select(`
          *,
          item:items(*)
        `)
        .eq('battle_id', battle.id)
        .order('opened_at');

      if (error) {
        console.error('Erreur chargement résultats:', error);
        return;
      }

      if (data) {
        // Organiser les résultats par participant
        const results: Record<string, OpeningResult> = {};
        
        data.forEach((opening: any) => {
          if (!results[opening.user_id]) {
            const participant = participants.find(p => p.user_id === opening.user_id);
            results[opening.user_id] = {
              items: [],
              totalValue: 0,
              participant: participant || { user_id: opening.user_id, battle_id: battle.id, is_ready: true, joined_at: '' }
            };
          }
          
          const item: OpenedItem = {
            id: opening.item.id,
            name: opening.item.name,
            value: opening.item.market_value || 0,
            rarity: opening.item.rarity,
            quantity: 1,
            image_url: opening.item.image_url,
            category: opening.item.category,
            order: opening.box_number
          };
          
          results[opening.user_id].items.push(item);
          results[opening.user_id].totalValue += item.value;
        });

        setOpeningResults(results);
        setRevealedItems(Object.fromEntries(
          Object.entries(results).map(([userId, result]) => [userId, result.items])
        ));

        // Déterminer le gagnant
        const winner = Object.values(results).reduce((prev, current) => 
          (prev.totalValue || 0) > (current.totalValue || 0) ? prev : current
        );
        
        if (winner) {
          setWinnerResults(winner);
        }
      }
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && gameState === 'countdown') {
      startBattleOpening();
    }
  }, [countdown, gameState]);

  const toggleReady = async () => {
    if (!user || !battle) return;

    try {
      const newReadyState = !isReady;
      
      const { error } = await supabase
        .from('battle_participants')
        .update({ is_ready: newReadyState })
        .eq('battle_id', battle.id)
        .eq('user_id', user.id);

      if (error) {
        showNotification('error', 'Erreur lors de la mise à jour');
        return;
      }

      setIsReady(newReadyState);
      showNotification('success', newReadyState ? 'Vous êtes prêt !' : 'Statut mis à jour');

      // Vérifier si tous les joueurs sont prêts
      const updatedParticipants = participants.map(p => 
        p.user_id === user.id ? { ...p, is_ready: newReadyState } : p
      );
      
      const allReady = updatedParticipants.every(p => p.is_ready);
      const hasMinPlayers = updatedParticipants.length >= 2;
      
      if (allReady && hasMinPlayers && battle.status === 'waiting') {
        // Démarrer la battle
        await supabase
          .from('battles')
          .update({ status: 'countdown' })
          .eq('id', battle.id);
      }

    } catch (error) {
      console.error('Erreur toggle ready:', error);
      showNotification('error', 'Erreur lors de la mise à jour');
    }
  };

  const startBattleOpening = async () => {
    if (!battle || !user) return;

    try {
      // Marquer la battle comme en cours d'ouverture
      await supabase
        .from('battles')
        .update({ 
          status: 'opening',
          current_box: 1
        })
        .eq('id', battle.id);

      // Appeler la fonction RPC pour ouvrir les boîtes
      const { data, error } = await supabase.rpc('open_battle_boxes', {
        p_battle_id: battle.id
      });

      if (error) {
        console.error('Erreur ouverture boxes:', error);
        showNotification('error', 'Erreur lors de l\'ouverture des boîtes');
        return;
      }

      console.log('Résultats ouverture:', data);

    } catch (error) {
      console.error('Erreur start battle:', error);
      showNotification('error', 'Erreur lors du démarrage');
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-2xl shadow-yellow-500/50 ring-4 ring-yellow-400/30';
      case 'epic': return 'shadow-2xl shadow-purple-500/50 ring-4 ring-purple-400/30';
      case 'rare': return 'shadow-2xl shadow-blue-500/50 ring-4 ring-blue-400/30';
      default: return 'shadow-lg shadow-gray-500/20 ring-2 ring-gray-400/20';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-br from-yellow-900/40 via-orange-900/40 to-yellow-900/40 border-yellow-400/60';
      case 'epic': return 'bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40 border-purple-400/60';
      case 'rare': return 'bg-gradient-to-br from-blue-900/40 via-cyan-900/40 to-blue-900/40 border-blue-400/60';
      default: return 'bg-gradient-to-br from-gray-800/60 to-gray-700/60 border-gray-500/60';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  // Composant Roulette
  const BoxOpeningRoulette: React.FC<{
    participant: BattleParticipant;
    isWinner?: boolean;
  }> = ({ participant, isWinner = false }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentItem, setCurrentItem] = useState<OpenedItem | null>(null);

    useEffect(() => {
      if (gameState === 'opening' && currentlyOpeningBox > 0) {
        const result = openingResults[participant.user_id];
        if (result && result.items[currentlyOpeningBox - 1]) {
          setIsAnimating(true);
          
          setTimeout(() => {
            setCurrentItem(result.items[currentlyOpeningBox - 1]);
            setIsAnimating(false);
          }, 2000);
        }
      }
    }, [currentlyOpeningBox, gameState, participant.user_id, openingResults]);

    const participantTotalValue = participant.total_value || 0;

    return (
      <div className={`mb-8 p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 ${
        isWinner 
          ? 'bg-gradient-to-br from-yellow-900/30 via-orange-900/20 to-yellow-900/30 border-yellow-400 shadow-2xl shadow-yellow-500/30' 
          : 'bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 border-gray-600'
      }`}>
        
        {/* Header joueur */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div 
                className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                  isWinner 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                {participant?.user?.username?.charAt(0)?.toUpperCase() || '?'}
              </motion.div>
              {isWinner && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-2 -right-2 h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Crown className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </div>
            <div>
              <div className="font-bold text-white text-xl flex items-center gap-2">
                {participant?.user?.username || 'Joueur'}
                {participant?.user_id === user?.id && (
                  <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-full">Vous</span>
                )}
                {battle?.mode === '2v2' && participant?.team && (
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    participant.team === 1 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    Team {participant.team}
                  </span>
                )}
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl flex items-center gap-2 mt-2"
              >
                <Coins className="h-6 w-6 text-yellow-500" />
                <span className="font-bold text-yellow-400">
                  ${participantTotalValue.toFixed(0)}
                </span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Zone d'ouverture de boîte */}
        <div className="relative h-48 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 rounded-2xl border-2 border-gray-600 overflow-hidden">
          {gameState === 'waiting' || gameState === 'countdown' ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Gift className="h-20 w-20" />
              </motion.div>
              <span className="text-xl font-medium">En attente...</span>
            </div>
          ) : gameState === 'opening' ? (
            <div className="h-full flex items-center justify-center">
              {isAnimating ? (
                <motion.div
                  animate={{ 
                    rotateY: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-center"
                >
                  <Gift className="h-32 w-32 text-green-500 mx-auto mb-4" />
                  <div className="text-green-400 font-bold text-lg">
                    Ouverture box {currentlyOpeningBox}...
                  </div>
                </motion.div>
              ) : currentItem ? (
                <motion.div
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`text-center p-6 rounded-2xl border-4 ${getRarityBg(currentItem.rarity)} ${getRarityGlow(currentItem.rarity)}`}
                >
                  {currentItem.image_url ? (
                    <img
                      src={currentItem.image_url}
                      alt={currentItem.name}
                      className="w-32 h-24 object-contain mx-auto mb-4 rounded-lg"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  ) : (
                    <Gift className="h-24 w-32 mx-auto mb-4 text-gray-300" />
                  )}
                  <div className="text-lg font-bold text-white mb-2">{currentItem.name}</div>
                  <div className="text-2xl font-bold text-yellow-400">${currentItem.value}</div>
                </motion.div>
              ) : (
                <div className="text-gray-400 text-lg">En attente...</div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <Trophy className="h-20 w-20 mr-4" />
              <span className="text-xl">Battle terminée</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant Liste des Items Gagnés
  const ItemsList: React.FC<{ participant: BattleParticipant }> = ({ participant }) => {
    const items = revealedItems[participant.user_id] || [];
    
    if (items.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6"
      >
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          Items gagnés ({items.length}/{battle?.total_boxes || 0})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((item, index) => (
            <motion.div
              key={`${item.id}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border-2 ${getRarityBg(item.rarity)} ${
                index === items.length - 1 && gameState === 'opening' ? getRarityGlow(item.rarity) : ''
              }`}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-16 object-contain rounded mb-2"
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              ) : (
                <div className="w-full h-16 bg-gray-600 rounded mb-2 flex items-center justify-center">
                  <Gift className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="text-xs font-medium text-white truncate mb-1">
                {item.name}
              </div>
              <div className="text-sm font-bold text-yellow-400">
                ${item.value}
              </div>
              <div className={`text-xs ${getRarityColor(item.rarity)} capitalize`}>
                {item.rarity}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !user || !battle) return;

    try {
      const message = {
        battle_id: battle.id,
        user_id: user.id,
        message: currentMessage.trim(),
        username: profile?.username || user.username || 'Joueur'
      };

      const { error } = await supabase
        .from('battle_messages')
        .insert([message]);

      if (!error) {
        setCurrentMessage('');
        // Le message apparaîtra via la subscription realtime
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const copyBattleLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showNotification('success', 'Lien copié !');
    }
  };

  // Scroll automatique du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Loading state selon le standard
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (battleLoading || !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
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
              <p className="text-gray-400 text-lg">Chargement de la battle room...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalValue = Object.values(openingResults).reduce((sum, result) => sum + (result.totalValue || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Header battle */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-gray-800/90 via-gray-700/90 to-gray-800/90 border border-gray-600 rounded-xl p-6 mb-8 backdrop-blur-sm shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => router.push('/battle')}
                  className="p-3 hover:bg-gray-600 rounded-xl transition-colors group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="h-6 w-6 group-hover:text-green-400 transition-colors" />
                </motion.button>
                <div>
                  <div className="text-green-400 font-bold text-sm tracking-wider">BATTLE ROYALE</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    ${totalValue.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">Prize Pool Total</div>
                </div>
              </div>

              {/* Indicateur de progression */}
              <div className="text-center">
                <div className="text-lg font-bold text-white mb-2">
                  Box {currentBox}/{battle.total_boxes}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: battle.total_boxes }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i < currentBox 
                          ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50' 
                          : i === currentBox && gameState === 'opening'
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg shadow-yellow-500/50 animate-pulse'
                          : 'bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.2 }}
                    />
                  ))}
                </div>
                {gameState === 'opening' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-green-400 mt-2 font-medium"
                  >
                    Opening box {currentlyOpeningBox}...
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-green-400 flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/30">
                  <motion.div 
                    className="w-2 h-2 bg-green-400 rounded-full"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  LIVE
                </div>
                
                {/* Légende des raretés */}
                <div className="hidden md:flex gap-1">
                  {[
                    { rarity: 'legendary', color: 'bg-yellow-400', label: 'Legendary' },
                    { rarity: 'epic', color: 'bg-purple-400', label: 'Epic' },
                    { rarity: 'rare', color: 'bg-blue-400', label: 'Rare' },
                    { rarity: 'common', color: 'bg-gray-400', label: 'Common' }
                  ].map((item) => (
                    <motion.div 
                      key={item.rarity}
                      className={`w-4 h-4 rounded-full ${item.color}`}
                      whileHover={{ scale: 1.2 }}
                      title={item.label}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {soundEnabled ? <Volume2 className="h-5 w-5 text-green-400" /> : <VolumeX className="h-5 w-5 text-gray-400" />}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowChat(!showChat)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                    {chatMessages.length > 0 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold"
                      >
                        {chatMessages.length > 9 ? '9+' : chatMessages.length}
                      </motion.div>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={copyBattleLink}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Share2 className="h-5 w-5 text-purple-400" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification système */}
          <AnimatePresence>
            {notification.message && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm ${
                  notification.type === 'error' 
                    ? 'bg-red-900/90 text-red-100 border border-red-600/50' 
                    : 'bg-green-900/90 text-green-100 border border-green-600/50'
                }`}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {notification.type === 'error' ? (
                    <AlertCircle className="h-6 w-6" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                </motion.div>
                <span className="font-medium">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay de countdown */}
          <AnimatePresence>
            {gameState === 'countdown' && countdown > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <motion.div
                    key={countdown}
                    initial={{ scale: 3, opacity: 0, rotateX: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                    exit={{ scale: 0, opacity: 0, rotateX: -90 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="text-9xl font-black bg-gradient-to-br from-red-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent mb-8 drop-shadow-2xl"
                  >
                    {countdown}
                  </motion.div>
                  <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-3xl text-white font-bold"
                  >
                    La battle commence...
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* État d'attente */}
          {gameState === 'waiting' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="bg-gradient-to-br from-gray-800/90 via-gray-700/90 to-gray-800/90 rounded-2xl p-12 border border-gray-600 max-w-2xl mx-auto backdrop-blur-sm shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-8"
                >
                  <Sword className="h-20 w-20 text-green-400 mx-auto" />
                </motion.div>
                
                <h2 className="text-4xl font-black mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Battle Room
                </h2>
                
                <div className="text-gray-300 text-xl mb-8">
                  <span className="font-bold text-green-400">
                    {participants.filter(p => p.is_ready || (p.user_id === user?.id && isReady)).length}
                  </span>
                  <span className="text-gray-500 mx-2">/</span>
                  <span className="font-bold text-blue-400">{battle.max_players}</span>
                  <span className="ml-2">joueurs prêts</span>
                </div>
                
                <div className="space-y-4 mb-8">
                  {participants.map((participant, index) => {
                    const isCurrentUser = participant.user_id === user?.id;
                    const playerReady = isCurrentUser ? isReady : participant.is_ready;
                    
                    return (
                      <motion.div 
                        key={participant.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600/50 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                            whileHover={{ scale: 1.1 }}
                          >
                            <span className="text-white font-bold text-lg">
                              {participant.user?.username?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-lg">
                                {participant.user?.username || `Joueur ${index + 1}`}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs bg-gradient-to-r from-green-500 to-green-400 text-white px-3 py-1 rounded-full font-bold">
                                  VOUS
                                </span>
                              )}
                              {battle.mode === '2v2' && participant.team && (
                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                  participant.team === 1 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                  Team {participant.team}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              Coût d'entrée: {battle.entry_cost} coins
                            </div>
                          </div>
                        </div>
                        <motion.div 
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            playerReady
                              ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-lg shadow-green-500/30'
                              : 'bg-gray-600 text-gray-300'
                          }`}
                          animate={playerReady ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {playerReady ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              PRÊT
                            </div>
                          ) : (
                            'EN ATTENTE'
                          )}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.button
                  onClick={toggleReady}
                  className={`px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-2xl ${
                    isReady 
                      ? 'bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-white shadow-green-500/30' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white shadow-blue-500/30'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isReady ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle className="h-6 w-6" />
                      <span>PRÊT À COMBATTRE !</span>
                      <Sparkles className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Play className="h-6 w-6" />
                      <span>SE PRÉPARER</span>
                    </div>
                  )}
                </motion.button>

                {participants.filter(p => p.is_ready || (p.user_id === user?.id && isReady)).length === battle.max_players && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                  >
                    <div className="text-green-400 font-bold text-lg">
                      🎉 Tous les joueurs sont prêts ! La battle va commencer...
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Sections d'ouverture et résultats */}
          {(gameState === 'opening' || gameState === 'results') && (
            <div className="space-y-8">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.user_id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BoxOpeningRoulette
                    participant={participant}
                    isWinner={winnerResults?.participant.user_id === participant.user_id}
                  />
                  <ItemsList participant={participant} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Section gagnant */}
          {gameState === 'results' && winnerResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
              className="mt-16"
            >
              <div className="relative bg-gradient-to-br from-yellow-900/40 via-orange-900/40 to-red-900/40 rounded-3xl p-12 border-4 border-yellow-400/60 text-center backdrop-blur-sm shadow-2xl shadow-yellow-500/20 overflow-hidden">
                
                {/* Effet de particules */}
                <div className="absolute inset-0 overflow-hidden">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        y: [-20, -40, -20],
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="relative z-10 mb-8"
                >
                  <div className="relative inline-block">
                    <Trophy className="h-32 w-32 text-yellow-400 mx-auto mb-6" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-4 border-4 border-yellow-400/30 rounded-full"
                    />
                  </div>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="text-7xl font-black mb-6 bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl"
                >
                  🏆 WINNER! 🏆
                </motion.h2>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.6 }}
                  className="mb-8"
                >
                  <div className="text-5xl text-white mb-4 font-black">
                    {winnerResults.participant.user?.username}
                  </div>
                  <div className="text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                    ${(winnerResults.totalValue || 0).toFixed(0)}
                  </div>
                  <div className="text-xl text-yellow-200">
                    Valeur totale des objets gagnés
                  </div>
                </motion.div>

                {/* Stats détaillées */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 }}
                  className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {winnerResults.items && winnerResults.items.length > 0 && (
                    <>
                      <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-yellow-400">
                          {winnerResults.items.length}
                        </div>
                        <div className="text-gray-300">Items gagnés</div>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-purple-400">
                          ${Math.max(...winnerResults.items.map(item => item.value || 0))}
                        </div>
                        <div className="text-gray-300">Meilleur item</div>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-blue-400">
                          ${Math.round((winnerResults.totalValue || 0) / winnerResults.items.length)}
                        </div>
                        <div className="text-gray-300">Valeur moyenne</div>
                      </div>
                    </>
                  )}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                  className="flex gap-6 justify-center flex-wrap"
                >
                  <motion.button
                    onClick={() => router.push('/battle')}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-400 hover:from-red-400 hover:to-red-300 rounded-xl font-bold text-lg transition-all flex items-center gap-3 shadow-2xl shadow-red-500/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sword className="h-6 w-6" />
                    Nouvelle Battle
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/inventory')}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 rounded-xl font-bold text-lg transition-all flex items-center gap-3 shadow-2xl shadow-green-500/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Gift className="h-6 w-6" />
                    Voir Inventaire
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/profile')}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300 rounded-xl font-bold text-lg transition-all flex items-center gap-3 shadow-2xl shadow-purple-500/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Crown className="h-6 w-6" />
                    Profil
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Chat sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-96 bg-gradient-to-b from-gray-800/95 via-gray-700/95 to-gray-800/95 border-l border-gray-600 z-40 shadow-2xl backdrop-blur-lg"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-600 bg-gradient-to-r from-gray-900/90 to-gray-800/90">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl flex items-center gap-3 text-white">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    Battle Chat
                  </h3>
                  <motion.button
                    onClick={() => setShowChat(false)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✕
                  </motion.button>
                </div>
                <div className="text-sm text-gray-400 mt-2 flex items-center gap-4">
                  <span>{participants.length} participants</span>
                  <span>•</span>
                  <span>{chatMessages.length} messages</span>
                  <motion.div
                    className="w-2 h-2 bg-green-400 rounded-full ml-auto"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun message pour le moment</p>
                    <p className="text-sm">Soyez le premier à discuter !</p>
                  </div>
                )}
                <AnimatePresence>
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      className={`${
                        message.isSystem 
                          ? 'text-center text-sm bg-gradient-to-r from-yellow-900/30 via-orange-900/30 to-yellow-900/30 rounded-xl py-3 px-4 border border-yellow-600/40'
                          : `rounded-xl p-4 ${
                              message.user_id === user?.id 
                                ? 'bg-gradient-to-r from-blue-600/40 via-blue-500/40 to-blue-600/40 ml-6 border border-blue-500/40' 
                                : 'bg-gradient-to-r from-gray-700/60 via-gray-600/60 to-gray-700/60 mr-6 border border-gray-600/40'
                            }`
                      }`}
                    >
                      {!message.isSystem && (
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              message.user_id === user?.id ? 'bg-blue-500' : 'bg-gray-500'
                            }`}>
                              {message.username.charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-bold text-sm ${
                              message.user_id === user?.id ? 'text-blue-300' : 'text-gray-300'
                            }`}>
                              {message.username}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      <div className={`text-sm ${message.isSystem ? 'text-yellow-200 font-medium' : 'text-white'}`}>
                        {message.message}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-600 bg-gradient-to-r from-gray-900/90 to-gray-800/90">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Tapez votre message..."
                    maxLength={200}
                    className="flex-1 bg-gray-700/80 border border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim()}
                    className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg"
                    whileHover={currentMessage.trim() ? { scale: 1.05 } : {}}
                    whileTap={currentMessage.trim() ? { scale: 0.95 } : {}}
                  >
                    <Send className="h-5 w-5 text-white" />
                  </motion.button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {currentMessage.length}/200
                  </div>
                  <div className="text-xs text-gray-500">
                    Appuyez sur Entrée pour envoyer
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}