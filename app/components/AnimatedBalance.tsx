// AnimatedBalance.tsx - Compteur de coins animé
'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface AnimatedBalanceProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedBalance({ value, duration = 1, className = '' }: AnimatedBalanceProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.floor(latest).toLocaleString())
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: [0.16, 1, 0.3, 1]
    })

    const unsubscribe = rounded.on('change', (v) => {
      setDisplayValue(v)
    })

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [value, duration, count, rounded])

  return (
    <motion.span
      className={`tabular-nums ${className}`}
      key={value}
      initial={{ scale: 1.2, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  )
}

export default AnimatedBalance
