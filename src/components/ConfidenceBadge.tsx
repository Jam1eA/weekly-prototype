import type { Recommend } from '../types';

// 3분류: 바로 잡기 / 물어보면 풀리는 불확실성만 확인 / 물어봐도 안 풀리면 다른 시간
const styles: Record<Recommend, { label: string; className: string }> = {
  good: { label: '바로 잡아도 돼요', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  check: { label: '확인이 필요해요', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '다른 시간이 나아요', className: 'bg-red-50 text-red-600 border-red-200' },
};

export default function ConfidenceBadge({ recommend }: { recommend: Recommend }) {
  const s = styles[recommend];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}
