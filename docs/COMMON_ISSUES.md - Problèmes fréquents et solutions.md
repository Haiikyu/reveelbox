\# 🔧 Problèmes Fréquents et Solutions



\## Erreurs de développement



\### 1. "Database error saving new user"

\*\*Cause\*\* : La fonction `handle\_new\_user()` essaie d'insérer un username unique NULL



\*\*Solution\*\* :

```sql

-- Exécuter dans Supabase SQL Editor

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles\_username\_key;

ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;



-- Recréer la fonction

CREATE OR REPLACE FUNCTION handle\_new\_user()

RETURNS TRIGGER AS $$

BEGIN

&nbsp;   INSERT INTO profiles (id, virtual\_currency, loyalty\_points)

&nbsp;   VALUES (NEW.id, 100, 0);

&nbsp;   RETURN NEW;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

```



\### 2. "window is not defined"

\*\*Cause\*\* : Code client exécuté côté serveur lors du build



\*\*Solutions\*\* :

```javascript

// Option 1 : Vérifier l'existence

if (typeof window !== 'undefined') {

&nbsp; // Code utilisant window

}



// Option 2 : useEffect

useEffect(() => {

&nbsp; // Code utilisant window

}, \[])



// Option 3 : Dynamic import

const Component = dynamic(() => import('./Component'), { ssr: false })

```



\### 3. "useSearchParams should be wrapped in suspense"

\*\*Cause\*\* : Next.js 14 nécessite Suspense pour useSearchParams



\*\*Solution\*\* :

```jsx

import { Suspense } from 'react'



function PageContent() {

&nbsp; const searchParams = useSearchParams()

&nbsp; // ...

}



export default function Page() {

&nbsp; return (

&nbsp;   <Suspense fallback={<div>Loading...</div>}>

&nbsp;     <PageContent />

&nbsp;   </Suspense>

&nbsp; )

}

```



\### 4. "Hydration mismatch"

\*\*Cause\*\* : Différence entre rendu serveur et client



\*\*Solutions\*\* :

```jsx

// Utiliser suppressHydrationWarning pour les dates

<time suppressHydrationWarning>

&nbsp; {new Date().toLocaleDateString()}

</time>



// Ou utiliser un state

const \[mounted, setMounted] = useState(false)

useEffect(() => setMounted(true), \[])

if (!mounted) return null

```



\## Erreurs Supabase



\### 1. "Permission denied for schema public"

\*\*Cause\*\* : RLS (Row Level Security) activé sans policies



\*\*Solution\*\* :

```sql

-- Vérifier les policies

SELECT \* FROM pg\_policies WHERE tablename = 'your\_table';



-- Ajouter une policy de lecture

CREATE POLICY "Enable read for all users" ON your\_table

FOR SELECT USING (true);

```



\### 2. "Invalid API key"

\*\*Cause\*\* : Variables d'environnement mal configurées



\*\*Solution\*\* :

```bash

\# Vérifier .env.local

NEXT\_PUBLIC\_SUPABASE\_URL=https://\[PROJECT\_ID].supabase.co

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=\[ANON\_KEY]



\# Redémarrer le serveur

npm run dev

```



\### 3. "User not found"

\*\*Cause\*\* : Profil non créé après inscription



\*\*Solution\*\* :

```javascript

// Vérifier le trigger

SELECT \* FROM information\_schema.triggers 

WHERE event\_object\_table = 'users';



// Si manquant, recréer (voir problème #1)

```



\## Erreurs Stripe



\### 1. "No such payment\_intent"

\*\*Cause\*\* : Webhook reçu avant la création en DB



\*\*Solution\*\* :

```javascript

// Ajouter un retry avec délai

const MAX\_RETRIES = 3

let retries = 0



while (retries < MAX\_RETRIES) {

&nbsp; try {

&nbsp;   // Votre logique

&nbsp;   break

&nbsp; } catch (error) {

&nbsp;   retries++

&nbsp;   await new Promise(resolve => setTimeout(resolve, 1000))

&nbsp; }

}

```



\### 2. "Webhook signature verification failed"

\*\*Cause\*\* : Secret webhook incorrect



\*\*Solution\*\* :

```bash

\# Local : utiliser la clé du CLI

stripe listen --print-secret



\# Production : utiliser la clé du dashboard Stripe

STRIPE\_WEBHOOK\_SECRET=whsec\_...

```



\### 3. "Amount must be greater than 0"

\*\*Cause\*\* : Montant en euros au lieu de centimes



\*\*Solution\*\* :

```javascript

// Toujours convertir en centimes

const amount = Math.round(price \* 100)

```



\## Erreurs de déploiement Vercel



\### 1. "Build failed - Type error"

