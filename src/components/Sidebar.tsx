import type { Attendee } from '../types';

const roleLabel: Record<string, string> = {
  required: '필수',
  optional: '선택',
  share: '공유',
};

const roleBadge: Record<string, string> = {
  required: 'bg-zinc-900 text-white',
  optional: 'bg-zinc-100 text-zinc-500',
  share: 'bg-zinc-100 text-zinc-400',
};

export default function Sidebar({
  attendees,
  started,
  onStart,
}: {
  attendees: Attendee[];
  started: boolean;
  onStart: () => void;
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
      {/* 만들기 버튼은 캘린더 앱의 관례대로 사이드바 최상단에 둔다 */}
      <div className="p-3 pb-0">
        <button
          onClick={onStart}
          disabled={started}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors ${
            started
              ? 'cursor-default bg-zinc-100 text-zinc-300'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
        >
          <span className="text-base leading-none">+</span> 회의 만들기
        </button>
      </div>

      {/* 캘린더가 기본 화면이고, 조율은 회의를 만들면 생기는 상태다 */}
      <nav className="border-b border-zinc-100 p-3">
        {[
          { label: '내 캘린더', active: !started },
          { label: '조율 중인 회의', active: started, badge: started ? 1 : 0 },
          { label: '회의실 예약', active: false },
          { label: '팀 멤버', active: false },
        ].map((item) => (
          <div
            key={item.label}
            className={`mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              item.active ? 'bg-zinc-100 font-semibold text-zinc-900' : 'text-zinc-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${item.active ? 'bg-zinc-900' : 'bg-zinc-300'}`}
            />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded bg-zinc-900 px-1.5 text-[10px] font-semibold text-white">
                {item.badge}
              </span>
            ) : null}
          </div>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        {!started ? (
          <p className="rounded-lg bg-zinc-50 px-3 py-2.5 text-xs leading-relaxed text-zinc-400">
            조율 중인 회의가 없어요. 새 회의를 만들면 참석자가 여기에 표시돼요.
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400">
              이번 회의 참석자
            </p>
            <ul className="space-y-1">
          {attendees.map((a) => (
            <li key={a.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                {a.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-zinc-800">
                  {a.name} <span className="font-normal text-zinc-400">{a.title}</span>
                </p>
              </div>
              {a.isOrganizer ? (
                <span className="shrink-0 rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
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
          </>
        )}
      </div>

      {started && (
        <div className="border-t border-zinc-100 p-4">
          <p className="text-xs leading-relaxed text-zinc-400">
            필수 참석자가 모두 가능한 시간을 기준으로 회의를 조율하고 있어요.
          </p>
        </div>
      )}
    </aside>
  );
}
