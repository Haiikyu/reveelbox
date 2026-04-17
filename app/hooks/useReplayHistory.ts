'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { ActivityEntry, HistoryFilter } from '@/app/types/profile'

const PAGE_SIZE = 30 // Larger page to allow grouping without cutting groups

interface UseReplayHistoryReturn {
  entries: ActivityEntry[]
  totalCount: number
  hasMore: boolean
  loading: boolean
  loadMore: () => void
  filter: HistoryFilter
  setFilter: (f: HistoryFilter) => void
  /** Vrai si la dernière page était pleine (heuristique pour 'all') */
  mightHaveMore: boolean
}

/**
 * Groups consecutive box_opening items from the same box within a 8-second
 * window into a single multi-open ActivityEntry.
 * Items are expected to be sorted by obtained_at DESC.
 */
function groupBoxOpenings(items: any[]): ActivityEntry[] {
  if (!items.length) return []

  const groups: any[][] = []
  let currentGroup: any[] = [items[0]]

  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    const last = currentGroup[currentGroup.length - 1]
    const timeDiff = Math.abs(
      new Date(last.obtained_at).getTime() - new Date(item.obtained_at).getTime()
    )
    const sameBox = last.box_id && last.box_id === item.box_id
    const fromBox = item.obtained_from === 'box_opening'

    // Group if same box + within 8s + both from box openings
    if (sameBox && fromBox && last.obtained_from === 'box_opening' && timeDiff <= 8000) {
      currentGroup.push(item)
    } else {
      groups.push(currentGroup)
      currentGroup = [item]
    }
  }
  groups.push(currentGroup)

  return groups.map(group => {
    const first = group[0]
    const count = group.length

    if (count === 1) {
      // Single item — standard entry
      return {
        id: `box_${first.id}`,
        type: 'box_opening' as HistoryFilter,
        title: first.items?.name || 'Objet',
        description: `Obtenu dans ${(first.loot_boxes as any)?.name || 'une box'}`,
        value: first.items?.market_value || 0,
        rarity: first.items?.rarity || 'common',
        image_url: first.items?.image_url,
        created_at: first.obtained_at,
        metadata: {
          box_id: first.box_id,
          item_id: first.item_id,
          obtained_from: first.obtained_from,
        },
      } satisfies ActivityEntry
    }

    // Multi-open group — show as "Ouverture x2" / "x5" etc.
    const totalValue = group.reduce((s: number, i: any) => s + (i.items?.market_value || 0), 0)
    const bestItem = group.reduce((best: any, i: any) =>
      (i.items?.market_value || 0) > (best?.items?.market_value || 0) ? i : best
    , group[0])
    const multiIds = group.map((i: any) => i.id).join(',')

    return {
      id: `multibox_${first.id}`,
      type: 'box_opening' as HistoryFilter,
      title: `Ouverture x${count}`,
      description: (first.loot_boxes as any)?.name || 'Box',
      value: totalValue,
      rarity: bestItem?.items?.rarity || 'common',
      image_url: bestItem?.items?.image_url,
      created_at: first.obtained_at,
      metadata: {
        box_id: first.box_id,
        multi_ids: multiIds,
        count,
        items: group.map((i: any) => ({
          id: i.id,
          name: i.items?.name,
          rarity: i.items?.rarity,
          value: i.items?.market_value,
          image_url: i.items?.image_url,
        })),
      },
    } satisfies ActivityEntry
  })
}

