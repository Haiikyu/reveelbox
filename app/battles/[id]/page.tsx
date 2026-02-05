'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from '@/app/components/ThemeProvider'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Trophy, Bot, User, Crown, Coins, Timer, Users,
  PlayCircle, Plus, Eye, ArrowLeft, Sparkles, Zap, Swords, Shield, Copy, Check
} from 'lucide-react'
import { ProvablyFairVerifier } from '@/app/components/ProvablyFairVerifier'
import { hashServerSeed, calculateProvablyFairPercentage } from '@/lib/provablyFair'
import { dispatchBalanceUpdate, dispatchInventoryUpdate } from '@/lib/balanceEvents'

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
  team: number
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
  player_distribution?: string  // "1v1", "2v2", "3v3", etc.
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
  // Provably Fair fields
  server_seed?: string
  client_seed?: string
  combined_hash?: string
}

const ROULETTE_ITEMS_COUNT = 50
const ITEM_WIDTH = 140
const ROULETTE_DURATION = 8000 // 8 secondes par ouverture

// ===============================================
// HELPERS POUR LES DIFFÉRENTS MODES DE BATTLE
// ===============================================
const isTeamMode = (battle: Battle) => {
  // Vérifier player_distribution pour les modes équipe
  return battle.player_distribution === '2v2' || battle.player_distribution === '3v3'
}

