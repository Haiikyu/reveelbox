// BoxesPreview.tsx - Preview des boxes en bas du hero avec design identique à /boxes

'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Coins, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LootBoxItem } from './CarouselItem'
import { boxHoverVariants } from './animations'

interface BoxesPreviewProps {
  boxes: LootBoxItem[]
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

const BoxesPreview = ({ boxes }: BoxesPreviewProps) => {
  const router = useRouter()

  // Prendre uniquement les 4 premières boxes
  const previewBoxes = boxes.slice(0, 4)

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        delay: 1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="absolute bottom-0 left-0 right-0 z-20 pb-0"
    >
      {/* Glow effect en arrière-plan */}
      <div className="absolute inset-0 -top-32 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {previewBoxes.map((box, index) => (
            <BoxPreviewCard
              key={box.id}
              box={box}
              index={index}
              onClick={() => router.push(`/boxes/${box.id}`)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Composant individuel de preview card - style transparent comme /boxes
interface BoxPreviewCardProps {
  box: LootBoxItem
  index: number
  onClick: () => void
}

const BoxPreviewCard = ({ box, index, onClick }: BoxPreviewCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const glowColor = getRarityGlow(box.rarity)

  // Calculer les badges
  const badges = []
  if (box.limited) badges.push({ text: 'LIMITED', color: 'from-purple-500 to-purple-600' })
  if (box.new) badges.push({ text: 'NEW', color: 'from-green-500 to-green-600' })
  if (box.popular) badges.push({ text: 'HOT', color: 'from-orange-500 to-red-500' })

  return (
    <motion.div
      initial={{ y: '80%', opacity: 0, scale: 0.8 }}
      animate={{ y: '50%', opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: 1.2 + index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <motion.div
        variants={boxHoverVariants}
        className="relative"
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20
        }}
        style={{ perspective: '1000px' }}
      >
        {/* Badges flottants */}
        {badges.length > 0 && (
          <div className="absolute -top-2 -right-2 z-20 flex flex-col gap-1">
            {badges.map((badge, badgeIndex) => (
              <motion.div
                key={badge.text}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 + badgeIndex * 0.05 }}
                className={`bg-gradient-to-r ${badge.color} text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-bold shadow-lg`}
              >
                {badge.text}
              </motion.div>
            ))}
          </div>
        )}

        {/* Ombre dynamique */}
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/10 dark:bg-black/30 rounded-full blur-lg"
          animate={{
            scale: isHovered ? 1.3 : 1,
            opacity: isHovered ? 0.4 : 0.2
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Image de la box */}
        <div className="relative mb-3 md:mb-4">
          <motion.img
            src={box.image}
            alt={box.name}
            className="w-full h-28 md:h-40 object-contain drop-shadow-2xl"
            animate={{
              filter: isHovered
                ? `drop-shadow(0 20px 40px ${glowColor}60) brightness(1.1)`
                : 'drop-shadow(0 10px 20px rgba(0,0,0,0.2)) brightness(1)',
              scale: isHovered ? 1.05 : 1,
              rotateY: isHovered ? 8 : 0,
              rotateX: isHovered ? 5 : 0
            }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src =
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJvw65lPC90ZXh0Pgo8L3N2Zz4K'
            }}
          />
        </div>

        {/* Informations minimalistes - juste le prix */}
        <motion.div
          className="text-center"
          animate={{
            y: isHovered ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Prix */}
          <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-2">
            <Coins size={14} className="md:w-4 md:h-4" style={{ color: glowColor }} />
            <span className="text-base md:text-xl font-black text-gray-900 dark:text-white transition-colors">
              {box.price_virtual.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">coins</span>
          </div>
        </motion.div>

        {/* Indicateur de rareté */}
        <motion.div
          className="absolute top-2 left-2 w-2 h-2 md:w-3 md:h-3 rounded-full"
          style={{ backgroundColor: glowColor }}
          animate={{
            scale: isHovered ? [1, 1.3, 1] : 1,
            opacity: isHovered ? [0.7, 1, 0.7] : 0.7
          }}
          transition={{
            duration: isHovered ? 1 : 0.3,
            repeat: isHovered ? Infinity : 0
          }}
        />
      </motion.div>
    </motion.div>
  )
}

export default BoxesPreview
