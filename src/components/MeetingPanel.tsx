import { useEffect, useState } from 'react';
import type { Attendee, CandidateSlot, Role, Step } from '../types';
import {
  directoryExtras,
  initialAttendees,
  meetingInfo,
  roleDescriptions,
} from '../data/mockData';
import StatusBadge from './StatusBadge';
import ConfidenceBadge from './ConfidenceBadge';
import AttendeeCard from './AttendeeCard';
import CandidateCard from './CandidateCard';

/* ---------- 공용 소형 컴포넌트 ---------- */

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold leading-snug text-zinc-900">{children}</h2>;
}

function PanelDesc({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{children}</p>;
}

function Card({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'blue' | 'green' | 'red' | 'amber';
  children: React.ReactNode;
}) {
  const tones = {
    default: 'border-zinc-200 bg-white',
    blue: 'border-zinc-200 bg-zinc-50',
    green: 'border-emerald-100 bg-emerald-50/60',
    red: 'border-red-100 bg-red-50/60',
    amber: 'border-amber-100 bg-amber-50/60',
  };
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}>{children}</div>;
}

function CheckItem({ children, ok = true }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-relaxed text-zinc-600">
      <span
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
        }`}
      >
        {ok ? '✓' : '!'}
      </span>
      <span>{children}</span>
    </li>
  );
}

function ResponseRow({
  name,
  title,
  status,
  tone,
  note,
  action,
}: {
  name: string;
  title: string;
  status: string;
  tone: 'ok' | 'no' | 'neutral';
  note?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  const toneClass = {
    ok: 'bg-emerald-50 text-emerald-600',
    no: 'bg-zinc-100 text-zinc-500',
    neutral: 'bg-zinc-100 text-zinc-600',
  }[tone];
  return (
    <div className="border-b border-zinc-100 py-2 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-zinc-800">
          {name} <span className="font-normal text-zinc-400">{title}</span>
        </p>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${toneClass}`}>
          {status}
        </span>
      </div>
      {note && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{note}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1.5 text-xs font-semibold text-zinc-900 underline-offset-2 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4 text-xs font-semibold tracking-wide text-zinc-400 first:mt-0">
      {children}
    </p>
  );
}

/* ---------- 메인 패널 ---------- */

interface MeetingInput {
  title: string;
  purpose: string;
}

interface Props {
  step: Step;
  jungDetail: { no: string[]; avoid: string[]; alts: string[] } | null;
  meeting: MeetingInput;
  onChangeMeeting: (m: MeetingInput) => void;
  hasAlert: boolean;
  onOpenAlert: () => void;
  jungAnswer: 'ok' | 'busy' | null;
  onEnterParticipant: () => void;
  attendees: Attendee[];
  candidates: CandidateSlot[];
  alternatives: CandidateSlot[];
  selectedId: string;
  proposed: CandidateSlot;
  onChangeRole: (id: string, role: Role) => void;
  onToggleAttendee: (id: string) => void;
  onSelectCandidate: (id: string) => void;
  onNext: (step: Step) => void;
  onReset: () => void;
}

