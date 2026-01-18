// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import './styles/design-tokens.css'
import './styles/hybrid-design-system.css'
import { AuthProvider } from './components/AuthProvider'
import { ThemeProvider } from './components/ThemeProvider'
import { Providers } from './providers'
import { NotificationProvider } from './components/ui/NotificationSystem'
import LayoutContent from './components/LayoutContent'


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
        <link rel="icon" href="./favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#22c55e" />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <ThemeProvider defaultTheme="light" storageKey="reveelbox-theme">
          <Providers>
            <AuthProvider>
              <NotificationProvider>
                <LayoutContent>{children}</LayoutContent>
              </NotificationProvider>
            </AuthProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
