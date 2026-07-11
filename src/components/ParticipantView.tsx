import { useEffect, useState } from 'react';
import type { Attendee, CandidateSlot } from '../types';
import { LUNCH_END, LUNCH_START, leeAlternatives, leeBlocks, weekDays } from '../data/mockData';

const START = 9;
const END = 18;
const HOUR_PX = 58;
const HOURS = Array.from({ length: END - START }, (_, i) => START + i);
const DAY_NAMES = ['월요일', '화요일', '수요일', '목요일', '금요일'];

type Mark = 'no' | 'avoid';
// gap: 캘린더 누락 확인 → (editing: 조건 보완) → confirm: 제안 시간 직접 확인
// → (alt: 어려울 때만 대안 제안) → done
type Phase = 'calendar' | 'gap' | 'editing' | 'confirm' | 'alt' | 'done';

export interface ParticipantDetail {
  volatile: boolean;
  no: string[];
  avoid: string[];
  alts: string[];
  confirmedAt: string;
}

interface Props {
  proposed: CandidateSlot;
  meeting: { title: string; purpose: string };
  attendees: Attendee[];
  onComplete: (answer: 'ok' | 'busy', detail: ParticipantDetail) => void;
  onReturn: () => void;
  // recheck: 확정 후 변경된 시간을 다시 확인하는 모드 (누락 보완·대안 제안 없이 바로 확인만)
  mode?: 'initial' | 'recheck';
}

const noStyle = {
  backgroundImage:
    'repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 5px)',
};