\*\*Cause\*\* : TypeScript strict mode



\*\*Solution temporaire\*\* :

```javascript

// next.config.js

module.exports = {

&nbsp; typescript: {

&nbsp;   ignoreBuildErrors: true

&nbsp; }

}

```



\*\*Solution propre\*\* : Ajouter les types manquants



\### 2. "Function timeout"

\*\*Cause\*\* : API Route trop longue (>10s gratuit, >60s pro)



\*\*Solution\*\* :

```javascript

// Utiliser Edge Runtime

export const runtime = 'edge'



// Ou optimiser la requête

const data = await supabase

&nbsp; .from('table')

&nbsp; .select('id, name') // Sélectionner seulement nécessaire

&nbsp; .limit(100)

```



\### 3. "Environment variables not found"

\*\*Cause\*\* : Variables non ajoutées dans Vercel



\*\*Solution\*\* :

1\. Aller dans Project Settings → Environment Variables

2\. Ajouter toutes les variables de `.env.local`

3\. Redéployer



\## Problèmes de performance



\### 1. Page lente au chargement

\*\*Causes et solutions\*\* :



```javascript

// 1. Images non optimisées

import Image from 'next/image'

<Image src="/img.jpg" width={200} height={200} alt="" />



// 2. Trop de requêtes DB

// Utiliser des joins

const { data } = await supabase

&nbsp; .from('loot\_boxes')

&nbsp; .select(`

&nbsp;   \*,

&nbsp;   loot\_box\_items (

&nbsp;     items (\*)

&nbsp;   )

&nbsp; `)



// 3. Pas de cache

export const revalidate = 3600 // Cache 1h

```



\### 2. Animations saccadées

\*\*Solutions\*\* :



```javascript

// Utiliser transform au lieu de top/left

animate={{ x: 100 }} // ✅

animate={{ left: 100 }} // ❌



// Utiliser will-change

className="will-change-transform"



// Réduire les re-renders

const MemoizedComponent = React.memo(Component)

```



\## Problèmes UX courants



\### 1. "Rien ne se passe" après clic

\*\*Solution\*\* : Toujours ajouter feedback



```jsx

const \[loading, setLoading] = useState(false)



<button disabled={loading}>

&nbsp; {loading ? 'Chargement...' : 'Cliquer'}

</button>

```



\### 2. Erreurs non gérées

\*\*Solution\*\* : Try/catch partout



```javascript

try {

&nbsp; await riskyOperation()

&nbsp; toast.success('Succès!')

} catch (error) {

&nbsp; console.error(error)

&nbsp; toast.error('Une erreur est survenue')

}

```



\### 3. État perdu au refresh

\*\*Solution\*\* : Persister les données importantes



```javascript

// localStorage pour données non sensibles

useEffect(() => {

&nbsp; localStorage.setItem('cart', JSON.stringify(cart))

}, \[cart])



// Ou utiliser Supabase Realtime

const channel = supabase

&nbsp; .channel('cart')

&nbsp; .on('presence-sync', () => {

&nbsp;   // Sync state

&nbsp; })

```



\## Debugging tips



\### 1. Console.log stratégique

```javascript

console.log('🔍 Debug:', { 

&nbsp; user, 

&nbsp; profile, 

&nbsp; timestamp: new Date().toISOString() 

})

```



\### 2. Network tab

\- Vérifier les 401/403 (auth)

\- Vérifier les 500 (serveur)

\- Vérifier la taille des réponses



\### 3. React DevTools

\- Vérifier les re-renders excessifs

\- Inspecter les props/state

\- Profiler pour la performance



\### 4. Supabase Dashboard

\- Logs → Edge Functions

\- Monitoring → Queries lentes

\- Auth → Utilisateurs connectés



\## Commandes utiles de debug



```bash

\# Clear cache Next.js

rm -rf .next



\# Clear node\_modules

rm -rf node\_modules package-lock.json

npm install



\# Vérifier les types

npx tsc --noEmit



\# Analyser le bundle

npm install @next/bundle-analyzer

ANALYZE=true npm run build



\# Logs Vercel

vercel logs



\# Test Stripe webhook local

stripe trigger payment\_intent.succeeded

```



\## Checklist avant mise en production



\- \[ ] Variables d'environnement configurées

\- \[ ] RLS activé sur toutes les tables

\- \[ ] Webhooks Stripe configurés

\- \[ ] Emails transactionnels testés

\- \[ ] Gestion d'erreurs complète

\- \[ ] CORS configuré si nécessaire

\- \[ ] SSL/HTTPS activé

\- \[ ] Backup DB configuré

\- \[ ] Monitoring en place

\- \[ ] Tests de charge effectués

