import type { CandidateSlot, Step } from '../types';
import { LUNCH_END, LUNCH_START, busyBlocks, weekDays } from '../data/mockData';

const START = 9;
const END = 18;
const HOUR_PX = 58;

type OverlayStyle =
  | 'candidate'
  | 'candidateSelected'
  | 'candidateConflict'
  | 'proposed'
  | 'confirmed'
  | 'conflict'
  | 'conflictFaded'
  | 'alternative'
  | 'newConfirmed';

interface Overlay {
  key: string;
  day: number;
  startHour: number;
  label: string;
  time: string;
  sub?: string; // 가용 인원 요약 (예: 6명 모두 가능)
  style: OverlayStyle;
  candidateId?: string;
}

// 색 규칙: 확정만 진한 초록 solid, 후보/제안은 옅은 배경+테두리로 통일.
// 우측 패널의 카드 선택 표현('border-[#c9d631] ring-2 ring-[#F0F6C2]')과 같은 언어를 쓴다.
const overlayClass: Record<OverlayStyle, string> = {
  candidate:
    'border border-dashed border-[#c9d631] bg-[#F7FBDC]/70 text-[#4f5a00] hover:bg-[#F7FBDC] cursor-pointer',
  candidateSelected:
    'border-2 border-[#c9d631] bg-[#F4F9D0] text-[#4f5a00] shadow-sm cursor-pointer',
  // hard 후보: 뒤에 깔린 필수 참석자 일정이 비치도록 반투명 + 점선 경고
  candidateConflict:
    'border-2 border-dashed border-amber-400 bg-amber-100/45 text-amber-800 cursor-pointer',
  proposed: 'border-2 border-[#c9d631] bg-[#F4F9D0] text-[#4f5a00] shadow-sm',
  confirmed: 'border border-emerald-500 bg-emerald-500 text-white shadow-sm',
  conflict: 'border border-red-400 bg-red-50 text-red-600',
  conflictFaded: 'border border-dashed border-red-300 bg-red-50/50 text-red-400',
  alternative: 'border border-dashed border-emerald-500 bg-emerald-50/80 text-emerald-700',
  newConfirmed: 'border border-emerald-500 bg-emerald-500 text-white shadow-sm',
};

function buildOverlays(
  step: Step,
  started: boolean,
  candidates: CandidateSlot[],
  selectedId: string,
  proposed: CandidateSlot,
  alternatives: CandidateSlot[],
): Overlay[] {
  const time = (s: CandidateSlot) =>
    `${String(s.startHour).padStart(2, '0')}:00`;

  if ((started && step === 0) || step === 3 || step === 4) {
    return candidates.map((c, i) => ({
      key: c.id,
      day: c.day,
      startHour: c.startHour,
      label: `후보 ${i + 1}`,
      time: time(c),
      sub: c.avail,
      // hard 후보는 뒤 일정이 비치는 반투명 스타일로 — 필수 충돌을 가리지 않는다
      style:
        c.recommend === 'hard'
          ? 'candidateConflict'
          : c.id === selectedId
            ? 'candidateSelected'
            : 'candidate',
      candidateId: c.id,
    })) as Overlay[];
  }
  if (step === 5 || step === 6) {
    return [
      {
        key: 'p',
        day: proposed.day,
        startHour: proposed.startHour,
        label: '확인 요청 중',
        time: time(proposed),
        style: 'proposed',
      },
    ];
  }
  if (step === 7) {
    return [
      {
        key: 'p',
        day: proposed.day,
        startHour: proposed.startHour,
        label: '확정됨',
        time: time(proposed),
        style: 'confirmed',
      },
    ];
  }
  if (step === 8) {
    return [
      {
        key: 'p',
        day: proposed.day,
        startHour: proposed.startHour,
        label: '변경 필요',
        time: time(proposed),
        style: 'conflict',
      },
    ];
  }
  if (step === 9) {
    return [
      {
        key: 'p',
        day: proposed.day,
        startHour: proposed.startHour,
        label: '변경 필요',
        time: time(proposed),
        style: 'conflict',
      },
      ...alternatives.map((a) => ({
        key: a.id,
        day: a.day,
        startHour: a.startHour,
        label: '대체 후보',
        time: time(a),
        style: 'alternative' as OverlayStyle,
      })),
    ];
  }
  if (step === 10) {
    const next = alternatives[0];
    return [
      {
        key: 'p',
        day: proposed.day,
        startHour: proposed.startHour,
        label: '변경 필요',
        time: time(proposed),
        style: 'conflictFaded',
      },
      {
        key: next.id,
        day: next.day,
        startHour: next.startHour,
        label: '확인 요청 중',
        time: time(next),
        style: 'proposed',
      },
    ];
  }
  if (step === 11) {
    const next = alternatives[0];
    return [
      {
        key: next.id,
        day: next.day,
        startHour: next.startHour,
        label: '새 확정',
        time: time(next),
        style: 'newConfirmed',
      },
    ];
  }
  return [];
}

interface Props {
  step: Step;
  started: boolean;
  candidates: CandidateSlot[];
  selectedId: string;
  proposed: CandidateSlot;
  alternatives: CandidateSlot[];
  onSelectCandidate: (id: string) => void;
}

