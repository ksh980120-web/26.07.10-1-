import React, { useState } from 'react';
import { BookMarked, ShieldCheck, UserPlus, LogIn, Sparkles, X, Heart } from 'lucide-react';
import { appSignIn, appSignUp, isSupabaseConfigured, AppUser, supabase } from '../lib/supabase';

interface MainLandingProps {
  onStart: (user: AppUser) => void;
}

export default function MainLanding({ onStart }: MainLandingProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState(() => {
    return !isSupabaseConfigured ? '현재 서버에 연결할 수 없습니다.' : '';
  });
  const [showFindModal, setShowFindModal] = useState(false);
  const [findResult, setFindResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGuest = () => {
    onStart({
      id: 'guest',
      email: 'guest@church.com',
      name: '게스트 성도',
      role: 'guest'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { user, error } = await appSignIn(email, password);
        if (error) {
          setErrorMsg(error);
        } else if (user) {
          onStart(user);
        }
      } else {
        // Sign Up
        if (!name.trim()) {
          setErrorMsg('성도 성함을 반드시 입력해 주세요.');
          setIsLoading(false);
          return;
        }
        if (!phone.trim()) {
          setErrorMsg('휴대전화 번호를 반드시 입력해 주세요.');
          setIsLoading(false);
          return;
        }

        const { user, error } = await appSignUp(name.trim(), phone.trim(), email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else if (user) {
          onStart(user);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '요청 처리 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#E9E3D8]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-[#E9E3D8] rounded-[32px] p-6 md:p-12 shadow-md">
        
        {/* 좌측: 학장교회 훈련기 소개 */}
        <div className="space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            {/* Beautiful, intuitive Manna icon: A golden jar of manna / loaf of bread descending with light */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/70 shadow-xs flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 text-amber-600 fill-amber-100/30" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Loaf of bread shape */}
                <rect x="5" y="10" width="14" height="10" rx="3" className="text-amber-500 fill-amber-400/15" />
                <path d="M5 10c0-3.5 3.5-5 7-5s7 1.5 7 5" className="text-amber-600 fill-amber-500/20" />
                <path d="M9 10v10M12 9v11M15 10v10" className="text-amber-600/50" strokeWidth="1.2" />
                {/* Glow sparkles representing divine manna from heaven */}
                <path d="M12 2v2M3 11l1-1M21 11l-1-1" className="text-amber-500" strokeWidth="2" />
              </svg>
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-sans font-black text-[#5A5A40] leading-none tracking-tight">
                만나 (Manna)
              </h1>
              <h3 className="text-sm md:text-base font-bold text-[#8A9A5B] font-sans">
                하나님과 만나는 달콤한 시간
              </h3>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-[#7A7A6A] leading-relaxed font-sans text-justify bg-[#FDFBF7] p-4.5 rounded-2xl border border-[#E9E3D8]/60 shadow-xs animate-fadeIn">
            <p className="text-[#5A5A40] font-serif font-bold italic text-center text-sm md:text-base border-b border-[#E9E3D8]/40 pb-3 leading-loose">
              "오직 여호와의 율법을 즐거워하여<br />
              그의 율법을 주야로 묵상하는도다"<br />
              <span className="text-xs text-[#8A9A5B] block mt-1 font-sans font-extrabold not-italic">- 시편 1:2 -</span>
            </p>
            <p className="pt-1.5 font-medium leading-relaxed text-center text-xs md:text-sm" style={{ wordBreak: 'keep-all' }}>
              생명의 떡 <strong className="text-[#5A5A40] font-extrabold">‘만나’</strong>처럼 매일 임하는<br />
              하나님의 음성과 은혜를 일상에서 경험해 보세요.
            </p>
            <p className="font-extrabold text-[#8A9A5B] bg-[#EAF2D7]/40 p-3 rounded-xl border border-[#D1E2A4]/40 text-center leading-relaxed" style={{ wordBreak: 'keep-all' }}>
              '말씀을 입으로 선포하고 마음에 새기는 은혜의 여정에 오신 성도님들을 환영합니다.'
            </p>
          </div>

          <div className="border-t border-[#E9E3D8] pt-4 text-center sm:text-left space-y-1">
            <p className="text-xs font-bold tracking-wider text-[#7A7A6A] leading-relaxed font-serif">
              "오직 말씀중심, 은혜중심으로 일어서는 학장교회"
            </p>
            <div className="text-[10px] text-stone-400 font-bold" title="1954년 3월 설립">
              ⓒ 학장교회 (since 1954.03)
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 text-[10.5px] sm:text-[11px] font-bold text-[#5A5A40] pt-2 justify-center md:justify-start">
            <span className="bg-[#EAF2D7]/60 text-[#5A6D30] px-3 py-1.5 rounded-xl border border-[#D1E2A4]/50 shadow-2xs flex items-center gap-1">
              📌 매주/매달 암송 성구
            </span>
            <span className="bg-amber-50/70 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200/50 shadow-2xs flex items-center gap-1">
              📖 생명의 꼴 공과 공부
            </span>
            <span className="bg-stone-100/70 text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs flex items-center gap-1">
              📔 나만의 신앙 성장 노트
            </span>
            <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl border border-purple-100 shadow-2xs flex items-center gap-1">
              🙏 함께 나누는 중보기도
            </span>
          </div>
        </div>

        {/* 우측: 로그인 / 회원가입 폼 */}
        <div className="bg-[#F9F7F2] p-6 md:p-8 rounded-2xl border border-[#E9E3D8] space-y-6">
          <div className="flex border-b border-[#E9E3D8] pb-2 gap-4">
            <button 
              onClick={() => {
                setIsLogin(true);
                setErrorMsg('');
              }}
              className={`pb-2 text-sm font-bold transition-all ${isLogin ? 'text-[#5A5A40] border-b-2 border-[#8A9A5B]' : 'text-[#A0A090]'}`}
            >
              로그인
            </button>
            <button 
              onClick={() => {
                setIsLogin(false);
                setErrorMsg('');
              }}
              className={`pb-2 text-sm font-bold transition-all ${!isLogin ? 'text-[#5A5A40] border-b-2 border-[#8A9A5B]' : 'text-[#A0A090]'}`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl font-bold flex items-center gap-1.5 leading-relaxed">
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            {isLogin ? (
              <>
                {/* 체험 계정 안내 배너 */}
                <div className="bg-[#8A9A5B]/10 border border-[#8A9A5B]/20 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#5A5A40] flex items-center gap-1">
                      💡 회원가입 없이 즉시 체험하기
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('test');
                        setPassword('test1234');
                      }}
                      className="px-2 py-0.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white text-[9px] font-bold rounded-md transition cursor-pointer"
                    >
                      자동 입력 ⚡
                    </button>
                  </div>
                  <div className="text-[10px] text-stone-600 space-y-1 font-sans leading-relaxed">
                    <p>
                      <strong>아이디:</strong> <code className="bg-white px-1.5 py-0.2 rounded border border-stone-200 font-mono">test</code> &nbsp;/&nbsp; 
                      <strong>비밀번호:</strong> <code className="bg-white px-1.5 py-0.2 rounded border border-stone-200 font-mono">test1234</code>
                    </p>
                    <p className="text-[9.5px] text-[#7A7A6A] leading-normal">
                      ※ 체험 계정(테스트성도)은 말씀 암송 성취도 개별 기록, 나만의 묵상 노트 및 중보기도 올리기 등의 등록·수정 권한이 일부 제한되어 있으니 둘러보신 후 개별 가입을 권장합니다.
                    </p>
                  </div>
                  
                  <div className="border-t border-[#8A9A5B]/10 pt-2 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleStartGuest}
                      className="w-full py-2 bg-gradient-to-r from-[#8A9A5B] to-[#5A5A40] hover:opacity-95 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      게스트(체험) 모드로 바로 들어가기
                    </button>
                    <p className="text-[9px] text-[#7A7A6A] text-center font-sans">
                      (게스트 모드로 작성된 내용은 새로고침이나 로그아웃 시 즉시 사라집니다)
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-[#7A7A6A]">아이디 (ID)</label>
                  <input 
                    type="text" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="아이디 또는 이메일"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                  <p className="text-[10.5px] text-[#8A9A5B] font-bold leading-relaxed mt-1 font-sans">
                    💡 가입하여 암송 기록과 말씀 묵상을 저장하고, 신앙 성장의 발자취를 이어가세요.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#7A7A6A]">비밀번호</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#7A7A6A] flex items-center gap-1">
                    성도 이름 <span className="text-rose-500 font-bold">*필수</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 김지은 (본명을 정확히 입력해 주세요)"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#7A7A6A] flex items-center gap-1">
                    휴대전화 번호 <span className="text-rose-500 font-bold">*필수</span>
                  </label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예: 010-1234-5678"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                  <p className="text-[10px] text-[#8A9A5B] font-bold leading-relaxed mt-1 font-sans">
                    💡 휴대전화 번호는 아이디나 비밀번호를 잃어버렸을 때 본인 확인 및 계정 조회용으로 안전하게 사용됩니다.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#7A7A6A]">사용할 아이디 (ID)</label>
                  <input 
                    type="text" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="희망하는 아이디 또는 이메일"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#7A7A6A]">비밀번호 설정</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#4A4A30] text-white border border-[#5A5A40] text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              {isLogin ? '로그인하여 암송 시작하기' : '새 계정 등록하기'}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowFindModal(true)}
              className="text-[11px] text-[#8A9A5B] hover:underline font-bold transition cursor-pointer"
            >
              아이디/비밀번호를 잃어버리셨나요?
            </button>
          </div>
        </div>

      </div>

      {/* Find ID/Password Modal */}
      {showFindModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#F0ECE4] pb-2">
              <h3 className="text-sm font-serif font-bold text-[#5A5A40]">아이디/비밀번호 찾기</h3>
              <button
                onClick={() => {
                  setShowFindModal(false);
                  setFindResult('');
                }}
                className="text-[#A0A090] hover:text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
              가입하신 성함과 휴대전화 번호를 입력해 주시면 계정 정보를 즉시 조회해 드립니다. <br />
              <span className="font-semibold text-[#8A9A5B]">(체험 계정 - 이메일: test@church.com / 비밀번호: test1234)</span>
            </p>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const nameVal = (form.elements[0] as HTMLInputElement).value.trim();
                const phoneVal = (form.elements[1] as HTMLInputElement).value.trim();
                
                if (!isSupabaseConfigured || !supabase) {
                  setFindResult("현재 서버에 연결할 수 없어 계정을 조회할 수 없습니다.");
                  return;
                }

                try {
                  // Clean hyphens or special characters from input phone to ensure resilient lookup
                  const cleanPhoneInput = phoneVal.replace(/[^0-9]/g, '');

                  // Query profiles
                  const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select('email, name, phone');

                  if (error) {
                    setFindResult(`조회 중 오류가 발생했습니다: ${error.message}`);
                    return;
                  }

                  const found = profiles?.find((p: any) => 
                    p.name === nameVal && 
                    (p.phone || '').replace(/[^0-9]/g, '') === cleanPhoneInput
                  );

                  if (found) {
                    setFindResult(`조회 성공! 🎉\n\n성함: ${found.name}\n아이디(이메일): ${found.email}\n\n※ 개인정보 보호 및 보안을 위해 비밀번호는 직접 제공되지 않습니다. 분실 시 목양실이나 말씀 암송 담당자분께 연락하여 비밀번호 재설정/초기화를 요청해 주세요.`);
                  } else {
                    setFindResult(`등록된 성도 정보 없음 ❌\n\n입력하신 성함(${nameVal})과 연락처(${phoneVal})로 일치하는 가입 정보를 찾지 못했습니다.\n\n정확한 본명과 전화번호를 기입해 보시거나 새로 가입해 주세요.`);
                  }
                } catch (err: any) {
                  setFindResult("조회 중 네트워크 오류가 발생했습니다.");
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#7A7A6A]">성도 이름</label>
                <input 
                  type="text" 
                  required
                  placeholder="예: 김지은"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#7A7A6A]">휴대전화 번호</label>
                <input 
                  type="text" 
                  required
                  placeholder="예: 010-1234-5678"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold rounded-lg transition"
              >
                계정 찾기 실행
              </button>
            </form>

            {findResult && (
              <div className="p-3 bg-[#FDF6E2] border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-relaxed whitespace-pre-line font-sans font-medium">
                {findResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
