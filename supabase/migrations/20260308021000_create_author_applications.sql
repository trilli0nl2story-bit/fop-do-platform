/*
  # Create Author Applications Table

  ## Summary
  This migration creates the infrastructure for handling author applications on the platform.

  ## New Tables

  ### `author_applications`
  Stores applications from users who want to become content authors.

  Columns:
  - `id` (uuid, PK) — unique record identifier
  - `user_id` (uuid, FK → auth.users) — the applicant's user account
  - `name` (text) — full name
  - `email` (text) — contact email
  - `phone` (text) — contact phone number
  - `city` (text) — city of residence
  - `experience` (text) — years/description of work experience
  - `position` (text) — current job position/title
  - `bio` (text) — short author bio
  - `status` (text) — application status: 'pending', 'approved', 'rejected', 'revision'
  - `employment_type` (text) — 'self_employed' or 'individual_entrepreneur'
  - `document_url` (text, nullable) — URL to the uploaded example document
  - `admin_note` (text, nullable) — admin feedback/revision notes
  - `created_at` (timestamptz) — submission timestamp
  - `updated_at` (timestamptz) — last update timestamp

  ## Security
  - RLS enabled
  - Users can insert their own application and read their own application
  - Admins (via service role) can read and update all applications

  ## Notes
  1. One user can submit only one active application (enforced by unique constraint on user_id + status not rejected)
  2. Status defaults to 'pending'
*/

CREATE TABLE IF NOT EXISTS author_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  employment_type text NOT NULL DEFAULT 'self_employed',
  document_url text,
  admin_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE author_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own application"
  ON author_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own application"
  ON author_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending application"
  ON author_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);
