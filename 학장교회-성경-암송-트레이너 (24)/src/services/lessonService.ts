import { supabase, toUUID } from '../lib/supabase';
import { GongGwa } from '../types';

/**
 * Bible Lessons (공과) Service
 */
export const lessonService = {
  /**
   * Fetch all lessons from the database
   */
  async fetchLessons(): Promise<GongGwa[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("=== Error fetching lessons ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }

      return (data || [])
        .map(l => {
          let parsedContent: any = {};
          try {
            parsedContent = JSON.parse(l.content || '{}');
          } catch (err) {
            console.error('Error parsing lesson content JSON:', err);
          }
          return {
            id: l.id,
            title: l.title,
            scriptureReference: l.passage || parsedContent.scriptureReference || '',
            verses: parsedContent.verses || (typeof l.verses === 'string' ? JSON.parse(l.verses) : (l.verses || [])),
            coreLessons: parsedContent.coreLessons || (typeof l.core_lessons === 'string' ? JSON.parse(l.core_lessons) : (l.core_lessons || [])),
            qnas: parsedContent.qnas || (typeof l.qnas === 'string' ? JSON.parse(l.qnas) : (l.qnas || [])),
            introduction: parsedContent.introduction || (typeof l.introduction === 'string' ? JSON.parse(l.introduction) : (l.introduction || [])),
            conclusion: parsedContent.conclusion || [],
            isActive: parsedContent.is_active !== false
          };
        })
        .filter(lesson => lesson.isActive);
    } catch (e) {
      console.error('Exception in fetchLessons:', e);
      return [];
    }
  },

  /**
   * Save a Bible lesson (Create or Update / Upsert)
   */
  async saveLesson(lesson: GongGwa): Promise<boolean> {
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
          introduction: lesson.introduction,
          conclusion: lesson.conclusion || [],
          is_active: true
        }),
        date: new Date().toLocaleDateString()
      };
      
      const { error } = await supabase.from('lessons').upsert(payload);
      if (error) {
        console.error("=== Error saving Bible lesson ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Exception in saveLesson:', e);
      return false;
    }
  },

  /**
   * Delete a Bible lesson (Soft delete by setting is_active to false in the JSON content)
   */
  async deleteLesson(lessonId: string): Promise<boolean> {
    try {
      const { data: current, error: getError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', toUUID(lessonId))
        .maybeSingle();

      if (getError || !current) {
        console.error("=== Error finding lesson for soft-delete ===", getError);
        return false;
      }

      let parsedContent: any = {};
      try {
        parsedContent = JSON.parse(current.content || '{}');
      } catch (e) {
        console.error('Error parsing current lesson JSON content:', e);
      }

      const updatedPayload = {
        ...current,
        content: JSON.stringify({
          ...parsedContent,
          is_active: false
        })
      };

      const { error } = await supabase.from('lessons').upsert(updatedPayload);
      if (error) {
        console.error("=== Error soft-deleting Bible lesson ===");
        console.error("Actual error.code:", error.code);
        console.error("Actual error.message:", error.message);
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Exception in deleteLesson:', e);
      return false;
    }
  }
};
