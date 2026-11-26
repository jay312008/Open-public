import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors } = useTheme();
  const { profile, publicStudents, toggleFollowUser } = useApp();

  const student = publicStudents.find((s) => s.username === username);
  if (!student) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <BrandHeader showBack title="Student Profile" />
          <View style={styles.center}>
            <Text style={{ color: colors.text }}>Student profile not found.</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  const isFollowing = profile.following.includes(student.id);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title={`@${student.username}`} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: student.avatarBg }]}>
              <Text style={{ fontSize: 42 }}>{student.avatarEmoji}</Text>
            </View>
            <Text style={[styles.name, { color: colors.text }]}>{student.displayName}</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Level {student.level} · {student.levelTitle}
            </Text>
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{student.bio}</Text>
            <Text style={[styles.xp, { color: colors.brandGreen }]}>
              {student.xp.toLocaleString()} XP · {student.streakDays}-day streak
            </Text>
            <AnimatedPressable
              onPress={() => toggleFollowUser(student.id)}
              style={[
                styles.followBtn,
                { backgroundColor: isFollowing ? colors.surfaceMuted : colors.coral },
              ]}
            >
              <Text style={{ color: isFollowing ? colors.text : '#FFFFFF', fontWeight: '800' }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 18 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 21, fontWeight: '900' },
  sub: { fontSize: 13, fontWeight: '700' },
  bio: { fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  xp: { fontSize: 13.5, fontWeight: '800', marginTop: 4 },
  followBtn: { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 999, marginTop: 8 },
});
