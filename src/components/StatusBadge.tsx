import type { Step } from '../types';

// 상태 전이: 캘린더 기준 후보 → 참석자 확인 중 → 확정 준비 → 회의 확정
const stepStatus: Record<Step, { label: string; className: string; dot: string }> = {
  0: { label: '회의 만들기', className: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  1: { label: '조건 확인', className: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  2: { label: '참석자 확인', className: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  3: { label: '시간 고르는 중', className: 'bg-[#F4F9D0] text-[#6f7d00]', dot: 'bg-[#c9d631]' },
  4: { label: '시간 고르는 중', className: 'bg-[#F4F9D0] text-[#6f7d00]', dot: 'bg-[#c9d631]' },
  5: { label: '확인 요청 중', className: 'bg-[#F4F9D0] text-[#6f7d00]', dot: 'bg-[#c9d631]' },
  6: { label: '확인 요청 중', className: 'bg-[#F4F9D0] text-[#6f7d00]', dot: 'bg-[#c9d631]' },
  7: { label: '확정 완료', className: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  8: { label: '변경 필요', className: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  9: { label: '변경 필요', className: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  10: { label: '재확인 중', className: 'bg-[#F4F9D0] text-[#6f7d00]', dot: 'bg-[#c9d631]' },
  11: { label: '확정 완료', className: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
};

// 필수 참석자 응답이 모두 완료되면(ready) 확인 요청 중 → 확정 준비 완료로 전환
export default function StatusBadge({ step, ready = false }: { step: Step; ready?: boolean }) {
  const s =
    step === 6 && ready
      ? { label: '확정 준비 완료', className: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' }
      : stepStatus[step];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
