# Igbo Wikimedians User Group — Community Site

A single-project web app for the Igbo Wikimedians User Group: one Express server serves the REST API under `/api` and the built React client, backed by MySQL (Drizzle ORM) with an optional Redis read cache.

## Run & Operate

- `npm install` — install dependencies
- `npm run dev` — API server (port 5000) + Vite dev server (port 5173) concurrently
- `npm run dev:server` — API server only (`tsx watch src/server/index.ts`)
- `npm run dev:client` — Vite frontend only
- `npm run typecheck` — full TypeScript check (`tsc --noEmit`)
- `npm run build` — typecheck + build client (`vite build` → `dist/public`) + bundle server (`esbuild` → `dist/index.mjs`)
- `npm run start` — run the production server (serves the API and `dist/public`)
- `npm run codegen` — regenerate Orval API client + Zod schemas from `openapi.yaml`
- `npm run db:push` / `npm run db:push:force` — push Drizzle schema to MySQL (dev only)
- Required env: `DATABASE_URL` — MySQL connection string (`mysql://user:pass@host:3306/db`)
- Optional env: `REDIS_URL` — enables the read cache (site works without it)

## Stack

- npm single-project, Node.js 24, TypeScript 5.9
- API: Express 5 (serves `/api` and the built client)
- DB: MySQL + Drizzle ORM (mysql2 driver, `mode: "default"`)
- Read cache: Redis via `ioredis`, with graceful fallback when Redis is off
- Auth: self-hosted — email + verified Wikimedia username (scrypt password hashing, server-side sessions in MySQL), plus optional Google and Wikimedia (MediaWiki) OAuth 2.0
- Validation: Zod 3 (`zod` + `drizzle-zod`), generated from the OpenAPI spec
- API codegen: Orval (from `openapi.yaml`)
- Client: React 19 + Vite 7, wouter, TanStack Query, shadcn/ui (Tailwind 4)
- Build: esbuild (ESM server bundle) + `vite build` for the client

## Where things live

- `src/server` — Express app, routes, middlewares, seed logic
  - `routes/igbo-community.ts` — the CMS / membership / Wikimedia-stats API
  - `routes/auth.ts` — registration, login, sessions, Wikimedia username lookup, OAuth callbacks
  - `routes/gallery.ts`, `lib/commons.ts` — curated Wikimedia Commons gallery categories and media
  - `routes/dictionary.ts`, `lib/dictionary.ts` — Igbo dictionary search (Igbo API, Wiktionary fallback)
  - `lib/session.ts`, `lib/passwords.ts`, `lib/wikimedia.ts`, `lib/oauth.ts` — auth internals
  - `middlewares/auth.ts` — `attachUser`, `requireUser`, `requireAdmin`
  - `lib/cache.ts` — Redis cache helpers + cache keys/TTLs
  - `lib/seedCommunity.ts` — first-run seed for pages and membership tiers
- `src/client` — React app (imported via `@/` alias)
  - `App.tsx` — routes, pages (including the gallery, dictionary and public contributors directory), nav/footer
  - `site.css` — bespoke site styles
- `lib/db` — Drizzle schema + MySQL client (aliases `@workspace/db`, `@workspace/db/schema`)
- `lib/api-zod` — Zod request/response schemas (alias `@workspace/api-zod`)
- `lib/api-client-react` — generated API client hooks (alias `@workspace/api-client-react`)
- `openapi.yaml` — source of truth for the API contract (edit → `npm run codegen`)
- `drizzle.config.ts` — Drizzle CLI config (schema → MySQL)
- `build.mjs` — esbuild server bundle script
- `public/logo.svg`, `public/favicon.svg` — group logo (Blossom Ozurumba, CC BY-SA 4.0)

## Architecture decisions

- **One service, not a monorepo.** The Express app serves `/api` and the built SPA from the same origin, so there are no CORS or cookie-split problems. Development still uses Vite (5173) with a proxy to the API (5000).
- **MySQL, not Postgres.** MySQL has no `RETURNING` and TEXT defaults are not allowed, so all writes are insert/update-then-select and Drizzle `onConflictDoNothing` was replaced with pre-check-then-insert logic. Text-heavy columns are `varchar`, keys are `varchar` (never `text`).
- **Redis is an optional accelerator.** If `REDIS_URL` is unset or Redis is unreachable, cache helpers become no-ops and reads fall through to MySQL. Writes invalidate the relevant keys via `cacheDel`.
- **Admin checks are env-driven.** A user is an admin when their email is in `IWUG_ADMIN_EMAILS` or their Wikimedia username is in `IWUG_ADMIN_WIKIMEDIA_USERNAMES`. Roles are resolved at request time, so changing the env list takes effect on the next request.
- **Self-hosted auth.** Registration requires a real Wikimedia username (verified live via the MediaWiki `globalalluserinfo` API; at least 1 edit). Passwords are hashed with Node's built-in `crypto.scrypt`. Sessions are opaque tokens in an httpOnly cookie, stored in the `sessions` table. Google and Wikimedia OAuth become available only when their client credentials are configured.
- **Orval codegen kept.** The API contract stays in `openapi.yaml`; Zod schemas and typed React hooks are regenerated (`npm run codegen`) and imported via workspace aliases.
- **Public contributors are consent-gated.** Only members with `shareWikiStats` appear on `/community`; usernames and per-project counts are fetched live from the Wikimedia APIs and cached briefly.

## Product

Users can browse community pages and events, view membership tiers and community stats, browse the public contributors directory (`/community`), explore a curated Wikimedia Commons gallery (`/gallery`), search an Igbo dictionary (`/dictionary`, Igbo API with Wiktionary fallback), and sign in (email + verified Wikimedia username, or Google/Wikimedia OAuth) to register membership and see their own Wikimedia contribution stats. Site administrators (env-configured) manage pages, events, tiers, members, and site settings.

## User preferences

- Keep the OpenAPI + Orval codegen flow.
- Redis caches reads and must degrade gracefully when unavailable.
- Single project: Express serves both the API and the React frontend.
- Drizzle ORM with the MySQL dialect / mysql2 driver.
- **Use npm, not pnpm**, for this project.
- Present the public member wiki-activity directory (usernames + per-project counts) for members who consent.

## Gotchas

- **MySQL has no `RETURNING`.** Never reintroduce `.returning()` — write then re-`select`.
- **MySQL TEXT can't have defaults** and **keys can't be TEXT** — use `varchar` (≤191 for indexed keys under utf8mb4).
- **Redis degradation is deliberate.** Don't let a Redis outage take the site down.
- `import.meta.dirname` requires Node ≥ 20.11 (bundles run on Node 24).
- Static SPA fallback only activates when `dist/public` exists (i.e., after `npm run build`); in dev, Vite serves the client.
- Wikimedia stats calls fail soft (`available: false`) if the network/API is unreachable.

## Pointers

- Path aliases are defined in three places and must stay in sync: `tsconfig.json`, `vite.config.ts`, and the esbuild `tsconfig` in `build.mjs`.
- The generated files under `lib/api-zod/src/generated` and `lib/api-client-react/src/generated` are outputs of `npm run codegen` — prefer editing `openapi.yaml` over editing them by hand.
- `.env.example` lists every environment variable the code reads.
