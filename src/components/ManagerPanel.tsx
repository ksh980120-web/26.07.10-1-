/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Share2, FileSpreadsheet, Copy, Check, UploadCloud, X, HelpCircle, Users, Award, Printer, Trophy, RotateCcw, Calendar, TrendingUp, BookOpen, Layers } from 'lucide-react';
import { Verse, GongGwa } from '../types';
import PastorAdminPanel from './PastorAdminPanel';

// Helper: Calculate Quarter and Week from Date (e.g., "2026.07.12", "2026-07-12")
const calculateQuarterAndWeekFromDate = (dateStr: string): { quarter: number, week: number } | null => {
  if (!dateStr) return null;
  const parts = dateStr.split(/[./-]/).map(p => p.trim());
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dateObj = new Date(year, month - 1, day);
  const quarter = Math.floor((month - 1) / 3) + 1;
  
  // Find first day of the quarter
  const qStartMonth = (quarter - 1) * 3; // 0, 3, 6, 9
  const qStartDate = new Date(year, qStartMonth, 1);
  
  // Difference in days
  const diffMs = dateObj.getTime() - qStartDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Week is 1-indexed. Aligning to 7-day intervals.
  const week = Math.min(13, Math.max(1, Math.floor(diffDays / 7) + 1));
  return { quarter, week };
};

// Helper: Auto-generate meditation guide based on scripture reference and text
const autoGenerateMeditationGuide = (ref: string, text: string): string => {
  const textLower = text.toLowerCase();
  const refLower = ref.toLowerCase();
  
  if (refLower.includes('요한') || textLower.includes('사랑')) {
    return '우리를 향한 독생자 예수님의 크신 사랑과 십자가의 대속의 보혈';
  }
  if (textLower.includes('믿음') || textLower.includes('바라')) {
    return '보이지 않는 상황 속에서도 끝까지 소망하며 주를 바라보는 믿음';
  }
  if (textLower.includes('지혜') || textLower.includes('여호와를 경외')) {
    return '여호와를 경외하고 그분의 말씀 앞에 자기를 낮추는 참된 지혜';
  }
  if (textLower.includes('평강') || textLower.includes('평안') || textLower.includes('두려워')) {
    return '세상이 주지 못하는 영원한 평안으로 우리의 마음과 생각을 지키시는 주님';
  }
  if (textLower.includes('기도') || textLower.includes('부르짖')) {
    return '부르짖는 자의 신음을 들으시고 신실하게 응답하시는 하나님';
  }
  if (textLower.includes('인도') || textLower.includes('길') || textLower.includes('목자')) {
    return '우리의 선한 목자 되시어 쉴 만한 물가와 바른 길로 이끄시는 인도하심';
  }
  if (textLower.includes('은혜') || textLower.includes('긍휼')) {
    return '자격 없는 자에게 거저 주시는 하나님의 한없는 긍휼과 은혜';
  }
  if (textLower.includes('빛') || textLower.includes('어둠')) {
    return '세상의 어두운 그늘을 비추며 영원한 소망으로 이끄시는 참된 빛';
  }
  if (textLower.includes('십자가') || textLower.includes('그리스도') || textLower.includes('구원')) {
    return '십자가 대속의 보혈과 주 예수 그리스도의 온전하신 구원 계획';
  }
  if (textLower.includes('능력') || textLower.includes('힘') || textLower.includes('강하')) {
    return '연약한 우리를 강하게 하시고 새 힘을 공급하시는 여호와 하나님의 권능';
  }
  if (textLower.includes('말씀') || textLower.includes('계명') || textLower.includes('율법')) {
    return '우리의 발에 등이요 길에 빛이 되시며 생명을 살리는 등불 같은 말씀';
  }

  // General fallback summary based on Book name
  if (refLower.includes('창세') || refLower.includes('출애')) {
    return '우주 만물을 창조하시고 백성들을 구원하시는 살아계신 하나님의 역사';
  }
  if (refLower.includes('시편')) {
    return '모든 시련 속에서도 찬송과 기도로 오직 하나님만 의지하는 신앙의 고백';
  }
  if (refLower.includes('잠언')) {
    return '일생 동안 여호와를 기쁘시게 하고 참된 의의 길을 걷는 생활의 지혜';
  }
  if (refLower.includes('이사야') || refLower.includes('예레미야')) {
    return '죄악에서 돌이켜 영원한 구원자 되시는 여호와께 소망을 두는 약속';
  }
  if (refLower.includes('마태') || refLower.includes('마가') || refLower.includes('누가')) {
    return '이 땅에 낮고 천한 몸으로 오셔서 천국 복음을 선포하신 예수 그리스도의 행적';
  }
  if (refLower.includes('로마') || refLower.includes('갈라')) {
    return '오직 의인은 믿음으로 말미암아 살리라 하신 십자가 구원의 참된 도리';
  }

  // Smart extraction based on first few words of the verse text
  const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
  const words = cleanText.split(/\s+/);
  const snippet = words.slice(0, 3).join(' ') + '...';
  return `[${ref}] "${snippet}" 말씀을 통해 약속하시는 하나님의 한없는 축복과 신실하신 약속`;
};

interface ManagerPanelProps {
  verses: Verse[];
  onAddVerse: (verse: Omit<Verse, 'id'>) => void;
  onUpdateVerse: (id: string, updated: Partial<Verse>) => void;
  onDeleteVerse: (id: string) => void;
  onImportVerses: (imported: Verse[]) => void;
  onResetToDefaults: () => void;
  onClose: () => void;
  pinnedVerseId?: string;
  pinnedMonthVerseId?: string;
  onPinVerse?: (id: string) => void;
  onPinMonthVerse?: (id: string) => void;
  userRole?: 'pastor' | 'manager';
  gongGwaLessons: GongGwa[];
  onUpdateGongGwaLessons: (lessons: GongGwa[]) => void;
}

