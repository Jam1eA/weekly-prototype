import type { Step } from '../types';

const stepStatus: Record<Step, { label: string; className: string; dot: string }> = {
  0: { label: '회의 만들기', className: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  1: { label: '조건 확인', className: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  2: { label: '조건 확인', className: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  3: { label: '시간 찾는 중', className: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  4: { label: '시간 찾는 중', className: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  5: { label: '제안 중', className: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  6: { label: '제안 중', className: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  7: { label: '확정 완료', className: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  8: { label: '변경 발생', className: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  9: { label: '변경 발생', className: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  10: { label: '변경 제안 중', className: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  11: { label: '변경 완료', className: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
};

export default function StatusBadge({ step }: { step: Step }) {
  const s = stepStatus[step];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
