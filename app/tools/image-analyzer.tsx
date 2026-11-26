import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';

export default function ImageAnalyzerScreen() {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Image Analyzer" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { backgroundColor: colors.surfaceMint }]}>
              <Ionicons name="image-outline" size={30} color={colors.mintDark} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Image Analyzer</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              Understand diagrams, exam questions, or handwritten notes.
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

          <AnimatedPressable
            onPress={() =>
              imageUri &&
              setResult(
                'Image queued for analysis. Connect EXPO_PUBLIC_AI_GATEWAY_URL with a vision-capable model to extract equations and solve diagrams automatically.'
              )
            }
            style={[styles.cta, { backgroundColor: imageUri ? colors.coral : colors.surfaceMuted }]}
          >
            <Text style={{ color: imageUri ? '#FFFFFF' : colors.textMuted, fontSize: 15, fontWeight: '800' }}>
              Analyze Image
            </Text>
          </AnimatedPressable>

          {result && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{result}</Text>
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
  cta: { paddingVertical: 14, borderRadius: 999, alignItems: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
});
