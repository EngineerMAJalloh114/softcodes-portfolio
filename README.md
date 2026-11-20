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


## Auth — T3

Better Auth (DEC-18), self-managed on Neon via Drizzle. Endpoints live under `/api/auth/*`.
The pages are `/auth/sign-in`, `/auth/change-password`, `/auth/setup-mfa`, `/auth/forgot-password`
and `/auth/reset-password`. Every `/admin` page calls `requireAdmin()` (`src/lib/auth/guard.ts`), which checks four things in order:
signed in → owner/admin role → temporary password replaced → TOTP MFA on.

```bash
npm run auth:create-owner             # owner account (DEC-34), prints a one-time temporary password
npm run auth:create-owner -- --reset  # issue a new temporary password + sign out everywhere
npm run auth:verify                   # end-to-end auth checks against APP_URL (see the script header)
```

- **Env:** `BETTER_AUTH_SECRET` (required) and `BETTER_AUTH_URL` (the site origin). See `.env.example`.
- **Email:** `src/lib/email` is an adapter interface. Development logs reset links to the server log. Production returns
  `EMAIL_NOT_CONFIGURED` until a Resend adapter is added (DEC-35).
- **Rate limits** are stored in Postgres (`rate_limits`). The **audit log** records every sign-in/out, MFA and password event.

## Admin shell — T4

`/admin` uses its own layout: a sidebar, plus a top bar with the user, theme toggle and sign-out. The sidebar collapses into a drawer on mobile.
The public pages live in the `(site)` route group, so the URLs are unchanged.

- **RBAC:** `src/lib/auth/permissions.ts` is the single owner/admin/staff/client matrix (deny by default).
  `requirePermission()` (`src/lib/auth/guard.ts`) runs on every admin page, the layout and every server action.
  It requires sign-in, an admin-capable role, a replaced temporary password and MFA, then answers 403 if the role lacks the permission.
- **Pages:** the dashboard (G-01), audit log viewer (G-19) and settings (G-20, owner only, Zod-validated, every save audited).
  Content, Projects, Pricing, Leads and Media were placeholders until T5–T7 (Leads arrives in T7).

```bash
npm test               # unit tests: RBAC matrix, settings validation, audit filters (no DB)
npm run admin:verify   # integration: per-role access over HTTP, settings save + audit, audit filters
npx tsx scripts/screenshots-admin.ts   # admin screenshots → docs/screenshots/admin-*
```

## Content management + media — T5

The public site reads its content from the database. `src/content/site.ts` is only the seed source, plus the fallback for builds with no database (CI).

- **Editing:** use Admin → **Content** (every section, plus the Services and Stack lists), **Projects** and **Media**.
  - Each section and collection is described once, in `src/lib/content/defs.ts`. That spec drives both the form and its Zod validation.
  - Contact email, WhatsApp and location come from Settings.
- **Drafts:** **Save draft** keeps a change private. **Preview draft** opens the page with drafts shown (Next Draft Mode, content editors only). **Publish** makes it live.
- **Going live:** published content is cached (tag `content`). Every save calls `updateTag("content")`, so the next request shows the change with no redeploy. Pages also revalidate hourly as a safety net.
- **Media (Neon object storage):**
  - Images (JPEG/PNG/WebP/GIF/AVIF, ≤ 5 MB) go to the public bucket by default; PDFs (≤ 15 MB) go to the private one.
  - Files are type-checked by their bytes; SVG is refused.
  - Content refers to a file as `media:<id>`. Replacing a file keeps the id, and a file that's still in use can't be deleted.
- **Access:** `content.write` and `media.manage` (owner, admin). Every change writes an audit row.

```bash
npm run content:verify   # end-to-end: denial, draft/preview/publish live, upload → project, audit (see script header)
npx tsx --conditions=react-server scripts/screenshots-t5.ts   # admin screenshots → docs/screenshots/admin-t5-*
```

## Pricing, FAQs, About + WhatsApp links — T6

