import { supabase } from '@/lib/supabase';
import { scoreTeam } from '@/lib/teamEngine';
import type {
  Student,
  UserSkillDisplay,
  AvailabilityBlock,
  Project,
  ProjectRequirement,
  ProjectMember,
  Team,
  Role,
  ProjectCategory,
  ProjectStatus,
  Availability,
} from '@/types';

// ============ Constants ============

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Academic', 'Hackathon', 'Research', 'Startup', 'Competition', 'Open Source',
];

export const PROJECT_STATUSES: ProjectStatus[] = [
  'Recruiting', 'In Progress', 'Planning', 'Completed',
];

export const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Expert',
};

export const IMPORTANCE_LEVELS = ['Required', 'Preferred', 'Nice-to-have'] as const;

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AVATAR_COLORS = [
  'bg-brand-500', 'bg-accent-500', 'bg-blue-500', 'bg-purple-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-slate-600',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';
}

// ============ Skills ============

export async function fetchAllSkills(): Promise<{ id: string; name: string; category: string | null }[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

// ============ Students ============

export async function fetchAllStudents(): Promise<Student[]> {
  // Fetch profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, department, year, bio, interests, preferred_roles, work_style')
    .order('full_name');
  if (profileError) throw profileError;
  if (!profiles || profiles.length === 0) return [];

  // Fetch all user_skills with skill names
  const { data: userSkills, error: skillsError } = await supabase
    .from('user_skills')
    .select('id, user_id, skill_id, proficiency, years_experience, evidence_status, skills(name)')
    .order('proficiency', { ascending: false });
  if (skillsError) throw skillsError;

  // Fetch all availability blocks
  const { data: availability, error: availError } = await supabase
    .from('student_availability')
    .select('id, user_id, day_of_week, start_time, end_time')
    .order('day_of_week');
  if (availError) throw availError;

  // Group skills by user
  const skillsByUser = new Map<string, UserSkillDisplay[]>();
  for (const us of userSkills ?? []) {
    const skillName = (us.skills as unknown as { name: string })?.name ?? 'Unknown';
    const arr = skillsByUser.get(us.user_id) ?? [];
    arr.push({
      skillId: us.skill_id,
      skillName,
      proficiency: us.proficiency,
      yearsExperience: Number(us.years_experience),
      evidenceStatus: us.evidence_status,
    });
    skillsByUser.set(us.user_id, arr);
  }

  // Group availability by user
  const availByUser = new Map<string, AvailabilityBlock[]>();
  for (const a of availability ?? []) {
    const arr = availByUser.get(a.user_id) ?? [];
    arr.push({
      id: a.id,
      dayOfWeek: a.day_of_week,
      startTime: a.start_time,
      endTime: a.end_time,
    });
    availByUser.set(a.user_id, arr);
  }

  return profiles.map((p) => {
    const skills = skillsByUser.get(p.id) ?? [];
    const blocks = availByUser.get(p.id) ?? [];
    return {
      id: p.id,
      name: p.full_name,
      avatarColor: getAvatarColor(p.id),
      initials: getInitials(p.full_name),
      department: p.department ?? 'Undeclared',
      year: p.year ?? 'Freshman',
      bio: p.bio ?? 'No bio yet.',
      skills,
      interests: p.interests ?? [],
      preferredRoles: (p.preferred_roles ?? []) as Role[],
      availability: deriveAvailability(blocks),
      workStyle: (p.work_style as Student['workStyle']) ?? 'Collaborative',
      experience: [],
      projects: [],
      matchScore: 0,
      email: p.email,
    };
  });
}

export async function fetchStudentById(id: string): Promise<Student | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, department, year, bio, interests, preferred_roles, work_style')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  // Fetch skills
  const { data: userSkills, error: skillsError } = await supabase
    .from('user_skills')
    .select('id, user_id, skill_id, proficiency, years_experience, evidence_status, skills(name)')
    .eq('user_id', id)
    .order('proficiency', { ascending: false });
  if (skillsError) throw skillsError;

  // Fetch availability
  const { data: availability, error: availError } = await supabase
    .from('student_availability')
    .select('id, user_id, day_of_week, start_time, end_time')
    .eq('user_id', id)
    .order('day_of_week');
  if (availError) throw availError;

  const skills: UserSkillDisplay[] = (userSkills ?? []).map((us) => ({
    skillId: us.skill_id,
    skillName: (us.skills as unknown as { name: string })?.name ?? 'Unknown',
    proficiency: us.proficiency,
    yearsExperience: Number(us.years_experience),
    evidenceStatus: us.evidence_status,
  }));

  const blocks: AvailabilityBlock[] = (availability ?? []).map((a) => ({
    id: a.id,
    dayOfWeek: a.day_of_week,
    startTime: a.start_time,
    endTime: a.end_time,
  }));

  return {
    id: profile.id,
    name: profile.full_name,
    avatarColor: getAvatarColor(profile.id),
    initials: getInitials(profile.full_name),
    department: profile.department ?? 'Undeclared',
    year: profile.year ?? 'Freshman',
    bio: profile.bio ?? 'No bio yet.',
    skills,
    interests: profile.interests ?? [],
    preferredRoles: (profile.preferred_roles ?? []) as Role[],
    availability: deriveAvailability(blocks),
    workStyle: (profile.work_style as Student['workStyle']) ?? 'Collaborative',
    experience: [],
    projects: [],
    matchScore: 0,
    email: profile.email,
  };
}

