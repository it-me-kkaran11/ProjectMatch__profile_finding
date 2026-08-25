import { useEffect, useMemo, useState } from 'react';
import { Plus, SlidersHorizontal, X, AlertCircle } from 'lucide-react';
import { useNav } from '@/nav';
import { PageContainer, PageHeader, EmptyState } from '@/components/Layout';
import { SearchBar } from '@/components/SearchBar';
import { ProjectCard } from '@/components/ProjectCard';
import { FilterPanel, type FilterGroup } from '@/components/FilterPanel';
import { fetchAllProjects, PROJECT_CATEGORIES, PROJECT_STATUSES } from '@/lib/db';
import type { Project } from '@/types';

export function ProjectsPage() {
  const { navigate } = useNav();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAllProjects();
        if (cancelled) return;
        setProjects(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFilterChange = (group: string, value: string) => {
    setSelected((prev) => {
      const current = prev[group] ?? [];
      return { ...prev, [group]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
    });
  };

  const clearAll = () => setSelected({});

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.tagline.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      }
      if (selected.category?.length && !selected.category.includes(p.category)) return false;
      if (selected.status?.length && !selected.status.includes(p.status)) return false;
      if (selected.skill?.length && !selected.skill.some((sk) => p.requiredSkills.includes(sk))) return false;
      return true;
    });
  }, [projects, search, selected]);

  const filterGroups: FilterGroup[] = useMemo(() => [
    { name: 'category', label: 'Category', options: PROJECT_CATEGORIES.map((c) => ({ label: c, value: c })) },
    { name: 'status', label: 'Status', options: PROJECT_STATUSES.map((s) => ({ label: s, value: s })) },
    {
      name: 'skill',
      label: 'Required Skills',
      options: [...new Set(projects.flatMap((p) => p.requiredSkills))].sort().map((s) => ({ label: s, value: s })),
    },
  ], [projects]);

  const activeCount = Object.values(selected).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Projects" subtitle="Browse open projects or find teams to join" back={false} />
        <div className="card p-12 text-center">
          <p className="text-sm text-ink-500">Loading projects…</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Projects" subtitle="Browse open projects or find teams to join" back={false} />
        <div className="card p-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        subtitle="Browse open projects or find teams to join"
        back={false}
        action={<button onClick={() => navigate({ name: 'create-project' })} className="btn-primary"><Plus className="w-4 h-4" /> Create Project</button>}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6">
            <FilterPanel groups={filterGroups} selected={selected} onChange={handleFilterChange} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-3 mb-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search projects..." />
            <button onClick={() => setShowFilters(true)} className="lg:hidden btn-secondary shrink-0 relative">
              <SlidersHorizontal className="w-4 h-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-700 flex items-center justify-center">{activeCount}</span>
              )}
            </button>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-ink-500">{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</span>
              <button onClick={clearAll} className="text-xs text-brand-600 font-600 hover:text-brand-700 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear filters
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              title="No projects found"
              description={projects.length === 0 ? "No projects have been created yet. Create the first one!" : "Try adjusting your filters, or create a new project."}
              action={<button onClick={() => navigate({ name: 'create-project' })} className="btn-primary"><Plus className="w-4 h-4" /> Create Project</button>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-700 text-ink-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center">
                <X className="w-4 h-4 text-ink-500" />
              </button>
            </div>
            <FilterPanel groups={filterGroups} selected={selected} onChange={handleFilterChange} />
            <button onClick={() => setShowFilters(false)} className="btn-primary w-full mt-4">Show {filtered.length} results</button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
