/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Award,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Play,
  ArrowRight,
  BookMarked,
  Heart,
  Eye,
  EyeOff
} from 'lucide-react';
import { VerseStatus, GongGwa } from '../types';

interface GongGwaPanelProps {
  verseStatuses: { [key: string]: VerseStatus };
  onStartBlankPractice: (id: string) => void;
  onStartWriteTest: (id: string) => void;
  onStartSpeakAlong: (id: string) => void;
  gongGwaLessons: GongGwa[];
}

interface QuestionItem {
  id: string;
  question: string;
  answer: string;
}

export default function GongGwaPanel({
  verseStatuses,
  onStartBlankPractice,
  onStartWriteTest,
  onStartSpeakAlong,
  gongGwaLessons
}: GongGwaPanelProps) {
  // Local active sub-tab: 'full_text' (교재 전체 내용), 'passage' (본문 읽기 및 암송) or 'lessons' (핵심 공부 및 퀴즈)
  const [activeSubTab, setActiveSubTab] = useState<'full_text' | 'passage' | 'lessons'>('full_text');

  // Dynamic lesson selection state
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  // Blur / Hide practice states for full textbook study
  const [blurIntro, setBlurIntro] = useState(false);
  const [blurBody, setBlurBody] = useState(false);
  const [blurQna, setBlurQna] = useState(false);

  // New states for whole passage training
  const [passageMode, setPassageMode] = useState<'individual' | 'whole'>('individual');
  const [wholeSubTab, setWholeSubTab] = useState<'read' | 'blank' | 'write'>('read');
  const [showFullText, setShowFullText] = useState(true);
  const [revealedBlanks, setRevealedBlanks] = useState<{ [key: string]: boolean }>({});
  const [typedWholeText, setTypedWholeText] = useState('');
  const [wholeTestResult, setWholeTestResult] = useState<{
    score: number;
    totalWords: number;
    correctCount: number;
    diff: { text: string; status: 'correct' | 'incorrect' | 'missing' }[];
  } | null>(null);

  // Q&A card flip state
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});

  React.useEffect(() => {
    if (gongGwaLessons.length > 0 && (!selectedLessonId || !gongGwaLessons.some(g => g.id === selectedLessonId))) {
      setSelectedLessonId(gongGwaLessons[0].id);
    }
  }, [gongGwaLessons, selectedLessonId]);

  if (gongGwaLessons.length === 0) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4 bg-white border border-[#E9E3D8] rounded-[32px] p-8 shadow-sm text-center">
        <BookOpen className="w-8 h-8 text-[#A0A090]" />
        <p className="text-sm font-medium text-[#7A7A6A] font-serif">등록된 공과 내용이 없습니다.</p>
      </div>
    );
  }

  const formatGongGwaTitle = (title: string) => {
    return title.replace(/제\s*(\d+)\s*과/g, '$1공과');
  };

  const currentGongGwa = gongGwaLessons.find(g => g.id === selectedLessonId) || gongGwaLessons[0];

  const lessonTitle = formatGongGwaTitle(currentGongGwa.title);
  const scriptureReference = currentGongGwa.scriptureReference;
  const gongGwaVerses = currentGongGwa.verses;
  const coreLessons = currentGongGwa.coreLessons;
  const introduction = currentGongGwa.introduction || [];
  
  const qnaItems: QuestionItem[] = currentGongGwa.qnas.map((q, idx) => ({
    id: q.id || `q-${idx}`,
    question: q.question,
    answer: q.answer
  }));

  const handleCardClick = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetFlips = () => {
    setFlippedCards({});
  };

  const handleEvaluateWholeText = () => {
    const originalText = gongGwaVerses.map(v => v.text.trim()).join(' ');
    const cleanWord = (w: string) => w.replace(/[.,·?\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
    const originalWords = originalText.split(/\s+/).filter(Boolean);
    const userWords = typedWholeText.split(/\s+/).filter(Boolean);

    const diff: { text: string; status: 'correct' | 'incorrect' | 'missing' }[] = [];
    let correctCount = 0;
    
    let origIdx = 0;
    let userIdx = 0;
    
    while (origIdx < originalWords.length || userIdx < userWords.length) {
      if (origIdx < originalWords.length && userIdx < userWords.length) {
        const origWord = cleanWord(originalWords[origIdx]);
        const userWord = cleanWord(userWords[userIdx]);
        
        if (origWord === userWord) {
          diff.push({ text: originalWords[origIdx], status: 'correct' });
          correctCount++;
          origIdx++;
          userIdx++;
        } else {
          // Look ahead to check for missed words
          let foundAhead = false;
          for (let look = 1; look <= 4; look++) {
            if (origIdx + look < originalWords.length && cleanWord(originalWords[origIdx + look]) === userWord) {
              for (let m = 0; m < look; m++) {
                diff.push({ text: originalWords[origIdx + m], status: 'missing' });
              }
              diff.push({ text: originalWords[origIdx + look], status: 'correct' });
              correctCount++;
              origIdx += look + 1;
              userIdx++;
              foundAhead = true;
              break;
            }
          }
          
          if (!foundAhead) {
            diff.push({ text: userWords[userIdx], status: 'incorrect' });
            origIdx++;
            userIdx++;
          }
        }
      } else if (origIdx < originalWords.length) {
        diff.push({ text: originalWords[origIdx], status: 'missing' });
        origIdx++;
      } else {
        diff.push({ text: userWords[userIdx], status: 'incorrect' });
        userIdx++;
      }
    }

    const score = originalWords.length > 0 ? Math.round((correctCount / originalWords.length) * 100) : 0;
    setWholeTestResult({
      score,
      totalWords: originalWords.length,
      correctCount,
      diff
    });
  };

  return (
    <div className="space-y-6" id="gonggwa-study-section">
      {/* GONGGWA TITLE OVERVIEW */}
      <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-[#FDFBF7]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8A9A5B]/5 rounded-bl-[120px] pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="space-y-1.5 flex-1 animate-fadeIn">
            <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#EAF2D7] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">Monthly Bible Study</span>
            <h2 className="text-2xl font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#8A9A5B]" />
              {lessonTitle}
            </h2>
            <p className="text-xs text-[#7A7A6A] leading-relaxed">
              학장교회 장년 공과 성경 공부 내용입니다. 선택한 주차의 본문 말씀과 대지를 깊이 묵상하고 요절을 완벽하게 암송해 보세요.
            </p>

            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-[#7A7A6A] shrink-0">📖 공부할 공과 선택:</span>
              <select
                value={selectedLessonId}
                onChange={(e) => {
                  setSelectedLessonId(e.target.value);
                  setWholeTestResult(null); // Reset whole test results
                }}
                className="text-xs font-bold text-[#5A5A40] bg-[#F5F5F0] hover:bg-stone-100 transition border border-[#E9E3D8] px-3.5 py-2 rounded-xl focus:outline-none cursor-pointer"
              >
                {gongGwaLessons.map(g => (
                  <option key={g.id} value={g.id}>
                    {formatGongGwaTitle(g.title)} ({g.scriptureReference})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* INTERNAL SUB-TAB SWITCHER */}
          <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-[#E9E3D8] shrink-0 self-start lg:self-center flex-wrap gap-1">
            <button
              onClick={() => setActiveSubTab('full_text')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                activeSubTab === 'full_text'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7A7A6A] hover:text-[#5A5A40]'
              }`}
            >
              1. 교재 전체 공부 📖
            </button>
            <button
              onClick={() => setActiveSubTab('passage')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                activeSubTab === 'passage'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7A7A6A] hover:text-[#5A5A40]'
              }`}
            >
              2. 본문 말씀 암송 훈련 🌟
            </button>
            <button
              onClick={() => setActiveSubTab('lessons')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                activeSubTab === 'lessons'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7A7A6A] hover:text-[#5A5A40]'
              }`}
            >
              3. 공과 핵심 & 문답 💡
            </button>
          </div>
        </div>
      </div>

      {/* SUB TAB 0: FULL TEXT BOOK STUDY */}
      {activeSubTab === 'full_text' && (
        <div className="space-y-6">
          {/* Main Reading Canvas */}
          <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 md:p-8 shadow-sm space-y-6 leading-relaxed font-serif">
            
            {/* Header Area */}
            <div className="border-b border-[#F0ECE4] pb-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#EAF2D7] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">Full Study Material</span>
                <h3 className="text-xl font-bold text-[#5A5A40] mt-1.5 font-serif">{lessonTitle} 전체 내용 공부</h3>
              </div>
            </div>

            {/* Memorization Blur Control Panel */}
            <div className="bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8A9A5B]" />
                  💡 본문 가리기(블러) 학습 모드
                </span>
                <p className="text-[11px] text-[#7A7A6A]">
                  아래 항목별 가리기 버튼을 활성화하여 보이지 않는 상태에서 성경 말씀과 정답을 유추해 공부해보세요. <strong className="text-[#8A9A5B]">가려진 텍스트 상자를 클릭해도 내용이 활짝 열립니다!</strong>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setBlurIntro(!blurIntro)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                    blurIntro 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                      : 'bg-white text-[#7A7A6A] hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  {blurIntro ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>서론 {blurIntro ? '가려짐' : '보여짐'}</span>
                </button>
                <button
                  onClick={() => setBlurBody(!blurBody)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                    blurBody 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                      : 'bg-white text-[#7A7A6A] hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  {blurBody ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>본론 {blurBody ? '가려짐' : '보여짐'}</span>
                </button>
                <button
                  onClick={() => setBlurQna(!blurQna)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                    blurQna 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                      : 'bg-white text-[#7A7A6A] hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  {blurQna ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>문답 {blurQna ? '가려짐' : '보여짐'}</span>
                </button>
              </div>
            </div>

            {/* Part 1: 성경 본문 읽기 */}
            <div className="space-y-3">
              <h4 className="text-base font-bold text-[#5A5A40] border-l-4 border-[#8A9A5B] pl-2.5 font-sans">
                📖 성경 본문 말씀 ({scriptureReference})
              </h4>
              <div className="bg-[#FDFBF7] border border-[#E9E3D8]/60 p-5 rounded-2xl space-y-3.5 text-sm md:text-base font-medium text-[#4A4A4A] leading-loose">
                {gongGwaVerses.map((v, idx) => {
                  const match = v.reference.match(/(\d+)\s*절/);
                  const verseNum = match ? match[1] : (idx + 1).toString();
                  return (
                    <p
                      key={v.id}
                      className={v.isKey ? "text-[#5A5A40] font-extrabold bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/50" : ""}
                    >
                      <span className={`${v.isKey ? 'text-amber-600' : 'text-[#8A9A5B]'} font-bold font-sans mr-1`}>[{verseNum}]</span>
                      {v.text} {v.isKey ? "⭐ (금주의 핵심 요절)" : ""}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Part 2: 공과지 내용 */}
            <div className="space-y-6 pt-2 font-sans">
              <h4 className="text-base font-bold text-[#5A5A40] border-l-4 border-[#8A9A5B] pl-2.5 flex items-center gap-1.5">
                📜 {lessonTitle} 공과 배움터
              </h4>
              
              <div className="space-y-5">
                {/* 1. 요약 정보 */}
                <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#E9E3D8] space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-[#5A5A40]">
                    <div className="space-y-1">
                      <span className="font-bold text-[#8A9A5B] text-[11px] uppercase tracking-wider block">성경 본문</span>
                      <p className="font-serif font-bold text-[#4A4A4A]">{scriptureReference}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-[#8A9A5B] text-[11px] uppercase tracking-wider block">공과 제목</span>
                      <p className="font-serif font-bold text-[#4A4A4A] text-base">{lessonTitle}</p>
                    </div>
                  </div>
                  {gongGwaVerses.filter(v => v.isKey).map(v => (
                    <div key={v.id} className="border-t border-[#E9E3D8]/50 pt-3">
                      <span className="font-bold text-amber-700 text-[11px] uppercase tracking-wider block mb-1">⭐ 요절 말씀</span>
                      <p className="font-serif font-extrabold text-[#5A5A40] bg-amber-50/50 p-3 rounded-xl border border-amber-200/50 text-sm md:text-base">
                        "{v.text}" ({v.reference})
                      </p>
                    </div>
                  ))}
                </div>

                {/* 2. 서론 (Introduction) */}
                {introduction.length > 0 && (
                  <div 
                    onClick={() => { if (blurIntro) setBlurIntro(false); }}
                    className={`bg-[#FDFBF7] p-6 rounded-2xl border border-[#E9E3D8] space-y-2.5 transition-all duration-300 ${
                      blurIntro ? 'filter blur-[6px] select-none cursor-pointer hover:opacity-80 relative' : ''
                    }`}
                    title={blurIntro ? "클릭하여 내용 잠시 확인하기" : undefined}
                  >
                    <h5 className="font-extrabold text-sm text-[#8A9A5B] border-b border-[#F0ECE4] pb-1.5 flex justify-between items-center">
                      <span>■ 서론</span>
                      {blurIntro && (
                        <span className="text-[10px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md font-sans">가려짐 (클릭 시 보임)</span>
                      )}
                    </h5>
                    <div className="text-sm text-[#4A4A4A] font-serif leading-loose space-y-1">
                      {introduction.map((introText, iIdx) => (
                        <p key={iIdx} className="flex items-start gap-1">
                          <span className="text-[#8A9A5B] font-bold">•</span>
                          <span>{introText}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. 본론 */}
                <div 
                  onClick={() => { if (blurBody) setBlurBody(false); }}
                  className={`bg-[#FDFBF7] p-6 rounded-2xl border border-[#E9E3D8] space-y-4 transition-all duration-300 ${
                    blurBody ? 'filter blur-[6px] select-none cursor-pointer hover:opacity-80 relative' : ''
                  }`}
                  title={blurBody ? "클릭하여 내용 잠시 확인하기" : undefined}
                >
                  <h5 className="font-extrabold text-sm text-[#8A9A5B] border-b border-[#F0ECE4] pb-1.5 flex justify-between items-center">
                    <span>■ 본론</span>
                    {blurBody && (
                      <span className="text-[10px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md font-sans">가려짐 (클릭 시 보임)</span>
                    )}
                  </h5>
                  <div className="text-xs sm:text-sm text-[#4A4A4A] font-serif leading-loose space-y-3.5">
                    {coreLessons.map((lesson, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="font-bold text-[#5A5A40] font-sans text-xs">{lesson.title} ({lesson.verse})</span>
                        <p className="pl-3 border-l-2 border-[#E9E3D8] text-stone-600">
                          {lesson.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. 문답 */}
                {qnaItems.length > 0 && (
                  <div 
                    onClick={() => { if (blurQna) setBlurQna(false); }}
                    className={`bg-[#FDFBF7] p-6 rounded-2xl border border-[#E9E3D8] space-y-4 transition-all duration-300 ${
                      blurQna ? 'filter blur-[6px] select-none cursor-pointer hover:opacity-80 relative' : ''
                    }`}
                    title={blurQna ? "클릭하여 내용 잠시 확인하기" : undefined}
                  >
                    <h5 className="font-extrabold text-sm text-[#8A9A5B] border-b border-[#F0ECE4] pb-1.5 flex justify-between items-center">
                      <span>■ 문답</span>
                      {blurQna && (
                        <span className="text-[10px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md font-sans">가려짐 (클릭 시 보임)</span>
                      )}
                    </h5>
                    <div className="text-xs sm:text-sm text-[#4A4A4A] font-serif leading-loose space-y-4">
                      {qnaItems.map((qna, idx) => (
                        <div key={qna.id} className="bg-stone-50/50 p-3 rounded-xl border border-stone-200/40 space-y-1">
                          <p className="font-bold text-[#5A5A40]">{qna.question}</p>
                          <p className="text-[#8A9A5B] font-extrabold pl-4">답：{qna.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 1: PASSAGE TRAINING */}
      {activeSubTab === 'passage' && (
        <div className="space-y-6">
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 fill-amber-300/10" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-800">💡 공과 말씀 구절 입체 암송 훈련 가이드</p>
              <p className="text-[11px] text-amber-700 font-medium">
                아래 본문의 각 구절 오른쪽에 위치한 빈칸 연습, 직접 쓰기, 따라 말하기 버튼을 눌러 공과 말씀을 체계적으로 뇌리에 새겨보세요. 특별히 <strong className="text-amber-900 font-extrabold">6절 말씀(요절)</strong>은 반드시 완벽하게 외울 수 있도록 집중 연습합시다.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E9E3D8] rounded-[24px] p-4 shadow-sm">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-[#5A5A40]">훈련 방식 선택</h4>
              <p className="text-[11px] text-[#7A7A6A]">한 절씩 따로 암송하거나, 6개 구절 전체를 하나로 묶어 통암송할 수 있습니다.</p>
            </div>
            
            <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-[#E9E3D8] w-full sm:w-auto shrink-0">
              <button
                onClick={() => setPassageMode('individual')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  passageMode === 'individual'
                    ? 'bg-[#8A9A5B] text-white shadow-xs'
                    : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                }`}
              >
                구절별 개별 학습 📖
              </button>
              <button
                onClick={() => setPassageMode('whole')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  passageMode === 'whole'
                    ? 'bg-[#8A9A5B] text-white shadow-xs'
                    : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                }`}
              >
                📖 본문 통암송 훈련 🌟
              </button>
            </div>
          </div>

          {passageMode === 'individual' ? (
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#F0ECE4] pb-3">
                <span className="text-xs font-bold text-[#8A9A5B] flex items-center gap-1">
                  <BookMarked className="w-4 h-4 text-[#8A9A5B]" />
                  {scriptureReference} 말씀 전문
                </span>
                <span className="text-[10px] text-[#A0A090] font-sans">구절별 개별 학습 가능</span>
              </div>

              <div className="space-y-5">
                {gongGwaVerses.map((v) => {
                  const statusInfo = verseStatuses[v.id] || { status: 'not_started' };
                  const isCompleted = statusInfo.status === 'completed';
                  const isMemorizing = statusInfo.status === 'memorizing';

                  return (
                    <div
                      key={v.id}
                      className={`p-5 rounded-2xl border transition duration-200 flex flex-col justify-between gap-4 ${
                        v.isKey
                          ? 'border-amber-300 bg-amber-50/10 shadow-amber-50/50'
                          : isCompleted
                            ? 'border-[#8A9A5B]/40 bg-white'
                            : 'border-[#E9E3D8] bg-white'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              v.isKey
                                ? 'bg-amber-500 text-white animate-pulse'
                                : 'bg-[#F5F5F0] text-[#7A7A6A] border border-[#E9E3D8]'
                            }`}>
                              {v.isKey ? '⭐ 금주 공과 요절' : v.reference}
                            </span>
                            
                            {isCompleted ? (
                              <span className="text-[9px] font-bold bg-[#EAF2D7] text-[#8A9A5B] px-2 py-0.5 rounded-md border border-[#D1E2A4]">
                                암송 성공! 🎉
                              </span>
                            ) : isMemorizing ? (
                              <span className="text-[9px] font-bold bg-[#FDF6E2] text-amber-600 px-2 py-0.5 rounded-md border border-amber-200">
                                훈련 중 📖
                              </span>
                            ) : null}
                          </div>
                          
                          {v.isKey && (
                            <span className="text-[10.5px] font-serif font-bold text-amber-700 italic">"육으로 난 것은 육이요 영으로 난 것은 영이니"</span>
                          )}
                        </div>

                        <p className="text-sm font-serif font-bold text-[#5A5A40] leading-relaxed">
                          {v.text}
                        </p>
                      </div>

                      {/* Progress Bar for Verse */}
                      <div className="space-y-1.5 pt-1 border-t border-[#F5F5F0]">
                        <div className="flex justify-between text-[10px] font-bold text-[#A0A090]">
                          <span>암송 성취도</span>
                          <span className="font-mono">{isCompleted ? 100 : isMemorizing ? (statusInfo.bestScore || 50) : 0}%</span>
                        </div>
                        <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden border border-[#E9E3D8]">
                          <div 
                            className={`h-full transition-all duration-500 ${isCompleted ? 'bg-[#8A9A5B]' : 'bg-amber-500'}`}
                            style={{ width: `${isCompleted ? 100 : isMemorizing ? (statusInfo.bestScore || 50) : 0}%` }}
                          ></div>
                        </div>
                        {isCompleted && (
                          <p className="text-[10px] text-[#8A9A5B] font-bold font-serif text-center mt-1">🎉 오늘도 고생했어요! 정말 멋지세요!</p>
                        )}
                      </div>

                      {/* Interactive practice buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={() => onStartBlankPractice(v.id)}
                          className="py-1.5 bg-[#F9F7F2] hover:bg-[#8A9A5B] hover:text-white border border-[#E9E3D8] text-[#5A5A40] text-[10.5px] font-extrabold rounded-xl transition cursor-pointer"
                        >
                          빈칸 연습
                        </button>
                        <button
                          onClick={() => onStartWriteTest(v.id)}
                          className="py-1.5 bg-[#F9F7F2] hover:bg-[#5A5A40] hover:text-white border border-[#E9E3D8] text-[#5A5A40] text-[10.5px] font-extrabold rounded-xl transition cursor-pointer"
                        >
                          직접 쓰기
                        </button>
                        <button
                          onClick={() => onStartSpeakAlong(v.id)}
                          className="py-1.5 bg-[#F9F7F2] hover:bg-[#8A9A5B] hover:text-white border border-[#E9E3D8] text-[#5A5A40] text-[10.5px] font-extrabold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          따라 말하기 🎙️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* WHOLE PASSAGE MULTI-STAGE TRAINING ARENA */
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#F0ECE4] pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#8A9A5B] flex items-center gap-1.5">
                    <BookMarked className="w-5 h-5" />
                    {scriptureReference} 전체 본문 통암송 훈련지 🌟
                  </span>
                  <p className="text-[11px] text-[#7A7A6A]">니고데모와 나누신 거듭남에 관한 예수님의 말씀 전체를 하나의 글처럼 물 흐르듯 통째로 낭독하고 쓰며 암송합니다.</p>
                </div>

                {/* Sub tabs switcher for whole passage */}
                <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-[#E9E3D8] w-full md:w-auto">
                  <button
                    onClick={() => { setWholeSubTab('read'); setWholeTestResult(null); }}
                    className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      wholeSubTab === 'read' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    1. 전체 낭독
                  </button>
                  <button
                    onClick={() => { setWholeSubTab('blank'); setWholeTestResult(null); }}
                    className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      wholeSubTab === 'blank' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    2. 빈칸 훈련
                  </button>
                  <button
                    onClick={() => { setWholeSubTab('write'); setWholeTestResult(null); }}
                    className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      wholeSubTab === 'write' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    3. 통째 쓰기 시험
                  </button>
                </div>
              </div>

              {/* STAGE 1: READ ALOUD & PRACTICE MEMORIZING */}
              {wholeSubTab === 'read' && (
                <div className="space-y-6">
                  <div className="bg-[#FDFBF7] border border-[#E9E3D8] rounded-2xl p-6 md:p-8 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold bg-[#EAF2D7] text-[#8A9A5B] px-3 py-1 rounded-full border border-[#D1E2A4]">READING MODE</span>
                      <button
                        onClick={() => setShowFullText(!showFullText)}
                        className="text-xs text-[#8A9A5B] hover:text-[#5A5A40] font-bold cursor-pointer transition"
                      >
                        {showFullText ? '말씀 가리기 (스스로 암송용) ✕' : '말씀 보기 (글자 확인) 👁️'}
                      </button>
                    </div>

                    <div className="min-h-[160px] flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {showFullText ? (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-base md:text-lg font-serif font-bold text-[#5A5A40] leading-loose text-center max-w-3xl"
                          >
                            {gongGwaVerses.map((v, idx) => (
                              <span key={v.id} className="inline mr-2">
                                <span className="text-[#8A9A5B] font-sans text-xs align-super mr-1 font-black">[{idx+3}]</span>
                                {v.text}
                              </span>
                            ))}
                          </motion.p>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center space-y-3.5 p-6"
                          >
                            <span className="text-3xl text-stone-300">📖</span>
                            <p className="text-sm font-bold text-stone-400">말씀을 가렸습니다. 처음부터 소리 내어 마음속으로 암송해 보세요.</p>
                            <p className="text-xs text-stone-400 italic">"사람이 거듭나지 아니하면 하나님 나라를 볼 수 없느니라..."</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 text-center space-y-1">
                    <p className="text-xs font-bold text-amber-800">💡 통암송 꿀팁</p>
                    <p className="text-[11px] text-amber-700">6절 말씀 '육으로 난 것은 육이요 영으로 난 것은 영이니'를 중심 뼈대로 두고, 앞의 니고데모 대화와 뒤의 바람 비유를 연상하며 이어 말하면 훨씬 잘 외워집니다!</p>
                  </div>
                </div>
              )}

              {/* STAGE 2: PASSAGE CLICK-TO-REVEAL BLANK GAME */}
              {wholeSubTab === 'blank' && (
                <div className="space-y-4">
                  <div className="bg-[#FDFBF7] border border-[#E9E3D8] rounded-2xl p-6 md:p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold bg-[#FDF6E2] text-amber-700 px-3 py-1 rounded-full border border-amber-200">Interactive Blank Mode</span>
                      <button
                        onClick={() => setRevealedBlanks({})}
                        className="text-xs text-[#8A9A5B] hover:text-[#5A5A40] font-bold cursor-pointer transition"
                      >
                        전체 빈칸 다시 가리기 ⟳
                      </button>
                    </div>

                    <div className="text-sm md:text-base font-serif font-bold text-[#5A5A40] leading-loose text-center max-w-3xl mx-auto">
                      {gongGwaVerses.map((v, vidx) => {
                        const words = v.text.split(' ');
                        const blankKeywords = ['거듭나지', '하나님', '나라를', '나라에', '물과', '성령으로', '육으로', '영으로', '기이히', '바람이', '임의로', '소리를', '알지', '못하나니', '사람은'];

                        return (
                          <span key={v.id} className="inline mr-2">
                            <span className="text-[#8A9A5B] font-sans text-[11px] align-super mr-0.5 font-bold">[{vidx+3}]</span>
                            {words.map((word, widx) => {
                              const clean = word.replace(/[.,·?\/#!$%\^&\*;:{}=\-_`~()]/g, '');
                              const isBlank = blankKeywords.some(k => clean.includes(k));
                              const blankKey = `${v.id}-${widx}`;
                              const isRevealed = revealedBlanks[blankKey];

                              if (isBlank) {
                                return (
                                  <button
                                    key={widx}
                                    onClick={() => setRevealedBlanks(prev => ({ ...prev, [blankKey]: !prev[blankKey] }))}
                                    className={`inline-block px-2 py-0 mx-0.5 rounded-lg border text-xs sm:text-sm font-sans font-extrabold transition cursor-pointer select-none ${
                                      isRevealed 
                                        ? 'bg-[#EAF2D7] border-[#8A9A5B]/30 text-[#5A5A40]' 
                                        : 'bg-amber-100/80 hover:bg-amber-200/80 border-amber-300 text-amber-800'
                                    }`}
                                    title="클릭하여 확인"
                                  >
                                    {isRevealed ? word : '❓'}
                                  </button>
                                );
                              }
                              return <span key={widx} className="mr-1 inline-block">{word}</span>;
                            })}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-center text-[#A0A090] font-bold">💡 가려진 노란색 단어 버튼을 클릭하면 원본 말씀이 활짝 나타납니다!</p>
                </div>
              )}

              {/* STAGE 3: FULL PASSAGE TYPING TEST & REAL-TIME ALIGNMENT SCORING */}
              {wholeSubTab === 'write' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5A5A40]">성구 전문 타이핑 입력 (요한복음 3장 3~8절)</label>
                    <textarea
                      value={typedWholeText}
                      onChange={(e) => setTypedWholeText(e.target.value)}
                      placeholder="이곳에 기억하시는 암송 말씀 전문을 성경 장절 띄어쓰기를 살려 정성껏 입력해 주세요. (주의: 한 글자씩 정확하게 대조되어 채점됩니다)"
                      rows={6}
                      className="w-full text-xs sm:text-sm p-4 rounded-2xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-serif leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setTypedWholeText(''); setWholeTestResult(null); }}
                      className="px-4 py-2.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      다시 쓰기 ⟳
                    </button>
                    <button
                      type="button"
                      onClick={handleEvaluateWholeText}
                      disabled={!typedWholeText.trim()}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        typedWholeText.trim() ? 'bg-[#5A5A40] hover:bg-[#4A4A30] text-white shadow-sm' : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      나의 암송 결과 확인하기 (체점)
                    </button>
                  </div>

                  {/* Typing results block */}
                  {wholeTestResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl p-5 md:p-6 space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-[#E9E3D8] pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#5A5A40]">통암송 성취 등급</span>
                          <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                            wholeTestResult.score >= 95 
                              ? 'bg-[#EAF2D7] text-[#8A9A5B] border border-[#D1E2A4]' 
                              : wholeTestResult.score >= 70 
                                ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {wholeTestResult.score >= 95 ? '👑 명예의 전당 (완벽)' : wholeTestResult.score >= 70 ? '📖 한걸음 더 (우수)' : '⏱ 암송 보강 필요'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black font-serif text-[#5A5A40]">{wholeTestResult.score}</span>
                          <span className="text-xs text-[#7A7A6A] font-bold"> 점 / 100</span>
                        </div>
                      </div>

                      <div className="space-y-3 font-sans">
                        <div className="flex justify-between text-[11px] font-bold text-[#7A7A6A]">
                          <span>단어 분석 대조표 ({wholeTestResult.correctCount} / {wholeTestResult.totalWords} 단어 성공)</span>
                          <span className="font-mono text-stone-500">정확도 {wholeTestResult.score}%</span>
                        </div>

                        {/* Real-time Diff Alignment Visualizer */}
                        <div className="p-4 bg-white border border-[#E9E3D8] rounded-xl flex flex-wrap gap-1.5 leading-relaxed text-xs">
                          {wholeTestResult.diff.map((item, idx) => {
                            if (item.status === 'correct') {
                              return <span key={idx} className="text-[#8A9A5B] font-bold bg-[#EAF2D7]/40 px-1 py-0.5 rounded">{item.text}</span>;
                            } else if (item.status === 'missing') {
                              return <span key={idx} className="text-stone-400 bg-stone-100 line-through px-1 py-0.5 rounded border border-dashed border-stone-200" title="누락된 성구 말씀">{item.text}</span>;
                            } else {
                              return <span key={idx} className="text-rose-600 font-extrabold bg-rose-50 px-1 py-0.5 rounded border border-rose-100" title="오타/잘못 쓴 부분">{item.text}</span>;
                            }
                          })}
                        </div>
                      </div>

                      {wholeTestResult.score === 100 && (
                        <div className="bg-[#EAF2D7]/60 border border-[#8A9A5B]/30 p-4 rounded-xl text-center text-xs font-serif font-bold text-[#8A9A5B]">
                          🎉 정말 위대하십니다! 요한복음 3장 공과 말씀 전체 6구절을 토씨 하나 틀리지 않고 완벽히 암송하셨습니다! 하나님께 큰 영광 올려 드립니다!
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: LESSONS & QNA COMPREHENSION */}
      {activeSubTab === 'lessons' && (
        <div className="space-y-6">
          {/* Lessons Grid (Bento style) */}
          <div className="space-y-3">
            <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-[#8A9A5B] fill-[#8A9A5B]/10" />
              공과 공부 핵심 정리 (4대 대지)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coreLessons.map((lesson, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E9E3D8] p-5 rounded-2xl shadow-xs space-y-2 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-[#5A5A40]">{lesson.title}</h4>
                    <span className="text-[10px] font-mono text-[#8A9A5B] font-bold bg-[#F5F5F0] px-2 py-0.5 rounded-full">
                      {lesson.verse}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7A6A] leading-relaxed font-serif">
                    {lesson.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Q&A Card Flipping comprehension game */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-1.5">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                성경 공부 요약 성도 자가 진단 문답 ({qnaItems.length}문항)
              </h3>
              <button
                onClick={handleResetFlips}
                className="text-[11px] text-[#8A9A5B] font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                전체 카드 다시 덮기
              </button>
            </div>

            <p className="text-xs text-[#7A7A6A]">
              질문이 적힌 카드를 마우스로 클릭하면 앞뒤로 뒤집히며(Flip) 정답이 예쁘게 나타납니다. 암송 공부 후 본인의 성과와 지식을 점검해 보세요.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {qnaItems.map((qna) => {
                const isFlipped = flippedCards[qna.id] || false;
                return (
                  <div
                    key={qna.id}
                    onClick={() => handleCardClick(qna.id)}
                    className="h-48 cursor-pointer relative select-none"
                    style={{ perspective: '1000px' }}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      className="w-full h-full relative"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* CARD FRONT (Question) */}
                      <div
                        className="absolute inset-0 bg-white border border-[#E9E3D8] rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-xs hover:border-[#8A9A5B]/50 transition duration-300"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Question Card</span>
                          <HelpCircle className="w-4 h-4 text-amber-400" />
                        </div>
                        <h4 className="text-xs font-bold text-[#5A5A40] font-serif leading-relaxed text-center flex-1 flex items-center justify-center">
                          {qna.question}
                        </h4>
                        <div className="text-[10px] text-center font-bold text-[#8A9A5B] pt-2 border-t border-[#F5F5F0]">
                          클릭하여 정답 보기 ➜
                        </div>
                      </div>

                      {/* CARD BACK (Answer) */}
                      <div
                        className="absolute inset-0 bg-[#F9F7F2] border border-[#8A9A5B]/40 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-md"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#EAF2D7] border border-[#D1E2A4] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Answer Card</span>
                          <CheckCircle2 className="w-4 h-4 text-[#8A9A5B]" />
                        </div>
                        <p className="text-xs font-serif font-semibold text-stone-800 leading-relaxed text-center flex-1 flex items-center justify-center">
                          {qna.answer}
                        </p>
                        <div className="text-[10px] text-center font-bold text-stone-400 pt-2 border-t border-[#F5F5F0]">
                          다시 클릭하면 덮입니다.
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
