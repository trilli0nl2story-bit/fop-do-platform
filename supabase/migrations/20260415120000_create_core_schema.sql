-- =============================================================================
-- ⚠️  LEGACY / SUPABASE-ONLY MIGRATION — DO NOT RUN ON PLAIN POSTGRESQL
-- =============================================================================
-- This migration was written for Supabase and depends on:
--   • auth.users      — Supabase Auth managed table
--   • auth.uid()      — Supabase Auth function (not available on plain PG)
--   • authenticated   — Supabase-specific role
--   • service_role    — Supabase-specific role
--   • ENABLE ROW LEVEL SECURITY + CREATE POLICY using the above roles
--
-- For production deployment on Russian-hosted PostgreSQL (Timeweb, Selectel,
-- Yandex Cloud, Neon, self-hosted) use the portable schema instead:
--   db/migrations/0001_create_core_schema.sql
--
-- This file is kept as a reference and for Supabase prototype environments.
-- =============================================================================

/*
  # Core Schema (Supabase prototype)

  ## Summary
  Creates the main production tables for the Методический кабинет педагога platform.
  Covers users, materials, orders, payments, subscriptions, referrals, AI requests,
  document requests, analytics, and admin audit log.

  ## Notes
  - Builds on top of auth.users (Supabase Auth).
  - The `profiles` table with referral fields already exists (migration 20260408171803).
  - `author_applications` already exists (migration 20260308021000).
  - `young_specialist_questions` already exists (migration 20260309165003).
  - `post_purchase_discounts` already exists (migration 20260323230924).
  - This migration only creates NEW tables.
  - All foreign keys reference auth.users cascade on delete.
  - RLS is enabled on every table; policies use auth.uid() or service role.
*/


-- ── user_profiles ────────────────────────────────────────────────────────────
-- Personal information separate from referral state (stored in `profiles`).

CREATE TABLE IF NOT EXISTS user_profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL DEFAULT '',
  last_name      text NOT NULL DEFAULT '',
  patronymic     text NOT NULL DEFAULT '',
  role           text NOT NULL DEFAULT '',  -- воспитатель, методист, etc.
  city           text NOT NULL DEFAULT '',
  institution    text NOT NULL DEFAULT '',
  phone          text NOT NULL DEFAULT '',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- ── categories ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  is_visible   boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible categories"
  ON categories FOR SELECT
  USING (is_visible = true);


-- ── materials ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS materials (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  full_description  text NOT NULL DEFAULT '',
  access_type       text NOT NULL DEFAULT 'store'  -- free | subscription | store
                    CHECK (access_type IN ('free', 'subscription', 'store')),
  category_id       uuid REFERENCES categories(id) ON DELETE SET NULL,
  age_group         text NOT NULL DEFAULT '',
  file_type         text NOT NULL DEFAULT 'PDF'
                    CHECK (file_type IN ('PDF', 'DOCX', 'PPT', 'PPTX')),
  price             integer NOT NULL DEFAULT 0,     -- kopecks (0 for free/subscription)
  cover_url         text NOT NULL DEFAULT '',
  preview_text      text NOT NULL DEFAULT '',
  preview_file_url  text NOT NULL DEFAULT '',
  paid_file_url     text NOT NULL DEFAULT '',
  is_published      boolean NOT NULL DEFAULT false,
  is_featured       boolean NOT NULL DEFAULT false,
  seo_title         text NOT NULL DEFAULT '',
  seo_description   text NOT NULL DEFAULT '',
  program           text NOT NULL DEFAULT '',
  what_is_included  text[] NOT NULL DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published materials"
  ON materials FOR SELECT
  USING (is_published = true);


-- ── material_files ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS material_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  file_type   text NOT NULL DEFAULT 'paid'  -- paid | preview | cover
              CHECK (file_type IN ('paid', 'preview', 'cover')),
  storage_key text NOT NULL,               -- S3/object-storage key
  file_size   bigint,                       -- bytes
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE material_files ENABLE ROW LEVEL SECURITY;

-- Access to paid files is handled in application code after purchase verification.
CREATE POLICY "Service role can manage material files"
  ON material_files FOR ALL
  TO service_role
  USING (true);


-- ── orders ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total_amount        integer NOT NULL DEFAULT 0,   -- kopecks
  discount_amount     integer NOT NULL DEFAULT 0,   -- kopecks
  referral_discount   integer NOT NULL DEFAULT 0,   -- percent
  coupon_code         text,
  created_at          timestamptz DEFAULT now(),
  paid_at             timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ── order_items ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  price       integer NOT NULL DEFAULT 0   -- kopecks at time of purchase
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );


