import { useEffect, useState } from 'react';
import { Edit3, LogOut, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase, type Profile } from '@/lib/supabase';
import { PageContainer, PageHeader } from '@/components/Layout';
import { ProfileHeader } from '@/components/ProfileHeader';
import { AvailabilityCard } from '@/components/AvailabilityCard';
import type { Student, WorkStyle, Role } from '@/types';
import { allDepartments, allYears, allWorkStyles, allRoles } from '@/data/mockData';

function profileToStudent(p: Profile): Student {
  const initials = p.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  const colors = ['bg-brand-500', 'bg-accent-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500'];
  const colorIndex = p.id.charCodeAt(0) % colors.length;

  return {
    id: p.id,
    name: p.full_name || 'Unknown',
    avatarColor: colors[colorIndex],
    initials,
    department: (p.department as Student['department']) || 'Undeclared',
    year: (p.year as Student['year']) || 'Freshman',
    bio: p.bio || 'No bio yet. Click "Edit profile" to add one.',
    skills: [],
    interests: p.interests ?? [],
    preferredRoles: (p.preferred_roles ?? []) as Role[],
    availability: 'Part-time',
    workStyle: (p.work_style as WorkStyle) || 'Collaborative',
    experience: [],
    projects: [],
    matchScore: 0,
    email: p.email,
  };
}

