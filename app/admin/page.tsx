'use client'

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus, Search, RefreshCw, Package,
  BarChart3, Image, Users, CreditCard, DatabaseIcon,
  ShoppingCart, Shield, Loader2, Lock, TrendingUp,
  Sword, MessageSquare, Coins, Flame, Activity
} from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// Composants admin
import { ThemeProvider, ThemeToggle } from '@/app/components/admin/ThemeProvider'
import { Button, Toast, Card } from '@/app/components/admin/ui/index'
import { Dashboard } from '@/app/components/admin/Dashboard'
import { BoxesManagement } from '@/app/components/admin/BoxesManagement'
import { ItemsManagementSimple } from '@/app/components/admin/ItemsManagement'
import { UsersManagement, TransactionsManagement } from '@/app/components/admin/UsersTransactions'
import { AdvancedStats } from '@/app/components/admin/AdvancedStats'
import { BoxModal, ItemModal, ManageItemsModal } from '@/app/components/admin/Modals'
import { ShopManagement } from '@/app/components/admin/ShopManagement'
import { useAdmin } from '@/app/hooks/useAdmin'
import {
  BoxForm, ItemForm, BoxItemForm, Errors,
  LootBox, Item
} from '@/app/components/admin/types'

// Hook modaux
const useModals = () => {
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedBox, setSelectedBox] = useState<LootBox | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const [boxForm, setBoxForm] = useState<BoxForm>({
    name: '', description: '', image_url: '', banner_url: '',
    price_virtual: '100.00', is_active: true, is_daily_free: false,
    is_featured: false, required_level: '1'
  })

  const [itemForm, setItemForm] = useState<ItemForm>({
    name: '', description: '', image_url: '', market_value: '10.00', rarity: 'common'
  })

  const [boxItemForm, setBoxItemForm] = useState<BoxItemForm>({
    item_id: '', probability: '', display_order: '1'
  })

  const openModal = (type: string, data?: LootBox | Item | null) => {
    setModalType(type)
    setShowModal(true)
    setErrors({})

    if (data) {
      if (type === 'editBox') {
        const boxData = data as LootBox
        setSelectedBox(boxData)
        setBoxForm({
          name: boxData.name, description: boxData.description || '',
          image_url: boxData.image_url || '', banner_url: boxData.banner_url || '',
          price_virtual: (boxData.price_virtual || 100).toString(),
          is_active: boxData.is_active ?? true, is_daily_free: boxData.is_daily_free ?? false,
          is_featured: boxData.is_featured ?? false,
          required_level: (boxData.required_level || 1).toString()
        })
      } else if (type === 'editItem') {
        const itemData = data as Item
        setSelectedItem(itemData)
        setItemForm({
          name: itemData.name, description: itemData.description || '',
          image_url: itemData.image_url || '',
          market_value: (itemData.market_value || 10).toString(), rarity: itemData.rarity
        })
      } else if (type === 'manageItems') {
        setSelectedBox(data as LootBox)
      }
    }
  }

  const closeModal = () => {
    setShowModal(false); setSelectedBox(null); setSelectedItem(null); setErrors({})
    setBoxForm({ name: '', description: '', image_url: '', banner_url: '', price_virtual: '100.00', is_active: true, is_daily_free: false, is_featured: false, required_level: '1' })
    setItemForm({ name: '', description: '', image_url: '', market_value: '10.00', rarity: 'common' })
    setBoxItemForm({ item_id: '', probability: '', display_order: '1' })
  }

  return {
    showModal, modalType, selectedBox, selectedItem, errors, setErrors,
    submitting, setSubmitting, boxForm, setBoxForm, itemForm, setItemForm,
    boxItemForm, setBoxItemForm, openModal, closeModal
  }
}

// Nouvelles stats
interface PlatformStats {
  totalBattles: number
  totalMessages: number
  totalCoinsCirculation: number
  activeUsersToday: number
  totalBoxOpenings: number
  totalShopItems: number
}

