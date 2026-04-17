import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pin, Image as ImageIcon, Frame, Palette, Plus, Trash2,
  Edit3, Save, X, Loader2, Search, Eye, Layers, Gem
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { sanitizeSvg } from '@/utils/sanitizeSvg'

const supabase = createClient()

type ShopTab = 'pins' | 'banners' | 'frames' | 'colors' | 'backgrounds'
type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

interface ShopItemBase {
  id: string
  name: string
  description: string | null
  price: number
  reevs_price: number | null
  stock: number | null
  rarity: string
  created_at: string
}

interface ShopPin extends ShopItemBase {
  svg_code: string | null
  image_url: string | null
}
interface ShopBanner extends ShopItemBase {
  svg_code: string | null
  image_url: string | null
}
interface ShopFrame extends ShopItemBase {
  svg_code: string | null
  image_url: string | null
}
interface ShopColor extends ShopItemBase { color_value: string; is_gradient: boolean }
interface ShopBackground extends ShopItemBase {
  image_url: string | null
  css_value: string | null
  svg_code: string | null
}

type ShopAnyItem = ShopPin | ShopBanner | ShopFrame | ShopColor | ShopBackground

// Stats type
interface ShopStats {
  totalPins: number
  totalBanners: number
  totalFrames: number
  totalColors: number
  totalBackgrounds: number
  purchasedPins: number
  purchasedBanners: number
  purchasedFrames: number
  purchasedColors: number
  purchasedBackgrounds: number
}

