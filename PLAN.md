# Multi-Business Ledger — Architectural Plan

---

## 1. Reference Repository Architecture Summary

`duitgee-app` is a mature SvelteKit + Cloudflare Workers application with the following key characteristics:

**Hook Sequence**
```
hooks.server.ts → sequence(setupServicesHandler, checkSessionHandler)
```
- `setupServicesHandler` — Validates platform/DB bindings, resolves auth session from the request, populates `event.locals.currentSession` and `event.locals.currentUser`
- `checkSessionHandler` — Enforces route protection; redirects unauthenticated users to `/login`

**API Layer (Hono)**
- Single Hono router at `src/lib/server/api/index.ts`
- All requests caught by `src/routes/api/[...path]/+server.ts`
- Auth middleware in Hono validates session before every protected endpoint
- Feature sub-routers registered: `.route('/', vaultsApi).route('/', expensesApi)` etc.

**Handler Architecture**
- No explicit repository or service classes
- Individual handler functions with signature: `(session, validatedData, env) → Result`
- Direct Drizzle queries inside handlers; `env.DB` instantiated per call
- D1 `batch()` used for multi-step atomicity

**RBAC**
- Role stored in `vaultMembers` table alongside vault membership
- Permissions resolved from in-code maps
- Helper functions: `getUserVaultRole`, `checkVaultPermission`, `requireVaultPermission`

**Schema Conventions**
- All tables: soft deletes (`deletedAt`, `deletedBy`) + full audit trail (`createdBy`, `updatedBy`)
- Amounts as integer cents
- No FK constraints on user ID columns (microservice-friendly)
- Timestamps as UTC ISO 8601 strings

---

## 2. Reusable Architectural Patterns

The following patterns transfer directly from the reference project:

| Pattern | Reference File | Reuse in gee-ledger |
|---|---|---|
| Hook sequence | `hooks.server.ts` | Identical structure |
| `setupServicesHandler` | `hooks/setupServicesHandler.ts` | Adapt: swap Better Auth → Firebase verifier |
| `checkSessionHandler` | `hooks/checkSessionHandler.ts` | Reuse as-is |
| Hono catch-all route | `routes/api/[...path]/+server.ts` | Reuse as-is |
| Hono API middleware | `api/index.ts` | Adapt: swap Better Auth session check → Firebase token check |
| Feature handler modules | `api/[feature]/` | Adopt same file structure |
| Handler signature | `(session, data, env)` | Identical |
| Permission helpers | `utils/vaultPermissions.ts` | Mirror as `utils/businessPermissions.ts` |
| Soft delete convention | All schema tables | Identical |
| Audit trail convention | All schema tables | Identical |
| D1 batch for atomicity | Inside handlers | Identical |
| Route groups `(public)`/`(app)` | SvelteKit routing | Mirror as `(public)`/`(app)` |
| Valibot validation schemas | `schemas/` | Adopt same approach |
| App.d.ts Locals/Api types | `app.d.ts` | Adapt to Firebase user shape |

---

## 3. Authentication Differences

| Aspect | Reference (duitgee-app / Better Auth) | This Project (Firebase Auth) |
|---|---|---|
| Auth provider | Better Auth library | Firebase (Google only) |
| Session storage | Session table in AUTH_DB | **None — stateless** |
| Token type | Better Auth session token (cookie) | Firebase ID token (JWT, 1h TTL) |
| Token location | HTTP cookie | `Authorization: Bearer <token>` header |
| Session lookup | DB query per request | JWT signature verification (JWKS) |
| User sync | Better Auth manages `user` table | Manual `UPSERT` on first verified token |
| JWKS | n/a | `https://www.googleapis.com/oauth2/v3/certs` |
| Token verification lib | Better Auth internal | `jose` (already in project) |
| Multiple providers | Email/password + Google + anonymous | Google only |
| Session expiry | Configurable, stored in DB | Firebase token: 1 hour (client refreshes) |
| Anonymous users | Supported | Remove — Google only |

**Critical consequence**: The existing `sessions` table and `session.ts` service must be deleted. The `jwt-verifier.ts` already in the project is the correct foundation — it just needs to be integrated into the hook pattern rather than the current session-cookie approach.

---

## 4. Updated Middleware Layering

### Hook Sequence

