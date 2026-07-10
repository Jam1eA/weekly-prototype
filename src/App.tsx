import { useEffect, useState } from 'react';
import type { Role, Step } from './types';
import {
  alternatives,
  candidates,
  directoryExtras,
  initialAttendees,
  meetingInfo as defaultMeeting,
} from './data/mockData';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CalendarGrid from './components/CalendarGrid';
import MeetingPanel from './components/MeetingPanel';
import ParticipantView from './components/ParticipantView';
import type { JungDetail } from './components/ParticipantView';

export default function App() {
  const [step, setStep] = useState<Step>(0);
  // 새 회의 만들기를 누르기 전에는 빈 상태(내 캘린더)로 시작
  const [started, setStarted] = useState(false);
  const [attendees, setAttendees] = useState(initialAttendees);
  // 회의 만들기에서 입력하는 회의 제목·목적
  const [meeting, setMeeting] = useState({
    title: defaultMeeting.title,
    purpose: defaultMeeting.purpose,
  });
  const [selectedId, setSelectedId] = useState('c1');
  // 제안 시점의 후보를 고정 (이후 단계에서 계속 참조)
  const [proposedId, setProposedId] = useState('c1');
  // 회의 확정 후 도착하는 변경 알림
  const [alertReady, setAlertReady] = useState(false);
  // 참여자(정하늘) 화면 전환과 응답 상태
  const [participantOpen, setParticipantOpen] = useState(false);
  const [jungAnswer, setJungAnswer] = useState<'ok' | 'busy' | null>(null);
  // 정하늘이 실제로 입력한 응답 내용 (주최자 화면 요약이 이 데이터에서만 파생된다)
  const [jungDetail, setJungDetail] = useState<JungDetail | null>(null);

  const proposed = candidates.find((c) => c.id === proposedId) ?? candidates[0];

  useEffect(() => {
    if (step !== 7) return;
    const t = setTimeout(() => setAlertReady(true), 5000);
    return () => clearTimeout(t);
  }, [step]);

  const hasAlert = alertReady && step === 7;
  const openAlert = () => setStep(8);

  const handleChangeRole = (id: string, role: Role) => {
    setAttendees((prev) => prev.map((a) => (a.id === id ? { ...a, role } : a)));
  };

  // 회의 만들기에서 참석자를 추가/제외 (주최자는 제외 불가)
  const handleToggleAttendee = (id: string) => {
    setAttendees((prev) => {
      const existing = prev.find((a) => a.id === id);
      if (existing) {
        return existing.isOrganizer ? prev : prev.filter((a) => a.id !== id);
      }
      const person = [...initialAttendees, ...directoryExtras].find((a) => a.id === id);
      // 새로 추가하는 사람은 기본 '필수'로 들어온다 (예외만 역할을 바꾸는 방식)
      return person ? [...prev, { ...person, role: 'required' as Role }] : prev;
    });
  };

  const handleNext = (next: Step) => {
    if (next === 5) setProposedId(selectedId);
    setStep(next);
  };

  const handleReset = () => {
    setStep(0);
    setStarted(false);
    setAttendees(initialAttendees);
    setMeeting({ title: defaultMeeting.title, purpose: defaultMeeting.purpose });
    setSelectedId('c1');
    setProposedId('c1');
    setAlertReady(false);
    setParticipantOpen(false);
    setJungAnswer(null);
    setJungDetail(null);
  };

  // 참여자 화면이 열려 있으면 앱 전체가 정하늘의 화면으로 전환된다
  if (participantOpen) {
    return (
      <ParticipantView
        proposed={proposed}
        meeting={meeting}
        attendees={attendees}
        onComplete={(a, d) => {
          setJungAnswer(a);
          setJungDetail(d);
        }}
        onReturn={() => setParticipantOpen(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        hasAlert={hasAlert}
        onAlertClick={openAlert}
        started={started}
        attendees={attendees}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          attendees={attendees}
          started={started}
          onStart={() => setStarted(true)}
        />
        <CalendarGrid
          step={step}
          started={started}
          candidates={candidates}
          selectedId={selectedId}
          proposed={proposed}
          alternatives={alternatives}
          onSelectCandidate={setSelectedId}
        />
        {started && (
        <MeetingPanel
          step={step}
          meeting={meeting}
          onChangeMeeting={setMeeting}
          hasAlert={hasAlert}
          onOpenAlert={openAlert}
          jungAnswer={jungAnswer}
          jungDetail={jungDetail}
          onEnterParticipant={() => setParticipantOpen(true)}
          attendees={attendees}
          candidates={candidates}
          alternatives={alternatives}
          selectedId={selectedId}
          proposed={proposed}
          onChangeRole={handleChangeRole}
          onToggleAttendee={handleToggleAttendee}
          onSelectCandidate={setSelectedId}
          onNext={handleNext}
          onReset={handleReset}
        />
        )}
      </div>
    </div>
  );
}
