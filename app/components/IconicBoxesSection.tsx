'use client'

import { motion } from 'framer-motion'
import { Coins, Package, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface IconicBox {
  id: string
  name: string
  coins: number
  image: string
  available: boolean
  limited?: boolean
}

const iconicBoxes: IconicBox[] = [
  {
    id: '1',
    name: 'Louis Vuitton',
    coins: 650,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop',
    available: true,
    limited: true
  },
  {
    id: '2',
    name: 'GUCCI',
    coins: 158,
    image: 'https://images.unsplash.com/photo-1591348278863-a4e05380c7e2?w=400&h=400&fit=crop',
    available: true
  },
  {
    id: '3',
    name: 'POKEMON',
    coins: 105,
    image: 'https://images.unsplash.com/photo-1613583388042-c1e0b91928ba?w=400&h=400&fit=crop',
    available: true
  },
  {
    id: '4',
    name: 'MINECRAFT',
    coins: 75,
    image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=400&fit=crop',
    available: true
  }
]

export function IconicBoxesSection() {
  const [hoveredBox, setHoveredBox] = useState<string | null>(null)

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Fond avec effet de profondeur */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-gray-50/50" />

      {/* Particules flottantes décoratives */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              top: `${10 + (i * 12)}%`,
              left: `${5 + (i % 4) * 25}%`,
              opacity: 0.15
            }}
            animate={{
              y: [-20, 20, -20],
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.3, 0.15]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Titre de section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Nos Boîtes Iconiques
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez nos collections exclusives de marques premium
          </p>
        </motion.div>

        {/* Grid des boîtes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {iconicBoxes.map((box, index) => (
            <motion.div
              key={box.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredBox(box.id)}
              onHoverEnd={() => setHoveredBox(null)}
              className="relative group cursor-pointer"
            >
              {/* Carte avec effet de profondeur */}
              <motion.div
                whileHover={{ y: -8 }}
                className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                style={{
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
              >
                {/* Badge LIMITED */}
                {box.limited && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                      LIMITED
                    </div>
                  </div>
                )}

                {/* Image de la boîte */}
                <div className="relative h-56 bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center overflow-hidden">
                  {/* Effet de glow au hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredBox === box.id ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  <motion.img
                    src={box.image}
                    alt={box.name}
                    className="relative w-full h-full object-contain drop-shadow-2xl"
                    animate={{
                      scale: hoveredBox === box.id ? 1.1 : 1,
                      rotateY: hoveredBox === box.id ? 5 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJvw65lPC90ZXh0Pgo8L3N2Zz4K'
                    }}
                  />
                </div>

                {/* Informations de la boîte */}
                <div className="p-6">
                  {/* Nom */}
                  <h3 className="text-xl font-black text-gray-900 mb-4 text-center tracking-tight">
                    {box.name}
                  </h3>

                  {/* Prix en coins */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Coins className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-black text-gray-900">
                      {box.coins}
                    </span>
                  </div>

                  {/* Statut de disponibilité */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200"
                    style={{
                      background: box.available
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                      color: box.available ? 'white' : '#6b7280',
                      boxShadow: box.available
                        ? '0 4px 14px 0 rgba(16, 185, 129, 0.39)'
                        : 'none'
                    }}
                  >
                    {box.available ? 'Disponible' : 'Bientôt disponible'}
                  </motion.button>

                  {/* Action au hover */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: hoveredBox === box.id && box.available ? 1 : 0,
                      height: hoveredBox === box.id && box.available ? 'auto' : 0
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-600 text-sm font-bold">
                      <ArrowRight className="w-4 h-4" />
                      <span>Cliquez pour ouvrir</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bouton "Voir toutes les boîtes" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/boxes">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white'
              }}
            >
              <Package className="w-6 h-6" />
              Voir toutes les boîtes
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
