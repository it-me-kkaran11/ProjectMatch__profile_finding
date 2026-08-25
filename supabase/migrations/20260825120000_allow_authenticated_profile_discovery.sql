-- Allow authenticated students to discover public profile information.
-- Private fields should not be exposed here; the application only selects
-- profile fields needed for matching and directory views.

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_authenticated_profiles" ON profiles;

CREATE POLICY "select_authenticated_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
