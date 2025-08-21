'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'

interface AddBotButtonProps {
  battleId: string
  onBotAdded?: () => void
}

export function AddBotButton({ battleId, onBotAdded }: AddBotButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const addBotMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/battles/${battleId}/add-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to add bot')
      return res.json()
    },
    onSuccess: () => {
      onBotAdded?.()
    }
  })
  
  const handleAddBot = async () => {
    setIsLoading(true)
    try {
      await addBotMutation.mutateAsync()
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAddBot}
      disabled={isLoading}
      className="px-4 py-2 rounded-lg font-semibold text-white transition-colors disabled:opacity-50"
      style={{ 
        backgroundColor: '#4C5BF9',
        cursor: isLoading ? 'not-allowed' : 'pointer'
      }}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
          Adding Bot...
        </span>
      ) : (
        '+ Add Bot'
      )}
    </motion.button>
  )
}