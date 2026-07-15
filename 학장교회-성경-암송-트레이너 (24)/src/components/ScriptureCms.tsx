/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Bookmark,
  Sparkles,
  CheckSquare,
  Square,
  FileDown,
  Upload,
  Calendar,
  AlertCircle,
  Eye,
  BookmarkCheck,
  ChevronDown,
  RefreshCw,
  FolderPlus,
  FileText
} from 'lucide-react';
import { Verse } from '../types';

interface ScriptureCmsProps {
  verses: Verse[];
  onAddVerse: (verse: Omit<Verse, 'id'>) => Promise<void> | void;
  onUpdateVerse: (id: string, updated: Partial<Verse>) => Promise<void> | void;
  onUpdateMultipleVerses?: (ids: string[], updated: Partial<Verse>) => Promise<void> | void;
  onDeleteVerse: (id: string) => Promise<void> | void;
  onDeleteMultipleVerses?: (ids: string[]) => Promise<void> | void;
  onImportVerses: (imported: Verse[]) => Promise<void> | void;
  pinnedVerseId: string;
  pinnedMonthVerseId: string;
  onPinVerse: (id: string) => void;
  onPinMonthVerse: (id: string) => void;
  onClose: () => void;
}

// Helper: combine Category and Difficulty into duration
const combineCategoryDifficulty = (cat: string, diff: string): string => {
  return `${cat}|${diff}`;
};

// Helper: parse Category and Difficulty from duration
const parseCategoryDifficulty = (duration: string | undefined): { category: string; difficulty: string } => {
  if (!duration) return { category: '기타', difficulty: '중' };
  if (duration.includes('|')) {
    const [cat, diff] = duration.split('|');
    return { category: cat || '기타', difficulty: diff || '중' };
  }
  return { category: '기타', difficulty: duration || '중' };
};

// Helper: parse reference into Book, Chapter, Verse
const parseReference = (ref: string): { book: string; chapter: string; verse: string } => {
  if (!ref) return { book: '', chapter: '', verse: '' };
  const match = ref.match(/^(.+?)\s+(\d+)\s*:\s*([\d\-~,]+)/);
  if (match) {
    return { book: match[1], chapter: match[2], verse: match[3] };
  }
  const korMatch = ref.match(/^(.+?)\s+(\d+)편\s*(\d+)절/);
  if (korMatch) {
    return { book: korMatch[1], chapter: korMatch[2], verse: korMatch[3] };
  }
  const spaceMatch = ref.match(/^([가-힣A-Za-z]+)\s*(\d+)\s*$/);
  if (spaceMatch) {
    return { book: spaceMatch[1], chapter: spaceMatch[2], verse: '' };
  }
  return { book: ref, chapter: '', verse: '' };
};

