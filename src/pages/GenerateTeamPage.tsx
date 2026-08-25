import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Plus, RefreshCw, Sparkles, Target, UserMinus, Users, X } from 'lucide-react';
import { useNav } from '@/nav';
import { PageContainer, PageHeader, EmptyState } from '@/components/Layout';
import { Avatar } from '@/components/Avatar';
import { SkillBadge } from '@/components/SkillBadge';
import { fetchAllStudents, fetchProjectById } from '@/lib/db';
import { generateTeamRecommendations, scoreTeam, simulateChange, type TeamRecommendation, type TeamScore } from '@/lib/teamEngine';
import type { Project, ProjectRequirement, Student } from '@/types';
import { cn } from '@/utils/cn';
import { TeamCoverageAnalyzer } from '@/components/TeamCoverageAnalyzer';
import { TeamResilienceChemistry } from '@/components/TeamResilienceChemistry';

const scoreLabels: { key: keyof TeamRecommendation['scores']; label: string }[] = [
  { key: 'compatibility', label: 'Compatibility' },
  { key: 'skillCoverage', label: 'Skill coverage' },
  { key: 'availabilityOverlap', label: 'Availability overlap' },
  { key: 'roleCoverage', label: 'Role coverage' },
  { key: 'experienceBalance', label: 'Experience balance' },
  { key: 'teamChemistry', label: 'Team chemistry' },
  { key: 'overallReadiness', label: 'Overall readiness' },
];

function ScoreBar({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <span className={cn('text-xs', emphasis ? 'font-700 text-ink-900' : 'font-500 text-ink-500')}>{label}</span>
        <span className={cn('text-xs font-700', value >= 80 ? 'text-brand-600' : value >= 50 ? 'text-accent-600' : 'text-rose-600')}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', value >= 80 ? 'bg-brand-500' : value >= 50 ? 'bg-accent-500' : 'bg-rose-500')} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RecommendationCard({ team, active, onSelect }: { team: TeamRecommendation; active: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={cn('text-left card p-5 transition-all', active ? 'border-brand-400 ring-2 ring-brand-100 shadow-card-hover' : 'hover:border-ink-300')}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-800 text-white">{team.id}</span>
            <h2 className="font-display font-700 text-lg text-ink-900">Team {team.id}</h2>
          </div>
          <p className="text-xs text-ink-500">{team.label}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-800 text-brand-600">{team.scores.overallReadiness}%</p>
          <p className="text-[10px] font-600 uppercase tracking-wide text-ink-400">readiness</p>
        </div>
      </div>
      <div className="space-y-3">
        <ScoreBar label="Skill coverage" value={team.scores.skillCoverage} emphasis />
        <ScoreBar label="Availability overlap" value={team.scores.availabilityOverlap} />
        <ScoreBar label="Role coverage" value={team.scores.roleCoverage} />
        <ScoreBar label="Team chemistry" value={team.scores.teamChemistry} />
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-600 text-brand-700">
        <Users className="h-3.5 w-3.5" /> {team.members.length} recommended teammates
      </div>
    </button>
  );
}

