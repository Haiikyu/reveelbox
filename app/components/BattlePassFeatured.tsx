'use client'

import { motion } from 'framer-motion'
import { Crown, ArrowRight, Sparkles, Star, Award, Package } from 'lucide-react'
import Link from 'next/link'

export default function BattlePassFeatured() {
  return (
    <Link href="/shop">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative h-full bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-[#4578be]/50 overflow-hidden cursor-pointer group"
        style={{
          boxShadow: '0 0 40px rgba(69, 120, 190, 0.4)'
        }}
      >
        {/* Particules animées BLEUES */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#4578be] rounded-full"
              animate={{
                x: [Math.random() * 400, Math.random() * 400],
                y: [Math.random() * 600, Math.random() * 600],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-[#4578be] to-[#5989d8] p-2 rounded-xl">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4578be] via-[#5588ce] to-[#6598de]">
                  BATTLE PASS
                </h3>
                <p className="text-gray-400 text-xs">Saison 1 - 30 jours</p>
              </div>
            </div>
            <div className="bg-[#4578be]/20 text-[#4578be] px-3 py-1 rounded-full text-xs font-bold">
              EXCLUSIF
            </div>
          </div>

          {/* Prix */}
          <div className="bg-black/30 rounded-xl p-3 mb-4">
            <p className="text-gray-400 text-xs mb-1">Prix</p>
            <p className="text-3xl font-black text-white">21.99€</p>
            <p className="text-[#4578be] text-xs mt-1">Paiement unique • Argent réel</p>
          </div>

          {/* Avantages */}
          <div className="space-y-2 mb-4">
            {[
              { icon: <Star className="h-4 w-4" />, text: 'Pseudo en dégradé OR (Jour 1)' },
              { icon: <Package className="h-4 w-4" />, text: 'Cadres & bannières rares' },
              { icon: <Award className="h-4 w-4" />, text: 'Pins légendaires' },
              { icon: <Sparkles className="h-4 w-4" />, text: 'Cases mystère spéciales' },
              { icon: <Crown className="h-4 w-4" />, text: 'Jusqu\'à 10,000 coins' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white text-sm">
                <div className="text-[#4578be]">{item.icon}</div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Bouton */}
          <button className="w-full bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white py-3 rounded-xl font-bold text-base hover:shadow-xl hover:shadow-[#4578be]/50 transition-all group-hover:scale-105 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            Acheter le Pass
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Info */}
          <div className="mt-3 p-2 bg-[#4578be]/10 rounded-lg border border-[#4578be]/30">
            <p className="text-[#4578be] text-xs text-center">
              ⚡ Nouvelle récompense chaque jour !
            </p>
          </div>
        </div>

        {/* Shine Effect BLEU */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4578be]/10 to-transparent"
          animate={{ x: ['-200%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />

        {/* Floating Icon */}
        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <Crown className="h-16 w-16 text-[#4578be]" />
        </div>
      </motion.div>
    </Link>
  )
}