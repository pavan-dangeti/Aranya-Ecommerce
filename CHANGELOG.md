# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [2.0.2] - 2026-10-24

### Security

- vite 8.3.3 replaces 7.3.6. Versions 7.0.0–7.3.6 and 8.3.0–8.3.2 bundle `launch-editor` releases affected by GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22 and GHSA-vfpm-58rq-9qcg.
- zod 4.6.7 fixes GHSA-mrhx-c7xc-m3w5 (memory exhaustion on oversized constrained collections).
- Root `overrides` keep a single vite and zod copy installed, so no tool falls back to a vulnerable hoisted version.

### Accessibility

- Accessible names now contain the visible text (WCAG 2.5.3): the search button is "Search products ⌘K" with `aria-keyshortcuts`, the cart and wishlist names carry their badge count exactly as shown (including "9+"), and product-card image links include the text printed on the bottle label.
- The bottle-label SVG text runs are spaced so their text content reads as words; rendering is unchanged.

### Dependencies

- Runtime: react and react-dom 19.3.1, react-router 8.4.0, @tanstack/react-query 5.104.4, three 0.186.1, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, lucide-react 1.52.0, hono 4.13.13, @hono/node-server 2.1.5, drizzle-orm 0.45.4, @scalar/hono-api-reference 0.12.13, dotenv 18.0.8.
- Tooling: @vitejs/plugin-react 6.1.1 (drops the Babel toolchain), vitest 5.0.5, @playwright/test 1.64.1, @axe-core/playwright 4.14.0, typescript-eslint 8.71.2, eslint-plugin-react-refresh 0.5.7, knip 6.41.0, prettier 3.9.10, concurrently 10.0.6, @types/node 26.6.4, @types/react and @types/react-dom 19.3.0.
- CI: actions/checkout, actions/setup-node and actions/upload-artifact v7.
- lucide-react 1.x removed brand marks, so the footer's Instagram, YouTube and LinkedIn icons are drawn inline.
- Dependabot version-update pull requests are turned off; security alerts stay on, and updates are applied and verified manually.

### Deferred upgrades

- **eslint 10:** `eslint-plugin-react-hooks` 5 only supports eslint 9 and below, so `npm ci` fails; it has to move together with the plugin upgrade below.
- **eslint-plugin-react-hooks 7:** its React Compiler rules report 21 errors in 10 files (`set-state-in-effect` 11, `purity` 8, `refs` 1, `immutability` 1). Each needs a code change, not a config tweak.
- **TypeScript 7:** `typescript-eslint` 8 requires TypeScript below 6.1, so installs fail until it adds support.

## [2.0.1] - 2026-10-08

### Security

- Device cookies are now `issuedAt.HMAC(user, password version, issuedAt)`: they expire after 180 days and are revoked by any password change or reset, instead of being a permanent per-email value.
- Sign-in attempts are counted before the password check runs, so a burst of parallel requests can no longer exceed the per-client or account-wide limit.
- Changing the password from a signed-in session is throttled per account, so a stolen session cannot be used to guess the current password.

## [2.0.0] - 2026-10-07

v2 turns the frontend prototype into a full-stack product. See
[docs/RELEASE_NOTES_v2.0.0.md](./docs/RELEASE_NOTES_v2.0.0.md) for the narrative.

### Added

- `server/`: a Hono + PostgreSQL API on Node 22 with Drizzle migrations, Zod validation on every input, pino logs with request ids, a single error envelope, OpenAPI 3.1 at `/docs`, `/api/health` and `/api/health/ready`, graceful shutdown, a CORS allow-list, security headers and body-size limits.
- Authentication with Argon2id, short-lived access tokens, rotating `httpOnly` refresh cookies with reuse detection, CSRF protection, rate limits, forgot and reset password, and an env-seeded first admin.
- Server-authoritative orders: price, shipping and total recomputation, transactional stock decrement, idempotent checkout, per-customer ownership and a validated status state machine.
- `PaymentProvider` with a simulated default and a Razorpay test-mode adapter.
- Admin APIs with server-side pagination, filtering and sorting, plus an audit log of admin actions.
- `packages/shared` (Zod schemas, types, pricing rules) and `packages/data` (deterministic seed catalogue).
- A typed API client on TanStack Query with optimistic cart and wishlist updates, guest-cart merge on sign-in, silent session restore, redirect-back after login, and cold-start handling ("Waking up the server…" with automatic retries for up to 90 s).
- Accessible dialogs: focus trap, Escape and focus return for the cart drawer, search palette, quick view, filters and admin modals.
- 207 Vitest tests (server against real Postgres, plus web units) and 22 Playwright scenarios on desktop Chromium and a mobile viewport, with axe-core checks.
- GitHub Actions CI (lint, typecheck, knip, format, audit, tests with a Postgres service, build, bundle budget, e2e) and Dependabot.
- Deployment: `vercel.json` (SPA fallback, `/api/*` rewrite, CSP, HSTS), a Render Blueprint, a multi-stage non-root Dockerfile with a health check, and `docs/DEPLOYMENT.md`.
- SEO: a generated `sitemap.xml` and `robots.txt`, `og:image`, per-route titles and descriptions, and Product JSON-LD.

### Changed

- Initial JavaScript for `/` dropped from about 442 KB to 149 KB gzip. three.js no longer loads up front on any route; scenes hydrate near the viewport when the browser is idle, render at `dpr ≤ 1.5` and pause off-screen.
- Lighthouse mobile performance rose from 20 / 58 / 66 to 83 / 93 / 87 (home / shop / product), and CLS fell from 0.40 to about 0.
- Text colours meet WCAG AA contrast throughout.
- The repository is an npm-workspaces monorepo: `web/`, `server/`, `packages/*`.

### Fixed

- Admin access no longer trusts a client-side role; `/admin` is enforced by the server.
- Order history no longer shows other customers' orders, and order lookups are scoped to their owner.
- Registered accounts, orders, reviews and admin edits persist on the server instead of in one browser.
- Deep links such as `/products/<slug>` no longer 404 on refresh.

### Removed

- The simulated backend (`src/services/api.ts`), the passwords shipped in the bundle (`demo-accounts.ts`), every `localStorage` data store except the guest cart, and the unused exports, types and dependencies reported by knip.

## [1.0.0] - 2026-09-01

- Initial frontend prototype: 3D storefront, shop, product pages, cart, checkout, auth screens and admin console on a simulated data layer.

[2.0.2]: https://github.com/pavan-dangeti/Aranya-Ecommerce/releases/tag/v2.0.2
[2.0.1]: https://github.com/pavan-dangeti/Aranya-Ecommerce/releases/tag/v2.0.1
[2.0.0]: https://github.com/pavan-dangeti/Aranya-Ecommerce/releases/tag/v2.0.0
[1.0.0]: https://github.com/pavan-dangeti/Aranya-Ecommerce/commit/7e6c0f7
