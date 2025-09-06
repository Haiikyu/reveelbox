# Architecture des Composants - ReveelBox

## 📁 Structure des composants

```
app/components/
├── index.ts                 # Exports centralisés
├── BoxPresentation/         # Présentation des boîtes
├── OpeningButtons/          # Boutons d'ouverture (boxes normales)
├── FreedropButtons/         # Boutons pour freedrops
├── LootList/               # Liste des objets (style unifié)
├── Wheel/                  # Roue d'animation sans contours
└── WinningResult/          # Résultat de l'ouverture
```

## 🎯 Composants principales

### BoxPresentation
- **Usage**: Affichage harmonisé des boîtes (boxes et freedrops)
- **Features**: Image grande sans contours, badges de rareté, progression niveau
- **Props**: `boxName`, `boxImage`, `boxPrice?`, `requiredLevel?`, `isFreedrp?`

### Wheel (améliorée)
- **Changes**: Suppression des contours et flèche
- **Features**: Ligne centrale subtile, effets de particules, noms sous les objets
- **Props**: `items`, `winningItem`, `fastMode`, `onFinish`, `isSpinning`

### LootList (unifiée)
- **Style**: Identique à la page listing /boxes
- **Features**: Coins et pourcentages colorés selon rareté, tri par valeur
- **Props**: `items[]` avec probabilités

### OpeningButtons vs FreedropButtons
- **OpeningButtons**: Pour boxes payantes ("OPEN 1 TIME" + coins)
- **FreedropButtons**: Pour freedrops ("RÉCLAMER GRATUITEMENT")

## 🔧 Utilitaires

### lootbox-utils.ts
```typescript
selectRandomItem(items: LootItem[]): LootItem
calculateBoxRarity(requiredLevel: number): Rarity
sortItemsByOrder(items: any[]): any[] // Respecte display_order
canOpenFreedropBox(...): boolean
getRarityGlow(rarity: string): string
```

## 📝 Types centralisés

### types/freedrop.ts
- `LootItem` - Objet avec probabilité
- `DailyBox` - Box freedrop avec niveau requis  
- `LootBox` - Box normale avec prix
- `UserStats` - Stats utilisateur
- Props pour tous les composants

## 🚀 Usage

### Import simplifié
```typescript
import { 
  BoxPresentation, 
  Wheel, 
  LootList, 
  OpeningButtons 
} from '@/app/components'
```

### Exemple page d'ouverture
```typescript
return (
  <div>
    <BoxPresentation boxName={box.name} boxImage={box.image} />
    <Wheel items={items} winningItem={winner} onFinish={handleFinish} />
    <OpeningButtons onOpenBox={handleOpen} onTryFree={handleTry} />
    <LootList items={sortedItems} />
  </div>
)
```

## ✅ Fonctionnalités garanties

- **DB connectée**: Objets gagnés ajoutés à l'inventaire via RPC
- **Ordre respecté**: Items triés par `display_order` puis valeur décroissante  
- **Style unifié**: Même rendu visuel entre /boxes et composants
- **Sans contours**: Wheel et BoxPresentation épurées
- **Responsive**: Support mobile complet
- **Mode sombre**: Toutes les animations et couleurs adaptées

## 🐛 Corrections appliquées

1. **Freedrop bloquée**: Timeout 10s + fallback gracieux
2. **Types TypeScript**: Interface strictes sans erreurs
3. **Composants réutilisables**: Architecture modulaire
4. **Performance**: Animations optimisées avec Framer Motion
5. **UX/UI**: Visuels harmonisés selon le design système
