import type { Student, Project, ProjectRequirement, Role } from '@/types';
import { scoreStudentForProject, type RecommendationResult } from '@/lib/recommendation';

// ============ Types ============

export interface TeamScore {
  compatibility: number;
  skillCoverage: number;
  availabilityOverlap: number;
  roleCoverage: number;
  experienceBalance: number;
  teamChemistry: number;
  overallReadiness: number;
}

export interface TeamGap {
  skill: string;
  importance: string;
  severity: 'Critical' | 'Moderate' | 'Covered';
  coveragePercent: number;
  peopleNeeded: number;
  peopleHave: number;
  recommendedStudents: { student: Student; matchScore: number; explanation: string }[];
}

export interface TeamRecommendation {
  id: string;
  label: string;
  members: Student[];
  scores: TeamScore;
  strengths: string[];
  gaps: TeamGap[];
  criticalGaps: TeamGap[];
  explanation: string;
}

export interface WhatIfChange {
  action: 'add' | 'remove' | 'replace';
  student?: Student;
  replacedId?: string;
  beforeReadiness: number;
  afterReadiness: number;
  difference: number;
  explanation: string;
}

// ============ Helpers ============

function clampScore(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

function getTeamSkillNames(members: Student[]): Set<string> {
  const skills = new Set<string>();
  for (const m of members) {
    m.skills.forEach((s) => skills.add(s.skillName));
  }
  return skills;
}

// ============ Scoring ============

export function scoreTeam(members: Student[], project: Project, requirements: ProjectRequirement[]): TeamScore {
  // Skill Coverage: how many requirements are met with sufficient proficiency
  const skillCoverage = scoreTeamSkillCoverage(members, requirements);

  // Availability Overlap: do team members share overlapping availability?
  const availabilityOverlap = scoreTeamAvailability(members);

  // Role Coverage: are preferred roles represented?
  const roleCoverage = scoreRoleCoverage(members, project);

  // Experience Balance: diversity of experience levels
  const experienceBalance = scoreExperienceBalance(members);

  // Team Chemistry: work style compatibility
  const teamChemistry = scoreTeamChemistry(members);

  // Compatibility: weighted combination
  const compatibility = clampScore(
    skillCoverage * 0.35 +
    availabilityOverlap * 0.20 +
    roleCoverage * 0.15 +
    experienceBalance * 0.15 +
    teamChemistry * 0.15
  );

  // Overall Readiness: how ready is this team to start?
  const overallReadiness = clampScore(
    skillCoverage * 0.40 +
    roleCoverage * 0.20 +
    availabilityOverlap * 0.15 +
    experienceBalance * 0.10 +
    teamChemistry * 0.10 +
    (members.length >= project.teamSize ? 5 : -10) * 1
  );

  return {
    compatibility,
    skillCoverage,
    availabilityOverlap,
    roleCoverage,
    experienceBalance,
    teamChemistry,
    overallReadiness,
  };
}

function scoreTeamSkillCoverage(members: Student[], requirements: ProjectRequirement[]): number {
  if (requirements.length === 0) return 50;
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const req of requirements) {
    const importanceWeight = req.importance === 'Required' ? 3 : req.importance === 'Preferred' ? 2 : 1;
    totalWeight += importanceWeight * req.peopleNeeded;

    let peopleWithSkill = 0;
    for (const member of members) {
      const skill = member.skills.find((s) => s.skillName === req.skillName);
      if (skill && skill.proficiency >= req.requiredProficiency) {
        peopleWithSkill++;
      }
    }
    earnedWeight += importanceWeight * Math.min(peopleWithSkill, req.peopleNeeded);
  }

  return clampScore((earnedWeight / totalWeight) * 100);
}

function scoreTeamAvailability(members: Student[]): number {
  if (members.length <= 1) return 100;

  const availabilityMap: Record<string, number> = {
    'Full-time': 100, 'Part-time': 75, 'Weekends': 50, 'Evenings': 50, 'Limited': 25, 'Unavailable': 0,
  };

  // Score: higher when more members have high availability
  const scores = members.map((m) => availabilityMap[m.availability] ?? 50);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Penalize if members have very different schedules
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const consistencyPenalty = Math.sqrt(variance) * 0.3;

  return clampScore(avg - consistencyPenalty);
}

