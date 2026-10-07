# ARANYA v2.0.0: from prototype to production

v1 was a polished frontend whose "backend" was `sleep()`, static files and
`localStorage`. v2 keeps the identity, copy and 3D storytelling, and puts a real
product underneath it.

## Highlights

**A real API.** A typed Hono service on PostgreSQL (Drizzle) with Zod validation
on every input, one error envelope, structured logs with request ids, health and
readiness probes, and an OpenAPI reference at `/docs`, all generated from the
same schemas the frontend uses.

**Security you can verify.** Argon2id passwords, 15-minute access tokens, and
rotating `httpOnly` refresh cookies with reuse detection, CSRF protection and
rate limits. Roles are enforced on the server for every admin route; a test
proves that editing `role` in browser storage grants nothing.

**Orders that hold up.** Totals are recomputed on the server, stock is
decremented in a transaction (two shoppers racing for the last unit cannot both
win), checkout is idempotent, and status changes follow a state machine with an
audit trail.

**Faster, lighter, accessible.**

|                                                       | v1           | v2           |
| ----------------------------------------------------- | ------------ | ------------ |
| JS on first load, `/` (gzip)                          | ≈ 442 KB     | 149 KB       |
| three.js on shop and admin routes                     | yes          | never        |
| Lighthouse mobile performance (home / shop / product) | 20 / 58 / 66 | 83 / 93 / 87 |
| CLS                                                   | 0.40         | ≈ 0          |
| Lighthouse accessibility                              | 85–94        | 98–100       |

**Quality gates.** 199 Vitest tests (147 server tests against real Postgres and
52 web), 22 Playwright journeys on desktop and mobile with axe-core, and a CI
pipeline that lints, typechecks, audits, tests, builds, checks the bundle
budget and runs e2e on every push.

**Straightforward deploy.** Vercel for the SPA (with an `/api` rewrite, CSP and
HSTS), a Render Blueprint for the Dockerised API, and Neon for Postgres. Every
step and variable is in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Upgrading from v1

v1 kept everything in the browser, so there is nothing to migrate. Set up the
API and database as described in the deployment guide, then run
`npm run db:migrate` and `npm run db:seed` once against the new database.

Breaking changes for anyone building on v1:

- The app lives in `web/`; the repo is an npm-workspaces monorepo.
- The built-in demo accounts are gone. Create the admin with
  `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
- Cart, wishlist, orders and reviews are server data now. Only a signed-out
  visitor's cart stays in `localStorage`, and it merges on sign-in.

## Known limitations

- The home and product pages score in the 80s on Lighthouse mobile. Client-side
  rendering is the remaining cost, and prerendering is planned.
- Password-reset emails go through a console adapter until a mail provider is wired in.
- Payments run on the simulated provider or Razorpay **test mode** only.

Full list of changes: [CHANGELOG.md](../CHANGELOG.md).
