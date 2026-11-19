# Soft CODES — Master Roadmap

Status: **DRAFT for owner review** · 2026-11-19

Releases are ordered by dependency. Security (category K) ships with the first release that needs it, never later. Each release closes only when its exit criteria pass.

## R0 — Foundation site

**Scope:** Static public site, brand, themes.

**Exit criteria:** Done in repo; deploy pending

**Features (12):**

- **Must:** A-01 Professional company website, A-02 Homepage, A-04 Services, A-05 Portfolio, A-06 Case studies, A-10 Contact, A-12 SEO, A-13 Accessibility, A-14 Responsive layouts, M-01 Light and dark themes, M-02 Hero portrait
- **Should:** A-07 Technology showcase

## R1a — Admin CMS + leads + launch

**Scope:** Neon + Drizzle, Better Auth + MFA, custom admin, content management, pricing (USD + SLE), FAQs, About, CV, quote form, Cal.com, WhatsApp, analytics, Sentry, process section, security baseline, Vercel deployment.

**Exit criteria:** Owner edits all content without code; leads stored in admin (email delivery once domain is set); security baseline (auth, MFA, audit log, rate limits, backups) live; site deployed.

**Features (40):**

- **Must:** A-03 About page, A-08 Pricing information, A-11 Consultation booking, A-15 Content management, G-01 Owner dashboard, G-03 Role-based permissions, G-06 Pricing management, G-14 Content management (admin), G-19 Audit logs, G-20 Administrative settings, H-01 Transactional emails, K-01 Secure authentication, K-03 Password recovery, K-04 Administrator MFA, K-05 Role-based access control, K-07 Database security, K-12 Encryption, K-13 Secure sessions, K-14 Rate limiting, K-15 Input validation, K-16 Audit logging, K-17 Database backups, K-20 Dependency security scanning, M-03 Quote request form, M-04 Downloadable CV, M-06 WhatsApp chat button, M-07 Admin panel, M-08 Neon database, M-09 Separate file storage, M-10 Cal.com booking, M-15 'From' pricing display, M-16 Vercel deployment
- **Should:** A-09 FAQs, F-14 Consultation scheduling, K-19 Monitoring and alerting, K-22 Performance testing, K-23 Scalability planning, M-12 Analytics, M-14 Process section, M-17 Custom domain

## R1b — Content growth

**Scope:** Blog, newsletter (own DB, sent via Resend), testimonials, project filters.

**Exit criteria:** Owner publishes posts and approves testimonials from admin; newsletter double opt-in works.

**Features (4):**

- **Must:** M-05 Blog / articles
- **Should:** A-16 Customer testimonials and reviews, M-11 Project filters, M-13 Newsletter signup

## R2 — Project acquisition

**Scope:** Client accounts, planning wizard, uploads, autosave, estimates, admin review, quotations, revisions, acceptance, PDF engine, numbering.

**Exit criteria:** A visitor goes from wizard to an accepted quotation PDF; admin reviews in panel.

**Features (38):**

- **Must:** B-01 Interactive project planning wizard, B-02 Dynamic project categories, B-03 Conditional questions, B-04 Business information collection, B-05 Technical requirements collection, B-07 Budget and timeline collection, B-09 File and image uploads, B-10 Autosave, B-12 Requirement validation, B-13 Project summary, B-14 Automated project estimates, B-15 Administrator review, B-16 Final quotations, B-17 Quotation revisions, B-18 Client acceptance, D-01 Professional quotations, D-07 PDF generation, D-08 Unique document numbering, D-09 Company logo, D-13 Secure downloads, D-14 Document versioning, F-01 Secure client accounts, F-02 Client dashboard, G-04 Client management, G-07 Quotation management, H-11 Background processing, K-02 Email verification, K-06 Resource-level permissions, K-08 File upload protection
- **Should:** B-06 Design preference selection, B-08 Reference website submission, B-11 Resume incomplete applications, G-11 Company branding configuration, G-18 Activity monitoring, H-02 In-app notifications, H-04 Quotation reminders, K-09 Malware scanning where available, K-21 Automated security testing

## R3 — Payments and documents

**Scope:** Deposits, providers, manual/mobile money, verification, ledger, invoices, receipts, stamp/signature, verification page, reminders.

**Exit criteria:** Deposit paid and verified; ledger balances; documents issued and verifiable.

**Features (39):**

