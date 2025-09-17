// app/components/OpeningButtons/OpeningButtons.tsx - Version avec logo REEV
'use client'

import { motion } from 'framer-motion'
import { Zap, AlertTriangle } from 'lucide-react'

interface OpeningButtonsProps {
  boxPrice: number
  userCoins: number
  onOpenBox: () => void
  onTryFree: () => void
  onToggleFastMode: () => void
  fastMode: boolean
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function OpeningButtons({
  boxPrice,
  userCoins,
  onOpenBox,
  onTryFree,
  onToggleFastMode,
  fastMode,
  isLoading = false,
  disabled = false,
  className = ''
}: OpeningButtonsProps) {
  const canAfford = userCoins >= boxPrice && !disabled
  const isDisabled = disabled || isLoading
  const missingCoins = Math.max(0, boxPrice - userCoins)

  console.log('OpeningButtons render state:', {
    boxPrice,
    userCoins,
    canAfford,
    isDisabled,
    missingCoins,
    isLoading
  })

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      

      {/* Boutons principaux - Layout horizontal minimaliste */}
      <div className="flex items-center gap-4">
        
        {/* Bouton principal d'ouverture */}
        <motion.button
          onClick={onOpenBox}
          disabled={isDisabled || !canAfford}
          whileHover={!isDisabled && canAfford ? { scale: 1.02 } : {}}
          whileTap={!isDisabled && canAfford ? { scale: 0.98 } : {}}
          className={`
            relative px-12 py-4 rounded-2xl font-semibold text-lg
            transition-all duration-300 min-w-[280px] overflow-hidden
            ${canAfford && !isDisabled
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl cursor-pointer'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-600'
            }
          `}
        >
          {/* Effet de brillance pour bouton actif */}
          {canAfford && !isDisabled && !isLoading && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: [-350, 350] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut"
              }}
            />
          )}

          {/* Contenu du bouton */}
          <div className="relative z-10 flex items-center justify-center gap-5">
            {isLoading ? (
              <>
                <motion.div
                  className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Opening...</span>
              </>
            ) : (
              <>
                <span>Open Box</span>
                <div className={`flex items-center gap-1 px-1 py-1 rounded-lg ${
                  canAfford && !isDisabled 
                    ? '' 
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}>
                  <motion.img 
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/loot-boxes/ChatGPT_Image_6_sept._2025_19_31_10.png"
                    alt="REEV Coin"
                    className={`w-9 h-9 object-contain ${canAfford && !isDisabled ? 'opacity-90' : 'opacity-50'}`}
                  />
                  <span className="font-bold">
                    {boxPrice.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Indicateur de déficit */}
          {!canAfford && !isDisabled && missingCoins > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md"
            >
              <AlertTriangle size={12} />
              -{missingCoins.toLocaleString()}
            </motion.div>
          )}
        </motion.button>

        {/* Try Free - Simple */}
        <motion.button
          onClick={onTryFree}
          disabled={isDisabled}
          whileHover={!isDisabled ? { scale: 1.05 } : {}}
          whileTap={!isDisabled ? { scale: 0.95 } : {}}
          className={`
            px-6 py-4 rounded-2xl font-medium text-lg
            transition-all duration-300
            ${!isDisabled
              ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }
          `}
        >
          Try Free
        </motion.button>

        {/* Fast Mode - Icône seule */}
        <motion.button
          onClick={onToggleFastMode}
          disabled={isDisabled}
          whileHover={!isDisabled ? { scale: 1.1 } : {}}
          whileTap={!isDisabled ? { scale: 0.9 } : {}}
          className={`
            w-12 h-12 rounded-xl transition-all duration-300
            flex items-center justify-center
            ${fastMode && !isDisabled
              ? 'bg-yellow-500 text-white shadow-md'
              : !isDisabled
              ? 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              : 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
            }
          `}
        >
          <motion.div
            animate={fastMode && !isDisabled ? { rotate: 360 } : { rotate: 0 }}
            transition={fastMode && !isDisabled ? { 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            } : { 
              duration: 0.3 
            }}
          >
            <Zap size={18} />
          </motion.div>
        </motion.button>
      </div>

      {/* Status simple en bas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        {canAfford && !isDisabled ? (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            Ready to open this box
          </div>
        ) : isDisabled ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Please wait...
          </div>
        ) : (
          <div className="text-sm text-red-600 dark:text-red-400 font-medium">
            Need {missingCoins.toLocaleString()} more coins
          </div>
        )}
        
        {/* Barre de progression simple */}
        <div className="mt-2 w-48 mx-auto">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((userCoins / boxPrice) * 100, 100)}%` }}
              className={`h-1 rounded-full transition-all duration-1000 ${
                canAfford 
                  ? 'bg-green-400' 
                  : 'bg-red-400'
              }`}
            />
          </div>
        </div>

        {/* Message d'encouragement ou d'aide */}
        {!canAfford && !isDisabled && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Visit the store to buy more coins
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default OpeningButtons