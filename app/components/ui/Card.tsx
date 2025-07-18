'use client'

import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  hover?: boolean
  shadow?: 'soft' | 'soft-lg' | 'primary'
  border?: boolean
  className?: string
}

export function Card({ 
  children, 
  hover = false, 
  shadow = 'soft', 
  border = true, 
  className = '' 
}: CardProps) {
  const shadowClasses = {
    'soft': 'shadow-soft',
    'soft-lg': 'shadow-soft-lg',
    'primary': 'shadow-primary'
  }

  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className={`
        bg-white rounded-xl ${shadowClasses[shadow]} 
        ${border ? 'border border-gray-200' : ''} 
        ${hover ? 'hover:shadow-soft-lg transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}