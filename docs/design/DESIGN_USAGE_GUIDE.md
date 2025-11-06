# 📖 Guide d'Utilisation du Design System ReveelBox

## 🚀 Démarrage Rapide

### 1. Import des Styles

Dans votre `app/layout.tsx` ou `app/globals.css`:

```css
@import './styles/design-tokens.css';
```

### 2. Utilisation des Variables CSS

```tsx
// Dans vos composants
<div style={{
  color: `rgb(var(--color-primary))`,
  background: `rgba(var(--color-primary), 0.1)`,
  boxShadow: 'var(--glow-emerald)'
}}>
  Content
</div>
```

### 3. Classes Tailwind avec Design Tokens

```tsx
// Utilisation des classes custom
<div className="glass-card hover-lift">
  <h2 className="text-gradient-emerald">Title</h2>
</div>
```

---

## 🎨 Exemples de Composants

### Bouton Primary (Style Gaming)

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-6 py-3
             bg-gradient-to-r from-emerald-500 to-emerald-600
             hover:from-emerald-600 hover:to-emerald-700
             text-white font-bold rounded-xl
             shadow-lg shadow-emerald-500/30
             hover:shadow-xl hover:shadow-emerald-500/50
             transition-all duration-300
             border border-emerald-400/30">
  Open Box
</motion.button>
```

### Card Premium (Glassmorphism)

```tsx
<motion.div
  whileHover={{ y: -8 }}
  className="glass-card group overflow-hidden">

  {/* Animated border glow */}
  <motion.div
    className="absolute inset-0 opacity-0 group-hover:opacity-100
               bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
    animate={{ x: ['-100%', '200%'] }}
    transition={{ duration: 2, repeat: Infinity }}
  />

  {/* Content */}
  <div className="relative z-10 p-6">
    <h3 className="text-2xl font-bold text-white mb-2">
      Premium Box
    </h3>
    <p className="text-white/60 text-sm">
      Unlock exclusive items
    </p>
  </div>
</motion.div>
```

### Badge de Rareté

```tsx
const RarityBadge = ({ rarity }) => {
  return (
    <span className={`rarity-badge rarity-${rarity.toLowerCase()}`}>
      {rarity}
    </span>
  )
}

// Usage
<RarityBadge rarity="legendary" />
```

### Input Moderne

```tsx
<div className="relative">
  <input
    type="text"
    className="w-full px-4 py-3
               glass rounded-xl
               text-white placeholder:text-white/40
               focus:outline-none
               focus:ring-2 focus:ring-emerald-500/50
               transition-all duration-300"
    placeholder="Enter amount..."
  />

  {/* Icon */}
  <div className="absolute right-3 top-1/2 -translate-y-1/2
                  text-white/60">
    🔍
  </div>
</div>
```

### Modal avec Glassmorphism

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6">

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative glass-card max-w-2xl w-full">

        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r
                        from-emerald-500 to-purple-500
                        opacity-20 blur-xl -z-10" />

        {/* Content */}
        <div className="p-8">
          <h2 className="text-3xl font-black text-white mb-4">
            Title
          </h2>
          <p className="text-white/70">Content</p>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### Section Header avec Background Animé

```tsx
<div className="relative py-20 overflow-hidden">
  {/* Gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br
                  from-slate-950 via-slate-900 to-emerald-950/20" />

  {/* Animated grid */}
  <motion.div
    className="absolute inset-0 opacity-5"
    style={{
      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
      backgroundSize: '40px 40px'
    }}
    animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
  />

  {/* Content */}
  <div className="relative z-10 container mx-auto px-6">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-5xl font-black text-gradient-emerald mb-4">
      Battles Arena
    </motion.h1>
    <p className="text-xl text-white/70">
      Compete and win amazing prizes
    </p>
  </div>
</div>
```

### Stats Card avec Effets

```tsx
<div className="glass-card p-6 relative overflow-hidden group">
  {/* Glow on hover */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                  bg-gradient-to-br from-emerald-500/10 to-transparent
                  transition-opacity duration-300" />

  {/* Icon with glow */}
  <div className="relative mb-4">
    <motion.div
      className="w-16 h-16 rounded-2xl
                 bg-gradient-to-br from-emerald-500 to-emerald-600
                 flex items-center justify-center
                 shadow-lg shadow-emerald-500/30"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring" }}>
      <span className="text-2xl">🎁</span>
    </motion.div>
  </div>

  {/* Stats */}
  <div className="relative">
    <div className="text-3xl font-black text-white mb-1">
      {stats.value}
    </div>
    <div className="text-sm font-medium text-white/60">
      {stats.label}
    </div>
  </div>
