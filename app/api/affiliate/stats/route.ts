// app/api/affiliate/stats/route.ts - Statistiques avancées
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const period = searchParams.get('period') || '30' // jours

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Statistiques générales
    const { data: profile } = await supabase
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil d\'affiliation introuvable' },
        { status: 404 }
      )
    }

    // Parrainages récents
    const { data: recentReferrals } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .gte('created_at', startDate.toISOString())

    // Clics récents
    const { data: recentClicks } = await supabase
      .from('affiliate_clicks')
      .select('*')
      .eq('affiliate_code', profile.affiliate_code)
      .gte('clicked_at', startDate.toISOString())

    // Calculer les statistiques par jour
    const dailyStats = []
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayReferrals = recentReferrals?.filter(r => 
        r.created_at.split('T')[0] === dateStr
      ) || []

      const dayClicks = recentClicks?.filter(c => 
        c.clicked_at.split('T')[0] === dateStr
      ) || []

      dailyStats.push({
        date: dateStr,
        clicks: dayClicks.length,
        referrals: dayReferrals.length,
        conversions: dayReferrals.filter(r => r.status === 'converted').length,
        earnings: dayReferrals.reduce((sum, r) => sum + (r.commission_earned || 0), 0)
      })
    }

    // Top pays des clics (simulation)
    const topCountries = [
      { country: 'France', clicks: Math.floor(Math.random() * 100) + 20, flag: '🇫🇷' },
      { country: 'Belgique', clicks: Math.floor(Math.random() * 50) + 10, flag: '🇧🇪' },
      { country: 'Suisse', clicks: Math.floor(Math.random() * 30) + 5, flag: '🇨🇭' },
      { country: 'Canada', clicks: Math.floor(Math.random() * 25) + 3, flag: '🇨🇦' }
    ].sort((a, b) => b.clicks - a.clicks)

    return NextResponse.json({
      profile,
      period_stats: {
        total_clicks: recentClicks?.length || 0,
        total_referrals: recentReferrals?.length || 0,
        total_conversions: recentReferrals?.filter(r => r.status === 'converted').length || 0,
        total_earnings: recentReferrals?.reduce((sum, r) => sum + (r.commission_earned || 0), 0) || 0
      },
      daily_stats: dailyStats,
      top_countries: topCountries,
      conversion_rate: recentClicks?.length ? 
        ((recentReferrals?.filter(r => r.status === 'converted').length || 0) / recentClicks.length * 100) : 0
    })

  } catch (error) {
    console.error('Erreur API stats:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}