import type { Attendee, Role } from '../types';

const roles: { value: Role; label: string }[] = [
  { value: 'required', label: '필수' },
  { value: 'optional', label: '선택' },
  { value: 'share', label: '공유' },
];

export default function AttendeeCard({
  attendee,
  onChangeRole,
}: {
  attendee: Attendee;
  onChangeRole: (id: string, role: Role) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            {attendee.name[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {attendee.name}{' '}
              <span className="font-normal text-slate-500">{attendee.title}</span>
            </p>
            <p className="text-xs text-slate-500">{attendee.description}</p>
          </div>
        </div>

        {attendee.isOrganizer ? (
          <span className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white">
            주최자 · 필수
          </span>
        ) : (
          <div className="flex shrink-0 rounded-lg bg-slate-100 p-0.5">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => onChangeRole(attendee.id, r.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  attendee.role === r.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {attendee.note && (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
          <span className="shrink-0 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
            {attendee.noteSource === 'preference' ? '미리 설정한 선호' : '캘린더 기준'}
          </span>
          {attendee.note}
        </p>
      )}
    </div>
  );
}
