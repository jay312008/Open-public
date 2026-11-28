import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ChatVisualWidget } from '@/components/chat/ChatVisualWidget';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { getCompanionById } from '@/constants/assets';
import {
  EssayGradeResult,
  GeneratedTopicNotes,
  generateFlashcardsAPI,
  generateTopicNotesAPI,
  gradeEssayAnswerAPI,
} from '@/lib/aiGateway';

const NOTES_KEY_PREFIX = '@learnymol_notes_v1:';
const CARDS_KEY_PREFIX = '@learnymol_flashcards_v1:';
const SAVED_NOTE_IDS_KEY = '@learnymol_saved_note_ids_v1';

async function persistLessonNotes(lessonId: string, blocks: GeneratedTopicNotes[]) {
  try {
    await AsyncStorage.setItem(`${NOTES_KEY_PREFIX}${lessonId}`, JSON.stringify(blocks));
    const rawIds = await AsyncStorage.getItem(SAVED_NOTE_IDS_KEY);
    const ids: string[] = rawIds ? JSON.parse(rawIds) : [];
    if (!ids.includes(lessonId)) {
      ids.push(lessonId);
      await AsyncStorage.setItem(SAVED_NOTE_IDS_KEY, JSON.stringify(ids));
    }
  } catch {
    // non-fatal storage error
  }
}

