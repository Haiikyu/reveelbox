// ReplayButton.tsx - Bouton replay minimal
'use client'

import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'

interface ReplayButtonProps {
  onClick: () => void
  disabled?: boolean
  hasLastOpening?: boolean
  className?: string
}

export function ReplayButton({
  onClick,
  disabled = false,
  hasLastOpening = false,
  className = ''
}: ReplayButtonProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (!hasLastOpening) return null

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.9 } : {}}
      className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${className}`}
      style={{
        background: isDark ? 'rgba(100,150,210,0.10)' : 'rgba(0, 0, 0, 0.04)',
        border: isDark ? '1px solid rgba(100,150,210,0.16)' : 'none',
        color: disabled
          ? isDark ? '#4A5568' : 'rgba(0, 0, 0, 0.1)'
          : isDark ? '#6496D2' : '#3b82f6',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      <RotateCcw size={15} />
    </motion.button>
  )
}

export default ReplayButton
