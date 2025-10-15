'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, DollarSign, MousePointerClick, Target, Activity } from 'lucide-react'
import type { AffiliateProfile } from './types'

interface AffiliateAnalyticsProps {
  affiliateProfile: AffiliateProfile
}

export default function AffiliateAnalytics({ affiliateProfile }: AffiliateAnalyticsProps) {
  const conversionRate = affiliateProfile.clicks_count > 0
    ? ((affiliateProfile.conversions_count / affiliateProfile.clicks_count) * 100).toFixed(1)
    : '0.0'

  const avgCommissionPerReferral = affiliateProfile.referrals_count > 0
    ? (affiliateProfile.total_earnings / affiliateProfile.referrals_count).toFixed(2)
    : '0.00'

  const metrics = [
    {
      title: 'Taux de conversion',
      value: `${conversionRate}%`,
      description: 'Visiteurs convertis',
      icon: Target
    },
    {
      title: 'Commission moyenne',
      value: `${avgCommissionPerReferral}€`,
      description: 'Par filleul',
      icon: DollarSign
    },
    {
      title: 'Total clics',
      value: affiliateProfile.clicks_count.toString(),
      description: 'Sur votre lien',
      icon: MousePointerClick
    },
    {
      title: 'Conversions',
      value: affiliateProfile.conversions_count.toString(),
      description: 'Parrainages actifs',
      icon: TrendingUp
    }
  ]

  const performance = [
    {
      label: 'Conversions',
      value: affiliateProfile.conversions_count,
      max: Math.max(affiliateProfile.clicks_count, 10),
      percentage: affiliateProfile.clicks_count > 0 ? (affiliateProfile.conversions_count / affiliateProfile.clicks_count) * 100 : 0
    },
    {
      label: 'Parrainages actifs',
      value: affiliateProfile.referrals_count,
      max: Math.max(affiliateProfile.conversions_count, 10),
      percentage: affiliateProfile.conversions_count > 0 ? (affiliateProfile.referrals_count / affiliateProfile.conversions_count) * 100 : 0
    },
    {
      label: 'Gains totaux',
      value: `${affiliateProfile.total_earnings.toFixed(2)}€`,
      max: 1000,
      percentage: Math.min((affiliateProfile.total_earnings / 1000) * 100, 100)
    }
  ]

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg"
          >
            {React.createElement(metric.icon, { className: "h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-2" })}
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metric.value}
            </div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{metric.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">{metric.description}</div>
          </motion.div>
        ))}
      </div>

      {/* Performance Bars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
        </div>

        <div className="space-y-6">
          {performance.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {typeof item.value === 'number' ? item.value : item.value} sur {item.max}
                  </div>
                </div>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {item.percentage.toFixed(0)}%
                </div>
              </div>
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Résumé financier</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gains totaux</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {affiliateProfile.total_earnings.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">En attente</span>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {affiliateProfile.pending_earnings.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Récupérés</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {affiliateProfile.claimed_earnings.toFixed(2)}€
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Performances clés</h4>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taux de conversion</span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{conversionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commission actuelle</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {(affiliateProfile.commission_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Niveau actuel</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{affiliateProfile.tier_name}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
