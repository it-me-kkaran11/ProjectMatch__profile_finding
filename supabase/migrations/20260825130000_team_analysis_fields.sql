ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS communication_preference text CHECK (communication_preference IN ('asynchronous','frequent discussion','mixed')),
  ADD COLUMN IF NOT EXISTS collaboration_preference text CHECK (collaboration_preference IN ('independent','collaborative','mixed')),
  ADD COLUMN IF NOT EXISTS leadership_preference text CHECK (leadership_preference IN ('prefer leading','shared leadership','prefer specialist role')),
  ADD COLUMN IF NOT EXISTS available_hours_per_week numeric CHECK (available_hours_per_week >= 0),
  ADD COLUMN IF NOT EXISTS preferred_project_duration_weeks int CHECK (preferred_project_duration_weeks > 0);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS expected_hours_per_week numeric CHECK (expected_hours_per_week > 0),
  ADD COLUMN IF NOT EXISTS duration_weeks int CHECK (duration_weeks > 0),
  ADD COLUMN IF NOT EXISTS deadline_intensity text CHECK (deadline_intensity IN ('low','medium','high'));

ALTER TABLE skill_evidence
  ADD COLUMN IF NOT EXISTS evidence_type text NOT NULL DEFAULT 'project' CHECK (evidence_type IN ('project','portfolio'));
