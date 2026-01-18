'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Check, Lock, Award, Package, Image as ImageIcon, Frame, Crown,
  Sparkles, ArrowRight, Star, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  svg_code: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  is_owned?: boolean
  is_equipped?: boolean
}

type TabType = 'battle_pass' | 'pins' | 'banners' | 'frames'

export default function ShopPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pins, setPins] = useState<ShopItem[]>([])
  const [banners, setBanners] = useState<ShopItem[]>([])
  const [frames, setFrames] = useState<ShopItem[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('battle_pass')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [equipping, setEquipping] = useState<string | null>(null)
  const [buyingPass, setBuyingPass] = useState(false)
  const [hasPass, setHasPass] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadAll()
      checkBattlePass()
    }
  }, [user])

  const checkBattlePass = async () => {
    if (!user) return
    const { data: season } = await supabase
      .from('battle_pass_seasons')
      .select('id')
      .eq('is_active', true)
      .single()

    if (season) {
      const { data: userPass } = await supabase
        .from('user_battle_passes')
        .select('id')
        .eq('user_id', user.id)
        .eq('season_id', season.id)
        .eq('is_active', true)
        .single()

      setHasPass(!!userPass)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      await Promise.all([loadPins(), loadBanners(), loadFrames()])
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPins = async () => {
    if (!user) return
    const { data: shopPins } = await supabase.from('shop_pins').select('*').order('price')
    const { data: userPins } = await supabase.from('user_pins').select('pin_id, is_equipped').eq('user_id', user.id)
    setPins((shopPins || []).map(pin => ({
      ...pin,
      is_owned: !!userPins?.find(up => up.pin_id === pin.id),
      is_equipped: userPins?.find(up => up.pin_id === pin.id)?.is_equipped || false
    })))
  }

  const loadBanners = async () => {
    if (!user) return
    const { data: shopBanners } = await supabase.from('shop_banners').select('*').order('price')
    const { data: userBanners } = await supabase.from('user_banners').select('banner_id, is_equipped').eq('user_id', user.id)
    setBanners((shopBanners || []).map(banner => ({
      ...banner,
      is_owned: !!userBanners?.find(ub => ub.banner_id === banner.id),
      is_equipped: userBanners?.find(ub => ub.banner_id === banner.id)?.is_equipped || false
    })))
  }

  const loadFrames = async () => {
    if (!user) return
    const { data: shopFrames } = await supabase.from('shop_frames').select('*').order('price')
    const { data: userFrames } = await supabase.from('user_frames').select('frame_id, is_equipped').eq('user_id', user.id)
    setFrames((shopFrames || []).map(frame => ({
      ...frame,
      is_owned: !!userFrames?.find(uf => uf.frame_id === frame.id),
      is_equipped: userFrames?.find(uf => uf.frame_id === frame.id)?.is_equipped || false
    })))
  }

  const purchaseBattlePass = async () => {
    if (!user || buyingPass) return

    setBuyingPass(true)
    try {
      const response = await fetch('/api/create-battlepass-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const { sessionId } = await response.json()
      const stripe = await stripePromise
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Erreur achat Battle Pass:', error)
    } finally {
      setBuyingPass(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500'
      case 'epic': return 'from-purple-500 to-pink-500'
      case 'rare': return 'from-blue-500 to-cyan-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const purchase = async (item: ShopItem, type: TabType) => {
    if (!user || !profile || profile.virtual_currency < item.price) {
      alert('Pas assez de coins !')
      return
    }

    setPurchasing(item.id)
    try {
      const rpcName = type === 'pins' ? 'buy_pin' : type === 'banners' ? 'buy_banner' : 'buy_frame'
      const paramName = type === 'pins' ? 'p_pin_id' : type === 'banners' ? 'p_banner_id' : 'p_frame_id'
      
      const { error } = await supabase.rpc(rpcName, {
        p_user_id: user.id,
        [paramName]: item.id
      })

      if (error) throw error

      alert(`${item.name} acheté ! Clique sur "Équiper" pour l'activer 🎉`)
      await refreshProfile()
      await loadAll()
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'achat')
    } finally {
      setPurchasing(null)
    }
  }

  const equip = async (item: ShopItem, type: TabType) => {
    if (!user) return

    setEquipping(item.id)
    try {
      const rpcName = type === 'pins' ? 'equip_pin' : type === 'banners' ? 'equip_banner' : 'equip_frame'
      const paramName = type === 'pins' ? 'p_pin_id' : type === 'banners' ? 'p_banner_id' : 'p_frame_id'
      
      const { error } = await supabase.rpc(rpcName, {
        p_user_id: user.id,
        [paramName]: item.id,
        p_equip: !item.is_equipped
      })

      if (error) throw error

      await refreshProfile()
      await loadAll()
    } catch (error: any) {
      alert(error.message || 'Erreur')
    } finally {
      setEquipping(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-bold text-gray-400">Connectez-vous pour accéder au shop</p>
        </div>
      </div>
    )
  }

  const currentItems = activeTab === 'pins' ? pins : activeTab === 'banners' ? banners : frames

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 mb-4">
            <ShoppingCart className="h-12 w-12 text-[#4578be]" />
            <h1 className="text-5xl font-black text-white">SHOP</h1>
          </motion.div>
          <p className="text-gray-400 text-lg">Personnalise ton profil et débloquer le Battle Pass exclusif</p>
          
          {/* Balance */}
          <div className="mt-6 inline-flex items-center gap-2 bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
            <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="Coins" className="w-6 h-6" />
            <span className="text-2xl font-black text-[#4578be]">{profile?.virtual_currency?.toLocaleString() || '0'}</span>
          </div>
        </div>

        {/* BATTLE PASS FEATURED - ÉNORME */}
        {activeTab === 'battle_pass' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border-2 border-yellow-500/50 overflow-hidden"
              style={{ boxShadow: '0 0 60px rgba(234, 179, 8, 0.4)' }}>
              
              {/* Particules animées */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                    animate={{
                      x: [Math.random() * 800, Math.random() * 800],
                      y: [Math.random() * 400, Math.random() * 400],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: Math.random() * 3 + 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              <div className="relative p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Gauche - Info */}
                  <div>
                    <div className="inline-flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full mb-4">
                      <Crown className="h-5 w-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-sm">EXCLUSIF</span>
                    </div>

                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
                      BATTLE PASS
                    </h2>
                    
                    <p className="text-2xl text-white font-bold mb-2">Saison 1 - Réveil des Légendes</p>
                    <p className="text-gray-400 mb-6">30 récompenses exclusives sur 30 jours !</p>

                    {/* Prix */}
                    <div className="bg-black/30 rounded-2xl p-6 mb-6">
                      <p className="text-gray-400 text-sm mb-2">Prix du Pass</p>
                      <p className="text-5xl font-black text-white mb-1">21.99€</p>
                      <p className="text-yellow-400 text-sm">Paiement unique • Argent réel</p>
                    </div>

                    {/* Avantages */}
                    <div className="space-y-3 mb-8">
                      {[
                        { icon: <Star className="h-5 w-5" />, text: 'Pseudo en dégradé OR dès le Jour 1' },
                        { icon: <Frame className="h-5 w-5" />, text: 'Cadres & bannières légendaires' },
                        { icon: <Award className="h-5 w-5" />, text: 'Pins exclusifs ultra-rares' },
                        { icon: <Package className="h-5 w-5" />, text: 'Cases mystère spéciales' },
                        { icon: <Sparkles className="h-5 w-5" />, text: 'Jusqu\'à 10,000 coins gratuits' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-white">
                          <div className="text-yellow-400">{item.icon}</div>
                          <span className="font-medium">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Boutons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {hasPass ? (
                        <Link href="/battlepass" className="flex-1">
                          <button className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                            <Check className="h-5 w-5" />
                            Pass Actif - Voir mes récompenses
                          </button>
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={purchaseBattlePass}
                            disabled={buyingPass}
                            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-yellow-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {buyingPass ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Redirection...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5" />
                                Acheter le Pass
                              </>
                            )}
                          </button>
                          <Link href="/battlepass" className="flex-1">
                            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                              Voir les récompenses
                              <ArrowRight className="h-5 w-5" />
                            </button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Droite - Visuel */}
                  <div className="hidden md:block">
                    <div className="relative">
                      {/* Mock des récompenses */}
                      <div className="grid grid-cols-3 gap-4">
                        {[1,2,3,4,5,6,7,8,9].map((day) => (
                          <motion.div
                            key={day}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: day * 0.1 }}
                            className="relative aspect-square bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30 flex items-center justify-center"
                          >
                            <div className="absolute top-1 left-1 bg-black/50 backdrop-blur px-2 py-0.5 rounded text-white text-[10px] font-bold">
                              J{day}
                            </div>
                            <div className="text-yellow-400">
                              {day === 1 ? <Star className="h-8 w-8" /> : 
                               day % 3 === 0 ? <Award className="h-8 w-8" /> : 
                               <Sparkles className="h-6 w-6" />}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Effet glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl blur-3xl -z-10"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
              />
            </div>
          </motion.div>
        ) : null}

        {/* Tabs */}
        <div className="flex justify-center gap-2 md:gap-4 mb-8 flex-wrap">
          <button 
            onClick={() => setActiveTab('battle_pass')} 
            className={`px-4 md:px-8 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'battle_pass' 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg shadow-yellow-500/30' 
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              <span className="hidden sm:inline">Battle Pass</span>
            </div>
          </button>
          <button onClick={() => setActiveTab('pins')} className={`px-4 md:px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'pins' ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white shadow-lg' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center gap-2"><Award className="h-5 w-5" /><span className="hidden sm:inline">Pins</span></div>
          </button>
          <button onClick={() => setActiveTab('banners')} className={`px-4 md:px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'banners' ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white shadow-lg' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /><span className="hidden sm:inline">Bannières</span></div>
          </button>
          <button onClick={() => setActiveTab('frames')} className={`px-4 md:px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'frames' ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white shadow-lg' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center gap-2"><Frame className="h-5 w-5" /><span className="hidden sm:inline">Cadres</span></div>
          </button>
        </div>

        {/* Items Grid (seulement si pas Battle Pass) */}
        {activeTab !== 'battle_pass' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4578be] mx-auto"></div>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-xl font-bold text-gray-500">Aucun item disponible</p>
              </div>
            ) : (
              currentItems.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden hover:border-[#4578be] transition-all group flex flex-col">
                  
                  {/* Badges */}
                  <div className="relative">
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-gradient-to-r ${getRarityColor(item.rarity)} text-white text-[10px] font-black uppercase z-10`}>
                      {item.rarity}
                    </div>
                    {item.is_equipped && (
                      <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1 z-10">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="flex items-center justify-center p-6" style={{ 
                    height: activeTab === 'banners' ? '120px' : '128px' 
                  }}>
                    {activeTab === 'banners' ? (
                      <div className="w-full h-full rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                    ) : activeTab === 'frames' ? (
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 bg-gray-700 rounded-xl"></div>
                        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                      </div>
                    ) : (
                      <div className="w-20 h-20" dangerouslySetInnerHTML={{ __html: item.svg_code }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-4 pb-3 text-center flex-1 flex flex-col justify-end">
                    <h3 className="font-bold text-white text-sm mb-2 truncate">{item.name}</h3>
                    <div className="flex items-center justify-center gap-1.5 mb-3">
                      <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="Coins" className="w-4 h-4" />
                      <span className="text-base font-black text-[#4578be]">{item.price}</span>
                    </div>
                  </div>

                  {/* Button */}
                  {item.is_owned ? (
                    <button onClick={() => equip(item, activeTab)} disabled={equipping === item.id}
                      className={`w-full py-3 font-bold text-sm transition-all border-t border-gray-700 ${
                        item.is_equipped ? 'bg-green-500/20 text-green-400' : 'bg-[#4578be] hover:bg-[#5989d8] text-white'
                      }`}>
                      {equipping === item.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div> : 
                        item.is_equipped ? <div className="flex items-center justify-center gap-2"><Check className="h-4 w-4" />Équipé</div> : 'Équiper'}
                    </button>
                  ) : (
                    <button onClick={() => purchase(item, activeTab)} disabled={purchasing === item.id || (profile?.virtual_currency || 0) < item.price}
                      className={`w-full py-3 font-bold text-sm transition-all border-t border-gray-700 ${
                        (profile?.virtual_currency || 0) < item.price ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white hover:shadow-lg'
                      }`}>
                      {purchasing === item.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div> : 'Acheter'}
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}