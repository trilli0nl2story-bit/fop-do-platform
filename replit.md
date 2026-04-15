# Методический Кабинет Педагога

A comprehensive web platform for preschool educators (Russian-language). Provides a methodological materials library, AI assistant, subscription management, author application system, referral/discount system, and an admin dashboard.

## Architecture

- **Framework:** Next.js 16 (App Router) — migrated from Vite SPA for Yandex SEO
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS
- **Icons:** Lucide React
- **Routing:** Next.js file-based App Router (`app/` directory)
- **State:** React Context (`CartContext`, `PostPurchaseDiscountContext`)
- **Persistence:** localStorage (prototype-era; will move to PostgreSQL)

## Directory Structure

```
app/                  ← Next.js App Router routes
  layout.tsx          ← Root layout (HTML shell, metadata)
  page.tsx            ← / (Landing page)
  globals.css         ← Global CSS (Tailwind base)

src/
  views/              ← All page-level React components (renamed from pages/)
  components/         ← Reusable UI components
  context/            ← React Context providers
  lib/                ← Utility libraries (analytics, userProfile, etc.)
  data/               ← Static data (catalog, materials, storeProducts)
  hooks/              ← Custom React hooks
  App.tsx             ← Legacy Vite router (kept as reference during migration)

supabase/migrations/  ← SQL schema reference files (documentation only)
```

## Running the App

```bash
npm run dev     # Next.js dev server on port 5000
npm run build   # Production build
npm run start   # Production server on port 5000
```

## Replit Configuration

- Dev server: `next dev -p 5000` (port 5000 with webview output)
- Build: `next build`
- Start: `next start -p 5000`
- Workflow: `Start application` → `npm run dev`

## Migration Status

The project is mid-migration from a Vite SPA prototype to Next.js App Router.

### Done
- Next.js shell installed and running
- Landing page (`/`) renders via `app/page.tsx`
- Production build passes with zero TypeScript errors
- `src/views/` renamed from `src/pages/` (Next.js won't confuse it with Pages Router)

### Next Steps
- Wire all public routes in `app/` with real Next.js file-based URLs
- Replace `onNavigate` stub with Next.js `<Link>` / `useRouter`
- Add `generateMetadata()` per page for Yandex SEO
- Add `generateStaticParams()` for dynamic product routes
- Add `app/sitemap.ts` and `app/robots.ts`
- Auth, payments, AI backend (future phases)

## Notable Features

- QA admin mode: append `?qa_admin=1` to URL to access admin dashboard (dev only)
- Referral system with discount progression (5–10%)
- Post-purchase 10% discount (48h window)
- Young specialist Q&A submission system
- Author application workflow
