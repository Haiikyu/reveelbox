'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  Crown
} from 'lucide-react'

// ✅ TYPES TYPESCRIPT CORRIGES
interface LootBoxItem {
  id?: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  image_url?: string
  market_value?: number
}

interface LootBoxItemRelation {
  probability?: number
  items: LootBoxItem
}

interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  image_url?: string
  is_active?: boolean
  is_daily_free?: boolean
  loot_box_items?: LootBoxItemRelation[]
  items?: LootBoxItem[] // Pour les données de fallback
}

interface BadgeInfo {
  badge: string
  color: string
}

interface Feature {
  icon: any // Type pour les composants Lucide
  title: string
  description: string
}

interface Stat {
  number: string
  label: string
  icon: any
}

interface Testimonial {
  name: string
  comment: string
  rating: number
  avatar: string
}

export default function HomePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)

  // Charger les données SEULEMENT quand l'auth est prêt
  useEffect(() => {
    if (authLoading) return

    let mounted = true

    const loadBoxes = async () => {
      try {
        const supabase = createClient()
        
        const { data: boxes, error } = await supabase
          .from('loot_boxes')
          .select(`
            *,
            loot_box_items (
              probability,
              items (
                id,
                name,
                rarity,
                image_url,
                market_value
              )
            )
          `)
          .eq('is_active', true)
          .neq('is_daily_free', true)
          .order('price_virtual', { ascending: true })
          .limit(4)

        if (!mounted) return

        if (error) {
          console.error('❌ Error loading boxes:', error)
          setLootBoxes(getFallbackBoxes())
        } else if (boxes && boxes.length > 0) {
          console.log('✅ Loaded', boxes.length, 'boxes from DB')
          setLootBoxes(boxes)
        } else {
          console.log('⚠️ No boxes found, using fallback')
          setLootBoxes(getFallbackBoxes())
        }
      } catch (error) {
        if (mounted) {
          console.error('💥 Error:', error)
          setLootBoxes(getFallbackBoxes())
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadBoxes()

    return () => {
      mounted = false
    }
  }, [authLoading])

  // ✅ FONCTION TYPEE POUR DONNEES DE FALLBACK
  const getFallbackBoxes = (): LootBox[] => [
    {
      id: '1',
      name: 'GRAIL VAULT',
      description: 'La boîte ultime pour les collectionneurs.',
      price_virtual: 450,
      image_url: 'https://i.imgur.com/8YwZmtP.png',
      items: [
        { name: 'Air Jordan 1 Chicago', rarity: 'legendary' },
        { name: 'Supreme Box Logo', rarity: 'epic' },
        { name: 'Rolex Daytona', rarity: 'legendary' },
        { name: 'Off-White x Nike', rarity: 'rare' }
      ]
    },
    {
      id: '2',
      name: 'DESIGNER SERIES',
      description: 'Haute couture sneaker et collaboration.',
      price_virtual: 380,
      image_url: 'https://i.imgur.com/8YwZmtP.png',
      items: [
        { name: 'Balenciaga Triple S', rarity: 'epic' },
        { name: 'Gucci Ace', rarity: 'rare' },
        { name: 'Louis Vuitton Bag', rarity: 'epic' },
        { name: 'Prada Sneakers', rarity: 'rare' }
      ]
    },
    {
      id: '3',
      name: 'HYPED COLLECTION',
      description: 'Sneakers tendance et collaborations.',
      price_virtual: 320,
      image_url: 'https://i.imgur.com/8YwZmtP.png',
      items: [
        { name: 'Travis Scott Jordan', rarity: 'epic' },
        { name: 'Yeezy Boost 350', rarity: 'rare' },
        { name: 'Nike Dunk SB', rarity: 'rare' },
        { name: 'New Balance 550', rarity: 'common' }
      ]
    },
    {
      id: '4',
      name: 'EXCLUSIVE DROP',
      description: 'Éditions limitées et releases premium.',
      price_virtual: 280,
      image_url: 'https://i.imgur.com/8YwZmtP.png',
      items: [
        { name: 'Air Max 97', rarity: 'rare' },
        { name: 'Converse x CDG', rarity: 'rare' },
        { name: 'Vans Old Skool', rarity: 'common' },
        { name: 'Adidas Gazelle', rarity: 'common' }
      ]
    }
  ]

  // ✅ FONCTION TYPEE POUR BADGE
  const getBadgeInfo = (box: LootBox): BadgeInfo => {
    if (box.price_virtual >= 400) return { badge: 'LIMITED', color: 'bg-purple-500' }
    if (box.price_virtual >= 300) return { badge: 'HOT', color: 'bg-orange-500' }
    return { badge: 'NEW', color: 'bg-green-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // ✅ DONNEES TYPEES POUR FEATURES
  const features: Feature[] = [
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

  // ✅ DONNEES TYPEES POUR STATS
  const stats: Stat[] = [
    { number: "125K+", label: "Boîtes ouvertes", icon: Package },
    { number: "45K+", label: "Utilisateurs actifs", icon: Users },
    { number: "99.2%", label: "Satisfaction", icon: Heart },
    { number: "4.9★", label: "Note moyenne", icon: Star }
  ]

  // ✅ DONNEES TYPEES POUR TESTIMONIALS
  const testimonials: Testimonial[] = [
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge d'annonce */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200 shadow-lg mb-8"
            >
              <Sparkles className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                🎉 Nouvelles boîtes exclusives disponibles
              </span>
            </motion.div>

            {/* Titre principal */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-gray-900 mb-6"
            >
              Déballez l'
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
                Impossible
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
            >
              L'expérience d'unboxing la plus addictive au monde ! Découvrez des produits réels 
              de grandes marques avec des animations époustouflantes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <Link
                href={isAuthenticated ? "/boxes" : "/signup"}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3"
              >
                <Gift className="h-6 w-6" />
                {isAuthenticated ? "Découvrir les boîtes" : "Commencer l'aventure"}
                <ArrowRight className="h-6 w-6" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section des Boîtes */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              🎮 Nos Boîtes Iconiques
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chaque boîte contient des objets réels authentiques avec une garantie 100% ou remboursé
            </p>
          </div>

          {/* Grid des boîtes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {lootBoxes.map((box, index) => {
              const badgeInfo = getBadgeInfo(box)
              return (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                >
                  <Link href={`/boxes/${box.id}`} className="block">
                    <div className="text-center">
                      
                      {/* Badge flottant */}
                      <div className="relative mb-4">
                        <div className={`absolute -top-2 left-8 ${badgeInfo.color} text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-lg`}>
                          {badgeInfo.badge}
                        </div>
                      </div>
                      
                      {/* Boîte 3D */}
                      <motion.div 
                        className="relative mb-6"
                        whileHover={{ 
                          scale: 1.05,
                          rotateY: 8,
                          rotateX: 5
                        }}
                        style={{ perspective: '1000px' }}
                      >
                        {/* Cartes qui sortent de la boîte */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
                          <div className="flex space-x-1">
                            {(box.loot_box_items || box.items || []).slice(0, 4).map((item, cardIndex) => {
                              const itemData = 'items' in item ? item.items : item
                              const cardColors = {
                                legendary: 'bg-yellow-400 border-yellow-500',
                                epic: 'bg-purple-400 border-purple-500',
                                rare: 'bg-blue-400 border-blue-500',
                                common: 'bg-gray-400 border-gray-500'
                              }
                              const colorClass = cardColors[itemData?.rarity || 'common']
                              
                              return (
                                <motion.div
                                  key={cardIndex}
                                  animate={{
                                    y: -cardIndex * 4 - 12,
                                    rotate: (cardIndex - 1.5) * 8,
                                  }}
                                  transition={{ 
                                    delay: index * 0.1 + cardIndex * 0.05,
                                    type: "spring",
                                    stiffness: 300
                                  }}
                                  className={`w-6 h-9 ${colorClass} rounded-sm border-2 shadow-lg`}
                                />
                              )
                            })}
                          </div>
                        </div>
                        
                        {/* La boîte 3D verte AVEC IMAGE */}
                        <div 
                          className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-2xl relative overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300"
                          style={{
                            transform: 'rotateX(15deg) rotateY(-10deg)',
                            transformStyle: 'preserve-3d'
                          }}
                        >
                          {/* Image de la boîte si disponible */}
                          {box.image_url && (
                            <img 
                              src={box.image_url} 
                              alt={box.name}
                              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          )}
                          
                          {/* Face avant avec icônes (fallback si pas d'image) */}
                          <div className={`absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl ${box.image_url ? 'opacity-0' : 'opacity-100'}`}>
                            {/* Icônes sur la boîte */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="grid grid-cols-2 gap-3">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                  className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center"
                                >
                                  <Gift className="h-3 w-3 text-white" />
                                </motion.div>
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center"
                                >
                                  <Coins className="h-3 w-3 text-white" />
                                </motion.div>
                                <motion.div
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                  className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center"
                                >
                                  <Star className="h-3 w-3 text-white" />
                                </motion.div>
                                <motion.div
                                  animate={{ rotate: [0, -360] }}
                                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                  className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center"
                                >
                                  <Package className="h-3 w-3 text-white" />
                                </motion.div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Face droite pour effet 3D */}
                          <div 
                            className="absolute inset-y-0 right-0 w-8 bg-gradient-to-br from-green-500 to-green-700 rounded-r-2xl"
                            style={{
                              transform: 'rotateY(90deg) translateZ(16px)',
                              transformOrigin: 'right'
                            }}
                          />
                          
                          {/* Face du dessus */}
                          <div 
                            className="absolute inset-x-0 top-0 h-8 bg-gradient-to-br from-green-300 to-green-500 rounded-t-2xl"
                            style={{
                              transform: 'rotateX(90deg) translateZ(16px)',
                              transformOrigin: 'top'
                            }}
                          />
                        </div>
                      </motion.div>
                      
                      {/* Titre */}
                      <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                        {box.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed px-2">
                        {box.description}
                      </p>
                      
                      {/* Prix avec icône coin */}
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <Coins className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-2xl font-black text-gray-900">{box.price_virtual}</span>
                      </div>
                      
                      {/* Statut disponible */}
                      <div className="text-green-600 text-sm font-bold">
                        Disponible
                      </div>
                      
                      {/* Bouton vert au hover */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="mt-4"
                      >
                        <div className="bg-green-500 text-white py-2 px-6 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-lg">
                          <ArrowRight className="h-4 w-4" />
                          Cliquez pour ouvrir
                        </div>
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* CTA vers toutes les boîtes */}
          <div className="text-center">
            <Link
              href="/boxes"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Package className="h-6 w-6" />
              Voir toutes les boîtes
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              💎 Pourquoi ReveelBox ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              L'expérience d'unboxing la plus authentique et sécurisée
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-16 w-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section Stats */}
      <section className="py-20 bg-gradient-to-r from-green-900 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              🚀 ReveelBox en Chiffres
            </h2>
            <p className="text-xl text-green-200">
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
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-black text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-green-200 font-semibold">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              ❤️ Ils Adorent ReveelBox
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les expériences de notre communauté
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-6 rounded-2xl"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.comment}"
                </p>
                
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      {testimonial.name}
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-gray-500 text-sm">Utilisateur vérifié</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-bold text-gray-900">99.2% de satisfaction</span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="font-bold text-gray-900">Paiement sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8">
              🎁 Votre Première Surprise Vous Attend !
            </h2>
            <p className="text-xl mb-12 max-w-3xl mx-auto opacity-90">
              Rejoignez <span className="font-bold">45 000+ aventuriers</span> qui découvrent l'expérience 
              d'unboxing la plus addictive au monde ! 🌟
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href={isAuthenticated ? "/boxes" : "/signup"}
                className="bg-white text-green-600 px-8 py-4 rounded-full text-xl font-black shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3"
              >
                <Gift className="h-6 w-6" />
                {isAuthenticated ? "🚀 Ouvrir ma première boîte" : "🎯 Commencer l'aventure"}
                <ArrowRight className="h-6 w-6" />
              </Link>
              
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-white hover:text-green-600 transition-all duration-300 flex items-center gap-3"
                >
                  <Users className="h-6 w-6" />
                  J'ai déjà un compte
                </Link>
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