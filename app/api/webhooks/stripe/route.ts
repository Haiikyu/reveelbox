export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialisation securisee pour eviter le crash au build
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: NextRequest) {
  // Verification de l'initialisation des clients
  if (!stripe || !supabaseAdmin || !webhookSecret) {
    console.error('Missing environment variables for Stripe or Supabase');
    return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  // --- Timestamp validation: reject webhooks older than 5 minutes ---
  const signatureParts = signature.split(',')
  const timestampPart = signatureParts.find(p => p.startsWith('t='))
  if (timestampPart) {
    const webhookTimestamp = parseInt(timestampPart.split('=')[1])
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - webhookTimestamp) > 300) {
      console.error('Webhook timestamp expired:', { webhookTimestamp, now, diff: Math.abs(now - webhookTimestamp) })
      return NextResponse.json({ error: 'Webhook expired' }, { status: 400 })
    }
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ===============================================================
      // CHECKOUT SESSION COMPLETED
      // ===============================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // --- BATTLE PASS ---
        if (session.metadata?.type === 'battle_pass') {
          await handleBattlePassCheckout(session)
          return NextResponse.json({ success: true })
        }

        // --- COIN PURCHASE ---
        if (session.metadata?.coins && session.metadata?.user_id) {
          await handleCoinPurchaseCheckout(session)
          return NextResponse.json({ received: true })
        }

        break
      }

      case 'payment_intent.succeeded': {
        console.log('Payment confirmed:', (event.data.object as Stripe.PaymentIntent).id)
        break
      }

      // ===============================================================
      // REFUND HANDLING
      // ===============================================================
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (!paymentIntentId) {
          console.error('Refund event missing payment_intent')
          break
        }

        // Find original transaction
        const { data: originalTx } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('stripe_payment_id', paymentIntentId)
          .eq('type', 'purchase_coins')
          .single()

        if (originalTx) {
          // Deduct coins from profile
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('virtual_currency')
            .eq('id', originalTx.user_id)
            .single()

          if (profile) {
            const newBalance = Math.max(0, (profile.virtual_currency || 0) - (originalTx.virtual_amount || 0))
            await supabaseAdmin
              .from('profiles')
              .update({ virtual_currency: newBalance })
              .eq('id', originalTx.user_id)
          }

          // Log refund transaction
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: originalTx.user_id,
              type: 'refund',
              amount: -(originalTx.amount || 0),
              virtual_amount: -(originalTx.virtual_amount || 0),
              stripe_payment_id: `refund_${paymentIntentId}`,
              status: 'completed'
            })

          console.log('Refund processed for payment:', paymentIntentId)
        } else {
          console.warn('No original transaction found for refund:', paymentIntentId)
        }
        break
      }

      // ===============================================================
      // DISPUTE / CHARGEBACK HANDLING
      // ===============================================================
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const paymentIntentId = dispute.payment_intent as string

        if (!paymentIntentId) {
          console.error('Dispute event missing payment_intent')
          break
        }

        const { data: originalTx } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('stripe_payment_id', paymentIntentId)
          .single()

        if (originalTx) {
          // Freeze user account for review
          await supabaseAdmin
            .from('profiles')
            .update({ is_frozen: true })
            .eq('id', originalTx.user_id)

          // Log dispute transaction
          await supabaseAdmin
            .from('transactions')
            .insert({
              user_id: originalTx.user_id,
              type: 'dispute',
              amount: -(originalTx.amount || 0),
              virtual_amount: -(originalTx.virtual_amount || 0),
              stripe_payment_id: `dispute_${paymentIntentId}`,
              status: 'pending'
            })

          console.log('Dispute recorded, user frozen:', originalTx.user_id)
        } else {
          console.warn('No original transaction found for dispute:', paymentIntentId)
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════
// COIN PURCHASE HANDLER (with idempotency + atomic crediting)
// ═══════════════════════════════════════════════════════════════
async function handleCoinPurchaseCheckout(session: Stripe.Checkout.Session) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized')

  const { user_id: userId, coins, package_id, package_name } = session.metadata!
  const paymentIntentId = session.payment_intent as string
  const amountInCents = session.amount_total! // Already in cents from Stripe
  const coinsToAdd = parseInt(coins)

  console.log('Processing coin purchase:', {
    userId,
    coins: coinsToAdd,
    package_id,
    package_name,
    amountInCents,
  })

  // --- IDEMPOTENCY CHECK: check if this payment was already processed ---
  const { data: existingTx } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('stripe_payment_id', paymentIntentId)
    .single()

  if (existingTx) {
    console.log(`Already processed payment: ${paymentIntentId}`)
    return
  }

  // --- INSERT TRANSACTION FIRST (acts as idempotency lock via unique constraint) ---
  const amountInEuros = amountInCents / 100
  const loyaltyPoints = Math.floor(amountInCents / 10) // 1 point per 10 cents
  const expToAdd = Math.floor(coinsToAdd / 10) // 1 XP per 10 coins

  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'purchase_coins',
      amount: amountInEuros,
      virtual_amount: coinsToAdd,
      stripe_payment_id: paymentIntentId,
      metadata: {
        package_id,
        package_name,
        session_id: session.id
      },
      status: 'completed'
    })

  if (txError) {
    // If unique constraint violation, this payment was already processed
    if (txError.code === '23505') {
      console.log(`Duplicate payment detected (unique constraint): ${paymentIntentId}`)
      return
    }
    console.error('Error inserting transaction:', txError)
    throw txError
  }

  // --- UPDATE PROFILE: read current values then update ---
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('virtual_currency, loyalty_points, total_exp')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    throw new Error('Profile not found')
  }

  const newCoins = (profile.virtual_currency || 0) + coinsToAdd
  const newLoyaltyPoints = (profile.loyalty_points || 0) + loyaltyPoints
  const newExp = (profile.total_exp || 0) + expToAdd

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      virtual_currency: newCoins,
      loyalty_points: newLoyaltyPoints,
      total_exp: newExp
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    throw new Error('Failed to update profile')
  }

  console.log('Coin purchase completed successfully:', {
    userId,
    coinsAdded: coinsToAdd,
    newBalance: newCoins,
    loyaltyPoints,
    expToAdd,
    paymentIntentId,
  })
}

