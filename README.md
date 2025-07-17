# LootBox Paradise 🎁

Un site web moderne de loot boxes construit avec Next.js, Supabase et Stripe.

## 🚀 Fonctionnalités

- **Authentification utilisateur** : Inscription/connexion sécurisée avec Supabase Auth
- **Système de loot boxes** : 
  - Catalogue de boîtes avec différentes raretés
  - Animation d'ouverture immersive
  - Système de drop avec probabilités
- **Économie virtuelle** :
  - Monnaie virtuelle (coins)
  - Achat de coins via Stripe
  - Marché secondaire pour échanger des objets
- **Système de fidélité** :
  - Points gagnés à chaque ouverture
  - Échange contre des coins gratuits
- **Inventaire personnel** :
  - Gestion des objets obtenus
  - Mise en vente sur le marché
- **Historique complet** des transactions

## 🛠️ Stack Technique

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** pour le styling
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes

### Backend
- **Supabase** :
  - Authentification
  - Base de données PostgreSQL
  - Row Level Security (RLS)
  - Fonctions Edge

### Paiement
- **Stripe** pour les paiements sécurisés

## 📋 Prérequis

- Node.js 18+
- Un compte Supabase
- Un compte Stripe
- npm ou yarn

## 🚀 Installation

1. **Cloner le projet**
```bash
git clone [votre-repo]
cd lootbox-site
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**

Créez un nouveau projet sur [Supabase](https://supabase.com) et exécutez les scripts SQL fournis dans l'ordre :
- `supabase-schema.sql` : Tables et structure
- `supabase-functions.sql` : Fonctions RPC

4. **Variables d'environnement**

Créez un fichier `.env.local` à la racine :
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=votre-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_KEY=votre-clé-service

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=votre-clé-publique-stripe
STRIPE_SECRET_KEY=votre-clé-secrète-stripe
STRIPE_WEBHOOK_SECRET=votre-secret-webhook

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Configuration Stripe Webhook**

Pour le développement local :
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

6. **Lancer le projet**
```bash
npm run dev
```

## 📁 Structure du Projet

```
lootbox-site/
├── app/
│   ├── api/
│   │   ├── create-checkout-session/
│   │   └── stripe-webhook/
│   ├── components/
│   │   ├── AuthProvider.js
│   │   ├── Navbar.js
│   │   └── LootBoxCard.js
│   ├── boxes/
│   │   ├── page.js
│   │   └── [id]/
│   │       └── page.js
│   ├── buy-coins/
│   │   ├── page.js
│   │   └── success/
│   │       └── page.js
│   ├── inventory/
│   │   └── page.js
│   ├── history/
│   │   └── page.js
│   ├── profile/
│   │   └── page.js
│   ├── login/
│   │   └── page.js
│   ├── signup/
│   │   └── page.js
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── lib/
│   └── supabase.js
├── public/
│   └── images/
└── package.json
```

## 🎮 Utilisation

### Pour les utilisateurs

1. **Créer un compte** : Inscrivez-vous avec votre email
2. **Acheter des coins** : Utilisez Stripe pour recharger votre compte
3. **Ouvrir des boîtes** : Choisissez une boîte et tentez votre chance
4. **Gérer l'inventaire** : Consultez vos objets et vendez-les sur le marché
5. **Programme de fidélité** : Échangez vos points contre des coins gratuits

### Pour les développeurs

#### Ajouter une nouvelle loot box
```sql
INSERT INTO loot_boxes (name, description, price_virtual, price_real, image_url) 
VALUES ('Diamond Box', 'La boîte ultime', 2000, 19.99, '/images/diamond-box.png');
```

#### Ajouter des objets
```sql
INSERT INTO items (name, description, rarity, image_url, market_value) 
VALUES ('Épée de feu', 'Brûle tout sur son passage', 'epic', '/images/fire-sword.png', 300);
```

#### Lier des objets à une boîte
```sql
INSERT INTO loot_box_items (loot_box_id, item_id, drop_rate) 
VALUES ('box-uuid', 'item-uuid', 15.5);
```

## 🔒 Sécurité

- **RLS activé** sur toutes les tables
- **Validation côté serveur** pour toutes les opérations sensibles
- **Webhooks Stripe** pour confirmer les paiements
- **Fonctions RPC** pour les opérations critiques

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connectez votre repo GitHub à Vercel
2. Ajoutez les variables d'environnement
3. Déployez !

### Configuration Stripe en production

1. Créez un endpoint webhook dans le dashboard Stripe
2. Pointez vers `https://votre-domaine.com/api/stripe-webhook`
3. Mettez à jour `STRIPE_WEBHOOK_SECRET`

## 📝 TODO

- [ ] Ajouter des animations Lottie pour l'ouverture des boîtes
- [ ] Implémenter un système de trading entre joueurs
- [ ] Ajouter des achievements
- [ ] Créer un leaderboard
- [ ] Ajouter des notifications en temps réel
- [ ] Support multi-langues

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.

## 📄 License

MIT License - voir le fichier LICENSE pour plus de détails.