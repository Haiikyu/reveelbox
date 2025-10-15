# Application des Migrations Supabase

## Migration 004: Création de la table daily_box_claims

Cette migration crée la table nécessaire pour le système de freedrop.

### Option 1: Via Supabase CLI (Recommandé)

```bash
# Appliquer toutes les migrations en attente
npx supabase db push

# OU spécifiquement la migration 004
npx supabase migration up
```

### Option 2: Via SQL Editor dans Supabase Dashboard

1. Connectez-vous à votre projet Supabase: https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `supabase/migrations/004_create_daily_box_claims.sql`
5. Exécutez la requête

### Option 3: Via Supabase Studio (Local)

```bash
# Démarrer Supabase local
npx supabase start

# Appliquer les migrations
npx supabase db reset

# OU
npx supabase migration up
```

## Vérification

Après avoir appliqué la migration, vérifiez que la table existe:

```sql
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'daily_box_claims';
```

Vous devriez voir une ligne avec le nom de la table.

## Régénérer les types TypeScript (Important!)

Après avoir appliqué la migration, régénérez les types TypeScript:

```bash
# Générer les types depuis la base de données
npx supabase gen types typescript --project-id <votre-project-id> > app/types/database.ts
```

Remplacez `<votre-project-id>` par l'ID de votre projet Supabase.

## Rollback (Si nécessaire)

Si vous devez annuler cette migration:

```sql
DROP TABLE IF EXISTS public.daily_box_claims CASCADE;
```

⚠️ **Attention**: Cela supprimera toutes les données de réclamation de freedrop!
