// app/api/affiliate/convert/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { user_id, deposit_amount } = await request.json()

    if (!user_id || !deposit_amount) {
      return NextResponse.json(
        { error: 'Paramètres requis manquants' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Vérifier s'il existe un parrainage en attente pour cet utilisateur
    const { data: referral, error: referralError } = await supabase
      .from('affiliate_referrals')
      .select(`
        *,
        affiliate_profiles!inner(user_id, commission_rate, tier_name)
      `)
      .eq('referred_user_id', user_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (referralError || !referral) {
      return NextResponse.json(
        { error: 'Aucun parrainage en attente trouvé' },
        { status: 404 }
      )
    }

    // Calculer la commission
    const commissionEarned = Math.round(deposit_amount * referral.affiliate_profiles.commission_rate * 100) / 100

    // Mettre à jour le parrainage
    const { error: updateError } = await supabase
      .from('affiliate_referrals')
      .update({
        commission_earned: commissionEarned,
        deposit_amount: deposit_amount,
        conversion_date: new Date().toISOString(),
        status: 'converted'
      })
      .eq('id', referral.id)

    if (updateError) {
      console.error('Erreur mise à jour parrainage:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la conversion' },
        { status: 500 }
      )
    }

    // Marquer le clic comme converti
    await supabase
      .from('affiliate_clicks')
      .update({
        converted: true,
        conversion_date: new Date().toISOString()
      })
      .eq('affiliate_code', referral.affiliate_code)
      .eq('converted', false)
      .order('clicked_at', { ascending: false })
      .limit(1)

    return NextResponse.json({
      success: true,
      commission_earned: commissionEarned,
      referrer_tier: referral.affiliate_profiles.tier_name
    })

  } catch (error) {
    console.error('Erreur API convert:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}