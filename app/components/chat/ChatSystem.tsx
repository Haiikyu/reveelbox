'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '../AuthProvider'; // Utiliser ton AuthProvider existant
import { 
  MessageCircle,
  Send,
  Users,
  X,
  Volume2,
  VolumeX,
  CheckCircle
} from 'lucide-react';

// Composants
import ChatMessage from './ChatMessage';
import GiveawayMessage from './GiveawayMessage';
import GiveawayModal from './GiveawayModal';
import AdminControls from './AdminControls';

// Types
interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'chat' | 'giveaway_announcement' | 'giveaway_join' | 'giveaway_results';
  level: number;
  isVip: boolean;
  isBot: boolean;
  userId: string;
}

interface ActiveGiveaway {
  id: string;
  amount: number;
  winnersCount: number;
  endsAt: Date;
  timeLeft: number;
}

const ChatSystem: React.FC = () => {
  // Utiliser ton AuthProvider existant
  const { user, profile, loading: authLoading } = useAuth();
  
  // États principaux
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  // États giveaway
  const [activeGiveaway, setActiveGiveaway] = useState<ActiveGiveaway | null>(null);
  const [showGiveawayModal, setShowGiveawayModal] = useState(false);
  const [hasParticipated, setHasParticipated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<any>(null);
  const giveawayChannelRef = useRef<any>(null);
  const supabase = createClient();

  // Calculer le niveau et si c'est un admin depuis ton profil existant
  const currentUser = profile ? {
    id: user?.id || '',
    username: profile.username || 'Utilisateur',
    level: Math.floor((profile.total_exp || 0) / 100) + 1,
    virtual_currency: profile.virtual_currency || 0,
    isAdmin: user?.email === 'admin@reveelbox.com'
  } : null;

  // Charger les messages
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          content,
          message_type,
          is_bot,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur chargement messages:', error);
        setMessages([]);
        return;
      }

      // Charger les profils séparément pour éviter les erreurs de relation
      const userIds = data?.filter(msg => msg.user_id).map(msg => msg.user_id) || [];
      let profilesMap = new Map();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, total_exp, avatar_url')
          .in('id', userIds);

        profiles?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      const formattedMessages = data?.reverse().map(msg => {
        const profile = profilesMap.get(msg.user_id);
        return {
          id: msg.id,
          username: profile?.username || (msg.is_bot ? 'ReveelBot' : 'Utilisateur'),
          message: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          type: msg.message_type || 'chat',
          level: Math.floor(((profile?.total_exp || 0) / 100)) + 1,
          isVip: (profile?.total_exp || 0) >= 2000,
          isBot: msg.is_bot || false,
          userId: msg.user_id || 'bot'
        };
      }) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setMessages([]);
    }
  }, []);

  // Charger le giveaway actif
  const loadActiveGiveaway = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('giveaways')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const timeLeft = Math.max(0, Math.floor((new Date(data.ends_at).getTime() - Date.now()) / 1000));
        
        if (timeLeft > 0) {
          setActiveGiveaway({
            id: data.id,
            amount: data.total_amount,
            winnersCount: data.winners_count,
            endsAt: new Date(data.ends_at),
            timeLeft
          });

          // Vérifier si l'utilisateur a déjà participé
          if (currentUser) {
            const { data: participation } = await supabase
              .from('giveaway_participants')
              .select('id')
              .eq('giveaway_id', data.id)
              .eq('user_id', currentUser.id)
              .single();
            
            setHasParticipated(!!participation);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du giveaway:', error);
    }
  }, [currentUser]);

  // Initialiser le chat en temps réel
  useEffect(() => {
    if (!isOpen || authLoading) return;

    loadMessages();
    loadActiveGiveaway();

    // Canal pour les nouveaux messages
    chatChannelRef.current = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        const newMsg = payload.new;
        
        // Récupérer les infos du profil si ce n'est pas un bot
        let profile = null;
        if (newMsg.user_id && !newMsg.is_bot) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, total_exp, avatar_url')
            .eq('id', newMsg.user_id)
            .single();
          profile = profileData;
        }

        const formattedMessage: Message = {
          id: newMsg.id,
          username: profile?.username || (newMsg.is_bot ? 'ReveelBot' : 'Utilisateur'),
          message: newMsg.content,
          timestamp: new Date(newMsg.created_at).getTime(),
          type: newMsg.message_type || 'chat',
          level: Math.floor(((profile?.total_exp || 0) / 100)) + 1,
          isVip: (profile?.total_exp || 0) >= 2000,
          isBot: newMsg.is_bot || false,
          userId: newMsg.user_id || 'bot'
        };

        setMessages(prev => [...prev.slice(-49), formattedMessage]);
        
        if (soundEnabled && newMsg.user_id !== currentUser?.id) {
          // Son de notification (optionnel)
        }
      })
      .subscribe();

    // Canal pour les giveaways
    giveawayChannelRef.current = supabase
      .channel('giveaways')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'giveaways'
      }, (payload) => {
        const giveaway = payload.new;
        if (giveaway.status === 'active') {
          setActiveGiveaway({
            id: giveaway.id,
            amount: giveaway.total_amount,
            winnersCount: giveaway.winners_count,
            endsAt: new Date(giveaway.ends_at),
            timeLeft: Math.floor((new Date(giveaway.ends_at).getTime() - Date.now()) / 1000)
          });
          setHasParticipated(false);
        }
      })
      .subscribe();

    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
      }
      if (giveawayChannelRef.current) {
        supabase.removeChannel(giveawayChannelRef.current);
      }
    };
  }, [isOpen, currentUser, soundEnabled, loadMessages, loadActiveGiveaway]);

  // Timer du giveaway
  useEffect(() => {
    if (activeGiveaway && activeGiveaway.timeLeft > 0) {
      const timer = setTimeout(() => {
        setActiveGiveaway(prev => prev ? {
          ...prev,
          timeLeft: prev.timeLeft - 1
        } : null);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeGiveaway && activeGiveaway.timeLeft <= 0) {
      setActiveGiveaway(null);
      setHasParticipated(false);
    }
  }, [activeGiveaway]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    if (currentUser.level < 2) {
      alert('Niveau 2 minimum requis pour écrire dans le chat');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: currentUser.id,
          content: newMessage.trim(),
          message_type: 'chat'
        });

      if (error) {
        console.error('Erreur envoi message:', error);
        alert('Erreur lors de l\'envoi du message');
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  // Lancer un giveaway (admin)
  const startGiveaway = async () => {
    if (!currentUser?.isAdmin) {
      alert('Accès admin requis');
      return;
    }

    try {
      const endsAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      const { data, error } = await supabase
        .from('giveaways')
        .insert({
          title: 'Giveaway ReveelBox',
          total_amount: 2, // 2 coins
          winners_count: 10,
          min_level: 2,
          ends_at: endsAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur création giveaway:', error);
        alert(`Erreur lors du lancement du giveaway: ${error.message}`);
        return;
      }

      // Message automatique dans le chat
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: null,
          content: `🎉 NOUVEAU GIVEAWAY ! 🎉\n💰 2 Coins à partager entre 10 gagnants\n⏰ Le giveaway se termine dans 5 minutes\n🎯 Cliquez sur le bouton pour participer !`,
          message_type: 'giveaway_announcement',
          is_bot: true
        });

      if (messageError) {
        console.error('Erreur message giveaway:', messageError);
      }

    } catch (error) {
      console.error('Erreur lors du lancement du giveaway:', error);
      alert('Erreur lors du lancement du giveaway');
    }
  };

  // Participer au giveaway
  const participateGiveaway = () => {
    if (!currentUser) {
      alert('Vous devez être connecté pour participer');
      return;
    }
    if (currentUser.level < 2) {
      alert('Niveau 2 minimum requis pour participer');
      return;
    }
    if (hasParticipated) {
      alert('Vous participez déjà à ce giveaway');
      return;
    }
    if (!activeGiveaway) {
      alert('Aucun giveaway actif');
      return;
    }

    setShowGiveawayModal(true);
  };

  // Valider la participation
  const validateParticipation = async (captchaAnswer: string) => {
    if (!activeGiveaway || !currentUser) return;

    try {
      // Enregistrer la participation
      const { error } = await supabase
        .from('giveaway_participants')
        .insert({
          giveaway_id: activeGiveaway.id,
          user_id: currentUser.id
        });

      if (error) throw error;

      setHasParticipated(true);
      
      // Message de confirmation
      await supabase
        .from('chat_messages')
        .insert({
          user_id: null,
          content: `✅ ${currentUser.username} a rejoint le giveaway !`,
          message_type: 'giveaway_join',
          is_bot: true
        });

    } catch (error) {
      console.error('Erreur lors de la participation:', error);
      throw error;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (msg: Message) => {
    const isGiveawayMessage = ['giveaway_announcement', 'giveaway_join', 'giveaway_results'].includes(msg.type);
    
if (isGiveawayMessage) {
  return (
    <GiveawayMessage
      key={msg.id}
      message={msg as {
        id: string;
        username: string;
        message: string;
        timestamp: number;
        type: "giveaway_announcement" | "giveaway_join" | "giveaway_results";
      }}
      activeGiveaway={activeGiveaway}
      hasParticipated={hasParticipated}
      onParticipate={participateGiveaway}
      currentUser={currentUser}
    />
  );
}


    return (
      <ChatMessage
        key={msg.id}
        message={msg}
        currentUserId={currentUser?.id}
      />
    );
  };

  return (
    <>
      {/* Bulle flottante pour ouvrir le chat */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          {activeGiveaway && (
            <motion.div 
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              LIVE
            </motion.div>
          )}
        </div>
      </motion.button>

      {/* Panel de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl z-[9998] border-l border-white/10"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-bold text-white">Chat ReveelBox</div>
                  <div className="text-xs text-gray-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span>{onlineUsers} en ligne</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-gray-300" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-300" />
                  )}
                </button>

                <AdminControls
                  isAdmin={currentUser?.isAdmin || false}
                  onStartGiveaway={startGiveaway}
                  hasActiveGiveaway={!!activeGiveaway}
                  onlineUsers={onlineUsers}
                />

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-messages" style={{ height: 'calc(100vh - 140px)' }}>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    !currentUser ? "Connectez-vous pour écrire..." :
                    currentUser.level < 2 ? "Niveau 2 requis pour écrire..." :
                    "Votre message..."
                  }
                  disabled={!currentUser || currentUser.level < 2 || loading}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  maxLength={200}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !currentUser || currentUser.level < 2 || loading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <div>
                  {currentUser ? (
                    <div className="flex items-center gap-4">
                      <span className="text-green-400">
                        Lv{currentUser.level} • {currentUser.virtual_currency} coins
                      </span>
                      {hasParticipated && activeGiveaway && (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Participation confirmée
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-red-400">Non connecté</span>
                  )}
                </div>
                <div>{newMessage.length}/200</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de participation au giveaway */}
      <GiveawayModal
        isOpen={showGiveawayModal}
        onClose={() => setShowGiveawayModal(false)}
        onValidate={validateParticipation}
        giveawayId={activeGiveaway?.id || ''}
      />
    </>
  );
};

export default ChatSystem;