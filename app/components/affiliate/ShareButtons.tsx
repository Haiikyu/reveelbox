// components/affiliate/ShareButtons.tsx - Boutons de partage optimisés
'use client'

import { motion } from 'framer-motion'
import { Share2 } from 'lucide-react'
import { AffiliateClientUtils } from '@/utils/affiliate'
import SocialIcon from './SocialIcon'

interface ShareButtonsProps {
  affiliateLink: string
  message: string
  onShare?: (platform: string) => void
}

const socialPlatforms = [
  {
    platform: 'twitter',
    name: 'Twitter',
    color: 'bg-slate-900 hover:bg-black dark:bg-slate-900 dark:hover:bg-black'
  },
  {
    platform: 'facebook',
    name: 'Facebook',
    color: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
  },
  {
    platform: 'whatsapp',
    name: 'WhatsApp',
    color: 'bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600'
  },
  {
    platform: 'telegram',
    name: 'Telegram',
    color: 'bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-600'
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn',
    color: 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-800'
  },
  {
    platform: 'reddit',
    name: 'Reddit',
    color: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700'
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
            <SocialIcon platform={social.platform} className="w-5 h-5" />
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