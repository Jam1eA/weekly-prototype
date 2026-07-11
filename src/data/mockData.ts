import type { Attendee, BusyBlock, CandidateSlot, ParticipantResponse } from '../types';

export const meetingInfo = {
  title: '프로젝트 요구사항 정리 회의',
  purpose: '요구사항 확인 및 의사결정',
  duration: '1시간',
  period: '다음 주 안 (7월 13일 – 7월 17일)',
};

// 아바타 이니셜 — 성씨를 영문 대문자로 표기한다
const SURNAME_INITIAL: Record<string, string> = {
  유: 'Y', 김: 'K', 박: 'P', 이: 'L', 최: 'C', 정: 'J', 한: 'H', 서: 'S', 임: 'L', 강: 'K',
};
export const initialOf = (name: string) => SURNAME_INITIAL[name[0]] ?? name[0].toUpperCase();

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

// 정하늘(선택 참석자)의 자동 응답 — 데모에서 시스템이 수신하는 응답 mock.
export const jungResponse: ParticipantResponse = {
  attendeeId: 'jung',
  summary: '화요일은 어렵고 수요일 오후만 가능해요',
  alternatives: [
    { id: 'wed15', label: '수요일 15:00 가능해요' },
    { id: 'wed16', label: '수요일 16:00 가능해요' },
  ],
};

export const roleDescriptions: Record<string, string> = {
  required: '이 사람이 확인해야 회의를 확정할 수 있어요',
  optional: '참석이 어려워도 회의를 진행할 수 있어요',
  share: '회의에 참석하지 않고 결과만 공유받아요',
};

export const candidates: CandidateSlot[] = [
  {
    id: 'c1',
    day: 1,
    startHour: 14,
    label: '화요일 14:00 - 15:00',
    shortLabel: '화 14:00',
    recommend: 'good',
    recommended: true,
    room: { name: '회의실 A', place: '본관 7층', capacity: '8인실' },
    avail: '충돌 없음',
    availabilityText: '캘린더상 6명 모두 비어 있어요 · 바로 잡을 수 있어요',
    attendeeStatus: {},
    facts: [
      { label: '필수 참석자', value: '겹치는 일정 없어요', ok: true },
      { label: '선택 참석자', value: '2명 캘린더상 가능', ok: true },
      { label: '회의실', value: '회의실 A · 본관 7층 · 8인실', ok: true },
    ],
    note: '캘린더에 걸리는 사람이 없어서, 확인 없이 바로 잡아도 괜찮아요',
  },
  {
    id: 'c2',
    day: 2,
    startHour: 13,
    label: '수요일 13:00 - 14:00',
    shortLabel: '수 13:00',
    // 정하늘 불가·최유리 비선호는 물어봐도 바뀌지 않는 확정된 사정 → 다른 시간 권장
    recommend: 'hard',
    room: { name: '회의실 B', place: '본관 3층', capacity: '6인실' },
    avail: '비선호 1명',
    availabilityText: '정하늘님이 어렵고, 최유리님은 점심 직후를 피하고 싶어 해요',
    attendeeStatus: { jung: 'no', choi: 'avoid' },
    facts: [
      { label: '필수 참석자', value: '겹치는 일정 없어요', ok: true },
      { label: '선택 참석자', value: '정하늘님 어려움 · 최유리님 비선호', ok: false },
      { label: '회의실', value: '회의실 B · 본관 3층 · 6인실', ok: true },
    ],
    note: '물어봐도 바뀌지 않는 사정이라, 다른 시간을 고르는 게 나아요',
  },
  {
    id: 'c3',
    day: 3,
    startHour: 11,
    label: '목요일 11:00 - 12:00',
    shortLabel: '목 11:00',
    // 외근 '가능성'은 본인에게 물어보면 풀리는 불확실성 → 그 사람에게만 확인
    recommend: 'check',
    room: { name: '회의실 C', place: '별관 2층', capacity: '4인실' },
    avail: '외근 가능성',
    availabilityText: '박서준님 외근 가능성이 있어 아직 확실하지 않아요',
    attendeeStatus: { park: 'unsure' },
    facts: [
      { label: '필수 참석자', value: '박서준님 외근 가능성', ok: false },
      { label: '선택 참석자', value: '2명 캘린더상 가능', ok: true },
      { label: '회의실', value: '회의실 C · 별관 2층 · 4인실', ok: true },
    ],
    note: '박서준님 외근이 아직 확실하지 않아요. 본인에게 물어보면 바로 알 수 있어요',
  },
];

