'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { User, UserPlus, UserCheck, Clock, Flame, Plus, MapPin, Shield, Crown, Eye, Users, X, Check, ShieldOff } from 'lucide-react'
import { getUsernameStyle } from '@/utils/usernameStyle'
import { sanitizeSvg } from '@/utils/sanitizeSvg'
import { getUserLevelInfo } from '@/lib/xp-system'
import type { ProfileCosmetics } from '@/app/hooks/useProfileCosmetics'

interface ProfileHeroProps {
  username: string | null
  avatarUrl: string | null
  level: number
  totalExp: number
  streak: number
  totalCoinsPlayed?: number
  bio?: string | null
  location?: string | null
  cosmetics: ProfileCosmetics
  isOwnProfile: boolean
  hasCustomBackground?: boolean
  friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked'
  onAddFriend?: () => void
  onCancelRequest?: () => void
  onAcceptRequest?: () => void
  onDeclineRequest?: () => void
  onUnblock?: () => void
  /** Rang global XP du joueur (depuis useProfileStats.globalRank) */
  globalRank?: number
  /** Nombre de visites du profil ce mois (seulement pour isOwnProfile) */
  profileViews?: number
  /** Amis en commun avec l'utilisateur courant */
  mutualFriends?: { id: string; username: string | null; avatar_url: string | null }[]
  /** ID d'une battle active du profil cible */
  activeBattleId?: string | null
}

