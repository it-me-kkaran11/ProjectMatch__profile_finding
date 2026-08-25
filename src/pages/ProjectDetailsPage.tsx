import { useCallback, useEffect, useState } from 'react';
import { Clock, Users, Calendar, Tag, UserPlus, ArrowRight, AlertCircle, Edit3, Check, X, UserMinus, Sparkles } from 'lucide-react';
import { useNav } from '@/nav';
import { useAuth } from '@/lib/auth';
import { PageContainer, PageHeader, SectionHeader, EmptyState } from '@/components/Layout';
import { SkillBadge } from '@/components/SkillBadge';
import { Avatar } from '@/components/Avatar';
import { cn } from '@/utils/cn';
import { fetchProjectById, joinProject, leaveProject, updateMemberStatus, removeMember, PROFICIENCY_LABELS } from '@/lib/db';
import type { Project, ProjectRequirement, ProjectMember } from '@/types';

const statusStyles: Record<string, string> = {
  Recruiting: 'bg-brand-50 text-brand-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Planning: 'bg-accent-50 text-accent-700',
  Completed: 'bg-ink-100 text-ink-600',
};

const importanceStyles: Record<string, string> = {
  Required: 'bg-rose-50 text-rose-700',
  Preferred: 'bg-brand-50 text-brand-700',
  'Nice-to-have': 'bg-ink-100 text-ink-600',
};

