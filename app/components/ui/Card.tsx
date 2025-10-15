'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  variant?: 'glass' | 'solid' | 'gradient' | 'battle'
  hover?: 'lift' | 'glow' | 'scale' | 'none'
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
}

function Card({
  children,
  variant = 'glass',
  hover = 'lift',
  className = '',
  padding = 'md',
  onClick,
}: CardProps) {
  // Variant styles
  const variantStyles = {
    glass: `
      bg-white/5 backdrop-blur-2xl
      border border-white/10
      shadow-2xl shadow-black/20
    `,
    solid: `
      bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
      border border-white/5
      shadow-xl shadow-black/30
    `,
    gradient: `
      bg-gradient-to-br from-slate-900/90 via-indigo-900/20 to-slate-900/90
      border border-indigo-500/20
      shadow-[0_0_30px_rgba(99,102,241,0.15)]
    `,
    battle: `
      bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
      border-2 border-indigo-500/20
      shadow-[0_0_30px_rgba(99,102,241,0.2)]
      relative overflow-hidden
    `,
  }

  // Padding styles
  const paddingStyles = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }

  // Hover animation configs
  const hoverConfigs = {
    lift: {
      whileHover: { y: -8, scale: 1.02 },
      transition: { type: 'spring' as const, stiffness: 300 },
    },
    glow: {
      whileHover: {
        boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)'
      },
      transition: { duration: 0.3 },
    },
    scale: {
      whileHover: { scale: 1.05 },
      transition: { type: 'spring' as const, stiffness: 400 },
    },
    none: {},
  }

  return (
    <motion.div
      {...(hover !== 'none' ? hoverConfigs[hover] : {})}
      onClick={onClick}
      className={`
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        rounded-2xl
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Animated border for battle variant */}
      {variant === 'battle' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r
                     from-transparent via-indigo-500/20 to-transparent
                     pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

// Subcomponents for semantic usage
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-white/10 ${className}`}>
      {children}
    </div>
  )
}

export { Card }
export default Card