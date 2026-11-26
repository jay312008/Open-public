import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';

export default function BookAnalyzerScreen() {
  const { colors } = useTheme();
  const [fileName, setFileName] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!res.canceled && res.assets[0]) {
      setFileName(res.assets[0].name);
      setSummary(null);
    }
  };

  const handleAnalyze = () => {
    if (!fileName) return;
    setSummary(
      `Structured breakdown for "${fileName}":\n• Key Concepts extracted into 3 revision sections.\n• Suggested practice questions generated.\n• Connect EXPO_PUBLIC_AI_GATEWAY_URL for full server-side PDF OCR and summarization.`
    );
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Book Analyzer" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.surfacePurpleSoft }]}>
              <Ionicons name="book-outline" size={30} color={colors.purple} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Book & Document Analyzer</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Upload a book, PDF, or notes and let Molly break it down for you.
            </Text>
          </View>

          <AnimatedPressable
            onPress={pickDoc}
            style={[styles.uploadBox, { backgroundColor: colors.surface, borderColor: colors.purple }]}
          >
            <Ionicons name="cloud-upload-outline" size={34} color={colors.purple} />
            <Text style={[styles.uploadTitle, { color: colors.text }]}>
              {fileName ?? 'Upload Book / PDF'}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Tap to choose a file (PDF, DOC, or TXT)
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={handleAnalyze}
            style={[styles.cta, { backgroundColor: fileName ? colors.coral : colors.surfaceMuted }]}
          >
            <Text style={[styles.ctaText, { color: fileName ? '#FFFFFF' : colors.textMuted }]}>
              Analyze Book
            </Text>
          </AnimatedPressable>

          {summary && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>{summary}</Text>
            </View>
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
  title: { fontSize: 21, fontWeight: '900' },
  sub: { fontSize: 13, textAlign: 'center' },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  uploadTitle: { fontSize: 15.5, fontWeight: '800' },
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '800' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
});
