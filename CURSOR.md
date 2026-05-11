# CURSOR.md

AI context file for the `sawari-book` project. Use this as the first reference before making code changes.

## What This Project Is

`sawari-book` is a role-based fleet operations app (owner + driver) built with Next.js App Router and TypeScript.

- Owners manage vehicles, drivers, rides, expenses, settlements, reports, notifications, and subscription.
- Drivers log rides/fuel/expenses, track daily progress, and view earnings/profile.
- The app supports offline-first entry for key driver flows and Urdu/English localization.

## Tech Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS
- Zustand persisted stores (client cache + app state)
- Prisma + PostgreSQL (for backend persistence where implemented)
- Next.js API routes for server logic
- PWA + web push notifications

## Route Architecture (Critical)

Routes are split by role using App Router route groups:

- `(auth)` -> `/login`, registration/invite onboarding
- `(owner)` -> `/dashboard`, `/vehicles`, `/drivers`, `/rides`, `/expenses`, `/reports`, `/settlement/[vehicleId]`, `/settings`, `/subscription`
- `(driver)` -> `/home`, `/add-ride`, `/add-fuel`, `/add-expense`, `/my-day`, `/earnings`, `/profile`

Important files:

- `src/app/(auth)/layout.tsx`
- `src/app/(owner)/layout.tsx`
- `src/app/(driver)/layout.tsx`
- `src/components/layout/AuthGuard.tsx`
- `src/app/page.tsx` (root redirect by auth/role)

## End-to-End App Flow

1. User logs in via `authStore.login` and is redirected by role.
2. `DataSyncProvider` triggers `useDataSync` to hydrate stores from APIs.
3. Screens primarily read from Zustand stores.
4. Driver create flows post to API; offline fallback queues unsent payloads.
5. `OfflineSyncProvider` replays queued items when connectivity returns.

Key files:

- `src/lib/store/authStore.ts`
- `src/components/layout/DataSyncProvider.tsx`
- `src/lib/hooks/useDataSync.ts`
- `src/hooks/useOfflineQueue.ts`
- `src/components/layout/OfflineSyncProvider.tsx`

## Core Domain Entities

Canonical type source:

- `src/lib/types/index.ts`

Main entities:

- `User` (owner/driver)
- `Vehicle`
- `DriverAssignment`
- `Ride`
- `Expense`
- `FuelLog`
- `Settlement`
- `Notification`
- `Invite`
- `PushSubscription`

Database schema:

- `prisma/schema.prisma`

## Business Logic (Most Important Rules)

### Financial calculations

- Profit trends in owner flows generally use:
  - revenue - fuel cost - approved expenses - boost
- Fuel cost preference:
  - actual fuel logs first
  - then estimated fuel from rides if logs are missing

Where this logic lives:

- `src/app/(owner)/dashboard/page.tsx`
- `src/app/(owner)/reports/page.tsx`
- `src/app/(owner)/settlement/[vehicleId]/page.tsx`
- `src/app/(driver)/my-day/page.tsx`

### Expense workflow

- Driver-created expenses default to `pending`.
- Owner-created expenses are typically auto-approved.
- Owners can approve/reject expense requests.

API/files:

- `src/app/api/expenses/route.ts`
- `src/app/api/expenses/[id]/approve/route.ts`
- `src/app/api/expenses/[id]/reject/route.ts`

### Ride dispute workflow

- Owners can toggle disputed state on rides (`isDisputed`).

API/files:

- `src/app/api/rides/[id]/flag/route.ts`
- `src/lib/store/rideStore.ts`

### Settlement workflow

- Owner settlement page computes and stores settlement status in client/store path.
- Settlement APIs exist but are still mock/TODO in parts.

Files:

- `src/app/(owner)/settlement/[vehicleId]/page.tsx`
- `src/app/api/settlements/route.ts`
- `src/app/api/settlements/[id]/settle/route.ts`

## State and Data Flow Rules

- Zustand stores are persistent and widely used as the UI source of truth.
- API routes are not uniformly Prisma-backed yet (some still mock-backed).
- Always verify whether a screen is using store data, API data, or both.

Store location:

- `src/lib/store/*.ts`

API location:

- `src/app/api/**`

Mock data source still in use:

- `src/app/api/_data/mockData.ts`