function deriveAvailability(blocks: AvailabilityBlock[]): Availability {
  if (blocks.length === 0) return 'Unavailable';
  const days = new Set(blocks.map((b) => b.dayOfWeek));
  const hasWeekend = days.has(0) || days.has(6);
  const hasWeekday = days.has(1) || days.has(2) || days.has(3) || days.has(4) || days.has(5);
  if (hasWeekend && hasWeekday && blocks.length >= 5) return 'Full-time';
  if (hasWeekend && !hasWeekday) return 'Weekends';
  const allEvening = blocks.every((b) => b.startTime >= '17:00:00');
  if (allEvening && !hasWeekend) return 'Evenings';
  if (blocks.length <= 2) return 'Limited';
  return 'Part-time';
}

// ============ Projects ============

export async function fetchAllProjects(): Promise<Project[]> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, creator_id, title, tagline, description, category, status, team_size, timeline, preferred_availability, preferred_roles, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!projects || projects.length === 0) return [];

  // Fetch requirements
  const { data: requirements, error: reqError } = await supabase
    .from('project_requirements')
    .select('project_id, skill_id, skills(name)');
  if (reqError) throw reqError;

  // Fetch members (count active members)
  const { data: members, error: memberError } = await supabase
    .from('project_members')
    .select('project_id, status');
  if (memberError) throw memberError;

  // Fetch creator names from profiles
  const creatorIds = [...new Set(projects.map((p) => p.creator_id))];
  const { data: creators, error: creatorError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', creatorIds);
  if (creatorError) throw creatorError;

  const creatorMap = new Map((creators ?? []).map((c) => [c.id, c.full_name]));

  const skillsByProject = new Map<string, string[]>();
  for (const r of requirements ?? []) {
    const skillName = (r.skills as unknown as { name: string })?.name ?? 'Unknown';
    const arr = skillsByProject.get(r.project_id) ?? [];
    arr.push(skillName);
    skillsByProject.set(r.project_id, arr);
  }

  const memberCountByProject = new Map<string, number>();
  for (const m of members ?? []) {
    if (m.status === 'member') {
      memberCountByProject.set(m.project_id, (memberCountByProject.get(m.project_id) ?? 0) + 1);
    }
  }

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    tagline: p.tagline ?? '',
    description: p.description ?? '',
    category: p.category as ProjectCategory,
    status: p.status as ProjectStatus,
    requiredSkills: skillsByProject.get(p.id) ?? [],
    preferredRoles: (p.preferred_roles ?? []) as Role[],
    teamSize: p.team_size,
    currentMembers: (memberCountByProject.get(p.id) ?? 0) + 1, // +1 for creator
    timeline: p.timeline ?? '',
    availabilityReq: (p.preferred_availability as Availability) ?? 'Part-time',
    ownerId: p.creator_id,
    ownerName: creatorMap.get(p.creator_id) ?? 'Unknown',
    createdAt: p.created_at,
    matchScore: 0,
  }));
}

