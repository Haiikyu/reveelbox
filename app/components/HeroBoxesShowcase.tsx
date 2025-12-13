'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, PanInfo, animate } from 'framer-motion'
import Image from 'next/image'
import { LootBoxItem } from './CarouselItem'

interface HeroBoxesShowcaseProps {
  boxes: LootBoxItem[]
}

const HeroBoxesShowcase = ({ boxes }: HeroBoxesShowcaseProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const x = useMotionValue(0)
  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 }
  const xSpring = useSpring(x, springConfig)

  const CARD_WIDTH = 400
  const GAP = 100

  // Créer un tableau infini en dupliquant les boxes
  const infiniteBoxes = [...boxes, ...boxes, ...boxes]

  // Fonction pour aller à un index spécifique
  const scrollToIndex = (index: number) => {
    const wrappedIndex = ((index % boxes.length) + boxes.length) % boxes.length
    setCurrentIndex(wrappedIndex)

    const targetPosition = -(boxes.length + wrappedIndex) * (CARD_WIDTH + GAP)

    animate(x, targetPosition, {
      type: 'spring',
      ...springConfig
    })
  }

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollToIndex(currentIndex - 1)
      } else if (e.key === 'ArrowRight') {
        scrollToIndex(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  // Centrer au démarrage
  useEffect(() => {
    scrollToIndex(0)
  }, [])

  // Gérer le drag
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.x
    const offset = info.offset.x

    if (Math.abs(velocity) > 500 || Math.abs(offset) > 100) {
      if (velocity > 0 || offset > 0) {
        scrollToIndex(currentIndex - 1)
      } else {
        scrollToIndex(currentIndex + 1)
      }
    } else {
      scrollToIndex(currentIndex)
    }
  }

  // Obtenir les 3 boxes visibles (gauche, centre, droite)
  const getVisibleBoxes = () => {
    const centerIdx = boxes.length + currentIndex
    return [
      { box: infiniteBoxes[centerIdx - 1], position: 'left' as const },
      { box: infiniteBoxes[centerIdx], position: 'center' as const },
      { box: infiniteBoxes[centerIdx + 1], position: 'right' as const },
    ]
  }

  const visibleBoxes = getVisibleBoxes()

  return (
    <div className="w-full relative" style={{ perspective: '1500px' }}>
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <div className="relative py-12">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{ x: xSpring }}
          className="flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {/* Spacer gauche */}
          <div
            className="flex-shrink-0"
            style={{ width: `calc(50vw - ${CARD_WIDTH / 2}px)` }}
          />

          {infiniteBoxes.map((box, index) => {
            const actualIndex = index - boxes.length
            const offset = actualIndex - currentIndex
            const isCenter = offset === 0
            const isVisible = Math.abs(offset) <= 1

            if (!isVisible) return null

            return (
              <motion.div
                key={`${box.id}-${index}`}
                className="flex-shrink-0 relative"
                style={{
                  width: CARD_WIDTH,
                  marginRight: GAP,
                  transformStyle: 'preserve-3d',
                  zIndex: isCenter ? 20 : 10,
                }}
                animate={{
                  scale: isCenter ? 1.1 : 0.75,
                  opacity: isCenter ? 1 : 0.4,
                  rotateY: offset * 20,
                  z: isCenter ? 50 : -50,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {/* Glow effect subtil */}
                {isCenter && (
                  <motion.div
                    className="absolute -inset-6 rounded-full blur-2xl"
                    style={{
                      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
                    }}
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Box content */}
                <div className="flex flex-col items-center space-y-3 pointer-events-none">
                  {/* Image PNG */}
                  <div
                    className="relative w-72 h-72"
                    style={{
                      filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5))',
                    }}
                  >
                    {box.image && (
                      <Image
                        src={box.image}
                        alt={box.name}
                        fill
                        className="object-contain"
                        sizes="400px"
                        priority
                      />
                    )}
                  </div>

                  {/* Info */}
                  {isCenter && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center space-y-2"
                    >
                      <h3 className="text-white font-bold text-lg text-center">
                        {box.name}
                      </h3>

                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/80 to-orange-600/80 rounded-full px-4 py-2 border border-yellow-500/40">
                        <svg className="w-4 h-4 text-yellow-200" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white font-bold text-sm">
                          {box.price_virtual}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {/* Spacer droit */}
          <div
            className="flex-shrink-0"
            style={{ width: `calc(50vw - ${CARD_WIDTH / 2}px)` }}
          />
        </motion.div>
      </div>

      {/* Instructions */}
      <div className="text-center mt-2">
        <p className="text-gray-400 text-xs">
          Glissez horizontalement ou utilisez ← →
        </p>
      </div>
    </div>
  )
}

export default HeroBoxesShowcase
