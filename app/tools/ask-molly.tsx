import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { askMollyAI } from '@/lib/aiGateway';
import { getCompanionById } from '@/constants/assets';

interface RichStep {
  title: string;
  detail: string;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  heading?: string;
  equation?: string;
  steps?: RichStep[];
  example?: string;
  showParabolaGraph?: boolean;
  timestamp: string;
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function enrichMollyResponse(
  question: string,
  replyText: string,
  equation: string | undefined,
  firstName: string
): Omit<ChatMsg, 'id' | 'role' | 'timestamp'> {
  const q = `${question} ${replyText}`.toLowerCase();
  if (q.includes('quadratic') || q.includes('parabola')) {
    return {
      heading: `Sure, ${firstName}! Let's break it down step by step.`,
      text: replyText,
      equation: equation ?? 'ax² + bx + c = 0   where a ≠ 0',
      steps: [
        { title: 'Identify a, b and c.', detail: 'These are the coefficients in the equation.' },
        { title: 'Find the solutions (roots).', detail: 'Factor or use x = (-b ± √(b² - 4ac)) / 2a.' },
        { title: 'Interpret the result.', detail: 'The roots are the x-values where the graph crosses the x-axis.' },
      ],
      example: 'For x² - 5x + 6 = 0, the solutions are x = 2 and x = 3.',
      showParabolaGraph: true,
    };
  }
  return {
    text: replyText,
    equation,
  };
}

export default function AskMollyScreen() {
  const { initialQuestion } = useLocalSearchParams<{ initialQuestion?: string }>();
  const { colors, isDark } = useTheme();
  const { profile, saveConversation } = useApp();
  const companion = getCompanionById(profile.companionId);
  const firstName = profile.displayName.split(' ')[0];

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      heading: `Hi ${firstName}! 👋 I'm ${companion.name}.`,
      text: 'Ask me any homework question, formula, or exam topic — I will break it down step by step with examples and graphs.',
      timestamp: nowTime(),
    },
  ]);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const sendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || loading) return;

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: clean,
      timestamp: nowTime(),
    };
    const nextList = [...messages, userMsg];
    setMessages(nextList);
    setInput('');
    setLoading(true);

    const res = await askMollyAI(clean);
    const enriched = enrichMollyResponse(clean, res.data.text, res.data.equation, firstName);
    const botMsg: ChatMsg = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      ...enriched,
      timestamp: nowTime(),
    };
    const finalMsgs = [...nextList, botMsg];
    setMessages(finalMsgs);
    setLoading(false);

    saveConversation({
      id: `chat-${clean.slice(0, 12)}`,
      title: clean.slice(0, 40),
      tool: 'ask-molly',
      updatedAt: new Date().toLocaleDateString(),
      messages: finalMsgs.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        createdAt: m.timestamp,
      })),
    });
  };

  useEffect(() => {
    if (initialQuestion) {
      sendMessage(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages.length, loading]);

  const handleVoiceInput = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SR =
        (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
      if (!SR) {
        Alert.alert('Voice Input', 'Speech recognition is not supported in this browser.');
        return;
      }
      const rec = new SR() as {
        lang: string;
        onstart: () => void;
        onend: () => void;
        onerror: () => void;
        onresult: (ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (ev) => {
        const spoken = ev.results?.[0]?.[0]?.transcript;
        if (spoken) sendMessage(spoken);
      };
      rec.start();
    } else {
      Alert.alert('Voice Input', 'Tap the input box or use your keyboard microphone to dictate.');
    }
  };

  const handleBookmark = () => {
    setBookmarked((b) => !b);
    Alert.alert('Saved', 'Conversation bookmarked in Saved Resources.');
  };

  const followUps = [
    { icon: 'book-outline' as const, color: '#16A34A', label: 'Give another example', prompt: 'Give me another worked example of this topic' },
    { icon: 'stats-chart' as const, color: '#7C3AED', label: 'Show the graph', prompt: 'Show the graph for a quadratic equation y = x² - 4x + 3' },
    { icon: 'disc-outline' as const, color: '#FF6B4A', label: 'Practice questions', prompt: 'Give me 3 practice questions to test my understanding' },
  ];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title={`Chat with ${companion.name}`} />

        {/* Companion Online Status Card (matches 09_chat_molly_fullsize_example.png) */}
        <View style={styles.statusWrap}>
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.statusLeft}>
              <View style={[styles.statusAvatarRing, { backgroundColor: colors.surfaceMint }]}>
                <CompanionAvatar companionId={profile.companionId} size={42} />
              </View>
              <View>
                <Text style={[styles.statusName, { color: colors.text }]}>{companion.name}</Text>
                <View style={styles.onlineRow}>
                  <View style={[styles.onlineDot, { backgroundColor: colors.brandGreen }]} />
                  <Text style={[styles.onlineSub, { color: colors.textSecondary }]}>
                    Online · Your learning companion
                  </Text>
                </View>
              </View>
            </View>
            <AnimatedPressable
              onPress={handleBookmark}
              style={[styles.statusActionBtn, { backgroundColor: colors.surfaceMuted }]}
              accessibilityLabel="Bookmark chat"
            >
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={bookmarked ? colors.brandGreen : colors.text}
              />
            </AnimatedPressable>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatScroll}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              if (isUser) {
                return (
                  <View key={msg.id} style={styles.userRow}>
                    <View
                      style={[
                        styles.userBubble,
                        { backgroundColor: isDark ? '#254434' : '#E3F6D6' },
                      ]}
                    >
                      <Text style={[styles.userText, { color: colors.text }]}>{msg.text}</Text>
                      <View style={styles.timeRowRight}>
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>
                          {msg.timestamp}
                        </Text>
                        <Ionicons name="checkmark-done" size={14} color={colors.brandGreen} />
                      </View>
                    </View>
                    <View style={[styles.userAvatar, { backgroundColor: profile.avatarBg }]}>
                      <Text style={{ fontSize: 17 }}>{profile.avatarEmoji}</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={msg.id} style={styles.botRow}>
                  <View style={styles.botAvatarWrap}>
                    <CompanionAvatar companionId={profile.companionId} size={36} />
                  </View>
                  <View
                    style={[
                      styles.botCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    {msg.heading && (
                      <Text style={[styles.botHeading, { color: colors.text }]}>{msg.heading}</Text>
                    )}
                    <Text style={[styles.botBody, { color: colors.text }]}>{msg.text}</Text>

                    {msg.equation && (
                      <View
                        style={[
                          styles.formulaPill,
                          { backgroundColor: isDark ? 'rgba(139,92,246,0.22)' : '#F1EBFE' },
                        ]}
                      >
                        <Text style={[styles.formulaText, { color: isDark ? '#DDD6FE' : '#2E1065' }]}>
                          {msg.equation}
                        </Text>
                      </View>
                    )}

                    {msg.steps && (
                      <View style={styles.stepsBlock}>
                        <Text style={[styles.guideLabel, { color: colors.textSecondary }]}>
                          Here's a simple guide:
                        </Text>
                        {msg.steps.map((st, idx) => (
                          <View key={idx} style={styles.stepItem}>
                            <View
                              style={[
                                styles.stepNumCircle,
                                { backgroundColor: isDark ? 'rgba(74,222,128,0.2)' : '#DFF5D8' },
                              ]}
                            >
                              <Text style={[styles.stepNumText, { color: colors.brandGreen }]}>
                                {idx + 1}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.stepTitle, { color: colors.text }]}>{st.title}</Text>
                              <Text style={[styles.stepDetail, { color: colors.textSecondary }]}>
                                {st.detail}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {msg.showParabolaGraph && (
                      <View
                        style={[
                          styles.graphBox,
                          { backgroundColor: isDark ? '#1A2420' : '#FAFAFF', borderColor: colors.border },
                        ]}
                      >
                        <Svg width={210} height={120} viewBox="0 0 210 120">
                          <Line x1={18} y1={92} x2={192} y2={92} stroke={colors.textMuted} strokeWidth={1.6} />
                          <Line x1={105} y1={14} x2={105} y2={112} stroke={colors.textMuted} strokeWidth={1.6} />
                          <Polygon points="192,92 185,88 185,96" fill={colors.textMuted} />
                          <Polygon points="105,12 101,19 109,19" fill={colors.textMuted} />
                          <Path
                            d="M 58 20 Q 105 142 152 20"
                            fill="none"
                            stroke="#7C3AED"
                            strokeWidth={2.8}
                            strokeLinecap="round"
                          />
                          <Circle cx={84} cy={92} r={3.5} fill="#7C3AED" />
                          <Circle cx={126} cy={92} r={3.5} fill="#7C3AED" />
                          <Circle cx={105} cy={82} r={3.5} fill="#FF6B4A" />
                          <SvgText x={194} y={95} fill={colors.textSecondary} fontSize={11} fontWeight="bold">
                            x
                          </SvgText>
                          <SvgText x={111} y={18} fill={colors.textSecondary} fontSize={11} fontWeight="bold">
                            y
                          </SvgText>
                        </Svg>
                        <View
                          style={[
                            styles.graphCaption,
                            { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : '#F1EBFE' },
                          ]}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.purple }}>
                            Graph of y = x² - 4x + 3
                          </Text>
                        </View>
                      </View>
                    )}

                    {msg.example && (
                      <View
                        style={[
                          styles.exampleBox,
                          { backgroundColor: isDark ? 'rgba(139,92,246,0.16)' : '#F4EEFF' },
                        ]}
                      >
                        <Ionicons name="bulb" size={18} color="#F59E0B" />
                        <Text style={[styles.exampleText, { color: colors.text }]}>
                          <Text style={{ fontWeight: '800' }}>Example: </Text>
                          {msg.example}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.botTime, { color: colors.textMuted }]}>{msg.timestamp}</Text>
                  </View>
                </View>
              );
            })}

            {messages.length === 1 && !loading && (
              <View style={styles.starterWrap}>
                {[
                  'Can you explain quadratic equations?',
                  'Quiz me on Chemical Bonding',
                  "Summarize Newton's Laws of Motion",
                ].map((prompt) => (
                  <AnimatedPressable
                    key={prompt}
                    onPress={() => sendMessage(prompt)}
                    style={[
                      styles.starterChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="sparkles-outline" size={14} color={colors.coral} />
                    <Text style={[styles.starterText, { color: colors.text }]}>{prompt}</Text>
                  </AnimatedPressable>
                ))}
              </View>
            )}

            {loading && (
              <Text style={[styles.typing, { color: colors.textMuted }]}>
                {companion.name} is thinking...
              </Text>
            )}
          </ScrollView>

          {/* 3 Follow-Up Quick Action Pills (matches screenshot) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.followUpRow}
            style={{ flexGrow: 0 }}
          >
            {followUps.map((f) => (
              <AnimatedPressable
                key={f.label}
                onPress={() => sendMessage(f.prompt)}
                style={[
                  styles.followUpPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons name={f.icon} size={14} color={f.color} />
                <Text style={[styles.followUpText, { color: colors.text }]}>{f.label}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>

          {/* Rounded Floating Composer Bar */}
          <View style={styles.composerOuter}>
            <View
              style={[
                styles.composerPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <AnimatedPressable
                onPress={() => Alert.alert('Attach Study Material', 'Use Image Analyzer or Book Analyzer from Home to scan photos and PDFs.')}
                style={[styles.circleToolBtn, { backgroundColor: colors.surfaceMint }]}
                accessibilityLabel="Attach"
              >
                <Ionicons name="attach" size={19} color={colors.mintDark} />
              </AnimatedPressable>

              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={isListening ? 'Listening...' : `Ask ${companion.name} anything...`}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                onSubmitEditing={() => sendMessage(input)}
              />

              <AnimatedPressable
                onPress={handleVoiceInput}
                style={[
                  styles.circleToolBtn,
                  { backgroundColor: isListening ? colors.coral : colors.surfaceMint },
                ]}
                accessibilityLabel="Voice input"
              >
                <Ionicons
                  name="mic"
                  size={18}
                  color={isListening ? '#FFFFFF' : colors.mintDark}
                />
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => sendMessage(input)}
                style={[styles.sendBtn, { backgroundColor: colors.coral }]}
                accessibilityLabel="Send message"
              >
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              </AnimatedPressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  statusWrap: { paddingHorizontal: 14, paddingBottom: 6 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statusName: { fontSize: 15, fontWeight: '800' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlineSub: { fontSize: 12 },
  statusActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroll: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 16, gap: 12 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 8,
  },
  userBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  userText: { fontSize: 14.5, fontWeight: '600', lineHeight: 20 },
  timeRowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  timeText: { fontSize: 10.5 },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  botAvatarWrap: { marginTop: 2 },
  botCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  botHeading: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  botBody: { fontSize: 14, lineHeight: 20 },
  formulaPill: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  formulaText: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stepsBlock: { gap: 8 },
  guideLabel: { fontSize: 13, fontWeight: '600' },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 12, fontWeight: '800' },
  stepTitle: { fontSize: 13.5, fontWeight: '800' },
  stepDetail: { fontSize: 12.5, lineHeight: 17, marginTop: 1 },
  graphBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  graphCaption: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  exampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 10,
  },
  exampleText: { flex: 1, fontSize: 13, lineHeight: 18 },
  botTime: { fontSize: 10.5, textAlign: 'right' },
  starterWrap: { gap: 8, marginTop: 4 },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  starterText: { fontSize: 13.5, fontWeight: '600', flex: 1 },
  typing: { fontSize: 12.5, marginLeft: 44 },
  followUpRow: { paddingHorizontal: 14, paddingVertical: 6, gap: 8 },
  followUpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  followUpText: { fontSize: 12, fontWeight: '700' },
  composerOuter: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 10 },
  composerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  circleToolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1, fontSize: 14.5, paddingVertical: 6 },
  sendBtn: {
    width: 40,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