## API/Backend Pattern

For protected API routes:

1. Parse auth using helpers in `src/app/api/_lib/auth.ts`
2. Validate role/ownership
3. Read/write via Prisma where implemented
4. Return normalized API payload

Shared backend utils:

- `src/app/api/_lib/auth.ts`
- `src/app/api/_lib/push.ts`
- `src/lib/prisma.ts`

## Offline + PWA + Push

- Driver add flows support offline queueing.
- Install prompt and basic PWA behavior are integrated.
- Push notification subscription and server push endpoint are implemented.

Files:

- `src/hooks/useOfflineQueue.ts`
- `src/hooks/useInstallPrompt.ts`
- `src/lib/hooks/usePushNotifications.ts`
- `src/app/api/push/subscribe/route.ts`
- `public/push-sw.js`

## i18n and RTL

- Translation system is dictionary-based (`en`, `ur`).
- Use `useTranslation()` for strings.
- For manual Urdu inline text, set `dir="rtl"` where needed.

Files:

- `src/lib/utils/i18n.ts`
- `src/lib/store/prefsStore.ts`

## UI Conventions You Must Respect

- `Card` becomes a `<button>` when `onClick` is provided. Do not nest clickable wrappers around it.
- `ScreenHeader` is client-only (uses router/navigation behavior).
- `NumericKeypad` expects raw numeric string state; component handles display formatting.
- Role bottom nav wrappers (`OwnerBottomNav`/`DriverBottomNav`) set role-specific nav behavior.

Files:

- `src/components/ui/Card.tsx`
- `src/components/ui/ScreenHeader.tsx`
- `src/components/ui/NumericKeypad.tsx`
- `src/components/layout/OwnerBottomNav.tsx`
- `src/components/layout/DriverBottomNav.tsx`

## Design System Notes

Theme + utilities:

- `tailwind.config.ts`
- `src/app/globals.css`

Note: there is known accent-token drift between docs and actual `tailwind.config.ts`. Check code, not assumptions, before changing role colors.

## Build, Lint, Typecheck, Prisma

Use these checks after meaningful changes:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build` (runs `prisma generate` as part of build script)

When changing Prisma schema:

- `npx prisma db push`
- `npx prisma generate`

## Known Gaps / Risks (Read Before Refactors)

- Mixed truth sources (Prisma-backed + mock-backed routes).
- Dashboard and settlement API paths are partially mock/TODO.
- OTP flow has placeholder behavior in parts.
- Some auth/push secrets have fallback defaults; production should rely on env vars.
- Potential ID-shape confusion between driver user IDs vs driver assignment/store IDs in different flows.

## Quick "Where To Look" Map

- Auth + redirects: `src/lib/store/authStore.ts`, `src/lib/hooks/useAuth.ts`, `src/app/(auth)/login/page.tsx`
- Role entry screens: `src/app/(owner)/dashboard/page.tsx`, `src/app/(driver)/home/page.tsx`
- Rides: `src/app/api/rides/route.ts`, `src/lib/store/rideStore.ts`
- Expenses: `src/app/api/expenses/**`, `src/lib/store/expenseStore.ts`
- Fuel: `src/app/api/fuel/route.ts`, `src/lib/store/fuelStore.ts`
- Drivers: `src/app/api/drivers/**`, `src/lib/store/driverStore.ts`
- Vehicles: `src/app/api/vehicles/**`, `src/lib/store/vehicleStore.ts`
- Settlements: `src/app/(owner)/settlement/[vehicleId]/page.tsx`, `src/lib/store/settlementStore.ts`
- Reports/date filtering: `src/app/(owner)/reports/page.tsx`, `src/lib/utils/date.ts`, `src/components/ui/DateRangeFilter.tsx`
- Notifications/push: `src/app/api/notifications/**`, `src/lib/store/notificationStore.ts`, `src/lib/hooks/usePushNotifications.ts`

## AI Assistant Working Agreement

When responding to prompts on this repository:

1. Identify user role context first (owner vs driver vs auth).
2. Confirm source of truth before coding (store vs API vs Prisma vs mock).
3. Preserve status transitions and financial calculation semantics.
4. Reuse existing UI and utility primitives before adding new abstractions.
5. Validate with lint/typecheck, and mention any unresolved mock/TODO dependencies.

