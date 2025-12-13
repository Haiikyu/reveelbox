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

// Images des boxes
const BOXES_IMAGES = {
  gucci: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/GUCCI%20BOX/338BE34B-2A0D-4A61-92D6-1207E78C98BA-removebg-preview.png',
  hunis: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/HUNIS%20BOX/ED6E3CE1-A33C-4E4C-BE70-66B0C1811142-removebg-preview.png',
  minecraft: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/MINECRAFT%20BOX/box_minecraft-removebg-preview.png',
  nintendo: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/SWITCH%20GAME%20BOX/92BCBDA5-FBF5-4011-9786-0DC62242726A-removebg-preview.png',
  louisVuitton: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/LOUIS%20VUITTON%20BOX/8A078A9C-3B99-4E3B-AACB-F73F821E4FB1-removebg-preview.png',
  pokemon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POKEMON%20BOX/ChatGPT_Image_7_sept._2025__17_08_33-removebg-preview.png',
}

// Images des objets
const ITEMS_IMAGES = [
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POKEMON%20BOX/2025_Pokemon_Scarlet___Violet_4-removebg-preview.png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/SWITCH%20GAME%20BOX/Nintendo_Switch_Lite_HDHSBBZAA-removebg-preview.png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/GUCCI%20BOX/Gucci_GG_Technical_Jersey_Zip_Jacket-removebg-preview.png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/GUCCI%20BOX/Gucci_GG_Supreme_Belt_Bag-removebg-preview.png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/LOUIS%20VUITTON%20BOX/Louis_Vuitton_Charm_LV-removebg-preview.png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/LOUIS%20VUITTON%20BOX/Louis_Vuitton_x_Nigo_LV_Fit_Monogram_Beanie-removebg-preview%20(1).png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/LOUIS%20VUITTON%20BOX/Louis_Vuitton_x_Takashi_Murakami_Monogram_Cherry_Socks-removebg-preview.png',
]

// Boxes de niveau
const LEVEL_BOXES = [
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/cart/Design%20sans%20titre%20(47).png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/cart/Design%20sans%20titre%20(42).png',
  'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/cart/Design%20sans%20titre%20(45).png',
]

const FEATURED_BOXES = [
  {
    id: 'gucci',
    name: 'Gucci Box',
    image: BOXES_IMAGES.gucci,
    price: 500,
    gradient: 'from-amber-500 via-yellow-600 to-amber-700',
    description: 'Items de luxe exclusifs',
    rarity: 'legendary'
  },
  {
    id: 'louis-vuitton',
    name: 'Louis Vuitton Box',
    image: BOXES_IMAGES.louisVuitton,
    price: 450,
    gradient: 'from-orange-500 via-amber-600 to-yellow-700',
    description: 'Collection premium LV',
    rarity: 'legendary'
  },
  {
    id: 'pokemon',
    name: 'Pokemon Box',
    image: BOXES_IMAGES.pokemon,
    price: 200,
    gradient: 'from-red-500 via-pink-500 to-rose-500',
    description: 'Cartes et items Pokemon',
    rarity: 'epic'
  },
  {
    id: 'nintendo',
    name: 'Nintendo Box',
    image: BOXES_IMAGES.nintendo,
    price: 300,
    gradient: 'from-[#4578be] via-blue-500 to-cyan-500',
    description: 'Consoles et jeux Switch',
    rarity: 'epic'
  },
  {
    id: 'minecraft',
    name: 'Minecraft Box',
    image: BOXES_IMAGES.minecraft,
    price: 150,
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    description: 'Goodies Minecraft',
    rarity: 'rare'
  },
  {
    id: 'hunis',
    name: 'Hunis Box',
    image: BOXES_IMAGES.hunis,
    price: 250,
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    description: 'Surprises variées',
    rarity: 'epic'
  },
]

