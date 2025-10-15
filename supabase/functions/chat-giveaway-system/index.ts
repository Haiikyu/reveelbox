import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '@/supabase/functions/cors.ts';
import { 
  verifyCaptcha, 
  generateSecureRandom, 
  generateSelectionHash, 
  validateGiveawayParams, 
  sanitizeMessageContent, 
  checkUserPermissions, 
  calculatePrizeDistribution 
} from './utils.ts';

// Types
interface GiveawayRequest {
  action: 'create' | 'join' | 'complete' | 'cancel';
  giveawayId?: string;
  title?: string;
  totalAmount?: number;
  winnersCount?: number;
  durationMinutes?: number;
  captchaToken?: string;
  roomId?: string;
}

interface ChatMessageRequest {
  action: 'send' | 'get_messages';
  roomId?: string;
  content?: string;
  messageType?: 'user_message' | 'system_message';
  limit?: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { pathname } = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    switch (pathname) {
      case '/giveaway':
        return await handleGiveaway(supabase, body, user, profile, req);
      case '/chat':
        return await handleChat(supabase, body, user, profile);
      case '/captcha/verify':
        return await handleCaptchaVerification(supabase, body, user);
      case '/giveaway/auto-complete':
        return await completeExpiredGiveaways(supabase);
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// GESTION DES GIVEAWAYS
async function handleGiveaway(supabase: any, body: GiveawayRequest, user: any, profile: any, req: Request) {
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  switch (body.action) {
    case 'create':
      return await createGiveaway(supabase, body, user, profile, clientIP, userAgent);
    case 'join':
      return await joinGiveaway(supabase, body, user, profile, clientIP, userAgent);
    case 'complete':
      return await completeGiveaway(supabase, body, user, profile);
    case 'cancel':
      return await cancelGiveaway(supabase, body, user, profile);
    default:
      throw new Error('Invalid giveaway action');
  }
}

// CRÉATION D'UN GIVEAWAY
async function createGiveaway(supabase: any, body: GiveawayRequest, user: any, profile: any, clientIP: string, userAgent: string) {
  if (!checkUserPermissions(profile, 'create_giveaway')) {
    throw new Error('Only admins can create giveaways');
  }

  const { title, totalAmount, winnersCount, durationMinutes, roomId = null } = body;

  if (!title || !totalAmount || !winnersCount || !durationMinutes) {
    throw new Error('Missing required giveaway parameters');
  }

  validateGiveawayParams(title, totalAmount, winnersCount, durationMinutes);

  // Récupérer la room par défaut
  let targetRoomId = roomId;
  if (!targetRoomId) {
    const { data: defaultRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('name', 'Global')
      .single();
    
    if (!defaultRoom) {
      throw new Error('Default chat room not found');
    }
    targetRoomId = defaultRoom.id;
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // Créer le giveaway
  const { data: giveaway, error: giveawayError } = await supabase
    .from('chat_giveaways_new')
    .insert({
      room_id: targetRoomId,
      created_by: user.id,
      title,
      total_amount: totalAmount,
      winners_count: winnersCount,
      duration_minutes: durationMinutes,
      ends_at: endsAt.toISOString(),
      status: 'active'
    })
    .select()
    .single();

  if (giveawayError) {
    throw new Error(`Failed to create giveaway: ${giveawayError.message}`);
  }

  // Calculer la distribution des prix
  const prizes = calculatePrizeDistribution(totalAmount, winnersCount);
  
  // Message d'annonce
  const announcementContent = `🎉 **GIVEAWAY LANCÉ !** 🎉

🏆 **${title}**
💰 Prize Pool: **${totalAmount.toLocaleString()} coins**
👥 Winners: **${winnersCount}**
⏰ Duration: **${durationMinutes} minutes**
⏱️ Se termine le: **${endsAt.toLocaleString('fr-FR')}**

✅ **Conditions:**
- Niveau minimum: **5**
- Vérification anti-bot requise
- Un seul ticket par personne

🎁 **Distribution des prix:**${prizes.map((prize, index) => {
    const position = index + 1;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🎆';
    return `\n${medal} ${position}er prix: **${prize.toLocaleString()} coins**`;
  }).join('')}

👍 **Cliquez sur "Rejoindre" pour participer !**`;

  // Insérer le message d'annonce
  const { data: message } = await supabase
    .from('chat_messages_new')
    .insert({
      room_id: targetRoomId,
      user_id: user.id,
      content: announcementContent,
      message_type: 'giveaway_announcement'
    })
    .select()
    .single();

  if (message) {
    await supabase
      .from('chat_giveaways_new')
      .update({ announcement_message_id: message.id })
      .eq('id', giveaway.id);
  }

  // Log d'audit
  await supabase
    .from('giveaway_audit_logs')
    .insert({
      giveaway_id: giveaway.id,
      action: 'giveaway_created',
      admin_id: user.id,
      details: {
        title,
        total_amount: totalAmount,
        winners_count: winnersCount,
        duration_minutes: durationMinutes,
        prize_distribution: prizes,
        admin_username: profile.username
      },
      ip_address: clientIP,
      user_agent: userAgent
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      giveaway: {
        id: giveaway.id,
        title: giveaway.title,
        total_amount: giveaway.total_amount,
        winners_count: giveaway.winners_count,
        ends_at: giveaway.ends_at,
        prize_distribution: prizes,
        announcement_message_id: message?.id
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// REJOINDRE UN GIVEAWAY
async function joinGiveaway(supabase: any, body: GiveawayRequest, user: any, profile: any, clientIP: string, userAgent: string) {
  const { giveawayId, captchaToken } = body;

  if (!giveawayId || !captchaToken) {
    throw new Error('Giveaway ID and captcha token required');
  }

  if (!checkUserPermissions(profile, 'join_giveaway')) {
    throw new Error('Insufficient permissions to join giveaway');
  }

  // Vérifier le giveaway
  const { data: giveaway } = await supabase
    .from('chat_giveaways_new')
    .select('*')
    .eq('id', giveawayId)
    .eq('status', 'active')
    .single();

  if (!giveaway || new Date(giveaway.ends_at) <= new Date()) {
    throw new Error('Giveaway not found, not active, or has ended');
  }

  // Vérifier la participation existante
  const { data: existingParticipation } = await supabase
    .from('chat_giveaway_participants_new')
    .select('id')
    .eq('giveaway_id', giveawayId)
    .eq('user_id', user.id)
    .single();

  if (existingParticipation) {
    throw new Error('You have already joined this giveaway');
  }

  // Vérifier le captcha
  const captchaValid = await verifyCaptcha(captchaToken);
  if (!captchaValid) {
    await supabase.from('giveaway_audit_logs').insert({
      giveaway_id: giveawayId,
      action: 'captcha_failed',
      user_id: user.id,
      details: {
        reason: 'Invalid captcha token',
        token_length: captchaToken.length,
        user_level: profile.level,
        username: profile.username
      },
      ip_address: clientIP,
      user_agent: userAgent
    });
    throw new Error('Captcha verification failed');
  }

  // Ajouter le participant
  const { data: participant } = await supabase
    .from('chat_giveaway_participants_new')
    .insert({
      giveaway_id: giveawayId,
      user_id: user.id,
      captcha_verified: true,
      captcha_token: captchaToken,
      captcha_verified_at: new Date().toISOString(),
      ip_address: clientIP,
      user_agent: userAgent
    })
    .select()
    .single();

  // Compter les participants
  const { count } = await supabase
    .from('chat_giveaway_participants_new')
    .select('*', { count: 'exact' })
    .eq('giveaway_id', giveawayId)
    .eq('captcha_verified', true);

  // Log d'audit
  await supabase.from('giveaway_audit_logs').insert({
    giveaway_id: giveawayId,
    action: 'participant_joined',
    user_id: user.id,
    details: {
      username: profile.username,
      level: profile.level,
      total_participants: count,
      captcha_verified: true,
      join_timestamp: new Date().toISOString()
    },
    ip_address: clientIP,
    user_agent: userAgent
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Successfully joined the giveaway!',
      participant_id: participant.id,
      total_participants: count,
      giveaway_ends_at: giveaway.ends_at
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// COMPLÉTER UN GIVEAWAY (tirage sécurisé)
async function completeGiveaway(supabase: any, body: GiveawayRequest, user: any, profile: any) {
  const { giveawayId } = body;

  if (!checkUserPermissions(profile, 'complete_giveaway')) {
    throw new Error('Only admins can complete giveaways');
  }

  if (!giveawayId) {
    throw new Error('Giveaway ID required');
  }

  // Récupérer le giveaway
  const { data: giveaway } = await supabase
    .from('chat_giveaways_new')
    .select('*')
    .eq('id', giveawayId)
    .eq('status', 'active')
    .single();

  if (!giveaway) {
    throw new Error('Giveaway not found or not active');
  }

  // Récupérer les participants éligibles
  const { data: participants } = await supabase
    .from('chat_giveaway_participants_new')
    .select(`
      id,
      user_id,
      profiles!inner(username, level)
    `)
    .eq('giveaway_id', giveawayId)
    .eq('captcha_verified', true)
    .gte('profiles.level', 5);

  if (!participants || participants.length === 0) {
    throw new Error('No eligible participants found');
  }

  if (participants.length < giveaway.winners_count) {
    throw new Error(`Not enough participants (${participants.length}) for ${giveaway.winners_count} winners`);
  }

  // Génération sécurisée des gagnants
  const seed = generateSecureRandom();
  const shuffledParticipants = [...participants];
  
  // Algorithme de mélange Fisher-Yates avec seed
  for (let i = shuffledParticipants.length - 1; i > 0; i--) {
    const seedNum = parseInt(seed.slice(i % seed.length, (i % seed.length) + 8), 16);
    const j = Math.floor((seedNum / 0xFFFFFFFF) * (i + 1));
    [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
  }

  const winners = shuffledParticipants.slice(0, giveaway.winners_count);
  const prizes = calculatePrizeDistribution(giveaway.total_amount, giveaway.winners_count);

  // Insérer les gagnants et distribuer les prix
  const winnersData = [];
  for (let i = 0; i < winners.length; i++) {
    const winner = winners[i];
    const prize = prizes[i];
    const selectionHash = await generateSelectionHash(
      giveawayId, 
      participants.map(p => p.id), 
      seed + i
    );

    // Insérer le gagnant
    const { data: winnerRecord } = await supabase
      .from('chat_giveaway_winners_new')
      .insert({
        giveaway_id: giveawayId,
        user_id: winner.user_id,
        amount_won: prize,
        position: i + 1,
        selection_hash: selectionHash,
        selection_seed: seed
      })
      .select()
      .single();

    // Créditer les coins
    await supabase
      .from('profiles')
      .update({
        coins_balance: supabase.raw('coins_balance + ?', [prize])
      })
      .eq('id', winner.user_id);

    // Transaction log
    await supabase
      .from('transactions')
      .insert({
        user_id: winner.user_id,
        type: 'giveaway_win',
        virtual_amount: prize,
        description: `Giveaway winner: ${giveaway.title}`,
        metadata: {
          giveaway_id: giveawayId,
          position: i + 1,
          selection_hash: selectionHash
        }
      });

    winnersData.push({
      username: winner.profiles.username,
      amount_won: prize,
      position: i + 1
    });
  }

  // Marquer le giveaway comme terminé
  await supabase
    .from('chat_giveaways_new')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', giveawayId);

  // Message de résultats
  const totalDistributed = prizes.reduce((sum, prize) => sum + prize, 0);
  const resultsContent = `🎊 **RÉSULTATS DU GIVEAWAY** 🎊

🏆 **${giveaway.title}**

👑 **Gagnants:**
${winnersData.map(w => `${w.position}. ${w.username} - ${w.amount_won.toLocaleString()} coins`).join('\n')}

💰 **Total distribué: ${totalDistributed.toLocaleString()} coins**
🎉 Félicitations aux gagnants !`;

  const { data: resultsMessage } = await supabase
    .from('chat_messages_new')
    .insert({
      room_id: giveaway.room_id,
      user_id: user.id,
      content: resultsContent,
      message_type: 'giveaway_results'
    })
    .select()
    .single();

  if (resultsMessage) {
    await supabase
      .from('chat_giveaways_new')
      .update({ results_message_id: resultsMessage.id })
      .eq('id', giveawayId);
  }

  // Log d'audit
  await supabase
    .from('giveaway_audit_logs')
    .insert({
      giveaway_id: giveawayId,
      action: 'giveaway_completed',
      admin_id: user.id,
      details: {
        winners_count: winners.length,
        total_distributed: totalDistributed,
        seed: seed,
        participants_count: participants.length
      }
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Giveaway completed successfully',
      winners: winnersData,
      total_distributed: totalDistributed
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ANNULER UN GIVEAWAY
async function cancelGiveaway(supabase: any, body: GiveawayRequest, user: any, profile: any) {
  const { giveawayId } = body;

  if (!checkUserPermissions(profile, 'cancel_giveaway')) {
    throw new Error('Only admins can cancel giveaways');
  }

  if (!giveawayId) {
    throw new Error('Giveaway ID required');
  }

  const { data: giveaway } = await supabase
    .from('chat_giveaways_new')
    .select('*')
    .eq('id', giveawayId)
    .eq('status', 'active')
    .single();

  if (!giveaway) {
    throw new Error('Giveaway not found or not active');
  }

  await supabase
    .from('chat_giveaways_new')
    .update({ status: 'cancelled' })
    .eq('id', giveawayId);

  const cancelMessage = `❌ **GIVEAWAY ANNULÉ** ❌

🏆 **${giveaway.title}**

Ce giveaway a été annulé par un administrateur.`;

  await supabase
    .from('chat_messages_new')
    .insert({
      room_id: giveaway.room_id,
      user_id: user.id,
      content: cancelMessage,
      message_type: 'system_message'
    });

  await supabase
    .from('giveaway_audit_logs')
    .insert({
      giveaway_id: giveawayId,
      action: 'giveaway_cancelled',
      admin_id: user.id,
      details: { reason: 'Manual cancellation by admin' }
    });

  return new Response(
    JSON.stringify({ success: true, message: 'Giveaway cancelled successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// GESTION DU CHAT
async function handleChat(supabase: any, body: ChatMessageRequest, user: any, profile: any) {
  switch (body.action) {
    case 'send':
      return await sendMessage(supabase, body, user, profile);
    case 'get_messages':
      return await getMessages(supabase, body, user);
    default:
      throw new Error('Invalid chat action');
  }
}

// ENVOYER UN MESSAGE
async function sendMessage(supabase: any, body: ChatMessageRequest, user: any, profile: any) {
  const { roomId, content, messageType = 'user_message' } = body;

  if (!content) {
    throw new Error('Message content required');
  }

  const sanitizedContent = sanitizeMessageContent(content);

  // Vérifier les permissions
  if (messageType === 'system_message' && !checkUserPermissions(profile, 'send_system_message')) {
    throw new Error('Only admins can send system messages');
  }

  if (!checkUserPermissions(profile, 'send_message')) {
    throw new Error('You are banned from sending messages');
  }

  // Récupérer la room
  let targetRoomId = roomId;
  if (!targetRoomId) {
    const { data: defaultRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('name', 'Global')
      .single();
    
    if (!defaultRoom) {
      throw new Error('Default chat room not found');
    }
    targetRoomId = defaultRoom.id;
  }

  // Insérer le message
  const { data: message, error } = await supabase
    .from('chat_messages_new')
    .insert({
      room_id: targetRoomId,
      user_id: user.id,
      content: sanitizedContent,
      message_type: messageType
    })
    .select(`
      id,
      content,
      message_type,
      created_at,
      profiles!inner(username, avatar_url, level)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true, message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// RÉCUPÉRER LES MESSAGES
async function getMessages(supabase: any, body: ChatMessageRequest, user: any) {
  const { roomId, limit = 60 } = body;

  let targetRoomId = roomId;
  if (!targetRoomId) {
    const { data: defaultRoom } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('name', 'Global')
      .single();
    
    if (!defaultRoom) {
      throw new Error('Default chat room not found');
    }
    targetRoomId = defaultRoom.id;
  }

  const { data: messages, error } = await supabase
    .from('chat_messages_new')
    .select(`
      id,
      content,
      message_type,
      created_at,
      profiles!inner(id, username, avatar_url, level)
    `)
    .eq('room_id', targetRoomId)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true, messages: messages.reverse() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// VÉRIFICATION CAPTCHA
async function handleCaptchaVerification(supabase: any, body: any, user: any) {
  const { token } = body;
  
  if (!token) {
    throw new Error('Captcha token required');
  }

  const isValid = await verifyCaptcha(token);
  
  return new Response(
    JSON.stringify({ success: true, valid: isValid }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// COMPLÉTER LES GIVEAWAYS EXPIRÉS (AUTOMATIQUE)
async function completeExpiredGiveaways(supabase: any) {
  const { data: expiredGiveaways } = await supabase
    .from('chat_giveaways_new')
    .select('*')
    .eq('status', 'active')
    .lte('ends_at', new Date().toISOString());

  const results = [];
  
  for (const giveaway of expiredGiveaways || []) {
    try {
      const { data: participants } = await supabase
        .from('chat_giveaway_participants_new')
        .select('id, user_id, profiles!inner(username, level)')
        .eq('giveaway_id', giveaway.id)
        .eq('captcha_verified', true)
        .gte('profiles.level', 5);

      if (participants && participants.length >= giveaway.winners_count) {
        // Effectuer le tirage automatique (logique similaire à completeGiveaway)
        const seed = generateSecureRandom();
        const winners = participants
          .sort(() => 0.5 - Math.random())
          .slice(0, giveaway.winners_count);
        
        const prizes = calculatePrizeDistribution(giveaway.total_amount, giveaway.winners_count);
        
        for (let i = 0; i < winners.length; i++) {
          const winner = winners[i];
          const prize = prizes[i];
          
          // Insérer gagnant
          await supabase
            .from('chat_giveaway_winners_new')
            .insert({
              giveaway_id: giveaway.id,
              user_id: winner.user_id,
              amount_won: prize,
              position: i + 1,
              selection_seed: seed
            });

          // Créditer coins
          await supabase
            .from('profiles')
            .update({
              coins_balance: supabase.raw('coins_balance + ?', [prize])
            })
            .eq('id', winner.user_id);

          // Transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: winner.user_id,
              type: 'giveaway_win',
              virtual_amount: prize,
              description: `Auto-completed giveaway: ${giveaway.title}`
            });
        }
        
        await supabase
          .from('chat_giveaways_new')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', giveaway.id);
        
        // Message de résultats
        const resultsContent = `🎊 **GIVEAWAY TERMINÉ** 🎊

🏆 **${giveaway.title}**

👑 **Gagnants:**
${winners.map((w, i) => `${i + 1}. ${w.profiles.username} - ${prizes[i].toLocaleString()} coins`).join('\n')}

🎉 Félicitations !`;

        await supabase
          .from('chat_messages_new')
          .insert({
            room_id: giveaway.room_id,
            user_id: giveaway.created_by,
            content: resultsContent,
            message_type: 'giveaway_results'
          });
        
        results.push({ giveaway_id: giveaway.id, status: 'completed' });
      } else {
        // Pas assez de participants, annuler
        await supabase
          .from('chat_giveaways_new')
          .update({ status: 'cancelled' })
          .eq('id', giveaway.id);
        
        await supabase
          .from('chat_messages_new')
          .insert({
            room_id: giveaway.room_id,
            user_id: giveaway.created_by,
            content: `❌ **GIVEAWAY ANNULÉ** ❌\n\n🏆 **${giveaway.title}**\n\nPas assez de participants éligibles.`,
            message_type: 'system_message'
          });
        
        results.push({ giveaway_id: giveaway.id, status: 'cancelled', reason: 'insufficient_participants' });
      }
    } catch (error) {
      results.push({ giveaway_id: giveaway.id, status: 'error', error: error.message });
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}