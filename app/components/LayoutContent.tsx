'use client'

import { usePathname } from 'next/navigation'
import Navbar, { PageWrapper } from './Navbar'
import Footer from './Footer'
import dynamic from 'next/dynamic'

// Désactiver SSR pour éviter l'erreur d'hydration avec les SVG
const ChatButton = dynamic(() => import('./ChatPanel').then(mod => ({ default: mod.ChatButton })), { ssr: false })

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Pages où on ne veut pas afficher la navbar et le chat
  const hideNavAndChat = pathname === '/login' || pathname === '/signup'

  // Pages fullscreen sans navbar (garde le chat)
  const isFullscreen = pathname === '/battles/create' || pathname === '/battles/demo'

  // Page d'accueil sans padding (fullscreen hero)
  const isHomePage = pathname === '/'

  // Pages sans footer (chat, upgrade car plein écran)
  const hideFooter = pathname === '/chat' || pathname === '/upgrade' || hideNavAndChat || isFullscreen

  const hideNav = hideNavAndChat || isFullscreen
  const noPadding = hideNavAndChat || isHomePage || isFullscreen

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNav && <Navbar />}

      <main className="flex-1" style={{ paddingTop: noPadding ? '0' : '80px' }}>
        {children}
      </main>

      {/* Footer global */}
      {!hideFooter && <Footer />}

      {/* Bouton + Panel Chat */}
      {!hideNavAndChat && <ChatButton />}
    </div>
  )
}