```
Request
  ↓
setupServicesHandler
  - Validate event.platform exists
  - Validate env.DB binding exists
  - Extract Authorization header → Bearer token
  - Verify Firebase ID token via jose (JWKS cache)
  - If valid: UPSERT user record in DB
  - Set event.locals.user (nullable — public routes allowed)
  ↓
checkSessionHandler
  - If route is in PUBLIC_PATHS → pass through
  - If event.locals.user is null → redirect /login (307)
  - Otherwise → pass through
  ↓
Route / Hono API Handler
```

### Hono API Middleware

```
POST/GET /api/**
  ↓
Hono router
  ↓
Auth middleware (before all protected routes)
  - Extract Authorization header
  - Verify Firebase token via jose
  - UPSERT user in DB
  - c.set('currentUser', user)
  ↓
Feature handler
  - Load business role: SELECT from user_business_roles WHERE userId + businessId
  - Resolve permissions from hardcoded POLICIES map
  - Check required permission
  - Execute business logic
```

### Why No Separate Auth Route

Unlike duitgee-app which has `/api/auth/*` handled by Better Auth, this project has no auth API routes. The client handles all Firebase auth operations directly with Firebase SDK. The backend only verifies tokens.

### Token Flow

```
Client
  1. Firebase signInWithPopup(GoogleAuthProvider)
  2. getIdToken() → id_token (1h JWT)
  3. All API calls: Authorization: Bearer {id_token}
  4. Firebase SDK auto-refreshes token before expiry
  5. On 401 from backend → getIdToken(true) to force refresh → retry

Backend
  1. Extract Bearer token
  2. jose.jwtVerify(token, jwks) → verify signature + expiry
  3. Extract sub (Firebase UID), email, name, picture from claims
  4. UPSERT users table
  5. Attach user to request context
```

---

## 5. Full Database Schema with Indexes

### Table: `users`

Replaces existing schema. Simplified — no session tracking.

```
users
  id          TEXT PRIMARY KEY           -- Firebase UID
  email       TEXT NOT NULL UNIQUE
  displayName TEXT
  photoURL    TEXT
  createdAt   TEXT NOT NULL
  updatedAt   TEXT NOT NULL

INDEX: users(email)
```

### Table: `businesses`

```
businesses
  id          TEXT PRIMARY KEY           -- cuid2
  name        TEXT NOT NULL
  description TEXT
  currency    TEXT NOT NULL DEFAULT 'MYR'
  createdAt   TEXT NOT NULL
  createdBy   TEXT NOT NULL              -- userId (no FK constraint)
  updatedAt   TEXT NOT NULL
  updatedBy   TEXT NOT NULL
  deletedAt   TEXT
  deletedBy   TEXT

INDEX: businesses(createdBy)
INDEX: businesses(deletedAt)
```

### Table: `user_business_roles`

```
user_business_roles
  id          TEXT PRIMARY KEY           -- cuid2
  userId      TEXT NOT NULL              -- no FK constraint
  businessId  TEXT NOT NULL
  policyKey   TEXT NOT NULL              -- 'owner' | 'manager' | 'cashier' | 'viewer'
  createdAt   TEXT NOT NULL
  createdBy   TEXT NOT NULL

UNIQUE INDEX: user_business_roles(userId, businessId)  -- one policy per user per business
INDEX: user_business_roles(businessId)
INDEX: user_business_roles(userId)
```

### Table: `locations`

```
locations
  id          TEXT PRIMARY KEY
  businessId  TEXT NOT NULL
  name        TEXT NOT NULL
  type        TEXT NOT NULL              -- 'hq' | 'branch' | 'warehouse' | 'online'
  address     TEXT
  isActive    INTEGER NOT NULL DEFAULT 1
  createdAt   TEXT NOT NULL
  createdBy   TEXT NOT NULL
  updatedAt   TEXT NOT NULL
  updatedBy   TEXT NOT NULL
  deletedAt   TEXT
  deletedBy   TEXT

INDEX: locations(businessId, deletedAt)
```

### Table: `sales_channels`