export default function MeetingPanel({
  step,
  jungDetail,
  meeting,
  onChangeMeeting,
  hasAlert,
  onOpenAlert,
  jungAnswer,
  onEnterParticipant,
  attendees,
  candidates,
  alternatives,
  selectedId,
  proposed,
  onChangeRole,
  onToggleAttendee,
  onSelectCandidate,
  onNext,
  onReset,
}: Props) {
  // Step 0(회의 만들기)의 입력 상태
  const [durationOpt, setDurationOpt] = useState('1시간');
  const [periodOpt, setPeriodOpt] = useState('다음 주');
  const [query, setQuery] = useState('');
  // Step 4: 제안을 보내기 전 확인 모달
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Step 5: 미응답자에게 리마인드 발송 (리서치: 응답 지연 시 멘션·전화로 쫓아다님)
  const [reminded, setReminded] = useState(false);
  const fullDirectory = [...initialAttendees, ...directoryExtras].filter(
    (a) => !a.isOrganizer,
  );
  const requiredCount = attendees.filter((a) => a.role === 'required').length;
  const optionalCount = attendees.filter((a) => a.role === 'optional').length;
  const shareCount = attendees.filter((a) => a.role === 'share').length;

  const selected = candidates.find((c) => c.id === selectedId) ?? candidates[0];
  const proposedShort = proposed.label.replace(/ - .*$/, ''); // 예: 화요일 14:00
  const nextSlot = alternatives[0];
  const jungShared = attendees.find((a) => a.id === 'jung')?.role === 'share';
  const jungResponded = jungAnswer !== null;

  // Step 5: 주최자를 제외한 5명 중 4명은 자동으로 응답이 도착하고,
  // 정하늘은 참여자 응답 화면에서 직접 응답해야 모인다.
  const hasJung = attendees.some((a) => a.id === 'jung');
  const RESPONDERS = attendees.filter((a) => !a.isOrganizer).length;
  const AUTO_RESPONDERS = RESPONDERS - (hasJung ? 1 : 0);
  const requiredAuto = attendees.filter(
    (a) => !a.isOrganizer && a.id !== 'jung' && a.role === 'required',
  ).length;
  const requiredTotal = attendees.filter(
    (a) => !a.isOrganizer && a.role === 'required',
  ).length;
  const [autoCount, setAutoCount] = useState(0);
  useEffect(() => {
    if (step !== 5) return;
    // 참여자 화면을 다녀온 뒤에는 이미 모인 응답을 그대로 보여준다
    if (jungResponded) {
      setAutoCount(AUTO_RESPONDERS);
      return;
    }
    setAutoCount(0);
    const iv = setInterval(() => {
      setAutoCount((c) => (c >= AUTO_RESPONDERS ? c : c + 1));
    }, 850);
    return () => clearInterval(iv);
  }, [step, AUTO_RESPONDERS, jungResponded]);
  const respondedCount = Math.min(autoCount, AUTO_RESPONDERS) + (jungResponded ? 1 : 0);
  const allResponded = respondedCount >= RESPONDERS;
  const waitingJung = hasJung && autoCount >= AUTO_RESPONDERS && !jungResponded;
  const requiredResponded = Math.min(autoCount, requiredAuto);

  // Step 5 응답 현황: 주최자를 제외한 참석자별 응답 상태
  const nonOrganizer = attendees.filter((a) => !a.isOrganizer);
  const autoList = nonOrganizer.filter((a) => a.id !== 'jung');
  const respStatusOf = (a: Attendee): '가능' | '불참' | '대기 중' => {
    if (a.id === 'jung') {
      if (!jungResponded) return '대기 중';
      return jungAnswer === 'ok' ? '가능' : '불참';
    }
    return autoList.indexOf(a) < autoCount ? '가능' : '대기 중';
  };

  // 응답 목록은 실제 참석자 명단에서 생성 (회의 만들기에서 바뀐 명단이 그대로 반영)
  const requiredAtt = attendees.filter((a) => a.role === 'required');
  const optionalAtt = attendees.filter((a) => a.role === 'optional');
  const shareAtt = attendees.filter((a) => a.role === 'share');

  // 정하늘 응답 요약은 참여자가 실제로 표시한 내용에서만 만든다 (시스템이 지어내지 않는다)
  const jungResponseSummary = (() => {
    if (!jungDetail) return null;
    const parts: string[] = [];
    if (jungDetail.no.length) parts.push(`${jungDetail.no.join(', ')} 불가`);
    if (jungDetail.avoid.length) parts.push(`${jungDetail.avoid.join(', ')} 피하고 싶음`);
    if (parts.length === 0) parts.push('제안된 시간이 어렵다고 응답');
    if (jungDetail.alts.length) parts.push(`대신 ${jungDetail.alts.join(', ')}`);
    return parts.join(' · ');
  })();

  // 확정 요약에서 정하늘의 상태를 실제 응답/전환 여부에 맞게 표현
  const jungSummaryLine =
    jungAnswer === 'ok'
      ? '선택 참석자 2명 모두 참석'
      : jungShared
        ? '선택 참석자 1명 참석 · 1명 회의록 공유'
        : '선택 참석자 1명 참석 · 1명 불참 (회의 진행 가능)';

  /* 단계별 본문 + CTA 정의 */
  let body: React.ReactNode = null;
  let cta:
    | { label: string; onClick: () => void; tone?: 'blue' | 'green'; disabled?: boolean }
    | null = null;
  let secondary: { label: string; onClick: () => void } | null = null;
  let backButton: React.ReactNode = null;

  switch (step) {
    case 0: {
      const results = fullDirectory.filter(
        (p) =>
          query.trim() === '' ||
          p.name.includes(query.trim()) ||
          p.title.includes(query.trim()) ||
          p.description.includes(query.trim()),
      );
      const isSelected = (id: string) => attendees.some((a) => a.id === id);

      body = (
        <>
          <PanelTitle>회의 만들기</PanelTitle>
          <PanelDesc>회의 조건을 정하고, 함께할 사람을 선택하세요.</PanelDesc>

          <div className="mt-4 space-y-3">
            <Card>
              <p className="mb-1.5 text-xs font-semibold text-zinc-400">회의명</p>
              <input
                value={meeting.title}
                onChange={(e) => onChangeMeeting({ ...meeting, title: e.target.value })}
                placeholder="예: 프로젝트 요구사항 정리 회의"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] font-medium text-zinc-800 placeholder:text-zinc-300 focus:border-zinc-800 focus:outline-none"
              />

              <p className="mb-1.5 mt-3.5 text-xs font-semibold text-zinc-400">
                회의 목적 · 안내
              </p>
              <textarea
                value={meeting.purpose}
                onChange={(e) => onChangeMeeting({ ...meeting, purpose: e.target.value })}
                placeholder="참석자에게 함께 전달할 내용을 적어주세요"
                rows={2}
                className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 placeholder:text-zinc-300 focus:border-zinc-800 focus:outline-none"
              />

              <p className="mb-1.5 mt-3.5 text-xs font-semibold text-zinc-400">회의 길이</p>
              <select
                value={durationOpt}
                onChange={(e) => setDurationOpt(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] font-medium text-zinc-800 focus:border-zinc-800 focus:outline-none"
              >
                {['30분', '1시간', '1시간 30분', '2시간', '2시간 30분', '3시간'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <p className="mb-1.5 mt-3.5 text-xs font-semibold text-zinc-400">기간</p>
              <div className="flex rounded-lg bg-zinc-100 p-0.5">
                {['이번 주', '다음 주', '직접 선택'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setPeriodOpt(d)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                      periodOpt === d
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {periodOpt === '다음 주' && (
                <p className="mt-1.5 text-xs text-zinc-400">7월 13일 – 7월 17일에서 시간을 찾아요.</p>
              )}
            </Card>

            <Card>
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-xs font-semibold text-zinc-400">
                  참석자 · 나 포함 {attendees.length}명
                </p>
                <p className="text-xs text-zinc-400">
                  필수 {requiredCount} · 선택 {optionalCount}
                  {shareCount > 0 ? ` · 공유 ${shareCount}` : ''}
                </p>
              </div>

              <div className="divide-y divide-zinc-50">
                {attendees.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                      {a.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-zinc-800">
                        {a.name}{' '}
                        <span className="font-normal text-zinc-400">{a.title}</span>
                      </p>
                    </div>
                    {a.isOrganizer ? (
                      <span className="shrink-0 rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold text-white">
                        주최자 · 필수
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            onChangeRole(
                              a.id,
                              a.role === 'required'
                                ? 'optional'
                                : a.role === 'optional'
                                  ? 'share'
                                  : 'required',
                            )
                          }
                          className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                            a.role === 'required'
                              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                              : a.role === 'optional'
                                ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                          }`}
                        >
                          {a.role === 'required' ? '필수' : a.role === 'optional' ? '선택' : '공유'}
                        </button>
                        <button
                          onClick={() => onToggleAttendee(a.id)}
                          className="shrink-0 px-1 text-zinc-300 transition-colors hover:text-zinc-500"
                          aria-label={`${a.name} 제외`}
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500">
                최근 '프로젝트' 회의의 구성을 역할과 함께 불러왔어요. 새로 추가한 사람은
                필수로 들어오고, 역할 배지를 누르면 필수 → 선택 → 공유로 바뀌어요.
              </p>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름, 직무, 팀으로 검색"
                className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-800 placeholder:text-zinc-300 focus:border-zinc-800 focus:outline-none"
              />
              <div className="mt-2 max-h-56 divide-y divide-zinc-50 overflow-y-auto">
                {results.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                      {p.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-zinc-800">
                        {p.name} <span className="font-normal text-zinc-400">{p.title}</span>
                      </p>
                      <p className="truncate text-xs text-zinc-400">{p.description}</p>
                    </div>
                    <button
                      onClick={() => onToggleAttendee(p.id)}
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                        isSelected(p.id)
                          ? 'text-zinc-400 hover:text-zinc-600'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isSelected(p.id) ? '✓ 추가됨' : '+ 추가'}
                    </button>
                  </div>
                ))}
                {results.length === 0 && (
                  <p className="py-3 text-center text-xs text-zinc-400">
                    검색 결과가 없어요.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      );
      cta = {
        label: '참석 구성 확인하기',
        onClick: () => onNext(2),
        disabled: attendees.length < 2 || meeting.title.trim() === '',
      };
      break;
    }

    case 2:
      body = (
        <>
          <PanelTitle>참석 구성 확인</PanelTitle>
          <PanelDesc>
            꼭 참석해야 할 사람이 맞는지 확인하세요. 이 구성이 곧 회의 성립 조건이 돼요.
          </PanelDesc>

          <div className="mt-3 rounded-xl bg-zinc-50 px-3.5 py-2.5">
            <p className="truncate text-[13px] font-semibold text-zinc-800">
              {meeting.title}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {meetingInfo.duration} · {meetingInfo.period}
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {(
              [
                { role: 'required', label: '필수' },
                { role: 'optional', label: '선택' },
                { role: 'share', label: '공유' },
              ] as { role: Role; label: string }[]
            ).map(({ role, label }) => {
              const group = attendees.filter((a) => a.role === role);
              return (
                <div key={role}>
                  <div className="mb-1.5 flex items-baseline gap-2 px-1">
                    <p className="text-sm font-bold text-zinc-800">
                      {label} <span className="text-zinc-900">{group.length}</span>
                    </p>
                    <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                      {roleDescriptions[role]}
                    </p>
                  </div>
                  {group.length > 0 ? (
                    <div className="space-y-2">
                      {group.map((a) => (
                        <AttendeeCard key={a.id} attendee={a} onChangeRole={onChangeRole} />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-300">
                      역할을 바꾸면 카드가 이 칸으로 옮겨져요
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <Card tone="blue">
            <p className="text-[13px] font-medium text-zinc-700">
              {[
                `필수 ${requiredCount}명 (주최자 포함)`,
                `선택 ${optionalCount}명`,
                shareCount > 0 ? `공유 ${shareCount}명` : null,
              ]
                .filter(Boolean)
                .join(', ')}
              으로 회의 시간을 찾을게요.
            </p>
          </Card>
        </>
      );
      cta = { label: '후보 시간 비교하기', onClick: () => onNext(3) };
      break;

    case 3:
      body = (
        <>
          <PanelTitle>후보 시간 비교</PanelTitle>
          <PanelDesc>
            비어 있는 시간이 아니라, 확정 후 다시 조율하게 만들 원인이 없는 시간을 찾아요.
          </PanelDesc>

          <p className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-xs leading-relaxed text-zinc-500">
            다음 주에서 회의를 잡을 수 있는 시간 중 조건이 잘 맞는 순서예요. 참석 가능
            여부는 아직 캘린더 기준이라, 제안을 보내면 각자의 응답으로 확정돼요.
          </p>

          <div className="mt-3 space-y-3">
            {candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                selected={c.id === selectedId}
                onSelect={() => onSelectCandidate(c.id)}
                onDetail={() => {
                  onSelectCandidate(c.id);
                  onNext(4);
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-zinc-400">
            후보를 누르면 캘린더에서 해당 시간이 강조돼요.
          </p>
        </>
      );
      break;

    case 4:
      backButton = (
        <button
          onClick={() => onNext(3)}
          className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600"
        >
          ← 뒤로가기
        </button>
      );
      body = (
        <>
          <div className="flex items-center justify-between gap-2">
            <PanelTitle>{selected.label}</PanelTitle>
          </div>
          <div className="mt-2">
            <ConfidenceBadge confidence={selected.confidence} />
          </div>

          {/* 참석자별 가능 여부 — 누가 되고 안 되는지가 먼저 보이게 */}
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3.5">
            <div className="flex items-start justify-between">
              {attendees.map((a) => {
                const st = selected.attendeeStatus?.[a.id];
                return (
                  <div key={a.id} className="flex w-12 flex-col items-center gap-1">
                    <div
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                        st === 'no'
                          ? 'bg-zinc-50 text-zinc-300'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {a.name[0]}
                      <span
                        title={
                          st === 'unsure' ? '참석 여부가 아직 확실하지 않아요' : undefined
                        }
                        className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white ${
                          st === 'no'
                            ? 'bg-red-500'
                            : st === 'unsure' || st === 'avoid'
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                        }`}
                      >
                        {st === 'no' ? '×' : st === 'unsure' ? '?' : st === 'avoid' ? '!' : '✓'}
                      </span>
                    </div>
                    <p
                      className={`max-w-full truncate text-[10px] ${
                        st === 'no' ? 'text-zinc-300 line-through' : 'text-zinc-500'
                      }`}
                    >
                      {a.name}
                    </p>
                  </div>
                );
              })}
            </div>
            {selected.availabilityText && (
              <p className="mt-2.5 border-t border-zinc-100 pt-2 text-xs text-zinc-500">
                {selected.availabilityText}
              </p>
            )}
          </div>

          <p className="mb-2 mt-5 text-sm font-bold text-zinc-800">추천 이유</p>
          <Card>
            <ul className="space-y-2">
              {selected.reasons.map((r, i) => (
                <CheckItem key={i} ok={!r.startsWith('다만') && !r.startsWith('꼭 참석해야 할 사람 중')}>
                  {r}
                </CheckItem>
              ))}
            </ul>
          </Card>

          {selected.comparison && (
            <>
              <p className="mb-2 mt-5 text-sm font-bold text-zinc-800">
                다른 후보와 비교하면
              </p>
              <Card>
                <p className="text-[13px] leading-relaxed text-zinc-600">
                  {selected.comparison}
                </p>
              </Card>
            </>
          )}

          <div className="mt-3">
            <Card tone={selected.confidence === 'high' ? 'blue' : 'amber'}>
              <p className="text-[13px] leading-relaxed text-zinc-700">{selected.summary}</p>
            </Card>
          </div>
        </>
      );
      cta = { label: '이 시간 제안하기', onClick: () => setConfirmOpen(true) };
      break;

    case 5:
      body = (
        <>
          <PanelTitle>후보 시간을 보냈어요</PanelTitle>
          <PanelDesc>
            아직 회의가 확정된 상태는 아니에요. 꼭 참석해야 할 사람이 모두 가능한지 확인한
            뒤 확정할 수 있어요.
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card>
              <p className="mb-1 text-xs font-semibold text-zinc-400">제안한 시간</p>
              <p className="text-base font-bold text-zinc-900">{proposed.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{meeting.title}</p>
            </Card>

            <Card tone="blue">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-zinc-700">
                  {allResponded
                    ? '모든 참석자가 응답했어요'
                    : waitingJung
                      ? '정하늘님의 응답을 기다리고 있어요'
                      : '응답을 모으고 있어요'}
                </p>
                <span className="text-xs font-bold text-blue-600">
                  {respondedCount}/{RESPONDERS}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(respondedCount / RESPONDERS) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {allResponded
                  ? '이제 회의 확정 여부를 확인할 수 있어요.'
                  : waitingJung
                    ? '정하늘님에게 응답 요청이 전달되어 있어요.'
                    : `꼭 참석해야 할 사람 ${requiredResponded}/${requiredTotal} 응답 완료`}
              </p>

              {/* 참석자별 응답 상태 */}
              <div className="mt-3 border-t border-zinc-100">
                {nonOrganizer.map((a) => {
                  const s = respStatusOf(a);
                  return (
                    <div key={a.id} className="flex items-center justify-between py-1.5">
                      <p className="text-[13px] text-zinc-700">
                        {a.name} <span className="text-zinc-400">{a.title}</span>
                      </p>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          s === '가능'
                            ? 'bg-emerald-50 text-emerald-600'
                            : s === '불참'
                              ? 'bg-zinc-100 text-zinc-500'
                              : 'border border-zinc-200 bg-white text-zinc-400'
                        }`}
                      >
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>

              {waitingJung && (
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    onClick={() => setReminded(true)}
                    disabled={reminded}
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${
                      reminded
                        ? 'cursor-default border-zinc-100 bg-zinc-50 text-zinc-400'
                        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {reminded ? '리마인드를 보냈어요' : '리마인드 보내기'}
                  </button>
                  <button
                    onClick={onEnterParticipant}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    정하늘님 화면에서 응답하기
                  </button>
                </div>
              )}
            </Card>
          </div>
        </>
      );
      cta = {
        label: allResponded ? '참석자 응답 확인하기' : '응답을 기다리는 중이에요',
        onClick: () => onNext(6),
        disabled: !allResponded,
      };
      break;

    case 6:
      body = (
        <>
          <PanelTitle>참석자 응답 확인</PanelTitle>
          <PanelDesc>
            캘린더 기준 예상이 아니라, 각자 직접 보낸 응답으로 참석 여부를 확인해요.
          </PanelDesc>

          <div className="mt-4">
            <Card>
              <GroupLabel>필수 참석자</GroupLabel>
              {requiredAtt.map((a) => (
                <ResponseRow
                  key={a.id}
                  name={a.name}
                  title={a.isOrganizer ? `${a.title} · 주최자` : a.title}
                  status={a.isOrganizer ? '참석' : '가능'}
                  tone="ok"
                />
              ))}

              {optionalAtt.length > 0 && <GroupLabel>선택 참석자</GroupLabel>}
              {optionalAtt.map((a) =>
                a.id === 'jung' && jungAnswer !== 'ok' ? (
                  <ResponseRow
                    key={a.id}
                    name={a.name}
                    title={a.title}
                    status="불참"
                    tone="no"
                    note={
                      <>
                        <span className="mr-1 rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-semibold text-zinc-500">
                          본인 응답
                        </span>
                        {jungResponseSummary ?? '제안된 시간이 어렵다고 응답'}
                        <br />
                        회의는 진행할 수 있어요. 회의록 공유 대상으로 바꿀 수 있어요.
                      </>
                    }
                    action={{
                      label: '회의록 공유 대상으로 바꾸기',
                      onClick: () => onChangeRole('jung', 'share'),
                    }}
                  />
                ) : (
                  <ResponseRow key={a.id} name={a.name} title={a.title} status="가능" tone="ok" />
                ),
              )}

              {shareAtt.length > 0 && <GroupLabel>공유 대상</GroupLabel>}
              {shareAtt.map((a) => (
                <ResponseRow
                  key={a.id}
                  name={a.name}
                  title={a.title}
                  status="회의록 공유 예정"
                  tone="neutral"
                  note={
                    a.id === 'jung'
                      ? '공유 대상으로 바꿨어요. 회의는 그대로 진행돼요.'
                      : undefined
                  }
                />
              ))}
            </Card>

            <div className="mt-3">
              <Card tone="green">
                <p className="text-[13px] font-medium leading-relaxed text-zinc-700">
                  주최자를 포함해 꼭 참석해야 할 4명이 모두 가능하고, 회의실 A도 확보되어
                  있어요.
                </p>
              </Card>
            </div>
          </div>
        </>
      );
      cta = { label: '회의 확정하기', onClick: () => onNext(7), tone: 'green' };
      secondary = { label: '다른 시간 다시 비교하기', onClick: () => onNext(3) };
      break;

    case 7:
      body = (
        <>
          <PanelTitle>다시 조율할 일 없이 확정했어요</PanelTitle>
          <PanelDesc>
            확정 전에 꼭 필요한 정보를 모두 확인했기 때문에, 이 회의는 다시 조율될
            가능성이 낮아요.
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card tone="green">
              <p className="mb-1 text-xs font-semibold text-emerald-600">확정된 시간</p>
              <p className="text-base font-bold text-zinc-900">{proposed.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{meeting.title} · 회의실 A</p>
            </Card>

            <Card>
              <p className="mb-2 text-xs font-semibold text-zinc-400">
                확정 전에 확인한 것
              </p>
              <ul className="space-y-2">
                <CheckItem>꼭 참석해야 할 사람 4명 모두 참석 응답 완료</CheckItem>
                <CheckItem>{jungSummaryLine}</CheckItem>
                <CheckItem>연차·외근 등 숨은 제약과 겹치지 않음</CheckItem>
                <CheckItem>회의실 A 예약 완료</CheckItem>
              </ul>
              <p className="mt-2.5 border-t border-zinc-100 pt-2.5 text-xs leading-relaxed text-zinc-500">
                이 항목들을 확정 전에 모두 확인해, 확정 후 다시 조율하게 만드는 원인을
                미리 없앴어요.
              </p>
            </Card>

            <p className="px-1 text-xs leading-relaxed text-zinc-400">
              참석자 캘린더에 회의 일정이 등록되었어요. 그래도 일정 변경이 생기면 알림으로
              알려드릴게요.
            </p>
          </div>
        </>
      );
      break;

    case 8:
      body = (
        <>
          <PanelTitle>확정 후 변경이 생겼어요</PanelTitle>
          <PanelDesc>
            드물지만 확정 뒤에 일정이 바뀔 수 있어요. 이럴 때 처음부터 다시 조율하지
            않도록 도와드릴게요.
          </PanelDesc>

          <div className="mt-3 space-y-3">
            <Card tone="red">
              <p className="text-[13px] font-semibold leading-relaxed text-red-600">
                꼭 참석해야 할 사람이 참석할 수 없어 기존 회의 시간을 유지하기 어려워요.
              </p>
            </Card>

            <Card>
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                  박
                </div>
                <p className="text-[13px] leading-relaxed text-zinc-700">
                  박서준 개발 리드의 외근이 화요일 오후로 확정되면서{' '}
                  <span className="font-semibold">{proposedShort}</span> 회의에 참석할 수
                  없게 되었어요.
                </p>
              </div>
            </Card>

            <p className="px-1 text-xs leading-relaxed text-zinc-400">
              이 변경은 후보 제안 중 거절이 아니라, 회의가 확정된 뒤 생긴 일정 변경이에요.
            </p>
          </div>
        </>
      );
      cta = { label: '변경된 일정 확인하기', onClick: () => onNext(9) };
      break;

    case 9:
      body = (
        <>
          <PanelTitle>변경된 일정을 확인했어요</PanelTitle>
          <PanelDesc>기존 회의 시간을 그대로 유지할 수 있는지 먼저 확인했어요.</PanelDesc>

          <div className="mt-4 space-y-3">
            <Card>
              <p className="mb-2 text-xs font-semibold text-zinc-400">
                기존 시간 · {proposed.label}
              </p>
              <ul className="space-y-2">
                <CheckItem ok={false}>꼭 참석해야 할 사람 1명이 참석할 수 없어요.</CheckItem>
                <CheckItem ok={false}>이 사람이 없으면 회의 성립 조건이 맞지 않아요.</CheckItem>
                <CheckItem ok={false}>기존 시간은 유지하기 어려워요.</CheckItem>
              </ul>
            </Card>

            <Card tone="blue">
              <p className="text-[13px] font-medium leading-relaxed text-zinc-700">
                기존 응답과 최신 캘린더 상태를 다시 확인해, 변경 제안할 수 있는 시간을
                찾았어요.
              </p>
            </Card>

            {alternatives.map((a) => (
              <CandidateCard
                key={a.id}
                candidate={a}
                selected={a.recommended === true}
                onSelect={() => {}}
              />
            ))}
          </div>
        </>
      );
      cta = { label: `수요일 15:00으로 변경 제안하기`, onClick: () => onNext(10) };
      break;

    case 10:
      body = (
        <>
          <PanelTitle>변경 제안 응답 확인</PanelTitle>
          <PanelDesc>
            {nextSlot.label.replace(/ - .*$/, '')}으로 변경 제안했어요. 꼭 참석해야 할
            사람이 모두 가능한지 확인해요.
          </PanelDesc>

          <div className="mt-4">
            <Card>
              <GroupLabel>필수 참석자</GroupLabel>
              {requiredAtt.map((a) => (
                <ResponseRow
                  key={a.id}
                  name={a.name}
                  title={a.isOrganizer ? `${a.title} · 주최자` : a.title}
                  status={a.isOrganizer ? '참석' : '가능'}
                  tone="ok"
                />
              ))}

              {optionalAtt.length > 0 && <GroupLabel>선택 참석자</GroupLabel>}
              {optionalAtt.map((a) =>
                a.id === 'jung' && jungAnswer !== 'ok' ? (
                  <ResponseRow
                    key={a.id}
                    name={a.name}
                    title={a.title}
                    status="회의록 공유로 대체"
                    tone="neutral"
                  />
                ) : (
                  <ResponseRow key={a.id} name={a.name} title={a.title} status="가능" tone="ok" />
                ),
              )}

              {shareAtt.length > 0 && <GroupLabel>공유 대상</GroupLabel>}
              {shareAtt.map((a) => (
                <ResponseRow
                  key={a.id}
                  name={a.name}
                  title={a.title}
                  status="회의록 공유 예정"
                  tone="neutral"
                />
              ))}
            </Card>

            <div className="mt-3 space-y-3">
              <Card tone="green">
                <p className="text-[13px] font-medium leading-relaxed text-zinc-700">
                  주최자를 포함해 꼭 참석해야 할 4명이 모두 가능하고, 회의실 B도 확보되어
                  있어요.
                </p>
              </Card>
              <p className="px-1 text-xs leading-relaxed text-zinc-400">
                새 시간으로 바뀌는 것이므로, 꼭 참석해야 할 사람의 응답을 다시 확인했어요.
              </p>
            </div>
          </div>
        </>
      );
      cta = { label: '변경 확정하기', onClick: () => onNext(11), tone: 'green' };
      break;

    case 11:
      body = (
        <>
          <PanelTitle>회의 시간이 다시 확정되었어요.</PanelTitle>
          <PanelDesc>
            기존 응답과 최신 일정을 확인해 처음부터 다시 조율하지 않고 변경했어요.
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card tone="green">
              <p className="mb-1 text-xs font-semibold text-emerald-600">
                변경된 회의 시간
              </p>
              <p className="text-base font-bold text-zinc-900">{nextSlot.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {meeting.title} · 회의실 B
              </p>
            </Card>

            <Card>
              <p className="mb-2 text-xs font-semibold text-zinc-400">확정 요약</p>
              <ul className="space-y-2">
                <CheckItem>꼭 참석해야 할 사람 4명 모두 참석 (주최자 포함)</CheckItem>
                <CheckItem>{jungSummaryLine}</CheckItem>
                <CheckItem>회의실 B 예약 완료</CheckItem>
                <CheckItem>미응답자 없음</CheckItem>
                <CheckItem>다시 조율할 가능성 낮음</CheckItem>
              </ul>
            </Card>
          </div>
        </>
      );
      cta = { label: '완료', onClick: onReset, tone: 'green' };
      break;
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-zinc-200 bg-zinc-50">
      {/* 패널 헤더 */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 py-3">
        <p className="text-xs font-semibold tracking-wide text-zinc-400">회의 조율</p>
        <StatusBadge step={step} />
      </div>

      {/* 변경 알림 배너 (회의 확정 후 도착) */}
      {step === 7 && hasAlert && (
        <button
          onClick={onOpenAlert}
          className="mx-4 mt-3 flex shrink-0 items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-left transition-colors hover:bg-red-100"
          style={{ animation: 'slide-down 0.35s ease-out' }}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-red-600">
              박서준님의 일정이 변경되었어요
            </span>
            <span className="block text-xs text-red-400">
              확정된 회의에 영향이 있는지 확인이 필요해요
            </span>
          </span>
          <span className="shrink-0 text-xs font-bold text-red-500">확인하기 →</span>
        </button>
      )}

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {backButton}
        {body}
      </div>

      {/* 제안 발송 확인 모달 */}
      {step === 4 && confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-[380px] rounded-2xl bg-white p-6 shadow-xl"
            style={{ animation: 'slide-down 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold text-zinc-900">
              참석자 {attendees.length - 1}명에게 후보 시간을 보낼까요?
            </p>
            <p className="mt-1.5 text-[13px] text-zinc-600">
              {selected.label} · {meeting.title}
            </p>
            <p className="mt-2.5 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500">
              참석자에게 메일과 앱 알림으로 전달돼요. 아직 확정이 아니라, 응답이 모이면
              회의 확정 여부를 확인할 수 있어요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  onNext(5);
                }}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA 푸터 */}
      {(cta || secondary) && (
        <div className="shrink-0 border-t border-zinc-200 bg-white p-4">
          {cta && (
            <button
              onClick={cta.disabled ? undefined : cta.onClick}
              disabled={cta.disabled}
              className={`w-full rounded-xl py-3 text-sm font-bold transition-colors ${
                cta.disabled
                  ? 'cursor-default bg-zinc-100 text-zinc-400'
                  : cta.tone === 'green'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {cta.label}
            </button>
          )}
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="mt-2 w-full py-1 text-center text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600"
            >
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
