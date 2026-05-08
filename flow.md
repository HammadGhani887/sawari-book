# Sawari Book Business Flow

This file is a working reference for understanding the app before making changes. It describes what the product is doing right now in code, not only what the final production app should do.

## Product Idea

Sawari Book is a ride-hailing revenue tracker for car owners and drivers in Pakistan.

Main business problem:

- Owner wants to know each vehicle ki daily/monthly earning, expense, driver activity, aur final profit.
- Driver wants a fast way to log rides, fuel, and expenses during the day.
- Expenses logged by driver need owner approval before they count in owner calculations.
- Monthly settlement tells owner: total revenue minus commissions/expenses/driver salary equals owner profit.

## User Roles

There are two roles:

- `owner`: manages vehicles, drivers, rides, expenses, settlements, reports.
- `driver`: logs rides, fuel, expenses, and sees his own day/earnings/profile.

Route groups:

- Owner UI: `src/app/(owner)/*`
- Driver UI: `src/app/(driver)/*`
- Auth UI: `src/app/(auth)/*`

Accent colors:

- Owner: green.
- Driver: blue.

## Current Auth Flow

Current implementation is mock/local only.

1. `src/app/page.tsx`
   - Splash screen.
   - Always redirects to `/login` after 1.5 seconds.
   - It does not yet check existing token before redirecting.

2. `/login`
   - User enters Pakistan phone number without `+92`.
   - OTP UI appears.
   - Any complete 6-digit OTP is accepted by local mock store logic.
   - `authStore.login(phone, otp)` sets:
     - `user`
     - `token: "mock-jwt-token"`
     - `isAuthenticated: true`
     - `role: null`
   - Then routes to `/role-select`.

3. `/role-select`
   - User chooses `owner` or `driver`.
   - `authStore.setRole(role)` updates `user.role`.
   - Owner goes to `/dashboard`.
   - Driver goes to `/home`.

4. `AuthGuard`
   - Owner/driver layouts wrap pages in `AuthGuard`.
   - It checks `token` and `user` from Zustand localStorage.
   - If missing, redirects to `/login`.
   - If wrong role, redirects to that user's correct home route.

Important note:

- There are API auth routes too, but frontend login currently does not use them.
- API token role detection expects token prefixes like `owner-...` or `driver-...`, while frontend stores `"mock-jwt-token"`.

## Data Architecture Right Now

The app has three data layers, but the UI mostly uses only one.

### 1. TypeScript Domain Types

Defined in `src/lib/types/index.ts`.

Main entities:

- `User`
- `Vehicle`
- `DriverAssignment`
- `Ride`
- `Expense`
- `FuelLog`
- `Settlement`
- `Notification`
- `DashboardStats`

### 2. Zustand Stores

This is the real active frontend data source right now.

Stores are persisted in browser `localStorage`.

- `authStore`: user, token, role, language.
- `prefsStore`: language for i18n.
- `vehicleStore`: owner vehicles.
- `driverStore`: driver profiles and vehicle assignment.
- `rideStore`: rides.
- `expenseStore`: expenses and approval status.
- `fuelStore`: fuel logs.
- `settlementStore`: historical settlements.
- `notificationStore`: owner notifications.
- `vehicleSettingsStore`: fuel average, petrol price, estimated fuel cost.

Most pages read/write these stores directly. They do not call the API client.

### 3. API Routes With Mock Arrays

Routes exist in `src/app/api/*`.

They import arrays from `src/app/api/_data/mockData.ts`.

These routes are currently separate from the Zustand data used by pages. So a ride added in UI store does not automatically update API mock arrays.

### 4. Prisma Schema

`prisma/schema.prisma` exists and is fairly close to TypeScript types.

Production direction should be:

- Replace mock arrays and local-only stores with Prisma-backed API routes.
- Keep stores as client cache/UI state where useful.
- Make auth real with JWT + DB user lookup.

## Owner Flow

### Owner Dashboard: `/dashboard`

File: `src/app/(owner)/dashboard/page.tsx`

Shows:

- Greeting and notification count.
- Today's rides count.
- Today's revenue.
- Today's approved expenses.
- Today's net profit.
- Weekly revenue chart.
- Vehicle cards with today's ride count/revenue and assigned driver.

Data source:

- `vehicleStore`
- `rideStore`
- `expenseStore`
- `driverStore`
- `notificationStore`

Calculation:

