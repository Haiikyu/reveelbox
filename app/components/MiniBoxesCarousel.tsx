'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, PanInfo, animate } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LootBoxItem } from './CarouselItem'

interface MiniBoxesCarouselProps {
  boxes: LootBoxItem[]
}

const MiniBoxesCarousel = ({ boxes }: MiniBoxesCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const x = useMotionValue(0)
  const springConfig = { stiffness: 400, damping: 35, mass: 0.8 }
  const xSpring = useSpring(x, springConfig)

  // Largeur d'une mini carte + gap
  const CARD_WIDTH = 180
  const GAP = 20

  // Naviguer vers un index spécifique
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

    // Utiliser animate de Framer Motion
    animate(x, targetPosition, {
      type: "spring",
      stiffness: fast ? 500 : 400,
      damping: fast ? 40 : 35,
      mass: 0.8,
      velocity: 0
    })
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
    if (dragDistance > 3) {
      setHasMoved(true)
    }
  }

  // Gérer le drag end avec snap au centre
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = Math.abs(info.point.x - dragStartX)

    if (dragDistance < 3) {
      setIsDragging(false)
      setHasMoved(false)
      return
    }

    const currentX = x.get()
    const velocity = info.velocity.x

    let targetIndex = Math.round(-currentX / (CARD_WIDTH + GAP))

    if (Math.abs(velocity) > 500) {
      if (velocity > 0) {
        targetIndex = Math.floor(-currentX / (CARD_WIDTH + GAP))
      } else {
        targetIndex = Math.ceil(-currentX / (CARD_WIDTH + GAP))
      }
    }

    targetIndex = Math.max(0, Math.min(boxes.length - 1, targetIndex))

    setCurrentIndex(targetIndex)
    const targetPosition = -(targetIndex * (CARD_WIDTH + GAP))

    animate(x, targetPosition, {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
      velocity: velocity / 10
    })

    setTimeout(() => {
      setIsDragging(false)
      setHasMoved(false)
    }, 100)
  }

  // Centrer au démarrage
  useEffect(() => {
    setTimeout(() => {
      scrollToIndex(0)
    }, 100)
  }, [])

  return (
    <div className="relative w-full">
      {/* Gradient overlays gauche/droite - Plus subtils */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black via-black/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black via-black/60 to-transparent z-10 pointer-events-none" />

      {/* Track du carousel */}
      <div className="overflow-visible px-4">
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
              width: `calc(50vw - ${CARD_WIDTH / 2}px - 16px)`
            }}
          />

          {/* Mini cartes */}
          {boxes.map((box, index) => {
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
                  e.currentTarget.dataset.clickStartTime = Date.now().toString()
                  e.currentTarget.dataset.clickStartX = e.clientX.toString()
                }}
                onPointerUp={(e) => {
                  e.stopPropagation()

                  const clickStartTime = parseInt(e.currentTarget.dataset.clickStartTime || '0')
                  const clickStartX = parseInt(e.currentTarget.dataset.clickStartX || '0')
                  const clickDuration = Date.now() - clickStartTime
                  const moveDistance = Math.abs(e.clientX - clickStartX)

                  const isValidClick = clickDuration < 200 && moveDistance < 5 && !isDragging && !hasMoved

                  if (isValidClick) {
                    if (isCenter) {
                      router.push(`/boxes/${box.id}`)
                    } else {
                      scrollToIndex(index, true)
                    }
                  }
                }}
              >
                <motion.div
                  className="relative group cursor-pointer"
                  animate={{
                    scale: isCenter ? 1.05 : 0.95,
                    opacity: isCenter ? 1 : 0.7,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                  }}
                >
                  <div className="relative w-44 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-white/10 shadow-xl">
                    {/* Image de la box */}
                    <div className="relative w-full h-44 bg-slate-800/50">
                      {box.image && (
                        <Image
                          src={box.image}
                          alt={box.name}
                          fill
                          className="object-contain p-4"
                          sizes="180px"
                        />
                      )}

                      {/* Badge rarity top right */}
                      <div className="absolute top-2 right-2">
                        <div className={`w-2 h-2 rounded-full ${
                          box.rarity === 'legendary' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' :
                          box.rarity === 'epic' ? 'bg-purple-500 shadow-lg shadow-purple-500/50' :
                          box.rarity === 'rare' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' :
                          'bg-gray-400'
                        }`} />
                      </div>

                      {/* Glow effect on center */}
                      {isCenter && (
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-pink-500/10 to-transparent pointer-events-none" />
                      )}
                    </div>

                    {/* Nom et Prix */}
                    <div className="p-3 space-y-2">
                      {/* Nom de la box */}
                      <h3 className="text-white font-bold text-sm text-center truncate">
                        {box.name}
                      </h3>

                      {/* Prix */}
                      <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg px-3 py-1.5 border border-yellow-500/30">
                        <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-400 font-bold text-xs">
                          {box.price_virtual}
                        </span>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 pointer-events-none" />
                  </div>
                </motion.div>
              </div>
            )
          })}

          {/* Spacer droit pour centrer la dernière carte */}
          <div
            className="flex-shrink-0"
            style={{
              width: `calc(50vw - ${CARD_WIDTH / 2}px - 16px)`
            }}
          />
        </motion.div>
      </div>

      {/* Indicateurs de pagination élégants */}
      <div className="flex items-center justify-center gap-2 mt-6">
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
                  className="absolute inset-0 bg-blue-500/50 rounded-full blur-sm"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 0.6, 0.4]
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
                className="relative rounded-full backdrop-blur-sm"
                animate={{
                  width: isActive ? 32 : 8,
                  height: 8,
                  backgroundColor: isActive
                    ? 'rgba(59, 130, 246, 0.9)'
                    : distance <= 1
                    ? 'rgba(156, 163, 175, 0.5)'
                    : 'rgba(107, 114, 128, 0.3)',
                }}
                whileHover={{
                  scale: 1.2,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)'
                }}
                transition={{
                  duration: 0.2,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MiniBoxesCarousel
