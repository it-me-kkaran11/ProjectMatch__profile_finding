/*
# Create profiles table for ProjectMatch

## Purpose
Stores extended user profile data for each authenticated student — department, year, bio,
interests, preferred roles, work style, and avatar. One row per auth user, keyed by auth.uid().

## New Tables
- `profiles`
  - `id` (uuid, primary key) — matches `auth.users.id`, 1:1 relationship
  - `full_name` (text, not null)
  - `email` (text, not null)
  - `department` (text, nullable)
  - `year` (text, nullable)
  - `bio` (text, nullable)
  - `avatar_url` (text, nullable)
  - `interests` (text[], default empty array)
  - `preferred_roles` (text[], default empty array)
  - `work_style` (text, nullable)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

## Security
- RLS enabled on `profiles`.
- Users can SELECT their own profile (auth.uid() = id).
- Users can INSERT their own profile (auth.uid() = id).
- Users can UPDATE their own profile (auth.uid() = id).
- No DELETE policy — profiles are tied to auth accounts and should not be removed via the API.
- `updated_at` auto-refreshes via trigger on every UPDATE.

## Notes
1. `id` defaults to `auth.uid()` so an insert from the client can omit it.
2. Email is stored for convenience display; the source of truth for auth email is `auth.users.email`.
3. Arrays use `text[]` with `DEFAULT '{}'` so they are never null.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  department text,
  year text,
  bio text,
  avatar_url text,
  interests text[] NOT NULL DEFAULT '{}',
  preferred_roles text[] NOT NULL DEFAULT '{}',
  work_style text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-refresh updated_at on UPDATE
CREATE OR REPLACE FUNCTION refresh_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION refresh_updated_at();
