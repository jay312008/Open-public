import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function SubjectGeneratorScreen() {
  const { colors } = useTheme();
  const { subjects, addCustomTopic } = useApp();
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? 'math');
  const [topic, setTopic] = useState('Linear Equations');

  const handleGenerate = () => {
    if (!topic.trim()) return;
    addCustomTopic(subjectId, topic.trim(), 'AI-generated structured lessons, examples, and review.');
    Alert.alert('Topic Generated!', `"${topic.trim()}" has been added to My Subjects.`);
    router.push('/(tabs)/subjects');
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Subject Generator" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.surfaceCoralSoft }]}>
              <Ionicons name="rocket-outline" size={30} color={colors.coral} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Subject Generator</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Create structured lessons, worked examples, and practice for any topic.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Subject</Text>
            <View style={styles.chipRow}>
              {subjects.map((s) => (
                <AnimatedPressable
                  key={s.id}
                  onPress={() => setSubjectId(s.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: subjectId === s.id ? colors.coral : colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={{ color: subjectId === s.id ? '#FFFFFF' : colors.text, fontWeight: '700', fontSize: 12.5 }}>
                    {s.name}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>Topic</Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
          </View>

          <AnimatedPressable onPress={handleGenerate} style={[styles.cta, { backgroundColor: colors.coral }]}>
            <Text style={styles.ctaText}>Generate Material ✨</Text>
          </AnimatedPressable>
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
  title: { fontSize: 21, fontWeight: '900' },
  sub: { fontSize: 13, textAlign: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  label: { fontSize: 11.5, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 14, fontWeight: '600' },
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
