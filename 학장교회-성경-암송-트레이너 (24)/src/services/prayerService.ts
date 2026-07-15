import { supabase, toUUID } from '../lib/supabase';
import { AnonymousPrayer, PrayerEntry, FaithJournalEntry } from '../types';

/**
 * Public & Personal Prayer Request and Journal Service
 */
export const prayerService = {
  /**
   * Fetch public/anonymous prayers
   */
  async fetchPrayers(): Promise<AnonymousPrayer[]> {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("=== Error fetching public prayers ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .filter(p => p.content && !p.content.startsWith('__DELETED__'))
        .map(p => ({
          id: p.id,
          category: p.category as any,
          title: p.title,
          content: p.content,
          date: p.date,
          amenCount: p.amen_count,
          status: p.status as 'praying' | 'answered',
          isAnonymous: p.is_anonymous,
          authorName: p.author_name,
          userId: p.user_id
        }));
    } catch (e) {
      console.error("Exception in fetchPrayers:", e);
      return [];
    }
  },

  /**
   * Save a public/anonymous prayer (Create or Update / Upsert)
   */
  async savePrayer(userId: string | null, prayer: AnonymousPrayer): Promise<boolean> {
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
      if (error) {
        console.error("=== Error saving public prayer ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in savePrayer:", e);
      return false;
    }
  },

  /**
   * Delete public/anonymous prayer
   */
  async deletePrayer(prayerId: string): Promise<boolean> {
    try {
      const { data: current, error: getError } = await supabase
        .from('prayers')
        .select('*')
        .eq('id', toUUID(prayerId))
        .maybeSingle();

      if (getError || !current) {
        console.error("=== Error finding public prayer for soft-delete ===", getError);
        return false;
      }

      const updatedPayload = {
        ...current,
        content: `__DELETED__${current.content}`
      };

      const { error } = await supabase.from('prayers').upsert(updatedPayload);
      if (error) {
        console.error("=== Error soft-deleting public prayer ===");
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in deletePrayer:", e);
      return false;
    }
  },

  /**
   * Fetch personal prayer entries (stored in the journals table under personal_prayer category)
   */
  async fetchPersonalPrayers(userId: string): Promise<PrayerEntry[]> {
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'personal_prayer');

      if (error) {
        console.error("=== Error fetching personal prayers ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .filter(j => j.content && !j.content.startsWith('__DELETED__'))
        .map(j => ({
          id: j.id,
          title: j.title,
          content: j.content,
          isAnswered: j.prayer === 'answered',
          dateAdded: j.date,
          answeredDate: j.passage || undefined
        }));
    } catch (e) {
      console.error("Exception in fetchPersonalPrayers:", e);
      return [];
    }
  },

  /**
   * Save a personal prayer entry
   */
  async savePersonalPrayer(userId: string, prayer: PrayerEntry): Promise<boolean> {
    try {
      const payload = {
        id: toUUID(prayer.id),
        user_id: userId,
        category: 'personal_prayer',
        title: prayer.title,
        content: prayer.content,
        prayer: prayer.isAnswered ? 'answered' : 'praying',
        passage: prayer.answeredDate || null,
        date: prayer.dateAdded
      };

      const { error } = await supabase.from('journals').upsert(payload);
      if (error) {
        console.error("=== Error saving personal prayer ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in savePersonalPrayer:", e);
      return false;
    }
  },

  /**
   * Delete personal prayer entry
   */
  async deletePersonalPrayer(prayerId: string): Promise<boolean> {
    try {
      const { data: current, error: getError } = await supabase
        .from('journals')
        .select('*')
        .eq('id', toUUID(prayerId))
        .maybeSingle();

      if (getError || !current) {
        console.error("=== Error finding personal prayer for soft-delete ===", getError);
        return false;
      }

      const updatedPayload = {
        ...current,
        content: `__DELETED__${current.content}`
      };

      const { error } = await supabase.from('journals').upsert(updatedPayload);
      if (error) {
        console.error("=== Error soft-deleting personal prayer ===");
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in deletePersonalPrayer:", e);
      return false;
    }
  },

  /**
   * Fetch all personal faith journals
   */
  async fetchFaithJournals(userId: string): Promise<FaithJournalEntry[]> {
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error("=== Error fetching faith journals ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .filter(j => j.content && !j.content.startsWith('__DELETED__') && j.category !== 'personal_prayer')
        .map(j => ({
          id: j.id,
          date: j.date,
          category: j.category as any,
          title: j.title,
          passage: j.passage,
          content: j.content,
          prayer: j.prayer
        }));
    } catch (e) {
      console.error("Exception in fetchFaithJournals:", e);
      return [];
    }
  },

  /**
   * Save a faith journal entry
   */
  async saveFaithJournal(userId: string, journal: FaithJournalEntry): Promise<boolean> {
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
      if (error) {
        console.error("=== Error saving faith journal ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in saveFaithJournal:", e);
      return false;
    }
  },

  /**
   * Delete a faith journal entry
   */
  async deleteFaithJournal(journalId: string): Promise<boolean> {
    try {
      const { data: current, error: getError } = await supabase
        .from('journals')
        .select('*')
        .eq('id', toUUID(journalId))
        .maybeSingle();

      if (getError || !current) {
        console.error("=== Error finding faith journal for soft-delete ===", getError);
        return false;
      }

      const updatedPayload = {
        ...current,
        content: `__DELETED__${current.content}`
      };

      const { error } = await supabase.from('journals').upsert(updatedPayload);
      if (error) {
        console.error("=== Error soft-deleting faith journal ===");
        throw error;
      }
      return true;
    } catch (e) {
      console.error("Exception in deleteFaithJournal:", e);
      return false;
    }
  }
};
