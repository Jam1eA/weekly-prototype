import type { Attendee, BusyBlock, CandidateSlot, ParticipantResponse } from '../types';

export const meetingInfo = {
  title: '프로젝트 요구사항 정리 회의',
  purpose: '요구사항 확인 및 의사결정',
  duration: '1시간',
  period: '다음 주 안 (7월 13일 – 7월 17일)',
};

export const weekDays = [
  { label: '월', date: '7/13' },
  { label: '화', date: '7/14' },
  { label: '수', date: '7/15' },
  { label: '목', date: '7/16' },
  { label: '금', date: '7/17' },
];

export const initialAttendees: Attendee[] = [
  {
    id: 'yu',
    name: '유나영',
    title: '기획자',
    description: '회의 주최자',
    role: 'required',
    isOrganizer: true,
  },
  {
    id: 'kim',
    name: '김민준',
    title: '팀장',
    description: '최종 의사결정자',
    role: 'required',
  },
  {
    id: 'park',
    name: '박서준',
    title: '개발 리드',
    description: '기술 가능 여부 확인 필요',
    role: 'required',
    note: '목요일 외근 일정 있음',
    noteSource: 'calendar',
  },
  {
    id: 'lee',
    name: '이지은',
    title: 'PM',
    description: '요구사항 정리 담당',
    role: 'required',
  },
  {
    id: 'choi',
    name: '최유리',
    title: '디자이너',
    description: '화면 영향 검토',
    role: 'optional',
    note: '점심 직후 회의 선호 낮음',
    noteSource: 'preference',
  },
  {
    id: 'jung',
    name: '정하늘',
    title: 'QA',
    description: '테스트 영향 검토',
    role: 'optional',
    // 정하늘의 제약(화요일 어려움 등)은 캘린더로 알 수 없는 정보라
    // 제안 발송 전에는 표시하지 않는다. 참여자 응답(jungResponse) 이후에만 노출.
  },
];

// 조직 디렉토리 — 회의 만들기에서 검색해 추가할 수 있는 사람들.
// 기본 6명 외의 인물은 다른 팀 동료로, 검색 결과에만 나타난다.
export const directoryExtras: Attendee[] = [
  {
    id: 'han',
    name: '한도윤',
    title: '마케터',
    description: '그로스팀',
    role: 'share',
  },
  {
    id: 'seo',
    name: '서지우',
    title: '데이터 분석가',
    description: '데이터팀',
    role: 'optional',
  },
  {
    id: 'lim',
    name: '임소라',
    title: '피플 매니저',
    description: '피플팀',
    role: 'optional',
  },
  {
    id: 'kang',
    name: '강현우',
    title: '세일즈 매니저',
    description: '세일즈팀',
    role: 'optional',
  },
];

// 정하늘이 참여자 응답 화면에서 보낸 조건.
// 주최자 화면(응답 확인)의 제약 표시와 참여자 화면의 대안 선택지가 모두 이 객체를 참조한다.
export const jungResponse: ParticipantResponse = {
  attendeeId: 'jung',
  summary: '화요일은 어렵고 수요일 오후만 가능해요',
  alternatives: [
    { id: 'wed15', label: '수요일 15:00 가능해요' },
    { id: 'wed16', label: '수요일 16:00 가능해요' },
  ],
};

export const roleDescriptions: Record<string, string> = {
  required: '이 사람이 불참하면 회의 시간을 다시 잡아야 해요.',
  optional: '불참해도 회의는 진행할 수 있어요.',
  share: '회의록을 공유할 대상으로 관리해요.',
};

