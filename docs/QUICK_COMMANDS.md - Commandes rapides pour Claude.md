\# 🚀 Commandes Rapides pour Claude



\## Commandes de base



\### 🔧 Debug

```

"Erreur \[TYPE] ligne \[X] dans \[FICHIER]: \[MESSAGE]"

"Voici le code: \[CODE]"

```



\### 📝 Génération de code

```

"Crée un composant \[NOM] qui \[DESCRIPTION]"

"Ajoute \[FEATURE] à \[FICHIER]"

"Convertis cette maquette en code: \[IMAGE]"

```



\### 🎨 Design

```

"Change le style pour \[DESCRIPTION]"

"Rend le site plus \[ADJECTIF]"

"Utilise la palette \[COULEURS]"

```



\### 🗃️ Base de données

```

"Ajoute une table \[NOM] avec \[COLONNES]"

"Crée une fonction RPC pour \[ACTION]"

"Corrige les policies RLS pour \[TABLE]"

```



\## Templates de questions efficaces



\### Pour une erreur

```

Contexte: ReveelBox, page \[NOM]

Erreur: \[MESSAGE EXACT]

Fichier: \[NOM]

Ligne: \[NUMERO]

Code:

```\[code problématique]```

J'ai essayé: \[TES TENTATIVES]

```



\### Pour une nouvelle fonctionnalité

```

Je veux ajouter: \[FEATURE]

Page concernée: \[PAGE]

Comportement souhaité: \[DESCRIPTION]

Style: Cohérent avec le design blanc/vert épuré

```



\### Pour optimiser

```

Page: \[NOM]

Problème: \[LENT/BUG/UX]

Métriques: \[SI DISPONIBLE]

Code actuel:

```\[code]```

```



\## Commandes spécifiques ReveelBox



\### 🏗️ Architecture

```

"Montre l'architecture actuelle"

"Ajoute \[SERVICE] à l'architecture"

"Comment organiser \[FEATURE]"

```



\### 💰 Paiements

```

"Configure Stripe pour \[ACTION]"

"Ajoute un webhook pour \[EVENT]"

"Crée un package à \[PRIX]€ = \[COINS] coins"

```



\### 📦 Loot boxes

```

"Crée une nouvelle box \[NOM] avec \[ITEMS]"

"Change les probabilités de drop"

"Ajoute une animation pour \[RARITY]"

```



\### 👤 Utilisateurs

```

"Ajoute \[CHAMP] au profil utilisateur"

"Crée un système de \[FEATURE]"

"Implémente \[ROLE] avec permissions"

```



\### 🚚 Livraisons

```

"Ajoute la gestion d'adresses"

"Intègre \[TRANSPORTEUR] API"

"Crée le suivi de commande"

```



\## Raccourcis pratiques



\### 🎯 One-liners

\- `"Fix TS"` → Corrige les erreurs TypeScript

\- `"Add loading"` → Ajoute états de chargement

\- `"Make responsive"` → Rend responsive

\- `"Add animations"` → Ajoute des animations

\- `"Improve UX"` → Suggestions UX

\- `"Optimize performance"` → Optimisations



\### 📊 Analyses

\- `"Audit \[PAGE/COMPONENT]"` → Analyse complète

\- `"Security check"` → Vérifie la sécurité

\- `"Performance review"` → Analyse performance

\- `"Code smell"` → Détecte mauvaises pratiques



\### 🔄 Refactoring

\- `"Clean this up"` → Nettoie le code

\- `"Make it DRY"` → Évite répétitions

\- `"Extract component"` → Découpe en composants

\- `"Add types"` → Ajoute TypeScript



\## Formats de réponse



\### Pour du code seulement

```

"Donne-moi juste le code pour \[FEATURE], pas d'explications"

```



\### Pour des explications

```

"Explique pourquoi \[PROBLÈME] et comment le résoudre"

```



\### Pour un plan d'action

```

"Liste les étapes pour implémenter \[FEATURE]"

```



\## Commandes de maintenance



\### 📦 Dependencies

```

"Update dependencies"

"Fix security vulnerabilities"

"Add \[PACKAGE] avec exemple"

```



\### 🧪 Tests

```

"Crée des tests pour \[COMPONENT]"

"Test scenario pour \[FEATURE]"

"Mock \[SERVICE] pour tests"

```



\### 📝 Documentation

```

"Documente \[FONCTION/COMPONENT]"

"Crée README pour \[FEATURE]"

"Ajoute JSDoc"

```



\## Workflows complets



\### 🆕 Nouvelle page

```

"Crée une page \[NOM] avec:

\- Route: \[/path]

\- Layout: \[navbar/sidebar/none]

\- Features: \[LIST]

\- Style: Cohérent ReveelBox"

```



\### 🔌 Nouvelle API

```

"Crée une API route \[NOM] qui:

\- Method: \[GET/POST/PUT/DELETE]

\- Input: \[PARAMS]

\- Output: \[RESPONSE]

\- Auth: \[required/optional]"

```



\### 🎨 Nouveau composant

```

"Crée un composant \[NOM]:

\- Props: \[LIST]

\- State: \[LIST]

\- Actions: \[LIST]

\- Style: \[DESCRIPTION]"

```



\## Astuces pour économiser les tokens



\### ✅ DO

```

"Fix error line 42: undefined user"

"Add loading to submit button"

"Make cards stack on mobile"

```



\### ❌ DON'T

```

"Mon site ne marche pas, aide-moi"

"Voici tous mes fichiers: \[10 files]"

"Peux-tu tout vérifier?"

```



\## Contexte permanent



Pour chaque nouvelle conversation, commence par:

```

"Contexte: ReveelBox

Stack: Next.js 14, Supabase, Stripe, Tailwind

Style: Blanc/vert épuré

État: \[DERNIÈRE FEATURE]

Besoin: \[CE QUE TU VEUX]"

```



\## Commandes admin



\### 🛠️ Maintenance

```

"Backup strategy"

"Scale to \[X] users"

"Monitor \[METRIC]"

"Setup CI/CD"

```



\### 📈 Business

```

"Track \[KPI]"

"A/B test \[FEATURE]"

"Improve conversion"

"Reduce churn"

```



\### 🔒 Sécurité

```

"Audit security"

"Add 2FA"

"Encrypt \[DATA]"

"Rate limit \[ENDPOINT]"

```

