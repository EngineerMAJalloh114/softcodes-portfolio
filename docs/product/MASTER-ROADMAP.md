# Soft CODES — Master Roadmap (strict)

Status: **Approved to follow** · Created 2026-11-20 · Source of truth with `FEATURE-REGISTRY.md` and `DECISIONS.md`.

This roadmap fixes the **order** of all remaining work. Every one of the 205 registry features is placed exactly once: 28 are already Implemented (Phase 0); the other 177 are assigned below to a build task or a launch task. A generator check fails if any feature is missing or duplicated.

## Rules (non-negotiable)

1. **One task at a time, in the order below.** No skipping ahead and no parallel tasks unless this file says so.
2. **Every task runs the same cycle:** plan shown to owner → owner approves → branch from `main` → Neon branch for DB changes (DEC-45) → build → unit tests + task verify script + all earlier suites → screenshots (1440/390, both themes) → PR → owner review → merge commit → production migration after merge → registry Status + Evidence updated.
3. **Decisions:** any business, UX, security, payment, integration or architecture choice is presented as options + recommendation, owner decides, it is recorded as a DEC before code is written. A task with an open decision does not start until it is answered.
4. **No scope changes inside a task.** New ideas become a change request: new DEC entry + this file updated + registry entry added. Features are never removed (DEC-13).
5. **Definition of done for a task:** acceptance criteria of every listed feature met, CI green on `main` after merge, registry updated, owner sign-off.
6. **Phase gate:** a phase closes only when every task is done, all verify suites pass on `main`, and the owner signs off. The next phase starts only after that.
7. **Launch track (L1–L3)** runs only when the owner supplies the inputs. It may be slotted between any two build tasks, but its *must happen before* conditions are hard blockers.
8. **UI polish** is deferred (owner decision 2026-11-19) and happens at the checkpoint marked below; until then, visual changes are limited to what a task needs.

## Progress at a glance

| Phase | Tasks | Features | Status |
|---|---|---|---|
| P0 Foundation (done) | — | 28 | ✅ Complete |
| P1 Close Release 1 (no accounts needed) | 3 | 14 | ⏳ Next |
| P2 Release 2 — Project acquisition | 8 | 38 | ⏳ Waiting |
| P3 Release 3 — Payments & official documents | 8 | 39 | ⏳ Waiting |
| P4 Release 4 — Client portal & delivery | 6 | 22 | ⏳ Waiting |
| P5 Release 5 — Design previews & AI | 3 | 12 | ⏳ Waiting |
| P6 Release 6 — Maintenance & subscriptions | 3 | 12 | ⏳ Waiting |
| P7 Release 7 — Business intelligence | 3 | 11 | ⏳ Waiting |
| P8 Release 8 — Platform expansion | 6 | 15 | ⏳ Waiting |
| Launch track L1–L3 | 3 | 14 | ⏸ Parked (owner inputs) |
| **Total** | | **205** | |

## Order of execution

`P1.1 → P1.2 → P1.3 → [UI polish checkpoint] → P2.1 … P2.8 → P3.1 … P3.8 → P4.1 … P4.6 → P5.1 … P5.3 → P6.1 … P6.3 → P7.1 … P7.3 → P8.1 … P8.6`

Launch tasks slot in when inputs arrive: **L1 before P3.7**, **L2 before public client sign-up and any emailed invoice**, L3 any time.

## P1 — Close Release 1 (no accounts needed)

**Exit criteria:** Every R1 feature that does not need Vercel, a domain or Cal.com is finished and marked Implemented.

### P1.1 — Owner content inputs

Owner supplies the About layout reference and new portrait; owner approves the Process section copy. Claude Code applies them.

**Features:** A-03 About page, M-02 Hero portrait, M-14 Process section

**Before start:** Owner: About layout + photo, Process copy approval

**Status:** Not started

### P1.2 — Security & data hardening

Least-privilege DB roles and TLS check; Neon point-in-time restore drill on a test branch; audit-log, validation and rate-limit coverage review across every form and admin action; close out the CMS, admin, database and storage features.

**Features:** K-07 Database security, K-17 Database backups, K-15 Input validation, K-16 Audit logging, K-14 Rate limiting, A-15 Content management, G-14 Content management (admin), M-07 Admin panel, M-08 Neon database, M-09 Separate file storage

**Status:** Not started

### P1.3 — Scalability & SEO groundwork

Write ARCHITECTURE.md scalability notes (caching, DB pooling, storage, job queue); finish structured data on all public pages (Organization, Person, BreadcrumbList).

