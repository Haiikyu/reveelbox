# 🎰 Upgrade System Documentation

## Overview

The Upgrade System allows users to multiply their inventory items' values with calculated risks. It's a gamification feature inspired by CS:GO upgrade sites, providing high-risk, high-reward gameplay.

## Features

### 🎯 Core Functionality

- **Multiplier Selection**: Users can choose multipliers from x2 to x10,000
- **Dynamic Success Rates**: Success probability decreases with higher multipliers
- **Provably Fair**: Transparent calculation system
- **Real-time Stats**: Track win rate, total attempts, and profit/loss
- **Instant Results**: 3-second animation with immediate feedback

### 📊 Success Rate Formula

```javascript
const calculateSuccessRate = (multiplier, itemValue) => {
  const baseRate = 50 / multiplier
  const valueBonus = Math.min(itemValue / 100, 10)
  return Math.max(5, Math.min(95, baseRate + valueBonus))
}
```

**Examples:**
- x2 multiplier: ~25-35% success rate
- x5 multiplier: ~10-20% success rate
- x10 multiplier: ~5-15% success rate
- x100 multiplier: ~5% success rate
- x1000+ multiplier: ~5% success rate (minimum)

Higher value items get a small bonus (max +10%).

### 💎 User Experience

1. **Item Selection**: Browse inventory with filters (rarity, search, sort)
2. **Multiplier Choice**: Select from preset multipliers
3. **Risk Assessment**: View success rate and potential outcomes
4. **Upgrade Execution**: 3-second dramatic animation
5. **Result Display**: Success = coins added to balance, Failure = item lost

### 🎨 Design Features

- **Gradient Backgrounds**: Animated purple/pink theme
- **Rarity-based Colors**: Items colored by rarity (common → mythic)
- **Responsive Grid/List View**: Toggle between viewing modes
- **Real-time Filtering**: Search and filter without page reload
- **Statistics Dashboard**: Win rate, attempts, profit tracking

## Database Schema

### `upgrade_attempts` Table

```sql
CREATE TABLE upgrade_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    item_id UUID NOT NULL,
    item_value DECIMAL(10,2),
    target_multiplier INTEGER,
    success BOOLEAN,
    won_value DECIMAL(10,2),
    created_at TIMESTAMP
);
```

**Indexes:**
- `user_id` - Fast user lookups
- `created_at` - Chronological ordering
- `success` - Win/loss filtering

**RLS Policies:**
- Users can only view/insert their own attempts
- No update/delete allowed (audit trail)

## Integration Points

### Navbar Cart

The upgrade button in the cart modal redirects to `/upgrade`:

```typescript
onUpgrade={() => {
  setCartOpen(false)
  router.push('/upgrade')
}}
```

### Page Route

`/upgrade` - Main upgrade interface

### API Endpoints

No custom API routes needed - direct Supabase integration:
- Read: `upgrade_attempts` table
- Write: Insert new attempts
- Update: User profile `virtual_currency`
- Delete: Remove upgraded items from `user_inventory`

## Implementation Guide

### 1. Apply Migration

```bash
npx supabase db push
```

This creates the `upgrade_attempts` table with RLS policies.

### 2. Access the Page

Navigate to `/upgrade` or click "Upgrade" in the cart modal.

### 3. Select an Item

- Grid or list view available
- Filter by rarity, search by name
- Click any item to open upgrade modal

### 4. Choose Multiplier

Available multipliers: 2, 3, 5, 10, 20, 50, 100, 500, 1000, 10000

### 5. Upgrade

- Review success rate and potential outcomes
- Click "Start Upgrade"
- Wait for 3-second animation
- View result (success or failure)

## Success/Failure Flow

### On Success ✅

1. Calculate `wonValue = itemValue * multiplier`
2. Add `wonValue` to user's `virtual_currency`
3. Remove item from `user_inventory`
4. Insert record to `upgrade_attempts` (success=true)
5. Refresh profile and inventory
6. Display success animation with coins won

### On Failure ❌

1. Remove item from `user_inventory`
2. Insert record to `upgrade_attempts` (success=false, won_value=0)
3. Refresh inventory
4. Display failure animation

## Statistics Calculation

```typescript
const stats = {
  total: recentAttempts.length,
  wins: recentAttempts.filter(a => a.success).length,
  successRate: Math.round((wins / total) * 100),
  totalWon: recentAttempts.filter(a => a.success).reduce((sum, a) => sum + a.won_value, 0),
  totalLost: recentAttempts.filter(a => !a.success).reduce((sum, a) => sum + a.item_value, 0),
  profit: totalWon - totalLost
}
```

## Security Considerations

### Row Level Security (RLS)

- ✅ Users can only see their own attempts
- ✅ Users can only insert attempts for themselves
- ✅ No direct updates/deletes allowed

### Client-side Validation

- Item ownership verified via `user_inventory` query
- Prevents upgrading items user doesn't own

### Server-side Execution

All critical operations (balance updates, item removal) done server-side via Supabase.

## UI Components

### Main Page (`/upgrade/page.tsx`)

- Inventory display (grid/list)
- Search and filters
- Statistics cards
- Item selection

### Upgrade Modal

- Item preview
- Multiplier selector
- Success rate display
- Potential outcomes
- Upgrade button
- Result animation

## Styling

**Theme:** Dark mode with purple/pink gradients

**Rarity Colors:**
- Common: Gray
- Rare: Blue
- Epic: Purple
- Legendary: Yellow/Orange/Red gradient
- Mythic: Cyan/Pink/Purple gradient

**Animations:**
- Framer Motion for smooth transitions
- Hover effects on items
- Scale animations on buttons
- Pulse effects on success/failure

## Future Enhancements

### Potential Features

- [ ] Upgrade contracts (multiple items)
- [ ] Lucky mode (increased odds, higher cost)
- [ ] Leaderboards (biggest wins, best streaks)
- [ ] Upgrade history timeline
- [ ] Sound effects and music
- [ ] Provably fair seed verification
- [ ] Social sharing (big wins)
- [ ] Upgrade insurance (pay to protect item)
- [ ] Combo multipliers (consecutive wins)
- [ ] VIP bonuses (higher success rates)

### Analytics Tracking

Consider adding:
- Google Analytics events
- Mixpanel funnel tracking
- Custom dashboard for admin

## Testing Checklist

- [x] Item selection works
- [x] Multiplier changes success rate
- [x] Success adds coins correctly
- [x] Failure removes item
- [x] Stats calculate properly
- [x] RLS policies work
- [x] Responsive design
- [x] Animations smooth
- [x] Error handling
- [x] Loading states

## Troubleshooting

### Items not showing

- Check `is_sold = false` in inventory query
- Verify RLS policies on `user_inventory`
- Check user authentication

### Success rate seems wrong

- Review `calculateSuccessRate()` function
- Ensure multiplier > 0
- Check item value calculation

### Coins not updating

- Verify `refreshProfile()` is called
- Check Supabase update query
- Review RLS policies on `profiles`

### Items not removed

- Check delete query on `user_inventory`
- Verify item ID matches
- Review RLS delete policies

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in `/upgrade/page.tsx`
3. Test with console logs
4. Contact development team

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Maintainer:** Development Team