export async function fetchTeamsForUser(userId: string): Promise<Team[]> {
  const [projects, students] = await Promise.all([fetchAllProjects(), fetchAllStudents()]);
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const teams: Team[] = [];

  for (const project of projects) {
    const detail = await fetchProjectById(project.id);
    if (!detail) continue;

    const activeMemberIds = new Set([
      project.ownerId,
      ...detail.members.filter((member) => member.status === 'member').map((member) => member.userId),
    ]);
    if (!activeMemberIds.has(userId)) continue;

    const teamMembers = [...activeMemberIds]
      .map((memberId) => {
        const student = studentMap.get(memberId);
        if (!student) return null;
        const membership = detail.members.find((member) => member.userId === memberId);
        return {
          studentId: student.id,
          name: student.name,
          initials: student.initials,
          avatarColor: student.avatarColor,
          role: (membership?.role as Role | null) ?? student.preferredRoles[0] ?? 'Researcher',
          skills: student.skills.map((skill) => skill.skillName),
          availability: student.availability,
        };
      })
      .filter((member): member is NonNullable<typeof member> => member !== null);

    const skillCoverage = detail.requirements.map((requirement) => {
      const count = teamMembers.filter((member) => {
        const student = studentMap.get(member.studentId);
        return student?.skills.some((skill) => skill.skillName === requirement.skillName && skill.proficiency >= requirement.requiredProficiency) ?? false;
      }).length;
      return { skill: requirement.skillName, covered: count >= requirement.peopleNeeded, count };
    });

    const memberStudents = teamMembers.map((member) => studentMap.get(member.studentId)).filter((student): student is Student => Boolean(student));
    const score = scoreTeam(memberStudents, project, detail.requirements);

    teams.push({
      id: project.id,
      name: `${project.title} Team`,
      projectId: project.id,
      projectTitle: project.title,
      members: teamMembers,
      status: project.status,
      createdAt: project.createdAt,
      skillCoverage,
      missingSkills: skillCoverage.filter((skill) => !skill.covered).map((skill) => skill.skill),
      compatibility: score.compatibility,
    });
  }

  return teams;
}

export async function fetchProjectById(id: string): Promise<{
  project: Project;
  requirements: ProjectRequirement[];
  members: ProjectMember[];
} | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, creator_id, title, tagline, description, category, status, team_size, timeline, preferred_availability, preferred_roles, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!project) return null;

  // Fetch requirements with skill names
  const { data: requirements, error: reqError } = await supabase
    .from('project_requirements')
    .select('id, project_id, skill_id, required_proficiency, importance, people_needed, skills(name)')
    .eq('project_id', id);
  if (reqError) throw reqError;

  // Fetch members
  const { data: members, error: memberError } = await supabase
    .from('project_members')
    .select('id, project_id, user_id, role, status, joined_at')
    .eq('project_id', id);
  if (memberError) throw memberError;

  // Fetch creator profile
  const { data: creator, error: creatorError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', project.creator_id)
    .maybeSingle();
  if (creatorError) throw creatorError;

  // Fetch member profiles
  const memberUserIds = (members ?? []).map((m) => m.user_id);
  let memberProfiles: { id: string; full_name: string }[] = [];
  if (memberUserIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', memberUserIds);
    if (profileError) throw profileError;
    memberProfiles = profiles ?? [];
  }

  const memberProfileMap = new Map(memberProfiles.map((p) => [p.id, p.full_name]));

  const reqData: ProjectRequirement[] = (requirements ?? []).map((r) => ({
    id: r.id,
    skillId: r.skill_id,
    skillName: (r.skills as unknown as { name: string })?.name ?? 'Unknown',
    requiredProficiency: r.required_proficiency,
    importance: r.importance as ProjectRequirement['importance'],
    peopleNeeded: r.people_needed,
  }));

  const memberData: ProjectMember[] = (members ?? []).map((m) => {
    const name = memberProfileMap.get(m.user_id) ?? 'Unknown';
    return {
      id: m.id,
      userId: m.user_id,
      userName: name,
      initials: getInitials(name),
      avatarColor: getAvatarColor(m.user_id),
      role: m.role,
      status: m.status as ProjectMember['status'],
    };
  });

  const proj: Project = {
    id: project.id,
    title: project.title,
    tagline: project.tagline ?? '',
    description: project.description ?? '',
    category: project.category as ProjectCategory,
    status: project.status as ProjectStatus,
    requiredSkills: reqData.map((r) => r.skillName),
    preferredRoles: (project.preferred_roles ?? []) as Role[],
    teamSize: project.team_size,
    currentMembers: memberData.filter((m) => m.status === 'member').length + 1,
    timeline: project.timeline ?? '',
    availabilityReq: (project.preferred_availability as Availability) ?? 'Part-time',
    ownerId: project.creator_id,
    ownerName: creator?.full_name ?? 'Unknown',
    createdAt: project.created_at,
    matchScore: 0,
  };

  return { project: proj, requirements: reqData, members: memberData };
}

