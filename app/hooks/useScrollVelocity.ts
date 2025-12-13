// app/hooks/useScrollVelocity.ts - Hook pour détecter la vitesse de scroll

'use client'

import { useEffect, useState, useRef } from 'react'
import { useScroll, useVelocity, useTransform, MotionValue } from 'framer-motion'

export function useScrollVelocity(): MotionValue<number> {
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  
  return scrollVelocity
}

export function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY.current) {
        setDirection('down')
      } else if (currentScrollY < lastScrollY.current) {
        setDirection('up')
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return direction
}

export function useScrollSpeed() {
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>('slow')
  const scrollVelocity = useScrollVelocity()

  useEffect(() => {
    const unsubscribe = scrollVelocity.on('change', (latest) => {
      const absVelocity = Math.abs(latest)
      
      if (absVelocity < 100) {
        setSpeed('slow')
      } else if (absVelocity < 500) {
        setSpeed('medium')
      } else {
        setSpeed('fast')
      }
    })

    return () => unsubscribe()
  }, [scrollVelocity])

  return speed
}