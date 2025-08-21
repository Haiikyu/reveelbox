'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface BattleHeaderProps {
  mode: '1v1' | '2v2' | '1v1v1'
  status: 'waiting' | 'in_progress' | 'completed'
  currentBox: number
  totalBoxes: number
  startedAt: string | null
}

export function BattleHeader({ mode, status, currentBox, totalBoxes, startedAt }: BattleHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  
  useEffect(() => {
    if (status !== 'in_progress' || !startedAt) return
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(startedAt).getTime()
      setElapsedTime(Math.floor(elapsed / 1000))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [status, startedAt])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const getModeDisplay = () => {
    switch (mode) {
      case '1v1': return '1 vs 1'
      case '2v2': return '2 vs 2'
      case '1v1v1': return 'Triple Threat'
    }
  }
  
  const getStatusColor = () => {
    switch (status) {
      case 'waiting': return '#FFC64C'
      case 'in_progress': return '#28FF6A'
      case 'completed': return '#9CA3AF'
    }
  }
  
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-700">
      <div className="flex items-center gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-2xl font-bold text-white"
        >
          {getModeDisplay()}
        </motion.div>
        
        <div 
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{ 
            backgroundColor: getStatusColor() + '20',
            color: getStatusColor()
          }}
        >
          {status.replace('_', ' ').toUpperCase()}
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-gray-400">
        {status === 'in_progress' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm">Box</span>
              <span className="text-xl font-bold text-white">
                {currentBox + 1} / {totalBoxes}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Time</span>
              <span className="text-xl font-mono text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}