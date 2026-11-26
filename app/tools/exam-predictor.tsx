import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { generateExamPredictions } from '@/lib/aiGateway';

export default function ExamPredictorScreen() {
  const { colors } = useTheme();
  const [examType, setExamType] = useState('GCE O-Level');
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Quadratic Equations');
  const [results, setResults] = useState<
    { id: string; question: string; probability: 'High' | 'Medium'; markingTip: string }[]
  >([]);

  const handlePredict = async () => {
    const res = await generateExamPredictions({ examType, subject, topic });
    setResults(res.data);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Exam Predictor" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.surfaceCoralSoft }]}>
              <Ionicons name="radio-button-on" size={30} color={colors.coral} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Exam Predictor</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Get likely exam-style questions and marking tips for what matters most.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Exam Type</Text>
            <TextInput value={examType} onChangeText={setExamType} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Subject</Text>
            <TextInput value={subject} onChangeText={setSubject} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Topic</Text>
            <TextInput value={topic} onChangeText={setTopic} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
          </View>

          <AnimatedPressable onPress={handlePredict} style={[styles.cta, { backgroundColor: colors.coral }]}>
            <Text style={styles.ctaText}>Predict Questions ✨</Text>
          </AnimatedPressable>

          {results.map((r) => (
            <View key={r.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.pill, { backgroundColor: colors.surfaceCoralSoft }]}>
                <Text style={[styles.pillText, { color: colors.coral }]}>{r.probability} Likelihood</Text>
              </View>
              <Text style={[styles.qText, { color: colors.text }]}>{r.question}</Text>
              <Text style={[styles.tipText, { color: colors.mintDark }]}>Tip: {r.markingTip}</Text>
            </View>
          ))}
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
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '800' },
  qText: { fontSize: 14.5, fontWeight: '700', lineHeight: 20 },
  tipText: { fontSize: 12.5, lineHeight: 18 },
});
