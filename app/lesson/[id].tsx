import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

type LessonTab = 'notes' | 'flashcards' | 'exercise';

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { subjects, completedLessonIds, completeJourneyLesson } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LessonTab>('notes');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<number[]>([]);
  const [exerciseAnswer, setExerciseAnswer] = useState('');
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);

  const match = subjects
    .flatMap((s) =>
      s.topics.flatMap((t) => t.lessons.map((l) => ({ subject: s, topic: t, lesson: l })))
    )
    .find((item) => item.lesson.id === id);

  const flashcards = useMemo(() => {
    if (!match) return [];
    const { lesson, topic } = match;
    const cards: { front: string; back: string }[] = [
      { front: `What is the main idea of "${lesson.title}"?`, back: lesson.summary },
      ...lesson.keyPoints.map((kp, i) => ({
        front: `${topic.title} · Key Concept #${i + 1}`,
        back: kp,
      })),
    ];
    if (lesson.exampleEquation) {
      cards.push({
        front: `Recall the key formula or example for ${lesson.title}`,
        back: lesson.exampleEquation,
      });
    }
    return cards;
  }, [match]);

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

  const currentCard = flashcards[cardIndex];

  const handleSubmitExercise = () => {
    if (exerciseAnswer.trim().length < 8) {
      Alert.alert('Write a bit more', 'Enter at least a short explanation to submit your exercise.');
      return;
    }
    setExerciseSubmitted(true);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title={topic.title} />

        {/* 3 Clean Lesson Mode Tabs: Notes | Flashcards | Exercise (Master Blueprint Part 6) */}
        <View style={styles.tabRow}>
          {(
            [
              { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
              { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: 'albums-outline' },
              { id: 'exercise', label: 'Exercise', icon: 'create-outline' },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <AnimatedPressable
                key={t.id}
                onPress={() => setActiveTab(t.id)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? colors.coral : colors.surface,
                    borderColor: active ? colors.coral : colors.border,
                  },
                ]}
              >
                <Ionicons name={t.icon} size={14} color={active ? '#FFFFFF' : colors.text} />
                <Text
                  style={[styles.tabText, { color: active ? '#FFFFFF' : colors.text }]}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.tagRow}>
            <View style={[styles.pill, { backgroundColor: colors.surfaceMint }]}>
              <Text style={[styles.pillText, { color: colors.mintDark }]}>
                {subject.code ? `${subject.code} · ` : ''}{subject.name}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                {lesson.durationMinutes} min
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>

          {activeTab === 'notes' && (
            <>
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

              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardHeading, { color: colors.text }]}>Key Takeaways</Text>
                {lesson.keyPoints.map((pt, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.mint} />
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{pt}</Text>
                  </View>
                ))}
              </View>

              <AnimatedPressable
                onPress={() =>
                  router.push({
                    pathname: '/tools/ask-molly',
                    params: { initialQuestion: `Explain "${lesson.title}" in ${subject.name} step by step` },
                  })
                }
                style={[
                  styles.mollyBtn,
                  { backgroundColor: colors.surfaceMint, borderColor: colors.mint },
                ]}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.mintDark} />
                <Text style={[styles.mollyBtnText, { color: colors.mintDark }]}>
                  Ask Molly to explain this lesson
                </Text>
              </AnimatedPressable>
            </>
          )}

          {activeTab === 'flashcards' && currentCard && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                Card {cardIndex + 1} of {flashcards.length} · Mastered: {masteredCards.length}/{flashcards.length}
              </Text>

              <AnimatedPressable
                onPress={() => setFlipped((f) => !f)}
                style={[
                  styles.flashcard,
                  {
                    backgroundColor: flipped ? colors.surfaceMint : colors.surface,
                    borderColor: flipped ? colors.mint : colors.border,
                  },
                ]}
              >
                <Text style={[styles.flashSideTag, { color: flipped ? colors.mintDark : colors.purple }]}>
                  {flipped ? 'ANSWER · TAP TO FLIP BACK' : 'PROMPT · TAP TO REVEAL ANSWER'}
                </Text>
                <Text style={[styles.flashBody, { color: colors.text }]}>
                  {flipped ? currentCard.back : currentCard.front}
                </Text>
              </AnimatedPressable>

              <View style={styles.flashActions}>
                <AnimatedPressable
                  onPress={() => {
                    setFlipped(false);
                    setCardIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
                  }}
                  style={[styles.flashBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                  <Text style={{ fontWeight: '700', color: colors.text }}>Prev</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => {
                    setMasteredCards((prev) => (prev.includes(cardIndex) ? prev : [...prev, cardIndex]));
                    setFlipped(false);
                    setCardIndex((i) => (i + 1) % flashcards.length);
                  }}
                  style={[styles.flashBtn, { backgroundColor: colors.brandGreen, borderColor: colors.brandGreen }]}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>Got It</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => {
                    setFlipped(false);
                    setCardIndex((i) => (i + 1) % flashcards.length);
                  }}
                  style={[styles.flashBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={{ fontWeight: '700', color: colors.text }}>Next</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </AnimatedPressable>
              </View>
            </View>
          )}

          {activeTab === 'exercise' && (
            <>
              {lesson.practiceQuestion && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.cardHeading, { color: colors.text }]}>Quick Check (MCQ)</Text>
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
                              selectedOption !== null && correct
                                ? colors.surfaceMint
                                : picked && !correct
                                ? colors.surfaceCoralSoft
                                : colors.surfaceMuted,
                            borderColor:
                              selectedOption !== null && correct
                                ? colors.brandGreen
                                : picked
                                ? colors.coral
                                : 'transparent',
                          },
                        ]}
                      >
                        <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13.5 }}>{opt}</Text>
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

              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardHeading, { color: colors.text }]}>Written Exercise Submission</Text>
                <Text style={[styles.summary, { color: colors.textSecondary }]}>
                  In your own words, summarize the key rule of “{lesson.title}” and give one exam example:
                </Text>
                <TextInput
                  value={exerciseAnswer}
                  onChangeText={setExerciseAnswer}
                  multiline
                  placeholder="Write your solution or explanation here..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.textArea,
                    { backgroundColor: colors.surfaceMuted, color: colors.text, borderColor: colors.border },
                  ]}
                />
                <AnimatedPressable
                  onPress={handleSubmitExercise}
                  style={[styles.submitBtn, { backgroundColor: colors.purple }]}
                >
                  <Text style={styles.completeText}>
                    {exerciseSubmitted ? 'Exercise Submitted ✓' : 'Submit Exercise'}
                  </Text>
                </AnimatedPressable>
                {exerciseSubmitted && (
                  <Text style={[styles.explanation, { color: colors.mintDark }]}>
                    Great work! Compare your answer with the Key Takeaways in Notes or tap “Ask Molly” for detailed marking.
                  </Text>
                )}
              </View>
            </>
          )}

          <AnimatedPressable
            onPress={handleComplete}
            style={[
              styles.completeBtn,
              { backgroundColor: isCompleted ? colors.brandGreen : colors.coral },
            ]}
          >
            <Ionicons name={isCompleted ? 'checkmark-done' : 'star'} size={18} color="#FFFFFF" />
            <Text style={styles.completeText}>
              {isCompleted ? 'Lesson Completed (+50 XP Earned)' : 'Mark Lesson Complete (+50 XP)'}
            </Text>
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingBottom: 42, gap: 14 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 23, fontWeight: '900', lineHeight: 28 },
  summary: { fontSize: 14.5, lineHeight: 21 },
  eqCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 4 },
  eqLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  eqValue: { fontSize: 16, fontWeight: '800' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  cardHeading: { fontSize: 16, fontWeight: '800' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  mollyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  mollyBtnText: { fontSize: 14, fontWeight: '800' },
  cardMeta: { fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  flashcard: {
    minHeight: 200,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  flashSideTag: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  flashBody: { fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  flashActions: { flexDirection: 'row', gap: 8 },
  flashBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  optBtn: { padding: 12, borderRadius: 14, borderWidth: 1.5 },
  explanation: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  textArea: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 999,
    marginTop: 4,
  },
  completeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
