import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { BrandAssets, getCompanionById } from '@/constants/assets';
import { ThemeMode } from '@/theme/tokens';

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { profile } = useApp();
  const router = useRouter();
  const companion = getCompanionById(profile.companionId);

  const modes: ThemeMode[] = ['light', 'dark', 'system'];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Settings" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Animated Theme Mode Selector */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            <View style={styles.modeRow}>
              {modes.map((m) => {
                const active = mode === m;
                return (
                  <AnimatedPressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.modePill,
                      {
                        backgroundColor: active ? colors.coral : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? '#FFFFFF' : colors.text,
                        fontWeight: '700',
                        fontSize: 13,
                        textTransform: 'capitalize',
                      }}
                    >
                      {m}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>

          {/* Settings Menu */}
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              {
                icon: 'person-outline' as const,
                title: 'Account & Profile',
                sub: `${profile.displayName} · @${profile.username}`,
                route: '/settings/edit-profile' as const,
              },
              {
                icon: 'happy-outline' as const,
                title: 'Choose Your Molly',
                sub: `Active companion: ${companion.name} (${companion.subtitle})`,
                route: '/settings/choose-molly' as const,
              },
              {
                icon: 'notifications-outline' as const,
                title: 'Notification Preferences',
                sub: 'Study reminders, exam alerts & achievements',
                route: '/settings/notifications' as const,
              },
              {
                icon: 'bookmark-outline' as const,
                title: 'Saved Resources & Chats',
                sub: 'Review saved Molly chats and Live Teacher sessions',
                route: '/saved-resources' as const,
              },
            ].map((item, idx) => (
              <AnimatedPressable
                key={item.title}
                onPress={() => router.push(item.route)}
                style={[
                  styles.menuRow,
                  idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={colors.coral} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </AnimatedPressable>
            ))}
          </View>

          {/* About LearnyMol (Official Permanent Brand Logo) */}
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image
              source={BrandAssets.mascotTransparent}
              style={{ width: 46, height: 46 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>About LearnyMol</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                Version 1.0.0 · Test Credits: {profile.credits}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modePill: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  menuCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  menuTitle: { fontSize: 15, fontWeight: '800' },
  menuSub: { fontSize: 12, marginTop: 2 },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
  },
});
