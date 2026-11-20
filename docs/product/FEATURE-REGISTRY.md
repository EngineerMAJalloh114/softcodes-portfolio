# Soft CODES — Master Feature Registry

Status: **DRAFT for owner review** · Created 2026-11-19 · Owner: Mohamed Abass Jalloh

Every feature discussed for Soft CODES is listed here. Features are never deleted: a feature moved to another release keeps its ID and gets a note. MVP vs later is priority only, not inclusion.

**Statuses:** Planned · Architecture approved · Ready for development · In development · Implemented · Testing · Verified · Released · Deferred (with reason)

**Priority:** Must · Should · Could (MoSCoW, within its release)

**Releases:** R0 Foundation site · R1a Admin CMS + leads + launch · R1b Content growth · R2 Project acquisition · R3 Payments and documents · R4 Client portal and delivery · R5 Design previews and AI · R6 Maintenance and subscriptions · R7 Business intelligence · R8 Platform expansion

## Summary

| Category | Features | Implemented | Planned |
|---|---|---|---|
| A. Public website and brand experience | 16 | 15 | 1 |
| B. Intelligent project acquisition | 18 | 0 | 18 |
| C. Payments and financial management | 16 | 0 | 16 |
| D. Official document management | 17 | 0 | 17 |
| E. Intelligent design and preview system | 13 | 0 | 13 |
| F. Client relationship and project management | 19 | 0 | 19 |
| G. Business administration | 20 | 6 | 14 |
| H. Automation and communication | 12 | 1 | 11 |
| I. Maintenance and ongoing services | 11 | 0 | 11 |
| J. Advanced business intelligence | 10 | 1 | 9 |
| K. Security and infrastructure | 23 | 11 | 12 |
| L. Future platform expansion | 13 | 0 | 13 |
| M. Site features agreed in chat (2026-11-19) | 17 | 13 | 4 |
| **Total** | **205** | **47** | **158** |

Counts *Implemented* includes *In development*. Nothing is Verified or Released yet: the site is not deployed.

## A. Public website and brand experience

**Business value (category):** Converts visitors into leads and builds trust in Soft CODES and its founder.

**Security baseline (category):** Standard web hardening: CSP and security headers, no secrets in client bundle, sanitised CMS output.

**Testing baseline (category):** Lint, typecheck, build; visual check at 1440/390 in both themes; Lighthouse ≥90 performance/accessibility/SEO.

### A-01 — Professional company website
- **Description:** Public marketing site for Mohamed Abass Jalloh and Soft CODES.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Site builds and renders all public routes in both themes at 1440/390.
- **Status:** Implemented
- **Evidence:** PR #1 (site v1), PR #2 (themes) merged to main; not yet deployed. T1 (PR #3, branch feat/hero-koala): koala mascot on 404 and all "coming soon"/screenshot placeholders (src/app/not-found.tsx, src/components/MascotPlaceholder.tsx)
- **Decisions:** DEC-03, DEC-28, DEC-31

