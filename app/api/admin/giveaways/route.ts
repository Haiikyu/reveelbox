import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Database } from '@/app/types/database';

const createGiveawaySchema = z.object({
  title: z.string().min(3).max(100),
  amount: z.number().min(1).max(100000),
  winners_count: z.number().min(1).max(50),
  max_participants: z.number().min(1).optional(),
  duration_minutes: z.number().min(1).max(10080)
});

// GET /api/admin/giveaways - Récupérer les giveaways
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    const { data: giveaways, error } = await supabase
      .from('chat_giveaways')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération giveaways:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { giveaways: giveaways || [] }
    });

  } catch (error) {
    console.error('Erreur API giveaways:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/giveaways - Créer un giveaway
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    const body = await request.json();
    const validationResult = createGiveawaySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validationResult.error.issues
      }, { status: 400 });
    }

    const { title, amount, winners_count, max_participants, duration_minutes } = validationResult.data;

    // Utiliser la fonction RPC pour créer le giveaway
    const { data: giveawayId, error } = await supabase.rpc('create_chat_giveaway', {
      p_admin_id: user.id,
      p_title: title,
      p_amount: amount,
      p_winners_count: winners_count,
      p_max_participants: max_participants,
      p_duration_minutes: duration_minutes
    });

    if (error) {
      console.error('Erreur création giveaway:', error);
      return NextResponse.json({ 
        error: error.message || 'Impossible de créer le giveaway'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { giveaway_id: giveawayId }
    });

  } catch (error) {
    console.error('Erreur API création giveaway:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}