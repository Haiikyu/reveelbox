// app/api/affiliate/track-click/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { affiliate_code, ip_address, user_agent, referrer_url } = await request.json()

    if (!affiliate_code) {
      return NextResponse.json(
        { error: 'Code d\'affiliation requis' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Vérifier que le code existe et est actif
    const { data: affiliateProfile, error: profileError } = await supabase
      .from('affiliate_profiles')
      .select('user_id, affiliate_code')
      .eq('affiliate_code', affiliate_code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (profileError || !affiliateProfile) {
      return NextResponse.json(
        { error: 'Code d\'affiliation invalide' },
        { status: 404 }
      )
    }

    // Enregistrer le clic
    const clientIp = ip_address || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    const { data: click, error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_code: affiliate_code.toUpperCase(),
        ip_address: clientIp,
        user_agent: user_agent || request.headers.get('user-agent') || '',
        referrer_url: referrer_url,
        clicked_at: new Date().toISOString(),
        converted: false
      })
      .select()
      .single()

    if (clickError) {
      console.error('Erreur enregistrement clic:', clickError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du clic' },
        { status: 500 }
      )
    }

    // Mettre à jour le compteur de clics
    await supabase.rpc('increment', {
      table_name: 'affiliate_profiles',
      column_name: 'clicks_count',
      filter_column: 'affiliate_code',
      filter_value: affiliate_code.toUpperCase()
    })

    return NextResponse.json({ 
      success: true, 
      click_id: click.id,
      redirect_url: '/signup?ref=' + affiliate_code.toUpperCase()
    })

  } catch (error) {
    console.error('Erreur API track-click:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}