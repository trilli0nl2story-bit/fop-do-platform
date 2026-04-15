/*
  # Referral & Discount System

  1. New Tables
    - `profiles`
      - `id` (uuid, FK to auth.users)
      - `referral_code` (text, unique) — user's invite code
      - `referred_by` (text) — referral code used at sign-up
      - `referral_discount_pct` (int) — current earned discount 5–10%
      - `referral_buyers_count` (int) — how many referrals completed a purchase
      - `created_at` (timestamptz)

    - `referral_purchases`
      - `id` (uuid)
      - `referrer_id` (uuid, FK profiles.id) — the user who invited
      - `buyer_id` (uuid, FK profiles.id) — the user who purchased
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Users can read/update only their own profile
    - Referral purchases visible to the referrer only

  3. Notes
    - Discount progression: 5% base, +1% per 1/3/5 buyers, max 10%
    - referral_code is generated as a short uppercase hash on insert via trigger
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text UNIQUE,
  referred_by text,
  referral_discount_pct integer NOT NULL DEFAULT 5,
  referral_buyers_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS referral_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE referral_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their own referral purchases"
  ON referral_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referral purchases"
  ON referral_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS trigger AS $$
BEGIN
  NEW.referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION generate_referral_code();

CREATE OR REPLACE FUNCTION update_referrer_discount()
RETURNS trigger AS $$
DECLARE
  buyer_count integer;
  new_discount integer;
BEGIN
  SELECT referral_buyers_count + 1 INTO buyer_count
  FROM profiles WHERE id = NEW.referrer_id;

  UPDATE profiles SET referral_buyers_count = buyer_count WHERE id = NEW.referrer_id;

  IF buyer_count >= 10 THEN new_discount := 10;
  ELSIF buyer_count >= 5 THEN new_discount := 8;
  ELSIF buyer_count >= 3 THEN new_discount := 7;
  ELSIF buyer_count >= 1 THEN new_discount := 6;
  ELSE new_discount := 5;
  END IF;

  UPDATE profiles SET referral_discount_pct = new_discount WHERE id = NEW.referrer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_referral_purchase_insert
  AFTER INSERT ON referral_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_referrer_discount();
