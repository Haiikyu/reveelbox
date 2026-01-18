'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Trophy, Bot, User, Crown, Coins, Timer, Users,
  PlayCircle, Plus, Eye, ArrowLeft, Sparkles, Zap
} from 'lucide-react'

const supabase = createClient()

interface BattleItem {
  id: string
  item_name: string
  item_image: string
  market_value: number
  rarity: string
}

interface BattleParticipant {
  id: string
  user_id: string | null
  username: string | null
  avatar_url: string | null
  is_bot: boolean
  bot_name: string | null
  bot_avatar_url: string | null
  position: number
  total_value: number
  items: BattleItem[]
}

interface BattleBox {
  loot_box_id: string
  box_name: string
  box_image: string
  quantity: number
  order_position: number
}

interface Battle {
  id: string
  name: string
  mode: string
  max_players: number
  entry_cost: number
  total_prize: number
  status: 'waiting' | 'countdown' | 'active' | 'finished'
  creator_id: string
  total_boxes: number
  current_box: number
  participants: BattleParticipant[]
  battle_boxes: BattleBox[]
  created_at: string
}

const ROULETTE_ITEMS_COUNT = 50
const ITEM_WIDTH = 140
const ROULETTE_DURATION = 8000 // 8 secondes par ouverture

export default function BattleRoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const battleId = params.id as string
  const isSpectating = searchParams.get('spectate') === 'true'

  const [battle, setBattle] = useState<Battle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [canJoin, setCanJoin] = useState(false)

  // États d'animation
  const [isOpening, setIsOpening] = useState(false)
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0)
  const [rouletteOffsets, setRouletteOffsets] = useState<{[key: number]: number}>({})
  const [winningItems, setWinningItems] = useState<{[key: number]: BattleItem | null}>({})
  const [accumulatedItems, setAccumulatedItems] = useState<{[key: number]: BattleItem[]}>({ 0: [], 1: [] })
  
  // État pour les openings chargés depuis la DB (battles terminées)
  const [loadedOpenings, setLoadedOpenings] = useState<{[key: number]: BattleItem[]}>({ 0: [], 1: [] })

  // Countdown avant le début
  const [countdown, setCountdown] = useState<number | null>(null)

  // Charger les données de la battle
  const loadBattle = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Récupérer la battle
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .select('*')
        .eq('id', battleId)
        .single()

      if (battleError) throw battleError
      if (!battleData) throw new Error('Battle not found')

      // Récupérer les participants
      const { data: participantsData } = await supabase
        .from('battle_participants')
        .select(`
          id, user_id, is_bot, bot_name, bot_avatar_url, 
          position, total_value
        `)
        .eq('battle_id', battleId)
        .order('position')

      // Récupérer les boxes de la battle
      const { data: boxesData } = await supabase
        .from('battle_boxes')
        .select(`
          loot_box_id,
          quantity,
          order_position,
          loot_boxes (
            name,
            image_url
          )
        `)
        .eq('battle_id', battleId)
        .order('order_position')

      // Récupérer les usernames pour les participants humains
      const userIds = participantsData
        ?.filter(p => !p.is_bot && p.user_id)
        .map(p => p.user_id) || []

      let usernamesMap: {[key: string]: any} = {}
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)

        profilesData?.forEach(profile => {
          usernamesMap[profile.id] = profile
        })
      }

      // Construire les participants complets
      const participants: BattleParticipant[] = participantsData?.map(p => ({
        id: p.id,
        user_id: p.user_id,
        username: p.is_bot ? p.bot_name : usernamesMap[p.user_id]?.username,
        avatar_url: p.is_bot ? p.bot_avatar_url : usernamesMap[p.user_id]?.avatar_url,
        is_bot: p.is_bot,
        bot_name: p.bot_name,
        bot_avatar_url: p.bot_avatar_url,
        position: p.position,
        total_value: p.total_value || 0,
        items: []
      })) || []

      // Formater les boxes
      const battleBoxes: BattleBox[] = boxesData?.map(box => ({
        loot_box_id: box.loot_box_id,
        box_name: (box.loot_boxes as any)?.name || 'Mystery Box',
        box_image: (box.loot_boxes as any)?.image_url || '/mystery-box.png',
        quantity: box.quantity,
        order_position: box.order_position
      })) || []

      // Calculer le nombre total de boxes
      const totalBoxes = battleBoxes.reduce((sum, box) => sum + box.quantity, 0)

      setBattle({
        ...battleData,
        participants,
        battle_boxes: battleBoxes,
        total_boxes: totalBoxes
      })

      // Si la battle est terminée, charger les openings depuis la DB
      if (battleData.status === 'finished') {
        const { data: openingsData } = await supabase
          .from('battle_openings')
          .select(`
            id,
            participant_id,
            box_order,
            item_id,
            item_value,
            items (
              id,
              name,
              image_url,
              market_value,
              rarity
            )
          `)
          .eq('battle_id', battleId)
          .order('box_order')

        if (openingsData && openingsData.length > 0) {
          // Organiser les openings par participant
          const openingsByParticipant: {[key: number]: BattleItem[]} = { 0: [], 1: [] }
          
          openingsData.forEach(opening => {
            const participantIndex = participants.findIndex(p => p.id === opening.participant_id)
            if (participantIndex !== -1) {
              const itemData = opening.items as any
              openingsByParticipant[participantIndex].push({
                id: itemData.id,
                item_name: itemData.name,
                item_image: itemData.image_url,
                market_value: opening.item_value, // Utiliser la valeur historique
                rarity: itemData.rarity
              })
            }
          })

          setLoadedOpenings(openingsByParticipant)
          console.log('Loaded openings from DB:', openingsByParticipant)
        }
      }

    } catch (err: any) {
      console.error('Error loading battle:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [battleId])

  // Charger l'utilisateur actuel
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    loadUser()
  }, [])

  // Vérifier si l'utilisateur peut rejoindre / est créateur
  useEffect(() => {
    if (battle && currentUser) {
      setIsCreator(battle.creator_id === currentUser.id)
      
      const hasJoined = battle.participants.some(p => 
        !p.is_bot && p.user_id === currentUser.id
      )
      
      const canJoinValue = !hasJoined && 
        !isSpectating &&
        battle.participants.length < battle.max_players &&
        battle.status === 'waiting'
      
      // DEBUG : Afficher pourquoi on peut ou ne peut pas rejoindre
      console.log('Can join battle?', {
        canJoin: canJoinValue,
        hasJoined,
        isSpectating,
        hasSpace: battle.participants.length < battle.max_players,
        status: battle.status,
        participantsCount: battle.participants.length,
        maxPlayers: battle.max_players
      })
      
      setCanJoin(canJoinValue)
    }
  }, [battle, currentUser, isSpectating])

  // Charger la battle au montage
  useEffect(() => {
    loadBattle()
  }, [loadBattle])

  // Realtime sur les changements de battle
  useEffect(() => {
    const channel = supabase
      .channel(`battle:${battleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${battleId}`
        },
        () => {
          loadBattle()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_participants',
          filter: `battle_id=eq.${battleId}`
        },
        () => {
          loadBattle()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [battleId, loadBattle])

  // Gérer le countdown
  useEffect(() => {
    if (battle?.status === 'countdown') {
      setCountdown(3)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    } else {
      // Reset countdown si on n'est plus en countdown
      setCountdown(null)
    }
  }, [battle?.status])

  // Démarrer les animations d'ouverture
  useEffect(() => {
    if (battle?.status === 'active' && !isOpening) {
      startBattleAnimations()
    }
  }, [battle?.status])

  const startBattleAnimations = async () => {
    if (!battle) return
    
    for (let boxIdx = 0; boxIdx < battle.total_boxes; boxIdx++) {
      setCurrentBoxIndex(boxIdx)
      
      // RESET COMPLET AVANT CHAQUE BOX
      setIsOpening(false)
      setRouletteOffsets({ 0: 0, 1: 0 })
      setWinningItems({ 0: null, 1: null })
      
      // Trouver la box correspondante
      let accumulatedBoxes = 0
      let currentBoxData = battle.battle_boxes[0]
      
      for (const box of battle.battle_boxes) {
        if (boxIdx >= accumulatedBoxes && boxIdx < accumulatedBoxes + box.quantity) {
          currentBoxData = box
          break
        }
        accumulatedBoxes += box.quantity
      }

      // Petit délai pour voir le reset
      await new Promise(resolve => setTimeout(resolve, 300))

      let results: Array<{ participantIndex: number; wonItem: BattleItem }> = []

      // ===============================================
      // CRITIQUE : SEUL LE CRÉATEUR TIRE LES ITEMS !
      // ===============================================
      if (isCreator) {
        console.log('🎲 CREATOR: Drawing items for all participants...')
        
        // TIRER LES ITEMS GAGNÉS D'ABORD (CÔTÉ CRÉATEUR UNIQUEMENT)
        const openingPromises = battle.participants.map(async (_, i) => {
          const wonItem = await simulateBoxOpening(currentBoxData.loot_box_id)
          return { participantIndex: i, wonItem }
        })

        results = await Promise.all(openingPromises)

        // SAUVEGARDER LES OUVERTURES EN DB (CRITIQUE!)
        for (const result of results) {
          const participant = battle.participants[result.participantIndex]
          
          await supabase
            .from('battle_openings')
            .insert({
              battle_id: battleId,
              participant_id: participant.id,
              box_order: boxIdx + 1,
              item_id: result.wonItem.id,
              item_value: result.wonItem.market_value
            })
        }

        console.log(`✅ Box ${boxIdx + 1} openings saved to DB by CREATOR`)
      } else {
        // ===============================================
        // LES AUTRES JOUEURS CHARGENT DEPUIS LA DB
        // ===============================================
        console.log('👁️ SPECTATOR: Loading items from DB...')
        
        // Attendre que le créateur sauvegarde (max 5 secondes)
        let attempts = 0
        let openingsData = null
        
        while (attempts < 10 && !openingsData) {
          const { data } = await supabase
            .from('battle_openings')
            .select(`
              id,
              participant_id,
              box_order,
              item_id,
              item_value,
              items (
                id,
                name,
                image_url,
                market_value,
                rarity
              )
            `)
            .eq('battle_id', battleId)
            .eq('box_order', boxIdx + 1)
          
          if (data && data.length === battle.participants.length) {
            openingsData = data
            break
          }
          
          // Attendre 500ms avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }

        if (!openingsData || openingsData.length === 0) {
          console.error('❌ Failed to load openings from DB')
          return
        }

        console.log(`✅ Loaded ${openingsData.length} openings from DB`)

        // Convertir les données DB en format results
        results = openingsData.map(opening => {
          const participantIndex = battle.participants.findIndex(p => p.id === opening.participant_id)
          const itemData = opening.items as any
          
          return {
            participantIndex,
            wonItem: {
              id: itemData.id,
              item_name: itemData.name,
              item_image: itemData.image_url,
              market_value: opening.item_value,
              rarity: itemData.rarity
            }
          }
        })
      }

      // ===============================================
      // À PARTIR D'ICI, TOUT LE MONDE FAIT PAREIL
      // ===============================================

      // METTRE À JOUR LES WINNING ITEMS (pour que la roulette se construise avec)
      setWinningItems(prev => {
        const updated = { ...prev }
        results.forEach(r => {
          updated[r.participantIndex] = r.wonItem
        })
        return updated
      })

      // Attendre que les roulettes se construisent avec les bons items
      await new Promise(resolve => setTimeout(resolve, 200))

      // ACTIVER L'ANIMATION
      setIsOpening(true)

      // CALCULER LES OFFSETS POUR L'ANIMATION
      const newOffsets: {[key: number]: number} = {}
      results.forEach(r => {
        const itemPosition = 25
        const targetPosition = -((itemPosition * ITEM_WIDTH) + (ITEM_WIDTH / 2))
        newOffsets[r.participantIndex] = targetPosition
      })

      setRouletteOffsets(newOffsets)

      // Attendre la fin de l'animation
      await new Promise(resolve => setTimeout(resolve, ROULETTE_DURATION + 1000))

      // DÉSACTIVER L'ANIMATION
      setIsOpening(false)

      // Mettre à jour les total_value des participants dans l'état local
      setAccumulatedItems(prev => {
        const updated = { ...prev }
        results.forEach(r => {
          if (!updated[r.participantIndex]) updated[r.participantIndex] = []
          updated[r.participantIndex] = [...updated[r.participantIndex], r.wonItem]
        })
        return updated
      })

      // Calculer et mettre à jour les valeurs totales
      if (battle) {
        const updatedParticipants = battle.participants.map((p, i) => {
          const currentItems = accumulatedItems[i] || []
          const newItem = results.find(r => r.participantIndex === i)?.wonItem
          const allParticipantItems = newItem ? [...currentItems, newItem] : currentItems
          
          const newTotalValue = allParticipantItems.reduce((sum, item) => sum + item.market_value, 0)
          
          console.log(`Participant ${i} (${p.username || p.bot_name}):`, {
            items: allParticipantItems.length,
            totalValue: newTotalValue
          })
          
          return {
            ...p,
            total_value: newTotalValue
          }
        })
        
        setBattle({
          ...battle,
          participants: updatedParticipants
        })
      }
    }

    // Terminer la battle
    await finishBattle()
  }

  const simulateBoxOpening = async (boxId: string): Promise<BattleItem> => {
    try {
      // Charger les items de cette box avec leurs probabilités
      const { data: boxItems } = await supabase
        .from('loot_box_items')
        .select(`
          item_id,
          probability,
          items (
            id,
            name,
            image_url,
            market_value,
            rarity
          )
        `)
        .eq('loot_box_id', boxId)

      if (!boxItems || boxItems.length === 0) {
        throw new Error('No items in box')
      }

      // Calculer le total des probabilités
      const totalProbability = boxItems.reduce((sum, item) => sum + item.probability, 0)
      
      // Tirer un nombre aléatoire entre 0 et totalProbability
      let random = Math.random() * totalProbability
      
      // Sélectionner l'item selon les probabilités
      let selectedItem = boxItems[0]
      for (const item of boxItems) {
        random -= item.probability
        if (random <= 0) {
          selectedItem = item
          break
        }
      }

      const itemData = selectedItem.items as any

      return {
        id: itemData.id,
        item_name: itemData.name,
        item_image: itemData.image_url,
        market_value: itemData.market_value,
        rarity: itemData.rarity
      }
    } catch (err) {
      console.error('Error opening box:', err)
      // Fallback en cas d'erreur
      return {
        id: Math.random().toString(),
        item_name: 'Mystery Item',
        item_image: '/mystery-box.png',
        market_value: 100,
        rarity: 'common'
      }
    }
  }

  const finishBattle = async () => {
    if (!battle) return

    // IMPORTANT : Charger les items depuis battle_openings (DB)
    // Car accumulatedItems peut être vide après refresh
    const { data: openingsData } = await supabase
      .from('battle_openings')
      .select(`
        participant_id,
        item_id,
        item_value,
        items (
          id,
          name,
          image_url,
          market_value,
          rarity
        )
      `)
      .eq('battle_id', battleId)

    if (!openingsData || openingsData.length === 0) {
      console.error('No battle_openings found!')
      return
    }

    // Organiser les items par participant
    const itemsByParticipant = new Map<string, BattleItem[]>()
    
    for (const opening of openingsData) {
      if (!itemsByParticipant.has(opening.participant_id)) {
        itemsByParticipant.set(opening.participant_id, [])
      }
      
      const itemData = opening.items as any
      itemsByParticipant.get(opening.participant_id)!.push({
        id: itemData.id,
        item_name: itemData.name,
        item_image: itemData.image_url,
        market_value: opening.item_value,
        rarity: itemData.rarity
      })
    }

    // Calculer les valeurs totales finales
    const finalValues = battle.participants.map((p) => {
      const items = itemsByParticipant.get(p.id) || []
      const totalValue = items.reduce((sum, item) => sum + item.market_value, 0)
      return { participant: p, totalValue, items, participantIndex: battle.participants.indexOf(p) }
    })

    // DEBUG : Afficher les valeurs
    console.log('Final values:', finalValues.map(f => ({ 
      name: f.participant.username || f.participant.bot_name,
      value: f.totalValue,
      itemsCount: f.items.length
    })))

    // Trouver le gagnant (celui avec la PLUS GRANDE valeur)
    let winner = finalValues[0]
    for (let i = 1; i < finalValues.length; i++) {
      if (finalValues[i].totalValue > winner.totalValue) {
        winner = finalValues[i]
      }
    }

    console.log('Winner:', winner.participant.username || winner.participant.bot_name, 'with', winner.totalValue)

    // Collecter TOUS les items de la battle
    const allItems = finalValues.flatMap(f => f.items)

    console.log('Total items to add to winner inventory:', allItems.length)

    // Ajouter tous les items dans l'inventaire du gagnant (sauf si c'est un bot)
    if (!winner.participant.is_bot && winner.participant.user_id) {
      let successCount = 0
      for (const item of allItems) {
        const { error } = await supabase
          .from('user_inventory')
          .insert({
            user_id: winner.participant.user_id,
            item_id: item.id,
            quantity: 1,  // ← Chaque item gagné = 1 quantité
            obtained_from: 'battle',
            obtained_at: new Date().toISOString(),
            is_sold: false  // ← IMPORTANT pour que l'item s'affiche dans l'inventaire
          })
        
        if (!error) {
          successCount++
        } else {
          console.error('Error adding item to inventory:', error)
        }
      }
      
      console.log('Added', successCount, '/', allItems.length, 'items to winner inventory')
    } else {
      console.log('Winner is a bot, items not added to inventory')
    }

    // Mettre à jour les valeurs finales dans battle_participants
    for (let i = 0; i < battle.participants.length; i++) {
      const finalValue = finalValues.find(f => f.participantIndex === i)
      if (finalValue) {
        await supabase
          .from('battle_participants')
          .update({ total_value: finalValue.totalValue })
          .eq('id', battle.participants[i].id)
      }
    }

    // Marquer la battle comme terminée avec le BON winner_id
    await supabase
      .from('battles')
      .update({ 
        status: 'finished',
        winner_id: winner.participant.user_id
      })
      .eq('id', battleId)

    console.log('Battle finished! Winner:', winner.participant.username || winner.participant.bot_name)

    setIsOpening(false)
    await loadBattle()
  }

  const handleJoinBattle = async () => {
    if (!currentUser || !battle) return

    try {
      console.log('Joining battle...', { userId: currentUser.id, battleId: battle.id, entryCost: battle.entry_cost })

      // 1. Charger le profil de l'utilisateur pour vérifier le solde
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('virtual_currency')
        .eq('id', currentUser.id)
        .single()

      console.log('Profile query result:', { userProfile, profileError })

      if (profileError) {
        console.error('Profile error:', profileError)
        setError(`Erreur profile: ${profileError.message}`)
        return
      }

      if (!userProfile) {
        console.error('No profile found for user:', currentUser.id)
        setError('Profil utilisateur introuvable')
        return
      }

      console.log('User virtual_currency:', userProfile.virtual_currency, 'Entry cost:', battle.entry_cost)

      // 2. Vérifier que l'utilisateur a assez de coins
      if ((userProfile.virtual_currency || 0) < battle.entry_cost) {
        setError(`Solde insuffisant ! Il vous faut ${battle.entry_cost} coins pour rejoindre cette battle.`)
        return
      }

      // 3. Prélever les coins du joueur
      console.log('Deducting coins...')
      const { data: deductData, error: deductError } = await supabase.rpc('deduct_coins', {
        p_user_id: currentUser.id,
        p_amount: battle.entry_cost
      })

      console.log('Deduct result:', { deductData, deductError })

      if (deductError) {
        console.error('Erreur déduction coins:', deductError)
        setError(`Erreur prélèvement: ${deductError.message}`)
        return
      }

      // 4. Ajouter le joueur à la battle
      console.log('Adding to battle...')
      
      // Trouver la prochaine position disponible
      const maxPosition = battle.participants.length > 0 
        ? Math.max(...battle.participants.map(p => p.position))
        : 0
      const nextPosition = maxPosition + 1
      
      console.log('Current participants:', battle.participants.length, 'Max position:', maxPosition, 'Next position:', nextPosition)
      
      const { error } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: battleId,
          user_id: currentUser.id,
          is_bot: false,
          position: nextPosition
        })

      if (error) {
        console.error('Error adding to battle:', error)
        throw error
      }

      // 5. Rafraîchir la battle
      console.log('Reloading battle...')
      await loadBattle()

      console.log(`✅ Joueur ${currentUser.id} a rejoint la battle. ${battle.entry_cost} coins prélevés.`)
      
    } catch (err: any) {
      console.error('Error joining battle:', err)
      setError(err.message)
    }
  }

  const handleAddBot = async () => {
    if (!battle) return

    try {
      const botNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']
      const botName = botNames[Math.floor(Math.random() * botNames.length)]

      const { error } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: battleId,
          user_id: null,
          is_bot: true,
          bot_name: botName,
          position: battle.participants.length
        })

      if (error) throw error
      await loadBattle()
    } catch (err: any) {
      console.error('Error adding bot:', err)
      setError(err.message)
    }
  }

  const handleStartBattle = async () => {
    if (!battle || battle.participants.length < battle.max_players) return

    try {
      // Passer en countdown
      await supabase
        .from('battles')
        .update({ status: 'countdown' })
        .eq('id', battleId)

      // Après 3 secondes, passer en active
      setTimeout(async () => {
        await supabase
          .from('battles')
          .update({ status: 'active' })
          .eq('id', battleId)
      }, 3000)

    } catch (err: any) {
      console.error('Error starting battle:', err)
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-[#4578be] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">Chargement de la battle...</p>
        </div>
      </div>
    )
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">Erreur: {error || 'Battle introuvable'}</p>
          <button
            onClick={() => window.location.href = '/battles'}
            className="px-6 py-3 bg-[#4578be] text-white rounded-xl hover:bg-[#5989d8] transition"
          >
            Retour aux battles
          </button>
        </div>
      </div>
    )
  }

  // Trouver le créateur et l'adversaire
  const creator = battle.participants.find(p => !p.is_bot && p.user_id === battle.creator_id) || battle.participants[0]
  const opponent = battle.participants.find(p => p.id !== creator?.id) || null
  const emptySlot = battle.participants.length < battle.max_players

  // Utiliser les bonnes données selon le statut
  const itemsData = battle.status === 'finished' ? loadedOpenings : accumulatedItems

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-[#1a2332] to-gray-900 flex flex-col">
      {/* Header Compact */}
      <div className="bg-[#0a0e1a] border-b border-[#4578be]/30 flex-shrink-0">
        <div className="max-w-[1920px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/battles'}
                className="p-2 hover:bg-[#4578be]/20 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Crown className="w-6 h-6 text-[#4578be]" />
                  {battle.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-[#4578be]/20 border border-[#4578be]/50">
                <span className="text-white text-sm font-semibold">
                  {battle.status === 'waiting' && 'En attente'}
                  {battle.status === 'countdown' && 'Démarrage...'}
                  {battle.status === 'active' && 'En cours'}
                  {battle.status === 'finished' && 'Terminée'}
                </span>
              </div>

              <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#4578be] to-[#5989d8] shadow-lg shadow-[#4578be]/50">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">
                    {Math.floor(battle.total_prize)} coins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-9xl font-black text-white mb-4"
              >
                {countdown}
              </motion.div>
              <p className="text-2xl text-gray-400">La battle démarre...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - 2 colonnes */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-2 gap-4 p-4">
          {/* COLONNE GAUCHE - Créateur */}
          <div className="flex flex-col h-full">
            {/* Card joueur gauche */}
            {creator ? (
              <ParticipantCardCompact
                participant={{
                  ...creator,
                  total_value: itemsData[0]?.reduce((sum, item) => sum + item.market_value, 0) || 0
                }}
                position={0}
                isWinner={battle.status === 'finished' && (itemsData[0]?.reduce((sum, item) => sum + item.market_value, 0) || 0) > (itemsData[1]?.reduce((sum, item) => sum + item.market_value, 0) || 0)}
                side="left"
              />
            ) : (
              <EmptySlotCompact
                onJoin={canJoin ? handleJoinBattle : undefined}
                onAddBot={isCreator && battle.status === 'waiting' ? handleAddBot : undefined}
              />
            )}

            {/* Roulette/Items gauche */}
            {battle.status === 'active' && creator && (
              <div className="flex-1 mt-4">
                <RouletteAnimationCompact
                  participant={creator}
                  offset={rouletteOffsets[0] || 0}
                  isAnimating={isOpening}
                  winningItem={winningItems[0]}
                  accumulatedItems={itemsData[0] || []}
                  battleBoxes={battle.battle_boxes}
                  currentBoxIndex={currentBoxIndex}
                />
              </div>
            )}
            
            {battle.status === 'finished' && creator && (
              <div className="flex-1 mt-4 bg-[#0a0e1a] rounded-2xl border border-[#4578be]/30 p-4 overflow-y-auto">
                <p className="text-gray-400 text-xs font-semibold mb-2">
                  Items obtenus ({itemsData[0]?.length || 0})
                </p>
                <div className="space-y-2">
                  {(itemsData[0] || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-[#4578be]/20 to-[#5989d8]/20 border border-[#4578be]/50 rounded-lg p-2 flex items-center gap-2"
                    >
                      <img
                        src={item.item_image}
                        alt={item.item_name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/mystery-box.png'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs truncate">{item.item_name}</p>
                        <p className="text-yellow-500 font-bold text-xs">
                          {Math.floor(item.market_value)} coins
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE - Adversaire */}
          <div className="flex flex-col h-full">
            {/* Card joueur droite */}
            {opponent ? (
              <ParticipantCardCompact
                participant={{
                  ...opponent,
                  total_value: itemsData[1]?.reduce((sum, item) => sum + item.market_value, 0) || 0
                }}
                position={1}
                isWinner={battle.status === 'finished' && (itemsData[1]?.reduce((sum, item) => sum + item.market_value, 0) || 0) > (itemsData[0]?.reduce((sum, item) => sum + item.market_value, 0) || 0)}
                side="right"
              />
            ) : emptySlot ? (
              <EmptySlotCompact
                onJoin={canJoin ? handleJoinBattle : undefined}
                onAddBot={isCreator && battle.status === 'waiting' ? handleAddBot : undefined}
              />
            ) : null}

            {/* Roulette/Items droite */}
            {battle.status === 'active' && opponent && (
              <div className="flex-1 mt-4">
                <RouletteAnimationCompact
                  participant={opponent}
                  offset={rouletteOffsets[1] || 0}
                  isAnimating={isOpening}
                  winningItem={winningItems[1]}
                  accumulatedItems={itemsData[1] || []}
                  battleBoxes={battle.battle_boxes}
                  currentBoxIndex={currentBoxIndex}
                />
              </div>
            )}
            
            {battle.status === 'finished' && opponent && (
              <div className="flex-1 mt-4 bg-[#0a0e1a] rounded-2xl border border-[#4578be]/30 p-4 overflow-y-auto">
                <p className="text-gray-400 text-xs font-semibold mb-2">
                  Items obtenus ({itemsData[1]?.length || 0})
                </p>
                <div className="space-y-2">
                  {(itemsData[1] || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-[#4578be]/20 to-[#5989d8]/20 border border-[#4578be]/50 rounded-lg p-2 flex items-center gap-2"
                    >
                      <img
                        src={item.item_image}
                        alt={item.item_name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/mystery-box.png'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs truncate">{item.item_name}</p>
                        <p className="text-yellow-500 font-bold text-xs">
                          {Math.floor(item.market_value)} coins
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions en bas */}
      {battle.status === 'waiting' && isCreator && battle.participants.length === battle.max_players && (
        <div className="flex-shrink-0 p-4 bg-[#0a0e1a] border-t border-[#4578be]/30">
          <div className="flex justify-center">
            <button
              onClick={handleStartBattle}
              className="px-8 py-3 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white text-lg font-bold rounded-xl hover:scale-105 transition shadow-lg shadow-[#4578be]/50"
            >
              <PlayCircle className="w-5 h-5 inline mr-2" />
              Lancer la Battle
            </button>
          </div>
        </div>
      )}

      {/* Winner Display */}
      {battle.status === 'finished' && (() => {
        const value0 = itemsData[0]?.reduce((sum, item) => sum + item.market_value, 0) || 0
        const value1 = itemsData[1]?.reduce((sum, item) => sum + item.market_value, 0) || 0
        const realWinner = value0 > value1 ? creator : opponent
        const totalValue = value0 + value1
        
        console.log('Winner display:', { value0, value1, winner: realWinner?.username || realWinner?.bot_name })
        
        return realWinner ? (
          <WinnerDisplayCompact 
            winner={realWinner} 
            totalPrize={totalValue}
          />
        ) : null
      })()}
    </div>
  )
}

// Composant ParticipantCardCompact
function ParticipantCardCompact({ 
  participant, 
  position,
  isWinner,
  side
}: { 
  participant: BattleParticipant
  position: number
  isWinner: boolean
  side: 'left' | 'right'
}) {
  // Détecter si c'est un perdant (pas gagnant et a une valeur)
  const isLoser = !isWinner && participant.total_value >= 0
  
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl border-2 p-6 relative overflow-hidden ${
        isWinner 
          ? 'bg-gradient-to-b from-emerald-900/40 to-[#0a0e1a] border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]' 
          : isLoser
          ? 'bg-gradient-to-b from-red-900/20 to-[#0a0e1a] border-red-500/50'
          : 'bg-[#0a0e1a] border-[#4578be]/30'
      }`}
    >
      {/* Banner GAGNANT */}
      {isWinner && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 px-4 py-2.5 text-center rounded-t-xl">
          <span className="text-white font-bold text-lg flex items-center justify-center gap-2">
            🏆 GAGNANT
          </span>
        </div>
      )}

      <div className={`flex flex-col items-center gap-4 ${isWinner ? 'mt-10' : ''}`}>
        {/* Avatar - Plus grand pour le gagnant */}
        <div className="relative">
          <motion.div 
            className={`rounded-full overflow-hidden ${
              isWinner 
                ? 'w-36 h-36 border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                : isLoser
                ? 'w-28 h-28 border-4 border-red-500/50'
                : 'w-24 h-24 border-4 border-[#4578be]/50'
            }`}
            animate={isWinner ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {participant.is_bot ? (
              <div className={`w-full h-full flex items-center justify-center ${
                isWinner 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' 
                  : isLoser
                  ? 'bg-gradient-to-br from-red-600/70 to-red-800/70'
                  : 'bg-[#4578be]'
              }`}>
                <Bot className={`text-white ${isWinner ? 'w-16 h-16' : isLoser ? 'w-14 h-14' : 'w-12 h-12'}`} />
              </div>
            ) : (
              <img
                src={participant.avatar_url || '/default-avatar.png'}
                alt={participant.username || 'Player'}
                className={`w-full h-full object-cover ${isLoser ? 'opacity-70 grayscale-[20%]' : ''}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/default-avatar.png'
                }}
              />
            )}
          </motion.div>
          
          {/* Badge Bot */}
          {participant.is_bot && (
            <div className={`absolute -bottom-2 -right-2 rounded-full p-2 ${
              isWinner 
                ? 'bg-emerald-500' 
                : isLoser 
                ? 'bg-red-500/70'
                : 'bg-[#4578be]'
            }`}>
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className={`text-xl font-bold mb-2 ${
            isWinner 
              ? 'text-emerald-400 text-2xl' 
              : isLoser 
              ? 'text-red-400/80'
              : 'text-white'
          }`}>
            {participant.username || participant.bot_name || 'Unknown'}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <Coins className={`w-5 h-5 ${isWinner ? 'text-emerald-400' : 'text-yellow-500'}`} />
            <span className={`font-semibold text-lg ${
              isWinner 
                ? 'text-emerald-400' 
                : isLoser 
                ? 'text-red-400/70'
                : 'text-gray-400'
            }`}>
              {Math.floor(participant.total_value)} coins
            </span>
          </div>
        </div>

        {/* Position Badge */}
        <div className={`px-4 py-2 rounded-xl font-bold ${
          isWinner 
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
            : isLoser
            ? 'bg-gradient-to-r from-red-600/70 to-red-500/70 text-white/80'
            : position === 0 
            ? 'bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white' 
            : 'bg-gray-800 text-gray-400'
        }`}>
          #{position + 1}
        </div>
      </div>
    </motion.div>
  )
}

// Composant EmptySlotCompact
function EmptySlotCompact({ 
  onJoin, 
  onAddBot 
}: { 
  onJoin?: () => void
  onAddBot?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0a0e1a] rounded-2xl border-2 border-dashed border-[#4578be]/30 p-8 flex items-center justify-center h-full"
    >
      <div className="text-center">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-[#4578be]/30 mx-auto mb-4 flex items-center justify-center">
          <Users className="w-12 h-12 text-gray-600" />
        </div>
        <p className="text-gray-500 mb-6 text-lg">Slot disponible</p>
        
        <div className="flex flex-col gap-3">
          {onJoin && (
            <button
              onClick={onJoin}
              className="px-8 py-3 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white font-bold rounded-xl hover:scale-105 transition shadow-lg shadow-[#4578be]/50"
            >
              <User className="w-5 h-5 inline mr-2" />
              Rejoindre
            </button>
          )}
          
          {onAddBot && (
            <button
              onClick={onAddBot}
              className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Ajouter un Bot
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Composant RouletteAnimationCompact
function RouletteAnimationCompact({
  participant,
  offset,
  isAnimating,
  winningItem,
  accumulatedItems,
  battleBoxes,
  currentBoxIndex
}: {
  participant: BattleParticipant
  offset: number
  isAnimating: boolean
  winningItem: BattleItem | null
  accumulatedItems: BattleItem[]
  battleBoxes: BattleBox[]
  currentBoxIndex: number
}) {
  const [rouletteItems, setRouletteItems] = useState<any[]>([])

  // Charger les vrais items de la box actuelle
  useEffect(() => {
    const loadBoxItems = async () => {
      if (currentBoxIndex >= battleBoxes.length) return
      
      // Trouver la box correspondante
      let accumulatedBoxes = 0
      let currentBox = battleBoxes[0]
      
      for (const box of battleBoxes) {
        if (currentBoxIndex >= accumulatedBoxes && currentBoxIndex < accumulatedBoxes + box.quantity) {
          currentBox = box
          break
        }
        accumulatedBoxes += box.quantity
      }
      
      // Charger les items de cette box depuis la DB
      const { data: boxItems } = await supabase
        .from('loot_box_items')
        .select(`
          item_id,
          probability,
          items (
            id,
            name,
            image_url,
            market_value,
            rarity
          )
        `)
        .eq('loot_box_id', currentBox.loot_box_id)

      if (boxItems && boxItems.length > 0) {
        // Créer la roulette avec les vrais items
        const items = []
        
        for (let i = 0; i < ROULETTE_ITEMS_COUNT; i++) {
          // Si c'est la position 25 ET qu'on a un winning item, mettre le winning item
          if (i === 25 && winningItem) {
            items.push({
              id: i,
              name: winningItem.item_name,
              image: winningItem.item_image,
              value: winningItem.market_value,
              rarity: winningItem.rarity
            })
          } else {
            // Sinon, item aléatoire de la box
            const randomItem = boxItems[Math.floor(Math.random() * boxItems.length)]
            items.push({
              id: i,
              name: (randomItem.items as any)?.name || 'Item',
              image: (randomItem.items as any)?.image_url || '/mystery-box.png',
              value: (randomItem.items as any)?.market_value || 0,
              rarity: (randomItem.items as any)?.rarity || 'common'
            })
          }
        }
        setRouletteItems(items)
      } else {
        // Fallback si pas d'items en DB
        const items = Array.from({ length: ROULETTE_ITEMS_COUNT }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          image: '/mystery-box.png',
          value: Math.floor(Math.random() * 1000),
          rarity: 'common'
        }))
        setRouletteItems(items)
      }
    }

    loadBoxItems()
  }, [currentBoxIndex, battleBoxes, winningItem])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500 shadow-yellow-500/30'
      case 'epic': return 'border-purple-500 shadow-purple-500/30'
      case 'rare': return 'border-blue-500 shadow-blue-500/30'
      case 'uncommon': return 'border-green-500 shadow-green-500/30'
      default: return 'border-gray-600'
    }
  }

  return (
    <div className="bg-[#0a0e1a] rounded-2xl border border-[#4578be]/30 p-4 h-full flex flex-col">
      {/* Header avec avatar */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#4578be]/50">
          {participant.is_bot ? (
            <div className="w-full h-full bg-[#4578be] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          ) : (
            <img
              src={participant.avatar_url || '/default-avatar.png'}
              alt={participant.username || 'Player'}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/default-avatar.png'
              }}
            />
          )}
        </div>
        <span className="text-white font-bold text-sm">
          {participant.username || participant.bot_name}
        </span>
      </div>

      {/* Roulette Container */}
      <div className="relative h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-r from-[#1a2332] via-[#0a0e1a] to-[#1a2332] flex items-center">
        {/* Indicateur central */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-[#4578be] z-20 transform -translate-x-1/2" />
        <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-[#4578be] rounded-full z-20 transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-[#4578be]/50" />

        {/* Items strip */}
        {rouletteItems.length > 0 && (
          <motion.div
            key={`roulette-${currentBoxIndex}`}
            className="absolute left-1/2 h-full flex items-center"
            initial={{ x: 0 }}
            animate={{
              x: isAnimating ? offset : 0
            }}
            transition={{
              duration: ROULETTE_DURATION / 1000,
              ease: [0.25, 0.1, 0.25, 1.0]
            }}
          >
            {rouletteItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0"
                style={{ width: ITEM_WIDTH }}
              >
                <div className={`bg-gray-800 rounded-lg p-2 border-2 shadow-lg ${getRarityColor(item.rarity)}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-16 object-contain mb-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/mystery-box.png'
                    }}
                  />
                  <p className="text-center text-yellow-500 text-xs font-bold">
                    {Math.floor(item.value)}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Items Gagnés Accumulés */}
      <div className="flex-1 overflow-y-auto mt-3">
        {accumulatedItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-semibold mb-2">
              Items gagnés ({accumulatedItems.length})
            </p>
            {accumulatedItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-[#4578be]/20 to-[#5989d8]/20 border border-[#4578be]/50 rounded-lg p-2 flex items-center gap-2"
              >
                <img
                  src={item.item_image}
                  alt={item.item_name}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/mystery-box.png'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs truncate">{item.item_name}</p>
                  <p className="text-yellow-500 font-bold text-xs">
                    {Math.floor(item.market_value)} coins
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant WinnerDisplayCompact
function WinnerDisplayCompact({ 
  winner, 
  totalPrize 
}: { 
  winner: BattleParticipant
  totalPrize: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-t-2 border-yellow-500 p-6 z-40"
    >
      <div className="max-w-[1920px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl"
          >
            🏆
          </motion.div>
          
          <div>
            <h2 className="text-3xl font-black text-white mb-1">
              {winner.username || winner.bot_name} remporte la battle !
            </h2>
            
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-500" />
              <span className="text-3xl font-black text-yellow-500">
                {Math.floor(totalPrize)} coins
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/battles'}
          className="px-8 py-3 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white text-lg font-bold rounded-xl hover:scale-105 transition shadow-lg shadow-[#4578be]/50"
        >
          Retour aux battles
        </button>
      </div>
    </motion.div>
  )
}