// app/components/ui/NotificationSystem.tsx - VERSION STABLE CORRIGÉE
'use client'

import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

// Types TypeScript stricts
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

// Context pour les notifications
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Hook pour utiliser le système de notifications
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Provider pour les notifications - VERSION CORRIGÉE POUR ÉVITER LES BOUCLES
interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps): JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const notificationCache = useRef<Map<string, number>>(new Map())

  // CORRECTION: Système de throttling pour éviter les doublons
  const shouldAddNotification = useCallback((notification: Omit<Notification, 'id'>): boolean => {
    const key = `${notification.type}-${notification.title}-${notification.message || ''}`
    const now = Date.now()
    const lastTime = notificationCache.current.get(key) || 0
    
    // Éviter les doublons dans un délai de 3 secondes
    if (now - lastTime < 3000) {
      return false
    }
    
    notificationCache.current.set(key, now)
    return true
  }, [])

  // OPTIMISATION: Callback stable avec useCallback
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    if (!shouldAddNotification(notification)) {
      return
    }

    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      id,
      duration: 5000,
      persistent: false,
      ...notification
    }

    setNotifications(prev => {
      // Limiter à 5 notifications maximum
      const updated = [...prev, newNotification]
      if (updated.length > 5) {
        const removed = updated.shift()
        if (removed) {
          const timeoutId = timeoutRefs.current.get(removed.id)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutRefs.current.delete(removed.id)
          }
        }
      }
      return updated
    })

    // Auto-remove après la durée spécifiée (sauf si persistent)
    if (!newNotification.persistent && newNotification.duration) {
      const timeoutId = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
        timeoutRefs.current.delete(id)
      }, newNotification.duration)
      
      timeoutRefs.current.set(id, timeoutId)
    }
  }, [shouldAddNotification])

  const removeNotification = useCallback((id: string) => {
    // Nettoyer le timeout s'il existe
    const timeoutId = timeoutRefs.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }
    
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    // Nettoyer tous les timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
    timeoutRefs.current.clear()
    
    setNotifications([])
  }, [])

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeoutRefs.current.clear()
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

// Container pour afficher les notifications
function NotificationContainer(): JSX.Element {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Item de notification individuel
interface NotificationItemProps {
  notification: Notification
  onRemove: (id: string) => void
}

function NotificationItem({ notification, onRemove }: NotificationItemProps): JSX.Element {
  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          iconColor: 'text-green-400',
          titleColor: 'text-green-400'
        }
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          iconColor: 'text-red-400',
          titleColor: 'text-red-400'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-400'
        }
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-400'
        }
    }
  }

  const styles = getNotificationStyles(notification.type)
  const Icon = styles.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${styles.bgColor} ${styles.borderColor} border backdrop-blur-sm rounded-lg p-4 shadow-lg pointer-events-auto`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm ${styles.titleColor} mb-1`}>
            {notification.title}
          </h4>
          
          {notification.message && (
            <p className="text-white/80 text-sm leading-relaxed">
              {notification.message}
            </p>
          )}
        </div>

        <button
          onClick={() => onRemove(notification.id)}
          className={`${styles.iconColor} hover:bg-white/10 rounded p-1 transition-colors flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar pour la durée */}
      {!notification.persistent && notification.duration && (
        <motion.div
          className={`h-1 ${styles.bgColor} rounded-full mt-3 overflow-hidden`}
        >
          <motion.div
            className={`h-full bg-gradient-to-r ${styles.iconColor.replace('text-', 'from-')} to-transparent`}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: notification.duration / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </motion.div>
  )
}

// Hook utilitaires pour les notifications rapides - VERSION STABLE
export function useQuickNotifications() {
  const { addNotification } = useNotifications()

  // CORRECTION: Callbacks stables avec useCallback
  const success = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'success', title, message, ...options })
  }, [addNotification])

  const error = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'error', title, message, ...options })
  }, [addNotification])

  const warning = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'warning', title, message, ...options })
  }, [addNotification])

  const info = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    addNotification({ type: 'info', title, message, ...options })
  }, [addNotification])

  return { success, error, warning, info }
}

// Hook spécialisé pour les battles - VERSION CORRIGÉE
export function useBattleNotifications() {
  const notifications = useQuickNotifications()
  const lastNotificationRef = useRef<Map<string, number>>(new Map())
  
  // OPTIMISATION: Throttling des notifications pour éviter le spam
  const shouldNotify = useCallback((key: string, cooldown: number = 5000): boolean => {
    const now = Date.now()
    const lastShown = lastNotificationRef.current.get(key) || 0
    
    if (now - lastShown > cooldown) {
      lastNotificationRef.current.set(key, now)
      return true
    }
    return false
  }, [])

  const playerJoined = useCallback((playerName: string) => {
    if (shouldNotify(`player-joined-${playerName}`, 3000)) {
      notifications.info(
        'Nouveau joueur',
        `${playerName} a rejoint la battle`,
        { duration: 3000 }
      )
    }
  }, [notifications, shouldNotify])

  const playerLeft = useCallback((playerName: string) => {
    if (shouldNotify(`player-left-${playerName}`, 3000)) {
      notifications.warning(
        'Joueur parti',
        `${playerName} a quitté la battle`,
        { duration: 3000 }
      )
    }
  }, [notifications, shouldNotify])

  const battleStarting = useCallback((countdown: number) => {
    if (shouldNotify('battle-starting', 10000)) {
      notifications.info(
        'Battle commence',
        `La battle commence dans ${countdown} secondes`,
        { duration: 2000 }
      )
    }
  }, [notifications, shouldNotify])

  const battleStarted = useCallback(() => {
    if (shouldNotify('battle-started', 30000)) {
      notifications.success(
        'Battle commencée',
        'Que les meilleurs gagnent !',
        { duration: 3000 }
      )
    }
  }, [notifications, shouldNotify])

  const roundComplete = useCallback((round: number, item: string, value: number) => {
    notifications.success(
      `Round ${round} terminé`,
      `Vous avez gagné ${item} (${value.toFixed(2)}€)`,
      { duration: 4000 }
    )
  }, [notifications])

  const battleWon = useCallback((prize: number) => {
    notifications.success(
      'Victoire !',
      `Vous avez gagné ${prize.toFixed(2)}€ !`,
      { duration: 8000, persistent: false }
    )
  }, [notifications])

  const battleLost = useCallback(() => {
    notifications.info(
      'Battle terminée',
      'Meilleure chance la prochaine fois !',
      { duration: 5000 }
    )
  }, [notifications])

  const connectionError = useCallback(() => {
    if (shouldNotify('connection-error', 30000)) {
      notifications.error(
        'Connexion perdue',
        'Tentative de reconnexion...',
        { persistent: true }
      )
    }
  }, [notifications, shouldNotify])

  const reconnected = useCallback(() => {
    if (shouldNotify('reconnected', 10000)) {
      notifications.success(
        'Reconnecté',
        'La connexion a été rétablie',
        { duration: 3000 }
      )
    }
  }, [notifications, shouldNotify])

  return {
    playerJoined,
    playerLeft,
    battleStarting,
    battleStarted,
    roundComplete,
    battleWon,
    battleLost,
    connectionError,
    reconnected
  }
}

export default NotificationProvider