'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Package, Coins, ShoppingCart, Eye, Users, Gift, Info, Sparkles } from 'lucide-react'
import { PageLayout } from '../../components/layouts/PageLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { CurrencyDisplay } from '../../components/ui/CurrencyDisplay'
import { Modal } from '../../components/ui/Modal'

// Interfaces
interface LootBoxItem {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  probability: number
  image_url: string
  market_value: number
  description?: string
}

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
  times_opened: number
  created_at: string
}

interface BoxPageParams {
  params: {
    id: string
  }
}

export default function BoxPage({ params }: BoxPageParams) {
  const [box, setBox] = useState<LootBox | null>(null)
  const [items, setItems] = useState<LootBoxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userCoins, setUserCoins] = useState(1250)
  const [isOpening, setIsOpening] = useState(false)
  const [showOpeningModal, setShowOpeningModal] = useState(false)
  const [wonItem, setWonItem] = useState<LootBoxItem | null>(null)
  const [showItemsModal, setShowItemsModal] = useState(false)

  // Simulation de données - Remplace par tes vraies données Supabase
  useEffect(() => {
    const fetchBoxData = async () => {
      // Simulation du chargement
      setTimeout(() => {
        // Données de la boîte
        setBox({
          id: params.id,
          name: 'MYSTERY SNEAKER BOX',
          description: 'Une sélection exclusive des sneakers les plus recherchées du marché. Chaque boîte contient une surprise garantie avec des chances d\'obtenir des modèles légendaires.',
          price_virtual: 150,
          price_real: 49.99,
          image_url: 'https://imgix.hypedrop.com/images/HypeDrop_70%25%20sneaker_Box_Design_Export.png?auto=format&w=500',
          is_active: true,
          rarity: 'epic',
          total_items: 12,
          most_valuable_item: 'Air Jordan 1 Chicago',
          times_opened: 1247,
          created_at: '2024-01-15'
        })

        // Items possibles dans la boîte
        setItems([
          {
            id: '1',
            name: 'Air Jordan 1 Chicago',
            rarity: 'legendary',
            probability: 5,
            image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
            market_value: 500,
            description: 'Le graal des sneakers, coloris mythique'
          },
          {
            id: '2',
            name: 'Nike Dunk Low Panda',
            rarity: 'epic',
            probability: 15,
            image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
            market_value: 250,
            description: 'Coloris iconique noir et blanc'
          },
          {
            id: '3',
            name: 'Yeezy Boost 350 V2',
            rarity: 'rare',
            probability: 25,
            image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
            market_value: 180,
            description: 'Design futuriste signé Kanye West'
          },
          {
            id: '4',
            name: 'Nike Air Force 1',
            rarity: 'common',
            probability: 55,
            image_url: 'https://www.pngarts.com/files/4/Sneaker-PNG-Image.png',
            market_value: 80,
            description: 'Le classique intemporel'
          }
        ])

        setLoading(false)
      }, 1500)
    }

    fetchBoxData()
  }, [params.id])

  const handleOpenBox = async () => {
    if (userCoins < (box?.price_virtual || 0)) return

    setIsOpening(true)
    setShowOpeningModal(true)

    // Simulation de l'ouverture avec probabilités
    setTimeout(() => {
      const random = Math.random() * 100
      let cumulativeProbability = 0
      let selectedItem: LootBoxItem | null = null

      for (const item of items) {
        cumulativeProbability += item.probability
        if (random <= cumulativeProbability) {
          selectedItem = item
          break
        }
      }

      if (selectedItem) {
        setWonItem(selectedItem)
        setUserCoins(prev => prev - (box?.price_virtual || 0))
      }

      setIsOpening(false)
    }, 3000)
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

  const getRarityBgColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-100 border-gray-300',
      rare: 'bg-blue-100 border-blue-300',
      epic: 'bg-purple-100 border-purple-300',
      legendary: 'bg-yellow-100 border-yellow-300'
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

  if (loading || !box) {
    return (
      <PageLayout title="Chargement...">
        <LoadingState size="lg" text="Chargement de la boîte mystère..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={box.name}
      subtitle={box.description}
      breadcrumb={[
        { label: 'Accueil', href: '/' },
        { label: 'Boîtes Mystères', href: '/boxes' },
        { label: box.name }
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">
          {/* Retour */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Retour aux boîtes
            </Button>
          </motion.div>

          {/* Image principale et informations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Image */}
                <div className="relative">
                  <img
                    src={box.image_url}
                    alt={box.name}
                    className="w-full h-80 md:h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(box.rarity)} opacity-20`} />
                  
                  {/* Badge rareté */}
                  <div className="absolute top-4 right-4">
                    <Badge variant={getRarityBadgeVariant(box.rarity)} size="md">
                      {box.rarity.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Informations */}
                <div className="p-8">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{box.name}</h1>
                    <p className="text-gray-600">{box.description}</p>
                  </div>

                  {/* Stats rapides */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <Package className="mx-auto mb-2 text-gray-600" size={24} />
                      <div className="text-lg font-bold text-gray-900">{box.total_items}</div>
                      <div className="text-sm text-gray-600">Items possibles</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <Users className="mx-auto mb-2 text-gray-600" size={24} />
                      <div className="text-lg font-bold text-gray-900">{box.times_opened.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Fois ouverte</div>
                    </div>
                  </div>

                  {/* Item le plus précieux */}
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="text-yellow-600" size={16} />
                      <span className="text-sm font-semibold text-yellow-800">ITEM LE PLUS PRÉCIEUX</span>
                    </div>
                    <p className="text-yellow-900 font-medium">{box.most_valuable_item}</p>
                  </div>

                  {/* Prix */}
                  <div className="flex items-center justify-between mb-6 p-4 bg-primary-50 rounded-xl">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Prix</div>
                      <div className="flex items-center gap-3">
                        <CurrencyDisplay 
                          amount={box.price_virtual} 
                          type="coins" 
                          size="lg"
                        />
                        <span className="text-gray-400">ou {box.price_real}€</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Vos coins</div>
                      <CurrencyDisplay 
                        amount={userCoins} 
                        type="coins" 
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  fullWidth
                  disabled={userCoins < box.price_virtual || !box.is_active}
                  onClick={handleOpenBox}
                  className="flex-1"
                >
                  <ShoppingCart size={20} className="mr-2" />
                  {userCoins < box.price_virtual ? 'Coins insuffisants' : 'Ouvrir cette boîte'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowItemsModal(true)}
                  className="flex-1"
                >
                  <Eye size={20} className="mr-2" />
                  Voir tous les items
                </Button>
              </div>

              {userCoins < box.price_virtual && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-800">
                    <Info size={16} />
                    <span className="text-sm font-medium">
                      Il vous manque {box.price_virtual - userCoins} coins pour ouvrir cette boîte.
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Probabilités */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Probabilités</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getRarityColor(item.rarity)}`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.rarity}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.probability}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Items récents gagnés */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Derniers items gagnés</h3>
              <div className="space-y-3">
                {items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-10 h-10 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <Badge variant={getRarityBadgeVariant(item.rarity)} size="sm">
                        {item.rarity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modal d'ouverture */}
      <Modal isOpen={showOpeningModal} onClose={() => {}}>
        <div className="text-center py-8">
          {isOpening ? (
            <div className="space-y-6">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto w-32 h-32"
              >
                <img src={box.image_url} alt="Opening box" className="w-full h-full object-contain" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ouverture en cours...</h3>
                <p className="text-gray-600">La magie opère, découvrez votre surprise !</p>
              </div>
            </div>
          ) : wonItem ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="space-y-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className={`mx-auto w-32 h-32 rounded-xl p-4 ${getRarityBgColor(wonItem.rarity)}`}
                >
                  <img src={wonItem.image_url} alt={wonItem.name} className="w-full h-full object-contain" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="text-yellow-500" size={24} />
                </motion.div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Félicitations !</h3>
                <p className="text-lg font-semibold text-primary-600 mb-1">{wonItem.name}</p>
                <Badge variant={getRarityBadgeVariant(wonItem.rarity)}>
                  {wonItem.rarity.toUpperCase()}
                </Badge>
                <p className="text-gray-600 mt-3">{wonItem.description}</p>
                
                <div className="mt-4 p-4 bg-primary-50 rounded-xl">
                  <CurrencyDisplay 
                    amount={wonItem.market_value} 
                    type="coins" 
                    size="lg"
                  />
                  <p className="text-sm text-gray-600 mt-1">Valeur de l'item</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  fullWidth
                  onClick={() => {
                    setShowOpeningModal(false)
                    setWonItem(null)
                  }}
                >
                  <Gift size={16} className="mr-2" />
                  Voir dans mon inventaire
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowOpeningModal(false)
                    setWonItem(null)
                  }}
                >
                  Fermer
                </Button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </Modal>

      {/* Modal des items */}
      <Modal 
        isOpen={showItemsModal} 
        onClose={() => setShowItemsModal(false)}
        title="Tous les items possibles"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className={`p-4 ${getRarityBgColor(item.rarity)}`}>
              <div className="flex items-center gap-4">
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-16 h-16 object-contain"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={getRarityBadgeVariant(item.rarity)} size="sm">
                      {item.rarity}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{item.probability}%</div>
                      <CurrencyDisplay amount={item.market_value} type="coins" size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </PageLayout>
  )
}