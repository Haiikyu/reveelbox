// Fichier: app/api/chat/messages/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ratelimit } from '@/lib/rate-limit';
import { sanitizeHtml } from '@/lib/sanitize';

import type { Database } from '@/types/database';

// Schema de validation pour les messages
const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  message_type: z.enum(['text', 'image']).optional().default('text'),
  reply_to: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional()
});

// GET /api/chat/messages - Récupérer les messages
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        user_id,
        content,
        message_type,
        is_bot,
        created_at,
        pinned,
        pinned_at,
        pinned_by,
        translated_text,
        reply_to,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Erreur récupération messages:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: messages?.reverse() || []
    });

  } catch (error) {
    console.error('Erreur API messages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/chat/messages - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limiting
    const identifier = `chat_message_${user.id}`;
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      return NextResponse.json({ error: 'Trop de messages envoyés' }, { status: 429 });
    }

    const body = await request.json();
    const validationResult = sendMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { content, message_type, reply_to, metadata } = validationResult.data;

    // Vérifier si l'utilisateur est banni
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned, banned_until')
      .eq('id', user.id)
      .single();

    if (profile?.is_banned && (!profile.banned_until || new Date(profile.banned_until) > new Date())) {
      return NextResponse.json({ error: 'Vous êtes banni du chat' }, { status: 403 });
    }

    // Nettoyer et valider le contenu
    const sanitizedContent = sanitizeHtml(content);
    if (!sanitizedContent.trim()) {
      return NextResponse.json({ error: 'Message vide après nettoyage' }, { status: 400 });
    }

    // Insérer le message
    const { data: newMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        content: sanitizedContent,
        message_type,
        reply_to,
        metadata,
        is_bot: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion message:', insertError);
      return NextResponse.json({ error: 'Impossible d\'envoyer le message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newMessage
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}