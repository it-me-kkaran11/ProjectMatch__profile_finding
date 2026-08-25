import type { Project, ProjectRequirement, Student } from '@/types';

export type SkillMatchKind = 'Exact' | 'Related' | 'Transferable';
export interface SkillAdjacency { from: string; to: string; kind: SkillMatchKind; }

// Keep this table intentionally small and editable as the skill catalog grows.
export const SKILL_ADJACENCIES: SkillAdjacency[] = [
  { from: 'React', to: 'JavaScript', kind: 'Related' },
  { from: 'React', to: 'Vue', kind: 'Related' },
  { from: 'React', to: 'HTML/CSS', kind: 'Transferable' },
  { from: 'Python', to: 'Django', kind: 'Related' },
  { from: 'PostgreSQL', to: 'SQL', kind: 'Related' },
  { from: 'TypeScript', to: 'JavaScript', kind: 'Related' },
  { from: 'Node.js', to: 'JavaScript', kind: 'Related' },
];

function adjacencyMatch(candidate: string, required: string): SkillMatchKind | null {
  if (candidate.toLowerCase() === required.toLowerCase()) return 'Exact';
  const match = SKILL_ADJACENCIES.find((item) =>
    (item.from.toLowerCase() === required.toLowerCase() && item.to.toLowerCase() === candidate.toLowerCase()) ||
    (item.to.toLowerCase() === required.toLowerCase() && item.from.toLowerCase() === candidate.toLowerCase())
  );
  return match?.kind ?? null;
}

export function getSkillMatch(candidate: Student, requirement: ProjectRequirement): { kind: SkillMatchKind; skill: string; credit: number } | null {
  const match = candidate.skills
    .map((skill) => ({ skill, kind: adjacencyMatch(skill.skillName, requirement.skillName) }))
    .find((item) => item.kind !== null);
  if (!match || !match.kind) return null;
  return { kind: match.kind, skill: match.skill.skillName, credit: match.kind === 'Exact' ? 1 : match.kind === 'Related' ? 0.7 : 0.4 };
}

export interface ResilienceSkill {
  skill: string;
  coverageCount: number;
  primaryOwner: string | null;
  backupCount: number;
  dependencyRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  explanation: string;
}
export interface TeamResilienceAnalysis { skills: ResilienceSkill[]; score: number; singlePointsOfFailure: ResilienceSkill[]; explanation: string; }

export function analyzeTeamResilience(members: Student[], requirements: ProjectRequirement[]): TeamResilienceAnalysis {
  const skills: ResilienceSkill[] = requirements.map((requirement) => {
    const capable = members.filter((member) => member.skills.some((skill) => skill.skillName.toLowerCase() === requirement.skillName.toLowerCase() && skill.proficiency >= requirement.requiredProficiency));
    const ordered = [...capable].sort((a, b) => (b.skills.find((skill) => skill.skillName.toLowerCase() === requirement.skillName.toLowerCase())?.proficiency ?? 0) - (a.skills.find((skill) => skill.skillName.toLowerCase() === requirement.skillName.toLowerCase())?.proficiency ?? 0));
    const coverageCount = capable.length;
    const dependencyRisk: ResilienceSkill['dependencyRisk'] = coverageCount === 0 ? 'CRITICAL' : coverageCount === 1 ? 'HIGH' : coverageCount === 2 ? 'MODERATE' : 'LOW';
    return {
      skill: requirement.skillName,
      coverageCount,
      primaryOwner: ordered[0]?.name ?? null,
      backupCount: Math.max(0, coverageCount - 1),
      dependencyRisk,
      explanation: coverageCount === 0 ? `No team member can currently perform ${requirement.skillName} at the required proficiency.` : coverageCount === 1 ? `${ordered[0].name} is the only capable member, creating a single point of failure.` : `${coverageCount} members can perform ${requirement.skillName}; ${ordered[0].name} is the strongest and ${coverageCount - 1} provide backup.`
    };
  });
  const score = requirements.length === 0 ? 100 : Math.round(skills.reduce((sum, skill) => sum + (skill.coverageCount === 0 ? 0 : Math.min(100, 55 + skill.backupCount * 22)), 0) / skills.length);
  const singlePointsOfFailure = skills.filter((skill) => skill.dependencyRisk === 'CRITICAL' || skill.dependencyRisk === 'HIGH');
  return { skills, score, singlePointsOfFailure, explanation: singlePointsOfFailure.length ? `${singlePointsOfFailure.length} required skill${singlePointsOfFailure.length === 1 ? ' is' : 's are'} exposed to a single point of failure.` : 'Every required skill has at least two capable team members.' };
}

