CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  email text NULL,
  phone text NULL,
  form_name text NOT NULL,
  consent_type text NOT NULL,
  document_slug text NOT NULL,
  document_version text NOT NULL,
  document_hash text NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text NULL,
  user_agent text NULL,
  source_url text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS consents_user_id_idx ON consents (user_id);
CREATE INDEX IF NOT EXISTS consents_email_idx ON consents (email);
CREATE INDEX IF NOT EXISTS consents_type_idx ON consents (consent_type);
CREATE INDEX IF NOT EXISTS consents_accepted_at_idx ON consents (accepted_at DESC);
