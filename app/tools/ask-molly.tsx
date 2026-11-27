import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CompanionAvatar } from '@/components/CompanionAvatar';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { askMollyAI } from '@/lib/aiGateway';
import { getCompanionById } from '@/constants/assets';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  equation?: string;
}

export default function AskMollyScreen() {
  const { initialQuestion } = useLocalSearchParams<{ initialQuestion?: string }>();
  const { colors } = useTheme();
  const { profile, saveConversation } = useApp();
  const companion = getCompanionById(profile.companionId);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi ${profile.displayName.split(' ')[0]}! 👋 I’m ${companion.name}. What do you want to learn today?`,
    },
  ]);

  const sendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || loading) return;
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', text: clean };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput('');
    setLoading(true);

    const res = await askMollyAI(clean);
    const botMsg: ChatMsg = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: res.data.text,
      equation: res.data.equation,
    };
    const finalMsgs = [...nextMsgs, botMsg];
    setMessages(finalMsgs);
    setLoading(false);

    saveConversation({
      id: `chat-${clean.slice(0, 12)}`,
      title: clean.slice(0, 40),
      tool: 'ask-molly',
      updatedAt: new Date().toLocaleDateString(),
      messages: finalMsgs.map((m) => ({ ...m, createdAt: 'Today' })),
    });
  };

  const scrollRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (initialQuestion) {
      sendMessage(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [messages.length, loading]);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title={`${companion.name} AI Tutor`} />
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
              return (
                <View
                  key={msg.id}
                  style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}
                >
                  {!isUser && <CompanionAvatar companionId={profile.companionId} size={34} />}
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isUser ? colors.surfaceMintStrong : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.msgText, { color: colors.text }]}>{msg.text}</Text>
                    {msg.equation && (
                      <View style={[styles.eqBox, { backgroundColor: colors.surfacePurpleSoft }]}>
                        <Text style={[styles.eqText, { color: colors.purple }]}>
                          {msg.equation}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {messages.length === 1 && !loading && (
              <View style={styles.suggestionsWrap}>
                <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
                  Try asking {companion.name}:
                </Text>
                <View style={styles.suggestionsGrid}>
                  {[
                    'Explain Quadratic Equations step by step',
                    'Quiz me on Chemical Bonding',
                    'How do I prepare for my exams?',
                    "Summarize Newton's 3 Laws of Motion",
                  ].map((prompt) => (
                    <AnimatedPressable
                      key={prompt}
                      onPress={() => sendMessage(prompt)}
                      style={[
                        styles.suggestionChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name="sparkles-outline" size={14} color={colors.coral} />
                      <Text style={[styles.suggestionText, { color: colors.text }]}>{prompt}</Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </View>
            )}
            {loading && (
              <Text style={[styles.typing, { color: colors.textMuted }]}>
                {companion.name} is thinking...
              </Text>
            )}
          </ScrollView>

          <View
            style={[
              styles.inputBar,
              { backgroundColor: colors.surface, borderTopColor: colors.border },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
              onSubmitEditing={() => sendMessage(input)}
            />
            <AnimatedPressable
              onPress={() => sendMessage(input)}
              style={[styles.sendBtn, { backgroundColor: colors.coral }]}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  chatScroll: { padding: 16, gap: 12, paddingBottom: 24 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  msgText: { fontSize: 14, lineHeight: 20 },
  eqBox: { padding: 10, borderRadius: 12 },
  eqText: { fontSize: 13.5, fontWeight: '800' },
  typing: { fontSize: 12.5, marginLeft: 42 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: { flex: 1, fontSize: 14.5, paddingVertical: 8 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsWrap: {
    marginTop: 8,
    gap: 10,
  },
  suggestionsTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 4,
  },
  suggestionsGrid: {
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
});
