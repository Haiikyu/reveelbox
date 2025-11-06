# 🎨 ReveelBox Design System

## Direction Artistique

### Concept Global
**ReveelBox** - Une expérience gaming premium, mystérieuse et énergique, avec une esthétique cyberpunk-luxe.

### Mots-clés
- Mystère & Révélation
- Énergie & Puissance
- Premium & Luxe
- Gaming & Compétition
- Surprise & Excitation

---

## 🎨 Palette de Couleurs

### Couleurs Principales
```css
--primary: #10b981      /* Emerald - Success, Gaming */
--primary-dark: #047857
--primary-light: #34d399

--secondary: #3b82f6    /* Blue - Trust, Tech */
--secondary-dark: #1e40af
--secondary-light: #60a5fa

--accent: #a855f7       /* Purple - Mystery, Premium */
--accent-dark: #7e22ce
--accent-light: #c084fc
```

### Couleurs d'État
```css
--success: #10b981
--warning: #f59e0b
--error: #ef4444
--info: #3b82f6
```

### Couleurs de Rareté (Loot System)
```css
--rarity-common: #94a3b8      /* Slate */
--rarity-uncommon: #22c55e    /* Green */
--rarity-rare: #3b82f6        /* Blue */
--rarity-epic: #a855f7        /* Purple */
--rarity-legendary: #f59e0b   /* Amber */
--rarity-mythic: #ef4444      /* Red */
```

### Neutrals (Dark Theme Priority)
```css
--slate-950: #020617
--slate-900: #0f172a
--slate-800: #1e293b
--slate-700: #334155
--slate-600: #475569
--white-alpha-5: rgba(255, 255, 255, 0.05)
--white-alpha-10: rgba(255, 255, 255, 0.1)
--white-alpha-20: rgba(255, 255, 255, 0.2)
```

---

## 🔤 Typographie

### Fonts
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-heading: 'Space Grotesk', sans-serif  /* Pour les titres gaming */
--font-mono: 'JetBrains Mono', 'Courier New', monospace
```

### Échelle de Tailles
```css
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */
--text-2xl: 1.5rem     /* 24px */
--text-3xl: 1.875rem   /* 30px */
--text-4xl: 2.25rem    /* 36px */
--text-5xl: 3rem       /* 48px */
--text-6xl: 3.75rem    /* 60px */
```

### Hiérarchie Typographique
- **H1 (Hero)**: text-5xl font-black tracking-tight
- **H2 (Section)**: text-3xl font-bold
- **H3 (Subsection)**: text-2xl font-semibold
- **Body**: text-base font-medium
- **Caption**: text-sm font-medium text-white/60
- **Label**: text-xs font-bold uppercase tracking-wider

---

## 🎭 Effets & Animations

### Glassmorphism (Signature ReveelBox)
```css
background: rgba(255, 255, 255, 0.05)
backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.1)
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3)
```

### Néons & Glows
```css
/* Primary Glow */
box-shadow: 0 0 20px rgba(16, 185, 129, 0.5),
            0 0 40px rgba(16, 185, 129, 0.3),
            0 0 60px rgba(16, 185, 129, 0.1)

/* Purple Mystery Glow */
box-shadow: 0 0 20px rgba(168, 85, 247, 0.5),
            0 0 40px rgba(168, 85, 247, 0.3)
```

### Animations Clés
```css
/* Pulse (Gaming/Active) */
@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

/* Shimmer (Premium) */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

/* Float (Mystery) */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Rotate (Power) */
@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Timing Functions
```css
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1)
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-gaming: cubic-bezier(0.87, 0, 0.13, 1)
```

---

## 🧩 Composants Standards

### Boutons
```tsx
// Primary Button
<button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600
                   hover:from-emerald-600 hover:to-emerald-700
                   text-white font-bold rounded-xl
                   shadow-lg shadow-emerald-500/30
                   hover:shadow-xl hover:shadow-emerald-500/50
                   transition-all duration-300
                   border border-emerald-400/30">
  Action
</button>

// Ghost Button
<button className="px-6 py-3 bg-white/5 hover:bg-white/10
                   backdrop-blur-xl border border-white/20
                   text-white font-bold rounded-xl
                   transition-all duration-300">
  Secondary
</button>

// Danger Button
<button className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600
                   text-white font-bold rounded-xl
                   shadow-lg shadow-red-500/30">
  Danger
</button>
```

### Cards
```tsx
// Premium Card (Glassmorphism)
<div className="bg-white/5 backdrop-blur-2xl
                rounded-2xl border border-white/10
                shadow-2xl shadow-black/20
                hover:border-emerald-500/30
                transition-all duration-500
                overflow-hidden group">
  {/* Content */}
</div>

// Battle Card (Gaming Style)
<div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
                rounded-2xl border-2 border-emerald-500/20
                shadow-[0_0_30px_rgba(16,185,129,0.2)]
                relative overflow-hidden">
  {/* Animated border */}
  <div className="absolute inset-0 bg-gradient-to-r
                  from-transparent via-emerald-500/20 to-transparent
                  animate-shimmer" />
</div>
```

### Inputs
```tsx
<input className="w-full px-4 py-3
                  bg-white/5 backdrop-blur-xl
                  border border-white/20
                  focus:border-emerald-500/50
                  rounded-xl text-white
                  placeholder:text-white/40
                  transition-all duration-300" />
```

