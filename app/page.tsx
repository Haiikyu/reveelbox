'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  Gift,
  Package,
  Truck,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Users,
  Heart,
  Sparkles,
  Coins,
  TrendingUp,
  Play,
  ChevronRight,
  Globe
} from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface LootBoxItem {
  id?: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image_url?: string
  market_value?: number
}

interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  price_real: number
  image_url?: string
  is_active?: boolean
  is_daily_free?: boolean
  is_featured?: boolean
  items?: LootBoxItem[]
  rarity?: string
  limited?: boolean
  popular?: boolean
  new?: boolean
}

// Variantes d'animation
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    rotateY: -10 
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

// Composant FloatingBoxCard modifié pour le nouveau système de thème
interface FloatingBoxCardProps {
  box: LootBox
  user: any
  profile: any
  onBoxClick: (boxId: string) => void
  getRarityGlow: (rarity: string) => string
}

function FloatingBoxCard({ 
  box, 
  user, 
  profile, 
  onBoxClick, 
  getRarityGlow
}: FloatingBoxCardProps) {
  const canAfford = profile ? profile.virtual_currency >= box.price_virtual : false
  const glowColor = getRarityGlow(box.rarity || 'common')
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ 
        y: -20,
        rotateY: 15,
        rotateX: -5,
        scale: 1.05
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => onBoxClick(box.id)}
    >
      <motion.div className="relative">
        
        {/* Badges flottants */}
        <div className="absolute -top-2 -right-2 z-20 flex flex-col gap-1">
          {box.limited && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            >
              LIMITED
            </motion.div>
          )}
          {box.new && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--hybrid-success), var(--hybrid-accent-secondary))'
              }}
            >
              NEW
            </motion.div>
          )}
          {box.popular && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            >
              HOT
            </motion.div>
          )}
        </div>

        {/* Ombre dynamique */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black/10 rounded-full blur-lg"
          animate={{
            scale: isHovered ? 1.5 : 1,
            opacity: isHovered ? 0.3 : 0.1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Image de la boîte */}
        <div className="relative mb-4">
          <motion.img
            src={box.image_url || 'https://i.imgur.com/8YwZmtP.png'}
            alt={box.name}
            className="w-full h-48 object-contain drop-shadow-2xl"
            animate={{
              filter: isHovered 
                ? `drop-shadow(0 25px 50px ${glowColor}40) brightness(1.1)`
                : 'drop-shadow(0 10px 25px rgba(0,0,0,0.15)) brightness(1)'
            }}
            transition={{ duration: 0.3 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJvw65lPC90ZXh0Pgo8L3N2Zz4K'
            }}
          />
        </div>

        {/* Informations avec classes thématiques */}
        <motion.div
          className="text-center"
          animate={{
            y: isHovered ? -5 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-black text-primary mb-2 truncate">
            {box.name}
          </h3>
          
          <p className="text-sm text-secondary mb-3 line-clamp-1">
            {box.description}
          </p>

          {/* Prix avec classe thématique */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Coins size={18} className="text-primary" />
            <span className="text-xl font-black text-primary">
              {box.price_virtual}
            </span>
          </div>

          {/* Indicateur de disponibilité avec bouton hybride */}
          {user ? (
            canAfford ? (
              <button className="hybrid-btn hybrid-btn-success hybrid-btn-sm w-full">
                Disponible
              </button>
            ) : (
              <button className="hybrid-btn hybrid-btn-outline hybrid-btn-sm w-full" disabled>
                Coins insuffisants
              </button>
            )
          ) : (
            <button className="hybrid-btn hybrid-btn-outline hybrid-btn-sm w-full" disabled>
              Connexion requise
            </button>
          )}

          {/* Action au hover avec classe hybride */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered && canAfford && user ? 1 : 0 }}
            className="text-center mt-2"
          >
            <div className="inline-flex items-center gap-2 text-sm font-bold"
              style={{ color: 'var(--hybrid-accent-primary)' }}>
              <ArrowRight size={14} />
              Cliquez pour ouvrir
            </div>
          </motion.div>
        </motion.div>

        {/* Indicateur de rareté */}
        <motion.div
          className="absolute top-2 left-2 w-3 h-3 rounded-full"
          style={{ backgroundColor: glowColor }}
          animate={{
            scale: isHovered ? [1, 1.3, 1] : 1,
            opacity: isHovered ? [0.7, 1, 0.7] : 0.7
          }}
          transition={{ 
            duration: isHovered ? 1 : 0.3,
            repeat: isHovered ? Infinity : 0 
          }}
        />
      </motion.div>
    </motion.div>
  )
}

// Données de fallback
const getFallbackBoxes = (): LootBox[] => [
  {
    id: 'fallback-1',
    name: 'MYSTERY TECH BOX',
    description: 'Gadgets et accessoires tech surprises',
    price_virtual: 200,
    price_real: 19.99,
    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
    is_active: true,
    is_featured: true,
    rarity: 'rare',
    limited: false,
    popular: true,
    new: false
  },
  {
    id: 'fallback-2', 
    name: 'GAMING TREASURE',
    description: 'Objets collector pour gamers',
    price_virtual: 500,
    price_real: 49.99,
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop',
    is_active: true,
    is_featured: true,
    rarity: 'legendary',
    limited: true,
    popular: false,
    new: true
  },
  {
    id: 'fallback-3',
    name: 'SNEAKER VAULT',
    description: 'Collection sneakers exclusives',
    price_virtual: 380,
    price_real: 39.99,
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    is_active: true,
    is_featured: true,
    rarity: 'epic',
    limited: false,
    popular: true,
    new: false
  },
  {
    id: 'fallback-4',
    name: 'LUXURY DROPS',
    description: 'Articles de luxe premium',
    price_virtual: 280,
    price_real: 29.99,
    image_url: 'https://images.unsplash.com/photo-1523170335258-f5c6c6bd6eea?w=400&h=400&fit=crop',
    is_active: true,
    is_featured: true,
    rarity: 'rare',
    limited: false,
    popular: false,
    new: true
  }
]

export default function HomePage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)

  // Calculer la rareté selon le prix
  const calculateRarityFromPrice = (price: number): string => {
    if (price >= 400) return 'legendary'
    if (price >= 250) return 'epic'
    if (price >= 150) return 'rare'
    return 'common'
  }

  // Couleurs de rareté utilisant les variables CSS
  const getRarityGlow = (rarity: string) => {
    const glows = {
      common: 'rgb(var(--rarity-common))',
      rare: 'rgb(var(--rarity-rare))', 
      epic: 'rgb(var(--rarity-epic))',
      legendary: 'rgb(var(--rarity-legendary))'
    }
    return glows[rarity as keyof typeof glows] || glows.common
  }

  // Naviguer vers l'ouverture au clic sur la boîte
  const handleBoxClick = (boxId: string) => {
    window.open(`/boxes/${boxId}`, '_blank')
  }

// Remplacer votre useEffect par celui-ci
useEffect(() => {
  const loadBoxes = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Essayer de charger depuis la DB d'abord
      const { data: boxes, error } = await supabase
        .from('loot_boxes')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('price_virtual', { ascending: false })
        .limit(4)

      console.log('Données DB:', { boxes, error }) // Debug

      if (error) {
        console.error('Erreur Supabase:', error)
        // Utiliser le fallback en cas d'erreur
        const fallbackBoxes = getFallbackBoxes().map(box => ({
          ...box,
          rarity: calculateRarityFromPrice(box.price_virtual),
          limited: box.price_virtual >= 350,
          popular: [380, 200].includes(box.price_virtual),
          new: ['GAMING TREASURE', 'LUXURY DROPS'].includes(box.name)
        }))
        setLootBoxes(fallbackBoxes)
        return
      }

      if (!boxes || boxes.length === 0) {
        console.log('Aucune boîte featured dans la DB, utilisation du fallback')
        // Utiliser le fallback si pas de boîtes featured
        const fallbackBoxes = getFallbackBoxes().map(box => ({
          ...box,
          rarity: calculateRarityFromPrice(box.price_virtual),
          limited: box.price_virtual >= 350,
          popular: [380, 200].includes(box.price_virtual),
          new: ['GAMING TREASURE', 'LUXURY DROPS'].includes(box.name)
        }))
        setLootBoxes(fallbackBoxes)
        return
      }

      // Utiliser les vraies données de la DB
      console.log('Utilisation des données DB:', boxes.length, 'boîtes')
      const mappedBoxes: LootBox[] = boxes.map(box => ({
        ...box,
        rarity: calculateRarityFromPrice(box.price_virtual),
        limited: box.price_virtual >= 350,
        popular: [320, 220, 150].includes(box.price_virtual),
        new: ['FRESH ARRIVALS', 'EXCLUSIVE DROP'].includes(box.name)
      }))
      setLootBoxes(mappedBoxes)

    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      // Fallback en cas d'erreur
      const fallbackBoxes = getFallbackBoxes().map(box => ({
        ...box,
        rarity: calculateRarityFromPrice(box.price_virtual),
        limited: box.price_virtual >= 350,
        popular: [380, 200].includes(box.price_virtual),
        new: ['GAMING TREASURE', 'LUXURY DROPS'].includes(box.name)
      }))
      setLootBoxes(fallbackBoxes)
    } finally {
      setLoading(false)
    }
  }

  loadBoxes()
}, [])

  if (loading) {
    return (
      <div className="min-h-screen surface flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const features = [
    {
      icon: Gift,
      title: "Objets Réels Premium",
      description: "Chaque boîte contient de vrais produits de marques prestigieuses"
    },
    {
      icon: Truck,
      title: "Livraison Express",
      description: "Expédition rapide avec suivi en temps réel partout en France"
    },
    {
      icon: Shield,
      title: "100% Authentique",
      description: "Tous nos produits sont certifiés authentiques ou remboursé"
    },
    {
      icon: Sparkles,
      title: "Expérience Immersive",
      description: "Animations et effets visuels pour une expérience unique"
    }
  ]

  const stats = [
    { number: "125K+", label: "Boîtes ouvertes", icon: Package },
    { number: "45K+", label: "Utilisateurs actifs", icon: Users },
    { number: "99.2%", label: "Satisfaction", icon: Heart },
    { number: "4.9⭐", label: "Note moyenne", icon: Star }
  ]

  const testimonials = [
    {
      name: "Alex M.",
      comment: "J'ai reçu des Jordan 1 Chicago authentiques ! L'animation était incroyable.",
      rating: 5,
      avatar: "🔥"
    },
    {
      name: "Sarah L.",
      comment: "Livraison en 24h ! La Tech Box contenait des AirPods Pro, je recommande.",
      rating: 5,
      avatar: "⭐"
    },
    {
      name: "Tom R.",
      comment: "Accro total ! J'ai ouvert 10 boîtes ce mois-ci, chaque fois c'est la surprise.",
      rating: 5,
      avatar: "🎮"
    }
  ]

  return (
    <div className="hybrid-container">

      {/* Hero Section avec système hybride */}
      <section className="relative pt-20 pb-16 overflow-hidden" style={{
        background: 'var(--hybrid-bg-secondary)'
      }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-multiply blur-xl animate-pulse"
            style={{ background: 'var(--hybrid-accent-primary)' }} />
          <div className="absolute top-40 right-10 w-72 h-72 rounded-full mix-blend-multiply blur-xl animate-pulse"
            style={{ background: 'var(--hybrid-accent-secondary)', animationDelay: '2s' }} />
        </div>

        <div className="relative hybrid-wrapper">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{
                background: 'var(--hybrid-bg-tertiary)',
                boxShadow: 'var(--hybrid-shadow-md)'
              }}
            >
              <Sparkles className="h-4 w-4" style={{ color: 'var(--hybrid-accent-primary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--hybrid-text-primary)' }}>
                Nouvelles boîtes exclusives disponibles
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="hybrid-display mb-6"
            >
              Déballez l'
              <span style={{
                background: 'linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Impossible
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hybrid-lead mb-12"
            >
              L'expérience d'unboxing la plus addictive au monde ! Découvrez des produits réels
              de grandes marques avec des animations époustouflantes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link
                href={isAuthenticated ? "/boxes" : "/signup"}
                className="hybrid-btn hybrid-btn-primary hybrid-btn-lg inline-flex items-center gap-3"
              >
                <Gift className="h-6 w-6" />
                {isAuthenticated ? "Découvrir les boîtes" : "Commencer l'aventure"}
                <ArrowRight className="h-6 w-6" />
              </Link>

              <button className="hybrid-btn hybrid-btn-secondary hybrid-btn-lg inline-flex items-center gap-3">
                <Play className="h-6 w-6" />
                Voir la démo
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Boîtes Iconiques */}
      <section className="hybrid-section">
        <div className="hybrid-wrapper">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="hybrid-section-title"
            >
              Nos Boîtes Iconiques
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="hybrid-section-description"
            >
              Chaque boîte contient des objets réels authentiques avec une garantie 100% ou remboursé
            </motion.p>
          </div>

          {/* Affichage solde utilisateur */}
          {user && profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex justify-center mb-12"
            >
              <div className="surface-elevated px-6 py-3 rounded-2xl">
                <div className="inline-flex items-center gap-3">
                  <Coins size={24} className="text-primary" />
                  <span className="text-2xl font-black text-primary">
                    {profile.virtual_currency || 0}
                  </span>
                  <span className="text-secondary font-medium">coins</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grid des boîtes */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 mb-16"
          >
            {lootBoxes.map((box) => (
              <FloatingBoxCard
                key={box.id}
                box={box}
                user={user}
                profile={profile}
                onBoxClick={handleBoxClick}
                getRarityGlow={getRarityGlow}
              />
            ))}
          </motion.div>

          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/boxes"
                className="hybrid-btn hybrid-btn-primary hybrid-btn-lg inline-flex items-center gap-3"
              >
                <Package className="h-6 w-6" />
                Voir toutes les boîtes
                <ChevronRight className="h-6 w-6" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Features */}
      <section className="hybrid-section">
        <div className="hybrid-wrapper">
          <div className="text-center mb-16">
            <h2 className="hybrid-section-title">
              Pourquoi ReveelBox ?
            </h2>
            <p className="hybrid-section-description">
              L'expérience d'unboxing la plus authentique et sécurisée
            </p>
          </div>

          <div className="hybrid-grid hybrid-grid-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="hybrid-card text-center"
                >
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: 'linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))'
                    }}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="hybrid-card-title mb-3">
                    {feature.title}
                  </h3>
                  <p className="hybrid-card-text">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="py-20 relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))'
        }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative hybrid-wrapper">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              ReveelBox en Chiffres
            </h2>
            <p className="text-xl text-white/80 opacity-90">
              Rejoignez une communauté passionnée qui grandit chaque jour
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-black text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/80 font-semibold">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="hybrid-section">
        <div className="hybrid-wrapper">
          <div className="text-center mb-16">
            <h2 className="hybrid-section-title">
              Ils Adorent ReveelBox
            </h2>
            <p className="hybrid-section-description">
              Découvrez les expériences de notre communauté
            </p>
          </div>

          <div className="hybrid-grid hybrid-grid-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="hybrid-card"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" style={{ color: 'var(--hybrid-warning)' }} />
                  ))}
                </div>

                <p className="hybrid-card-text mb-6 italic">
                  "{testimonial.comment}"
                </p>

                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center mr-4 text-xl"
                    style={{
                      background: 'linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))'
                    }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2" style={{ color: 'var(--hybrid-text-primary)' }}>
                      {testimonial.name}
                      <CheckCircle className="h-4 w-4" style={{ color: 'var(--hybrid-success)' }} />
                    </div>
                    <div className="text-sm" style={{ color: 'var(--hybrid-text-tertiary)' }}>
                      Utilisateur vérifié
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="px-6 py-4 rounded-full inline-flex items-center gap-4"
              style={{
                background: 'var(--hybrid-bg-secondary)',
                boxShadow: 'var(--hybrid-shadow-md)'
              }}>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: 'var(--hybrid-success)' }} />
                <span className="font-bold" style={{ color: 'var(--hybrid-text-primary)' }}>
                  99.2% de satisfaction
                </span>
              </div>
              <div className="w-px h-6" style={{ background: 'var(--hybrid-border)' }} />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" style={{ color: 'var(--hybrid-info)' }} />
                <span className="font-bold" style={{ color: 'var(--hybrid-text-primary)' }}>
                  Paiement sécurisé
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))'
        }}>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative hybrid-wrapper text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8">
              Votre Première Surprise Vous Attend
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
              Rejoignez 45 000+ aventuriers qui découvrent l'expérience d'unboxing la plus addictive au monde
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={isAuthenticated ? "/boxes" : "/signup"}
                  className="bg-white px-8 py-4 rounded-full text-xl font-black shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3"
                  style={{ color: 'var(--hybrid-accent-primary)' }}
                >
                  <Gift className="h-6 w-6" />
                  {isAuthenticated ? "Ouvrir ma première boîte" : "Commencer l'aventure"}
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </motion.div>

              {!isAuthenticated && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/login"
                    className="border-2 border-white text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-white transition-all duration-300 flex items-center gap-3 hover:text-current"
                    style={{
                      '--hover-color': 'var(--hybrid-accent-primary)'
                    } as React.CSSProperties}
                  >
                    <Users className="h-6 w-6" />
                    J'ai déjà un compte
                  </Link>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
              <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">100% Sécurisé</span>
              </div>
              <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                <Truck className="h-5 w-5" />
                <span className="font-semibold">Livraison Express</span>
              </div>
              <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
                <Heart className="h-5 w-5" />
                <span className="font-semibold">Satisfait ou Remboursé</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}