// ========================================
// app/components/LootList/LootList.tsx - Import corrigé
// ========================================

'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/app/components/ThemeProvider'
// ✅ IMPORT CORRIGÉ - Utilise le type du service
import type { FreedropItem } from '@/lib/services/freedrop'

interface LootListProps {
  items: FreedropItem[]
  onItemClick?: (item: FreedropItem) => void
  className?: string
}

export function LootList({ items, onItemClick, className = '' }: LootListProps) {
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

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.market_value - a.market_value)
  }, [items])

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: 1,
          transition: { delayChildren: 0.05, staggerChildren: 0.03 }
        }}
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-2.5"
      >
        {sortedItems.map((item, index) => (
          <LootItemCard
            key={item.id}
            item={item}
            index={index}
            getRarityGlow={getRarityGlow}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </motion.div>
    </div>
  )
}

interface LootItemCardProps {
  item: FreedropItem
  index: number
  getRarityGlow: (rarity: string) => string
  onClick?: () => void
}

function LootItemCard({ item, index, getRarityGlow, onClick }: LootItemCardProps) {
  const glowColor = getRarityGlow(item.rarity)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [isHovered, setIsHovered] = useState(false)

  const handleHoverStart = useCallback(() => setIsHovered(true), [])
  const handleHoverEnd = useCallback(() => setIsHovered(false), [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: Math.min(index * 0.025, 0.3)
      }}
      whileHover={{
        y: -8,
        scale: 1.04,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onClick={onClick}
      className="cursor-pointer py-2"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Image flottante - pas de container */}
      <div className="relative mb-2">
        <motion.img
          src={item.image_url || 'https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=Item'}
          alt={item.name}
          className="w-full h-14 sm:h-16 md:h-[72px] object-contain"
          animate={{
            filter: isHovered
              ? `drop-shadow(0 8px 20px ${glowColor}35) brightness(1.06)`
              : 'drop-shadow(0 2px 8px rgba(0,0,0,0.06)) brightness(1)'
          }}
          transition={{ duration: 0.2 }}
          loading="lazy"
          style={{ transform: 'translateZ(0)' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=Item'
          }}
        />
      </div>

      {/* Petit dot de rareté */}
      <div className="flex justify-center mb-1.5">
        <div
          className="w-4 h-[1.5px] rounded-full"
          style={{ backgroundColor: glowColor, opacity: isHovered ? 0.8 : 0.3 }}
        />
      </div>

      {/* Infos minimales */}
      <div className="text-center">
        <h3 className="text-[10px] sm:text-xs font-medium mb-0.5 line-clamp-1 leading-tight" style={{ color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.5)' }}>
          {item.name}
        </h3>

        <div className="flex items-center justify-center gap-0.5">
          <img
            src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
            alt="Coins"
            className="w-2.5 h-2.5 object-contain opacity-60"
          />
          <span className="text-[9px] sm:text-[10px] font-semibold" style={{ color: isDark ? '#969087' : 'rgba(0,0,0,0.4)' }}>
            {item.market_value.toLocaleString()}
          </span>
          <span className="text-[7px] sm:text-[8px] font-medium ml-0.5" style={{ color: `${glowColor}70` }}>
            {item.probability.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default LootList