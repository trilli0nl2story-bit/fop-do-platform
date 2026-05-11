import { ensureCoreAuthTables } from './coreSchema';
import { query } from './db';

let appCoreTablesReady: Promise<void> | null = null;

async function enablePgcryptoIfPossible(): Promise<void> {
  try {
    await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[app-schema] pgcrypto extension check skipped: ${message}`);
  }
}

export async function ensureAppCoreTables(): Promise<void> {
  if (!appCoreTablesReady) {
    appCoreTablesReady = (async () => {
      await enablePgcryptoIfPossible();
      await ensureCoreAuthTables();

      await query(`
        CREATE TABLE IF NOT EXISTS categories (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          slug text NOT NULL UNIQUE,
          name text NOT NULL,
          description text NOT NULL DEFAULT '',
          is_visible boolean NOT NULL DEFAULT true,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE categories ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

        CREATE TABLE IF NOT EXISTS materials (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          slug text NOT NULL UNIQUE,
          title text NOT NULL,
          short_description text NOT NULL DEFAULT '',
          full_description text NOT NULL DEFAULT '',
          access_type text NOT NULL DEFAULT 'store',
          category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
          age_group text NOT NULL DEFAULT '',
          file_type text NOT NULL DEFAULT 'PDF',
          price integer NOT NULL DEFAULT 0,
          cover_url text NOT NULL DEFAULT '',
          preview_text text NOT NULL DEFAULT '',
          preview_file_url text NOT NULL DEFAULT '',
          paid_file_url text NOT NULL DEFAULT '',
          is_published boolean NOT NULL DEFAULT false,
          is_featured boolean NOT NULL DEFAULT false,
          seo_title text NOT NULL DEFAULT '',
          seo_description text NOT NULL DEFAULT '',
          program text NOT NULL DEFAULT '',
          what_is_included text[] NOT NULL DEFAULT '{}',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE materials ADD COLUMN IF NOT EXISTS short_description text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS full_description text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'store';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS age_group text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_type text NOT NULL DEFAULT 'PDF';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0;
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS cover_url text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS preview_text text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS preview_file_url text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS paid_file_url text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS program text NOT NULL DEFAULT '';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS what_is_included text[] NOT NULL DEFAULT '{}';
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE materials ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

        CREATE INDEX IF NOT EXISTS materials_slug_idx ON materials (slug);
        CREATE INDEX IF NOT EXISTS materials_access_type_idx ON materials (access_type);
        CREATE INDEX IF NOT EXISTS materials_is_published_idx ON materials (is_published) WHERE is_published = true;

        CREATE TABLE IF NOT EXISTS material_files (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
          file_role text NOT NULL DEFAULT 'paid',
          storage_key text NOT NULL,
          file_size bigint,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE material_files ADD COLUMN IF NOT EXISTS file_role text NOT NULL DEFAULT 'paid';
        ALTER TABLE material_files ADD COLUMN IF NOT EXISTS storage_key text NOT NULL DEFAULT '';
        ALTER TABLE material_files ADD COLUMN IF NOT EXISTS file_size bigint;
        ALTER TABLE material_files ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

        CREATE TABLE IF NOT EXISTS orders (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status text NOT NULL DEFAULT 'pending',
          total_amount integer NOT NULL DEFAULT 0,
          discount_amount integer NOT NULL DEFAULT 0,
          referral_discount integer NOT NULL DEFAULT 0,
          coupon_code text,
          created_at timestamptz NOT NULL DEFAULT now(),
          paid_at timestamptz
        );

        ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount integer NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_discount integer NOT NULL DEFAULT 0;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
        CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
        CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

        CREATE TABLE IF NOT EXISTS order_items (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          material_id uuid NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
          price integer NOT NULL DEFAULT 0
        );

        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

        CREATE TABLE IF NOT EXISTS payments (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider text NOT NULL DEFAULT 'prodamus',
          provider_payment_id text,
          status text NOT NULL DEFAULT 'pending',
          amount integer NOT NULL DEFAULT 0,
          raw_payload jsonb NOT NULL DEFAULT '{}',
          created_at timestamptz NOT NULL DEFAULT now(),
          paid_at timestamptz
        );

        ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'prodamus';
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id text;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount integer NOT NULL DEFAULT 0;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}';
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at timestamptz;
        CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments (order_id);
        CREATE INDEX IF NOT EXISTS payments_provider_payment_id_idx ON payments (provider_payment_id) WHERE provider_payment_id IS NOT NULL;

        CREATE TABLE IF NOT EXISTS subscriptions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider text NOT NULL DEFAULT 'prodamus',
          provider_subscription_id text,
          plan_code text NOT NULL DEFAULT 'monthly',
          status text NOT NULL DEFAULT 'active',
          current_period_start timestamptz NOT NULL DEFAULT now(),
          current_period_end timestamptz NOT NULL DEFAULT now(),
          discount_percent integer NOT NULL DEFAULT 0,
          raw_payload jsonb NOT NULL DEFAULT '{}',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'prodamus';
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id text;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_code text NOT NULL DEFAULT 'monthly';
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz NOT NULL DEFAULT now();
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end timestamptz NOT NULL DEFAULT now();
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS discount_percent integer NOT NULL DEFAULT 0;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}';
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
        CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
        CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);

        CREATE TABLE IF NOT EXISTS user_materials (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
          access_type text NOT NULL DEFAULT 'purchase',
          order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
          granted_at timestamptz NOT NULL DEFAULT now(),
          expires_at timestamptz,
          UNIQUE (user_id, material_id)
        );

        ALTER TABLE user_materials ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'purchase';
        ALTER TABLE user_materials ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE SET NULL;
        ALTER TABLE user_materials ADD COLUMN IF NOT EXISTS granted_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE user_materials ADD COLUMN IF NOT EXISTS expires_at timestamptz;
        CREATE INDEX IF NOT EXISTS user_materials_user_id_idx ON user_materials (user_id);

        CREATE TABLE IF NOT EXISTS document_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id) ON DELETE SET NULL,
          email text NOT NULL DEFAULT '',
          name text NOT NULL DEFAULT '',
          description text NOT NULL DEFAULT '',
          age_group text NOT NULL DEFAULT '',
          document_type text NOT NULL DEFAULT '',
          status text NOT NULL DEFAULT 'received',
          result_file_url text,
          admin_note text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS age_group text NOT NULL DEFAULT '';
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT '';
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'received';
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS result_file_url text;
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS admin_note text;
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
        CREATE INDEX IF NOT EXISTS document_requests_status_idx ON document_requests (status);

        CREATE TABLE IF NOT EXISTS author_applications (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL DEFAULT '',
          email text NOT NULL DEFAULT '',
          phone text NOT NULL DEFAULT '',
          city text NOT NULL DEFAULT '',
          experience text NOT NULL DEFAULT '',
          position text NOT NULL DEFAULT '',
          bio text NOT NULL DEFAULT '',
          status text NOT NULL DEFAULT 'pending',
          employment_type text NOT NULL DEFAULT 'self_employed',
          document_url text,
          admin_note text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS experience text NOT NULL DEFAULT '';
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT '';
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS employment_type text NOT NULL DEFAULT 'self_employed';
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS document_url text;
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS admin_note text;
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE author_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

        CREATE TABLE IF NOT EXISTS young_specialist_questions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id) ON DELETE SET NULL,
          ticket_id text NOT NULL UNIQUE,
          name text NOT NULL DEFAULT '',
          age integer,
          city text NOT NULL DEFAULT '',
          email text NOT NULL DEFAULT '',
          position text NOT NULL DEFAULT '',
          group_age text NOT NULL DEFAULT '',
          program text NOT NULL DEFAULT '',
          topic text NOT NULL DEFAULT '',
          question text NOT NULL DEFAULT '',
          vk_link text,
          telegram_link text,
          status text NOT NULL DEFAULT 'new',
          assigned_expert text,
          answer text,
          admin_note text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE young_specialist_questions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
        ALTER TABLE young_specialist_questions ADD COLUMN IF NOT EXISTS assigned_expert text;
        ALTER TABLE young_specialist_questions ADD COLUMN IF NOT EXISTS answer text;
        ALTER TABLE young_specialist_questions ADD COLUMN IF NOT EXISTS admin_note text;
        ALTER TABLE young_specialist_questions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE young_specialist_questions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

        CREATE TABLE IF NOT EXISTS ai_requests (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES users(id) ON DELETE SET NULL,
          prompt text NOT NULL,
          response text,
          model text NOT NULL DEFAULT 'gpt-5-mini',
          status text NOT NULL DEFAULT 'pending',
          tokens_used integer,
          error text,
          created_at timestamptz NOT NULL DEFAULT now(),
          completed_at timestamptz
        );

        ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS response text;
        ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'gpt-5-mini';
        ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
        ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS tokens_used integer;
        ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS error text;
        ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        ALTER TABLE ai_requests ADD COLUMN IF NOT EXISTS completed_at timestamptz;
        CREATE INDEX IF NOT EXISTS ai_requests_user_id_idx ON ai_requests (user_id) WHERE user_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS ai_requests_status_idx ON ai_requests (status);

        CREATE TABLE IF NOT EXISTS analytics_events (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          event_type text NOT NULL,
          user_id uuid REFERENCES users(id) ON DELETE SET NULL,
          session_id text,
          payload jsonb NOT NULL DEFAULT '{}',
          ip text,
          user_agent text,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events (event_type);
        CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at DESC);
        CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics_events (user_id) WHERE user_id IS NOT NULL;

        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
          action text NOT NULL,
          target_type text NOT NULL DEFAULT '',
          target_id uuid,
          before_data jsonb,
          after_data jsonb,
          ip text,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT '';
        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS target_id uuid;
        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS before_data jsonb;
        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS after_data jsonb;
        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS ip text;
        ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
        CREATE INDEX IF NOT EXISTS admin_audit_log_admin_id_idx ON admin_audit_log (admin_id);
        CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log (created_at DESC);
        CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON admin_audit_log (target_type, target_id);
      `);
    })().catch((error) => {
      appCoreTablesReady = null;
      throw error;
    });
  }

  await appCoreTablesReady;
}
