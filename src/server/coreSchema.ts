import { query } from './db';

let coreAuthTablesReady: Promise<void> | null = null;

export async function ensureCoreAuthTables(): Promise<void> {
  if (!coreAuthTablesReady) {
    coreAuthTablesReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text NOT NULL UNIQUE,
          password_hash text NOT NULL DEFAULT '',
          is_admin boolean NOT NULL DEFAULT false,
          email_verified_at timestamptz NULL,
          session_version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT ''");
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false');
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz NULL');
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1');
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
      await query('CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)');

      await query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          name text NOT NULL DEFAULT '',
          last_name text NOT NULL DEFAULT '',
          patronymic text NOT NULL DEFAULT '',
          role text NOT NULL DEFAULT '',
          city text NOT NULL DEFAULT '',
          institution text NOT NULL DEFAULT '',
          phone text NOT NULL DEFAULT '',
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      await query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT ''");
      await query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT ''");
      await query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS patronymic text NOT NULL DEFAULT ''");
      await query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT ''");
      await query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT ''");
      await query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS institution text NOT NULL DEFAULT ''");
      await query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT ''");
      await query('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
    })().catch((error) => {
      coreAuthTablesReady = null;
      throw error;
    });
  }

  await coreAuthTablesReady;
}
