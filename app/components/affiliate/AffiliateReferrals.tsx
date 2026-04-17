'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import type { ReferralData } from './types'

interface AffiliateReferralsProps {
  referrals: ReferralData[]
}

export default function AffiliateReferrals({ referrals }: AffiliateReferralsProps) {
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

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'converted': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'converted': return 'Converti'
      case 'pending': return 'En attente'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'short'
    }).format(new Date(dateString))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden h-full flex flex-col"
      style={sectionStyle}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
      }}>
        <h3 className="text-[11px] font-medium uppercase" style={{ letterSpacing: '0.1em', color: labelColor }}>
          Parrainages
        </h3>
        <span className="text-xs font-medium" style={{ color: subtextColor }}>
          {referrals.length} total
        </span>
      </div>

      {referrals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Users className="h-10 w-10 mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <h4 className="text-sm font-semibold mb-2" style={{ color: textColor }}>Aucun parrainage</h4>
          <p className="text-xs" style={{ color: subtextColor }}>
            Partagez votre lien pour commencer
          </p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_90px_90px_80px_32px] gap-3 px-5 py-2.5 flex-shrink-0" style={{
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
          }}>
            {['Utilisateur', 'D\u00e9p\u00f4t', 'Commission', 'Date', ''].map((h) => (
              <span key={h} className="text-[10px] font-medium uppercase" style={{ letterSpacing: '0.08em', color: labelColor }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows - scrollable */}
          <div className="flex-1 overflow-y-auto">
            {referrals.map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="px-5 py-3 transition-colors hover:bg-white/[0.02]"
                style={{
                  borderBottom: index < referrals.length - 1
                    ? isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.03)'
                    : 'none'
                }}
              >
                {/* Desktop: grid row */}
                <div className="hidden sm:grid grid-cols-[1fr_90px_90px_80px_32px] gap-3 items-center">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                    >
                      <span className="text-white font-bold text-[10px]">
                        {referral.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <span className="text-sm font-medium truncate" style={{ color: textColor }}>
                      {referral.profiles?.username || 'Anonyme'}
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: textColor }}>
                    {referral.deposit_amount.toFixed(0)}&euro;
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                    {referral.commission_earned?.toFixed(2) || '0.00'}&euro;
                  </span>
                  <span className="text-xs" style={{ color: subtextColor }}>
                    {formatDate(referral.created_at)}
                  </span>
                  <div className="flex justify-center">
                    <div
                      className="h-2 w-2 rounded-full"
                      title={getStatusLabel(referral.status)}
                      style={{ backgroundColor: getStatusDot(referral.status), boxShadow: `0 0 6px ${getStatusDot(referral.status)}40` }}
                    />
                  </div>
                </div>

                {/* Mobile: stacked */}
                <div className="sm:hidden flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                    >
                      <span className="text-white font-bold text-[10px]">
                        {referral.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block" style={{ color: textColor }}>
                        {referral.profiles?.username || 'Anonyme'}
                      </span>
                      <span className="text-[10px] flex items-center gap-1" style={{ color: subtextColor }}>
                        <Calendar className="h-2.5 w-2.5" />
                        {formatDate(referral.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: '#10b981' }}>
                        {referral.commission_earned?.toFixed(2) || '0.00'}&euro;
                      </div>
                      <div className="text-[10px]" style={{ color: subtextColor }}>
                        {referral.deposit_amount.toFixed(0)}&euro; d\u00e9p\u00f4t
                      </div>
                    </div>
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getStatusDot(referral.status), boxShadow: `0 0 6px ${getStatusDot(referral.status)}40` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
