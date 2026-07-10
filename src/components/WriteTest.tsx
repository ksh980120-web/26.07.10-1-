/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RefreshCw, ChevronRight, HelpCircle, Trophy, BookOpen, ThumbsUp, ArrowLeft } from 'lucide-react';
import { Verse } from '../types';
import { getWordDiff, DiffWord } from '../utils/diff';

interface WriteTestProps {
  verse: Verse;
  onComplete: (score: number, userText: string) => void;
  onBack: () => void;
}

export default function WriteTest({ verse, onComplete, onBack }: WriteTestProps) {
  const [userText, setUserText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [diffResults, setDiffResults] = useState<DiffWord[]>([]);
  const [score, setScore] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim()) return;

    const { diffs, score: calculatedScore } = getWordDiff(verse.text, userText);
    setDiffResults(diffs);
    setScore(calculatedScore);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setUserText('');
    setIsSubmitted(false);
    setDiffResults([]);
    setScore(0);
  };

  const handleFinish = () => {
    onComplete(score, userText);
  };

  // Helper metrics
  const cleanOriginal = verse.text.replace(/\s+/g, ' ');
  const cleanUser = userText.replace(/\s+/g, ' ');

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E9E3D8]" id="write-test-container">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-[#E9E3D8]">
        <div>
          <span className="text-xs font-bold text-[#5A5A40] bg-[#F9F7F2] px-3 py-1 rounded-full uppercase tracking-wider border border-[#E9E3D8]">
            실전 암송 테스트
          </span>
          <h2 className="text-xl font-serif font-bold text-[#5A5A40] mt-2" id="test-reference">
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

      {/* Intro instruction */}
      {!isSubmitted && (
        <div className="mb-6 p-4 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl text-[#7A7A6A] text-sm leading-relaxed">
          <p className="font-semibold text-[#5A5A40] mb-1">✍️ 실전 암송 방법:</p>
          주어진 성경구절 장절(<span className="font-semibold text-[#5A5A40]">{verse.reference}</span>)만 보고, 전체 구절을 머릿속으로 떠올려 아래에 받아써 보세요. 맞춤법과 띄어쓰기를 바탕으로 자동 채점과 꼼꼼한 오답 체크가 진행됩니다.
        </div>
      )}

      {/* Main Arena */}
      <div className="grid grid-cols-1 gap-6">
        {/* Input Textarea or Diff Visualization */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="여기에 생각나는 성경 구절을 한 자 한 자 적어보세요..."
                rows={5}
                className="w-full p-5 rounded-2xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] text-lg font-serif leading-relaxed placeholder-[#A0A090] focus:outline-none focus:ring-2 focus:ring-[#8A9A5B]/10 focus:border-[#8A9A5B] transition"
                id="test-textarea"
                required
              />
              <div className="absolute bottom-4 right-4 text-xs text-[#A0A090] font-mono">
                {userText.length} 자 작성 중
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowHelper(!showHelper)}
                className="text-xs font-semibold text-[#7A7A6A] hover:text-[#8A9A5B] flex items-center gap-1 transition"
              >
                <HelpCircle className="w-4 h-4" />
                {showHelper ? '힌트 닫기' : '초성 및 묵상 힌트'}
              </button>

              <button
                type="submit"
                className="bg-[#5A5A40] hover:bg-[#4A4A30] active:scale-95 text-white font-bold text-sm px-6 py-2.5 rounded-full transition shadow-sm flex items-center gap-2"
                id="submit-test-button"
              >
                <CheckCircle2 className="w-4 h-4" />
                암송 완료! 채점하기
              </button>
            </div>

            {/* Helper content */}
            <AnimatePresence>
              {showHelper && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl p-4 overflow-hidden text-xs text-[#7A7A6A] space-y-2"
                >
                  {verse.hint && (
                    <div>
                      <span className="font-semibold text-[#5A5A40] block mb-0.5">💡 묵상 포인트:</span>
                      {verse.hint}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-[#5A5A40] block mb-0.5">🔍 글자수 & 초성:</span>
                    구절은 총 <span className="font-semibold text-[#5A5A40]">{verse.text.split(' ').length}단어</span>로 구성되어 있습니다.
                    <p className="mt-1 font-serif tracking-wider bg-white p-2 rounded-lg border border-[#E9E3D8]">
                      {verse.text.split(' ').map(w => w.charAt(0) + '..').join(' ')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        ) : (
          /* DIFF VISUALIZATION MODE */
          <div className="space-y-6">
            <div className="p-6 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl">
              <h3 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wider mb-3">암송 채점 분석</h3>
              
              <div className="flex flex-wrap gap-x-2 gap-y-3.5 leading-relaxed text-lg font-serif">
                {diffResults.map((d, index) => {
                  if (d.type === 'match') {
                    return (
                      <span
                        key={index}
                        className="bg-[#F5F5F0] text-[#8A9A5B] border-b-2 border-[#8A9A5B] px-1 py-0.5 rounded-sm select-all"
                        title="일치하는 단어"
                      >
                        {d.word}
                      </span>
                    );
                  }

                  if (d.type === 'mismatch') {
                    return (
                      <span
                        key={index}
                        className="relative group bg-rose-50 text-rose-800 border-b-2 border-rose-300 px-1 py-0.5 rounded-sm cursor-help"
                      >
                        <del className="no-underline">{d.word}</del>
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs bg-[#5A5A40] text-white px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-10 font-serif">
                          원래 구절: {d.originalWord}
                        </span>
                      </span>
                    );
                  }

                  if (d.type === 'missing') {
                    return (
                      <span
                        key={index}
                        className="bg-amber-50 text-amber-800 border-b-2 border-dashed border-amber-300 px-1 py-0.5 rounded-sm cursor-help"
                        title="빠진 단어"
                      >
                        [{d.word}]
                      </span>
                    );
                  }

                  // Extra word (typed but not in scripture)
                  return (
                    <span
                      key={index}
                      className="bg-stone-100 text-stone-400 border-b-2 border-dashed border-stone-300 px-1 py-0.5 rounded-sm line-through"
                      title="추가된 단어 (성경에 없음)"
                    >
                      {d.word}
                    </span>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-[#E9E3D8] text-xs text-[#7A7A6A]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-[#F5F5F0] border border-[#8A9A5B] rounded-sm"></span>
                  일치
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-rose-100 border border-rose-300 rounded-sm"></span>
                  오타/틀림
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-amber-100 border-b-2 border-dashed border-amber-300 rounded-sm"></span>
                  누락 단어
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-stone-100 border-b-2 border-dashed border-stone-300 rounded-sm"></span>
                  임의 추가
                </div>
              </div>
            </div>

            {/* Score Card and Comments */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6 text-center md:text-left ${
              score === 100 
                ? 'bg-[#F5F5F0] border-[#E9E3D8] text-[#5A5A40]' 
                : score >= 80 
                ? 'bg-[#F9F7F2] border-[#E9E3D8] text-[#5A5A40]' 
                : 'bg-stone-50 border-stone-200 text-[#4A4A4A]'
            }`}>
              <div className="relative shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-sm border border-[#E9E3D8] font-serif font-bold text-3xl text-[#5A5A40]">
                <span>
                  {score}%
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-center md:justify-start gap-1 text-sm font-bold uppercase tracking-wider text-[#A0A090]">
                  {score === 100 ? <Trophy className="w-4 h-4 text-[#8A9A5B]" /> : <ThumbsUp className="w-4 h-4 text-[#7A7A6A]" />}
                  {score === 100 ? '퍼펙트 암송 🌟' : score >= 80 ? '훌륭한 암송 실력 👍' : '연습이 조금 더 필요해요 📖'}
                </div>
                <h4 className="text-lg font-serif font-bold text-[#5A5A40]">
                  {score === 100 
                    ? "성령 충만한 완벽한 암송입니다!" 
                    : score >= 80 
                    ? "거의 다 완성하셨습니다. 디테일만 가다듬으면 완벽해요!" 
                    : "포기하지 마세요. 매일 3번씩 소리 내어 읽으면 곧 외워집니다."}
                </h4>
                <p className="text-xs text-[#7A7A6A] leading-relaxed max-w-lg">
                  {score === 100 
                    ? "장장 한 주 동안 공들여 묵상한 열매가 성경구절 그대로 마음에 심겼습니다. 다음 구절도 이 기세를 이어가 볼까요?" 
                    : "틀린 단어 혹은 빠진 성경단어의 문맥을 꼼꼼히 확인하고 다시 적어보세요. 기억력에 아주 긍정적인 복습 효과가 일어납니다."}
                </p>
              </div>
            </div>

            {/* Full text comparison table */}
            <div className="border border-[#E9E3D8] rounded-2xl overflow-hidden text-sm bg-white shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E9E3D8]">
                <div className="p-4 bg-[#F9F7F2]">
                  <span className="block text-xs font-semibold text-[#A0A090] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#8A9A5B]" /> 원래 성경 구절
                  </span>
                  <p className="font-serif leading-relaxed text-[#4A4A4A] text-base">{verse.text}</p>
                </div>
                <div className="p-4 bg-white">
                  <span className="block text-xs font-semibold text-[#A0A090] uppercase tracking-wider mb-1">✍️ 내가 쓴 구절</span>
                  <p className="font-serif leading-relaxed text-[#7A7A6A] text-base italic">{userText || "(빈 텍스트)"}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E9E3D8] text-sm font-semibold text-[#5A5A40] bg-white hover:bg-[#F5F5F0] transition"
              >
                <RefreshCw className="w-4 h-4 text-[#5A5A40]" />
                다시 써보기
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-[#8A9A5B] hover:bg-[#78884F] text-white font-bold text-sm transition shadow-sm"
              >
                기록 저장 및 테스트 종료
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
