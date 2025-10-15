// README.md - Documentation complète du système d'affiliation

export const AFFILIATE\_SYSTEM\_DOCS = `

\# Système d'Affiliation ReveelBox - Documentation Complète



\## Vue d'ensemble



Le système d'affiliation de ReveelBox permet aux utilisateurs de gagner des commissions en parrainant de nouveaux membres. Il comprend 10 niveaux de progression avec des taux de commission allant de 1% à 10%.



\## Structure de la Base de Données



\### Tables principales :

1\. \\`affiliate\_profiles\\` - Profils d'affiliés avec codes personnalisés

2\. \\`affiliate\_referrals\\` - Parrainages et commissions gagnées

3\. \\`affiliate\_clicks\\` - Tracking des clics sur les liens

4\. \\`affiliate\_badges\\` - Système de badges et récompenses

5\. \\`affiliate\_challenges\\` - Défis mensuels avec récompenses

6\. \\`affiliate\_notifications\\` - Notifications temps réel



\### Niveaux d'affiliation (Tiers) :

\- \*\*Rookie\*\* (1-4 parrainages) : 1% commission

\- \*\*Explorer\*\* (5-14 parrainages) : 2% commission

\- \*\*Adventurer\*\* (15-29 parrainages) : 3% commission

\- \*\*Hunter\*\* (30-49 parrainages) : 4% commission

\- \*\*Elite\*\* (50-74 parrainages) : 5% commission

\- \*\*Master\*\* (75-99 parrainages) : 6% commission

\- \*\*Champion\*\* (100-149 parrainages) : 7% commission

\- \*\*Legend\*\* (150-199 parrainages) : 8% commission

\- \*\*Mythic\*\* (200-299 parrainages) : 9% commission

\- \*\*Divine\*\* (300+ parrainages) : 10% commission



\## Fonctionnalités Principales



\### 1. Codes d'affiliation personnalisables

\- Les utilisateurs peuvent choisir leur propre code (3-12 caractères)

\- Vérification d'unicité en temps réel

\- Format des liens : \\`https://reveelbox.com/r/CODE\\`



\### 2. Tracking complet

\- Enregistrement de tous les clics sur les liens

\- Géolocalisation et sources de trafic

\- Taux de conversion en temps réel



\### 3. Système de badges

\- Badges automatiques basés sur les performances

\- Récompenses pour différents jalons

\- Affichage visuel des accomplissements



\### 4. Défis mensuels

\- Objectifs de parrainages, gains ou clics

\- Récompenses en coins, boosts de commission ou badges exclusifs

\- Progression trackée en temps réel



\### 5. Notifications en temps réel

\- Nouveaux parrainages

\- Commissions gagnées

\- Montée de niveau

\- Badges obtenus



\## Composants Principaux



\### Pages :

\- \\`/affiliate\\` - Dashboard principal complet

\- \\`/r/\[code]\\` - Redirection des liens d'affiliation

\- \\`/signup?ref=CODE\\` - Inscription avec parrainage



\### Hooks personnalisés :

\- \\`useAffiliate()\\` - Gestion du profil et des actions

\- \\`useChallenges()\\` - Gestion des défis

\- \\`useBadges()\\` - Gestion des badges



\### Composants réutilisables :

\- \\`AffiliateNotificationBell\\` - Notifications en temps réel

\- \\`AffiliateWidget\\` - Widget compact pour dashboard

\- \\`AffiliateLeaderboard\\` - Classement des top affiliés

\- \\`ShareButtons\\` - Boutons de partage optimisés



\## APIs Disponibles



\### Endpoints :

\- \\`POST /api/affiliate/track-click\\` - Enregistrer un clic

\- \\`POST /api/affiliate/convert\\` - Convertir un parrainage

\- \\`GET /api/affiliate/validate-code\\` - Valider un code

\- \\`GET /api/affiliate/stats\\` - Statistiques détaillées

\- \\`GET|PATCH /api/affiliate/notifications\\` - Gestion notifications



\## Installation et Configuration



\### 1. Base de données

Exécuter les scripts SQL fournis dans l'ordre :

\\`\\`\\`sql

-- Voir affiliate\_database\_schema.sql

\\`\\`\\`



\### 2. Variables d'environnement

\\`\\`\\`env

NEXT\_PUBLIC\_SITE\_URL=https://reveelbox.com

\\`\\`\\`



\### 3. Intégration

\\`\\`\\`tsx

// Dans votre layout ou page principale

import AffiliateNotificationBell from '@/components/affiliate/NotificationBell'

import AffiliateWidget from '@/components/affiliate/AffiliateWidget'



// Usage

<AffiliateNotificationBell />

<AffiliateWidget />

\\`\\`\\`



\## Sécurité et Performance



\### Row Level Security (RLS)

\- Toutes les tables utilisent RLS

\- Accès restreint aux données de l'utilisateur connecté

\- Policies strictes pour chaque action



\### Index de performance

\- Index sur les requêtes fréquentes

\- Optimisation des jointures

\- Vues matérialisées pour les statistiques



\### Validation côté client et serveur

\- Codes d'affiliation validés

\- Montants vérifiés

\- Protection contre les abus



\## Monitoring et Analytics



\### Métriques trackées :

\- Nombre de clics par jour/mois

\- Taux de conversion par affilié

\- Performance des différents canaux

\- Revenus générés par niveau



\### Dashboard analytics :

\- Graphiques de performance sur 30 jours

\- Comparaisons entre périodes

\- Top des affiliés performants

\- Analyse géographique des clics



\## Extensions Futures



\### Fonctionnalités prévues :

\- Paiements automatiques

\- API publique pour affiliés

\- Programme de co-branding

\- Outils marketing avancés

\- Intégration CRM



\### Optimisations :

\- Cache Redis pour les stats

\- CDN pour les liens de redirection

\- A/B testing des messages

\- ML pour optimiser les commissions



\## Support et Maintenance



\### Logs et debugging :

\- Tous les événements sont loggés

\- Monitoring des erreurs API

\- Alertes sur les anomalies



\### Tests automatisés :

\- Tests unitaires des hooks

\- Tests d'intégration des APIs

\- Tests E2E des parcours utilisateur



---



\*Cette documentation est mise à jour régulièrement. 

Pour toute question technique, contactez l'équipe de développement.\*

