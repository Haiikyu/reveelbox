# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ReveelBox** - Plateforme de loot boxes contenant des objets réels (real physical items). A gamified platform combining virtual loot boxes, battles, affiliate system, and a live chat.

## Development Commands

```bash
# Development
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Supabase (requires Supabase CLI)
npx supabase db push              # Apply migrations to remote
npx supabase db pull              # Pull schema changes
npx supabase functions deploy     # Deploy edge functions
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript (strict mode enabled)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Styling**: Tailwind CSS
- **State Management**: React hooks, TanStack Query, SWR
- **Animations**: Framer Motion
- **Payments**: Stripe
- **Testing**: Jest + Testing Library

## Architecture Overview

### Core Features

1. **Loot Box System** (`app/boxes/`, `lib/boxOpening.ts`)
   - Virtual currency purchases
   - Provably fair opening system with client/server seeds
   - Daily free boxes with streak rewards
   - Item rarity system (Common → Mythic)

2. **Battle System** (`app/battles/`, `app/types/battle.ts`)
   - 1v1, 2v2, team battles
   - Bot support for filling empty slots
   - Provably fair RNG using combined hashes
   - Real-time progression tracking via Supabase subscriptions

3. **Affiliate System** (`app/affiliates/`, `lib/affiliateService.ts`, `utils/affiliate.ts`)
   - 10-tier progression system: Rookie (1%) → Divine (10% commission)
   - Custom referral codes (3-12 chars)
   - Click tracking with conversion analytics
   - Badges, challenges, and notifications

4. **Chat System** (`app/components/chat/`, `app/hooks/useChat.ts`)
   - Global chat room with real-time messages
   - Giveaway system with captcha verification
   - **Important**: Chat messages use a workaround pattern (see Database Patterns below)

5. **Inventory & Market** (`app/inventory/`, `app/market/`)
   - User inventory with physical item tracking
   - Item selling/upgrading mechanics
   - Shipping address management

### Database Architecture

**Supabase PostgreSQL** with extensive Row Level Security (RLS).

**Key Tables**:
- `profiles` - User profiles (extends Supabase auth.users)
- `loot_boxes`, `loot_box_items` - Box definitions and contents
- `battles`, `battle_participants`, `battle_openings` - Battle system
- `affiliate_profiles`, `affiliate_referrals`, `affiliate_clicks` - Affiliate tracking
- `chat_messages_new`, `chat_rooms` - Chat system
- `user_inventory`, `items` - Inventory and items
- `transactions` - Financial history

**Important Views**:
- `battles_with_stats` - Enriched battle data with participant counts
- `affiliate_stats_view` - Pre-calculated affiliate metrics
- `battle_participants_with_profiles` - Participants joined with profile data

### Critical Database Patterns

#### Chat Message Relationship Workaround

**Problem**: The `chat_messages_new` table initially lacked a foreign key to `profiles`, causing Supabase join errors.

**Solution Pattern** (see `app/hooks/useChat.ts:56-117`):
```typescript
// ❌ Don't do this (will fail with "relationship not found" error):
const { data } = await supabase
  .from('chat_messages_new')
  .select('*, profiles!inner(username, avatar_url)')

// ✅ Do this instead (fetch separately and join in memory):
// 1. Fetch messages
const { data: messages } = await supabase
  .from('chat_messages_new')
  .select('id, user_id, content, message_type, created_at')

// 2. Fetch profiles separately
const userIds = [...new Set(messages.map(msg => msg.user_id))]
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, username, avatar_url, level')
  .in('id', userIds)

// 3. Join in JavaScript
const profilesMap = new Map()
profiles.forEach(p => profilesMap.set(p.id, p))
const messagesWithProfiles = messages.map(msg => ({
  ...msg,
  profiles: profilesMap.get(msg.user_id)
}))
```

**Note**: Migration `002_fix_chat_messages_foreign_keys.sql` adds the missing foreign key, but the workaround pattern should remain for compatibility.

### Supabase Client Initialization

**Multiple client creation patterns exist**:
- `utils/supabase/client.ts` - Browser client (uses `createBrowserClient`)
- `utils/supabase/server.ts` - Server client (uses `createServerClient` with cookies)
- `lib/supabase-chat.ts` - Shared chat client (imports from `utils/supabase/client`)

**Important**: Always use `utils/supabase/client.createClient()` for client-side operations to ensure session consistency with `AuthProvider`.

### Custom Hooks Pattern

The codebase uses feature-specific hooks:
- `useChat()` - Chat messages, sending, real-time subscriptions
- `useAffiliate()` - Affiliate profile, stats, code validation
- `useBattleSubscription(battleId)` - Real-time battle state updates
- `useGiveaway()` - Chat giveaway participation
- `useAnalytics()` - Event tracking

### Real-time Subscriptions

Pattern for Supabase real-time (see `useChat.ts:240-259`):
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('unique_channel_name')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'table_name'
    }, (payload) => {
      // Handle update
    })
    .subscribe()

  return () => subscription.unsubscribe()
}, [dependencies])
```