- **WhatsApp (DEC-37):** every WhatsApp link is built from the number in Admin → **Settings** by one helper, `src/lib/content/whatsapp.ts`. That covers the hero button, the nav “Hire me” button, the contact card and the footer. Typing a `wa.me` link into a content field is refused. Hero buttons have a link type: **WhatsApp** (uses the Settings number), **URL** or **anchor**. Saving Settings updates the live site straight away.
- **Pricing:** `/pricing` lists the published packages. Admin → **Pricing** edits each package: name, summary, included items, a 'from' price in USD and SLE (stored in minor units), a unit such as `/month`, Popular, order, draft or published. The DEC-38 prices are seeded as published. Each card has **Request a quote**, which goes to `/contact?package=<id>` (the wizard comes in R2), and **Book a call**, a placeholder until Cal.com arrives in T7. The home page shows a teaser. The USD/SLE choice is remembered per visitor and applied before the page paints.
- **FAQs:** `/faq` shows published FAQs as an accordion with FAQPage structured data. Edit them in Admin → Content → **FAQs**. The 8 seeded FAQs are drafts: they stay hidden until the owner approves the copy and publishes them (DEC-21). **Preview draft** shows them first.
- **About:** `/about` has the full About section (interim layout, TODO(DEC-30)). The home page keeps a short version with “More about me”.
- **Access:** `content.write`, which only owner and admin have. Staff get Dashboard and Leads (DEC-36). Every change is validated and audited.

```bash
npm run t6:verify   # end-to-end: denial, package/FAQ create → draft hidden → publish → live, JSON-LD, WhatsApp number change, currency toggle, audit
npx tsx --conditions=react-server scripts/screenshots-t6.ts   # → docs/screenshots/t6-*
```

## Leads, WhatsApp button, CV — T7a

T7 is split (DEC-40). T7a needs no external accounts. T7b adds the Cal.com embed, Resend email and the owner's CV file once those are supplied.

- **Quote form (M-03):** `/contact` and the home contact section post to a server action (`src/app/(site)/contact/actions.ts`) instead of opening the email app.
  - Fields: name, email, phone/WhatsApp, company, project type, budget range in USD or SLE, deadline, details, and how they found us (J-04).
  - Project types are the published pricing packages plus "Other". "Request a quote" on `/pricing` pre-selects its package.
  - Validated with Zod (`src/lib/leads/schema.ts`) and stored in `leads`. The visitor gets a reference number, e.g. `SC-LEAD-2026-0001`, from an atomic per-year counter.
  - The form labels are editable in Admin → Content → Contact section.
- **Spam protection (K-14):** no third-party captcha.
  - A hidden honeypot field.
  - A minimum fill time of 3 s (the form records when it was opened).
  - At most 3 accepted requests per IP per 10 minutes, counted in the shared `rate_limits` table.
- **Leads inbox:** Admin → **Leads**. Owner, admin and staff have `leads.read` and `leads.write`; clients are refused.
  - The list has status counts, a status filter and search (name, email, company or reference).
  - The detail view shows every field, status buttons (new, contacted, quoted, won, lost, spam), internal notes and a history.
  - Status changes and notes are audited.
  - The dashboard's **New leads** count links to the inbox.
- **Owner notifications:** each lead stores a row in `notifications` and goes through the email adapter (`src/lib/email`).
  - With no provider configured, nothing is sent (`email = not_configured`). In development the message is printed to the server log.
  - Unread notifications show as a badge on **Leads**. Opening the lead marks them read.
  - Resend in T7b is an adapter swap.
- **Floating WhatsApp button (M-06):** on every public page, never in the admin. It uses the Settings number (DEC-37) and can be switched off in Settings → Public site.
- **CV (M-04):** upload a PDF in Media with visibility **Public**, then choose it in Settings → **CV file**.
  - "Download CV" then appears in the hero and on About. It is hidden when no CV is set.
  - A file set as the CV can't be deleted.

