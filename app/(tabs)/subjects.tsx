import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { BrandHeader } from '@/components/BrandHeader';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme/ThemeContext';
import { useApp } from '@/store/AppContext';
import { HomeCardAssets } from '@/constants/assets';

const LEVEL_FILTERS = ['All Subjects', 'O-Level', 'A-Level', 'University'] as const;

function getSubjectVisual(subjectId: string): {
  bg: ImageSourcePropType;
  gradLight: [string, string];
  gradDark: [string, string];
  badgeIcon: keyof typeof Ionicons.glyphMap;
  artIcon: keyof typeof Ionicons.glyphMap;
  artAccent: string;
} {
  switch (subjectId) {
    case 'math':
      return {
        bg: HomeCardAssets.askMollyBg,
        gradLight: ['rgba(255,255,255,0.92)', 'rgba(253,234,225,0.72)'],
        gradDark: ['rgba(30,36,44,0.9)', 'rgba(54,42,68,0.68)'],
        badgeIcon: 'calculator-outline',
        artIcon: 'calculator',
        artAccent: '#7C3AED',
      };
    case 'english':
      return {
        bg: HomeCardAssets.quizGeneratorBg,
        gradLight: ['rgba(255,255,255,0.92)', 'rgba(255,237,213,0.74)'],
        gradDark: ['rgba(30,36,44,0.9)', 'rgba(66,46,32,0.68)'],
        badgeIcon: 'book-outline',
        artIcon: 'library',
        artAccent: '#EA580C',
      };
    case 'phys':
      return {
        bg: HomeCardAssets.imageAnalyzerBg,
        gradLight: ['rgba(255,255,255,0.92)', 'rgba(219,234,254,0.74)'],
        gradDark: ['rgba(30,36,44,0.9)', 'rgba(30,48,74,0.68)'],
        badgeIcon: 'planet-outline',
        artIcon: 'planet',
        artAccent: '#2563EB',
      };
    case 'chem':
      return {
        bg: HomeCardAssets.bookAnalyzerBg,
        gradLight: ['rgba(255,255,255,0.92)', 'rgba(243,232,255,0.74)'],
        gradDark: ['rgba(30,36,44,0.9)', 'rgba(58,36,74,0.68)'],
        badgeIcon: 'flask-outline',
        artIcon: 'flask',
        artAccent: '#9333EA',
      };
    default:
      return {
        bg: HomeCardAssets.subjectsBg,
        gradLight: ['rgba(255,255,255,0.92)', 'rgba(220,252,231,0.74)'],
        gradDark: ['rgba(30,36,44,0.9)', 'rgba(28,58,44,0.68)'],
        badgeIcon: 'leaf-outline',
        artIcon: 'leaf',
        artAccent: '#16A34A',
      };
  }
}

