import { createClient } from '@supabase/supabase-js';
import { Verse, VerseStatus, TestAttempt, FaithJournalEntry, PrayerEntry, SaintProgress, MemorizeStatus, AnonymousPrayer, GongGwa, Announcement, VerseSubmission } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Connection parameters logging for debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.log("- Supabase URL:", supabaseUrl);
  console.log("- URL 존재 여부:", !!supabaseUrl);
  console.log("- KEY 존재 여부:", !!supabaseAnonKey);
  console.log("- createClient 생성 여부: false");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// 2. AUTHENTICATION LISTENER
export function onAuthStateChange(callback: (user: AppUser | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.log("- Supabase URL:", supabaseUrl);
          console.log("- URL 존재 여부:", !!supabaseUrl);
          console.log("- KEY 존재 여부:", !!supabaseAnonKey);
          console.log("- createClient 생성 여부:", !!supabase);
          console.log("- 실제 Supabase 응답:", { error });
        }

        let resolvedRole: AppRole = 'member';
        if (profile && profile.role) {
          resolvedRole = profile.role as AppRole;
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

// 3. VERSES (암송 성구)
export async function fetchVerses(): Promise<Verse[]> {
  try {
    const { data, error } = await supabase.from('weekly_verses').select('*').order('date', { ascending: false });
    if (error) {
      console.log("- Supabase URL:", supabaseUrl);
      console.log("- URL 존재 여부:", !!supabaseUrl);
      console.log("- KEY 존재 여부:", !!supabaseAnonKey);
      console.log("- createClient 생성 여부:", !!supabase);
      console.log("- 실제 Supabase 응답:", { error, data });
      throw error;
    }
    return (data || []).map(v => ({
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
  } catch (e) {
    console.error("Error fetching verses:", e);
    return [];
  }
}

export async function saveVerseToDb(verse: Verse): Promise<boolean> {
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
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving verse:", e);
    return false;
  }
}

export async function deleteVerseFromDb(verseId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('weekly_verses').delete().eq('id', toUUID(verseId));
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error deleting verse:", e);
    return false;
  }
}

// 4. LESSONS (공과)
export async function fetchLessonsFromDb(): Promise<GongGwa[]> {
  try {
    const { data, error } = await supabase.from('lessons').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(l => {
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
  } catch (e) {
    console.error('Error fetching lessons:', e);
    return [];
  }
}

export async function saveLessonToDb(lesson: GongGwa): Promise<boolean> {
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
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error saving lesson:', e);
    return false;
  }
}

export async function deleteLessonFromDb(lessonId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('lessons').delete().eq('id', toUUID(lessonId));
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error deleting lesson:', e);
    return false;
  }
}

// 5. ANNOUNCEMENTS (공지사항)
export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      title: a.title || '공지사항',
      content: a.content,
      author: a.author,
      date: new Date(a.created_at || Date.now()).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      created_at: a.created_at
    }));
  } catch (e) {
    console.error('Error fetching announcements:', e);
    return [];
  }
}

export async function saveAnnouncementToDb(announcement: Announcement): Promise<boolean> {
  try {
    const payload = {
      id: toUUID(announcement.id),
      title: announcement.title || '공지사항',
      content: announcement.content,
      author: announcement.author || '관리자'
    };
    const { error } = await supabase.from('announcements').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error saving announcement:', e);
    return false;
  }
}

export async function deleteAnnouncementFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', toUUID(id));
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error deleting announcement:', e);
    return false;
  }
}

// 6. PROGRESS (verse_statuses)
export async function fetchUserStatuses(userId: string): Promise<{ [key: string]: VerseStatus }> {
  try {
    const { data, error } = await supabase.from('progress').select('*').eq('user_id', userId);
    if (error) throw error;
    const statuses: { [key: string]: VerseStatus } = {};
    (data || []).forEach(s => {
      statuses[s.verse_id] = {
        verseId: s.verse_id,
        status: s.status as MemorizeStatus,
        streak: s.streak,
        bestScore: s.best_score,
        lastTested: s.last_tested
      };
    });
    return statuses;
  } catch (e) {
    console.error("Error fetching user statuses:", e);
    return {};
  }
}

export async function saveStatusToDb(userId: string, status: VerseStatus): Promise<boolean> {
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
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving status:", e);
    return false;
  }
}

// 7. TEST ATTEMPTS
export async function fetchUserAttempts(userId: string): Promise<TestAttempt[]> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      verseId: a.verse_id,
      reference: a.reference,
      date: a.date,
      userText: a.user_text,
      correctText: a.correct_text,
      score: a.score,
      mode: a.mode as 'blank_fill' | 'full_write' | 'speak_along'
    }));
  } catch (e) {
    console.error("Error fetching user attempts:", e);
    return [];
  }
}

export async function saveAttemptToDb(userId: string, attempt: TestAttempt): Promise<boolean> {
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
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving attempt:", e);
    return false;
  }
}

// 8. FAITH JOURNALS
export async function fetchFaithJournals(userId: string): Promise<FaithJournalEntry[]> {
  try {
    const { data, error } = await supabase.from('journals').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(j => ({
      id: j.id,
      date: j.date,
      category: j.category as any,
      title: j.title,
      passage: j.passage,
      content: j.content,
      prayer: j.prayer
    }));
  } catch (e) {
    console.error("Error fetching faith journals:", e);
    return [];
  }
}

export async function saveFaithJournalToDb(userId: string, journal: FaithJournalEntry): Promise<boolean> {
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
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving journal:", e);
    return false;
  }
}

