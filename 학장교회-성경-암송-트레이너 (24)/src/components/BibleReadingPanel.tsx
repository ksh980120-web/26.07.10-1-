import React, { useState, useEffect } from 'react';
import { BookOpen, Check, History, Send, CheckCircle2, Bookmark, Award, Sparkles, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

// 66 Books of the Bible with their respective chapter counts
const BIBLE_BOOKS = [
  // 구약성경 (Old Testament)
  { name: '창세기', chapters: 50, category: 'OT' },
  { name: '출애굽기', chapters: 40, category: 'OT' },
  { name: '레위기', chapters: 27, category: 'OT' },
  { name: '민수기', chapters: 36, category: 'OT' },
  { name: '신명기', chapters: 34, category: 'OT' },
  { name: '여호수아', chapters: 24, category: 'OT' },
  { name: '사사기', chapters: 21, category: 'OT' },
  { name: '룻기', chapters: 4, category: 'OT' },
  { name: '사무엘상', chapters: 31, category: 'OT' },
  { name: '사무엘하', chapters: 24, category: 'OT' },
  { name: '열왕기상', chapters: 22, category: 'OT' },
  { name: '열왕기하', chapters: 25, category: 'OT' },
  { name: '역대상', chapters: 29, category: 'OT' },
  { name: '역대하', chapters: 36, category: 'OT' },
  { name: '에스라', chapters: 10, category: 'OT' },
  { name: '느헤미야', chapters: 13, category: 'OT' },
  { name: '에스더', chapters: 10, category: 'OT' },
  { name: '욥기', chapters: 42, category: 'OT' },
  { name: '시편', chapters: 150, category: 'OT' },
  { name: '잠언', chapters: 31, category: 'OT' },
  { name: '전도서', chapters: 12, category: 'OT' },
  { name: '아가', chapters: 8, category: 'OT' },
  { name: '이사야', chapters: 66, category: 'OT' },
  { name: '예레미야', chapters: 52, category: 'OT' },
  { name: '예레미야 애가', chapters: 5, category: 'OT' },
  { name: '에스겔', chapters: 48, category: 'OT' },
  { name: '다니엘', chapters: 12, category: 'OT' },
  { name: '호세아', chapters: 14, category: 'OT' },
  { name: '요엘', chapters: 3, category: 'OT' },
  { name: '아모스', chapters: 9, category: 'OT' },
  { name: '오바디야', chapters: 1, category: 'OT' },
  { name: '요나', chapters: 4, category: 'OT' },
  { name: '미가', chapters: 7, category: 'OT' },
  { name: '나훔', chapters: 3, category: 'OT' },
  { name: '하박국', chapters: 3, category: 'OT' },
  { name: '스바냐', chapters: 3, category: 'OT' },
  { name: '학개', chapters: 2, category: 'OT' },
  { name: '스가랴', chapters: 14, category: 'OT' },
  { name: '말라기', chapters: 4, category: 'OT' },

  // 신약성경 (New Testament)
  { name: '마태복음', chapters: 28, category: 'NT' },
  { name: '마가복음', chapters: 16, category: 'NT' },
  { name: '누가복음', chapters: 24, category: 'NT' },
  { name: '요한복음', chapters: 21, category: 'NT' },
  { name: '사도행전', chapters: 28, category: 'NT' },
  { name: '로마서', chapters: 16, category: 'NT' },
  { name: '고린도전서', chapters: 16, category: 'NT' },
  { name: '고린도후서', chapters: 13, category: 'NT' },
  { name: '갈라디아서', chapters: 6, category: 'NT' },
  { name: '에베소서', chapters: 6, category: 'NT' },
  { name: '빌립보서', chapters: 4, category: 'NT' },
  { name: '골로새서', chapters: 4, category: 'NT' },
  { name: '데살로니가전서', chapters: 5, category: 'NT' },
  { name: '데살로니가후서', chapters: 3, category: 'NT' },
  { name: '디모데전서', chapters: 6, category: 'NT' },
  { name: '디모데후서', chapters: 4, category: 'NT' },
  { name: '디도서', chapters: 3, category: 'NT' },
  { name: '빌레몬서', chapters: 1, category: 'NT' },
  { name: '히브리서', chapters: 13, category: 'NT' },
  { name: '야고보서', chapters: 5, category: 'NT' },
  { name: '베드로전서', chapters: 5, category: 'NT' },
  { name: '베드로후서', chapters: 3, category: 'NT' },
  { name: '요한일서', chapters: 5, category: 'NT' },
  { name: '요한이서', chapters: 1, category: 'NT' },
  { name: '요한삼서', chapters: 1, category: 'NT' },
  { name: '유다서', chapters: 1, category: 'NT' },
  { name: '요한계시록', chapters: 22, category: 'NT' }
];

interface BibleReadingPanelProps {
  currentUserId: string;
  currentUserName: string;
}

export default function BibleReadingPanel({ currentUserId, currentUserName }: BibleReadingPanelProps) {
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS[0]);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  
  // Progress tracker: BookName -> Set of read chapter numbers
  const [readChapters, setReadChapters] = useState<{ [bookName: string]: number[] }>(() => {
    const saved = localStorage.getItem(`manna_bible_read_${currentUserId}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Report Form State
  const [reportStart, setReportStart] = useState<number>(1);
  const [reportEnd, setReportEnd] = useState<number>(1);
  const [meditation, setMeditation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // History State
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(`manna_bible_read_${currentUserId}`, JSON.stringify(readChapters));
  }, [readChapters, currentUserId]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('correct_text', 'bible_reading')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData = (data || []).map(rep => ({
        ...rep,
        submitted_at: rep.created_at,
        status: rep.is_approved ? 'approved' : (rep.approved_by ? 'rejected' : 'pending')
      }));
      
      setReportsHistory(mappedData);
    } catch (e: any) {
      console.error('Error loading bible reading history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUserId]);

  // Handle checking off individual chapters
  const toggleChapter = (bookName: string, chapter: number) => {
    setReadChapters(prev => {
      const currentBookChapters = prev[bookName] || [];
      const updated = currentBookChapters.includes(chapter)
        ? currentBookChapters.filter(c => c !== chapter)
        : [...currentBookChapters, chapter].sort((a, b) => a - b);
      return {
        ...prev,
        [bookName]: updated
      };
    });
  };

  const handleSelectBook = (bookName: string) => {
    const book = BIBLE_BOOKS.find(b => b.name === bookName);
    if (book) {
      setSelectedBook(book);
      setReportStart(1);
      setReportEnd(1);
    }
  };

  const markAllChapters = (bookName: string, read: boolean) => {
    const book = BIBLE_BOOKS.find(b => b.name === bookName);
    if (!book) return;
    
    setReadChapters(prev => {
      if (read) {
        const allChaps = Array.from({ length: book.chapters }, (_, i) => i + 1);
        return { ...prev, [bookName]: allChaps };
      } else {
        const copy = { ...prev };
        delete copy[bookName];
        return copy;
      }
    });
  };

  // Submit report to pastor
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportStart > reportEnd) {
      setSubmitError('시작 장이 끝 장보다 클 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const referenceText = `[성경읽기] ${selectedBook.name} ${reportStart}~${reportEnd}장`;
      
      const payload = {
        user_id: currentUserId,
        verse_id: null,
        reference: referenceText,
        user_text: meditation.trim() || '오늘도 말씀으로 동행하셨습니다.',
        correct_text: 'bible_reading',
        mode: 'blank_fill', // database constraint workaround
        is_approved: false,
        approved_by: null,
        score: 100,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('submissions').insert(payload);
      if (error) throw error;

      // Automatically mark reported chapters as read
      setReadChapters(prev => {
        const currentBookChapters = prev[selectedBook.name] || [];
        const newlyRead = Array.from(
          { length: reportEnd - reportStart + 1 },
          (_, i) => reportStart + i
        );
        const merged = Array.from(new Set([...currentBookChapters, ...newlyRead])).sort((a, b) => a - b);
        return {
          ...prev,
          [selectedBook.name]: merged
        };
      });

      setSubmitSuccess(true);
      setMeditation('');
      loadHistory();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (e: any) {
      console.error('Error submitting bible reading:', e);
      setSubmitError(e.message || '보고서 제출 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered books based on selection category
  const filteredBooks = BIBLE_BOOKS.filter(
    b => selectedCategory === 'ALL' || b.category === selectedCategory
  );

  // Calculate total bible reading progress
  const totalChaptersInBible = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
  const totalChaptersRead: number = (Object.values(readChapters) as any[]).reduce((sum: number, chaps: any) => sum + (chaps ? chaps.length : 0), 0);
  const overallProgressPercentage = Math.round((totalChaptersRead / totalChaptersInBible) * 100);

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto" id="bible-reading-module">
      
      {/* HEADER HERO ACCENT */}
      <div className="bg-gradient-to-br from-[#8A9A5B] to-[#708238] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden" id="bible-hero-banner">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10">
          <BookOpen className="w-64 h-64" />
        </div>
        <div className="space-y-3 max-w-xl">
          <span className="bg-white/20 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/20">
            말씀 양육 • 성경 통독 보고
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold leading-tight">
            매일 하나님의 음성을 듣는 성경 읽기
          </h2>
          <p className="text-xs sm:text-sm text-stone-100 leading-relaxed font-medium">
            "주의 말씀은 내 발에 등이요 내 길에 빛이니이다" (시편 119:105). 읽은 성경 장절을 체크하고 목사님께 성실히 양육 진도를 보고해 보세요. 고령층 성도님들도 간편하게 터치하여 사용할 수 있습니다.
          </p>
        </div>

        {/* PROGRESS CARD ACCENT */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2.5 rounded-xl border border-white/10">
              <Award className="w-5 h-5 text-[#F5D76E]" />
            </div>
            <div>
              <p className="text-[10px] text-stone-200 uppercase font-black tracking-wider">나의 통독 진도율</p>
              <h4 className="text-lg font-serif font-extrabold flex items-baseline gap-1">
                <span>{overallProgressPercentage}%</span>
                <span className="text-[10px] text-stone-300 font-normal">통독 완료</span>
              </h4>
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-stone-200">성경 전체 {totalChaptersInBible}장 중 {totalChaptersRead}장 읽음</span>
              <span className="font-bold">{overallProgressPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-black/15 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-[#F5D76E] transition-all duration-500 rounded-full" 
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CHAPTER SELECTION & INTERACTION (8 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#5A5A40] flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-[#8A9A5B]" />
                  성경 장절 읽기표
                </h3>
                <p className="text-[11px] text-[#A0A090] mt-0.5">읽으신 성경 책과 장 번호를 터치해 체크하세요.</p>
              </div>

              {/* OT/NT Category Selector */}
              <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-[#E9E3D8] self-stretch sm:self-auto">
                {(['ALL', 'OT', 'NT'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 sm:flex-initial px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-white text-[#5A5A40] shadow-sm font-bold' 
                        : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    {cat === 'ALL' ? '전체' : cat === 'OT' ? '구약' : '신약'}
                  </button>
                ))}
              </div>
            </div>

            {/* Book Selector Dropdown Grid for easy elderly clicking */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#7A7A6A] block">성경 책 선택</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto border border-[#E9E3D8] rounded-xl p-2 bg-[#FDFBF7]">
                {filteredBooks.map((book) => {
                  const readCount = readChapters[book.name]?.length || 0;
                  const isSelected = selectedBook.name === book.name;
                  const isFullyRead = readCount === book.chapters;

                  return (
                    <button
                      key={book.name}
                      onClick={() => handleSelectBook(book.name)}
                      className={`py-1.5 px-1 rounded-lg text-left text-[11px] font-semibold transition border ${
                        isSelected 
                          ? 'bg-[#5A5A40] text-white border-[#5A5A40] font-bold' 
                          : isFullyRead
                          ? 'bg-[#EAF2D7] text-[#8A9A5B] border-[#D1E2A4]'
                          : 'bg-white hover:bg-[#F5F5F0] text-[#5A5A40] border-[#E9E3D8]'
                      } flex flex-col justify-between items-center text-center cursor-pointer`}
                    >
                      <span className="truncate w-full font-serif font-bold">{book.name}</span>
                      <span className={`text-[8.5px] mt-0.5 ${isSelected ? 'text-stone-200' : 'text-stone-400'}`}>
                        {readCount}/{book.chapters}장
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Displaying chapters inside selected book */}
            <div className="border border-[#E9E3D8] rounded-2xl p-4 bg-[#FDFBF7]/50 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#8A9A5B]" />
                  <h4 className="text-xs font-bold text-[#5A5A40] font-serif">
                    {selectedBook.name} <span className="font-sans text-[10px] text-[#A0A090]">({selectedBook.chapters}장 전체)</span>
                  </h4>
                </div>
                
                {/* Check/Uncheck all */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => markAllChapters(selectedBook.name, true)}
                    className="text-[10px] font-bold text-[#8A9A5B] hover:underline cursor-pointer bg-white px-2 py-1 rounded border border-[#E9E3D8]"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={() => markAllChapters(selectedBook.name, false)}
                    className="text-[10px] font-bold text-stone-500 hover:underline cursor-pointer bg-white px-2 py-1 rounded border border-[#E9E3D8]"
                  >
                    해제
                  </button>
                </div>
              </div>

              {/* Grid of Chapter Numbers */}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                {Array.from({ length: selectedBook.chapters }, (_, index) => {
                  const chapterNum = index + 1;
                  const isRead = (readChapters[selectedBook.name] || []).includes(chapterNum);

                  return (
                    <button
                      key={chapterNum}
                      onClick={() => toggleChapter(selectedBook.name, chapterNum)}
                      className={`h-9 w-full rounded-xl flex items-center justify-center text-xs font-bold transition border ${
                        isRead 
                          ? 'bg-[#8A9A5B] text-white border-[#8A9A5B] shadow-2xs' 
                          : 'bg-white hover:bg-[#F5F5F0] text-[#5A5A40] border-[#E9E3D8]'
                      } cursor-pointer relative`}
                      title={`${selectedBook.name} ${chapterNum}장`}
                    >
                      <span>{chapterNum}</span>
                      {isRead && (
                        <span className="absolute bottom-0.5 right-0.5 text-white">
                          <Check className="w-2.5 h-2.5 stroke-[4]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REPORT TO PASTOR & HISTORY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* REPORT SUBMISSION CARD */}
          <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-5 sm:p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#5A5A40] flex items-center gap-1.5">
                <Send className="w-4 h-4 text-[#8A9A5B]" />
                목사님께 성경읽기 보고하기
              </h3>
              <p className="text-[11px] text-[#A0A090] mt-0.5">오늘 읽으신 말씀을 양육 카드로 목사님께 발송합니다.</p>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Selected book notice */}
              <div className="p-3.5 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#A0A090] block font-bold">보고할 성경책</span>
                  <span className="text-sm font-serif font-extrabold text-[#5A5A40]">{selectedBook.name}</span>
                </div>
                <span className="text-[11px] font-bold text-[#8A9A5B] bg-white border border-[#E9E3D8] px-2.5 py-1 rounded-full">
                  총 {readChapters[selectedBook.name]?.length || 0}장 읽음
                </span>
              </div>

              {/* Range Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7A7A6A]">시작 장</label>
                  <select
                    value={reportStart}
                    onChange={(e) => setReportStart(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] font-bold"
                  >
                    {Array.from({ length: selectedBook.chapters }, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}장</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#7A7A6A]">끝 장</label>
                  <select
                    value={reportEnd}
                    onChange={(e) => setReportEnd(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] font-bold"
                  >
                    {Array.from({ length: selectedBook.chapters }, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}장</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meditation Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#7A7A6A] flex justify-between">
                  <span>느낀 점 및 은혜 고백 <span className="text-stone-400 font-normal">(선택)</span></span>
                </label>
                <textarea
                  value={meditation}
                  onChange={(e) => setMeditation(e.target.value)}
                  placeholder="오늘 성경을 읽으며 깨달은 은혜나 고백을 짧게 한 줄 적어보세요. (작성하지 않으셔도 목사님께 읽음 보고가 됩니다!)"
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-serif font-medium leading-relaxed"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex gap-1.5 items-start">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex gap-2 items-center"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span className="font-bold">목사님께 성경읽기 보고가 완료되었습니다! ✨</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#8A9A5B] hover:bg-[#708238] disabled:bg-stone-300 text-white font-extrabold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>보고 발송 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>성경읽기 보고 완료하기 ⛪</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* PERSONAL HISTORY LIST */}
          <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs sm:text-sm font-serif font-bold text-[#5A5A40] flex items-center gap-1.5 uppercase tracking-wider">
              <History className="w-4 h-4 text-[#8A9A5B]" />
              나의 성경읽기 보고 목록
            </h3>

            {historyLoading && reportsHistory.length === 0 ? (
              <div className="py-8 text-center text-[#A0A090]">
                <span className="w-5 h-5 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin inline-block mb-1.5"></span>
                <p className="text-[11px]">성경 보고 기록을 가져오는 중...</p>
              </div>
            ) : reportsHistory.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E9E3D8] rounded-2xl bg-stone-50/50">
                <HelpCircle className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                <p className="text-[11px] font-bold text-stone-400">제출된 성경읽기 보고가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {reportsHistory.map((rep) => {
                  const statusColor = 
                    rep.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : rep.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100';

                  const statusLabel = 
                    rep.status === 'approved' ? '승인 완료 ✨' : rep.status === 'rejected' ? '반려됨 ❌' : '승인 대기 ⏳';

                  return (
                    <div key={rep.id} className="p-3 bg-stone-50/70 border border-[#E9E3D8] rounded-xl space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-serif font-bold text-[#5A5A40]">{rep.reference}</span>
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {rep.user_text && (
                        <p className="text-stone-500 font-serif italic pl-2 border-l-2 border-[#E9E3D8]">
                          "{rep.user_text}"
                        </p>
                      )}
                      <div className="text-[9px] text-[#A0A090] font-mono text-right">
                        {new Date(rep.submitted_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
