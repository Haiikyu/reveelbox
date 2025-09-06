// app/components/BoxPresentation/BoxPresentation.tsx - Avec bannière et prix épuré
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
  bannerUrl?: string // Nouvelle prop pour la bannière
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
  
  // Calculer la rareté selon le niveau requis ou le prix
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
        className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto py-12"
      >
        
        {/* Image de la boîte - Épurée et grande */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative flex-shrink-0"
        >
          {/* Image principale sans container */}
          <div className="relative">
            <motion.img
              src={boxImage}
              alt={boxName}
              className="w-80 h-80 lg:w-96 lg:h-96 object-contain mx-auto filter drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.15))'
              }}
              animate={{
                y: [0, -8, 0],
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

            {/* Lueur subtile */}
            <div 
              className={`absolute -inset-12 bg-gradient-to-r ${rarity.color} rounded-full blur-3xl opacity-10`}
            />
          </div>

          {/* Badge de rareté flottant */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="absolute -top-4 -right-6 z-10"
          >
            <div className={`bg-gradient-to-r ${rarity.color} text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2`}>
              <RarityIcon size={16} />
              <span className="font-bold text-sm">{rarity.name}</span>
            </div>
          </motion.div>

          {/* Badge freedrop */}
          {isFreedrp && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              className="absolute -bottom-4 -left-6 z-10"
            >
              <div className="bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                <Gift size={16} />
                <span className="font-bold text-sm">FREE</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Informations - Layout épuré */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 text-center lg:text-left space-y-8"
        >
          {/* Nom */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-none"
          >
            {boxName}
          </motion.h1>

          {/* Description */}
          {boxDescription && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl"
            >
              {boxDescription}
            </motion.p>
          )}

          {/* Prix - Design épuré et minimaliste */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-block"
          >
            {isFreedrp ? (
              <div className="flex items-center gap-3 text-green-600">
                <Gift size={32} />
                <span className="text-4xl font-light"></span>
              </div>
            ) : boxPrice && (
              <div className="flex items-center gap-4 text-gray-900 dark:text-white">
                <Coins size={28} className="text-yellow-500" />
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-light">{boxPrice.toLocaleString()}</span>
                  <span className="text-lg font-medium text-gray-500">coins</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Niveau requis - Design épuré */}
          {requiredLevel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-4"
            >
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${
                hasAccess 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                <Star size={20} />
                <span className="font-medium">Level {requiredLevel}</span>
                {userLevel && (
                  <span className="text-sm opacity-70">
                    ({userLevel}/{requiredLevel})
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Barre de progression minimaliste */}
          {userLevel && requiredLevel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full max-w-md"
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