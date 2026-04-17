'use client'

import { motion } from 'framer-motion'
import { CreditCard, Loader, ArrowRight } from 'lucide-react'
import React from 'react'
import { useTheme } from '@/app/components/ThemeProvider'
import type { AffiliateProfile, AffiliateTier } from './types'

interface AffiliateOverviewProps {
  affiliateProfile: AffiliateProfile
  currentTier: AffiliateTier
  nextTier?: AffiliateTier
  onClaimEarnings: (amount: number) => Promise<void>
  claimLoading: boolean
}

export default function AffiliateOverview({
  affiliateProfile, currentTier, nextTier,
  onClaimEarnings, claimLoading,
}: AffiliateOverviewProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const sectionStyle = {
    background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '16px',
  }

  const labelColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'
  const textColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)'
  const subtextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  const earnings = [
    { label: 'Total gagné', value: `${affiliateProfile.total_earnings.toFixed(2)}\u20ac`, color: textColor },
    { label: 'En attente', value: `${affiliateProfile.pending_earnings.toFixed(2)}\u20ac`, color: '#f59e0b' },
    { label: 'Récupérés', value: `${affiliateProfile.claimed_earnings.toFixed(2)}\u20ac`, color: '#10b981' },
  ]

  return (
    <div className="space-y-4">
      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5"
        style={sectionStyle}
      >
        <h3 className="text-[11px] font-medium uppercase mb-4" style={{
          letterSpacing: '0.1em', color: labelColor
        }}>
          Revenus
        </h3>

        <div className="space-y-3 mb-5">
          {earnings.map((item) => (
            <div key={item.label} className="flex justify-between items-center">
              <span className="text-sm" style={{ color: subtextColor }}>{item.label}</span>
              <span className="text-base font-bold" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Claim Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onClaimEarnings(affiliateProfile.pending_earnings)}
          disabled={claimLoading || affiliateProfile.pending_earnings < 50}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
        >
          {claimLoading ? <Loader className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {affiliateProfile.pending_earnings >= 50 ? 'Récupérer les gains' : 'Min. 50\u20ac requis'}
        </motion.button>
      </motion.div>

      {/* Tier Progress */}
      {nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5"
          style={sectionStyle}
        >
          <h3 className="text-[11px] font-medium uppercase mb-4" style={{
            letterSpacing: '0.1em', color: labelColor
          }}>
            Progression
          </h3>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${currentTier.hexColor}, ${currentTier.hexColor}bb)` }}>
                {React.createElement(currentTier.icon, { className: "h-3.5 w-3.5 text-white" })}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: textColor }}>{currentTier.name}</p>
                <p className="text-[10px]" style={{ color: subtextColor }}>{(currentTier.commission * 100)}%</p>
              </div>
            </div>
            <ArrowRight size={14} style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }} />
            <div className="flex items-center gap-2.5">
              <div>
                <p className="text-xs font-semibold text-right" style={{ color: textColor }}>{nextTier.name}</p>
                <p className="text-[10px] text-right" style={{ color: subtextColor }}>{(nextTier.commission * 100)}%</p>
              </div>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${nextTier.hexColor}, ${nextTier.hexColor}bb)` }}>
                {React.createElement(nextTier.icon, { className: "h-3.5 w-3.5 text-white" })}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-1.5 rounded-full mb-2" style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((affiliateProfile.referrals_count / nextTier.requirement) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-1.5 rounded-full"
              style={{ background: `linear-gradient(90deg, ${currentTier.hexColor}, ${nextTier.hexColor})` }}
            />
          </div>
          <p className="text-[10px] text-center" style={{ color: subtextColor }}>
            {affiliateProfile.referrals_count} / {nextTier.requirement} parrainages
          </p>
        </motion.div>
      )}
    </div>
  )
}
