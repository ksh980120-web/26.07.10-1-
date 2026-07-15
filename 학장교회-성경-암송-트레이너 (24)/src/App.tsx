/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookMarked,
  Lock,
  History,
  Award,
  Trash2,
  Edit3,
  BookOpen,
  Mic,
  Heart,
  SlidersHorizontal,
  Settings,
  ChevronRight,
  Menu,
  X as XIcon
} from 'lucide-react';

import { Verse, VerseStatus, MemorizeStatus, TestAttempt, GongGwa, AnonymousPrayer, Announcement, VerseSubmission, Sermon, AppUser, FamilyWorship, FaithJournalEntry } from './types';
import BlankPractice from './components/BlankPractice';
import WriteTest from './components/WriteTest';
import ManagerPanel from './components/ManagerPanel';
import SpeakAlong from './components/SpeakAlong';
import MainLanding from './components/MainLanding';
import DashboardPanel from './components/DashboardPanel';
import ScriptureCms from './components/ScriptureCms';
import { AuthProvider, useAuth } from './context/AuthContext';
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
  fetchLessonsFromDb,
  saveLessonToDb,
  deleteLessonFromDb,
  fetchAnnouncements,
  saveAnnouncementToDb,
  deleteAnnouncementFromDb,
  fetchSermons,
  saveSermonToDb,
  deleteSermonFromDb,
  submitVerseToPastor,
  fetchUserSubmissions,
  fetchFamilyWorships,
  saveFamilyWorshipToDb,
  deleteFamilyWorshipFromDb,
  fetchFaithJournals,
  toUUID,
  supabase
} from './lib/supabase';