export const candidates: CandidateSlot[] = [
  {
    id: 'c1',
    day: 1,
    startHour: 14,
    label: '화요일 14:00 - 15:00',
    shortLabel: '화 14:00',
    confidence: 'high',
    recommended: true,
    avail: '6명 모두 가능',
    availabilityText: '나를 포함한 6명 모두 참석할 수 있어요.',
    attendeeStatus: {},
    facts: [
      { label: '필수 참석자', value: '4명 모두 비어 있어요', ok: true },
      { label: '선택 참석자', value: '2명 모두 비어 있어요', ok: true },
      { label: '회의실', value: '회의실 A 사용 가능', ok: true },
      { label: '숨은 제약', value: '연차/외근 충돌 없음', ok: true },
      { label: '다시 조율할 가능성', value: '낮음', ok: true },
    ],
    reasons: [
      '꼭 참석해야 할 4명의 캘린더가 모두 비어 있어요.',
      '회의실 A를 사용할 수 있어요.',
      '연차나 외근 일정과 겹치지 않아요.',
      '점심 직후나 퇴근 직전처럼 선호가 낮은 시간대가 아니에요.',
      '선택 참석자의 캘린더도 모두 비어 있어요.',
    ],
    comparison:
      '수요일 13:00은 점심 직후 시간대라 비선호가 있고, 목요일 11:00은 외근 가능성이 있어요. 세 후보 중 이 시간이 다시 조율할 가능성이 가장 낮아요.',
    summary:
      '이 시간은 꼭 참석해야 할 사람과 회의실 조건이 모두 맞아서 다시 조율할 가능성이 낮아요.',
  },
  {
    id: 'c2',
    day: 2,
    startHour: 13,
    label: '수요일 13:00 - 14:00',
    shortLabel: '수 13:00',
    confidence: 'medium',
    avail: '5명 가능',
    availabilityText: '6명 중 5명 참석 가능 · 선택 참석자 1명 불가',
    attendeeStatus: { jung: 'no', choi: 'avoid' },
    facts: [
      { label: '필수 참석자', value: '4명 모두 비어 있어요', ok: true },
      { label: '선택 참석자', value: '최유리만 비어 있어요', ok: false },
      { label: '회의실', value: '회의실 B 사용 가능', ok: true },
      { label: '숨은 제약', value: '최유리 점심 직후 비선호', ok: false },
      { label: '다시 조율할 가능성', value: '보통', ok: false },
    ],
    reasons: [
      '꼭 참석해야 할 4명의 캘린더가 모두 비어 있어요.',
      '회의실 B를 사용할 수 있어요.',
      '다만 최유리님이 점심 직후 회의를 선호하지 않아요.',
      '다만 선택 참석자 중 최유리님만 캘린더가 비어 있어요.',
    ],
    comparison:
      '화요일 14:00과 비교하면 선택 참석자 참여가 적고, 점심 직후라 참석 경험이 떨어질 수 있어요.',
    summary:
      '회의는 성립하지만, 점심 직후 시간대라 참석 경험이 떨어질 수 있고 선택 참석자 참여가 줄어요.',
  },
  {
    id: 'c3',
    day: 3,
    startHour: 11,
    label: '목요일 11:00 - 12:00',
    shortLabel: '목 11:00',
    confidence: 'low',
    avail: '필수 1명 불확실',
    availabilityText: '박서준님의 외근 가능성 때문에 참석 여부가 불확실해요.',
    attendeeStatus: { park: 'unsure' },
    facts: [
      { label: '필수 참석자', value: '박서준 참석 불확실', ok: false },
      { label: '선택 참석자', value: '2명 모두 비어 있어요', ok: true },
      { label: '회의실', value: '사용 가능', ok: true },
      { label: '숨은 제약', value: '박서준 외근 가능성 (미확정)', ok: false },
      { label: '다시 조율할 가능성', value: '높음', ok: false },
    ],
    reasons: [
      '선택 참석자의 캘린더는 모두 비어 있어요.',
      '회의실은 사용할 수 있어요.',
      '다만 박서준님이 목요일에 외근을 갈 가능성이 높아요. 아직 시간이 정해지지 않아 하루 전체가 유동적이에요.',
      '꼭 참석해야 할 박서준님의 참석 여부를 지금은 확정할 수 없어요.',
    ],
    comparison:
      '화요일 14:00, 수요일 13:00과 달리 필수 참석자의 참석 여부가 불확실한 유일한 후보예요. 지금 확정하면 나중에 다시 조율하게 될 가능성이 높아요.',
    summary:
      '꼭 참석해야 할 사람의 참석 여부가 불확실해서, 지금 확정하면 다시 조율하게 될 가능성이 높아요.',
  },
];

export const alternatives: CandidateSlot[] = [
  {
    id: 'a1',
    day: 2,
    startHour: 15,
    label: '수요일 15:00 - 16:00',
    shortLabel: '수 15:00',
    confidence: 'high',
    recommended: true,
    facts: [
      { label: '필수 참석자', value: '4명 모두 현재 가능', ok: true },
      { label: '선택 참석자', value: '1명은 회의록 공유 가능', ok: true },
      { label: '회의실', value: '회의실 B 사용 가능', ok: true },
      { label: '최신 일정', value: '충돌 없음', ok: true },
      { label: '다시 조율할 가능성', value: '낮음', ok: true },
    ],
    reasons: [],
    summary: '',
  },
  {
    id: 'a2',
    day: 3,
    startHour: 10,
    label: '목요일 10:00 - 11:00',
    shortLabel: '목 10:00',
    confidence: 'medium',
    facts: [
      { label: '필수 참석자', value: '4명 모두 현재 가능', ok: true },
      { label: '선택 참석자', value: '2명 모두 가능', ok: true },
      { label: '회의실', value: '회의실 없음', ok: false },
      { label: '다시 조율할 가능성', value: '보통', ok: false },
    ],
    reasons: [],
    summary: '',
  },
];

