'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sparkles, TrendingUp, X } from 'lucide-react'

interface UpgradeAnimationProps {
  item: {
    name: string
    image_url: string
    market_value: number
    rarity: string
  }
  multiplier: number
  successRate: number
  onComplete: (result: 'success' | 'fail') => void
  isAnimating: boolean
}

export default function UpgradeAnimation({
  item,
  multiplier,
  successRate,
  onComplete,
  isAnimating
}: UpgradeAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle')
  const [result, setResult] = useState<'success' | 'fail' | null>(null)
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    if (isAnimating) {
      setPhase('spinning')
      setResult(null)

      // Generate particles (optimisé)
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        delay: Math.random() * 0.5
      }))
      setParticles(newParticles)

      // Simulate upgrade calculation
      const timer = setTimeout(() => {
        const success = Math.random() * 100 < successRate
        setResult(success ? 'success' : 'fail')
        setPhase('result')

        const closeTimer = setTimeout(() => {
          onComplete(success ? 'success' : 'fail')
          setPhase('idle')
        }, 3000)

        return () => clearTimeout(closeTimer)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setPhase('idle')
      setResult(null)
    }
  }, [isAnimating, successRate, onComplete])

  if (!isAnimating && phase === 'idle') return null

  return (
    <AnimatePresence>
      {(isAnimating || phase !== 'idle') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl"
          style={{ isolation: 'isolate', willChange: 'opacity' }}
        >
        {/* Background animated gradient */}
        <motion.div
          className="absolute inset-0 opacity-40"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(212, 160, 136, 0.4) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(212, 160, 136, 0.4) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(212, 160, 136, 0.4) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Animated particles background */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`bg-particle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: i % 2 === 0 ? 'var(--hybrid-accent-primary)' : 'var(--hybrid-accent-secondary)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut'
            }}
          />
        ))}

        {/* Main container */}
        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-8">
          {/* Center item animation */}
          <div className="relative h-[600px] flex items-center justify-center">
            {/* Circular progress ring - couche 1 (fond) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: phase === 'spinning' ? [0.8, 1.02, 1] : 1,
                opacity: phase === 'spinning' ? 1 : 0,
                rotate: phase === 'spinning' ? 360 : 0
              }}
              transition={{
                scale: { duration: 0.5 },
                rotate: { duration: 3, ease: 'linear', repeat: phase === 'spinning' ? Infinity : 0 }
              }}
              style={{ zIndex: 1 }}
            >
              <svg width="400" height="400" viewBox="0 0 400 400" className="transform -rotate-90">
              {/* Background circle with pulse */}
              <motion.circle
                cx="200"
                cy="200"
                r="180"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
                animate={{
                  r: [180, 185, 180],
                  opacity: [0.08, 0.15, 0.08]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Progress circle */}
              <motion.circle
                cx="200"
                cy="200"
                r="180"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: phase === 'spinning' ? [0, 1] : 0 }}
                transition={{ duration: 3, ease: 'easeInOut' }}
                style={{ filter: 'drop-shadow(0 0 20px var(--hybrid-accent-primary))' }}
              />
              {/* Inner glow circle */}
              <motion.circle
                cx="200"
                cy="200"
                r="170"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                opacity="0.4"
                animate={{
                  r: [170, 175, 170],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--hybrid-accent-primary)" />
                  <stop offset="50%" stopColor="var(--hybrid-accent-secondary)" />
                  <stop offset="100%" stopColor="var(--hybrid-accent-primary)" />
                </linearGradient>
              </defs>
            </svg>
            </motion.div>

            {/* Item card au centre - couche 2 (milieu) */}
            <AnimatePresence mode="wait">
              {phase === 'spinning' && (
                <motion.div
                  key="spinning"
                  initial={{ scale: 0, rotateY: 0 }}
                  animate={{
                    scale: [0.8, 1.15, 1.05, 1],
                    rotateY: [0, 360, 720],
                    y: [0, -20, 0, -15, 0, -8, 0]
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 3, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: 10 }}
                >
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      className="w-72 h-72 sm:w-80 sm:h-80 rounded-full blur-[100px]"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.4, 0.7, 0.4]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ backgroundColor: 'var(--hybrid-accent-primary)' }}
                    />
                  </motion.div>

                  {/* Item card */}
                  <motion.div
                    className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-4 flex items-center justify-center overflow-hidden backdrop-blur-sm"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      borderColor: 'var(--hybrid-accent-primary)',
                      boxShadow: '0 0 80px rgba(var(--hybrid-accent-primary-rgb), 0.6)',
                      willChange: 'transform'
                    }}
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-44 h-44 sm:w-52 sm:h-52 object-contain drop-shadow-2xl"
                    />
                  </motion.div>

                  {/* Orbiting particles with trails */}
                  {particles.slice(0, 12).map((particle, i) => (
                    <motion.div
                      key={particle.id}
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                      style={{
                        backgroundColor: i % 2 === 0 ? 'var(--hybrid-accent-primary)' : 'var(--hybrid-accent-secondary)',
                        left: '50%',
                        top: '50%',
                        filter: 'blur(1px)',
                        boxShadow: `0 0 10px ${i % 2 === 0 ? 'var(--hybrid-accent-primary)' : 'var(--hybrid-accent-secondary)'}`
                      }}
                      animate={{
                        x: [0, Math.cos(i * Math.PI / 6) * 160, 0],
                        y: [0, Math.sin(i * Math.PI / 6) * 160, 0],
                        scale: [0, 1.5, 1, 0],
                        opacity: [0, 1, 0.8, 0]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: 'easeInOut'
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {phase === 'result' && result === 'success' && (
                <motion.div
                  key="success"
                  initial={{ scale: 0, rotateZ: -180 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    rotateZ: [-180, 10, -10, 0]
                  }}
                  transition={{
                    scale: { duration: 0.6, ease: 'easeOut' },
                    rotateZ: { duration: 0.6, ease: 'easeInOut' }
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: 10 }}
                >
                  {/* Success explosion particles */}
                  {particles.map((particle) => (
                    <motion.div
                      key={particle.id}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: particle.id % 3 === 0 ? 'var(--hybrid-accent-primary)' : particle.id % 3 === 1 ? 'var(--hybrid-accent-secondary)' : '#FFD700',
                        left: '50%',
                        top: '50%'
                      }}
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        x: particle.x * 4,
                        y: particle.y * 4,
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ duration: 1.5, delay: particle.delay }}
                    />
                  ))}

                  {/* Success card with enhanced design */}
                  <motion.div
                    className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl border-4 flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderColor: 'var(--hybrid-accent-primary)',
                      boxShadow: '0 0 100px rgba(var(--hybrid-accent-primary-rgb), 0.7)'
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 100px rgba(var(--hybrid-accent-primary-rgb), 0.7)',
                        '0 0 120px rgba(var(--hybrid-accent-primary-rgb), 0.9)',
                        '0 0 100px rgba(var(--hybrid-accent-primary-rgb), 0.7)'
                      ]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {/* Shine overlay effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />

                    {/* Success icon with glow */}
                    <motion.div
                      initial={{ scale: 0, rotateZ: -180 }}
                      animate={{ scale: 1, rotateZ: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="mb-6 relative"
                    >
                      {/* Glow effect behind icon */}
                      <motion.div
                        className="absolute inset-0 rounded-full blur-2xl"
                        style={{
                          background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                        }}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.6, 0.9, 0.6]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <div className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
                        style={{
                          background: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                        }}
                      >
                        <TrendingUp className="w-10 h-10 text-white" strokeWidth={3} />
                      </div>
                    </motion.div>

                    <motion.img
                      src={item.image_url}
                      alt={item.name}
                      className="w-40 h-40 sm:w-48 sm:h-48 object-contain mb-6 drop-shadow-2xl"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center px-4"
                    >
                      <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text mb-2"
                        style={{
                          backgroundImage: `linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                        }}
                      >
                        UPGRADE RÉUSSI !
                      </p>
                      <motion.p
                        className="text-2xl font-bold"
                        style={{ color: 'var(--hybrid-accent-primary)' }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        x{multiplier.toFixed(1)}
                      </motion.p>
                    </motion.div>
                  </motion.div>

                  {/* Confetti effect */}
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={`confetti-${i}`}
                      className="absolute w-2 h-2 md:w-3 md:h-3"
                      style={{
                        backgroundColor: i % 3 === 0 ? 'var(--hybrid-accent-primary)' : i % 3 === 1 ? 'var(--hybrid-accent-secondary)' : '#FFD700',
                        left: '50%',
                        top: '20%',
                        borderRadius: i % 2 === 0 ? '50%' : '0%'
                      }}
                      initial={{ scale: 0, x: 0, y: 0, rotateZ: 0 }}
                      animate={{
                        y: [0, 600],
                        x: (Math.random() - 0.5) * 600,
                        rotateZ: Math.random() * 720,
                        opacity: [1, 1, 0],
                        scale: [0, 1, 1]
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        delay: Math.random() * 0.5,
                        ease: 'easeOut'
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {phase === 'result' && result === 'fail' && (
                <motion.div
                  key="fail"
                  initial={{ scale: 1, x: 0 }}
                  animate={{
                    scale: 1,
                    x: [0, -10, 10, -10, 10, -5, 5, 0],
                  }}
                  transition={{
                    x: { duration: 0.5, ease: 'easeInOut' }
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: 10 }}
                >
                  {/* Fail explosion */}
                  {particles.map((particle) => (
                    <motion.div
                      key={particle.id}
                      className="absolute w-2 h-2"
                      style={{
                        backgroundColor: particle.id % 2 === 0 ? '#EF4444' : '#991B1B',
                        left: '50%',
                        top: '50%',
                        borderRadius: particle.id % 3 === 0 ? '50%' : '0%'
                      }}
                      initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: particle.x * 3,
                        y: particle.y * 3,
                        scale: [1, 0],
                        opacity: [1, 0],
                        rotateZ: Math.random() * 360
                      }}
                      transition={{ duration: 1, delay: particle.delay * 0.3 }}
                    />
                  ))}

                  {/* Item shattering effect */}
                  <motion.div
                    className="relative w-72 h-72 sm:w-80 sm:h-80"
                    initial={{ scale: 1, rotateZ: 0 }}
                    animate={{
                      scale: [1, 1.1, 0],
                      rotateZ: [0, 5, -5, 0],
                      opacity: [1, 1, 0]
                    }}
                    transition={{ duration: 1 }}
                  >
                    <motion.div
                      className="w-full h-full rounded-3xl border-4 flex flex-col items-center justify-center backdrop-blur-sm"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        borderColor: '#EF4444',
                        boxShadow: '0 0 80px rgba(239, 68, 68, 0.6)'
                      }}
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain opacity-40 drop-shadow-2xl"
                      />
                    </motion.div>
                  </motion.div>

                  {/* Fail message appears */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-center px-4">
                      {/* Icon with glow */}
                      <motion.div
                        className="relative inline-block mb-6"
                      >
                        {/* Glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full blur-2xl bg-gradient-to-br from-red-600 to-red-900"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.6, 0.9, 0.6]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-2xl">
                          <X className="w-10 h-10 text-white" strokeWidth={4} />
                        </div>
                      </motion.div>

                      <motion.p
                        className="text-4xl sm:text-5xl font-black text-red-500 mb-3"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        ÉCHEC !
                      </motion.p>
                      <p className="text-lg text-gray-400">
                        Votre item a été perdu
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats display - directement sous l'item */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: phase === 'spinning' ? 1 : 0,
                y: phase === 'spinning' ? 0 : 20,
                scale: phase === 'spinning' ? [1, 1.02, 1] : 1
              }}
              transition={{
                opacity: { duration: 0.3 },
                y: { duration: 0.3 },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="absolute top-[360px] left-1/2 -translate-x-1/2 w-full max-w-md px-4"
              style={{ zIndex: 20 }}
            >
              <motion.div
                className="relative rounded-2xl border-2 overflow-hidden backdrop-blur-2xl"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  borderColor: 'rgba(var(--hybrid-accent-primary-rgb), 0.5)'
                }}
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(var(--hybrid-accent-primary-rgb), 0.3)',
                    '0 0 40px rgba(var(--hybrid-accent-primary-rgb), 0.5)',
                    '0 0 30px rgba(var(--hybrid-accent-primary-rgb), 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Animated shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />

                <div className="relative z-10 grid grid-cols-2 divide-x divide-white/10">
                  {/* Multiplicateur */}
                  <div className="px-6 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Multiplicateur</p>
                    <motion.div
                      className="flex items-baseline gap-1"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="text-3xl font-black text-white">x{multiplier.toFixed(1)}</span>
                    </motion.div>
                  </div>

                  {/* Chances de succès */}
                  <div className="px-6 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Chances</p>
                    <motion.div
                      className="flex items-baseline gap-1"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                    >
                      <span className="text-3xl font-black" style={{ color: 'var(--hybrid-accent-primary)' }}>
                        {successRate.toFixed(1)}%
                      </span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
