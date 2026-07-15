import React, { useState, useEffect } from 'react';
import { User, Phone, Lock, Camera, Check, AlertCircle, Save, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const AVATAR_PRESETS = [
  { id: 'cross', name: '십자가 ⛪', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'bible', name: '성경책 📖', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'dove', name: '비둘기 🕊️', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { id: 'olive', name: '올리브 🌿', color: 'bg-[#EAF2D7] text-[#8A9A5B] border-[#D1E2A4]' },
  { id: 'light', name: '은혜의 빛 ☀️', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { id: 'heart', name: '사랑의 마음 ❤️', color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'shepherd', name: '선한 목자 🐑', color: 'bg-stone-100 text-stone-700 border-stone-200' },
  { id: 'wheat', name: '생명의 빵 🌾', color: 'bg-amber-50 text-amber-600 border-amber-200' }
];

export default function MyPagePanel() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  
  // Profile Photo State
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(() => {
    return localStorage.getItem(`manna_avatar_${user?.id}`) || 'olive';
  });
  const [customPhotoBase64, setCustomPhotoBase64] = useState<string | null>(() => {
    return localStorage.getItem(`manna_custom_photo_${user?.id}`) || null;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize state when user loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleAvatarSelect = (id: string) => {
    setSelectedAvatarId(id);
    setCustomPhotoBase64(null);
    localStorage.setItem(`manna_avatar_${user?.id}`, id);
    localStorage.removeItem(`manna_custom_photo_${user?.id}`);
    
    // Dispatch a storage event to update other components immediately
    window.dispatchEvent(new Event('storage'));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setErrorMessage('이미지 파일 크기가 너무 큽니다. 1.5MB 이하의 파일을 선택해 주세요.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomPhotoBase64(base64String);
        localStorage.setItem(`manna_custom_photo_${user?.id}`, base64String);
        localStorage.setItem(`manna_avatar_${user?.id}`, 'custom');
        setSelectedAvatarId('custom');
        
        // Dispatch event for instant header update
        window.dispatchEvent(new Event('storage'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('성도 성함을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('연락처 휴대전화 번호를 입력해 주세요.');
      return;
    }

    // Password validation if provided
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        setErrorMessage('비밀번호는 최소 6자리 이상이어야 합니다.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    }

    let targetRole: any = undefined;
    if (adminCode.trim()) {
      if (adminCode.trim() === '1004' || adminCode.trim() === 'hakjang1004') {
        targetRole = 'pastor';
      } else {
        setErrorMessage('입력하신 직분자 코드가 올바르지 않습니다.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const result = await updateProfile(
        name.trim(),
        phone.trim(),
        newPassword.trim() ? newPassword.trim() : undefined,
        targetRole
      );

      if (result.success) {
        setSuccessMessage(targetRole ? '축하합니다! 담임목사님 직분으로 성공적으로 등극되었습니다! ⛪✨' : '회원 정보가 성공적으로 수정되었습니다! ✨');
        setNewPassword('');
        setConfirmPassword('');
        setAdminCode('');
        
        // Clear message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(result.message || '정보 수정 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '프로필 수정 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Find chosen avatar style
  const currentPreset = AVATAR_PRESETS.find(a => a.id === selectedAvatarId) || AVATAR_PRESETS[3];

  return (
    <div className="space-y-6 font-sans max-w-2xl mx-auto" id="mypage-panel-container">
      
      {/* HEADER BANNER */}
      <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6" id="mypage-header-box">
        {/* Profile Avatar Frame */}
        <div className="relative group shrink-0" id="avatar-frame">
          {customPhotoBase64 ? (
            <img 
              src={customPhotoBase64} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover border-4 border-[#8A9A5B]/30 shadow-md referrerPolicy='no-referrer'" 
            />
          ) : (
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl border-4 border-dashed border-[#8A9A5B]/20 shadow-md ${currentPreset.color}`}>
              {currentPreset.name.split(' ').pop()}
            </div>
          )}

          <label className="absolute bottom-0 right-0 bg-[#5A5A40] text-white p-2 rounded-full cursor-pointer hover:bg-[#4A4A30] shadow-sm transition">
            <Camera className="w-4 h-4" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
          </label>
        </div>

        {/* Welcome message */}
        <div className="text-center sm:text-left space-y-1">
          <span className="bg-[#EAF2D7] text-[#8A9A5B] border border-[#D1E2A4] px-3 py-0.5 rounded-full text-[10px] font-black uppercase">
            {user?.role === 'master' ? '마스터' :
             user?.role === 'pastor' ? '담임목사님' :
             user?.role === 'admin' ? '관리자' : '학장교회 성도님'}
          </span>
          <h2 className="text-xl font-serif font-extrabold text-[#5A5A40] flex items-baseline justify-center sm:justify-start gap-1">
            <span>{name || '성도'}</span>
            <span className="text-xs text-[#7A7A6A] font-normal">님의 마이페이지</span>
          </h2>
          <p className="text-xs text-[#A0A090] leading-relaxed">
            학장교회 말씀 암송과 양육 관리를 위한 개인 프로필 및 회원 정보를 수정하실 수 있습니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* PROFILE PICTURE SELECTOR (5 COLS) */}
        <div className="md:col-span-5 bg-white border border-[#E9E3D8] rounded-[24px] p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#8A9A5B]" />
              프로필 캐릭터 선택
            </h3>
            <p className="text-[10px] text-[#A0A090] mt-0.5">원하시는 영성 아이콘을 선택해 보세요.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {AVATAR_PRESETS.map((avatar) => {
              const isSelected = selectedAvatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`p-3 rounded-2xl border text-center text-xs transition cursor-pointer relative font-bold ${
                    isSelected 
                      ? 'border-[#8A9A5B] bg-[#EAF2D7]/50 text-[#5A5A40] font-extrabold ring-1 ring-[#8A9A5B]/30' 
                      : 'border-stone-100 hover:border-stone-200 text-[#7A7A6A]'
                  } ${avatar.color}`}
                >
                  <div className="text-lg mb-1">{avatar.name.split(' ').pop()}</div>
                  <div className="text-[10px] truncate">{avatar.name.split(' ')[0]}</div>
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#8A9A5B] rounded-full flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ACCOUNT EDIT FORM (7 COLS) */}
        <div className="md:col-span-7 bg-white border border-[#E9E3D8] rounded-[24px] p-5 sm:p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#8A9A5B]" />
                인적사항 수정 및 비밀번호 관리
              </h3>
              <p className="text-[10px] text-[#A0A090] mt-0.5">성함, 연락처 및 새로운 비밀번호를 설정할 수 있습니다.</p>
            </div>

            <hr className="border-stone-100" />

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7A7A6A] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#A0A090]" />
                성도 성함
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="성함을 입력해 주세요"
                className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-semibold"
              />
            </div>

            {/* Phone Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7A7A6A] flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#A0A090]" />
                연락처 (휴대전화)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-semibold"
              />
            </div>

            <hr className="border-stone-100 my-4" />

            <div className="bg-[#F9F7F2] p-3 rounded-2xl border border-[#E9E3D8] space-y-3">
              <h4 className="text-[11px] font-bold text-[#5A5A40] flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#8A9A5B]" />
                비밀번호 변경 <span className="text-stone-400 font-normal">(변경할 경우에만 입력하세요)</span>
              </h4>

              {/* Password Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7A7A6A]">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="최소 6자리 이상"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7A7A6A]">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-[#E9E3D8] space-y-2 mt-2">
              <h4 className="text-[11px] font-bold text-[#5A5A40] flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#8A9A5B]" />
                직분자(목회자) 및 관리자 인증
              </h4>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#7A7A6A]">인증 비밀코드 <span className="text-stone-400 font-normal">(목회자 또는 관리자 권한을 획득하려면 비밀번호를 입력하세요)</span></label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="인증 비밀코드 입력"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-semibold"
                />
              </div>
            </div>

            {/* Error & Success States */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex gap-1.5 items-start font-semibold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex gap-1.5 items-center font-bold"
                >
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 bg-[#5A5A40] hover:bg-[#4A4A30] disabled:bg-stone-300 text-white font-extrabold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>수정 내역 저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>수정 내용 저장하기 ✨</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
