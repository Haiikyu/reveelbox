'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit3, Check, X, AlertCircle, Loader } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import type { AffiliateProfile } from './types'

interface AffiliateSettingsProps {
  affiliateProfile: AffiliateProfile
  onUpdateCode: (newCode: string) => Promise<void>
  onUpdateMessage: (newMessage: string) => Promise<void>
}

export default function AffiliateSettings({
  affiliateProfile, onUpdateCode, onUpdateMessage
}: AffiliateSettingsProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [isEditingCode, setIsEditingCode] = useState(false)
  const [codeInput, setCodeInput] = useState(affiliateProfile.affiliate_code)
  const [codeError, setCodeError] = useState('')
  const [codeSaving, setCodeSaving] = useState(false)

  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const [messageInput, setMessageInput] = useState(affiliateProfile.custom_share_message || '')
  const [messageSaving, setMessageSaving] = useState(false)

  const sectionStyle = {
    background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
  }

  const labelColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'
  const subtextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const inputBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)'

  const validateCode = (code: string): boolean => {
    if (code.length < 3 || code.length > 12) {
      setCodeError('3-12 caractères requis')
      return false
    }
    if (!/^[A-Z0-9]+$/.test(code)) {
      setCodeError('Lettres majuscules et chiffres uniquement')
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
    } catch {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5"
      style={sectionStyle}
    >
      <h3 className="text-[11px] font-medium uppercase mb-4" style={{
        letterSpacing: '0.1em', color: labelColor
      }}>
        Paramètres
      </h3>

      {/* Affiliate Code */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: subtextColor }}>Code d&apos;affiliation</span>
          {!isEditingCode && (
            <button
              onClick={() => { setIsEditingCode(true); setCodeInput(affiliateProfile.affiliate_code); setCodeError('') }}
              className="p-1 rounded-md transition-colors hover:bg-white/5"
            >
              <Edit3 size={12} style={{ color: subtextColor }} />
            </button>
          )}
        </div>

        {!isEditingCode ? (
          <div className="text-lg font-bold" style={{ color: '#3b82f6' }}>
            {affiliateProfile.affiliate_code}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => { const u = e.target.value.toUpperCase(); setCodeInput(u); validateCode(u) }}
              maxLength={12}
              className="w-full px-3 py-2 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: inputBg, border: inputBorder, color: textColor }}
              placeholder="MONCODE"
            />
            {codeError && (
              <div className="flex items-center gap-1 text-[10px]" style={{ color: '#ef4444' }}>
                <AlertCircle className="h-3 w-3" />
                {codeError}
              </div>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={handleCodeSubmit}
                disabled={codeSaving || !!codeError || codeInput.length < 3}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-40"
                style={{ background: '#10b981' }}
              >
                {codeSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                OK
              </button>
              <button
                onClick={() => { setIsEditingCode(false); setCodeInput(affiliateProfile.affiliate_code); setCodeError('') }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: inputBg, border: inputBorder, color: subtextColor }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mb-5" style={{
        borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
      }} />

      {/* Share Message */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: subtextColor }}>Message de partage</span>
          {!isEditingMessage && (
            <button
              onClick={() => { setIsEditingMessage(true); setMessageInput(affiliateProfile.custom_share_message || '') }}
              className="p-1 rounded-md transition-colors hover:bg-white/5"
            >
              <Edit3 size={12} style={{ color: subtextColor }} />
            </button>
          )}
        </div>

        {!isEditingMessage ? (
          <p className="text-sm leading-relaxed" style={{ color: textColor }}>
            {affiliateProfile.custom_share_message || 'Aucun message'}
          </p>
        ) : (
          <div className="space-y-2">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              rows={2}
              maxLength={280}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: inputBg, border: inputBorder, color: textColor }}
              placeholder="Découvre ReveelBox !"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: subtextColor }}>{messageInput.length}/280</span>
              {messageInput.length < 10 && (
                <span className="text-[10px]" style={{ color: '#ef4444' }}>Min. 10 car.</span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleMessageSubmit}
                disabled={messageSaving || messageInput.length < 10}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-40"
                style={{ background: '#10b981' }}
              >
                {messageSaving ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                OK
              </button>
              <button
                onClick={() => { setIsEditingMessage(false); setMessageInput(affiliateProfile.custom_share_message || '') }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: inputBg, border: inputBorder, color: subtextColor }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mb-4" style={{
        borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
      }} />

      {/* Account Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${affiliateProfile.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-[10px] font-medium" style={{ color: subtextColor }}>
            {affiliateProfile.is_active ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>
          Depuis {new Date(affiliateProfile.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
        </span>
      </div>
    </motion.div>
  )
}
