'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Users, Eye, Bot, Coins, Zap } from 'lucide-react'

// Mock data pour la démo
const mockBattle = {
  id: '1',
  mode: 'classic',
  entry_cost: 350,
  total_boxes: 10,
  current_box: 0,
  max_players: 4,
  participants: [
    { id: '1', is_bot: false, username: 'Player1', avatar_url: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', is_bot: false, username: 'Player2', avatar_url: 'https://i.pravatar.cc/150?img=2' },
  ],
  battle_boxes: [
    { id: '1', box_image: 'https://placehold.co/100x100/667eea/white?text=Box', quantity: 3 },
    { id: '2', box_image: 'https://placehold.co/100x100/f093fb/white?text=Box', quantity: 2 },
    { id: '3', box_image: 'https://placehold.co/100x100/4facfe/white?text=Box', quantity: 1 },
  ]
}

const powerLevel = { level: 'STRONG', color: '#a855f7' }

export default function BattleDesignDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-28 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Battle Card Design Propositions
          </h1>
          <p className="text-slate-400 text-lg">
            4 designs premium élégants pour les cards de bataille
          </p>
        </div>

        {/* Design Grid */}
        <div className="space-y-16">

          {/* Design 1: Premium Glass */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Design 1: Premium Glass</h2>
              <p className="text-slate-400">Glassmorphism sophistiqué avec gradients subtils et ombres douces</p>
            </div>
            <DesignOne battle={mockBattle} />
          </div>

          {/* Design 2: Elegant Gradient */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Design 2: Elegant Gradient</h2>
              <p className="text-slate-400">Card avec gradient élégant et bordure fine accent dorée</p>
            </div>
            <DesignTwo battle={mockBattle} />
          </div>

          {/* Design 3: Soft Shadows */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Design 3: Soft Shadows</h2>
              <p className="text-slate-400">Design minimaliste avec ombres profondes et espacement généreux</p>
            </div>
            <DesignThree battle={mockBattle} />
          </div>

          {/* Design 4: Luxury Card */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Design 4: Luxury Card</h2>
              <p className="text-slate-400">Card premium avec effet de profondeur et finitions luxueuses</p>
            </div>
            <DesignFour battle={mockBattle} />
          </div>

        </div>

        {/* Footer Note */}
        <div className="mt-16 mb-8 text-center">
          <p className="text-slate-500 text-sm">
            Cliquez sur une card pour voir l'effet hover complet
          </p>
        </div>
      </div>
    </div>
  )
}

// ==================== DESIGN 1: PREMIUM GLASS ====================
function DesignOne({ battle }: { battle: any }) {
  const emptySlots = battle.max_players - battle.participants.length

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative rounded-3xl overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: `
          0 8px 32px 0 rgba(0, 0, 0, 0.37),
          inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
          0 0 0 1px rgba(0, 0, 0, 0.1)
        `
      }}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
        }}
      />

      <div className="relative z-10 p-8">
        <div className="flex items-center gap-8">

          {/* Mode Icon + Power */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              <Crown className="w-10 h-10 text-blue-400" />
            </div>

            <motion.div
              className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide"
              style={{
                background: `linear-gradient(135deg, ${powerLevel.color}30, ${powerLevel.color}20)`,
                border: `1px solid ${powerLevel.color}40`,
                color: powerLevel.color,
                boxShadow: `0 0 20px ${powerLevel.color}30`
              }}
            >
              {powerLevel.level}
            </motion.div>
          </div>

          {/* Cost Info */}
          <div className="flex flex-col gap-2 min-w-[160px]">
            <div className="text-sm font-medium text-slate-400">
              Classic
            </div>
            <div className="flex items-center gap-3">
              <Coins className="w-6 h-6 text-amber-400" />
              <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                {Math.floor(battle.entry_cost * 100)}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {battle.total_boxes} boxes à ouvrir
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

          {/* Participants */}
          <div className="flex items-center gap-3">
            {battle.participants.map((p: any) => (
              <div
                key={p.id}
                className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/20 hover:ring-white/40 transition-all hover:scale-110"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                <img
                  src={p.avatar_url}
                  alt={p.username}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center hover:scale-110 transition-all"
              >
                <span className="text-3xl font-light text-white/40">+</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

          {/* Boxes */}
          <div className="flex items-center gap-3 flex-1">
            {battle.battle_boxes.map((box: any) => (
              <div key={box.id} className="relative group/box">
                <img
                  src={box.box_image}
                  alt="Box"
                  className="w-28 h-28 object-contain group-hover/box:scale-110 transition-transform"
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(255, 255, 255, 0.2))'
                  }}
                />
                {box.quantity > 1 && (
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)'
                    }}
                  >
                    {box.quantity}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-5 rounded-2xl font-bold text-white min-w-[140px]"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span>Rejoindre</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== DESIGN 2: ELEGANT GRADIENT ====================
function DesignTwo({ battle }: { battle: any }) {
  const emptySlots = battle.max_players - battle.participants.length

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative rounded-3xl overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid transparent',
        backgroundImage: `
          linear-gradient(135deg, #1e293b 0%, #0f172a 100%),
          linear-gradient(135deg, rgba(251, 191, 36, 0.6), rgba(168, 85, 247, 0.6))
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: `
          0 20px 50px -12px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
        `
      }}
    >
      {/* Subtle shine effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
        }}
      />

      <div className="relative z-10 p-8">
        <div className="flex items-center gap-8">

          {/* Mode Icon + Power */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)'
              }}
            >
              <Crown className="w-10 h-10 text-blue-400" />
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
                }}
              />
            </div>

            <div
              className="px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide"
              style={{
                background: `linear-gradient(135deg, ${powerLevel.color}, ${powerLevel.color}dd)`,
                boxShadow: `0 4px 12px ${powerLevel.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                color: 'white'
              }}
            >
              {powerLevel.level}
            </div>
          </div>

          {/* Cost Info */}
          <div className="flex flex-col gap-2 min-w-[160px]">
            <div className="text-sm font-medium text-slate-400">
              Classic
            </div>
            <div className="flex items-center gap-3">
              <Coins className="w-6 h-6 text-amber-400 drop-shadow-lg" />
              <span
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3))'
                }}
              >
                {Math.floor(battle.entry_cost * 100)}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {battle.total_boxes} boxes à ouvrir
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-px h-20"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(251, 191, 36, 0.3), transparent)'
            }}
          />

          {/* Participants */}
          <div className="flex items-center gap-3">
            {battle.participants.map((p: any, idx: number) => (
              <div
                key={p.id}
                className="relative w-16 h-16 rounded-2xl overflow-hidden hover:scale-110 transition-transform"
                style={{
                  border: '2px solid transparent',
                  backgroundImage: `
                    linear-gradient(#1e293b, #1e293b),
                    linear-gradient(135deg, #fbbf24, #a855f7)
                  `,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
                }}
              >
                <img
                  src={p.avatar_url}
                  alt={p.username}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-16 h-16 rounded-2xl flex items-center justify-center hover:scale-110 transition-all"
                style={{
                  border: '2px dashed rgba(251, 191, 36, 0.3)',
                  background: 'rgba(251, 191, 36, 0.05)'
                }}
              >
                <span className="text-3xl font-light text-amber-400/40">+</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-px h-20"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(168, 85, 247, 0.3), transparent)'
            }}
          />

          {/* Boxes */}
          <div className="flex items-center gap-3 flex-1">
            {battle.battle_boxes.map((box: any) => (
              <div key={box.id} className="relative group/box">
                <div
                  className="p-2 rounded-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <img
                    src={box.box_image}
                    alt="Box"
                    className="w-24 h-24 object-contain group-hover/box:scale-110 transition-transform"
                  />
                </div>
                {box.quantity > 1 && (
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.5)'
                    }}
                  >
                    {box.quantity}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 12px 32px rgba(16, 185, 129, 0.5)' }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-5 rounded-2xl font-bold text-white min-w-[140px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Inner glow */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)'
              }}
            />
            <div className="relative flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span>Rejoindre</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== DESIGN 3: SOFT SHADOWS ====================
function DesignThree({ battle }: { battle: any }) {
  const emptySlots = battle.max_players - battle.participants.length

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.6)' }}
      className="relative rounded-[28px] overflow-hidden cursor-pointer bg-slate-800/90"
      style={{
        boxShadow: `
          0 24px 48px -12px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.06)
        `
      }}
    >
      {/* Subtle top highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
        }}
      />

      <div className="relative z-10 p-10">
        <div className="flex items-center gap-10">

          {/* Mode Icon + Power */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-700/50"
              style={{
                boxShadow: `
                  0 8px 16px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                `
              }}
            >
              <Crown className="w-10 h-10 text-blue-400" />
            </div>

            <div
              className="px-5 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: powerLevel.color,
                boxShadow: `
                  0 4px 12px ${powerLevel.color}30,
                  inset 0 1px 0 rgba(255, 255, 255, 0.1),
                  0 0 0 1px ${powerLevel.color}40
                `,
              }}
            >
              {powerLevel.level}
            </div>
          </div>

          {/* Cost Info */}
          <div className="flex flex-col gap-3 min-w-[180px]">
            <div className="text-sm font-semibold text-slate-400 tracking-wide">
              CLASSIC MODE
            </div>
            <div className="flex items-center gap-4">
              <div
                className="p-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                <Coins className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-4xl font-bold text-emerald-400">
                {Math.floor(battle.entry_cost * 100)}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {battle.total_boxes} boxes à ouvrir
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-px h-24 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
            }}
          />

          {/* Participants */}
          <div className="flex items-center gap-4">
            {battle.participants.map((p: any) => (
              <div
                key={p.id}
                className="w-18 h-18 rounded-3xl overflow-hidden hover:scale-110 transition-transform"
                style={{
                  boxShadow: `
                    0 8px 16px rgba(0, 0, 0, 0.4),
                    0 0 0 3px rgba(255, 255, 255, 0.1)
                  `
                }}
              >
                <img
                  src={p.avatar_url}
                  alt={p.username}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-18 h-18 rounded-3xl flex items-center justify-center hover:scale-110 transition-all bg-slate-700/30"
                style={{
                  boxShadow: `
                    inset 0 2px 8px rgba(0, 0, 0, 0.3),
                    0 0 0 2px rgba(148, 163, 184, 0.2)
                  `,
                  border: '2px dashed rgba(148, 163, 184, 0.3)'
                }}
              >
                <span className="text-3xl font-light text-slate-500">+</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-px h-24 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.2), transparent)'
            }}
          />

          {/* Boxes */}
          <div className="flex items-center gap-4 flex-1">
            {battle.battle_boxes.map((box: any) => (
              <div key={box.id} className="relative group/box">
                <div
                  className="p-3 rounded-3xl bg-slate-700/30"
                  style={{
                    boxShadow: `
                      inset 0 2px 8px rgba(0, 0, 0, 0.2),
                      0 4px 12px rgba(0, 0, 0, 0.3)
                    `
                  }}
                >
                  <img
                    src={box.box_image}
                    alt="Box"
                    className="w-24 h-24 object-contain group-hover/box:scale-110 transition-transform"
                  />
                </div>
                {box.quantity > 1 && (
                  <div
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                      boxShadow: `
                        0 4px 12px rgba(168, 85, 247, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3)
                      `
                    }}
                  >
                    {box.quantity}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-10 py-6 rounded-3xl font-bold text-white min-w-[160px]"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: `
                0 12px 28px rgba(16, 185, 129, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="text-base">Rejoindre</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== DESIGN 4: LUXURY CARD ====================
function DesignFour({ battle }: { battle: any }) {
  const emptySlots = battle.max_players - battle.participants.length

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative rounded-3xl overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        border: '2px solid transparent',
        backgroundImage: `
          linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%),
          linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: `
          0 25px 50px -12px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(251, 191, 36, 0.1),
          inset 0 2px 4px rgba(255, 255, 255, 0.05)
        `
      }}
    >
      {/* Animated shimmer effect */}
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          backgroundPosition: ['0% 0%', '200% 200%']
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear'
        }}
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(251, 191, 36, 0.15) 50%, transparent 70%)',
          backgroundSize: '200% 200%'
        }}
      />

      {/* Top inner glow */}
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(251, 191, 36, 0.08) 0%, transparent 60%)'
        }}
      />

      <div className="relative z-10 p-9">
        <div className="flex items-center gap-8">

          {/* Mode Icon + Power */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                boxShadow: `
                  0 0 40px rgba(251, 191, 36, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              <Crown className="w-10 h-10 text-amber-400" />
              {/* Rotating glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'conic-gradient(from 0deg, transparent, rgba(251, 191, 36, 0.3), transparent)',
                  filter: 'blur(8px)'
                }}
              />
            </div>

            <div
              className="px-4 py-2 rounded-full text-[11px] font-black tracking-widest"
              style={{
                background: `linear-gradient(135deg, ${powerLevel.color}, ${powerLevel.color}cc)`,
                boxShadow: `
                  0 6px 16px ${powerLevel.color}50,
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  0 0 0 1px rgba(0, 0, 0, 0.2)
                `,
                color: 'white',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              {powerLevel.level}
            </div>
          </div>

          {/* Cost Info */}
          <div className="flex flex-col gap-2 min-w-[170px]">
            <div
              className="text-sm font-bold tracking-wider"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              CLASSIC
            </div>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                }}
              >
                <Coins className="w-6 h-6 text-amber-400" />
              </div>
              <span
                className="text-4xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))'
                }}
              >
                {Math.floor(battle.entry_cost * 100)}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {battle.total_boxes} boxes à ouvrir
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-[2px] h-20 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(251, 191, 36, 0.4), transparent)',
              boxShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
            }}
          />

          {/* Participants */}
          <div className="flex items-center gap-3">
            {battle.participants.map((p: any) => (
              <div
                key={p.id}
                className="relative w-16 h-16 rounded-2xl overflow-hidden hover:scale-110 transition-transform"
                style={{
                  border: '2px solid transparent',
                  backgroundImage: `
                    linear-gradient(#0f172a, #0f172a),
                    linear-gradient(135deg, #fbbf24, #f59e0b)
                  `,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: `
                    0 6px 20px rgba(0, 0, 0, 0.4),
                    0 0 20px rgba(251, 191, 36, 0.2)
                  `
                }}
              >
                <img
                  src={p.avatar_url}
                  alt={p.username}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="w-16 h-16 rounded-2xl flex items-center justify-center hover:scale-110 transition-all"
                style={{
                  border: '2px dashed rgba(251, 191, 36, 0.4)',
                  background: 'rgba(251, 191, 36, 0.05)',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                <span className="text-3xl font-light text-amber-400/50">+</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-[2px] h-20 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(168, 85, 247, 0.4), transparent)',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)'
            }}
          />

          {/* Boxes */}
          <div className="flex items-center gap-3 flex-1">
            {battle.battle_boxes.map((box: any) => (
              <div key={box.id} className="relative group/box">
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    background: 'rgba(251, 191, 36, 0.05)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    boxShadow: `
                      inset 0 2px 8px rgba(0, 0, 0, 0.2),
                      0 0 20px rgba(251, 191, 36, 0.1)
                    `
                  }}
                >
                  <img
                    src={box.box_image}
                    alt="Box"
                    className="w-24 h-24 object-contain group-hover/box:scale-110 transition-transform"
                  />
                </div>
                {box.quantity > 1 && (
                  <div
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      boxShadow: `
                        0 4px 16px rgba(251, 191, 36, 0.6),
                        inset 0 1px 0 rgba(255, 255, 255, 0.4),
                        0 0 0 2px rgba(15, 23, 42, 0.5)
                      `,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {box.quantity}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: `
                0 16px 36px rgba(16, 185, 129, 0.5),
                0 0 40px rgba(16, 185, 129, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3)
              `
            }}
            whileTap={{ scale: 0.98 }}
            className="relative px-10 py-6 rounded-2xl font-black text-white min-w-[150px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: `
                0 12px 28px rgba(16, 185, 129, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.1)
              `,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Animated shimmer on button */}
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ['0% 0%', '200% 200%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{
                background: 'linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                backgroundSize: '200% 200%'
              }}
            />

            <div className="relative flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span>Rejoindre</span>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
