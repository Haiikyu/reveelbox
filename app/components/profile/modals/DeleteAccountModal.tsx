'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/app/components/AuthProvider'
import Modal from '@/app/components/ui/Modal'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { user, signOut } = useAuth()
  const supabase = createClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirmStep1 = () => setStep(2)

  const handleDelete = async () => {
    if (!user || !password) return
    setLoading(true)
    setError('')

    try {
      // Verify password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password,
      })

      if (signInError) {
        setError('Mot de passe incorrect')
        setLoading(false)
        return
      }

      // Soft-delete: mark profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_reason: 'account_deletion_requested',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Sign out
      await signOut()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setPassword('')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-xl font-black text-white mb-2">Supprimer votre compte ?</h3>
              <p className="text-sm text-white/50 mb-6">
                Votre compte sera marqué pour suppression. Vous aurez 30 jours pour vous reconnecter et annuler.
                Après 30 jours, toutes vos données seront supprimées définitivement.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmStep1}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-xl font-black text-white mb-2">Confirmer avec votre mot de passe</h3>
              <p className="text-sm text-white/50 mb-4">
                Saisissez votre mot de passe pour confirmer la suppression.
              </p>

              <div className="relative mb-4">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDelete()}
                  placeholder="Mot de passe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-red-500/50"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 mb-3">{error}</p>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition"
                >
                  Retour
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || !password}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Supprimer définitivement
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
