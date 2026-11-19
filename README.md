# softcodes-portfolio

Official developer website of **Mohamed Abass Jalloh** — Software Engineer · Founder of Soft CODES.

Next.js (App Router) · TypeScript · Tailwind CSS 4. Fully static, deployable to Vercel.

## Editing content

All text lives in **`src/content/site.ts`** — copy, services, projects, stack and contact details.
Search the codebase for `TODO` to find placeholders (bio, portrait, screenshots, production URL).

- Portrait: add `public/brand/me.jpg`, then set `person.photo = "/brand/me.jpg"`.
- Screenshots: add images under `public/projects/<slug>/` and set each `screenshots[].src`.
- Production URL: set `NEXT_PUBLIC_SITE_URL` in Vercel (falls back to `VERCEL_PROJECT_PRODUCTION_URL`).

## Scripts

```bash
npm run dev        # local dev server
npm run lint       # ESLint
npm run typecheck  # route types + tsc
npm run build      # production build
```

## Themes & design tokens

Light and dark themes are CSS variables in `src/app/globals.css`, switched by `data-theme` on `<html>`.
Tailwind utilities read them: `bg-bg`, `bg-surface`, `border-border`, `text-muted`, `text-text`,
`bg-btn-bg`, `text-btn-fg`. Tailwind's default colour palette is disabled, so only these tokens exist.

| Token   | Dark    | Light   |
|---------|---------|---------|
| bg      | #1A1A1A | #E0E0E0 |
| surface | #222526 | #FFFFFF |
| border  | #353A3E | #BFBFBF |
| muted   | #BFBFBF | #353A3E |
| text    | #E0E0E0 | #1A1A1A |
| btn-bg  | #E0E0E0 | #1A1A1A |
| btn-fg  | #1A1A1A | #E0E0E0 |

The theme follows the system until the visitor uses the nav toggle, which saves the choice
in `localStorage`. An inline script in `<head>` applies it before first paint, so there's no flash.
Places that can't read CSS variables (manifest, `theme-color` meta, OG image) use
`src/theme/palette.ts`. Keep it in sync with `globals.css`.

## Data (Neon) — T2

Postgres and object storage run on Neon (project `delicate-paper-51580609`, branch `production`;
DEC-32, DEC-33). Services are declared in `neon.ts`. Public pages still render from
`src/content/site.ts`. The switch to the database comes in T5.

```bash
neon env pull        # writes .env.local (git-ignored); see .env.example for the names
npm run db:generate  # create a migration after editing src/db/schema.ts
npm run db:migrate   # apply migrations in drizzle/
npm run db:seed      # import site.ts + R1a 'from' prices (idempotent)
npm run db:verify    # end-to-end checks (DB, audit log, seed, storage); APP_URL=… also checks the app
```

- **Schema:** `src/db/schema.ts` (Drizzle). Migrations are in `drizzle/`. `audit_log` is append-only, enforced by a trigger.
- **App DB client:** `src/db/index.ts` uses node-postgres with `attachDatabasePool`, which is Neon's guidance for Vercel.
- **Script DB client:** `scripts/db/client.ts` uses Neon's serverless driver over HTTPS, so scripts also work where only HTTPS egress exists.
- **Storage:** `src/lib/storage.ts` handles `upload`, `publicUrl` (bucket `public-assets`), `signedUrl` (bucket `assets`, private, max 1 h) and `remove`.
- **Behind an HTTPS proxy:** run scripts with `NODE_USE_ENV_PROXY=1` so Node's `fetch` uses `HTTPS_PROXY`.

