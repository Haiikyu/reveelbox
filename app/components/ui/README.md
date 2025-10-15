# 🎨 ReveelBox UI Components Library

Bibliothèque de composants réutilisables suivant le **Design System ReveelBox**.

## 📦 Installation

Les composants sont déjà installés dans le projet. Importez-les depuis :

```tsx
import { Card, Button, Badge, Modal } from '@/app/components/ui'
```

## 🧩 Composants Disponibles

### Button

Bouton avec plusieurs variantes et animations.

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'danger' | 'success'`
- `size`: `'sm' | 'md' | 'lg' | 'xl'`
- `loading`: `boolean` - Affiche un spinner
- `shimmer`: `boolean` - Ajoute l'effet shimmer
- `icon`: `ReactNode` - Icône à afficher
- `iconPosition`: `'left' | 'right'`

**Exemple:**
```tsx
<Button variant="primary" size="lg" shimmer>
  Open Box
</Button>
```

---

### Card

Carte avec glassmorphism et animations.

**Props:**
- `variant`: `'glass' | 'solid' | 'gradient' | 'battle'`
- `hover`: `'lift' | 'glow' | 'scale' | 'none'`
- `padding`: `'sm' | 'md' | 'lg' | 'xl'`
- `onClick`: `() => void`

**Sous-composants:**
- `CardHeader` - En-tête de la carte
- `CardContent` - Contenu principal
- `CardFooter` - Pied de la carte

**Exemple:**
```tsx
<Card variant="glass" hover="lift">
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

### Badge

Badge pour rareté, statut ou variantes.

**Props:**
- `rarity`: `'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'`
- `status`: `'active' | 'inactive' | 'pending'`
- `variant`: `'success' | 'warning' | 'error' | 'info' | 'default'`
- `size`: `'sm' | 'md' | 'lg'`
- `animate`: `boolean`

**Exemple:**
```tsx
<Badge rarity="legendary" animate>
  Legendary Item
</Badge>

<Badge status="active">
  Online
</Badge>
```

---

### Input

Input avec glass effect et icônes.

**Props:**
- `label`: `string`
- `error`: `string`
- `icon`: `ReactNode`
- `iconPosition`: `'left' | 'right'`
- `fullWidth`: `boolean`
- ...tous les props HTML input standards

**Exemple:**
```tsx
<Input
  label="Username"
  placeholder="Enter username..."
  icon={<SearchIcon />}
  iconPosition="left"
  error={errors.username}
/>
```

---

### Modal

Modal avec backdrop animé et glassmorphism.

**Props:**
- `isOpen`: `boolean`
- `onClose`: `() => void`
- `title`: `string`
- `size`: `'sm' | 'md' | 'lg' | 'xl' | 'full'`
- `showCloseButton`: `boolean` (défaut: `true`)
- `closeOnBackdropClick`: `boolean` (défaut: `true`)

**Sous-composants:**
- `ModalHeader` - En-tête du modal
- `ModalContent` - Contenu principal
- `ModalFooter` - Pied du modal (boutons d'action)

**Exemple:**
```tsx
const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmation"
  size="md"
>
  <ModalContent>
    <p>Are you sure?</p>
  </ModalContent>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

---

### LoadingSpinner

Spinner de chargement avec glow effects.

**Props:**
- `size`: `'sm' | 'md' | 'lg' | 'xl'`
- `color`: `'emerald' | 'purple' | 'blue' | 'white'`
- `text`: `string` - Texte optionnel

**Variantes:**
- `LoadingOverlay` - Overlay plein écran
- `LoadingDots` - Trois points animés

**Exemple:**
```tsx
<LoadingSpinner size="lg" color="emerald" text="Loading..." />

<LoadingOverlay text="Processing..." />

<LoadingDots color="emerald" />
```

---

### Tooltip

Tooltip avec glassmorphism.

**Props:**
- `content`: `ReactNode`
- `position`: `'top' | 'bottom' | 'left' | 'right'`
- `delay`: `number` (en ms)

**Variantes:**
- `TooltipRich` - Tooltip avec titre et description
- `TooltipInfo` - Icône info avec tooltip

**Exemple:**
```tsx
<Tooltip content="Click to open" position="top">
  <Button>Hover me</Button>
</Tooltip>

<TooltipRich
  title="Premium Feature"
  description="This requires a premium account"
  position="top"
>
  <Button>Premium Action</Button>
</TooltipRich>

<TooltipInfo content="Additional information" />
```

---

## 🎨 Design Tokens

Tous les composants utilisent les design tokens définis dans `app/styles/design-tokens.css` :

- **Couleurs**: Emerald (primary), Blue (secondary), Purple (accent)
- **Glassmorphism**: `bg-white/5 backdrop-blur-2xl border border-white/10`
- **Animations**: Framer Motion avec spring physics
- **Responsive**: Mobile-first avec breakpoints Tailwind

---

## 📚 Documentation Complète

- **Design System**: `DESIGN_SYSTEM.md` - Documentation complète
- **Usage Guide**: `DESIGN_USAGE_GUIDE.md` - Guide pratique avec exemples
- **Checklist**: `DESIGN_CHECKLIST.md` - Progression de l'implémentation
- **Demo Page**: `/demo-components` - Page de démonstration interactive

---

## 🚀 Prochaines Étapes

### Phase 3: Refactorisation des Pages
- Refactoriser `app/boxes/page.tsx` avec les nouveaux composants
- Appliquer le design system à `app/battles/page.tsx`
- Harmoniser `app/inventory/page.tsx`

### Phase 4: Composants Complexes
- `BoxCard.tsx` - Carte de loot box réutilisable
- `BattleCard.tsx` - Carte de battle
- `ItemCard.tsx` - Carte d'item d'inventaire
- `StatsWidget.tsx` - Widget de statistiques

---

## 💡 Best Practices

1. **Toujours utiliser les design tokens** - Pas de couleurs hardcodées
2. **Utiliser les variantes** - Ne pas créer de styles custom
3. **Animations cohérentes** - Utiliser les configurations existantes
4. **Responsive design** - Tester sur mobile
5. **Accessibilité** - Focus states, ARIA labels, navigation clavier

---

## 🎯 Exemple Complet

```tsx
'use client'

import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Modal,
  ModalContent,
  ModalFooter,
  Tooltip,
  LoadingSpinner,
} from '@/app/components/ui'

export default function ExamplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    // Votre logique ici
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    setIsModalOpen(true)
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <Card variant="glass" hover="lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white">
              Premium Box
            </h2>
            <Badge rarity="legendary" animate>
              NEW
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-white/70 mb-4">
            Unlock exclusive items with this premium box.
          </p>

          {loading && <LoadingSpinner size="md" color="emerald" />}
        </CardContent>

        <CardFooter>
          <Tooltip content="Open this box" position="top">
            <Button
              variant="primary"
              size="lg"
              shimmer
              loading={loading}
              onClick={handleAction}
            >
              Open Box
            </Button>
          </Tooltip>
        </CardFooter>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Success!"
        size="md"
      >
        <ModalContent>
          <div className="text-center">
            <Badge rarity="legendary" size="lg" animate>
              Legendary Item
            </Badge>
            <p className="mt-4 text-white/70">
              You won a legendary item!
            </p>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(false)}
          >
            Claim Reward
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
```

---

*Cette bibliothèque est maintenue dans le cadre du Design System ReveelBox.*
