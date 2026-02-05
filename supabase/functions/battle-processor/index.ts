// Edge Function: battle-processor
// Handles server-side battle processing for provably fair box openings

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"

// Timing constants (shared with client)
const BATTLE_TIMING = {
  COUNTDOWN: 3000,        // 3s before start
  ANIMATION: 8000,        // 8s roulette animation
  RESULT_DISPLAY: 3500,   // 3.5s result display
  ROUND_TOTAL: 11500      // Total per round
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Create Supabase client with service role for admin operations
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Create Supabase client with user's JWT for auth checks
function getSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Generate cryptographically secure random seed
function generateSecureSeed(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

// Hash a seed using SHA-256
async function hashSeed(seed: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(seed)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// =====================================================
// HANDLER: /start - Start a battle
// =====================================================
async function handleStart(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { battle_id } = await req.json()
    if (!battle_id) {
      return new Response(JSON.stringify({ error: 'Missing battle_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user from JWT
    const supabaseClient = getSupabaseClient(authHeader)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch battle and verify user is creator
    const { data: battle, error: battleError } = await supabaseAdmin
      .from('battles')
      .select('id, creator_id, status, max_players, mode')
      .eq('id', battle_id)
      .single()

    if (battleError || !battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (battle.creator_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Only the creator can start the battle' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (battle.status !== 'waiting') {
      return new Response(JSON.stringify({ error: 'Battle is not in waiting state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check all slots are filled
    const { count: participantCount } = await supabaseAdmin
      .from('battle_participants')
      .select('id', { count: 'exact', head: true })
      .eq('battle_id', battle_id)

    if (participantCount !== battle.max_players) {
      return new Response(JSON.stringify({
        error: `Need ${battle.max_players} players, only ${participantCount} joined`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate provably fair seeds
    const serverSeed = generateSecureSeed()
    const clientSeed = generateSecureSeed()
    const serverSeedHash = await hashSeed(serverSeed)

    console.log(`[Battle ${battle_id}] Starting with provably fair seeds`)

    // Update battle to countdown status with seeds
    const { error: updateError } = await supabaseAdmin
      .from('battles')
      .update({
        status: 'countdown',
        server_seed: serverSeed,
        client_seed: clientSeed,
        combined_hash: serverSeedHash,
        current_box: 0
      })
      .eq('id', battle_id)

    if (updateError) {
      console.error('Error updating battle:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to start battle' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate all battle openings using the DB function
    const { data: openingsResult, error: openingsError } = await supabaseAdmin
      .rpc('generate_all_battle_openings', { p_battle_id: battle_id })

    if (openingsError) {
      console.error('Error generating openings:', openingsError)
      // Rollback battle status
      await supabaseAdmin
        .from('battles')
        .update({ status: 'waiting', server_seed: null, client_seed: null })
        .eq('id', battle_id)

      return new Response(JSON.stringify({ error: 'Failed to generate battle openings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[Battle ${battle_id}] Generated openings:`, openingsResult)

    // Start the processing in background (non-blocking)
    // Use EdgeRuntime.waitUntil for background processing
    const processPromise = processBattle(battle_id)

    // If EdgeRuntime.waitUntil is available, use it
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processPromise)
    }

    return new Response(JSON.stringify({
      success: true,
      server_seed_hash: serverSeedHash,
      message: 'Battle started'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in /start:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// =====================================================
// PROCESS: Run battle rounds (background)
// =====================================================
async function processBattle(battleId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    console.log(`[Battle ${battleId}] Processing started`)

    // Wait for countdown
    await sleep(BATTLE_TIMING.COUNTDOWN)

    // Set status to active
    await supabaseAdmin
      .from('battles')
      .update({ status: 'active' })
      .eq('id', battleId)

    console.log(`[Battle ${battleId}] Status set to active`)

    // Get battle info
    const { data: battle, error: battleError } = await supabaseAdmin
      .from('battles')
      .select(`
        id,
        mode,
        battle_boxes (
          loot_box_id,
          quantity,
          order_position
        )
      `)
      .eq('id', battleId)
      .single()

    if (battleError || !battle) {
      console.error(`[Battle ${battleId}] Failed to fetch battle info:`, battleError)
      return
    }

    // Calculate total boxes
    const battleBoxes = battle.battle_boxes as any[]
    const totalBoxes = battleBoxes.reduce((sum: number, box: any) => sum + box.quantity, 0)

    console.log(`[Battle ${battleId}] Total boxes: ${totalBoxes}`)

    // Process each round
    for (let boxIndex = 0; boxIndex < totalBoxes; boxIndex++) {
      console.log(`[Battle ${battleId}] Processing box ${boxIndex + 1}/${totalBoxes}`)

      // Update current_box (1-indexed for display)
      const { error: updateError } = await supabaseAdmin
        .from('battles')
        .update({ current_box: boxIndex + 1 })
        .eq('id', battleId)

      if (updateError) {
        console.error(`[Battle ${battleId}] Failed to update current_box:`, updateError)
      }

      // Wait for animation + result display
      await sleep(BATTLE_TIMING.ROUND_TOTAL)
    }

    // Finalize battle
    console.log(`[Battle ${battleId}] Finalizing battle`)

    const { data: finalizeResult, error: finalizeError } = await supabaseAdmin
      .rpc('finalize_battle', { p_battle_id: battleId })

    if (finalizeError) {
      console.error(`[Battle ${battleId}] Failed to finalize:`, finalizeError)
      // Still mark as finished even if finalize fails
      await supabaseAdmin
        .from('battles')
        .update({ status: 'finished' })
        .eq('id', battleId)
    } else {
      console.log(`[Battle ${battleId}] Finalized:`, finalizeResult)
    }

    console.log(`[Battle ${battleId}] Processing complete`)

  } catch (error) {
    console.error(`[Battle ${battleId}] Processing error:`, error)

    // Try to mark battle as finished on error
    try {
      await supabaseAdmin
        .from('battles')
        .update({ status: 'finished' })
        .eq('id', battleId)
    } catch (e) {
      console.error(`[Battle ${battleId}] Failed to mark as finished:`, e)
    }
  }
}

// =====================================================
// HANDLER: /process - Resume processing (recovery)
// =====================================================
async function handleProcess(req: Request): Promise<Response> {
  try {
    // This endpoint is for recovery - called by pg_cron or manually
    const { battle_id, service_key } = await req.json()

    // Verify service key for automated calls
    const expectedKey = Deno.env.get('BATTLE_PROCESSOR_KEY')
    if (expectedKey && service_key !== expectedKey) {
      return new Response(JSON.stringify({ error: 'Invalid service key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!battle_id) {
      return new Response(JSON.stringify({ error: 'Missing battle_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check battle status
    const { data: battle, error: battleError } = await supabaseAdmin
      .from('battles')
      .select('id, status, current_box')
      .eq('id', battle_id)
      .single()

    if (battleError || !battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (battle.status === 'finished') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Battle already finished'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (battle.status !== 'active' && battle.status !== 'countdown') {
      return new Response(JSON.stringify({
        error: 'Battle is not in processable state'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Resume processing
    console.log(`[Battle ${battle_id}] Resuming from box ${battle.current_box}`)

    const processPromise = processBattle(battle_id)
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(processPromise)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Processing resumed'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in /process:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// =====================================================
// HANDLER: /status - Get battle processing status
// =====================================================
async function handleStatus(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const battleId = url.searchParams.get('battle_id')

    if (!battleId) {
      return new Response(JSON.stringify({ error: 'Missing battle_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: battle, error } = await supabaseAdmin
      .from('battles')
      .select('id, status, current_box, server_seed, combined_hash')
      .eq('id', battleId)
      .single()

    if (error || !battle) {
      return new Response(JSON.stringify({ error: 'Battle not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Only reveal server_seed if battle is finished
    const response: any = {
      id: battle.id,
      status: battle.status,
      current_box: battle.current_box,
      server_seed_hash: battle.combined_hash
    }

    if (battle.status === 'finished') {
      response.server_seed = battle.server_seed
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in /status:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// =====================================================
// MAIN HANDLER
// =====================================================
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/battle-processor', '')

  console.log(`[Battle Processor] ${req.method} ${path}`)

  try {
    switch (path) {
      case '/start':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        return await handleStart(req)

      case '/process':
        if (req.method !== 'POST') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        return await handleProcess(req)

      case '/status':
        if (req.method !== 'GET') {
          return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        return await handleStatus(req)

      default:
        return new Response(JSON.stringify({
          error: 'Not found',
          available_endpoints: ['/start', '/process', '/status']
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