```
sales_channels
  id          TEXT PRIMARY KEY
  businessId  TEXT NOT NULL
  name        TEXT NOT NULL
  type        TEXT NOT NULL              -- 'walk_in' | 'shopee' | 'lazada' | 'tokopedia' | 'tiktok' | 'custom'
  isActive    INTEGER NOT NULL DEFAULT 1
  createdAt   TEXT NOT NULL
  createdBy   TEXT NOT NULL
  updatedAt   TEXT NOT NULL
  updatedBy   TEXT NOT NULL
  deletedAt   TEXT
  deletedBy   TEXT

INDEX: sales_channels(businessId, deletedAt)
```

### Table: `accounts`

Chart of Accounts. Supports simple hierarchy via `parentId`.

```
accounts
  id          TEXT PRIMARY KEY
  businessId  TEXT NOT NULL
  name        TEXT NOT NULL
  type        TEXT NOT NULL              -- 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  code        TEXT                       -- optional account code (e.g. "4000")
  parentId    TEXT                       -- self-reference for account hierarchy
  isSystem    INTEGER NOT NULL DEFAULT 0 -- system accounts cannot be deleted
  createdAt   TEXT NOT NULL
  createdBy   TEXT NOT NULL
  updatedAt   TEXT NOT NULL
  updatedBy   TEXT NOT NULL
  deletedAt   TEXT
  deletedBy   TEXT

INDEX: accounts(businessId, deletedAt)
INDEX: accounts(businessId, type)
```

### Table: `categories`

```
categories
  id          TEXT PRIMARY KEY
  businessId  TEXT NOT NULL
  name        TEXT NOT NULL
  type        TEXT NOT NULL              -- 'income' | 'expense'
  color       TEXT
  icon        TEXT
  createdAt   TEXT NOT NULL
  createdBy   TEXT NOT NULL
  updatedAt   TEXT NOT NULL
  updatedBy   TEXT NOT NULL
  deletedAt   TEXT
  deletedBy   TEXT

INDEX: categories(businessId, type, deletedAt)
```

### Table: `transactions`

```
transactions
  id              TEXT PRIMARY KEY
  businessId      TEXT NOT NULL          -- required
  locationId      TEXT NOT NULL          -- required
  salesChannelId  TEXT                   -- required for income, optional for expense
  categoryId      TEXT
  type            TEXT NOT NULL          -- 'income' | 'expense' | 'transfer'
  amount          INTEGER NOT NULL       -- cents (positive integer)
  note            TEXT
  referenceNo     TEXT
  transactionDate TEXT NOT NULL          -- ISO date string (YYYY-MM-DD)
  createdAt       TEXT NOT NULL
  createdBy       TEXT NOT NULL
  updatedAt       TEXT NOT NULL
  updatedBy       TEXT NOT NULL
  deletedAt       TEXT
  deletedBy       TEXT

INDEX: transactions(businessId, transactionDate, deletedAt)
INDEX: transactions(businessId, locationId, deletedAt)
INDEX: transactions(businessId, salesChannelId, deletedAt)
INDEX: transactions(businessId, type, deletedAt)
INDEX: transactions(categoryId)
```

### Table: `invitations`

For inviting users to a business before they have an account.

```
invitations
  id          TEXT PRIMARY KEY
  businessId  TEXT NOT NULL
  email       TEXT NOT NULL              -- invitee email
  policyKey   TEXT NOT NULL             -- role to assign on accept
  status      TEXT NOT NULL DEFAULT 'pending' -- 'pending' | 'accepted' | 'declined' | 'cancelled'
  invitedBy   TEXT NOT NULL             -- userId
  expiresAt   TEXT NOT NULL
  createdAt   TEXT NOT NULL
  updatedAt   TEXT NOT NULL

INDEX: invitations(businessId, status)
INDEX: invitations(email, status)
```

---

## 6. Folder Structure

Aligned with duitgee-app patterns:

