# R1a Build Plan — Admin CMS + Leads + Launch

Status: approved to proceed 2026-11-19 (UI polish after all tasks; owner recommendations later).
Branch per task, PR per task, merge after lint/typecheck/build pass.

| Task | Scope | Registry IDs | Needs from owner |
|---|---|---|---|
| T1 | Koala hero (text left, koala right, always dark), portrait to About (interim layout), koala on 404/empty states | A-02, A-03 (interim), M-02, DEC-28–31 | — |
| T2 | Data foundation: Neon + Drizzle schema (users, roles, settings, audit_log, content, media, leads, prices with currency), seed from site.ts, GitHub Actions CI | M-08, K-07, K-15, K-16, K-17, K-20 | Neon login (browser) — project delicate-paper-51580609 |
| T3 | Auth: Better Auth, owner account, TOTP MFA, password reset, secure sessions, rate limits on auth | K-01, K-03, K-04, K-13, K-14 | Owner email for admin account |
| T4 | Admin shell: owner dashboard, RBAC, audit log viewer, settings | G-01, G-03, G-19, G-20, K-05 | — |
| T5 | Content management: CRUD for every public section, projects, services, stack; media upload to Neon object storage (DEC-32); public pages read DB with revalidate on save | A-15, G-14, M-07, M-09 | — (Neon object storage, set up in T2) |
| T6 | Pricing page (USD + SLE, 'from' prices seeded with proposal, editable), FAQs, About page | A-08, A-09, A-03, G-06, M-15 | Approve/adjust prices (seeded values editable) |
| T7 | Leads: quote form → DB + admin inbox + owner email; Cal.com embed; WhatsApp button; CV upload/download; process section | M-03, A-10, A-11, F-14, M-04, M-06, M-10, M-14, H-01 | Cal.com username; CV PDF; Resend API key (sends to owner inbox until domain) |
| T8 | Ops & launch: Vercel deploy, Vercel Analytics, Sentry, security headers/CSP, Dependabot, axe + Lighthouse, structured data, backups check | M-12, M-16, K-12, K-19, K-22, A-12, A-13 | Vercel account; Sentry DSN |

Seed prices (USD / SLE at ~23): Landing 150 / 3,500 · Business site 400 / 9,200 · Site + admin 900 / 20,700 · E-commerce/booking 1,200 / 27,600 · Web app/platform 2,500 / 57,500 · UI & brand 150 / 3,500 · Maintenance 25 / 575 per month. Not final until owner approves (DEC-O11).
