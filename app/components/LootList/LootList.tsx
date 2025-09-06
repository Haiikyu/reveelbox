// ========================================
// app/components/LootList/LootList.tsx - Import corrigé
// ========================================

'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Coins, Percent } from 'lucide-react'
// ✅ IMPORT CORRIGÉ - Utilise le type du service
import type { FreedropItem } from '@/lib/services/freedrop'

interface LootListProps {
  items: FreedropItem[]
  className?: string
}

export function LootList({ items, className = '' }: LootListProps) {
  // Fonction pour obtenir la couleur de rareté - memoized
  const getRarityGlow = useCallback((rarity: string) => {
    const glows = {
      common: '#10b981',
      uncommon: '#3b82f6',
      rare: '#8b5cf6', 
      epic: '#d946ef',
      legendary: '#f59e0b'
    }
    return glows[rarity.toLowerCase() as keyof typeof glows] || glows.common
  }, [])

  // Trier les items par valeur décroissante - memoized
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.market_value - a.market_value)
  }, [items])

  return (
    <div className={className}>
      {/* Grid des objets - identique au style /boxes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          transition: {
            delayChildren: 0.1,
            staggerChildren: 0.05
          }
        }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8"
      >
        {sortedItems.map((item, index) => (
          <LootItemCard
            key={item.id}
            item={item}
            index={index}
            getRarityGlow={getRarityGlow}
          />
        ))}
      </motion.div>
    </div>
  )
}

// Composant LootItemCard - hover uniforme pour tous
interface LootItemCardProps {
  item: FreedropItem
  index: number
  getRarityGlow: (rarity: string) => string
}

function LootItemCard({ item, index, getRarityGlow }: LootItemCardProps) {
  const glowColor = getRarityGlow(item.rarity)
  const [isHovered, setIsHovered] = useState(false)

  // Callbacks optimisés pour éviter les re-renders
  const handleHoverStart = useCallback(() => setIsHovered(true), [])
  const handleHoverEnd = useCallback(() => setIsHovered(false), [])

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 50, 
        rotateY: -10 
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotateY: 0,
      }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: Math.min(index * 0.05, 0.5)
      }}
      whileHover={{ 
        y: -20,
        rotateY: 15,
        rotateX: -5,
        scale: 1.05,
        transition: { 
          duration: 0.2,
          ease: "easeOut"
        }
      }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className="group cursor-pointer"
      style={{ 
        perspective: '1000px',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <motion.div className="relative">
        
        {/* Badge de rareté */}
        <div className="absolute -top-3 -right-3 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 0.95 }}
            transition={{ 
              delay: Math.min(0.3 + index * 0.02, 0.8),
              duration: 0.3 
            }}
            className="px-2 py-1 rounded-full text-xs font-bold shadow-lg text-white capitalize"
            style={{ backgroundColor: glowColor }}
          >
            {item.rarity}
          </motion.div>
        </div>

        {/* Ombre dynamique */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black/10 dark:bg-black/20 rounded-full blur-lg transition-colors"
          animate={{
            scale: isHovered ? 1.5 : 1,
            opacity: isHovered ? 0.3 : 0.1
          }}
          transition={{ 
            duration: 0.2,
            ease: "easeOut" 
          }}
        />

        {/* Container principal */}
        <div className="">
          
          {/* Image de l'objet */}
          <div className="relative mb-4">
            <motion.img
              src={item.image_url || 'https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=Item'}
              alt={item.name}
              className="w-full h-32 object-contain drop-shadow-lg"
              animate={{
                filter: isHovered 
                  ? `drop-shadow(0 25px 50px ${glowColor}40) brightness(1.1)`
                  : 'drop-shadow(0 10px 25px rgba(0,0,0,0.15)) brightness(1)'
              }}
              transition={{ 
                duration: 0.2,
                ease: "easeOut" 
              }}
              loading="lazy"
              style={{
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=Item'
              }}
            />
          </div>

          {/* Informations */}
          <motion.div
            className="text-center"
            animate={{
              y: isHovered ? -5 : 0
            }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut" 
            }}
          >
            {/* Nom de l'objet */}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 truncate transition-colors leading-tight">
              {item.name}
            </h3>

            {/* Valeur et probabilité */}
            <div className="space-y-1 mb-2">
              {/* Valeur en coins avec couleur de rareté */}
              <div className="flex items-center justify-center gap-1">
                <Coins 
                  size={16} 
                  style={{ color: glowColor }} 
                />
                <span 
                  className="text-lg font-black transition-colors"
                  style={{ color: "white" }}
                >
                  {item.market_value.toLocaleString()}
                </span>
              </div>

              {/* Pourcentage de chance avec couleur de rareté */}
              <div className="flex items-center justify-center gap-2">
                <Percent 
                  size={14} 
                  style={{ color: glowColor, opacity: 0}} 
                />
                <span 
                  className="text-sm font-bold transition-colors"
                  style={{ color: glowColor }}
                >
                  {item.probability.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                  })}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Indicateur de rareté animé */}
          <motion.div
            className="absolute top-2 left-2 w-3 h-3 rounded-full"
            style={{ backgroundColor: glowColor }}
            animate={{
              scale: isHovered ? [1, 1.3, 1] : 1,
              opacity: isHovered ? [0.7, 1, 0.7] : 0.7
            }}
            transition={{ 
              duration: isHovered ? 0.8 : 0.2,
              repeat: isHovered ? Infinity : 0,
              ease: "easeInOut"
            }}
          />

          {/* Effet de particules pour les objets rares */}
          {(item.rarity === 'legendary' || item.rarity === 'epic') && isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60) * (Math.PI / 180)
                const distance = 20
                
                return (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{ 
                      backgroundColor: glowColor,
                      left: '50%',
                      top: '50%'
                    }}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0, 
                      scale: 0 
                    }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: "easeOut"
                    }}
                  />
                )
              })}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default LootList