export function ProjectDetailsPage({ id }: { id: string }) {
  const { navigate } = useNav();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<ProjectRequirement[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchProjectById(id);
      if (!data) {
        setError('Project not found');
        return;
      }
      setProject(data.project);
      setRequirements(data.requirements);
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isOwner = user?.id === project?.ownerId;
  const myMembership = members.find((m) => m.userId === user?.id);
  const isMember = myMembership?.status === 'member';
  const hasRequested = myMembership?.status === 'requested';

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    setActionError(null);
    try {
      await joinProject(id, user.id);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to join project');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setJoining(true);
    setActionError(null);
    try {
      await leaveProject(id, user.id);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to leave project');
    } finally {
      setJoining(false);
    }
  };

  const handleApproveMember = async (memberId: string) => {
    setActionError(null);
    try {
      await updateMemberStatus(id, memberId, 'member');
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setActionError(null);
    try {
      await removeMember(memberId);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="card p-12 text-center">
          <p className="text-sm text-ink-500">Loading project…</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer>
        <EmptyState title="Project not found" description={error ?? "This project may have been removed."} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="" />

      {actionError && (
        <div className="card p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-600">{actionError}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project header */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={cn('chip', statusStyles[project.status])}>{project.status}</span>
              <span className="chip bg-ink-100 text-ink-600">{project.category}</span>
            </div>
            <h1 className="font-display font-700 text-2xl text-ink-900 tracking-tight">{project.title}</h1>
            <p className="text-ink-500 mt-1">{project.tagline}</p>
            <p className="text-sm text-ink-600 mt-4 leading-relaxed">{project.description}</p>

            <div className="flex items-center gap-3 mt-5 pt-5 border-t border-ink-100">
              <button onClick={() => navigate({ name: 'student', id: project.ownerId })} className="flex items-center gap-2 group">
                <Avatar initials={project.ownerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()} color="bg-brand-500" size="sm" />
                <div className="text-left">
                  <p className="text-xs text-ink-400">Led by</p>
                  <p className="text-sm font-600 text-ink-900 group-hover:text-brand-700 transition-colors">{project.ownerName}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Required Skills with requirements detail */}
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-3">Skill Requirements</h3>
            {requirements.length > 0 ? (
              <div className="space-y-3">
                {requirements.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-ink-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <SkillBadge skill={req.skillName} size="sm" />
                      <span className={cn('chip text-[10px] px-1.5 py-0.5', importanceStyles[req.importance])}>{req.importance}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-500 shrink-0">
                      <span>Min: {PROFICIENCY_LABELS[req.requiredProficiency]}</span>
                      <span>{req.peopleNeeded} needed</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {project.requiredSkills.map((skill) => <SkillBadge key={skill} skill={skill} />)}
              </div>
            )}
          </div>

          {/* Preferred Roles */}
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-3">Preferred Roles</h3>
            {project.preferredRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.preferredRoles.map((role) => (
                  <span key={role} className="chip bg-brand-50 text-brand-700 border border-brand-200">{role}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No preferred roles specified.</p>
            )}
          </div>

          {/* Team Members */}
          <div>
            <SectionHeader title="Team Members" subtitle={`${members.filter((m) => m.status === 'member').length + 1} member${members.filter((m) => m.status === 'member').length + 1 !== 1 ? 's' : ''}`} />
            <div className="card p-5 space-y-3">
              {/* Owner */}
              <div className="flex items-center gap-3">
                <Avatar initials={project.ownerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()} color="bg-brand-500" size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-ink-900">{project.ownerName}</p>
                  <p className="text-xs text-ink-500">Project Lead</p>
                </div>
                <span className="chip bg-brand-50 text-brand-700 text-[10px]">Owner</span>
              </div>

              {/* Members */}
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <button onClick={() => navigate({ name: 'student', id: m.userId })}>
                    <Avatar initials={m.initials} color={m.avatarColor} size="md" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate({ name: 'student', id: m.userId })} className="text-sm font-600 text-ink-900 hover:text-brand-700 transition-colors">
                      {m.userName}
                    </button>
                    <p className="text-xs text-ink-500">{m.role ?? 'Team Member'}</p>
                  </div>
                  {m.status === 'requested' && isOwner ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleApproveMember(m.id)} className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center justify-center" title="Approve">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleRemoveMember(m.id)} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center" title="Decline">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={cn('chip text-[10px]', m.status === 'member' ? 'bg-brand-50 text-brand-700' : m.status === 'requested' ? 'bg-accent-50 text-accent-700' : 'bg-ink-100 text-ink-500')}>
                        {m.status === 'member' ? 'Member' : m.status === 'requested' ? 'Pending' : 'Invited'}
                      </span>
                      {isOwner && m.status === 'member' && (
                        <button onClick={() => handleRemoveMember(m.id)} className="w-7 h-7 rounded-lg hover:bg-rose-50 text-ink-400 hover:text-rose-600 flex items-center justify-center" title="Remove">
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {members.length === 0 && (
                <p className="text-sm text-ink-400 py-2">No additional members yet. Share your project to attract teammates!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-600 text-sm text-ink-900 mb-4">Project Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Users className="w-4 h-4 text-ink-400" /> Team Size</span>
                <span className="text-sm font-600 text-ink-900">{project.currentMembers}/{project.teamSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Clock className="w-4 h-4 text-ink-400" /> Timeline</span>
                <span className="text-sm font-600 text-ink-900">{project.timeline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Calendar className="w-4 h-4 text-ink-400" /> Availability</span>
                <span className="text-sm font-600 text-ink-900">{project.availabilityReq}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink-500"><Tag className="w-4 h-4 text-ink-400" /> Category</span>
                <span className="text-sm font-600 text-ink-900">{project.category}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-ink-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-600 text-ink-500">Team filled</span>
                <span className="text-xs font-700 text-ink-900">{Math.round((project.currentMembers / project.teamSize) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${(project.currentMembers / project.teamSize) * 100}%` }} />
              </div>
              <p className="text-xs text-ink-400 mt-2">{project.teamSize - project.currentMembers} spot{project.teamSize - project.currentMembers !== 1 ? 's' : ''} remaining</p>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            {isOwner ? (
              <button onClick={() => navigate({ name: 'edit-project', id: project.id })} className="btn-primary w-full">
                <Edit3 className="w-4 h-4" /> Edit project
              </button>
            ) : isMember ? (
              <button onClick={handleLeave} disabled={joining} className="btn-secondary w-full">
                <UserMinus className="w-4 h-4" /> {joining ? 'Leaving…' : 'Leave project'}
              </button>
            ) : hasRequested ? (
              <div className="text-center py-2">
                <p className="text-sm text-ink-500 mb-2">Request sent — waiting for approval</p>
                <button onClick={handleLeave} disabled={joining} className="btn-secondary w-full">
                  Cancel request
                </button>
              </div>
            ) : (
              <button onClick={handleJoin} disabled={joining} className="btn-primary w-full">
                <UserPlus className="w-4 h-4" /> {joining ? 'Sending request…' : 'Request to join'}
              </button>
            )}
            <button onClick={() => navigate({ name: 'generate-team', id: project.id })} className="btn-secondary w-full">
              <Sparkles className="w-4 h-4" /> Generate team
            </button>
            <button className="btn-secondary w-full">
              Save project <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
