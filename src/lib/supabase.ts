import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Verse, VerseStatus, TestAttempt, FaithJournalEntry, PrayerEntry, SaintProgress, MemorizeStatus, AnonymousPrayer, GongGwa, Announcement } from '../types';

// 1. 체크 및 안전한 초기화
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

const isRealConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const isSupabaseConfigured = !!isRealConfigured;

let realSupabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Supabase 초기화 중 오류 발생:", error);
  }
}

export const supabase = realSupabase;

// ========================================================
// 2. 5계층 권한 타입 정의 및 세션 보관 도구
// ========================================================
export type AppRole = 'master' | 'pastor' | 'admin' | 'member' | 'guest';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  phone?: string;
}

// Deterministic UUID formatting helper to map arbitrary string IDs to database-valid UUIDs
export function toUUID(str: string): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str.toLowerCase();
  }
  
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = (hash1 * 31 + ch) | 0;
    hash2 = (hash2 * 37 + ch) | 0;
  }
  
  const hex1 = Math.abs(hash1).toString(16).padEnd(16, 'f');
  const hex2 = Math.abs(hash2).toString(16).padEnd(16, 'f');
  const fullHex = (hex1 + hex2).slice(0, 32);
  
  return `${fullHex.slice(0, 8)}-${fullHex.slice(8, 12)}-4${fullHex.slice(12, 15)}-a${fullHex.slice(15, 18)}-${fullHex.slice(18, 30)}`.toLowerCase();
}

// ========================================================
// 3. API 및 데이터 접근 계층 (Supabase 실서버 전용)
// ========================================================

// 3-1. AUTHENTICATION (인증)
export async function appSignIn(email: string, password: string): Promise<{ user: AppUser | null, error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: "현재 서버에 연결할 수 없습니다." };
  }

  const trimmedEmail = email.trim();
  const loginEmail = trimmedEmail === 'test' ? 'test@church.com' : trimmedEmail;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      return { user: null, error: error.message };
    }
    if (data?.user) {
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

      return { user: appUser, error: null };
    }
  } catch (e: any) {
    return { user: null, error: "현재 서버에 연결할 수 없습니다." };
  }

  return { user: null, error: "로그인 중 오류가 발생했습니다." };
}

export async function appSignUp(name: string, phone: string, email: string, password: string): Promise<{ user: AppUser | null, error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, error: "현재 서버에 연결할 수 없습니다." };
  }

  const trimmedEmail = email.trim();

  try {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name, phone }
      }
    });
    if (error) {
      return { user: null, error: error.message };
    }
    if (data?.user) {
      const role: AppRole = 'member';

      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: trimmedEmail,
          name,
          phone,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (profileErr) {
        console.error("Profile upsert during sign up failed:", profileErr);
      }

      return {
        user: { id: data.user.id, email: trimmedEmail, name, role, phone },
        error: null
      };
    }
  } catch (e: any) {
    return { user: null, error: "현재 서버에 연결할 수 없습니다." };
  }

  return { user: null, error: "회원가입 중 오류가 발생했습니다." };
}

export async function appSignOut(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}

