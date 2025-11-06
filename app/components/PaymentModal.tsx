'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  buttonRef?: React.RefObject<HTMLButtonElement>
}

export default function PaymentModal({ isOpen, onClose, buttonRef }: PaymentModalProps) {
  const [amount, setAmount] = useState('1000')
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [position, setPosition] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8, // 8px en dessous du bouton
        right: window.innerWidth - rect.right // Aligner le bord droit
      })
    }
  }, [isOpen, buttonRef])

  const recommendedAmounts = [
    { value: '500', label: '500 coins', bonus: '+50' },
    { value: '1000', label: '1000 coins', bonus: '+100', popular: true },
    { value: '2500', label: '2500 coins', bonus: '+300' },
    { value: '5000', label: '5000 coins', bonus: '+750' },
  ]

  const paymentMethods = [
    { id: 'card', name: 'Carte bancaire', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'crypto', name: 'Crypto', icon: '₿' },
    { id: 'paysafecard', name: 'Paysafecard', icon: '🎫' },
  ]

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed w-full max-w-lg backdrop-blur-3xl border-2 rounded-2xl shadow-2xl z-[95]"
            style={{
              borderColor: 'var(--hybrid-border-default)',
              backgroundColor: 'var(--hybrid-bg-elevated)',
              top: `${position.top}px`,
              right: `${position.right}px`
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Recharger mon compte</h2>
                  <p className="text-sm text-gray-400 mt-1">Choisissez le montant et le moyen de paiement</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Montants recommandés */}
              <div>
                <label className="block text-sm font-bold text-white mb-3">Montants recommandés</label>
                <div className="grid grid-cols-2 gap-3">
                  {recommendedAmounts.map((pkg) => (
                    <button
                      key={pkg.value}
                      onClick={() => setAmount(pkg.value)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        amount === pkg.value
                          ? 'bg-opacity-10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-800/30'
                      }`}
                      style={amount === pkg.value ? {
                        borderColor: 'var(--hybrid-accent-primary)',
                        backgroundColor: 'var(--hybrid-accent-primary)',
                        opacity: 0.1
                      } : {}}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold rounded-full">
                          POPULAIRE
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-black text-white text-lg">{pkg.label}</p>
                        <p className="text-xs font-bold" style={{ color: 'var(--hybrid-accent-primary)' }}>{pkg.bonus} bonus</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant personnalisé */}
              <div>
                <label className="block text-sm font-bold text-white mb-3">Montant personnalisé</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border-2 border-slate-700 rounded-xl text-white font-bold text-lg focus:outline-none transition-colors"
                    placeholder="1000"
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--hybrid-accent-primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = ''}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    coins
                  </span>
                </div>
              </div>

              {/* Moyens de paiement */}
              <div>
                <label className="block text-sm font-bold text-white mb-3">Moyen de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        selectedMethod === method.id
                          ? 'bg-opacity-10'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-800/30'
                      }`}
                      style={selectedMethod === method.id ? {
                        borderColor: 'var(--hybrid-accent-primary)',
                        backgroundColor: 'var(--hybrid-accent-primary)',
                        opacity: 0.1
                      } : {}}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-bold text-white text-sm">{method.name}</span>
                      {selectedMethod === method.id && (
                        <Check className="ml-auto h-5 w-5" style={{ color: 'var(--hybrid-accent-primary)' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800/50 bg-slate-950/50">
              <button
                onClick={() => {
                  // TODO: Implémenter la logique de paiement
                  alert(`Paiement de ${amount} coins via ${selectedMethod}`)
                  onClose()
                }}
                className="w-full px-6 py-4 text-white rounded-xl font-black text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 hybrid-btn-primary-gradient"
              >
                <CreditCard className="h-5 w-5" />
                Procéder au paiement
              </button>
              <p className="text-xs text-center text-gray-500 mt-3">
                Paiement sécurisé • Cryptage SSL
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
