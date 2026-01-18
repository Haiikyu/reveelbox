'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { LoadingState } from '@/app/components/ui/LoadingState'
import { LootBoxItem } from '@/app/components/CarouselItem'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import { 
  Package, 
  Sparkles, 
  TrendingUp, 
  Gift, 
  Crown, 
  Zap,
  ArrowRight,
  Star,
  Trophy,
  Coins
} from 'lucide-react'
import BattlePassCompact from '@/app/components/BattlePassCompact'
import BoxesCarousel from '@/app/components/BoxesCarousel'

// Boxes de niveau (freedrop boxes)
const LEVEL_BOXES = [
  'https://nqmcqpltrpwtxewfzdzy.supabase.co/storage/v1/object/public/boxes/FreeDrop.webp',
  'https://nqmcqpltrpwtxewfzdzy.supabase.co/storage/v1/object/public/boxes/FreeDrop.webp',
  'https://nqmcqpltrpwtxewfzdzy.supabase.co/storage/v1/object/public/boxes/FreeDrop.webp',
]

export default function HomePage() {
  const [loading, setLoading] = useState(false)
  const [particlePositions, setParticlePositions] = useState<Array<{ left: string; top: string; color: string }>>([])

  // Générer les positions des particules côté client uniquement (évite l'erreur d'hydratation)
  useEffect(() => {
    const colors = ['#4578be', '#6598de']
    const positions = [...Array(15)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      color: colors[i % 2]
    }))
    setParticlePositions(positions)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      
      {/* Fond avec cercles flous animés */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ background: '#4578be' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-15"
          style={{ background: '#6598de' }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-[120px] opacity-15"
          style={{ background: '#5588ce' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.2, 0.15]
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
      </div>

      {/* Grille de points subtile */}
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, #4578be 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Particules flottantes */}
      <div className="fixed inset-0 pointer-events-none">
        {particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: pos.color,
              left: pos.left,
              top: pos.top,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + (i * 0.2),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Hero Section ULTRA SPECTACULAIRE */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
          
          {/* Cristaux brisés en arrière-plan */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => {
              const colors = ['#4578be', '#5588ce', '#6598de', '#7ea8ee']
              const sizes = [120, 160, 200, 140, 180, 100, 150, 170, 130, 190, 110, 160]
              const rotations = [15, -20, 30, -15, 25, -30, 18, -25, 22, -18, 28, -22]
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-32 rounded-full opacity-10"
                  style={{
                    background: `linear-gradient(to bottom, ${colors[i % colors.length]}, transparent)`,
                    left: `${(i * 9) + 5}%`,
                    top: `${20 + (i * 8)}%`,
                    width: `${sizes[i]}px`,
                    height: `${sizes[i]}px`,
                    rotate: `${rotations[i]}deg`,
                    transformOrigin: 'top center',
                    opacity: 0.15,
                  }}
                  animate={{
                    rotate: [rotations[i], rotations[i] + 5, rotations[i]],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 3 + i * 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )
            })}
          </div>

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Texte Hero avec effets ULTRA */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center lg:text-left relative"
              >
                {/* Effet de lueur derrière le texte */}
                <motion.div
                  className="absolute -inset-10 rounded-full blur-3xl opacity-30"
                  style={{
                    background: 'radial-gradient(circle, #4578be, #5588ce, transparent)',
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full relative mb-6"
                  style={{
                    background: 'linear-gradient(135deg, #4578be, #5588ce, #6598de)',
                    boxShadow: '0 0 30px rgba(69, 120, 190, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                  <span className="text-sm font-black text-white drop-shadow-lg">N°1 du Unboxing en France</span>
                  
                  {/* Particules qui sortent du badge */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-white"
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{
                        x: [0, Math.cos(i * 45 * Math.PI / 180) * 50],
                        y: [0, Math.sin(i * 45 * Math.PI / 180) * 50],
                        opacity: [1, 0],
                        scale: [1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </motion.div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 relative">
                  <motion.span 
                    className="block mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff, #e0e0e0, #ffffff, #f5f5f5)',
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 40px rgba(255, 255, 255, 0.5)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                    }}
                  >
                    Ouvre des boxes
                  </motion.span>
                  <motion.span
                    className="block"
                    style={{
                      background: 'linear-gradient(135deg, #4578be, #5588ce, #6598de, #7ea8ee)',
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 60px rgba(69, 120, 190, 0.8)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                    }}
                  >
                    et gagne gros
                  </motion.span>
                </h1>

                <motion.p
                  className="text-xl text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    textShadow: '0 0 10px rgba(69, 120, 190, 0.3)',
                  }}
                >
                  Découvre nos boxes exclusives remplies d'objets de luxe, de high-tech et de surprises incroyables !
                </motion.p>

                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link href="/boxes">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-8 py-4 rounded-2xl text-white font-bold text-lg overflow-hidden group"
                      style={{
                        background: 'linear-gradient(135deg, #4578be 0%, #5588ce 50%, #6598de 100%)',
                        boxShadow: '0 10px 40px rgba(69, 120, 190, 0.6), 0 0 60px rgba(69, 120, 190, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {/* Effet de brillance qui traverse */}
                      <motion.div
                        className="absolute inset-0 w-1/2"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                        }}
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      />
                      
                      <span className="relative z-10 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Ouvrir une Box
                        <ArrowRight className="w-5 h-5" />
                      </span>

                      {/* Particules qui s'échappent du bouton */}
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 rounded-full bg-white"
                          style={{
                            left: '50%',
                            top: '50%',
                          }}
                          animate={{
                            x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
                            y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
                            opacity: [1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </motion.button>
                  </Link>

                  <Link href="/games">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-8 py-4 rounded-2xl font-bold text-lg text-white overflow-hidden"
                      style={{
                        background: 'rgba(69, 120, 190, 0.1)',
                        border: '2px solid #4578be',
                        boxShadow: '0 0 20px rgba(69, 120, 190, 0.3), inset 0 0 20px rgba(69, 120, 190, 0.1)',
                      }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(135deg, transparent, rgba(69, 120, 190, 0.3), transparent)',
                        }}
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                        }}
                      />
                      <span className="relative z-10">Découvrir les Jeux</span>
                    </motion.button>
                  </Link>
                </div>

                {/* Stats avec effets cristallins */}
                <div className="grid grid-cols-3 gap-6 mt-12">
                  {[
                    { label: 'Niveau avec gains', value: '100+', icon: Crown, color: '#4578be' },
                    { label: 'Boxes à découvrir', value: '100+', icon: Package, color: '#5588ce' },
                    { label: 'Items à gagner', value: '1K', icon: Trophy, color: '#6598de' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="text-center relative group"
                    >
                      <motion.div 
                        className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity"
                        style={{
                          background: `radial-gradient(circle, ${stat.color}, transparent)`,
                        }}
                      />
                      
                      <div className="relative p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                        style={{
                          boxShadow: `0 0 20px ${stat.color}20`,
                        }}
                      >
                        <motion.div 
                          className="flex justify-center mb-2"
                          animate={{
                            y: [0, -5, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        >
                          <div 
                            className="p-2 rounded-xl"
                            style={{
                              background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)`,
                              boxShadow: `0 0 20px ${stat.color}`,
                            }}
                          >
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                        </motion.div>
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* BATTLE PASS FEATURED - REMPLACE LES OBJETS TOURNANTS ! */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative space-y-8 hidden lg:block"
              >
                <BattlePassCompact />
                
                {/* Carousel des Boxes */}
                <BoxesCarousel />
              </motion.div>

            </div>
          </div>
        </section>


        {/* Section Système de Niveaux */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
          {/* Fond spécial pour cette section */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#4578be]/5 to-transparent" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4578be]/20 border border-[#4578be]/30 mb-6">
                <TrendingUp className="w-4 h-4 text-[#4578be]" />
                <span className="text-sm font-bold text-[#4578be]">Système de Progression</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                  Monte de Niveau
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#4578be] via-[#5588ce] to-[#6598de] bg-clip-text text-transparent">
                  Gagne des Boxes Gratuites
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Plus tu joues, plus tu montes de niveau et accèdes à des boxes gratuites quotidiennes exclusives !
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {LEVEL_BOXES.map((box, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  className="relative"
                >
                  <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl bg-gradient-to-br from-[#4578be]/20 to-[#5588ce]/10 border-2 border-[#4578be]/30 p-8 shadow-2xl">
                    
                    {/* Badge niveau */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="text-xs font-bold px-3 py-1.5 bg-[#4578be] text-white rounded-full shadow-lg">
                        Niveau {(index + 1) * 10}
                      </span>
                    </div>

                    {/* Image */}
                    <div className="relative h-48 mb-6 flex items-center justify-center">
                      <motion.img
                        src={box}
                        alt={`Box Niveau ${(index + 1) * 10}`}
                        className="w-full h-full object-contain"
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 3 + index,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />

                      {/* Effet de lueur */}
                      <motion.div
                        className="absolute inset-0 rounded-full blur-3xl opacity-30"
                        style={{ background: '#4578be' }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      />
                    </div>

                    {/* Titre */}
                    <h3 className="text-2xl font-black text-white text-center mb-2">
                      Box Niveau {(index + 1) * 10}
                    </h3>
                    <p className="text-sm text-gray-400 text-center mb-4">
                      Débloque cette box gratuite en atteignant le niveau {(index + 1) * 10}
                    </p>

                    {/* Badge gratuit */}
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold text-sm">
                        <Gift className="w-4 h-4" />
                        Gratuit quotidien
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Call to action */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link href="/boxes">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl flex items-center gap-2 mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, #4578be 0%, #5588ce 100%)',
                    boxShadow: '0 10px 40px rgba(69, 120, 190, 0.5)'
                  }}
                >
                  <Zap className="w-5 h-5" />
                  Commencer à Jouer
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Section Features */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Package,
                  title: 'Boxes Exclusives',
                  description: 'Des centaines de boxes avec des items de luxe et high-tech',
                  gradient: 'from-[#4578be] to-[#5588ce]'
                },
                {
                  icon: Trophy,
                  title: 'Gagnant Garanti',
                  description: 'Chaque box contient des items de valeur, tu gagnes à tous les coups',
                  gradient: 'from-amber-500 to-orange-500'
                },
                {
                  icon: Zap,
                  title: 'Instantané',
                  description: 'Ouverture instantanée et récupération immédiate de tes gains',
                  gradient: 'from-green-500 to-emerald-500'
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="relative rounded-2xl overflow-hidden backdrop-blur-xl bg-[#0f1623]/80 border border-white/[0.08] p-8 transition-all hover:border-[#4578be]/50 hover:shadow-2xl hover:shadow-[#4578be]/20"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}