export interface ChemistryPreference { communication: 'asynchronous' | 'frequent discussion' | 'mixed'; collaboration: 'independent' | 'collaborative' | 'mixed'; leadership: 'prefer leading' | 'shared leadership' | 'prefer specialist role'; }
export interface PairChemistry { first: string; second: string; score: number; explanation: string; }
export interface TeamChemistryAnalysis { pairs: PairChemistry[]; score: number; frictionAreas: string[]; strongestPairings: PairChemistry[]; }

function pairScore(first: Student, second: Student): PairChemistry {
  const communication = first.communicationPreference && second.communicationPreference ? first.communicationPreference === second.communicationPreference ? 100 : first.communicationPreference === 'mixed' || second.communicationPreference === 'mixed' ? 80 : 55 : 70;
  const collaboration = first.collaborationPreference && second.collaborationPreference ? first.collaborationPreference === second.collaborationPreference ? 100 : first.collaborationPreference === 'mixed' || second.collaborationPreference === 'mixed' ? 80 : 60 : first.workStyle === second.workStyle ? 90 : 70;
  const leadership = first.leadershipPreference && second.leadershipPreference ? first.leadershipPreference === second.leadershipPreference || first.leadershipPreference === 'shared leadership' || second.leadershipPreference === 'shared leadership' ? 90 : 70 : 75;
  const score = Math.round(communication * 0.4 + collaboration * 0.4 + leadership * 0.2);
  const explanation = communication < 70 ? 'Communication preferences may require an explicit working agreement.' : collaboration < 70 ? 'Different collaboration preferences may need coordination.' : 'Explicit preferences align well.';
  return { first: first.name, second: second.name, score, explanation };
}

export function analyzeTeamChemistry(members: Student[]): TeamChemistryAnalysis {
  const pairs: PairChemistry[] = [];
  for (let i = 0; i < members.length; i += 1) for (let j = i + 1; j < members.length; j += 1) pairs.push(pairScore(members[i], members[j]));
  const score = pairs.length ? Math.round(pairs.reduce((sum, pair) => sum + pair.score, 0) / pairs.length) : 100;
  return { pairs, score, strongestPairings: [...pairs].sort((a, b) => b.score - a.score).slice(0, 3), frictionAreas: pairs.filter((pair) => pair.score < 70).map((pair) => `${pair.first} and ${pair.second}: ${pair.explanation}`) };
}

export interface CommitmentAnalysis { score: number; risk: 'LOW' | 'MODERATE' | 'HIGH'; warnings: string[]; explanation: string; }
export function analyzeCommitment(project: Project, student: Student): CommitmentAnalysis {
  const warnings: string[] = [];
  if (!project.expectedHoursPerWeek || !student.availableHoursPerWeek) return { score: 0, risk: 'MODERATE', warnings: ['Commitment hours have not been provided for both sides.'], explanation: 'Add expected project hours and candidate availability to calculate commitment fit.' };
  const hoursRatio = Math.min(1, student.availableHoursPerWeek / project.expectedHoursPerWeek);
  if (student.availableHoursPerWeek < project.expectedHoursPerWeek) warnings.push(`Under-commitment: required ${project.expectedHoursPerWeek} hrs/week, candidate offers ${student.availableHoursPerWeek}.`);
  if (student.availableHoursPerWeek > project.expectedHoursPerWeek * 2) warnings.push('Potential over-commitment: the candidate has substantially more availability than this project requires.');
  const durationFit = project.durationWeeks && student.preferredProjectDurationWeeks ? Math.min(project.durationWeeks, student.preferredProjectDurationWeeks) / Math.max(project.durationWeeks, student.preferredProjectDurationWeeks) : 0.7;
  const score = Math.round((hoursRatio * 0.6 + durationFit * 0.4) * 100);
  const risk = score >= 80 ? 'LOW' : score >= 60 ? 'MODERATE' : 'HIGH';
  return { score, risk, warnings, explanation: warnings.length ? warnings.join(' ') : 'Weekly hours and preferred duration are aligned.' };
}

