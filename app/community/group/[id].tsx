import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { askMollyAI } from '@/lib/aiGateway';

const DAILY_MCQ = {
  question: 'Which statement best describes the gradient of y = 3x - 5?',
  options: ['Gradient is -5', 'Gradient is 3', 'Gradient is 5/3', 'Gradient is 0'],
  correctIndex: 1,
};

export default function StudyGroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { groups, sendGroupMessage, consumeCredits } = useApp();
  const [draft, setDraft] = useState('');
  const [askingAI, setAskingAI] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);

  const group = groups.find((g) => g.id === id);

  if (!group) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <BrandHeader showBack title="Study Group" />
        </SafeAreaView>
      </AppBackground>
    );
  }

  const aiAllowed = Boolean(group.isPrivate && group.aiEnabled);

  const handleAskGroupAI = async () => {
    if (!aiAllowed || askingAI) return;
    const q = draft.trim() || `Give our ${group.subject} study group one focused exam revision tip.`;
    setDraft('');
    sendGroupMessage(group.id, `@AI-Teacher ${q}`);
    setAskingAI(true);
    consumeCredits(1, `Group AI (${group.name})`, 'group');
    const res = await askMollyAI(q, group.subject);
    sendGroupMessage(
      group.id,
      `🤖 AI Teacher (${group.billingMode ?? 'personal'} credits): ${res.data.text}`
    );
    setAskingAI(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title={group.name} />

        {/* Group Metadata & Governance Bar */}
        <View style={[styles.metaBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: group.isPrivate ? colors.surfacePurpleSoft : colors.surfaceMint }]}>
              <Text style={{ color: group.isPrivate ? colors.purple : colors.mintDark, fontSize: 11, fontWeight: '800' }}>
                {group.isPrivate ? '🔒 Private Group' : '🌍 Public Group'}
              </Text>
            </View>
            {group.inviteCode && (
              <View style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>
                  Code: {group.inviteCode}
                </Text>
              </View>
            )}
            <View style={[styles.pill, { backgroundColor: aiAllowed ? 'rgba(255, 107, 74, 0.14)' : colors.surfaceMuted }]}>
              <Text style={{ color: aiAllowed ? colors.coral : colors.textMuted, fontSize: 11, fontWeight: '800' }}>
                {aiAllowed
                  ? `🤖 AI Active (${group.billingMode ?? 'personal'})`
                  : 'Peer-Only (AI Off)'}
              </Text>
            </View>
          </View>
          <AnimatedPressable
            onPress={() => setShowQuiz((v) => !v)}
            style={[styles.quizToggle, { backgroundColor: colors.surfaceMint }]}
          >
            <Ionicons name="checkmark-done-circle-outline" size={16} color={colors.mintDark} />
            <Text style={{ color: colors.mintDark, fontSize: 12, fontWeight: '800' }}>
              {showQuiz ? 'Hide Daily Quick Check' : 'Daily Group Quiz (Free MCQ Marking)'}
            </Text>
          </AnimatedPressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {showQuiz && (
            <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.mintDark }]}>
              <Text style={{ color: colors.mintDark, fontSize: 11.5, fontWeight: '800' }}>
                DAILY QUICK CHECK · FREE AUTOMATIC MARKING
              </Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 4 }}>
                {DAILY_MCQ.question}
              </Text>
              <View style={{ gap: 6, marginTop: 8 }}>
                {DAILY_MCQ.options.map((opt, idx) => {
                  const picked = quizChoice === idx;
                  const isCorrect = idx === DAILY_MCQ.correctIndex;
                  const bg =
                    quizChoice === null
                      ? colors.surfaceMuted
                      : isCorrect
                        ? colors.surfaceMint
                        : picked
                          ? '#FFE4E6'
                          : colors.surfaceMuted;
                  return (
                    <AnimatedPressable
                      key={opt}
                      onPress={() => setQuizChoice(idx)}
                      style={[styles.optBtn, { backgroundColor: bg }]}
                    >
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{opt}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
              {quizChoice !== null && (
                <Text
                  style={{
                    color: quizChoice === DAILY_MCQ.correctIndex ? colors.mintDark : colors.coral,
                    fontSize: 12.5,
                    fontWeight: '800',
                    marginTop: 8,
                  }}
                >
                  {quizChoice === DAILY_MCQ.correctIndex
                    ? '✅ Spot on! In y = mx + c, m = 3 is the gradient. (0 credits used)'
                    : 'Not quite — remember in y = mx + c, m (the coefficient of x) is the gradient: 3.'}
                </Text>
              )}
            </View>
          )}

          {group.messages.map((m) => (
            <View key={m.id} style={[styles.msg, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 20 }}>{m.senderAvatar}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sender, { color: colors.text }]}>
                  {m.senderName} · <Text style={{ color: colors.textMuted, fontWeight: '400' }}>{m.createdAt}</Text>
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13.5, marginTop: 2 }}>{m.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={aiAllowed ? 'Message group or ask AI Teacher...' : 'Message study group...'}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
          />
          {aiAllowed && (
            <AnimatedPressable
              onPress={handleAskGroupAI}
              style={[styles.aiBtn, { backgroundColor: colors.purple }]}
            >
              {askingAI ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>AI</Text>
              )}
            </AnimatedPressable>
          )}
          <AnimatedPressable
            onPress={() => {
              if (draft.trim()) {
                sendGroupMessage(group.id, draft);
                setDraft('');
              }
            }}
            style={[styles.sendBtn, { backgroundColor: colors.coral }]}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  metaBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  quizToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scroll: { padding: 16, gap: 10 },
  quizCard: { borderRadius: 18, borderWidth: 1.5, padding: 14 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  msg: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1 },
  sender: { fontSize: 13.5, fontWeight: '800' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, fontSize: 14, paddingVertical: 6 },
  aiBtn: { paddingHorizontal: 12, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
