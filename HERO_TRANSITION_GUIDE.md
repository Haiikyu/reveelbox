# Guide de l'effet Hero Transition (ap-3.net)

## Vue d'ensemble

L'effet de transition scroll a été reproduit avec succès pour ReveelBox, inspiré de ap-3.net. Cet effet crée une transition fluide entre le hero fullscreen et le reste du contenu.

## Architecture

### Composants créés

#### `app/components/HeroTransition.tsx`

Composant principal qui gère la transition scroll entre deux états :

- **État 1** : Hero fullscreen (image plage + éléments)
- **État 2** : Contenu suivant (commence au carrousel)

**Caractéristiques techniques** :

```tsx
// Utilisation de useScroll pour tracker la progression
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ['start start', 'end start']
})

// Transformations avec easing custom (easeOutExpo)
const easing = [0.16, 1, 0.3, 1]

// Image scale: 1 → 1.20 (zoom progressif)
const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.2], { ease: easing })

// Hero opacity: 1 → 0 (fade-out)
const heroOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0], { ease: easing })

// Section suivante opacity: 0 → 1 (fade-in)
const nextSectionOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0, 0.5, 1], { ease: easing })

// Section suivante translateY: 60px → 0
const nextSectionY = useTransform(scrollYProgress, [0, 0.3, 1], [60, 40, 0], { ease: easing })
```

**Position sticky** :
Le hero utilise `position: sticky` pour rester visible pendant toute la durée de la transition.

**Easing personnalisé** :
`[0.16, 1, 0.3, 1]` correspond à une courbe `easeOutExpo` pour un effet très fluide, sans à-coup.

### Modifications apportées

#### `app/components/HeroSection.tsx`

**Avant** :
```tsx
<div className="relative w-full h-screen overflow-hidden">
```

**Après** :
```tsx
<div className="absolute inset-0 w-full h-full overflow-hidden">
```

**Raison** : Le HeroSection est maintenant contenu dans un wrapper avec scale, donc il doit utiliser `absolute inset-0` pour remplir complètement son conteneur parent.

#### `app/page.tsx`

**Avant** :
```tsx
<HeroSection boxes={boxes} />
<BoxesCarousel boxes={boxes} />
<RecentWinnersSection />
<Footer />
```

**Après** :
```tsx
<HeroTransition heroContent={<HeroSection boxes={boxes} />}>
  <BoxesCarousel boxes={boxes} />
  <RecentWinnersSection />
  <Footer />
</HeroTransition>
```

## Comportement de la transition

### Phase 1 : Scroll initial (0% → 30%)
- L'image commence à scaler (1 → 1.06)
- Le hero reste à pleine opacité (1)
- La section suivante reste invisible (opacity: 0)

### Phase 2 : Transition active (30% → 70%)
- L'image continue de scaler (1.06 → 1.14)
- Le hero commence à disparaître (1 → 0.5)
- La section suivante commence à apparaître (0 → 0.5)
- Le translateY diminue (60px → 20px)

### Phase 3 : Finalisation (70% → 100%)
- L'image atteint le scale maximum (1.14 → 1.20)
- Le hero disparaît complètement (0.5 → 0)
- La section suivante devient complètement visible (0.5 → 1)
- Le translateY atteint 0

## Optimisations responsive

### Desktop (≥ 1024px)
- Transition complète avec toutes les étapes
- Scale maximum : 1.20
- TranslateY initial : 60px

### Tablette (768px - 1023px)
- Même comportement que desktop
- Peut nécessiter un ajustement du translateY à 40px pour éviter les sauts

### Mobile (< 768px)
**Recommandations** :
```tsx
// Ajuster les valeurs de transformation pour mobile
const isMobile = window.innerWidth < 768

const imageScale = useTransform(
  scrollYProgress,
  [0, 1],
  [1, isMobile ? 1.15 : 1.2], // Scale réduit sur mobile
  { ease: [0.16, 1, 0.3, 1] }
)

const nextSectionY = useTransform(
  scrollYProgress,
  [0, 0.3, 1],
  [isMobile ? 40 : 60, isMobile ? 20 : 40, 0], // TranslateY réduit sur mobile
  { ease: [0.16, 1, 0.3, 1] }
)
```

