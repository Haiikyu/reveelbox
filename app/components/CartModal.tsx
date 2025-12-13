'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import UpgradeModal from './UpgradeModal'

interface CartItem {
  id: string
  item_id: string
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
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8, // 8px en dessous du bouton
        right: window.innerWidth - rect.right // Aligner le bord droit
      })
    }
  }, [isOpen, buttonRef])

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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[55]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed w-full max-w-md backdrop-blur-xl rounded-3xl bg-white/98 dark:bg-gray-800/98 shadow-2xl z-[55] max-h-[80vh] overflow-hidden"
            style={{
              border: '1px solid rgba(69, 120, 190, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(69, 120, 190, 0.1)',
              top: `${position.top}px`,
              right: `${position.right}px`
            }}
          >
            {/* Ligne de glow animée en haut */}
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-3xl">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(69, 120, 190, 0.6) 20%, rgba(69, 120, 190, 0.9) 50%, rgba(69, 120, 190, 0.6) 80%, transparent 100%)',
                  filter: 'drop-shadow(0 0 8px rgba(69, 120, 190, 0.6))'
                }}
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 2
                }}
              />
            </div>
            {/* Header */}
            <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mon Panier</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={onSelectAll}
                  className="flex-shrink-0 px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
                >
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  onClick={() => {
                    onSellSelected()
                    // Le modal sera fermé par le parent après la vente
                  }}
                  disabled={selectedItems.length === 0}
                  className="flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg disabled:shadow-none bg-gradient-to-r from-[#4578be] to-[#5989d8] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Vendre {selectedItems.length > 0 && `(${selectedItems.length})`}
                </button>
                <button
                  onClick={() => {
                    if (selectedItems.length === 1) {
                      const item = items.find(i => i.id === selectedItems[0])
                      if (item) {
                        setSelectedUpgradeItem({
                          id: item.id,
                          item_id: item.item_id,
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
                  className="flex-1 px-3 py-2 text-white text-xs font-bold rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg disabled:shadow-none bg-gradient-to-r from-[#4578be] to-[#5989d8] disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {selectedItems.length === 1 ? 'Upgrade' : 'Voir upgrades'}
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="p-4 overflow-y-auto max-h-96 bg-white/95 dark:bg-gray-800/95">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500 dark:text-gray-400">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item.id)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedItems.includes(item.id)
                          ? 'bg-[#4578be]/10 border-[#4578be]'
                          : 'hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14">
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
                          <p className="font-black text-[#4578be]">
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
            <div className="p-4 border-t border-gray-200/60 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Valeur totale sélectionnée</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{totalValue.toLocaleString()} coins</p>
                </div>
                <button
                  onClick={() => router.push('/inventory')}
                  className="px-6 py-3 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 bg-gradient-to-r from-[#4578be] to-[#5989d8]"
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
              onClose() // Ferme aussi le panier
            }}
            item={selectedUpgradeItem}
            onSuccess={() => {
              // Rafraîchir le panier et fermer les modals
              setUpgradeModalOpen(false)
              setSelectedUpgradeItem(null)
              // Désélectionner l'item
              if (selectedUpgradeItem) {
                onSelectItem(selectedUpgradeItem.id)
              }
              // Attendre un peu pour permettre à l'animation de se terminer
              setTimeout(() => {
                onClose() // Ferme le panier pour forcer un rechargement
              }, 500)
            }}
          />
        </>
      )}
    </AnimatePresence>
  )
}