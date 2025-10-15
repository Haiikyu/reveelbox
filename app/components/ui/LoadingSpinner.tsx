'use client'

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'indigo' | 'purple' | 'blue' | 'white'
  className?: string
  text?: string
}

export default function LoadingSpinner({
  size = 'md',
  color = 'indigo',
  className = '',
  text,
}: LoadingSpinnerProps) {
  // Size configurations
  const sizeStyles = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4',
  }

  // Color configurations
  const colorStyles = {
    indigo: {
      border: 'border-indigo-500/30 border-t-indigo-500',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      text: 'text-indigo-400',
    },
    purple: {
      border: 'border-purple-500/30 border-t-purple-500',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
      text: 'text-purple-400',
    },
    blue: {
      border: 'border-blue-500/30 border-t-blue-500',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
      text: 'text-blue-400',
    },
    white: {
      border: 'border-white/30 border-t-white',
      glow: 'shadow-[0_0_20px_rgba(255,255,255,0.3)]',
      text: 'text-white',
    },
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className={`
            ${sizeStyles[size]}
            ${colorStyles[color].border}
            ${colorStyles[color].glow}
            rounded-full
          `}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Inner pulsing glow */}
        <motion.div
          className={`
            absolute inset-0 rounded-full
            ${colorStyles[color].glow}
          `}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Center dot */}
        <motion.div
          className={`
            absolute inset-0 m-auto
            w-2 h-2 rounded-full
            ${colorStyles[color].border.split(' ')[1].replace('border-t-', 'bg-')}
          `}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Optional loading text */}
      {text && (
        <motion.p
          className={`text-sm font-bold ${colorStyles[color].text}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// Variants for specific use cases
export function LoadingOverlay({
  text = 'Chargement...',
}: {
  text?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/80 backdrop-blur-sm"
    >
      <div className="glass-card p-8">
        <LoadingSpinner size="lg" color="indigo" text={text} />
      </div>
    </motion.div>
  )
}

export function LoadingDots({
  color = 'indigo',
  className = '',
}: {
  color?: 'indigo' | 'purple' | 'blue' | 'white'
  className?: string
}) {
  const dotColors = {
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    white: 'bg-white',
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${dotColors[color]}`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