// 캘린더 배경에 깔리는 팀원들의 기존 일정 (읽기 전용 mock)
// 다른 사람 일정은 제목을 볼 수 없어 '바쁨'으로만 표시된다.
// 연차·외근·반차 같은 부재 상태는 캘린더에 공개되는 정보라 그대로 보여준다.
export const busyBlocks: BusyBlock[] = [
  // 주최자(유나영) 본인 일정 — 참석자 선택 전에도 보인다
  { day: 0, startHour: 13, duration: 1, label: '기획 리뷰', kind: 'busy', mine: true },
  { day: 1, startHour: 10, duration: 1, label: '팀장 1:1', kind: 'busy', mine: true },
  { day: 0, startHour: 10, duration: 1, label: '팀 주간회의', kind: 'busy', mine: true },
  // 팀원들의 일정 (제목 비공개)
  { day: 0, startHour: 11, duration: 1, label: '박서준 · 바쁨', kind: 'busy' },
  // 3명 이상 겹치는 시간은 인원 수로 집계해 표시
  {
    day: 0,
    startHour: 14,
    duration: 1,
    label: '3명 일정 있음',
    kind: 'busy',
    count: 3,
    names: ['김민준', '이지은', '최유리'],
  },
  { day: 0, startHour: 15, duration: 1, label: '김민준 · 바쁨', kind: 'busy' },
  { day: 0, startHour: 16, duration: 1, label: '이지은 · 바쁨', kind: 'busy' },
  { day: 1, startHour: 9, duration: 1, label: '이지은 · 바쁨', kind: 'busy' },
  { day: 1, startHour: 16, duration: 1, label: '최유리 · 바쁨', kind: 'busy' },
  { day: 2, startHour: 10, duration: 2, label: '박서준 · 바쁨', kind: 'busy' },
  // 2명이 겹치는 시간은 나란히 표시
  { day: 2, startHour: 16, duration: 1, label: '김민준 · 바쁨', kind: 'busy', col: 0 },
  { day: 2, startHour: 16, duration: 1, label: '최유리 · 바쁨', kind: 'busy', col: 1 },
  // 변경 발생 전: 목요일은 시간 미정의 외근 '가능성'만 있는 상태
  { day: 3, startHour: 9, duration: 9, label: '박서준 · 외근 가능성', kind: 'tentative', stage: 'pre' },
  // 변경 발생 후: 외근이 화요일 오후로 확정되면서 기존 회의와 충돌
  { day: 1, startHour: 13, duration: 4, label: '박서준 · 외근 확정', kind: 'out', stage: 'post' },
  { day: 4, startHour: 9, duration: 9, label: '정하늘 · 연차', kind: 'leave' },
  { day: 4, startHour: 9, duration: 2, label: '박서준 · 바쁨', kind: 'busy' },
  { day: 4, startHour: 11, duration: 1, label: '김민준 · 바쁨', kind: 'busy' },
  { day: 4, startHour: 13, duration: 5, label: '이지은 · 오후 반차', kind: 'busy' },
];

// 점심시간 — 모든 캘린더에 옅은 앰버 밴드로 깔린다 (피하고 싶은 시간과 같은 색 언어)
export const LUNCH_START = 12;
export const LUNCH_END = 13;

// 참여자(정하늘) 본인의 캘린더 일정. 본인 일정이라 제목이 보인다.
export const jungBlocks: BusyBlock[] = [
  { day: 0, startHour: 10, duration: 1, label: '스프린트 회고', kind: 'busy' },
  { day: 2, startHour: 10, duration: 1, label: 'QA 싱크', kind: 'busy' },
  { day: 3, startHour: 16, duration: 1, label: '테스트 케이스 리뷰', kind: 'busy' },
  { day: 4, startHour: 9, duration: 9, label: '연차', kind: 'leave' },
];

export const confidenceLabel: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};
