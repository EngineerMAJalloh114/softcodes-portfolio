# Soft CODES — Repository Audit vs Feature Inventory

Status: **DRAFT for owner review** · 2026-11-19 · Repo `EngineerMAJalloh114/softcodes-portfolio` @ `b290c8f` (main)

## Current repository
Next.js 16 (App Router), TypeScript, Tailwind CSS 4. Static site. Content in `src/content/site.ts`. Light/dark themes via CSS variables. Brand pack in `public/brand`. Not deployed yet. No database, auth, email, or tests beyond lint/typecheck/build. No CI on GitHub.

## Implemented (keep, do not rebuild)
| ID | Feature | Evidence |
|---|---|---|
| A-01 | Professional company website | PR #1, PR #2 |
| A-02 | Homepage | `src/app/page.tsx` |
| A-05 | Portfolio | `src/app/projects/page.tsx` |
| A-07 | Technology showcase | Home stack section |
| A-14 | Responsive layouts | `docs/screenshots/*` |
| M-01 | Light and dark themes | PR #2, `src/app/globals.css`, `src/theme/palette.ts` |
| M-02 | Hero portrait | commit `b290c8f` (awaiting owner approval) |

## Partially implemented (enhance)
| ID | Feature | Gap |
|---|---|---|
| A-03 | About page | Home section only; bio is placeholder text written by Claude |
| A-04 | Services | Service names/descriptions not owner-approved |
| A-06 | Case studies | Problem/solution text and screenshots are placeholders |
| A-10 | Contact | Form uses mailto; no server-side delivery, no spam protection |
| A-12 | SEO | Structured data, Search Console, real domain missing |
| A-13 | Accessibility | Contrast verified; automated axe scan and keyboard audit missing |
| D-09 | Company logo | Assets exist; not yet used in documents |

## Missing — everything else (198 of 205 features)
See `FEATURE-REGISTRY.md`; all marked **Planned** with a release.

## Requires architectural preparation now (R1)
1. **Content moves from `site.ts` to the database.** `site.ts` becomes the seed file. Public pages switch from fully static to cached server rendering with revalidation on admin save.
2. **One Next.js app, route groups:** `(public)`, `admin`, later `portal` (clients) and `api`. Shared auth and permission layer from day one so R2–R4 do not need restructuring.
3. **Data model provisions:** users + roles, audit log, settings, media, and money fields as integer minor units + currency (even before payments).
4. **Background jobs** abstraction (emails, PDFs, reminders) introduced in R1 with email only.
5. **CI on GitHub:** lint, typecheck, build, tests on every PR (currently none).

## Requires external services
| Service | Needed by | Decision |
|---|---|---|
| Neon Postgres | R1 | Decided |
| File storage | R1 | Cloudflare R2 (DEC-16) |
| Transactional email | R1 | Resend (DEC-17) |
| Cal.com | R1 | Decided |
| Vercel hosting + Analytics | R1 | Decided |
| Domain | R1a | Not decided (DEC-27); launch on Vercel URL |
| Error monitoring | R1a | Sentry (DEC-23) |
| Online payment provider | R3 | Open (DEC-O5) — research needed |
| Mobile money (Orange/Africell) | R3 | Open (DEC-O6) — merchant agreement needed |
| E-signature | R4 | Open (built-in recommended) |
| AI provider | R5 | Open, later |
| Malware scanning | R2 | Open, later |

## Requires business decisions
See `DECISIONS.md` → Open decisions.
