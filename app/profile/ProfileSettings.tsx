// ✅ CORRECTION COMPLÈTE du fichier ProfileSettings.tsx

'use client'

import { useState } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3,
  Save,
  X,
  Mail,
  Shield,
  Bell,
  Download,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Key,
  AlertTriangle,
  Phone,
  MapPin,
  Calendar,
  FileText,
  LogOut
} from 'lucide-react'

// ✅ INTERFACE CORRIGÉE - type changé en 'success' | 'error'
interface ProfileSettingsProps {
  user: any
  profile: any
  formData: any
  setFormData: (data: any) => void
  editMode: boolean
  setEditMode: (mode: boolean) => void
  showNotification: (type: 'success' | 'error', message: string) => void // ✅ CORRIGÉ
  onSave: () => void
  saving: boolean
  handleAvatarUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void // ✅ Type précisé
  uploadingAvatar?: boolean
}

export default function ProfileSettings({ 
  user, 
  profile, 
  formData, 
  setFormData, 
  editMode, 
  setEditMode,
  showNotification,
  onSave,
  saving = false,
  handleAvatarUpload,
  uploadingAvatar = false
}: ProfileSettingsProps) {
  const [passwordModal, setPasswordModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ✅ HANDLERS TYPÉS CORRECTEMENT
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const cancelEdit = () => {
    setEditMode(false)
    setFormData({
      username: profile?.username || '',
      email: user?.email || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      birth_date: profile?.birth_date || '',
      privacy_profile: profile?.privacy_profile || 'public',
      notifications_email: profile?.notifications_email ?? true,
      notifications_push: profile?.notifications_push ?? true
    })
  }

  const sendVerificationEmail = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) throw error
      showNotification('success', 'Email de vérification envoyé !')
      
    } catch (error) {
      console.error('Error sending verification email:', error)
      showNotification('error', 'Erreur lors de l\'envoi de l\'email')
    }
  }

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showNotification('error', 'Veuillez remplir tous les champs')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showNotification('error', 'Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('error', 'Les mots de passe ne correspondent pas')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      setPasswordModal(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showNotification('success', 'Mot de passe modifié avec succès !')
      
    } catch (error) {
      console.error('Error changing password:', error)
      showNotification('error', 'Erreur lors de la modification du mot de passe')
    }
  }

  const exportUserData = async () => {
    setExportingData(true)
    
    try {
      const supabase = createClient()
      const [profileRes, transactionsRes, inventoryRes, battlesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('user_inventory').select('*, items(*)').eq('user_id', user.id),
        supabase.from('battle_players').select('*, battles(*)').eq('user_id', user.id)
      ])

      const userData = {
        profile: profileRes.data,
        transactions: transactionsRes.data || [],
        inventory: inventoryRes.data || [],
        battles: battlesRes.data || [],
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `reveelbox-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showNotification('success', 'Données exportées avec succès !')
      
    } catch (error) {
      console.error('Error exporting data:', error)
      showNotification('error', 'Erreur lors de l\'export des données')
    } finally {
      setExportingData(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') {
      showNotification('error', 'Veuillez taper "SUPPRIMER" pour confirmer')
      return
    }

    try {
      const supabase = createClient()
      await supabase.from('battle_players').delete().eq('user_id', user.id)
      await supabase.from('user_inventory').delete().eq('user_id', user.id)
      await supabase.from('transactions').delete().eq('user_id', user.id)
      await supabase.from('profiles').delete().eq('id', user.id)

      showNotification('success', 'Compte supprimé avec succès')
      await supabase.auth.signOut()
      window.location.href = '/'
      
    } catch (error) {
      console.error('Error deleting account:', error)
      showNotification('error', 'Erreur lors de la suppression du compte')
    }
  }

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      showNotification('error', 'Erreur lors de la déconnexion')
    }
  }

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Informations personnelles</h2>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            </div>
          )}
        </div>

        {/* Avatar Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Photo de profil
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {(formData.username || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              {handleAvatarUpload && (
                <>
                  <input
                    type="file"
                    id="avatar-upload-settings"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  <label
                    htmlFor="avatar-upload-settings"
                    className={`inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    {uploadingAvatar ? 'Upload en cours...' : 'Changer la photo'}
                  </label>
                </>
              )}
              <p className="text-gray-500 text-xs mt-1">
                JPG, PNG ou GIF. Maximum 5MB.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username || ''}
              onChange={handleInputChange}
              disabled={!editMode}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              placeholder="Votre nom d'utilisateur"
              minLength={3}
              maxLength={30}
            />
            {editMode && (
              <p className="text-gray-500 text-xs mt-1">
                3-30 caractères. Lettres, chiffres et tirets autorisés.
              </p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                disabled={true}
                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                placeholder="Votre email"
              />
              {!user?.email_confirmed_at && (
                <button
                  onClick={sendVerificationEmail}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-600"
                  title="Email non vérifié - Cliquez pour renvoyer"
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {user?.email_confirmed_at ? (
                <span className="text-green-600">✓ Email vérifié</span>
              ) : (
                <span className="text-orange-600">⚠ Email non vérifié</span>
              )}
            </p>
          </div>
          
          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleInputChange}
              disabled={!editMode}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-none"
              placeholder="Parlez-nous de vous..."
            />
            {editMode && (
              <p className="text-gray-500 text-xs mt-1">
                {(formData.bio || '').length}/500 caractères
              </p>
            )}
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              disabled={!editMode}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              placeholder="Votre ville, pays"
              maxLength={100}
            />
          </div>
          
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              disabled={!editMode}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          
          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de naissance
            </label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date || ''}
              onChange={handleInputChange}
              disabled={!editMode}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Confidentialité</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibilité du profil
          </label>
          <select
            name="privacy_profile"
            value={formData.privacy_profile || 'public'}
            onChange={handleInputChange}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          >
            <option value="public">Public - Visible par tous</option>
            <option value="friends">Amis uniquement</option>
            <option value="private">Privé - Invisible</option>
          </select>
          <p className="text-gray-500 text-xs mt-1">
            Contrôlez qui peut voir vos statistiques et votre activité.
          </p>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>
        
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Notifications email</div>
                <div className="text-sm text-gray-600">
                  Recevez des emails pour les nouvelles importantes et récompenses
                </div>
              </div>
            </div>
            <button
              onClick={() => setFormData((prev: any) => ({ 
                ...prev, 
                notifications_email: !prev.notifications_email 
              }))}
              disabled={!editMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.notifications_email ? 'bg-green-500' : 'bg-gray-300'
              } ${!editMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.notifications_email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Notifications push</div>
                <div className="text-sm text-gray-600">
                  Notifications dans le navigateur pour les événements en temps réel
                </div>
              </div>
            </div>
            <button
              onClick={() => setFormData((prev: any) => ({ 
                ...prev, 
                notifications_push: !prev.notifications_push 
              }))}
              disabled={!editMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.notifications_push ? 'bg-green-500' : 'bg-gray-300'
              } ${!editMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.notifications_push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security & Account Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Sécurité et actions du compte</h2>
        
        <div className="space-y-4">
          {/* Change Password */}
          <button 
            onClick={() => setPasswordModal(true)}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <Key className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Changer le mot de passe</div>
              <div className="text-sm text-gray-600">Mettre à jour votre mot de passe pour la sécurité</div>
            </div>
          </button>
          
          {/* Export Data */}
          <button 
            onClick={exportUserData}
            disabled={exportingData}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
          >
            {exportingData ? (
              <Loader2 className="h-5 w-5 text-gray-600 animate-spin" />
            ) : (
              <Download className="h-5 w-5 text-gray-600" />
            )}
            <div>
              <div className="font-medium text-gray-900">Exporter mes données</div>
              <div className="text-sm text-gray-600">
                Télécharger toutes vos données de compte au format JSON
              </div>
            </div>
          </button>

          {/* Sign Out */}
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Se déconnecter</div>
              <div className="text-sm text-gray-600">
                Déconnexion de votre compte sur cet appareil
              </div>
            </div>
          </button>
          
          {/* Delete Account */}
          <button 
            onClick={() => setDeleteModal(true)}
            className="w-full flex items-center gap-3 p-4 border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-left"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
            <div>
              <div className="font-medium text-red-900">Supprimer le compte</div>
              <div className="text-sm text-red-600">
                Suppression définitive et irréversible de votre compte
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Account Information Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Informations du compte</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">ID utilisateur :</span>
            <span className="font-mono text-gray-900">{user?.id?.slice(0, 8)}...</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Date de création :</span>
            <span className="text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Dernière connexion :</span>
            <span className="text-gray-900">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Type de compte :</span>
            <span className="text-gray-900">Utilisateur standard</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-xl border border-green-300">
          <p className="text-sm text-gray-700">
            <strong>💡 Conseil :</strong> Exportez régulièrement vos données pour garder une sauvegarde de votre progression.
          </p>
        </div>
      </div>

      {/* Help & Support */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aide et support</h2>
        
        <div className="space-y-3">
          <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <FileText className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Centre d'aide</div>
              <div className="text-sm text-gray-600">FAQ et guides d'utilisation</div>
            </div>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <Mail className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Contacter le support</div>
              <div className="text-sm text-gray-600">Besoin d'aide ? Écrivez-nous</div>
            </div>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <Shield className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Politique de confidentialité</div>
              <div className="text-sm text-gray-600">Comment nous protégeons vos données</div>
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}
      
      {/* Password Change Modal */}
      <AnimatePresence>
        {passwordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Changer le mot de passe</h3>
              
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nouveau mot de passe"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Confirmer le nouveau mot de passe"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={changePassword}
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-colors font-medium"
                >
                  Modifier le mot de passe
                </button>
                <button
                  onClick={() => {
                    setPasswordModal(false)
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Supprimer le compte</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées :
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Profil et informations personnelles</li>
                  <li>Historique des transactions</li>
                  <li>Inventaire et objets obtenus</li>
                  <li>Statistiques et achievements</li>
                  <li>Historique des battles</li>
                </ul>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="SUPPRIMER"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirmation !== 'SUPPRIMER'}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Supprimer définitivement
                </button>
                <button
                  onClick={() => {
                    setDeleteModal(false)
                    setDeleteConfirmation('')
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                Cette action ne peut pas être annulée. Assurez-vous d'avoir exporté vos données si nécessaire.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Loading Modal */}
      <AnimatePresence>
        {exportingData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 text-center"
            >
              <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Export en cours...</h3>
              <p className="text-gray-600">Préparation de vos données pour le téléchargement</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}