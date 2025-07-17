// app/components/LootBoxCard.js
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Coins, Package } from 'lucide-react'

export default function LootBoxCard({ box }) {
  const rarityColors = {
    'Bronze Box': 'from-orange-600 to-orange-400',
    'Silver Box': 'from-gray-500 to-gray-300',
    'Gold Box': 'from-yellow-600 to-yellow-400'
  }

  const glowColors = {
    'Bronze Box': 'hover:shadow-orange-500/50',
    'Silver Box': 'hover:shadow-gray-400/50',
    'Gold Box': 'hover:shadow-yellow-500/50'
  }

  return (
    <Link href={`/boxes/${box.id}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-2xl ${glowColors[box.name] || 'hover:shadow-purple-500/50'} cursor-pointer group`}
      >
        {/* Gradient background effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[box.name] || 'from-purple-600 to-pink-600'} opacity-10 rounded-2xl group-hover:opacity-20 transition-opacity`} />
        
        <div className="relative z-10">
          {/* Box Icon/Image */}
          <div className="flex justify-center mb-4">
            <div className={`w-24 h-24 bg-gradient-to-br ${rarityColors[box.name] || 'from-purple-600 to-pink-600'} rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}>
              <Package className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Box Name */}
          <h3 className="text-xl font-bold text-white mb-2 text-center">{box.name}</h3>
          
          {/* Description */}
          <p className="text-gray-400 text-sm mb-4 text-center line-clamp-2">
            {box.description}
          </p>

          {/* Prices */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-semibold">{box.price_virtual}</span>
            </div>
            
            {box.price_real && (
              <div className="text-green-400 font-semibold">
                ${box.price_real}
              </div>
            )}
          </div>

          {/* Hover effect text */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900/80 rounded-2xl">
            <span className="text-white font-semibold">Voir les détails</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}