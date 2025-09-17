// Fichier: app/api/chat/donations/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const donationSchema = z.object({
  to_user_id: z.string().uuid(),
  amount: z.number().min(1).max(10000),
  message: z.string().max(200).optional()
});

// POST /api/chat/donations - Faire un don de coins
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = donationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { to_user_id, amount, message } = validationResult.data;

    // Utiliser la fonction RPC pour la transaction atomique
    const { data, error } = await supabase.rpc('donate_coins_to_user', {
      p_from_user_id: user.id,
      p_to_user_id: to_user_id,
      p_amount: amount,
      p_message: message
    });

    if (error) {
      console.error('Erreur don:', error);
      return NextResponse.json({ 
        error: error.message || 'Impossible de faire le don'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { donation_id: data }
    });

  } catch (error) {
    console.error('Erreur API donation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}