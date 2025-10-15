// app/api/upgrade-history/route.ts

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
    
    // Vérifier que l'utilisateur est authentifié et qu'il demande ses propres données
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
        { error: 'Forbidden - You can only view your own upgrade history' },
        { status: 403 }
      )
    }

    // Appeler la fonction RPC pour récupérer l'historique
    const { data, error } = await supabase
      .rpc('get_user_upgrade_history', {
        p_user_id: userId,
        p_limit: 50
      })

    if (error) {
      console.error('Error fetching upgrade history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch upgrade history' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
    
  } catch (error) {
    console.error('Unexpected error in upgrade-history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}