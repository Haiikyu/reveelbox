// app/components/FreedropButtons/FreedropButtons.tsx - VERSION CORRIGÉE
'use client'

import { motion } from 'framer-motion'
import { Gift, Zap, Clock, Shield, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'

interface FreedropButtonsProps {
  canClaim: boolean
  alreadyClaimed: boolean
  requiredLevel: number
  userLevel: number
  onClaimBox: () => void
  onTryFree: () => void
  onToggleFastMode: () => void
  fastMode: boolean
  isLoading?: boolean
  className?: string
}

export function FreedropButtons({
  canClaim,
  alreadyClaimed,
  requiredLevel,
  userLevel,
  onClaimBox,
  onTryFree,
  onToggleFastMode,
  fastMode,
  isLoading = false,
  className = ''
}: FreedropButtonsProps) {
  const [timeToReset, setTimeToReset] = useState('')

  // Timer en temps réel jusqu'au reset quotidien (00:00)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeToReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])

  // ✅ LOGIQUE CORRIGÉE DES BOUTONS
  const getMainButtonState = () => {
    // 1. Vérifier le niveau requis EN PREMIER
    if (userLevel < requiredLevel) {
      return {
        text: `Level ${requiredLevel} Required`,
        icon: Shield,
        disabled: true,
        style: 'bg-red-50 text-red-700 border border-red-200',
        description: `You need level ${requiredLevel} (current: ${userLevel})`
      }
    }
    
    // 2. Vérifier si déjà réclamé AVANT canClaim
    if (alreadyClaimed) {
      return {
        text: 'Claimed Today',
        icon: Clock,
        disabled: true,
        style: 'bg-blue-50 text-blue-700 border border-blue-200',
        description: `Next claim in ${timeToReset}`
      }
    }

    // 3. Peut réclamer seulement si pas encore réclamé ET niveau suffisant
    if (canClaim && !alreadyClaimed && userLevel >= requiredLevel) {
      return {
        text: 'Claim Free',
        icon: Gift,
        disabled: false,
        style: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl',
        description: 'Get your daily reward now!'
      }
    }

    // 4. Fallback - indisponible
    return {
      text: 'Unavailable',
      icon: Clock,
      disabled: true,
      style: 'bg-gray-50 text-gray-400 border border-gray-200',
      description: 'Check requirements'
    }
  }

  const buttonState = getMainButtonState()
  const ButtonIcon = buttonState.icon

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      
      {/* Timer discret en haut */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-gray-500"
      >
        <Timer className="w-4 h-4" />
        <span>Reset in {timeToReset}</span>
      </motion.div>

      {/* Boutons principaux - Layout horizontal minimaliste */}
      <div className="flex items-center gap-4">
        
        {/* Bouton principal de réclamation */}
        <motion.button
          onClick={onClaimBox}
          disabled={buttonState.disabled || isLoading}
          whileHover={!buttonState.disabled && !isLoading ? { scale: 1.02 } : {}}
          whileTap={!buttonState.disabled && !isLoading ? { scale: 0.98 } : {}}
          className={`
            relative px-8 py-4 rounded-2xl font-semibold text-lg
            transition-all duration-300 min-w-[200px] overflow-hidden
            ${buttonState.style}
            ${isLoading ? 'animate-pulse' : ''}
            ${buttonState.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {/* Effet de brillance pour le bouton actif */}
          {canClaim && !alreadyClaimed && !isLoading && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"
              animate={{ x: [-250, 250] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            />
          )}

          {/* Contenu du bouton */}
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Claiming...</span>
              </>
            ) : (
              <>
                <ButtonIcon size={20} />
                <span>{buttonState.text}</span>
              </>
            )}
          </div>
        </motion.button>

        {/* Try Free - Simple */}
        <motion.button
          onClick={onTryFree}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.05 } : {}}
          whileTap={!isLoading ? { scale: 0.95 } : {}}
          className={`
            px-6 py-4 rounded-2xl font-medium text-lg
            transition-all duration-300
            ${!isLoading
              ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              : 'text-gray-300 cursor-not-allowed'
            }
          `}
        >
          Try Free
        </motion.button>

        {/* Fast Mode - Icône seule */}
        <motion.button
          onClick={onToggleFastMode}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.1 } : {}}
          whileTap={!isLoading ? { scale: 0.9 } : {}}
          className={`
            w-12 h-12 rounded-xl transition-all duration-300
            flex items-center justify-center
            ${fastMode && !isLoading
              ? 'bg-yellow-500 text-white shadow-md'
              : !isLoading
              ? 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              : 'text-gray-200 cursor-not-allowed'
            }
          `}
        >
          <motion.div
            animate={fastMode && !isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={fastMode && !isLoading ? { 
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

      {/* Status description - Discret */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-sm text-gray-500 max-w-md"
      >
        <div className="mb-2">{buttonState.description}</div>
        
        {/* Progress bar pour niveau insuffisant */}
        {userLevel < requiredLevel && (
          <div className="mt-3">
            <div className="w-48 mx-auto mb-2">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((userLevel / requiredLevel) * 100, 100)}%` }}
                  className="h-1 bg-red-400 rounded-full transition-all duration-1000"
                />
              </div>
            </div>
            <div className="text-xs text-red-600">
              {requiredLevel - userLevel} level{requiredLevel - userLevel > 1 ? 's' : ''} needed
            </div>
          </div>
        )}

        {/* Message d'encouragement pour les réclamations réussies */}
        {canClaim && !alreadyClaimed && !isLoading && (
          <div className="text-green-600 font-medium mt-2">
            🎁 Ready to claim your daily reward!
          </div>
        )}

        {/* Message pour les réclamations déjà effectuées */}
        {alreadyClaimed && (
          <div className="text-blue-600 font-medium mt-2">
            ✅ Come back tomorrow for your next reward
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default FreedropButtons