\# 📦 ReveelBox - Instructions du Projet



\## Vue d'ensemble

ReveelBox est une plateforme de loot boxes contenant des \*\*objets réels\*\* (pas virtuels) livrés aux utilisateurs. Les utilisateurs achètent des coins virtuels, ouvrent des boîtes mystères et reçoivent de vrais produits chez eux.



\## 🛠 Stack Technique



\### Frontend

\- \*\*Framework\*\*: Next.js 14 (App Router)

\- \*\*Styling\*\*: Tailwind CSS

\- \*\*Animations\*\*: Framer Motion

\- \*\*Icônes\*\*: Lucide React

\- \*\*Langage\*\*: JavaScript/TypeScript (.tsx mais avec du JS)



\### Backend

\- \*\*Base de données\*\*: Supabase (PostgreSQL)

\- \*\*Authentification\*\*: Supabase Auth

\- \*\*Paiements\*\*: Stripe

\- \*\*Hébergement\*\*: Vercel



\### Structure des dossiers

```

ReveelBox/

├── app/

│   ├── api/              # Routes API (Stripe webhooks)

│   ├── components/       # Composants réutilisables

│   ├── (pages)/         # Pages de l'application

│   └── globals.css      # Styles globaux

├── lib/

│   └── supabase.js      # Configuration Supabase

└── public/

&nbsp;   └── images/          # Assets statiques

```



\## 🎨 Design System



\### Couleurs principales

\- \*\*Primary\*\*: `#22c55e` (vert principal)

\- \*\*Primary Dark\*\*: `#16a34a` (vert foncé)

\- \*\*Background\*\*: `#ffffff` (blanc)

\- \*\*Surface\*\*: `#f9fafb` (gris très clair)

\- \*\*Text\*\*: `#111827` (noir)

\- \*\*Text Secondary\*\*: `#6b7280` (gris)



\### Style général

\- \*\*Apparence\*\*: Épuré, moderne, professionnel

\- \*\*Formes\*\*: Coins arrondis (rounded-xl)

\- \*\*Ombres\*\*: Douces (shadow-soft)

\- \*\*Animations\*\*: Subtiles et fluides



\## 🔑 Fonctionnalités principales



\### Implémentées ✅

1\. Authentification (login/signup)

2\. Catalogue de loot boxes

3\. Système d'ouverture avec animation

4\. Inventaire utilisateur

5\. Paiements Stripe

6\. Système de coins virtuels

7\. Points de fidélité

8\. Historique des transactions

9\. Profil utilisateur



\### À implémenter 🚧

1\. Gestion des adresses de livraison

2\. Suivi des commandes

3\. Dashboard admin

4\. Système de notifications

5\. Emails transactionnels

6\. Gestion des stocks

7\. Système de parrainage



\## ⚠️ Points d'attention



\### Sécurité

\- Toujours valider les paiements via webhook Stripe

\- Utiliser les RLS (Row Level Security) de Supabase

\- Ne jamais exposer les clés secrètes côté client



\### Performance

\- Lazy loading des images

\- Optimisation des requêtes DB

\- Mise en cache des données statiques



\### UX

\- États de chargement sur toutes les actions

\- Messages d'erreur clairs

\- Feedback visuel immédiat



\## 🐛 Problèmes connus



1\. \*\*Erreur inscription\*\*: ✅ Résolu - La fonction handle\_new\_user() a été corrigée

2\. \*\*Window is not defined\*\*: ✅ Résolu - Utilisation de pourcentages au lieu de window.innerWidth

3\. \*\*useSearchParams\*\*: ✅ Résolu - Ajout de Suspense boundary



\## 📝 Conventions de code



\### Nommage

\- Composants: PascalCase (`LootBoxCard.tsx`)

\- Fonctions: camelCase (`getUserInventory()`)

\- Constantes: UPPER\_SNAKE\_CASE (`MAX\_ITEMS\_PER\_BOX`)



\### Structure des composants

```jsx

'use client' // Si nécessaire



import { useState, useEffect } from 'react'

// Imports...



export default function ComponentName() {

&nbsp; // State

&nbsp; const \[state, setState] = useState()

&nbsp; 

&nbsp; // Effects

&nbsp; useEffect(() => {

&nbsp;   // Logic

&nbsp; }, \[])

&nbsp; 

&nbsp; // Handlers

&nbsp; const handleAction = () => {

&nbsp;   // Logic

&nbsp; }

&nbsp; 

&nbsp; // Render

&nbsp; return (

&nbsp;   <div>

&nbsp;     {/\* JSX \*/}

&nbsp;   </div>

&nbsp; )

}

```



\## 🚀 Commandes utiles



```bash

\# Développement

npm run dev



\# Build

npm run build



\# Déploiement

git push (auto-deploy sur Vercel)



\# Stripe webhook local

stripe listen --forward-to localhost:3000/api/stripe-webhook

```



\## 📊 Métriques importantes

\- Taux de conversion visiteur → utilisateur

\- Valeur moyenne par commande

\- Taux d'ouverture de boîtes

\- Satisfaction livraison



\## 🔄 Workflow de développement



1\. \*\*Nouvelle feature\*\*: Créer une branche

2\. \*\*Test local\*\*: Vérifier avec `npm run dev`

3\. \*\*Commit\*\*: Messages descriptifs

4\. \*\*Deploy\*\*: Push sur main → Vercel auto-deploy

5\. \*\*Monitor\*\*: Vérifier les logs Vercel



\## 💬 Communication avec l'assistant



Pour des réponses optimales:

\- Fournir le contexte spécifique

\- Inclure les messages d'erreur exacts

\- Partager seulement le code pertinent

\- Préciser l'objectif souhaité



\## 📅 Dernière mise à jour

\- Date: \[À METTRE À JOUR]

\- Version: 1.0.0

\- Dernier déploiement: \[URL VERCEL]