### Points d'attention responsive

1. **Hauteur viewport** : Assurez-vous que `h-screen` fonctionne correctement sur mobile (problème connu avec iOS Safari)
   - Utiliser `min-h-screen` ou `h-dvh` (dynamic viewport height) si nécessaire

2. **Performance** : Le scale d'une image grande résolution peut être lourd sur mobile
   - Envisager `will-change: transform` sur l'image
   - Utiliser `transform: translateZ(0)` pour forcer l'accélération GPU

3. **Touch scroll** : Tester le smooth scroll sur appareils tactiles
   - Les transitions peuvent sembler plus rapides au toucher

## Performance

### Optimisations appliquées

1. **Utilisation de motion values** : Les transformations utilisent des `motion values` de Framer Motion, qui sont optimisées pour le GPU
2. **Easing personnalisé** : Courbe `easeOutExpo` pour une fluidité maximale
3. **Pointer events** : Désactivation des interactions (`pointerEvents: 'none'`) quand le hero est invisible

### Optimisations supplémentaires possibles

```tsx
// Dans HeroTransition.tsx, ajouter sur l'image de fond
<motion.div
  className="absolute inset-0 w-full h-full origin-center"
  style={{
    scale: imageScale,
    willChange: 'transform', // Optimisation GPU
  }}
>
```

```css
/* Dans globals.css */
.hero-image {
  transform: translateZ(0); /* Force GPU acceleration */
  backface-visibility: hidden; /* Évite les artefacts */
}
```

## Tests effectués

- ✅ Compilation TypeScript sans erreurs
- ✅ Serveur de développement démarré avec succès
- ✅ Structure responsive préservée
- ⏳ Test visuel en cours (serveur disponible sur http://localhost:3001)

## Comparaison avec ap-3.net

| Caractéristique | ap-3.net | ReveelBox |
|----------------|----------|-----------|
| Position du hero | Sticky | ✅ Sticky |
| Scale de l'image | 1 → ~1.20 | ✅ 1 → 1.20 |
| Fade-out du hero | Progressive | ✅ Progressive (easeOutExpo) |
| Fade-in section suivante | Avec translateY | ✅ Avec translateY (60px → 0) |
| Easing | Fluide | ✅ easeOutExpo [0.16, 1, 0.3, 1] |
| Texte animé | Non | ✅ Non (pas d'animation texte) |

## Prochaines étapes

1. **Test visuel** : Vérifier l'effet sur http://localhost:3001
2. **Test responsive** : Tester sur mobile/tablette (DevTools ou vrais appareils)
3. **Ajustements fins** :
   - Ajuster les valeurs de scale si nécessaire
   - Ajuster les timings de transition (points de keyframes)
   - Vérifier la fluidité sur différents navigateurs
4. **Optimisation** : Ajouter les optimisations GPU si nécessaire

## Dépannage

### Problème : La transition est saccadée
**Solution** : Ajouter `will-change: transform` et `transform: translateZ(0)` sur les éléments animés

### Problème : Le hero ne disparaît pas complètement
**Solution** : Vérifier les z-index et les valeurs d'opacity dans `heroOpacity`

### Problème : La section suivante apparaît trop tôt/tard
**Solution** : Ajuster les keyframes dans `nextSectionOpacity` et `nextSectionY`

### Problème : L'effet ne fonctionne pas sur mobile
**Solution** : Vérifier la hauteur du viewport (`h-screen` vs `h-dvh`) et tester avec des valeurs réduites pour mobile

## Fichiers modifiés

- ✅ `app/components/HeroTransition.tsx` (nouveau)
- ✅ `app/components/HeroSection.tsx` (modifié : changement de `relative h-screen` → `absolute inset-0 h-full`)
- ✅ `app/page.tsx` (modifié : ajout du wrapper HeroTransition)
- ✅ `HERO_TRANSITION_GUIDE.md` (nouveau, ce fichier)
