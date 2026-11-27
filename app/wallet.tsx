import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function CreditWalletScreen() {
  const { colors } = useTheme();
  const { profile, creditTransactions, grantTestCredits } = useApp();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Credit Wallet" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: colors.mintDark }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.balanceLabel}>Available Test Credits</Text>
              <View style={styles.sandboxPill}>
                <Text style={styles.sandboxText}>SANDBOX MODE</Text>
              </View>
            </View>
            <Text style={styles.balanceNum}>{profile.credits}</Text>
            <Text style={styles.balanceNote}>
              No real payments or subscriptions are active. Test credits let you try AI features transparently.
            </Text>
            <AnimatedPressable
              onPress={() => grantTestCredits(100, 'Sandbox test credit top-up (+100)')}
              style={styles.topupBtn}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.mintDark} />
              <Text style={[styles.topupText, { color: colors.mintDark }]}>Add +100 Free Test Credits</Text>
            </AnimatedPressable>
          </View>

          {/* Free vs Credited Transparency Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Credit Usage Rules</Text>
            {[
              { label: 'Subjects, Notes, Flashcards & MCQ Marking', cost: 'FREE', free: true },
              { label: 'Peer-to-Peer Study Groups & Timetable', cost: 'FREE', free: true },
              { label: 'Ask Molly AI Tutor & Custom AI Teachers', cost: '1–2 credits', free: false },
              { label: 'Live Board AI Lesson / Book & Image Analysis', cost: '2–3 credits', free: false },
            ].map((row) => (
              <View key={row.label} style={styles.ruleRow}>
                <Text style={[styles.ruleLabel, { color: colors.text }]}>{row.label}</Text>
                <View
                  style={[
                    styles.costBadge,
                    { backgroundColor: row.free ? colors.surfaceMint : 'rgba(255, 107, 74, 0.14)' },
                  ]}
                >
                  <Text
                    style={{
                      color: row.free ? colors.mintDark : colors.coral,
                      fontWeight: '800',
                      fontSize: 11.5,
                    }}
                  >
                    {row.cost}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Transaction Ledger */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Credit Activity</Text>
            {creditTransactions.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No credit activity yet.</Text>
            ) : (
              creditTransactions.map((tx) => (
                <View
                  key={tx.id}
                  style={[styles.txRow, { borderTopColor: colors.borderSubtle }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txReason, { color: colors.text }]}>{tx.reason}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11.5 }}>{tx.createdAt}</Text>
                  </View>
                  <Text
                    style={{
                      color: tx.delta >= 0 ? colors.mintDark : colors.coral,
                      fontWeight: '900',
                      fontSize: 14,
                    }}
                  >
                    {tx.delta >= 0 ? `+${tx.delta}` : tx.delta}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },
  balanceCard: { borderRadius: 24, padding: 20, gap: 8 },
  balanceLabel: { color: '#E8F7EE', fontSize: 13, fontWeight: '700' },
  sandboxPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sandboxText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800' },
  balanceNum: { color: '#FFFFFF', fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  balanceNote: { color: '#E8F7EE', fontSize: 12.5, lineHeight: 18 },
  topupBtn: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  topupText: { fontWeight: '800', fontSize: 13.5 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15.5, fontWeight: '800' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ruleLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  costBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  txReason: { fontSize: 13.5, fontWeight: '700' },
});
