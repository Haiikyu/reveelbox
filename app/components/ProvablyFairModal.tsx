// ProvablyFairModal.tsx - Modal Provably Fair épuré
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Copy, Check, ExternalLink } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import { hashServerSeed, calculateProvablyFairPercentage } from '@/lib/provablyFair'

interface ProvablyFairModalProps {
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

export function ProvablyFairModal({ isOpen, onClose, data }: ProvablyFairModalProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [verified, setVerified] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (data && isOpen) {
      // Vérifier automatiquement
      const calculatedHash = hashServerSeed(data.serverSeed)
      const hashMatches = calculatedHash.toLowerCase() === data.serverSeedHash.toLowerCase()
      const calculatedRoll = calculateProvablyFairPercentage(data.serverSeed, data.clientSeed, data.nonce)
      const rollMatches = Math.abs(calculatedRoll - data.roll) < 0.01

      setIsValid(hashMatches && rollMatches)
      setVerified(true)
    }
  }, [data, isOpen])

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? 'rgba(255,240,220,0.1) transparent' : 'rgba(0,0,0,0.1) transparent'
          }}
        >
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(17,26,46,0.98) 0%, rgba(12,18,32,0.99) 100%)'
                : 'linear-gradient(135deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.99) 100%)',
              border: `1px solid ${isDark ? 'rgba(255,240,220,0.08)' : 'rgba(0,0,0,0.06)'}`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: isDark ? 'linear-gradient(135deg, #C9A87C, #A08060)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    boxShadow: isDark ? '0 4px 16px rgba(201,168,124,0.2)' : '0 4px 16px rgba(59,130,246,0.2)'
                  }}
                >
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: isDark ? '#F5F0E8' : 'rgba(0,0,0,0.9)' }}
                  >
                    Provably Fair
                  </h2>
                  <p
                    className="text-xs"
                    style={{ color: isDark ? '#969087' : 'rgba(0,0,0,0.4)' }}
                  >
                    Système de vérification transparent
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isDark ? 'rgba(255,240,220,0.05)' : 'rgba(0,0,0,0.04)',
                  color: isDark ? '#969087' : 'rgba(0,0,0,0.4)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Explication */}
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                background: isDark ? 'rgba(201,168,124,0.08)' : 'rgba(59,130,246,0.06)',
                border: `1px solid ${isDark ? 'rgba(201,168,124,0.15)' : 'rgba(59,130,246,0.1)'}`
              }}
            >
              <p
                className="text-xs leading-relaxed"
                style={{ color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.7)' }}
              >
                Le système Provably Fair utilise une combinaison de seeds (serveur + client) pour générer
                des résultats vérifiables. Le hash du server seed est montré <strong>avant</strong> le jeu,
                puis le vrai seed est révélé <strong>après</strong> pour vérification.
              </p>
            </div>

            {data ? (
              <>
                {/* Statut vérification */}
                {verified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl flex items-center gap-3"
                    style={{
                      background: isValid
                        ? isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)'
                        : isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${isValid
                        ? isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'
                        : isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)'}`
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: isValid ? '#10b981' : '#ef4444'
                      }}
                    >
                      {isValid ? '✓' : '✗'}
                    </div>
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: isValid ? '#10b981' : '#ef4444' }}
                      >
                        {isValid ? 'Vérification réussie' : 'Vérification échouée'}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.5)' }}
                      >
                        {isValid ? 'Le résultat est authentique' : 'Les seeds ne correspondent pas'}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Seeds */}
                <div className="space-y-3">
                  <DataField
                    label="Server Seed Hash"
                    value={data.serverSeedHash}
                    onCopy={() => copyToClipboard(data.serverSeedHash, 'hash')}
                    isCopied={copiedField === 'hash'}
                    isDark={isDark}
                    description="Hash montré avant le jeu"
                  />
                  <DataField
                    label="Server Seed"
                    value={data.serverSeed}
                    onCopy={() => copyToClipboard(data.serverSeed, 'server')}
                    isCopied={copiedField === 'server'}
                    isDark={isDark}
                    description="Seed révélé après le jeu"
                  />
                  <DataField
                    label="Client Seed"
                    value={data.clientSeed}
                    onCopy={() => copyToClipboard(data.clientSeed, 'client')}
                    isCopied={copiedField === 'client'}
                    isDark={isDark}
                    description="Seed généré côté client"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        background: isDark ? 'rgba(255,240,220,0.03)' : 'rgba(0,0,0,0.02)'
                      }}
                    >
                      <div
                        className="text-[10px] uppercase font-medium mb-1"
                        style={{
                          color: isDark ? '#969087' : 'rgba(0,0,0,0.4)',
                          letterSpacing: '0.1em'
                        }}
                      >
                        Nonce
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: isDark ? '#F5F0E8' : 'rgba(0,0,0,0.8)' }}
                      >
                        {data.nonce}
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-xl"
                      style={{
                        background: isDark ? 'rgba(255,240,220,0.03)' : 'rgba(0,0,0,0.02)'
                      }}
                    >
                      <div
                        className="text-[10px] uppercase font-medium mb-1"
                        style={{
                          color: isDark ? '#969087' : 'rgba(0,0,0,0.4)',
                          letterSpacing: '0.1em'
                        }}
                      >
                        Roll
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: isDark ? '#F5F0E8' : 'rgba(0,0,0,0.8)' }}
                      >
                        {data.roll.toFixed(4)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t" style={{
                  borderColor: isDark ? 'rgba(255,240,220,0.06)' : 'rgba(0,0,0,0.04)'
                }}>
                  <a
                    href="https://en.wikipedia.org/wiki/Provably_fair_algorithm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs transition-opacity hover:opacity-80"
                    style={{ color: isDark ? '#C9A87C' : '#3b82f6' }}
                  >
                    En savoir plus sur Provably Fair
                    <ExternalLink size={12} />
                  </a>
                </div>
              </>
            ) : (
              <div
                className="text-center py-12"
                style={{ color: isDark ? '#969087' : 'rgba(0,0,0,0.3)' }}
              >
                <p className="text-sm">Aucune donnée de vérification disponible</p>
                <p className="text-xs mt-1">Ouvrez une boîte pour générer des données vérifiables</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function DataField({
  label,
  value,
  onCopy,
  isCopied,
  isDark,
  description
}: {
  label: string
  value: string
  onCopy: () => void
  isCopied: boolean
  isDark: boolean
  description?: string
}) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: isDark ? 'rgba(255,240,220,0.03)' : 'rgba(0,0,0,0.02)'
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div
          className="text-[10px] uppercase font-medium"
          style={{
            color: isDark ? '#969087' : 'rgba(0,0,0,0.4)',
            letterSpacing: '0.1em'
          }}
        >
          {label}
        </div>
        <button
          onClick={onCopy}
          className="p-1 rounded transition-all"
          style={{
            background: isCopied
              ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
              : 'transparent'
          }}
        >
          {isCopied ? (
            <Check size={14} style={{ color: '#10b981' }} />
          ) : (
            <Copy size={14} style={{ color: isDark ? '#6D675F' : 'rgba(0,0,0,0.3)' }} />
          )}
        </button>
      </div>
      <div
        className="text-xs font-mono break-all"
        style={{
          color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.7)'
        }}
      >
        {value}
      </div>
      {description && (
        <div
          className="text-[10px] mt-1"
          style={{
            color: isDark ? '#6D675F' : 'rgba(0,0,0,0.25)'
          }}
        >
          {description}
        </div>
      )}
    </div>
  )
}

export default ProvablyFairModal
