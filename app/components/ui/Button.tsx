'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  shimmer?: boolean
  fullWidth?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  shimmer = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  // Variant styles - Use hybrid design system
  const variantStyles = {
    primary: `
      text-white font-bold
      shadow-lg
      hover:shadow-xl
      border border-white/10
      hybrid-btn-primary-gradient
    `,
    secondary: `
      text-white font-bold
      shadow-lg
      hover:shadow-xl
      border border-white/10
      hybrid-btn-secondary-gradient
    `,
    ghost: `
      bg-white/5 hover:bg-white/10
      backdrop-blur-xl border border-white/20
      text-white font-bold
      hover:border-white/40
    `,
    outline: `
      bg-transparent hover:bg-gray-50
      border-2 border-gray-300
      text-gray-700 font-bold
      hover:border-gray-400
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600
      hover:from-red-600 hover:to-red-700
      text-white font-bold
      shadow-lg shadow-red-500/30
      hover:shadow-xl hover:shadow-red-500/50
      border border-red-400/30
    `,
    success: `
      text-white font-bold
      shadow-lg
      hover:shadow-xl
      border border-white/10
      hybrid-btn-success-gradient
    `,
  }

  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  }

  const isDisabled = disabled || loading

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        rounded-xl
        inline-flex items-center justify-center gap-2
        transition-all duration-300
        relative overflow-hidden
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Shimmer effect */}
      {shimmer && !loading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-200%', '200%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Icon left */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="relative z-10">{icon}</span>
      )}

      {/* Content */}
      <span className="relative z-10">{children}</span>

      {/* Icon right */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="relative z-10">{icon}</span>
      )}
    </motion.button>
  )
}

export { Button }
export default Button