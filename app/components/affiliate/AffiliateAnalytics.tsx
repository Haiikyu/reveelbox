'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, MousePointerClick, Activity } from 'lucide-react'
import { useTheme } from '@/app/components/ThemeProvider'
import type { AffiliateProfile } from './types'

interface AffiliateAnalyticsProps {
  affiliateProfile: AffiliateProfile
}

export default function AffiliateAnalytics({ affiliateProfile }: AffiliateAnalyticsProps) {
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

  const conversionRate = affiliateProfile.clicks_count > 0
    ? ((affiliateProfile.conversions_count / affiliateProfile.clicks_count) * 100).toFixed(1)
    : '0.0'

  const avgCommission = affiliateProfile.referrals_count > 0
    ? (affiliateProfile.total_earnings / affiliateProfile.referrals_count).toFixed(2)
    : '0.00'

  const metrics = [
    { label: 'Taux conv.', value: `${conversionRate}%`, icon: Target, color: '#8b5cf6' },
    { label: 'Comm. moy.', value: `${avgCommission}\u20ac`, icon: TrendingUp, color: '#10b981' },
    { label: 'Clics', value: affiliateProfile.clicks_count.toString(), icon: MousePointerClick, color: '#3b82f6' },
    { label: 'Conversions', value: affiliateProfile.conversions_count.toString(), icon: Activity, color: '#f59e0b' },
  ]

  const convPercentage = affiliateProfile.clicks_count > 0
    ? (affiliateProfile.conversions_count / affiliateProfile.clicks_count) * 100
    : 0

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
        Statistiques
      </h3>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {metrics.map((metric, i) => (
          <div key={i} className="p-3 rounded-xl" style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
          }}>
            <div className="flex items-center gap-1.5 mb-2">
              {React.createElement(metric.icon, { size: 12, style: { color: metric.color } })}
              <span className="text-[9px] font-medium uppercase" style={{
                letterSpacing: '0.08em', color: labelColor
              }}>
                {metric.label}
              </span>
            </div>
            <div className="text-lg font-bold" style={{ color: textColor }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Single performance bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: subtextColor }}>Taux de conversion</span>
          <span className="text-xs font-bold" style={{ color: '#8b5cf6' }}>
            {convPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="relative w-full h-1.5 rounded-full" style={{
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(convPercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-1.5 rounded-full"
            style={{ background: '#8b5cf6' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
