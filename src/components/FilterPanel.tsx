import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  name: string;
  label: string;
  options: FilterOption[];
}

export function FilterPanel({
  groups,
  selected,
  onChange,
}: {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onChange: (group: string, value: string) => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(groups[0]?.name ?? null);

  const toggleGroup = (name: string) => {
    setOpenGroup((prev) => (prev === name ? null : name));
  };

  const activeCount = Object.values(selected).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-ink-400" />
          <h3 className="font-600 text-sm text-ink-900">Filters</h3>
        </div>
        {activeCount > 0 && (
          <span className="chip bg-brand-50 text-brand-700 text-[11px]">{activeCount} active</span>
        )}
      </div>

      <div className="space-y-1">
        {groups.map((group) => {
          const isOpen = openGroup === group.name;
          const selectedCount = selected[group.name]?.length ?? 0;
          return (
            <div key={group.name} className="border-b border-ink-100 last:border-0">
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center justify-between py-2.5 px-1 text-left"
              >
                <span className="text-sm font-500 text-ink-700">{group.label}</span>
                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <span className="text-xs text-brand-600 font-600">{selectedCount}</span>
                  )}
                  <ChevronDown className={cn('w-4 h-4 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
                </div>
              </button>
              {isOpen && (
                <div className="pb-2 flex flex-wrap gap-1.5">
                  {group.options.map((opt) => {
                    const isSelected = selected[group.name]?.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onChange(group.name, opt.value)}
                        className={cn(
                          'chip text-xs transition-all',
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-ink-50 text-ink-600 border-ink-200 hover:border-ink-300'
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
