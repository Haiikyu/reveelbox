// app/api/stripe-webhook/route.js
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Erreur webhook:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Gérer l'événement
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object

      // Récupérer les métadonnées
      const { userId, coins } = session.metadata
      const coinsAmount = parseInt(coins)

      try {
        // Ajouter les coins au compte de l'utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('virtual_currency')
          .eq('id', userId)
          .single()

        if (profileError) {
          console.error('Erreur profil:', profileError)
          break
        }

        const newBalance = (profile.virtual_currency || 0) + coinsAmount

        // Mettre à jour le solde
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ virtual_currency: newBalance })
          .eq('id', userId)

        if (updateError) {
          console.error('Erreur mise à jour:', updateError)
          break
        }

        // Créer une transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'purchase_currency',
            amount: session.amount_total / 100, // Convertir de centimes en dollars
            virtual_amount: coinsAmount,
            stripe_payment_id: session.payment_intent
          })

        if (transactionError) {
          console.error('Erreur transaction:', transactionError)
        }

        console.log(`✅ Ajout de ${coinsAmount} coins pour l'utilisateur ${userId}`)
      } catch (error) {
        console.error('Erreur traitement paiement:', error)
      }
      break

    default:
      console.log(`Type d'événement non géré: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}