import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/giveaways/[id]/select-winners - Sélectionner les gagnants
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

    const giveawayId = params.id;

    // Utiliser la fonction RPC pour sélectionner les gagnants
    const { data: winners, error } = await supabase.rpc('select_giveaway_winners', {
      p_admin_id: user.id,
      p_giveaway_id: giveawayId
    });

    if (error) {
      console.error('Erreur sélection gagnants:', error);
      return NextResponse.json({ 
        error: error.message || 'Impossible de sélectionner les gagnants'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { winners: winners || [] }
    });

  } catch (error) {
    console.error('Erreur API sélection gagnants:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}