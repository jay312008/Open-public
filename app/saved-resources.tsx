import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function SavedResourcesScreen() {
  const { colors } = useTheme();
  const { conversations } = useApp();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Saved Resources" />
        <ScrollView contentContainerStyle={styles.scroll}>
          {conversations.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="bookmark-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.title, { color: colors.text }]}>No saved sessions yet</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                Conversations with Molly AI Tutor and saved Live Teacher lessons will appear here.
              </Text>
            </View>
          ) : (
            conversations.map((c) => (
              <View key={c.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{c.title}</Text>
                <Text style={[styles.sub, { color: colors.textSecondary }]}>
                  {c.tool === 'live-teacher' ? 'Live Teacher' : 'Ask Molly'} · {c.messages.length} messages · {c.updatedAt}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 12 },
  empty: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 8 },
  card: { borderRadius: 18, borderWidth: 1, padding: 15, gap: 4 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12.5, textAlign: 'center' },
});