### Badges
```tsx
// Status Badge
<span className="px-3 py-1 bg-emerald-500/20
                 text-emerald-400 text-xs font-bold
                 border border-emerald-500/30
                 rounded-full">
  ACTIVE
</span>

// Rarity Badge (Dynamic)
<span className={`px-3 py-1 text-xs font-black uppercase
                   rounded-full border-2
                   ${getRarityStyles(rarity)}`}>
  {rarity}
</span>
```

---

## 📐 Spacing & Layout

### Échelle d'Espacement
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
```

### Border Radius
```css
--radius-sm: 0.5rem    /* 8px */
--radius-md: 0.75rem   /* 12px */
--radius-lg: 1rem      /* 16px */
--radius-xl: 1.5rem    /* 24px */
--radius-2xl: 2rem     /* 32px */
--radius-full: 9999px
```

### Container
```css
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px
```

---

## 🎯 Patterns d'Usage

### Page Header Pattern
```tsx
<div className="relative py-20 overflow-hidden">
  {/* Background gradient */}
  <div className="absolute inset-0 bg-gradient-to-br
                  from-slate-950 via-slate-900 to-emerald-950/20" />

  {/* Animated hexagons */}
  <DecorativeHexagons />

  {/* Content */}
  <div className="relative z-10 container mx-auto">
    <h1 className="text-5xl font-black bg-gradient-to-r
                   from-white via-emerald-200 to-white
                   bg-clip-text text-transparent">
      Page Title
    </h1>
  </div>
</div>
```

### Modal Pattern
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  className="fixed inset-0 z-50 flex items-center justify-center p-6">

  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

  {/* Modal */}
  <div className="relative bg-white/5 backdrop-blur-2xl
                  rounded-2xl border border-white/10
                  max-w-2xl w-full shadow-2xl">
    {/* Content */}
  </div>
</motion.div>
```

### Grid Pattern (Box Display)
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
                gap-4 md:gap-6">
  {items.map(item => (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="aspect-square bg-white/5 backdrop-blur-xl
                 rounded-2xl border border-white/10
                 hover:border-emerald-500/30
                 transition-all duration-300">
      {/* Item */}
    </motion.div>
  ))}
</div>
```

---

## 🎮 Interactions

### Hover States
```css
/* Subtle Lift */
hover:translate-y-[-4px]
hover:shadow-xl
transition-all duration-300

/* Glow Intensify */
hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]

/* Border Highlight */
hover:border-emerald-500/50

/* Background Brighten */
hover:bg-white/10
```

### Active States
```css
active:scale-95
active:shadow-inner
```

### Loading States
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  className="w-8 h-8 border-4 border-emerald-500/30
             border-t-emerald-500 rounded-full" />
```

---

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile-First Approach
```tsx
// Base: Mobile
className="text-2xl px-4"

// Medium: Tablet
className="text-2xl md:text-3xl px-4 md:px-6"

// Large: Desktop
className="text-2xl md:text-3xl lg:text-4xl px-4 md:px-6 lg:px-8"
```

---

## ✨ Micro-animations

### Coin Spin
```tsx
<motion.img
  animate={{ rotate: [0, 10, -10, 0] }}
  transition={{ duration: 2, repeat: Infinity }}
  src="/coin.png" />
```

### Success Feedback
```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: [0, 1.2, 1] }}
  transition={{ type: "spring", stiffness: 500 }}>
  ✓
</motion.div>
```

### Attention Pulse
```tsx
<motion.div
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 2, repeat: Infinity }}>
  New!
</motion.div>
```

---

## 🎪 Principes de Composition

### 1. **Hiérarchie Claire**
- Titre principal toujours le plus grand
- 3 niveaux max de hiérarchie visible
- Espacement proportionnel à l'importance

### 2. **Contraste Fort**
- Texte blanc sur fonds sombres
- Éléments importants avec glows
- Séparation claire entre sections

### 3. **Consistance**
- Même style de boutons partout
- Même border-radius sur les cards
- Même timing d'animation

### 4. **Profondeur**
- Glassmorphism pour les overlays
- Shadows pour les éléments flottants
- Z-index cohérent

### 5. **Feedback Visuel**
- Hover states sur tous les cliquables
- Loading states clairs
- Success/Error messages animés

---

## 🚀 Checklist Nouvelle Feature

Avant de créer un nouveau composant/page:

- [ ] Utilise-t-il la palette de couleurs définie?
- [ ] Le glassmorphism est-il appliqué aux cards?
- [ ] Les animations ont-elles les bons timings?
- [ ] Le responsive fonctionne-t-il sur mobile?
- [ ] Les hover states sont-ils présents?
- [ ] La typographie suit-elle la hiérarchie?
- [ ] Les espacements utilisent-ils l'échelle définie?
- [ ] Le contraste est-il suffisant pour l'accessibilité?

---

## 📚 Ressources

### Inspirations Visuelles
- **Gaming**: Valorant, Overwatch UI
- **Premium**: Apple, Tesla websites
- **Crypto/Tech**: Coinbase, Stripe dashboards

### Outils
- Figma pour les maquettes
- Tailwind Play pour les prototypes
- Framer Motion pour les animations
- Color.review pour contraste

---

*Ce design system est un document vivant. Mettez-le à jour au fil des évolutions du projet.*
