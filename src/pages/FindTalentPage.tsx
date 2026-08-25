import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, AlertCircle } from 'lucide-react';
import { PageContainer, PageHeader, EmptyState } from '@/components/Layout';
import { SearchBar } from '@/components/SearchBar';
import { StudentCard } from '@/components/StudentCard';
import { fetchAllStudents } from '@/lib/db';
import { findTalent, parseTalentRequest } from '@/lib/recommendation';
import { FilterPanel, type FilterGroup } from '@/components/FilterPanel';
import type { Student } from '@/types';

const EXAMPLES = [
  'Find a student who knows Python, machine learning and has experience in healthcare projects.',
  'I need a React developer interested in startups',
  'Looking for a UI/UX designer with accessibility experience',
  'Find someone who knows Kubernetes, Docker and AWS',
];

export function FindTalentPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchAllStudents()
      .then(setStudents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    if (!searched || !query.trim()) return [];
    return findTalent(query, students);
  }, [query, searched, students]);

  const parsed = useMemo(() => (query.trim() ? parseTalentRequest(query) : { skills: [], interests: [] }), [query]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (selected.department?.length && !selected.department.includes(r.student.department)) return false;
      if (selected.year?.length && !selected.year.includes(r.student.year)) return false;
      if (selected.availability?.length && !selected.availability.includes(r.student.availability)) return false;
      return true;
    });
  }, [results, selected]);

  const handleFilterChange = (group: string, value: string) => {
    setSelected((prev) => {
      const current = prev[group] ?? [];
      return { ...prev, [group]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
    });
  };

  const filterGroups: FilterGroup[] = [
    {
      name: 'department', label: 'Department',
      options: ['Computer Science', 'Data Science', 'Design', 'Business', 'Electrical Engineering', 'Mechanical Engineering', 'Biomedical Engineering', 'Cognitive Science'].map((d) => ({ label: d, value: d })),
    },
    {
      name: 'year', label: 'Year',
      options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'].map((y) => ({ label: y, value: y })),
    },
    {
      name: 'availability', label: 'Availability',
      options: ['Full-time', 'Part-time', 'Weekends', 'Evenings', 'Limited'].map((a) => ({ label: a, value: a })),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Find Talent" subtitle="Describe what you need in plain language" back={false} />
        <div className="card p-12 text-center"><p className="text-sm text-ink-500">Loading students…</p></div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Find Talent" subtitle="Describe what you need in plain language" back={false} />
        <div className="card p-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Find Talent" subtitle="Describe what you need in plain language" back={false} />

      <div className="max-w-3xl space-y-4">
        {/* Search */}
        <div className="card p-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <SearchBar value={query} onChange={setQuery} placeholder="e.g. Find a student who knows Python, ML and healthcare..." />
            </div>
            <button
              onClick={() => setSearched(true)}
              disabled={!query.trim()}
              className="btn-primary shrink-0"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>

          {/* Example queries */}
          {!searched && (
            <div className="space-y-2">
              <p className="text-xs text-ink-400 font-500">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setQuery(ex); setSearched(true); }}
                    className="text-xs text-left px-3 py-2 rounded-xl bg-ink-50 text-ink-600 border border-ink-100 hover:border-brand-200 hover:bg-brand-50/50 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parsed query display */}
          {searched && (parsed.skills.length > 0 || parsed.interests.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink-100">
              <span className="text-xs text-ink-400 font-500">Parsed:</span>
              {parsed.skills.map((s) => (
                <span key={s} className="chip bg-brand-50 text-brand-700 text-[11px]">{s}</span>
              ))}
              {parsed.interests.map((i) => (
                <span key={i} className="chip bg-blue-50 text-blue-700 text-[11px]">{i}</span>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {searched && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-6">
                <FilterPanel groups={filterGroups} selected={selected} onChange={handleFilterChange} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <h3 className="font-600 text-sm text-ink-900">{filteredResults.length} candidate{filteredResults.length !== 1 ? 's' : ''} found</h3>
              </div>

              {filteredResults.length === 0 ? (
                <EmptyState
                  title="No matching students"
                  description="Try rephrasing your request or removing some filters."
                  action={<button onClick={() => { setSelected({}); setSearched(false); setQuery(''); }} className="btn-secondary">Start over</button>}
                />
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((r) => (
                    <div key={r.student.id} className="space-y-2">
                      <StudentCard student={r.student} />
                      <div className="card p-3 ml-4 bg-brand-50/30 border border-brand-100">
                        <div className="flex items-start gap-2">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-lg font-display font-700 text-brand-600">{r.matchScore}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-ink-600 leading-relaxed">{r.explanation}</p>
                            {r.matchedSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {r.matchedSkills.map((s) => (
                                  <span key={s} className="text-[10px] font-600 text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
