// app/api/affiliate/validate-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Code requis' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch affiliate profile
    const { data: profile, error } = await supabase
      .from('affiliate_profiles')
      .select('user_id, affiliate_code, tier_name, commission_rate, is_active')
      .eq('affiliate_code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (error || !profile) {
      return NextResponse.json(
        { valid: false, error: 'Code invalide ou inactif' },
        { status: 404 }
      )
    }

    // Fetch profile separately
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', profile.user_id)
      .maybeSingle()

    const bonusMap: Record<string, number> = {
      'Rookie': 5, 'Explorer': 10, 'Adventurer': 15, 'Hunter': 20, 'Elite': 25,
      'Master': 30, 'Champion': 40, 'Legend': 50, 'Mythic': 75, 'Divine': 100
    }

    return NextResponse.json({
      valid: true,
      referrer_username: userProfile?.username || 'Unknown',
      referrer_tier: profile.tier_name,
      bonus_amount: bonusMap[profile.tier_name] || 5,
      commission_rate: profile.commission_rate
    })

  } catch (error) {
    console.error('Erreur API validate-code:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}