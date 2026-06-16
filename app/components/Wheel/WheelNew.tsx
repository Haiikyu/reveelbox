// WheelNew.tsx - Carrousel 3D épuré avec sound design + rarity glow
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FreedropItem } from '@/lib/services/freedrop'
import { useTheme } from '@/app/components/ThemeProvider'

interface WheelProps {
  items: FreedropItem[]
  winningItem: FreedropItem | null
  fastMode?: boolean
  onFinish: () => void
  isSpinning?: boolean
  height?: number
}

const ITEM_WIDTH = 150
const CARD_INSET = 7
const TOTAL_ITEMS = 60
const WINNING_POSITION = 40
const NEAR_MISS_POSITION = WINNING_POSITION - 2

// Simule la même courbe quartic ease-out que l'animation visuelle
// pour calculer exactement quand chaque item franchit le centre
const playRouletteWheel = (totalDurationMs: number, finalPos: number, vpW: number) => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = audioCtx.currentTime;
  const dur = totalDurationMs / 1000;

  // Drone grave (roue qui tourne, s'estompe)
  const droneGain = audioCtx.createGain();
  droneGain.gain.setValueAtTime(0.05, now);
  droneGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.88);
  droneGain.connect(audioCtx.destination);
  const droneOsc = audioCtx.createOscillator();
  droneOsc.type = "sine";
  droneOsc.frequency.setValueAtTime(70, now);
  droneOsc.frequency.exponentialRampToValueAtTime(18, now + dur);
  droneOsc.connect(droneGain);
  droneOsc.start(now); droneOsc.stop(now + dur + 0.1);

  // Simuler la courbe d'animation à haute résolution pour détecter les franchissements
  // Même formule que dans animate() : ease = 1 - (1 - progress)^4
  const centerWorldOffset = vpW / 2;
  const clickTimes: number[] = [];
  const STEPS = 800;  // 5000 → 800 : précision suffisante, 6x moins de calcul
  let lastItemIdx = -1;

  for (let s = 0; s <= STEPS; s++) {
    const progress = s / STEPS;
    const ease = 1 - Math.pow(1 - progress, 4);
    const scrollPos = finalPos * ease;
    const centerWorldPos = scrollPos + centerWorldOffset;
    const itemIdx = Math.floor(centerWorldPos / ITEM_WIDTH);

    if (itemIdx !== lastItemIdx && itemIdx >= 0) {
      lastItemIdx = itemIdx;
      clickTimes.push(progress * dur); // temps en secondes
    }
  }

  // Jouer un clic pour chaque franchissement détecté
  clickTimes.forEach((clickT) => {
    const progress = clickT / dur;
    const intensity = 0.15 + (1 - progress) * 0.28;
    const startTime = now + clickT;

    // Impact bille (plus aigu au début = vitesse)
    const f1 = audioCtx.createBiquadFilter();
    f1.type = "bandpass";
    f1.frequency.value = 1600 + (1 - progress) * 900;
    f1.Q.value = 5;
    f1.connect(audioCtx.destination);
    const size = Math.max(2, Math.floor(audioCtx.sampleRate * 0.010));
    const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++)
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (size * 0.07));
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const g = audioCtx.createGain(); g.gain.value = intensity;
    src.connect(g); g.connect(f1);
    src.start(startTime);

    // Résonance de la poche (plus longue vers la fin = items qui ralentissent)
    const resonDur = 0.012 + progress * 0.05;
    const o = audioCtx.createOscillator();
    const og = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(850 + (1 - progress) * 500, startTime);
    og.gain.setValueAtTime(intensity * 0.22, startTime);
    og.gain.exponentialRampToValueAtTime(0.0001, startTime + resonDur);
    o.connect(og); og.connect(audioCtx.destination);
    o.start(startTime); o.stop(startTime + resonDur + 0.01);
  });

};

