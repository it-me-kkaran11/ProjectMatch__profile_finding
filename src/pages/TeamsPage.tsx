import { Plus, AlertTriangle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchTeamsForUser } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import type { Team } from '@/types';
import { useNav } from '@/nav';
import { PageContainer, PageHeader, EmptyState } from '@/components/Layout';
import { cn } from '@/utils/cn';

const statusStyles: Record<string, string> = {
  Recruiting: 'bg-brand-50 text-brand-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Planning: 'bg-accent-50 text-accent-700',
  Completed: 'bg-ink-100 text-ink-600',
};

export function TeamsPage() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTeamsForUser(user.id)
      .then(setTeams)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load teams'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <PageContainer><PageHeader title="My Teams" subtitle="Teams you're building with" back={false} /><div className="card p-12 text-center"><p className="text-sm text-ink-500">Loading teams...</p></div></PageContainer>;
  }

  if (error) {
    return <PageContainer><PageHeader title="My Teams" subtitle="Teams you're building with" back={false} /><div className="card p-8 text-sm text-rose-600">{error}</div></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Teams"
        subtitle="Teams you're building with"
        back={false}
        action={<button onClick={() => navigate({ name: 'create-project' })} className="btn-primary"><Plus className="w-4 h-4" /> New Team</button>}
      />

      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create a project to start forming your first team."
          action={<button onClick={() => navigate({ name: 'create-project' })} className="btn-primary"><Plus className="w-4 h-4" /> Create a project</button>}
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {teams.map((team) => {
            const coveredCount = team.skillCoverage.filter((s) => s.covered).length;
            const coveragePercent = Math.round((coveredCount / team.skillCoverage.length) * 100);

            return (
              <button
                key={team.id}
                onClick={() => navigate({ name: 'team', id: team.id })}
                className="card card-hover p-6 text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-700 text-lg text-ink-900 group-hover:text-brand-700 transition-colors">{team.name}</h3>
                    <p className="text-sm text-ink-500 mt-0.5">{team.projectTitle}</p>
                  </div>
                  <span className={cn('chip text-[11px]', statusStyles[team.status])}>{team.status}</span>
                </div>

                {/* Members */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 5).map((m) => (
                      <div key={m.studentId} className={`w-9 h-9 rounded-full ${m.avatarColor} border-2 border-white flex items-center justify-center text-xs font-700 text-white`}>
                        {m.initials}
                      </div>
                    ))}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-ink-500">
                    <Users className="w-3.5 h-3.5" /> {team.members.length} members
                  </span>
                </div>

                {/* Skill coverage bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-600 text-ink-500">Skill coverage</span>
                    <span className={cn('text-xs font-700', coveragePercent >= 80 ? 'text-brand-600' : coveragePercent >= 50 ? 'text-accent-600' : 'text-rose-600')}>
                      {coveragePercent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', coveragePercent >= 80 ? 'bg-brand-500' : coveragePercent >= 50 ? 'bg-accent-500' : 'bg-rose-500')}
                      style={{ width: `${coveragePercent}%` }}
                    />
                  </div>
                </div>

                {/* Missing skills */}
                {team.missingSkills.length > 0 && (
                  <div className="flex items-center gap-2 pt-3 border-t border-ink-100">
                    <AlertTriangle className="w-3.5 h-3.5 text-accent-500" />
                    <span className="text-xs text-ink-500">
                      Missing: {team.missingSkills.slice(0, 3).join(', ')}
                      {team.missingSkills.length > 3 && ` +${team.missingSkills.length - 3}`}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Skill gaps summary */}
      {teams.some((team) => team.missingSkills.length > 0) && (
        <div className="mt-8">
          <h2 className="font-700 text-lg text-ink-900 mb-4">All Skill Gaps</h2>
          <div className="card p-5">
            <div className="space-y-3">
              {teams.flatMap((team) => team.missingSkills.map((skill) => ({ team, skill }))).map(({ team, skill }) => (
                <div key={`${team.id}-${skill}`} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <div>
                      <p className="text-sm font-600 text-ink-900">{skill}</p>
                      <p className="text-xs text-ink-400">{team.name}</p>
                    </div>
                  </div>
                  <span className="chip bg-rose-50 text-rose-700 text-[11px]">Needs coverage</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
