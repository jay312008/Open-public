import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSessionEmail(sess?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    if (!supabase) {
      Alert.alert('Supabase Not Connected', 'Link Supabase in Vercel and redeploy first.');
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || password.length < 6) {
      setStatusMsg('Enter a valid email and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { display_name: displayName.trim() || profile.displayName } },
        });
        if (error) {
          setStatusMsg(error.message);
        } else {
          if (displayName.trim()) {
            updateProfile({ displayName: displayName.trim() });
          }
          setStatusMsg(
            data.session
              ? 'Account created and signed in!'
              : 'Account created! Check your email to confirm, then sign in.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          setStatusMsg(error.message);
        } else {
          setStatusMsg('Signed in successfully! Your cloud account is connected.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSessionEmail(null);
    setStatusMsg('Signed out.');
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Cloud Account" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CompanionAvatar companionId={profile.companionId} size={74} />
            <Text style={[styles.title, { color: colors.text }]}>
              {sessionEmail ? 'Cloud Sync Active' : 'Sync LearnyMol with Supabase'}
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              {isSupabaseConfigured
                ? sessionEmail
                  ? `Signed in as ${sessionEmail}`
                  : 'Sign in or create an account to back up your profile, XP, and Learning Journey.'
                : 'Supabase is not configured on this build yet. Connect Supabase in Vercel and redeploy.'}
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isSupabaseConfigured
                    ? colors.surfaceMint
                    : colors.surfaceCoralSoft,
                },
              ]}
            >
              <Ionicons
                name={isSupabaseConfigured ? 'cloud-done-outline' : 'cloud-offline-outline'}
                size={15}
                color={isSupabaseConfigured ? colors.mintDark : colors.coral}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: isSupabaseConfigured ? colors.mintDark : colors.coral,
                }}
              >
                {isSupabaseConfigured ? 'Supabase Connected' : 'Offline Local Storage Mode'}
              </Text>
            </View>
          </View>

          {sessionEmail ? (
            <AnimatedPressable
              onPress={handleSignOut}
              style={[styles.primaryBtn, { backgroundColor: colors.coral }]}
            >
              <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Sign Out</Text>
            </AnimatedPressable>
          ) : (
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modeRow}>
                {(['signin', 'signup'] as const).map((m) => (
                  <AnimatedPressable
                    key={m}
                    onPress={() => {
                      setMode(m);
                      setStatusMsg(null);
                    }}
                    style={[
                      styles.modePill,
                      { backgroundColor: mode === m ? colors.coral : colors.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={{
                        color: mode === m ? '#FFFFFF' : colors.text,
                        fontWeight: '800',
                        fontSize: 13,
                      }}
                    >
                      {m === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              {mode === 'signup' && (
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                />
              )}

              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password (min 6 chars)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />

              {statusMsg && (
                <Text style={[styles.statusMsg, { color: colors.coral }]}>{statusMsg}</Text>
              )}

              <AnimatedPressable
                onPress={handleSubmit}
                disabled={loading || !isSupabaseConfigured}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: isSupabaseConfigured ? colors.coral : colors.surfaceMuted,
                  },
                ]}
              >
                <Text style={styles.primaryBtnText}>
                  {loading
                    ? 'Please wait...'
                    : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Free Account'}
                </Text>
              </AnimatedPressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
  },
  statusMsg: { fontSize: 12.5, fontWeight: '600', textAlign: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
