# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application configured to deploy on Cloudflare Workers with the following stack:
- **Frontend**: SvelteKit 2.x with Svelte 5
- **Styling**: Tailwind CSS 4.x
- **Database**: LibSQL (SQLite) via Drizzle ORM
- **Deployment**: Cloudflare Workers via Wrangler
- **Package Manager**: pnpm

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

## Important Notes

- The project uses **Svelte 5** syntax and features
- TypeScript is configured with strict mode enabled
- Database client expects `DATABASE_URL` environment variable to be set
- Wrangler types are auto-generated and should not be manually edited
- The platform interface in `app.d.ts` has duplicate `Platform` definitions that should be consolidated if causing issues
