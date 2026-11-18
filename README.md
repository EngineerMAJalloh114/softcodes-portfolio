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

## Design tokens

Defined in `src/app/globals.css` (`@theme`): `void` #05080D, `night` #131925, `slate` #3F4B59,
`dusk` #68798D, `mist` #C7D0D9. Small muted text uses `text-muted` (mist at 70%) so it passes
WCAG AA on both void and night; `dusk` is reserved for icons, eyebrows on void and decoration.
