// app/api/battles/[id]/add-bot/route.ts
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

    // Créer un bot
    const botNumber = Math.floor(Math.random() * 1000)
    const botId = `bot-${Date.now()}-${botNumber}`
    
    const bot = {
      id: botId,
      userId: null,
      battleId: params.id,
      username: `Pvp Bot #${botNumber}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot${botNumber}`,
      team: null,
      bot: true,
      totalValue: 0,
      loots: []
    }

    // Ajouter le bot comme participant
    const { error } = await supabase
      .from('battle_participants')
      .insert({
        battle_id: params.id,
        user_id: botId,
        is_ready: true,
        is_bot: true
      })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add bot' },
        { status: 400 }
      )
    }

    // Broadcast l'événement
    const channel = supabase.channel(`battle:${params.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'bot_added',
      payload: { bot }
    })

    return NextResponse.json({ success: true, bot })

  } catch (error) {
    console.error('Error adding bot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}