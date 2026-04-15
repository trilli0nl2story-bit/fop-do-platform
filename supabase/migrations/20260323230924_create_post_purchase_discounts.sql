/*
  # Create post_purchase_discounts table

  ## Purpose
  Store temporary 10% return-purchase discounts granted after a successful order.

  ## New Tables
  - `post_purchase_discounts`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `discount_amount` (integer) — fixed ₽ discount amount (10% of order total)
    - `order_total` (integer) — original order total used to compute discount
    - `expires_at` (timestamptz) — 48 hours after creation
    - `used` (boolean) — whether the discount has been applied
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Authenticated users can read/update only their own discounts
  - Insert is done server-side (service role); users cannot self-grant discounts
*/

CREATE TABLE IF NOT EXISTS post_purchase_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_amount integer NOT NULL DEFAULT 0,
  order_total integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE post_purchase_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own discounts"
  ON post_purchase_discounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own discounts as used"
  ON post_purchase_discounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