const nowLabel = () => {
  const d = new Date();
  return `오늘 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function ParticipantView({
  proposed,
  meeting,
  attendees,
  onComplete,
  onReturn,
  mode = 'initial',
}: Props) {
  const recheck = mode === 'recheck';
  const shortTime = proposed.label.replace(/ - .*$/, '');
  const [phase, setPhase] = useState<Phase>('calendar');
  const [answer, setAnswer] = useState<'ok' | 'busy' | null>(null);
  const [volatile, setVolatile] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [selectedAlts, setSelectedAlts] = useState<string[]>([]);
  const [paint, setPaint] = useState<Mark | null | undefined>(undefined);

  useEffect(() => {
    const up = () => setPaint(undefined);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const cellKey = (day: number, hour: number) => `${day}-${hour}`;
  const isBusy = (day: number, hour: number) =>
    leeBlocks.some(
      (b) => b.day === day && hour >= b.startHour && hour < b.startHour + b.duration,
    );

  const applyMark = (day: number, hour: number, val: Mark | null) => {
    if (isBusy(day, hour)) return;
    setMarks((prev) => {
      const next = { ...prev };
      if (val) next[cellKey(day, hour)] = val;
      else delete next[cellKey(day, hour)];
      return next;
    });
  };

  const startPaint = (day: number, hour: number) => {
    if (phase !== 'editing' || isBusy(day, hour)) return;
    const cur = marks[cellKey(day, hour)];
    const next: Mark | null = cur === undefined ? 'no' : cur === 'no' ? 'avoid' : null;
    applyMark(day, hour, next);
    setPaint(next);
  };

  const dragPaint = (day: number, hour: number) => {
    if (phase !== 'editing' || paint === undefined) return;
    applyMark(day, hour, paint);
  };

  const cycleDay = (day: number) => {
    if (phase !== 'editing') return;
    setMarks((prev) => {
      const next = { ...prev };
      const free = HOURS.filter((h) => !isBusy(day, h));
      if (free.length === 0) return prev;
      const values = free.map((h) => next[cellKey(day, h)]);
      const target: Mark | undefined = values.every((v) => v === 'no')
        ? 'avoid'
        : values.every((v) => v === 'avoid')
          ? undefined
          : 'no';
      free.forEach((h) => {
        if (target === undefined) delete next[cellKey(day, h)];
        else next[cellKey(day, h)] = target;
      });
      return next;
    });
  };

  const toggleAlt = (id: string) =>
    setSelectedAlts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const summarizeDays = (type: Mark) =>
    DAY_NAMES.map((name, day) => {
      const count = HOURS.filter((h) => marks[cellKey(day, h)] === type).length;
      const free = HOURS.filter((h) => !isBusy(day, h)).length;
      if (count === 0) return null;
      return count === free ? `${name} 하루 종일` : `${name} ${count}개 시간대`;
    }).filter(Boolean) as string[];

  const noSummary = summarizeDays('no');
  const avoidSummary = summarizeDays('avoid');
  const altLabels = leeAlternatives
    .filter((a) => selectedAlts.includes(a.id))
    .map((a) => a.label);
  const hasMarks = noSummary.length > 0 || avoidSummary.length > 0;

  const send = (a: 'ok' | 'busy') => {
    setAnswer(a);
    onComplete(a, {
      volatile: a === 'ok' ? volatile : false,
      no: noSummary,
      avoid: avoidSummary,
      // 대안은 제안을 거절할 때만 함께 보낸다
      alts: a === 'busy' ? altLabels : [],
      // 확인 시각은 데이터로만 저장하고 UI에는 노출하지 않는다
      confirmedAt: nowLabel(),
    });
    setPhase('done');
  };

  const requiredNames = attendees
    .filter((a) => a.role === 'required')
    .map((a) => a.name)
    .join(', ');

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 상단 바 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
              W
            </div>
            <span className="text-[15px] font-bold text-zinc-900">위클리</span>
          </div>
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-500">
            참여자 화면
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onReturn}
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600"
          >
            주최자 화면으로 돌아가기
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              L
            </div>
            <span className="text-sm font-medium text-zinc-700">이지은</span>
          </div>
        </div>
      </header>

      {/* 알림 배너 */}
      {phase !== 'editing' && (
        <div
          className={`flex shrink-0 items-center gap-3 border-b px-5 py-3 ${
            phase === 'done'
              ? 'border-emerald-100 bg-emerald-50/60'
              : 'border-[#E9F2B8] bg-[#F7FBDC]'
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              phase === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-[#F0F6C2] text-[#6f7d00]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {phase === 'done' ? (
                <path d="m5 12 5 5L20 7" />
              ) : (
                <>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </>
              )}
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[13px] font-semibold ${
                phase === 'done' ? 'text-emerald-700' : 'text-[#4f5a00]'
              }`}
            >
              {phase === 'done'
                ? '응답을 보냈어요'
                : recheck
                  ? `유나영님이 바뀐 회의 시간이 괜찮은지 물어봤어요`
                  : `유나영님이 '${meeting.title}' 시간이 괜찮은지 물어봤어요`}
            </p>
            <p
              className={`text-xs ${phase === 'done' ? 'text-emerald-600/70' : 'text-[#6f7d00]'}`}
            >
              {phase === 'done'
                ? '회의가 확정되면 알려드릴게요.'
                : recheck
                  ? `박서준님 일정 변경으로 ${shortTime}로 옮기려고 해요. 연두색 시간을 눌러주세요.`
                  : '필수 참석자라 직접 확인이 필요해요. 연두색 시간을 눌러주세요.'}
            </p>
          </div>
          {phase === 'calendar' && (
            <button
              onClick={() => setPhase(recheck ? 'confirm' : 'gap')}
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700"
            >
              확인하기
            </button>
          )}
          {phase === 'done' && (
            <button
              onClick={onReturn}
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700"
            >
              주최자 화면으로
            </button>
          )}
        </div>
      )}

      {/* 편집 모드 안내 바 */}
      {phase === 'editing' && (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-zinc-900">
              추가로 어려운 시간만 표시해주세요
            </p>
            <p className="text-xs text-zinc-500">
              누르거나 드래그로 표시해요. 요일 이름을 누르면 하루 전체가 선택돼요.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-zinc-500" style={noStyle} />
              안 돼요
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-300" />
              피하고 싶어요
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-zinc-200" />내 일정
            </span>
          </div>
        </div>
      )}

      {/* 내 캘린더 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-800">내 캘린더</h2>
            <span className="text-xs text-zinc-400">2026년 7월 13일 – 17일</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-100" />
            점심시간
          </span>
        </div>

        <div className="grid shrink-0 grid-cols-[52px_repeat(5,1fr)] border-b border-zinc-200">
          <div />
          {weekDays.map((d, day) => (
            <button
              key={day}
              onClick={() => cycleDay(day)}
              disabled={phase !== 'editing'}
              className={`border-l border-zinc-100 px-2 py-2 text-center transition-colors ${
                phase === 'editing' ? 'hover:bg-zinc-50' : 'cursor-default'
              }`}
            >
              <span className="text-xs font-semibold text-zinc-700">{d.label}</span>
              <span className="ml-1 text-xs text-zinc-400">{d.date}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 select-none overflow-y-auto">
          <div
            className="grid grid-cols-[52px_repeat(5,1fr)]"
            style={{ height: (END - START) * HOUR_PX }}
          >
            <div className="relative">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] text-zinc-400"
                  style={{ top: (h - START) * HOUR_PX }}
                >
                  {h !== START ? `${h}:00` : ''}
                </div>
              ))}
            </div>

            {[0, 1, 2, 3, 4].map((day) => (
              <div key={day} className="relative border-l border-zinc-100">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-zinc-100"
                    style={{ top: (h - START) * HOUR_PX }}
                  />
                ))}

                {/* 점심시간 */}
                <div
                  className="pointer-events-none absolute inset-x-0 bg-amber-50/70"
                  style={{
                    top: (LUNCH_START - START) * HOUR_PX,
                    height: (LUNCH_END - LUNCH_START) * HOUR_PX,
                  }}
                >
                  {day === 0 && (
                    <span className="ml-2 text-[10px] font-medium text-amber-600/80">
                      점심시간
                    </span>
                  )}
                </div>

                {/* 표시 셀 (편집 모드) */}
                {HOURS.map((h) => {
                  const busy = isBusy(day, h);
                  const mark = marks[cellKey(day, h)];
                  if (busy) return null;
                  return (
                    <div
                      key={`c${h}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        startPaint(day, h);
                      }}
                      onMouseEnter={() => dragPaint(day, h)}
                      className={`absolute inset-x-0 z-10 ${
                        phase === 'editing' ? 'cursor-pointer hover:bg-zinc-50' : ''
                      } ${
                        mark === 'no' ? 'bg-zinc-500' : mark === 'avoid' ? 'bg-amber-300' : ''
                      }`}
                      style={{
                        top: (h - START) * HOUR_PX + 1,
                        height: HOUR_PX - 2,
                        ...(mark === 'no' ? noStyle : {}),
                      }}
                    />
                  );
                })}

                {/* 내 일정 */}
                {leeBlocks
                  .filter((b) => b.day === day)
                  .map((b, i) => (
                    <div
                      key={`b${i}`}
                      className="absolute inset-x-1 z-20 overflow-hidden rounded-md border-l-[3px] border-zinc-400 bg-zinc-100 px-2 py-1"
                      style={{
                        top: (b.startHour - START) * HOUR_PX + 2,
                        height: b.duration * HOUR_PX - 4,
                      }}
                    >
                      <p className="truncate text-[11px] font-medium text-zinc-500">
                        {b.label}
                      </p>
                    </div>
                  ))}

                {/* 제안된 시간 */}
                {proposed.day === day && (
                  <button
                    onClick={() => phase === 'calendar' && setPhase(recheck ? 'confirm' : 'gap')}
                    className={`absolute inset-x-1 z-30 flex flex-col justify-center rounded-lg border px-2.5 text-left transition-all ${
                      phase === 'done' && answer === 'ok'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : phase === 'done'
                          ? 'border-dashed border-zinc-300 bg-white text-zinc-400'
                          : 'border-[#c9d631] bg-[#E1F045] text-zinc-900 shadow-sm hover:bg-[#d6e63e]'
                    }`}
                    style={{
                      top: (proposed.startHour - START) * HOUR_PX + 2,
                      height: HOUR_PX - 4,
                    }}
                  >
                    <span className="truncate text-xs font-bold leading-tight">
                      {phase === 'done'
                        ? answer === 'ok'
                          ? volatile
                            ? '가능 · 변동 있음'
                            : '참석함'
                          : '어렵다고 함'
                        : '눌러서 확인'}
                    </span>
                    <span className="truncate text-[11px] leading-tight opacity-80">
                      {meeting.title}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 편집 모드 하단 바 */}
      {phase === 'editing' && (
        <div className="shrink-0 border-t border-zinc-200 bg-white px-5 py-3">
          <div className="flex items-center justify-between gap-6">
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-zinc-400">
              표시한 시간은 응답과 함께 주최자에게 전달돼요.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setPhase('gap')}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                뒤로
              </button>
              <button
                onClick={() => setPhase('confirm')}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
              >
                입력 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1단계: 캘린더 누락 확인 */}
      {phase === 'gap' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 px-4"
          onClick={() => setPhase('calendar')}
        >
          <div
            className="w-[420px] rounded-2xl bg-white p-6 shadow-xl"
            style={{ animation: 'slide-down 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold leading-snug text-zinc-900">
              캘린더에 없는 일정이 있나요?
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
              캘린더에 등록한 일정은 반영했어요. 아직 등록 안 한 외근, 이동, 연차가 있나요?
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => setPhase('confirm')}
                className="w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
              >
                다 등록했어요
              </button>
              <button
                onClick={() => setPhase('editing')}
                className="w-full rounded-xl border border-zinc-200 py-3.5 text-sm font-bold text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              >
                더 추가할 게 있어요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2단계: 제안 시간 직접 확인 */}
      {phase === 'confirm' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 px-4"
          onClick={() => setPhase('calendar')}
        >
          <div
            className="w-[440px] rounded-2xl bg-white p-6 shadow-xl"
            style={{ animation: 'slide-down 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold leading-snug text-zinc-900">{meeting.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{meeting.purpose}</p>
              </div>
              <button
                onClick={() => setPhase('calendar')}
                className="shrink-0 text-zinc-300 transition-colors hover:text-zinc-500"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 border-y border-zinc-100 py-4 text-[13px]">
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-zinc-400">일시</span>
                <span className="font-medium text-zinc-800">{proposed.label}</span>
              </div>
              {proposed.room && (
                <div className="flex gap-3">
                  <span className="w-16 shrink-0 text-zinc-400">회의실</span>
                  <span className="font-medium text-zinc-800">
                    {proposed.room.name} · {proposed.room.place} · {proposed.room.capacity}
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-zinc-400">내 역할</span>
                <span className="font-medium text-zinc-800">
                  필수 참석자 <span className="font-normal text-zinc-400">· 직접 확인이 필요해요</span>
                </span>
              </div>
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-zinc-400">필수</span>
                <span className="text-zinc-600">{requiredNames}</span>
              </div>
              {hasMarks && (
                <div className="flex gap-3">
                  <span className="w-16 shrink-0 text-zinc-400">추가 조건</span>
                  <span className="min-w-0 flex-1 text-zinc-600">
                    {[
                      noSummary.length ? `안 돼요: ${noSummary.join(', ')}` : null,
                      avoidSummary.length ? `피하고 싶어요: ${avoidSummary.join(', ')}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-3.5 text-[13px] font-semibold text-zinc-800">
              이동 시간까지 생각했을 때, 이 시간에 올 수 있나요?
            </p>

            <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={volatile}
                onChange={(e) => setVolatile(e.target.checked)}
                className="h-4 w-4 accent-zinc-900"
              />
              <span className="text-xs text-zinc-600">일정이 변경될 가능성이 있어요</span>
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => send('ok')}
                className="rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
              >
                이 시간 괜찮아요
              </button>
              <button
                onClick={() => (recheck ? send('busy') : setPhase('alt'))}
                className="rounded-xl border border-zinc-200 py-3.5 text-sm font-bold text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              >
                이 시간은 어려워요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3단계: 어려울 때만 — 대안 제안 */}
      {phase === 'alt' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 px-4"
          onClick={() => setPhase('confirm')}
        >
          <div
            className="w-[420px] rounded-2xl bg-white p-6 shadow-xl"
            style={{ animation: 'slide-down 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold leading-snug text-zinc-900">
              대신 가능한 시간이 있나요?
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
              내 캘린더 기준으로 미리 찾은 시간이에요. 함께 보내면 유나영님이 처음부터
              다시 조율하지 않아도 돼요.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {leeAlternatives.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleAlt(a.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedAlts.includes(a.id)
                      ? 'border-zinc-900 bg-zinc-100 text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  {selectedAlts.includes(a.id) ? '✓ ' : ''}
                  {a.label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPhase('confirm')}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                뒤로
              </button>
              <button
                onClick={() => send('busy')}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
              >
                {selectedAlts.length > 0
                  ? `고른 시간과 함께 보내기`
                  : '시간 없이 보내기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 응답 완료 요약 */}
      {phase === 'done' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-6">
          <div
            className="pointer-events-auto w-[440px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg"
            style={{ animation: 'slide-down 0.25s ease-out' }}
          >
            <p className="mb-3 text-xs font-semibold text-zinc-400">내가 보낸 응답</p>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="text-zinc-400">이 시간</span>
                <span className="font-medium text-zinc-800">
                  {answer === 'ok' ? '참석할 수 있어요' : '어려워요'}
                  {answer === 'ok' && volatile ? ' · 변동 가능성 있음' : ''}
                </span>
              </div>
              {answer === 'busy' && altLabels.length > 0 && (
                <div className="flex justify-between gap-3">
                  <span className="shrink-0 text-zinc-400">대신 가능한 시간</span>
                  <span className="text-right font-medium text-zinc-800">
                    {altLabels.join(', ')}
                  </span>
                </div>
              )}
              {hasMarks && (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="shrink-0 text-zinc-400">안 되는 시간</span>
                    <span className="text-right font-medium text-zinc-800">
                      {noSummary.length ? noSummary.join(', ') : '없음'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="shrink-0 text-zinc-400">피하고 싶은 시간</span>
                    <span className="text-right font-medium text-zinc-800">
                      {avoidSummary.length ? avoidSummary.join(', ') : '없음'}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setPhase('confirm')}
              className="mt-3 w-full py-1 text-center text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600"
            >
              응답 수정하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
