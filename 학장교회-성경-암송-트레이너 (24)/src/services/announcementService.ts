import { supabase, toUUID } from '../lib/supabase';
import { Announcement } from '../types';

/**
 * Church Announcements (공지사항) Service
 */
export const announcementService = {
  /**
   * Fetch all church announcements
   */
  async fetchAnnouncements(): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("=== Error fetching announcements ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .filter(a => a.content && !a.content.startsWith('__DELETED__'))
        .map(a => ({
          id: a.id,
          title: a.title || '공지사항',
          content: a.content,
          author: a.author,
          date: new Date(a.created_at || Date.now()).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
          created_at: a.created_at
        }));
    } catch (e) {
      console.error('Exception in fetchAnnouncements:', e);
      return [];
    }
  },

  /**
   * Save a church announcement (Create or Update / Upsert)
   */
  async saveAnnouncement(announcement: Announcement): Promise<boolean> {
    try {
      const payload = {
        id: toUUID(announcement.id),
        title: announcement.title || '공지사항',
        content: announcement.content,
        author: announcement.author || '관리자'
      };

      const { error } = await supabase.from('announcements').upsert(payload);
      if (error) {
        console.error("=== Error saving announcement ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Exception in saveAnnouncement:', e);
      return false;
    }
  },

  /**
   * Delete a church announcement (Soft delete by prepending __DELETED__ to content)
   */
  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      const { data: current, error: getError } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', toUUID(id))
        .maybeSingle();

      if (getError || !current) {
        console.error("=== Error finding announcement for soft-delete ===", getError);
        return false;
      }

      const updatedPayload = {
        ...current,
        content: `__DELETED__${current.content}`
      };

      const { error } = await supabase.from('announcements').upsert(updatedPayload);
      if (error) {
        console.error("=== Error soft-deleting announcement ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Exception in deleteAnnouncement:', e);
      return false;
    }
  }
};
