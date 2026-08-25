export type Department =
  | 'Computer Science'
  | 'Electrical Engineering'
  | 'Mechanical Engineering'
  | 'Design'
  | 'Business'
  | 'Data Science'
  | 'Biomedical Engineering'
  | 'Cognitive Science';

export type Year = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';

export type Availability =
  | 'Full-time'
  | 'Part-time'
  | 'Weekends'
  | 'Evenings'
  | 'Limited'
  | 'Unavailable';

export type WorkStyle = 'Collaborative' | 'Independent' | 'Hybrid' | 'Async-first';

export type Role =
  | 'Frontend Developer'
  | 'Backend Developer'
  | 'Full-stack Developer'
  | 'Mobile Developer'
  | 'UI/UX Designer'
  | 'Product Manager'
  | 'Data Scientist'
  | 'ML Engineer'
  | 'DevOps Engineer'
  | 'Hardware Engineer'
  | 'Researcher'
  | 'Marketing Lead';

export type ProjectCategory =
  | 'Academic'
  | 'Hackathon'
  | 'Research'
  | 'Startup'
  | 'Competition'
  | 'Open Source';

export type ProjectStatus = 'Recruiting' | 'In Progress' | 'Planning' | 'Completed';

export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;
export type Importance = 'Required' | 'Preferred' | 'Nice-to-have';
export type EvidenceStatus = 'unverified' | 'pending' | 'verified';

export interface Student {
  id: string;
  name: string;
  avatarColor: string;
  initials: string;
  department: string;
  year: string;
  bio: string;
  skills: UserSkillDisplay[];
  interests: string[];
  preferredRoles: Role[];
  availability: Availability;
  workStyle: WorkStyle;
  communicationPreference?: 'asynchronous' | 'frequent discussion' | 'mixed';
  collaborationPreference?: 'independent' | 'collaborative' | 'mixed';
  leadershipPreference?: 'prefer leading' | 'shared leadership' | 'prefer specialist role';
  availableHoursPerWeek?: number;
  preferredProjectDurationWeeks?: number;
  experience: ExperienceItem[];
  projects: string[];
  matchScore: number;
  email: string;
}

export interface UserSkillDisplay {
  skillId: string;
  skillName: string;
  proficiency: ProficiencyLevel;
  yearsExperience: number;
  evidenceStatus: EvidenceStatus;
  projectEvidenceCount?: number;
  portfolioEvidenceCount?: number;
}

export interface ExperienceItem {
  id: string;
  title: string;
  org: string;
  duration: string;
  description: string;
}

export interface AvailabilityBlock {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  requiredSkills: string[];
  preferredRoles: Role[];
  teamSize: number;
  currentMembers: number;
  timeline: string;
  expectedHoursPerWeek?: number;
  durationWeeks?: number;
  deadlineIntensity?: 'low' | 'medium' | 'high';
  availabilityReq: Availability;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  matchScore: number;
}

export interface ProjectRequirement {
  id: string;
  skillId: string;
  skillName: string;
  requiredProficiency: ProficiencyLevel;
  importance: Importance;
  peopleNeeded: number;
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  initials: string;
  avatarColor: string;
  role: string | null;
  status: 'member' | 'invited' | 'requested';
}

export interface Team {
  id: string;
  name: string;
  projectId: string;
  projectTitle: string;
  members: TeamMember[];
  status: ProjectStatus;
  createdAt: string;
  skillCoverage: SkillCoverageItem[];
  missingSkills: string[];
  compatibility: number;
}

export interface TeamMember {
  studentId: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: Role;
  skills: string[];
  availability: Availability;
}

export interface SkillCoverageItem {
  skill: string;
  covered: boolean;
  count: number;
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'Hackathon' | 'Internship' | 'Competition' | 'Grant' | 'Research';
  organizer: string;
  deadline: string;
  description: string;
  tags: string[];
}

export interface SkillGap {
  id: string;
  teamName: string;
  skill: string;
  severity: 'High' | 'Medium' | 'Low';
  suggestedStudents: number;
}
