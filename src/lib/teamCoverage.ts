import type { ProjectRequirement, Student } from '@/types';

export type CoverageHealth = 'Healthy' | 'High redundancy' | 'Critical gap' | 'Fragile coverage';

export interface SkillCoverageAnalysis {
  skill: string;
  importance: ProjectRequirement['importance'];
  requiredProficiency: number;
  peopleNeeded: number;
  membersWithSkill: number;
  coveragePercent: number;
  redundancyPercent: number;
  health: CoverageHealth;
  explanation: string;
}

export interface MemberUniqueContribution {
  studentId: string;
  studentName: string;
  uniqueContributionScore: number;
  uniqueSkills: string[];
  fragileSkills: string[];
  explanation: string;
}

export interface TeamCoverageAnalysis {
  coverage: SkillCoverageAnalysis[];
  contributions: MemberUniqueContribution[];
  criticalGaps: SkillCoverageAnalysis[];
  moderateGaps: SkillCoverageAnalysis[];
  overallCoveragePercent: number;
  overallRedundancyPercent: number;
  explanation: string;
}

function proficiencyCoverage(proficiency: number, requiredProficiency: number): number {
  return Math.min(1, proficiency / Math.max(1, requiredProficiency));
}

function getSkillCoverage(members: Student[], requirement: ProjectRequirement): { total: number; people: number } {
  return members.reduce((result, member) => {
    const skill = member.skills.find((item) => item.skillName.toLowerCase() === requirement.skillName.toLowerCase());
    if (!skill) return result;
    return {
      total: result.total + proficiencyCoverage(skill.proficiency, requirement.requiredProficiency),
      people: result.people + (skill.proficiency >= requirement.requiredProficiency ? 1 : 0),
    };
  }, { total: 0, people: 0 });
}

function classifyCoverage(coveragePercent: number, redundancyPercent: number, membersWithSkill: number, requirement: ProjectRequirement): CoverageHealth {
  if (coveragePercent < 100) return requirement.importance === 'Required' ? 'Critical gap' : 'Fragile coverage';
  if (membersWithSkill < requirement.peopleNeeded) return 'Fragile coverage';
  if (redundancyPercent >= 50) return 'High redundancy';
  return 'Healthy';
}

export function analyzeTeamCoverage(members: Student[], requirements: ProjectRequirement[]): TeamCoverageAnalysis {
  const coverage = requirements.map((requirement) => {
    const result = getSkillCoverage(members, requirement);
    const coveragePercent = Math.round(result.total / Math.max(1, requirement.peopleNeeded) * 100);
    const redundancyPercent = Math.max(0, coveragePercent - 100);
    const health = classifyCoverage(coveragePercent, redundancyPercent, result.people, requirement);
    const explanation = health === 'Critical gap'
      ? `${requirement.skillName} has ${coveragePercent}% coverage and needs ${requirement.peopleNeeded} qualified ${requirement.skillName} contributor${requirement.peopleNeeded === 1 ? '' : 's'}.`
      : health === 'Fragile coverage'
        ? `${requirement.skillName} is covered, but only ${result.people} qualified member${result.people === 1 ? '' : 's'} provide it.`
        : health === 'High redundancy'
          ? `${requirement.skillName} has ${redundancyPercent}% capability beyond the requirement, so several members overlap here.`
          : `${requirement.skillName} is covered at the required proficiency with a balanced contribution.`;

    return {
      skill: requirement.skillName,
      importance: requirement.importance,
      requiredProficiency: requirement.requiredProficiency,
      peopleNeeded: requirement.peopleNeeded,
      membersWithSkill: result.people,
      coveragePercent,
      redundancyPercent,
      health,
      explanation,
    };
  });

  const contributions = members.map((member) => {
    const uniqueSkills: string[] = [];
    const fragileSkills: string[] = [];
    let contribution = 0;

    requirements.forEach((requirement) => {
      const memberSkill = member.skills.find((skill) => skill.skillName.toLowerCase() === requirement.skillName.toLowerCase());
      if (!memberSkill) return;
      const before = getSkillCoverage(members, requirement).total;
      const after = getSkillCoverage(members.filter((candidate) => candidate.id !== member.id), requirement).total;
      const lostCoverage = Math.max(0, Math.min(1, before / Math.max(1, requirement.peopleNeeded)) - Math.min(1, after / Math.max(1, requirement.peopleNeeded)));
      contribution += lostCoverage * (requirement.importance === 'Required' ? 1.5 : requirement.importance === 'Preferred' ? 1 : 0.5);
      if (lostCoverage > 0) uniqueSkills.push(requirement.skillName);
      if (members.filter((candidate) => candidate.id !== member.id).every((candidate) => !candidate.skills.some((skill) => skill.skillName.toLowerCase() === requirement.skillName.toLowerCase() && skill.proficiency >= requirement.requiredProficiency))) {
        fragileSkills.push(requirement.skillName);
      }
    });

    const maxContribution = Math.max(1, requirements.reduce((sum, requirement) => sum + (requirement.importance === 'Required' ? 1.5 : requirement.importance === 'Preferred' ? 1 : 0.5), 0));
    const uniqueContributionScore = Math.round(Math.min(100, contribution / maxContribution * 100));
    return {
      studentId: member.id,
      studentName: member.name,
      uniqueContributionScore,
      uniqueSkills,
      fragileSkills,
      explanation: uniqueSkills.length > 0
        ? `${member.name} uniquely contributes ${uniqueSkills.join(', ')}${fragileSkills.length > 0 ? ` and is the only qualified member for ${fragileSkills.join(', ')}` : ''}.`
        : `${member.name}'s required skills are also covered by other team members.`
    };
  });

  const overallCoveragePercent = requirements.length === 0 ? 100 : Math.round(coverage.reduce((sum, item) => sum + Math.min(100, item.coveragePercent), 0) / requirements.length);
  const overallRedundancyPercent = requirements.length === 0 ? 0 : Math.round(coverage.reduce((sum, item) => sum + item.redundancyPercent, 0) / requirements.length);
  const criticalGaps = coverage.filter((item) => item.health === 'Critical gap');
  const moderateGaps = coverage.filter((item) => item.health === 'Fragile coverage');

  return {
    coverage,
    contributions,
    criticalGaps,
    moderateGaps,
    overallCoveragePercent,
    overallRedundancyPercent,
    explanation: criticalGaps.length > 0
      ? `${criticalGaps.length} critical project skill${criticalGaps.length === 1 ? ' is' : 's are'} uncovered. ${overallRedundancyPercent > 0 ? `The team also carries ${overallRedundancyPercent}% average excess coverage.` : ''}`.trim()
      : overallRedundancyPercent > 0
        ? `All requirements are covered, with ${overallRedundancyPercent}% average excess capability concentrated in overlapping skills.`
        : 'The team covers the defined requirements without excessive skill overlap.',
  };
}
