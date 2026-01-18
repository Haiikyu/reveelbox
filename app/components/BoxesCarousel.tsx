'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { ChevronLeft, ChevronRight, Package, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Box {
  id: string
  name: string
  image_url: string
  price_virtual: number
  rarity: string
}

export default function BoxesCarousel() {
  const [boxes, setBoxes] = useState<Box[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadBoxes = async () => {
      try {
        const { data, error } = await supabase
          .from('loot_boxes')
          .select('id, name, image_url, price_virtual, rarity')
          .eq('is_active', true)
          .eq('is_daily_free', false)
          .order('price_virtual', { ascending: false })
          .limit(10)

        if (!error && data) {
          setBoxes(data)
        }
      } catch (error) {
        console.error('Erreur chargement boxes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBoxes()
  }, [supabase])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % boxes.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + boxes.length) % boxes.length)
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#10b981',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }
    return colors[rarity] || colors.common
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10">
        <Package className="h-12 w-12 text-[#4578be] animate-pulse" />
      </div>
    )
  }

  if (boxes.length === 0) {
    return null
  }

  const visibleBoxes = [
    boxes[(currentIndex - 1 + boxes.length) % boxes.length],
    boxes[currentIndex],
    boxes[(currentIndex + 1) % boxes.length]
  ]

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-black text-white mb-1">Nos Boxes</h3>
          <p className="text-gray-400 text-sm">Découvre nos boxes exclusives</p>
        </div>
        <Link 
          href="/boxes"
          className="text-[#4578be] hover:text-[#5588ce] text-sm font-bold flex items-center gap-1 transition-colors"
        >
          Voir tout
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Bouton précédent */}
        <motion.button
          onClick={prevSlide}
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#4578be] hover:bg-[#5588ce] text-white p-2 rounded-full shadow-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>

        {/* Boxes */}
        <div className="flex items-center justify-center gap-4 px-12">
          {visibleBoxes.map((box, idx) => {
            const isCenter = idx === 1
            
            return (
              <Link key={box.id} href={`/boxes/${box.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isCenter ? 1 : 0.5,
                    scale: isCenter ? 1 : 0.8,
                    zIndex: isCenter ? 10 : 0
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 0.1, 0.25, 1],
                    type: 'spring',
                    stiffness: 100,
                    damping: 20
                  }}
                  className={`relative rounded-2xl overflow-hidden backdrop-blur-xl border-2 cursor-pointer group ${
                    isCenter ? 'border-[#4578be]' : 'border-white/10'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    boxShadow: isCenter ? `0 0 40px ${getRarityColor(box.rarity)}40` : 'none',
                    width: isCenter ? '320px' : '240px',
                    height: isCenter ? '400px' : '300px'
                  }}
                >
                  {/* Badge rareté */}
                  <div className="absolute top-3 left-3 z-10">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ 
                        background: getRarityColor(box.rarity),
                        boxShadow: `0 0 20px ${getRarityColor(box.rarity)}60`
                      }}
                    >
                      {box.rarity.toUpperCase()}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="relative h-3/5 flex items-center justify-center p-6">
                    <motion.img
                      src={box.image_url}
                      alt={box.name}
                      className="w-full h-full object-contain"
                      animate={isCenter ? {
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: [0.45, 0, 0.55, 1],
                        type: 'tween'
                      }}
                    />
                    
                    {/* Glow effect */}
                    {isCenter && (
                      <motion.div
                        className="absolute inset-0 rounded-full blur-3xl opacity-30"
                        style={{ background: getRarityColor(box.rarity) }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 bg-black/30 backdrop-blur-sm">
                    <h4 className="text-lg font-bold text-white mb-2 truncate">
                      {box.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#4578be] font-bold">
                        <Sparkles className="h-4 w-4" />
                        <span>{box.price_virtual}</span>
                      </div>
                      {isCenter && (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="bg-[#4578be] text-white px-3 py-1 rounded-full text-xs font-bold"
                        >
                          Ouvrir
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Shine effect */}
                  {isCenter && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: [0.45, 0, 0.55, 1],
                        repeatDelay: 3
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* Bouton suivant */}
        <motion.button
          onClick={nextSlide}
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#4578be] hover:bg-[#5588ce] text-white p-2 rounded-full shadow-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Indicateurs */}
      <div className="flex justify-center gap-2 mt-6">
        {boxes.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            animate={{
              width: idx === currentIndex ? 32 : 8,
              backgroundColor: idx === currentIndex ? '#4578be' : '#4b5563'
            }}
            whileHover={{
              backgroundColor: idx === currentIndex ? '#5588ce' : '#6b7280',
              scale: 1.1
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            className="h-2 rounded-full"
          />
        ))}
      </div>
    </div>
  )
}