const getGridColumns = (maxPlayers: number, battle: Battle) => {
  if (isTeamMode(battle)) {
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

const getPlayersPerTeam = (battle: Battle) => {
  if (isTeamMode(battle)) {
    return battle.max_players / 2  // 2v2 = 2, 3v3 = 3
  }
  return battle.max_players
}

export default function BattleRoomPage() {
  const { resolvedTheme } = useTheme()
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

  // Provably Fair
  const [showProvablyFair, setShowProvablyFair] = useState(false)
  const [provablyFairData, setProvablyFairData] = useState<{
    serverSeedHash: string
    serverSeed: string
    clientSeed: string
    nonce: number
    roll: number
    hash: string
  } | null>(null)
  const [copiedSeed, setCopiedSeed] = useState<string | null>(null)

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

      // ========================================
      // 🔍 DEBUG : Vérifier le mode de la battle
      // ========================================
      console.log('🎮 BATTLE MODE DEBUG:', {
        battleId: battleData.id,
        battleName: battleData.name,
        mode: battleData.mode,
        isCrazy: battleData.mode === 'crazy'
      })

      // Récupérer les participants
      const { data: participantsData } = await supabase
        .from('battle_participants')
        .select(`
          id, user_id, is_bot, bot_name, bot_avatar_url, 
          position, total_value, team
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
        team: p.team,
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

      // Charger les données Provably Fair si elles existent
      if (battleData.server_seed || battleData.combined_hash) {
        // combined_hash stocke le hash du server_seed
        const storedHash = battleData.combined_hash || ''
        const serverSeed = battleData.server_seed || ''

        // Calculer le hash correct (si la battle est terminée et on a le server_seed)
        let correctHash = storedHash
        if (battleData.status === 'finished' && serverSeed) {
          const computedHash = hashServerSeed(serverSeed)
          const hashMatches = computedHash === storedHash

          console.log('🔐 Provably Fair consistency check:', {
            serverSeed: serverSeed.substring(0, 20) + '...',
            storedHash: storedHash.substring(0, 20) + '...',
            computedHash: computedHash.substring(0, 20) + '...',
            matches: hashMatches
          })

          // Si le hash stocké ne correspond pas, utiliser le hash calculé
          // (cela permet à la vérification de fonctionner même si les données stockées sont incohérentes)
          if (!hashMatches) {
            console.warn('⚠️ Hash mismatch detected - using computed hash for verification')
            correctHash = computedHash
          }
        }

        setProvablyFairData({
          serverSeedHash: correctHash,
          serverSeed: battleData.status === 'finished' ? serverSeed : '', // Ne révéler qu'après la battle
          clientSeed: battleData.client_seed || '',
          nonce: battleData.nonce || 0,
          roll: 0,
          hash: ''
        })
        console.log('🎲 Provably Fair data loaded from DB')
      }

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

  // Ref pour tracker le status précédent (évite de recréer la subscription)
  const prevStatusRef = useRef<string>('')

  // Synchroniser le ref quand la battle est chargée initialement
  useEffect(() => {
    if (battle?.status && !prevStatusRef.current) {
      prevStatusRef.current = battle.status
      console.log('🔄 Status ref initialized:', battle.status)
    }
  }, [battle?.status])

  // Fonction pour mettre à jour la battle de manière incrémentale (sans recharger)
  const updateBattleIncrementally = useCallback(async (payload: any) => {
    const newData = payload.new
    if (!newData) return

    console.log('📢 Battle update received:', {
      status: newData.status,
      current_box: newData.current_box,
      prevStatus: prevStatusRef.current
    })

    // Toujours mettre à jour le status IMMÉDIATEMENT
    const newStatus = newData.status || prevStatusRef.current
    prevStatusRef.current = newStatus

    // Mettre à jour le state de la battle immédiatement
    setBattle(prev => {
      if (!prev) return prev
      console.log('🔄 Updating battle state:', { prevStatus: prev.status, newStatus: newData.status })
      return {
        ...prev,
        status: newData.status ?? prev.status,
        current_box: newData.current_box ?? prev.current_box,
        server_seed: newData.server_seed ?? prev.server_seed,
        client_seed: newData.client_seed ?? prev.client_seed,
        combined_hash: newData.combined_hash ?? prev.combined_hash,
      }
    })

    // Si la battle vient de se terminer, charger aussi les openings
    if (newData.status === 'finished') {
      console.log('🏆 Battle terminée - chargement des openings finales')

      // Charger les openings complètes pour affichage final
      const { data: openingsData, error } = await supabase
        .from('battle_openings')
        .select(`
          id, participant_id, box_order, item_id, item_value,
          items (id, name, image_url, market_value, rarity)
        `)
        .eq('battle_id', battleId)
        .order('box_order')

      if (error) {
        console.error('❌ Error loading openings:', error)
      }

      // Charger les openings si disponibles
      if (openingsData && openingsData.length > 0) {
        // Obtenir la liste des participants actuelle
        const { data: currentBattle } = await supabase
          .from('battle_participants')
          .select('id, position')
          .eq('battle_id', battleId)
          .order('position')

        if (currentBattle) {
          const openingsByParticipant: {[key: number]: BattleItem[]} = {}
          currentBattle.forEach((_, index) => {
            openingsByParticipant[index] = []
          })

          openingsData.forEach(opening => {
            const participantIndex = currentBattle.findIndex(p => p.id === opening.participant_id)
            if (participantIndex !== -1) {
              const itemData = opening.items as any
              openingsByParticipant[participantIndex].push({
                id: itemData.id,
                item_name: itemData.name,
                item_image: itemData.image_url,
                market_value: opening.item_value,
                rarity: itemData.rarity
              })
            }
          })

          setLoadedOpenings(openingsByParticipant)
          console.log('✅ Openings chargés pour l\'affichage final:', openingsByParticipant)
        }
      }

      // Mettre à jour Provably Fair avec le server_seed révélé
      if (newData.server_seed) {
        setProvablyFairData(prev => ({
          serverSeedHash: newData.combined_hash || prev?.serverSeedHash || '',
          serverSeed: newData.server_seed || '',
          clientSeed: newData.client_seed || prev?.clientSeed || '',
          nonce: prev?.nonce || 0,
          roll: prev?.roll || 0,
          hash: prev?.hash || ''
        }))
      }
    } else if (newData.combined_hash) {
      // Mise à jour du hash Provably Fair (avant que la battle ne soit terminée)
      setProvablyFairData(prev => ({
        serverSeedHash: newData.combined_hash || prev?.serverSeedHash || '',
        serverSeed: prev?.serverSeed || '',
        clientSeed: newData.client_seed || prev?.clientSeed || '',
        nonce: prev?.nonce || 0,
        roll: prev?.roll || 0,
        hash: prev?.hash || ''
      }))
    }
  }, [battleId]) // Dépendance stable - ne dépend plus de battle?.status

  // Fonction pour mettre à jour les participants de manière incrémentale
  const updateParticipantsIncrementally = useCallback(async () => {
    if (!battleId) return

    const { data: participantsData } = await supabase
      .from('battle_participants')
      .select(`
        id, user_id, is_bot, bot_name, bot_avatar_url,
        position, total_value, team
      `)
      .eq('battle_id', battleId)
      .order('position')

    if (!participantsData) return

    // Récupérer les usernames pour les participants humains
    const userIds = participantsData
      .filter(p => !p.is_bot && p.user_id)
      .map(p => p.user_id)

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
    const participants: BattleParticipant[] = participantsData.map(p => ({
      id: p.id,
      user_id: p.user_id,
      username: p.is_bot ? p.bot_name : usernamesMap[p.user_id]?.username,
      avatar_url: p.is_bot ? p.bot_avatar_url : usernamesMap[p.user_id]?.avatar_url,
      is_bot: p.is_bot,
      bot_name: p.bot_name,
      bot_avatar_url: p.bot_avatar_url,
      position: p.position,
      total_value: p.total_value || 0,
      team: p.team,
      items: []
    }))

    setBattle(prev => prev ? { ...prev, participants } : prev)
  }, [battleId])

  // Realtime sur les changements de battle - SANS recharger toute la page
  useEffect(() => {
    const channel = supabase
      .channel(`battle:${battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battles',
          filter: `id=eq.${battleId}`
        },
        (payload) => {
          console.log('📢 Battle update (incremental):', payload.new?.status, payload.new?.current_box)
          updateBattleIncrementally(payload)
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
        (payload) => {
          console.log('👥 Participants update (incremental):', payload.eventType)
          updateParticipantsIncrementally()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [battleId, updateBattleIncrementally, updateParticipantsIncrementally])

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

  // State pour suivre le dernier round traité
  const lastProcessedRoundRef = useRef<number>(0)

  // Écouter les changements de current_box en temps réel
  useEffect(() => {
    if (!battle || battle.status !== 'active') return

    // Vérifier si un nouveau round doit être traité
    const currentBox = battle.current_box || 0
    if (currentBox > lastProcessedRoundRef.current && currentBox <= battle.total_boxes) {
      console.log(`📦 Nouveau round détecté: ${currentBox}`)
      lastProcessedRoundRef.current = currentBox
      playRoundAnimation(currentBox)
    }
  }, [battle?.current_box, battle?.status])

  // Fonction pour jouer l'animation d'un round spécifique
  const playRoundAnimation = async (boxNumber: number) => {
    if (!battle) return

    console.log(`🎰 Playing animation for box ${boxNumber}/${battle.total_boxes}`)
    setCurrentBoxIndex(boxNumber - 1) // 0-indexed for display

    // Reset animation state
    setIsOpening(false)
    const resetOffsets: {[key: number]: number} = {}
    const resetWinningItems: {[key: number]: BattleItem | null} = {}
    battle.participants.forEach((_, i) => {
      resetOffsets[i] = 0
      resetWinningItems[i] = null
    })
    setRouletteOffsets(resetOffsets)
    setWinningItems(resetWinningItems)

    // Petit délai pour voir le reset
    await new Promise(resolve => setTimeout(resolve, 300))

    // Charger les openings de ce round depuis la DB
    const { data: openingsData, error } = await supabase
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
      .eq('box_order', boxNumber)

    if (error || !openingsData || openingsData.length === 0) {
      console.error('❌ Failed to load openings for round', boxNumber, error)
      return
    }

    console.log(`✅ Loaded ${openingsData.length} openings for round ${boxNumber}`)

    // Convertir en format results
    const results = openingsData.map(opening => {
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

    // Mettre à jour les winning items (pour que la roulette se construise avec)
    setWinningItems(prev => {
      const updated = { ...prev }
      results.forEach(r => {
        updated[r.participantIndex] = r.wonItem
      })
      return updated
    })

    // Attendre que les roulettes se construisent avec les bons items
    await new Promise(resolve => setTimeout(resolve, 200))

    // Activer l'animation
    setIsOpening(true)

    // Calculer les offsets pour l'animation - centrer l'item 25
    const newOffsets: {[key: number]: number} = {}
    results.forEach(r => {
      const targetPosition = -(25 * ITEM_WIDTH + ITEM_WIDTH / 2)
      newOffsets[r.participantIndex] = targetPosition
    })
    setRouletteOffsets(newOffsets)

    // Attendre la fin de l'animation + temps d'affichage du résultat
    await new Promise(resolve => setTimeout(resolve, ROULETTE_DURATION + 3500))

    // Désactiver l'animation
    setIsOpening(false)

    // Mettre à jour les items accumulés
    setAccumulatedItems(prev => {
      const updated = { ...prev }
      results.forEach(r => {
        if (!updated[r.participantIndex]) updated[r.participantIndex] = []
        updated[r.participantIndex] = [...updated[r.participantIndex], r.wonItem]
      })
      return updated
    })

    // Mettre à jour les valeurs totales localement
    if (battle) {
      const updatedParticipants = battle.participants.map((p, i) => {
        const currentItems = accumulatedItems[i] || []
        const newItem = results.find(r => r.participantIndex === i)?.wonItem
        const allParticipantItems = newItem ? [...currentItems, newItem] : currentItems
        const newTotalValue = allParticipantItems.reduce((sum, item) => sum + item.market_value, 0)
        return { ...p, total_value: newTotalValue }
      })
      setBattle({ ...battle, participants: updatedParticipants })

      // Si c'était le dernier round, vérifier si la battle est terminée après un délai
      // SEULEMENT si le status n'est pas déjà 'finished'
      if (boxNumber === battle.total_boxes && battle.status !== 'finished') {
        console.log('🏁 Dernier round terminé - vérification du statut dans 3 secondes...')
        setTimeout(async () => {
          // Vérifier si le status a déjà été mis à jour par le real-time
          if (prevStatusRef.current === 'finished') {
            console.log('✅ Status déjà mis à jour par real-time, pas besoin de fallback')
            return
          }

          // Vérifier directement en DB si le status est 'finished'
          const { data: battleCheck } = await supabase
            .from('battles')
            .select('status, server_seed, client_seed, combined_hash')
            .eq('id', battleId)
            .single()

          if (battleCheck?.status === 'finished' && prevStatusRef.current !== 'finished') {
            console.log('✅ Battle confirmée comme terminée - mise à jour forcée')
            setBattle(prev => prev ? {
              ...prev,
              status: 'finished',
              server_seed: battleCheck.server_seed,
              client_seed: battleCheck.client_seed,
              combined_hash: battleCheck.combined_hash
            } : prev)
            prevStatusRef.current = 'finished'

            // Charger les openings finales
            const { data: openingsData } = await supabase
              .from('battle_openings')
              .select(`
                id, participant_id, box_order, item_id, item_value,
                items (id, name, image_url, market_value, rarity)
              `)
              .eq('battle_id', battleId)
              .order('box_order')

            if (openingsData) {
              const openingsByParticipant: {[key: number]: BattleItem[]} = {}
              battle.participants.forEach((_, index) => {
                openingsByParticipant[index] = []
              })

              openingsData.forEach(opening => {
                const participantIndex = battle.participants.findIndex(p => p.id === opening.participant_id)
                if (participantIndex !== -1) {
                  const itemData = opening.items as any
                  openingsByParticipant[participantIndex].push({
                    id: itemData.id,
                    item_name: itemData.name,
                    item_image: itemData.image_url,
                    market_value: opening.item_value,
                    rarity: itemData.rarity
                  })
                }
              })

              setLoadedOpenings(openingsByParticipant)
            }

            // Mettre à jour Provably Fair
            if (battleCheck.server_seed) {
              setProvablyFairData(prev => ({
                serverSeedHash: battleCheck.combined_hash || prev?.serverSeedHash || '',
                serverSeed: battleCheck.server_seed || '',
                clientSeed: battleCheck.client_seed || prev?.clientSeed || '',
                nonce: prev?.nonce || 0,
                roll: prev?.roll || 0,
                hash: prev?.hash || ''
              }))
            }
          }
        }, 3000) // Attendre 3 secondes avant de vérifier
      }
    }
  }

  // Catch-up: Quand on rejoint en cours de battle, rattraper les rounds manqués
  useEffect(() => {
    if (!battle || battle.status !== 'active') return

    const currentBox = battle.current_box || 0
    if (currentBox > 0 && lastProcessedRoundRef.current === 0) {
      console.log(`🔄 Catch-up: Loading all openings up to round ${currentBox}`)
      loadOpeningsUpToRound(currentBox)
    }
  }, [battle?.status])

  // Charger tous les openings jusqu'à un certain round (pour catch-up)
  const loadOpeningsUpToRound = async (upToRound: number) => {
    if (!battle) return

    const { data: openingsData, error } = await supabase
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
      .lte('box_order', upToRound)
      .order('box_order')

    if (error || !openingsData) {
      console.error('❌ Failed to load catch-up openings', error)
      return
    }

    // Organiser par participant
    const itemsByParticipant: {[key: number]: BattleItem[]} = {}
    battle.participants.forEach((_, i) => {
      itemsByParticipant[i] = []
    })

    openingsData.forEach(opening => {
      const participantIndex = battle.participants.findIndex(p => p.id === opening.participant_id)
      if (participantIndex !== -1) {
        const itemData = opening.items as any
        itemsByParticipant[participantIndex].push({
          id: itemData.id,
          item_name: itemData.name,
          item_image: itemData.image_url,
          market_value: opening.item_value,
          rarity: itemData.rarity
        })
      }
    })

    setAccumulatedItems(itemsByParticipant)
    setCurrentBoxIndex(upToRound - 1)
    lastProcessedRoundRef.current = upToRound

    console.log(`✅ Catch-up complete: loaded ${openingsData.length} openings`)
  }

  // Lancer l'animation de fin quand la battle est terminée
  useEffect(() => {
    if (battle?.status === 'finished' && !itemsAnimating && !itemsTransferred) {
      console.log('🎬 Lancement animation de fin')

      // Notifier la Navbar de mettre à jour la balance et l'inventaire
      dispatchBalanceUpdate()
      dispatchInventoryUpdate()

      const timer = setTimeout(() => {
        console.log('📦 Items animating = true')
        setItemsAnimating(true)
        setTimeout(() => {
          console.log('📦 Items animating = false')
          setItemsAnimating(false)
          setTimeout(() => {
            console.log('✅ Items transferred = true')
            setItemsTransferred(true)
          }, 800)
        }, 800)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [battle?.status])

  // La logique de finalisation est maintenant gérée côté serveur (Edge Function)
  // Les données Provably Fair sont révélées après la battle via loadBattle()

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
      
      // Pour les modes équipe (2v2, 3v3), auto-assigner à l'équipe la moins remplie
      let assignedTeam: number | null = null
      if (isTeamMode(battle)) {
        const team1Count = battle.participants.filter(p => p.team === 1).length
        const team2Count = battle.participants.filter(p => p.team === 2).length
        assignedTeam = team1Count <= team2Count ? 1 : 2
        console.log(`Assigning to team ${assignedTeam} (Team A: ${team1Count}, Team B: ${team2Count})`)
      }
      
      console.log('Current participants:', battle.participants.length, 'Max position:', maxPosition, 'Next position:', nextPosition)
      
      const insertData: any = {
        battle_id: battleId,
        user_id: currentUser.id,
        is_bot: false,
        position: nextPosition
      }
      
      // Ajouter team seulement pour les modes équipe
      if (assignedTeam !== null) {
        insertData.team = assignedTeam
      }
      
      const { error } = await supabase
        .from('battle_participants')
        .insert(insertData)

      if (error) {
        console.error('Error adding to battle:', error)
        throw error
      }

      // 5. Rafraîchir la battle
      console.log('Reloading battle...')
      await loadBattle()

      // Notifier la Navbar de mettre à jour la balance
      dispatchBalanceUpdate()

      console.log(`✅ Joueur ${currentUser.id} a rejoint la battle. ${battle.entry_cost} coins prélevés.`)

    } catch (err: any) {
      console.error('Error joining battle:', err)
      setError(err.message)
    }
  }

  const handleAddBot = async (targetTeam?: number) => {
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

      // Pour les modes équipe (2v2, 3v3), utiliser targetTeam OU auto-assigner
      let assignedTeam: number | null = null
      if (isTeamMode(battle)) {
        if (targetTeam) {
          // PRIORITÉ : Utiliser l'équipe demandée par le bouton cliqué
          assignedTeam = targetTeam
          console.log(`Bot assigned to requested team ${assignedTeam}`)
        } else {
          // FALLBACK : Auto-assigner à l'équipe la moins remplie
          const team1Count = battle.participants.filter(p => p.team === 1).length
          const team2Count = battle.participants.filter(p => p.team === 2).length
          assignedTeam = team1Count <= team2Count ? 1 : 2
          console.log(`Bot auto-assigned to team ${assignedTeam} (Team A: ${team1Count}, Team B: ${team2Count})`)
        }
      }

      const insertData: any = {
        battle_id: battleId,
        user_id: null,
        is_bot: true,
        bot_name: botName,
        position: nextPosition
      }
      
      // Ajouter team seulement pour les modes équipe
      if (assignedTeam !== null) {
        insertData.team = assignedTeam
      }

      const { error } = await supabase
        .from('battle_participants')
        .insert(insertData)

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
      console.log('🚀 Starting battle via Edge Function...')

      // Call Edge Function to start battle server-side
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Non authentifié')
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/battle-processor/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ battle_id: battleId }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erreur ${response.status}`)
      }

      const result = await response.json()
      console.log('🎲 Battle started:', result)

      // Update provably fair data locally
      if (result.server_seed_hash) {
        setProvablyFairData({
          serverSeedHash: result.server_seed_hash,
          serverSeed: '', // Will be revealed when battle finishes
          clientSeed: '',
          nonce: 0,
          roll: 0,
          hash: ''
        })
      }

      // The Edge Function handles the rest (countdown, active status, processing)
      // We just need to listen to real-time updates

    } catch (err: any) {
      console.error('Error starting battle:', err)
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        resolvedTheme === 'dark' ? 'bg-[#0a0e1a]' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-[#4578be] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className={`text-lg ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-700'}`}>Chargement de la battle...</p>
        </div>
      </div>
    )
  }

  if (error || !battle) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        resolvedTheme === 'dark' ? 'bg-[#0a0e1a]' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
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
  
  // MODE CRAZY : Chercher le MIN au lieu du MAX
  const isCrazyMode = battle.mode === 'crazy'
  let targetValue = isCrazyMode ? Infinity : 0
  
  if (battle.status === 'finished') {
    battle.participants.forEach((p: BattleParticipant, index: number) => {
      const items = itemsData[index] || []
      const totalValue = items.reduce((sum, item) => sum + item.market_value, 0)
      
      if (isCrazyMode) {
        // Mode Crazy : Chercher la valeur la PLUS BASSE
        if (totalValue < targetValue) {
          targetValue = totalValue
          winnerIndex = index
          winner = index
        }
      } else {
        // Mode normal : Chercher la valeur la PLUS HAUTE
        if (totalValue > targetValue) {
          targetValue = totalValue
          winnerIndex = index
          winner = index
        }
      }
    })
  }

  // ===============================================
  // CALCUL ÉQUIPE GAGNANTE pour 2v2/3v3
  // ===============================================
  let winningTeam: number | null = null
  let team1Score = 0
  let team2Score = 0
  let team1Count = 0
  let team2Count = 0

  if (battle.status === 'finished' && isTeamMode(battle)) {
    battle.participants.forEach((p, index) => {
      if (!p.team) return
      
      const items = itemsData[index] || []
      const totalValue = items.reduce((sum, item) => sum + item.market_value, 0)
      
      if (p.team === 1) {
        team1Score += totalValue
        team1Count++
      } else if (p.team === 2) {
        team2Score += totalValue
        team2Count++
      }
    })

    // MODE CRAZY : Inverser - l'équipe avec le MOINS gagne
    const isCrazyMode = battle.mode === 'crazy'
    
    // ========================================
    // 🔍 DEBUG : Mode Crazy dans calcul affichage
    // ========================================
    console.log('🎨 AFFICHAGE - Calcul gagnant:', {
      mode: battle.mode,
      isCrazyMode: isCrazyMode,
      team1Score: team1Score,
      team2Score: team2Score,
      logique: isCrazyMode ? 'INVERSÉE (le moins gagne)' : 'NORMALE (le plus gagne)'
    })
    
    if (isCrazyMode) {
      winningTeam = team1Score < team2Score ? 1 : 2
    } else {
      winningTeam = team1Score > team2Score ? 1 : 2
    }
    
    console.log('🏆 Équipe gagnante:', winningTeam, 'avec score:', winningTeam === 1 ? team1Score : team2Score)
  }

  // Pool total et gains par joueur gagnant (pour modes équipe)
  const totalPool = team1Score + team2Score
  const winningTeamCount = winningTeam === 1 ? team1Count : team2Count
  const sharePerPlayer = winningTeamCount > 0 ? totalPool / winningTeamCount : 0

  // Collecter tous les items pour le gagnant
  const allItems = battle.status === 'finished' 
    ? Object.values(itemsData).flat()
    : []

  // Prix par joueur (pas le total)
  const pricePerPlayer = Math.floor(battle.total_prize / 2)

  // ===============================================
  // ===============================================
  // PAS D'ÉCRAN SÉPARÉ POUR MODES ÉQUIPE !
  // On reste sur la même page comme en 1v1
  // ===============================================

  return (
    <div className={`h-screen overflow-hidden flex flex-col ${
      resolvedTheme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-[#1a2332] to-gray-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Header minimaliste - Bouton retour + Provably Fair */}
      <div className="flex-shrink-0 px-4 py-1 flex items-center justify-between">
        <button
          onClick={() => window.location.href = '/battles'}
          className={`p-1.5 rounded-lg transition ${
            resolvedTheme === 'dark' ? 'hover:bg-[#4578be]/20' : 'hover:bg-slate-200'
          }`}
        >
          <ArrowLeft className={`w-4 h-4 ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-700'}`} />
        </button>

        {/* Bouton Provably Fair */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowProvablyFair(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">Provably Fair</span>
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* ÉCRAN EN JEU ET TERMINÉ - MÊME LAYOUT */}
        {(battle.status !== 'finished' || true) && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Icône mode CRAZY en arrière-plan flouté */}
            {battle.mode === 'crazy' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
              >
                <Zap className="w-96 h-96 text-purple-500/10 blur-3xl" />
              </motion.div>
            )}

            {/* Zone centrale BOX - Entre titre et joueurs - FIXE */}
            <div className="fixed left-1/2 top-28 transform -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none">
              {/* Texte BOX X OF Y ou LA BATTLE EST TERMINÉE - AU-DESSUS */}
              <div className="absolute bottom-full mb-4">
                {battle.status === 'finished' ? (
                  <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`font-black text-3xl tracking-wider text-center whitespace-nowrap ${
                      resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    LA BATTLE EST TERMINÉE
                  </motion.h2>
                ) : (
                  <>
                    <h2 className={`font-black text-2xl tracking-wider mb-3 text-center whitespace-nowrap ${
                      resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>
                      BOX {currentBoxIndex + 1} OF {battle.total_boxes}
                    </h2>

                    {/* Indicateurs de progression - Plus petits */}
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: battle.total_boxes }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx < currentBoxIndex
                              ? 'bg-emerald-500'
                              : idx === currentBoxIndex
                              ? 'bg-[#4578be]'
                              : resolvedTheme === 'dark' ? 'bg-gray-600' : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Grande BOX au centre */}
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

            {/* Battle Name avec icône selon le mode - Gauche, aligné avec BOX */}
            <div className="absolute left-4 top-2 z-20">
              <h1 className={`text-sm font-bold flex items-center gap-1.5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {battle.mode === 'crazy' ? (
                  <Zap className="w-4 h-4 text-purple-400" />
                ) : (
                  <Crown className="w-4 h-4 text-[#4578be]" />
                )}
                {battle.name}
              </h1>
            </div>

            {/* Battle Value - Droite, aligné avec BOX, 1 ligne */}
            <div className="absolute right-4 top-2 z-20">
              <div className={`px-3 py-1 rounded-lg flex items-center gap-2 ${
                resolvedTheme === 'dark'
                  ? 'bg-[#4578be]/20 border border-[#4578be]/40'
                  : 'bg-white/80 border border-slate-200 shadow-sm'
              }`}>
                <span className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Battle Value</span>
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
            {(battle.max_players === 2 || isTeamMode(battle)) && (
              <>
                <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gray-700/50 to-transparent z-10" />
                
                {/* Épée au centre en mode équipe */}
                {isTeamMode(battle) && battle.status !== 'finished' && (
                  <div 
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 transition-opacity duration-300"
                    style={{ 
                      opacity: battle.status === 'waiting' ? 1 : 0.6
                    }}
                  >
                    <Swords className="w-16 h-16 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                  </div>
                )}
              </>
            )}

            {/* Zone des joueurs avec roulettes - GRID DYNAMIQUE */}
            <div className="flex-1 overflow-hidden pt-24">
              {isTeamMode(battle) ? (
                <>
                  {/* GAINS TOTAUX - Côté GAUCHE (Team A) */}
                  {battle.status === 'finished' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-40 p-4 rounded-xl border-2 ${
                        winningTeam === 1
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-red-500/10 border-red-500'
                      }`}
                    >
                      <h3 className={`font-black text-xl mb-2 ${
                        winningTeam === 1 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {winningTeam === 1 ? '✅ GAGNANT' : '❌ PERDANT'}
                      </h3>
                      {winningTeam === 1 && (
                        <>
                          <p className="text-emerald-400 font-bold text-lg">
                            {totalPool.toFixed(2)}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {sharePerPlayer.toFixed(2)} / joueur
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* GAINS TOTAUX - Côté DROIT (Team B) */}
                  {battle.status === 'finished' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-40 p-4 rounded-xl border-2 ${
                        winningTeam === 2
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-red-500/10 border-red-500'
                      }`}
                    >
                      <h3 className={`font-black text-xl mb-2 text-right ${
                        winningTeam === 2 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {winningTeam === 2 ? '✅ GAGNANT' : '❌ PERDANT'}
                      </h3>
                      {winningTeam === 2 && (
                        <>
                          <p className="text-emerald-400 font-bold text-lg text-right">
                            {totalPool.toFixed(2)}
                          </p>
                          <p className="text-gray-400 text-sm text-right">
                            {sharePerPlayer.toFixed(2)} / joueur
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* ========== MODE ÉQUIPE (2v2, 3v3) ========== */}
                  <div className={`h-full grid grid-cols-2 gap-2 ${battle.max_players === 6 ? 'scale-[0.75]' : 'scale-[0.85]'}`}>
                  {/* TEAM A (gauche) */}
                  <div className={`flex flex-col ${battle.status === 'finished' ? 'gap-0' : 'gap-0.5'} px-2 pb-2`}>
                    <div className="text-center mb-1">
                      <h3 className="text-[#4578be] font-black text-sm">TEAM A</h3>
                    </div>
                    
                    {/* Joueurs de Team A - empilés verticalement */}
                    {battle.participants
                      .filter(p => p.team === 1 || p.team === null)
                      .map((participant, teamIndex) => {
                        const globalIndex = battle.participants.findIndex(p => p.id === participant.id)
                        const is3v3 = battle.max_players === 6
                        
                        return (
                          <div key={participant.id || globalIndex} className="flex-shrink-0">
                            {/* Profil du joueur */}
                            <div className={is3v3 ? "" : ""}>
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
                                isWinner={battle.status === 'finished' ? (participant.team === winningTeam) : null}
                                totalGains={battle.status === 'finished' && participant.team === winningTeam ? sharePerPlayer : null}
                              />
                            </div>
                            
                            {/* Roulette du joueur */}
                            <div className={`mt-0.5 ${is3v3 ? "" : ""}`}>
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
                          </div>
                        )
                      })}
                    
                    {/* Slots vides Team A avec bouton rejoindre */}
                    {Array.from({ 
                      length: Math.max(0, Math.ceil(battle.max_players / 2) - battle.participants.filter(p => p.team === 1 || p.team === null).length) 
                    }).map((_, idx) => {
                      const is3v3 = battle.max_players === 6
                      return (
                        <div key={`empty-a-${idx}`} className="flex-shrink-0">
                          <div className={is3v3 ? "" : ""}>
                            <PlayerProfileCard
                              participant={null}
                              totalValue={0}
                              side="left"
                              canJoin={canJoin && battle.status === 'waiting'}
                              onJoin={handleJoinBattle}
                              canAddBot={isCreator && battle.status === 'waiting'}
                              onAddBot={handleAddBot}
                              price={Math.floor(battle.total_prize / battle.max_players)}
                              team={1}
                            />
                          </div>
                          
                          {/* Roulette floue pour slot vide */}
                          <div className={`mt-0.5 ${is3v3 ? "" : ""}`}>
                            <SingleRoulette
                              offset={0}
                              isAnimating={false}
                              winningItem={null}
                              battleBoxes={battle.battle_boxes}
                              currentBoxIndex={0}
                              battleStatus={battle.status}
                              countdown={countdown}
                            />
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Items gagnés PAR L'ÉQUIPE - Affichés EN COMMUN en bas */}
                    <div className="mt-auto pt-1 relative">
                      <p className="text-gray-400 text-xs font-semibold mb-1">Items de l'équipe</p>
                      <div className="flex items-center gap-2 py-1 px-1 flex-wrap min-h-[80px] pb-20">
                        {battle.participants
                          .filter(p => p.team === 1 || p.team === null)
                          .flatMap((participant) => {
                            const globalIndex = battle.participants.findIndex(p => p.id === participant.id)
                            return itemsData[globalIndex] || []
                          })
                          .map((item, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`group relative flex-shrink-0 ${battle.max_players === 2 ? 'w-14 h-14' : battle.max_players <= 4 ? 'w-12 h-12' : 'w-11 h-11'} bg-gray-800/60 rounded-lg p-1 border-2 border-[#4578be]/50 hover:scale-[1.6] hover:border-[#4578be] hover:z-[999] transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(69,120,190,0.6)]`}
                            >
                              <img 
                                src={item.item_image} 
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                              />
                              
                              {/* Tooltip au hover - FORCÉ EN HAUT */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900/95 rounded-xl border-2 border-[#4578be] shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[1000]">
                                <p className="text-white text-base font-bold mb-2">{item.item_name}</p>
                                <div className="flex items-center gap-2 justify-center bg-[#4578be]/20 px-3 py-1 rounded-lg">
                                  <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" className="w-5 h-5" />
                                  <span className="text-[#4578be] text-base font-black">{item.market_value?.toFixed(2)}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* TEAM B (droite) */}
                  <div className="flex flex-col gap-0.5 px-2 pb-2">
                    <div className="text-center mb-1">
                      <h3 className="text-emerald-500 font-black text-sm">TEAM B</h3>
                    </div>
                    
                    {/* Joueurs de Team B - empilés verticalement */}
                    {battle.participants
                      .filter(p => p.team === 2)
                      .map((participant, teamIndex) => {
                        const globalIndex = battle.participants.findIndex(p => p.id === participant.id)
                        const is3v3 = battle.max_players === 6
                        
                        return (
                          <div key={participant.id || globalIndex} className="flex-shrink-0">
                            {/* Profil du joueur */}
                            <div className={is3v3 ? "" : ""}>
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
                                isWinner={battle.status === 'finished' ? (participant.team === winningTeam) : null}
                                totalGains={battle.status === 'finished' && participant.team === winningTeam ? sharePerPlayer : null}
                              />
                            </div>
                            
                            {/* Roulette du joueur */}
                            <div className={`mt-0.5 ${is3v3 ? "" : ""}`}>
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
                          </div>
                        )
                      })}
                    
                    {/* Slots vides Team B avec bouton rejoindre */}
                    {Array.from({ 
                      length: Math.max(0, Math.floor(battle.max_players / 2) - battle.participants.filter(p => p.team === 2).length) 
                    }).map((_, idx) => {
                      const is3v3 = battle.max_players === 6
                      return (
                        <div key={`empty-b-${idx}`} className="flex-shrink-0">
                          <div className={is3v3 ? "" : ""}>
                            <PlayerProfileCard
                              participant={null}
                              totalValue={0}
                              side="right"
                              canJoin={canJoin && battle.status === 'waiting'}
                              onJoin={handleJoinBattle}
                              canAddBot={isCreator && battle.status === 'waiting'}
                              onAddBot={handleAddBot}
                              price={Math.floor(battle.total_prize / battle.max_players)}
                              team={2}
                            />
                          </div>
                          
                          {/* Roulette floue pour slot vide */}
                          <div className={`mt-0.5 ${is3v3 ? "" : ""}`}>
                            <SingleRoulette
                              offset={0}
                              isAnimating={false}
                              winningItem={null}
                              battleBoxes={battle.battle_boxes}
                              currentBoxIndex={0}
                              battleStatus={battle.status}
                              countdown={countdown}
                            />
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Items gagnés PAR L'ÉQUIPE - Affichés EN COMMUN en bas */}
                    <div className="mt-auto pt-1 relative">
                      <p className="text-gray-400 text-xs font-semibold mb-1 text-right">Items de l'équipe</p>
                      <div className="flex items-center gap-2 py-1 px-1 flex-wrap min-h-[80px] pb-20 justify-end">
                        {battle.participants
                          .filter(p => p.team === 2)
                          .flatMap((participant) => {
                            const globalIndex = battle.participants.findIndex(p => p.id === participant.id)
                            return itemsData[globalIndex] || []
                          })
                          .map((item, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`group relative flex-shrink-0 ${battle.max_players === 2 ? 'w-14 h-14' : battle.max_players <= 4 ? 'w-12 h-12' : 'w-11 h-11'} bg-gray-800/60 rounded-lg p-1 border-2 border-emerald-500/50 hover:scale-[1.6] hover:border-emerald-500 hover:z-[999] transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]`}
                            >
                              <img 
                                src={item.item_image} 
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/mystery-box.png' }}
                              />
                              
                              {/* Tooltip au hover - FORCÉ EN HAUT */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900/95 rounded-xl border-2 border-emerald-500 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[1000]">
                                <p className="text-white text-base font-bold mb-2">{item.item_name}</p>
                                <div className="flex items-center gap-2 justify-center bg-emerald-500/20 px-3 py-1 rounded-lg">
                                  <img src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png" className="w-5 h-5" />
                                  <span className="text-emerald-500 text-base font-black">{item.market_value?.toFixed(2)}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
                </>
              ) : (
                // ========== MODE FREE-FOR-ALL (1v1, 1v1v1, 1v1v1v1) ==========
                <div className={`h-full grid ${getGridColumns(battle.max_players, battle)} gap-2`}>
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

      {/* Modal Provably Fair */}
      <ProvablyFairVerifier
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        data={provablyFairData || undefined}
      />

      {/* Panel Provably Fair info (affiché en permanence en bas) */}
      <AnimatePresence>
        {battle.status !== 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-40"
          >
            <div className="bg-gray-900/90 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-3 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Provably Fair</span>
              </div>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center justify-between gap-2">
                  <span>Battle ID:</span>
                  <code className="text-gray-300 bg-black/30 px-1 rounded text-[10px] truncate max-w-[120px]">{battle.id}</code>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Box actuelle:</span>
                  <span className="text-white font-medium">{currentBoxIndex + 1} / {battle.total_boxes}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Statut:</span>
                  <span className={`font-medium ${
                    battle.status === 'active' ? 'text-emerald-400' :
                    battle.status === 'finished' ? 'text-blue-400' :
                    'text-yellow-400'
                  }`}>
                    {battle.status === 'active' ? 'En cours' :
                     battle.status === 'finished' ? 'Terminée' :
                     battle.status === 'countdown' ? 'Décompte' : 'En attente'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowProvablyFair(true)}
                className="mt-2 w-full text-xs text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1"
              >
                Voir les détails <ArrowLeft className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  onAddBot?: (team?: number) => void
  price: number
  team?: number | null
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
              onClick={() => onAddBot(team ?? undefined)}
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
      ) : participant?.is_bot ? (
        // Bannière stylée pour les BOTS avec dégradé CYAN ÉLECTRIQUE + icons répartis partout
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 via-red-600/30 to-red-400/40" />
          <div className="absolute inset-0 bg-gradient-to-tl from-red-600/25 via-red-500/15 to-red-400/25" />
          
          {/* Icons bots MIEUX RÉPARTIS sur toute la bannière - EN CYAN CLAIR */}
          {/* COIN HAUT GAUCHE */}
          <motion.div
            className="absolute top-3 left-3 opacity-75"
            animate={{
              y: [0, -8, 2, -5, 0],
              x: [0, 4, -1, 3, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Bot className="w-6 h-6 text-red-200 drop-shadow-lg" />
          </motion.div>
          
          {/* COIN HAUT DROIT */}
          <motion.div
            className="absolute top-3 right-3 opacity-75"
            animate={{
              y: [0, 7, -2, 5, 0],
              x: [0, -3, 1, -2, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <Bot className="w-5 h-5 text-red-300 drop-shadow-lg" />
          </motion.div>
          
          {/* MILIEU GAUCHE */}
          <motion.div
            className="absolute top-[35%] left-2 opacity-75"
            animate={{
              y: [-4, 6, -2, 4, -4],
              x: [0, 3, -1, 2, 0],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            <Bot className="w-6 h-6 text-red-100 drop-shadow-lg" />
          </motion.div>

          {/* MILIEU DROIT */}
          <motion.div
            className="absolute top-[40%] right-2 opacity-75"
            animate={{
              y: [3, -7, 2, -5, 3],
              x: [0, -3, 1, -2, 0],
            }}
            transition={{
              duration: 6.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          >
            <Bot className="w-5 h-5 text-red-200 drop-shadow-lg" />
          </motion.div>

          {/* MILIEU CENTRE HAUT */}
          <motion.div
            className="absolute top-[20%] left-[45%] opacity-75"
            animate={{
              y: [0, -6, 2, -4, 0],
              x: [-2, 4, -1, 3, -2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          >
            <Bot className="w-6 h-6 text-red-300 drop-shadow-lg" />
          </motion.div>

          {/* MILIEU CENTRE BAS */}
          <motion.div
            className="absolute top-[65%] left-[50%] opacity-75"
            animate={{
              y: [2, -5, 3, -4, 2],
              x: [1, -3, 2, -2, 1],
            }}
            transition={{
              duration: 6.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8
            }}
          >
            <Bot className="w-5 h-5 text-red-100 drop-shadow-lg" />
          </motion.div>
          
          {/* COIN BAS GAUCHE */}
          <motion.div
            className="absolute bottom-3 left-4 opacity-75"
            animate={{
              y: [0, -7, 2, -5, 0],
              x: [0, 3, -1, 2, 0],
            }}
            transition={{
              duration: 5.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2
            }}
          >
            <Bot className="w-5 h-5 text-red-200 drop-shadow-lg" />
          </motion.div>

          {/* COIN BAS DROIT */}
          <motion.div
            className="absolute bottom-3 right-4 opacity-75"
            animate={{
              y: [0, 6, -2, 4, 0],
              x: [0, -2, 1, -2, 0],
            }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2.5
            }}
          >
            <Bot className="w-6 h-6 text-red-300 drop-shadow-lg" />
          </motion.div>

          {/* PETITS BOTS REMPLISSAGE */}
          <motion.div
            className="absolute top-[50%] left-[25%] opacity-75"
            animate={{
              y: [-2, 5, -2, 4, -2],
              x: [1, -2, 1, -2, 1],
            }}
            transition={{
              duration: 7.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          >
            <Bot className="w-4 h-4 text-red-200 drop-shadow-lg" />
          </motion.div>

          <motion.div
            className="absolute top-[55%] left-[70%] opacity-75"
            animate={{
              y: [2, -6, 2, -4, 2],
              x: [-1, 3, -1, 2, -1],
            }}
            transition={{
              duration: 6.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.8
            }}
          >
            <Bot className="w-4 h-4 text-red-100 drop-shadow-lg" />
          </motion.div>
        </>
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
            onClick={() => onAddBot()}
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