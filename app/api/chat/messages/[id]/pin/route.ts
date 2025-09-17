// Fichier: app/api/chat/messages/[id]/pin/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/chat/messages/[id]/pin - Épingler un message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const messageId = params.id;

    // Désépingler tous les autres messages
    await supabase
      .from('chat_messages')
      .update({ pinned: false, pinned_at: null, pinned_by: null })
      .eq('pinned', true);

    // Épingler le message sélectionné
    const { data: updatedMessage, error: updateError } = await supabase
      .from('chat_messages')
      .update({
        pinned: true,
        pinned_at: new Date().toISOString(),
        pinned_by: user.id
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur épinglage:', updateError);
      return NextResponse.json({ error: 'Impossible d\'épingler le message' }, { status: 500 });
    }

    // Log admin
    await supabase
      .from('chat_admin_logs')
      .insert({
        admin_id: user.id,
        action: 'pin_message',
        target_message_id: messageId,
        details: { message_content: updatedMessage.content.substring(0, 100) }
      });

    return NextResponse.json({
      success: true,
      data: updatedMessage
    });

  } catch (error) {
    console.error('Erreur API pin message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}