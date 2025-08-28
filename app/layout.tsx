// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './components/AuthProvider'
import { ThemeProvider } from './components/ThemeProvider'
import { Providers } from './providers'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatSystem from './components/chat/ChatSystem'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ReveelBox - Loot Boxes avec des Objets Réels',
  description: 'Découvrez des objets uniques dans nos loot boxes mystères',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#22c55e" />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <ThemeProvider defaultTheme="light" storageKey="reveelbox-theme">
          <Providers>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                
                {/* Le ThemeToggle est maintenant intégré dans la Navbar */}
                
                <main className="flex-1">
                  {children}
                </main>
                
                <Footer />
                <ChatSystem />
              </div>
            </AuthProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}