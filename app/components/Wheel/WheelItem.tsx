// components/Wheel/WheelItem.tsx
'use client'

import { motion } from 'framer-motion'
import { LootItem, RARITY_COLORS, RarityType } from '../../types/opening'

interface WheelItemProps {
  item: LootItem
  isWinning?: boolean
  isSpinning?: boolean
  repeatIndex?: number
}

export function WheelItem({ 
  item, 
  isWinning = false, 
  isSpinning = false,
  repeatIndex = 0 
}: WheelItemProps) {
  const rarity = RARITY_COLORS[item.rarity as RarityType] || RARITY_COLORS.common

  return (
    <motion.div
      className={`
        flex-shrink-0 w-28 h-28 mx-1 p-2 rounded-xl border-2 
        bg-gray-900/90 backdrop-blur-sm relative overflow-hidden
        ${rarity.border}
        ${isWinning && !isSpinning ? 'scale-110 ' + rarity.glow : ''}
      `}
      whileHover={!isSpinning ? { scale: 1.05 } : {}}
      animate={
        isWinning && !isSpinning
          ? {
              scale: [1, 1.15, 1.1],
              transition: { duration: 0.6, delay: 0.2 }
            }
          : {}
      }
    >
      {/* Lueur de rareté */}
      <div className={`absolute inset-0 ${rarity.bg} rounded-xl`}></div>
      
      {/* Image de l'item */}
      <div className="relative z-10 w-full h-full">
        <img
          src={item.image_url || '/placeholder-item.png'}
          alt={item.name}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Badge de rareté */}
      <div className={`
        absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs font-bold
        ${rarity.bg} ${rarity.text} border ${rarity.border}
      `}>
        {item.rarity.charAt(0).toUpperCase()}
      </div>

      {/* Effet de particules pour l'item gagnant */}
      {isWinning && !isSpinning && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180) // Convertir en radians
            const distance = 20
            
            return (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 ${rarity.bg.replace('/10', '')} rounded-full`}
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
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1 + 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                style={{
                  left: '50%',
                  top: '50%',
                }}
              />
            )
          })}
        </motion.div>
      )}

      {/* Pulse effect pour l'item gagnant */}
      {isWinning && !isSpinning && (
        <motion.div
          className={`absolute inset-0 border-2 ${rarity.border} rounded-xl`}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  )
}

export default WheelItem