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

  // Page d'accueil sans padding (fullscreen hero)
  const isHomePage = pathname === '/'

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavAndChat && <Navbar />}

      <main className="flex-1" style={{ paddingTop: hideNavAndChat || isHomePage ? '0' : '80px' }}>
        {children}
      </main>

      {/* Bouton + Panel Chat */}
      {!hideNavAndChat && <ChatButton />}
    </div>
  )
}