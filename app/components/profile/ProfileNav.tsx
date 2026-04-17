'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, BarChart2, Clock, Users, Settings } from 'lucide-react'
import type { ProfileTab } from '@/app/types/profile'

interface ProfileNavProps {
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
  isOwnProfile: boolean
  pendingFriendsCount?: number
}

interface NavItem {
  id: ProfileTab
  label: string
  icon: React.ElementType
  ownOnly?: boolean
}

const TABS: NavItem[] = [
  { id: 'overview',  label: 'Aperçu',       icon: LayoutDashboard },
  { id: 'stats',     label: 'Statistiques', icon: BarChart2 },
  { id: 'history',   label: 'Historique',   icon: Clock },
  { id: 'friends',   label: 'Amis',         icon: Users,    ownOnly: true },
  { id: 'settings',  label: 'Paramètres',   icon: Settings, ownOnly: true },
]

export default function ProfileNav({ activeTab, onTabChange, isOwnProfile, pendingFriendsCount = 0 }: ProfileNavProps) {
  const visible = TABS.filter(t => !t.ownOnly || isOwnProfile)
  const navRef = useRef<HTMLElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Auto-scroll vers l'onglet actif
  useEffect(() => {
    buttonRefs.current[activeTab]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeTab])

  // Suivi de l'état de scroll pour le fade
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const checkScroll = () => {
      setCanScrollRight(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 2)
    }

    checkScroll()
    nav.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      nav.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [visible.length])

  return (
    <div
      className="sticky top-16 z-40"
      style={{
        background: 'linear-gradient(to bottom, rgba(11,17,32,0.7) 0%, #0b1120 35%)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 relative">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <nav
          ref={navRef as any}
          className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px scroll-smooth py-0.5"
        >
          {visible.map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                ref={(el) => { buttonRefs.current[tab.id] = el }}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-white' : 'text-gray-600'}`} />
                {tab.label}
                {tab.id === 'friends' && pendingFriendsCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-[#4578be] text-white rounded-full">
                    {pendingFriendsCount}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="profile-nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: 'linear-gradient(90deg, #4578be, #5989d8)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Fade gradient droit — visible quand il reste du contenu à scroller */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, transparent, #0b1120)' }}
          />
        )}
      </div>
    </div>
  )
}
