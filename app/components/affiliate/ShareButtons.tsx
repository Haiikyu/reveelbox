// components/affiliate/ShareButtons.tsx - Boutons de partage optimisés
'use client'

import { motion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import { AffiliateClientUtils } from '@/utils/affiliate'

interface ShareButtonsProps {
  affiliateLink: string
  message: string
  onShare?: (platform: string) => void
}

const socialPlatforms = [
  { 
    platform: 'twitter', 
    name: 'Twitter', 
    color: 'bg-blue-500 hover:bg-blue-600', 
    icon: '🐦' 
  },
  { 
    platform: 'facebook', 
    name: 'Facebook', 
    color: 'bg-blue-600 hover:bg-blue-700', 
    icon: '📘' 
  },
  { 
    platform: 'whatsapp', 
    name: 'WhatsApp', 
    color: 'bg-green-500 hover:bg-green-600', 
    icon: '📱' 
  },
  { 
    platform: 'telegram', 
    name: 'Telegram', 
    color: 'bg-blue-400 hover:bg-blue-500', 
    icon: '✈️' 
  },
  { 
    platform: 'linkedin', 
    name: 'LinkedIn', 
    color: 'bg-blue-700 hover:bg-blue-800', 
    icon: '💼' 
  },
  { 
    platform: 'reddit', 
    name: 'Reddit', 
    color: 'bg-red-500 hover:bg-red-600', 
    icon: '🔴' 
  }
]

export default function ShareButtons({ affiliateLink, message, onShare }: ShareButtonsProps): JSX.Element {
  const handleShare = (platform: string): void => {
    AffiliateClientUtils.shareOnSocial(platform, affiliateLink, message)
    onShare?.(platform)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Share2 className="h-4 w-4" />
        <span className="text-sm font-medium">Partager sur les réseaux</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {socialPlatforms.map(social => (
          <motion.button
            key={social.platform}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleShare(social.platform)}
            className={`${social.color} text-white p-3 rounded-xl transition-colors font-medium text-sm flex flex-col items-center gap-2`}
          >
            <span className="text-lg">{social.icon}</span>
            <span className="hidden sm:inline text-xs">{social.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Partage natif si disponible */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            navigator.share({
              title: 'Rejoins ReveelBox !',
              text: message,
              url: affiliateLink
            }).catch(console.error)
          }}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Partager avec...
        </motion.button>
      )}
    </div>
  )
}