'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import type { ReferralData } from './types'

interface AffiliateReferralsProps {
  referrals: ReferralData[]
}

export default function AffiliateReferrals({ referrals }: AffiliateReferralsProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'converted':
        return {
          icon: CheckCircle,
          label: 'Converti',
          color: 'text-green-600 dark:text-green-400'
        }
      case 'pending':
        return {
          icon: Clock,
          label: 'En attente',
          color: 'text-yellow-600 dark:text-yellow-400'
        }
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Annulé',
          color: 'text-red-600 dark:text-red-400'
        }
      default:
        return {
          icon: Clock,
          label: status,
          color: 'text-gray-600 dark:text-gray-400'
        }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const totalEarnings = referrals.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0)
  const convertedCount = referrals.filter(ref => ref.status === 'converted').length

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {referrals.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {convertedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Convertis</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
            {totalEarnings.toFixed(2)}€
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Commissions</div>
        </motion.div>
      </div>

      {/* Referrals List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique des parrainages</h3>
          </div>
        </div>

        {referrals.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun parrainage</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Partagez votre lien pour commencer à gagner des commissions
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {referrals.map((referral, index) => {
              const statusConfig = getStatusConfig(referral.status)
              return (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.03 }}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {referral.profiles?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {referral.profiles?.username || 'Utilisateur anonyme'}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(referral.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {referral.deposit_amount.toFixed(2)}€
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Dépôt</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          {referral.commission_earned?.toFixed(2) || '0.00'}€
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Commission</div>
                      </div>

                      <div className={`flex items-center gap-1 ${statusConfig.color}`}>
                        {React.createElement(statusConfig.icon, { className: "h-4 w-4" })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
