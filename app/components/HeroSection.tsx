'use client'

import { motion } from 'framer-motion'
import HeroBoxesShowcase from './HeroBoxesShowcase'
import { LootBoxItem } from './CarouselItem'

interface HeroSectionProps {
  boxes: LootBoxItem[]
}

const HeroSection = ({ boxes }: HeroSectionProps) => {

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      {/* Arrière-plan neutre */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />

      {/* Contenu principal */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 md:px-12 pb-96 md:pb-[28rem]">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          {/* Titre principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight">
              <span className="text-white">Ouvrez des Boxes</span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Exceptionnelles
              </span>
            </h1>
          </motion.div>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Découvrez des objets réels d'exception dans nos boxes mystère
          </motion.p>

          {/* Boutons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            {/* Bouton principal */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30"
            >
              Essayez Maintenant
            </motion.button>

            {/* Bouton secondaire */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-6 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Features badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-8"
          >
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <span className="text-xl">🎁</span>
              <span className="text-white text-sm font-medium">3 Boxes Gratuites</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <span className="text-xl">💰</span>
              <span className="text-white text-sm font-medium">Bonus +5%</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <span className="text-xl">⚡</span>
              <span className="text-white text-sm font-medium">Livraison Rapide</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CAROUSEL EN BAS */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 md:pb-12">
        <HeroBoxesShowcase boxes={boxes} />
      </div>
    </div>
  )
}

export default HeroSection