function MainAppContent() {
  const {
    user,
    isAuthenticated,
    userRole,
    currentUserId,
    currentUserName,
    currentUserPhone,
    signOut,
    setGuestSession
  } = useAuth();

  // --- BUSINESS LOGIC STATE ---
  const [verses, setVerses] = useState<Verse[]>([]);
  const [verseStatuses, setVerseStatuses] = useState<{ [key: string]: VerseStatus }>({});
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [streak, setStreak] = useState<number>(() => {
    return Number(sessionStorage.getItem('hagah_streak') || '0');
  });
  const [selectedQuarter, setSelectedQuarter] = useState<number>(0);
  const [pinnedVerseId, setPinnedVerseId] = useState<string>(() => sessionStorage.getItem('hagah_pinned_verse') || '');
  const [pinnedMonthVerseId, setPinnedMonthVerseId] = useState<string>(() => sessionStorage.getItem('hagah_pinned_month_verse') || '');
  const [gongGwaLessons, setGongGwaLessons] = useState<GongGwa[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [showAddAnnForm, setShowAddAnnForm] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnAuthor, setNewAnnAuthor] = useState('');

  // Weekly verse submissions state
  const [userSubmissions, setUserSubmissions] = useState<VerseSubmission[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState<{ [verseId: string]: boolean }>({});
  const [submissionError, setSubmissionError] = useState<{ [verseId: string]: string | null }>({});
  const [journals, setJournals] = useState<FaithJournalEntry[]>([]);

  const [isCommonDataLoading, setIsCommonDataLoading] = useState<boolean>(true);
  const [commonDataError, setCommonDataError] = useState<string | null>(null);

  // Navigation / Mode states
  const [activeView, setActiveView] = useState<'list' | 'blank_practice' | 'write_test' | 'speak_along'>('list');
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [activeCmsTab, setActiveCmsTab] = useState<'none' | 'scripture_cms'>('none');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Tab layout
  const [activeMainTab, setActiveMainTab] = useState<'community' | 'gonggwa' | 'personal' | 'prayer' | 'sermon'>('community');

  // Anonymous Prayers state
  const [prayers, setPrayers] = useState<AnonymousPrayer[]>([]);
  // Family Worships state
  const [familyWorships, setFamilyWorships] = useState<FamilyWorship[]>([]);

  const handleAddPrayer = async (entry: AnonymousPrayer) => {
    setPrayers(prev => [entry, ...prev]);
    await savePrayerToDb(currentUserId || null, entry);
    await syncPrayers();
  };

  const handleUpdatePrayer = async (id: string, updatedFields: Partial<AnonymousPrayer>) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    const updated = prayers.find(p => p.id === id);
    if (updated) {
      await savePrayerToDb(currentUserId || null, { ...updated, ...updatedFields });
      await syncPrayers();
    }
  };

  const handleIncrementAmen = async (id: string, isAdding: boolean = true) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, amenCount: Math.max(0, p.amenCount + (isAdding ? 1 : -1)) } : p));
    const target = prayers.find(p => p.id === id);
    if (target) {
      await savePrayerToDb(currentUserId || null, { ...target, amenCount: Math.max(0, target.amenCount + (isAdding ? 1 : -1)) });
      await syncPrayers();
    }
  };

  const handleDeletePrayer = async (id: string) => {
    setPrayers(prev => prev.filter(p => p.id !== id));
    await deletePrayerFromDb(id);
    await syncPrayers();
  };

  const handleTogglePrayerStatus = async (id: string) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'praying' ? 'answered' : 'praying' } : p));
    const target = prayers.find(p => p.id === id);
    if (target) {
      await savePrayerToDb(currentUserId || null, { ...target, status: target.status === 'praying' ? 'answered' : 'praying' });
      await syncPrayers();
    }
  };

  // Admin authentication helper (Internal CMS gating)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('hagah_admin_auth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Quick self-check eye toggle
  const [blurredCards, setBlurredCards] = useState<{ [key: string]: boolean }>({});

  // Sort order: 'latest' (최신순) or 'oldest' (과거순)
  const [verseSortOrder, setVerseSortOrder] = useState<'latest' | 'oldest'>('latest');

  // Currently being edited verse by admin
  const [adminEditingVerse, setAdminEditingVerse] = useState<Verse | null>(null);

  // Deletion confirmation overlay helper
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to de-duplicate verses
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

      // Clean legacy localStorage keys to respect offline data removal rule
      localStorage.removeItem('hagah_verses');
      localStorage.removeItem('hagah_gonggwa_lessons');
      localStorage.removeItem('hagah_announcements');

      try {
        const dbVerses = await fetchVerses();
        setVerses(deduplicateVerses(dbVerses || []));

        const dbLessons = await fetchLessonsFromDb();
        setGongGwaLessons(dbLessons || []);

        const dbAnnouncements = await fetchAnnouncements();
        setAnnouncements(dbAnnouncements || []);

        const dbSermons = await fetchSermons();
        setSermons(dbSermons || []);

        const dbFamilyWorships = await fetchFamilyWorships();
        setFamilyWorships(dbFamilyWorships || []);

        const dbPrayers = await fetchPrayersFromDb();
        setPrayers(dbPrayers || []);
      } catch (e) {
        console.error("Error loading core data:", e);
        setCommonDataError("학장교회 데이터를 불러오는 중 오류가 발생했습니다. 네트워크 연결을 확인해 주세요.");
      } finally {
        setIsCommonDataLoading(false);
      }
    };

    loadCoreData();
  }, [isAdminAuthenticated]);

  // Sync admin authentication with central user role
  useEffect(() => {
    if (userRole === 'master' || userRole === 'pastor' || userRole === 'admin') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('hagah_admin_auth', 'true');
    } else {
      setIsAdminAuthenticated(false);
      sessionStorage.removeItem('hagah_admin_auth');
    }
  }, [userRole]);

  // --- REAL-TIME POLL & SYNC HELPER FUNCTIONS ---
  const syncVerses = async () => {
    try {
      const dbVerses = await fetchVerses();
      if (dbVerses) {
        setVerses(deduplicateVerses(dbVerses));
      }
    } catch (e) {
      console.error("Error syncing verses:", e);
    }
  };

  const syncLessons = async () => {
    try {
      const dbLessons = await fetchLessonsFromDb();
      if (dbLessons) {
        setGongGwaLessons(dbLessons);
      }
    } catch (e) {
      console.error("Error syncing lessons:", e);
    }
  };

  const syncAnnouncements = async () => {
    try {
      const dbAnnouncements = await fetchAnnouncements();
      if (dbAnnouncements) {
        setAnnouncements(dbAnnouncements);
      }
    } catch (e) {
      console.error("Error syncing announcements:", e);
    }
  };

  const syncSermons = async () => {
    try {
      const dbSermons = await fetchSermons();
      if (dbSermons) {
        setSermons(dbSermons);
      }
    } catch (e) {
      console.error("Error syncing sermons:", e);
    }
  };

  const syncFamilyWorships = async () => {
    try {
      const dbFamilyWorships = await fetchFamilyWorships();
      if (dbFamilyWorships) {
        setFamilyWorships(dbFamilyWorships);
      }
    } catch (e) {
      console.error("Error syncing family worships:", e);
    }
  };

  const syncPrayers = async () => {
    try {
      const dbPrayers = await fetchPrayersFromDb();
      if (dbPrayers) {
        setPrayers(dbPrayers);
      }
    } catch (e) {
      console.error("Error syncing prayers:", e);
    }
  };

  // --- REAL-TIME POLL & SYNC ---
  useEffect(() => {
    const syncCommonData = async () => {
      await Promise.allSettled([
        syncVerses(),
        syncLessons(),
        syncAnnouncements(),
        syncSermons(),
        syncFamilyWorships(),
        syncPrayers()
      ]);
    };

    const interval = setInterval(syncCommonData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load user-specific data on user change
  useEffect(() => {
    const loadUserSpecificData = async () => {
      if (!isAuthenticated || userRole === 'guest' || !currentUserId) {
        setVerseStatuses({});
        setAttempts([]);
        setUserSubmissions([]);
        setJournals([]);
        return;
      }

      const dbStatuses = await fetchUserStatuses(currentUserId);
      setVerseStatuses(dbStatuses);

      const dbAttempts = await fetchUserAttempts(currentUserId);
      setAttempts(dbAttempts);

      const dbSubs = await fetchUserSubmissions(currentUserId);
      setUserSubmissions(dbSubs);

      const dbJournals = await fetchFaithJournals(currentUserId);
      setJournals(dbJournals);
    };

    loadUserSpecificData();
  }, [currentUserId, userRole, isAuthenticated]);

  // Sync state with back/forward popstates
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        if (event.state.view === 'manager') {
          setShowManager(true);
          setActiveCmsTab('none');
          setActiveView('list');
        } else if (event.state.view === 'scripture_cms') {
          setShowManager(false);
          setActiveCmsTab('scripture_cms');
          setActiveView('list');
        } else {
          setShowManager(false);
          setActiveCmsTab('none');
          setActiveView(event.state.view || 'list');
          setSelectedVerseId(event.state.verseId || null);
        }
      } else {
        setActiveView('list');
        setSelectedVerseId(null);
        setShowManager(false);
        setActiveCmsTab('none');
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (!window.history.state) {
      window.history.replaceState({ view: 'list', verseId: null }, '');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Scroll to top on navigation transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeView, activeMainTab, showManager, activeCmsTab]);

  const goBack = () => {
    if (showManager) {
      setShowManager(false);
      window.history.pushState({ view: 'list', verseId: null }, '');
    } else if (activeCmsTab !== 'none') {
      setActiveCmsTab('none');
      window.history.pushState({ view: 'list', verseId: null }, '');
    } else if (window.history.state && window.history.state.view !== 'list') {
      window.history.back();
    } else {
      setActiveView('list');
      setSelectedVerseId(null);
    }
  };

  const saveVerses = (updatedVerses: Verse[]) => {
    const cleaned = deduplicateVerses(updatedVerses);
    setVerses(cleaned);
  };

  const saveStatuses = async (updatedStatuses: { [key: string]: VerseStatus }) => {
    setVerseStatuses(updatedStatuses);
    if (userRole !== 'guest') {
      if (currentUserId) {
        for (const verseId of Object.keys(updatedStatuses)) {
          await saveStatusToDb(currentUserId, updatedStatuses[verseId]);
        }
        
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
    const deletedLessons = gongGwaLessons.filter(oldL => !updatedGongGwa.some(newL => newL.id === oldL.id));
    setGongGwaLessons(updatedGongGwa);
    
    if (isAdminAuthenticated) {
      for (const oldL of deletedLessons) {
        await deleteLessonFromDb(oldL.id);
      }
      for (const lesson of updatedGongGwa) {
        await saveLessonToDb(lesson);
      }
      await syncLessons();
    }
  };

  const saveSermons = async (updatedSermons: Sermon[]) => {
    const deletedSermons = sermons.filter(oldS => !updatedSermons.some(newS => newS.id === oldS.id));
    setSermons(updatedSermons);
    
    if (isAdminAuthenticated) {
      for (const oldS of deletedSermons) {
        await deleteSermonFromDb(oldS.id);
      }
      for (const sermon of updatedSermons) {
        await saveSermonToDb(sermon);
      }
      await syncSermons();
    }
  };

  const saveFamilyWorships = async (updatedFWs: FamilyWorship[]) => {
    const deletedFWs = familyWorships.filter(oldFW => !updatedFWs.some(newFW => newFW.id === oldFW.id));
    setFamilyWorships(updatedFWs);
    
    if (isAdminAuthenticated) {
      for (const oldFW of deletedFWs) {
        await deleteFamilyWorshipFromDb(oldFW.id);
      }
      for (const fw of updatedFWs) {
        await saveFamilyWorshipToDb(fw);
      }
      await syncFamilyWorships();
    }
  };

  const handleUpdateAnnouncement = async (id: string, updatedFields: Partial<Announcement>) => {
    const updated = announcements.map(a => {
      if (a.id === id) {
        return { ...a, ...updatedFields };
      }
      return a;
    });
    setAnnouncements(updated);
    try {
      const match = announcements.find(a => a.id === id);
      if (match) {
        await saveAnnouncementToDb({ ...match, ...updatedFields });
        await syncAnnouncements();
      }
    } catch (e) {
      console.error('Error updating announcement:', e);
    }
  };

  const findVerseById = (id: string | null): Verse | undefined => {
    if (!id) return undefined;
    
    const mainVerse = verses.find(v => v.id === id);
    if (mainVerse) return mainVerse;

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

  const handlePinVerse = (id: string) => {
    const newPinId = pinnedVerseId === id ? '' : id;
    setPinnedVerseId(newPinId);
    sessionStorage.setItem('hagah_pinned_verse', newPinId);
  };

  const handlePinMonthVerse = (id: string) => {
    const newPinId = pinnedMonthVerseId === id ? '' : id;
    setPinnedMonthVerseId(newPinId);
    sessionStorage.setItem('hagah_pinned_month_verse', newPinId);
  };

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
      await syncVerses();
    }

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

  const handleUpdateVerse = async (id: string, updatedFields: Partial<Verse>) => {
    const updated = verses.map(v => v.id === id ? { ...v, ...updatedFields } : v);
    saveVerses(updated);

    const target = updated.find(v => v.id === id);
    if (target && isAdminAuthenticated) {
      await saveVerseToDb(target);
      await syncVerses();
    }
  };

  const handleUpdateMultipleVerses = async (ids: string[], updatedFields: Partial<Verse>) => {
    if (ids.length === 0) return;
    const updated = verses.map(v => ids.includes(v.id) ? { ...v, ...updatedFields } : v);
    saveVerses(updated);

    if (isAdminAuthenticated) {
      for (const id of ids) {
        const target = updated.find(v => v.id === id);
        if (target) {
          await saveVerseToDb(target);
        }
      }
      await syncVerses();
    }
  };

  const handleDeleteVerse = async (id: string) => {
    const isPersonal = verses.find(v => v.id === id)?.isPersonal;
    const updated = verses.filter(v => v.id !== id);
    saveVerses(updated);

    if (isAdminAuthenticated || (isPersonal && userRole !== 'guest')) {
      await deleteVerseFromDb(id);
      await syncVerses();
    }

    const updatedStatuses = { ...verseStatuses };
    delete updatedStatuses[id];
    saveStatuses(updatedStatuses);

    if (pinnedVerseId === id) {
      setPinnedVerseId('');
      sessionStorage.removeItem('hagah_pinned_verse');
    }
  };

  const handleDeleteMultipleVerses = async (ids: string[]) => {
    if (ids.length === 0) return;
    const updated = verses.filter(v => !ids.includes(v.id));
    saveVerses(updated);

    if (isAdminAuthenticated) {
      for (const id of ids) {
        await deleteVerseFromDb(id);
      }
      await syncVerses();
    }

    const updatedStatuses = { ...verseStatuses };
    for (const id of ids) {
      delete updatedStatuses[id];
    }
    saveStatuses(updatedStatuses);

    if (ids.includes(pinnedVerseId)) {
      setPinnedVerseId('');
      sessionStorage.removeItem('hagah_pinned_verse');
    }
    if (ids.includes(pinnedMonthVerseId)) {
      setPinnedMonthVerseId('');
      sessionStorage.removeItem('hagah_pinned_month_verse');
    }
  };

  const handleImportVerses = async (imported: Verse[]) => {
    const processedImported = imported.map((v, i) => ({
      ...v,
      id: `verse-import-${Date.now()}-${i}`,
      isCustom: true
    }));

    const merged = [...verses.filter(v => !v.isCustom), ...processedImported];
    saveVerses(merged);

    if (isAdminAuthenticated) {
      for (const v of processedImported) {
        await saveVerseToDb(v);
      }
      await syncVerses();
    }

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

  const handleResetToDefaults = async () => {
    saveStatuses({});
    setPinnedVerseId('');
    sessionStorage.removeItem('hagah_pinned_verse');
  };

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
      await syncAnnouncements();
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);

    if (isAdminAuthenticated) {
      await deleteAnnouncementFromDb(id);
      await syncAnnouncements();
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

  const handleStartApp = (appUser: AppUser) => {
    setGuestSession(appUser);
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

  const handleAddPersonalVerse = async (newVerseData: Omit<Verse, 'id' | 'isPersonal' | 'quarter' | 'week'>) => {
    const rawId = `verse-personal-${Date.now()}`;
    const deterministicId = toUUID(rawId);

    const newVerse: Verse = {
      ...newVerseData,
      id: deterministicId,
      quarter: 0,
      week: 0,
      isPersonal: true
    };
    const updated = [...verses, newVerse];
    saveVerses(updated);

    if (userRole !== 'guest' && currentUserId) {
      await saveVerseToDb({ ...newVerse, isPersonal: true });
      await syncVerses();
    }

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

  const handleUpdatePersonalVerse = async (id: string, updatedFields: Partial<Verse>) => {
    const updated = verses.map(v => v.id === id ? { ...v, ...updatedFields } : v);
    saveVerses(updated);

    if (userRole !== 'guest' && currentUserId) {
      const target = updated.find(v => v.id === id);
      if (target) {
        await saveVerseToDb(target);
        await syncVerses();
      }
    }
  };

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

  const handleBlankComplete = (score: number) => {
    if (!selectedVerseId) return;

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

    setActiveView('list');
    setSelectedVerseId(null);
  };

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

      if (score >= 80) {
        const todayStr = new Date().toLocaleDateString();
        const lastSuccessDate = sessionStorage.getItem('hagah_last_success_date');
        if (lastSuccessDate !== todayStr) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          sessionStorage.setItem('hagah_streak', String(newStreak));
          sessionStorage.setItem('hagah_last_success_date', todayStr);
        }
      }
    }

    setActiveView('list');
    setSelectedVerseId(null);
  };

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

      if (score >= 80) {
        const todayStr = new Date().toLocaleDateString();
        const lastSuccessDate = sessionStorage.getItem('hagah_last_success_date');
        if (lastSuccessDate !== todayStr) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          sessionStorage.setItem('hagah_streak', String(newStreak));
          sessionStorage.setItem('hagah_last_success_date', todayStr);
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

  if (!user) {
    return <MainLanding onStart={handleStartApp} />;
  }

  return (
    <div className="bg-[#FDFBF7] min-h-screen text-[#4A4A4A] font-sans selection:bg-[#E9E3D8]" id="main-app">
      
      {/* GLOBAL NAVBAR */}
      <header className="bg-white border-b border-[#E9E3D8] sticky top-0 z-40 shadow-sm" id="global-header">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 font-sans">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden p-1.5 rounded-xl border border-[#E9E3D8] bg-[#FDFBF7] hover:bg-[#F5F5F0] text-[#5A5A40] cursor-pointer"
                title="메뉴 토글"
              >
                {isMobileSidebarOpen ? <XIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              <div className="bg-[#8A9A5B] p-2 rounded-xl text-white hidden xs:block">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h1 className="text-base sm:text-lg font-serif font-semibold tracking-tight text-[#5A5A40] flex items-center justify-start gap-1.5">
                  학장교회 성경암송 <span className="text-[10px] sm:text-xs font-serif font-medium px-1.5 py-0.5 bg-[#F5F5F0] text-[#8A9A5B] border border-[#E9E3D8] rounded" title="말씀으로 하나님과 매일 만나는 나">만나</span>
                </h1>
                <p className="text-[10px] text-[#7A7A6A] flex items-center justify-start gap-1.5 mt-0.5 font-semibold">
                  <span>반갑습니다, <strong>{currentUserName}</strong>님</span>
                  {userRole && (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      userRole === 'master' ? 'bg-indigo-100 text-indigo-700' :
                      userRole === 'pastor' ? 'bg-[#EAF2D7] text-[#8A9A5B]' :
                      userRole === 'admin' ? 'bg-amber-100 text-amber-700' :
                      userRole === 'member' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {userRole === 'master' ? '마스터' :
                       userRole === 'pastor' ? '담임목사님' :
                       userRole === 'admin' ? '관리자' :
                       userRole === 'member' ? '성도님' :
                       '성도님'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
            {/* MAIN LOGOUT BUTTON */}
            <button
              onClick={signOut}
              className="text-[10px] sm:text-xs text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-full font-bold transition cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 py-8" id="main-content-layout">
        
        {/* Practice view (full screen without sidebar) */}
        {activeView !== 'list' && selectedVerseId ? (
          <div className="space-y-8">
            {activeView === 'blank_practice' ? (
              <BlankPractice
                verse={findVerseById(selectedVerseId)!}
                onComplete={handleBlankComplete}
                onBack={goBack}
              />
            ) : activeView === 'write_test' ? (
              <WriteTest
                verse={findVerseById(selectedVerseId)!}
                onComplete={handleWriteComplete}
                onBack={goBack}
              />
            ) : (
              <SpeakAlong
                verse={findVerseById(selectedVerseId)!}
                onComplete={handleSpeakComplete}
                onBack={goBack}
              />
            )}
          </div>
        ) : (
          /* Responsive Layout: Sidebar + Main Content */
          <div className={userRole === 'master' || userRole === 'pastor' || userRole === 'admin' ? "grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-8 items-start" : "max-w-5xl mx-auto w-full"}>
            
            {/* Sidebar (Desktop Persistent / Mobile Drawer Backdrop-Collapsible) */}
            {(userRole === 'master' || userRole === 'pastor' || userRole === 'admin') && (
              <aside className={`lg:block ${isMobileSidebarOpen ? 'block' : 'hidden'} space-y-4`} id="left-sidebar-navigation">
                <div className="bg-white border border-[#E9E3D8] rounded-[24px] p-4 shadow-sm space-y-4">
                  {/* Pastor/Admin/Master Admin Features */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#A0A090] uppercase tracking-wider block px-2.5 mb-1.5">관리자 설정</span>
                    
                    {/* General Manager CMS (행정관리 / 관리자 설정) */}
                    <button
                      onClick={() => {
                        setActiveCmsTab('none');
                        setShowManager(true);
                        setIsMobileSidebarOpen(false);
                        window.history.pushState({ view: 'manager', verseId: null }, '');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        activeCmsTab === 'none' && showManager
                          ? 'bg-[#5A5A40] text-white shadow-sm font-black'
                          : 'text-[#5A5A40] hover:bg-[#F5F5F0]'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>관리자 설정 ⚙️</span>
                    </button>
                  </div>
                </div>
              </aside>
            )}

            {/* Right main content area */}
            <div className="space-y-8 w-full" id="right-main-content">
              {showManager ? (
                !isAdminAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto bg-white border border-[#E9E3D8] rounded-[32px] p-8 shadow-sm space-y-6 font-sans"
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
                          className="flex-1 py-3 bg-[#F5F5F0] hover:bg-[#E9E3D8] border border-[#E9E3D8] text-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-[#5A5A40] hover:bg-[#4A4A30] text-white border border-[#5A5A40] text-xs font-bold rounded-xl transition cursor-pointer"
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
                    onUpdateMultipleVerses={handleUpdateMultipleVerses}
                    onDeleteVerse={handleDeleteVerse}
                    onDeleteMultipleVerses={handleDeleteMultipleVerses}
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
                    announcements={announcements}
                    onUpdateAnnouncement={handleUpdateAnnouncement}
                    onAddAnnouncement={handleAddAnnouncement}
                    onDeleteAnnouncement={handleDeleteAnnouncement}
                    sermons={sermons}
                    onUpdateSermons={saveSermons}
                    familyWorships={familyWorships}
                    onUpdateFamilyWorships={saveFamilyWorships}
                  />
                )
              ) : (
                <div className="space-y-10">
                  <DashboardPanel
                    verses={verses}
                    verseStatuses={verseStatuses}
                    streak={streak}
                    journals={journals}
                    currentUserName={currentUserName}
                    userRole={userRole}
                    currentUserId={currentUserId}
                    isCommonDataLoading={isCommonDataLoading}
                    commonDataError={commonDataError}
                    pinnedVerseId={pinnedVerseId}
                    pinnedMonthVerseId={pinnedMonthVerseId}
                    blurredCards={blurredCards}
                    verseSortOrder={verseSortOrder}
                    selectedQuarter={selectedQuarter}
                    onPinVerse={handlePinVerse}
                    onPinMonthVerse={handlePinMonthVerse}
                    onToggleBlurCard={toggleBlurCard}
                    onStartBlankPractice={startBlankPractice}
                    onStartWriteTest={startWriteTest}
                    onStartSpeakAlong={startSpeakAlong}
                    onSubmitVerseToPastor={handleSubmitVerseToPastor}
                    submissionLoading={submissionLoading}
                    submissionError={submissionError}
                    userSubmissions={userSubmissions}
                    isAdminAuthenticated={isAdminAuthenticated}
                    onEditVerse={setAdminEditingVerse}
                    onDeleteVerse={handleDeleteVerse}
                    setVerseSortOrder={setVerseSortOrder}
                    setSelectedQuarter={setSelectedQuarter}
                    activeMainTab={activeMainTab}
                    setActiveMainTab={setActiveMainTab}
                    gongGwaLessons={gongGwaLessons}
                    prayers={prayers}
                    onAddPrayer={handleAddPrayer}
                    onIncrementAmen={handleIncrementAmen}
                    onUpdatePrayer={handleUpdatePrayer}
                    onTogglePrayerStatus={handleTogglePrayerStatus}
                    onDeletePrayer={handleDeletePrayer}
                    sermons={sermons}
                    familyWorships={familyWorships}
                    onAddPersonalVerse={handleAddPersonalVerse}
                    onUpdatePersonalVerse={handleUpdatePersonalVerse}
                    onStatusChange={handleStatusChange}
                    announcements={announcements}
                    showAddAnnForm={showAddAnnForm}
                    setShowAddAnnForm={setShowAddAnnForm}
                    newAnnTitle={newAnnTitle}
                    setNewAnnTitle={setNewAnnTitle}
                    newAnnContent={newAnnContent}
                    setNewAnnContent={setNewAnnContent}
                    newAnnAuthor={newAnnAuthor}
                    setNewAnnAuthor={setNewAnnAuthor}
                    onNewAnnSubmit={handleNewAnnSubmit}
                    onDeleteAnnouncement={handleDeleteAnnouncement}
                    deleteConfirmId={deleteConfirmId}
                    setDeleteConfirmId={setDeleteConfirmId}
                  />

                  {/* TEST ATTEMPTS HISTORY PANEL */}
                  {activeMainTab === 'community' && attempts.length > 0 && (
                    <div className="bg-white border border-[#E9E3D8] rounded-3xl p-6 shadow-sm font-sans" id="attempts-history">
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
      <footer className="bg-stone-800 text-stone-400 mt-20 border-t border-stone-700 py-12 px-6 font-sans" id="app-footer">
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

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