export function onAuthStateChange(callback: (user: AppUser | null) => void) {
  if (!isSupabaseConfigured || !supabase) {
    callback(null);
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        let resolvedRole: AppRole = 'member';
        if (profile && profile.role) {
          resolvedRole = profile.role as AppRole;
        }

        if (session.user.email === 'test@church.com' || resolvedRole === 'guest') {
          resolvedRole = 'guest';
        }

        callback({
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.name || session.user.user_metadata?.name || '성도',
          role: resolvedRole,
          phone: profile?.phone || session.user.user_metadata?.phone || ''
        });
      } catch (err) {
        console.error("Error fetching profile in auth state change:", err);
        callback(null);
      }
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

// 3-2. VERSES (암송 성구)
export async function fetchVerses(): Promise<Verse[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('weekly_verses').select('*').order('date', { ascending: false });
      if (!error && data) {
        return data.map(v => ({
          id: v.id,
          reference: v.reference,
          text: v.text,
          quarter: v.quarter,
          week: v.week,
          hint: v.hint,
          date: v.date,
          isCustom: v.is_custom,
          isPersonal: v.is_personal,
          title: v.title,
          duration: v.duration,
          isActive: v.is_active
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  const local = localStorage.getItem('hagah_verses');
  return local ? JSON.parse(local) : [];
}

export async function saveVerseToDb(verse: Verse): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const payload = {
        id: toUUID(verse.id),
        reference: verse.reference,
        text: verse.text,
        quarter: verse.quarter,
        week: verse.week,
        hint: verse.hint,
        date: verse.date,
        is_custom: verse.isCustom ?? false,
        is_personal: verse.isPersonal ?? false,
        user_id: verse.isPersonal && user ? user.id : null,
        title: verse.title || null,
        duration: verse.duration || null,
        is_active: verse.isActive ?? true
      };
      const { error } = await supabase.from('weekly_verses').upsert(payload);
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

export async function deleteVerseFromDb(verseId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('weekly_verses').delete().eq('id', toUUID(verseId));
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

// 3-2-2. LESSONS (공과)
export async function fetchLessonsFromDb(): Promise<GongGwa[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('lessons').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        return data.map(l => {
          let parsedContent: any = {};
          try {
            parsedContent = JSON.parse(l.content || '{}');
          } catch (err) {
            console.error('Error parsing lesson content:', err);
          }
          
          return {
            id: l.id,
            title: l.title,
            scriptureReference: l.passage || parsedContent.scriptureReference || '',
            verses: parsedContent.verses || (typeof l.verses === 'string' ? JSON.parse(l.verses) : (l.verses || [])),
            coreLessons: parsedContent.coreLessons || (typeof l.core_lessons === 'string' ? JSON.parse(l.core_lessons) : (l.core_lessons || [])),
            qnas: parsedContent.qnas || (typeof l.qnas === 'string' ? JSON.parse(l.qnas) : (l.qnas || [])),
            introduction: parsedContent.introduction || (typeof l.introduction === 'string' ? JSON.parse(l.introduction) : (l.introduction || []))
          };
        });
      }
    } catch (e) {
      console.error('Error fetching lessons:', e);
    }
  }
  const local = localStorage.getItem('hagah_gonggwa_lessons');
  return local ? JSON.parse(local) : [];
}

export async function saveLessonToDb(lesson: GongGwa): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const match = lesson.title.match(/제\s*(\d+)\s*과/);
      const parsedWeek = match ? parseInt(match[1]) : 1;

      const payload = {
        id: toUUID(lesson.id),
        title: lesson.title,
        quarter: 1, 
        week: parsedWeek,    
        passage: lesson.scriptureReference,
        content: JSON.stringify({
          scriptureReference: lesson.scriptureReference,
          verses: lesson.verses,
          coreLessons: lesson.coreLessons,
          qnas: lesson.qnas,
          introduction: lesson.introduction
        }),
        date: new Date().toLocaleDateString()
      };
      const { error } = await supabase.from('lessons').upsert(payload);
      return !error;
    } catch (e) {
      console.error('Error saving lesson:', e);
    }
  }
  return true;
}

export async function deleteLessonFromDb(lessonId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', toUUID(lessonId));
      return !error;
    } catch (e) {
      console.error('Error deleting lesson:', e);
    }
  }
  return true;
}

// 3-2-3. ANNOUNCEMENTS (공지사항)
export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        return data.map(a => ({
          id: a.id,
          title: a.title || '공지사항',
          content: a.content,
          author: a.author,
          date: new Date(a.created_at || Date.now()).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
          created_at: a.created_at
        }));
      }
    } catch (e) {
      console.error('Error fetching announcements:', e);
    }
  }
  const local = localStorage.getItem('hagah_announcements');
  return local ? JSON.parse(local) : [];
}

export async function saveAnnouncementToDb(announcement: Announcement): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        id: toUUID(announcement.id),
        title: announcement.title || '공지사항',
        content: announcement.content,
        author: announcement.author || '관리자'
      };
      const { error } = await supabase.from('announcements').upsert(payload);
      return !error;
    } catch (e) {
      console.error('Error saving announcement:', e);
    }
  }
  return true;
}

export async function deleteAnnouncementFromDb(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', toUUID(id));
      return !error;
    } catch (e) {
      console.error('Error deleting announcement:', e);
    }
  }
  return true;
}

// 3-3. PROGRESS (암송 성구 진도 상태, verse_statuses 대체)
export async function fetchUserStatuses(userId: string): Promise<{ [key: string]: VerseStatus }> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase.from('progress').select('*').eq('user_id', userId);
      if (!error && data) {
        const statuses: { [key: string]: VerseStatus } = {};
        data.forEach(s => {
          statuses[s.verse_id] = {
            verseId: s.verse_id,
            status: s.status as MemorizeStatus,
            streak: s.streak,
            bestScore: s.best_score,
            lastTested: s.last_tested
          };
        });
        return statuses;
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  const local = localStorage.getItem('hagah_statuses');
  return local ? JSON.parse(local) : {};
}

