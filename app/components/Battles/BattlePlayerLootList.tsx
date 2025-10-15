// app/components/Battles/BattlePlayerLootList.tsx - Liste des gains individuels par joueur
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { Coins, Package, TrendingUp } from 'lucide-react'

interface BattlePlayerItem {
  id: string
  item_id: string
  item_value: number
  item_rarity: string
  box_instance: number
  opened_at: string
  items: {
    id: string
    name: string
    image_url: string | null
    market_value: number
    rarity: string
  }
}

interface BattlePlayerLootListProps {
  battleId: string
  participantId: string
  currentRound: number
  className?: string
}

export function BattlePlayerLootList({ 
  battleId, 
  participantId, 
  currentRound,
  className = '' 
}: BattlePlayerLootListProps) {
  const [playerItems, setPlayerItems] = useState<BattlePlayerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createClient()

  // Charger les items du joueur depuis la DB
  const loadPlayerItems = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('battle_openings')
        .select(`
          id,
          item_id,
          item_value,
          item_rarity,
          box_instance,
          opened_at,
          items!inner (
            id,
            name,
            image_url,
            market_value,
            rarity
          )
        `)
        .eq('battle_id', battleId)
        .eq('participant_id', participantId)
        .order('opened_at', { ascending: true })

      if (fetchError) {
        console.error('Erreur chargement items joueur:', fetchError)
        setError('Impossible de charger les items')
        return
      }

      // Transform data to handle arrays from joins
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        items: Array.isArray(item.items) ? item.items[0] : item.items
      }))

      setPlayerItems(transformedData)
      console.log(`Items chargés pour participant ${participantId}:`, transformedData.length)

    } catch (err) {
      console.error('Erreur critique:', err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [battleId, participantId, supabase])

  // Stats calculées
  const playerStats = useMemo(() => {
    const totalValue = playerItems.reduce((sum, item) => sum + item.item_value, 0)
    const itemCount = playerItems.length
    const currentRoundItems = playerItems.filter(item => item.box_instance === currentRound)
    const currentRoundValue = currentRoundItems.reduce((sum, item) => sum + item.item_value, 0)
    
    return {
      totalValue,
      itemCount,
      currentRoundItems: currentRoundItems.length,
      currentRoundValue
    }
  }, [playerItems, currentRound])

  // Couleurs de rareté
  const getRarityColor = useCallback((rarity: string) => {
    const colors = {
      common: '#10b981',
      uncommon: '#3b82f6',
      rare: '#8b5cf6',
      epic: '#d946ef',
      legendary: '#f59e0b'
    }
    return colors[rarity.toLowerCase() as keyof typeof colors] || colors.common
  }, [])

  // Grouper items par round
  const itemsByRound = useMemo(() => {
    const groups = new Map<number, BattlePlayerItem[]>()
    
    playerItems.forEach(item => {
      const round = item.box_instance
      if (!groups.has(round)) {
        groups.set(round, [])
      }
      groups.get(round)!.push(item)
    })
    
    return groups
  }, [playerItems])

  // Chargement initial et souscription temps réel
  useEffect(() => {
    loadPlayerItems()

    // Souscription pour les nouvelles ouvertures de ce joueur
    const channel = supabase
      .channel(`player-openings-${participantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_openings',
          filter: `battle_id=eq.${battleId}:and:participant_id=eq.${participantId}`
        },
        (payload) => {
          console.log('Nouvelle ouverture pour participant:', payload)
          loadPlayerItems() // Recharger les items
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [battleId, participantId, loadPlayerItems, supabase])

  if (loading) {
    return (
      <div className={`bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center h-20">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400 text-sm">Chargement...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/30 rounded-lg p-4 ${className}`}>
        <div className="text-center text-red-400 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800/30 border border-slate-700/50 rounded-lg overflow-hidden ${className}`}>
      
      {/* Header avec stats */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            Mes gains
          </h4>
          
          <div className="flex items-center gap-3 text-xs">
            <div className="text-gray-400">
              Round {currentRound}
            </div>
            <div className="text-green-400 font-bold">
              {playerStats.currentRoundValue.toFixed(2)}€
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-700/30 rounded p-2">
            <div className="text-lg font-bold text-white">
              {playerStats.totalValue.toFixed(2)}€
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="bg-slate-700/30 rounded p-2">
            <div className="text-lg font-bold text-white">
              {playerStats.itemCount}
            </div>
            <div className="text-xs text-gray-400">Items</div>
          </div>
          <div className="bg-slate-700/30 rounded p-2">
            <div className="text-lg font-bold text-blue-400">
              {playerStats.currentRoundItems}
            </div>
            <div className="text-xs text-gray-400">Ce round</div>
          </div>
        </div>
      </div>

      {/* Liste des items */}
      <div className="p-4">
        {playerItems.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Aucun item gagné</div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Items du round actuel */}
            {itemsByRound.has(currentRound) && (
              <div>
                <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  Round {currentRound} actuel
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {itemsByRound.get(currentRound)!.map((item, index) => (
                    <PlayerItemCard
                      key={`${item.id}-current`}
                      item={item}
                      index={index}
                      getRarityColor={getRarityColor}
                      isCurrent={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Items des rounds précédents */}
            {Array.from(itemsByRound.entries())
              .filter(([round]) => round < currentRound)
              .sort(([a], [b]) => b - a) // Plus récent en premier
              .slice(0, 2) // Limiter à 2 rounds précédents
              .map(([round, items]) => (
                <div key={round}>
                  <div className="text-xs text-gray-500 mb-2">
                    Round {round}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {items.map((item, index) => (
                      <PlayerItemCard
                        key={`${item.id}-${round}`}
                        item={item}
                        index={index}
                        getRarityColor={getRarityColor}
                        isCurrent={false}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              ))}

            {/* Résumé si beaucoup d'items */}
            {playerItems.length > 10 && (
              <div className="text-center py-2 text-gray-500 text-xs border-t border-slate-700/30">
                +{playerItems.length - 10} autres items
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant pour afficher un item individuel
interface PlayerItemCardProps {
  item: BattlePlayerItem
  index: number
  getRarityColor: (rarity: string) => string
  isCurrent: boolean
  compact?: boolean
}

function PlayerItemCard({ 
  item, 
  index, 
  getRarityColor, 
  isCurrent, 
  compact = false 
}: PlayerItemCardProps) {
  const glowColor = getRarityColor(item.item_rarity)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`relative group cursor-pointer ${
        compact ? 'aspect-square' : 'aspect-[3/4]'
      }`}
    >
      {/* Container principal */}
      <div 
        className={`w-full h-full bg-slate-800/50 border rounded-lg p-2 transition-all hover:border-slate-500/50 ${
          isCurrent 
            ? 'border-blue-500/50 shadow-lg' 
            : 'border-slate-600/50'
        }`}
        style={isCurrent ? {
          boxShadow: `0 4px 15px ${glowColor}30`
        } : {}}
      >
        
        {/* Image */}
        <div className="relative mb-2">
          <img
            src={item.items.image_url || '/placeholder-item.png'}
            alt={item.items.name}
            className={`w-full object-contain ${
              compact ? 'h-8' : 'h-12'
            }`}
            style={{
              filter: `drop-shadow(0 2px 6px ${glowColor}40)`
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-item.png'
            }}
          />
          
          {/* Badge round */}
          {!isCurrent && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {item.box_instance}
            </div>
          )}
          
          {/* Indicateur nouveau */}
          {isCurrent && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Nom */}
        {!compact && (
          <div className="text-xs font-medium text-white mb-1 truncate" title={item.items.name}>
            {item.items.name}
          </div>
        )}

        {/* Valeur */}
        <div className="flex items-center justify-center gap-1">
          <Coins 
            className={`${compact ? 'w-2 h-2' : 'w-3 h-3'}`}
            style={{ color: glowColor }}
          />
          <span 
            className={`${compact ? 'text-xs' : 'text-sm'} font-bold`}
            style={{ color: glowColor }}
          >
            {compact ? item.item_value.toFixed(0) : item.item_value.toFixed(2)}€
          </span>
        </div>

        {/* Rareté */}
        {!compact && (
          <div 
            className="text-xs mt-1 px-1 py-0.5 rounded text-center"
            style={{ 
              backgroundColor: `${glowColor}15`,
              color: glowColor
            }}
          >
            {item.item_rarity.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Effet hover pour les items actuels */}
        {isCurrent && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ borderColor: glowColor }}
          />
        )}
      </div>
      
      {/* Particules pour les items legendaires/epic du round actuel */}
      {isCurrent && (item.item_rarity === 'legendary' || item.item_rarity === 'epic') && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: glowColor,
                left: `${20 + (i * 30)}%`,
                top: `${20 + (i % 2) * 40}%`
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [0, -15, -30]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default BattlePlayerLootList