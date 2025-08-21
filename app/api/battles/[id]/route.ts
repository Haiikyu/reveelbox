import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const battleId = params.id
    
    // Créer le client Supabase
    const supabase = createClient()

    // 1. Récupérer la battle
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single()

    if (battleError || !battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      )
    }

    // 2. Récupérer les participants RÉELS
    const { data: participants, error: participantsError } = await supabase
      .from('battle_participants')
      .select('*')
      .eq('battle_id', battleId)

    // 3. Récupérer les profils des participants
    const participantIds = participants?.map(p => p.user_id).filter(Boolean) || []
    let profiles: any[] = []
    
    if (participantIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, virtual_currency')
        .in('id', participantIds)
      profiles = data || []
    }

    // 4. Récupérer les boxes de la battle (si vous avez une table battle_boxes)
    const { data: battleBoxes } = await supabase
      .from('battle_boxes')
      .select('loot_box_id')
      .eq('battle_id', battleId)

    // 5. Transformer en format attendu avec les VRAIES données
    const transformedBattle = {
      id: battle.id,
      mode: battle.mode || '1v1',
      status: battle.status || 'waiting',
      creatorId: battle.created_by,
      boxes: battleBoxes?.map(bb => bb.loot_box_id) || [],
      players: (participants || []).map(p => {
        const profile = profiles.find(prof => prof.id === p.user_id)
        return {
          id: p.user_id,
          userId: p.user_id,
          battleId: battle.id,
          username: profile?.username || 'Joueur Anonyme',
          avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
          team: p.team || null,
          bot: p.is_bot || false,
          totalValue: p.total_value || 0,
          loots: [] // À remplir quand la battle commence
        }
      }),
      winners: battle.winners || null,
      createdAt: battle.created_at,
      startedAt: battle.started_at || null,
      endedAt: battle.ended_at || null
    }

    return NextResponse.json(transformedBattle)

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}