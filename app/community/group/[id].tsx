import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function StudyGroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { groups, sendGroupMessage } = useApp();
  const [draft, setDraft] = useState('');

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

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title={group.name} />
        <ScrollView contentContainerStyle={styles.scroll}>
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
            placeholder="Message study group..."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }]}
          />
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
  scroll: { padding: 16, gap: 10 },
  msg: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1 },
  sender: { fontSize: 13.5, fontWeight: '800' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, fontSize: 14, paddingVertical: 6 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