### Provably Fair System

**Battle & Box Opening RNG**:
1. Server generates `server_seed` (stored hashed)
2. Client provides `client_seed`
3. Combined hash = `SHA256(server_seed + client_seed + nonce)`
4. Hash determines outcomes (verifiable post-game)

See: `lib/boxOpening.ts`, `battle.ts` types

### TypeScript Type System

**Database types** auto-generated in `app/types/database.ts`:
```typescript
import { Database } from '@/app/types/database'
type Profile = Database['public']['Tables']['profiles']['Row']
```

Path alias `@/*` maps to project root (configured in `tsconfig.json`).

### Edge Functions

Located in `supabase/functions/`:
- `chat-giveaway-system` - Handles giveaway operations

Deploy with: `npx supabase functions deploy <function-name>`

### Affiliate Commission Tiers

Tier system (see `docs/readme.md:37-58`):
```
Rookie (1-4):        1%
Explorer (5-14):     2%
Adventurer (15-29):  3%
Hunter (30-49):      4%
Elite (50-74):       5%
Master (75-99):      6%
Champion (100-149):  7%
Legend (150-199):    8%
Mythic (200-299):    9%
Divine (300+):       10%
```

Commission calculated on referred user deposits.

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://reveelbox.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
```

## Key Files Reference

- `app/layout.tsx` - Root layout with providers (Auth, Theme, Notifications)
- `app/components/AuthProvider.tsx` - Supabase auth session management
- `app/types/database.ts` - Complete database schema types (auto-generated)
- `lib/rate-limit.ts` - API rate limiting utilities
- `lib/sanitize.ts` - Input sanitization
- `lib/xp-system.ts` - User leveling system
- `next.config.js` - Framer Motion optimization, image domains

## Common Gotchas

1. **Chat Foreign Key Issue**: Always use the separate query pattern for chat messages (see Database Patterns above)
2. **Supabase Client**: Use `utils/supabase/client` for browser, not direct imports
3. **TypeScript Strict Mode**: All files must satisfy strict type checking
4. **Framer Motion**: Already configured in `next.config.js` with optimizations
5. **Image Optimization**: Only whitelisted domains in `next.config.js` can be used with `next/image`

## Testing

Jest configured with Testing Library. Run tests with:
```bash
npm test
```

Test files use `.test.ts` or `.test.tsx` extension.

## Profile Customization System

The profile page (`app/profile/page.tsx`) implements a Steam/Discord-style customizable profile system:

**Customization Options** (stored in `profiles.theme` JSON):
- `card_style`: 'glass' | 'solid' | 'gradient' - Visual card rendering style
- `showcase_type`: 'items' | 'achievements' | 'stats' | 'recent_activity' | 'none'
- `profile_layout`: 'classic' | 'modern' | 'compact'
- `avatar_frame`: 10 options from default to legendary
- `banner_overlay`: 'gradient' | 'solid' | 'none' | 'colorful'
- `profile_effect`: 'subtle' | 'dynamic' | 'none'
- `custom_badge`: VIP/Premium/Elite/Legend badges
- `social_links`: Twitter, Instagram, Twitch, YouTube, Discord, Website
- `background_wallpaper`, `background_pattern`: Visual customization layers

**Helper Functions**:
- `getCardStyle()`: Returns Tailwind classes based on `card_style` setting
- `getAvatarFrameStyle()`: Returns frame styling with borders and animations
- `getBannerOverlayStyle()`: Returns banner overlay classes

**Layout**: 2-column Steam-style with left sidebar (level, stats, badges) and main content (showcase, performance, items)

## UI Component System

Reusable UI components in `app/components/ui/`:
- `Button.tsx`, `Card.tsx`, `Badge.tsx` - Base components
- `Modal.tsx` - Consistent modal wrapper
- `EmptyState.tsx`, `LoadingState.tsx` - Loading/empty states
- `NotificationSystem.tsx` - Global toast notifications
- `CurrencyDisplay.tsx` - Formatted coin display

Use these instead of creating custom implementations.

## Animation Patterns

Framer Motion is configured and optimized. Standard patterns:

**Page transitions**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
/>
```

**Stagger animations**: Use progressive delays (0.1, 0.2, 0.3s)

**Hover effects**: `whileHover={{ y: -4, scale: 1.02 }}`

**Spring animations**: Use `type: "spring", stiffness: 100` for natural movement

## Responsive Design

Mobile-first approach with Tailwind breakpoints:
- Base: Mobile (< 640px)
- `sm:`: Small (≥ 640px)
- `md:`: Medium (≥ 768px)
- `lg:`: Large (≥ 1024px)
- `xl:`: Extra large (≥ 1280px)

Common patterns:
- Text sizing: `text-2xl sm:text-3xl md:text-4xl`
- Spacing: `px-4 sm:px-6 md:px-8`
- Grid columns: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- Visibility: `hidden sm:inline` for mobile-hidden elements
