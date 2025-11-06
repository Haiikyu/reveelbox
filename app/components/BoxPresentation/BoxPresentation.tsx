// BoxPresentation.tsx - Version minimaliste avec particules élégantes

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
    if (level >= 50 || price >= 500) return { name: 'Legendary', color: 'from-yellow-400 to-orange-500', icon: Crown, glow: '#f59e0b' }
    if (level >= 30 || price >= 300) return { name: 'Epic', color: 'from-purple-500 to-pink-500', icon: Award, glow: '#d946ef' }
    if (level >= 20 || price >= 200) return { name: 'Rare', color: 'from-blue-500 to-indigo-500', icon: Zap, glow: '#3b82f6' }
    if (level >= 10 || price >= 100) return { name: 'Uncommon', color: 'from-green-500 to-teal-500', icon: Shield, glow: '#10b981' }
    return { name: 'Common', color: 'from-gray-400 to-gray-500', icon: Star, glow: '#6b7280' }
  }

  const rarity = getRarityFromLevel(requiredLevel, boxPrice)
  const RarityIcon = rarity.icon
  const hasAccess = !requiredLevel || (userLevel && userLevel >= requiredLevel)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`relative w-full ${className}`}
    >
      <motion.div
        className="flex flex-col lg:flex-row items-center gap-12 max-w-7xl mx-auto py-16 px-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        
        {/* Section image - Design épuré */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative flex-shrink-0"
        >
          
          {/* Halo subtil en arrière-plan */}
          <motion.div 
            className="absolute -inset-16 rounded-full blur-3xl opacity-15"
            style={{ backgroundColor: rarity.glow }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Image principale avec rotation douce */}
          <motion.img
            src={boxImage}
            alt={boxName}
            className="w-80 h-80 object-contain filter drop-shadow-2xl relative z-10"
            style={{
              filter: `drop-shadow(0 20px 40px ${rarity.glow}30)`
            }}
            animate={{
              y: [0, -10, 0],
              rotateY: [0, 5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://via.placeholder.com/400x400/F3F4F6/9CA3AF?text=Box'
            }}
          />

          {/* Badges flottants repositionnés */}
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
            className="absolute -top-6 -right-8 z-20"
          >
            <motion.div
              className={`bg-gradient-to-r ${rarity.color} text-white px-3 py-2 rounded-xl shadow-xl flex items-center gap-2`}
              whileHover={{ scale: 1.1, y: -3 }}
              animate={{
                boxShadow: [`0 5px 15px ${rarity.glow}30`, `0 8px 25px ${rarity.glow}50`, `0 5px 15px ${rarity.glow}30`]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <RarityIcon size={14} />
              <span className="font-bold text-xs">{rarity.name}</span>
            </motion.div>
          </motion.div>

          {isFreedrp && (
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 150 }}
              className="absolute -bottom-6 -left-8 z-20"
            >
              <motion.div
                className="bg-gradient-to-r from-green-400 to-teal-500 text-white px-3 py-2 rounded-xl shadow-xl flex items-center gap-2"
                whileHover={{ scale: 1.1, y: -3 }}
              >
                <Gift size={14} />
                <span className="font-bold text-xs">FREE</span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Section informations - Layout épuré */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex-1 text-center lg:text-left space-y-8"
        >
          
          {/* Titre avec animation de typing */}
          <motion.div className="space-y-4">
            <motion.h1
              className="text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {boxName}
            </motion.h1>

            {/* Ligne décorative animée avec couleurs hybrid */}
            <motion.div
              className="h-1 rounded-full mx-auto lg:mx-0"
              style={{
                background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
              }}
              initial={{ width: 0 }}
              animate={{ width: "120px" }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            />
          </motion.div>

          {/* Description simple */}
          {boxDescription && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl"
            >
              {boxDescription}
            </motion.p>
          )}

          {/* Prix avec design minimaliste */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-2"
          >
            {isFreedrp ? (
              <div className="flex items-center gap-4 text-green-500 dark:text-green-400">
                <Gift size={32} />
                <span className="text-4xl font-light">GRATUIT</span>
              </div>
            ) : boxPrice && (
              <div className="flex items-center gap-4 text-gray-900 dark:text-white">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 360]
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                    alt="Coins"
                    className="w-12 h-12 object-contain"
                  />
                </motion.div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold" style={{ color: 'var(--hybrid-accent-primary)' }}>
                    {boxPrice.toLocaleString()}
                  </span>
                  <span className="text-xl font-medium text-gray-500 dark:text-gray-400">coins</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Niveau requis - design épuré */}
          {requiredLevel && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-4"
            >
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${
                hasAccess 
                  ? 'text-green-400 bg-green-400/10' 
                  : 'text-red-400 bg-red-400/10'
              }`}>
                <Star size={18} />
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="w-full max-w-md space-y-2"
            >
              <div className="flex justify-between text-sm text-gray-400">
                <span>Progression</span>
                <span>{Math.min(userLevel, requiredLevel)}/{requiredLevel}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((userLevel / requiredLevel) * 100, 100)}%` }}
                  transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${
                    hasAccess ? 'from-green-400 to-green-500' : 'from-red-400 to-red-500'
                  } rounded-full relative overflow-hidden`}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: [-100, 200] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Stats en ligne simple */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex gap-8 text-center lg:text-left"
          >
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">10+</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--hybrid-accent-primary)' }}>
                {rarity.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Rareté</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Populaire</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Type</div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default BoxPresentation