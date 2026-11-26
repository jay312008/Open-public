-- LearnyMol Initial Supabase Schema & Row Level Security Policies
-- Run via Supabase SQL Editor or `supabase db push`

create extension if not exists "uuid-ossp";

-- 1. Student Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text unique not null,
  bio text default '',
  education_level text default 'Secondary',
  avatar_url text,
  companion_id text not null default 'molly',
  xp integer not null default 0,
  level integer not null default 1,
  streak_days integer not null default 0,
  credits integer not null default 250,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profile info is readable by authenticated users"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Learning Goals & Journey Plans
create table if not exists public.journey_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_name text not null,
  exam_type text not null,
  exam_date date not null,
  knowledge_level text not null default 'Intermediate',
  available_days text[] not null default array['Mon','Tue','Wed','Thu','Fri'],
  daily_study_minutes integer not null default 45,
  difficult_areas text default '',
  pace text not null default 'Balanced',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journey_plans enable row level security;

create policy "Users manage their own journey plans"
  on public.journey_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Journey Levels & Lessons
create table if not exists public.journey_levels (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references public.journey_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  level_number integer not null,
  subject_id text not null,
  subject_name text not null,
  topic_id text not null,
  topic_title text not null,
  estimated_minutes integer not null default 45
);

alter table public.journey_levels enable row level security;

create policy "Users manage their own journey levels"
  on public.journey_levels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.journey_lessons (
  id uuid primary key default uuid_generate_v4(),
  level_id uuid not null references public.journey_levels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null,
  title text not null,
  duration_minutes integer not null default 15,
  order_index integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz
);

alter table public.journey_lessons enable row level security;

create policy "Users manage their own journey lessons"
  on public.journey_lessons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Idempotent XP Events & Badges
create table if not exists public.xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  idempotency_key text not null,
  amount integer not null check (amount > 0 and amount <= 500),
  reason text not null,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

alter table public.xp_events enable row level security;

create policy "Users can view their own XP events"
  on public.xp_events for select
  using (auth.uid() = user_id);

create policy "Users can record idempotent XP events"
  on public.xp_events for insert
  with check (auth.uid() = user_id);

create table if not exists public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Badges are publicly viewable"
  on public.user_badges for select
  using (true);

create policy "Users unlock their own badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

-- 5. Community Posts, Likes, Comments, Bookmarks & Follows
create table if not exists public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid,
  subject_tag text,
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;

create policy "Posts are readable by all"
  on public.community_posts for select
  using (true);

create policy "Users create their own posts"
  on public.community_posts for insert
  with check (auth.uid() = author_id);

create policy "Users delete their own posts"
  on public.community_posts for delete
  using (auth.uid() = author_id);

create table if not exists public.post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;
create policy "Likes readable by all" on public.post_likes for select using (true);
create policy "Users manage own likes" on public.post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;
create policy "Comments readable by all" on public.post_comments for select using (true);
create policy "Users create own comments" on public.post_comments for insert with check (auth.uid() = author_id);
create policy "Users delete own comments" on public.post_comments for delete using (auth.uid() = author_id);

create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.user_follows enable row level security;
create policy "Follows readable by all" on public.user_follows for select using (true);
create policy "Users manage own follows" on public.user_follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- 6. Saved AI Conversations & Live Teacher Sessions
create table if not exists public.saved_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool text not null check (tool in ('ask-molly', 'live-teacher')),
  title text not null,
  subject text,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.saved_conversations enable row level security;
create policy "Users manage own conversations"
  on public.saved_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
