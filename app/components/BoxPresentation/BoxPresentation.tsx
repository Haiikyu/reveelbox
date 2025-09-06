// BoxPresentation.tsx - Version compacte pour éviter les superpositions

'use client'

import { motion } from 'framer-motion'
import { Crown, Star, Gift, Shield, Zap, Award, Coins } from 'lucide-react'

interface BoxPresentationProps {
  boxName: string
  boxImage: string
  boxDescription?: string
  boxPrice?: number
  requiredLevel?: number
  userLevel?: number
  isFreedrp?: boolean
  bannerUrl?: string
  className?: string
}

export function BoxPresentation({ 
  boxName, 
  boxImage, 
  boxDescription,
  boxPrice,
  requiredLevel,
  userLevel,
  isFreedrp = false,
  bannerUrl,
  className = '' 
}: BoxPresentationProps) {
  
  const getRarityFromLevel = (level: number = 1, price: number = 0) => {
    if (level >= 50 || price >= 500) return { name: 'Legendary', color: 'from-yellow-400 to-orange-500', icon: Crown }
    if (level >= 30 || price >= 300) return { name: 'Epic', color: 'from-purple-500 to-pink-500', icon: Award }
    if (level >= 20 || price >= 200) return { name: 'Rare', color: 'from-blue-500 to-indigo-500', icon: Zap }
    if (level >= 10 || price >= 100) return { name: 'Uncommon', color: 'from-green-500 to-emerald-500', icon: Shield }
    return { name: 'Common', color: 'from-gray-400 to-gray-500', icon: Star }
  }

  const rarity = getRarityFromLevel(requiredLevel, boxPrice)
  const RarityIcon = rarity.icon
  const hasAccess = !requiredLevel || (userLevel && userLevel >= requiredLevel)

  return (
    <div className={`relative ${className}`}>
      
      {/* Bannière en arrière-plan */}
      {bannerUrl && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden -z-10">
          <img
            src={bannerUrl}
            alt="Background banner"
            className="w-full h-full object-cover opacity-20"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row items-center gap-8 max-w-5xl mx-auto py-8" // Réduit gap et padding
      >
        
        {/* Image de la boîte - Plus compacte */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative flex-shrink-0"
        >
          <div className="relative">
            <motion.img
              src={boxImage}
              alt={boxName}
              className="w-64 h-64 lg:w-72 lg:h-72 object-contain mx-auto filter drop-shadow-2xl" // Réduit de 96 à 72
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))'
              }}
              animate={{
                y: [0, -6, 0],
                rotateY: [0, 2, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'https://via.placeholder.com/400x400/F3F4F6/9CA3AF?text=Box'
              }}
            />

            {/* Lueur subtile - Plus petite */}
            <div 
              className={`absolute -inset-8 bg-gradient-to-r ${rarity.color} rounded-full blur-2xl opacity-10`} // Réduit inset
            />
          </div>

          {/* Badge de rareté flottant - Plus petit */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="absolute -top-2 -right-4 z-10"
          >
            <div className={`bg-gradient-to-r ${rarity.color} text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2`}>
              <RarityIcon size={14} />
              <span className="font-bold text-xs">{rarity.name}</span>
            </div>
          </motion.div>

          {/* Badge freedrop - Plus petit */}
          {isFreedrp && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              className="absolute -bottom-2 -left-4 z-10"
            >
              <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                <Gift size={14} />
                <span className="font-bold text-xs">FREE</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Informations - Layout compacte */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 text-center lg:text-left space-y-4" // Réduit space
        >
          {/* Nom - Plus petit */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-none" // Réduit taille
          >
            {boxName}
          </motion.h1>

          {/* Description - Plus compacte */}
          {boxDescription && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl" // Réduit taille
            >
              {boxDescription}
            </motion.p>
          )}

          {/* Prix - Design compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-block"
          >
            {isFreedrp ? (
              <div className="flex items-center gap-2 text-green-600">
                <Gift size={24} />
                <span className="text-2xl font-light">GRATUIT</span>
              </div>
            ) : boxPrice && (
              <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Coins size={24} className="text-yellow-500" />
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-light">{boxPrice.toLocaleString()}</span> {/* Réduit taille */}
                  <span className="text-base font-medium text-gray-500">coins</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Niveau requis - Compact */}
          {requiredLevel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-3"
            >
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
                hasAccess 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                <Star size={16} />
                <span className="font-medium text-sm">Level {requiredLevel}</span>
                {userLevel && (
                  <span className="text-xs opacity-70">
                    ({userLevel}/{requiredLevel})
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Barre de progression compacte */}
          {userLevel && requiredLevel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full max-w-sm" // Réduit largeur
            >
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((userLevel / requiredLevel) * 100, 100)}%` }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                  className={`h-1 bg-gradient-to-r ${
                    hasAccess ? 'from-green-400 to-green-500' : 'from-red-400 to-red-500'
                  }`}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default BoxPresentation