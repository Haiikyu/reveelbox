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
  hue?: number // Couleur pour thème clair
  velocityX?: number // Vélocité horizontale
  velocityY?: number // Vélocité verticale
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
    const starCount = isDark ? 100 : 40 // Version épurée pour thème clair
    const nebulaCount = isDark ? 4 : 2 // Moins de nébuleuses en clair

    // Obtenir les couleurs hybrid CSS
    const getHybridColor = (varName: string) => {
      if (typeof window === 'undefined') return '230' // Fallback SSR
      const root = document.documentElement
      const color = getComputedStyle(root).getPropertyValue(varName).trim()
      // Convertir HSL en teinte si possible, sinon utiliser valeur par défaut
      const hslMatch = color.match(/hsl\((\d+)/)
      return hslMatch ? hslMatch[1] : '230'
    }

    const primaryHue = parseInt(getHybridColor('--hybrid-accent-primary'))
    const secondaryHue = parseInt(getHybridColor('--hybrid-accent-secondary'))

    // Création des étoiles scintillantes - version épurée
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: isDark ? Math.random() * 1.2 + 0.3 : Math.random() * 2.5 + 1.5, // Taille 1.5-4px en clair
        baseOpacity: isDark ? Math.random() * 0.4 + 0.2 : Math.random() * 0.3 + 0.3, // Opacité modérée en clair (0.3-0.6)
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        depth: Math.random() * 2.5 + 1,
        parallaxSpeed: Math.random() * 0.015 + 0.008,
        hue: 6, // Couleur saumon fixe (hsl(6, 93%, 71%))
        velocityX: (Math.random() - 0.5) * 0.2, // Mouvement horizontal léger
        velocityY: (Math.random() - 0.5) * 0.2  // Mouvement vertical léger
      })
    }

    // Création des nébuleuses colorées - version épurée
    const nebulaColors = isDark ? [
      { hue: primaryHue, name: 'primary' },
      { hue: secondaryHue, name: 'secondary' },
      { hue: 200, name: 'blue' },
    ] : [
      { hue: 6, name: 'salmon' },  // Saumon pour thème clair
      { hue: 10, name: 'coral' },  // Variation corail
    ]

    for (let i = 0; i < nebulaCount; i++) {
      const color = nebulaColors[Math.floor(Math.random() * nebulaColors.length)]

      nebulas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 120 + 60,
        hue: color.hue + (Math.random() - 0.5) * 15,
        opacity: isDark ? Math.random() * 0.08 + 0.04 : Math.random() * 0.08 + 0.05, // Opacité plus élevée en clair
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
          // Nébuleuses saumon avec saturation élevée
          gradient.addColorStop(0, `hsla(${nebula.hue}, 93%, 71%, ${currentOpacity * 0.8})`)
          gradient.addColorStop(0.3, `hsla(${nebula.hue}, 90%, 68%, ${currentOpacity * 0.6})`)
          gradient.addColorStop(0.6, `hsla(${nebula.hue}, 85%, 65%, ${currentOpacity * 0.3})`)
          gradient.addColorStop(1, `hsla(${nebula.hue}, 80%, 62%, 0)`)

          // Appliquer blur pour nébuleuses en clair
          ctx.filter = 'blur(20px)'
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2)
        ctx.fill()

        // Réinitialiser filtre
        ctx.filter = 'none'
      })

      // Dessiner les étoiles scintillantes
      stars.forEach((star) => {
        // Mouvement constant pour thème clair uniquement
        if (!isDark && star.velocityX && star.velocityY) {
          star.x += star.velocityX
          star.y += star.velocityY

          // Rebond sur les bords
          if (star.x < 0 || star.x > canvas.width) star.velocityX *= -1
          if (star.y < 0 || star.y > canvas.height) star.velocityY *= -1
        }

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
          // Couleur saumon pour thème clair
          ctx.fillStyle = `hsla(6, 93%, 71%, ${opacity * 0.8})`
        }

        // Appliquer blur pour thème clair
        if (!isDark) {
          ctx.filter = `blur(${star.size * 0.3}px)`
        }

        ctx.beginPath()
        ctx.arc(x, y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Réinitialiser le filtre
        ctx.filter = 'none'

        // Effet de lueur pour les grandes étoiles
        if (star.size > 1.5 && opacity > 0.6) { // Seuil ajusté pour moins de glows
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 6) // Glow plus étendu
          if (isDark) {
            glowGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`)
            glowGradient.addColorStop(0.5, `rgba(200, 220, 255, ${opacity * 0.15})`)
            glowGradient.addColorStop(1, 'rgba(150, 180, 255, 0)')
          } else {
            // Glow saumon intense avec blur
            glowGradient.addColorStop(0, `hsla(6, 93%, 71%, ${opacity * 0.5})`)
            glowGradient.addColorStop(0.5, `hsla(6, 90%, 68%, ${opacity * 0.25})`)
            glowGradient.addColorStop(1, `hsla(6, 85%, 65%, 0)`)

            ctx.filter = `blur(${star.size * 0.5}px)`
          }

          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(x, y, star.size * 6, 0, Math.PI * 2)
          ctx.fill()

          ctx.filter = 'none'
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
      className="fixed inset-0 pointer-events-none opacity-70 dark:opacity-35"
      style={{ zIndex: 0, backgroundColor: 'transparent' }}
    />
  )
}