const playDropSound = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = audioCtx.currentTime;
  const reverbBuf = audioCtx.createBuffer(2, Math.floor(audioCtx.sampleRate * 1.5), audioCtx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = reverbBuf.getChannelData(ch);
    for (let i = 0; i < d.length; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - d.length / d.length, 2.5);
  }
  const reverb = audioCtx.createConvolver();
  reverb.buffer = reverbBuf;
  const master = audioCtx.createGain();
  master.gain.value = 0.75;
  master.connect(audioCtx.destination);
  reverb.connect(master);
  const mkOsc = (dest: AudioNode, freq: number, start: number, dur: number, gain: number) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(dest as any);
    o.start(start); o.stop(start + dur + 0.05);
  };
  mkOsc(reverb, 880,  now,       0.4, 0.3);
  mkOsc(reverb, 1100, now + 0.1, 0.3, 0.2);
  mkOsc(master, 880,  now,       0.4, 0.3);
  mkOsc(master, 1100, now + 0.1, 0.3, 0.2);
};

const rarityColors: Record<string, string> = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#d946ef',
  legendary: '#f59e0b'
}

export function Wheel({
  items,
  winningItem,
  fastMode = false,
  onFinish,
  isSpinning = false,
  height = 250
}: WheelProps) {
  const [wheelSequence, setWheelSequence] = useState<FreedropItem[]>([])
  const [isReady, setIsReady] = useState(false)
  const [showOnlyWinner, setShowOnlyWinner] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const indicatorGlowRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)
  const scrollPosRef = useRef(0)
  const lastCenterIdxRef = useRef(-1)
  const suspensePlayedRef = useRef(false)
  const spinIdRef = useRef(0)

  // Taille adaptative
  const itemHeight = Math.min(height - 30, 220)
  const imageSize = Math.min(itemHeight * 0.65, 120)

  const generateSequence = useCallback((baseItems: FreedropItem[], targetItem?: FreedropItem) => {
    if (!baseItems.length) return []
    const sequence: FreedropItem[] = []
    const ts = Date.now()
    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const ri = Math.floor(Math.random() * baseItems.length)
      sequence.push({ ...baseItems[ri], id: `w-${ts}-${i}-${baseItems[ri].id}` })
    }
    if (targetItem) {
      sequence[WINNING_POSITION] = { ...targetItem, id: `win-${ts}-${targetItem.id}` }
      // Decoy rare/epic 2 positions avant le gagnant — effet near-miss visuel uniquement
      const pool = baseItems.filter(i =>
        ['legendary', 'epic', 'rare'].includes(i.rarity?.toLowerCase()) &&
        i.id !== targetItem.id
      )
      if (pool.length > 0) {
        const decoy = pool[Math.floor(Math.random() * pool.length)]
        sequence[NEAR_MISS_POSITION] = { ...decoy, id: `nm-${ts}-${decoy.id}` }
      }
    }
    return sequence
  }, [])

  // Transforms 3D par item
  const applyPerspective = useCallback((scrollPos: number) => {
    if (!containerRef.current || !wheelRef.current) return
    const vpW = containerRef.current.offsetWidth
    const center = vpW / 2
    const children = wheelRef.current.children

    // Seulement les items visibles + 1 de marge de chaque côté
    const firstVisible = Math.max(0, Math.floor(scrollPos / ITEM_WIDTH) - 1)
    const lastVisible = Math.min(children.length - 1, Math.ceil((scrollPos + vpW) / ITEM_WIDTH) + 1)

    for (let i = firstVisible; i <= lastVisible; i++) {
      const el = children[i] as HTMLElement
      const itemCenter = i * ITEM_WIDTH + ITEM_WIDTH / 2 - scrollPos
      const dist = (itemCenter - center) / (vpW / 2)
      const abs = Math.min(Math.abs(dist), 1.5)

      const scale = 1.15 - abs * 0.4
      const opacity = 1 - abs * 0.55
      const translateY = abs * abs * 4

      el.style.transform = `scale(${Math.max(0.55, scale)}) translateY(${translateY}px)`
      el.style.opacity = `${Math.max(0.05, opacity)}`
    }
  }, [])

  // Rarity glow : mettre à jour l'indicateur central avec la couleur de l'item au centre
  const updateCenterGlow = useCallback((scrollPos: number, sequence: FreedropItem[]) => {
    if (!containerRef.current || !indicatorRef.current || !indicatorGlowRef.current) return
    const vpW = containerRef.current.offsetWidth
    const centerWorldPos = scrollPos + vpW / 2
    const centerIdx = Math.floor(centerWorldPos / ITEM_WIDTH)

    if (centerIdx < 0 || centerIdx >= sequence.length) return

    const centerItem = sequence[centerIdx]
    if (!centerItem?.rarity) return
    const color = rarityColors[centerItem.rarity.toLowerCase()] || rarityColors.common

    // Mettre à jour la ligne indicatrice avec la couleur de rareté
    indicatorRef.current.style.background =
      `linear-gradient(180deg, transparent 5%, ${color}15 30%, ${color}40 50%, ${color}15 70%, transparent 95%)`

    // Glow derrière l'indicateur
    indicatorGlowRef.current.style.background =
      `radial-gradient(ellipse at center, ${color}20 0%, transparent 70%)`
    indicatorGlowRef.current.style.opacity = '1'

    // Son tick quand un nouvel item passe au centre
    if (centerIdx !== lastCenterIdxRef.current) {
      lastCenterIdxRef.current = centerIdx
    }
  }, [])

  // Init
  useEffect(() => {
    if (items.length > 0 && !isReady) {
      const seq = generateSequence(items)
      setWheelSequence(seq)
      setIsReady(true)
    }
  }, [items, generateSequence, isReady])

  // Appliquer perspective au repos
  useEffect(() => {
    if (isReady && !isSpinning) {
      requestAnimationFrame(() => applyPerspective(scrollPosRef.current))
    }
  }, [isReady, isSpinning, applyPerspective])

  // Reset indicateur quand pas en train de spinner
  useEffect(() => {
    if (!isSpinning && indicatorRef.current && indicatorGlowRef.current) {
      indicatorRef.current.style.background =
        'linear-gradient(180deg, transparent 10%, rgba(255,240,220,0.08) 40%, rgba(255,240,220,0.12) 50%, rgba(255,240,220,0.08) 60%, transparent 90%)'
      indicatorGlowRef.current.style.opacity = '0'
    }
  }, [isSpinning])

  // Animation de spin
  useEffect(() => {
    if (!isSpinning || !winningItem || !isReady) return

    setShowOnlyWinner(false)
    suspensePlayedRef.current = false
    lastCenterIdxRef.current = -1

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    isAnimatingRef.current = false

    if (wheelRef.current) {
      wheelRef.current.style.transform = 'translate3d(0, 0, 0)'
      wheelRef.current.style.transition = 'none'
      wheelRef.current.style.willChange = 'transform'
    }
    scrollPosRef.current = 0

    const newSeq = generateSequence(items, winningItem)
    setWheelSequence(newSeq)

    // ID unique par spin — invalide immédiatement tous les callbacks du spin précédent
    const spinId = Date.now()
    spinIdRef.current = spinId

    // 4 patterns visuels choisis aléatoirement — tous fluides, aucune saccade
    const PATTERNS = [
      { power: 3.0, durationFactor: 1.00 }, // ralentissement progressif classique
      { power: 4.0, durationFactor: 1.15 }, // suspense final plus long
      { power: 2.8, durationFactor: 0.93 }, // départ rapide, freinage doux
      { power: 3.5, durationFactor: 1.07 }, // intermédiaire équilibré
    ]
    const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]

    let pollTimeoutId: ReturnType<typeof setTimeout>
    let endTimeoutId: ReturnType<typeof setTimeout>
    const waitStart = Date.now()

    const startAnimation = () => {
      if (spinId !== spinIdRef.current) return
      if (!containerRef.current || !wheelRef.current) return

      // Tout est pré-calculé ici, AVANT de lancer l'animation
      const vpW = containerRef.current.offsetWidth
      const centerOffset = vpW / 2
      const winPos = WINNING_POSITION * ITEM_WIDTH
      const isMainWheel = vpW > 700

      // Offset aléatoire dans la carte gagnante (gauche / centre / droite)
      // marge 22px garantit que la flèche reste bien dans le conteneur
      const cardInnerHalf = (ITEM_WIDTH - CARD_INSET * 2) / 2
      const maxOffset = Math.max(0, cardInnerHalf - 22)
      const cardOffset = (Math.random() - 0.5) * 2 * maxOffset
      const finalPos = winPos - centerOffset + ITEM_WIDTH / 2 + cardOffset

      // Durée : 4.5-6.5s x1, légèrement plus long en multi (container plus étroit)
      const baseDuration = fastMode ? 3000 : (isMainWheel ? 6000 : 5500)
      const duration = baseDuration * pattern.durationFactor

      // Son : différé d'1 frame pour ne pas bloquer l'animation, 1 seul son en multi
      if (isMainWheel) {
        setTimeout(() => {
          if (spinId === spinIdRef.current) playRouletteWheel(duration, finalPos, vpW)
        }, 0)
      }

      isAnimatingRef.current = true
      const startTime = performance.now()

      const animate = (ts: number) => {
        if (spinId !== spinIdRef.current || !isAnimatingRef.current) return

        const progress = Math.min((ts - startTime) / duration, 1)

        // Ease-out pur (power variable par pattern) : départ rapide → décélération fluide
        // Aucune phase, aucune jointure → mathématiquement impossible d'avoir une saccade
        const ease = 1 - Math.pow(1 - progress, pattern.power)
        const currentPos = finalPos * ease
        scrollPosRef.current = currentPos

        // translate3d : GPU, zéro reflow, zéro saccade
        if (wheelRef.current) {
          wheelRef.current.style.transform = `translate3d(-${currentPos}px, 0, 0)`
        }

        applyPerspective(currentPos)
        updateCenterGlow(currentPos, newSeq)

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          // PHASE 1 terminée — l'objet gagné est sous la flèche (avec offset)
          isAnimatingRef.current = false
          if (spinId !== spinIdRef.current) return

          // PHASE 2 — recentrage doux (500ms) : l'objet se centre sous la flèche
          const centerPos = winPos - centerOffset + ITEM_WIDTH / 2
          if (wheelRef.current) {
            wheelRef.current.style.transition = 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            wheelRef.current.style.transform = `translate3d(-${centerPos}px, 0, 0)`
          }

          // PHASE 3 — animation finale existante
          endTimeoutId = setTimeout(() => {
            if (spinId !== spinIdRef.current) return
            if (wheelRef.current) {
              wheelRef.current.style.transition = 'none'
              wheelRef.current.style.willChange = 'auto'
            }
            if (isMainWheel) playDropSound()
            setShowOnlyWinner(true)
            setTimeout(() => onFinish(), 100)
          }, 1100)
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Polling DOM : attend que React ait rendu la séquence (max 2s, check toutes les 80ms)
    // Évite de lancer l'animation sur un DOM incomplet → cause principale des freezes
    const tryStart = () => {
      if (spinId !== spinIdRef.current) return
      const ready = wheelRef.current && wheelRef.current.children.length >= TOTAL_ITEMS * 0.8
      const timeout = Date.now() - waitStart >= 2000
      if (ready || timeout) startAnimation()
      else pollTimeoutId = setTimeout(tryStart, 80)
    }

    pollTimeoutId = setTimeout(tryStart, 100)

    return () => {
      spinIdRef.current = -1
      clearTimeout(pollTimeoutId)
      clearTimeout(endTimeoutId)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      isAnimatingRef.current = false
      if (wheelRef.current) wheelRef.current.style.willChange = 'auto'
    }
  }, [isSpinning, winningItem, isReady, items, generateSequence, fastMode, onFinish, applyPerspective, updateCenterGlow])


  if (!isReady || wheelSequence.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="w-4 h-4 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        height,
        overflow: showOnlyWinner ? 'visible' : 'hidden',
      }}
    >
      {/* Indicateur central - ligne fine avec rarity glow dynamique */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 z-20 pointer-events-none"
        style={{ width: '2px' }}
      >
        <div ref={indicatorRef} className="w-full h-full transition-colors duration-150" style={{
          background: 'linear-gradient(180deg, transparent 10%, rgba(255,240,220,0.08) 40%, rgba(255,240,220,0.12) 50%, rgba(255,240,220,0.08) 60%, transparent 90%)',
        }} />
      </div>

      {/* Glow radial derrière l'indicateur */}
      <div
        ref={indicatorGlowRef}
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-15 pointer-events-none transition-opacity duration-200"
        style={{
          width: '80px',
          height: '100%',
          opacity: 0,
        }}
      />

      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 z-10 pointer-events-none" style={{
        background: 'linear-gradient(to right, var(--wheel-bg, #0C1220) 0%, transparent 100%)'
      }} />
      <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 z-10 pointer-events-none" style={{
        background: 'linear-gradient(to left, var(--wheel-bg, #0C1220) 0%, transparent 100%)'
      }} />

      {/* Wheel */}
      <div className="relative h-full">
        <AnimatePresence mode="wait">
          {showOnlyWinner && winningItem ? (
            <motion.div
              key="winner"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center h-full"
            >
              <WinnerDisplay item={winningItem} imageSize={Math.min(imageSize * 1.4, 150)} />
            </motion.div>
          ) : (
            <div
              ref={wheelRef}
              className="flex items-center h-full"
              style={{ willChange: 'transform' }}
            >
              {wheelSequence.map((item) => (
                <WheelItem
                  key={item.id}
                  item={item}
                  imageSize={imageSize}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// --- Winner Display ---
function WinnerDisplay({ item, imageSize }: { item: FreedropItem; imageSize: number }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const glow = rarityColors[item.rarity.toLowerCase()] || rarityColors.common

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ y: 10, opacity: 0.8 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative">
        <div
          className="absolute -inset-10 rounded-full blur-2xl"
          style={{ backgroundColor: glow, opacity: 0.12 }}
        />
        <div
          className="absolute -inset-4 rounded-full blur-lg"
          style={{ backgroundColor: glow, opacity: 0.2 }}
        />
        <motion.img
          src={item.image_url || 'https://via.placeholder.com/120'}
          alt={item.name}
          className="relative object-contain"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: imageSize,
            height: imageSize,
            filter: `drop-shadow(0 0 20px ${glow}40) drop-shadow(0 4px 12px ${glow}25)`,
          }}
        />
      </div>

      <div className="text-center">
        <motion.div
          className="text-sm font-semibold mb-1.5"
          style={{ color: isDark ? '#C0B8AD' : 'rgba(0,0,0,0.8)' }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {item.name}
        </motion.div>
        <motion.div
          className="flex items-center justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <img
            src="https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/images/image_2025-09-06_234243634.png"
            alt="coin"
            className="w-4 h-4"
          />
          <span className="text-base font-bold" style={{ color: glow }}>
            {item.market_value.toLocaleString()}
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// --- Wheel Item ---
function WheelItem({ item, imageSize }: { item: FreedropItem; imageSize: number }) {
  const glow = rarityColors[item.rarity?.toLowerCase()] || rarityColors.common
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{ width: ITEM_WIDTH, height: '100%', padding: `0 ${CARD_INSET}px` }}
    >
      <div style={{
        width: '100%', height: '86%', borderRadius: '14px',
        background: 'linear-gradient(158deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${glow}42`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.09), 0 4px 16px rgba(0,0,0,0.45), 0 0 0 1px ${glow}12`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent 5%, ${glow}cc 40%, ${glow}cc 60%, transparent 95%)`,
          boxShadow: `0 0 10px ${glow}80`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 0%, ${glow}16 0%, transparent 60%)`,
        }} />
        <img
          src={item.image_url || 'https://via.placeholder.com/80'}
          alt={item.name}
          className="object-contain"
          style={{
            width: imageSize * 0.86, height: imageSize * 0.86,
            position: 'relative', zIndex: 1,
            filter: `drop-shadow(0 4px 12px ${glow}50)`,
          }}
        />
        <div style={{
          width: '5px', height: '5px', borderRadius: '50%', marginTop: '5px',
          backgroundColor: glow, boxShadow: `0 0 6px ${glow}`, zIndex: 1,
        }} />
      </div>
    </div>
  )
}

export default Wheel