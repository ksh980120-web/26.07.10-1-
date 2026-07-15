/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Share2, FileSpreadsheet, Copy, Check, UploadCloud, X, HelpCircle, Users, Award, Printer, Trophy, RotateCcw, Calendar, TrendingUp, BookOpen, Layers, Heart, Megaphone, Mic, Shield, CheckCircle, Settings, SlidersHorizontal, Lock } from 'lucide-react';
import { Verse, GongGwa, AnonymousPrayer, Announcement, Sermon, FamilyWorship } from '../types';
import { supabase, AppRole } from '../lib/supabase';
import { authService } from '../services/authService';
import PastorAdminPanel from './PastorAdminPanel';
import ScriptureCms from './ScriptureCms';

// Helper: Calculate Quarter and Week from Date (e.g., "2026.07.12", "2026-07-12")
const calculateQuarterAndWeekFromDate = (dateStr: string): { quarter: number, week: number } | null => {
  if (!dateStr) return null;
  const parts = dateStr.split(/[./-]/).map(p => p.trim());
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dateObj = new Date(year, month - 1, day);
  const quarter = Math.floor((month - 1) / 3) + 1;
  
  // Find first day of the quarter
  const qStartMonth = (quarter - 1) * 3; // 0, 3, 6, 9
  const qStartDate = new Date(year, qStartMonth, 1);
  
  // Difference in days
  const diffMs = dateObj.getTime() - qStartDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Week is 1-indexed. Aligning to 7-day intervals.
  const week = Math.min(13, Math.max(1, Math.floor(diffDays / 7) + 1));
  return { quarter, week };
};

// Helper: Auto-generate meditation guide based on scripture reference and text
const autoGenerateMeditationGuide = (ref: string, text: string): string => {
  const textLower = text.toLowerCase();
  const refLower = ref.toLowerCase();
  
  if (refLower.includes('요한') || textLower.includes('사랑')) {
    return '우리를 향한 독생자 예수님의 크신 사랑과 십자가의 대속의 보혈';
  }
  if (textLower.includes('믿음') || textLower.includes('바라')) {
    return '보이지 않는 상황 속에서도 끝까지 소망하며 주를 바라보는 믿음';
  }
  if (textLower.includes('지혜') || textLower.includes('여호와를 경외')) {
    return '여호와를 경외하고 그분의 말씀 앞에 자기를 낮추는 참된 지혜';
  }
  if (textLower.includes('평강') || textLower.includes('평안') || textLower.includes('두려워')) {
    return '세상이 주지 못하는 영원한 평안으로 우리의 마음과 생각을 지키시는 주님';
  }
  if (textLower.includes('기도') || textLower.includes('부르짖')) {
    return '부르짖는 자의 신음을 들으시고 신실하게 응답하시는 하나님';
  }
  if (textLower.includes('인도') || textLower.includes('길') || textLower.includes('목자')) {
    return '우리의 선한 목자 되시어 쉴 만한 물가와 바른 길로 이끄시는 인도하심';
  }
  if (textLower.includes('은혜') || textLower.includes('긍휼')) {
    return '자격 없는 자에게 거저 주시는 하나님의 한없는 긍휼과 은혜';
  }
  if (textLower.includes('빛') || textLower.includes('어둠')) {
    return '세상의 어두운 그늘을 비추며 영원한 소망으로 이끄시는 참된 빛';
  }
  if (textLower.includes('십자가') || textLower.includes('그리스도') || textLower.includes('구원')) {
    return '십자가 대속의 보혈과 주 예수 그리스도의 온전하신 구원 계획';
  }
  if (textLower.includes('능력') || textLower.includes('힘') || textLower.includes('강하')) {
    return '연약한 우리를 강하게 하시고 새 힘을 공급하시는 여호와 하나님의 권능';
  }
  if (textLower.includes('말씀') || textLower.includes('계명') || textLower.includes('율법')) {
    return '우리의 발에 등이요 길에 빛이 되시며 생명을 살리는 등불 같은 말씀';
  }

  // General fallback summary based on Book name
  if (refLower.includes('창세') || refLower.includes('출애')) {
    return '우주 만물을 창조하시고 백성들을 구원하시는 살아계신 하나님의 역사';
  }
  if (refLower.includes('시편')) {
    return '모든 시련 속에서도 찬송과 기도로 오직 하나님만 의지하는 신앙의 고백';
  }
  if (refLower.includes('잠언')) {
    return '일생 동안 여호와를 기쁘시게 하고 참된 의의 길을 걷는 생활의 지혜';
  }
  if (refLower.includes('이사야') || refLower.includes('예레미야')) {
    return '죄악에서 돌이켜 영원한 구원자 되시는 여호와께 소망을 두는 약속';
  }
  if (refLower.includes('마태') || refLower.includes('마가') || refLower.includes('누가')) {
    return '이 땅에 낮고 천한 몸으로 오셔서 천국 복음을 선포하신 예수 그리스도의 행적';
  }
  if (refLower.includes('로마') || refLower.includes('갈라')) {
    return '오직 의인은 믿음으로 말미암아 살리라 하신 십자가 구원의 참된 도리';
  }

  // Smart extraction based on first few words of the verse text
  const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
  const words = cleanText.split(/\s+/);
  const snippet = words.slice(0, 3).join(' ') + '...';
  return `[${ref}] "${snippet}" 말씀을 통해 약속하시는 하나님의 한없는 축복과 신실하신 약속`;
};

