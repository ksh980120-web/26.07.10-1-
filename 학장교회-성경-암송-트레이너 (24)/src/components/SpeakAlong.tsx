import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, RotateCcw, Check, ArrowLeft, Trophy, Sparkles, HelpCircle, AlertCircle, Play, Square } from 'lucide-react';
import { Verse } from '../types';

interface SpeakAlongProps {
  verse: Verse;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export default function SpeakAlong({ verse, onComplete, onBack }: SpeakAlongProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false); // For TTS
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [matchedWords, setMatchedWords] = useState<{ word: string; isMatched: boolean }[]>([]);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError('이 브라우저는 음성인식을 지원하지 않습니다. Chrome, Safari 또는 Edge를 이용해 주세요.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'ko-KR';

    rec.onstart = () => {
      setIsListening(true);
      setRecognitionError(null);
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event);
      if (event.error === 'not-allowed') {
        setRecognitionError('마이크 권한이 거부되었습니다. 주소창 왼쪽의 마이크 권한을 허용해 주시거나, 상단 우측 새 탭 열기 버튼을 눌러 새 창에서 실행해 주세요.');
      } else if (event.error === 'no-speech') {
        // Just silent timeout, ignore
      } else {
        setRecognitionError(`음성인식 오류가 발생했습니다: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setTranscript(prev => (prev + ' ' + final).trim().replace(/\s+/g, ' '));
      setInterimTranscript(interim);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      // Stop speech synthesis on unmount
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Handle Speech Recognition toggle
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setInterimTranscript('');
      setShowResults(false);
      setScore(null);
      try {
        window.speechSynthesis?.cancel(); // Cancel any ongoing speaking
        setIsSpeaking(false);
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Play Scripture Text-to-Speech
  const playTTS = () => {
    if (!window.speechSynthesis) {
      alert('이 브라우저는 음성 출력을 지원하지 않습니다.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean scripture reference and text for speech
    const cleanSpeechText = `${verse.reference}. ${verse.text}`;
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // Slightly slower for clear pronunciation

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Clean text helper for comparison
  const cleanKoreanText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\s]/g, '') // Remove all punctuation and spaces
      .trim();
  };

  // Evaluate accuracy
  const checkPronunciation = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const finalSpokenText = transcript.trim();
    if (!finalSpokenText) {
      setRecognitionError('인식된 음성이 없습니다. 마이크 버튼을 누르고 소리내어 읽어주세요.');
      return;
    }

    const originalText = verse.text;
    const origWords = originalText.split(/\s+/);
    const spokenClean = cleanKoreanText(finalSpokenText);

    // Let's do a word-level matching
    // For each word in original, check if its clean form is present in the spoken text (with index progression)
    let searchStartIndex = 0;
    const evaluatedWords = origWords.map((word) => {
      const wordClean = cleanKoreanText(word);
      if (!wordClean) return { word, isMatched: true }; // handle empty or punctuation only

      const foundIndex = spokenClean.indexOf(wordClean, searchStartIndex);
      if (foundIndex !== -1) {
        // Advance search index to maintain sequential order (flexible matching)
        searchStartIndex = foundIndex + wordClean.length;
        return { word, isMatched: true };
      }
      return { word, isMatched: false };
    });

    const matchedCount = evaluatedWords.filter(w => w.isMatched).length;
    const calculatedScore = Math.round((matchedCount / origWords.length) * 100);

    setMatchedWords(evaluatedWords);
    setScore(calculatedScore);
    setShowResults(true);
  };

  const handleReset = () => {
    setTranscript('');
    setInterimTranscript('');
    setScore(null);
    setShowResults(false);
    setRecognitionError(null);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const handleFinish = () => {
    if (score !== null) {
      onComplete(score);
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#E9E3D8]" id="speak-along-container">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-[#E9E3D8]">
        <div>
          <span className="text-xs font-bold text-[#8A9A5B] bg-[#F5F5F0] px-3 py-1 rounded-full uppercase tracking-wider border border-[#E9E3D8]">
            따라말하기 음성 훈련 (하가 읊조리기)
          </span>
          <h2 className="text-xl font-serif font-bold text-[#5A5A40] mt-2" id="speak-reference">
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

      {/* Slogan Intro */}
      <div className="mb-6 p-4 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl text-xs text-[#7A7A6A] leading-relaxed flex items-start gap-2.5">
        <Sparkles className="w-4.5 h-4.5 text-[#8A9A5B] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#5A5A40] mb-0.5">학장교회 성도님을 위한 소리 내어 읊조리는 '하가(Hagah)' 연습:</p>
          말씀을 입술로 소리 내어 고백할 때 말씀이 우리의 생각이 되고 일상이 됩니다. <strong>"말씀중심 은혜중심"</strong>으로 먼저 성구를 듣고, 마이크 버튼을 누른 뒤 큰 목소리로 따라 읽어보세요!
        </div>
      </div>

      {/* Target verse and listen section */}
      <div className="bg-[#FDFBF7] rounded-2xl p-6 mb-6 border border-[#E9E3D8]/60 relative">
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Listen Button */}
          <button
            onClick={playTTS}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isSpeaking
                ? 'bg-[#5A5A40] border-[#5A5A40] text-white'
                : 'bg-white border-[#E9E3D8] text-[#5A5A40] hover:bg-[#F5F5F0]'
            }`}
            title="성구 들어보기"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce' : ''}`} />
            {isSpeaking ? '음성 출력 중..' : '성구 듣기 (원어민 발음)'}
          </button>
        </div>

        <span className="block text-xs font-semibold text-[#A0A090] uppercase tracking-wider mb-2">원래 암송할 구절</span>
        <p className="font-serif leading-relaxed text-[#4A4A4A] text-lg pr-24">
          {verse.text}
        </p>
      </div>

      {/* Voice arena layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Left 2 cols: Transcript area */}
        <div className="md:col-span-2 flex flex-col justify-between bg-white border border-[#E9E3D8] rounded-2xl p-6 min-h-[180px] shadow-inner relative">
          <div>
            <span className="block text-xs font-semibold text-[#A0A090] uppercase tracking-wider mb-2">내가 소리 내어 고백한 내용</span>
            
            {transcript === '' && interimTranscript === '' ? (
              <p className="text-sm font-serif italic text-[#A0A090] leading-relaxed">
                마이크 버튼을 누르신 후, 위의 성경 말씀 구절을 소리내어 말씀해 보세요...
              </p>
            ) : (
              <p className="text-base font-serif leading-relaxed text-[#4A4A4A]">
                {transcript}
                {interimTranscript && (
                  <span className="text-[#8A9A5B]/70 italic"> {interimTranscript}</span>
                )}
              </p>
            )}
          </div>

          {/* Voice Wave Visualizer when listening */}
          {isListening && (
            <div className="flex items-center gap-1 mt-4">
              <span className="text-[10px] font-bold text-[#8A9A5B] uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-3.5 bg-[#8A9A5B] rounded-full animate-[bounce_0.8s_infinite]"></span>
                  <span className="w-1 h-5 bg-[#8A9A5B] rounded-full animate-[bounce_0.5s_infinite_0.1s]"></span>
                  <span className="w-1 h-2 bg-[#8A9A5B] rounded-full animate-[bounce_0.6s_infinite_0.2s]"></span>
                  <span className="w-1 h-4.5 bg-[#8A9A5B] rounded-full animate-[bounce_0.7s_infinite_0.15s]"></span>
                </span>
                귀 기울여 듣고 있습니다... 말씀해 주세요!
              </span>
            </div>
          )}
        </div>

        {/* Right col: Mic Controller */}
        <div className="flex flex-col items-center justify-center bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl p-6">
          <button
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white ring-8 ring-rose-500/20 animate-pulse'
                : 'bg-[#8A9A5B] hover:bg-[#78884F] text-white ring-8 ring-[#8A9A5B]/10 hover:scale-105'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          
          <span className="mt-3 text-xs font-bold text-[#5A5A40]">
            {isListening ? '음성 녹음 중단' : '음성 따라하기 시작'}
          </span>
          <p className="text-[10px] text-[#A0A090] text-center mt-1">
            버튼을 누르고 소리 내어 끝까지 암송하세요
          </p>
        </div>
      </div>

      {/* Browser compatibility / Permission error handler */}
      {recognitionError && (
        <div className="mb-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <span className="font-bold text-rose-900">확인이 필요합니다:</span>
            <p className="leading-relaxed">{recognitionError}</p>
            <p className="text-[10px] text-rose-700/80">
              * 웹 브라우저 보안 규정상, iframe 내에서는 마이크 사용이 막힐 수 있습니다. 상단의 <strong>[새 탭 열기 ↗]</strong>를 누르시면 완벽하게 작동합니다!
            </p>
          </div>
        </div>
      )}

      {/* Scoring display */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
          >
            {/* Word feedback visualization */}
            <div className="p-6 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl">
              <h3 className="text-xs font-semibold text-[#A0A090] uppercase tracking-wider mb-3">
                음성 일치 비교 분석 (일치하는 단어 필터)
              </h3>
              
              <div className="flex flex-wrap gap-x-2 gap-y-3.5 leading-relaxed text-lg font-serif">
                {matchedWords.map((item, index) => (
                  <span
                    key={index}
                    className={`px-1 py-0.5 rounded transition ${
                      item.isMatched
                        ? 'bg-[#F5F5F0] text-[#8A9A5B] border-b-2 border-[#8A9A5B]'
                        : 'bg-rose-50/40 text-stone-400 border-b-2 border-dashed border-stone-300'
                    }`}
                    title={item.isMatched ? '음성 발음 일치' : '말하지 못했거나 다르게 들린 단어'}
                  >
                    {item.word}
                  </span>
                ))}
              </div>

              <div className="flex gap-4 mt-5 pt-3 border-t border-[#E9E3D8] text-[11px] text-[#7A7A6A]">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-[#F5F5F0] border-b-2 border-[#8A9A5B] rounded-sm"></span>
                  일치 단어 고백함
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-rose-50/40 border-b-2 border-dashed border-stone-300 rounded-sm"></span>
                  다르게 말했거나 인식되지 않음
                </div>
              </div>
            </div>

            {/* Score box */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6 text-center md:text-left ${
              score === 100 
                ? 'bg-[#F5F5F0] border-[#E9E3D8] text-[#5A5A40]' 
                : score !== null && score >= 70 
                ? 'bg-[#F9F7F2] border-[#E9E3D8] text-[#5A5A40]' 
                : 'bg-stone-50 border-stone-200 text-[#4A4A4A]'
            }`}>
              <div className="relative shrink-0 flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-sm border border-[#E9E3D8] font-serif font-bold text-3xl text-[#5A5A40]">
                <span>
                  {score}%
                </span>
              </div>
              <div>
                <div className="flex items-center justify-center md:justify-start gap-1 text-sm font-bold uppercase tracking-wider text-[#A0A090]">
                  {score === 100 ? <Trophy className="w-4 h-4 text-[#8A9A5B]" /> : <Sparkles className="w-4 h-4 text-[#8A9A5B]" />}
                  {score === 100 ? '학장교회 암송 대장 🌟' : score !== null && score >= 70 ? '대단한 선포 실력 👍' : '조금 더 천천히 또박또박 읊조려 보세요! 📖'}
                </div>
                <h4 className="text-lg font-serif font-bold text-[#5A5A40] mt-1">
                  {score === 100 
                    ? "말씀중심 은혜중심! 말씀이 일상이 된 고백입니다." 
                    : score !== null && score >= 70 
                    ? "대부분의 말씀을 훌륭하게 고백하셨습니다!" 
                    : "괜찮습니다. 말씀을 몇 번 더 읊조리며 다시 고백해 보실래요?"}
                </h4>
                <p className="text-xs text-[#7A7A6A] leading-relaxed max-w-lg mt-1">
                  소리내어 선포하는 한 마디 한 마디가 마음에 단단히 뿌리를 내려, 풍성한 은혜의 열매를 거두시기를 학장교회가 함께 응원합니다.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="mt-8 pt-5 border-t border-[#E9E3D8] flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E9E3D8] text-sm font-semibold text-[#5A5A40] bg-white hover:bg-[#F5F5F0] transition"
        >
          <RotateCcw className="w-4 h-4 text-[#5A5A40]" />
          다시 읽기 / 초기화
        </button>

        <div className="flex gap-2">
          {!showResults && (
            <button
              onClick={checkPronunciation}
              disabled={!transcript.trim()}
              className={`font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-sm inline-flex items-center gap-1.5 ${
                transcript.trim()
                  ? 'bg-[#8A9A5B] hover:bg-[#78884F] text-white cursor-pointer'
                  : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              발음 정답 확인하기
            </button>
          )}

          {showResults && (
            <button
              onClick={handleFinish}
              className="bg-[#5A5A40] hover:bg-[#4A4A30] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
            >
              성구 암송 점수 기록하고 종료하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
