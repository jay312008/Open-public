import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { askMollyAI, MollyChatReply } from '@/lib/aiGateway';

export default function ImageAnalyzerScreen() {
  const { colors } = useTheme();
  const { consumeCredits } = useApp();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [questionNote, setQuestionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MollyChatReply | null>(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setAnalysis(null);
    }
  };

  const canAnalyze = Boolean(imageUri && questionNote.trim().length > 0) || Boolean(imageUri);

  const handleAnalyze = async () => {
    if (!imageUri || loading) return;
    setLoading(true);
    consumeCredits(2, 'Image & Diagram Analyzer', 'analyzer');
    const prompt = questionNote.trim()
      ? `The student uploaded a study photo/diagram and asked: "${questionNote.trim()}". Provide a clear step-by-step explanation and relevant formula/diagram.`
      : 'The student uploaded a study diagram or exam question photo. Explain clearly how to break down and solve a science/math diagram step-by-step, and remind them to type the equation or label from the photo for exact calculations until vision OCR is enabled on the gateway.';
    const res = await askMollyAI(prompt, 'Image & Diagram Analysis');
    setAnalysis(res.data);
    setLoading(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Image Analyzer" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.surfaceMint }]}>
              <Ionicons name="image-outline" size={30} color={colors.mintDark} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Image Analyzer</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Upload a diagram, exam question, or handwritten note and add what you want Molly to solve.
            </Text>
          </View>

          <AnimatedPressable
            onPress={pickImage}
            style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.img} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
                <Ionicons name="camera-outline" size={34} color={colors.mintDark} />
                <Text style={{ color: colors.text, fontWeight: '700' }}>Select Diagram or Photo</Text>
              </View>
            )}
          </AnimatedPressable>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>What is in the image / what should Molly solve?</Text>
            <TextInput
              value={questionNote}
              onChangeText={setQuestionNote}
              placeholder="e.g. Solve 2x^2 - 5x + 2 = 0 from my worksheet, or explain this circuit diagram"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            />
          </View>

          <AnimatedPressable
            onPress={handleAnalyze}
            style={[styles.cta, { backgroundColor: canAnalyze ? colors.coral : colors.surfaceMuted }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: canAnalyze ? '#FFFFFF' : colors.textMuted, fontSize: 15, fontWeight: '800' }}>
                Analyze Image (2 credits)
              </Text>
            )}
          </AnimatedPressable>

          {analysis && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, gap: 10 }]}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
                {analysis.heading ?? 'Image Breakdown'}
              </Text>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{analysis.text}</Text>
              {analysis.steps?.map((st, idx) => (
                <View key={idx} style={[styles.stepRow, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={{ color: colors.mintDark, fontWeight: '800', fontSize: 13 }}>
                    {idx + 1}. {st.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{st.detail}</Text>
                </View>
              ))}
              <AnimatedPressable
                onPress={() =>
                  router.push({
                    pathname: '/tools/ask-molly',
                    params: { prompt: questionNote.trim() || 'Explain this diagram further' },
                  } as never)
                }
                style={[styles.followBtn, { backgroundColor: colors.mintDark }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 }}>
                  Continue in Ask Molly
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
  box: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  img: { width: '100%', height: 220 },
  label: { fontSize: 13.5, fontWeight: '800', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 74,
    textAlignVertical: 'top',
    fontSize: 13.5,
  },
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  stepRow: { borderRadius: 12, padding: 10, gap: 3 },
  followBtn: { borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
});
