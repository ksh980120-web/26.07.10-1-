import { createClient } from '@supabase/supabase-js';
import { Verse, VerseStatus, TestAttempt, FaithJournalEntry, PrayerEntry, SaintProgress, MemorizeStatus, AnonymousPrayer, GongGwa, Announcement, VerseSubmission, Sermon, FamilyWorship } from '../types';

// Services delegation
import { authService } from '../services/authService';
import { verseService } from '../services/verseService';
import { lessonService } from '../services/lessonService';
import { announcementService } from '../services/announcementService';
import { prayerService } from '../services/prayerService';
import { sermonService } from '../services/sermonService';

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

// 2. AUTHENTICATION LISTENER & OPERATIONS
export function onAuthStateChange(callback: (user: AppUser | null) => void) {
  return authService.onAuthStateChange(callback);
}

export async function signUpAnonymously(name: string, phone: string): Promise<{ data: any; error: any; errorMessage?: string }> {
  return authService.signUpAnonymously(name, phone);
}

export async function signOut(): Promise<{ error: any }> {
  return authService.signOut();
}

// 3. VERSES (암송 성구)
export async function fetchVerses(): Promise<Verse[]> {
  return verseService.fetchVerses();
}

export async function saveVerseToDb(verse: Verse): Promise<boolean> {
  return verseService.saveVerseToDb(verse);
}

export async function deleteVerseFromDb(verseId: string): Promise<boolean> {
  return verseService.deleteVerseFromDb(verseId);
}

// 4. LESSONS (공과)
export async function fetchLessonsFromDb(): Promise<GongGwa[]> {
  return lessonService.fetchLessons();
}

export async function saveLessonToDb(lesson: GongGwa): Promise<boolean> {
  return lessonService.saveLesson(lesson);
}

export async function deleteLessonFromDb(lessonId: string): Promise<boolean> {
  return lessonService.deleteLesson(lessonId);
}

// 5. ANNOUNCEMENTS (공지사항)
export async function fetchAnnouncements(): Promise<Announcement[]> {
  return announcementService.fetchAnnouncements();
}

export async function saveAnnouncementToDb(announcement: Announcement): Promise<boolean> {
  return announcementService.saveAnnouncement(announcement);
}

export async function deleteAnnouncementFromDb(id: string): Promise<boolean> {
  return announcementService.deleteAnnouncement(id);
}

// 6. PROGRESS (verse_statuses)
export async function fetchUserStatuses(userId: string): Promise<{ [key: string]: VerseStatus }> {
  return verseService.fetchUserStatuses(userId);
}

export async function saveStatusToDb(userId: string, status: VerseStatus): Promise<boolean> {
  return verseService.saveStatusToDb(userId, status);
}

// 7. TEST ATTEMPTS
export async function fetchUserAttempts(userId: string): Promise<TestAttempt[]> {
  return verseService.fetchUserAttempts(userId);
}

export async function saveAttemptToDb(userId: string, attempt: TestAttempt): Promise<boolean> {
  return verseService.saveAttemptToDb(userId, attempt);
}

// 8. FAITH JOURNALS
export async function fetchFaithJournals(userId: string): Promise<FaithJournalEntry[]> {
  return prayerService.fetchFaithJournals(userId);
}

export async function saveFaithJournalToDb(userId: string, journal: FaithJournalEntry): Promise<boolean> {
  return prayerService.saveFaithJournal(userId, journal);
}

export async function deleteFaithJournalFromDb(journalId: string): Promise<boolean> {
  return prayerService.deleteFaithJournal(journalId);
}

// 9. ANONYMOUS PRAYERS
export async function fetchPrayersFromDb(): Promise<AnonymousPrayer[]> {
  return prayerService.fetchPrayers();
}

export async function savePrayerToDb(userId: string | null, prayer: AnonymousPrayer): Promise<boolean> {
  return prayerService.savePrayer(userId, prayer);
}

export async function deletePrayerFromDb(prayerId: string): Promise<boolean> {
  return prayerService.deletePrayer(prayerId);
}

// 10. SAINTS PROGRESS
export async function fetchSaintsProgressFromDb(currentUserRole: AppRole): Promise<SaintProgress[]> {
  return verseService.fetchSaintsProgress(currentUserRole);
}

export async function saveSaintProgressToDb(saint: SaintProgress): Promise<boolean> {
  return verseService.saveSaintProgress(saint);
}

export async function deleteSaintFromDb(saintId: string): Promise<boolean> {
  return verseService.deleteSaint(saintId);
}

export async function updateSaintCompletedCountInDb(saintId: string, count: number, total: number, dateStr: string): Promise<boolean> {
  return true;
}

// 11. VERSE SUBMISSIONS
export async function submitVerseToPastor(userId: string, weeklyVerseId: string): Promise<{ success: boolean; message?: string }> {
  return verseService.submitVerseToPastor(userId, weeklyVerseId);
}

export async function fetchSubmissions(): Promise<VerseSubmission[]> {
  return verseService.fetchSubmissions();
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'approved' | 'rejected',
  pastorId?: string
): Promise<boolean> {
  return verseService.updateSubmissionStatus(submissionId, status, pastorId);
}

export async function fetchUserSubmissions(userId: string): Promise<VerseSubmission[]> {
  return verseService.fetchUserSubmissions(userId);
}

export async function fetchPersonalPrayers(userId: string): Promise<PrayerEntry[]> {
  return prayerService.fetchPersonalPrayers(userId);
}

export async function savePersonalPrayerToDb(userId: string, prayer: PrayerEntry): Promise<boolean> {
  return prayerService.savePersonalPrayer(userId, prayer);
}

export async function deletePersonalPrayerFromDb(prayerId: string): Promise<boolean> {
  return prayerService.deletePersonalPrayer(prayerId);
}

// 12. SERMONS (설교)
export async function fetchSermons(): Promise<Sermon[]> {
  return sermonService.fetchSermons();
}

export async function saveSermonToDb(sermon: Sermon): Promise<boolean> {
  return sermonService.saveSermon(sermon);
}

export async function deleteSermonFromDb(id: string): Promise<boolean> {
  return sermonService.deleteSermon(id);
}

// 13. FAMILY WORSHIP (가정예배)
export async function fetchFamilyWorships(): Promise<FamilyWorship[]> {
  return sermonService.fetchFamilyWorships();
}

export async function saveFamilyWorshipToDb(fw: FamilyWorship): Promise<boolean> {
  return sermonService.saveFamilyWorship(fw);
}

export async function deleteFamilyWorshipFromDb(id: string): Promise<boolean> {
  return sermonService.deleteFamilyWorship(id);
}
