import { cn } from '@/utils/cn';

export function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-2xl',
  };
  return (
    <div className={cn('rounded-full flex items-center justify-center font-700 text-white shrink-0', color, sizes[size])}>
      {initials}
    </div>
  );
}
