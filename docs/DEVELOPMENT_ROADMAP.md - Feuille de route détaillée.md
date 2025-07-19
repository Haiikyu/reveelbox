\# 🗺 Feuille de Route ReveelBox



\## Phase actuelle : MVP ✅



\### Complété

\- \[x] Authentification utilisateurs

\- \[x] Catalogue de loot boxes

\- \[x] Système d'ouverture avec animation

\- \[x] Paiements Stripe basiques

\- \[x] Inventaire utilisateur

\- \[x] Historique transactions

\- \[x] Design épuré blanc/vert



\### En cours 🔄

\- \[ ] Correction bug inscription

\- \[ ] Tests end-to-end



---



\## Phase 1 : Fonctionnalités Essentielles (3-4 semaines)



\### 📦 Semaine 1 : Gestion des livraisons

```

Lundi-Mardi : Système d'adresses

├── \[ ] Modèle DB shipping\_addresses

├── \[ ] Page gestion adresses (/profile/addresses)

├── \[ ] Formulaire ajout/modification adresse

└── \[ ] Validation format adresse



Mercredi-Jeudi : Processus de commande

├── \[ ] Sélection adresse à l'ouverture

├── \[ ] Statuts de livraison (pending, shipped, delivered)

├── \[ ] Page suivi commandes (/orders)

└── \[ ] Timeline visuelle du statut



Vendredi : Intégration transporteur

├── \[ ] Research API (Colissimo, Mondial Relay)

├── \[ ] Calcul frais de port

├── \[ ] Génération étiquettes

└── \[ ] Tracking number

```



\### 📧 Semaine 2 : Communications

```

Lundi-Mardi : Emails transactionnels

├── \[ ] Setup SendGrid/Resend

├── \[ ] Template email bienvenue

├── \[ ] Template confirmation commande

└── \[ ] Template expédition



Mercredi : Notifications in-app

├── \[ ] Système de notifications DB

├── \[ ] Composant NotificationBell

├── \[ ] Centre de notifications

└── \[ ] Mark as read



Jeudi-Vendredi : Dashboard admin

├── \[ ] Route /admin protégée

├── \[ ] Vue d'ensemble stats

├── \[ ] Gestion commandes

└── \[ ] Export CSV

```



\### 🎮 Semaine 3 : Gamification

```

Lundi-Mardi : Système de niveaux

├── \[ ] Calcul XP par action

├── \[ ] Niveaux et paliers

├── \[ ] Badges/Achievements

└── \[ ] Récompenses par niveau



Mercredi : Daily rewards

├── \[ ] Système de streak

├── \[ ] Récompenses progressives

├── \[ ] UI calendrier

└── \[ ] Notifications rappel



Jeudi-Vendredi : Événements spéciaux

├── \[ ] Boîtes limitées dans le temps

├── \[ ] Double XP weekends

├── \[ ] Système de quêtes

└── \[ ] Leaderboard

```



---



\## Phase 2 : Croissance (4-6 semaines)



\### 🤝 Semaine 4-5 : Social \& Communauté

```

Système de parrainage

├── \[ ] Codes parrainage uniques

├── \[ ] Récompenses parrain/filleul

├── \[ ] Dashboard parrainage

└── \[ ] Partage réseaux sociaux



Reviews \& Ratings

├── \[ ] Système de notes par item

├── \[ ] Commentaires avec modération

├── \[ ] Photos des objets reçus

└── \[ ] Badges "Verified Purchase"



Wishlists

├── \[ ] Ajouter aux favoris

├── \[ ] Notifications de disponibilité

├── \[ ] Partage wishlist

└── \[ ] Analytics popularité

```



\### 📱 Semaine 6-7 : Mobile

```

PWA Optimisée

├── \[ ] Manifest.json

├── \[ ] Service Worker

├── \[ ] Install prompt

├── \[ ] Push notifications

└── \[ ] Offline mode basique



OU



React Native

├── \[ ] Setup Expo

├── \[ ] Navigation

├── \[ ] Authentification

└── \[ ] Core features

```



\### 🌍 Semaine 8-9 : International

```

Multi-langue

├── \[ ] Setup next-i18n

├── \[ ] Traductions FR/EN

├── \[ ] Sélecteur de langue

└── \[ ] URLs localisées



Multi-devise

├── \[ ] Conversion EUR/USD

├── \[ ] Affichage selon région

├── \[ ] Taxes par pays

└── \[ ] Restrictions légales

```



---



\## Phase 3 : Optimisation (Ongoing)



\### ⚡ Performance

```

Mois 3

├── \[ ] Audit Lighthouse

├── \[ ] Images WebP + lazy loading

├── \[ ] Bundle size optimization

└── \[ ] Edge caching



Mois 4

├── \[ ] Redis pour sessions

├── \[ ] Queue jobs (Bull)

├── \[ ] DB indexing

└── \[ ] APM monitoring

```



\### 📊 Analytics \& Growth

```

Setup initial

├── \[ ] Google Analytics 4

├── \[ ] Facebook Pixel

├── \[ ] Hotjar heatmaps

└── \[ ] Custom events



A/B Testing

├── \[ ] Framework de tests

├── \[ ] Test prix optimal

├── \[ ] Test UX ouverture

└── \[ ] Landing pages

```



---



\## Métriques de succès



\### Phase 1 (MVP → Essentials)

\- \[ ] 100 utilisateurs inscrits

\- \[ ] 50 premières commandes

\- \[ ] NPS > 7/10



\### Phase 2 (Growth)

\- \[ ] 1000 utilisateurs actifs

\- \[ ] 500 commandes/mois

\- \[ ] CAC < 10€



\### Phase 3 (Scale)

\- \[ ] 10k utilisateurs

\- \[ ] 5k commandes/mois

\- \[ ] Rentabilité



---



\## Ressources nécessaires



\### Humaines

\- Dev fullstack : 1 (toi)

\- Designer UI/UX : 0.5 (freelance)

\- Community manager : 0.5 (plus tard)



\### Financières (mensuel)

\- Vercel : 20€

\- Supabase : 25€

\- Stripe : 2% + 0.25€/transaction

\- SendGrid : 20€

\- Domaine : 2€



\### Outils

\- \[ ] Figma (design)

\- \[ ] Linear (gestion projet)

\- \[ ] Sentry (monitoring)

\- \[ ] Postman (API testing)



---



\## Risques et mitigation



\### Technique

\- \*\*Risque\*\* : Scalabilité DB

\- \*\*Mitigation\*\* : Monitoring + plan upgrade



\### Business

\- \*\*Risque\*\* : Acquisition coûteuse

\- \*\*Mitigation\*\* : Focus sur organique + referral



\### Légal

\- \*\*Risque\*\* : Réglementation jeux

\- \*\*Mitigation\*\* : Conseil juridique



---



\## Prochaines actions immédiates



1\. \*\*Cette semaine\*\*

&nbsp;  - \[ ] Fix bug inscription

&nbsp;  - \[ ] Ajouter gestion adresses

&nbsp;  - \[ ] Setup emails basiques



2\. \*\*Semaine prochaine\*\*

&nbsp;  - \[ ] Dashboard admin v1

&nbsp;  - \[ ] Système de notifications

&nbsp;  - \[ ] Tests utilisateurs



3\. \*\*Dans 2 semaines\*\*

&nbsp;  - \[ ] Lancement beta fermée

&nbsp;  - \[ ] Feedback loop

&nbsp;  - \[ ] Itérations rapides