**Features:** K-23 Scalability planning

**Status:** Not started

### ◆ UI polish checkpoint

After P1 closes, the owner reviews the full public site and admin and gives polish recommendations. Position is an open owner decision: here, or after P2, or at the very end.

## P2 — Release 2 — Project acquisition

**Exit criteria:** A visitor goes from the planning wizard to an accepted, versioned quotation PDF; admin reviews everything in the panel.

### P2.1 — Jobs & notifications foundation

Background job runner (retries, failure list in admin), in-app notification centre, admin activity feed.

**Features:** H-11 Background processing, H-02 In-app notifications, G-18 Activity monitoring

**Status:** Not started

### P2.2 — Client accounts

Client sign-up/sign-in, email verification (link logged until Resend is live — L2), resource-level permissions, client dashboard, admin client records.

**Features:** F-01 Secure client accounts, K-02 Email verification, K-06 Resource-level permissions, F-02 Client dashboard, G-04 Client management

**Before start:** Public client sign-up stays switched off until L2 (email) is done

**Status:** Not started

### P2.3 — Planning wizard

Admin-managed categories and branching questions; business, technical, design, budget/timeline and reference-site steps; validation; autosave; resume from another device.

**Features:** B-01 Interactive project planning wizard, B-02 Dynamic project categories, B-03 Conditional questions, B-04 Business information collection, B-05 Technical requirements collection, B-06 Design preference selection, B-07 Budget and timeline collection, B-08 Reference website submission, B-12 Requirement validation, B-10 Autosave, B-11 Resume incomplete applications

**Status:** Not started

### P2.4 — Secure uploads

Wizard file/image uploads to private storage, type/size/MIME checks, malware scan where available.

**Features:** B-09 File and image uploads, K-08 File upload protection, K-09 Malware scanning where available

**Before start:** Decision: malware-scanning service (or defer with reason)

**Status:** Not started

### P2.5 — Summary & estimates

Client-facing summary with edit-before-submit; automatic non-binding estimate range from pricing rules.

**Features:** B-13 Project summary, B-14 Automated project estimates

**Before start:** Decision: estimate rules per category

**Status:** Not started

### P2.6 — Document engine

Server-side PDF engine, SC-numbering per type/year, company logo and branding settings, signed expiring download links, document versions.

**Features:** D-07 PDF generation, D-08 Unique document numbering, D-09 Company logo, D-13 Secure downloads, D-14 Document versioning, G-11 Company branding configuration

**Status:** Not started

### P2.7 — Review & quotations

Admin review queue; official quotation from a request; revisions with history; quotation management; expiry reminders.

**Features:** B-15 Administrator review, B-16 Final quotations, D-01 Professional quotations, G-07 Quotation management, B-17 Quotation revisions, H-04 Quotation reminders

**Before start:** Decision: quotation terms & validity period

**Status:** Not started

### P2.8 — Client acceptance & security tests

Online acceptance (user, time, IP, version recorded); automated auth/permission security tests on every PR.

**Features:** B-18 Client acceptance, K-21 Automated security testing

**Status:** Not started

## P3 — Release 3 — Payments & official documents

**Exit criteria:** A deposit is paid and verified, the ledger balances, and every invoice/receipt is issued and verifiable.

### P3.1 — Ledger foundation

Append-only ledger in integer minor units per currency, transaction references, hash-chained records, payment history, balance tracking.

**Features:** C-09 Multiple currencies, C-14 Transaction references, C-16 Financial audit trails, D-17 Tamper-evident financial records, C-11 Payment history, C-12 Outstanding balance tracking

**Before start:** Decision: payment currencies (DEC-O7)

**Status:** Not started

### P3.2 — Deposits & invoices

Configurable deposit policy (default 50%), proforma, deposit and final invoices, auto-generated on acceptance/completion.

**Features:** C-01 50% initial deposit, C-02 Configurable deposit policy, D-02 Proforma invoices, D-03 Deposit invoices, D-04 Final invoices, H-08 Automated document generation

**Before start:** Decision: deposit policy (DEC-O8)

**Status:** Not started

### P3.3 — Manual payments

Bank transfer and mobile money (reference + proof upload), admin verification queue, automatic receipts.

**Features:** C-04 Manual bank transfers, C-05 Supported mobile money payments, C-06 Payment verification, G-08 Payment verification (admin), D-05 Payment receipts, G-10 Receipt management

**Before start:** Owner: bank / Orange Money / Africell details

**Status:** Not started

