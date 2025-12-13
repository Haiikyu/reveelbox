// app/components/landing/AmbientLight.tsx - Éclairage Ambiant Dynamique

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface TimeBasedPalette {
  primary: string
  secondary: string
  accent: string
  particles: string
}

const TIME_PALETTES: { [key: string]: TimeBasedPalette } = {
  night: {
    // 00h-06h : Nuit profonde
    primary: 'rgba(20, 20, 40, 0.6)',
    secondary: 'rgba(59, 130, 246, 0.3)',
    accent: 'rgba(139, 92, 246, 0.2)',
    particles: '#60A5FA'
  },
  dawn: {
    // 06h-09h : Aurore
    primary: 'rgba(255, 237, 213, 0.3)',
    secondary: 'rgba(251, 146, 60, 0.3)',
    accent: 'rgba(253, 224, 71, 0.2)',
    particles: '#FCD34D'
  },
  day: {
    // 09h-17h : Jour
    primary: 'rgba(255, 255, 255, 0.1)',
    secondary: 'rgba(96, 165, 250, 0.2)',
    accent: 'rgba(34, 211, 238, 0.15)',
    particles: '#38BDF8'
  },
  dusk: {
    // 17h-21h : Crépuscule
    primary: 'rgba(139, 92, 246, 0.3)',
    secondary: 'rgba(236, 72, 153, 0.3)',
    accent: 'rgba(251, 146, 60, 0.2)',
    particles: '#F472B6'
  },
  evening: {
    // 21h-00h : Soirée
    primary: 'rgba(30, 27, 75, 0.5)',
    secondary: 'rgba(124, 58, 237, 0.3)',
    accent: 'rgba(168, 85, 247, 0.2)',
    particles: '#A78BFA'
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  
  if (hour >= 0 && hour < 6) return 'night'
  if (hour >= 6 && hour < 9) return 'dawn'
  if (hour >= 9 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'dusk'
  return 'evening'
}

export default function AmbientLight() {
  const [palette, setPalette] = useState<TimeBasedPalette>(TIME_PALETTES.night)
  const [timeOfDay, setTimeOfDay] = useState('night')

  useEffect(() => {
    // Initialiser avec l'heure actuelle
    const currentTime = getTimeOfDay()
    setTimeOfDay(currentTime)
    setPalette(TIME_PALETTES[currentTime])

    // Vérifier toutes les minutes si on change de période
    const interval = setInterval(() => {
      const newTime = getTimeOfDay()
      if (newTime !== timeOfDay) {
        setTimeOfDay(newTime)
        setPalette(TIME_PALETTES[newTime])
      }
    }, 60000) // Toutes les minutes

    return () => clearInterval(interval)
  }, [timeOfDay])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Couche principale d'ambiance */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          background: `radial-gradient(circle at 50% 50%, ${palette.primary}, transparent 60%)`
        }}
        transition={{ duration: 5, ease: 'easeInOut' }}
      />

      {/* Couche secondaire (haut) */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(circle at 50% 0%, ${palette.secondary}, transparent 50%)`
        }}
        transition={{ duration: 5, ease: 'easeInOut' }}
      />

      {/* Couche d'accent (bas) */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(circle at 50% 100%, ${palette.accent}, transparent 40%)`
        }}
        transition={{ duration: 5, ease: 'easeInOut' }}
      />

      {/* Particules temporelles flottantes */}
      {timeOfDay === 'night' && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: '0 0 4px rgba(255,255,255,0.8)'
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      )}

      {timeOfDay === 'dawn' && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-1/3"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,179,0,0.2), transparent)'
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity
          }}
        />
      )}

      {timeOfDay === 'dusk' && (
        <>
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`firefly-${i}`}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${40 + Math.random() * 40}%`,
                backgroundColor: palette.particles,
                boxShadow: `0 0 10px ${palette.particles}, 0 0 20px ${palette.particles}`
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </>
      )}

      {/* Indicateur subtil de l'heure (optionnel, pour debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-mono">
          {timeOfDay} mode
        </div>
      )}
    </div>
  )
}