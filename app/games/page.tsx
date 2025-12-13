'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight,
  Star,
  Grid3x3,
  LayoutGrid,
  Heart,
  Filter,
} from 'lucide-react'
import Image from 'next/image'

const games = [
  {
    id: 'crash',
    href: '/games/crash',
    title: 'Crash',
    description: 'Multipliez vos gains avant le crash',
    iconUrl: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(64).png',
    gradient: 'from-red-500 via-orange-500 to-pink-500',
    bgColor: 'bg-red-500/10',
    available: true,
  },
  {
    id: 'mines',
    href: '/games/mines',
    title: 'Mines',
    description: 'Évitez les mines, trouvez les étoiles',
    iconUrl: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(63).png',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    bgColor: 'bg-purple-500/10',
    available: true,
  },
  {
    id: 'upgrade',
    href: '/games/upgrade',
    title: 'Upgrade',
    description: 'Améliorez vos items pour des gains massifs',
    iconUrl: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(61).png',
    gradient: 'from-[#4578be] via-[#5588ce] to-[#6598de]',
    bgColor: 'bg-[#4578be]/10',
    available: true,
  },
  {
    id: 'roulette',
    href: '/games/roulette',
    title: 'Roulette',
    description: 'Misez sur vos couleurs favorites',
    iconUrl: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(66).png',
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    available: false,
  },
  {
    id: 'coinflip',
    href: '/games/coinflip',
    title: 'Coinflip',
    description: 'Pile ou face, doublez votre mise',
    iconUrl: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/POUR%20GAMES/Design%20sans%20titre%20(65).png',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    bgColor: 'bg-cyan-500/10',
    available: true,
  }
]

