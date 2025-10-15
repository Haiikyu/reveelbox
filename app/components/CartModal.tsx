'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import UpgradeModal from './UpgradeModal'

interface CartItem {
  id: string
  name: string
  image_url: string
  market_value: number
  rarity: string
  quantity: number
}

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  selectedItems: string[]
  onSelectItem: (id: string) => void
  onSelectAll: () => void
  onSellSelected: () => void
  onUpgrade: () => void
  buttonRef?: React.RefObject<HTMLButtonElement>
}

export default function CartModal({
  isOpen,
  onClose,
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onSellSelected,
  onUpgrade,
  buttonRef
}: CartModalProps) {
  const router = useRouter()
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [selectedUpgradeItem, setSelectedUpgradeItem] = useState<any>(null)

  const totalValue = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.market_value * item.quantity, 0)

  const allSelected = items.length > 0 && selectedItems.length === items.length

  useEffect(() => {
    if (isOpen) {
      // Centrer le modal verticalement et horizontalement
      setPosition({
        top: window.innerHeight / 2,
        right: window.innerWidth / 2
      })
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl backdrop-blur-3xl border rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
            style={{
              backgroundColor: 'var(--hybrid-bg-elevated)',
              borderColor: 'var(--hybrid-border-default)'
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Mon Panier</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={onSelectAll}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                >
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  onClick={() => {
                    onSellSelected()
                    // Le modal sera fermé par le parent après la vente
                  }}
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 text-white text-sm font-bold rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-lg disabled:shadow-none hybrid-btn-primary-gradient disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Vendre {selectedItems.length > 0 && `(${selectedItems.length})`}
                </button>
                <button
                  onClick={() => {
                    if (selectedItems.length === 1) {
                      const item = items.find(i => i.id === selectedItems[0])
                      if (item) {
                        setSelectedUpgradeItem({
                          id: item.id,
                          item_id: item.id,
                          name: item.name,
                          image_url: item.image_url,
                          rarity: item.rarity,
                          market_value: item.market_value
                        })
                        setUpgradeModalOpen(true)
                      }
                    } else {
                      onUpgrade()
                    }
                  }}
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 text-white text-sm font-bold rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2 shadow-lg disabled:shadow-none hybrid-btn-secondary-gradient disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {selectedItems.length === 1 ? 'Upgrade' : 'Voir upgrades'}
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="p-6 overflow-y-auto max-h-96">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500 dark:text-gray-400">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedItems.includes(item.id)
                          ? 'bg-opacity-10'
                          : 'hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-800/30'
                      }`}
                      style={selectedItems.includes(item.id) ? {
                        borderColor: 'var(--hybrid-accent-primary)',
                        backgroundColor: 'var(--hybrid-accent-primary)',
                        opacity: 0.1
                      } : {
                        borderColor: 'var(--hybrid-border-default)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">x{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black" style={{ color: 'var(--hybrid-accent-primary)' }}>
                            {(item.market_value * item.quantity).toLocaleString()} coins
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Valeur totale sélectionnée</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{totalValue.toLocaleString()} coins</p>
                </div>
                <button
                  onClick={() => router.push('/inventory')}
                  className="px-6 py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 hybrid-btn-primary-gradient"
                >
                  Voir tout
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Upgrade Modal */}
          <UpgradeModal
            isOpen={upgradeModalOpen}
            onClose={() => {
              setUpgradeModalOpen(false)
              setSelectedUpgradeItem(null)
            }}
            item={selectedUpgradeItem}
            onSuccess={() => {
              // Item will be removed from cart automatically
              setUpgradeModalOpen(false)
              setSelectedUpgradeItem(null)
            }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
