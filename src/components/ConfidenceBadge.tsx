import type { Recommend } from '../types';

// 응답 전 후보는 캘린더 기준 추정임을 라벨로 드러낸다
const styles: Record<Recommend, { label: string; className: string }> = {
  good: { label: '캘린더 기준 추천', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  check: { label: '확인 필요', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '추천 어려움', className: 'bg-red-50 text-red-600 border-red-200' },
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
