// lib/supabase.ts
import { createClient as createSupabaseClient } from '@/utils/supabase/client'
import type { Database } from '@/app/types/database'

export const createClient = () => createSupabaseClient()

// Types pour le jeu Mines
export type MinesGame = Database['public']['Tables']['mines_games']['Row']
export type MinesGameInsert = Database['public']['Tables']['mines_games']['Insert']
export type MinesGameUpdate = Database['public']['Tables']['mines_games']['Update']

export type GameStatus = 'in_progress' | 'won' | 'lost' | 'cashed_out'

export interface MinesGameState {
  id: string
  user_id: string
  bet_amount: number
  bomb_count: number
  status: GameStatus
  boxes_revealed: number
  bomb_positions: number[]
  revealed_positions: number[]
  final_multiplier: number
  win_amount: number
  profit_loss: number
  created_at: string
  finished_at: string | null
  duration_seconds: number | null
}

export interface StartGameResponse {
  success: boolean
  game_id: string
  message: string
}

export interface RevealBoxResponse {
  success: boolean
  is_bomb: boolean
  game_over: boolean
  status: GameStatus
  win_amount: number
  multiplier: number
  boxes_revealed: number
}

export interface CashOutResponse {
  success: boolean
  status: GameStatus
  win_amount: number
  profit: number
  multiplier: number
}