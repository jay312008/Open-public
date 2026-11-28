import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

type FilterTab = 'all' | 'ask-molly' | 'live-teacher' | 'quizzes';

export default function SavedResourcesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { conversations, quizHistory, learningMemory } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const q = query.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    if (filter === 'quizzes') return [];
    return conversations.filter((c) => {
      if (filter !== 'all' && c.tool !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.subject ?? '').toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
      );
    });
  }, [conversations, filter, q]);

  const filteredQuizzes = useMemo(() => {
    if (filter !== 'all' && filter !== 'quizzes') return [];
    return quizHistory.filter((item) => !q || item.title.toLowerCase().includes(q));
  }, [quizHistory, filter, q]);

  const isEmpty = filteredConversations.length === 0 && filteredQuizzes.length === 0;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Saved & History" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Knowledge Gap Radar (Master Blueprint Part 29.5) */}
          <View style={[styles.radarCard, { backgroundColor: colors.surface, borderColor: colors.coral }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="pulse" size={19} color={colors.coral} />
              <Text style={[styles.title, { color: colors.text }]}>Knowledge Gap Radar</Text>
            </View>
            {learningMemory.weakTopics.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 18 }}>
                No weak spots flagged yet! Complete quizzes and exercises — Molly will automatically highlight topics you should revise here.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {learningMemory.weakTopics.map((topic) => (
                  <AnimatedPressable
                    key={topic}
                    onPress={() =>
                      router.push({
                        pathname: '/tools/ask-molly',
                        params: {
                          initialQuestion: `Help me master my weak topic "${topic}" step by step with a quick check question.`,
                        },
                      })
                    }
                    style={[styles.radarChip, { backgroundColor: 'rgba(255, 107, 74, 0.14)' }]}
                  >
                    <Text style={{ color: colors.coral, fontSize: 12, fontWeight: '800' }}>
                      🎯 Fix: {topic}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            )}
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search saved chats, boards & quizzes..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {query.length > 0 && (
              <AnimatedPressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </AnimatedPressable>
            )}
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'ask-molly', label: 'Ask Molly' },
                { id: 'live-teacher', label: 'Live Board' },
                { id: 'quizzes', label: `Quizzes (${quizHistory.length})` },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <AnimatedPressable
                  key={tab.id}
                  onPress={() => setFilter(tab.id)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? colors.mintDark : colors.surface,
                      borderColor: active ? colors.mintDark : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: '800', fontSize: 12.5 }}>
                    {tab.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          {isEmpty ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="bookmark-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.title, { color: colors.text }]}>
                {query ? 'No matching saved items' : 'No saved sessions yet'}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                Conversations with Molly AI Tutor, Live Teacher board lessons, and completed quizzes will appear here.
              </Text>
            </View>
          ) : (
            <>
              {filteredConversations.map((c) => (
                <View key={c.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: c.tool === 'live-teacher' ? colors.surfacePurpleSoft : colors.surfaceMint },
                      ]}
                    >
                      <Text
                        style={{
                          color: c.tool === 'live-teacher' ? colors.purple : colors.mintDark,
                          fontSize: 11,
                          fontWeight: '800',
                        }}
                      >
                        {c.tool === 'live-teacher' ? 'Live Board' : 'Ask Molly'}
                      </Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>{c.updatedAt}</Text>
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>{c.title}</Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={2}>
                    {c.messages.length} messages
                    {c.messages[c.messages.length - 1]?.text ? ` · ${c.messages[c.messages.length - 1].text}` : ''}
                  </Text>
                  <AnimatedPressable
                    onPress={() =>
                      router.push(
                        c.tool === 'live-teacher'
                          ? ('/tools/live-teacher' as never)
                          : ({
                              pathname: '/tools/ask-molly',
                              params: { initialQuestion: `Continue our discussion on: ${c.title}` },
                            } as never)
                      )
                    }
                    style={[styles.resumeBtn, { backgroundColor: colors.surfaceMint }]}
                  >
                    <Text style={{ color: colors.mintDark, fontSize: 12, fontWeight: '800' }}>
                      Resume Session →
                    </Text>
                  </AnimatedPressable>
                </View>
              ))}

              {filteredQuizzes.map((qz) => (
                <View key={qz.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: 'rgba(255, 107, 74, 0.14)' }]}>
                      <Text style={{ color: colors.coral, fontSize: 11, fontWeight: '800' }}>Quiz Attempt</Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>{qz.createdAt}</Text>
                  </View>
                  <View style={styles.quizRow}>
                    <Text style={[styles.title, { color: colors.text, flex: 1 }]}>{qz.title}</Text>
                    <Text
                      style={{
                        color: qz.scorePercent >= 70 ? colors.mintDark : colors.coral,
                        fontSize: 16,
                        fontWeight: '900',
                      }}
                    >
                      {qz.scorePercent}%
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 12 },
  radarCard: { borderRadius: 20, borderWidth: 1.5, padding: 15, gap: 8 },
  radarChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  empty: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 8 },
  card: { borderRadius: 18, borderWidth: 1, padding: 15, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12.5, textAlign: 'center' },
  cardSub: { fontSize: 12.5, lineHeight: 18 },
  resumeBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 2 },
  quizRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
