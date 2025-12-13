// hooks/useMinesGame.ts
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { 
  MinesGameState, 
  StartGameResponse, 
  RevealBoxResponse, 
  CashOutResponse 
} from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useMinesGame() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<number>(0)
  const [currentGame, setCurrentGame] = useState<MinesGameState | null>(null)
  const [gameHistory, setGameHistory] = useState<MinesGameState[]>([])
  const [loading, setLoading] = useState(true) // Start with true to indicate initial loading
  const supabase = createClient()

  // Charger l'utilisateur et son solde
  useEffect(() => {
    const init = async () => {
      await loadUser()
      await loadGameHistory()
      await loadActiveGame()
    }
    init()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)

        // Charger le profil avec le solde
        const { data: profile } = await supabase
          .from('profiles')
          .select('virtual_currency')
          .eq('id', user.id)
          .single()

        if (profile) {
          setBalance(profile.virtual_currency || 0)
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGameHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('mines_games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      if (data) setGameHistory(data as MinesGameState[])
    } catch (error) {
      console.error('Error loading game history:', error)
    }
  }

  const loadActiveGame = async () => {
    try {
      const { data, error } = await supabase
        .from('mines_games')
        .select('*')
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setCurrentGame(data as MinesGameState)
        console.log('Active game loaded:', data)
      }
    } catch (error) {
      console.error('Error loading active game:', error)
    }
  }

  const refreshBalance = async () => {
    if (!user) return

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('virtual_currency')
        .eq('id', user.id)
        .single()

      if (profile) {
        setBalance(profile.virtual_currency || 0)
      }
    } catch (error) {
      console.error('Error refreshing balance:', error)
    }
  }

  const startGame = async (betAmount: number, bombCount: number): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté pour jouer')
      return false
    }

    if (balance < betAmount) {
      toast.error('Solde insuffisant !')
      return false
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.rpc('start_mines_game', {
        p_user_id: user.id,
        p_bet_amount: betAmount,
        p_bomb_count: bombCount
      })

      if (error) throw error

      const response = data as StartGameResponse

      console.log('Start game response:', response)

      if (response.success) {
        // Charger la partie créée
        const { data: gameData } = await supabase
          .from('mines_games')
          .select('*')
          .eq('id', response.game_id)
          .single()

        if (gameData) {
          setCurrentGame(gameData as MinesGameState)
          await refreshBalance()
          toast.success('Partie démarrée !')
          return true
        } else {
          toast.error('Impossible de charger la partie créée')
          return false
        }
      } else {
        // Afficher le message d'erreur de la fonction SQL
        toast.error(response.message || 'Erreur lors du démarrage de la partie')
        return false
      }
    } catch (error: any) {
      console.error('Error starting game:', error)
      toast.error(error.message || 'Erreur lors du démarrage de la partie')
      return false
    } finally {
      setLoading(false)
    }
  }

  const revealBox = async (boxIndex: number): Promise<RevealBoxResponse | null> => {
    if (!currentGame || currentGame.status !== 'in_progress') {
      return null
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.rpc('reveal_mines_box', {
        p_game_id: currentGame.id,
        p_box_index: boxIndex
      })

      if (error) throw error

      const response = data as RevealBoxResponse
      
      // Recharger la partie pour avoir les données à jour
      const { data: gameData } = await supabase
        .from('mines_games')
        .select('*')
        .eq('id', currentGame.id)
        .single()
      
      if (gameData) {
        setCurrentGame(gameData as MinesGameState)
      }

      if (response.game_over) {
        await refreshBalance()
        await loadGameHistory()
        
        if (response.is_bomb) {
          toast.error('💣 BOOM ! Vous avez touché une bombe !')
        } else if (response.status === 'won') {
          toast.success(`🎉 VICTOIRE ! Vous avez gagné ${response.win_amount.toFixed(2)} coins !`)
        }
      }
      
      return response
    } catch (error: any) {
      console.error('Error revealing box:', error)
      toast.error(error.message || 'Erreur lors de la révélation')
      return null
    } finally {
      setLoading(false)
    }
  }

  const cashOut = async (): Promise<CashOutResponse | null> => {
    if (!currentGame || currentGame.status !== 'in_progress') {
      return null
    }

    if (currentGame.boxes_revealed === 0) {
      toast.error('Vous devez révéler au moins une boîte avant d\'encaisser')
      return null
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.rpc('cash_out_mines_game', {
        p_game_id: currentGame.id
      })

      if (error) throw error

      const response = data as CashOutResponse

      if (response.success) {
        await refreshBalance()
        await loadGameHistory()

        // Recharger la partie pour avoir le statut à jour
        const { data: gameData } = await supabase
          .from('mines_games')
          .select('*')
          .eq('id', currentGame.id)
          .single()

        if (gameData) {
          setCurrentGame(gameData as MinesGameState)
        }

        toast.success(`🏆 Vous avez encaissé ${response.win_amount.toFixed(2)} coins ! (Profit: +${response.profit.toFixed(2)})`)
        return response
      }

      return null
    } catch (error: any) {
      console.error('Error cashing out:', error)
      toast.error(error.message || 'Erreur lors de l\'encaissement')
      return null
    } finally {
      setLoading(false)
    }
  }

  const resetGame = () => {
    setCurrentGame(null)
  }

  const calculateMultiplier = (revealed: number, bombs: number): number => {
    const safeBoxes = 25 - bombs
    const baseMultiplier = 1 + (bombs / safeBoxes)
    return Math.pow(baseMultiplier, revealed)
  }

  // Calculer le gameState basé sur currentGame
  const gameState = currentGame?.status === 'in_progress' ? 'playing' : 'idle'

  return {
    // État
    user,
    balance,
    currentGame,
    gameHistory,
    loading,
    gameState,

    // Actions
    startGame,
    revealBox,
    cashOut,
    resetGame,
    refreshBalance,

    // Utilitaires
    calculateMultiplier
  }
}