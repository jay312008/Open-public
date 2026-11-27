import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useAITeachers } from '@/store/useAITeachers';

const LEVELS = ['O-Level', 'A-Level', 'University'] as const;
const STYLES = ['Friendly Step-by-Step', 'Strict Exam Coach', 'Socratic Questioning'] as const;
const EMOJIS = ['🎓', '⚡', '🧪', '📐', '🧬', '🌍', '💻', '📚'];

export default function CreateAITeacherScreen() {
  const { colors } = useTheme();
  const { createTeacher } = useAITeachers();
  const router = useRouter();

  const [name, setName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [educationLevel, setEducationLevel] = useState<(typeof LEVELS)[number]>('O-Level');
  const [teachingStyle, setTeachingStyle] = useState<(typeof STYLES)[number]>('Friendly Step-by-Step');
  const [avatarEmoji, setAvatarEmoji] = useState('🎓');
  const [instructions, setInstructions] = useState('');
  const [notesTitle, setNotesTitle] = useState('');
  const [notesContent, setNotesContent] = useState('');

  const handleCreate = () => {
    if (!name.trim() || !subjectName.trim()) {
      Alert.alert('Missing Details', 'Enter a teacher name and subject to continue.');
      return;
    }
    const created = createTeacher({
      name: name.trim(),
      subjectName: subjectName.trim(),
      educationLevel,
      teachingStyle,
      avatarEmoji,
      accentColor: '#7C3AED',
      instructions:
        instructions.trim() ||
        `Act as a ${teachingStyle} tutor for ${subjectName.trim()} (${educationLevel}).`,
      documents: notesContent.trim()
        ? [
            {
              id: `doc-${Date.now()}`,
              title: notesTitle.trim() || 'Uploaded Study Notes',
              content: notesContent.trim(),
              addedAt: new Date().toLocaleDateString(),
            },
          ]
        : [],
    });
    router.replace(`/teachers/${created.id}` as never);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader showBack title="Create AI Teacher" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Choose Avatar</Text>
            <View style={styles.emojiRow}>
              {EMOJIS.map((em) => (
                <AnimatedPressable
                  key={em}
                  onPress={() => setAvatarEmoji(em)}
                  style={[
                    styles.emojiBtn,
                    {
                      backgroundColor: avatarEmoji === em ? colors.surfaceCoralSoft : colors.surfaceMuted,
                      borderColor: avatarEmoji === em ? colors.coral : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{em}</Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Teacher Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Dr. Ada (Further Math Mentor)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.text }]}>Subject / Course</Text>
            <TextInput
              value={subjectName}
              onChangeText={setSubjectName}
              placeholder="e.g., GCE 0775 Further Mathematics"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.text }]}>Education Level</Text>
            <View style={styles.pillRow}>
              {LEVELS.map((l) => (
                <AnimatedPressable
                  key={l}
                  onPress={() => setEducationLevel(l)}
                  style={[
                    styles.pill,
                    { backgroundColor: educationLevel === l ? colors.coral : colors.surfaceMuted },
                  ]}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: educationLevel === l ? '#FFFFFF' : colors.text }}>
                    {l}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Teaching Style</Text>
            <View style={{ gap: 6 }}>
              {STYLES.map((s) => (
                <AnimatedPressable
                  key={s}
                  onPress={() => setTeachingStyle(s)}
                  style={[
                    styles.styleRow,
                    {
                      backgroundColor: teachingStyle === s ? colors.surfacePurpleSoft : colors.surfaceMuted,
                      borderColor: teachingStyle === s ? colors.purple : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: teachingStyle === s ? colors.purple : colors.text }}>
                    {s}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Custom Instructions (Optional)</Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              multiline
              placeholder="e.g., Always quiz me after each explanation and show SI units..."
              placeholderTextColor={colors.textMuted}
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Knowledge Base (Optional Notes / Syllabus)</Text>
            <TextInput
              value={notesTitle}
              onChangeText={setNotesTitle}
              placeholder="Document title (e.g., Chapter 4 Notes)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              value={notesContent}
              onChangeText={setNotesContent}
              multiline
              placeholder="Paste key lecture notes, definitions, or past question excerpts so your teacher grounds answers in your materials..."
              placeholderTextColor={colors.textMuted}
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
            />
          </View>

          <AnimatedPressable
            onPress={handleCreate}
            style={[styles.submitBtn, { backgroundColor: colors.coral }]}
          >
            <Text style={styles.submitText}>Launch My AI Teacher</Text>
          </AnimatedPressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  label: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  styleRow: { padding: 11, borderRadius: 14, borderWidth: 1.5 },
  submitBtn: { paddingVertical: 15, borderRadius: 999, alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
