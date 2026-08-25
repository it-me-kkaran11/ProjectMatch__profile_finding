import { AlertTriangle, CheckCircle2, ShieldAlert, Users } from 'lucide-react';
import type { ProjectRequirement, Student } from '@/types';
import { analyzeTeamCoverage, type CoverageHealth } from '@/lib/teamCoverage';
import { cn } from '@/utils/cn';

const healthStyles: Record<CoverageHealth, string> = {
  Healthy: 'bg-brand-50 text-brand-700',
  'High redundancy': 'bg-accent-50 text-accent-700',
  'Critical gap': 'bg-rose-50 text-rose-700',
  'Fragile coverage': 'bg-orange-50 text-orange-700',
};

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-xl bg-ink-50 p-3"><p className="text-[10px] font-700 uppercase tracking-wide text-ink-400">{label}</p><p className={cn('mt-1 font-display text-xl font-800', tone)}>{value}</p></div>;
}

export function TeamCoverageAnalyzer({ members, requirements }: { members: Student[]; requirements: ProjectRequirement[] }) {
  const analysis = analyzeTeamCoverage(members, requirements);
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-brand-600" /><h2 className="font-display text-xl font-700 text-ink-900">Team coverage analyzer</h2></div><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">{analysis.explanation}</p></div>
        <div className="grid grid-cols-2 gap-2"><Metric label="Coverage" value={`${analysis.overallCoveragePercent}%`} tone="text-brand-600" /><Metric label="Redundancy" value={`${analysis.overallRedundancyPercent}%`} tone={analysis.overallRedundancyPercent > 0 ? 'text-accent-600' : 'text-ink-900'} /></div>
      </div>

      <div className="mt-6"><h3 className="mb-3 text-xs font-700 uppercase tracking-wide text-ink-500">Skill coverage and redundancy</h3><div className="space-y-3">{analysis.coverage.map((item) => <div key={item.skill} className="rounded-xl border border-ink-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="font-700 text-ink-900">{item.skill}</span><span className={cn('chip text-[10px]', healthStyles[item.health])}>{item.health}</span></div><span className="text-sm font-800 text-ink-900">{item.coveragePercent}% coverage</span></div><div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ink-100"><div className={cn('h-full', item.health === 'Critical gap' ? 'bg-rose-500' : item.health === 'High redundancy' ? 'bg-accent-500' : 'bg-brand-500')} style={{ width: `${Math.min(100, item.coveragePercent)}%` }} /><div className="h-full bg-accent-300" style={{ width: `${Math.min(100, item.redundancyPercent)}%` }} /></div><div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-500"><span>{item.membersWithSkill} qualified member{item.membersWithSkill === 1 ? '' : 's'} · {item.importance}</span><span>{item.redundancyPercent > 0 ? `${item.redundancyPercent}% excess capability` : item.explanation}</span></div></div>)}</div></div>

      <div className="mt-6"><h3 className="mb-3 text-xs font-700 uppercase tracking-wide text-ink-500">Unique contribution by member</h3><div className="grid gap-3 sm:grid-cols-2">{analysis.contributions.map((item) => <div key={item.studentId} className="rounded-xl border border-ink-100 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-ink-400" /><span className="text-sm font-700 text-ink-900">{item.studentName}</span></div><span className="text-sm font-800 text-brand-600">{item.uniqueContributionScore}% unique</span></div><p className="mt-2 text-xs leading-relaxed text-ink-500">{item.explanation}</p>{item.fragileSkills.length > 0 && <p className="mt-2 flex items-center gap-1 text-[11px] font-600 text-rose-600"><AlertTriangle className="h-3.5 w-3.5" /> Fragile: {item.fragileSkills.join(', ')}</p>}</div>)}</div></div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><h3 className="mb-2 flex items-center gap-1.5 text-xs font-700 uppercase tracking-wide text-rose-600"><AlertTriangle className="h-3.5 w-3.5" /> Critical gaps</h3>{analysis.criticalGaps.length > 0 ? <div className="space-y-2">{analysis.criticalGaps.map((gap) => <div key={gap.skill} className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{gap.skill}: {gap.explanation}</div>)}</div> : <p className="rounded-lg bg-brand-50 p-3 text-xs text-brand-700">No critical skills are uncovered.</p>}</div><div><h3 className="mb-2 flex items-center gap-1.5 text-xs font-700 uppercase tracking-wide text-brand-700"><CheckCircle2 className="h-3.5 w-3.5" /> Coverage notes</h3>{analysis.moderateGaps.length > 0 ? <div className="space-y-2">{analysis.moderateGaps.map((gap) => <div key={gap.skill} className="rounded-lg bg-orange-50 p-3 text-xs text-orange-800">{gap.skill}: {gap.explanation}</div>)}</div> : <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">No fragile single-member coverage detected.</p>}</div></div>
    </div>
  );
}