export default function CalendarGrid({
  step,
  started,
  candidates,
  selectedId,
  proposed,
  alternatives,
  onSelectCandidate,
}: Props) {
  const hours = Array.from({ length: END - START }, (_, i) => START + i);
  const overlays = buildOverlays(step, started, candidates, selectedId, proposed, alternatives);

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      {/* 캘린더 상단 바 */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-2.5">
        {/* 블록마다 상태 라벨이 붙어 있어 별도 범례는 두지 않는다 */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-zinc-800">
            {started ? '다음 주 팀 캘린더' : '내 캘린더'}
          </h2>
          {(!started || step === 0) && (
            <span className="text-xs text-zinc-400">
              {!started
                ? '회의를 만들면 참석자의 일정을 함께 볼 수 있어요'
                : '조건을 바꾸는 동안 후보 시간이 바로 갱신돼요'}
            </span>
          )}
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid shrink-0 grid-cols-[52px_repeat(5,1fr)] border-b border-zinc-200">
        <div />
        {weekDays.map((d, i) => (
          <div key={i} className="border-l border-zinc-100 px-2 py-2 text-center">
            <span className="text-xs font-semibold text-zinc-700">{d.label}</span>
            <span className="ml-1 text-xs text-zinc-400">{d.date}</span>
          </div>
        ))}
      </div>

      {/* 시간 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="grid grid-cols-[52px_repeat(5,1fr)]"
          style={{ height: (END - START) * HOUR_PX }}
        >
          {/* 시간 라벨 */}
          <div className="relative">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-zinc-400"
                style={{ top: (h - START) * HOUR_PX }}
              >
                {h !== START ? `${h}:00` : ''}
              </div>
            ))}
          </div>

          {/* 요일 컬럼 */}
          {[0, 1, 2, 3, 4].map((day) => (
            <div key={day} className="relative border-l border-zinc-100">
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-zinc-100"
                  style={{ top: (h - START) * HOUR_PX }}
                />
              ))}

              {/* 점심시간 — 피하고 싶은 시간과 같은 앰버 색 언어 */}
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

              {/* 기존 일정 */}
              {busyBlocks
                .filter((b) => b.day === day)
                // 회의를 만들기 시작하면 후보와 함께 팀 일정도 바로 보인다
                .filter((b) => started || step > 0 || b.mine)
                .filter(
                  (b) =>
                    !b.stage ||
                    (b.stage === 'pre' && step < 8) ||
                    (b.stage === 'post' && step >= 8),
                )
                .map((b, i) =>
                  b.kind === 'tentative' ? (
                    <div
                      key={`b${i}`}
                      className="absolute inset-x-1 z-0 rounded-md border border-dashed border-amber-200/80 bg-amber-50/30 px-1.5 py-1.5"
                      style={{
                        top: (b.startHour - START) * HOUR_PX + 2,
                        height: b.duration * HOUR_PX - 4,
                      }}
                    >
                      <span className="inline-block max-w-full truncate rounded bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        {b.label}
                      </span>
                    </div>
                  ) : b.kind === 'leave' ? (
                    <div
                      key={`b${i}`}
                      className="absolute inset-x-1 z-0 rounded-md bg-zinc-50 px-2 py-1.5"
                      style={{
                        top: (b.startHour - START) * HOUR_PX + 2,
                        height: b.duration * HOUR_PX - 4,
                        backgroundImage:
                          'repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(148,163,184,0.12) 6px, rgba(148,163,184,0.12) 12px)',
                      }}
                    >
                      <p className="text-[11px] font-medium text-zinc-400">{b.label}</p>
                    </div>
                  ) : (
                    <div
                      key={`b${i}`}
                      title={b.names ? `일정 있음: ${b.names.join(', ')}` : undefined}
                      className={`absolute z-10 overflow-hidden rounded-md border-l-[3px] px-2 py-1 ${
                        b.kind === 'out'
                          ? 'border-amber-400 bg-amber-50'
                          : b.count
                            ? 'border-zinc-400 bg-zinc-200/80'
                            : 'border-zinc-300 bg-zinc-100'
                      }`}
                      style={{
                        top: (b.startHour - START) * HOUR_PX + 2,
                        height: b.duration * HOUR_PX - 4,
                        left: b.col === 1 ? 'calc(50% + 2px)' : 4,
                        right: b.col === 0 ? 'calc(50% + 2px)' : 4,
                      }}
                    >
                      <p
                        className={`truncate text-[11px] ${
                          b.kind === 'out'
                            ? 'font-medium text-amber-700'
                            : b.count
                              ? 'font-semibold text-zinc-600'
                              : 'font-medium text-zinc-500'
                        }`}
                      >
                        {b.label}
                      </p>
                      {b.count && b.duration >= 1 && (
                        <p className="truncate text-[10px] text-zinc-400">
                          자세한 내용은 비공개
                        </p>
                      )}
                    </div>
                  ),
                )}

              {/* 조율 상태 블록 */}
              {overlays
                .filter((o) => o.day === day)
                .map((o) => (
                  <div
                    key={o.key}
                    onClick={
                      o.candidateId ? () => onSelectCandidate(o.candidateId!) : undefined
                    }
                    className={`absolute inset-x-1 z-20 flex flex-col justify-center rounded-lg px-2.5 transition-all ${overlayClass[o.style]}`}
                    style={{
                      top: (o.startHour - START) * HOUR_PX + 2,
                      height: HOUR_PX - 4,
                    }}
                  >
                    <p className="truncate text-xs font-bold leading-tight">{o.label}</p>
                    <p className="truncate text-[11px] leading-tight opacity-80">
                      {o.sub ? `${o.time} · ${o.sub}` : `${o.time} · 1시간`}
                    </p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