```
src/
├── routes/
│   ├── (public)/                        # No auth required
│   │   └── login/
│   │       └── +page.svelte
│   ├── (app)/                           # Requires auth
│   │   ├── +layout.svelte               # App shell (nav, sidebar)
│   │   ├── +layout.server.ts            # Load user + businesses
│   │   ├── businesses/
│   │   │   ├── +page.svelte             # Business list / create
│   │   │   └── [businessId]/
│   │   │       ├── +layout.svelte       # Business context
│   │   │       ├── +layout.server.ts    # Load business + user role
│   │   │       ├── +page.svelte         # Business dashboard
│   │   │       ├── locations/
│   │   │       ├── channels/
│   │   │       ├── accounts/
│   │   │       ├── categories/
│   │   │       └── transactions/
│   └── api/
│       └── [...path]/
│           └── +server.ts               # Hono catch-all
│
├── lib/
│   ├── server/
│   │   ├── auth/
│   │   │   ├── firebase-verifier.ts     # jose JWKS verification (keep, refactor)
│   │   │   └── user-manager.ts          # UPSERT user on first login (keep, simplify)
│   │   ├── hooks/
│   │   │   ├── setupServicesHandler.ts  # Token verify → user resolve → locals
│   │   │   └── checkSessionHandler.ts   # Route protection guard
│   │   ├── db/
│   │   │   ├── schema.ts                # Full Drizzle schema
│   │   │   └── index.ts                 # DB instance helper (optional)
│   │   ├── api/
│   │   │   ├── index.ts                 # Hono root router + auth middleware
│   │   │   ├── businesses/
│   │   │   │   ├── businesses-api.ts
│   │   │   │   ├── getBusinessesHandler.ts
│   │   │   │   ├── createBusinessHandler.ts
│   │   │   │   ├── updateBusinessHandler.ts
│   │   │   │   └── deleteBusinessHandler.ts
│   │   │   ├── locations/
│   │   │   ├── channels/
│   │   │   ├── accounts/
│   │   │   ├── categories/
│   │   │   ├── transactions/
│   │   │   └── invitations/
│   │   └── utils/
│   │       └── businessPermissions.ts   # RBAC helpers (mirrors vaultPermissions.ts)
│   │
│   ├── configurations/
│   │   └── policies.ts                  # Hardcoded permission → policy map
│   │
│   ├── schemas/                         # Valibot validation schemas per feature
│   │   ├── business.ts
│   │   ├── location.ts
│   │   ├── transaction.ts
│   │   └── ...
│   │
│   ├── client/
│   │   └── firebase.ts                  # Firebase client init (rename from config/)
│   │
│   └── stores/
│       └── auth.svelte.ts               # Svelte 5 runes auth store
│
├── hooks.server.ts                      # sequence(setup, checkSession)
├── hooks.client.ts                      # Firebase onAuthStateChanged init
└── app.d.ts                             # Locals, Platform, Api types
```

---

## 7. Authorization Guard Design

### Policy Definitions (hardcoded in `src/lib/configurations/policies.ts`)

```
Permissions:
  transaction:create | transaction:edit | transaction:delete | transaction:view
  account:manage | category:manage | business:manage | user:invite

Policy → Permissions mapping:
  owner   → ALL permissions
  manager → transaction:* + account:manage + category:manage + user:invite
             (NOT business:manage — cannot delete/rename business)
  cashier → transaction:create + transaction:view
  viewer  → transaction:view only
```

### Business Permission Helpers (`src/lib/server/utils/businessPermissions.ts`)

Mirrors `vaultPermissions.ts` from reference:

```
getUserBusinessRole(userId, businessId, env)
  → SELECT policyKey FROM user_business_roles WHERE userId + businessId
  → Returns PolicyKey | null

getBusinessPermissions(policyKey)
  → Looks up POLICIES[policyKey] in-code
  → Returns Permission[]

checkBusinessPermission(userId, businessId, permission, env)
  → getUserBusinessRole → getBusinessPermissions → includes check
  → Returns boolean

requireBusinessPermission(user, businessId, permission, env)
  → checkBusinessPermission → throws 403 if false
```

### Authorization Flow in Handlers

```
1. Token verified → user resolved (in Hono middleware)
2. Handler receives: (user, validatedBody, env)
3. Handler calls: requireBusinessPermission(user, businessId, 'transaction:create', env)
4. If passes: execute DB operation
5. If fails: return 403
```

### Owner Fast Path

Owner is NOT a special-cased bypass. The `owner` policy simply includes ALL permissions in the hardcoded map. This makes it consistent and auditable. If you need to add a permission later, add it to the `owner` policy.

### Middleware Attachment in Hono

The Hono API middleware only handles token verification and user resolution. Permission checks happen **inside each handler** — this matches the reference project's pattern of calling `requireVaultPermission` inside the handler body.

---

## 8. Performance Considerations (D1 + Workers)

