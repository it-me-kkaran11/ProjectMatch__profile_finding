import { useEffect, useState } from 'react';
import { Briefcase, Heart, Target, Clock, Users as UsersIcon, MessageSquare, UserPlus, AlertCircle } from 'lucide-react';
import { PageContainer, PageHeader, SectionHeader, EmptyState } from '@/components/Layout';
import { ProfileHeader } from '@/components/ProfileHeader';
import { AvailabilityCard } from '@/components/AvailabilityCard';
import { SkillBadge } from '@/components/SkillBadge';
import { fetchStudentById, fetchAllProjects, DAYS_OF_WEEK, PROFICIENCY_LABELS } from '@/lib/db';
import { useNav } from '@/nav';
import type { Student, Project } from '@/types';

export function StudentProfilePage({ id }: { id: string }) {
  const { navigate } = useNav();
  const [student, setStudent] = useState<Student | null>(null);
  const [studentProjects, setStudentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, allProjects] = await Promise.all([fetchStudentById(id), fetchAllProjects()]);
        if (cancelled) return;
        setStudent(s);
        if (s) {
          // For now, show projects where this student is the owner
          setStudentProjects(allProjects.filter((p) => p.ownerId === id));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="card p-12 text-center">
          <p className="text-sm text-ink-500">Loading profile…</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="card p-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      </PageContainer>
    );
  }

  if (!student) {
    return (
      <PageContainer>
        <EmptyState title="Student not found" description="This profile may have been removed." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileHeader student={student} />

          {/* Skills */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-ink-400" />
              <h3 className="font-600 text-sm text-ink-900">Skills</h3>
            </div>
            {student.skills.length > 0 ? (
              <div className="space-y-2">
                {student.skills.map((sk) => (
                  <div key={sk.skillId} className="flex items-center justify-between gap-3 py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <SkillBadge skill={sk.skillName} size="sm" />
                      {sk.evidenceStatus === 'verified' && (
                        <span className="text-[10px] font-600 text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">Verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-500 shrink-0">
                      <span>{PROFICIENCY_LABELS[sk.proficiency]}</span>
                      <span>{sk.yearsExperience}y exp</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No skills added yet.</p>
            )}
          </div>

          {/* Interests */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-ink-400" />
              <h3 className="font-600 text-sm text-ink-900">Interests</h3>
            </div>
            {student.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.interests.map((interest) => (
                  <span key={interest} className="chip bg-blue-50 text-blue-700">{interest}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No interests added yet.</p>
            )}
          </div>

          {/* Preferred Roles */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-ink-400" />
              <h3 className="font-600 text-sm text-ink-900">Preferred Roles</h3>
            </div>
            {student.preferredRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.preferredRoles.map((role) => (
                  <span key={role} className="chip bg-brand-50 text-brand-700 border border-brand-200">{role}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No preferred roles set yet.</p>
            )}
          </div>

          {/* Projects */}
          <div>
            <SectionHeader title="Projects" subtitle={`${studentProjects.length} project${studentProjects.length !== 1 ? 's' : ''}`} />
            {studentProjects.length === 0 ? (
              <EmptyState title="No projects yet" description="This student hasn't created any projects." />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {studentProjects.map((p) => (
                  <div key={p.id} onClick={() => navigate({ name: 'project', id: p.id })} className="cursor-pointer">
                    <ProjectCardSimple project={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <AvailabilityCard availability={student.availability} />

          {/* Availability Schedule */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-ink-400" />
              <h3 className="font-600 text-sm text-ink-900">Weekly Schedule</h3>
            </div>
            <div className="space-y-1.5">
              {DAYS_OF_WEEK.map((day, i) => {
                // We don't have blocks here since they're not in the Student type
                return null;
              })}
              <p className="text-xs text-ink-400">Detailed schedule available on full profile.</p>
            </div>
          </div>

          {/* Work Style */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <UsersIcon className="w-4 h-4 text-ink-400" />
              <h3 className="font-600 text-sm text-ink-900">Work Style</h3>
            </div>
            <span className="chip bg-purple-50 text-purple-700 border border-purple-200">{student.workStyle}</span>
            <p className="text-xs text-ink-500 mt-3 leading-relaxed">
              {student.workStyle === 'Collaborative' && 'Prefers working closely with others, frequent check-ins and pair work.'}
              {student.workStyle === 'Independent' && 'Thrives with autonomy, prefers clear goals and self-directed work.'}
              {student.workStyle === 'Hybrid' && 'Flexible — collaborative when needed, independent for deep work.'}
              {student.workStyle === 'Async-first' && 'Prefers written communication and async updates over meetings.'}
            </p>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <button onClick={() => navigate({ name: 'create-project' })} className="btn-primary w-full">
              <UserPlus className="w-4 h-4" /> Invite to project
            </button>
            <button className="btn-secondary w-full">
              <MessageSquare className="w-4 h-4" /> Send message
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function ProjectCardSimple({ project }: { project: Project }) {
  return (
    <div className="card card-hover p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="chip bg-ink-100 text-ink-600">{project.category}</span>
        <span className="text-xs text-ink-400">{project.timeline}</span>
      </div>
      <h4 className="font-600 text-ink-900 text-sm leading-snug">{project.title}</h4>
      <p className="text-xs text-ink-500 line-clamp-2">{project.tagline}</p>
    </div>
  );
}
