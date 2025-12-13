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
  const [promoCode, setPromoCode] = useState('')
  const [promoValidated, setPromoValidated] = useState(false)
  const [promoError, setPromoError] = useState(false)

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [isOpen, buttonRef])

  const recommendedAmounts = [
    { value: '8.75', label: '5 €', coins: '8,75 coins' },
    { value: '17.5', label: '10 €', coins: '17,50 coins' },
    { value: '87.5', label: '50 €', coins: '87,50 coins' },
    { value: '175', label: '100 €', coins: '175,00 coins' },
    { value: '437.5', label: '250 €', coins: '437,50 coins' },
    { value: '875', label: '500 €', coins: '875,00 coins' },
  ]

  const handleValidatePromo = () => {
    if (promoCode.toLowerCase() === 'reveelbox') {
      setPromoValidated(true)
      setPromoError(false)
    } else {
      setPromoValidated(false)
      setPromoError(true)
    }
  }

  // Conversion coins vers euros (10€ = 17,50 coins)
  const coinsToEuros = (coins: number) => {
    return (coins / 1.75).toFixed(2).replace('.', ',')
  }

  const finalAmount = promoValidated ? Math.floor(parseInt(amount) * 1.05) : parseInt(amount)
  const finalEuros = coinsToEuros(finalAmount)

  const paymentMethods = [
    { id: 'card', name: 'Carte bancaire', icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/cart/Design%20sans%20titre%20(56).png' },
    { id: 'paypal', name: 'PayPal', icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/Design%20sans%20titre%20(50).png' },
    { id: 'crypto', name: 'Crypto', icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/cart/Design%20sans%20titre%20(54).png' },
    { id: 'paysafecard', name: 'Paysafecard', icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/cart/Design%20sans%20titre%20(55).png' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Style pour supprimer les flèches natives des input number */}
          <style>{`
            input[type=number]::-webkit-inner-spin-button,
            input[type=number]::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type=number] {
              -moz-appearance: textfield;
            }
          `}</style>
          
          {/* Backdrop - z-55 pour ne pas masquer la navbar (z-60) et la balance (z-70) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[55]"
          />

          {/* Modal - positionné en dessous du bouton + */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed w-full max-w-md backdrop-blur-xl rounded-3xl shadow-2xl z-[55] overflow-hidden bg-white/98 dark:bg-gray-800/98"
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
            <div className="relative p-3 border-b border-gray-200/60 dark:border-gray-700/50 bg-white/95 dark:bg-gray-800/95">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recharger mon compte</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Choisissez le montant et le moyen de paiement</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/40/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="relative p-4 space-y-4 bg-white/95 dark:bg-gray-800/95">
              {/* Montants recommandés */}
              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-white mb-2">Montants recommandés</label>
                <div className="grid grid-cols-3 gap-2">
                  {recommendedAmounts.map((pkg) => (
                    <motion.button
                      key={pkg.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAmount(pkg.value)}
                      className={`relative p-2 rounded-xl border-2 transition-all duration-300 ${
                        amount === pkg.value
                          ? 'bg-[#4578be]/10 border-[#4578be] shadow-lg'
                          : 'border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/40'
                      }`}
                      style={amount === pkg.value ? {
                        boxShadow: '0 0 16px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      } : {}}
                    >
                      <div className="text-center">
                        <p className={`font-bold text-sm ${amount === pkg.value ? 'text-[#4578be]' : 'text-gray-700 dark:text-gray-300'}`}>
                          {pkg.label}
                        </p>
                        <p className={`text-sm mt-0.5 font-semibold ${amount === pkg.value ? 'text-[#4578be]' : 'text-gray-500 dark:text-gray-400'}`}>
                          {pkg.coins}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Montant personnalisé */}
              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-white mb-2">Montant personnalisé</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white font-bold text-base focus:outline-none focus:border-[#4578be] transition-all duration-300 pr-56 pl-12"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  {/* Boutons + et - custom */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAmount(String(Math.max(0, parseInt(amount || '0') + 10)))}
                      className="w-6 h-4 flex items-center justify-center bg-[#4578be]/10 hover:bg-[#4578be]/20 rounded border border-[#4578be]/30 transition-all"
                    >
                      <svg className="w-3 h-3 text-[#4578be]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAmount(String(Math.max(0, parseInt(amount || '0') - 10)))}
                      className="w-6 h-4 flex items-center justify-center bg-[#4578be]/10 hover:bg-[#4578be]/20 rounded border border-[#4578be]/30 transition-all"
                    >
                      <svg className="w-3 h-3 text-[#4578be]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.button>
                  </div>
                  
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {amount && !isNaN(parseInt(amount)) && parseInt(amount) > 0 && (
                      <span className="text-[#4578be] text-base font-bold">
                        ≈ {coinsToEuros(parseInt(amount))} €
                      </span>
                    )}
                    <img 
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" 
                      alt="coins" 
                      className="h-5 w-5"
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">coins</span>
                  </div>
                </div>
              </div>

              {/* Code promo */}
              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-white mb-2">Code promo</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value)
                        setPromoError(false)
                      }}
                      disabled={promoValidated}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white font-bold text-base focus:outline-none focus:border-[#4578be] transition-all duration-300 uppercase disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                      style={{
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                      }}
                      placeholder=""
                    />
                  </div>
                  {!promoValidated && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleValidatePromo}
                      disabled={!promoCode}
                      className="px-4 py-2 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        boxShadow: '0 4px 12px rgba(69, 120, 190, 0.3)'
                      }}
                    >
                      Valider
                    </motion.button>
                  )}
                </div>
                {promoValidated && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    +5% bonus appliqué ! Vous recevrez <span className="text-[#4578be]">{finalAmount} coins</span> <span className="text-[#4578be] font-semibold">({finalEuros} €)</span>
                  </motion.p>
                )}
                {promoError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 font-bold mt-2"
                  >
                    Code promo non valable ou plus valable
                  </motion.p>
                )}
              </div>

              {/* Moyens de paiement */}
              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-white mb-2">Moyen de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
                        selectedMethod === method.id
                          ? 'bg-[#4578be]/10 border-[#4578be] shadow-lg'
                          : 'border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/40'
                      }`}
                      style={selectedMethod === method.id ? {
                        boxShadow: '0 0 16px rgba(69, 120, 190, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      } : {}}
                    >
                      <img src={method.icon} alt={method.name} className="w-10 h-10 object-contain" />
                      <span className={`font-bold text-sm flex-1 text-left ${selectedMethod === method.id ? 'text-gray-900' : 'text-gray-700 dark:text-gray-300'}`}>
                        {method.name}
                      </span>
                      {selectedMethod === method.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <Check className="h-5 w-5 text-[#4578be]" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative p-4 border-t border-gray-200/60 bg-gray-50/50 dark:bg-gray-700/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  alert(`Paiement de ${finalAmount} coins via ${selectedMethod}${promoValidated ? ' (code promo REVEELBOX appliqué)' : ''}`)
                  onClose()
                }}
                className="w-full px-5 py-3 text-white rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group bg-gradient-to-r from-[#4578be] to-[#5989d8]"
                style={{
                  boxShadow: '0 4px 16px rgba(69, 120, 190, 0.4), 0 0 24px rgba(69, 120, 190, 0.15)'
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                />
                <CreditCard className="h-5 w-5 relative z-10" />
                <span className="relative z-10">Procéder au paiement</span>
              </motion.button>
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