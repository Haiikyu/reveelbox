'use client'

import { useMemo } from 'react'
import type { Achievement, UserStats } from '@/app/types/profile'

export function useAchievements(stats: UserStats): { achievements: Achievement[]; unlockedCount: number; totalCount: number } {
  const achievements = useMemo(() => {
    const defs: Achievement[] = [
      // Boxes
      { id: 'first_box', name: 'Première ouverture', description: 'Ouvrir votre première box', icon: '📦', category: 'boxes', progress: Math.min(stats.totalBoxesOpened, 1), target: 1, unlocked: stats.totalBoxesOpened >= 1 },
      { id: 'box_10', name: 'Collectionneur', description: 'Ouvrir 10 boxes', icon: '🎁', category: 'boxes', progress: Math.min(stats.totalBoxesOpened, 10), target: 10, unlocked: stats.totalBoxesOpened >= 10 },
      { id: 'box_100', name: 'Accro aux boxes', description: 'Ouvrir 100 boxes', icon: '💎', category: 'boxes', progress: Math.min(stats.totalBoxesOpened, 100), target: 100, unlocked: stats.totalBoxesOpened >= 100 },
      { id: 'box_500', name: 'Maître des boxes', description: 'Ouvrir 500 boxes', icon: '👑', category: 'boxes', progress: Math.min(stats.totalBoxesOpened, 500), target: 500, unlocked: stats.totalBoxesOpened >= 500 },

      // Battles
      { id: 'first_battle', name: 'Premier combat', description: 'Participer à une battle', icon: '⚔️', category: 'battles', progress: Math.min(stats.battlesPlayed, 1), target: 1, unlocked: stats.battlesPlayed >= 1 },
      { id: 'battle_wins_10', name: 'Guerrier', description: 'Gagner 10 battles', icon: '🏆', category: 'battles', progress: Math.min(stats.battlesWon, 10), target: 10, unlocked: stats.battlesWon >= 10 },
      { id: 'battle_wins_50', name: 'Champion', description: 'Gagner 50 battles', icon: '🥇', category: 'battles', progress: Math.min(stats.battlesWon, 50), target: 50, unlocked: stats.battlesWon >= 50 },
      { id: 'win_streak_5', name: 'Inarrêtable', description: 'Enchaîner 5 victoires', icon: '🔥', category: 'battles', progress: Math.min(stats.longestWinStreak, 5), target: 5, unlocked: stats.longestWinStreak >= 5 },

      // Streaks
      { id: 'streak_7', name: 'Assidu', description: 'Connexion 7 jours de suite', icon: '📅', category: 'streak', progress: Math.min(stats.longestStreak, 7), target: 7, unlocked: stats.longestStreak >= 7 },
      { id: 'streak_30', name: 'Fidèle', description: 'Connexion 30 jours de suite', icon: '🗓️', category: 'streak', progress: Math.min(stats.longestStreak, 30), target: 30, unlocked: stats.longestStreak >= 30 },

      // Collection
      { id: 'inventory_25', name: 'Petit inventaire', description: 'Posséder 25 objets', icon: '🎒', category: 'collection', progress: Math.min(stats.inventoryCount, 25), target: 25, unlocked: stats.inventoryCount >= 25 },
      { id: 'inventory_100', name: 'Collectionneur avancé', description: 'Posséder 100 objets', icon: '🏛️', category: 'collection', progress: Math.min(stats.inventoryCount, 100), target: 100, unlocked: stats.inventoryCount >= 100 },
    ]
    return defs
  }, [stats])

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return { achievements, unlockedCount, totalCount: achievements.length }
}
