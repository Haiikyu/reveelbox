// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import './styles/design-tokens.css'
import './styles/hybrid-design-system.css'
import { AuthProvider } from './components/AuthProvider'
import { ThemeProvider } from './components/ThemeProvider'
import { LanguageProvider } from './components/LanguageProvider'
import { Providers } from './providers'
import { NotificationProvider } from './components/ui/NotificationSystem'
import LayoutContent from './components/LayoutContent'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ReveelBox - Loot Boxes avec des Objets Réels',
  description: 'Découvrez des objets uniques dans nos loot boxes mystères',
  icons: {
    icon: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png',
    shortcut: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png',
    apple: 'https://pkweofbyzygbbkervpbv.supabase.co/storage/v1/object/public/profile-images/favicon.ico.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#4578be" />
      </head>
      <body className={`${inter.className} antialiased transition-colors duration-300`}>
        <ThemeProvider defaultTheme="light" storageKey="reveelbox-theme">
          <LanguageProvider>
            <Providers>
              <AuthProvider>
                <NotificationProvider>
                  <LayoutContent>{children}</LayoutContent>
                </NotificationProvider>
              </AuthProvider>
            </Providers>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}