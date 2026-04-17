// utils/wheelSounds.ts - Sound design pour la roulette (Web Audio API)

class WheelSoundEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private muted = false

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.6
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  private getOutput(): GainNode {
    this.getContext()
    return this.masterGain!
  }

  setMuted(muted: boolean) {
    this.muted = muted
  }

  /**
   * Tick sonore quand un item passe au centre.
   * - Fréquence varie selon la rareté (plus rare = plus aigu)
   * - Volume très bas pour ne pas agresser
   * - Durée ultra-courte (~25ms)
   */
  playTick(rarityColor?: string) {
    if (this.muted) return
    try {
      const ctx = this.getContext()
      const output = this.getOutput()
      const now = ctx.currentTime

      // Fréquence selon rareté
      const freq = rarityColor === '#f59e0b' ? 1400   // legendary - plus aigu
        : rarityColor === '#d946ef' ? 1200             // epic
        : rarityColor === '#8b5cf6' ? 1050             // rare
        : rarityColor === '#3b82f6' ? 900              // uncommon
        : 800                                          // common

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      // Légère descente en fréquence pour un "click" naturel
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.025)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

      osc.connect(gain)
      gain.connect(output)
      osc.start(now)
      osc.stop(now + 0.03)
    } catch {
      // Silent fail - audio non supporté
    }
  }

  /**
   * Son de victoire - arpège ascendant majeur.
   * C5 → E5 → G5 → C6 avec reverb naturelle.
   * Joué quand le gagnant est révélé.
   */
  playWin(rarityColor?: string) {
    if (this.muted) return
    try {
      const ctx = this.getContext()
      const output = this.getOutput()
      const now = ctx.currentTime

      // Notes de l'arpège (Do majeur ascendant)
      const baseNotes = [523, 659, 784, 1047]

      // Les legendaries ont un arpège plus riche (ajout de la quinte haute)
      const isRare = rarityColor === '#f59e0b' || rarityColor === '#d946ef'
      const notes = isRare ? [...baseNotes, 1319] : baseNotes

      const volume = isRare ? 0.09 : 0.06

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now)

        const noteStart = now + i * 0.12
        const noteEnd = noteStart + 0.5

        gain.gain.setValueAtTime(0, noteStart)
        gain.gain.linearRampToValueAtTime(volume, noteStart + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, noteEnd)

        osc.connect(gain)
        gain.connect(output)
        osc.start(noteStart)
        osc.stop(noteEnd + 0.05)
      })

      // Note de basse douce pour donner de la profondeur
      const bassOsc = ctx.createOscillator()
      const bassGain = ctx.createGain()
      bassOsc.type = 'sine'
      bassOsc.frequency.setValueAtTime(262, now) // C4
      bassGain.gain.setValueAtTime(0, now)
      bassGain.gain.linearRampToValueAtTime(0.04, now + 0.02)
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
      bassOsc.connect(bassGain)
      bassGain.connect(output)
      bassOsc.start(now)
      bassOsc.stop(now + 0.85)
    } catch {
      // Silent fail
    }
  }

  /**
   * Son de ralentissement final - note tenue basse qui crée la tension
   * Joué quand la roulette entre dans les derniers 15% de l'animation
   */
  playSuspense() {
    if (this.muted) return
    try {
      const ctx = this.getContext()
      const output = this.getOutput()
      const now = ctx.currentTime

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.linearRampToValueAtTime(220, now + 2)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.025, now + 0.3)
      gain.gain.linearRampToValueAtTime(0.03, now + 1.5)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)

      osc.connect(gain)
      gain.connect(output)
      osc.start(now)
      osc.stop(now + 2.6)
    } catch {
      // Silent fail
    }
  }

  dispose() {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close()
    }
    this.ctx = null
    this.masterGain = null
  }
}

// Singleton
export const wheelSounds = new WheelSoundEngine()
