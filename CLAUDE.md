# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application configured to deploy on Cloudflare Workers with the following stack:
- **Frontend**: SvelteKit 2.x with Svelte 5
- **Styling**: Tailwind CSS 4.x
- **Database**: LibSQL (SQLite) via Drizzle ORM
- **Deployment**: Cloudflare Workers via Wrangler
- **Package Manager**: pnpm

**IMPORTANT:** Before working on anything, fetch the relevant llms.txt:

- Shadcn/ui: https://www.shadcn-svelte.com/llms.txt
- Tailwind CSS: https://tailwindcss.com/llms.txt
- svelte: https://svelte.dev/llms.txt
- Svelte documentation for use with medium context windows - https://svelte.dev/llms-medium.txt
- drizzle - https://orm.drizzle.team/llms-full.txt
- Cloudflare d1 - https://developers.cloudflare.com/d1/llms.txt
- Cloudflare workers - https://developers.cloudflare.com/workers/llms-full.txt

When working on styling tasks, read the Tailwind docs first.
When working on components, read the component library docs first.

## Development Commands

### Running the Application
```bash
pnpm dev                # Start development server (Vite)
pnpm preview           # Build and preview with Wrangler
```

### Building
```bash
pnpm build             # Build for production
pnpm check             # Type-check with svelte-check
pnpm check:watch       # Type-check in watch mode
```

### Database Operations
```bash
pnpm db:push           # Push schema changes to database
pnpm db:generate       # Generate migration files
pnpm db:migrate        # Run migrations
pnpm db:studio         # Open Drizzle Studio for database management
```

### Deployment
```bash
pnpm deploy            # Build and deploy to Cloudflare Workers
```

### Type Generation
```bash
pnpm types             # Generate Cloudflare Workers types
pnpm cf-typegen        # Generate types to src/worker-configuration.d.ts
```

## Architecture

### Database Layer
- **ORM**: Drizzle ORM with LibSQL client
- **Schema**: Defined in `src/lib/server/db/schema.ts`
- **Database Instance**: Exported from `src/lib/server/db/index.ts`
- **Configuration**: `drizzle.config.ts` points to the schema file
- **Connection**: Requires `DATABASE_URL` environment variable (see `.env.example`)

### SvelteKit Structure
- **Adapter**: Cloudflare adapter configured in `svelte.config.js`
- **Routes**: Standard SvelteKit file-based routing in `src/routes/`
- **Server Code**: Server-only code in `src/lib/server/`
- **Type Definitions**: Platform types in `src/app.d.ts` (defines Cloudflare Workers platform interface)

### Cloudflare Workers Configuration
- **Config File**: `wrangler.jsonc`
- **Entry Point**: `.svelte-kit/cloudflare/_worker.js` (generated on build)
- **Assets Binding**: ASSETS binding configured for static files
- **Compatibility**: Uses `nodejs_als` flag for Node.js AsyncLocalStorage support
- **Platform Access**: Available via `event.platform` in SvelteKit endpoints with types:
  - `env`: Environment bindings
  - `ctx`: ExecutionContext
  - `cf`: Cloudflare request properties
  - `caches`: CacheStorage

### Environment Variables
- Local development uses `.env` file (not committed)
- Copy `.env.example` to `.env` for local setup
- Production uses Cloudflare Workers secrets (set via `wrangler secret put`)
- Database URL format: `file:local.db` for local SQLite

### Build Output
- Build artifacts go to `.svelte-kit/cloudflare/`
- Worker script generated at `.svelte-kit/cloudflare/_worker.js`
- Do not commit `.svelte-kit/`, `.wrangler/`, or `/build` directories

### Organizations & Subscriptions
- **Organizations** are the parent entity for businesses and the billing anchor
- Every business belongs to an organization (`businesses.organizationId`)
- When a user creates their first business, a personal organization is auto-created
- **Subscriptions** are tied to organizations via the `subscriptions` table
- Plan definitions are hardcoded in `src/lib/configurations/plans.ts` (same pattern as `policies.ts`)
- Plan tiers: `free` (default) and `pro` — extensible by adding to `PlanKey` union and `PLANS` record
- No subscription row or no active subscription = free plan
- **Constants**: Use `PLAN_KEY`, `SUBSCRIPTION_STATUS`, and `ORG_ROLE` from `plans.ts` — never use magic strings for these values
- **Feature gating**: `requireBusinessPermission()` in `businessPermissions.ts` automatically checks plan features for gated permissions (e.g. `attachment:upload` requires pro plan)
- `PLAN_GATED_PERMISSIONS` set is auto-derived from plan feature lists — adding a permission to a plan's `features` array automatically gates it
- Organization CRUD: `src/lib/server/api/organizations/`
- Frontend pages: `/organizations` (list) and `/organizations/:id` (detail with plan info)
- Subscription management is currently manual (direct DB insert) — no payment gateway yet

### RBAC & Permissions
- **Business roles**: `PolicyKey` (`owner` | `manager` | `cashier` | `viewer`) defined in `src/lib/configurations/policies.ts`
- **Organization roles**: `OrgMemberRole` (`owner` | `admin` | `member`) defined in `src/lib/configurations/plans.ts`
- Permission check: `requireBusinessPermission(user, businessId, permission, env)` checks both role permission AND plan feature
- Plan feature check: business → organization → subscription → plan → features

## Important Notes

- The project uses **Svelte 5** syntax and features
- TypeScript is configured with strict mode enabled
- Database client expects `DATABASE_URL` environment variable to be set
- Wrangler types are auto-generated and should not be manually edited
- The platform interface in `app.d.ts` has duplicate `Platform` definitions that should be consolidated if causing issues
