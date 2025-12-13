// app/components/landing/MagneticCursor.tsx - Curseur Magnétique Premium

'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useMagneticMouse } from '@/app/hooks/useMagneticMouse'

export default function MagneticCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [cursorVariant, setCursorVariant] = useState<'default' | 'hover' | 'click'>('default')
  
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  const { magneticStrength } = useMagneticMouse()

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseDown = () => setCursorVariant('click')
    const handleMouseUp = () => setCursorVariant('default')

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setCursorVariant('hover')
      } else {
        setCursorVariant('default')
      }
    }

    window.addEventListener('mousemove', updateCursor)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', updateCursor)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [cursorX, cursorY, isVisible])

  if (!isVisible) return null

  const variants = {
    default: {
      width: 16,
      height: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      border: '2px solid rgba(102, 126, 234, 0.5)',
      mixBlendMode: 'difference' as const
    },
    hover: {
      width: 60,
      height: 60,
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      border: '2px solid rgba(102, 126, 234, 0.8)',
      mixBlendMode: 'normal' as const
    },
    click: {
      width: 12,
      height: 12,
      backgroundColor: 'rgba(255, 215, 0, 0.9)',
      border: '2px solid rgba(255, 215, 0, 1)',
      mixBlendMode: 'normal' as const
    }
  }

  return (
    <>
      {/* Curseur principal */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%'
        }}
        variants={variants}
        animate={cursorVariant}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28
        }}
      />

      {/* Trail effect */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full opacity-30"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          width: 8,
          height: 8,
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.6), transparent)'
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 20
        }}
      />

      {/* Outer glow ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997] rounded-full opacity-20"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          width: cursorVariant === 'hover' ? 80 : 32,
          height: cursorVariant === 'hover' ? 80 : 32,
          background:
            cursorVariant === 'hover'
              ? 'radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent)'
              : 'radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent)'
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25
        }}
      />

      {/* Style global pour cacher le curseur natif */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }
        
        a, button, input, textarea, select {
          cursor: none !important;
        }
      `}</style>
    </>
  )
}