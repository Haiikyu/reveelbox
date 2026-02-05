// app/components/ProvablyFairVerifier.tsx
// Composant pour vérifier les résultats Provably Fair
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle, XCircle, Copy, Check, Info, X } from 'lucide-react'
import { verifyProvablyFairResult, hashServerSeed, calculateProvablyFairPercentage } from '@/lib/provablyFair'

interface ProvablyFairVerifierProps {
  isOpen: boolean
  onClose: () => void
  data?: {
    serverSeedHash: string
    serverSeed: string
    clientSeed: string
    nonce: number
    roll: number
    hash: string
  }
}

export function ProvablyFairVerifier({ isOpen, onClose, data }: ProvablyFairVerifierProps) {
  const [manualServerSeed, setManualServerSeed] = useState('')
  const [manualServerSeedHash, setManualServerSeedHash] = useState('')
  const [manualClientSeed, setManualClientSeed] = useState('')
  const [manualNonce, setManualNonce] = useState('0')
  const [manualRoll, setManualRoll] = useState('')
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    calculatedRoll: number
    hashMatches: boolean
  } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Utiliser les données fournies ou les valeurs manuelles
  const serverSeed = data?.serverSeed || manualServerSeed
  const serverSeedHash = data?.serverSeedHash || manualServerSeedHash
  const clientSeed = data?.clientSeed || manualClientSeed
  const nonce = data?.nonce ?? (parseInt(manualNonce) || 0)
  const roll = data?.roll ?? (parseFloat(manualRoll) || 0)

  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    if (!serverSeed || !serverSeedHash) {
      return
    }

    setIsVerifying(true)

    try {
      // Utiliser l'API Web Crypto pour un hash identique au serveur
      const encoder = new TextEncoder()
      const data = encoder.encode(serverSeed)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const hashMatches = calculatedHash.toLowerCase() === serverSeedHash.toLowerCase()

      console.log('🔐 Provably Fair verification:', {
        serverSeed,
        serverSeedHash,
        calculatedHash,
        hashMatches
      })

      // Pour les battles, le roll dépend de battleId + boxOrder + position
      let calculatedRoll = 0
      if (clientSeed) {
        calculatedRoll = calculateProvablyFairPercentage(serverSeed, clientSeed, nonce)
      }

      setVerificationResult({
        isValid: hashMatches,
        calculatedRoll,
        hashMatches
      })
    } catch (error) {
      console.error('Error verifying:', error)
      setVerificationResult({
        isValid: false,
        calculatedRoll: 0,
        hashMatches: false
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="p-1 hover:bg-white/10 rounded transition-colors"
      title="Copier"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Provably Fair</h2>
                <p className="text-sm text-gray-400">Vérifiez l'équité de vos résultats</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Explication */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200/80">
                  <p className="font-medium text-blue-300 mb-1">Comment ça fonctionne ?</p>
                  <p className="mb-2">
                    Le système Provably Fair utilise une combinaison de seeds (serveur + client)
                    pour générer des résultats vérifiables. Le hash du server seed est montré
                    <strong> avant</strong> le jeu, puis le vrai seed est révélé <strong>après</strong>.
                  </p>
                  <p className="text-blue-300/60 text-xs">
                    <strong>Pour les battles :</strong> Chaque ouverture utilise la formule
                    SHA256(serverSeed + clientSeed + battleId + boxOrder + position).
                    La vérification ici confirme que le server seed n'a pas été modifié après le début.
                  </p>
                </div>
              </div>
            </div>

            {/* Données */}
            <div className="space-y-4">
              {/* Server Seed Hash */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Server Seed Hash (affiché avant)
                </label>
                <div className="flex items-center gap-2">
                  {data ? (
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 truncate">
                      {serverSeedHash}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={manualServerSeedHash}
                      onChange={(e) => setManualServerSeedHash(e.target.value)}
                      placeholder="Hash SHA256 du server seed"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                  {serverSeedHash && <CopyButton text={serverSeedHash} field="hash" />}
                </div>
              </div>

              {/* Server Seed */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Server Seed (révélé après)
                </label>
                <div className="flex items-center gap-2">
                  {data ? (
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 truncate">
                      {serverSeed}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={manualServerSeed}
                      onChange={(e) => setManualServerSeed(e.target.value)}
                      placeholder="Server seed"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                  {serverSeed && <CopyButton text={serverSeed} field="serverSeed" />}
                </div>
              </div>

              {/* Client Seed */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Client Seed
                </label>
                <div className="flex items-center gap-2">
                  {data ? (
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300 truncate">
                      {clientSeed}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={manualClientSeed}
                      onChange={(e) => setManualClientSeed(e.target.value)}
                      placeholder="Client seed"
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                  {clientSeed && <CopyButton text={clientSeed} field="clientSeed" />}
                </div>
              </div>

              {/* Nonce & Roll */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nonce
                  </label>
                  {data ? (
                    <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300">
                      {nonce}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={manualNonce}
                      onChange={(e) => setManualNonce(e.target.value)}
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Roll (résultat)
                  </label>
                  {data ? (
                    <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300">
                      {roll.toFixed(4)}%
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.0001"
                      value={manualRoll}
                      onChange={(e) => setManualRoll(e.target.value)}
                      placeholder="0.0000"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                </div>
              </div>

              {/* Combined Hash */}
              {data?.hash && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Hash combiné
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs text-gray-300 truncate">
                      {data.hash}
                    </div>
                    <CopyButton text={data.hash} field="combinedHash" />
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Vérifier */}
            <button
              onClick={handleVerify}
              disabled={!serverSeed || !serverSeedHash || isVerifying}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Vérifier le Server Seed
                </>
              )}
            </button>

            {/* Résultat de la vérification */}
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${
                  verificationResult.isValid
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {verificationResult.isValid ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <span className={`font-semibold ${
                    verificationResult.isValid ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {verificationResult.isValid ? 'Server Seed vérifié !' : 'Vérification échouée'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hash du Server Seed :</span>
                    <span className={verificationResult.hashMatches ? 'text-emerald-400' : 'text-red-400'}>
                      {verificationResult.hashMatches ? 'Correspond ✓' : 'Ne correspond pas ✗'}
                    </span>
                  </div>
                  {verificationResult.hashMatches && (
                    <div className="mt-3 p-3 bg-emerald-500/5 rounded-lg text-xs text-emerald-300/80">
                      ✓ Le server seed révélé correspond au hash affiché avant la battle.
                      Le serveur n'a pas pu modifier le seed après le début du jeu.
                    </div>
                  )}
                  {!verificationResult.hashMatches && (
                    <div className="mt-3 p-3 bg-red-500/5 rounded-lg text-xs text-red-300/80">
                      ✗ Le hash ne correspond pas. Vérifiez que vous avez copié les bonnes valeurs.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Formule */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <p className="text-sm font-medium text-gray-400 mb-2">Formule de vérification :</p>
              <code className="text-xs text-emerald-400 font-mono block mb-3">
                serverSeedHash = SHA256(serverSeed)
              </code>
              <p className="text-xs text-gray-500 mb-2">Pour les résultats individuels (battles) :</p>
              <code className="text-xs text-gray-400 font-mono">
                combinedSeed = serverSeed + clientSeed + battleId + boxOrder + position<br />
                hash = SHA256(combinedSeed)<br />
                roll = (parseInt(hash[0:8], 16) / 0xFFFFFFFF) * 100
              </code>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ProvablyFairVerifier
