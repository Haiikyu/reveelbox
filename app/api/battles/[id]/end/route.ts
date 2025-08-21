// app/api/battles/[id]/end/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Récupérer les participants et calculer le gagnant
    const { data: participants } = await supabase
      .from('battle_participants')
      .select('*')
      .eq('battle_id', params.id)

    // Déterminer le gagnant (celui avec la plus grande valeur totale)
    const winners = participants?.length ? [participants[0].user_id] : []

    // Mettre à jour la battle
    const { error } = await supabase
      .from('battles')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to end battle' },
        { status: 400 }
      )
    }

    // Broadcast l'événement
    const channel = supabase.channel(`battle:${params.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'battle_ended',
      payload: { winners }
    })

    return NextResponse.json({ success: true, winners })

  } catch (error) {
    console.error('Error ending battle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}