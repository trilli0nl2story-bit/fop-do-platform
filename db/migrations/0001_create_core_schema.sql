-- =============================================================================
-- Portable Production Schema — Методический кабинет педагога
-- =============================================================================
-- Target: any standard PostgreSQL ≥ 14 database.
-- Compatible with: Timeweb, Selectel, Yandex Cloud, Neon, self-hosted.
-- Does NOT require: Supabase, auth.users, auth.uid(), RLS, Row Level Security.
--
-- Access control is enforced in the application/API layer, not in the DB.
-- Run with: psql $DATABASE_URL -f 0001_create_core_schema.sql
-- =============================================================================


-- Ensure uuid_generate_v4 is available. gen_random_uuid() is built-in
-- in PG ≥ 13, so no extension needed for that. We still enable pgcrypto
-- for password hashing utilities if ever used at the DB layer.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ── users ────────────────────────────────────────────────────────────────────
-- First-party user table. Auth is handled in the application layer.

CREATE TABLE IF NOT EXISTS users (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text        NOT NULL UNIQUE,
  password_hash       text        NOT NULL,
  is_admin            boolean     NOT NULL DEFAULT false,
  email_verified_at   timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);


-- ── user_profiles ────────────────────────────────────────────────────────────
-- Personal information for a user (name, role, city, institution).

CREATE TABLE IF NOT EXISTS user_profiles (
  id          uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT '',
  last_name   text NOT NULL DEFAULT '',
  patronymic  text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT '',   -- воспитатель | методист | завуч …
  city        text NOT NULL DEFAULT '',
  institution text NOT NULL DEFAULT '',
  phone       text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);


-- ── categories ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text    NOT NULL UNIQUE,
  name        text    NOT NULL,
  description text    NOT NULL DEFAULT '',
  is_visible  boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ── materials ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS materials (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text    NOT NULL UNIQUE,
  title             text    NOT NULL,
  short_description text    NOT NULL DEFAULT '',
  full_description  text    NOT NULL DEFAULT '',
  access_type       text    NOT NULL DEFAULT 'store'
                            CHECK (access_type IN ('free', 'subscription', 'store')),
  category_id       uuid    REFERENCES categories(id) ON DELETE SET NULL,
  age_group         text    NOT NULL DEFAULT '',
  file_type         text    NOT NULL DEFAULT 'PDF'
                            CHECK (file_type IN ('PDF', 'DOCX', 'PPT', 'PPTX')),
  price             integer NOT NULL DEFAULT 0,      -- kopecks; 0 for free/subscription
  cover_url         text    NOT NULL DEFAULT '',
  preview_text      text    NOT NULL DEFAULT '',
  preview_file_url  text    NOT NULL DEFAULT '',
  paid_file_url     text    NOT NULL DEFAULT '',
  is_published      boolean NOT NULL DEFAULT false,
  is_featured       boolean NOT NULL DEFAULT false,
  seo_title         text    NOT NULL DEFAULT '',
  seo_description   text    NOT NULL DEFAULT '',
  program           text    NOT NULL DEFAULT '',
  what_is_included  text[]  NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS materials_slug_idx        ON materials (slug);
CREATE INDEX IF NOT EXISTS materials_access_type_idx ON materials (access_type);
CREATE INDEX IF NOT EXISTS materials_is_published_idx ON materials (is_published)
  WHERE is_published = true;


-- ── material_files ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS material_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  file_role   text NOT NULL DEFAULT 'paid'
              CHECK (file_role IN ('paid', 'preview', 'cover')),
  storage_key text NOT NULL,     -- S3/object-storage object key
  file_size   bigint,            -- bytes
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ── orders ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            text    NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total_amount      integer NOT NULL DEFAULT 0,   -- kopecks
  discount_amount   integer NOT NULL DEFAULT 0,   -- kopecks
  referral_discount integer NOT NULL DEFAULT 0,   -- percent
  coupon_code       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  paid_at           timestamptz
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx  ON orders (status);


-- ── order_items ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  material_id uuid    NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  price       integer NOT NULL DEFAULT 0   -- kopecks at time of purchase
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);