export function MyProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setStudent(profileToStudent(profile));
    }
  }, [profile]);

  const startEdit = () => {
    if (profile) {
      setEditData({ ...profile });
      setEditError(null);
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editData || !user) return;
    setSaving(true);
    setEditError(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editData.full_name,
        department: editData.department,
        year: editData.year,
        bio: editData.bio,
        interests: editData.interests,
        preferred_roles: editData.preferred_roles,
        work_style: editData.work_style,
        communication_preference: editData.communication_preference,
        collaboration_preference: editData.collaboration_preference,
        leadership_preference: editData.leadership_preference,
        available_hours_per_week: editData.available_hours_per_week,
        preferred_project_duration_weeks: editData.preferred_project_duration_weeks,
      })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      setEditError(error.message);
      return;
    }
    setEditing(false);
    await refreshProfile();
  };

  const toggleArrayItem = (field: 'interests' | 'preferred_roles', value: string) => {
    if (!editData) return;
    const current = editData[field] as string[];
    setEditData({
      ...editData,
      [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  if (!student) {
    return (
      <PageContainer>
        <div className="card p-12 text-center">
          <p className="text-ink-500">Loading your profile…</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Profile"
        subtitle="How other students see you"
        back={false}
        action={
          <div className="flex gap-2">
            <button onClick={() => signOut()} className="btn-secondary"><LogOut className="w-4 h-4" /> Log out</button>
            <button onClick={startEdit} className="btn-primary"><Edit3 className="w-4 h-4" /> Edit profile</button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileHeader student={student} isOwn />

          {/* Bio */}
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-3">About</h3>
            <p className="text-sm text-ink-600 leading-relaxed">{student.bio}</p>
          </div>

          {/* Interests */}
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-3">Interests</h3>
            {student.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.interests.map((interest) => (
                  <span key={interest} className="chip bg-blue-50 text-blue-700">{interest}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No interests added yet. Edit your profile to add some.</p>
            )}
          </div>

          {/* Preferred Roles */}
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-3">Preferred Roles</h3>
            {student.preferredRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.preferredRoles.map((role) => (
                  <span key={role} className="chip bg-brand-50 text-brand-700 border border-brand-200">{role}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No preferred roles set yet. Edit your profile to add some.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AvailabilityCard availability={student.availability} />

          {/* Work Style */}
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-3">Work Style</h3>
            <span className="chip bg-purple-50 text-purple-700 border border-purple-200">{student.workStyle}</span>
            <p className="text-xs text-ink-500 mt-3 leading-relaxed">
              {student.workStyle === 'Collaborative' && 'Prefers working closely with others, frequent check-ins and pair work.'}
              {student.workStyle === 'Independent' && 'Thrives with autonomy, prefers clear goals and self-directed work.'}
              {student.workStyle === 'Hybrid' && 'Flexible — collaborative when needed, independent for deep work.'}
              {student.workStyle === 'Async-first' && 'Prefers written communication and async updates over meetings.'}
            </p>
          </div>

          {/* Profile completeness */}
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-3">Profile Completeness</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${student.bio !== 'No bio yet. Click "Edit profile" to add one.' ? '60%' : '30%'}%` }} />
              </div>
              <span className="font-700 text-sm text-brand-600">{student.bio !== 'No bio yet. Click "Edit profile" to add one.' ? '60%' : '30%'}</span>
            </div>
            <p className="text-xs text-ink-500">Add a bio, interests, and roles to reach 100%.</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-700 text-lg text-ink-900">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-lg hover:bg-ink-100 flex items-center justify-center">
                <X className="w-4 h-4 text-ink-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {editError && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-3 text-sm text-rose-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="label">Full Name</label>
                <input value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} className="input" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Department</label>
                  <select value={editData.department ?? ''} onChange={(e) => setEditData({ ...editData, department: e.target.value })} className="input appearance-none">
                    <option value="">Select department</option>
                    {allDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <select value={editData.year ?? ''} onChange={(e) => setEditData({ ...editData, year: e.target.value })} className="input appearance-none">
                    <option value="">Select year</option>
                    {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea value={editData.bio ?? ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} rows={4} className="input resize-none" placeholder="Tell other students about yourself…" />
              </div>

              <div>
                <label className="label">Work Style</label>
                <select value={editData.work_style ?? ''} onChange={(e) => setEditData({ ...editData, work_style: e.target.value })} className="input appearance-none">
                  <option value="">Select work style</option>
                  {allWorkStyles.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Interests</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Developer Tools', 'AI/ML', 'Design', 'Startups', 'Healthcare', 'Education', 'Robotics', 'Mobile', 'Open Source', 'Sustainability', 'Social Impact'].map((i) => {
                    const selected = editData.interests.includes(i);
                    return (
                      <button key={i} type="button" onClick={() => toggleArrayItem('interests', i)}
                        className={`chip text-xs transition-all ${selected ? 'bg-brand-600 text-white border-brand-600' : 'bg-ink-50 text-ink-600 border-ink-200 hover:border-ink-300'}`}>
                        {i}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">Available hours / week</label><input type="number" min="0" value={editData.available_hours_per_week ?? ''} onChange={(e) => setEditData({ ...editData, available_hours_per_week: e.target.value ? Number(e.target.value) : null })} className="input" /></div>
                <div><label className="label">Preferred project duration (weeks)</label><input type="number" min="1" value={editData.preferred_project_duration_weeks ?? ''} onChange={(e) => setEditData({ ...editData, preferred_project_duration_weeks: e.target.value ? Number(e.target.value) : null })} className="input" /></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className="label">Communication</label><select value={editData.communication_preference ?? ''} onChange={(e) => setEditData({ ...editData, communication_preference: (e.target.value || null) as Profile['communication_preference'] })} className="input appearance-none"><option value="">Not specified</option><option value="asynchronous">Asynchronous</option><option value="frequent discussion">Frequent discussion</option><option value="mixed">Mixed</option></select></div>
                <div><label className="label">Collaboration</label><select value={editData.collaboration_preference ?? ''} onChange={(e) => setEditData({ ...editData, collaboration_preference: (e.target.value || null) as Profile['collaboration_preference'] })} className="input appearance-none"><option value="">Not specified</option><option value="independent">Independent</option><option value="collaborative">Collaborative</option><option value="mixed">Mixed</option></select></div>
                <div><label className="label">Leadership</label><select value={editData.leadership_preference ?? ''} onChange={(e) => setEditData({ ...editData, leadership_preference: (e.target.value || null) as Profile['leadership_preference'] })} className="input appearance-none"><option value="">Not specified</option><option value="prefer leading">Prefer leading</option><option value="shared leadership">Shared leadership</option><option value="prefer specialist role">Prefer specialist role</option></select></div>
              </div>

              <div>
                <label className="label">Preferred Roles</label>
                <div className="flex flex-wrap gap-1.5">
                  {allRoles.map((r) => {
                    const selected = editData.preferred_roles.includes(r);
                    return (
                      <button key={r} type="button" onClick={() => toggleArrayItem('preferred_roles', r)}
                        className={`chip text-xs transition-all ${selected ? 'bg-brand-600 text-white border-brand-600' : 'bg-ink-50 text-ink-600 border-ink-200 hover:border-ink-300'}`}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-ink-100 px-6 py-4 flex gap-3">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
