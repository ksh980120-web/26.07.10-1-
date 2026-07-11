/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Award,
  Settings,
  Flame,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  BookMarked,
  Share2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Trophy,
  History,
  Check,
  ClipboardList,
  Mic,
  Edit3,
  Trash2,
  Heart,
  Megaphone,
  Plus,
  X
} from 'lucide-react';

import { Verse, VerseStatus, MemorizeStatus, TestAttempt, GongGwa, AnonymousPrayer, Announcement, VerseSubmission } from './types';
import BlankPractice from './components/BlankPractice';
import WriteTest from './components/WriteTest';
import ManagerPanel from './components/ManagerPanel';
import SpeakAlong from './components/SpeakAlong';
import PersonalFaithNote from './components/PersonalFaithNote';
import MainLanding from './components/MainLanding';
import GongGwaPanel from './components/GongGwaPanel';
import AnonymousPrayerPanel from './components/AnonymousPrayerPanel';
import {
  fetchVerses,
  saveVerseToDb,
  deleteVerseFromDb,
  fetchUserStatuses,
  saveStatusToDb,
  fetchUserAttempts,
  saveAttemptToDb,
  fetchPrayersFromDb,
  savePrayerToDb,
  deletePrayerFromDb,
  updateSaintCompletedCountInDb,
  AppUser,
  fetchLessonsFromDb,
  saveLessonToDb,
  deleteLessonFromDb,
  fetchAnnouncements,
  saveAnnouncementToDb,
  deleteAnnouncementFromDb,
  onAuthStateChange,
  submitVerseToPastor,
  fetchSubmissions,
  updateSubmissionStatus,
  fetchUserSubmissions,
  supabase
} from './lib/supabase';

