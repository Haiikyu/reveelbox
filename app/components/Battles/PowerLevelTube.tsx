'use client'

import { motion } from 'framer-motion'

interface PowerLevelTubeProps {
  value: number
  maxValue?: number
}

export default function PowerLevelTube({ value, maxValue = 1000 }: PowerLevelTubeProps) {
  // Calcul du pourcentage de remplissage
  const percentage = Math.min((value / maxValue) * 100, 100)

  // Détermination du niveau et de la couleur
  const getLevel = () => {
    if (value === 0) return { name: 'NONE', color: '#94a3b8', gradient: 'from-slate-400 to-slate-500' }
    if (value < 100) return { name: 'WEAK', color: '#22c55e', gradient: 'from-green-400 to-green-600' }
    if (value < 300) return { name: 'MEDIUM', color: '#3b82f6', gradient: 'from-blue-400 to-blue-600' }
    if (value < 500) return { name: 'STRONG', color: '#a855f7', gradient: 'from-purple-400 to-purple-600' }
    if (value < 800) return { name: 'EXTREME', color: '#f97316', gradient: 'from-orange-400 to-orange-600' }
    return { name: 'LEGENDARY', color: '#eab308', gradient: 'from-yellow-400 to-yellow-600' }
  }

  const level = getLevel()
  const powerScore = Math.floor(value / 10)

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-gray-200/60">
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span>Power Level</span>
        </h3>
      </div>

      {/* Power score display */}
      <div className="mb-4 text-center">
        <motion.div
          key={powerScore}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl border-2 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${level.color}15, ${level.color}25)`,
            borderColor: `${level.color}40`,
            boxShadow: `0 4px 16px ${level.color}20`,
          }}
        >
          <div className="text-2xl font-black" style={{ color: level.color }}>
            {powerScore}
          </div>
        </motion.div>
        <div className="mt-2 text-xs font-bold tracking-wide" style={{ color: level.color }}>
          {level.name}
        </div>
      </div>

      {/* Chemistry tube */}
      <div className="relative mx-auto" style={{ width: '120px', height: '280px' }}>
        {/* Tube cap (top) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg border-2 border-gray-400 shadow-md z-10" />

        {/* Main tube container */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-[260px] bg-white/80 rounded-b-3xl border-2 border-gray-300 shadow-lg overflow-hidden backdrop-blur-sm">
          {/* Glass reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ left: '-20%', width: '40%' }} />

          {/* Measurement marks */}
          <div className="absolute inset-0 flex flex-col justify-around py-6 px-2">
            {[100, 75, 50, 25, 0].map((mark, index) => (
              <div key={mark} className="relative">
                <div className="absolute right-0 w-2 h-px bg-gray-400/50" />
                <div className="absolute right-3 text-[8px] font-medium text-gray-500">
                  {Math.floor((mark / 100) * maxValue)}
                </div>
              </div>
            ))}
          </div>

          {/* Liquid fill */}
          <motion.div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${level.gradient} rounded-b-3xl`}
            initial={{ height: 0 }}
            animate={{ height: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Liquid shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            {/* Bubbles */}
            {value > 0 && [1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-white/60 rounded-full"
                style={{
                  left: `${20 + (i * 15)}%`,
                  bottom: '5%',
                }}
                animate={{
                  y: [0, -200],
                  opacity: [0.6, 0],
                  scale: [0.5, 1.2],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Glow effect at liquid surface */}
            {percentage > 0 && (
              <div
                className="absolute top-0 left-0 right-0 h-2 blur-sm"
                style={{
                  background: `linear-gradient(to bottom, ${level.color}, transparent)`,
                }}
              />
            )}
          </motion.div>

          {/* Inner shadow for depth */}
          <div className="absolute inset-0 rounded-b-3xl shadow-inner pointer-events-none" style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }} />
        </div>

        {/* Tube base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gradient-to-b from-gray-400 to-gray-500 rounded-lg border-2 border-gray-400 shadow-md z-10" />

        {/* Floating particles around the tube */}
        {value > 100 && [1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: level.color,
              left: i % 2 === 0 ? '10%' : '85%',
              top: '50%',
              boxShadow: `0 0 8px ${level.color}`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.4, 1, 0.4],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Level indicator */}
      <div className="mt-4 text-center">
        <div className="text-[10px] font-semibold text-gray-500 mb-1">FILLING</div>
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${level.gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="text-xs font-bold text-gray-600">{percentage.toFixed(0)}%</div>
        </div>
      </div>

      {/* Info text */}
      <div className="mt-3 text-center text-[10px] text-gray-500 leading-relaxed">
        {value === 0 ? 'Add boxes to power up!' : `Battle power: ${value.toFixed(0)} coins`}
      </div>
    </div>
  )
}
