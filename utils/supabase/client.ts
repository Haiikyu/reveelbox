// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug : Vérifier les variables d'environnement
  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local')
  }
  if (!key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY manquant dans .env.local')
  }

  console.log('🔗 Création client Supabase:', {
    url: url ? 'PRESENT' : 'MISSING',
    key: key ? 'PRESENT' : 'MISSING'
  })

  const client = createBrowserClient(url!, key!)

  // Debug : Tester la connexion
  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur test connexion Supabase:', error)
    } else {
      console.log('✅ Connexion Supabase OK, session:', data.session ? 'ACTIVE' : 'INACTIVE')
    }
  })

  return client
}