export default function App() {
  // --- STATE DEFINITIONS ---
  const [verses, setVerses] = useState<Verse[]>([]);
  const [verseStatuses, setVerseStatuses] = useState<{ [key: string]: VerseStatus }>({});
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(0); // 0 means All, 1-4 for specific quarters
  const [pinnedVerseId, setPinnedVerseId] = useState<string>('');
  const [pinnedMonthVerseId, setPinnedMonthVerseId] = useState<string>('');
  const [gongGwaLessons, setGongGwaLessons] = useState<GongGwa[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddAnnForm, setShowAddAnnForm] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnAuthor, setNewAnnAuthor] = useState('');
  
  // Weekly verse submissions state
  const [userSubmissions, setUserSubmissions] = useState<VerseSubmission[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState<{ [verseId: string]: boolean }>({});
  const [submissionError, setSubmissionError] = useState<{ [verseId: string]: string | null }>({});
  
  const [isCommonDataLoading, setIsCommonDataLoading] = useState<boolean>(true);
  const [commonDataError, setCommonDataError] = useState<string | null>(null);
  
  // Navigation / Mode states
  const [activeView, setActiveView] = useState<'list' | 'blank_practice' | 'write_test' | 'speak_along'>('list');
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [showPastorPanel, setShowPastorPanel] = useState(false); // New pastor dashboard view state
  const [showMeditationIntro, setShowMeditationIntro] = useState(true);
  
  // Tab layout: 'community' (Church-wide verses), 'gonggwa' (weekly lesson), 'personal' (Personal Faith Notebook), or 'prayer' (Anonymous prayer board)
  const [activeMainTab, setActiveMainTab] = useState<'community' | 'gonggwa' | 'personal' | 'prayer'>('community');

  // Anonymous Prayers state
  const [prayers, setPrayers] = useState<AnonymousPrayer[]>(() => {
    try {
      const saved = localStorage.getItem('manna_anonymous_prayers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'prayer-default-1',
        category: 'health',
        title: '요양병원에 계신 노모의 호흡기 질환 완쾌를 구합니다.',
        content: '연로하신 어머님께서 요양병원에 계시는데, 최근 환절기 독감과 폐렴 증세가 겹쳐 무척 고통스러워하십니다. 주님의 자비로운 손길로 호흡기를 어루만져 주시고, 깨끗이 치유와 회복의 기적이 임하도록 함께 두 손 모아 주시면 감사하겠습니다.',
        date: '2026.07.03',
        amenCount: 14,
        status: 'praying'
      },
      {
        id: 'prayer-default-2',
        category: 'career',
        title: '고3 수험생 자녀가 시험 스트레스 속에 평안을 누리길 원합니다.',
        content: '올해 대학 시험을 준비하는 우리 아이가 심리적 압박감과 불면증으로 깊은 피로를 겪고 있습니다. 눈앞의 성적보다 주님이 주시는 선한 동행을 신뢰하게 하시고, 평안한 마음과 담대함을 부어주시길 간절히 소망합니다.',
        date: '2026.07.06',
        amenCount: 9,
        status: 'praying'
      },
      {
        id: 'prayer-default-3',
        category: 'faith',
        title: '가정예배의 제단이 다시 쌓여 온 가족이 주를 섬기게 하소서.',
        content: '분주하다는 핑계로 오랫동안 가정예배를 드리지 못했습니다. 다시금 남편과 아이들과 함께 일주일에 한 번씩 말씀 앞에 머무르며 하나님을 기쁘시게 하는 기도의 제단을 회복하는 믿음의 가정 되길 기도합니다.',
        date: '2026.07.08',
        amenCount: 22,
        status: 'answered'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('manna_anonymous_prayers', JSON.stringify(prayers));
    } catch (e) {
      console.error(e);
    }
  }, [prayers]);

  const handleAddPrayer = async (entry: AnonymousPrayer) => {
    setPrayers(prev => [entry, ...prev]);
    if (userRole !== 'guest') {
      await savePrayerToDb(currentUserId || null, entry);
    }
  };

  const handleUpdatePrayer = async (id: string, updatedFields: Partial<AnonymousPrayer>) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    const updated = prayers.find(p => p.id === id);
    if (updated && userRole !== 'guest') {
      await savePrayerToDb(currentUserId || null, { ...updated, ...updatedFields });
    }
  };

  const handleIncrementAmen = async (id: string, isAdding: boolean = true) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, amenCount: Math.max(0, p.amenCount + (isAdding ? 1 : -1)) } : p));
    const target = prayers.find(p => p.id === id);
    if (target && userRole !== 'guest') {
      await savePrayerToDb(currentUserId || null, { ...target, amenCount: Math.max(0, target.amenCount + (isAdding ? 1 : -1)) });
    }
  };

  const handleDeletePrayer = async (id: string) => {
    setPrayers(prev => prev.filter(p => p.id !== id));
    if (userRole !== 'guest') {
      await deletePrayerFromDb(id);
    }
  };

  const handleTogglePrayerStatus = async (id: string) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'praying' ? 'answered' : 'praying' } : p));
    const target = prayers.find(p => p.id === id);
    if (target && userRole !== 'guest') {
      await savePrayerToDb(currentUserId || null, { ...target, status: target.status === 'praying' ? 'answered' : 'praying' });
    }
  };
 
  // --- USER AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const role = sessionStorage.getItem('hagah_user_role');
    if (role === 'guest') {
      sessionStorage.removeItem('hagah_user_authenticated');
      sessionStorage.removeItem('hagah_user_role');
      sessionStorage.removeItem('hagah_user_id');
      sessionStorage.removeItem('hagah_user_name');
      sessionStorage.removeItem('hagah_user_phone');
      return false;
    }
    return sessionStorage.getItem('hagah_user_authenticated') === 'true';
  });
  const [userRole, setUserRole] = useState<'master' | 'pastor' | 'admin' | 'member' | 'guest' | null>(() => {
    const role = sessionStorage.getItem('hagah_user_role');
    return role === 'guest' ? null : (role as any);
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return sessionStorage.getItem('hagah_user_id') || 'guest';
  });
  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return sessionStorage.getItem('hagah_user_name') || '성도';
  });
  const [currentUserPhone, setCurrentUserPhone] = useState<string>(() => {
    return sessionStorage.getItem('hagah_user_phone') || '';
  });

  // --- REAL-TIME AUTH STATE LISTENER (onAuthStateChange) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserRole(user.role);
        setCurrentUserId(user.id);
        setCurrentUserName(user.name);
        setCurrentUserPhone(user.phone || '');
        
        // If logged in as master, pastor, or admin, automatically authenticate the admin view too!
        if (user.role === 'master' || user.role === 'pastor' || user.role === 'admin') {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('hagah_admin_auth', 'true');
        } else {
          setIsAdminAuthenticated(false);
          sessionStorage.removeItem('hagah_admin_auth');
        }

        // Persist session to session storage
        sessionStorage.setItem('hagah_user_authenticated', 'true');
        sessionStorage.setItem('hagah_user_id', user.id);
        sessionStorage.setItem('hagah_user_role', user.role);
        sessionStorage.setItem('hagah_user_name', user.name);
        sessionStorage.setItem('hagah_user_phone', user.phone || '');
      } else {
        const isCurrentlyGuest = sessionStorage.getItem('hagah_user_role') === 'guest';
        if (!isCurrentlyGuest) {
          setIsAuthenticated(false);
          setUserRole(null);
          setCurrentUserId('guest');
          setCurrentUserName('성도');
          setCurrentUserPhone('');
          setIsAdminAuthenticated(false);
          
          sessionStorage.removeItem('hagah_user_authenticated');
          sessionStorage.removeItem('hagah_user_role');
          sessionStorage.removeItem('hagah_user_id');
          sessionStorage.removeItem('hagah_user_name');
          sessionStorage.removeItem('hagah_user_phone');
          sessionStorage.removeItem('hagah_admin_auth');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('hagah_admin_auth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Quick self-quiz visibility helper (which cards have blurred text)
  const [blurredCards, setBlurredCards] = useState<{ [key: string]: boolean }>({});

  // Sort order: 'latest' (최신순) or 'oldest' (과거순)
  const [verseSortOrder, setVerseSortOrder] = useState<'latest' | 'oldest'>('latest');

  // Currently being edited verse by admin
  const [adminEditingVerse, setAdminEditingVerse] = useState<Verse | null>(null);

  // State to track custom deletion confirmation for individual card to bypass iframe confirm constraints
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to de-duplicate verses by reference and text
  const deduplicateVerses = (list: Verse[]): Verse[] => {
    const unique: Verse[] = [];
    const seen = new Set<string>();
    list.forEach(v => {
      const refKey = v.reference.trim().replace(/\s+/g, '');
      const textKey = v.text.trim().replace(/\s+/g, '');
      const key = `${refKey}_${textKey}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(v);
      }
    });
    return unique;
  };

  // --- DATABASE DATA LOADING ---
  useEffect(() => {
    const loadCoreData = async () => {
      setIsCommonDataLoading(true);
      setCommonDataError(null);

      // Clean legacy localStorage keys for common data to respect: "localStorage에 남아있는 공용 데이터는 모두 제거해주세요."
      localStorage.removeItem('hagah_verses');
      localStorage.removeItem('hagah_gonggwa_lessons');
      localStorage.removeItem('hagah_announcements');

      try {
        // 1. Load Verses from Supabase
        const dbVerses = await fetchVerses();
        setVerses(deduplicateVerses(dbVerses || []));

        // 2. Load Gonggwa from Supabase
        const dbLessons = await fetchLessonsFromDb();
        setGongGwaLessons(dbLessons || []);

        // 3. Load Announcements from Supabase
        const dbAnnouncements = await fetchAnnouncements();
        setAnnouncements(dbAnnouncements || []);

        // 4. Load Prayers
        const dbPrayers = await fetchPrayersFromDb();
        if (dbPrayers && dbPrayers.length > 0) {
          setPrayers(dbPrayers);
        }
      } catch (e) {
        console.error("Error loading core data:", e);
        setCommonDataError("학장교회 데이터를 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인해 주세요.");
      } finally {
        setIsCommonDataLoading(false);
      }
    };

    loadCoreData();
  }, [isAdminAuthenticated]);

  // --- REAL-TIME POLL & SYNC COMMON DATA FROM SUPABASE ---
  useEffect(() => {
    const syncCommonData = async () => {
      try {
        // 1. Sync Verses
        const dbVerses = await fetchVerses();
        if (dbVerses) {
          setVerses(deduplicateVerses(dbVerses));
        }

        // 2. Sync Lessons
        const dbLessons = await fetchLessonsFromDb();
        if (dbLessons) {
          setGongGwaLessons(dbLessons);
        }

        // 3. Sync Announcements
        const dbAnnouncements = await fetchAnnouncements();
        if (dbAnnouncements) {
          setAnnouncements(dbAnnouncements);
        }
      } catch (e) {
        console.error("Error syncing data:", e);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(syncCommonData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load user-specific data (statuses, attempts) on user change
  useEffect(() => {
    const loadUserSpecificData = async () => {
      if (!isAuthenticated || userRole === 'guest' || !currentUserId) {
        setVerseStatuses({});
        setAttempts([]);
        setUserSubmissions([]);
        return;
      }

      // Load Statuses
      const dbStatuses = await fetchUserStatuses(currentUserId);
      setVerseStatuses(dbStatuses);

      // Load Attempts
      const dbAttempts = await fetchUserAttempts(currentUserId);
      setAttempts(dbAttempts);

      // Load Submissions
      const dbSubs = await fetchUserSubmissions(currentUserId);
      setUserSubmissions(dbSubs);
    };

    loadUserSpecificData();
  }, [currentUserId, userRole, isAuthenticated]);

  // Sync state with browser back/forward buttons (supporting hardware back button and swipe gestures)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        if (event.state.view === 'manager') {
          setShowManager(true);
          setActiveView('list');
        } else {
          setShowManager(false);
          setActiveView(event.state.view || 'list');
          setSelectedVerseId(event.state.verseId || null);
        }
      } else {
        setActiveView('list');
        setSelectedVerseId(null);
        setShowManager(false);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Initialize state on first load if it's empty
    if (!window.history.state) {
      window.history.replaceState({ view: 'list', verseId: null }, '');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Scroll to top on any view or main tab transition (crucial for mobile UX)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeView, activeMainTab, showManager, showPastorPanel]);

  const goBack = () => {
    if (showManager) {
      setShowManager(false);
      window.history.pushState({ view: 'list', verseId: null }, '');
    } else if (window.history.state && window.history.state.view !== 'list') {
      window.history.back();
    } else {
      setActiveView('list');
      setSelectedVerseId(null);
    }
  };

  // Sync back to state
  const saveVerses = (updatedVerses: Verse[]) => {
    const cleaned = deduplicateVerses(updatedVerses);
    setVerses(cleaned);
  };

  const saveStatuses = async (updatedStatuses: { [key: string]: VerseStatus }) => {
    setVerseStatuses(updatedStatuses);
    if (userRole !== 'guest') {
      if (currentUserId) {
        // Save to Supabase
        for (const verseId of Object.keys(updatedStatuses)) {
          await saveStatusToDb(currentUserId, updatedStatuses[verseId]);
        }
        
        // Auto-sync Saint Progress (Completed Verses count) for member
        if (userRole === 'member') {
          const completedCount = Object.values(updatedStatuses).filter(s => s.status === 'completed').length;
          const totalCount = verses.length || 12;
          const dateStr = new Date().toLocaleDateString('ko-KR').slice(0, -1);
          await updateSaintCompletedCountInDb(currentUserId, completedCount, totalCount, dateStr);
        }
      }
    }
  };

  const saveAttempts = async (updatedAttempts: TestAttempt[]) => {
    setAttempts(updatedAttempts);
    if (userRole !== 'guest') {
      if (currentUserId && updatedAttempts.length > 0) {
        await saveAttemptToDb(currentUserId, updatedAttempts[0]);
      }
    }
  };

  const handleSubmitVerseToPastor = async (weeklyVerseId: string) => {
    if (!currentUserId) return;
    
    setSubmissionError(prev => ({ ...prev, [weeklyVerseId]: null }));
    setSubmissionLoading(prev => ({ ...prev, [weeklyVerseId]: true }));
    
    try {
      const res = await submitVerseToPastor(currentUserId, weeklyVerseId);
      if (res.success) {
        // Reload submissions
        const dbSubs = await fetchUserSubmissions(currentUserId);
        setUserSubmissions(dbSubs);
      } else {
        setSubmissionError(prev => ({ ...prev, [weeklyVerseId]: res.message || '제출 도중 오류가 발생했습니다.' }));
      }
    } catch (e: any) {
      console.error(e);
      setSubmissionError(prev => ({ ...prev, [weeklyVerseId]: '네트워크 오류가 발생했습니다.' }));
    } finally {
      setSubmissionLoading(prev => ({ ...prev, [weeklyVerseId]: false }));
    }
  };

  const saveGongGwaLessons = async (updatedGongGwa: GongGwa[]) => {
    // Find deleted lessons
    const deletedLessons = gongGwaLessons.filter(oldL => !updatedGongGwa.some(newL => newL.id === oldL.id));
    
    setGongGwaLessons(updatedGongGwa);
    
    if (isAdminAuthenticated) {
      for (const oldL of deletedLessons) {
        await deleteLessonFromDb(oldL.id);
      }
      for (const lesson of updatedGongGwa) {
        await saveLessonToDb(lesson);
      }
    }
  };

  // Find a verse by ID from either the main verses list or GongGwa lesson verses list
  const findVerseById = (id: string | null): Verse | undefined => {
    if (!id) return undefined;
    
    // 1. Search in main verses
    const mainVerse = verses.find(v => v.id === id);
    if (mainVerse) return mainVerse;

    // 2. Search in GongGwa lessons
    for (const lesson of gongGwaLessons) {
      const gv = lesson.verses.find(v => v.id === id);
      if (gv) {
        return {
          id: gv.id,
          reference: gv.reference,
          text: gv.text,
          quarter: 0,
          week: 0,
          hint: gv.hint || '',
          isCustom: true
        };
      }
    }

    return undefined;
  };

  // --- CORE LOGIC & ACTIONS ---

  // Pin a verse as "금주의 암송 성구"
  const handlePinVerse = (id: string) => {
    const newPinId = pinnedVerseId === id ? '' : id;
    setPinnedVerseId(newPinId);
    localStorage.setItem('hagah_pinned_verse', newPinId);
  };

  // Pin a verse as "금월의 암송 성구"
  const handlePinMonthVerse = (id: string) => {
    const newPinId = pinnedMonthVerseId === id ? '' : id;
    setPinnedMonthVerseId(newPinId);
    localStorage.setItem('hagah_pinned_month_verse', newPinId);
  };

  // Add verse
  const handleAddVerse = async (newVerseData: Omit<Verse, 'id'>) => {
    const newVerse: Verse = {
      ...newVerseData,
      id: `verse-custom-${Date.now()}`,
      isCustom: true
    };
    const updated = [...verses, newVerse];
    saveVerses(updated);

    if (isAdminAuthenticated) {
      await saveVerseToDb(newVerse);
    }

    // Initialize default status
    const updatedStatuses = {
      ...verseStatuses,
      [newVerse.id]: {
        verseId: newVerse.id,
        status: 'not_started' as MemorizeStatus,
        streak: 0
      }
    };
    saveStatuses(updatedStatuses);
  };

  // Update verse
  const handleUpdateVerse = async (id: string, updatedFields: Partial<Verse>) => {
    const updated = verses.map(v => v.id === id ? { ...v, ...updatedFields } : v);
    saveVerses(updated);

    const target = updated.find(v => v.id === id);
    if (target && isAdminAuthenticated) {
      await saveVerseToDb(target);
    }
  };

  // Delete verse
  const handleDeleteVerse = async (id: string) => {
    const updated = verses.filter(v => v.id !== id);
    saveVerses(updated);

    if (isAdminAuthenticated) {
      await deleteVerseFromDb(id);
    }

    const updatedStatuses = { ...verseStatuses };
    delete updatedStatuses[id];
    saveStatuses(updatedStatuses);

    if (pinnedVerseId === id) {
      setPinnedVerseId('');
      localStorage.removeItem('hagah_pinned_verse');
    }
  };

  // Import code from manager
  const handleImportVerses = async (imported: Verse[]) => {
    // Generate new unique ids for imported verses to prevent collision, and mark them as custom
    const processedImported = imported.map((v, i) => ({
      ...v,
      id: `verse-import-${Date.now()}-${i}`,
      isCustom: true
    }));

    // We can replace existing, or append. Let's merge them!
    const merged = [...verses.filter(v => !v.isCustom), ...processedImported];
    saveVerses(merged);

    if (isAdminAuthenticated) {
      for (const v of processedImported) {
        await saveVerseToDb(v);
      }
    }

    // Initialize statuses for imported verses
    const updatedStatuses = { ...verseStatuses };
    processedImported.forEach(v => {
      if (!updatedStatuses[v.id]) {
        updatedStatuses[v.id] = {
          verseId: v.id,
          status: 'not_started',
          streak: 0
        };
      }
    });
    saveStatuses(updatedStatuses);
  };

  // Reset to default presets
  const handleResetToDefaults = async () => {
    saveStatuses({});
    setPinnedVerseId('');
    localStorage.removeItem('hagah_pinned_verse');
  };

  // Add Announcement
  const handleAddAnnouncement = async (title: string, content: string, author?: string) => {
    const finalAuthor = author || currentUserName || '관리자';
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      author: finalAuthor,
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);

    if (isAdminAuthenticated) {
      await saveAnnouncementToDb(newAnn);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);

    if (isAdminAuthenticated) {
      await deleteAnnouncementFromDb(id);
    }
  };

  const handleNewAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;
    await handleAddAnnouncement(newAnnTitle, newAnnContent, newAnnAuthor.trim());
    setNewAnnTitle('');
    setNewAnnContent('');
    setNewAnnAuthor('');
    setShowAddAnnForm(false);
  };

  const handleStartApp = (user: AppUser) => {
    setIsAuthenticated(true);
    setUserRole(user.role);
    setCurrentUserId(user.id);
    setCurrentUserName(user.name);
    setCurrentUserPhone(user.phone || '');
    
    sessionStorage.setItem('hagah_user_authenticated', 'true');
    sessionStorage.setItem('hagah_user_id', user.id);
    sessionStorage.setItem('hagah_user_role', user.role);
    sessionStorage.setItem('hagah_user_name', user.name);
    sessionStorage.setItem('hagah_user_phone', user.phone || '');

    // If logged in as master, pastor, or admin, automatically authenticate the admin view too!
    if (user.role === 'master' || user.role === 'pastor' || user.role === 'admin') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('hagah_admin_auth', 'true');
    } else {
      setIsAdminAuthenticated(false);
      sessionStorage.removeItem('hagah_admin_auth');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '1004' || adminPassword === 'hakjang1004') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('hagah_admin_auth', 'true');
      setAdminPassword('');
      setAdminError('');
    } else {
      setAdminError('비밀번호가 올바르지 않습니다. 본 페이지는 등록된 목회자 및 말씀 암송 담당자 전용 공간입니다.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('hagah_admin_auth');
    setShowManager(false);
  };

  const handleAddPersonalVerse = (newVerseData: Omit<Verse, 'id' | 'isPersonal' | 'quarter' | 'week'>) => {
    const newVerse: Verse = {
      ...newVerseData,
      id: `verse-personal-${Date.now()}`,
      isPersonal: true,
      quarter: 1,
      week: 1
    };
    const updated = [...verses, newVerse];
    saveVerses(updated);

    // Initialize status
    const updatedStatuses = {
      ...verseStatuses,
      [newVerse.id]: {
        verseId: newVerse.id,
        status: 'not_started' as MemorizeStatus,
        streak: 0
      }
    };
    saveStatuses(updatedStatuses);
  };

  // Update status manually
  const handleStatusChange = (id: string, newStatus: MemorizeStatus) => {
    const current = verseStatuses[id] || { verseId: id, status: 'not_started', streak: 0 };
    const updatedStatuses = {
      ...verseStatuses,
      [id]: {
        ...current,
        status: newStatus
      }
    };
    saveStatuses(updatedStatuses);
  };

  // Triggered when a blank filling exercise is completed
  const handleBlankComplete = (score: number) => {
    if (!selectedVerseId) return;

    // Save test attempt
    const targetVerse = findVerseById(selectedVerseId);
    if (targetVerse) {
      const newAttempt: TestAttempt = {
        id: `attempt-${Date.now()}`,
        verseId: selectedVerseId,
        reference: targetVerse.reference,
        date: new Date().toLocaleDateString(),
        userText: '(구간 빈칸 연습)',
        correctText: targetVerse.text,
        score,
        mode: 'blank_fill'
      };
      saveAttempts([newAttempt, ...attempts]);

      // Update verse stats
      const currentStatus = verseStatuses[selectedVerseId] || {
        verseId: selectedVerseId,
        status: 'not_started' as MemorizeStatus,
        streak: 0
      };
      
      let nextStatus = currentStatus.status;
      if (score === 100) {
        nextStatus = 'completed';
      } else if (currentStatus.status === 'not_started') {
        nextStatus = 'memorizing';
      }

      const updatedStatuses = {
        ...verseStatuses,
        [selectedVerseId]: {
          ...currentStatus,
          status: nextStatus,
          bestScore: Math.max(currentStatus.bestScore || 0, score),
          lastTested: new Date().toLocaleDateString()
        }
      };
      saveStatuses(updatedStatuses);
    }

    // Go back to list view
    setActiveView('list');
    setSelectedVerseId(null);
  };

  // Triggered when a full writing test is completed
  const handleWriteComplete = (score: number, userText: string) => {
    if (!selectedVerseId) return;

    const targetVerse = findVerseById(selectedVerseId);
    if (targetVerse) {
      const newAttempt: TestAttempt = {
        id: `attempt-${Date.now()}`,
        verseId: selectedVerseId,
        reference: targetVerse.reference,
        date: new Date().toLocaleDateString(),
        userText,
        correctText: targetVerse.text,
        score,
        mode: 'full_write'
      };
      saveAttempts([newAttempt, ...attempts]);

      // Update status
      const currentStatus = verseStatuses[selectedVerseId] || {
        verseId: selectedVerseId,
        status: 'not_started' as MemorizeStatus,
        streak: 0
      };

      let nextStatus = currentStatus.status;
      if (score === 100) {
        nextStatus = 'completed';
      } else if (score >= 60) {
        nextStatus = 'memorizing';
      }

      const updatedStatuses = {
        ...verseStatuses,
        [selectedVerseId]: {
          ...currentStatus,
          status: nextStatus,
          bestScore: Math.max(currentStatus.bestScore || 0, score),
          lastTested: new Date().toLocaleDateString()
        }
      };
      saveStatuses(updatedStatuses);

      // Increment daily streak on successful test attempt
      if (score >= 80) {
        const todayStr = new Date().toLocaleDateString();
        const lastSuccessDate = localStorage.getItem('hagah_last_success_date');
        if (lastSuccessDate !== todayStr) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('hagah_streak', String(newStreak));
          localStorage.setItem('hagah_last_success_date', todayStr);
        }
      }
    }

    setActiveView('list');
    setSelectedVerseId(null);
  };

  // Triggered when a speak along attempt is completed
  const handleSpeakComplete = (score: number) => {
    if (!selectedVerseId) return;

    const targetVerse = findVerseById(selectedVerseId);
    if (targetVerse) {
      const newAttempt: TestAttempt = {
        id: `attempt-${Date.now()}`,
        verseId: selectedVerseId,
        reference: targetVerse.reference,
        date: new Date().toLocaleDateString(),
        userText: '(음성 따라말하기 선포)',
        correctText: targetVerse.text,
        score,
        mode: 'speak_along'
      };
      saveAttempts([newAttempt, ...attempts]);

      // Update status
      const currentStatus = verseStatuses[selectedVerseId] || {
        verseId: selectedVerseId,
        status: 'not_started' as MemorizeStatus,
        streak: 0
      };

      let nextStatus = currentStatus.status;
      if (score === 100) {
        nextStatus = 'completed';
      } else if (score >= 60) {
        nextStatus = 'memorizing';
      }

      const updatedStatuses = {
        ...verseStatuses,
        [selectedVerseId]: {
          ...currentStatus,
          status: nextStatus,
          bestScore: Math.max(currentStatus.bestScore || 0, score),
          lastTested: new Date().toLocaleDateString()
        }
      };
      saveStatuses(updatedStatuses);

      // Increment streak
      if (score >= 80) {
        const todayStr = new Date().toLocaleDateString();
        const lastSuccessDate = localStorage.getItem('hagah_last_success_date');
        if (lastSuccessDate !== todayStr) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('hagah_streak', String(newStreak));
          localStorage.setItem('hagah_last_success_date', todayStr);
        }
      }
    }

    setActiveView('list');
    setSelectedVerseId(null);
  };

  const startBlankPractice = (verseId: string) => {
    setSelectedVerseId(verseId);
    setActiveView('blank_practice');
    window.history.pushState({ view: 'blank_practice', verseId }, '');
  };

  const startWriteTest = (verseId: string) => {
    setSelectedVerseId(verseId);
    setActiveView('write_test');
    window.history.pushState({ view: 'write_test', verseId }, '');
  };

  const startSpeakAlong = (verseId: string) => {
    setSelectedVerseId(verseId);
    setActiveView('speak_along');
    window.history.pushState({ view: 'speak_along', verseId }, '');
  };

  const toggleBlurCard = (verseId: string) => {
    setBlurredCards(prev => ({
      ...prev,
      [verseId]: !prev[verseId]
    }));
  };

  // --- FILTERS & METRICS ---
  const filteredVerses = (selectedQuarter === 0
    ? verses
    : verses.filter(v => v.quarter === selectedQuarter)
  ).filter(v => !v.isPersonal);

  // Find the verse with the latest date to be marked as "금주암송성구"
  const latestVerse = [...verses]
    .filter(v => v.date && !v.isPersonal)
    .sort((a, b) => b.date!.localeCompare(a.date!))[0];
  const latestVerseId = latestVerse ? latestVerse.id : '';

  // Find the pinned/weekly verse object. Default to latest verse if none is explicitly pinned.
  const activePinnedId = pinnedVerseId || latestVerseId;
  const pinnedVerse = verses.find(v => v.id === activePinnedId);

  // Find the monthly pinned verse object.
  const pinnedMonthVerse = verses.find(v => v.id === pinnedMonthVerseId);

  // Sorting: Prioritize pinned/weekly verse, then sorted by date or quarter/week based on selection
  const sortedVerses = [...filteredVerses].sort((a, b) => {
    const isAPinned = a.id === activePinnedId ? 1 : 0;
    const isBPinned = b.id === activePinnedId ? 1 : 0;
    if (isAPinned !== isBPinned) return isBPinned - isAPinned;

    if (verseSortOrder === 'latest') {
      // Sort by date descending (latest first)
      if (a.date && b.date) {
        return b.date.localeCompare(a.date);
      }
      if (a.date) return -1;
      if (b.date) return 1;
      // Fallback to quarter/week descending
      if (a.quarter !== b.quarter) return b.quarter - a.quarter;
      return b.week - a.week;
    } else {
      // Sort by date ascending (oldest first)
      if (a.date && b.date) {
        return a.date.localeCompare(b.date);
      }
      if (a.date) return 1;
      if (b.date) return -1;
      // Fallback to quarter/week ascending
      if (a.quarter !== b.quarter) return a.quarter - b.quarter;
      return a.week - b.week;
    }
  });

  // Calculate high level progress metrics
  const communityVerses = verses.filter(v => !v.isPersonal);
  const totalCount = communityVerses.length;
  const statusList = (Object.values(verseStatuses) as VerseStatus[]).filter(s => {
    const v = verses.find(x => x.id === s.verseId);
    return v && !v.isPersonal;
  });
  const completedCount = statusList.filter(s => s.status === 'completed').length;
  const memorizingCount = statusList.filter(s => s.status === 'memorizing').length;
  const notStartedCount = totalCount - completedCount - memorizingCount;

  // Gate: Render MainLanding if not authenticated
  if (!isAuthenticated) {
    return <MainLanding onStart={handleStartApp} />;
  }

  return (
    <div className="bg-[#FDFBF7] min-h-screen text-[#4A4A4A] font-sans selection:bg-[#E9E3D8]" id="main-app">
      
      {/* GLOBAL NAVBAR */}
      <header className="bg-white border-b border-[#E9E3D8] sticky top-0 z-40 shadow-sm" id="global-header">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="bg-[#8A9A5B] p-2 rounded-xl text-white hidden xs:block">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-serif font-semibold tracking-tight text-[#5A5A40] flex items-center justify-center sm:justify-start gap-1.5">
                학장교회 성경암송 <span className="text-[10px] sm:text-xs font-serif font-medium px-1.5 py-0.5 bg-[#F5F5F0] text-[#8A9A5B] border border-[#E9E3D8] rounded" title="말씀으로 하나님과 매일 만나는 나">만나</span>
              </h1>
              <p className="text-[10px] text-[#7A7A6A] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5 font-semibold">
                <span>반갑습니다, <strong>{currentUserName}</strong>님</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  userRole === 'master' ? 'bg-indigo-100 text-indigo-700' :
                  userRole === 'pastor' ? 'bg-[#EAF2D7] text-[#8A9A5B]' :
                  userRole === 'admin' ? 'bg-amber-100 text-amber-700' :
                  userRole === 'member' ? 'bg-[#EAF2D7] text-[#8A9A5B]' :
                  'bg-stone-100 text-stone-600 border border-stone-200'
                }`}>
                  {userRole === 'master' ? 'Master' :
                   userRole === 'pastor' ? 'Pastor (목양)' :
                   userRole === 'admin' ? 'Admin (콘텐츠)' :
                   userRole === 'member' ? '정회원' :
                   '게스트(Guest)'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            {/* STREAK */}
            <div className="flex items-center gap-1 bg-[#F5F5F0] border border-[#E9E3D8] px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-[#8A9A5B] shadow-inner">
              <Flame className="w-3.5 h-3.5 fill-[#8A9A5B] text-[#8A9A5B]" />
              <span>{streak}일 연속</span>
            </div>

            {/* MANAGER BUTTON */}
            {(userRole === 'pastor' || userRole === 'admin' || userRole === 'master') && (
              <button
                onClick={() => {
                  const nextVal = !showManager;
                  setShowManager(nextVal);
                  if (nextVal) {
                    window.history.pushState({ view: 'manager', verseId: null }, '');
                  } else {
                    window.history.pushState({ view: 'list', verseId: null }, '');
                  }
                }}
                className="flex items-center gap-1 bg-[#5A5A40] hover:bg-[#4A4A30] text-white border border-[#5A5A40] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm cursor-pointer"
                id="toggle-manager-panel"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showManager ? '리스트 보기' : '관리자'}</span>
              </button>
            )}

            {/* MAIN LOGOUT BUTTON */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setIsAuthenticated(false);
                setUserRole(null);
                setIsAdminAuthenticated(false);
                sessionStorage.removeItem('hagah_user_authenticated');
                sessionStorage.removeItem('hagah_user_role');
                sessionStorage.removeItem('hagah_user_id');
                sessionStorage.removeItem('hagah_user_name');
                sessionStorage.removeItem('hagah_user_phone');
                sessionStorage.removeItem('hagah_admin_auth');
                setShowManager(false);
              }}
              className="text-[10px] sm:text-xs text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-full font-bold transition cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      {/* MAIN LAYOUT WRAPPER */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8" id="main-content-layout">
        
        {/* VIEW CONDITIONAL RENDERING */}
        {activeView === 'blank_practice' && selectedVerseId ? (
          <BlankPractice
            verse={findVerseById(selectedVerseId)!}
            onComplete={handleBlankComplete}
            onBack={goBack}
          />
        ) : activeView === 'write_test' && selectedVerseId ? (
          <WriteTest
            verse={findVerseById(selectedVerseId)!}
            onComplete={handleWriteComplete}
            onBack={goBack}
          />
        ) : activeView === 'speak_along' && selectedVerseId ? (
          <SpeakAlong
            verse={findVerseById(selectedVerseId)!}
            onComplete={handleSpeakComplete}
            onBack={goBack}
          />
        ) : showManager ? (
          !isAdminAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto bg-white border border-[#E9E3D8] rounded-[32px] p-8 shadow-sm space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#FDF6E2] text-[#B8860B] rounded-full flex items-center justify-center mx-auto border border-[#F5D76E]/50">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#5A5A40]">교회 성구 관리자 인증</h3>
                <p className="text-xs text-[#A0A090] leading-relaxed">
                  이 공간은 교회 목회자 및 말씀 암송 담당자분들만 접근하여 매주 성구를 교체·관리하는 곳입니다.<br />
                  <span className="font-semibold text-amber-600 block mt-1">(등록된 담당자 외에는 이용하실 수 없습니다.)</span>
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#7A7A6A]">비밀번호</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError('');
                    }}
                    placeholder="비밀번호를 입력해 주세요"
                    className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 font-sans"
                  />
                  {adminError && (
                    <p className="text-[11px] text-red-500 font-medium">{adminError}</p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManager(false)}
                    className="flex-1 py-3 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#5A5A40] hover:bg-[#4A4A30] text-white border border-[#5A5A40] text-xs font-bold rounded-xl transition"
                  >
                    확인
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <ManagerPanel
              verses={verses}
              onAddVerse={handleAddVerse}
              onUpdateVerse={handleUpdateVerse}
              onDeleteVerse={handleDeleteVerse}
              onImportVerses={handleImportVerses}
              onResetToDefaults={handleResetToDefaults}
              onClose={() => setShowManager(false)}
              pinnedVerseId={pinnedVerseId}
              pinnedMonthVerseId={pinnedMonthVerseId}
              onPinVerse={handlePinVerse}
              onPinMonthVerse={handlePinMonthVerse}
              userRole={userRole || 'pastor'}
              gongGwaLessons={gongGwaLessons}
              onUpdateGongGwaLessons={saveGongGwaLessons}
              prayers={prayers}
              onDeletePrayer={handleDeletePrayer}
              onTogglePrayerStatus={handleTogglePrayerStatus}
              onUpdatePrayer={handleUpdatePrayer}
            />
          )
        ) : (
          /* MAIN DASHBOARD CONTENT CO-EXISTING WITH TWO BIG PILLARS UNDER ONE BRAND TITLE */
          <div className="space-y-10">
            {/* BRAND HEADER & TITLE */}
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-8 text-center space-y-4 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-[#FDFBF7]">
              {/* Decorative cross/flower subtle graphic */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-[#8A9A5B]/5 rounded-br-[100px] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#5A5A40]/5 rounded-tl-[100px] pointer-events-none" />
              
              <div className="inline-flex items-center justify-center gap-2 bg-[#8A9A5B]/10 border border-[#8A9A5B]/20 px-4 py-1.5 rounded-full text-[#8A9A5B] text-xs font-bold font-serif tracking-wider">
                <Sparkles className="w-4.5 h-4.5 text-[#8A9A5B] fill-[#8A9A5B]/10 animate-pulse" />
                <span>Manna : 말씀과 기도의 동행</span>
              </div>
              
              <div className="space-y-2 max-w-2xl mx-auto">
                <h2 className="text-2xl md:text-3.5xl font-serif font-black text-[#5A5A40] tracking-tight leading-tight">
                  만나 : 말씀으로 하나님과 매일 만나는 나
                </h2>
                <p className="text-xs md:text-sm text-[#7A7A6A] font-medium leading-relaxed font-sans">
                  "사람이 떡으로만 살 것이 아니요 여호와의 입에서 나오는 모든 말씀으로 살 것이라"<br />
                  생명의 꼴 '만나'처럼 매일 우리를 채우시는 하나님의 음성을 기억하며, 입으로 선포하고 마음에 새기는 복된 여정에 오신 성도님들을 환영합니다.
                </p>
              </div>
            </div>

            {/* FOUR-WAY SEGMENTED TAB BAR */}
            <div className="bg-[#F5F5F0] p-1.5 rounded-[24px] border border-[#E9E3D8] shadow-inner max-w-3xl mx-auto" id="four-way-segmented-pillars">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
                <button
                  onClick={() => setActiveMainTab('community')}
                  className={`py-3 px-1.5 rounded-[18px] text-[10px] sm:text-xs font-bold font-serif transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none ${
                    activeMainTab === 'community'
                      ? 'bg-white text-[#5A5A40] shadow-md border border-[#E9E3D8]/40 font-black'
                      : 'text-[#7A7A6A] hover:bg-white/40 hover:text-[#5A5A40]'
                  }`}
                >
                  <BookMarked className={`w-4 h-4 md:w-5 md:h-5 ${activeMainTab === 'community' ? 'text-[#8A9A5B]' : 'text-[#7A7A6A]'}`} />
                  <span className="text-[9.5px] sm:text-[11px] md:text-xs">⛪ 금주 암송성구</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('gonggwa')}
                  className={`py-3 px-1.5 rounded-[18px] text-[10px] sm:text-xs font-bold font-serif transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none ${
                    activeMainTab === 'gonggwa'
                      ? 'bg-white text-[#5A5A40] shadow-md border border-[#E9E3D8]/40 font-black'
                      : 'text-[#7A7A6A] hover:bg-white/40 hover:text-[#5A5A40]'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 md:w-5 md:h-5 ${activeMainTab === 'gonggwa' ? 'text-[#8A9A5B]' : 'text-[#7A7A6A]'}`} />
                  <span className="text-[9.5px] sm:text-[11px] md:text-xs">📖 주간 공과공부</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('personal')}
                  className={`py-3 px-1.5 rounded-[18px] text-[10px] sm:text-xs font-bold font-serif transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none ${
                    activeMainTab === 'personal'
                      ? 'bg-white text-[#5A5A40] shadow-md border border-[#E9E3D8]/40 font-black'
                      : 'text-[#7A7A6A] hover:bg-white/40 hover:text-[#5A5A40]'
                  }`}
                >
                  <ClipboardList className={`w-4 h-4 md:w-5 md:h-5 ${activeMainTab === 'personal' ? 'text-[#8A9A5B]' : 'text-[#7A7A6A]'}`} />
                  <span className="text-[9.5px] sm:text-[11px] md:text-xs">✍️ 나의 신앙노트</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('prayer')}
                  className={`py-3 px-1.5 rounded-[18px] text-[10px] sm:text-xs font-bold font-serif transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer select-none ${
                    activeMainTab === 'prayer'
                      ? 'bg-white text-[#5A5A40] shadow-md border border-[#E9E3D8]/40 font-black'
                      : 'text-[#7A7A6A] hover:bg-white/40 hover:text-[#5A5A40]'
                  }`}
                >
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 ${activeMainTab === 'prayer' ? 'text-[#8A9A5B] fill-[#8A9A5B]/10' : 'text-[#7A7A6A]'}`} />
                  <span className="text-[9.5px] sm:text-[11px] md:text-xs">🙏 익명 중보기도함</span>
                </button>
              </div>
            </div>

            {/* DYNAMIC CONTENT AREA BASED ON SELECTED PILLAR */}
            <div className="pt-2">
              {isCommonDataLoading ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4 bg-white border border-[#E9E3D8] rounded-[32px] p-8 shadow-sm">
                  <div className="w-10 h-10 border-4 border-[#8A9A5B]/30 border-t-[#8A9A5B] rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-[#7A7A6A] font-serif">학장교회 데이터를 불러오는 중입니다...</p>
                </div>
              ) : commonDataError ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4 bg-white border border-[#E9E3D8] rounded-[32px] p-8 shadow-sm text-center">
                  <p className="text-sm font-medium text-rose-500 font-sans">{commonDataError}</p>
                  <button
                    onClick={async () => {
                      setIsCommonDataLoading(true);
                      setCommonDataError(null);
                      try {
                        const dbVerses = await fetchVerses();
                        setVerses(deduplicateVerses(dbVerses || []));
                        const dbLessons = await fetchLessonsFromDb();
                        setGongGwaLessons(dbLessons || []);
                        const dbAnnouncements = await fetchAnnouncements();
                        setAnnouncements(dbAnnouncements || []);
                        const dbPrayers = await fetchPrayersFromDb();
                        if (dbPrayers && dbPrayers.length > 0) {
                          setPrayers(dbPrayers);
                        }
                      } catch (e) {
                        setCommonDataError("학장교회 데이터를 불러오는 도중 오류가 발생했습니다. 네트워크 연결을 확인해 주세요.");
                      } finally {
                        setIsCommonDataLoading(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#8A9A5B] text-white text-xs font-bold rounded-xl shadow hover:bg-[#78884F] transition mt-2 cursor-pointer"
                  >
                    다시 시도
                  </button>
                </div>
              ) : activeMainTab === 'personal' ? (
                <PersonalFaithNote
                  verses={verses}
                  verseStatuses={verseStatuses}
                  onAddPersonalVerse={handleAddPersonalVerse}
                  onDeletePersonalVerse={handleDeleteVerse}
                  onStatusChange={handleStatusChange}
                  onStartBlankPractice={startBlankPractice}
                  onStartWriteTest={startWriteTest}
                  onStartSpeakAlong={startSpeakAlong}
                  isGuest={userRole === 'guest'}
                />
              ) : activeMainTab === 'gonggwa' ? (
                <GongGwaPanel
                  verseStatuses={verseStatuses}
                  onStartBlankPractice={startBlankPractice}
                  onStartWriteTest={startWriteTest}
                  onStartSpeakAlong={startSpeakAlong}
                  gongGwaLessons={gongGwaLessons}
                />
              ) : activeMainTab === 'prayer' ? (
                <AnonymousPrayerPanel
                  prayers={prayers}
                  onAddPrayer={handleAddPrayer}
                  onIncrementAmen={handleIncrementAmen}
                  onUpdatePrayer={handleUpdatePrayer}
                  onTogglePrayerStatus={handleTogglePrayerStatus}
                  isDemoUser={currentUserName === '테스트성도' || userRole === 'guest'}
                />
              ) : (
                /* STANDARD DASHBOARD LIST VIEW */
                <div className="space-y-8">
            
            {/* MEDITATION INTRO & EFFECT SYNOPSIS */}
            <AnimatePresence>
              {showMeditationIntro && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm relative overflow-hidden"
                  id="intro-meditation-box"
                >
                  <button
                    onClick={() => setShowMeditationIntro(false)}
                    className="absolute top-4 right-4 text-xs font-semibold text-[#A0A090] hover:text-[#5A5A40] cursor-pointer"
                  >
                    닫기 ✕
                  </button>
                  
                  <div className="max-w-3xl space-y-4">
                    <h2 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#8A9A5B] fill-[#8A9A5B]/20" />
                      학장교회 매주 암송성구 가이드 • 만나 (Manna)
                    </h2>
                    
                    <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                      학장교회 성도님들을 위해 준비된 <strong>매주 성경 암송 훈련 사이트</strong>입니다. 광야에서 백성들을 먹이셨던 생명의 하늘 양식 '만나'처럼, 매일 마주하는 말씀의 기적과 축복을 경험하며 하나님과 동행하는 <strong>"만나 : 말씀으로 하나님과 매일 만나는 나"</strong> 트레이너입니다. 매일 소리내어 선포하는 가운데 십자가로 더욱 가까이 나아가며, 오직 <strong>"말씀중심 은혜중심"</strong>으로 무장하여 일상에서 살아서 역사하는 말씀의 능력을 풍성히 누려보십시오.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="bg-[#F9F7F2] border border-[#E9E3D8] p-4 rounded-2xl space-y-1">
                        <div className="text-xs font-bold text-[#8A9A5B] flex items-center gap-1.5">
                          <ClipboardList className="w-4 h-4 text-[#8A9A5B]" />
                          1. 빈칸 구간 학습
                        </div>
                        <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                          말씀 구절의 일부분을 가려진 빈칸으로 바꾸고, 앞뒤 흐름과 초성을 유추하며 주도적으로 복기합니다.
                        </p>
                      </div>

                      <div className="bg-[#F9F7F2] border border-[#E9E3D8] p-4 rounded-2xl space-y-1">
                        <div className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" />
                          2. 실전 직접 쓰기
                        </div>
                        <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                          타이핑을 통해 성경 원본과 글자 단위로 대조하여 오타, 누락, 추가 구문을 실시간 디프(Diff) 분석해 줍니다.
                        </p>
                      </div>

                      <div className="bg-[#F9F7F2] border border-[#E9E3D8] p-4 rounded-2xl space-y-1">
                        <div className="text-xs font-bold text-[#8A9A5B] flex items-center gap-1.5">
                          <Mic className="w-4 h-4 text-[#8A9A5B]" />
                          3. 음성 따라말하기 🎙️
                        </div>
                        <p className="text-[11px] text-[#7A7A6A] leading-relaxed">
                          마이크 음성인식을 통해 직접 입으로 고백한 텍스트를 실시간 분석해 암송 정확도를 채점해 줍니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* METRICS / STATS DASHBOARD BOARD */}
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm space-y-6" id="overall-progress-dashboard">
              <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                
                {/* Radial circular progress chart */}
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0">
                    {/* SVG Radial Ring */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-[#F5F5F0]"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        className="stroke-[#8A9A5B]"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (totalCount > 0 ? completedCount / totalCount : 0)) }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                      <span className="text-xl font-black text-[#5A5A40]">
                        {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                      </span>
                      <span className="text-[8px] text-[#A0A090] font-bold">성취 도달율</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left">
                    <h3 className="text-sm font-serif font-bold text-[#5A5A40] flex items-center justify-center sm:justify-start gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500 fill-amber-100" />
                      <span className="font-extrabold text-[#8A9A5B] underline decoration-[#8A9A5B]/30 decoration-2 underline-offset-4">{currentUserName}</span>{(currentUserName.includes('목사님') || currentUserName.includes('관리자') || userRole === 'pastor' || userRole === 'manager') ? ' ' : ' 성도'}님의 말씀 암송 성취도 도달율
                    </h3>
                    <p className="text-xs text-[#7A7A6A] font-semibold">
                      총 {totalCount}개 구절 중 <span className="text-[#8A9A5B] font-bold text-sm">{completedCount}개</span> 말씀 암송 완료
                    </p>
                    <p className="text-[11px] text-[#A0A090] leading-relaxed max-w-md italic">
                      {(() => {
                        const rate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                        if (rate === 0) return "믿음의 소중한 첫걸음입니다! 날마다 채우시는 하나님의 만나를 풍성히 받아보세요.";
                        if (rate < 30) return "말씀이 삶 속에 깊이 뿌리내리고 있습니다. 힘차게 한 걸음 더 전진합시다!";
                        if (rate < 60) return "절반 가까이 돌파하셨습니다! 말씀의 능력이 성도님의 삶과 마음을 풍성히 채우고 있습니다.";
                        if (rate < 100) return "완벽한 암송 고지가 바로 앞입니다! 끝까지 주님의 은혜를 사모하며 기쁨과 감사로 승리해 보십시오.";
                        return "할렐루야! 전체 말씀을 모두 암송하셨습니다! 성도님의 헌신과 믿음에 깊은 존경을 표합니다.";
                      })()}
                    </p>
                  </div>
                </div>

                {/* Vertical Separator for wide screen */}
                <div className="hidden md:block w-px bg-[#E9E3D8] h-12" />

                {/* Mini Quick Count Panels */}
                <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0">
                  <div className="bg-[#F9F7F2] border border-[#E9E3D8] px-4 py-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-[#A0A090] font-bold block mb-0.5">완료 말씀</span>
                    <span className="text-sm font-black text-[#8A9A5B]">{completedCount} / {totalCount}</span>
                  </div>
                  <div className="bg-[#FDFBF7] border border-[#E9E3D8] px-4 py-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-[#A0A090] font-bold block mb-0.5">암송 노력중</span>
                    <span className="text-sm font-black text-[#5A5A40]">{memorizingCount}</span>
                  </div>
                  <div className="bg-[#FDFBF7] border border-[#E9E3D8] px-4 py-2.5 rounded-2xl text-center">
                    <span className="text-[9px] text-stone-400 font-bold block mb-0.5">시작 전</span>
                    <span className="text-sm font-black text-stone-500">{notStartedCount}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* PINNED "금주의 암송 말씀" DOCK FEATURE */}
            {pinnedVerse && (
              <motion.div
                layoutId="pinned-verse-card"
                className="bg-white border-2 border-[#8A9A5B]/40 rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                id="pinned-verse-banner"
              >
                <div className="space-y-3.5 w-full md:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F5F5F0] text-[#8A9A5B] text-[10px] font-bold px-3 py-1 rounded-full border border-[#E9E3D8] uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-[#8A9A5B] text-[#8A9A5B]" />
                      금주의 중점 암송 성구 📌
                    </span>
                    <span className="text-xs text-[#A0A090] font-sans font-semibold">
                      {(() => {
                        const qAndW = `${pinnedVerse.quarter}분기 ${pinnedVerse.week}주차`;
                        if (pinnedVerse.date) {
                          const parts = pinnedVerse.date.split('.');
                          if (parts.length === 3) {
                            return `${qAndW} • ${parts[0].slice(-2)}-${parts[1]}-${parts[2]} 주일`;
                          }
                          return `${qAndW} • ${pinnedVerse.date}`;
                        }
                        return qAndW;
                      })()}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#5A5A40]" id="pinned-ref">
                    {pinnedVerse.reference}
                  </h3>
                  
                  {/* Pinned text display with toggle view option */}
                  <div className="p-4 bg-[#F9F7F2] border border-[#E9E3D8]/50 rounded-2xl">
                    <p className={`font-serif text-lg leading-relaxed text-[#4A4A4A] transition-all duration-300 ${blurredCards[pinnedVerse.id] ? 'filter blur-md select-none' : ''}`}>
                      {pinnedVerse.text}
                    </p>
                    {pinnedVerse.hint && (
                      <p className="text-xs text-[#7A7A6A] mt-2 font-sans italic">
                        묵상 가이드: {pinnedVerse.hint}
                      </p>
                    )}
                  </div>
                  
                  {isAdminAuthenticated && (
                    <div className="mt-3.5 pt-3 border-t border-dashed border-[#E9E3D8] flex items-center justify-between gap-2 bg-[#FDFBF7] p-2.5 rounded-2xl font-sans">
                      <span className="text-[10px] font-bold text-[#8A9A5B] flex items-center gap-1">⚙️ 금주의 암송 말씀 관리</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdminEditingVerse(pinnedVerse);
                          }}
                          className="px-2.5 py-1.5 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(pinnedVerse.id);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => toggleBlurCard(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl border border-[#E9E3D8] text-[#5A5A40] bg-white hover:bg-[#F5F5F0] text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    {blurredCards[pinnedVerse.id] ? (
                      <>
                        <Eye className="w-4 h-4" />
                        가사/본문 보기
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        가려두고 자가테스트
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => startBlankPractice(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    구간 빈칸 연습
                  </button>

                  <button
                    onClick={() => startSpeakAlong(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#E9E3D8] hover:bg-[#E9E3D8] text-[#5A5A40] text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    따라말하기 (음성)
                  </button>

                  <button
                    onClick={() => startWriteTest(pinnedVerse.id)}
                    className="flex-1 md:w-44 py-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    실전 직접 써보기
                  </button>
                </div>
              </motion.div>
            )}

            {/* PINNED "금월의 암송 말씀" DOCK FEATURE */}
            {pinnedMonthVerse && (
              <motion.div
                layoutId="pinned-month-verse-card"
                className="bg-white border-2 border-[#5A5A40]/40 rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                id="pinned-month-verse-banner"
              >
                <div className="space-y-3.5 w-full md:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F5F5F0] text-[#5A5A40] text-[10px] font-bold px-3 py-1 rounded-full border border-[#E9E3D8] uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 fill-[#5A5A40]/10 text-[#5A5A40]" />
                      이달의 암송 성구 📌
                    </span>
                    <span className="text-xs text-[#A0A090] font-sans font-semibold">
                      {(() => {
                        const q = `${pinnedMonthVerse.quarter}분기`;
                        if (pinnedMonthVerse.date) {
                          return `${q} • ${pinnedMonthVerse.date} 이달의 말씀`;
                        }
                        return `${q} 이달의 말씀`;
                      })()}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#5A5A40]" id="pinned-month-ref">
                    {pinnedMonthVerse.reference}
                  </h3>
                  
                  {/* Pinned text display with toggle view option */}
                  <div className="p-4 bg-[#F9F7F2] border border-[#E9E3D8]/50 rounded-2xl">
                    <p className={`font-serif text-lg leading-relaxed text-[#4A4A4A] transition-all duration-300 ${blurredCards[pinnedMonthVerse.id] ? 'filter blur-md select-none' : ''}`}>
                      {pinnedMonthVerse.text}
                    </p>
                    {pinnedMonthVerse.hint && (
                      <p className="text-xs text-[#7A7A6A] mt-2 font-sans italic">
                        묵상 가이드: {pinnedMonthVerse.hint}
                      </p>
                    )}
                  </div>

                  {isAdminAuthenticated && (
                    <div className="mt-3.5 pt-3 border-t border-dashed border-[#E9E3D8] flex items-center justify-between gap-2 bg-[#FDFBF7] p-2.5 rounded-2xl font-sans">
                      <span className="text-[10px] font-bold text-[#5A5A40] flex items-center gap-1">⚙️ 이달의 암송 말씀 관리</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdminEditingVerse(pinnedMonthVerse);
                          }}
                          className="px-2.5 py-1.5 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(pinnedMonthVerse.id);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 font-sans">
                  <button
                    onClick={() => toggleBlurCard(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl border border-[#E9E3D8] text-[#5A5A40] bg-white hover:bg-[#F5F5F0] text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    {blurredCards[pinnedMonthVerse.id] ? (
                      <>
                        <Eye className="w-4 h-4" />
                        본문 보기
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        가려두고 자가테스트
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => startBlankPractice(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    구간 빈칸 연습
                  </button>

                  <button
                    onClick={() => startSpeakAlong(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-2.5 rounded-xl bg-[#F5F5F0] border border-[#E9E3D8] hover:bg-[#E9E3D8] text-[#5A5A40] text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    따라말하기 (음성)
                  </button>

                  <button
                    onClick={() => startWriteTest(pinnedMonthVerse.id)}
                    className="flex-1 md:w-44 py-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    실전 직접 써보기
                  </button>
                </div>
              </motion.div>
            )}

            {/* ANNOUNCEMENTS SECTION (공지사항) */}
            <div className="bg-white border border-[#E9E3D8] rounded-[32px] p-6 shadow-sm space-y-4" id="church-announcements-section">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#8A9A5B] fill-[#8A9A5B]/10" />
                  교회 소식 및 공지사항 📢
                </h3>
                {isAdminAuthenticated && (
                  <button
                    onClick={() => setShowAddAnnForm(!showAddAnnForm)}
                    className="px-3 py-1.5 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    새 공지 작성
                  </button>
                )}
              </div>

              {/* Add Announcement Form (Only for authorized users) */}
              {isAdminAuthenticated && showAddAnnForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleNewAnnSubmit}
                  className="bg-[#FDFBF7] border border-[#E9E3D8] p-4 rounded-2xl space-y-3 font-sans"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#5A5A40]">공지 제목</label>
                      <input
                        type="text"
                        required
                        placeholder="공지사항 제목을 입력하세요."
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#5A5A40]">작성자</label>
                      <input
                        type="text"
                        placeholder={currentUserName || "관리자"}
                        value={newAnnAuthor}
                        onChange={(e) => setNewAnnAuthor(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5A5A40]">공지 내용</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="성도님들께 공지할 상세 내용을 입력하세요."
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E9E3D8] rounded-xl text-xs text-[#4A4A4A] outline-none focus:border-[#8A9A5B] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddAnnForm(false);
                        setNewAnnTitle('');
                        setNewAnnContent('');
                      }}
                      className="px-3 py-1.5 bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#8A9A5B] hover:bg-[#78884F] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      공지 등록하기
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Announcements List */}
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-xs text-[#A0A090] text-center py-4 italic">등록된 공지사항이 없습니다.</p>
                ) : (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 bg-[#F9F7F2]/50 border border-[#E9E3D8]/40 rounded-2xl hover:bg-[#F9F7F2] transition relative"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#5A5A40]">{ann.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#A0A090] font-sans font-semibold">{ann.date}</span>
                          {isAdminAuthenticated && (
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="text-rose-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                              title="삭제"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#4A4A4A] leading-relaxed font-sans whitespace-pre-line">
                        {ann.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TAB FILTERS FOR QUARTERS (분기별 탭 필터) */}
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E9E3D8] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '전체 말씀 리스트', value: 0 },
                  { label: '1분기', value: 1 },
                  { label: '2분기', value: 2 },
                  { label: '3분기', value: 3 },
                  { label: '4분기', value: 4 },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedQuarter(tab.value)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold tracking-tight transition ${
                      selectedQuarter === tab.value
                        ? 'bg-[#8A9A5B] text-white shadow-sm'
                        : 'bg-white hover:bg-[#F5F5F0] text-[#7A7A6A] border border-[#E9E3D8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Toggle Option */}
                <div className="flex items-center gap-1.5 bg-[#F5F5F0] border border-[#E9E3D8] rounded-xl p-0.5">
                  <button
                    onClick={() => setVerseSortOrder('latest')}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                      verseSortOrder === 'latest'
                        ? 'bg-[#8A9A5B] text-white shadow-sm'
                        : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    최신순
                  </button>
                  <button
                    onClick={() => setVerseSortOrder('oldest')}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-lg transition-all ${
                      verseSortOrder === 'oldest'
                        ? 'bg-[#8A9A5B] text-white shadow-sm'
                        : 'text-[#7A7A6A] hover:text-[#5A5A40]'
                    }`}
                  >
                    과거순
                  </button>
                </div>

                <div className="text-[11px] text-[#A0A090] font-sans font-medium whitespace-nowrap">
                  총 <span className="font-bold text-[#5A5A40]">{filteredVerses.length}</span>개 성구
                </div>
              </div>
            </div>

            {/* VERSE CARD GRID CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="verse-card-grid">
              {sortedVerses.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white border border-[#E9E3D8] rounded-[32px] p-8 shadow-sm">
                  <p className="text-sm font-medium text-[#7A7A6A] font-serif">등록된 내용이 없습니다.</p>
                </div>
              ) : (
                sortedVerses.map((verse) => {
                const statusInfo = verseStatuses[verse.id] || {
                  verseId: verse.id,
                  status: 'not_started',
                  streak: 0
                };
                const isPinned = verse.id === pinnedVerseId;
                const isBlurred = blurredCards[verse.id] ?? false;

                let statusBadgeClass = "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ";
                let statusLabel = "시작 전";

                if (statusInfo.status === 'completed') {
                  statusBadgeClass += "bg-[#F5F5F0] text-[#8A9A5B] border border-[#E9E3D8]";
                  statusLabel = "암송 완료 ✨";
                } else if (statusInfo.status === 'memorizing') {
                  statusBadgeClass += "bg-[#F9F7F2] text-[#5A5A40] border border-[#E9E3D8]";
                  statusLabel = "외우는 중 📖";
                } else {
                  statusBadgeClass += "bg-stone-50 text-stone-400 border border-stone-100";
                }

                const isLatest = verse.id === latestVerseId;
                let isGoldBadge = false;

                let dateBadgeText = `${verse.quarter}분기 ${verse.week}주차`;
                if (verse.date) {
                  let formattedDate = verse.date;
                  const parts = verse.date.split('.');
                  if (parts.length === 3) {
                    formattedDate = `${parts[0].slice(-2)}-${parts[1]}-${parts[2]}`;
                  }
                  dateBadgeText = `${verse.quarter}분기 ${verse.week}주차 • ${formattedDate}`;
                }
                if (isLatest) {
                  dateBadgeText = `⭐ 금주암송성구 (${dateBadgeText})`;
                  isGoldBadge = true;
                }

                return (
                  <motion.div
                    key={verse.id}
                    layoutId={`verse-card-${verse.id}`}
                    className={`bg-white rounded-[24px] p-6 border transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden ${
                      isPinned 
                        ? 'border-[#8A9A5B]/60 shadow-[0_8px_30px_rgba(138,154,91,0.06)] ring-1 ring-[#8A9A5B]/20' 
                        : 'border-[#E9E3D8] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Inline Deletion Confirmation Overlay */}
                    {deleteConfirmId === verse.id && (
                      <div className="absolute inset-0 bg-white/95 rounded-[24px] p-6 flex flex-col justify-center items-center text-center z-10 space-y-4 shadow-inner border border-rose-200">
                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-serif font-bold text-stone-800">
                          이 말씀 구절을 정말 삭제하시겠습니까?<br />
                          <span className="text-[11px] text-rose-600 font-sans block mt-1">({verse.reference})</span>
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVerse(verse.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            삭제
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-3 py-1.5 bg-[#F5F5F0] border border-[#E9E3D8] hover:bg-[#E9E3D8] text-[#5A5A40] rounded-xl text-[10px] font-bold cursor-pointer"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Top Row: Meta info */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isGoldBadge 
                              ? 'bg-[#FDF6E2] text-[#B8860B] border-[#F5D76E]/50 font-extrabold flex items-center gap-1' 
                              : 'bg-[#F5F5F0] text-[#7A7A6A] border-[#E9E3D8]'
                          }`}>
                            {dateBadgeText}
                          </span>
                          <span className={statusBadgeClass}>{statusLabel}</span>
                        </div>

                        {/* Pin and Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isAdminAuthenticated && (
                            <div className="flex items-center gap-0.5 bg-[#F5F5F0] border border-[#E9E3D8] rounded-lg p-0.5 mr-1 shadow-inner">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAdminEditingVerse(verse);
                                }}
                                className="p-1 text-[#7A7A6A] hover:text-[#5A5A40] hover:bg-white rounded transition-all"
                                title="말씀 수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(verse.id);
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                title="말씀 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => handlePinVerse(verse.id)}
                            className={`p-1.5 rounded-lg transition-colors duration-200 ${
                              isPinned
                                ? 'bg-[#F5F5F0] text-[#8A9A5B]'
                                : 'text-stone-300 hover:text-[#8A9A5B] hover:bg-[#F5F5F0]'
                            }`}
                            title="금주의 암송 말씀으로 지정"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Reference title */}
                      <h4 className="text-base font-serif font-bold text-[#5A5A40] tracking-tight">
                        {verse.reference}
                      </h4>

                      {/* Scripture Body */}
                      <div className="relative">
                        <p className={`font-serif text-[15px] leading-relaxed text-[#4A4A4A] font-medium transition-all duration-300 ${
                          isBlurred ? 'filter blur-md select-none' : ''
                        }`}>
                          {verse.text}
                        </p>
                        
                        {/* Eye toggle blur button */}
                        <button
                          onClick={() => toggleBlurCard(verse.id)}
                          className="absolute -right-1 -bottom-2 p-1 text-[#A0A090] hover:text-[#5A5A40] opacity-0 group-hover:opacity-100 transition duration-200"
                          title={isBlurred ? '가사 보이기' : '자가 테스트용 가리기'}
                        >
                          {isBlurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Best score display */}
                      {statusInfo.bestScore !== undefined && (
                        <div className="text-[10px] text-[#A0A090] font-sans flex items-center gap-1 pt-1">
                          <Award className="w-3.5 h-3.5 text-[#8A9A5B]" />
                          최고 기록: <span className="font-bold text-[#5A5A40]">{statusInfo.bestScore}점</span>
                          {statusInfo.lastTested && (
                            <span className="text-[9px]">({statusInfo.lastTested} 테스트)</span>
                          )}
                        </div>
                      )}

                      {/* Visual progress bar & completion greeting */}
                      {(() => {
                        const progressPercent = statusInfo.status === 'completed' 
                          ? 100 
                          : statusInfo.status === 'memorizing' 
                            ? (statusInfo.bestScore || 50) 
                            : 0;

                        return (
                          <div className="space-y-1.5 pt-2 border-t border-[#F5F5F0]">
                            <div className="flex justify-between text-[10px] font-bold text-[#A0A090]">
                              <span>암송 성취도</span>
                              <span className="font-mono">{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden border border-[#E9E3D8]">
                              <div 
                                className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-[#8A9A5B]' : 'bg-amber-500'}`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            {progressPercent === 100 && (
                              <motion.div 
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[10.5px] text-[#8A9A5B] font-bold font-serif bg-[#EAF2D7]/50 px-2.5 py-1.5 rounded-xl text-center mt-2"
                              >
                                🎉 오늘도 고생했어요! 정말 멋지세요!
                              </motion.div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Pastor Submission Section */}
                      {(() => {
                        const sub = userSubmissions.find(s => s.weeklyVerseId === verse.id);
                        const statusInfo = verseStatuses[verse.id] || { status: 'not_started' };
                        const isLoading = submissionLoading[verse.id];
                        const errorMsg = submissionError[verse.id];

                        if (statusInfo.status !== 'completed' && !sub) return null;

                        return (
                          <div className="mt-3.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-bold text-stone-600">목사님 제출 상태</span>
                              {sub ? (
                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                                  sub.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : sub.status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {sub.status === 'approved' 
                                    ? '승인 완료 ✨' 
                                    : sub.status === 'rejected'
                                      ? '다시 암송해주세요 ✍️'
                                      : '제출 대기 ⏳'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-stone-400">제출 안 됨</span>
                              )}
                            </div>

                            {errorMsg && (
                              <p className="text-[10px] text-rose-500 font-medium">{errorMsg}</p>
                            )}

                            {(!sub || sub.status === 'rejected') && (
                              <button
                                onClick={() => handleSubmitVerseToPastor(verse.id)}
                                disabled={isLoading}
                                className="w-full py-2 bg-[#8A9A5B] hover:bg-[#7A8A4B] disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                {isLoading ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : sub?.status === 'rejected' ? (
                                  '다시 암송하여 목사님께 제출 ⛪'
                                ) : (
                                  '목사님께 제출 ⛪'
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom Row: Actions & Status Toggles */}
                    <div className="mt-5 pt-4 border-t border-[#F0ECE4] flex items-center justify-between gap-3">
                      
                      {/* Manual state selection */}
                      <select
                        value={statusInfo.status}
                        onChange={(e) => handleStatusChange(verse.id, e.target.value as MemorizeStatus)}
                        className="text-[10px] font-sans font-bold text-[#7A7A6A] bg-[#F5F5F0] border border-[#E9E3D8] px-2 py-1.5 rounded-lg focus:outline-none"
                      >
                        <option value="not_started">시작 전 📖</option>
                        <option value="memorizing">외우는 중 ⏱</option>
                        <option value="completed">완료 ⭐</option>
                      </select>

                      {/* Action buttons */}
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={() => startSpeakAlong(verse.id)}
                          className="px-2 py-1.5 rounded-lg bg-[#F5F5F0] hover:bg-[#E9E3D8] text-[#5A5A40] text-[10.5px] font-bold transition flex items-center gap-1 border border-[#E9E3D8]"
                          title="소리내어 따라말하기 훈련"
                        >
                          <Mic className="w-3 h-3 text-[#8A9A5B]" />
                          음성 따라하기
                        </button>
                        <button
                          onClick={() => startBlankPractice(verse.id)}
                          className="px-2 py-1.5 rounded-lg border border-[#E9E3D8] hover:border-[#8A9A5B]/30 bg-white hover:bg-[#F5F5F0] text-[#5A5A40] text-[10.5px] font-bold transition flex items-center gap-1"
                        >
                          빈칸 연습
                        </button>
                        <button
                          onClick={() => startWriteTest(verse.id)}
                          className="px-2 py-1.5 rounded-lg bg-[#5A5A40] hover:bg-[#4A4A30] text-white text-[10.5px] font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          실전 직접 쓰기
                        </button>
                      </div>
                    </div>

                    {/* Admin Control Bar inside the card (Prominent/Highly Visible) */}
                    {isAdminAuthenticated && (
                      <div className="mt-3.5 pt-3 border-t border-dashed border-[#E9E3D8] flex items-center justify-between gap-2 bg-[#FDFBF7] p-2.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-[#8A9A5B] flex items-center gap-1">⚙️ 목사님/관리자 말씀 관리</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdminEditingVerse(verse);
                            }}
                            className="px-2.5 py-1.5 bg-[#8A9A5B]/10 hover:bg-[#8A9A5B]/20 text-[#8A9A5B] rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            내용 수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(verse.id);
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            말씀 삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              }))}
            </div>

            {/* TEST ATTEMPTS HISTORY TAB */}
            {attempts.length > 0 && (
              <div className="bg-white border border-[#E9E3D8] rounded-3xl p-6 shadow-sm" id="attempts-history">
                <h3 className="text-sm font-serif font-bold text-[#5A5A40] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <History className="w-4.5 h-4.5 text-[#8A9A5B]" />
                  나의 암송 테스트 역사
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E9E3D8] text-[#A0A090] font-semibold uppercase tracking-wider pb-2">
                        <th className="py-2.5 px-3">날짜</th>
                        <th className="py-2.5 px-3">성경 장절</th>
                        <th className="py-2.5 px-3">학습 모드</th>
                        <th className="py-2.5 px-3 text-right">점수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE4] text-[#4A4A4A]">
                      {attempts.slice(0, 5).map((att) => (
                        <tr key={att.id} className="hover:bg-[#F9F7F2]/50">
                          <td className="py-2.5 px-3 font-mono text-[10px] text-[#A0A090]">{att.date}</td>
                          <td className="py-2.5 px-3 font-serif font-bold text-[#5A5A40]">{att.reference}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              att.mode === 'full_write' 
                                ? 'bg-[#F9F7F2] text-[#5A5A40] border border-[#E9E3D8]' 
                                : att.mode === 'speak_along'
                                ? 'bg-[#8A9A5B]/10 text-[#8A9A5B] border border-[#8A9A5B]/20'
                                : 'bg-[#F5F5F0] text-[#8A9A5B] border border-[#E9E3D8]'
                            }`}>
                              {att.mode === 'full_write' 
                                ? '실전 써보기' 
                                : att.mode === 'speak_along' 
                                ? '🎙️ 따라말하기' 
                                : '구간 빈칸 연습'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-sans text-[#4A4A4A]">
                            <span className={att.score === 100 ? 'text-[#8A9A5B] font-black' : att.score >= 80 ? 'text-[#5A5A40]' : 'text-[#4A4A4A]'}>
                              {att.score}점
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    )}
  </main>

  {/* ADMIN EDIT MODAL OVERLAY */}
  <AnimatePresence>
    {adminEditingVerse && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans"
        onClick={() => setAdminEditingVerse(null)}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="bg-white border border-[#E9E3D8] rounded-[28px] p-6 max-w-lg w-full shadow-2xl space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center pb-2 border-b border-[#F0ECE4]">
            <h3 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-1.5">
              <Edit3 className="w-5 h-5 text-[#8A9A5B]" />
              말씀 구절 정보 수정 (관리자)
            </h3>
            <button
              onClick={() => setAdminEditingVerse(null)}
              className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded-lg hover:bg-stone-50"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7A7A6A] block">성경 장절 (참조)</label>
              <input
                type="text"
                value={adminEditingVerse.reference}
                onChange={(e) => setAdminEditingVerse({ ...adminEditingVerse, reference: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                placeholder="예: 시편 136편 1절"
              />
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7A7A6A] block">말씀 구절 본문</label>
              <textarea
                rows={3}
                value={adminEditingVerse.text}
                onChange={(e) => setAdminEditingVerse({ ...adminEditingVerse, text: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30 resize-none font-serif leading-relaxed"
                placeholder="여호와께 감사하라 그는 선하시며 그 인자하심이 영원함이로다"
              />
            </div>

            {/* Hint */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7A7A6A] block">묵상 가이드 / 힌트</label>
              <input
                type="text"
                value={adminEditingVerse.hint || ''}
                onChange={(e) => setAdminEditingVerse({ ...adminEditingVerse, hint: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                placeholder="예: 주의 변치 않는 신실하심과 선하심에 깊이 감사하며 암송해 보십시오."
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#7A7A6A] block">주일(일요일) 일자 (YYYY.MM.DD 형식)</label>
              <input
                type="text"
                value={adminEditingVerse.date || ''}
                onChange={(e) => setAdminEditingVerse({ ...adminEditingVerse, date: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                placeholder="예: 2026.07.05"
              />
            </div>

            {/* Quarter & Week */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#7A7A6A] block">분기 구분</label>
                <select
                  value={adminEditingVerse.quarter}
                  onChange={(e) => setAdminEditingVerse({ ...adminEditingVerse, quarter: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                >
                  <option value={1}>1분기</option>
                  <option value={2}>2분기</option>
                  <option value={3}>3분기</option>
                  <option value={4}>4분기</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#7A7A6A] block">주차 구분</label>
                <input
                  type="number"
                  min={1}
                  max={13}
                  value={adminEditingVerse.week}
                  onChange={(e) => setAdminEditingVerse({ ...adminEditingVerse, week: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-[#E9E3D8] bg-white text-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#8A9A5B]/30"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-[#F0ECE4]">
            <button
              type="button"
              onClick={() => setAdminEditingVerse(null)}
              className="flex-1 py-3 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                handleUpdateVerse(adminEditingVerse.id, adminEditingVerse);
                setAdminEditingVerse(null);
              }}
              className="flex-1 py-3 bg-[#8A9A5B] hover:bg-[#78884F] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              저장 완료
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* FOOTER - CHURCH INFORMATION */}
      <footer className="bg-stone-800 text-stone-400 mt-20 border-t border-stone-700 py-12 px-6" id="app-footer">
        <div className="max-w-4xl mx-auto space-y-6 text-xs leading-relaxed">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-8 border-b border-stone-700">
            <div className="space-y-2 max-w-sm">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                만나 성경암송 훈련기
              </h4>
              <p className="text-[11px] text-stone-400">
                매주 금주암송성구를 암송하고, 분기별 성경 암송 시험에 완벽하게 대비해 보세요.
              </p>
              <p className="text-[10px] text-stone-500">
                © 1954-2026 학장교회 (since 1954.03 | 만나: 말씀으로 하나님과 매일 만나는 나) - 오직 여호와의 율법을 즐거워하여 그의 율법을 주야로 묵상하는도다 (시 1:2)
              </p>
            </div>

            {/* CHURCH SERVICE TIMES */}
            <div className="space-y-3 max-w-md">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                ⛪ 학장교회 예배 안내 및 시간
              </h4>
              <div className="text-[12px] text-white font-bold tracking-wide flex items-center gap-1 mt-1 mb-2 bg-stone-900/40 py-1.5 px-3 rounded-lg border border-stone-700/40">
                📍 주소: 부산광역시 사상구 학감대로134번길 46, 학장교회
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-400 text-[11px]">
                <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-700/50 space-y-1">
                  <span className="font-bold text-amber-400 block">주일 예배 (2층 대예배당)</span>
                  <p>• 오전 대예배: 오전 10시 30분</p>
                  <p>• 오후 찬양예배: 오후 2시 00분</p>
                </div>
                <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-700/50 space-y-1">
                  <span className="font-bold text-amber-400 block">주중 & 새벽 예배</span>
                  <p>• 수요 기도회: 저녁 7시 30분 (2층)</p>
                  <p>• 금요 철야기도회: 저녁 7시 30분 (2층)</p>
                  <p>• 새벽 기도회: 매일 새벽 4시 30분 (1층)</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-[10px] text-stone-500 pt-2">
            말씀중심 은혜중심 • 말씀이 일상이 되는 학장교회 성경 암송 트레이너입니다.
          </div>
        </div>
      </footer>
    </div>
  );
}
