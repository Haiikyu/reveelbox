// app/hooks/useMagneticMouse.ts - Hook pour effet magnétique

'use client'

import { useEffect, useState, RefObject } from 'react'
import { useMotionValue } from 'framer-motion'

interface MagneticOptions {
  strength?: number
  radius?: number
}

export function useMagneticMouse(options: MagneticOptions = {}) {
  const { strength = 0.3, radius = 100 } = options
  const [magneticStrength, setMagneticStrength] = useState(strength)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return { mouseX, mouseY, magneticStrength, setMagneticStrength }
}

export function useMagneticElement(ref: RefObject<HTMLElement>, options: MagneticOptions = {}) {
  const { strength = 0.4, radius = 80 } = options
  const [isHovered, setIsHovered] = useState(false)
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

      if (distance < radius) {
        setIsHovered(true)
        const pullStrength = (1 - distance / radius) * strength
        offsetX.set(distanceX * pullStrength)
        offsetY.set(distanceY * pullStrength)
      } else {
        setIsHovered(false)
        offsetX.set(0)
        offsetY.set(0)
      }
    }

    const handleMouseLeave = () => {
      setIsHovered(false)
      offsetX.set(0)
      offsetY.set(0)
    }

    window.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref, offsetX, offsetY, radius, strength])

  return { offsetX, offsetY, isHovered }
}