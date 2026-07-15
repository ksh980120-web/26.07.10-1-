import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, ArrowUpDown, Search, Award, Plus, Trash2, FileSpreadsheet, Check, RefreshCw, Lock, Inbox, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { SaintProgress, VerseSubmission } from '../types';
import { fetchSaintsProgressFromDb, saveSaintProgressToDb, deleteSaintFromDb, fetchSubmissions, updateSubmissionStatus, supabase } from '../lib/supabase';

interface PastorAdminPanelProps {
  totalVersesCount: number;
  currentUserRole?: string;
  onClose?: () => void;
}

export default function PastorAdminPanel({ totalVersesCount, currentUserRole = 'pastor', onClose }: PastorAdminPanelProps) {
  const [saints, setSaints] = useState<SaintProgress[]>([]);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'achievementRate' | 'lastActivity'>('achievementRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sub-tabs for Pastor Office: 'saints' (Saints progress) or 'submissions' (Weekly verse submissions)
  const [activePanelTab, setActivePanelTab] = useState<'saints' | 'submissions'>('submissions');

  // Submissions states
  const [submissions, setSubmissions] = useState<VerseSubmission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [submittingActionId, setSubmittingActionId] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [subTypeFilter, setSubTypeFilter] = useState<'all' | 'memorize' | 'reading'>('all');

  // Load submissions list
  const loadSubmissionsList = async () => {
    setSubsLoading(true);
    try {
      const data = await fetchSubmissions();
      setSubmissions(data);
    } catch (e) {
      console.error('Error loading submissions:', e);
    } finally {
      setSubsLoading(false);
    }
  };

  // Load saints progress from Supabase based on configuration
  const loadSaints = async () => {
    if (currentUserRole === 'admin') return;
    setIsLoading(true);
    try {
      const data = await fetchSaintsProgressFromDb(currentUserRole as any);
      setSaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaints();
    loadSubmissionsList();

    // Setup Realtime listener for submissions table
    if (supabase) {
      const channel = supabase
        .channel('realtime-submissions-pastor')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'submissions' },
          (payload) => {
            console.log('Realtime submissions update received in Pastor panel:', payload);
            loadSubmissionsList();
            loadSaints();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserRole]);

  // Handle submissions status change
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setSubmittingActionId(id);
    try {
      const currentUserId = sessionStorage.getItem('hagah_user_id') || '';
      const success = await updateSubmissionStatus(id, status, currentUserId);
      if (success) {
        await loadSubmissionsList();
        await loadSaints();
      } else {
        alert('상태 업데이트에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setSubmittingActionId(null);
    }
  };

  // Add new saint
  const handleAddSaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newId = `saint-${Date.now()}`;
    const newSaint: SaintProgress = {
      id: newId,
      name: newName.trim(),
      completedCount: 0,
      totalCount: totalVersesCount || 12,
      achievementRate: 0,
      lastActivity: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\. /g, '.').slice(0, -1) // Format: YYYY.MM.DD
    };

    setSaints(prev => [newSaint, ...prev]);
    setNewName('');
    triggerSaveAlert();

    // Save to DB / Storage
    await saveSaintProgressToDb(newSaint);
  };

  // Delete saint
  const handleDeleteSaint = async (id: string) => {
    setSaints(prev => prev.filter(s => s.id !== id));
    triggerSaveAlert();

    await deleteSaintFromDb(id);
  };

  // Adjust completed count (Manual Input for Text/SMS)
  const handleAdjustCount = async (id: string, delta: number) => {
    const updatedSaints = saints.map(s => {
      if (s.id !== id) return s;
      const nextTotal = totalVersesCount || s.totalCount || 12;
      const nextCount = Math.max(0, Math.min(nextTotal, s.completedCount + delta));
      const nextSaint = {
        ...s,
        completedCount: nextCount,
        totalCount: nextTotal,
        achievementRate: nextTotal > 0 ? (nextCount / nextTotal) * 100 : 0,
        lastActivity: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\. /g, '.').slice(0, -1)
      };

      // Async write to db
      saveSaintProgressToDb(nextSaint);

      return nextSaint;
    });

    setSaints(updatedSaints);
    triggerSaveAlert();
  };

  const triggerSaveAlert = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Export to Excel (CSV format supporting Korean and MS Excel encoding)
  const handleExportToExcel = () => {
    if (saints.length === 0) {
      alert("내보낼 성도 데이터가 없습니다. 먼저 성도명을 등록해 주세요.");
      return;
    }

    const headers = ['성도명', '암송 완료 구절수', '총 등록 구절수', '성취율(%)', '최근 훈련일'];
    const rows = saints.map(s => [
      s.name,
      s.completedCount,
      s.totalCount,
      `${Math.round(s.achievementRate)}%`,
      s.lastActivity
    ]);

    // Add UTF-8 BOM to ensure Korean text loads correctly in Excel
    const csvContent = "\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `학장교회_만나_성도_암송현황_${new Date().toLocaleDateString('ko-KR').replace(/ /g, '').replace(/\./g, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sorting
  const handleSort = (key: 'name' | 'achievementRate' | 'lastActivity') => {
    const nextOrder = sortKey === key && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortKey(key);
    setSortOrder(nextOrder);

    const sorted = [...saints].sort((a, b) => {
      if (key === 'achievementRate') {
        return nextOrder === 'desc' ? b.achievementRate - a.achievementRate : a.achievementRate - b.achievementRate;
      }
      return nextOrder === 'desc' ? b[key].localeCompare(a[key]) : a[key].localeCompare(b[key]);
    });
    setSaints(sorted);
  };

  const filteredSaints = saints.filter(s => s.name.includes(searchQuery));

  if (currentUserRole === 'admin') {
    return (
      <div className="bg-white rounded-[28px] p-8 border border-rose-100 space-y-6 shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-serif font-bold text-[#5A5A40]">조회 권한 제한됨 🔒</h3>
          <p className="text-xs text-[#7A7A6A] max-w-md mx-auto leading-relaxed">
            성도들의 개인 학습 기록과 양육 점검표는 <strong>담임목사(Pastor) 및 마스터(Master)</strong> 권한 전용 데이터입니다. <br />
            일반 콘텐츠 관리자(Admin) 계정은 이 정보를 열람하실 수 없습니다.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] border border-[#E9E3D8] rounded-xl text-xs font-bold transition cursor-pointer mx-auto"
          >
            뒤로 가기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] p-6 border border-[#E9E3D8] space-y-6 shadow-sm font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E9E3D8] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#8A9A5B] p-2 rounded-xl text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#5A5A40]">성도 학업 성과 및 양육 관리</h3>
            <p className="text-xs text-[#7A7A6A]">성도님들을 등록하고 말씀 암송 성취도를 효과적으로 보듬어주세요.</p>
          </div>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1D7830] hover:bg-[#155A23] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>엑셀 파일로 내보내기</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] border border-[#E9E3D8] rounded-xl text-xs font-bold transition cursor-pointer"
            >
              메인 화면 보기 ✕
            </button>
          )}
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-[#E9E3D8] gap-4">
        <button
          onClick={() => setActivePanelTab('submissions')}
          className={`pb-2.5 text-xs font-extrabold transition-all relative flex items-center gap-1.5 cursor-pointer ${
            activePanelTab === 'submissions' ? 'text-[#8A9A5B]' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>성도 제출 현황 조회</span>
          {submissions.length > 0 && (
            <span className="bg-[#8A9A5B] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {submissions.length}
            </span>
          )}
          {activePanelTab === 'submissions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A9A5B] rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActivePanelTab('saints')}
          className={`pb-2.5 text-xs font-extrabold transition-all relative flex items-center gap-1.5 cursor-pointer ${
            activePanelTab === 'saints' ? 'text-[#8A9A5B]' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>성도 양육 현황</span>
          {activePanelTab === 'saints' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A9A5B] rounded-full"></div>
          )}
        </button>
      </div>

      {activePanelTab === 'submissions' ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 bg-[#FDFBF7] p-4 rounded-2xl border border-stone-200/50">
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">처리 상태:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSubFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold border transition cursor-pointer ${
                        subFilter === filter 
                          ? 'bg-[#8A9A5B] text-white border-[#8A9A5B]' 
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {filter === 'pending' && `대기 중 ⏳ (${submissions.filter(s => s.status === 'pending').length})`}
                      {filter === 'approved' && `승인 완료 ✨ (${submissions.filter(s => s.status === 'approved').length})`}
                      {filter === 'rejected' && `반려됨 ❌ (${submissions.filter(s => s.status === 'rejected').length})`}
                      {filter === 'all' && `전체 📦 (${submissions.length})`}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={loadSubmissionsList}
                disabled={subsLoading}
                className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-[10.5px] font-bold text-stone-600 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${subsLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-600">양육 분류:</span>
              <div className="flex gap-1.5">
                {(['all', 'memorize', 'reading'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSubTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black border transition cursor-pointer ${
                      subTypeFilter === type
                        ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                        : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {type === 'all' && '전체 보기 📦'}
                    {type === 'memorize' && '말씀 암송 📖'}
                    {type === 'reading' && '성경 읽기 ⛪'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {subsLoading && submissions.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <span className="w-6 h-6 border-2 border-[#8A9A5B] border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
              <p className="text-xs font-semibold">제출 목록을 불러오는 중입니다...</p>
            </div>
          ) : (() => {
            const filteredSubs = submissions.filter(s => {
              // Filter by status
              if (subFilter !== 'all' && s.status !== subFilter) return false;
              
              // Filter by type
              if (subTypeFilter === 'memorize') {
                return s.correctText !== 'bible_reading';
              }
              if (subTypeFilter === 'reading') {
                return s.correctText === 'bible_reading';
              }
              return true;
            });
            
            if (filteredSubs.length === 0) {
              return (
                <div className="py-12 text-center border border-[#E9E3D8] rounded-2xl bg-[#FDFBF7]">
                  <Inbox className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#A0A090]">조회 기준에 해당하는 제출 건이 없습니다.</p>
                </div>
              );
            }

            return (
              <div className="space-y-4" id="pastor-submission-list">
                {filteredSubs.map((sub) => {
                  const isBibleReading = sub.correctText === 'bible_reading';
                  const isPending = sub.status === 'pending';

                  return (
                    <div key={sub.id} className="p-5 bg-white border border-[#E9E3D8] hover:border-[#8A9A5B]/40 rounded-2xl shadow-2xs space-y-4 transition duration-150">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#5A5A40] bg-[#EAF2D7] px-2.5 py-1 rounded-full border border-[#D1E2A4]">
                            {sub.profileName || '이름 없음'} 성도
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('ko-KR') : '-'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {sub.status === 'approved' ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                              승인 완료 ✨
                            </span>
                          ) : sub.status === 'rejected' ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                              반려됨 ❌
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                              승인 대기 ⏳
                            </span>
                          )}

                          <span className={`text-[9.5px] font-black px-2.5 py-0.5 rounded-full border ${
                            isBibleReading 
                              ? 'bg-sky-50 text-sky-700 border-sky-100' 
                              : 'bg-purple-50 text-purple-700 border-purple-100'
                          }`}>
                            {isBibleReading ? '성경 읽기 보고' : '말씀 암송 시험'}
                          </span>
                        </div>
                      </div>

                      {/* Content Box */}
                      {isBibleReading ? (
                        <div className="p-4 bg-stone-50 rounded-2xl space-y-2 border border-stone-100">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-700">
                            <span>📖</span>
                            <span>{sub.verseReference || sub.reference}</span>
                          </div>
                          
                          {sub.userText && (
                            <div className="pl-4 border-l-2 border-[#8A9A5B]/30">
                              <p className="text-xs font-serif text-stone-600 leading-relaxed italic">
                                "{sub.userText}"
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-stone-50 rounded-2xl space-y-3.5 border border-stone-100">
                          {/* Verse info */}
                          <div className="flex justify-between items-center text-xs font-extrabold text-stone-700">
                            <div className="flex items-center gap-1.5">
                              <span>📖</span>
                              <span>{sub.verseReference || '금주 암송성구'}</span>
                            </div>
                            
                            {sub.score !== undefined && (
                              <span className="text-[10px] bg-white border border-stone-200 px-2 py-0.5 rounded-md text-purple-700 font-mono">
                                점수: {sub.score}점 • {sub.mode === 'full_write' ? '직접 쓰기' : sub.mode === 'blank_fill' ? '빈칸 채우기' : '따라 읽기'}
                              </span>
                            )}
                          </div>

                          {/* Correct Answer */}
                          <div className="space-y-1">
                            <span className="text-[9.5px] font-black text-stone-400 block uppercase tracking-wider">정답 암송 구절:</span>
                            <p className="text-xs font-serif text-stone-500 pl-2 border-l-2 border-stone-200">
                              "{sub.verseText || '불러오는 중...'}"
                            </p>
                          </div>

                          {/* Saint's text */}
                          {sub.userText && (
                            <div className="space-y-1 pt-1 border-t border-dashed border-stone-200">
                              <span className="text-[9.5px] font-black text-[#8A9A5B] block uppercase tracking-wider">성도 암송 답안:</span>
                              <p className="text-xs font-serif text-stone-700 font-semibold pl-2 border-l-2 border-[#8A9A5B]">
                                "{sub.userText}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons for Pending submissions */}
                      {isPending && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-stone-50" id="pastor-action-buttons">
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                            disabled={submittingActionId === sub.id}
                            className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                          >
                            반려하기 ❌
                          </button>
                          
                          <button
                            onClick={() => handleUpdateStatus(sub.id, 'approved')}
                            disabled={submittingActionId === sub.id}
                            className="px-5 py-2 bg-[#8A9A5B] hover:bg-[#708238] text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-2xs disabled:opacity-50 flex items-center gap-1"
                          >
                            {submittingActionId === sub.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <span>승인 완료 ✨</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* SAINTS PROGRESS MANAGEMENT VIEW */
        <>
          {/* Suggestion on Managing Saints (목양 팁) */}
          <div className="bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
              💡 학장교회 성도 말씀 양육 및 효과적인 관리 안내
            </h4>
            <ul className="text-[11px] text-[#7A7A6A] leading-relaxed space-y-1.5 pl-1">
              <li className="flex items-start gap-1">
                <span className="text-[#8A9A5B] font-bold">1.</span>
                <span><strong>실시간 클라우드 저장:</strong> 등록한 성도 정보는 Supabase 데이터베이스에 안전하게 실시간 저장되므로 안심하셔도 됩니다.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-[#8A9A5B] font-bold">2.</span>
                <span><strong>성과 기록 및 격려:</strong> 매주 구역/셀 모임 시 성도님이 입으로 직접 고백한 성취 수량을 <strong>[+] 버튼</strong>으로 간편히 업데이트해 주시고, 100% 도달 시 격려 전송 카톡을 보내 보십시오.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-[#8A9A5B] font-bold">3.</span>
                <span><strong>주간 백업 권장:</strong> <strong>'엑셀 파일로 내보내기'</strong>를 클릭하여 전체 기록을 정기적으로 백업하거나, 교회 교보 인쇄에 자유롭게 활용할 수 있습니다.</span>
              </li>
            </ul>
          </div>

          {/* Register New Saint & Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Register Form */}
            <form onSubmit={handleAddSaint} className="flex gap-2">
              <input 
                type="text"
                placeholder="새로 등록할 성도명 입력..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 text-xs px-3 py-3 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-[#5A5A40] hover:bg-[#4A4A30] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>성도 등록</span>
              </button>
            </form>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#A0A090] absolute left-3.5 top-3.5" />
              <input 
                type="text"
                placeholder="성도 이름 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
              />
            </div>
          </div>

          {/* Auto Saved Status Indicator */}
          {saveSuccess && (
            <div className="text-[10px] text-[#8A9A5B] font-bold flex items-center gap-1 transition-all">
              <Check className="w-3.5 h-3.5" />
              <span>성도 목록이 안전하게 자동 저장되었습니다.</span>
            </div>
          )}

          {/* Saints Scoreboard Table */}
          <div className="overflow-x-auto border border-[#E9E3D8] rounded-2xl bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F7F2] border-b border-[#E9E3D8] text-[#5A5A40] font-extrabold">
                  <th className="py-3 px-3 cursor-pointer hover:bg-stone-100 transition whitespace-nowrap" onClick={() => handleSort('name')}>
                    성도명 <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-stone-400" />
                  </th>
                  <th className="py-3 px-3 text-center whitespace-nowrap" style={{ width: '130px' }}>암송 진도</th>
                  <th className="py-3 px-3 cursor-pointer hover:bg-stone-100 transition whitespace-nowrap" onClick={() => handleSort('achievementRate')}>
                    성취율 <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-stone-400" />
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:bg-stone-100 transition whitespace-nowrap" onClick={() => handleSort('lastActivity')}>
                    최근 훈련일 <ArrowUpDown className="w-3 h-3 inline ml-0.5 text-stone-400" />
                  </th>
                  <th className="py-3 px-3 text-right whitespace-nowrap" style={{ width: '60px' }}>관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-[#4A4A4A]">
                {filteredSaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#A0A090] leading-relaxed">
                      {searchQuery ? '검색된 성도님이 없습니다.' : (
                        <div className="space-y-1">
                          <p className="font-bold text-[#7A7A6A]">등록된 내용이 없습니다.</p>
                          <p className="text-[11px]">위 입력창에 성도명을 기입하고 "성도 등록" 버튼을 눌러 양육을 시작해 보세요!</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSaints.map((saint) => (
                    <tr key={saint.id} className="hover:bg-[#F9F7F2]/30 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-extrabold text-[#5A5A40]">{saint.name}</div>
                        <div className="flex items-center gap-1 mt-1 text-[9px]">
                          <span className="px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded font-semibold">
                            학습전 {saint.notStartedCount ?? 0}
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-semibold border border-amber-100/50">
                            암송중 {saint.memorizingCount ?? 0}
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-semibold border border-emerald-100/50">
                            완료 {saint.completedCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustCount(saint.id, -1)}
                            className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 font-extrabold flex items-center justify-center text-xs transition cursor-pointer"
                            title="1구절 차감"
                          >
                            -
                          </button>
                          <span className="font-mono text-[11px] font-bold text-stone-700 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded min-w-[50px] text-center">
                            {saint.completedCount} / {totalVersesCount || saint.totalCount || 12}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustCount(saint.id, 1)}
                            className="w-5 h-5 rounded bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] font-extrabold flex items-center justify-center text-xs transition cursor-pointer"
                            title="1구절 추가"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-sans font-bold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/50">
                            <div 
                              className="bg-[#8A9A5B] h-full rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(100, Math.max(0, saint.achievementRate))}%` }}
                            ></div>
                          </div>
                          <span className={`text-[11px] ${saint.achievementRate >= 100 ? 'text-[#8A9A5B] font-black' : 'text-stone-700'}`}>
                            {Math.round(saint.achievementRate)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-500 font-mono text-[11px] whitespace-nowrap">{saint.lastActivity}</td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteSaint(saint.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="성도 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