export function GenerateTeamPage({ id }: { id: string }) {
  const { navigate } = useNav();
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([]);
  const [selectedId, setSelectedId] = useState('A');
  const [members, setMembers] = useState<Student[]>([]);
  const [liveScores, setLiveScores] = useState<TeamScore | null>(null);
  const [whatIfMessage, setWhatIfMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProjectById(id), fetchAllStudents()])
      .then(([projectData, studentData]) => {
        if (cancelled) return;
        if (!projectData) {
          setError('Project not found');
          return;
        }
        const generated = generateTeamRecommendations(studentData, projectData.project, projectData.requirements, Math.max(1, projectData.project.teamSize - 1));
        setProject(projectData.project);
        setRequirements(projectData.requirements);
        setStudents(studentData);
        setRecommendations(generated);
        setMembers(generated[0]?.members ?? []);
        setLiveScores(generated[0]?.scores ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to generate recommendations'))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const selected = recommendations.find((team) => team.id === selectedId) ?? recommendations[0];
  const availableStudents = useMemo(() => students.filter((student) => !members.some((member) => member.id === student.id) && student.id !== project?.ownerId), [students, members, project]);

  const selectRecommendation = (team: TeamRecommendation) => {
    setSelectedId(team.id);
    setMembers(team.members);
    setLiveScores(team.scores);
    setWhatIfMessage(null);
  };

  const runWhatIf = (action: 'add' | 'remove' | 'replace', student: Student | undefined, replacedId?: string) => {
    if (!project || !student && action !== 'remove') return;
    const change = simulateChange(members, action, student, replacedId, project, requirements);
    const nextMembers = action === 'add' && student ? [...members, student]
      : action === 'remove' && student ? members.filter((member) => member.id !== student.id)
      : action === 'replace' && student && replacedId ? [...members.filter((member) => member.id !== replacedId), student]
      : members;
    setMembers(nextMembers);
    setLiveScores(scoreTeam(nextMembers, project, requirements));
    setWhatIfMessage(`${change.explanation} Before: ${change.beforeReadiness}%, after: ${change.afterReadiness}% (${change.difference >= 0 ? '+' : ''}${change.difference}).`);
  };

  if (loading) return <PageContainer><div className="card p-12 text-center"><RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-brand-500" /><p className="text-sm text-ink-500">Analyzing project requirements and student profiles...</p></div></PageContainer>;
  if (error || !project || !selected) return <PageContainer><EmptyState title="Team generation unavailable" description={error ?? 'This project does not have enough data yet.'} action={<button onClick={() => navigate({ name: 'projects' })} className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back to projects</button>} /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Generate Team" subtitle={`Deterministic recommendations for ${project.title}`} action={<button onClick={() => navigate({ name: 'project', id: project.id })} className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Project details</button>} />

      <div className="mb-7 rounded-3xl bg-ink-950 p-6 text-white shadow-xl lg:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-600 text-brand-300"><Sparkles className="h-4 w-4" /> Team intelligence workspace</div>
            <h1 className="font-display text-3xl font-800 tracking-tight lg:text-4xl">Build a team that covers the work.</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">Every score is calculated from the project requirements, student profiles, availability, interests, experience, work styles, and evidence. No random ranking.</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 lg:min-w-52">
            <p className="text-xs uppercase tracking-wide text-ink-400">Team target</p>
            <p className="mt-1 font-display text-3xl font-800">{project.teamSize} <span className="text-base font-500 text-ink-400">people</span></p>
            <p className="mt-1 text-xs text-ink-400">{requirements.length} defined requirements</p>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="font-display text-xl font-700 text-ink-900">Three explainable team compositions</h2><p className="mt-1 text-sm text-ink-500">Choose a strategy, then test individual changes below.</p></div><span className="chip bg-brand-50 text-brand-700"><Target className="h-3.5 w-3.5" /> Scores recalculate from data</span></div>
        <div className="grid gap-4 xl:grid-cols-3">{recommendations.map((team) => <RecommendationCard key={team.id} team={team} active={team.id === selected.id} onSelect={() => selectRecommendation(team)} />)}</div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-6">
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-xl font-700 text-ink-900">Team {selected.id} breakdown</h2><p className="mt-1 text-sm text-ink-500">{selected.explanation}</p></div><span className="rounded-2xl bg-brand-50 px-3 py-2 text-center"><span className="block font-display text-2xl font-800 text-brand-600">{selected.scores.overallReadiness}%</span><span className="text-[10px] font-700 uppercase tracking-wide text-brand-700">ready</span></span></div>
            <div className="grid gap-4 sm:grid-cols-2">{scoreLabels.map(({ key, label }) => <ScoreBar key={key} label={label} value={(liveScores ?? selected.scores)[key]} emphasis={key === 'overallReadiness'} />)}</div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-brand-600" /><h2 className="font-display text-lg font-700 text-ink-900">Recommended teammates</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{selected.members.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3"><Avatar initials={member.initials} color={member.avatarColor} size="md" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-700 text-ink-900">{member.name}</p><p className="text-xs text-ink-500">{member.preferredRoles[0] ?? 'Contributor'} · {member.availability}</p><div className="mt-1 flex flex-wrap gap-1">{member.skills.slice(0, 3).map((skill) => <SkillBadge key={skill.skillId} skill={skill.skillName} size="sm" />)}</div></div></div>)}</div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-accent-600" /><h2 className="font-display text-lg font-700 text-ink-900">Team gap analyzer</h2></div>
            <div className="space-y-3">{selected.gaps.filter((gap) => gap.severity !== 'Covered').map((gap) => <div key={gap.skill} className="rounded-xl border border-ink-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-700 text-ink-900">Missing: {gap.skill}</p><p className="mt-1 text-xs text-ink-500">{gap.importance} · {gap.peopleHave}/{gap.peopleNeeded} people covered · {Math.round(gap.coveragePercent)}%</p></div><span className={cn('chip text-[11px]', gap.severity === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-accent-50 text-accent-700')}>{gap.severity} gap</span></div>{gap.recommendedStudents.length > 0 ? <div className="mt-3 space-y-2 border-t border-ink-100 pt-3">{gap.recommendedStudents.map((candidate) => <div key={candidate.student.id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Avatar initials={candidate.student.initials} color={candidate.student.avatarColor} size="sm" /><span className="truncate text-sm font-600 text-ink-800">{candidate.student.name}</span></div><span className="text-sm font-700 text-brand-600">{candidate.matchScore}%</span></div>)}</div> : <p className="mt-3 text-xs text-rose-600">No matching students found in the current database.</p>}</div>)}{selected.gaps.every((gap) => gap.severity === 'Covered') && <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-4 text-sm font-600 text-brand-700"><CheckCircle2 className="h-4 w-4" /> Every requirement is covered at the required proficiency.</div>}</div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card p-6 ring-1 ring-brand-100">
            <div className="mb-4 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-brand-600" /><h2 className="font-display text-lg font-700 text-ink-900">What-if simulator</h2></div>
            <p className="mb-4 text-sm leading-relaxed text-ink-500">Test a candidate or remove a member. The readiness result is calculated immediately from the same team engine.</p>
            {whatIfMessage && <div className="mb-4 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-800">{whatIfMessage}</div>}
            <div className="space-y-3">
              <label className="label" htmlFor="add-candidate">Add candidate</label>
              <div className="flex gap-2"><select id="add-candidate" className="input" defaultValue="" onChange={(event) => { const student = availableStudents.find((item) => item.id === event.target.value); if (student) runWhatIf('add', student); event.currentTarget.value = ''; }}><option value="">Select a student...</option>{availableStudents.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select><Plus className="mt-3 h-4 w-4 shrink-0 text-ink-400" /></div>
              <label className="label mt-4" htmlFor="remove-member">Remove member</label>
              <div className="flex gap-2"><select id="remove-member" className="input" defaultValue="" onChange={(event) => { const student = members.find((item) => item.id === event.target.value); if (student) runWhatIf('remove', student); event.currentTarget.value = ''; }}><option value="">Select a member...</option>{members.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select><UserMinus className="mt-3 h-4 w-4 shrink-0 text-ink-400" /></div>
              <label className="label mt-4" htmlFor="replace-member">Replace member</label>
              <div className="grid gap-2"><select id="replace-member" className="input" defaultValue="" onChange={(event) => { const [replacedId, candidateId] = event.target.value.split('|'); const student = availableStudents.find((item) => item.id === candidateId); if (student) runWhatIf('replace', student, replacedId); event.currentTarget.value = ''; }}><option value="">Select replacement...</option>{members.flatMap((member) => availableStudents.slice(0, 8).map((candidate) => <option key={`${member.id}|${candidate.id}`} value={`${member.id}|${candidate.id}`}>{member.name} with {candidate.name}</option>))}</select></div>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-700 text-ink-900">Current simulation</h2><span className="chip bg-ink-100 text-ink-600">{members.length} selected</span></div>
            <div className="space-y-3">{members.map((member) => <div key={member.id} className="flex items-center gap-2"><Avatar initials={member.initials} color={member.avatarColor} size="sm" /><span className="min-w-0 flex-1 truncate text-sm text-ink-700">{member.name}</span><button title={`Remove ${member.name}`} onClick={() => runWhatIf('remove', member)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-rose-50 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button></div>)}</div>
          </div>
        </aside>
      </div>
      <div className="mt-6">
        <TeamCoverageAnalyzer members={members} requirements={requirements} />
      </div>
      <div className="mt-6"><TeamResilienceChemistry members={members} requirements={requirements} project={project} /></div>
    </PageContainer>
  );
}
