export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type Role = 'required' | 'optional' | 'share';

export interface Attendee {
  id: string;
  name: string;
  title: string;
  description: string;
  role: Role;
  isOrganizer?: boolean; // 주최자는 역할 변경 불가, 항상 필수
  note?: string; // 숨은 제약이나 선호
  noteSource?: 'calendar' | 'preference'; // 제안 발송 전에 알 수 있는 정보의 출처
}

// 참여자가 응답 화면에서 보낸 조건. 주최자 화면의 제약 표시가 이 데이터를 참조한다.
export interface ParticipantResponse {
  attendeeId: string;
  summary: string; // 주최자 화면에 표시되는 요약 문구
  alternatives: { id: string; label: string }[]; // 참여자 캘린더 기준으로 미리 계산된 대안
}

// 응답 전 후보는 캘린더 기준 추정일 뿐이다
export type Recommend = 'good' | 'check' | 'hard';

export interface CandidateSlot {
  id: string;
  day: number; // 0 = 월요일
  startHour: number;
  label: string; // 예: 화요일 14:00 - 15:00
  shortLabel: string; // 캘린더 블록용
  recommend: Recommend;
  recommended?: boolean;
  // 회의실 상세 — 판단에 필요한 최소 정보만 (설비·예약 현황은 범위 밖)
  room?: { name: string; place: string; capacity: string } | null;
  // 캘린더 블록에 표시되는 짧은 가용 인원 요약 (예: 6명 모두 가능)
  avail?: string;
  // 후보 카드 헤더 아래 한 줄 요약 (예: 6명 중 5명 참석 가능 · 필수 1명 불가)
  availabilityText?: string;
  // 참석자별 상태 (없으면 참석 가능)
  // no = 절대 불가, avoid = 비선호, unsure = 불확실 (외근 가능성 등)
  attendeeStatus?: Record<string, 'no' | 'avoid' | 'unsure'>;
  facts: { label: string; value: string; ok: boolean }[];
  // 대체 후보에서: 참석자별 기존 응답 유효 여부 (직접 입력한 경우에만 유효)
  recheck?: { id: string; name: string; state: 'valid' | 'recheck'; note: string }[];
  note?: string; // 상세 화면 보조 한 문장
}

export interface BusyBlock {
  day: number;
  startHour: number;
  duration: number;
  label: string;
  kind: 'busy' | 'out' | 'leave' | 'tentative';
  // pre: 변경 발생(Step 8) 전까지만 표시, post: 변경 발생 이후에만 표시
  stage?: 'pre' | 'post';
  // 주최자 본인의 일정 — 참석자를 선택하기 전(회의 만들기)에도 보인다
  mine?: boolean;
  // 같은 시간에 일정이 겹칠 때 좌/우 반폭으로 나란히 표시 (2명까지)
  col?: 0 | 1;
  // 3명 이상 겹치는 시간은 개별 블록 대신 인원 수로 집계해 표시
  count?: number;
  names?: string[];
}
