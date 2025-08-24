'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Coins, Timer, AlertCircle, Users, History, Zap, ArrowUp, User, DollarSign, Star, Flame, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/components/AuthProvider';
import { createClient } from '@/utils/supabase/client';

// Types TypeScript complets et stricts
interface GameData {
  x: number;
  y: number;
}

interface BetPlayer {
  id: string | number;
  name: string;
  amount: number;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
}

interface CashoutData {
  name: string;
  amount: number;
  multiplier: number;
}

type GameState = 'betting' | 'countdown' | 'running' | 'crashed';

interface SupabaseError {
  message: string;
  code?: string;
}

const CrashGame: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const supabase = createClient();
  
  // États du jeu avec types stricts
  const [gameState, setGameState] = useState<GameState>('betting');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [gameData, setGameData] = useState<GameData[]>([]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [hasBet, setHasBet] = useState<boolean>(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState<number | null>(null);
  const [bettingTimeLeft, setBettingTimeLeft] = useState<number>(20);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [explosionEffect, setExplosionEffect] = useState<boolean>(false);
  const [gameNumber, setGameNumber] = useState<number>(1);
  
  // États liés à la DB
  const [userBalance, setUserBalance] = useState<number>(0);
  const [crashHistory, setCrashHistory] = useState<number[]>([]);
  const [activeBets, setActiveBets] = useState<BetPlayer[]>([]);
  const [recentCashouts, setRecentCashouts] = useState<CashoutData[]>([]);
  const [currentPlayers, setCurrentPlayers] = useState<number>(0);
  const [totalBets, setTotalBets] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Refs avec types corrects
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const crashPointRef = useRef<number>(0);
  const bettingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMountedRef = useRef<boolean>(true);

  // Fonctions utilitaires avec useCallback pour éviter les re-renders
  const getMultiplierColor = useCallback((): string => {
    if (multiplier < 1.5) return 'text-green-600';
    if (multiplier < 2.5) return 'text-green-500';
    if (multiplier < 5) return 'text-yellow-500';
    return 'text-red-500';
  }, [multiplier]);

  const getGraphColor = useCallback((): string => {
    if (multiplier < 1.5) return '#22c55e';
    if (multiplier < 2.5) return '#16a34a';
    if (multiplier < 5) return '#f59e0b';
    return '#ef4444';
  }, [multiplier]);

  // Génération du point de crash rentable pour la maison
  const generateCrashPoint = useCallback((): number => {
    const random = Math.random();
    if (random < 0.40) return 1.0 + Math.random() * 0.5;
    if (random < 0.65) return 1.5 + Math.random() * 0.8;
    if (random < 0.82) return 2.3 + Math.random() * 1.2;
    if (random < 0.92) return 3.5 + Math.random() * 2.0;
    if (random < 0.97) return 5.5 + Math.random() * 4.5;
    return 10 + Math.random() * 40;
  }, []);

  // Charger les données utilisateur
  const loadUserData = useCallback(async (): Promise<void> => {
    if (!user || !isMountedRef.current) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('virtual_currency')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      if (isMountedRef.current) {
        setUserBalance(profile?.virtual_currency || 0);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  }, [user, supabase]);

  // Charger l'historique des crashes
  const loadCrashHistory = useCallback((): void => {
    if (isMountedRef.current) {
      setCrashHistory([1.23, 2.14, 1.78, 3.42, 1.45, 2.67, 1.89, 4.23, 1.34, 2.98]);
    }
  }, []);

  // Sauvegarder un crash dans l'historique local
  const saveCrashToHistory = useCallback((crashMultiplier: number): void => {
    if (isMountedRef.current) {
      setCrashHistory(prev => [parseFloat(crashMultiplier.toFixed(2)), ...prev.slice(0, 9)]);
    }
  }, []);

  // Générer des mises fictives pour l'ambiance
  const generateFakeBets = useCallback((): BetPlayer[] => {
    const names = ['Alex', 'Sarah', 'Mike', 'Emma', 'Tom', 'Lisa', 'Jack', 'Nina', 'Bob', 'Kate'];
    const bets: BetPlayer[] = [];
    for (let i = 0; i < Math.floor(Math.random() * 8) + 5; i++) {
      bets.push({
        id: Math.random(),
        name: names[Math.floor(Math.random() * names.length)],
        amount: Math.floor(Math.random() * 500) + 10,
        cashedOut: false,
        cashoutMultiplier: null
      });
    }
    return bets;
  }, []);

  // Nettoyer les timers de façon sécurisée
  const cleanupTimers = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (bettingTimerRef.current) {
      clearInterval(bettingTimerRef.current);
      bettingTimerRef.current = null;
    }
  }, []);

  // Placer une mise
  const placeBet = useCallback(async (): Promise<void> => {
    if (!user || !isAuthenticated || !isMountedRef.current || userBalance < betAmount || gameState !== 'betting' || bettingTimeLeft <= 0 || hasBet) {
      return;
    }

    try {
      // Mise à jour du solde local immédiate
      setUserBalance(prev => prev - betAmount);
      setTotalBets(prev => prev + betAmount);
      setHasBet(true);

      // Enregistrer la transaction de façon asynchrone
      const transactionResult = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'crash_bet',
          virtual_amount: betAmount,
          description: `Mise Crash Game #${gameNumber}`,
          created_at: new Date().toISOString()
        });

      if (transactionResult.error) {
        console.error('Erreur transaction mise:', transactionResult.error);
      }

    } catch (error) {
      console.error('Erreur lors de la mise:', error);
      // Rétablir le solde en cas d'erreur
      if (isMountedRef.current) {
        setUserBalance(prev => prev + betAmount);
        setHasBet(false);
      }
    }
  }, [user, isAuthenticated, userBalance, betAmount, gameState, bettingTimeLeft, hasBet, gameNumber, supabase]);

  // Encaisser
  const cashOut = useCallback(async (): Promise<void> => {
    if (!hasBet || !user || !isMountedRef.current || gameState !== 'running' || cashoutMultiplier) {
      return;
    }

    try {
      const winAmount = Math.floor(betAmount * multiplier);
      
      // Ajouter les gains à la DB
      const { error } = await supabase
        .from('profiles')
        .update({ 
          virtual_currency: userBalance + winAmount 
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erreur mise à jour gains:', error);
        return;
      }

      // Enregistrer la transaction de gain
      const transactionResult = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'crash_win',
          virtual_amount: winAmount,
          description: `Gain Crash Game #${gameNumber} à ${multiplier.toFixed(2)}x`,
          created_at: new Date().toISOString()
        });

      if (transactionResult.error) {
        console.error('Erreur transaction gain:', transactionResult.error);
      }

      if (isMountedRef.current) {
        setCashoutMultiplier(multiplier);
        setUserBalance(prev => prev + winAmount);
        setLastWin(winAmount);
        
        setRecentCashouts(prev => [
          { name: 'Vous', amount: betAmount, multiplier: multiplier },
          ...prev.slice(0, 4)
        ]);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'encaissement:', error);
    }
  }, [hasBet, user, gameState, cashoutMultiplier, betAmount, multiplier, userBalance, gameNumber, supabase]);

  // Dessiner le graphique Canvas
  const drawGraph = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas || gameData.length === 0 || !isMountedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Style du graphique
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Valeurs pour l'échelle
    const maxX = Math.max(...gameData.map(d => d.x));
    const maxY = Math.max(...gameData.map(d => d.y));
    const minY = 1;
    
    // Grille de fond
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Courbe principale
    if (gameData.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = getGraphColor();
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (gameState === 'crashed') {
        ctx.setLineDash([8, 8]);
      } else {
        ctx.setLineDash([]);
      }
      
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
      
      // Effet glow pour les hauts multiplicateurs
      if (multiplier > 5) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = getGraphColor();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    
    // Label du multiplicateur actuel
    if (gameData.length > 0) {
      const lastPoint = gameData[gameData.length - 1];
      const x = padding + (lastPoint.x / maxX) * graphWidth;
      const y = height - padding - ((lastPoint.y - minY) / (maxY - minY)) * graphHeight;
      
      // Bulle avec multiplicateur
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 30, y - 20, 60, 25);
      ctx.strokeStyle = getGraphColor();
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 30, y - 20, 60, 25);
      
      ctx.fillStyle = getGraphColor();
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${multiplier.toFixed(2)}x`, x, y - 2);
    }
  }, [gameData, multiplier, gameState, getGraphColor]);

  // Démarrer une nouvelle phase de paris
  const startBettingPhase = useCallback((): void => {
    if (!isMountedRef.current) return;

    cleanupTimers();
    
    setGameState('betting');
    setBettingTimeLeft(20);
    setHasBet(false);
    setCashoutMultiplier(null);
    setLastWin(null);
    setMultiplier(1.0);
    setGameData([]);
    setExplosionEffect(false);
    setRecentCashouts([]);
    setActiveBets(generateFakeBets());
    setTotalBets(Math.floor(Math.random() * 8000) + 2000);
    setGameNumber(prev => prev + 1);
    
    bettingTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      setBettingTimeLeft(prev => {
        if (prev <= 1) {
          if (bettingTimerRef.current) {
            clearInterval(bettingTimerRef.current);
            bettingTimerRef.current = null;
          }
          startCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cleanupTimers, generateFakeBets]);

  // Phase de countdown
  const startCountdown = useCallback((): void => {
    if (!isMountedRef.current) return;

    setGameState('countdown');
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(countdownInterval);
        return;
      }

      if (countdown <= 0) {
        clearInterval(countdownInterval);
        startGame();
        return;
      }
      countdown--;
    }, 1000);
  }, []);

  // Démarrer le jeu
  const startGame = useCallback((): void => {
    if (!isMountedRef.current) return;

    setGameState('running');
    setMultiplier(1.0);
    setGameData([{ x: 0, y: 1 }]);
    crashPointRef.current = generateCrashPoint();
    
    let time = 0;
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;

      time += 0.08;
      const currentMultiplier = Math.pow(Math.E, time * 0.15);
      
      // Simulation de cashouts d'autres joueurs
      if (Math.random() > 0.98 && currentMultiplier > 1.5) {
        setActiveBets(prevBets => {
          const availableBets = prevBets.filter(bet => !bet.cashedOut);
          if (availableBets.length > 0) {
            const randomBet = availableBets[Math.floor(Math.random() * availableBets.length)];
            randomBet.cashedOut = true;
            randomBet.cashoutMultiplier = currentMultiplier;
            
            if (isMountedRef.current) {
              setRecentCashouts(prev => [
                { name: randomBet.name, amount: randomBet.amount, multiplier: currentMultiplier },
                ...prev.slice(0, 4)
              ]);
            }
          }
          return [...prevBets];
        });
      }
      
      // Vérifier si on a atteint le point de crash
      if (currentMultiplier >= crashPointRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        if (!isMountedRef.current) return;

        setGameState('crashed');
        setMultiplier(crashPointRef.current);
        setExplosionEffect(true);
        
        saveCrashToHistory(crashPointRef.current);
        
        // Si le joueur n'a pas encaissé, enregistrer la perte
        if (hasBet && !cashoutMultiplier && user) {
          supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              type: 'crash_loss',
              virtual_amount: -betAmount,
              description: `Perte Crash Game #${gameNumber} à ${crashPointRef.current.toFixed(2)}x`,
              created_at: new Date().toISOString()
            })
            .then(({ error }) => {
              if (error) {
                console.error('Erreur transaction perte:', error);
              }
            });
        }
        
        setTimeout(() => {
          if (isMountedRef.current) {
            startBettingPhase();
          }
        }, 5000);
        return;
      }
      
      if (isMountedRef.current) {
        setMultiplier(currentMultiplier);
        setGameData(prev => [...prev.slice(-100), { x: time, y: currentMultiplier }]);
      }
    }, 80);
  }, [generateCrashPoint, saveCrashToHistory, hasBet, cashoutMultiplier, user, betAmount, gameNumber, supabase, startBettingPhase]);

  // Hook pour dessiner le graphique
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Charger les données au montage
  useEffect(() => {
    isMountedRef.current = true;
    
    if (user && isAuthenticated) {
      loadUserData();
      loadCrashHistory();
      setCurrentPlayers(Math.floor(Math.random() * 300) + 150);
      setLoading(false);
      
      // Démarrer le premier round après un délai
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          startBettingPhase();
        }
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, loadUserData, loadCrashHistory, startBettingPhase]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupTimers();
    };
  }, [cleanupTimers]);

  // Interface de chargement
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <TrendingUp className="h-12 w-12 text-green-600 mx-auto" />
          </motion.div>
          <p className="text-gray-600 text-lg">Chargement du jeu...</p>
        </div>
      </div>
    );
  }

  // Interface si non connecté
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-12 text-center max-w-md">
          <TrendingUp className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour jouer au Crash Game
          </p>
          <a
            href="/login"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
      <div className="bg-white border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <motion.div 
                  className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendingUp className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                    Crash Game
                  </h1>
                  <p className="text-gray-600 font-medium">Encaissez avant le crash et multipliez vos gains !</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold">
                  Round #{gameNumber}
                </div>
                
                {gameState === 'betting' && (
                  <motion.div 
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl shadow-lg"
                    animate={{ scale: bettingTimeLeft <= 5 ? [1, 1.05, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: bettingTimeLeft <= 5 ? Infinity : 0 }}
                  >
                    <Timer className="h-4 w-4" />
                    <span className="font-bold">Mise: {bettingTimeLeft}s</span>
                  </motion.div>
                )}
                
                {gameState === 'running' && (
                  <motion.div 
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl shadow-lg"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Flame className="h-4 w-4" />
                    <span className="font-bold">EN COURS</span>
                  </motion.div>
                )}
                
                {gameState === 'crashed' && (
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
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-blue-600">{currentPlayers} joueurs</span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="font-bold text-purple-600">{totalBets.toLocaleString()} coins pool</span>
                </div>
              </div>
              
              <motion.div 
                className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-3 rounded-2xl border-2 border-green-200 shadow-lg"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-sm text-green-700 font-semibold">Votre solde</div>
                <div className="flex items-center space-x-2">
                  <Coins className="h-6 w-6 text-green-600" />
                  <span className="text-2xl font-black text-green-600">{userBalance.toLocaleString()} coins</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Zone de jeu principale */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              {/* Notification de gain */}
              <AnimatePresence>
                {lastWin && (
                  <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4"
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
                      scale: gameState === 'running' ? [1, 1.02, 1] : 1
                    }}
                    transition={{ duration: 0.5, repeat: gameState === 'running' ? Infinity : 0 }}
                  >
                    {multiplier.toFixed(2)}x
                  </motion.div>
                  <motion.div 
                    className="text-gray-600 mt-3 text-xl font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {gameState === 'betting' && `Placez vos mises - ${bettingTimeLeft}s restantes`}
                    {gameState === 'countdown' && 'Décollage imminent...'}
                    {gameState === 'running' && 'Le multiplicateur monte !'}
                    {gameState === 'crashed' && `Crash à ${multiplier.toFixed(2)}x !`}
                  </motion.div>
                </div>

                {/* Graphique Canvas */}
                <div className="h-80 mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                  {gameData.length > 0 ? (
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="w-full h-full"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <motion.div 
                        className="text-center"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <TrendingUp className="h-20 w-20 mx-auto mb-4 opacity-60" />
                        <p className="text-lg font-semibold">Préparez-vous pour le prochain vol !</p>
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Interface de mise */}
                <motion.div 
                  className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="grid md:grid-cols-3 gap-8">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-4">
                        Montant de votre mise (coins)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-white border-2 border-gray-300 rounded-xl px-5 py-4 text-gray-900 focus:border-green-500 focus:outline-none font-bold text-lg shadow-sm"
                          disabled={hasBet || gameState !== 'betting'}
                          max={userBalance}
                        />
                        <span className="absolute right-5 top-4 text-gray-600 font-bold text-lg">coins</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {[10, 50, 100, Math.floor(userBalance / 2)].map(amount => (
                          <motion.button
                            key={amount}
                            onClick={() => setBetAmount(Math.min(amount, userBalance))}
                            disabled={hasBet || gameState !== 'betting' || amount > userBalance}
                            className="bg-white border-2 border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-green-50 hover:border-green-300 transition-all disabled:opacity-50 shadow-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {amount > userBalance ? 'Max' : amount}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-end">
                      {gameState === 'betting' && bettingTimeLeft > 0 && !hasBet ? (
                        <motion.button
                          onClick={placeBet}
                          disabled={userBalance < betAmount || betAmount <= 0}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-5 px-8 rounded-2xl font-black text-xl hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Miser {betAmount} coins
                        </motion.button>
                      ) : hasBet && gameState === 'running' && !cashoutMultiplier ? (
                        <motion.button
                          onClick={cashOut}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-5 px-8 rounded-2xl font-black text-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-xl"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <ArrowUp className="h-6 w-6" />
                            <span>Encaisser {Math.floor(betAmount * multiplier)} coins</span>
                          </div>
                        </motion.button>
                      ) : (
                        <div className="w-full py-5 px-8 rounded-2xl bg-gray-300 text-gray-600 text-center font-black text-xl">
                          {gameState === 'betting' && hasBet && 'Mise placée'}
                          {gameState === 'betting' && !hasBet && bettingTimeLeft === 0 && 'Trop tard'}
                          {gameState === 'countdown' && 'Démarrage...'}
                          {gameState === 'crashed' && hasBet && !cashoutMultiplier && 'Perdu'}
                          {cashoutMultiplier && `Encaissé à ${cashoutMultiplier.toFixed(2)}x`}
                          {gameState === 'crashed' && !hasBet && 'Round terminé'}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm font-bold text-gray-700 mb-4">Gain potentiel</div>
                      <motion.div 
                        className="bg-white border-2 border-gray-300 rounded-xl px-5 py-4 shadow-sm"
                        animate={hasBet && gameState === 'running' ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="text-3xl font-black text-green-600">
                          {hasBet ? Math.floor(betAmount * multiplier).toLocaleString() : '0'} coins
                        </div>
                        <div className="text-sm text-gray-500 font-semibold">
                          {hasBet ? `Mise: ${betAmount} coins` : 'Aucune mise'}
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
            {/* Encaissements Live */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Star className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-900">Encaissements Live</h3>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {recentCashouts.map((cashout, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-green-900">{cashout.name}</div>
                          <div className="text-sm text-green-600">{cashout.amount} coins</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-green-600">{cashout.multiplier.toFixed(2)}x</div>
                        <div className="text-sm text-green-500">+{Math.floor(cashout.amount * cashout.multiplier)} coins</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {recentCashouts.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun encaissement encore...</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mises Actives */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-900">Mises actives</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeBets.slice(0, 6).map((bet) => (
                  <div
                    key={bet.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      bet.cashedOut ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{bet.name[0]}</span>
                      </div>
                      <span className="font-semibold text-sm">{bet.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{bet.amount} coins</div>
                      {bet.cashedOut && bet.cashoutMultiplier && (
                        <div className="text-xs text-green-600 font-bold">
                          {bet.cashoutMultiplier.toFixed(2)}x
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Historique */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <History className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-bold text-gray-900">Historique</h3>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {crashHistory.map((crash, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`text-center p-3 rounded-xl font-black text-sm transition-all ${
                      index === 0 ? 'bg-purple-50 border-2 border-purple-200' : 
                      crash >= 5 ? 'bg-red-50 text-red-600' :
                      crash >= 2 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {crash.toFixed(2)}x
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500">Moyenne</div>
                    <div className="font-bold text-gray-900">
                      {(crashHistory.reduce((a, b) => a + b, 0) / crashHistory.length).toFixed(2)}x
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500">Max récent</div>
                    <div className="font-bold text-green-600">
                      {Math.max(...crashHistory).toFixed(2)}x
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Guide */}
            <motion.div 
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-bold text-green-900">Comment jouer ?</h3>
              </div>
              <div className="space-y-4 text-sm text-green-800">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <div>
                    <div className="font-bold">Placez votre mise en coins</div>
                    <div className="text-green-700">Vous avez 20 secondes pour parier</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <div>
                    <div className="font-bold">Regardez monter</div>
                    <div className="text-green-700">Le multiplicateur augmente en temps réel</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <div>
                    <div className="font-bold">Encaissez à temps !</div>
                    <div className="text-green-700">Cliquez avant le crash pour gagner vos coins</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white rounded-xl border border-green-200">
                <div className="text-center">
                  <div className="text-green-700 text-sm font-semibold">Conseil</div>
                  <div className="text-green-900 font-bold">Les petits gains réguliers valent mieux qu'un gros risque !</div>
                </div>
              </div>
            </motion.div>

            {/* Statistiques Live */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Trophy className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-900">Stats Live</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 font-semibold">Joueurs en ligne</span>
                  <span className="text-gray-900 font-bold text-lg">{currentPlayers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="text-blue-600 font-semibold">Pool total</span>
                  <span className="text-blue-600 font-bold text-lg">{totalBets.toLocaleString()} coins</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-green-600 font-semibold">Round actuel</span>
                  <span className="text-green-600 font-bold text-lg">#{gameNumber}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                  <span className="text-purple-600 font-semibold">Votre solde</span>
                  <span className="text-purple-600 font-bold text-lg">{userBalance.toLocaleString()} coins</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrashGame;