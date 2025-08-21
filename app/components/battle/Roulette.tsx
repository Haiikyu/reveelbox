'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RouletteItem {
  id: string
  name: string
  image: string
  value: number
  rarity: string
}

interface RouletteProps {
  items: RouletteItem[]
  onFinish: () => void
  duration?: number
}

export function Roulette({ items, onFinish, duration = 2000 }: RouletteProps) {
  const [isSpinning, setIsSpinning] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  // Generate extended array for smooth spinning effect
  const extendedItems = [...items, ...items, ...items]
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const winnerIndex = Math.floor(Math.random() * items.length)
      setSelectedIndex(winnerIndex)
      setIsSpinning(false)
      setTimeout(onFinish, 500) // Allow time for reveal animation
    }, duration)
    
    return () => clearTimeout(timer)
  }, [items.length, duration, onFinish])
  
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return '#FF4C4C'
      case 'epic': return '#4C5BF9'
      case 'rare': return '#FFC64C'
      default: return '#9CA3AF'
    }
  }
  
  return (
    <div className="relative w-full h-24 overflow-hidden rounded-lg" style={{ backgroundColor: '#1C1F2B' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-0.5 h-full bg-white/50 z-10"></div>
      </div>
      
      <motion.div
        className="flex items-center h-full"
        animate={{
          x: isSpinning ? -1200 : selectedIndex !== null ? -(selectedIndex * 80 + 40) : 0
        }}
        transition={{
          duration: isSpinning ? 2 : 0.5,
          ease: isSpinning ? 'linear' : 'easeOut'
        }}
      >
        {extendedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 w-20 h-20 p-1"
          >
            <div 
              className="relative w-full h-full rounded border-2 overflow-hidden"
              style={{ 
                borderColor: getRarityColor(item.rarity),
                opacity: !isSpinning && selectedIndex !== null && index % items.length === selectedIndex ? 1 : 0.7
              }}
            >
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute bottom-0 left-0 right-0 text-xs text-center py-0.5"
                style={{ backgroundColor: getRarityColor(item.rarity) + '80' }}
              >
                ${item.value}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
      
      <AnimatePresence>
        {!isSpinning && selectedIndex !== null && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-2xl font-bold text-white bg-black/50 px-4 py-2 rounded">
              +${items[selectedIndex].value}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
