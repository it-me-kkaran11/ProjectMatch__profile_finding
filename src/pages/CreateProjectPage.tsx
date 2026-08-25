import { useEffect, useState } from 'react';
import { Plus, X, ArrowRight, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useNav } from '@/nav';
import { useAuth } from '@/lib/auth';
import { PageContainer, PageHeader } from '@/components/Layout';
import { fetchAllSkills, createProject, PROJECT_CATEGORIES, PROFICIENCY_LABELS, IMPORTANCE_LEVELS } from '@/lib/db';
import type { ProjectCategory, Role } from '@/types';

interface SkillRequirement {
  skillId: string;
  skillName: string;
  requiredProficiency: number;
  importance: 'Required' | 'Preferred' | 'Nice-to-have';
  peopleNeeded: number;
}

const allRoles: Role[] = [
  'Frontend Developer', 'Backend Developer', 'Full-stack Developer', 'Mobile Developer',
  'UI/UX Designer', 'Product Manager', 'Data Scientist', 'ML Engineer',
  'DevOps Engineer', 'Hardware Engineer', 'Researcher', 'Marketing Lead',
];

const availabilities = ['Full-time', 'Part-time', 'Weekends', 'Evenings', 'Limited'];

export function CreateProjectPage() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory | ''>('');
  const [teamSize, setTeamSize] = useState(4);
  const [timeline, setTimeline] = useState('');
  const [availability, setAvailability] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [skillRequirements, setSkillRequirements] = useState<SkillRequirement[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [allSkills, setAllSkills] = useState<{ id: string; name: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSkills().then((skills) => setAllSkills(skills.map((s) => ({ id: s.id, name: s.name })))).catch(() => {});
  }, []);

  const toggleRole = (role: string) => {
    setRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
  };

  const addSkillRequirement = (skillId: string, skillName: string) => {
    if (skillRequirements.some((r) => r.skillId === skillId)) return;
    setSkillRequirements((prev) => [...prev, { skillId, skillName, requiredProficiency: 3, importance: 'Preferred', peopleNeeded: 1 }]);
    setSkillSearch('');
  };

  const removeSkillRequirement = (skillId: string) => {
    setSkillRequirements((prev) => prev.filter((r) => r.skillId !== skillId));
  };

  const updateRequirement = (skillId: string, field: keyof SkillRequirement, value: string | number) => {
    setSkillRequirements((prev) => prev.map((r) => r.skillId === skillId ? { ...r, [field]: value } : r));
  };

  const filteredSkills = allSkills
    .filter((s) => !skillRequirements.some((r) => r.skillId === s.id))
    .filter((s) => skillSearch === '' || s.name.toLowerCase().includes(skillSearch.toLowerCase()));

  const canSubmit = title && tagline && description && category && timeline && availability;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await createProject({
        title,
        tagline,
        description,
        category: category as ProjectCategory,
        teamSize,
        timeline,
        preferredAvailability: availability,
        preferredRoles: roles,
        requirements: skillRequirements.map((r) => ({
          skillId: r.skillId,
          requiredProficiency: r.requiredProficiency,
          importance: r.importance,
          peopleNeeded: r.peopleNeeded,
        })),
      }, user.id);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageContainer>
        <div className="card p-12 text-center max-w-md mx-auto mt-12">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-brand-600" strokeWidth={2.5} />
          </div>
          <h2 className="font-display font-700 text-2xl text-ink-900">Project created!</h2>
          <p className="text-sm text-ink-500 mt-2">Your project is now live and accepting teammates. We'll start matching students right away.</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate({ name: 'projects' })} className="btn-primary">View projects <ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => navigate({ name: 'dashboard' })} className="btn-secondary">Go to dashboard</button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Create a Project" subtitle="Post your project and let teammates find you" />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="card p-3.5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        )}

        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <h3 className="font-700 text-ink-900">Project Details</h3>

          <div>
            <label className="label">Project title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Realtime Collaborative Code Editor" className="input" required />
          </div>

          <div>
            <label className="label">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One sentence that describes your project" className="input" required />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your project, goals, and what you're building..." rows={4} className="input resize-none" required />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)} className="input appearance-none" required>
                <option value="">Select category</option>
                {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Timeline</label>
              <input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. 8 weeks" className="input" required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Preferred team size</label>
              <div className="flex items-center gap-3">
                <input type="range" min={2} max={10} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="flex-1 accent-brand-600" />
                <span className="text-sm font-700 text-ink-900 w-8 text-center">{teamSize}</span>
              </div>
            </div>
            <div>
              <label className="label">Preferred availability</label>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="input appearance-none" required>
                <option value="">Select availability</option>
                {availabilities.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Skill Requirements */}
        <div className="card p-6">
          <h3 className="font-700 text-ink-900 mb-1">Required Skills</h3>
          <p className="text-sm text-ink-500 mb-4">Define what skills your team needs, how many people, and at what level</p>

          {/* Skill search */}
          <input
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Search skills to add..."
            className="input mb-3"
          />

          {filteredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {filteredSkills.slice(0, 12).map((s) => (
                <button key={s.id} type="button" onClick={() => addSkillRequirement(s.id, s.name)} className="chip bg-ink-50 text-ink-600 border border-ink-200 hover:border-ink-300 transition-colors">
                  <Plus className="w-3 h-3" /> {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Added requirements */}
          {skillRequirements.length > 0 && (
            <div className="space-y-3">
              {skillRequirements.map((req) => (
                <div key={req.skillId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-ink-50 border border-ink-100">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="chip bg-brand-600 text-white text-xs shrink-0">{req.skillName}</span>
                    <button type="button" onClick={() => removeSkillRequirement(req.skillId)} className="text-ink-400 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={req.requiredProficiency}
                      onChange={(e) => updateRequirement(req.skillId, 'requiredProficiency', Number(e.target.value))}
                      className="text-xs rounded-lg border border-ink-200 px-2 py-1.5 bg-white"
                    >
                      {Object.entries(PROFICIENCY_LABELS).map(([level, label]) => (
                        <option key={level} value={level}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={req.importance}
                      onChange={(e) => updateRequirement(req.skillId, 'importance', e.target.value)}
                      className="text-xs rounded-lg border border-ink-200 px-2 py-1.5 bg-white"
                    >
                      {IMPORTANCE_LEVELS.map((imp) => <option key={imp} value={imp}>{imp}</option>)}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-ink-500">People</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={req.peopleNeeded}
                        onChange={(e) => updateRequirement(req.skillId, 'peopleNeeded', Math.max(1, Number(e.target.value)))}
                        className="w-14 text-xs rounded-lg border border-ink-200 px-2 py-1.5 bg-white text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="card p-6">
          <h3 className="font-700 text-ink-900 mb-1">Preferred Roles</h3>
          <p className="text-sm text-ink-500 mb-4">What roles are you looking to fill?</p>

          {roles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {roles.map((r) => (
                <button key={r} type="button" onClick={() => toggleRole(r)} className="chip bg-brand-50 text-brand-700 border border-brand-200">
                  {r} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {allRoles.filter((r) => !roles.includes(r)).map((r) => (
              <button key={r} type="button" onClick={() => toggleRole(r)} className="chip bg-ink-50 text-ink-600 border border-ink-200 hover:border-ink-300 transition-colors">
                <Plus className="w-3 h-3" /> {r}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate({ name: 'projects' })} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={!canSubmit || submitting} className="btn-primary flex-1">
            {submitting ? 'Creating…' : <>Create project <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
