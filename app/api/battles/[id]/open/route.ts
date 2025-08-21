// app/api/battles/[id]/open/route.ts
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
    const { boxIndex } = await request.json()

    // Simuler l'ouverture d'une boîte (à adapter selon votre logique)
    const loot = [
      {
        id: `item-${Date.now()}-1`,
        name: 'Nike Air Max',
        image: 'https://i.imgur.com/8YwZmtP.png',
        value: Math.floor(Math.random() * 100) + 50,
        rarity: ['common', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 4)]
      },
      {
        id: `item-${Date.now()}-2`,
        name: 'Adidas Yeezy',
        image: 'https://i.imgur.com/8YwZmtP.png',
        value: Math.floor(Math.random() * 200) + 100,
        rarity: ['common', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 4)]
      }
    ]

    // Broadcast l'événement
    const channel = supabase.channel(`battle:${params.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'box_opened',
      payload: {
        playerId: request.headers.get('x-player-id') || 'unknown',
        boxIndex,
        loot
      }
    })

    return NextResponse.json({ loot })

  } catch (error) {
    console.error('Error opening box:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}