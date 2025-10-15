// components/affiliate/NotificationBell.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCircle, TrendingUp, Award, Gift } from 'lucide-react'
import { useAuth } from '@/app/components/AuthProvider'

interface Notification {
  id: string
  type: 'new_referral' | 'commission_earned' | 'tier_upgrade' | 'badge_earned' | 'challenge_completed'
  title: string
  message: string
  amount?: number
  created_at: string
  is_read: boolean
}

export default function AffiliateNotificationBell(): JSX.Element {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Charger les notifications
  const loadNotifications = async (): Promise<void> => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/affiliate/notifications?user_id=${user.id}&unread_only=false`)
      const data = await response.json()
      
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Marquer comme lues
  const markAsRead = async (notificationIds: string[]): Promise<void> => {
    try {
      await fetch('/api/affiliate/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds,
          mark_as_read: true
        })
      })

      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, is_read: true }
            : notif
        )
      )
    } catch (error) {
      console.error('Erreur marquage lecture:', error)
    }
  }

  // Icône selon le type de notification
  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: "h-5 w-5" }
    switch (type) {
      case 'new_referral':
        return <Gift {...iconProps} className="h-5 w-5 text-blue-600" />
      case 'commission_earned':
        return <TrendingUp {...iconProps} className="h-5 w-5 text-green-600" />
      case 'tier_upgrade':
        return <Award {...iconProps} className="h-5 w-5 text-purple-600" />
      case 'badge_earned':
        return <Award {...iconProps} className="h-5 w-5 text-yellow-600" />
      case 'challenge_completed':
        return <CheckCircle {...iconProps} className="h-5 w-5 text-orange-600" />
      default:
        return <Bell {...iconProps} className="h-5 w-5 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (user) {
      loadNotifications()
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (!user) return <></>

  return (
    <div className="relative">
      {/* Bouton notification */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Panel des notifications */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      const unreadIds = notifications
                        .filter(n => !n.is_read)
                        .map(n => n.id)
                      markAsRead(unreadIds)
                    }}
                    className="text-sm text-green-600 hover:text-green-700 mt-1"
                  >
                    Marquer tout comme lu
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Chargement...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucune notification
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead([notification.id])
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.amount && (
                              <div className="text-sm font-semibold text-green-600 mt-1">
                                +{notification.amount.toFixed(2)}€
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-2">
                              {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 border-t border-gray-100 text-center">
                  <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
