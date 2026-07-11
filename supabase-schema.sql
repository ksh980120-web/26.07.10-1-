-- ====================================================
-- CHURCH PORTAL - SUPABASE PRODUCTION DATABASE SCHEMA
-- ====================================================
-- This SQL script defines the production-ready 9-table schema,
-- automatic triggers, and secure Role-Based RLS policies.

-- 1. Create Role Enum
-- Standard church portal roles: master, pastor, admin, member
CREATE TYPE public.user_role AS ENUM ('master', 'pastor', 'admin', 'member');

-- ==========================================
-- TABLE DEFINITIONS
-- ==========================================

-- [Table 1: Profiles]
-- Extends Supabase Auth users with church-specific attributes and roles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'member',
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- [Table 2: Weekly Verses]
-- Weekly memorization scripture verses
CREATE TABLE public.weekly_verses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference TEXT NOT NULL, -- 성경본문
    text TEXT NOT NULL, -- 금주 암송성구
    title TEXT, -- 제목
    duration TEXT, -- 암송기간
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- 활성여부
    quarter INTEGER NOT NULL,
    week INTEGER NOT NULL,
    date TEXT,
    hint TEXT,
    is_custom BOOLEAN DEFAULT FALSE NOT NULL,
    is_personal BOOLEAN DEFAULT FALSE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- [Table 3: Lessons]
-- Weekly church school (GongGwa) education lessons
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL, -- 공과 제목
    content TEXT NOT NULL, -- 공과 내용 (JSON stringified)
    passage TEXT, -- 성경본문
    week INTEGER NOT NULL DEFAULT 1, -- 주차
    quarter INTEGER NOT NULL DEFAULT 1,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- [Table 4: Sermons]
-- Sunday and weekly church sermons
CREATE TABLE public.sermons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    passage TEXT,
    preacher TEXT,
    content TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- [Table 5: Progress]
-- Verse memorization and test progress tracker for members (replacing verse_statuses)
CREATE TABLE public.progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.weekly_verses(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'memorizing', 'completed')),
    streak INTEGER DEFAULT 0 NOT NULL,
    best_score INTEGER DEFAULT 0,
    last_tested TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, verse_id)
);

-- [Table 6: Submissions]
-- Verse recitations and test submission attempts (replacing test_attempts)
CREATE TABLE public.submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    verse_id UUID REFERENCES public.weekly_verses(id) ON DELETE CASCADE,
    weekly_verse_id UUID REFERENCES public.weekly_verses(id) ON DELETE CASCADE,
    reference TEXT,
    date TEXT,
    user_text TEXT,
    correct_text TEXT,
    score INTEGER,
    mode TEXT CHECK (mode IN ('blank_fill', 'full_write', 'speak_along')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE NOT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- [Table 7: Journals]
-- Spiritual reflection, meditation, and prayer notes (replacing faith_journals)
CREATE TABLE public.journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    passage TEXT,
    content TEXT NOT NULL,
    prayer TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- [Table 8: Prayers]
-- Church congregation intercessory prayers
CREATE TABLE public.prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('family', 'health', 'faith', 'career', 'others')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    amen_count INTEGER DEFAULT 0 NOT NULL,
    status TEXT NOT NULL DEFAULT 'praying' CHECK (status IN ('praying', 'answered')),
    author_name TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- [Table 9: Announcements]
-- Church global announcements (공지사항)
CREATE TABLE public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL, -- 공지사항
    author TEXT NOT NULL, -- 작성자
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL, -- 작성일
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Helper Function to query the role of the current authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- [Profiles Policies]
CREATE POLICY "Profiles SELECT policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Profiles INSERT policy" ON public.profiles
    FOR INSERT WITH CHECK (
        public.get_auth_user_role() = 'master'
    );

CREATE POLICY "Profiles UPDATE policy" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Profiles DELETE policy" ON public.profiles
    FOR DELETE USING (
        public.get_auth_user_role() = 'master'
    );


-- [Weekly Verses Policies]
CREATE POLICY "Weekly verses SELECT policy" ON public.weekly_verses
    FOR SELECT USING (true);

CREATE POLICY "Weekly verses INSERT policy" ON public.weekly_verses
    FOR INSERT WITH CHECK (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );

CREATE POLICY "Weekly verses UPDATE policy" ON public.weekly_verses
    FOR UPDATE USING (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );

CREATE POLICY "Weekly verses DELETE policy" ON public.weekly_verses
    FOR DELETE USING (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );


-- [Lessons Policies]
CREATE POLICY "Lessons SELECT policy" ON public.lessons
    FOR SELECT USING (true);

CREATE POLICY "Lessons INSERT policy" ON public.lessons
    FOR INSERT WITH CHECK (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );

CREATE POLICY "Lessons UPDATE policy" ON public.lessons
    FOR UPDATE USING (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );

CREATE POLICY "Lessons DELETE policy" ON public.lessons
    FOR DELETE USING (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );


-- [Sermons Policies]
CREATE POLICY "Sermons SELECT policy" ON public.sermons
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sermons manage policy" ON public.sermons
    FOR ALL USING (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );


-- [Progress Policies]
CREATE POLICY "Progress SELECT policy" ON public.progress
    FOR SELECT USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Progress INSERT policy" ON public.progress
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Progress UPDATE policy" ON public.progress
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Progress DELETE policy" ON public.progress
    FOR DELETE USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );


