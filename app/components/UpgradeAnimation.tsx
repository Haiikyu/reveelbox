'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface UpgradeAnimationProps {
  item: {
    name: string
    image_url: string
    market_value: number
    rarity: string
  }
  multiplier: number
  successRate: number
  onComplete: (result: boolean) => void
  isAnimating: boolean
}

export default function UpgradeAnimation({
  item,
  multiplier,
  successRate,
  onComplete,
  isAnimating
}: UpgradeAnimationProps) {
  const [finalPosition, setFinalPosition] = useState(0)
  const [segments, setSegments] = useState<boolean[]>([])
  const [finalResult, setFinalResult] = useState<boolean>(false)

  useEffect(() => {
    if (isAnimating) {
      // 1. TIRER AU SORT LE RÉSULTAT FINAL
      const willWin = Math.random() * 100 < successRate
      setFinalResult(willWin)
      console.log('🎲 Résultat tiré au sort:', willWin ? 'WIN' : 'LOSS', `(${successRate}% chances)`)

      // 2. CRÉER LES SEGMENTS
      const baseSegments: boolean[] = []
      for (let i = 0; i < 100; i++) {
        baseSegments.push(i < successRate)
      }
      
      // Mélanger
      for (let i = baseSegments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baseSegments[i], baseSegments[j]] = [baseSegments[j], baseSegments[i]]
      }

      // Répéter 5 fois pour avoir assez de longueur
      const repeated = [...baseSegments, ...baseSegments, ...baseSegments, ...baseSegments, ...baseSegments]
      setSegments(repeated)

      // 3. TROUVER UN SEGMENT QUI CORRESPOND AU RÉSULTAT
      const segmentWidth = 420
      const minIndex = 200  // Zone sûre
      const maxIndex = 300  // Zone sûre
      
      // Chercher tous les segments qui correspondent au résultat voulu
      const matchingSegments: number[] = []
      for (let i = minIndex; i <= maxIndex; i++) {
        if (repeated[i] === willWin) {
          matchingSegments.push(i)
        }
      }
      
      let targetIndex: number
      if (matchingSegments.length === 0) {
        console.error('❌ ERREUR: Aucun segment trouvé! Fallback...')
        // Fallback : créer un segment du bon type
        targetIndex = Math.floor((minIndex + maxIndex) / 2)
        repeated[targetIndex] = willWin
      } else {
        // Choisir aléatoirement parmi les segments correspondants
        targetIndex = matchingSegments[Math.floor(Math.random() * matchingSegments.length)]
      }
      
      console.log('🎯 Segment ciblé:', targetIndex, 'Type:', repeated[targetIndex] ? 'WIN' : 'LOSS')

      // 4. CALCULER LA POSITION POUR CENTRER CE SEGMENT SOUS LA FLÈCHE
      // La flèche est au centre de l'écran
      const screenCenter = window.innerWidth / 2
      // Position du début de la bande
      const startPosition = screenCenter
      // Pour centrer le segment targetIndex sous la flèche
      const finalPos = startPosition - (targetIndex * segmentWidth) - (segmentWidth / 2)
      
      setFinalPosition(finalPos)
      console.log('📍 Position finale:', finalPos)
    }
  }, [isAnimating, successRate])

  const handleAnimationComplete = () => {
    setTimeout(() => {
      console.log('🏁 RÉSULTAT FINAL:', finalResult ? '✅ WIN' : '❌ LOSS')
      onComplete(finalResult)
    }, 2000)
  }

  if (!isAnimating) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full"
    >
      <div className="relative mx-auto max-w-6xl">
        <div className="relative h-40 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl overflow-hidden border-2 border-[#4578be]/30 shadow-2xl backdrop-blur-sm">
          
          {/* Flèches VERTES en haut et bas */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
            <div 
              className="w-0 h-0 mx-auto"
              style={{
                borderLeft: '20px solid transparent',
                borderRight: '20px solid transparent',
                borderTop: '28px solid #10b981',
                filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))'
              }}
            ></div>
          </div>
          
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
            <div 
              className="w-0 h-0 mx-auto"
              style={{
                borderLeft: '20px solid transparent',
                borderRight: '20px solid transparent',
                borderBottom: '28px solid #10b981',
                filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))'
              }}
            ></div>
          </div>

          {/* Bande qui défile */}
          <motion.div
            className="absolute top-0 left-0 h-full flex"
            initial={{ x: 0 }}
            animate={{ x: finalPosition }}
            transition={{
              duration: 18,
              ease: [0.25, 0.001, 0.05, 1],
            }}
            onAnimationComplete={handleAnimationComplete}
          >
            {segments.map((isWin, index) => (
              <div
                key={index}
                className="flex-shrink-0 h-full flex items-center justify-center border-r border-gray-700/50"
                style={{
                  width: '420px',
                  backgroundColor: isWin ? '#4578be' : 'transparent',
                  boxShadow: isWin ? '0 0 30px rgba(69, 120, 190, 0.5)' : 'none'
                }}
              >
                {isWin && (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-white/20 rounded-lg" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* Gradients */}
          <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-gray-900 to-transparent pointer-events-none z-10"></div>
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-gray-900 to-transparent pointer-events-none z-10"></div>
        </div>

        {/* Info */}
        <div className="text-center mt-5">
          <p className="text-white text-sm font-medium">
            Multiplicateur x{multiplier.toFixed(1)} • {successRate.toFixed(1)}% de chances
          </p>
        </div>
      </div>
    </motion.div>
  )
}