export interface SkillConfidence { skill: string; selfRating: number; evidenceCount: number; confidence: number; explanation: string; }
export function calculateSkillConfidence(skill: Student['skills'][number]): SkillConfidence {
  const projectEvidence = skill.projectEvidenceCount ?? 0;
  const portfolioEvidence = skill.portfolioEvidenceCount ?? 0;
  const evidenceCount = projectEvidence + portfolioEvidence;
  const evidenceScore = Math.min(100, projectEvidence * 18 + portfolioEvidence * 12 + (skill.evidenceStatus === 'verified' ? 25 : skill.evidenceStatus === 'pending' ? 10 : 0));
  const confidence = Math.round(Math.min(100, skill.proficiency / 5 * 55 + evidenceScore * 0.45));
  return { skill: skill.skillName, selfRating: skill.proficiency, evidenceCount, confidence, explanation: evidenceCount === 0 ? 'Self-rating is recorded, but no project or portfolio evidence has been added.' : `${evidenceCount} evidence item${evidenceCount === 1 ? '' : 's'} support this self-rating; verification status is ${skill.evidenceStatus}.` };
}

export interface OpportunityMatch {
  project: Project;
  score: number;
  why: string[];
  missingRequirements: string[];
  potentialRole: string;
}

export function matchStudentToProjects(student: Student, projects: { project: Project; requirements: ProjectRequirement[] }[]): OpportunityMatch[] {
  return projects.map(({ project, requirements }) => {
    const skillResult = requirements.map((requirement) => ({ requirement, match: getSkillMatch(student, requirement) }));
    const exact = skillResult.filter((item) => item.match?.kind === 'Exact');
    const related = skillResult.filter((item) => item.match?.kind === 'Related' || item.match?.kind === 'Transferable');
    const missingRequirements = skillResult.filter((item) => !item.match).map((item) => item.requirement.skillName);
    const skillFit = requirements.length ? (exact.length + related.reduce((sum, item) => sum + (item.match?.credit ?? 0), 0)) / requirements.length : 0;
    const interest = student.interests.some((interest) => project.category.toLowerCase().includes(interest.toLowerCase()) || project.description.toLowerCase().includes(interest.toLowerCase())) ? 1 : 0.35;
    const availability = student.availability === project.availabilityReq ? 1 : student.availability === 'Full-time' ? 0.9 : 0.6;
    const experience = student.experience.length ? 0.75 : 0.2;
    const role = project.preferredRoles.find((preferredRole) => student.preferredRoles.includes(preferredRole));
    const roleScore = role ? 1 : 0.45;
    const commitment = project.expectedHoursPerWeek && student.availableHoursPerWeek ? Math.min(1, student.availableHoursPerWeek / project.expectedHoursPerWeek) : 0.5;
    const score = Math.round((skillFit * 0.35 + interest * 0.15 + availability * 0.15 + experience * 0.1 + roleScore * 0.1 + commitment * 0.15) * 100);
    const why = [
      exact.length ? `${exact.length} exact skill match${exact.length === 1 ? '' : 'es'}` : '',
      related.length ? `${related.length} related or transferable skill match${related.length === 1 ? '' : 'es'}` : '',
      interest === 1 ? 'interest aligns with the project' : '',
      availability >= 0.9 ? 'sufficient availability' : '',
      role ? `potential role: ${role}` : '',
    ].filter(Boolean);
    return { project, score, why, missingRequirements, potentialRole: role ?? project.preferredRoles[0] ?? 'Contributor' };
  }).sort((a, b) => b.score - a.score);
}

