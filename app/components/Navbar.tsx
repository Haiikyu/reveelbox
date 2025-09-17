'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { 
  Gift, Package, Sword, Users, Mail, User, LogOut, Coins, X, 
  ShoppingCart, Star, Crown, Eye, Clock, Sparkles, Plus, ChevronDown, 
  Monitor, Sun, Moon, Shield, TrendingUp, Gamepad2, Home, Settings,
  CreditCard, Wallet, Check, ArrowUpCircle
} from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useTheme } from './ThemeProvider'

// Types
interface InventoryItem {
  id: string
  quantity: number
  obtained_at: string
  items: {
    id: string
    name: string
    image_url: string
    rarity: string
    market_value: number
  } | null
}

const UpgradeModal = dynamic(() => import('@/app/components/UpgradeModal'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-white">Chargement...</div>
    </div>
  )
})


// Effet de particules pour rendre la navbar plus vivante
const ParticleEffect = () => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const createParticle = () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: -5,
      opacity: Math.random() * 0.5 + 0.2,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 1
    })

    const initialParticles = Array.from({ length: 8 }, createParticle)
    setParticles(initialParticles)

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y + particle.speed,
          opacity: particle.y > 100 ? 0 : particle.opacity
        })).filter(particle => particle.y < 120)
      )
      
      if (Math.random() > 0.7) {
        setParticles(prev => [...prev, createParticle()])
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute bg-emerald-400 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity
          }}
          animate={{
            y: [0, 20],
            opacity: [particle.opacity, 0]
          }}
          transition={{
            duration: 3,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

// Wrapper pour créer l'espacement derrière la navbar
export const PageWrapper = ({ children, className = "" }) => {
  return (
    <div className={`pt-24 ${className}`}>
      {children}
    </div>
  )
}

// COMPOSANT MENU DE RECHARGE COMPLÈTEMENT REFAIT
const RechargeMenu = ({ isOpen, setIsOpen, router }) => {
  const menuRef = useRef(null)
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setIsOpen])

  const predefinedAmounts = [
    { euros: 5, coins: 500, bonus: 0, isPopular: false },
    { euros: 10, coins: 1000, bonus: 100, isPopular: false },
    { euros: 25, coins: 2500, bonus: 300, isPopular: true },
    { euros: 50, coins: 5000, bonus: 750, isPopular: false },
    { euros: 100, coins: 10000, bonus: 2000, isPopular: false },
    { euros: 250, coins: 25000, bonus: 6000, isPopular: false }
  ]

  const paymentMethods = [
    { 
      id: 'card', 
      name: 'Carte Bancaire', 
      icon: CreditCard, 
      description: 'Visa, Mastercard, Amex',
      fees: 'Aucuns frais'
    },
    { 
      id: 'paypal', 
      name: 'PayPal', 
      icon: Wallet, 
      description: 'Compte PayPal',
      fees: 'Aucuns frais'
    },
    { 
      id: 'apple', 
      name: 'Apple Pay', 
      icon: '🍎', 
      description: 'Touch ID / Face ID',
      fees: 'Aucuns frais'
    },
    { 
      id: 'google', 
      name: 'Google Pay', 
      icon: '🔵', 
      description: 'Compte Google',
      fees: 'Aucuns frais'
    }
  ]

  const handlePurchase = async () => {
    if (!isValidPurchase()) return
    
    setIsProcessing(true)
    const amount = selectedAmount?.euros || parseInt(customAmount)
    
    try {
      // Redirection vers la page de paiement
      setIsOpen(false)
      router.push(`/buy-coins?amount=${amount}&method=${selectedPayment}&coins=${getTotalCoins()}`)
    } catch (error) {
      console.error('Erreur lors du paiement:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getTotalCoins = () => {
    if (selectedAmount) {
      return selectedAmount.coins + selectedAmount.bonus
    }
    if (customAmount) {
      const euros = parseInt(customAmount)
      return euros * 100 // 1€ = 100 coins par défaut
    }
    return 0
  }

  const getSelectedEuros = () => {
    return selectedAmount?.euros || parseInt(customAmount) || 0
  }

  const isValidPurchase = () => {
    return (selectedAmount || (customAmount && parseInt(customAmount) >= 1)) && selectedPayment
  }

  return (
    <div className="relative" ref={menuRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-4 w-[450px] 
                       bg-white/95 dark:bg-slate-800/95 backdrop-blur-3xl 
                       border border-white/30 dark:border-slate-700/50 
                       rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 dark:from-emerald-900/20 dark:to-blue-900/20 border-b border-white/20 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Recharger des Coins</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Achetez des coins pour ouvrir des boîtes</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Montants prédéfinis */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Choisissez un montant</h4>
                <div className="grid grid-cols-3 gap-3">
                  {predefinedAmounts.map((amount) => (
                    <button
                      key={amount.euros}
                      onClick={() => { setSelectedAmount(amount); setCustomAmount('') }}
                      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        selectedAmount?.euros === amount.euros 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 scale-105 shadow-lg' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300'
                      }`}
                    >
                      {amount.isPopular && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                          POPULAIRE
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-lg font-black text-gray-900 dark:text-white">{amount.euros}€</div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {amount.coins.toLocaleString()} coins
                        </div>
                        {amount.bonus > 0 && (
                          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-1">
                            +{amount.bonus} BONUS
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant personnalisé */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Ou saisissez un montant</h4>
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                    placeholder="Montant en euros"
                    className="w-full px-4 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
                    min="1"
                    max="1000"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">€</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Minimum 1€ • Maximum 1000€ • 1€ = 100 coins</p>
              </div>

              {/* Récapitulatif */}
              {(selectedAmount || customAmount) && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-bold text-gray-900 dark:text-white">Total :</span>
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                        alt="Coins" 
                        className="h-6 w-6" 
                      />
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-xl">
                        {getTotalCoins().toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {selectedAmount?.bonus > 0 && (
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-bold mt-1">
                      Inclus {selectedAmount.bonus} coins bonus gratuits !
                    </div>
                  )}
                </div>
              )}

              {/* Méthodes de paiement */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Méthode de paiement</h4>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        disabled={!selectedAmount && !customAmount}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                          selectedPayment === method.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 scale-[1.02]'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        } ${
                          !selectedAmount && !customAmount 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:border-emerald-300 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                          {typeof method.icon === 'string' ? (
                            <span className="text-2xl">{method.icon}</span>
                          ) : (
                            <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-gray-900 dark:text-white">{method.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{method.description}</div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{method.fees}</div>
                        </div>
                        {selectedPayment === method.id && (
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bouton de paiement */}
              <button
                onClick={handlePurchase}
                disabled={!isValidPurchase() || isProcessing}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 ${
                  isValidPurchase() && !isProcessing
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl hover:scale-105'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessing 
                  ? 'Redirection...' 
                  : !selectedAmount && !customAmount 
                  ? 'Choisissez un montant' 
                  : !selectedPayment 
                  ? 'Sélectionnez un moyen de paiement' 
                  : `Payer ${getSelectedEuros()}€ • ${getTotalCoins().toLocaleString()} coins`
                }
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🔒 Paiement 100% sécurisé par Stripe • Aucune donnée bancaire conservée
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// COMPOSANT PANIER AVEC UPGRADE AJOUTÉ ET COULEURS CORRIGÉES
const CartDropdown = ({ cartItems, cartLoading, setCartOpen, router }) => {
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isProcessingSell, setIsProcessingSell] = useState(false)
  const dropdownRef = useRef(null)
const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
const [selectedUpgradeItem, setSelectedUpgradeItem] = useState<any>(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setCartOpen])

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)))
    }
    setSelectAll(!selectAll)
  }

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getRarityGradient = (rarity) => {
    const gradients = {
      legendary: 'from-yellow-400 via-orange-500 to-red-500',
      epic: 'from-purple-400 via-pink-500 to-purple-600',
      rare: 'from-blue-400 via-cyan-500 to-blue-600',
      uncommon: 'from-green-400 via-emerald-500 to-green-600',
      common: 'from-gray-400 via-gray-500 to-gray-600'
    }
    return gradients[rarity?.toLowerCase()] || gradients.common
  }

  const selectedValue = cartItems
    .filter(item => selectedItems.has(item.id))
    .reduce((total, item) => total + (item.items?.market_value || 0), 0)

  const handleViewInventory = () => {
    setCartOpen(false)
    router.push('/inventory')
  }

  // Fonction pour vendre les items sélectionnés
  const handleSellSelected = async () => {
    if (selectedItems.size === 0 || isProcessingSell) return
    
    setIsProcessingSell(true)
    const supabase = createClient()
    
    try {
      // Appel de la fonction RPC pour vendre plusieurs items
      const itemIds = Array.from(selectedItems)
      const { data, error } = await supabase.rpc('sell_multiple_items_fixed', {
        p_inventory_item_ids: itemIds
      })

      if (error) {
        console.error('Erreur lors de la vente:', error)
        // Afficher un message d'erreur à l'utilisateur
        return
      }

      // Succès - réinitialiser les sélections
      setSelectedItems(new Set())
      setSelectAll(false)
      
      // Recharger la page ou actualiser les données
      window.location.reload()
      
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsProcessingSell(false)
    }
  }

const handleUpgradeSelected = () => {
  if (selectedItems.size === 0) return
  
  // Récupérer les items sélectionnés
  const selectedItemsArray = Array.from(selectedItems)
  
  if (selectedItemsArray.length === 1) {
    // Si un seul item est sélectionné, ouvrir directement le modal
    const itemId = selectedItemsArray[0]
    const item = cartItems.find(i => i.id === itemId)
    
    if (item && item.items) {
      setSelectedUpgradeItem({
        id: item.id,
        item_id: item.items.id,
        name: item.items.name,
        image_url: item.items.image_url,
        rarity: item.items.rarity,
        market_value: item.items.market_value,
        quantity: item.quantity || 1
      })
      setUpgradeModalOpen(true)
      // Ne pas fermer le panier immédiatement, laisser le modal s'ouvrir
    }
  } else {
    // Si plusieurs items sont sélectionnés
    alert('Veuillez sélectionner un seul objet pour l\'upgrade')
  }
}

  return (
    <>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="absolute top-full right-0 mt-4 w-[420px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-3xl border border-white/30 dark:border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 dark:from-emerald-900/20 dark:to-blue-900/20 border-b border-white/20 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Mon Inventaire</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {cartItems.length} objet{cartItems.length !== 1 ? 's' : ''} dans votre collection
              </p>
            </div>
            <button 
              onClick={() => setCartOpen(false)} 
              className="p-2 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {cartItems.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedItems.size > 0 && (
                  <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    {selectedItems.size} sélectionnés
                  </div>
                )}
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={selectAll} 
                  onChange={toggleSelectAll} 
                  className="sr-only" 
                />
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
                  selectAll 
                    ? 'bg-emerald-500 border-emerald-500 shadow-lg' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                }`}>
                  {selectAll && (
                    <Check className="w-4 h-4 text-white font-bold" />
                  )}
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Tout sélectionner
                </span>
              </label>
            </div>
          )}
        </div>

        {cartLoading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Chargement de votre inventaire...</p>
          </div>
        ) : cartItems.length > 0 ? (
          <>
            <div className="max-h-80 overflow-y-auto">
              {cartItems.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`flex items-center gap-4 p-4 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all border-b border-white/10 dark:border-slate-700/30 last:border-b-0 cursor-pointer group ${
                    selectedItems.has(item.id) 
                      ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500' 
                      : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all group-hover:scale-110 ${
                    selectedItems.has(item.id) 
                      ? 'bg-emerald-500 border-emerald-500 shadow-lg' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    {selectedItems.has(item.id) && (
                      <Check className="w-4 h-4 text-white font-bold" />
                    )}
                  </div>

                  <div className={`relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br ${getRarityGradient(item.items?.rarity)} p-0.5 group-hover:scale-105 transition-transform`}>
                    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                      {item.items?.image_url ? (
                        <img 
                          src={item.items.image_url} 
                          alt={item.items.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-black text-gray-900 dark:text-white text-sm">
                      {item.items?.name || 'Objet mystère'}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize font-bold">
                      {item.items?.rarity || 'Common'}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <img 
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                        alt="Coins" 
                        className="h-4 w-4" 
                      />
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {item.items?.market_value || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border-t border-white/20 dark:border-slate-700/50">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <button 
                  onClick={handleViewInventory}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-3 rounded-2xl transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Eye className="h-4 w-4" />
                  Voir tout
                </button>
                
                <button 
                  disabled={selectedItems.size === 0}
                  onClick={handleUpgradeSelected}
                  className={`py-3 rounded-2xl transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg ${
                    selectedItems.size > 0 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white hover:scale-105 hover:shadow-xl' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Upgrade
                </button>
              </div>
              
              {selectedItems.size > 0 && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-200">
                      Valeur totale sélectionnée :
                    </span>
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                        alt="Coins" 
                        className="h-5 w-5" 
                      />
                      <span className="font-black text-emerald-900 dark:text-emerald-100 text-lg">
                        {selectedValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h4 className="font-black text-gray-900 dark:text-white mb-2 text-lg">Inventaire vide</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              Ouvrez des boîtes mystères pour découvrir des objets incroyables !
            </p>
            <button 
              onClick={() => { setCartOpen(false); router.push('/boxes') }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-2xl transition-all text-sm font-bold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Gift className="h-5 w-5" />
              Découvrir les boîtes
            </button>
          </div>
        )}
      </motion.div>

      {/* Modal Upgrade */}
      {upgradeModalOpen && selectedUpgradeItem && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => {
            setUpgradeModalOpen(false)
            setSelectedUpgradeItem(null)
            // Recharger l'inventaire après upgrade
            window.location.reload()
          }}
          item={selectedUpgradeItem}
          onSuccess={(newValue) => {
            console.log('Upgrade réussi ! Nouvelle valeur :', newValue)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

// COMPOSANT LOGO COMPACT
const Logo = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center space-x-2"
    >
      <Link href="/" className="flex items-center space-x-2">
        <img 
          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/04aa1ec8-45f4-4ddf-83d9-14b50138c5b9-removebg-preview%20(1).png" 
          alt="ReveelBox" 
          className="h-11 w-11 object-contain"
        />
        <span 
          className="text-3xl font-black tracking-tight hidden sm:block uppercase" 
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif', 
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '-0.02em'
          }}
        >
          REVEELBOX
        </span>
      </Link>
    </motion.div>
  )
}

// COMPOSANT MENU UTILISATEUR
const UserMenu = ({ userProfile, isOpen, setIsOpen, router, signOut, theme, setTheme, resolvedTheme, isAdmin }) => {
  const menuRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setIsOpen])

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const handleMenuClick = (href) => {
    setIsOpen(false)
    router.push(href)
  }

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all"
      >
        {userProfile?.avatar_url ? (
          <img src={userProfile.avatar_url} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-white" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-4 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 rounded-3xl shadow-2xl py-2 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/20 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 dark:from-emerald-900/20 dark:to-blue-900/20">
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">{userProfile?.username || 'Utilisateur'}</p>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="Coins" className="h-4 w-4" />
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300">{userProfile?.virtual_currency?.toLocaleString() || '0'}</span>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black">Niveau {userProfile?.level || 1}</span>
              </div>
            </div>
            
            <button onClick={() => handleMenuClick('/profile')} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-300 w-full text-left transition-all group">
              <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Mon Profil</span>
            </button>
            
            <button onClick={() => handleMenuClick('/inventory')} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-300 w-full text-left transition-all group">
              <Package className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Inventaire</span>
            </button>
            
            <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4" />
                  <span className="font-bold">Thème</span>
                </div>
                
                <button onClick={toggleTheme} className="relative focus:outline-none group">
                  <motion.div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                    resolvedTheme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-orange-400 to-yellow-400'
                  }`}>
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center"
                      animate={{ x: resolvedTheme === 'dark' ? 20 : 0, rotate: resolvedTheme === 'dark' ? 360 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <AnimatePresence mode="wait">
                        {resolvedTheme === 'dark' ? (
                          <Moon className="h-2.5 w-2.5 text-blue-600" key="moon" />
                        ) : (
                          <Sun className="h-2.5 w-2.5 text-orange-500" key="sun" />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                </button>
              </div>
            </div>
            
            {isAdmin && (
              <button onClick={() => handleMenuClick('/admin')} className="flex items-center gap-3 px-4 py-3 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full text-left transition-all border-t border-white/20 group">
                <Shield className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="font-bold">Panel Admin</span>
              </button>
            )}
            
            <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-all group">
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Déconnexion</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// COMPOSANT BLOC CENTRAL CENTRÉ
const CentralBlock = ({ userProfile, cartItems, gamesMenuOpen, setGamesMenuOpen, pathname, router, isAuthenticated, cartOpen, setCartOpen, cartLoading }) => {
  const [rechargeMenuOpen, setRechargeMenuOpen] = useState(false)
  const gamesMenuRef = useRef(null)
  const cartRef = useRef(null)

  const navItems = [
    { href: '/boxes', label: 'Unboxing', icon: Package },
    { href: '/battle', label: 'Battles', icon: Sword },
    { href: '/games', label: 'Games', icon: Gamepad2, hasDropdown: true },
    { href: '/affiliates', label: 'Affiliés', icon: Users },
    { href: '/freedrop', label: 'Free Drop', icon: Gift, highlight: true }
  ]

  const gamesDropdownItems = [
    { href: '/games/crash', label: 'Crash Game', icon: TrendingUp, description: 'Multipliez vos gains' },
    { href: '/games/roulette', label: 'Roulette', icon: Crown, description: 'Tentez votre chance', isComingSoon: true },
    { href: '/games/coinflip', label: 'Coinflip', icon: Coins, description: 'Pile ou face', isComingSoon: true },
    { href: '/games/blackjack', label: 'Blackjack', icon: Star, description: 'Jeu de cartes', isComingSoon: true }
  ]

  const handleNavClick = (href) => {
    if (gamesMenuOpen) setGamesMenuOpen(false)
    router.push(href)
  }

  const handleGameClick = (href, isComingSoon) => {
    if (!isComingSoon) {
      setGamesMenuOpen(false)
      router.push(href)
    }
  }

  return (
    <div className="flex-1 flex justify-center mx-4">
      <div className="w-full max-w-5xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl 
                      border border-white/30 dark:border-slate-700/50 
                      rounded-3xl shadow-xl px-6 py-4 relative overflow-visible">
        {/* Effet de particules */}
        <ParticleEffect />
        
        <div className="flex items-center justify-between relative z-10">
          
          {/* Navigation principale */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href === '/games' && pathname.startsWith('/games'))
              
              if (item.hasDropdown) {
                return (
                  <div key={item.href} className="relative" ref={gamesMenuRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setGamesMenuOpen(!gamesMenuOpen)}
                      className={`px-4 py-2.5 rounded-2xl transition-all duration-300 flex items-center gap-2 ${
                        isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-lg'
                          : 'text-gray-700 dark:text-gray-100 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-bold text-sm">{item.label}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${gamesMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {gamesMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute top-full mt-2 left-0 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 rounded-2xl shadow-2xl py-2 overflow-hidden"
                        >
                          {gamesDropdownItems.map((gameItem) => {
                            const GameIcon = gameItem.icon
                            return (
                              <button
                                key={gameItem.href}
                                onClick={() => handleGameClick(gameItem.href, gameItem.isComingSoon)}
                                className={`flex items-center gap-4 px-4 py-3 w-full transition-all group ${
                                  gameItem.isComingSoon
                                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:scale-105'
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${
                                  gameItem.isComingSoon
                                    ? 'bg-gray-100/50 dark:bg-gray-700/50'
                                    : 'bg-emerald-100/50 dark:bg-emerald-900/30'
                                }`}>
                                  <GameIcon className={`h-5 w-5 ${
                                    gameItem.isComingSoon
                                      ? 'text-gray-400 dark:text-gray-500'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`} />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{gameItem.label}</span>
                                    {gameItem.isComingSoon && (
                                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">BIENTÔT</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{gameItem.description}</p>
                                </div>
                              </button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }
              
              return (
                <motion.button
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(item.href)}
                  className={`px-4 py-2.5 rounded-2xl transition-all duration-300 flex items-center gap-2 ${
                    item.highlight
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl'
                      : isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-lg'
                      : 'text-gray-700 dark:text-gray-100 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-bold text-sm">{item.label}</span>
                </motion.button>
              )
            })}
          </div>

          {/* Version mobile condensée */}
          <div className="flex lg:hidden items-center space-x-2">
            {navItems.slice(0, 3).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <motion.button
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavClick(item.href)}
                  className={`p-2.5 rounded-2xl transition-all duration-300 ${
                    item.highlight
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-lg'
                      : 'text-gray-700 dark:text-gray-100 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </motion.button>
              )
            })}
          </div>

          {/* Balance utilisateur et panier */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl px-4 py-2 border border-white/30 dark:border-slate-700/50 shadow-lg">
                <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="Coins" className="h-5 w-5" />
                <span className="font-black text-sm text-gray-900 dark:text-white">{userProfile?.virtual_currency?.toLocaleString() || '0'}</span>
                <div className="relative">
                  <RechargeMenu isOpen={rechargeMenuOpen} setIsOpen={setRechargeMenuOpen} router={router} />
                  <button
                    onClick={() => setRechargeMenuOpen(!rechargeMenuOpen)}
                    className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full transition-all shadow-lg hover:scale-110"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="relative" ref={cartRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCartOpen(!cartOpen)}
                  className="relative p-2.5 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-300 border border-white/30 dark:border-slate-700/50 shadow-lg"
                >
                  <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                  {cartItems?.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs rounded-full flex items-center justify-center font-black shadow-lg"
                    >
                      {cartItems.length}
                    </motion.span>
                  )}
                </motion.button>
                
                <AnimatePresence>
                  {cartOpen && (
                    <CartDropdown 
                      cartItems={cartItems} 
                      cartLoading={cartLoading}
                      setCartOpen={setCartOpen}
                      router={router}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Connexion
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg transition-all duration-200 shadow-md hover:scale-105">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// COMPOSANT PRINCIPAL NAVBAR
export default function ReveelBoxNavbar() {
  const { user, profile, refreshProfile, signOut, isAuthenticated, loading } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showNavbar, setShowNavbar] = useState(true)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@reveelbox.com'

  // Gestion du scroll avec navbar qui se cache/montre
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Fermer les menus lors du scroll vers le bas
      if (currentScrollY > lastScrollY) {
        setUserMenuOpen(false)
        setCartOpen(false)
        setGamesMenuOpen(false)
      }
      
      // Masquer/afficher la navbar selon le scroll
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setShowNavbar(false)
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setShowNavbar(true)
      }
      
      setIsScrolled(currentScrollY > 20)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Chargement de l'inventaire pour le panier
  useEffect(() => {
    const loadCartItems = async () => {
      if (!isAuthenticated || !user) {
        setCartItems([])
        return
      }

      try {
        setCartLoading(true)
        
        const { data: inventory, error } = await supabase
          .from('user_inventory')
          .select(`
            id,
            quantity,
            obtained_at,
            items (
              id,
              name,
              image_url,
              rarity,
              market_value
            )
          `)
          .eq('user_id', user.id)
          .eq('is_sold', false)
          .order('obtained_at', { ascending: false })
          .limit(15)

        if (error) {
          console.error('Erreur chargement inventaire:', error.message)
          return
        }

        setCartItems((inventory || []).map(item => ({
          id: item.id,
          quantity: item.quantity,
          obtained_at: item.obtained_at,
          items: item.items || null
        })))
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setCartLoading(false)
      }
    }

    loadCartItems()

    // Écoute des changements en temps réel sur l'inventaire
    if (isAuthenticated && user) {
      const channel = supabase
        .channel('inventory-changes')  
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_inventory', 
          filter: `user_id=eq.${user.id}` 
        }, () => {
          loadCartItems()
        })
        .subscribe()

      return () => supabase.removeChannel(channel)
    }
  }, [isAuthenticated, user, supabase])

  if (loading) return null

  return (
    <>
      <AnimatePresence>
        {showNavbar && (
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 p-4"
          >
            
            {/* Logo à gauche */}
            <Logo />
            
            {/* Section centrale */}
            <CentralBlock 
              userProfile={profile}
              cartItems={cartItems}
              gamesMenuOpen={gamesMenuOpen}
              setGamesMenuOpen={setGamesMenuOpen}
              pathname={pathname}
              router={router}
              isAuthenticated={isAuthenticated}
              cartOpen={cartOpen}
              setCartOpen={setCartOpen}
              cartLoading={cartLoading}
            />
            
            {/* Menu utilisateur à droite */}
            {isAuthenticated ? (
              <UserMenu 
                userProfile={profile}
                isOpen={userMenuOpen}
                setIsOpen={setUserMenuOpen}
                router={router}
                signOut={signOut}
                theme={theme}
                setTheme={setTheme}
                resolvedTheme={resolvedTheme}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Connexion
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/signup" className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-sm font-bold hover:shadow-lg transition-all duration-200 shadow-md">
                    S'inscrire
                  </Link>
                </motion.div>
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}