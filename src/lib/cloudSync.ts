import { supabase } from '@/lib/supabase';
import { StudentProfile } from '@/types/models';

export interface CloudSyncResult {
  synced: boolean;
  reason?: string;
}

/**
 * Best-effort Supabase profile sync when a user is signed in.
 * Never throws or blocks offline/local usage if tables are not migrated yet.
 */
export async function syncProfileToCloud(profile: StudentProfile): Promise<CloudSyncResult> {
  if (!supabase) return { synced: false, reason: 'Supabase not configured' };
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return { synced: false, reason: 'Not signed in' };

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        display_name: profile.displayName,
        username: profile.username,
        bio: profile.bio,
        education_level: profile.educationLevel,
        avatar_emoji: profile.avatarEmoji,
        companion_id: profile.companionId,
        xp: profile.xp,
        level: profile.level,
        streak_days: profile.streakDays,
        credits: profile.credits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      return { synced: false, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    return {
      synced: false,
      reason: err instanceof Error ? err.message : 'Cloud sync error',
    };
  }
}

export async function pullProfileFromCloud(): Promise<Partial<StudentProfile> | null> {
  if (!supabase) return null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, username, bio, education_level, avatar_emoji, companion_id, xp, level, streak_days, credits')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      displayName: data.display_name ?? undefined,
      username: data.username ?? undefined,
      bio: data.bio ?? undefined,
      educationLevel: data.education_level ?? undefined,
      avatarEmoji: data.avatar_emoji ?? undefined,
      xp: typeof data.xp === 'number' ? data.xp : undefined,
      level: typeof data.level === 'number' ? data.level : undefined,
      streakDays: typeof data.streak_days === 'number' ? data.streak_days : undefined,
      credits: typeof data.credits === 'number' ? data.credits : undefined,
    };
  } catch {
    return null;
  }
}