export default function ScriptureCms({
  verses,
  onAddVerse,
  onUpdateVerse,
  onUpdateMultipleVerses,
  onDeleteVerse,
  onDeleteMultipleVerses,
  onImportVerses,
  pinnedVerseId,
  pinnedMonthVerseId,
  onPinVerse,
  onPinMonthVerse,
  onClose
}: ScriptureCmsProps) {

  // --- CMS STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [quarterFilter, setQuarterFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'book' | 'modified' | 'abc'>('date');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVerse, setEditingVerse] = useState<Verse | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cardPreviewVerse, setCardPreviewVerse] = useState<Verse | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Import state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'text' | 'csv'>('text');
  const [bulkText, setBulkText] = useState('');
  const [bulkFileError, setBulkFileError] = useState<string | null>(null);
  const [bulkParsed, setBulkParsed] = useState<Omit<Verse, 'id'>[]>([]);
  const [bulkValidationErrors, setBulkValidationErrors] = useState<string[]>([]);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1); // 1: Input, 2: Preview & Verification

  // Form Fields State (for Add / Edit)
  const [formBook, setFormBook] = useState('요한복음');
  const [formChapter, setFormChapter] = useState('3');
  const [formVerseNum, setFormVerseNum] = useState('16');
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [formCategory, setFormCategory] = useState('믿음');
  const [formDifficulty, setFormDifficulty] = useState<'상' | '중' | '하'>('중');
  const [formQuarter, setFormQuarter] = useState<number>(1);
  const [formWeek, setFormWeek] = useState<number>(1);
  const [formHint, setFormHint] = useState('');
  const [formDate, setFormDate] = useState(() => {
    return new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').slice(0, -1);
  });
  const formIsActive = true;
  const formRecommendType = 'none';

  // Categories list
  const categories = useMemo(() => {
    const list = new Set<string>(['믿음', '사랑', '지혜', '은혜', '능력', '인도', '평강', '기도', '감사', '구원']);
    verses.forEach(v => {
      const { category } = parseCategoryDifficulty(v.duration);
      if (category) list.add(category);
    });
    return Array.from(list);
  }, [verses]);

  // Handle single verse edit open
  const handleOpenEdit = (v: Verse) => {
    const { book, chapter, verse } = parseReference(v.reference);
    const { category, difficulty } = parseCategoryDifficulty(v.duration);
    
    setEditingVerse(v);
    setFormBook(book);
    setFormChapter(chapter);
    setFormVerseNum(verse);
    setFormTitle(v.title || '');
    setFormText(v.text);
    setFormCategory(category || '기타');
    setFormDifficulty((difficulty as '상' | '중' | '하') || '중');
    setFormQuarter(v.quarter || 1);
    setFormWeek(v.week || 1);
    setFormHint(v.hint || '');
    setFormDate(v.date || '');
    
    setIsEditOpen(true);
  };

  // Handle reset add form
  const handleOpenAdd = () => {
    setEditingVerse(null);
    setFormBook('');
    setFormChapter('');
    setFormVerseNum('');
    setFormTitle('');
    setFormText('');
    setFormCategory('믿음');
    setFormDifficulty('중');
    setFormQuarter(1);
    setFormWeek(1);
    setFormHint('');
    setFormDate(new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').slice(0, -1));
    setIsAddOpen(true);
  };

  // Duplicate / Clone a verse
  const handleDuplicate = async (v: Verse) => {
    const { category, difficulty } = parseCategoryDifficulty(v.duration);
    const duplicatedVerse: Omit<Verse, 'id'> = {
      reference: `${v.reference} (복사본)`,
      text: v.text,
      title: v.title ? `${v.title} (복사본)` : '복사된 말씀',
      quarter: v.quarter,
      week: v.week,
      hint: v.hint,
      date: v.date,
      isActive: v.isActive,
      isCustom: true,
      duration: combineCategoryDifficulty(category, difficulty)
    };
    await onAddVerse(duplicatedVerse);
  };

  // Bulk operation helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredVerses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVerses.map(v => v.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`선택한 ${selectedIds.length}개의 성구를 정말 일괄 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      if (onDeleteMultipleVerses) {
        await onDeleteMultipleVerses(selectedIds);
      } else {
        for (const id of selectedIds) {
          await onDeleteVerse(id);
        }
      }
      setSelectedIds([]);
    }
  };

  const handleBulkActivate = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    if (onUpdateMultipleVerses) {
      await onUpdateMultipleVerses(selectedIds, { isActive: active });
    } else {
      for (const id of selectedIds) {
        await onUpdateVerse(id, { isActive: active });
      }
    }
    setSelectedIds([]);
  };

  const handleBulkRecommend = async (type: 'week' | 'month' | 'none') => {
    if (selectedIds.length === 0) return;
    const targetId = selectedIds[0]; // Set recommendation to the first selected item
    if (type === 'week') {
      onPinVerse(targetId);
    } else if (type === 'month') {
      onPinMonthVerse(targetId);
    } else {
      if (pinnedVerseId === targetId) onPinVerse('');
      if (pinnedMonthVerseId === targetId) onPinMonthVerse('');
    }
    setSelectedIds([]);
    alert('추천 말씀 설정이 완료되었습니다.');
  };

  // Submit single verse form (Add / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBook.trim() || !formChapter.trim() || !formVerseNum.trim() || !formText.trim()) {
      alert('성구 책, 장, 절 및 본문은 필수 입력 사항입니다.');
      return;
    }

    const combinedRef = `${formBook.trim()} ${formChapter.trim()}:${formVerseNum.trim()}`;
    
    // Auto-calculate quarter from date format YYYY.MM.DD
    let calculatedQuarter = 1;
    if (formDate) {
      const parts = formDate.split('.');
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        if (month >= 1 && month <= 3) calculatedQuarter = 1;
        else if (month >= 4 && month <= 6) calculatedQuarter = 2;
        else if (month >= 7 && month <= 9) calculatedQuarter = 3;
        else if (month >= 10 && month <= 12) calculatedQuarter = 4;
      }
    }

    // Set default category '말씀' and difficulty '중' since these are removed from UI
    const durationField = combineCategoryDifficulty('말씀', '중');

    const versePayload: Omit<Verse, 'id'> = {
      reference: combinedRef,
      text: formText.trim(),
      title: formTitle.trim() || `${formBook.trim()} 말씀`,
      quarter: calculatedQuarter,
      week: 1, // Default to 1
      hint: formHint.trim(),
      date: formDate,
      isActive: formIsActive,
      isCustom: true,
      duration: durationField
    };

    if (isEditOpen && editingVerse) {
      await onUpdateVerse(editingVerse.id, versePayload);
      setIsEditOpen(false);
    } else {
      // It's Add
      // Supabase is async, so await it
      await onAddVerse(versePayload);
      setIsAddOpen(false);
    }
  };

  // Text Parsing Algorithm (Text Paste)
  const parsePastedText = (text: string): Omit<Verse, 'id'>[] => {
    const parsed: Omit<Verse, 'id'>[] = [];
    
    // First, split into lines, clean them up, and filter out anything containing "금주 암송성구"
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.includes('금주 암송성구'));

    const dateRegex = /\((\d{4})\.(\d{2})\.(\d{2})\.\)/;
    
    let i = 0;
    while (i < lines.length) {
      const currentLine = lines[i];
      const match = currentLine.match(dateRegex);
      
      if (match) {
        const year = match[1];
        const month = match[2];
        const day = match[3];
        const dateVal = `${year}.${month}.${day}`;
        
        let referencePart = currentLine.replace(dateRegex, '').trim();
        
        // Normalize Korean chapter/verse: e.g. "창세기 3장 6절" -> "창세기 3:6"
        const refRegex = /^([1-3]?\s*[가-힣A-Za-z]+)\s+(\d+)\s*[장편]\s+(\d+)\s*절?$/;
        const refMatch = referencePart.match(refRegex);
        
        let referenceCombined = referencePart;
        let bookName = "성경";
        
        if (refMatch) {
          bookName = refMatch[1].trim();
          const chapter = refMatch[2];
          const verseNum = refMatch[3];
          referenceCombined = `${bookName} ${chapter}:${verseNum}`;
        } else {
          const parts = referencePart.split(/\s+/);
          if (parts.length >= 1) {
            bookName = parts[0];
          }
        }
        
        // The text starts on the NEXT lines until we hit another line with a date pattern,
        // or we run out of lines.
        const textLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].match(dateRegex)) {
          textLines.push(lines[j]);
          j++;
        }
        
        const verseText = textLines.join(' ');
        
        let calculatedQuarter = 1;
        const m = parseInt(month, 10);
        if (m >= 1 && m <= 3) calculatedQuarter = 1;
        else if (m >= 4 && m <= 6) calculatedQuarter = 2;
        else if (m >= 7 && m <= 9) calculatedQuarter = 3;
        else if (m >= 10 && m <= 12) calculatedQuarter = 4;
        
        if (referenceCombined && verseText) {
          parsed.push({
            reference: referenceCombined,
            text: verseText,
            quarter: calculatedQuarter,
            week: 1,
            hint: `[${referenceCombined}] 말씀 묵상하기`,
            date: dateVal,
            isCustom: true,
            isPersonal: false,
            title: `${bookName} 말씀`,
            duration: "말씀|중",
            isActive: true
          });
        }
        
        i = j;
      } else {
        i++;
      }
    }
    
    // Fallback if no dates matched but we have simple "Book Chapter:Verse text" entries
    if (parsed.length === 0) {
      for (const line of lines) {
        const refRegex = /^(([1-3]?\s*[가-힣A-Za-z]+)\s+(\d+)\s*[:장편]\s*(\d+)\s*절?)\s+(.+)$/;
        const match = line.match(refRegex);
        if (match) {
          const book = match[2];
          const chapter = match[3];
          const verseNum = match[4];
          const verseText = match[5];
          const referenceCombined = `${book} ${chapter}:${verseNum}`;
          
          const today = new Date();
          const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').slice(0, -1);
          const m = today.getMonth() + 1;
          let calculatedQuarter = 1;
          if (m >= 1 && m <= 3) calculatedQuarter = 1;
          else if (m >= 4 && m <= 6) calculatedQuarter = 2;
          else if (m >= 7 && m <= 9) calculatedQuarter = 3;
          else if (m >= 10 && m <= 12) calculatedQuarter = 4;
          
          parsed.push({
            reference: referenceCombined,
            text: verseText,
            quarter: calculatedQuarter,
            week: 1,
            hint: `[${referenceCombined}] 말씀 묵상하기`,
            date: todayStr,
            isCustom: true,
            isPersonal: false,
            title: `${book} 말씀`,
            duration: "말씀|중",
            isActive: true
          });
        }
      }
    }
    
    return parsed;
  };

  // CSV Parsing Algorithm
  const parseCSVContent = (content: string): Omit<Verse, 'id'>[] => {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    
    const parsed: Omit<Verse, 'id'>[] = [];
    const hasHeaders = lines[0].toLowerCase().includes('reference') || lines[0].includes('구절') || lines[0].includes('본문');
    const startIndex = hasHeaders ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts: string[] = [];
      let insideQuote = false;
      let currentPart = '';
      
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim());
      
      if (parts.length >= 2) {
        const reference = parts[0];
        const text = parts[1];
        if (!reference || !text) continue;

        const title = parts[2] || `${reference.split(' ')[0]} 말씀`;
        const hint = parts[3] || `${reference} 말씀 묵상`;
        const quarter = parseInt(parts[4]) || 1;
        const week = parseInt(parts[5]) || 1;
        const category = parts[6] || '기타';
        const difficulty = parts[7] || '중';
        const date = parts[8] || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').slice(0, -1);
        const isActive = parts[9] === undefined ? true : (parts[9].toLowerCase() === 'true' || parts[9] === 'y' || parts[9] === '1');
        
        parsed.push({
          reference,
          text,
          quarter,
          week,
          hint,
          date,
          isCustom: true,
          isPersonal: false,
          title,
          duration: `${category}|${difficulty}`,
          isActive
        });
      }
    }
    return parsed;
  };

  // Bulk File Upload handler
  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkFileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setBulkFileError('파일을 읽을 수 없습니다.');
        return;
      }
      
      try {
        const parsed = parseCSVContent(content);
        if (parsed.length === 0) {
          setBulkFileError('파싱된 성구가 없습니다. 성경구절과 본문 형식을 확인해 주세요.');
        } else {
          setBulkParsed(parsed);
          setBulkStep(2);
        }
      } catch (err) {
        setBulkFileError('CSV 분석 도중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Trigger Bulk text parsing
  const handleTriggerBulkTextParse = () => {
    if (!bulkText.trim()) {
      alert('성구 텍스트를 입력해 주세요.');
      return;
    }
    const parsed = parsePastedText(bulkText);
    if (parsed.length === 0) {
      alert('성구를 파싱하지 못했습니다. 형식을 다시 확인해 주세요.');
      return;
    }
    setBulkParsed(parsed);
    setBulkStep(2);
  };

  // Finalize bulk import verification and save
  const handleFinalizeBulkSave = async () => {
    const preparedVerses: Verse[] = bulkParsed.map((v, i) => ({
      ...v,
      id: `verse-bulk-${Date.now()}-${i}`,
      isCustom: true
    }));

    await onImportVerses(preparedVerses);
    setIsBulkOpen(false);
    setBulkParsed([]);
    setBulkText('');
    setBulkStep(1);
    alert(`${preparedVerses.length}개의 말씀 구절이 성공적으로 일괄 등록되었습니다!`);
  };

  // --- COMPUTE SEARCH, FILTER & SORTED ---
  const filteredVerses = useMemo(() => {
    return verses.filter(v => {
      if (v.isPersonal) return false; // Never show personal notes in central Scripture CMS

      const { category } = parseCategoryDifficulty(v.duration);

      // Realtime search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesBook = v.reference.toLowerCase().includes(query);
        const matchesTitle = (v.title || '').toLowerCase().includes(query);
        const matchesText = v.text.toLowerCase().includes(query);
        const matchesCategory = category.toLowerCase().includes(query);
        
        if (!matchesBook && !matchesTitle && !matchesText && !matchesCategory) {
          return false;
        }
      }

      // Quarter
      if (quarterFilter !== 'all' && v.quarter !== quarterFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort
      if (sortBy === 'date') {
        return (b.date || '').localeCompare(a.date || '');
      } else if (sortBy === 'book') {
        return a.reference.localeCompare(b.reference);
      } else if (sortBy === 'abc') {
        return (a.title || '').localeCompare(b.title || '') || a.text.localeCompare(b.text);
      } else {
        // Modified fallback
        return b.id.localeCompare(a.id);
      }
    });
  }, [verses, searchQuery, quarterFilter, sortBy]);

  const calculatedFormQuarter = useMemo(() => {
    if (!formDate) return 1;
    const parts = formDate.split('.');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      if (month >= 1 && month <= 3) return 1;
      if (month >= 4 && month <= 6) return 2;
      if (month >= 7 && month <= 9) return 3;
      if (month >= 10 && month <= 12) return 4;
    }
    return 1;
  }, [formDate]);

  return (
    <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6 font-sans">
      
      {/* CMS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F0ECE4]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-[#8A9A5B]/10 text-[#8A9A5B] px-3 py-1 rounded-full text-xs font-bold font-serif flex items-center gap-1.5 border border-[#8A9A5B]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>교회 말씀 행정실</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-[#5A5A40] flex items-center gap-2">
            암송 말씀 통합 CMS 관리기 📂
          </h2>
          <p className="text-xs text-[#909080]">
            성도들의 영적 성장을 채우는 만나 말씀 구절을 직접 등록하고, 정렬·필터·일괄 및 추천 관리할 수 있는 목양 전용 공간입니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-sans">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-3.5 py-2.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#8A9A5B]" />
            일괄 등록 (CSV/텍스트)
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            새 성구 등록
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2.5 text-[#5A5A40] hover:bg-[#F5F5F0] border border-transparent rounded-xl text-xs font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-[#FDFBF7] border border-[#E9E3D8] p-5 rounded-[24px] space-y-4" id="cms-filters">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5A5A40]">
          <SlidersHorizontal className="w-4.5 h-4.5 text-[#8A9A5B]" />
          <span>성구 조건부 검색 및 필터링</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Realtime Search Input */}
          <div className="md:col-span-6 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#A0A090]" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="책이름, 제목, 본문 실시간 검색..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
            />
          </div>

          {/* Quarter filter */}
          <div className="md:col-span-3">
            <select
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
            >
              <option value="all">전체 분기</option>
              <option value={1}>1분기 (1~3월)</option>
              <option value={2}>2분기 (4~6월)</option>
              <option value={3}>3분기 (7~9월)</option>
              <option value={4}>4분기 (10~12월)</option>
            </select>
          </div>

          {/* Sort selection */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] font-medium focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
            >
              <option value="date">최신 등록순 📅</option>
              <option value="book">성경 책 순 📖</option>
              <option value="abc">제목 가나다순 🔠</option>
              <option value="modified">최근 수정순 🔄</option>
            </select>
          </div>
        </div>
      </div>

      {/* SCRIPTURE CMS TABLE */}
      <div className="border border-[#E9E3D8] rounded-[24px] overflow-hidden" id="cms-scripture-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FDFBF7] border-b border-[#E9E3D8] text-[#5A5A40] font-bold uppercase tracking-wider">
                <th className="py-3 px-2 w-28">성경 구절</th>
                <th className="py-3 px-2 w-32">제목</th>
                <th className="py-3 px-3">말씀 본문 (미리보기)</th>
                <th className="py-3 px-2 w-24 text-center">선포 날짜</th>
                <th className="py-3 px-2 w-14 text-center">분기</th>
                <th className="py-3 px-3 w-28 text-right">관리 기능</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4] text-[#4A4A4A]">
              {filteredVerses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#A0A090] font-medium leading-relaxed font-sans">
                    검색 필터와 일치하는 말씀 성구가 존재하지 않습니다.<br />
                    <span className="text-[11px] block mt-1">상단에서 필터를 초기화하거나 '새 성구 등록'을 눌러 직접 추가해 보세요.</span>
                  </td>
                </tr>
              ) : (
                filteredVerses.map((v) => {
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-[#F9F7F2]/50 transition duration-150"
                    >
                      {/* Bible Reference */}
                      <td className="py-3.5 px-2 font-serif font-black text-[#5A5A40] text-[13px] leading-tight">
                        {v.reference}
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-2 font-sans font-semibold text-[#6A6A5A] text-[11.5px] truncate max-w-[120px]">
                        {v.title || `${v.reference.split(' ')[0]} 말씀`}
                      </td>

                      {/* Text text preview */}
                      <td className="py-3.5 px-3 font-serif text-[12px] text-stone-600 max-w-xs sm:max-w-md truncate" title={v.text}>
                        {v.text}
                      </td>

                      {/* Proclamation Date */}
                      <td className="py-3.5 px-2 text-center font-mono text-[11px] text-stone-500">
                        {v.date || '-'}
                      </td>

                      {/* Quarter */}
                      <td className="py-3.5 px-2 text-center font-mono text-[11px] font-bold text-stone-500">
                        {v.quarter}분기
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right space-x-1.5 font-sans whitespace-nowrap">
                        <button
                          onClick={() => setCardPreviewVerse(v)}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-50"
                          title="실물 말씀 카드 미리보기"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1 text-[#5A5A40] hover:text-[#4A4A30] rounded hover:bg-stone-50"
                          title="성구 수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(v.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                          title="성구 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT SCRIPTURE DIALOG MODAL --- */}
      <AnimatePresence>
        {(isAddOpen || isEditOpen) && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-[#E9E3D8] rounded-[28px] max-w-xl w-full p-6 shadow-2xl space-y-5 my-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2.5 border-b border-[#F0ECE4]">
                <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-1.5">
                  <Bookmark className="w-5 h-5 text-[#8A9A5B]" />
                  {isEditOpen ? '말씀 성구 상세 수정 (목양실)' : '새 말씀 성구 추가 등록'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
                {/* Scripture Reference Breakdown inputs */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#5A5A40]">성경 장절 구성 (책 / 장 / 절)</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <input
                        type="text"
                        value={formBook}
                        onChange={(e) => setFormBook(e.target.value)}
                        placeholder="예: 요한복음"
                        className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formChapter}
                        onChange={(e) => setFormChapter(e.target.value)}
                        placeholder="예: 3"
                        className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formVerseNum}
                        onChange={(e) => setFormVerseNum(e.target.value)}
                        placeholder="예: 16"
                        className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    등록 시 자동으로 <span className="font-bold">"{formBook} {formChapter}:{formVerseNum}"</span> 형식으로 병합됩니다.
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#5A5A40]">말씀 제목 (소제목)</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="예: 독생자를 주신 크신 사랑 (미입력시 성경 책 이름으로 자동지정)"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                  />
                </div>

                {/* Verse Text */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#5A5A40]">성경 본문 내용</label>
                  <textarea
                    rows={4}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-serif leading-relaxed"
                  />
                </div>

                {/* Meditation guide */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#5A5A40]">묵상 가이드</label>
                  <input
                    type="text"
                    value={formHint}
                    onChange={(e) => setFormHint(e.target.value)}
                    placeholder="예: 세상 그 어떤 기쁨보다 주님 한 분의 온전한 사랑을 묵상해 봅니다."
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#5A5A40]">주일 선포 날짜 (등록일자 YYYY.MM.DD)</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="예: 2026.07.12"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                  />
                </div>

                {/* Live Card Preview Box in Form */}
                <div className="bg-[#FDFBF7] border border-[#E9E3D8]/50 p-4 rounded-2xl space-y-2 mt-4">
                  <span className="text-[10px] font-black text-[#8A9A5B] tracking-wider uppercase">실물 카드 미리보기</span>
                  <div className="bg-white border border-[#E9E3D8] p-4 rounded-xl shadow-sm text-center font-serif">
                    <span className="text-[9px] text-[#A0A090] tracking-wider font-sans block mb-1">
                      {calculatedFormQuarter}분기
                    </span>
                    <h4 className="text-sm text-[#5A5A40] font-black">{formBook} {formChapter}:{formVerseNum}</h4>
                    <p className="text-xs text-stone-600 mt-2 leading-relaxed italic">
                      "{formText || '말씀 본문이 여기에 표출됩니다.'}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-3 border-t border-[#F0ECE4]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddOpen(false);
                      setIsEditOpen(false);
                    }}
                    className="flex-1 py-3 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-black rounded-xl transition cursor-pointer shadow"
                  >
                    {isEditOpen ? '목양 관리 저장 완료' : '신규 말씀 등록 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BULK IMPORT DIALOG MODAL --- */}
      <AnimatePresence>
        {isBulkOpen && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-[#E9E3D8] rounded-[28px] max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2.5 border-b border-[#F0ECE4]">
                <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-1.5">
                  <FolderPlus className="w-5 h-5 text-[#8A9A5B]" />
                  다차원 말씀 성구 일괄 일지 등록 (Excel/CSV/텍스트)
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkOpen(false);
                    setBulkParsed([]);
                    setBulkStep(1);
                  }}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {bulkStep === 1 ? (
                // Step 1: Input Content
                <div className="space-y-4 font-sans text-xs">
                  {/* Select Import Mode */}
                  <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-[#E9E3D8]">
                    <button
                      type="button"
                      onClick={() => setBulkMode('text')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${bulkMode === 'text' ? 'bg-white text-[#5A5A40] shadow' : 'text-[#7A7A6A]'}`}
                    >
                      <FileText className="w-4 h-4 inline-block mr-1 text-[#8A9A5B]" />
                      텍스트 직접 붙여넣기 (스마트 분석)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode('csv')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${bulkMode === 'csv' ? 'bg-white text-[#5A5A40] shadow' : 'text-[#7A7A6A]'}`}
                    >
                      <FileDown className="w-4 h-4 inline-block mr-1 text-[#8A9A5B]" />
                      CSV / Excel 파일 업로드
                    </button>
                  </div>

                  {bulkMode === 'text' ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#5A5A40]">붙여넣기 텍스트</label>
                        <textarea
                          rows={8}
                          value={bulkText}
                          onChange={(e) => setBulkText(e.target.value)}
                          placeholder="여기에 말씀 목록을 여러 줄로 입력하거나 붙여넣으세요.&#10;예시:&#10;요한복음 3:16 하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니...&#10;잠언 3:5 너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라..."
                          className="w-full text-xs p-3.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] font-mono leading-relaxed placeholder-stone-400 focus:outline-none"
                        />
                      </div>
                      <div className="bg-[#FDFBF7] p-3 rounded-xl border border-[#E9E3D8]/50 text-stone-500 leading-relaxed text-[11px]">
                        💡 <span className="font-bold text-[#5A5A40]">스마트 분석 기능:</span> 성경책이름 뒤의 장:절 숫자 형태와 성경 본문 텍스트를 인공지능 규칙으로 파악하여 자동으로 성경 장절과 본문으로 자동 분해해 줍니다.
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerBulkTextParse}
                        className="w-full py-3 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-xl font-bold transition shadow"
                      >
                        성구 분석 및 임시 검증 단계로 이동 ➡️
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="border-2 border-dashed border-[#E9E3D8] p-8 rounded-2xl bg-[#FDFBF7] hover:bg-[#F5F5F0]/50 transition relative">
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleBulkFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-[#8A9A5B] mx-auto mb-2" />
                        <span className="text-xs font-bold text-[#5A5A40] block">내 컴퓨터에서 CSV 파일 선택</span>
                        <p className="text-[10px] text-stone-400 mt-1.5">
                          CSV 헤더 규격: Reference, Text, Title, Hint, Quarter, Week, Category, Difficulty, Date, IsActive
                        </p>
                      </div>

                      {bulkFileError && (
                        <p className="text-rose-500 font-bold text-[11px] mt-1">{bulkFileError}</p>
                      )}

                      <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#E9E3D8]/50 text-left text-stone-500 text-[11px] space-y-1 leading-relaxed">
                        <span className="font-bold text-[#5A5A40] block mb-1">📋 Excel 템플릿 작성 가이드</span>
                        <p>1. Excel에서 첫 행에 영어 컬럼명이나 한글 컬럼명을 명시합니다.</p>
                        <p>2. 각 행에 <span className="font-bold">성경장절(Reference), 말씀본문(Text)</span>을 채웁니다.</p>
                        <p>3. '다른 이름으로 저장'을 눌러 <span className="font-bold text-[#8A9A5B]">CSV (쉼표로 분리)</span> 형식으로 저장 후 여기에 드래그합니다.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Step 2: Verification Preview Table
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-[#5A5A40] bg-[#EAF2D7]/50 p-3 rounded-xl border border-[#8A9A5B]/20">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#8A9A5B]" />
                      <span>파싱 및 데이터 타당성 검증 단계 ({bulkParsed.length}건)</span>
                    </div>
                    <span className="text-[10px] text-[#7A7A6A]">문제가 발생한 필드는 붉은색으로 강조됩니다.</span>
                  </div>

                  <div className="border border-[#E9E3D8] rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#FDFBF7] border-b border-[#E9E3D8] font-bold text-[#5A5A40]">
                          <th className="p-2 w-28">성경 장절</th>
                          <th className="p-2">본문 내용</th>
                          <th className="p-2 w-20 text-center">분기</th>
                          <th className="p-2 w-20 text-center">태그분류</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-600">
                        {bulkParsed.map((item, idx) => {
                          const isRefValid = item.reference && item.reference.length > 2;
                          const isTextValid = item.text && item.text.length > 5;
                          const { category } = parseCategoryDifficulty(item.duration);

                          return (
                            <tr key={idx} className="hover:bg-stone-50">
                              <td className={`p-2 font-bold ${isRefValid ? 'text-[#5A5A40]' : 'bg-red-50 text-red-500 font-extrabold'}`}>
                                {item.reference || '(비어있음)'}
                              </td>
                              <td className={`p-2 truncate max-w-xs ${isTextValid ? 'text-stone-600' : 'bg-red-50 text-red-500 font-extrabold'}`}>
                                {item.text || '(비어있음)'}
                              </td>
                              <td className="p-2 text-center text-stone-500 font-mono">
                                {item.quarter}분기
                              </td>
                              <td className="p-2 text-center">
                                <span className="px-1.5 py-0.5 bg-[#8A9A5B]/10 text-[#8A9A5B] rounded text-[9px] font-bold">
                                  {category}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Bulk Preview Actions */}
                  <div className="flex gap-2.5 pt-3 border-t border-[#F0ECE4]">
                    <button
                      type="button"
                      onClick={() => setBulkStep(1)}
                      className="flex-1 py-3 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      ⬅️ 이전으로 (다시 파싱)
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalizeBulkSave}
                      className="flex-1 py-3 bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-black rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      성구 검증 완료 및 일괄 저장하기
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM SINGLE DELETE MODAL --- */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E9E3D8] rounded-[24px] max-w-sm w-full p-6 shadow-2xl space-y-4 font-sans text-center"
            >
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-serif font-black text-sm text-[#5A5A40]">정말 말씀 구절을 삭제하시겠습니까?</h4>
                <p className="text-xs text-[#909080] leading-relaxed">
                  삭제 후에는 복구가 불가능하며, 해당 성구에 연계된 성도들의 말씀 암송 기록 및 역사가 유실될 수 있습니다.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2 text-xs font-bold">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] rounded-xl transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    await onDeleteVerse(deleteConfirmId);
                    setDeleteConfirmId(null);
                    alert('성구 삭제가 완료되었습니다.');
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer shadow"
                >
                  삭제 확인
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- STANDALONE CARD PREVIEW MODAL --- */}
      <AnimatePresence>
        {cardPreviewVerse && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E9E3D8] rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-5 font-sans relative"
            >
              <button
                onClick={() => setCardPreviewVerse(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>

              <div className="text-center pb-2.5 border-b border-stone-100">
                <span className="text-[10px] font-black text-[#8A9A5B] tracking-widest uppercase">REAL-TIME PREMIUM CARD PREVIEW</span>
                <h3 className="font-serif text-sm font-bold text-[#5A5A40] mt-1">성도들이 실제 학습하게 될 화면</h3>
              </div>

              {/* Card representation */}
              <div className="bg-[#FDFBF7] border-2 border-[#8A9A5B]/30 rounded-3xl p-6 shadow-md text-center font-serif relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#8A9A5B]/5 rounded-bl-[80px]" />
                
                <div className="inline-flex items-center gap-1 bg-[#8A9A5B]/10 text-[#8A9A5B] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#8A9A5B]/20 mb-3 font-sans">
                  <BookmarkCheck className="w-3 h-3" />
                  <span>{cardPreviewVerse.quarter}분기 {cardPreviewVerse.week}주차</span>
                </div>

                <h4 className="text-lg text-[#5A5A40] font-serif font-black tracking-tight">{cardPreviewVerse.reference}</h4>
                
                <div className="my-4 py-3 px-4 bg-white border border-[#E9E3D8]/50 rounded-2xl">
                  <p className="text-base text-stone-700 leading-relaxed tracking-tight select-none">
                    "{cardPreviewVerse.text}"
                  </p>
                </div>

                {cardPreviewVerse.hint && (
                  <p className="text-xs text-[#7A7A6A] font-sans italic leading-relaxed">
                    묵상: {cardPreviewVerse.hint}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-dashed border-[#E9E3D8]/60 flex justify-between items-center text-[10px] text-[#A0A090] font-sans font-medium">
                  <span>주일 {cardPreviewVerse.date} 선포</span>
                  <span>분류: {parseCategoryDifficulty(cardPreviewVerse.duration).category}</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setCardPreviewVerse(null)}
                  className="px-6 py-2 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                >
                  확인 완료
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
