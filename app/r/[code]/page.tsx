'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gift, Loader, ExternalLink, AlertCircle } from 'lucide-react'

interface AffiliateInfo {
  valid: boolean
  referrer_username?: string
  referrer_tier?: string
  bonus_amount?: number
  commission_rate?: number
  error?: string
}

export default function AffiliateRedirectPage(): JSX.Element {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (code) {
      validateAndRedirect()
    }
  }, [code])

  const validateAndRedirect = async (): Promise<void> => {
    try {
      setLoading(true)

      // Valider le code d'affiliation
      const response = await fetch(`/api/affiliate/validate-code?code=${code}`)
      const data = await response.json()

      setAffiliateInfo(data)

      if (data.valid) {
        // Enregistrer le clic
        await fetch('/api/affiliate/track-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            affiliate_code: code,
            ip_address: null,
            user_agent: navigator.userAgent,
            referrer_url: document.referrer
          })
        })

        // Rediriger après un court délai
        setTimeout(() => {
          setRedirecting(true)
          router.push(`/signup?ref=${code}`)
        }, 2000)
      }

    } catch (error) {
      console.error('Erreur validation code:', error)
      setAffiliateInfo({
        valid: false,
        error: 'Erreur lors de la validation du code'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader className="h-8 w-8 animate-spin text-success mx-auto mb-4" />
          <p className="text-secondary">Validation du lien d'affiliation...</p>
        </motion.div>
      </div>
    )
  }

  if (!affiliateInfo || !affiliateInfo.valid) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-primary/30"
        >
          <div className="h-16 w-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-error" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-4">
            Lien invalide
          </h1>
          <p className="text-secondary mb-6">
            {affiliateInfo?.error || 'Ce lien d\'affiliation n\'est pas valide ou a expiré.'}
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="btn-success w-full py-3 rounded-lg font-semibold"
          >
            Continuer vers l'inscription
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-glass rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-primary/30"
      >
        <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Gift className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-primary mb-2">
          Invitation de parrainage
        </h1>

        <p className="text-secondary mb-6">
          {affiliateInfo.referrer_username} vous invite à rejoindre ReveelBox !
        </p>

        <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-sm font-medium text-success">
              Niveau {affiliateInfo.referrer_tier}
            </span>
            <span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs">
              {((affiliateInfo.commission_rate || 0) * 100).toFixed(0)}% commission
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-lg p-3 border border-primary/20">
              <div className="text-lg font-bold text-success">
                {affiliateInfo.bonus_amount}
              </div>
              <div className="text-xs text-secondary">Coins bonus</div>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-primary/20">
              <div className="text-lg font-bold text-success">🎁</div>
              <div className="text-xs text-secondary">Avantages exclusifs</div>
            </div>
          </div>
        </div>

        {redirecting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Loader className="h-6 w-6 animate-spin text-success mx-auto" />
            <p className="text-secondary">Redirection vers l'inscription...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-success">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">Redirection automatique dans quelques secondes</span>
            </div>
            <button
              onClick={() => router.push(`/signup?ref=${code}`)}
              className="btn-success w-full py-3 rounded-lg font-semibold"
            >
              Continuer maintenant
            </button>
          </motion.div>
        )}

        <div className="mt-6 pt-6 border-t border-primary/20">
          <p className="text-xs text-muted">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité
          </p>
        </div>
      </motion.div>
    </div>
  )
}