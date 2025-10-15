# ✅ Checklist: Appliquer le Design System

## 📋 Étape par Étape

### Phase 1: Setup Initial ✅

- [x] Créer `DESIGN_SYSTEM.md` (documentation complète)
- [x] Créer `DESIGN_USAGE_GUIDE.md` (guide pratique)
- [x] Créer `app/styles/design-tokens.css` (variables CSS)
- [x] Importer les tokens dans `app/layout.tsx`
- [x] Créer le composant `Button.tsx` (exemple)

### Phase 2: Composants UI de Base ✅

Créer dans `app/components/ui/`:

- [x] **Card.tsx** - Card avec glassmorphism
  ```tsx
  <Card variant="glass" hover="lift">
    <CardHeader>Title</CardHeader>
    <CardContent>Content</CardContent>
  </Card>
  ```

- [x] **Badge.tsx** - Badges de rareté/statut
  ```tsx
  <Badge rarity="legendary" />
  <Badge status="active" variant="success" />
  ```

- [x] **Input.tsx** - Input avec glass effect
  ```tsx
  <Input
    type="text"
    placeholder="Search..."
    icon={<SearchIcon />}
  />
  ```

- [x] **Modal.tsx** - Modal avec backdrop animé
  ```tsx
  <Modal isOpen={open} onClose={close}>
    <ModalHeader>Title</ModalHeader>
    <ModalContent>Content</ModalContent>
  </Modal>
  ```

- [x] **Toast.tsx** - Notifications toast (utilise NotificationSystem existant)
  ```tsx
  const { addNotification } = useNotification()
  addNotification({ type: 'success', message: 'Box opened!' })
  ```

- [x] **LoadingSpinner.tsx** - État de chargement
  ```tsx
  <LoadingSpinner size="lg" color="emerald" />
  ```

- [x] **Tooltip.tsx** - Tooltips avec glassmorphism
  ```tsx
  <Tooltip content="Click to open">
    <Button>Hover me</Button>
  </Tooltip>
  ```

- [x] **index.ts** - Export centralisé des composants
  ```tsx
  import { Card, Button, Badge, Modal } from '@/app/components/ui'
  ```

### Phase 3: Refactorisation des Pages Existantes

Appliquer le design system aux pages:

- [ ] **`app/boxes/page.tsx`**
  - [ ] Remplacer les boutons par `<Button>`
  - [ ] Utiliser les classes glass pour les cards
  - [ ] Ajouter les animations hover-lift
  - [ ] Utiliser les badges de rareté

- [ ] **`app/battles/page.tsx`**
  - [ ] Glassmorphism sur les cards de battle
  - [ ] Boutons avec variantes du design system
  - [ ] Animations d'entrée cohérentes

- [ ] **`app/battles/create/page.tsx`**
  - [ ] Déjà fait partiellement (sidebar)
  - [ ] Harmoniser les boutons
  - [ ] Unifier les cards

- [ ] **`app/inventory/page.tsx`**
  - [ ] Cards glassmorphism pour les items
  - [ ] Badges de rareté
  - [ ] Effets hover cohérents

- [ ] **`app/profile/page.tsx`**
  - [ ] Sections avec glass effect
  - [ ] Badges personnalisés
  - [ ] Animations uniformes

- [ ] **`app/affiliates/page.tsx`**
  - [ ] Stats cards glassmorphism
  - [ ] Boutons call-to-action
  - [ ] Badges de tier

### Phase 4: Composants Complexes

- [ ] **BoxCard.tsx** - Card de box réutilisable
  ```tsx
  <BoxCard
    box={boxData}
    variant="premium"
    onOpen={handleOpen}
  />
  ```

- [ ] **BattleCard.tsx** - Card de battle
  ```tsx
  <BattleCard
    battle={battleData}
    status="active"
    onJoin={handleJoin}
  />
  ```

- [ ] **ItemCard.tsx** - Card d'item d'inventaire
  ```tsx
  <ItemCard
    item={itemData}
    rarity="legendary"
    onSell={handleSell}
  />
  ```