// ═══════════════════════════════════════════════════════════════
// BATTLE PASS HANDLER (preserved from original)
// ═══════════════════════════════════════════════════════════════
async function handleBattlePassCheckout(session: Stripe.Checkout.Session) {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized')

  const userId = session.metadata!.userId
  const seasonId = session.metadata!.seasonId

  // Recuperer la saison
  const { data: season } = await supabaseAdmin
    .from('battle_pass_seasons')
    .select('end_date')
    .eq('id', seasonId)
    .single()

  if (!season) {
    console.error('Season not found:', seasonId)
    throw new Error('Season not found')
  }

  // Creer l'entree user_battle_passes
  const { error: passError } = await supabaseAdmin
    .from('user_battle_passes')
    .insert({
      user_id: userId,
      season_id: seasonId,
      purchased_at: new Date().toISOString(),
      expires_at: season.end_date,
      current_day: 1,
      last_daily_update: new Date().toISOString(),
      stripe_payment_intent: session.payment_intent as string,
      is_active: true,
    })

  if (passError) {
    console.error('Error creating user battle pass:', passError)
    throw new Error('Failed to activate pass')
  }

  // Auto-claim Day 1
  const { data: day1Reward } = await supabaseAdmin
    .from('battle_pass_rewards')
    .select('id, reward_type, reward_value')
    .eq('season_id', seasonId)
    .eq('day', 1)
    .single()

  if (day1Reward) {
    await supabaseAdmin
      .from('user_battle_pass_claims')
      .insert({
        user_id: userId,
        season_id: seasonId,
        day: 1,
        reward_id: day1Reward.id,
      })

    if (day1Reward.reward_type === 'gold_username') {
      const durationDays = day1Reward.reward_value.duration_days || 30
      await supabaseAdmin
        .from('user_gold_username')
        .upsert({
          user_id: userId,
          activated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
        })
    }
  }

  console.log('Battle Pass activated for user:', userId)
}
