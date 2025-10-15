'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Edit3, Check, X, AlertCircle, Loader, MessageSquare } from 'lucide-react'
import type { AffiliateProfile } from './types'

interface AffiliateSettingsProps {
  affiliateProfile: AffiliateProfile
  onUpdateCode: (newCode: string) => Promise<void>
  onUpdateMessage: (newMessage: string) => Promise<void>
}

export default function AffiliateSettings({
  affiliateProfile,
  onUpdateCode,
  onUpdateMessage
}: AffiliateSettingsProps) {
  const [isEditingCode, setIsEditingCode] = useState(false)
  const [codeInput, setCodeInput] = useState(affiliateProfile.affiliate_code)
  const [codeError, setCodeError] = useState('')
  const [codeSaving, setCodeSaving] = useState(false)

  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const [messageInput, setMessageInput] = useState(affiliateProfile.custom_share_message || '')
  const [messageSaving, setMessageSaving] = useState(false)

  const validateCode = (code: string): boolean => {
    if (code.length < 3 || code.length > 12) {
      setCodeError('Le code doit contenir entre 3 et 12 caractères')
      return false
    }
    if (!/^[A-Z0-9]+$/.test(code)) {
      setCodeError('Le code ne peut contenir que des lettres majuscules et des chiffres')
      return false
    }
    setCodeError('')
    return true
  }

  const handleCodeSubmit = async () => {
    const upperCode = codeInput.toUpperCase()
    if (!validateCode(upperCode)) return

    setCodeSaving(true)
    try {
      await onUpdateCode(upperCode)
      setIsEditingCode(false)
    } catch (error) {
      setCodeError('Erreur lors de la mise à jour')
    } finally {
      setCodeSaving(false)
    }
  }

  const handleMessageSubmit = async () => {
    if (messageInput.length < 10) return

    setMessageSaving(true)
    try {
      await onUpdateMessage(messageInput)
      setIsEditingMessage(false)
    } finally {
      setMessageSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Affiliate Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Code d'affiliation</h3>
        </div>

        {!isEditingCode ? (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Votre code actuel</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {affiliateProfile.affiliate_code}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsEditingCode(true)
                setCodeInput(affiliateProfile.affiliate_code)
                setCodeError('')
              }}
              className="w-full bg-indigo-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Modifier
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau code (3-12 caractères)
              </label>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase()
                  setCodeInput(upper)
                  validateCode(upper)
                }}
                maxLength={12}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white uppercase focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="MONCODE"
              />
              {codeError && (
                <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {codeError}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCodeSubmit}
                disabled={codeSaving || !!codeError || codeInput.length < 3}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {codeSaving ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Enregistrer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsEditingCode(false)
                  setCodeInput(affiliateProfile.affiliate_code)
                  setCodeError('')
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Custom Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Message de partage</h3>
        </div>

        {!isEditingMessage ? (
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Message actuel</div>
              <p className="text-sm text-gray-900 dark:text-white">
                {affiliateProfile.custom_share_message || 'Aucun message personnalisé'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsEditingMessage(true)
                setMessageInput(affiliateProfile.custom_share_message || '')
              }}
              className="w-full bg-indigo-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Modifier
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau message (minimum 10 caractères)
              </label>
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                rows={4}
                maxLength={280}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Découvre ReveelBox avec mon code !"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {messageInput.length}/280 caractères
                </span>
                {messageInput.length < 10 && (
                  <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Minimum 10 caractères
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMessageSubmit}
                disabled={messageSaving || messageInput.length < 10}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {messageSaving ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Enregistrer
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsEditingMessage(false)
                  setMessageInput(affiliateProfile.custom_share_message || '')
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Informations du compte</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date de création</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {new Date(affiliateProfile.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut</div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${affiliateProfile.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {affiliateProfile.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
