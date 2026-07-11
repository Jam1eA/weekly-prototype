import { useEffect, useState } from 'react';
import type { Attendee, CandidateSlot, Role, Step } from '../types';
import {
  directoryExtras,
  initialAttendees,
  jungResponse,
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
  tone: 'ok' | 'no' | 'neutral' | 'wait' | 'warn';
  note?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  const toneClass = {
    ok: 'bg-emerald-50 text-emerald-600',
    no: 'bg-zinc-100 text-zinc-500',
    neutral: 'bg-zinc-100 text-zinc-600',
    wait: 'border border-zinc-200 bg-white text-zinc-400',
    warn: 'bg-amber-50 text-amber-700',
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
  participantDetail: {
    volatile: boolean;
    no: string[];
    avoid: string[];
    alts: string[];
    confirmedAt: string;
  } | null;
  meeting: MeetingInput;
  onChangeMeeting: (m: MeetingInput) => void;
  hasAlert: boolean;
  onOpenAlert: () => void;
  participantAnswer: 'ok' | 'busy' | null;
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
  participantDetail,
  meeting,
  onChangeMeeting,
  hasAlert,
  onOpenAlert,
  participantAnswer,
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
  const [customStart, setCustomStart] = useState('2026-07-13');
  const [customEnd, setCustomEnd] = useState('2026-07-17');
  const [query, setQuery] = useState('');
  // Step 2 → 3: 후보 탐색 전환 (시스템이 캘린더를 살펴보는 순간을 보여준다)
  const [finding, setFinding] = useState(false);
  useEffect(() => {
    if (!finding) return;
    const t = setTimeout(() => {
      setFinding(false);
      onNext(3);
    }, 1400);
    return () => clearTimeout(t);
  }, [finding]);
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

  // Step 5: 확인 요청 후 자동 응답 스크립트.
  // tick1 김민준 직접 확인 → tick2 박서준 직접 확인 → tick3 정하늘 불가 응답.
  // 최유리(선택)는 응답 없이 '캘린더상 가능', 이지은(필수)은 참여자 화면에서 직접 확인한다.
  const AUTO_TICKS = 3;
  const leeResponded = participantAnswer !== null;
  // 이지은이 거절하며 직접 제안한 시간을 재제안한 경우 — 본인이 언급한 시간이라 다시 묻지 않는다
  const proposedIsLeeAlt = proposed.suggestedBy === 'lee';
  const [autoCount, setAutoCount] = useState(0);
  useEffect(() => {
    if (step !== 5) return;
    if (leeResponded && !proposedIsLeeAlt) {
      setAutoCount(AUTO_TICKS);
      return;
    }
    // 승격 후보 재제안 시에는 나머지 필수 2명의 확인 스크립트를 다시 돌린다.
    // 경과 시간 기준으로 계산해, 백그라운드 탭에서 타이머가 스로틀돼도 복귀 즉시 따라잡는다.
    setAutoCount(0);
    const started = Date.now();
    const update = () =>
      setAutoCount(Math.min(AUTO_TICKS, Math.floor((Date.now() - started) / 850)));
    const iv = setInterval(update, 300);
    return () => clearInterval(iv);
  }, [step, leeResponded, proposedIsLeeAlt]);
  const autoDone = autoCount >= AUTO_TICKS;
  const waitingLee = autoDone && !leeResponded;

  // 주최자를 제외한 필수 3명(김민준·박서준·이지은)의 직접 확인 수
  const leeCounts = participantAnswer === 'ok' || proposedIsLeeAlt;
  const directConfirmed =
    (autoCount >= 1 ? 1 : 0) + (autoCount >= 2 ? 1 : 0) + (leeCounts ? 1 : 0);
  // 필수 전원 직접 확인 전에는 확정할 수 없다
  const readyToConfirm = autoDone && leeCounts;

  // 참석자별 확인 상태 — '가능' 하나로 뭉개지 않고 정보의 출처를 구분한다
  type RState = {
    label: string;
    tone: 'ok' | 'warn' | 'wait' | 'no' | 'neutral';
    sub?: string;
  };
  const stateOf = (a: Attendee): RState => {
    if (a.isOrganizer) return { label: '주최자 · 참석', tone: 'ok' };
    switch (a.id) {
      case 'kim':
        return autoCount >= 1
          ? { label: '본인 확인 완료', tone: 'ok' }
          : { label: '응답 대기', tone: 'wait' };
      case 'park':
        return autoCount >= 2
          ? { label: '본인 확인 완료', tone: 'ok' }
          : { label: '응답 대기', tone: 'wait' };
      case 'jung':
        // "수요일 오후만 가능" 응답은 수요일 승격 후보를 직접 언급한 것으로 본다
        if (proposedIsLeeAlt)
          return jungShared
            ? { label: '회의록 공유 예정', tone: 'neutral' }
            : { label: '가능 · 본인 응답', tone: 'ok' };
        if (autoCount < 3) return { label: '캘린더상 가능', tone: 'neutral' };
        return jungShared
          ? { label: '회의록 공유 예정', tone: 'neutral' }
          : { label: '참석 어려움', tone: 'no' };
      case 'choi':
        return { label: '캘린더상 가능', tone: 'neutral', sub: '응답 전' };
      case 'lee':
        // 본인이 대안으로 직접 제안한 시간은 본인 확인으로 인정한다
        if (proposedIsLeeAlt) return { label: '본인 확인 완료 · 직접 제안', tone: 'ok' };
        if (!leeResponded) return { label: '응답 대기', tone: 'wait' };
        // 확인 시각(confirmedAt)은 데이터로만 유지하고 UI에는 노출하지 않는다
        if (participantAnswer === 'ok')
          return participantDetail?.volatile
            ? { label: '본인 확인 완료 · 변동 가능성', tone: 'warn' }
            : { label: '본인 확인 완료', tone: 'ok' };
        // 거절 응답은 그 시간에만 유효 — 다른 시간은 다시 물어야 한다
        return proposed.id === 'c1'
          ? { label: '참석 어려움', tone: 'no' }
          : { label: '재확인 필요', tone: 'warn' };
      default:
        return { label: '캘린더상 가능', tone: 'neutral' };
    }
  };

  // 이지은이 실제로 입력한 조건 요약 (시스템이 지어내지 않는다)
  const leeConstraintSummary = (() => {
    if (!participantDetail) return null;
    const parts: string[] = [];
    if (participantDetail.no.length) parts.push(`${participantDetail.no.join(', ')} 불가`);
    if (participantDetail.avoid.length)
      parts.push(`${participantDetail.avoid.join(', ')} 피하고 싶음`);
    if (participantDetail.alts.length) parts.push(`대신 ${participantDetail.alts.join(', ')}`);
    return parts.length ? parts.join(' · ') : null;
  })();

  // 응답 목록은 실제 참석자 명단에서 생성
  const requiredAtt = attendees.filter((a) => a.role === 'required');
  const optionalAtt = attendees.filter((a) => a.role === 'optional');
  const shareAtt = attendees.filter((a) => a.role === 'share');

  // Step 10: 영향받는 2명(박서준·이지은) 재확인 애니메이션
  const [recheckCount, setRecheckCount] = useState(0);
  useEffect(() => {
    if (step !== 10) return;
    setRecheckCount(0);
    const started = Date.now();
    const update = () =>
      setRecheckCount(Math.min(2, Math.floor((Date.now() - started) / 1100)));
    const iv = setInterval(update, 300);
    return () => clearInterval(iv);
  }, [step]);

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
                회의 목적 (선택)
              </p>
              <textarea
                value={meeting.purpose}
                onChange={(e) => onChangeMeeting({ ...meeting, purpose: e.target.value })}
                placeholder="참석자가 역할을 이해하는 데 도움이 돼요"
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
              {periodOpt === '직접 선택' && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-zinc-400">시작일</p>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:border-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-zinc-400">종료일</p>
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:border-zinc-800 focus:outline-none"
                    />
                  </div>
                </div>
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
                            onChangeRole(a.id, a.role === 'required' ? 'optional' : 'required')
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

              <p className="mt-2 px-1 text-xs text-zinc-400">
                새로 추가한 사람은 필수로 들어와요. 배지를 누르면 역할이 바뀌어요.
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

          <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-[15px] font-bold leading-snug text-zinc-900">{meeting.title}</p>
            {meeting.purpose && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{meeting.purpose}</p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[meetingInfo.duration, '다음 주 (7/13 – 7/17)', `참석자 ${attendees.length}명`].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {(
              [
                { role: 'required', label: '필수' },
                { role: 'optional', label: '선택' },
                // 공유는 구성 단계에서 고르는 역할이 아니라 불참 응답 후의 결과 상태 —
                // 전환된 사람이 있을 때만 그룹이 나타난다
                { role: 'share', label: '공유' },
              ] as { role: Role; label: string }[]
            ).map(({ role, label }) => {
              const group = attendees.filter((a) => a.role === role);
              if (role === 'share' && group.length === 0) return null;
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

        </>
      );
      cta = finding
        ? { label: '겹치는 시간을 찾는 중이에요', onClick: () => {}, disabled: true }
        : { label: '후보 시간 비교하기', onClick: () => setFinding(true) };
      break;

    case 3:
      body = (
        <>
          <PanelTitle>후보 시간 비교</PanelTitle>
          <PanelDesc>
            {participantAnswer === 'busy'
              ? '이지은님의 응답을 반영해 후보를 다시 정리했어요. 본인이 제안한 시간부터 보여드려요.'
              : '캘린더로 후보를 좁혔어요. 확정은 필수 참석자의 직접 확인 뒤에 할 수 있어요.'}
          </PanelDesc>

          <div className="mt-4 space-y-3">
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
          <PanelTitle>{selected.label}</PanelTitle>
          <div className="mt-2">
            <ConfidenceBadge recommend={selected.recommend} />
          </div>

          {/* 참석자별 캘린더 기준 상태 — 누가 걸리는지가 먼저 보이게 */}
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
                          : selected.suggestedBy === a.id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {a.name[0]}
                      {/* 배지는 걸리는 사람에게만 — 배지 없음 = 캘린더상 가능 */}
                      {st && (
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white ${
                            st === 'no' ? 'bg-red-500' : 'bg-amber-400'
                          }`}
                        >
                          {st === 'no' ? '×' : st === 'unsure' ? '?' : '!'}
                        </span>
                      )}
                    </div>
                    <p
                      className={`max-w-full truncate text-[10px] ${
                        st === 'no' ? 'text-zinc-300 line-through' : 'text-zinc-500'
                      }`}
                    >
                      {a.name}
                    </p>
                    {selected.suggestedBy === a.id && (
                      <p className="-mt-0.5 text-[10px] font-semibold text-emerald-600">
                        직접 제안
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 border-t border-zinc-100 pt-2 text-[11px] leading-relaxed text-zinc-400">
              {selected.summary ??
                `${attendees.filter((a) => !selected.attendeeStatus?.[a.id]).length}명 캘린더상 가능 · 아직 본인 응답 전이에요`}
            </p>
          </div>

          <p className="mb-2 mt-5 text-sm font-bold text-zinc-800">캘린더 기준</p>
          <Card>
            <ul className="space-y-2.5 text-[13px]">
              {selected.facts
                .filter((f) => f.label !== '회의실')
                .map((f) => (
                  <li key={f.label} className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-zinc-400">{f.label}</span>
                    <span
                      className={`text-right font-medium ${
                        f.label === '필수 참석자 응답'
                          ? 'text-amber-700'
                          : f.ok
                            ? 'text-zinc-800'
                            : 'text-amber-700'
                      }`}
                    >
                      {f.label === '필수 참석자 응답' && !selected.suggestedBy ? '0/3 · 요청 전' : f.value}
                    </span>
                  </li>
                ))}
            </ul>
            {selected.room && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
                  <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                </svg>
                <span className="text-[13px] font-semibold text-zinc-800">
                  {selected.room.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {selected.room.place} · {selected.room.capacity}
                </span>
              </div>
            )}
          </Card>

          {selected.note && (
            <div className="mt-3">
              <Card tone={selected.recommend === 'good' ? 'blue' : 'amber'}>
                <p className="text-[13px] leading-relaxed text-zinc-700">{selected.note}</p>
              </Card>
            </div>
          )}
        </>
      );
      cta = { label: '이 시간 확인 요청하기', onClick: () => setConfirmOpen(true) };
      break;

    case 5:
      body = (
        <>
          <PanelTitle>확인 요청을 보냈어요</PanelTitle>
          <PanelDesc>
            {proposedIsLeeAlt
              ? '이지은님이 직접 제안한 시간이라 다시 묻지 않아요. 나머지 필수 2명의 확인만 기다리면 돼요.'
              : '필수 참석자 3명이 직접 확인해야 회의를 확정할 수 있어요.'}
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card>
              <p className="mb-1 text-xs font-semibold text-zinc-400">확인 요청한 시간</p>
              <p className="text-base font-bold text-zinc-900">{proposed.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {meeting.title}
                {proposed.room ? ` · ${proposed.room.name}` : ''}
              </p>
            </Card>

            <Card tone="blue">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-zinc-700">
                  필수 참석자 응답
                </p>
                <span className="text-xs font-bold text-blue-600">{directConfirmed}/3</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(directConfirmed / 3) * 100}%` }}
                />
              </div>

              <div className="mt-3 border-t border-zinc-100">
                {attendees
                  .filter((a) => !a.isOrganizer)
                  .map((a) => {
                    const st = stateOf(a);
                    return (
                      <div key={a.id} className="flex items-center justify-between py-1.5">
                        <p className="text-[13px] text-zinc-700">
                          {a.name}{' '}
                          <span className="text-zinc-400">
                            {a.role === 'required' ? '필수' : a.role === 'optional' ? '선택' : '공유'}
                          </span>
                        </p>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            st.tone === 'ok'
                              ? 'bg-emerald-50 text-emerald-600'
                              : st.tone === 'warn'
                                ? 'bg-amber-50 text-amber-700'
                                : st.tone === 'no'
                                  ? 'bg-zinc-100 text-zinc-500'
                                  : st.tone === 'wait'
                                    ? 'border border-zinc-200 bg-white text-zinc-400'
                                    : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {st.label}
                          {st.sub ? ` · ${st.sub}` : ''}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {waitingLee && (
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
                    이지은님 화면에서 응답하기
                  </button>
                </div>
              )}
            </Card>
          </div>
        </>
      );
      cta = {
        label: leeResponded && autoDone ? '확인 현황 보기' : '확인을 기다리는 중이에요',
        onClick: () => onNext(6),
        disabled: !(leeResponded && autoDone),
      };
      break;

    case 6: {
      const rowFor = (a: Attendee) => {
        const st = stateOf(a);
        return (
          <ResponseRow
            key={a.id}
            name={a.name}
            title={a.isOrganizer ? `${a.title} · 주최자` : a.title}
            status={st.sub ? `${st.label} · ${st.sub}` : st.label}
            tone={st.tone}
            note={
              a.id === 'lee' && leeConstraintSummary ? (
                <>
                  <span className="mr-1 rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-semibold text-zinc-500">
                    본인 응답
                  </span>
                  {leeConstraintSummary}
                </>
              ) : a.id === 'jung' && autoDone && !jungShared ? (
                <>
                  <span className="mr-1 rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-semibold text-zinc-500">
                    본인 응답
                  </span>
                  {jungResponse.summary} · 회의는 진행할 수 있어요.
                </>
              ) : undefined
            }
            action={
              a.id === 'jung' && autoDone && !jungShared && !proposedIsLeeAlt
                ? {
                    label: '회의록 공유 대상으로 바꾸기',
                    onClick: () => onChangeRole('jung', 'share'),
                  }
                : undefined
            }
          />
        );
      };

      body = (
        <>
          <PanelTitle>
            {readyToConfirm ? '확정 준비가 끝났어요' : '확인 현황'}
          </PanelTitle>
          <PanelDesc>
            {readyToConfirm
              ? '회의 성립에 필요한 조건이 모두 확인됐어요.'
              : '필수 참석자의 응답 상태를 확인해요.'}
          </PanelDesc>

          {readyToConfirm && (
            <div className="mt-4">
              <Card tone="green">
                <p className="mb-2 text-xs font-semibold text-emerald-600">확정 준비 완료</p>
                <ul className="space-y-2">
                  <CheckItem>필수 참석자 응답 3/3 완료</CheckItem>
                  <CheckItem>주최자 포함 필수 참석자 4명 모두 가능</CheckItem>
                  <CheckItem>선택 참석자 1명 캘린더상 가능 (확정 조건 아님)</CheckItem>
                  <CheckItem ok={proposedIsLeeAlt || jungShared}>
                    {proposedIsLeeAlt
                      ? '정하늘 QA 가능 (본인 응답)'
                      : jungShared
                        ? '정하늘 QA 불참 → 회의록 공유 대상으로 전환'
                        : '정하늘 QA 불참 (회의 진행 가능)'}
                  </CheckItem>
                  {proposed.room && (
                    <CheckItem>
                      {proposed.room.name} · {proposed.room.place} · {proposed.room.capacity} 사용 가능
                    </CheckItem>
                  )}
                  <CheckItem>확인 이후 일정 변경 없음</CheckItem>
                  {participantDetail?.volatile && (
                    <CheckItem ok={false}>
                      이지은님 일정 변동 가능성 있음 · 변경되면 알림으로 알려드릴게요
                    </CheckItem>
                  )}
                </ul>
              </Card>
            </div>
          )}

          <div className="mt-3">
            <Card>
              <GroupLabel>필수 참석자</GroupLabel>
              {requiredAtt.map(rowFor)}
              {optionalAtt.length > 0 && <GroupLabel>선택 참석자</GroupLabel>}
              {optionalAtt.map(rowFor)}
              {shareAtt.length > 0 && <GroupLabel>공유 대상</GroupLabel>}
              {shareAtt.map(rowFor)}
            </Card>
          </div>

          {!readyToConfirm && (
            <div className="mt-3">
              <Card tone="amber">
                <p className="text-[13px] font-medium leading-relaxed text-zinc-700">
                  {participantAnswer === 'busy' && !proposedIsLeeAlt
                    ? '필수 참석자 이지은님이 이 시간에 참석할 수 없어요. 이 시간으로는 확정할 수 없어요.'
                    : `필수 참석자 ${3 - directConfirmed}명의 확인을 기다리고 있어요.`}
                </p>
              </Card>
            </div>
          )}
        </>
      );
      cta = {
        label: readyToConfirm ? '회의 확정하기' : '필수 참석자 확인 후 확정할 수 있어요',
        onClick: () => onNext(7),
        tone: 'green',
        disabled: !readyToConfirm,
      };
      secondary =
        participantAnswer === 'busy' && !proposedIsLeeAlt
          ? { label: '다른 시간 다시 비교하기', onClick: () => onNext(3) }
          : null;
      break;
    }

    case 7:
      body = (
        <>
          <PanelTitle>필요한 조건을 모두 확인하고 회의를 확정했어요</PanelTitle>
          <PanelDesc>참석자 캘린더에 회의 일정이 등록되었어요.</PanelDesc>

          <div className="mt-4 space-y-3">
            <Card tone="green">
              <p className="mb-1 text-xs font-semibold text-emerald-600">확정된 시간</p>
              <p className="text-base font-bold text-zinc-900">{proposed.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {meeting.title}
                {proposed.room
                  ? ` · ${proposed.room.name} · ${proposed.room.place}`
                  : ''}
              </p>
            </Card>

            <Card>
              <ul className="space-y-2">
                <CheckItem>필수 참석자 전원 본인 확인 완료</CheckItem>
                <CheckItem>회의실 확보</CheckItem>
                <CheckItem>캘린더 등록 완료</CheckItem>
              </ul>
            </Card>

            <p className="px-1 text-xs leading-relaxed text-zinc-400">
              일정에 변경이 생기면 알림으로 알려드릴게요.
            </p>
          </div>
        </>
      );
      if (proposedIsLeeAlt) cta = { label: '완료', onClick: onReset, tone: 'green' };
      break;

    case 8:
      body = (
        <>
          <PanelTitle>확정 후 변경이 생겼어요</PanelTitle>
          <PanelDesc>
            처음부터 다시 조율하지 않도록, 영향을 받는 부분만 확인할게요.
          </PanelDesc>

          <div className="mt-3 space-y-3">
            <Card tone="red">
              <p className="text-[13px] font-semibold leading-relaxed text-red-600">
                박서준님의 외근 일정이 새로 확정됐어요.
              </p>
            </Card>

            <Card>
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                  박
                </div>
                <p className="text-[13px] leading-relaxed text-zinc-700">
                  회의 확정 이후 추가된 일정이라{' '}
                  <span className="font-semibold">{proposedShort}</span> 회의에 참석하기
                  어려워요. 박서준님은 필수 참석자라 기존 회의에 영향이 있어요.
                </p>
              </div>
            </Card>
          </div>
        </>
      );
      cta = { label: '변경 영향 확인하기', onClick: () => onNext(9) };
      break;

    case 9: {
      const a1 = alternatives[0];
      body = (
        <>
          <PanelTitle>대체 시간을 찾았어요</PanelTitle>
          <PanelDesc>
            기존 응답과 최신 일정을 기준으로 대체 가능한 시간이에요.
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card>
              <p className="mb-2 text-xs font-semibold text-zinc-400">
                기존 시간 · {proposed.label}
              </p>
              <ul className="space-y-2">
                <CheckItem ok={false}>필수 참석자 1명이 참석할 수 없어요</CheckItem>
                <CheckItem ok={false}>이 시간은 유지하기 어려워요</CheckItem>
              </ul>
            </Card>

            <CandidateCard
              candidate={a1}
              selected
              onSelect={() => {}}
            />

            {/* 기존 응답은 그 시간을 직접 언급했을 때만 유효 — 캘린더만 비어 있으면 재확인 */}
            {a1.recheck && (
              <Card>
                <p className="mb-1 text-xs font-semibold text-zinc-400">
                  수요일 15:00 기준 참석자 상태
                </p>
                {a1.recheck.map((r) => (
                  <div key={r.id} className="border-b border-zinc-100 py-2 last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-medium text-zinc-800">{r.name}</p>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                          r.state === 'valid'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.state === 'valid' ? '기존 응답 유효' : '재확인 필요'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{r.note}</p>
                  </div>
                ))}
              </Card>
            )}

            <Card tone="blue">
              <p className="text-[13px] font-medium leading-relaxed text-zinc-700">
                새 시간에 영향을 받는 참석자 2명(박서준·이지은)에게만 다시 확인할게요.
              </p>
            </Card>

            <CandidateCard candidate={alternatives[1]} selected={false} onSelect={() => {}} />
          </div>
        </>
      );
      cta = { label: '2명에게 재확인 요청하기', onClick: () => onNext(10) };
      break;
    }

    case 10: {
      const a1 = alternatives[0];
      const recheckDone = recheckCount >= 2;
      body = (
        <>
          <PanelTitle>영향받는 2명에게 재확인 중이에요</PanelTitle>
          <PanelDesc>
            {nextSlot.label.replace(/ - .*$/, '')} 기준으로 박서준님과 이지은님만 다시
            확인해요. 나머지는 기존 응답이 유효해요.
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card tone="blue">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-zinc-700">재확인 진행</p>
                <span className="text-xs font-bold text-blue-600">{recheckCount}/2</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(recheckCount / 2) * 100}%` }}
                />
              </div>
            </Card>

            <Card>
              <GroupLabel>재확인 대상 (필수)</GroupLabel>
              <ResponseRow
                name="박서준"
                title="개발 리드"
                status={recheckCount >= 1 ? '본인 확인 완료' : '재확인 요청 중'}
                tone={recheckCount >= 1 ? 'ok' : 'wait'}
                note="새 외근 일정과 겹치지 않는지 확인"
              />
              <ResponseRow
                name="이지은"
                title="PM"
                status={recheckCount >= 2 ? '본인 확인 완료' : '재확인 요청 중'}
                tone={recheckCount >= 2 ? 'ok' : 'wait'}
                note="화요일 14:00만 직접 확인했었어요"
              />

              <GroupLabel>기존 응답 유효</GroupLabel>
              {a1.recheck
                ?.filter((r) => r.state === 'valid')
                .map((r) => (
                  <ResponseRow
                    key={r.id}
                    name={r.name}
                    title=""
                    status="기존 응답 유효"
                    tone="neutral"
                    note={r.note}
                  />
                ))}
            </Card>

            {recheckDone && (
              <Card tone="green">
                <p className="text-[13px] font-medium leading-relaxed text-zinc-700">
                  재확인 2명 완료 · 필수 참석자 기준이 다시 충족됐어요.
                </p>
              </Card>
            )}
          </div>
        </>
      );
      cta = {
        label: recheckDone ? '변경 확정하기' : '재확인을 기다리는 중이에요',
        onClick: () => onNext(11),
        tone: 'green',
        disabled: !recheckDone,
      };
      break;
    }

    case 11:
      body = (
        <>
          <PanelTitle>회의 시간이 다시 확정되었어요</PanelTitle>
          <PanelDesc>
            영향을 받은 2명만 재확인해서, 처음부터 다시 조율하지 않고 변경했어요.
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card tone="green">
              <p className="mb-1 text-xs font-semibold text-emerald-600">변경된 회의 시간</p>
              <p className="text-base font-bold text-zinc-900">{nextSlot.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {meeting.title}
                {nextSlot.room ? ` · ${nextSlot.room.name} · ${nextSlot.room.place}` : ''}
              </p>
            </Card>

            <Card>
              <ul className="space-y-2">
                <CheckItem>영향받은 필수 참석자 2명 재확인 완료</CheckItem>
                <CheckItem>기존 응답 유효 3명 유지</CheckItem>
                <CheckItem>회의실 B 예약 완료</CheckItem>
                <CheckItem>캘린더 업데이트 완료</CheckItem>
              </ul>
            </Card>
          </div>
        </>
      );
      cta = { label: '완료', onClick: onReset, tone: 'green' };
      break;
  }

  // 후보 탐색 전환: "N명으로 시간을 찾는다"는 문장이 실제로 일어나는 순간
  if (step === 2 && finding) {
    body = (
      <>
        <PanelTitle>겹치는 시간을 찾고 있어요</PanelTitle>
        <PanelDesc>
          필수 {requiredCount}명{optionalCount > 0 ? `, 선택 ${optionalCount}명` : ''}
          {shareCount > 0 ? `, 공유 ${shareCount}명` : ''}의 다음 주 캘린더를 살펴보고
          있어요.
        </PanelDesc>

        <div className="mt-5">
          <Card>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900"
                style={{ animation: 'fill-bar 1.3s ease-out forwards' }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              캘린더 겹침 · 점심시간 · 회의실을 함께 확인해요. 캘린더에 없는 조건은
              참석자에게 직접 확인해요.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-zinc-200 bg-zinc-50">
      {/* 패널 헤더 */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 py-3">
        <p className="text-xs font-semibold tracking-wide text-zinc-400">회의 조율</p>
        <StatusBadge step={step} ready={readyToConfirm} />
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
              필수 참석자 {selected.suggestedBy ? requiredCount - 2 : requiredCount - 1}명에게 이
              시간의 확인을 요청할까요?
            </p>
            <p className="mt-1.5 text-[13px] text-zinc-600">
              {selected.label} · {meeting.title}
            </p>
            <p className="mt-2.5 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-500">
              {selected.suggestedBy
                ? `이지은님이 직접 제안한 시간이라 다시 묻지 않아요. 나머지 필수 ${requiredCount - 2}명이 확인하면 확정할 수 있어요.`
                : `필수 참석자 ${requiredCount - 1}명이 직접 확인해야 회의를 확정할 수 있어요.${
                    optionalCount > 0
                      ? ` 선택 참석자 ${optionalCount}명에게는 제안 시간을 알려드리고, 어려우면 응답으로 알려줄 수 있어요.`
                      : ''
                  }`}{' '}
              메일과 앱 알림으로 전달돼요.
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
                확인 요청 보내기
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
