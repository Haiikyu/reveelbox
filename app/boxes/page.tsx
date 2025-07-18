'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Star, Package, Coins, ShoppingCart } from 'lucide-react'
import { PageLayout } from '../components/layouts/PageLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'
import { CurrencyDisplay } from '../components/ui/CurrencyDisplay'

// Interface pour les types
interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  price_real: number
  image_url: string
  is_active: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  total_items: number
  most_valuable_item: string
}

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [userCoins, setUserCoins] = useState(1250) // Récupérer depuis Supabase

  // Simulation de données - Remplace par tes vraies données Supabase
  useEffect(() => {
    const fetchBoxes = async () => {
      // Simulation du chargement
      setTimeout(() => {
        setBoxes([
          {
            id: '1',
            name: 'MYSTERY SNEAKER BOX',
            description: 'Une sélection de sneakers exclusives des plus grandes marques',
            price_virtual: 150,
            price_real: 49.99,
            image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
            is_active: true,
            rarity: 'epic',
            total_items: 12,
            most_valuable_item: 'Air Jordan 1 Chicago'
          },
          {
            id: '2',
            name: 'LEGENDARY DROPS',
            description: 'Les sneakers les plus rares et recherchées du marché',
            price_virtual: 300,
            price_real: 99.99,
            image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
            is_active: true,
            rarity: 'legendary',
            total_items: 8,
            most_valuable_item: 'Off-White x Nike'
          },
          {
            id: '3',
            name: 'STARTER PACK',
            description: 'Parfait pour commencer votre collection',
            price_virtual: 75,
            price_real: 24.99,
            image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
            is_active: true,
            rarity: 'common',
            total_items: 15,
            most_valuable_item: 'Nike Air Force 1'
          },
          {
            id: '4',
            name: 'LIMITED EDITION',
            description: 'Éditions limitées et collaborations exclusives',
            price_virtual: 500,
            price_real: 149.99,
            image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
            is_active: true,
            rarity: 'legendary',
            total_items: 6,
            most_valuable_item: 'Travis Scott x Jordan'
          },
          {
            id: '5',
            name: 'RETRO CLASSICS',
            description: 'Les classiques intemporels revisités',
            price_virtual: 200,
            price_real: 69.99,
            image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
            is_active: true,
            rarity: 'rare',
            total_items: 10,
            most_valuable_item: 'Jordan 4 Bred'
          },
          {
            id: '6',
            name: 'STREET STYLE',
            description: 'Le style urbain à son apogée',
            price_virtual: 120,
            price_real: 39.99,
            image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
            is_active: true,
            rarity: 'rare',
            total_items: 14,
            most_valuable_item: 'Yeezy Boost 350'
          }
        ])
        setLoading(false)
      }, 1500)
    }

    fetchBoxes()
  }, [])

  const categories = [
    { value: 'all', label: 'Toutes les boîtes', count: boxes.length },
    { value: 'legendary', label: 'Légendaires', count: boxes.filter(b => b.rarity === 'legendary').length },
    { value: 'epic', label: 'Épiques', count: boxes.filter(b => b.rarity === 'epic').length },
    { value: 'rare', label: 'Rares', count: boxes.filter(b => b.rarity === 'rare').length },
    { value: 'common', label: 'Communes', count: boxes.filter(b => b.rarity === 'common').length }
  ]

  const filteredBoxes = boxes.filter(box => {
    const matchesSearch = box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         box.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || box.rarity === selectedCategory
    return matchesSearch && matchesCategory && box.is_active
  })

  const handleOpenBox = (boxId: string) => {
    // Logique d'ouverture - redirection vers la page de la boîte
    window.location.href = `/boxes/${boxId}`
  }

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityBadgeVariant = (rarity: string) => {
    const variants = {
      common: 'gray' as const,
      rare: 'primary' as const,
      epic: 'primary' as const,
      legendary: 'warning' as const
    }
    return variants[rarity as keyof typeof variants] || 'gray'
  }

  if (loading) {
    return (
      <PageLayout title="Nos Boîtes Mystères">
        <LoadingState size="lg" text="Chargement des boîtes mystères..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Nos Boîtes Mystères"
      subtitle="Découvrez des sneakers exclusives dans nos boîtes surprise"
    >
      {/* Hero Section avec Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{boxes.length}</div>
            <div className="text-primary-100">Boîtes Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">50K+</div>
            <div className="text-primary-100">Sneakers Gagnées</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CurrencyDisplay 
                amount={userCoins} 
                type="coins" 
                showIcon={true} 
                size="lg" 
              />
            </div>
            <div className="text-primary-100">Vos Coins</div>
          </div>
        </div>
      </motion.div>

      {/* Filtres et Recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher une boîte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Filtres par catégorie */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap
                    ${selectedCategory === category.value
                      ? 'bg-primary-500 text-white shadow-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {category.label}
                  <Badge variant="gray" size="sm">{category.count}</Badge>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Grille des boîtes */}
      {filteredBoxes.length === 0 ? (
        <EmptyState
          icon={<Package size={32} className="text-gray-400" />}
          title="Aucune boîte trouvée"
          description="Essayez de modifier vos critères de recherche pour découvrir nos boîtes mystères."
          action={
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}>
              Voir toutes les boîtes
            </Button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredBoxes.map((box, index) => (
            <motion.div
              key={box.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card hover className="overflow-hidden group relative">
                {/* Badge de rareté */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant={getRarityBadgeVariant(box.rarity)}>
                    {box.rarity.toUpperCase()}
                  </Badge>
                </div>

                {/* Image avec overlay gradient */}
                <div className="relative">
                  <img
                    src={box.image_url}
                    alt={box.name}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${getRarityColor(box.rarity)} opacity-20`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Nombre d'items */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2">
                      <Package size={16} />
                      <span className="text-sm font-medium">{box.total_items} items</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Titre et description */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {box.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {box.description}
                    </p>
                  </div>

                  {/* Item le plus précieux */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={14} className="text-yellow-500" />
                      <span className="text-xs font-medium text-gray-600">ITEM LE PLUS PRÉCIEUX</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{box.most_valuable_item}</p>
                  </div>

                  {/* Prix */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center gap-1">
                        <Coins size={20} className="text-primary-600" />
                        <span className="text-2xl font-bold text-primary-600">
                          {box.price_virtual}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        ou {box.price_real}€
                      </div>
                    </div>
                    
                    {/* Indicateur d'affordabilité */}
                    {userCoins >= box.price_virtual ? (
                      <Badge variant="success" size="sm">
                        Disponible
                      </Badge>
                    ) : (
                      <Badge variant="error" size="sm">
                        Coins insuffisants
                      </Badge>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="space-y-3">
                    <Button
                      fullWidth
                      disabled={userCoins < box.price_virtual}
                      onClick={() => handleOpenBox(box.id)}
                      className="group-hover:scale-105 transition-transform"
                    >
                      <ShoppingCart size={16} className="mr-2" />
                      Ouvrir cette boîte
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => window.location.href = `/boxes/${box.id}`}
                    >
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12"
      >
        <Card className="p-8 text-center bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pas assez de coins ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Rechargez votre portefeuille pour découvrir toutes nos boîtes mystères et leurs trésors cachés.
          </p>
          <Button size="lg">
            <Coins size={20} className="mr-2" />
            Acheter des coins
          </Button>
        </Card>
      </motion.div>
    </PageLayout>
  )
}