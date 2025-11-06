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
            relative px-12 py-4 rounded-2xl font-bold text-lg
            transition-all duration-300 min-w-[280px] overflow-hidden
            ${canAfford && !isDisabled
              ? 'text-white shadow-lg hover:shadow-2xl cursor-pointer hybrid-btn-primary-gradient'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border-2 border-gray-200 dark:border-gray-700'
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
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  canAfford && !isDisabled
                    ? 'bg-white/20'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <motion.img
                    src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                    alt="Coins"
                    className={`w-6 h-6 object-contain ${canAfford && !isDisabled ? 'opacity-100' : 'opacity-50'}`}
                  />
                  <span className="font-black text-base">
                    {boxPrice.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
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
            w-14 h-14 rounded-xl transition-all duration-300
            flex items-center justify-center border-2
            ${fastMode && !isDisabled
              ? 'text-white shadow-lg hybrid-btn-secondary-gradient border-transparent'
              : !isDisabled
              ? 'text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'text-gray-300 dark:text-gray-700 border-gray-200 dark:border-gray-800 cursor-not-allowed'
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
          <div className="text-sm font-bold" style={{ color: 'var(--hybrid-accent-primary)' }}>
            Ready to open this box
          </div>
        ) : isDisabled ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
            Please wait...
          </div>
        ) : (
          <div className="text-sm text-red-600 dark:text-red-400 font-semibold">
            Need {missingCoins.toLocaleString()} more coins
          </div>
        )}

        {/* Barre de progression hybrid */}
        <div className="mt-3 w-64 mx-auto">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((userCoins / boxPrice) * 100, 100)}%` }}
              className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
              style={{
                background: canAfford
                  ? `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                  : 'linear-gradient(90deg, #ef4444, #dc2626)'
              }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
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