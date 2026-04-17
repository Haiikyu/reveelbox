// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/utils/supabase/server'
import { ratelimit, addRateLimitHeaders } from '@/lib/rate-limit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// ═══════════════════════════════════════════════════════════════
// SERVER-SIDE PRICE MATRIX - Single source of truth for pricing
// Prices are in CENTS to avoid floating-point issues
// ═══════════════════════════════════════════════════════════════
const COIN_PACKAGES: Record<string, { coins: number; bonus: number; priceInCents: number; name: string }> = {
  'starter':  { coins: 150,  bonus: 0,   priceInCents: 499,   name: 'STARTER PACK' },   // 4.99 EUR
  'popular':  { coins: 500,  bonus: 50,  priceInCents: 1499,  name: 'POWER PACK' },     // 14.99 EUR
  'premium':  { coins: 1200, bonus: 200, priceInCents: 3499,  name: 'PREMIUM PACK' },   // 34.99 EUR
  'ultimate': { coins: 3000, bonus: 500, priceInCents: 7999,  name: 'ULTIMATE PACK' },  // 79.99 EUR
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, package_id } = body

    // --- AUTH CHECK ---
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== user_id) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    // --- RATE LIMITING: max 3 checkout sessions per minute per user ---
    const rateLimitResult = await ratelimit.limit(`checkout:${user.id}`, {
      limit: 3,
      windowMs: 60000,
    })

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Trop de tentatives. Veuillez patienter avant de reessayer.' },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult)
      return response
    }

    // --- SERVER-SIDE PRICE VALIDATION ---
    if (!package_id || typeof package_id !== 'string') {
      return NextResponse.json(
        { error: 'Package ID manquant ou invalide' },
        { status: 400 }
      )
    }

    const serverPackage = COIN_PACKAGES[package_id]
    if (!serverPackage) {
      console.error('Invalid package_id received:', package_id)
      return NextResponse.json(
        { error: 'Package invalide' },
        { status: 400 }
      )
    }

    // Use server-defined values - ignore any client-sent price/coins
    const totalCoins = serverPackage.coins + serverPackage.bonus

    console.log('Creating checkout session:', {
      user_id: user.id,
      package_id,
      coins: totalCoins,
      priceInCents: serverPackage.priceInCents,
      package_name: serverPackage.name,
    })

    // --- CREATE STRIPE CHECKOUT SESSION ---
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: serverPackage.name,
              description: `${totalCoins} coins ReveelBox`,
              images: ['https://i.imgur.com/8YwZmtP.png'],
            },
            unit_amount: serverPackage.priceInCents, // Already in cents, no float conversion
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-coins/success?session_id={CHECKOUT_SESSION_ID}&package_name=${encodeURIComponent(serverPackage.name)}&coins=${totalCoins}&amount=${(serverPackage.priceInCents / 100).toFixed(2)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-coins?canceled=true`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        package_id,
        coins: totalCoins.toString(),
        package_name: serverPackage.name,
      },
    })

    console.log('Stripe session created:', session.id)

    const response = NextResponse.json({
      url: session.url,
      session_id: session.id
    })
    addRateLimitHeaders(response.headers, rateLimitResult)
    return response

  } catch (error) {
    console.error('Error creating checkout session:', error)

    return NextResponse.json(
      {
        error: 'Erreur serveur lors de la creation du paiement',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
