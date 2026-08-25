/*
# Create talent and project system

## Purpose
Builds the full talent and project system for ProjectMatch:
- A skill catalog + per-user skill assignments with proficiency, years, and evidence status.
- Day/time-block availability per student.
- Skill evidence records (links/proof that a skill is verified).
- Projects with requirements, roles, and members.

## New Tables
- skills (catalog), user_skills, student_availability, skill_evidence, projects, project_requirements, project_members
- See SQL for full column definitions.

## Security
All tables have RLS enabled. Owner-scoped CRUD on user data; projects readable by all authenticated, editable only by creator; project_members supports self-join and creator management.

## Notes
1. user_id/creator_id columns default to auth.uid() so client inserts omitting them succeed.
2. skills table is read-only from client (seeded via SQL).
3. updated_at triggers on user_skills and projects.
4. Indexes on common filter/join columns.
*/

-- ============ skills ============
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_skills" ON skills;
CREATE POLICY "read_skills" ON skills FOR SELECT
  TO anon, authenticated USING (true);

-- ============ user_skills ============
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency int NOT NULL DEFAULT 1 CHECK (proficiency BETWEEN 1 AND 5),
  years_experience numeric NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
  evidence_status text NOT NULL DEFAULT 'unverified' CHECK (evidence_status IN ('unverified','pending','verified')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_user_skills" ON user_skills;
CREATE POLICY "read_user_skills" ON user_skills FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_user_skills" ON user_skills;
CREATE POLICY "insert_own_user_skills" ON user_skills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_skills" ON user_skills;
CREATE POLICY "update_own_user_skills" ON user_skills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_skills" ON user_skills;
CREATE POLICY "delete_own_user_skills" ON user_skills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);

-- ============ student_availability ============
CREATE TABLE IF NOT EXISTS student_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

ALTER TABLE student_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_student_availability" ON student_availability;
CREATE POLICY "read_student_availability" ON student_availability FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_availability" ON student_availability;
CREATE POLICY "insert_own_availability" ON student_availability FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_availability" ON student_availability;
CREATE POLICY "update_own_availability" ON student_availability FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_availability" ON student_availability;
CREATE POLICY "delete_own_availability" ON student_availability FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_student_availability_user_id ON student_availability(user_id);

-- ============ skill_evidence ============
CREATE TABLE IF NOT EXISTS skill_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_skill_id uuid NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_skill_evidence" ON skill_evidence;
CREATE POLICY "read_skill_evidence" ON skill_evidence FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_evidence" ON skill_evidence;
CREATE POLICY "insert_own_evidence" ON skill_evidence FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_skills WHERE user_skills.id = skill_evidence.user_skill_id AND user_skills.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_evidence" ON skill_evidence;
CREATE POLICY "delete_own_evidence" ON skill_evidence FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_skills WHERE user_skills.id = skill_evidence.user_skill_id AND user_skills.user_id = auth.uid())
  );

-- ============ projects ============
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  tagline text,
  description text,
  category text NOT NULL CHECK (category IN ('Academic','Hackathon','Research','Startup','Competition','Open Source')),
  status text NOT NULL DEFAULT 'Recruiting' CHECK (status IN ('Recruiting','In Progress','Planning','Completed')),
  team_size int NOT NULL DEFAULT 4 CHECK (team_size BETWEEN 1 AND 20),
  timeline text,
  preferred_availability text,
  preferred_roles text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_projects" ON projects;
CREATE POLICY "read_projects" ON projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============ project_requirements ============
CREATE TABLE IF NOT EXISTS project_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_proficiency int NOT NULL DEFAULT 1 CHECK (required_proficiency BETWEEN 1 AND 5),
  importance text NOT NULL DEFAULT 'Preferred' CHECK (importance IN ('Required','Preferred','Nice-to-have')),
  people_needed int NOT NULL DEFAULT 1 CHECK (people_needed >= 1),
  UNIQUE(project_id, skill_id)
);

ALTER TABLE project_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_project_requirements" ON project_requirements;
CREATE POLICY "read_project_requirements" ON project_requirements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "manage_own_project_requirements" ON project_requirements;
CREATE POLICY "manage_own_project_requirements" ON project_requirements FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_requirements.project_id AND projects.creator_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_requirements.project_id AND projects.creator_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_project_requirements_project_id ON project_requirements(project_id);

-- ============ project_members ============
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  status text NOT NULL DEFAULT 'member' CHECK (status IN ('member','invited','requested')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_project_members" ON project_members;
CREATE POLICY "read_project_members" ON project_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_membership" ON project_members;
CREATE POLICY "insert_own_membership" ON project_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_membership" ON project_members;
CREATE POLICY "update_own_membership" ON project_members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_membership" ON project_members;
CREATE POLICY "delete_own_membership" ON project_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "creator_manage_members" ON project_members;
CREATE POLICY "creator_manage_members" ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.creator_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.creator_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- ============ Triggers ============
CREATE OR REPLACE FUNCTION refresh_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_skills_updated_at ON user_skills;
CREATE TRIGGER user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION refresh_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION refresh_updated_at();

-- ============ Seed skills catalog ============
INSERT INTO skills (name, category) VALUES
  ('React','Frontend'),
  ('TypeScript','Frontend'),
  ('Node.js','Backend'),
  ('Python','Backend'),
  ('Go','Backend'),
  ('Rust','Backend'),
  ('PostgreSQL','Database'),
  ('WebSockets','Backend'),
  ('GraphQL','Backend'),
  ('PyTorch','AI/ML'),
  ('TensorFlow','AI/ML'),
  ('LLMs','AI/ML'),
  ('MLOps','AI/ML'),
  ('Docker','DevOps'),
  ('Kubernetes','DevOps'),
  ('AWS','DevOps'),
  ('Figma','Design'),
  ('CSS','Frontend'),
  ('React Native','Mobile'),
  ('Flutter','Mobile'),
  ('C/C++','Systems'),
  ('ROS','Robotics'),
  ('Embedded Systems','Systems'),
  ('PCB Design','Hardware'),
  ('CAD','Hardware'),
  ('User Research','Design'),
  ('Accessibility','Design'),
  ('Product Strategy','Product'),
  ('Prototyping','Design'),
  ('Framer Motion','Frontend'),
  ('Dart','Mobile'),
  ('Swift','Mobile'),
  ('SQL','Database'),
  ('Kafka','Backend'),
  ('Terraform','DevOps'),
  ('Bash','DevOps'),
  ('Prometheus','DevOps'),
  ('Grafana','DevOps'),
  ('Solidity','Blockchain'),
  ('Signal Processing','Hardware'),
  ('MATLAB','Hardware'),
  ('Machine Learning','AI/ML'),
  ('Finite Element Analysis','Hardware'),
  ('3D Printing','Hardware'),
  ('Manufacturing','Hardware'),
  ('Branding','Design'),
  ('Illustration','Design'),
  ('Photoshop','Design'),
  ('After Effects','Design'),
  ('Typography','Design'),
  ('CI/CD','DevOps'),
  ('Roadmapping','Product'),
  ('Analytics','Product'),
  ('Go-to-Market','Product'),
  ('User Interviews','Design'),
  ('Statistics','Data'),
  ('Qualitative Methods','Research'),
  ('NLP','AI/ML'),
  ('Biosensors','Hardware'),
  ('Computer Vision','AI/ML'),
  ('CRDTs','Backend'),
  ('Firebase','Backend'),
  ('Verilog','Hardware')
ON CONFLICT (name) DO NOTHING;