-- ── payments ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            text NOT NULL DEFAULT 'prodamus',
  provider_payment_id text,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  amount              integer NOT NULL DEFAULT 0,   -- kopecks
  raw_payload         jsonb   NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  paid_at             timestamptz
);

CREATE INDEX IF NOT EXISTS payments_order_id_idx           ON payments (order_id);
CREATE INDEX IF NOT EXISTS payments_provider_payment_id_idx ON payments (provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;


-- ── subscriptions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider                 text NOT NULL DEFAULT 'prodamus',
  provider_subscription_id text,
  plan_code                text NOT NULL DEFAULT 'monthly',
  status                   text NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  current_period_start     timestamptz NOT NULL DEFAULT now(),
  current_period_end       timestamptz NOT NULL,
  discount_percent         integer     NOT NULL DEFAULT 0,
  raw_payload              jsonb       NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx  ON subscriptions (status);


-- ── user_materials ────────────────────────────────────────────────────────────
-- Access grants: which user has access to which material and why.

CREATE TABLE IF NOT EXISTS user_materials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  access_type text NOT NULL DEFAULT 'purchase'
              CHECK (access_type IN ('purchase', 'subscription', 'free', 'admin_grant')),
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,    -- null = permanent
  UNIQUE (user_id, material_id)
);

CREATE INDEX IF NOT EXISTS user_materials_user_id_idx ON user_materials (user_id);


-- ── referrals ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code   text NOT NULL UNIQUE,
  referrer_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id     uuid REFERENCES users(id) ON DELETE SET NULL,   -- null until registered
  status          text NOT NULL DEFAULT 'invited'
                  CHECK (status IN ('invited', 'registered', 'paid')),
  paid_order_id   uuid REFERENCES orders(id) ON DELETE SET NULL,
  discount_pct    integer NOT NULL DEFAULT 5,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx  ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referral_code_idx ON referrals (referral_code);


-- ── document_requests ─────────────────────────────────────────────────────────
-- Custom made-to-order document workflow.

CREATE TABLE IF NOT EXISTS document_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE SET NULL,   -- nullable: anonymous allowed
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
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_requests_status_idx ON document_requests (status);


-- ── author_applications ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS author_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  email           text NOT NULL,
  phone           text NOT NULL DEFAULT '',
  city            text NOT NULL DEFAULT '',
  experience      text NOT NULL DEFAULT '',
  position        text NOT NULL DEFAULT '',
  bio             text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'revision')),
  employment_type text NOT NULL DEFAULT 'self_employed'
                  CHECK (employment_type IN ('self_employed', 'individual_entrepreneur')),
  document_url    text,
  admin_note      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);


-- ── young_specialist_questions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS young_specialist_questions (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid  REFERENCES users(id) ON DELETE SET NULL,
  ticket_id       text  NOT NULL UNIQUE,
  name            text  NOT NULL,
  age             integer,
  city            text  NOT NULL DEFAULT '',
  email           text  NOT NULL,
  position        text  NOT NULL DEFAULT '',
  group_age       text  NOT NULL DEFAULT '',
  program         text  NOT NULL DEFAULT '',
  topic           text  NOT NULL DEFAULT '',
  question        text  NOT NULL,
  vk_link         text,
  telegram_link   text,
  status          text  NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'in_progress', 'answered', 'closed', 'published')),
  assigned_expert text,
  answer          text,
  admin_note      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);


-- ── ai_requests ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  prompt       text NOT NULL,
  response     text,
  model        text NOT NULL DEFAULT 'gpt-4o-mini',
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'completed', 'failed')),
  tokens_used  integer,
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ai_requests_user_id_idx   ON ai_requests (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_requests_status_idx    ON ai_requests (status);


-- ── analytics_events ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,   -- nullable for anonymous
  session_id text,
  payload    jsonb NOT NULL DEFAULT '{}',
  ip         text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx    ON analytics_events (user_id)
  WHERE user_id IS NOT NULL;


-- ── admin_audit_log ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,              -- e.g. 'material.publish', 'order.refund'
  target_type text NOT NULL DEFAULT '',   -- 'material' | 'order' | 'user' | …
  target_id   uuid,
  before_data jsonb,
  after_data  jsonb,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx   ON admin_audit_log (admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx     ON admin_audit_log (target_type, target_id);
