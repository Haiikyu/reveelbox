// app/api/upgrade-stats/route.ts

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Vérifier que l'utilisateur demande ses propres données
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only view your own upgrade stats' },
        { status: 403 }
      )
    }

    // Appeler la fonction RPC pour récupérer les statistiques
    const { data, error } = await supabase
      .rpc('get_user_upgrade_stats', {
        p_user_id: userId
      })

    if (error) {
      console.error('Error fetching upgrade stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch upgrade stats' },
        { status: 500 }
      )
    }

    // Si pas de données, retourner des stats vides
    if (!data) {
      return NextResponse.json({
        total_attempts: 0,
        successful_upgrades: 0,
        failed_upgrades: 0,
        success_rate: 0,
        total_value_gained: 0,
        total_value_lost: 0,
        best_upgrade: null,
        recent_upgrades: []
      })
    }

    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Unexpected error in upgrade-stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}