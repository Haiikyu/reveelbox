# fix-typescript-errors.ps1
Write-Host "🔧 Correction rapide des erreurs TypeScript..." -ForegroundColor Green

# 1. Supprimer les imports obsolètes
Write-Host "`n📝 Correction des imports auth-helpers..." -ForegroundColor Yellow

# Fichiers à corriger
$filesToFix = @(
    "lib/freedrop.ts",
    "lib/hooks/useInventoryUpdates.ts",
    "lib/hooks/useSupabase.ts"
)

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        Write-Host "  - Correction de $file" -ForegroundColor Cyan
        $content = Get-Content $file -Raw
        
        # Remplacer les imports obsolètes
        $content = $content -replace "import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'", "import { createClient } from '@/utils/supabase/client'"
        $content = $content -replace "createClientComponentClient\(\)", "createClient()"
        
        Set-Content $file $content
    }
}

# 2. Créer le fichier lib/supabase.js manquant
Write-Host "`n📝 Création de lib/supabase.js..." -ForegroundColor Yellow

$supabaseContent = @'
// lib/supabase.js - TEMPORAIRE pour compatibilité
import { createClient } from '@/utils/supabase/client'

export const supabase = createClient()

// Re-export des fonctions pour compatibilité
export { createClient }
'@

Set-Content "lib/supabase.js" $supabaseContent

# 3. Nettoyer les doublons dans useSupabase.ts
Write-Host "`n📝 Nettoyage de lib/hooks/useSupabase.ts..." -ForegroundColor Yellow

$useSupabaseContent = @'
'use client'

import { createClient } from '@/utils/supabase/client'

export function useSupabase() {
  const supabase = createClient()
  return { supabase }
}
'@

Set-Content "lib/hooks/useSupabase.ts" $useSupabaseContent

# 4. Fixer le problème de cookies dans server.ts
Write-Host "`n📝 Correction de utils/supabase/server.ts..." -ForegroundColor Yellow

$serverContent = @'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
'@

Set-Content "utils/supabase/server.ts" $serverContent

# 5. Nettoyer le cache et rebuild
Write-Host "`n🧹 Nettoyage du cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "`n✅ Corrections appliquées!" -ForegroundColor Green
Write-Host "`n📌 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. npm run build" -ForegroundColor White
Write-Host "2. npm run dev" -ForegroundColor White