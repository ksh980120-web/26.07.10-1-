/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Heart,
  HelpCircle,
  Sparkles,
  ClipboardList,
  Mic,
  MessageSquare,
  CheckSquare,
  Square,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { Verse, VerseStatus, MemorizeStatus, FaithJournalEntry, PrayerEntry } from '../types';

interface PersonalFaithNoteProps {
  isGuest?: boolean;
  verses: Verse[];
  verseStatuses: { [key: string]: VerseStatus };
  onAddPersonalVerse: (verse: Omit<Verse, 'id' | 'isPersonal' | 'quarter' | 'week'>) => void;
  onDeletePersonalVerse: (id: string) => void;
  onStatusChange: (id: string, status: MemorizeStatus) => void;
  onStartBlankPractice: (id: string) => void;
  onStartWriteTest: (id: string) => void;
  onStartSpeakAlong: (id: string) => void;
}

type TabType = 'journal' | 'verse' | 'prayer';

export default function PersonalFaithNote({
  isGuest = false,
  verses,
  verseStatuses,
  onAddPersonalVerse,
  onDeletePersonalVerse,
  onStatusChange,
  onStartBlankPractice,
  onStartWriteTest,
  onStartSpeakAlong
}: PersonalFaithNoteProps) {
  // --- SUB TAB STATE ---
  const [activeTab, setActiveTab] = useState<TabType>('journal');

  // --- LOCAL PERSISTED STATE: JOURNALS ---
  const [journals, setJournals] = useState<FaithJournalEntry[]>([]);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  // Journal form states
  const [jDate, setJDate] = useState('');
  const [jCategory, setJCategory] = useState<'meditation' | 'sermon' | 'question' | '주일예배' | '주간예배' | '새벽예배' | '집회예배' | '개인묵상'>('주일예배');
  const [jTitle, setJTitle] = useState('');
  const [jPassage, setJPassage] = useState('');
  const [jContent, setJContent] = useState('');
  const [jPrayer, setJPrayer] = useState('');

  // --- LOCAL PERSISTED STATE: PRAYERS ---
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);

  // Prayer form states
  const [pTitle, setPTitle] = useState('');
  const [pContent, setPContent] = useState('');

  // --- PERSONAL VERSE ADD FORM STATE ---
  const [showVerseForm, setShowVerseForm] = useState(false);
  const [vRef, setVRef] = useState('');
  const [vText, setVText] = useState('');
  const [vHint, setVHint] = useState('');

  // Expanded cards tracker for journal feed
  const [expandedJournals, setExpandedJournals] = useState<{ [key: string]: boolean }>({});

  // --- LOAD INITIAL DATA ---
  useEffect(() => {
    if (isGuest) {
      // Guest mode starts with a default welcome entry so they can experience the notebook
      const welcomeJournal: FaithJournalEntry = {
        id: 'welcome-journal',
        date: new Date().toLocaleDateString('ko-KR').slice(0, -1),
        category: '개인묵상',
        title: '[체험] 은혜로운 말씀 묵상 기록하기 (저장 불가)',
        passage: '시편 1:2',
        content: '여기에 말씀 묵상이나 예배 설교 노트를 자유롭게 작성해 보실 수 있습니다.\n\n※ 게스트 모드에서는 페이지를 새로고침하거나 로그아웃 시 작성한 모든 신앙 성장 기록이 사라집니다. 나만의 전용 신앙 노트를 안전하게 보관하시려면, 우측 상단에서 로그아웃 하신 후 정식 회원으로 가입하여 이용해 보시기 바랍니다!',
        prayer: '주여, 주의 율법을 주야로 즐겁게 읊조리며 그 교훈을 마음에 꼭 새겨 순종하는 복된 삶이 되게 인도하옵소서.'
      };
      setJournals([welcomeJournal]);

      const welcomePrayer: PrayerEntry = {
        id: 'welcome-prayer',
        title: '[체험] 오늘 하루의 기도제목 (저장 불가)',
        content: '학장교회 성도님들과 혹은 개인적으로 하나님께 드리는 간절한 기도제목을 적어 체험해 보세요.\n\n※ 게스트 모드(체험 계정)에서는 기기의 임시 메모리에만 보관되므로, 새로고침이나 로그아웃 시 초기화됩니다.',
        dateAdded: new Date().toLocaleDateString('ko-KR').slice(0, -1),
        isAnswered: false
      };
      setPrayers([welcomePrayer]);
      return;
    }

    // Load journals
    const savedJournals = localStorage.getItem('hagah_journals');
    if (savedJournals) {
      try {
        setJournals(JSON.parse(savedJournals));
      } catch (e) {}
    }

    // Load prayers
    const savedPrayers = localStorage.getItem('hagah_prayers');
    if (savedPrayers) {
      try {
        setPrayers(JSON.parse(savedPrayers));
      } catch (e) {}
    }
  }, [isGuest]);

  // --- JOURNAL CRUD ---
  const saveJournalsToStorage = (updated: FaithJournalEntry[]) => {
    setJournals(updated);
    if (!isGuest) {
      localStorage.setItem('hagah_journals', JSON.stringify(updated));
    }
  };

  const handleOpenNewJournal = () => {
    setEditingJournalId(null);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setJDate(`${yyyy}.${mm}.${dd}`);
    setJCategory('주일예배');
    setJTitle('');
    setJPassage('');
    setJContent('');
    setJPrayer('');
    setShowJournalForm(true);
  };

  const handleOpenEditJournal = (entry: FaithJournalEntry) => {
    setEditingJournalId(entry.id);
    setJDate(entry.date);
    setJCategory(entry.category);
    setJTitle(entry.title);
    setJPassage(entry.passage || '');
    setJContent(entry.content);
    setJPrayer(entry.prayer || '');
    setShowJournalForm(true);
  };

  const handleJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jTitle.trim() || !jContent.trim()) return;

    if (editingJournalId) {
      const updated = journals.map(item =>
        item.id === editingJournalId
          ? {
              ...item,
              date: jDate,
              category: jCategory,
              title: jTitle.trim(),
              passage: jPassage.trim() || undefined,
              content: jContent.trim(),
              prayer: jPrayer.trim() || undefined
            }
          : item
      );
      saveJournalsToStorage(updated);
    } else {
      const newEntry: FaithJournalEntry = {
        id: `journal-${Date.now()}`,
        date: jDate,
        category: jCategory,
        title: jTitle.trim(),
        passage: jPassage.trim() || undefined,
        content: jContent.trim(),
        prayer: jPrayer.trim() || undefined
      };
      saveJournalsToStorage([newEntry, ...journals]);
    }

    setShowJournalForm(false);
    setEditingJournalId(null);
  };

  const handleDeleteJournal = (id: string) => {
    if (window.confirm('정말 이 노트를 삭제하시겠습니까?')) {
      const updated = journals.filter(item => item.id !== id);
      saveJournalsToStorage(updated);
    }
  };

  const toggleExpandJournal = (id: string) => {
    setExpandedJournals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- PRAYER CRUD ---
  const savePrayersToStorage = (updated: PrayerEntry[]) => {
    setPrayers(updated);
    localStorage.setItem('hagah_prayers', JSON.stringify(updated));
  };

  const handleOpenNewPrayer = () => {
    setEditingPrayerId(null);
    setPTitle('');
    setPContent('');
    setShowPrayerForm(true);
  };

  const handleOpenEditPrayer = (entry: PrayerEntry) => {
    setEditingPrayerId(entry.id);
    setPTitle(entry.title);
    setPContent(entry.content);
    setShowPrayerForm(true);
  };

  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim() || !pContent.trim()) return;

    if (editingPrayerId) {
      const updated = prayers.map(item =>
        item.id === editingPrayerId
          ? {
              ...item,
              title: pTitle.trim(),
              content: pContent.trim()
            }
          : item
      );
      savePrayersToStorage(updated);
    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      const newEntry: PrayerEntry = {
        id: `prayer-${Date.now()}`,
        title: pTitle.trim(),
        content: pContent.trim(),
        isAnswered: false,
        dateAdded: dateStr
      };
      savePrayersToStorage([newEntry, ...prayers]);
    }

    setShowPrayerForm(false);
    setEditingPrayerId(null);
  };

  const handleDeletePrayer = (id: string) => {
    if (window.confirm('정말 이 기도제목을 삭제하시겠습니까?')) {
      const updated = prayers.filter(item => item.id !== id);
      savePrayersToStorage(updated);
    }
  };

  const handleToggleAnswered = (id: string) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const updated = prayers.map(item => {
      if (item.id === id) {
        const nextAnswered = !item.isAnswered;
        return {
          ...item,
          isAnswered: nextAnswered,
          answeredDate: nextAnswered ? dateStr : undefined
        };
      }
      return item;
    });
    savePrayersToStorage(updated);
  };

  // --- PERSONAL VERSE SUBMIT ---
  const handleVerseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vRef.trim() || !vText.trim()) return;

    onAddPersonalVerse({
      reference: vRef.trim(),
      text: vText.trim(),
      hint: vHint.trim() || undefined
    });

    setVRef('');
    setVText('');
    setVHint('');
    setShowVerseForm(false);
  };

  const personalVerses = verses.filter(v => v.isPersonal);

  return (
    <div className="space-y-6" id="personal-faith-notebook">
      {isGuest && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 shadow-xs animate-fadeIn">
          <span className="text-xl">⚠️</span>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold font-serif text-[#5A5A40]">체험 중인 게스트 모드 안내</h4>
            <p className="text-[#7A7A6A] leading-relaxed">
              현재 <strong>게스트(체험) 모드</strong>로 이용 중이십니다. 작성하시는 모든 설교/묵상 노트, 나만의 암송구절 및 기도제목은 <strong>브라우저를 새로고침하거나 로그아웃 시 즉시 삭제</strong>됩니다. 
              소중한 신앙 성장 데이터를 정식으로 저장하고 동기화하시려면 오른쪽 위 <strong>로그아웃</strong> 후 개별 성도 가입을 완료해 주세요!
            </p>
          </div>
        </div>
      )}

      {/* SECTION CARD HEADER */}
      <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#EAF2D7] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">My spiritual companion</span>
            <h2 className="text-2xl font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#8A9A5B] fill-[#8A9A5B]/10" />
              나의 신앙 노트 & 묵상 수첩
            </h2>
            <p className="text-xs text-[#7A7A6A]">
              개인적인 성경 묵상, 설교 메모, 궁금증, 나만의 암송구절과 기도제목을 체계적으로 가꾸며 삶속에서 말씀과 동행하는 신앙 노트입니다.
            </p>
          </div>

          {/* TAB SEGMENTED CONTROLS */}
          <div className="flex bg-[#F5F5F0] p-1.5 rounded-2xl border border-[#E9E3D8] self-start md:self-center">
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'journal'
                  ? 'bg-[#5A5A40] text-white shadow-sm'
                  : 'text-[#7A7A6A] hover:text-[#5A5A40]'
              }`}
            >
              묵상 / 설교 노트
            </button>
            <button
              onClick={() => setActiveTab('verse')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'verse'
                  ? 'bg-[#5A5A40] text-white shadow-sm'
                  : 'text-[#7A7A6A] hover:text-[#5A5A40]'
              }`}
            >
              나만의 암송구절
            </button>
            <button
              onClick={() => setActiveTab('prayer')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'prayer'
                  ? 'bg-[#5A5A40] text-white shadow-sm'
                  : 'text-[#7A7A6A] hover:text-[#5A5A40]'
              }`}
            >
              기도제목 수첩
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB CONTENT: JOURNALS --- */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8A9A5B]" />
              말씀 묵상 및 설교 노트 피드 ({journals.length}개)
            </h3>
            <button
              onClick={handleOpenNewJournal}
              className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-extrabold text-white bg-[#8A9A5B] hover:bg-[#73824C] rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              새 노트 쓰기
            </button>
          </div>

          {/* New/Edit Journal Form Modal/Card */}
          <AnimatePresence>
            {showJournalForm && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-[#E9E3D8] rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex justify-between items-center border-b border-[#F0ECE4] pb-3">
                  <h4 className="text-sm font-serif font-bold text-[#5A5A40]">
                    {editingJournalId ? '노트 수정하기' : '새로운 신앙 노트 작성'}
                  </h4>
                  <button
                    onClick={() => setShowJournalForm(false)}
                    className="text-xs text-[#A0A090] hover:text-[#5A5A40] font-bold"
                  >
                    닫기 ✕
                  </button>
                </div>

                <form onSubmit={handleJournalSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date input */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#7A7A6A]">날짜 (YYYY.MM.DD)</label>
                      <input
                        type="text"
                        value={jDate}
                        onChange={(e) => setJDate(e.target.value)}
                        placeholder="예: 2026.07.09"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                        required
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-[#7A7A6A]">노트 구분</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {([
                          { key: '주일예배', label: '주일예배 ⛪' },
                          { key: '주간예배', label: '주간예배 🗓️' },
                          { key: '새벽예배', label: '새벽예배 🌅' },
                          { key: '집회예배', label: '집회예배 🔥' },
                          { key: '개인묵상', label: '개인묵상 🌸' }
                        ] as const).map(({ key, label }) => {
                          const activeClass =
                            jCategory === key
                              ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                              : 'bg-white text-[#7A7A6A] border-[#E9E3D8] hover:bg-[#F9F7F2]';
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setJCategory(key)}
                              className={`text-[11px] py-2 px-1.5 border rounded-lg font-bold text-center transition ${activeClass}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A]">노트 제목</label>
                    <input
                      type="text"
                      value={jTitle}
                      onChange={(e) => setJTitle(e.target.value)}
                      placeholder="예: 주일 대예배 말씀, 데살로니가전서 5장 묵상"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                      required
                    />
                  </div>

                  {/* Scripture Reference */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A]">성경 구절 (선택사항)</label>
                    <input
                      type="text"
                      value={jPassage}
                      onChange={(e) => setJPassage(e.target.value)}
                      placeholder="예: 시편 23편 1~3절"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                    />
                  </div>

                  {/* Main Content */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A]">은혜로운 깨달음 및 내용 요약</label>
                    <textarea
                      value={jContent}
                      onChange={(e) => setJContent(e.target.value)}
                      placeholder="설교 요약 내용, 말씀을 통해 마음에 찾아온 영감, 깨달음, 은혜, 혹은 묵상하며 들었던 성경적인 궁금증을 기록해 보세요."
                      rows={5}
                      className="w-full text-xs p-3 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-serif leading-relaxed"
                      required
                    />
                  </div>

                  {/* Related Prayer */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A]">결단과 기도제목 (선택사항)</label>
                    <textarea
                      value={jPrayer}
                      onChange={(e) => setJPrayer(e.target.value)}
                      placeholder="이 노트를 바탕으로 삼은 결단의 기도 제목이나 다짐이 있다면 기록해 보세요."
                      rows={2}
                      className="w-full text-xs p-3 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowJournalForm(false)}
                      className="px-5 py-2.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A30] text-white border border-[#5A5A40] text-xs font-bold rounded-xl transition"
                    >
                      저장하기
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Journal Feed List */}
          <div className="space-y-4">
            {journals.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E9E3D8] rounded-3xl p-12 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-[#A0A090] mx-auto opacity-60" />
                <p className="text-sm font-medium text-[#7A7A6A]">기록된 신앙 노트가 없습니다.</p>
                <p className="text-xs text-[#A0A090]">우측 상단의 '새 노트 쓰기'를 클릭해 설교 메모나 말씀 묵상을 남겨보세요.</p>
              </div>
            ) : (
              journals.map((entry) => {
                const isExpanded = expandedJournals[entry.id];
                
                let catBadge = '';
                let catBadgeClass = '';
                if (entry.category === '주일예배') {
                  catBadge = '주일예배 ⛪';
                  catBadgeClass = 'bg-[#FDF6E2] text-[#B8860B] border-[#F5D76E]/50';
                } else if (entry.category === '주간예배') {
                  catBadge = '주간예배 🗓️';
                  catBadgeClass = 'bg-[#E5F1FA] text-[#2F6FA7] border-[#BCD9EE]';
                } else if (entry.category === '새벽예배') {
                  catBadge = '새벽예배 🌅';
                  catBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                } else if (entry.category === '집회예배') {
                  catBadge = '집회예배 🔥';
                  catBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                } else if (entry.category === '개인묵상' || entry.category === 'meditation') {
                  catBadge = '개인묵상 🌸';
                  catBadgeClass = 'bg-[#EAF2D7] text-[#5A6D30] border-[#D1E2A4]';
                } else if (entry.category === 'sermon') {
                  catBadge = '설교 요약 ⛪';
                  catBadgeClass = 'bg-[#FDF6E2] text-[#B8860B] border-[#F5D76E]/50';
                } else {
                  catBadge = '신앙 질문 ❓';
                  catBadgeClass = 'bg-stone-100 text-stone-700 border-stone-200';
                }

                return (
                  <motion.div
                    key={entry.id}
                    layout
                    className="bg-white border border-[#E9E3D8] rounded-3xl p-5.5 shadow-sm space-y-4 hover:shadow-md transition duration-200"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${catBadgeClass}`}>
                            {catBadge}
                          </span>
                          <span className="text-[10px] font-bold text-[#A0A090] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {entry.date}
                          </span>
                        </div>
                        <h4 className="text-base font-serif font-bold text-[#5A5A40] leading-snug">
                          {entry.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditJournal(entry)}
                          className="p-1.5 text-[#A0A090] hover:text-[#5A5A40] rounded-lg hover:bg-[#F5F5F0] transition"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJournal(entry.id)}
                          className="p-1.5 text-[#A0A090] hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Passage if exists */}
                    {entry.passage && (
                      <div className="bg-[#F9F7F2] border-l-2 border-[#8A9A5B] px-3.5 py-2 rounded-r-xl">
                        <p className="text-xs font-serif font-medium text-[#7A7A6A] italic">
                          "{entry.passage}"
                        </p>
                      </div>
                    )}

                    {/* Content text */}
                    <div className="text-xs text-[#4A4A4A] leading-relaxed font-serif whitespace-pre-wrap">
                      {isExpanded ? entry.content : (
                        entry.content.length > 200 ? `${entry.content.slice(0, 200)}...` : entry.content
                      )}
                    </div>

                    {/* Show associated prayer if exists and is expanded */}
                    {entry.prayer && isExpanded && (
                      <div className="pt-3 border-t border-[#F0ECE4] space-y-1">
                        <span className="text-[10px] font-bold text-[#8A9A5B] flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-[#8A9A5B]/20" />
                          결단과 기도제목
                        </span>
                        <p className="text-xs text-[#7A7A6A] bg-[#F5F5F0]/50 p-2.5 rounded-lg border border-[#E9E3D8]/50 whitespace-pre-wrap">
                          {entry.prayer}
                        </p>
                      </div>
                    )}

                    {/* Expand/Collapse Button */}
                    {entry.content.length > 200 && (
                      <button
                        onClick={() => toggleExpandJournal(entry.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#8A9A5B] hover:text-[#73824C] pt-1"
                      >
                        {isExpanded ? (
                          <>
                            <span>접기</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>전체 내용 더보기</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PERSONAL VERSES --- */}
      {activeTab === 'verse' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#8A9A5B]" />
              나의 개인 암송 성구 대시보드 ({personalVerses.length}구절)
            </h3>
            <button
              onClick={() => setShowVerseForm(!showVerseForm)}
              className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-extrabold text-white bg-[#8A9A5B] hover:bg-[#73824C] rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              나만의 구절 등록
            </button>
          </div>

          {/* New Verse Form Panel */}
          <AnimatePresence>
            {showVerseForm && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-[#E9E3D8] rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex justify-between items-center border-b border-[#F0ECE4] pb-3">
                  <h4 className="text-sm font-serif font-bold text-[#5A5A40]">나만의 암송 말씀 추가</h4>
                  <button
                    onClick={() => setShowVerseForm(false)}
                    className="text-xs text-[#A0A090] hover:text-[#5A5A40] font-bold"
                  >
                    닫기 ✕
                  </button>
                </div>

                <form onSubmit={handleVerseSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A] mb-1">성경 말씀 구절 (장절)</label>
                    <input
                      type="text"
                      value={vRef}
                      onChange={(e) => setVRef(e.target.value)}
                      placeholder="예: 요한복음 3장 16절"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A] mb-1">말씀 본문 텍스트</label>
                    <textarea
                      value={vText}
                      onChange={(e) => setVText(e.target.value)}
                      placeholder="예: 하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이라"
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-serif leading-relaxed"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A] mb-1">암송 힌트 / 단서 (선택사항)</label>
                    <input
                      type="text"
                      value={vHint}
                      onChange={(e) => setVHint(e.target.value)}
                      placeholder="예: 하나님의 세상을 향한 큰 사랑과 영생의 귀한 약속"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowVerseForm(false)}
                      className="px-5 py-2.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A30] text-white border border-[#5A5A40] text-xs font-bold rounded-xl transition"
                    >
                      성구 등록
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Personal Verses List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {personalVerses.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E9E3D8] rounded-3xl p-12 text-center col-span-2 space-y-3">
                <Bookmark className="w-8 h-8 text-[#A0A090] mx-auto opacity-60" />
                <p className="text-sm font-medium text-[#7A7A6A]">등록된 개인 암송 성구가 없습니다.</p>
                <p className="text-xs text-[#A0A090]">개인적으로 은혜를 입어 평생 마음에 새기고 싶은 구절을 등록해 자유롭게 암송 연습을 해보세요.</p>
              </div>
            ) : (
              personalVerses.map((verse) => {
                const statusInfo = verseStatuses[verse.id] || { status: 'not_started' };
                let statusBadgeClass = "text-[10px] font-extrabold px-2 py-0.5 rounded-md border ";
                let statusLabel = "시작 전 💤";

                if (statusInfo.status === 'completed') {
                  statusBadgeClass += "bg-[#F5F5F0] text-[#8A9A5B] border-[#E9E3D8]";
                  statusLabel = "암송 완료 ✨";
                } else if (statusInfo.status === 'memorizing') {
                  statusBadgeClass += "bg-[#F9F7F2] text-[#5A5A40] border-[#E9E3D8]";
                  statusLabel = "외우는 중 📖";
                } else {
                  statusBadgeClass += "bg-stone-50 text-stone-400 border-stone-100";
                }

                return (
                  <motion.div
                    key={verse.id}
                    layout
                    className="bg-white border border-[#E9E3D8] rounded-3xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#EAF2D7] px-2 py-0.5 rounded-md border border-[#D1E2A4]">
                            개인 구절 📌
                          </span>
                          <span className={statusBadgeClass}>{statusLabel}</span>
                        </div>

                        <button
                          onClick={() => onDeletePersonalVerse(verse.id)}
                          className="p-1.5 text-[#A0A090] hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                          title="구절 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-serif font-extrabold text-[#5A5A40]">
                          {verse.reference}
                        </h4>
                        <p className="text-xs font-serif font-medium text-[#4A4A4A] leading-relaxed">
                          {verse.text}
                        </p>
                      </div>

                      {verse.hint && (
                        <p className="text-[11px] text-[#A0A090] italic font-sans flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-[#8A9A5B]" />
                          단서: {verse.hint}
                        </p>
                      )}

                      {/* Visual Progress Bar and completion messages */}
                      {(() => {
                        const progressPercent = statusInfo.status === 'completed' 
                          ? 100 
                          : statusInfo.status === 'memorizing' 
                            ? (statusInfo.bestScore || 50) 
                            : 0;

                        return (
                          <div className="space-y-1.5 pt-2 border-t border-[#F5F5F0]">
                            <div className="flex justify-between text-[10px] font-bold text-[#A0A090]">
                              <span>암송 성취도</span>
                              <span className="font-mono">{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden border border-[#E9E3D8]">
                              <div 
                                className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-[#8A9A5B]' : 'bg-amber-500'}`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            {progressPercent === 100 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10.5px] text-[#8A9A5B] font-bold font-serif bg-[#EAF2D7]/50 px-2.5 py-1.5 rounded-xl text-center mt-2"
                              >
                                🎉 오늘도 고생했어요! 정말 멋지세요!
                              </motion.div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Interactive Practice triggers */}
                    <div className="pt-3 border-t border-[#F0ECE4] grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => onStartBlankPractice(verse.id)}
                        className="py-1.5 bg-[#F9F7F2] hover:bg-[#8A9A5B] hover:text-white border border-[#E9E3D8] text-[#5A5A40] text-[10px] font-extrabold rounded-lg transition"
                      >
                        빈칸 연습
                      </button>
                      <button
                        onClick={() => onStartWriteTest(verse.id)}
                        className="py-1.5 bg-[#F9F7F2] hover:bg-[#5A5A40] hover:text-white border border-[#E9E3D8] text-[#5A5A40] text-[10px] font-extrabold rounded-lg transition"
                      >
                        직접 쓰기
                      </button>
                      <button
                        onClick={() => onStartSpeakAlong(verse.id)}
                        className="py-1.5 bg-[#F9F7F2] hover:bg-[#8A9A5B] hover:text-white border border-[#E9E3D8] text-[#5A5A40] text-[10px] font-extrabold rounded-lg transition flex items-center justify-center gap-1"
                      >
                        따라 말하기 🎙️
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PRAYERS --- */}
      {activeTab === 'prayer' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#8A9A5B]" />
              기도제목 수첩 & 주님과의 영적 대화 ({prayers.length}개)
            </h3>
            <button
              onClick={handleOpenNewPrayer}
              className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-extrabold text-white bg-[#8A9A5B] hover:bg-[#73824C] rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              기도제목 추가
            </button>
          </div>

          {/* New/Edit Prayer Form */}
          <AnimatePresence>
            {showPrayerForm && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white border border-[#E9E3D8] rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex justify-between items-center border-b border-[#F0ECE4] pb-3">
                  <h4 className="text-sm font-serif font-bold text-[#5A5A40]">
                    {editingPrayerId ? '기도제목 수정' : '새로운 기도제목 쓰기'}
                  </h4>
                  <button
                    onClick={() => setShowPrayerForm(false)}
                    className="text-xs text-[#A0A090] hover:text-[#5A5A40] font-bold"
                  >
                    닫기 ✕
                  </button>
                </div>

                <form onSubmit={handlePrayerSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A] mb-1">기도제목</label>
                    <input
                      type="text"
                      value={pTitle}
                      onChange={(e) => setPTitle(e.target.value)}
                      placeholder="예: 하반기 영적 대각성과 신앙 회복을 위한 기도"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#7A7A6A] mb-1">상세한 기도 내용 및 세부 기도제목</label>
                    <textarea
                      value={pContent}
                      onChange={(e) => setPContent(e.target.value)}
                      placeholder="매일 하나님 앞에 소리내어 아뢰고 싶은 내용과 주님의 뜻에 합한 삶의 세부적인 기도 요청사항들을 적어보세요."
                      rows={4}
                      className="w-full text-xs p-3 rounded-lg border border-[#E9E3D8] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-serif leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPrayerForm(false)}
                      className="px-5 py-2.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A30] text-white border border-[#5A5A40] text-xs font-bold rounded-xl transition"
                    >
                      등록하기
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prayer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {prayers.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E9E3D8] rounded-3xl p-12 text-center col-span-2 space-y-3">
                <Heart className="w-8 h-8 text-[#A0A090] mx-auto opacity-60" />
                <p className="text-sm font-medium text-[#7A7A6A]">등록된 기도제목이 없습니다.</p>
                <p className="text-xs text-[#A0A090]">마음의 소원과 영적 중보의 기도를 심고, 주님의 신실한 응답을 기록해 보세요.</p>
              </div>
            ) : (
              prayers.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  className={`border rounded-3xl p-5 shadow-sm transition duration-200 flex flex-col justify-between gap-4 ${
                    entry.isAnswered
                      ? 'bg-[#FDF6E2]/40 border-[#F5D76E] shadow-amber-50/50'
                      : 'bg-white border-[#E9E3D8]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#A0A090] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          기도 시작: {entry.dateAdded}
                        </span>
                        <h4 className={`text-sm font-serif font-extrabold leading-snug ${
                          entry.isAnswered ? 'text-[#B8860B] line-through decoration-[#B8860B]/30' : 'text-[#5A5A40]'
                        }`}>
                          {entry.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditPrayer(entry)}
                          className="p-1.5 text-[#A0A090] hover:text-[#5A5A40] rounded-lg hover:bg-[#F5F5F0] transition"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePrayer(entry.id)}
                          className="p-1.5 text-[#A0A090] hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-[#4A4A4A] leading-relaxed font-serif whitespace-pre-wrap">
                      {entry.content}
                    </div>

                    {entry.isAnswered && entry.answeredDate && (
                      <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-2.5 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-[#B8860B] shrink-0 mt-0.5 fill-amber-300/20" />
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-[#B8860B]">🙌 기도의 응답에 감사드립니다!</p>
                          <p className="text-[9px] text-[#A08050]">응답 기록일자: {entry.answeredDate}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle Answer Status */}
                  <div className="pt-3.5 border-t border-[#F0ECE4] flex justify-between items-center">
                    <button
                      onClick={() => handleToggleAnswered(entry.id)}
                      className={`flex items-center gap-1.5 text-[11px] font-extrabold transition px-3 py-1.5 rounded-xl border ${
                        entry.isAnswered
                          ? 'bg-[#B8860B] border-[#B8860B] text-white'
                          : 'bg-white border-[#E9E3D8] text-[#7A7A6A] hover:bg-[#F9F7F2]'
                      }`}
                    >
                      {entry.isAnswered ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 fill-white text-[#B8860B]" />
                          <span>기도 응답 완료 🎉</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5" />
                          <span>기도 응답 대기 중</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
