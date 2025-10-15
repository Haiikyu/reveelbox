// Types partagés pour le système d'affiliation
export interface AffiliateProfile {
  id: string
  user_id: string
  affiliate_code: string
  custom_share_message?: string
  total_earnings: number
  pending_earnings: number
  claimed_earnings: number
  referrals_count: number
  clicks_count: number
  conversions_count: number
  tier_level: number
  tier_name: string
  commission_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReferralData {
  id: string
  referrer_user_id: string
  referred_user_id: string
  affiliate_code: string
  commission_earned: number
  deposit_amount: number
  conversion_date: string | null
  status: 'pending' | 'converted' | 'cancelled'
  created_at: string
  profiles?: {
    username?: string
    avatar_url?: string
  }
}

export interface AffiliateTier {
  level: number
  name: string
  commission: number
  color: string
  icon: any
  requirement: number
  bonus: number
}

export interface AffiliateStats {
  conversionRate: string
  avgCommissionPerReferral: string
  totalClicks: number
  totalConversions: number
}