export const alternatives: CandidateSlot[] = [
  {
    id: 'a1',
    day: 2,
    startHour: 15,
    label: '수요일 15:00 - 16:00',
    shortLabel: '수 15:00',
    recommend: 'good',
    recommended: true,
    room: { name: '회의실 B', place: '본관 3층', capacity: '6인실' },
    facts: [
      { label: '기존 응답 유효', value: '3명', ok: true },
      { label: '재확인 필요', value: '2명 (필수)', ok: false },
      { label: '회의실', value: '회의실 B · 본관 3층 · 6인실', ok: true },
      { label: '최신 일정', value: '충돌 없음', ok: true },
    ],
    // 기존 응답은 그 시간을 직접 언급한 경우에만 유효. 캘린더만 비어 있으면 재확인.
    recheck: [
      { id: 'kim', name: '김민준', state: 'valid', note: '응답 때 "다음 주 오후 모두 가능"' },
      { id: 'park', name: '박서준', state: 'recheck', note: '새 외근 일정과의 확인 필요' },
      { id: 'lee', name: '이지은', state: 'recheck', note: '화요일 14:00만 직접 확인함' },
      { id: 'choi', name: '최유리', state: 'valid', note: '응답 때 "오후 시간 모두 가능"' },
      { id: 'jung', name: '정하늘', state: 'valid', note: '"수요일 오후 가능" 응답 · 회의록 공유' },
    ],
  },
  {
    id: 'a2',
    day: 3,
    startHour: 10,
    label: '목요일 10:00 - 11:00',
    shortLabel: '목 10:00',
    recommend: 'check',
    room: null,
    facts: [
      { label: '기존 응답 유효', value: '1명', ok: false },
      { label: '재확인 필요', value: '4명', ok: false },
      { label: '회의실', value: '사용 가능한 회의실 없음', ok: false },
    ],
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
  { day: 2, startHour: 14, duration: 1, label: '김민준 · 바쁨', kind: 'busy' },
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

// 참여자 체험 인물: 이지은 PM (필수 참석자). 팀 캘린더의 '이지은 · 바쁨' 블록과 일치한다.
export const leeBlocks: BusyBlock[] = [
  { day: 0, startHour: 16, duration: 1, label: '리서치 콜', kind: 'busy' },
  { day: 1, startHour: 9, duration: 1, label: '스프린트 점검', kind: 'busy' },
  { day: 4, startHour: 13, duration: 5, label: '오후 반차', kind: 'leave' },
];

// 이지은 캘린더 기준 대안 시간 — '이 시간은 어려워요'를 선택한 뒤 대안 제안 단계에서 노출
export const leeAlternatives = [
  { id: 'wed15', label: '수요일 15:00 가능해요' },
  { id: 'wed16', label: '수요일 16:00 가능해요' },
];

// 이지은의 대안이 후보로 승격될 때 쓰는 슬롯 — 응답의 label을 키로 찾는다.
// 본인이 직접 언급한 시간이므로 이지은은 다시 묻지 않는다.
export const leeAltCandidates: Record<string, CandidateSlot> = {
  '수요일 15:00 가능해요': {
    id: 'lw15',
    day: 2,
    startHour: 15,
    label: '수요일 15:00 - 16:00',
    shortLabel: '수 15:00',
    recommend: 'good',
    suggestedBy: 'lee',
    room: { name: '회의실 B', place: '본관 3층', capacity: '6인실' },
    avail: '이지은님 제안',
    availabilityText: '이지은님이 대신 제안한 시간이에요 · 다른 5명 캘린더상 가능',
    attendeeStatus: {},
    summary: '5명 캘린더상 가능 · 이지은님은 직접 제안한 시간이에요',
    facts: [
      { label: '이지은 PM', value: '본인이 직접 제안', ok: true },
      { label: '다른 필수 참석자', value: '일정 충돌 없음', ok: true },
      { label: '회의실', value: '회의실 B · 본관 3층 · 6인실', ok: true },
    ],
    note: '이지은님이 직접 제안했고, 다른 사람들 캘린더도 비어 있어요',
  },
  '수요일 16:00 가능해요': {
    id: 'lw16',
    day: 2,
    startHour: 16,
    label: '수요일 16:00 - 17:00',
    shortLabel: '수 16:00',
    recommend: 'hard',
    suggestedBy: 'lee',
    room: { name: '회의실 C', place: '별관 2층', capacity: '4인실' },
    avail: '필수 충돌',
    availabilityText: '이지은님이 대신 제안했지만, 김민준님 캘린더에 일정이 있어요',
    attendeeStatus: { kim: 'no', choi: 'no' },
    summary: '4명 캘린더상 가능 · 이지은님은 직접 제안한 시간이에요',
    facts: [
      { label: '이지은 PM', value: '본인이 직접 제안', ok: true },
      { label: '필수 참석자', value: '김민준 일정 충돌', ok: false },
      { label: '회의실', value: '회의실 C · 별관 2층 · 4인실', ok: true },
    ],
    note: '이지은님 제안 시간이지만 필수 참석자 일정과 겹쳐 추천하기 어려워요.',
  },
};

// 이지은이 어렵다고 응답한 뒤의 화요일 후보 — 거절 응답을 반영해 강등된 상태
export const rejectedC1: CandidateSlot = {
  ...candidates[0],
  recommend: 'hard',
  availabilityText: '이지은님이 직접 어렵다고 응답했어요',
  attendeeStatus: { lee: 'no' },
  facts: [
    { label: '필수 참석자', value: '이지은 참석 어려움', ok: false },
    { label: '선택 참석자', value: '2명 캘린더상 가능', ok: true },
    { label: '회의실', value: '회의실 A · 본관 7층 · 8인실', ok: true },
  ],
  note: '이지은님이 어렵다고 응답해서, 이 시간은 확정하기 어려워요',
};