function getRankInfo(level: number): { label: string; color: string; glow: string } {
  if (level >= 100) return { label: 'Légendaire', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' }
  if (level >= 50)  return { label: 'Maître',     color: '#a855f7', glow: 'rgba(168,85,247,0.35)' }
  if (level >= 25)  return { label: 'Expert',     color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' }
  if (level >= 10)  return { label: 'Vétéran',    color: '#10b981', glow: 'rgba(16,185,129,0.3)' }
  return              { label: 'Recrue',          color: '#6b7280', glow: 'rgba(107,114,128,0.25)' }
}

export default function ProfileHero({
  username,
  avatarUrl,
  level,
  totalExp,
  streak,
  totalCoinsPlayed = 0,
  bio,
  location,
  cosmetics,
  isOwnProfile,
  hasCustomBackground = false,
  friendshipStatus = 'none',
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onUnblock,
  globalRank,
  profileViews,
  mutualFriends,
  activeBattleId,
}: ProfileHeroProps) {
  const { progressPercentage, currentLevelExp, expToNextLevel } = getUserLevelInfo(totalExp)
  const nameStyle = cosmetics.nameColor
    ? getUsernameStyle(cosmetics.nameColor, cosmetics.nameColorIsGradient)
    : {}
  const rank = getRankInfo(level)

  return (
    <div className="relative w-full" style={{ height: 'clamp(340px, 52vh, 500px)' }}>
      {/* Banner — full bleed */}
      <div className="absolute inset-0">
        {cosmetics.bannerContent ? (
          cosmetics.bannerType === 'svg' ? (
            <div
              className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover"
              style={{ opacity: 0.65 }}
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(cosmetics.bannerContent) }}
            />
          ) : (
            <img
              src={cosmetics.bannerContent}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.65 }}
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2840] via-[#111827] to-[#0b1120]" />
        )}

        {/* Cinematic gradient overlays */}
        {hasCustomBackground ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b1120]/60 via-transparent to-transparent" />
          </>
        )}
      </div>

      {/* Content — positioned at bottom */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 pb-8">
          <div className="flex items-end gap-5 sm:gap-7">

            {/* Avatar with shop frame */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="relative flex-shrink-0"
            >
              <div
                className="relative w-[88px] h-[88px] sm:w-[108px] sm:h-[108px] md:w-[124px] md:h-[124px] rounded-2xl overflow-hidden"
                style={{ boxShadow: `0 0 48px ${rank.glow}, 0 8px 32px rgba(0,0,0,0.5)` }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#4578be] to-[#5989d8] flex items-center justify-center">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                )}
              </div>
              {/* Frame overlay from shop */}
              {cosmetics.frameContent && (
                cosmetics.frameType === 'svg' ? (
                  <div
                    className="absolute pointer-events-none [&>svg]:w-full [&>svg]:h-full"
                    style={{ top: -4, left: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)' }}
                    dangerouslySetInnerHTML={{ __html: sanitizeSvg(cosmetics.frameContent) }}
                  />
                ) : (
                  <img
                    src={cosmetics.frameContent}
                    alt=""
                    className="absolute pointer-events-none object-contain"
                    style={{ top: -4, left: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)' }}
                  />
                )
              )}
              {/* Level badge */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black text-white border border-white/10"
                style={{ background: `linear-gradient(135deg, ${rank.color}cc, ${rank.color}88)`, backdropFilter: 'blur(4px)' }}
              >
                {level}
              </div>
            </motion.div>

            {/* Info column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 min-w-0 pb-1"
            >
              {/* Pins row */}
              <div className="flex items-center gap-1.5 mb-3">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const pin = cosmetics.pins[idx]
                  return pin ? (
                    <div
                      key={pin.id}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-black/40 backdrop-blur-sm border border-white/[0.06] flex items-center justify-center p-1"
                    >
                      {pin.type === 'svg' ? (
                        <div className="[&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sanitizeSvg(pin.content) }} />
                      ) : (
                        <img src={pin.content} alt="" className="w-full h-full object-contain" />
                      )}
                    </div>
                  ) : (
                    <div
                      key={`empty-${idx}`}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-white/[0.03] border border-dashed border-white/[0.08] flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3 text-white/10" />
                    </div>
                  )
                })}
              </div>

              {/* Rank badge + Username */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                  style={{ background: `${rank.color}18`, border: `1px solid ${rank.color}30`, color: rank.color }}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {rank.label}
                </div>
              </div>

              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-2"
                style={nameStyle}
              >
                {username || 'Utilisateur'}
              </h1>

              {/* Bio */}
              {bio && (
                <p className="text-xs text-gray-400 mb-2.5 max-w-sm line-clamp-1 leading-relaxed">
                  {bio}
                </p>
              )}

              {/* Level bar */}
              <div className="flex items-center gap-3 mb-3 max-w-xs">
                <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap">
                  Nv.{level}
                </span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.35 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${rank.color}cc, ${rank.color})` }}
                  />
                </div>
                <span className="text-[10px] text-gray-600 tabular-nums">{currentLevelExp}/{expToNextLevel}</span>
              </div>

              {/* Micro-stats row */}
              <div className="flex items-center gap-2 flex-wrap">
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/[0.04]">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs text-white font-bold">{streak}</span>
                    <span className="text-[10px] text-gray-500">jours</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/[0.04]">
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/image_2025-09-06_234243634.png`}
                    alt=""
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-xs font-black text-[#4578be]">
                    {totalCoinsPlayed.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-[10px] text-gray-500">joués</span>
                </div>

                {/* Badge rang leaderboard */}
                {globalRank != null && globalRank > 0 && (
                  <Link href="/leaderboard">
                    <div
                      className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-md border border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer"
                      title="Classement XP global"
                    >
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-black text-yellow-300">#{globalRank}</span>
                      <span className="text-[10px] text-gray-500">rang</span>
                    </div>
                  </Link>
                )}

                {/* Compteur visites (propriétaire seulement) */}
                {isOwnProfile && profileViews != null && profileViews > 0 && (
                  <div
                    className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/[0.04]"
                    title="Visites de votre profil ce mois-ci"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-black text-white">{profileViews}</span>
                    <span className="text-[10px] text-gray-500">vues/mois</span>
                  </div>
                )}

                {/* Amis en commun */}
                {!isOwnProfile && mutualFriends && mutualFriends.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/[0.04]">
                    <div className="flex -space-x-1.5">
                      {mutualFriends.slice(0, 3).map(f =>
                        f.avatar_url ? (
                          <img
                            key={f.id}
                            src={f.avatar_url}
                            alt=""
                            className="w-5 h-5 rounded-full border border-black/60 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            key={f.id}
                            className="w-5 h-5 rounded-full bg-[#4578be]/40 border border-black/60 flex items-center justify-center flex-shrink-0"
                          >
                            <User className="w-2.5 h-2.5 text-white/70" />
                          </div>
                        )
                      )}
                    </div>
                    <Users className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-400 font-medium">
                      {mutualFriends.length} ami{mutualFriends.length > 1 ? 's' : ''} en commun
                    </span>
                  </div>
                )}

                {/* Battle en cours */}
                {!isOwnProfile && activeBattleId && (
                  <Link href={`/battles/${activeBattleId}`}>
                    <motion.div
                      animate={{ opacity: [1, 0.55, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex items-center gap-1.5 bg-red-500/15 px-2.5 py-1 rounded-md border border-red-500/30 cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-red-400">En battle</span>
                    </motion.div>
                  </Link>
                )}

                {location && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {location}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action button — right side */}
            {!isOwnProfile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-shrink-0 pb-2"
              >
                {friendshipStatus === 'none' && (
                  <button
                    onClick={onAddFriend}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4578be] hover:bg-[#5989d8] text-white text-sm font-semibold transition-colors"
                    style={{ boxShadow: '0 4px 16px rgba(69,120,190,0.3)' }}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Ajouter</span>
                  </button>
                )}
                {friendshipStatus === 'pending_sent' && (
                  <button
                    onClick={onCancelRequest}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-red-500/10 text-gray-400 hover:text-red-400 text-sm border border-white/[0.06] hover:border-red-500/20 transition-all"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">En attente</span>
                    <X className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}
                {friendshipStatus === 'pending_received' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onAcceptRequest}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm border border-emerald-500/30 font-semibold transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Accepter</span>
                    </button>
                    <button
                      onClick={onDeclineRequest}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-red-500/10 text-gray-400 hover:text-red-400 text-sm border border-white/[0.06] hover:border-red-500/20 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Refuser</span>
                    </button>
                  </div>
                )}
                {friendshipStatus === 'accepted' && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20">
                    <UserCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Amis</span>
                  </div>
                )}
                {friendshipStatus === 'blocked' && (
                  <button
                    onClick={onUnblock}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm border border-red-500/20 transition-colors"
                  >
                    <ShieldOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Débloquer</span>
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
