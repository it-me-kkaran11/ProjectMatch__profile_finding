import type { Student, Project, ProjectRequirement, UserSkillDisplay, WorkStyle } from '@/types';

// ============ Weights ============
export const WEIGHTS = {
  skillMatch: 35,
  complementarySkill: 15,
  availability: 15,
  interest: 10,
  experience: 10,
  workStyle: 10,
  evidence: 5,
} as const;

// ============ Types ============
export interface RecommendationResult {
  overallScore: number;
  skillScore: number;
  complementaryScore: number;
  availabilityScore: number;
  interestScore: number;
  experienceScore: number;
  workStyleScore: number;
  evidenceScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  explanation: string;
}

type RecommendationComponents = Omit<RecommendationResult, 'explanation' | 'strengths' | 'concerns'>;

export interface StudentRecommendation {
  student: Student;
  result: RecommendationResult;
}

// ============ Helpers ============

function getStudentSkillNames(student: Student): string[] {
  return student.skills.map((s) => s.skillName);
}

function getStudentSkillMap(student: Student): Map<string, UserSkillDisplay> {
  return new Map(student.skills.map((s) => [s.skillName, s]));
}

function clampScore(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

// ============ Scoring Functions ============

function scoreSkillMatch(student: Student, requirements: ProjectRequirement[]): { score: number; matched: string[]; missing: string[] } {
  if (requirements.length === 0) return { score: 50, matched: [], missing: [] };
  const skillMap = getStudentSkillMap(student);
  let totalWeight = 0;
  let earnedWeight = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  for (const req of requirements) {
    const importanceWeight = req.importance === 'Required' ? 3 : req.importance === 'Preferred' ? 2 : 1;
    totalWeight += importanceWeight;

    const studentSkill = skillMap.get(req.skillName);
    if (studentSkill) {
      // Proficiency ratio: how close to required proficiency
      const profRatio = Math.min(1, studentSkill.proficiency / req.requiredProficiency);
      earnedWeight += importanceWeight * profRatio;
      matched.push(req.skillName);
    } else {
      missing.push(req.skillName);
    }
  }

  const score = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
  return { score: clampScore(score), matched, missing };
}

function scoreComplementarySkills(student: Student, project: Project): number {
  const projectSkillNames = new Set(project.requiredSkills);
  const studentSkillNames = getStudentSkillNames(student);
  // Skills the student has that are NOT in the project requirements but could be useful
  // We check if the student has skills beyond what's required — diversity bonus
  const extraSkills = studentSkillNames.filter((s) => !projectSkillNames.has(s));
  // Also check: does the student have skills that complement the project's preferred roles?
  const roleSkillMap: Record<string, string[]> = {
    'Frontend Developer': ['React', 'TypeScript', 'CSS', 'Figma', 'Framer Motion'],
    'Backend Developer': ['Node.js', 'Python', 'Go', 'Rust', 'PostgreSQL', 'GraphQL'],
    'Full-stack Developer': ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    'Mobile Developer': ['React Native', 'Flutter', 'Swift', 'Dart'],
    'UI/UX Designer': ['Figma', 'User Research', 'Accessibility', 'Prototyping', 'Branding'],
    'Product Manager': ['Product Strategy', 'Roadmapping', 'Analytics', 'Go-to-Market', 'User Interviews'],
    'Data Scientist': ['Python', 'Statistics', 'Machine Learning', 'SQL'],
    'ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'MLOps', 'LLMs', 'NLP'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Prometheus'],
    'Hardware Engineer': ['C/C++', 'Embedded Systems', 'PCB Design', 'CAD', 'ROS', 'Verilog'],
    'Researcher': ['User Research', 'Qualitative Methods', 'Statistics', 'Python'],
    'Marketing Lead': ['Branding', 'Illustration', 'Go-to-Market', 'Analytics'],
  };

  let complementScore = 0;
  for (const role of project.preferredRoles) {
    const roleSkills = roleSkillMap[role] ?? [];
    const hasRoleSkills = roleSkills.some((rs) => studentSkillNames.includes(rs));
    if (hasRoleSkills) complementScore += 15;
  }

  // Bonus for having extra diverse skills (up to 40)
  complementScore += Math.min(40, extraSkills.length * 8);

  return clampScore(complementScore);
}

