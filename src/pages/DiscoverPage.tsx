import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X, AlertCircle } from 'lucide-react';
import { PageContainer, PageHeader, EmptyState } from '@/components/Layout';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel, type FilterGroup } from '@/components/FilterPanel';
import { StudentCard } from '@/components/StudentCard';
import { fetchAllStudents, fetchAllSkills, PROFICIENCY_LABELS } from '@/lib/db';
import type { Student } from '@/types';

export function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillOptions, setSkillOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [studentData, skills] = await Promise.all([fetchAllStudents(), fetchAllSkills()]);
        if (cancelled) return;
        setStudents(studentData);
        setSkillOptions(skills.map((s) => ({ label: s.name, value: s.name })));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load students');
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
    return students.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.bio.toLowerCase().includes(q) ||
          s.skills.some((sk) => sk.skillName.toLowerCase().includes(q)) ||
          s.interests.some((i) => i.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (selected.skill?.length && !selected.skill.some((sk) => s.skills.some((us) => us.skillName === sk))) return false;
      if (selected.department?.length && !selected.department.includes(s.department)) return false;
      if (selected.year?.length && !selected.year.includes(s.year)) return false;
      if (selected.availability?.length && !selected.availability.includes(s.availability)) return false;
      if (selected.interest?.length && !selected.interest.some((i) => s.interests.includes(i))) return false;
      if (selected.role?.length && !selected.role.some((r) => s.preferredRoles.includes(r as never))) return false;
      if (selected.workStyle?.length && !selected.workStyle.includes(s.workStyle)) return false;
      if (selected.proficiency?.length) {
        const minProf = Math.min(...selected.proficiency.map(Number));
        if (!s.skills.some((sk) => sk.proficiency >= minProf)) return false;
      }
      return true;
    });
  }, [students, search, selected]);

  const filterGroups: FilterGroup[] = useMemo(() => [
    { name: 'skill', label: 'Skills', options: skillOptions },
    {
      name: 'department',
      label: 'Department',
      options: ['Computer Science', 'Data Science', 'Design', 'Business', 'Electrical Engineering', 'Mechanical Engineering', 'Biomedical Engineering', 'Cognitive Science'].map((d) => ({ label: d, value: d })),
    },
    {
      name: 'year',
      label: 'Year',
      options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'].map((y) => ({ label: y, value: y })),
    },
    {
      name: 'availability',
      label: 'Availability',
      options: ['Full-time', 'Part-time', 'Weekends', 'Evenings', 'Limited', 'Unavailable'].map((a) => ({ label: a, value: a })),
    },
    {
      name: 'role',
      label: 'Preferred Role',
      options: ['Frontend Developer', 'Backend Developer', 'Full-stack Developer', 'Mobile Developer', 'UI/UX Designer', 'Product Manager', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Hardware Engineer', 'Researcher', 'Marketing Lead'].map((r) => ({ label: r, value: r })),
    },
    {
      name: 'proficiency',
      label: 'Min Proficiency',
      options: [
        { label: PROFICIENCY_LABELS[3], value: '3' },
        { label: PROFICIENCY_LABELS[4], value: '4' },
        { label: PROFICIENCY_LABELS[5], value: '5' },
      ],
    },
  ], [skillOptions]);

  const activeCount = Object.values(selected).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Discover Students" subtitle="Find talented teammates across campus" back={false} />
        <div className="card p-12 text-center">
          <p className="text-sm text-ink-500">Loading students…</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Discover Students" subtitle="Find talented teammates across campus" back={false} />
        <div className="card p-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Discover Students" subtitle="Find talented teammates across campus" back={false} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-6">
            <FilterPanel groups={filterGroups} selected={selected} onChange={handleFilterChange} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-3 mb-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, skill, or interest..." />
            <button onClick={() => setShowFilters(true)} className="lg:hidden btn-secondary shrink-0 relative">
              <SlidersHorizontal className="w-4 h-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-700 flex items-center justify-center">{activeCount}</span>
              )}
            </button>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-ink-500">{filtered.length} student{filtered.length !== 1 ? 's' : ''} found</span>
              <button onClick={clearAll} className="text-xs text-brand-600 font-600 hover:text-brand-700 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear filters
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              title="No students found"
              description={students.length === 0 ? "No students have profiles yet. Be the first!" : "Try adjusting your search or filters to find more teammates."}
              action={activeCount > 0 ? <button onClick={clearAll} className="btn-secondary">Clear all filters</button> : undefined}
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((s) => <StudentCard key={s.id} student={s} />)}
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
