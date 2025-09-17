// app/api/upgrade-item/route.ts

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const body = await request.json()
    const { 
      inventory_id, 
      multiplier, 
      new_value, 
      user_id,
      failed 
    } = body

    // Vérifier que l'utilisateur modifie ses propres items
    if (user.id !== user_id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only upgrade your own items' },
        { status: 403 }
      )
    }

    // Valider les multiplicateurs autorisés
    const validMultipliers = [1.5, 2, 3, 4, 5, 10, 100, 1000]
    if (!failed && !validMultipliers.includes(multiplier)) {
      return NextResponse.json(
        { error: 'Invalid multiplier value' },
        { status: 400 }
      )
    }

    // Si l'upgrade a échoué, on traite différemment
    if (failed) {
      // Marquer l'item comme perdu dans l'inventaire
      const { error: updateError } = await supabase
        .from('user_inventory')
        .update({ 
          is_sold: true,
          sold_at: new Date().toISOString(),
          sell_price: 0
        })
        .eq('id', inventory_id)
        .eq('user_id', user_id)

      if (updateError) {
        console.error('Error marking item as lost:', updateError)
        return NextResponse.json(
          { error: 'Failed to update inventory' },
          { status: 500 }
        )
      }

      // Enregistrer l'échec dans l'historique (optionnel)
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id,
          type: 'upgrade_failed',
          virtual_amount: 0,
          description: `Upgrade échoué x${multiplier}`,
          item_id: inventory_id
        })

      if (transactionError) {
        console.error('Error logging failed upgrade:', transactionError)
      }

      return NextResponse.json({ 
        success: true,
        message: 'Item marked as lost due to failed upgrade' 
      })
    }

    // Appeler la fonction RPC pour tenter l'upgrade
    const { data, error } = await supabase
      .rpc('attempt_upgrade_item', {
        p_inventory_id: inventory_id,
        p_multiplier: multiplier,
        p_user_id: user_id
      })

    if (error) {
      console.error('RPC error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to process upgrade' },
        { status: 500 }
      )
    }

    // Si la fonction RPC indique un échec
    if (!data || !data.success) {
      return NextResponse.json(
        { 
          error: data?.error || 'Upgrade failed',
          details: data 
        },
        { status: 400 }
      )
    }

    // Retourner le résultat de l'upgrade
    return NextResponse.json({
      success: true,
      upgrade_success: data.upgrade_success,
      original_value: data.original_value,
      new_value: data.new_value,
      multiplier: data.multiplier,
      chance: data.chance,
      item_name: data.item_name,
      item_id: data.item_id
    })

  } catch (error) {
    console.error('Unexpected error in upgrade-item API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}