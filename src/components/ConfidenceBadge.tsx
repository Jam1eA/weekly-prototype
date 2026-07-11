import type { Recommend } from '../types';

// 배지는 판단만 짧게 — '캘린더상'이라는 출처는 카드 설명 문장이 담당한다
const styles: Record<Recommend, { label: string; className: string }> = {
  good: { label: '잘 맞아요', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  check: { label: '확인이 필요해요', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '맞추기 어려워요', className: 'bg-red-50 text-red-600 border-red-200' },
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
