'use client'

import { motion } from 'framer-motion'

type Player = {
  id: string | number
  avatarUrl: string
  position: number
}

interface SidebarLeaderboardProps {
  players: Player[]
  tubeValue: number // 0-100
  width?: number
  className?: string
}

export default function SidebarLeaderboard({
  players,
  tubeValue,
  width = 350,
  className = '',
}: SidebarLeaderboardProps) {
  const topPlayers = players.slice(0, 10)

  const getPowerColor = (value: number) => {
    if (value < 20) return {
      primary: '#3b82f6',
      secondary: '#1e40af',
      name: 'LOW',
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      glow: '0 0 60px rgba(59, 130, 246, 0.6)'
    }
    if (value < 40) return {
      primary: '#10b981',
      secondary: '#047857',
      name: 'MEDIUM',
      gradient: 'from-green-500 via-teal-600 to-teal-700',
      glow: '0 0 60px rgba(16, 185, 129, 0.6)'
    }
    if (value < 60) return {
      primary: '#f59e0b',
      secondary: '#d97706',
      name: 'STRONG',
      gradient: 'from-amber-500 via-amber-600 to-amber-700',
      glow: '0 0 60px rgba(245, 158, 11, 0.6)'
    }
    if (value < 80) return {
      primary: '#ef4444',
      secondary: '#b91c1c',
      name: 'EXTREME',
      gradient: 'from-red-500 via-red-600 to-red-700',
      glow: '0 0 60px rgba(239, 68, 68, 0.6)'
    }
    return {
      primary: '#a855f7',
      secondary: '#7e22ce',
      name: 'LEGEND',
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      glow: '0 0 60px rgba(168, 85, 247, 0.6)'
    }
  }

  const power = getPowerColor(tubeValue)
  const fillHeight = Math.max(2, Math.min(100, tubeValue))

  const getRankColor = (pos: number) => {
    if (pos === 1) return {
      bg: 'from-yellow-400 to-amber-600',
      glow: 'shadow-[0_0_15px_rgba(251,191,36,0.5)]',
      icon: '👑'
    }
    if (pos === 2) return {
      bg: 'from-slate-300 to-slate-500',
      glow: 'shadow-[0_0_12px_rgba(203,213,225,0.4)]',
      icon: '🥈'
    }
    if (pos === 3) return {
      bg: 'from-orange-400 to-orange-600',
      glow: 'shadow-[0_0_12px_rgba(251,146,60,0.4)]',
      icon: '🥉'
    }
    return {
      bg: 'from-slate-600 to-slate-800',
      glow: '',
      icon: ''
    }
  }

  return (
    <div
      className={`h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-white/10 ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* LEADERBOARD MINIMALISTE - Gauche (ultra compact) */}
      <div className="w-[80px] flex flex-col border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Header ultra compact */}
        <div className="p-2.5 border-b border-white/5 flex justify-center">
          <motion.div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-base">🏆</span>
          </motion.div>
        </div>

        {/* Liste verticale ultra minimaliste */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-2.5 scrollbar-none">
          {topPlayers.map((player, idx) => {
            const style = getRankColor(player.position)

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.7, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{
                  delay: idx * 0.04,
                  type: "spring",
                  stiffness: 250,
                  damping: 18
                }}
                whileHover={{ scale: 1.08, y: -3 }}
                className="relative group cursor-pointer"
              >
                {/* Avatar avec badge overlay */}
                <div className="relative">
                  {/* Avatar */}
                  <div className="w-[60px] h-[60px] rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-white/30 transition-all duration-300 shadow-xl">
                    <img
                      src={player.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Badge rank overlay */}
                  <motion.div
                    className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-gradient-to-br ${style.bg} flex items-center justify-center shadow-xl ${style.glow} border-2 border-slate-950`}
                    whileHover={{ rotate: [0, -12, 12, -12, 0], scale: 1.25 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-[11px] font-black text-white drop-shadow-md">
                      {player.position}
                    </span>
                  </motion.div>

                  {/* Icon pour top 3 */}
                  {player.position <= 3 && (
                    <motion.div
                      className="absolute -top-1.5 -right-1.5 text-sm"
                      animate={{
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.15, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {style.icon}
                    </motion.div>
                  )}

                  {/* Status online */}
                  <motion.div
                    className="absolute -top-0.5 -left-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950 shadow-lg"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  {/* Glow effet au hover */}
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${power.primary}50, transparent 70%)`,
                      filter: 'blur(10px)'
                    }}
                  />

                  {/* Pulse effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100"
                    style={{ borderColor: power.primary }}
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0, 0.6, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* BATTLE POWER - Droite (plus grand) */}
      <div className="flex-1 flex flex-col items-center justify-between py-6 px-8 relative overflow-hidden">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-white/10 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-white/10 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-white/10 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-white/10 rounded-br-lg" />

        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Geometric lines background */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        />

        {/* Scanlines effect */}
        <motion.div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.5) 50%)',
            backgroundSize: '100% 4px'
          }}
          animate={{ y: [0, -4] }}
          transition={{ duration: 0.1, repeat: Infinity, ease: "linear" }}
        />

        {/* Floating level badges */}
        {fillHeight >= 20 && (
          <motion.div
            className="absolute top-20 left-4 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-[10px] font-black text-blue-400">LOW</span>
          </motion.div>
        )}
        {fillHeight >= 40 && (
          <motion.div
            className="absolute top-40 right-4 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 backdrop-blur-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-[10px] font-black text-green-400">MID</span>
          </motion.div>
        )}
        {fillHeight >= 60 && (
          <motion.div
            className="absolute top-1/2 left-4 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 backdrop-blur-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-[10px] font-black text-amber-400">HIGH</span>
          </motion.div>
        )}
        {fillHeight >= 80 && (
          <motion.div
            className="absolute bottom-40 right-4 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 backdrop-blur-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <span className="text-[10px] font-black text-red-400">EXTREME</span>
          </motion.div>
        )}

        {/* Header badge amélioré */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <motion.div
            className="relative inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
            whileHover={{ scale: 1.05 }}
          >
            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(90deg, transparent, ${power.primary}40, transparent)`,
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 relative z-10"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[11px] font-black text-white/70 tracking-[0.2em] relative z-10">
              BATTLE POWER
            </span>
          </motion.div>
        </motion.div>

        {/* Tube à essai MASSIF */}
        <div className="relative flex-1 w-full max-w-[110px] flex items-center justify-center my-4">
          <div className="relative w-full h-full">
            {/* Mega glow pulsant */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-full"
              style={{
                background: `radial-gradient(circle at center, ${power.primary}, transparent 60%)`,
                filter: 'blur(60px)'
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.8, 1.3, 0.8]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Cercles concentriques pulsants */}
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border"
                style={{
                  borderColor: power.primary,
                  borderWidth: '1px',
                  opacity: 0.15
                }}
                animate={{
                  scale: [0.8 + i * 0.1, 2 + i * 0.2, 0.8 + i * 0.1],
                  opacity: [0.4, 0, 0.4]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeInOut"
                }}
              />
            ))}

            {/* Rayons lumineux rotatifs */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ray-${i}`}
                className="absolute left-1/2 top-1/2 w-1 -translate-x-1/2 -translate-y-1/2"
                style={{
                  height: '120%',
                  background: `linear-gradient(to bottom, transparent, ${power.primary}40, transparent)`,
                  filter: 'blur(2px)',
                  transformOrigin: 'center center'
                }}
                animate={{
                  rotate: [i * 120, i * 120 + 360],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}

            {/* Scan vertical */}
            <motion.div
              className="absolute left-0 right-0 h-20 blur-sm"
              style={{
                background: `linear-gradient(to bottom, transparent, ${power.primary}60, ${power.primary}30, transparent)`,
              }}
              animate={{
                y: ['-10%', '110%'],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            <svg
              viewBox="0 0 120 850"
              className="w-full h-full relative z-10"
              style={{ filter: 'drop-shadow(0 25px 60px rgba(0, 0, 0, 0.6))' }}
            >
              <defs>
                {/* Gradient liquide enrichi */}
                <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={power.primary} stopOpacity="1" />
                  <stop offset="40%" stopColor={power.primary} stopOpacity="0.98" />
                  <stop offset="70%" stopColor={power.secondary} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={power.secondary} stopOpacity="0.9" />
                </linearGradient>

                {/* Glass multi-layer */}
                <linearGradient id="glass1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="30%" stopColor="rgba(255,255,255,0.5)" />
                  <stop offset="70%" stopColor="rgba(255,255,255,0.5)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>

                {/* Animated shimmer */}
                <linearGradient id="shimmer" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>

                {/* Advanced glow */}
                <filter id="advancedGlow">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feColorMatrix in="coloredBlur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.5 0"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* Clip path */}
                <clipPath id="tubeClip">
                  <path d="M 35 15 L 35 800 Q 35 835 60 835 Q 85 835 85 800 L 85 15 Z" />
                </clipPath>
              </defs>

              {/* Corps du tube */}
              <path
                d="M 35 15 L 35 800 Q 35 835 60 835 Q 85 835 85 800 L 85 15 Z"
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
              />

              {/* Base arrondie */}
              <ellipse
                cx="60"
                cy="835"
                rx="25"
                ry="30"
                fill="rgba(255,255,255,0.02)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
              />

              {/* Liquide principal */}
              <motion.g
                clipPath="url(#tubeClip)"
                initial={{ y: 850 }}
                animate={{ y: 850 - (fillHeight / 100) * 820 }}
                transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <rect
                  x="35"
                  y="15"
                  width="50"
                  height="820"
                  fill="url(#liquidGrad)"
                  filter="url(#advancedGlow)"
                />
                <ellipse
                  cx="60"
                  cy="835"
                  rx="25"
                  ry="30"
                  fill="url(#liquidGrad)"
                  filter="url(#advancedGlow)"
                />

                {/* Surface liquide avec ondulations */}
                <motion.ellipse
                  cx="60"
                  cy="15"
                  rx="25"
                  ry="4"
                  fill={power.primary}
                  animate={{
                    ry: [4, 7, 4],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />

                {/* Vagues secondaires */}
                <motion.ellipse
                  cx="60"
                  cy="15"
                  rx="20"
                  ry="2.5"
                  fill="rgba(255,255,255,0.4)"
                  animate={{
                    ry: [2.5, 4.5, 2.5],
                    rx: [20, 23, 20]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />

                {/* Vague tertiaire */}
                <motion.ellipse
                  cx="60"
                  cy="15"
                  rx="15"
                  ry="1.5"
                  fill="rgba(255,255,255,0.2)"
                  animate={{
                    ry: [1.5, 3.5, 1.5],
                    rx: [15, 19, 15]
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
                />
              </motion.g>

              {/* Reflet principal */}
              <rect
                x="38"
                y="20"
                width="12"
                height="810"
                fill="url(#glass1)"
                opacity="0.7"
                clipPath="url(#tubeClip)"
              />

              {/* Shimmer animé descendant */}
              <motion.rect
                x="36"
                y="15"
                width="14"
                height="140"
                fill="url(#shimmer)"
                opacity="0.8"
                clipPath="url(#tubeClip)"
                animate={{ y: [15, 730, 15] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />

              {/* Graduations améliorées avec seuils de niveau */}
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((mark) => {
                const isMajor = mark % 25 === 0
                const isHalf = mark === 50
                const isThreshold = mark === 20 || mark === 40 || mark === 60 || mark === 80
                const thresholdColor = mark === 20 ? '#3b82f6' : mark === 40 ? '#10b981' : mark === 60 ? '#f59e0b' : mark === 80 ? '#ef4444' : 'rgba(255,255,255,0.5)'

                return (
                  <g key={mark}>
                    <line
                      x1="87"
                      y1={830 - (mark / 100) * 810}
                      x2={isMajor ? "98" : isThreshold ? "94" : isHalf ? "94" : "90"}
                      y2={830 - (mark / 100) * 810}
                      stroke={isThreshold ? thresholdColor : "rgba(255,255,255,0.5)"}
                      strokeWidth={isMajor ? "2" : isThreshold ? "1.8" : "1.2"}
                      opacity={isThreshold ? "0.9" : "1"}
                    />
                    {isMajor && (
                      <text
                        x="102"
                        y={833 - (mark / 100) * 810}
                        fill="rgba(255,255,255,0.7)"
                        fontSize="10"
                        fontWeight="800"
                      >
                        {mark}
                      </text>
                    )}
                    {isThreshold && fillHeight >= mark && (
                      <motion.circle
                        cx="90"
                        cy={830 - (mark / 100) * 810}
                        r="1.8"
                        fill={thresholdColor}
                        animate={{
                          r: [1.8, 3.5, 1.8],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </g>
                )
              })}

              {/* Bulles nombreuses et variées */}
              {fillHeight > 5 && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
                <motion.circle
                  key={i}
                  cx={40 + (i * 3.3)}
                  cy={830}
                  r={0.7 + (i % 5) * 0.35}
                  fill={i % 3 === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)"}
                  animate={{
                    cy: [830, 830 - (fillHeight / 100) * 810 + 20 + (i % 3) * 10],
                    opacity: [0.9, 0],
                    r: [0.7 + (i % 5) * 0.35, 1.8 + (i % 5) * 0.5],
                    cx: [40 + (i * 3.3), 40 + (i * 3.3) + (i % 2 === 0 ? 2.5 : -2.5)]
                  }}
                  transition={{
                    duration: 3 + (i * 0.12),
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeOut"
                  }}
                />
              ))}
            </svg>

            {/* Particules spiralantes */}
            {fillHeight > 20 && (
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                  const radius = 40 + (i % 3) * 10
                  const startAngle = (i * 45) % 360

                  return (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${3 + (i % 3) * 1.5}px`,
                        height: `${3 + (i % 3) * 1.5}px`,
                        background: i % 2 === 0 ? power.primary : power.secondary,
                        boxShadow: `0 0 10px ${power.primary}`,
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{
                        x: [
                          Math.cos((startAngle * Math.PI) / 180) * radius,
                          Math.cos(((startAngle + 90) * Math.PI) / 180) * radius,
                          Math.cos(((startAngle + 180) * Math.PI) / 180) * radius,
                          Math.cos(((startAngle + 270) * Math.PI) / 180) * radius,
                          Math.cos((startAngle * Math.PI) / 180) * radius,
                        ],
                        y: [
                          Math.sin((startAngle * Math.PI) / 180) * radius,
                          Math.sin(((startAngle + 90) * Math.PI) / 180) * radius - 50,
                          Math.sin(((startAngle + 180) * Math.PI) / 180) * radius - 100,
                          Math.sin(((startAngle + 270) * Math.PI) / 180) * radius - 50,
                          Math.sin((startAngle * Math.PI) / 180) * radius,
                        ],
                        opacity: [0.6, 1, 0.8, 1, 0.6],
                        scale: [1, 1.3, 1.1, 1.3, 1]
                      }}
                      transition={{
                        duration: 5 + (i * 0.3),
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  )
                })}
              </>
            )}

            {/* Lightning bolts effect pour LEGENDARY */}
            {fillHeight > 85 && (
              <>
                {[1, 2].map((i) => (
                  <motion.div
                    key={`bolt-${i}`}
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ top: '20%' }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      delay: i * 0.15
                    }}
                  >
                    <svg width="20" height="30" viewBox="0 0 20 30" fill={power.primary}>
                      <path d="M10 0 L5 15 L12 15 L7 30 L15 12 L10 12 Z" />
                    </svg>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Stats élégantes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full space-y-4 relative z-10"
        >
          {/* Valeur massive */}
          <div className="text-center">
            <motion.div
              key={Math.round(tubeValue)}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-6xl font-black tabular-nums mb-2"
              style={{
                color: power.primary,
                textShadow: power.glow,
                filter: 'drop-shadow(0 0 25px currentColor)'
              }}
            >
              {Math.round(tubeValue)}
            </motion.div>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: power.primary }} />
              <span className="text-xs font-black text-white/60 tracking-widest">
                {power.name}
              </span>
            </motion.div>
          </div>

          {/* Progress bar sophistiquée */}
          <div className="space-y-2.5">
            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 shadow-inner">
              {/* Fill */}
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${power.gradient} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${fillHeight}%` }}
                transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ boxShadow: power.glow }}
              />

              {/* Shine effect animé */}
              <motion.div
                className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ left: ['-30%', '130%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              />

              {/* Inner glow pulsant */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent, ${power.primary}50, transparent)`,
                  width: `${fillHeight}%`
                }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Threshold markers on bar */}
              {[20, 40, 60, 80].map(threshold => (
                <div
                  key={threshold}
                  className="absolute top-0 bottom-0 w-px bg-white/30"
                  style={{ left: `${threshold}%` }}
                />
              ))}
            </div>

            {/* Labels raffinés */}
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] text-white/30 font-bold tracking-wider">MIN</span>
              <motion.div
                key={Math.round(fillHeight)}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/15 backdrop-blur-sm shadow-lg"
              >
                <span className="text-sm font-black tabular-nums" style={{ color: power.primary }}>
                  {Math.round(fillHeight)}%
                </span>
              </motion.div>
              <span className="text-[10px] text-white/30 font-bold tracking-wider">MAX</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