-- ── payments ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider            text NOT NULL DEFAULT 'prodamus',  -- prodamus | manual
  provider_payment_id text,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  amount              integer NOT NULL DEFAULT 0,        -- kopecks
  raw_payload         jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  paid_at             timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL TO service_role
  USING (true);


-- ── subscriptions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                text NOT NULL DEFAULT 'prodamus',
  provider_subscription_id text,
  plan_code               text NOT NULL DEFAULT 'monthly',
  status                  text NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  current_period_start    timestamptz NOT NULL DEFAULT now(),
  current_period_end      timestamptz NOT NULL,
  discount_percent        integer NOT NULL DEFAULT 0,
  raw_payload             jsonb NOT NULL DEFAULT '{}',
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL TO service_role
  USING (true);


-- ── user_materials ────────────────────────────────────────────────────────────
-- Access grants: tracks which users have access to which materials.

CREATE TABLE IF NOT EXISTS user_materials (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id  uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  access_type  text NOT NULL DEFAULT 'purchase'  -- purchase | subscription | free | admin_grant
               CHECK (access_type IN ('purchase', 'subscription', 'free', 'admin_grant')),
  order_id     uuid REFERENCES orders(id) ON DELETE SET NULL,
  granted_at   timestamptz DEFAULT now(),
  expires_at   timestamptz,  -- null = permanent
  UNIQUE (user_id, material_id)
);

ALTER TABLE user_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own material access"
  ON user_materials FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user materials"
  ON user_materials FOR ALL TO service_role
  USING (true);


-- ── document_requests ─────────────────────────────────────────────────────────
-- Custom document requests (made-to-order workflow).

CREATE TABLE IF NOT EXISTS document_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email           text NOT NULL,
  name            text NOT NULL DEFAULT '',
  description     text NOT NULL,
  age_group       text NOT NULL DEFAULT '',
  document_type   text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'received'
                  CHECK (status IN (
                    'received', 'in_progress', 'draft_generated',
                    'under_review', 'completed', 'rejected'
                  )),
  result_file_url text,
  admin_note      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own document requests"
  ON document_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert a document request"
  ON document_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage document requests"
  ON document_requests FOR ALL TO service_role
  USING (true);


-- ── ai_requests ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt      text NOT NULL,
  response    text,
  model       text NOT NULL DEFAULT 'gpt-4o-mini',
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'completed', 'failed')),
  tokens_used integer,
  error       text,
  created_at  timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI requests"
  ON ai_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage AI requests"
  ON ai_requests FOR ALL TO service_role
  USING (true);


-- ── analytics_events ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- nullable for anonymous
  session_id  text,
  payload     jsonb NOT NULL DEFAULT '{}',
  ip          text,
  user_agent  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Analytics is insert-only from client/server; reads via service role.
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can read analytics events"
  ON analytics_events FOR SELECT TO service_role
  USING (true);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx   ON analytics_events (user_id)
  WHERE user_id IS NOT NULL;


-- ── admin_audit_log ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,               -- e.g. 'material.publish', 'order.refund'
  target_type text NOT NULL DEFAULT '',    -- 'material' | 'order' | 'user' | etc.
  target_id   uuid,
  before_data jsonb,
  after_data  jsonb,
  ip          text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage audit log"
  ON admin_audit_log FOR ALL TO service_role
  USING (true);

-- Audit log is append-only for authenticated admins.
CREATE POLICY "Admins can insert audit log entries"
  ON admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx   ON admin_audit_log (admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx     ON admin_audit_log (target_type, target_id);
