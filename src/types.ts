/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Verse {
  id: string;
  reference: string;
  text: string;
  quarter: number;
  week: number;
  hint?: string;
  date?: string;
  isCustom?: boolean;
  isPersonal?: boolean;
  title?: string;
  duration?: string;
  isActive?: boolean;
}

export type MemorizeStatus = 'not_started' | 'memorizing' | 'completed';

export interface VerseStatus {
  verseId: string;
  status: MemorizeStatus;
  streak: number;
  bestScore?: number;
  lastTested?: string;
}

export interface TestAttempt {
  id: string;
  verseId: string;
  reference: string;
  date: string;
  userText: string;
  correctText: string;
  score: number;
  mode: 'blank_fill' | 'full_write' | 'speak_along';
}

// 목사님 전체 성도 관리용 타입
export interface SaintProgress {
  id: string;
  name: string;
  completedCount: number;
  totalCount: number;
  achievementRate: number; // (completedCount / totalCount) * 100
  lastActivity: string;
}

export interface FaithJournalEntry {
  id: string;
  date: string;
  category: 'meditation' | 'sermon' | 'question' | '주일예배' | '주간예배' | '새벽예배' | '집회예배' | '개인묵상';
  title: string;
  passage?: string;
  content: string;
  prayer?: string;
}

export interface PersonalVerse {
  id: string;
  reference: string;
  text: string;
  hint?: string;
  dateAdded: string;
}

export interface PrayerEntry {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  dateAdded: string;
  answeredDate?: string;
}

export interface GongGwaVerse {
  id: string;
  reference: string;
  text: string;
  isKey: boolean;
  hint?: string;
}

export interface GongGwaCoreLesson {
  title: string;
  verse: string;
  desc: string;
}

export interface GongGwaQna {
  id: string;
  question: string;
  answer: string;
}

export interface GongGwa {
  id: string;
  title: string;
  scriptureReference: string;
  verses: GongGwaVerse[];
  coreLessons: GongGwaCoreLesson[];
  qnas: GongGwaQna[];
  introduction: string[];
}

export interface AnonymousPrayer {
  id: string;
  category: 'family' | 'health' | 'faith' | 'career' | 'others';
  title: string;
  content: string;
  date: string;
  amenCount: number;
  status: 'praying' | 'answered';
  isAnonymous?: boolean;
  authorName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author?: string;
  date: string;
  created_at?: string;
}

export interface VerseSubmission {
  id: string;
  userId: string;
  userName?: string;
  weeklyVerseId: string;
  verseReference?: string;
  verseText?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}


