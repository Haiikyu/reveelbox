'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Check, Lock, Award, Package, Image as ImageIcon, Frame
} from 'lucide-react'

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

type TabType = 'pins' | 'banners' | 'frames'

export default function ShopPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pins, setPins] = useState<ShopItem[]>([])
  const [banners, setBanners] = useState<ShopItem[]>([])
  const [frames, setFrames] = useState<ShopItem[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('pins')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [equipping, setEquipping] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadAll()
    }
  }, [user])

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-bold text-gray-600">Connectez-vous pour accéder au shop</p>
        </div>
      </div>
    )
  }

  const currentItems = activeTab === 'pins' ? pins : activeTab === 'banners' ? banners : frames

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 mb-4">
            <ShoppingCart className="h-12 w-12 text-[#4578be]" />
            <h1 className="text-5xl font-black text-white">Shop</h1>
          </motion.div>
          <p className="text-gray-400 text-lg">Personnalise ton profil avec des pins, bannières et cadres uniques</p>
          
          {/* Balance */}
          <div className="mt-6 inline-flex items-center gap-2 bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
            <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" alt="Coins" className="w-6 h-6" />
            <span className="text-2xl font-black text-[#4578be]">{profile?.virtual_currency?.toLocaleString() || '0'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveTab('pins')} className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'pins' ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white shadow-lg' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center gap-2"><Award className="h-5 w-5" /><span>Pins</span></div>
          </button>
          <button onClick={() => setActiveTab('banners')} className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'banners' ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white shadow-lg' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /><span>Bannières</span></div>
          </button>
          <button onClick={() => setActiveTab('frames')} className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'frames' ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white shadow-lg' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <div className="flex items-center gap-2"><Frame className="h-5 w-5" /><span>Cadres</span></div>
          </button>
        </div>

        {/* Items Grid */}
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
      </div>
    </div>
  )
}