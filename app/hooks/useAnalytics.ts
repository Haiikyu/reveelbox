import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const useAnalytics = () => {
  const trackEvent = async (eventName: string, properties: Record<string, any> = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      await supabase
        .from('analytics_events')
        .insert({
          event_name: eventName,
          user_id: session?.user?.id,
          properties: properties,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href
        })
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  return { trackEvent }
}

// Usage example:
// const { trackEvent } = useAnalytics()
// trackEvent('giveaway_joined', { giveaway_id: giveawayId })
// trackEvent('message_sent', { message_length: content.length })