### P3.4 — Reconciliation, refunds, statements

Match payments to invoices, refunds with credit notes, statements of account, invoice management.

**Features:** C-07 Payment reconciliation, C-10 Refund management, C-13 Financial statements, D-06 Financial statements (documents), G-09 Invoice management

**Status:** Not started

### P3.5 — Official stamp, signature, verification

Stamp and signature (owner-only, MFA), template settings, public verification page, document history.

**Features:** D-10 Official company stamp, D-11 Authorised company signature, G-12 Company stamp and signature management, D-12 Configurable document templates, D-15 Document verification, D-16 Document history

**Before start:** Owner: stamp + signature images

**Status:** Not started

### P3.6 — Payment notifications & reminders

Payment status notifications, unpaid-invoice reminders, editable notification templates.

**Features:** C-15 Payment notifications, H-03 Payment reminders, G-15 Notification management

**Status:** Not started

### P3.7 — Online payments

Provider abstraction, first online provider, webhook signature checks, idempotent processing, automatic status updates.

**Features:** C-03 Online payment integration, C-08 Multiple payment providers, K-10 Payment webhook verification, K-11 Idempotent payment processing, H-09 Automated payment status updates

**Before start:** Decision: provider (DEC-O5, research first); needs L1 live site for webhooks

**Status:** Not started

### P3.8 — Financial reporting & disaster recovery

Revenue/outstanding/payments reports reconciled to ledger; written recovery plan + restore drill.

**Features:** G-16 Financial reporting, K-18 Disaster recovery

**Status:** Not started

## P4 — Release 4 — Client portal & delivery

**Exit criteria:** A project runs end-to-end in the portal from deposit to handover.

### P4.1 — Projects & milestones

Project dashboard, admin project management, timelines, milestones, progress, milestone/deadline notifications, automatic status transitions.

**Features:** F-03 Project dashboard, G-05 Project management, F-04 Project timelines, F-05 Development milestones, F-06 Progress tracking, H-05 Project milestone notifications, H-06 Deadline notifications, H-10 Automated project status transitions

**Status:** Not started

### P4.2 — Collaboration

Messaging, file sharing, deliverables, approvals, approval notifications, revision tracking.

**Features:** F-07 Client messaging, F-08 File sharing, F-09 Deliverable management, F-10 Client approvals, H-07 Approval notifications, F-13 Revision tracking

**Status:** Not started

### P4.3 — Support & bugs

Support tickets and bug reports with screenshots.

**Features:** F-11 Support requests, F-12 Bug reporting

**Status:** Not started

### P4.4 — Contracts & e-signatures

Contract generated from the accepted quotation; online signature with hash, time and IP.

**Features:** F-15 Digital contracts, F-16 Electronic signatures

**Before start:** Decision: contract terms template

**Status:** Not started

### P4.5 — Completion & handover

Completion sign-off, final invoice trigger, secure handover after balance paid, client project history.

**Features:** F-17 Project completion, F-18 Final handover, F-19 Client project history

**Status:** Not started

### P4.6 — Staff management

Invite and remove staff with roles.

**Features:** G-02 Staff management

**Status:** Not started

## P5 — Release 5 — Design previews & AI

**Exit criteria:** Clients approve design versions after deposit; previews are blocked before it.

### P5.1 — Preview core

Deposit-gated access, admin-created designs, website and dashboard previews, device toggle, preview management.

**Features:** E-10 Preview access control, E-04 Administrator-created designs, E-01 Personalised website previews, E-02 Application dashboard previews, E-05 Responsive design previews, G-13 Preview management

**Status:** Not started

### P5.2 — Review loop

Design versions, pinned feedback, counted revision requests, approvals.

**Features:** E-06 Design versioning, E-07 Client feedback, E-08 Revision requests, E-09 Design approvals

**Status:** Not started

### P5.3 — AI assistance

AI concept options (admin-reviewed) and AI project consultant on the site.

**Features:** E-03 AI-assisted design concepts, E-11 AI project consultant

**Before start:** Decision: AI provider + budget

**Status:** Not started

## P6 — Release 6 — Maintenance & subscriptions

**Exit criteria:** A client subscribes to a plan and is billed automatically.

### P6.1 — Plans & billing

Maintenance and support plans, subscription billing, renewal reminders.

**Features:** I-01 Website maintenance packages, I-02 Application maintenance, I-05 Support subscriptions, I-06 Subscription billing, I-07 Renewal reminders

**Before start:** Decision: plan prices

**Status:** Not started

### P6.2 — Client infrastructure tracking

