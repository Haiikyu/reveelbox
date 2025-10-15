// app/freedrop/page.tsx - Version corrigée avec imports corrects
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/components/AuthProvider'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gift, Clock, Star, Lock, Timer, ArrowRight } from 'lucide-react'
import { LoadingState } from '../components/ui/LoadingState'
import ParticlesBackground from '@/app/components/affiliate/ParticlesBackground'
// Import des types depuis le bon fichier
import type { DailyBox, UserStats } from '@/types/freedrop'

export default function FreedropPage() {
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth()
  const [boxes, setBoxes] = useState<DailyBox[]>([])
  const [todayClaims, setTodayClaims] = useState<any[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeToMidnight, setTimeToMidnight] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  // Timer jusqu'à minuit
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      
      const diff = midnight.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setTimeToMidnight(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [])

  // Protection de route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Validation sécurisée des données
  const validateLootBoxItem = (item: any): boolean => {
    return item && 
           typeof item.probability === 'number' &&
           item.items &&
           typeof item.items.id === 'string' &&
           typeof item.items.name === 'string' &&
           typeof item.items.market_value === 'number' &&
           typeof item.items.rarity === 'string'
  }

  // Transformation sécurisée des données
  const transformSupabaseBox = (data: any): DailyBox | null => {
    try {
      if (!data || typeof data.id !== 'string' || typeof data.name !== 'string') {
        return null
      }

      // Filtrer et valider les loot_box_items
      const validItems = (data.loot_box_items || [])
        .filter(validateLootBoxItem)
        .map((item: any) => ({
          probability: item.probability,
          display_order: item.display_order,
          items: {
            id: item.items.id,
            name: item.items.name,
            description: item.items.description || undefined,
            rarity: item.items.rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
            image_url: item.items.image_url || undefined,
            market_value: item.items.market_value,
            category: item.items.category || undefined
          }
        }))

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        required_level: data.required_level || 1,
        image_url: data.image_url || '',
        rarity: calculateBoxRarity(data.required_level || 1),
        max_value: 100,
        loot_box_items: validItems
      }
    } catch (error) {
      console.error('Erreur transformation box:', error)
      return null
    }
  }

  // Charger les données avec timeout et fallback
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError('')
        
        // Timeout pour éviter le blocage infini
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
        
        const dataPromise = (async () => {
          // Essayer de charger les boxes freedrop
          const { data: boxesData, error: boxesError } = await supabase
            .from('loot_boxes')
            .select(`
              id,
              name,
              description,
              required_level,
              image_url,
              loot_box_items (
                probability,
                display_order,
                items (
                  id,
                  name,
                  rarity,
                  image_url,
                  market_value,
                  description,
                  category
                )
              )
            `)
            .eq('is_daily_free', true)
            .eq('is_active', true)
            .order('required_level', { ascending: true })

          console.log('📦 Boxes chargées:', { boxesData, boxesError })

          if (boxesError) {
            console.warn('Erreur DB, affichage du message approprié:', boxesError)
            return { boxes: [], claims: [], stats: null }
          }

          // Mapper les boxes avec validation stricte
          const mappedBoxes: DailyBox[] = (boxesData || [])
            .map(transformSupabaseBox)
            .filter((box): box is DailyBox => box !== null)

          // Charger les réclamations d'aujourd'hui
          const today = new Date().toISOString().split('T')[0]
          const { data: claimsData } = await supabase
            .from('daily_box_claims')
            .select('daily_box_id, claimed_date')
            .eq('user_id', user.id)
            .eq('claimed_date', today)

          // Stats basiques utilisateur
          const stats: UserStats = {
            level: profile?.level || 1,
            current_exp: profile?.total_exp || 0,
            exp_to_next: 100,
            current_streak: 0,
            longest_streak: 0,
            total_daily_claims: 0
          }

          return { 
            boxes: mappedBoxes, 
            claims: claimsData || [], 
            stats 
          }
        })()

        const result = await Promise.race([dataPromise, timeoutPromise])
        
        setBoxes(result.boxes)
        setTodayClaims(result.claims)
        setUserStats(result.stats)

      } catch (error) {
        console.error('Erreur ou timeout:', error)
        setError('Chargement des freedrops indisponible pour le moment')
        
        // Stats par défaut pour éviter les erreurs
        setUserStats({
          level: profile?.level || 1,
          current_exp: 0,
          exp_to_next: 100,
          current_streak: 0,
          longest_streak: 0,
          total_daily_claims: 0
        })
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && isAuthenticated && user?.id) {
      fetchData()
    }
  }, [authLoading, isAuthenticated, user?.id, profile, supabase])

  const calculateBoxRarity = (requiredLevel: number): 'common' | 'rare' | 'epic' | 'legendary' => {
    if (requiredLevel >= 50) return 'legendary'
    if (requiredLevel >= 20) return 'epic'
    if (requiredLevel >= 10) return 'rare'
    return 'common'
  }

  const canOpenBox = (box: DailyBox): boolean => {
    if (!userStats) return false
    const hasLevel = userStats.level >= box.required_level
    const alreadyClaimed = todayClaims.some(claim => claim.daily_box_id === box.id)
    return hasLevel && !alreadyClaimed
  }

  const getRarityGlow = (rarity: string): string => {
    const glows = {
      common: '#10b981',
      rare: '#3b82f6', 
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    }
    return glows[rarity as keyof typeof glows] || glows.common
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <LoadingState size="lg" text="Chargement des freedrops..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
      {/* Particles Background */}
      <ParticlesBackground />

      {/* Header */}
      <div className="pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl font-black text-gray-900 dark:text-white mb-4 transition-colors flex items-center justify-center"
          >
            <Gift className="inline-block mr-4 mb-2" style={{ color: 'var(--hybrid-accent-primary)' }} size={56} />
            <span style={{
              background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Freedrop
            </span>
          </motion.h1>
          
          {/* Timer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl px-6 py-3 shadow-lg mb-8 text-white"
          >
            <Timer size={24} />
            <span className="text-lg font-bold">Reset dans {timeToMidnight}</span>
          </motion.div>

          {/* Stats utilisateur */}
          {userStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="text-yellow-500" size={20} />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Niveau</span>
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{userStats.level}</div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="" style={{ color: 'var(--hybrid-accent-primary)' }} size={20} />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Expérience</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {userStats.current_exp}/100
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min((userStats.current_exp % 100), 100)}%`,
                      background: `linear-gradient(90deg, var(--hybrid-accent-primary), var(--hybrid-accent-secondary))`
                    }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="" style={{ color: 'var(--hybrid-accent-primary)' }} size={20} />
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total ouvertes</span>
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white">{userStats.total_daily_claims}</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Message d'erreur ou contenu */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Les freedrops seront bientôt disponibles ! Revenez plus tard.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              Réessayer
            </button>
          </motion.div>
        ) : boxes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">🎁</div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Freedrops en préparation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
              Les administrateurs n'ont pas encore configuré de freedrops quotidiennes.<br/>
              Revenez bientôt pour découvrir vos récompenses gratuites !
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12"
          >
            {boxes.map((box) => (
              <FreedropBoxCard
                key={box.id}
                box={box}
                userStats={userStats}
                canOpen={canOpenBox(box)}
                getRarityGlow={getRarityGlow}
                router={router}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Composant FreedropBoxCard
interface FreedropBoxCardProps {
  box: DailyBox
  userStats: UserStats | null
  canOpen: boolean
  getRarityGlow: (rarity: string) => string
  router: any
}

function FreedropBoxCard({ box, userStats, canOpen, getRarityGlow, router }: FreedropBoxCardProps) {
  const glowColor = getRarityGlow(box.rarity)
  const isLocked = !userStats || userStats.level < box.required_level

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={canOpen ? { y: -10, scale: 1.02 } : {}}
      className={`group relative ${canOpen ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={() => canOpen && router.push(`/freedrop/${box.id}`)}
    >
      <div className="">
        
        {/* Badge niveau */}
        <div className="absolute -top-2 -left-2 z-10">
          <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
            isLocked ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            LVL {box.required_level}
          </div>
        </div>

        {/* Image */}
        <div className="relative mb-4">
          <img
            src={box.image_url || 'https://via.placeholder.com/200x200/F3F4F6/9CA3AF?text=Box'}
            alt={box.name}
            className="w-full h-32 object-contain"
            style={{
              filter: canOpen ? `drop-shadow(0 10px 20px ${glowColor}30)` : 'grayscale(0.5)'
            }}
          />
          
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
              <Lock size={24} className="text-white" />
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="text-center">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">{box.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{box.description}</p>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gift size={16} style={{ color: canOpen ? glowColor : '#9CA3AF' }} />
            <span className="font-bold" style={{ color: canOpen ? glowColor : '#9CA3AF' }}>FREE</span>
          </div>

          <div className={`text-sm font-medium ${
            isLocked ? 'text-red-500' : canOpen ? 'text-green-600' : 'text-blue-600'
          }`}>
            {isLocked 
              ? `Niveau ${box.required_level} requis` 
              : canOpen 
              ? 'Disponible' 
              : 'Déjà réclamée'
            }
          </div>

          {canOpen && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <ArrowRight size={12} />
                Cliquer pour ouvrir
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}