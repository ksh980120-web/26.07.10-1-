import { supabase, toUUID } from '../lib/supabase';
import { Sermon, FamilyWorship } from '../types';

/**
 * Church Sermons (설교) Service
 */
export const sermonService = {
  /**
   * Fetch all sermons
   */
  async fetchSermons(): Promise<Sermon[]> {
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error("=== Error fetching sermons ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .filter(s => s.content && !s.content.startsWith('__DELETED__') && s.preacher !== 'family_worship')
        .map(s => ({
          id: s.id,
          title: s.title,
          date: s.date,
          passage: s.passage,
          preacher: s.preacher,
          content: s.content,
          url: s.url,
          isActive: true
        }));
    } catch (e) {
      console.error('Exception in fetchSermons:', e);
      return [];
    }
  },

  /**
   * Fetch all family worships
   */
  async fetchFamilyWorships(): Promise<FamilyWorship[]> {
    try {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .eq('preacher', 'family_worship')
        .order('date', { ascending: false });

      if (error) {
        console.error("=== Error fetching family worships ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .filter(s => s.content && !s.content.startsWith('__DELETED__'))
        .map(s => {
          let time = '';
          let location = '';
          let memo = '';
          let selectedMembers: string[] = [];
          let actualContent = s.content;

          if (s.content.startsWith('{') && s.content.endsWith('}')) {
            try {
              const parsed = JSON.parse(s.content);
              time = parsed.time || '';
              location = parsed.location || '';
              memo = parsed.memo || '';
              selectedMembers = parsed.selectedMembers || [];
              actualContent = parsed.description || parsed.content || '';
            } catch (e) {
              actualContent = s.content;
            }
          }

          return {
            id: s.id,
            date: s.date,
            title: s.title,
            hymn: s.url || '',
            passage: s.passage || '',
            content: actualContent,
            isActive: true,
            time,
            location,
            memo,
            selectedMembers
          };
        });
    } catch (e) {
      console.error('Exception in fetchFamilyWorships:', e);
      return [];
    }
  },

  /**
   * Save a family worship (Create or Update / Upsert)
   */
  async saveFamilyWorship(fw: FamilyWorship): Promise<boolean> {
    try {
      const contentPayload = JSON.stringify({
        description: fw.content,
        time: fw.time || '',
        location: fw.location || '',
        memo: fw.memo || '',
        selectedMembers: fw.selectedMembers || []
      });

      const payload = {
        id: toUUID(fw.id),
        title: fw.title,
        date: fw.date,
        passage: fw.passage,
        preacher: 'family_worship',
        content: contentPayload,
        url: fw.hymn || ''
      };

      const { error } = await supabase.from('sermons').upsert(payload);
      if (error) {
        console.error("=== Error saving family worship ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Exception in saveFamilyWorship:', e);
      return false;
    }
  },

  /**
   * Delete family worship
   */
  async deleteFamilyWorship(id: string): Promise<boolean> {
    return this.deleteSermon(id);
  },

  /**
   * Save a sermon (Create or Update / Upsert)
   */
  async saveSermon(sermon: Sermon): Promise<boolean> {
    try {
      const payload = {
        id: toUUID(sermon.id),
        title: sermon.title,
        date: sermon.date,
        passage: sermon.passage || '',
        preacher: sermon.preacher || '담임목사',
        content: sermon.content,
        url: sermon.url || ''
      };

      const { error } = await supabase.from('sermons').upsert(payload);
      if (error) {
        console.error("=== Error saving sermon ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Exception in saveSermon:', e);
      return false;
    }
  },

  /**
   * Delete a sermon (Soft delete by prefixing content with __DELETED__)
   */
  async deleteSermon(id: string): Promise<boolean> {
    try {
      const { data: current, error: getError } = await supabase
        .from('sermons')
        .select('*')
        .eq('id', toUUID(id))
        .maybeSingle();

      if (getError || !current) {
        console.error("=== Error finding sermon for deletion ===", getError);
        return false;
      }

      // Prefix the content with __DELETED__ to mark it as soft-deleted
      const updatedPayload = {
        ...current,
        content: `__DELETED__${current.content}`
      };

      const { error } = await supabase.from('sermons').upsert(updatedPayload);
      if (error) {
        console.error("=== Error soft-deleting sermon ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Exception in deleteSermon:', e);
      return false;
    }
  }
};
