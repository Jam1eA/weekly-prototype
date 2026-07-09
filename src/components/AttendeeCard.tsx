import type { Attendee, Role } from '../types';

// 역할 배지 원클릭 순환: 필수 → 선택 → 공유 (회의 만들기 화면과 동일한 컨트롤)
const nextRole: Record<Role, Role> = {
  required: 'optional',
  optional: 'share',
  share: 'required',
};

const roleLabel: Record<Role, string> = {
  required: '필수',
  optional: '선택',
  share: '공유',
};

const roleBadge: Record<Role, string> = {
  required: 'bg-zinc-900 text-white hover:bg-zinc-800',
  optional: 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
  share: 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200',
};

export default function AttendeeCard({
  attendee,
  onChangeRole,
}: {
  attendee: Attendee;
  onChangeRole: (id: string, role: Role) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
            {attendee.name[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {attendee.name}{' '}
              <span className="font-normal text-zinc-500">{attendee.title}</span>
            </p>
            <p className="text-xs text-zinc-500">{attendee.description}</p>
          </div>
        </div>

        {attendee.isOrganizer ? (
          <span className="shrink-0 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white">
            주최자 · 필수
          </span>
        ) : (
          <button
            onClick={() => onChangeRole(attendee.id, nextRole[attendee.role])}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${roleBadge[attendee.role]}`}
          >
            {roleLabel[attendee.role]}
          </button>
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
