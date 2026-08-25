import { useNav } from '@/nav';
import type { TeamMember } from '@/types';
import { Avatar } from '@/components/Avatar';
import { AvailabilityPill } from '@/components/AvailabilityPill';
import { SkillBadge } from '@/components/SkillBadge';

export function TeamMemberCard({ member }: { member: TeamMember }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate({ name: 'student', id: member.studentId })}
      className="card card-hover p-4 text-left flex flex-col gap-3 group"
    >
      <div className="flex items-center gap-3">
        <Avatar initials={member.initials} color={member.avatarColor} size="md" />
        <div className="flex-1 min-w-0">
          <h4 className="font-600 text-sm text-ink-900 group-hover:text-brand-700 transition-colors truncate">{member.name}</h4>
          <p className="text-xs text-ink-500">{member.role}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {member.skills.slice(0, 3).map((skill) => (
          <SkillBadge key={skill} skill={skill} size="sm" />
        ))}
      </div>
      <div className="pt-2 border-t border-ink-100">
        <AvailabilityPill availability={member.availability} />
      </div>
    </button>
  );
}
