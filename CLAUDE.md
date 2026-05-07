# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (PWA service worker disabled in dev)
npm run build      # Production build — runs ESLint + TypeScript as part of build
npm run lint       # ESLint only
npx tsc --noEmit   # Type-check without building

# Database
npx prisma db push          # Push schema changes to MySQL (no migrations)
npx prisma studio           # Open Prisma GUI
npx prisma generate         # Regenerate Prisma client after schema edits
```

There are no tests. Type checking and linting are the verification steps.

The `next.config.js` is CommonJS (not `.mjs`) because `next-pwa` requires CJS. Do not convert it to ESM.

## Architecture

### Role separation via App Router route groups

Two distinct user roles with completely separate route trees and UI accents:

| Group | Routes | Accent color | Bottom nav |
|---|---|---|---|
| `(owner)` | `/dashboard`, `/vehicles`, `/drivers`, `/rides`, `/expenses`, `/settlement/[vehicleId]`, `/reports`, `/notifications`, `/settings`, `/subscription` | Green `#10B981` | `OwnerBottomNav` |
| `(driver)` | `/home`, `/add-ride`, `/add-fuel`, `/add-expense`, `/my-day`, `/earnings`, `/profile` | Blue `#3B82F6` | `DriverBottomNav` |
| `(auth)` | `/login`, `/role-select` | — | none |

Each group has its own `layout.tsx`. The root `src/app/page.tsx` is the splash screen — it redirects to `/login` after 1.5s; in production it should check the auth token first.

### State management

Two persisted Zustand stores (localStorage via `persist` middleware):

- **`authStore`** (`sawari-auth` key) — `user`, `token`, `setAuth`, `clearAuth`. The `api.ts` Axios instance reads the token from `useAuthStore.getState()` (outside React, valid in Zustand).
- **`prefsStore`** (`sawari-prefs` key) — `language: 'en' | 'ur'`, `setLanguage`. Drives the i18n system.

### API client

`src/lib/services/api.ts` — Axios instance pointed at `/api` (Next.js API routes) or `NEXT_PUBLIC_API_URL` for an external backend. Attaches JWT `Authorization` header on every request and auto-redirects to `/login` on 401.

### i18n

`src/lib/utils/i18n.ts` exports `useTranslation()` which reads language from `prefsStore` and returns `{ t, dir, isRtl, language }`. All strings are in the `en` and `ur` translation maps inside that file. The hook falls back to `en` then to the key itself if a translation is missing.

For Urdu text rendered inline (not via `t()`), add `dir="rtl"` to the element. The `isRtl` boolean from the hook is available for conditional RTL layout classes.

### Tailwind design tokens

All custom colors are in `tailwind.config.ts` under `theme.extend.colors`:

```
brand.bg       #0F172A   — page background
brand.surface  #1E293B   — card/input background
brand.elevated #334155   — elevated surface, prefix bg, icon bg

accent.green    #10B981  — owner primary, active states, profit
accent.greenDim           — 12% opacity green, used for badge/icon backgrounds
accent.blue     #3B82F6  — driver primary
accent.blueDim            — 12% opacity blue

status.amber    #F59E0B  — warnings, pending, no-vehicle state
status.amberDim
status.red      #EF4444  — errors, disputed, rejected
status.redDim
```

Global utility classes defined in `globals.css`: `.card`, `.card-elevated`, `.btn-primary`, `.btn-secondary`, `.input-field`, `.safe-bottom`, `.no-scrollbar`.

### Component conventions

**`Card`** renders as `<div>` by default. Pass `onClick` and it renders as `<button>` (full-width, `active:scale-[0.98]`). Never wrap a Card in an `<a>` or `<button>` — use the `onClick` prop instead.

**`BottomNav`** is the generic primitive. `OwnerBottomNav` and `DriverBottomNav` in `components/layout/` are thin wrappers that supply the nav items and `accentColor`. Route group layouts mount those wrappers.

**`ScreenHeader`** is a client component (uses `useRouter` for back navigation). Any page that mounts it must either be a client component or wrap it in a client boundary.

**`NumericKeypad`** manages its own display formatting (`toLocaleString`). The parent owns the raw string value (digits only, no commas). On submit, convert with `Number(value)`.

### Constants structure

Every constant file exports both an array and a `*_MAP` object keyed by `id` for O(1) lookup:

```ts
PLATFORMS / PLATFORM_MAP        — src/lib/constants/platforms.ts
EXPENSE_CATEGORIES / CATEGORY_MAP — src/lib/constants/expenseCategories.ts
LAHORE_AREAS                    — src/lib/constants/areas.ts
```

Each entry has `{ id, name, nameUrdu, ... }`. The `id` values are lowercase snake_case (`"indrive"`, `"oil_change"`) and match the `PlatformId` and related union types in `src/lib/types/index.ts`.

### Known schema drift

The Prisma schema (`prisma/schema.prisma`) was scaffolded before the TypeScript types were finalized. There are mismatches to resolve when implementing API routes:

- Prisma `Platform` enum: `inDrive | Yango | Other` — TS `PlatformId`: `indrive | yango | other | private`
- Prisma `Role` enum: `OWNER | DRIVER` — TS `UserRole`: `owner | driver`
- Prisma `Vehicle` model has `make`, `model`, `year`, `color` fields — TS `Vehicle` type uses `makeModel: string`
- Prisma `Expense` lacks `status`, `loggedBy`, `receiptUrl` — TS `Expense` has them
- Prisma `Settlement` uses `driverShare` / `settled: Boolean` — TS `Settlement` uses `driverSalary` / `status: 'pending'|'settled'`

When adding API routes, update the Prisma schema to match the TypeScript types, then run `prisma db push` and `prisma generate`.
