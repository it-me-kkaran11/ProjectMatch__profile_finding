import { Clock, Users, ArrowRight } from 'lucide-react';
import { useNav } from '@/nav';
import type { Project } from '@/types';
import { SkillBadge } from '@/components/SkillBadge';
import { cn } from '@/utils/cn';

const statusStyles: Record<string, string> = {
  Recruiting: 'bg-brand-50 text-brand-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Planning: 'bg-accent-50 text-accent-700',
  Completed: 'bg-ink-100 text-ink-600',
};

const categoryIcons: Record<string, string> = {
  Academic: '📚',
  Hackathon: '⚡',
  Research: '🔬',
  Startup: '🚀',
  Competition: '🏆',
  'Open Source': '📦',
};

export function ProjectCard({ project }: { project: Project }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate({ name: 'project', id: project.id })}
      className="card card-hover p-5 text-left w-full flex flex-col gap-4 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcons[project.category] ?? '📋'}</span>
          <div>
            <span className={cn('chip', statusStyles[project.status])}>{project.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-400">
          <Clock className="w-3.5 h-3.5" />
          {project.timeline}
        </div>
      </div>

      <div>
        <h3 className="font-700 text-ink-900 group-hover:text-brand-700 transition-colors text-lg leading-snug">{project.title}</h3>
        <p className="text-sm text-ink-500 mt-1">{project.tagline}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {project.requiredSkills.slice(0, 4).map((skill) => (
          <SkillBadge key={skill} skill={skill} size="sm" />
        ))}
        {project.requiredSkills.length > 4 && (
          <span className="text-xs text-ink-400 font-500">+{project.requiredSkills.length - 4} more</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-ink-100">
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {project.currentMembers}/{project.teamSize}
          </span>
          <span className="text-ink-300">·</span>
          <span>{project.category}</span>
        </div>
        <span className="flex items-center gap-1 text-xs font-600 text-brand-600 group-hover:gap-2 transition-all">
          View <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}
