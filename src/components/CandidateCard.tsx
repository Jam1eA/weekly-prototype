import type { CandidateSlot } from '../types';
import ConfidenceBadge from './ConfidenceBadge';

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

      <ul className="space-y-1.5">
        {candidate.facts.map((f) => (
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