type LessonTab = 'notes' | 'flashcards' | 'exercise';

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { profile, subjects, completedLessonIds, completeJourneyLesson, logStudyActivity, consumeCredits } = useApp();
  const companion = getCompanionById(profile.companionId);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LessonTab>('notes');
  const [fontScale, setFontScale] = useState<number>(1);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<number[]>([]);
  const [exerciseAnswer, setExerciseAnswer] = useState('');

  const [aiNoteBlocks, setAiNoteBlocks] = useState<GeneratedTopicNotes[]>([]);
  const [notesRestoredFromSave, setNotesRestoredFromSave] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const initializedForId = useRef<string | null>(null);
  const [customFlashcards, setCustomFlashcards] = useState<{ front: string; back: string }[] | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [gradingEssay, setGradingEssay] = useState(false);
  const [essayGrade, setEssayGrade] = useState<EssayGradeResult | null>(null);

  const match = subjects
    .flatMap((s) =>
      s.topics.flatMap((t) => t.lessons.map((l) => ({ subject: s, topic: t, lesson: l })))
    )
    .find((item) => item.lesson.id === id);

  const defaultFlashcards = useMemo(() => {
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

  const flashcards = customFlashcards ?? defaultFlashcards;

  // Compute live total word count across all saved note chapters
  const totalWordCount = useMemo(() => {
    const allText = aiNoteBlocks
      .map((b) =>
        [
          b.title,
          b.introduction,
          ...(b.objectives ?? []),
          ...(b.keyTerms ?? []).map((k) => `${k.term} ${k.definition}`),
          ...(b.sections ?? []).map((s) => `${s.heading} ${s.body}`),
          b.workedExample ?? '',
          b.commonMistakes ?? '',
          b.examTip ?? '',
          ...(b.summaryPoints ?? []),
          ...(b.exercises ?? []).map((e) => `${e.question} ${e.solution}`),
        ].join(' ')
      )
      .join(' ')
      .trim();
    return allText ? allText.split(/\s+/).length : 0;
  }, [aiNoteBlocks]);

  // Load permanently saved notes & flashcards FIRST; only generate via AI if never generated before!
  useEffect(() => {
    if (!match) return;
    if (initializedForId.current === match.lesson.id) return;
    initializedForId.current = match.lesson.id;
    let cancelled = false;

    (async () => {
      try {
        const [savedNotesRaw, savedCardsRaw] = await Promise.all([
          AsyncStorage.getItem(`${NOTES_KEY_PREFIX}${match.lesson.id}`),
          AsyncStorage.getItem(`${CARDS_KEY_PREFIX}${match.lesson.id}`),
        ]);
        if (cancelled) return;

        if (savedCardsRaw) {
          const parsedCards = JSON.parse(savedCardsRaw);
          if (Array.isArray(parsedCards) && parsedCards.length > 0) {
            setCustomFlashcards(parsedCards);
          }
        }

        if (savedNotesRaw) {
          const parsedNotes = JSON.parse(savedNotesRaw);
          if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
            setAiNoteBlocks(parsedNotes);
            setNotesRestoredFromSave(true);
            setLoadingNotes(false);
            return;
          }
        }
      } catch {
        // fall through to generate
      }

      if (cancelled) return;
      setAiNoteBlocks([]);
      setNotesRestoredFromSave(false);
      setLoadingNotes(true);
      try {
        const res = await generateTopicNotesAPI({
          subject: match.subject.name,
          level: match.subject.level,
          topic:
            match.topic.title === match.lesson.title
              ? match.topic.title
              : `${match.topic.title}: ${match.lesson.title}`,
          mode: 'initial',
        });
        if (cancelled) return;
        const fresh = [res.data];
        setAiNoteBlocks(fresh);
        setNotesRestoredFromSave(true);
        await persistLessonNotes(match.lesson.id, fresh);
      } finally {
        if (!cancelled) setLoadingNotes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
  const currentCard = flashcards[cardIndex] ?? flashcards[0];

  const fs = (base: number) => Math.round(base * fontScale * 10) / 10;

  const handleComplete = () => {
    const res = completeJourneyLesson(lesson.id);
    logStudyActivity(`Completed lesson: ${subject.name} — ${lesson.title}`);
    if (res.alreadyCompleted) {
      Alert.alert('Already Completed', 'You already earned XP for this lesson.');
    } else {
      Alert.alert(
        'Lesson Complete',
        `You earned +${res.awardedXp} XP! Your Learning Journey road and stats have been updated.`
      );
    }
  };

  const handleGenerateNotes = async (mode: 'initial' | 'continue') => {
    if (loadingNotes) return;
    setLoadingNotes(true);
    consumeCredits(1, `AI Notes: ${lesson.title}`, 'ai-chat');
    logStudyActivity(`Generated AI Notes for ${subject.name} — ${lesson.title}`);
    const alreadyCovered =
      mode === 'continue'
        ? aiNoteBlocks.flatMap((b) => [b.title, ...b.sections.map((s) => s.heading)])
        : [];
    try {
      const res = await generateTopicNotesAPI({
        subject: subject.name,
        level: subject.level,
        topic: topic.title === lesson.title ? topic.title : `${topic.title}: ${lesson.title}`,
        mode,
        previousSections: alreadyCovered,
      });
      const updated = mode === 'initial' ? [res.data] : [...aiNoteBlocks, res.data];
      setAiNoteBlocks(updated);
      setNotesRestoredFromSave(true);
      await persistLessonNotes(lesson.id, updated);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleGenerateFlashcards = async (count: 10 | 20) => {
    if (loadingCards) return;
    setLoadingCards(true);
    consumeCredits(1, `AI Flashcards (${count}): ${topic.title}`, 'quiz');
    try {
      const res = await generateFlashcardsAPI({
        subject: subject.name,
        topic: `${topic.title} — ${lesson.title}`,
        count,
      });
      setCustomFlashcards(res.data);
      setCardIndex(0);
      setFlipped(false);
      setMasteredCards([]);
      try {
        await AsyncStorage.setItem(`${CARDS_KEY_PREFIX}${lesson.id}`, JSON.stringify(res.data));
      } catch {
        // non-fatal
      }
    } finally {
      setLoadingCards(false);
    }
  };

  const handleSubmitExercise = async () => {
    if (exerciseAnswer.trim().length < 10) {
      Alert.alert('Write a bit more', 'Enter at least a short explanation so Molly can mark it fairly.');
      return;
    }
    if (gradingEssay) return;
    setGradingEssay(true);
    consumeCredits(1, `AI Essay Grading: ${topic.title}`, 'quiz');
    logStudyActivity(`Submitted written exercise: ${subject.name} — ${topic.title}`);
    try {
      const res = await gradeEssayAnswerAPI({
        subject: subject.name,
        topic: `${topic.title} — ${lesson.title}`,
        answer: exerciseAnswer,
      });
      setEssayGrade(res.data);
    } finally {
      setGradingEssay(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title={subject.name} />

        {/* 3 Clean Mode Tabs + Student Reading Text-Size Controls (A- / Reset / A+) */}
        <View style={styles.topControls}>
          <View style={styles.tabRow}>
            {(
              [
                { id: 'notes', label: 'Notes', icon: 'document-text-outline' },
                { id: 'flashcards', label: `Cards (${flashcards.length})`, icon: 'albums-outline' },
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
                  <Text style={[styles.tabText, { color: active ? '#FFFFFF' : colors.text }]} numberOfLines={1}>
                    {t.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {activeTab === 'notes' && (
            <View style={styles.fontBar}>
              <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '700' }}>Reading Size:</Text>
              <AnimatedPressable
                onPress={() => setFontScale((s) => Math.max(0.85, Number((s - 0.1).toFixed(2))))}
                style={[styles.fontBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12 }}>A-</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => setFontScale(1)}
                style={[styles.fontBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 11.5 }}>Reset</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => setFontScale((s) => Math.min(1.4, Number((s + 0.1).toFixed(2))))}
                style={[styles.fontBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12.5 }}>A+</Text>
              </AnimatedPressable>
              {aiNoteBlocks.length > 0 && !loadingNotes && (
                <AnimatedPressable
                  onPress={() => handleGenerateNotes('initial')}
                  style={[styles.fontBtn, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }]}
                >
                  <Ionicons name="refresh" size={12} color={colors.purple} />
                  <Text style={{ color: colors.purple, fontWeight: '800', fontSize: 11.5 }}>Regenerate</Text>
                </AnimatedPressable>
              )}
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.tagRow}>
            <View style={[styles.pill, { backgroundColor: colors.surfaceMint }]}>
              <Text style={[styles.pillText, { color: colors.mintDark }]}>
                {subject.code ? `${subject.code} · ` : ''}{subject.level}
              </Text>
            </View>
            {notesRestoredFromSave && totalWordCount > 0 && (
              <View style={[styles.pill, { backgroundColor: colors.surfaceMint, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Ionicons name="checkmark-circle" size={13} color={colors.mintDark} />
                <Text style={[styles.pillText, { color: colors.mintDark }]}>
                  Saved · {totalWordCount.toLocaleString()} words
                </Text>
              </View>
            )}
            <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                {lesson.durationMinutes} min
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text, fontSize: fs(24), lineHeight: fs(31) }]}>
            {lesson.title}
          </Text>

          {activeTab === 'notes' && (
            <View style={{ gap: 18 }}>
              {loadingNotes && aiNoteBlocks.length === 0 && (
                <View style={styles.loadingBanner}>
                  <ActivityIndicator color={colors.purple} />
                  <Text style={{ color: colors.text, fontSize: fs(15), fontWeight: '700', flex: 1 }}>
                    {companion.name} is writing your complete textbook-length {subject.level} notes on {lesson.title}...
                  </Text>
                </View>
              )}

              {/* Open, Spacious Digital Textbook Flow (no cramped boxes around every paragraph!) */}
              {aiNoteBlocks.map((block, bIdx) => (
                <View key={bIdx} style={{ gap: 16 }}>
                  {bIdx > 0 && (
                    <View style={[styles.partDivider, { borderTopColor: colors.border }]}>
                      <Text style={{ color: colors.purple, fontSize: 12, fontWeight: '900', letterSpacing: 0.6 }}>
                        CONTINUATION — PART {bIdx + 1}: {block.title.toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {block.introduction ? (
                    <Text style={{ color: colors.text, fontSize: fs(16), lineHeight: fs(26) }}>
                      {block.introduction}
                    </Text>
                  ) : null}

                  {block.objectives && block.objectives.length > 0 && (
                    <View style={[styles.accentStrip, { borderLeftColor: colors.mintDark, backgroundColor: colors.surfaceMint }]}>
                      <Text style={{ color: colors.mintDark, fontSize: fs(13), fontWeight: '900', letterSpacing: 0.4 }}>
                        LEARNING OBJECTIVES
                      </Text>
                      {block.objectives.map((obj, idx) => (
                        <Text key={idx} style={{ color: colors.text, fontSize: fs(15), lineHeight: fs(23) }}>
                          • {obj}
                        </Text>
                      ))}
                    </View>
                  )}

                  {block.keyTerms && block.keyTerms.length > 0 && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: colors.purple, fontSize: fs(17), fontWeight: '900' }}>
                        Key Terms & Definitions
                      </Text>
                      {block.keyTerms.map((kt, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.termRow,
                            { backgroundColor: isDark ? 'rgba(139,92,246,0.14)' : 'rgba(139,92,246,0.07)' },
                          ]}
                        >
                          <Text style={{ color: colors.text, fontSize: fs(15.5), lineHeight: fs(24) }}>
                            <Text style={{ fontWeight: '900', color: colors.purple }}>{kt.term}: </Text>
                            {kt.definition}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Main Lesson Subtopics (open textbook flow) */}
                  {block.sections.map((sec, sIdx) => (
                    <View key={sIdx} style={{ gap: 6 }}>
                      <Text style={{ color: colors.text, fontSize: fs(18.5), fontWeight: '900', lineHeight: fs(25) }}>
                        {sec.heading}
                      </Text>
                      <Text style={{ color: colors.text, fontSize: fs(16), lineHeight: fs(26) }}>
                        {sec.body}
                      </Text>
                    </View>
                  ))}

                  {/* Interactive Canvas Diagrams / Graphs / Waves */}
                  {block.widgets && block.widgets.length > 0 && (
                    <View style={{ gap: 10 }}>
                      {block.widgets.map((w, wIdx) => (
                        <ChatVisualWidget key={`${bIdx}-w-${wIdx}`} widget={w} />
                      ))}
                    </View>
                  )}

                  {/* 9-Step Worked Example */}
                  {block.workedExample ? (
                    <View style={[styles.accentStrip, { borderLeftColor: colors.purple, backgroundColor: colors.surfacePurpleSoft }]}>
                      <Text style={{ color: colors.purple, fontSize: fs(13), fontWeight: '900', letterSpacing: 0.4 }}>
                        STEP-BY-STEP WORKED EXAMPLE
                      </Text>
                      <Text style={{ color: colors.text, fontSize: fs(15.5), lineHeight: fs(25) }}>
                        {block.workedExample}
                      </Text>
                    </View>
                  ) : null}

                  {/* Common Mistakes */}
                  {block.commonMistakes ? (
                    <View style={[styles.accentStrip, { borderLeftColor: colors.coral, backgroundColor: 'rgba(255,107,74,0.1)' }]}>
                      <Text style={{ color: colors.coral, fontSize: fs(13), fontWeight: '900', letterSpacing: 0.4 }}>
                        COMMON EXAM MISTAKES TO AVOID
                      </Text>
                      <Text style={{ color: colors.text, fontSize: fs(15), lineHeight: fs(23) }}>
                        {block.commonMistakes}
                      </Text>
                    </View>
                  ) : null}

                  {/* Revision Summary */}
                  {block.summaryPoints && block.summaryPoints.length > 0 && (
                    <View style={{ gap: 6 }}>
                      <Text style={{ color: colors.text, fontSize: fs(17), fontWeight: '900' }}>
                        Revision Summary
                      </Text>
                      {block.summaryPoints.map((sp, idx) => (
                        <Text key={idx} style={{ color: colors.text, fontSize: fs(15.5), lineHeight: fs(24) }}>
                          ✓ {sp}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Practice Exercises with Separate Revealable Solutions */}
                  {block.exercises && block.exercises.length > 0 && (
                    <View style={{ gap: 10 }}>
                      <Text style={{ color: colors.text, fontSize: fs(17), fontWeight: '900' }}>
                        Practice Exercises
                      </Text>
                      {block.exercises.map((ex, eIdx) => {
                        const key = `${bIdx}-${eIdx}`;
                        const shown = Boolean(revealedSolutions[key]);
                        return (
                          <View
                            key={key}
                            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          >
                            <Text style={{ color: colors.text, fontSize: fs(15.5), fontWeight: '700', lineHeight: fs(23) }}>
                              {eIdx + 1}. {ex.question}
                            </Text>
                            <AnimatedPressable
                              onPress={() => setRevealedSolutions((p) => ({ ...p, [key]: !p[key] }))}
                              style={[styles.revealBtn, { backgroundColor: colors.surfaceMint }]}
                            >
                              <Text style={{ color: colors.mintDark, fontSize: 12.5, fontWeight: '800' }}>
                                {shown ? 'Hide Solution' : 'Show Solution'}
                              </Text>
                            </AnimatedPressable>
                            {shown && (
                              <Text style={{ color: colors.text, fontSize: fs(15), lineHeight: fs(23) }}>
                                {ex.solution}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {block.examTip ? (
                    <View style={[styles.accentStrip, { borderLeftColor: colors.mintDark, backgroundColor: colors.surfaceMint }]}>
                      <Text style={{ color: colors.mintDark, fontSize: fs(14.5), fontWeight: '800', lineHeight: fs(22) }}>
                        💡 Examiner Tip: {block.examTip}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}

              {/* Continue Notes (Generate Next Part — No Repeats) */}
              <AnimatedPressable
                onPress={() => handleGenerateNotes(aiNoteBlocks.length === 0 ? 'initial' : 'continue')}
                style={[styles.aiBtn, { backgroundColor: colors.purple }]}
              >
                {loadingNotes ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    <Text style={styles.ctaText}>
                      {aiNoteBlocks.length === 0
                        ? 'Generate Classroom Lesson Notes'
                        : 'Continue — Generate Next Part (No Repeats)'}
                    </Text>
                  </>
                )}
              </AnimatedPressable>

              {/* Smooth flow: Notes -> Exercises -> Flashcards */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AnimatedPressable
                  onPress={() => setActiveTab('exercise')}
                  style={[styles.deckBtn, { backgroundColor: colors.surface, borderColor: colors.coral }]}
                >
                  <Text style={{ color: colors.coral, fontSize: 13, fontWeight: '800' }}>
                    ✏️ Written Exercise
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={() => setActiveTab('flashcards')}
                  style={[styles.deckBtn, { backgroundColor: colors.surface, borderColor: colors.mintDark }]}
                >
                  <Text style={{ color: colors.mintDark, fontSize: 13, fontWeight: '800' }}>
                    🃏 Study Flashcards
                  </Text>
                </AnimatedPressable>
              </View>

              <AnimatedPressable
                onPress={() =>
                  router.push({
                    pathname: '/tools/ask-molly',
                    params: {
                      initialQuestion: `Explain "${lesson.title}" (${subject.level} ${subject.name}) with a worked example.`,
                    },
                  })
                }
                style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.coral} />
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>
                  Ask Molly About This Topic
                </Text>
              </AnimatedPressable>
            </View>
          )}

          {activeTab === 'flashcards' && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([10, 20] as const).map((cnt) => (
                  <AnimatedPressable
                    key={cnt}
                    onPress={() => handleGenerateFlashcards(cnt)}
                    style={[
                      styles.deckBtn,
                      { backgroundColor: colors.surfacePurpleSoft, borderColor: colors.purple },
                    ]}
                  >
                    {loadingCards ? (
                      <ActivityIndicator size="small" color={colors.purple} />
                    ) : (
                      <Text style={{ color: colors.purple, fontSize: 12.5, fontWeight: '800' }}>
                        ✨ Generate {cnt} AI Cards
                      </Text>
                    )}
                  </AnimatedPressable>
                ))}
              </View>

              {currentCard && (
                <>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700' }}>
                    Card {cardIndex + 1} of {flashcards.length} · Mastered {masteredCards.length}/{flashcards.length}
                  </Text>
                  <AnimatedPressable
                    onPress={() => setFlipped((f) => !f)}
                    style={[
                      styles.flashcard,
                      {
                        backgroundColor: flipped ? colors.surfaceMint : colors.surface,
                        borderColor: flipped ? colors.mintDark : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: flipped ? colors.mintDark : colors.purple, fontSize: 11.5, fontWeight: '800' }}>
                      {flipped ? 'ANSWER — TAP TO FLIP' : 'QUESTION — TAP TO REVEAL'}
                    </Text>
                    <Text style={[styles.flashcardText, { color: colors.text }]}>
                      {flipped ? currentCard.back : currentCard.front}
                    </Text>
                  </AnimatedPressable>

                  <View style={styles.cardControls}>
                    <AnimatedPressable
                      onPress={() => {
                        setFlipped(false);
                        setCardIndex((i) => Math.max(0, i - 1));
                      }}
                      style={[styles.ctrlBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>← Prev</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                      onPress={() => {
                        if (!masteredCards.includes(cardIndex)) {
                          setMasteredCards((prev) => [...prev, cardIndex]);
                        }
                        setFlipped(false);
                        setCardIndex((i) => (i + 1) % flashcards.length);
                      }}
                      style={[styles.ctrlBtn, { backgroundColor: colors.mintDark, borderColor: colors.mintDark }]}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Got It ✓</Text>
                    </AnimatedPressable>
                    <AnimatedPressable
                      onPress={() => {
                        setFlipped(false);
                        setCardIndex((i) => (i + 1) % flashcards.length);
                      }}
                      style={[styles.ctrlBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13 }}>Next →</Text>
                    </AnimatedPressable>
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === 'exercise' && (
            <>
              {lesson.practiceQuestion && (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Check (Free MCQ)</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14.5 }}>
                    {lesson.practiceQuestion.prompt}
                  </Text>
                  <View style={{ gap: 8, marginTop: 6 }}>
                    {lesson.practiceQuestion.options.map((opt, idx) => {
                      const picked = selectedOption === idx;
                      const isRight = idx === lesson.practiceQuestion!.correctIndex;
                      const bg =
                        selectedOption === null
                          ? colors.surfaceMuted
                          : isRight
                            ? colors.surfaceMint
                            : picked
                              ? '#FFE4E6'
                              : colors.surfaceMuted;
                      return (
                        <AnimatedPressable
                          key={opt}
                          onPress={() => setSelectedOption(idx)}
                          style={[styles.optBtn, { backgroundColor: bg }]}
                        >
                          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{opt}</Text>
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                  {selectedOption !== null && (
                    <Text style={{ color: colors.mintDark, fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                      {lesson.practiceQuestion.explanation}
                    </Text>
                  )}
                </View>
              )}

              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Written Exercise (AI Examiner Grading)
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  Explain "{lesson.title}" in your own words or work through an exam example below:
                </Text>
                <TextInput
                  value={exerciseAnswer}
                  onChangeText={setExerciseAnswer}
                  placeholder="Write your explanation or worked solution..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={[
                    styles.textArea,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                  ]}
                />
                <AnimatedPressable
                  onPress={handleSubmitExercise}
                  style={[styles.aiBtn, { backgroundColor: colors.coral }]}
                >
                  {gradingEssay ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.ctaText}>Grade My Written Answer with AI</Text>
                  )}
                </AnimatedPressable>

                {essayGrade && (
                  <View style={[styles.gradeBox, { backgroundColor: colors.surfaceMint, borderColor: colors.mintDark }]}>
                    <Text style={{ color: colors.mintDark, fontSize: 17, fontWeight: '900' }}>
                      Score: {essayGrade.score}%
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
                      ✅ <Text style={{ fontWeight: '800' }}>Strengths:</Text> {essayGrade.strengths}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>
                      🎯 <Text style={{ fontWeight: '800' }}>To Improve:</Text> {essayGrade.missing}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20 }}>
                      📘 <Text style={{ fontWeight: '800' }}>Model Answer:</Text> {essayGrade.modelAnswer}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          <AnimatedPressable
            onPress={handleComplete}
            style={[
              styles.completeBtn,
              { backgroundColor: isCompleted ? colors.surfaceMint : colors.mintDark },
            ]}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-done' : 'star'}
              size={18}
              color={isCompleted ? colors.mintDark : '#FFFFFF'}
            />
            <Text style={[styles.ctaText, { color: isCompleted ? colors.mintDark : '#FFFFFF' }]}>
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
  topControls: { paddingHorizontal: 18, paddingBottom: 8, gap: 8 },
  tabRow: { flexDirection: 'row', gap: 8 },
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
  tabText: { fontSize: 12.5, fontWeight: '800' },
  fontBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fontBtn: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 46, gap: 14 },
  tagRow: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '800' },
  title: { fontWeight: '900', letterSpacing: -0.3 },
  loadingBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  partDivider: { borderTopWidth: 1, paddingTop: 14 },
  accentStrip: { borderLeftWidth: 4, borderRadius: 12, padding: 14, gap: 6 },
  termRow: { borderRadius: 12, padding: 12 },
  card: { borderRadius: 18, borderWidth: 1, padding: 15, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  revealBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  deckBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashcard: {
    minHeight: 200,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  flashcardText: { fontSize: 17.5, fontWeight: '800', textAlign: 'center', lineHeight: 25 },
  cardControls: { flexDirection: 'row', gap: 8 },
  ctrlBtn: { flex: 1, paddingVertical: 11, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
  optBtn: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 12 },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 96,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  gradeBox: { borderRadius: 16, borderWidth: 1, padding: 13, gap: 6 },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
  },
  ctaText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
});