### A-02 — Homepage
- **Description:** Hero (photo + text), about, services, featured work, stack, contact.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** A-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Home renders every section; hero shows portrait; CTAs work.
- **Status:** Implemented
- **Evidence:** src/app/page.tsx. T1 (PR #3, branch feat/hero-koala): hero rebuilt per DEC-29 — koala mascot full-width background (next/image, priority), text left / koala right on desktop, koala below text on mobile, always dark via scoped `data-theme="dark"`; portrait removed from hero. Measured hero text contrast ≥ 5.97:1 at 768–1440 and 390 in both themes. Screenshots: docs/screenshots/home-{1440,390}-{dark,light}.png. T5 (PR #14, branch feat/t5-content): home page renders from the CMS (hero, about, services, process, featured projects, stack, contact). T6 (branch feat/t6-pricing-faq): hero CTAs are typed links (WhatsApp | URL | anchor; DEC-37) and the home page gains a pricing teaser and a short About with “More about me”. T7a (branch feat/t7a-leads): hero “Download CV” (when set), floating WhatsApp button, contact section uses the quote form
- **Decisions:** DEC-09 (superseded by DEC-29 for layout), DEC-29, DEC-30

### A-03 — About page
- **Description:** Dedicated About page with real bio, education, experience, values.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** A-01, G-14
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Bio approved by owner; editable from admin.
- **Status:** In development
- **Evidence:** Partial: About is a home section only, placeholder bio. T1 (PR #3, branch feat/hero-koala): interim 2-column About (owner photo /brand/me.jpg + bio + facts), marked TODO(DEC-30); final layout, photo, approved bio and admin editing still pending (R1a T6). T5 (PR #14, branch feat/t5-content): About bio, facts and portrait editable in the admin (portrait can come from the media library); final layout still TODO(DEC-30). T6 (branch feat/t6-pricing-faq): dedicated /about page (full About: portrait, bio, facts; interim layout, TODO(DEC-30) kept), linked from the nav; home keeps a short About with “More about me” → /about. Remaining: owner-approved bio and final layout (DEC-30). T7a (branch feat/t7a-leads): “Download CV” on About when a CV is set (M-04)
- **Decisions:** DEC-21, DEC-30

### A-04 — Services
- **Description:** Service list with descriptions, linked to pricing and quote.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** A-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Each service links to pricing/quote; content editable from admin (R1).
- **Status:** Implemented
- **Evidence:** Home services section (content approval pending)

### A-05 — Portfolio
- **Description:** Projects grid with status badges.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** A-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** All projects listed; filterable (see M-11).
- **Status:** Implemented
- **Evidence:** src/app/projects/page.tsx. T5 (PR #14, branch feat/t5-content): projects grid from the DB (published only; order set in the admin; drafts visible only in preview). R1b Part 2 (branch feat/r1b-growth): filterable by type and topic (M-11)

### A-06 — Case studies
- **Description:** Per-project page: problem, solution, features, stack, screenshots, result.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** A-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Each project has a case study with real screenshots and owner-approved text.
- **Status:** Implemented
- **Evidence:** src/app/projects/[slug]/page.tsx — placeholder text and screenshots. T5 (PR #14, branch feat/t5-content): case studies editable (problem, solution, features, stack, screenshots from the media library, links, status); new projects render on first visit (ISR)

### A-07 — Technology showcase
- **Description:** Stack section with tools and how they are used.
- **Priority / Release:** Should · R0 (Foundation site)
- **Dependencies:** A-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Stack items editable from admin; grouped by area.
- **Status:** Implemented
- **Evidence:** Home stack section

### A-08 — Pricing information
- **Description:** Packages with 'from' prices (owner decision).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** G-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Pricing page shows packages with 'from' prices set in admin; links to quote/wizard.
- **Status:** Implemented
- **Evidence:** T6 (branch feat/t6-pricing-faq): /pricing lists published packages with 'from' prices in USD and SLE (DEC-25, DEC-38 seeded), currency toggle remembered per visitor (localStorage, applied before paint), Popular badge, each card links to “Request a quote” (/contact?package=<id>; wizard is R2) and “Book a call” (placeholder until Cal.com, TODO(T7)); home pricing teaser → /pricing; FAQ/Pricing/About in nav and sitemap. Proof: scripts/verify-t6.ts (npm run t6:verify), tests/t6.test.ts; screenshots docs/screenshots/t6-pricing-{usd,sle}-*, t6-home-*
- **Decisions:** DEC-25, DEC-38

### A-09 — FAQs
- **Description:** Common questions on process, payment (50% deposit), timelines, ownership.
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** G-14
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** FAQ page with accordion, FAQPage structured data, editable in admin.
- **Status:** Implemented
- **Evidence:** T6 (branch feat/t6-pricing-faq): /faq accordion (<details>) grouped by category, FAQPage JSON-LD from published FAQs only, admin CRUD at Admin → Content → FAQs (question, answer, category, order, draft/published). 8 FAQs seeded as drafts (process, 50% deposit, timelines, ownership, revisions, hosting, maintenance, payment methods) — not public until the owner approves and publishes (DEC-21). Proof: scripts/verify-t6.ts (draft hidden, publish → live + structured data), tests/t6.test.ts; screenshots docs/screenshots/t6-faq-*, t6-faq-preview-*, t6-admin-faqs-*
- **Decisions:** DEC-21

### A-10 — Contact
- **Description:** Contact page with email, WhatsApp and form.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** A-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Form delivers to owner inbox (R1 upgrade from mailto to server-side email).
- **Status:** Implemented
- **Evidence:** src/app/contact/page.tsx (mailto fallback). T7a (branch feat/t7a-leads): the mailto form is replaced by the stored quote request form (M-03); email and WhatsApp cards unchanged (from Settings). Owner inbox delivery = T7b (Resend)

### A-11 — Consultation booking
- **Description:** Book a call via Cal.com embed (owner decision).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** A-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Visitor books a slot; owner gets calendar invite; works in both themes.
- **Status:** Planned
- **Evidence:** —

### A-12 — SEO
- **Description:** Metadata, OG image, sitemap, robots, structured data, Search Console.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** A-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Every page has unique title/description; sitemap valid; Search Console verified after domain.
- **Status:** In development
- **Evidence:** Metadata/OG/sitemap/robots done; structured data + Search Console pending. R1b Part 1 (branch feat/r1b-blog): blog posts — unique title/description per post, og:type article + cover image, BlogPosting structured data, posts in sitemap.xml (published, dated today or earlier), RSS feed /blog/rss.xml. R1b Part 2 (branch feat/r1b-growth): testimonials carry no Review/AggregateRating structured data (DEC-44); filtered /projects views canonicalise to /projects; unsubscribe page noindex
- **Decisions:** DEC-42, DEC-44

### A-13 — Accessibility
- **Description:** WCAG 2.2 AA across the site.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** AA contrast in both themes; keyboard navigation; reduced motion; axe scan clean.
- **Status:** Implemented
- **Evidence:** Contrast verified in PR #2; automated axe scan pending

### A-14 — Responsive layouts
- **Description:** Works from 360px to 1920px.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** No horizontal scroll at 360/390/768/1024/1440.
- **Status:** Implemented
- **Evidence:** Screenshots in docs/screenshots

### A-15 — Content management
- **Description:** All public content editable from the admin panel (owner decision: admin panel).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-01, K-05, G-14
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner edits text, projects, photos, pricing, FAQs, blog without code; changes live without redeploy.
- **Status:** In development
- **Evidence:** Content currently in src/content/site.ts. T5 (PR #14, branch feat/t5-content): every public section (hero, about, profile/portrait, services, process, projects heading, stack, contact section, Soft CODES page, nav, footer, site SEO, page metadata/labels) plus services, stack and projects editable in /admin/content and /admin/projects; public pages read the DB (cached, tag "content", updateTag on save) — verified: hero edit → public page updated without redeploy (scripts/verify-t5.ts). Remaining: pricing + FAQs (T6), blog (R1b)

### A-16 — Customer testimonials and reviews
- **Description:** Client quotes with name, company, photo, project link; admin-approved.
- **Priority / Release:** Should · R1b (Content growth)
- **Dependencies:** G-14
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Testimonials shown only after admin approval; no Review/rating structured data (DEC-44, Google self-serving review policy). _Was: "Review structured data" — changed 2026-11-20 by DEC-44._
- **Status:** Implemented
- **Evidence:** R1b Part 2 (branch feat/r1b-growth): Admin → Content → Testimonials (owner + admin): quote, name, role, company, photo from Media, linked project, optional rating, draft/published, order; audited. Shown only when published (admin approval): home “What clients say” section (hidden when none) and on the linked project's case study. Rating shown as stars only; no Review/AggregateRating structured data (DEC-44). No testimonials seeded — real quotes only. Proof: scripts/verify-r1b-growth.ts (npm run r1b-growth:verify), tests/r1b-growth.test.ts; screenshots docs/screenshots/r1b-growth-home-testimonials-*, -case-study-testimonial-*, -admin-testimonial*
- **Decisions:** DEC-44, DEC-41

## B. Intelligent project acquisition

**Business value (category):** Captures complete, qualified project requirements and turns them into accepted quotations with minimal manual work.

**Security baseline (category):** Server-side validation of every step; upload type/size limits; drafts readable only by their owner; rate limiting on submissions.

**Testing baseline (category):** Unit tests for branching logic and estimate engine; e2e test of a full wizard run per category; autosave/resume test.

### B-01 — Interactive project planning wizard
- **Description:** Multi-step guided form replacing the simple quote form for full projects.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** K-01, M-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Visitor completes wizard on mobile and desktop; result stored as a project request.
- **Status:** Planned
- **Evidence:** —

### B-02 — Dynamic project categories
- **Description:** Categories (website, web app, dashboard, e-commerce, branding…) managed in admin.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-01, G-14
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin adds/edits categories; wizard updates without deploy.
- **Status:** Planned
- **Evidence:** —

### B-03 — Conditional questions
- **Description:** Questions shown based on earlier answers and category.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Branching rules configurable; tests cover every branch.
- **Status:** Planned
- **Evidence:** —

### B-04 — Business information collection
- **Description:** Company name, industry, size, location, contact person.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Required fields validated client and server side.
- **Status:** Planned
- **Evidence:** —

### B-05 — Technical requirements collection
- **Description:** Pages, features, integrations, payments, languages, hosting.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Feature checklist per category saved to request.
- **Status:** Planned
- **Evidence:** —

### B-06 — Design preference selection
- **Description:** Style, colours, reference images, existing brand assets.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** B-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client selects style options and uploads brand files.
- **Status:** Planned
- **Evidence:** —

### B-07 — Budget and timeline collection
- **Description:** Budget range and deadline with currency.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-01, C-09
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Budget stored with currency; unrealistic combos flagged.
- **Status:** Planned
- **Evidence:** —

### B-08 — Reference website submission
- **Description:** Client lists sites they like and why.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** B-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** URLs validated; shown to admin as clickable list.
- **Status:** Planned
- **Evidence:** —

### B-09 — File and image uploads
- **Description:** Upload logos, documents, images to the request.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** K-08, K-09
- **Security:** Private bucket, signed URLs, MIME sniffing, size limits, scan before admin download.
- **Testing:** Category baseline.
- **Acceptance criteria:** Type/size limits enforced; files stored privately; virus scan where available.
- **Status:** Planned
- **Evidence:** —

### B-10 — Autosave
- **Description:** Wizard progress saved automatically.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Answers saved within 2s of change; no data lost on refresh.
- **Status:** Planned
- **Evidence:** —

### B-11 — Resume incomplete applications
- **Description:** Return later via account or emailed magic link.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** B-10, K-02
- **Security:** Resume links single-use or expiring; bound to email.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client resumes from last step on another device.
- **Status:** Planned
- **Evidence:** —

### B-12 — Requirement validation
- **Description:** Checks completeness and consistency before submission.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Submission blocked with clear messages until valid.
- **Status:** Planned
- **Evidence:** —

### B-13 — Project summary
- **Description:** Readable summary of all answers before submit and for admin.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-12, D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client reviews and edits summary; PDF copy emailed (needs D-05).
- **Status:** Planned
- **Evidence:** —

### B-14 — Automated project estimates
- **Description:** Price/time estimate from category, features and pricing rules.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-13, G-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Estimate shown as range with 'from' prices; rules editable in admin; labelled non-binding.
- **Status:** Planned
- **Evidence:** —

### B-15 — Administrator review
- **Description:** Admin queue to review, comment, request info.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** G-01, B-13
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin changes status (new, reviewing, info needed, quoted, declined).
- **Status:** Planned
- **Evidence:** —

### B-16 — Final quotations
- **Description:** Admin turns request into an official quotation.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-15, D-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Quotation with line items, totals, deposit and validity date sent to client.
- **Status:** Planned
- **Evidence:** —

### B-17 — Quotation revisions
- **Description:** Versioned quotation changes with history.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-16, D-14
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Each revision new version; client sees latest; history kept.
- **Status:** Planned
- **Evidence:** —

### B-18 — Client acceptance
- **Description:** Client accepts quotation online, triggering deposit invoice.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-16, K-01
- **Security:** Acceptance is a signed, timestamped, audited event.
- **Testing:** Category baseline.
- **Acceptance criteria:** Acceptance records user, time, IP, version; deposit invoice generated (R3).
- **Status:** Planned
- **Evidence:** —

## C. Payments and financial management

**Business value (category):** Secures cash flow (50% deposit before work) and keeps every money movement traceable.

**Security baseline (category):** Webhook signature verification; idempotency keys; amounts stored as integer minor units; append-only ledger; admin-only verification; full audit trail.

**Testing baseline (category):** Unit tests for ledger maths and currency handling; webhook replay/duplicate tests; e2e deposit → verification → balance flow; reconciliation test with mismatched references.

### C-01 — 50% initial deposit
- **Description:** Work starts after 50% deposit is verified.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** B-18, D-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Project cannot move to 'in development' until deposit verified.
- **Status:** Planned
- **Evidence:** —

### C-02 — Configurable deposit policy
- **Description:** Deposit % and rules per service or project set in admin.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-01, G-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin changes deposit %; new quotations use it; old ones unchanged.
- **Status:** Planned
- **Evidence:** —

### C-03 — Online payment integration
- **Description:** Card/online payment provider (provider to be decided).
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** K-10, K-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client pays invoice online; status updates via verified webhook.
- **Status:** Planned
- **Evidence:** —

### C-04 — Manual bank transfers
- **Description:** Client pays by bank transfer and uploads proof.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** B-09, C-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Proof upload; admin verifies; balance updates.
- **Status:** Planned
- **Evidence:** —

### C-05 — Supported mobile money payments
- **Description:** Orange Money / Africell Money (provider integration to be confirmed).
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-04
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client pays by mobile money with transaction reference; verified by admin or API.
- **Status:** Planned
- **Evidence:** —

### C-06 — Payment verification
- **Description:** Admin verifies manual payments; automatic for webhook-confirmed ones.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** G-08, C-04
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Verified payments locked; verification user and time recorded.
- **Status:** Planned
- **Evidence:** —

### C-07 — Payment reconciliation
- **Description:** Match payments to invoices; flag mismatches.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Unmatched or partial payments listed; reconciliation report.
- **Status:** Planned
- **Evidence:** —

### C-08 — Multiple payment providers
- **Description:** Provider abstraction so more providers can be added.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** C-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Second provider can be added without changing invoice/ledger code.
- **Status:** Planned
- **Evidence:** —

### C-09 — Multiple currencies
- **Description:** USD and SLE at minimum; amounts stored per currency.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Every amount has currency; no mixing in totals without stored exchange rate.
- **Status:** Planned
- **Evidence:** —

### C-10 — Refund management
- **Description:** Full/partial refunds recorded and linked to original payment.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** C-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Refund creates negative ledger entry and credit note document.
- **Status:** Planned
- **Evidence:** —

### C-11 — Payment history
- **Description:** Full history per client and project.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client and admin see chronological payments with references.
- **Status:** Planned
- **Evidence:** —

### C-12 — Outstanding balance tracking
- **Description:** Balance due per project/invoice.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Balance always equals invoices − verified payments − refunds.
- **Status:** Planned
- **Evidence:** —

### C-13 — Financial statements
- **Description:** Statement of account per client for any date range.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** C-12, D-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Statement PDF matches ledger.
- **Status:** Planned
- **Evidence:** —

### C-14 — Transaction references
- **Description:** Unique reference on every payment and invoice.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** D-08
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Reference shown on documents and searchable in admin.
- **Status:** Planned
- **Evidence:** —

### C-15 — Payment notifications
- **Description:** Email/in-app on payment received, verified, failed.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** H-01, H-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client and owner notified within 1 minute of status change.
- **Status:** Planned
- **Evidence:** —

### C-16 — Financial audit trails
- **Description:** Every financial change logged and immutable.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** K-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** No update/delete on ledger rows; corrections via reversing entries.
- **Status:** Planned
- **Evidence:** —

## D. Official document management

**Business value (category):** Professional, verifiable paperwork that clients, banks and authorities can trust.

**Security baseline (category):** Documents served only via signed, expiring URLs to authorised users; stamp/signature assets admin-only; issued documents immutable (new version instead of edit); hash for tamper evidence.

**Testing baseline (category):** Snapshot tests of PDF output; numbering uniqueness under concurrency; verification page test with valid and altered documents.

### D-01 — Professional quotations
- **Description:** Branded quotation PDF.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** D-07, D-08
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** PDF with logo, line items, totals, deposit, validity, terms.
- **Status:** Planned
- **Evidence:** —

### D-02 — Proforma invoices
- **Description:** Proforma before payment where clients need it.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Generated from accepted quotation.
- **Status:** Planned
- **Evidence:** —

### D-03 — Deposit invoices
- **Description:** Invoice for the deposit amount.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-01, D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Auto-generated on acceptance.
- **Status:** Planned
- **Evidence:** —

### D-04 — Final invoices
- **Description:** Invoice for the remaining balance at delivery.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-12, D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Generated at completion milestone.
- **Status:** Planned
- **Evidence:** —

### D-05 — Payment receipts
- **Description:** Receipt for every verified payment.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-06, D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Receipt issued automatically on verification.
- **Status:** Planned
- **Evidence:** —

### D-06 — Financial statements (documents)
- **Description:** Statement PDF (see C-13).
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** C-13
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Same totals as ledger.
- **Status:** Planned
- **Evidence:** —

### D-07 — PDF generation
- **Description:** Server-side PDF engine and templates.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** PDFs render identically across runs; fonts embedded.
- **Status:** Planned
- **Evidence:** —

### D-08 — Unique document numbering
- **Description:** Sequential per type and year, e.g. SC-INV-2026-0001.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** No duplicates under concurrent creation; no gaps after cancel (cancelled kept).
- **Status:** Planned
- **Evidence:** —

### D-09 — Company logo
- **Description:** Logo on all documents.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** G-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Logo from branding settings.
- **Status:** Planned
- **Evidence:** public/brand assets exist

### D-10 — Official company stamp
- **Description:** Stamp image on issued documents.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** G-12
- **Security:** Stamp asset private; never exposed as public file.
- **Testing:** Category baseline.
- **Acceptance criteria:** Stamp applied only on issued (not draft) documents.
- **Status:** Planned
- **Evidence:** —

### D-11 — Authorised company signature
- **Description:** Signature on issued documents.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** G-12
- **Security:** Signature asset private; usage audited.
- **Testing:** Category baseline.
- **Acceptance criteria:** Signature applied only by authorised role.
- **Status:** Planned
- **Evidence:** —

### D-12 — Configurable document templates
- **Description:** Admin edits terms, footer, layout options.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Template changes affect new documents only.
- **Status:** Planned
- **Evidence:** —

### D-13 — Secure downloads
- **Description:** Downloads via signed, expiring links.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** K-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Links expire; access checked per user.
- **Status:** Planned
- **Evidence:** —

### D-14 — Document versioning
- **Description:** New version on change; old versions kept.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** D-08
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Version number visible; history listed.
- **Status:** Planned
- **Evidence:** —

### D-15 — Document verification
- **Description:** Public verify page via QR/number + hash.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** D-17
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Altered PDF fails verification.
- **Status:** Planned
- **Evidence:** —

### D-16 — Document history
- **Description:** Who created, sent, viewed, downloaded.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** K-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Full event list per document.
- **Status:** Planned
- **Evidence:** —

### D-17 — Tamper-evident financial records
- **Description:** Hash chain on ledger and issued documents.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Integrity check detects any altered record.
- **Status:** Planned
- **Evidence:** —

## E. Intelligent design and preview system

**Business value (category):** Lets clients see and approve their product early, increasing conversion and reducing revisions.

**Security baseline (category):** Previews locked until deposit verified; per-client access tokens; watermarking; AI calls server-side only with prompt-injection safeguards.

**Testing baseline (category):** Access-control tests (no deposit → no preview); versioning tests; e2e feedback → revision → approval.

### E-01 — Personalised website previews
- **Description:** Client-specific website preview link.
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** C-01, E-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Preview visible only after deposit verified.
- **Status:** Planned
- **Evidence:** —

### E-02 — Application dashboard previews
- **Description:** Preview of dashboards/app screens.
- **Priority / Release:** Should · R5 (Design previews and AI)
- **Dependencies:** E-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Same gating as E-01.
- **Status:** Planned
- **Evidence:** —

### E-03 — AI-assisted design concepts
- **Description:** AI generates concept options from wizard answers.
- **Priority / Release:** Could · R5 (Design previews and AI)
- **Dependencies:** B-01, K-12
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin reviews AI concepts before client sees them.
- **Status:** Planned
- **Evidence:** —

### E-04 — Administrator-created designs
- **Description:** Admin uploads/links designs (Figma, images, live URLs).
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** E-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin attaches design to project; client notified.
- **Status:** Planned
- **Evidence:** —

### E-05 — Responsive design previews
- **Description:** Preview at desktop/tablet/mobile widths.
- **Priority / Release:** Should · R5 (Design previews and AI)
- **Dependencies:** E-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Device toggle in preview viewer.
- **Status:** Planned
- **Evidence:** —

### E-06 — Design versioning
- **Description:** Versions per design with history.
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** E-04
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client sees latest; can compare versions.
- **Status:** Planned
- **Evidence:** —

### E-07 — Client feedback
- **Description:** Comments pinned to designs.
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** E-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Comments stored per version; admin notified.
- **Status:** Planned
- **Evidence:** —

### E-08 — Revision requests
- **Description:** Formal revision request counted against package limit.
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** E-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Revision count tracked vs package.
- **Status:** Planned
- **Evidence:** —

### E-09 — Design approvals
- **Description:** Client approves a design version.
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** E-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Approval recorded and audited; triggers next milestone.
- **Status:** Planned
- **Evidence:** —

### E-10 — Preview access control
- **Description:** Gating and per-client access to previews.
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** K-05, C-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** No access without login + verified deposit; tested.
- **Status:** Planned
- **Evidence:** —

### E-11 — AI project consultant
- **Description:** Chat assistant that helps visitors scope projects.
- **Priority / Release:** Could · R5 (Design previews and AI)
- **Dependencies:** B-01
- **Security:** No client data sent to AI without consent; rate limited.
- **Testing:** Category baseline.
- **Acceptance criteria:** Answers grounded in services/pricing; hands off to wizard.
- **Status:** Planned
- **Evidence:** —

### E-12 — Future automated website prototyping
- **Description:** Generate a working prototype from requirements.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** E-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Defined later; architecture provision: project requirements stored as structured data.
- **Status:** Planned
- **Evidence:** —

### E-13 — Future AI-assisted source-code generation
- **Description:** Generate starter code from approved designs.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** E-12
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Defined later.
- **Status:** Planned
- **Evidence:** —

## F. Client relationship and project management

**Business value (category):** Gives clients one place to follow, discuss and approve their project; reduces WhatsApp/email chaos.

**Security baseline (category):** Resource-level permissions (client sees only own projects); file scanning where available; message and file access audited.

**Testing baseline (category):** Permission tests per role; e2e milestone → approval → handover; file upload/download tests.

### F-01 — Secure client accounts
- **Description:** Client sign-up/sign-in with verified email.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** K-01, K-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client creates account; verifies email; signs in.
- **Status:** Planned
- **Evidence:** —

### F-02 — Client dashboard
- **Description:** Overview of requests, quotations, invoices, projects.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** F-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client sees only own items.
- **Status:** Planned
- **Evidence:** —

### F-03 — Project dashboard
- **Description:** Per-project view: status, milestones, files, messages.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** All project data in one page.
- **Status:** Planned
- **Evidence:** —

### F-04 — Project timelines
- **Description:** Planned vs actual dates.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** F-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Timeline view per project.
- **Status:** Planned
- **Evidence:** —

### F-05 — Development milestones
- **Description:** Milestones with deliverables and approvals.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin defines milestones; client sees progress.
- **Status:** Planned
- **Evidence:** —

### F-06 — Progress tracking
- **Description:** % complete and status updates.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Progress updates notify client.
- **Status:** Planned
- **Evidence:** —

### F-07 — Client messaging
- **Description:** In-app messages per project.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-03, H-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Messages delivered and notified; history kept.
- **Status:** Planned
- **Evidence:** —

### F-08 — File sharing
- **Description:** Shared project files both ways.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** B-09
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Same upload protections as B-09.
- **Status:** Planned
- **Evidence:** —

### F-09 — Deliverable management
- **Description:** Track deliverables per milestone.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Deliverables marked delivered/accepted.
- **Status:** Planned
- **Evidence:** —

### F-10 — Client approvals
- **Description:** Client approves milestones/deliverables.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-09
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Approvals audited.
- **Status:** Planned
- **Evidence:** —

### F-11 — Support requests
- **Description:** Client opens support tickets.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** F-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Ticket statuses and replies.
- **Status:** Planned
- **Evidence:** —

### F-12 — Bug reporting
- **Description:** Bug form with screenshots and steps.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** F-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Bug linked to project; priority set by admin.
- **Status:** Planned
- **Evidence:** —

### F-13 — Revision tracking
- **Description:** Revisions counted per package.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** E-08
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Remaining revisions visible.
- **Status:** Planned
- **Evidence:** —

### F-14 — Consultation scheduling
- **Description:** Clients book follow-up calls (Cal.com).
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** A-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Booking from dashboard.
- **Status:** Planned
- **Evidence:** —

### F-15 — Digital contracts
- **Description:** Contract generated from accepted quotation.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** B-18, D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Contract PDF with terms and parties.
- **Status:** Planned
- **Evidence:** —

### F-16 — Electronic signatures
- **Description:** Client signs contract online.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-15
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Signature, time, IP, document hash recorded.
- **Status:** Planned
- **Evidence:** —

### F-17 — Project completion
- **Description:** Completion checklist and sign-off.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Completion triggers final invoice.
- **Status:** Planned
- **Evidence:** —

### F-18 — Final handover
- **Description:** Credentials, source, docs handed over securely.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-17, C-12
- **Security:** Credentials shared via one-time secret links.
- **Testing:** Category baseline.
- **Acceptance criteria:** Handover only after balance paid.
- **Status:** Planned
- **Evidence:** —

### F-19 — Client project history
- **Description:** All past projects per client.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** F-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** History list with documents.
- **Status:** Planned
- **Evidence:** —

## G. Business administration

**Business value (category):** Lets the owner run the whole business from one dashboard without touching code.

**Security baseline (category):** Admin routes behind auth + role checks + MFA; every admin write logged in audit log; least-privilege staff roles.

**Testing baseline (category):** Role/permission matrix tests; audit-log entry test for every admin mutation; e2e admin CRUD flows.

### G-01 — Owner dashboard
- **Description:** Overview of leads, quotes, payments, projects.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-01, K-04
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner sees key counts and latest activity.
- **Status:** Implemented
- **Evidence:** T4 (PR #6, branch feat/t4-admin-shell): /admin dashboard — counts (leads, projects, content items = sections+services+stack, media) and latest 10 audit events; koala empty states (DEC-31). src/app/admin/page.tsx, src/lib/admin/dashboard.ts. Screenshots docs/screenshots/admin-dashboard-*. Quotes/payments counts arrive with R2/R3. T7a (branch feat/t7a-leads): dashboard “New leads” count links to the inbox (/admin/leads?status=new)
- **Decisions:** DEC-31

### G-02 — Staff management
- **Description:** Invite/remove staff.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** G-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner invites staff by email.
- **Status:** Planned
- **Evidence:** —

### G-03 — Role-based permissions
- **Description:** Owner, admin, staff, client roles.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Permission matrix enforced server side.
- **Status:** Implemented
- **Evidence:** T4 (PR #6, branch feat/t4-admin-shell): permission matrix for owner/admin/staff/client in one module (src/lib/auth/permissions.ts), deny by default; unit tests tests/rbac.test.ts (all role × permission pairs) + scripts/verify-t4.ts (every admin route per role over HTTP: expected 200/403). T5 (PR #14, branch feat/t5-content): content.write (sections, services, stack, projects) and media.manage — owner + admin; staff/client denied (unit + HTTP tests). T6 (branch feat/t6-pricing-faq): pricing and FAQ admin use content.write (owner + admin; staff = Dashboard + Leads, DEC-36); the separate pricing.manage permission was folded into content.write; staff/client 403 on pages and actions (tests/rbac.test.ts, scripts/verify-t6.ts). T7a (branch feat/t7a-leads): leads.read + leads.write for owner, admin and staff (staff = Dashboard + Leads, DEC-36); client denied (tests/rbac.test.ts, scripts/verify-t7a.ts). R1b Part 2 (branch feat/r1b-growth): new permission subscribers.manage (owner + admin; staff/client denied — subscriber emails are personal data)
- **Decisions:** DEC-36

### G-04 — Client management
- **Description:** Client records with contacts and history.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** F-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Search, view, edit clients.
- **Status:** Planned
- **Evidence:** —

### G-05 — Project management
- **Description:** Admin project list, statuses, assignments.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin manages all projects.
- **Status:** Planned
- **Evidence:** —

### G-06 — Pricing management
- **Description:** Packages and 'from' prices in admin.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** G-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Price change updates site immediately.
- **Status:** Implemented
- **Evidence:** T6 (branch feat/t6-pricing-faq): Admin → Pricing — package CRUD (name, short ID, summary, included items, 'from' price per currency stored in minor units, unit e.g. /month, Popular, order, draft/published, preview); permission content.write (owner + admin, DEC-36); Zod-validated; audited; price change + publish is live on the next request (verified by scripts/verify-t6.ts). Screenshots docs/screenshots/t6-admin-pricing-*, t6-admin-package-edit-*
- **Decisions:** DEC-36, DEC-38

### G-07 — Quotation management
- **Description:** Create, revise, send quotations.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** B-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Full quotation lifecycle in admin.
- **Status:** Planned
- **Evidence:** —

### G-08 — Payment verification (admin)
- **Description:** Admin queue for manual payments.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Verify/reject with reason.
- **Status:** Planned
- **Evidence:** —

### G-09 — Invoice management
- **Description:** Invoice list, statuses, resend.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** D-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Filter by status; resend email.
- **Status:** Planned
- **Evidence:** —

### G-10 — Receipt management
- **Description:** Receipt list and resend.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** D-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Receipts searchable.
- **Status:** Planned
- **Evidence:** —

### G-11 — Company branding configuration
- **Description:** Logo, colours, company details for documents/emails.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** G-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Branding settings used by PDFs and emails.
- **Status:** Planned
- **Evidence:** —

### G-12 — Company stamp and signature management
- **Description:** Upload/replace stamp and signature.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** G-11
- **Security:** Owner role + MFA required.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner-only; changes audited.
- **Status:** Planned
- **Evidence:** —

### G-13 — Preview management
- **Description:** Manage previews and access.
- **Priority / Release:** Must · R5 (Design previews and AI)
- **Dependencies:** E-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin publishes/unpublishes previews.
- **Status:** Planned
- **Evidence:** —

### G-14 — Content management (admin)
- **Description:** CMS screens for all public content.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** A-15
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** See A-15.
- **Status:** In development
- **Evidence:** T5 (PR #14, branch feat/t5-content): CMS screens — section editors, collection lists (order, publish/unpublish) and item editors driven by one field spec (src/lib/content/defs.ts); drafts + Preview draft (Next Draft Mode, content.write only); Zod validation, unsaved-changes warning, success/error toasts. Remaining: pricing/FAQ screens (T6). R1b Part 1 (branch feat/r1b-blog): Blog posts and categories in the admin (Admin → Blog)

### G-15 — Notification management
- **Description:** Templates and on/off per event.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** H-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner edits email templates.
- **Status:** Planned
- **Evidence:** —

### G-16 — Financial reporting
- **Description:** Revenue, outstanding, payments by period.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Report totals equal ledger.
- **Status:** Planned
- **Evidence:** —

### G-17 — Business analytics
- **Description:** Leads, conversions, traffic.
- **Priority / Release:** Should · R7 (Business intelligence)
- **Dependencies:** M-12
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Dashboard charts with date ranges.
- **Status:** Planned
- **Evidence:** —

### G-18 — Activity monitoring
- **Description:** Live activity feed.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** K-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Feed of recent admin/client actions.
- **Status:** Planned
- **Evidence:** —

### G-19 — Audit logs
- **Description:** Searchable audit log viewer.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Every admin write visible with who/when/what.
- **Status:** Implemented
- **Evidence:** T4 (PR #6, branch feat/t4-admin-shell): /admin/audit — read-only, paginated (25/page), filters by actor (incl. system), action and date range (inclusive, UTC); owner/admin only (audit.view). Verified filters, pagination, 403 for staff, junk params ignored (scripts/verify-t4.ts, tests/settings-and-audit-filters.test.ts)

### G-20 — Administrative settings
- **Description:** Global settings (contact details, deposit %, currencies).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** G-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Settings editable and audited.
- **Status:** Implemented
- **Evidence:** T4 (PR #6, branch feat/t4-admin-shell): /admin/settings (owner only) — contact email, WhatsApp, location; default deposit % (50, DEC-O8 still open); currencies USD+SLE (DEC-25). Zod validation; every save writes a settings.updated audit row with before/after (verified). Public site reads these values from T5. T6 (branch feat/t6-pricing-faq): the WhatsApp number in Settings is the single source for every WhatsApp link (hero, nav “Hire me”, contact, footer — DEC-37); saving Settings now refreshes the public site immediately (verified: change number → all pages use it, then restored). T7a (branch feat/t7a-leads): Settings → Public site: floating WhatsApp button on/off (M-06) and CV file (M-04)
- **Decisions:** DEC-25, DEC-O8 (open), DEC-37

## H. Automation and communication

**Business value (category):** Keeps clients and the owner informed automatically and removes repetitive admin work.

**Security baseline (category):** Email sender domain authenticated (SPF/DKIM/DMARC); no sensitive data in email bodies beyond what is needed; background jobs idempotent and retried safely.

**Testing baseline (category):** Unit tests for triggers; job retry/idempotency tests; email template rendering tests.

### H-01 — Transactional emails
- **Description:** System emails (contact, quote, invoice, receipt).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Emails delivered from verified domain; templates branded.
- **Status:** In development
- **Evidence:** T3 (PR #5, branch feat/t3-auth): email adapter interface (src/lib/email) — dev-log adapter (development) and not-configured adapter (production, explicit error). Remaining: Resend adapter + verified domain (DEC-35, DEC-27). T7a (branch feat/t7a-leads): lead notifications go through the email adapter — with no provider configured nothing is sent; the notification is stored (notifications.email = not_configured) and shown as an unread badge in the admin; in development the dev-log adapter prints it. Resend = adapter swap (T7b)
- **Decisions:** DEC-17, DEC-35

### H-02 — In-app notifications
- **Description:** Bell/notification list in dashboards.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** F-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Unread count; mark read.
- **Status:** Planned
- **Evidence:** —

### H-03 — Payment reminders
- **Description:** Reminders for unpaid invoices.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** H-01, C-12
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Schedule configurable; stops after payment.
- **Status:** Planned
- **Evidence:** —

### H-04 — Quotation reminders
- **Description:** Reminders before quotation expiry.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** B-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Sent N days before expiry.
- **Status:** Planned
- **Evidence:** —

### H-05 — Project milestone notifications
- **Description:** Notify on milestone changes.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Client notified on each change.
- **Status:** Planned
- **Evidence:** —

### H-06 — Deadline notifications
- **Description:** Upcoming deadline alerts.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** F-04
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Alerts to owner and client.
- **Status:** Planned
- **Evidence:** —

### H-07 — Approval notifications
- **Description:** Notify when approval needed/given.
- **Priority / Release:** Must · R4 (Client portal and delivery)
- **Dependencies:** F-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Both sides notified.
- **Status:** Planned
- **Evidence:** —

### H-08 — Automated document generation
- **Description:** Docs auto-created on events.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** D-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Acceptance → deposit invoice; verification → receipt.
- **Status:** Planned
- **Evidence:** —

### H-09 — Automated payment status updates
- **Description:** Webhook-driven status changes.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** K-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Status updated without manual action.
- **Status:** Planned
- **Evidence:** —

### H-10 — Automated project status transitions
- **Description:** Rules move projects between states.
- **Priority / Release:** Should · R4 (Client portal and delivery)
- **Dependencies:** F-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Deposit verified → in development, etc.
- **Status:** Planned
- **Evidence:** —

### H-11 — Background processing
- **Description:** Job queue for emails, PDFs, reminders.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Jobs retried; failures visible in admin.
- **Status:** Planned
- **Evidence:** —

### H-12 — Scheduled maintenance notifications
- **Description:** Notify clients of planned maintenance.
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** I-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Scheduled email to affected clients.
- **Status:** Planned
- **Evidence:** —

## I. Maintenance and ongoing services

**Business value (category):** Recurring revenue after launch and long-term client retention.

**Security baseline (category):** Subscription billing via verified provider webhooks; backup storage encrypted; monitoring credentials stored as secrets.

**Testing baseline (category):** Renewal/reminder scheduling tests; subscription state-machine tests; backup restore drill.

### I-01 — Website maintenance packages
- **Description:** Monthly/annual maintenance plans.
- **Priority / Release:** Must · R6 (Maintenance and subscriptions)
- **Dependencies:** G-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Packages listed with prices.
- **Status:** Planned
- **Evidence:** —

### I-02 — Application maintenance
- **Description:** Maintenance for web apps/platforms.
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** I-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Separate package tier.
- **Status:** Planned
- **Evidence:** —

### I-03 — Hosting management
- **Description:** Track client hosting (provider, plan, renewal).
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** I-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Hosting records per client.
- **Status:** Planned
- **Evidence:** —

### I-04 — Domain management where offered
- **Description:** Track domains and renewal dates.
- **Priority / Release:** Could · R6 (Maintenance and subscriptions)
- **Dependencies:** I-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Renewal reminders sent.
- **Status:** Planned
- **Evidence:** —

### I-05 — Support subscriptions
- **Description:** Paid support plans.
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** I-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Subscription linked to client.
- **Status:** Planned
- **Evidence:** —

### I-06 — Subscription billing
- **Description:** Recurring invoices/charges.
- **Priority / Release:** Must · R6 (Maintenance and subscriptions)
- **Dependencies:** C-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Recurring invoice generated each period.
- **Status:** Planned
- **Evidence:** —

### I-07 — Renewal reminders
- **Description:** Reminders before renewals.
- **Priority / Release:** Must · R6 (Maintenance and subscriptions)
- **Dependencies:** H-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Sent 30/7/1 days before.
- **Status:** Planned
- **Evidence:** —

### I-08 — Bug fixing requests
- **Description:** Bug requests under maintenance plan.
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** F-12
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Counted against plan.
- **Status:** Planned
- **Evidence:** —

### I-09 — Website backup management
- **Description:** Backup schedule and restore for client sites.
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** I-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Backups listed; restore tested.
- **Status:** Planned
- **Evidence:** —

### I-10 — Managed website monitoring
- **Description:** Uptime/SSL monitoring for client sites.
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** I-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Alerts on downtime/SSL expiry.
- **Status:** Planned
- **Evidence:** —

### I-11 — Client support history
- **Description:** All support interactions per client.
- **Priority / Release:** Should · R6 (Maintenance and subscriptions)
- **Dependencies:** F-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** History searchable.
- **Status:** Planned
- **Evidence:** —

## J. Advanced business intelligence

**Business value (category):** Shows what earns money, what converts and where the business is stuck.

**Security baseline (category):** Reports admin-only; exports logged; no client personal data in exported aggregates unless required.

**Testing baseline (category):** Report figures reconciled against ledger/test fixtures; export format tests.

### J-01 — Project performance analytics
- **Description:** On-time, over-budget, revision stats.
- **Priority / Release:** Should · R7 (Business intelligence)
- **Dependencies:** F-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Per-project metrics.
- **Status:** Planned
- **Evidence:** —

### J-02 — Revenue reporting
- **Description:** Revenue by period/service.
- **Priority / Release:** Must · R7 (Business intelligence)
- **Dependencies:** G-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Matches ledger.
- **Status:** Planned
- **Evidence:** —

### J-03 — Outstanding payment reports
- **Description:** Aged receivables.
- **Priority / Release:** Must · R7 (Business intelligence)
- **Dependencies:** C-12
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Aging buckets 0–30/31–60/60+.
- **Status:** Planned
- **Evidence:** —

### J-04 — Client acquisition analytics
- **Description:** Lead sources and channels.
- **Priority / Release:** Should · R7 (Business intelligence)
- **Dependencies:** M-12
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Source captured on every lead.
- **Status:** In development
- **Evidence:** T7a (branch feat/t7a-leads): source (“How did you find us?”: search, social, referral, WhatsApp, portfolio, other) captured on every lead. Remaining: analytics views (R7)

### J-05 — Quotation conversion rates
- **Description:** Quotes sent vs accepted.
- **Priority / Release:** Should · R7 (Business intelligence)
- **Dependencies:** B-18
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Rate by period/category.
- **Status:** Planned
- **Evidence:** —

### J-06 — Project completion rates
- **Description:** Started vs completed.
- **Priority / Release:** Should · R7 (Business intelligence)
- **Dependencies:** F-17
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Rate by period.
- **Status:** Planned
- **Evidence:** —

### J-07 — Service performance analysis
- **Description:** Revenue and margin per service.
- **Priority / Release:** Could · R7 (Business intelligence)
- **Dependencies:** J-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Per-service table.
- **Status:** Planned
- **Evidence:** —

### J-08 — Operational dashboards
- **Description:** Live ops overview.
- **Priority / Release:** Should · R7 (Business intelligence)
- **Dependencies:** G-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Single dashboard page.
- **Status:** Planned
- **Evidence:** —

### J-09 — Financial summaries
- **Description:** Monthly summary.
- **Priority / Release:** Must · R7 (Business intelligence)
- **Dependencies:** G-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Auto-generated each month.
- **Status:** Planned
- **Evidence:** —

### J-10 — Exportable reports
- **Description:** CSV/PDF/Excel export.
- **Priority / Release:** Should · R7 (Business intelligence)
- **Dependencies:** J-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Exports logged.
- **Status:** Planned
- **Evidence:** —

## K. Security and infrastructure

**Business value (category):** Protects clients, money and reputation; required before any client data or payment is handled.

**Security baseline (category):** This category defines the security baseline applied to all others.

**Testing baseline (category):** Automated security tests in CI; dependency scanning; periodic restore and incident drills.

### K-01 — Secure authentication
- **Description:** Auth for admin (R1) and clients (R2).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Sign-in/out, session expiry, secure cookies.
- **Status:** Implemented
- **Evidence:** T3 (PR #5, branch feat/t3-auth): Better Auth 1.7 self-managed on Neon via Drizzle (src/lib/auth/index.ts, /api/auth/*); email+password, public sign-up disabled; owner created by scripts/create-owner.ts (one-time temporary password, forced change at first sign-in); 7-day sessions; secure cookies. scripts/verify-t3.ts: sign-in, sign-out, wrong password 401, sign-up refused. Client accounts reuse it in R2 (F-01)
- **Decisions:** DEC-18, DEC-34

### K-02 — Email verification
- **Description:** Verify email before account use.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** K-01, H-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Unverified users cannot submit/pay.
- **Status:** Planned
- **Evidence:** —

### K-03 — Password recovery
- **Description:** Reset by email link.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-01, H-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Link single-use, expires in 1 hour.
- **Status:** In development
- **Evidence:** T3 (PR #5, branch feat/t3-auth): full reset flow (/auth/forgot-password → link → /auth/reset-password), token 1 h + single-use (second use → 400 INVALID_TOKEN), all sessions revoked on reset; email adapter interface src/lib/email (dev: link logged server-side; production: 503 EMAIL_NOT_CONFIGURED). Remaining: real delivery once Resend is set up (H-01, DEC-35)
- **Decisions:** DEC-35

### K-04 — Administrator MFA
- **Description:** TOTP MFA for admin/owner.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin cannot access panel without MFA.
- **Status:** Implemented
- **Evidence:** T3 (PR #5, branch feat/t3-auth): TOTP MFA (Better Auth twoFactor) + 10 single-use recovery codes shown once at /auth/setup-mfa; requireAdmin() (src/lib/auth/guard.ts) redirects owner/admin to MFA setup before any /admin route loads; verified: /admin blocked until MFA set, TOTP login, recovery code single-use, per-user lockout after repeated bad codes. T4 (PR #6, branch feat/t4-admin-shell): MFA now enforced for every role that may enter /admin (owner, admin, staff) on every /admin route — verified staff without MFA → /auth/setup-mfa

### K-05 — Role-based access control
- **Description:** See G-03.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Server-side checks on every route/action.
- **Status:** Implemented
- **Evidence:** T3 (PR #5, branch feat/t3-auth): server-side role check (owner|admin) in requireAdmin() for /admin. Remaining: full RBAC on every admin route/action (T4). T4 (PR #6, branch feat/t4-admin-shell): requirePermission() (src/lib/auth/guard.ts) on every admin page, layout and server action; forbidden() → HTTP 403; settings server action refused (403) for admin/staff/client with no write and no audit row; service functions re-check with assertCan(). T5 (PR #14, branch feat/t5-content): requirePermission on every content/media page and server action; services re-check assertCan; Draft Mode preview only for content.write; staff/client 403 verified (scripts/verify-t5.ts). T6 (branch feat/t6-pricing-faq): requirePermission(content.write) on /admin/pricing and /admin/content/faqs pages and actions; staff/client 403 verified over HTTP (scripts/verify-t6.ts). T7a (branch feat/t7a-leads): requirePermission on the leads pages (leads.read) and actions (leads.write); client 403 on pages and the status action verified over HTTP. R1b Part 2 (branch feat/r1b-growth): requirePermission on /admin/subscribers and the testimonials admin; the CSV export route checks subscribers.manage and answers 403 without data or audit row

### K-06 — Resource-level permissions
- **Description:** Users access only their own records.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** K-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Tests prove client A cannot read client B data.
- **Status:** Planned
- **Evidence:** —

### K-07 — Database security
- **Description:** Least-privilege DB roles, TLS, no raw SQL injection paths.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Parameterised queries only; separate dev/prod DBs.
- **Status:** In development
- **Evidence:** T2 (PR #4, branch feat/t2-data-foundation): all queries via Drizzle (parameterised); TLS enforced (sslmode=require, channel_binding=require); app connects through pooled URL, migrations through direct URL. Remaining: least-privilege runtime role (app currently uses neondb_owner) and separate dev/prod branches

### K-08 — File upload protection
- **Description:** Type, size, storage isolation.
- **Priority / Release:** Must · R2 (Project acquisition)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** See B-09.
- **Status:** Planned
- **Evidence:** —

### K-09 — Malware scanning where available
- **Description:** Scan uploads before admin download.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** K-08
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Infected files quarantined.
- **Status:** Planned
- **Evidence:** —

### K-10 — Payment webhook verification
- **Description:** Verify provider signatures.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** C-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Unsigned/invalid webhooks rejected and logged.
- **Status:** Planned
- **Evidence:** —

### K-11 — Idempotent payment processing
- **Description:** No double-crediting.
- **Priority / Release:** Must · R3 (Payments and documents)
- **Dependencies:** K-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Replayed webhook does not change balance twice.
- **Status:** Planned
- **Evidence:** —

### K-12 — Encryption
- **Description:** TLS everywhere; sensitive fields encrypted at rest.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** HTTPS only; HSTS; secrets in env vars.
- **Status:** Planned
- **Evidence:** Vercel HTTPS on deploy

### K-13 — Secure sessions
- **Description:** HttpOnly, Secure, SameSite cookies; rotation.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-01
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Session fixation tests pass.
- **Status:** Implemented
- **Evidence:** T3 (PR #5, branch feat/t3-auth): session cookie __Secure-better-auth.session_token: HttpOnly; Secure; SameSite=Lax; Max-Age=604800 (7 days); new token on every sign-in (attacker-set cookie ignored — fixation test passes) and on password change; sign out + sign out everywhere (/revoke-sessions) verified

### K-14 — Rate limiting
- **Description:** Limits on forms, auth, APIs.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Abuse returns 429; contact/newsletter protected.
- **Status:** In development
- **Evidence:** T3 (PR #5, branch feat/t3-auth): database-backed limits (rate_limits table, shared across instances) — sign-in 5/5 min, MFA verify 5/5 min, reset request 3/15 min, reset 5/15 min, change password 5/15 min; verified 429s. Remaining: contact/newsletter/other APIs (T7). T7a (branch feat/t7a-leads): quote form protected without a third-party captcha — hidden honeypot field, minimum fill time (3 s, max 24 h), per-IP limit 3 per 10 min in the shared rate_limits table (atomic upsert); refusals verified by scripts/verify-t7a.ts. Remaining: newsletter (when built), other public APIs. R1b Part 2 (branch feat/r1b-growth): newsletter signup protected — honeypot, minimum fill time, 5 per 10 min per IP (shared rate_limits table); verified by scripts/verify-r1b-growth.ts

### K-15 — Input validation
- **Description:** Schema validation on every input (e.g. Zod).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Invalid input rejected server side.
- **Status:** In development
- **Evidence:** T2 (PR #4, branch feat/t2-data-foundation): Zod validation on seed input (scripts/db/seed.ts) and on every storage input — key, MIME, size cap 25 MB, signed-URL TTL ≤ 1 h (src/lib/storage.ts). Remaining: validation on public forms/admin inputs (T3–T7). T4 (PR #6, branch feat/t4-admin-shell): Zod validation on settings saves and audit-log filter params. T5 (PR #14, branch feat/t5-content): Zod on every content save (field specs; links limited to /path, #anchor, https, mailto, tel; image refs), media uploads (sniffed type, size), action arguments. T6 (branch feat/t6-pricing-faq): Zod on packages (money in minor units, non-negative integers) and FAQs; hand-typed WhatsApp links rejected in every link field (DEC-37); CTA link type validated per kind. T7a (branch feat/t7a-leads): Zod on the quote form (lengths, email, phone pattern, project type must be a published package, budget/currency/source enums), lead status, notes and the new Settings fields. R1b Part 1 (branch feat/r1b-blog): blog rich text sanitised by allowlist (src/lib/blog/richtext.ts) on every save and before render — script/iframe/unknown nodes dropped, event-handler and unknown attributes stripped, javascript:/data:/vbscript:/protocol-relative links removed, images only from the media library; Zod on all post/category fields (slug, date, category reference). R1b Part 2 (branch feat/r1b-growth): Zod on testimonials (rating 1–5 or none, project reference), newsletter signup (email, explicit consent), filter params (unknown values ignored); CSV cells defused against formula injection

### K-16 — Audit logging
- **Description:** Append-only audit log of sensitive actions.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Every admin write logged.
- **Status:** In development
- **Evidence:** T2 (PR #4, branch feat/t2-data-foundation): audit_log table, append-only enforced by trigger (UPDATE/DELETE/TRUNCATE rejected — verified by scripts/verify-t2.ts). Remaining: log every admin write (T4). T3 (PR #5, branch feat/t3-auth): auth audit rows — sign_in, sign_in_failed, mfa_challenge, mfa_failed, mfa_enabled, sign_out, sign_out_everywhere, password_changed, password_reset_requested, password_reset (src/lib/auth/audit.ts); verified by scripts/verify-t3.ts. T4 (PR #6, branch feat/t4-admin-shell): settings saves audited (settings.updated with before/after). T5 (PR #14, branch feat/t5-content): audit rows for content.section.* (draft_saved, published, draft_discarded), content.item.* (created, draft_saved, published, unpublished, reordered, deleted) and media.* (uploaded, replaced, alt_updated, deleted). T6 (branch feat/t6-pricing-faq): package and FAQ writes audited as content.item.* (created, published, deleted verified by scripts/verify-t6.ts). T7a (branch feat/t7a-leads): lead.created, lead.status_changed (who, from → to) and lead.note_added audited; shown as the lead's history; Settings CV/WhatsApp-button changes audited with settings.updated. R1b Part 1 (branch feat/r1b-blog): blog post and category changes audited as content.item.* (created, draft_saved, published, deleted verified). R1b Part 2 (branch feat/r1b-growth): testimonials audited (content.item.*); newsletter.signup, newsletter.unsubscribed, newsletter.exported (who, status, row count) — audit rows hold subscriber ids, never email addresses

### K-17 — Database backups
- **Description:** Automated backups with retention.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Point-in-time restore available; restore tested.
- **Status:** In development
- **Evidence:** T2 (PR #4, branch feat/t2-data-foundation): Neon point-in-time restore available, history retention 6 h (21600 s, project setting). Remaining: decide retention for prod and run a restore test (T8 backups check)

### K-18 — Disaster recovery
- **Description:** Documented recovery plan and drills.
- **Priority / Release:** Should · R3 (Payments and documents)
- **Dependencies:** K-17
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Recovery drill completed before payments go live.
- **Status:** Planned
- **Evidence:** —

### K-19 — Monitoring and alerting
- **Description:** Error tracking and uptime alerts.
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Errors reported; downtime alerts to owner.
- **Status:** Planned
- **Evidence:** —

### K-20 — Dependency security scanning
- **Description:** Automated dependency alerts.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Dependabot (or equivalent) enabled; CI fails on critical.
- **Status:** Implemented
- **Evidence:** T2 (PR #4, branch feat/t2-data-foundation): .github/dependabot.yml (npm weekly, GitHub Actions monthly); CI .github/workflows/ci.yml runs lint, typecheck, build and fails on critical npm audit findings. Dependabot security alerts must also be on in the GitHub repo settings

### K-21 — Automated security testing
- **Description:** Security tests in CI.
- **Priority / Release:** Should · R2 (Project acquisition)
- **Dependencies:** K-20
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Auth/permission tests run on every PR.
- **Status:** Planned
- **Evidence:** —

### K-22 — Performance testing
- **Description:** Lighthouse and load tests.
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Lighthouse ≥90; load test before R3.
- **Status:** Planned
- **Evidence:** —

### K-23 — Scalability planning
- **Description:** Architecture notes for growth.
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Documented in ARCHITECTURE.md.
- **Status:** Planned
- **Evidence:** —

## L. Future platform expansion

**Business value (category):** Scales Soft CODES from one founder to an agency platform with apps and integrations.

**Security baseline (category):** API keys scoped and revocable; OAuth for third parties; mobile apps use the same auth and permission model.

**Testing baseline (category):** Contract tests for API; mobile e2e smoke tests; load tests before opening API.

### L-01 — Multiple payment providers (expansion)
- **Description:** More providers beyond R3.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** C-08
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Added via provider abstraction.
- **Status:** Planned
- **Evidence:** —

### L-02 — Additional supported currencies
- **Description:** Beyond USD/SLE.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** C-09
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Currency added in settings.
- **Status:** Planned
- **Evidence:** —

### L-03 — Multiple staff accounts
- **Description:** More staff with roles.
- **Priority / Release:** Should · R8 (Platform expansion)
- **Dependencies:** G-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Unlimited staff with roles.
- **Status:** Planned
- **Evidence:** —

### L-04 — Agency/team management
- **Description:** Teams, assignments, workloads.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** L-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Team view.
- **Status:** Planned
- **Evidence:** —

### L-05 — Native Android application
- **Description:** Client/owner app for Android.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** L-13
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** App store release.
- **Status:** Planned
- **Evidence:** —

### L-06 — Native iOS application
- **Description:** Client/owner app for iOS.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** L-13
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** App store release.
- **Status:** Planned
- **Evidence:** —

### L-07 — Advanced AI automation
- **Description:** AI drafting of quotes, replies, reports.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** E-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Human approval before sending.
- **Status:** Planned
- **Evidence:** —

### L-08 — Automated website deployment
- **Description:** Deploy client sites from the platform.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** I-03
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** One-click deploy to hosting.
- **Status:** Planned
- **Evidence:** —

### L-09 — Client website analytics
- **Description:** Show clients their site traffic.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** I-10
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Per-client analytics view.
- **Status:** Planned
- **Evidence:** —

### L-10 — Advanced collaboration
- **Description:** Real-time co-editing, mentions.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** F-07
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Defined later.
- **Status:** Planned
- **Evidence:** —

### L-11 — Advanced subscription management
- **Description:** Upgrades, proration, dunning.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** I-06
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Defined later.
- **Status:** Planned
- **Evidence:** —

### L-12 — Third-party integrations
- **Description:** Accounting, CRM, calendar.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** L-13
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Defined later.
- **Status:** Planned
- **Evidence:** —

### L-13 — API access for approved integrations
- **Description:** Public API with scoped keys.
- **Priority / Release:** Could · R8 (Platform expansion)
- **Dependencies:** K-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Documented, rate-limited API.
- **Status:** Planned
- **Evidence:** —

## M. Site features agreed in chat (2026-11-19)

**Business value (category):** Features chosen by the owner in the website questionnaire.

**Security baseline (category):** As per category A unless stated.

**Testing baseline (category):** As per category A unless stated.

### M-01 — Light and dark themes
- **Description:** Onyx/Graphite/Platinum/Jet Black/Ash palette, toggle, system default.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Toggle works; no flash; AA contrast both themes.
- **Status:** Implemented
- **Evidence:** PR #2

### M-02 — Hero portrait
- **Description:** Owner photo in hero.
- **Priority / Release:** Must · R0 (Foundation site)
- **Dependencies:** A-02
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner-approved photo shown, face not cropped.
- **Status:** In development
- **Evidence:** Temporary photo in commit b290c8f; owner will supply a new photo (DEC-20). T1 (PR #3, branch feat/hero-koala): per DEC-29/DEC-30 the hero now shows the koala mascot and the owner portrait moved to the About section (interim layout, TODO(DEC-30)); awaiting owner photo and About layout reference. T5 (PR #14, branch feat/t5-content): portrait editable in Admin → Content → Profile & portrait (media library)
- **Decisions:** DEC-09, DEC-20, DEC-29, DEC-30

### M-03 — Quote request form
- **Description:** Short form: name, email, project type, budget, deadline, details; emailed to owner. Precursor to the wizard (B-01).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** H-01, K-14, K-15
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Submission stored and emailed; spam protected.
- **Status:** In development
- **Evidence:** T7a (branch feat/t7a-leads): quote request form on /contact and the home contact section — name, email, phone/WhatsApp, company, project type (published packages + Other; pre-selected from Pricing “Request a quote”), budget range in USD or SLE, deadline, details, how they found us. Server action, Zod validation, stored in leads with a reference number (SC-LEAD-YYYY-NNNN, atomic per-year counter) shown on success; owner notified in the admin (stored notification + unread badge). Spam protected (K-14). Proof: scripts/verify-t7a.ts (npm run t7a:verify, 46 checks), tests/t7a.test.ts; screenshots docs/screenshots/t7a-contact-*. Remaining: email to the owner via Resend (T7b, DEC-40)
- **Decisions:** DEC-37, DEC-40

### M-04 — Downloadable CV
- **Description:** PDF CV button for employers.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** CV PDF downloadable; uploaded/replaced from admin.
- **Status:** Implemented
- **Evidence:** T7a (branch feat/t7a-leads): CV slot — Settings → “CV file” picks a public PDF from the media library (upload/replace in Media); “Download CV” shows on the hero and the About page (home + /about) only when a CV is set; the file can't be deleted while in use. Verified with a sample PDF (served as application/pdf). The owner's real CV file is a T7b input (DEC-40). Screenshots docs/screenshots/t7a-home-hero-*, t7a-about-*, t7a-admin-settings-*
- **Decisions:** DEC-40

### M-05 — Blog / articles
- **Description:** Posts with categories, cover images, SEO; written in admin.
- **Priority / Release:** Must · R1b (Content growth)
- **Dependencies:** A-15
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner publishes posts from admin; RSS + sitemap entries.
- **Status:** Implemented
- **Evidence:** R1b Part 1 (branch feat/r1b-blog): Admin → Blog — posts (title, slug, excerpt, cover image from Media, category, tags, rich text body, SEO title/description, publish date, featured, draft/published, preview) and categories, owner + admin only (content.write). Rich text per DEC-42: Tiptap editor (headings, bold/italic, lists, links, images from Media, code blocks, quotes), stored as JSON, allowlist-sanitised on save and again on render (no raw HTML). Public: /blog (featured first, newest first, category filter as plain links, 9 per page), /blog/[slug] (reading time, cover, related posts), home “Latest posts” (hidden when none), nav link. Future-dated posts stay hidden until their day. SEO: per-post metadata + OG image (cover), BlogPosting structured data, posts in the sitemap, RSS at /blog/rss.xml. Seed: one draft “Welcome to the Soft CODES blog” (DEC-21), nothing published. Proof: scripts/verify-r1b-blog.ts (npm run r1b-blog:verify, 47 checks), tests/r1b-blog.test.ts; screenshots docs/screenshots/r1b-blog-*
- **Decisions:** DEC-21, DEC-41, DEC-42

### M-06 — WhatsApp chat button
- **Description:** Floating button opening WhatsApp chat.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Button visible on all pages, not covering content on mobile.
- **Status:** Implemented
- **Evidence:** T7a (branch feat/t7a-leads): floating WhatsApp button on every public page (not in the admin), link from the Settings number (DEC-37), on/off toggle in Settings; small round button bottom-right, footer gets extra bottom padding on mobile so nothing ends up hidden under it. Proof: scripts/verify-t7a.ts (follows a number change, hidden when switched off, absent in admin); screenshots docs/screenshots/t7a-home-hero-*, t7a-contact-*
- **Decisions:** DEC-37

### M-07 — Admin panel
- **Description:** Owner panel for all content and settings (Neon backend, owner decision).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** K-01, K-04, K-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Owner signs in with MFA and edits all content.
- **Status:** In development
- **Evidence:** T4 (PR #6, branch feat/t4-admin-shell): admin shell — sidebar (Dashboard, Content, Projects, Pricing, Leads, Media, Audit log, Settings; later items marked Coming in T5/T6/T7), top bar (user, theme toggle, sign out), collapsible drawer on mobile; MFA required on every /admin route. Remaining: content editing (T5–T7). T5 (PR #14, branch feat/t5-content): Content, Projects and Media sections live in the admin (no longer "Coming in T5")
- **Decisions:** DEC-15

### M-08 — Neon database
- **Description:** Postgres on Neon (owner decision).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Dev and prod databases; migrations in repo.
- **Status:** In development
- **Evidence:** T2 (PR #4, branch feat/t2-data-foundation): Neon project delicate-paper-51580609 (Postgres 18, aws-us-east-2), branch production; Drizzle schema src/db/schema.ts, migrations drizzle/0000_init.sql + 0001_audit_log_append_only.sql applied; seed from src/content/site.ts (scripts/db/seed.ts); app client src/db/index.ts (node-postgres + attachDatabasePool). Remaining: separate dev branch (only production exists)
- **Decisions:** DEC-10, DEC-22, DEC-33

### M-09 — Separate file storage
- **Description:** Storage service for images/files (provider to be decided).
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Admin uploads images; served via CDN.
- **Status:** In development
- **Evidence:** T2 (PR #4, branch feat/t2-data-foundation): Neon object storage (supersedes R2) — buckets assets (private) + public-assets (public_read) in neon.ts; helper src/lib/storage.ts (upload, publicUrl, signed expiring URL, remove); scripts/verify-t2.ts proved private object → signed URL 200, unsigned 403, expired 403, delete → 404; media table (key, visibility, mime, size). Remaining: admin upload UI + CDN (T5). T5 (PR #14, branch feat/t5-content): media library /admin/media — upload (JPEG/PNG/WebP/GIF/AVIF ≤ 5 MB, PDF ≤ 15 MB), byte-level MIME sniffing (SVG refused), alt text, replace (same id, new key), delete (refused while in use), public bucket for site images (Cache-Control immutable) / private for others (signed URLs); images on the site via next/image (media:<id> references). Verified upload → library → used in a project → public page. Remaining: confirm next/image CDN delivery on the Vercel deploy (T8; sandbox has no direct DNS)
- **Decisions:** DEC-16 (superseded), DEC-32, DEC-33, DEC-32

### M-10 — Cal.com booking
- **Description:** Owner decision for A-11.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** A-11
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** See A-11.
- **Status:** Planned
- **Evidence:** —

### M-11 — Project filters
- **Description:** Filter portfolio by type.
- **Priority / Release:** Should · R1b (Content growth)
- **Dependencies:** A-05
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Filter by website/platform/app/branding; URL reflects filter.
- **Status:** Implemented
- **Evidence:** T5 (PR #14, branch feat/t5-content): data ready — projects have a filter type (website/platform/app/branding/other) and tags, editable in the admin; filter UI still planned (R1b). R1b Part 2 (branch feat/r1b-growth): /projects filters by type (website, platform, app, … — only types in use) and topic (tags from T5 fields); URL reflects the filter (?type=, ?tag=), plain links so it works without JavaScript (verified with JS disabled); unknown values ignored; empty state with the koala mascot and a “show all” link; labels editable in Admin → Content → Page metadata. Screenshots docs/screenshots/r1b-growth-projects-*
- **Decisions:** DEC-41

### M-12 — Analytics
- **Description:** Vercel Analytics (privacy-friendly).
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Page views and events visible in Vercel.
- **Status:** Planned
- **Evidence:** —

### M-13 — Newsletter signup
- **Description:** Collect emails for blog updates.
- **Priority / Release:** Should · R1b (Content growth)
- **Dependencies:** H-01, K-14
- **Security:** Double opt-in; consent timestamp stored.
- **Testing:** Category baseline.
- **Acceptance criteria:** Double opt-in; unsubscribe link; stored in DB/provider.
- **Status:** In development
- **Evidence:** R1b Part 2 (branch feat/r1b-growth): signup form in the footer and on the blog (email + consent checkbox), spam protected (honeypot, minimum fill time, 5 per 10 min per IP); stored as “pending” with consent time and the exact consent wording shown on the site (DEC-43); duplicate addresses get the same answer (no account enumeration), re-signup after unsubscribing goes back to pending with fresh consent. Admin → Subscribers (owner + admin, subscribers.manage): status filter (pending/confirmed/unsubscribed), CSV export (formula-injection safe) — every export audited with its row count. Unsubscribe token per subscriber + public /newsletter/unsubscribe page (button press required, noindex), ready for the email links. Remaining (T7b): double opt-in email and sending via Resend
- **Decisions:** DEC-43

### M-14 — Process section
- **Description:** Discover → Design → Build → Launch → Support.
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Section on home and services page.
- **Status:** In development
- **Evidence:** T5 (PR #14, branch feat/t5-content): Process section (Discover → Design → Build → Launch → Support) editable in Admin → Content → Process, placeholder copy, hidden until switched on (DEC-21 approval); renders on the home page when visible. Remaining: owner-approved copy; services page placement
- **Decisions:** DEC-21

### M-15 — 'From' pricing display
- **Description:** Owner decision for A-08.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** A-08
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** See A-08.
- **Status:** Implemented
- **Evidence:** T6 (branch feat/t6-pricing-faq): see A-08 and G-06 — 'from' prices per DEC-38 on /pricing and the home teaser
- **Decisions:** DEC-38

### M-16 — Vercel deployment
- **Description:** Production hosting.
- **Priority / Release:** Must · R1a (Admin CMS + leads + launch)
- **Dependencies:** —
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Live URL; NEXT_PUBLIC_SITE_URL set; auto-deploy from main.
- **Status:** Planned
- **Evidence:** Not yet deployed

### M-17 — Custom domain
- **Description:** Own domain + Search Console.
- **Priority / Release:** Should · R1a (Admin CMS + leads + launch)
- **Dependencies:** M-16
- **Security:** Category baseline.
- **Testing:** Category baseline.
- **Acceptance criteria:** Domain connected with HTTPS.
- **Status:** Planned
- **Evidence:** —