- `todayRides = rides where rideTime starts with TODAY`
- `totalRevenue = sum(today ride fareAmount)`
- `totalExpenses = approved expenses where date starts with TODAY`
- `netProfit = totalRevenue - totalExpenses`

Important:

- `TODAY` is hardcoded in `rideStore` as `2026-05-07`.

### Vehicle Management

List page: `/vehicles`

- Shows all owner vehicles.
- For each vehicle:
  - today's rides
  - today's revenue
  - assigned driver
- Opens vehicle detail page on click.

Add page: `/vehicles/add`

Owner enters:

- vehicle photo preview
- number plate
- make/model
- fuel type
- ride platforms
- optional insurance expiry

On save:

- `vehicleStore.addVehicle(...)`
- ownerId is hardcoded as `"1"` inside store.
- redirects to `/vehicles`.

### Driver Management

List page: `/drivers`

- Shows all drivers.
- For each driver:
  - phone
  - assigned vehicle
  - today's rides
  - today's revenue
  - active/inactive status

Add page: `/drivers/add`

Owner enters:

- driver name
- phone
- CNIC
- optional vehicle assignment
- salary structure:
  - fixed
  - percentage
  - hybrid

On save:

- `driverStore.addDriver(...)`
- generated driver id like `d${Date.now()}`
- `startDate` is today's date.

Current salary limitation:

- Fixed salary is used in settlement.
- Percentage/hybrid UI exists, but settlement calculation only handles fixed salary properly.
- Hybrid bonus fields are not stored in the current `DriverProfile` shape.

### Owner Expenses: `/expenses`

Shows:

- Pending expenses in an amber approval section.
- Approved/rejected expenses grouped by date.
- Category filters.
- Monthly total.

Business rule:

- Driver-submitted expenses start as `pending`.
- Owner can approve or reject.
- Only `approved` expenses count in settlement and many reports.

Current issue:

- Monthly total currently sums all expenses regardless of status, including pending/rejected. If business wants actual spend, it should probably count approved only.

### Owner Add Expense: `/expenses/add`

Owner can add an expense directly.

Likely business meaning:

- Owner-created expenses can be vehicle-level costs like insurance, token tax, maintenance.
- Need confirm whether owner-created expenses should be auto-approved or pending. Current code should be checked before changing this flow.

### Ride Review: `/rides`

Owner sees ride list and can flag/dispute rides using `rideStore.flagRide`.

Business meaning:

- Disputed rides are suspicious/incorrect rides.
- The ride amount still exists unless later business logic excludes it.

### Notifications: `/notifications`

Owner sees alert-style feed:

- ride logged
- anomaly
- pending expense
- settlement ready

Current implementation is local mock notifications only.

## Driver Flow

### Driver Home: `/home`

File: `src/app/(driver)/home/page.tsx`

Shows:

- greeting
- assigned vehicle
- add ride main action
- today's rides
- today's revenue
- today's fuel
- today's timeline combining rides, fuel, and expenses

Data source:

- current driver from `useCurrentDriver()`
- vehicles
- rides
- fuel logs
- expenses

Important:

- `useCurrentDriver()` is hardcoded to driver `d1`.
- It does not yet map the logged-in user to a driver profile in production style.

### Add Ride: `/add-ride`

Driver enters:

- platform: inDrive, Yango, Other
- fare amount
- payment type: cash or wallet
- optional pickup/drop area
- optional distance in km

If distance is entered:

- app estimates fuel cost using vehicle settings:
  - effective fuel average km/L
  - petrol price PKR/L
- shows revenue per km and estimated net.

On save:

- builds ride:
  - vehicleId from current driver, fallback `v1`
  - driverId from current driver, fallback `d1`
  - platform
  - fareAmount
  - paymentType
  - pickup/drop
  - distanceKm optional
  - rideTime now
  - isDisputed false
- If offline:
  - saves to localStorage offline queue.
- If online:
  - `rideStore.addRide(...)`.
- Success screen appears, then redirects to `/home`.

Offline flow:

- `saveRideOffline` stores pending rides under `sawari-offline-ride-queue`.
- `OfflineSyncProvider` listens for browser `online`.
- On online, queued rides are added to `rideStore` and queue is cleared.

### Add Fuel: `/add-fuel`

Driver enters:

- fuel cost
- litres
- optional odometer
- optional pump name

On save:

- `fuelStore.addFuelLog(...)`
- vehicleId/driverId from current driver fallback.
- date is now.

Business use:

- Fuel logs show daily fuel spend.
- Odometer-bearing logs are used to calculate automatic km/L average.

