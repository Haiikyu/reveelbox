import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Récupérer la saison active
    const { data: season, error: seasonError } = await supabase
      .from('battle_pass_seasons')
      .select('*')
      .eq('is_active', true)
      .single()

    if (seasonError || !season) {
      return NextResponse.json({ error: 'No active season' }, { status: 404 })
    }

    // Vérifier si l'utilisateur a déjà le pass
    const { data: existingPass } = await supabase
      .from('user_battle_passes')
      .select('id')
      .eq('user_id', userId)
      .eq('season_id', season.id)
      .eq('is_active', true)
      .single()

    if (existingPass) {
      return NextResponse.json({ error: 'Already owns this Battle Pass' }, { status: 400 })
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Battle Pass - ${season.name}`,
              description: '30 récompenses exclusives sur 30 jours',
              images: [season.image_url || 'https://via.placeholder.com/300'],
            },
            unit_amount: Math.round(season.price_euro * 100), // 21.99€ → 2199 centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/battlepass?success=true`,
      cancel_url: `${request.headers.get('origin')}/shop?canceled=true`,
      metadata: {
        userId,
        seasonId: season.id,
        type: 'battle_pass',
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating Battle Pass checkout:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}