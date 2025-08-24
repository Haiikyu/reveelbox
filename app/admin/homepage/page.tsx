'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Home,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  Upload,
  Star,
  Package
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import { Profile } from '@/app/types/database'

interface LootBox {
  id: string
  name: string
  description: string
  price_virtual: number
  image_url?: string
  is_active: boolean
  is_featured: boolean
  created_at: string
}

export default function AdminHomepageBoxes() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [boxes, setBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingBox, setEditingBox] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const supabase = createClient()

// Vérification admin
useEffect(() => {
  if (!authLoading && (!isAuthenticated || profile?.role !== 'admin')) {
    window.location.href = '/login'
  }
}, [authLoading, isAuthenticated, profile])

useEffect(() => {
  if (isAuthenticated && profile?.role === 'admin') {
    loadBoxes()
  }
}, [isAuthenticated, profile])

  const loadBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('loot_boxes')
        .select('*')
        .eq('is_active', true)
        .order('price_virtual', { ascending: false })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      console.log('Boîtes chargées:', data?.length || 0)
      setBoxes(data || [])
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('error', 'Erreur lors du chargement des boîtes')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const toggleFeatured = async (boxId: string, currentFeatured: boolean) => {
    setSaving(boxId)
    try {
      // Vérifier le nombre de boîtes featured avant d'ajouter
      if (!currentFeatured) {
        const featuredCount = boxes.filter(b => b.is_featured).length
        if (featuredCount >= 4) {
          showMessage('error', 'Maximum 4 boîtes peuvent être affichées sur l\'accueil')
          setSaving(null)
          return
        }
      }

      console.log(`Toggle featured pour ${boxId}: ${currentFeatured} -> ${!currentFeatured}`)

      const { data, error } = await supabase
        .from('loot_boxes')
        .update({ is_featured: !currentFeatured })
        .eq('id', boxId)
        .select()

      if (error) {
        console.error('Erreur Supabase update:', error)
        throw error
      }

      console.log('Update réussi:', data)

      // Mettre à jour l'état local
      setBoxes(prev => prev.map(box => 
        box.id === boxId 
          ? { ...box, is_featured: !currentFeatured }
          : box
      ))

      showMessage('success', `Boîte ${!currentFeatured ? 'ajoutée à' : 'retirée de'} l'accueil`)
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      showMessage('error', 'Erreur lors de la modification: ' + (error as Error).message)
    } finally {
      setSaving(null)
    }
  }

  const updateBox = async (boxId: string, updates: Partial<LootBox>) => {
    setSaving(boxId)
    try {
      const { error } = await supabase
        .from('loot_boxes')
        .update(updates)
        .eq('id', boxId)

      if (error) throw error

      // Mettre à jour l'état local
      setBoxes(prev => prev.map(box => 
        box.id === boxId 
          ? { ...box, ...updates }
          : box
      ))

      setEditingBox(null)
      showMessage('success', 'Boîte mise à jour avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('error', 'Erreur lors de la mise à jour')
    } finally {
      setSaving(null)
    }
  }

  const handleImageUpload = async (boxId: string, file: File) => {
    setSaving(boxId)
    try {
      // Uploader l'image vers Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${boxId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('loot-boxes')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('loot-boxes')
        .getPublicUrl(fileName)

      // Mettre à jour la boîte avec la nouvelle image
      await updateBox(boxId, { image_url: publicUrl })
    } catch (error) {
      console.error('Erreur upload:', error)
      showMessage('error', 'Erreur lors du téléchargement de l\'image')
      setSaving(null)
    }
  }

  const EditBoxForm = ({ box }: { box: LootBox }) => {
    const [formData, setFormData] = useState({
      name: box.name,
      description: box.description,
      price_virtual: box.price_virtual,
      image_url: box.image_url || ''
    })

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-6 max-w-md w-full"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Modifier la boîte</h3>
            <button
              onClick={() => setEditingBox(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 h-20 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix (coins)
              </label>
              <input
                type="number"
                value={formData.price_virtual}
                onChange={(e) => setFormData(prev => ({ ...prev, price_virtual: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Image
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://exemple.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>

            {/* Upload d'image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ou télécharger une nouvelle image
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(box.id, file)
                    }
                  }}
                  className="hidden"
                  id={`upload-${box.id}`}
                />
                <label
                  htmlFor={`upload-${box.id}`}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={16} />
                  Télécharger une image
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => updateBox(box.id, formData)}
              disabled={saving === box.id}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saving === box.id ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button
              onClick={() => setEditingBox(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Attendre la vérification auth
  if (authLoading || !isAuthenticated || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const featuredBoxes = boxes.filter(box => box.is_featured)
  const nonFeaturedBoxes = boxes.filter(box => !box.is_featured)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-200 text-green-800' 
              : 'bg-red-100 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Home className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Gestion Page d'Accueil</h1>
          </div>
          <p className="text-gray-600">
            Gérez les boîtes affichées sur la page d'accueil (maximum 4)
          </p>
        </div>

        {/* Boîtes Featured (Page d'accueil) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-6 w-6" />
              Boîtes sur l'Accueil ({featuredBoxes.length}/4)
            </h2>
          </div>

          {featuredBoxes.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune boîte featured</h3>
              <p className="text-gray-600">Sélectionnez jusqu'à 4 boîtes à afficher sur l'accueil</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBoxes.map((box) => (
                <BoxCard
                  key={box.id}
                  box={box}
                  onToggleFeatured={toggleFeatured}
                  onEdit={() => setEditingBox(box.id)}
                  saving={saving === box.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Toutes les autres boîtes */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Toutes les Boîtes</h2>
          
          {nonFeaturedBoxes.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <p className="text-gray-600">Toutes les boîtes sont déjà sur l'accueil</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nonFeaturedBoxes.map((box) => (
                <BoxCard
                  key={box.id}
                  box={box}
                  onToggleFeatured={toggleFeatured}
                  onEdit={() => setEditingBox(box.id)}
                  saving={saving === box.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      {editingBox && (
        <EditBoxForm box={boxes.find(b => b.id === editingBox)!} />
      )}
    </div>
  )
}

// Composant BoxCard
interface BoxCardProps {
  box: LootBox
  onToggleFeatured: (id: string, current: boolean) => void
  onEdit: () => void
  saving: boolean
}

function BoxCard({ box, onToggleFeatured, onEdit, saving }: BoxCardProps) {
  return (
    <motion.div
      layout
      className="bg-white rounded-xl p-4 relative group hover:shadow-lg transition-all duration-300 border border-gray-200"
    >
      {/* Badge Featured */}
      {box.is_featured && (
        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          ACCUEIL
        </div>
      )}

      {/* Image */}
      <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-gray-100">
        {box.image_url ? (
          <img
            src={box.image_url}
            alt={box.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDc1VjEyNUwxMDAgMTUwTDUwIDEyNVY3NUwxMDAgNTBaIiBmaWxsPSIjOUM5Q0EzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Qjc5ODAiPkJvw65lPC90ZXh0Pgo8L3N2Zz4K'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="space-y-2">
        <h3 className="font-bold text-gray-900 line-clamp-1">{box.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{box.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-green-600">{box.price_virtual} coins</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onToggleFeatured(box.id, box.is_featured)}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
            box.is_featured
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          } disabled:opacity-50`}
        >
          {box.is_featured ? <EyeOff size={16} /> : <Eye size={16} />}
          {saving ? '...' : (box.is_featured ? 'Retirer' : 'Ajouter')}
        </button>
        
        <button
          onClick={onEdit}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium p-2 rounded-lg"
          title="Modifier"
        >
          <Edit size={16} />
        </button>
      </div>
    </motion.div>
  )
}