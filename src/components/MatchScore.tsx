import { cn } from '@/utils/cn';

export function MatchScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color =
    score >= 90 ? 'text-brand-600 bg-brand-50' :
    score >= 80 ? 'text-accent-600 bg-accent-50' :
    score >= 70 ? 'text-blue-600 bg-blue-50' :
    'text-ink-500 bg-ink-100';

  const ringColor =
    score >= 90 ? 'stroke-brand-500' :
    score >= 80 ? 'stroke-accent-500' :
    score >= 70 ? 'stroke-blue-500' :
    'stroke-ink-400';

  const dims = size === 'lg' ? 56 : size === 'sm' ? 36 : 44;
  const stroke = 4;
  const radius = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          <circle cx={dims / 2} cy={dims / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-ink-100" />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={cn('transition-all duration-700', ringColor)}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className={cn('absolute inset-0 flex items-center justify-center font-700', color.replace('text-', 'text-').replace('bg-', ''))} style={{ fontSize: size === 'lg' ? 14 : 11 }}>
          {score}
        </span>
      </div>
      {size !== 'sm' && (
        <div className="flex flex-col">
          <span className="text-[10px] font-600 text-ink-400 uppercase tracking-wide">Match</span>
          <span className={cn('text-sm font-700', color.split(' ')[0])}>{score}%</span>
        </div>
      )}
    </div>
  );
}
