// components/games/RevealBoxMines.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bomb, Gift, Play, RotateCcw, Trophy, Coins, X } from 'lucide-react'
import { useMinesGame } from '@/app/hooks/useMinesGame'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

// Configuration
const GRID_SIZE = 25
const GRID_COLS = 5
const GRID_ROWS = 5
const BOMB_OPTIONS = [3, 5, 10, 16]
const BET_OPTIONS = [1, 5, 10, 25, 50]

// Types
interface BoxData {
  index: number
  isRevealed: boolean
  isBomb: boolean
  multiplier: number
}

interface ModalResult {
  type: 'win' | 'loss'
  amount: number
}

// Composant de grille
interface GridBoxProps {
  data: BoxData
  onClick: () => void
  disabled: boolean
}

const GridBox: React.FC<GridBoxProps> = ({ data, onClick, disabled }) => {
  const { index, isRevealed, isBomb, multiplier } = data

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isRevealed}
      whileHover={!disabled && !isRevealed ? { scale: 1.05 } : {}}
      whileTap={!disabled && !isRevealed ? { scale: 0.95 } : {}}
      className={`
        relative aspect-square rounded-xl border-2 transition-all duration-300
        ${!isRevealed 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 hover:border-cyan-400/50 cursor-pointer' 
          : isBomb 
            ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 shadow-red-500/50' 
            : 'bg-gradient-to-br from-green-600 to-green-800 border-green-500 shadow-green-500/50'
        }
        ${isRevealed && 'shadow-2xl'}
        disabled:cursor-not-allowed
      `}
      style={{
        boxShadow: isRevealed 
          ? isBomb 
            ? '0 0 30px rgba(239, 68, 68, 0.5)' 
            : '0 0 30px rgba(34, 197, 94, 0.5)'
          : 'none'
      }}
    >
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="gift"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Gift className="w-10 h-10 md:w-12 md:h-12 text-purple-400" 
              style={{ 
                filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.6))' 
              }} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          >
            {isBomb ? (
              <>
                <Bomb className="w-12 h-12 md:w-14 md:h-14 text-white animate-pulse" />
              </>
            ) : (
              <>
                <motion.div 
                  className="text-white font-black text-sm md:text-base tracking-wider rotate-[-15deg]"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  REEL
                </motion.div>
                <motion.div 
                  className="text-white font-bold text-lg md:text-xl bg-black/40 px-3 py-1 rounded-lg"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  x{multiplier.toFixed(2)}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// Modal de résultat
interface ResultModalProps {
  isOpen: boolean
  result: ModalResult | null
  onClose: () => void
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, result, onClose }) => {
  if (!result) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <div className={`
              relative rounded-3xl p-8 text-center
              ${result.type === 'loss' 
                ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }
              shadow-2xl
            `}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                {result.type === 'loss' ? (
                  <div className="text-8xl">💣</div>
                ) : (
                  <div className="text-8xl">🎉</div>
                )}
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-black text-white mb-4"
              >
                {result.type === 'loss' ? 'BOOM !' : 'GAGNÉ !'}
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-white/90 font-medium"
              >
                {result.type === 'loss' 
                  ? `Vous avez perdu ${result.amount.toFixed(2)} coins`
                  : `Vous avez gagné ${result.amount.toFixed(2)} coins`
                }
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Composant principal
export default function RevealBoxMines() {
  const router = useRouter()
  const {
    gameState,
    currentGame,
    balance,
    loading,
    gameHistory,
    startGame,
    revealBox,
    cashOut,
    resetGame
  } = useMinesGame()

  // États locaux
  const [betAmount, setBetAmount] = useState<number>(5)
  const [bombCount, setBombCount] = useState<number>(3)
  const [boxes, setBoxes] = useState<BoxData[]>([])
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(0)
  const [winAmount, setWinAmount] = useState<number>(0)
  const [modalResult, setModalResult] = useState<ModalResult | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Initialiser la grille
  useEffect(() => {
    const initBoxes: BoxData[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
      index: i,
      isRevealed: false,
      isBomb: false,
      multiplier: 0
    }))
    setBoxes(initBoxes)
  }, [])

  // Mettre à jour les multiplicateurs
  useEffect(() => {
    if (currentGame) {
      const safeBoxes = GRID_SIZE - currentGame.bomb_count
      const revealedBoxes = currentGame.boxes_revealed
      const remainingSafeBoxes = safeBoxes - revealedBoxes
      
      if (remainingSafeBoxes > 0) {
        const multiplier = Math.pow(1 + (currentGame.bomb_count / remainingSafeBoxes), revealedBoxes + 1)
        setCurrentMultiplier(multiplier)
        setWinAmount(betAmount * multiplier)
      }
    }
  }, [currentGame, betAmount])

  // Gestion du démarrage
  const handleStartGame = async () => {
    if (balance < betAmount) {
      toast.error('Solde insuffisant !')
      return
    }

    try {
      const game = await startGame(betAmount, bombCount)
      if (game) {
        const initBoxes: BoxData[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
          index: i,
          isRevealed: false,
          isBomb: false,
          multiplier: 0
        }))
        setBoxes(initBoxes)
        setCurrentMultiplier(0)
        setWinAmount(0)
        toast.success('Partie lancée ! Bonne chance ! 🎮')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du démarrage')
    }
  }

  // Gestion de la révélation
  const handleRevealBox = async (index: number) => {
    if (!currentGame || boxes[index].isRevealed || loading) return

    try {
      const result = await revealBox(index)
      
      if (result) {
        const newBoxes = [...boxes]
        newBoxes[index] = {
          ...newBoxes[index],
          isRevealed: true,
          isBomb: result.is_bomb,
          multiplier: result.multiplier
        }
        setBoxes(newBoxes)

        if (result.is_bomb) {
          // Perdu - afficher modal
          setTimeout(() => {
            setModalResult({ type: 'loss', amount: betAmount })
            setShowModal(true)
          }, 800)
        } else {
          // Gagné - calculer nouveau multiplicateur
          setCurrentMultiplier(result.multiplier)
          setWinAmount(betAmount * result.multiplier)
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la révélation')
    }
  }

  // Gestion de l'encaissement
  const handleCashOut = async () => {
    if (!currentGame || loading) return

    try {
      const result = await cashOut()
      
      if (result && result.profit_loss > 0) {
        setModalResult({ type: 'win', amount: result.profit_loss })
        setShowModal(true)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'encaissement')
    }
  }

  // Gestion du reset
  const handleResetGame = () => {
    resetGame()
    const initBoxes: BoxData[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
      index: i,
      isRevealed: false,
      isBomb: false,
      multiplier: 0
    }))
    setBoxes(initBoxes)
    setCurrentMultiplier(0)
    setWinAmount(0)
    setShowModal(false)
    setModalResult(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <Toaster position="top-center" />
      
      {/* Modal de résultat */}
      <ResultModal 
        isOpen={showModal} 
        result={modalResult} 
        onClose={() => {
          setShowModal(false)
          if (modalResult?.type === 'loss' || modalResult?.type === 'win') {
            handleResetGame()
          }
        }} 
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
            💎 Mines Game
          </h1>
          <p className="text-slate-400">Révèle les cadeaux sans toucher les bombes !</p>
        </div>

        {/* Balance */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-3 rounded-full shadow-lg">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-lg">{balance.toFixed(2)} coins</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne 1: Configuration */}
          <div className="space-y-6">
            {/* Mise */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <label className="block text-sm text-slate-300 mb-3 font-medium">💰 Mise</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {BET_OPTIONS.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBetAmount(amount)}
                    disabled={gameState === 'playing' || loading}
                    className={`
                      py-3 rounded-xl font-bold transition-all
                      ${betAmount === amount 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                      ${(gameState === 'playing' || loading) && 'opacity-50 cursor-not-allowed'}
                    `}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                disabled={gameState === 'playing' || loading}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 transition-all"
                min="1"
                step="1"
              />
            </div>

            {/* Bombes */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <label className="block text-sm text-slate-300 mb-3 font-medium">💣 Bombes</label>
              <div className="grid grid-cols-2 gap-2">
                {BOMB_OPTIONS.map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBombCount(count)}
                    disabled={gameState === 'playing' || loading}
                    className={`
                      py-4 rounded-xl font-bold transition-all flex flex-col items-center gap-1
                      ${bombCount === count 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                      ${(gameState === 'playing' || loading) && 'opacity-50 cursor-not-allowed'}
                    `}
                  >
                    <Bomb className="w-5 h-5" />
                    <span>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats en jeu */}
            {gameState === 'playing' && currentGame && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">📊 Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Multiplicateur</span>
                    <span className="text-2xl font-black text-cyan-400">
                      x{currentMultiplier.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Gain potentiel</span>
                    <span className="text-xl font-bold text-green-400">
                      {winAmount.toFixed(2)} 
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cases révélées</span>
                    <span className="text-lg font-medium text-white">
                      {currentGame.boxes_revealed} / {25 - currentGame.bomb_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Colonne 2: Grille */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-3xl p-6 md:p-8">
              <div 
                className="grid gap-3 md:gap-4 mx-auto max-w-2xl"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
                }}
              >
                {boxes.map((box) => (
                  <GridBox
                    key={box.index}
                    data={box}
                    onClick={() => handleRevealBox(box.index)}
                    disabled={gameState !== 'playing' || loading}
                  />
                ))}
              </div>

              {/* Boutons d'action */}
              <div className="mt-8 flex gap-4">
                {gameState === 'idle' ? (
                  <button
                    onClick={handleStartGame}
                    disabled={loading || balance < betAmount}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-cyan-500/30"
                  >
                    <Play className="w-5 h-5" />
                    JOUER ({betAmount} coins)
                  </button>
                ) : gameState === 'playing' ? (
                  <>
                    <button
                      onClick={handleCashOut}
                      disabled={loading || !currentGame || currentGame.boxes_revealed === 0}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-green-500/30"
                    >
                      <Trophy className="w-5 h-5" />
                      ENCAISSER ({winAmount.toFixed(2)})
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleResetGame}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
                  >
                    <RotateCcw className="w-5 h-5" />
                    REJOUER
                  </button>
                )}
              </div>
            </div>

            {/* Historique */}
            {gameHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-2xl p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">📜 Historique</h3>
                <div className="space-y-2">
                  {gameHistory.slice(0, 5).map((game) => (
                    <div key={game.id} className="flex justify-between items-center text-sm bg-slate-700/50 rounded-lg px-4 py-2">
                      <span className="text-slate-300">{game.bomb_count} bombes</span>
                      <span className={`font-bold ${game.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {game.profit_loss >= 0 ? '+' : ''}{game.profit_loss.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}