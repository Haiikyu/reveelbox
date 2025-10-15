# Configuration de l'authentification Google OAuth avec Supabase

Ce guide explique comment configurer la connexion Google sur ReveelBox en utilisant Supabase.

## Prérequis

- Compte Google Cloud Platform
- Projet Supabase configuré
- Accès au dashboard Supabase

---

## Étape 1 : Créer les identifiants OAuth sur Google Cloud Platform

### 1.1 Accéder à Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Assurez-vous que le projet est sélectionné dans le menu déroulant en haut

### 1.2 Activer l'API Google+

1. Dans le menu de navigation (☰), allez dans **APIs & Services** > **Library**
2. Recherchez "Google+ API"
3. Cliquez sur **Enable** (Activer)

### 1.3 Créer les identifiants OAuth 2.0

1. Dans **APIs & Services**, allez dans **Credentials** (Identifiants)
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Si c'est votre première fois, vous devrez configurer l'écran de consentement :
   - Cliquez sur **Configure Consent Screen**
   - Choisissez **External** (Externe)
   - Remplissez les informations requises :
     - App name : **ReveelBox**
     - User support email : Votre email
     - Developer contact information : Votre email
   - Cliquez sur **Save and Continue**
   - Dans "Scopes", ajoutez les scopes suivants :
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Cliquez sur **Save and Continue**
   - Ajoutez des utilisateurs de test si nécessaire
   - Cliquez sur **Save and Continue**

4. Retournez dans **Credentials** et cliquez sur **Create Credentials** > **OAuth client ID**
5. Sélectionnez **Web application** comme type d'application
6. Nommez votre client (ex: "ReveelBox Web")

### 1.4 Configurer les URIs de redirection

Dans la section **Authorized redirect URIs** (URIs de redirection autorisés), ajoutez :

```
https://VOTRE_PROJET_SUPABASE.supabase.co/auth/v1/callback
```

**Important** : Remplacez `VOTRE_PROJET_SUPABASE` par votre véritable ID de projet Supabase.

Pour trouver votre URL de callback Supabase :
1. Allez sur votre [dashboard Supabase](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers** > **Google**
4. Copiez l'URL de callback affichée

7. Cliquez sur **Create**
8. **Sauvegardez** le **Client ID** et le **Client Secret** affichés

---

## Étape 2 : Configurer Google OAuth dans Supabase

### 2.1 Accéder aux paramètres d'authentification

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.com/)
2. Sélectionnez votre projet ReveelBox
3. Dans le menu de gauche, allez dans **Authentication** > **Providers**

### 2.2 Activer Google comme provider

1. Trouvez **Google** dans la liste des providers
2. Activez le toggle pour activer Google
3. Remplissez les champs :
   - **Client ID (for OAuth)** : Collez le Client ID obtenu de Google Cloud
   - **Client Secret (for OAuth)** : Collez le Client Secret obtenu de Google Cloud
4. Cliquez sur **Save**

### 2.3 Vérifier l'URL de callback

Assurez-vous que l'URL de callback affichée dans Supabase correspond à celle que vous avez ajoutée dans Google Cloud Console :
```
https://VOTRE_PROJET_SUPABASE.supabase.co/auth/v1/callback
```

---

## Étape 3 : Configuration de l'application

### 3.1 Vérifier les variables d'environnement

Dans votre fichier `.env.local`, assurez-vous d'avoir :

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJET_SUPABASE.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # En développement
# NEXT_PUBLIC_SITE_URL=https://reveelbox.com  # En production
```

### 3.2 Fichiers déjà configurés

Les fichiers suivants ont déjà été configurés pour l'OAuth Google :

- ✅ **`app/login/page.tsx`** : Bouton "Continuer avec Google" fonctionnel
- ✅ **`app/signup/page.tsx`** : Bouton "Continuer avec Google" fonctionnel
- ✅ **`app/auth/callback/route.ts`** : Route de callback qui gère la redirection OAuth

---

## Étape 4 : Test de la connexion

### 4.1 En développement local

1. Démarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Accédez à `http://localhost:3000/login`
3. Cliquez sur **Continuer avec Google**
4. Vous serez redirigé vers Google pour vous connecter
5. Après authentification, vous serez redirigé vers `/boxes`

### 4.2 Vérifier la création du profil

