
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Coins, TrendingUp, X, Sparkles } from 'lucide-react'
import { useState } from 'react'
// ✅ IMPORT CORRIGÉ
import type { FreedropItem } from '@/lib/services/freedrop'

interface WinningResultProps {
  item: FreedropItem
  isOpen: boolean
  onClose: () => void
  onSell?: (item: FreedropItem) => Promise<void> | void
  onUpgrade?: (item: FreedropItem) => void
  className?: string
}

export function WinningResult({ 
  item, 
  isOpen, 
  onClose, 
  onSell, 
  onUpgrade,
  className = '' 
}: WinningResultProps) {
  const [isSelling, setIsSelling] = useState(false)

  const getRarityGlow = (rarity: string) => {
    const glows = {
      common: '#10b981',
      uncommon: '#3b82f6',
      rare: '#8b5cf6',
      epic: '#d946ef',
      legendary: '#f59e0b'
    }
    return glows[rarity.toLowerCase() as keyof typeof glows] || glows.common
  }

  const getRarityConfig = (rarity: string) => {
    const configs = {
      common: { name: 'Common', gradient: 'from-green-400 to-green-500' },
      uncommon: { name: 'Uncommon', gradient: 'from-blue-400 to-blue-500' },
      rare: { name: 'Rare', gradient: 'from-purple-400 to-purple-500' },
      epic: { name: 'Epic', gradient: 'from-pink-400 to-purple-500' },
      legendary: { name: 'Legendary', gradient: 'from-yellow-400 to-orange-500' }
    }
    return configs[rarity.toLowerCase() as keyof typeof configs] || configs.common
  }

  const handleSell = async () => {
    if (!onSell || isSelling) return

    try {
      setIsSelling(true)
      
      // Appeler la fonction de vente
      await onSell(item)
      
      // Fermer automatiquement le modal après une vente réussie
      setTimeout(() => {
        onClose()
      }, 500) // Petit délai pour que l'utilisateur voie le changement

    } catch (error) {
      console.error('Erreur lors de la vente:', error)
      // Ne pas fermer le modal en cas d'erreur
    } finally {
      setIsSelling(false)
    }
  }

  const glowColor = getRarityGlow(item.rarity)
  const rarityConfig = getRarityConfig(item.rarity)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />

          {/* Pop-up principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.4 
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full pointer-events-auto relative overflow-hidden">
              
              {/* Bouton fermer */}
              <button
                onClick={onClose}
                disabled={isSelling}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors z-10 disabled:opacity-50"
              >
                <X size={16} className="text-gray-600 dark:text-gray-300" />
              </button>

              {/* Header avec animation */}
              <div className="relative pt-8 pb-4 text-center">
                {/* Confettis subtils pour objets rares */}
                {(item.rarity === 'legendary' || item.rarity === 'epic') && (
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: i % 2 === 0 ? glowColor : '#fbbf24',
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 50}%`
                        }}
                        animate={{
                          y: [0, -100, 100],
                          x: [0, Math.random() * 40 - 20],
                          rotate: [0, 360],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 3,
                          delay: i * 0.1,
                          repeat: Infinity,
                          repeatDelay: 4
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Badge de succès */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium text-sm mb-4"
                >
                  <Sparkles size={16} />
                  Item Won!
                </motion.div>
              </div>

              {/* Image et infos de l'item */}
              <div className="px-8 pb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  {/* Image avec glow */}
                  <div className="relative inline-block mb-4">
                    <div 
                      className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                      style={{ backgroundColor: glowColor }}
                    />
                    <img
                      src={item.image_url || 'https://via.placeholder.com/120x120/F3F4F6/9CA3AF?text=Item'}
                      alt={item.name}
                      className="relative w-24 h-24 object-contain mx-auto"
                      style={{
                        filter: `drop-shadow(0 10px 30px ${glowColor}40)`
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://via.placeholder.com/120x120/F3F4F6/9CA3AF?text=Item'
                      }}
                    />
                  </div>

                  {/* Nom et rareté */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.name}
                  </h3>
                  
                  <div 
                    className={``}
                  >
                    <Sparkles size={0} />
                    {}
                  </div>

                  {/* Valeur */}
<div className="flex items-center justify-center gap-2 text-2xl font-bold">
  <span className="text-gray-900 dark:text-white">
    {item.market_value.toLocaleString()}
  </span>
  <img
    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/ChatGPT_Image_6_sept._2025_19_31_10.png"
    alt="Coins"
    className="w-10 h-10 object-contain"
  />
</div>

                  
                  {/* Probabilité discrète */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Drop chance: {item.probability.toFixed(4)}%
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  {/* Actions avec boutons si fonctions fournies */}
                  {(onSell || onUpgrade) && (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Bouton Vendre - Corrigé */}
                      {onSell && (
                        <button
                          onClick={handleSell}
                          disabled={isSelling}
                          className="flex items-center justify-center gap-2 px-6 py-4 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded-2xl font-medium transition-colors disabled:cursor-not-allowed"
                        >
                          {isSelling ? (
                            <>
                              <motion.div
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Selling...
                            </>
                          ) : (
                            <>
                              <Coins size={18} />
                              Sell
                            </>
                          )}
                        </button>
                      )}

                      {/* Bouton Upgrade - Optionnel et désactivé */}
                      {onUpgrade && (
                        <button
                          onClick={() => onUpgrade(item)}
                          disabled
                          className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-2xl font-medium cursor-not-allowed relative"
                        >
                          <TrendingUp size={18} />
                          Upgrade
                          
                          {/* Badge "Coming Soon" */}
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Soon
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Si aucune action, juste bouton continuer */}
                  {!onSell && !onUpgrade && (
                    <button
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium transition-colors"
                    >
                      <Sparkles size={18} />
                      Continue
                    </button>
                  )}
                </motion.div>

                {/* Note discrète */}
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {isSelling ? 'Processing sale...' : 'Item added to your inventory'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default WinningResult