import type { Attendee } from '../types';

const roleLabel: Record<string, string> = {
  required: '필수',
  optional: '선택',
  share: '공유',
};

const roleBadge: Record<string, string> = {
  required: 'bg-blue-50 text-blue-600',
  optional: 'bg-slate-100 text-slate-500',
  share: 'bg-slate-100 text-slate-400',
};

export default function Sidebar({ attendees }: { attendees: Attendee[] }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <nav className="border-b border-slate-100 p-3">
        {[
          { label: '내 캘린더', active: false },
          { label: '회의 조율', active: true },
          { label: '회의실 예약', active: false },
          { label: '팀 멤버', active: false },
        ].map((item) => (
          <div
            key={item.label}
            className={`mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              item.active
                ? 'bg-blue-50 font-semibold text-blue-700'
                : 'text-slate-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-blue-500' : 'bg-slate-300'}`}
            />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400">
          이번 회의 참석자
        </p>
        <ul className="space-y-1">
          {attendees.map((a) => (
            <li key={a.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                {a.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-800">
                  {a.name} <span className="font-normal text-slate-400">{a.title}</span>
                </p>
              </div>
              {a.isOrganizer ? (
                <span className="shrink-0 rounded bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  주최자
                </span>
              ) : (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${roleBadge[a.role]}`}
                >
                  {roleLabel[a.role]}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-100 p-4">
        <p className="text-xs leading-relaxed text-slate-400">
          필수 참석자가 모두 가능한 시간을 기준으로 회의를 조율하고 있어요.
        </p>
      </div>
    </aside>
  );
}
