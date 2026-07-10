/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Check, AlertCircle, RefreshCw, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import { Verse } from '../types';
import { cleanWord } from '../utils/diff';

interface BlankPracticeProps {
  verse: Verse;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export default function BlankPractice({ verse, onComplete, onBack }: BlankPracticeProps) {
  const [level, setLevel] = useState<number>(30); // default 30% blanks
  const [words, setWords] = useState<{ word: string; isBlank: boolean; id: number }[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [revealedBlanks, setRevealedBlanks] = useState<{ [key: number]: boolean }>({});

  // Generate words and identify blanks deterministically based on difficulty percentage
  useEffect(() => {
    const rawWords = verse.text.split(/\s+/).filter(Boolean);
    
    // We want a seed-based or deterministic pattern so same verse + same level always gives same blanks
    const processed = rawWords.map((word, idx) => {
      // Simple hash-like deterministic selection for blanks
      const charSum = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), idx);
      const isBlank = (charSum % 100) < level;
      
      return {
        word,
        isBlank,
        id: idx
      };
    });

    // Ensure at least some words are blanked out, and not ALL words are blanked unless level is 100
    const blankCount = processed.filter(w => w.isBlank).length;
    if (blankCount === 0 && rawWords.length > 0 && level > 0) {
      processed[Math.floor(rawWords.length / 2)].isBlank = true;
    }

    setWords(processed);
    setUserAnswers({});
    setShowResults(false);
    setShowHints(false);
    setRevealedBlanks({});
  }, [verse, level]);

