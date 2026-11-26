import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';

export default function SubjectsScreen() {
  const { colors } = useTheme();
  const { subjects, completedLessonIds, addCustomTopic } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id ?? 'math');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) ?? subjects[0];
  const filteredTopics = (activeSubject?.topics ?? []).filter((t) =>
    t.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleAddTopic = () => {
    if (!customTitle.trim() || !activeSubject) return;
    addCustomTopic(activeSubject.id, customTitle, customDesc);
    setCustomTitle('');
    setCustomDesc('');
    setCustomModalOpen(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>My Subjects</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                Explore topics, lessons, or add custom class topics
              </Text>
            </View>
            <AnimatedPressable
              onPress={() => router.push('/tools/subject-generator')}
              style={[styles.genBtn, { backgroundColor: colors.surfaceCoralSoft }]}
            >
              <Ionicons name="sparkles" size={14} color={colors.coral} />
              <Text style={[styles.genBtnText, { color: colors.coral }]}>AI Gen</Text>
            </AnimatedPressable>
          </View>

          {/* Search bar */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search topics..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {/* Subject Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
            {subjects.map((sub) => {
              const active = sub.id === activeSubject?.id;
              return (
                <AnimatedPressable
                  key={sub.id}
                  onPress={() => setSelectedSubjectId(sub.id)}
                  style={[
                    styles.subjectChip,
                    {
                      backgroundColor: active ? colors.coral : colors.surface,
                      borderColor: active ? colors.coral : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={sub.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={active ? '#FFFFFF' : sub.color}
                  />
                  <Text
                    style={[
                      styles.subjectChipText,
                      { color: active ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {sub.name}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          {/* Topics & Lessons */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {activeSubject?.name} Topics ({filteredTopics.length})
            </Text>
            <AnimatedPressable onPress={() => setCustomModalOpen(true)}>
              <Text style={[styles.addLink, { color: colors.brandGreen }]}>+ Custom Topic</Text>
            </AnimatedPressable>
          </View>

          {filteredTopics.map((topic) => {
            const doneCount = topic.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
            return (
              <View
                key={topic.id}
                style={[
                  styles.topicCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.topicTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
                    <Text style={[styles.topicDesc, { color: colors.textSecondary }]}>
                      {topic.description}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.surfaceMint }]}>
                    <Text style={[styles.badgeText, { color: colors.mintDark }]}>
                      {doneCount}/{topic.lessons.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.lessonList}>
                  {topic.lessons.map((lesson, idx) => {
                    const done = completedLessonIds.includes(lesson.id);
                    return (
                      <AnimatedPressable
                        key={lesson.id}
                        onPress={() => router.push(`/lesson/${lesson.id}`)}
                        style={[
                          styles.lessonRow,
                          {
                            backgroundColor: colors.surfaceMuted,
                          },
                        ]}
                      >
                        <Ionicons
                          name={done ? 'checkmark-circle' : 'play-circle-outline'}
                          size={20}
                          color={done ? colors.mint : colors.coral}
                        />
                        <Text
                          style={[styles.lessonTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {idx + 1}. {lesson.title}
                        </Text>
                        <Text style={[styles.lessonMeta, { color: colors.textMuted }]}>
                          {lesson.durationMinutes}m
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Add Custom Topic Modal */}
        <Modal visible={customModalOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Custom Topic ({activeSubject?.name})
              </Text>
              <TextInput
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholder="Topic title (e.g., Trigonometry)"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              />
              <TextInput
                value={customDesc}
                onChangeText={setCustomDesc}
                placeholder="Short description (optional)"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              />
              <View style={styles.modalActions}>
                <AnimatedPressable
                  onPress={() => setCustomModalOpen(false)}
                  style={[styles.modalBtn, { backgroundColor: colors.surfaceMuted }]}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handleAddTopic}
                  style={[styles.modalBtn, { backgroundColor: colors.coral }]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Add Topic</Text>
                </AnimatedPressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 112, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 12.5, marginTop: 2 },
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  genBtnText: { fontSize: 12, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  subjectRow: { gap: 8, paddingVertical: 2 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  subjectChipText: { fontSize: 13, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  addLink: { fontSize: 13, fontWeight: '700' },
  topicCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  topicTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  topicTitle: { fontSize: 16, fontWeight: '800' },
  topicDesc: { fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  lessonList: { gap: 8 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  lessonTitle: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  lessonMeta: { fontSize: 12, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { borderRadius: 22, padding: 20, gap: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
});