// ============ Project mutations ============

export async function createProject(
  data: {
    title: string;
    tagline: string;
    description: string;
    category: ProjectCategory;
    teamSize: number;
    timeline: string;
    preferredAvailability: string;
    preferredRoles: string[];
    requirements: { skillId: string; requiredProficiency: number; importance: string; peopleNeeded: number }[];
  },
  creatorId: string,
): Promise<string> {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      creator_id: creatorId,
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      category: data.category,
      team_size: data.teamSize,
      timeline: data.timeline,
      preferred_availability: data.preferredAvailability,
      preferred_roles: data.preferredRoles,
      status: 'Recruiting',
    })
    .select('id')
    .single();
  if (error) throw error;

  const projectId = project.id;

  // Insert requirements
  if (data.requirements.length > 0) {
    const { error: reqError } = await supabase
      .from('project_requirements')
      .insert(data.requirements.map((r) => ({
        project_id: projectId,
        skill_id: r.skillId,
        required_proficiency: r.requiredProficiency,
        importance: r.importance,
        people_needed: r.peopleNeeded,
      })));
    if (reqError) throw reqError;
  }

  // Add creator as member
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: creatorId, status: 'member' });
  if (memberError) throw memberError;

  return projectId;
}

export async function updateProject(
  projectId: string,
  data: {
    title: string;
    tagline: string;
    description: string;
    category: ProjectCategory;
    teamSize: number;
    timeline: string;
    preferredAvailability: string;
    preferredRoles: string[];
    status: ProjectStatus;
    requirements: { skillId: string; requiredProficiency: number; importance: string; peopleNeeded: number }[];
  },
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      category: data.category,
      team_size: data.teamSize,
      timeline: data.timeline,
      preferred_availability: data.preferredAvailability,
      preferred_roles: data.preferredRoles,
      status: data.status,
    })
    .eq('id', projectId);
  if (error) throw error;

  // Replace requirements: delete all, then re-insert
  const { error: delError } = await supabase
    .from('project_requirements')
    .delete()
    .eq('project_id', projectId);
  if (delError) throw delError;

  if (data.requirements.length > 0) {
    const { error: reqError } = await supabase
      .from('project_requirements')
      .insert(data.requirements.map((r) => ({
        project_id: projectId,
        skill_id: r.skillId,
        required_proficiency: r.requiredProficiency,
        importance: r.importance,
        people_needed: r.peopleNeeded,
      })));
    if (reqError) throw reqError;
  }
}

export async function joinProject(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, status: 'requested' });
  if (error) throw error;
}

export async function leaveProject(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateMemberStatus(
  projectId: string,
  memberId: string,
  status: 'member' | 'invited' | 'requested',
): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .update({ status })
    .eq('id', memberId);
  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}
