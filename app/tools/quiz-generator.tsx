import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { getCompanionById } from '@/constants/assets';
import { EssayGradeResult, generateQuizQuestions, gradeEssayAnswerAPI } from '@/lib/aiGateway';

const SAVED_QUIZZES_KEY = 'learnymol_saved_quizzes_v1';

type QuizViewMode = 'setup' | 'taking' | 'results';
type QuizFormat = 'MCQ' | 'Essay';
type AcademicLevel = 'O-Level' | 'A-Level' | 'University';
type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

interface QuizQuestionItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface SavedQuizPack {
  id: string;
  subject: string;
  topic: string;
  level: AcademicLevel;
  format: QuizFormat;
  difficulty: DifficultyLevel;
  count: number;
  createdAt: string;
  lastScore?: number;
  questions: QuizQuestionItem[];
}

export default function QuizGeneratorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, recordQuizCompletion, logStudyActivity } = useApp();
  const companion = getCompanionById(profile.companionId);

  const [viewMode, setViewMode] = useState<QuizViewMode>('setup');
  const [subject, setSubject] = useState('Physics');
  const [topic, setTopic] = useState('Waves and Optics');
  const [format, setFormat] = useState<QuizFormat>('MCQ');
  const [level, setLevel] = useState<AcademicLevel>('O-Level');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [count, setCount] = useState<number>(5);

  const [loading, setLoading] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuizPack[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<SavedQuizPack | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [essayGrades, setEssayGrades] = useState<Record<string, EssayGradeResult>>({});
  const [finalScorePct, setFinalScorePct] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_QUIZZES_KEY)
      .then((raw) => {
        if (raw) setSavedQuizzes(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const persistQuizzes = (next: SavedQuizPack[]) => {
    setSavedQuizzes(next);
    AsyncStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(next)).catch(() => {});
  };

  const handleGenerate = async () => {
    if (!subject.trim() || !topic.trim() || loading) return;
    setLoading(true);
    setMcqAnswers({});
    setEssayAnswers({});
    setEssayGrades({});
    try {
      const res = await generateQuizQuestions({
        subject: `${level} ${subject.trim()}`,
        topic: topic.trim(),
        count,
        difficulty,
      });
      const pack: SavedQuizPack = {
        id: `quiz-${Date.now()}`,
        subject: subject.trim(),
        topic: topic.trim(),
        level,
        format,
        difficulty,
        count: res.data.length,
        createdAt: new Date().toLocaleDateString(),
        questions: res.data,
      };
      setActiveQuiz(pack);
      persistQuizzes([pack, ...savedQuizzes].slice(0, 30));
      logStudyActivity(`Generated ${level} ${format} quiz (${res.data.length} Qs): ${subject} — ${topic}`);
      // Cleanly transition to the dedicated Quiz Taking view (setup disappears!)
      setViewMode('taking');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMCQ = () => {
    if (!activeQuiz) return;
    const right = activeQuiz.questions.filter((q) => mcqAnswers[q.id] === q.correctIndex).length;
    const pct = Math.round((right / Math.max(1, activeQuiz.questions.length)) * 100);
    setCorrectCount(right);
    setFinalScorePct(pct);
    recordQuizCompletion(`${activeQuiz.topic}-${Date.now()}`, pct, `${activeQuiz.subject}: ${activeQuiz.topic}`);
    persistQuizzes(savedQuizzes.map((sq) => (sq.id === activeQuiz.id ? { ...sq, lastScore: pct } : sq)));
    setViewMode('results');
  };

  const handleSubmitEssay = async () => {
    if (!activeQuiz || loading) return;
    setLoading(true);
    try {
      const grades: Record<string, EssayGradeResult> = {};
      let sum = 0;
      let passed = 0;
      for (const q of activeQuiz.questions) {
        const ans = (essayAnswers[q.id] ?? '').trim();
        if (!ans) {
          grades[q.id] = {
            score: 0,
            strengths: 'No answer written.',
            missing: 'Write a clear explanation to earn marks.',
            modelAnswer: q.explanation,
          };
          continue;
        }
        const g = await gradeEssayAnswerAPI({
          subject: `${activeQuiz.level} ${activeQuiz.subject}`,
          topic: `${activeQuiz.topic} — ${q.prompt}`,
          answer: ans,
        });
        grades[q.id] = g.data;
        sum += g.data.score;
        if (g.data.score >= 60) passed += 1;
      }
      const avg = Math.round(sum / Math.max(1, activeQuiz.questions.length));
      setEssayGrades(grades);
      setCorrectCount(passed);
      setFinalScorePct(avg);
      recordQuizCompletion(`${activeQuiz.topic}-${Date.now()}`, avg, `${activeQuiz.subject}: ${activeQuiz.topic} (Essay)`);
      persistQuizzes(savedQuizzes.map((sq) => (sq.id === activeQuiz.id ? { ...sq, lastScore: avg } : sq)));
      setViewMode('results');
    } finally {
      setLoading(false);
    }
  };

  const missedQuestions = activeQuiz
    ? activeQuiz.questions.filter((q) =>
        activeQuiz.format === 'MCQ'
          ? mcqAnswers[q.id] !== q.correctIndex
          : (essayGrades[q.id]?.score ?? 0) < 60
      )
    : [];

  const handleSendMissedToMolly = () => {
    if (!activeQuiz) return;
    const summaryLines =
      missedQuestions.length > 0
        ? missedQuestions
            .slice(0, 6)
            .map((q, idx) => {
              const userChoice =
                activeQuiz.format === 'MCQ'
                  ? q.options[mcqAnswers[q.id]] ?? 'No answer'
                  : essayAnswers[q.id] || 'No answer';
              const rightAns = activeQuiz.format === 'MCQ' ? q.options[q.correctIndex] : q.explanation;
              return `${idx + 1}) ${q.prompt}\n   My answer: ${userChoice}\n   Correct answer: ${rightAns}`;
            })
            .join('\n')
        : `I scored ${finalScorePct}% on ${activeQuiz.level} ${activeQuiz.subject} (${activeQuiz.topic}). Can you give me 2 harder challenge questions?`;

    const promptText =
      missedQuestions.length > 0
        ? `Molly, I just finished a ${activeQuiz.level} ${activeQuiz.subject} quiz on "${activeQuiz.topic}" and got ${correctCount}/${activeQuiz.questions.length} (${finalScorePct}%). Please explain these questions I missed clearly step by step so I understand them:\n\n${summaryLines}`
        : summaryLines;

    router.push({
      pathname: '/tools/ask-molly',
      params: { initialQuestion: promptText },
    } as never);
  };

  const answeredCount = activeQuiz
    ? activeQuiz.format === 'MCQ'
      ? Object.keys(mcqAnswers).length
      : Object.values(essayAnswers).filter((v) => v.trim().length > 0).length
    : 0;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader
          showBack
          title={
            viewMode === 'setup'
              ? 'Quiz Generator'
              : viewMode === 'taking'
                ? `${activeQuiz?.subject ?? 'Quiz'} (${activeQuiz?.questions.length ?? 0} Qs)`
                : 'Quiz Results'
          }
        />

        {/* STAGE 1: QUIZ SETUP VIEW */}
        {viewMode === 'setup' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Create a Custom Exam Quiz</Text>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Quiz Type</Text>
              <View style={styles.row}>
                {(['MCQ', 'Essay'] as const).map((f) => (
                  <AnimatedPressable
                    key={f}
                    onPress={() => setFormat(f)}
                    style={[styles.pill, { backgroundColor: format === f ? colors.purple : colors.surfaceMuted }]}
                  >
                    <Text style={{ color: format === f ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 13 }}>
                      {f === 'MCQ' ? 'Multiple Choice (MCQ)' : 'Written Essay'}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Academic Level</Text>
              <View style={styles.row}>
                {(['O-Level', 'A-Level', 'University'] as const).map((lvl) => (
                  <AnimatedPressable
                    key={lvl}
                    onPress={() => setLevel(lvl)}
                    style={[styles.pill, { backgroundColor: level === lvl ? colors.coral : colors.surfaceMuted }]}
                  >
                    <Text style={{ color: level === lvl ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12 }}>
                      {lvl}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Number of Questions</Text>
              <View style={styles.row}>
                {[5, 10, 15, 20].map((n) => (
                  <AnimatedPressable
                    key={n}
                    onPress={() => setCount(n)}
                    style={[styles.pill, { backgroundColor: count === n ? colors.mintDark : colors.surfaceMuted }]}
                  >
                    <Text style={{ color: count === n ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 13 }}>
                      {n}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty</Text>
              <View style={styles.row}>
                {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                  <AnimatedPressable
                    key={d}
                    onPress={() => setDifficulty(d)}
                    style={[styles.pill, { backgroundColor: difficulty === d ? colors.coral : colors.surfaceMuted }]}
                  >
                    <Text style={{ color: difficulty === d ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12 }}>
                      {d}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Subject & Topic</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject (e.g. Physics, Chemistry, Math)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="Topic (e.g. Chemical Bonding, Motion)"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
              />

              <AnimatedPressable onPress={handleGenerate} style={[styles.cta, { backgroundColor: colors.coral }]}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaText}>
                    Generate {count} {level} {format} Questions
                  </Text>
                )}
              </AnimatedPressable>
            </View>

            {savedQuizzes.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Saved Quizzes ({savedQuizzes.length})
                </Text>
                {savedQuizzes.map((sq) => (
                  <AnimatedPressable
                    key={sq.id}
                    onPress={() => {
                      setActiveQuiz(sq);
                      setMcqAnswers({});
                      setEssayAnswers({});
                      setEssayGrades({});
                      setViewMode('taking');
                    }}
                    style={[styles.savedRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '800' }}>
                        {sq.subject} — {sq.topic}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {sq.level} · {sq.format} · {sq.questions.length} Qs · {sq.difficulty} · {sq.createdAt}
                        {typeof sq.lastScore === 'number' ? ` · Last: ${sq.lastScore}%` : ''}
                      </Text>
                    </View>
                    <Ionicons name="play-circle" size={26} color={colors.coral} />
                  </AnimatedPressable>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* STAGE 2: CLEAN DEDICATED QUIZ TAKING PAGE (Setup disappears completely!) */}
        {viewMode === 'taking' && activeQuiz && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>
                  {activeQuiz.level} {activeQuiz.subject} — {activeQuiz.topic}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, marginTop: 2 }}>
                  Answered {answeredCount} of {activeQuiz.questions.length} · {activeQuiz.difficulty} {activeQuiz.format}
                </Text>
              </View>
              <AnimatedPressable
                onPress={() => setViewMode('setup')}
                style={[styles.smallBtn, { backgroundColor: colors.surfaceMuted }]}
              >
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>New Quiz</Text>
              </AnimatedPressable>
            </View>

            {activeQuiz.questions.map((q, qIdx) => (
              <View key={q.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.qText, { color: colors.text }]}>
                  {qIdx + 1}. {q.prompt}
                </Text>

                {activeQuiz.format === 'MCQ' ? (
                  q.options.map((opt, idx) => {
                    const selected = mcqAnswers[q.id] === idx;
                    return (
                      <AnimatedPressable
                        key={`${q.id}-${idx}`}
                        onPress={() => setMcqAnswers((p) => ({ ...p, [q.id]: idx }))}
                        style={[
                          styles.opt,
                          {
                            backgroundColor: selected ? colors.surfaceMint : colors.surfaceMuted,
                            borderColor: selected ? colors.mintDark : colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: selected ? '800' : '600' }}>
                          {opt}
                        </Text>
                      </AnimatedPressable>
                    );
                  })
                ) : (
                  <TextInput
                    value={essayAnswers[q.id] ?? ''}
                    onChangeText={(txt) => setEssayAnswers((p) => ({ ...p, [q.id]: txt }))}
                    placeholder="Write your full explanation here..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    style={[
                      styles.input,
                      { minHeight: 92, textAlignVertical: 'top', color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                    ]}
                  />
                )}
              </View>
            ))}

            <AnimatedPressable
              onPress={activeQuiz.format === 'MCQ' ? handleSubmitMCQ : handleSubmitEssay}
              style={[styles.cta, { backgroundColor: colors.mintDark }]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.ctaText}>
                  {activeQuiz.format === 'MCQ' ? 'Submit Quiz & See Results' : 'Submit Essays for AI Grading'}
                </Text>
              )}
            </AnimatedPressable>
          </ScrollView>
        )}

        {/* STAGE 3: HAPPY MOLLY CELEBRATION & RESULTS REVIEW PAGE */}
        {viewMode === 'results' && activeQuiz && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Happy Molly Celebration Card */}
            <View
              style={[
                styles.celebrationCard,
                {
                  backgroundColor: finalScorePct >= 60 ? colors.surfaceMint : colors.surfacePurpleSoft,
                  borderColor: finalScorePct >= 60 ? colors.mintDark : colors.purple,
                },
              ]}
            >
              <CompanionAvatar companionId={profile.companionId} size={96} />
              <Text
                style={{
                  color: finalScorePct >= 60 ? colors.mintDark : colors.purple,
                  fontSize: 23,
                  fontWeight: '900',
                  textAlign: 'center',
                }}
              >
                {finalScorePct >= 80
                  ? 'Hooray! Amazing Job! 🎉'
                  : finalScorePct >= 50
                    ? 'Great Effort! Keep Going! ⭐'
                    : `Good Try! ${companion.name} Has Your Back! 💪`}
              </Text>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center', lineHeight: 22 }}>
                {companion.name} says: You got{' '}
                <Text style={{ fontWeight: '900', color: colors.mintDark }}>
                  {correctCount} out of {activeQuiz.questions.length}
                </Text>{' '}
                right ({finalScorePct}%)!
                {missedQuestions.length > 0
                  ? ` Let's review the ${missedQuestions.length} question${missedQuestions.length > 1 ? 's' : ''} you missed below.`
                  : ' Perfect mastery — every single question nailed!'}
              </Text>
              <View style={styles.scoreRow}>
                <View style={[styles.scoreBadge, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.mintDark, fontSize: 18, fontWeight: '900' }}>✅ {correctCount}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>Correct</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.coral, fontSize: 18, fontWeight: '900' }}>❌ {missedQuestions.length}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>Missed</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.purple, fontSize: 18, fontWeight: '900' }}>{finalScorePct}%</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>Score</Text>
                </View>
              </View>
            </View>

            {/* Detailed Right vs Wrong Review */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Answer Breakdown</Text>
            {activeQuiz.questions.map((q, qIdx) => {
              const isRight =
                activeQuiz.format === 'MCQ'
                  ? mcqAnswers[q.id] === q.correctIndex
                  : (essayGrades[q.id]?.score ?? 0) >= 60;
              return (
                <View
                  key={q.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isRight ? colors.mintDark : colors.coral,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={isRight ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={isRight ? colors.mintDark : colors.coral}
                    />
                    <Text style={{ color: isRight ? colors.mintDark : colors.coral, fontSize: 12.5, fontWeight: '900' }}>
                      {isRight ? 'CORRECT' : 'MISSED — SEE RIGHT ANSWER BELOW'}
                    </Text>
                  </View>
                  <Text style={[styles.qText, { color: colors.text }]}>
                    {qIdx + 1}. {q.prompt}
                  </Text>

                  {activeQuiz.format === 'MCQ' ? (
                    <>
                      {!isRight && (
                        <Text style={{ color: colors.coral, fontSize: 13.5, fontWeight: '700' }}>
                          Your answer: {q.options[mcqAnswers[q.id]] ?? 'Not answered'}
                        </Text>
                      )}
                      <View style={[styles.rightBox, { backgroundColor: colors.surfaceMint }]}>
                        <Text style={{ color: colors.mintDark, fontSize: 14, fontWeight: '800' }}>
                          ✓ Correct Answer: {q.options[q.correctIndex]}
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 13.5, lineHeight: 20, marginTop: 3 }}>
                          {q.explanation}
                        </Text>
                      </View>
                    </>
                  ) : (
                    essayGrades[q.id] && (
                      <View style={[styles.rightBox, { backgroundColor: colors.surfaceMint }]}>
                        <Text style={{ color: colors.mintDark, fontSize: 14.5, fontWeight: '900' }}>
                          Score: {essayGrades[q.id].score}%
                        </Text>
                        <Text style={{ color: colors.text, fontSize: 13.5 }}>✅ {essayGrades[q.id].strengths}</Text>
                        <Text style={{ color: colors.text, fontSize: 13.5 }}>🎯 {essayGrades[q.id].missing}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                          📘 Model: {essayGrades[q.id].modelAnswer}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              );
            })}

            {/* Bottom Molly AI Chat Handoff for Missed Questions */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.purple }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Want Molly to Explain This Better?
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20 }}>
                {missedQuestions.length > 0
                  ? `Send the ${missedQuestions.length} question${missedQuestions.length > 1 ? 's' : ''} you missed straight to Molly AI Tutor for clear 1-on-1 step-by-step teaching.`
                  : 'Ask Molly for harder GCE/University challenge questions on this topic!'}
              </Text>
              <AnimatedPressable
                onPress={handleSendMissedToMolly}
                style={[styles.cta, { backgroundColor: colors.purple }]}
              >
                <Text style={styles.ctaText}>
                  {missedQuestions.length > 0
                    ? `✨ Explain My ${missedQuestions.length} Missed Questions with Molly`
                    : '✨ Practice Harder Questions with Molly'}
                </Text>
              </AnimatedPressable>
            </View>

            <View style={styles.row}>
              <AnimatedPressable
                onPress={() => {
                  setMcqAnswers({});
                  setEssayAnswers({});
                  setEssayGrades({});
                  setViewMode('taking');
                }}
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>Retake Quiz</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => setViewMode('setup')}
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: colors.coral, borderColor: colors.coral }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>Generate New Quiz</Text>
              </AnimatedPressable>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 46, gap: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  progressCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  sectionTitle: { fontSize: 16.5, fontWeight: '900' },
  label: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', paddingHorizontal: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 11, fontSize: 14.5, fontWeight: '600' },
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center', paddingHorizontal: 16 },
  ctaText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800', textAlign: 'center' },
  qText: { fontSize: 15.5, fontWeight: '800', lineHeight: 23 },
  opt: { padding: 12, borderRadius: 12, borderWidth: 1 },
  celebrationCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  scoreRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  scoreBadge: { flex: 1, borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 2 },
  rightBox: { borderRadius: 14, padding: 12, gap: 4 },
  secondaryBtn: { paddingVertical: 13, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
});
