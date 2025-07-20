// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const { user_id, package_id, coins, price, package_name } = await request.json()

    console.log('🛒 Création session checkout:', {
      user_id,
      package_id,
      coins,
      price,
      package_name
    })

    // Vérifier l'authentification
    const supabase = createServerComponentClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== user_id) {
      console.error('❌ Erreur auth:', authError)
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Valider les données
    if (!package_id || !coins || !price || !package_name) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: package_name,
              description: `${coins} coins ReveelBox`,
              images: ['https://i.imgur.com/8YwZmtP.png'], // Logo ReveelBox
            },
            unit_amount: Math.round(price * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-coins/success?session_id={CHECKOUT_SESSION_ID}&package_name=${encodeURIComponent(package_name)}&coins=${coins}&amount=${price}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/buy-coins?canceled=true`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        package_id,
        coins: coins.toString(),
        package_name,
      },
    })

    console.log('✅ Session Stripe créée:', session.id)

    return NextResponse.json({
      url: session.url,
      session_id: session.id
    })

  } catch (error) {
    console.error('❌ Erreur création session:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la création du paiement',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}