import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useApp } from '@/store/AppContext';

const FILTERS = ['Weekly', 'Monthly', 'All-Time'] as const;

export default function LeaderboardScreen() {
  const { profile, publicStudents } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Weekly');

  const ranked = useMemo(() => {
    const me = {
      id: profile.id,
      displayName: profile.displayName,
      username: profile.username,
      avatarEmoji: profile.avatarEmoji,
      avatarBg: profile.avatarBg,
      score: profile.xp,
      isMe: true,
    };
    const others = publicStudents.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      username: s.username,
      avatarEmoji: s.avatarEmoji,
      avatarBg: s.avatarBg,
      score: filter === 'Weekly' ? s.weeklyXp : filter === 'Monthly' ? s.monthlyXp : s.xp,
      isMe: false,
    }));
    return [me, ...others].sort((a, b) => b.score - a.score);
  }, [profile, publicStudents, filter]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Dark Premium Header */}
        <View style={styles.header}>
          <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </AnimatedPressable>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Weekly / Monthly / All-Time Filter */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <AnimatedPressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterPill, active && styles.filterActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Top 3 Podium */}
          <View style={styles.podiumRow}>
            {[top3[1], top3[0], top3[2]].map((entry, idx) => {
              if (!entry) return null;
              const isFirst = idx === 1;
              return (
                <View key={entry.id} style={[styles.podiumCol, isFirst && { marginTop: -18 }]}>
                  {isFirst && <Text style={styles.crown}>👑</Text>}
                  <View
                    style={[
                      styles.podiumAvatar,
                      {
                        backgroundColor: entry.avatarBg,
                        width: isFirst ? 76 : 60,
                        height: isFirst ? 76 : 60,
                        borderRadius: isFirst ? 38 : 30,
                        borderColor: isFirst ? '#FACC15' : '#4ADE80',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: isFirst ? 36 : 28 }}>{entry.avatarEmoji}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {entry.displayName.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumXp}>{entry.score.toLocaleString()} XP</Text>
                </View>
              );
            })}
          </View>

          {/* Ranked List */}
          <View style={styles.listCard}>
            {rest.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.rankRow, item.isMe && styles.rankRowMe]}
              >
                <Text style={styles.rankNum}>{idx + 4}</Text>
                <View style={[styles.miniAvatar, { backgroundColor: item.avatarBg }]}>
                  <Text style={{ fontSize: 18 }}>{item.avatarEmoji}</Text>
                </View>
                <Text style={styles.rankName} numberOfLines={1}>
                  {item.displayName} {item.isMe ? '(You)' : ''}
                </Text>
                <Text style={styles.rankXp}>{item.score.toLocaleString()} XP</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121916' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
  },
  filterPill: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  filterActive: { backgroundColor: '#FF6B4A' },
  filterText: { color: '#B8C4BD', fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 20 },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 24,
  },
  podiumCol: { alignItems: 'center', gap: 6, width: '30%' },
  crown: { fontSize: 26, marginBottom: -4 },
  podiumAvatar: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumName: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  podiumXp: { color: '#FACC15', fontSize: 12, fontWeight: '700' },
  listCard: {
    backgroundColor: '#1B2722',
    borderRadius: 24,
    padding: 12,
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  rankRowMe: {
    backgroundColor: 'rgba(88, 196, 91, 0.22)',
    borderWidth: 1,
    borderColor: '#58C45B',
  },
  rankNum: { color: '#9CA3AF', fontSize: 15, fontWeight: '800', width: 22 },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankName: { flex: 1, color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  rankXp: { color: '#86E88A', fontSize: 13.5, fontWeight: '800' },
});
