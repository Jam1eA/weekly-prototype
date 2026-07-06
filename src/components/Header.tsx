export default function Header({
  hasAlert,
  onAlertClick,
}: {
  hasAlert: boolean;
  onAlertClick: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            W
          </div>
          <span className="text-[15px] font-bold text-slate-900">위클리</span>
        </div>
        <span className="h-4 w-px bg-slate-200" />
        <span className="text-sm text-slate-500">팀 일정 조율</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-400" disabled>
          ‹
        </button>
        <span className="font-semibold text-slate-800">2026년 7월 13일 – 17일</span>
        <button className="rounded-md border border-slate-200 px-2 py-1 text-slate-400" disabled>
          ›
        </button>
        <span className="ml-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
          다음 주
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={hasAlert ? onAlertClick : undefined}
          className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            hasAlert ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'text-slate-400 hover:bg-slate-100'
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
        <div className="flex -space-x-1.5">
          {['김', '박', '이', '최', '정'].map((c, i) => (
            <div
              key={i}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-slate-600"
            >
              {c}
            </div>
          ))}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          유
        </div>
      </div>
    </header>
  );
}
