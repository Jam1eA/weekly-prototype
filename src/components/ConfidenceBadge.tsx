import type { Confidence } from '../types';
import { confidenceLabel } from '../data/mockData';

const styles: Record<Confidence, string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-600 border-red-200',
};

export default function ConfidenceBadge({
  confidence,
  prefix = true,
}: {
  confidence: Confidence;
  prefix?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold ${styles[confidence]}`}
    >
      {prefix ? '확정 가능도 ' : ''}
      {confidenceLabel[confidence]}
    </span>
  );
}
