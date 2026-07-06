export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

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

export type Confidence = 'high' | 'medium' | 'low';

export interface CandidateSlot {
  id: string;
  day: number; // 0 = 월요일
  startHour: number;
  label: string; // 예: 화요일 14:00 - 15:00
  shortLabel: string; // 캘린더 블록용
  confidence: Confidence;
  recommended?: boolean;
  facts: { label: string; value: string; ok: boolean }[];
  reasons: string[];
  comparison?: string;
  summary: string;
}

export interface BusyBlock {
  day: number;
  startHour: number;
  duration: number;
  label: string;
  kind: 'busy' | 'out' | 'leave' | 'tentative';
  // pre: 변경 발생(Step 8) 전까지만 표시, post: 변경 발생 이후에만 표시
  stage?: 'pre' | 'post';
}
