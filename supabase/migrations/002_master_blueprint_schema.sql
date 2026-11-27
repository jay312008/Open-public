-- ============================================================
-- LearnyMol Master Blueprint — Phase 2 Additive Schema
-- Preserves all tables in 001_initial_schema.sql untouched.
-- Run in Supabase SQL Editor after 001_initial_schema.sql.
-- ============================================================

-- 1. Official Curriculum Catalogue (Cameroon GCE O-Level, A-Level & University)
CREATE TABLE IF NOT EXISTS public.curriculum_subjects (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  education_level TEXT NOT NULL, -- 'O-Level' | 'A-Level' | 'University'
  icon TEXT DEFAULT 'book',
  color TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.curriculum_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  order_index INT DEFAULT 0,
  estimated_minutes INT DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  mastered BOOLEAN DEFAULT FALSE,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercise_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  score INT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Shared LearnyMol Learning Memory (privacy-scoped context across AI workspaces)
CREATE TABLE IF NOT EXISTS public.learning_memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'strength' | 'weak_topic' | 'goal' | 'preference'
  subject_id TEXT,
  summary TEXT NOT NULL,
  allow_ai_context BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. My AI Teachers (Custom Personal AI Teachers + Uploaded Knowledge)
CREATE TABLE IF NOT EXISTS public.ai_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  education_level TEXT DEFAULT 'O-Level',
  teaching_style TEXT DEFAULT 'Friendly Step-by-Step',
  avatar_emoji TEXT DEFAULT '🎓',
  accent_color TEXT DEFAULT '#7C3AED',
  system_instructions TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_teacher_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.ai_teachers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  extracted_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Study Groups v2 (Public vs Private, up to 5 AI Teachers, Daily Quizzes)
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  subject_name TEXT DEFAULT 'General',
  is_private BOOLEAN DEFAULT FALSE,
  ai_enabled BOOLEAN DEFAULT FALSE, -- Public groups have AI disabled by default
  billing_mode TEXT DEFAULT 'individual', -- 'individual' | 'group_pool' | 'sponsored'
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_group_members (
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_daily_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quiz_date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Study Timetable Slots
CREATE TABLE IF NOT EXISTS public.study_timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  subject_name TEXT NOT NULL,
  topic_title TEXT DEFAULT '',
  reminder_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Separated Credit Wallets & Atomic Ledger (Personal / Group Pool / Sponsored)
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('user', 'group', 'family')),
  owner_id UUID NOT NULL,
  balance INT NOT NULL DEFAULT 250 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.credit_wallets(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_teacher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own flashcards" ON public.flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own exercise submissions" ON public.exercise_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own learning memory" ON public.learning_memory_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own AI teachers" ON public.ai_teachers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own AI teacher docs" ON public.ai_teacher_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own timetable" ON public.study_timetable_slots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public groups visible to all; private to members" ON public.study_groups
  FOR SELECT USING (
    is_private = FALSE OR owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.study_group_members m WHERE m.group_id = id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners manage own study groups" ON public.study_groups FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Users view own credit transactions" ON public.credit_transactions FOR SELECT USING (actor_user_id = auth.uid());