function scoreRoleCoverage(members: Student[], project: Project): number {
  if (project.preferredRoles.length === 0) return 75;
  const memberRoles = new Set<string>();
  members.forEach((m) => m.preferredRoles.forEach((r) => memberRoles.add(r)));

  const covered = project.preferredRoles.filter((r) => memberRoles.has(r)).length;
  return clampScore((covered / project.preferredRoles.length) * 100);
}

function scoreExperienceBalance(members: Student[]): number {
  if (members.length === 0) return 0;

  // Count total experiences
  const totalExp = members.reduce((sum, m) => sum + m.experience.length, 0);
  const avgExp = totalExp / members.length;

  // Ideal: each member has 1-3 experiences, with some diversity
  let score = Math.min(50, avgExp * 20);

  // Bonus for having members with different experience counts (diversity)
  const expCounts = members.map((m) => m.experience.length);
  const hasVariety = new Set(expCounts).size > 1;
  if (hasVariety) score += 25;

  // Bonus for having at least one experienced member
  if (Math.max(...expCounts) >= 2) score += 25;

  return clampScore(score);
}

function scoreTeamChemistry(members: Student[]): number {
  if (members.length <= 1) return 80;

  // Work style compatibility
  const styles = members.map((m) => m.workStyle);
  const uniqueStyles = new Set(styles).size;

  // Same work style = high chemistry
  if (uniqueStyles === 1) return 90;

  // Hybrid members bridge gaps
  const hasHybrid = styles.includes('Hybrid');
  if (hasHybrid && uniqueStyles <= 3) return 85;

  // Collaborative + Independent is OK
  if (uniqueStyles === 2) return 75;

  // Too many different styles = friction
  return clampScore(80 - (uniqueStyles - 2) * 15);
}

// ============ Gap Analysis ============

