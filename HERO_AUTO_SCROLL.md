# Hero Auto-Scroll - Documentation

## 🎯 Comportement implémenté

L'effet de transition entre le hero (État 1) et le carrousel (État 2) est maintenant **entièrement automatique** :

### ✅ Ce qui se passe maintenant

1. **L'utilisateur est sur le hero (État 1)**
   - Il voit l'image de plage fullscreen avec tous les éléments

2. **L'utilisateur commence à scroller vers le bas (même légèrement)**
   - Dès que le scroll dépasse **10px**, la transition automatique se déclenche
   - Le scroll manuel est **temporairement bloqué** pendant 1.4 secondes
   - L'animation scroll automatiquement jusqu'à l'État 2 (carrousel)
   - Easing fluide **easeOutExpo** pour une transition douce

3. **La transition se joue automatiquement**
   - Image scale : 1 → 1.20 (ou 1.15 sur mobile)
   - Hero opacity : 1 → 0
   - Section suivante : fade-in + translateY (60px → 0)
   - Durée totale : **1.4 secondes**

4. **L'utilisateur arrive automatiquement à l'État 2**
   - Le scroll manuel est **réactivé**
   - L'utilisateur peut maintenant scroller normalement dans le reste du contenu

### 🔄 Scroll inverse (bonus)

Si l'utilisateur scroll vers le haut depuis l'État 2 :
- La transition inverse se déclenche automatiquement
- Retour à l'État 1 (hero fullscreen) en 1.4s
- Même fluidité, même easing

## 🎬 Comparaison avant/après

### ❌ Avant
```
Utilisateur scroll → Doit scroller manuellement tout le long de la transition
→ Risque d'arrêter en plein milieu (État 1.5)
→ Expérience non contrôlée
```

### ✅ Après
```
Utilisateur scroll (10px) → Transition automatique déclenchée
→ Animation fluide de 1.4s jusqu'à l'État 2
→ Scroll bloqué pendant l'animation (pas d'interférence)
→ Arrivée garantie à l'État 2
→ Expérience contrôlée et prévisible
```

## 🔧 Paramètres techniques

### Seuil de détection
```tsx
// Fichier : app/components/HeroTransition.tsx
// Ligne 59
if (scrollY > 10 && !transitionComplete) {
  // Déclencher la transition
}
```

**Valeur actuelle : 10px**
- Permet de détecter rapidement l'intention de scroll
- Évite les faux positifs (scroll accidentel minimal)

Pour ajuster :
- Plus sensible : `scrollY > 5` (déclenche plus rapidement)
- Moins sensible : `scrollY > 20` (nécessite un scroll plus marqué)

### Durée de la transition
```tsx
// Ligne 68
const duration = 1400 // 1.4s
```

**Valeur actuelle : 1400ms (1.4 secondes)**
- Équilibre entre fluidité et rapidité
- Correspond aux transitions standard du web moderne

Pour ajuster :
- Plus rapide : `1000` (1s)
- Plus lent : `2000` (2s)

### Fonction d'easing
```tsx
// Ligne 72
const easeOutExpo = (t: number) => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}
```

**Type : easeOutExpo**
- Démarre rapidement, ralentit progressivement
- Crée une sensation naturelle et confortable
- Évite l'effet "brutal" ou "mécanique"

Pour tester d'autres easing :
- `easeInOutQuad` : `t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2`
- `easeOutCubic` : `1 - Math.pow(1 - t, 3)`

### Seuil de scroll inverse
```tsx
// Ligne 97
else if (scrollDirection === 'up' && transitionComplete && scrollY < window.innerHeight - 100) {
  // Déclencher le retour à l'État 1
}
```

**Valeur actuelle : innerHeight - 100px**
- Si l'utilisateur scrolle vers le haut et est à moins de 100px du hero
- Déclenche automatiquement le retour à l'État 1

Pour ajuster :
- Plus sensible : `innerHeight - 200` (déclenche plus tôt)
- Moins sensible : `innerHeight - 50` (déclenche plus tard)

## 📱 Responsive

Le comportement est **identique sur tous les devices** :
- Desktop : Transition de 1.4s, scale 1.20
- Mobile : Transition de 1.4s, scale 1.15 (légèrement réduit)
- Tablette : Même comportement que desktop

## 🎨 Personnalisation

### Changer la durée selon le device

Dans `HeroTransition.tsx`, ligne 68 :
```tsx
// Durée adaptée au device
const duration = isMobile ? 1200 : 1400
```

### Désactiver le scroll inverse

Commenter les lignes 96-128 dans `HeroTransition.tsx` :
```tsx
// CAS 2: Scroll vers le haut depuis l'État 2 → Retour à l'État 1
// else if (scrollDirection === 'up' && transitionComplete && scrollY < window.innerHeight - 100) {
//   // ... code commenté
// }
```

### Changer le seuil de détection selon le device

```tsx
const scrollThreshold = isMobile ? 20 : 10 // Plus élevé sur mobile pour éviter les faux positifs tactiles
if (scrollY > scrollThreshold && !transitionComplete) {
  // ...
}
```

## 🧪 Tests

### Test manuel

1. Ouvrir http://localhost:3001
2. Attendre le chargement complet du hero
3. Scroller **légèrement** vers le bas (10-20px)
4. Observer : la transition doit se lancer automatiquement
5. Vérifier : impossible de scroller pendant la transition
6. Vérifier : arrivée automatique au carrousel (État 2)
7. Scroller vers le bas dans le carrousel (scroll normal réactivé)
8. Scroller vers le haut pour revenir au hero
9. Observer : retour automatique à l'État 1

