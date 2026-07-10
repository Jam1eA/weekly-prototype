import { useEffect, useState } from 'react';
import type { Attendee, CandidateSlot } from '../types';
import {
  LUNCH_END,
  LUNCH_START,
  jungBlocks,
  jungResponse,
  weekDays,
} from '../data/mockData';

const START = 9;
const END = 18;
const HOUR_PX = 58;
const HOURS = Array.from({ length: END - START }, (_, i) => START + i);
const DAY_NAMES = ['월요일', '화요일', '수요일', '목요일', '금요일'];

type Mark = 'no' | 'avoid';
type Phase = 'calendar' | 'modal' | 'editing' | 'done';

interface Props {
  proposed: CandidateSlot;
  meeting: { title: string; purpose: string };
  attendees: Attendee[];
  onComplete: (answer: 'ok' | 'busy') => void;
  onReturn: () => void;
}

const noStyle = {
  backgroundImage:
    'repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 5px)',
};

export default function ParticipantView({
  proposed,
  meeting,
  attendees,
  onComplete,
  onReturn,
}: Props) {
  const [phase, setPhase] = useState<Phase>('calendar');
  const [answer, setAnswer] = useState<'ok' | 'busy' | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [selectedAlts, setSelectedAlts] = useState<string[]>([]);
  const [paint, setPaint] = useState<Mark | null | undefined>(undefined);

  useEffect(() => {
    const up = () => setPaint(undefined);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const cellKey = (day: number, hour: number) => `${day}-${hour}`;

  // 내 캘린더에 이미 있는 일정은 다시 표시할 필요가 없다
  const blockAt = (day: number, hour: number) =>
    jungBlocks.find(
      (b) => b.day === day && hour >= b.startHour && hour < b.startHour + b.duration,
    );
  const isBusy = (day: number, hour: number) => !!blockAt(day, hour);

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

  const accept = () => {
    setAnswer('ok');
    onComplete('ok');
    setPhase('done');
  };
  const sendBusy = () => {
    setAnswer('busy');
    onComplete('busy');
    setPhase('done');
  };

  const noSummary = summarizeDays('no');
  const avoidSummary = summarizeDays('avoid');
  const altLabels = jungResponse.alternatives
    .filter((a) => selectedAlts.includes(a.id))
    .map((a) => a.label);

  const required = attendees.filter((a) => a.role === 'required');
  const optional = attendees.filter((a) => a.role === 'optional');

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
              정
            </div>
            <span className="text-sm font-medium text-zinc-700">정하늘</span>
          </div>
        </div>
      </header>

      {/* 알림 배너 — 응답 필요 / 응답 완료 */}
      {phase !== 'editing' && (
        <div
          className={`flex shrink-0 items-center gap-3 border-b px-5 py-3 ${
            phase === 'done'
              ? 'border-emerald-100 bg-emerald-50/60'
              : 'border-blue-100 bg-blue-50/60'
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              phase === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
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
                phase === 'done' ? 'text-emerald-700' : 'text-blue-700'
              }`}
            >
              {phase === 'done'
                ? '응답을 보냈어요'
                : `유나영님이 '${meeting.title}' 시간을 제안했어요`}
            </p>
            <p
              className={`text-xs ${phase === 'done' ? 'text-emerald-600/70' : 'text-blue-600/70'}`}
            >
              {phase === 'done'
                ? '유나영님이 확인 후 회의가 확정되면 알려드릴게요.'
                : '캘린더의 제안된 시간을 눌러 응답해주세요.'}
            </p>
          </div>
          {phase === 'calendar' && (
            <button
              onClick={() => setPhase('modal')}
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
            >
              응답하기
            </button>
          )}
          {phase === 'done' && (
            <button
              onClick={onReturn}
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-800"
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
              안 되는 시간과 피하고 싶은 시간을 캘린더에 표시해주세요
            </p>
            <p className="text-xs text-zinc-500">
              누르거나 드래그하면 표시돼요. 요일 이름을 누르면 하루 전체가 선택돼요. 내
              캘린더에 있는 일정은 이미 반영되어 있어요.
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

                {/* 표시 가능한 셀 (편집 모드) */}
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
                        mark === 'no'
                          ? 'bg-zinc-500'
                          : mark === 'avoid'
                            ? 'bg-amber-300'
                            : ''
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
                {jungBlocks
                  .filter((b) => b.day === day)
                  .map((b, i) => (
                    <div
                      key={`b${i}`}
                      className={`absolute inset-x-1 z-20 overflow-hidden rounded-md border-l-[3px] px-2 py-1 ${
                        b.kind === 'leave'
                          ? 'border-zinc-300 bg-zinc-100'
                          : 'border-zinc-400 bg-zinc-100'
                      }`}
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
                    onClick={() => phase === 'calendar' && setPhase('modal')}
                    className={`absolute inset-x-1 z-30 flex flex-col justify-center rounded-lg border px-2.5 text-left transition-all ${
                      phase === 'done' && answer === 'ok'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : phase === 'done'
                          ? 'border-dashed border-zinc-300 bg-white text-zinc-400'
                          : 'border-blue-500 bg-blue-500 text-white shadow-sm hover:bg-blue-600'
                    }`}
                    style={{
                      top: (proposed.startHour - START) * HOUR_PX + 2,
                      height: HOUR_PX - 4,
                    }}
                  >
                    <span className="truncate text-xs font-bold leading-tight">
                      {phase === 'done'
                        ? answer === 'ok'
                          ? '참석 예정'
                          : '응답함 · 불참'
                        : '응답 필요'}
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
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-xs font-semibold text-zinc-500">
                대신 이 시간은 어때요?{' '}
                <span className="font-normal text-zinc-400">
                  내 캘린더 기준으로 미리 찾아둔 시간이에요
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {jungResponse.alternatives.map((a) => (
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
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setPhase('modal')}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                뒤로
              </button>
              <button
                onClick={sendBusy}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
              >
                응답 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 응답 모달 */}
      {phase === 'modal' && (
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
                <p className="text-lg font-bold leading-snug text-zinc-900">
                  {meeting.title}
                </p>
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
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-zinc-400">회의실</span>
                <span className="font-medium text-zinc-800">회의실 A</span>
              </div>
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-zinc-400">주최자</span>
                <span className="font-medium text-zinc-800">유나영 기획자</span>
              </div>
              <div className="flex gap-3">
                <span className="w-16 shrink-0 text-zinc-400">참석자</span>
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-800">
                    <span className="font-medium">필수 {required.length}명</span>
                    <span className="text-zinc-400"> · {required.map((a) => a.name).join(', ')}</span>
                  </p>
                  <p className="mt-0.5 text-zinc-800">
                    <span className="font-medium">선택 {optional.length}명</span>
                    <span className="text-zinc-400"> · {optional.map((a) => a.name).join(', ')}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    정하늘님은 선택 참석자예요. 불참해도 회의는 진행돼요.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3.5 text-[13px] font-semibold text-zinc-800">
              이 시간에 참석할 수 있나요?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              캘린더 일정은 이미 반영되어 있어요. 캘린더에 없는 조건만 알려주세요.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                onClick={accept}
                className="rounded-xl border border-zinc-200 py-3.5 text-sm font-bold text-zinc-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              >
                참석할 수 있어요
              </button>
              <button
                onClick={() => setPhase('editing')}
                className="rounded-xl bg-zinc-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
              >
                이 시간은 어려워요
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              어렵다면 다음 화면에서 안 되는 시간을 표시할 수 있어요
            </p>
          </div>
        </div>
      )}

      {/* 응답 완료 요약 모달 */}
      {phase === 'done' && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-6">
          <div
            className="pointer-events-auto w-[440px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg"
            style={{ animation: 'slide-down 0.25s ease-out' }}
          >
            <p className="mb-3 text-xs font-semibold text-zinc-400">내가 보낸 응답</p>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="text-zinc-400">제안된 시간</span>
                <span className="font-medium text-zinc-800">
                  {answer === 'ok' ? '참석할 수 있어요' : '이 시간은 어려워요'}
                </span>
              </div>
              {answer === 'busy' && (
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
                  <div className="flex justify-between gap-3">
                    <span className="shrink-0 text-zinc-400">대신 가능한 시간</span>
                    <span className="text-right font-medium text-zinc-800">
                      {altLabels.length ? altLabels.join(', ') : '선택 안 함'}
                    </span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setPhase(answer === 'busy' ? 'editing' : 'modal')}
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