export async function saveStatusToDb(userId: string, status: VerseStatus): Promise<boolean> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const payload = {
        user_id: userId,
        verse_id: toUUID(status.verseId),
        status: status.status,
        streak: status.streak,
        best_score: status.bestScore || 0,
        last_tested: status.lastTested,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('progress').upsert(payload, { onConflict: 'user_id,verse_id' });
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

// 3-4. SUBMISSIONS (제출 및 시도 기록, test_attempts 대체)
export async function fetchUserAttempts(userId: string): Promise<TestAttempt[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        return data.map(a => ({
          id: a.id,
          verseId: a.verse_id,
          reference: a.reference,
          date: a.date,
          userText: a.user_text,
          correctText: a.correct_text,
          score: a.score,
          mode: a.mode as 'blank_fill' | 'full_write' | 'speak_along'
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  const local = localStorage.getItem('hagah_attempts');
  return local ? JSON.parse(local) : [];
}

export async function saveAttemptToDb(userId: string, attempt: TestAttempt): Promise<boolean> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const payload = {
        id: attempt.id.startsWith('attempt-') ? undefined : toUUID(attempt.id),
        user_id: userId,
        verse_id: toUUID(attempt.verseId),
        reference: attempt.reference,
        date: attempt.date,
        user_text: attempt.userText,
        correct_text: attempt.correctText,
        score: attempt.score,
        mode: attempt.mode
      };
      const { error } = await supabase.from('submissions').insert(payload);
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

// 3-5. JOURNALS (신앙 성장 노트, faith_journals 대체)
export async function fetchFaithJournals(userId: string): Promise<FaithJournalEntry[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false });
      if (!error && data) {
        return data.map(j => ({
          id: j.id,
          date: j.date,
          category: j.category as any,
          title: j.title,
          passage: j.passage,
          content: j.content,
          prayer: j.prayer
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  const local = localStorage.getItem('hagah_journals');
  return local ? JSON.parse(local) : [];
}

export async function saveFaithJournalToDb(userId: string, journal: FaithJournalEntry): Promise<boolean> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const payload = {
        id: toUUID(journal.id),
        user_id: userId,
        date: journal.date,
        category: journal.category,
        title: journal.title,
        passage: journal.passage,
        content: journal.content,
        prayer: journal.prayer
      };
      const { error } = await supabase.from('journals').upsert(payload);
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

export async function deleteFaithJournalFromDb(journalId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('journals').delete().eq('id', toUUID(journalId));
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

// 3-6. PRAYERS (중보기도판)
export async function fetchPrayersFromDb(): Promise<AnonymousPrayer[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(p => ({
          id: p.id,
          category: p.category as any,
          title: p.title,
          content: p.content,
          date: p.date,
          amenCount: p.amen_count,
          status: p.status as 'praying' | 'answered',
          isAnonymous: p.is_anonymous,
          authorName: p.author_name
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  const local = localStorage.getItem('manna_anonymous_prayers');
  return local ? JSON.parse(local) : [];
}

export async function savePrayerToDb(userId: string | null, prayer: AnonymousPrayer): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        id: toUUID(prayer.id),
        user_id: userId || null,
        category: prayer.category,
        title: prayer.title,
        content: prayer.content,
        date: prayer.date,
        amen_count: prayer.amenCount,
        status: prayer.status,
        author_name: prayer.authorName || '무명성도',
        is_anonymous: prayer.isAnonymous ?? true
      };
      const { error } = await supabase.from('prayers').upsert(payload);
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

export async function deletePrayerFromDb(prayerId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('prayers').delete().eq('id', toUUID(prayerId));
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

// 3-7. SAINTS PROGRESS (성도 전체 양육 상태 - profiles 및 progress에서 동적 계산)
export async function fetchSaintsProgressFromDb(currentUserRole: AppRole): Promise<SaintProgress[]> {
  if (currentUserRole === 'admin') {
    return [];
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: members, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, created_at')
        .eq('role', 'member');

      if (profilesError) throw profilesError;

      if (members && members.length > 0) {
        const { data: progressRows, error: progressError } = await supabase
          .from('progress')
          .select('user_id, status, updated_at');

        if (progressError) throw progressError;

        let totalCount = 12;
        try {
          const { count } = await supabase.from('weekly_verses').select('*', { count: 'exact', head: true });
          if (count !== null && count > 0) {
            totalCount = count;
          }
        } catch (vErr) {
          console.error("Error fetching total verses count for progress calculation:", vErr);
        }

        return members.map(m => {
          const userProgress = progressRows?.filter(p => p.user_id === m.id) || [];
          const completedCount = userProgress.filter(p => p.status === 'completed').length;
          const achievementRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          
          let lastActivity = m.created_at ? new Date(m.created_at).toLocaleDateString() : '';
          if (userProgress.length > 0) {
            const dates = userProgress
              .map(p => p.updated_at)
              .filter(Boolean)
              .map(d => new Date(d).getTime());
            if (dates.length > 0) {
              lastActivity = new Date(Math.max(...dates)).toLocaleDateString();
            }
          }

          return {
            id: m.id,
            name: m.name,
            completedCount,
            totalCount,
            achievementRate,
            lastActivity
          };
        });
      }
      return [];
    } catch (e) {
      console.error("Error dynamically calculating saints progress:", e);
    }
  }

  const local = localStorage.getItem('manna_saints');
  return local ? JSON.parse(local) : [];
}

export async function saveSaintProgressToDb(saint: SaintProgress): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        id: saint.id,
        name: saint.name,
        role: 'member' as any,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('profiles').upsert(payload);
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

export async function deleteSaintFromDb(saintId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', saintId);
      return !error;
    } catch (e) {
      console.error(e);
    }
  }
  return true;
}

export async function updateSaintCompletedCountInDb(saintId: string, count: number, total: number, dateStr: string): Promise<boolean> {
  // 진도 상태는 progress 테이블에 upsert 시 자동으로 동적 계산되므로, 
  // 여기서는 중복 디스크 정합성 방지를 위해 단순 성공 승인 처리만 실행합니다.
  return true;
}
