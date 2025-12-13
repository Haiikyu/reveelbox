'use client'

import { ReactNode, useEffect, useState, useCallback } from 'react'
import { motion, Variants } from 'framer-motion'

interface HeroTransitionProps {
  heroContent: ReactNode
  children: ReactNode
}

// Durée totale de la transition
const DURATION = 0.9 // 900ms

// Easing premium
const EASE = [0.65, 0, 0.35, 1] // easeInOutCubic

// 🎬 Hero - Sort progressivement
const heroVariants: Variants = {
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: DURATION * 0.7, // 630ms
      ease: EASE
    }
  },
  hidden: {
    opacity: 0,
    scale: 0.95,
    filter: "blur(20px)",
    transition: {
      duration: DURATION * 0.7, // 630ms
      ease: EASE
    }
  }
}

// 🎬 Carousel - Entre progressivement avec overlap
const carouselVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 1.05,
    filter: "blur(20px)"
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: DURATION * 0.7, // 630ms
      ease: EASE,
      delay: DURATION * 0.3 // 270ms - démarre avant la fin du Hero
    }
  }
}

/**
 * HeroTransition - Transition fluide recréée à zéro
 *
 * PRINCIPE SIMPLE:
 * - Hero disparaît progressivement (blur + fade + scale)
 * - Carousel apparaît avec un léger overlap
 * - Pas de blur global qui "va et vient"
 * - Un seul mouvement fluide et continu
 * - Durée : 900ms
 */
export default function HeroTransition({ heroContent, children }: HeroTransitionProps) {
  const [section, setSection] = useState<1 | 2>(1)
  const [isAnimating, setIsAnimating] = useState(false)

  // 🎬 Transition 1 → 2
  const transitionToSection2 = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)

    // Switch immédiat pour lancer les animations
    setSection(2)

    // Débloquer après la transition
    setTimeout(() => {
      setIsAnimating(false)
    }, DURATION * 1000)
  }, [isAnimating])

  // 🎬 Transition 2 → 1
  const transitionToSection1 = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)

    setSection(1)

    setTimeout(() => {
      setIsAnimating(false)
    }, DURATION * 1000)
  }, [isAnimating])

  // 🔧 Wheel listener - Section 1
  useEffect(() => {
    if (section !== 1 || isAnimating) return

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        e.preventDefault()
        transitionToSection2()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [section, isAnimating, transitionToSection2])

  // 🔧 Wheel listener - Section 2
  useEffect(() => {
    if (section !== 2 || isAnimating) return

    const handleWheel = (e: WheelEvent) => {
      const contentEl = document.getElementById('carousel-content-container')
      if (contentEl && contentEl.scrollTop === 0 && e.deltaY < 0) {
        e.preventDefault()
        transitionToSection1()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [section, isAnimating, transitionToSection1])

  // 🔧 Bloquer le scroll global
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100vh'
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'

    return () => {
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* 🎬 Hero Section */}
      <motion.div
        className="absolute inset-0 z-50"
        variants={heroVariants}
        initial="visible"
        animate={section === 1 ? "visible" : "hidden"}
        style={{
          pointerEvents: section === 1 ? 'auto' : 'none'
        }}
      >
        {heroContent}
      </motion.div>

      {/* 🎬 Carousel Section */}
      <motion.div
        id="carousel-content-container"
        className="absolute inset-0 z-40 overflow-y-auto overflow-x-hidden"
        variants={carouselVariants}
        initial="hidden"
        animate={section === 2 ? "visible" : "hidden"}
        style={{
          pointerEvents: section === 2 ? 'auto' : 'none'
        }}
      >
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