</div>
```

### Loading State

```tsx
<div className="flex items-center justify-center p-12">
  <motion.div
    className="relative">
    {/* Outer ring */}
    <motion.div
      className="w-16 h-16 border-4 border-emerald-500/30
                 border-t-emerald-500 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />

    {/* Inner glow */}
    <motion.div
      className="absolute inset-0 rounded-full glow-emerald"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </motion.div>
</div>
```

---

## 🎭 Patterns d'Animation

### Entrance Animation (Page/Section)

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div
  variants={container}
  initial="hidden"
  animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {/* Content */}
    </motion.div>
  ))}
</motion.div>
```

### Hover Lift Effect

```tsx
<motion.div
  whileHover={{ y: -8, scale: 1.02 }}
  transition={{ type: "spring", stiffness: 300 }}
  className="glass-card cursor-pointer">
  {/* Content */}
</motion.div>
```

### Success Feedback

```tsx
const [success, setSuccess] = useState(false)

{success && (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.2, 1], opacity: 1 }}
    transition={{ type: "spring", stiffness: 500 }}
    className="fixed top-4 right-4 z-50
               glass-card px-6 py-4 flex items-center gap-3">
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 0.5 }}
      className="w-8 h-8 rounded-full bg-emerald-500
                 flex items-center justify-center">
      ✓
    </motion.div>
    <span className="font-bold text-white">Success!</span>
  </motion.div>
)}
```

---

## 📱 Responsive Patterns

### Container Responsive

```tsx
<div className="container mx-auto
                px-4 sm:px-6 lg:px-8
                py-8 sm:py-12 lg:py-16">
  {/* Content */}
</div>
```

### Grid Responsive

```tsx
<div className="grid
                grid-cols-1 sm:grid-cols-2
                md:grid-cols-3 lg:grid-cols-4
                gap-4 sm:gap-6 lg:gap-8">
  {/* Items */}
</div>
```

### Text Responsive

```tsx
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl
               font-black">
  Title
</h1>

<p className="text-sm sm:text-base lg:text-lg">
  Description
</p>
```

---

## 🎯 Do's and Don'ts

### ✅ DO

```tsx
// Use design tokens
<div style={{ color: `rgb(var(--color-primary))` }} />

// Use semantic classes
<button className="glass-card hover-lift" />

// Use consistent spacing
<div className="space-y-6" />

// Use motion for interactions
<motion.div whileHover={{ scale: 1.05 }} />
```

### ❌ DON'T

```tsx
// Don't use hardcoded colors
<div style={{ color: '#10b981' }} /> ❌

// Don't mix inconsistent styles
<button className="bg-blue-500 rounded-sm" /> ❌

// Don't use random spacing
<div style={{ marginTop: '23px' }} /> ❌

// Don't forget animations
<div className="cursor-pointer" /> ❌ (add hover effect)
```

---

## 🔧 Utilitaires Helper

### Get Rarity Color

```tsx
const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'var(--rarity-common)',
    uncommon: 'var(--rarity-uncommon)',
    rare: 'var(--rarity-rare)',
    epic: 'var(--rarity-epic)',
    legendary: 'var(--rarity-legendary)',
    mythic: 'var(--rarity-mythic)'
  }
  return colors[rarity.toLowerCase()] || colors.common
}
```

### Format Number with Animation

```tsx
import { useSpring, animated } from '@react-spring/web'

const AnimatedNumber = ({ value }) => {
  const props = useSpring({ number: value, from: { number: 0 } })

  return (
    <animated.span className="text-4xl font-black text-gradient-emerald">
      {props.number.to(n => Math.floor(n).toLocaleString())}
    </animated.span>
  )
}
```

---

## 📦 Composants Réutilisables à Créer

Créez ces composants dans `app/components/ui/`:

1. **Button.tsx** - Bouton avec variantes (primary, secondary, ghost, danger)
2. **Card.tsx** - Card avec glassmorphism et variantes
3. **Badge.tsx** - Badges de rareté et statut
4. **Input.tsx** - Input avec styles cohérents
5. **Modal.tsx** - Modal avec backdrop et animations
6. **LoadingSpinner.tsx** - Loading state cohérent
7. **Toast.tsx** - Notifications toast
8. **Tooltip.tsx** - Tooltips avec glassmorphism

---

## 🎨 Thème Sombre vs Clair

Pour l'instant, ReveelBox est principalement dark theme. Si vous voulez ajouter un light theme:

```css
/* Dans design-tokens.css */
[data-theme="light"] {
  --color-slate-950: 255 255 255;
  --color-slate-900: 249 250 251;
  /* etc... */
}
```

```tsx
// Toggle theme
<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle Theme
</button>
```

---

*Consultez `DESIGN_SYSTEM.md` pour la documentation complète des tokens et principes.*