-- [Submissions Policies]
CREATE POLICY "Submissions SELECT policy" ON public.submissions
    FOR SELECT USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Submissions INSERT policy" ON public.submissions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR public.get_auth_user_role() = 'master'
    );

CREATE POLICY "Submissions UPDATE policy" ON public.submissions
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Submissions DELETE policy" ON public.submissions
    FOR DELETE USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() = 'master'
    );


-- [Journals Policies]
CREATE POLICY "Journals manage policy" ON public.journals
    FOR ALL USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() = 'master'
    );


-- [Prayers Policies]
CREATE POLICY "Prayers SELECT policy" ON public.prayers
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Prayers INSERT policy" ON public.prayers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Prayers UPDATE policy" ON public.prayers
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );

CREATE POLICY "Prayers DELETE policy" ON public.prayers
    FOR DELETE USING (
        auth.uid() = user_id 
        OR public.get_auth_user_role() IN ('master', 'pastor')
    );


-- [Announcements Policies]
CREATE POLICY "Announcements SELECT policy" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Announcements INSERT policy" ON public.announcements
    FOR INSERT WITH CHECK (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );

CREATE POLICY "Announcements UPDATE policy" ON public.announcements
    FOR UPDATE USING (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );

CREATE POLICY "Announcements DELETE policy" ON public.announcements
    FOR DELETE USING (
        public.get_auth_user_role() IN ('master', 'pastor', 'admin')
    );


-- ==========================================
-- DATABASE TRIGGERS
-- ==========================================

-- Trigger to automatically populate public.profiles on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name text;
    user_phone text;
BEGIN
    user_name := COALESCE(new.raw_user_meta_data->>'name', '새 성도');
    user_phone := new.raw_user_meta_data->>'phone';
    
    -- Insert profile with strict default role 'member'.
    -- Absolutely no email parsing or string-based role guessing.
    INSERT INTO public.profiles (id, email, name, role, phone)
    VALUES (new.id, new.email, user_name, 'member'::public.user_role, user_phone);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind user creation trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger to automatically maintain updated_at timestamps on update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind updated_at trigger to all 9 tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_weekly_verses_updated_at BEFORE UPDATE ON public.weekly_verses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sermons_updated_at BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON public.progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON public.journals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON public.prayers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- REALTIME SUBSCRIPTIONS
-- ==========================================

-- Enable Realtime for submissions, prayers, and announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
