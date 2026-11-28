import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { EssayGradeResult, generateQuizQuestions, gradeEssayAnswerAPI } from '@/lib/aiGateway';

const SAVED_QUIZZES_KEY = 'learnymol_saved_quizzes_v1';

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
  const { recordQuizCompletion, logStudyActivity } = useApp();

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
  const [submitted, setSubmitted] = useState(false);

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
    setSubmitted(false);
    setMcqAnswers({});
    setEssayAnswers({});
    setEssayGrades({});
    try {
      const res = await generateQuizQuestions({
        subject: `${level} ${subject.trim()}`,
        topic: `${topic.trim()} (${format} format)`,
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
      logStudyActivity(`Generated ${level} ${format} quiz: ${subject} — ${topic}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMCQ = () => {
    if (!activeQuiz) return;
    const correct = activeQuiz.questions.filter((q) => mcqAnswers[q.id] === q.correctIndex).length;
    const pct = Math.round((correct / Math.max(1, activeQuiz.questions.length)) * 100);
    setSubmitted(true);
    recordQuizCompletion(`${activeQuiz.topic}-${Date.now()}`, pct, `${activeQuiz.subject}: ${activeQuiz.topic}`);
    persistQuizzes(savedQuizzes.map((sq) => (sq.id === activeQuiz.id ? { ...sq, lastScore: pct } : sq)));
    Alert.alert('Quiz Graded!', `Score: ${correct}/${activeQuiz.questions.length} (${pct}%). Saved & XP awarded!`);
  };

  const handleSubmitEssay = async () => {
    if (!activeQuiz || loading) return;
    setLoading(true);
    try {
      const grades: Record<string, EssayGradeResult> = {};
      let sum = 0;
      for (const q of activeQuiz.questions) {
        const ans = (essayAnswers[q.id] ?? '').trim();
        if (!ans) {
          grades[q.id] = {
            score: 0,
            strengths: 'No answer written yet.',
            missing: 'Write a clear explanation to receive marks.',
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
      }
      const avg = Math.round(sum / Math.max(1, activeQuiz.questions.length));
      setEssayGrades(grades);
      setSubmitted(true);
      recordQuizCompletion(`${activeQuiz.topic}-${Date.now()}`, avg, `${activeQuiz.subject}: ${activeQuiz.topic} (Essay)`);
      persistQuizzes(savedQuizzes.map((sq) => (sq.id === activeQuiz.id ? { ...sq, lastScore: avg } : sq)));
      Alert.alert('Essay Graded by Molly!', `Average Score: ${avg}%. Saved to your quiz history!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Quiz Generator" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Configuration Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Build Custom Exam Quiz</Text>

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
                  <Text style={{ color: count === n ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12.5 }}>
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
              placeholder="Topic (e.g. Chemical Bonding, Calculus)"
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

          {/* Active Quiz Workspace */}
          {activeQuiz && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {activeQuiz.level} {activeQuiz.subject} — {activeQuiz.topic} ({activeQuiz.format})
              </Text>
              {activeQuiz.questions.map((q, qIdx) => (
                <View key={q.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.qText, { color: colors.text }]}>
                    {qIdx + 1}. {q.prompt}
                  </Text>

                  {activeQuiz.format === 'MCQ' ? (
                    <>
                      {q.options.map((opt, idx) => {
                        const selected = mcqAnswers[q.id] === idx;
                        const isRight = idx === q.correctIndex;
                        const bg = !submitted
                          ? selected
                            ? colors.surfaceMint
                            : colors.surfaceMuted
                          : isRight
                            ? colors.surfaceMint
                            : selected
                              ? '#FFE4E6'
                              : colors.surfaceMuted;
                        return (
                          <AnimatedPressable
                            key={opt}
                            onPress={() => !submitted && setMcqAnswers((p) => ({ ...p, [q.id]: idx }))}
                            style={[styles.opt, { backgroundColor: bg, borderColor: selected ? colors.mintDark : colors.border }]}
                          >
                            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{opt}</Text>
                          </AnimatedPressable>
                        );
                      })}
                      {submitted && (
                        <Text style={{ color: colors.mintDark, fontSize: 13, fontWeight: '700' }}>
                          ✓ {q.explanation}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <TextInput
                        value={essayAnswers[q.id] ?? ''}
                        onChangeText={(txt) => setEssayAnswers((p) => ({ ...p, [q.id]: txt }))}
                        placeholder="Write your full explanation here..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        editable={!submitted}
                        style={[
                          styles.input,
                          { minHeight: 86, textAlignVertical: 'top', color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
                        ]}
                      />
                      {essayGrades[q.id] && (
                        <View style={[styles.gradeBox, { backgroundColor: colors.surfaceMint }]}>
                          <Text style={{ color: colors.mintDark, fontWeight: '900', fontSize: 15 }}>
                            Score: {essayGrades[q.id].score}%
                          </Text>
                          <Text style={{ color: colors.text, fontSize: 13 }}>✅ {essayGrades[q.id].strengths}</Text>
                          <Text style={{ color: colors.text, fontSize: 13 }}>🎯 {essayGrades[q.id].missing}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                            📘 Model: {essayGrades[q.id].modelAnswer}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}

              {!submitted && (
                <AnimatedPressable
                  onPress={activeQuiz.format === 'MCQ' ? handleSubmitMCQ : handleSubmitEssay}
                  style={[styles.cta, { backgroundColor: colors.mintDark }]}
                >
                  <Text style={styles.ctaText}>
                    {activeQuiz.format === 'MCQ' ? 'Submit & Grade MCQ' : 'Grade Written Essays with AI'}
                  </Text>
                </AnimatedPressable>
              )}
            </View>
          )}

          {/* Permanently Saved Generated Quizzes */}
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
                    setSubmitted(false);
                    setMcqAnswers({});
                    setEssayAnswers({});
                    setEssayGrades({});
                  }}
                  style={[styles.savedRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '800' }}>
                      {sq.subject} — {sq.topic}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {sq.level} · {sq.format} · {sq.count} Qs · {sq.difficulty} · {sq.createdAt}
                      {typeof sq.lastScore === 'number' ? ` · Last: ${sq.lastScore}%` : ''}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={24} color={colors.coral} />
                </AnimatedPressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 44, gap: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  sectionTitle: { fontSize: 16.5, fontWeight: '900' },
  label: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 6 },
  pill: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center', paddingHorizontal: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 11, fontSize: 14.5, fontWeight: '600' },
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  qText: { fontSize: 15.5, fontWeight: '800', lineHeight: 22 },
  opt: { padding: 12, borderRadius: 12, borderWidth: 1 },
  gradeBox: { borderRadius: 14, padding: 12, gap: 4 },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 13,
  },
});
