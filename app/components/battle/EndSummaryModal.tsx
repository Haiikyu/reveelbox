// app/components/battle/EndSummaryModal.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Player {
  id: string
  username: string
  avatar: string
  totalValue: number
  loots: Array<{
    boxIndex: number
    items: Array<{
      id: string
      name: string
      image: string
      value: number
      rarity: string
    }>
  }>
}

interface EndSummaryModalProps {
  isOpen: boolean
  players: Player[]
  winners: string[]
  battleId: string
  mode: '1v1' | '2v2' | '1v1v1'
  boxes: string[]
}

export function EndSummaryModal({ isOpen, players, winners, battleId, mode, boxes }: EndSummaryModalProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  
  const sortedPlayers = [...players].sort((a, b) => b.totalValue - a.totalValue)
  
  const handleReplay = async () => {
    router.push(`/battles/${battleId}`)
    window.location.reload()
  }
  
  const handleCreateSame = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, boxes })
      })
      if (!res.ok) throw new Error('Failed to create battle')
      const { id } = await res.json()
      router.push(`/battles/${id}`)
    } catch (error) {
      console.error('Failed to create battle:', error)
    } finally {
      setIsCreating(false)
    }
  }
  
  const handleBack = () => {
    router.push('/battles')
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: '#1C1F2B' }}
          >
            {/* Header */}
            <div className="p-6 text-center border-b border-gray-700">
              <motion.h2 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Battle Complete! 🎉
              </motion.h2>
              <div className="text-lg text-gray-400">
                {winners.length > 1 ? 'Winners' : 'Winner'}: {
                  winners.map(id => players.find(p => p.id === id)?.username).join(' & ')
                }
              </div>
            </div>
            
            {/* Players Summary */}
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {sortedPlayers.map((player, index) => {
                const isWinner = winners.includes(player.id)
                const totalItems = player.loots.reduce((sum, loot) => sum + loot.items.length, 0)
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-lg ${isWinner ? 'ring-2' : ''}`}
                    style={{ 
                      backgroundColor: '#13151F',
                      ringColor: isWinner ? '#28FF6A' : undefined
                    }}
                  >
                    <div className="text-2xl font-bold text-gray-500 w-8">
                      {isWinner ? '👑' : `#${index + 1}`}
                    </div>
                    
                    <img 
                      src={player.avatar} 
                      alt={player.username}
                      className="w-12 h-12 rounded-full"
                    />
                    
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {player.username}
                      </div>
                      <div className="text-sm text-gray-400">
                        {totalItems} items won
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div 
                        className="text-2xl font-bold"
                        style={{ color: isWinner ? '#28FF6A' : '#FFC64C' }}
                      >
                        ${player.totalValue.toFixed(2)}
                      </div>
                      {isWinner && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-sm font-semibold"
                          style={{ color: '#28FF6A' }}
                        >
                          WINNER!
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            {/* Actions */}
            <div className="p-6 border-t border-gray-700 flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReplay}
                className="px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: '#4C5BF9' }}
              >
                Replay Battle
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateSame}
                disabled={isCreating}
                className="px-6 py-3 rounded-lg font-semibold text-black disabled:opacity-50"
                style={{ backgroundColor: '#FFC64C' }}
              >
                {isCreating ? 'Creating...' : 'Create Same Battle'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="px-6 py-3 rounded-lg font-semibold text-white border border-gray-600"
              >
                Back to Battles
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
