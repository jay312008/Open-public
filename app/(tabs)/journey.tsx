import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { JourneyRoad } from '@/components/journey/JourneyRoad';
import { PlanBuilderModal } from '@/components/journey/PlanBuilderModal';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { BadgeItem, JourneyLevelNode, JourneyLessonNode } from '@/types/models';

const SECTIONS = ['Journey', 'Plan', 'Progress', 'Achievements'] as const;

export default function JourneyScreen() {
  const { width } = useWindowDimensions();
  const { colors, reducedMotion } = useTheme();
  const { profile, journeyPlan, badges, toggleDailyTask, subjects } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<JourneyLevelNode | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const worldOffset = useSharedValue(0);

  useEffect(() => {
    const target = -activeTab * width;
    if (reducedMotion) {
      worldOffset.value = target;
    } else {
      worldOffset.value = withSpring(target, { damping: 22, stiffness: 180 });
    }
  }, [activeTab, width, reducedMotion, worldOffset]);

  const worldStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: worldOffset.value }],
  }));

  const levels = journeyPlan?.levels ?? [];
  const totalLessons = levels.reduce((acc, l) => acc + l.lessons.length, 0);
  const doneLessons = levels.reduce(
    (acc, l) => acc + l.lessons.filter((x) => x.completed).length,
    0
  );
  const overallPercent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const completedLevelsCount = levels.filter(
    (l) => l.lessons.length > 0 && l.lessons.every((x) => x.completed)
  ).length;

  const daysLeft = journeyPlan
    ? Math.max(
        0,
        Math.ceil((new Date(journeyPlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  const weeklyPercent = journeyPlan
    ? Math.round((journeyPlan.weeklyCompletedDays / 7) * 100)
    : 0;

  const handleStarPress = (
    level: JourneyLevelNode,
    lesson: JourneyLessonNode,
    locked: boolean
  ) => {
    if (locked) {
      Alert.alert(
        'Lesson Locked',
        `Complete the previous lesson in ${level.topicTitle} to unlock "${lesson.title}".`
      );
      return;
    }
    router.push(`/lesson/${lesson.lessonId}`);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader />

        {/* 4 Rounded Connected-World Navigation Tabs */}
        <View style={styles.tabsRow}>
          {SECTIONS.map((label, idx) => {
            const active = activeTab === idx;
            return (
              <AnimatedPressable
                key={label}
                onPress={() => setActiveTab(idx)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? colors.coral : colors.surface,
                    borderColor: active ? colors.coral : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? '#FFFFFF' : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Horizontally Connected World Viewport */}
        <View style={styles.viewport}>
          <Animated.View style={[styles.worldStrip, { width: width * 4 }, worldStyle]}>
            {/* PANEL 0: JOURNEY ROAD */}
            <View style={[styles.panel, { width }]}>
              <ScrollView
                contentContainerStyle={styles.panelScroll}
                showsVerticalScrollIndicator={false}
              >
                {journeyPlan && (
                  <View
                    style={[
                      styles.compactSummary,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.summaryTitle, { color: colors.text }]}>
                        {journeyPlan.goalName}
                      </Text>
                      <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
                        {doneLessons}/{totalLessons} lessons · {daysLeft} days left
                      </Text>
                    </View>
                    <View style={[styles.pctBadge, { backgroundColor: colors.surfaceMint }]}>
                      <Text style={[styles.pctText, { color: colors.mintDark }]}>
                        {overallPercent}%
                      </Text>
                    </View>
                  </View>
                )}

                <JourneyRoad
                  levels={levels}
                  onSelectLevel={(lvl) => setSelectedLevel(lvl)}
                  onSelectLessonStar={handleStarPress}
                  onGenerateJourney={() => setPlanModalOpen(true)}
                />
              </ScrollView>
            </View>

            {/* PANEL 1: STUDY PLAN (matches pasted.png reference) */}
            <View style={[styles.panel, { width }]}>
              <ScrollView
                contentContainerStyle={styles.panelScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.planHeroRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planHeroTitle, { color: colors.text }]}>
                      Your Study{'\n'}Plan
                    </Text>
                    <Text style={[styles.planHeroSub, { color: colors.textSecondary }]}>
                      A personalized plan to help you reach your exam goal.
                    </Text>
                  </View>
                  <View style={[styles.calendarBadge, { backgroundColor: colors.surfaceCoralSoft }]}>
                    <Ionicons name="calendar" size={44} color={colors.coral} />
                  </View>
                </View>

                {!journeyPlan ? (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', gap: 10 },
                    ]}
                  >
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      No Study Plan Yet
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.textSecondary, textAlign: 'center' }]}>
                      Choose your exam goal, subjects, and daily availability to generate your roadmap.
                    </Text>
                    <AnimatedPressable
                      onPress={() => setPlanModalOpen(true)}
                      style={[styles.coralBtn, { backgroundColor: colors.coral }]}
                    >
                      <Text style={styles.coralBtnText}>Generate Your Journey</Text>
                    </AnimatedPressable>
                  </View>
                ) : (
                  <>
                    {/* Exam Goal & Countdown Card */}
                    <AnimatedPressable
                      onPress={() => setPlanModalOpen(true)}
                      style={[
                        styles.card,
                        styles.rowCard,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <View style={[styles.iconBox, { backgroundColor: colors.surfacePurpleSoft }]}>
                        <Ionicons name="school" size={22} color={colors.purple} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                          {journeyPlan.goalName}
                        </Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                          Exam Date: {journeyPlan.examDate}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.countdownNum, { color: colors.text }]}>{daysLeft}</Text>
                        <View style={[styles.daysPill, { backgroundColor: colors.surfaceCoralSoft }]}>
                          <Text style={[styles.daysPillText, { color: colors.coral }]}>Days Left</Text>
                        </View>
                      </View>
                    </AnimatedPressable>

                    {journeyPlan.scheduleWarning && (
                      <View style={[styles.warningBox, { backgroundColor: colors.surfaceAmberSoft }]}>
                        <Ionicons name="warning-outline" size={18} color="#B45309" />
                        <Text style={[styles.warningText, { color: '#92400E' }]}>
                          {journeyPlan.scheduleWarning}
                        </Text>
                      </View>
                    )}

                    {/* Weekly Plan Progress */}
                    <View
                      style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.border, gap: 10 },
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.iconBox, { backgroundColor: colors.surfacePurpleSoft }]}>
                            <Ionicons name="calendar-outline" size={20} color={colors.purple} />
                          </View>
                          <View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                              Weekly Plan Progress
                            </Text>
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                              {journeyPlan.weeklyCompletedDays} of 7 days completed
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.greenPct, { color: colors.brandGreen }]}>
                          {weeklyPercent}%
                        </Text>
                      </View>
                      <View style={styles.segmentRow}>
                        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                          <View
                            key={d}
                            style={[
                              styles.daySegment,
                              {
                                backgroundColor:
                                  d < journeyPlan.weeklyCompletedDays
                                    ? colors.mint
                                    : colors.surfaceMuted,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    {/* This Week's Focus */}
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>
                      This Week’s Focus
                    </Text>
                    <View style={styles.focusGrid}>
                      {levels.slice(0, 4).map((lvl, idx) => {
                        const tints = [
                          colors.surfacePurpleSoft,
                          colors.surfaceAmberSoft,
                          colors.surfaceBlueSoft,
                          colors.surfaceMint,
                        ];
                        return (
                          <AnimatedPressable
                            key={lvl.id}
                            onPress={() => setSelectedLevel(lvl)}
                            style={[styles.focusTile, { backgroundColor: tints[idx % tints.length] }]}
                          >
                            <Text style={[styles.focusSubj, { color: colors.text }]} numberOfLines={1}>
                              {lvl.subjectName}
                            </Text>
                            <Text style={[styles.focusTopic, { color: colors.textSecondary }]} numberOfLines={2}>
                              {lvl.topicTitle}
                            </Text>
                          </AnimatedPressable>
                        );
                      })}
                    </View>

                    {/* Today's Tasks */}
                    <View style={styles.rowBetween}>
                      <Text style={[styles.sectionHeading, { color: colors.text }]}>Today’s Tasks</Text>
                      <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                        {journeyPlan.todayTasks.filter((t) => t.completed).length} of{' '}
                        {journeyPlan.todayTasks.length} done
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.border, gap: 10 },
                      ]}
                    >
                      {journeyPlan.todayTasks.map((task) => (
                        <AnimatedPressable
                          key={task.id}
                          onPress={() => toggleDailyTask(task.id)}
                          style={styles.taskRow}
                        >
                          <Ionicons
                            name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={task.completed ? colors.mint : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.taskTitle,
                              {
                                color: task.completed ? colors.textMuted : colors.text,
                                textDecorationLine: task.completed ? 'line-through' : 'none',
                              },
                            ]}
                          >
                            {task.title}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </AnimatedPressable>
                      ))}
                    </View>

                    {/* Adjust Your Plan Banner */}
                    <View
                      style={[
                        styles.adjustBanner,
                        { backgroundColor: colors.surfaceMint, borderColor: colors.border },
                      ]}
                    >
                      <CompanionAvatar companionId={profile.companionId} size={74} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                          Adjust Your Plan
                        </Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                          Update subjects, topics, or your study schedule anytime.
                        </Text>
                        <AnimatedPressable
                          onPress={() => setPlanModalOpen(true)}
                          style={[styles.editPlanBtn, { backgroundColor: colors.coral }]}
                        >
                          <Ionicons name="pencil" size={14} color="#FFFFFF" />
                          <Text style={styles.coralBtnText}>Edit Plan</Text>
                        </AnimatedPressable>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>

            {/* PANEL 2: LEARNING PROGRESS */}
            <View style={[styles.panel, { width }]}>
              <ScrollView
                contentContainerStyle={styles.panelScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.planHeroTitle, { color: colors.text }]}>
                  Learning Progress
                </Text>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border, gap: 10 },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Exam Readiness Estimate
                    </Text>
                    <Text style={[styles.greenPct, { color: colors.coral }]}>
                      {overallPercent}%
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                    <View
                      style={[
                        styles.barFill,
                        { backgroundColor: colors.mint, width: `${overallPercent}%` },
                      ]}
                    />
                  </View>
                  <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
                    Estimate based on completed lessons and quiz practice — not a guaranteed exam
                    result.
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statNum, { color: colors.text }]}>{doneLessons}</Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Lessons Done</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statNum, { color: colors.text }]}>
                      {Math.max(0, totalLessons - doneLessons)}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Remaining</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statNum, { color: colors.text }]}>{completedLevelsCount}</Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Levels Clear</Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Subject Mastery
                </Text>
                {subjects.map((sub) => {
                  const subLevels = levels.filter((l) => l.subjectId === sub.id);
                  const subTotal = subLevels.reduce((a, l) => a + l.lessons.length, 0);
                  const subDone = subLevels.reduce(
                    (a, l) => a + l.lessons.filter((x) => x.completed).length,
                    0
                  );
                  const pct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
                  return (
                    <View
                      key={sub.id}
                      style={[
                        styles.card,
                        { backgroundColor: colors.surface, borderColor: colors.border, gap: 8 },
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{sub.name}</Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                          {subDone}/{subTotal} lessons ({pct}%)
                        </Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                        <View
                          style={[styles.barFill, { backgroundColor: sub.color, width: `${pct}%` }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* PANEL 3: ACHIEVEMENTS */}
            <View style={[styles.panel, { width }]}>
              <ScrollView
                contentContainerStyle={styles.panelScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.planHeroTitle, { color: colors.text }]}>Achievements</Text>
                  <AnimatedPressable
                    onPress={() => router.push('/leaderboard')}
                    style={[styles.coralBtn, { backgroundColor: colors.coral, paddingVertical: 8, paddingHorizontal: 14 }]}
                  >
                    <Text style={styles.coralBtnText}>Leaderboard</Text>
                  </AnimatedPressable>
                </View>

                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statNum, { color: colors.gold }]}>{profile.xp}</Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Total XP</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statNum, { color: colors.coral }]}>{profile.streakDays}d</Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Streak</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.statNum, { color: colors.mint }]}>
                      {badges.filter((b) => b.unlocked).length}/{badges.length}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Badges</Text>
                  </View>
                </View>

                <View style={styles.badgeGrid}>
                  {badges.map((badge) => (
                    <AnimatedPressable
                      key={badge.id}
                      onPress={() => setSelectedBadge(badge)}
                      style={[
                        styles.badgeCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: badge.unlocked ? badge.color : colors.border,
                          opacity: badge.unlocked ? 1 : 0.6,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.badgeIconCircle,
                          { backgroundColor: badge.unlocked ? badge.color : colors.surfaceMuted },
                        ]}
                      >
                        <Ionicons
                          name={badge.icon as keyof typeof Ionicons.glyphMap}
                          size={24}
                          color={badge.unlocked ? '#FFFFFF' : colors.textMuted}
                        />
                      </View>
                      <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>
                        {badge.name}
                      </Text>
                      <Text style={[styles.badgeStatus, { color: badge.unlocked ? colors.mintDark : colors.textMuted }]}>
                        {badge.unlocked ? 'Unlocked' : 'Locked'}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </View>

        {/* Level Details Modal */}
        <Modal visible={Boolean(selectedLevel)} transparent animationType="slide">
          <View style={styles.sheetBackdrop}>
            <View style={[styles.sheetCard, { backgroundColor: colors.surface }]}>
              {selectedLevel && (
                <>
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={[styles.sheetEyebrow, { color: colors.coral }]}>
                        LEVEL {selectedLevel.levelNumber} · {selectedLevel.subjectName}
                      </Text>
                      <Text style={[styles.sheetTitle, { color: colors.text }]}>
                        {selectedLevel.topicTitle}
                      </Text>
                    </View>
                    <AnimatedPressable onPress={() => setSelectedLevel(null)}>
                      <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                    </AnimatedPressable>
                  </View>

                  <View style={{ gap: 8, marginTop: 12 }}>
                    {selectedLevel.lessons.map((lesson, idx) => (
                      <AnimatedPressable
                        key={lesson.id}
                        onPress={() => {
                          setSelectedLevel(null);
                          router.push(`/lesson/${lesson.lessonId}`);
                        }}
                        style={[styles.sheetLessonRow, { backgroundColor: colors.surfaceMuted }]}
                      >
                        <Ionicons
                          name={lesson.completed ? 'star' : 'play-circle-outline'}
                          size={20}
                          color={lesson.completed ? colors.starFilled : colors.coral}
                        />
                        <Text style={[styles.sheetLessonTitle, { color: colors.text }]} numberOfLines={1}>
                          {idx + 1}. {lesson.title}
                        </Text>
                        <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                          {lesson.durationMinutes}m
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>

                  <AnimatedPressable
                    onPress={() => {
                      const next =
                        selectedLevel.lessons.find((l) => !l.completed) ?? selectedLevel.lessons[0];
                      setSelectedLevel(null);
                      if (next) router.push(`/lesson/${next.lessonId}`);
                    }}
                    style={[styles.coralBtn, { backgroundColor: colors.coral, marginTop: 16, width: '100%' }]}
                  >
                    <Text style={styles.coralBtnText}>Continue Learning</Text>
                  </AnimatedPressable>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Badge Detail Modal */}
        <Modal visible={Boolean(selectedBadge)} transparent animationType="fade">
          <View style={styles.modalCenter}>
            <View style={[styles.badgeModal, { backgroundColor: colors.surface }]}>
              {selectedBadge && (
                <>
                  <View
                    style={[
                      styles.badgeIconCircle,
                      {
                        backgroundColor: selectedBadge.unlocked
                          ? selectedBadge.color
                          : colors.surfaceMuted,
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                      },
                    ]}
                  >
                    <Ionicons
                      name={selectedBadge.icon as keyof typeof Ionicons.glyphMap}
                      size={30}
                      color={selectedBadge.unlocked ? '#FFFFFF' : colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>
                    {selectedBadge.name}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary, textAlign: 'center' }]}>
                    {selectedBadge.description}
                  </Text>
                  <Text style={[styles.reqText, { color: colors.coral }]}>
                    Requirement: {selectedBadge.requirement}
                  </Text>
                  <AnimatedPressable
                    onPress={() => setSelectedBadge(null)}
                    style={[styles.coralBtn, { backgroundColor: colors.coral, marginTop: 8 }]}
                  >
                    <Text style={styles.coralBtnText}>Close</Text>
                  </AnimatedPressable>
                </>
              )}
            </View>
          </View>
        </Modal>

        <PlanBuilderModal
          visible={planModalOpen}
          existingPlan={journeyPlan}
          onClose={() => setPlanModalOpen(false)}
          onCreated={() => {
            setPlanModalOpen(false);
            setActiveTab(0);
          }}
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 8,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 11.5, fontWeight: '700' },
  viewport: { flex: 1, overflow: 'hidden' },
  worldStrip: { flex: 1, flexDirection: 'row' },
  panel: { flex: 1 },
  panelScroll: { paddingHorizontal: 16, paddingBottom: 112, gap: 14 },
  compactSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800' },
  summarySub: { fontSize: 12, marginTop: 2 },
  pctBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pctText: { fontSize: 13, fontWeight: '800' },
  planHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planHeroTitle: { fontSize: 24, fontWeight: '900', lineHeight: 28 },
  planHeroSub: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  calendarBadge: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: 20, borderWidth: 1, padding: 15 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardSub: { fontSize: 12.5 },
  countdownNum: { fontSize: 22, fontWeight: '900' },
  daysPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  daysPillText: { fontSize: 10.5, fontWeight: '800' },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    alignItems: 'flex-start',
  },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17 },
  greenPct: { fontSize: 18, fontWeight: '900' },
  segmentRow: { flexDirection: 'row', gap: 6 },
  daySegment: { flex: 1, height: 8, borderRadius: 4 },
  sectionHeading: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusTile: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    gap: 3,
  },
  focusSubj: { fontSize: 13.5, fontWeight: '800' },
  focusTopic: { fontSize: 11.5 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  taskTitle: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  adjustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  editPlanBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  coralBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  coralBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  barTrack: { height: 9, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  disclaimer: { fontSize: 11.5, lineHeight: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  statNum: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 11.5, fontWeight: '600' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  badgeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: { fontSize: 13.5, fontWeight: '800', textAlign: 'center' },
  badgeStatus: { fontSize: 11.5, fontWeight: '700' },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
  },
  sheetEyebrow: { fontSize: 11, fontWeight: '800' },
  sheetTitle: { fontSize: 19, fontWeight: '800', marginTop: 2 },
  sheetLessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  sheetLessonTitle: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  modalCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  badgeModal: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  reqText: { fontSize: 12.5, fontWeight: '700' },
});
