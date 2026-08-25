import { GraduationCap, Mail, MapPin, Briefcase } from 'lucide-react';
import type { Student } from '@/types';
import { Avatar } from '@/components/Avatar';
import { AvailabilityPill } from '@/components/AvailabilityPill';

export function ProfileHeader({ student, isOwn = false }: { student: Student; isOwn?: boolean }) {
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <Avatar initials={student.initials} color={student.avatarColor} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="font-display font-700 text-2xl text-ink-900 tracking-tight">{student.name}</h1>
            <AvailabilityPill availability={student.availability} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              {student.department}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {student.year}
            </span>
            {student.preferredRoles[0] && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                {student.preferredRoles[0]}
              </span>
            )}
            {!isOwn && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {student.email}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-600 mt-3 leading-relaxed max-w-2xl">{student.bio}</p>
        </div>
      </div>
    </div>
  );
}