function scoreAvailability(student: Student, project: Project): number {
  const studentAvail = student.availability;
  const projectAvail = project.availabilityReq;

  if (studentAvail === 'Unavailable') return 0;

  const availabilityMap: Record<string, number> = {
    'Full-time': 100,
    'Part-time': 75,
    'Weekends': 50,
    'Evenings': 50,
    'Limited': 25,
    'Unavailable': 0,
  };

  const studentScore = availabilityMap[studentAvail] ?? 50;
  const projectScore = availabilityMap[projectAvail] ?? 50;

  // If student availability >= project requirement, good match
  if (studentScore >= projectScore) return 100;
  // Partial overlap
  const ratio = studentScore / Math.max(1, projectScore);
  return clampScore(ratio * 80);
}

function scoreInterestAlignment(student: Student, project: Project): number {
  if (student.interests.length === 0) return 30;

  // Map project category to relevant interests
  const categoryInterests: Record<string, string[]> = {
    'Academic': ['Education', 'Research', 'EdTech'],
    'Hackathon': ['Developer Tools', 'AI/ML', 'Mobile', 'Open Source'],
    'Research': ['AI/ML', 'Healthcare', 'Robotics', 'Sustainability'],
    'Startup': ['Startups', 'Growth', 'Marketplaces'],
    'Competition': ['AI/ML', 'Robotics', 'Design'],
    'Open Source': ['Open Source', 'Developer Tools', 'Infrastructure'],
  };

  const relevantInterests = categoryInterests[project.category] ?? [];
  const overlap = student.interests.filter((i) =>
    relevantInterests.some((ri) => i.toLowerCase().includes(ri.toLowerCase()) || ri.toLowerCase().includes(i.toLowerCase()))
  );

  if (relevantInterests.length === 0) return 50;
  return clampScore((overlap.length / relevantInterests.length) * 100);
}

function scoreExperienceFit(student: Student, project: Project): number {
  if (student.experience.length === 0) return 20;

  // Score based on number of experiences and their relevance
  const expCount = student.experience.length;
  let score = Math.min(50, expCount * 15);

  // Check if any experience mentions project-relevant keywords
  const projectKeywords = [project.category, ...project.requiredSkills].map((k) => k.toLowerCase());
  for (const exp of student.experience) {
    const expText = `${exp.title} ${exp.org} ${exp.description}`.toLowerCase();
    if (projectKeywords.some((kw) => expText.includes(kw))) {
      score += 20;
      break;
    }
  }

  return clampScore(score);
}

function scoreWorkStyleFit(student: Student, project: Project): number {
  // If project has preferred roles, certain work styles are better
  // Collaborative projects benefit from Collaborative/Hybrid
  // Research benefits from Independent/Async-first
  const categoryStyles: Record<string, WorkStyle[]> = {
    'Academic': ['Independent', 'Async-first', 'Hybrid'],
    'Hackathon': ['Collaborative', 'Hybrid'],
    'Research': ['Independent', 'Async-first'],
    'Startup': ['Collaborative', 'Hybrid'],
    'Competition': ['Collaborative', 'Hybrid'],
    'Open Source': ['Async-first', 'Independent', 'Hybrid'],
  };

  const preferredStyles = categoryStyles[project.category] ?? ['Collaborative', 'Hybrid'];
  if (preferredStyles.includes(student.workStyle)) return 100;
  if (student.workStyle === 'Hybrid') return 75;
  return 50;
}

function scoreSkillEvidence(student: Student): number {
  if (student.skills.length === 0) return 0;
  const verified = student.skills.filter((s) => s.evidenceStatus === 'verified').length;
  const pending = student.skills.filter((s) => s.evidenceStatus === 'pending').length;
  const total = student.skills.length;
  return clampScore(((verified * 100 + pending * 50) / total));
}

// ============ Explanation Generator ============

function generateExplanation(
  student: Student,
  project: Project,
  result: RecommendationComponents,
): string {
  const parts: string[] = [];

  // Skill-based explanation
  if (result.skillScore >= 80) {
    const topSkills = result.matchedSkills.slice(0, 3).join(', ');
    parts.push(`strong ${topSkills} skills`);
  } else if (result.skillScore >= 50) {
    parts.push(`partial skill coverage (${result.matchedSkills.length} of ${result.matchedSkills.length + result.missingSkills.length} required skills)`);
  } else {
    parts.push(`limited skill overlap with project requirements`);
  }

  // Availability
  if (result.availabilityScore >= 80) {
    parts.push(`high availability overlap`);
  } else if (result.availabilityScore >= 50) {
    parts.push(`moderate availability`);
  } else if (result.availabilityScore < 25) {
    parts.push(`low availability`);
  }

  // Interest
  if (result.interestScore >= 70) {
    parts.push(`relevant interest in ${project.category.toLowerCase()} projects`);
  }

  // Evidence
  if (result.evidenceScore >= 70) {
    parts.push(`verified skill evidence`);
  }

  const explanation = `${result.overallScore}% match because the student has ${parts.join(', ')}.`;
  return explanation;
}

