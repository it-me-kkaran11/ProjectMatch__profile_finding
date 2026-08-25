import { GraduationCap, MapPin } from 'lucide-react';
import { useNav } from '@/nav';
import type { Student } from '@/types';
import { Avatar } from '@/components/Avatar';
import { SkillBadge } from '@/components/SkillBadge';
import { MatchScore } from '@/components/MatchScore';
import { AvailabilityPill } from '@/components/AvailabilityPill';

export function StudentCard({ student }: { student: Student }) {
  const { navigate } = useNav();

  return (
    <button
      onClick={() => navigate({ name: 'student', id: student.id })}
      className="card card-hover p-5 text-left w-full flex flex-col gap-4 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar initials={student.initials} color={student.avatarColor} size="lg" />
          <div>
            <h3 className="font-600 text-ink-900 group-hover:text-brand-700 transition-colors">{student.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-ink-500 mt-0.5">
              <GraduationCap className="w-3.5 h-3.5" />
              {student.department}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-400 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {student.year}
            </div>
          </div>
        </div>
        {student.matchScore > 0 && <MatchScore score={student.matchScore} size="sm" />}
      </div>

      <p className="text-sm text-ink-600 leading-relaxed line-clamp-2">{student.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {student.skills.slice(0, 4).map((sk) => (
          <SkillBadge key={sk.skillId} skill={sk.skillName} size="sm" />
        ))}
        {student.skills.length > 4 && (
          <span className="text-xs text-ink-400 font-500">+{student.skills.length - 4} more</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-ink-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-600 text-ink-500">{student.preferredRoles[0] ?? 'Open'}</span>
        </div>
        <AvailabilityPill availability={student.availability} />
      </div>
    </button>
  );
}