### Tests DevTools

#### Vérifier le blocage du scroll
```js
// Console Chrome pendant la transition
console.log(document.body.style.overflow) // Doit être "hidden"
```

#### Vérifier l'état de la transition
```js
// Dans React DevTools, chercher le composant HeroTransition
// States à vérifier :
// - isTransitioning: true pendant l'animation
// - transitionComplete: true une fois à l'État 2
```

#### Performance
```js
// DevTools → Performance
// Enregistrer pendant la transition
// Vérifier : FPS doit rester ~60
// Temps de frame doit être < 16ms
```

## 🐛 Dépannage

### Problème : La transition se déclenche trop facilement
**Cause** : Seuil de détection trop bas (10px)
**Solution** : Augmenter à 20-30px (ligne 59)
```tsx
if (scrollY > 30 && !transitionComplete) {
```

### Problème : La transition ne se déclenche pas
**Causes possibles** :
1. JS bloqué par une erreur → Vérifier la console
2. Scroll déjà au-delà du hero → Recharger la page
3. État `isTransitioning` bloqué → Rafraîchir la page

**Debug** :
```tsx
// Ajouter des logs dans handleScroll (ligne 50)
console.log('Scroll détecté:', scrollY, 'Direction:', scrollDirection, 'Transitioning:', isTransitioning)
```

### Problème : Le scroll reste bloqué après la transition
**Cause** : Le `useEffect` de déblocage ne s'est pas exécuté
**Solution temporaire** : Rafraîchir la page
**Fix définitif** : Ajouter un timeout de sécurité
```tsx
// Dans l'animation (ligne 86)
setTimeout(() => {
  setIsTransitioning(false)
  document.body.style.overflow = ''
}, duration + 100) // Sécurité : +100ms
```

### Problème : La transition est saccadée sur mobile
**Causes possibles** :
1. GPU non utilisé → Vérifier `willChange` et `translateZ(0)`
2. Trop de particules → Réduire dans HeroSection
3. Device trop lent → Réduire la durée à 1000ms

**Solution** :
```tsx
// Réduire la durée sur mobile (ligne 68)
const duration = isMobile ? 1000 : 1400
```

### Problème : Le scroll inverse se déclenche trop facilement
**Cause** : Seuil trop élevé (`innerHeight - 100`)
**Solution** : Réduire à 50px (ligne 97)
```tsx
else if (scrollDirection === 'up' && transitionComplete && scrollY < window.innerHeight - 50) {
```

## 📊 Métriques de qualité

### Attendues
- ✅ FPS : ~60 pendant toute la transition
- ✅ Durée de transition : 1.4s ± 50ms
- ✅ Blocage scroll : Actif pendant exactement 1.4s
- ✅ Arrivée précise : scrollY = window.innerHeight à la fin
- ✅ Aucun saut visuel (frame skip)

### Comment mesurer
```
1. DevTools → Performance → Record
2. Déclencher la transition (scroll 10px)
3. Attendre la fin (1.4s)
4. Stop recording
5. Analyser :
   - FPS graph (doit être stable à 60)
   - JavaScript execution (pas de long task > 50ms)
   - Paint time (doit être < 16ms)
```

## 🎉 Avantages du système

### Pour l'utilisateur
- ✅ Expérience fluide et prévisible
- ✅ Pas besoin de scroller manuellement toute la transition
- ✅ Impossible de rester "coincé" entre deux états
- ✅ Navigation intuitive (scroll = avancer)

### Pour le développeur
- ✅ Contrôle total sur la transition
- ✅ États bien définis (1 ou 2, jamais entre-deux)
- ✅ Facilite le debugging (états déterministes)
- ✅ Peut ajouter des analytics précis sur l'engagement

### Pour les performances
- ✅ GPU acceleration maximale pendant la transition
- ✅ Scroll bloqué = pas de calculs parasites
- ✅ Transition prédictible = optimisation possible

## 🔄 Évolutions possibles

### 1. Ajouter un indicateur visuel
```tsx
{isTransitioning && (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
    <div className="animate-pulse bg-white/20 px-4 py-2 rounded-full backdrop-blur">
      Transition en cours...
    </div>
  </div>
)}
```

### 2. Ajouter un son de transition
```tsx
// Au déclenchement (ligne 60)
const audio = new Audio('/sounds/transition.mp3')
audio.play()
```

### 3. Permettre d'annuler la transition (ESC)
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isTransitioning) {
      setIsTransitioning(false)
      document.body.style.overflow = ''
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isTransitioning])
```

### 4. Analytics
```tsx
// À la fin de la transition (ligne 87)
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'hero_transition_complete', {
    duration: duration,
    device: isMobile ? 'mobile' : 'desktop'
  })
}
```

## 📁 Fichiers modifiés

- ✅ `app/components/HeroTransition.tsx` (lignes 45-138 : logique d'auto-scroll)
- ✅ `HERO_AUTO_SCROLL.md` (ce fichier)

## 🚀 Résultat final

**Comportement exact voulu :**
> L'utilisateur ne devrait pas avoir à scroller entre les deux états.

**✅ Implémenté avec succès !**

Dès que l'utilisateur scroll de 10px, la transition se lance automatiquement et l'amène directement à l'État 2 en 1.4s. Aucune intervention manuelle nécessaire.

---

**Serveur de test** : http://localhost:3001
**Essayez maintenant** : Scrollez légèrement et observez la magie ! ✨
