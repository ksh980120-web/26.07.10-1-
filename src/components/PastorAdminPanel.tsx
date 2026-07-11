import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, ArrowUpDown, Search, Award, Plus, Trash2, FileSpreadsheet, Check, RefreshCw, Lock } from 'lucide-react';
import { SaintProgress } from '../types';
import { fetchSaintsProgressFromDb, saveSaintProgressToDb, deleteSaintFromDb, isSupabaseConfigured } from '../lib/supabase';

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

  // Load saints progress from Supabase / localStorage based on configuration
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
  }, [currentUserRole]);

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
    // Sync back
    const local = localStorage.getItem('manna_saints');
    const localSaints = local ? JSON.parse(local) : [];
    localStorage.setItem('manna_saints', JSON.stringify([newSaint, ...localSaints]));
  };

  // Delete saint
  const handleDeleteSaint = async (id: string) => {
    setSaints(prev => prev.filter(s => s.id !== id));
    triggerSaveAlert();

    await deleteSaintFromDb(id);
    const local = localStorage.getItem('manna_saints');
    if (local) {
      const updated = JSON.parse(local).filter((s: any) => s.id !== id);
      localStorage.setItem('manna_saints', JSON.stringify(updated));
    }
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

    // Save to local storage sync
    localStorage.setItem('manna_saints', JSON.stringify(updatedSaints));
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

      {/* Suggestion on Managing Saints (목양 팁) */}
      <div className="bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl p-4 space-y-2.5">
        <h4 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
          💡 학장교회 성도 말씀 양육 및 효과적인 관리 안내
        </h4>
        <ul className="text-[11px] text-[#7A7A6A] leading-relaxed space-y-1.5 pl-1">
          <li className="flex items-start gap-1">
            <span className="text-[#8A9A5B] font-bold">1.</span>
            <span><strong>자동 로컬 저장:</strong> 등록한 성도 정보는 사용하시는 브라우저 데이터(localStorage)에 안전하게 실시간 저장되므로 안심하셔도 됩니다.</span>
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
                      <p className="font-bold text-[#7A7A6A]">등록된 성도가 없습니다.</p>
                      <p className="text-[11px]">위 입력창에 성도명을 기입하고 "성도 등록" 버튼을 눌러 양육을 시작해 보세요!</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredSaints.map((saint) => (
                <tr key={saint.id} className="hover:bg-[#F9F7F2]/30 transition-colors">
                  <td className="py-3 px-3 font-extrabold text-[#5A5A40] whitespace-nowrap">{saint.name}</td>
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

    </div>
  );
}
