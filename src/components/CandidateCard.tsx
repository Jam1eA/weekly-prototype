import type { CandidateSlot } from '../types';
import ConfidenceBadge from './ConfidenceBadge';

const reschedTone: Record<string, string> = {
  낮음: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  보통: 'bg-amber-50 text-amber-700 border-amber-200',
  높음: 'bg-red-50 text-red-600 border-red-200',
};

export default function CandidateCard({
  candidate,
  selected,
  onSelect,
  onDetail,
  detailLabel = '자세히 보기',
}: {
  candidate: CandidateSlot;
  selected: boolean;
  onSelect: () => void;
  onDetail?: () => void;
  detailLabel?: string;
}) {
  // '다시 조율할 가능성'을 판단의 핵심 축으로 카드 상단에 끌어올린다
  const resched = candidate.facts.find((f) => f.label === '다시 조율할 가능성');
  const otherFacts = candidate.facts.filter((f) => f.label !== '다시 조율할 가능성');

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border bg-white p-4 transition-all ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-100'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{candidate.label}</p>
          {candidate.recommended && (
            <span className="whitespace-nowrap rounded-md bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              기본 추천
            </span>
          )}
        </div>
        <ConfidenceBadge confidence={candidate.confidence} />
      </div>

      {candidate.availabilityText && (
        <p className="-mt-1 mb-2.5 text-xs text-slate-500">{candidate.availabilityText}</p>
      )}

      {resched && (
        <div
          className={`mb-2.5 flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${
            reschedTone[resched.value] ?? 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <span className="text-xs font-medium">다시 조율할 가능성</span>
          <span className="text-xs font-bold">{resched.value}</span>
        </div>
      )}

      <ul className="space-y-1.5">
        {otherFacts.map((f) => (
          <li key={f.label} className="flex items-start gap-1.5 text-xs">
            <span
              className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                f.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {f.ok ? '✓' : '!'}
            </span>
            <span className="text-slate-500">{f.label}</span>
            <span className="ml-auto text-right font-medium text-slate-700">{f.value}</span>
          </li>
        ))}
      </ul>

      {onDetail && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetail();
          }}
          className="mt-3 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
        >
          {detailLabel}
        </button>
      )}
    </div>
  );
}
