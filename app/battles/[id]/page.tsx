'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Trophy, Bot, User, Crown, Coins, Timer, Users,
  PlayCircle, Plus, Eye, ArrowLeft, Sparkles, Zap, Swords
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
  price?: number
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

// ===============================================
// HELPERS POUR LES DIFFÉRENTS MODES DE BATTLE
// ===============================================
const isTeamMode = (mode: string) => {
  return mode === '2v2' || mode === '3v3'
}

const getGridColumns = (maxPlayers: number, mode: string) => {
  if (isTeamMode(mode)) {
    // Mode équipe : toujours 2 colonnes (Team A | Team B)
    return 'grid-cols-2'
  } else {
    // Mode free-for-all : autant de colonnes que de joueurs
    switch(maxPlayers) {
      case 2: return 'grid-cols-2'
      case 3: return 'grid-cols-3'
      case 4: return 'grid-cols-4'
      case 6: return 'grid-cols-6' // Pour le cas où
      default: return 'grid-cols-2'
    }
  }
}

const getPlayersPerTeam = (maxPlayers: number, mode: string) => {
  if (isTeamMode(mode)) {
    return maxPlayers / 2  // 2v2 = 2, 3v3 = 3
  }
  return maxPlayers
}

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
  const [accumulatedItems, setAccumulatedItems] = useState<{[key: number]: BattleItem[]}>({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] })
  
  // État pour les openings chargés depuis la DB (battles terminées)
  const [loadedOpenings, setLoadedOpenings] = useState<{[key: number]: BattleItem[]}>({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] })

  // États pour l'animation de fin de battle
  const [itemsAnimating, setItemsAnimating] = useState(false)
  const [itemsTransferred, setItemsTransferred] = useState(false)

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
            image_url,
            price_virtual
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
        order_position: box.order_position,
        price: (box.loot_boxes as any)?.price_virtual || 0
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
          // Organiser les openings par participant - DYNAMIQUE selon le nombre de participants
          const openingsByParticipant: {[key: number]: BattleItem[]} = {}
          
          // Initialiser un tableau pour CHAQUE participant
          participants.forEach((_, index) => {
            openingsByParticipant[index] = []
          })
          
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

  // Lancer l'animation de fin quand la battle est terminée
  useEffect(() => {
    if (battle?.status === 'finished' && !itemsAnimating && !itemsTransferred) {
      console.log('🎬 Lancement animation de fin')
      const timer = setTimeout(() => {
        console.log('📦 Items animating = true')
        setItemsAnimating(true)
        setTimeout(() => {
          console.log('📦 Items animating = false')
          setItemsAnimating(false)
          setTimeout(() => {
            console.log('✅ Items transferred = true')
            setItemsTransferred(true)
          }, 800) // Réduire de 1500 à 800ms
        }, 800) // Réduire de 1000 à 800ms
      }, 300) // Réduire de 500 à 300ms
      return () => clearTimeout(timer)
    }
  }, [battle?.status]) // Enlever itemsAnimating et itemsTransferred des dépendances !

  const startBattleAnimations = async () => {
    if (!battle) return
    
    for (let boxIdx = 0; boxIdx < battle.total_boxes; boxIdx++) {
      setCurrentBoxIndex(boxIdx)
      
      // RESET COMPLET AVANT CHAQUE BOX - Dynamique selon nombre de joueurs
      setIsOpening(false)
      
      // Créer les offsets et winningItems dynamiquement
      const resetOffsets: {[key: number]: number} = {}
      const resetWinningItems: {[key: number]: BattleItem | null} = {}
      battle.participants.forEach((_, i) => {
        resetOffsets[i] = 0
        resetWinningItems[i] = null
      })
      
      setRouletteOffsets(resetOffsets)
      setWinningItems(resetWinningItems)
      
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
      
      // DEBUG : Vérifier si on est bien le créateur
      console.log('🔍 DEBUG Box', boxIdx + 1, '- Creator check:', {
        isCreator,
        currentUserId: currentUser?.id,
        battleCreatorId: battle.creator_id,
        participantsCount: battle.participants.length
      })
      
      // FIX ROBUSTE: Vérifier si on est le créateur de plusieurs façons
      const humanPlayers = battle.participants.filter(p => !p.is_bot)
      const isOnlyHuman = humanPlayers.length === 1 && currentUser && humanPlayers[0].user_id === currentUser.id
      
      // Si pas de currentUser, on considère qu'on est le créateur (cas single player)
      const noOtherHumans = humanPlayers.length <= 1
      
      const shouldBeCreator = isCreator || isOnlyHuman || noOtherHumans
      
      console.log('🔍 Creator decision:', {
        isCreator,
        isOnlyHuman,
        noOtherHumans,
        humanPlayersCount: humanPlayers.length,
        FINAL_shouldBeCreator: shouldBeCreator
      })
      
      if (shouldBeCreator) {
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
          
          const { error: insertError } = await supabase
            .from('battle_openings')
            .insert({
              battle_id: battleId,
              participant_id: participant.id,
              box_order: boxIdx + 1,
              item_id: result.wonItem.id,
              item_value: result.wonItem.market_value
            })
          
          if (insertError) {
            console.error('❌ Error saving opening:', insertError)
          }
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

      // CALCULER LES OFFSETS POUR L'ANIMATION - centrer l'item 25
      const newOffsets: {[key: number]: number} = {}
      results.forEach(r => {
        // L'item gagnant est à la position 25
        // Pour le centrer: on déplace de -(position du centre de l'item)
        // Centre de l'item 25 = 25 * ITEM_WIDTH + ITEM_WIDTH/2
        const targetPosition = -(25 * ITEM_WIDTH + ITEM_WIDTH / 2)
        newOffsets[r.participantIndex] = targetPosition
      })

      setRouletteOffsets(newOffsets)

      // Attendre la fin de l'animation + 3 secondes pour voir l'item gagné
      await new Promise(resolve => setTimeout(resolve, ROULETTE_DURATION + 3500))

      // IMPORTANT: Désactiver l'animation pour permettre la suivante
      setIsOpening(false)
      
      // Attendre que le state se mette à jour avant de continuer
      await new Promise(resolve => setTimeout(resolve, 200))

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

    // Calculer les valeurs totales finales par participant
    const finalValues = battle.participants.map((p) => {
      const items = itemsByParticipant.get(p.id) || []
      const totalValue = items.reduce((sum, item) => sum + item.market_value, 0)
      return { participant: p, totalValue, items, participantIndex: battle.participants.indexOf(p) }
    })

    console.log('Final values:', finalValues.map(f => ({ 
      name: f.participant.username || f.participant.bot_name,
      team: f.participant.team,
      value: f.totalValue,
      itemsCount: f.items.length
    })))

    // ===============================================
    // GESTION DES MODES : TEAM vs FREE-FOR-ALL
    // ===============================================
    const isTeam = isTeamMode(battle.mode)

    if (isTeam) {
      // ========== MODE ÉQUIPE (2v2, 3v3) ==========
      console.log('🏆 TEAM MODE: Calculating team scores...')
      
      // Calculer les scores par équipe
      const teamScores = new Map<number, number>()
      finalValues.forEach(fv => {
        const team = fv.participant.team || 0
        teamScores.set(team, (teamScores.get(team) || 0) + fv.totalValue)
      })

      console.log('Team scores:', Array.from(teamScores.entries()))

      // Trouver l'équipe gagnante
      let winningTeam = 0
      let maxScore = 0
      teamScores.forEach((score, team) => {
        if (score > maxScore) {
          maxScore = score
          winningTeam = team
        }
      })

      console.log(`Winning team: Team ${winningTeam} with ${maxScore}`)

      // Tous les items de la battle
      const allItems = finalValues.flatMap(f => f.items)

      // Les joueurs de l'équipe gagnante
      const winningTeamPlayers = finalValues.filter(fv => fv.participant.team === winningTeam)

      // ===============================================
      // 🔒 SEUL LE CRÉATEUR DISTRIBUE LES ITEMS !
      // ===============================================
      if (isCreator) {
        console.log('🏆 CREATOR: Distributing rewards to winning team...')
        
        // Part de chaque joueur de l'équipe gagnante
        const sharePerPlayer = battle.total_prize / winningTeamPlayers.length

        for (const playerData of winningTeamPlayers) {
          if (playerData.participant.is_bot || !playerData.participant.user_id) {
            console.log(`Skipping bot: ${playerData.participant.bot_name}`)
            continue
          }

          console.log(`Processing player: ${playerData.participant.username}, share: ${sharePerPlayer}`)

          // Trouver l'item avec la valeur juste EN DESSOUS de la part
          const { data: closestItem } = await supabase
            .from('items')
            .select('id, name, image_url, market_value, rarity')
            .lte('market_value', sharePerPlayer)
            .order('market_value', { ascending: false })
            .limit(1)
            .single()

          if (closestItem) {
            // Donner l'item
            await supabase
              .from('user_inventory')
              .insert({
                user_id: playerData.participant.user_id,
                item_id: closestItem.id,
                quantity: 1,
                obtained_from: 'battle',
                obtained_at: new Date().toISOString(),
                is_sold: false
              })

            // Calculer la différence en coins
            const coinsBalance = sharePerPlayer - closestItem.market_value

            // Ajouter les coins balance
            if (coinsBalance > 0) {
              // Charger le solde actuel
              const { data: profileData } = await supabase
                .from('profiles')
                .select('virtual_currency')
                .eq('id', playerData.participant.user_id)
                .single()

              if (profileData) {
                const newBalance = (profileData.virtual_currency || 0) + Math.floor(coinsBalance)
                await supabase
                  .from('profiles')
                  .update({ virtual_currency: newBalance })
                  .eq('id', playerData.participant.user_id)
              }

              console.log(`✅ Gave ${playerData.participant.username}: ${closestItem.name} (${closestItem.market_value}) + ${Math.floor(coinsBalance)} coins`)
            }
          } else {
            // Si aucun item trouvé, donner tout en coins
            const { data: profileData } = await supabase
              .from('profiles')
              .select('virtual_currency')
              .eq('id', playerData.participant.user_id)
              .single()

            if (profileData) {
              const newBalance = (profileData.virtual_currency || 0) + Math.floor(sharePerPlayer)
              await supabase
                .from('profiles')
                .update({ virtual_currency: newBalance })
                .eq('id', playerData.participant.user_id)
            }

            console.log(`✅ Gave ${playerData.participant.username}: ${Math.floor(sharePerPlayer)} coins (no item found)`)
          }
        }
      } else {
        console.log('👁️ SPECTATOR: Creator will handle team rewards')
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

      // Marquer la battle comme terminée (pas de winner_id individuel en mode équipe)
      await supabase
        .from('battles')
        .update({ 
          status: 'finished',
          winner_id: null  // Pas de gagnant individuel
        })
        .eq('id', battleId)

    } else {
      // ========== MODE FREE-FOR-ALL (1v1, 1v1v1, 1v1v1v1) ==========
      console.log('🏆 FREE-FOR-ALL MODE: Finding individual winner...')

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

      // ===============================================
      // 🔒 SEUL LE CRÉATEUR AJOUTE LES ITEMS !
      // ===============================================
      if (isCreator) {
        console.log('🏆 CREATOR: Adding items to winner inventory...')
        
        // Ajouter tous les items dans l'inventaire du gagnant (sauf si c'est un bot)
        if (!winner.participant.is_bot && winner.participant.user_id) {
          let successCount = 0
          for (const item of allItems) {
            const { error } = await supabase
              .from('user_inventory')
              .insert({
                user_id: winner.participant.user_id,
                item_id: item.id,
                quantity: 1,
                obtained_from: 'battle',
                obtained_at: new Date().toISOString(),
                is_sold: false
              })
            
            if (!error) {
              successCount++
            } else {
              console.error('Error adding item to inventory:', error)
            }
          }
          
          console.log('✅ Added', successCount, '/', allItems.length, 'items to winner inventory')
        } else {
          console.log('Winner is a bot, items not added to inventory')
        }
      } else {
        console.log('👁️ SPECTATOR: Creator will handle inventory distribution')
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
    }

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

      // ===============================================
      // 🔒 CALCULER LA VRAIE PROCHAINE POSITION !
      // ===============================================
      // Trouver la position maximum existante et ajouter 1
      const existingPositions = battle.participants.map(p => p.position)
      const nextPosition = existingPositions.length > 0 
        ? Math.max(...existingPositions) + 1 
        : 0

      console.log('Adding bot at position:', nextPosition, '(existing positions:', existingPositions, ')')

      const { error } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: battleId,
          user_id: null,
          is_bot: true,
          bot_name: botName,
          position: nextPosition  // ← Position calculée correctement !
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

  // Calculer le gagnant pour l'affichage de fin
  let winner: number | null = null
  let winnerIndex = 0
  let maxValue = 0
  
  if (battle.status === 'finished') {
    battle.participants.forEach((p: BattleParticipant, index: number) => {
      const items = itemsData[index] || []
      const totalValue = items.reduce((sum, item) => sum + item.market_value, 0)
      if (totalValue > maxValue) {
        maxValue = totalValue
        winnerIndex = index
        winner = index
      }
    })
  }

  // Collecter tous les items pour le gagnant
  const allItems = battle.status === 'finished' 
    ? Object.values(itemsData).flat()
    : []

  // Prix par joueur (pas le total)
  const pricePerPlayer = Math.floor(battle.total_prize / 2)

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-[#1a2332] to-gray-900 flex flex-col">
      {/* Header minimaliste - Bouton retour seulement */}
      <div className="flex-shrink-0 px-4 py-1">
        <button
          onClick={() => window.location.href = '/battles'}
          className="p-1.5 hover:bg-[#4578be]/20 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* ÉCRAN EN JEU ET TERMINÉ - MÊME LAYOUT */}
        {(battle.status !== 'finished' || true) && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Zone centrale BOX - CENTRÉE ABSOLUMENT sur la page */}
            <div className="absolute left-1/2 top-2 transform -translate-x-1/2 z-20 flex flex-col items-center">
              {/* Texte BOX X OF Y ou LA BATTLE EST TERMINÉE */}
              {battle.status === 'finished' ? (
                <motion.h2 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white font-black text-3xl tracking-wider"
                >
                  LA BATTLE EST TERMINÉE
                </motion.h2>
              ) : (
                <>
                  <h2 className="text-white font-black text-2xl tracking-wider mb-3">
                    BOX {currentBoxIndex + 1} OF {battle.total_boxes}
                  </h2>
                  
                  {/* Indicateurs de progression - Plus petits */}
                  <div className="flex justify-center gap-1.5 mb-2">
                    {Array.from({ length: battle.total_boxes }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          idx < currentBoxIndex 
                            ? 'bg-emerald-500' 
                            : idx === currentBoxIndex
                            ? 'bg-[#4578be]'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Ancien affichage du prix supprimé - maintenant sous la box */}
                </>
              )}

              {/* Grande BOX au centre - ÉNORMÉMENT PLUS GRANDE */}
              {battle.battle_boxes.length > 0 && (() => {
                let accumulatedBoxes = 0
                let currentBox = battle.battle_boxes[0]
                
                for (const box of battle.battle_boxes) {
                  if (currentBoxIndex >= accumulatedBoxes && currentBoxIndex < accumulatedBoxes + box.quantity) {
                    currentBox = box
                    break
                  }
                  accumulatedBoxes += box.quantity
                }
                
                return (
                  <>
                    <motion.img
                      key={currentBoxIndex}
                      src={currentBox.box_image}
                      alt={currentBox.box_name}
                      className="w-36 h-36 object-contain drop-shadow-[0_0_60px_rgba(69,120,190,0.8)]"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1
                      }}
                      transition={{ 
                        duration: 0.3
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                    />
                    
                    {/* Prix de la box juste en dessous */}
                    {currentBox.price && currentBox.price > 0 && (
                      <motion.div
                        key={`price-${currentBoxIndex}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-[#4578be]/20 border border-[#4578be]/40 flex items-center gap-2"
                      >
                        <img 
                          src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png"
                          alt="Coins"
                          className="w-4 h-4"
                        />
                        <span className="text-[#4578be] font-black text-sm">
                          {Math.floor(currentBox.price)}
                        </span>
                      </motion.div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Battle Classic - Gauche, aligné avec BOX */}
            <div className="absolute left-4 top-2 z-20">
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#4578be]" />
                {battle.name}
              </h1>
            </div>

            {/* Battle Value - Droite, aligné avec BOX, 1 ligne */}
            <div className="absolute right-4 top-2 z-20">
              <div className="px-3 py-1 rounded-lg bg-[#4578be]/20 border border-[#4578be]/40 flex items-center gap-2">
                <span className="text-gray-400 text-xs">Battle Value</span>
                <img 
                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png"
                  alt="Coins"
                  className="w-4 h-4"
                />
                <span className="text-[#4578be] font-black text-sm">
                  {Math.floor(battle.total_prize / battle.max_players)}
                </span>
              </div>
            </div>

            {/* Ligne verticale au centre - seulement en 1v1 et modes équipe */}
            {(battle.max_players === 2 || isTeamMode(battle.mode)) && (
              <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gray-700/50 to-transparent z-10" />
            )}

            {/* Zone des joueurs avec roulettes - GRID DYNAMIQUE */}
            <div className="flex-1 overflow-hidden pt-24">
              {isTeamMode(battle.mode) ? (
                // ========== MODE ÉQUIPE (2v2, 3v3) ==========
                <div className="h-full grid grid-cols-2 gap-2">
                  {/* TEAM A (gauche) */}
                  <div className="flex flex-col gap-2 px-2 pb-4">
                    <div className="text-center mb-2">
                      <h3 className="text-[#4578be] font-black text-lg">TEAM A</h3>
                    </div>
                    {battle.participants
                      .filter(p => p.team === 0 || p.team === null)
                      .map((participant, teamIndex) => {
                        const globalIndex = battle.participants.findIndex(p => p.id === participant.id)
                        return (
                          <div key={participant.id || globalIndex} className="flex-1 flex flex-col">
                            <PlayerProfileCard
                              participant={participant}
                              totalValue={itemsData[globalIndex]?.reduce((sum, item) => sum + item.market_value, 0) || 0}
                              side="left"
                              canJoin={false}
                              onJoin={handleJoinBattle}
                              canAddBot={false}
                              onAddBot={handleAddBot}
                              price={Math.floor(battle.total_prize / battle.max_players)}
                              team={participant.team}
                            />
                            <div className="mt-1">
                              <SingleRoulette
                                offset={rouletteOffsets[globalIndex] || 0}
                                isAnimating={isOpening}
                                winningItem={winningItems[globalIndex]}
                                battleBoxes={battle.battle_boxes}
                                currentBoxIndex={currentBoxIndex}
                                battleStatus={battle.status}
                                countdown={countdown}
                              />
                            </div>
                            <div className="flex-shrink-0 mt-1">
                              <p className="text-gray-400 text-xs font-semibold mb-2">Items gagnés</p>
                              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
                                {(itemsData[globalIndex] || []).map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex-shrink-0 w-14 h-14 bg-gray-800/60 rounded-lg p-1.5 border border-gray-700/50"
                                  >
                                    <img 
                                      src={item.item_image} 
                                      className="w-full h-full object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                                    />
                                  </motion.div>
                                ))}
                                {(itemsData[globalIndex] || []).length === 0 && (
                                  <span className="text-gray-500 text-sm">Aucun item</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* TEAM B (droite) */}
                  <div className="flex flex-col gap-2 px-2 pb-4">
                    <div className="text-center mb-2">
                      <h3 className="text-emerald-500 font-black text-lg">TEAM B</h3>
                    </div>
                    {battle.participants
                      .filter(p => p.team === 1)
                      .map((participant, teamIndex) => {
                        const globalIndex = battle.participants.findIndex(p => p.id === participant.id)
                        return (
                          <div key={participant.id || globalIndex} className="flex-1 flex flex-col">
                            <PlayerProfileCard
                              participant={participant}
                              totalValue={itemsData[globalIndex]?.reduce((sum, item) => sum + item.market_value, 0) || 0}
                              side="right"
                              canJoin={false}
                              onJoin={handleJoinBattle}
                              canAddBot={false}
                              onAddBot={handleAddBot}
                              price={Math.floor(battle.total_prize / battle.max_players)}
                              team={participant.team}
                            />
                            <div className="mt-1">
                              <SingleRoulette
                                offset={rouletteOffsets[globalIndex] || 0}
                                isAnimating={isOpening}
                                winningItem={winningItems[globalIndex]}
                                battleBoxes={battle.battle_boxes}
                                currentBoxIndex={currentBoxIndex}
                                battleStatus={battle.status}
                                countdown={countdown}
                              />
                            </div>
                            <div className="flex-shrink-0 mt-1">
                              <p className="text-gray-400 text-xs font-semibold mb-2 text-right">Items gagnés</p>
                              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 justify-end">
                                {(itemsData[globalIndex] || []).map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex-shrink-0 w-14 h-14 bg-gray-800/60 rounded-lg p-1.5 border border-gray-700/50"
                                  >
                                    <img 
                                      src={item.item_image} 
                                      className="w-full h-full object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                                    />
                                  </motion.div>
                                ))}
                                {(itemsData[globalIndex] || []).length === 0 && (
                                  <span className="text-gray-500 text-sm">Aucun item</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ) : (
                // ========== MODE FREE-FOR-ALL (1v1, 1v1v1, 1v1v1v1) ==========
                <div className={`h-full grid ${getGridColumns(battle.max_players, battle.mode)} gap-2`}>
                  {/* Boucle sur TOUS les slots (participants + slots vides) */}
                  {Array.from({ length: battle.max_players }).map((_, slotIndex) => {
                    const participant = battle.participants[slotIndex]
                    const isEmptySlot = !participant
                    
                    return (
                      <div key={slotIndex} className="flex flex-col h-full px-2 pb-4 relative">
                        {/* Contours désactivés pour test 
                        {battle.status === 'finished' && participant && slotIndex === winnerIndex && (
                          <motion.div
                            animate={{
                              boxShadow: [
                                '0 0 20px rgba(16,185,129,0.3)',
                                '0 0 40px rgba(16,185,129,0.6)',
                                '0 0 20px rgba(16,185,129,0.3)'
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-xl border-2 border-emerald-500 pointer-events-none z-10"
                          />
                        )}
                        {battle.status === 'finished' && participant && slotIndex !== winnerIndex && (
                          <div className="absolute inset-0 rounded-xl border-2 border-red-500/50 pointer-events-none z-10" />
                        )}
                        */}

                        {/* Conteneur Profil avec bannière + BADGE */}
                        <div className="relative">
                          <PlayerProfileCard
                            participant={participant || null}
                            totalValue={participant ? (itemsData[slotIndex]?.reduce((sum, item) => sum + item.market_value, 0) || 0) : 0}
                            side={
                              battle.max_players === 2 
                                ? (slotIndex === 0 ? 'left' : 'right')  // 1v1: gauche/droite
                                : battle.max_players === 3
                                ? (slotIndex === 0 ? 'left' : 'right')  // 1v1v1: 1er gauche, 2 autres droite
                                : (slotIndex < 2 ? 'left' : 'right')     // 1v1v1v1: 2 gauche, 2 droite
                            }
                            canJoin={isEmptySlot && canJoin && battle.status !== 'finished'}
                            onJoin={handleJoinBattle}
                            canAddBot={isEmptySlot && isCreator && battle.status === 'waiting'}
                            onAddBot={handleAddBot}
                            price={Math.floor(battle.total_prize / battle.max_players)}
                            team={participant?.team}
                            isWinner={battle.status === 'finished' && participant ? (slotIndex === winnerIndex) : null}
                            totalGains={battle.status === 'finished' && slotIndex === winnerIndex ? allItems.reduce((sum, item) => sum + item.market_value, 0) : null}
                          />
                          
                        </div>

                        {/* Roulette - CACHÉE quand battle terminée */}
                        {participant && battle.status !== 'finished' && (
                          <div className="mt-1 relative">
                            {/* Épée de séparation - mieux centrée + opacité réduite pendant battle */}
                            {slotIndex > 0 && (
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 z-30 transition-opacity duration-300" 
                                style={{ 
                                  left: 'calc(-0.5rem - 24px)',
                                  opacity: battle.status === 'waiting' ? 1 : 0.6
                                }}
                              >
                                <Swords className="w-12 h-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                              </div>
                            )}
                            
                            <SingleRoulette
                              offset={rouletteOffsets[slotIndex] || 0}
                              isAnimating={isOpening}
                              winningItem={winningItems[slotIndex]}
                              battleBoxes={battle.battle_boxes}
                              currentBoxIndex={currentBoxIndex}
                              battleStatus={battle.status}
                              countdown={countdown}
                            />
                          </div>
                        )}

                        {/* Items gagnés - AGRANDI quand battle terminée */}
                        {participant && (
                          <div className={`flex-shrink-0 mt-1 ${battle.status === 'finished' ? 'flex-1' : ''} relative overflow-hidden`}>
                            
                            {/* Effets visuels pour GAGNANT */}
                            {battle.status === 'finished' && slotIndex === winnerIndex && (
                              <>
                                {/* Dégradé de fond vert brillant */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent rounded-lg" />
                                
                                {/* Bordure animée qui pulse */}
                                <motion.div
                                  animate={{
                                    opacity: [0.3, 0.6, 0.3]
                                  }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute inset-0 border-2 border-emerald-400/40 rounded-lg"
                                />

                                {/* Particules/étoiles animées */}
                                {[...Array(8)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ 
                                      x: Math.random() * 100 - 50,
                                      y: Math.random() * 100 - 50,
                                      opacity: 0,
                                      scale: 0
                                    }}
                                    animate={{
                                      y: [Math.random() * 100 - 50, -100],
                                      opacity: [0, 1, 0],
                                      scale: [0, 1, 0]
                                    }}
                                    transition={{
                                      duration: 3,
                                      delay: i * 0.3,
                                      repeat: Infinity
                                    }}
                                    className="absolute"
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`
                                    }}
                                  >
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                  </motion.div>
                                ))}
                              </>
                            )}

                            {/* Effets visuels pour PERDANT */}
                            {battle.status === 'finished' && slotIndex !== winnerIndex && (
                              <>
                                {/* Dégradé de fond sombre/rouge */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900/30 to-transparent rounded-lg" />
                                
                                {/* Vignette assombrie */}
                                <div className="absolute inset-0 bg-black/20 rounded-lg" />

                                {/* Particules rouges qui DESCENDENT */}
                                {[...Array(8)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ 
                                      x: Math.random() * 100 - 50,
                                      y: Math.random() * 100 - 50,
                                      opacity: 0,
                                      scale: 0
                                    }}
                                    animate={{
                                      y: [Math.random() * 100 - 50, 100],  // Descend vers le bas !
                                      opacity: [0, 0.8, 0],
                                      scale: [0, 1, 0]
                                    }}
                                    transition={{
                                      duration: 3,
                                      delay: i * 0.3,
                                      repeat: Infinity
                                    }}
                                    className="absolute"
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`
                                    }}
                                  >
                                    <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                  </motion.div>
                                ))}
                              </>
                            )}

                            {/* Label "Items reçus" UNIQUEMENT pour le gagnant */}
                            {battle.status === 'finished' && itemsTransferred && slotIndex === winnerIndex && (
                              <p className="text-gray-400 text-base font-bold mb-4 pt-4 text-center relative z-10">
                                Items reçus
                              </p>
                            )}

                            {/* Label "Items gagnés" pendant la battle */}
                            {battle.status !== 'finished' && (
                              <p className="text-gray-400 text-xs font-semibold mb-2 relative z-10">
                                Items gagnés
                              </p>
                            )}
                            
                            {/* Texte en arrière-plan GAGNANT/PERDANT */}
                            {battle.status === 'finished' && (
                              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                <span 
                                  className={`font-extrabold tracking-wider transform rotate-[-20deg] select-none ${
                                    slotIndex === winnerIndex 
                                      ? 'text-emerald-500/15' 
                                      : 'text-red-500/15'
                                  } ${
                                    battle.max_players === 2 
                                      ? 'text-[10rem]' 
                                      : battle.max_players === 3 
                                        ? 'text-[7rem]' 
                                        : 'text-[5.5rem]'
                                  }`}
                                  style={{
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    letterSpacing: '0.1em',
                                    textShadow: slotIndex === winnerIndex 
                                      ? '0 0 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.3)'
                                      : '0 0 40px rgba(239, 68, 68, 0.5), 0 0 80px rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  {slotIndex === winnerIndex ? 'GAGNANT' : 'PERDANT'}
                                </span>
                              </div>
                            )}
                            
                            <div className={`relative z-10 ${
                              battle.status === 'finished' 
                                ? 'grid grid-cols-5 gap-2 overflow-auto' 
                                : 'flex items-center gap-2 overflow-x-auto py-1 px-1'
                            }`}>
                              
                              {/* PENDANT LA BATTLE - afficher les items normalement */}
                              {battle.status !== 'finished' && (itemsData[slotIndex] || []).map((item, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex-shrink-0 w-14 h-14 bg-gray-800/60 rounded-lg p-1.5 border border-gray-700/50"
                                >
                                  <img 
                                    src={item.item_image} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                                  />
                                </motion.div>
                              ))}

                              {/* BATTLE TERMINÉE - PERDANTS - Animation de disparition */}
                              {battle.status === 'finished' && slotIndex !== winnerIndex && !itemsTransferred && (itemsData[slotIndex] || []).map((item, idx) => (
                                <motion.div
                                  key={`disappear-${idx}`}
                                  initial={{ scale: 1, opacity: 1 }}
                                  animate={{ 
                                    scale: 0,
                                    opacity: 0
                                  }}
                                  transition={{ duration: 0.6, delay: idx * 0.03 }}
                                  className="bg-gray-800/60 rounded-lg p-1.5 border border-gray-700/50 aspect-square"
                                >
                                  <img src={item.item_image} className="w-full h-full object-contain" />
                                </motion.div>
                              ))}

                              {/* BATTLE TERMINÉE - GAGNANT - Items apparaissent */}
                              {battle.status === 'finished' && slotIndex === winnerIndex && itemsTransferred && allItems.map((item, idx) => (
                                <motion.div
                                  key={`winner-${idx}`}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.4, delay: idx * 0.02 }}
                                  className="bg-gray-800/60 rounded-lg p-1.5 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] aspect-square"
                                >
                                  <img 
                                    src={item.item_image} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                                  />
                                </motion.div>
                              ))}

                              {/* Perdants après animation - SEULEMENT "Aucun item" */}
                              {battle.status === 'finished' && itemsTransferred && slotIndex !== winnerIndex && (
                                <div className="col-span-5 text-center text-gray-600 text-sm py-8">
                                  Aucun item
                                </div>
                              )}
                              
                              {/* Message "Aucun item" pendant la battle si pas d'items */}
                              {battle.status !== 'finished' && (itemsData[slotIndex] || []).length === 0 && (
                                <span className="text-gray-500 text-sm">Aucun item</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions en bas */}
      {battle.status === 'waiting' && isCreator && battle.participants.length === battle.max_players && (
        <div className="flex-shrink-0 p-4">
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
  const [userPins, setUserPins] = useState<Array<{id: string, svg_code: string}>>([])
  const [avatarFrame, setAvatarFrame] = useState<string | null>(null)
  const [bannerSvg, setBannerSvg] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<number>(1)

  // Charger les données du joueur (pins, frame, bannière, niveau)
  useEffect(() => {
    if (participant.is_bot || !participant.user_id) return

    const loadUserData = async () => {
      // Charger le niveau
      const { data: profileData } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', participant.user_id)
        .single()
      
      if (profileData) setUserLevel(profileData.level || 1)

      // Charger les pins équipés
      const { data: pinsData } = await supabase
        .from('user_pins')
        .select(`pin_id, shop_pins (id, svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .limit(4)
      
      if (pinsData) {
        const pins = pinsData
          .filter((item): item is typeof item & { shop_pins: { id: any; svg_code: any } } =>
            item.shop_pins !== null && !Array.isArray(item.shop_pins)
          )
          .map(item => ({ id: item.shop_pins.id, svg_code: item.shop_pins.svg_code }))
        setUserPins(pins)
      }

      // Charger le cadre équipé
      const { data: frameData } = await supabase
        .from('user_frames')
        .select(`frame_id, shop_frames (svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .single()
      
      if (frameData) {
        const shopFrames = frameData.shop_frames as any
        if (shopFrames?.svg_code) setAvatarFrame(shopFrames.svg_code)
      }

      // Charger la bannière équipée
      const { data: bannerData } = await supabase
        .from('user_banners')
        .select(`banner_id, shop_banners (svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .single()
      
      if (bannerData) {
        const shopBanners = bannerData.shop_banners as any
        if (shopBanners?.svg_code) setBannerSvg(shopBanners.svg_code)
      }
    }

    loadUserData()
  }, [participant.user_id, participant.is_bot])

  const isLoser = !isWinner && participant.total_value >= 0
  
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border overflow-hidden relative ${
        isWinner 
          ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
          : isLoser
          ? 'border-red-500/50'
          : 'border-[#4578be]/30'
      }`}
      style={{ height: '80px' }}
    >
      {/* Bannière en fond à 50% */}
      {bannerSvg && (
        <div 
          className="absolute inset-0 opacity-50"
          dangerouslySetInnerHTML={{ __html: bannerSvg }}
        />
      )}
      
      {/* Fond par défaut */}
      <div className={`absolute inset-0 ${
        isWinner 
          ? 'bg-gradient-to-r from-emerald-900/60 to-emerald-800/40' 
          : isLoser
          ? 'bg-gradient-to-r from-red-900/40 to-red-800/20'
          : 'bg-gradient-to-r from-[#1a2332] to-[#0a0e1a]'
      }`} />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* Contenu horizontal */}
      <div className="relative h-full px-4 flex items-center gap-3">
        
        {/* Avatar avec cadre */}
        <div className="relative flex-shrink-0" style={{ width: '56px', height: '56px' }}>
          <div className={`w-14 h-14 rounded-xl overflow-hidden ${
            avatarFrame ? '' : isWinner ? 'border-2 border-emerald-500' : isLoser ? 'border-2 border-red-500/50' : 'border-2 border-[#4578be]'
          }`}>
            {participant.is_bot ? (
              <div className={`w-full h-full flex items-center justify-center ${
                isWinner ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' 
                : isLoser ? 'bg-gradient-to-br from-red-600/70 to-red-800/70'
                : 'bg-[#4578be]'
              }`}>
                <Bot className="w-7 h-7 text-white" />
              </div>
            ) : (
              <img
                src={participant.avatar_url || '/default-avatar.png'}
                alt={participant.username || 'Player'}
                className={`w-full h-full object-cover ${isLoser ? 'opacity-70' : ''}`}
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png' }}
              />
            )}
          </div>
          
          {/* Cadre SVG par-dessus */}
          {avatarFrame && (
            <div 
              className="absolute pointer-events-none"
              style={{ top: '-3px', left: '-3px', width: '62px', height: '62px' }}
              dangerouslySetInnerHTML={{ __html: avatarFrame }}
            />
          )}
        </div>

        {/* Niveau */}
        <div className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${
          isWinner ? 'bg-emerald-500/30 text-emerald-300' 
          : isLoser ? 'bg-red-500/20 text-red-300'
          : 'bg-[#4578be]/30 text-[#4578be]'
        }`}>
          {participant.is_bot ? 'BOT' : `Nv.${userLevel}`}
        </div>

        {/* Pseudo */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm truncate ${
            isWinner ? 'text-emerald-400' : isLoser ? 'text-red-400/80' : 'text-white'
          }`}>
            {participant.username || participant.bot_name || 'Unknown'}
          </h3>
          <div className="flex items-center gap-1">
            <Coins className={`w-3 h-3 ${isWinner ? 'text-emerald-400' : 'text-yellow-500'}`} />
            <span className={`text-xs font-semibold ${
              isWinner ? 'text-emerald-400' : isLoser ? 'text-red-400/70' : 'text-gray-400'
            }`}>
              {Math.floor(participant.total_value)} coins
            </span>
          </div>
        </div>

        {/* 4 Pins */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {!participant.is_bot && userPins.slice(0, 4).map((pin) => (
            <div 
              key={pin.id}
              className="h-8 w-8 rounded-md bg-black/40 border border-gray-600/30 flex items-center justify-center p-0.5"
              dangerouslySetInnerHTML={{ __html: pin.svg_code }}
            />
          ))}
          {!participant.is_bot && Array.from({ length: Math.max(0, 4 - userPins.length) }).map((_, i) => (
            <div 
              key={`empty-${i}`}
              className="h-8 w-8 rounded-md bg-black/40 border border-gray-600/30 flex items-center justify-center"
            >
              <span className="text-xs opacity-30">?</span>
            </div>
          ))}
        </div>

        {/* Badge Winner/Loser */}
        {isWinner && (
          <div className="flex-shrink-0 px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs font-bold">
            🏆
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Composant BattleFinishedScreen - Écran de fin de battle avec tous les items chez le gagnant
// ===============================================
// NOUVEAU BATTLE FINISHED SCREEN AVEC ANIMATIONS
// ===============================================

function BattleFinishedScreen({
  battle,
  itemsData
}: {
  battle: any
  itemsData: {[key: number]: BattleItem[]}
}) {
  const [itemsAnimating, setItemsAnimating] = useState(true)
  const [itemsTransferred, setItemsTransferred] = useState(false)

  // Calculer le gagnant
  const participantValues = battle.participants.map((p: any, index: number) => {
    const items = itemsData[index] || []
    const totalValue = items.reduce((sum: number, item: BattleItem) => sum + item.market_value, 0)
    return { participant: p, totalValue, items, index }
  })

  // Trouver le gagnant (plus grande valeur)
  let winner = participantValues[0]
  for (const pv of participantValues) {
    if (pv.totalValue > winner.totalValue) {
      winner = pv
    }
  }

  // Collecter tous les items
  const allItems = participantValues.flatMap((pv: any) => pv.items)

  // Lancer l'animation de transfert après 1 seconde
  useEffect(() => {
    const timer = setTimeout(() => {
      setItemsAnimating(false)
      setTimeout(() => setItemsTransferred(true), 1500) // Temps de l'animation
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-900 via-[#1a2332] to-gray-900"
    >
      {/* Header */}
      <div className="flex-shrink-0 py-6 text-center">
        <motion.h1 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-white tracking-wide"
        >
          LA BATTLE EST TERMINÉE
        </motion.h1>
      </div>

      {/* Grille des joueurs */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className={`grid ${
          battle.participants.length === 2 ? 'grid-cols-2' : 
          battle.participants.length === 3 ? 'grid-cols-3' :
          battle.participants.length === 4 ? 'grid-cols-4' : 'grid-cols-2'
        } gap-6 max-w-7xl mx-auto`}>
          
          {participantValues.map((pv: any) => {
            const isWinner = pv.index === winner.index
            const [bannerSvg, setBannerSvg] = useState<string | null>(null)
            const [frameSvg, setFrameSvg] = useState<string | null>(null)

            useEffect(() => {
              if (!pv.participant.is_bot && pv.participant.user_id) {
                // Charger bannière
                supabase
                  .from('user_banners')
                  .select(`banner_id, shop_banners (svg_code)`)
                  .eq('user_id', pv.participant.user_id)
                  .eq('is_equipped', true)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      const shopBanners = data.shop_banners as any
                      if (shopBanners?.svg_code) setBannerSvg(shopBanners.svg_code)
                    }
                  })

                // Charger frame
                supabase
                  .from('user_frames')
                  .select(`frame_id, shop_frames (svg_code)`)
                  .eq('user_id', pv.participant.user_id)
                  .eq('is_equipped', true)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      const shopFrames = data.shop_frames as any
                      if (shopFrames?.svg_code) setFrameSvg(shopFrames.svg_code)
                    }
                  })
              }
            }, [])

            return (
              <motion.div
                key={pv.index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + pv.index * 0.1 }}
                className={`relative rounded-2xl overflow-hidden ${
                  isWinner 
                    ? 'border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]' 
                    : 'border-2 border-red-500/50'
                }`}
              >
                {/* Bannière de fond */}
                {bannerSvg ? (
                  <div 
                    className="absolute inset-0 opacity-30"
                    dangerouslySetInnerHTML={{ __html: bannerSvg }}
                  />
                ) : (
                  <div className={`absolute inset-0 ${
                    isWinner 
                      ? 'bg-gradient-to-br from-emerald-600/30 to-emerald-900/30' 
                      : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50'
                  }`} />
                )}

                {/* Badge GAGNANT */}
                {isWinner && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20"
                  >
                    <div className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-lg">
                      <span className="text-white font-black text-lg tracking-wide">🏆 GAGNANT</span>
                    </div>
                  </motion.div>
                )}

                {/* Contenu */}
                <div className="relative z-10 p-6 flex flex-col items-center min-h-[400px]">
                  {/* Avatar avec frame */}
                  <div className="relative mt-8">
                    <motion.div 
                      className={`rounded-full overflow-hidden ${
                        isWinner ? 'w-24 h-24' : 'w-20 h-20'
                      }`}
                      animate={isWinner ? { 
                        boxShadow: [
                          '0 0 20px rgba(16,185,129,0.5)',
                          '0 0 40px rgba(16,185,129,0.8)',
                          '0 0 20px rgba(16,185,129,0.5)'
                        ]
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {pv.participant.is_bot ? (
                        <div className="w-full h-full bg-[#4578be] flex items-center justify-center">
                          <Bot className="w-10 h-10 text-white" />
                        </div>
                      ) : (
                        <img
                          src={pv.participant.avatar_url || '/default-avatar.png'}
                          alt={pv.participant.username || 'Player'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </motion.div>
                    {frameSvg && (
                      <div 
                        className="absolute inset-0 pointer-events-none scale-125"
                        dangerouslySetInnerHTML={{ __html: frameSvg }}
                      />
                    )}
                  </div>

                  {/* Nom */}
                  <h3 className={`font-bold text-xl mt-4 ${
                    isWinner ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {pv.participant.username || pv.participant.bot_name || 'Unknown'}
                  </h3>

                  {/* Valeur totale */}
                  <div className="flex items-center gap-2 mt-2">
                    <img 
                      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" 
                      className="w-5 h-5" 
                    />
                    <span className={`text-2xl font-black ${
                      isWinner ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {pv.totalValue.toFixed(2)}
                    </span>
                  </div>

                  {/* Items gagnés */}
                  <div className="mt-6 w-full">
                    <p className="text-gray-400 text-sm font-semibold mb-3 text-center">
                      Items {itemsTransferred && isWinner ? 'reçus' : 'gagnés'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Afficher les items AVANT transfert */}
                      {itemsAnimating && pv.items.map((item: BattleItem, idx: number) => (
                        <motion.div
                          key={`before-${idx}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/50"
                        >
                          <img 
                            src={item.item_image} 
                            className="w-full h-16 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                          />
                        </motion.div>
                      ))}

                      {/* Animation de transfert - items volent vers le gagnant */}
                      {!itemsAnimating && !isWinner && pv.items.map((item: BattleItem, idx: number) => (
                        <motion.div
                          key={`transfer-${idx}`}
                          initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                          animate={{ 
                            scale: 0.3,
                            opacity: 0,
                            x: (winner.index - pv.index) * 300, // Vers le gagnant
                            y: -100
                          }}
                          transition={{ duration: 1.5, delay: idx * 0.05 }}
                          className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/50"
                        >
                          <img 
                            src={item.item_image} 
                            className="w-full h-16 object-contain"
                          />
                        </motion.div>
                      ))}

                      {/* Afficher TOUS les items chez le gagnant après transfert */}
                      {itemsTransferred && isWinner && allItems.map((item: BattleItem, idx: number) => (
                        <motion.div
                          key={`winner-${idx}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-gray-800/60 rounded-lg p-2 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        >
                          <img 
                            src={item.item_image} 
                            className="w-full h-16 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                          />
                        </motion.div>
                      ))}

                      {/* Items vides pour les perdants après transfert */}
                      {itemsTransferred && !isWinner && (
                        <div className="col-span-3 text-center text-gray-600 text-sm py-4">
                          Aucun item
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bouton retour */}
      <div className="flex-shrink-0 p-6 flex justify-center gap-4">
        <button
          onClick={() => window.location.href = '/battles'}
          className="px-8 py-3 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white font-bold rounded-xl hover:scale-105 transition shadow-lg"
        >
          Retour aux Battles
        </button>
      </div>
    </motion.div>
  )
}

// Composant FinishedResultCard - Affichage des résultats de fin de battle
function FinishedResultCard({
  participant,
  items,
  isWinner
}: {
  participant: BattleParticipant
  items: BattleItem[]
  isWinner: boolean
}) {
  const [userPins, setUserPins] = useState<Array<{id: string, svg_code: string}>>([])
  const [avatarFrame, setAvatarFrame] = useState<string | null>(null)
  const [bannerSvg, setBannerSvg] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<number>(1)

  const totalValue = items.reduce((sum, item) => sum + item.market_value, 0)

  // Charger les données du joueur
  useEffect(() => {
    if (participant.is_bot || !participant.user_id) return

    const loadUserData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', participant.user_id)
        .single()
      
      if (profileData) setUserLevel(profileData.level || 1)

      const { data: pinsData } = await supabase
        .from('user_pins')
        .select(`pin_id, shop_pins (id, svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .limit(4)
      
      if (pinsData) {
        const pins = pinsData
          .filter((item): item is typeof item & { shop_pins: { id: any; svg_code: any } } =>
            item.shop_pins !== null && !Array.isArray(item.shop_pins)
          )
          .map(item => ({ id: item.shop_pins.id, svg_code: item.shop_pins.svg_code }))
        setUserPins(pins)
      }

      const { data: frameData } = await supabase
        .from('user_frames')
        .select(`frame_id, shop_frames (svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .single()
      
      if (frameData) {
        const shopFrames = frameData.shop_frames as any
        if (shopFrames?.svg_code) setAvatarFrame(shopFrames.svg_code)
      }

      const { data: bannerData } = await supabase
        .from('user_banners')
        .select(`banner_id, shop_banners (svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .single()
      
      if (bannerData) {
        const shopBanners = bannerData.shop_banners as any
        if (shopBanners?.svg_code) setBannerSvg(shopBanners.svg_code)
      }
    }

    loadUserData()
  }, [participant.user_id, participant.is_bot])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex-1 mt-4 rounded-2xl border overflow-hidden relative ${
        isWinner 
          ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]' 
          : 'border-red-500/30'
      }`}
    >
      {/* Bannière en fond */}
      {bannerSvg && (
        <div 
          className="absolute inset-0 opacity-40"
          dangerouslySetInnerHTML={{ __html: bannerSvg }}
        />
      )}
      
      {/* Fond dégradé */}
      <div className={`absolute inset-0 ${
        isWinner 
          ? 'bg-gradient-to-br from-emerald-900/50 via-[#1a2332]/80 to-[#0d1219]' 
          : 'bg-gradient-to-br from-red-900/30 via-[#1a2332]/80 to-[#0d1219]'
      }`} />

      <div className="relative h-full p-4 flex flex-col">
        {/* Header avec Avatar + Infos */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-4"
        >
          {/* Avatar avec cadre */}
          <div className="relative flex-shrink-0">
            <motion.div 
              className={`rounded-xl overflow-hidden ${
                isWinner 
                  ? 'w-20 h-20 border-3 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]' 
                  : 'w-14 h-14 border-2 border-red-500/50'
              } ${avatarFrame ? '' : ''}`}
              animate={isWinner ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {participant.is_bot ? (
                <div className={`w-full h-full flex items-center justify-center ${
                  isWinner ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' 
                  : 'bg-gradient-to-br from-red-600/70 to-red-800/70'
                }`}>
                  <Bot className={`text-white ${isWinner ? 'w-10 h-10' : 'w-7 h-7'}`} />
                </div>
              ) : (
                <img
                  src={participant.avatar_url || '/default-avatar.png'}
                  alt={participant.username || 'Player'}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png' }}
                />
              )}
            </motion.div>
            
            {/* Cadre SVG par-dessus */}
            {avatarFrame && (
              <div 
                className="absolute pointer-events-none"
                style={{ 
                  top: '-4px', 
                  left: '-4px', 
                  width: isWinner ? '88px' : '62px', 
                  height: isWinner ? '88px' : '62px' 
                }}
                dangerouslySetInnerHTML={{ __html: avatarFrame }}
              />
            )}
            
            {/* Badge Winner */}
            {isWinner && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1.5 shadow-lg"
              >
                <span className="text-sm">🏆</span>
              </motion.div>
            )}
          </div>

          {/* Infos joueur */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                isWinner ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {participant.is_bot ? 'BOT' : `Nv.${userLevel}`}
              </span>
              {isWinner && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/30 text-yellow-300">
                  GAGNANT
                </span>
              )}
            </div>
            <h3 className={`font-bold ${isWinner ? 'text-lg text-emerald-400' : 'text-sm text-red-400/80'}`}>
              {participant.username || participant.bot_name}
            </h3>
            <div className="flex items-center gap-1">
              <Coins className={`${isWinner ? 'w-4 h-4 text-emerald-400' : 'w-3 h-3 text-yellow-500'}`} />
              <span className={`font-bold ${isWinner ? 'text-emerald-400' : 'text-sm text-red-400/70'}`}>
                {Math.floor(totalValue)} coins
              </span>
            </div>
          </div>

          {/* Pins */}
          {!participant.is_bot && (
            <div className="flex-shrink-0 flex items-center gap-1">
              {userPins.slice(0, 4).map((pin) => (
                <motion.div 
                  key={pin.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`rounded-md bg-black/40 border border-gray-600/30 flex items-center justify-center p-0.5 ${
                    isWinner ? 'h-10 w-10' : 'h-7 w-7'
                  }`}
                  dangerouslySetInnerHTML={{ __html: pin.svg_code }}
                />
              ))}
              {Array.from({ length: Math.max(0, 4 - userPins.length) }).map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className={`rounded-md bg-black/40 border border-gray-600/30 flex items-center justify-center ${
                    isWinner ? 'h-10 w-10' : 'h-7 w-7'
                  }`}
                >
                  <span className="text-xs opacity-30">?</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Liste des items gagnés - Grille */}
        <div className="flex-1 overflow-y-auto">
          <p className={`font-semibold mb-2 ${isWinner ? 'text-sm text-gray-300' : 'text-xs text-gray-500'}`}>
            Items obtenus ({items.length})
          </p>
          <div className={`grid grid-cols-6 gap-2 ${isWinner ? '' : 'opacity-70'}`}>
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx }}
                className={`rounded-lg flex flex-col items-center ${
                  isWinner 
                    ? 'p-2 bg-gradient-to-b from-emerald-500/15 via-[#4578be]/10 to-[#1a2332] border border-emerald-500/20' 
                    : 'p-1.5 bg-gradient-to-b from-red-500/10 via-[#4578be]/5 to-[#1a2332] border border-red-500/10'
                }`}
              >
                <img
                  src={item.item_image}
                  alt={item.item_name}
                  className={`object-contain mb-1 ${isWinner ? 'w-14 h-14' : 'w-10 h-10'}`}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                />
                <p className={`font-bold text-center ${isWinner ? 'text-yellow-500 text-xs' : 'text-yellow-500/70 text-[10px]'}`}>
                  {Math.floor(item.market_value)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Composant AnimatedCoins - Compteur animé de coins
function AnimatedCoins({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = value
    const duration = 500 // ms
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function pour un effet plus fluide
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (endValue - startValue) * easeOut
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = endValue
      }
    }

    if (endValue !== startValue) {
      requestAnimationFrame(animate)
    }
  }, [value])

  return (
    <div className="flex items-center gap-1.5">
      <img 
        src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png"
        alt="Coins"
        className="w-5 h-5"
      />
      <span className="text-[#4578be] font-black text-xl">
        {displayValue.toFixed(2)}
      </span>
    </div>
  )
}

// Composant PlayerProfileCard - Carte profil avec bannière et niveau
function PlayerProfileCard({
  participant,
  totalValue,
  side,
  canJoin,
  onJoin,
  canAddBot,
  onAddBot,
  price,
  team,
  isWinner,
  totalGains
}: {
  participant: BattleParticipant | null | undefined
  totalValue: number
  side: 'left' | 'right'
  canJoin?: boolean
  onJoin?: () => void
  canAddBot?: boolean
  onAddBot?: () => void
  price: number
  team?: number
  isWinner?: boolean | null
  totalGains?: number | null
}) {
  const [bannerSvg, setBannerSvg] = useState<string | null>(null)
  const [frameSvg, setFrameSvg] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<number>(1)
  const [animatedValue, setAnimatedValue] = useState<number>(0)

  // Animation du compteur qui monte
  useEffect(() => {
    const duration = 800 // Durée de l'animation en ms
    const steps = 30 // Nombre d'étapes
    const increment = (totalValue - animatedValue) / steps
    
    if (Math.abs(totalValue - animatedValue) < 0.01) {
      setAnimatedValue(totalValue)
      return
    }

    const timer = setInterval(() => {
      setAnimatedValue(prev => {
        const next = prev + increment
        if (increment > 0 && next >= totalValue) return totalValue
        if (increment < 0 && next <= totalValue) return totalValue
        return next
      })
    }, duration / steps)

    return () => clearInterval(timer)
  }, [totalValue, animatedValue])

  useEffect(() => {
    if (!participant || participant.is_bot || !participant.user_id) return

    const loadUserData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', participant.user_id)
        .single()
      
      if (profileData) setUserLevel(profileData.level || 1)

      const { data: bannerData } = await supabase
        .from('user_banners')
        .select(`banner_id, shop_banners (svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .single()
      
      if (bannerData) {
        const shopBanners = bannerData.shop_banners as any
        if (shopBanners?.svg_code) setBannerSvg(shopBanners.svg_code)
      }

      const { data: frameData } = await supabase
        .from('user_frames')
        .select(`frame_id, shop_frames (svg_code)`)
        .eq('user_id', participant.user_id)
        .eq('is_equipped', true)
        .single()
      
      if (frameData) {
        const shopFrames = frameData.shop_frames as any
        if (shopFrames?.svg_code) setFrameSvg(shopFrames.svg_code)
      }
    }

    loadUserData()
  }, [participant])

  // Affichage pour slot vide
  if (!participant) {
    return (
      <div className="flex-shrink-0 rounded-xl overflow-hidden relative bg-gray-800/30 border border-dashed border-gray-600">
        {/* Fond dégradé comme la bannière */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4578be]/20 to-[#5989d8]/20 opacity-50" />
        
        {/* Contenu avec même padding que la bannière remplie */}
        <div className={`relative p-3`}>
          {side === 'left' ? (
            // Layout GAUCHE
            <>
              {/* Ligne 1 : Avatar à gauche + Nom à droite */}
              <div className="flex items-center gap-3 mb-2">
                {/* Avatar vide à gauche */}
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                
                {/* Nom à droite */}
                <div className="flex-1">
                  <h3 className="text-gray-500 font-bold text-base truncate">En attente...</h3>
                </div>
              </div>

              {/* Ligne 2 : Montant en dessous */}
              <div className="flex items-center gap-1">
                <span className="text-gray-600 font-black text-2xl">0.00</span>
              </div>
            </>
          ) : (
            // Layout DROITE - Miroir
            <>
              {/* Ligne 1 : Nom à gauche + Avatar à droite */}
              <div className="flex items-center gap-3 mb-2">
                {/* Nom à gauche */}
                <div className="flex-1">
                  <h3 className="text-gray-500 font-bold text-base truncate text-right">En attente...</h3>
                </div>
                
                {/* Avatar vide à droite */}
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
              </div>

              {/* Ligne 2 : Montant en dessous (aligné à droite) */}
              <div className="flex items-center gap-1 justify-end">
                <span className="text-gray-600 font-black text-2xl">0.00</span>
              </div>
            </>
          )}
        </div>

        {/* NOUVEAU : Gros bouton REJOINDRE centré qui remplace les petits boutons */}
        {canJoin && onJoin && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
            <button
              onClick={onJoin}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/30 flex flex-col items-center gap-2"
            >
              <span className="text-sm">Rejoindre pour</span>
              <div className="flex items-center gap-2">
                <img 
                  src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" 
                  className="w-5 h-5" 
                  alt="coins"
                />
                <span className="text-xl font-black">{price}</span>
              </div>
            </button>
          </div>
        )}

        {/* Icône Bot en bas à droite - SANS texte - seulement si pas de bouton join */}
        {!canJoin && canAddBot && onAddBot && (
          <div className="absolute bottom-2 right-2">
            <button
              onClick={onAddBot}
              className="w-10 h-10 bg-[#4578be] rounded-lg hover:bg-[#5989d8] transition flex items-center justify-center shadow-lg"
            >
              <Bot className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 rounded-xl overflow-hidden relative">
      {/* Bannière en fond */}
      {bannerSvg ? (
        <div 
          className="absolute inset-0 opacity-70"
          dangerouslySetInnerHTML={{ __html: bannerSvg }}
          style={{ filter: 'brightness(0.6)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-[#4578be]/40 to-[#5989d8]/40" />
      )}
      
      {/* Contenu */}
      <div className={`relative p-3`}>
        {side === 'left' ? (
          // Layout GAUCHE - Original
          <>
            {/* Ligne 1 : Avatar à gauche + Nom à droite */}
            <div className="flex items-center gap-3 mb-2">
              {/* Avatar à gauche */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-[#4578be] shadow-lg">
                  {participant.is_bot ? (
                    <div className="w-full h-full bg-[#4578be] flex items-center justify-center">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                  ) : (
                    <img
                      src={participant.avatar_url || '/default-avatar.png'}
                      alt={participant.username || 'Player'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {frameSvg && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: frameSvg }}
                  />
                )}
                {/* Badge niveau */}
                {!participant.is_bot && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-[#4578be] rounded-full text-white text-xs font-bold">
                    {userLevel}
                  </div>
                )}
              </div>

              {/* Nom à droite */}
              <div className="flex-1">
                <h3 className="text-white font-bold text-base truncate">
                  {participant.username || participant.bot_name}
                </h3>
              </div>
            </div>

            {/* Ligne 2 : Montant en dessous de l'avatar */}
            <div className="flex items-center gap-1">
              <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" className="w-6 h-6" />
              <span className="text-[#4578be] font-black text-2xl">{animatedValue.toFixed(2)}</span>
            </div>
          </>
        ) : (
          // Layout DROITE - Miroir
          <>
            {/* Ligne 1 : Nom à gauche + Avatar à droite */}
            <div className="flex items-center gap-3 mb-2">
              {/* Nom à gauche */}
              <div className="flex-1">
                <h3 className="text-white font-bold text-base truncate text-right">
                  {participant.username || participant.bot_name}
                </h3>
              </div>

              {/* Avatar à droite */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-[#4578be] shadow-lg">
                  {participant.is_bot ? (
                    <div className="w-full h-full bg-[#4578be] flex items-center justify-center">
                      <Bot className="w-7 h-7 text-white" />
                    </div>
                  ) : (
                    <img
                      src={participant.avatar_url || '/default-avatar.png'}
                      alt={participant.username || 'Player'}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {frameSvg && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: frameSvg }}
                  />
                )}
                {/* Badge niveau */}
                {!participant.is_bot && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-[#4578be] rounded-full text-white text-xs font-bold">
                    {userLevel}
                  </div>
                )}
              </div>
            </div>

            {/* Ligne 2 : Montant en dessous de l'avatar (aligné à droite) */}
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[#4578be] font-black text-2xl">{animatedValue.toFixed(2)}</span>
              <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" className="w-6 h-6" />
            </div>
          </>
        )}
      </div>

      {/* Affichage du gain total pour le gagnant */}
      {isWinner && totalGains !== null && totalGains !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative px-3 pb-2"
        >
          <div className="bg-[#4578be]/20 backdrop-blur-sm border border-[#4578be]/40 rounded-lg px-4 py-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#4578be] font-bold text-sm">GAINS TOTAUX</span>
              <span className="text-[#4578be] font-black text-2xl">{totalGains.toFixed(2)}</span>
              <img 
                src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" 
                className="w-7 h-7" 
                alt="coins"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Composant SingleRoulette - Roulette individuelle pour un joueur
function SingleRoulette({
  offset,
  isAnimating,
  winningItem,
  battleBoxes,
  currentBoxIndex,
  battleStatus,
  countdown
}: {
  offset: number
  isAnimating: boolean
  winningItem: BattleItem | null
  battleBoxes: BattleBox[]
  currentBoxIndex: number
  battleStatus: string
  countdown: number | null
}) {
  const [rouletteItems, setRouletteItems] = useState<any[]>([])
  const [animationDone, setAnimationDone] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // Recharger les items quand currentBoxIndex change ou quand winningItem change
  useEffect(() => {
    const loadBoxItems = async () => {
      if (!battleBoxes.length) return
      
      let accumulatedBoxes = 0
      let foundBox = battleBoxes[0]
      
      for (const box of battleBoxes) {
        if (currentBoxIndex >= accumulatedBoxes && currentBoxIndex < accumulatedBoxes + box.quantity) {
          foundBox = box
          break
        }
        accumulatedBoxes += box.quantity
      }
      
      const { data: boxItems } = await supabase
        .from('loot_box_items')
        .select(`item_id, probability, items (id, name, image_url, market_value, rarity)`)
        .eq('loot_box_id', foundBox.loot_box_id)

      if (boxItems && boxItems.length > 0) {
        const items = []
        for (let i = 0; i < ROULETTE_ITEMS_COUNT; i++) {
          if (i === 25 && winningItem) {
            items.push({
              id: i,
              name: winningItem.item_name,
              image: winningItem.item_image,
              value: winningItem.market_value,
              rarity: winningItem.rarity
            })
          } else {
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
        // Incrémenter la clé pour forcer le remount de l'animation
        setAnimationKey(prev => prev + 1)
      }
    }

    loadBoxItems()
  }, [currentBoxIndex, battleBoxes, winningItem])

  // Gérer l'animation done
  useEffect(() => {
    if (isAnimating) {
      setAnimationDone(false)
      const timer = setTimeout(() => setAnimationDone(true), ROULETTE_DURATION)
      return () => clearTimeout(timer)
    } else {
      setAnimationDone(false)
    }
  }, [isAnimating, currentBoxIndex])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.6)]'
      case 'epic': return 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.6)]'
      case 'rare': return 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)]'
      case 'uncommon': return 'border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)]'
      default: return 'border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.4)]'
    }
  }

  // État d'attente ou countdown
  if (battleStatus === 'waiting' || battleStatus === 'countdown') {
    return (
      <div className="relative h-52 overflow-hidden rounded-xl bg-gray-800/30 border border-gray-700/50">
        {/* Roulette floue en attente */}
        <div className={`w-full h-full ${battleStatus === 'countdown' ? 'blur-md' : 'blur-sm'}`}>
          <motion.div 
            className="flex gap-2 items-center h-full"
            animate={{ x: [-200, -400] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-32 h-32 bg-gray-700/50 rounded-lg flex-shrink-0" />
            ))}
          </motion.div>
        </div>
        
        {/* Countdown overlay */}
        {battleStatus === 'countdown' && countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={countdown}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(69,120,190,0.8)]"
            >
              {countdown}
            </motion.div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative h-52 overflow-hidden rounded-xl bg-gray-900/50 border border-gray-700/30">
      {rouletteItems.length > 0 && (
        <motion.div
          key={`roulette-${currentBoxIndex}-${animationKey}`}
          className="absolute h-full flex items-center"
          style={{ left: '50%' }}
          initial={{ x: 0 }}
          animate={{ x: offset }}
          transition={{ 
            duration: isAnimating ? ROULETTE_DURATION / 1000 : 0, 
            ease: [0.15, 0.05, 0.25, 1.0] 
          }}
        >
          {rouletteItems.map((item) => {
            const isWinner = item.id === 25 && animationDone
            return (
              <div
                key={item.id}
                className="flex-shrink-0"
                style={{ width: ITEM_WIDTH }}
              >
                <div className={`mx-1 rounded-lg p-2 transition-all duration-500 ${
                  isWinner 
                    ? `bg-gray-800 border-2 ${getRarityColor(item.rarity)} scale-110` 
                    : 'bg-gray-800/30 border border-gray-700/30 opacity-40 grayscale-[50%]'
                }`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-32 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                  />
                  {isWinner && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center mt-1"
                    >
                      <p className="text-white font-semibold text-xs truncate">{item.name}</p>
                      <div className="flex items-center justify-center gap-1">
                        <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" className="w-3 h-3" />
                        <span className="text-[#4578be] font-black text-sm">{item.value.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

// Composant RouletteFullWidth - Roulette style Free Drop avec box au centre
function RouletteFullWidth({
  offsetLeft,
  offsetRight,
  isAnimating,
  winningItemLeft,
  winningItemRight,
  battleBoxes,
  currentBoxIndex
}: {
  offsetLeft: number
  offsetRight: number
  isAnimating: boolean
  winningItemLeft: BattleItem | null
  winningItemRight: BattleItem | null
  battleBoxes: BattleBox[]
  currentBoxIndex: number
}) {
  const [rouletteItemsLeft, setRouletteItemsLeft] = useState<any[]>([])
  const [rouletteItemsRight, setRouletteItemsRight] = useState<any[]>([])
  const [animationDone, setAnimationDone] = useState(false)
  const [currentBox, setCurrentBox] = useState<BattleBox | null>(null)
  const [finalOffsetLeft, setFinalOffsetLeft] = useState(0)
  const [finalOffsetRight, setFinalOffsetRight] = useState(0)

  // Charger les items pour les roulettes
  useEffect(() => {
    const loadBoxItems = async () => {
      if (!battleBoxes.length) return
      
      let accumulatedBoxes = 0
      let foundBox = battleBoxes[0]
      
      for (const box of battleBoxes) {
        if (currentBoxIndex >= accumulatedBoxes && currentBoxIndex < accumulatedBoxes + box.quantity) {
          foundBox = box
          break
        }
        accumulatedBoxes += box.quantity
      }
      
      setCurrentBox(foundBox)
      
      const { data: boxItems } = await supabase
        .from('loot_box_items')
        .select(`item_id, probability, items (id, name, image_url, market_value, rarity)`)
        .eq('loot_box_id', foundBox.loot_box_id)

      if (boxItems && boxItems.length > 0) {
        const createItems = (winningItem: BattleItem | null) => {
          const items = []
          for (let i = 0; i < ROULETTE_ITEMS_COUNT; i++) {
            if (i === 25 && winningItem) {
              items.push({
                id: i,
                name: winningItem.item_name,
                image: winningItem.item_image,
                value: winningItem.market_value,
                rarity: winningItem.rarity
              })
            } else {
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
          return items
        }
        
        setRouletteItemsLeft(createItems(winningItemLeft))
        setRouletteItemsRight(createItems(winningItemRight))
      }
    }

    loadBoxItems()
  }, [currentBoxIndex, battleBoxes, winningItemLeft, winningItemRight])

  // Garder les offsets finaux
  useEffect(() => {
    if (isAnimating && offsetLeft !== 0) {
      setFinalOffsetLeft(offsetLeft)
      setFinalOffsetRight(offsetRight)
    }
  }, [offsetLeft, offsetRight, isAnimating])

  useEffect(() => {
    if (isAnimating) {
      setAnimationDone(false)
      const timer = setTimeout(() => setAnimationDone(true), ROULETTE_DURATION)
      return () => clearTimeout(timer)
    }
  }, [isAnimating, currentBoxIndex])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.6)]'
      case 'epic': return 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.6)]'
      case 'rare': return 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)]'
      case 'uncommon': return 'border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.6)]'
      default: return 'border-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.4)]'
    }
  }

  // Calculer l'offset actuel (garder la position finale)
  const currentOffsetLeft = isAnimating ? offsetLeft : (finalOffsetLeft || 0)
  const currentOffsetRight = isAnimating ? offsetRight : (finalOffsetRight || 0)

  const renderRoulette = (items: any[], offset: number, side: 'left' | 'right') => (
    <div className="relative h-44 overflow-hidden flex-1">
      {items.length > 0 && (
        <motion.div
          className="absolute h-full flex items-center"
          style={{ 
            left: '50%',
            // Décaler initialement pour que la roulette démarre à gauche
            marginLeft: -(ROULETTE_ITEMS_COUNT * ITEM_WIDTH) / 2
          }}
          initial={{ x: ROULETTE_ITEMS_COUNT * ITEM_WIDTH / 2 }}
          animate={{ x: offset !== 0 ? offset + (ROULETTE_ITEMS_COUNT * ITEM_WIDTH / 2) : ROULETTE_ITEMS_COUNT * ITEM_WIDTH / 2 }}
          transition={{ 
            duration: offset !== 0 ? ROULETTE_DURATION / 1000 : 0, 
            ease: [0.15, 0.05, 0.25, 1.0] 
          }}
        >
          {items.map((item) => {
            const isWinner = item.id === 25 && animationDone
            return (
              <div
                key={item.id}
                className="flex-shrink-0"
                style={{ width: ITEM_WIDTH }}
              >
                <div className={`mx-1 rounded-xl p-2 transition-all duration-500 ${
                  isWinner 
                    ? `bg-gradient-to-b from-gray-800 to-gray-900 border-2 ${getRarityColor(item.rarity)} scale-110` 
                    : 'bg-gray-800/30 border border-gray-700/30 opacity-40 grayscale-[50%]'
                }`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-20 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                  />
                  {isWinner && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center mt-1"
                    >
                      <p className="text-white font-semibold text-xs truncate px-1">{item.name}</p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" className="w-3 h-3" />
                        <span className="text-[#4578be] font-black text-sm">{item.value.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}
    </div>
  )

  return (
    <div className="w-full flex items-center gap-4">
      {/* Roulette Gauche */}
      {renderRoulette(rouletteItemsLeft, currentOffsetLeft, 'left')}
      
      {/* Roulette Droite */}
      {renderRoulette(rouletteItemsRight, currentOffsetRight, 'right')}
    </div>
  )
}

// Composant EmptySlotCompact
function EmptySlotCompact({ 
  onJoin, 
  onAddBot,
  price
}: { 
  onJoin?: () => void
  onAddBot?: () => void
  price?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-dashed border-[#4578be]/30 bg-[#0a0e1a]/50 flex items-center justify-center"
      style={{ height: '80px' }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-[#4578be]/30 flex items-center justify-center">
          <Users className="w-6 h-6 text-gray-600" />
        </div>
        <span className="text-gray-500 text-sm">Slot disponible</span>
        
        {onJoin && (
          <button
            onClick={onJoin}
            className="px-4 py-2 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white text-sm font-bold rounded-lg hover:scale-105 transition shadow-lg shadow-[#4578be]/50 flex items-center gap-2"
          >
            <span>Rejoindre pour</span>
            <img 
              src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png"
              alt="Coins"
              className="w-4 h-4"
            />
            <span className="font-black">{price || 0}</span>
          </button>
        )}
        
        {onAddBot && (
          <button
            onClick={onAddBot}
            className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Bot
          </button>
        )}
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

  // Couleurs de glow néon selon la rareté
  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-[0_0_20px_rgba(234,179,8,0.6)]'
      case 'epic': return 'shadow-[0_0_20px_rgba(168,85,247,0.6)]'
      case 'rare': return 'shadow-[0_0_20px_rgba(59,130,246,0.6)]'
      case 'uncommon': return 'shadow-[0_0_20px_rgba(34,197,94,0.6)]'
      default: return ''
    }
  }

  // Couleur de fond gradient selon la rareté
  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-b from-yellow-500/20 to-transparent'
      case 'epic': return 'bg-gradient-to-b from-purple-500/20 to-transparent'
      case 'rare': return 'bg-gradient-to-b from-blue-500/20 to-transparent'
      case 'uncommon': return 'bg-gradient-to-b from-green-500/20 to-transparent'
      default: return ''
    }
  }

  // État pour savoir si l'animation est terminée
  const [animationDone, setAnimationDone] = useState(false)

  // Reset animationDone quand une nouvelle animation commence
  useEffect(() => {
    if (isAnimating) {
      setAnimationDone(false)
      // Timer pour marquer la fin de l'animation
      const timer = setTimeout(() => {
        setAnimationDone(true)
      }, ROULETTE_DURATION)
      return () => clearTimeout(timer)
    }
  }, [isAnimating, currentBoxIndex])

  return (
    <div className="bg-gradient-to-b from-[#1a2332] to-[#0d1219] rounded-2xl border border-[#4578be]/20 p-4 h-full flex flex-col">
      {/* Roulette Container */}
      <div className="relative h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-r from-[#1a2332] via-[#0a0e1a] to-[#1a2332] flex items-center">
        {/* Indicateur ligne dorée style Free Drop */}
        <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 z-20 flex flex-col items-center">
          {/* Ligne principale dorée avec glow */}
          <div 
            className="w-1 flex-1 bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-400 rounded-full"
            style={{ 
              boxShadow: '0 0 15px rgba(234, 179, 8, 0.8), 0 0 30px rgba(234, 179, 8, 0.4)',
              filter: 'brightness(1.2)'
            }}
          />
        </div>

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
            {rouletteItems.map((item) => {
              // L'item gagnant est à la position 25
              const isWinningItem = item.id === 25
              const showValue = isWinningItem && animationDone
              
              return (
                <div
                  key={item.id}
                  className="flex-shrink-0 px-1"
                  style={{ width: ITEM_WIDTH }}
                >
                  <div className="relative">
                    {/* Effet néon derrière l'item */}
                    <div className={`absolute inset-0 rounded-lg ${getRarityGlow(item.rarity)} ${getRarityBg(item.rarity)}`} />
                    
                    {/* Container de l'item - bordure neutre */}
                    <div className="relative bg-[#1a2332] rounded-lg p-2 border border-gray-700/50">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-16 object-contain mb-1"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/mystery-box.png'
                        }}
                      />
                      {/* Valeur affichée seulement quand l'animation est terminée et sur l'item gagnant */}
                      <p className={`text-center text-yellow-500 text-xs font-bold transition-opacity duration-300 ${showValue ? 'opacity-100' : 'opacity-0'}`}>
                        {Math.floor(item.value)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Items Gagnés - Grille horizontale */}
      <div className="flex-1 overflow-y-auto mt-3">
        {accumulatedItems.length > 0 && (
          <div>
            <p className="text-gray-400 text-xs font-semibold mb-2">
              Items gagnés ({accumulatedItems.length})
            </p>
            <div className="grid grid-cols-6 gap-2">
              {accumulatedItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-b from-[#4578be]/20 to-[#1a2332] border border-[#4578be]/30 rounded-lg p-2 flex flex-col items-center"
                >
                  <img
                    src={item.item_image}
                    alt={item.item_name}
                    className="w-12 h-12 object-contain mb-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/mystery-box.png'
                    }}
                  />
                  <p className="text-yellow-500 font-bold text-xs text-center">
                    {Math.floor(item.market_value)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant WinnerDisplayCompact - Version améliorée
function WinnerDisplayCompact({ 
  winner, 
  totalPrize 
}: { 
  winner: BattleParticipant
  totalPrize: number
}) {
  const [showConfetti, setShowConfetti] = useState(true)
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      {/* Fond avec gradient et effet */}
      <div className="relative overflow-hidden">
        {/* Particules de célébration */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#fbbf24', '#4578be', '#22c55e', '#ef4444'][i % 4]
                }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ 
                  y: -200,
                  opacity: 0,
                  x: (Math.random() - 0.5) * 100
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        )}
        
        {/* Contenu principal */}
        <div className="bg-gradient-to-r from-[#0a0e1a] via-emerald-900/30 to-[#0a0e1a] border-t-2 border-emerald-500 px-8 py-6">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center justify-between">
              {/* Gauche : Trophée + Info gagnant */}
              <div className="flex items-center gap-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative"
                >
                  <span className="text-6xl">🏆</span>
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ 
                      background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)',
                      filter: 'blur(10px)'
                    }}
                  />
                </motion.div>
                
                <div>
                  <motion.h2 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black text-white mb-2"
                  >
                    {winner.username || winner.bot_name} remporte la battle !
                  </motion.h2>
                  
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-xl">
                      <Coins className="w-6 h-6 text-yellow-500" />
                      <span className="text-3xl font-black text-yellow-500">
                        {Math.floor(totalPrize)} coins
                      </span>
                    </div>
                    <span className="text-gray-400">remportés</span>
                  </motion.div>
                </div>
              </div>

              {/* Droite : Boutons */}
              <div className="flex items-center gap-4">
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition"
                >
                  <Zap className="w-5 h-5 inline mr-2" />
                  Rejouer
                </motion.button>
                
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/battles'}
                  className="px-6 py-3 bg-gradient-to-r from-[#4578be] to-[#5989d8] text-white text-lg font-bold rounded-xl hover:shadow-lg hover:shadow-[#4578be]/30 transition"
                >
                  Retour aux battles
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}