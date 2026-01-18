export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialisation sécurisée pour éviter le crash au build
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
  // Vérification de l'initialisation des clients
  if (!stripe || !supabaseAdmin || !webhookSecret) {
    console.error('Missing environment variables for Stripe or Supabase');
    return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Gérer checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // ═══════════════════════════════════════════════════════════
    // BATTLE PASS
    // ═══════════════════════════════════════════════════════════
    if (session.metadata?.type === 'battle_pass') {
      const userId = session.metadata.userId
      const seasonId = session.metadata.seasonId

      try {
        // Récupérer la saison
        const { data: season } = await supabaseAdmin
          .from('battle_pass_seasons')
          .select('end_date')
          .eq('id', seasonId)
          .single()

        if (!season) {
          console.error('Season not found:', seasonId)
          return NextResponse.json({ error: 'Season not found' }, { status: 404 })
        }

        // Créer l'entrée user_battle_passes
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
          return NextResponse.json({ error: 'Failed to activate pass' }, { status: 500 })
        }

        // Auto-claim Jour 1
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

        console.log('✅ Battle Pass activated for user:', userId)
        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error processing Battle Pass:', error)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}