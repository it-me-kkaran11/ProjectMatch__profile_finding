import { CheckCircle2, Circle } from 'lucide-react';
import type { SkillCoverageItem } from '@/types';
import { cn } from '@/utils/cn';

export function SkillCoverage({ skills, missingSkills }: { skills: SkillCoverageItem[]; missingSkills: string[] }) {
  const covered = skills.filter((s) => s.covered);
  const uncovered = skills.filter((s) => !s.covered);
  const coveragePercent = skills.length > 0 ? Math.round((covered.length / skills.length) * 100) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-600 text-sm text-ink-900">Skill Coverage</h3>
        <span className={cn(
          'chip text-xs font-700',
          coveragePercent >= 80 ? 'bg-brand-50 text-brand-700' :
          coveragePercent >= 50 ? 'bg-accent-50 text-accent-700' :
          'bg-rose-50 text-rose-700'
        )}>
          {coveragePercent}% covered
        </span>
      </div>

      <div className="mb-4">
        <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              coveragePercent >= 80 ? 'bg-brand-500' :
              coveragePercent >= 50 ? 'bg-accent-500' :
              'bg-rose-500'
            )}
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {skills.map((item) => (
          <div key={item.skill} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.covered ? (
                <CheckCircle2 className="w-4 h-4 text-brand-500" />
              ) : (
                <Circle className="w-4 h-4 text-ink-300" />
              )}
              <span className={cn('text-sm', item.covered ? 'text-ink-700 font-500' : 'text-ink-400')}>
                {item.skill}
              </span>
            </div>
            {item.covered && item.count > 0 && (
              <span className="text-xs text-ink-400">{item.count} member{item.count > 1 ? 's' : ''}</span>
            )}
          </div>
        ))}
      </div>

      {missingSkills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-ink-100">
          <p className="text-xs font-600 text-ink-500 uppercase tracking-wide mb-2">Missing Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((skill) => (
              <span key={skill} className="chip bg-rose-50 text-rose-600 border border-rose-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
