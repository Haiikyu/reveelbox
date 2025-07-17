// app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Clé service pour les opérations admin
)

export async function POST(request) {
  try {
    const { userId, packageId, coins, price } = await request.json()

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coins} Coins`,
              description: 'Monnaie virtuelle pour LootBox Paradise',
              images: ['https://your-domain.com/coin-image.png'], // Remplacez par votre image
            },
            unit_amount: Math.round(price * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-coins/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-coins`,
      metadata: {
        userId,
        packageId,
        coins: coins.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Erreur création session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}