**JWKS Caching**
Firebase's JWKS endpoint (`googleapis.com/oauth2/v3/certs`) has a TTL. `jose`'s `createRemoteJWKSet` caches the JWKS in-memory. In Workers, this cache is per-isolate and may not persist across cold starts. Consider:
- Accept the overhead of occasional JWKS refetch (typically < 200ms, cached at CDN level)
- Alternatively, cache JWKS in a KV binding with TTL aligned to Firebase's cache-control header

**Role Query per Protected Request**
Every API call that checks permissions requires one DB query to `user_business_roles`. This is unavoidable but is a single indexed lookup — negligible overhead on D1.

**Indexes Strategy**
All foreign key columns indexed. Compound indexes include `deletedAt` to make soft-delete filtering efficient. The `(userId, businessId)` unique index on `user_business_roles` doubles as the lookup index.

**D1 Limitations**
- No true transactions → use `db.batch()` for atomicity (matches reference project pattern)
- D1 has 10ms CPU time limit per query; keep queries simple
- Avoid `SELECT *` — always select specific columns in production handlers

**Stateless Auth Performance**
Verifying a JWT is pure cryptography (no DB call). This is faster than a session cookie lookup against AUTH_DB on every request — a net improvement over the reference project's approach.

**Cold Start**
Workers cold starts are ~5ms. Firebase JWKS fetch (if cache miss) adds ~200ms. JWKS refresh typically happens every 6 hours per Firebase's cache headers — acceptable.

**Transaction Listing**
Transactions will grow over time. The compound index on `(businessId, transactionDate, deletedAt)` ensures paginated listing remains O(log n). Always apply cursor-based pagination (not offset) for large datasets.

---

## 9. Edge Cases

**1. Concurrent First Login (Race Condition)**
Two simultaneous requests from a new user both hit the UPSERT. Resolved by using `INSERT OR REPLACE` / `onConflictDoUpdate` in Drizzle — idempotent.

**2. Token Expiry Mid-Session**
Firebase tokens expire in 1 hour. Client SDK auto-refreshes. Backend must return `401` clearly so client can trigger `getIdToken(true)` and retry. Add `WWW-Authenticate: Bearer error="invalid_token"` header to 401 responses.

**3. Last Owner Removal**
If the last owner leaves or is removed from a business, the business becomes ownerless. Guard: `requireBusinessPermission` + check `count(*) FROM user_business_roles WHERE businessId + policyKey = 'owner' > 1` before allowing owner removal/role change.

**4. Business Soft Delete Cascade**
D1 does not cascade soft deletes. When a business is soft-deleted, application code must also soft-delete: locations, sales_channels, accounts, categories, transactions. Use a `db.batch()` call with all the update statements.

**5. `salesChannelId` Validation**
Income transactions MUST have a `salesChannelId`. Expense transactions MAY be null. This is application-level validation in the Valibot schema + handler — not a DB constraint.

**6. Integer Overflow for Amounts**
SQLite INTEGER is 64-bit signed. Max value ~9.2 × 10^18 cents — effectively unlimited. No overflow risk.

**7. Invitation to Non-Existing User**
Invitations stored by email. When the invitee first logs in with Google, check for pending invitations by email and auto-apply the role. This requires a post-login step in `user-manager.ts`.

**8. Role Downgrade of Owner**
A manager cannot downgrade an owner (they lack `business:manage`). Only an owner can change roles. The `requireBusinessPermission` guard handles this correctly if enforced on role-change endpoints.

**9. Deleted Location Still Referenced**
Transactions reference `locationId`. If a location is soft-deleted, existing transactions retain the reference — this is correct and intentional (historical data integrity). UI must handle displaying deleted-location names gracefully (e.g., "Archived Location").

**10. Currency Consistency**
`currency` is set at business level. All transaction amounts are in that currency. No multi-currency within a single business. Enforce this in handler validation.

**11. Anonymous Auth Removal**
The existing codebase supports anonymous login. Per requirements, remove this. Delete anonymous provider from Firebase console and remove from client code.

---

## 10. Step-by-Step Build Roadmap

### Phase 1 — Foundation Cleanup & Auth Redesign

