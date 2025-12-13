// StatsSection.tsx - Section de statistiques animées

'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Package, Users, Trophy, Sparkles } from 'lucide-react'

const stats = [
  {
    icon: Package,
    value: 50000,
    suffix: '+',
    label: 'Boxes ouvertes',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Users,
    value: 10000,
    suffix: '+',
    label: 'Joueurs actifs',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Trophy,
    value: 5000,
    suffix: '+',
    label: 'Objets gagnés',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Sparkles,
    value: 98,
    suffix: '%',
    label: 'Satisfaction',
    color: 'from-green-500 to-emerald-500'
  }
]

// Hook pour animer un nombre
function useCountUp(end: number, duration: number = 2000, shouldStart: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!shouldStart) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeProgress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, shouldStart])

  return count
}

interface StatCardProps {
  stat: typeof stats[0]
  index: number
  inView: boolean
}

const StatCard = ({ stat, index, inView }: StatCardProps) => {
  const count = useCountUp(stat.value, 2000, inView)
  const Icon = stat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="relative group"
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl`}
      />

      {/* Card */}
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative bg-white/5 dark:bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Icon avec animation */}
        <motion.div
          className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </motion.div>

        {/* Number */}
        <div className="relative">
          <motion.div
            className="text-3xl md:text-5xl font-black mb-2"
            style={{
              background: `linear-gradient(to right, var(--tw-gradient-stops))`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            <span className={`bg-gradient-to-r ${stat.color} bg-clip-text`}>
              {count.toLocaleString()}{stat.suffix}
            </span>
          </motion.div>
          <p className="text-sm md:text-base text-gray-400 dark:text-gray-400 font-medium">
            {stat.label}
          </p>
        </div>

        {/* Animated line */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
          style={{ transformOrigin: 'left' }}
        />
      </motion.div>
    </motion.div>
  )
}

const StatsSection = () => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 bg-gray-50 dark:bg-gray-950 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            La communauté{' '}
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ReveelBox
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Rejoignez des milliers de joueurs qui ont déjà découvert la magie de nos loot boxes
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
