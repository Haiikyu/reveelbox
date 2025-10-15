'use client'

import { motion } from 'framer-motion'
import {
  Target,
  Trophy,
  Zap,
  CreditCard,
  Loader,
  Share2,
  Copy,
  ArrowRight,
  Users,
  Award,
  Medal,
  Crown,
  Star,
  Flame,
  Gem
} from 'lucide-react'
import React from 'react'
import type { AffiliateProfile, AffiliateTier } from './types'

interface AffiliateOverviewProps {
  affiliateProfile: AffiliateProfile
  currentTier: AffiliateTier
  nextTier?: AffiliateTier
  onClaimEarnings: (amount: number) => Promise<void>
  onCopyLink: () => Promise<void>
  onShareSocial: (platform: string) => void
  claimLoading: boolean
  copyLoading: boolean
}

export default function AffiliateOverview({
  affiliateProfile,
  currentTier,
  nextTier,
  onClaimEarnings,
  onCopyLink,
  onShareSocial,
  claimLoading,
  copyLoading
}: AffiliateOverviewProps) {
  const affiliateTiers: AffiliateTier[] = [
    { level: 1, name: "Rookie", commission: 0.01, color: "from-indigo-400 to-indigo-600", icon: Users, requirement: 0, bonus: 5 },
    { level: 2, name: "Explorer", commission: 0.02, color: "from-indigo-400 to-indigo-600", icon: Target, requirement: 5, bonus: 10 },
    { level: 3, name: "Adventurer", commission: 0.03, color: "from-indigo-500 to-purple-500", icon: Zap, requirement: 15, bonus: 15 },
    { level: 4, name: "Hunter", commission: 0.04, color: "from-indigo-500 to-purple-500", icon: Award, requirement: 30, bonus: 20 },
    { level: 5, name: "Elite", commission: 0.05, color: "from-purple-500 to-pink-500", icon: Medal, requirement: 50, bonus: 25 },
    { level: 6, name: "Master", commission: 0.06, color: "from-purple-500 to-pink-500", icon: Crown, requirement: 75, bonus: 30 },
    { level: 7, name: "Champion", commission: 0.07, color: "from-pink-500 to-rose-500", icon: Trophy, requirement: 100, bonus: 40 },
    { level: 8, name: "Legend", commission: 0.08, color: "from-pink-500 to-rose-500", icon: Star, requirement: 150, bonus: 50 },
    { level: 9, name: "Mythic", commission: 0.09, color: "from-rose-500 to-red-500", icon: Flame, requirement: 200, bonus: 75 },
    { level: 10, name: "Divine", commission: 0.10, color: "from-red-500 to-orange-500", icon: Gem, requirement: 300, bonus: 100 }
  ]

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reveelbox.vercel.app'
  const affiliateLink = `${baseUrl}/r/${affiliateProfile.affiliate_code}`

  return (
    <div className="space-y-6">
      {/* Claim Earnings Banner */}
      {affiliateProfile.pending_earnings >= 50 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Gains disponibles</p>
              <p className="text-3xl font-bold">{affiliateProfile.pending_earnings.toFixed(2)}€</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onClaimEarnings(affiliateProfile.pending_earnings)}
              disabled={claimLoading}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {claimLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              Récupérer
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Affiliate Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lien d'affiliation</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={affiliateLink}
            readOnly
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-mono"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCopyLink}
            disabled={copyLoading}
            className="bg-indigo-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {copyLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </motion.button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { name: 'Twitter', platform: 'twitter', icon: '𝕏' },
            { name: 'Facebook', platform: 'facebook', icon: '👥' },
            { name: 'WhatsApp', platform: 'whatsapp', icon: '💬' },
            { name: 'Telegram', platform: 'telegram', icon: '✈️' },
            { name: 'LinkedIn', platform: 'linkedin', icon: '💼' },
            { name: 'Reddit', platform: 'reddit', icon: '🤖' }
          ].map((social) => (
            <motion.button
              key={social.platform}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onShareSocial(social.platform)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-3 rounded-lg transition-all text-center"
            >
              <span className="text-xl">{social.icon}</span>
              <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">{social.name}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                {React.createElement(currentTier.icon, { className: "h-5 w-5 text-white" })}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{currentTier.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{(currentTier.commission * 100)}%</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-right">{nextTier.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-right">{(nextTier.commission * 100)}%</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                {React.createElement(nextTier.icon, { className: "h-5 w-5 text-white" })}
              </div>
            </div>
          </div>

          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((affiliateProfile.referrals_count / nextTier.requirement) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full"
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {affiliateProfile.referrals_count} / {nextTier.requirement} parrainages
          </p>
        </motion.div>
      )}

      {/* All Tiers Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg"
      >
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Niveaux</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {affiliateTiers.map((tier, index) => {
            const isCurrentTier = tier.level === affiliateProfile.tier_level
            const isUnlocked = tier.level <= affiliateProfile.tier_level

            return (
              <motion.div
                key={tier.level}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`relative rounded-xl p-4 transition-all ${
                  isCurrentTier
                    ? `bg-gradient-to-br ${tier.color} text-white shadow-lg`
                    : isUnlocked
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'bg-gray-50 dark:bg-gray-800 opacity-50'
                }`}
              >
                {isCurrentTier && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full px-2 py-0.5 text-xs font-bold">
                    ●
                  </div>
                )}

                <div className="text-center">
                  <div className={`mx-auto mb-2 h-10 w-10 rounded-lg flex items-center justify-center ${
                    isCurrentTier ? 'bg-white/20' : isUnlocked ? `bg-gradient-to-br ${tier.color}` : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {React.createElement(tier.icon, {
                      className: `h-5 w-5 ${isCurrentTier ? 'text-white' : isUnlocked ? 'text-white' : 'text-gray-400'}`
                    })}
                  </div>

                  <h4 className={`text-sm font-semibold mb-1 ${
                    isCurrentTier ? 'text-white' : isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}>
                    {tier.name}
                  </h4>

                  <div className={`text-lg font-bold ${
                    isCurrentTier ? 'text-white' : isUnlocked ? `text-transparent bg-clip-text bg-gradient-to-r ${tier.color}` : 'text-gray-400'
                  }`}>
                    {(tier.commission * 100)}%
                  </div>

                  <div className={`text-xs ${
                    isCurrentTier ? 'text-white/80' : isUnlocked ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'
                  }`}>
                    {tier.requirement === 0 ? 'Départ' : `${tier.requirement} refs`}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
