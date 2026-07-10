import React, { useState } from 'react';
import { BookMarked, ShieldCheck, UserPlus, LogIn, Sparkles, X } from 'lucide-react';

interface MainLandingProps {
  onStart: (role: 'user' | 'pastor' | 'manager', userName?: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 목사님 계정 로그인 판별 규칙 (기본 pastor1234, 백업용 hakjang1004)
    const savedPastorPw = localStorage.getItem('hagah_pastor_password') || 'pastor1234';
    if ((email === 'pastor' || email === 'pastor@church.com') && (password === savedPastorPw || password === 'hakjang1004')) {
      onStart('pastor', '류정현 (학장교회 담임목사님)');
      return;
    }

    // 관리자 계정 로그인 판별 규칙 (기본 admin1234, 백업용 hakjang1004)
    const savedManagerPw = localStorage.getItem('hagah_manager_password') || 'admin1234';
    if ((email === 'admin' || email === 'admin@church.com' || email === 'manager' || email === 'manager@church.com') && (password === savedManagerPw || password === 'hakjang1004')) {
      onStart('manager', '교회 관리자');
      return;
    }

    if (isLogin) {
      // Default testing credentials support
      if ((email === 'test@church.com' || email === 'test') && password === 'test1234') {
        onStart('user', '테스트성도');
        return;
      }

      const dbRaw = localStorage.getItem('manna_users_db');
      const users = dbRaw ? JSON.parse(dbRaw) : [];
      const foundUser = users.find((u: any) => (u.email === email || u.username === email) && u.password === password);

      if (foundUser) {
        onStart('user', foundUser.name);
      } else {
        setErrorMsg('가입되지 않은 아이디(이메일)이거나 비밀번호가 올바르지 않습니다. (체험은 아이디: test / 비밀번호: test1234 로 가능합니다)');
      }
    } else {
      // 회원가입할 때 이름과 전화번호는 꼭 넣도록 세팅
      if (!name.trim()) {
        setErrorMsg('성도 성함을 반드시 입력해 주세요.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('휴대전화 번호를 반드시 입력해 주세요.');
        return;
      }

      const dbRaw = localStorage.getItem('manna_users_db');
      const users = dbRaw ? JSON.parse(dbRaw) : [];
      const exists = users.some((u: any) => (u.email === email || u.username === email));

      if (exists) {
        setErrorMsg('이미 존재하는 아이디입니다.');
        return;
      }

      // 새 성도 등록
      const newUser = { email, username: email, password, name, phone, role: 'user' };
      users.push(newUser);
      localStorage.setItem('manna_users_db', JSON.stringify(users));

      // 또한 성도관리 목록(manna_saints)에 자동 연동 추가
      const saintsRaw = localStorage.getItem('manna_saints');
      const saints = saintsRaw ? JSON.parse(saintsRaw) : [];
      if (!saints.some((s: any) => s.name === name)) {
        saints.push({
          id: `saint-${Date.now()}`,
          name: name.trim(),
          completedCount: 0,
          totalCount: 12,
          achievementRate: 0,
          lastActivity: new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\. /g, '.').slice(0, -1)
        });
        localStorage.setItem('manna_saints', JSON.stringify(saints));
      }

      onStart('user', name);
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

          <div className="border-t border-[#E9E3D8] pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs font-bold tracking-wider text-[#7A7A6A] leading-relaxed font-serif text-center sm:text-left">
              "오직 말씀중심, 은혜중심으로 일어서는 학장교회"
            </p>
            <span className="text-[10px] text-stone-400 font-bold shrink-0">ⓒ 학장교회</span>
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
                💡 회원가입 시 나만의 소중한 말씀 암송 진도와 신앙成長 일지가 기록되어 안전하게 보관·관리됩니다.
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

            {/* 회원가입 시 필수 입력 필드 (이름, 전화번호) */}
            {!isLogin && (
              <>
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
                </div>
              </>
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
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const nameVal = (form.elements[0] as HTMLInputElement).value.trim();
                const phoneVal = (form.elements[1] as HTMLInputElement).value.trim();
                
                const dbRaw = localStorage.getItem('manna_users_db');
                const users = dbRaw ? JSON.parse(dbRaw) : [];
                
                // Compare after stripping special chars (e.g., hiphens) to be resilient to formats
                const found = users.find((u: any) => 
                  u.name === nameVal && 
                  u.phone.replace(/[^0-9]/g, '') === phoneVal.replace(/[^0-9]/g, '')
                );
                
                if (found) {
                  setFindResult(`조회 성공! 🎉\n\n성함: ${found.name}\n아이디(이메일): ${found.email}\n비밀번호: ${found.password}\n\n위 계정 정보로 로그인해 주십시오.`);
                } else {
                  setFindResult(`등록된 성도 정보 없음 ❌\n\n입력하신 성함(${nameVal})과 연락처(${phoneVal})로 일치하는 가입 정보를 찾지 못했습니다.\n\n정확한 본명과 전화번호를 기입해 보시거나 새로 가입해 주세요.`);
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