### Add Expense: `/add-expense`

Driver enters:

- category
- amount
- note
- optional receipt photo preview

On submit:

- creates expense with:
  - `status: "pending"`
  - `loggedBy: driver.id`
  - `vehicleId: driver.vehicleId`
  - date now
- Owner must approve it before it counts as approved cost.

Current limitation:

- Receipt photo is only previewed locally. `receiptUrl` is not saved/uploaded yet.

### Driver Stats / My Day / Earnings

These pages aggregate the same stores:

- rides
- fuel logs
- expenses
- settlements

Business meaning:

- Driver can see performance, daily log, and past earnings/settlements.

## Settlement Flow

Page: `/settlement/[vehicleId]`

Goal:

- Owner calculates monthly vehicle settlement and final owner profit.

Inputs:

- selected vehicle
- selected month/year
- assigned driver
- rides in period
- approved expenses in period
- driver salary

Current calculation:

1. `grossRevenue = sum(fareAmount of period rides)`
2. `platformComm = round(grossRevenue * 0.12)`
3. `fuelExp = approved expenses where category is fuel`
4. `maintExp = approved expenses where category is maintenance or oil_change`
5. `otherExp = all other approved expenses`
6. `netAfterExp = grossRevenue - platformComm - fuelExp - maintExp - otherExp`
7. `driverSalary = driver.salaryAmount if salaryType is fixed, otherwise 0`
8. `ownerProfit = netAfterExp - driverSalary`

Current issue:

- `markSettled` is imported from `settlementStore` but not called.
- Pressing "Mark as Settled" only sets local `isSettled` state on that page.
- It does not create/update a settlement record.
- Page refresh or month/vehicle navigation loses that settled state.

Production expectation:

- On settle, create or update `Settlement`.
- Store:
  - ownerId
  - driverId
  - vehicleId
  - periodStart
  - periodEnd
  - totalRevenue
  - totalExpenses
  - driverSalary
  - ownerProfit
  - status settled
  - settledAt

## Reports Flow

Page: `/reports`

Shows charts using store data:

- daily revenue for May 2026
- approved expense breakdown by category
- revenue split by platform
- profit trend from settled settlements
- this month vs last month comparison

Current limitations:

- `dateRange` UI exists but most calculations are hardcoded around May 2026.
- Comparisons percentages are static display values.

## Main Business Rules

- A vehicle belongs to an owner.
- A driver can be assigned to a vehicle.
- Driver logs rides for assigned vehicle.
- Ride revenue is counted immediately.
- Driver logs fuel separately as fuel logs.
- Driver logs expenses as pending.
- Owner approves/rejects expenses.
- Only approved expenses should affect profit/settlement.
- Settlement is monthly per vehicle/driver.
- Owner profit is revenue minus platform commission, approved expenses, and driver salary.
- Notifications are owner-facing alerts.
- Offline ride logging is supported locally for drivers.

## Important IDs In Mock Data

Common seed IDs:

- Owner user: `1`
- Driver user: `2`
- Driver profile Ahmed: `d1`
- Driver profile Farhan: `d2`
- Vehicle Alto: `v1`
- Vehicle City: `v2`

Be careful:

- Some API mock data uses user IDs like `2`, while UI store rides use driver IDs like `d1`.
- `useCurrentDriver()` currently returns `d1` regardless of logged-in user.

## Known Current Gaps / Risks

- Frontend mostly does not use API routes yet.
- API routes mostly do not use Prisma yet.
- Auth is mock and local.
- `TODAY` is hardcoded as `2026-05-07`.
- Driver identity is hardcoded in `useCurrentDriver()`.
- Settlement mark action does not persist to settlement store.
- Expense receipt upload is not implemented.
- Owner monthly expense total may include pending/rejected expenses.
- Reports date range is mostly visual, not fully applied to calculations.
- Percentage/hybrid salary models are incomplete in settlement logic.
- Some Urdu/emoji text may look garbled in terminal output because of encoding; verify in browser before changing content.

## When Adding New Features

Use this order of thinking:

1. Which role owns this action: owner or driver?
2. Which entity changes: vehicle, driver, ride, expense, fuel log, settlement, notification?
3. Is the source of truth currently Zustand store, API mock array, or Prisma?
4. Should the data be pending, approved, rejected, disputed, or settled?
5. Which downstream screens must update: dashboard, detail page, reports, settlement, notification feed?
6. Does this need offline behavior?
7. Does this need owner approval?