Après la première connexion avec Google, vérifiez dans votre dashboard Supabase :

1. Allez dans **Table Editor** > **profiles**
2. Vous devriez voir un nouveau profil créé avec :
   - `id` : ID de l'utilisateur Supabase
   - `username` : Nom complet de Google ou généré depuis l'email
   - `email` : Email Google
   - `virtual_currency` : 100 (bonus de départ)
   - `level` : 1

---

## Étape 5 : Configuration pour la production

### 5.1 Ajouter le domaine de production

Dans Google Cloud Console :
1. Retournez dans **Credentials** > Votre OAuth client ID
2. Ajoutez l'URI de redirection de production :
   ```
   https://reveelbox.com/auth/callback
   ```
3. Cliquez sur **Save**

### 5.2 Configurer l'URL du site dans Supabase

1. Dans le dashboard Supabase, allez dans **Authentication** > **URL Configuration**
2. Ajoutez votre domaine de production dans **Site URL** :
   ```
   https://reveelbox.com
   ```
3. Ajoutez également dans **Redirect URLs** :
   ```
   https://reveelbox.com/auth/callback
   https://reveelbox.com/boxes
   ```

### 5.3 Mettre à jour les variables d'environnement

Pour la production, mettez à jour `.env.production` ou vos variables d'environnement :
```env
NEXT_PUBLIC_SITE_URL=https://reveelbox.com
```

---

## Dépannage

### Erreur "redirect_uri_mismatch"

**Cause** : L'URI de redirection n'est pas autorisée dans Google Cloud Console.

**Solution** :
1. Vérifiez que l'URI dans Google Cloud Console correspond exactement à celle de Supabase
2. N'oubliez pas le `https://` au début
3. Assurez-vous qu'il n'y a pas d'espace ou de caractère supplémentaire

### L'utilisateur est connecté mais redirigé vers /login

**Cause** : Erreur lors de la création du profil ou de l'échange du code.

**Solution** :
1. Vérifiez les logs du serveur pour voir les erreurs
2. Assurez-vous que la table `profiles` a les bonnes colonnes
3. Vérifiez que les RLS policies permettent l'insertion

### Le bouton Google ne fait rien

**Cause** : Variables d'environnement manquantes ou incorrectes.

**Solution** :
1. Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont définis
2. Redémarrez le serveur de développement après avoir modifié `.env.local`

---

## Fonctionnement du flux OAuth

1. **Utilisateur clique sur "Continuer avec Google"**
   - L'application appelle `supabase.auth.signInWithOAuth({ provider: 'google' })`

2. **Redirection vers Google**
   - Supabase redirige l'utilisateur vers la page de connexion Google

3. **Utilisateur se connecte et autorise l'application**
   - Google authentifie l'utilisateur
   - L'utilisateur donne la permission à ReveelBox d'accéder à son email et profil

4. **Google redirige vers Supabase**
   - URL : `https://VOTRE_PROJET.supabase.co/auth/v1/callback?code=XXX`
   - Supabase échange le code contre une session

5. **Supabase redirige vers votre application**
   - URL : `https://reveelbox.com/auth/callback?code=XXX`

6. **Votre application traite le callback** (`app/auth/callback/route.ts`)
   - Échange le code contre une session
   - Vérifie si un profil existe
   - Crée un profil si nécessaire
   - Redirige vers `/boxes`

---

## Sécurité

- ✅ Le **Client Secret** ne doit **JAMAIS** être exposé côté client
- ✅ Utilisez toujours HTTPS en production
- ✅ Configurez correctement les RLS policies sur la table `profiles`
- ✅ Limitez les scopes Google aux informations strictement nécessaires

---

## Résumé des étapes

1. ✅ Créer OAuth client ID sur Google Cloud Console
2. ✅ Configurer les URIs de redirection
3. ✅ Activer Google OAuth dans Supabase
4. ✅ Ajouter Client ID et Secret dans Supabase
5. ✅ Vérifier les variables d'environnement
6. ✅ Tester la connexion
7. ✅ Configurer pour la production

---

## Support

Si vous rencontrez des problèmes :
- Vérifiez les logs du serveur Next.js
- Consultez les logs d'authentification dans le dashboard Supabase
- Vérifiez la console du navigateur pour les erreurs JavaScript

Pour plus d'informations :
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
