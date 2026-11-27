import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ChatVisualWidget, ChatWidgetSpec } from '@/components/chat/ChatVisualWidget';
import { useTheme } from '@/theme/ThemeContext';
import { useAITeachers } from '@/store/useAITeachers';
import { askMollyAI } from '@/lib/aiGateway';

type TeacherTab = 'chat' | 'knowledge' | 'roadmap';

interface TeacherMsg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  equation?: string;
  widgets?: ChatWidgetSpec[];
}

export default function DedicatedTeacherDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { teachers, addDocumentToTeacher, toggleRoadmapStep } = useAITeachers();

  const teacher = teachers.find((t) => t.id === id);
  const [activeTab, setActiveTab] = useState<TeacherTab>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [messages, setMessages] = useState<TeacherMsg[]>([
    {
      id: 'init',
      role: 'assistant',
      text: teacher
        ? `Hello! I'm ${teacher.name} (${teacher.teachingStyle}). Ask me anything about ${teacher.subjectName} — I'll use your uploaded notes and syllabus!`
        : 'Welcome to your custom AI Teacher dashboard.',
    },
  ]);

  if (!teacher) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <BrandHeader showBack title="AI Teacher" />
          <View style={styles.center}>
            <Text style={{ color: colors.text }}>Teacher not found.</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  const handleSend = async () => {
    const clean = input.trim();
    if (!clean || loading) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: clean }]);
    setInput('');
    setLoading(true);

    const knowledgeSnippet = teacher.documents
      .slice(0, 2)
      .map((d) => `${d.title}: ${d.content.slice(0, 250)}`)
      .join(' | ');

    const promptWithPersona = `[Persona: ${teacher.name}, Style: ${teacher.teachingStyle}, Instructions: ${teacher.instructions}${
      knowledgeSnippet ? `, Student Notes: ${knowledgeSnippet}` : ''
    }] Question: ${clean}`;

    const res = await askMollyAI(promptWithPersona, teacher.subjectName);
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.data.text,
        equation: res.data.equation,
        widgets: res.data.widgets,
      },
    ]);
    setLoading(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <BrandHeader showBack title={teacher.name} />

        {/* Dedicated Teacher Tabs: Chat | Knowledge | Roadmap */}
        <View style={styles.tabRow}>
          {(
            [
              { id: 'chat', label: 'Teacher Chat' },
              { id: 'knowledge', label: `Knowledge (${teacher.documents.length})` },
              { id: 'roadmap', label: 'Roadmap' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <AnimatedPressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? colors.coral : colors.surface,
                    borderColor: active ? colors.coral : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#FFFFFF' : colors.text }}>
                  {tab.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {activeTab === 'chat' && (
          <>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    {
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      backgroundColor: m.role === 'user' ? colors.surfaceMintStrong : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>{m.text}</Text>
                  {m.equation && (
                    <View style={[styles.eqPill, { backgroundColor: colors.surfacePurpleSoft }]}>
                      <Text style={{ color: colors.purple, fontWeight: '800', fontSize: 13.5 }}>
                        {m.equation}
                      </Text>
                    </View>
                  )}
                  {m.widgets?.map((w, i) => (
                    <ChatVisualWidget key={i} widget={w} />
                  ))}
                </View>
              ))}
              {loading && (
                <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>
                  {teacher.name} is thinking...
                </Text>
              )}
            </ScrollView>

            <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={`Ask ${teacher.name}...`}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                onSubmitEditing={handleSend}
              />
              <AnimatedPressable
                onPress={handleSend}
                style={[styles.sendBtn, { backgroundColor: colors.coral }]}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </AnimatedPressable>
            </View>
          </>
        )}

        {activeTab === 'knowledge' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Add Study Notes / Syllabus</Text>
              <TextInput
                value={docTitle}
                onChangeText={setDocTitle}
                placeholder="Note title (e.g., Wave Equations)"
                placeholderTextColor={colors.textMuted}
                style={[styles.field, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                value={docContent}
                onChangeText={setDocContent}
                multiline
                placeholder="Paste formulas, notes, or exam definitions..."
                placeholderTextColor={colors.textMuted}
                style={[styles.field, { borderColor: colors.border, color: colors.text, minHeight: 74 }]}
              />
              <AnimatedPressable
                onPress={() => {
                  if (!docContent.trim()) return;
                  addDocumentToTeacher(teacher.id, docTitle, docContent);
                  setDocTitle('');
                  setDocContent('');
                }}
                style={[styles.addBtn, { backgroundColor: colors.coral }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save to Teacher Knowledge</Text>
              </AnimatedPressable>
            </View>

            {teacher.documents.map((doc) => (
              <View key={doc.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{doc.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                  {doc.content}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'roadmap' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {teacher.subjectName} Mastery Roadmap
              </Text>
              {teacher.roadmapSteps.map((st) => (
                <AnimatedPressable
                  key={st.id}
                  onPress={() => toggleRoadmapStep(teacher.id, st.id)}
                  style={[styles.roadRow, { backgroundColor: colors.surfaceMuted }]}
                >
                  <Ionicons
                    name={st.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={st.done ? colors.brandGreen : colors.textMuted}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.text,
                      textDecorationLine: st.done ? 'line-through' : 'none',
                    }}
                  >
                    {st.title}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  tabPill: { flex: 1, paddingVertical: 9, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  bubble: { maxWidth: '88%', borderRadius: 18, borderWidth: 1, padding: 12, gap: 8 },
  eqPill: { padding: 10, borderRadius: 12 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, fontSize: 14.5, paddingVertical: 6 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 10 },
  cardTitle: { fontSize: 15.5, fontWeight: '800' },
  field: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 13.5 },
  addBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  roadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
});
