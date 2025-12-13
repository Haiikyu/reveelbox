'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, PanInfo, animate } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CarouselItem, { LootBoxItem } from './CarouselItem'
import { boxesContainerVariants } from './animations'

interface BoxesCarouselProps {
  boxes: LootBoxItem[]
}

const BoxesCarousel = ({ boxes }: BoxesCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const x = useMotionValue(0)
  // Spring plus rapide et réactif
  const springConfig = { stiffness: 400, damping: 35, mass: 0.8 }
  const xSpring = useSpring(x, springConfig)

  // Largeur d'une carte + gap (responsive)
  const CARD_WIDTH = typeof window !== 'undefined' && window.innerWidth < 768 ? 280 : 400
  const GAP = typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 40

  // Naviguer vers un index spécifique - VERSION OPTIMISÉE
  const scrollToIndex = (index: number, fast = false) => {
    let newIndex = index

    // Boucle infinie
    if (index < 0) {
      newIndex = boxes.length - 1
    } else if (index >= boxes.length) {
      newIndex = 0
    }

    setCurrentIndex(newIndex)

    // Calculer l'offset pour centrer la carte
    const targetPosition = -(newIndex * (CARD_WIDTH + GAP))

    // Utiliser animate de Framer Motion (plus performant)
    animate(x, targetPosition, {
      type: "spring",
      stiffness: fast ? 500 : 400,
      damping: fast ? 40 : 35,
      mass: 0.8,
      velocity: 0
    })
  }

  // Navigation précédent/suivant
  const goToPrevious = () => {
    scrollToIndex(currentIndex - 1, true)
  }

  const goToNext = () => {
    scrollToIndex(currentIndex + 1, true)
  }

  // Gérer le début du drag
  const handleDragStart = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(true)
    setHasMoved(false)
    setDragStartX(info.point.x)
  }

  // Gérer le mouvement du drag
  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = Math.abs(info.point.x - dragStartX)

    // Si mouvement > 3px, c'est un vrai drag
    if (dragDistance > 3) {
      setHasMoved(true)
    }
  }

  // Gérer le drag end avec snap au centre - VERSION OPTIMISÉE
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = Math.abs(info.point.x - dragStartX)

    // Si le drag est < 3px, considérer comme un clic (pas un drag)
    if (dragDistance < 3) {
      setIsDragging(false)
      setHasMoved(false)
      return
    }

    const currentX = x.get()
    const velocity = info.velocity.x

    // Calculer l'index le plus proche en tenant compte de la vélocité
    let targetIndex = Math.round(-currentX / (CARD_WIDTH + GAP))

    // Ajuster selon la direction et la vitesse du drag
    if (Math.abs(velocity) > 500) {
      if (velocity > 0) {
        targetIndex = Math.floor(-currentX / (CARD_WIDTH + GAP))
      } else {
        targetIndex = Math.ceil(-currentX / (CARD_WIDTH + GAP))
      }
    }

    // Limiter l'index dans les bornes
    targetIndex = Math.max(0, Math.min(boxes.length - 1, targetIndex))

    // Animer vers la position de snap
    setCurrentIndex(targetIndex)
    const targetPosition = -(targetIndex * (CARD_WIDTH + GAP))

    animate(x, targetPosition, {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
      velocity: velocity / 10 // Utiliser la vélocité du drag
    })

    // Débloquer le drag après un court délai
    setTimeout(() => {
      setIsDragging(false)
      setHasMoved(false)
    }, 100)
  }

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, boxes.length])

  // Centrer au démarrage
  useEffect(() => {
    setTimeout(() => {
      scrollToIndex(0)
    }, 100)
  }, [])

  return (
    <motion.div
      variants={boxesContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className="relative w-full min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Titre et description */}
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4"
        >
          Nos Boxes Premium
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
        >
          Découvrez notre sélection de boxes contenant des objets réels exceptionnels
        </motion.p>
      </div>

      {/* Carousel container */}
      <div className="relative" ref={constraintsRef}>
        {/* Gradient overlays gauche/droite - Masquage progressif */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        {/* Boutons de navigation améliorés */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={goToPrevious}
          className="group absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl flex items-center justify-center transition-all"
          whileHover={{
            scale: 1.1,
            borderColor: 'rgba(59, 130, 246, 0.5)'
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-md"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 text-gray-900 dark:text-white relative z-10" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={goToNext}
          className="group absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 shadow-xl hover:shadow-2xl flex items-center justify-center transition-all"
          whileHover={{
            scale: 1.1,
            borderColor: 'rgba(59, 130, 246, 0.5)'
          }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur-md"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <ChevronRight className="w-7 h-7 md:w-8 md:h-8 text-gray-900 dark:text-white relative z-10" />
        </motion.button>

        {/* Track du carousel avec Framer Motion drag */}
        <div className="overflow-visible px-6">
          <motion.div
            ref={trackRef}
            drag="x"
            dragConstraints={{
              left: -(boxes.length - 1) * (CARD_WIDTH + GAP),
              right: 0
            }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="flex items-center select-none cursor-grab active:cursor-grabbing"
          >
            {/* Spacer gauche pour centrer la première carte */}
            <div
              className="flex-shrink-0"
              style={{
                width: `calc(50vw - ${CARD_WIDTH / 2}px - 24px)`
              }}
            />

            {/* Cartes avec gap uniforme */}
            {boxes.map((box, index) => {
              const offset = index - currentIndex
              const isCenter = index === currentIndex

              return (
                <div
                  key={box.id}
                  className="flex-shrink-0 select-none"
                  style={{
                    marginRight: index === boxes.length - 1 ? 0 : `${GAP}px`,
                    userSelect: 'none',
                    WebkitUserDrag: 'none'
                  } as React.CSSProperties}
                  onPointerDown={(e) => {
                    // Marquer le début du potentiel clic
                    e.currentTarget.dataset.clickStartTime = Date.now().toString()
                    e.currentTarget.dataset.clickStartX = e.clientX.toString()
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation()

                    // Calculer le temps écoulé depuis le pointerDown
                    const clickStartTime = parseInt(e.currentTarget.dataset.clickStartTime || '0')
                    const clickStartX = parseInt(e.currentTarget.dataset.clickStartX || '0')
                    const clickDuration = Date.now() - clickStartTime
                    const moveDistance = Math.abs(e.clientX - clickStartX)

                    // Conditions pour un vrai clic :
                    // 1. Durée < 200ms
                    // 2. Mouvement < 5px
                    // 3. Pas de drag en cours
                    // 4. Le carrousel n'a pas bougé
                    const isValidClick = clickDuration < 200 && moveDistance < 5 && !isDragging && !hasMoved

                    if (isValidClick) {
                      if (isCenter) {
                        // SEULEMENT si la box est déjà centrée, naviguer vers sa page
                        router.push(`/boxes/${box.id}`)
                      } else {
                        // Sinon, centrer la box rapidement
                        scrollToIndex(index, true)
                      }
                    }
                  }}
                >
                  <CarouselItem
                    box={box}
                    isCenter={isCenter}
                    offset={offset}
                  />
                </div>
              )
            })}

            {/* Spacer droit pour centrer la dernière carte */}
            <div
              className="flex-shrink-0"
              style={{
                width: `calc(50vw - ${CARD_WIDTH / 2}px - 24px)`
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Indicateurs de pagination améliorés */}
      <div className="flex items-center justify-center gap-3 mt-12">
        {boxes.map((box, index) => {
          const isActive = index === currentIndex
          const distance = Math.abs(index - currentIndex)

          return (
            <button
              key={`pagination-${box.id}-${index}`}
              onClick={() => scrollToIndex(index, true)}
              className="group relative"
              aria-label={`Aller à la box ${index + 1}`}
            >
              {/* Glow effect pour l'indicateur actif */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-blue-500 rounded-full blur-md"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}

              {/* Indicateur principal */}
              <motion.div
                className="relative rounded-full transition-all"
                animate={{
                  width: isActive ? 40 : 10,
                  height: 10,
                  backgroundColor: isActive
                    ? 'rgb(59, 130, 246)'
                    : distance <= 1
                    ? 'rgb(156, 163, 175)'
                    : 'rgb(209, 213, 219)',
                  scale: isActive ? 1.1 : 1
                }}
                whileHover={{
                  scale: 1.2,
                  backgroundColor: 'rgb(59, 130, 246)'
                }}
                transition={{
                  duration: 0.2,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
              />

              {/* Tooltip amélioré au hover */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                whileHover={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap"
              >
                {boxes[index].name}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-blue-600 rotate-45" />
              </motion.div>
            </button>
          )
        })}
      </div>

      {/* Instructions de navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400"
      >
        Glissez horizontalement ou utilisez les flèches ← →
      </motion.div>
    </motion.div>
  )
}

export default BoxesCarousel