// Composant principal
const AdvancedAdminPanel = () => {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalBattles: 0, totalMessages: 0, totalCoinsCirculation: 0,
    activeUsersToday: 0, totalBoxOpenings: 0, totalShopItems: 0
  })

  const adminHook = useAdmin()
  const modalHook = useModals()
  const supabase = createClient()

  const isAdmin = (profile as any)?.is_admin === true

  // Guard de securite : redirection si pas admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [authLoading, user, isAdmin, router])

  // Charger les stats plateforme
  useEffect(() => {
    if (!isAdmin) return
    const loadPlatformStats = async () => {
      try {
        const [battles, messages, coins, activeToday, boxOpenings, shopPins, shopBanners, shopFrames, shopColors] = await Promise.all([
          supabase.from('battles').select('id', { count: 'exact', head: true }),
          supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('virtual_currency'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 86400000).toISOString()),
          supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('type', 'box_opening'),
          supabase.from('shop_pins').select('id', { count: 'exact', head: true }),
          supabase.from('shop_banners').select('id', { count: 'exact', head: true }),
          supabase.from('shop_frames').select('id', { count: 'exact', head: true }),
          supabase.from('shop_name_colors').select('id', { count: 'exact', head: true }),
        ])
        const totalCoins = (coins.data || []).reduce((sum, p) => sum + (p.virtual_currency || 0), 0)
        setPlatformStats({
          totalBattles: battles.count || 0,
          totalMessages: messages.count || 0,
          totalCoinsCirculation: Math.round(totalCoins),
          activeUsersToday: activeToday.count || 0,
          totalBoxOpenings: boxOpenings.count || 0,
          totalShopItems: (shopPins.count || 0) + (shopBanners.count || 0) + (shopFrames.count || 0) + (shopColors.count || 0),
        })
      } catch (err) {
        console.error('Erreur stats plateforme:', err)
      }
    }
    loadPlatformStats()
  }, [isAdmin])

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  // Non-admin guard
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Acces refuse</h1>
          <p className="text-gray-400">Vous n'avez pas les permissions necessaires.</p>
        </div>
      </div>
    )
  }

  // Navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stats', label: 'Statistiques', icon: TrendingUp },
    { id: 'boxes', label: 'Loot Boxes', icon: Package },
    { id: 'items', label: 'Items', icon: Image },
    { id: 'shop', label: 'Shop', icon: ShoppingCart },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'system', label: 'Systeme', icon: DatabaseIcon }
  ]

  // Handlers
  const handleCreateBox = async () => {
    if (modalHook.submitting) return
    const v: Errors = {}
    if (!modalHook.boxForm.name.trim()) v.name = 'Le nom est requis'
    if (!modalHook.boxForm.image_url.trim()) v.image_url = 'L\'image est requise'
    if (!modalHook.boxForm.price_virtual || parseFloat(modalHook.boxForm.price_virtual) < 0) v.price_virtual = 'Le prix doit etre positif'
    if (Object.keys(v).length > 0) { modalHook.setErrors(v); return }
    modalHook.setSubmitting(true)
    const result = await adminHook.createBox(modalHook.boxForm)
    modalHook.setSubmitting(false)
    if (result.success) modalHook.closeModal()
    else modalHook.setErrors({ general: result.error?.message || 'Erreur' })
  }

  const handleUpdateBox = async () => {
    if (!modalHook.selectedBox || modalHook.submitting) return
    const v: Errors = {}
    if (!modalHook.boxForm.name.trim()) v.name = 'Le nom est requis'
    if (!modalHook.boxForm.image_url.trim()) v.image_url = 'L\'image est requise'
    if (Object.keys(v).length > 0) { modalHook.setErrors(v); return }
    modalHook.setSubmitting(true)
    const result = await adminHook.updateBox(modalHook.selectedBox.id, modalHook.boxForm)
    modalHook.setSubmitting(false)
    if (result.success) modalHook.closeModal()
    else modalHook.setErrors({ general: result.error?.message || 'Erreur' })
  }

  const handleCreateItem = async () => {
    if (modalHook.submitting) return
    const v: Errors = {}
    if (!modalHook.itemForm.name.trim()) v.name = 'Le nom est requis'
    if (!modalHook.itemForm.image_url.trim()) v.image_url = 'L\'image est requise'
    if (Object.keys(v).length > 0) { modalHook.setErrors(v); return }
    modalHook.setSubmitting(true)
    const result = await adminHook.createItem(modalHook.itemForm)
    modalHook.setSubmitting(false)
    if (result.success) modalHook.closeModal()
    else modalHook.setErrors({ general: result.error?.message || 'Erreur' })
  }

  const handleUpdateItem = async () => {
    if (!modalHook.selectedItem || modalHook.submitting) return
    const v: Errors = {}
    if (!modalHook.itemForm.name.trim()) v.name = 'Le nom est requis'
    if (!modalHook.itemForm.image_url.trim()) v.image_url = 'L\'image est requise'
    if (Object.keys(v).length > 0) { modalHook.setErrors(v); return }
    modalHook.setSubmitting(true)
    const result = await adminHook.updateItem(modalHook.selectedItem.id, modalHook.itemForm)
    modalHook.setSubmitting(false)
    if (result.success) modalHook.closeModal()
    else modalHook.setErrors({ general: result.error?.message || 'Erreur' })
  }

  const handleAddItemToBox = async () => {
    if (!modalHook.selectedBox || modalHook.submitting) return
    const v: Errors = {}
    if (!modalHook.boxItemForm.item_id) v.item_id = 'Selectionnez un item'
    const probability = parseFloat(modalHook.boxItemForm.probability)
    if (!modalHook.boxItemForm.probability || probability <= 0 || probability > 100) v.probability = 'Pourcentage entre 0 et 100'
    const currentTotal = adminHook.getTotalDropRate(modalHook.selectedBox.id)
    if (currentTotal + probability > 100) v.probability = `Total depasserait 100% (${currentTotal.toFixed(6)}%)`
    const existing = adminHook.boxItems.find(bi => bi.loot_box_id === modalHook.selectedBox!.id && bi.item_id === modalHook.boxItemForm.item_id)
    if (existing) { modalHook.setErrors({ item_id: 'Item deja dans la box' }); return }
    if (Object.keys(v).length > 0) { modalHook.setErrors(v); return }
    modalHook.setSubmitting(true)
    const result = await adminHook.addItemToBox(modalHook.selectedBox.id, modalHook.boxItemForm)
    modalHook.setSubmitting(false)
    if (result.success) { modalHook.setBoxItemForm({ item_id: '', probability: '', display_order: '1' }); modalHook.setErrors({}) }
    else modalHook.setErrors({ general: result.error?.message || 'Erreur' })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await adminHook.loadData()
    setRefreshing(false)
    adminHook.showToast('Donnees actualisees')
  }

  const getSortedBoxes = () => [...adminHook.boxes].sort((a, b) => (b.price_virtual || 0) - (a.price_virtual || 0))
  const getBoxOpeningCount = (boxId: string) => adminHook.transactions.filter(t => t.type === 'box_opening' && t.loot_box_id === boxId).length
  const getRealMoneyTransactions = () => adminHook.transactions.filter(t => (t.type === 'purchase' || t.type === 'purchase_box') && t.amount && t.amount > 0)

  // Platform stat cards for enhanced dashboard
  const extraStats = [
    { label: 'Battles jouees', value: platformStats.totalBattles.toLocaleString(), icon: Sword, gradient: 'from-red-500 to-orange-500' },
    { label: 'Messages chat', value: platformStats.totalMessages.toLocaleString(), icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Coins en circulation', value: platformStats.totalCoinsCirculation.toLocaleString(), icon: Coins, gradient: 'from-amber-500 to-yellow-500' },
    { label: 'Actifs aujourd\'hui', value: platformStats.activeUsersToday.toLocaleString(), icon: Activity, gradient: 'from-green-500 to-emerald-500' },
    { label: 'Boxes ouvertes', value: platformStats.totalBoxOpenings.toLocaleString(), icon: Package, gradient: 'from-purple-500 to-pink-500' },
    { label: 'Items shop', value: platformStats.totalShopItems.toLocaleString(), icon: ShoppingCart, gradient: 'from-indigo-500 to-blue-500' },
  ]

  return (
    <div className="min-h-screen bg-[#0f1117] transition-colors duration-300 pt-20">
      {/* Toast */}
      <AnimatePresence>
        {adminHook.toast && (
          <Toast message={adminHook.toast.message} type={adminHook.toast.type} onClose={() => adminHook.setToast(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Logo */}
              <div className="rounded-2xl p-4 bg-[#1a1f2e] border border-gray-700/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">ReveelBox</span>
                  </div>
                </div>
              </div>

              {/* Search + Actions */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700/40 rounded-xl text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleRefresh} disabled={refreshing}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-[#1a1f2e] border border-gray-700/40 text-gray-400 hover:text-white hover:border-gray-600 transition-all disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Actualiser
                  </button>
                </div>
              </div>

              {/* Nav */}
              <nav className="rounded-2xl bg-[#1a1f2e] border border-gray-700/40 p-1.5 space-y-0.5">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                      }`}>
                      <Icon className="w-[18px] h-[18px]" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>

              {/* Admin info */}
              <div className="rounded-2xl p-4 bg-[#1a1f2e] border border-gray-700/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{profile?.username || 'Admin'}</div>
                    <div className="text-[10px] text-green-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> En ligne
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="lg:hidden mb-4 overflow-x-auto pb-1">
              <div className="flex gap-1.5 bg-[#1a1f2e] rounded-xl p-1 border border-gray-700/40 w-max">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                        activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-gray-400'
                      }`}>
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Dashboard */}
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Dashboard</h2>
                    <p className="text-gray-400 text-sm">Vue d'ensemble en temps reel de ReveelBox</p>
                  </div>

                  {/* Platform stats grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {extraStats.map(s => {
                      const Icon = s.icon
                      return (
                        <div key={s.label} className="rounded-xl p-4 bg-[#1a1f2e] border border-gray-700/40 hover:border-gray-600/60 transition-all group">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium">{s.label}</div>
                          </div>
                          <div className="text-2xl font-bold text-white">{s.value}</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Quick actions */}
                  <div className="rounded-xl p-5 bg-[#1a1f2e] border border-gray-700/40">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Actions rapides</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button onClick={() => modalHook.openModal('createBox')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 text-gray-300 hover:text-white transition-all">
                        <Plus className="w-5 h-5" /> <span className="text-xs font-semibold">Nouvelle Box</span>
                      </button>
                      <button onClick={() => modalHook.openModal('createItem')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 text-gray-300 hover:text-white transition-all">
                        <Image className="w-5 h-5" /> <span className="text-xs font-semibold">Nouvel Item</span>
                      </button>
                      <button onClick={() => setActiveTab('shop')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 text-gray-300 hover:text-white transition-all">
                        <ShoppingCart className="w-5 h-5" /> <span className="text-xs font-semibold">Gerer le Shop</span>
                      </button>
                      <button onClick={() => setActiveTab('system')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 text-gray-300 hover:text-white transition-all">
                        <DatabaseIcon className="w-5 h-5" /> <span className="text-xs font-semibold">Systeme</span>
                      </button>
                    </div>
                  </div>

                  {/* Core stats from existing admin hook */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl p-5 bg-[#1a1f2e] border border-gray-700/40">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-sm text-gray-400">Loot Boxes</div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{adminHook.stats.boxes || 0}</div>
                      <div className="text-xs text-gray-500">{adminHook.stats.activeBoxes || 0} actives / {adminHook.stats.featuredBoxes || 0} en vedette</div>
                    </div>
                    <div className="rounded-xl p-5 bg-[#1a1f2e] border border-gray-700/40">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                          <Image className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-sm text-gray-400">Items</div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{adminHook.stats.items || 0}</div>
                      <div className="text-xs text-gray-500">Disponibles dans les loot boxes</div>
                    </div>
                    <div className="rounded-xl p-5 bg-[#1a1f2e] border border-gray-700/40">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-sm text-gray-400">Utilisateurs</div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{adminHook.stats.users || 0}</div>
                      <div className="text-xs text-gray-500">{platformStats.activeUsersToday} actifs ces 24h</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Stats */}
              {activeTab === 'stats' && (
                <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Statistiques</h2>
                    <p className="text-gray-400 text-sm">Analyse approfondie des performances</p>
                  </div>
                  <AdvancedStats users={adminHook.users} transactions={getRealMoneyTransactions()} boxes={adminHook.boxes} items={adminHook.items} formatPrice={adminHook.formatPrice} formatDate={adminHook.formatDate} />
                </motion.div>
              )}

              {/* Boxes */}
              {activeTab === 'boxes' && (
                <BoxesManagement boxes={getSortedBoxes()} loading={adminHook.loading} searchQuery={searchQuery} stats={adminHook.stats}
                  onCreateBox={() => modalHook.openModal('createBox')} onEditBox={box => modalHook.openModal('editBox', box)}
                  onDeleteBox={adminHook.deleteBox} onManageItems={box => modalHook.openModal('manageItems', box)}
                  onExport={() => adminHook.exportData('boxes')} getBoxItems={adminHook.getBoxItems} getBoxOpeningCount={getBoxOpeningCount} />
              )}

              {/* Items */}
              {activeTab === 'items' && (
                <ItemsManagementSimple items={adminHook.items} loading={adminHook.loading} searchQuery={searchQuery}
                  onCreateItem={() => modalHook.openModal('createItem')} onEditItem={item => modalHook.openModal('editItem', item)}
                  onDeleteItem={adminHook.deleteItem} onExport={() => adminHook.exportData('items')} formatPrice={adminHook.formatPrice} />
              )}

              {/* Shop */}
              {activeTab === 'shop' && <ShopManagement />}

              {/* Users */}
              {activeTab === 'users' && (
                <UsersManagement users={adminHook.users} loading={adminHook.loading} searchQuery={searchQuery}
                  onExport={() => adminHook.exportData('users')} formatDate={adminHook.formatDate} />
              )}

              {/* Transactions */}
              {activeTab === 'transactions' && (
                <TransactionsManagement transactions={getRealMoneyTransactions()} loading={adminHook.loading}
                  onExport={() => adminHook.exportData('transactions')} formatDate={adminHook.formatDate} formatPrice={adminHook.formatPrice} />
              )}

              {/* System */}
              {activeTab === 'system' && (
                <motion.div key="system" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Systeme</h2>
                    <p className="text-gray-400 text-sm">Outils et parametres systeme</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* System Status */}
                    <div className="rounded-xl p-6 bg-[#1a1f2e] border border-gray-700/40">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <DatabaseIcon className="w-5 h-5 text-green-400" /> Etat du Systeme
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Base de donnees', status: 'Operationnelle' },
                          { label: 'API Supabase', status: 'Connectee' },
                          { label: 'Environnement', status: 'Production' },
                        ].map(s => (
                          <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40">
                            <span className="text-sm text-gray-300">{s.label}</span>
                            <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Export */}
                    <div className="rounded-xl p-6 bg-[#1a1f2e] border border-gray-700/40">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-400" /> Export
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {['boxes', 'items', 'users', 'transactions'].map(type => (
                          <button key={type} onClick={() => adminHook.exportData(type)}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 text-gray-300 hover:text-white transition-all">
                            <Package className="w-5 h-5" />
                            <span className="text-xs font-semibold capitalize">{type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Modals */}
      <BoxModal
        isOpen={modalHook.showModal && (modalHook.modalType === 'createBox' || modalHook.modalType === 'editBox')}
        isEdit={modalHook.modalType === 'editBox'} boxForm={modalHook.boxForm} errors={modalHook.errors}
        submitting={modalHook.submitting} onClose={modalHook.closeModal}
        onSubmit={modalHook.modalType === 'editBox' ? handleUpdateBox : handleCreateBox}
        onFormChange={updates => modalHook.setBoxForm(prev => ({ ...prev, ...updates }))} />

      <ItemModal
        isOpen={modalHook.showModal && (modalHook.modalType === 'createItem' || modalHook.modalType === 'editItem')}
        isEdit={modalHook.modalType === 'editItem'} itemForm={modalHook.itemForm} errors={modalHook.errors}
        submitting={modalHook.submitting} onClose={modalHook.closeModal}
        onSubmit={modalHook.modalType === 'editItem' ? handleUpdateItem : handleCreateItem}
        onFormChange={updates => modalHook.setItemForm(prev => ({ ...prev, ...updates }))} />

      <ManageItemsModal
        isOpen={modalHook.showModal && modalHook.modalType === 'manageItems'}
        selectedBox={modalHook.selectedBox} boxItemForm={modalHook.boxItemForm} errors={modalHook.errors}
        submitting={modalHook.submitting} items={adminHook.items} boxItems={adminHook.boxItems}
        onClose={modalHook.closeModal}
        onFormChange={updates => modalHook.setBoxItemForm(prev => ({ ...prev, ...updates }))}
        onAddItem={handleAddItemToBox}
        onUpdateItemOrder={async (boxId, newOrder) => { await adminHook.updateItemOrder(boxId, newOrder) }}
        onDeleteBoxItem={async boxItemId => { await adminHook.deleteBoxItem(boxItemId) }}
        onUpdateProbability={async (boxItemId, newProb) => { await adminHook.updateBoxItemProbability(boxItemId, newProb) }}
        getBoxItems={adminHook.getBoxItems} getTotalDropRate={adminHook.getTotalDropRate} />
    </div>
  )
}

// Root
export default function AdminPage() {
  return (
    <ThemeProvider>
      <AdvancedAdminPanel />
    </ThemeProvider>
  )
}
