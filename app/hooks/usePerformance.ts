// app/hooks/usePerformance.ts - Hooks pour optimiser les performances
import { useCallback, useEffect, useRef, useState } from 'react'

// Hook pour débouncer les actions
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook pour les animations optimisées
export function useOptimizedAnimation() {
  const animationRef = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = useCallback((
    duration: number,
    onUpdate: (progress: number) => void,
    onComplete?: () => void
  ) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    setIsAnimating(true)
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Courbe d'easing cubic-bezier optimisée
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      onUpdate(easeProgress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        onComplete?.()
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [])

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setIsAnimating(false)
  }, [])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return { startAnimation, stopAnimation, isAnimating }
}

// Hook pour la gestion des intersections (lazy loading)
export function useIntersectionObserver(
  threshold: number = 0.1,
  rootMargin: string = '0px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      { threshold, rootMargin }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [threshold, rootMargin])

  return { targetRef, isIntersecting }
}

// Hook pour optimiser les requêtes Supabase
export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())

  const { enabled = true, staleTime = 300000, cacheTime = 600000 } = options || {}

  const executeQuery = useCallback(async () => {
    if (!enabled) return

    // Vérifier le cache
    const cached = cacheRef.current.get(queryKey)
    if (cached && Date.now() - cached.timestamp < staleTime) {
      setData(cached.data)
      return cached.data
    }

    setLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      
      // Mettre en cache
      cacheRef.current.set(queryKey, {
        data: result,
        timestamp: Date.now()
      })

      // Nettoyer le cache périodiquement
      setTimeout(() => {
        const entries = Array.from(cacheRef.current.entries())
        entries.forEach(([key, value]) => {
          if (Date.now() - value.timestamp > cacheTime) {
            cacheRef.current.delete(key)
          }
        })
      }, cacheTime)

      setData(result)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [queryKey, queryFn, enabled, staleTime, cacheTime])

  useEffect(() => {
    executeQuery()
  }, [executeQuery])

  return { data, loading, error, refetch: executeQuery }
}

// Hook pour la gestion mémoire des listes
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const visibleItems = items.slice(visibleStart, visibleEnd)
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  }
}

// Hook pour éviter les re-renders inutiles
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback((...args: any[]) => {
    return callbackRef.current(...args)
  }, []) as T
}

// Hook pour le préchargement d'images
export function useImagePreloader(imageUrls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const preloadImages = useCallback(async (urls: string[]) => {
    setIsLoading(true)
    const loaded = new Set<string>()

    await Promise.allSettled(
      urls.map(url => 
        new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            loaded.add(url)
            resolve()
          }
          img.onerror = reject
          img.src = url
        })
      )
    )

    setLoadedImages(loaded)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (imageUrls.length > 0) {
      preloadImages(imageUrls)
    }
  }, [imageUrls, preloadImages])

  return { loadedImages, isLoading, preloadImages }
}

// Hook pour la détection des performances de l'appareil
export function useDevicePerformance() {
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low'>('medium')

  useEffect(() => {
    // Détection basée sur navigator.hardwareConcurrency et performance
    const cores = navigator.hardwareConcurrency || 2
    const memory = (navigator as any).deviceMemory || 4

    // Test de performance simple
    const start = performance.now()
    for (let i = 0; i < 100000; i++) {
      Math.random()
    }
    const duration = performance.now() - start

    if (cores >= 8 && memory >= 8 && duration < 5) {
      setPerformanceLevel('high')
    } else if (cores >= 4 && memory >= 4 && duration < 10) {
      setPerformanceLevel('medium')
    } else {
      setPerformanceLevel('low')
    }
  }, [])

  return performanceLevel
}

// Hook pour la gestion d'état optimisée avec cache
export function useCachedState<T>(
  key: string,
  initialValue: T,
  ttl: number = 300000 // 5 minutes par défaut
) {
  const [state, setState] = useState<T>(() => {
    try {
      const cached = sessionStorage.getItem(key)
      if (cached) {
        const { value, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < ttl) {
          return value
        }
      }
    } catch (error) {
      console.warn('Error reading cached state:', error)
    }
    return initialValue
  })

  const setCachedState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(prevState)
        : value

      try {
        sessionStorage.setItem(key, JSON.stringify({
          value: newValue,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Error caching state:', error)
      }

      return newValue
    })
  }, [key])

  return [state, setCachedState] as const
}

// Hook pour throttler les actions
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((...args: any[]) => {
    const now = Date.now()
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now
      return callback(...args)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now()
        callback(...args)
      }, delay - (now - lastCall.current))
    }
  }, [callback, delay]) as T
}