function generateStrengths(student: Student, project: Project, result: RecommendationComponents): string[] {
  const strengths: string[] = [];

  if (result.skillScore >= 75) strengths.push(`Strong coverage of required skills (${result.matchedSkills.length} matched)`);
  if (result.complementaryScore >= 60) strengths.push(`Valuable complementary skills beyond requirements`);
  if (result.availabilityScore >= 80) strengths.push(`Excellent availability alignment`);
  if (result.interestScore >= 70) strengths.push(`Strong interest alignment with ${project.category}`);
  if (result.experienceScore >= 60) strengths.push(`Relevant prior experience`);
  if (result.workStyleScore >= 80) strengths.push(`Ideal work style for this project type`);
  if (result.evidenceScore >= 70) strengths.push(`Verified skill evidence`);

  // Role-specific strengths
  for (const role of project.preferredRoles) {
    if (student.preferredRoles.includes(role)) {
      strengths.push(`Prefers ${role} role — matches project needs`);
      break;
    }
  }

  return strengths;
}

function generateConcerns(student: Student, project: Project, result: RecommendationComponents): string[] {
  const concerns: string[] = [];

  if (result.missingSkills.length > 0) {
    const critical = result.missingSkills.slice(0, 3).join(', ');
    concerns.push(`Missing ${result.missingSkills.length} skill${result.missingSkills.length !== 1 ? 's' : ''}: ${critical}`);
  }
  if (result.availabilityScore < 50) concerns.push(`Limited availability for project timeline`);
  if (result.workStyleScore < 60) concerns.push(`Work style may not align with project type`);
  if (result.experienceScore < 40) concerns.push(`Limited relevant experience`);
  if (result.evidenceScore < 40) concerns.push(`Skills lack verification evidence`);

  return concerns;
}

// ============ Main API ============

export function scoreStudentForProject(student: Student, project: Project, requirements: ProjectRequirement[]): RecommendationResult {
  const skillResult = scoreSkillMatch(student, requirements);
  const complementary = scoreComplementarySkills(student, project);
  const availability = scoreAvailability(student, project);
  const interest = scoreInterestAlignment(student, project);
  const experience = scoreExperienceFit(student, project);
  const workStyle = scoreWorkStyleFit(student, project);
  const evidence = scoreSkillEvidence(student);

  const overallScore = clampScore(
    skillResult.score * (WEIGHTS.skillMatch / 100) +
    complementary * (WEIGHTS.complementarySkill / 100) +
    availability * (WEIGHTS.availability / 100) +
    interest * (WEIGHTS.interest / 100) +
    experience * (WEIGHTS.experience / 100) +
    workStyle * (WEIGHTS.workStyle / 100) +
    evidence * (WEIGHTS.evidence / 100)
  );

  const partial = {
    overallScore,
    skillScore: skillResult.score,
    complementaryScore: complementary,
    availabilityScore: availability,
    interestScore: interest,
    experienceScore: experience,
    workStyleScore: workStyle,
    evidenceScore: evidence,
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing,
  };

  const strengths = generateStrengths(student, project, partial);
  const concerns = generateConcerns(student, project, partial);
  const explanation = generateExplanation(student, project, partial);

  return { ...partial, strengths, concerns, explanation };
}

export function recommendStudentsForProject(
  students: Student[],
  project: Project,
  requirements: ProjectRequirement[],
): StudentRecommendation[] {
  return students
    .map((student) => ({
      student,
      result: scoreStudentForProject(student, project, requirements),
    }))
    .sort((a, b) => b.result.overallScore - a.result.overallScore);
}

// ============ Find Talent (Natural Language) ============

export interface FindTalentResult {
  student: Student;
  matchScore: number;
  matchedSkills: string[];
  matchedInterests: string[];
  explanation: string;
}

