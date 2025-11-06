'use client'

import { usePathname } from 'next/navigation'
import Navbar, { PageWrapper } from './Navbar'
import Footer from './Footer'
import ChatBubble from './chat/ChatBubble'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Pages où on ne veut pas afficher la navbar et le chat
  const hideNavAndChat = pathname === '/login' || pathname === '/signup'

  return (
    <div className="flex flex-col min-h-screen">
      {!hideNavAndChat && <Navbar />}

      <main className="flex-1" style={{ paddingTop: hideNavAndChat ? '0' : '80px' }}>
        {children}
      </main>

      {!hideNavAndChat && <ChatBubble />}
      {!hideNavAndChat && <Footer />}
    </div>
  )
}
