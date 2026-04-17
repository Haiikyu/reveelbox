// FavoriteButton.tsx - Bouton favori minimal
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { useTheme } from '@/app/components/ThemeProvider'

interface FavoriteButtonProps {
  boxId: string
  className?: string
}

export function FavoriteButton({ boxId, className = '' }: FavoriteButtonProps) {
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (user) {
      checkFavorite()
    }
  }, [user, boxId])

  const checkFavorite = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('favorite_boxes')
        .select('id')
        .eq('user_id', user.id)
        .eq('box_id', boxId)
        .single()

      if (data && !error) {
        setIsFavorite(true)
      }
    } catch {
      // silently fail
    }
  }

  const toggleFavorite = async () => {
    if (!user || loading) return
    setLoading(true)
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorite_boxes')
          .delete()
          .eq('user_id', user.id)
          .eq('box_id', boxId)
        if (!error) setIsFavorite(false)
      } else {
        const { error } = await supabase
          .from('favorite_boxes')
          .insert({ user_id: user.id, box_id: boxId })
        if (!error) setIsFavorite(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <motion.button
      onClick={toggleFavorite}
      disabled={loading}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${className}`}
      style={{
        background: isFavorite
          ? 'rgba(239, 68, 68, 0.15)'
          : isDark ? 'rgba(200,130,150,0.10)' : 'rgba(0, 0, 0, 0.04)',
        border: isFavorite ? 'none' : isDark ? '1px solid rgba(200,130,150,0.16)' : 'none',
        color: isFavorite
          ? '#ef4444'
          : isDark ? '#C88396' : 'rgba(0, 0, 0, 0.3)'
      }}
    >
      <Heart
        size={17}
        fill={isFavorite ? 'currentColor' : 'none'}
        strokeWidth={isFavorite ? 0 : 2}
      />
    </motion.button>
  )
}

export default FavoriteButton
