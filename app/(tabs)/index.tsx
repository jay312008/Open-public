import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { LayeredFeatureCard } from '@/components/LayeredFeatureCard';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { getCompanionById, HomeCardAssets } from '@/constants/assets';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { profile, journeyPlan, subjects, completedLessonIds, notifications, timetableSlots } = useApp();
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [focusExpanded, setFocusExpanded] = useState(false);

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

  // Next recommended lesson from real subject catalog
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

  // Approved LearnyMol quick shortcuts (no Games/Stories/Activities)
  const quickShortcuts = [
    {
      id: 'live',
      label: 'Live Teacher',
      icon: 'mic' as const,
      color: '#FF6B4A',
      tint: isDark ? 'rgba(255,107,74,0.22)' : '#FFECE6',
      route: '/tools/live-teacher' as const,
    },
    {
      id: 'exam',
      label: 'Exam Predictor',
      icon: 'sparkles' as const,
      color: '#7C5CFA',
      tint: isDark ? 'rgba(124,92,250,0.22)' : '#F1EBFF',
      route: '/tools/exam-predictor' as const,
    },
    {
      id: 'quiz',
      label: 'Quiz Gen',
      icon: 'checkbox' as const,
      color: '#3B82F6',
      tint: isDark ? 'rgba(59,130,246,0.22)' : '#E8F2FF',
      route: '/tools/quiz-generator' as const,
    },
    {
      id: 'teachers',
      label: 'My Teachers',
      icon: 'school' as const,
      color: '#22A861',
      tint: isDark ? 'rgba(34,168,97,0.22)' : '#E5F8EE',
      route: '/teachers' as const,
    },
  ];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Greeting Header (matches new reference: avatar, greeting, notification bell) */}
          <View style={styles.topHeader}>
            <AnimatedPressable
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.headerLeft}
              accessibilityLabel="Open your profile"
            >
              <View
                style={[
                  styles.avatarRing,
                  {
                    backgroundColor: profile.avatarBg,
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                  },
                ]}
              >
                <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
              </View>
              <View style={styles.greetingCol}>
                <Text style={[styles.greetingTitle, { color: colors.text }]} numberOfLines={1}>
                  Hello, {firstName}
                </Text>
                <Text style={[styles.greetingSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  Ready to learn today?
                </Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.push('/notifications')}
              style={[
                styles.notifBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(39,56,47,0.9)'
                    : 'rgba(255,255,255,0.88)',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.16)'
                    : 'rgba(255,255,255,0.96)',
                },
              ]}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={21} color={colors.text} />
              {unreadNotificationsCount > 0 && <View style={styles.unreadDot} />}
            </AnimatedPressable>
          </View>

          {/* Learning Progress Hero Banner (Lavender-plum softly dimensional card with real XP/progress) */}
          <AnimatedPressable
            onPress={() => router.push('/(tabs)/journey')}
            scaleTo={0.98}
            style={styles.heroWrap}
            accessibilityLabel="Open your Learning Journey"
          >
            <LinearGradient
              colors={isDark ? ['#3D3466', '#2D2550'] : ['#9B8CFF', '#836FF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroLeft}>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroLevelText}>Level {profile.level}</Text>
                  <Text style={styles.heroDot}>·</Text>
                  <Text style={styles.heroSubTitle} numberOfLines={1}>
                    Your learning journey
                  </Text>
                </View>
                <Text style={styles.heroEncourage} numberOfLines={1}>
                  {journeyPlan
                    ? `${completedJourneyLessons}/${totalJourneyLessons} lessons · ${profile.streakDays}d streak · ${profile.xp} XP`
                    : `Let's reach new heights together! · ${profile.xp} XP`}
                </Text>

                <View style={styles.heroBarTrack}>
                  <LinearGradient
                    colors={['#FFAD76', '#FF7B54']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.heroBarFill,
                      { width: `${Math.max(12, journeyPercent || (profile.xp % 100))}%` },
                    ]}
                  />
                </View>
              </View>

              <AnimatedPressable
                onPress={() => router.push('/leaderboard')}
                style={styles.trophyBadge}
                accessibilityLabel="Open Leaderboard"
              >
                <Ionicons name="trophy" size={30} color="#FFD24C" />
                <Text style={styles.trophyXp}>{profile.streakDays}d</Text>
              </AnimatedPressable>
            </LinearGradient>
          </AnimatedPressable>

          {/* 4 Glossy Circular Feature Shortcuts */}
          <View style={styles.shortcutsRow}>
            {quickShortcuts.map((item) => (
              <AnimatedPressable
                key={item.id}
                onPress={() => router.push(item.route as never)}
                scaleTo={0.94}
                style={styles.shortcutItem}
                accessibilityLabel={item.label}
              >
                <View
                  style={[
                    styles.shortcutCircleOuter,
                    {
                      backgroundColor: isDark
                        ? 'rgba(39,56,47,0.92)'
                        : 'rgba(255,255,255,0.9)',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.16)'
                        : 'rgba(255,255,255,0.98)',
                      shadowColor: colors.shadowColor,
                    },
                  ]}
                >
                  <View style={[styles.shortcutCircleInner, { backgroundColor: item.tint }]}>
                    <Ionicons name={item.icon} size={23} color={item.color} />
                  </View>
                </View>
                <Text
                  style={[styles.shortcutLabel, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          {/* Layered Card 1: Ask Molly Anything (separate pastel wave BG + transparent Molly teaching FG + interactive input) */}
          <View
            style={[
              styles.mollyCardOuter,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.9)',
                shadowColor: colors.shadowColor,
              },
            ]}
          >
            <Image
              source={HomeCardAssets.askMollyBg}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(21,27,25,0.85)', 'rgba(21,27,25,0.62)', 'rgba(21,27,25,0.28)']
                  : ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0.08)']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Independent Transparent Molly Character Layer */}
            <View pointerEvents="none" style={styles.mollyFgSlot}>
              <Image
                source={HomeCardAssets.askMollyFg}
                resizeMode="contain"
                style={styles.mollyFgImg}
              />
            </View>

            <View style={styles.mollyContent}>
              <AnimatedPressable
                onPress={() => router.push('/tools/ask-molly')}
                style={styles.mollyLeft}
                accessibilityLabel="Open Chat with Molly"
              >
                <View style={styles.mollyOnlinePill}>
                  <View style={[styles.onlineDot, { backgroundColor: colors.brandGreen }]} />
                  <Text
                    style={[
                      styles.onlineText,
                      { color: isDark ? '#A7E9AF' : '#2E7D32' },
                    ]}
                  >
                    Chat with {companion.name}
                  </Text>
                </View>
                <Text style={[styles.mollyTitle, { color: isDark ? '#F5F7F5' : '#251D3A' }]}>
                  Ask {companion.name} Anything
                </Text>
                <Text
                  style={[
                    styles.mollySub,
                    { color: isDark ? 'rgba(235,243,237,0.82)' : '#544B6E' },
                  ]}
                >
                  Tap to open chat — step-by-step help on any topic
                </Text>
              </AnimatedPressable>

              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: isDark
                      ? 'rgba(21,27,25,0.88)'
                      : 'rgba(255,255,255,0.94)',
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.16)'
                      : 'rgba(230,220,245,0.9)',
                  },
                ]}
              >
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={`Ask ${companion.name} a question...`}
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
          </View>

          {/* Layered Card 2: My Subjects (mint/cream hills BG + transparent 3D schoolchildren FG) */}
          <LayeredFeatureCard
            title="My Subjects"
            subtitle="Build a little knowledge every day across your topics"
            accentColor="#42B86A"
            backgroundSource={HomeCardAssets.subjectsBg}
            foregroundSource={HomeCardAssets.subjectsFg}
            foregroundWidthPercent="48%"
            onPress={() => router.push('/(tabs)/subjects')}
          />

          {/* Layered Card 3: Learning Journey (road-free hills/mountains/trees BG + dynamic progress bar) */}
          <LayeredFeatureCard
            title="Learning Journey"
            badgeText={journeyPlan ? `${journeyPercent}% Complete` : 'Personalized Road'}
            subtitle={
              journeyPlan
                ? `${journeyPlan.goalName} · ${completedJourneyLessons}/${totalJourneyLessons} lessons done`
                : 'Generate your illustrated study road with levels & stars'
            }
            accentColor="#FF7557"
            backgroundSource={HomeCardAssets.learningJourneyBg}
            progressPercent={journeyPlan ? journeyPercent : undefined}
            onPress={() => router.push('/(tabs)/journey')}
          />

          {/* Layered Card 4: Quiz Generator (peach/cream BG + transparent 3D quiz character FG) */}
          <LayeredFeatureCard
            title="Quiz Generator"
            subtitle="Test yourself with custom questions and instant explanations"
            accentColor="#FF8A4C"
            backgroundSource={HomeCardAssets.quizGeneratorBg}
            foregroundSource={HomeCardAssets.quizGeneratorFg}
            foregroundWidthPercent="44%"
            onPress={() => router.push('/tools/quiz-generator')}
          />

          {/* Layered Card 5: Image Analyzer (sky/periwinkle BG + transparent magnifying-glass character FG) */}
          <LayeredFeatureCard
            title="Image Analyzer"
            subtitle="Snap a math problem or diagram for clear visual breakdowns"
            accentColor="#4B7BF5"
            backgroundSource={HomeCardAssets.imageAnalyzerBg}
            foregroundSource={HomeCardAssets.imageAnalyzerFg}
            foregroundWidthPercent="44%"
            onPress={() => router.push('/tools/image-analyzer')}
          />

          {/* Layered Card 6: Book Analyzer (cream/sage/lilac BG + transparent reading character FG) */}
          <LayeredFeatureCard
            title="Book Analyzer"
            subtitle="Upload notes or chapters for smart summaries & key concepts"
            accentColor="#8B63E6"
            backgroundSource={HomeCardAssets.bookAnalyzerBg}
            foregroundSource={HomeCardAssets.bookAnalyzerFg}
            foregroundWidthPercent="40%"
            onPress={() => router.push('/tools/book-analyzer')}
          />

          {/* Layered Card 7: AI Study Groups (dedicated page with its own 3D layered card) */}
          <LayeredFeatureCard
            title="AI Study Groups"
            badgeText="O-Level · A-Level · Uni"
            subtitle="Join or create private groups with up to 5 AI Teachers & daily quizzes"
            accentColor="#16A34A"
            backgroundSource={HomeCardAssets.studyGroupsBg}
            foregroundSource={HomeCardAssets.studyGroupsFg}
            foregroundWidthPercent="44%"
            onPress={() => router.push('/groups' as never)}
          />

          {/* Continue Learning Module (real next recommended lesson) */}
          {recommended && (
            <AnimatedPressable
              onPress={() => router.push(`/lesson/${recommended.lesson.id}`)}
              scaleTo={0.98}
              style={[
                styles.continueCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.shadowColor,
                },
              ]}
            >
              <View style={styles.continueLeft}>
                <View style={[styles.tagPill, { backgroundColor: colors.surfacePurpleSoft }]}>
                  <Text style={[styles.tagText, { color: colors.purple }]}>CONTINUE LEARNING</Text>
                </View>
                <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                  {recommended.topic.title}
                </Text>
                <Text style={[styles.continueSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {recommended.subject.name} · {recommended.lesson.title} ({recommended.lesson.durationMinutes} min)
                </Text>
              </View>
              <View style={[styles.continuePlayBtn, { backgroundColor: colors.coral }]}>
                <Ionicons name="play" size={18} color="#FFFFFF" />
              </View>
            </AnimatedPressable>
          )}

          {/* Today's Study Focus — AI Study Timetable Preview (matches user's previous LearnyMol workflow) */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 22,
              padding: 15,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="radio-button-on" size={18} color={colors.purple} />
                <Text style={{ color: colors.text, fontSize: 15.5, fontWeight: '900' }}>
                  Today's Study Focus
                </Text>
              </View>
              <AnimatedPressable onPress={() => setFocusExpanded((v) => !v)}>
                <Text style={{ color: colors.purple, fontSize: 12.5, fontWeight: '800' }}>
                  {focusExpanded ? 'Less ▲' : 'More ▼'}
                </Text>
              </AnimatedPressable>
            </View>

            {(focusExpanded ? timetableSlots : timetableSlots.slice(0, 2)).map((slot) => (
              <AnimatedPressable
                key={slot.id}
                onPress={() => router.push('/timetable' as never)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: 14,
                  padding: 11,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: colors.surfacePurpleSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="book-outline" size={17} color={colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.purple, fontSize: 12, fontWeight: '800' }}>
                    {slot.day} · {slot.subjectName}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={2}>
                    {slot.topic}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '700' }}>
                  {slot.timeRange}
                </Text>
              </AnimatedPressable>
            ))}

            <AnimatedPressable
              onPress={() => router.push('/timetable' as never)}
              style={{
                backgroundColor: colors.surfaceMint,
                borderRadius: 999,
                paddingVertical: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="sparkles-outline" size={15} color={colors.mintDark} />
              <Text style={{ color: colors.mintDark, fontSize: 12.5, fontWeight: '800' }}>
                Generate / Edit AI Study Timetable
              </Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 112,
    gap: 14,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#251D3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarEmoji: {
    fontSize: 25,
  },
  greetingCol: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 13.5,
    marginTop: 1,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#251D3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FF5E4D',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroWrap: {
    borderRadius: 26,
    shadowColor: '#5B46D9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  heroLeft: {
    flex: 1,
    gap: 6,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroLevelText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  heroDot: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '800',
  },
  heroSubTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  heroEncourage: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 12.5,
    fontWeight: '500',
  },
  heroBarTrack: {
    height: 11,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    marginTop: 4,
  },
  heroBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  trophyBadge: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  trophyXp: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 2,
  },
  shortcutItem: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  shortcutCircleOuter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  shortcutCircleInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    fontSize: 11.5,
    lineHeight: 14,
    minHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  mollyCardOuter: {
    borderRadius: 26,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  mollyFgSlot: {
    position: 'absolute',
    right: 6,
    top: 4,
    width: '38%',
    height: 120,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  mollyFgImg: {
    width: '100%',
    height: '100%',
  },
  mollyContent: {
    padding: 16,
    gap: 12,
    zIndex: 2,
  },
  mollyLeft: {
    maxWidth: '64%',
    gap: 4,
  },
  mollyOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '800',
  },
  mollyTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mollySub: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '500',
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
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  continueLeft: {
    flex: 1,
    gap: 5,
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
    letterSpacing: 0.4,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  continueSub: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  continuePlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
