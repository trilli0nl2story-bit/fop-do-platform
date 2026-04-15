# Database — Методический кабинет педагога

## Overview

This directory contains the portable PostgreSQL schema and seed data for the production database.
The schema is **host-independent** — it runs on any standard PostgreSQL ≥ 14 database
(Timeweb, Selectel, Yandex Cloud, Neon, self-hosted, etc.).

It does **not** require Supabase, `auth.users`, `auth.uid()`, RLS, or Supabase-specific roles.

---

## Directory Structure

```
db/
├── migrations/
│   └── 0001_create_core_schema.sql   — full schema (run once, in order)
├── seeds/
│   └── 0001_seed_categories_and_materials.sql   — initial data (safe to re-run)
└── README.md   — this file
```

---

## Running the Migration

Apply the schema to a fresh database:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_create_core_schema.sql
```

This creates 17 tables:
`users`, `user_profiles`, `categories`, `materials`, `material_files`,
`orders`, `order_items`, `payments`, `subscriptions`, `user_materials`,
`referrals`, `document_requests`, `author_applications`,
`young_specialist_questions`, `ai_requests`, `analytics_events`, `admin_audit_log`.

---

## Running the Seed

Apply the initial categories and materials data:

```bash
psql "$DATABASE_URL" -f db/seeds/0001_seed_categories_and_materials.sql
```

The seed is **idempotent** — it uses `ON CONFLICT (slug) DO UPDATE`, so it is safe to re-run.

To regenerate the seed file from the TypeScript source data:

```bash
node scripts/generate-materials-seed.mjs
```

This requires no database connection and no secrets. It reads
`src/data/storeProducts.ts`, `src/data/materials.ts`, and `src/data/catalog.ts`
using `npx tsx` and writes `db/seeds/0001_seed_categories_and_materials.sql`.

---

## What Is Included in the Seed

| Access type    | Count | Source                          |
|----------------|-------|---------------------------------|
| `store`        | 115   | `src/data/storeProducts.ts` + `src/data/catalog.ts` |
| `free`         | 4     | `src/data/materials.ts`         |
| `subscription` | 175   | `src/data/materials.ts`         |
| **Total**      | **294** |                               |

Categories: **36** (derived from all three source files, de-duplicated).

Prices are stored in **kopecks** (integer). Example: 450 roubles → 45000 kopecks.

---

## What Is Intentionally Missing from the Seed

- **File URLs** — `cover_url`, `preview_file_url`, `paid_file_url` are empty strings.
  These will be populated via the admin panel once files are uploaded to S3/object storage.
- **Users** — no user records; users register through the application.
- **Orders, payments, subscriptions** — transactional data; not seeded.
- **Access grants** (`user_materials`) — populated at purchase/subscription time.

---

## Supabase Legacy Migrations

The `supabase/migrations/` directory contains an earlier prototype schema written for Supabase.
Those files depend on `auth.users`, `auth.uid()`, `authenticated`, and `service_role` —
**they do not run on plain PostgreSQL**.

They are kept as a reference only. For production use `db/migrations/` instead.

---

## How This Will Be Used Later

1. **Admin panel** — will allow uploading file URLs and publishing/unpublishing materials.
   The admin panel will query/update the `materials` table directly via the backend API.

2. **Backend API** — will replace the current hardcoded TypeScript data files.
   The frontend will fetch `/api/materials`, `/api/categories`, etc. from the Express backend
   which queries the PostgreSQL database via `DATABASE_URL`.

3. **Auth** — the `users` table is ready. Session-based or JWT auth will be implemented
   in the backend; access control enforced in the API layer (no RLS).

4. **Payments** — the `orders`, `payments`, and `subscriptions` tables are ready.
   Prodamus webhook integration will write to these tables.