const SKILL_ALIASES: Record<string, string[]> = {
  'python': ['Python'],
  'ml': ['Machine Learning', 'ML', 'PyTorch', 'TensorFlow'],
  'machine learning': ['Machine Learning', 'PyTorch', 'TensorFlow'],
  'ai': ['Machine Learning', 'LLMs', 'NLP', 'PyTorch'],
  'react': ['React'],
  'frontend': ['React', 'TypeScript', 'CSS', 'Figma'],
  'backend': ['Node.js', 'Python', 'Go', 'Rust', 'PostgreSQL'],
  'fullstack': ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  'full-stack': ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
  'design': ['Figma', 'User Research', 'Accessibility', 'Prototyping'],
  'ui': ['Figma', 'Prototyping', 'CSS'],
  'ux': ['User Research', 'Accessibility', 'Figma'],
  'mobile': ['React Native', 'Flutter', 'Swift', 'Dart'],
  'devops': ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
  'cloud': ['AWS', 'Docker', 'Kubernetes'],
  'data science': ['Python', 'Statistics', 'SQL', 'Machine Learning'],
  'hardware': ['C/C++', 'Embedded Systems', 'PCB Design', 'CAD', 'ROS'],
  'robotics': ['ROS', 'C/C++', 'Python', 'Embedded Systems'],
  'research': ['User Research', 'Qualitative Methods', 'Statistics'],
  'healthcare': ['Healthcare', 'Medical Devices', 'Biosensors'],
  'education': ['EdTech', 'Education'],
  'startup': ['Startups', 'Product Strategy', 'Go-to-Market'],
  'open source': ['Open Source'],
  'javascript': ['React', 'TypeScript', 'Node.js'],
  'typescript': ['TypeScript'],
  'node': ['Node.js'],
  'sql': ['SQL', 'PostgreSQL'],
  'database': ['PostgreSQL', 'SQL'],
  'docker': ['Docker'],
  'kubernetes': ['Kubernetes'],
  'aws': ['AWS'],
  'figma': ['Figma'],
  'css': ['CSS'],
  'c++': ['C/C++'],
  'embedded': ['Embedded Systems'],
  'pcb': ['PCB Design'],
  'cad': ['CAD'],
  'nlp': ['NLP'],
  'pytorch': ['PyTorch'],
  'tensorflow': ['TensorFlow'],
  'llm': ['LLMs'],
  'llms': ['LLMs'],
};

const INTEREST_KEYWORDS: Record<string, string[]> = {
  'healthcare': ['Healthcare', 'Medical Devices', 'Bioinformatics'],
  'education': ['EdTech', 'Education'],
  'startup': ['Startups'],
  'ai': ['AI/ML', 'Applied ML'],
  'ml': ['AI/ML', 'Applied ML'],
  'robotics': ['Robotics'],
  'mobile': ['Mobile Development'],
  'open source': ['Open Source'],
  'sustainability': ['Sustainability'],
  'social impact': ['Social Impact'],
  'design': ['Design', 'Design Systems', 'Brand Identity'],
  'infrastructure': ['Infrastructure', 'Distributed Systems'],
  'security': ['Security'],
  'automation': ['Automation'],
};

export function parseTalentRequest(query: string): { skills: string[]; interests: string[] } {
  const lower = query.toLowerCase();
  const skills = new Set<string>();
  const interests = new Set<string>();

  for (const [alias, mapped] of Object.entries(SKILL_ALIASES)) {
    if (lower.includes(alias)) {
      mapped.forEach((s) => skills.add(s));
    }
  }

  for (const [keyword, mapped] of Object.entries(INTEREST_KEYWORDS)) {
    if (lower.includes(keyword)) {
      mapped.forEach((i) => interests.add(i));
    }
  }

  return { skills: [...skills], interests: [...interests] };
}

export function findTalent(query: string, students: Student[]): FindTalentResult[] {
  const { skills: querySkills, interests: queryInterests } = parseTalentRequest(query);

  return students
    .map((student) => {
      const studentSkillNames = getStudentSkillNames(student);
      const matchedSkills = querySkills.filter((qs) => studentSkillNames.some((ss) => ss.toLowerCase() === qs.toLowerCase()));
      const matchedInterests = queryInterests.filter((qi) => student.interests.some((si) => si.toLowerCase().includes(qi.toLowerCase())));

      // Score: 60% skill match, 25% interest match, 15% evidence
      const skillScore = querySkills.length > 0 ? (matchedSkills.length / querySkills.length) * 60 : 30;
      const interestScore = queryInterests.length > 0 ? (matchedInterests.length / queryInterests.length) * 25 : 10;
      const evidenceScore = (scoreSkillEvidence(student) / 100) * 15;
      const matchScore = clampScore(skillScore + interestScore + evidenceScore);

      const parts: string[] = [];
      if (matchedSkills.length > 0) parts.push(`matches ${matchedSkills.length} of ${querySkills.length} requested skills`);
      if (matchedInterests.length > 0) parts.push(`shares interest in ${matchedInterests.join(', ')}`);
      if (parts.length === 0) parts.push('partial overlap with search criteria');

      return {
        student,
        matchScore,
        matchedSkills,
        matchedInterests,
        explanation: `${matchScore}% — ${parts.join('; ')}.`,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