export default function SubjectsScreen() {
  const { colors, isDark } = useTheme();
  const { subjects, completedLessonIds, addCustomTopic } = useApp();
  const router = useRouter();

  const [levelFilter, setLevelFilter] = useState<(typeof LEVEL_FILTERS)[number]>('All Subjects');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const filteredSubjects = subjects.filter((s) => {
    const levelMatch =
      levelFilter === 'All Subjects' ||
      s.level.toLowerCase().includes(levelFilter.toLowerCase());
    const q = subjectSearch.trim().toLowerCase();
    const textMatch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.code?.toLowerCase().includes(q) ?? false);
    return levelMatch && textMatch;
  });

  const activeSubject = selectedSubjectId
    ? subjects.find((s) => s.id === selectedSubjectId) ?? null
    : null;

  const filteredTopics = (activeSubject?.topics ?? []).filter((t) =>
    t.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleAddTopic = () => {
    if (!customTitle.trim() || !activeSubject) return;
    addCustomTopic(
      activeSubject.id,
      customTitle.trim(),
      customDesc.trim() || 'Custom topic added by student'
    );
    setCustomTitle('');
    setCustomDesc('');
    setCustomModalOpen(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandHeader />

        {!activeSubject ? (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Level Filter Pills (matches Screenshot_20261127_124750_Chrome.jpg) */}
            <View style={styles.levelRow}>
              {LEVEL_FILTERS.map((lvl) => {
                const active = levelFilter === lvl;
                return (
                  <AnimatedPressable
                    key={lvl}
                    onPress={() => setLevelFilter(lvl)}
                    style={[
                      styles.levelPill,
                      {
                        flex: lvl === 'All Subjects' ? 1.25 : 1,
                        backgroundColor: active ? colors.coral : colors.surface,
                        borderColor: active ? colors.coral : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelPillText,
                        { color: active ? '#FFFFFF' : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {lvl}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Quick Subject Search across all 40+ GCE O-Level, A-Level & University subjects */}
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={subjectSearch}
                onChangeText={setSubjectSearch}
                placeholder={`Search ${filteredSubjects.length} subjects or GCE codes...`}
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            {/* Vertical Illustrated Subject Cards (one after another) */}
            <View style={styles.verticalList}>
              {filteredSubjects.map((sub) => {
                const vis = getSubjectVisual(sub.id);
                const totalLessons = sub.topics.reduce((a, t) => a + t.lessons.length, 0);
                const doneLessons = sub.topics.reduce(
                  (a, t) => a + t.lessons.filter((l) => completedLessonIds.includes(l.id)).length,
                  0
                );
                const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

                return (
                  <AnimatedPressable
                    key={sub.id}
                    onPress={() => setSelectedSubjectId(sub.id)}
                    scaleTo={0.98}
                    style={[
                      styles.subjectCard,
                      {
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)',
                        shadowColor: colors.shadowColor,
                      },
                    ]}
                  >
                    <Image source={vis.bg} resizeMode="cover" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                      colors={isDark ? vis.gradDark : vis.gradLight}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />

                    {/* Left Icon Box */}
                    <View
                      style={[
                        styles.leftIconBox,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(255,255,255,0.88)',
                        },
                      ]}
                    >
                      <Ionicons name={vis.badgeIcon} size={22} color={vis.artAccent} />
                    </View>

                    {/* Center Subject Info & Progress */}
                    <View style={styles.subjectCenter}>
                      <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={1}>
                        {sub.name}
                      </Text>
                      <Text style={[styles.subjectMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {sub.code ? `${sub.code} · ` : ''}{sub.topics.length} topics · {totalLessons} lessons
                      </Text>
                      <View style={styles.progressRow}>
                        <View
                          style={[
                            styles.progressTrack,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255,255,255,0.16)'
                                : 'rgba(15,23,42,0.09)',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${pct > 0 ? Math.max(pct, 8) : 0}%`,
                                backgroundColor: colors.brandGreen,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressLabel, { color: colors.text }]}>
                          {pct > 0 ? `${pct}%` : 'Start'}
                        </Text>
                      </View>
                    </View>

                    {/* Right Illustration Emblem + Chevron */}
                    <View style={styles.subjectRight}>
                      <View
                        style={[
                          styles.artBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.12)'
                              : 'rgba(255,255,255,0.72)',
                          },
                        ]}
                      >
                        <Ionicons name={vis.artIcon} size={34} color={vis.artAccent} />
                      </View>
                      <View
                        style={[
                          styles.chevronCircle,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.16)'
                              : 'rgba(255,255,255,0.92)',
                          },
                        ]}
                      >
                        <Ionicons name="chevron-forward" size={16} color={colors.text} />
                      </View>
                    </View>
                  </AnimatedPressable>
                );
              })}

              {/* AI Subject Generator Card at bottom */}
              <AnimatedPressable
                onPress={() => router.push('/tools/subject-generator')}
                style={[
                  styles.aiGenBanner,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.leftIconBox, { backgroundColor: colors.surfaceCoralSoft }]}>
                  <Ionicons name="sparkles" size={22} color={colors.coral} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.subjectName, { color: colors.text, fontSize: 16 }]}>
                    Generate a Custom Subject
                  </Text>
                  <Text style={[styles.subjectMeta, { color: colors.textSecondary }]}>
                    Let Molly build a tailored syllabus for any exam or class
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={colors.coral} />
              </AnimatedPressable>
            </View>
          </ScrollView>
        ) : (
          /* Drill-down View: Topics & Lessons inside Selected Subject */
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.drillHeader}>
              <AnimatedPressable
                onPress={() => {
                  setSelectedSubjectId(null);
                  setSearch('');
                }}
                style={[
                  styles.backPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons name="chevron-back" size={16} color={colors.text} />
                <Text style={[styles.backPillText, { color: colors.text }]}>All Subjects</Text>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => setCustomModalOpen(true)}
                style={[styles.addBtn, { backgroundColor: colors.surfaceMint }]}
              >
                <Ionicons name="add" size={15} color={colors.mintDark} />
                <Text style={[styles.addLink, { color: colors.mintDark }]}>Custom Topic</Text>
              </AnimatedPressable>
            </View>

            <View>
              <Text style={[styles.drillTitle, { color: colors.text }]}>{activeSubject.name}</Text>
              <Text style={[styles.drillSub, { color: colors.textSecondary }]}>
                {activeSubject.level} · {activeSubject.topics.length} topics
              </Text>
            </View>

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
                placeholder={`Search ${activeSubject.name} topics...`}
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            {filteredTopics.map((topic) => {
              const doneCount = topic.lessons.filter((l) =>
                completedLessonIds.includes(l.id)
              ).length;
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
                    <View style={[styles.progressBadge, { backgroundColor: colors.surfaceMint }]}>
                      <Text style={[styles.progressBadgeText, { color: colors.mintDark }]}>
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
                            { backgroundColor: colors.surfaceMuted },
                          ]}
                        >
                          <Ionicons
                            name={done ? 'checkmark-circle' : 'play-circle-outline'}
                            size={20}
                            color={done ? colors.brandGreen : colors.coral}
                          />
                          <Text
                            style={[styles.lessonTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {idx + 1}. {lesson.title}
                          </Text>
                          <Text style={[styles.lessonDur, { color: colors.textMuted }]}>
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
        )}

        {/* Custom Topic Modal */}
        <Modal visible={customModalOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Topic to {activeSubject?.name}
              </Text>
              <TextInput
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholder="Topic title (e.g., Trigonometry)"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                value={customDesc}
                onChangeText={setCustomDesc}
                placeholder="Short description..."
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              />
              <View style={styles.modalActions}>
                <AnimatedPressable
                  onPress={() => setCustomModalOpen(false)}
                  style={[styles.modalBtn, { backgroundColor: colors.surfaceMuted }]}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text }]}>Cancel</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={handleAddTopic}
                  style={[styles.modalBtn, { backgroundColor: colors.coral }]}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Add Topic</Text>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 112, gap: 14 },
  levelRow: { flexDirection: 'row', gap: 7 },
  levelPill: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPillText: { fontSize: 12, fontWeight: '700' },
  verticalList: { gap: 13 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  leftIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  subjectCenter: { flex: 1, gap: 4, zIndex: 2 },
  subjectName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  subjectMeta: { fontSize: 12.5, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: '800' },
  subjectRight: { flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 2 },
  artBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiGenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  backPillText: { fontSize: 13, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addLink: { fontSize: 12.5, fontWeight: '800' },
  drillTitle: { fontSize: 24, fontWeight: '900' },
  drillSub: { fontSize: 13, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  topicCard: { borderRadius: 22, borderWidth: 1, padding: 15, gap: 12 },
  topicTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  topicTitle: { fontSize: 16, fontWeight: '800' },
  topicDesc: { fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  progressBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  progressBadgeText: { fontSize: 12, fontWeight: '800' },
  lessonList: { gap: 8 },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
  },
  lessonTitle: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  lessonDur: { fontSize: 12, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalInput: { borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
});
