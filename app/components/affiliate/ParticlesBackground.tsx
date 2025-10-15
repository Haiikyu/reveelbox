'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '../ThemeProvider'

interface Star {
  x: number
  y: number
  size: number
  baseOpacity: number
  twinkleSpeed: number
  twinkleOffset: number
  depth: number
  parallaxSpeed: number
}

interface Nebula {
  x: number
  y: number
  radius: number
  hue: number
  opacity: number
  driftX: number
  driftY: number
}

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars: Star[] = []
    const nebulas: Nebula[] = []

    const isDark = resolvedTheme === 'dark'
    const starCount = isDark ? 100 : 60
    const nebulaCount = isDark ? 4 : 2

    // Création des étoiles scintillantes - version minimaliste
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.2 + 0.3,
        baseOpacity: isDark ? Math.random() * 0.4 + 0.2 : Math.random() * 0.25 + 0.1,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        depth: Math.random() * 2.5 + 1,
        parallaxSpeed: Math.random() * 0.015 + 0.008
      })
    }

    // Création des nébuleuses colorées - version épurée
    const nebulaColors = isDark ? [
      { hue: 230, name: 'indigo' },   // Émeraude
      { hue: 180, name: 'cyan' },      // Cyan
      { hue: 200, name: 'blue' },      // Bleu
    ] : [
      { hue: 230, name: 'indigo' },   // Émeraude clair
      { hue: 200, name: 'blue' },      // Bleu clair
    ]

    for (let i = 0; i < nebulaCount; i++) {
      const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)]

      nebulas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 120 + 60,
        hue: color.hue + (Math.random() - 0.5) * 15,
        opacity: isDark ? Math.random() * 0.08 + 0.04 : Math.random() * 0.05 + 0.02,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.1
      })
    }

    let frame = 0
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove)

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      const isDark = resolvedTheme === 'dark'

      // Dessiner les nébuleuses (nuages cosmiques)
      nebulas.forEach((nebula) => {
        // Drift lent
        nebula.x += nebula.driftX
        nebula.y += nebula.driftY

        // Rebond sur les bords
        if (nebula.x < -nebula.radius || nebula.x > canvas.width + nebula.radius) {
          nebula.driftX *= -1
        }
        if (nebula.y < -nebula.radius || nebula.y > canvas.height + nebula.radius) {
          nebula.driftY *= -1
        }

        // Gradient radial large et très diffus
        const gradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.radius
        )

        const pulse = Math.sin(frame * 0.008 + nebula.x) * 0.3 + 0.7
        const currentOpacity = nebula.opacity * pulse

        if (isDark) {
          gradient.addColorStop(0, `hsla(${nebula.hue}, 70%, 65%, ${currentOpacity * 0.6})`)
          gradient.addColorStop(0.3, `hsla(${nebula.hue}, 65%, 55%, ${currentOpacity * 0.4})`)
          gradient.addColorStop(0.6, `hsla(${nebula.hue}, 60%, 45%, ${currentOpacity * 0.2})`)
          gradient.addColorStop(1, `hsla(${nebula.hue}, 55%, 35%, 0)`)
        } else {
          gradient.addColorStop(0, `hsla(${nebula.hue}, 50%, 75%, ${currentOpacity * 0.5})`)
          gradient.addColorStop(0.3, `hsla(${nebula.hue}, 45%, 70%, ${currentOpacity * 0.3})`)
          gradient.addColorStop(0.6, `hsla(${nebula.hue}, 40%, 65%, ${currentOpacity * 0.15})`)
          gradient.addColorStop(1, `hsla(${nebula.hue}, 35%, 60%, 0)`)
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Dessiner les étoiles scintillantes
      stars.forEach((star) => {
        // Parallax subtil avec la souris
        const parallaxX = (mouseX - canvas.width / 2) * star.parallaxSpeed * 0.01
        const parallaxY = (mouseY - canvas.height / 2) * star.parallaxSpeed * 0.01

        const x = star.x + parallaxX
        const y = star.y + parallaxY

        // Scintillement
        const twinkle = Math.sin(frame * star.twinkleSpeed + star.twinkleOffset)
        const opacity = star.baseOpacity * (0.7 + twinkle * 0.3)

        // Étoile principale - couleur adaptée au thème
        if (isDark) {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        } else {
          ctx.fillStyle = `rgba(100, 100, 120, ${opacity * 0.6})`
        }
        ctx.beginPath()
        ctx.arc(x, y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Effet de lueur pour les grandes étoiles
        if (star.size > 1.5 && opacity > 0.7) {
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 4)
          if (isDark) {
            glowGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`)
            glowGradient.addColorStop(0.5, `rgba(200, 220, 255, ${opacity * 0.15})`)
            glowGradient.addColorStop(1, 'rgba(150, 180, 255, 0)')
          } else {
            glowGradient.addColorStop(0, `rgba(100, 150, 200, ${opacity * 0.2})`)
            glowGradient.addColorStop(0.5, `rgba(120, 160, 210, ${opacity * 0.1})`)
            glowGradient.addColorStop(1, 'rgba(140, 170, 220, 0)')
          }

          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(x, y, star.size * 4, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-50 dark:opacity-35"
      style={{ zIndex: 0, backgroundColor: 'transparent' }}
    />
  )
}
