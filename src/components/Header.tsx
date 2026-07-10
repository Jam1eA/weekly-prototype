import type { Attendee } from '../types';

export default function Header({
  hasAlert,
  onAlertClick,
  started,
  attendees,
}: {
  hasAlert: boolean;
  onAlertClick: () => void;
  started: boolean;
  attendees: Attendee[];
}) {
  // 이번 회의 참석자 아바타 — 회의를 만든 뒤에만 표시 (주최자 제외)
  const others = attendees.filter((a) => !a.isOrganizer);
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
          W
        </div>
        <span className="text-[15px] font-bold text-zinc-900">위클리</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-400" disabled>
          ‹
        </button>
        <span className="font-semibold text-zinc-800">2026년 7월 13일 – 17일</span>
        <button className="rounded-md border border-zinc-200 px-2 py-1 text-zinc-400" disabled>
          ›
        </button>
        <span className="ml-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
          다음 주
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={hasAlert ? onAlertClick : undefined}
          className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            hasAlert ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'text-zinc-400 hover:bg-zinc-100'
          }`}
          aria-label="알림"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {hasAlert && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
        {started && (
          <div className="flex -space-x-1.5">
            {others.slice(0, 5).map((a) => (
              <div
                key={a.id}
                title={`${a.name} ${a.title}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[11px] font-semibold text-zinc-600"
              >
                {a.name[0]}
              </div>
            ))}
            {others.length > 5 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[10px] font-semibold text-zinc-500">
                +{others.length - 5}
              </div>
            )}
          </div>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
          유
        </div>
      </div>
    </header>
  );
}
