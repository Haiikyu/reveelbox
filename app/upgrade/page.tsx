'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Loader2, TrendingUp, AlertCircle, Trophy, Sparkles, Zap } from 'lucide-react'

interface InventoryItem {
  id: string
  items: {
    id: string
    name: string
    image_url?: string
    rarity: string
    market_value: number
  } | null
}

export default function UpgradePage() {
  const { user, loading: authLoading, isAuthenticated, profile, refreshProfile } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [selectedMultiplier, setSelectedMultiplier] = useState(2)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  // États pour la roulette
  const [rouletteSegments, setRouletteSegments] = useState<boolean[]>([])
  const [roulettePosition, setRoulettePosition] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const quickMultipliers = [1.5, 2, 3, 5, 10, 20, 50, 100]

  const calculateSuccessRate = (multiplier: number) => {
    return Math.max(1, Math.min(95, 90 / multiplier))
  }

  const successRate = calculateSuccessRate(selectedMultiplier)

  // Créer les segments de la roulette
  useEffect(() => {
    const baseSegments: boolean[] = []
    for (let i = 0; i < 100; i++) {
      baseSegments.push(i < successRate)
    }
    
    // Mélanger
    for (let i = baseSegments.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [baseSegments[i], baseSegments[j]] = [baseSegments[j], baseSegments[i]]
    }

    // Répéter 5 fois
    const repeated = [...baseSegments, ...baseSegments, ...baseSegments, ...baseSegments, ...baseSegments]
    setRouletteSegments(repeated)
  }, [successRate])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated && user) {
      loadInventory()
    }
  }, [authLoading, isAuthenticated, user])

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          id,
          items (
            id,
            name,
            image_url,
            rarity,
            market_value
          )
        `)
        .eq('user_id', user!.id)
        .eq('is_sold', false)
        .order('obtained_at', { ascending: false })

      if (error) throw error
      setInventory((data as any) || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityConfig = (rarity: string) => {
    const configs: Record<string, { gradient: string; glow: string }> = {
      common: { gradient: 'from-gray-400 to-gray-600', glow: 'shadow-gray-500/30' },
      rare: { gradient: 'from-blue-400 to-blue-600', glow: 'shadow-blue-500/40' },
      epic: { gradient: 'from-purple-400 to-purple-600', glow: 'shadow-purple-500/40' },
      legendary: { gradient: 'from-yellow-400 via-orange-500 to-red-500', glow: 'shadow-yellow-500/50' },
      mythic: { gradient: 'from-cyan-400 via-pink-500 to-purple-600', glow: 'shadow-pink-500/50' },
    }
    return configs[rarity?.toLowerCase()] || configs.common
  }

  const handleUpgrade = async () => {
    if (!selectedItem?.items || !user || isUpgrading) return

    setIsUpgrading(true)
    setShowResult(false)
    setIsAnimating(true)

    try {
      const targetValue = selectedItem.items.market_value * selectedMultiplier
      const willWin = Math.random() * 100 < successRate

      // Trouver un segment correspondant
      const segmentWidth = 420
      const validSegments: number[] = []
      for (let i = 200; i <= 300; i++) {
        if (rouletteSegments[i] === willWin) {
          validSegments.push(i)
        }
      }

      let targetIndex = validSegments.length > 0 
        ? validSegments[Math.floor(Math.random() * validSegments.length)]
        : 250

      const finalPos = -(targetIndex * segmentWidth) + (window.innerWidth / 2) - (segmentWidth / 2)
      setRoulettePosition(finalPos)

      // Attendre l'animation
      await new Promise(resolve => setTimeout(resolve, 20000))

      // Backend
      const { error: deleteError } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', selectedItem.id)

      if (deleteError) throw deleteError

      if (willWin) {
        const newCoins = (profile?.virtual_currency || 0) + targetValue
        await supabase
          .from('profiles')
          .update({ virtual_currency: newCoins })
          .eq('id', user.id)
      }

      await supabase.from('user_upgrades').insert({
        user_id: user.id,
        inventory_item_id: selectedItem.id,
        item_id: selectedItem.items.id,
        item_name: selectedItem.items.name,
        original_value: selectedItem.items.market_value,
        multiplier: selectedMultiplier,
        target_value: targetValue,
        success: willWin,
        final_value: willWin ? targetValue : 0
      })

      setUpgradeSuccess(willWin)
      setIsAnimating(false)
      setShowResult(true)

      await refreshProfile()
      await loadInventory()
    } catch (error) {
      console.error('Erreur upgrade:', error)
      setIsAnimating(false)
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleCloseResult = () => {
    setShowResult(false)
    setSelectedItem(null)
    setSelectedMultiplier(2)
    setRoulettePosition(0)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-[#4578be]" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="h-screen bg-[#1a1f2e] pt-20 pb-4 overflow-hidden flex flex-col">
      
      {/* Animation CSS pour le shine effect */}
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      
      {/* Ligne bleue animée */}
      <motion.div
        className="absolute top-16 left-0 h-1 bg-gradient-to-r from-[#4578be] to-[#5989d8]"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.8 }}
      />

      {/* Roulette EN HAUT - TOUJOURS VISIBLE (40%) */}
      <div className="h-[40%] px-[5%] flex flex-col justify-center">
        <div className="relative mx-auto w-full max-w-7xl">
          {/* Container de la roulette */}
          <div className="relative h-40 bg-gradient-to-br from-[#2a3441] to-[#1e2533] rounded-2xl overflow-hidden border-2 border-[#4578be]/30 shadow-2xl">
            
            {/* Flèches VERTES */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
              <div 
                className="w-0 h-0"
                style={{
                  borderLeft: '20px solid transparent',
                  borderRight: '20px solid transparent',
                  borderTop: '28px solid #10b981',
                  filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))'
                }}
              />
            </div>
            
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
              <div 
                className="w-0 h-0"
                style={{
                  borderLeft: '20px solid transparent',
                  borderRight: '20px solid transparent',
                  borderBottom: '28px solid #10b981',
                  filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))'
                }}
              />
            </div>

            {/* Bande qui défile */}
            <motion.div
              className="absolute top-0 left-0 h-full flex"
              initial={{ x: 0 }}
              animate={isAnimating ? { x: roulettePosition } : { x: 0 }}
              transition={isAnimating ? {
                duration: 18,
                ease: [0.25, 0.001, 0.05, 1],
              } : {}}
            >
              {rouletteSegments.map((isWin, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 h-full flex items-center justify-center border-r border-gray-700/30"
                  style={{
                    width: '420px',
                    backgroundColor: isWin ? '#4578be' : 'transparent',
                    boxShadow: isWin ? '0 0 30px rgba(69, 120, 190, 0.4)' : 'none'
                  }}
                >
                  {isWin && selectedItem?.items && (
                    <div className="w-full h-full flex items-center justify-center p-4 relative">
                      {/* Effet néon glow derrière l'objet */}
                      <div className="absolute inset-0 bg-[#4578be] opacity-60 blur-3xl rounded-full scale-75"></div>
                      
                      {selectedItem.items.image_url ? (
                        <img
                          src={selectedItem.items.image_url}
                          alt={selectedItem.items.name}
                          className="max-w-full max-h-full object-contain relative z-10"
                          style={{ 
                            filter: 'drop-shadow(0 0 20px rgba(69, 120, 190, 1)) drop-shadow(0 0 40px rgba(69, 120, 190, 0.8))',
                          }}
                        />
                      ) : (
                        <Package className="w-16 h-16 text-white/50 relative z-10" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Gradients */}
            <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-[#1a1f2e] to-transparent pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-[#1a1f2e] to-transparent pointer-events-none z-10" />
          </div>

          {/* Info multiplicateur */}
          {selectedItem && (
            <div className="text-center mt-4">
              <p className="text-white text-sm font-bold">
                Multiplicateur x{selectedMultiplier.toFixed(1)} • {successRate.toFixed(1)}% de chances
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zone multiplicateurs (20%) */}
      {selectedItem && !showResult && (
        <div className="h-[20%] px-[5%] flex flex-col justify-center">
          <div className="max-w-7xl mx-auto w-full">
            {/* Quick multipliers */}
            <div className="grid grid-cols-8 gap-2 mb-3">
              {quickMultipliers.map((mult) => {
                const rate = calculateSuccessRate(mult)
                return (
                  <button
                    key={mult}
                    onClick={() => setSelectedMultiplier(mult)}
                    disabled={isUpgrading}
                    className={`p-2 rounded-xl font-bold text-sm transition-all ${
                      selectedMultiplier === mult
                        ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white shadow-lg scale-105'
                        : 'bg-[#2a3441] text-gray-300 hover:bg-[#3a4451]'
                    }`}
                  >
                    <div>x{mult}</div>
                    <div className="text-xs opacity-75">{rate.toFixed(1)}%</div>
                  </button>
                )
              })}
            </div>

            {/* Bouton upgrade avec effet verre */}
            {!isAnimating && (
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="relative px-12 py-3 rounded-xl font-black text-base shadow-2xl hover:shadow-[#4578be]/50 transition-all disabled:opacity-50 mx-auto block overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(69, 120, 190, 0.3), rgba(89, 137, 216, 0.3))',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(69, 120, 190, 0.5)',
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
                  style={{ transform: 'translateX(-100%)', animation: 'shine 2s infinite' }} 
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#4578be]/20 to-[#5989d8]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Texte */}
                <span className="relative z-10 text-white drop-shadow-lg">UPGRADE</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Résultat modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#2a3441] p-8 rounded-3xl border-2 border-[#4578be]/30 text-center max-w-md"
            >
              {upgradeSuccess ? (
                <>
                  <Trophy className="h-32 w-32 text-[#4578be] mx-auto mb-6" />
                  <h2 className="text-5xl font-black text-[#4578be] mb-4">RÉUSSI !</h2>
                  <p className="text-2xl text-white mb-2">
                    Vous avez remporté l'upgrade x{selectedMultiplier.toFixed(1)}
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <img
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                      alt="Coins"
                      className="w-8 h-8"
                    />
                    <span className="text-3xl font-black text-[#4578be]">
                      +{(selectedItem!.items!.market_value * selectedMultiplier).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={handleCloseResult}
                    className="px-8 py-3 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white rounded-xl font-bold"
                  >
                    Continuer
                  </button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-32 w-32 text-red-500 mx-auto mb-6" />
                  <h2 className="text-5xl font-black text-red-500 mb-4">ÉCHOUÉ</h2>
                  <p className="text-2xl text-white mb-8">
                    L'upgrade n'a pas fonctionné
                  </p>
                  <button
                    onClick={handleCloseResult}
                    className="px-8 py-3 bg-gray-600 text-white rounded-xl font-bold"
                  >
                    Fermer
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone inventaire (40%) */}
      <div className="h-[40%] px-[5%] overflow-hidden">
        <div className="h-full bg-[#2a3441]/30 rounded-2xl border border-[#4578be]/10 shadow-lg p-3 backdrop-blur-sm">
          <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
            <Package className="h-3 w-3 text-[#4578be]" />
            Inventaire ({inventory.filter(i => i.items).length})
          </h3>
          
          <div className="h-[calc(100%-30px)] overflow-y-auto pr-1">
            {inventory.filter(i => i.items).length > 0 ? (
              <div className="grid grid-cols-12 gap-1.5">
                {inventory.filter(i => i.items).map((item) => {
                  const config = getRarityConfig(item.items!.rarity)
                  const isSelected = selectedItem?.id === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => !isUpgrading && setSelectedItem(item)}
                      disabled={isUpgrading}
                      className={`p-1 rounded-lg transition-all relative group ${
                        isSelected
                          ? 'bg-[#4578be]/20 border border-[#4578be] shadow-lg scale-110'
                          : 'bg-[#1e2533]/50 border border-[#4578be]/10 hover:bg-[#2a3441]/50'
                      }`}
                    >
                      {/* Image */}
                      <div className={`w-full aspect-square bg-gradient-to-br ${config.gradient} p-[1px] rounded-md ${config.glow}`}>
                        <div className="w-full h-full bg-[#1a1f2e] rounded-sm flex items-center justify-center overflow-hidden">
                          {item.items!.image_url ? (
                            <img
                              src={item.items!.image_url}
                              alt={item.items!.name}
                              className="max-w-full max-h-full object-contain p-0.5"
                            />
                          ) : (
                            <Package className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Tooltip au hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#2a3441] rounded-lg border border-[#4578be]/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        <p className="text-[10px] font-bold text-white">{item.items!.name}</p>
                        <div className="flex items-center justify-center gap-1">
                          <img
                            src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
                            alt="Coins"
                            className="w-2 h-2"
                          />
                          <span className="text-[10px] font-bold text-[#4578be]">
                            {item.items!.market_value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Inventaire vide</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}