export default function HomePage() {
  const [loading, setLoading] = useState(false)

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
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? '#4578be' : '#6598de',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
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
                  className="absolute"
                  style={{
                    width: sizes[i],
                    height: sizes[i],
                    left: `${(i * 15) % 100}%`,
                    top: `${(i * 20) % 100}%`,
                    background: `linear-gradient(135deg, ${colors[i % 4]}, transparent)`,
                    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                    opacity: 0.15,
                    filter: 'blur(1px)',
                    boxShadow: `0 0 ${30 + i * 5}px ${colors[i % 4]}`,
                  }}
                  animate={{
                    rotate: [rotations[i], rotations[i] + 10, rotations[i]],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )
            })}
          </div>

          {/* Effet de verre brisé en overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full opacity-5">
              <defs>
                <pattern id="crystalPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  <polygon points="100,0 200,76 164,200 36,200 0,76" fill="url(#crystalGradient)" opacity="0.3"/>
                  <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4578be" stopOpacity="0.5"/>
                    <stop offset="50%" stopColor="#5588ce" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#6598de" stopOpacity="0.1"/>
                  </linearGradient>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#crystalPattern)"/>
            </svg>
          </div>

          {/* Rayons de lumière colorés */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2"
                style={{
                  width: '2px',
                  height: '100vh',
                  background: `linear-gradient(to bottom, transparent, ${i % 2 === 0 ? '#4578be' : '#6598de'}, transparent)`,
                  transformOrigin: 'top center',
                  opacity: 0.15,
                }}
                animate={{
                  rotate: [i * 45, i * 45 + 5, i * 45],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 3 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
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
                  <br />
                  <motion.span 
                    className="block"
                    style={{
                      background: 'linear-gradient(135deg, #4578be, #5588ce, #6598de, #7ea8ee, #4578be)',
                      backgroundSize: '300% 300%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 20px #4578be) drop-shadow(0 0 40px #5588ce)',
                    }}
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                    }}
                  >
                    Gagne des cadeaux
                  </motion.span>

                  {/* Éclats qui explosent du texte */}
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #4578be, #6598de)',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        boxShadow: '0 0 10px #4578be',
                      }}
                      animate={{
                        y: [0, -100],
                        x: [0, (Math.random() - 0.5) * 100],
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </h1>

                <motion.p 
                  className="text-xl text-gray-400 mb-8 max-w-xl relative"
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
                    { label: 'Utilisateurs', value: '50K+', icon: Crown, color: '#4578be' },
                    { label: 'Boxes ouvertes', value: '1M+', icon: Package, color: '#5588ce' },
                    { label: 'Items gagnés', value: '10M+', icon: Trophy, color: '#6598de' },
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

              {/* Items flottants avec effet cristallin ULTRA */}
              {/* Items flottants avec effet cristallin ULTRA */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative h-[600px] hidden lg:block"
              >
                {/* Effet de prisme central */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #4578be, #5588ce, transparent)',
                    filter: 'blur(60px)',
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    rotate: [0, 180, 360],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                  }}
                />

                {ITEMS_IMAGES.slice(0, 7).map((item, i) => {
                  const positions = [
                    { top: '10%', left: '20%', rotate: -15, scale: 0.8 },
                    { top: '5%', right: '15%', rotate: 12, scale: 1 },
                    { top: '25%', left: '5%', rotate: 8, scale: 0.7 },
                    { top: '40%', right: '5%', rotate: -12, scale: 0.9 },
                    { top: '55%', left: '15%', rotate: 15, scale: 0.85 },
                    { top: '60%', right: '20%', rotate: -8, scale: 0.75 },
                    { top: '75%', left: '30%', rotate: 10, scale: 0.8 },
                  ]

                  const crystalColors = ['#4578be', '#5588ce', '#6598de', '#7ea8ee']

                  return (
                    <motion.div
                      key={i}
                      className="absolute w-32 h-32 group cursor-pointer"
                      style={positions[i]}
                      animate={{
                        y: [0, -20, 0],
                        rotate: [positions[i].rotate, positions[i].rotate + 5, positions[i].rotate],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      whileHover={{ scale: 1.2, zIndex: 50 }}
                    >
                      {/* Conteneur avec effet de verre cristallin */}
                      <div className="relative w-full h-full">
                        {/* Lueur cristalline derrière */}
                        <motion.div
                          className="absolute -inset-4 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: `radial-gradient(circle, ${crystalColors[i % 4]}, transparent)`,
                          }}
                        />

                        {/* Bordure cristalline animée */}
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${crystalColors[i % 4]}, ${crystalColors[(i + 1) % 4]})`,
                            padding: '2px',
                          }}
                          animate={{
                            rotate: [0, 360],
                          }}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <div className="w-full h-full rounded-2xl backdrop-blur-xl bg-[#0f1623]/80 p-4 relative overflow-hidden">
                            {/* Effet de reflet cristallin */}
                            <motion.div
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
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

                            {/* Image de l'item */}
                            <img src={item} alt="Item" className="w-full h-full object-contain relative z-10" />

                            {/* Particules cristallines qui orbitent */}
                            {[...Array(4)].map((_, j) => (
                              <motion.div
                                key={j}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                  background: crystalColors[j % 4],
                                  boxShadow: `0 0 10px ${crystalColors[j % 4]}`,
                                  left: '50%',
                                  top: '50%',
                                }}
                                animate={{
                                  x: [
                                    Math.cos(j * 90 * Math.PI / 180) * 60,
                                    Math.cos((j * 90 + 360) * Math.PI / 180) * 60,
                                  ],
                                  y: [
                                    Math.sin(j * 90 * Math.PI / 180) * 60,
                                    Math.sin((j * 90 + 360) * Math.PI / 180) * 60,
                                  ],
                                  opacity: [1, 0.5, 1],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  delay: j * 0.2,
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>

                        {/* Éclats de cristaux qui s'échappent */}
                        {[...Array(3)].map((_, j) => (
                          <motion.div
                            key={j}
                            className="absolute w-2 h-2"
                            style={{
                              background: crystalColors[j % 4],
                              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                              left: '50%',
                              top: '50%',
                            }}
                            animate={{
                              x: [0, (Math.random() - 0.5) * 100],
                              y: [0, -100],
                              rotate: [0, 360],
                              opacity: [0, 1, 0],
                              scale: [0, 1.5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: j * 0.3 + i * 0.1,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )
                })}

                {/* Lignes de connexion cristallines entre les items */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  {[...Array(7)].map((_, i) => (
                    <motion.line
                      key={i}
                      x1={`${(i * 15) % 100}%`}
                      y1={`${(i * 20) % 100}%`}
                      x2={`${((i + 1) * 15) % 100}%`}
                      y2={`${((i + 1) * 20) % 100}%`}
                      stroke="#4578be"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      animate={{
                        strokeDashoffset: [0, -20],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </svg>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section Boxes Populaires */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl sm:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                  Boxes Populaires
                </span>
              </h2>
              <p className="text-xl text-gray-400">
                Nos boxes les plus appréciées par la communauté
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_BOXES.map((box, index) => (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group relative"
                >
                  <Link href={`/boxes/${box.id}`}>
                    {/* Lueur cristalline au hover */}
                    <motion.div
                      className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, ${box.gradient.split(' ')[0].replace('from-', '')}, ${box.gradient.split(' ').pop()?.replace('to-', '')})`,
                      }}
                    />

                    <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl bg-[#0f1623]/80 border border-white/[0.08] transition-all hover:bg-[#0f1623]/90 hover:border-[#4578be]/50 hover:shadow-2xl hover:shadow-[#4578be]/20">
                      
                      {/* Effet de verre brisé en overlay */}
                      <div className="absolute inset-0 pointer-events-none opacity-10">
                        <svg className="w-full h-full">
                          <defs>
                            <pattern id={`crystal-${box.id}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                              <polygon points="50,0 100,38 82,100 18,100 0,38" fill="url(#boxGradient)" opacity="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill={`url(#crystal-${box.id})`}/>
                        </svg>
                      </div>

                      {/* Cristaux flottants autour de la carte */}
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-3 h-3 opacity-0 group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(135deg, ${box.gradient.split(' ')[0].replace('from-', '')}, transparent)`,
                            clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                            left: `${(i * 16) % 100}%`,
                            top: `${(i * 25) % 100}%`,
                            filter: 'blur(0.5px)',
                          }}
                          animate={{
                            y: [0, -30, 0],
                            rotate: [0, 180, 360],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2 + i * 0.3,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}

                      <div className="relative p-6">
                        {/* Badge rareté avec effet cristallin */}
                        <div className="absolute top-4 right-4 z-10">
                          <motion.span 
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border relative overflow-hidden ${
                              box.rarity === 'legendary' 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                                : 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                            }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {/* Effet de brillance */}
                            <motion.div
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
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
                            <span className="relative z-10">
                              {box.rarity === 'legendary' ? 'LÉGENDAIRE' : 'ÉPIQUE'}
                            </span>
                          </motion.span>
                        </div>

                        {/* Image de la box avec effet cristallin */}
                        <div className="relative h-48 mb-4 flex items-center justify-center">
                          {/* Lueur derrière la box */}
                          <motion.div
                            className="absolute inset-0 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity"
                            style={{
                              background: `radial-gradient(circle, ${box.gradient.split(' ')[0].replace('from-', '')}, transparent)`,
                            }}
                          />

                          <motion.img
                            src={box.image}
                            alt={box.name}
                            className="w-full h-full object-contain relative z-10"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                          />

                          {/* Particules cristallines qui orbitent autour de la box */}
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 rounded-full opacity-0 group-hover:opacity-100"
                              style={{
                                background: box.gradient.split(' ')[0].replace('from-', ''),
                                boxShadow: `0 0 10px ${box.gradient.split(' ')[0].replace('from-', '')}`,
                                left: '50%',
                                top: '50%',
                              }}
                              animate={{
                                x: [
                                  Math.cos(i * 45 * Math.PI / 180) * 80,
                                  Math.cos((i * 45 + 360) * Math.PI / 180) * 80,
                                ],
                                y: [
                                  Math.sin(i * 45 * Math.PI / 180) * 80,
                                  Math.sin((i * 45 + 360) * Math.PI / 180) * 80,
                                ],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                            />
                          ))}
                        </div>

                        {/* Info */}
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {box.name}
                          </h3>
                          <p className="text-sm text-gray-400 mb-4">
                            {box.description}
                          </p>

                          {/* Prix et bouton */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <motion.img
                                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                                alt="Coins"
                                className="w-6 h-6"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              <span className="text-2xl font-black text-white">
                                {box.price}
                              </span>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative px-4 py-2 rounded-xl text-white font-bold text-sm shadow-lg overflow-hidden bg-gradient-to-r ${box.gradient}`}
                            >
                              {/* Effet de brillance sur le bouton */}
                              <motion.div
                                className="absolute inset-0"
                                style={{
                                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                                }}
                                animate={{
                                  x: ['-100%', '200%'],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatDelay: 0.5,
                                }}
                              />
                              <span className="relative z-10">Ouvrir</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Bouton voir toutes les boxes */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link href="/boxes">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-2xl font-bold text-lg backdrop-blur-xl bg-white/5 border-2 border-[#4578be]/30 text-white hover:bg-[#4578be]/20 transition-all shadow-xl flex items-center gap-2 mx-auto"
                >
                  Voir toutes les boxes
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
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