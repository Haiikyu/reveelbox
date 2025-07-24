// app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Client Supabase avec service key pour bypass RLS (correct pour les webhooks)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('❌ Pas de signature Stripe')
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Vérifier la signature du webhook
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('❌ Erreur signature webhook:', error)
    return NextResponse.json(
      { error: 'Signature invalide' },
      { status: 400 }
    )
  }

  console.log('🔔 Webhook reçu:', event.type, event.id)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        console.log('💳 Paiement confirmé:', event.data.object.id)
        break
      
      default:
        console.log('ℹ️ Événement non géré:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Erreur traitement webhook:', error)
    return NextResponse.json(
      { error: 'Erreur traitement' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout complété:', session.id)
  
  const { user_id, coins, package_id, package_name } = session.metadata!
  const amount_paid = session.amount_total! / 100 // Convertir centimes en euros

  console.log('📊 Données paiement:', {
    user_id,
    coins: parseInt(coins),
    package_id,
    package_name,
    amount_paid,
    email: session.customer_email
  })

  try {
    // 1. Ajouter les coins à l'utilisateur avec gestion des requêtes selon le standard
    let profile = null
    let profileError = null

    try {
      // Essayer d'abord la requête normale
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('virtual_currency, loyalty_points, total_exp')
        .eq('id', user_id)
        .single()

      profile = data
      profileError = error
    } catch (fetchError) {
      console.warn('Erreur récupération profil, retry:', fetchError)
      profileError = fetchError
    }

    if (profileError || !profile) {
      console.error('❌ Erreur récupération profil:', profileError)
      throw new Error('Profil introuvable')
    }

    const newCoins = (profile.virtual_currency || 0) + parseInt(coins)
    const newLoyaltyPoints = (profile.loyalty_points || 0) + Math.floor(amount_paid * 10) // 10 points par euro
    const newExp = (profile.total_exp || 0) + (parseInt(coins) / 10) // 1 XP par 10 coins

    // Mise à jour du profil avec gestion d'erreurs robuste
    let updateError = null
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          virtual_currency: newCoins,
          loyalty_points: newLoyaltyPoints,
          total_exp: newExp
        })
        .eq('id', user_id)

      updateError = error
    } catch (err) {
      updateError = err
    }

    if (updateError) {
      console.error('❌ Erreur mise à jour profil:', updateError)
      throw new Error('Échec mise à jour profil')
    }

    console.log('✅ Profil mis à jour:', {
      newCoins,
      newLoyaltyPoints,
      newExp
    })

    // 2. Enregistrer la transaction avec gestion d'erreurs
    try {
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id,
          type: 'purchase_coins',
          amount: amount_paid,
          virtual_amount: parseInt(coins),
          stripe_payment_id: session.payment_intent as string,
          metadata: {
            package_id,
            package_name,
            session_id: session.id
          }
        })

      if (transactionError) {
        console.error('❌ Erreur enregistrement transaction:', transactionError)
        // Ne pas faire échouer si le profil est déjà mis à jour
      } else {
        console.log('✅ Transaction enregistrée')
      }
    } catch (transactionErr) {
      console.error('❌ Erreur critique transaction:', transactionErr)
      // Continue, car le profil a été mis à jour
    }

    // 3. TODO: Envoyer email de confirmation (optionnel)
    // await sendPurchaseConfirmationEmail(session.customer_email, package_name, coins)

    console.log('🎊 Achat de coins terminé avec succès!')

  } catch (error) {
    console.error('💥 Erreur critique lors du traitement:', error)
    
    // TODO: Système de retry ou notification admin
    // En production, ajouter un système de retry ou alerter l'équipe
    throw error
  }
}