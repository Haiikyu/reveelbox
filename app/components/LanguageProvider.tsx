// app/components/LanguageProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Locale = 'fr' | 'en' | 'es' | 'de'

export interface LanguageInfo {
  code: Locale
  label: string
  flag: string
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

interface LanguageProviderState {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const initialState: LanguageProviderState = {
  locale: 'fr',
  setLocale: () => null,
  t: (key: string) => key,
}

const LanguageProviderContext = createContext<LanguageProviderState>(initialState)

const STORAGE_KEY = 'reveelbox-locale'

// Dictionnaires de traductions
// Pour l'instant, structure minimale — les traductions seront ajoutées au fur et à mesure
const dictionaries: Record<Locale, Record<string, string>> = {
  fr: {
    // Navbar
    'nav.unboxing': 'Unboxing',
    'nav.battles': 'Battles',
    'nav.games': 'Games',
    'nav.affiliates': 'Affiliés',
    'nav.freedrop': 'Free Drop',
    'nav.shop': 'Shop',
    'nav.leaderboard': 'Leaderboard',
    'nav.profile': 'Profil',
    'nav.inventory': 'Inventaire',
    'nav.contact': 'Contact',
    'nav.theme': 'Thème',
    'nav.language': 'Langue',
    'nav.admin': 'Admin',
    'nav.logout': 'Déco.',
    'nav.login': 'Connexion',
    'nav.signup': "S'inscrire",
    'nav.recharge': 'Recharger',
    'nav.soon': 'BIENTÔT',
    'nav.coins_played': 'coins joués',
    'nav.level': 'Niveau',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.retry': 'Réessayer',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.save': 'Enregistrer',
    'common.close': 'Fermer',
    'common.search': 'Rechercher',
    'common.filters': 'Filtres',
    'common.all': 'Tout',
    'common.open': 'Ouvrir',
    'common.free': 'GRATUIT',
  },
  en: {
    // Navbar
    'nav.unboxing': 'Unboxing',
    'nav.battles': 'Battles',
    'nav.games': 'Games',
    'nav.affiliates': 'Affiliates',
    'nav.freedrop': 'Free Drop',
    'nav.shop': 'Shop',
    'nav.leaderboard': 'Leaderboard',
    'nav.profile': 'Profile',
    'nav.inventory': 'Inventory',
    'nav.contact': 'Contact',
    'nav.theme': 'Theme',
    'nav.language': 'Language',
    'nav.admin': 'Admin',
    'nav.logout': 'Log out',
    'nav.login': 'Log in',
    'nav.signup': 'Sign up',
    'nav.recharge': 'Top up',
    'nav.soon': 'SOON',
    'nav.coins_played': 'coins played',
    'nav.level': 'Level',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filters': 'Filters',
    'common.all': 'All',
    'common.open': 'Open',
    'common.free': 'FREE',
  },
  es: {
    'nav.unboxing': 'Unboxing',
    'nav.battles': 'Batallas',
    'nav.games': 'Juegos',
    'nav.affiliates': 'Afiliados',
    'nav.freedrop': 'Free Drop',
    'nav.shop': 'Tienda',
    'nav.leaderboard': 'Clasificación',
    'nav.profile': 'Perfil',
    'nav.inventory': 'Inventario',
    'nav.contact': 'Contacto',
    'nav.theme': 'Tema',
    'nav.language': 'Idioma',
    'nav.admin': 'Admin',
    'nav.logout': 'Salir',
    'nav.login': 'Iniciar sesión',
    'nav.signup': 'Registrarse',
    'nav.recharge': 'Recargar',
    'nav.soon': 'PRONTO',
    'nav.coins_played': 'monedas jugadas',
    'nav.level': 'Nivel',

    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.retry': 'Reintentar',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Guardar',
    'common.close': 'Cerrar',
    'common.search': 'Buscar',
    'common.filters': 'Filtros',
    'common.all': 'Todo',
    'common.open': 'Abrir',
    'common.free': 'GRATIS',
  },
  de: {
    'nav.unboxing': 'Unboxing',
    'nav.battles': 'Kämpfe',
    'nav.games': 'Spiele',
    'nav.affiliates': 'Partner',
    'nav.freedrop': 'Free Drop',
    'nav.shop': 'Shop',
    'nav.leaderboard': 'Rangliste',
    'nav.profile': 'Profil',
    'nav.inventory': 'Inventar',
    'nav.contact': 'Kontakt',
    'nav.theme': 'Design',
    'nav.language': 'Sprache',
    'nav.admin': 'Admin',
    'nav.logout': 'Abmelden',
    'nav.login': 'Anmelden',
    'nav.signup': 'Registrieren',
    'nav.recharge': 'Aufladen',
    'nav.soon': 'BALD',
    'nav.coins_played': 'Münzen gespielt',
    'nav.level': 'Level',

    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.retry': 'Erneut versuchen',
    'common.cancel': 'Abbrechen',
    'common.confirm': 'Bestätigen',
    'common.save': 'Speichern',
    'common.close': 'Schließen',
    'common.search': 'Suchen',
    'common.filters': 'Filter',
    'common.all': 'Alle',
    'common.open': 'Öffnen',
    'common.free': 'KOSTENLOS',
  },
}

/**
 * Détecte la langue du navigateur et la mappe à une locale supportée.
 * Ex: "es-MX" → "es", "en-US" → "en", "pt-BR" → "fr" (fallback)
 */
function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'fr'
  const browserLang = navigator.language?.split('-')[0]?.toLowerCase()
  if (browserLang && dictionaries[browserLang as Locale]) {
    return browserLang as Locale
  }
  return 'fr'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      // 1. D'abord le choix explicite de l'utilisateur
      const stored = localStorage.getItem(STORAGE_KEY) as Locale
      if (stored && dictionaries[stored]) return stored
      // 2. Sinon auto-détection navigateur
      return detectBrowserLocale()
    }
    return 'fr'
  })

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(STORAGE_KEY, newLocale)
    setLocaleState(newLocale)
    // Met à jour le lang de la page HTML
    document.documentElement.lang = newLocale
  }, [])

  // Sync le lang HTML au montage
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback((key: string): string => {
    return dictionaries[locale]?.[key] ?? dictionaries.fr[key] ?? key
  }, [locale])

  return (
    <LanguageProviderContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageProviderContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
