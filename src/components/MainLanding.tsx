import React, { useState } from 'react';
import { BookMarked, ShieldCheck, UserPlus, LogIn, Sparkles, X, Heart } from 'lucide-react';
import { AppUser, AppRole, supabase, getKoreanErrorMessage } from '../lib/supabase';

interface MainLandingProps {
  onStart: (user: AppUser) => void;
}

export default function MainLanding({ onStart }: MainLandingProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
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
        const trimmedEmail = email.trim();
        const loginEmail = trimmedEmail === 'test' ? 'test@church.com' : trimmedEmail;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password
        });

        if (error) {
          console.log("- Supabase URL:", (import.meta as any).env.VITE_SUPABASE_URL);
          console.log("- URL 존재 여부:", !!(import.meta as any).env.VITE_SUPABASE_URL);
          console.log("- KEY 존재 여부:", !!(import.meta as any).env.VITE_SUPABASE_ANON_KEY);
          console.log("- createClient 생성 여부:", !!supabase);
          console.log("- 실제 Supabase 응답:", { error, data });

          setErrorMsg(getKoreanErrorMessage(error.message));
        } else if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          let resolvedRole: AppRole = 'member';
          if (profile && profile.role) {
            resolvedRole = profile.role as AppRole;
          }

          if (loginEmail === 'test@church.com' || resolvedRole === 'guest') {
            resolvedRole = 'guest';
          }

          const appUser: AppUser = {
            id: data.user.id,
            email: data.user.email || loginEmail,
            name: profile?.name || data.user.user_metadata?.name || '성도',
            role: resolvedRole,
            phone: profile?.phone || data.user.user_metadata?.phone || ''
          };

          onStart(appUser);
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

        const trimmedEmail = email.trim();

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { name: name.trim(), phone: phone.trim() }
          }
        });

        if (error) {
          console.log("- Supabase URL:", (import.meta as any).env.VITE_SUPABASE_URL);
          console.log("- URL 존재 여부:", !!(import.meta as any).env.VITE_SUPABASE_URL);
          console.log("- KEY 존재 여부:", !!(import.meta as any).env.VITE_SUPABASE_ANON_KEY);
          console.log("- createClient 생성 여부:", !!supabase);
          console.log("- 실제 Supabase 응답:", { error, data });

          setErrorMsg(getKoreanErrorMessage(error.message));
        } else if (data?.user) {
          const role: AppRole = 'member';

          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: trimmedEmail,
              name: name.trim(),
              phone: phone.trim(),
              role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          } catch (profileErr) {
            console.error("Profile upsert during sign up failed:", profileErr);
          }

          onStart({
            id: data.user.id,
            email: trimmedEmail,
            name: name.trim(),
            role,
            phone: phone.trim()
          });
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
                {/* 회원가입 없이 둘러보기 안내 배너 */}
                <div className="bg-[#8A9A5B]/10 border border-[#8A9A5B]/20 rounded-2xl p-4.5 space-y-3.5 animate-fadeIn">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-[#5A5A40] flex items-center gap-1.5">
                      ✨ 회원가입 없이 둘러보기
                    </h4>
                    <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                      로그인 없이도 말씀 암송, 설교노트 등 주요 기능을 체험해 보실 수 있습니다.
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-[#8A9A5B]/15 space-y-2.5">
                    <p className="text-[10.5px] text-[#5A5A40] font-bold leading-relaxed text-center font-serif bg-white/70 py-2.5 px-3 rounded-xl border border-[#8A9A5B]/10" style={{ wordBreak: 'keep-all' }}>
                      "말씀은 누구에게나 열려 있습니다.<br />
                      먼저 둘러보시고, 마음에 드신다면 회원가입을 통해 말씀 암송과 신앙의 발자취를 이어가 보세요."
                    </p>

                    <button
                      type="button"
                      onClick={handleStartGuest}
                      className="w-full py-3 bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-serif tracking-wide"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse fill-yellow-300/20" />
                      게스트 모드로 둘러보기
                    </button>

                    <p className="text-[10px] text-stone-500 leading-normal font-medium bg-stone-50 p-2.5 rounded-lg border border-stone-200/50" style={{ wordBreak: 'keep-all' }}>
                      ※ 게스트 모드에서는 작성한 내용이 저장되지 않으며, 새로고침 또는 로그아웃 시 모두 삭제됩니다. 꾸준한 말씀 생활과 신앙 성장 기록을 위해 회원가입 후 이용해 주세요.
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
                
                if (!supabase) {
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
