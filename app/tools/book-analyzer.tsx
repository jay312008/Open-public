import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { askMollyAI, MollyChatReply } from '@/lib/aiGateway';

export default function BookAnalyzerScreen() {
  const { colors } = useTheme();
  const { consumeCredits } = useApp();
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedExcerpt, setPastedExcerpt] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MollyChatReply | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!res.canceled && res.assets[0]) {
      setFileName(res.assets[0].name);
      setAnalysis(null);
    }
  };

  const canAnalyze = Boolean(fileName || pastedExcerpt.trim().length > 10);

  const handleAnalyze = async () => {
    if (!canAnalyze || loading) return;
    setLoading(true);
    consumeCredits(2, `Book Analyzer: ${fileName ?? 'Pasted Notes'}`, 'analyzer');
    const prompt = [
      `Analyze this study document${fileName ? ` ("${fileName}")` : ''} and produce:`,
      '1) A concise summary of core concepts,',
      '2) Key definitions/formulas,',
      '3) 3 exam-style revision tips.',
      pastedExcerpt.trim()
        ? `\nExcerpt:\n${pastedExcerpt.trim().slice(0, 2000)}`
        : '\n(No raw text excerpt pasted; provide a structured study guide based on the title.)',
    ].join('\n');

    const res = await askMollyAI(prompt, 'Book & Document Analysis');
    setAnalysis(res.data);
    setSourceLabel(res.source === 'live-gateway' ? 'Live AI Gateway' : 'Offline Prototype');
    setLoading(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Book Analyzer" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.surfacePurpleSoft }]}>
              <Ionicons name="book-outline" size={30} color={colors.purple} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Book & Document Analyzer</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Upload a PDF/file or paste a chapter excerpt and let Molly break it into exam notes.
            </Text>
          </View>

          <AnimatedPressable
            onPress={pickDoc}
            style={[styles.uploadBox, { backgroundColor: colors.surface, borderColor: colors.purple }]}
          >
            <Ionicons name="cloud-upload-outline" size={32} color={colors.purple} />
            <Text style={[styles.uploadTitle, { color: colors.text }]}>
              {fileName ?? 'Upload Book / PDF'}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Tap to choose a file (PDF, DOC, or TXT)
            </Text>
          </AnimatedPressable>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Or Paste Chapter / Notes Excerpt</Text>
            <TextInput
              value={pastedExcerpt}
              onChangeText={setPastedExcerpt}
              placeholder="Paste paragraphs, definitions, or past paper text here for deeper analysis..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            />
          </View>

          <AnimatedPressable
            onPress={handleAnalyze}
            style={[styles.cta, { backgroundColor: canAnalyze ? colors.coral : colors.surfaceMuted }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.ctaText, { color: canAnalyze ? '#FFFFFF' : colors.textMuted }]}>
                Analyze with Molly (2 credits)
              </Text>
            )}
          </AnimatedPressable>

          {analysis && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, gap: 10 }]}>
              <View style={styles.resultHeader}>
                <Text style={[styles.resultTitle, { color: colors.text }]}>
                  {analysis.heading ?? 'Document Breakdown'}
                </Text>
                {sourceLabel && (
                  <View style={[styles.badge, { backgroundColor: colors.surfaceMint }]}>
                    <Text style={{ color: colors.mintDark, fontSize: 10.5, fontWeight: '800' }}>{sourceLabel}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 21 }}>{analysis.text}</Text>
              {analysis.steps?.map((st, idx) => (
                <View key={idx} style={[styles.stepRow, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={{ color: colors.purple, fontWeight: '800', fontSize: 13 }}>
                    {idx + 1}. {st.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{st.detail}</Text>
                </View>
              ))}
              {analysis.tip && (
                <View style={[styles.tipBox, { backgroundColor: colors.surfaceMint }]}>
                  <Text style={{ color: colors.mintDark, fontSize: 12.5, fontWeight: '700' }}>
                    💡 Tip: {analysis.tip}
                  </Text>
                </View>
              )}
              <AnimatedPressable
                onPress={() =>
                  router.push({
                    pathname: '/tools/ask-molly',
                    params: { prompt: `Quiz me on ${fileName ?? 'the notes I just analyzed'}` },
                  } as never)
                }
                style={[styles.followBtn, { backgroundColor: colors.mintDark }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 }}>
                  Ask Molly Follow-Up Questions
                </Text>
              </AnimatedPressable>
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
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  uploadTitle: { fontSize: 15.5, fontWeight: '800' },
  label: { fontSize: 13.5, fontWeight: '800', marginBottom: 8 },
  textarea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 13.5,
  },
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '800' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resultTitle: { fontSize: 16, fontWeight: '900', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  stepRow: { borderRadius: 12, padding: 10, gap: 3 },
  tipBox: { borderRadius: 12, padding: 10 },
  followBtn: { borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
});