```bash
npm run t7a:verify   # end-to-end: form → lead + reference, invalid/honeypot/too-fast/rate limit, inbox + permissions, status/notes audited, WhatsApp button, CV
npx tsx --conditions=react-server scripts/screenshots-t7a.ts   # → docs/screenshots/t7a-*
```

## Blog — R1b Part 1

R1b runs before T7b and T8 (DEC-41).

- **Writing posts:** Admin → **Blog** (owner and admin, `content.write`).
  - A post has: title, slug, excerpt, cover image (from Media), category, tags, article, SEO title and description, publish date, featured, and draft/published.
  - Categories are under Blog → **Categories**.
  - The editor (Tiptap) has headings, bold/italic, lists, links, images from Media, code blocks and quotes.
- **Storage and safety (DEC-42):** the article is stored as JSON. `src/lib/blog/richtext.ts` cleans it against an allowlist when a post is saved, and again before the page renders it.
  - Scripts, iframes, event handlers (`onerror`…), unknown attributes and `javascript:`/`data:` links are removed.
  - Images must come from the media library.
  - The renderer (`src/components/blog/RichText.tsx`) builds React elements and never injects HTML.
- **Public pages:**
  - `/blog`: featured posts first, then newest; filter by category (`?category=`, plain links, works without JS); 9 per page.
  - `/blog/<slug>`: reading time, cover image and related posts.
  - The home page shows "Latest posts" only when at least one post is published, and the nav has a Blog link.
  - A post with a future publish date stays hidden until that day. An empty date becomes today when you publish.
- **SEO:** each post has its own title, description and social image (its cover), plus `BlogPosting` structured data. The sitemap and the RSS feed (`/blog/rss.xml`) list published posts only.
- **Seed:** one draft, "Welcome to the Soft CODES blog", for the owner to rewrite and publish (DEC-21). Nothing is published.

```bash
npm run r1b-blog:verify   # end-to-end: permissions, editor → draft hidden → publish → live/RSS/sitemap/home, sanitiser (action + tampered DB), scheduled post, audit
npx tsx --conditions=react-server scripts/screenshots-r1b-blog.ts   # → docs/screenshots/r1b-blog-*
```

## Testimonials, project filters, newsletter — R1b Part 2

- **Testimonials (A-16):** Admin → Content → **Testimonials** (owner and admin).
  - Fields: quote, name, role, company, photo (from Media), linked project, optional rating, draft/published.
  - Published quotes appear in a "What clients say" section on the home page, and on the linked project's case study. Both are hidden when there are none.
  - The rating shows as stars only. There is no Review/rating structured data (DEC-44).
  - No testimonials are seeded: real quotes only.
- **Project filters (M-11):** `/projects?type=app&tag=Payments`.
  - Filters are plain links, so they work without JavaScript.
  - Only types and topics in use are offered, and unknown values are ignored.
  - When nothing matches, an empty state with the koala mascot is shown.
- **Newsletter (M-13):** a signup form in the footer and on the blog: email plus a consent checkbox.
  - Spam protection: honeypot, minimum fill time, at most 5 signups per IP per 10 minutes.
  - Signups are stored as **pending**, with the consent time and the exact consent wording (DEC-43). Once Resend is set up (T7b), each gets a double opt-in email, and only **confirmed** subscribers receive newsletters.
  - A duplicate address gets the same answer as a new one, so the form can't be used to check who's subscribed.
  - Admin → **Subscribers** (owner and admin, `subscribers.manage`) lists subscribers with a status filter and a CSV export. The export is safe against spreadsheet formula injection, and every export is audited.
  - Each subscriber has an unsubscribe token. `/newsletter/unsubscribe?token=…` needs a button press, so link scanners can't unsubscribe people.

```bash
npm run r1b-growth:verify   # testimonials publish/hide, filters + no-JS, signup pending, duplicates, spam, unsubscribe, CSV export audited, permissions
npx tsx --conditions=react-server scripts/screenshots-r1b-growth.ts   # → docs/screenshots/r1b-growth-*
```
