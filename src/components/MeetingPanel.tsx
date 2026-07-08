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
  return <h2 className="text-lg font-bold leading-snug text-slate-900">{children}</h2>;
}

function PanelDesc({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{children}</p>;
}

function Card({
  tone = 'default',
  children,
}: {
  tone?: 'default' | 'blue' | 'green' | 'red' | 'amber';
  children: React.ReactNode;
}) {
  const tones = {
    default: 'border-slate-200 bg-white',
    blue: 'border-blue-100 bg-blue-50/60',
    green: 'border-emerald-100 bg-emerald-50/60',
    red: 'border-red-100 bg-red-50/60',
    amber: 'border-amber-100 bg-amber-50/60',
  };
  return <div className={`rounded-xl border p-4 ${tones[tone]}`}>{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="shrink-0 text-xs text-slate-400">{label}</span>
      <span className="text-right text-xs font-medium text-slate-700">{value}</span>
    </div>
  );
}

function CheckItem({ children, ok = true }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600">
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
    no: 'bg-slate-100 text-slate-500',
    neutral: 'bg-blue-50 text-blue-600',
  }[tone];
  return (
    <div className="border-b border-slate-100 py-2 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-slate-800">
          {name} <span className="font-normal text-slate-400">{title}</span>
        </p>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${toneClass}`}>
          {status}
        </span>
      </div>
      {note && <p className="mt-1 text-xs leading-relaxed text-slate-400">{note}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1.5 text-xs font-semibold text-blue-600 underline-offset-2 hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-4 text-xs font-semibold tracking-wide text-slate-400 first:mt-0">
      {children}
    </p>
  );
}

/* ---------- 메인 패널 ---------- */

interface Props {
  step: Step;
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
    setAutoCount(0);
    const iv = setInterval(() => {
      setAutoCount((c) => (c >= AUTO_RESPONDERS ? c : c + 1));
    }, 850);
    return () => clearInterval(iv);
  }, [step]);
  const respondedCount = Math.min(autoCount, AUTO_RESPONDERS) + (jungResponded ? 1 : 0);
  const allResponded = respondedCount >= RESPONDERS;
  const waitingJung = hasJung && autoCount >= AUTO_RESPONDERS && !jungResponded;
  const requiredResponded = Math.min(autoCount, requiredAuto);

  // 응답 목록은 실제 참석자 명단에서 생성 (회의 만들기에서 바뀐 명단이 그대로 반영)
  const requiredAtt = attendees.filter((a) => a.role === 'required');
  const optionalAtt = attendees.filter((a) => a.role === 'optional');
  const shareAtt = attendees.filter((a) => a.role === 'share');

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
              <p className="mb-2 text-xs font-semibold text-slate-400">회의 정보</p>
              <p className="text-sm font-semibold text-slate-900">{meetingInfo.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{meetingInfo.purpose}</p>

              <p className="mb-1.5 mt-3.5 text-xs font-semibold text-slate-400">회의 길이</p>
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {['30분', '1시간', '1시간 30분'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDurationOpt(d)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                      durationOpt === d
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <p className="mb-1.5 mt-3.5 text-xs font-semibold text-slate-400">기간</p>
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {['이번 주', '다음 주', '직접 선택'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setPeriodOpt(d)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                      periodOpt === d
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {periodOpt === '다음 주' && (
                <p className="mt-1.5 text-xs text-slate-400">7월 13일 – 7월 17일에서 시간을 찾아요.</p>
              )}
            </Card>

            <Card>
              <p className="mb-2 text-xs font-semibold text-slate-400">
                참석자 · 나 포함 {attendees.length}명
              </p>
              <div className="flex flex-wrap gap-1.5">
                {attendees.map((a) => (
                  <span
                    key={a.id}
                    className={`inline-flex items-center gap-1 rounded-full py-1 pl-1 pr-2 text-xs font-medium ${
                      a.isOrganizer
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-600">
                      {a.name[0]}
                    </span>
                    {a.name}
                    {a.isOrganizer ? (
                      <span className="text-[10px] text-blue-400">나</span>
                    ) : (
                      <button
                        onClick={() => onToggleAttendee(a.id)}
                        className="ml-0.5 text-slate-400 hover:text-slate-600"
                        aria-label={`${a.name} 제외`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                최근 '프로젝트' 회의를 함께한 사람을 불러왔어요.
              </p>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름, 직무, 팀으로 검색"
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-blue-400 focus:outline-none"
              />
              <div className="mt-2 max-h-56 divide-y divide-slate-50 overflow-y-auto">
                {results.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {p.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-slate-800">
                        {p.name} <span className="font-normal text-slate-400">{p.title}</span>
                      </p>
                      <p className="truncate text-xs text-slate-400">{p.description}</p>
                    </div>
                    <button
                      onClick={() => onToggleAttendee(p.id)}
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                        isSelected(p.id)
                          ? 'text-slate-400 hover:text-slate-600'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {isSelected(p.id) ? '✓ 추가됨' : '+ 추가'}
                    </button>
                  </div>
                ))}
                {results.length === 0 && (
                  <p className="py-3 text-center text-xs text-slate-400">
                    검색 결과가 없어요.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      );
      cta = {
        label: '회의 조건 확인하기',
        onClick: () => onNext(1),
        disabled: attendees.length < 2,
      };
      break;
    }

    case 1:
      body = (
        <>
          <PanelTitle>회의 조건 확인</PanelTitle>
          <PanelDesc>다음 주 안에 1시간 회의를 잡기 위해 먼저 조건을 확인해요.</PanelDesc>

          <div className="mt-4 space-y-3">
            <Card>
              <p className="mb-2 text-xs font-semibold text-slate-400">회의 정보</p>
              <InfoRow label="회의명" value={meetingInfo.title} />
              <InfoRow label="회의 목적" value={meetingInfo.purpose} />
              <InfoRow label="회의 길이" value={meetingInfo.duration} />
              <InfoRow label="기간" value={meetingInfo.period} />
            </Card>

            <Card tone="blue">
              <p className="text-[13px] font-semibold text-slate-800">
                시간을 찾을 때 함께 볼 조건
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                꼭 참석해야 할 사람, 회의실, 숨은 일정 제약, 다시 조율할 가능성을 함께
                확인해요.
              </p>
            </Card>
          </div>
        </>
      );
      cta = { label: '꼭 참석해야 할 사람 정하기', onClick: () => onNext(2) };
      break;

    case 2:
      body = (
        <>
          <PanelTitle>꼭 참석해야 할 사람 정하기</PanelTitle>
          <PanelDesc>
            이 회의가 성립하려면 반드시 참석해야 하는 사람을 먼저 정하세요.
          </PanelDesc>

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
                    <p className="text-sm font-bold text-slate-800">
                      {label} <span className="text-blue-600">{group.length}</span>
                    </p>
                    <p className="min-w-0 flex-1 truncate text-xs text-slate-400">
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
                    <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-300">
                      역할을 바꾸면 카드가 이 칸으로 옮겨져요
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <Card tone="blue">
            <p className="text-[13px] font-medium text-slate-700">
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
            비어 있는 시간이 아니라, 이 시간으로 회의를 잡아도 괜찮은지를 기준으로
            비교해요.
          </PanelDesc>

          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs leading-relaxed text-slate-500">
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
          <p className="mt-3 text-center text-xs text-slate-400">
            후보를 누르면 캘린더에서 해당 시간이 강조돼요.
          </p>
        </>
      );
      break;

    case 4:
      backButton = (
        <button
          onClick={() => onNext(3)}
          className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
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

          <p className="mb-2 mt-5 text-sm font-bold text-slate-800">추천 이유</p>
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
              <p className="mb-2 mt-5 text-sm font-bold text-slate-800">
                다른 후보와 비교하면
              </p>
              <Card>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  {selected.comparison}
                </p>
              </Card>
            </>
          )}

          <div className="mt-3">
            <Card tone={selected.confidence === 'high' ? 'blue' : 'amber'}>
              <p className="text-[13px] leading-relaxed text-slate-700">{selected.summary}</p>
            </Card>
          </div>
        </>
      );
      cta = { label: '이 시간 제안하기', onClick: () => onNext(5) };
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
              <p className="mb-1 text-xs font-semibold text-slate-400">제안한 시간</p>
              <p className="text-base font-bold text-slate-900">{proposed.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{meetingInfo.title}</p>
            </Card>

            <Card tone="blue">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-700">
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
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {allResponded
                  ? '이제 회의 확정 여부를 확인할 수 있어요.'
                  : waitingJung
                    ? '정하늘님에게 응답 요청이 전달되어 있어요.'
                    : `꼭 참석해야 할 사람 ${requiredResponded}/${requiredTotal} 응답 완료`}
              </p>
            </Card>

            {waitingJung && (
              <Card>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    정
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800">정하늘 QA</p>
                    <p className="text-xs text-slate-400">아직 응답하지 않았어요</p>
                  </div>
                </div>
                <button
                  onClick={onEnterParticipant}
                  className="mt-3 w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                >
                  정하늘님 화면에서 응답하기
                </button>
              </Card>
            )}
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
                        <span className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-semibold text-slate-500">
                          본인 응답
                        </span>
                        {jungResponse.summary}
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
                <p className="text-[13px] font-medium leading-relaxed text-slate-700">
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
          <PanelTitle>회의가 확정되었어요.</PanelTitle>
          <PanelDesc>
            이제부터 발생하는 변경은 확정된 회의의 변경 사항으로 관리돼요.
          </PanelDesc>

          <div className="mt-4 space-y-3">
            <Card tone="green">
              <p className="mb-1 text-xs font-semibold text-emerald-600">확정된 시간</p>
              <p className="text-base font-bold text-slate-900">{proposed.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {meetingInfo.title} · 회의실 A
              </p>
            </Card>

            <Card>
              <p className="mb-2 text-xs font-semibold text-slate-400">확정 요약</p>
              <ul className="space-y-2">
                <CheckItem>꼭 참석해야 할 사람 4명 모두 참석 (주최자 포함)</CheckItem>
                <CheckItem>{jungSummaryLine}</CheckItem>
                <CheckItem>회의실 A 예약 완료</CheckItem>
                <CheckItem>다시 조율할 가능성 낮음</CheckItem>
              </ul>
            </Card>

            <p className="px-1 text-xs leading-relaxed text-slate-400">
              참석자 캘린더에 회의 일정이 등록되었어요. 일정에 변경이 생기면 알림으로
              알려드릴게요.
            </p>
          </div>
        </>
      );
      break;

    case 8:
      body = (
        <>
          <PanelTitle>필수 참석자 일정 변경</PanelTitle>

          <div className="mt-3 space-y-3">
            <Card tone="red">
              <p className="text-[13px] font-semibold leading-relaxed text-red-600">
                꼭 참석해야 할 사람이 참석할 수 없어 기존 회의 시간을 유지하기 어려워요.
              </p>
            </Card>

            <Card>
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  박
                </div>
                <p className="text-[13px] leading-relaxed text-slate-700">
                  박서준 개발 리드의 외근이 화요일 오후로 확정되면서{' '}
                  <span className="font-semibold">{proposedShort}</span> 회의에 참석할 수
                  없게 되었어요.
                </p>
              </div>
            </Card>

            <p className="px-1 text-xs leading-relaxed text-slate-400">
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
              <p className="mb-2 text-xs font-semibold text-slate-400">
                기존 시간 · {proposed.label}
              </p>
              <ul className="space-y-2">
                <CheckItem ok={false}>꼭 참석해야 할 사람 1명이 참석할 수 없어요.</CheckItem>
                <CheckItem ok={false}>이 사람이 없으면 회의 성립 조건이 맞지 않아요.</CheckItem>
                <CheckItem ok={false}>기존 시간은 유지하기 어려워요.</CheckItem>
              </ul>
            </Card>

            <Card tone="blue">
              <p className="text-[13px] font-medium leading-relaxed text-slate-700">
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
                <p className="text-[13px] font-medium leading-relaxed text-slate-700">
                  주최자를 포함해 꼭 참석해야 할 4명이 모두 가능하고, 회의실 B도 확보되어
                  있어요.
                </p>
              </Card>
              <p className="px-1 text-xs leading-relaxed text-slate-400">
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
              <p className="text-base font-bold text-slate-900">{nextSlot.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {meetingInfo.title} · 회의실 B
              </p>
            </Card>

            <Card>
              <p className="mb-2 text-xs font-semibold text-slate-400">확정 요약</p>
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
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-slate-50">
      {/* 패널 헤더 */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <p className="text-xs font-semibold tracking-wide text-slate-400">회의 조율</p>
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

      {/* CTA 푸터 */}
      {(cta || secondary) && (
        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          {cta && (
            <button
              onClick={cta.disabled ? undefined : cta.onClick}
              disabled={cta.disabled}
              className={`w-full rounded-xl py-3 text-sm font-bold transition-colors ${
                cta.disabled
                  ? 'cursor-default bg-slate-100 text-slate-400'
                  : cta.tone === 'green'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {cta.label}
            </button>
          )}
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="mt-2 w-full py-1 text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