- [ ] Remove `sessions` table and `session.ts` from `src/lib/server/auth/`
- [ ] Refactor `firebase-verifier.ts` to a pure `verifyFirebaseToken(token) → FirebaseUser | null` utility using jose
- [ ] Refactor `user-manager.ts` to a pure `upsertUser(firebaseUser, db) → User` function
- [ ] Remove anonymous login from `src/routes/login/+page.svelte` and `auth.svelte.ts`
- [ ] Update `app.d.ts`: define `Locals { user: App.User | null }`, `Api { Bindings, Variables: { currentUser } }`

### Phase 2 — Hook Layer

- [ ] Create `src/lib/server/hooks/setupServicesHandler.ts` — token extract → verify → upsert → set locals
- [ ] Create `src/lib/server/hooks/checkSessionHandler.ts` — public path list + redirect logic
- [ ] Rewrite `src/hooks.server.ts` to `sequence(setupServicesHandler, checkSessionHandler)`
- [ ] Simplify `src/hooks.client.ts` — remove session-creation logic, keep auth store init only

### Phase 3 — Database Schema

- [ ] Redesign `src/lib/server/db/schema.ts` with full domain model (all 8 tables)
- [ ] migration will be done manually by the developer

### Phase 4 — Policies & RBAC Utilities

- [ ] Create `src/lib/configurations/policies.ts` with `POLICIES` map and `Permission` / `PolicyKey` types
- [ ] Create `src/lib/server/utils/businessPermissions.ts` with `getUserBusinessRole`, `checkBusinessPermission`, `requireBusinessPermission`

### Phase 5 — Hono API Router Setup

- [ ] Install Hono: `pnpm add hono`
- [ ] Create `src/lib/server/api/index.ts` — Hono root router with Firebase auth middleware
- [ ] Create `src/routes/api/[...path]/+server.ts` — catch-all delegating to Hono

### Phase 6 — Business API

- [ ] Create Valibot schemas: `src/lib/schemas/business.ts`
- [ ] Implement handlers: `getBusinesses`, `createBusiness`, `updateBusiness`, `deleteBusiness`
- [ ] Create `businesses-api.ts` Hono sub-router and register in root router

### Phase 7 — User Business Role API

- [ ] Handlers: `inviteUser`, `updateUserRole`, `removeUser`, `listMembers`
- [ ] Invitation flow: store to `invitations` table, check pending invitations on user first login
- [ ] Register in root router

### Phase 8 — Location API

- [ ] Valibot schemas for location
- [ ] Handlers: `getLocations`, `createLocation`, `updateLocation`, `deleteLocation`
- [ ] Guard: `requireBusinessPermission(..., 'business:manage', ...)`

### Phase 9 — Sales Channel API

- [ ] Valibot schemas for sales channel
- [ ] Handlers: `getSalesChannels`, `createSalesChannel`, `updateSalesChannel`, `deleteSalesChannel`
- [ ] Same permission guard as locations

### Phase 10 — Account (Chart of Accounts) API

- [ ] Valibot schemas for account
- [ ] Handlers: `getAccounts`, `createAccount`, `updateAccount`, `deleteAccount`
- [ ] Guard: `requireBusinessPermission(..., 'account:manage', ...)`
- [ ] Prevent delete of system accounts (`isSystem = true`)

### Phase 11 — Category API

- [ ] Valibot schemas for category
- [ ] Handlers: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
- [ ] Guard: `requireBusinessPermission(..., 'category:manage', ...)`

### Phase 12 — Transaction API

- [ ] Valibot schemas for transaction (income vs expense type validation)
- [ ] Handlers: `getTransactions` (paginated + filterable), `getTransaction`, `createTransaction`, `updateTransaction`, `deleteTransaction`
- [ ] Guards: `transaction:create`, `transaction:edit`, `transaction:delete`, `transaction:view`
- [ ] Enforce `salesChannelId` required for income type at schema validation level

### Phase 13 — UI Implementation

- [ ] Simplify `/login` to Google sign-in only
- [ ] Business selection page (post-login landing)
- [ ] Business creation form
- [ ] Location management UI
- [ ] Sales channel management UI
- [ ] Account management UI
- [ ] Category management UI
- [ ] Transaction list + create form (core feature)

### Phase 14 — Wrangler & Production Config

- [ ] Update `wrangler.jsonc`: single D1 binding `DB`, no `AUTH_DB` needed
- [ ] Set Firebase project vars as Cloudflare Workers secrets
- [ ] Configure production environment block in `wrangler.jsonc`
- [ ] End-to-end test with `pnpm preview`
