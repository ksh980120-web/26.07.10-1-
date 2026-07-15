import React from 'react';
import { ClipboardList } from 'lucide-react';
import { Verse, VerseStatus, MemorizeStatus } from '../types';

interface PersonalFaithNoteProps {
  isGuest?: boolean;
  currentUserId?: string | null;
  verses: Verse[];
  verseStatuses: { [key: string]: VerseStatus };
  onAddPersonalVerse: (verse: Omit<Verse, 'id' | 'isPersonal' | 'quarter' | 'week'>) => void;
  onUpdatePersonalVerse?: (id: string, updatedFields: Partial<Verse>) => void;
  onDeletePersonalVerse: (id: string) => void;
  onStatusChange: (id: string, status: MemorizeStatus) => void;
  onStartBlankPractice: (id: string) => void;
  onStartWriteTest: (id: string) => void;
  onStartSpeakAlong: (id: string) => void;
}

export default function PersonalFaithNote({}: PersonalFaithNoteProps) {
  return (
    <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-8 sm:p-12 shadow-sm text-center font-sans space-y-5 max-w-lg mx-auto my-12" id="personal-faith-note-ready">
      <div className="w-16 h-16 bg-[#F5F5F0] text-[#8A9A5B] rounded-full flex items-center justify-center mx-auto text-3xl shadow-xs border border-[#E9E3D8]/40">
        <ClipboardList className="w-8 h-8 text-[#8A9A5B]" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-serif font-bold text-[#5A5A40]">나의 신앙노트</h3>
        <p className="text-xs sm:text-sm text-[#7A7A6A] leading-relaxed">
          개인 말씀 묵상, 감사 일기, 예배 설교 요약 등을 스스로 기록하고 관리할 수 있는 성도님 전용 신앙 성장 공간입니다.
        </p>
      </div>
      <div className="pt-2">
        <div className="py-3 px-6 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl inline-flex items-center gap-2 text-xs font-bold text-[#8A9A5B]">
          <span className="animate-pulse">⏳</span>
          <span>서비스 준비중입니다. 조금만 기다려 주세요!</span>
        </div>
      </div>
    </div>
  );
}