export default function GamesPage() {
  // Système de favoris avec localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favoriteGames')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const toggleFavorite = (gameId: string) => {
    const newFavorites = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId]
    setFavorites(newFavorites)
    localStorage.setItem('favoriteGames', JSON.stringify(newFavorites))
  }

  // Filtre par disponibilité
  const [filter, setFilter] = useState<'all' | 'available' | 'coming'>('all')
  
  const filteredGames = games.filter(game => {
    if (filter === 'available') return game.available
    if (filter === 'coming') return !game.available
    return true
  })

  // Mode d'affichage compact/étendu
  const [viewMode, setViewMode] = useState<'compact' | 'extended'>('extended')

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      
      {/* Fond avec cercles flous */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl sm:text-6xl font-black mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Nos Jeux
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Découvrez notre collection de jeux passionnants et tentez votre chance
          </p>
        </motion.div>

        {/* Barre d'outils avec filtres */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12 p-4 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] w-fit mx-auto shadow-2xl"
        >
          {/* Filtres */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Tous', icon: LayoutGrid },
              { id: 'available', label: 'Disponibles', icon: Grid3x3 },
              { id: 'coming', label: 'Bientôt', icon: Filter },
            ].map((f) => (
              <motion.button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                  filter === f.id
                    ? 'bg-[#4578be] text-white shadow-lg shadow-[#4578be]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <f.icon className="h-4 w-4" />
                {f.label}
              </motion.button>
            ))}
          </div>

          {/* Séparateur */}
          <div className="w-px h-8 bg-white/10" />

          {/* Toggle mode d'affichage */}
          <motion.button
            onClick={() => setViewMode(viewMode === 'compact' ? 'extended' : 'compact')}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LayoutGrid className="h-4 w-4" />
            {viewMode === 'compact' ? 'Vue détaillée' : 'Vue compacte'}
          </motion.button>
        </motion.div>

        {/* Grille de jeux */}
        <motion.div
          layout
          className={`grid gap-6 ${
            viewMode === 'compact' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, index) => {
              const isFavorite = favorites.includes(game.id)

              return (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  {/* Bouton favori */}
                  <motion.button
                    onClick={() => toggleFavorite(game.id)}
                    className={`absolute top-4 right-4 z-20 p-2.5 rounded-full backdrop-blur-xl transition-all ${
                      isFavorite 
                        ? 'bg-red-500/20 border border-red-500/50' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart 
                      className={`h-4 w-4 transition-all ${
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`} 
                    />
                  </motion.button>

                  {/* Carte du jeu */}
                  <Link
                    href={game.available ? game.href : '#'}
                    className={`block ${!game.available && 'pointer-events-none'}`}
                  >
                    <motion.div
                      className={`relative rounded-2xl overflow-hidden backdrop-blur-xl bg-[#0f1623]/80 border border-white/[0.08] p-6 h-full transition-all ${
                        game.available 
                          ? 'hover:bg-[#0f1623]/90 hover:border-[#4578be]/50 hover:shadow-2xl hover:shadow-[#4578be]/20' 
                          : 'opacity-60'
                      }`}
                      whileHover={game.available ? { y: -8 } : {}}
                      style={{
                        minHeight: viewMode === 'compact' ? '180px' : '240px'
                      }}
                    >
                      {/* Badge "Bientôt" - supprimé d'ici */}

                      {/* Badge "Nouveau" pour Upgrade - supprimé d'ici */}

                      {/* Contenu */}
                      <div className="flex flex-col h-full">
                        {/* Icône du jeu */}
                        <div className="mb-4">
                          <motion.div
                            className={`w-20 h-20 rounded-2xl ${game.bgColor} flex items-center justify-center backdrop-blur-xl border-2 border-white/20 shadow-lg overflow-hidden p-1`}
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Image 
                              src={game.iconUrl} 
                              alt={game.title}
                              width={80}
                              height={80}
                              className="object-cover w-full h-full rounded-xl"
                            />
                          </motion.div>
                        </div>

                        {/* Titre et description */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                            {game.title}
                            {/* Badge "Nouveau" pour Upgrade */}
                            {game.id === 'upgrade' && (
                              <motion.span 
                                className="text-xs font-bold px-2.5 py-1 bg-[#4578be]/30 text-[#4578be] rounded-full border border-[#4578be]/60"
                                animate={{
                                  boxShadow: [
                                    '0 0 0px rgba(69, 120, 190, 0.5)',
                                    '0 0 20px rgba(69, 120, 190, 0.8)',
                                    '0 0 0px rgba(69, 120, 190, 0.5)',
                                  ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                NOUVEAU
                              </motion.span>
                            )}
                            {/* Badge "Bientôt" */}
                            {!game.available && (
                              <span className="text-xs font-bold px-2.5 py-1 bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/50">
                                BIENTÔT
                              </span>
                            )}
                          </h3>
                          {viewMode === 'extended' && (
                            <p className="text-sm text-gray-400 leading-relaxed mb-4">
                              {game.description}
                            </p>
                          )}
                        </div>

                        {/* Bouton d'action */}
                        <motion.div
                          className={`flex items-center justify-between p-4 rounded-xl ${
                            game.available 
                              ? `bg-gradient-to-r ${game.gradient} shadow-lg` 
                              : 'bg-gray-800/50'
                          }`}
                          whileHover={game.available ? { scale: 1.02 } : {}}
                        >
                          <span className="text-white font-bold">
                            {game.available ? 'Jouer maintenant' : 'Bientôt disponible'}
                          </span>
                          
                          {game.available && (
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="p-1.5 rounded-full bg-white/20"
                            >
                              <ArrowRight className="h-4 w-4 text-white" />
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  </Link>

                  {/* Badge étoile pour favoris */}
                  {isFavorite && (
                    <motion.div
                      className="absolute -top-2 -right-2 z-30"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <motion.div
                        className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/50"
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Star className="h-5 w-5 text-white fill-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Message si aucun résultat */}
        <AnimatePresence>
          {filteredGames.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#4578be] to-[#6598de] opacity-20"
              />
              <p className="text-gray-400 text-xl font-medium">Aucun jeu trouvé</p>
              <p className="text-gray-500 text-sm mt-2">Essayez de changer vos filtres</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer avec statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] shadow-2xl">
            {/* Compteur de jeux */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-[#4578be]"
                animate={{ 
                  scale: [1, 1.5, 1], 
                  opacity: [1, 0.5, 1],
                  boxShadow: [
                    '0 0 0px rgba(69, 120, 190, 0.5)',
                    '0 0 15px rgba(69, 120, 190, 1)',
                    '0 0 0px rgba(69, 120, 190, 0.5)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm text-gray-400">
                <motion.span
                  className="font-bold text-white text-lg"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {filteredGames.length}
                </motion.span> jeu{filteredGames.length > 1 ? 'x' : ''}
              </span>
            </motion.div>

            <div className="w-px h-6 bg-gray-700" />

            {/* Compteur de favoris */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={favorites.length > 0 ? { 
                  scale: [1, 1.2, 1],
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <Heart className={`h-5 w-5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </motion.div>
              <span className="text-sm text-gray-400">
                <span className="font-bold text-white text-lg">{favorites.length}</span> favori{favorites.length > 1 ? 's' : ''}
              </span>
            </motion.div>

            <div className="w-px h-6 bg-gray-700" />

            {/* Jeux disponibles */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-green-500"
                animate={{ 
                  opacity: [1, 0.5, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm text-gray-400">
                <span className="font-bold text-white text-lg">
                  {games.filter(g => g.available).length}
                </span> disponible{games.filter(g => g.available).length > 1 ? 's' : ''}
              </span>
            </motion.div>
          </div>
        </motion.div>

      </div>

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

    </div>
  )
}