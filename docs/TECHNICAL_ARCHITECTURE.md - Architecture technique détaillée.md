\# 🏗 Architecture Technique ReveelBox



\## Base de données Supabase



\### Tables principales



\#### `profiles`

```sql

\- id: UUID (FK → auth.users)

\- username: TEXT (nullable, unique when set)

\- virtual\_currency: INTEGER (default: 100)

\- loyalty\_points: INTEGER (default: 0)

\- created\_at: TIMESTAMP

\- updated\_at: TIMESTAMP

```



\#### `loot\_boxes`

```sql

\- id: UUID

\- name: TEXT

\- description: TEXT

\- price\_virtual: INTEGER

\- price\_real: DECIMAL(10,2)

\- image\_url: TEXT

\- animation\_url: TEXT

\- is\_active: BOOLEAN

\- created\_at: TIMESTAMP

```



\#### `items`

```sql

\- id: UUID

\- name: TEXT

\- description: TEXT

\- rarity: ENUM('common','uncommon','rare','epic','legendary')

\- image\_url: TEXT

\- market\_value: INTEGER

\- is\_physical: BOOLEAN (true)

\- shipping\_info: TEXT

\- stock: INTEGER (à ajouter)

\- created\_at: TIMESTAMP

```



\#### `user\_inventory`

```sql

\- id: UUID

\- user\_id: UUID (FK → profiles)

\- item\_id: UUID (FK → items)

\- quantity: INTEGER

\- obtained\_at: TIMESTAMP

\- is\_on\_market: BOOLEAN

\- is\_shipped: BOOLEAN

\- shipping\_address: TEXT

```



\#### `transactions`

```sql

\- id: UUID

\- user\_id: UUID (FK → profiles)

\- type: ENUM('purchase\_currency','purchase\_box','open\_box','market\_sale')

\- amount: DECIMAL(10,2)

\- virtual\_amount: INTEGER

\- loot\_box\_id: UUID (FK → loot\_boxes)

\- item\_id: UUID (FK → items)

\- stripe\_payment\_id: TEXT

\- created\_at: TIMESTAMP

```



\### Fonctions RPC importantes



\#### `purchase\_loot\_box(p\_user\_id, p\_loot\_box\_id)`

\- Vérifie le solde

\- Déduit les coins

\- Crée la transaction



\#### `open\_loot\_box(p\_user\_id, p\_loot\_box\_id)`

\- Tire un objet aléatoire selon les probabilités

\- Ajoute à l'inventaire

\- Attribue les points de fidélité



\#### `claim\_loyalty\_bonus(p\_user\_id, p\_bonus\_type)`

\- Échange points → coins

\- Types: 'small' (100pts→50coins), 'medium' (500pts→300coins), 'large' (1000pts→700coins)



\## Architecture API



\### Routes principales



\#### `/api/create-checkout-session`

```javascript

POST {

&nbsp; userId: string,

&nbsp; packageId: number,

&nbsp; coins: number,

&nbsp; price: number

}

→ { sessionId: string }

```



\#### `/api/stripe-webhook`

```javascript

POST (Stripe Event)

→ Traite checkout.session.completed

→ Ajoute les coins à l'utilisateur

```



\### Routes à implémenter



\#### `/api/admin/\*`

\- `/api/admin/stats` - Dashboard analytics

\- `/api/admin/orders` - Gestion commandes

\- `/api/admin/inventory` - Gestion stocks



\#### `/api/shipping/\*`

\- `/api/shipping/calculate` - Calcul frais de port

\- `/api/shipping/track` - Suivi colis



\## Flux de données



\### Flux d'achat de coins

```

1\. Client → Stripe Checkout

2\. Stripe → Webhook → /api/stripe-webhook

3\. API → Supabase (update profile.virtual\_currency)

4\. API → Supabase (insert transaction)

5\. Client → Redirect success page

```



\### Flux d'ouverture de boîte

```

1\. Client → purchase\_loot\_box RPC

2\. Supabase → Vérifie solde

3\. Supabase → Déduit coins

4\. Client → Animation ouverture

5\. Client → open\_loot\_box RPC

6\. Supabase → Tire objet aléatoire

7\. Supabase → Ajoute inventaire

8\. Client → Affiche récompense

```



\## Sécurité



\### Variables d'environnement

```env

\# Public (client)

NEXT\_PUBLIC\_SUPABASE\_URL

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY

NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY

NEXT\_PUBLIC\_APP\_URL



\# Privées (serveur uniquement)

SUPABASE\_SERVICE\_KEY

STRIPE\_SECRET\_KEY

STRIPE\_WEBHOOK\_SECRET

```



\### RLS (Row Level Security)

\- `profiles`: Lecture/écriture propre profil

\- `loot\_boxes`: Lecture publique (si active)

\- `items`: Lecture publique

\- `user\_inventory`: Lecture propre inventaire

\- `transactions`: Lecture propres transactions

\- `market\_listings`: Lecture publique, écriture propriétaire



\## Performance



\### Optimisations actuelles

\- Lazy loading des images

\- Code splitting automatique (Next.js)

\- Edge runtime pour les API Routes



\### Optimisations à implémenter

```javascript

// Cache des loot boxes

const CACHE\_DURATION = 60 \* 5 // 5 minutes

let cachedBoxes = null

let cacheTime = null



// CDN pour les images

const imageUrl = `https://cdn.reveelbox.com/${item.image\_url}`



// Pagination inventaire

const PAGE\_SIZE = 20

const offset = (page - 1) \* PAGE\_SIZE

```



\## Monitoring



\### Logs à implémenter

```javascript

// lib/logger.js

export const log = {

&nbsp; purchase: (userId, amount) => {

&nbsp;   console.log('\[PURCHASE]', { userId, amount, timestamp: new Date() })

&nbsp; },

&nbsp; error: (error, context) => {

&nbsp;   console.error('\[ERROR]', { error: error.message, context, stack: error.stack })

&nbsp; }

}

```



\### Métriques à tracker

\- Temps de chargement pages

\- Taux d'erreur paiements

\- Conversion visiteur → achat

\- Temps moyen session



\## Scalabilité



\### Court terme (< 1000 users)

\- Setup actuel suffisant

\- Monitor les performances DB



\### Moyen terme (1000-10000 users)

\- Ajouter Redis pour cache

\- CDN pour assets statiques

\- Queue pour emails



\### Long terme (10000+ users)

\- Microservices (paiements, livraisons)

\- Load balancing

\- Sharding DB

