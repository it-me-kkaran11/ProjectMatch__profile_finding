import { Sparkles, Heart, Clock, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchAllStudents, fetchProjectById, fetchTeamsForUser } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useNav } from '@/nav';
import { PageContainer, PageHeader, SectionHeader } from '@/components/Layout';
import { TeamMemberCard } from '@/components/TeamMemberCard';
import { SkillCoverage } from '@/components/SkillCoverage';
import { StudentCard } from '@/components/StudentCard';
import { cn } from '@/utils/cn';
import type { Student, Team } from '@/types';
import type { ProjectRequirement } from '@/types';
import { TeamCoverageAnalyzer } from '@/components/TeamCoverageAnalyzer';

const statusStyles: Record<string, string> = {
  Recruiting: 'bg-brand-50 text-brand-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Planning: 'bg-accent-50 text-accent-700',
  Completed: 'bg-ink-100 text-ink-600',
};

export function TeamDetailsPage({ id }: { id: string }) {
  const { navigate } = useNav();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchTeamsForUser(user.id), fetchAllStudents()])
      .then(async ([teamData, studentData]) => {
        const teamDataItem = teamData.find((item) => item.id === id);
        const projectData = teamDataItem ? await fetchProjectById(teamDataItem.projectId) : null;
        setTeam(teamDataItem ?? null);
        setStudents(studentData);
        setRequirements(projectData?.requirements ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load team'))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) return <PageContainer><div className="card p-12 text-center"><p className="text-sm text-ink-500">Loading team analysis...</p></div></PageContainer>;
  if (error) return <PageContainer><div className="card p-8 flex items-start gap-3 text-sm text-rose-600"><AlertCircle className="w-4 h-4" />{error}</div></PageContainer>;

  if (!team) {
    return (
      <PageContainer>
        <p className="text-ink-500">Team not found.</p>
      </PageContainer>
    );
  }

  // Recommend students who have the missing skills
  const recommendedStudents = [...students]
    .filter((s) => !team.members.some((m) => m.studentId === s.id))
    .sort((a, b) => {
      const aMatch = team.missingSkills.filter((sk) => a.skills.some((us) => us.skillName === sk)).length;
      const bMatch = team.missingSkills.filter((sk) => b.skills.some((us) => us.skillName === sk)).length;
      return bMatch - aMatch;
    })
    .slice(0, 4);

  return (
    <PageContainer>
      <PageHeader title="" />

      {/* Team header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('chip text-[11px]', statusStyles[team.status])}>{team.status}</span>
            </div>
            <h1 className="font-display font-700 text-2xl text-ink-900 tracking-tight">{team.name}</h1>
            <button onClick={() => navigate({ name: 'project', id: team.projectId })} className="text-sm text-brand-600 font-500 hover:text-brand-700 mt-1 flex items-center gap-1">
              {team.projectTitle} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-display font-700 text-2xl text-ink-900">{team.members.length}</p>
              <p className="text-xs text-ink-400">Members</p>
            </div>
            <div className="w-px h-10 bg-ink-100" />
            <div className="text-center">
              <p className="font-display font-700 text-2xl text-ink-900">{team.skillCoverage.filter((s) => s.covered).length}/{team.skillCoverage.length}</p>
              <p className="text-xs text-ink-400">Skills covered</p>
            </div>
            <div className="w-px h-10 bg-ink-100" />
            <div className="text-center">
              <p className={cn('font-display font-700 text-2xl', team.compatibility >= 85 ? 'text-brand-600' : 'text-accent-600')}>{team.compatibility}%</p>
              <p className="text-xs text-ink-400">Compatibility</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Team Members */}
          <div>
            <SectionHeader
              title="Team Members"
              subtitle={`${team.members.length} member${team.members.length !== 1 ? 's' : ''} on the team`}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              {team.members.map((m) => <TeamMemberCard key={m.studentId} member={m} />)}
            </div>
          </div>

          {/* Recommended Teammates */}
          {team.missingSkills.length > 0 && (
            <div>
              <SectionHeader
                title="Recommended Teammates"
                subtitle="Students who can fill your skill gaps"
                action={
                  <div className="flex items-center gap-1.5 text-xs text-brand-600 font-600">
                    <Sparkles className="w-3.5 h-3.5" /> Deterministic matches
                  </div>
                }
              />
              <div className="grid sm:grid-cols-2 gap-4">
                {recommendedStudents.map((s) => <StudentCard key={s.id} student={s} />)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SkillCoverage skills={team.skillCoverage} missingSkills={team.missingSkills} />

          {/* Compatibility placeholder */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-ink-400" />
              <h3 className="font-600 text-sm text-ink-900">Team Compatibility</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-700', team.compatibility >= 85 ? 'bg-brand-500' : 'bg-accent-500')} style={{ width: `${team.compatibility}%` }} />
              </div>
              <span className={cn('font-700 text-sm', team.compatibility >= 85 ? 'text-brand-600' : 'text-accent-600')}>{team.compatibility}%</span>
            </div>
            <p className="text-xs text-ink-500 leading-relaxed">
              Based on work style alignment, availability overlap, and skill complementarity.
              This score combines availability, role coverage, skill complementarity, and work style.
            </p>
          </div>

          {/* Availability overview */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-ink-400" />
              <h3 className="font-600 text-sm text-ink-900">Availability Overview</h3>
            </div>
            <div className="space-y-2">
              {team.members.map((m) => (
                <div key={m.studentId} className="flex items-center justify-between">
                  <span className="text-sm text-ink-700">{m.name}</span>
                  <span className="chip bg-ink-50 text-ink-600 text-[11px]">{m.availability}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <button onClick={() => navigate({ name: 'discover' })} className="btn-primary w-full">
              <UserPlus className="w-4 h-4" /> Find teammates
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <TeamCoverageAnalyzer members={students.filter((student) => team.members.some((member) => member.studentId === student.id))} requirements={requirements} />
      </div>
    </PageContainer>
  );
}
