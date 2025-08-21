'use client'

import { motion } from 'framer-motion'

interface LootItem {
  id: string
  name: string
  image: string
  value: number
  rarity: string
}

interface PlayerLoot {
  boxIndex: number
  items: LootItem[]
}

interface Player {
  id: string
  username: string
  avatar: string
  bot: boolean
  totalValue: number
  loots: PlayerLoot[]
  team?: 'A' | 'B' | null
}

interface PlayerPanelProps {
  player: Player
  isWinner?: boolean
  position: 'left' | 'right' | 'center'
}

export function PlayerPanel({ player, isWinner = false, position }: PlayerPanelProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return '#FF4C4C'
      case 'epic': return '#4C5BF9'
      case 'rare': return '#FFC64C'
      default: return '#9CA3AF'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col p-4 rounded-lg ${isWinner ? 'ring-2' : ''}`}
      style={{ 
        backgroundColor: '#1C1F2B',
        ringColor: isWinner ? '#28FF6A' : undefined
      }}
    >
      {/* Player header */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={player.avatar} 
          alt={player.username}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {player.username}
            </span>
            {player.bot && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                BOT
              </span>
            )}
            {player.team && (
              <span 
                className="text-xs px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: player.team === 'A' ? '#4C5BF9' : '#FFC64C' }}
              >
                Team {player.team}
              </span>
            )}
          </div>
          <div className="text-lg font-bold" style={{ color: '#28FF6A' }}>
            ${player.totalValue.toFixed(2)}
          </div>
        </div>
        {isWinner && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-2xl"
          >
            👑
          </motion.div>
        )}
      </div>
      
      {/* Loot display */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {player.loots.map((loot, lootIndex) => (
          <div key={lootIndex} className="space-y-1">
            <div className="text-xs text-gray-400">Box #{loot.boxIndex + 1}</div>
            <div className="grid grid-cols-2 gap-1">
              {loot.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: lootIndex * 0.1 }}
                  className="relative p-2 rounded border"
                  style={{ 
                    borderColor: getRarityColor(item.rarity),
                    backgroundColor: getRarityColor(item.rarity) + '10'
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-12 object-contain mb-1"
                  />
                  <div className="text-xs text-center text-white truncate">
                    {item.name}
                  </div>
                  <div 
                    className="text-xs text-center font-bold"
                    style={{ color: getRarityColor(item.rarity) }}
                  >
                    ${item.value}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