- [ ] **StatsWidget.tsx** - Widget de statistiques
  ```tsx
  <StatsWidget
    label="Total Wins"
    value={42}
    icon={<TrophyIcon />}
    trend="+12%"
  />
  ```

### Phase 5: Animations Globales

- [ ] **Page Transitions**
  - [ ] Animation d'entrée pour chaque page
  - [ ] Transition entre pages

- [ ] **Scroll Animations**
  - [ ] Fade-in au scroll
  - [ ] Stagger children animations

- [ ] **Micro-interactions**
  - [ ] Success feedbacks
  - [ ] Error states
  - [ ] Loading states

### Phase 6: Responsive & Accessibilité

- [ ] **Mobile Optimization**
  - [ ] Tester toutes les pages sur mobile
  - [ ] Ajuster les tailles de texte
  - [ ] Espacements responsifs

- [ ] **Accessibilité**
  - [ ] Contraste des couleurs (WCAG AA minimum)
  - [ ] Focus states sur les boutons
  - [ ] Labels ARIA sur les modals
  - [ ] Navigation clavier

### Phase 7: Documentation & Guidelines

- [ ] **Component Storybook** (optionnel)
  - [ ] Stories pour chaque composant UI
  - [ ] Exemples d'utilisation

- [ ] **Internal Wiki** (optionnel)
  - [ ] Tutoriels vidéo
  - [ ] Best practices
  - [ ] Code snippets

### Phase 8: Optimisation

- [ ] **Performance**
  - [ ] Lazy load des composants lourds
  - [ ] Optimiser les animations (GPU)
  - [ ] Réduire le bundle size

- [ ] **SEO**
  - [ ] Meta tags cohérents
  - [ ] Open Graph images
  - [ ] Structured data

---

## 🎯 Priorités

### 🔥 Urgent (Cette semaine)
1. Créer les composants UI de base (Card, Badge, Input)
2. Refactoriser la page Boxes (page principale)
3. Harmoniser les boutons sur tout le site

### ⚡ Important (Ce mois)
1. Refactoriser toutes les pages avec le design system
2. Créer les composants complexes (BoxCard, BattleCard)
3. Ajouter les animations globales

### 📌 À terme
1. Créer un Storybook
2. Documentation vidéo
3. Guide de contribution

---

## 📊 Progression

**Global:** [████████░░] 75% complété

- Setup: ✅ 100%
- Composants UI: ✅ 100% (Phase 2 terminée!)
- Pages: ⏳ 20%
- Animations: ⏳ 30%
- Responsive: ⏳ 50%
- Documentation: ✅ 100%

### 🎉 Dernière mise à jour
**Phase 2 complétée!** Tous les composants UI de base ont été créés avec succès:
- Card.tsx (4 variantes: glass, solid, gradient, battle)
- Badge.tsx (rareté + statut + variants)
- Input.tsx (avec icons et glass effect)
- Modal.tsx (avec sous-composants Header/Content/Footer)
- LoadingSpinner.tsx (avec variantes LoadingOverlay et LoadingDots)
- Tooltip.tsx (avec variantes TooltipRich et TooltipInfo)
- index.ts (export centralisé)

---

## 💡 Tips

### Avant de coder un nouveau composant:
1. ✅ Vérifier si un composant similaire existe
2. ✅ Consulter le `DESIGN_USAGE_GUIDE.md`
3. ✅ Utiliser les design tokens (variables CSS)
4. ✅ Ajouter les animations Framer Motion
5. ✅ Tester sur mobile

### Workflow recommandé:
```bash
# 1. Créer le composant
touch app/components/ui/NewComponent.tsx

# 2. Utiliser les tokens
# Importer les classes custom du design system

# 3. Tester
npm run dev

# 4. Documenter
# Ajouter un exemple dans DESIGN_USAGE_GUIDE.md
```

---

*Mettez à jour cette checklist au fur et à mesure de votre progression.*
