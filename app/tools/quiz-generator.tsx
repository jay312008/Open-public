import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { generateQuizQuestions } from '@/lib/aiGateway';

export default function QuizGeneratorScreen() {
  const { colors } = useTheme();
  const { recordQuizCompletion } = useApp();
  const [subject, setSubject] = useState('Chemistry');
  const [topic, setTopic] = useState('Chemical Bonding');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questions, setQuestions] = useState<
    { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string }[]
  >([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleGenerate = async () => {
    setSubmitted(false);
    setAnswers({});
    const res = await generateQuizQuestions({ subject, topic, count: 3, difficulty });
    setQuestions(res.data);
  };

  const handleSubmit = () => {
    if (questions.length === 0) return;
    const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
    const pct = Math.round((correct / questions.length) * 100);
    setSubmitted(true);
    recordQuizCompletion(`${topic}-${Date.now()}`, pct);
    Alert.alert('Quiz Submitted!', `Score: ${correct}/${questions.length} (${pct}%). XP awarded!`);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Quiz Generator" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.surfacePurpleSoft }]}>
              <Ionicons name="checkbox-outline" size={30} color={colors.purple} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Quiz Generator</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Create a custom quiz from any topic and earn XP.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Subject</Text>
            <TextInput value={subject} onChangeText={setSubject} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Topic</Text>
            <TextInput value={topic} onChangeText={setTopic} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Difficulty</Text>
            <TextInput value={difficulty} onChangeText={setDifficulty} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
          </View>

          <AnimatedPressable onPress={handleGenerate} style={[styles.cta, { backgroundColor: colors.coral }]}>
            <Text style={styles.ctaText}>Generate Quiz</Text>
          </AnimatedPressable>

          {questions.map((q, qIdx) => (
            <View key={q.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.qText, { color: colors.text }]}>
                {qIdx + 1}. {q.prompt}
              </Text>
              {q.options.map((opt, idx) => {
                const selected = answers[q.id] === idx;
                return (
                  <AnimatedPressable
                    key={opt}
                    onPress={() => !submitted && setAnswers((p) => ({ ...p, [q.id]: idx }))}
                    style={[
                      styles.opt,
                      {
                        backgroundColor: selected ? colors.surfaceMint : colors.surfaceMuted,
                        borderColor: selected ? colors.mint : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.text, fontSize: 13 }}>{opt}</Text>
                  </AnimatedPressable>
                );
              })}
              {submitted && (
                <Text style={{ color: colors.mintDark, fontSize: 12.5, fontWeight: '700' }}>
                  {q.explanation}
                </Text>
              )}
            </View>
          ))}

          {questions.length > 0 && !submitted && (
            <AnimatedPressable onPress={handleSubmit} style={[styles.cta, { backgroundColor: colors.mint }]}>
              <Text style={styles.ctaText}>Submit Answers</Text>
            </AnimatedPressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  hero: { alignItems: 'center', gap: 6 },
  heroIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
  sub: { fontSize: 13, textAlign: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 8 },
  label: { fontSize: 11.5, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 14, fontWeight: '600' },
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  qText: { fontSize: 14.5, fontWeight: '800' },
  opt: { padding: 11, borderRadius: 12, borderWidth: 1 },
});