export interface RiskItem { name: string; score: number; level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'; reason: string; recommendation: string; }
export interface TeamRiskRadar { risks: RiskItem[]; strengths: string[]; warnings: string[]; criticalRisks: RiskItem[]; }

function riskLevel(score: number): RiskItem['level'] {
  return score >= 75 ? 'LOW' : score >= 50 ? 'MODERATE' : score >= 25 ? 'HIGH' : 'CRITICAL';
}

export function analyzeTeamRiskRadar(members: Student[], requirements: ProjectRequirement[], project?: Project): TeamRiskRadar {
  const resilience = analyzeTeamResilience(members, requirements);
  const chemistry = analyzeTeamChemistry(members);
  const requiredSkills = requirements.filter((requirement) => requirement.importance === 'Required');
  const skillCoverage = requiredSkills.length ? Math.round(requiredSkills.filter((requirement) => members.some((member) => member.skills.some((skill) => skill.skillName.toLowerCase() === requirement.skillName.toLowerCase() && skill.proficiency >= requirement.requiredProficiency))).length / requiredSkills.length * 100) : 100;
  const evidence = members.length ? Math.round(members.flatMap((member) => member.skills).reduce((sum, skill) => sum + (skill.evidenceStatus === 'verified' ? 100 : skill.evidenceStatus === 'pending' ? 50 : 0), 0) / Math.max(1, members.flatMap((member) => member.skills).length)) : 0;
  const availability = members.length ? Math.round(members.filter((member) => member.availability !== 'Unavailable').length / members.length * 100) : 0;
  const leadership = members.length ? Math.round(members.filter((member) => member.leadershipPreference !== 'prefer specialist role').length / members.length * 100) : 0;
  const commitment = project && members.length ? Math.round(members.filter((member) => analyzeCommitment(project, member).score >= 60).length / members.length * 100) : 0;
  const makeRisk = (name: string, score: number, reason: string, recommendation: string): RiskItem => ({ name, score, level: riskLevel(score), reason, recommendation });
  const risks = [
    makeRisk('Skill risk', skillCoverage, `${100 - skillCoverage}% of required skill coverage is missing.`, 'Add candidates who cover the missing required skills.'),
    makeRisk('Availability risk', availability, `${members.filter((member) => member.availability === 'Unavailable').length} member(s) are unavailable.`, 'Confirm shared working windows before committing.'),
    makeRisk('Commitment risk', commitment, project ? `${members.length - Math.round(commitment / 100 * members.length)} member(s) do not meet the available commitment data.` : 'Project and member hours are not fully provided.', 'Add commitment hours or renegotiate project scope.'),
    makeRisk('Resilience risk', resilience.score, resilience.explanation, 'Find backup members for high-risk skills.'),
    makeRisk('Chemistry risk', chemistry.score, chemistry.frictionAreas[0] ?? 'Explicit team preferences are aligned or not yet provided.', 'Agree on communication and collaboration norms.'),
    makeRisk('Evidence risk', evidence, `${100 - evidence}% of recorded skill evidence confidence is unverified.`, 'Ask members to add legitimate project or portfolio evidence.'),
    makeRisk('Leadership risk', leadership, `${100 - leadership}% of members prefer a specialist role or have not provided a leadership preference.`, 'Clarify ownership and shared leadership before work begins.'),
  ];
  return { risks, strengths: risks.filter((risk) => risk.score >= 75).map((risk) => `${risk.name} is controlled at ${risk.score}/100.`), warnings: risks.filter((risk) => risk.score < 75).map((risk) => `${risk.name}: ${risk.reason}`), criticalRisks: risks.filter((risk) => risk.score < 50) };
}
