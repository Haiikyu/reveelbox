// app/hooks/useSound.ts - Hook simplifié pour les sons

'use client'

import { useCallback, useEffect, useState } from 'react'

type SoundName = 'tick' | 'snap' | 'drag-start' | 'drag-end' | 'reveal' | 'whoosh' | 'click'

export function useSound() {
  const [enabled, setEnabled] = useState(true)

  const playSound = useCallback((soundName: SoundName) => {
    if (!enabled) return
    
    // Utiliser la fonction globale si elle existe
    if (typeof window !== 'undefined' && window.playReveelSound) {
      window.playReveelSound(soundName)
    }
  }, [enabled])

  const toggleSound = useCallback(() => {
    setEnabled(prev => !prev)
  }, [])

  return { playSound, enabled, toggleSound, setEnabled }
}

export function useSoundEffect(soundName: SoundName, trigger: boolean) {
  const { playSound } = useSound()

  useEffect(() => {
    if (trigger) {
      playSound(soundName)
    }
  }, [trigger, soundName, playSound])
}