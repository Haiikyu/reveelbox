// CarouselItem.tsx - Item carousel avec design identique à /boxes

'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Coins, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Interface pour les boxes
export interface LootBoxItem {
  id: string
  name: string
  slug: string
  image: string
  price_virtual: number
  description?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  limited?: boolean
  popular?: boolean
  new?: boolean
}

interface CarouselItemProps {
  box: LootBoxItem
  isCenter: boolean
  offset: number
}

// Couleurs de glow par rareté
const getRarityGlow = (rarity: string) => {
  const glows = {
    common: '#10b981',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b'
  }
  return glows[rarity as keyof typeof glows] || glows.common
}

const CarouselItem = ({ box, isCenter, offset }: CarouselItemProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  const glowColor = getRarityGlow(box.rarity)

  // Calculer les effets basés sur la distance du centre avec des transitions fluides
  const absOffset = Math.abs(offset)
  const scale = isCenter ? 1.05 : Math.max(0.8, 1 - absOffset * 0.12) // Plus de différence entre centre et côtés
  const opacity = isCenter ? 1 : Math.max(0.3, 1 - absOffset * 0.25) // Plus d'opacité sur la différence
  const blur = isCenter ? 0 : Math.min(4, absOffset * 2) // Plus de blur
  const zIndex = isCenter ? 30 : Math.max(1, 20 - absOffset * 5)
  const brightness = isCenter ? 1.1 : Math.max(0.6, 1 - absOffset * 0.15) // Brightness pour mettre en valeur le centre

  // Parallax horizontal et vertical
  const parallaxX = offset * -15
  const parallaxY = Math.abs(offset) * 10 // Léger déplacement vertical

  const handleClick = () => {
    if (isCenter) {
      router.push(`/boxes/${box.id}`)
    }
  }

  // Calculer les badges
  const badges = []
  if (box.limited) badges.push({ text: 'LIMITED', color: 'from-purple-500 to-purple-600' })
  if (box.new) badges.push({ text: 'NEW', color: 'from-green-500 to-green-600' })
  if (box.popular) badges.push({ text: 'HOT', color: 'from-orange-500 to-red-500' })

  return (
    <motion.div
      className="w-[280px] md:w-[400px] cursor-pointer"
      style={{ zIndex }}
      initial={false}
      animate={{
        scale,
        opacity,
        filter: `blur(${blur}px) brightness(${brightness})`,
        x: parallaxX,
        y: parallaxY
      }}
      transition={{
        type: 'spring',
        stiffness: 250,
        damping: 28,
        mass: 0.6
      }}
      whileHover={isCenter ? {
        y: -25,
        scale: 1.1,
        transition: { duration: 0.3 }
      } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="relative group" style={{ perspective: '1000px' }}>
        {/* Badges flottants */}
        {badges.length > 0 && (
          <div className="absolute -top-2 -right-2 z-20 flex flex-col gap-1">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.text}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`bg-gradient-to-r ${badge.color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}
              >
                {badge.text}
              </motion.div>
            ))}
          </div>
        )}

        {/* Ombre dynamique */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black/10 dark:bg-black/20 rounded-full blur-lg"
          animate={{
            scale: isHovered && isCenter ? 1.5 : 1,
            opacity: isHovered && isCenter ? 0.3 : 0.1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Image de la box avec effet 3D et glow */}
        <div className="relative mb-4">
          {/* Glow effect derrière l'image (uniquement pour la carte centrale) */}
          {isCenter && (
            <motion.div
              className="absolute inset-0 -m-8 rounded-full blur-3xl opacity-0"
              animate={{
                opacity: isHovered ? 0.5 : 0.2
              }}
              style={{
                background: `radial-gradient(circle, ${glowColor}40, transparent 70%)`
              }}
            />
          )}

          <motion.img
            src={box.image}
            alt={box.name}
            className="relative w-full h-48 md:h-56 object-contain drop-shadow-2xl select-none pointer-events-none"
            draggable={false}
            style={{
              userSelect: 'none',
              WebkitUserDrag: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none'
            } as React.CSSProperties}
            animate={{
              filter: isHovered && isCenter
                ? `drop-shadow(0 30px 60px ${glowColor}60) brightness(1.15) saturate(1.2)`
                : isCenter
                ? `drop-shadow(0 20px 40px ${glowColor}30) brightness(1.05)`
                : 'drop-shadow(0 10px 25px rgba(0,0,0,0.15)) brightness(1)',
              rotateY: isHovered && isCenter ? 10 : 0,
              rotateX: isHovered && isCenter ? -5 : 0,
              rotateZ: isHovered && isCenter ? 2 : 0,
              scale: isHovered && isCenter ? 1.05 : 1
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src =
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJvw65lPC90ZXh0Pgo8L3N2Zz4K'
            }}
          />
        </div>

        {/* Informations - style transparent */}
        <motion.div
          className="text-center"
          animate={{
            y: isHovered && isCenter ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 truncate transition-colors">
            {box.name}
          </h3>

          {box.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 transition-colors">
              {box.description}
            </p>
          )}

          {/* Prix */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coins size={18} style={{ color: glowColor }} />
            <span className="text-xl font-black text-gray-900 dark:text-white transition-colors">
              {box.price_virtual.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">coins</span>
          </div>

          {/* Action au hover - visible uniquement au centre */}
          {isCenter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="text-center"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              >
                <ArrowRight size={14} />
                Cliquez pour ouvrir
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Indicateur de rareté */}
        <motion.div
          className="absolute top-2 left-2 w-3 h-3 rounded-full"
          style={{ backgroundColor: glowColor }}
          animate={{
            scale: isHovered && isCenter ? [1, 1.3, 1] : 1,
            opacity: isHovered && isCenter ? [0.7, 1, 0.7] : 0.7
          }}
          transition={{
            duration: isHovered && isCenter ? 1 : 0.3,
            repeat: isHovered && isCenter ? Infinity : 0
          }}
        />
      </div>
    </motion.div>
  )
}

export default CarouselItem
