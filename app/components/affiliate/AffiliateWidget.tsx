// components/affiliate/AffiliateWidget.tsx - Widget compact pour le dashboard
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  ExternalLink,
  Copy,
  Loader 
} from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'
import { useAffiliate } from '@/app/hooks/useAffiliate'

interface QuickStats {
  referrals_today: number
  earnings_today: number
  clicks_today: number
  conversion_rate: number
}

export default function AffiliateWidget(): JSX.Element {
  const { user } = useAuth()
  const { profile, loading, generateAffiliateLink } = useAffiliate()
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [copyLoading, setCopyLoading] = useState<boolean>(false)

  // Charger les statistiques rapides
  const loadQuickStats = async (): Promise<void> => {
    if (!user) return

    try {
      const response = await fetch(`/api/affiliate/stats?user_id=${user.id}&period=1`)
      const data = await response.json()
      
      if (data.period_stats) {
        setQuickStats({
          referrals_today: data.period_stats.total_referrals,
          earnings_today: data.period_stats.total_earnings,
          clicks_today: data.period_stats.total_clicks,
          conversion_rate: data.conversion_rate
        })
      }
    } catch (error) {
      console.error('Erreur chargement stats rapides:', error)
    }
  }

  // Copier le lien d'affiliation
  const copyAffiliateLink = async (): Promise<void> => {
    if (!profile) return
    
    setCopyLoading(true)
    try {
      const link = generateAffiliateLink()
      
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(link)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = link
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Erreur copie lien:', error)
    } finally {
      setCopyLoading(false)
    }
  }

  useEffect(() => {
    if (user && profile) {
      loadQuickStats()
    }
  }, [user, profile])

  if (!user || !profile) return <></>

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-center h-32">
          <Loader className="h-6 w-6 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Affiliation</h3>
            <p className="text-green-100 text-sm">
              Niveau {profile.tier_name}
            </p>
          </div>
          <Link 
            href="/affiliate"
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {profile.referrals_count}
            </div>
            <div className="text-xs text-gray-600">Parrainages</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {profile.total_earnings.toFixed(2)}€
            </div>
            <div className="text-xs text-gray-600">Gains totaux</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {profile.clicks_count}
            </div>
            <div className="text-xs text-gray-600">Clics</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {(profile.commission_rate * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">Commission</div>
          </div>
        </div>

        {/* Statistiques du jour */}
        {quickStats && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Aujourd'hui</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-semibold text-green-600">
                  +{quickStats.referrals_today}
                </div>
                <div className="text-xs text-gray-500">Parrainages</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-green-600">
                  +{quickStats.earnings_today.toFixed(2)}€
                </div>
                <div className="text-xs text-gray-500">Gains</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-blue-600">
                  {quickStats.clicks_today}
                </div>
                <div className="text-xs text-gray-500">Clics</div>
              </div>
            </div>
          </div>
        )}

        {/* Lien rapide */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Votre code</span>
            <code className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              {profile.affiliate_code}
            </code>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={copyAffiliateLink}
              disabled={copyLoading}
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {copyLoading ? (
                <Loader className="h-3 w-3 animate-spin" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copier lien
            </button>
            <Link
              href="/affiliate"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <BarChart3 className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}