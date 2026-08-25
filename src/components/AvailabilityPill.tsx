import { cn } from '@/utils/cn';
import type { Availability } from '@/types';

const styles: Record<Availability, string> = {
  'Full-time': 'bg-brand-50 text-brand-700 border-brand-200',
  'Part-time': 'bg-blue-50 text-blue-700 border-blue-200',
  Weekends: 'bg-accent-50 text-accent-700 border-accent-200',
  Evenings: 'bg-purple-50 text-purple-700 border-purple-200',
  Limited: 'bg-ink-100 text-ink-600 border-ink-200',
  Unavailable: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function AvailabilityPill({ availability }: { availability: Availability }) {
  return (
    <span className={cn('chip border', styles[availability])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {availability}
    </span>
  );
}
