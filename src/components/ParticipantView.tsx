import { useEffect, useState } from 'react';
import type { CandidateSlot } from '../types';
import { jungResponse, meetingInfo, weekDays } from '../data/mockData';

const START = 9;
const END = 18;
const HOURS = Array.from({ length: END - START }, (_, i) => START + i);
const DAY_NAMES = ['월요일', '화요일', '수요일', '목요일', '금요일'];

// 정하늘 캘린더에 이미 있는 일정 — 탭할 필요 없이 미리 반영된 상태
const DISABLED_DAYS = [4]; // 금요일 연차
const JUNG_BUSY: Record<number, number[]> = { 0: [10], 2: [10] };

type Mark = 'no' | 'avoid';

interface Props {
  proposed: CandidateSlot;
  onComplete: (answer: 'ok' | 'busy') => void;
  onReturn: () => void;
}

export default function ParticipantView({ proposed, onComplete, onReturn }: Props) {
  const [phase, setPhase] = useState<'respond' | 'done'>('respond');
  const [answer, setAnswer] = useState<'ok' | 'busy' | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [selectedAlts, setSelectedAlts] = useState<string[]>([]);
  // 드래그로 칠하는 중일 때의 값 (null = 지우는 중)
  const [paint, setPaint] = useState<Mark | null | undefined>(undefined);

  useEffect(() => {
    const up = () => setPaint(undefined);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const cellKey = (day: number, hour: number) => `${day}-${hour}`;
  const isBusy = (day: number, hour: number) =>
    DISABLED_DAYS.includes(day) || (JUNG_BUSY[day] ?? []).includes(hour);

  const applyMark = (day: number, hour: number, val: Mark | null) => {
    if (isBusy(day, hour)) return;
    setMarks((prev) => {
      const next = { ...prev };
      if (val) next[cellKey(day, hour)] = val;
      else delete next[cellKey(day, hour)];
      return next;
    });
  };

  // 셀을 누르면 없음 → 안 돼요 → 피하고 싶어요 → 해제 순으로 바뀌고,
  // 누른 채로 드래그하면 같은 상태로 이어서 칠해진다.
  const startPaint = (day: number, hour: number) => {
    if (isBusy(day, hour)) return;
    const cur = marks[cellKey(day, hour)];
    const next: Mark | null = cur === undefined ? 'no' : cur === 'no' ? 'avoid' : null;
    applyMark(day, hour, next);
    setPaint(next);
  };

  const dragPaint = (day: number, hour: number) => {
    if (paint === undefined) return;
    applyMark(day, hour, paint);
  };

  // 요일 헤더 탭: 하루 전체를 안 돼요 → 피하고 싶어요 → 해제 순으로 순환
  const cycleDay = (day: number) => {
    if (DISABLED_DAYS.includes(day)) return;
    setMarks((prev) => {
      const next = { ...prev };
      const free = HOURS.filter((h) => !isBusy(day, h));
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

  const toggleAlt = (id: string) => {
    setSelectedAlts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const summarizeDays = (type: Mark) =>
    DAY_NAMES.map((name, day) => {
      const count = HOURS.filter((h) => marks[cellKey(day, h)] === type).length;
      const free = HOURS.filter((h) => !isBusy(day, h)).length;
      if (count === 0) return null;
      return count === free ? `${name} 하루 종일` : `${name} ${count}개 시간대`;
    }).filter(Boolean) as string[];

  const send = () => {
    if (!answer) return;
    onComplete(answer);
    setPhase('done');
  };

  const noSummary = summarizeDays('no');
  const avoidSummary = summarizeDays('avoid');
  const altLabels = jungResponse.alternatives
    .filter((a) => selectedAlts.includes(a.id))
    .map((a) => a.label);

  const noStyle = {
    backgroundImage:
      'repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 5px)',
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* 참여자 화면 상단 바 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              W
            </div>
            <span className="text-[15px] font-bold text-slate-900">위클리</span>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
            참여자 화면
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onReturn}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            주최자 화면으로 돌아가기
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              정
            </div>
            <span className="text-sm font-medium text-slate-700">정하늘</span>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl px-5 py-8">
          {phase === 'respond' ? (
            <>
              {/* 제안 컨텍스트 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    유
                  </div>
                  <div>
                    <p className="text-[15px] font-bold leading-snug text-slate-900">
                      유나영님이 '{meetingInfo.title}' 시간을 제안했어요
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {meetingInfo.purpose} · {meetingInfo.duration}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-blue-50/60 px-4 py-3">
                  <p className="text-xs font-semibold text-blue-500">제안된 시간</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">{proposed.label}</p>
                </div>

                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                  캘린더 일정은 이미 반영되어 있어요. 캘린더에 없는 조건만 알려주세요.
                </p>
              </div>

              {/* 응답 선택 */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAnswer('ok')}
                  className={`rounded-2xl border-2 px-4 py-5 text-center transition-all ${
                    answer === 'ok'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <svg className="mx-auto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
                  </svg>
                  <span className="mt-2 block text-sm font-bold">참석할 수 있어요</span>
                </button>
                <button
                  onClick={() => setAnswer('busy')}
                  className={`rounded-2xl border-2 px-4 py-5 text-center transition-all ${
                    answer === 'busy'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <svg className="mx-auto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 9 6 6M15 9l-6 6" />
                  </svg>
                  <span className="mt-2 block text-sm font-bold">이 시간은 어려워요</span>
                </button>
              </div>

              {/* 어려워요 → 조건 표시 그리드 */}
              {answer === 'busy' && (
                <div
                  className="mt-4 rounded-2xl border border-slate-200 bg-white p-5"
                  style={{ animation: 'slide-down 0.3s ease-out' }}
                >
                  <p className="text-sm font-bold text-slate-800">
                    안 되는 시간과 피하고 싶은 시간을 알려주세요
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    누르거나 드래그해서 표시할 수 있어요. 요일 이름을 누르면 하루 전체가
                    선택되고, 파란 테두리 칸이 제안된 시간이에요.
                  </p>

                  {/* 범례 */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-sm bg-slate-500" style={noStyle} />
                      안 돼요 (외근·연차 등)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-sm bg-amber-200" />
                      피하고 싶어요 (점심 직후 등)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3.5 w-3.5 rounded-sm bg-slate-200" />
                      캘린더 일정
                    </span>
                  </div>

                  {/* 미니 주간 그리드 */}
                  <div className="mt-3 grid select-none grid-cols-[36px_repeat(5,1fr)] gap-x-1">
                    <div />
                    {weekDays.map((d, day) => (
                      <button
                        key={day}
                        onClick={() => cycleDay(day)}
                        disabled={DISABLED_DAYS.includes(day)}
                        className={`mb-1 rounded-md py-1 text-center text-xs font-semibold transition-colors ${
                          DISABLED_DAYS.includes(day)
                            ? 'text-slate-300'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}

                    {HOURS.map((h) => (
                      <div key={h} className="contents">
                        <div className="pr-2 pt-0.5 text-right text-[10px] text-slate-400">
                          {h}시
                        </div>
                        {weekDays.map((_, day) => {
                          const busy = isBusy(day, h);
                          const mark = marks[cellKey(day, h)];
                          const isProposed =
                            day === proposed.day && h === proposed.startHour;
                          return (
                            <button
                              key={day}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                startPaint(day, h);
                              }}
                              onMouseEnter={() => dragPaint(day, h)}
                              disabled={busy}
                              className={`mb-1 h-6 rounded-sm border transition-colors ${
                                busy
                                  ? 'border-slate-200 bg-slate-200'
                                  : mark === 'no'
                                    ? 'border-slate-500 bg-slate-500'
                                    : mark === 'avoid'
                                      ? 'border-amber-300 bg-amber-200'
                                      : isProposed
                                        ? 'border-blue-500 bg-blue-50/60 hover:bg-blue-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                              } ${isProposed ? 'ring-1 ring-inset ring-blue-500' : ''}`}
                              style={mark === 'no' && !busy ? noStyle : undefined}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    회색 칸은 캘린더에 이미 있는 일정이에요. 금요일은 연차예요.
                  </p>

                  {/* 시스템이 미리 계산한 대안 */}
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-sm font-bold text-slate-800">대신 이 시간은 어때요?</p>
                    <p className="mt-1 text-xs text-slate-400">
                      정하늘님의 캘린더를 기준으로 미리 찾아둔 시간이에요.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {jungResponse.alternatives.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => toggleAlt(a.id)}
                          className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                            selectedAlts.includes(a.id)
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {selectedAlts.includes(a.id) ? '✓ ' : ''}
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 보내기 */}
              <button
                onClick={send}
                disabled={!answer}
                className={`mt-4 w-full rounded-xl py-3.5 text-sm font-bold transition-colors ${
                  answer
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'cursor-default bg-slate-100 text-slate-400'
                }`}
              >
                응답 보내기
              </button>
            </>
          ) : (
            /* 화면 B: 응답 완료 */
            <div style={{ animation: 'slide-down 0.3s ease-out' }}>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
                  ✓
                </div>
                <p className="mt-3 text-lg font-bold text-slate-900">응답을 보냈어요</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  유나영님이 확인 후 회의가 확정되면 알려드릴게요.
                </p>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-xs font-semibold text-slate-400">내가 보낸 응답</p>
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-slate-400">제안된 시간</span>
                    <span className="text-right font-medium text-slate-700">
                      {answer === 'ok' ? '참석할 수 있어요' : '이 시간은 어려워요'}
                    </span>
                  </div>
                  {answer === 'busy' && (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0 text-slate-400">안 되는 시간</span>
                        <span className="text-right font-medium text-slate-700">
                          {noSummary.length > 0 ? noSummary.join(', ') : '없음'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0 text-slate-400">피하고 싶은 시간</span>
                        <span className="text-right font-medium text-slate-700">
                          {avoidSummary.length > 0 ? avoidSummary.join(', ') : '없음'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="shrink-0 text-slate-400">대신 가능한 시간</span>
                        <span className="text-right font-medium text-slate-700">
                          {altLabels.length > 0 ? altLabels.join(', ') : '선택 안 함'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={onReturn}
                className="mt-4 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                주최자 화면으로 돌아가기
              </button>
              <button
                onClick={() => setPhase('respond')}
                className="mt-2 w-full py-1.5 text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                응답 수정하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
