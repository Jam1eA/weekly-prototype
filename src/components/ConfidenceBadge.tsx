import type { Recommend } from '../types';

// 3분류: 바로 잡기 / 물어보면 풀리는 불확실성만 확인 / 물어봐도 안 풀리면 다른 시간.
// 색 규칙: 확정(진한 초록)과 구분되도록 추천에는 연한 라임·앰버·회색만 쓴다.
// 빨강은 여기 쓰지 않는다 — 필수 참석자 실제 불가일 때만 아껴둔다.
const styles: Record<Recommend, { label: string; className: string }> = {
  good: { label: '바로 잡아도 돼요', className: 'bg-[#F4F9D0] text-[#4f5a00] border-[#dfe89e]' },
  check: { label: '확인이 필요해요', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '다른 시간이 나아요', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
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
