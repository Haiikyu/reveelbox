import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './components/AuthProvider'
import { AuthDebugPanel } from './components/AuthDebugPanel'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ReveelBox - Loot Boxes avec des Objets Réels',
  description: 'Découvrez des objets uniques dans nos loot boxes mystères',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          {/* Debug Panel - Visible seulement en développement */}
          <AuthDebugPanel />
        </AuthProvider>
      </body>
    </html>
  )
}