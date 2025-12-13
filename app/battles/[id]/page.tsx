// app/battles/[id]/page.tsx - Version sécurisée avec tirage unique
'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Users, Bot, Crown, Loader2, Coins, X } from 'lucide-react'
import { BattleWheel } from '@/app/components/BattleWheel/BattleWheel'

const supabase = createClient()

interface LootBox {
  id: string
  name: string
  image_url: string
  price_virtual: number
}

interface Item {
  id: string
  name: string
  image_url: string
  market_value: number
  rarity: string
}

interface BattleBox {
  id: string
  loot_box_id: string
  quantity: number
  order_position: number
  loot_box: LootBox
}

interface BattleParticipant {
  id: string
  user_id: string | null
  is_bot: boolean
  bot_name: string | null
  bot_avatar_url: string | null
  position: number
  total_value: number
  profiles?: {
    username: string
    avatar_url: string
  }
}

interface Battle {
  id: string
  mode: string
  status: string
  max_players: number
  entry_cost: number
  winner_user_id: string | null
  has_bots: boolean
  creator_id: string
  battle_boxes: BattleBox[]
  battle_participants: BattleParticipant[]
}

interface BattleOpening {
  id: string
  participant_id: string
  item_id: string
  loot_box_id: string
  item_value: number
  item_rarity: string
  opened_at: string
  items: Item
}

interface OpeningResult {
  item: Item
  box_id: string
  box_name: string
}

// Icône de coin
function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <img
      src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
      alt="Coins"
      className="inline-block"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        verticalAlign: 'middle'
      }}
    />
  )
}

// Effet visuel selon la rareté
const getRarityGlow = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 'shadow-[0_0_30px_rgba(251,191,36,0.8)] animate-pulse'
    case 'epic':
      return 'shadow-[0_0_25px_rgba(168,85,247,0.7)]'
    case 'rare':
      return 'shadow-[0_0_20px_rgba(59,130,246,0.6)]'
    case 'uncommon':
      return 'shadow-[0_0_15px_rgba(34,197,94,0.5)]'
    default:
      return ''
  }
}

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 'border-yellow-500 bg-yellow-500/10'
    case 'epic':
      return 'border-purple-500 bg-purple-500/10'
    case 'rare':
      return 'border-blue-500 bg-blue-500/10'
    case 'uncommon':
      return 'border-green-500 bg-green-500/10'
    default:
      return 'border-gray-500 bg-gray-500/10'
  }
}