- **Must:** C-01 50% initial deposit, C-02 Configurable deposit policy, C-03 Online payment integration, C-04 Manual bank transfers, C-05 Supported mobile money payments, C-06 Payment verification, C-07 Payment reconciliation, C-09 Multiple currencies, C-11 Payment history, C-12 Outstanding balance tracking, C-14 Transaction references, C-15 Payment notifications, C-16 Financial audit trails, D-03 Deposit invoices, D-04 Final invoices, D-05 Payment receipts, D-17 Tamper-evident financial records, G-08 Payment verification (admin), G-09 Invoice management, G-10 Receipt management, G-16 Financial reporting, H-03 Payment reminders, H-08 Automated document generation, H-09 Automated payment status updates, K-10 Payment webhook verification, K-11 Idempotent payment processing
- **Should:** C-08 Multiple payment providers, C-10 Refund management, C-13 Financial statements, D-02 Proforma invoices, D-06 Financial statements (documents), D-10 Official company stamp, D-11 Authorised company signature, D-12 Configurable document templates, D-15 Document verification, D-16 Document history, G-12 Company stamp and signature management, G-15 Notification management, K-18 Disaster recovery

## R4 — Client portal and delivery

**Scope:** Project dashboard, milestones, messaging, files, approvals, contracts, e-signatures, completion, handover, staff.

**Exit criteria:** A project runs end-to-end in the portal from deposit to handover.

**Features (22):**

- **Must:** F-03 Project dashboard, F-05 Development milestones, F-06 Progress tracking, F-07 Client messaging, F-08 File sharing, F-09 Deliverable management, F-10 Client approvals, F-15 Digital contracts, F-16 Electronic signatures, F-17 Project completion, F-18 Final handover, G-05 Project management, H-05 Project milestone notifications, H-07 Approval notifications
- **Should:** F-04 Project timelines, F-11 Support requests, F-12 Bug reporting, F-13 Revision tracking, F-19 Client project history, G-02 Staff management, H-06 Deadline notifications, H-10 Automated project status transitions

## R5 — Design previews and AI

**Scope:** Gated previews, versioning, feedback, approvals, AI concepts, AI consultant.

**Exit criteria:** Client approves a design version after deposit; previews blocked before.

**Features (12):**

- **Must:** E-01 Personalised website previews, E-04 Administrator-created designs, E-06 Design versioning, E-07 Client feedback, E-08 Revision requests, E-09 Design approvals, E-10 Preview access control, G-13 Preview management
- **Should:** E-02 Application dashboard previews, E-05 Responsive design previews
- **Could:** E-03 AI-assisted design concepts, E-11 AI project consultant

## R6 — Maintenance and subscriptions

**Scope:** Plans, subscription billing, renewals, hosting/domain tracking, backups, monitoring.

**Exit criteria:** A client subscribes to a plan and is billed automatically.

**Features (12):**

- **Must:** I-01 Website maintenance packages, I-06 Subscription billing, I-07 Renewal reminders
- **Should:** H-12 Scheduled maintenance notifications, I-02 Application maintenance, I-03 Hosting management, I-05 Support subscriptions, I-08 Bug fixing requests, I-09 Website backup management, I-10 Managed website monitoring, I-11 Client support history
- **Could:** I-04 Domain management where offered

## R7 — Business intelligence

**Scope:** Revenue, receivables, conversion, performance dashboards, exports.

**Exit criteria:** Reports reconcile with ledger; exports work.

**Features (11):**

- **Must:** J-02 Revenue reporting, J-03 Outstanding payment reports, J-09 Financial summaries
- **Should:** G-17 Business analytics, J-01 Project performance analytics, J-04 Client acquisition analytics, J-05 Quotation conversion rates, J-06 Project completion rates, J-08 Operational dashboards, J-10 Exportable reports
- **Could:** J-07 Service performance analysis

## R8 — Platform expansion

**Scope:** Mobile apps, API, agency/team, more providers/currencies, AI automation, automated deployment.

**Exit criteria:** Defined per feature when the release is planned.

**Features (15):**

- **Should:** L-03 Multiple staff accounts
- **Could:** E-12 Future automated website prototyping, E-13 Future AI-assisted source-code generation, L-01 Multiple payment providers (expansion), L-02 Additional supported currencies, L-04 Agency/team management, L-05 Native Android application, L-06 Native iOS application, L-07 Advanced AI automation, L-08 Automated website deployment, L-09 Client website analytics, L-10 Advanced collaboration, L-11 Advanced subscription management, L-12 Third-party integrations, L-13 API access for approved integrations

## Dependency rules

1. R1a security baseline (K-01, K-03, K-04, K-05, K-07, K-12–K-17, K-20) before any admin goes live.
2. R1b and R2 need R1a auth + storage + email (K-01, M-09, H-01).
3. R3 needs R2 quotations + PDF engine + numbering (B-16, D-07, D-08) and K-10/K-11 before taking real money.
4. R4 needs R3 deposit verification (C-01, C-06).
5. R5 previews need C-01 (deposit gate) and E-10 (access control).
6. R6–R8 build on the provider abstraction (C-08) and RBAC (K-05).
