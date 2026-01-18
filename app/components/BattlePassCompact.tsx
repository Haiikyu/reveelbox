'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, ChevronDown, ChevronUp, Sparkles, Star, Award, Package } from 'lucide-react'
import Link from 'next/link'

export default function BattlePassCompact() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full"
    >
      {/* Version compacte */}
      <motion.div
        animate={{ height: isExpanded ? 'auto' : '80px' }}
        className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl border-2 border-[#4578be]/50 overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(69, 120, 190, 0.3)'
        }}
      >
        {/* Particules animées */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#4578be] rounded-full opacity-40"
              animate={{
                x: [Math.random() * 300, Math.random() * 300],
                y: [Math.random() * 200, Math.random() * 200],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Header compact toujours visible */}
        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#4578be] to-[#5989d8] p-2 rounded-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4578be] via-[#5588ce] to-[#6598de]">
                BATTLE PASS
              </h3>
              <p className="text-gray-400 text-xs">21.99€ • Saison 1</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#4578be]/20 text-[#4578be] px-3 py-1 rounded-full text-xs font-bold">
              EXCLUSIF
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-[#4578be]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#4578be]" />
              )}
            </button>
          </div>
        </div>

        {/* Contenu détaillé (visible quand expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative px-4 pb-4"
            >
              {/* Avantages */}
              <div className="space-y-2 mb-4 bg-black/20 rounded-xl p-3">
                {[
                  { icon: <Star className="h-3 w-3" />, text: 'Pseudo en dégradé OR (Jour 1)' },
                  { icon: <Package className="h-3 w-3" />, text: 'Cadres & bannières rares' },
                  { icon: <Award className="h-3 w-3" />, text: 'Pins légendaires' },
                  { icon: <Sparkles className="h-3 w-3" />, text: 'Cases mystère spéciales' },
                  { icon: <Crown className="h-3 w-3" />, text: "Jusqu'à 10,000 coins" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white text-xs">
                    <div className="text-[#4578be]">{item.icon}</div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Bouton */}
              <Link href="/shop">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white py-2.5 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-[#4578be]/50 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Acheter le Pass
                </motion.button>
              </Link>

              {/* Info */}
              <div className="mt-3 p-2 bg-[#4578be]/10 rounded-lg border border-[#4578be]/30">
                <p className="text-[#4578be] text-xs text-center">
                  ⚡ Nouvelle récompense chaque jour !
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4578be]/10 to-transparent pointer-events-none"
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
      </motion.div>
    </motion.div>
  )
}