export function useReplayHistory(userId: string | null | undefined): UseReplayHistoryReturn {
  const supabase = createClient()
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [lastPageCount, setLastPageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<HistoryFilter>('all')

  const fetchHistory = useCallback(async (reset = false) => {
    if (!userId) return
    setLoading(true)
    const currentPage = reset ? 0 : page
    const from = currentPage * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    try {
      const results: ActivityEntry[] = []

      if (filter === 'all' || filter === 'box_opening') {
        const { data: boxItems, count } = await supabase
          .from('user_inventory')
          .select(
            'id, item_id, obtained_at, box_id, obtained_from, items(name, market_value, rarity, image_url), loot_boxes:box_id(name)',
            { count: 'exact' }
          )
          .eq('user_id', userId)
          .order('obtained_at', { ascending: false })
          .range(from, to)

        const grouped = groupBoxOpenings(boxItems || [])
        results.push(...grouped)
        if (filter === 'box_opening') setTotalCount(count || 0)
      }

      if (filter === 'all' || filter === 'battle') {
        const { data: rawBattles, count } = await supabase
          .from('battle_participants')
          .select(
            'id, user_id, is_winner, total_value, joined_at, battles(id, name, entry_cost, status, mode, server_seed, client_seed, nonce, combined_hash, created_at)',
            { count: 'exact' }
          )
          .eq('user_id', userId)
          .order('joined_at', { ascending: false })
          .range(from, to)

        // Skip battles that are still waiting/in countdown
        const battles = (rawBattles || []).filter((bp: any) => {
          const status = (bp.battles as any)?.status
          return !status || (status !== 'waiting' && status !== 'countdown')
        })

        battles.forEach((bp: any) => {
          const battle = bp.battles as any
          results.push({
            id: `battle_${bp.id}`,
            type: 'battle',
            title: battle?.name || 'Battle',
            description: bp.is_winner ? 'Victoire !' : 'Défaite',
            value: bp.is_winner ? (bp.total_value || 0) : -(battle?.entry_cost || 0),
            created_at: bp.joined_at || battle?.created_at || new Date().toISOString(),
            metadata: {
              battle_id: battle?.id,
              is_winner: bp.is_winner,
              battle_type: battle?.mode,
              server_seed: battle?.server_seed,
              client_seed: battle?.client_seed,
              nonce: battle?.nonce,
              combined_hash: battle?.combined_hash,
            },
          })
        })
        if (filter === 'battle') setTotalCount(count || 0)
      }

      // Sort combined results by date (newest first)
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setLastPageCount(results.length)

      if (reset || currentPage === 0) {
        setEntries(results)
        // Pour 'all', totalCount = count estimé basé sur la page courante
        if (filter === 'all') setTotalCount(results.length)
      } else {
        setEntries(prev => {
          const updated = [...prev, ...results]
          if (filter === 'all') setTotalCount(updated.length)
          return updated
        })
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, page, filter])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(0)
    fetchHistory(true)
  }, [userId, filter])

  useEffect(() => {
    if (page > 0) fetchHistory()
  }, [page, fetchHistory])

  const loadMore = useCallback(() => setPage(p => p + 1), [])

  // Pour 'box_opening'/'battle', on a le vrai count ; pour 'all', on utilise
  // l'heuristique : si la dernière page était pleine, il y en a probablement d'autres.
  const hasMore = filter === 'all'
    ? lastPageCount >= PAGE_SIZE
    : entries.length < totalCount

  const mightHaveMore = lastPageCount >= PAGE_SIZE

  const handleSetFilter = useCallback((f: HistoryFilter) => {
    setFilter(f)
    setPage(0)
    setEntries([])
    setLastPageCount(0)
  }, [])

  return { entries, totalCount, hasMore, mightHaveMore, loading, loadMore, filter, setFilter: handleSetFilter }
}

/** Fetch battle replay data
 *
 * Note : la jointure directe battle_participants → profiles peut échouer si
 * la FK n'est pas déclarée dans PostgREST. On utilise le pattern "requêtes
 * séparées + jointure en JS" (cf. CLAUDE.md § Critical Database Patterns).
 */
export async function fetchBattleReplayData(battleId: string) {
  const supabase = createClient()

  const [battleRes, openingsRes, participantsRes] = await Promise.all([
    supabase.from('battles').select('*').eq('id', battleId).single(),
    supabase
      .from('battle_openings')
      .select('id, user_id, box_instance, item_id, items(id, name, market_value, rarity, image_url)')
      .eq('battle_id', battleId)
      .order('box_instance', { ascending: true }),
    supabase
      .from('battle_participants')
      .select('user_id, is_winner, total_value, is_bot')
      .eq('battle_id', battleId),
  ])

  const rawParticipants = participantsRes.data || []

  // Jointure profiles en JS pour éviter l'erreur "relationship not found"
  // (cf. CLAUDE.md § Critical Database Patterns)
  let participants: Array<{
    user_id: string
    is_winner: boolean | null
    total_value: number | null
    is_bot: boolean | null
    profiles: { id: string; username: string | null; avatar_url: string | null; level: number } | null
  }> = rawParticipants.map(p => ({ ...p, profiles: null }))

  if (rawParticipants.length > 0) {
    const userIds = [...new Set(rawParticipants.map(p => p.user_id).filter(Boolean))]
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level')
      .in('id', userIds)

    const profileMap = new Map((profileRows || []).map(p => [p.id, p]))
    participants = rawParticipants.map(p => ({
      ...p,
      profiles: profileMap.get(p.user_id) ?? null,
    }))
  }

  return {
    battle: battleRes.data,
    openings: openingsRes.data || [],
    participants,
  }
}