const RARITY_COLORS: Record<Rarity, { bg: string; text: string; label: string }> = {
  common: { bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-400', label: 'Commun' },
  rare: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', label: 'Rare' },
  epic: { bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400', label: 'Epique' },
  legendary: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', label: 'Legendaire' }
}

const TABS: { id: ShopTab; label: string; icon: typeof Pin; table: string }[] = [
  { id: 'pins', label: 'Pins', icon: Pin, table: 'shop_pins' },
  { id: 'banners', label: 'Bannieres', icon: ImageIcon, table: 'shop_banners' },
  { id: 'frames', label: 'Cadres', icon: Frame, table: 'shop_frames' },
  { id: 'colors', label: 'Couleurs', icon: Palette, table: 'shop_name_colors' },
  { id: 'backgrounds', label: 'Fonds', icon: Layers, table: 'shop_backgrounds' },
]

// Form modal component
function ShopItemModal({
  isOpen,
  onClose,
  onSave,
  item,
  tab,
  saving
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, unknown>) => void
  item: ShopAnyItem | null
  tab: ShopTab
  saving: boolean
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [reevPrice, setReevPrice] = useState('')
  const [paymentMode, setPaymentMode] = useState<'coins' | 'reevs'>('coins')
  const [stock, setStock] = useState('')
  const [rarity, setRarity] = useState<Rarity>('common')
  const [svgCode, setSvgCode] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageType, setImageType] = useState<'svg' | 'url'>('svg')
  const [colorValue, setColorValue] = useState('')
  const [isGradient, setIsGradient] = useState(false)
  const [cssValue, setCssValue] = useState('')
  const [bgSvgCode, setBgSvgCode] = useState('')
  const [bgType, setBgType] = useState<'image' | 'css' | 'svg'>('css')

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setDescription(item.description || '')
      const isReevs = item.reevs_price != null && item.reevs_price > 0
      setPaymentMode(isReevs ? 'reevs' : 'coins')
      setPrice(isReevs ? '0' : String(item.price || 0))
      setReevPrice(item.reevs_price != null ? String(item.reevs_price) : '')
      setStock(item.stock != null ? String(item.stock) : '')
      setRarity((item.rarity as Rarity) || 'common')
      if ('svg_code' in item || 'image_url' in item) {
        const typedItem = item as ShopPin | ShopBanner | ShopFrame
        if (typedItem.image_url) {
          setImageType('url')
          setImageUrl(typedItem.image_url || '')
          setSvgCode('')
        } else {
          setImageType('svg')
          setSvgCode(typedItem.svg_code || '')
          setImageUrl('')
        }
      }
      if ('color_value' in item) {
        setColorValue((item as ShopColor).color_value || '')
        setIsGradient((item as ShopColor).is_gradient || false)
      }
      if ('css_value' in item) {
        const bgItem = item as ShopBackground
        if (bgItem.svg_code) {
          setBgType('svg')
          setBgSvgCode(bgItem.svg_code || '')
          setCssValue(''); setImageUrl('')
        } else if (bgItem.image_url) {
          setBgType('image')
          setImageUrl(bgItem.image_url || '')
          setCssValue(''); setBgSvgCode('')
        } else {
          setBgType('css')
          setCssValue(bgItem.css_value || '')
          setImageUrl(''); setBgSvgCode('')
        }
      }
    } else {
      setName(''); setDescription(''); setPrice('100'); setReevPrice(''); setPaymentMode('coins'); setStock(''); setRarity('common')
      setSvgCode(''); setImageUrl(''); setImageType('svg')
      setColorValue(''); setIsGradient(false)
      setCssValue(''); setBgSvgCode(''); setBgType('css')
    }
  }, [item, isOpen])

  const handleSubmit = () => {
    const data: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      price: paymentMode === 'reevs' ? 0 : parseInt(price) || 0,
      reevs_price: paymentMode === 'reevs' ? (parseInt(reevPrice) || null) : null,
      stock: stock.trim() !== '' ? parseInt(stock) : null,
      rarity,
    }
    if (tab === 'colors') {
      data.color_value = colorValue.trim()
      data.is_gradient = isGradient
    } else if (tab === 'backgrounds') {
      if (bgType === 'svg') {
        data.svg_code = bgSvgCode.trim()
        data.image_url = null; data.css_value = null
      } else if (bgType === 'image') {
        data.image_url = imageUrl.trim()
        data.svg_code = null; data.css_value = null
      } else {
        data.css_value = cssValue.trim()
        data.image_url = null; data.svg_code = null
      }
    } else {
      if (imageType === 'svg') {
        data.svg_code = svgCode.trim()
        data.image_url = null
      } else {
        data.svg_code = null
        data.image_url = imageUrl.trim()
      }
    }
    onSave(data)
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">
              {item ? 'Modifier' : 'Ajouter'} - {TABS.find(t => t.id === tab)?.label}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Nom</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="Nom de l'item" />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none" />
            </div>
            {/* Mode paiement */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Mode de paiement</label>
              <div className="flex gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-600/50">
                <button type="button" onClick={() => setPaymentMode('coins')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paymentMode === 'coins' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                  <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png" className="w-4 h-4" alt="" />
                  Coins
                </button>
                <button type="button" onClick={() => setPaymentMode('reevs')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paymentMode === 'reevs' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  <Gem className="w-4 h-4" />
                  Reevs
                </button>
              </div>
            </div>

            {/* Prix + Rarity row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {paymentMode === 'coins' ? (
                  <>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">Prix (coins)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-blue-500 focus:outline-none" />
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 mb-1.5">
                      <Gem className="w-3.5 h-3.5" />
                      Prix Reevs
                    </label>
                    <input type="number" value={reevPrice} onChange={e => setReevPrice(e.target.value)}
                      placeholder="ex: 500"
                      className="w-full px-4 py-2.5 bg-emerald-950/30 border border-emerald-700/40 rounded-xl text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none" />
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Rarete</label>
                <select value={rarity} onChange={e => setRarity(e.target.value as Rarity)}
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-blue-500 focus:outline-none">
                  <option value="common">Commun</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epique</option>
                  <option value="legendary">Legendaire</option>
                </select>
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Stock
                <span className="text-gray-500 font-normal text-xs ml-1">(vide = illimité)</span>
              </label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)}
                placeholder="Illimité"
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none" />
            </div>

            {tab === 'backgrounds' ? (
              <>
                {/* Background type selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Type de fond</label>
                  <div className="flex gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-600/50">
                    <button type="button" onClick={() => setBgType('css')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${bgType === 'css' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                      CSS
                    </button>
                    <button type="button" onClick={() => setBgType('svg')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${bgType === 'svg' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                      SVG
                    </button>
                    <button type="button" onClick={() => setBgType('image')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${bgType === 'image' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                      Image URL
                    </button>
                  </div>
                </div>
                {bgType === 'css' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">Valeur CSS (gradient, couleur, etc.)</label>
                      <input value={cssValue} onChange={e => setCssValue(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
                    </div>
                    {cssValue && (
                      <div className="mt-2">
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Apercu</label>
                        <div className="h-32 rounded-xl overflow-hidden border border-gray-600/50" style={{ background: cssValue }} />
                      </div>
                    )}
                  </>
                ) : bgType === 'svg' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">Code SVG</label>
                      <textarea value={bgSvgCode} onChange={e => setBgSvgCode(e.target.value)} rows={6}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white font-mono text-xs placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                        placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 560">...</svg>' />
                    </div>
                    {bgSvgCode && (
                      <div className="mt-2">
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Apercu</label>
                        <div className="h-32 rounded-xl overflow-hidden border border-gray-600/50 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sanitizeSvg(bgSvgCode) }} />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">URL de l'image</label>
                      <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder="https://example.com/background.jpg" />
                    </div>
                    {imageUrl && (
                      <div className="mt-2">
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Apercu</label>
                        <div className="h-32 rounded-xl overflow-hidden border border-gray-600/50">
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : tab === 'colors' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Valeur couleur (hex ou CSS gradient)</label>
                  <input value={colorValue} onChange={e => setColorValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    placeholder="#ff0000 ou linear-gradient(90deg, #ff0000, #0000ff)" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isGradient} onChange={e => setIsGradient(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500" />
                  <span className="text-sm text-gray-300 font-medium">C'est un gradient</span>
                </label>
                {/* Preview */}
                {colorValue && (
                  <div className="mt-2">
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">Apercu</label>
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-600/50">
                      <span className="text-2xl font-black"
                        style={isGradient
                          ? { backgroundImage: colorValue, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
                          : { color: colorValue }
                        }>
                        ReveelBox Player
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Type selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Type d'image</label>
                  <div className="flex gap-2 bg-gray-800/50 p-1 rounded-xl border border-gray-600/50">
                    <button type="button"
                      onClick={() => setImageType('svg')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        imageType === 'svg'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}>
                      Code SVG
                    </button>
                    <button type="button"
                      onClick={() => setImageType('url')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        imageType === 'url'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}>
                      URL d'image
                    </button>
                  </div>
                </div>

                {imageType === 'svg' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">Code SVG</label>
                      <textarea value={svgCode} onChange={e => setSvgCode(e.target.value)} rows={6}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white font-mono text-xs placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                        placeholder='<svg viewBox="0 0 100 100">...</svg>' />
                    </div>
                    {/* SVG Preview */}
                    {svgCode && (
                      <div className="mt-2">
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Apercu</label>
                        <div className="flex items-center justify-center p-4 rounded-xl bg-gray-800/50 border border-gray-600/50">
                          <div className="w-24 h-24 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgCode) }} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">URL de l'image</label>
                      <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder="https://example.com/image.png" />
                    </div>
                    {/* Image Preview */}
                    {imageUrl && (
                      <div className="mt-2">
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Apercu</label>
                        <div className="flex items-center justify-center p-4 rounded-xl bg-gray-800/50 border border-gray-600/50">
                          <img src={imageUrl} alt="Preview" className="w-24 h-24 object-contain" onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          <div className="p-5 border-t border-gray-700/50 flex gap-3 justify-end">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={saving || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {item ? 'Mettre a jour' : 'Creer'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export function ShopManagement() {
  const [activeTab, setActiveTab] = useState<ShopTab>('pins')
  const [items, setItems] = useState<ShopAnyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShopAnyItem | null>(null)
  const [stats, setStats] = useState<ShopStats>({
    totalPins: 0, totalBanners: 0, totalFrames: 0, totalColors: 0, totalBackgrounds: 0,
    purchasedPins: 0, purchasedBanners: 0, purchasedFrames: 0, purchasedColors: 0, purchasedBackgrounds: 0
  })

  const tableName = TABS.find(t => t.id === activeTab)!.table

  const loadItems = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from(tableName).select('*').order('price', { ascending: true })
    if (!error) setItems((data || []) as ShopAnyItem[])
    setLoading(false)
  }, [tableName])

  const loadStats = useCallback(async () => {
    const [pins, banners, frames, colors, bgs, uPins, uBanners, uFrames, uColors, uBgs] = await Promise.all([
      supabase.from('shop_pins').select('id', { count: 'exact', head: true }),
      supabase.from('shop_banners').select('id', { count: 'exact', head: true }),
      supabase.from('shop_frames').select('id', { count: 'exact', head: true }),
      supabase.from('shop_name_colors').select('id', { count: 'exact', head: true }),
      supabase.from('shop_backgrounds').select('id', { count: 'exact', head: true }),
      supabase.from('user_pins').select('id', { count: 'exact', head: true }),
      supabase.from('user_banners').select('id', { count: 'exact', head: true }),
      supabase.from('user_frames').select('id', { count: 'exact', head: true }),
      supabase.from('user_name_colors').select('id', { count: 'exact', head: true }),
      supabase.from('user_backgrounds').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      totalPins: pins.count || 0,
      totalBanners: banners.count || 0,
      totalFrames: frames.count || 0,
      totalColors: colors.count || 0,
      totalBackgrounds: bgs.count || 0,
      purchasedPins: uPins.count || 0,
      purchasedBanners: uBanners.count || 0,
      purchasedFrames: uFrames.count || 0,
      purchasedColors: uColors.count || 0,
      purchasedBackgrounds: uBgs.count || 0,
    })
  }, [])

  useEffect(() => { loadItems() }, [loadItems])
  useEffect(() => { loadStats() }, [loadStats])

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      if (editItem) {
        const { error } = await supabase.from(tableName).update(data).eq('id', editItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from(tableName).insert(data)
        if (error) throw error
      }
      setModalOpen(false)
      setEditItem(null)
      await loadItems()
      await loadStats()
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet item du shop ?')) return
    const { error } = await supabase.from(tableName).delete().eq('id', id)
    if (!error) {
      await loadItems()
      await loadStats()
    }
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const statsCards = [
    { label: 'Pins', count: stats.totalPins, purchased: stats.purchasedPins, icon: Pin, color: 'from-pink-500 to-rose-600' },
    { label: 'Bannieres', count: stats.totalBanners, purchased: stats.purchasedBanners, icon: ImageIcon, color: 'from-blue-500 to-indigo-600' },
    { label: 'Cadres', count: stats.totalFrames, purchased: stats.purchasedFrames, icon: Frame, color: 'from-emerald-500 to-teal-600' },
    { label: 'Couleurs', count: stats.totalColors, purchased: stats.purchasedColors, icon: Palette, color: 'from-amber-500 to-orange-600' },
    { label: 'Fonds', count: stats.totalBackgrounds, purchased: stats.purchasedBackgrounds, icon: Layers, color: 'from-violet-500 to-purple-600' },
  ]

  return (
    <motion.div key="shop" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-1">Gestion du Shop</h2>
        <p className="text-gray-400 text-sm">Gerez les cosmetiques disponibles a l'achat</p>
      </div>

      {/* Stats mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statsCards.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl p-4 bg-[#1a1f2e] border border-gray-700/40">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{s.count}</div>
                  <div className="text-[11px] text-gray-400">{s.label}</div>
                </div>
              </div>
              <div className="text-[11px] text-gray-500">{s.purchased} achetes par les joueurs</div>
            </div>
          )
        })}
      </div>

      {/* Tabs + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1.5 bg-[#1a1f2e] rounded-xl p-1 border border-gray-700/40">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch('') }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-gray-700/40 rounded-xl text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-48" />
          </div>
          <button onClick={() => { setEditItem(null); setModalOpen(true) }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="rounded-xl bg-[#1a1f2e] border border-gray-700/40 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Aucun item</div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {filtered.map(item => {
              const r = RARITY_COLORS[(item.rarity as Rarity) || 'common']
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-800/30 transition-colors group">
                  {/* Preview */}
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={activeTab === 'colors'
                      ? { background: (item as ShopColor).color_value }
                      : activeTab === 'backgrounds'
                        ? { background: (item as ShopBackground).css_value || 'rgba(15,20,26,0.8)', overflow: 'hidden' }
                        : { background: 'rgba(15,20,26,0.8)' }
                    }>
                    {activeTab === 'backgrounds' && (item as ShopBackground).svg_code && (
                      <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sanitizeSvg((item as ShopBackground).svg_code) }} />
                    )}
                    {activeTab === 'backgrounds' && !(item as ShopBackground).svg_code && (item as ShopBackground).image_url && (
                      <img src={(item as ShopBackground).image_url!} alt={item.name} className="w-full h-full object-cover" />
                    )}
                    {activeTab !== 'colors' && activeTab !== 'backgrounds' && (
                      <>
                        {(item as ShopPin).image_url ? (
                          <img src={(item as ShopPin).image_url!} alt={item.name} className="w-10 h-10 object-contain" />
                        ) : (item as ShopPin).svg_code ? (
                          <div className="w-10 h-10 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sanitizeSvg((item as ShopPin).svg_code) }} />
                        ) : null}
                      </>
                    )}
                    {activeTab === 'colors' && (item as ShopColor).is_gradient && (
                      <span className="text-white font-black text-sm drop-shadow-lg">Abc</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-white text-sm truncate">{item.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.bg} ${r.text}`}>
                        {r.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{item.description || 'Pas de description'}</div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    {item.reevs_price != null && item.reevs_price > 0 ? (
                      <div className="flex items-center justify-end gap-1">
                        <Gem className="w-3 h-3 text-emerald-400" />
                        <span className="font-bold text-emerald-400 text-sm">{item.reevs_price.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-600">Reevs</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-bold text-white text-sm">{item.price.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-500">coins</span>
                      </div>
                    )}
                    {item.stock != null && (
                      <div className="text-[10px] text-gray-500">stock: {item.stock}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditItem(item); setModalOpen(true) }}
                      className="p-2 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ShopItemModal
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setEditItem(null) }}
            onSave={handleSave}
            item={editItem}
            tab={activeTab}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
