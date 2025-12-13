'use client'

import { useState, useEffect } from 'react'
import { motion, useAnimation, useMotionValue } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'

interface Winner {
  id: string
  item_image: string
  item_name: string
  avatar_url: string
  username: string
  box_image: string
  box_name: string
  obtained_at: string
}

// Carte de gagnant ultra-minimaliste
function WinnerCard({ winner }: { winner: Winner }) {
  const [isHovered, setIsHovered] = useState(false)

  // Debug en console
  console.log('Winner card:', {
    id: winner.id,
    item: winner.item_name,
    box_name: winner.box_name,
    box_image: winner.box_image,
    has_box: !!winner.box_image
  })

  return (
    <motion.div
      className="relative flex-shrink-0 w-64 h-64 cursor-pointer mx-3"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image de l'item gagné - sans fond */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden">
        <Image
          src={winner.item_image}
          alt={winner.item_name}
          fill
          className="object-contain"
          sizes="256px"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkl0ZW08L3RleHQ+Cjwvc3ZnPg=='
          }}
        />

        {/* Overlay hover avec image de la box et info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
        >
          {winner.box_image && winner.box_image !== '' ? (
            <>
              <div className="relative w-40 h-40 mb-3">
                <Image
                  src={winner.box_image}
                  alt={winner.box_name}
                  fill
                  className="object-contain drop-shadow-2xl"
                  sizes="160px"
                  onError={(e) => {
                    console.error('Erreur chargement box image:', winner.box_image)
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJveCE8L3RleHQ+Cjwvc3ZnPg=='
                  }}
                />
              </div>
              <p className="text-white text-sm font-bold text-center line-clamp-2">
                {winner.box_name}
              </p>
            </>
          ) : (
            <>
              <p className="text-white text-lg font-bold text-center mb-2">
                {winner.item_name}
              </p>
              <p className="text-gray-400 text-xs">
                Box inconnue
              </p>
            </>
          )}
          <p className="text-gray-300 text-xs mt-2">
            {new Date(winner.obtained_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </motion.div>
      </div>

      {/* Avatar du joueur - petit et rond en haut à droite */}
      <div className="absolute top-3 right-3 w-12 h-12 rounded-full overflow-hidden border-2 border-white/50 shadow-lg bg-gray-200 dark:bg-gray-700 z-10">
        <Image
          src={winner.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.username}`}
          alt={winner.username}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    </motion.div>
  )
}

export default function RecentWinnersSection() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const controls = useAnimation()
  const x = useMotionValue(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchRecentWinners = async () => {
      try {
        setLoading(true)

        // Récupérer les 20 derniers items gagnés avec les infos des joueurs, items et boxes
        const { data, error } = await supabase
          .from('user_inventory')
          .select(`
            id,
            obtained_at,
            obtained_from,
            box_id,
            user_id,
            item_id,
            items (
              id,
              name,
              image_url
            ),
            profiles!user_inventory_user_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .not('obtained_at', 'is', null)
          .not('item_id', 'is', null)
          .order('obtained_at', { ascending: false })
          .limit(20)

        if (error) {
          // Gérer silencieusement - probablement pas de données encore
          setLoading(false)
          return
        }

        if (!data || data.length === 0) {
          setLoading(false)
          return
        }

        // Récupérer les IDs des boxes depuis box_id (filtrer les valeurs valides)
        const boxIds = data
          .map(item => item.box_id)
          .filter(id => id != null && id !== '')

        let boxesData: Array<{ id: string; name: string; image_url: string }> = []
        if (boxIds.length > 0) {
          // Récupérer les infos des boxes
          const { data: boxes, error: boxesError } = await supabase
            .from('loot_boxes')
            .select('id, name, image_url')
            .in('id', boxIds)

          if (boxesError) {
            // Ignorer l'erreur - continuer sans les infos des boxes
          } else {
            boxesData = boxes || []
          }
        }

        // Créer un map des boxes pour un accès rapide
        const boxesMap = new Map(
          boxesData?.map(box => [box.id, box]) || []
        )

        // Mapper les données
        const mappedWinners: Winner[] = data
          .filter(item => {
            // Filtrer uniquement les items avec données complètes (pas besoin de box_id)
            return item.items && item.profiles
          })
          .map(item => {
            const box = item.box_id ? boxesMap.get(item.box_id) : null
            const itemData = item.items as any
            const profileData = item.profiles as any

            return {
              id: item.id,
              item_image: itemData?.image_url || '',
              item_name: itemData?.name || 'Item inconnu',
              avatar_url: profileData?.avatar_url || '',
              username: profileData?.username || 'Joueur',
              box_image: box?.image_url || '',
              box_name: box?.name || 'Mystery Box',
              obtained_at: item.obtained_at || new Date().toISOString()
            }
          })

        setWinners(mappedWinners)
      } catch (error) {
        // Gérer silencieusement les erreurs
      } finally {
        setLoading(false)
      }
    }

    fetchRecentWinners()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchRecentWinners, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (winners.length === 0) return

    // Largeur d'une carte (256px) + margin (24px)
    const cardWidth = 256 + 24
    const totalWidth = cardWidth * winners.length

    // Animation infinie
    controls.start({
      x: [0, -totalWidth],
      transition: {
        x: {
          duration: 30, // Vitesse du défilement (30 secondes pour tout parcourir)
          repeat: Infinity,
          ease: 'linear'
        }
      }
    })
  }, [controls, winners.length])

  if (loading) {
    return (
      <section className="w-full py-24 bg-white dark:bg-gray-950">
        <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
          Derniers gagnants
        </h2>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </section>
    )
  }

  if (winners.length === 0) {
    return (
      <section className="w-full py-24 bg-white dark:bg-gray-950">
        <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
          Derniers gagnants
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Soyez le premier à gagner !
        </p>
      </section>
    )
  }

  return (
    <section className="w-full py-24 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Titre simple */}
      <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
        Derniers gagnants
      </h2>

      {/* Carousel horizontal infini */}
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />

        {/* Track qui défile */}
        <motion.div
          className="flex"
          style={{ x }}
          animate={controls}
          onHoverStart={() => controls.stop()}
          onHoverEnd={() => {
            const cardWidth = 256 + 24
            const totalWidth = cardWidth * winners.length
            const currentX = x.get()
            controls.start({
              x: [currentX, -totalWidth],
              transition: {
                x: {
                  duration: 30,
                  repeat: Infinity,
                  ease: 'linear'
                }
              }
            })
          }}
        >
          {/* Répéter les winners 3 fois pour un scroll infini fluide */}
          {[...winners, ...winners, ...winners].map((winner, index) => (
            <WinnerCard key={`${winner.id}-${index}`} winner={winner} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