export default function ManagerPanel({
  verses,
  onAddVerse,
  onUpdateVerse,
  onDeleteVerse,
  onImportVerses,
  onResetToDefaults,
  onClose,
  pinnedVerseId = '',
  pinnedMonthVerseId = '',
  onPinVerse,
  onPinMonthVerse,
  userRole = 'pastor',
  gongGwaLessons = [],
  onUpdateGongGwaLessons
}: ManagerPanelProps) {
  // Navigation / Tab state for the right column
  const [rightTab, setRightTab] = useState<'groups' | 'bulletin' | 'saints' | 'gonggwa_manage'>(
    userRole === 'manager' ? 'gonggwa_manage' : 'groups'
  );

  // GongGwa content management states
  const [editingGongGwaId, setEditingGongGwaId] = useState<string | null>(null);
  const [gongGwaTitle, setGongGwaTitle] = useState('');
  const [gongGwaScriptureRef, setGongGwaScriptureRef] = useState('');
  const [gongGwaIntro, setGongGwaIntro] = useState('');
  const [gongGwaVersesRaw, setGongGwaVersesRaw] = useState('');
  const [gongGwaLessonsRaw, setGongGwaLessonsRaw] = useState('');
  const [gongGwaQnasRaw, setGongGwaQnasRaw] = useState('');

  const startEditingGongGwa = (g: GongGwa) => {
    setEditingGongGwaId(g.id);
    setGongGwaTitle(g.title);
    setGongGwaScriptureRef(g.scriptureReference);
    setGongGwaIntro(g.introduction.join('\n'));
    
    // Verses
    const versesStr = g.verses.map(v => `${v.reference} | ${v.text} | ${v.isKey ? 'Y' : 'N'} | ${v.hint || ''}`).join('\n');
    setGongGwaVersesRaw(versesStr);
    
    // Core lessons
    const lessonsStr = g.coreLessons.map(l => `${l.title} | ${l.verse} | ${l.desc}`).join('\n');
    setGongGwaLessonsRaw(lessonsStr);
    
    // QnAs
    const qnasStr = g.qnas.map(q => `${q.question} | ${q.answer}`).join('\n');
    setGongGwaQnasRaw(qnasStr);
  };

  const startNewGongGwa = () => {
    setEditingGongGwaId('new');
    setGongGwaTitle('8공과: 새로운 과');
    setGongGwaScriptureRef('말씀 범위');
    setGongGwaIntro('첫째 도입 내용...\n둘째 도입 내용...');
    setGongGwaVersesRaw('말씀 장절 | 말씀 본문 내용 | N | 힌트 내용');
    setGongGwaLessonsRaw('1. 핵심 주제 | 말씀 장절 | 핵심 설명 내용');
    setGongGwaQnasRaw('문 1. 질문 내용 | 답변 내용');
  };

  const handleSaveGongGwa = () => {
    if (!gongGwaTitle.trim()) return;

    const parsedVerses = gongGwaVersesRaw.split('\n').filter(line => line.trim()).map((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      return {
        id: `gv-${editingGongGwaId === 'new' ? Date.now() : editingGongGwaId}-${idx}`,
        reference: parts[0] || '성구 장절',
        text: parts[1] || '말씀 본문',
        isKey: parts[2]?.toUpperCase() === 'Y' || parts[2]?.toUpperCase() === 'YES',
        hint: parts[3] || undefined
      };
    });

    const parsedLessons = gongGwaLessonsRaw.split('\n').filter(line => line.trim()).map((line) => {
      const parts = line.split('|').map(p => p.trim());
      return {
        title: parts[0] || '대지 제목',
        verse: parts[1] || '관련 말씀',
        desc: parts[2] || '설명 내용'
      };
    });

    const parsedQnas = gongGwaQnasRaw.split('\n').filter(line => line.trim()).map((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      return {
        id: `q-${idx}`,
        question: parts[0] || '질문 내용',
        answer: parts[1] || '답변 내용'
      };
    });

    const updatedGongGwa: GongGwa = {
      id: editingGongGwaId === 'new' ? `gonggwa-${Date.now()}` : editingGongGwaId!,
      title: gongGwaTitle.trim(),
      scriptureReference: gongGwaScriptureRef.trim(),
      introduction: gongGwaIntro.split('\n').filter(line => line.trim()),
      verses: parsedVerses,
      coreLessons: parsedLessons,
      qnas: parsedQnas
    };

    let newLessons = [...gongGwaLessons];
    if (editingGongGwaId === 'new') {
      newLessons.push(updatedGongGwa);
    } else {
      newLessons = newLessons.map(g => g.id === editingGongGwaId ? updatedGongGwa : g);
    }

    onUpdateGongGwaLessons(newLessons);
    setEditingGongGwaId(null);
  };

  const handleDeleteGongGwa = (id: string) => {
    const newLessons = gongGwaLessons.filter(g => g.id !== id);
    onUpdateGongGwaLessons(newLessons);
    if (editingGongGwaId === id) {
      setEditingGongGwaId(null);
    }
  };

  // Bulletin (Pastor's Encouragement Message Generator) states
  const [selectedBulletinVerseId, setSelectedBulletinVerseId] = useState<string>(verses[0]?.id || '');
  const [bulletinTone, setBulletinTone] = useState<'comfort' | 'courage' | 'grace'>('comfort');
  const [copiedBulletinText, setCopiedBulletinText] = useState(false);
  const [customPastorMessage, setCustomPastorMessage] = useState('');
  const [showSharingPreview, setShowSharingPreview] = useState(false);

  // Add state
  const [newRef, setNewRef] = useState('');
  const [newText, setNewText] = useState('');
  const [newQuarter, setNewQuarter] = useState<number>(1);
  const [newWeek, setNewWeek] = useState<number>(1);
  const [newHint, setNewHint] = useState('');
  const [newDate, setNewDate] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRef, setEditRef] = useState('');
  const [editText, setEditText] = useState('');
  const [editQuarter, setEditQuarter] = useState<number>(1);
  const [editWeek, setEditWeek] = useState<number>(1);
  const [editHint, setEditHint] = useState('');
  const [editDate, setEditDate] = useState('');

  // Sharing states
  const [shareCode, setShareCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Small Group sharing generator states
  const [selectedSharingVerseId, setSelectedSharingVerseId] = useState<string>(verses[0]?.id || '');
  const [sharingTheme, setSharingTheme] = useState<'gratitude' | 'faith' | 'love' | 'comfort'>('gratitude');
  const [copiedSharingText, setCopiedSharingText] = useState(false);

  // Custom Deletion & Reset Modal states (to bypass window.confirm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Submit new verse
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRef.trim() || !newText.trim()) return;

    let finalQuarter = newQuarter;
    let finalWeek = newWeek;
    const res = calculateQuarterAndWeekFromDate(newDate.trim());
    if (res) {
      finalQuarter = res.quarter;
      finalWeek = res.week;
    }

    const finalHint = newHint.trim() || autoGenerateMeditationGuide(newRef.trim(), newText.trim());

    onAddVerse({
      reference: newRef.trim(),
      text: newText.trim(),
      quarter: finalQuarter,
      week: finalWeek,
      hint: finalHint,
      date: newDate.trim() || undefined
    });

    // Reset fields
    setNewRef('');
    setNewText('');
    setNewHint('');
    setNewDate('');
    // Automatically advance week for convenience
    setNewWeek(w => Math.min(13, w + 1));
  };

  // Start editing
  const startEditing = (verse: Verse) => {
    setEditingId(verse.id);
    setEditRef(verse.reference);
    setEditText(verse.text);
    setEditQuarter(verse.quarter);
    setEditWeek(verse.week);
    setEditHint(verse.hint || '');
    setEditDate(verse.date || '');
  };

  // Save edit
  const handleSaveEdit = (id: string) => {
    if (!editRef.trim() || !editText.trim()) return;

    const finalHint = editHint.trim() || autoGenerateMeditationGuide(editRef.trim(), editText.trim());

    onUpdateVerse(id, {
      reference: editRef.trim(),
      text: editText.trim(),
      quarter: editQuarter,
      week: editWeek,
      hint: finalHint,
      date: editDate.trim() || undefined
    });

    setEditingId(null);
  };

  // Generate share code (Base64 encoded JSON of all custom and standard verses)
  const generateShareCode = () => {
    try {
      const dataStr = JSON.stringify(verses);
      const b64 = btoa(unescape(encodeURIComponent(dataStr)));
      setShareCode(b64);
      navigator.clipboard.writeText(b64);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Failed to generate code', e);
    }
  };

  // Import share code
  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);
    if (!importCode.trim()) {
      setImportError('공유 코드를 입력해 주세요.');
      return;
    }

    try {
      const decodedStr = decodeURIComponent(escape(atob(importCode.trim())));
      const parsed = JSON.parse(decodedStr);
      
      if (!Array.isArray(parsed)) {
        throw new Error('올바른 공유 코드 형식이 아닙니다 (배열이 아님).');
      }

      // Basic validation
      const validVerses = parsed.filter((v: any) => v.reference && v.text && v.quarter && v.week);
      if (validVerses.length === 0) {
        throw new Error('가져올 수 있는 유효한 성구 데이터가 없습니다.');
      }

      onImportVerses(validVerses);
      setImportSuccess(true);
      setImportCode('');
    } catch (e) {
      setImportError('유효하지 않은 공유 코드입니다. 코드가 정확히 복사되었는지 확인해 주세요.');
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-md border border-[#E9E3D8] max-w-4xl mx-auto space-y-8" id="manager-panel">
      {/* Ornate Print styles specifically targeting document printing */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .printable-content {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            z-index: 99999;
            background: white !important;
            border: 12px double #8A9A5B !important;
            padding: 4rem 3rem !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .printable-content * {
            color: black !important;
          }
          #main-app, header, #manager-panel > *:not(.printable-content) {
            display: none !important;
          }
        }
      `}</style>

      {/* Title Header */}
      <div className="flex justify-between items-center pb-4 border-b border-[#E9E3D8]">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#5A5A40] flex items-center gap-2">
            <FileSpreadsheet className="w-5.5 h-5.5 text-[#8A9A5B]" />
            성구 관리자 패널
          </h2>
          <p className="text-xs text-[#7A7A6A] mt-1">
            우리 교회 주간 암송 계획을 관리하고 교우들에게 말씀과 수료 기쁨을 전해보세요.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F5F0] hover:bg-[#8A9A5B] hover:text-white text-[#5A5A40] transition text-xs font-bold shadow-xs cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>목록으로 돌아가기</span>
        </button>
      </div>

      {/* Grid Layout for Forms & Share */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Add Verse Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#8A9A5B]" />
            금주 암송 성구
          </h3>
          <form onSubmit={handleAddSubmit} className="space-y-3.5 bg-[#F9F7F2] p-5 rounded-2xl border border-[#E9E3D8]">
            <div>
              <label className="block text-xs font-semibold text-[#7A7A6A] mb-1">주일 일자 (예: 2026.07.12)</label>
              <input
                type="text"
                value={newDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewDate(val);
                  const res = calculateQuarterAndWeekFromDate(val);
                  if (res) {
                    setNewQuarter(res.quarter);
                    setNewWeek(res.week);
                  }
                }}
                placeholder="예: 2026.07.12"
                className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A7A6A] mb-1">성경 장절 (장/절)</label>
              <input
                type="text"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                placeholder="예: 요한복음 3:16"
                className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A7A6A] mb-1">성경 말씀 본문</label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="성경 본문 구절을 띄어쓰기와 마침표를 지켜 입력해 주세요."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A7A6A] mb-1">묵상 가이드/힌트 (선택)</label>
              <input
                type="text"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="예: 십자가에서 완성하신 참된 사랑과 은혜"
                className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#8A9A5B] hover:bg-[#78884F] text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer"
              id="add-verse-btn"
            >
              금주 암송 성구 등록하기
            </button>
          </form>
        </div>

        {/* Right Column: Tabbed Content (Groups / Certificates / Backup) */}
        <div className="space-y-4">
          <div className="flex border border-[#E9E3D8] gap-1 bg-[#F5F5F0] p-1.5 rounded-2xl shadow-inner flex-wrap">
            <button
              type="button"
              onClick={() => setRightTab('groups')}
              className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'groups' ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <Users className="w-3.5 h-3.5 text-[#8A9A5B]" />
              소그룹 말씀 나눔
            </button>
            
            <button
              type="button"
              onClick={() => setRightTab('gonggwa_manage')}
              className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'gonggwa_manage' ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8A9A5B]" />
              공과 내용 관리
            </button>

            {userRole === 'pastor' && (
              <>
                <button
                  type="button"
                  onClick={() => setRightTab('bulletin')}
                  className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'bulletin' ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#7A7A6A] hover:bg-white/50'}`}
                >
                  <Award className="w-3.5 h-3.5 text-[#8A9A5B]" />
                  주간 말씀 권면
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('saints')}
                  className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'saints' ? 'bg-white text-[#5A5A40] shadow-sm' : 'text-[#7A7A6A] hover:bg-white/50'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#8A9A5B]" />
                  성도 성과 관리
                </button>
              </>
            )}
          </div>

          {/* Tab 1: Groups (소그룹 말씀 나눔 질문지 생성기) */}
          {rightTab === 'groups' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#8A9A5B]" />
                  소그룹 말씀 나눔지 생성기
                </h4>
                <span className="text-[10px] text-[#8A9A5B] font-semibold bg-[#F5F5F0] px-2 py-0.5 rounded-full">리더용 도구</span>
              </div>
              <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                성도님들의 주간 소그룹 모임과 구역 예배에서 말씀을 묵상하고 구체적인 삶의 나눔을 인도하기 위한 질문지를 간편하게 생성합니다.
              </p>

              {/* Selection controls */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">대상 말씀 구절 선택</label>
                  <select
                    value={selectedSharingVerseId}
                    onChange={(e) => setSelectedSharingVerseId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none"
                  >
                    {verses.map(v => (
                      <option key={v.id} value={v.id}>
                        [{v.quarter}분기 {v.week}주차] {v.reference}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">나눔 주제 선택</label>
                  <div className="grid grid-cols-4 gap-1.5 font-sans">
                    {(['gratitude', 'faith', 'love', 'comfort'] as const).map(theme => {
                      const labels = { gratitude: '감사', faith: '믿음', love: '사랑', comfort: '위로' };
                      const isSelected = sharingTheme === theme;
                      return (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => setSharingTheme(theme)}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#8A9A5B] border-[#8A9A5B] text-white font-semibold'
                              : 'bg-white border-[#E9E3D8] text-[#7A7A6A] hover:bg-[#F5F5F0]'
                          }`}
                        >
                          {labels[theme]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Generated Sheet Preview */}
              {(() => {
                const selectedVerse = verses.find(v => v.id === selectedSharingVerseId) || verses[0];
                if (!selectedVerse) return null;

                const questions = {
                  gratitude: [
                    "이 말씀에 나타난 하나님의 선하심과 인자하심이 나의 삶 속에 구체적으로 경험되었던 때는 언제인가요? 감사했던 순간을 서로 정겹게 이야기 나누어 봅시다.",
                    "오늘 하루, 그리고 이번 한 주 동안 하나님께 감사드리고 싶은 구체적인 고백 세 가지를 소그룹원들과 고백해 봅시다.",
                    "말씀을 마음에 품으며, 이번 주에 감사를 먼저 행동으로 표현하고 사랑의 마음을 전해야 할 이웃이나 가족은 누구인지 나누어 봅시다."
                  ],
                  faith: [
                    "말씀을 깊이 생각할 때, 나의 온전한 믿음의 결단을 방해하는 세상적인 근심이나 두려움은 무엇인가요? 솔직히 고백하고 함께 기도의 힘을 모읍시다.",
                    "사람이 떡으로만 살 것이 아니요 하나님의 모든 말씀으로 살리라 하신 것처럼, 눈앞의 이익 대신 말씀을 신뢰하며 용기 있게 행동했던 경험을 들려주세요.",
                    "말씀을 삶 속에 온전히 지키며 살아가기 위해 이번 한 주 동안 실천할 구체적인 영적 훈련(기도 시간 정하기, 매일 말씀 암송 등)을 결단해 봅시다."
                  ],
                  love: [
                    "이 말씀이 전하는 화평함과 거룩함을 실천하기에, 지금 내가 처한 현실이나 인간관계 속에서 가장 극복하기 힘든 감정은 무엇인가요?",
                    "예수 그리스도의 은혜 안에서 나와 성도들이 함께 주님의 기쁨을 나누고 있는지 돌아보며, 서로를 위해 어떤 응원의 손길을 건넬 수 있을지 구체적으로 나눕시다.",
                    "오늘 주님의 사랑을 흘려보내며 특별히 위로하고 축복하고 싶은 지체나 이웃을 마음에 떠올리고, 그들의 이름을 불러주며 함께 나눔을 이어갑시다."
                  ],
                  comfort: [
                    "최근 힘든 일이나 마음에 진정한 평안을 잃어버리게 만든 상황(염려, 불안 등)이 있었다면 사랑하는 소그룹원들에게 털어놓고 함께 나누어 봅시다.",
                    "내가 환난을 지날 때 주님께서 함께하셔서 나를 구원하시고 영화롭게 하신다는 약속의 음성이 현재 나의 어려움에 어떤 큰 힘과 위로를 주나요?",
                    "주 여호와를 온전한 나의 피난처이자 등대로 삼고, 내 삶의 무거운 짐을 다 주님 발앞에 내려놓을 수 있도록 서로 손을 맞잡고 간절히 소망을 기도로 나누어 봅시다."
                  ]
                }[sharingTheme];

                const handleCopySharingText = () => {
                  const text = `⛪ 학장교회 소그룹 말씀 나눔지\n\n- 말씀 구절: ${selectedVerse.reference}\n- 본문: "${selectedVerse.text}"\n- 이번 주 나눔 주제: [${sharingTheme === 'gratitude' ? '감사' : sharingTheme === 'faith' ? '믿음' : sharingTheme === 'love' ? '사랑' : '위로'}]\n\n소그룹 나눔 질문:\n1. ${questions[0]}\n2. ${questions[1]}\n3. ${questions[2]}\n\n"말씀중심 은혜중심" - 학장교회`;
                  navigator.clipboard.writeText(text);
                  setCopiedSharingText(true);
                  setTimeout(() => setCopiedSharingText(false), 2000);
                };

                return (
                  <div className="space-y-3 pt-2">
                    <div className="p-4 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl font-serif space-y-3">
                      <div className="text-center">
                        <span className="text-[9px] text-amber-700 tracking-wider">학장교회 소그룹 말씀 나눔</span>
                        <h5 className="text-xs font-bold text-[#5A5A40] mt-0.5">"{selectedVerse.reference}" 나눔 질문지</h5>
                      </div>
                      <p className="text-[10px] text-stone-500 italic text-center font-sans">
                        "{selectedVerse.text}"
                      </p>
                      <div className="border-t border-[#E9E3D8] pt-2.5 font-sans text-stone-800 space-y-2">
                        {questions.map((q, qidx) => (
                          <div key={qidx} className="flex gap-1.5 text-[10px] leading-relaxed">
                            <span className="font-bold text-[#8A9A5B] shrink-0">{qidx + 1}.</span>
                            <p>{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopySharingText}
                        className="flex-1 py-2 rounded-xl border border-[#E9E3D8] hover:bg-[#F5F5F0] text-[#5A5A40] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                      >
                        <Copy className="w-3 h-3 text-[#8A9A5B]" />
                        {copiedSharingText ? '복사 완료!' : '나눔 텍스트 복사'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSharingPreview(true)}
                        className="flex-1 py-2 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-[10px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                      >
                        <Printer className="w-3 h-3" />
                        나눔지 인쇄/미리보기
                      </button>
                    </div>

                    {/* HTML Ornate Sharing Sheet Print Layout */}
                    {showSharingPreview && (
                      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 max-w-lg w-full shadow-2xl relative">
                          <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="p-1.5 rounded-lg bg-[#5A5A40] text-white hover:bg-[#4A4A30] transition text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              인쇄하기
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSharingPreview(false)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div
                            id="printable-sharing-sheet"
                            className="border-[8px] border-double border-[#8A9A5B] p-6 bg-white rounded-xl text-center font-serif relative printable-content"
                            style={{ minHeight: '420px' }}
                          >
                            <div className="space-y-4 w-full">
                              <span className="text-[10px] text-[#8A9A5B] font-bold uppercase tracking-widest font-sans border-b border-[#8A9A5B]/30 pb-0.5 block w-max mx-auto">
                                대한예수교장로회 학장교회 소그룹 모임
                              </span>

                              <h2 className="text-xl font-bold text-gray-900 tracking-wider pt-1">
                                금주의 말씀 나눔 질문지
                              </h2>

                              <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-left text-xs font-sans space-y-1.5">
                                <p className="text-[#8A9A5B] font-bold text-[11px]">말씀 구절: {selectedVerse.reference}</p>
                                <p className="text-gray-700 italic leading-relaxed">"{selectedVerse.text}"</p>
                              </div>

                              <div className="text-left font-sans space-y-3 pt-2 text-xs">
                                <h4 className="font-bold text-gray-800 text-[11px] border-b border-stone-100 pb-1 flex items-center gap-1.5">
                                  📌 이번 주 나눔 주제: [ {sharingTheme === 'gratitude' ? '감사' : sharingTheme === 'faith' ? '믿음' : sharingTheme === 'love' ? '사랑' : '위로'} ]
                                </h4>
                                {questions.map((q, idx) => (
                                  <div key={idx} className="flex gap-2 text-gray-800 leading-relaxed">
                                    <span className="font-extrabold text-[#8A9A5B] shrink-0">{idx + 1}.</span>
                                    <p>{q}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-4 border-t border-dashed border-stone-200">
                                <p className="text-[10px] font-sans text-gray-400">
                                  "오직 말씀중심 은혜중심으로 무장하는 학장교회 성도"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab 1.5: GongGwa Management (공과 공부 내용 관리) */}
          {rightTab === 'gonggwa_manage' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#8A9A5B]" />
                  공과 공부 교재 및 내용 관리
                </h4>
                <button
                  type="button"
                  onClick={startNewGongGwa}
                  className="px-3 py-1 bg-[#8A9A5B] text-white hover:bg-[#78884F] text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>새 공과 추가</span>
                </button>
              </div>
              <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                장년공과 공부 및 배움마당 교재의 주차별 성구, 도입, 핵심 강의 대지 및 주관식 문답 문구를 등록하고 언제든지 수정할 수 있습니다.
              </p>

              {editingGongGwaId !== null ? (
                /* GongGwa Editing Form */
                <div className="space-y-3.5 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E9E3D8]">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E9E3D8]/60">
                    <span className="text-xs font-bold text-[#5A5A40]">
                      {editingGongGwaId === 'new' ? '✨ 새로운 공과 등록' : '✍️ 공과 본문 수정'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingGongGwaId(null)}
                      className="text-[#A0A090] hover:text-[#5A5A40] text-xs font-semibold"
                    >
                      취소
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">공과 명칭 (예: 7공과: 거듭남)</label>
                      <input
                        type="text"
                        value={gongGwaTitle}
                        onChange={(e) => setGongGwaTitle(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                        placeholder="7공과: 거듭남 (Rebirth)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">성경 본문 범위</label>
                      <input
                        type="text"
                        value={gongGwaScriptureRef}
                        onChange={(e) => setGongGwaScriptureRef(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                        placeholder="요한복음 3장 3절~8절"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#7A7A6A]">
                      공과 도입 / 서론 내용 (줄바꿈으로 구분)
                    </label>
                    <textarea
                      value={gongGwaIntro}
                      onChange={(e) => setGongGwaIntro(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-sans"
                      placeholder="첫째 아담으로 난 사람은 다 지옥 갑니다.&#10;둘째 아담으로 거듭난 자는 다 천국 갑니다."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">
                        본문 구절 목록 (형식: 장절 | 본문 | 암송성구여부(Y/N) | 힌트)
                      </label>
                      <span className="text-[9px] text-amber-700 font-medium">한 줄에 한 절씩 입력</span>
                    </div>
                    <textarea
                      value={gongGwaVersesRaw}
                      onChange={(e) => setGongGwaVersesRaw(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-mono"
                      placeholder="요한복음 3장 3절 | 사람이 거듭나지 아니하면 하나님 나라를 볼 수 없느니라 | N | 거듭남의 필요성&#10;요한복음 3장 6절 | 육으로 난 것은 육이요 성령으로 난 것은 영이니 | Y | 육과 영의 철저한 대조"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">
                        핵심 강의 대지 (형식: 대지번호/제목 | 관련구절 | 핵심내용)
                      </label>
                    </div>
                    <textarea
                      value={gongGwaLessonsRaw}
                      onChange={(e) => setGongGwaLessonsRaw(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-mono"
                      placeholder="1. 니고데모의 질문 | 요한복음 3:4 | 유대인의 관원인 니고데모는 육체적인 관점에서 예수님의...&#10;2. 예수님의 가르침 (바람의 비유) | 요한복음 3:8 | 바람이 부는 소리는 들어도..."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">
                        주관식 배움마당 문답 (형식: 질문 | 정답)
                      </label>
                    </div>
                    <textarea
                      value={gongGwaQnasRaw}
                      onChange={(e) => setGongGwaQnasRaw(e.target.value)}
                      rows={2.5}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-mono"
                      placeholder="문 1. 사람이 몇 종류뇨? | 육으로 난 자와 영으로 난 자 둘입니다.&#10;문 2. 천국은 어떤 사람이 가느뇨? | 거듭난 사람만 갑니다."
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingGongGwaId(null)}
                      className="flex-1 py-2 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGongGwa}
                      className="flex-1 py-2 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              ) : (
                /* GongGwa List Area */
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {gongGwaLessons.length === 0 ? (
                    <div className="p-8 text-center text-[#A0A090] italic text-xs">
                      등록된 공과가 없습니다. [새 공과 추가] 버튼을 눌러 등록해 보세요.
                    </div>
                  ) : (
                    gongGwaLessons.map((g) => (
                      <div
                        key={g.id}
                        className="p-3.5 bg-[#F9F7F2] hover:bg-[#F0ECE4]/40 border border-[#E9E3D8] rounded-2xl flex justify-between items-center transition"
                      >
                        <div className="space-y-1">
                          <h5 className="text-xs font-serif font-extrabold text-[#5A5A40] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#8A9A5B]" />
                            {g.title}
                          </h5>
                          <p className="text-[10px] text-[#7A7A6A] font-medium font-sans">
                            본문: {g.scriptureReference} • 구절 수: {g.verses.length}개 • 문답 수: {g.qnas.length}개
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditingGongGwa(g)}
                            className="p-1.5 text-stone-600 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition cursor-pointer"
                            title="공과 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {gongGwaLessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGongGwa(g.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-100 rounded-lg transition cursor-pointer"
                              title="공과 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Bulletin Word Message Generator */}
          {rightTab === 'bulletin' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-sm">
              <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#8A9A5B]" />
                목회자 주간 말씀 권면 & 카톡 알림 생성기
              </h4>
              <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                주일 강단에서 선포된 이번 주 성경 구절과 따뜻한 목회 권면을 가득 담은 성도 발송용 카카오톡/문자 메시지를 클릭 한 번으로 손쉽게 생성해 보세요!
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5A5A40] mb-1">성구 구절 선택</label>
                  <select
                    value={selectedBulletinVerseId}
                    onChange={(e) => setSelectedBulletinVerseId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] font-semibold"
                  >
                    {verses.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.quarter}분기 {v.week}주차: {v.reference}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A5A40] mb-1">권면 테마/어조</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBulletinTone('comfort')}
                      className={`py-2 text-[10px] font-extrabold rounded-lg transition border cursor-pointer ${bulletinTone === 'comfort' ? 'bg-[#5A5A40] border-[#5A5A40] text-white' : 'bg-[#FDFBF7] border-[#E9E3D8] text-[#7A7A6A] hover:bg-stone-50'}`}
                    >
                      🌱 위로와 평안
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulletinTone('courage')}
                      className={`py-2 text-[10px] font-extrabold rounded-lg transition border cursor-pointer ${bulletinTone === 'courage' ? 'bg-[#5A5A40] border-[#5A5A40] text-white' : 'bg-[#FDFBF7] border-[#E9E3D8] text-[#7A7A6A] hover:bg-stone-50'}`}
                    >
                      🔥 용기와 믿음
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulletinTone('grace')}
                      className={`py-2 text-[10px] font-extrabold rounded-lg transition border cursor-pointer ${bulletinTone === 'grace' ? 'bg-[#5A5A40] border-[#5A5A40] text-white' : 'bg-[#FDFBF7] border-[#E9E3D8] text-[#7A7A6A] hover:bg-stone-50'}`}
                    >
                      ✨ 감사와 은혜
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A5A40] mb-1">추가 목회 권면 내용 (선택)</label>
                  <textarea
                    value={customPastorMessage}
                    onChange={(e) => setCustomPastorMessage(e.target.value)}
                    placeholder="목사님의 개인적인 주간 인사말이나 교회 소식을 더 추가해 성도님들께 보낼 수 있습니다."
                    rows={2}
                    className="w-full text-[10.5px] p-2.5 rounded-lg border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                </div>
              </div>

              {/* Message preview inside card */}
              {(() => {
                const targetVerse = verses.find(v => v.id === selectedBulletinVerseId) || verses[0];
                if (!targetVerse) return null;

                const toneText = {
                  comfort: `주님의 은혜와 동행하는 복된 삶이 되시길 기도합니다. 환난과 곤고 속에서도 주의 약속을 온전히 묵상하며 마음에 크신 영적 평안을 품어보세요. 주님은 영원한 피난처이십니다.`,
                  courage: `우리는 오직 은혜의 믿음으로 세상을 넉넉히 이기는 주님의 군사입니다. 눈앞의 일시적인 문제에 위축되지 마시고, 주님의 능력의 오른손을 의지하며 이번 주 한 주도 용감히 발걸음을 내딛읍시다!`,
                  grace: `매일 아침 내려주시는 만나처럼, 하나님의 신실하신 은혜는 언제나 무한합니다. 우리의 입술과 삶 전체가 주님의 은총을 향한 감사의 찬송으로 넘쳐나는 영광스러운 일주일이 되시기를 진심으로 축복합니다.`
                }[bulletinTone];

                const fullMessage = `🍞 [학장교회 만나 말씀배달]\n"하나님과 만나는 달콤한 시간"\n\n사랑하는 학장교회 성도님,\n주일 강단의 은혜로운 말씀 암송 구절을 배달해 드립니다.\n\n📖 말씀: ${targetVerse.reference}\n✍️ 본문: "${targetVerse.text}"\n\n💬 목회 권면:\n${toneText}\n\n${customPastorMessage ? `⛪ 주간 소식:\n${customPastorMessage}\n\n` : ''}📲 모바일 말씀 트레이너 '만나'에 접속해 입체 암송 훈련에 바로 참여해 보세요!\n👉 접속하기: https://manna.hachang.org\n\n"말씀중심 은혜중심" - 학장교회 담임목사 김인수 드림`;

                const handleCopyBulletinText = () => {
                  navigator.clipboard.writeText(fullMessage);
                  setCopiedBulletinText(true);
                  setTimeout(() => setCopiedBulletinText(false), 2000);
                };

                return (
                  <div className="space-y-2.5 pt-1.5 font-sans">
                    <label className="block text-[11px] font-bold text-[#5A5A40]">카카오톡 전송용 미리보기</label>
                    <div className="p-3 bg-stone-50 border border-[#E9E3D8] rounded-xl text-[10px] text-stone-700 leading-relaxed font-mono whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                      {fullMessage}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBulletinText}
                      className="w-full py-2.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {copiedBulletinText ? '✓ 카톡 알림 복사 완료!' : '📋 카톡 발송용 전체 내용 복사'}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab 3: Saint Performance Management (성도별 성과 관리) */}
          {rightTab === 'saints' && (
            <PastorAdminPanel totalVersesCount={verses.length} />
          )}
        </div>
      </div>

      {/* Bottom: Current Verse Schedule & Management Table */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-serif font-bold text-[#5A5A40] uppercase tracking-wider">
            현재 등록된 성구 목록 ({verses.length}개)
          </h3>
        </div>

        <div className="border border-[#E9E3D8] rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F9F7F2] text-[#5A5A40] font-semibold border-b border-[#E9E3D8]">
                  <th className="p-3">주일 일자</th>
                  <th className="p-3">분기/주차</th>
                  <th className="p-3">성경구절(장절)</th>
                  <th className="p-3">말씀 본문</th>
                  <th className="p-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-[#4A4A4A] font-serif">
                {verses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#A0A090] font-sans italic">
                      등록된 암송 말씀이 없습니다. 위의 양식을 사용해 말씀을 추가해 보세요.
                    </td>
                  </tr>
                ) : (
                  [...verses].sort((a, b) => {
                    if (a.quarter !== b.quarter) return a.quarter - b.quarter;
                    return a.week - b.week;
                  }).map((v) => {
                    const isEditing = editingId === v.id;
                    return (
                      <tr key={v.id} className="hover:bg-[#F9F7F2]/30 transition">
                        <td className="p-3 font-sans font-medium whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDate}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditDate(val);
                                const res = calculateQuarterAndWeekFromDate(val);
                                if (res) {
                                  setEditQuarter(res.quarter);
                                  setEditWeek(res.week);
                                }
                              }}
                              className="p-1 border border-[#E9E3D8] rounded w-24 font-sans text-xs"
                              placeholder="2026.07.12"
                            />
                          ) : (
                            v.date || '-'
                          )}
                        </td>
                        <td className="p-3 font-sans font-medium whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex gap-1.5 w-24">
                              <select
                                value={editQuarter}
                                onChange={(e) => setEditQuarter(Number(e.target.value))}
                                className="p-1 border border-[#E9E3D8] rounded text-[10px]"
                              >
                                {[1, 2, 3, 4].map(q => (
                                  <option key={q} value={q}>{q}분기</option>
                                ))}
                              </select>
                              <select
                                value={editWeek}
                                onChange={(e) => setEditWeek(Number(e.target.value))}
                                className="p-1 border border-[#E9E3D8] rounded text-[10px]"
                              >
                                {Array.from({ length: 13 }, (_, i) => i + 1).map(w => (
                                  <option key={w} value={w}>{w}주</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="bg-[#F5F5F0] text-[#5A5A40] px-2.5 py-0.5 rounded-full text-[10px] border border-[#E9E3D8]">
                              {v.quarter}분기 {v.week}주
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-[#5A5A40] whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRef}
                              onChange={(e) => setEditRef(e.target.value)}
                              className="p-1 border border-[#E9E3D8] rounded w-full font-sans text-xs"
                            />
                          ) : (
                            v.reference
                          )}
                        </td>
                        <td className="p-3 max-w-xs md:max-w-md truncate text-[#4A4A4A]">
                          {isEditing ? (
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="p-1 border border-[#E9E3D8] rounded w-full text-xs font-sans"
                              rows={2}
                            />
                          ) : (
                            v.text
                          )}
                          {!isEditing && v.hint && (
                            <span className="block text-[10px] text-[#A0A090] font-sans truncate mt-0.5">
                              묵상 가이드: {v.hint}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap font-sans">
                          {isEditing ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => handleSaveEdit(v.id)}
                                className="px-2.5 py-1 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-lg text-[10px] font-semibold"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] rounded-lg text-[10px] font-semibold border border-[#E9E3D8]"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end items-center">
                              {onPinVerse && (
                                <button
                                  onClick={() => onPinVerse(v.id)}
                                  className={`p-1.5 rounded-lg transition ${
                                    v.id === pinnedVerseId
                                      ? 'bg-[#8A9A5B]/15 text-[#8A9A5B] font-bold'
                                      : 'text-stone-300 hover:text-[#8A9A5B] hover:bg-stone-50'
                                  }`}
                                  title="금주의 암송 말씀 지정"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z" />
                                  </svg>
                                </button>
                              )}
                              {onPinMonthVerse && (
                                <button
                                  onClick={() => onPinMonthVerse(v.id)}
                                  className={`p-1.5 rounded-lg transition ${
                                    v.id === pinnedMonthVerseId
                                      ? 'bg-[#5A5A40]/15 text-[#5A5A40] font-bold'
                                      : 'text-stone-300 hover:text-[#5A5A40] hover:bg-stone-50'
                                  }`}
                                  title="금월의 암송 말씀 지정"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => startEditing(v)}
                                className="px-2 py-1 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-[10.5px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                                title="수정"
                              >
                                <Edit3 className="w-3 h-3" />
                                수정
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(v.id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10.5px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                                title="삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                                삭제
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Deletion Confirm Modal to Bypass iframe window.confirm Restrictions */}
      {deleteConfirmId && (() => {
        const verseToDelete = verses.find(v => v.id === deleteConfirmId);
        if (!verseToDelete) return null;
        return (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 max-w-sm w-full shadow-xl text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-[#5A5A40]">성구 말씀 삭제 확인</h3>
                <p className="text-xs text-[#7A7A6A] mt-1.5 leading-relaxed font-sans">
                  정말 <strong>{verseToDelete.reference}</strong> 말씀을 삭제하시겠습니까?<br />
                  삭제 시 해당 말씀 및 진행 상황이 모두 소멸됩니다.
                </p>
              </div>
              <div className="flex gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteVerse(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  네, 삭제합니다
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-[#F5F5F0] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl hover:bg-[#E9E3D8] transition cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Reset Confirm Modal to Bypass iframe window.confirm Restrictions */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 max-w-sm w-full shadow-xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#5A5A40]">기본 성구 초기화 확인</h3>
              <p className="text-xs text-[#7A7A6A] mt-1.5 leading-relaxed font-sans">
                정말 <strong>기본 성구 목록</strong>으로 되돌리시겠습니까?<br />
                기존에 임의로 추가하거나 가져온 모든 성구 말씀이 삭제되고, 기본 수록된 성구로 교체됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => {
                  onResetToDefaults();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                네, 초기화합니다
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-[#F5F5F0] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl hover:bg-[#E9E3D8] transition cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
