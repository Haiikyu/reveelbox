// components/BoxOpeningModal.tsx - Modal d'ouverture avec animation

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Gift, Sparkles, X, Crown, Star } from 'lucide-react'

export function BoxOpeningModal({ 
  isOpen, 
  onClose, 
  lootBox, 
  userCoins, 
  onOpenBox,
  isOpening = false 
}) {
  const [showResult, setShowResult] = useState(false)
  const [openingResult, setOpeningResult] = useState(null)

  const handleOpenBox = async () => {
    const result = await onOpenBox(lootBox.id)
    
    if (result.success) {
      setOpeningResult(result)
      setShowResult(true)
      
      // Fermer le modal après 3 secondes
      setTimeout(() => {
        setShowResult(false)
        setOpeningResult(null)
        onClose()
      }, 3000)
    }
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-yellow-600'
      case 'epic': return 'from-purple-400 to-purple-600'
      case 'rare': return 'from-blue-400 to-blue-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'legendary': return <Crown className="h-8 w-8" />
      case 'epic': return <Sparkles className="h-8 w-8" />
      case 'rare': return <Star className="h-8 w-8" />
      default: return <Gift className="h-8 w-8" />
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {!showResult ? (
            // Vue d'ouverture
            <div className="p-8 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="mb-6">
                <motion.div
                  animate={isOpening ? { rotateY: 360 } : {}}
                  transition={{ duration: 2, repeat: isOpening ? Infinity : 0 }}
                  className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg mb-4"
                >
                  {lootBox?.image_url ? (
                    <img src={lootBox.image_url} alt={lootBox.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <Gift className="h-16 w-16 text-white" />
                  )}
                </motion.div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {lootBox?.name || 'Mystery Box'}
                </h2>
                <p className="text-gray-600">
                  {lootBox?.description || 'Découvrez ce qui se cache à l\'intérieur !'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Coût :</span>
                  <div className="flex items-center gap-1 text-yellow-600 font-bold">
                    <Coins className="h-5 w-5" />
                    {lootBox?.price_virtual || 0}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Votre solde :</span>
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <Coins className="h-5 w-5" />
                    {userCoins || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleOpenBox}
                  disabled={isOpening || userCoins < (lootBox?.price_virtual || 0)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl hover:shadow-lg transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOpening ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : userCoins < (lootBox?.price_virtual || 0) ? (
                    'Coins insuffisants'
                  ) : (
                    'Ouvrir la boîte !'
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            // Vue du résultat
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className={`w-32 h-32 mx-auto bg-gradient-to-br ${getRarityColor(openingResult?.item?.rarity)} rounded-2xl flex items-center justify-center shadow-2xl mb-4 relative overflow-hidden`}>
                  {openingResult?.item?.image_url ? (
                    <img 
                      src={openingResult.item.image_url} 
                      alt={openingResult.item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white">
                      {getRarityIcon(openingResult?.item?.rarity)}
                    </div>
                  )}
                  
                  {/* Effet de brillance */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Félicitations ! 🎉
                </h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {openingResult?.item?.name}
                </h3>
                
                <div className={`inline-block px-4 py-2 rounded-full text-white font-bold mb-4 bg-gradient-to-r ${getRarityColor(openingResult?.item?.rarity)}`}>
                  {openingResult?.item?.rarity?.toUpperCase()}
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                    <Coins className="h-5 w-5" />
                    <span className="font-bold">Valeur : {openingResult?.item?.market_value || 0} coins</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {openingResult?.item?.description || 'Un objet magnifique !'}
                  </p>
                </div>

                <p className="text-green-600 text-sm">
                  L'objet a été ajouté à votre inventaire !
                </p>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}