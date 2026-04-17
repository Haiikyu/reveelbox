// MultiOpenButtons.tsx - Boutons épurés, design minimal
'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'

interface MultiOpenButtonsProps {
  boxPrice: number
  userCoins: number
  onOpen: (count: number) => void
  onTryFree: () => void
  onToggleFastMode: () => void
  fastMode: boolean
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

const buttonGradientsLight: Record<number, string> = {
  1: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  2: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  5: 'linear-gradient(135deg, #d97706, #b45309)'
}

// Dégradé chaud → froid : Corail → Or → Ambre
const buttonGradientsDark: Record<number, string> = {
  1: 'linear-gradient(135deg, #D4976A, #BC7E52)',
  2: 'linear-gradient(135deg, #C9A87C, #B08E64)',
  5: 'linear-gradient(135deg, #D97706, #B45309)'
}

const buttonShadowsDark: Record<number, string> = {
  1: '0 4px 16px rgba(212,151,106,0.25)',
  2: '0 4px 16px rgba(201,168,124,0.25)',
  5: '0 4px 16px rgba(217,119,6,0.25)'
}

export function MultiOpenButtons({
  boxPrice,
  userCoins,
  onOpen,
  onTryFree,
  onToggleFastMode,
  fastMode,
  isLoading = false,
  disabled = false,
  className = ''
}: MultiOpenButtonsProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const buttonGradients = isDark ? buttonGradientsDark : buttonGradientsLight

  const canAfford = (count: number) => userCoins >= (boxPrice * count) && !disabled

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Open Buttons */}
      {[1, 2, 5].map((count) => {
        const totalPrice = boxPrice * count
        const canBuy = canAfford(count)
        const isActive = canBuy && !isLoading

        return (
          <motion.button
            key={count}
            onClick={() => onOpen(count)}
            disabled={!isActive}
            whileHover={isActive ? { scale: 1.04 } : {}}
            whileTap={isActive ? { scale: 0.97 } : {}}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
            style={{
              background: isActive
                ? buttonGradients[count]
                : isDark ? 'rgba(201,168,124,0.06)' : 'rgba(0, 0, 0, 0.04)',
              boxShadow: isActive && isDark ? buttonShadowsDark[count] : 'none',
              border: isActive ? 'none' : isDark ? '1px solid rgba(201,168,124,0.08)' : 'none',
              color: isActive ? 'white' : isDark ? '#6D675F' : 'rgba(0, 0, 0, 0.2)',
              cursor: isActive ? 'pointer' : 'not-allowed'
            }}
          >
            {isLoading && count === 1 ? (
              <motion.div
                className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <span>{count > 1 ? `x${count}` : 'Open'}</span>
                <span className="opacity-80 text-xs font-bold">
                  {totalPrice.toLocaleString()}
                </span>
              </>
            )}
          </motion.button>
        )
      })}

      {/* Divider */}
      <div className="w-px h-6 mx-1" style={{
        background: isDark ? 'rgba(201,168,124,0.10)' : 'rgba(0, 0, 0, 0.08)'
      }} />

      {/* Try Free — teinte or chaud */}
      <motion.button
        onClick={onTryFree}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.04 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
        className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
        style={{
          color: disabled || isLoading
            ? isDark ? '#5E5850' : 'rgba(0, 0, 0, 0.15)'
            : isDark ? '#C9A87C' : 'rgba(0, 0, 0, 0.5)',
          background: isDark ? 'rgba(201,168,124,0.08)' : 'rgba(0, 0, 0, 0.04)',
          border: isDark ? '1px solid rgba(201,168,124,0.12)' : 'none',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        Essai
      </motion.button>

      {/* Fast Mode — émeraude quand actif */}
      <motion.button
        onClick={onToggleFastMode}
        disabled={disabled || isLoading}
        whileHover={!disabled && !isLoading ? { scale: 1.1 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.9 } : {}}
        className="w-10 h-10 rounded-xl transition-all flex items-center justify-center"
        style={{
          background: fastMode && !disabled
            ? isDark ? 'linear-gradient(135deg, #5BA8A0, #4A908A)' : 'linear-gradient(135deg, #a855f7, #9333ea)'
            : isDark ? 'rgba(91,168,160,0.10)' : 'rgba(0, 0, 0, 0.04)',
          boxShadow: fastMode && !disabled && isDark ? '0 4px 16px rgba(91,168,160,0.25)' : 'none',
          border: fastMode && !disabled ? 'none' : isDark ? '1px solid rgba(91,168,160,0.14)' : 'none',
          color: fastMode && !disabled
            ? 'white'
            : isDark ? '#5BA8A0' : 'rgba(0, 0, 0, 0.3)',
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        <Zap size={15} />
      </motion.button>
    </div>
  )
}

export default MultiOpenButtons