interface ManagerPanelProps {
  verses: Verse[];
  onAddVerse: (verse: Omit<Verse, 'id'>) => void;
  onUpdateVerse: (id: string, updated: Partial<Verse>) => void;
  onUpdateMultipleVerses?: (ids: string[], updated: Partial<Verse>) => void;
  onDeleteVerse: (id: string) => void;
  onDeleteMultipleVerses?: (ids: string[]) => void;
  onImportVerses: (imported: Verse[]) => void;
  onResetToDefaults: () => void;
  onClose: () => void;
  pinnedVerseId?: string;
  pinnedMonthVerseId?: string;
  onPinVerse?: (id: string) => void;
  onPinMonthVerse?: (id: string) => void;
  userRole?: 'master' | 'pastor' | 'admin' | 'member' | 'guest' | 'manager';
  gongGwaLessons: GongGwa[];
  onUpdateGongGwaLessons: (lessons: GongGwa[]) => void;
  prayers: AnonymousPrayer[];
  onDeletePrayer: (id: string) => void;
  onTogglePrayerStatus: (id: string) => void;
  onUpdatePrayer?: (id: string, updatedFields: Partial<AnonymousPrayer>) => void;
  announcements?: Announcement[];
  onUpdateAnnouncement?: (id: string, updatedFields: Partial<Announcement>) => void;
  onAddAnnouncement?: (title: string, content: string, author?: string) => void;
  onDeleteAnnouncement?: (id: string) => void;
  sermons?: Sermon[];
  onUpdateSermons?: (sermons: Sermon[]) => void;
  familyWorships?: FamilyWorship[];
  onUpdateFamilyWorships?: (fw: FamilyWorship[]) => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function ManagerPanel({
  verses,
  onAddVerse,
  onUpdateVerse,
  onUpdateMultipleVerses,
  onDeleteVerse,
  onDeleteMultipleVerses,
  onImportVerses,
  onResetToDefaults,
  onClose,
  pinnedVerseId = '',
  pinnedMonthVerseId = '',
  onPinVerse,
  onPinMonthVerse,
  userRole = 'pastor',
  gongGwaLessons = [],
  onUpdateGongGwaLessons,
  prayers = [],
  onDeletePrayer,
  onTogglePrayerStatus,
  onUpdatePrayer,
  announcements = [],
  onUpdateAnnouncement,
  onAddAnnouncement,
  onDeleteAnnouncement,
  sermons = [],
  onUpdateSermons,
  familyWorships = [],
  onUpdateFamilyWorships,
  initialTab,
  onTabChange
}: ManagerPanelProps) {
  // Enforce role-based tab restriction helper
  const getAllowedTab = (tab: string, role: string): string => {
    if (role === 'admin') {
      if (tab === 'scriptures' || tab === 'gonggwa_manage') return tab;
      return 'scriptures';
    }
    if (role === 'pastor') {
      if (['scriptures', 'gonggwa_manage', 'sermons_manage', 'announcements_manage', 'prayers_manage', 'family_worship_manage', 'members_manage', 'saints'].includes(tab)) {
        return tab;
      }
      return 'scriptures';
    }
    if (['scriptures', 'gonggwa_manage', 'sermons_manage', 'announcements_manage', 'prayers_manage', 'family_worship_manage', 'members_manage', 'saints'].includes(tab)) {
      return tab;
    }
    return 'scriptures'; // master / others fallback
  };

  // Navigation / Tab state for the right column
  const [rightTab, setRightTab] = useState<string>(() => {
    const rawTab = initialTab || 'scriptures';
    return getAllowedTab(rawTab, userRole);
  });

  useEffect(() => {
    if (initialTab) {
      setRightTab(getAllowedTab(initialTab, userRole));
    }
  }, [initialTab, userRole]);

  const handleTabChange = (tab: string) => {
    const allowed = getAllowedTab(tab, userRole);
    setRightTab(allowed);
    if (onTabChange) {
      onTabChange(allowed);
    }
  };

  // Detailed Verse Input States (Add Form)
  const [newCategory, setNewCategory] = useState('믿음');
  const [newRecommendGrade, setNewRecommendGrade] = useState<number>(1);
  const [newDifficulty, setNewDifficulty] = useState<'상' | '중' | '하'>('중');
  const [newIsFavorite, setNewIsFavorite] = useState(false);
  const [newBibleBook, setNewBibleBook] = useState('요한복음');
  const [newChapter, setNewChapter] = useState('3');
  const [newVerseNum, setNewVerseNum] = useState('16');
  const [newOrderNum, setNewOrderNum] = useState<number>(1);

  // Detailed Verse Input States (Edit Form)
  const [editCategory, setEditCategory] = useState('믿음');
  const [editRecommendGrade, setEditRecommendGrade] = useState<number>(1);
  const [editDifficulty, setEditDifficulty] = useState<'상' | '중' | '하'>('중');
  const [editIsFavorite, setEditIsFavorite] = useState(false);
  const [editBibleBook, setEditBibleBook] = useState('');
  const [editChapter, setEditChapter] = useState('');
  const [editVerseNum, setEditVerseNum] = useState('');
  const [editOrderNum, setEditOrderNum] = useState<number>(1);

  // Members Management States
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [memberSubmissions, setMemberSubmissions] = useState<any[]>([]);

  // Fetch profiles list on component mount or search query change
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error("Error fetching profiles:", error);
        } else {
          setProfilesList(data || []);
        }
      } catch (err) {
        console.error("Exception fetching profiles:", err);
      } finally {
        setLoadingProfiles(false);
      }
    };

    if (rightTab === 'members_manage') {
      fetchProfiles();
    }
  }, [rightTab]);

  // Fetch submissions and progress for a selected member
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!selectedMember) return;
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', selectedMember.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching member submissions:", error);
        } else {
          const mapped = (data || []).map(item => ({
            ...item,
            submitted_at: item.created_at
          }));
          setMemberSubmissions(mapped);
        }
      } catch (err) {
        console.error("Exception fetching member submissions:", err);
      }
    };

    fetchMemberDetails();
  }, [selectedMember]);

  // Handle member role change
  const handleUpdateMemberRole = async (profileId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) {
        console.error("Error updating member role:", error);
      } else {
        // Update local list state
        setProfilesList(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
        if (selectedMember?.id === profileId) {
          setSelectedMember((prev: any) => prev ? { ...prev, role: newRole } : null);
        }
      }
    } catch (err: any) {
      console.error("Exception updating role:", err);
    }
  };

  // Handle member toggle active status (Simulate by role downgrading/upgrading or name markup)
  const handleToggleMemberActive = async (profileId: string, currentRole: AppRole, currentName: string) => {
    // If user is guest/inactive, upgrade to member, else downgrade to guest
    const targetRole: AppRole = currentRole === 'guest' ? 'member' : 'guest';
    const isDeactivating = targetRole === 'guest';
    let targetName = currentName;
    if (isDeactivating && !currentName.includes('(비활성화)')) {
      targetName = `${currentName} (비활성화)`;
    } else if (!isDeactivating && currentName.includes('(비활성화)')) {
      targetName = currentName.replace('(비활성화)', '').trim();
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: targetRole, name: targetName })
        .eq('id', profileId);

      if (error) {
        console.error("Error toggling active status:", error);
      } else {
        setProfilesList(prev => prev.map(p => p.id === profileId ? { ...p, role: targetRole, name: targetName } : p));
        if (selectedMember?.id === profileId) {
          setSelectedMember((prev: any) => prev ? { ...prev, role: targetRole, name: targetName } : null);
        }
      }
    } catch (err: any) {
      console.error("Exception toggling active:", err);
    }
  };

  // Prayer management states
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [editPrayerTitle, setEditPrayerTitle] = useState('');
  const [editPrayerContent, setEditPrayerContent] = useState('');
  const [editPrayerCategory, setEditPrayerCategory] = useState<'family' | 'health' | 'faith' | 'career' | 'others'>('faith');
  const [deletePrayerConfirmId, setDeletePrayerConfirmId] = useState<string | null>(null);

  // GongGwa content management states
  const [editingGongGwaId, setEditingGongGwaId] = useState<string | null>(null);
  const [gongGwaTitle, setGongGwaTitle] = useState('');
  const [gongGwaScriptureRef, setGongGwaScriptureRef] = useState('');
  const [gongGwaIntro, setGongGwaIntro] = useState('');
  const [gongGwaVersesRaw, setGongGwaVersesRaw] = useState('');
  const [gongGwaLessonsRaw, setGongGwaLessonsRaw] = useState('');
  const [gongGwaConclusion, setGongGwaConclusion] = useState('');
  const [gongGwaQnasRaw, setGongGwaQnasRaw] = useState('');
  const [gongGwaPasteText, setGongGwaPasteText] = useState('');

  const handleGongGwaPasteParse = (text: string) => {
    setGongGwaPasteText(text);
    if (!text.trim()) return;

    const lines = text.split('\n').map(l => l.trim());
    let parsedTitle = '';
    let parsedPassage = '';
    let parsedIntro: string[] = [];
    let parsedVersesLines: string[] = [];
    let parsedLessonsLines: string[] = [];
    let parsedConclusionLines: string[] = [];
    let parsedQnasLines: string[] = [];

    let currentSection: 'none' | 'title' | 'passage' | 'intro' | 'verses' | 'lessons' | 'conclusion' | 'qna' = 'none';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lowerLine = line.toLowerCase();
      if (line.includes('공과') || line.includes('과') && line.includes('제목') || (i === 0 && line.includes('과'))) {
        parsedTitle = line.replace(/^(제목|공과제목|교재제목|교재)\s*:\s*/, '').trim();
        continue;
      }

      if (line.includes('본문') || line.includes('성경구절') || line.includes('구절')) {
        parsedPassage = line.replace(/^(본문|성경구절|구절|성경범위)\s*:\s*/, '').trim();
        continue;
      }

      if (line.startsWith('■ 서론') || line.startsWith('서론') || line.startsWith('도입')) {
        currentSection = 'intro';
        continue;
      } else if (line.startsWith('■ 요절') || line.startsWith('요절') || line.startsWith('본문말씀')) {
        currentSection = 'verses';
        continue;
      } else if (line.startsWith('■ 본론') || line.startsWith('본론') || line.startsWith('대지')) {
        currentSection = 'lessons';
        continue;
      } else if (line.startsWith('■ 결론') || line.startsWith('결론') || line.startsWith('맺음말')) {
        currentSection = 'conclusion';
        continue;
      } else if (line.startsWith('■ 문답') || line.startsWith('문답') || line.startsWith('문제')) {
        currentSection = 'qna';
        continue;
      }

      if (currentSection === 'none') {
        if (i === 0) {
          parsedTitle = line;
          continue;
        } else if (i === 1 && (line.includes('장') || line.includes('절'))) {
          parsedPassage = line;
          continue;
        } else {
          currentSection = 'intro';
        }
      }

      if (currentSection === 'intro') {
        parsedIntro.push(line);
      } else if (currentSection === 'verses') {
        parsedVersesLines.push(line);
      } else if (currentSection === 'lessons') {
        parsedLessonsLines.push(line);
      } else if (currentSection === 'conclusion') {
        parsedConclusionLines.push(line);
      } else if (currentSection === 'qna') {
        parsedQnasLines.push(line);
      }
    }

    if (parsedTitle) setGongGwaTitle(parsedTitle);
    if (parsedPassage) setGongGwaScriptureRef(parsedPassage);
    if (parsedIntro.length > 0) setGongGwaIntro(parsedIntro.join('\n'));
    if (parsedConclusionLines.length > 0) setGongGwaConclusion(parsedConclusionLines.join('\n'));

    if (parsedVersesLines.length > 0) {
      const formatted = parsedVersesLines.map(vLine => {
        if (vLine.includes('|')) return vLine;
        const match = vLine.match(/^([가-힣a-zA-Z0-9\s]+?[\d]+편?[\s\d:\-~,]+절?)\s+(.+)$/);
        if (match) {
          return `${match[1]} | ${match[2]} | Y | 묵상`;
        }
        return `${parsedPassage || '요절'} | ${vLine} | N | 요절구절`;
      }).join('\n');
      setGongGwaVersesRaw(formatted);
    }

    if (parsedLessonsLines.length > 0) {
      const formatted = parsedLessonsLines.map(lLine => {
        if (lLine.includes('|')) return lLine;
        const match = lLine.match(/^(\d+\.?\s*[^|]+)\s+(.+)$/);
        if (match) {
          return `${match[1]} | ${parsedPassage || '본문'} | ${match[2]}`;
        }
        return `1. 대지 | ${parsedPassage || '본문'} | ${lLine}`;
      }).join('\n');
      setGongGwaLessonsRaw(formatted);
    }

    if (parsedQnasLines.length > 0) {
      const formatted = parsedQnasLines.map(qLine => {
        if (qLine.includes('|')) return qLine;
        if (qLine.includes('?')) {
          const parts = qLine.split('?');
          return `${parts[0]}? | ${parts.slice(1).join('?').trim()}`;
        }
        return `문. 질문내용 | 답. ${qLine}`;
      }).join('\n');
      setGongGwaQnasRaw(formatted);
    }
  };

  const startEditingGongGwa = (g: GongGwa) => {
    setEditingGongGwaId(g.id);
    setGongGwaPasteText('');
    setGongGwaTitle(g.title);
    setGongGwaScriptureRef(g.scriptureReference);
    setGongGwaIntro(g.introduction.join('\n'));
    setGongGwaConclusion(g.conclusion ? g.conclusion.join('\n') : '');
    
    // Verses
    const versesStr = g.verses.map(v => `${v.reference} | ${v.text} | ${v.isKey ? 'Y' : 'N'} | ${v.hint || ''}`).join('\n');
    setGongGwaVersesRaw(versesStr);
    
    // Core lessons
    const lessonsStr = g.coreLessons.map(l => `${l.title} | ${l.verse} | ${l.desc}`).join('\n');
    setGongGwaLessonsRaw(lessonsStr);
    
    // QnAs
    const qnasStr = g.qnas.map(q => `${q.question} | ${q.answer}`).join('\n');
    setGongGwaQnasRaw(qnasStr);
  };

  const startNewGongGwa = () => {
    setEditingGongGwaId('new');
    setGongGwaPasteText('');
    setGongGwaTitle('8공과: 새로운 과');
    setGongGwaScriptureRef('말씀 범위');
    setGongGwaIntro('첫째 도입 내용...\n둘째 도입 내용...');
    setGongGwaVersesRaw('말씀 장절 | 말씀 본문 내용 | N | 힌트 내용');
    setGongGwaLessonsRaw('1. 핵심 주제 | 말씀 장절 | 핵심 설명 내용');
    setGongGwaConclusion('결론 첫째 내용...\n결론 둘째 내용...');
    setGongGwaQnasRaw('문 1. 질문 내용 | 답변 내용');
  };

  const handleSaveGongGwa = () => {
    if (!gongGwaTitle.trim()) return;

    const parsedVerses = gongGwaVersesRaw.split('\n').filter(line => line.trim()).map((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      return {
        id: `gv-${editingGongGwaId === 'new' ? Date.now() : editingGongGwaId}-${idx}`,
        reference: parts[0] || '성구 장절',
        text: parts[1] || '말씀 본문',
        isKey: parts[2]?.toUpperCase() === 'Y' || parts[2]?.toUpperCase() === 'YES',
        hint: parts[3] || undefined
      };
    });

    const parsedLessons = gongGwaLessonsRaw.split('\n').filter(line => line.trim()).map((line) => {
      const parts = line.split('|').map(p => p.trim());
      return {
        title: parts[0] || '대지 제목',
        verse: parts[1] || '관련 말씀',
        desc: parts[2] || '설명 내용'
      };
    });

    const parsedQnas = gongGwaQnasRaw.split('\n').filter(line => line.trim()).map((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      return {
        id: `q-${idx}`,
        question: parts[0] || '질문 내용',
        answer: parts[1] || '답변 내용'
      };
    });

    const updatedGongGwa: GongGwa = {
      id: editingGongGwaId === 'new' ? `gonggwa-${Date.now()}` : editingGongGwaId!,
      title: gongGwaTitle.trim(),
      scriptureReference: gongGwaScriptureRef.trim(),
      introduction: gongGwaIntro.split('\n').filter(line => line.trim()),
      verses: parsedVerses,
      coreLessons: parsedLessons,
      conclusion: gongGwaConclusion.split('\n').filter(line => line.trim()),
      qnas: parsedQnas
    };

    let newLessons = [...gongGwaLessons];
    if (editingGongGwaId === 'new') {
      newLessons.push(updatedGongGwa);
    } else {
      newLessons = newLessons.map(g => g.id === editingGongGwaId ? updatedGongGwa : g);
    }

    onUpdateGongGwaLessons(newLessons);
    setEditingGongGwaId(null);
  };

  const handleDeleteGongGwa = (id: string) => {
    const newLessons = gongGwaLessons.filter(g => g.id !== id);
    onUpdateGongGwaLessons(newLessons);
    if (editingGongGwaId === id) {
      setEditingGongGwaId(null);
    }
  };

  // Bulletin (Pastor's Encouragement Message Generator) states
  const [selectedBulletinVerseId, setSelectedBulletinVerseId] = useState<string>(verses[0]?.id || '');
  const [bulletinTone, setBulletinTone] = useState<'comfort' | 'courage' | 'grace'>('comfort');
  const [copiedBulletinText, setCopiedBulletinText] = useState(false);
  const [customPastorMessage, setCustomPastorMessage] = useState('');
  const [showSharingPreview, setShowSharingPreview] = useState(false);

  // Add state
  const [newRef, setNewRef] = useState('');
  const [newText, setNewText] = useState('');
  const [newQuarter, setNewQuarter] = useState<number>(1);
  const [newWeek, setNewWeek] = useState<number>(1);
  const [newHint, setNewHint] = useState('');
  const [newDate, setNewDate] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRef, setEditRef] = useState('');
  const [editText, setEditText] = useState('');
  const [editQuarter, setEditQuarter] = useState<number>(1);
  const [editWeek, setEditWeek] = useState<number>(1);
  const [editHint, setEditHint] = useState('');
  const [editDate, setEditDate] = useState('');

  // Sharing states
  const [shareCode, setShareCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Announcements Editing States
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAuthor, setAnnAuthor] = useState('');

  // Sermons Editing States
  const [editingSermonId, setEditingSermonId] = useState<string | null>(null);
  const [sermonRawText, setSermonRawText] = useState('');
  const [sermonTitle, setSermonTitle] = useState('');
  const [sermonDate, setSermonDate] = useState('');
  const [sermonPassage, setSermonPassage] = useState('');
  const [sermonPreacher, setSermonPreacher] = useState('');
  const [sermonContent, setSermonContent] = useState('');
  const [sermonUrl, setSermonUrl] = useState('');
  const [sermonCategory, setSermonCategory] = useState('주일예배');

  // Family Worship Editing States
  const [editingFwId, setEditingFwId] = useState<string | null>(null);
  const [fwDate, setFwDate] = useState('');
  const [fwTitle, setFwTitle] = useState('');
  const [fwHymn, setFwHymn] = useState('');
  const [fwPassage, setFwPassage] = useState('');
  const [fwContent, setFwContent] = useState('');
  const [fwQ1, setFwQ1] = useState('');
  const [fwQ2, setFwQ2] = useState('');
  const [fwQ3, setFwQ3] = useState('');
  const [fwQ4, setFwQ4] = useState('');
  const [fwQ5, setFwQ5] = useState('');
  const [fwTime, setFwTime] = useState('');
  const [fwLocation, setFwLocation] = useState('');
  const [fwMemo, setFwMemo] = useState('');
  const [fwSelectedMembers, setFwSelectedMembers] = useState<string[]>([]);
  const [allSaints, setAllSaints] = useState<any[]>([]);

  // Load all user profiles/saints on component mount
  useEffect(() => {
    const loadSaints = async () => {
      try {
        const users = await authService.profile.fetchUsers();
        setAllSaints(users);
      } catch (err) {
        console.error('Failed to fetch saints in ManagerPanel:', err);
      }
    };
    loadSaints();
  }, []);

  const handleSermonRawTextChange = (text: string) => {
    setSermonRawText(text);
    
    const lines = text.split('\n');
    let title = '';
    let parsedDate = '';
    let category = '주일예배';
    let passage = '';
    let preacher = '담임목사';
    let contentLines: string[] = [];

    // 1. 첫 번째 줄 분석 (날짜와 예배 타입 추출)
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      
      // 연월일 매칭 (예: 2026년 7월 12일 또는 2026.07.12 또는 2026-07-12)
      const dateKoreanMatch = firstLine.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
      const dateStandardMatch = firstLine.match(/(\d{4})[\.\-](0?[1-9]|1[0-2])[\.\-](0?[1-9]|[12]\d|3[01])/);

      if (dateKoreanMatch) {
        parsedDate = `${dateKoreanMatch[1]}.${dateKoreanMatch[2].padStart(2, '0')}.${dateKoreanMatch[3].padStart(2, '0')}`;
        // 날짜를 뺀 나머지 글자들을 가져옴
        const remaining = firstLine.replace(dateKoreanMatch[0], '').trim();
        if (remaining) {
          title = remaining;
          // 예배 카테고리 결정
          if (remaining.includes('새벽')) category = '새벽예배';
          else if (remaining.includes('삼일') || remaining.includes('수요') || remaining.includes('금요') || remaining.includes('기도회')) category = '주간예배';
          else if (remaining.includes('집회') || remaining.includes('부흥') || remaining.includes('특별')) category = '집회예배';
          else category = '주일예배';
        }
      } else if (dateStandardMatch) {
        parsedDate = `${dateStandardMatch[1]}.${dateStandardMatch[2].padStart(2, '0')}.${dateStandardMatch[3].padStart(2, '0')}`;
        const remaining = firstLine.replace(dateStandardMatch[0], '').trim();
        if (remaining) {
          title = remaining;
          if (remaining.includes('새벽')) category = '새벽예배';
          else if (remaining.includes('삼일') || remaining.includes('수요') || remaining.includes('금요') || remaining.includes('기도회')) category = '주간예배';
          else if (remaining.includes('집회') || remaining.includes('부흥') || remaining.includes('특별')) category = '집회예배';
          else category = '주일예배';
        }
      }
    }

    // 2. 각 라인별 수동 기입 키워드 파싱 및 내용 조립
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('제목:') || trimmed.startsWith('제목 :')) {
        const value = trimmed.startsWith('제목:') ? trimmed.substring(3).trim() : trimmed.substring(4).trim();
        if (value) title = value;
      } else if (trimmed.startsWith('날짜:') || trimmed.startsWith('날짜 :')) {
        const raw = trimmed.startsWith('날짜:') ? trimmed.substring(3).trim() : trimmed.substring(4).trim();
        // 날짜 형식 이쁘게 정리
        const korMatch = raw.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (korMatch) {
          parsedDate = `${korMatch[1]}.${korMatch[2].padStart(2, '0')}.${korMatch[3].padStart(2, '0')}`;
        } else {
          parsedDate = raw.replace(/-/g, '.'); // 2026-07-12 -> 2026.07.12
        }
      } else if (trimmed.startsWith('본문:') || trimmed.startsWith('본문 :')) {
        passage = trimmed.startsWith('본문:') ? trimmed.substring(3).trim() : trimmed.substring(4).trim();
      } else if (trimmed.startsWith('설교자:') || trimmed.startsWith('설교자 :') || trimmed.startsWith('설교:') || trimmed.startsWith('설교 :')) {
        preacher = trimmed.replace(/설교자\s*:|설교자:|설교\s*:|설교:/, '').trim();
      } else {
        // 첫 번째 줄이 날짜+구분 형태였는데 contentLines에 들어가면 중복될 수 있으므로, 
        // 첫번째 줄이 파싱에 활용된 날짜 줄이고 다른 정보가 없거나, 날짜+제목 형태였다면 content에 포함하지 않거나,
        // 첫줄이 그냥 텍스트인 경우에만 넣습니다.
        if (i === 0 && parsedDate) {
          // Skip first line if it was parsed as date + title
          continue;
        }
        contentLines.push(line);
      }
    }

    // 만약 첫 줄로부터 파싱해서 title이 없거나 내용에 의해 title이 전혀 지정되지 않았다면 기본값 지정
    if (!title) {
      title = parsedDate ? `${parsedDate} 예배 설교` : "은혜로운 말씀";
    }

    setSermonTitle(title);
    setSermonDate(parsedDate);
    setSermonCategory(category);
    setSermonPassage(passage);
    setSermonPreacher(preacher);
    setSermonContent(contentLines.join('\n').trim());
  };

  // Seeding States
  const [seedStatus, setSeedStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Seeding implementation
  const handleExecuteSeed = async () => {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      const { runMasterDataSeed } = await import('../utils/seedData');
      const res = await runMasterDataSeed();
      if (res.success) {
        setSeedStatus({
          success: true,
          message: `성공적으로 데이터 시드 실행이 완료되었습니다! (암송성구 ${res.versesCount}개, 공과 ${res.lessonsCount}개 등록/업데이트 완료)`
        });
      } else {
        setSeedStatus({
          success: false,
          message: '데이터 시드 도중 예기치 못한 오류가 발생했습니다.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setSeedStatus({
        success: false,
        message: '시드 라이브러리를 로드할 수 없거나 실행 중 예외가 발생했습니다.'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Announcement CMS handlers
  const startEditingAnn = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnAuthor(ann.author || '관리자');
  };

  const startNewAnn = () => {
    setEditingAnnId('new');
    setAnnTitle('');
    setAnnContent('');
    setAnnAuthor('관리자');
  };

  const handleSaveAnn = () => {
    if (!annTitle.trim() || !annContent.trim()) return;

    if (editingAnnId === 'new') {
      if (onAddAnnouncement) {
        onAddAnnouncement(annTitle.trim(), annContent.trim(), annAuthor.trim() || '관리자');
      }
    } else {
      if (onUpdateAnnouncement) {
        onUpdateAnnouncement(editingAnnId!, {
          title: annTitle.trim(),
          content: annContent.trim(),
          author: annAuthor.trim() || '관리자'
        });
      }
    }
    setEditingAnnId(null);
  };

  // Sermon CMS handlers
  const startEditingSermon = (s: Sermon) => {
    setEditingSermonId(s.id);
    const rawPreacher = s.preacher || '담임목사';
    const [pName, pCat] = rawPreacher.includes('|') ? rawPreacher.split('|') : [rawPreacher, '주일예배'];

    const raw = `제목: ${s.title}
날짜: ${s.date} ${pCat ? `(${pCat})` : ''}
본문: ${s.passage || ''}
설교자: ${pName || '담임목사'}

${s.content}`;
    setSermonRawText(raw);
    setSermonTitle(s.title);
    setSermonDate(s.date);
    setSermonPassage(s.passage || '');
    setSermonPreacher(pName);
    setSermonCategory(pCat || '주일예배');
    setSermonContent(s.content);
    setSermonUrl(s.url || '');
  };

  const startNewSermon = () => {
    setEditingSermonId('new');
    const defaultDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '').replace(/\./g, '-');
    const defaultRaw = `제목: 여호와를 경외하는 자의 복
날짜: ${defaultDate} (주일예배)
본문: 시편 128편 1~6절
설교자: 담임목사

여기에 설교 원문 내용을 입력하십시오.`;
    setSermonRawText(defaultRaw);
    setSermonTitle('여호와를 경외하는 자의 복');
    setSermonDate(defaultDate);
    setSermonCategory('주일예배');
    setSermonPassage('시편 128편 1~6절');
    setSermonPreacher('담임목사');
    setSermonContent('여기에 설교 원문 내용을 입력하십시오.');
    setSermonUrl('');
  };

  const handleSaveSermon = () => {
    if (!sermonTitle.trim() || !sermonContent.trim() || !sermonDate.trim()) return;

    let updatedSermons = [...sermons];
    const targetSermon: Sermon = {
      id: editingSermonId === 'new' ? `sermon-${Date.now()}` : editingSermonId!,
      title: sermonTitle.trim(),
      date: sermonDate.trim(),
      passage: sermonPassage.trim() || undefined,
      preacher: `${sermonPreacher.trim() || '담임목사'}|${sermonCategory}`,
      content: sermonContent.trim(),
      url: sermonUrl.trim() || undefined,
      isActive: true
    };

    if (editingSermonId === 'new') {
      updatedSermons = [targetSermon, ...updatedSermons];
    } else {
      updatedSermons = updatedSermons.map(s => s.id === editingSermonId ? targetSermon : s);
    }

    if (onUpdateSermons) {
      onUpdateSermons(updatedSermons);
    }
    setEditingSermonId(null);
  };

  const handleDeleteSermon = (id: string) => {
    const updated = sermons.filter(s => s.id !== id);
    if (onUpdateSermons) {
      onUpdateSermons(updated);
    }
    if (editingSermonId === id) {
      setEditingSermonId(null);
    }
  };

  // Family Worship Handlers
  const handleStartNewFamilyWorship = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setEditingFwId('new');
    setFwDate(formattedDate);
    setFwTitle('');
    setFwHymn('');
    setFwPassage('');
    setFwContent('');
    setFwQ1('');
    setFwQ2('');
    setFwQ3('');
    setFwQ4('');
    setFwQ5('');
    setFwTime('11:00');
    setFwLocation('가정 거실');
    setFwMemo('');
    setFwSelectedMembers([]);
  };

  const handleStartEditFamilyWorship = (fw: FamilyWorship) => {
    setEditingFwId(fw.id);
    setFwDate(fw.date);
    setFwTitle(fw.title);
    setFwHymn(fw.hymn || '');
    setFwPassage(fw.passage || '');
    setFwTime(fw.time || '11:00');
    setFwLocation(fw.location || '가정 거실');
    setFwMemo(fw.memo || '');
    setFwSelectedMembers(fw.selectedMembers || []);

    let mainContent = fw.content || '';
    let q1 = '', q2 = '', q3 = '', q4 = '', q5 = '';
    try {
      if (mainContent.trim().startsWith('{')) {
        const parsed = JSON.parse(mainContent);
        mainContent = parsed.content || '';
        const qs = parsed.questions || [];
        q1 = qs[0] || '';
        q2 = qs[1] || '';
        q3 = qs[2] || '';
        q4 = qs[3] || '';
        q5 = qs[4] || '';
      }
    } catch (e) {
      console.error('Error parsing family worship JSON:', e);
    }

    setFwContent(mainContent);
    setFwQ1(q1);
    setFwQ2(q2);
    setFwQ3(q3);
    setFwQ4(q4);
    setFwQ5(q5);
  };

  const handleSaveFamilyWorship = () => {
    if (!fwTitle.trim() || !fwDate.trim()) return;

    let updatedFWs = [...familyWorships];

    // Serialize content + questions list as JSON
    const questionsList = [fwQ1.trim(), fwQ2.trim(), fwQ3.trim(), fwQ4.trim(), fwQ5.trim()].filter(Boolean);
    const serializedContent = JSON.stringify({
      content: fwContent.trim(),
      questions: questionsList
    });

    const targetFW: FamilyWorship = {
      id: editingFwId === 'new' ? `fw-${Date.now()}` : editingFwId!,
      title: fwTitle.trim(),
      date: fwDate.trim(),
      hymn: fwHymn.trim(),
      passage: fwPassage.trim(),
      content: serializedContent,
      isActive: true,
      time: fwTime.trim(),
      location: fwLocation.trim(),
      memo: fwMemo.trim(),
      selectedMembers: fwSelectedMembers
    };

    if (editingFwId === 'new') {
      updatedFWs = [targetFW, ...updatedFWs];
    } else {
      updatedFWs = updatedFWs.map(f => f.id === editingFwId ? targetFW : f);
    }

    if (onUpdateFamilyWorships) {
      onUpdateFamilyWorships(updatedFWs);
    }
    setEditingFwId(null);
  };

  const handleDeleteFamilyWorship = (id: string) => {
    const updated = familyWorships.filter(f => f.id !== id);
    if (onUpdateFamilyWorships) {
      onUpdateFamilyWorships(updated);
    }
    if (editingFwId === id) {
      setEditingFwId(null);
    }
  };

  // Small Group sharing generator states
  const [selectedSharingVerseId, setSelectedSharingVerseId] = useState<string>(verses[0]?.id || '');
  const [sharingTheme, setSharingTheme] = useState<'gratitude' | 'faith' | 'love' | 'comfort'>('gratitude');
  const [copiedSharingText, setCopiedSharingText] = useState(false);

  // Custom Deletion & Reset Modal states (to bypass window.confirm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Submit new verse
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBibleBook.trim() || !newChapter.trim() || !newVerseNum.trim() || !newText.trim()) return;

    const computedRef = `${newBibleBook.trim()} ${newChapter.trim()}:${newVerseNum.trim()}`;
    const guideText = newHint.trim() || autoGenerateMeditationGuide(computedRef, newText.trim());

    // Bundle everything into metadata JSON inside the hint column for operational 100% data safety
    const meta = {
      category: newCategory,
      recommendGrade: newRecommendGrade,
      difficulty: newDifficulty,
      isFavorite: newIsFavorite,
      bibleBook: newBibleBook.trim(),
      chapter: newChapter.trim(),
      verseNum: newVerseNum.trim(),
      orderNum: newOrderNum,
      guide: guideText
    };

    onAddVerse({
      reference: computedRef,
      text: newText.trim(),
      quarter: newRecommendGrade,
      week: newOrderNum,
      hint: JSON.stringify(meta),
      date: newDate.trim() || undefined
    });

    // Reset fields
    setNewBibleBook('요한복음');
    setNewChapter('3');
    setNewVerseNum('16');
    setNewText('');
    setNewHint('');
    setNewDate('');
    setNewIsFavorite(false);
    setNewOrderNum(w => Math.min(13, w + 1));
  };

  // Start editing
  const startEditing = (verse: Verse) => {
    setEditingId(verse.id);
    setEditText(verse.text);
    setEditDate(verse.date || '');
    setEditQuarter(verse.quarter);
    setEditWeek(verse.week);

    try {
      const meta = JSON.parse(verse.hint || '');
      setEditCategory(meta.category || '믿음');
      setEditRecommendGrade(Number(meta.recommendGrade) || verse.quarter || 1);
      setEditDifficulty(meta.difficulty || '중');
      setEditIsFavorite(!!meta.isFavorite);
      setEditBibleBook(meta.bibleBook || verse.reference);
      setEditChapter(meta.chapter || '');
      setEditVerseNum(meta.verseNum || '');
      setEditOrderNum(Number(meta.orderNum) || verse.week || 1);
      setEditHint(meta.guide || '');
    } catch (e) {
      // Robust Fallback for legacy format
      setEditCategory(verse.title || '믿음');
      setEditRecommendGrade(verse.quarter || 1);
      setEditDifficulty('중');
      setEditIsFavorite(false);

      const refParts = verse.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
      if (refParts) {
        setEditBibleBook(refParts[1]);
        setEditChapter(refParts[2]);
        setEditVerseNum(refParts[3]);
      } else {
        setEditBibleBook(verse.reference);
        setEditChapter('');
        setEditVerseNum('');
      }
      setEditOrderNum(verse.week || 1);
      setEditHint(verse.hint || '');
    }
  };

  // Save edit
  const handleSaveEdit = (id: string) => {
    if (!editBibleBook.trim() || !editChapter.trim() || !editVerseNum.trim() || !editText.trim()) return;

    const computedRef = `${editBibleBook.trim()} ${editChapter.trim()}:${editVerseNum.trim()}`;
    const guideText = editHint.trim() || autoGenerateMeditationGuide(computedRef, editText.trim());

    const meta = {
      category: editCategory,
      recommendGrade: editRecommendGrade,
      difficulty: editDifficulty,
      isFavorite: editIsFavorite,
      bibleBook: editBibleBook.trim(),
      chapter: editChapter.trim(),
      verseNum: editVerseNum.trim(),
      orderNum: editOrderNum,
      guide: guideText
    };

    onUpdateVerse(id, {
      reference: computedRef,
      text: editText.trim(),
      quarter: editRecommendGrade,
      week: editOrderNum,
      hint: JSON.stringify(meta),
      date: editDate.trim() || undefined
    });

    setEditingId(null);
  };

  // Generate share code (Base64 encoded JSON of all custom and standard verses)
  const generateShareCode = () => {
    try {
      const dataStr = JSON.stringify(verses);
      const b64 = btoa(unescape(encodeURIComponent(dataStr)));
      setShareCode(b64);
      navigator.clipboard.writeText(b64);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Failed to generate code', e);
    }
  };

  // Import share code
  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);
    if (!importCode.trim()) {
      setImportError('공유 코드를 입력해 주세요.');
      return;
    }

    try {
      const decodedStr = decodeURIComponent(escape(atob(importCode.trim())));
      const parsed = JSON.parse(decodedStr);
      
      if (!Array.isArray(parsed)) {
        throw new Error('올바르지 않은 공유 코드 형식입니다.');
      }
      onImportVerses(parsed);
      setImportSuccess(true);
      setImportCode('');
    } catch (e) {
      console.error('Failed to import code', e);
      setImportError('가져오기에 실패했습니다. 올바른 공유 코드인지 확인해 주세요.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Title Header */}      <div className="flex justify-between items-center pb-4 border-b border-[#E9E3D8]">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#5A5A40] flex items-center gap-2">
            <Settings className="w-5.5 h-5.5 text-[#8A9A5B]" />
            교회 행정 및 말씀 CMS
          </h2>
          <p className="text-xs text-[#7A7A6A] mt-1">
            성구, 회원, 공과, 공지, 설교, 기도 등 목회 행정을 모바일과 PC에서 한눈에 관리하고 동행해 보세요.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F5F0] hover:bg-[#8A9A5B] hover:text-white text-[#5A5A40] transition text-xs font-bold shadow-xs cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>목록으로 돌아가기</span>
        </button>
      </div>

      {/* Admin CMS Navigation Tabs */}
      <div className="w-full">
        <div className="flex border border-[#E9E3D8] gap-1 bg-[#F5F5F0] p-1.5 rounded-2xl shadow-inner flex-wrap md:flex-nowrap overflow-x-auto scrollbar-none">
          {(userRole === 'master' || userRole === 'pastor') && (
            <button
              type="button"
              onClick={() => handleTabChange('members_manage')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'members_manage' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <Users className="w-3.5 h-3.5 text-[#8A9A5B]" />
              회원관리
            </button>
          )}

          {(userRole === 'admin' || userRole === 'pastor' || userRole === 'master') && (
            <button
              type="button"
              onClick={() => handleTabChange('scriptures')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'scriptures' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#8A9A5B]" />
              성구관리
            </button>
          )}

          {(userRole === 'admin' || userRole === 'pastor' || userRole === 'master') && (
            <button
              type="button"
              onClick={() => handleTabChange('gonggwa_manage')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'gonggwa_manage' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8A9A5B]" />
              공과관리
            </button>
          )}

          {(userRole === 'pastor' || userRole === 'master') && (
            <button
              type="button"
              onClick={() => handleTabChange('sermons_manage')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'sermons_manage' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <Mic className="w-3.5 h-3.5 text-[#8A9A5B]" />
              설교관리
            </button>
          )}

          {(userRole === 'pastor' || userRole === 'master') && (
            <button
              type="button"
              onClick={() => handleTabChange('family_worship_manage')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'family_worship_manage' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#8A9A5B]" />
              가정예배관리
            </button>
          )}

          {(userRole === 'pastor' || userRole === 'master') && (
            <button
              type="button"
              onClick={() => handleTabChange('prayers_manage')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'prayers_manage' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <Heart className="w-3.5 h-3.5 text-[#8A9A5B]" />
              기도관리
            </button>
          )}

          {(userRole === 'pastor' || userRole === 'master') && (
            <button
              type="button"
              onClick={() => handleTabChange('announcements_manage')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'announcements_manage' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <Megaphone className="w-3.5 h-3.5 text-[#8A9A5B]" />
              공지관리
            </button>
          )}

          {(userRole === 'pastor' || userRole === 'master') && (
            <button
              type="button"
              onClick={() => handleTabChange('saints')}
              className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${rightTab === 'saints' ? 'bg-white text-[#5A5A40] shadow-sm font-black' : 'text-[#7A7A6A] hover:bg-white/50'}`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#8A9A5B]" />
              양육현황
            </button>
          )}
        </div>
      </div>

      {/* Main Contents Area */}
      <div className="w-full space-y-6">

        {/* Tab 1: Groups (소그룹 말씀 나눔 질문지 생성기) */}
          {rightTab === 'groups' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#8A9A5B]" />
                  소그룹 말씀 나눔지 생성기
                </h4>
                <span className="text-[10px] text-[#8A9A5B] font-semibold bg-[#F5F5F0] px-2 py-0.5 rounded-full">리더용 도구</span>
              </div>
              <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                성도님들의 주간 소그룹 모임과 구역 예배에서 말씀을 묵상하고 구체적인 삶의 나눔을 인도하기 위한 질문지를 간편하게 생성합니다.
              </p>

              {/* Selection controls */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">대상 말씀 구절 선택</label>
                  <select
                    value={selectedSharingVerseId}
                    onChange={(e) => setSelectedSharingVerseId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-[#FDFBF7] text-[#4A4A4A] focus:outline-none"
                  >
                    {verses.map(v => (
                      <option key={v.id} value={v.id}>
                        [{v.quarter}분기 {v.week}주차] {v.reference}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">나눔 주제 선택</label>
                  <div className="grid grid-cols-4 gap-1.5 font-sans">
                    {(['gratitude', 'faith', 'love', 'comfort'] as const).map(theme => {
                      const labels = { gratitude: '감사', faith: '믿음', love: '사랑', comfort: '위로' };
                      const isSelected = sharingTheme === theme;
                      return (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => setSharingTheme(theme)}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#8A9A5B] border-[#8A9A5B] text-white font-semibold'
                              : 'bg-white border-[#E9E3D8] text-[#7A7A6A] hover:bg-[#F5F5F0]'
                          }`}
                        >
                          {labels[theme]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Generated Sheet Preview */}
              {(() => {
                const selectedVerse = verses.find(v => v.id === selectedSharingVerseId) || verses[0];
                if (!selectedVerse) return null;

                const questions = {
                  gratitude: [
                    "이 말씀에 나타난 하나님의 선하심과 인자하심이 나의 삶 속에 구체적으로 경험되었던 때는 언제인가요? 감사했던 순간을 서로 정겹게 이야기 나누어 봅시다.",
                    "오늘 하루, 그리고 이번 한 주 동안 하나님께 감사드리고 싶은 구체적인 고백 세 가지를 소그룹원들과 고백해 봅시다.",
                    "말씀을 마음에 품으며, 이번 주에 감사를 먼저 행동으로 표현하고 사랑의 마음을 전해야 할 이웃이나 가족은 누구인지 나누어 봅시다."
                  ],
                  faith: [
                    "말씀을 깊이 생각할 때, 나의 온전한 믿음의 결단을 방해하는 세상적인 근심이나 두려움은 무엇인가요? 솔직히 고백하고 함께 기도의 힘을 모읍시다.",
                    "사람이 떡으로만 살 것이 아니요 하나님의 모든 말씀으로 살리라 하신 것처럼, 눈앞의 이익 대신 말씀을 신뢰하며 용기 있게 행동했던 경험을 들려주세요.",
                    "말씀을 삶 속에 온전히 지키며 살아가기 위해 이번 한 주 동안 실천할 구체적인 영적 훈련(기도 시간 정하기, 매일 말씀 암송 등)을 결단해 봅시다."
                  ],
                  love: [
                    "이 말씀이 전하는 화평함과 거룩함을 실천하기에, 지금 내가 처한 현실이나 인간관계 속에서 가장 극복하기 힘든 감정은 무엇인가요?",
                    "예수 그리스도의 은혜 안에서 나와 성도들이 함께 주님의 기쁨을 나누고 있는지 돌아보며, 서로를 위해 어떤 응원의 손길을 건넬 수 있을지 구체적으로 나눕시다.",
                    "오늘 주님의 사랑을 흘려보내며 특별히 위로하고 축복하고 싶은 지체나 이웃을 마음에 떠올리고, 그들의 이름을 불러주며 함께 나눔을 이어갑시다."
                  ],
                  comfort: [
                    "최근 힘든 일이나 마음에 진정한 평안을 잃어버리게 만든 상황(염려, 불안 등)이 있었다면 사랑하는 소그룹원들에게 털어놓고 함께 나누어 봅시다.",
                    "내가 환난을 지날 때 주님께서 함께하셔서 나를 구원하시고 영화롭게 하신다는 약속의 음성이 현재 나의 어려움에 어떤 큰 힘과 위로를 주나요?",
                    "주 여호와를 온전한 나의 피난처이자 등대로 삼고, 내 삶의 무거운 짐을 다 주님 발앞에 내려놓을 수 있도록 서로 손을 맞잡고 간절히 소망을 기도로 나누어 봅시다."
                  ]
                }[sharingTheme];

                const handleCopySharingText = () => {
                  const text = `⛪ 학장교회 소그룹 말씀 나눔지\n\n- 말씀 구절: ${selectedVerse.reference}\n- 본문: "${selectedVerse.text}"\n- 이번 주 나눔 주제: [${sharingTheme === 'gratitude' ? '감사' : sharingTheme === 'faith' ? '믿음' : sharingTheme === 'love' ? '사랑' : '위로'}]\n\n소그룹 나눔 질문:\n1. ${questions[0]}\n2. ${questions[1]}\n3. ${questions[2]}\n\n"말씀중심 은혜중심" - 학장교회`;
                  navigator.clipboard.writeText(text);
                  setCopiedSharingText(true);
                  setTimeout(() => setCopiedSharingText(false), 2000);
                };

                return (
                  <div className="space-y-3 pt-2">
                    <div className="p-4 bg-[#F9F7F2] border border-[#E9E3D8] rounded-2xl font-serif space-y-3">
                      <div className="text-center">
                        <span className="text-[9px] text-amber-700 tracking-wider">학장교회 소그룹 말씀 나눔</span>
                        <h5 className="text-xs font-bold text-[#5A5A40] mt-0.5">"{selectedVerse.reference}" 나눔 질문지</h5>
                      </div>
                      <p className="text-[10px] text-stone-500 italic text-center font-sans">
                        "{selectedVerse.text}"
                      </p>
                      <div className="border-t border-[#E9E3D8] pt-2.5 font-sans text-stone-800 space-y-2">
                        {questions.map((q, qidx) => (
                          <div key={qidx} className="flex gap-1.5 text-[10px] leading-relaxed">
                            <span className="font-bold text-[#8A9A5B] shrink-0">{qidx + 1}.</span>
                            <p>{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopySharingText}
                        className="flex-1 py-2 rounded-xl border border-[#E9E3D8] hover:bg-[#F5F5F0] text-[#5A5A40] text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                      >
                        <Copy className="w-3 h-3 text-[#8A9A5B]" />
                        {copiedSharingText ? '복사 완료!' : '나눔 텍스트 복사'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSharingPreview(true)}
                        className="flex-1 py-2 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-[10px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                      >
                        <Printer className="w-3 h-3" />
                        나눔지 인쇄/미리보기
                      </button>
                    </div>

                    {/* HTML Ornate Sharing Sheet Print Layout */}
                    {showSharingPreview && (
                      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 max-w-lg w-full shadow-2xl relative">
                          <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                            <button
                              type="button"
                              onClick={() => window.print()}
                              className="p-1.5 rounded-lg bg-[#5A5A40] text-white hover:bg-[#4A4A30] transition text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              인쇄하기
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSharingPreview(false)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div
                            id="printable-sharing-sheet"
                            className="border-[8px] border-double border-[#8A9A5B] p-6 bg-white rounded-xl text-center font-serif relative printable-content"
                            style={{ minHeight: '420px' }}
                          >
                            <div className="space-y-4 w-full">
                              <span className="text-[10px] text-[#8A9A5B] font-bold uppercase tracking-widest font-sans border-b border-[#8A9A5B]/30 pb-0.5 block w-max mx-auto">
                                대한예수교장로회 학장교회 소그룹 모임
                              </span>

                              <h2 className="text-xl font-bold text-gray-900 tracking-wider pt-1">
                                금주의 말씀 나눔 질문지
                              </h2>

                              <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-left text-xs font-sans space-y-1.5">
                                <p className="text-[#8A9A5B] font-bold text-[11px]">말씀 구절: {selectedVerse.reference}</p>
                                <p className="text-gray-700 italic leading-relaxed">"{selectedVerse.text}"</p>
                              </div>

                              <div className="text-left font-sans space-y-3 pt-2 text-xs">
                                <h4 className="font-bold text-gray-800 text-[11px] border-b border-stone-100 pb-1 flex items-center gap-1.5">
                                  📌 이번 주 나눔 주제: [ {sharingTheme === 'gratitude' ? '감사' : sharingTheme === 'faith' ? '믿음' : sharingTheme === 'love' ? '사랑' : '위로'} ]
                                </h4>
                                {questions.map((q, idx) => (
                                  <div key={idx} className="flex gap-2 text-gray-800 leading-relaxed">
                                    <span className="font-extrabold text-[#8A9A5B] shrink-0">{idx + 1}.</span>
                                    <p>{q}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-4 border-t border-dashed border-stone-200">
                                <p className="text-[10px] font-sans text-gray-400">
                                  "오직 말씀중심 은혜중심으로 무장하는 학장교회 성도"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab 1.5: GongGwa Management (공과 공부 내용 관리) */}
          {rightTab === 'gonggwa_manage' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#8A9A5B]" />
                  공과 공부 교재 및 내용 관리
                </h4>
                <button
                  type="button"
                  onClick={startNewGongGwa}
                  className="px-3 py-1 bg-[#8A9A5B] text-white hover:bg-[#78884F] text-[10px] font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>새 공과 추가</span>
                </button>
              </div>
              <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                장년공과 공부 및 배움마당 교재의 주차별 성구, 도입, 핵심 강의 대지 및 주관식 문답 문구를 등록하고 언제든지 수정할 수 있습니다.
              </p>

              {editingGongGwaId !== null ? (
                /* GongGwa Editing Form */
                <div className="space-y-3.5 bg-[#F9F7F2] p-4 rounded-2xl border border-[#E9E3D8]">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E9E3D8]/60">
                    <span className="text-xs font-bold text-[#5A5A40]">
                      {editingGongGwaId === 'new' ? '✨ 새로운 공과 등록' : '✍️ 공과 본문 수정'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingGongGwaId(null)}
                      className="text-[#A0A090] hover:text-[#5A5A40] text-xs font-semibold"
                    >
                      취소
                    </button>
                  </div>

                  {/* Smart Paste Block for GongGwa */}
                  <div className="p-3 bg-white border border-[#E9E3D8] rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="block text-[10px] font-bold text-[#8A9A5B] uppercase tracking-wider flex items-center gap-1">
                        📋 공과 원문 전체 붙여넣기 (스마트 자동 파싱)
                      </span>
                      <span className="text-[9px] text-[#A0A090]">
                        서론, 요절, 본론, 결론, 문답 구분 기호 포함 시 자동 배분됩니다.
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={gongGwaPasteText}
                      onChange={(e) => handleGongGwaPasteParse(e.target.value)}
                      placeholder="여기에 공과 교재 텍스트 전체를 붙여넣으세요. 날짜/성구/도입/대지/문답글이 완벽하게 자동 분배되어 아래의 각 항목들에 바로 채워집니다!"
                      className="w-full text-[11px] p-2 rounded-lg border border-[#E9E3D8] bg-stone-50 text-[#4A4A4A] focus:outline-none focus:bg-white placeholder:text-stone-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">제목 (예: 7공과: 거듭남)</label>
                      <input
                        type="text"
                        value={gongGwaTitle}
                        onChange={(e) => setGongGwaTitle(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                        placeholder="7공과: 거듭남 (Rebirth)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">본문 (예: 요한복음 3장 3절~8절)</label>
                      <input
                        type="text"
                        value={gongGwaScriptureRef}
                        onChange={(e) => setGongGwaScriptureRef(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                        placeholder="요한복음 3장 3절~8절"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#7A7A6A]">
                      서론 (공과 도입 내용 - 줄바꿈으로 구분)
                    </label>
                    <textarea
                      value={gongGwaIntro}
                      onChange={(e) => setGongGwaIntro(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-sans"
                      placeholder="첫째 아담으로 난 사람은 다 지옥 갑니다.&#10;둘째 아담으로 거듭난 자는 다 천국 갑니다."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">
                        요절 (본문 말씀 구절 목록 - 형식: 장절 | 본문 | 암송성구여부(Y/N) | 힌트)
                      </label>
                      <span className="text-[9px] text-amber-700 font-medium">한 줄에 한 절씩 입력</span>
                    </div>
                    <textarea
                      value={gongGwaVersesRaw}
                      onChange={(e) => setGongGwaVersesRaw(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-mono"
                      placeholder="요한복음 3장 3절 | 사람이 거듭나지 아니하면 하나님 나라를 볼 수 없느니라 | N | 거듭남의 필요성&#10;요한복음 3장 6절 | 육으로 난 것은 육이요 성령으로 난 것은 영이니 | Y | 육과 영의 철저한 대조"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">
                        본론 (핵심 강의 대지 - 형식: 대지번호/제목 | 관련구절 | 핵심내용)
                      </label>
                    </div>
                    <textarea
                      value={gongGwaLessonsRaw}
                      onChange={(e) => setGongGwaLessonsRaw(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-mono"
                      placeholder="1. 니고데모의 질문 | 요한복음 3:4 | 유대인의 관원인 니고데모는 육체적인 관점에서 예수님의...&#10;2. 예수님의 가르침 (바람의 비유) | 요한복음 3:8 | 바람이 부는 소리는 들어도..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#7A7A6A]">
                      결론 (공과 맺음말 내용 - 줄바꿈으로 구분)
                    </label>
                    <textarea
                      value={gongGwaConclusion}
                      onChange={(e) => setGongGwaConclusion(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-sans"
                      placeholder="결론 첫째...&#10;결론 둘째..."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-[#7A7A6A]">
                        문답 (주관식 배움마당 문답 - 형식: 질문 | 정답)
                      </label>
                    </div>
                    <textarea
                      value={gongGwaQnasRaw}
                      onChange={(e) => setGongGwaQnasRaw(e.target.value)}
                      rows={2.5}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none font-mono"
                      placeholder="문 1. 사람이 몇 종류뇨? | 육으로 난 자와 영으로 난 자 둘입니다.&#10;문 2. 천국은 어떤 사람이 가느뇨? | 거듭난 사람만 갑니다."
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingGongGwaId(null)}
                      className="flex-1 py-2 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGongGwa}
                      className="flex-1 py-2 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              ) : (
                /* GongGwa List Area */
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {gongGwaLessons.length === 0 ? (
                    <div className="p-8 text-center text-[#A0A090] text-xs font-medium">
                      등록된 내용이 없습니다.
                    </div>
                  ) : (
                    gongGwaLessons.map((g) => (
                      <div
                        key={g.id}
                        className="p-3.5 bg-[#F9F7F2] hover:bg-[#F0ECE4]/40 border border-[#E9E3D8] rounded-2xl flex justify-between items-center transition"
                      >
                        <div className="space-y-1">
                          <h5 className="text-xs font-serif font-extrabold text-[#5A5A40] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#8A9A5B]" />
                            {g.title}
                          </h5>
                          <p className="text-[10px] text-[#7A7A6A] font-medium font-sans">
                            본문: {g.scriptureReference} • 구절 수: {g.verses.length}개 • 문답 수: {g.qnas.length}개
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditingGongGwa(g)}
                            className="p-1.5 text-stone-600 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition cursor-pointer"
                            title="공과 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {gongGwaLessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGongGwa(g.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-100 rounded-lg transition cursor-pointer"
                              title="공과 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Anonymous Prayer Request Management */}
          {rightTab === 'prayers_manage' && (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#8A9A5B] fill-[#8A9A5B]/10" />
                  중보기도 요청 관리 및 모니터링
                </h4>
                <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-bold">
                  총 {prayers.length}건
                </span>
              </div>
              <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                성도님들이 올리신 중보기도 요청을 실시간으로 확인하고 보살필 수 있습니다. 
                기도의 응답이 이루어진 경우 <strong>[응답 완료]</strong>를 설정하면 성도들의 화면에 축하 배너가 함께 표시되며, 부적절한 내용은 신속히 삭제하여 은혜롭고 건강한 나눔판을 유지해 주십시오.
              </p>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {prayers.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-stone-200 rounded-xl">
                    <p className="text-xs text-stone-400 font-bold">등록된 내용이 없습니다.</p>
                  </div>
                ) : (
                  prayers.map((prayer) => {
                    const isEditing = editingPrayerId === prayer.id;
                    return (
                      <div
                        key={prayer.id}
                        className={`p-4 rounded-xl border transition-all ${
                          prayer.status === 'answered'
                            ? 'bg-amber-50/20 border-amber-200'
                            : 'bg-stone-50/50 border-stone-200'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3 animate-fadeIn">
                            <div>
                              <label className="block text-[9px] font-bold text-stone-500 mb-0.5">제목 (최대 40자)</label>
                              <input
                                type="text"
                                required
                                maxLength={40}
                                value={editPrayerTitle}
                                onChange={(e) => setEditPrayerTitle(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-bold"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-stone-500 mb-0.5">분야</label>
                                <select
                                  value={editPrayerCategory}
                                  onChange={(e) => setEditPrayerCategory(e.target.value as any)}
                                  className="w-full text-xs p-1.5 rounded-lg border border-stone-200 bg-white text-stone-800"
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
                              <label className="block text-[9px] font-bold text-stone-500 mb-0.5">기도 내용</label>
                              <textarea
                                required
                                rows={3}
                                maxLength={500}
                                value={editPrayerContent}
                                onChange={(e) => setEditPrayerContent(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 leading-relaxed"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingPrayerId(null)}
                                className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold rounded-lg transition"
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdatePrayer) {
                                    onUpdatePrayer(prayer.id, {
                                      title: editPrayerTitle.trim(),
                                      content: editPrayerContent.trim(),
                                      category: editPrayerCategory,
                                    });
                                  }
                                  setEditingPrayerId(null);
                                }}
                                className="flex-1 py-1.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white text-[10px] font-bold rounded-lg transition"
                              >
                                저장하기
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9.5px] font-black bg-stone-100 border border-stone-200 text-stone-600 px-1.5 py-0.2 rounded">
                                  {prayer.category === 'family' ? '가정' :
                                   prayer.category === 'health' ? '건강' :
                                   prayer.category === 'faith' ? '신앙' :
                                   prayer.category === 'career' ? '학업/취업' : '기타'}
                                </span>
                                <span className="text-[9.5px] text-stone-400 font-mono">
                                  {prayer.date} · 익명
                                </span>
                                <span className="text-[9.5px] text-[#8A9A5B] bg-white border border-[#8A9A5B]/20 px-1.5 py-0.2 rounded font-bold">
                                  ♥ {prayer.amenCount}명 동참
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-[#4A4A4A]">
                                {prayer.title}
                              </h5>
                              <p className="text-[10.5px] text-[#6A6A5A] leading-relaxed whitespace-pre-wrap font-sans bg-white p-2.5 rounded-lg border border-stone-100">
                                {prayer.content}
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-1.5 shrink-0 pt-1 w-[100px]">
                              <button
                                type="button"
                                onClick={() => onTogglePrayerStatus(prayer.id)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer text-center ${
                                  prayer.status === 'answered'
                                    ? 'bg-[#5A5A40] border-[#5A5A40] text-white hover:bg-[#4A4A30]'
                                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                }`}
                              >
                                {prayer.status === 'answered' ? '다시 기도 중' : '🎉 응답 완료'}
                              </button>
                              
                              {onUpdatePrayer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPrayerId(prayer.id);
                                    setEditPrayerTitle(prayer.title);
                                    setEditPrayerContent(prayer.content);
                                    setEditPrayerCategory(prayer.category as any);
                                  }}
                                  className="px-2 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-lg text-[10px] font-bold transition cursor-pointer text-center"
                                >
                                  ✏️ 내용 수정
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setDeletePrayerConfirmId(prayer.id)}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold transition cursor-pointer text-center"
                              >
                                ❌ 삭제하기
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Saint Performance Management (성도별 성과 관리) */}
          {rightTab === 'saints' && (
            <PastorAdminPanel totalVersesCount={verses.length} currentUserRole={userRole} />
          )}

          {/* Tab 4: Announcement Management (교회 공지 관리) */}
          {rightTab === 'announcements_manage' && (
            <div className="space-y-4 bg-[#FDFBF7] p-5 rounded-2xl border border-[#E9E3D8] font-sans">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-[#8A9A5B]" />
                  교회 소식 및 공지 관리
                </h4>
                {editingAnnId === null && (
                  <button
                    type="button"
                    onClick={startNewAnn}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    새 공지 등록
                  </button>
                )}
              </div>

              {editingAnnId !== null ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E9E3D8]">
                  <h5 className="text-xs font-bold text-[#5A5A40]">
                    {editingAnnId === 'new' ? '새 공지 사항 등록' : '공지 사항 수정'}
                  </h5>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-[#7A7A6A]">제목</label>
                        <button
                          type="button"
                          onClick={() => {
                            setAnnTitle('[금주 말씀 토론] 이번주 주신 말씀을 깊이 토론해 봅시다.');
                            setAnnContent('1. 이번주 선포된 말씀 구절에서 가장 은혜받거나 마음에 닿았던 단어나 구절은 무엇인가요?\n\n2. 오늘 배운 공과 배움터의 진리를 우리 삶과 가정, 직장에서 구체적으로 어떻게 적용하고 실천할 수 있을지 함께 나누어 봅시다.');
                          }}
                          className="text-[9px] text-[#8A9A5B] hover:underline font-bold cursor-pointer"
                        >
                          💬 \'금주 말씀 토론\' 템플릿 적용
                        </button>
                      </div>
                      <input
                        type="text"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="공지 제목을 입력해주세요"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">내용</label>
                      <textarea
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="공지 내용을 자세히 작성해주세요"
                        rows={4}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">작성자 (선택)</label>
                      <input
                        type="text"
                        value={annAuthor}
                        onChange={(e) => setAnnAuthor(e.target.value)}
                        placeholder="관리자"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingAnnId(null)}
                      className="flex-1 py-2 border border-[#E9E3D8] hover:bg-stone-50 rounded-lg text-xs font-semibold text-stone-600 transition"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAnn}
                      disabled={!annTitle.trim() || !annContent.trim()}
                      className="flex-1 py-2 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {announcements.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-[#E9E3D8] rounded-xl text-stone-400 text-xs">
                      등록된 공지사항이 아직 없습니다.
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="bg-white p-3.5 rounded-xl border border-[#E9E3D8] hover:border-[#8A9A5B]/30 transition relative group">
                        <div className="pr-16">
                          <h5 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                            {ann.title}
                          </h5>
                          <span className="block text-[9px] text-[#A0A090] mt-0.5 font-mono">
                            {ann.date} • {ann.author || '관리자'}
                          </span>
                          <p className="text-[11px] text-[#5A5A50] mt-2 leading-relaxed whitespace-pre-wrap">
                            {ann.content}
                          </p>
                        </div>
                        <div className="absolute top-3.5 right-3.5 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEditingAnn(ann)}
                            className="p-1 bg-[#F5F5F0] hover:bg-[#8A9A5B] hover:text-white rounded text-stone-600 transition"
                            title="수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAnnouncement && onDeleteAnnouncement(ann.id)}
                            className="p-1 bg-[#F5F5F0] hover:bg-rose-500 hover:text-white rounded text-stone-600 transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Sermon Management (설교요약 관리) */}
          {rightTab === 'sermons_manage' && (
            <div className="space-y-4 bg-[#FDFBF7] p-5 rounded-2xl border border-[#E9E3D8] font-sans">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-[#8A9A5B]" />
                  설교요약 관리
                </h4>
                {editingSermonId === null && (
                  <button
                    type="button"
                    onClick={startNewSermon}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    새 설교요약 등록
                  </button>
                )}
              </div>

              {editingSermonId !== null ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E9E3D8]">
                  <h5 className="text-xs font-bold text-[#5A5A40]">
                    {editingSermonId === 'new' ? '설교요약 등록' : '설교요약 수정'}
                  </h5>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                        설교 원문 전체 입력 (제목/날짜/본문/설교자 정보 포함)
                      </label>
                      <p className="text-[10px] text-stone-400 mb-1.5 leading-relaxed">
                        원문 첫 부분에 아래와 같이 머리말 형식으로 기입하면 실시간으로 자동 파싱되어 등록됩니다.<br />
                        <span className="font-mono bg-stone-50 px-1 py-0.5 rounded text-[#8A9A5B]">
                          제목: 여호와를 경외하는 자의 복<br />
                          날짜: 2026-07-12<br />
                          본문: 시편 128편 1~6절<br />
                          설교자: 홍길동 목사
                        </span>
                      </p>
                      <textarea
                        value={sermonRawText}
                        onChange={(e) => handleSermonRawTextChange(e.target.value)}
                        placeholder="여기에 설교 제목, 날짜, 본문, 설교자 머리말과 함께 설교 원문 내용 전부를 입력하세요."
                        rows={10}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-sans"
                        required
                      />
                    </div>

                    {/* 실시간 자동 파싱 결과 미리보기 */}
                    <div className="bg-[#FDFBF7] p-3 rounded-lg border border-[#E9E3D8]/80 space-y-1.5">
                      <span className="block text-[10px] font-extrabold text-[#8A9A5B]">🔎 실시간 자동 파싱 결과 미리보기</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-stone-400 font-medium">제목: </span>
                          <span className="text-stone-700 font-semibold">{sermonTitle || <span className="text-rose-400 italic">미입력 (파싱 불가)</span>}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-medium">날짜: </span>
                          <span className="text-stone-700 font-semibold">{sermonDate || <span className="text-rose-400 italic">미입력 (파싱 불가)</span>}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-medium">본문: </span>
                          <span className="text-stone-700 font-semibold">{sermonPassage || <span className="text-rose-400 italic">미입력 (파싱 불가)</span>}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-medium">설교자: </span>
                          <span className="text-stone-700 font-semibold">{sermonPreacher || <span className="text-stone-500 italic">담임목사 (기본값)</span>}</span>
                        </div>
                      </div>
                      <div className="border-t border-[#E9E3D8]/40 pt-1.5 mt-1.5">
                        <span className="text-stone-400 text-[10px] block mb-1">설교 내용 (처음 100자 요약):</span>
                        <p className="text-stone-600 text-[11px] leading-relaxed line-clamp-2 italic">
                          {sermonContent || <span className="text-stone-400 italic">본문 내용이 아직 없습니다.</span>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">영상 또는 오디오 링크 (선택)</label>
                      <input
                        type="url"
                        value={sermonUrl}
                        onChange={(e) => setSermonUrl(e.target.value)}
                        placeholder="예: 유튜브 설교 다시보기 링크"
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingSermonId(null)}
                      >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSermon}
                      disabled={!sermonTitle.trim() || !sermonContent.trim() || !sermonDate.trim()}
                      className="flex-1 py-2 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      저장하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {sermons.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-[#E9E3D8] rounded-xl text-stone-400 text-xs">
                      등록된 설교요약이 아직 없습니다.
                    </div>
                  ) : (
                    sermons.map((s) => (
                      <div key={s.id} className="bg-white p-3.5 rounded-xl border border-[#E9E3D8] hover:border-[#8A9A5B]/30 transition relative group">
                        <div className="pr-16">
                          <h5 className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                            {s.title}
                          </h5>
                          <span className="block text-[9px] text-[#A0A090] mt-0.5 font-mono">
                            {s.date} • {s.preacher || '담임목사'} {s.passage ? `• ${s.passage}` : ''}
                          </span>
                          <p className="text-[11px] text-[#5A5A50] mt-2 leading-relaxed whitespace-pre-wrap line-clamp-3 font-serif">
                            {s.content}
                          </p>
                          {s.url && (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer referrer"
                              className="text-[10px] text-[#8A9A5B] hover:underline font-bold mt-2 inline-flex items-center gap-1"
                            >
                              설교 영상/오디오 보기 &rarr;
                            </a>
                          )}
                        </div>
                        <div className="absolute top-3.5 right-3.5 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => startEditingSermon(s)}
                            className="p-1 bg-[#F5F5F0] hover:bg-[#8A9A5B] hover:text-white rounded text-stone-600 transition"
                            title="수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSermon(s.id)}
                            className="p-1 bg-[#F5F5F0] hover:bg-rose-500 hover:text-white rounded text-stone-600 transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Family Worship Management (가정예배 관리) */}
          {rightTab === 'family_worship_manage' && (
            <div className="space-y-4 bg-[#FDFBF7] p-5 rounded-2xl border border-[#E9E3D8] font-sans">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8A9A5B]" />
                  가정예배 및 토론주제 관리
                </h4>
                {editingFwId === null && (
                  <button
                    type="button"
                    onClick={handleStartNewFamilyWorship}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    새 가정예배 등록
                  </button>
                )}
              </div>

              {editingFwId !== null ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E9E3D8]">
                  <h5 className="text-xs font-bold text-[#5A5A40]">
                    {editingFwId === 'new' ? '가정예배 등록' : '가정예배 수정'}
                  </h5>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                          예배 일자
                        </label>
                        <input
                          type="date"
                          value={fwDate}
                          onChange={(e) => setFwDate(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                          예배 예정 시간
                        </label>
                        <input
                          type="time"
                          value={fwTime}
                          onChange={(e) => setFwTime(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                          예배 장소
                        </label>
                        <input
                          type="text"
                          value={fwLocation}
                          onChange={(e) => setFwLocation(e.target.value)}
                          placeholder="예: 거실 또는 대예배실"
                          className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                        예배 제목 (예: 제1주차 가정예배)
                      </label>
                      <input
                        type="text"
                        value={fwTitle}
                        onChange={(e) => setFwTitle(e.target.value)}
                        placeholder="예배 제목을 입력해주세요"
                        className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                          찬송가 (선택)
                        </label>
                        <input
                          type="text"
                          value={fwHymn}
                          onChange={(e) => setFwHymn(e.target.value)}
                          placeholder="예: 찬송가 301장"
                          className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                          성경 본문 구절
                        </label>
                        <input
                          type="text"
                          value={fwPassage}
                          onChange={(e) => setFwPassage(e.target.value)}
                          placeholder="예: 요한복음 3장 16절"
                          className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                        본문 말씀 내용 (선택)
                      </label>
                      <textarea
                        value={fwContent}
                        onChange={(e) => setFwContent(e.target.value)}
                        placeholder="예배 말씀 구절의 전체 텍스트나 설교 요약을 입력해 주세요."
                        rows={3}
                        className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                        행정 메모 및 안내 사항 (선택)
                      </label>
                      <input
                        type="text"
                        value={fwMemo}
                        onChange={(e) => setFwMemo(e.target.value)}
                        placeholder="예: 준비물 찬송가, 주간 성경 구절 필사 확인 등"
                        className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-stone-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#7A7A6A] mb-1">
                        예배 대상 성도 지정 (다중 선택)
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-stone-50 rounded-lg border border-[#E9E3D8] max-h-32 overflow-y-auto">
                        {allSaints.length === 0 ? (
                          <span className="text-[10px] text-stone-400">등록된 성도가 없습니다.</span>
                        ) : (
                          allSaints.map(saint => {
                            const isSelected = fwSelectedMembers.includes(saint.id);
                            return (
                              <button
                                key={saint.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFwSelectedMembers(fwSelectedMembers.filter(id => id !== saint.id));
                                  } else {
                                    setFwSelectedMembers([...fwSelectedMembers, saint.id]);
                                  }
                                }}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                                  isSelected 
                                    ? 'bg-[#8A9A5B] text-white' 
                                    : 'bg-white text-[#5A5A40] border border-[#E9E3D8] hover:bg-stone-100'
                                }`}
                              >
                                {saint.name}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <p className="text-[9px] text-[#909080] mt-1">지정된 성도들의 개인 대시보드에 가정예배 안내 및 D-Day 디스플레이가 우선 표출됩니다.</p>
                    </div>

                    {/* 가정예배 토론주제 질문 1~5 */}
                    <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-[#E9E3D8]/60">
                      <span className="block text-[10px] font-bold text-[#8A9A5B] uppercase tracking-wider mb-1">
                        가정예배 토론주제 (1~5번 질문 등록/수정)
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-stone-500 shrink-0 w-10 text-right">질문 1</span>
                          <input
                            type="text"
                            value={fwQ1}
                            onChange={(e) => setFwQ1(e.target.value)}
                            placeholder="첫 번째 토론 질문을 입력하세요."
                            className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-stone-500 shrink-0 w-10 text-right">질문 2</span>
                          <input
                            type="text"
                            value={fwQ2}
                            onChange={(e) => setFwQ2(e.target.value)}
                            placeholder="두 번째 토론 질문을 입력하세요 (선택)."
                            className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-stone-500 shrink-0 w-10 text-right">질문 3</span>
                          <input
                            type="text"
                            value={fwQ3}
                            onChange={(e) => setFwQ3(e.target.value)}
                            placeholder="세 번째 토론 질문을 입력하세요 (선택)."
                            className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-stone-500 shrink-0 w-10 text-right">질문 4</span>
                          <input
                            type="text"
                            value={fwQ4}
                            onChange={(e) => setFwQ4(e.target.value)}
                            placeholder="네 번째 토론 질문을 입력하세요 (선택)."
                            className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold text-stone-500 shrink-0 w-10 text-right">질문 5</span>
                          <input
                            type="text"
                            value={fwQ5}
                            onChange={(e) => setFwQ5(e.target.value)}
                            placeholder="다섯 번째 토론 질문을 입력하세요 (선택)."
                            className="w-full text-xs p-2 rounded-lg border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingFwId(null)}
                        className="px-3 py-1.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-lg transition"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveFamilyWorship}
                        className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-bold rounded-lg transition"
                      >
                        저장하기
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {familyWorships.length === 0 ? (
                    <div className="text-center py-8 text-[#A0A090] text-xs">
                      등록된 가정예배 정보가 없습니다. 새로 등록해 보세요.
                    </div>
                  ) : (
                    familyWorships.map((fw) => (
                      <div
                        key={fw.id}
                        className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E9E3D8] hover:shadow-xs transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#8A9A5B]/10 px-1.5 py-0.5 rounded-md">
                              {fw.date}
                            </span>
                            <span className="text-xs font-bold text-stone-800">{fw.title}</span>
                          </div>
                          <div className="text-[10px] text-stone-500 flex flex-wrap gap-x-2">
                            {fw.hymn && <span>찬송: {fw.hymn}</span>}
                            {fw.passage && <span className="font-medium text-[#5A5A40]">구절: {fw.passage}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditFamilyWorship(fw)}
                            className="p-1 bg-[#F5F5F0] hover:bg-[#8A9A5B] hover:text-white rounded text-stone-600 transition"
                            title="수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFamilyWorship(fw.id)}
                            className="p-1 bg-[#F5F5F0] hover:bg-rose-500 hover:text-white rounded text-stone-600 transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Church Member Management (교회 회원 관리) */}
          {rightTab === 'members_manage' && (
            <div className="space-y-4 bg-[#FDFBF7] p-5 rounded-2xl border border-[#E9E3D8] font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-[#E0D8C8]">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#8A9A5B]" />
                  교회 회원 및 권한/성과 관리
                </h4>
                <span className="text-[10px] font-bold text-[#8A9A5B] bg-[#8A9A5B]/10 px-2 py-0.5 rounded-full">
                  총 {profilesList.filter(p => userRole === 'master' || p.role !== 'master').length}명
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="이름, 이메일, 전화번호로 실시간 검색..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none"
                />
              </div>

              {/* Members List */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {loadingProfiles ? (
                  <div className="text-center p-6 text-stone-400 text-xs">
                    회원 정보를 불러오는 중입니다...
                  </div>
                ) : profilesList.filter(p => {
                  if (userRole !== 'master' && p.role === 'master') return false;
                  const q = memberSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.email || '').toLowerCase().includes(q) ||
                    (p.phone || '').toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-[#E9E3D8] rounded-xl text-stone-400 text-xs">
                    검색 결과와 일치하는 회원이 없습니다.
                  </div>
                ) : (
                  profilesList.filter(p => {
                    if (userRole !== 'master' && p.role === 'master') return false;
                    const q = memberSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (p.name || '').toLowerCase().includes(q) ||
                      (p.email || '').toLowerCase().includes(q) ||
                      (p.phone || '').toLowerCase().includes(q)
                    );
                  }).map((p) => {
                    const isSelected = selectedMember?.id === p.id;
                    const isInactive = p.role === 'guest' || (p.name || '').includes('(비활성화)');

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedMember(p)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#8A9A5B]/10 border-[#8A9A5B] shadow-xs'
                            : isInactive
                            ? 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-90'
                            : 'bg-white border-[#E9E3D8] hover:border-[#8A9A5B]/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#4A4A4A]">
                              {p.name || '무명 성도'}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                              p.role === 'master' ? 'bg-[#5A5A40] text-white' :
                              p.role === 'pastor' ? 'bg-[#8A9A5B]/20 text-[#5A5A40]' :
                              p.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                              p.role === 'guest' ? 'bg-stone-200 text-stone-600' :
                              'bg-emerald-50 text-emerald-800'
                            }`}>
                              {p.role === 'master' ? '마스터' :
                               p.role === 'pastor' ? '목사/교사' :
                               p.role === 'admin' ? '관리자' :
                               p.role === 'guest' ? '대기/비활성' : '성도'}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {p.email || '이메일 없음'} • {p.phone || '연락처 없음'}
                          </p>
                        </div>

                        {/* Action buttons inside list */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.role}
                            onChange={(e) => handleUpdateMemberRole(p.id, e.target.value as AppRole)}
                            className="text-[10px] p-1 rounded border border-[#E9E3D8] bg-white text-[#4A4A4A]"
                          >
                            <option value="member">성도(Member)</option>
                            <option value="pastor">목사/교사(Pastor)</option>
                            <option value="admin">관리자(Admin)</option>
                            <option value="guest">대기자(Guest)</option>
                            {userRole === 'master' && (
                              <option value="master">마스터(Master)</option>
                            )}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Member Details (Scripture Recital Submission Tracker) */}
              {selectedMember && (
                <div className="bg-white p-3.5 rounded-xl border border-[#E9E3D8] space-y-2.5">
                  <div className="flex justify-between items-center pb-1.5 border-b border-stone-100">
                    <h5 className="text-[11px] font-bold text-[#5A5A40] flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#8A9A5B]" />
                      <span>{selectedMember.name} 성도의 암송 및 학습 성과</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="text-[10px] text-stone-400 hover:text-stone-600"
                    >
                      닫기
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] text-stone-500 flex justify-between font-serif">
                      <span>역할: <strong className="text-[#5A5A40] font-sans">{selectedMember.role}</strong></span>
                      <span>연락처: <strong className="text-stone-700 font-sans">{selectedMember.phone || '-'}</strong></span>
                    </div>

                    <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-stone-100">
                      <div className="flex justify-between text-[10px] font-bold text-[#5A5A40] mb-1.5">
                        <span>암송 제출 현황 ({memberSubmissions.length}회)</span>
                        <span className="text-[#8A9A5B] font-mono">가장 최근 제출일: {memberSubmissions[0] ? new Date(memberSubmissions[0].submitted_at).toLocaleDateString() : '-'}</span>
                      </div>

                      <div className="max-h-[120px] overflow-y-auto space-y-1 pr-0.5">
                        {memberSubmissions.length === 0 ? (
                          <div className="text-center py-4 text-stone-400 text-[10px]">
                            제출된 말씀 암송 내역이 없습니다.
                          </div>
                        ) : (
                          memberSubmissions.map((sub, idx) => (
                            <div key={sub.id || idx} className="bg-white px-2 py-1.5 rounded border border-stone-100 flex justify-between items-center text-[10px] font-serif">
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#5A5A40] block">{sub.verse_ref || '암송 구절'}</span>
                                <span className="text-stone-400 block text-[9px] font-mono">제출 상태: {sub.is_approved ? '✅ 승인완료' : (sub.approved_by ? '❌ 반려됨' : '⏳ 대기중')}</span>
                              </div>
                              <span className="text-stone-400 font-mono text-[9px] shrink-0">
                                {new Date(sub.submitted_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        {rightTab === 'scriptures' && (
            <ScriptureCms
              verses={verses}
              onAddVerse={onAddVerse}
              onUpdateVerse={onUpdateVerse}
              onUpdateMultipleVerses={onUpdateMultipleVerses}
              onDeleteVerse={onDeleteVerse}
              onDeleteMultipleVerses={onDeleteMultipleVerses}
              onImportVerses={onImportVerses}
              pinnedVerseId={pinnedVerseId}
              pinnedMonthVerseId={pinnedMonthVerseId}
              onPinVerse={onPinVerse || (() => {})}
              onPinMonthVerse={onPinMonthVerse || (() => {})}
              onClose={onClose}
            />
          )}
        </div>

            {/* Custom Prayer Deletion Confirm Modal to Bypass iframe window.confirm Restrictions */}
      {deletePrayerConfirmId && (() => {
        const prayerToDelete = prayers.find(p => p.id === deletePrayerConfirmId);
        if (!prayerToDelete) return null;
        return (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 max-w-sm w-full shadow-xl text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-[#5A5A40]">중보기도 제목 삭제 확인</h3>
                <p className="text-xs text-[#7A7A6A] mt-1.5 leading-relaxed font-sans">
                  정말 <strong>"{prayerToDelete.title}"</strong> 중보기도 제목을 영구적으로 삭제하시겠습니까?<br />
                  삭제 시 해당 기도내용 및 아멘 동참 기록이 영구히 지워집니다.
                </p>
              </div>
              <div className="flex gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    onDeletePrayer(deletePrayerConfirmId);
                    setDeletePrayerConfirmId(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  네, 삭제합니다
                </button>
                <button
                  type="button"
                  onClick={() => setDeletePrayerConfirmId(null)}
                  className="flex-1 py-2.5 bg-[#F5F5F0] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl hover:bg-[#E9E3D8] transition cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Custom Reset Confirm Modal to Bypass iframe window.confirm Restrictions */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-6 max-w-sm w-full shadow-xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#5A5A40]">기본 성구 초기화 확인</h3>
              <p className="text-xs text-[#7A7A6A] mt-1.5 leading-relaxed font-sans">
                정말 <strong>기본 성구 목록</strong>으로 되돌리시겠습니까?<br />
                기존에 임의로 추가하거나 가져온 모든 성구 말씀이 삭제되고, 기본 수록된 성구로 교체됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => {
                  onResetToDefaults();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                네, 초기화합니다
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-[#F5F5F0] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl hover:bg-[#E9E3D8] transition cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
