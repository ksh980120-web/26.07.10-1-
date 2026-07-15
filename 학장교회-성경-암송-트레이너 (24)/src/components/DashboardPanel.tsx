import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Trophy,
  Flame,
  Settings,
  BookMarked,
  Sparkles,
  ClipboardList,
  Mic,
  Edit3,
  Trash2,
  Heart,
  Megaphone,
  Plus,
  X,
  Eye,
  EyeOff,
  Award,
  Check
} from 'lucide-react';

import { Verse, VerseStatus, MemorizeStatus, GongGwa, AnonymousPrayer, Announcement, VerseSubmission, Sermon, FaithJournalEntry, FamilyWorship } from '../types';
import GongGwaPanel from './GongGwaPanel';
import AnonymousPrayerPanel from './AnonymousPrayerPanel';
import PersonalFaithNote from './PersonalFaithNote';
import SermonPanel from './SermonPanel';
import BibleReadingPanel from './BibleReadingPanel';
import MyPagePanel from './MyPagePanel';
import { Home, User, Compass } from 'lucide-react';

const ComingSoonPanel = ({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) => {
  return (
    <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-8 sm:p-12 text-center space-y-5 animate-fadeIn max-w-2xl mx-auto my-6 font-sans">
      <div className="w-16 h-16 mx-auto bg-[#F9F7F2] text-[#8A9A5B] rounded-full flex items-center justify-center text-2xl border border-[#E9E3D8]/40 shadow-xs">
        <Icon className="w-6 h-6 text-[#8A9A5B]" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-sans font-bold text-[#5A5A40]">{title}</h3>
        <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed">{desc}</p>
      </div>
      <div className="pt-2">
        <span className="text-[10px] bg-[#EAF2D7] text-[#5A5A40] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider font-mono border border-[#DCE8C3]/60">
          서비스 준비중입니다
        </span>
      </div>
    </div>
  );
};

interface DashboardPanelProps {
  verses: Verse[];
  verseStatuses: { [key: string]: VerseStatus };
  streak: number;
  currentUserName: string;
  userRole: string | null;
  currentUserId: string;
  isCommonDataLoading: boolean;
  commonDataError: string | null;

  pinnedVerseId: string;
  pinnedMonthVerseId: string;
  blurredCards: { [key: string]: boolean };
  verseSortOrder: 'latest' | 'oldest';
  selectedQuarter: number;

  onPinVerse: (id: string) => void;
  onPinMonthVerse: (id: string) => void;
  onToggleBlurCard: (id: string) => void;
  onStartBlankPractice: (id: string) => void;
  onStartWriteTest: (id: string) => void;
  onStartSpeakAlong: (id: string) => void;
  onSubmitVerseToPastor: (weeklyVerseId: string) => void;
  submissionLoading: { [verseId: string]: boolean };
  submissionError: { [verseId: string]: string | null };
  userSubmissions: VerseSubmission[];

  // Admin Actions
  isAdminAuthenticated: boolean;
  onEditVerse: (verse: Verse) => void;
  onDeleteVerse: (id: string) => void;

  // Search & Filter Actions
  setVerseSortOrder: (order: 'latest' | 'oldest') => void;
  setSelectedQuarter: (quarter: number) => void;

  // Tab layout
  activeMainTab: 'community' | 'gonggwa' | 'personal' | 'prayer' | 'sermon';
  setActiveMainTab: (tab: 'community' | 'gonggwa' | 'personal' | 'prayer' | 'sermon') => void;

  // Additional Data
  gongGwaLessons: GongGwa[];
  prayers: AnonymousPrayer[];
  onAddPrayer: (entry: AnonymousPrayer) => void;
  onIncrementAmen: (id: string, isAdding?: boolean) => void;
  onUpdatePrayer: (id: string, updatedFields: Partial<AnonymousPrayer>) => void;
  onTogglePrayerStatus: (id: string) => void;
  onDeletePrayer?: (id: string) => void;
  sermons: Sermon[];
  familyWorships?: FamilyWorship[];

  // Personal Faith Notes Actions
  onAddPersonalVerse: (verse: Omit<Verse, 'id' | 'isPersonal' | 'quarter' | 'week'>) => void;
  onUpdatePersonalVerse?: (id: string, updatedFields: Partial<Verse>) => void;
  onStatusChange: (id: string, status: MemorizeStatus) => void;

  // Announcement Actions
  announcements: Announcement[];
  showAddAnnForm: boolean;
  setShowAddAnnForm: (show: boolean) => void;
  newAnnTitle: string;
  setNewAnnTitle: (title: string) => void;
  newAnnContent: string;
  setNewAnnContent: (content: string) => void;
  newAnnAuthor: string;
  setNewAnnAuthor: (author: string) => void;
  onNewAnnSubmit: (e: React.FormEvent) => void;
  onDeleteAnnouncement: (id: string) => void;

  // Modal deletion helper
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  journals?: FaithJournalEntry[];
}

export default function DashboardPanel({
  verses,
  verseStatuses,
  streak,
  currentUserName,
  userRole,
  currentUserId,
  isCommonDataLoading,
  commonDataError,
  pinnedVerseId,
  pinnedMonthVerseId,
  blurredCards,
  verseSortOrder,
  selectedQuarter,
  onPinVerse,
  onPinMonthVerse,
  onToggleBlurCard,
  onStartBlankPractice,
  onStartWriteTest,
  onStartSpeakAlong,
  onSubmitVerseToPastor,
  submissionLoading,
  submissionError,
  userSubmissions,
  isAdminAuthenticated,
  onEditVerse,
  onDeleteVerse,
  setVerseSortOrder,
  setSelectedQuarter,
  activeMainTab,
  setActiveMainTab,
  gongGwaLessons,
  prayers,
  onAddPrayer,
  onIncrementAmen,
  onUpdatePrayer,
  onTogglePrayerStatus,
  onDeletePrayer,
  sermons,
  familyWorships = [],
  onAddPersonalVerse,
  onUpdatePersonalVerse,
  onStatusChange,
  announcements,
  showAddAnnForm,
  setShowAddAnnForm,
  newAnnTitle,
  setNewAnnTitle,
  newAnnContent,
  setNewAnnContent,
  newAnnAuthor,
  setNewAnnAuthor,
  onNewAnnSubmit,
  onDeleteAnnouncement,
  deleteConfirmId,
  setDeleteConfirmId,
  journals = [],
}: DashboardPanelProps) {

  // --- COMPUTE PROGRESS METRICS ---
  // Manna V2 navigation tabs for General saints
  const [currentTab, setCurrentTab] = React.useState<'home' | 'mypage' | 'announcements' | 'verses' | 'bible' | 'prayer' | 'gonggwa' | 'sermon'>('home');

  // --- INLINE TESTING STATE FOR PINNED VERSE ---
  const [isInlineTesting, setIsInlineTesting] = React.useState(false);
  const [inlineLevel, setInlineLevel] = React.useState(40); // default: 40% blanks
  const [inlineUserAnswers, setInlineUserAnswers] = React.useState<{ [key: number]: string }>({});
  const [inlineShowResults, setInlineShowResults] = React.useState(false);
  const [annSearchQuery, setAnnSearchQuery] = React.useState('');

  const [headerAvatarId, setHeaderAvatarId] = React.useState(() => {
    return localStorage.getItem(`manna_avatar_${currentUserId}`) || 'olive';
  });
  const [headerCustomPhoto, setHeaderCustomPhoto] = React.useState(() => {
    return localStorage.getItem(`manna_custom_photo_${currentUserId}`) || null;
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      setHeaderAvatarId(localStorage.getItem(`manna_avatar_${currentUserId}`) || 'olive');
      setHeaderCustomPhoto(localStorage.getItem(`manna_custom_photo_${currentUserId}`) || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUserId]);

  const communityVerses = verses.filter(v => !v.isPersonal);
  const totalCount = communityVerses.length;
  const statusList = Object.values(verseStatuses).filter(s => {
    const v = verses.find(x => x.id === s.verseId);
    return v && !v.isPersonal;
  });
  const completedCount = statusList.filter(s => s.status === 'completed').length;
  const memorizingCount = statusList.filter(s => s.status === 'memorizing').length;
  const notStartedCount = totalCount - completedCount - memorizingCount;

  // Find the verse with the latest date to be marked as "금주암송성구"
  const latestVerse = [...verses]
    .filter(v => v.date && !v.isPersonal)
    .sort((a, b) => b.date!.localeCompare(a.date!))[0];
  const latestVerseId = latestVerse ? latestVerse.id : '';

  // Find the pinned/weekly verse object. Default to latest verse if none is explicitly pinned.
  const activePinnedId = pinnedVerseId || latestVerseId;
  const pinnedVerse = verses.find(v => v.id === activePinnedId);

  const pinnedWords = React.useMemo(() => {
    if (!pinnedVerse) return [];
    
    // Split by spaces and handle words
    const tokens = pinnedVerse.text.split(/(\s+)/);
    
    // Filter out only the real words (non-space) for blanking
    const realWords: { text: string; index: number }[] = [];
    tokens.forEach((tok, idx) => {
      if (!/^\s+$/.test(tok)) {
        realWords.push({ text: tok, index: idx });
      }
    });

    const blankCount = Math.max(1, Math.round((realWords.length * inlineLevel) / 100));
    const blankIndices = new Set<number>();
    
    for (let i = 0; i < blankCount; i++) {
      const targetIdx = Math.floor((i * realWords.length) / blankCount);
      if (realWords[targetIdx]) {
        blankIndices.add(realWords[targetIdx].index);
      }
    }

    return tokens.map((text, idx) => {
      const isSpace = /^\s+$/.test(text);
      const isBlank = blankIndices.has(idx);
      return {
        id: idx,
        text,
        isSpace,
        isBlank
      };
    });
  }, [pinnedVerse, inlineLevel]);

  const inlineScore = React.useMemo(() => {
    const blanks = pinnedWords.filter(w => w.isBlank);
    if (blanks.length === 0) return 100;
    
    let correctCount = 0;
    blanks.forEach(w => {
      const userAns = (inlineUserAnswers[w.id] || '').trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'「」]/g,"").toLowerCase();
      const correctAns = w.text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'「」]/g,"").toLowerCase();
      if (userAns === correctAns) {
        correctCount++;
      }
    });

    return Math.round((correctCount / blanks.length) * 100);
  }, [pinnedWords, inlineUserAnswers]);

  // 1. 최신 설교
  const latestSermon = React.useMemo(() => {
    if (!sermons || sermons.length === 0) return null;
    return [...sermons].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [sermons]);

  // 2. 최신 공과
  const latestLesson = React.useMemo(() => {
    if (!gongGwaLessons || gongGwaLessons.length === 0) return null;
    return gongGwaLessons[0];
  }, [gongGwaLessons]);

  // 3. 나의 최신 신앙노트
  const latestJournal = React.useMemo(() => {
    if (!journals || journals.length === 0) return null;
    return journals[0];
  }, [journals]);

  // 4. 금주 묵상 생성 logic
  const weeklyMeditation = React.useMemo(() => {
    const sermonTitle = latestSermon?.title || "선포된 주일 말씀";
    const sermonPassage = latestSermon?.passage || pinnedVerse?.reference || "성경 본문";
    const sermonContent = latestSermon?.content || "";
    
    const lessonTitle = latestLesson?.title || "금주 공과 배움터";
    const lessonContent = latestLesson?.content || "";

    const verseRef = pinnedVerse?.reference || "이번주 암송성구";
    const verseText = pinnedVerse?.text || "주님의 말씀";

    let summaryText = `주일 설교 [${sermonTitle}] (${sermonPassage}) 말씀과 공과 [${lessonTitle}], 그리고 암송 구절 [${verseRef}]을 통해 주신 언약을 요약합니다. `;
    if (sermonContent) {
      summaryText += `강단에서 흘러나온 말씀은 "${sermonContent.slice(0, 150)}..."의 핵심 진리를 선포하고 있습니다.`;
    } else {
      summaryText += `예배를 통해 성령님이 깨닫게 하신 배움의 진리를 묵상하며, 한 주를 살아갈 귀한 영적 길잡이로 삼습니다.`;
    }

    let meditationText = `이번 주 우리는 "${sermonPassage}" 말씀과 암송 구절 [${verseRef}]을 삶의 중심으로 삼고 살아갑니다. `;
    if (lessonContent) {
      meditationText += `공과 배움터 "${lessonTitle}"에서 다룬 "${lessonContent.slice(0, 150)}..."의 원리처럼, `;
    }
    meditationText += `구체적인 상황 속에서 흔들리지 않고 성경적인 가치관을 지키며 예수님의 온유함과 겸손함을 가슴에 품는 시간입니다.`;

    let applicationText = `1. 이번 주 암송 성구 [${verseRef}] ("${verseText.slice(0, 35)}...")을 가사나 입술에 늘 머물도록 소리 내어 고백합니다.\n2. 예배에서 정립한 사랑과 섬김의 결단을 가장 가까운 가족과 교우들에게 온화한 언어로 먼저 실천합니다.`;

    let prayerText = `참 좋으신 하나님 아버지, 풍성한 예배의 말씀과 공과 배움터를 통해 말씀의 반석 위에 서게 하시니 감사드립니다. [${verseRef}] 암송 구절이 지혜와 무기가 되게 하시고, 매일 주님의 성결한 백성으로 자라게 하옵소서. 예수님의 이름으로 기도드립니다. 아멘.`;

    return {
      source: "금주 설교 + 공과 + 암송성구 🕊️",
      sourceDetail: `설교: ${sermonTitle} | 공과: ${lessonTitle} | 성구: ${verseRef}`,
      summary: summaryText,
      meditation: meditationText,
      application: applicationText,
      prayer: prayerText
    };
  }, [latestSermon, latestLesson, pinnedVerse]);

  // Calculate Family Worship D-Day for display
  const upcomingFamilyWorship = React.useMemo(() => {
    if (!familyWorships || familyWorships.length === 0) return null;
    
    // Sort by date (ascending) to find the next scheduled event
    const sorted = [...familyWorships]
      .filter(f => f.date && f.isActive)
      .sort((a, b) => a.date.localeCompare(b.date));

    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. First, check if the current user is specified for any worships.
    // However, since we want to show the closest scheduled worship for the church or the user:
    // Let's find the nearest active worship from today onwards.
    let target = sorted.find(f => f.date >= todayStr);

    // If all are in the past, fall back to the most recent one
    if (!target && sorted.length > 0) {
      target = sorted[sorted.length - 1];
    }

    if (!target) return null;

    // Parse target date and today's date safely
    const targetDate = new Date(target.date + 'T00:00:00');
    const todayDate = new Date(todayStr + 'T00:00:00');
    const diffMs = targetDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let dDayStr = '';
    if (diffDays === 0) {
      dDayStr = 'D-Day (오늘)';
    } else if (diffDays > 0) {
      dDayStr = `D-${diffDays}`;
    } else {
      dDayStr = `${Math.abs(diffDays)}일 전 예배`;
    }

    // Check if the current user is assigned as a selected member
    const isAssignedToMe = target.selectedMembers && target.selectedMembers.includes(currentUserId);

    return {
      ...target,
      dDay: dDayStr,
      isUpcoming: diffDays >= 0,
      isAssignedToMe
    };
  }, [familyWorships, currentUserId]);

  const bibleProgressCount = React.useMemo(() => {
    try {
      const progressRaw = localStorage.getItem(`manna_bible_progress_${currentUserId}`);
      if (progressRaw) {
        const progressObj = JSON.parse(progressRaw);
        return Object.keys(progressObj).filter(k => progressObj[k] === true).length;
      }
    } catch (e) {}
    return 0;
  }, [currentUserId]);

  const bibleProgressPercentage = React.useMemo(() => {
    const totalChapters = 1189;
    return Math.round((bibleProgressCount / totalChapters) * 100);
  }, [bibleProgressCount]);

  // Find the monthly pinned verse object.
  const pinnedMonthVerse = verses.find(v => v.id === pinnedMonthVerseId);

  // Filter out personal verses for general list
  const filteredVerses = (selectedQuarter === 0
    ? verses
    : verses.filter(v => v.quarter === selectedQuarter)
  ).filter(v => !v.isPersonal);

  // Sorting: Prioritize pinned/weekly verse, then sorted by date or quarter/week based on selection
  const sortedVerses = [...filteredVerses].sort((a, b) => {
    const isAPinned = a.id === activePinnedId ? 1 : 0;
    const isBPinned = b.id === activePinnedId ? 1 : 0;
    if (isAPinned !== isBPinned) return isBPinned - isAPinned;

    if (verseSortOrder === 'latest') {
      if (a.date && b.date) {
        return b.date.localeCompare(a.date);
      }
      if (a.date) return -1;
      if (b.date) return 1;
      if (a.quarter !== b.quarter) return b.quarter - a.quarter;
      return b.week - a.week;
    } else {
      if (a.date && b.date) {
        return a.date.localeCompare(b.date);
      }
      if (a.date) return 1;
      if (b.date) return -1;
      if (a.quarter !== b.quarter) return a.quarter - b.quarter;
      return a.week - b.week;
    }
  });

  // State to track if the meditation guide is expanded/collapsed
  const [showMeditationIntro, setShowMeditationIntro] = React.useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans" id="manna-v2-main-grid">
      
      {/* SIDEBAR NAVIGATION COLUMN (3 COLS) */}
      <div className="lg:col-span-3 bg-white border border-[#E9E3D8] rounded-[24px] p-5 shadow-xs space-y-6 lg:sticky lg:top-6" id="manna-sidebar">
        
        {/* PROFILE HEADER IN SIDEBAR */}
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          {headerCustomPhoto ? (
            <img 
              src={headerCustomPhoto} 
              alt="Profile" 
              className="w-12 h-12 rounded-full object-cover border-2 border-[#8A9A5B]/30" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg border border-dashed border-[#8A9A5B]/30 bg-stone-50 select-none">
              🌿
            </div>
          )}
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-[#8A9A5B] bg-[#EAF2D7] px-2 py-0.2 rounded-full">성도</span>
            <h4 className="text-xs font-serif font-extrabold text-[#5A5A40] truncate max-w-[120px]">
              {currentUserName || '성도님'}
            </h4>
          </div>
        </div>

        {/* NAVIGATION MENUS */}
        <div className="space-y-1.5">
          <span className="text-[9.5px] font-black text-stone-400 block uppercase tracking-wider pl-2 select-none">학장교회 말씀양육</span>
          
          <button
            onClick={() => {
              setCurrentTab('home');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'home' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <Home className="w-4 h-4 text-[#8A9A5B]" />
            <span>🏠 홈 (나의 대시보드)</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('mypage');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'mypage' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <User className="w-4 h-4 text-[#8A9A5B]" />
            <span>👤 마이페이지 (정보수정)</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('announcements');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'announcements' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <Megaphone className="w-4 h-4 text-[#8A9A5B]" />
            <span>📢 교회소식 및 공지사항</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('verses');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'verses' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <BookMarked className="w-4 h-4 text-[#8A9A5B]" />
            <span>📖 금주암송성구 (말씀연습)</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('bible');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'bible' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#8A9A5B]" />
            <span>⛪ 성경읽기 (진도보고)</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('prayer');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'prayer' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <Heart className="w-4 h-4 text-[#8A9A5B]" />
            <span>🙏 기도수첩 (중보기도)</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('gonggwa');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'gonggwa' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-[#8A9A5B]" />
            <span>📚 공과 (배움터공부)</span>
          </button>

          <button
            onClick={() => {
              setCurrentTab('sermon');
              setIsInlineTesting(false);
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
              currentTab === 'sermon' 
                ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#8A9A5B]" />
            <span>📢 설교 (강단설교요약)</span>
          </button>
        </div>

        {/* COMING SOON MENUS */}
        <div className="space-y-1.5 pt-4 border-t border-stone-100">
          <span className="text-[9px] font-black text-stone-400 block uppercase tracking-wider pl-2 select-none">추가 기능</span>
          
          <div className="space-y-1">
            <button
              onClick={() => {
                // @ts-ignore
                setCurrentTab('faithnote');
                setIsInlineTesting(false);
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer select-none ${
                // @ts-ignore
                currentTab === 'faithnote' 
                  ? 'bg-[#EAF2D7] text-[#5A5A40] font-bold shadow-xs' 
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
              }`}
            >
              <span>✍️ 나의 신앙노트</span>
              <span className="text-[8px] bg-[#8A9A5B]/10 text-[#8A9A5B] px-1.5 py-0.5 rounded font-bold">준비중</span>
            </button>

            {[
              { label: '🕊️ 성도 심방보고', desc: '심방' },
              { label: '✨ AI 영성 도우미', desc: 'AI 기능' }
            ].map((soon, i) => (
              <div
                key={i}
                className="py-2 px-3 rounded-xl text-stone-400 text-xs font-medium flex items-center justify-between border border-dashed border-stone-100 bg-stone-50/50 cursor-not-allowed select-none"
                title={`${soon.desc} 기능 is Sprint 2.`}
              >
                <span>{soon.label}</span>
                <span className="text-[8px] bg-stone-200/70 text-stone-500 px-1.5 py-0.5 rounded font-bold font-mono">SOON</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CONTENT COLUMN (9 COLS) */}
      <div className="lg:col-span-9 space-y-6">
        
        {/* 1. HOME TAB */}
        {currentTab === 'home' && (
          <div className="space-y-6 animate-fadeIn" id="manna-home-dashboard">
            
            {/* ① 최상단 : 회원정보 및 현황 */}
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-sans font-normal text-stone-800 leading-tight">
                  반갑습니다, <span className="font-medium text-[#5A5A40]">{currentUserName || '성도'}</span> 성도님! 👋
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed">
                  오늘도 생명의 꼴 '만나'를 통하여 하나님의 풍성한 은혜를 누리시는 복된 하루가 되기를 소망합니다.
                </p>
              </div>

              {/* Bento-style stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="home-bento-metrics">
                {/* 1. 금주 암송 성구 */}
                <div className="bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-[20px] p-4 flex items-center gap-3 shadow-xs">
                  <div className="bg-[#EAF2D7] p-2 rounded-xl text-[#8A9A5B] shrink-0">
                    <BookMarked className="w-4 h-4 text-[#8A9A5B]" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">금주 암송 성구</p>
                    <h4 className="text-[11px] sm:text-xs font-sans font-medium text-stone-700 truncate" title={pinnedVerse?.reference}>
                      {pinnedVerse?.reference || '미지정'}
                    </h4>
                  </div>
                </div>

                {/* 2. 암송 완료 횟수 */}
                <div className="bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-[20px] p-4 flex items-center gap-3 shadow-xs">
                  <div className="bg-yellow-50 p-2 rounded-xl border border-yellow-100 text-yellow-600 shrink-0">
                    <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-50" />
                  </div>
                  <div className="space-y-0.5 font-sans">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">암송 완료 횟수</p>
                    <h4 className="text-[11px] sm:text-xs font-sans font-medium text-stone-700">
                      {completedCount}구절 완료
                    </h4>
                  </div>
                </div>

                {/* 3. 성경 통독 */}
                <div className="bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-[20px] p-4 flex items-center gap-3 shadow-xs">
                  <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 text-amber-600 shrink-0">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="space-y-0.5 font-sans">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">성경 통독 현황</p>
                    <h4 className="text-[11px] sm:text-xs font-sans font-medium text-stone-700">
                      {bibleProgressCount}장 읽음 ({bibleProgressPercentage}%)
                    </h4>
                  </div>
                </div>

                {/* 4. 이번 주 보고 */}
                <div className="bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-[20px] p-4 flex items-center gap-3 shadow-xs">
                  <div className="bg-[#EAF2D7] p-2 rounded-xl border border-[#DCE8C3]/50 text-[#8A9A5B] shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#8A9A5B]" />
                  </div>
                  <div className="space-y-0.5 font-sans">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">이번 주 보고</p>
                    <h4 className={`text-[11px] sm:text-xs font-sans font-medium ${userSubmissions.some(s => s.weeklyVerseId === pinnedVerse?.id) ? 'text-emerald-600 font-bold' : 'text-stone-500'}`}>
                      {userSubmissions.some(s => s.weeklyVerseId === pinnedVerse?.id) ? '보고 완료 ✨' : '미보고 ✍️'}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* ② 금주 묵상 요약형 카드 */}
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F0ECE4]/60 pb-3">
                <BookOpen className="w-4 h-4 text-[#8A9A5B]" />
                <h3 className="text-xs font-sans font-medium text-[#5A5A40]">금주 묵상 요약</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-[#4A4A4A] leading-relaxed">
                <div className="space-y-1.5 p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E9E3D8]/40">
                  <span className="text-[10px] font-bold text-[#8A9A5B] block">💡 말씀 요약</span>
                  <p className="font-normal text-stone-600 line-clamp-3 md:line-clamp-none" title={weeklyMeditation.summary}>
                    {weeklyMeditation.summary}
                  </p>
                </div>
                <div className="space-y-1.5 p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E9E3D8]/40">
                  <span className="text-[10px] font-bold text-[#8A9A5B] block">🎯 오늘의 결단 & 적용</span>
                  <p className="font-normal text-stone-600 line-clamp-3 md:line-clamp-none" title={weeklyMeditation.application}>
                    {weeklyMeditation.application}
                  </p>
                </div>
              </div>
            </div>

            {/* ③ 금주 암송성구 (시험 공간) */}
            {pinnedVerse && (
              <motion.div
                layoutId="pinned-verse-card"
                className="bg-white border-2 border-[#8A9A5B]/40 rounded-[32px] p-6 sm:p-8 shadow-xs space-y-6 relative"
                id="pinned-verse-banner"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#F0ECE4]/60 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#EAF2D7] text-[#5A5A40] text-[10.5px] font-bold px-3 py-1 rounded-full border border-[#DCE8C3]/50 flex items-center gap-1.5 uppercase tracking-wider">
                      <Flame className="w-3.5 h-3.5 fill-[#8A9A5B] text-[#8A9A5B] animate-pulse" />
                      금주 암송 말씀 📌
                    </span>
                    <span className="text-[11px] text-stone-400 font-light font-sans">
                      {pinnedVerse.quarter}분기 {pinnedVerse.week}주차 • 시험 공간
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 font-sans text-xs">
                    <span className="text-stone-400 font-light">나의 상태:</span>
                    <select
                      value={verseStatuses[pinnedVerse.id]?.status || 'not_started'}
                      onChange={(e) => onStatusChange(pinnedVerse.id, e.target.value as MemorizeStatus)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none border ${
                        (verseStatuses[pinnedVerse.id]?.status || 'not_started') === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : (verseStatuses[pinnedVerse.id]?.status || 'not_started') === 'memorizing'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-stone-50 text-stone-500 border-stone-200'
                      }`}
                    >
                      <option value="not_started">시작 전 💤</option>
                      <option value="memorizing">외우는 중 📖</option>
                      <option value="completed">암송 완료 ✨</option>
                    </select>
                  </div>
                </div>

                {/* Main Text Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
                    <span>📖 {pinnedVerse.reference}</span>
                  </h3>

                  {!isInlineTesting ? (
                    /* NORMAL VIEW */
                    <div className="space-y-4">
                      <div className="p-5 bg-[#F9F7F2] border border-[#E9E3D8]/50 rounded-2xl relative group">
                        <p className={`font-serif text-base sm:text-lg leading-relaxed text-[#4A4A4A] transition-all duration-300 ${blurredCards[pinnedVerse.id] ? 'filter blur-md select-none' : ''}`}>
                          "{pinnedVerse.text}"
                        </p>
                        <button
                          onClick={() => onToggleBlurCard(pinnedVerse.id)}
                          className="absolute right-3.5 bottom-3.5 opacity-0 group-hover:opacity-100 transition p-1.5 bg-white border border-[#E9E3D8]/60 text-[#7A7A6A] hover:text-[#5A5A40] rounded-xl shadow-xs cursor-pointer"
                          title={blurredCards[pinnedVerse.id] ? "본문 보기" : "본문 가려두기"}
                        >
                          {blurredCards[pinnedVerse.id] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Display Submit to Pastor inside Normal Card if Completed */}
                      {userRole !== 'pastor' && userRole !== 'master' && (verseStatuses[pinnedVerse.id]?.status === 'completed') && (
                        <div className="bg-[#8A9A5B]/10 border border-[#8A9A5B]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans transition-all duration-300">
                          <div className="space-y-1 text-center sm:text-left">
                            <h4 className="text-xs font-bold text-[#5A5A40] flex items-center justify-center sm:justify-start gap-1.5">
                              <Trophy className="w-4 h-4 text-[#8A9A5B] fill-amber-100" />
                              목사님께 보고하기
                            </h4>
                            <p className="text-[11px] text-[#7A7A6A] font-light font-sans">
                              {userSubmissions.some(s => s.weeklyVerseId === pinnedVerse.id) 
                                ? '목사님께 성구 최종 통과 보고가 완료되었습니다! 🎉' 
                                : '암송을 성공적으로 완료하셨습니다! 이제 목사님께 보고서를 제출하세요.'}
                            </p>
                          </div>
                          <button
                            disabled={submissionLoading[pinnedVerse.id] || userSubmissions.some(s => s.weeklyVerseId === pinnedVerse.id)}
                            onClick={() => onSubmitVerseToPastor(pinnedVerse.id)}
                            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 select-none ${
                              userSubmissions.some(s => s.weeklyVerseId === pinnedVerse.id)
                                ? 'bg-[#F5F5F0] text-[#8A9A5B] border border-[#E9E3D8] cursor-default'
                                : 'bg-[#8A9A5B] hover:bg-[#78884F] text-white shadow-xs cursor-pointer'
                            }`}
                          >
                            {submissionLoading[pinnedVerse.id] ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : userSubmissions.some(s => s.weeklyVerseId === pinnedVerse.id) ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                보고 완료됨
                              </>
                            ) : (
                              '목사님께 보고하기 ✉️'
                            )}
                          </button>
                        </div>
                      )}

                      {/* Initial Action Buttons */}
                      <div className="flex pt-2 font-sans">
                        <button
                          onClick={() => {
                            setIsInlineTesting(true);
                            setInlineShowResults(false);
                            setInlineUserAnswers({});
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>✍️ 시험 시작</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* INLINE TESTING VIEW */
                    <div className="space-y-5 animate-fadeIn font-sans">
                      <div className="p-3 bg-[#EAF2D7]/40 border border-[#EAF2D7]/50 rounded-xl text-xs text-[#5A5A40] font-normal leading-relaxed">
                        💡 빈칸에 알맞은 단어를 정성껏 입력하여 채워보세요.
                      </div>

                      {/* Display Words with Blanks */}
                      <div className="p-5 sm:p-6 bg-[#FDFBF7] border border-[#E9E3D8] rounded-2xl leading-loose font-serif text-base sm:text-lg text-stone-800">
                        {(() => {
                          const words = pinnedWords;
                          return (
                            <div className="flex flex-wrap items-center">
                              {words.map((w, idx) => {
                                if (w.isSpace) {
                                  return <span key={idx} className="whitespace-pre">{w.text}</span>;
                                }
                                if (w.isBlank) {
                                  if (!inlineShowResults) {
                                    return (
                                      <input
                                        key={idx}
                                        type="text"
                                        value={inlineUserAnswers[w.id] || ''}
                                        onChange={(e) => {
                                          setInlineUserAnswers(prev => ({
                                            ...prev,
                                            [w.id]: e.target.value
                                          }));
                                        }}
                                        placeholder="?"
                                        className="border-b-2 border-stone-400 bg-amber-50/50 text-stone-800 focus:border-[#8A9A5B] focus:bg-white outline-none text-center px-1 font-serif font-bold inline-block mx-0.5 rounded-xs"
                                        style={{ width: `${Math.max(w.text.length * 15 + 12, 40)}px` }}
                                      />
                                    );
                                  } else {
                                    const userClean = (inlineUserAnswers[w.id] || '').trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'「」]/g,"").toLowerCase();
                                    const correctClean = w.text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'「」]/g,"").toLowerCase();
                                    const isCorrect = userClean === correctClean;
                                    return (
                                      <span key={idx} className={`inline-block mx-0.5 font-bold px-1.5 py-0.5 rounded-sm transition-all duration-300 ${isCorrect ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50 border-b-2 border-rose-400'}`} title={`정답: ${w.text}`}>
                                        {isCorrect ? w.text : `${userClean || '비어있음'} (${w.text})`}
                                      </span>
                                    );
                                  }
                                }
                                return <span key={idx}>{w.text}</span>;
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Results and Stats Panel */}
                      {inlineShowResults && (
                        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5 animate-fadeIn font-sans">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-[#5A5A40]">📊 채점 결과 분석</span>
                            <span className={`text-sm ${inlineScore === 100 ? 'text-emerald-600 font-black' : 'text-stone-700 font-extrabold'}`}>
                              점수: <span className="text-lg font-black font-mono">{inlineScore}</span>점 / 100점
                            </span>
                          </div>

                          <div className="text-[11.5px] text-[#7A7A6A] leading-relaxed">
                            {inlineScore === 100 ? (
                              <p className="font-bold text-emerald-600">🎉 축하합니다! 완벽하게 성구를 암송하셨습니다!</p>
                            ) : (
                              <p className="font-normal">틀린 부분이 있습니다. 빨갛게 표시된 정답 단어를 확인하고 다시 시도해보세요!</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions in Testing Mode */}
                      <div className="flex items-center gap-2.5 pt-1">
                        {!inlineShowResults ? (
                          <>
                            <button
                              onClick={() => setInlineShowResults(true)}
                              className="flex-1 py-3 bg-[#5A5A40] hover:bg-[#4A4A30] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              채점하기 ✍️
                            </button>
                            <button
                              onClick={() => {
                                setIsInlineTesting(false);
                                setInlineUserAnswers({});
                              }}
                              className="px-5 py-3 bg-white border border-[#E9E3D8] text-[#7A7A6A] hover:bg-[#F5F5F0] rounded-xl text-xs font-medium transition cursor-pointer"
                            >
                              연습 취소
                            </button>
                          </>
                        ) : (
                          <>
                            {inlineScore < 100 ? (
                              <button
                                onClick={() => {
                                  setInlineShowResults(false);
                                  setInlineUserAnswers({});
                                }}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                재시험 치기 🔄
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  onStatusChange(pinnedVerse.id, 'completed');
                                  setIsInlineTesting(false);
                                  setInlineUserAnswers({});
                                  setInlineShowResults(false);
                                }}
                                className="flex-1 py-3 bg-[#8A9A5B] hover:bg-[#708238] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                암송 완료 ✨
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setIsInlineTesting(false);
                                setInlineUserAnswers({});
                                setInlineShowResults(false);
                              }}
                              className="px-5 py-3 bg-white border border-[#E9E3D8] text-[#7A7A6A] hover:bg-[#F5F5F0] rounded-xl text-xs font-medium transition cursor-pointer"
                            >
                              닫기
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* UPCOMING FAMILY WORSHIP REMINDER IF PRESENT */}
            {upcomingFamilyWorship && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[#8A9A5B]/10 to-white border border-[#E9E3D8] rounded-[24px] p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#8A9A5B]/5 rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center gap-4 text-left font-sans">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#E9E3D8] flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <span className="text-[9px] font-bold text-[#8A9A5B] tracking-tight uppercase">
                      {upcomingFamilyWorship.date ? upcomingFamilyWorship.date.split(/[.-]/)[1] : ''}월
                    </span>
                    <span className="text-lg font-black text-[#5A5A40] leading-none">
                      {upcomingFamilyWorship.date ? upcomingFamilyWorship.date.split(/[.-]/)[2] : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-0.5 font-sans">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-[#8A9A5B] text-white px-2 py-0.5 rounded-full text-[9px] font-bold">
                        {upcomingFamilyWorship.dDay}
                      </span>
                      {upcomingFamilyWorship.isAssignedToMe && (
                        <span className="bg-[#5A5A40] text-white px-2 py-0.5 rounded-full text-[9px] font-bold font-sans">
                          🎯 예배 대상
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#5A5A40] font-serif leading-tight">
                      {upcomingFamilyWorship.title}
                    </h3>
                    {upcomingFamilyWorship.passage && (
                      <p className="text-[10px] text-[#7A7A6A] font-light">
                        📖 성경 본문: <span className="font-semibold text-[#8A9A5B]">{upcomingFamilyWorship.passage}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto font-sans">
                  <span className="text-[10px] text-[#7A7A6A] font-semibold flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded border border-[#E9E3D8]/50">
                    <Calendar className="w-3.5 h-3.5 text-[#8A9A5B]" />
                    {upcomingFamilyWorship.time || '시간 협의'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* BIBLE READING HERO ACCENT SHORTCUT */}
            <div className="bg-gradient-to-r from-[#8A9A5B]/5 to-white border border-[#E9E3D8] rounded-[24px] p-6 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="space-y-1.5 text-center sm:text-left font-sans">
                <span className="bg-[#8A9A5B]/10 text-[#8A9A5B] text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-[#8A9A5B]/20">
                  성경 66권 통독 도전 ⛪
                </span>
                <h3 className="text-xs sm:text-sm font-serif font-bold text-[#5A5A40]">
                  매일 주님의 입에서 나오는 말씀으로 생명을 채우십시오
                </h3>
                <p className="text-[11px] text-[#7A7A6A] font-light">
                  오늘 읽은 성경 구절을 체크하고 한 줄 느낀 점을 적어 목사님께 신실한 영적 성장을 보고하십시오.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[#8A9A5B] font-bold">
                  <span>✨ 현재 누적 읽기 현황:</span>
                  <span className="bg-[#8A9A5B]/10 px-1.5 py-0.5 rounded">
                    총 {bibleProgressCount}장 완료
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('bible')}
                className="py-3 px-5 bg-[#5A5A40] hover:bg-[#4A4A30] text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
              >
                성경읽기 진도 기록 및 보고 ⛪
              </button>
            </div>

          </div>
        )}

        {/* 2. BIBLE READING TAB */}
        {currentTab === 'bible' && (
          <BibleReadingPanel currentUserId={currentUserId} currentUserName={currentUserName} />
        )}

        {/* 3. MYPAGE TAB */}
        {currentTab === 'mypage' && (
          <MyPagePanel />
        )}

        {/* 4. ANNOUNCEMENTS TAB */}
        {currentTab === 'announcements' && (
          <div className="space-y-6 animate-fadeIn font-sans" id="announcements-tab-view">
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#5A5A40] flex items-center gap-2">
                    <Megaphone className="w-5.5 h-5.5 text-[#8A9A5B] fill-[#8A9A5B]/10" />
                    교회소식 및 공지사항 📢
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5 font-light">
                    학장교회 성도님들을 위한 주간 소식과 공지사항을 전해드립니다.
                  </p>
                </div>
                
                {isAdminAuthenticated && (
                  <button
                    onClick={() => setShowAddAnnForm(!showAddAnnForm)}
                    className="px-4 py-2 bg-[#8A9A5B] hover:bg-[#708238] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none"
                  >
                    <Plus className="w-4 h-4" />
                    새 공지 등록
                  </button>
                )}
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2">
                <span className="text-stone-400 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="공지사항 제목이나 내용을 검색해보세요..."
                  value={annSearchQuery}
                  onChange={(e) => setAnnSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-stone-700 outline-none placeholder-stone-400 font-light"
                />
                {annSearchQuery && (
                  <button onClick={() => setAnnSearchQuery('')} className="text-stone-400 hover:text-stone-600 text-xs cursor-pointer">
                    ✕
                  </button>
                )}
              </div>

              {/* Add Announcement Form */}
              {isAdminAuthenticated && showAddAnnForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={onNewAnnSubmit}
                  className="bg-[#FDFBF7] border border-[#E9E3D8] p-5 rounded-2xl space-y-4 font-sans"
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#5A5A40]">공지 제목</label>
                        <button
                          type="button"
                          onClick={() => {
                            setNewAnnTitle('[금주 말씀 토론] 이번주 주신 말씀을 깊이 토론해 봅시다.');
                            setNewAnnContent('1. 이번주 선포된 말씀 구절에서 가장 은혜받거나 마음에 닿았던 단어나 구절은 무엇인가요?\n\n2. 오늘 배운 공과 배움터의 진리를 우리 삶과 가정, 직장에서 구체적으로 어떻게 적용하고 실천할 수 있을지 함께 나누어 봅시다.');
                          }}
                          className="text-[10px] text-[#8A9A5B] hover:underline font-bold cursor-pointer"
                        >
                          💬 \'금주 말씀 토론\' 템플릿 적용
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="공지사항 제목을 입력하세요."
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B]"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#5A5A40]">공지 상세 내용</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="공지내용을 적어주세요..."
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B] font-mono leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5A5A40]">작성자</label>
                        <input
                          type="text"
                          required
                          placeholder="학장교회 관리자"
                          value={newAnnAuthor}
                          onChange={(e) => setNewAnnAuthor(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#8A9A5B] hover:bg-[#708238] text-white rounded-xl text-xs font-bold transition cursor-pointer select-none"
                    >
                      공지 등록하기 🚀
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAnnForm(false)}
                      className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-500 rounded-xl text-xs font-bold transition cursor-pointer select-none"
                    >
                      취소
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Announcement List */}
              <div className="space-y-4">
                {announcements.filter(ann => {
                  const query = annSearchQuery.toLowerCase();
                  return ann.title.toLowerCase().includes(query) || ann.content.toLowerCase().includes(query);
                }).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs font-light">
                    등록되었거나 검색 조건에 맞는 공지사항이 없습니다.
                  </div>
                ) : (
                  announcements
                    .filter(ann => {
                      const query = annSearchQuery.toLowerCase();
                      return ann.title.toLowerCase().includes(query) || ann.content.toLowerCase().includes(query);
                    })
                    .map((ann) => (
                      <div key={ann.id} className="p-5 border border-[#E9E3D8]/60 bg-[#FDFBF7] rounded-2xl space-y-3 relative group">
                        {isAdminAuthenticated && (
                          <button
                            onClick={() => onDeleteAnnouncement(ann.id)}
                            className="absolute top-4 right-4 text-xs font-bold text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            삭제
                          </button>
                        )}
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-sm font-serif font-bold text-stone-800 leading-tight">
                            {ann.title}
                          </h4>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line font-normal font-sans">
                          {ann.content}
                        </p>
                        <div className="flex justify-between items-center text-[10.5px] text-stone-400 border-t border-[#E9E3D8]/30 pt-2.5">
                          <span className="font-light">작성자: <span className="text-[#8A9A5B] font-bold">{ann.author || '학장교회'}</span></span>
                          <span className="font-light">{ann.date ? new Date(ann.date).toLocaleDateString('ko-KR') : ''}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. PRAYER TAB */}
        {currentTab === 'prayer' && (
          <ComingSoonPanel 
            title="기도수첩 (중보기도)" 
            desc="학장교회 성도님들과 함께 기도의 제목을 나누고 합심하여 기도하는 기도의 자리를 정성껏 준비 중입니다." 
            icon={Heart} 
          />
        )}

        {/* 6. GONGGWA TAB */}
        {currentTab === 'gonggwa' && (
          <ComingSoonPanel 
            title="공과 (배움터공부)" 
            desc="예배 후 공과 말씀과 삶의 배움을 기록하고 성찰하는 온라인 공과 학습실을 준비 중입니다." 
            icon={ClipboardList} 
          />
        )}

        {/* 7. SERMON TAB */}
        {currentTab === 'sermon' && (
          <ComingSoonPanel 
            title="설교 (강단설교요약)" 
            desc="주일 선포된 강단의 말씀 요약과 다시 듣기, 깊은 묵상 노트를 기록할 수 있는 공간을 준비 중입니다." 
            icon={Sparkles} 
          />
        )}

        {/* 8. FAITH NOTE TAB */}
        {currentTab === 'faithnote' && (
          <ComingSoonPanel 
            title="나의 신앙노트" 
            desc="매일의 감사와 기도 제목, QT 및 은혜의 감동을 개인적으로 기록하여 간직하는 신실한 믿음의 흔적을 담을 수 있도록 준비 중입니다." 
            icon={BookOpen} 
          />
        )}

        {/* 9. WEEKLY SCRIPTURE (VERSES) TAB */}
        {currentTab === 'verses' && (
          /* STANDARD DASHBOARD LIST VIEW */
          <div className="space-y-8">

            {/* MEDITATION INTRO & EFFECT SYNOPSIS */}
            <AnimatePresence>
              {showMeditationIntro && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm relative overflow-hidden"
                  id="intro-meditation-box"
                >
                  <button
                    onClick={() => setShowMeditationIntro(false)}
                    className="absolute top-4 right-4 text-xs font-semibold text-[#A0A090] hover:text-[#5A5A40] cursor-pointer"
                  >
                    닫기 ✕
                  </button>

                  <div className="max-w-3xl space-y-4">
                    <h2 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#8A9A5B] fill-[#8A9A5B]/20" />
                      학장교회 매주 암송성구 가이드 • 만나 (Manna)
                    </h2>

                    <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                      학장교회 성도님들을 위해 준비된 <strong>매주 성경 암송 훈련 사이트</strong>입니다. 광야에서 백성들을 먹이셨던 생명의 하늘 양식 '만나'처럼, 매일 마주하는 말씀의 기적과 축복을 경험하며 하나님과 동행하는 <strong>"만나 : 말씀으로 하나님과 매일 만나는 나"</strong> 트레이너입니다. 매일 소리내어 선포하는 가운데 십자가로 더욱 가까이 나아가며, 오직 <strong>"말씀중심 은혜중심"</strong>으로 무장하여 일상에서 살아서 역사하는 말씀의 능력을 풍성히 누려보십시오.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="bg-[#F9F7F2] border border-[#E9E3D8] p-4 rounded-2xl space-y-1">
                        <div className="text-xs font-bold text-[#8A9A5B] flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4 text-[#8A9A5B]" />
                          1. 빈칸 구간 학습
                        </div>
                        <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                          말씀 구절의 일부분을 가려진 빈칸으로 바꾸고, 앞뒤 흐름과 초성을 유추하며 주도적으로 복기합니다.
                        </p>
                      </div>

                      <div className="bg-[#F9F7F2] border border-[#E9E3D8] p-4 rounded-2xl space-y-1">
                        <div className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" />
                          2. 실전 직접 쓰기
                        </div>
                        <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                          타이핑을 통해 성경 원본과 글자 단위로 대조하여 오타, 누락, 추가 구문을 실시간 디프(Diff) 분석해 줍니다.
                        </p>
                      </div>

                      <div className="bg-[#F9F7F2] border border-[#E9E3D8] p-4 rounded-2xl space-y-1">
                        <div className="text-xs font-bold text-[#8A9A5B] flex items-center gap-1.5">
                          <Mic className="w-4 h-4 text-[#8A9A5B]" />
                          3. 음성 따라말하기 🎙️
                        </div>
                        <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                          마이크 음성인식을 통해 직접 입으로 고백한 텍스트를 실시간 분석해 암송 정확도를 채점해 줍니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* METRICS / STATS DASHBOARD BOARD */}
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm space-y-6" id="overall-progress-dashboard">
              <div className="flex flex-col md:flex-row items-center gap-6 justify-between">

                {/* Radial progress circle */}
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-[#F5F5F0]"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-[#8A9A5B]"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (totalCount > 0 ? completedCount / totalCount : 0)) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                      <span className="text-xl font-black text-[#5A5A40]">
                        {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                      </span>
                      <span className="text-[8px] text-[#A0A090] font-bold">성취 도달율</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left">
                    <h3 className="text-sm font-serif font-bold text-[#5A5A40] flex items-center justify-center sm:justify-start gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500 fill-amber-100" />
                      <span className="font-extrabold text-[#8A9A5B] underline decoration-[#8A9A5B]/30 decoration-2 underline-offset-4">{currentUserName}</span>{(currentUserName.includes('목사님') || currentUserName.includes('관리자') || userRole === 'pastor' || userRole === 'manager') ? ' ' : ' 성도'}님의 말씀 암송 성취도 도달율
                    </h3>
                    <p className="text-xs text-[#7A7A6A] font-semibold">
                      총 {totalCount}개 구절 중 <span className="text-[#8A9A5B] font-bold text-sm">{completedCount}개</span> 말씀 암송 완료
                    </p>
                    <p className="text-[11px] text-[#A0A090] leading-relaxed max-w-md italic">
                      {(() => {
                        const rate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                        if (rate === 0) return "믿음의 소중한 첫걸음입니다! 날마다 채우시는 하나님의 만나를 풍성히 받아보세요.";
                        if (rate < 30) return "말씀이 삶 속에 깊이 뿌리내리고 있습니다. 힘차게 한 걸음 더 전진합시다!";
                        if (rate < 60) return "절반 가까이 돌파하셨습니다! 말씀의 능력이 성도님의 삶과 마음을 풍성히 채우고 있습니다.";
                        if (rate < 100) return "완벽한 암송 고지가 바로 앞입니다! 끝까지 주님의 은혜를 사모하며 기쁨과 감사로 승리해 보십시오.";
                        return "할렐루야! 전체 말씀을 모두 암송하셨습니다! 성도님의 헌신과 믿음에 깊은 존경을 표합니다.";
                      })()}
                    </p>
                  </div>
                </div>

                <div className="hidden md:block w-px bg-[#E9E3D8] h-12" />

                {/* Statistics counts */}
                <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 font-sans">
                  <div className="bg-[#F9F7F2] border border-[#E9E3D8] px-4 py-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-[#A0A090] font-bold block mb-0.5">완료 말씀</span>
                    <span className="text-sm font-black text-[#8A9A5B]">{completedCount} / {totalCount}</span>
                  </div>
                  <div className="bg-[#FDFBF7] border border-[#E9E3D8] px-4 py-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-[#A0A090] font-bold block mb-0.5">암송 노력중</span>
                    <span className="text-sm font-black text-[#5A5A40]">{memorizingCount}</span>
                  </div>
                  <div className="bg-[#FDFBF7] border border-[#E9E3D8] px-4 py-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-stone-400 font-bold block mb-0.5">시작 전</span>
                    <span className="text-sm font-black text-stone-500">{notStartedCount}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* PINNED "금주의 암송 말씀" SPOTLIGHT */}
            {pinnedVerse && (
              <motion.div
                layoutId="pinned-verse-card"
                className="bg-white border-2 border-[#8A9A5B]/40 rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                id="pinned-verse-banner"
              >
                <div className="space-y-3.5 w-full md:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F5F5F0] text-[#8A9A5B] text-[10px] font-bold px-3 py-1 rounded-full border border-[#E9E3D8] uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-[#8A9A5B] text-[#8A9A5B]" />
                      금주 암송 성구 📌
                    </span>
                    <span className="text-xs text-[#A0A090] font-sans font-semibold">
                      {(() => {
                        const qAndW = `${pinnedVerse.quarter}분기 ${pinnedVerse.week}주차`;
                        if (pinnedVerse.date) {
                          const parts = pinnedVerse.date.split('.');
                          if (parts.length === 3) {
                            return `${qAndW} • ${parts[0].slice(-2)}-${parts[1]}-${parts[2]} 주일`;
                          }
                          return `${qAndW} • ${pinnedVerse.date}`;
                        }
                        return qAndW;
                      })()}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#5A5A40]" id="pinned-ref">
                    {pinnedVerse.reference}
                  </h3>

                  <div className="p-4 bg-[#F9F7F2] border border-[#E9E3D8]/50 rounded-2xl">
                    <p className={`font-serif text-lg leading-relaxed text-[#4A4A4A] transition-all duration-300 ${blurredCards[pinnedVerse.id] ? 'filter blur-md select-none' : ''}`}>
                      {pinnedVerse.text}
                    </p>
                    {pinnedVerse.hint && (
                      <p className="text-xs text-[#7A7A6A] mt-2 font-sans italic">
                        묵상 가이드: {pinnedVerse.hint}
                      </p>
                    )}
                  </div>

                  {isAdminAuthenticated && (
                    <div className="mt-3.5 pt-3 border-t border-dashed border-[#E9E3D8] flex items-center justify-between gap-2 bg-[#FDFBF7] p-2.5 rounded-2xl font-sans">
                      <span className="text-[10px] font-bold text-[#8A9A5B] flex items-center gap-1">⚙️ 금주의 암송 말씀 관리</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditVerse(pinnedVerse);
                          }}
                          className="px-2.5 py-1.5 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(pinnedVerse.id);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 font-sans">
                  <button
                    onClick={() => onToggleBlurCard(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl border border-[#E9E3D8] text-[#5A5A40] bg-white hover:bg-[#F5F5F0] text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    {blurredCards[pinnedVerse.id] ? (
                      <>
                        <Eye className="w-4 h-4" />
                        가사/본문 보기
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        가려두고 자가테스트
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onStartBlankPractice(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    구간 빈칸 연습
                  </button>

                  <button
                    onClick={() => onStartSpeakAlong(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#E9E3D8] hover:bg-[#E9E3D8] text-[#5A5A40] text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    따라말하기 (음성)
                  </button>

                  <button
                    onClick={() => onStartWriteTest(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    실전 직접 써보기
                  </button>
                </div>
              </motion.div>
            )}

            {/* PINNED "금월의 암송 말씀" SPOTLIGHT */}
            {pinnedMonthVerse && (
              <motion.div
                layoutId="pinned-month-verse-card"
                className="bg-white border-2 border-[#5A5A40]/40 rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                id="pinned-month-verse-banner"
              >
                <div className="space-y-3.5 w-full md:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F5F5F0] text-[#5A5A40] text-[10px] font-bold px-3 py-1 rounded-full border border-[#E9E3D8] uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 fill-[#5A5A40]/10 text-[#5A5A40]" />
                      이달의 암송 성구 📌
                    </span>
                    <span className="text-xs text-[#A0A090] font-sans font-semibold">
                      {(() => {
                        const q = `${pinnedMonthVerse.quarter}분기`;
                        if (pinnedMonthVerse.date) {
                          return `${q} • ${pinnedMonthVerse.date} 이달의 말씀`;
                        }
                        return `${q} 이달의 말씀`;
                      })()}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#5A5A40]" id="pinned-month-ref">
                    {pinnedMonthVerse.reference}
                  </h3>

                  <div className="p-4 bg-[#F9F7F2] border border-[#E9E3D8]/50 rounded-2xl">
                    <p className={`font-serif text-lg leading-relaxed text-[#4A4A4A] transition-all duration-300 ${blurredCards[pinnedMonthVerse.id] ? 'filter blur-md select-none' : ''}`}>
                      {pinnedMonthVerse.text}
                    </p>
                    {pinnedMonthVerse.hint && (
                      <p className="text-xs text-[#7A7A6A] mt-2 font-sans italic">
                        묵상 가이드: {pinnedMonthVerse.hint}
                      </p>
                    )}
                  </div>

                  {isAdminAuthenticated && (
                    <div className="mt-3.5 pt-3 border-t border-dashed border-[#E9E3D8] flex items-center justify-between gap-2 bg-[#FDFBF7] p-2.5 rounded-2xl font-sans">
                      <span className="text-[10px] font-bold text-[#5A5A40] flex items-center gap-1">⚙️ 이달의 암송 말씀 관리</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditVerse(pinnedMonthVerse);
                          }}
                          className="px-2.5 py-1.5 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(pinnedMonthVerse.id);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 font-sans">
                  <button
                    onClick={() => onToggleBlurCard(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl border border-[#E9E3D8] text-[#5A5A40] bg-white hover:bg-[#F5F5F0] text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    {blurredCards[pinnedMonthVerse.id] ? (
                      <>
                        <Eye className="w-4 h-4" />
                        본문 보기
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        가려두고 자가테스트
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onStartBlankPractice(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    구간 빈칸 연습
                  </button>

                  <button
                    onClick={() => onStartSpeakAlong(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#E9E3D8] hover:bg-[#E9E3D8] text-[#5A5A40] text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    따라말하기 (음성)
                  </button>

                  <button
                    onClick={() => onStartWriteTest(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    실전 직접 써보기
                  </button>
                </div>
              </motion.div>
            )}

            {/* WEEKLY MEDITATION SECTION */}
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-xs space-y-6" id="weekly-meditation-section">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[#F0ECE4] pb-4">
                <div>
                  <h3 className="text-lg font-serif font-black text-[#5A5A40] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#8A9A5B] fill-[#8A9A5B]/10" />
                    금주 묵상 📖
                  </h3>
                  <p className="text-[10.5px] text-[#A0A090] font-medium mt-0.5">
                    나의 신앙노트, 강단 설교, 공과 배움터, 암송 성구를 하나로 잇는 영적 흐름
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 font-sans">
                  <span className="px-2.5 py-1 bg-[#EAF2D7] text-[#5A5A40] text-[10px] font-extrabold rounded-full border border-[#DCE8C3]/50">
                    참고 소스: {weeklyMeditation.source}
                  </span>
                  <span className="text-[9px] text-[#A0A090] font-semibold">
                    {weeklyMeditation.sourceDetail}
                  </span>
                </div>
              </div>

              {/* Meditation 4-Step Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. 말씀 요약 */}
                <div className="p-4 bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8A9A5B]">
                    <span className="w-5 h-5 rounded-lg bg-[#8A9A5B]/10 flex items-center justify-center text-[10px]">📝</span>
                    <span>말씀 요약</span>
                  </div>
                  <p className="text-[11.5px] text-[#5A5A40] leading-relaxed font-sans font-semibold pl-1 whitespace-pre-line">
                    {weeklyMeditation.summary}
                  </p>
                </div>

                {/* 2. 이번 주 묵상 */}
                <div className="p-4 bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8A9A5B]">
                    <span className="w-5 h-5 rounded-lg bg-[#8A9A5B]/10 flex items-center justify-center text-[10px]">🕊️</span>
                    <span>이번 주 묵상</span>
                  </div>
                  <p className="text-[11.5px] text-[#4A4A4A] leading-relaxed font-sans whitespace-pre-line">
                    {weeklyMeditation.meditation}
                  </p>
                </div>

                {/* 3. 적용할 점 */}
                <div className="p-4 bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8A9A5B]">
                    <span className="w-5 h-5 rounded-lg bg-[#8A9A5B]/10 flex items-center justify-center text-[10px]">🎯</span>
                    <span>적용할 점</span>
                  </div>
                  <p className="text-[11.5px] text-[#4A4A4A] leading-relaxed font-sans whitespace-pre-line pl-1">
                    {weeklyMeditation.application}
                  </p>
                </div>

                {/* 4. 기도제목 */}
                <div className="p-4 bg-[#FDFBF7] border border-[#E9E3D8]/50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8A9A5B]">
                    <span className="w-5 h-5 rounded-lg bg-[#8A9A5B]/10 flex items-center justify-center text-[10px]">🙏</span>
                    <span>기도제목</span>
                  </div>
                  <p className="text-[11.5px] text-stone-600 leading-relaxed font-serif italic pl-1 whitespace-pre-line font-semibold">
                    "{weeklyMeditation.prayer}"
                  </p>
                </div>
              </div>

              {/* Sub-section: Church Announcements */}
              <div className="border-t border-[#F0ECE4] pt-5 space-y-4" id="church-announcements-section">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-serif font-bold text-[#5A5A40] flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#8A9A5B] fill-[#8A9A5B]/10" />
                    교회 소식 & 공지사항 📢
                  </h4>
                  {isAdminAuthenticated && (
                    <button
                      onClick={() => setShowAddAnnForm(!showAddAnnForm)}
                      className="px-3 py-1 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      새 공지 작성
                    </button>
                  )}
                </div>

                {/* Add Announcement Form */}
                {isAdminAuthenticated && showAddAnnForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={onNewAnnSubmit}
                    className="bg-[#FDFBF7] border border-[#E9E3D8] p-4 rounded-2xl space-y-3 font-sans"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-[#5A5A40]">공지 제목</label>
                          <button
                            type="button"
                            onClick={() => {
                              setNewAnnTitle('[금주 말씀 토론] 이번주 주신 말씀을 깊이 토론해 봅시다.');
                              setNewAnnContent('1. 이번주 선포된 말씀 구절에서 가장 은혜받거나 마음에 닿았던 단어나 구절은 무엇인가요?\n\n2. 오늘 배운 공과 배움터의 진리를 우리 삶과 가정, 직장에서 구체적으로 어떻게 적용하고 실천할 수 있을지 함께 나누어 봅시다.');
                            }}
                            className="text-[10px] text-[#8A9A5B] hover:underline font-bold cursor-pointer"
                          >
                            💬 \'금주 말씀 토론\' 템플릿 적용
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="공지사항 제목을 입력하세요."
                          value={newAnnTitle}
                          onChange={(e) => setNewAnnTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#5A5A40]">작성자</label>
                        <input
                          type="text"
                          placeholder={currentUserName || "관리자"}
                          value={newAnnAuthor}
                          onChange={(e) => setNewAnnAuthor(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#5A5A40]">공지 내용</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="성도님들께 공지할 상세 내용을 입력하세요."
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B] resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddAnnForm(false);
                          setNewAnnTitle('');
                          setNewAnnContent('');
                        }}
                        className="px-3 py-1.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        공지 등록하기
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Announcements List */}
                <div className="space-y-3">
                  {announcements.length === 0 ? (
                    <p className="text-xs text-[#A0A090] text-center py-4 italic">등록된 공지사항이 없습니다.</p>
                  ) : (
                    announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-4 bg-[#F9F7F2]/50 border border-[#E9E3D8]/40 rounded-2xl hover:bg-[#F9F7F2] transition relative"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#5A5A40]">{ann.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#A0A090] font-sans font-semibold">{ann.date}</span>
                            {isAdminAuthenticated && (
                              <button
                                onClick={() => onDeleteAnnouncement(ann.id)}
                                className="text-rose-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                                title="삭제"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-[#4A4A4A] leading-relaxed font-sans whitespace-pre-line">
                          {ann.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* TAB FILTERS FOR QUARTERS */}
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E9E3D8] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '전체 말씀 리스트', value: 0 },
                  { label: '1분기', value: 1 },
                  { label: '2분기', value: 2 },
                  { label: '3분기', value: 3 },
                  { label: '4분기', value: 4 },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedQuarter(tab.value)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold tracking-tight transition cursor-pointer ${
                      selectedQuarter === tab.value
                        ? 'bg-[#8A9A5B] text-white shadow-sm'
                        : 'bg-white hover:bg-[#F5F5F0] text-[#7A7A6A] border border-[#E9E3D8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Toggle Option */}
                <div className="flex items-center gap-1.5 bg-[#F5F5F0] border border-[#E9E3D8] rounded-xl p-0.5 font-sans">
                  <button
                    onClick={() => setVerseSortOrder('latest')}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                      verseSortOrder === 'latest'
                        ? 'bg-[#8A9A5B] text-white shadow-sm'
                        : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    최신순
                  </button>
                  <button
                    onClick={() => setVerseSortOrder('oldest')}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${
                      verseSortOrder === 'oldest'
                        ? 'bg-[#8A9A5B] text-white shadow-sm'
                        : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    과거순
                  </button>
                </div>

                <div className="text-[11px] text-[#A0A090] font-sans font-medium whitespace-nowrap">
                  총 <span className="font-bold text-[#5A5A40]">{filteredVerses.length}</span>개 성구
                </div>
              </div>
            </div>

            {/* VERSE CARD GRID CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="verse-card-grid">
              {sortedVerses.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white border border-[#E9E3D8] rounded-[32px] p-8 shadow-sm">
                  <p className="text-sm font-medium text-[#7A7A6A] font-serif">등록된 내용이 없습니다.</p>
                </div>
              ) : (
                sortedVerses.map((verse) => {
                  const statusInfo = verseStatuses[verse.id] || {
                    verseId: verse.id,
                    status: 'not_started',
                    streak: 0
                  };
                  const isPinned = verse.id === pinnedVerseId;
                  const isBlurred = blurredCards[verse.id] ?? false;

                  let statusBadgeClass = "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ";
                  let statusLabel = "시작 전";

                  if (statusInfo.status === 'completed') {
                    statusBadgeClass += "bg-[#F5F5F0] text-[#8A9A5B] border border-[#E9E3D8]";
                    statusLabel = "암송 완료 ✨";
                  } else if (statusInfo.status === 'memorizing') {
                    statusBadgeClass += "bg-[#F9F7F2] text-[#5A5A40] border border-[#E9E3D8]";
                    statusLabel = "외우는 중 📖";
                  } else {
                    statusBadgeClass += "bg-stone-50 text-stone-400 border border-stone-100";
                  }

                  const isLatest = verse.id === latestVerseId;
                  const hasSubmitted = userSubmissions.some(s => s.weeklyVerseId === verse.id);
                  const activeSub = userSubmissions.find(s => s.weeklyVerseId === verse.id);

                  return (
                    <div
                      key={verse.id}
                      className={`relative bg-white border rounded-[32px] p-6 shadow-xs flex flex-col justify-between transition duration-300 ${
                        isPinned
                          ? 'border-[#8A9A5B]/40 ring-2 ring-[#8A9A5B]/10 ring-offset-2 bg-gradient-to-br from-white to-[#FDFBF7]/30'
                          : 'border-[#E9E3D8]/80 hover:border-[#8A9A5B]/30 hover:shadow-md'
                      }`}
                      id={`verse-card-${verse.id}`}
                    >
                      {/* Pinned Crown indicator / Latest badge */}
                      {isPinned && (
                        <div className="absolute -top-3 left-6 bg-[#8A9A5B] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1 border border-white">
                          <Flame className="w-3 h-3 fill-white text-white animate-pulse" />
                          추천 성구
                        </div>
                      )}

                      {!isPinned && isLatest && (
                        <div className="absolute -top-3 left-6 bg-amber-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-white">
                          <Sparkles className="w-3 h-3 text-white fill-white animate-pulse" />
                          금주의 최신 말씀 ✨
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-[#A0A090] font-sans font-bold">
                              {verse.quarter}분기 • {verse.week}주차
                              {verse.date && ` • ${verse.date}`}
                            </span>
                            <h4 className="text-lg font-serif font-black text-[#5A5A40] tracking-tight leading-tight">
                              {verse.reference}
                            </h4>
                          </div>
                          <select
                            value={statusInfo.status}
                            onChange={(e) => onStatusChange(verse.id, e.target.value as MemorizeStatus)}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full cursor-pointer focus:outline-none ${statusBadgeClass}`}
                          >
                            <option value="not_started">시작 전 💤</option>
                            <option value="memorizing">외우는 중 📖</option>
                            <option value="completed">암송 완료 ✨</option>
                          </select>
                        </div>

                        {/* Text card view */}
                        <div className="p-4 bg-[#F9F7F2]/50 border border-[#E9E3D8]/30 rounded-2xl relative group min-h-[84px] flex flex-col justify-center">
                          <p className={`font-serif text-[15px] leading-relaxed text-[#4A4A4A] transition-all duration-300 ${isBlurred ? 'filter blur-md select-none' : ''}`}>
                            {verse.text}
                          </p>

                          {/* Quick self-check eye toggle floating action */}
                          <button
                            onClick={() => onToggleBlurCard(verse.id)}
                            className="absolute right-3.5 bottom-3.5 opacity-0 group-hover:opacity-100 transition p-1.5 bg-white border border-[#E9E3D8]/60 text-[#7A7A6A] hover:text-[#5A5A40] rounded-xl shadow-xs cursor-pointer"
                            title={isBlurred ? "가사보기" : "가려서 자가테스트"}
                          >
                            {isBlurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {verse.hint && (
                          <p className="text-[10.5px] text-[#A0A090] leading-relaxed italic px-1 font-sans">
                            가이드: {verse.hint}
                          </p>
                        )}
                      </div>

                      {/* ACTIONS DRAWER BOTTOM */}
                      <div className="mt-5 pt-4 border-t border-dashed border-[#E9E3D8]/60 space-y-3 font-sans">
                        
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FDFBF7] px-1 py-0.5 rounded-2xl">
                          {/* Left administrative action config buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onPinVerse(verse.id)}
                              className={`p-2 rounded-xl border transition cursor-pointer ${
                                isPinned
                                  ? 'bg-[#8A9A5B] border-[#8A9A5B] text-white shadow-xs'
                                  : 'bg-white border-[#E9E3D8] text-[#7A7A6A] hover:bg-[#F5F5F0]'
                              }`}
                              title="금주의 암송 말씀으로 핀 고정하기"
                            >
                              📌
                            </button>
                            <button
                              onClick={() => onPinMonthVerse(verse.id)}
                              className={`p-2 rounded-xl border transition cursor-pointer ${
                                verse.id === pinnedMonthVerseId
                                  ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs'
                                  : 'bg-white border-[#E9E3D8] text-[#7A7A6A] hover:bg-[#F5F5F0]'
                              }`}
                              title="이달의 암송 말씀으로 핀 고정하기"
                            >
                              🗓️
                            </button>

                            {isAdminAuthenticated && (
                              <div className="flex items-center gap-1.5 pl-1.5 border-l border-stone-200">
                                <button
                                  onClick={() => onEditVerse(verse)}
                                  className="p-1.5 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg transition cursor-pointer"
                                  title="수정"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(verse.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Right side practice action launch drawer */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onStartBlankPractice(verse.id)}
                              className="px-3 py-2 bg-[#F9F7F2] hover:bg-[#E9E3D8] text-[#5A5A40] text-[10.5px] font-bold rounded-xl transition cursor-pointer"
                            >
                              빈칸연습
                            </button>
                            <button
                              onClick={() => onStartSpeakAlong(verse.id)}
                              className="px-3 py-2 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] text-[10.5px] font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1"
                            >
                              <Mic className="w-3 h-3 text-[#8A9A5B]" />
                              따라말하기
                            </button>
                            <button
                              onClick={() => onStartWriteTest(verse.id)}
                              className="px-3.5 py-2 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-[10.5px] font-bold rounded-xl transition shadow-xs cursor-pointer"
                            >
                              직접쓰기
                            </button>
                          </div>
                        </div>

                        {/* Inline modal confirmation to delete verse inside container */}
                        {deleteConfirmId === verse.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2"
                          >
                            <p className="text-[10.5px] text-rose-800 font-bold text-center">
                              ⚠️ 정말로 이 말씀 구절을 학장교회 리스트에서 영구히 삭제하시겠습니까?
                            </p>
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteVerse(verse.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                삭제확인
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
