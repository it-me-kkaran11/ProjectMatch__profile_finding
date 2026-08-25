import { type ReactNode } from 'react';
import { useNav } from '@/nav';
import { ArrowLeft } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  back = true,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const { goBack, route } = useNav();
  const canGoBack = route.name !== 'landing' && route.name !== 'dashboard';

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {back && canGoBack && (
          <button
            onClick={goBack}
            className="mt-1 w-9 h-9 rounded-xl border border-ink-200 bg-white flex items-center justify-center text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="font-display font-700 text-2xl sm:text-3xl text-ink-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink-500 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="font-700 text-lg text-ink-900">{title}</h2>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in">
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card p-12 flex flex-col items-center text-center">
      {icon && <div className="mb-4 text-ink-300">{icon}</div>}
      <h3 className="font-600 text-ink-900">{title}</h3>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  color = 'text-ink-900',
}: {
  label: string;
  value: string | number;
  hint?: string;
  color?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-600 text-ink-400 uppercase tracking-wide">{label}</p>
      <p className={`font-display font-700 text-2xl mt-1 ${color}`}>{value}</p>
      {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
    </div>
  );
}
