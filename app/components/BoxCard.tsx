'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gift, 
  Package, 
  Star, 
  ArrowRight,
  Coins,
  Crown,
  Sparkles,
  Play,
  Eye,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

// Types
interface LootBoxItem {
  id?: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image_url?: string
  market_value?: number
  probability?: number
}

interface LootBoxItemRelation {
  probability?: number
  items: LootBoxItem
}

interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  image_url?: string
  is_active?: boolean
  is_daily_free?: boolean
  is_featured?: boolean
  loot_box_items?: LootBoxItemRelation[]
  items?: LootBoxItem[]
  items_count?: number
  total_value?: number
}

interface BoxCardProps {
  box: LootBox
  index: number
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showStats?: boolean
}

const BoxCard = ({ 
  box, 
  index, 
  onClick, 
  className = '', 
  size = 'md',
  showStats = false
}: BoxCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // Configuration des tailles
  const sizeConfig = {
    sm: {
      container: 'w-24 h-24',
      cards: { width: 'w-4', height: 'h-6' },
      icons: { size: 12 }
    },
    md: {
      container: 'w-32 h-32',
      cards: { width: 'w-6', height: 'h-9' },
      icons: { size: 16 }
    },
    lg: {
      container: 'w-40 h-40',
      cards: { width: 'w-8', height: 'h-12' },
      icons: { size: 20 }
    }
  }

  const config = sizeConfig[size]
  
  const getBadgeInfo = (box: LootBox) => {
    if (box.is_daily_free) return { badge: 'FREE', color: 'bg-green-500' }
    if (box.price_virtual >= 400) return { badge: 'LIMITED', color: 'bg-purple-500' }
    if (box.price_virtual >= 300) return { badge: 'HOT', color: 'bg-orange-500' }
    return { badge: 'NEW', color: 'bg-blue-500' }
  }

const getRarityColor = (rarity: string) => {
  const colors: Record<string, string> = {
    legendary: 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-500',
    epic: 'bg-gradient-to-br from-purple-400 to-purple-600 border-purple-500',
    rare: 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-500',
    common: 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-500'
  }
  return colors[rarity] || colors.common
}

  const getRarityIcon = (rarity: string) => {
    const iconSize = config.icons.size
    switch (rarity) {
      case 'legendary': return <Crown size={iconSize} className="text-white" />
      case 'epic': return <Sparkles size={iconSize} className="text-white" />
      case 'rare': return <Star size={iconSize} className="text-white" />
      default: return <Gift size={iconSize} className="text-white" />
    }
  }

  const badgeInfo = getBadgeInfo(box)
  const items = box.loot_box_items?.map(item => ({
    ...item.items,
    probability: item.probability
  })) || box.items || []

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Navigation par défaut
      window.open(`/boxes/${box.id}`, '_blank')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="text-center relative">
        
        {/* Badge flottant */}
        <div className="relative mb-4">
          <motion.div 
            className={`absolute -top-2 left-1/4 ${badgeInfo.color} text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg`}
            animate={{ 
              scale: isHovered ? 1.1 : 1,
              y: isHovered ? -2 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            {badgeInfo.badge}
          </motion.div>
        </div>
        
        {/* Cartes qui sortent au hover */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-1">
            {items.slice(0, 4).map((item, cardIndex) => {
              const colorClass = getRarityColor(item.rarity)
              
              return (
                <motion.div
                  key={cardIndex}
                  animate={{
                    y: isHovered ? -cardIndex * 4 - 12 : 0,
                    rotate: isHovered ? (cardIndex - 1.5) * 8 : 0,
                    scale: isHovered ? 1.1 : 1
                  }}
                  transition={{ 
                    delay: cardIndex * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  className={`${config.cards.width} ${config.cards.height} ${colorClass} rounded-sm border-2 shadow-lg flex items-center justify-center relative overflow-hidden`}
                >
                  {/* Icône de rareté */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {getRarityIcon(item.rarity)}
                  </div>
                  
                  {/* Effet de brillance pour legendary */}
                  {item.rarity === 'legendary' && (
                    <motion.div
                      animate={{ 
                        x: [-20, 20, -20],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                  )}
                  
                  {/* Probabilité si disponible */}
                  {showStats && item.probability && (
                    <div className="absolute -bottom-1 -right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                      {item.probability}%
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
        
        {/* Boîte 3D principale */}
        <motion.div 
          className="relative mb-6"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
            rotateY: isHovered ? 8 : 0,
            rotateX: isHovered ? 5 : 0
          }}
          transition={{ duration: 0.3 }}
          style={{ perspective: '1000px' }}
        >
          <div 
            className={`${config.container} mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-2xl relative overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300`}
            style={{
              transform: 'rotateX(15deg) rotateY(-10deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Image de la boîte */}
            {box.image_url && (
              <motion.img 
                src={box.image_url} 
                alt={box.name}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                animate={{ opacity: isHovered ? 0.8 : 1 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            
            {/* Overlay avec animations */}
            <div className={`absolute inset-0 ${box.image_url ? 'bg-gradient-to-br from-green-400/60 to-green-600/60' : 'bg-gradient-to-br from-green-400 to-green-600'} rounded-2xl flex items-center justify-center`}>
              {/* Grille d'icônes animées */}
              <div className="grid grid-cols-2 gap-2">
                <motion.div
                  animate={{ rotate: isHovered ? 360 : 0 }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center"
                >
                  <Gift size={config.icons.size} className="text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: isHovered ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0 }}
                  className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center"
                >
                  <Coins size={config.icons.size} className="text-white" />
                </motion.div>
                <motion.div
                  animate={{ y: isHovered ? [0, -3, 0] : 0 }}
                  transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
                  className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center"
                >
                  <Star size={config.icons.size} className="text-white" />
                </motion.div>
                <motion.div
                  animate={{ rotate: isHovered ? [0, -180, -360] : 0 }}
                  transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
                  className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center"
                >
                  <Package size={config.icons.size} className="text-white" />
                </motion.div>
              </div>
            </div>
            
            {/* Faces 3D pour l'effet de profondeur */}
            <div 
              className="absolute inset-y-0 right-0 w-6 bg-gradient-to-br from-green-500 to-green-700 rounded-r-2xl"
              style={{
                transform: 'rotateY(90deg) translateZ(16px)',
                transformOrigin: 'right'
              }}
            />
            <div 
              className="absolute inset-x-0 top-0 h-6 bg-gradient-to-br from-green-300 to-green-500 rounded-t-2xl"
              style={{
                transform: 'rotateX(90deg) translateZ(16px)',
                transformOrigin: 'top'
              }}
            />
            
            {/* Effet de particules au hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        scale: 0,
                        x: '50%',
                        y: '50%'
                      }}
                      animate={{ 
                        scale: [0, 1, 0],
                        x: `${50 + (Math.random() - 0.5) * 80}%`,
                        y: `${50 + (Math.random() - 0.5) * 80}%`
                      }}
                      transition={{ 
                        duration: 1.5,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                      className="absolute w-1 h-1 bg-white/80 rounded-full"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Informations de la boîte */}
        <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2 group-hover:text-green-600 transition-colors dark:text-white dark:group-hover:text-green-400">
          {box.name}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed px-2">
          {box.description}
        </p>
        
        {/* Statistiques si demandées */}
        {showStats && (
          <div className="flex items-center justify-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
            {box.items_count && (
              <div className="flex items-center gap-1">
                <Package size={12} />
                <span>{box.items_count} items</span>
              </div>
            )}
            {box.total_value && (
              <div className="flex items-center gap-1">
                <TrendingUp size={12} />
                <span>{box.total_value.toFixed(0)}€ moy</span>
              </div>
            )}
          </div>
        )}
        
        {/* Prix */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Coins className="h-3 w-3 text-white" />
          </div>
          <span className="text-2xl font-black text-gray-900 dark:text-white">
            {box.is_daily_free ? 'GRATUIT' : box.price_virtual}
          </span>
          {!box.is_daily_free && (
            <span className="text-sm text-gray-500 dark:text-gray-400">coins</span>
          )}
        </div>
        
        {/* Statut de disponibilité */}
        <div className={`text-sm font-bold mb-2 ${
          box.is_active 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {box.is_active ? 'Disponible maintenant' : 'Temporairement indisponible'}
        </div>
        
        {/* Bouton d'action au hover */}
        <AnimatePresence>
          {isHovered && box.is_active && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <div className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200">
                <Play className="h-4 w-4" />
                {box.is_daily_free ? 'Récupérer gratuitement' : 'Cliquer pour ouvrir'}
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Informations additionnelles pour les boîtes premium */}
        {!box.is_daily_free && box.price_virtual >= 300 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1"
          >
            <Eye size={12} />
            <span>Objets rares garantis</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default BoxCard