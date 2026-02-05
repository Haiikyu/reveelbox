'use client'

import { motion } from 'framer-motion'
import { Package, Swords, TrendingUp, Activity, Coins, Flame, Zap, Sparkles, BarChart3, CircleDot } from 'lucide-react'

export default function LiveStatsDemo() {
  return (
    <div className="min-h-screen bg-[#0a0e17] p-8 space-y-20">
      <h1 className="text-3xl font-bold text-white text-center">Live Stats - 15 Alternatives</h1>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: 5 VERSIONS ORIGINALES */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-12">
        <h2 className="text-lg font-semibold text-white/80 border-b border-white/10 pb-2">Section 1 — Versions classiques</h2>

        {/* V1: Ultra Minimal */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V1 — Ultra Minimal</h3>
          <div className="inline-flex items-center gap-6 px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div className="flex items-center gap-1.5">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">Live</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className="text-sm font-semibold text-white/90 tabular-nums">2,195</span>
              <span className="text-[10px] text-white/40 uppercase">boxes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-white/90 tabular-nums">353</span>
              <span className="text-[10px] text-white/40 uppercase">battles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-white/90 tabular-nums">12.4K</span>
              <span className="text-[10px] text-white/40 uppercase">24h</span>
            </div>
          </div>
        </section>

        {/* V2: Gradient Accent */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V2 — Gradient Accent</h3>
          <div className="inline-flex items-center overflow-hidden rounded-xl relative"
            style={{ background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)' }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #a855f7, #eab308, #10b981)' }} />
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-4 py-3 border-r border-white/5">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-xs font-bold text-red-400 uppercase">Live</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-r border-white/5">
                <Package className="w-4 h-4 text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-none tabular-nums">2,195</span>
                  <span className="text-[9px] text-gray-500 uppercase">Boxes</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-r border-white/5">
                <Swords className="w-4 h-4 text-amber-400" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-none tabular-nums">353</span>
                  <span className="text-[9px] text-gray-500 uppercase">Battles</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-none tabular-nums">12,450</span>
                  <span className="text-[9px] text-gray-500 uppercase">Coins 24h</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* V3: Glass Pills */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V3 — Glass Pills</h3>
          <div className="inline-flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] font-semibold text-red-400 uppercase">Live</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-sm font-bold text-purple-300 tabular-nums">2,195</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.15)' }}>
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-bold text-amber-300 tabular-nums">353</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <span className="text-sm font-bold text-emerald-300 tabular-nums">12.4K</span>
              <span className="text-[9px] text-emerald-400/60 uppercase">24h</span>
            </div>
          </div>
        </section>

        {/* V4: Compact Badge */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V4 — Compact Badge</h3>
          <div className="inline-flex items-center gap-4 px-4 py-2 rounded-lg"
            style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-bold text-purple-400 tabular-nums">2,195</span>
                <span className="text-white/30 text-xs">boxes</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-amber-400 tabular-nums">353</span>
                <span className="text-white/30 text-xs">battles</span>
              </div>
              <span className="text-white/10">•</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-emerald-400 tabular-nums">12.4K</span>
                <span className="text-white/30 text-xs">coins/24h</span>
              </div>
            </div>
          </div>
        </section>

        {/* V5: Status Bar */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V5 — Status Bar</h3>
          <div className="inline-flex items-stretch rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border-r border-white/5">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Activity className="w-4 h-4 text-red-400" />
              </motion.div>
            </div>
            <div className="flex items-center divide-x divide-white/5">
              <div className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-base font-bold text-white tabular-nums">2,195</div>
                  <div className="text-[10px] text-gray-500 uppercase">Boxes</div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-base font-bold text-white tabular-nums">353</div>
                  <div className="text-[10px] text-gray-500 uppercase">Battles</div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-base font-bold text-white tabular-nums">12,450</div>
                  <div className="text-[10px] text-gray-500 uppercase">24h</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: COINS MIS EN VALEUR AVEC COMPTEUR/JAUGE */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-12">
        <h2 className="text-lg font-semibold text-emerald-400 border-b border-emerald-500/20 pb-2">Section 2 — Coins en vedette (compteur/jauge)</h2>

        {/* V6: Progress Bar Coins */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V6 — Progress Bar</h3>
          <div className="inline-flex items-center gap-3 p-2 rounded-2xl"
            style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 px-3 py-2">
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-red-400 font-bold uppercase">Live</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-sm font-bold text-white tabular-nums">2,195</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-bold text-white tabular-nums">353</span>
            </div>
            {/* Coins avec barre de progression */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {/* Barre animée en arrière-plan */}
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/30 to-emerald-400/10"
                initial={{ width: '0%' }}
                animate={{ width: '75%' }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
              <div className="relative flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-400 tabular-nums leading-none">12,450</div>
                  <div className="text-[9px] text-emerald-500/60 uppercase">Distribués 24h</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* V7: Circular Gauge */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V7 — Circular Gauge</h3>
          <div className="inline-flex items-center gap-3 p-2 rounded-2xl"
            style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4 px-3">
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500" />
              <div className="text-sm"><span className="text-purple-400 font-bold">2,195</span> <span className="text-white/30">boxes</span></div>
              <div className="text-sm"><span className="text-amber-400 font-bold">353</span> <span className="text-white/30">battles</span></div>
            </div>
            {/* Coins avec jauge circulaire */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="relative w-10 h-10">
                {/* Cercle de fond */}
                <svg className="w-10 h-10 -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="3" fill="none" />
                  <motion.circle
                    cx="20" cy="20" r="16" stroke="#10b981" strokeWidth="3" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{ strokeDasharray: '75 100' }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400 tabular-nums leading-none">12.4K</div>
                <div className="text-[9px] text-emerald-500/60 uppercase">Coins 24h</div>
              </div>
            </div>
          </div>
        </section>

        {/* V8: Glowing Counter */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V8 — Glowing Counter</h3>
          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl"
            style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 px-3 py-2">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02]">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white tabular-nums">2,195</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02]">
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white tabular-nums">353</span>
            </div>
            {/* Coins avec glow pulsant */}
            <motion.div
              className="flex items-center gap-3 px-4 py-2 rounded-xl relative"
              animate={{ boxShadow: ['0 0 20px rgba(16, 185, 129, 0.3)', '0 0 40px rgba(16, 185, 129, 0.5)', '0 0 20px rgba(16, 185, 129, 0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                <Coins className="w-5 h-5 text-emerald-400" />
              </motion.div>
              <div className="text-2xl font-black text-emerald-400 tabular-nums">12,450</div>
              <span className="text-[10px] text-emerald-500/80 uppercase">24h</span>
            </motion.div>
          </div>
        </section>

        {/* V9: Vertical Fill Meter */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V9 — Vertical Fill</h3>
          <div className="inline-flex items-stretch gap-0 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-r border-white/5">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-red-400 font-bold uppercase">Live</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-r border-white/5">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white">2,195</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-r border-white/5">
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">353</span>
            </div>
            {/* Coins avec jauge verticale */}
            <div className="flex items-center gap-3 px-4 py-3 relative bg-emerald-500/5">
              {/* Barre verticale qui se remplit */}
              <div className="absolute left-0 bottom-0 w-1 h-full bg-emerald-900/30 overflow-hidden">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-emerald-400"
                  initial={{ height: '0%' }}
                  animate={{ height: '80%' }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end">
                  <div className="text-xl font-black text-emerald-400 tabular-nums leading-none">12,450</div>
                  <div className="text-[9px] text-emerald-500/60 uppercase">Coins distribués</div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* V10: Stacked Coins Visual */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V10 — Stacked Coins</h3>
          <div className="inline-flex items-center gap-2 p-2 rounded-2xl"
            style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4 px-3 py-2">
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-white/60"><span className="text-purple-400 font-bold">2,195</span> boxes</span>
              <span className="text-sm text-white/60"><span className="text-amber-400 font-bold">353</span> battles</span>
            </div>
            {/* Coins avec visual de pièces empilées */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(234, 179, 8, 0.1))', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              {/* Coins empilées animées */}
              <div className="relative w-8 h-8">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-6 h-6 rounded-full border-2 border-emerald-400/60"
                    style={{ background: `linear-gradient(135deg, #10b981 0%, #fbbf24 100%)`, left: i * 3, top: i * 2 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.2, duration: 0.5 }}
                  />
                ))}
              </div>
              <div>
                <motion.div
                  className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent tabular-nums"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  12,450
                </motion.div>
                <div className="text-[9px] text-emerald-500/60 uppercase">Distribués aujourd&apos;hui</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: CARTE BLANCHE - DESIGNS CRÉATIFS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-12">
        <h2 className="text-lg font-semibold text-blue-400 border-b border-blue-500/20 pb-2">Section 3 — Carte blanche (designs premium)</h2>

        {/* V11: Neon Cyberpunk */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V11 — Neon Cyberpunk</h3>
          <div className="inline-flex items-center gap-0 rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)' }}>
            {/* Live avec effet néon */}
            <div className="px-4 py-3 border-r border-violet-500/20">
              <motion.div
                className="flex items-center gap-2"
                animate={{ textShadow: ['0 0 10px #ef4444', '0 0 20px #ef4444', '0 0 10px #ef4444'] }}
                transition={{ duration: 1, repeat: Infinity }}>
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live</span>
              </motion.div>
            </div>
            <div className="flex items-center gap-6 px-6 py-3">
              <div className="text-center">
                <div className="text-lg font-black text-violet-400 tabular-nums" style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>2,195</div>
                <div className="text-[8px] text-violet-400/50 uppercase tracking-widest">Boxes</div>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-violet-500/50 to-transparent" />
              <div className="text-center">
                <div className="text-lg font-black text-cyan-400 tabular-nums" style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}>353</div>
                <div className="text-[8px] text-cyan-400/50 uppercase tracking-widest">Battles</div>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
              <div className="text-center">
                <div className="text-lg font-black text-emerald-400 tabular-nums" style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>12.4K</div>
                <div className="text-[8px] text-emerald-400/50 uppercase tracking-widest">24h Coins</div>
              </div>
            </div>
          </div>
        </section>

        {/* V12: Minimal Luxury */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V12 — Minimal Luxury</h3>
          <div className="inline-flex items-center gap-8 px-6 py-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4))', border: '1px solid rgba(255, 215, 0, 0.1)', backdropFilter: 'blur(20px)' }}>
            <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-1 h-1 rounded-full bg-amber-400" />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-thin text-white/90 tabular-nums">2,195</span>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">boxes</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-thin text-white/90 tabular-nums">353</span>
              <span className="text-[10px] text-white/30 uppercase tracking-widest">battles</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-thin text-amber-400/90 tabular-nums">12,450</span>
              <span className="text-[10px] text-amber-400/40 uppercase tracking-widest">coins</span>
            </div>
          </div>
        </section>

        {/* V13: Gradient Morph */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V13 — Gradient Morph</h3>
          <motion.div
            className="inline-flex items-center gap-6 px-6 py-3 rounded-full"
            animate={{
              background: [
                'linear-gradient(90deg, rgba(168, 85, 247, 0.15), rgba(234, 179, 8, 0.1), rgba(16, 185, 129, 0.15))',
                'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(168, 85, 247, 0.15), rgba(234, 179, 8, 0.1))',
                'linear-gradient(90deg, rgba(234, 179, 8, 0.1), rgba(16, 185, 129, 0.15), rgba(168, 85, 247, 0.15))',
              ]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </motion.div>
              <span className="text-[10px] text-white/50 uppercase">Live</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-purple-400" />
              <span className="font-bold text-white tabular-nums">2,195</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-amber-400" />
              <span className="font-bold text-white tabular-nums">353</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-emerald-400" />
              <span className="font-bold text-white tabular-nums">12.4K</span>
            </div>
          </motion.div>
        </section>

        {/* V14: Stats Cards Row */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V14 — Floating Cards</h3>
          <div className="inline-flex items-center gap-3">
            {/* Live Badge */}
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <motion.div className="flex items-center gap-2"
                animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400 uppercase">Live</span>
              </motion.div>
            </div>
            {/* Cards individuelles avec hover */}
            {[
              { icon: Package, value: '2,195', label: 'Boxes', color: 'purple', gradient: 'from-purple-500/20 to-purple-600/5' },
              { icon: Swords, value: '353', label: 'Battles', color: 'amber', gradient: 'from-amber-500/20 to-amber-600/5' },
              { icon: BarChart3, value: '12.4K', label: '24h', color: 'emerald', gradient: 'from-emerald-500/20 to-emerald-600/5' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`px-4 py-3 rounded-xl bg-gradient-to-br ${stat.gradient} border border-${stat.color}-500/20 cursor-default`}
                style={{ boxShadow: `0 4px 20px rgba(0,0,0,0.2)` }}>
                <div className="flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  <div>
                    <div className="text-lg font-bold text-white tabular-nums leading-none">{stat.value}</div>
                    <div className="text-[9px] text-white/40 uppercase">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* V15: Terminal Style */}
        <section className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">V15 — Terminal / Dev Style</h3>
          <div className="inline-flex items-center gap-0 rounded-lg overflow-hidden font-mono"
            style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            {/* Terminal dots */}
            <div className="flex items-center gap-1.5 px-3 py-3 border-r border-green-500/10">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-4 px-4 py-2">
              <motion.span
                className="text-green-400"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}>▋</motion.span>
              <span className="text-green-400/60">$</span>
              <span className="text-gray-400">stats</span>
              <span className="text-white/30">--live</span>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 text-sm">
              <span><span className="text-purple-400">boxes:</span><span className="text-white ml-1 tabular-nums">2195</span></span>
              <span><span className="text-amber-400">battles:</span><span className="text-white ml-1 tabular-nums">353</span></span>
              <span><span className="text-emerald-400">coins_24h:</span><span className="text-white ml-1 tabular-nums">12450</span></span>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* LÉGENDE */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="pt-8 border-t border-white/5">
        <h3 className="text-xs text-gray-600 uppercase tracking-wider mb-4">Résumé des 15 versions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
          <div>
            <h4 className="text-white/60 font-medium mb-2">Classiques (V1-V5)</h4>
            <ul className="space-y-1 text-xs">
              <li><span className="text-purple-400">V1</span> — Ultra minimal</li>
              <li><span className="text-purple-400">V2</span> — Gradient accent</li>
              <li><span className="text-purple-400">V3</span> — Glass pills</li>
              <li><span className="text-purple-400">V4</span> — Compact badge</li>
              <li><span className="text-purple-400">V5</span> — Status bar</li>
            </ul>
          </div>
          <div>
            <h4 className="text-emerald-400/80 font-medium mb-2">Coins en vedette (V6-V10)</h4>
            <ul className="space-y-1 text-xs">
              <li><span className="text-emerald-400">V6</span> — Progress bar</li>
              <li><span className="text-emerald-400">V7</span> — Circular gauge</li>
              <li><span className="text-emerald-400">V8</span> — Glowing counter</li>
              <li><span className="text-emerald-400">V9</span> — Vertical fill</li>
              <li><span className="text-emerald-400">V10</span> — Stacked coins</li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-400/80 font-medium mb-2">Premium (V11-V15)</h4>
            <ul className="space-y-1 text-xs">
              <li><span className="text-blue-400">V11</span> — Neon cyberpunk</li>
              <li><span className="text-blue-400">V12</span> — Minimal luxury</li>
              <li><span className="text-blue-400">V13</span> — Gradient morph</li>
              <li><span className="text-blue-400">V14</span> — Floating cards</li>
              <li><span className="text-blue-400">V15</span> — Terminal style</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
