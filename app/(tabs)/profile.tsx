import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { StudentAvatar } from '@/components/StudentAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function ProfileScreen() {
  const { colors, reducedMotion } = useTheme();
  const { profile, journeyPlan, badges, publicStudents, toggleFollowUser, conversations } = useApp();
  const router = useRouter();

  const [socialModal, setSocialModal] = useState<'followers' | 'following' | null>(null);

  // Smooth centered entrance animation for Profile avatar without top clipping
  const avatarTranslateY = useSharedValue(reducedMotion ? 0 : 8);
  const avatarScale = useSharedValue(reducedMotion ? 1 : 0.9);

  useEffect(() => {
    if (reducedMotion) return;
    avatarTranslateY.value = withSpring(0, { damping: 18, stiffness: 180 });
    avatarScale.value = withSpring(1, { damping: 16, stiffness: 170 });
  }, [reducedMotion, avatarTranslateY, avatarScale]);

  const avatarAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: avatarTranslateY.value },
      { scale: avatarScale.value },
    ],
  }));

  const levels = journeyPlan?.levels ?? [];
  const totalLessons = levels.reduce((a, l) => a + l.lessons.length, 0);
  const doneLessons = levels.reduce(
    (a, l) => a + l.lessons.filter((x) => x.completed).length,
    0
  );
  const progressPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const completedLevels = levels.filter(
    (l) => l.lessons.length > 0 && l.lessons.every((x) => x.completed)
  ).length;

  const firstName = profile.displayName.split(' ')[0];
  const socialList =
    socialModal === 'followers'
      ? publicStudents.filter((s) => profile.followers.includes(s.id))
      : publicStudents.filter((s) => profile.following.includes(s.id));

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showAvatar={false} showSettings />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Centered Animated Avatar, Name, @username, Level Badge */}
          <View style={styles.heroCenter}>
            <Animated.View
              style={[
                styles.bigAvatar,
                { backgroundColor: profile.avatarBg, borderColor: colors.surface },
                avatarAnimStyle,
              ]}
            >
              <StudentAvatar avatarId={profile.avatarEmoji} bgColor={profile.avatarBg} size={86} />
            </Animated.View>

            <Text style={[styles.name, { color: colors.text }]}>{profile.displayName}</Text>
            <Text style={[styles.username, { color: colors.textMuted }]}>@{profile.username}</Text>

            <View style={[styles.levelPill, { backgroundColor: colors.surfacePurpleSoft }]}>
              <Ionicons name="sparkles" size={13} color={colors.purple} />
              <Text style={[styles.levelText, { color: colors.purple }]}>
                Level {profile.level} · {profile.levelTitle}
              </Text>
            </View>

            {/* Interactive Followers & Following */}
            <View style={styles.socialRow}>
              <AnimatedPressable
                onPress={() => setSocialModal('followers')}
                style={[styles.socialPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.socialNum, { color: colors.text }]}>
                  {profile.followers.length}
                </Text>
                <Text style={[styles.socialLbl, { color: colors.textSecondary }]}>Followers</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => setSocialModal('following')}
                style={[styles.socialPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.socialNum, { color: colors.text }]}>
                  {profile.following.length}
                </Text>
                <Text style={[styles.socialLbl, { color: colors.textSecondary }]}>Following</Text>
              </AnimatedPressable>
            </View>
          </View>

          {/* 4 Stat Cards */}
          <View style={styles.statsGrid}>
            <AnimatedPressable
              onPress={() => router.push('/leaderboard')}
              style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="trophy" size={20} color={colors.gold} />
              <Text style={[styles.statVal, { color: colors.text }]}>{profile.xp}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>XP</Text>
            </AnimatedPressable>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="flame" size={20} color={colors.coral} />
              <Text style={[styles.statVal, { color: colors.text }]}>{profile.streakDays}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="radio-button-on" size={20} color={colors.danger} />
              <Text style={[styles.statVal, { color: colors.text }]}>{progressPct}%</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Progress</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="stats-chart" size={20} color={colors.purple} />
              <Text style={[styles.statVal, { color: colors.text }]}>{completedLevels}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Levels</Text>
            </View>
          </View>

          {/* My Achievements */}
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Achievements</Text>
            <AnimatedPressable onPress={() => router.push('/(tabs)/journey')}>
              <Text style={[styles.seeAll, { color: colors.brandGreen }]}>See All &gt;</Text>
            </AnimatedPressable>
          </View>
          <View style={styles.badgesRow}>
            {badges.slice(0, 4).map((b) => (
              <View key={b.id} style={styles.badgeCol}>
                <View
                  style={[
                    styles.hexBadge,
                    {
                      backgroundColor: b.unlocked ? b.color : colors.surfaceMuted,
                      opacity: b.unlocked ? 1 : 0.55,
                    },
                  ]}
                >
                  <Ionicons
                    name={b.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={b.unlocked ? '#FFFFFF' : colors.textMuted}
                  />
                </View>
                <Text style={[styles.badgeLbl, { color: colors.text }]} numberOfLines={2}>
                  {b.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Menu Card */}
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              {
                icon: 'map-outline' as const,
                color: colors.brandGreen,
                bg: colors.surfaceMint,
                title: 'My Learning Journey',
                sub: journeyPlan
                  ? `${journeyPlan.goalName} · ${progressPct}% complete`
                  : 'Create your personalized study road',
                route: '/(tabs)/journey' as const,
              },
              {
                icon: 'trophy-outline' as const,
                color: colors.gold,
                bg: colors.surfaceAmberSoft,
                title: 'Leaderboard',
                sub: 'See Weekly, Monthly & All-Time rankings',
                route: '/leaderboard' as const,
              },
              {
                icon: 'bookmark-outline' as const,
                color: colors.coral,
                bg: colors.surfaceCoralSoft,
                title: 'Saved Resources & Chats',
                sub: `${conversations.length} saved AI sessions`,
                route: '/saved-resources' as const,
              },
              {
                icon: 'create-outline' as const,
                color: colors.purple,
                bg: colors.surfacePurpleSoft,
                title: 'Edit Profile',
                sub: 'Update name, bio, and education level',
                route: '/settings/edit-profile' as const,
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
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </AnimatedPressable>
            ))}
          </View>

          {/* Motivational Molly Banner */}
          <View
            style={[
              styles.mollyBanner,
              { backgroundColor: colors.surfaceMint, borderColor: colors.border },
            ]}
          >
            <CompanionAvatar companionId={profile.companionId} size={74} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>
                Keep Going, {firstName}!
              </Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
                You’re doing great. Stay consistent and reach your next level!
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Followers / Following Modal */}
        <Modal visible={Boolean(socialModal)} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {socialModal === 'followers' ? 'Followers' : 'Following'}
                </Text>
                <AnimatedPressable onPress={() => setSocialModal(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </AnimatedPressable>
              </View>
              {socialList.length === 0 ? (
                <Text style={[styles.menuSub, { color: colors.textSecondary, paddingVertical: 16 }]}>
                  No students in this list yet.
                </Text>
              ) : (
                socialList.map((stu) => {
                  const isFollowing = profile.following.includes(stu.id);
                  return (
                    <View key={stu.id} style={styles.socialItemRow}>
                      <AnimatedPressable
                        onPress={() => {
                          setSocialModal(null);
                          router.push(`/profile/${stu.username}`);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                      >
                        <View style={[styles.miniAvatar, { backgroundColor: stu.avatarBg }]}>
                          <Text style={{ fontSize: 18 }}>{stu.avatarEmoji}</Text>
                        </View>
                        <View>
                          <Text style={[styles.menuTitle, { color: colors.text }]}>
                            {stu.displayName}
                          </Text>
                          <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                            @{stu.username}
                          </Text>
                        </View>
                      </AnimatedPressable>
                      <AnimatedPressable
                        onPress={() => toggleFollowUser(stu.id)}
                        style={[
                          styles.followBtn,
                          {
                            backgroundColor: isFollowing ? colors.surfaceMuted : colors.coral,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: isFollowing ? colors.text : '#FFFFFF',
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </AnimatedPressable>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 112, gap: 16 },
  heroCenter: { alignItems: 'center', gap: 5 },
  bigAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  bigAvatarEmoji: { fontSize: 48 },
  name: { fontSize: 23, fontWeight: '900', marginTop: 4 },
  username: { fontSize: 13.5, fontWeight: '600' },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  levelText: { fontSize: 12.5, fontWeight: '800' },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  socialNum: { fontSize: 14, fontWeight: '900' },
  socialLbl: { fontSize: 12.5, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  statVal: { fontSize: 16, fontWeight: '900' },
  statLbl: { fontSize: 10.5, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAll: { fontSize: 13, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  badgeCol: { flex: 1, alignItems: 'center', gap: 6 },
  hexBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLbl: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  menuCard: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 14.5, fontWeight: '800' },
  menuSub: { fontSize: 12, marginTop: 1 },
  mollyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  bannerTitle: { fontSize: 16, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  socialItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  miniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
});