export function analyzeTeamGaps(members: Student[], requirements: ProjectRequirement[], allStudents: Student[]): TeamGap[] {
  const gaps: TeamGap[] = [];

  for (const req of requirements) {
    const membersWithSkill = members.filter((m) =>
      m.skills.some((s) => s.skillName === req.skillName && s.proficiency >= req.requiredProficiency)
    );
    const peopleHave = membersWithSkill.length;
    const coveragePercent = Math.min(100, (peopleHave / req.peopleNeeded) * 100);

    let severity: TeamGap['severity'];
    if (peopleHave >= req.peopleNeeded) severity = 'Covered';
    else if (req.importance === 'Required' && peopleHave === 0) severity = 'Critical';
    else if (peopleHave < req.peopleNeeded) severity = req.importance === 'Required' ? 'Critical' : 'Moderate';
    else severity = 'Covered';

    // Find recommended students for this gap
    const candidates = allStudents
      .filter((s) => !members.some((m) => m.id === s.id))
      .filter((s) => s.skills.some((sk) => sk.skillName === req.skillName))
      .map((s) => {
        const result: RecommendationResult = scoreStudentForProject(
          s,
          { id: '', title: '', tagline: '', description: '', category: 'Academic' as never, status: 'Recruiting' as never, requiredSkills: [req.skillName], preferredRoles: [], teamSize: 0, currentMembers: 0, timeline: '', availabilityReq: 'Part-time' as never, ownerId: '', ownerName: '', createdAt: '', matchScore: 0 },
          [req],
        );
        return { student: s, matchScore: result.overallScore, explanation: result.explanation };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    gaps.push({
      skill: req.skillName,
      importance: req.importance,
      severity,
      coveragePercent,
      peopleNeeded: req.peopleNeeded,
      peopleHave,
      recommendedStudents: candidates,
    });
  }

  return gaps.sort((a, b) => {
    const severityOrder = { Critical: 0, Moderate: 1, Covered: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ============ Team Formation ============

export function generateTeamRecommendations(
  allStudents: Student[],
  project: Project,
  requirements: ProjectRequirement[],
  teamSize: number,
): TeamRecommendation[] {
  // Score all students
  const scored = allStudents
    .filter((s) => s.id !== project.ownerId)
    .map((s) => ({ student: s, result: scoreStudentForProject(s, project, requirements) }))
    .sort((a, b) => b.result.overallScore - a.result.overallScore);

  // Generate 3 different team compositions
  const teams: TeamRecommendation[] = [];

  // Team A: Best overall scores (greedy)
  teams.push(generateTeamA(scored, project, requirements, teamSize));

  // Team B: Skill coverage focused
  teams.push(generateTeamB(scored, project, requirements, teamSize));

  // Team C: Balanced approach
  teams.push(generateTeamC(scored, project, requirements, teamSize));

  return teams;
}

function generateTeamA(
  scored: { student: Student; result: RecommendationResult }[],
  project: Project,
  requirements: ProjectRequirement[],
  teamSize: number,
): TeamRecommendation {
  // Greedy: pick top scorers, ensuring no duplicate skill sets dominate
  const members: Student[] = [];
  const used = new Set<string>();

  for (const { student } of scored) {
    if (members.length >= teamSize) break;
    if (used.has(student.id)) continue;
    members.push(student);
    used.add(student.id);
  }

  return buildTeamRecommendation('A', 'Best Overall Match', members, project, requirements, scored.map((s) => s.student));
}

function generateTeamB(
  scored: { student: Student; result: RecommendationResult }[],
  project: Project,
  requirements: ProjectRequirement[],
  teamSize: number,
): TeamRecommendation {
  // Coverage-focused: prioritize covering all required skills first
  const members: Student[] = [];
  const used = new Set<string>();
  const coveredSkills = new Set<string>();

  // First pass: cover all required skills
  for (const req of requirements) {
    if (coveredSkills.has(req.skillName)) continue;
    const candidate = scored.find(
      ({ student }) => !used.has(student.id) && student.skills.some((s) => s.skillName === req.skillName && s.proficiency >= req.requiredProficiency),
    );
    if (candidate && members.length < teamSize) {
      members.push(candidate.student);
      used.add(candidate.student.id);
      coveredSkills.add(req.skillName);
    }
  }

  // Second pass: fill remaining slots with best scorers
  for (const { student } of scored) {
    if (members.length >= teamSize) break;
    if (used.has(student.id)) continue;
    members.push(student);
    used.add(student.id);
  }

  return buildTeamRecommendation('B', 'Skill Coverage Optimized', members, project, requirements, scored.map((s) => s.student));
}

function generateTeamC(
  scored: { student: Student; result: RecommendationResult }[],
  project: Project,
  requirements: ProjectRequirement[],
  teamSize: number,
): TeamRecommendation {
  // Balanced: alternate between skill coverage and overall score
  const members: Student[] = [];
  const used = new Set<string>();
  const coveredSkills = new Set<string>();

  const uncovered = () => requirements.filter((r) => !coveredSkills.has(r.skillName));

  while (members.length < teamSize && scored.length > 0) {
    const needSkillCoverage = uncovered().length > 0 && members.length < teamSize - 1;

    if (needSkillCoverage) {
      // Find the best student who covers an uncovered skill
      const nextReq = uncovered()[0];
      const candidate = scored.find(
        ({ student }) => !used.has(student.id) && student.skills.some((s) => s.skillName === nextReq.skillName),
      );
      if (candidate) {
        members.push(candidate.student);
        used.add(candidate.student.id);
        coveredSkills.add(nextReq.skillName);
        continue;
      }
    }

    // Otherwise pick the best remaining scorer
    const next = scored.find(({ student }) => !used.has(student.id));
    if (next) {
      members.push(next.student);
      used.add(next.student.id);
      next.student.skills.forEach((s) => coveredSkills.add(s.skillName));
    } else {
      break;
    }
  }

  return buildTeamRecommendation('C', 'Balanced Approach', members, project, requirements, scored.map((s) => s.student));
}

function buildTeamRecommendation(
  id: string,
  label: string,
  members: Student[],
  project: Project,
  requirements: ProjectRequirement[],
  allStudents: Student[],
): TeamRecommendation {
  const scores = scoreTeam(members, project, requirements);
  const gaps = analyzeTeamGaps(members, requirements, allStudents);
  const criticalGaps = gaps.filter((g) => g.severity === 'Critical');

  const strengths: string[] = [];
  const teamSkills = getTeamSkillNames(members);

  // Identify strengths
  const coveredReqs = requirements.filter((r) => teamSkills.has(r.skillName));
  if (coveredReqs.length === requirements.length && requirements.length > 0) {
    strengths.push('Full skill coverage');
  } else if (coveredReqs.length >= requirements.length * 0.7) {
    strengths.push(`Strong skill coverage (${coveredReqs.length}/${requirements.length} requirements met)`);
  }

  if (scores.availabilityOverlap >= 80) strengths.push('Excellent availability overlap');
  if (scores.roleCoverage >= 75) strengths.push('Good role coverage');
  if (scores.experienceBalance >= 70) strengths.push('Well-balanced experience levels');
  if (scores.teamChemistry >= 80) strengths.push('Strong team chemistry');

  // Group skills by category for strengths
  const skillCategories = new Map<string, number>();
  for (const member of members) {
    for (const skill of member.skills) {
      const cat = skill.skillName;
      skillCategories.set(cat, (skillCategories.get(cat) ?? 0) + 1);
    }
  }
  const topSkillAreas = [...skillCategories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [area] of topSkillAreas) {
    strengths.push(`Strong ${area} capability`);
  }

  const explanation = `${scores.overallReadiness}% overall readiness with ${coveredReqs.length}/${requirements.length} skills covered, ${scores.roleCoverage}% role coverage, and ${scores.teamChemistry}% team chemistry.`;

  return {
    id,
    label,
    members,
    scores,
    strengths,
    gaps,
    criticalGaps,
    explanation,
  };
}

// ============ What-If Simulator ============

export function simulateChange(
  currentMembers: Student[],
  action: 'add' | 'remove' | 'replace',
  student: Student | undefined,
  replacedId: string | undefined,
  project: Project,
  requirements: ProjectRequirement[],
  allStudents: Student[],
): WhatIfChange {
  const beforeScores = scoreTeam(currentMembers, project, requirements);
  let newMembers = [...currentMembers];

  if (action === 'add' && student) {
    if (!currentMembers.some((m) => m.id === student.id)) {
      newMembers.push(student);
    }
  } else if (action === 'remove' && student) {
    newMembers = currentMembers.filter((m) => m.id !== student.id);
  } else if (action === 'replace' && student && replacedId) {
    newMembers = currentMembers.filter((m) => m.id !== replacedId);
    newMembers.push(student);
  }

  const afterScores = scoreTeam(newMembers, project, requirements);
  const difference = afterScores.overallReadiness - beforeScores.overallReadiness;

  // Generate explanation
  let explanation = '';
  if (action === 'add' && student) {
    const newSkills = student.skills.map((s) => s.skillName);
    explanation = `Readiness ${difference >= 0 ? 'increased' : 'decreased'} ${Math.abs(difference)} points because ${newSkills.length > 0 ? `${newSkills.join(', ')} coverage improved` : 'team composition changed'}.`;
  } else if (action === 'remove' && student) {
    explanation = `Readiness ${difference >= 0 ? 'increased' : 'decreased'} ${Math.abs(difference)} points after removing ${student.name}.`;
  } else if (action === 'replace' && student) {
    explanation = `Readiness ${difference >= 0 ? 'increased' : 'decreased'} ${Math.abs(difference)} points after replacement.`;
  }

  return {
    action,
    student,
    replacedId,
    beforeReadiness: beforeScores.overallReadiness,
    afterReadiness: afterScores.overallReadiness,
    difference,
    explanation,
  };
}
