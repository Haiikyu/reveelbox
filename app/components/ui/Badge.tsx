'use client'

import { motion } from 'framer-motion'

interface BadgeProps {
  children: React.ReactNode
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  status?: 'active' | 'inactive' | 'pending'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animate?: boolean
}

function Badge({
  children,
  rarity,
  variant,
  status,
  size = 'md',
  className = '',
  animate = false,
}: BadgeProps) {
  // Rarity styles
  const rarityStyles = {
    common: 'rarity-common',
    uncommon: 'rarity-uncommon',
    rare: 'rarity-rare',
    epic: 'rarity-epic',
    legendary: 'rarity-legendary',
    mythic: 'rarity-mythic',
  }

  // Variant styles - Use hybrid design system
  const variantStyles = {
    success: `
      hybrid-badge-success
    `,
    warning: `
      hybrid-badge-warning
    `,
    error: `
      hybrid-badge-error
    `,
    info: `
      hybrid-badge-info
    `,
    default: `
      hybrid-badge-neutral
    `,
  }

  // Status styles
  const statusStyles = {
    active: `
      bg-green-500/20 text-green-400
      border border-green-500/30
      relative overflow-hidden
    `,
    inactive: `
      bg-slate-500/20 text-slate-400
      border border-slate-500/30
    `,
    pending: `
      bg-amber-500/20 text-amber-400
      border border-amber-500/30
      animate-pulse
    `,
  }

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  // Determine which style to use
  let badgeStyle = ''
  if (rarity) {
    badgeStyle = `rarity-badge ${rarityStyles[rarity]}`
  } else if (status) {
    badgeStyle = statusStyles[status]
  } else if (variant) {
    badgeStyle = variantStyles[variant]
  } else {
    badgeStyle = variantStyles.default
  }

  const badgeContent = (
    <span
      className={`
        ${badgeStyle}
        ${sizeStyles[size]}
        font-black uppercase tracking-wider
        rounded-full
        inline-flex items-center justify-center
        transition-all duration-300
        ${className}
      `}
    >
      {/* Pulse effect for active status */}
      {status === 'active' && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-20" />
      )}

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </span>
  )

  if (animate) {
    return (
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        whileHover={{ scale: 1.1 }}
      >
        {badgeContent}
      </motion.span>
    )
  }

  return badgeContent
}

export { Badge }
export default Badge