export async function deleteFaithJournalFromDb(journalId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('journals').delete().eq('id', toUUID(journalId));
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error deleting journal:", e);
    return false;
  }
}

// 9. ANONYMOUS PRAYERS
export async function fetchPrayersFromDb(): Promise<AnonymousPrayer[]> {
  try {
    const { data, error } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(p => ({
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
  } catch (e) {
    console.error("Error fetching prayers:", e);
    return [];
  }
}

export async function savePrayerToDb(userId: string | null, prayer: AnonymousPrayer): Promise<boolean> {
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
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving prayer:", e);
    return false;
  }
}

export async function deletePrayerFromDb(prayerId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('prayers').delete().eq('id', toUUID(prayerId));
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error deleting prayer:", e);
    return false;
  }
}

// 10. SAINTS PROGRESS
export async function fetchSaintsProgressFromDb(currentUserRole: AppRole): Promise<SaintProgress[]> {
  if (currentUserRole === 'admin') {
    return [];
  }
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
    return [];
  }
}

export async function saveSaintProgressToDb(saint: SaintProgress): Promise<boolean> {
  try {
    const payload = {
      id: saint.id,
      name: saint.name,
      role: 'member' as any,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error saving saint progress:", e);
    return false;
  }
}

export async function deleteSaintFromDb(saintId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', saintId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error deleting saint:", e);
    return false;
  }
}

export async function updateSaintCompletedCountInDb(saintId: string, count: number, total: number, dateStr: string): Promise<boolean> {
  return true;
}

// 11. VERSE SUBMISSIONS
export async function submitVerseToPastor(userId: string, weeklyVerseId: string): Promise<{ success: boolean; message?: string }> {
  const uuidUser = toUUID(userId);
  const uuidVerse = toUUID(weeklyVerseId);
  try {
    const { data: existing, error: checkError } = await supabase
      .from('submissions')
      .select('id, status')
      .eq('user_id', uuidUser)
      .eq('weekly_verse_id', uuidVerse);
    
    if (checkError) throw checkError;
    
    if (existing && existing.length > 0) {
      const hasPending = existing.some(s => s.status === 'pending');
      const hasApproved = existing.some(s => s.status === 'approved');
      if (hasPending) {
        return { success: false, message: '이미 제출된 암송 구절이며 승인 대기 중입니다.' };
      }
      if (hasApproved) {
        return { success: false, message: '이미 승인 완료된 암송 구절입니다.' };
      }
    }

    const payload = {
      user_id: uuidUser,
      weekly_verse_id: uuidVerse,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('submissions').insert(payload);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    console.error('Error submitting verse:', e);
    return { success: false, message: e.message || '제출 도중 오류가 발생했습니다.' };
  }
}

export async function fetchSubmissions(): Promise<VerseSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        user_id,
        weekly_verse_id,
        status,
        submitted_at
      `)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name');
      const { data: verses } = await supabase.from('weekly_verses').select('id, reference, text');
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
      const verseMap = new Map(verses?.map(v => [v.id, v]) || []);
      
      return data.map(d => {
        const v = verseMap.get(d.weekly_verse_id);
        return {
          id: d.id,
          userId: d.user_id,
          userName: profileMap.get(d.user_id) || '성도',
          weeklyVerseId: d.weekly_verse_id,
          verseReference: v?.reference || '알 수 없는 성구',
          verseText: v?.text || '',
          status: d.status as 'pending' | 'approved' | 'rejected',
          submittedAt: d.submitted_at
        };
      });
    }
    return [];
  } catch (e) {
    console.error('Error fetching submissions from DB:', e);
    return [];
  }
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'approved' | 'rejected',
  pastorId?: string
): Promise<boolean> {
  try {
    const payload: any = {
      status,
      updated_at: new Date().toISOString()
    };
    if (status === 'approved' && pastorId) {
      payload.is_approved = true;
      payload.approved_by = toUUID(pastorId);
    } else if (status === 'rejected') {
      payload.is_approved = false;
    }
    
    const { data, error } = await supabase
      .from('submissions')
      .update(payload)
      .eq('id', submissionId)
      .select('user_id, weekly_verse_id');
      
    if (error) throw error;
    
    if (status === 'approved' && data && data.length > 0) {
      const sub = data[0];
      if (sub.user_id && sub.weekly_verse_id) {
        const progressPayload = {
          user_id: sub.user_id,
          verse_id: sub.weekly_verse_id,
          status: 'completed',
          streak: 1,
          best_score: 100,
          last_tested: new Date().toLocaleDateString('ko-KR'),
          updated_at: new Date().toISOString()
        };
        await supabase.from('progress').upsert(progressPayload, { onConflict: 'user_id,verse_id' });
      }
    }
    return true;
  } catch (e) {
    console.error('Error updating submission status:', e);
    return false;
  }
}

export async function fetchUserSubmissions(userId: string): Promise<VerseSubmission[]> {
  try {
    const uuidUser = toUUID(userId);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', uuidUser)
      .order('submitted_at', { ascending: false });
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      const { data: verses } = await supabase.from('weekly_verses').select('id, reference, text');
      const verseMap = new Map(verses?.map(v => [v.id, v]) || []);
      
      return data.map(d => {
        const v = verseMap.get(d.weekly_verse_id);
        return {
          id: d.id,
          userId: d.user_id,
          weeklyVerseId: d.weekly_verse_id,
          verseReference: v?.reference || '알 수 없는 성구',
          verseText: v?.text || '',
          status: d.status as 'pending' | 'approved' | 'rejected',
          submittedAt: d.submitted_at
        };
      });
    }
    return [];
  } catch (e) {
    console.error('Error fetching user submissions:', e);
    return [];
  }
}
