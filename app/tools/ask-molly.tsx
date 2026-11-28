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
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { StudentAvatar } from '@/components/StudentAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { askMollyAI, MollyChatReply } from '@/lib/aiGateway';
import { getCompanionById } from '@/constants/assets';
import { ChatVisualWidget, ChatWidgetSpec } from '@/components/chat/ChatVisualWidget';

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
  tip?: string;
  widgets?: ChatWidgetSpec[];
  timestamp: string;
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function buildRichMessage(
  _question: string,
  reply: MollyChatReply,
  firstName: string
): Omit<ChatMsg, 'id' | 'role' | 'timestamp'> {
  return {
    heading:
      reply.heading ??
      (reply.steps ? `Sure, ${firstName}! Let's break it down step by step.` : undefined),
    text: reply.text,
    equation: reply.equation,
    steps: reply.steps,
    example: reply.example,
    tip: reply.tip,
    widgets: reply.widgets && reply.widgets.length > 0 ? reply.widgets : undefined,
  };
}

export default function AskMollyScreen() {
  const { initialQuestion, prompt, conversationId } = useLocalSearchParams<{
    initialQuestion?: string;
    prompt?: string;
    conversationId?: string;
  }>();
  const seedPrompt = initialQuestion ?? prompt;
  const { colors, isDark } = useTheme();
  const { profile, conversations, saveConversation, learningMemory, consumeCredits, logStudyActivity } = useApp();
  const router = useRouter();
  const companion = getCompanionById(profile.companionId);
  const firstName = profile.displayName.split(' ')[0];

  const makeWelcomeMsg = (): ChatMsg => ({
    id: 'welcome',
    role: 'assistant',
    heading: `Hi ${firstName}! 👋 I'm ${companion.name}.`,
    text: 'Ask me any question — I will explain it clearly step-by-step like a 1-on-1 teacher, remember our conversation, and draw graphs or diagrams whenever they help.',
    timestamp: nowTime(),
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => conversationId ?? `chat-${Date.now()}`);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([makeWelcomeMsg()]);
  const restoredRef = useRef<string | null>(null);

  // Auto-resume either the selected conversationId from History OR the most recent Ask Molly chat!
  useEffect(() => {
    const mollyChats = conversations.filter((c) => c.tool === 'ask-molly' && c.messages.length > 0);
    const target = conversationId
      ? mollyChats.find((c) => c.id === conversationId)
      : !seedPrompt
        ? mollyChats[0]
        : undefined;

    if (target && restoredRef.current !== target.id) {
      restoredRef.current = target.id;
      setActiveConvId(target.id);
      setMessages(
        target.messages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          heading: m.heading,
          equation: m.equation,
          steps: m.steps,
          example: m.example,
          tip: m.tip,
          widgets: m.widgets as ChatWidgetSpec[] | undefined,
          timestamp: m.createdAt,
        }))
      );
    }
  }, [conversationId, conversations, seedPrompt]);

  const handleNewChat = () => {
    const freshId = `chat-${Date.now()}`;
    restoredRef.current = freshId;
    setActiveConvId(freshId);
    setMessages([makeWelcomeMsg()]);
    setInput('');
  };

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

    logStudyActivity(`Asked ${companion.name}: ${clean.slice(0, 60)}`);
    consumeCredits(1, `Chat with ${companion.name}: ${clean.slice(0, 32)}`, 'ai-chat');
    const memContext = learningMemory.shareContextWithAI
      ? `Education level: ${profile.educationLevel}.${
          learningMemory.weakTopics.length > 0
            ? ` Weak topics needing extra clarity: ${learningMemory.weakTopics.join(', ')}.`
            : ''
        }`
      : undefined;

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: [m.heading, m.text, m.equation].filter(Boolean).join('\n'),
      }));

    const res = await askMollyAI(clean, undefined, memContext, historyPayload, companion.name);
    const enriched = buildRichMessage(clean, res.data, firstName);
    const botMsg: ChatMsg = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      ...enriched,
      timestamp: nowTime(),
    };
    const finalMsgs = [...nextList, botMsg];
    setMessages(finalMsgs);
    setLoading(false);

    const firstUserText = finalMsgs.find((m) => m.role === 'user')?.text ?? clean;
    saveConversation({
      id: activeConvId,
      title: firstUserText.slice(0, 44),
      tool: 'ask-molly',
      updatedAt: new Date().toLocaleDateString(),
      messages: finalMsgs.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        heading: m.heading,
        equation: m.equation,
        steps: m.steps,
        example: m.example,
        tip: m.tip,
        widgets: m.widgets,
        createdAt: m.timestamp,
      })),
    });
  };

  useEffect(() => {
    if (seedPrompt) {
      sendMessage(seedPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedPrompt]);

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

  const followUps = [
    { icon: 'book-outline' as const, color: '#16A34A', label: 'Give another example', prompt: 'Give me another simple worked example of what we are discussing' },
    { icon: 'stats-chart' as const, color: '#7C3AED', label: 'Draw a visual', prompt: 'Draw a helpful diagram or graph for what we are discussing' },
    { icon: 'disc-outline' as const, color: '#FF6B4A', label: 'Practice questions', prompt: 'Give me 3 practice questions to test my understanding' },
  ];

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title={`Chat with ${companion.name}`} />

        {/* Companion Status Card with + New Chat & History buttons */}
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
                    Online · 1-on-1 Tutor
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AnimatedPressable
                onPress={handleNewChat}
                style={[styles.statusActionBtn, { backgroundColor: colors.surfaceMint }]}
                accessibilityLabel="Start new chat"
              >
                <Ionicons name="add" size={21} color={colors.mintDark} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => router.push('/saved-resources' as never)}
                style={[styles.statusActionBtn, { backgroundColor: colors.surfaceMuted }]}
                accessibilityLabel="Chat history"
              >
                <Ionicons name="time-outline" size={19} color={colors.text} />
              </AnimatedPressable>
            </View>
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
                      <StudentAvatar avatarId={profile.avatarEmoji} bgColor={profile.avatarBg} size={32} />
                    </View>
                  </View>
                );
              }

              return (
                <View key={msg.id} style={styles.botRow}>
                  <View style={styles.botHeaderRow}>
                    <CompanionAvatar companionId={profile.companionId} size={28} />
                    <Text style={[styles.botNameLabel, { color: colors.text }]}>{companion.name}</Text>
                    <Text style={[styles.botTime, { color: colors.textMuted }]}>{msg.timestamp}</Text>
                  </View>
                  <View style={styles.botCard}>
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

                    {msg.widgets && msg.widgets.length > 0 && (
                      <View style={{ gap: 10 }}>
                        {msg.widgets.map((w, wIdx) => (
                          <ChatVisualWidget key={`${msg.id}-w-${wIdx}`} widget={w} />
                        ))}
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

                    {msg.tip && (
                      <View
                        style={[
                          styles.exampleBox,
                          { backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : '#ECFDF3' },
                        ]}
                      >
                        <Ionicons name="sparkles" size={17} color={colors.brandGreen} />
                        <Text style={[styles.exampleText, { color: colors.text }]}>
                          <Text style={{ fontWeight: '800', color: colors.mintDark }}>Tip: </Text>
                          {msg.tip}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {messages.length === 1 && !loading && (
              <View style={styles.starterWrap}>
                {[
                  'Describe waves with examples and a diagram',
                  'Can you explain quadratic equations?',
                  'Explain the Pythagorean theorem with a triangle',
                  'Explain Chemical Bonding',
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <CompanionAvatar companionId={profile.companionId} mood="thinking" size={42} />
                <Text style={[styles.typing, { color: colors.textMuted }]}>
                  {companion.name} is thinking...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* 3 Follow-Up Quick Action Pills (fixed non-shrinking height so they never compress!) */}
          <View style={{ flexShrink: 0, height: 48, justifyContent: 'center' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.followUpRow}
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
          </View>

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
  botRow: { width: '100%', gap: 6, paddingVertical: 6 },
  botHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botNameLabel: { fontSize: 14.5, fontWeight: '800', flex: 1 },
  botAvatarWrap: { marginTop: 2 },
  botCard: {
    width: '100%',
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 12,
  },
  botHeading: { fontSize: 18, fontWeight: '900', lineHeight: 24, letterSpacing: -0.2 },
  botBody: { fontSize: 16, lineHeight: 25 },
  formulaPill: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  formulaText: { fontSize: 16.5, fontWeight: '800', textAlign: 'center', lineHeight: 24 },
  stepsBlock: { gap: 11 },
  guideLabel: { fontSize: 14.5, fontWeight: '700' },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: { fontSize: 13, fontWeight: '800' },
  stepTitle: { fontSize: 15.5, fontWeight: '800', lineHeight: 22 },
  stepDetail: { fontSize: 15, lineHeight: 23, marginTop: 2 },
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
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    padding: 13,
  },
  exampleText: { flex: 1, fontSize: 15, lineHeight: 23 },
  botTime: { fontSize: 11 },
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
