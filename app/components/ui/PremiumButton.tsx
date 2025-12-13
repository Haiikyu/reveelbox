// PremiumButton.tsx - Bouton premium avec effets avancés

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'

interface PremiumButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  className?: string
}

interface Particle {
  id: number
  x: number
  y: number
}

const PremiumButton = ({
  children,
  onClick,
  variant = 'primary',
  className = ''
}: PremiumButtonProps) => {
  const [particles, setParticles] = useState<Particle[]>([])
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rippleIdRef = useRef(0)

  // Générer des particules au hover
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Ajouter des particules aléatoires autour de la souris
    if (Math.random() > 0.9) {
      const newParticle = {
        id: Date.now() + Math.random(),
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20
      }

      setParticles(prev => [...prev.slice(-10), newParticle])

      // Retirer la particule après l'animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id))
      }, 1000)
    }
  }

  // Effet ripple au clic
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = {
      id: rippleIdRef.current++,
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    // Retirer le ripple après l'animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 800)

    onClick?.()
  }

  const isPrimary = variant === 'primary'

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative overflow-hidden
        px-8 py-4 rounded-xl
        font-bold text-white
        shadow-2xl
        transition-all duration-300
        ${isPrimary
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
          : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20'
        }
        ${className}
      `}
    >
      {/* Shimmer effect - brillance qui traverse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ['-200%', '200%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 1,
          ease: 'linear'
        }}
        style={{ width: '50%' }}
      />

      {/* Glow effect animé */}
      <motion.div
        className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-50 ${
          isPrimary ? 'bg-blue-500' : 'bg-white'
        }`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Particules flottantes */}
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 1,
              scale: 0
            }}
            animate={{
              y: particle.y - 50,
              opacity: 0,
              scale: [0, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Ripple effect au clic */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className={`absolute rounded-full ${
              isPrimary ? 'bg-white/30' : 'bg-white/40'
            } pointer-events-none`}
            style={{
              left: ripple.x,
              top: ripple.y
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0 }}
            animate={{
              width: 400,
              height: 400,
              x: -200,
              y: -200,
              opacity: [0.5, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Contenu du bouton */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>

      {/* Border animé */}
      {!isPrimary && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            backgroundSize: '200% 100%'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '200% 0%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
    </motion.button>
  )
}

export default PremiumButton
