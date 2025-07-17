// app/layout.js
import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from './components/Navbar'
import AuthProvider from './components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ReveelBox - Ouvrez des boîtes mystères',
  description: 'Découvrez des objets rares et légendaires dans nos loot boxes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}