import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { useNav } from '@/nav';
import { useAuth } from '@/lib/auth';
import { fetchAllProjects, fetchAllStudents, fetchProjectById, fetchTeamsForUser, joinProject } from '@/lib/db';
import { PageContainer, SectionHeader, StatCard } from '@/components/Layout';
import { ProjectCard } from '@/components/ProjectCard';
import { StudentCard } from '@/components/StudentCard';
import { cn } from '@/utils/cn';
import type { Project, Student, Team } from '@/types';
import type { ProjectRequirement } from '@/types';
import { OpportunityMatches } from '@/components/OpportunityRiskPanels';

export function DashboardPage() {
  const { navigate } = useNav();
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [opportunityProjects, setOpportunityProjects] = useState<{ project: Project; requirements: ProjectRequirement[] }[]>([]);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchAllProjects(), fetchAllStudents(), fetchTeamsForUser(user.id)])
      .then(async ([projectData, studentData, teamData]) => {
        const details = await Promise.all(projectData.map((project) => fetchProjectById(project.id)));
        setProjects(projectData);
        setStudents(studentData);
        setTeams(teamData);
        setOpportunityProjects(details.filter((detail): detail is NonNullable<typeof detail> => detail !== null).map((detail) => ({ project: detail.project, requirements: detail.requirements })));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageContainer><div className="card p-12 text-center"><p className="text-sm text-ink-500">Loading your workspace...</p></div></PageContainer>;
  if (error) return <PageContainer><div className="card p-8 text-sm text-rose-600">{error}</div></PageContainer>;

  const myTeams = teams;
  const skillGaps = teams.flatMap((team) => team.missingSkills.map((skill) => ({ id: `${team.id}-${skill}`, teamName: team.name, skill, severity: 'High' as const, suggestedStudents: 0 })));
  const recommendedProjects = [...projects].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  const recommendedStudents = [...students].filter((s) => s.id !== user?.id).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
  const currentStudent = students.find((student) => student.id === user?.id);
  const handleOpportunityRequest = async (projectId: string) => {
    if (!user) return;
    try {
      await joinProject(projectId, user.id);
      setRequestMessage('Participation request sent. The project owner can review it from Project Details.');
    } catch (err) {
      setRequestMessage(err instanceof Error ? err.message : 'Unable to send participation request.');
    }
  };

  return (
    <PageContainer>
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-ink-800 p-6 sm:p-8 lg:p-10 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-brand-300 text-sm mb-3">
            <Sparkles className="w-4 h-4" />
            Welcome back, {(profile?.full_name ?? user?.email ?? 'there').split(' ')[0]}
          </div>
          <h1 className="font-display font-800 text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight text-balance">
            Find the right people.
            <br />Build the right team.
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button onClick={() => navigate({ name: 'discover' })} className="btn bg-white text-ink-900 hover:bg-ink-100 px-5 py-2.5">
              Discover students <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate({ name: 'create-project' })} className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 px-5 py-2.5">
              Create a project
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Teams" value={myTeams.length} hint="You're a member of" color="text-brand-600" />
        <StatCard label="Open Projects" value={projects.filter(p => p.status === 'Recruiting').length} hint="Currently recruiting" color="text-blue-600" />
        <StatCard label="Skill Gaps" value={skillGaps.length} hint="Across your teams" color="text-accent-600" />
        <StatCard label="Students" value={students.length} hint="In the talent directory" color="text-ink-900" />
      </div>

      {/* My Active Teams */}
      <section className="mb-10">
        <SectionHeader
          title="My Active Teams"
          subtitle="Teams you're currently part of"
          action={<button onClick={() => navigate({ name: 'teams' })} className="btn-ghost text-sm">View all <ArrowRight className="w-3.5 h-3.5" /></button>}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => navigate({ name: 'team', id: team.id })}
              className="card card-hover p-5 text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-700 text-ink-900 group-hover:text-brand-700 transition-colors">{team.name}</h3>
                <span className={cn('chip text-[11px]', team.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-brand-50 text-brand-700')}>
                  {team.status}
                </span>
              </div>
              <p className="text-sm text-ink-500 mb-3">{team.projectTitle}</p>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 4).map((m) => (
                    <div key={m.studentId} className={`w-7 h-7 rounded-full ${m.avatarColor} border-2 border-white flex items-center justify-center text-[10px] font-700 text-white`}>
                      {m.initials}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-ink-400">{team.members.length} members</span>
              </div>
              {team.missingSkills.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-ink-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-500" />
                  <span className="text-xs text-ink-500">{team.missingSkills.length} skill gap{team.missingSkills.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Recommended Projects */}
      <section className="mb-10">
        <SectionHeader
          title="Recommended Projects"
          subtitle="Matched to your skills and interests"
          action={<button onClick={() => navigate({ name: 'projects' })} className="btn-ghost text-sm">Browse all <ArrowRight className="w-3.5 h-3.5" /></button>}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>

      {currentStudent && <div className="mb-10"><OpportunityMatches student={currentStudent} projects={opportunityProjects} onRequest={handleOpportunityRequest} />{requestMessage && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">{requestMessage}</p>}</div>}

      {/* Two column: Recommended Students + Skill Gaps */}
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <section className="lg:col-span-2">
          <SectionHeader
            title="Recommended Students"
            subtitle="Top teammate matches for you"
            action={<button onClick={() => navigate({ name: 'discover' })} className="btn-ghost text-sm">Discover <ArrowRight className="w-3.5 h-3.5" /></button>}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {recommendedStudents.slice(0, 4).map((s) => <StudentCard key={s.id} student={s} />)}
          </div>
        </section>

        <section>
          <SectionHeader title="Skill Gaps" subtitle="Across your teams" />
          <div className="card p-5 space-y-3">
            {skillGaps.map((gap) => (
              <div key={gap.id} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
                <div>
                  <p className="text-sm font-600 text-ink-900">{gap.skill}</p>
                  <p className="text-xs text-ink-400">{gap.teamName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('chip text-[11px]',
                    gap.severity === 'High' ? 'bg-rose-50 text-rose-700' :
                    gap.severity === 'Medium' ? 'bg-accent-50 text-accent-700' :
                    'bg-ink-100 text-ink-600'
                  )}>
                    {gap.severity}
                  </span>
                  <span className="text-xs text-ink-400">{gap.suggestedStudents} matches</span>
                </div>
              </div>
            ))}
            <button onClick={() => navigate({ name: 'teams' })} className="btn-ghost text-sm w-full justify-center mt-2">
              Review all gaps <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>

      {/* Upcoming Opportunities */}
      <section>
        <SectionHeader title="Upcoming Opportunities" subtitle="Hackathons, grants, and competitions" />
        <div className="card p-6 text-sm text-ink-500">
          Opportunity listings are not connected to the database yet. Your projects and team gaps above are live.
        </div>
        {/* <div className="grid sm:grid-cols-2 gap-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="card card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn('chip text-[11px]',
                    opp.type === 'Hackathon' ? 'bg-brand-50 text-brand-700' :
                    opp.type === 'Grant' ? 'bg-accent-50 text-accent-700' :
                    opp.type === 'Internship' ? 'bg-blue-50 text-blue-700' :
                    'bg-purple-50 text-purple-700'
                  )}>
                    {opp.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {opp.deadline}
                </div>
              </div>
              <h3 className="font-700 text-ink-900">{opp.title}</h3>
              <p className="text-xs text-ink-400 mt-0.5">{opp.organizer}</p>
              <p className="text-sm text-ink-500 mt-2 leading-relaxed line-clamp-2">{opp.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {opp.tags.map((tag) => (
                  <span key={tag} className="chip bg-ink-50 text-ink-600 text-[11px]">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div> */}
      </section>
    </PageContainer>
  );
}
