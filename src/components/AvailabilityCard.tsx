import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Availability } from '@/types';
import { AvailabilityPill } from '@/components/AvailabilityPill';

export function AvailabilityCard({ availability }: { availability: Availability }) {
  const isAvailable = availability !== 'Unavailable';
  const isLimited = availability === 'Limited' || availability === 'Unavailable';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink-400" />
          <h3 className="font-600 text-sm text-ink-900">Availability</h3>
        </div>
        {isAvailable && !isLimited && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
        {isLimited && <AlertCircle className="w-4 h-4 text-accent-500" />}
      </div>
      <AvailabilityPill availability={availability} />
      <p className="text-xs text-ink-500 mt-3 leading-relaxed">
        {isAvailable && !isLimited && 'Open to new projects and collaborations.'}
        {availability === 'Limited' && 'Currently has limited bandwidth for new commitments.'}
        {availability === 'Unavailable' && 'Not available for new projects at this time.'}
      </p>
    </div>
  );
}
