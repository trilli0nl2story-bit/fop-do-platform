/*
  # Young Specialist Questions Table

  ## Summary
  Creates the infrastructure for the "Молодой специалист" (Young Specialist) feature,
  which allows preschool educators to submit questions and receive expert answers.

  ## New Tables

  ### young_specialist_questions
  Stores questions submitted by educators.
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users, nullable for anonymous)
  - `ticket_id` (text, unique, auto-generated ticket number like МС-2024-001)
  - `name` (text) - submitter's first name
  - `age` (integer) - submitter's age
  - `city` (text) - submitter's city
  - `email` (text) - submitter's email
  - `position` (text) - job title (e.g. Воспитатель)
  - `group_age` (text) - age group of their class (e.g. 4–5 лет)
  - `program` (text) - educational program (ФОП ДО / ФАОП ДО)
  - `topic` (text) - question topic summary
  - `question` (text) - full question text
  - `vk_link` (text, nullable) - VK profile link
  - `telegram_link` (text, nullable) - Telegram link
  - `status` (text) - one of: new, in_progress, answered, closed, published
  - `assigned_admin` (text, nullable)
  - `assigned_expert` (text, nullable)
  - `answer` (text, nullable) - expert answer
  - `thanks_sent` (boolean) - whether user clicked "Спасибо"
  - `published_to_base` (boolean) - whether visible in public answer base
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Authenticated users can read and insert their own questions
  - Admins (via service role) can read and update all questions
  - Public can read published questions (for answer base)
*/

CREATE TABLE IF NOT EXISTS young_specialist_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_id text UNIQUE,
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 100),
  city text NOT NULL,
  email text NOT NULL,
  position text NOT NULL DEFAULT '',
  group_age text NOT NULL DEFAULT '',
  program text NOT NULL DEFAULT '',
  topic text NOT NULL,
  question text NOT NULL,
  vk_link text DEFAULT '',
  telegram_link text DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'answered', 'closed', 'published')),
  assigned_admin text DEFAULT NULL,
  assigned_expert text DEFAULT NULL,
  answer text DEFAULT '',
  thanks_sent boolean DEFAULT false,
  published_to_base boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE young_specialist_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own questions"
  ON young_specialist_questions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questions"
  ON young_specialist_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions"
  ON young_specialist_questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read published questions"
  ON young_specialist_questions FOR SELECT
  TO anon
  USING (published_to_base = true AND status = 'published');

CREATE INDEX IF NOT EXISTS idx_ysq_user_id ON young_specialist_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_ysq_status ON young_specialist_questions(status);
CREATE INDEX IF NOT EXISTS idx_ysq_published ON young_specialist_questions(published_to_base) WHERE published_to_base = true;
