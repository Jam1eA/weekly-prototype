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
  // 응답이 필요한 필수 인원을 카드의 1급 정보로 끌어올린다
  const direct = candidate.facts.find((f) => f.label === '필수 참석자 응답');
  const otherFacts = candidate.facts.filter((f) => f.label !== '필수 참석자 응답');

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border bg-white p-4 transition-all ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-100'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-zinc-900">{candidate.label}</p>
        <ConfidenceBadge recommend={candidate.recommend} />
      </div>

      {candidate.availabilityText && (
        <p className="-mt-1 mb-2.5 text-xs text-zinc-500">{candidate.availabilityText}</p>
      )}

      {direct && (
        <div className="mb-2.5 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
          <span className="text-xs font-medium text-amber-700">필수 참석자 응답</span>
          <span className="text-xs font-bold text-amber-700">{direct.value}</span>
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
            <span className="text-zinc-500">{f.label}</span>
            <span className="ml-auto text-right font-medium text-zinc-700">{f.value}</span>
          </li>
        ))}
      </ul>

      {onDetail && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetail();
          }}
          className="mt-3 w-full rounded-lg border border-zinc-200 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
        >
          {detailLabel}
        </button>
      )}
    </div>
  );
}
