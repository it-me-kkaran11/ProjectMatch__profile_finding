import { cn } from '@/utils/cn';

export function SkillBadge({ skill, size = 'md' }: { skill: string; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'chip bg-ink-100 text-ink-700',
        size === 'sm' && 'text-[11px] px-2 py-0.5',
        size === 'md' && 'text-xs'
      )}
    >
      {skill}
    </span>
  );
}