Hosting, domains, backups, uptime/SSL monitoring, maintenance notices.

**Features:** I-03 Hosting management, I-04 Domain management where offered, I-09 Website backup management, I-10 Managed website monitoring, H-12 Scheduled maintenance notifications

**Status:** Not started

### P6.3 — Support history

Bug-fix requests under plans; full support history per client.

**Features:** I-08 Bug fixing requests, I-11 Client support history

**Status:** Not started

## P7 — Release 7 — Business intelligence

**Exit criteria:** Every report reconciles with the ledger and exports cleanly.

### P7.1 — Financial reports

Revenue, receivables aging, monthly summaries.

**Features:** J-02 Revenue reporting, J-03 Outstanding payment reports, J-09 Financial summaries

**Status:** Not started

### P7.2 — Funnel & performance

Lead sources, quotation conversion, completion rates, project and service performance.

**Features:** J-04 Client acquisition analytics, J-05 Quotation conversion rates, J-06 Project completion rates, J-01 Project performance analytics, J-07 Service performance analysis

**Status:** Not started

### P7.3 — Dashboards & exports

Operational dashboard, business analytics, CSV/PDF/Excel exports (audited).

**Features:** J-08 Operational dashboards, J-10 Exportable reports, G-17 Business analytics

**Status:** Not started

## P8 — Release 8 — Platform expansion

**Exit criteria:** Each feature is specified in detail when this phase starts.

### P8.1 — Payments & currencies expansion

More providers and currencies.

**Features:** L-01 Multiple payment providers (expansion), L-02 Additional supported currencies

**Status:** Not started

### P8.2 — Team & agency

Multiple staff accounts, teams and workloads.

**Features:** L-03 Multiple staff accounts, L-04 Agency/team management

**Status:** Not started

### P8.3 — API & integrations

Scoped public API, third-party integrations.

**Features:** L-13 API access for approved integrations, L-12 Third-party integrations

**Status:** Not started

### P8.4 — Mobile apps

Android and iOS apps on the same auth/permissions.

**Features:** L-05 Native Android application, L-06 Native iOS application

**Status:** Not started

### P8.5 — AI & automation

AI automation, automated deployment, prototyping, code generation.

**Features:** L-07 Advanced AI automation, L-08 Automated website deployment, E-12 Future automated website prototyping, E-13 Future AI-assisted source-code generation

**Status:** Not started

### P8.6 — Advanced client features

Client site analytics, real-time collaboration, advanced subscriptions.

**Features:** L-09 Client website analytics, L-10 Advanced collaboration, L-11 Advanced subscription management

**Status:** Not started

## Launch track (parked)

| Task | Needs from owner | Scope | Features | Must happen before |
|---|---|---|---|---|
| **L1 Go live on Vercel** | Vercel account (+ optional Sentry) | Deploy, env vars, production migrations on merge (DEC-45), Vercel Analytics, HTTPS/HSTS + security headers, Sentry, Lighthouse/load tests, image-delivery re-check. | M-16, M-12, K-12, K-19, K-22 | Before P3.7 (webhooks need a public URL) and before any public client sign-up |
| **L2 Domain + email** | A domain name + Resend account | Custom domain, Resend adapter (quote alerts, password reset, newsletter double opt-in, client email verification), Search Console. | M-17, H-01, K-03, M-03, M-13, A-12 | Before public client sign-up (P2.2) and before sending any invoice/receipt email |
| **L3 Call booking** | Cal.com username + event type | Cal.com embed on 'Book a call' and in the client dashboard. | A-11, F-14, M-10 | Any time |

## Phase 0 — Already implemented

A-01 Professional company website, A-02 Homepage, A-04 Services, A-05 Portfolio, A-06 Case studies, A-07 Technology showcase, A-08 Pricing information, A-09 FAQs, A-10 Contact, A-13 Accessibility, A-14 Responsive layouts, A-16 Customer testimonials and reviews, G-01 Owner dashboard, G-03 Role-based permissions, G-06 Pricing management, G-19 Audit logs, G-20 Administrative settings, K-01 Secure authentication, K-04 Administrator MFA, K-05 Role-based access control, K-13 Secure sessions, K-20 Dependency security scanning, M-01 Light and dark themes, M-04 Downloadable CV, M-05 Blog / articles, M-06 WhatsApp chat button, M-11 Project filters, M-15 'From' pricing display

## Changing this roadmap

Only by owner decision: add a DEC entry, update this file in the same PR, keep every feature ID. Completed tasks are never renumbered.