  const handleInputChange = (id: number, val: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [id]: val
    }));
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  const handleLevelChange = (newLevel: number) => {
    setLevel(newLevel);
  };

  // Calculate score of current fill-in
  const totalBlanks = words.filter(w => w.isBlank).length;
  let correctCount = 0;
  if (showResults) {
    words.forEach(w => {
      if (w.isBlank) {
        const userAns = cleanWord(userAnswers[w.id] || '');
        const correctAns = cleanWord(w.word);
        if (userAns === correctAns) {
          correctCount++;
        }
      }
    });
  }
  const score = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 100;

  const handleReset = () => {
    setUserAnswers({});
    setShowResults(false);
    setShowHints(false);
    setRevealedBlanks({});
  };

  const handleFinish = () => {
    onComplete(score);
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E9E3D8]" id="blank-practice-container">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-[#E9E3D8]">
        <div>
          <span className="text-xs font-bold text-[#8A9A5B] bg-[#F5F5F0] px-3 py-1 rounded-full uppercase tracking-wider border border-[#E9E3D8]">
            구간별 빈칸 채우기
          </span>
          <h2 className="text-xl font-serif font-bold text-[#5A5A40] mt-2" id="practice-reference">
            {verse.reference}
          </h2>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-white bg-[#5A5A40] hover:bg-[#4A4A30] rounded-xl transition shadow-sm border border-[#5A5A40]"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span>← 목록으로 돌아가기 (뒤로가기)</span>
        </button>
      </div>

      {/* Difficulty selector */}
      <div className="mb-6 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E9E3D8]">
        <label className="block text-xs font-semibold text-[#A0A090] uppercase tracking-wider mb-2.5">
          빈칸 난이도 선택
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '쉬움 (20%)', value: 20 },
            { label: '보통 (40%)', value: 40 },
            { label: '어려움 (60%)', value: 60 },
            { label: '완전 정복 (90%)', value: 90 },
          ].map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => handleLevelChange(lvl.value)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                level === lvl.value
                  ? 'bg-[#8A9A5B] text-white shadow-sm'
                  : 'bg-white hover:bg-[#F5F5F0] text-[#7A7A6A] border border-[#E9E3D8]'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scripture Blank Arena */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-[#E9E3D8] min-h-[140px] leading-loose text-[#4A4A4A] text-lg">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3.5">
          {words.map((w) => {
            if (!w.isBlank) {
              return (
                <span key={w.id} className="font-serif select-none text-[#4A4A4A]">
                  {w.word}
                </span>
              );
            }

            // Word is blanked
            const userVal = userAnswers[w.id] || '';
            const correctClean = cleanWord(w.word);
            const userClean = cleanWord(userVal);
            const isCorrect = userClean === correctClean;
            const hintChar = w.word.charAt(0);

            let inputClass = "px-2 py-1 h-8 rounded-lg border text-center text-base font-serif font-medium transition duration-200 focus:outline-none focus:ring-2 ";
            
            if (showResults) {
              inputClass += isCorrect
                ? "bg-[#F5F5F0] text-[#8A9A5B] border-[#8A9A5B]/40 focus:ring-[#8A9A5B]/20"
                : "bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-300";
            } else {
              inputClass += "bg-white text-[#4A4A4A] border-[#E9E3D8] focus:border-[#8A9A5B] focus:ring-[#8A9A5B]/10";
            }

            // Dynamic width based on word length to look natural
            const widthStyle = {
              width: `${Math.max(w.word.length * 16 + 24, 60)}px`
            };

            return (
              <span key={w.id} className="relative inline-flex flex-col items-center group">
                {/* Answer Feedback / original word display */}
                {showResults && !isCorrect && (
                  <span className="absolute -top-7 text-xs bg-[#5A5A40] text-white px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10 font-serif">
                    {w.word}
                  </span>
                )}

                <input
                  type="text"
                  value={userVal}
                  onChange={(e) => handleInputChange(w.id, e.target.value)}
                  disabled={showResults}
                  placeholder={showHints || revealedBlanks[w.id] ? `${hintChar}..` : "?"}
                  style={widthStyle}
                  className={inputClass}
                  title={showResults ? `정답: ${w.word}` : '빈칸을 채워보세요'}
                />

                {/* Individual Hint reveal button */}
                {!showResults && !showHints && !revealedBlanks[w.id] && (
                  <button
                    type="button"
                    onClick={() => setRevealedBlanks(prev => ({ ...prev, [w.id]: true }))}
                    className="absolute -bottom-5 text-[9px] text-[#A0A090] opacity-0 group-hover:opacity-100 hover:text-[#5A5A40] transition"
                  >
                    초성 힌트
                  </button>
                )}
                {revealedBlanks[w.id] && !showResults && (
                  <span className="absolute -bottom-5 text-[9px] text-[#8A9A5B] font-semibold font-serif">
                    시작: {hintChar}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Hint and Description bar */}
      {verse.hint && (
        <div className="mb-6 p-4 bg-[#F9F7F2] rounded-2xl border border-[#E9E3D8] text-xs text-[#7A7A6A] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#8A9A5B]" />
          <div>
            <span className="font-semibold text-[#5A5A40]">묵상 길잡이:</span> {verse.hint}
          </div>
        </div>
      )}

      {/* Buttons & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E9E3D8] text-xs font-semibold text-[#5A5A40] bg-white hover:bg-[#F5F5F0] transition"
          >
            {showHints ? <EyeOff className="w-3.5 h-3.5 text-[#5A5A40]" /> : <Eye className="w-3.5 h-3.5 text-[#5A5A40]" />}
            {showHints ? '첫글자 힌트 숨기기' : '모든 첫글자 힌트 보기'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E9E3D8] text-xs font-semibold text-[#5A5A40] bg-white hover:bg-[#F5F5F0] transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#5A5A40]" />
            초기화
          </button>
        </div>

        <div>
          {!showResults ? (
            <button
              onClick={checkAnswers}
              className="bg-[#8A9A5B] hover:bg-[#78884F] text-white font-semibold text-sm px-5 py-2 rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              정답 확인하기
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-[#5A5A40] hover:bg-[#4A4A30] text-white font-semibold text-sm px-6 py-2 rounded-xl transition shadow-sm inline-flex items-center gap-1.5 animate-pulse"
            >
              {score === 100 ? (
                <>
                  <Trophy className="w-4 h-4" />
                  완벽합니다! 학습 완료
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  결과 저장 및 종료
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Visual results dashboard */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className={`mt-6 p-5 rounded-2xl border text-center ${
              score === 100 
                ? 'bg-[#F5F5F0] border-[#E9E3D8] text-[#5A5A40]' 
                : score >= 60 
                ? 'bg-[#F9F7F2] border-[#E9E3D8] text-[#5A5A40]' 
                : 'bg-stone-50 border-stone-200 text-[#4A4A4A]'
            }`}
          >
            <div className="text-sm font-semibold uppercase tracking-wider mb-1">채점 완료</div>
            <div className="text-3xl font-serif font-extrabold" id="practice-score">
              {score}점
            </div>
            <p className="text-xs text-[#7A7A6A] mt-2 max-w-md mx-auto leading-relaxed">
              {score === 100 
                ? "축하합니다! 빈칸을 모두 완벽하게 맞추셨습니다. 금주 성경 구절이 머리에 쏙 새겨졌네요! ✨" 
                : score >= 70 
                ? "정말 잘하셨습니다! 틀린 부분의 원래 단어를 확인하고 조금만 더 연습해보세요. 👍" 
                : "괜찮습니다! 틀린 부분들을 여러 번 소리 내어 읽은 뒤, 다시 도전하면 금방 외울 수 있습니다. 📖"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
