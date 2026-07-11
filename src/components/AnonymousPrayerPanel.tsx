import React, { useState } from 'react';
import { Heart, Search, Plus, AlertCircle, Sparkles, Filter, CheckCircle2, MessageSquare, Edit3, Save, X, Trash2, HelpCircle } from 'lucide-react';
import { AnonymousPrayer } from '../types';

interface AnonymousPrayerPanelProps {
  prayers: AnonymousPrayer[];
  onAddPrayer: (prayer: AnonymousPrayer) => void;
  onIncrementAmen: (id: string, isAdding?: boolean) => void;
  onUpdatePrayer?: (id: string, updatedFields: Partial<AnonymousPrayer>) => void;
  onTogglePrayerStatus?: (id: string) => void;
  isDemoUser?: boolean;
  currentUserId?: string;
}

const CATEGORY_MAP = {
  family: { label: '가정', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  health: { label: '건강', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  faith: { label: '신앙', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  career: { label: '학업/취업', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  others: { label: '기타', color: 'bg-stone-50 text-stone-600 border-stone-200' },
};

export default function AnonymousPrayerPanel({
  prayers = [],
  onAddPrayer,
  onIncrementAmen,
  onUpdatePrayer,
  onTogglePrayerStatus,
  isDemoUser = false,
  currentUserId,
}: AnonymousPrayerPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Prayer status sub-tab state ('praying' or 'answered')
  const [prayerSubTab, setPrayerSubTab] = useState<'praying' | 'answered'>('praying');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'family' | 'health' | 'faith' | 'career' | 'others'>('faith');
  const [newContent, setNewContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Author inline edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<'family' | 'health' | 'faith' | 'career' | 'others'>('faith');

  // Store already clicked prayer IDs in local state to prevent spamming Amen on same session
  const [votedPrayers, setVotedPrayers] = useState<string[]>([]);

  // Track owned prayers (so users can edit/complete their own prayers)
  const [myPrayerIds, setMyPrayerIds] = useState<string[]>([]);

  const handleAmenClick = (id: string) => {
    const hasAlreadyVoted = votedPrayers.includes(id);
    if (hasAlreadyVoted) {
      onIncrementAmen(id, false);
      const nextVotes = votedPrayers.filter(vId => vId !== id);
      setVotedPrayers(nextVotes);
    } else {
      onIncrementAmen(id, true);
      const nextVotes = [...votedPrayers, id];
      setVotedPrayers(nextVotes);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoUser) return;
    if (!newTitle.trim() || !newContent.trim()) return;
    if (!isAnonymous && !authorName.trim()) return;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const generatedId = `prayer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newPrayerEntry: AnonymousPrayer = {
      id: generatedId,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      date: formattedDate,
      amenCount: 0,
      status: 'praying',
      isAnonymous,
      authorName: isAnonymous ? undefined : authorName.trim(),
    };

    onAddPrayer(newPrayerEntry);

    // Save ownership locally (in memory fallback)
    const nextMyPrayers = [...myPrayerIds, generatedId];
    setMyPrayerIds(nextMyPrayers);

    setNewTitle('');
    setNewContent('');
    setAuthorName('');
    setIsAnonymous(true);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowForm(false);
    }, 1500);
  };

  // Start editing handler
  const startEditing = (p: AnonymousPrayer) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditCategory(p.category as any);
  };

  // Save edit handler
  const saveEdit = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    if (onUpdatePrayer) {
      onUpdatePrayer(editingId!, {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory,
      });
    }
    setEditingId(null);
  };

  // Filter prayers
  const filteredPrayers = prayers.filter(p => {
    // 1. Filter by praying vs answered sub-tab
    const matchesStatus = p.status === prayerSubTab;
    
    // 2. Filter by category pill
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    
    // 3. Filter by search input
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-[#8A9A5B]/10 to-transparent border border-[#8A9A5B]/20 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#8A9A5B] p-1.5 rounded-lg text-white">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <h3 className="text-sm font-bold text-[#5A5A40] uppercase tracking-wider">익명 중보기도함</h3>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[#6A6A5A] font-serif font-bold italic bg-white/50 p-2.5 rounded-lg border border-[#8A9A5B]/10 leading-relaxed">
            "진실로 다시 너희에게 이르노니 너희 중의 두 사람이 땅에서 합심하여 무엇이든지 구하면 하늘에 계신 내 아버지께서 그들을 위하여 이루게 하시리라" (마태복음 18:19)
          </p>
          <p className="text-[11.5px] text-[#7A7A6A] leading-relaxed">
            학장교회 성도님들이 한마음(합심)으로 아픔과 기도를 함께 포개는 신성한 소통 공간입니다. 
            서로의 소원을 믿음으로 읽고, <strong>[아멘 동참]</strong>을 눌러 마음의 손을 꼭 잡아주십시오.
            내가 올린 기도는 연필(수정) 버튼을 눌러 내용을 다듬거나 기적적으로 응답받았을 때 '응답 완료' 처리하여 온 성도와 승리를 나눌 수 있습니다.
          </p>
        </div>
      </div>

      {isDemoUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2.5xl p-4 sm:p-5 flex items-start gap-3.5 animate-fadeIn shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900">⚠️ 체험 계정 기능 제한 안내</h4>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              현재 <strong>체험 계정(테스트성도)</strong>으로 둘러보고 계십니다. 
              체험 계정은 누구나 같은 계정을 사용하므로, <strong>중보기도 등록 및 개별 수정/삭제/상태변경 권한이 제한</strong>되어 있습니다.
              나만의 말씀 암송 기록을 온전히 보관하고 중보기도를 자유롭게 올리시려면 <strong>로그아웃 후 본인의 이름과 번호로 개별 가입</strong>을 해 주십시오!
            </p>
          </div>
        </div>
      )}

      {/* Main Tab: Praying vs Answered Miracles */}
      <div className="bg-[#F5F5F0] p-1 rounded-2xl border border-[#E9E3D8] shadow-inner max-w-xl mx-auto flex">
        <button
          onClick={() => setPrayerSubTab('praying')}
          className={`flex-1 py-3 px-3 text-center text-xs font-serif font-extrabold transition-all rounded-xl flex items-center justify-center gap-1.5 cursor-pointer select-none ${
            prayerSubTab === 'praying' 
              ? 'bg-white text-[#5A5A40] shadow-sm' 
              : 'text-[#7A7A6A] hover:text-[#5A5A40]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${prayerSubTab === 'praying' ? 'text-[#8A9A5B] fill-[#8A9A5B]/10' : 'text-stone-400'}`} />
          <span>성도들의 기도 소원 ({prayers.filter(p => p.status === 'praying').length})</span>
        </button>
        <button
          onClick={() => setPrayerSubTab('answered')}
          className={`flex-1 py-3 px-3 text-center text-xs font-serif font-extrabold transition-all rounded-xl flex items-center justify-center gap-1.5 cursor-pointer select-none ${
            prayerSubTab === 'answered' 
              ? 'bg-amber-500 text-white shadow-sm font-black' 
              : 'text-[#7A7A6A] hover:text-amber-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>응답받은 기도의 기적 ({prayers.filter(p => p.status === 'answered').length})</span>
        </button>
      </div>

      {/* Answered Miracle Scripture Header */}
      {prayerSubTab === 'answered' && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 text-center space-y-3 shadow-2xs animate-fadeIn max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.8 rounded-full border border-amber-200 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500 animate-spin-slow" />
            <span>응답 완료의 기적 찬송방</span>
          </div>
          <p className="text-sm font-serif font-bold text-amber-900 leading-relaxed max-w-lg mx-auto whitespace-pre-line">
            "구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾아낼 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니" <br />
            <span className="text-[10.5px] text-amber-700 font-medium font-sans block mt-1">— 마태복음 7장 7절 말씀 —</span>
          </p>
          <p className="text-[11px] text-amber-950/75 leading-relaxed max-w-md mx-auto">
            주의 도우심을 기뻐하고 주님의 일하심을 함께 소리 높여 고백하는 곳입니다. 
            눈물의 기도가 기쁨의 찬양이 되게 하신 하나님의 크신 역사를 보고 동료 성도들과 소망을 굳건히 하십시오!
          </p>
        </div>
      )}

      {/* Control Row: Search & Form Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A0A090] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder={prayerSubTab === 'praying' ? "기도 제목 또는 내용 검색..." : "응답된 감사 제목 검색..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
          />
        </div>

        {/* Ask Prayer Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
            showForm 
              ? 'bg-[#E9E3D8] text-[#5A5A40] hover:bg-[#D9D3C8]' 
              : 'bg-[#8A9A5B] hover:bg-[#78884F] text-white'
          }`}
        >
          {showForm ? '닫기' : <><Plus className="w-4 h-4" /><span>기도제목 올리기</span></>}
        </button>
      </div>

      {/* New Prayer Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#FDFBF7] border border-[#E9E3D8] rounded-2xl p-5 space-y-4 shadow-xs animate-fadeIn">
          <h4 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
            ✏️ 마음을 나누는 익명 중보기도 등록
          </h4>

          {isDemoUser && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[10.5px] font-bold leading-relaxed flex items-start gap-2">
              <span className="text-amber-600">⚠️</span>
              <div>
                <strong>체험 계정 기능 제한:</strong> 체험 계정(테스트성도)으로 접속 중이시므로 새로운 기도 등록이 제한됩니다. 다른 성도들의 기도를 읽고 <strong className="text-[#8A9A5B]">[아멘 동참]</strong>을 클릭하실 수는 있습니다. 기도를 직접 등록하시려면 로그아웃 후 개별 회원가입을 통해 성도님만의 계정을 생성하여 주십시오!
              </div>
            </div>
          )}

          {submitSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-center text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>기도제목이 온전히 접수되었습니다. 함께 온 맘으로 기도하겠습니다.</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">기도 한 줄 제목</label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    disabled={isDemoUser}
                    placeholder={isDemoUser ? "체험 계정은 입력할 수 없습니다." : "예: 편찮으신 아버님의 건강 회복을 위해 구합니다."}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">기도 분야 선택</label>
                  <select
                    value={newCategory}
                    disabled={isDemoUser}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-semibold disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
                  >
                    <option value="faith">신앙 / 영성</option>
                    <option value="health">건강 / 치유</option>
                    <option value="family">가정 / 자녀</option>
                    <option value="career">학업 / 취업 / 직장</option>
                    <option value="others">기타 소원</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F5F5F0]/60 p-3 rounded-xl border border-[#E9E3D8]">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#5A5A40] mb-1.5">작성 성함 표시 방식</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isDemoUser}
                      onClick={() => setIsAnonymous(true)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isAnonymous
                          ? 'bg-[#8A9A5B] border-[#8A9A5B] text-white'
                          : 'bg-white border-[#E9E3D8] text-[#7A7A6A] hover:bg-stone-50'
                      }`}
                    >
                      익명으로 올리기
                    </button>
                    <button
                      type="button"
                      disabled={isDemoUser}
                      onClick={() => setIsAnonymous(false)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        !isAnonymous
                          ? 'bg-[#8A9A5B] border-[#8A9A5B] text-white'
                          : 'bg-white border-[#E9E3D8] text-[#7A7A6A] hover:bg-stone-50'
                      }`}
                    >
                      실명으로 올리기
                    </button>
                  </div>
                </div>

                {!isAnonymous ? (
                  <div className="animate-fadeIn">
                    <label className="block text-[10px] font-extrabold text-[#5A5A40] mb-1.5">작성 성도 성함 (예: 홍길동 집사)</label>
                    <input
                      type="text"
                      required={!isAnonymous}
                      maxLength={15}
                      disabled={isDemoUser}
                      placeholder="성함과 직분을 적어주세요"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-bold disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed"
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-[10px] text-[#7A7A6A] bg-stone-50/50 p-2.5 rounded-lg border border-stone-200/50">
                    💡 익명 선택 시 작성자의 정보가 일절 노출되지 않으며, 안전하게 무명성도로 표기됩니다.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">상세한 기도 제목 및 나눔</label>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  disabled={isDemoUser}
                  placeholder={isDemoUser ? "체험 계정은 입력할 수 없습니다. 개별 회원가입 후 나만의 전용 계정으로 기도를 적어 주세요!" : "함께 기도를 모으고 싶은 내용을 자세히 적어보세요. (익명으로 안전하게 등록되며, 개인 식별 정보는 절대 저장되지 않습니다. 작성하신 기기는 나중에 수정 및 응답 완료를 스스로 처리할 수 있습니다.)"}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 leading-relaxed disabled:bg-stone-50 disabled:text-stone-400 disabled:placeholder-stone-300 disabled:cursor-not-allowed"
                />
              </div>

              <div className="bg-[#F5F5F0] rounded-lg p-3 flex items-start gap-2 border border-stone-200">
                <AlertCircle className="w-3.5 h-3.5 text-[#8A9A5B] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#7A7A6A] leading-relaxed">
                  <strong>안전한 익명 보장:</strong> 올리시는 기도는 개인 식별 정보 없이 고유 ID로만 보관됩니다. 
                  해당 기기를 통해서만 수정 및 응답 전환이 가능하며, 교회의 은혜로운 정체성을 해치거나 성도 비방적인 기도는 관리자(목사님)에 의해 조치될 수 있음을 안내드립니다.
                </p>
              </div>

              {isDemoUser ? (
                <div className="w-full py-3 bg-stone-200 text-stone-500 font-extrabold text-xs rounded-xl text-center border border-stone-300 cursor-not-allowed flex items-center justify-center gap-1.5 select-none">
                  🔒 체험 계정은 중보기도를 올릴 수 없습니다 (가입 필요)
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 bg-[#8A9A5B] hover:bg-[#78884F] text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer"
                >
                  중보기도함에 정성껏 올리기 🙏
                </button>
              )}
            </div>
          )}
        </form>
      )}

      {/* Category Pills Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#5A5A40] text-white'
              : 'bg-stone-100 hover:bg-stone-200 text-[#7A7A6A]'
          }`}
        >
          전체 분야 ({prayers.filter(p => p.status === prayerSubTab).length})
        </button>
        {Object.entries(CATEGORY_MAP).map(([catKey, info]) => {
          const count = prayers.filter(p => p.status === prayerSubTab && p.category === catKey).length;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition whitespace-nowrap cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-[#8A9A5B] border-[#8A9A5B] text-white'
                  : 'bg-white border-[#E9E3D8] hover:bg-stone-50 text-[#7A7A6A]'
              }`}
            >
              {info.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Prayers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPrayers.length === 0 ? (
          <div className="col-span-full py-16 bg-white border border-[#E9E3D8] rounded-3xl text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-[#A0A090] mx-auto opacity-40 animate-pulse" />
            <p className="text-xs font-bold text-[#7A7A6A]">등록된 내용이 없습니다.</p>
            <p className="text-[11px] text-[#A0A090]">
              {prayerSubTab === 'praying' ? '성도님의 마음의 소원을 첫 번째 기도로 남겨 보십시오.' : '기도 응답을 받아 하나님의 영광을 함께 높여 보세요.'}
            </p>
          </div>
        ) : (
          filteredPrayers.map((prayer) => {
            const catInfo = CATEGORY_MAP[prayer.category] || CATEGORY_MAP.others;
            const hasVoted = votedPrayers.includes(prayer.id);
            const isOwner = !isDemoUser && (myPrayerIds.includes(prayer.id) || !!(prayer.userId && prayer.userId === currentUserId));
            const isEditing = editingId === prayer.id;

            return (
              <div
                key={prayer.id}
                className={`bg-white border rounded-2.5xl p-5 space-y-3.5 shadow-2xs transition-all relative overflow-hidden flex flex-col justify-between ${
                  prayer.status === 'answered' 
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50/10 to-amber-50/5 hover:border-amber-400' 
                    : 'border-[#E9E3D8] hover:border-[#8A9A5B]/30'
                }`}
              >
                {/* Answer Badge Graphic */}
                {prayer.status === 'answered' && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9.5px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 text-amber-200 fill-amber-100" />
                    <span>기도응답 축복 🎉</span>
                  </div>
                )}

                {/* Owner Indicator Badge */}
                {isOwner && (
                  <div className="absolute top-0 left-0 bg-[#8A9A5B] text-white text-[8px] font-extrabold px-2.5 py-0.5 rounded-br-lg tracking-wider">
                    내가 쓴 글 ✏️
                  </div>
                )}

                {isEditing ? (
                  /* INLINE EDIT MODE (ONLY FOR AUTHOR) */
                  <div className="space-y-3 pt-3 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-[#8A9A5B]">내 기도제목 수정하기</span>
                      <span className="text-[10px] text-[#7A7A6A] font-mono">익명 보장</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#7A7A6A] mb-0.5">제목 (최대 40자)</label>
                        <input
                          type="text"
                          required
                          maxLength={40}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-[#7A7A6A] mb-0.5">분야</label>
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as any)}
                            className="w-full text-xs p-1.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                          >
                            <option value="faith">신앙 / 영성</option>
                            <option value="health">건강 / 치유</option>
                            <option value="family">가정 / 자녀</option>
                            <option value="career">학업 / 취업 / 직장</option>
                            <option value="others">기타 소원</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-[#7A7A6A] mb-0.5">기도 내용</label>
                        <textarea
                          required
                          rows={3}
                          maxLength={500}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-1.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] text-[10px] font-bold rounded-lg transition"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="flex-1 py-1.5 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        저장하기
                      </button>
                    </div>
                  </div>
                ) : (
                  /* REGULAR VIEW MODE */
                  <>
                    <div className="space-y-2.5">
                      {/* Top Category and Status Badge */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        {prayer.status === 'praying' && (
                          <span className="text-[10px] text-[#8A9A5B] bg-[#8A9A5B]/10 border border-[#8A9A5B]/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8A9A5B] animate-ping" />
                            <span>간절히 기도 중</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-extrabold text-[#4A4A4A] leading-normal font-serif pt-0.5 pr-20">
                        {prayer.title}
                      </h4>

                      {/* Content */}
                      <p className="text-[11.5px] text-[#6A6A5A] leading-relaxed whitespace-pre-line font-sans">
                        {prayer.content}
                      </p>
                    </div>

                    {/* Footer Actions: Date, Edit, and Amen Click */}
                    <div className="flex flex-col gap-2.5 border-t border-[#F0ECE4] pt-3.5 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#A0A090] font-mono flex items-center gap-1 flex-wrap">
                          <span>{prayer.date}</span>
                          <span>·</span>
                          {prayer.isAnonymous === false && prayer.authorName ? (
                            <span className="bg-[#8A9A5B]/10 text-[#8A9A5B] border border-[#8A9A5B]/20 px-1.5 py-0.2 rounded font-bold">
                              👤 {prayer.authorName} 성도
                            </span>
                          ) : (
                            <span className="bg-stone-100 text-stone-500 border border-stone-200 px-1.5 py-0.2 rounded font-medium">
                              무명 성도
                            </span>
                          )}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Owner buttons */}
                          {isOwner && (
                            <div className="flex items-center gap-1 border-r border-[#F0ECE4] pr-2">
                              <button
                                onClick={() => startEditing(prayer)}
                                className="p-1 text-[#7A7A6A] hover:text-[#5A5A40] bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-md transition cursor-pointer flex items-center gap-0.5 text-[9px] font-bold"
                                title="이 기도 수정하기"
                              >
                                <Edit3 className="w-3 h-3 text-[#8A9A5B]" />
                                수정
                              </button>
                              
                              {onTogglePrayerStatus && (
                                <button
                                  onClick={() => onTogglePrayerStatus(prayer.id)}
                                  className={`p-1 border rounded-md transition cursor-pointer text-[9px] font-bold flex items-center gap-0.5 ${
                                    prayer.status === 'answered'
                                      ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                      : 'bg-[#8A9A5B]/10 border-[#8A9A5B]/30 text-[#8A9A5B] hover:bg-[#8A9A5B]/20'
                                  }`}
                                  title={prayer.status === 'praying' ? '응답 완료 설정' : '다시 기도로 변경'}
                                >
                                  {prayer.status === 'praying' ? '🎉 응답 완료' : '다시 기도중'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Amen Button */}
                          <button
                            onClick={() => handleAmenClick(prayer.id)}
                            className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold transition flex items-center gap-1.5 cursor-pointer select-none ${
                              hasVoted
                                ? 'bg-[#8A9A5B] text-white border border-[#8A9A5B] shadow-2xs hover:bg-[#78884F]'
                                : 'bg-stone-50 hover:bg-[#8A9A5B]/10 text-stone-600 hover:text-[#8A9A5B] border border-stone-200'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 transition-transform ${hasVoted ? 'fill-white text-white scale-110' : ''}`} />
                            <span>{hasVoted ? '🙏 동참 완료' : '아멘 동참'}</span>
                            <span className={`font-mono px-1.5 py-0.2 rounded text-[10px] border ${
                              hasVoted
                                ? 'bg-white/20 text-white border-white/20'
                                : 'bg-white/60 text-stone-700 border-stone-100'
                            }`}>
                              {prayer.amenCount}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
