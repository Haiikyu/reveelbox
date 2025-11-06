# Guide de Migration - Profil Amélioré

## 🚀 Migration SQL Requise

Pour que toutes les nouvelles fonctionnalités de personnalisation du profil fonctionnent correctement, vous devez appliquer la migration SQL suivante à votre base de données Supabase.

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet **ReveelBox**
3. Allez dans **SQL Editor** (menu de gauche)
4. Créez une nouvelle requête
5. Copiez-collez le contenu du fichier `supabase/migrations/003_add_profile_customization_columns.sql`
6. Cliquez sur **Run** pour exécuter la migration

### Option 2 : Via Supabase CLI

```bash
# Si vous avez lié votre projet
npx supabase db push

# Sinon, liez d'abord votre projet
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase db push
```

## 📦 Créer le Bucket de Stockage

Pour permettre l'upload de bannières et d'avatars :

1. Allez dans **Storage** dans le Dashboard Supabase
2. Créez un nouveau bucket nommé `profile-images`
3. Rendez-le **public**
4. Allez dans **Policies** et ajoutez :

```sql
-- Policy pour l'upload
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy pour la lecture publique
CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
```

## ✨ Nouvelles Fonctionnalités

### 1. Upload d'Images
- ✅ Upload de bannière (1920x300px recommandé)
- ✅ Upload d'avatar
- ✅ Stockage sécurisé via Supabase Storage

### 2. Cadres d'Avatar Étendus (9 options)
- Défaut, Émeraude, Or, Diamant, Rubis
- Arc-en-ciel, Cosmique, Néon, Légendaire

### 3. Badges Personnalisés (9 types)
- VIP, Premium, Pro, Elite
- Legend, Founder, Vérifié, Staff

### 4. Thèmes de Couleurs (6 thèmes)
- Émeraude, Océan, Coucher de soleil
- Royal, Feu, Forêt

### 5. Effets Visuels
- Aucun, Particules, Lueur, Animé

### 6. Personnalisation Avancée
- Titre de profil personnalisé
- Bannière avec overlays
- Liens sociaux (Twitter, Instagram, Twitch, YouTube, Discord, Site web)

## 🔧 Corrections Apportées

### Erreurs de Base de Données Corrigées
- ❌ Colonne `website` manquante → ✅ Stockée dans `theme.social_links`
- ❌ Colonne `total_xp` → ✅ Utilise `total_exp`
- ❌ Colonnes streak manquantes → ✅ Ajoutées via migration
- ❌ Colonnes XP de niveau manquantes → ✅ Ajoutées via migration

### Nouvelles Colonnes Ajoutées
- `website` - Lien site web (TEXT)
- `current_level_xp` - XP dans le niveau actuel (INTEGER)
- `next_level_xp` - XP requis pour level suivant (INTEGER)
- `current_streak` - Série de jours consécutifs (INTEGER)
- `longest_streak` - Plus longue série jamais atteinte (INTEGER)
- `last_activity` - Dernière activité (TIMESTAMP)

## 📊 Structure des Données

### Format du champ `theme` dans profiles

```json
{
  "theme_color": "#10b981",
  "banner_url": "https://...",
  "badge_style": "modern",
  "show_stats": true,
  "show_inventory": true,
  "show_achievements": true,
  "avatar_frame": "emerald",
  "profile_title": "Maître des Boxes",
  "custom_badge": "vip",
  "banner_overlay": "gradient",
  "profile_effect": "particles",
  "color_theme": "emerald",
  "social_links": {
    "website": "https://...",
    "twitter": "@username",
    "instagram": "@username",
    "twitch": "username",
    "youtube": "channel_url",
    "discord": "username#0000"
  }
}
```

## 🛍️ Préparation Boutique

Le système est maintenant prêt pour implémenter une boutique de personnalisation :

1. **Table `shop_items`** - À créer pour les items de personnalisation
2. **Système de déblocage** - Par niveau, succès ou achat
3. **Prix en coins** - Items achetables avec virtual_currency
4. **Inventaire de customisation** - Track des items possédés

### Exemple de structure shop_items

```sql
CREATE TABLE shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type TEXT NOT NULL, -- 'avatar_frame', 'banner', 'badge', 'effect'
  item_id TEXT NOT NULL, -- 'emerald', 'gold', etc.
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  required_level INTEGER DEFAULT 1,
  rarity TEXT, -- 'common', 'rare', 'epic', 'legendary'
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## ⚠️ Notes Importantes

1. **Appliquez la migration** avant de tester les nouvelles fonctionnalités
2. **Créez le bucket** profile-images pour les uploads
3. **Les images** sont stockées dans le format : `{user_id}/avatar-{timestamp}.{ext}`
4. **Les bannières** sont stockées dans : `{user_id}/banner-{timestamp}.{ext}`

## 🐛 Dépannage

### Les uploads ne fonctionnent pas
- Vérifiez que le bucket `profile-images` existe et est public
- Vérifiez les policies de Storage
- Vérifiez les permissions RLS sur la table profiles

### Erreur "Could not find column"
- Appliquez la migration SQL
- Redémarrez l'application Next.js
- Videz le cache Supabase

### Les stats ne s'affichent pas
- Vérifiez que `total_exp` existe (pas `total_xp`)
- Vérifiez que les colonnes streak existent
- Consultez la console pour voir les erreurs SQL

## 📝 Checklist de Déploiement

- [ ] Migration SQL appliquée
- [ ] Bucket profile-images créé
- [ ] Policies Storage configurées
- [ ] Application redémarrée
- [ ] Tests des uploads effectués
- [ ] Tests de personnalisation effectués
