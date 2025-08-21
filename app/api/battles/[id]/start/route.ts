// app/api/battles/[id]/start/route.ts
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

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mettre à jour le statut de la battle
    const { error: updateError } = await supabase
      .from('battles')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to start battle' },
        { status: 400 }
      )
    }

    // Broadcast l'événement
    const channel = supabase.channel(`battle:${params.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'battle_started',
      payload: {}
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error starting battle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}