import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { subjects, completedLessonIds, completeJourneyLesson } = useApp();
  const router = useRouter();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const match = subjects
    .flatMap((s) =>
      s.topics.flatMap((t) => t.lessons.map((l) => ({ subject: s, topic: t, lesson: l })))
    )
    .find((item) => item.lesson.id === id);

  if (!match) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <BrandHeader showBack title="Lesson" />
          <View style={styles.center}>
            <Text style={{ color: colors.text }}>Lesson not found.</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  const { subject, topic, lesson } = match;
  const isCompleted = completedLessonIds.includes(lesson.id);

  const handleComplete = () => {
    const res = completeJourneyLesson(lesson.id);
    if (res.alreadyCompleted) {
      Alert.alert('Already Completed', 'You already earned XP for this lesson.');
    } else {
      Alert.alert(
        'Lesson Complete! ⭐',
        `You earned +${res.awardedXp} XP! Your Learning Journey road and stats have been updated.`
      );
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title={topic.title} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.tagRow]}>
            <View style={[styles.pill, { backgroundColor: colors.surfaceMint }]}>
              <Text style={[styles.pillText, { color: colors.mintDark }]}>{subject.name}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                {lesson.durationMinutes} min
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>
          <Text style={[styles.summary, { color: colors.textSecondary }]}>{lesson.summary}</Text>

          {lesson.exampleEquation && (
            <View
              style={[
                styles.eqCard,
                { backgroundColor: colors.surfacePurpleSoft, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.eqLabel, { color: colors.purple }]}>KEY FORMULA / EXAMPLE</Text>
              <Text style={[styles.eqValue, { color: colors.text }]}>{lesson.exampleEquation}</Text>
            </View>
          )}

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardHeading, { color: colors.text }]}>Key Takeaways</Text>
            {lesson.keyPoints.map((pt, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.mint} />
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{pt}</Text>
              </View>
            ))}
          </View>

          {lesson.practiceQuestion && (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardHeading, { color: colors.text }]}>Quick Check</Text>
              <Text style={[styles.summary, { color: colors.text }]}>
                {lesson.practiceQuestion.prompt}
              </Text>
              {lesson.practiceQuestion.options.map((opt, idx) => {
                const picked = selectedOption === idx;
                const correct = idx === lesson.practiceQuestion!.correctIndex;
                return (
                  <AnimatedPressable
                    key={opt}
                    onPress={() => setSelectedOption(idx)}
                    style={[
                      styles.optBtn,
                      {
                        backgroundColor:
                          picked && correct
                            ? colors.surfaceMint
                            : picked
                            ? colors.surfaceCoralSoft
                            : colors.surfaceMuted,
                        borderColor: picked ? colors.coral : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{opt}</Text>
                  </AnimatedPressable>
                );
              })}
              {selectedOption !== null && (
                <Text style={[styles.explanation, { color: colors.mintDark }]}>
                  {lesson.practiceQuestion.explanation}
                </Text>
              )}
            </View>
          )}

          <View style={styles.actions}>
            <AnimatedPressable
              onPress={() => router.push('/tools/live-teacher')}
              style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="mic-outline" size={18} color={colors.coral} />
              <Text style={[styles.secondaryText, { color: colors.text }]}>Explain with Live Teacher</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={handleComplete}
              style={[
                styles.completeBtn,
                { backgroundColor: isCompleted ? colors.mint : colors.coral },
              ]}
            >
              <Ionicons name={isCompleted ? 'checkmark-done' : 'star'} size={18} color="#FFFFFF" />
              <Text style={styles.completeText}>
                {isCompleted ? 'Lesson Completed' : 'Complete Lesson (+50 XP)'}
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
  scroll: { paddingHorizontal: 18, paddingBottom: 42, gap: 14 },
  tagRow: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 23, fontWeight: '900' },
  summary: { fontSize: 14.5, lineHeight: 21 },
  eqCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 4 },
  eqLabel: { fontSize: 11, fontWeight: '800' },
  eqValue: { fontSize: 16, fontWeight: '800' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  cardHeading: { fontSize: 16, fontWeight: '800' },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  optBtn: { padding: 12, borderRadius: 14, borderWidth: 1 },
  explanation: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  actions: { gap: 10, marginTop: 6 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
  },
  completeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
