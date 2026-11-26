import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path, Polygon, Circle, Line } from 'react-native-svg';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { getCompanionById } from '@/constants/assets';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile, journeyPlan, subjects, completedLessonIds } = useApp();
  const router = useRouter();
  const [question, setQuestion] = useState('');

  const companion = getCompanionById(profile.companionId);
  const firstName = profile.displayName.split(' ')[0];

  const totalJourneyLessons = journeyPlan
    ? journeyPlan.levels.reduce((acc, l) => acc + l.lessons.length, 0)
    : 0;
  const completedJourneyLessons = journeyPlan
    ? journeyPlan.levels.reduce(
        (acc, l) => acc + l.lessons.filter((les) => les.completed).length,
        0
      )
    : 0;
  const journeyPercent =
    totalJourneyLessons > 0
      ? Math.round((completedJourneyLessons / totalJourneyLessons) * 100)
      : 0;

  // Next recommended lesson
  const allLessons = subjects.flatMap((s) =>
    s.topics.flatMap((t) => t.lessons.map((l) => ({ subject: s, topic: t, lesson: l })))
  );
  const recommended =
    allLessons.find((item) => !completedLessonIds.includes(item.lesson.id)) ?? allLessons[0];

  const handleAskMolly = () => {
    const q = question.trim();
    setQuestion('');
    router.push({
      pathname: '/tools/ask-molly',
      params: q ? { initialQuestion: q } : {},
    });
  };

  const quickTools = [
    {
      id: 'live',
      label: 'Live Teacher',
      icon: 'mic-outline' as const,
      color: colors.coral,
      bg: colors.surfaceCoralSoft,
      route: '/tools/live-teacher' as const,
    },
    {
      id: 'exam',
      label: 'Exam Predictor',
      icon: 'sparkles-outline' as const,
      color: colors.purple,
      bg: colors.surfacePurpleSoft,
      route: '/tools/exam-predictor' as const,
    },
    {
      id: 'quiz',
      label: 'Quiz Gen',
      icon: 'checkbox-outline' as const,
      color: colors.blue,
      bg: colors.surfaceBlueSoft,
      route: '/tools/quiz-generator' as const,
    },
    {
      id: 'book',
      label: 'Book & Image',
      icon: 'scan-outline' as const,
      color: colors.mintDark,
      bg: colors.surfaceMint,
      route: '/tools/book-analyzer' as const,
    },
  ];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Compact Greeting */}
          <View style={styles.greetingRow}>
            <View>
              <Text style={[styles.greetingTitle, { color: colors.text }]}>
                Hi {firstName} 👋
              </Text>
              <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
                What would you like to master today?
              </Text>
            </View>
            <AnimatedPressable
              onPress={() => router.push('/leaderboard')}
              style={[
                styles.xpPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="flame" size={16} color={colors.coral} />
              <Text style={[styles.xpPillText, { color: colors.text }]}>
                {profile.streakDays}d · {profile.xp} XP
              </Text>
            </AnimatedPressable>
          </View>

          {/* Interactive Ask Molly Card with overlapping mascot */}
          <View style={styles.askMollyWrapper}>
            <View
              style={[
                styles.askMollyCard,
                {
                  backgroundColor: colors.surfaceMint,
                  borderColor: colors.border,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              {/* Layered green wave decoration */}
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%" viewBox="0 0 340 165" preserveAspectRatio="none">
                  <Path
                    d="M0 95 C90 55, 220 135, 340 75 L340 165 L0 165 Z"
                    fill={colors.surfaceMintStrong}
                    opacity={0.7}
                  />
                </Svg>
              </View>

              <View style={styles.askMollyHeader}>
                <View style={{ flex: 1, paddingRight: 86 }}>
                  <View style={styles.onlinePill}>
                    <View style={[styles.onlineDot, { backgroundColor: colors.mint }]} />
                    <Text style={[styles.onlineText, { color: colors.mintDark }]}>
                      Ask {companion.name} AI
                    </Text>
                  </View>
                  <Text style={[styles.askTitle, { color: colors.text }]}>
                    Stuck on a topic or homework?
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={`Ask ${companion.name} anything...`}
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                  returnKeyType="send"
                  onSubmitEditing={handleAskMolly}
                />
                <AnimatedPressable
                  onPress={handleAskMolly}
                  style={[styles.sendBtn, { backgroundColor: colors.coral }]}
                  accessibilityLabel="Send question to Molly"
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                </AnimatedPressable>
              </View>
            </View>

            {/* Overlapping Molly Mascot extending above/right of card */}
            <View pointerEvents="none" style={styles.mascotOverlap}>
              <CompanionAvatar companionId={profile.companionId} size={96} />
            </View>
          </View>

          {/* Four Compact Learning-Tool Shortcuts */}
          <View style={styles.toolsGrid}>
            {quickTools.map((tool) => (
              <AnimatedPressable
                key={tool.id}
                onPress={() => router.push(tool.route)}
                style={[
                  styles.toolCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.shadowColor,
                  },
                ]}
              >
                <View style={[styles.toolIconCircle, { backgroundColor: tool.bg }]}>
                  <Ionicons name={tool.icon} size={20} color={tool.color} />
                </View>
                <Text style={[styles.toolLabel, { color: colors.text }]} numberOfLines={1}>
                  {tool.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          {/* Learning Journey Card with Mountain & Coral Flag */}
          <AnimatedPressable
            onPress={() => router.push('/(tabs)/journey')}
            style={[
              styles.featureCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.tagPill, { backgroundColor: colors.surfaceCoralSoft }]}>
                <Text style={[styles.tagText, { color: colors.coral }]}>LEARNING JOURNEY</Text>
              </View>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {journeyPlan ? journeyPlan.goalName : 'Start Your Study Road'}
              </Text>
              <Text style={[styles.featureSub, { color: colors.textSecondary }]}>
                {journeyPlan
                  ? `${completedJourneyLessons}/${totalJourneyLessons} lessons · ${journeyPercent}% complete`
                  : 'Create a personalized roadmap with levels & lesson stars.'}
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.mint,
                      width: `${Math.max(journeyPlan ? journeyPercent : 0, journeyPlan ? 6 : 0)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Illustrated Mountain with Coral Flag */}
            <View style={styles.mountainArt}>
              <Svg width={86} height={82} viewBox="0 0 86 82">
                <Path d="M4 76 L34 26 L64 76 Z" fill="#8CD47E" />
                <Path d="M28 76 L56 18 L84 76 Z" fill="#58B957" />
                <Path d="M48 34 L56 18 L64 34 L59 31 L56 35 L52 31 Z" fill="#FFFFFF" opacity={0.85} />
                <Line x1="56" y1="18" x2="56" y2="5" stroke="#5A4636" strokeWidth="2.5" strokeLinecap="round" />
                <Polygon points="56,5 74,10 56,16" fill="#FF6B4A" />
                <Circle cx="18" cy="18" r="6" fill="#FFE082" opacity={0.85} />
              </Svg>
            </View>
          </AnimatedPressable>

          {/* Continue Learning / Recommended Lesson Card */}
          {recommended && (
            <AnimatedPressable
              onPress={() => router.push(`/lesson/${recommended.lesson.id}`)}
              style={[
                styles.featureCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              <View style={styles.featureLeft}>
                <View style={[styles.tagPill, { backgroundColor: colors.surfacePurpleSoft }]}>
                  <Text style={[styles.tagText, { color: colors.purple }]}>
                    CONTINUE LEARNING
                  </Text>
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]} numberOfLines={1}>
                  {recommended.topic.title}
                </Text>
                <Text style={[styles.featureSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {recommended.subject.name} · {recommended.lesson.title} ({recommended.lesson.durationMinutes} min)
                </Text>
                <View style={styles.continueRow}>
                  <Text style={[styles.continueCta, { color: colors.coral }]}>
                    Open Lesson
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.coral} />
                </View>
              </View>

              {/* Math Parabola Illustration */}
              <View style={[styles.mathArt, { backgroundColor: colors.surfacePurpleSoft }]}>
                <Svg width={72} height={72} viewBox="0 0 72 72">
                  <Line x1="10" y1="56" x2="62" y2="56" stroke="#8B5CF6" strokeWidth="1.8" opacity={0.5} />
                  <Line x1="36" y1="12" x2="36" y2="62" stroke="#8B5CF6" strokeWidth="1.8" opacity={0.5} />
                  <Path
                    d="M14 18 Q36 68 58 18"
                    stroke="#FF6B4A"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <Circle cx="36" cy="43" r="3.5" fill="#58C45B" />
                </Svg>
              </View>
            </AnimatedPressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 112,
    gap: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  greetingSub: {
    fontSize: 13,
    marginTop: 2,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  xpPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  askMollyWrapper: {
    position: 'relative',
    marginTop: 12,
  },
  askMollyCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 12,
  },
  askMollyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  askTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  mascotOverlap: {
    position: 'absolute',
    right: 6,
    top: -22,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 7,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  toolIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  featureLeft: {
    flex: 1,
    gap: 6,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  featureSub: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  mountainArt: {
    width: 86,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mathArt: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  continueCta: {
    fontSize: 13,
    fontWeight: '700',
  },
});
