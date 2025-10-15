'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, useState } from 'react'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 0,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    setIsVisible(false)
  }

  // Position configurations
  const positionStyles = {
    top: {
      tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      arrow: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white/10',
    },
    bottom: {
      tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
      arrow: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white/10',
    },
    left: {
      tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
      arrow: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white/10',
    },
    right: {
      tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
      arrow: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white/10',
    },
  }

  // Animation variants
  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0,
      x: position === 'left' ? 5 : position === 'right' ? -5 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 30,
      },
    },
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger element */}
      {children}

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`
              absolute ${positionStyles[position].tooltip}
              z-50 pointer-events-none
              ${className}
            `}
          >
            <div className="relative">
              {/* Tooltip content */}
              <div
                className="glass px-3 py-2 rounded-lg text-sm font-medium
                           text-white whitespace-nowrap
                           shadow-xl shadow-black/30"
              >
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r
                                from-indigo-500/20 to-violet-500/20
                                opacity-30 blur-md -z-10 rounded-lg" />

                {/* Content */}
                <div className="relative z-10">{content}</div>
              </div>

              {/* Arrow */}
              <div
                className={`
                  absolute ${positionStyles[position].arrow}
                  w-0 h-0 border-4
                `}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Variant with custom styling
export function TooltipRich({
  children,
  title,
  description,
  position = 'top',
  delay = 0,
  className = '',
}: {
  children: ReactNode
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}) {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <div className="font-black text-white mb-1">{title}</div>
          <div className="text-xs text-white/60">{description}</div>
        </div>
      }
      position={position}
      delay={delay}
      className={className}
    >
      {children}
    </Tooltip>
  )
}

// Info icon with tooltip
export function TooltipInfo({
  content,
  position = 'top',
}: {
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <Tooltip content={content} position={position}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="inline-flex items-center justify-center
                   w-5 h-5 rounded-full
                   bg-white/10 hover:bg-white/20
                   border border-white/20
                   text-white/60 hover:text-white
                   text-xs font-bold
                   transition-all duration-300"
      >
        ?
      </motion.button>
    </Tooltip>
  )
}
