'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getUserLevelInfo } from '@/lib/xp-system'
import type { UserStats } from '@/app/types/profile'

const DEFAULT_STATS: UserStats = {
  totalBoxesOpened: 0,
  totalCoinsSpent: 0,
  totalCoinsEarned: 0,
  totalValue: 0,
  totalItemsSold: 0,
  totalRevenue: 0,
  battlesWon: 0,
  battlesLost: 0,
  battlesPlayed: 0,
  battleWinRate: 0,
  totalBattleWinnings: 0,
  totalBattleLosses: 0,
  longestWinStreak: 0,
  currentWinStreak: 0,
  currentStreak: 0,
  longestStreak: 0,
  level: 1,
  totalExp: 0,
  currentLevelXP: 0,
  nextLevelXP: 100,
  inventoryCount: 0,
  uniqueItemsCount: 0,
  mostExpensiveItem: null,
  favoriteRarity: '',
  favoriteBox: '',
  mostOpenedBox: '',
  luckiestBox: '',
  joinDate: null,
  lastActivity: null,
  globalRank: 0,
  levelRank: 0,
}

interface UseProfileStatsReturn {
  stats: UserStats
  recentItems: any[]
  loading: boolean
  refetch: () => void
}

export function useProfileStats(userId: string | null | undefined, profileData?: any): UseProfileStatsReturn {
  const supabase = createClient()
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)
  const [recentItems, setRecentItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    try {
      const userTotalExp = profileData?.total_exp || 0
      const userLevel = profileData?.level || 1

      // Requêtes parallèles — COUNT queries pour bypasser la limite 1000 de Supabase
      const [
        inventoryRes,
        boxOpenCountRes,
        activeCountRes,
        uniqueItemsRes,
        battlesRes,
        transactionsRes,
        globalRankRes,
        levelRankRes,
        recentRes,
      ] = await Promise.all([
        // Échantillon limité pour calculs qualitatifs (box préférée, item le plus cher…)
        supabase.from('user_inventory')
          .select('id, item_id, is_sold, quantity, obtained_at, box_id, obtained_from, items(id, name, market_value, rarity, image_url)')
          .eq('user_id', userId)
          .order('obtained_at', { ascending: false })
          .limit(500),
        // Nombre EXACT d'ouvertures de boxes (exclut les items issus de battles)
        supabase.from('user_inventory')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('obtained_from', 'box_opening'),
        // Nombre EXACT d'items actifs (bypass limite 1000)
        supabase.from('user_inventory')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('is_sold', true),
        // item_ids pour compter les objets uniques (jusqu'à 2000)
        supabase.from('user_inventory')
          .select('item_id')
          .eq('user_id', userId)
          .neq('is_sold', true)
          .limit(2000),
        supabase.from('battle_participants')
          .select('id, user_id, is_winner, total_value, joined_at, battles(id, name, entry_cost, status, mode, created_at)')
          .eq('user_id', userId)
          .order('joined_at', { ascending: false }),
        supabase.from('transactions').select('amount, type').eq('user_id', userId),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('total_exp', userTotalExp),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('level', userLevel),
        supabase.from('user_inventory')
          .select('id, item_id, obtained_at, box_id, obtained_from, items(name, market_value, rarity, image_url), loot_boxes:box_id(name)')
          .eq('user_id', userId)
          .order('obtained_at', { ascending: false })
          .limit(5),
      ])

      const inventory = inventoryRes.data || []
      const battles = (battlesRes.data || []).filter((bp: any) => {
        const status = (bp.battles as any)?.status
        return !status || (status !== 'waiting' && status !== 'countdown')
      })
      const transactions = transactionsRes.data || []
      const recent = recentRes.data || []

      // Comptes précis via les requêtes COUNT (ne dépendent pas de la limite 1000)
      const totalBoxesOpened = boxOpenCountRes.count ?? inventory.filter((i: any) => i.obtained_from === 'box_opening').length
      const inventoryCount = activeCountRes.count ?? inventory.filter((i: any) => !i.is_sold).length
      const uniqueItemsCount = new Set((uniqueItemsRes.data || []).map((i: any) => i.item_id)).size

      const activeInventory = inventory.filter((item: any) => !item.is_sold)
      const soldItems = inventory.filter((item: any) => item.is_sold)

      const totalValue = activeInventory.reduce((sum: number, item: any) => sum + (item.items?.market_value || 0) * (item.quantity || 1), 0)
      const totalItemsSold = soldItems.length
      const totalRevenue = soldItems.reduce((sum: number, item: any) => sum + (item.items?.market_value || 0) * (item.quantity || 1), 0)

      const totalCoinsSpent = transactions
        .filter((t: any) => t.type === 'box_opening' || t.type === 'battle_entry' || t.type === 'upgrade')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
      const totalCoinsEarned = transactions
        .filter((t: any) => t.type === 'battle_win' || t.type === 'item_sale' || t.type === 'deposit' || t.type === 'purchase_coins')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

      const battlesPlayed = battles.length
      const battlesWon = battles.filter((b: any) => b.is_winner).length
      const battlesLost = battlesPlayed - battlesWon
      const battleWinRate = battlesPlayed > 0 ? (battlesWon / battlesPlayed) * 100 : 0

      const totalBattleWinnings = battles
        .filter((b: any) => b.is_winner)
        .reduce((sum: number, b: any) => sum + (b.battles?.entry_cost || 0), 0)
      const totalBattleLosses = battles
        .filter((b: any) => !b.is_winner)
        .reduce((sum: number, b: any) => sum + (b.battles?.entry_cost || 0), 0)

      // Win streaks
      let currentWinStreak = 0
      let longestWinStreak = 0
      let tempStreak = 0
      battles.forEach((battle: any, index: number) => {
        if (battle.is_winner) {
          tempStreak++
          if (index === 0) currentWinStreak = tempStreak
          longestWinStreak = Math.max(longestWinStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      })

      // Most expensive item
      const mostExpensiveItem = activeInventory.reduce((max: any, item: any) =>
        (item.items?.market_value || 0) > (max?.items?.market_value || 0) ? item : max
      , activeInventory[0] || null)

      // Favorite rarity
      const rarityCount: Record<string, number> = {}
      activeInventory.forEach((item: any) => {
        const rarity = item.items?.rarity || 'common'
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1
      })
      const favoriteRarity = Object.entries(rarityCount).length > 0
        ? Object.entries(rarityCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : ''

      // Most opened / luckiest box
      const boxCount: Record<string, number> = {}
      const boxValues: Record<string, { total: number; count: number }> = {}
      inventory.forEach((item: any) => {
        if (item.box_id) {
          boxCount[item.box_id] = (boxCount[item.box_id] || 0) + 1
          if (!boxValues[item.box_id]) boxValues[item.box_id] = { total: 0, count: 0 }
          boxValues[item.box_id].total += item.items?.market_value || 0
          boxValues[item.box_id].count += 1
        }
      })

      const mostOpenedBoxId = Object.entries(boxCount).length > 0
        ? Object.entries(boxCount).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : null

      let mostOpenedBox = ''
      let favoriteBox = ''
      if (mostOpenedBoxId) {
        const { data: boxData } = await supabase.from('loot_boxes').select('name').eq('id', mostOpenedBoxId).maybeSingle()
        if (boxData) { mostOpenedBox = boxData.name; favoriteBox = boxData.name }
      }

      let luckiestBox = ''
      let maxAvgValue = 0
      let luckiestBoxId: string | null = null
      Object.entries(boxValues).forEach(([boxId, data]) => {
        const avgValue = data.total / data.count
        if (avgValue > maxAvgValue) { maxAvgValue = avgValue; luckiestBoxId = boxId }
      })
      if (luckiestBoxId) {
        const { data: luckyBoxData } = await supabase.from('loot_boxes').select('name').eq('id', luckiestBoxId).maybeSingle()
        if (luckyBoxData) luckiestBox = luckyBoxData.name
      }

      // Rank = number of profiles with more XP + 1
      const globalRank = (globalRankRes.count ?? 0) + 1
      // Level rank = number of profiles with strictly higher level + 1
      const levelRank = (levelRankRes.count ?? 0) + 1

      // Calculate XP progress using the centralised xp-system
      const levelInfo = getUserLevelInfo(userTotalExp)

      setStats({
        totalBoxesOpened,
        totalCoinsSpent,
        totalCoinsEarned,
        totalValue,
        totalItemsSold,
        totalRevenue,
        battlesWon,
        battlesLost,
        battlesPlayed,
        battleWinRate,
        totalBattleWinnings,
        totalBattleLosses,
        longestWinStreak,
        currentWinStreak,
        currentStreak: profileData?.consecutive_days || 0,
        longestStreak: profileData?.longest_streak || 0,
        level: levelInfo.level,
        totalExp: levelInfo.totalExp,
        currentLevelXP: levelInfo.currentLevelExp,
        nextLevelXP: levelInfo.expToNextLevel,
        inventoryCount,
        uniqueItemsCount,
        mostExpensiveItem,
        favoriteRarity,
        favoriteBox,
        mostOpenedBox,
        luckiestBox,
        joinDate: profileData?.created_at || null,
        lastActivity: profileData?.last_activity || null,
        globalRank,
        levelRank,
      })
      setRecentItems(recent)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, profileData])

  useEffect(() => { loadStats() }, [loadStats])

  return { stats, recentItems, loading, refetch: loadStats }
}

/** Lightweight public stats from the view */
export function usePublicStats(userId: string | null | undefined) {
  const supabase = createClient()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const fetch = async () => {
      const { data } = await supabase
        .from('profile_public_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
      setStats(data)
      setLoading(false)
    }
    fetch()
  }, [userId])

  return { stats, loading }
}
