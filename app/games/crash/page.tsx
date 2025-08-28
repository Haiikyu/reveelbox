'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Coins, Timer, AlertCircle, Users, History, Zap, ArrowUp, User, DollarSign, Star, Flame, Trophy, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/components/AuthProvider';
import { useTheme } from '@/app/components/ThemeProvider';
import { createClient } from '@/utils/supabase/client';

// Types
interface GameRound {
  id: string;
  round_number: number;
  status: 'betting' | 'countdown' | 'running' | 'crashed' | 'finished';
  crash_multiplier?: number;
  final_multiplier?: number;
  betting_start_time: string;
  betting_end_time?: string;
  round_start_time?: string;
  crash_time?: string;
  total_bets: number;
  total_bet_amount: number;
  total_players: number;
}

interface CrashBet {
  id: string;
  user_id: string;
  bet_amount: number;
  cashed_out: boolean;
  cashout_multiplier?: number;
  cashout_amount?: number;
  profiles?: {
    username: string;
  };
}

const CrashGameMultiplayer: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const supabase = createClient();
  
  const isDark = resolvedTheme === 'dark';
  
  // États du jeu
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [gameData, setGameData] = useState<Array<{x: number, y: number}>>([]);
  const [roundBets, setRoundBets] = useState<CrashBet[]>([]);
  const [userBet, setUserBet] = useState<CrashBet | null>(null);
  
  // États UI
  const [betAmount, setBetAmount] = useState<number>(10);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [explosionEffect, setExplosionEffect] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [roundHistory, setRoundHistory] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  // Refs pour éviter les fuites mémoire
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const realtimeChannel = useRef<any>(null);
  const gameStartTime = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Fonction pour nettoyer les ressources
  const cleanup = useCallback(() => {
    console.log('Nettoyage des ressources');
    
    if (realtimeChannel.current) {
      try {
        supabase.removeChannel(realtimeChannel.current);
      } catch (error) {
        console.warn('Erreur nettoyage channel:', error);
      }
      realtimeChannel.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [supabase]);

  // Fonction de chargement des données utilisateur
  const loadUserData = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('virtual_currency')
        .eq('id', user.id)
        .single();
        
      if (!mountedRef.current) return;
        
      if (error && error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            virtual_currency: 100,
            username: user.email?.split('@')[0] || 'User'
          });
          
        if (!insertError && mountedRef.current) {
          setUserBalance(100);
        }
      } else if (profile && mountedRef.current) {
        setUserBalance(profile.virtual_currency || 0);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  }, [user?.id, user?.email, supabase]);

  // Fonction de chargement du round actuel
  const loadCurrentRound = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      const { data: serverState, error: serverError } = await supabase
        .from('crash_server_state')
        .select('current_round_id')
        .eq('id', 1)
        .single();

      if (serverError || !serverState?.current_round_id || !mountedRef.current) {
        return;
      }

      const { data: roundData, error: roundError } = await supabase
        .from('crash_rounds')
        .select('*')
        .eq('id', serverState.current_round_id)
        .single();

      if (roundError || !roundData || !mountedRef.current) {
        return;
      }

      setCurrentRound(roundData);

      // Démarrer le timer du jeu si running
      if (roundData.status === 'running' && !gameStartTime.current) {
        gameStartTime.current = new Date(roundData.round_start_time || Date.now()).getTime();
        setGameData([{x: 0, y: 1.0}]);
      }

      // Calculer le temps restant
      if (roundData.status === 'betting' && mountedRef.current) {
        const now = Date.now();
        const bettingStart = new Date(roundData.betting_start_time).getTime();
        const bettingEnd = bettingStart + 20000;
        const remaining = Math.max(0, Math.floor((bettingEnd - now) / 1000));
        setTimeRemaining(remaining);
      }

      // Charger les mises
      const { data: bets, error: betsError } = await supabase
        .from('crash_bets')
        .select(`
          *,
          profiles (username)
        `)
        .eq('round_id', roundData.id)
        .order('placed_at', { ascending: false });

      if (!betsError && bets && mountedRef.current) {
        setRoundBets(bets);
        const currentUserBet = bets.find(bet => bet.user_id === user?.id);
        setUserBet(currentUserBet || null);
      }

    } catch (error) {
      console.error('Erreur chargement round:', error);
    }
  }, [supabase, user?.id]);

  // Fonction de chargement de l'historique
  const loadRoundHistory = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      const { data: history, error } = await supabase
        .from('crash_rounds')
        .select('final_multiplier')
        .eq('status', 'finished')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && history && mountedRef.current) {
        const multipliers = history
          .filter(round => round.final_multiplier)
          .map(round => parseFloat(round.final_multiplier.toFixed(2)));
        setRoundHistory(multipliers);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  }, [supabase]);

  // Configuration du realtime
  const setupRealtime = useCallback(() => {
    if (!mountedRef.current) return;

    console.log('Configuration du realtime...');
    
    cleanup();

    try {
      realtimeChannel.current = supabase
        .channel('crash_game_updates')
        .on('broadcast', { event: 'state_change' }, (payload) => {
          console.log('State change:', payload);
          if (payload.payload && mountedRef.current) {
            loadCurrentRound();
          }
        })
        .on('broadcast', { event: 'multiplier_update' }, (payload) => {
          if (payload.payload?.multiplier && mountedRef.current) {
            const newMultiplier = payload.payload.multiplier;
            setCurrentMultiplier(newMultiplier);
            
            if (currentRound?.status === 'running') {
              const elapsed = (Date.now() - gameStartTime.current) / 1000;
              setGameData(prev => [...prev.slice(-50), { x: elapsed, y: newMultiplier }]);
            }
          }
        })
        .on('broadcast', { event: 'crash' }, (payload) => {
          console.log('CRASH événement:', payload);
          if (payload.payload?.crash_multiplier && mountedRef.current) {
            setCurrentMultiplier(payload.payload.crash_multiplier);
            setExplosionEffect(true);
            setTimeout(() => setExplosionEffect(false), 2000);
            loadCurrentRound();
          }
        })
        .on('broadcast', { event: 'new_round' }, (payload) => {
          console.log('Nouveau round:', payload);
          if (mountedRef.current) {
            setCurrentMultiplier(1.0);
            setGameData([]);
            setUserBet(null);
            gameStartTime.current = 0;
            loadCurrentRound();
          }
        })
        .subscribe((status) => {
          console.log('Realtime status:', status);
          if (mountedRef.current) {
            setConnected(status === 'SUBSCRIBED');
          }
        });

    } catch (error) {
      console.error('Erreur setup realtime:', error);
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log('Tentative de reconnexion...');
          setupRealtime();
        }
      }, 5000);
    }
  }, [supabase, loadCurrentRound, currentRound, cleanup]);

  // Timer pour countdown
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (currentRound?.status === 'betting' && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0 && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentRound?.status, timeRemaining]);

  // Fonction pour placer une mise
  const placeBet = useCallback(async () => {
    if (!user?.id || userBet || !currentRound || currentRound.status !== 'betting' || betAmount > userBalance) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('place_crash_bet', {
        p_bet_amount: betAmount
      });

      if (error) throw error;

      if (data?.success && mountedRef.current) {
        setUserBalance(data.new_balance);
        loadCurrentRound();
      }
    } catch (error) {
      console.error('Erreur placement mise:', error);
    }
  }, [user?.id, userBet, currentRound, betAmount, userBalance, supabase, loadCurrentRound]);

  // Fonction pour encaisser
  const cashOut = useCallback(async () => {
    if (!userBet || userBet.cashed_out || !currentRound || currentRound.status !== 'running') {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('crash_cashout', {
        p_round_id: currentRound.id,
        p_multiplier: currentMultiplier
      });

      if (error) throw error;

      if (data?.success && mountedRef.current) {
        setUserBalance(data.new_balance);
        setLastWin(data.cashout_amount);
        setUserBet(prev => prev ? {
          ...prev,
          cashed_out: true,
          cashout_multiplier: data.multiplier,
          cashout_amount: data.cashout_amount
        } : null);
      }
    } catch (error) {
      console.error('Erreur encaissement:', error);
    }
  }, [userBet, currentRound, currentMultiplier, supabase]);

  // Fonction pour dessiner le graphique
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    if (gameData.length < 2) return;
    
    const maxX = Math.max(...gameData.map(d => d.x));
    const maxY = Math.max(...gameData.map(d => d.y));
    const minY = 1;
    
    // Grille
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Courbe
    ctx.beginPath();
    ctx.strokeStyle = currentMultiplier < 2 ? '#22c55e' : currentMultiplier < 5 ? '#f59e0b' : '#ef4444';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    gameData.forEach((point, index) => {
      const x = padding + (point.x / maxX) * graphWidth;
      const y = height - padding - ((point.y - minY) / (maxY - minY)) * graphHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }, [gameData, currentMultiplier, isDark]);

  // Fonction pour obtenir la couleur du multiplicateur
  const getMultiplierColor = useCallback(() => {
    if (currentMultiplier < 1.5) return isDark ? 'text-green-400' : 'text-green-600';
    if (currentMultiplier < 2.5) return isDark ? 'text-green-300' : 'text-green-500';
    if (currentMultiplier < 5) return isDark ? 'text-yellow-400' : 'text-yellow-500';
    return isDark ? 'text-red-400' : 'text-red-500';
  }, [currentMultiplier, isDark]);

  // Effect pour dessiner le canvas
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Effect principal d'initialisation
  useEffect(() => {
    mountedRef.current = true;
    
    if (isAuthenticated && user) {
      console.log('Initialisation du jeu...');
      loadUserData();
      loadCurrentRound();
      loadRoundHistory();
      setupRealtime();
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [isAuthenticated, user, authLoading]);

  // Fallback refresh
  useEffect(() => {
    if (!isAuthenticated || !user || !mountedRef.current) return;
    
    const interval = setInterval(() => {
      if (!connected && mountedRef.current) {
        console.log('Refresh fallback...');
        loadCurrentRound();
        loadUserData();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user, connected, loadCurrentRound, loadUserData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] pt-20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <TrendingUp className="h-12 w-12 text-primary-500 mx-auto" />
          </motion.div>
          <p className="text-[rgb(var(--text-secondary))] text-lg">Connexion au serveur...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] pt-20 flex items-center justify-center">
        <div className="bg-[rgb(var(--surface-elevated))] rounded-3xl border border-[rgb(var(--border))] shadow-xl p-12 text-center max-w-md">
          <TrendingUp className="h-16 w-16 text-primary-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-4">Connexion requise</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            Connectez-vous pour participer au Crash Game multijoueur
          </p>
          <a
            href="/login"
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] pt-20">
      {/* Effet d'explosion */}
      <AnimatePresence>
        {explosionEffect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-red-500 opacity-20"></div>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%', 
                  scale: 0, 
                  rotate: 0 
                }}
                animate={{ 
                  x: `${50 + (Math.random() - 0.5) * 200}%`, 
                  y: `${50 + (Math.random() - 0.5) * 200}%`, 
                  scale: Math.random() * 2, 
                  rotate: Math.random() * 360 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute w-4 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-[rgb(var(--surface-elevated))] border-b border-[rgb(var(--border))] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendingUp className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                    Crash Game
                  </h1>
                  <p className="text-[rgb(var(--text-secondary))] font-medium">Multijoueur en temps réel</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Statut de connexion */}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium ${
                  connected 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{connected ? 'Connecté' : 'Déconnecté'}</span>
                </div>

                {currentRound && (
                  <div className="bg-[rgb(var(--text-primary))] text-[rgb(var(--background))] px-4 py-2 rounded-xl font-bold">
                    Round #{currentRound.round_number}
                  </div>
                )}
                
                {currentRound?.status === 'betting' && timeRemaining > 0 && (
                  <motion.div 
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl shadow-lg"
                  >
                    <Timer className="h-4 w-4" />
                    <span className="font-bold">Mises: {timeRemaining}s</span>
                  </motion.div>
                )}
                
                {currentRound?.status === 'running' && (
                  <motion.div 
                    className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-xl shadow-lg"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Flame className="h-4 w-4" />
                    <span className="font-bold">EN COURS</span>
                  </motion.div>
                )}
                
                {currentRound?.status === 'crashed' && (
                  <motion.div 
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-bold">CRASH!</span>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-blue-600 dark:text-blue-400">{currentRound?.total_players || 0} joueurs</span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800">
                  <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-purple-600 dark:text-purple-400">{(currentRound?.total_bet_amount || 0).toLocaleString()} coins</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-lg hover:bg-[rgb(var(--surface-elevated))] transition-colors"
                >
                  {isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-600" />}
                </button>
                
                <motion.div 
                  className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 px-6 py-3 rounded-2xl border-2 border-primary-200 dark:border-primary-800 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-sm text-primary-700 dark:text-primary-300 font-semibold">Votre solde</div>
                  <div className="flex items-center space-x-2">
                    <Coins className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <span className="text-2xl font-black text-primary-600 dark:text-primary-400">{userBalance.toLocaleString()} coins</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Zone de jeu principale */}
          <div className="lg:col-span-8">
            <div className="bg-[rgb(var(--surface-elevated))] rounded-3xl border border-[rgb(var(--border))] shadow-xl overflow-hidden">
              {/* Notification de gain */}
              <AnimatePresence>
                {lastWin && (
                  <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <Trophy className="h-6 w-6" />
                      <span className="text-xl font-bold">
                        Félicitations ! Vous avez gagné {lastWin.toLocaleString()} coins !
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-8">
                {/* Affichage du multiplicateur */}
                <div className="text-center mb-8">
                  <motion.div 
                    className={`text-9xl font-black ${getMultiplierColor()} transition-all duration-200`}
                    animate={{ 
                      scale: currentRound?.status === 'running' ? [1, 1.02, 1] : 1
                    }}
                    transition={{ duration: 0.5, repeat: currentRound?.status === 'running' ? Infinity : 0 }}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </motion.div>
                  <motion.div 
                    className="text-[rgb(var(--text-secondary))] mt-3 text-xl font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {currentRound?.status === 'betting' && timeRemaining > 0 && `Placez vos mises - ${timeRemaining}s restantes`}
                    {currentRound?.status === 'betting' && timeRemaining === 0 && 'Fin des mises...'}
                    {currentRound?.status === 'countdown' && 'Décollage imminent...'}
                    {currentRound?.status === 'running' && 'Le multiplicateur monte !'}
                    {currentRound?.status === 'crashed' && `Crash à ${currentMultiplier.toFixed(2)}x !`}
                    {!currentRound && !connected && 'Connexion au serveur...'}
                    {!currentRound && connected && 'En attente du prochain round...'}
                  </motion.div>
                </div>

                {/* Graphique Canvas */}
                <div className="h-80 mb-8 bg-[rgb(var(--surface))] rounded-2xl p-6 border border-[rgb(var(--border))]">
                  {gameData.length > 0 ? (
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="w-full h-full"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[rgb(var(--text-secondary))]">
                      <motion.div 
                        className="text-center"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <TrendingUp className="h-20 w-20 mx-auto mb-4 opacity-60" />
                        <p className="text-lg font-semibold">
                          {!connected ? 'Connexion en cours...' : 'En attente du prochain round...'}
                        </p>
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Interface de mise */}
                <motion.div 
                  className="bg-[rgb(var(--surface))] rounded-2xl p-8 border border-[rgb(var(--border))]"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="grid md:grid-cols-3 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-[rgb(var(--text-primary))] mb-4">
                        Montant de votre mise (coins)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[rgb(var(--surface-elevated))] border-2 border-[rgb(var(--border))] rounded-xl px-5 py-4 text-[rgb(var(--text-primary))] focus:border-primary-500 focus:outline-none font-bold text-lg shadow-sm"
                          disabled={userBet !== null || currentRound?.status !== 'betting'}
                          max={userBalance}
                        />
                        <span className="absolute right-5 top-4 text-[rgb(var(--text-secondary))] font-bold text-lg">coins</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {[10, 50, 100, Math.floor(userBalance / 2)].map(amount => (
                          <motion.button
                            key={amount}
                            onClick={() => setBetAmount(Math.min(amount, userBalance))}
                            disabled={userBet !== null || currentRound?.status !== 'betting' || amount > userBalance}
                            className="bg-[rgb(var(--surface-elevated))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text-primary))] py-2 rounded-lg text-sm font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all disabled:opacity-50 shadow-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {amount > userBalance ? 'Max' : amount}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-end">
                      {currentRound?.status === 'betting' && !userBet && timeRemaining > 0 ? (
                        <motion.button
                          onClick={placeBet}
                          disabled={userBalance < betAmount || betAmount <= 0}
                          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-5 px-8 rounded-2xl font-black text-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Miser {betAmount} coins
                        </motion.button>
                      ) : userBet && !userBet.cashed_out && currentRound?.status === 'running' ? (
                        <motion.button
                          onClick={cashOut}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-5 px-8 rounded-2xl font-black text-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-xl"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <ArrowUp className="h-6 w-6" />
                            <span>Encaisser {Math.floor((userBet?.bet_amount || 0) * currentMultiplier)} coins</span>
                          </div>
                        </motion.button>
                      ) : (
                        <div className="w-full py-5 px-8 rounded-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] text-center font-black text-xl">
                          {currentRound?.status === 'betting' && userBet && 'Mise placée'}
                          {currentRound?.status === 'betting' && !userBet && timeRemaining === 0 && 'Mises fermées'}
                          {currentRound?.status === 'betting' && !userBet && !currentRound && 'En attente...'}
                          {currentRound?.status === 'countdown' && 'Démarrage...'}
                          {currentRound?.status === 'crashed' && userBet && !userBet.cashed_out && 'Perdu'}
                          {userBet?.cashed_out && `Encaissé à ${userBet.cashout_multiplier?.toFixed(2)}x`}
                          {currentRound?.status === 'crashed' && !userBet && 'Round terminé'}
                          {!currentRound && !connected && 'Connexion...'}
                          {!currentRound && connected && 'Attente round...'}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm font-bold text-[rgb(var(--text-primary))] mb-4">
                        {userBet ? 'Votre gain potentiel' : 'Gain potentiel'}
                      </div>
                      <motion.div 
                        className="bg-[rgb(var(--surface-elevated))] border-2 border-[rgb(var(--border))] rounded-xl px-5 py-4 shadow-sm"
                        animate={userBet && !userBet.cashed_out && currentRound?.status === 'running' ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                          {userBet && !userBet.cashed_out 
                            ? Math.floor((userBet.bet_amount || 0) * currentMultiplier).toLocaleString()
                            : userBet?.cashed_out
                            ? (userBet.cashout_amount || 0).toLocaleString()
                            : '0'
                          } coins
                        </div>
                        <div className="text-sm text-[rgb(var(--text-secondary))] font-semibold">
                          {userBet ? `Mise: ${userBet.bet_amount} coins` : 'Aucune mise'}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mises du Round Actuel */}
            <motion.div 
              className="bg-[rgb(var(--surface-elevated))] rounded-2xl border border-[rgb(var(--border))] shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Mises du Round</h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {roundBets.length > 0 ? (
                  <AnimatePresence>
                    {roundBets.slice(0, 8).map((bet, index) => (
                      <motion.div
                        key={bet.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          bet.user_id === user?.id 
                            ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            : bet.cashed_out 
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                            : 'bg-[rgb(var(--surface))]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            bet.user_id === user?.id ? 'bg-primary-500' : 'bg-blue-500'
                          }`}>
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className={`font-bold text-sm ${bet.user_id === user?.id ? 'text-primary-700 dark:text-primary-300' : 'text-[rgb(var(--text-primary))]'}`}>
                              {bet.user_id === user?.id ? 'Vous' : (bet.profiles?.username || 'Joueur')}
                            </div>
                            <div className="text-xs text-[rgb(var(--text-secondary))]">{bet.bet_amount} coins</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {bet.cashed_out && bet.cashout_multiplier ? (
                            <div className="text-green-600 dark:text-green-400 font-bold text-sm">
                              {bet.cashout_multiplier.toFixed(2)}x
                            </div>
                          ) : currentRound?.status === 'running' ? (
                            <div className="text-[rgb(var(--text-secondary))] text-sm">En cours...</div>
                          ) : (
                            <div className="text-[rgb(var(--text-secondary))] text-sm">En attente</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center text-[rgb(var(--text-secondary))] py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune mise pour ce round...</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Historique des Rounds */}
            <motion.div 
              className="bg-[rgb(var(--surface-elevated))] rounded-2xl border border-[rgb(var(--border))] shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <History className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Historique</h3>
              </div>
              
              {roundHistory.length > 0 ? (
                <>
                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {roundHistory.map((crash, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`text-center p-3 rounded-xl font-black text-sm transition-all ${
                          index === 0 ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800' : 
                          crash >= 5 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          crash >= 2 ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' : 
                          'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {crash.toFixed(2)}x
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-[rgb(var(--border))]">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-[rgb(var(--text-secondary))]">Moyenne</div>
                        <div className="font-bold text-[rgb(var(--text-primary))]">
                          {(roundHistory.reduce((a, b) => a + b, 0) / roundHistory.length).toFixed(2)}x
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[rgb(var(--text-secondary))]">Max récent</div>
                        <div className="font-bold text-green-600 dark:text-green-400">
                          {Math.max(...roundHistory).toFixed(2)}x
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-[rgb(var(--text-secondary))] py-8">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Historique en cours de chargement...</p>
                </div>
              )}
            </motion.div>

            {/* Guide du Jeu */}
            <motion.div 
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl border-2 border-primary-200 dark:border-primary-800 shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100">Comment jouer ?</h3>
              </div>
              <div className="space-y-4 text-sm text-primary-800 dark:text-primary-200">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <div>
                    <div className="font-bold">Placez votre mise</div>
                    <div className="text-primary-700 dark:text-primary-300">Pendant la phase de mise (20 secondes)</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <div>
                    <div className="font-bold">Surveillez le multiplicateur</div>
                    <div className="text-primary-700 dark:text-primary-300">Il augmente en temps réel avec les autres joueurs</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <div>
                    <div className="font-bold">Encaissez avant le crash</div>
                    <div className="text-primary-700 dark:text-primary-300">Cliquez pour récupérer vos gains</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-primary-200 dark:border-primary-800">
                <div className="text-center">
                  <div className="text-primary-700 dark:text-primary-300 text-sm font-semibold">Système Multijoueur</div>
                  <div className="text-primary-900 dark:text-primary-100 font-bold">Le jeu tourne 24/7 sur nos serveurs !</div>
                </div>
              </div>
            </motion.div>

            {/* Statistiques Live */}
            <motion.div 
              className="bg-[rgb(var(--surface-elevated))] rounded-2xl border border-[rgb(var(--border))] shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Trophy className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">Stats Serveur</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[rgb(var(--surface))] rounded-xl">
                  <span className="text-[rgb(var(--text-secondary))] font-semibold">Statut connexion</span>
                  <span className={`font-bold text-lg ${connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {connected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Round actuel</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                    #{currentRound?.round_number || '---'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">Pool actuel</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                    {(currentRound?.total_bet_amount || 0).toLocaleString()} coins
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <span className="text-green-600 dark:text-green-400 font-semibold">Votre solde</span>
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg">{userBalance.toLocaleString()} coins</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrashGameMultiplayer;