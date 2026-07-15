import { supabase, toUUID, AppRole } from '../lib/supabase';
import { Verse, VerseStatus, TestAttempt, VerseSubmission, SaintProgress, MemorizeStatus } from '../types';

/**
 * Weekly Verse & Recitation Progress Service
 */
export const verseService = {
  /**
   * Fetch all weekly verses
   */
  async fetchVerses(): Promise<Verse[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_verses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error("=== Error fetching verses ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .map(v => ({
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
        }))
        .filter(v => v.isActive !== false);
    } catch (e) {
      console.error("Exception in fetchVerses:", e);
      return [];
    }
  },

  /**
   * Save a weekly verse (Create or Update / Upsert)
   */
  async saveVerseToDb(verse: Verse): Promise<boolean> {
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
      if (error) {
        console.error("=== Error saving verse ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in saveVerseToDb:", e);
      return false;
    }
  },

  /**
   * Delete weekly verse (or Soft Delete ready where isActive = false is used instead if configured)
   */
  async deleteVerseFromDb(verseId: string): Promise<boolean> {
    try {
      const { data: current, error: getError } = await supabase
        .from('weekly_verses')
        .select('*')
        .eq('id', toUUID(verseId))
        .maybeSingle();

      if (getError || !current) {
        console.error("=== Error finding verse for soft-delete ===", getError);
        return false;
      }

      const updatedPayload = {
        ...current,
        is_active: false
      };

      const { error } = await supabase.from('weekly_verses').upsert(updatedPayload);
      if (error) {
        console.error("=== Error soft-deleting verse ===");
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in deleteVerseFromDb:", e);
      return false;
    }
  },

  /**
   * Fetch progress statuses for a user
   */
  async fetchUserStatuses(userId: string): Promise<{ [key: string]: VerseStatus }> {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error("=== Error fetching user progress statuses ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

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
      console.error("Exception in fetchUserStatuses:", e);
      return {};
    }
  },

  /**
   * Save progress status for a user
   */
  async saveStatusToDb(userId: string, status: VerseStatus): Promise<boolean> {
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
      
      const { error } = await supabase
        .from('progress')
        .upsert(payload, { onConflict: 'user_id,verse_id' });

      if (error) {
        console.error("=== Error saving progress status ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in saveStatusToDb:", e);
      return false;
    }
  },

  /**
   * Fetch test attempts for a user
   */
  async fetchUserAttempts(userId: string): Promise<TestAttempt[]> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("=== Error fetching user test attempts ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

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
      console.error("Exception in fetchUserAttempts:", e);
      return [];
    }
  },

  /**
   * Save test attempt for a user
   */
  async saveAttemptToDb(userId: string, attempt: TestAttempt): Promise<boolean> {
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
      if (error) {
        console.error("=== Error saving test attempt ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in saveAttemptToDb:", e);
      return false;
    }
  },

  /**
   * Submit weekly verse recitation to pastor/admin for approval
   */
  async submitVerseToPastor(userId: string, weeklyVerseId: string): Promise<{ success: boolean; message?: string }> {
    const uuidUser = toUUID(userId);
    const uuidVerse = toUUID(weeklyVerseId);
    try {
      const { data: existing, error: checkError } = await supabase
        .from('submissions')
        .select('id, is_approved, approved_by')
        .eq('user_id', uuidUser)
        .eq('verse_id', uuidVerse);
      
      if (checkError) throw checkError;
      
      if (existing && existing.length > 0) {
        const hasPending = existing.some(s => !s.is_approved && s.approved_by === null);
        const hasApproved = existing.some(s => s.is_approved);
        if (hasPending) {
          return { success: false, message: '이미 제출된 암송 구절이며 승인 대기 중입니다.' };
        }
        if (hasApproved) {
          return { success: false, message: '이미 승인 완료된 암송 구절입니다.' };
        }
      }

      const payload = {
        user_id: uuidUser,
        verse_id: uuidVerse,
        is_approved: false,
        approved_by: null,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('submissions').insert(payload);
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      console.error('Error submitting verse:', e);
      return { success: false, message: e.message || '제출 도중 오류가 발생했습니다.' };
    }
  },

  /**
   * Fetch submissions for pastor/admin review
   */
  async fetchSubmissions(): Promise<VerseSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          user_id,
          verse_id,
          created_at,
          reference,
          user_text,
          correct_text,
          score,
          mode,
          is_approved,
          approved_by
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, name');
        const { data: verses } = await supabase.from('weekly_verses').select('id, reference, text');
        
        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
        const verseMap = new Map(verses?.map(v => [v.id, v]) || []);
        
        return data.map(d => {
          const v = verseMap.get(d.verse_id);
          const name = profileMap.get(d.user_id) || '성도';
          const calculatedStatus = d.is_approved 
            ? 'approved' 
            : (d.approved_by ? 'rejected' : 'pending');
          return {
            id: d.id,
            userId: d.user_id,
            userName: name,
            profileName: name,
            weeklyVerseId: d.verse_id,
            weekly_verse_id: d.verse_id,
            verseReference: v?.reference || d.reference || '알 수 없는 성구',
            verseText: v?.text || '',
            status: calculatedStatus as 'pending' | 'approved' | 'rejected',
            submittedAt: d.created_at,
            submitted_at: d.created_at,
            reference: d.reference,
            correctText: d.correct_text,
            userText: d.user_text,
            score: d.score,
            mode: d.mode
          };
        });
      }
      return [];
    } catch (e) {
      console.error('Error fetching submissions from DB:', e);
      return [];
    }
  },

  /**
   * Update submission status (Approve or Reject)
   */
  async updateSubmissionStatus(
    submissionId: string,
    status: 'approved' | 'rejected',
    pastorId?: string
  ): Promise<boolean> {
    try {
      const payload: any = {
        updated_at: new Date().toISOString()
      };
      if (status === 'approved' && pastorId) {
        payload.is_approved = true;
        payload.approved_by = toUUID(pastorId);
      } else if (status === 'rejected') {
        payload.is_approved = false;
        payload.approved_by = toUUID(pastorId || '');
      }
      
      const { data, error } = await supabase
        .from('submissions')
        .update(payload)
        .eq('id', submissionId)
        .select('user_id, verse_id');
        
      if (error) throw error;
      
      if (status === 'approved' && data && data.length > 0) {
        const sub = data[0];
        if (sub.user_id && sub.verse_id) {
          const progressPayload = {
            user_id: sub.user_id,
            verse_id: sub.verse_id,
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
  },

  /**
   * Fetch submissions for a specific user
   */
  async fetchUserSubmissions(userId: string): Promise<VerseSubmission[]> {
    try {
      const uuidUser = toUUID(userId);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', uuidUser)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const { data: verses } = await supabase.from('weekly_verses').select('id, reference, text');
        const verseMap = new Map(verses?.map(v => [v.id, v]) || []);
        
        return data.map(d => {
          const v = verseMap.get(d.verse_id);
          const calculatedStatus = d.is_approved 
            ? 'approved' 
            : (d.approved_by ? 'rejected' : 'pending');
          return {
            id: d.id,
            userId: d.user_id,
            weeklyVerseId: d.verse_id,
            weekly_verse_id: d.verse_id,
            verseReference: v?.reference || d.reference || '알 수 없는 성구',
            verseText: v?.text || '',
            status: calculatedStatus as 'pending' | 'approved' | 'rejected',
            submittedAt: d.created_at,
            submitted_at: d.created_at
          };
        });
      }
      return [];
    } catch (e) {
      console.error('Error fetching user submissions:', e);
      return [];
    }
  },

  /**
   * Dynamic calculation of Saints Progress for Admin/Pastor panel
   */
  async fetchSaintsProgress(currentUserRole: AppRole): Promise<SaintProgress[]> {
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
          const memorizingCount = userProgress.filter(p => p.status === 'memorizing').length;
          const notStartedCount = Math.max(0, totalCount - completedCount - memorizingCount);
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
            lastActivity,
            notStartedCount,
            memorizingCount
          };
        });
      }
      return [];
    } catch (e) {
      console.error("Error dynamically calculating saints progress:", e);
      return [];
    }
  },

  /**
   * Save dynamic saint details
   */
  async saveSaintProgress(saint: SaintProgress): Promise<boolean> {
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
  },

  /**
   * Delete a saint profile
   */
  async deleteSaint(saintId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', saintId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Error deleting saint:", e);
      return false;
    }
  }
};