export default function BattleRoom({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const battleId = resolvedParams.id
  const router = useRouter()

  const [battle, setBattle] = useState<Battle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0)
  const [player1Results, setPlayer1Results] = useState<OpeningResult[]>([])
  const [player2Results, setPlayer2Results] = useState<OpeningResult[]>([])
  const [currentPlayer1Result, setCurrentPlayer1Result] = useState<OpeningResult | null>(null)
  const [currentPlayer2Result, setCurrentPlayer2Result] = useState<OpeningResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null)
  const [isWheel1Spinning, setIsWheel1Spinning] = useState(false)
  const [isWheel2Spinning, setIsWheel2Spinning] = useState(false)
  const [allOpenings, setAllOpenings] = useState<BattleOpening[]>([])
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [isJoining, setIsJoining] = useState(false)
  const [canJoin, setCanJoin] = useState(false)

  const hasStartedOpening = useRef(false)
  const hasGeneratedOpenings = useRef(false)
  const wheel1FinishedRef = useRef(false)
  const wheel2FinishedRef = useRef(false)
  const isLoadingBattle = useRef(false)
  const hasFinalized = useRef(false)

  useEffect(() => {
    hasStartedOpening.current = false
    hasGeneratedOpenings.current = false
    loadCurrentUser().then(() => {
      loadBattle()
    })

    const channel = supabase
      .channel(`battle:${battleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'battle_participants',
        filter: `battle_id=eq.${battleId}`
      }, () => {
        loadBattle()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'battles',
        filter: `id=eq.${battleId}`
      }, () => {
        loadBattle()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [battleId])

  // Re-check canJoin when currentUser or battle changes
  useEffect(() => {
    if (battle && currentUser) {
      const isWaiting = battle.status === 'waiting'
      const hasRoom = battle.battle_participants.length < battle.max_players
      const isAlreadyParticipant = battle.battle_participants.some((p: any) => p.user_id === currentUser.id)
      setCanJoin(isWaiting && hasRoom && !isAlreadyParticipant)
    } else {
      setCanJoin(false)
    }
  }, [battle, currentUser])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const loadBattle = async () => {
    // Éviter les appels récursifs
    if (isLoadingBattle.current) {
      return
    }

    isLoadingBattle.current = true
    try {
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          battle_boxes(
            *,
            loot_box:loot_boxes(*)
          ),
          battle_participants(
            *,
            profiles(username, avatar_url)
          )
        `)
        .eq('id', battleId)
        .single()

      if (error) throw error

      const sortedData = {
        ...data,
        battle_boxes: [...data.battle_boxes].sort((a: any, b: any) => a.order_position - b.order_position)
      }

      setBattle(sortedData as any)
      setLoading(false)

      // Auto-fill avec bots SEULEMENT si has_bots est true
      if (data.has_bots && data.battle_participants.length < data.max_players && data.status === 'waiting') {
        const botsNeeded = data.max_players - data.battle_participants.length
        isLoadingBattle.current = false // Permettre le prochain appel
        for (let i = 0; i < botsNeeded; i++) {
          await addBot(data.id, data.battle_participants.length + 1 + i)
        }
        await loadBattle()
        return
      }

      // Transition vers countdown
      if (data.battle_participants.length === data.max_players && data.status === 'waiting') {
        console.log('🎮 Tous les joueurs sont là ! Démarrage de la battle...')
        await supabase
          .from('battles')
          .update({ status: 'countdown' })
          .eq('id', battleId)

        // Générer immédiatement les tirages
        if (!hasGeneratedOpenings.current) {
          hasGeneratedOpenings.current = true
          isLoadingBattle.current = false
          await generateAllOpenings()
        }
        return
      }

      // Générer les tirages si status = countdown (backup au cas où)
      if (data.status === 'countdown' && !hasGeneratedOpenings.current) {
        hasGeneratedOpenings.current = true
        await generateAllOpenings()
      }

      // Charger les tirages si status = active
      if (data.status === 'active' && !hasStartedOpening.current) {
        hasStartedOpening.current = true
        await loadAndDisplayOpenings(sortedData as any)
      }

      // Afficher les résultats si finished
      if (data.status === 'finished') {
        await loadAndShowFinalResults(sortedData as any)
      }
    } catch (err: any) {
      console.error('Error loading battle:', err)
      setError(err.message)
      setLoading(false)
    } finally {
      isLoadingBattle.current = false
    }
  }

  const addBot = async (battleId: string, position: number) => {
    const botNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega']
    const botName = botNames[Math.floor(Math.random() * botNames.length)]

    await supabase
      .from('battle_participants')
      .insert({
        battle_id: battleId,
        is_bot: true,
        bot_name: botName,
        bot_avatar_url: '/bot-avatar.png',
        position,
        total_value: 0
      })
  }

  const generateAllOpenings = async () => {
    setIsGenerating(true)
    try {
      const { data, error } = await supabase.rpc('generate_all_battle_openings', {
        p_battle_id: battleId
      })

      if (error) throw error

      console.log('✅ All openings generated:', data)

      // Passer la battle en mode 'active' pour démarrer l'affichage
      await supabase
        .from('battles')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', battleId)

    } catch (error) {
      console.error('Error generating openings:', error)
      setError('Failed to generate battle openings')
    } finally {
      setIsGenerating(false)
    }
  }

  const loadAndDisplayOpenings = async (battleData: Battle) => {
    try {
      // Charger tous les tirages depuis la DB
      const { data: openings, error } = await supabase
        .from('battle_openings')
        .select(`
          *,
          items(*)
        `)
        .eq('battle_id', battleId)
        .order('opened_at', { ascending: true })

      if (error) throw error
      if (!openings || openings.length === 0) {
        setError('No openings found')
        return
      }

      setAllOpenings(openings as any)
      setIsOpening(true)

      // Démarrer l'affichage séquentiel
      await displayOpeningsSequentially(battleData, openings as any)
    } catch (error) {
      console.error('Error loading openings:', error)
      setError('Failed to load battle openings')
    }
  }

  const displayOpeningsSequentially = async (battleData: Battle, openings: BattleOpening[]) => {
    const player1 = battleData.battle_participants.find(p => p.position === 1)
    const player2 = battleData.battle_participants.find(p => p.position === 2)

    if (!player1 || !player2) return

    // Grouper les openings par box
    const openingsByBox: { [key: number]: BattleOpening[] } = {}

    battleData.battle_boxes.forEach((box, idx) => {
      openingsByBox[idx] = openings.filter(o => o.loot_box_id === box.loot_box_id)
    })

    // Afficher box par box
    for (let boxIndex = 0; boxIndex < battleData.battle_boxes.length; boxIndex++) {
      setCurrentBoxIndex(boxIndex)

      const boxOpenings = openingsByBox[boxIndex]
      const p1Opening = boxOpenings.find(o => o.participant_id === player1.id)
      const p2Opening = boxOpenings.find(o => o.participant_id === player2.id)

      if (!p1Opening || !p2Opening) continue

      const result1: OpeningResult = {
        item: p1Opening.items,
        box_id: p1Opening.loot_box_id,
        box_name: battleData.battle_boxes[boxIndex].loot_box.name
      }

      const result2: OpeningResult = {
        item: p2Opening.items,
        box_id: p2Opening.loot_box_id,
        box_name: battleData.battle_boxes[boxIndex].loot_box.name
      }

      setCurrentPlayer1Result(result1)
      setCurrentPlayer2Result(result2)

      setIsWheel1Spinning(true)
      setIsWheel2Spinning(true)

      // Attendre que les deux roues finissent
      await new Promise<void>(resolve => {
        const checkFinished = () => {
          if (wheel1FinishedRef.current && wheel2FinishedRef.current) {
            resolve()
          } else {
            setTimeout(checkFinished, 100)
          }
        }
        checkFinished()
      })

      setIsWheel1Spinning(false)
      setIsWheel2Spinning(false)

      setPlayer1Results(prev => [...prev, result1])
      setPlayer2Results(prev => [...prev, result2])

      // Délai de 2 secondes entre les rounds
      await new Promise(resolve => setTimeout(resolve, 2000))

      setCurrentPlayer1Result(null)
      setCurrentPlayer2Result(null)

      wheel1FinishedRef.current = false
      wheel2FinishedRef.current = false

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsOpening(false)
    await showWinner(battleData)
  }

  const showWinner = async (battleData: Battle) => {
    const player1 = battleData.battle_participants.find(p => p.position === 1)
    const player2 = battleData.battle_participants.find(p => p.position === 2)

    if (player1 && player2) {
      if (player1.total_value > player2.total_value) {
        setWinner('player1')
      } else if (player2.total_value > player1.total_value) {
        setWinner('player2')
      } else {
        // Coinflip
        setWinner(Math.random() < 0.5 ? 'player1' : 'player2')
      }
    }

    // CORRECTION CRITIQUE: Appeler finalize_battle UNE SEULE FOIS
    if (!hasFinalized.current) {
      hasFinalized.current = true
      try {
        const { data, error } = await supabase.rpc('finalize_battle', {
          p_battle_id: battleId
        })

        if (error) {
          console.error('Erreur lors de la finalisation de la battle:', error)
        } else {
          console.log('Battle finalisée avec succès, items distribués au gagnant')
        }
      } catch (error) {
        console.error('Erreur critique lors de la finalisation:', error)
      }
    }

    setShowResults(true)
  }

  const loadAndShowFinalResults = async (battleData: Battle) => {
    // Charger et afficher directement les résultats finaux
    const { data: openings } = await supabase
      .from('battle_openings')
      .select(`*, items(*)`)
      .eq('battle_id', battleId)

    if (openings) {
      const player1 = battleData.battle_participants.find(p => p.position === 1)
      const player2 = battleData.battle_participants.find(p => p.position === 2)

      const p1Openings = openings.filter((o: any) => o.participant_id === player1?.id)
      const p2Openings = openings.filter((o: any) => o.participant_id === player2?.id)

      const p1Results = p1Openings.map((o: any) => ({
        item: o.items,
        box_id: o.loot_box_id,
        box_name: 'Box'
      }))

      const p2Results = p2Openings.map((o: any) => ({
        item: o.items,
        box_id: o.loot_box_id,
        box_name: 'Box'
      }))

      setPlayer1Results(p1Results)
      setPlayer2Results(p2Results)

      await showWinner(battleData)
    }
  }

  const onWheel1Finish = useCallback(() => {
    wheel1FinishedRef.current = true
  }, [])

  const onWheel2Finish = useCallback(() => {
    wheel2FinishedRef.current = true
  }, [])

  const joinBattle = async () => {
    if (!currentUser || !battle || isJoining) return

    setIsJoining(true)
    try {
      // Vérifier le solde de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('virtual_currency')
        .eq('id', currentUser.id)
        .single()

      if (!profile) {
        alert('Profil non trouvé')
        return
      }

      const userBalance = parseFloat(profile.virtual_currency)
      if (userBalance < battle.entry_cost) {
        alert('Solde insuffisant pour rejoindre cette battle')
        return
      }

      // Trouver la prochaine position disponible
      const nextPosition = Math.max(...battle.battle_participants.map(p => p.position)) + 1

      // Ajouter le joueur comme participant
      const { error: participantError } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: battleId,
          user_id: currentUser.id,
          position: nextPosition,
          team: nextPosition,
          is_ready: true,
          has_paid: true,
          total_value: 0
        })

      if (participantError) throw participantError

      // Déduire le coût
      await supabase
        .from('profiles')
        .update({
          virtual_currency: (userBalance - battle.entry_cost).toString()
        })
        .eq('id', currentUser.id)

      // Créer une transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
          type: 'battle_entry',
          virtual_amount: -battle.entry_cost,
          battle_id: battleId,
          description: `Battle entry: ${battle.mode}`
        })

      // Recharger la battle
      await loadBattle()
    } catch (error) {
      console.error('Error joining battle:', error)
      alert('Erreur lors de la jointure à la battle')
    } finally {
      setIsJoining(false)
    }
  }

  const replayBattle = async () => {
    if (!battle || !currentUser) return

    try {
      // Récupérer les informations de la battle
      const entryCost = battle.entry_cost
      const battleBoxesData = battle.battle_boxes.map((box, index) => ({
        loot_box_id: box.loot_box_id,
        quantity: box.quantity || 1,
        order_position: index + 1,
        cost_per_box: Math.floor(box.loot_box.price_virtual)
      }))

      // Créer une nouvelle battle identique
      const { data: newBattle, error: battleError } = await supabase
        .from('battles')
        .insert({
          name: battle.name || `Battle ${battle.mode}`,
          mode: battle.mode,
          max_players: battle.max_players,
          entry_cost: entryCost,
          total_prize: entryCost * battle.max_players,
          status: 'waiting',
          creator_id: currentUser.id,
          total_boxes: battle.battle_boxes.reduce((sum, box) => sum + (box.quantity || 1), 0),
          has_bots: false,
          bots_count: 0
        })
        .select()
        .single()

      if (battleError) throw battleError

      // Ajouter les boxes
      const boxesWithBattleId = battleBoxesData.map(box => ({
        ...box,
        battle_id: newBattle.id
      }))

      const { error: boxesError } = await supabase
        .from('battle_boxes')
        .insert(boxesWithBattleId)

      if (boxesError) throw boxesError

      // Ajouter le joueur comme participant
      const { error: participantError } = await supabase
        .from('battle_participants')
        .insert({
          battle_id: newBattle.id,
          user_id: currentUser.id,
          position: 1,
          team: 1,
          is_ready: true,
          has_paid: true
        })

      if (participantError) throw participantError

      // Déduire le coût
      const { data: profile } = await supabase
        .from('profiles')
        .select('virtual_currency')
        .eq('id', currentUser.id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            virtual_currency: (parseFloat(profile.virtual_currency) - entryCost).toString()
          })
          .eq('id', currentUser.id)

        await supabase
          .from('transactions')
          .insert({
            user_id: currentUser.id,
            type: 'battle_entry',
            virtual_amount: -entryCost,
            battle_id: newBattle.id,
            description: `Battle entry: ${newBattle.name}`
          })
      }

      // Rediriger vers la nouvelle battle
      window.location.href = `/battles/${newBattle.id}`
    } catch (error) {
      console.error('Error replaying battle:', error)
      alert('Erreur lors de la création de la battle')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-lg">Loading battle...</div>
        </div>
      </div>
    )
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">{error || 'Battle not found'}</div>
      </div>
    )
  }

  const player1 = battle.battle_participants.find(p => p.position === 1)
  const player2 = battle.battle_participants.find(p => p.position === 2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Utilisation optimale de l'espace selon la taille d'écran */}
      <div className="mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 max-w-[100vw] 2xl:max-w-[1920px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/battles')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Battles
          </button>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Crown className="text-yellow-500" size={20} sm-size={24} />
                  <span className="text-white text-lg sm:text-xl font-bold">{battle.mode.toUpperCase()}</span>
                </div>
                <div className="h-6 w-px bg-white/20 hidden sm:block" />
                <div className="flex items-center gap-2 text-white/80">
                  <Users size={18} />
                  <span className="text-sm sm:text-base">{battle.battle_participants.length}/{battle.max_players}</span>
                </div>
                {/* Compteur de spectateurs discret */}
                {spectatorCount > 0 && (
                  <>
                    <div className="h-6 w-px bg-white/20" />
                    <div className="flex items-center gap-1.5 text-white/40 text-xs sm:text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>{spectatorCount} watching</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {canJoin && (
                  <motion.button
                    onClick={joinBattle}
                    disabled={isJoining}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <>
                        <Users size={18} />
                        <span>Rejoindre - {battle.entry_cost}</span>
                        <CoinIcon size={18} />
                      </>
                    )}
                  </motion.button>
                )}
                {battle.status === 'waiting' && battle.battle_participants.length < battle.max_players && currentUser && battle.creator_id === currentUser.id && (
                  <button
                    onClick={() => addBot(battleId, battle.battle_participants.length + 1)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Bot size={16} />
                    Call Bot
                  </button>
                )}
                <div className="flex flex-col items-end gap-1">
                  <div className="text-white/40 text-[10px] uppercase">Valeur totale unboxée</div>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
                    <CoinIcon size={16} />
                    <span className="text-green-500 font-bold text-sm sm:text-base">
                      {(player1Results.reduce((sum, r) => sum + r.item.market_value, 0) +
                        player2Results.reduce((sum, r) => sum + r.item.market_value, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading Overlay pour génération */}
        <AnimatePresence>
          {(isGenerating || battle.status === 'countdown') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm"
            >
              <motion.div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <div className="text-white text-xl font-semibold">
                  {isGenerating ? 'Generating battle...' : 'Starting battle...'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players Header - Redesignées avec plus d'infos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Player 1 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative bg-gradient-to-r from-blue-500/10 to-transparent backdrop-blur-md rounded-xl p-3 sm:p-4 border-2 transition-all ${
              player1 && player2 && player1.total_value > player2.total_value
                ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                : 'border-blue-500/30'
            }`}
          >
            {/* Couronne pour le leader */}
            {player1 && player2 && player1.total_value > player2.total_value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
              >
                <Crown size={14} />
                LEADER
              </motion.div>
            )}

            <div className="flex items-start gap-3 mb-3">
              {/* Avatar avec pulse si en tête */}
              <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-blue-500 ${
                player1 && player2 && player1.total_value > player2.total_value ? 'animate-pulse' : ''
              }`}>
                {player1?.is_bot ? (
                  <img
                    src="/images/bot-avatar.svg"
                    alt="Bot"
                    className="w-full h-full object-cover bg-gradient-to-br from-blue-500 to-blue-700"
                  />
                ) : (
                  <img
                    src={player1?.profiles?.avatar_url || '/images/bot-avatar.svg'}
                    alt="Player 1"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/images/bot-avatar.svg' }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-blue-400 text-xs font-semibold uppercase">Player 1</div>
                <div className="text-white font-bold truncate text-sm sm:text-base">
                  {player1?.is_bot ? player1?.bot_name : player1?.profiles?.username || 'Player 1'}
                </div>
                {!player1?.is_bot && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                    <span>Lvl 12</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Trophy size={12} className="text-yellow-500" />
                      25 wins
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-white/50 text-[10px] sm:text-xs mb-0.5">Valeur unboxée</div>
                <div className="text-green-500 text-base sm:text-xl font-bold flex items-center gap-1">
                  <Coins size={14} />
                  <span className="truncate">{player1Results.reduce((sum, r) => sum + r.item.market_value, 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-white/50 text-[10px] sm:text-xs mb-0.5">Meilleur item</div>
                <div className="text-yellow-500 text-base sm:text-xl font-bold flex items-center gap-1">
                  <Coins size={14} />
                  <span className="truncate">
                    {player1Results.length > 0
                      ? Math.max(...player1Results.map(r => r.item.market_value)).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Player 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative bg-gradient-to-l from-red-500/10 to-transparent backdrop-blur-md rounded-xl p-3 sm:p-4 border-2 transition-all ${
              !player2 && battle.status === 'waiting'
                ? 'border-white/20 border-dashed'
                : player1 && player2 && player2.total_value > player1.total_value
                ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'border-red-500/30'
            }`}
          >
            {/* Couronne pour le leader */}
            {player1 && player2 && player2.total_value > player1.total_value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
              >
                <Crown size={14} />
                LEADER
              </motion.div>
            )}

            <div className="flex items-start gap-3 mb-3">
              <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 ${
                !player2 && battle.status === 'waiting'
                  ? 'border-white/20 bg-white/5'
                  : 'border-red-500'
              } ${
                player1 && player2 && player2.total_value > player1.total_value ? 'animate-pulse' : ''
              }`}>
                {!player2 && battle.status === 'waiting' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users size={28} className="text-white/30" />
                  </div>
                ) : player2?.is_bot ? (
                  <img
                    src="/images/bot-avatar.svg"
                    alt="Bot"
                    className="w-full h-full object-cover bg-gradient-to-br from-red-500 to-red-700"
                  />
                ) : (
                  <img
                    src={player2?.profiles?.avatar_url || '/images/bot-avatar.svg'}
                    alt="Player 2"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/images/bot-avatar.svg' }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold uppercase ${
                  !player2 && battle.status === 'waiting' ? 'text-white/40' : 'text-red-400'
                }`}>
                  {!player2 && battle.status === 'waiting' ? 'En attente' : 'Player 2'}
                </div>
                <div className={`font-bold truncate text-sm sm:text-base ${
                  !player2 && battle.status === 'waiting' ? 'text-white/40' : 'text-white'
                }`}>
                  {!player2 && battle.status === 'waiting'
                    ? 'Waiting...'
                    : player2?.is_bot
                    ? player2?.bot_name
                    : player2?.profiles?.username || 'Player 2'
                  }
                </div>
                {player2 && !player2?.is_bot && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                    <span>Lvl 12</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Trophy size={12} className="text-yellow-500" />
                      25 wins
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-white/50 text-[10px] sm:text-xs mb-0.5">Valeur unboxée</div>
                <div className="text-green-500 text-base sm:text-xl font-bold flex items-center gap-1">
                  <Coins size={14} />
                  <span className="truncate">{player2Results.reduce((sum, r) => sum + r.item.market_value, 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-white/50 text-[10px] sm:text-xs mb-0.5">Meilleur item</div>
                <div className="text-yellow-500 text-base sm:text-xl font-bold flex items-center gap-1">
                  <Coins size={14} />
                  <span className="truncate">
                    {player2Results.length > 0
                      ? Math.max(...player2Results.map(r => r.item.market_value)).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

        {/* Loot List pour chaque joueur - sous les stats */}
        {isOpening && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Player 1 Loot List */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-blue-500/30">
              <div className="text-blue-400 text-sm font-semibold mb-3 flex items-center gap-2">
                <Trophy size={16} />
                Items de {player1?.profiles?.username || player1?.bot_name || 'Player 1'}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {player1Results.length === 0 ? (
                  <div className="text-white/40 text-center py-8 text-sm">Aucun item pour le moment...</div>
                ) : (
                  player1Results.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center gap-3 bg-black/30 rounded-lg p-2 border ${getRarityColor(result.item.rarity)}`}
                    >
                      <img
                        src={result.item.image_url}
                        alt={result.item.name}
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{result.item.name}</div>
                        <div className="text-white/60 text-xs capitalize">{result.item.rarity}</div>
                      </div>
                      <div className="text-green-500 font-bold text-sm flex items-center gap-1 whitespace-nowrap">
                        <Coins size={14} />
                        {result.item.market_value.toFixed(2)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Player 2 Loot List */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-red-500/30">
              <div className="text-red-400 text-sm font-semibold mb-3 flex items-center gap-2">
                <Trophy size={16} />
                Items de {player2?.profiles?.username || player2?.bot_name || 'Player 2'}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {player2Results.length === 0 ? (
                  <div className="text-white/40 text-center py-8 text-sm">Aucun item pour le moment...</div>
                ) : (
                  player2Results.map((result, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-center gap-3 bg-black/30 rounded-lg p-2 border ${getRarityColor(result.item.rarity)}`}
                    >
                      <img
                        src={result.item.image_url}
                        alt={result.item.name}
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{result.item.name}</div>
                        <div className="text-white/60 text-xs capitalize">{result.item.rarity}</div>
                      </div>
                      <div className="text-green-500 font-bold text-sm flex items-center gap-1 whitespace-nowrap">
                        <Coins size={14} />
                        {result.item.market_value.toFixed(2)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Battle Progress */}
        {isOpening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Opening Progress</span>
              <span className="text-white font-semibold">
                Box {currentBoxIndex + 1} / {battle.battle_boxes.length}
              </span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{
                  width: `${((currentBoxIndex) / battle.battle_boxes.length) * 100}%`
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {/* Wheels */}
        {isOpening && battle.battle_boxes.length > 0 && currentBoxIndex < battle.battle_boxes.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <BattleWheel
              lootBoxId={battle.battle_boxes[currentBoxIndex]?.loot_box?.id}
              winningItem={currentPlayer1Result?.item || null}
              onFinish={onWheel1Finish}
              isSpinning={isWheel1Spinning}
              playerSide="left"
            />
            <BattleWheel
              lootBoxId={battle.battle_boxes[currentBoxIndex]?.loot_box?.id}
              winningItem={currentPlayer2Result?.item || null}
              onFinish={onWheel2Finish}
              isSpinning={isWheel2Spinning}
              playerSide="right"
            />
          </motion.div>
        )}

        {/* Results Modal - Design épuré et professionnel */}
        <AnimatePresence>
          {showResults && winner && (() => {
            const winningPlayer = winner === 'player1' ? player1 : player2
            // CORRECTION: Afficher TOUS les items de la battle, pas seulement ceux du gagnant
            const allBattleItems = [...player1Results, ...player2Results]
            const winnerName = winningPlayer?.is_bot
              ? winningPlayer?.bot_name
              : winningPlayer?.profiles?.username

            // Avatar par défaut pour les bots
            const DEFAULT_BOT_AVATAR = '/images/bot-avatar.svg'
            const winnerAvatar = winningPlayer?.is_bot
              ? DEFAULT_BOT_AVATAR
              : winningPlayer?.profiles?.avatar_url

            // Calculer la valeur totale de TOUS les items
            const totalValue = allBattleItems.reduce((sum, r) => sum + r.item.market_value, 0)

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-3xl w-full shadow-2xl relative"
                >
                  {/* Bouton de fermeture */}
                  <button
                    onClick={() => setShowResults(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>

                  {/* Header simple */}
                  <div className="text-center mb-6">
                    <Trophy className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      Victoire !
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Battle terminée
                    </p>
                  </div>

                  {/* Gagnant */}
                  <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <img
                      src={winnerAvatar || DEFAULT_BOT_AVATAR}
                      alt={winnerName || 'Winner'}
                      className="w-16 h-16 rounded-full border-2 border-green-500 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_BOT_AVATAR
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gagnant</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{winnerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Valeur totale</p>
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-green-500" />
                        <span className="text-xl font-bold text-green-500">
                          {totalValue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tous les items de la battle */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Objets de la battle ({allBattleItems.length})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {allBattleItems.map((result, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                        >
                          <img
                            src={result.item.image_url}
                            alt={result.item.name}
                            className="w-full h-16 object-contain mb-2"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate text-center mb-1">
                            {result.item.name}
                          </p>
                          <div className="flex items-center justify-center gap-1">
                            <Coins className="w-3 h-3 text-green-500" />
                            <span className="text-xs font-semibold text-green-500">
                              {result.item.market_value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-3">
                    <button
                      onClick={replayBattle}
                      className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      🔄 Rejouer
                    </button>
                    <button
                      onClick={() => router.push('/battles')}
                      className="flex-1 px-4 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
                    >
                      Retour aux battles
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </div>
    </div>
  )
}
