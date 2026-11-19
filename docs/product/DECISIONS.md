# Soft CODES — Decision Log

Status: **DRAFT for owner review** · 2026-11-19
Every decision is recorded here with date and the features it affects. Changes create a new entry; old entries are never edited.

## Recorded decisions
| # | Date | Decision | Affects |
|---|---|---|---|
| DEC-01 | 2026-11-18 | Site is personal (Mohamed Abass Jalloh) + Soft CODES founder brand | A-* |
| DEC-02 | 2026-11-18 | Next.js repo `softcodes-portfolio`, built with Claude Code, hosted on Vercel | All |
| DEC-03 | 2026-11-18 | Official logo: koala wordmark (line art); favicon: sleeping koala | A-01, D-09 |
| DEC-04 | 2026-11-18 | Font: Nunito Sans | A-01 |
| DEC-05 | 2026-11-18 | Palette: Onyx #222526, Graphite #353A3E, Platinum #E0E0E0, Jet Black #1A1A1A, Ash #BFBFBF; light + dark themes with toggle | M-01 |
| DEC-06 | 2026-11-19 | Website purpose: win clients, get hired, brand Soft CODES — equally | A-* |
| DEC-07 | 2026-11-19 | Business features: 'from' pricing, quote request form, book a call | A-08, M-03, A-11 |
| DEC-08 | 2026-11-19 | Content/tools: admin panel, downloadable CV, blog, WhatsApp button | M-04–M-07 |
| DEC-09 | 2026-11-19 | Hero: photo + text | M-02 |
| DEC-10 | 2026-11-19 | Backend: Neon Postgres + separate file storage | M-08, M-09 |
| DEC-11 | 2026-11-19 | Booking: Cal.com | A-11, M-10 |
| DEC-12 | 2026-11-19 | Extras: project filters, analytics, newsletter, process section | M-11–M-14 |
| DEC-13 | 2026-11-19 | Complete feature inclusion policy (addendum): no feature removed; MVP = priority only | All |
| DEC-14 | 2026-11-19 | Nothing is built without owner approval of the plan first | Process |
| DEC-15 | 2026-11-19 | Admin panel: custom admin inside the Next.js app (was DEC-O1) | A-15, G-* |
| DEC-16 | 2026-11-19 | File storage: Cloudflare R2, private buckets + signed URLs (was DEC-O2) | M-09, B-09, D-13 |
| DEC-17 | 2026-11-19 | Email: Resend (was DEC-O3) | H-01, M-03, M-13 |
| DEC-18 | 2026-11-19 | Auth: Better Auth on Neon (was DEC-O4) | K-01–K-04 |
| DEC-19 | 2026-11-19 | Release 1 split into R1a (admin, content, security, leads, launch) and R1b (blog, newsletter, testimonials, filters) | Roadmap |
| DEC-20 | 2026-11-19 | Hero photo: owner will supply a new photo (was DEC-O14) | M-02 |
| DEC-21 | 2026-11-19 | Site copy: Claude drafts each section, owner approves before it goes live (was DEC-O15) | A-03, A-04, A-06, all copy |
| DEC-22 | 2026-11-19 | ORM: Drizzle (was DEC-O13) | M-08 |
| DEC-23 | 2026-11-19 | Error monitoring: Sentry free tier (was DEC-O12) | K-19 |
| DEC-24 | 2026-11-19 | Newsletter subscribers stored in own Neon DB, sent via Resend (was DEC-O10) | M-13 |
| DEC-25 | 2026-11-19 | Pricing shown in USD + SLE (was DEC-O7 for display) | A-08 |
| DEC-26 | 2026-11-19 | 'From' prices: Claude researches and proposes, owner approves (DEC-O11 stays open until approval) | A-08 |
| DEC-27 | 2026-11-19 | Domain not decided yet: launch on Vercel URL; email sending (Resend) waits for domain | M-17, H-01 |
| DEC-28 | 2026-11-19 | Headphone koala ("Meditative Koala") is the official Soft CODES mascot | Brand, A-01 |
| DEC-29 | 2026-11-19 | Hero: koala image as full-width background, text left / koala right; hero stays dark in both themes (supersedes DEC-09 layout) | A-02, M-02 |
| DEC-30 | 2026-11-19 | Owner portrait moves to the About section; owner will supply the photo and the About layout reference | A-03, M-02 |
| DEC-31 | 2026-11-19 | Koala mascot used on 404 and empty/'coming soon' states | A-01 |
| DEC-32 | 2026-11-19 | File storage: Neon object storage replaces Cloudflare R2 (supersedes DEC-16; Cloudflare account blocked 7 days). Condition: must support private objects + expiring signed URLs, else fall back to R2 | M-09, B-09, D-13 |
| DEC-33 | 2026-11-19 | Neon project: org org-hidden-lake-52748571, project delicate-paper-51580609, branch production; services postgres + object-storage | M-08, M-09 |
| DEC-34 | 2026-11-19 | Owner admin account email: engineermohamedabassjalloh3855@gmail.com | K-01, G-01 |
| DEC-35 | 2026-11-19 | T7 (Cal.com, CV, Resend) and T8 (Vercel, Sentry) inputs deferred by owner | R1a T7, T8 |

## Open decisions (need owner answer)
| # | Decision | Options | Recommendation | Why | Needed by |
|---|---|---|---|---|---|
| DEC-O5 | Online payments | Stripe · Flutterwave · PayPal · other | Research first | Provider availability for a Sierra Leone business must be verified before choosing | R3 |
| DEC-O6 | Mobile money | Orange Money · Africell Money | Start manual (reference + admin verification), API later | APIs need merchant agreements | R3 |
| DEC-O7 | Currencies for payments | USD + SLE confirmed for display (DEC-25); payment currencies to confirm | USD + SLE | Local and international clients | R3 |
| DEC-O8 | Deposit policy | 50% fixed · configurable per service | Configurable, default 50% | Matches addendum C-01/C-02 | R3 |
| DEC-O9 | Domain name | e.g. softcodes.dev / softcodes.sl / other | Owner choice | Needed for email sending and SEO | R1 |
| DEC-O11 | 'From' prices per package | Owner sets amounts | — | Owner business decision | R1 |
