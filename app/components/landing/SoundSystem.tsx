// app/components/landing/SoundSystem.tsx - Système de Sons Premium

'use client'

import { useEffect } from 'react'

interface SoundSystemProps {
  enabled: boolean
}

// URLs des sons (à remplacer par vrais assets en production)
const SOUND_URLS = {
  tick: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGN1/HRgzYEGGm98d61XBcMR6Dn8bllHAU2jdXxy3kpBSh+zPDZkj0HFmS36+ipVw==',
  snap: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA==',
  'drag-start': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGN1/HRgzYEGGm98d61XBcMR6Dn8bllHAU2jdXxy3kpBSh+zPDZkj0HFmS36+ipVw==',
  'drag-end': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA==',
  reveal: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGN1/HRgzYEGGm98d61XBcMR6Dn8bllHAU2jdXxy3kpBSh+zPDZkj0HFmS36+ipVw=='
}

export default function SoundSystem({ enabled }: SoundSystemProps) {
  useEffect(() => {
    if (!enabled) return

    // Précharger les sons
    const audioCache: { [key: string]: HTMLAudioElement } = {}

    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url)
      audio.volume = 0.3 // Volume modéré
      audio.preload = 'auto'
      audioCache[key] = audio
    })

    // Fonction globale pour jouer les sons
    window.playReveelSound = (soundName: string) => {
      if (!enabled) return
      
      const sound = audioCache[soundName]
      if (sound) {
        // Clone pour permettre plusieurs lectures simultanées
        const soundClone = sound.cloneNode(true) as HTMLAudioElement
        soundClone.volume = 0.3
        soundClone.play().catch(err => {
          // Silence les erreurs (ex: autoplay bloqué)
          console.debug('Sound play prevented:', err)
        })
      }
    }

    return () => {
      // Nettoyage
      delete (window as any).playReveelSound
      Object.values(audioCache).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [enabled])

  return null // Composant invisible
}

// Type declaration pour TypeScript
declare global {
  interface Window {
    playReveelSound?: (soundName: string) => void
  }
}